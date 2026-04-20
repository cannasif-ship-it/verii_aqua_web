import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBiomassGram,
  calculateIncrementedAverageGram,
} from '../src/features/aqua/shared/batch-math.js';

function validateTransfer({
  sourceLiveCount,
  requestedFishCount,
  requireFullTransfer,
  targetLiveCount,
  partialTransferOccupiedCageMode,
  sourceBatchId,
  targetBatchId,
}) {
  const fishCount = requireFullTransfer ? sourceLiveCount : requestedFishCount;

  if (fishCount <= 0) return 'no-fish';
  if (fishCount > sourceLiveCount) return 'too-high';
  if (fishCount === sourceLiveCount) return 'ok';

  if (targetLiveCount <= 0) return 'ok';
  if (partialTransferOccupiedCageMode === 0) return 'occupied-not-allowed';
  if (partialTransferOccupiedCageMode === 1 && targetBatchId !== sourceBatchId) {
    return 'only-same-batch';
  }

  return 'ok';
}

function createStockChangeScenario({ fishCount, currentAverageGram, incrementGram }) {
  const newAverageGram = calculateIncrementedAverageGram(currentAverageGram, incrementGram);

  return {
    fishCount,
    currentAverageGram,
    newAverageGram,
    sourceBiomassGram: calculateBiomassGram(fishCount, currentAverageGram),
    targetBiomassGram: calculateBiomassGram(fishCount, newAverageGram),
  };
}

function createShipmentScenario({ fishCount, averageGram, unitPrice }) {
  const biomassGram = calculateBiomassGram(fishCount, averageGram);
  const biomassKg = biomassGram / 1000;

  return {
    fishCount,
    averageGram,
    biomassGram,
    unitPrice,
    revenue: biomassKg * unitPrice,
  };
}

test('full transfer forces whole live stock quantity', () => {
  const result = validateTransfer({
    sourceLiveCount: 1_000,
    requestedFishCount: 400,
    requireFullTransfer: true,
    targetLiveCount: 0,
    partialTransferOccupiedCageMode: 0,
    sourceBatchId: 10,
    targetBatchId: 10,
  });

  assert.equal(result, 'ok');
});

test('partial transfer blocks occupied target cage when mode is closed', () => {
  const result = validateTransfer({
    sourceLiveCount: 1_000,
    requestedFishCount: 400,
    requireFullTransfer: false,
    targetLiveCount: 200,
    partialTransferOccupiedCageMode: 0,
    sourceBatchId: 10,
    targetBatchId: 10,
  });

  assert.equal(result, 'occupied-not-allowed');
});

test('partial transfer allows occupied cage only for same batch when mode is restricted', () => {
  const sameBatch = validateTransfer({
    sourceLiveCount: 1_000,
    requestedFishCount: 400,
    requireFullTransfer: false,
    targetLiveCount: 200,
    partialTransferOccupiedCageMode: 1,
    sourceBatchId: 10,
    targetBatchId: 10,
  });

  const differentBatch = validateTransfer({
    sourceLiveCount: 1_000,
    requestedFishCount: 400,
    requireFullTransfer: false,
    targetLiveCount: 200,
    partialTransferOccupiedCageMode: 1,
    sourceBatchId: 10,
    targetBatchId: 11,
  });

  assert.equal(sameBatch, 'ok');
  assert.equal(differentBatch, 'only-same-batch');
});

test('stock change recalculates biomass using new average gram', () => {
  const scenario = createStockChangeScenario({
    fishCount: 1_000,
    currentAverageGram: 100,
    incrementGram: 25,
  });

  assert.deepEqual(scenario, {
    fishCount: 1_000,
    currentAverageGram: 100,
    newAverageGram: 125,
    sourceBiomassGram: 100_000,
    targetBiomassGram: 125_000,
  });
});

test('shipment defaults to zero commercial revenue when unit price is omitted', () => {
  const scenario = createShipmentScenario({
    fishCount: 200,
    averageGram: 500,
    unitPrice: 0,
  });

  assert.deepEqual(scenario, {
    fishCount: 200,
    averageGram: 500,
    biomassGram: 100_000,
    unitPrice: 0,
    revenue: 0,
  });
});

test('shipment calculates commercial revenue when unit price exists', () => {
  const scenario = createShipmentScenario({
    fishCount: 200,
    averageGram: 500,
    unitPrice: 95,
  });

  assert.deepEqual(scenario, {
    fishCount: 200,
    averageGram: 500,
    biomassGram: 100_000,
    unitPrice: 95,
    revenue: 9_500,
  });
});
