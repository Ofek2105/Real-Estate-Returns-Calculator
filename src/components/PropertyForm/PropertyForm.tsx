// src/components/PropertyForm/PropertyForm.tsx

import Field from '../Field/Field';
import MoneyInput from '../MoneyInput/MoneyInput';
import PercentInput from '../PercentInput/PercentInput';
import NumberInput from '../NumberInput/NumberInput';
import type { AnalysisInput } from '../../types/finance';
import './PropertyForm.css';

type Props = {
    value: AnalysisInput;
    onChange: (v: AnalysisInput) => void;
};

export default function PropertyForm({ value: v, onChange }: Props) {
    return (
        <div className="property-form">
            {/* PURCHASE */}
            <div className="section">
                <h4>Purchase</h4>
                <div className="form-grid">
                    <Field label="Purchase price">
                        <MoneyInput
                            value={v.purchasePrice}
                            onChange={(n) => onChange({ ...v, purchasePrice: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field
                        label="Closing costs"
                        help="Upfront transaction costs (title, escrow, fees, taxes). Typical: 2–5% of price. Starter: ~3%."
                    >
                        <MoneyInput
                            value={v.closingCosts}
                            onChange={(n) => onChange({ ...v, closingCosts: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field
                        label="Rehab costs"
                        help="Repairs/renovations before renting. Include materials + labor. Default 0 if none."
                    >
                        <MoneyInput
                            value={v.rehabCosts}
                            onChange={(n) => onChange({ ...v, rehabCosts: n })}
                            currency={v.currency}
                        />
                    </Field>
                </div>
            </div>

            {/* OPERATIONS */}
            <div className="section">
                <h4>Operations</h4>
                <div className="form-grid">
                    <Field
                        label="Monthly rent"
                        help="Gross scheduled rent per month. Use market rent for your unit."
                    >
                        <MoneyInput
                            value={v.monthlyRent}
                            onChange={(n) => onChange({ ...v, monthlyRent: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field
                        label="Vacancy (AirBNB) %"
                        help="Percent of time vacant (lost rent). Typical: 4–8%. Default: 5%."
                    >
                        <PercentInput
                            value={v.vacancyPct}
                            onChange={(n) => onChange({ ...v, vacancyPct: n })}
                        />
                    </Field>

                    <Field
                        label="Taxes / mo"
                        help="Property tax per month (or annual ÷ 12). If unknown, start with 1.0–1.5% of value per year."
                    >
                        <MoneyInput
                            value={v.taxesMonthly}
                            onChange={(n) => onChange({ ...v, taxesMonthly: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field
                        label="Insurance / mo"
                        help="Landlord policy cost. If unknown: 50–100 per month for small units."
                    >
                        <MoneyInput
                            value={v.insuranceMonthly}
                            onChange={(n) => onChange({ ...v, insuranceMonthly: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field label="HOA / mo" help="Monthly homeowners association dues. 0 if none.">
                        <MoneyInput
                            value={v.hoaMonthly}
                            onChange={(n) => onChange({ ...v, hoaMonthly: n })}
                            currency={v.currency}
                        />
                    </Field>

                    <Field
                        label="Mgmt % of rent"
                        help="Property manager fee as % of collected rent. Typical: 8–10%. Default: 8%."
                    >
                        <PercentInput
                            value={v.managementPct}
                            onChange={(n) => onChange({ ...v, managementPct: n })}
                        />
                    </Field>

                    <Field
                        label="Maintenance % of rent"
                        help="Ongoing repairs reserve. Typical: 5–10% of rent. Default: 7%."
                    >
                        <PercentInput
                            value={v.maintenancePct}
                            onChange={(n) => onChange({ ...v, maintenancePct: n })}
                        />
                    </Field>

                    <Field
                        label="Other / mo"
                        help="Owner‑paid utilities, lawn/snow, pest, admin, etc. Default 0 if tenant pays utilities."
                    >
                        <MoneyInput
                            value={v.otherMonthly}
                            onChange={(n) => onChange({ ...v, otherMonthly: n })}
                            currency={v.currency}
                        />
                    </Field>
                </div>
            </div>

            {/* GROWTH & EXIT */}
            <div className="section">
                <h4>Growth & Exit</h4>
                <div className="form-grid">
                    <Field
                        label="Appreciation % / yr"
                        help="Expected value growth. Conservative default: 3%."
                    >
                        <PercentInput
                            value={v.appreciationPct}
                            onChange={(n) => onChange({ ...v, appreciationPct: n })}
                        />
                    </Field>

                    <Field label="Rent growth % / yr" help="Annual rent increase. Default: 2%.">
                        <PercentInput
                            value={v.rentGrowthPct}
                            onChange={(n) => onChange({ ...v, rentGrowthPct: n })}
                        />
                    </Field>

                    <Field
                        label="Expense inflation % / yr"
                        help="Annual expense growth. Default: 2%."
                    >
                        <PercentInput
                            value={v.expenseInflationPct}
                            onChange={(n) => onChange({ ...v, expenseInflationPct: n })}
                        />
                    </Field>

                    <Field label="Sale in (years)" help="Holding period. Common: 5–10 yrs. Default: 7.">
                        <NumberInput
                            value={v.saleYear}
                            onChange={(n) => onChange({ ...v, saleYear: n })}
                            min={1}
                        />
                    </Field>

                    <Field
                        label="Selling costs %"
                        help="Agent + transfer + closing on exit. Typical: 5–7%. Default: 6%."
                    >
                        <PercentInput
                            value={v.sellingCostsPct}
                            onChange={(n) => onChange({ ...v, sellingCostsPct: n })}
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
}
