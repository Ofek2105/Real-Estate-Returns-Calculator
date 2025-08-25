// src/components/ResultsChart/ResultsChart.tsx
import React, { useMemo, useState } from 'react';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Props = {
    currency: string;
    fullPriceNow: number;            // computed Full Price from table
    investmentCost: number | null;   // not used here (kept for future)
    monthlyRent: number;

    propAppreciationPctYear: number; // %/yr on Full Price
    rentAppreciationPctYear: number; // %/yr on Monthly Rent
    opExPctOfRent: number;           // % of rent (OpEx)

    horizonMonths?: number;                   // controlled
    onHorizonMonthsChange?: (m: number) => void;
};

export default function ResultsChart({
    currency,
    fullPriceNow,
    investmentCost, // eslint-disable-line @typescript-eslint/no-unused-vars
    monthlyRent,
    propAppreciationPctYear,
    rentAppreciationPctYear,
    opExPctOfRent,
    horizonMonths = 120,
    onHorizonMonthsChange,
}: Props) {

    // Inline editor buffer (so typing doesn’t jitter the chart until commit)
    const [draftMonths, setDraftMonths] = useState(String(horizonMonths));
    React.useEffect(() => setDraftMonths(String(horizonMonths)), [horizonMonths]);

    const months = clampInt(Number.isFinite(+horizonMonths) ? +horizonMonths : 120, 1, 600);

    const data = useMemo(() => {
        const rProp = (propAppreciationPctYear / 100) / 12;
        const rRent = (rentAppreciationPctYear / 100) / 12;
        const opEx = Math.max(0, Math.min(1, opExPctOfRent / 100));

        const rows: {
            m: number;
            year: string;
            price: number;
            equityGain: number;
            cumulativeNetCF: number;
            netCFMonth: number;
        }[] = [];

        let cumulativeNetCF = 0;

        for (let m = 0; m <= months; m++) {
            const price = fullPriceNow * Math.pow(1 + rProp, m);
            const equityGain = price - fullPriceNow;

            const rentM = monthlyRent * Math.pow(1 + rRent, m);
            const netCFMonth = rentM * (1 - opEx); // add DS/CapEx later if/when modeled
            cumulativeNetCF += netCFMonth;

            rows.push({
                m,
                year: `Y${Math.floor(m / 12) + 1}`,
                price,
                equityGain,
                cumulativeNetCF,
                netCFMonth,
            });
        }
        return rows;
    }, [months, fullPriceNow, monthlyRent, propAppreciationPctYear, rentAppreciationPctYear, opExPctOfRent]);

    return (
        <div className="results-chart">
            {/* Header with inline months editor */}
            <div className="ra-chart-header" style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                <h3 className="ra-chart-title" style={{ margin: 0 }}>Projections (combined)</h3>
                <label style={{ color: 'var(--text-2)', fontSize: 13 }}>
                    Horizon:&nbsp;
                    <input
                        type="number"
                        min={1}
                        max={600}
                        step={12}
                        value={draftMonths}
                        onChange={(e) => setDraftMonths(e.target.value)}
                        onBlur={() => {
                            const v = clampInt(parseInt(draftMonths, 10), 1, 600);
                            onHorizonMonthsChange?.(v);
                            setDraftMonths(String(v));
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                        }}
                        style={{
                            width: 80,
                            background: 'var(--panel)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 13,
                            outline: 'none',
                        }}
                        aria-label="Projection horizon in months"
                        title="Projection horizon in months"
                    />
                    &nbsp;months
                </label>
            </div>

            <div className="rc-card">
                <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart data={data} margin={{ top: 8, right: 24, left: 12, bottom: 16 }}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="m"
                            tickFormatter={(m) => (m % 12 === 0 ? `Y${m / 12 + 1}` : '')}
                            tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                            interval={0}
                            height={28}
                        />
                        {/* Single € axis for everything */}
                        <YAxis
                            tick={{ fill: 'var(--text-2)', fontSize: 12 }}
                            tickFormatter={(v) => formatCompactCurrency(v, currency)}
                            width={72}
                        />
                        <Tooltip
                            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                            formatter={(val: any, name: string) => {
                                if (name === 'Property Value' || name === 'Equity Gain' || name === 'Cumulative Net CF' || name === 'Net CF / month') {
                                    return [formatCompactCurrency(Number(val), currency), name];
                                }
                                return [String(val), name];
                            }}
                            labelFormatter={(m) => `Month ${m}`}
                        />
                        <Legend wrapperStyle={{ color: 'var(--text-2)' }} />

                        {/* Cumulative Net CF as a subtle area (so it reads as “build-up”) */}
                        <Area
                            type="monotone"
                            dataKey="cumulativeNetCF"
                            name="Cumulative Net CF"
                            stroke="var(--chart-3)"
                            fill="var(--chart-3)"
                            fillOpacity={0.12}
                            strokeWidth={2}
                        />

                        {/* Property Value (primary line) */}
                        <Line
                            type="monotone"
                            dataKey="price"
                            name="Property Value"
                            stroke="var(--chart-1)"
                            dot={false}
                            strokeWidth={2.2}
                        />

                        {/* Equity Gain (helper line) */}
                        <Line
                            type="monotone"
                            dataKey="equityGain"
                            name="Equity Gain"
                            stroke="var(--chart-2)"
                            dot={false}
                            strokeWidth={1.6}
                        />

                        {/* Monthly Net CF (thin context line) */}
                        <Line
                            type="monotone"
                            dataKey="netCFMonth"
                            name="Net CF / month"
                            stroke="var(--chart-4)"
                            dot={false}
                            strokeWidth={1.2}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function clampInt(n: number, min: number, max: number) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
}

/* helpers */
function formatCompactCurrency(n: number, currency: string) {
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(n);
    } catch {
        return `${currency} ${n.toFixed(0)}`;
    }
}
