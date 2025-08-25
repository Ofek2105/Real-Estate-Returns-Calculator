import { useId, useState } from 'react';
import './HelpPanel.css';

type Props = {
    title?: string;
    defaultOpen?: boolean;
};

export default function HelpPanel({ title = 'Basics & How This Works', defaultOpen = false }: Props) {
    const [open, setOpen] = useState<boolean>(defaultOpen);
    const panelId = useId();

    return (
        <section className={`help-panel ${open ? 'open' : 'closed'}`}>
            <div className="help-header">
                <h3 className="help-title">{title}</h3>
                <button
                    className="help-toggle"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? 'Hide' : 'Show'}
                </button>
            </div>

            <div id={panelId} className="help-content" hidden={!open}>
                <div className="help-grid">
                    <div className="help-card">
                        <h4>Timeline</h4>
                        <p>
                            The chart shows monthly points from month 0 up to your horizon (e.g., 120 months = 10 years).
                            Values like rent, expenses, loan balance, and equity evolve over this timeline.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Net Operating Income (NOI)</h4>
                        <p>
                            <strong>NOI</strong> = Rent − Operating Expenses. It excludes loan payments, taxes on income, and depreciation.
                            It’s a property performance metric before financing.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Cap Rate</h4>
                        <p>
                            <strong>Cap Rate</strong> = NOI ÷ Purchase Price (or Full Price, depending on your convention).
                            It’s an annual return metric ignoring financing.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Cumulative Cash In</h4>
                        <p>
                            All cash you’ve put into the deal over time (down payment, staged payments, fees). It only increases.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Cumulative Net Cash Flow</h4>
                        <p>
                            Sum of monthly <em>Net CF</em> to date. <em>Net CF</em> = Rent − OpEx − Debt Service (if any) ± other cash items.
                            This number can go up or down based on monthly results.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Equity</h4>
                        <p>
                            Your ownership value at a point in time. Typically <em>Equity</em> = Property Value − Loan Balance.
                            Property Value may grow via appreciation (your %/year input).
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Operating Expenses</h4>
                        <p>
                            Ongoing costs to operate the property (maintenance, HOA, insurance, property management, etc.). In this app they’re modeled as a % of rent.
                        </p>
                    </div>

                    <div className="help-card">
                        <h4>Appreciation</h4>
                        <p>
                            Annual % growth applied to property value and/or rent (as configured). Compounds monthly in the projections.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
