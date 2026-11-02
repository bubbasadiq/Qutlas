import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePrice } from '../app/lib/pricing.ts';

test('calculates material, wastage, processing, labour, margin and tax in minor units', () => {
  const result = calculatePrice({
    quantity: '2',
    unit: 'piece',
    pricingUnit: 'piece',
    materialCostMinorPerUnit: '10000',
    wastageBps: 1000,
    processingMinorPerUnit: '500',
    labourMinorPerUnit: '250',
    setupMinor: '500',
    marginBps: 2000,
    taxBps: 750,
  });

  assert.deepEqual(result, {
    quantity: '2',
    unit: 'piece',
    materialCostMinor: '20000',
    wastageMinor: '2000',
    processingMinor: '1000',
    labourMinor: '500',
    setupMinor: '500',
    productionCostMinor: '24000',
    marginMinor: '4800',
    taxMinor: '2160',
    subtotalMinor: '28800',
    totalMinor: '30960',
  });
});

test('uses upward rounding for fractional minor-unit calculations', () => {
  const result = calculatePrice({
    quantity: '0.000001',
    unit: 'metre',
    pricingUnit: 'metre',
    materialCostMinorPerUnit: '3',
    wastageBps: 0,
    processingMinorPerUnit: '0',
    labourMinorPerUnit: '0',
    setupMinor: '0',
    marginBps: 0,
    taxBps: 0,
  });

  assert.equal(result.materialCostMinor, '1');
  assert.equal(result.totalMinor, '1');
});

test('applies the minimum job charge before margin and tax', () => {
  const result = calculatePrice({
    quantity: '1',
    unit: 'job',
    pricingUnit: 'job',
    materialCostMinorPerUnit: '100',
    wastageBps: 0,
    processingMinorPerUnit: '0',
    labourMinorPerUnit: '0',
    setupMinor: '0',
    marginBps: 1000,
    taxBps: 0,
    minimumJobMinor: '1000',
  });

  assert.equal(result.productionCostMinor, '1000');
  assert.equal(result.totalMinor, '1100');
});

test('rejects unit mismatch, invalid quantities and below-minimum quantities', () => {
  const input = {
    quantity: '1',
    unit: 'piece',
    pricingUnit: 'piece',
    materialCostMinorPerUnit: '100',
    wastageBps: 0,
    processingMinorPerUnit: '0',
    labourMinorPerUnit: '0',
    setupMinor: '0',
    marginBps: 0,
    taxBps: 0,
  };

  assert.throws(() => calculatePrice({ ...input, unit: 'metre' }), /does not match/);
  assert.throws(() => calculatePrice({ ...input, quantity: '-1' }), /Quantity/);
  assert.throws(() => calculatePrice({ ...input, quantity: '1', minimumQuantity: '2' }), /minimum order/);
  assert.throws(() => calculatePrice({ ...input, materialCostMinorPerUnit: '1.5' }), /minor currency units/);
});