import type { AnalysisInput, AnalysisOutput, TimelinePoint } from '../types/finance';
import { pmt } from './math';

export function analyzeScenario(input: AnalysisInput): AnalysisOutput {
    const months = input.saleYear * 12;
    const monthlyGrowthRent = Math.pow(1 + input.rentGrowthPct / 100, 1 / 12) - 1;
    const monthlyInflationExp = Math.pow(1 + input.expenseInflationPct / 100, 1 / 12) - 1;
    const monthlyAppreciation = Math.pow(1 + input.appreciationPct / 100, 1 / 12) - 1;

    // Initial value and cash in
    const timeline: TimelinePoint[] = [];
    let marketValue = input.purchasePrice;
    let totalLoanBalance = 0;

    // Setup loans (only fixed amortization for MVP)
    const loans = input.loans.map(ln => {
        const rateMonthly = (ln.rateApr / 100) / 12;
        const nper = ln.termYears * 12;
        const payment = -pmt(rateMonthly, nper, ln.amount); // positive
        return { ...ln, rateMonthly, nper, payment, balance: ln.amount, startMonth: ln.startMonth ?? 0 };
    });

    totalLoanBalance = loans.reduce((s, l) => s + l.balance, 0);

    // Cash invested on day 0 (down + closing + rehab)
    const equityAtStart = input.purchasePrice - totalLoanBalance;
    let cumulativeCashInvested = equityAtStart + input.closingCosts + input.rehabCosts;
    let cumulativeNetCashFlow = -cumulativeCashInvested;

    // Monthly ops
    let rent = input.monthlyRent;
    let taxes = input.taxesMonthly;
    let ins = input.insuranceMonthly;
    let hoa = input.hoaMonthly;
    let other = input.otherMonthly;

    for (let m = 0; m <= months; m++) {
        if (m > 0) {
            // evolve
            rent *= (1 + monthlyGrowthRent);
            taxes *= (1 + monthlyInflationExp);
            ins *= (1 + monthlyInflationExp);
            hoa *= (1 + monthlyInflationExp);
            other *= (1 + monthlyInflationExp);
            marketValue *= (1 + monthlyAppreciation);
        }

        const effectiveRent = rent * (1 - input.vacancyPct / 100);
        const mgmt = effectiveRent * (input.managementPct / 100);
        const maint = effectiveRent * (input.maintenancePct / 100);
        const operating = taxes + ins + hoa + other + mgmt + maint;
        const noi = effectiveRent - operating;

        // Debt service for active loans
        let debtService = 0;
        let principalPaidThisMonth = 0;
        let interestPaidThisMonth = 0;

        for (const ln of loans) {
            if (m >= (ln.startMonth ?? 0) && m < (ln.startMonth ?? 0) + ln.nper && ln.balance > 1e-8) {
                const interest = ln.balance * ln.rateMonthly;
                const principal = Math.min(ln.payment - interest, ln.balance);
                ln.balance -= principal;
                debtService += ln.payment;
                principalPaidThisMonth += principal;
                interestPaidThisMonth += interest;
            }
        }

        totalLoanBalance = loans.reduce((s, l) => s + l.balance, 0);

        const cashFlow = noi - debtService;
        cumulativeNetCashFlow += cashFlow;
        if (cashFlow < 0) {
            // negative cash flow increases "cash invested"
            cumulativeCashInvested += -cashFlow;
        }

        const equity = marketValue - totalLoanBalance;

        timeline.push({
            month: m,
            year: Math.floor(m / 12),
            marketValue,
            totalLoanBalance,
            cumulativeCashInvested,
            cumulativeNetCashFlow,
            equity,
        });
    }

    const last = timeline[timeline.length - 1];
    const capRate = ((input.monthlyRent * (1 - input.vacancyPct / 100) - (input.taxesMonthly + input.insuranceMonthly + input.hoaMonthly + input.otherMonthly + input.monthlyRent * (input.managementPct + input.maintenancePct) / 100)) * 12) / input.purchasePrice * 100;

    const output: AnalysisOutput = {
        kpis: {
            monthlyPmtTotal: loans.reduce((s, l) => s + l.payment, 0),
            monthlyNOI: (input.monthlyRent * (1 - input.vacancyPct / 100)) - (input.taxesMonthly + input.insuranceMonthly + input.hoaMonthly + input.otherMonthly + input.monthlyRent * (input.managementPct + input.maintenancePct) / 100),
            monthlyCashFlow: ((input.monthlyRent * (1 - input.vacancyPct / 100)) - (input.taxesMonthly + input.insuranceMonthly + input.hoaMonthly + input.otherMonthly + input.monthlyRent * (input.managementPct + input.maintenancePct) / 100)) - loans.reduce((s, l) => s + l.payment, 0),
            capRate,
            cashOnCash: (last.cumulativeNetCashFlow * 12 / Math.max(1, last.cumulativeCashInvested)) * 100, // rough MVP
            dscr: ((input.monthlyRent * (1 - input.vacancyPct / 100)) - (input.taxesMonthly + input.insuranceMonthly + input.hoaMonthly + input.otherMonthly + input.monthlyRent * (input.managementPct + input.maintenancePct) / 100)) / Math.max(1, loans.reduce((s, l) => s + l.payment, 0))
        },
        timeline,
        yearly: [] // fill in later
    };

    return output;
}
