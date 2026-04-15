import test from 'node:test';
import assert from 'node:assert/strict';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function calculateProjectStockSplit({
  cageFishCount,
  cageBiomassGram,
  warehouseFishCount,
  warehouseBiomassGram,
}) {
  return {
    cageFishCount,
    cageBiomassGram: round(cageBiomassGram),
    warehouseFishCount,
    warehouseBiomassGram: round(warehouseBiomassGram),
    totalSystemFishCount: cageFishCount + warehouseFishCount,
    totalSystemBiomassGram: round(cageBiomassGram + warehouseBiomassGram),
  };
}

function calculateRawKpiSnapshot({
  stockedFish,
  cageFishCount,
  warehouseFishCount,
  deadFish,
  cageBiomassGram,
  warehouseBiomassGram,
  totalFeedKg,
  initialAverageGram,
  currentAverageGram,
  daysInSea,
}) {
  const currentBiomassKg = cageBiomassGram / 1000;
  const warehouseBiomassKg = warehouseBiomassGram / 1000;
  const totalSystemBiomassKg = currentBiomassKg + warehouseBiomassKg;

  return {
    stockedFish,
    cageFishCount,
    warehouseFishCount,
    totalSystemFishCount: cageFishCount + warehouseFishCount,
    deadFish,
    currentBiomassKg: round(currentBiomassKg),
    warehouseBiomassKg: round(warehouseBiomassKg),
    totalSystemBiomassKg: round(totalSystemBiomassKg),
    totalFeedKg: round(totalFeedKg),
    initialAverageGram: round(initialAverageGram),
    currentAverageGram: round(currentAverageGram),
    daysInSea,
  };
}

function calculateDashboardFacilitySummary(projects) {
  return projects.reduce(
    (acc, project) => {
      acc.totalCages += project.activeCageCount;
      acc.totalCageFish += project.cageFishCount;
      acc.totalWarehouseFish += project.warehouseFishCount;
      acc.totalSystemFish += project.totalSystemFishCount;
      acc.totalCageBiomassGram += project.cageBiomassGram;
      acc.totalWarehouseBiomassGram += project.warehouseBiomassGram;
      acc.totalSystemBiomassGram += project.totalSystemBiomassGram;
      acc.totalFeedGram += project.totalFeedGram;
      return acc;
    },
    {
      totalCages: 0,
      totalCageFish: 0,
      totalWarehouseFish: 0,
      totalSystemFish: 0,
      totalCageBiomassGram: 0,
      totalWarehouseBiomassGram: 0,
      totalSystemBiomassGram: 0,
      totalFeedGram: 0,
    }
  );
}

test('project stock split keeps cage, warehouse and total system values consistent', () => {
  const summary = calculateProjectStockSplit({
    cageFishCount: 750,
    cageBiomassGram: 300000,
    warehouseFishCount: 120,
    warehouseBiomassGram: 48000,
  });

  assert.deepEqual(summary, {
    cageFishCount: 750,
    cageBiomassGram: 300000,
    warehouseFishCount: 120,
    warehouseBiomassGram: 48000,
    totalSystemFishCount: 870,
    totalSystemBiomassGram: 348000,
  });
});

test('raw KPI snapshot shows cage stock and warehouse stock separately', () => {
  const rawSnapshot = calculateRawKpiSnapshot({
    stockedFish: 1000,
    cageFishCount: 750,
    warehouseFishCount: 120,
    deadFish: 50,
    cageBiomassGram: 300000,
    warehouseBiomassGram: 48000,
    totalFeedKg: 300,
    initialAverageGram: 100,
    currentAverageGram: 400,
    daysInSea: 120,
  });

  assert.deepEqual(rawSnapshot, {
    stockedFish: 1000,
    cageFishCount: 750,
    warehouseFishCount: 120,
    totalSystemFishCount: 870,
    deadFish: 50,
    currentBiomassKg: 300,
    warehouseBiomassKg: 48,
    totalSystemBiomassKg: 348,
    totalFeedKg: 300,
    initialAverageGram: 100,
    currentAverageGram: 400,
    daysInSea: 120,
  });
});

test('dashboard facility summary aggregates cage and warehouse stocks without losing fish', () => {
  const facility = calculateDashboardFacilitySummary([
    {
      activeCageCount: 4,
      cageFishCount: 750,
      warehouseFishCount: 120,
      totalSystemFishCount: 870,
      cageBiomassGram: 300000,
      warehouseBiomassGram: 48000,
      totalSystemBiomassGram: 348000,
      totalFeedGram: 300000,
    },
    {
      activeCageCount: 2,
      cageFishCount: 420,
      warehouseFishCount: 80,
      totalSystemFishCount: 500,
      cageBiomassGram: 168000,
      warehouseBiomassGram: 32000,
      totalSystemBiomassGram: 200000,
      totalFeedGram: 140000,
    },
  ]);

  assert.deepEqual(facility, {
    totalCages: 6,
    totalCageFish: 1170,
    totalWarehouseFish: 200,
    totalSystemFish: 1370,
    totalCageBiomassGram: 468000,
    totalWarehouseBiomassGram: 80000,
    totalSystemBiomassGram: 548000,
    totalFeedGram: 440000,
  });
});
