import type { BorrowerProfile } from "../../types/borrower";

export type QuestionType =
  | "currency"
  | "number"
  | "select"
  | "boolean";

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
  min?: number;
  max?: number;
  step?: number;
  affects: (
    | "decision"
    | "sanction"
    | "safeAmount"
    | "rate"
    | "emi"
    | "confidence"
  )[];
  showWhen?: (
    profile: Partial<BorrowerProfile>
  ) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: "purpose",
    category: "Loan",
    text: "What are you borrowing for?",
    description:
      "This helps us understand whether the borrowing is essential, productive, or discretionary.",
    type: "select",
    required: true,
    options: [
      {
        label: "Business / income generation",
        value: "productive",
      },
      {
        label: "Essential personal need",
        value: "essential",
      },
      {
        label: "Discretionary / lifestyle",
        value: "discretionary",
      },
    ],
    affects: ["decision", "confidence"],
  },

  {
    id: "loanAmount",
    category: "Loan",
    text: "How much do you want to borrow?",
    type: "currency",
    required: true,
    min: 10000,
    max: 10000000,
    step: 5000,
    affects: ["decision", "sanction", "safeAmount", "emi"],
  },

  {
    id: "loanType",
    category: "Loan",
    text: "What type of loan are you considering?",
    type: "select",
    required: true,
    options: [
      { label: "Personal loan", value: "personal" },
      { label: "Business loan", value: "business" },
      { label: "Loan against property", value: "lap" },
      { label: "Gold loan", value: "gold" },
      { label: "Two-wheeler loan", value: "two_wheeler" },
      { label: "Home loan", value: "home" },
    ],
    affects: ["sanction", "rate", "decision"],
  },

  {
    id: "employmentType",
    category: "Income",
    text: "How do you earn your income?",
    type: "select",
    required: true,
    options: [
      { label: "Salaried", value: "salaried" },
      { label: "Self-employed / business", value: "self_employed" },
      { label: "Informal / gig / cash income", value: "informal" },
    ],
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "confidence",
    ],
  },

  {
    id: "monthlyIncome",
    category: "Income",
    text: "What is your typical monthly income?",
    description:
      "If it changes month to month, give your usual range rather than your best month.",
    type: "currency",
    required: true,
    min: 1000,
    max: 10000000,
    step: 1000,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "emi",
      "confidence",
    ],
  },

  {
    id: "incomeStability",
    category: "Income",
    text: "How stable is that income?",
    type: "select",
    required: true,
    options: [
      { label: "Very stable", value: "stable" },
      { label: "Some variation", value: "variable" },
      { label: "Highly variable", value: "highly_variable" },
    ],
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "confidence",
    ],
  },

  {
    id: "householdExpenses",
    category: "Affordability",
    text: "How much does your household spend each month?",
    description:
      "Include rent, food, utilities, education and other regular household costs.",
    type: "currency",
    required: true,
    min: 0,
    max: 10000000,
    step: 1000,
    affects: [
      "decision",
      "safeAmount",
      "emi",
      "confidence",
    ],
  },

  {
    id: "existingEmi",
    category: "Debt",
    text: "How much do you currently pay toward EMIs each month?",
    description:
      "Include all existing formal loan EMIs. If you have none, enter ₹0.",
    type: "currency",
    required: true,
    min: 0,
    max: 10000000,
    step: 500,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "emi",
    ],
  },

  {
    id: "age",
    category: "Profile",
    text: "How old are you?",
    type: "number",
    required: true,
    min: 18,
    max: 80,
    step: 1,
    affects: ["confidence"],
  },

  {
    id: "creditScoreKnown",
    category: "Credit",
    text: "Do you know your credit score?",
    type: "boolean",
    required: true,
    affects: ["rate", "confidence"],
  },

  {
    id: "creditScore",
    category: "Credit",
    text: "What is your credit score?",
    description:
      "You can skip this if you don't know it. We will widen the rate range instead of treating unknown as zero.",
    type: "number",
    required: false,
    min: 300,
    max: 900,
    step: 1,
    affects: ["rate", "confidence"],
    showWhen: (profile) =>
  profile.creditScore !== undefined,
  },

  // Salaried follow-up
  {
    id: "employmentTenureMonths",
    category: "Income",
    text: "How long have you been in your current employment?",
    type: "number",
    required: false,
    min: 1,
    max: 600,
    step: 1,
    affects: ["sanction", "confidence"],
    showWhen: (profile) =>
      profile.employmentType === "salaried",
  },

  {
    id: "emergencySavingsMonths",
    category: "Safety",
    text: "How many months of essential expenses could your savings cover?",
    type: "number",
    required: false,
    min: 0,
    max: 36,
    step: 1,
    affects: ["decision", "safeAmount", "confidence"],
    showWhen: (profile) =>
      profile.employmentType === "salaried" ||
      profile.employmentType === "informal",
  },

  // Self-employed follow-up
  {
    id: "businessYears",
    category: "Business",
    text: "How long has your business been operating?",
    type: "number",
    required: false,
    min: 0,
    max: 100,
    step: 1,
    affects: ["sanction", "confidence"],
    showWhen: (profile) =>
      profile.employmentType === "self_employed",
  },

  {
    id: "annualItrIncome",
    category: "Business",
    text: "What annual income is shown in your ITR?",
    type: "currency",
    required: false,
    min: 0,
    max: 100000000,
    step: 10000,
    affects: ["sanction", "confidence"],
    showWhen: (profile) =>
      profile.employmentType === "self_employed",
  },

  {
    id: "collateralAvailable",
    category: "Security",
    text: "Do you have property or another asset that could potentially be offered as security?",
    type: "boolean",
    required: false,
    affects: ["rate", "sanction", "confidence"],
    showWhen: (profile) =>
      profile.employmentType === "self_employed" ||
      profile.loan?.type === "lap",
  },

  // Informal-income follow-up
{
  id: "pastBounces",
  category: "Debt",
  text: "Have any loan or EMI payments bounced recently?",
  description:
    "A recent bounce can materially affect the borrowing assessment.",
  type: "boolean",
  required: false,
  affects: ["decision", "rate", "confidence"],
  showWhen: (profile) =>
    profile.employmentType === "informal",
},

  {
    id: "upcomingExpenses",
    category: "Safety",
    text: "Do you expect any large expenses in the next few months?",
    description:
      "Include known school fees, medical costs, major purchases or other unavoidable expenses.",
    type: "currency",
    required: false,
    min: 0,
    max: 10000000,
    step: 1000,
    affects: ["decision", "safeAmount"],
    showWhen: (profile) =>
      profile.employmentType === "informal",
  },
];