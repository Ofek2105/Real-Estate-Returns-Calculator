import React from 'react';
import './MoneyInput.css';

type MoneyInputProps = {
    value: number;
    onChange: (v: number) => void;
    step?: number;
    min?: number;
    max?: number;
    currency?: string;   // <- NEW (optional)
    placeholder?: string;
};

export default function MoneyInput({
    value,
    onChange,
    step = 1,
    min,
    max,
    currency,
    placeholder,
}: MoneyInputProps) {
    const onVal = (e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value === '' ? 0 : Number(e.target.value));

    return (
        <div className={`money-input ${currency ? 'with-prefix' : ''}`}>
            {currency && <span className="prefix">{currency}</span>}
            <input
                type="number"
                value={Number.isFinite(value) ? value : 0}
                onChange={onVal}
                step={step}
                min={min}
                max={max}
                placeholder={placeholder}
                inputMode="decimal"
            />
        </div>
    );
}
