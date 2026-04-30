/**
 * AI assisted code.
 * AI was used to calculate the SVG shapes for function graph and to set up the coordinate transformations.
 */

interface MSEVisualProps {
  width?: number;
  height?: number;
  padding?: number;
  fontSize?: number;
}

const MSEVisual = ({
  width = 400,
  height = 300,
  padding = 40,
  fontSize = 14,
}: MSEVisualProps) => {
  const data = [
    { actual: 3, predicted: 2 },
    { actual: 1, predicted: 1.5 },
  ];

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => Math.max(d.actual, d.predicted)));

  const xScale = innerW / (data.length + 1);
  const yScale = (innerH / maxVal) * 0.9;

  const yToSvg = (y: number) => padding + innerH - y * yScale;
  const xToSvg = (i: number) => padding + (i + 1) * xScale;

  return (
    <div className="w-full flex items-center justify-center">
      <div className="w-full max-w-[400px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rounded-md shadow-sm bg-slate-900 w-full h-auto block"
          aria-label="MSE visualization"
          role="img"
        >
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + innerH}
            stroke="#ed6bff"
            strokeWidth={3}
          />

          <line
            x1={padding}
            y1={padding + innerH}
            x2={padding + innerW}
            y2={padding + innerH}
            stroke="#ed6bff"
            strokeWidth={3}
          />

          {data.map((d, i) => {
            const x = xToSvg(i);
            const yActual = yToSvg(d.actual);
            const yPred = yToSvg(d.predicted);
            const error = Math.abs(d.actual - d.predicted);

            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={yActual}
                  x2={x}
                  y2={yPred}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                />

                <rect
                  x={x + 10}
                  y={Math.min(yActual, yPred) + 6}
                  width={error * yScale - 12}
                  height={error * yScale - 12}
                  fill="#ef4444"
                  fillOpacity={0.2}
                  stroke="#ef4444"
                  strokeWidth={1}
                />

                <circle
                  cx={x}
                  cy={yActual}
                  r={6}
                  fill="#10b981"
                  stroke="#059669"
                  strokeWidth={1}
                />

                <circle
                  cx={x}
                  cy={yPred}
                  r={6}
                  fill="#00d3f2"
                  stroke="#1e40af"
                  strokeWidth={1}
                />
              </g>
            );
          })}

          <g transform={`translate(${innerW - 60}, ${padding + 10})`}>
            <circle
              cx={0}
              cy={0}
              r={5}
              fill="#10b981"
              stroke="#059669"
              strokeWidth={1.5}
            />
            <text x={12} y={4} fill="#ffffff" fontSize={fontSize}>
              Várt
            </text>

            <circle
              cx={60}
              cy={0}
              r={5}
              fill="#00d3f2"
              stroke="#1e40af"
              strokeWidth={1}
            />
            <text x={72} y={4} fill="#ffffff" fontSize={fontSize}>
              Kapott
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MSEVisual;
