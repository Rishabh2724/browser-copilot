export const AFFORDABILITY_RULES = {
  // Maximum total EMI / income used for a lender-style estimate.
  lenderFoIR: {
    salaried: 0.50,
    self_employed: 0.45,
    informal: 0.40,
  },

  // More conservative borrower-safe ceiling.
  safeFoIR: {
    salaried: 0.40,
    self_employed: 0.35,
    informal: 0.30,
  },

  // Additional buffer for variable income.
  incomeHaircut: {
    stable: 1.00,
    variable: 0.85,
    highly_variable: 0.70,
  },
} as const;


export const RISK_RULES = {
  highDebtRatio: 0.50,

  // If existing debt already consumes this much of
  // normalized income, new borrowing becomes difficult.
  existingDebtWarning: 0.30,

  criticalExistingDebt: 0.40,

  recentBouncePenalty: true,
} as const;


export const CREDIT_RULES = {
  excellent: 750,
  good: 700,
  fair: 650,
} as const;


export const CONFIDENCE_RULES = {
  low: 0.50,
  medium: 0.75,
  high: 0.90,
} as const;


export const STRESS_RULES = {
  incomeDrop: 0.20,
  rateIncrease: 0.02,
} as const;