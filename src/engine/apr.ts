export interface APRResult {
  min: number;
  max: number;
}

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
      min: 0,
      max: 0,
    };
  }

  const fee =
    amount *
    (processingFeePercent / 100);

  const feeImpact =
    (fee / amount) *
    (12 / tenureMonths) *
    100;

  return {
    min: Number(
      (
        annualRate.min +
        feeImpact
      ).toFixed(2)
    ),

    max: Number(
      (
        annualRate.max +
        feeImpact
      ).toFixed(2)
    ),
  };
}