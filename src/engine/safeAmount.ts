import type { BorrowerProfile } from "../types/borrower";
import { calculateAffordability } from "./affordability";
import { calculateLoanAmountFromEMI } from "./emi";
import { calculateFairRate } from "./rateBand";

const SECURED_LTV: Partial<
  Record<BorrowerProfile["loan"]["type"], number>
> = {
  lap: 0.60,
  gold: 0.70,
};

export interface SafeAmountResult {
  min: number;
  max: number;
  affordabilityMax: number;
  collateralMax?: number;
  explanation: string;
}

export function calculateSafeAmount(
  profile: BorrowerProfile
): SafeAmountResult {
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

  const affordabilityMax =
    Math.max(
      0,
      ...amounts
    );

  const ltv =
    SECURED_LTV[profile.loan.type];

  const collateralValue =
    profile.collateral?.value;

  const hasCollateral =
    profile.collateral?.available === true &&
    collateralValue !== undefined &&
    collateralValue > 0;

  const collateralMax =
    ltv !== undefined && hasCollateral
      ? collateralValue! * ltv
      : undefined;

  const max =
    collateralMax !== undefined
      ? Math.min(
          affordabilityMax,
          collateralMax
        )
      : affordabilityMax;

  const min =
    Math.min(
      profile.loan.amountWanted,
      max
    );

  let explanation =
    "This amount is constrained by conservative EMI capacity.";

  if (collateralMax !== undefined) {
    explanation =
      `This amount is constrained by both conservative EMI capacity and the assumed ${
        ltv! * 100
      }% collateral-to-loan limit for the selected secured product.`;
  }

  return {
    min: Math.max(0, Math.round(min)),
    max: Math.max(0, Math.round(max)),
    affordabilityMax: Math.max(
      0,
      Math.round(affordabilityMax)
    ),
    collateralMax:
      collateralMax !== undefined
        ? Math.max(
            0,
            Math.round(collateralMax)
          )
        : undefined,
    explanation,
  };
}