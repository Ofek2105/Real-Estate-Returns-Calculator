// Standard fixed-rate monthly payment (annuity)
import type { PaymentTableState, Row } from '../types/finance';

export function sumStagePercents(state: PaymentTableState): number {
    return state.stages.reduce((s, st) => s + (Number.isFinite(st.percent) ? st.percent : 0), 0);
}

export function getRow(state: PaymentTableState, builtin: string): Row | undefined {
    return state.rows.find(r => r.builtin === (builtin as any));
}

export function computeTaxBase(state: PaymentTableState): number {
    const apt = getRow(state, 'apartment')?.amount100 ?? 0;
    const park = getRow(state, 'parking')?.amount100 ?? 0;
    return apt + park;
}

export function computeFullPrice(state: PaymentTableState): number {
    const taxBase = computeTaxBase(state);
    const tax = (state.taxPercent / 100) * taxBase;
    const apt = getRow(state, 'apartment')?.amount100 ?? 0;
    const park = getRow(state, 'parking')?.amount100 ?? 0;
    return apt + park + tax;
}

export function computePercentOfFullRowsTotal(state: PaymentTableState): number {
    const full = computeFullPrice(state);
    return state.rows.reduce((acc, r) => {
        if (r.kind === 'percent_of_full' && typeof r.percentOfFull === 'number') {
            acc += (r.percentOfFull / 100) * full;
        }
        return acc;
    }, 0);
}

export function computeExtrasAmountRowsTotal(state: PaymentTableState): number {
    return state.rows.reduce((acc, r) => {
        if (r.kind === 'amount' && !r.builtin) {
            acc += r.amount100 ?? 0;
        }
        return acc;
    }, 0);
}

export function computeBuiltinExtras(state: PaymentTableState): { furniture: number; notary: number; appraiser: number } {
    const full = computeFullPrice(state);
    const furniture = getRow(state, 'furniture')?.amount100 ?? 0;
    const notary = (state.notaryPercent / 100) * full;
    const appraiser = (state.appraiserPercent / 100) * full;
    return { furniture, notary, appraiser };
}

export function computeTotal100(state: PaymentTableState): number {
    const full = computeFullPrice(state);
    const { furniture, notary, appraiser } = computeBuiltinExtras(state);
    const customAmountRows = computeExtrasAmountRowsTotal(state);
    const customPercentOfFullRows = computePercentOfFullRowsTotal(state);
    return full + furniture + notary + appraiser + customAmountRows + customPercentOfFullRows;
}

export function isStateValid(state: PaymentTableState): { ok: boolean; reason?: string } {
    // Stages must sum to exactly 100
    const sum = sumStagePercents(state);
    if (Math.round(sum * 1000) !== 100000) {
        return { ok: false, reason: `Stage percentages must sum to 100%. Currently: ${sum.toFixed(2)}%.` };
    }
    // Non-negative, finite amounts
    for (const r of state.rows) {
        if (r.kind === 'amount' && r.amount100 !== undefined) {
            if (!Number.isFinite(r.amount100) || r.amount100 < 0) {
                return { ok: false, reason: `Row "${r.label}" must be a non-negative number.` };
            }
        }
        if (r.kind === 'percent_of_full' && r.percentOfFull !== undefined) {
            if (!Number.isFinite(r.percentOfFull) || r.percentOfFull < 0 || r.percentOfFull > 1000) {
                return { ok: false, reason: `Row "${r.label}" percent must be between 0 and 1000.` };
            }
        }
    }
    // Percent fields sanity
    for (const v of [state.taxPercent, state.notaryPercent, state.appraiserPercent]) {
        if (!Number.isFinite(v) || v < 0 || v > 1000) {
            return { ok: false, reason: `Percent values must be between 0 and 1000.` };
        }
    }
    // Full price should be ≥ base components
    const base = computeTaxBase(state);
    const full = computeFullPrice(state);
    if (!Number.isFinite(full) || full < base) {
        return { ok: false, reason: `Full Price is invalid.` };
    }
    return { ok: true };
}


export function pmt(rateMonthly: number, nper: number, pv: number): number {
    if (rateMonthly === 0) return -(pv / nper);
    const r = rateMonthly;
    return -(pv * r) / (1 - Math.pow(1 + r, -nper));
}
