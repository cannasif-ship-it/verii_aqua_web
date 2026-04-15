import test from 'node:test';
import assert from 'node:assert/strict';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function calculateTurnoverFcrScenario({
  openingFishCount,
  openingAverageGram,
  mortalityFishCount,
  mortalityAverageGram,
  shipmentFishCount,
  shipmentAverageGram,
  endingFishCount,
  endingAverageGram,
  totalFeedKg,
}) {
  const openingBiomassKg = openingFishCount * openingAverageGram / 1000;
  const mortalityBiomassKg = mortalityFishCount * mortalityAverageGram / 1000;
  const shippedBiomassKg = shipmentFishCount * shipmentAverageGram / 1000;
  const endingBiomassKg = endingFishCount * endingAverageGram / 1000;
  const producedBiomassKg = endingBiomassKg + shippedBiomassKg + mortalityBiomassKg - openingBiomassKg;
  const mortalityPct = openingFishCount > 0 ? mortalityFishCount / openingFishCount * 100 : 0;
  const fcr = producedBiomassKg > 0 ? totalFeedKg / producedBiomassKg : 0;

  return {
    openingFishCount,
    openingBiomassKg: round(openingBiomassKg),
    shipmentFishCount,
    shippedBiomassKg: round(shippedBiomassKg),
    mortalityFishCount,
    mortalityBiomassKg: round(mortalityBiomassKg),
    mortalityPct: round(mortalityPct),
    endingFishCount,
    endingAverageGram,
    endingBiomassKg: round(endingBiomassKg),
    totalFeedKg: round(totalFeedKg),
    producedBiomassKg: round(producedBiomassKg),
    fcr: round(fcr),
  };
}

function calculateBusinessSnapshot({
  totalFeedKg,
  feedCostPerKg,
  projectedHarvestBiomassKg,
  salePricePerKg,
}) {
  const estimatedFeedCost = totalFeedKg * feedCostPerKg;
  const projectedRevenue = projectedHarvestBiomassKg * salePricePerKg;
  const projectedGrossMargin = projectedRevenue - estimatedFeedCost;

  return {
    estimatedFeedCost: round(estimatedFeedCost),
    projectedRevenue: round(projectedRevenue),
    projectedGrossMargin: round(projectedGrossMargin),
  };
}

test('turnover and FCR scenario matches expected operational outputs', () => {
  const scenario = calculateTurnoverFcrScenario({
    openingFishCount: 1000,
    openingAverageGram: 100,
    mortalityFishCount: 50,
    mortalityAverageGram: 200,
    shipmentFishCount: 200,
    shipmentAverageGram: 500,
    endingFishCount: 750,
    endingAverageGram: 400,
    totalFeedKg: 300,
  });

  assert.deepEqual(scenario, {
    openingFishCount: 1000,
    openingBiomassKg: 100,
    shipmentFishCount: 200,
    shippedBiomassKg: 100,
    mortalityFishCount: 50,
    mortalityBiomassKg: 10,
    mortalityPct: 5,
    endingFishCount: 750,
    endingAverageGram: 400,
    endingBiomassKg: 300,
    totalFeedKg: 300,
    producedBiomassKg: 310,
    fcr: 0.968,
  });
});

test('business KPI snapshot matches priced feed and shipment scenario', () => {
  const turnoverScenario = calculateTurnoverFcrScenario({
    openingFishCount: 1000,
    openingAverageGram: 100,
    mortalityFishCount: 50,
    mortalityAverageGram: 200,
    shipmentFishCount: 200,
    shipmentAverageGram: 500,
    endingFishCount: 750,
    endingAverageGram: 400,
    totalFeedKg: 300,
  });

  const business = calculateBusinessSnapshot({
    totalFeedKg: turnoverScenario.totalFeedKg,
    feedCostPerKg: 60,
    projectedHarvestBiomassKg: 330,
    salePricePerKg: 95,
  });

  assert.deepEqual(business, {
    estimatedFeedCost: 18000,
    projectedRevenue: 31350,
    projectedGrossMargin: 13350,
  });
});
