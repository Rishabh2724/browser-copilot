import type { Question } from "../../types/questions";

export const questions: Question[] = [
  {
    id: "loan_purpose",
    category: "Loan",
    text: "What do you need the money for?",
    type: "select",
    required: true,
    affects: ["decision", "sanction", "rate"],
    options: [
      {
        label: "Personal expense",
        value: "personal",
      },
      {
        label: "Business",
        value: "business",
      },
      {
        label: "Vehicle",
        value: "vehicle",
      },
      {
        label: "Home",
        value: "home",
      },
      {
        label: "Education",
        value: "education",
      },
      {
        label: "Other",
        value: "other",
      },
    ],
  },

  {
    id: "loan_amount",
    category: "Loan",
    text: "How much do you want to borrow?",
    type: "currency",
    required: true,
    min: 10000,
    step: 5000,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "emi",
    ],
  },

  {
    id: "loan_type",
    category: "Loan",
    text: "What type of loan are you considering?",
    type: "select",
    required: true,
    affects: ["sanction", "rate", "emi"],
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
  },

  {
    id: "employment_type",
    category: "Income",
    text: "How do you earn your income?",
    type: "select",
    required: true,
    affects: [
      "sanction",
      "safeAmount",
      "rate",
      "confidence",
    ],
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
        label: "Informal / gig income",
        value: "informal",
      },
    ],
  },

  {
    id: "monthly_income",
    category: "Income",
    text: "What is your typical monthly income?",
    type: "currency",
    required: true,
    min: 0,
    step: 1000,
    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "emi",
    ],
  },

  {
    id: "income_stability",
    category: "Income",
    text: "How stable is your monthly income?",
    type: "select",
    required: true,
    affects: [
      "decision",
      "safeAmount",
      "rate",
      "confidence",
    ],
    options: [
      {
        label: "Very stable",
        value: "stable",
      },
      {
        label: "Varies somewhat",
        value: "variable",
      },
      {
        label: "Highly variable",
        value: "highly_variable",
      },
    ],
  },

  {
    id: "household_expenses",
    category: "Expenses",
    text: "How much does your household spend each month?",
    type: "currency",
    required: true,
    min: 0,
    step: 1000,
    affects: [
      "decision",
      "safeAmount",
      "emi",
    ],
  },

  {
    id: "existing_emi",
    category: "Debt",
    text: "How much do you currently pay toward loans each month?",
    type: "currency",
    required: true,
    min: 0,
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
    max: 75,
    affects: [
      "sanction",
      "rate",
      "emi",
    ],
  },

  {
    id: "credit_score_known",
    category: "Credit",
    text: "Do you know your credit score?",
    type: "boolean",
    required: true,
    affects: ["rate", "confidence"],
  },
];