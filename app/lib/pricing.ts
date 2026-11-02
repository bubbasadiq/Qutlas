export type PricingInput = {
  quantity: string;
  unit: string;
  pricingUnit: string;
  materialCostMinorPerUnit: string;
  wastageBps: number;
  processingMinorPerUnit: string;
  labourMinorPerUnit: string;
  setupMinor: string;
  marginBps: number;
  taxBps: number;
  minimumQuantity?: string;
  minimumJobMinor?: string;
};

export type PriceCalculation = {
  quantity: string;
  unit: string;
  materialCostMinor: string;
  wastageMinor: string;
  processingMinor: string;
  labourMinor: string;
  setupMinor: string;
  productionCostMinor: string;
  marginMinor: string;
  taxMinor: string;
  subtotalMinor: string;
  totalMinor: string;
};

const QUANTITY_SCALE = 1_000_000n;
const RATE_SCALE = 10_000n;

export function quantityToMicros(value: string, field = 'Quantity') {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) throw new Error(`${field} must be a non-negative decimal with at most six places.`);
  return BigInt(match[1]) * QUANTITY_SCALE + BigInt((match[2] ?? '').padEnd(6, '0') || '0');
}

function parseMinor(value: string, field: string) {
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new Error(`${field} must be a non-negative integer in minor currency units.`);
  return BigInt(value);
}

function validateBasisPoints(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 100_000) {
    throw new Error(`${field} must be an integer between 0 and 100000 basis points.`);
  }
  return BigInt(value);
}

function ceilDivide(numerator: bigint, denominator: bigint) {
  return numerator === 0n ? 0n : (numerator + denominator - 1n) / denominator;
}

function scaledCost(rateMinor: bigint, quantityMicros: bigint) {
  return ceilDivide(rateMinor * quantityMicros, QUANTITY_SCALE);
}

export function calculatePrice(input: PricingInput): PriceCalculation {
  if (!input.unit || input.unit !== input.pricingUnit) {
    throw new Error('Requested unit does not match the approved pricing unit.');
  }

  const quantityMicros = quantityToMicros(input.quantity);
  if (quantityMicros <= 0n) throw new Error('Quantity must be greater than zero.');

  if (input.minimumQuantity !== undefined) {
    const minimumMicros = quantityToMicros(input.minimumQuantity, 'Minimum quantity');
    if (quantityMicros < minimumMicros) throw new Error('Quantity is below the minimum order quantity.');
  }

  const materialCost = scaledCost(parseMinor(input.materialCostMinorPerUnit, 'Material cost'), quantityMicros);
  const wastageBps = validateBasisPoints(input.wastageBps, 'Wastage');
  const wastage = ceilDivide(materialCost * wastageBps, RATE_SCALE);
  const processing = scaledCost(parseMinor(input.processingMinorPerUnit, 'Processing rate'), quantityMicros);
  const labour = scaledCost(parseMinor(input.labourMinorPerUnit, 'Labour rate'), quantityMicros);
  const setup = parseMinor(input.setupMinor, 'Setup charge');
  const productionCost = materialCost + wastage + processing + labour + setup;
  const minimumJob = parseMinor(input.minimumJobMinor ?? '0', 'Minimum job charge');
  const chargeableCost = productionCost < minimumJob ? minimumJob : productionCost;
  const marginBps = validateBasisPoints(input.marginBps, 'Margin');
  const taxBps = validateBasisPoints(input.taxBps, 'Tax');
  const margin = ceilDivide(chargeableCost * marginBps, RATE_SCALE);
  const subtotal = chargeableCost + margin;
  const tax = ceilDivide(subtotal * taxBps, RATE_SCALE);

  return {
    quantity: input.quantity,
    unit: input.unit,
    materialCostMinor: materialCost.toString(),
    wastageMinor: wastage.toString(),
    processingMinor: processing.toString(),
    labourMinor: labour.toString(),
    setupMinor: setup.toString(),
    productionCostMinor: chargeableCost.toString(),
    marginMinor: margin.toString(),
    taxMinor: tax.toString(),
    subtotalMinor: subtotal.toString(),
    totalMinor: (subtotal + tax).toString(),
  };
}