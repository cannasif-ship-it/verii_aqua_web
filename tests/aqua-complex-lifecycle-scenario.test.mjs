import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBiomassGram,
  calculateIncrementedAverageGram,
} from '../src/features/aqua/shared/batch-math.js';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function keyOf(location, stockCode) {
  return `${location}:${stockCode}`;
}

function clonePositions(map) {
  return Object.fromEntries(
    [...map.entries()].map(([key, value]) => [
      key,
      {
        fishCount: value.fishCount,
        averageGram: round(value.averageGram),
        biomassGram: round(calculateBiomassGram(value.fishCount, value.averageGram)),
      },
    ]),
  );
}

function createState() {
  return {
    openingFishCount: 0,
    openingAverageGram: 0,
    positions: new Map(),
    feedEvents: [],
    mortalityEvents: [],
    shipmentEvents: [],
    movementEvents: [],
  };
}

function getPosition(state, location, stockCode) {
  return state.positions.get(keyOf(location, stockCode)) ?? { fishCount: 0, averageGram: 0 };
}

function setPosition(state, location, stockCode, fishCount, averageGram) {
  const key = keyOf(location, stockCode);

  if (fishCount <= 0) {
    state.positions.delete(key);
    return;
  }

  state.positions.set(key, {
    fishCount,
    averageGram: round(averageGram),
  });
}

function applyOpening(state, { fishCount, averageGram, stockCode }) {
  state.openingFishCount = fishCount;
  state.openingAverageGram = averageGram;
  setPosition(state, 'cage', stockCode, fishCount, averageGram);
  state.movementEvents.push({
    date: '2026-04-01',
    movementTypeName: 'Opening',
    location: 'cage',
    stockCode,
    fromStockCode: null,
    toStockCode: stockCode,
    signedCount: fishCount,
    signedBiomassGram: calculateBiomassGram(fishCount, averageGram),
    fromAverageGram: 0,
    toAverageGram: averageGram,
  });
}

function applyGrowth(state, { stockCode, gramIncrement }) {
  const position = getPosition(state, 'cage', stockCode);
  setPosition(
    state,
    'cage',
    stockCode,
    position.fishCount,
    calculateIncrementedAverageGram(position.averageGram, gramIncrement),
  );
}

function applyFeeding(state, { date, feedKg, feedCostPerKg }) {
  state.feedEvents.push({ date, feedKg, feedCostPerKg });
}

function applyMortality(state, { date, stockCode, fishCount }) {
  const position = getPosition(state, 'cage', stockCode);
  assert.ok(position.fishCount >= fishCount, `not enough ${stockCode} fish for mortality`);

  const mortalityEvent = {
    date,
    stockCode,
    fishCount,
    averageGram: position.averageGram,
    biomassGram: calculateBiomassGram(fishCount, position.averageGram),
  };

  state.mortalityEvents.push(mortalityEvent);
  state.movementEvents.push({
    date,
    movementTypeName: 'Mortality',
    location: 'cage',
    stockCode,
    fromStockCode: stockCode,
    toStockCode: null,
    signedCount: -fishCount,
    signedBiomassGram: -mortalityEvent.biomassGram,
    fromAverageGram: position.averageGram,
    toAverageGram: 0,
  });

  setPosition(state, 'cage', stockCode, position.fishCount - fishCount, position.averageGram);
}

function applyStockChange(state, { fromStockCode, toStockCode, fishCount, targetAverageGram }) {
  const source = getPosition(state, 'cage', fromStockCode);
  const target = getPosition(state, 'cage', toStockCode);
  assert.ok(source.fishCount >= fishCount, `not enough ${fromStockCode} fish for stock change`);
  const sourceBiomassGram = calculateBiomassGram(fishCount, source.averageGram);
  const targetBiomassGram = calculateBiomassGram(fishCount, targetAverageGram);

  setPosition(state, 'cage', fromStockCode, source.fishCount - fishCount, source.averageGram);
  setPosition(
    state,
    'cage',
    toStockCode,
    target.fishCount + fishCount,
    targetAverageGram,
  );

  state.movementEvents.push({
    date: '2026-04-03',
    movementTypeName: 'Stock Convert Out',
    location: 'cage',
    stockCode: fromStockCode,
    fromStockCode,
    toStockCode,
    signedCount: -fishCount,
    signedBiomassGram: -sourceBiomassGram,
    fromAverageGram: source.averageGram,
    toAverageGram: targetAverageGram,
  });
  state.movementEvents.push({
    date: '2026-04-03',
    movementTypeName: 'Stock Convert In',
    location: 'cage',
    stockCode: toStockCode,
    fromStockCode,
    toStockCode,
    signedCount: fishCount,
    signedBiomassGram: targetBiomassGram,
    fromAverageGram: source.averageGram,
    toAverageGram: targetAverageGram,
  });
}

function moveBetweenLocations(state, { fromLocation, toLocation, stockCode, fishCount }) {
  const source = getPosition(state, fromLocation, stockCode);
  const target = getPosition(state, toLocation, stockCode);
  assert.ok(source.fishCount >= fishCount, `not enough ${stockCode} fish in ${fromLocation}`);
  const biomassGram = calculateBiomassGram(fishCount, source.averageGram);

  setPosition(state, fromLocation, stockCode, source.fishCount - fishCount, source.averageGram);
  setPosition(
    state,
    toLocation,
    stockCode,
    target.fishCount + fishCount,
    source.averageGram,
  );

  state.movementEvents.push({
    date: fromLocation === 'cage' ? '2026-04-03' : '2026-04-04',
    movementTypeName: `${fromLocation} to ${toLocation}`,
    location: toLocation,
    stockCode,
    fromStockCode: stockCode,
    toStockCode: stockCode,
    signedCount: fishCount,
    signedBiomassGram: biomassGram,
    fromAverageGram: source.averageGram,
    toAverageGram: source.averageGram,
    fromLocation,
    toLocation,
  });
}

function applyShipment(state, { date, stockCode, fishCount, unitPrice }) {
  const source = getPosition(state, 'cage', stockCode);
  assert.ok(source.fishCount >= fishCount, `not enough ${stockCode} fish for shipment`);

  const shipmentEvent = {
    date,
    stockCode,
    fishCount,
    averageGram: source.averageGram,
    biomassGram: calculateBiomassGram(fishCount, source.averageGram),
    unitPrice,
  };

  state.shipmentEvents.push(shipmentEvent);
  state.movementEvents.push({
    date,
    movementTypeName: 'Shipment',
    location: 'cage',
    stockCode,
    fromStockCode: stockCode,
    toStockCode: null,
    signedCount: -fishCount,
    signedBiomassGram: -shipmentEvent.biomassGram,
    fromAverageGram: source.averageGram,
    toAverageGram: 0,
    unitPrice,
  });

  setPosition(state, 'cage', stockCode, source.fishCount - fishCount, source.averageGram);
}

function sumFish(map, location) {
  return [...map.entries()]
    .filter(([key]) => key.startsWith(`${location}:`))
    .reduce((sum, [, value]) => sum + value.fishCount, 0);
}

function sumBiomassKg(map, location) {
  return round(
    [...map.entries()]
      .filter(([key]) => key.startsWith(`${location}:`))
      .reduce((sum, [, value]) => sum + calculateBiomassGram(value.fishCount, value.averageGram), 0) / 1000,
  );
}

function totalFeedKg(state) {
  return round(state.feedEvents.reduce((sum, event) => sum + event.feedKg, 0));
}

function weightedFeedCostPerKg(state) {
  const totals = state.feedEvents.reduce((sum, event) => {
    sum.kg += event.feedKg;
    sum.amount += event.feedKg * event.feedCostPerKg;
    return sum;
  }, { kg: 0, amount: 0 });

  return totals.kg > 0 ? round(totals.amount / totals.kg) : 0;
}

function weightedShipmentPricePerKg(state) {
  const totals = state.shipmentEvents.reduce((sum, event) => {
    const kg = event.biomassGram / 1000;
    sum.kg += kg;
    sum.amount += kg * event.unitPrice;
    return sum;
  }, { kg: 0, amount: 0 });

  return totals.kg > 0 ? round(totals.amount / totals.kg) : 0;
}

function buildProjectDetailSnapshot(state) {
  const cageFishCount = sumFish(state.positions, 'cage');
  const warehouseFishCount = sumFish(state.positions, 'warehouse');
  const cageBiomassKg = sumBiomassKg(state.positions, 'cage');
  const warehouseBiomassKg = sumBiomassKg(state.positions, 'warehouse');

  return {
    cageFishCount,
    warehouseFishCount,
    totalSystemFishCount: cageFishCount + warehouseFishCount,
    cageBiomassKg,
    warehouseBiomassKg,
    totalSystemBiomassKg: round(cageBiomassKg + warehouseBiomassKg),
    totalDeadCount: state.mortalityEvents.reduce((sum, event) => sum + event.fishCount, 0),
    totalDeadBiomassKg: round(state.mortalityEvents.reduce((sum, event) => sum + event.biomassGram, 0) / 1000),
    totalShipmentFishCount: state.shipmentEvents.reduce((sum, event) => sum + event.fishCount, 0),
    totalShipmentBiomassKg: round(state.shipmentEvents.reduce((sum, event) => sum + event.biomassGram, 0) / 1000),
    totalFeedKg: totalFeedKg(state),
  };
}

function buildDashboardSnapshot(state) {
  const detail = buildProjectDetailSnapshot(state);

  return {
    activeCageCount: 1,
    cageFish: detail.cageFishCount,
    warehouseFish: detail.warehouseFishCount,
    totalSystemFish: detail.totalSystemFishCount,
    totalDead: detail.totalDeadCount,
    totalFeed: detail.totalFeedKg * 1000,
    cageBiomassGram: detail.cageBiomassKg * 1000,
    warehouseBiomassGram: detail.warehouseBiomassKg * 1000,
    totalSystemBiomassGram: detail.totalSystemBiomassKg * 1000,
    cages: [
      {
        projectCageId: 1,
        cageLabel: 'CAGE-1',
        currentFishCount: detail.cageFishCount,
        currentBiomassGram: detail.cageBiomassKg * 1000,
        totalDeadCount: detail.totalDeadCount,
        totalFeedGram: detail.totalFeedKg * 1000,
      },
    ],
  };
}

function buildCageBalanceRows(state) {
  return [...state.positions.entries()]
    .filter(([key]) => key.startsWith('cage:'))
    .map(([key, value]) => ({
      batchCode: key.replace('cage:', ''),
      projectCageCode: 'CAGE-1',
      liveCount: value.fishCount,
      averageGram: round(value.averageGram),
      biomassGram: round(calculateBiomassGram(value.fishCount, value.averageGram)),
      asOfDate: '2026-04-04',
    }))
    .sort((a, b) => a.batchCode.localeCompare(b.batchCode));
}

function buildBatchMovementRows(state) {
  return state.movementEvents.map((event) => ({
    movementDate: event.date,
    movementTypeName: event.movementTypeName,
    batchCode: event.stockCode,
    fromStockName: event.fromStockCode,
    toStockName: event.toStockCode,
    signedCount: event.signedCount,
    signedBiomassGram: round(event.signedBiomassGram),
    fromAverageGram: round(event.fromAverageGram),
    toAverageGram: round(event.toAverageGram),
  }));
}

function buildRawKpiSnapshot(state) {
  const detail = buildProjectDetailSnapshot(state);
  const openingBiomassKg = round(calculateBiomassGram(state.openingFishCount, state.openingAverageGram) / 1000);
  const biomassGainKg = round(detail.cageBiomassKg - openingBiomassKg);

  return {
    stockedFish: state.openingFishCount,
    cageFishCount: detail.cageFishCount,
    warehouseFishCount: detail.warehouseFishCount,
    totalSystemFishCount: detail.totalSystemFishCount,
    currentBiomassKg: detail.cageBiomassKg,
    warehouseBiomassKg: detail.warehouseBiomassKg,
    totalSystemBiomassKg: detail.totalSystemBiomassKg,
    totalFeedKg: detail.totalFeedKg,
    survivalPct: round((detail.cageFishCount / state.openingFishCount) * 100),
    fcr: biomassGainKg > 0 ? round(detail.totalFeedKg / biomassGainKg) : 0,
  };
}

function buildBusinessSnapshot(state) {
  const raw = buildRawKpiSnapshot(state);
  const feedCostPerKg = weightedFeedCostPerKg(state);
  const salePricePerKg = weightedShipmentPricePerKg(state);

  return {
    weightedFeedCostPerKg: feedCostPerKg,
    weightedSalePricePerKg: salePricePerKg,
    estimatedFeedCost: round(raw.totalFeedKg * feedCostPerKg),
    projectedHarvestBiomassKg: raw.currentBiomassKg,
    projectedRevenue: round(raw.currentBiomassKg * salePricePerKg),
    projectedGrossMargin: round((raw.currentBiomassKg * salePricePerKg) - (raw.totalFeedKg * feedCostPerKg)),
  };
}

function buildDevirFcrSnapshot(state) {
  const detail = buildProjectDetailSnapshot(state);
  const openingBiomassKg = round(calculateBiomassGram(state.openingFishCount, state.openingAverageGram) / 1000);
  const mortalityBiomassKg = round(state.mortalityEvents.reduce((sum, event) => sum + event.biomassGram, 0) / 1000);
  const shippedBiomassKg = round(state.shipmentEvents.reduce((sum, event) => sum + event.biomassGram, 0) / 1000);
  const producedBiomassKg = round(detail.cageBiomassKg + shippedBiomassKg + mortalityBiomassKg - openingBiomassKg);

  return {
    openingFishCount: state.openingFishCount,
    shipmentFishCount: detail.totalShipmentFishCount,
    mortalityFishCount: detail.totalDeadCount,
    endingFishCount: detail.cageFishCount,
    openingBiomassKg,
    endingBiomassKg: detail.cageBiomassKg,
    shippedBiomassKg,
    mortalityBiomassKg,
    totalFeedKg: detail.totalFeedKg,
    producedBiomassKg,
    fcr: producedBiomassKg > 0 ? round(detail.totalFeedKg / producedBiomassKg) : 0,
  };
}

test('four-day lifecycle keeps stock change, warehouse loop, split shipment prices and reports aligned', () => {
  const state = createState();

  applyOpening(state, { fishCount: 10_000, averageGram: 5, stockCode: 'PLAMUT-5G' });
  applyFeeding(state, { date: '2026-04-01', feedKg: 20, feedCostPerKg: 58 });
  applyGrowth(state, { stockCode: 'PLAMUT-5G', gramIncrement: 1 });

  assert.deepEqual(clonePositions(state.positions), {
    'cage:PLAMUT-5G': {
      fishCount: 10_000,
      averageGram: 6,
      biomassGram: 60_000,
    },
  });

  applyMortality(state, { date: '2026-04-02', stockCode: 'PLAMUT-5G', fishCount: 100 });
  applyFeeding(state, { date: '2026-04-02', feedKg: 25, feedCostPerKg: 60 });
  applyGrowth(state, { stockCode: 'PLAMUT-5G', gramIncrement: 2 });

  assert.deepEqual(clonePositions(state.positions), {
    'cage:PLAMUT-5G': {
      fishCount: 9_900,
      averageGram: 8,
      biomassGram: 79_200,
    },
  });

  applyFeeding(state, { date: '2026-04-03', feedKg: 35, feedCostPerKg: 64 });
  applyGrowth(state, { stockCode: 'PLAMUT-5G', gramIncrement: 2 });
  applyStockChange(state, {
    fromStockCode: 'PLAMUT-5G',
    toStockCode: 'PLAMUT-10G',
    fishCount: 4_000,
    targetAverageGram: 10,
  });
  moveBetweenLocations(state, {
    fromLocation: 'cage',
    toLocation: 'warehouse',
    stockCode: 'PLAMUT-10G',
    fishCount: 1_500,
  });

  assert.deepEqual(clonePositions(state.positions), {
    'cage:PLAMUT-5G': {
      fishCount: 5_900,
      averageGram: 10,
      biomassGram: 59_000,
    },
    'cage:PLAMUT-10G': {
      fishCount: 2_500,
      averageGram: 10,
      biomassGram: 25_000,
    },
    'warehouse:PLAMUT-10G': {
      fishCount: 1_500,
      averageGram: 10,
      biomassGram: 15_000,
    },
  });

  moveBetweenLocations(state, {
    fromLocation: 'warehouse',
    toLocation: 'cage',
    stockCode: 'PLAMUT-10G',
    fishCount: 500,
  });
  applyFeeding(state, { date: '2026-04-04', feedKg: 18, feedCostPerKg: 66 });
  applyGrowth(state, { stockCode: 'PLAMUT-5G', gramIncrement: 1 });
  applyGrowth(state, { stockCode: 'PLAMUT-10G', gramIncrement: 1 });
  applyShipment(state, { date: '2026-04-04', stockCode: 'PLAMUT-10G', fishCount: 1_000, unitPrice: 210 });
  applyShipment(state, { date: '2026-04-04', stockCode: 'PLAMUT-10G', fishCount: 200, unitPrice: 230 });
  applyMortality(state, { date: '2026-04-04', stockCode: 'PLAMUT-5G', fishCount: 50 });

  assert.deepEqual(clonePositions(state.positions), {
    'cage:PLAMUT-5G': {
      fishCount: 5_850,
      averageGram: 11,
      biomassGram: 64_350,
    },
    'cage:PLAMUT-10G': {
      fishCount: 1_800,
      averageGram: 11,
      biomassGram: 19_800,
    },
    'warehouse:PLAMUT-10G': {
      fishCount: 1_000,
      averageGram: 10,
      biomassGram: 10_000,
    },
  });

  const detail = buildProjectDetailSnapshot(state);
  const dashboard = buildDashboardSnapshot(state);
  const cageBalances = buildCageBalanceRows(state);
  const batchMovements = buildBatchMovementRows(state);
  const raw = buildRawKpiSnapshot(state);
  const business = buildBusinessSnapshot(state);
  const devirFcr = buildDevirFcrSnapshot(state);

  assert.deepEqual(dashboard, {
    activeCageCount: 1,
    cageFish: 7_650,
    warehouseFish: 1_000,
    totalSystemFish: 8_650,
    totalDead: 150,
    totalFeed: 98_000,
    cageBiomassGram: 84_150,
    warehouseBiomassGram: 10_000,
    totalSystemBiomassGram: 94_150,
    cages: [
      {
        projectCageId: 1,
        cageLabel: 'CAGE-1',
        currentFishCount: 7_650,
        currentBiomassGram: 84_150,
        totalDeadCount: 150,
        totalFeedGram: 98_000,
      },
    ],
  });

  assert.deepEqual(detail, {
    cageFishCount: 7_650,
    warehouseFishCount: 1_000,
    totalSystemFishCount: 8_650,
    cageBiomassKg: 84.15,
    warehouseBiomassKg: 10,
    totalSystemBiomassKg: 94.15,
    totalDeadCount: 150,
    totalDeadBiomassKg: 1.15,
    totalShipmentFishCount: 1_200,
    totalShipmentBiomassKg: 13.2,
    totalFeedKg: 98,
  });

  assert.deepEqual(cageBalances, [
    {
      batchCode: 'PLAMUT-10G',
      projectCageCode: 'CAGE-1',
      liveCount: 1_800,
      averageGram: 11,
      biomassGram: 19_800,
      asOfDate: '2026-04-04',
    },
    {
      batchCode: 'PLAMUT-5G',
      projectCageCode: 'CAGE-1',
      liveCount: 5_850,
      averageGram: 11,
      biomassGram: 64_350,
      asOfDate: '2026-04-04',
    },
  ]);

  assert.deepEqual(batchMovements, [
    {
      movementDate: '2026-04-01',
      movementTypeName: 'Opening',
      batchCode: 'PLAMUT-5G',
      fromStockName: null,
      toStockName: 'PLAMUT-5G',
      signedCount: 10_000,
      signedBiomassGram: 50_000,
      fromAverageGram: 0,
      toAverageGram: 5,
    },
    {
      movementDate: '2026-04-02',
      movementTypeName: 'Mortality',
      batchCode: 'PLAMUT-5G',
      fromStockName: 'PLAMUT-5G',
      toStockName: null,
      signedCount: -100,
      signedBiomassGram: -600,
      fromAverageGram: 6,
      toAverageGram: 0,
    },
    {
      movementDate: '2026-04-03',
      movementTypeName: 'Stock Convert Out',
      batchCode: 'PLAMUT-5G',
      fromStockName: 'PLAMUT-5G',
      toStockName: 'PLAMUT-10G',
      signedCount: -4_000,
      signedBiomassGram: -40_000,
      fromAverageGram: 10,
      toAverageGram: 10,
    },
    {
      movementDate: '2026-04-03',
      movementTypeName: 'Stock Convert In',
      batchCode: 'PLAMUT-10G',
      fromStockName: 'PLAMUT-5G',
      toStockName: 'PLAMUT-10G',
      signedCount: 4_000,
      signedBiomassGram: 40_000,
      fromAverageGram: 10,
      toAverageGram: 10,
    },
    {
      movementDate: '2026-04-03',
      movementTypeName: 'cage to warehouse',
      batchCode: 'PLAMUT-10G',
      fromStockName: 'PLAMUT-10G',
      toStockName: 'PLAMUT-10G',
      signedCount: 1_500,
      signedBiomassGram: 15_000,
      fromAverageGram: 10,
      toAverageGram: 10,
    },
    {
      movementDate: '2026-04-04',
      movementTypeName: 'warehouse to cage',
      batchCode: 'PLAMUT-10G',
      fromStockName: 'PLAMUT-10G',
      toStockName: 'PLAMUT-10G',
      signedCount: 500,
      signedBiomassGram: 5_000,
      fromAverageGram: 10,
      toAverageGram: 10,
    },
    {
      movementDate: '2026-04-04',
      movementTypeName: 'Shipment',
      batchCode: 'PLAMUT-10G',
      fromStockName: 'PLAMUT-10G',
      toStockName: null,
      signedCount: -1_000,
      signedBiomassGram: -11_000,
      fromAverageGram: 11,
      toAverageGram: 0,
    },
    {
      movementDate: '2026-04-04',
      movementTypeName: 'Shipment',
      batchCode: 'PLAMUT-10G',
      fromStockName: 'PLAMUT-10G',
      toStockName: null,
      signedCount: -200,
      signedBiomassGram: -2_200,
      fromAverageGram: 11,
      toAverageGram: 0,
    },
    {
      movementDate: '2026-04-04',
      movementTypeName: 'Mortality',
      batchCode: 'PLAMUT-5G',
      fromStockName: 'PLAMUT-5G',
      toStockName: null,
      signedCount: -50,
      signedBiomassGram: -550,
      fromAverageGram: 11,
      toAverageGram: 0,
    },
  ]);

  assert.deepEqual(raw, {
    stockedFish: 10_000,
    cageFishCount: 7_650,
    warehouseFishCount: 1_000,
    totalSystemFishCount: 8_650,
    currentBiomassKg: 84.15,
    warehouseBiomassKg: 10,
    totalSystemBiomassKg: 94.15,
    totalFeedKg: 98,
    survivalPct: 76.5,
    fcr: 2.87,
  });

  assert.deepEqual(business, {
    weightedFeedCostPerKg: 62.122,
    weightedSalePricePerKg: 213.333,
    estimatedFeedCost: 6_087.956,
    projectedHarvestBiomassKg: 84.15,
    projectedRevenue: 17_951.972,
    projectedGrossMargin: 11_864.016,
  });

  assert.deepEqual(devirFcr, {
    openingFishCount: 10_000,
    shipmentFishCount: 1_200,
    mortalityFishCount: 150,
    endingFishCount: 7_650,
    openingBiomassKg: 50,
    endingBiomassKg: 84.15,
    shippedBiomassKg: 13.2,
    mortalityBiomassKg: 1.15,
    totalFeedKg: 98,
    producedBiomassKg: 48.5,
    fcr: 2.021,
  });
});
