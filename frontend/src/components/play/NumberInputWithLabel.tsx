import { useEffect, useState } from "react";

interface NumberInputWithLabelProps {
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  title?: string;
  blurValueFixer?: (value: number) => number;
}

const NumberInputWithLabel = ({
  value,
  setValue,
  min,
  max,
  label,
  step,
  title,
  blurValueFixer,
}: NumberInputWithLabelProps) => {
  const [inputValue, setInputValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const stepPrecision = (String(step).split(".")[1] ?? "").length;
  const id = `${label}-hint`;

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  if (step <= 0 || min > max) {
    console.warn(
      `Invalid props for NumberInputWithLabel: min=${min}, max=${max}, step=${step}`,
    );
    return null;
  }

  return (
    <div className="relative">
      <label
        htmlFor={label}
        className="absolute -top-2 left-3 bg-gray-900 rounded-lg px-2 text-xs text-gray-400"
      >
        {label}
      </label>
      <input
        id={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        aria-describedby={id}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);

          const rawNumber = Number(inputValue.trim());
          if (!Number.isFinite(rawNumber)) {
            setInputValue(String(value));
            return;
          }

          const roundedToStep =
            Math.round((rawNumber - min) / step) * step + min;

          const roundedWithPrecision = Number(
            roundedToStep.toFixed(stepPrecision),
          );

          const adjustedValue = blurValueFixer
            ? blurValueFixer(roundedWithPrecision)
            : roundedWithPrecision;

          const finalValue = Math.max(min, Math.min(max, adjustedValue));

          setInputValue(String(finalValue));
          setValue(finalValue);
        }}
        className="input-ring"
      />
      <p
        id={id}
        className={`${isFocused ? "opacity-100" : "opacity-0"} tooltip`}
      >
        {title}
      </p>
    </div>
  );
};

export default NumberInputWithLabel;
