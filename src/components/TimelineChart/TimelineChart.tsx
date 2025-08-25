import './TimelineChart.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import type { CurrencyCode, AnalysisOutput } from '../../types/finance';
import { fmtMoney } from '../../utils/currency';

export function TimelineChart({ series, currency }: { series: AnalysisOutput['timeline']; currency: CurrencyCode }) {
    const data = series.map(p => ({
        m: p.month,
        y: `Y${p.year}`,
        loanBal: Math.round(p.totalLoanBalance),
        equity: Math.round(p.equity),
        cashIn: Math.round(p.cumulativeCashInvested),
        netCF: Math.round(p.cumulativeNetCashFlow),
    }));

    return (
        <div style={{ width: '100%', height: 420 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="m" />
                    <YAxis tickFormatter={(v) => abbr(v)} />
                    <Tooltip formatter={(v: any) => fmtMoney(Number(v), currency)} />
                    <Legend />
                    <Line type="monotone" dataKey="loanBal" name="Loan Balance" stroke="var(--chart-1)" dot={false} />
                    <Line type="monotone" dataKey="cashIn" name="Cumulative Cash In" stroke="var(--chart-3)" dot={false} />
                    <Line type="monotone" dataKey="netCF" name="Cumulative Net CF" stroke="var(--chart-4)" dot={false} />
                    <Line type="monotone" dataKey="equity" name="Equity" stroke="var(--chart-2)" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function abbr(n: number) {
    const a = Math.abs(n);
    if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (a >= 1_000) return (n / 1_000).toFixed(1) + 'k';
    return String(n);
}
