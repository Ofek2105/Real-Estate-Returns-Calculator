import React, { useMemo } from 'react';
import InlineEditable from '../InlineEditable/InlineEditable';
import { formatCurrency } from '../../utils/format';

import './PurchaseOpsSimple.css';


type Props = {
    // Basics
    investmentCost: number | null;
    currency: string;
    monthlyRent: number;
    onMonthlyRentChange: (n: number) => void;

    // Advanced (editable inside the <details>)
    propAppreciationPctYear: number;        // %/year applied to Full Price
    onPropAppreciationChange: (n: number) => void;

    opExPctOfRent: number;                  // % of rent
    onOpExChange: (n: number) => void;

    rentAppreciationPctYear: number;        // %/year applied to Monthly Rent
    onRentAppreciationChange: (n: number) => void;
};

export default function PurchaseOpsSimple({
    investmentCost,
    currency,
    monthlyRent,
    onMonthlyRentChange,
    propAppreciationPctYear,
    onPropAppreciationChange,
    opExPctOfRent,
    onOpExChange,
    rentAppreciationPctYear,
    onRentAppreciationChange,
}: Props) {

    // Derived (current) values
    const noiAnnual = useMemo(() => {
        const opEx = clamp01(opExPctOfRent / 100);
        return monthlyRent * (1 - opEx) * 12;
    }, [monthlyRent, opExPctOfRent]);

    const capRate = useMemo(() => {
        if (!Number.isFinite(noiAnnual) || noiAnnual < 0) return NaN;
        if (!Number.isFinite(investmentCost ?? NaN) || !investmentCost || investmentCost <= 0) return NaN;
        return noiAnnual / investmentCost;
    }, [noiAnnual, investmentCost]);

    return (
        <div className="purchase-ops">
            <h3>Purchase & Operations</h3>

            <div className="ops-grid">
                <div className="ops-field">
                    <label>Investment Cost</label>
                    <div className={`readonly ${investmentCost === null ? 'bad' : ''}`}>
                        {investmentCost === null ? 'NaN' : formatCurrency(investmentCost, currency)}
                    </div>
                </div>

                <div className="ops-field">
                    <label htmlFor="monthly-rent">Monthly Rent</label>
                    <input
                        id="monthly-rent"
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isFinite(n) || n < 0) return;
                            onMonthlyRentChange(n);
                        }}
                    />
                </div>
            </div>

            {/* NEW: Current results shown right under the two fields */}
            <div className="ops-results">
                <div className="res-item">
                    <div className="res-label">Net Operating Income (NOI)</div>
                    <div className="res-value">{formatCurrency(noiAnnual, currency)}</div>
                    <div className="res-hint">Annual</div>
                </div>
                <div className="res-item">
                    <div className="res-label">Cap Rate</div>
                    <div className={`res-value ${Number.isFinite(capRate) ? '' : 'bad'}`}>
                        {Number.isFinite(capRate) ? `${(capRate * 100).toFixed(2)}%` : 'NaN'}
                    </div>
                    <div className="res-hint">NOI ÷ Purchase Price</div>
                </div>
            </div>

            {/* Advanced config lives here (inline editables) */}
            <details className="advanced" open={false}>
                <summary>Advanced</summary>
                <div className="adv-grid">
                    <div className="adv-field">
                        <label>Property appreciation / year</label>
                        <div className="editline">
                            <InlineEditable
                                value={String(propAppreciationPctYear)}
                                display={`${propAppreciationPctYear}%`}
                                onCommit={(v) => {
                                    const n = Number(v.replace('%', ''));
                                    if (!Number.isFinite(n) || n < 0) return;
                                    onPropAppreciationChange(n);
                                }}
                                type="percent"
                                title="% per year (applied to Full Price)"
                            />
                            <span className="suffix">%</span>
                        </div>
                        <div className="hint">Applied to Full Price</div>
                    </div>

                    <div className="adv-field">
                        <label>Operating expenses</label>
                        <div className="editline">
                            <InlineEditable
                                value={String(opExPctOfRent)}
                                display={`${opExPctOfRent}%`}
                                onCommit={(v) => {
                                    const n = Number(v.replace('%', ''));
                                    if (!Number.isFinite(n) || n < 0 || n > 100) return;
                                    onOpExChange(n);
                                }}
                                type="percent"
                                title="% of monthly rent"
                            />
                            <span className="suffix">%</span>
                        </div>
                        <div className="hint">% of rent</div>
                    </div>

                    <div className="adv-field">
                        <label>Rent appreciation / year</label>
                        <div className="editline">
                            <InlineEditable
                                value={String(rentAppreciationPctYear)}
                                display={`${rentAppreciationPctYear}%`}
                                onCommit={(v) => {
                                    const n = Number(v.replace('%', ''));
                                    if (!Number.isFinite(n) || n < 0) return;
                                    onRentAppreciationChange(n);
                                }}
                                type="percent"
                                title="% per year (applied to monthly rent)"
                            />
                            <span className="suffix">%</span>
                        </div>
                        <div className="hint">Applied to monthly rent</div>
                    </div>
                </div>
            </details>
        </div>
    );
}

/* helpers */
function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}
