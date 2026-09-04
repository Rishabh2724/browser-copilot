import type { Question } from "./questions";
import type {
  AnswerValue,
  IncomeRangeAnswer,
} from "./buildProfile";

interface QuestionCardProps {
  question: Question;
  value: AnswerValue;
  options?: {
    label: string;
    value: string;
  }[];

  onChange: (value: Exclude<AnswerValue, undefined>) => void;
}

function formatIndianNumber(
  value: string | number
): string {
  if (value === "") {
    return "";
  }

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
  const selectOptions =
    options ??
    question.options ??
    [];


  /*
   * ---------------------------------------------------------
   * INCOME RANGE
   * ---------------------------------------------------------
   *
   * The borrower enters both the lowest and highest
   * typical monthly income on the same screen.
   *
   * The two values are stored as:
   *
   * monthlyIncome: { min, max }
   *
   * The engine later derives income stability from
   * the range.
   */
  if (question.type === "income_range") {
    const minIncome =
      typeof value === "object" &&
      value !== null
        ? value.min ?? ""
        : "";

    const maxIncome =
      typeof value === "object" &&
      value !== null
        ? value.max ?? ""
        : "";

    const handleIncomeChange = (
      field: "min" | "max",
      rawValue: string
    ) => {
      const parsedValue =
        rawValue === ""
          ? undefined
          : Number(rawValue);

      const currentMin =
        typeof minIncome === "number"
          ? minIncome
          : undefined;

      const currentMax =
        typeof maxIncome === "number"
          ? maxIncome
          : undefined;

      const nextRange: IncomeRangeAnswer = {
        min:
          field === "min"
            ? parsedValue
            : currentMin,

        max:
          field === "max"
            ? parsedValue
            : currentMax,
      };

      onChange(nextRange);
    };

    return (
      <div className="question-card-content">
        <div className="income-range-inputs">
          <div className="income-range-field">
            <label>
              Lowest monthly income
            </label>

            <div className="number-input-wrapper">
              <span className="currency-symbol">
                ₹
              </span>

              <input
                className="large-number-input"
                type="number"
                inputMode="numeric"
                min={question.min}
                max={question.max}
                step={question.step ?? 1}
                value={
                  minIncome === ""
                    ? ""
                    : String(minIncome)
                }
                placeholder="40,000"
                onChange={(event) =>
                  handleIncomeChange(
                    "min",
                    event.target.value
                  )
                }
              />
            </div>

            {minIncome !== "" && (
              <p className="formatted-number">
                ₹
                {formatIndianNumber(
                  minIncome
                )}
              </p>
            )}
          </div>

          <div className="income-range-field">
            <label>
              Highest monthly income
            </label>

            <div className="number-input-wrapper">
              <span className="currency-symbol">
                ₹
              </span>

              <input
                className="large-number-input"
                type="number"
                inputMode="numeric"
                min={question.min}
                max={question.max}
                step={question.step ?? 1}
                value={
                  maxIncome === ""
                    ? ""
                    : String(maxIncome)
                }
                placeholder="80,000"
                onChange={(event) =>
                  handleIncomeChange(
                    "max",
                    event.target.value
                  )
                }
              />
            </div>

            {maxIncome !== "" && (
              <p className="formatted-number">
                ₹
                {formatIndianNumber(
                  maxIncome
                )}
              </p>
            )}
          </div>
        </div>

        <p className="input-hint">
          Enter a normal low month and a
          normal high month. Don't use an
          exceptional one-off month.
        </p>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * SELECT
   * ---------------------------------------------------------
   */

  if (question.type === "select") {
    if (selectOptions.length === 0) {
      return (
        <div className="question-card-content">
          <div className="validation-error">
            <strong>
              No suitable loan products found
            </strong>

            <span>
              We could not find a suitable
              loan product for the purpose
              selected. Please go back and
              choose another purpose.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="question-card-content">
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
                aria-pressed={selected}
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
   * ---------------------------------------------------------
   * BOOLEAN
   * ---------------------------------------------------------
   */

  if (question.type === "boolean") {
    return (
      <div className="question-card-content">
        <div className="boolean-options">

          <button
            type="button"
            className={`boolean-option ${
              value === true
                ? "selected"
                : ""
            }`}
            aria-pressed={
              value === true
            }
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
            aria-pressed={
              value === false
            }
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
   * ---------------------------------------------------------
   * NUMBER / CURRENCY
   * ---------------------------------------------------------
   */

  const numericValue =
    typeof value === "number" ||
    typeof value === "string"
      ? value
      : "";

  return (
    <div className="question-card-content">
      <div className="number-input-wrapper">

        {question.type ===
          "currency" && (
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
          step={
            question.step ?? 1
          }
          value={
            numericValue === ""
              ? ""
              : String(
                  numericValue
                )
          }
          placeholder={
            question.type ===
            "currency"
              ? "0"
              : "Enter a value"
          }
          aria-label={
            typeof question.text === "function"
              ? "Answer"
              : question.text
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
              Number.isNaN(
                parsedValue
              )
            ) {
              return;
            }

            onChange(parsedValue);
          }}
        />
      </div>

      {numericValue !== "" && (
        <p className="formatted-number">
          {question.type ===
          "currency"
            ? `₹${formatIndianNumber(
                numericValue
              )}`
            : formatIndianNumber(
                numericValue
              )}
        </p>
      )}

      {(
        question.min !==
          undefined ||
        question.max !==
          undefined
      ) ? (
        <p className="input-hint">
          {question.min !==
            undefined &&
          question.max !==
            undefined
            ? `Enter a value between ${formatIndianNumber(
                question.min
              )} and ${formatIndianNumber(
                question.max
              )}.`
            : question.min !==
                undefined
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
