export function formatCurrency(n: number | null | undefined, currency: string) {
    if (n === null || n === undefined || Number.isNaN(n)) return 'NaN';
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        // fallback
        return `${currency} ${n.toFixed(2)}`;
    }
}

export const clampNumber = (v: number, min = -Infinity, max = Infinity) =>
    Math.max(min, Math.min(max, v));

export const isFiniteNumber = (v: unknown): v is number =>
    typeof v === 'number' && Number.isFinite(v);
