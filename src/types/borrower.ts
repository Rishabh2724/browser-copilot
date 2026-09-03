export type EmploymentType =
  | "salaried"
  | "self_employed"
  | "informal";

export type LoanType =
  | "personal"
  | "home"
  | "lap"
  | "gold"
  | "two_wheeler"
  | "business";

export type IncomeStability =
  | "stable"
  | "variable"
  | "highly_variable";

export interface ExistingLoan {
  type: LoanType;
  outstanding: number;
  emi: number;
  interestRate?: number;
  remainingMonths?: number;
}

export interface LoanOffer {
  lender: string;
  interestRate: number;
  processingFee?: number;
  tenureMonths?: number;
}

export interface BorrowerProfile {
  age: number;

  employmentType: EmploymentType;

  monthlyIncome: {
    min: number;
    max: number;
    stability: IncomeStability;
  };

  monthlyHouseholdExpenses: number;

  existingLoans: ExistingLoan[];

  loan: {
    type: LoanType;
    amountWanted: number;
    purpose: string;
  };

  creditScore?: number;

  emergencySavingsMonths?: number;

  collateral?: {
    available: boolean;
    value?: number;
  };

  coApplicant?: {
    available: boolean;
    monthlyIncome?: number;
  };

  upcomingExpenses?: number;

  variableIncomeShare?: number;

  pastBounces?: number;

  offers?: LoanOffer[];
}