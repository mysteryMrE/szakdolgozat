import { useState } from "react";
import type { TwoTwoOneNeuralNetwork } from "../types";

interface NeuralNetworkVisualProps {
  network?: TwoTwoOneNeuralNetwork;
  onlyParameters?: boolean;
  smallScreen?: boolean;
}

const NeuralNetworkVisual = ({
  network,
  onlyParameters,
  smallScreen = false,
}: NeuralNetworkVisualProps) => {
  const [input1, setInput1] = useState(1);
  const [input2, setInput2] = useState(1);

  if (!network) {
    return <div className="mt-5 text-center">Válassz egy neuronhálót!</div>;
  }

  const COLORS = {
    bg: "#222d3dff",
    cyan: "#00d3f2",
    purple: "#ed6bff",
    textMain: "#00d3f2",
    textSec: "#ed6bff",
  };

  const step = (x: number) => (x > 0 ? 1 : 0);

  const weightedSumHidden1 =
    input1 * network.weightsInputToHidden[0][0] +
    input2 * network.weightsInputToHidden[0][1] +
    network.biasesHidden[0];
  const weightedSumHidden2 =
    input1 * network.weightsInputToHidden[1][0] +
    input2 * network.weightsInputToHidden[1][1] +
    network.biasesHidden[1];

  const weightedSumOutput =
    step(weightedSumHidden1) * network.weightsHiddenToOutput[0] +
    step(weightedSumHidden2) * network.weightsHiddenToOutput[1] +
    network.biasOutput;

  const getSizes = (isSmall: boolean) => {
    if (isSmall) {
      return {
        nodeRadius: 35,
        biasRadius: 22,
        strokeWidth: 2,
        fontSizeFunction: 18,
        fontSizeLabel: 20,
        fontSizeVal: 20,
        viewBox: "0 0 350 400",
      };
    } else {
      return {
        nodeRadius: 45,
        biasRadius: 30,
        strokeWidth: 3,
        fontSizeFunction: 22,
        fontSizeLabel: 25,
        fontSizeVal: 25,
        viewBox: "0 0 680 400",
      };
    }
  };

  const SIZES = getSizes(smallScreen);

  const getLayout = () => {
    if (smallScreen) {
      const centerX = 175;
      const row1Y = 55;
      const row2Y = 200;
      const row3Y = 310;
      const spreadX = 130;

      return {
        inputs: {
          x1: centerX - spreadX,
          x2: centerX + spreadX,
          y1: row1Y,
          y2: row1Y,
          labelOffset: { x: 4, y: -48 },
          valOffset: { x: 0, y: 5 },
          weights: {
            from1toH1: {
              x: centerX - spreadX / 1.2,
              y: row2Y - (row2Y - row1Y) / 2 + 10,
            },
            from1toH2: {
              x: centerX - spreadX / 3 + 10,
              y: row1Y + (row2Y - row1Y) / 3 - 10,
            },
            from2toH1: {
              x: centerX + spreadX / 3 - 10,
              y: row1Y + (row2Y - row1Y) / 3 - 10,
            },
            from2toH2: {
              x: centerX + spreadX / 1.2,
              y: row2Y - (row2Y - row1Y) / 2 + 10,
            },
          },
        },
        hidden: {
          x1: centerX - spreadX,
          x2: centerX + spreadX,
          y1: row2Y,
          y2: row2Y,
          labelOffset: { x: 0, y: 3 },
          biasOffset: { x: 0, y: 70 },
          weights: {
            from1toOut: {
              x: centerX - (centerX + spreadX - centerX) / 2.4,
              y: row2Y + (row3Y - row2Y) / 2 - 10,
            },
            from2toOut: {
              x: centerX + (centerX + spreadX - centerX) / 2.4,
              y: row2Y + (row3Y - row2Y) / 2 - 10,
            },
          },
        },
        output: {
          x: centerX,
          y: row3Y,
          labelOffset: { x: 0, y: 5 },
          biasOffset: { x: 0, y: 65 },
        },
      };
    } else {
      const centerY = 236;
      const col1X = 60;
      const col2X = 340;
      const col3X = 620;
      const spreadY = 110;

      return {
        inputs: {
          x1: col1X,
          x2: col1X,
          y1: centerY - spreadY,
          y2: centerY + spreadY,
          labelOffset: { x: 5, y: -SIZES.nodeRadius - 20 },
          valOffset: { x: 0, y: 8 },
          weights: {
            from1toH1: {
              x: (col2X - col1X) / 2 + col1X,
              y: centerY - spreadY - 15,
            },
            from1toH2: {
              x: col1X + SIZES.nodeRadius + 10,
              y: centerY - SIZES.nodeRadius + 20,
            },
            from2toH1: {
              x: col1X + SIZES.nodeRadius + 10,
              y: centerY + spreadY - SIZES.nodeRadius - 20,
            },
            from2toH2: {
              x: (col2X - col1X) / 2 + col1X,
              y: centerY + spreadY - 15,
            },
          },
        },
        hidden: {
          x1: col2X,
          x2: col2X,
          y1: centerY - spreadY,
          y2: centerY + spreadY,
          labelOffset: { x: 0, y: 8 },
          biasOffset: { x: 0, y: -90 },
          weights: {
            from1toOut: {
              x: col2X + (col3X - col2X) / 2,
              y: centerY - spreadY / 2 - 20,
            },
            from2toOut: {
              x: col2X + (col3X - col2X) / 2,
              y: centerY + spreadY / 2 - 20,
            },
          },
        },
        output: {
          x: col3X,
          y: centerY,
          labelOffset: { x: 0, y: 8 },
          biasOffset: { x: 0, y: -90 },
        },
      };
    }
  };

  const L = getLayout();

  const renderNetworkSVG = () => {
    return (
      <svg
        viewBox={SIZES.viewBox}
        className="w-full h-auto block"
        role="img"
        aria-label="Neural network visualization"
      >
        {/* Input 1 -> Hidden 1 */}
        <line
          x1={L.inputs.x1}
          y1={L.inputs.y1}
          x2={L.hidden.x1}
          y2={L.hidden.y1}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.weights.from1toH1.x}
          y={L.inputs.weights.from1toH1.y}
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsInputToHidden[0][0].toFixed(1)}
        </text>

        {/* Input 1 -> Hidden 2 */}
        <line
          x1={L.inputs.x1}
          y1={L.inputs.y1}
          x2={L.hidden.x2}
          y2={L.hidden.y2}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.weights.from1toH2.x}
          y={L.inputs.weights.from1toH2.y}
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsInputToHidden[1][0].toFixed(1)}
        </text>

        {/* Input 2 -> Hidden 1 */}
        <line
          x1={L.inputs.x2}
          y1={L.inputs.y2}
          x2={L.hidden.x1}
          y2={L.hidden.y1}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.weights.from2toH1.x}
          y={L.inputs.weights.from2toH1.y}
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsInputToHidden[0][1].toFixed(1)}
        </text>

        {/* Input 2 -> Hidden 2 */}
        <line
          x1={L.inputs.x2}
          y1={L.inputs.y2}
          x2={L.hidden.x2}
          y2={L.hidden.y2}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.weights.from2toH2.x}
          y={L.inputs.weights.from2toH2.y}
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsInputToHidden[1][1].toFixed(1)}
        </text>

        {/* Hidden 1 -> Output */}
        <line
          x1={L.hidden.x1}
          y1={L.hidden.y1}
          x2={L.output.x}
          y2={L.output.y}
          stroke={COLORS.purple}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.hidden.weights.from1toOut.x}
          y={L.hidden.weights.from1toOut.y}
          fill={COLORS.purple}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsHiddenToOutput[0].toFixed(1)}
        </text>

        {/* Hidden 2 -> Output */}
        <line
          x1={L.hidden.x2}
          y1={L.hidden.y2}
          x2={L.output.x}
          y2={L.output.y}
          stroke={COLORS.purple}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.hidden.weights.from2toOut.x}
          y={L.hidden.weights.from2toOut.y}
          fill={COLORS.purple}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          textAnchor="middle"
        >
          {network.weightsHiddenToOutput[1].toFixed(1)}
        </text>

        {/* NODES */}
        {/* Input 1 */}
        <circle
          cx={L.inputs.x1}
          cy={L.inputs.y1}
          r={SIZES.nodeRadius}
          fill={COLORS.bg}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.x1 + L.inputs.labelOffset.x}
          y={L.inputs.y1 + L.inputs.labelOffset.y}
          textAnchor="middle"
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          dy="5"
        >
          x₁
        </text>
        {!onlyParameters && (
          <text
            x={L.inputs.x1 + L.inputs.valOffset.x}
            y={L.inputs.y1 + L.inputs.valOffset.y}
            textAnchor="middle"
            fill={COLORS.cyan}
            fontSize={SIZES.fontSizeVal}
            fontWeight="bold"
          >
            {input1}
          </text>
        )}

        {/* Input 2 */}
        <circle
          cx={L.inputs.x2}
          cy={L.inputs.y2}
          r={SIZES.nodeRadius}
          fill={COLORS.bg}
          stroke={COLORS.cyan}
          strokeWidth={SIZES.strokeWidth}
        />
        <text
          x={L.inputs.x2 + L.inputs.labelOffset.x}
          y={L.inputs.y2 + L.inputs.labelOffset.y}
          textAnchor="middle"
          fill={COLORS.cyan}
          fontSize={SIZES.fontSizeLabel}
          fontWeight="bold"
          dy="5"
        >
          x₂
        </text>
        {!onlyParameters && (
          <text
            x={L.inputs.x2 + L.inputs.valOffset.x}
            y={L.inputs.y2 + L.inputs.valOffset.y}
            textAnchor="middle"
            fill={COLORS.cyan}
            fontSize={SIZES.fontSizeVal}
            fontWeight="bold"
          >
            {input2}
          </text>
        )}

        {/* --- NODES: HIDDEN LAYER --- */}
        {/* Hidden 1 */}
        <g>
          {/* Bias for H1 */}
          <line
            x1={L.hidden.x1}
            y1={L.hidden.y1}
            x2={L.hidden.x1}
            y2={L.hidden.y1 + L.hidden.biasOffset.y}
            stroke={COLORS.purple}
            strokeWidth={3}
          />
          <circle
            cx={L.hidden.x1}
            cy={L.hidden.y1}
            r={SIZES.nodeRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={SIZES.strokeWidth}
          />
          <circle
            cx={L.hidden.x1}
            cy={L.hidden.y1 + L.hidden.biasOffset.y}
            r={SIZES.biasRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={2}
          />
          <text
            x={L.hidden.x1 + L.hidden.labelOffset.x}
            y={L.hidden.y1 + L.hidden.biasOffset.y}
            dy="5"
            textAnchor="middle"
            fill={COLORS.purple}
            fontSize={SIZES.fontSizeVal}
            fontWeight="bold"
          >
            {network.biasesHidden[0].toFixed(1)}
          </text>
          {/* Value inside H1 */}
          {!onlyParameters && (
            <text
              x={L.hidden.x1 + L.hidden.labelOffset.x}
              y={L.hidden.y1 + L.hidden.labelOffset.y}
              textAnchor="middle"
              fill={COLORS.purple}
              fontSize={SIZES.fontSizeFunction}
              fontWeight="bold"
            >
              <tspan x={L.hidden.x1} dy="-8">
                F({weightedSumHidden1.toFixed(1)})
              </tspan>
              <tspan x={L.hidden.x1} dy="24">
                = {step(weightedSumHidden1)}
              </tspan>
            </text>
          )}
        </g>

        {/* Hidden 2 */}
        <g>
          <line
            x1={L.hidden.x2}
            y1={L.hidden.y2}
            x2={L.hidden.x2}
            y2={L.hidden.y2 + L.hidden.biasOffset.y}
            stroke={COLORS.purple}
            strokeWidth={3}
          />
          <circle
            cx={L.hidden.x2}
            cy={L.hidden.y2}
            r={SIZES.nodeRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={SIZES.strokeWidth}
          />
          <circle
            cx={L.hidden.x2}
            cy={L.hidden.y2 + L.hidden.biasOffset.y}
            r={SIZES.biasRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={2}
          />
          <text
            x={L.hidden.x2}
            y={L.hidden.y2 + L.hidden.biasOffset.y}
            dy="5"
            textAnchor="middle"
            fill={COLORS.purple}
            fontSize={SIZES.fontSizeVal}
            fontWeight="bold"
          >
            {network.biasesHidden[1].toFixed(1)}
          </text>
          {/* Value inside H2 */}
          {!onlyParameters && (
            <text
              x={L.hidden.x2 + L.hidden.labelOffset.x}
              y={L.hidden.y2 + L.hidden.labelOffset.y}
              textAnchor="middle"
              fill={COLORS.purple}
              fontSize={SIZES.fontSizeFunction}
              fontWeight="bold"
            >
              <tspan x={L.hidden.x2} dy="-8">
                F({weightedSumHidden2.toFixed(1)})
              </tspan>
              <tspan x={L.hidden.x2} dy="24">
                = {step(weightedSumHidden2)}
              </tspan>
            </text>
          )}
        </g>

        {/* --- NODES: OUTPUT LAYER --- */}
        <g>
          <line
            x1={L.output.x}
            y1={L.output.y}
            x2={L.output.x}
            y2={L.output.y + L.output.biasOffset.y}
            stroke={COLORS.purple}
            strokeWidth={3}
          />
          <circle
            cx={L.output.x}
            cy={L.output.y}
            r={SIZES.nodeRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={SIZES.strokeWidth}
          />
          <circle
            cx={L.output.x}
            cy={L.output.y + L.output.biasOffset.y}
            r={SIZES.biasRadius}
            fill={COLORS.bg}
            stroke={COLORS.purple}
            strokeWidth={2}
          />
          <text
            x={L.output.x}
            y={L.output.y + L.output.biasOffset.y}
            dy="5"
            textAnchor="middle"
            fill={COLORS.purple}
            fontSize={SIZES.fontSizeVal}
            fontWeight="bold"
          >
            {network.biasOutput.toFixed(1)}
          </text>
          {/* Value inside Output */}
          {!onlyParameters && (
            <text
              x={L.output.x + L.output.labelOffset.x}
              y={L.output.y + L.output.labelOffset.y}
              textAnchor="middle"
              fill={COLORS.purple}
              fontSize={SIZES.fontSizeFunction}
              fontWeight="bold"
            >
              <tspan x={L.output.x} dy="-8">
                F({weightedSumOutput.toFixed(1)})
              </tspan>
              <tspan x={L.output.x} dy="24">
                = {step(weightedSumOutput)}
              </tspan>
            </text>
          )}
        </g>
      </svg>
    );
  };

  if (onlyParameters) {
    return (
      <div className="mt-2">
        <div className="bg-slate-900 rounded-lg shadow-lg p-3">
          {renderNetworkSVG()}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 text-center">
      <div className="bg-slate-900 rounded-lg shadow-lg mt-4 p-3 mb-3 md:mb-8">
        {renderNetworkSVG()}
      </div>

      <div className="bg-slate-900 rounded-lg shadow-lg p-3 md:p-8">
        <h2 className="text-xl font-bold mb-2">Paraméterek beállítása</h2>

        <div className="flex flex-row justify-between gap-3 md:gap-8">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">
              Bemenet 1 (x₁): {input1}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="1"
              value={input1}
              onChange={(e) => setInput1(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg cursor-pointer bg-slate-500 accent-cyan-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2">
              Bemenet 2 (x₂): {input2}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="1"
              value={input2}
              onChange={(e) => setInput2(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg cursor-pointer bg-slate-500 accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralNetworkVisual;
