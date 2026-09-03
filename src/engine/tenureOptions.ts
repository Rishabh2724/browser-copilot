import type { BorrowerProfile } from "../types/borrower";
import { calculateFairRate } from "./rateBand";
import { calculateEMI } from "./emi";

export interface TenureOption {
  months: number;
  emi: number;
  totalInterest: number;
}

export function calculateTenureOptions(
  profile: BorrowerProfile,
  amount: number = profile.loan.amountWanted
): TenureOption[] {
  const rate = calculateFairRate(profile);

  const annualRate =
    (rate.fairRate.min + rate.fairRate.max) / 2;

  return [36, 48, 60].map((months) => {
    const emi = calculateEMI(
      amount,
      annualRate,
      months
    );

    const totalInterest =
      Math.max(
        0,
        emi * months - amount
      );

    return {
      months,
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
    };
  });
}