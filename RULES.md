# Borrower Copilot — Rules & Assumptions

## 1. Purpose

Borrower Copilot is a borrower-first decision-support tool for Indian borrowers.

It estimates:

1. Whether the borrower should **Borrow**, **Borrow Less**, or **Don't Borrow**.
2. A lender-side sanction estimate and a conservative borrower-safe amount.
3. An indicative fair interest-rate band and APR.
4. A conservative EMI ceiling and repayment stress result.

These are estimates, not lender approvals, credit decisions, or guarantees.

---

## 2. Decision Rules

| Rule | Value | Why | Source |
|---|---:|---|---|
| Decision outcomes | Borrow / Borrow Less / Don't Borrow | Provides an actionable recommendation | My judgement |
| Zero remaining cash flow | Don't Borrow | No capacity remains for another EMI | My judgement |
| Safe new EMI capacity ≤ 0 | Don't Borrow | No conservative borrowing capacity remains | My judgement |
| Secured loan without collateral | Don't Borrow | LAP/gold borrowing requires eligible security | Product constraint |
| Requested amount > 2× safe capacity | Don't Borrow | Requested borrowing is materially beyond conservative affordability | My judgement |
| Requested amount > safe capacity | Borrow Less | Some borrowing may be affordable, but not the requested amount | My judgement |
| Unsafe stress result | Borrow Less | Baseline affordability is insufficient if repayment fails under stress | My judgement |
| Very weak credit + another material risk | Don't Borrow | Multiple risk signals increase repayment risk | My judgement |

A productive purpose does not automatically make an unaffordable loan safe.

---

## 3. Affordability / FOIR

FOIR (Fixed Obligation to Income Ratio) is used as a simplified measure of monthly repayment burden.

### Lender-side FOIR

| Borrower type | FOIR | Why | Source |
|---|---:|---|---|
| Salaried | 50% | Higher income stability supports a higher estimated obligation ceiling | My judgement / industry-practice assumption |
| Self-employed | 45% | Additional buffer for business-income variability | My judgement |
| Informal | 40% | Greater income uncertainty requires a more conservative ceiling | My judgement |

### Borrower-safe FOIR

| Borrower type | Safe FOIR | Why | Source |
|---|---:|---|---|
| Salaried | 40% | Creates a borrower-side cushion below lender capacity | My judgement |
| Self-employed | 35% | Larger buffer for variable income | My judgement |
| Informal | 30% | Higher uncertainty requires stronger repayment buffer | My judgement |

### Post-expense constraint

The safe EMI capacity is also constrained to 50% of remaining cash flow.

```text
Remaining cash flow
= normalized income
  - household expenses
  - existing EMIs

Post-expense EMI constraint
= remaining cash flow × 50%