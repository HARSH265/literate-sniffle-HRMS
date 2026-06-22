export interface TaxInput {
  grossMonthly: number;
  ytdGross: number;
  ytdTdsDeducted: number;
  monthsRemaining: number;
  regime: 'old' | 'new';
  employeeAge?: number;
  declaration: {
    section80C: number;
    section80CCD1B: number;
    section80D: number;
    section80E: number;
    section24b: number;
    hraExemption: number;
    ltaExemption: number;
    otherExemptions: number;
    standardDeduction: number;
  };
  employerNps?: number;
}

export interface TaxResult {
  regime: 'old' | 'new';
  projectedAnnualGross: number;
  projectedAnnualExemptions: number;
  projectedTaxableIncome: number;
  annualTaxAmount: number;
  surcharge: number;
  educationCess: number;
  totalTaxLiability: number;
  monthlyTds: number;
  rebate87a: number;
}

const NEW_REGIME_SLABS = [
  { max: 300000, rate: 0 },
  { max: 700000, rate: 5 },
  { max: 1000000, rate: 10 },
  { max: 1200000, rate: 15 },
  { max: 1500000, rate: 20 },
  { max: Infinity, rate: 30 },
];

const OLD_REGIME_SLABS = [
  { max: 250000, rate: 0 },
  { max: 500000, rate: 5 },
  { max: 1000000, rate: 20 },
  { max: Infinity, rate: 30 },
];

function computeTaxBySlabs(income: number, slabs: { max: number; rate: number }[]): number {
  let tax = 0;
  let remaining = income;
  let previousMax = 0;
  for (const slab of slabs) {
    const slabIncome = Math.min(remaining, slab.max - previousMax);
    if (slabIncome <= 0) break;
    tax += slabIncome * (slab.rate / 100);
    remaining -= slabIncome;
    previousMax = slab.max;
    if (remaining <= 0) break;
  }
  return tax;
}

function computeSurcharge(income: number, tax: number, regime: 'old' | 'new'): number {
  if (regime === 'old') {
    // Old regime: 37% surcharge for >₹5Cr
    if (income > 50000000) return tax * 0.37;
    if (income > 20000000) return tax * 0.25;
    if (income > 10000000) return tax * 0.15;
    if (income > 5000000) return tax * 0.10;
  } else {
    // New regime: max 25% surcharge
    if (income > 20000000) return tax * 0.25;
    if (income > 10000000) return tax * 0.15;
    if (income > 5000000) return tax * 0.10;
  }
  return 0;
}

export function computeTax(input: TaxInput): TaxResult {
  const projectedAnnualGross = input.ytdGross + (input.grossMonthly * input.monthsRemaining);

  let exemptions = 0;
  let standardDeduction = input.declaration.standardDeduction;

  if (input.regime === 'old') {
    const sec80c = Math.min(input.declaration.section80C, 150000);
    const sec80ccd1b = Math.min(input.declaration.section80CCD1B, 50000);
    const sec80dCap = (input.employeeAge && input.employeeAge >= 60) ? 50000 : 25000;
    const sec80d = Math.min(input.declaration.section80D, sec80dCap);
    const sec80e = input.declaration.section80E;
    const sec24b = Math.min(input.declaration.section24b, 200000);

    exemptions = sec80c + sec80ccd1b + sec80d + sec80e + sec24b
      + input.declaration.hraExemption
      + input.declaration.ltaExemption
      + input.declaration.otherExemptions;
  } else {
    // New regime: only employer NPS and standard deduction
    standardDeduction = Math.max(standardDeduction, 75000);
    exemptions = input.employerNps ? Math.min(input.employerNps * 12, projectedAnnualGross * 0.14) : 0;
  }

  const projectedAnnualExemptions = exemptions + standardDeduction;
  let projectedTaxableIncome = Math.max(0, projectedAnnualGross - projectedAnnualExemptions);
  projectedTaxableIncome = Math.round(projectedTaxableIncome);

  const slabs = input.regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
  let annualTaxAmount = computeTaxBySlabs(projectedTaxableIncome, slabs);
  annualTaxAmount = Math.round(annualTaxAmount);

  const surcharge = Math.round(computeSurcharge(projectedTaxableIncome, annualTaxAmount, input.regime));

  const incomeAfterSurcharge = annualTaxAmount + surcharge;
  const educationCess = Math.round(incomeAfterSurcharge * 0.04);

  let totalTaxLiability = annualTaxAmount + surcharge + educationCess;

  // Rebate u/s 87A
  let rebate87a = 0;
  if (input.regime === 'new' && projectedTaxableIncome <= 700000) {
    rebate87a = totalTaxLiability;
    totalTaxLiability = 0;
  } else if (input.regime === 'old' && projectedTaxableIncome <= 500000) {
    rebate87a = Math.min(totalTaxLiability, 12500);
    totalTaxLiability = Math.max(0, totalTaxLiability - rebate87a);
  }

  const remainingMonths = Math.max(1, input.monthsRemaining);
  const totalRemainingTax = totalTaxLiability - input.ytdTdsDeducted;
  const monthlyTds = Math.max(0, Math.round(totalRemainingTax / remainingMonths));

  return {
    regime: input.regime,
    projectedAnnualGross,
    projectedAnnualExemptions,
    projectedTaxableIncome,
    annualTaxAmount,
    surcharge,
    educationCess,
    totalTaxLiability,
    monthlyTds,
    rebate87a,
  };
}
