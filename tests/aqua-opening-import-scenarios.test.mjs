import test from 'node:test';
import assert from 'node:assert/strict';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function resolveBatchCode(projectCode, batchCode) {
  return batchCode && String(batchCode).trim().length > 0 ? String(batchCode).trim() : `OPEN-${projectCode}`;
}

function calculateOpeningNetFish({
  openingGoodsReceipts,
  openingMortalities,
  openingShipments,
}) {
  const receiptFish = openingGoodsReceipts.reduce((sum, row) => sum + Number(row.fishCount ?? 0), 0);
  const deadFish = openingMortalities.reduce((sum, row) => sum + Number(row.deadCount ?? 0), 0);
  const shippedFish = openingShipments.reduce((sum, row) => sum + Number(row.fishCount ?? 0), 0);

  return receiptFish - deadFish - shippedFish;
}

function calculateOpeningFeedKpi({
  totalFeedGram,
  openingFishCount,
  currentFishCount,
  initialAverageGram,
  currentAverageGram,
}) {
  const feedKg = Number(totalFeedGram) / 1000;
  const openingBiomassKg = (openingFishCount * initialAverageGram) / 1000;
  const currentBiomassKg = (currentFishCount * currentAverageGram) / 1000;
  const biomassGainKg = currentBiomassKg - openingBiomassKg;

  return {
    totalFeedKg: round(feedKg),
    biomassGainKg: round(biomassGainKg),
    fcr: biomassGainKg > 0 ? round(feedKg / biomassGainKg) : 0,
  };
}

function calculateImportedShipmentPriceHistory(lines) {
  const totals = lines.reduce((sum, line) => {
    const biomassKg = Number(line.biomassGram ?? 0) / 1000;
    const price = Number(line.unitPrice ?? 0);
    if (biomassKg <= 0 || price <= 0) return sum;

    sum.kg += biomassKg;
    sum.amount += biomassKg * price;
    return sum;
  }, { kg: 0, amount: 0 });

  return totals.kg > 0 ? round(totals.amount / totals.kg) : 0;
}

test('opening import auto-generates batch code when excel leaves it blank', () => {
  assert.equal(resolveBatchCode('PRJ-001', ''), 'OPEN-PRJ-001');
  assert.equal(resolveBatchCode('PRJ-001', '  '), 'OPEN-PRJ-001');
  assert.equal(resolveBatchCode('PRJ-001', 'BATCH-A'), 'BATCH-A');
});

test('opening import net fish reflects receipts minus mortalities minus shipments', () => {
  const netFish = calculateOpeningNetFish({
    openingGoodsReceipts: [
      { fishCount: 1_000 },
      { fishCount: 500 },
    ],
    openingMortalities: [
      { deadCount: 50 },
      { deadCount: 20 },
    ],
    openingShipments: [
      { fishCount: 100 },
      { fishCount: 130 },
    ],
  });

  assert.equal(netFish, 1_200);
});

test('opening import feed history produces a stable starting FCR baseline', () => {
  const kpi = calculateOpeningFeedKpi({
    totalFeedGram: 300_000,
    openingFishCount: 1_000,
    currentFishCount: 750,
    initialAverageGram: 100,
    currentAverageGram: 400,
  });

  assert.deepEqual(kpi, {
    totalFeedKg: 300,
    biomassGainKg: 200,
    fcr: 1.5,
  });
});

test('opening shipment history supports multiple rows with different prices', () => {
  const averagePrice = calculateImportedShipmentPriceHistory([
    { biomassGram: 100_000, unitPrice: 90 },
    { biomassGram: 50_000, unitPrice: 120 },
    { biomassGram: 25_000, unitPrice: 80 },
  ]);

  assert.equal(averagePrice, 97.143);
});
