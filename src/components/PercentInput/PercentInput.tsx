type PercentInputProps = {
    value: number;
    onChange: (v: number) => void;   // <-- number
    step?: number;
    min?: number;
    max?: number;
};

export default function PercentInput({
    value,
    onChange,
    step = 0.1,
    min = 0,
    max = 100,
}: PercentInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value === '' ? 0 : Number(e.target.value));
    };

    return (
        <input
            type="number"
            value={value}
            onChange={handleChange}
            step={step}
            min={min}
            max={max}
        />
    );
}
