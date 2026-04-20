import test from 'node:test';
import assert from 'node:assert/strict';

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits));
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getLocalMonetaryValue(input) {
  const exchangeRate = toNumber(input.exchangeRate) > 0 ? toNumber(input.exchangeRate) : 1;
  const localUnitPrice = toNumber(input.localUnitPrice) > 0
    ? toNumber(input.localUnitPrice)
    : toNumber(input.unitPrice) * exchangeRate;
  const localLineAmount = toNumber(input.localLineAmount) > 0
    ? toNumber(input.localLineAmount)
    : toNumber(input.lineAmount) > 0
      ? toNumber(input.lineAmount) * exchangeRate
      : 0;

  return { localUnitPrice, localLineAmount };
}

function calculateWeightedSalePricePerKg(lines) {
  const totals = lines.reduce((sum, line) => {
    const kg = Math.max(0, toNumber(line.biomassGram) / 1000);
    if (kg <= 0) return sum;

    const { localLineAmount, localUnitPrice } = getLocalMonetaryValue(line);
    const amount = localLineAmount > 0 ? localLineAmount : localUnitPrice * kg;
    if (amount <= 0) return sum;

    sum.kg += kg;
    sum.amount += amount;
    return sum;
  }, { kg: 0, amount: 0 });

  return totals.kg > 0 ? round(totals.amount / totals.kg) : 0;
}

function calculateFeedFallbackCostPerKg(lines, strategy) {
  const pricedLines = lines
    .map((line) => {
      const quantityKg = Math.max(0, toNumber(line.totalGram) / 1000);
      const { localLineAmount, localUnitPrice } = getLocalMonetaryValue(line);
      const unitCost = localLineAmount > 0 && quantityKg > 0
        ? localLineAmount / quantityKg
        : localUnitPrice > 0
          ? localUnitPrice
          : 0;

      return { ...line, quantityKg, localLineAmount, unitCost };
    })
    .filter((line) => line.quantityKg > 0 && line.unitCost > 0);

  if (pricedLines.length === 0) return 0;

  if (strategy === 'last') {
    return round([...pricedLines].sort((a, b) => b.id - a.id)[0].unitCost);
  }

  if (strategy === 'fifo') {
    return round([...pricedLines].sort((a, b) => a.id - b.id)[0].unitCost);
  }

  const totals = pricedLines.reduce((sum, line) => {
    sum.quantityKg += line.quantityKg;
    sum.amount += line.unitCost * line.quantityKg;
    return sum;
  }, { quantityKg: 0, amount: 0 });

  return totals.quantityKg > 0 ? round(totals.amount / totals.quantityKg) : 0;
}

function calculateProjectedBusinessKpi({
  totalFeedKg,
  feedCostPerKg,
  projectedHarvestBiomassKg,
  salePricePerKg,
}) {
  const estimatedFeedCost = round(totalFeedKg * Math.max(0, feedCostPerKg));
  const projectedRevenue = round(projectedHarvestBiomassKg * Math.max(0, salePricePerKg));
  const projectedGrossMargin = round(projectedRevenue - estimatedFeedCost);

  return {
    estimatedFeedCost,
    projectedRevenue,
    projectedGrossMargin,
  };
}

test('weighted shipment sale price uses all priced lines by biomass', () => {
  const salePricePerKg = calculateWeightedSalePricePerKg([
    { biomassGram: 100_000, unitPrice: 90, exchangeRate: 1 },
    { biomassGram: 50_000, unitPrice: 120, exchangeRate: 1 },
  ]);

  assert.equal(salePricePerKg, 100);
});

test('shipment sale price falls back to local line amount when unit price is missing', () => {
  const salePricePerKg = calculateWeightedSalePricePerKg([
    { biomassGram: 80_000, localLineAmount: 8_800 },
    { biomassGram: 20_000, localLineAmount: 2_400 },
  ]);

  assert.equal(salePricePerKg, 112);
});

test('shipment lines with zero price keep business sale price at zero', () => {
  const salePricePerKg = calculateWeightedSalePricePerKg([
    { biomassGram: 100_000, unitPrice: 0, exchangeRate: 1 },
    { biomassGram: 25_000, localLineAmount: 0 },
  ]);

  assert.equal(salePricePerKg, 0);
});

test('business KPI revenue and gross margin stay zero when shipment price history is missing', () => {
  const kpi = calculateProjectedBusinessKpi({
    totalFeedKg: 300,
    feedCostPerKg: 60,
    projectedHarvestBiomassKg: 330,
    salePricePerKg: 0,
  });

  assert.deepEqual(kpi, {
    estimatedFeedCost: 18_000,
    projectedRevenue: 0,
    projectedGrossMargin: -18_000,
  });
});

test('feed fallback average strategy returns weighted average cost per kg', () => {
  const costPerKg = calculateFeedFallbackCostPerKg([
    { id: 1, totalGram: 1_000_000, localLineAmount: 50_000 },
    { id: 2, totalGram: 500_000, localLineAmount: 32_500 },
  ], 'average');

  assert.equal(costPerKg, 55);
});

test('feed fallback last purchase strategy returns newest priced line cost', () => {
  const costPerKg = calculateFeedFallbackCostPerKg([
    { id: 10, totalGram: 1_000_000, localLineAmount: 50_000 },
    { id: 11, totalGram: 500_000, localLineAmount: 32_500 },
  ], 'last');

  assert.equal(costPerKg, 65);
});

test('feed fallback fifo strategy returns oldest priced line cost', () => {
  const costPerKg = calculateFeedFallbackCostPerKg([
    { id: 10, totalGram: 1_000_000, localLineAmount: 50_000 },
    { id: 11, totalGram: 500_000, localLineAmount: 32_500 },
  ], 'fifo');

  assert.equal(costPerKg, 50);
});
