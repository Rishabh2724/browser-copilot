import type { Question } from "./questions";

interface QuestionCardProps {
  question: Question;

  value:
    | string
    | number
    | boolean
    | undefined;

  options?: {
    label: string;
    value: string;
  }[];

  onChange: (
    value: string | number | boolean
  ) => void;
}

function formatIndianNumber(
  value: string | number
): string {
  if (value === "") return "";

  const numericValue = Number(
    String(value).replace(/,/g, "")
  );

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return numericValue.toLocaleString("en-IN");
}

export function QuestionCard({
  question,
  value,
  options,
  onChange,
}: QuestionCardProps) {
  /*
   * Use dynamically generated options when available.
   * Otherwise fall back to the static question.options.
   */
  const selectOptions =
    options ??
    question.options ??
    [];

  /*
   * SELECT QUESTION
   */
  if (
    question.type === "select" &&
    selectOptions.length > 0
  ) {
    return (
      <div className="question-card">
        <div className="question-header">
          <h2>{question.text}</h2>

          {question.description && (
            <p className="question-description">
              {question.description}
            </p>
          )}
        </div>

        <div className="question-options">
          {selectOptions.map((option) => {
            const selected =
              value === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`question-option ${
                  selected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onChange(option.value)
                }
              >
                <span className="question-option-label">
                  {option.label}
                </span>

                {selected && (
                  <span className="question-option-check">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /*
   * BOOLEAN QUESTION
   */
  if (question.type === "boolean") {
    return (
      <div className="question-card">
        <div className="question-header">
          <h2>{question.text}</h2>

          {question.description && (
            <p className="question-description">
              {question.description}
            </p>
          )}
        </div>

        <div className="boolean-options">
          <button
            type="button"
            className={`boolean-option ${
              value === true
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(true)
            }
          >
            <span className="boolean-option-title">
              Yes
            </span>

            <span className="boolean-option-description">
              Yes, this applies to me
            </span>
          </button>

          <button
            type="button"
            className={`boolean-option ${
              value === false
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(false)
            }
          >
            <span className="boolean-option-title">
              No
            </span>

            <span className="boolean-option-description">
              No, this does not apply to me
            </span>
          </button>
        </div>
      </div>
    );
  }

  /*
   * CURRENCY / NUMBER QUESTION
   */
  const numericValue =
    typeof value === "number" ||
    typeof value === "string"
      ? value
      : "";

  return (
    <div className="question-card">
      <div className="question-header">
        <h2>{question.text}</h2>

        {question.description && (
          <p className="question-description">
            {question.description}
          </p>
        )}
      </div>

      <div className="number-input-wrapper">
        {question.type === "currency" && (
          <span className="currency-symbol">
            ₹
          </span>
        )}

        <input
          className="large-number-input"
          type="number"
          inputMode="numeric"
          min={question.min}
          max={question.max}
          step={question.step ?? 1}
          value={
            numericValue === ""
              ? ""
              : String(numericValue)
          }
          placeholder={
            question.type === "currency"
              ? "0"
              : "Enter a value"
          }
          onChange={(event) => {
            const rawValue =
              event.target.value;

            if (rawValue === "") {
              onChange("");
              return;
            }

            const parsedValue =
              Number(rawValue);

            if (
              Number.isNaN(parsedValue)
            ) {
              return;
            }

            onChange(parsedValue);
          }}
        />
      </div>

      {numericValue !== "" && (
        <p className="formatted-number">
          {question.type === "currency"
            ? `₹${formatIndianNumber(
                numericValue
              )}`
            : formatIndianNumber(
                numericValue
              )}
        </p>
      )}

      {question.min !== undefined ||
      question.max !== undefined ? (
        <p className="input-hint">
          {question.min !== undefined &&
          question.max !== undefined
            ? `Enter a value between ${formatIndianNumber(
                question.min
              )} and ${formatIndianNumber(
                question.max
              )}.`
            : question.min !== undefined
              ? `Minimum: ${formatIndianNumber(
                  question.min
                )}`
              : `Maximum: ${formatIndianNumber(
                  question.max!
                )}`}
        </p>
      ) : null}
    </div>
  );
}