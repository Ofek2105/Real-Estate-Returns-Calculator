// before (likely):
// export function fmtMoney(n: number, code: 'EUR' | 'USD' | 'ILS'): string { ... }

import type { CurrencyCode } from '../types/finance';

export function fmtMoney(
    n: number,
    code: CurrencyCode,   // <-- accept your full app currency union
    opts: Intl.NumberFormatOptions = {}
): string {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: code,
            maximumFractionDigits: Math.abs(n) < 1000 ? 2 : 0,
            ...opts,
        }).format(n);
    } catch {
        // Fallback if Intl doesn't know this code (rare)
        return `${code} ${n.toLocaleString()}`;
    }
}


export function fmtPct(n: number) {
    return `${n.toFixed(1)}%`;
}
