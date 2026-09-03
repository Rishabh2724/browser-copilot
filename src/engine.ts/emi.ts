export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  const monthlyRate =
    annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  const factor =
    Math.pow(
      1 + monthlyRate,
      tenureMonths
    );

  return (
    principal *
    monthlyRate *
    factor /
    (factor - 1)
  );
}

export function calculateLoanAmountFromEMI(
  emi: number,
  annualRate: number,
  tenureMonths: number
): number {
  const monthlyRate =
    annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return emi * tenureMonths;
  }

  const factor =
    Math.pow(
      1 + monthlyRate,
      tenureMonths
    );

  return (
    emi *
    (factor - 1) /
    (monthlyRate * factor)
  );
}