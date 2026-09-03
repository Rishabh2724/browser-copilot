import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateLoanAmountFromEMI } from "./emi";
import { calculateFairRate } from "./rateBand";

export function calculateSafeAmount(
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
        affordability.safeNewEmiCapacity,
        rateMid,
        tenure
      )
  );

  return {
    min: Math.max(0, Math.min(...amounts)),
    max: Math.max(0, Math.max(...amounts)),
  };
}