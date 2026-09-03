import {
  QUESTIONS,
  type Question,
} from "./questions";

import {
  buildBorrowerProfile,
  type Answers,
} from "./buildProfile";

export function getVisibleQuestions(
  answers: Answers
): Question[] {
  const profile = buildBorrowerProfile(answers);

  return QUESTIONS.filter((question) => {
    // Credit score is special:
    // only show the score input when the user explicitly
    // said that they know their score.
    if (question.id === "creditScore") {
      return answers.creditScoreKnown === true;
    }

    if (!question.showWhen) {
      return true;
    }

    return question.showWhen(profile);
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