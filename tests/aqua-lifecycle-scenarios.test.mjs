import test from 'node:test';
import assert from 'node:assert/strict';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function buildLifecycleState() {
  const opening = {
    fishCount: 1000,
    averageGram: 100,
  };

  const cageToWarehouse = {
    fishCount: 120,
    averageGram: 400,
  };

  const warehouseToCage = {
    fishCount: 120,
    averageGram: 400,
  };

  const mortality = {
    fishCount: 50,
    averageGram: 200,
  };

  const shipment = {
    fishCount: 200,
    averageGram: 500,
    unitPrice: 95,
  };

  const feeding = {
    totalFeedGram: 300_000,
    feedCostPerKg: 20,
  };

  const ending = {
    cageFishCount:
      opening.fishCount -
      cageToWarehouse.fishCount +
      warehouseToCage.fishCount -
      mortality.fishCount -
      shipment.fishCount,
    cageAverageGram: 400,
    warehouseFishCount: cageToWarehouse.fishCount - warehouseToCage.fishCount,
    warehouseAverageGram: 400,
  };

  return {
    opening,
    cageToWarehouse,
    warehouseToCage,
    mortality,
    shipment,
    feeding,
    ending,
  };
}

function buildProjectDetailSnapshot(state) {
  const cageBiomassGram = state.ending.cageFishCount * state.ending.cageAverageGram;
  const warehouseBiomassGram = state.ending.warehouseFishCount * state.ending.warehouseAverageGram;

  return {
    cageFishCount: state.ending.cageFishCount,
    warehouseFishCount: state.ending.warehouseFishCount,
    totalSystemFishCount: state.ending.cageFishCount + state.ending.warehouseFishCount,
    cageBiomassGram,
    warehouseBiomassGram,
    totalSystemBiomassGram: cageBiomassGram + warehouseBiomassGram,
    totalDeadCount: state.mortality.fishCount,
    totalShipmentFishCount: state.shipment.fishCount,
    totalShipmentBiomassGram: state.shipment.fishCount * state.shipment.averageGram,
    totalFeedGram: state.feeding.totalFeedGram,
  };
}

function buildRawKpiSnapshot(state) {
  const detail = buildProjectDetailSnapshot(state);
  const openingBiomassKg = (state.opening.fishCount * state.opening.averageGram) / 1000;
  const currentBiomassKg = detail.cageBiomassGram / 1000;
  const totalFeedKg = state.feeding.totalFeedGram / 1000;
  const biomassGainKg = currentBiomassKg - openingBiomassKg;

  return {
    stockedFish: state.opening.fishCount,
    cageFishCount: detail.cageFishCount,
    warehouseFishCount: detail.warehouseFishCount,
    totalSystemFishCount: detail.totalSystemFishCount,
    currentBiomassKg: round(currentBiomassKg),
    warehouseBiomassKg: round(detail.warehouseBiomassGram / 1000),
    totalSystemBiomassKg: round(detail.totalSystemBiomassGram / 1000),
    totalFeedKg: round(totalFeedKg),
    survivalPct: round((detail.cageFishCount / state.opening.fishCount) * 100),
    fcr: round(totalFeedKg / biomassGainKg),
  };
}

function buildBusinessSnapshot(state) {
  const raw = buildRawKpiSnapshot(state);
  const projectedHarvestBiomassKg = raw.currentBiomassKg;
  const estimatedFeedCost = round(raw.totalFeedKg * state.feeding.feedCostPerKg);
  const projectedRevenue = round((state.shipment.fishCount * state.shipment.averageGram / 1000) * state.shipment.unitPrice);
  const projectedGrossMargin = round(projectedRevenue - estimatedFeedCost);

  return {
    estimatedFeedCost,
    projectedHarvestBiomassKg,
    projectedRevenue,
    projectedGrossMargin,
  };
}

function buildDevirFcrRow(state) {
  const openingBiomassKg = (state.opening.fishCount * state.opening.averageGram) / 1000;
  const endingBiomassKg = (state.ending.cageFishCount * state.ending.cageAverageGram) / 1000;
  const shippedBiomassKg = (state.shipment.fishCount * state.shipment.averageGram) / 1000;
  const mortalityBiomassKg = (state.mortality.fishCount * state.mortality.averageGram) / 1000;
  const totalFeedKg = state.feeding.totalFeedGram / 1000;
  const producedBiomassKg = endingBiomassKg + shippedBiomassKg + mortalityBiomassKg - openingBiomassKg;

  return {
    openingFishCount: state.opening.fishCount,
    shipmentFishCount: state.shipment.fishCount,
    mortalityFishCount: state.mortality.fishCount,
    endingFishCount: state.ending.cageFishCount,
    openingBiomassKg: round(openingBiomassKg),
    endingBiomassKg: round(endingBiomassKg),
    shippedBiomassKg: round(shippedBiomassKg),
    mortalityBiomassKg: round(mortalityBiomassKg),
    totalFeedKg: round(totalFeedKg),
    producedBiomassKg: round(producedBiomassKg),
    fcr: round(totalFeedKg / producedBiomassKg),
  };
}

test('lifecycle flow keeps project detail, raw KPI, business KPI and devir/FCR aligned', () => {
  const state = buildLifecycleState();

  const detail = buildProjectDetailSnapshot(state);
  const raw = buildRawKpiSnapshot(state);
  const business = buildBusinessSnapshot(state);
  const devirFcr = buildDevirFcrRow(state);

  assert.deepEqual(detail, {
    cageFishCount: 750,
    warehouseFishCount: 0,
    totalSystemFishCount: 750,
    cageBiomassGram: 300000,
    warehouseBiomassGram: 0,
    totalSystemBiomassGram: 300000,
    totalDeadCount: 50,
    totalShipmentFishCount: 200,
    totalShipmentBiomassGram: 100000,
    totalFeedGram: 300000,
  });

  assert.deepEqual(raw, {
    stockedFish: 1000,
    cageFishCount: 750,
    warehouseFishCount: 0,
    totalSystemFishCount: 750,
    currentBiomassKg: 300,
    warehouseBiomassKg: 0,
    totalSystemBiomassKg: 300,
    totalFeedKg: 300,
    survivalPct: 75,
    fcr: 1.5,
  });

  assert.deepEqual(business, {
    estimatedFeedCost: 6000,
    projectedHarvestBiomassKg: 300,
    projectedRevenue: 9500,
    projectedGrossMargin: 3500,
  });

  assert.deepEqual(devirFcr, {
    openingFishCount: 1000,
    shipmentFishCount: 200,
    mortalityFishCount: 50,
    endingFishCount: 750,
    openingBiomassKg: 100,
    endingBiomassKg: 300,
    shippedBiomassKg: 100,
    mortalityBiomassKg: 10,
    totalFeedKg: 300,
    producedBiomassKg: 310,
    fcr: 0.968,
  });
});

test('warehouse split remains visible in project detail and raw KPI when fish stay in warehouse', () => {
  const state = buildLifecycleState();
  state.warehouseToCage.fishCount = 20;
  state.ending.cageFishCount =
    state.opening.fishCount -
    state.cageToWarehouse.fishCount +
    state.warehouseToCage.fishCount -
    state.mortality.fishCount -
    state.shipment.fishCount;
  state.ending.warehouseFishCount = state.cageToWarehouse.fishCount - state.warehouseToCage.fishCount;

  const detail = buildProjectDetailSnapshot(state);
  const raw = buildRawKpiSnapshot(state);

  assert.deepEqual(detail, {
    cageFishCount: 650,
    warehouseFishCount: 100,
    totalSystemFishCount: 750,
    cageBiomassGram: 260000,
    warehouseBiomassGram: 40000,
    totalSystemBiomassGram: 300000,
    totalDeadCount: 50,
    totalShipmentFishCount: 200,
    totalShipmentBiomassGram: 100000,
    totalFeedGram: 300000,
  });

  assert.deepEqual(raw, {
    stockedFish: 1000,
    cageFishCount: 650,
    warehouseFishCount: 100,
    totalSystemFishCount: 750,
    currentBiomassKg: 260,
    warehouseBiomassKg: 40,
    totalSystemBiomassKg: 300,
    totalFeedKg: 300,
    survivalPct: 65,
    fcr: 1.875,
  });
});
