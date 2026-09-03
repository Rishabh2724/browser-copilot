import type { Question } from "./questions";

interface QuestionCardProps {
  question: Question;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

function formatIndianNumber(value: string | number) {
  const numeric = String(value).replace(/\D/g, "");

  if (!numeric) return "";

  return Number(numeric).toLocaleString("en-IN");
}

export function QuestionCard({
  question,
  value,
  onChange,
}: QuestionCardProps) {
  /*
   * SELECT QUESTIONS
   */
  if (question.type === "select" && question.options) {
    return (
      <div className="question-options">
        {question.options.map((option) => {
          const selected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={`option-card ${
                selected ? "option-card-selected" : ""
              }`}
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
            >
              <span
                className={`option-radio ${
                  selected ? "option-radio-selected" : ""
                }`}
              >
                {selected && <span />}
              </span>

              <span className="option-content">
                <span className="option-title">
                  {option.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /*
   * BOOLEAN QUESTIONS
   */
  if (question.type === "boolean") {
    return (
      <div className="boolean-options">
        <button
          type="button"
          className={`boolean-card ${
            value === true ? "boolean-card-selected" : ""
          }`}
          onClick={() => onChange(true)}
          aria-pressed={value === true}
        >
          <span className="boolean-icon">✓</span>

          <span>
            <strong>Yes</strong>
            <small>This applies to me</small>
          </span>
        </button>

        <button
          type="button"
          className={`boolean-card ${
            value === false ? "boolean-card-selected" : ""
          }`}
          onClick={() => onChange(false)}
          aria-pressed={value === false}
        >
          <span className="boolean-icon">×</span>

          <span>
            <strong>No</strong>
            <small>This doesn't apply to me</small>
          </span>
        </button>
      </div>
    );
  }

  /*
   * NUMBER / CURRENCY QUESTIONS
   */

  const isCurrency = question.type === "currency";

  // Number questions should never contain a boolean,
  // but TypeScript cannot infer that from the union type.
  const numericValue =
    typeof value === "number" || typeof value === "string"
      ? value
      : "";

  return (
    <div className="number-input-wrapper">
      <div className="number-input-container">
        {isCurrency && (
          <span className="currency-symbol">
            ₹
          </span>
        )}

        <input
          type="number"
          inputMode="numeric"
          value={
            numericValue === "" ||
            numericValue === 0
              ? ""
              : String(numericValue)
          }
          min={question.min}
          max={question.max}
          step={question.step}
          placeholder={
            isCurrency
              ? "0"
              : "Enter a number"
          }
          className="large-number-input"
          onChange={(event) => {
            const raw = event.target.value;

            if (raw === "") {
              onChange(0);
              return;
            }

            const numeric = Number(raw);

            if (Number.isNaN(numeric)) {
              return;
            }

            onChange(numeric);
          }}
        />
      </div>

      {numericValue !== "" &&
        Number(numericValue) > 0 &&
        isCurrency && (
          <div className="number-preview">
            {formatIndianNumber(numericValue)}
          </div>
        )}

      {question.min !== undefined &&
        question.max !== undefined && (
          <div className="input-range">
            Range:{" "}
            {isCurrency ? "₹" : ""}
            {question.min.toLocaleString("en-IN")}
            {" – "}
            {isCurrency ? "₹" : ""}
            {question.max.toLocaleString("en-IN")}
          </div>
        )}
    </div>
  );
}