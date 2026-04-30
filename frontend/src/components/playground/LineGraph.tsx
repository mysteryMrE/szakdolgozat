interface LineGraphProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
}

const PADDING_X = 8;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 6;

const LineGraph = ({
  data,
  width = 220,
  height = 90,
  color = "#2b8a3e",
}: LineGraphProps) => {
  const values = data ?? [];

  if (values.length === 0) {
    return (
      <svg
        data-testid="line-graph-empty"
        className="block"
        width={width}
        height={height}
        aria-hidden="true"
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="#fff"
          stroke="#ccc"
        />
      </svg>
    );
  }

  const stepX =
    values.length > 1 ? (width - PADDING_X) / (values.length - 1) : 0;

  const toY = (value: number) => {
    const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
    return height - PADDING_BOTTOM - value * plotHeight;
  };

  const path = values
    .map((val, i) => {
      const x = PADDING_X / 2 + i * stepX;
      const y = toY(val);
      return i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    })
    .join(" ");

  const lastValue = values[values.length - 1]!;
  const dotX = PADDING_X / 2 + (values.length - 1) * stepX;
  const dotY = toY(lastValue);

  const labelX = Math.min(width - 4, dotX + 20);
  const labelY = Math.max(PADDING_TOP, dotY - 8);

  return (
    <svg
      width={width}
      height={height}
      className="block"
      role="img"
      aria-label="Line chart"
    >
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#fff"
        stroke="#ddd"
        rx={4}
      />
      <path d={path} stroke={color} fill="none" strokeWidth={1.5} />
      <circle cx={dotX} cy={dotY} r={3} fill={color} />
      <text x={labelX} y={labelY} fontSize={8} fill={color} textAnchor="end">
        {`${(lastValue * 100).toFixed(0)}%`}
      </text>
    </svg>
  );
};

export default LineGraph;
