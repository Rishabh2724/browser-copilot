import type { Answers } from "./buildProfile";

export interface ValidationResult {
  valid: boolean;
  message?: string;
  severity?: "error" | "warning";
}

export function validateAnswer(
  questionId: string,
  value: string | number | boolean | undefined,
  answers: Answers
): ValidationResult {
  if (
    value === undefined ||
    value === ""
  ) {
    return {
      valid: false,
      severity: "error",
      message: "Please provide an answer to continue.",
    };
  }

  switch (questionId) {
    case "age": {
      const age = Number(value);

      if (!Number.isFinite(age)) {
        return {
          valid: false,
          severity: "error",
          message: "Enter a valid age.",
        };
      }

      if (age < 18) {
        return {
          valid: false,
          severity: "error",
          message:
            "Borrower Copilot is for adults aged 18 or above.",
        };
      }

      if (age > 80) {
        return {
          valid: false,
          severity: "error",
          message:
            "Please enter an age between 18 and 80.",
        };
      }

      return { valid: true };
    }

    case "creditScore": {
      const score = Number(value);

      if (
        !Number.isFinite(score) ||
        score < 300 ||
        score > 900
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Credit score must be between 300 and 900.",
        };
      }

      return { valid: true };
    }

    case "monthlyIncome": {
      const income = Number(value);

      if (
        !Number.isFinite(income) ||
        income <= 0
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Monthly income must be greater than ₹0.",
        };
      }

      const requestedLoan =
        Number(answers.loanAmount ?? 0);

      if (
        requestedLoan > 0 &&
        requestedLoan > income * 100
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            `₹${requestedLoan.toLocaleString(
              "en-IN"
            )} is extremely high relative to monthly income of ₹${income.toLocaleString(
              "en-IN"
            )}. Enter your actual income or loan amount.`,
        };
      }

      return { valid: true };
    }

    case "loanAmount": {
      const amount = Number(value);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Loan amount must be greater than ₹0.",
        };
      }

      return { valid: true };
    }

    case "householdExpenses": {
      const expenses = Number(value);
      const income =
        Number(answers.monthlyIncome ?? 0);

      if (
        !Number.isFinite(expenses) ||
        expenses < 0
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Household expenses cannot be negative.",
        };
      }

      if (
        income > 0 &&
        expenses > income
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Household expenses cannot be higher than the monthly income entered. If your income varies, use your typical monthly income.",
        };
      }

      return { valid: true };
    }

    case "existingEmi": {
      const emi = Number(value);
      const income =
        Number(answers.monthlyIncome ?? 0);

      if (
        !Number.isFinite(emi) ||
        emi < 0
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Existing EMI cannot be negative.",
        };
      }

      if (
        income > 0 &&
        emi > income
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Existing monthly EMIs cannot exceed the monthly income entered.",
        };
      }

      return { valid: true };
    }

    case "emergencySavingsMonths": {
      const months = Number(value);

      if (
        !Number.isFinite(months) ||
        months < 0 ||
        months > 36
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Enter a value between 0 and 36 months.",
        };
      }

      return { valid: true };
    }

    case "pastBounces": {
      if (
        typeof value !== "boolean"
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Please select Yes or No.",
        };
      }

      return { valid: true };
    }

    case "upcomingExpenses": {
      const expenses = Number(value);

      if (
        !Number.isFinite(expenses) ||
        expenses < 0
      ) {
        return {
          valid: false,
          severity: "error",
          message:
            "Upcoming expenses cannot be negative.",
        };
      }

      return { valid: true };
    }

    default:
      return { valid: true };
  }
}