import { useCallback } from "react";

/**
 * AI assisted code.
 * AI was used to calculate the SVG path for function graph and to set up the coordinate transformations.
 */

interface StepVisualProps {
  width?: number;
  height?: number;
  rangeX?: [number, number];
  padding?: number;
  x?: number;
  dotRadius?: number;
}

const StepVisual = ({
  width = 500,
  height = 300,
  rangeX,
  x = 0,
  padding = 20,
  dotRadius = 7,
}: StepVisualProps) => {
  const step = useCallback((x: number) => (x < 0 ? 0 : 1), []);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const xToSvgCoord = useCallback(
    (x: number) => {
      const [d0, d1] = rangeX ?? [-10, 10];
      const t = (x - d0) / (d1 - d0);
      return padding + t * innerW;
    },
    [rangeX, padding, innerW],
  );

  const yToSvgCoord = useCallback(
    (yVal: number) => padding + (1 - yVal) * innerH,
    [padding, innerH],
  );

  const dotX = xToSvgCoord(x);
  const dotY = yToSvgCoord(step(x));

  return (
    <div className="w-full flex items-center justify-center">
      <div className="relative w-full max-w-[500px]">
        <div className="absolute top-2 left-3 sm:top-4 sm:left-6 text-white">
          {`H (x) = ${step(x).toFixed(2)}`}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rounded-md shadow-sm bg-slate-900 w-full h-auto block"
          aria-label="Step function graph"
          role="img"
        >
          <line
            x1={padding}
            y1={yToSvgCoord(0)}
            x2={padding + innerW}
            y2={yToSvgCoord(0)}
            stroke="#ed6bff"
            strokeWidth={1}
          />
          <line
            x1={xToSvgCoord(0)}
            y1={padding}
            x2={xToSvgCoord(0)}
            y2={padding + innerH}
            stroke="#ed6bff"
            strokeWidth={1}
          />

          <line
            x1={padding}
            y1={yToSvgCoord(0)}
            x2={xToSvgCoord(0)}
            y2={yToSvgCoord(0)}
            stroke="#00d3f2"
            strokeWidth={3}
          />

          <line
            x1={xToSvgCoord(0) - 1}
            y1={yToSvgCoord(1) + 1}
            x2={padding + innerW}
            y2={yToSvgCoord(1) + 1}
            stroke="#00d3f2"
            strokeWidth={3}
          />

          <circle
            cx={dotX}
            cy={dotY}
            r={dotRadius}
            fill="#00d3f2"
            stroke="#0369a1"
            strokeWidth={1.5}
          />
        </svg>
      </div>
    </div>
  );
};
export default StepVisual;
