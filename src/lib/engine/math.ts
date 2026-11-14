// Exact integer arithmetic for money. Nothing in the engine multiplies or divides cents in floating point.

const TWO = BigInt(2);

/** A whole, non-negative amount. A credit balance, a fraction of a cent or NaN never reaches the math. */
export function wholeOrZero(amount: number): number {
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

/**
 * a x b / divisor, rounded half up once at the end. BigInt keeps the product exact even when it would
 * not fit in a double. The divisor must be a positive integer.
 */
export function mulDivHalfUp(a: number, b: number, divisor: number): number {
  const d = BigInt(divisor);
  const product = BigInt(wholeOrZero(a)) * BigInt(wholeOrZero(b));
  return Number((product * TWO + d) / (TWO * d));
}
