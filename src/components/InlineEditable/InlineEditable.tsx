import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './InlineEditable.css';

type Props = {
    value: string;              // raw editable value (e.g., "100000")
    display?: string;           // formatted display (e.g., "€ 100,000.00")
    onCommit: (val: string) => void;
    type?: 'text' | 'number' | 'percent' | 'date';
    title?: string;
    placeholder?: string;
    className?: string;
    step?: number | string;     // ← NEW: optional per-use spinner step
};

export default function InlineEditable({
    value,
    display,
    onCommit,
    type = 'text',
    title,
    placeholder,
    className,
    step, // ← NEW
}: Props) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);
    const wrapRef = useRef<HTMLSpanElement>(null);
    const [widthPx, setWidthPx] = useState<number | undefined>(undefined);
    const [alignRight, setAlignRight] = useState(false);

    useEffect(() => { if (!editing) setLocal(value); }, [value, editing]);

    useEffect(() => {
        if (!editing) return;
        recalcWidthAndPosition(local);
        requestAnimationFrame(() => inputRef.current?.focus());
        setTimeout(() => inputRef.current?.select(), 0);
        const onResize = () => recalcWidthAndPosition(local);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    useLayoutEffect(() => {
        if (editing) recalcWidthAndPosition(local);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local, editing]);

    const recalcWidthAndPosition = (text: string) => {
        const m = measureRef.current;
        const w = wrapRef.current;
        if (!m || !w) return;

        m.textContent = text && text.length > 0 ? text : (placeholder || ' ');
        const textRect = m.getBoundingClientRect();

        const padding = 20;
        const desired = Math.max(textRect.width + padding, 72);

        const wrapRect = w.getBoundingClientRect();
        const gutter = 8;
        const availRight = window.innerWidth - wrapRect.left - gutter;
        const availLeft = wrapRect.right - gutter;

        let useAlignRight = false;
        let width = desired;

        if (desired <= availRight) {
            useAlignRight = false;
            width = desired;
        } else if (desired <= availLeft) {
            useAlignRight = true;
            width = desired;
        } else {
            if (availRight >= availLeft) {
                useAlignRight = false;
                width = Math.max(72, availRight);
            } else {
                useAlignRight = true;
                width = Math.max(72, availLeft);
            }
        }

        setAlignRight(useAlignRight);
        setWidthPx(Math.min(width, 1600));
    };

    const commit = () => { setEditing(false); onCommit(local); };
    const cancel = () => { setLocal(value); setEditing(false); };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') cancel();
    };

    const htmlType = type === 'percent' ? 'number' : type;

    // Use provided step for number/percent; otherwise keep your previous default ('any')
    const computedStep =
        htmlType === 'number'
            ? (step ?? 'any')
            : undefined;

    return (
        <span className={`ie-wrap ${className || ''}`} ref={wrapRef} title={title}>
            {/* Notice the data-editable hook */}
            <span
                className={`ie-display ${editing ? 'is-editing' : ''}`}
                data-editable="true"
                aria-live="off"
            >
                {display ?? value ?? placeholder ?? '—'}
            </span>

            <span className="ie-measure" ref={measureRef} />

            {editing ? (
                <input
                    ref={inputRef}
                    className={`ie-input-overlay ${alignRight ? 'align-right' : 'align-left'}`}
                    type={htmlType}
                    inputMode={type === 'number' || type === 'percent' ? 'decimal' : undefined}
                    step={computedStep}   
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    style={widthPx ? { width: `${1.3 * widthPx}px` } : undefined}
                    placeholder={placeholder}
                />
            ) : (
                <button className="ie-hotspot" onClick={() => setEditing(true)} aria-label="Edit value" />
            )}
        </span>
    );
}
