import { useCallback, useMemo } from "react";

/**
 * AI assisted code.
 * AI was used to calculate the SVG path for function graph and to set up the coordinate transformations.
 */

interface ReluVisualProps {
  width?: number;
  height?: number;
  rangeX?: [number, number];
  rangeY?: [number, number];
  padding?: number;
  x?: number;
  dotRadius?: number;
}

const ReluVisual = ({
  width = 500,
  height = 300,
  rangeX,
  rangeY,
  x = 0,
  padding = 20,
  dotRadius = 7,
}: ReluVisualProps) => {
  const relu = useCallback((x: number) => Math.max(0, x), []);

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
    (y: number) => {
      const [d0, d1] = rangeY ?? [-10, 10];
      const t = (y - d0) / (d1 - d0);
      return padding + (1 - t) * innerH;
    },
    [rangeY, padding, innerH],
  );

  const pathD = useMemo(() => {
    const steps = 300;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const xv =
        (rangeX?.[0] ?? -10) + t * ((rangeX?.[1] ?? 10) - (rangeX?.[0] ?? -10));
      const yv = relu(xv);
      const sx = xToSvgCoord(xv);
      const sy = yToSvgCoord(yv);
      pts.push(`${i === 0 ? "M" : "L"} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
    }
    return pts.join(" ");
  }, [rangeX, relu, xToSvgCoord, yToSvgCoord]);

  const dotX = xToSvgCoord(x);
  const dotY = yToSvgCoord(relu(x));

  return (
    <div className="w-full flex items-center justify-center">
      <div className="relative flex flex-col items-center justify-center w-full max-w-[500px]">
        <div className="absolute top-2 left-3 sm:top-4 sm:left-6 text-white sm:text-base text-sm">
          {`ReLU (x) = ${relu(x).toFixed(2)}`}
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="rounded-md shadow-sm bg-slate-900 w-full h-auto block"
          role="img"
          aria-label="ReLU function graph"
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

          <path
            d={pathD}
            fill="none"
            stroke="#00d3f2"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* dot */}
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
export default ReluVisual;
