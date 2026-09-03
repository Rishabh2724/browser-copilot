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
  // =====================================================
  // 1. BASIC CONTEXT
  // =====================================================

  {
    id: "age",
    category: "About you",
    text: "How old are you?",
    description:
      "Age helps us apply basic eligibility and repayment assumptions.",
    type: "number",
    required: true,
    min: 18,
    max: 75,
    step: 1,
    affects: ["decision", "sanction", "confidence"],
  },

  // =====================================================
  // 2. PURPOSE
  // =====================================================

  {
    id: "purpose",
    category: "Loan goal",
    text: "What are you considering this loan for?",
    description:
      "Your purpose helps us distinguish productive, essential and discretionary borrowing.",
    type: "select",
    required: true,
    options: [
      {
        label: "Essential expense",
        value: "essential",
      },
      {
        label: "Productive / business use",
        value: "productive",
      },
      {
        label: "Education",
        value: "education",
      },
      {
        label: "Home / property",
        value: "home",
      },
      {
        label: "Vehicle",
        value: "vehicle",
      },
      {
        label: "Personal / lifestyle",
        value: "discretionary",
      },
      {
        label: "Debt repayment",
        value: "debt_repayment",
      },
    ],
    affects: [
      "decision",
      "confidence",
    ],
  },

  // =====================================================
  // 3. LOAN PRODUCT
  // =====================================================

  {
    id: "loanType",
    category: "Loan goal",
    text: "What type of loan are you considering?",
    description:
      "Different loan products have different typical costs, structures and repayment expectations.",
    type: "select",
    required: true,
    options: [
      {
        label: "Personal loan",
        value: "personal",
      },
      {
        label: "Business loan",
        value: "business",
      },
      {
        label: "Loan against property",
        value: "lap",
      },
      {
        label: "Gold loan",
        value: "gold",
      },
      {
        label: "Two-wheeler loan",
        value: "two_wheeler",
      },
      {
        label: "Home loan",
        value: "home",
      },
    ],
    affects: [
      "sanction",
      "safeAmount",
      "rate",
      "emi",
      "confidence",
    ],
  },

  // =====================================================
  // 4. AMOUNT
  // =====================================================

  {
    id: "loanAmount",
    category: "Loan goal",
    text: "How much are you planning to borrow?",
    description:
      "We'll compare your requested amount with both lender-style and conservative repayment capacity.",
    type: "currency",
    required: true,
    min: 10000,
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

  // =====================================================
  // 5. EMPLOYMENT
  // =====================================================

  {
    id: "employmentType",
    category: "Income",
    text: "How do you currently earn your income?",
    description:
      "Income source affects how stable and predictable repayment capacity is.",
    type: "select",
    required: true,
    options: [
      {
        label: "Salaried",
        value: "salaried",
      },
      {
        label: "Self-employed",
        value: "self_employed",
      },
      {
        label: "Informal / variable work",
        value: "informal",
      },
    ],
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "emi",
      "confidence",
    ],
  },

  // =====================================================
  // 6. INCOME
  // =====================================================

  {
    id: "monthlyIncome",
    category: "Income",
    text: "What is your monthly income?",
    description:
      "Use your typical take-home income. If it changes significantly, we'll ask about the variation.",
    type: "currency",
    required: true,
    min: 0,
    max: 10000000,
    step: 1000,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "emi",
      "confidence",
    ],
  },

  // =====================================================
  // 7. INCOME STABILITY
  // =====================================================

  {
    id: "incomeStability",
    category: "Income",
    text: "How predictable is that income?",
    description:
      "More variable income requires a larger safety margin.",
    type: "select",
    required: true,
    options: [
      {
        label: "Stable",
        value: "stable",
      },
      {
        label: "Variable",
        value: "variable",
      },
      {
        label: "Highly variable",
        value: "highly_variable",
      },
    ],
    affects: [
      "decision",
      "safeAmount",
      "rate",
      "confidence",
    ],
  },

  // =====================================================
  // 8. HOUSEHOLD EXPENSES
  // =====================================================

  {
    id: "householdExpenses",
    category: "Affordability",
    text: "How much do you spend on household expenses each month?",
    description:
      "Include rent, food, utilities and other regular household costs.",
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

  // =====================================================
  // 9. EXISTING EMI
  // =====================================================

  {
    id: "existingEmi",
    category: "Existing debt",
    text: "How much do you currently pay toward loans each month?",
    description:
      "Include the EMIs you are already responsible for.",
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
      "confidence",
    ],
  },

  // =====================================================
  // 10. CREDIT SCORE
  // =====================================================

  {
    id: "creditScoreKnown",
    category: "Credit profile",
    text: "Do you know your credit score?",
    description:
      "You don't need to check it. If you don't know it, we'll use a wider rate range.",
    type: "boolean",
    required: true,
    affects: [
      "rate",
      "confidence",
    ],
  },

  {
    id: "creditScore",
    category: "Credit profile",
    text: "What is your credit score?",
    description:
      "Enter your latest known score.",
    type: "number",
    required: false,
    min: 300,
    max: 900,
    step: 1,
    affects: [
      "decision",
      "rate",
      "confidence",
    ],

    /*
     * IMPORTANT:
     * The UI should use the answer to
     * creditScoreKnown to decide visibility.
     */
    showWhen: (profile) =>
      profile.creditScore !== undefined,
  },

  // =====================================================
  // SALARIED
  // =====================================================

  {
    id: "employmentTenureMonths",
    category: "Employment",
    text: "How long have you been with your current employer?",
    type: "number",
    required: false,
    min: 0,
    max: 600,
    step: 1,
    affects: [
      "sanction",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
      "salaried",
  },

  {
    id: "emergencySavingsMonths",
    category: "Financial buffer",
    text: "How many months of expenses could your savings cover?",
    description:
      "A larger emergency buffer gives you more room to handle income shocks.",
    type: "number",
    required: false,
    min: 0,
    max: 36,
    step: 1,
    affects: [
      "decision",
      "safeAmount",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
        "salaried" ||
      profile.employmentType ===
        "informal",
  },

  // =====================================================
  // SELF EMPLOYED
  // =====================================================

  {
    id: "businessYears",
    category: "Business",
    text: "How long has your business been operating?",
    type: "number",
    required: false,
    min: 0,
    max: 100,
    step: 1,
    affects: [
      "sanction",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
      "self_employed",
  },

  {
    id: "annualItrIncome",
    category: "Business",
    text: "What annual income do you report in your ITR?",
    description:
      "This helps us compare stated income with documented income when estimating repayment capacity.",
    type: "currency",
    required: false,
    min: 0,
    max: 100000000,
    step: 10000,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
      "self_employed",
  },

  // =====================================================
  // COLLATERAL
  // =====================================================

  {
    id: "collateralAvailable",
    category: "Security",
    text: "Do you have an asset you could potentially offer as security?",
    description:
      "Examples include property or gold. This does not mean you are eligible for a secured loan.",
    type: "boolean",
    required: false,
    affects: [
      "sanction",
      "rate",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
        "self_employed" ||
      profile.loan?.type === "lap",
  },

  // =====================================================
  // INFORMAL
  // =====================================================

  {
    id: "pastBounces",
    category: "Repayment history",
    text: "Have you had a recent EMI or loan payment bounce?",
    description:
      "A recent missed payment can materially change whether additional borrowing is sensible.",
    type: "boolean",
    required: false,
    affects: [
      "decision",
      "rate",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
      "informal",
  },

  {
    id: "upcomingExpenses",
    category: "Financial buffer",
    text: "Do you have any large expenses coming up?",
    description:
      "Include known expenses that could reduce your ability to handle another EMI.",
    type: "currency",
    required: false,
    min: 0,
    max: 10000000,
    step: 1000,
    affects: [
      "decision",
      "safeAmount",
      "confidence",
    ],

    showWhen: (profile) =>
      profile.employmentType ===
      "informal",
  },
];