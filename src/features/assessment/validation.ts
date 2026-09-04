import type { Answers } from "./buildProfile";

export interface ValidationResult {
  valid: boolean;
  message?: string;
  severity?: "error" | "warning";
}

export function validateAnswer(
  questionId: string,
  value: Answers[string],
  _answers: Answers
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
  const incomeRange =
    typeof value === "object" && value !== null
      ? value
      : undefined;

  const minIncome = Number(
    incomeRange?.min ?? 0
  );

  const maxIncome = Number(
    incomeRange?.max ?? 0
  );

  if (
    !Number.isFinite(minIncome) ||
    minIncome <= 0
  ) {
    return {
      valid: false,
      severity: "error",
      message:
        "Lowest monthly income must be greater than ₹0.",
    };
  }

  if (
    !Number.isFinite(maxIncome) ||
    maxIncome <= 0
  ) {
    return {
      valid: false,
      severity: "error",
      message:
        "Highest monthly income must be greater than ₹0.",
    };
  }

  if (maxIncome < minIncome) {
    return {
      valid: false,
      severity: "error",
      message:
        "Highest monthly income cannot be lower than lowest monthly income.",
    };
  }

  return {
    valid: true,
  };
    }

    case "otherHouseholdIncome": {
      const income = Number(value);

      if (!Number.isFinite(income) || income < 0) {
        return {
          valid: false,
          severity: "error",
          message:
            "Other household income must be ₹0 or more.",
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

      return { valid: true };
    }

    case "existingEmi": {
      const emi = Number(value);

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
