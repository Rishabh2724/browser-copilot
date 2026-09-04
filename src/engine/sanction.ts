import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateLoanAmountFromEMI } from "./emi";
import { calculateFairRate } from "./rateBand";

export function calculateLenderAmount(
  profile: BorrowerProfile
) {
  const affordability =
    calculateAffordability(profile);

  const rate =
    calculateFairRate(profile);

  const rateMid =
    (rate.fairRate.min +
      rate.fairRate.max) / 2;

  const amounts = [36, 48, 60].map(
    (tenure) =>
      calculateLoanAmountFromEMI(
        affordability.lenderNewEmiCapacity,
        rateMid,
        tenure
      )
  );

  const min = Math.max(
    0,
    Math.min(...amounts)
  );

  const max = Math.max(
    0,
    Math.max(...amounts)
  );

  return {
    min: Math.round(min),
    max: Math.round(max),
  };
}