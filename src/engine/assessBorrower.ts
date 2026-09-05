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
  
  // 2. Determine the amount we can recommend before
// evaluating the final repayment stress.
const preliminaryRecommendedAmount =
  Math.min(
    profile.loan.amountWanted,
    safeAmount.max
  );

// 3. Calculate tenure options for the amount
// that we would actually recommend.
const preliminaryTenureOptions =
  calculateTenureOptions(
    profile,
    preliminaryRecommendedAmount
  );

// 4. Select the longest tenure that fits within
// the conservative EMI ceiling.
// This gives the borrower more monthly repayment room
// without exceeding the safe EMI capacity.
const preliminaryTenure =
  [...preliminaryTenureOptions]
    .reverse()
    .find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
  preliminaryTenureOptions[
    preliminaryTenureOptions.length - 1
  ];

// 5. Run the stress test using the same
// amount + tenure that the recommendation will use.
const initialStressTest =
  runIncomeStressTest(
    profile,
    calculateEMI(
      preliminaryRecommendedAmount,
      (rate.fairRate.min +
        rate.fairRate.max) / 2,
      preliminaryTenure.months
    )
  );

// 6. Make the borrowing decision using
// affordability, safe amount and stress test.
const decision =
  determineBorrowDecision(
    profile,
    initialStressTest
  );

// 7. Final recommended amount.
// Don't recommend borrowing if the decision is Don't Borrow.
const recommendedAmount =
  decision.decision === "dont_borrow"
    ? 0
    : preliminaryRecommendedAmount;

  const recommendedTenureOptions =
    calculateTenureOptions(
      profile,
      recommendedAmount
    );

  // 6. Select a tenure that fits the conservative EMI ceiling.
  const recommendedTenure =
  [...recommendedTenureOptions]
    .reverse()
    .find(
      (option) =>
        option.emi <=
        affordability.safeNewEmiCapacity
    ) ??
  recommendedTenureOptions[
    recommendedTenureOptions.length - 1
  ];
  // 7. Calculate APR using the recommended amount.
  const apr =
  recommendedAmount > 0
    ? calculateAPR(
        recommendedAmount,
        rate.fairRate,
        getProcessingFee(profile),
        recommendedTenure.months
      )
    : {
        min: 0,
        max: 0,
      };

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
        )} because it considers household income, household expenses and existing EMIs.` +
        (affordability.otherHouseholdIncome > 0
          ? ` Household affordability includes ₹${Math.round(
              affordability.otherHouseholdIncome
            ).toLocaleString(
              "en-IN"
            )}/month of regular household income reported from another household member. This is not assumed to be lender-eligible income unless that person is included as a co-applicant and the lender accepts it.`
          : ""),
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

    requestedAmount:
    profile.loan.amountWanted,

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

      requestedAmount: profile.loan.amountWanted,

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
