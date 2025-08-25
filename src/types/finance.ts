export type CurrencyCode = 'EUR' | 'USD' | 'RON' | 'ILS'

export interface LoanInput {
    name: string;
    amount: number;      // principal
    rateApr: number;     // e.g., 6 => 6%
    termYears: number;   // loan total term
    amortYears?: number; // if IO, set amortYears = undefined and handle IO logic later
    startMonth?: number; // offset for second liens or rehab loans
    balloonMonth?: number;
    pointsPct?: number;
    originationFee?: number;
}

export interface AnalysisInput {
    purchasePrice: number;
    closingCosts: number;
    rehabCosts: number;

    monthlyRent: number;
    vacancyPct: number;

    taxesMonthly: number;
    insuranceMonthly: number;
    hoaMonthly: number;
    managementPct: number;  // of effective rent
    maintenancePct: number; // of effective rent
    otherMonthly: number;

    appreciationPct: number;     // annual
    rentGrowthPct: number;       // annual
    expenseInflationPct: number; // annual

    saleYear: number;
    sellingCostsPct: number;

    currency: CurrencyCode;

    loans: LoanInput[];
}

export interface TimelinePoint {
    month: number;
    year: number;
    marketValue: number;
    totalLoanBalance: number;
    cumulativeCashInvested: number; // down + fees + negative CF accumulated
    cumulativeNetCashFlow: number;  // signed
    equity: number;                 // MV - totalLoanBalance
}

export interface AnalysisOutput {
    kpis: {
        monthlyPmtTotal: number;
        monthlyNOI: number;
        monthlyCashFlow: number;
        capRate: number;       // %
        cashOnCash: number;    // %
        dscr: number;
        irr?: number;          // later
    };
    timeline: TimelinePoint[];
    yearly: Array<{
        year: number;
        noi: number;
        cashFlow: number;
        principalPaid: number;
        interestPaid: number;
        endingBalance: number;
    }>;
}


// src/types/finance.ts
export type ROIInput = {
    currency: string;

    // Purchase
    purchasePrice: number;
    closingCosts: number;
    rehabCosts: number;

    // Operations (monthly)
    rent: number;
    vacancyPct: number;          // %
    taxesMonthly: number;
    insuranceMonthly: number;
    hoaMonthly: number;
    mgmtPct: number;             // %
    maintenancePct: number;      // %
    otherMonthly: number;

    // Growth & Exit
    appreciationPct: number;     // % / yr
    rentGrowthPct: number;       // % / yr
    expenseInflationPct: number; // % / yr
    saleInYears: number;
    sellingCostsPct: number;     // %
};

export type Stage = {
    id: string;
    label: string;     // e.g., "Contract", "Delivery"
    date: string;      // ISO date
    percent: number;   // 0..100; stages must sum to 100
};

type RowKind =
    | 'amount'              // user enters an amount in 100% col
    | 'percent_of_full'     // user enters X%, amount = X% * fullPrice
    | 'computed'            // system computed (Tax, Full Price, Total)
    | 'separator';

type BuiltinRowId =
    | 'apartment'
    | 'parking'
    | 'tax'
    | 'full_price'
    | 'furniture'
    | 'notary'
    | 'appraiser'
    | 'total';

export type Row = {
    id: string;           // stable
    label: string;
    kind: RowKind;
    // for amount rows:
    amount100?: number;   // base amount (100% column)
    // for percent_of_full rows:
    percentOfFull?: number;  // e.g., 2.5 (means 2.5%)
    // for special computed rows:
    builtin?: BuiltinRowId;
    // visual:
    isLocked?: boolean;   // prevent editing (e.g., computed rows)
};

export type PaymentTableState = {
    currency: CurrencyCode;
    stages: Stage[];          // does NOT include the 100% column
    taxPercent: number;       // applied to (apartment + parking)
    notaryPercent: number;    // % of Full Price
    appraiserPercent: number; // % of Full Price
    rows: Row[];              // includes built-ins + custom + separator
};