export interface APRResult {
  min: number;
  max: number;
}

/**
 * Approximate all-in annualized cost.
 *
 * This is intentionally labelled an estimate rather than a
 * lender-generated APR. Processing fee is treated as an upfront
 * cost paid by the borrower.
 */
export function calculateAPR(
  amount: number,
  annualRate: {
    min: number;
    max: number;
  },
  processingFeePercent = 0,
  tenureMonths = 48
): APRResult {
  if (amount <= 0) {
    return {
      min: annualRate.min,
      max: annualRate.max,
    };
  }

  const fee =
    amount * (processingFeePercent / 100);

  const feeImpact =
    fee / amount * (12 / tenureMonths) * 100;

  return {
    min: Number(
      (annualRate.min + feeImpact).toFixed(2)
    ),
    max: Number(
      (annualRate.max + feeImpact).toFixed(2)
    ),
  };
}