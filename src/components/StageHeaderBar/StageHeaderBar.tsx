import type { Stage } from '../../types/finance';
import InlineEditable from '../InlineEditable/InlineEditable';
import './StageHeaderBar.css';

type Props = {
    stages: Stage[];
    onChange: (stages: Stage[]) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
    percentSum: number;
};

export default function StageHeaderBar({ stages, onChange, onAdd, onRemove, percentSum }: Props) {
    const updateStage = (id: string, patch: Partial<Stage>) => {
        onChange(stages.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    return (
        <div className="stages-bar">
            <div className="stages-left">
                <span className="pill static">100% (Full)</span>
                {stages.map(s => (
                    <div key={s.id} className="pill">
                        <InlineEditable
                            value={s.label}
                            onCommit={(v) => updateStage(s.id, { label: v })}
                            title="Stage label"
                            className="pill-edit"
                        />
                        <span> · </span>
                        <InlineEditable
                            value={s.date}
                            onCommit={(v) => updateStage(s.id, { date: v })}
                            type="date"
                            title="Stage date"
                            className="pill-edit"
                        />
                        <span> · </span>
                        <InlineEditable
                            value={String(s.percent)}
                            onCommit={(v) => updateStage(s.id, { percent: Number(v.replace('%', '')) })}
                            type="percent"
                            title="Stage percent"
                            className="pill-edit"
                        />
                        <span>%</span>
                        <button className="pill-remove" onClick={() => onRemove(s.id)} aria-label="Remove stage">×</button>
                    </div>
                ))}
                <button className="add-stage" onClick={onAdd}>+ Add Stage</button>
            </div>
            <div className={`stages-right sum ${Math.round(percentSum) === 100 ? 'ok' : 'bad'}`}>
                Sum: {percentSum.toFixed(2)}%
            </div>
        </div>
    );
}
