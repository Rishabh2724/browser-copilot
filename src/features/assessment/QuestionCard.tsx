import type { Question } from "./questions";

interface QuestionCardProps {
  question: Question;
  value: string | number | boolean | undefined;
  onChange: (
    value: string | number | boolean
  ) => void;
}

export function QuestionCard({
  question,
  value,
  onChange,
}: QuestionCardProps) {
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200";

  if (
    question.type === "select" &&
    question.options
  ) {
    return (
      <div className="space-y-3">
        {question.options.map((option) => {
          const selected =
            value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                onChange(option.value)
              }
              className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <span className="font-medium">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-xl border px-4 py-4 font-medium transition ${
            value === true
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white hover:border-slate-400"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-xl border px-4 py-4 font-medium transition ${
            value === false
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white hover:border-slate-400"
          }`}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <input
      type={question.type === "number" ? "number" : "number"}
      inputMode="numeric"
      value={
        value === undefined
          ? ""
          : String(value)
      }
      min={question.min}
      max={question.max}
      step={question.step}
      placeholder="Enter amount"
      className={inputClass}
      onChange={(event) => {
        const raw = event.target.value;

        if (raw === "") {
          onChange(0);
          return;
        }

        onChange(Number(raw));
      }}
    />
  );
}