import { useMemo } from "react";

/**
 * AI assisted code.
 * AI was used to calculate the SVG shapes for visualization and to set up the coordinate transformations.
 */

interface SoftmaxVisualProps {
  width?: number;
  height?: number;
  padding?: number;
  inputs: number[];
  fontSize?: number;
  showSoftmax?: boolean;
}

const SoftmaxVisual = ({
  width = 600,
  height = 400,
  padding = 60,
  fontSize = 14,
  inputs = [2, 3, -1, 1],
  showSoftmax = false,
}: SoftmaxVisualProps) => {
  const softmaxOutputs = useMemo(() => {
    const exps = inputs.map((x) => Math.exp(x));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  }, []);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const values = showSoftmax ? softmaxOutputs : inputs;
  const maxVal = showSoftmax ? 1 : Math.max(...inputs);
  const minVal = showSoftmax ? 0 : Math.min(...inputs);

  const yRange = maxVal - minVal;

  const barWidth = innerW / (inputs.length * 2);
  const barSpacing = innerW / inputs.length;

  const yToSvgCoord = (y: number) => {
    const normalized = (y - minVal) / yRange;
    return padding + innerH - normalized * innerH;
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div
        className={`flex flex-col items-center justify-center w-full max-w-[600px]`}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rounded-md shadow-sm bg-slate-900 w-full h-auto block"
          role="img"
          aria-label="Softmax visualization"
        >
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + innerH}
            stroke="#ed6bff"
            strokeWidth={2}
          />
          <line
            x1={padding}
            y1={yToSvgCoord(0)}
            x2={padding + innerW}
            y2={yToSvgCoord(0)}
            stroke="#ed6bff"
            strokeWidth={2}
          />

          {values.map((val, i) => {
            const x = padding + i * barSpacing + barSpacing / 2 - barWidth / 2;
            const barHeight = Math.abs(yToSvgCoord(val) - yToSvgCoord(0));
            const barY = val >= 0 ? yToSvgCoord(val) : yToSvgCoord(0);

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={showSoftmax ? "#00d3f2" : "#10b981"}
                  stroke={showSoftmax ? "#0369a1" : "#059669"}
                  strokeWidth={2}
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={barY - 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="bold"
                >
                  {showSoftmax ? val.toFixed(3) : val}
                </text>
              </g>
            );
          })}

          <text
            x={width / 2}
            y={25}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={fontSize + 2}
            fontWeight="bold"
          >
            {showSoftmax ? "Softmax után" : "Eredeti bemenetek"}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default SoftmaxVisual;
