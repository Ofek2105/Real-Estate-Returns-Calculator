type NumberInputProps = {
    value: number;
    onChange: (v: number) => void;   // explicitly says it gives a number
    step?: number;
    min?: number;
    max?: number;
};

export default function NumberInput({
    value,
    onChange,
    step = 1,
    min,
    max,
}: NumberInputProps) {
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
