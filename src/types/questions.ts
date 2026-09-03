import type { BorrowerProfile } from "./borrower";

export type QuestionType =
  | "number"
  | "currency"
  | "select"
  | "boolean"
  | "range";

export type QuestionImpact =
  | "decision"
  | "sanction"
  | "safeAmount"
  | "rate"
  | "emi"
  | "confidence";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface Question {
  id: string;

  category: string;

  text: string;

  description?: string;

  type: QuestionType;

  required: boolean;
 
  options?: QuestionOption[];
   
  getOptions?: (
  answers: Record<
    string,
    string | number | boolean | undefined
  >
) => QuestionOption[];


  showWhen?: (profile: Partial<BorrowerProfile>) => boolean;

  affects: QuestionImpact[];

  min?: number;

  max?: number;

  step?: number;
}