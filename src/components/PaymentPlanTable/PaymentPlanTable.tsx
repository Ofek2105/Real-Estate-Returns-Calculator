import React, { useMemo, useState, useEffect } from 'react';
import type { PaymentTableState, Row, Stage } from '../../types/finance';
import { formatCurrency, isFiniteNumber } from '../../utils/format';
import {
    computeFullPrice,
    computeTaxBase,
    computeTotal100,
    isStateValid,
    sumStagePercents
} from '../../utils/math';
import InlineEditable from '../InlineEditable/InlineEditable';
import { useToasts } from '../ToastProvider/ToastProvider';
import './PaymentPlanTable.css';

type Props = {
    state: PaymentTableState;
    onChange: (s: PaymentTableState) => void;
    onInvestmentCost: (val: number | null) => void;
};

function uuid() { return Math.random().toString(36).slice(2); }

// --- FX dropdown data ---
const popularCurrencies = ['ILS', 'USD', 'GBP', 'RON', 'JPY', 'CHF', 'AUD'] as const;
type FxCode = typeof popularCurrencies[number] | string;

// Reasonable fallbacks (1 BASE -> X target). You can tweak these.
const defaultRateMap: Record<string, number> = {
    ILS: 3.98,
    USD: 1.08,
    GBP: 0.84,
    RON: 4.97,
    JPY: 168.0,
    CHF: 0.95,
    AUD: 1.62,
};

export default function PaymentPlanTable({ state, onChange, onInvestmentCost }: Props) {
    const { addToast } = useToasts();

    const percentSum = useMemo(() => sumStagePercents(state), [state]);
    const validity = useMemo(() => isStateValid(state), [state]);
    const baseCurrency = state.currency; // table currency

    // compute derived numbers
    const taxBase = computeTaxBase(state);
    const fullPrice = computeFullPrice(state);
    const total100 = computeTotal100(state);

    // ---- FX state ----
    // Selected target currency and the map of fetched/known rates vs BASE (state.currency)
    const [fxTo, setFxTo] = useState<FxCode>('ILS');
    const [fxMap, setFxMap] = useState<Record<string, number>>(() => ({ ...defaultRateMap }));
    // Derived convenience: current rate (1 BASE -> fxTo)
    const fxRate = fxMap[fxTo] ?? 0;

    // Fetch live rates once on mount and whenever base currency changes.
    // Uses exchangerate.host (free, no key). If it fails, we keep defaults.
    useEffect(() => {
        let isActive = true;
        const controller = new AbortController();

        async function fetchRates() {
            try {
                const symbols = popularCurrencies.join(',');
                const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(baseCurrency)}&symbols=${encodeURIComponent(symbols)}`;
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json() as { rates?: Record<string, number> };
                if (isActive && data?.rates) {
                    setFxMap(prev => {
                        // merge: prefer fetched, fall back to existing defaults for anything missing
                        const merged: Record<string, number> = { ...prev };
                        for (const k of popularCurrencies) {
                            if (typeof data.rates[k] === 'number') merged[k] = data.rates[k]!;
                        }
                        // Ensure identity (e.g., if user picks same as base)
                        merged[baseCurrency] = 1;
                        return merged;
                    });
                }
            } catch {
                // Silently keep defaults; optional toast:
                // addToast('Live FX rates unavailable, using defaults.');
            }
        }

        fetchRates();
        return () => {
            isActive = false;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseCurrency]);

    useEffect(() => {
        if (!validity.ok) {
            addToast(validity.reason || 'Invalid inputs.');
            onInvestmentCost(null);
        } else {
            onInvestmentCost(Number.isFinite(total100) ? total100 : null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validity.ok, total100, validity.reason]);

    // Stage ops
    const setStages = (stages: Stage[]) => onChange({ ...state, stages });
    const addStage = () => {
        const next: Stage = {
            id: uuid(),
            label: `Stage ${state.stages.length + 1}`,
            date: new Date().toISOString().slice(0, 10),
            percent: 0
        };
        onChange({ ...state, stages: [...state.stages, next] });
    };
    const removeStage = (id: string) => {
        onChange({ ...state, stages: state.stages.filter(s => s.id !== id) });
    };
    const updateStage = (id: string, patch: Partial<Stage>) => {
        setStages(state.stages.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    // Row ops
    const updateRow = (id: string, patch: Partial<Row>) => {
        onChange({ ...state, rows: state.rows.map(r => r.id === id ? { ...r, ...patch } : r) });
    };
    const addCustomAmountRow = () => {
        onChange({
            ...state,
            rows: [
                ...state.rows.slice(0, -1),
                { id: uuid(), label: 'Custom Amount', kind: 'amount', amount100: 0 },
                state.rows[state.rows.length - 1],
            ],
        });
    };
    const addCustomPercentRow = () => {
        onChange({
            ...state,
            rows: [
                ...state.rows.slice(0, -1),
                { id: uuid(), label: '% of Full Price', kind: 'percent_of_full', percentOfFull: 1 },
                state.rows[state.rows.length - 1],
            ],
        });
    };
    const removeRow = (id: string) => {
        const row = state.rows.find(r => r.id === id);
        if (row?.builtin || row?.kind === 'computed' || row?.kind === 'separator' || row?.label === 'Total') {
            addToast('This row cannot be removed.');
            return;
        }
        onChange({ ...state, rows: state.rows.filter(r => r.id !== id) });
    };

    const renderStageCell = (rowAmount100: number, percent: number) => {
        const amt = rowAmount100 * (percent / 100);
        return <span>{formatCurrency(amt, baseCurrency)}</span>;
    };

    const renderRow = (r: Row) => {
        // 100% column (base)
        const hundredCell = (() => {
            if (r.kind === 'separator') return <span className="sep" />;
            if (r.kind === 'computed' || r.isLocked) {
                if (r.builtin === 'tax') {
                    const taxAmt = (state.taxPercent / 100) * taxBase;
                    return <span>{formatCurrency(taxAmt, baseCurrency)}</span>;
                }
                if (r.builtin === 'full_price') {
                    return <span>{formatCurrency(fullPrice, baseCurrency)}</span>;
                }
                if (r.builtin === 'notary') {
                    const val = (state.notaryPercent / 100) * fullPrice;
                    return <span>{formatCurrency(val, baseCurrency)}</span>;
                }
                if (r.builtin === 'appraiser') {
                    const val = (state.appraiserPercent / 100) * fullPrice;
                    return <span>{formatCurrency(val, baseCurrency)}</span>;
                }
                if (r.builtin === 'total') {
                    return <span className="strong">{formatCurrency(total100, baseCurrency)}</span>;
                }
                return <span>—</span>;
            }
            if (r.kind === 'amount') {
                return (
                    <InlineEditable
                        value={String(r.amount100 ?? 0)}
                        display={formatCurrency(r.amount100 ?? 0, baseCurrency)}
                        onCommit={(v) => {
                            const cleaned = v.replace(/[^\d.-]/g, '');
                            const num = Number(cleaned);
                            if (!isFiniteNumber(num) || num < 0) {
                                addToast('Amount must be a non-negative number.');
                                return;
                            }
                            updateRow(r.id, { amount100: num });
                        }}
                        type="number"
                        title="Click to edit amount"
                    />
                );
            }
            if (r.kind === 'percent_of_full') {
                const derived = ((r.percentOfFull ?? 0) / 100) * fullPrice;
                return <span>{formatCurrency(derived, baseCurrency)}</span>;
            }
            return <span>—</span>;
        })();

        const stageCells = state.stages.map(st => {
            let baseAmount = 0;
            if (r.kind === 'amount' && r.amount100) baseAmount = r.amount100;
            else if (r.builtin === 'tax') baseAmount = (state.taxPercent / 100) * taxBase;
            else if (r.builtin === 'full_price') baseAmount = fullPrice;
            else if (r.builtin === 'notary') baseAmount = (state.notaryPercent / 100) * fullPrice;
            else if (r.builtin === 'appraiser') baseAmount = (state.appraiserPercent / 100) * fullPrice;
            else if (r.builtin === 'total') baseAmount = total100;
            else if (r.kind === 'percent_of_full') baseAmount = ((r.percentOfFull ?? 0) / 100) * fullPrice;
            return (
                <td key={st.id} className="num">
                    {renderStageCell(baseAmount, st.percent)}
                </td>
            );
        });

        const labelEl = (
            <div className="row-label">
                <InlineEditable
                    value={r.label}
                    onCommit={(v) => {
                        if (!v.trim()) { addToast('Label cannot be empty.'); return; }
                        updateRow(r.id, { label: v.trim() });
                    }}
                    title="Rename row"
                />
                {r.builtin === 'tax' && <span className="muted">&nbsp;[</span>}
                {r.builtin === 'tax' && (
                    <InlineEditable
                        value={String(state.taxPercent)}
                        onCommit={(v) => {
                            const num = Number(v.replace('%', ''));
                            if (!isFiniteNumber(num) || num < 0 || num > 1000) { addToast('Tax % must be 0–1000.'); return; }
                            onChange({ ...state, taxPercent: num });
                        }}
                        type="percent"
                        title="Tax percent"
                        className="inline-small"
                    />
                )}
                {r.builtin === 'tax' && <span className="muted">%]</span>}
                {r.builtin === 'notary' && (
                    <>
                        <span className="muted">&nbsp;[</span>
                        <InlineEditable
                            value={String(state.notaryPercent)}
                            onCommit={(v) => {
                                const num = Number(v.replace('%', ''));
                                if (!isFiniteNumber(num) || num < 0 || num > 1000) { addToast('Notary % must be 0–1000.'); return; }
                                onChange({ ...state, notaryPercent: num });
                            }}
                            type="percent"
                            title="Notary percent of Full Price"
                            className="inline-small"
                        />
                        <span className="muted">%]</span>
                    </>
                )}
                {r.builtin === 'appraiser' && (
                    <>
                        <span className="muted">&nbsp;[</span>
                        <InlineEditable
                            value={String(state.appraiserPercent)}
                            onCommit={(v) => {
                                const num = Number(v.replace('%', ''));
                                if (!isFiniteNumber(num) || num < 0 || num > 1000) { addToast('Appraiser % must be 0–1000.'); return; }
                                onChange({ ...state, appraiserPercent: num });
                            }}
                            type="percent"
                            title="Appraiser percent of Full Price"
                            className="inline-small"
                        />
                        <span className="muted">%]</span>
                    </>
                )}
                {r.kind === 'percent_of_full' && (
                    <>
                        <span className="muted">&nbsp;[</span>
                        <InlineEditable
                            value={String(r.percentOfFull ?? 0)}
                            onCommit={(v) => {
                                const num = Number(v.replace('%', ''));
                                if (!isFiniteNumber(num) || num < 0 || num > 1000) { addToast('Percent must be 0–1000.'); return; }
                                updateRow(r.id, { percentOfFull: num });
                            }}
                            type="percent"
                            title="% of Full Price"
                            className="inline-small"
                        />
                        <span className="muted">% of Full]</span>
                    </>
                )}
            </div>
        );

        const canRemove = !r.builtin && r.kind !== 'separator' && r.label !== 'Total';

        return (
            <tr key={r.id} className={r.builtin === 'total' ? 'total-row' : ''}>
                <th className="label">
                    {labelEl}
                    {canRemove && <button className="row-remove" onClick={() => removeRow(r.id)} title="Remove row">×</button>}
                </th>
                <td className="num">{hundredCell}</td>
                {stageCells}
            </tr>
        );
    };

    // ---- FX converted cells (mirrors TOTAL row, but in fxTo) ----
    const renderFxTotal100Cell = () => {
        if (!isFiniteNumber(total100) || !isFiniteNumber(fxRate) || fxRate <= 0) return <span>—</span>;
        const converted = total100 * fxRate;
        return <span className="strong">{formatCurrency(converted, fxTo)}</span>;
    };

    const renderFxStageCell = (percent: number) => {
        if (!isFiniteNumber(total100) || !isFiniteNumber(fxRate) || fxRate <= 0) return <span>—</span>;
        const baseAmt = total100 * (percent / 100);
        const converted = baseAmt * fxRate;
        return <span>{formatCurrency(converted, fxTo)}</span>;
    };

    return (
        <div className="payment-table-wrap">
            <div className="table-actions">
                <div className="left">
                    <button onClick={addCustomAmountRow}>+ Add row (Amount)</button>
                    <button onClick={addCustomPercentRow}>+ Add row (% of Full)</button>
                    <button className="add-stage-btn" onClick={addStage}>+ Add Stage</button>
                    <span className={`sum-chip ${Math.round(percentSum) === 100 ? 'ok' : 'bad'}`}>
                        Sum: {percentSum.toFixed(2)}%
                    </span>
                </div>
                <div className="right currency">Currency: {baseCurrency}</div>
            </div>

            <table className="payment-table">
                <thead>
                    <tr>
                        <th className="label">Item</th>
                        <th className="num">100%</th>
                        {state.stages.map(s => (
                            <th key={s.id} className="th-stage">
                                <div className="stage-header">
                                    <div className="stage-line">
                                        <InlineEditable
                                            value={s.label}
                                            onCommit={(v) => updateStage(s.id, { label: v })}
                                            title="Stage label"
                                            className="stage-label"
                                        />
                                        <button
                                            className="stage-remove"
                                            onClick={() => removeStage(s.id)}
                                            aria-label="Remove stage"
                                            title="Remove stage"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="stage-line">
                                        <InlineEditable
                                            value={s.date}
                                            onCommit={(v) => updateStage(s.id, { date: v })}
                                            type="date"
                                            title="Stage date"
                                            className="stage-mini"
                                        />
                                    </div>
                                    <div className="stage-line">
                                        <InlineEditable
                                            value={String(s.percent)}
                                            display={`${s.percent}%`}
                                            onCommit={(v) => updateStage(s.id, { percent: Number(v.replace('%', '')) })}
                                            type="percent"
                                            title="Stage percent"
                                            className="stage-mini"
                                        />
                                        <span className="pct-sign">%</span>
                                    </div>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {state.rows.map(renderRow)}

                    {/* --- FX row mirrors TOTAL row but converted --- */}
                    <tr className="fx-row">
                        <th className="label">
                            <div className="fx-label">
                                Currency Ex:&nbsp;
                                <select
                                    className="fx-select"
                                    value={fxTo}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        setFxTo(next);
                                        // if we don't have a rate for the new one, initialize a sane default or 1
                                        if (fxMap[next] == null) {
                                            setFxMap(prev => ({ ...prev, [next]: next === baseCurrency ? 1 : defaultRateMap[next] ?? 1 }));
                                        }
                                    }}
                                    title="Choose target currency"
                                >
                                    {/* include base currency as an option too */}
                                    {[baseCurrency, ...popularCurrencies.filter(c => c !== baseCurrency)].map(code => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>
                                <span className="fx-from">
                                    &nbsp;(1 {baseCurrency} →{' '}
                                </span>
                                <InlineEditable
                                    value={String(fxRate || 0)}
                                    display={`${(fxRate || 0).toString()} ${fxTo})`}
                                    onCommit={(v) => {
                                        const cleaned = v.replace(/[^\d.-]/g, '');
                                        const num = Number(cleaned);
                                        if (!isFiniteNumber(num) || num <= 0) {
                                            addToast('Exchange rate must be a positive number.');
                                            return;
                                        }
                                        setFxMap(prev => ({ ...prev, [fxTo]: num }));
                                    }}
                                    type="number"
                                    title="Edit exchange rate"
                                    className="inline-small"
                                    step={0.01}   
                                />
                            </div>
                        </th>

                        {/* 100% cell, converted total */}
                        <td className="num">
                            {renderFxTotal100Cell()}
                        </td>

                        {/* stage cells: converted per stage percent of TOTAL */}
                        {state.stages.map(st => (
                            <td key={st.id} className="num">
                                {renderFxStageCell(st.percent)}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
