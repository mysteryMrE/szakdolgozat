/**
 * AI assisted code.
 * AI was used to calculate the SVG shapes for function graph and to set up the coordinate transformations.
 */

interface CrossEntropyVisualProps {
  width?: number;
  height?: number;
  padding?: number;
  target?: number[];
  predicted?: number[];
  colors?: string[];
  fontSize?: number;
}

const CrossEntropyVisual = ({
  width = 600,
  height = 320,
  padding = 50,
  target = [0, 1, 0],
  predicted = [0.2, 0.1, 0.7],
  colors = ["#ef4444", "#3b82f6", "#10b981"],
  fontSize = 14,
}: CrossEntropyVisualProps) => {
  const logPredicted = predicted.map((p) => -Math.log(Math.max(0.0001, p)));

  const ceValues = target.map((t, i) => (t === 0 ? 0 : t * logPredicted[i]!));
  const targetIndex = target.findIndex((t) => t === 1);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const groupWidth = innerW / 2.3;
  const barWidth = groupWidth / 4;
  const gapWidth = groupWidth * 0.3;

  const maxLog = Math.max(...logPredicted);
  const logScale = (innerH * 0.6) / maxLog;

  const baseY = padding + innerH;

  const ceVal = ceValues[targetIndex]!;
  const x = padding + groupWidth + gapWidth + targetIndex * barWidth * 1.5;
  const barHeight = ceVal * logScale;
  const barY = baseY - barHeight;
  const color = colors[targetIndex];

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-[600px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rounded-md shadow-sm bg-slate-900 w-full h-auto block"
          role="img"
          aria-label="Cross-entropy loss visualization"
        >
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={baseY}
            stroke="#ed6bff"
            strokeWidth={2}
          />
          <line
            x1={padding}
            y1={baseY}
            x2={width - padding}
            y2={baseY}
            stroke="#ed6bff"
            strokeWidth={2}
          />

          <text
            x={padding + groupWidth / 2}
            y={padding - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={fontSize + 2}
            fontWeight="bold"
          >
            log(Kapott)
          </text>

          {logPredicted.map((val, i) => {
            const x = padding + i * barWidth * 1.5;
            const barHeight = val * logScale;
            const barY = baseY - barHeight;

            return (
              <g key={`log-${i}`}>
                <rect
                  x={x}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[i]}
                  rx={3}
                />
                <text
                  x={x + barWidth / 2}
                  y={barY - 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="bold"
                >
                  {-1 * Number(val.toFixed(2))}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={baseY + 28}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={fontSize}
                >
                  C{i + 1}
                </text>
              </g>
            );
          })}

          <text
            x={padding + groupWidth + gapWidth + groupWidth / 2}
            y={padding - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={fontSize + 2}
            fontWeight="bold"
          >
            Veszteség
          </text>

          <rect
            x={x}
            y={barY}
            width={barWidth}
            height={barHeight}
            fill={color}
            rx={3}
          />

          <text
            x={x + barWidth / 2}
            y={barY - 6}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {ceVal!.toFixed(2)}
          </text>
          <text
            x={x + barWidth / 2}
            y={baseY + 28}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={fontSize}
          >
            C{targetIndex + 1}
          </text>
        </svg>
      </div>{" "}
    </div>
  );
};

export default CrossEntropyVisual;
