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

 const visibleQuestions = useMemo(
  () => getVisibleQuestions(answers),
  [answers]
);

const currentQuestion: Question =
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
    answers[currentQuestion?.id];

  const canContinue =
    currentValue !== undefined &&
    currentValue !== "";

  const updateAnswer = (
  value: AnswerValue
) => {
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
      validation.message ?? "Invalid answer."
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
      setCurrentIndex(
        (index) => index - 1
      );
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (result) {
    return (
      <AssessmentResults
        result={result}
        onRestart={restart}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <div className="mb-2 text-sm font-semibold tracking-wide text-slate-500">
            BORROWER COPILOT
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Know what you can afford
            before you borrow.
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            A transparent borrowing assessment
            based on your income, expenses,
            existing debt and loan goal.
          </p>
        </header>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm text-slate-500">
            <span>
              Question {currentIndex + 1} of{" "}
              {visibleQuestions.length}
            </span>

            <span>{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <div className="mb-3 text-sm font-medium text-slate-500">
              {currentQuestion.category}
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              {currentQuestion.text}
            </h2>

            {currentQuestion.description && (
              <p className="mt-3 text-sm leading-6 text-slate-500">
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
  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {validationError}
  </div>
)}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 disabled:invisible"
            >
              Back
            </button>

            <button
              type="button"
              disabled={!canContinue}
              onClick={handleNext}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {currentIndex ===
              visibleQuestions.length - 1
                ? "See my assessment"
                : "Continue"}
            </button>
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          No bureau pull. No login. No personal
          data stored.
        </p>
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mb-2 text-sm font-semibold tracking-wide text-slate-500">
            BORROWER COPILOT
          </div>

          <h1 className="text-3xl font-semibold">
            Your borrowing assessment
          </h1>

          <p className="mt-2 text-slate-600">
            These are estimates, not lender approvals.
          </p>
        </header>

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-sm font-medium text-slate-500">
            YOUR DECISION
          </div>

          <h2 className="mt-2 text-4xl font-bold tracking-tight">
            {decisionLabel}
          </h2>

          <div className="mt-4 max-w-2xl space-y-2 text-slate-600">
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
        </section>

        <div className="grid gap-5 md:grid-cols-2">
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

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="text-sm font-medium text-slate-500">
              TENURE TRADE-OFF
            </div>

            <h2 className="mt-1 text-2xl font-semibold">
              Same loan, different monthly pressure
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3">Tenure</th>
                  <th className="pb-3">
                    Monthly EMI
                  </th>
                  <th className="pb-3">
                    Total interest
                  </th>
                </tr>
              </thead>

              <tbody>
                {result.tenureOptions.map(
                  (option) => (
                    <tr
                      key={option.months}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 font-medium">
                        {option.months} months
                      </td>

                      <td className="py-4">
                        {formatMoney(
                          option.emi
                        )}
                      </td>

                      <td className="py-4">
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
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            STRESS TEST
          </div>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold">
                {result.stressTest.scenario}
              </h2>

              <p className="mt-2 max-w-2xl text-slate-600">
                {result.stressTest.explanation}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold uppercase">
              {result.stressTest.affordabilityStatus}
            </span>
          </div>
        </section>

        <section className="mt-5 rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="text-sm font-medium text-slate-400">
            NEGOTIATION CARD
          </div>

          <h2 className="mt-2 text-3xl font-semibold">
            What to take to the lender
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
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

          <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm text-slate-300">
            Ask the lender for the{" "}
            <strong className="text-white">
              all-in APR
            </strong>
            , including processing fee and
            other mandatory charges, before
            accepting the offer.
          </div>
        </section>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold hover:bg-slate-100"
          >
            Start another assessment
          </button>
        </div>
      </div>
    </main>
  );
}

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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {explanation}
      </p>
    </section>
  );
}

function CardValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-xl font-semibold">
        {value}
      </div>
    </div>
  );
}