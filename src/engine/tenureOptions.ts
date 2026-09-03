import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateFairRate } from "./rateBand";
import { calculateEMI } from "./emi";

export interface TenureOption {
  months: number;
  emi: number;
  totalInterest: number;
}

export function calculateTenureOptions(
  profile: BorrowerProfile
): TenureOption[] {
  const affordability = calculateAffordability(profile);
  const rate = calculateFairRate(profile);

  const annualRate =
    (rate.fairRate.min + rate.fairRate.max) / 2;

  return [36, 48, 60].map((months) => {
    const emi = calculateEMI(
      profile.loan.amountWanted,
      annualRate,
      months
    );

    const totalInterest =
      Math.max(
        0,
        emi * months - profile.loan.amountWanted
      );

    return {
      months,
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
    };
  });
}