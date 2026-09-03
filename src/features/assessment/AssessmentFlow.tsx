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
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers),
    [answers]
  );

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
  const profile = useMemo(
    () => buildBorrowerProfile(answers),
    [answers]
  );

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
              {currentQuestion.text}
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
  const decisionLabel = {
    borrow: "BORROW",
    borrow_less: "BORROW LESS",
    dont_borrow: "DON'T BORROW",
  }[result.decision];

  const formatMoney = (value: number) =>
    `₹${Math.round(value).toLocaleString(
      "en-IN"
    )}`;

  return (
    <main className="results-page">
      <div className="results-container">

        {/* HEADER */}
        <header className="results-header">
          <div className="results-eyebrow">
            BORROWER COPILOT
          </div>

          <h1 className="results-title">
            Your borrowing assessment
          </h1>

          <p className="results-subtitle">
            These are estimates, not lender
            approvals.
          </p>
        </header>

        {/* DECISION */}
        <section className="result-card">
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

        {/* METRICS */}
        <div className="metric-grid">

          <MetricCard
            label="Lender-style estimate"
            value={`${formatMoney(
              result.lenderAmount.min
            )} – ${formatMoney(
              result.lenderAmount.max
            )}`}
            explanation="A lender-style affordability estimate. It is not a sanction or approval."
          />

          <MetricCard
            label="Borrower-safe amount"
            value={`${formatMoney(
              result.safeAmount.min
            )} – ${formatMoney(
              result.safeAmount.max
            )}`}
            explanation="A more conservative range designed to leave repayment room after household costs and existing debt."
          />

          <MetricCard
            label="Fair interest rate"
            value={`${result.fairRate.min}% – ${result.fairRate.max}%`}
            explanation="Estimated fair rate band based on product type and available borrower risk information."
          />

          <MetricCard
            label="Estimated all-in APR"
            value={`${result.apr.min}% – ${result.apr.max}%`}
            explanation="Includes the assumed processing-fee impact. Compare this with the lender's disclosed APR."
          />

          <MetricCard
            label="Safe new EMI"
            value={formatMoney(
              result.emiCeiling
            )}
            explanation="The conservative monthly ceiling for the new loan after accounting for income and existing obligations."
          />

          <MetricCard
            label="Recommended amount"
            value={formatMoney(
              result.recommendedAmount
            )}
            explanation="The amount the assessment recommends based on the requested amount and conservative borrowing capacity."
          />

        </div>

        {/* TENURE */}
        <section className="result-card result-section">
          <div className="result-card-inner">

            <div className="results-eyebrow">
              TENURE TRADE-OFF
            </div>

            <h2 className="section-title">
              Same loan, different monthly pressure
            </h2>

            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Tenure</th>
                    <th>Monthly EMI</th>
                    <th>Total interest</th>
                  </tr>
                </thead>

                <tbody>
                  {result.tenureOptions.map(
                    (option) => (
                      <tr
                        key={option.months}
                      >
                        <td>
                          {option.months} months
                        </td>

                        <td>
                          {formatMoney(
                            option.emi
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            option.totalInterest
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>

        {/* STRESS TEST */}
        <section className="result-card result-section">
          <div className="result-card-inner">

            <div className="results-eyebrow">
              STRESS TEST
            </div>

            <div className="stress-header">

              <div>
                <h2 className="section-title">
                  {result.stressTest.scenario}
                </h2>

                <p className="section-description">
                  {result.stressTest.explanation}
                </p>
              </div>

              <span className="stress-status">
                {
                  result.stressTest
                    .affordabilityStatus
                }
              </span>

            </div>

          </div>
        </section>

        {/* BORROWING GUIDANCE */}
{result.decision === "dont_borrow" ? (
  <section className="avoid-borrowing-card">

    <div className="avoid-borrowing-eyebrow">
      BORROWING GUIDANCE
    </div>

    <h2>
      Don't borrow right now
    </h2>

    <p className="avoid-borrowing-description">
      Your current income is already fully
      committed to household expenses and
      existing obligations. Taking another
      EMI would leave no conservative
      repayment room.
    </p>

    <div className="avoid-borrowing-metrics">

      <div>
        <span>
          Remaining cash flow
        </span>

        <strong>
          ₹0
        </strong>
      </div>

      <div>
        <span>
          Safe new EMI
        </span>

        <strong>
          {formatMoney(
            result.emiCeiling
          )}
        </strong>
      </div>

      <div>
        <span>
          Recommended borrowing
        </span>

        <strong>
          {formatMoney(
            result.recommendedAmount
          )}
        </strong>
      </div>

    </div>

    <div className="avoid-borrowing-actions">

      <div className="avoid-borrowing-label">
        WHAT COULD CHANGE THIS?
      </div>

      <ul>
        <li>
          Reduce existing monthly
          debt obligations.
        </li>

        <li>
          Increase reliable monthly
          income.
        </li>

        <li>
          Reassess once you have
          more repayment capacity.
        </li>
      </ul>

    </div>

  </section>
) : (
  <section className="negotiation-card">

    <div className="negotiation-eyebrow">
      NEGOTIATION CARD
    </div>

    <h2>
      What to take to the lender
    </h2>

    <div className="negotiation-values">

      <CardValue
        label="Fair rate"
        value={`${result.negotiationCard.fairRate.min}% – ${result.negotiationCard.fairRate.max}%`}
      />

      <CardValue
        label="Safe EMI"
        value={formatMoney(
          result.negotiationCard.safeEmi
        )}
      />

      <CardValue
        label="Target amount"
        value={formatMoney(
          result.negotiationCard.recommendedAmount
        )}
      />

    </div>

    <div className="negotiation-content">

      <div className="apr-reminder">
        Ask the lender for the{" "}
        <strong>
          all-in APR
        </strong>
        , including processing fee
        and other mandatory charges,
        before accepting the offer.
      </div>

      {result.negotiationCard
        .lenderQuoteResponse && (
        <div className="what-to-say">

          <div className="what-to-say-label">
            WHAT TO SAY
          </div>

          <p>
            “
            {
              result.negotiationCard
                .lenderQuoteResponse
            }
            ”
          </p>

        </div>
      )}

    </div>

  </section>
)}

        {/* RESTART */}
        <div className="restart-container">
          <button
            type="button"
            onClick={onRestart}
            className="restart-button"
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

function CardValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="negotiation-value">

      <div className="negotiation-value-label">
        {label}
      </div>

      <div className="negotiation-value-number">
        {value}
      </div>

    </div>
  );
}