import { useMemo, useState } from "react";

import { assessBorrower } from "../../engine/assessBorrower";
import type { AssessmentResult } from "../../types/assessment";

import { validateAnswer } from "./validation";
import { getVisibleQuestions } from "./getNextQuestion";
import type { Question } from "./questions";

import {
  buildBorrowerProfile,
  type Answers,
} from "./buildProfile";

import { QuestionCard } from "./QuestionCard";

type AnswerValue =
  | string
  | number
  | boolean
  | undefined;

export function AssessmentFlow() {
  const [answers, setAnswers] =
    useState<Answers>({});

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [result, setResult] =
    useState<AssessmentResult | null>(null);

  /*
   * Questions are recalculated whenever an answer changes.
   *
   * This is important because some questions are conditional.
   */
  const visibleQuestions = useMemo(() => {
  const questions =
    getVisibleQuestions(answers);

  /*
   * Security questions are product-dependent.
   *
   * Remove the old collateral question from
   * its generic position because it will be
   * inserted immediately after loanType.
   */
  const withoutOldCollateral =
    questions.filter(
      (question) =>
        question.id !==
        "collateralAvailable"
    );

  const loanTypeIndex =
    withoutOldCollateral.findIndex(
      (question) =>
        question.id === "loanType"
    );

  if (loanTypeIndex === -1) {
    return withoutOldCollateral;
  }

  const loanType =
    String(
      answers.loanType ?? ""
    );

  /*
   * Only secured products need this
   * additional branch.
   */
  if (
    loanType !== "lap" &&
    loanType !== "gold"
  ) {
    return withoutOldCollateral;
  }

  const securityQuestion: Question = {
    id: "collateralAvailable",

    category: "Security",

    text:
      loanType === "lap"
        ? "Do you own property you could potentially offer as security?"
        : "Do you have gold you could potentially pledge as security?",

    description:
      loanType === "lap"
        ? "Loan Against Property requires eligible property that can potentially be offered as collateral. This does not guarantee eligibility."
        : "A gold loan requires eligible gold that can potentially be pledged. This does not guarantee eligibility.",

    type: "boolean",

    required: true,

    affects: [
      "decision",
      "sanction",
      "safeAmount",
      "rate",
      "confidence",
    ],
  };

  const collateralValueQuestion:
    Question = {
      id: "collateralValue",

      category: "Security",

      text:
        loanType === "lap"
          ? "What is the approximate market value of that property?"
          : "What is the approximate current value of the gold you could pledge?",

      description:
        "Use your best estimate. Actual lender valuation and eligible loan-to-value limits may differ.",

      type: "currency",

      required: true,

      min: 10000,

      max: 100000000,

      step: 10000,

      affects: [
        "sanction",
        "safeAmount",
        "rate",
        "confidence",
      ],

      showWhen: (profile) =>
        profile.collateral
          ?.available === true,
    };

  return [
    ...withoutOldCollateral.slice(
      0,
      loanTypeIndex + 1
    ),

    securityQuestion,

    ...(answers.collateralAvailable ===
    true
      ? [collateralValueQuestion]
      : []),

    ...withoutOldCollateral.slice(
      loanTypeIndex + 1
    ),
  ];
}, [answers]);
  /*
   * Keep the current index inside the currently visible
   * question list.
   *
   * This prevents the UI from pointing at a question that
   * disappeared after an earlier answer changed.
   */
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(
      visibleQuestions.length - 1,
      0
    )
  );

  const currentQuestion:
    | Question
    | undefined =
    visibleQuestions[safeCurrentIndex];

  const currentQuestionText =
    currentQuestion
      ? typeof currentQuestion.text === "function"
        ? currentQuestion.text(answers)
        : currentQuestion.text
      : "";

  const currentValue =
    currentQuestion
      ? answers[currentQuestion.id]
      : undefined;

  const progress =
    visibleQuestions.length === 0
      ? 0
      : Math.round(
          ((safeCurrentIndex + 1) /
            visibleQuestions.length) *
            100
        );

  /*
   * Do not use a truthy check.
   *
   * 0 is a valid financial answer.
   */
  const canContinue =
    currentValue !== undefined &&
    currentValue !== "";

  /*
   * Build the borrower profile from the latest answers.
   *
   * This is useful for conditional questions, but we must
   * NOT use this stale profile for the final submission.
   */


  /*
   * ---------------------------------------------------------
   * HARD STOP: NO REMAINING CASH FLOW
   * ---------------------------------------------------------
   *
   * If:
   *
   * income - household expenses - existing EMI <= 0
   *
   * there is no conservative capacity for another EMI.
   *
   * We stop immediately after the existing-EMI question.
   */
  const shouldStopForNoCashFlow = (
    nextAnswers: Answers
  ): boolean => {
    const income = Number(
      nextAnswers.monthlyIncome ?? 0
    );

    const expenses = Number(
      nextAnswers.householdExpenses ?? 0
    );

    const existingEmi = Number(
      nextAnswers.existingEmi ?? 0
    );

    const hasIncome =
      nextAnswers.monthlyIncome !==
        undefined &&
      income > 0;

    const hasExpenses =
      nextAnswers.householdExpenses !==
      undefined;

    const hasExistingEmi =
      nextAnswers.existingEmi !==
      undefined;

    /*
     * Do not stop before all three inputs exist.
     */
    if (
      !hasIncome ||
      !hasExpenses ||
      !hasExistingEmi
    ) {
      return false;
    }

    return (
      income -
        expenses -
        existingEmi <=
      0
    );
  };

  /*
   * ---------------------------------------------------------
   * ANSWER UPDATE
   * ---------------------------------------------------------
   *
   * We also clear dependent answers when their parent answer
   * changes.
   *
   * Example:
   *
   * Vehicle
   *   -> Two-wheeler loan
   *
   * user goes back and changes:
   *
   * Home
   *
   * The old two_wheeler selection must disappear.
   */
  const updateAnswer = (
    value: AnswerValue
  ) => {
    if (!currentQuestion) {
      return;
    }

    const questionId =
      currentQuestion.id;

    const validation =
      validateAnswer(
        questionId,
        value,
        answers
      );

    if (
      !validation.valid &&
      validation.severity ===
        "error"
    ) {
      setValidationError(
        validation.message ??
          "Invalid answer."
      );
    } else {
      setValidationError(null);
    }

    setAnswers((previous) => {
      const nextAnswers: Answers = {
        ...previous,
        [questionId]: value,
      };

      /*
       * PURPOSE changed
       * ----------------
       *
       * loanType depends on purpose.
       *
       * Example:
       * Vehicle -> two_wheeler
       * Home    -> home
       *
       * Never allow the previous product to survive
       * after the purpose changes.
       */
      if (questionId === "purpose") {
        delete nextAnswers.loanType;
      }

      /*
       * CREDIT SCORE KNOWN changed to NO
       * --------------------------------
       *
       * There is no reason to retain an old score.
       */
      if (
        questionId ===
          "creditScoreKnown" &&
        value === false
      ) {
        delete nextAnswers.creditScore;
      }

      return nextAnswers;
    });
  };

  /*
   * ---------------------------------------------------------
   * NEXT
   * ---------------------------------------------------------
   */
  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    /*
     * Required-answer check.
     */
    if (!canContinue) {
      setValidationError(
        "Please provide an answer to continue."
      );

      return;
    }

    /*
     * Validate the current answer.
     */
    const validation =
      validateAnswer(
        currentQuestion.id,
        currentValue,
        answers
      );

    if (!validation.valid) {
      setValidationError(
        validation.message ??
          "Please correct your answer."
      );

      return;
    }

    setValidationError(null);

    /*
     * IMPORTANT:
     *
     * React state updates are asynchronous.
     *
     * Therefore answers may still contain the previous
     * value here.
     *
     * Always use nextAnswers for calculations that happen
     * immediately after pressing Continue.
     */
    const nextAnswers: Answers = {
      ...answers,
      [currentQuestion.id]:
        currentValue,
    };

    /*
 * -------------------------------------------------------
 * SECURED PRODUCT COMPATIBILITY
 * -------------------------------------------------------
 */

if (
  currentQuestion.id ===
    "collateralAvailable" &&
  currentValue === false
) {
  setAnswers(nextAnswers);

  setValidationError(
    "This secured loan is not currently a fit because the required security is unavailable."
  );

  return;
}
    /*
     * -------------------------------------------------------
     * HARD STOP
     * -------------------------------------------------------
     */
    if (
      shouldStopForNoCashFlow(
        nextAnswers
      )
    ) {
      const stoppedProfile =
        buildBorrowerProfile(
          nextAnswers
        );

      const assessment =
        assessBorrower(
          stoppedProfile
        );

      /*
       * Store the latest answers as well.
       */
      setAnswers(nextAnswers);

      setResult(assessment);

      return;
    }

    /*
     * -------------------------------------------------------
     * QUESTIONNAIRE COMPLETE
     * -------------------------------------------------------
     *
     * THIS FIXES THE SERIOUS BUG.
     *
     * Previously this used:
     *
     *   assessBorrower(profile)
     *
     * where profile was derived from stale answers.
     *
     * We now build the profile from nextAnswers.
     */
    if (
      safeCurrentIndex >=
      visibleQuestions.length - 1
    ) {
      const finalProfile =
        buildBorrowerProfile(
          nextAnswers
        );

      const assessment =
        assessBorrower(
          finalProfile
        );

      setAnswers(nextAnswers);
      setResult(assessment);

      return;
    }

    /*
     * Save the latest answer before moving forward.
     */
    setAnswers(nextAnswers);

    setCurrentIndex(
      (index) => index + 1
    );
  };

  /*
   * ---------------------------------------------------------
   * BACK
   * ---------------------------------------------------------
   */
  const handleBack = () => {
    if (safeCurrentIndex <= 0) {
      return;
    }

    setValidationError(null);

    setCurrentIndex(
      (index) => index - 1
    );
  };

  /*
   * ---------------------------------------------------------
   * RESTART
   * ---------------------------------------------------------
   */
  const restart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setValidationError(null);
    setResult(null);
  };

  /*
   * Safety guard.
   */
  if (!currentQuestion && !result) {
    return null;
  }

  /*
   * Results screen.
   */
  if (result) {
    return (
      <AssessmentResults
        result={result}
        onRestart={restart}
      />
    );
  }

  return (
    <main className="assessment-page">
      <div className="assessment-container">

        {/* BRAND */}
        <header className="assessment-header">
          <div className="brand-row">
            <div className="brand-mark">
              BC
            </div>

            <div>
              <div className="brand-name">
                Borrower Copilot
              </div>

              <div className="brand-caption">
                Borrowing decision assistant
              </div>
            </div>
          </div>

          <div className="assessment-intro">
            <div className="assessment-kicker">
              BORROWING ASSESSMENT
            </div>

            <h1>
              Know what you can afford
              before you borrow.
            </h1>

            <p>
              Answer a few questions about
              your income, expenses and
              borrowing goal. We'll estimate
              a safer borrowing range and EMI.
            </p>
          </div>
        </header>

        {/* PROGRESS */}
        <div className="progress-section">
          <div className="progress-meta">
            <span>
              Question{" "}
              {safeCurrentIndex + 1} of{" "}
              {visibleQuestions.length}
            </span>

            <span>
              {progress}%
            </span>
          </div>

          <div
            className="progress-track"
            aria-label={`Assessment progress: ${progress}%`}
          >
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION */}
        <section className="question-panel">

          <div className="question-header">
            <div className="question-category">
              {currentQuestion.category}
            </div>

        <h2>
        {currentQuestionText}
        </h2>
            {currentQuestion.description && (
              <p>
                {currentQuestion.description}
              </p>
            )}
          </div>

          <QuestionCard
            question={
              currentQuestion
            }
            value={currentValue}
            options={
              currentQuestion
                .getOptions?.(
                  answers
                ) ??
              currentQuestion.options
            }
            onChange={
              updateAnswer
            }
          />

          {validationError && (
            <div className="validation-error">
              <strong>
                Check your answer
              </strong>

              <span>
                {validationError}
              </span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="question-actions">

            <button
              type="button"
              onClick={
                handleBack
              }
              disabled={
                safeCurrentIndex === 0
              }
              className="back-button"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={
                !canContinue
              }
              onClick={
                handleNext
              }
              className="continue-button"
            >
              {safeCurrentIndex ===
              visibleQuestions.length - 1
                ? "See my assessment"
                : "Continue →"}
            </button>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="assessment-footer">
          <span>
            Private by design
          </span>

          <span>•</span>

          <span>
            No bureau pull
          </span>

          <span>•</span>

          <span>
            No login
          </span>

          <span>•</span>

          <span>
            No personal data stored
          </span>
        </footer>

      </div>
    </main>
  );
}

/* =========================================================
   RESULTS
   ========================================================= */

function AssessmentResults({
  result,
  onRestart,
}: {
  result: AssessmentResult;
  onRestart: () => void;
}) {
  const formatMoney = (value: number) =>
    `₹${Math.round(value).toLocaleString(
      "en-IN"
    )}`;

  const decisionLabel = {
    borrow: "BORROW",
    borrow_less: "BORROW LESS",
    dont_borrow: "DON'T BORROW",
  }[result.decision];

  const isDontBorrow =
    result.decision === "dont_borrow";

  const isBorrowLess =
    result.decision === "borrow_less";

  return (
    <main className="results-page">
      <div className="results-container">

        {/* =================================================
            HEADER
           ================================================= */}

        <header className="results-header">
          <div className="results-eyebrow">
            BORROWER COPILOT
          </div>

          <h1 className="results-title">
            Your borrowing assessment
          </h1>

          <p className="results-subtitle">
            A conservative estimate based on
            the information you provided.
            This is not a lender approval.
          </p>
        </header>

        {/* =================================================
            DECISION
           ================================================= */}

        <section
          className={`result-card result-card-${result.decision}`}
        >
          <div className="result-card-inner">

            <div className="results-eyebrow">
              YOUR DECISION
            </div>

            <h2 className="results-decision">
              {decisionLabel}
            </h2>

            <div className="decision-reasons">
              {result.reasons
                .slice(0, 3)
                .map((reason, index) => (
                  <p key={index}>
                    <strong>
                      {reason.title}:
                    </strong>{" "}
                    {reason.explanation}
                  </p>
                ))}
            </div>

          </div>
        </section>

        {/* =================================================
            DON'T BORROW
           ================================================= */}

        {isDontBorrow ? (
          <section className="avoid-borrowing-card">

            <div className="avoid-borrowing-eyebrow">
              WHY WE ARE STOPPING HERE
            </div>

            <h2>
              Taking another loan is not
              comfortably affordable right now.
            </h2>

            <p className="avoid-borrowing-lead">
              Your existing household costs and
              debt leave no conservative room
              for another EMI.
            </p>

            <div className="avoid-borrowing-grid">

              <div className="avoid-borrowing-metric">
                <span>
                  Safe new EMI
                </span>

                <strong>
                  {formatMoney(
                    result.emiCeiling
                  )}
                </strong>

                <p>
                  This is the maximum new EMI
                  we consider conservative based
                  on your current cash flow.
                </p>
              </div>

              <div className="avoid-borrowing-metric">
                <span>
                  Borrower-safe amount
                </span>

                <strong>
                  {formatMoney(
                    result.safeAmount.max
                  )}
                </strong>

                <p>
                  This is the upper end of the
                  amount we consider affordable
                  under the current assumptions.
                </p>
              </div>

            </div>

            <div className="avoid-borrowing-note">
              <strong>
                What could change this?
              </strong>

              <p>
                Reducing existing debt or
                household expenses, increasing
                stable income, or waiting until
                your cash flow improves could
                change the assessment.
              </p>
            </div>

          </section>
        ) : (
          <>
            {/* =============================================
                BORROW / BORROW LESS METRICS
               ============================================= */}

            <div className="metric-grid">

              <MetricCard
                label="Amount you asked for"
                value={formatMoney(
                  result.recommendedAmount ===
                    0
                    ? result.safeAmount.max
                    : result.recommendedAmount
                )}
                explanation={
                  isBorrowLess
                    ? "This is compared against the conservative amount we believe your current cash flow can support."
                    : "This is the amount used for the borrowing recommendation."
                }
              />

              <MetricCard
                label="Borrower-safe range"
                value={`${formatMoney(
                  result.safeAmount.min
                )} – ${formatMoney(
                  result.safeAmount.max
                )}`}
                explanation="This range is intentionally more conservative than a lender-style estimate and leaves room for household costs and existing debt."
              />

              <MetricCard
                label="Safe new EMI"
                value={formatMoney(
                  result.emiCeiling
                )}
                explanation="This is the conservative ceiling for a new EMI after considering income, household expenses and existing EMIs."
              />

              <MetricCard
                label="Fair interest rate"
                value={`${result.fairRate.min}% – ${result.fairRate.max}%`}
                explanation="This is an indicative rate band based on the product type and borrower risk information available."
              />

              <MetricCard
                label="Estimated all-in APR"
                value={`${result.apr.min}% – ${result.apr.max}%`}
                explanation="APR is shown as an all-in comparison measure and should be checked against the lender's disclosed fees and charges."
              />

              <MetricCard
                label="Confidence"
                value={`${result.confidence.level.toUpperCase()} · ${Math.round(
                  result.confidence.score * 100
                )}%`}
                explanation={
                  result.confidence.reasons[0] ??
                  "Confidence reflects how complete and reliable the information provided was."
                }
              />

            </div>

            {/* =============================================
                BORROW LESS EXPLANATION
               ============================================= */}

            {isBorrowLess && (
              <section className="borrow-less-card">

                <div className="results-eyebrow">
                  WHY BORROW LESS?
                </div>

                <h2>
                  The amount you requested is
                  higher than the safer range.
                </h2>

                <div className="borrow-less-comparison">

                  <div>
                    <span>
                      Your requested amount
                    </span>

                    <strong>
                      {formatMoney(
                        result.lenderAmount.max >
                          result.safeAmount.max
                          ? result.recommendedAmount
                          : result.safeAmount.max
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Conservative maximum
                    </span>

                    <strong>
                      {formatMoney(
                        result.safeAmount.max
                      )}
                    </strong>
                  </div>

                </div>

                <p>
                  Keeping the loan closer to the
                  safer amount reduces the chance
                  that the new EMI crowds out
                  essential household spending or
                  leaves you vulnerable to an income
                  shock.
                </p>

              </section>
            )}

            {/* =============================================
                PRODUCT FIT
               ============================================= */}

            {!result.productFit.suitable && (
              <section className="product-fit-card">

                <div className="results-eyebrow">
                  PRODUCT FIT
                </div>

                <h2>
                  Consider a different loan
                  structure.
                </h2>

                <p>
                  {result.productFit.reason}
                </p>

              </section>
            )}

            {/* =============================================
                TENURE OPTIONS
               ============================================= */}

            <section className="tenure-card">

              <div className="results-eyebrow">
                TENURE OPTIONS
              </div>

              <h2>
                Choose the repayment period
                carefully.
              </h2>

              <p className="section-description">
                A longer tenure can reduce the
                monthly EMI but usually increases
                total interest paid.
              </p>

              <div className="tenure-options">

                {result.tenureOptions.map(
                  (option) => (
                    <div
                      key={option.months}
                      className="tenure-option"
                    >
                      <div>
                        <strong>
                          {option.months}
                          {" "}
                          months
                        </strong>

                        <span>
                          {formatMoney(
                            option.emi
                          )} / month
                        </span>
                      </div>

                      <div className="tenure-interest">
                        Total interest
                        <strong>
                          {formatMoney(
                            option.totalInterest
                          )}
                        </strong>
                      </div>
                    </div>
                  )
                )}

              </div>

            </section>

            {/* =============================================
                STRESS TEST
               ============================================= */}

            <section className="stress-test-card">

              <div className="results-eyebrow">
                STRESS TEST
              </div>

              <div className="stress-test-header">

                <div>
                  <h2>
                    What if income falls 20%?
                  </h2>

                  <p>
                    We test whether the proposed
                    EMI remains manageable after
                    an income shock.
                  </p>
                </div>

                <span
                  className={`stress-status stress-${result.stressTest.affordabilityStatus}`}
                >
                  {result.stressTest.affordabilityStatus.toUpperCase()}
                </span>

              </div>

              <div className="stress-test-metrics">

                <div>
                  <span>
                    Current EMI
                  </span>

                  <strong>
                    {formatMoney(
                      result.stressTest.baselineEmi
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Stressed EMI
                  </span>

                  <strong>
                    {formatMoney(
                      result.stressTest.stressedEmi
                    )}
                  </strong>
                </div>

              </div>

              <p className="stress-explanation">
                {result.stressTest.explanation}
              </p>

            </section>

            {/* =============================================
                NEGOTIATION CARD
               ============================================= */}

            <section className="negotiation-card">

              <div className="results-eyebrow">
                NEGOTIATION CARD
              </div>

              <h2>
                What to ask the lender for
              </h2>

              <p className="section-description">
                Use these as negotiation targets,
                not guaranteed lender terms.
              </p>

              <div className="negotiation-grid">

                <div>
                  <span>
                    Target amount
                  </span>

                  <strong>
                    {formatMoney(
                      result.negotiationCard
                        .recommendedAmount
                    )}
                  </strong>

                  <small>
                    Keeps the borrowing target
                    aligned with your conservative
                    affordability range.
                  </small>
                </div>

                <div>
                  <span>
                    Target EMI
                  </span>

                  <strong>
                    ≤{" "}
                    {formatMoney(
                      result.negotiationCard
                        .safeEmi
                    )}
                  </strong>

                  <small>
                    This is the conservative new
                    EMI ceiling.
                  </small>
                </div>

                <div>
                  <span>
                    Fair rate
                  </span>

                  <strong>
                    {
                      result.negotiationCard
                        .fairRate.min
                    }
                    % –{" "}
                    {
                      result.negotiationCard
                        .fairRate.max
                    }%
                  </strong>

                  <small>
                    Indicative range based on the
                    borrower profile and product.
                  </small>
                </div>

                <div>
                  <span>
                    Target APR
                  </span>

                  <strong>
                    ≤{" "}
                    {
                      result.negotiationCard
                        .apr.max
                    }%
                  </strong>

                  <small>
                    Ask for the complete all-in
                    APR and mandatory charges.
                  </small>
                </div>

              </div>

              <div className="negotiation-quote">
                <div className="results-eyebrow">
                  WHAT TO SAY
                </div>

                <p>
                  "{result.negotiationCard
                    .lenderQuoteResponse}"
                </p>
              </div>

            </section>
          </>
        )}

        {/* =================================================
            LIMITATIONS
           ================================================= */}

        <section className="results-disclaimer">

          <div className="results-eyebrow">
            IMPORTANT
          </div>

          <p>
            This assessment uses the information
            you provided and documented rules.
            It does not verify income, credit
            bureau data, lender policies or
            collateral value. Actual eligibility,
            pricing and approval can differ.
          </p>

        </section>

        {/* =================================================
            RESTART
           ================================================= */}

        <div className="results-actions">

          <button
            type="button"
            className="restart-button"
            onClick={onRestart}
          >
            Start another assessment
          </button>

        </div>

      </div>
    </main>
  );
}
/* =========================================================
   METRIC CARD
   ========================================================= */

function MetricCard({
  label,
  value,
  explanation,
}: {
  label: string;
  value: string;
  explanation: string;
}) {
  return (
    <section className="metric-card">

      <div className="metric-label">
        {label}
      </div>

      <div className="metric-value">
        {value}
      </div>

      <p className="metric-description">
        {explanation}
      </p>

    </section>
  );
}

/* =========================================================
   NEGOTIATION CARD VALUE
   ========================================================= */