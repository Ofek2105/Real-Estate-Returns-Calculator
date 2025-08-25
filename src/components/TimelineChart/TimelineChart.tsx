// src/components/ResultsChart/TimelineChart.tsx
import './TimelineChart.css';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import type { CurrencyCode, AnalysisOutput } from '../../types/finance';
import { fmtMoney } from '../../utils/currency';

type Props = {
    series: AnalysisOutput['timeline'];
    currency: CurrencyCode;
    /** Absolute investment cost (same units/currency as the series). */
    investmentCost: number; // ensure parent passes a number
};

export function TimelineChart({ series, currency, investmentCost }: Props) {
    const data = series.map((p) => ({
        m: p.month,
        y: `Y${p.year}`,
        loanBal: Math.round(p.totalLoanBalance),
        equity: Math.round(p.equity),
        cashIn: Math.round(p.cumulativeCashInvested),
        netCF: Math.round(p.cumulativeNetCashFlow),
    }));

    // Build Y-domain so the Investment Cost line is always visible
    const ySeries = data.flatMap((d) => [d.loanBal, d.equity, d.cashIn, d.netCF]);
    const yMin = Math.min(...ySeries, toNum(investmentCost));
    const yMax = Math.max(...ySeries, toNum(investmentCost));
    const domain: [number, number] = [niceMin(yMin), niceMax(yMax)];

    return (
        <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis domain={domain} tickFormatter={abbr} />
                    <Tooltip formatter={(v: any) => fmtMoney(Number(v), currency)} />
                    <Legend />

                    {/* Series */}
                    <Line type="monotone" dataKey="loanBal" name="Loan Balance" stroke="var(--chart-1, #5B8FF9)" dot={false} />
                    <Line type="monotone" dataKey="cashIn" name="Cumulative Cash In" stroke="var(--chart-3, #5AD8A6)" dot={false} />
                    <Line type="monotone" dataKey="netCF" name="Cumulative Net CF" stroke="var(--chart-4, #F6BD16)" dot={false} />
                    <Line type="monotone" dataKey="equity" name="Equity" stroke="var(--chart-2, #5D7092)" dot={false} />

                    {/* Constant Investment Cost line */}
                    <ReferenceLine
                        y={investmentCost}
                        ifOverflow="extendDomain"
                        stroke="var(--chart-5, #EB6F6F)"
                        strokeDasharray="5 5"
                        label={{
                            value: `Investment Cost (${fmtMoney(investmentCost, currency)})`,
                            position: 'right',
                            fill: 'var(--text-1, #e6edf6)',
                        }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ---------- helpers ---------- */

function abbr(n: number) {
    const a = Math.abs(n);
    if (a >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (a >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(n);
}

function toNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function niceMin(v: number) {
    if (!isFinite(v)) return 0;
    if (v === 0) return 0;
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(v))) - 1));
    return Math.floor(v / mag) * mag;
}

function niceMax(v: number) {
    if (!isFinite(v)) return 0;
    if (v === 0) return 0;
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(v))) - 1));
    return Math.ceil(v / mag) * mag;
}

export default TimelineChart;
