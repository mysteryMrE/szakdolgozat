import type { BackpropAnimStep as AnimStep } from "../../../types";

interface BackpropVisualProps {
  currentStep: AnimStep;
  getStepIndex: (step: AnimStep) => number;
  setup: {
    input: [number, number];
    target: [number, number];
  };
  networkData: {
    w1: [[number, number], [number, number]];
    b1: [number, number];
    w2: [[number, number], [number, number]];
    b2: [number, number];
  };
  forwardPass: {
    a1: [number, number];
    z1: [number, number];
    a2: [number, number];
    z2: [number, number];
  };
  lossValues: {
    loss: number;
    newLoss: number;
  };
  gradients: {
    dHidden: [number, number];
    dActivation1: [number, number];
    dOutput: [number, number];
    dw1: [[number, number], [number, number]];
    db1: [number, number];
    dw2: [[number, number], [number, number]];
    db2: [number, number];
  };
  newNetworkData: {
    newW1: [[number, number], [number, number]];
    newB1: [number, number];
    newW2: [[number, number], [number, number]];
    newB2: [number, number];
  };
  stretch?: boolean;
}

const BackpropVisual = ({
  setup,
  currentStep,
  getStepIndex,
  networkData,
  forwardPass,
  lossValues,
  gradients,
  newNetworkData,
  stretch = false,
}: BackpropVisualProps) => {
  const isStep = (step: AnimStep): boolean => currentStep === step;
  const isStepOrAfter = (step: AnimStep): boolean =>
    getStepIndex(currentStep) >= getStepIndex(step);
  const isBeforeStep = (step: AnimStep): boolean =>
    getStepIndex(currentStep) < getStepIndex(step);

  console.log("BackpropVisual props");
  console.log({
    currentStep,
    networkData,
    forwardPass,
    lossValues,
    gradients,
    newNetworkData,
  });

  const createNeuron = (
    cx: number,
    cy: number,
    label: string,
    labelColor: string,
    labelPos: { x: number; y: number },
    value: string | number | null,
    strokeColor: string,
    radius: number,
    fill: string,
    pulse?: boolean,
  ) => {
    return (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={fill}
          stroke={strokeColor}
          strokeWidth="3"
          className={`${pulse ? "animate-pulse" : ""}`}
        />
        <text
          x={cx}
          y={cy}
          fill={labelColor}
          fontSize="20"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {label}
        </text>
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill={labelColor}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {`${value !== null ? `${value}` : ""}`}
        </text>
      </>
    );
  };

  const createLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number,
    opacity: number,
    label: string,
    labelColor: string,
    labelPos: { x: number; y: number },
    dashed?: boolean,
    move?: boolean,
    moveLeft?: boolean,
  ) => {
    return (
      <>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={width}
          opacity={opacity}
          strokeDasharray={dashed ? "6,6" : undefined}
          className={` ${
            move ? (moveLeft ? "crawling-line-back" : "crawling-line") : ""
          }`}
        />
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill={labelColor}
          fontSize="16"
          fontWeight="500"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {label}
        </text>
      </>
    );
  };

  const colorInput = "#3ba2f6ff";
  const colorHidden = "#06B6D4";
  const colorOutput = "#ed6bff";
  const colorTarget = "#3fd42fff";
  const fillColor = "#1E293B";
  const lineColor = "#55657fff";
  const colorError = "#DC2626";
  const radius = 40;
  const textColor = "#FFFFFF";

  const input1Pos = stretch ? { x: 50, y: 74 } : { x: 100, y: 100 };
  const neuronYPadding = stretch ? 260 : 200;
  const input2Pos = stretch
    ? { x: 50, y: input1Pos.y + neuronYPadding }
    : { x: 100, y: input1Pos.y + neuronYPadding };
  const layerPadding = stretch ? 235 : 200;

  const hidden1Pos = {
    x: input1Pos.x + layerPadding,
    y: input1Pos.y,
  };
  const hidden2Pos = {
    x: input2Pos.x + layerPadding,
    y: input2Pos.y,
  };

  const output1Pos = {
    x: hidden1Pos.x + layerPadding,
    y: hidden1Pos.y,
  };
  const output2Pos = {
    x: hidden2Pos.x + layerPadding,
    y: hidden2Pos.y,
  };

  const targetPadding = layerPadding;

  const target1Pos = { x: output1Pos.x + targetPadding, y: output1Pos.y };
  const target2Pos = { x: output2Pos.x + targetPadding, y: output2Pos.y };

  const textPadding = 20;
  const lineWidth = 2;

  const lineLabelOffsetNWLower = {
    x: -radius - textPadding + 5,
    y: -radius - textPadding,
  };
  const lineLabelOffsetSWLower = {
    x: -radius - textPadding,
    y: textPadding,
  };
  const lineLabelOffsetNWUpper = {
    x: -radius - textPadding,
    y: -textPadding,
  };
  const lineLabelOffsetSWUpper = {
    x: -radius - textPadding + 5,
    y: +radius + textPadding,
  };

  const getNeuronLabel = (layer: number, index: number) => {
    if (layer === 0) {
      return `x${index === 1 ? "₁" : "₂"}`;
    }
    if (layer === 1) {
      if (
        isStep("inputToHidden") ||
        isStep("weightAndBiasDeltas") ||
        isStep("weightBiasUpdate")
      )
        return `b${index === 1 ? "₁" : "₂"}¹`;
      return `${
        isBeforeStep("hiddenPreActivation")
          ? "h"
          : isStep("hiddenPreActivation")
            ? "z"
            : "a"
      }${index === 1 ? "₁" : "₂"}${
        isBeforeStep("hiddenPreActivation") ? "" : "¹"
      }`;
    }
    if (layer === 2) {
      if (
        isStep("hiddenToOutput") ||
        isStep("weightAndBiasDeltas") ||
        isStep("weightBiasUpdate")
      )
        return `b${index === 1 ? "₁" : "₂"}²`;
      return `${
        isBeforeStep("outputPreActivation")
          ? "o"
          : isStep("outputPreActivation")
            ? "z"
            : "ŷ"
      }${index === 1 ? "₁" : "₂"}${isStep("outputPreActivation") ? "²" : ""}`;
    }
    return `y${index === 1 ? "₁" : "₂"}`;
  };

  const getNeuronValue = (layer: number, index: number) => {
    if (layer === 0) {
      return setup.input[index - 1]!.toFixed(2);
    }
    if (layer === 1) {
      if (isBeforeStep("inputToHidden")) {
        return "";
      }
      if (isStep("inputToHidden")) {
        return networkData.b1[index - 1]!.toFixed(2);
      }
      if (isStep("hiddenPreActivation")) {
        return forwardPass.z1[index - 1]!.toFixed(2);
      }
      if (isStep("weightAndBiasDeltas")) {
        return gradients.db1[index - 1]!.toFixed(2);
      }
      if (isStep("weightBiasUpdate")) {
        return newNetworkData.newB1[index - 1]!.toFixed(2);
      }
      return forwardPass.a1[index - 1]!.toFixed(2);
    }
    if (layer === 2) {
      if (isBeforeStep("hiddenToOutput")) {
        return "";
      }
      if (isStep("hiddenToOutput")) {
        return networkData.b2[index - 1]!.toFixed(2);
      }
      if (isStep("outputPreActivation")) {
        return forwardPass.z2[index - 1]!.toFixed(2);
      }
      if (isStep("weightAndBiasDeltas")) {
        return gradients.db2[index - 1]!.toFixed(2);
      }
      if (isStep("weightBiasUpdate")) {
        return newNetworkData.newB2[index - 1]!.toFixed(2);
      }
      return forwardPass.a2[index - 1]!.toFixed(2);
    }
    return setup.target[index - 1]!.toFixed(2);
  };

  const getLineLabelValue = (layer: number, to: number, from: number) => {
    const name = `w${to === 1 ? "₁" : "₂"}${from === 1 ? "₁" : "₂"}${
      layer === 1 ? "¹" : "²"
    }`;
    if (isStep("weightAndBiasDeltas") && layer === 1) {
      return `${gradients.dw1[to - 1]![from - 1]!.toFixed(2)}`;
    }
    if (isStep("weightBiasUpdate") && layer === 1) {
      return `${newNetworkData.newW1[to - 1]![from - 1]!.toFixed(2)}`;
    }
    if (isStepOrAfter("inputToHidden") && layer === 1) {
      return networkData.w1[to - 1]![from - 1]!.toFixed(2);
    }
    if (isStep("weightAndBiasDeltas") && layer === 2) {
      return `${gradients.dw2[to - 1]![from - 1]!.toFixed(2)}`;
    }
    if (isStep("weightBiasUpdate") && layer === 2) {
      return `${newNetworkData.newW2[to - 1]![from - 1]!.toFixed(2)}`;
    }
    if (isStepOrAfter("hiddenToOutput") && layer === 2) {
      return networkData.w2[to - 1]![from - 1]!.toFixed(2);
    }
    return name;
  };

  const showDelta = (layer: number) => {
    if (
      layer === 2 &&
      isStepOrAfter("errorDerivativesWRTWeightedSumOutput") &&
      isBeforeStep("weightBiasUpdate")
    ) {
      return (
        <>
          <text
            x={output1Pos.x + textPadding}
            y={output1Pos.y - radius - textPadding}
            fill={colorError}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="18"
            fontWeight={500}
          >
            δ₁² = {gradients.dOutput[0]!.toFixed(2)}
          </text>
          <text
            x={output2Pos.x + textPadding}
            y={output2Pos.y - radius - textPadding}
            fill={colorError}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="18"
            fontWeight={500}
          >
            δ₂² = {gradients.dOutput[1]!.toFixed(2)}
          </text>
        </>
      );
    }
    if (
      layer === 1 &&
      isStepOrAfter("errorDerivativesWRTActivationHidden") &&
      isBeforeStep("weightBiasUpdate")
    ) {
      return (
        <>
          <text
            x={hidden1Pos.x + textPadding}
            y={hidden1Pos.y - radius - textPadding}
            fill={colorError}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="18"
            fontWeight={500}
          >
            {isStep("errorDerivativesWRTActivationHidden")
              ? `∂L/∂a₁¹=${gradients.dActivation1[0]!.toFixed(2)}`
              : `δ₁¹ = ${gradients.dHidden[0]!.toFixed(2)}`}
          </text>
          <text
            x={hidden2Pos.x + textPadding}
            y={hidden2Pos.y - radius - textPadding}
            fill={colorError}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="18"
            fontWeight={500}
          >
            {isStep("errorDerivativesWRTActivationHidden")
              ? `∂L/∂a₂¹=${gradients.dActivation1[1]!.toFixed(2)}`
              : `δ₂¹ = ${gradients.dHidden[1]!.toFixed(2)}`}
          </text>
        </>
      );
    }
  };

  const pulseNeuron = (layer: number) => {
    if (layer === 0 && isStep("inputs")) return true;
    if (
      layer === 1 &&
      (isStep("hiddenActivation") || isStep("hiddenPreActivation"))
    )
      return true;
    if (
      layer === 2 &&
      (isStep("outputSoftmax") || isStep("outputPreActivation"))
    )
      return true;
    if (layer === 3 && isStep("inputs")) return true;
    return false;
  };

  const moveLine = (fromLayer: number) => {
    if (fromLayer === 1 && isStep("inputToHidden")) return true;
    if (
      fromLayer === 2 &&
      (isStep("hiddenToOutput") ||
        isStep("errorDerivativesWRTActivationHidden"))
    )
      return true;
    if (
      fromLayer === 3 &&
      (isStep("errorCalculation") ||
        isStep("errorDerivativesWRTWeightedSumOutput"))
    )
      return true;
    return false;
  };
  const moveLeft = (fromLayer: number) => {
    if (fromLayer === 2 && isStep("errorDerivativesWRTActivationHidden"))
      return true;
    if (fromLayer === 3 && isStep("errorDerivativesWRTWeightedSumOutput"))
      return true;
    return false;
  };

  const getLineLabelColor = () => {
    if (isStep("weightAndBiasDeltas")) return colorError;
    if (isStep("weightBiasUpdate")) return colorTarget;
    return lineColor;
  };

  const getNeuronLabelColor = (layer: number) => {
    if (layer === 1 && isStep("weightAndBiasDeltas")) return colorError;
    if (layer === 2 && isStep("weightAndBiasDeltas")) return colorError;
    if (layer === 2 && isStep("weightBiasUpdate")) return colorTarget;
    if (layer === 1 && isStep("weightBiasUpdate")) return colorTarget;
    if (layer === 3) return colorTarget;
    if (layer === 0) return colorInput;
    if (layer === 1) return colorHidden;
    if (layer === 2) return colorOutput;
    return textColor;
  };

  const getNeuronColor = (layer: number) => {
    if (layer === 3) return colorTarget;
    if (layer === 0) return colorInput;
    if (layer === 1) return colorHidden;
    if (layer === 2) return colorOutput;
    return textColor;
  };

  return (
    <div className="bg-slate-850 rounded-lg border border-slate-700 border-2 shadow-lg mt-4 md:p-2 p-1 mb-2 w-full h-full">
      <svg
        viewBox="0 0 800 400"
        className="w-full h-auto block"
        role="img"
        aria-label="Neural network visualization"
      >
        {/* lines h2 */}
        {createLine(
          input1Pos.x + radius,
          input1Pos.y,
          hidden2Pos.x - radius,
          hidden2Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(1, 2, 1),
          getLineLabelColor(),
          {
            x: hidden2Pos.x + lineLabelOffsetNWLower.x,
            y: hidden2Pos.y + lineLabelOffsetNWLower.y,
          },
          false,
          moveLine(1),
          moveLeft(1),
        )}
        {createLine(
          input2Pos.x + radius,
          input2Pos.y,
          hidden2Pos.x - radius,
          hidden2Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(1, 2, 2),
          getLineLabelColor(),
          {
            x: hidden2Pos.x + lineLabelOffsetSWLower.x,
            y: hidden2Pos.y + lineLabelOffsetSWLower.y,
          },
          false,
          moveLine(1),
          moveLeft(1),
        )}
        {/* lines h1 */}
        {createLine(
          input1Pos.x + radius,
          input1Pos.y,
          hidden1Pos.x - radius,
          hidden1Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(1, 1, 1),
          getLineLabelColor(),
          {
            x: hidden1Pos.x + lineLabelOffsetNWUpper.x,
            y: hidden1Pos.y + lineLabelOffsetNWUpper.y,
          },
          false,
          moveLine(1),
          moveLeft(1),
        )}
        {createLine(
          input2Pos.x + radius,
          input2Pos.y,
          hidden1Pos.x - radius,
          hidden1Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(1, 1, 2),
          getLineLabelColor(),
          {
            x: hidden1Pos.x + lineLabelOffsetSWUpper.x,
            y: hidden1Pos.y + lineLabelOffsetSWUpper.y,
          },
          false,
          moveLine(1),
          moveLeft(1),
        )}
        {/* lines output1 */}
        {createLine(
          hidden1Pos.x + radius,
          hidden1Pos.y,
          output1Pos.x - radius,
          output1Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(2, 1, 1),
          getLineLabelColor(),
          {
            x: output1Pos.x + lineLabelOffsetNWUpper.x,
            y: output1Pos.y + lineLabelOffsetNWUpper.y,
          },
          false,
          moveLine(2),
          moveLeft(2),
        )}
        {createLine(
          hidden2Pos.x + radius,
          hidden2Pos.y,
          output1Pos.x - radius,
          output1Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(2, 1, 2),
          getLineLabelColor(),
          {
            x: output1Pos.x + lineLabelOffsetSWUpper.x,
            y: output1Pos.y + lineLabelOffsetSWUpper.y,
          },
          false,
          moveLine(2),
          moveLeft(2),
        )}
        {/* lines output2 */}
        {createLine(
          hidden1Pos.x + radius,
          hidden1Pos.y,
          output2Pos.x - radius,
          output2Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(2, 2, 1),
          getLineLabelColor(),
          {
            x: output2Pos.x + lineLabelOffsetNWLower.x,
            y: output2Pos.y + lineLabelOffsetNWLower.y,
          },
          false,
          moveLine(2),
          moveLeft(2),
        )}
        {createLine(
          hidden2Pos.x + radius,
          hidden2Pos.y,
          output2Pos.x - radius,
          output2Pos.y,
          lineColor,
          lineWidth,
          1,
          getLineLabelValue(2, 2, 2),
          getLineLabelColor(),
          {
            x: output2Pos.x + lineLabelOffsetSWLower.x,
            y: output2Pos.y + lineLabelOffsetSWLower.y,
          },
          false,
          moveLine(2),
          moveLeft(2),
        )}
        {/* lines target */}
        {createLine(
          output1Pos.x + radius,
          output1Pos.y,
          target1Pos.x - radius,
          target1Pos.y,
          lineColor,
          lineWidth,
          1,
          "",
          getLineLabelColor(),
          { x: 0, y: 0 },
          true,
          moveLine(3),
          moveLeft(3),
        )}
        {createLine(
          output2Pos.x + radius,
          output2Pos.y,
          target2Pos.x - radius,
          target2Pos.y,
          lineColor,
          lineWidth,
          1,
          "",
          getLineLabelColor(),
          { x: 0, y: 0 },
          true,
          moveLine(3),
          moveLeft(3),
        )}

        {/*inputs*/}
        {createNeuron(
          input1Pos.x,
          input1Pos.y,
          getNeuronLabel(0, 1),
          getNeuronLabelColor(0),
          { x: input1Pos.x, y: input1Pos.y + radius + textPadding },
          getNeuronValue(0, 1),
          getNeuronColor(0),
          radius,
          fillColor,
          pulseNeuron(0),
        )}
        {createNeuron(
          input2Pos.x,
          input2Pos.y,
          getNeuronLabel(0, 2),
          getNeuronLabelColor(0),
          { x: input2Pos.x, y: input2Pos.y + radius + textPadding },
          getNeuronValue(0, 2),
          getNeuronColor(0),
          radius,
          fillColor,
          pulseNeuron(0),
        )}
        {/* hidden */}
        {createNeuron(
          hidden1Pos.x,
          hidden1Pos.y,
          getNeuronLabel(1, 1),
          getNeuronLabelColor(1),
          { x: hidden1Pos.x, y: hidden1Pos.y + radius + textPadding },
          getNeuronValue(1, 1),
          getNeuronColor(1),
          radius,
          fillColor,
          pulseNeuron(1),
        )}
        {createNeuron(
          hidden2Pos.x,
          hidden2Pos.y,
          getNeuronLabel(1, 2),
          getNeuronLabelColor(1),
          { x: hidden2Pos.x, y: hidden2Pos.y + radius + textPadding },
          getNeuronValue(1, 2),
          getNeuronColor(1),
          radius,
          fillColor,
          pulseNeuron(1),
        )}
        {/* output */}
        {createNeuron(
          output1Pos.x,
          output1Pos.y,
          getNeuronLabel(2, 1),
          getNeuronLabelColor(2),
          { x: output1Pos.x, y: output1Pos.y + radius + textPadding },
          getNeuronValue(2, 1),
          getNeuronColor(2),
          radius,
          fillColor,
          pulseNeuron(2),
        )}
        {createNeuron(
          output2Pos.x,
          output2Pos.y,
          getNeuronLabel(2, 2),
          getNeuronLabelColor(2),
          { x: output2Pos.x, y: output2Pos.y + radius + textPadding },
          getNeuronValue(2, 2),
          getNeuronColor(2),
          radius,
          fillColor,
          pulseNeuron(2),
        )}
        {/* target */}
        {createNeuron(
          target1Pos.x,
          target1Pos.y,
          getNeuronLabel(3, 1),
          getNeuronLabelColor(3),
          { x: target1Pos.x, y: target1Pos.y + radius + textPadding },
          getNeuronValue(3, 1),
          getNeuronColor(3),
          radius,
          fillColor,
          pulseNeuron(3),
        )}
        {createNeuron(
          target2Pos.x,
          target2Pos.y,
          getNeuronLabel(3, 2),
          getNeuronLabelColor(3),
          { x: target2Pos.x, y: target2Pos.y + radius + textPadding },
          getNeuronValue(3, 2),
          getNeuronColor(3),
          radius,
          fillColor,
          pulseNeuron(3),
        )}
        {/* loss */}
        {isStepOrAfter("errorCalculation") && (
          <g>
            <rect
              x={target1Pos.x - radius}
              y={target1Pos.y + neuronYPadding / 2 - radius / 2}
              width={radius * 2}
              height={radius}
              fill={isStep("weightBiasUpdate") ? colorTarget : colorError}
              rx={6}
            />
            <text
              x={target1Pos.x - radius + (radius * 2) / 2}
              y={target1Pos.y + neuronYPadding / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isStep("weightBiasUpdate") ? fillColor : textColor}
              fontSize="16"
              fontWeight="700"
            >
              {`L = ${
                isBeforeStep("weightBiasUpdate")
                  ? lossValues.loss
                  : lossValues.newLoss
              }`}
            </text>
          </g>
        )}
        {showDelta(2)}
        {showDelta(1)}
      </svg>
    </div>
  );
};

export default BackpropVisual;
