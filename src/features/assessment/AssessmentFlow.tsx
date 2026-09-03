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
   * Only questions whose conditions are currently
   * satisfied are included in the flow.
   */
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(answers),
    [answers]
  );

  const currentQuestion: Question | undefined =
    visibleQuestions[currentIndex];

  const progress =
    visibleQuestions.length === 0
      ? 0
      : Math.round(
          ((currentIndex + 1) /
            visibleQuestions.length) *
            100
        );

  const currentValue =
    currentQuestion
      ? answers[currentQuestion.id]
      : undefined;

  /*
   * Do not use a truthy check here.
   *
   * 0 can be a legitimate financial answer.
   */
  const canContinue =
    currentValue !== undefined &&
    currentValue !== "";

  const updateAnswer = (
    value: AnswerValue
  ) => {
    if (!currentQuestion) {
      return;
    }

    const validation =
      validateAnswer(
        currentQuestion.id,
        value,
        answers
      );

    if (
      !validation.valid &&
      validation.severity === "error"
    ) {
      setValidationError(
        validation.message ??
          "Invalid answer."
      );
    } else {
      setValidationError(null);
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value,
    }));
  };

  const profile = useMemo(
    () => buildBorrowerProfile(answers),
    [answers]
  );

  const handleNext = () => {
    if (!currentQuestion) {
      return;
    }

    if (!canContinue) {
      setValidationError(
        "Please provide an answer to continue."
      );

      return;
    }

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

    if (
      currentIndex <
      visibleQuestions.length - 1
    ) {
      setCurrentIndex(
        (index) => index + 1
      );

      return;
    }

    const assessment =
      assessBorrower(profile);

    setResult(assessment);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setValidationError(null);

      setCurrentIndex(
        (index) => index - 1
      );
    }
  };

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
              Question {currentIndex + 1} of{" "}
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
            question={currentQuestion}
            value={currentValue}
            onChange={updateAnswer}
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
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="back-button"
            >
              ← Back
            </button>

            <button
              type="button"
              disabled={!canContinue}
              onClick={handleNext}
              className="continue-button"
            >
              {currentIndex ===
              visibleQuestions.length - 1
                ? "See my assessment"
                : "Continue →"}
            </button>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="assessment-footer">
          <span>Private by design</span>

          <span>•</span>

          <span>No bureau pull</span>

          <span>•</span>

          <span>No login</span>

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

        {/* NEGOTIATION CARD */}
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