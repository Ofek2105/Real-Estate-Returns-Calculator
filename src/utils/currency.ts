export function fmtMoney(n: number, currency: 'EUR' | 'USD' | 'ILS') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
}

export function fmtPct(n: number) {
    return `${n.toFixed(1)}%`;
}
