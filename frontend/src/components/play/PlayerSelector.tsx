import React from "react";

interface PlayerSelectorProps {
  names: string[];
  values: string[];
  disabledOptions?: string[];
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedValue?: string;
  playerIndex: number;
}

const PlayerSelector = ({
  names,
  values,
  disabledOptions,
  handleChange,
  selectedValue,
  playerIndex,
}: PlayerSelectorProps) => {
  if (names.length !== values.length) {
    console.error("Names and values arrays must have the same length");
    return null;
  }
  return (
    <div className="relative">
      <label
        htmlFor={`p${playerIndex}-select`}
        className="absolute -top-2 left-3 bg-gray-900 rounded-lg px-2 text-xs text-gray-400"
      >
        {playerIndex === 1 ? "X" : "O"} játékos
      </label>
      <select
        id={`p${playerIndex}-select`}
        onChange={handleChange}
        value={selectedValue}
        className="cursor-pointer input-ring transition-all"
      >
        {names.map((name, index) => (
          <option
            key={values[index]}
            className={` ${
              disabledOptions?.includes(values[index]!)
                ? "text-gray-400"
                : "text-gray-200"
            }`}
            value={values[index]}
            disabled={disabledOptions?.includes(values[index]!)}
          >
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};
export default PlayerSelector;
