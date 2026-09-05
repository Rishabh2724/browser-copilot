export interface Range {
  min: number;
  max: number;
}

export interface SafeAmount {
  min: number;
  max: number;
  affordabilityMax: number;
  collateralMax?: number;
  explanation: string;
}

export type BorrowDecision =
  | "borrow"
  | "borrow_less"
  | "dont_borrow";

export type ConfidenceLevel =
  | "low"
  | "medium"
  | "high";

export interface Reason {
  title: string;
  explanation: string;
}

export interface TenureOption {
  months: number;
  emi: number;
  totalInterest: number;
}

export interface StressTestResult {
  scenario: string;
  baselineEmi: number;
  stressedEmi: number;

  stressedIncome?: number;
  stressedFoIR?: number;

  affordabilityStatus:
    | "safe"
    | "tight"
    | "unsafe";

  explanation: string;
}

export interface NegotiationCard {
  fairRate: Range;
  apr: Range;
  safeEmi: number;
  requestedAmount: number;
  recommendedAmount: number;

  reasons: Reason[];

  lenderQuoteResponse?: string;
}

export interface AssessmentResult {
  decision: BorrowDecision;

  lenderAmount: Range;

  safeAmount: SafeAmount;

  requestedAmount: number;

  recommendedAmount: number;
  
  productFit: {
  suitable: boolean;
  reason: string;
};

  fairRate: Range;

  apr: Range;

  emiCeiling: number;

  tenureOptions: TenureOption[];

  stressTest: StressTestResult;

  confidence: {
    level: ConfidenceLevel;
    score: number;
    reasons: string[];
  };

  reasons: Reason[];

  negotiationCard: NegotiationCard;
}
