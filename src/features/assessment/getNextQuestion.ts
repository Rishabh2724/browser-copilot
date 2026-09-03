import {
  QUESTIONS,
  type Question,
} from "./questions";

import type { Answers } from "./buildProfile";

export function getVisibleQuestions(
  answers: Answers
): Question[] {
  return QUESTIONS.filter((question) => {
    if (!question.showWhen) {
      return true;
    }

    return question.showWhen(
      buildVisibilityProfile(answers)
    );
  });
}

export function getNextQuestion(
  answers: Answers,
  answeredIds: string[]
): Question | null {
  const visibleQuestions =
    getVisibleQuestions(answers);

  return (
    visibleQuestions.find(
      (question) =>
        !answeredIds.includes(question.id)
    ) ?? null
  );
}

function buildVisibilityProfile(
  answers: Answers
) {
  return {
    employmentType:
      answers.employmentType,

    loan: {
      type: answers.loanType,
    },

    creditScore:
      answers.creditScoreKnown === true
        ? answers.creditScore
        : undefined,
  } as any;
}