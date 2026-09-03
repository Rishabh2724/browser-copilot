import type { BorrowerProfile } from "../types/borrower";

const LOAN_TYPES_BY_PURPOSE: Record<
  string,
  BorrowerProfile["loan"]["type"][]
> = {
  vehicle: ["two_wheeler", "personal"],
  home: ["home", "lap"],
  business: ["business", "lap"],
  personal: ["personal", "gold"],
  education: ["personal"],
  debt_repayment: ["personal", "gold", "lap"],
};

export interface ProductFitResult {
  suitable: boolean;
  reason: string;
}

export function assessProductFit(
  profile: BorrowerProfile
): ProductFitResult {
  const purpose = profile.loan.purpose;
  const loanType = profile.loan.type;

  const allowed = LOAN_TYPES_BY_PURPOSE[purpose];

  if (!allowed) {
    return {
      suitable: true,
      reason: "Purpose is not mapped to a specific product restriction.",
    };
  }

  if (allowed.includes(loanType)) {
    return {
      suitable: true,
      reason: "The selected loan type is consistent with the stated purpose.",
    };
  }

  return {
    suitable: false,
    reason:
      "The selected loan type does not match the stated borrowing purpose.",
  };
}