export const CREDIT_RATE_ADJUSTMENT = {
  excellent: -1.0,
  good: -0.25,
  fair: 1.0,
  poor: 2.5,
  unknown: 1.5,
} as const;

export function getCreditAdjustment(
  score?: number
): number {
  if (score === undefined) {
    return CREDIT_RATE_ADJUSTMENT.unknown;
  }

  if (score >= 750) {
    return CREDIT_RATE_ADJUSTMENT.excellent;
  }

  if (score >= 700) {
    return CREDIT_RATE_ADJUSTMENT.good;
  }

  if (score >= 650) {
    return CREDIT_RATE_ADJUSTMENT.fair;
  }

  return CREDIT_RATE_ADJUSTMENT.poor;
}