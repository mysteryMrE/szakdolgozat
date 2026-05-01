import { useState } from "react";

interface SingleNeuronVisualProps {
  inputInit1?: number;
  inputInit2?: number;
  weightInit1?: number;
  weightInit2?: number;
  biasInit?: number;
  smallScreen?: boolean;
  onlyParameters?: boolean;
}

const SingleNeuronVisual = ({
  inputInit1,
  inputInit2,
  weightInit1,
  weightInit2,
  biasInit,
  smallScreen = false,
  onlyParameters,
}: SingleNeuronVisualProps) => {
  const [input1, setInput1] = useState(inputInit1 ?? 1);
  const [input2, setInput2] = useState(inputInit2 ?? 1);
  const [weight1, setWeight1] = useState(weightInit1 ?? 0.5);
  const [weight2, setWeight2] = useState(weightInit2 ?? -0.5);
  const [bias, setBias] = useState(biasInit ?? 1.0);

  const weightedSum = input1 * weight1 + input2 * weight2 + bias;
  const output = weightedSum >= 0 ? 1 : 0;

  const COLORS = {
    bg: "#222d3dff",
    cyan: "#00d3f2",
    purple: "#ed6bff",
    green: "#10b981",
    red: "#ef4444",
    gray: "#d3d3d3ff",
  };

  const getSizes = (smallScreen: boolean) => {
    if (smallScreen) {
      return {
        inputRadius: 25,
        inputStrokeWidth: 3,
        inputValueFontSize: 20,
        inputNameFontSize: 24,
        weights: { fontSize: 20 },
        neuronRadius: 70,
        neuronFontSize: 24,
        outputRadius: 35,
        biasRadius: 25,
        biasFontSize: 18,
        arrowSize: 15,
        activationBoxFontSize: 20,
        activationBoxHeight: 100,
        activationBoxWidth: 100,
      };
    } else {
      return {
        inputRadius: 50,
        inputStrokeWidth: 3,
        inputValueFontSize: 24,
        inputNameFontSize: 24,
        weights: { fontSize: 22 },
        neuronRadius: 80,
        neuronFontSize: 24,
        outputRadius: 35,
        biasRadius: 25,
        biasFontSize: 19,
        arrowSize: 20,
        activationBoxFontSize: 20,
        activationBoxHeight: 120,
        activationBoxWidth: 120,
      };
    }
  };

  const SIZES = getSizes(smallScreen);

  const graphPadding = SIZES.activationBoxWidth * 0.1;

  const inputFix = smallScreen ? 40 : 80;
  const weightsXOffSet = smallScreen ? 70 : 70;
  const weightsYOffSet = smallScreen ? 70 : 100;
  const neuronXOffSet = smallScreen ? 0 : 220;
  const neuronYOffSet = smallScreen ? 140 : 0;
  const biasXOffSet = smallScreen ? 0 : 30;
  const biasYOffSet = smallScreen ? -140 : -120;

  const getLayout = () => {
    if (smallScreen) {
      // Vertical Layout
      const centerX = 200;
      return {
        viewBox: "0 0 400 410",
        inputs: {
          x1: centerX - 120,
          x2: centerX + 120,
          y1: inputFix,
          y2: inputFix,
          nameOffset: { x: 2, y: 6 },
          valueOffset: { x1: -50, y1: 7, x2: 50, y2: 7 },
          l1: {
            x1: 0,
            y1: SIZES.inputRadius,
            x2: 0,
            y2: -SIZES.neuronRadius,
          },
          l2: {
            x1: 0,
            y1: SIZES.inputRadius,
            x2: 0,
            y2: -SIZES.neuronRadius,
          },
        },
        weights: {
          x1: centerX - weightsXOffSet - 90,
          x2: centerX + weightsXOffSet,
          y1: inputFix + weightsYOffSet,
          y2: inputFix + weightsYOffSet,
        },
        neuron: {
          x: centerX + neuronXOffSet,
          y: inputFix + neuronYOffSet,
          contentOffset: -22,
          contentRowOffset: 35,
          l: {
            x1: 0,
            y1: SIZES.neuronRadius + 5,
            x2: SIZES.activationBoxWidth / 2,
            y2: -SIZES.arrowSize,
          },
        },
        bias: {
          x: centerX + neuronXOffSet + biasXOffSet,
          y: inputFix + neuronYOffSet + biasYOffSet,
          nameOffset: { x: 40, y: 4 },
          valueOffset: { x: -1, y: 5 },
        },
        activationBox: {
          x: centerX - SIZES.activationBoxWidth / 2,
          y: inputFix + neuronYOffSet + SIZES.neuronRadius + 50,
          textYOffset: SIZES.activationBoxHeight / 2 + 5,
          textXOffset: -SIZES.activationBoxWidth,
          w: SIZES.activationBoxWidth,
          h: SIZES.activationBoxHeight,
          l: {
            x1: SIZES.activationBoxWidth + 5,
            y1: SIZES.activationBoxHeight / 2,
            x2: -SIZES.outputRadius - SIZES.arrowSize - 2,
            y2: 0,
          },
        },
        output: {
          x: centerX + SIZES.activationBoxWidth + 40,
          y:
            inputFix +
            neuronYOffSet +
            SIZES.neuronRadius +
            50 +
            SIZES.activationBoxHeight / 2,
          textXOffset: 0,
          textYOffset: 10,
        },
      };
    } else {
      // Horizontal Layout
      const centerY = 175;
      return {
        viewBox: "0 0 800 350",
        inputs: {
          x1: inputFix,
          x2: inputFix,
          y1: centerY - 105,
          y2: centerY + 105,
          nameOffset: { x: 3, y: 6 },
          valueOffset: { x1: 0, x2: 0, y1: 80, y2: -60 },
          l1: {
            x1: SIZES.inputRadius,
            y1: 0,
            x2: -SIZES.neuronRadius,
            y2: -10,
          },
          l2: {
            x1: SIZES.inputRadius,
            y1: 0,
            x2: -SIZES.neuronRadius,
            y2: 10,
          },
        },
        weights: {
          x1: inputFix + weightsXOffSet,
          x2: inputFix + weightsXOffSet,
          y1: centerY - weightsYOffSet,
          y2: centerY + weightsYOffSet + 12,
        },
        neuron: {
          x: inputFix + neuronXOffSet,
          y: centerY + neuronYOffSet,
          contentOffset: -22,
          contentRowOffset: 35,
          l: {
            x1: SIZES.neuronRadius + 5,
            y1: 0,
            x2: -SIZES.arrowSize,
            y2: SIZES.activationBoxHeight / 2,
          },
        },
        bias: {
          x: inputFix + neuronXOffSet + biasXOffSet,
          y: centerY + neuronYOffSet + biasYOffSet,
          nameOffset: { x: 0, y: -32 },
          valueOffset: { x: -1, y: 5 },
        },
        activationBox: {
          x: inputFix + neuronXOffSet + SIZES.neuronRadius + 110,
          y: centerY - SIZES.activationBoxHeight / 2,
          w: SIZES.activationBoxWidth,
          h: SIZES.activationBoxHeight,
          textYOffset: -15,
          textXOffset: 0,
          l: {
            x1: SIZES.activationBoxWidth + 5,
            y1: SIZES.activationBoxHeight / 2,
            x2: -SIZES.outputRadius - SIZES.arrowSize - 2,
            y2: 0,
          },
        },
        output: {
          x:
            inputFix +
            neuronXOffSet +
            SIZES.neuronRadius +
            110 +
            SIZES.activationBoxWidth +
            SIZES.outputRadius +
            100,
          y: centerY,
          textXOffset: 0,
          textYOffset: 10,
        },
      };
    }
  };

  const L = getLayout() as any;
  if (onlyParameters) {
    return (
      <div className="">
        <div className="bg-slate-900 rounded-lg shadow-lg">
          <svg
            viewBox="0 0 360 310"
            className="block w-full h-auto"
            role="img"
            aria-label="Single neuron visualization"
          >
            {/* Inputs */}
            <circle
              cx="50"
              cy="100"
              r="30"
              fill="#222d3dff"
              stroke="#00d3f2"
              strokeWidth="2"
            />
            <text
              x="50"
              y="105"
              textAnchor="middle"
              fill="#00d3f2"
              fontSize="20"
              fontWeight="bold"
            >
              x₁
            </text>
            <circle
              cx="50"
              cy="250"
              r="30"
              fill="#222d3dff"
              stroke="#00d3f2"
              strokeWidth="2"
            />
            <text
              x="50"
              y="255"
              textAnchor="middle"
              fill="#00d3f2"
              fontSize="20"
              fontWeight="bold"
            >
              x₂
            </text>

            {/* Weights */}
            <line
              x1="80"
              y1="100"
              x2="220"
              y2="175"
              stroke="#00d3f2"
              strokeWidth="3"
            />
            <text
              x="135"
              y="120"
              fill="#00d3f2"
              fontSize="16"
              fontWeight="bold"
              className="font-xl"
            >
              w₁ = {weight1.toFixed(2)}
            </text>

            <line
              x1="80"
              y1="250"
              x2="220"
              y2="175"
              stroke="#00d3f2"
              strokeWidth="3"
            />
            <text
              x="135"
              y="240"
              fill="#00d3f2"
              fontSize="16"
              fontWeight="bold"
              className="font-xl"
            >
              w₂ = {weight2.toFixed(2)}
            </text>

            {/* Neuron */}
            <circle
              cx="280"
              cy="175"
              r="60"
              fill="#222d3dff"
              stroke="#ed6bff"
              strokeWidth="3"
            />

            {/* Bias */}
            <circle
              cx="280"
              cy="80"
              r="20"
              fill="#222d3dff"
              stroke="#ed6bff"
              strokeWidth="2"
            />
            <text
              x="280"
              y="85"
              textAnchor="middle"
              fill="#ed6bff"
              fontSize="16"
              fontWeight="bold"
            >
              b
            </text>
            <text
              x="280"
              y="50"
              textAnchor="middle"
              fill="#ed6bff"
              fontSize="16"
              fontWeight="bold"
            >
              {bias.toFixed(2)}
            </text>
            <line
              x1="280"
              y1="100"
              x2="280"
              y2="115"
              stroke="#ed6bff"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <p>
        Itt egy egyszerű neuron látható. Két bemenete, két súlya, torzítása és
        egységugrás-függvénye van.
      </p>

      <div className="bg-slate-900 rounded-lg shadow-lg mt-4 p-1 md:p-2 mb-3">
        <svg
          viewBox={L.viewBox}
          className="w-full h-auto block"
          role="img"
          aria-label="Single neuron with activation function visualization"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth={SIZES.arrowSize}
              markerHeight={SIZES.arrowSize}
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={COLORS.cyan} />
            </marker>
          </defs>
          <>
            {/* --- 1. INPUTS --- */}
            <g transform={`translate(${L.inputs.x1}, ${L.inputs.y1})`}>
              <circle
                r={SIZES.inputRadius}
                fill={COLORS.bg}
                stroke={COLORS.cyan}
                strokeWidth={SIZES.inputStrokeWidth}
              />
              <text
                y={L.inputs.nameOffset.y}
                x={L.inputs.nameOffset.x}
                textAnchor="middle"
                fill={COLORS.cyan}
                fontSize={SIZES.inputNameFontSize}
                fontWeight="bold"
              >
                x₁
              </text>
              <text
                y={L.inputs.valueOffset.y1}
                x={L.inputs.valueOffset.x1}
                textAnchor="middle"
                fill={COLORS.cyan}
                fontSize={SIZES.inputValueFontSize}
                fontWeight="bold"
              >
                {input1}
              </text>
            </g>
            <g transform={`translate(${L.inputs.x2}, ${L.inputs.y2})`}>
              <circle
                r={SIZES.inputRadius}
                fill={COLORS.bg}
                stroke={COLORS.cyan}
                strokeWidth={SIZES.inputStrokeWidth}
              />
              <text
                y={L.inputs.nameOffset.y}
                x={L.inputs.nameOffset.x}
                textAnchor="middle"
                fill={COLORS.cyan}
                fontSize={SIZES.inputNameFontSize}
                fontWeight="bold"
              >
                x₂
              </text>
              <text
                y={L.inputs.valueOffset.y2}
                x={L.inputs.valueOffset.x2}
                textAnchor="middle"
                fill={COLORS.cyan}
                fontSize={SIZES.inputValueFontSize}
                fontWeight="bold"
              >
                {input2}
              </text>
            </g>

            {/* --- 2. CONNECTIONS --- */}
            {/* Line 1 */}
            <line
              x1={L.inputs.x1 + L.inputs.l1.x1}
              y1={L.inputs.y1 + L.inputs.l1.y1}
              x2={L.neuron.x + L.inputs.l1.x2}
              y2={L.neuron.y + L.inputs.l1.y2}
              stroke={COLORS.cyan}
              strokeWidth="3"
            />
            <text
              x={L.weights.x1}
              y={L.weights.y1}
              fill={COLORS.cyan}
              fontSize={SIZES.weights.fontSize}
              fontWeight="bold"
            >
              w₁ = {weight1.toFixed(2)}
            </text>

            {/* Line 2 */}
            <line
              x1={L.inputs.x2 + L.inputs.l2.x1}
              y1={L.inputs.y2 + L.inputs.l2.y1}
              x2={L.neuron.x + L.inputs.l2.x2}
              y2={L.neuron.y + L.inputs.l2.y2}
              stroke={COLORS.cyan}
              strokeWidth="3"
            />
            <text
              x={L.weights.x2}
              y={L.weights.y2}
              fill={COLORS.cyan}
              fontSize={SIZES.weights.fontSize}
              fontWeight="bold"
            >
              w₂ = {weight2.toFixed(2)}
            </text>

            {/* --- 3. NEURON --- */}
            <g transform={`translate(${L.neuron.x}, ${L.neuron.y})`}>
              <circle
                r={SIZES.neuronRadius}
                fill={COLORS.bg}
                stroke={COLORS.purple}
                strokeWidth="3"
              />
              <text
                y={L.neuron.contentOffset}
                textAnchor="middle"
                fill={COLORS.purple}
                fontSize={SIZES.neuronFontSize}
                fontWeight="bold"
              >
                <tspan x="0" dy="0">
                  Σ = x₁w₁
                </tspan>
                <tspan x="0" dy={L.neuron.contentRowOffset}>
                  + x₂w₂ + b
                </tspan>
                <tspan x="0" dy={L.neuron.contentRowOffset}>
                  = {weightedSum.toFixed(2)}
                </tspan>
              </text>
            </g>

            {/* Bias */}
            <g transform={`translate(${L.bias.x}, ${L.bias.y})`}>
              <circle
                r={SIZES.biasRadius}
                fill={COLORS.bg}
                stroke={COLORS.purple}
                strokeWidth="2"
              />
              <text
                y={L.bias.nameOffset.y}
                x={L.bias.nameOffset.x}
                textAnchor="middle"
                fill={COLORS.purple}
                fontSize={SIZES.biasFontSize}
                fontWeight="bold"
              >
                b
              </text>
              <text
                y={L.bias.valueOffset.y}
                x={L.bias.valueOffset.x}
                textAnchor="middle"
                fill={COLORS.purple}
                fontSize={SIZES.biasFontSize}
                fontWeight="bold"
              >
                {bias.toFixed(2)}
              </text>
            </g>
            <line
              x1={L.bias.x}
              y1={L.bias.y + SIZES.biasRadius}
              x2={L.neuron.x}
              y2={L.neuron.y - SIZES.neuronRadius}
              stroke={COLORS.purple}
              strokeWidth="3"
            />

            {/* Arrow to Activation */}
            <line
              x1={L.neuron.x + L.neuron.l.x1}
              y1={L.neuron.y + L.neuron.l.y1}
              x2={L.activationBox.x + L.neuron.l.x2}
              y2={L.activationBox.y + L.neuron.l.y2}
              stroke={COLORS.cyan}
              strokeWidth="3"
              markerEnd="url(#arrow)"
            />

            {/* --- 4. ACTIVATION BOX --- */}
            <g
              transform={`translate(${L.activationBox.x}, ${L.activationBox.y})`}
            >
              <rect
                width={L.activationBox.w}
                height={L.activationBox.h}
                fill={COLORS.bg}
                stroke={COLORS.cyan}
                strokeWidth="2"
                rx="8"
              />
              <text
                x={L.activationBox.w / 2 + L.activationBox.textXOffset}
                y={L.activationBox.textYOffset}
                textAnchor="middle"
                fill={COLORS.cyan}
                fontSize={SIZES.activationBoxFontSize}
                fontWeight="semi-bold"
              >
                Aktiváció
              </text>
              <line
                x1={graphPadding}
                y1={SIZES.activationBoxHeight - graphPadding}
                x2={SIZES.activationBoxWidth - graphPadding}
                y2={SIZES.activationBoxHeight - graphPadding}
                stroke={COLORS.gray}
                strokeWidth="1"
              />
              <line
                x1={SIZES.activationBoxWidth / 2}
                y1={graphPadding}
                x2={SIZES.activationBoxWidth / 2}
                y2={SIZES.activationBoxHeight - graphPadding}
                stroke={COLORS.gray}
                strokeWidth="1"
              />
              <polyline
                points={`${graphPadding},${
                  SIZES.activationBoxHeight - graphPadding
                } ${SIZES.activationBoxWidth / 2},${
                  SIZES.activationBoxHeight - graphPadding
                } ${SIZES.activationBoxWidth / 2},${graphPadding} ${
                  SIZES.activationBoxWidth - graphPadding
                },${graphPadding}`}
                fill="none"
                stroke={COLORS.green}
                strokeWidth="3"
              />
              <circle
                cx={
                  weightedSum >= 0
                    ? graphPadding +
                      (SIZES.activationBoxWidth - graphPadding * 2) / 1.25
                    : graphPadding +
                      (SIZES.activationBoxWidth - graphPadding * 2) / 5
                }
                cy={
                  weightedSum >= 0
                    ? graphPadding
                    : SIZES.activationBoxHeight - graphPadding
                }
                r="6"
                fill={COLORS.red}
              />
            </g>

            {/* Arrow to Output */}
            <line
              x1={L.activationBox.x + L.activationBox.l.x1}
              y1={L.activationBox.y + L.activationBox.l.y1}
              x2={L.output.x + L.activationBox.l.x2}
              y2={L.output.y + L.activationBox.l.y2}
              stroke={COLORS.cyan}
              strokeWidth="3"
              markerEnd="url(#arrow)"
            />

            {/* --- 5. OUTPUT --- */}
            <g transform={`translate(${L.output.x}, ${L.output.y})`}>
              <circle
                r={SIZES.outputRadius}
                fill={COLORS.bg}
                stroke={COLORS.purple}
                strokeWidth="3"
              />
              <text
                y={L.output.textYOffset}
                x={L.output.textXOffset}
                textAnchor="middle"
                fill={COLORS.purple}
                fontSize={SIZES.neuronFontSize}
                fontWeight="bold"
              >
                {output}
              </text>
            </g>
          </>
        </svg>
      </div>

      <div className="bg-slate-900 rounded-lg shadow-lg p-2 md:p-8">
        <h2 className="md:text-xl text-lg font-bold mb-2">
          Paraméterek beállítása
        </h2>
        <div className="flex flex-col gap-1 md:gap-6 text-sm md:text-lg">
          <div className="flex flex-col md:flex-row gap-2 md:gap-8">
            <div className="flex-1">
              <label className="font-semibold">Bemenet 1 (x₁): {input1}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={input1}
                onChange={(e) => setInput1(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-500 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">Bemenet 2 (x₂): {input2}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={input2}
                onChange={(e) => setInput2(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-500 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="flex flex-row gap-4 md:gap-8">
            <div className="flex-1">
              <label className="font-semibold">
                Súly 1 (w₁): {weight1.toFixed(2)}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={weight1}
                onChange={(e) => setWeight1(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-500 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label className="font-semibold">
                Súly 2 (w₂): {weight2.toFixed(2)}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={weight2}
                onChange={(e) => setWeight2(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-500 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="flex-1 ">
            <label className="font-semibold">
              Torzítás (b): {bias.toFixed(2)}
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={bias}
              onChange={(e) => setBias(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-500 accent-cyan-400 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default SingleNeuronVisual;
