import type { BorrowerProfile } from "../types/borrower";
import type { AssessmentResult } from "../types/assessment";

import { calculateAffordability } from "./affordability";
import { calculateLenderAmount } from "./sanction";
import { calculateSafeAmount } from "./safeAmount";
import { calculateFairRate } from "./rateBand";
import { determineBorrowDecision } from "./borrowingDecision";
import { calculateConfidence } from "./confidence";
import { calculateTenureOptions } from "./tenureOptions";
import { calculateAPR } from "./apr";
import { runIncomeStressTest } from "./stressTest";
import { calculateEMI } from "./emi";
import { assessProductFit } from "./productFit";

export function assessBorrower(
  profile: BorrowerProfile
): AssessmentResult {
  // 1. Calculate the core affordability and product-fit inputs.
  const affordability = calculateAffordability(profile);

  const productFit = assessProductFit(profile);

  const lenderAmount = calculateLenderAmount(profile);

  const safeAmount = calculateSafeAmount(profile);

  const rate = calculateFairRate(profile);

  const confidence = calculateConfidence(profile);

  // 2. Calculate tenure options before making the final decision.
  const tenureOptions = calculateTenureOptions(profile);

  const initialTenure =
    tenureOptions.find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
    tenureOptions[tenureOptions.length - 1];

  // 3. Run a preliminary stress test using the requested amount.
  const initialStressTest =
    runIncomeStressTest(
      profile,
      calculateEMI(
        profile.loan.amountWanted,
        (rate.fairRate.min +
          rate.fairRate.max) / 2,
        initialTenure.months
      )
    );

  // 4. Make the borrowing decision using affordability,
  // safe amount and stress-test results.
  const decision =
    determineBorrowDecision(
      profile,
      initialStressTest
    );

  // 5. Determine the amount we actually recommend.
  const recommendedAmount =
    decision.decision === "borrow"
      ? profile.loan.amountWanted
      : Math.min(
          profile.loan.amountWanted,
          safeAmount.max
        );

  const recommendedTenureOptions =
    calculateTenureOptions(
      profile,
      recommendedAmount
    );

  // 6. Select a tenure that fits the conservative EMI ceiling.
  const recommendedTenure =
    recommendedTenureOptions.find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
    recommendedTenureOptions[
      recommendedTenureOptions.length - 1
    ];

  // 7. Calculate APR using the recommended amount.
  const apr =
    calculateAPR(
      recommendedAmount,
      rate.fairRate,
      getProcessingFee(profile),
      recommendedTenure.months
    );

  // 8. Run the final stress test using the amount
  // that we are actually recommending to the borrower.
  const stressTest =
    runIncomeStressTest(
      profile,
      calculateEMI(
        recommendedAmount,
        (rate.fairRate.min +
          rate.fairRate.max) / 2,
        recommendedTenure.months
      )
    );

  // 9. Build explainability reasons for the UI
  // and Negotiation Card.
  const reasons = [
    ...decision.reasons.map((reason) => ({
      title: "Borrowing decision",
      explanation: reason,
    })),

    ...rate.reasons.map((reason) => ({
      title: "Rate adjustment",
      explanation: reason,
    })),

    {
      title: "Safe EMI",
      explanation:
        `The conservative EMI ceiling is approximately ₹${Math.round(
          affordability.safeNewEmiCapacity
        ).toLocaleString(
          "en-IN"
        )} because it considers income, household expenses and existing EMIs.`,
    },

    // Add product-fit explanation only when useful.
    ...(!productFit.suitable
      ? [
          {
            title: "Product fit",
            explanation: productFit.reason,
          },
        ]
      : []),
  ];

  const lenderQuoteResponse =
    buildLenderQuoteResponse(
      decision.decision,
      rate.fairRate,
      apr,
      Math.round(
        affordability.safeNewEmiCapacity
      ),
      recommendedAmount
    );

  return {
    decision: decision.decision,

    lenderAmount,

    safeAmount,

    recommendedAmount,

    fairRate: rate.fairRate,

    apr,

    emiCeiling:
      Math.round(
        affordability.safeNewEmiCapacity
      ),

    tenureOptions: recommendedTenureOptions,

    stressTest,

    confidence,

    reasons,

    // NEW:
    // Expose product-fit reasoning to the results UI.
    productFit,

    negotiationCard: {
      fairRate: rate.fairRate,

      apr,

      safeEmi:
        Math.round(
          affordability.safeNewEmiCapacity
        ),

      recommendedAmount,

      reasons,

      lenderQuoteResponse,
    },
  };
}

function getProcessingFee(
  profile: BorrowerProfile
): number {
  const offer = profile.offers?.[0];

  return offer?.processingFee ?? 0;
}

function buildLenderQuoteResponse(
  decision: AssessmentResult["decision"],
  fairRate: { min: number; max: number },
  apr: { min: number; max: number },
  safeEmi: number,
  recommendedAmount: number
): string {
  const formatMoney = (value: number) =>
    `₹${Math.round(value).toLocaleString("en-IN")}`;

  if (decision === "dont_borrow") {
    return (
      "I am not comfortable taking this loan on these terms. " +
      "Please show me any lower-cost or secured alternatives and the " +
      "full all-in APR before I consider borrowing."
    );
  }

  if (decision === "borrow_less") {
    return (
      `I want to keep the loan around ${formatMoney(
        recommendedAmount
      )} and the new EMI at or below ${formatMoney(
        safeEmi
      )}. Please quote an all-in APR within or below the estimated ` +
      `${apr.min}%–${apr.max}% range, with all mandatory fees disclosed.`
    );
  }

  return (
    `I am comfortable considering around ${formatMoney(
      recommendedAmount
    )}. Please quote an all-in APR around ${apr.min}%–${apr.max}% ` +
    `or better, with the EMI kept at or below ${formatMoney(
      safeEmi
    )} and all mandatory charges disclosed.`
  );
}