import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { type NeuralNetwork, type NetworkDoc } from "../../types";
import { useError } from "../../contexts/ErrorContext";

/**
 * AI assisted code.
 * AI was used to fix complex reactflow types, calculate the layout, and create the skeleton of the component.
 * AI was also used to create regex.
 */

interface NeuronNodeData extends Record<string, unknown> {
  label: string;
  bias: string | null;
  layerType: "input" | "hidden" | "output";
  highlight: boolean;
}

const NeuronNode = ({ data }: { data: NeuronNodeData }) => {
  const { bias, layerType, highlight } = data;

  let backgroundColor = "bg-emerald-500";
  if (layerType === "input") backgroundColor = "bg-blue-500";
  if (layerType === "output") backgroundColor = "bg-red-500";

  return (
    <div
      className={`${layerType !== "input" ? "cursor-pointer" : ""} 
        ${highlight ? "border-6 border-amber-400" : ""} 
        ${
          layerType === "input" ? "w-[100px] h-[100px]" : "w-[190px] h-[190px]"
        } 
        rounded-full 
        relative 
        flex flex-col items-center justify-center 
        font-semibold font-mono text-4xl  text-white 
        ${backgroundColor}`}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <div>{bias !== null && `${Number(bias).toFixed(2)}`}</div>
    </div>
  );
};

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: any) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path pointer-events-none"
        d={edgePath}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`
              absolute
              -translate-x-1/2 -translate-y-1/2
              text-4xl font-bold font-mono text-white
              ${data.labelBgColor || "bg-emerald-500"}
              px-2 py-1
              rounded-lg
              border-2 border-white
              shadow-lg
              cursor-pointer
              pointer-events-auto
              z-[1000]
              ${
                data.selectedExists
                  ? data.isSelected
                    ? "opacity-100"
                    : "opacity-20"
                  : "opacity-100"
              }
            `}
            style={{
              transform: `translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (data.onWeightClick) {
                data.onWeightClick(id);
              }
            }}
            data-id={`label-${id}`}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  neuron: NeuronNode,
} as const;

const edgeTypes = {
  custom: CustomEdge,
} as const;

interface GraphEdge extends Edge {
  data?: {
    label: string | null;
    labelBgColor: string;
    isSelected?: boolean;
    selectedExists?: boolean;
    onWeightClick?: (weightId: string) => void;
  };
}

interface Graph {
  nodes: Node[];
  edges: GraphEdge[];
}

const buildGraph = (
  network: NeuralNetwork,
  selectedNeuron: string | null,
  selectedWeight: string | null,
  onWeightClick: (weightId: string) => void,
): Graph => {
  const nodes: Node[] = [];
  const edges: GraphEdge[] = [];
  const layerXGap = 1800;
  const neuronYGap = 200;
  let currYGap = neuronYGap;
  // Create nodes for each neuron
  network.layers.forEach((neuronCount, layerIndex) => {
    if (layerIndex === 0) {
      currYGap = neuronYGap / 1.2;
    } else {
      currYGap = neuronYGap;
    }
    const startY = (-(neuronCount - 1) * currYGap) / 2;

    for (let neuronIndex = 0; neuronIndex < neuronCount; neuronIndex++) {
      const nodeId = `L${layerIndex}N${neuronIndex}`;
      const x = layerIndex * layerXGap;
      const y = startY + neuronIndex * currYGap;

      let layerType: "input" | "hidden" | "output" = "hidden";
      if (layerIndex === 0) layerType = "input";
      if (layerIndex === network.layers.length - 1) layerType = "output";

      nodes.push({
        id: nodeId,
        type: "neuron",
        position: { x, y },
        data: {
          label: `${layerIndex}:${neuronIndex}`,
          bias:
            layerIndex > 0
              ? network.biases[layerIndex - 1]?.[neuronIndex] || 0
              : null,
          layerType,
          highlight: selectedNeuron === nodeId,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        selectable: layerIndex === 0 ? false : true,
      });
    }
  });

  for (
    let layerIndex = 0;
    layerIndex < network.layers.length - 1;
    layerIndex++
  ) {
    const currentLayerSize = network.layers[layerIndex] ?? 0;
    const nextLayerSize = network.layers[layerIndex + 1] ?? 0;

    for (let i = 0; i < currentLayerSize; i++) {
      for (let j = 0; j < nextLayerSize; j++) {
        // input neurons don't have weights
        // so layerIndex corresponds to the layerIndex+1 layer's weights
        const weight = network.weights[layerIndex]?.[j]?.[i] ?? 0;
        // e{layerIndexOfSource}-{sourceNeuron}-{targetNeuron}
        const edgeId = `e${layerIndex}-${i}-${j}`;
        const targetNodeId = `L${layerIndex + 1}N${j}`;

        const edgeColor = weight >= 0 ? "#10b981" : "#ef4444";
        const labelBgColor = weight >= 0 ? "bg-emerald-500" : "bg-red-500";
        const edgeOpacity = selectedNeuron === targetNodeId ? 1 : 0.2;
        const bonusMulti = selectedNeuron === targetNodeId ? 2 : 1;
        const edgeWidth = Math.min(
          40,
          Math.max(1, Math.abs(weight) * 2 * bonusMulti),
        );
        const shouldShowLabel = selectedNeuron === targetNodeId;

        edges.push({
          id: edgeId,
          source: `L${layerIndex}N${i}`,
          target: targetNodeId,
          type: "custom",
          style: {
            stroke: edgeColor,
            strokeWidth: edgeWidth,
            opacity: edgeOpacity,
          },
          data: {
            label: shouldShowLabel ? weight.toFixed(2) : null,
            labelBgColor: labelBgColor,
            isSelected: selectedWeight === edgeId,
            selectedExists: selectedWeight !== null,
            onWeightClick: onWeightClick,
          },
        });
      }
    }
  }

  return { nodes, edges };
};

interface NetworkEditorProps {
  networkDoc: NetworkDoc;
  saveNetwork: (network: NetworkDoc) => void;
}

const NetworkEditor = ({ networkDoc, saveNetwork }: NetworkEditorProps) => {
  const { addError } = useError();

  const MIN_VALUE = -10000;
  const MAX_VALUE = 10000;
  const PRECISION_DIGITS = 14;

  const clampValue = (value: number): number => {
    return Math.max(MIN_VALUE, Math.min(MAX_VALUE, value));
  };

  const formatValue = (value: number): number => {
    const rounded = parseFloat(value.toFixed(PRECISION_DIGITS));
    return Math.abs(rounded) < 1e-6 ? 0 : rounded;
  };

  const [neuralNetwork, setNeuralNetwork] = useState<NeuralNetwork>(
    networkDoc.nn,
  );
  const [selectedNeuron, setSelectedNeuron] = useState<string | null>(null);
  const [editingBias, setEditingBias] = useState<number | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);

  const [newNeuronLayerID, setNewNeuronLayerID] = useState<number>(1);
  const [newName, setNewName] = useState<string>(networkDoc.name);

  const [newLayerID, setNewLayerID] = useState<number>(1);

  const [isFocusedName, setIsFocusedName] = useState<boolean>(false);
  const [isFocusedNeuron, setIsFocusedNeuron] = useState<boolean>(false);
  const [isFocusedLayer, setIsFocusedLayer] = useState<boolean>(false);

  const handleWeightClick = useCallback(
    (weightId: string) => {
      const newSelectedWeight = selectedWeight === weightId ? null : weightId;
      setSelectedWeight(newSelectedWeight);

      if (newSelectedWeight) {
        // Parse the weight value from the neural network eg e{layerIndex}-{sourceNeuron}-{targetNeuron}
        const match = /^e(\d+)-(\d+)-(\d+)$/.exec(weightId);
        if (match) {
          const layerIndex = parseInt(match[1]!);
          const sourceNeuronIndex = parseInt(match[2]!);
          const targetNeuronIndex = parseInt(match[3]!);
          const weight =
            neuralNetwork.weights[layerIndex]?.[targetNeuronIndex]?.[
              sourceNeuronIndex
            ] ?? 0;
          setEditingWeight(weight);
        }
      } else {
        setEditingWeight(null);
      }
    },
    [selectedWeight, neuralNetwork],
  );

  const { nodes, edges } = useMemo(
    () =>
      buildGraph(
        neuralNetwork,
        selectedNeuron,
        selectedWeight,
        handleWeightClick,
      ),
    [neuralNetwork, selectedNeuron, selectedWeight, handleWeightClick],
  );

  const updateBias = useCallback(
    (neuronId: string, newBias: number) => {
      const match = /^L(\d+)N(\d+)$/.exec(neuronId);
      if (!match) return;

      const layerIndex = parseInt(match[1]!);
      const neuronIndex = parseInt(match[2]!);

      if (layerIndex === 0) return;

      // Clamp and format the bias value to safe range and precision
      const clampedBias = clampValue(newBias);
      const formattedBias = formatValue(clampedBias);

      const newNetwork: NeuralNetwork = { ...neuralNetwork };
      newNetwork.biases = [...neuralNetwork.biases];
      if (newNetwork.biases[layerIndex - 1]) {
        newNetwork.biases[layerIndex - 1] = [
          ...newNetwork.biases[layerIndex - 1]!,
        ];
        newNetwork.biases[layerIndex - 1]![neuronIndex] = formattedBias;
        setNeuralNetwork(newNetwork);

        // Update the editing value to show the formatted value
        if (formattedBias !== newBias) {
          setEditingBias(formattedBias);
        }
      }
    },
    [neuralNetwork, clampValue],
  );

  const updateWeight = useCallback(
    (weightId: string, newWeight: number) => {
      // e{layerIndex}-{sourceNeuron}-{targetNeuron}
      const match = /^e(\d+)-(\d+)-(\d+)$/.exec(weightId);
      if (!match) return;

      const layerIndex = parseInt(match[1]!);
      const sourceNeuronIndex = parseInt(match[2]!);
      const targetNeuronIndex = parseInt(match[3]!);

      // Clamp and format the weight value to safe range and precision
      const clampedWeight = clampValue(newWeight);
      const formattedWeight = formatValue(clampedWeight);

      const newNetwork: NeuralNetwork = { ...neuralNetwork };
      newNetwork.weights = [...neuralNetwork.weights];
      if (newNetwork.weights[layerIndex]) {
        newNetwork.weights[layerIndex] = [...newNetwork.weights[layerIndex]!];
        if (newNetwork.weights[layerIndex]![targetNeuronIndex]) {
          newNetwork.weights[layerIndex]![targetNeuronIndex] = [
            ...newNetwork.weights[layerIndex]![targetNeuronIndex]!,
          ];
          newNetwork.weights[layerIndex]![targetNeuronIndex]![
            sourceNeuronIndex
          ] = formattedWeight;
          setNeuralNetwork(newNetwork);

          // Update the editing value to show the formatted value
          if (formattedWeight !== newWeight) {
            setEditingWeight(formattedWeight);
          }
        }
      }
    },
    [neuralNetwork, clampValue],
  );

  const canBeDeleted = useCallback(
    (neuronId: string | null): boolean => {
      if (!neuronId) return false;
      // L{layerIndex}N{neuronIndex}
      const match = /^L(\d+)N(\d+)$/.exec(neuronId);
      if (!match) return false;

      const layerIndex = parseInt(match[1]!);
      if (!neuralNetwork || !layerIndex) return false;

      return (
        layerIndex > 0 &&
        layerIndex < neuralNetwork.layers.length - 1 &&
        (neuralNetwork.layers[layerIndex] ?? -1) !== -1
      );
    },
    [neuralNetwork],
  );

  const deleteNeuron = useCallback(
    (neuronId: string | null) => {
      if (!neuronId) return;
      const match = /^L(\d+)N(\d+)$/.exec(neuronId);
      if (!match) return;

      const layerIndex = parseInt(match[1]!);
      const neuronIndex = parseInt(match[2]!);
      const newNetwork: NeuralNetwork = { ...neuralNetwork };
      if (layerIndex === 0 || layerIndex === neuralNetwork.layers.length - 1) {
        return;
      }
      if ((neuralNetwork.layers[layerIndex] ?? -1) === -1) {
        addError("Nincs ilyen réteg / neuronháló");
        return;
      }
      if ((neuralNetwork.layers[layerIndex] ?? 0) <= 1) {
        newNetwork["layers"] = [...neuralNetwork.layers].filter(
          (_, index) => index !== layerIndex,
        );
        newNetwork["biases"] = [...neuralNetwork.biases].filter(
          (_, index) => index !== layerIndex - 1,
        );
        //Remake weights to match new layers
        newNetwork["weights"] = [];
        neuralNetwork.weights.forEach((weightMatrix, index) => {
          if (index === layerIndex - 1) {
            console.log("skip");
          } else if (index === layerIndex) {
            const prevLayerSize = neuralNetwork.layers[index - 1]!;
            const nextLayerSize = neuralNetwork.layers[index + 1]!;
            const newWeightMatrix: number[][] = [];
            for (let i = 0; i < nextLayerSize; i++) {
              const newWeightRow: number[] = [];
              for (let j = 0; j < prevLayerSize; j++) {
                newWeightRow[j] = Math.random() * 2 - 1;
              }
              newWeightMatrix[i] = newWeightRow;
            }
            newNetwork["weights"].push(newWeightMatrix);
          } else {
            newNetwork["weights"].push(weightMatrix);
          }
        });
      } else if ((neuralNetwork.layers[layerIndex] ?? 0) > 1) {
        console.log("Delete neuron in layer");
        // Remove neuron from layer
        newNetwork["layers"] = [...neuralNetwork.layers];
        newNetwork["layers"][layerIndex] =
          (newNetwork["layers"][layerIndex] ?? 1) - 1;
        // Remove corresponding biases
        newNetwork["biases"] = [...neuralNetwork.biases];
        newNetwork["biases"][layerIndex - 1] = (
          newNetwork["biases"][layerIndex - 1] ?? []
        ).filter((_, index) => index !== neuronIndex);
        // Remove corresponding weights
        console.log(newNetwork);
        newNetwork["weights"] = neuralNetwork.weights.map(
          (weightMatrix, index) => {
            console.log("Weight matrix", index, weightMatrix);
            if (index === layerIndex - 1) {
              // remove the whole line = weights for the neuron
              const newStuff = weightMatrix.filter((row, rowIndex) => {
                if (rowIndex !== neuronIndex) return row;
              });
              return newStuff;
            }
            if (index === layerIndex) {
              // filter out the weights that come from the neuron
              return weightMatrix.map((row) =>
                row.filter((_, colIndex) => colIndex !== neuronIndex),
              );
            }
            return weightMatrix;
          },
        );
        console.log("New weights", newNetwork.weights);
      }
      console.log("Delete neuron at layer", layerIndex, "index", neuronIndex);
      setSelectedNeuron(null);
      setNeuralNetwork(newNetwork);
    },
    [neuralNetwork, selectedNeuron],
  );

  const addNeuron = useCallback(
    (layerIndex: number) => {
      if (!neuralNetwork) return;
      if (layerIndex <= 0 || layerIndex >= neuralNetwork.layers.length - 1) {
        addError("Csak rejtett réteghez lehet neuront hozzáadni");
        return;
      }
      const newNetwork: NeuralNetwork = { ...neuralNetwork };
      newNetwork["layers"] = [...neuralNetwork.layers];
      newNetwork["layers"][layerIndex] =
        (newNetwork["layers"][layerIndex] ?? 0) + 1;
      newNetwork["biases"] = [...neuralNetwork.biases];
      newNetwork["biases"][layerIndex - 1] = [
        Math.random() * 2 - 1,
        ...(newNetwork["biases"][layerIndex - 1] ?? []),
      ];
      newNetwork["weights"] = neuralNetwork.weights.map(
        (weightMatrix, index) => {
          if (index === layerIndex - 1) {
            const newRow = Array.from(
              { length: weightMatrix[0]?.length ?? 0 },
              () => Math.random() * 2 - 1,
            );
            return [newRow, ...weightMatrix];
          } else if (index === layerIndex) {
            return weightMatrix.map((row) => [Math.random() * 2 - 1, ...row]);
          }
          return weightMatrix;
        },
      );
      console.log(newNetwork);
      setNeuralNetwork(newNetwork);
    },
    [neuralNetwork],
  );

  const addLayer = useCallback(
    (layerIndex: number) => {
      if (!neuralNetwork) return;
      if (layerIndex <= 0 || layerIndex > neuralNetwork.layers.length - 1) {
        addError(
          "Csak a bemeneti és kimeneti réteg közé lehet réteget hozzáadni",
        );
        return;
      }
      const newNetwork: NeuralNetwork = { ...neuralNetwork };
      newNetwork["layers"] = [...neuralNetwork.layers];
      newNetwork["layers"].splice(layerIndex, 0, 1);
      newNetwork["biases"] = [...neuralNetwork.biases];
      newNetwork["biases"].splice(layerIndex - 1, 0, [Math.random() * 2 - 1]);
      newNetwork["weights"] = [...neuralNetwork.weights];
      newNetwork["weights"].splice(layerIndex - 1, 0, [
        Array.from(
          { length: neuralNetwork.layers[layerIndex - 1]! },
          () => Math.random() * 2 - 1,
        ),
      ]); // inserted new weights for the 1 neuroned layer
      //need to replace the following weights with random ones
      newNetwork["weights"].splice(
        layerIndex,
        1,
        Array.from({ length: neuralNetwork.layers[layerIndex]! }, () =>
          Array.from({ length: 1 }, () => Math.random() * 2 - 1),
        ),
      );
      console.log(newNetwork);
      setNeuralNetwork(newNetwork);
    },
    [neuralNetwork],
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveNetwork({ ...networkDoc, name: newName, nn: neuralNetwork });
  };

  return (
    <div className="text-white flex flex-col mt-5">
      <div className="p-6 bg-gray-800 rounded-lg flex flex-col gap-5">
        <h1 className="text-2xl font-bold mb-2 text-white">Szerkesztő</h1>
        <span className="block text-sm text-gray-400">
          Az első, és az utolsó réteg neuronszáma nem módosítható. A bemeneti
          réteg a 0-ás indexű.
        </span>
        <div>
          <form onSubmit={handleSave}>
            <label
              htmlFor="editName"
              className="block text-sm text-gray-400 mb-1"
            >
              Név
            </label>
            <div className="flex gap-10">
              <div className="relative flex-1">
                <input
                  id="editName"
                  type="text"
                  required
                  maxLength={15}
                  placeholder="Hálózat neve"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                  }}
                  onFocus={() => setIsFocusedName(true)}
                  onBlur={() => setIsFocusedName(false)}
                  className="flex-1 input-ring"
                  aria-describedby="editNameHint"
                />
                <p
                  id="editNameHint"
                  className={`${isFocusedName ? "opacity-100" : "opacity-0"} tooltip`}
                >
                  A név maximum 15 karakter hosszú lehet.
                </p>
              </div>
              <button type="submit" className="btn px-10">
                Mentés
              </button>
            </div>
          </form>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div>
            <span className="block text-sm text-gray-400 mb-1">
              Kiválasztott neuron törlése
            </span>
            <button
              onClick={() => {
                deleteNeuron(selectedNeuron);
              }}
              tabIndex={-1}
              className={`btn bg-red-600  text-white font-semibold transition w-full ${
                canBeDeleted(selectedNeuron)
                  ? "hover:bg-red-700"
                  : "opacity-50 cursor-not-allowed hover:bg-red-600"
              }`}
            >
              Törlés
            </button>
          </div>

          <div>
            <label
              htmlFor="addNeuron"
              className="block text-sm text-gray-400 mb-1"
            >
              Neuron hozzáadás réteghez
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="addNeuron"
                  type="number"
                  value={newNeuronLayerID}
                  step={1}
                  min={1}
                  max={neuralNetwork.layers.length - 2}
                  onChange={(e) =>
                    setNewNeuronLayerID(
                      Math.min(
                        Math.max(Math.round(Number(e.target.value)), 1),
                        neuralNetwork.layers.length - 2,
                      ),
                    )
                  }
                  className="flex-1 input-ring"
                  tabIndex={-1}
                  disabled={neuralNetwork.layers.length - 2 <= 0}
                  aria-describedby="addNeuronHint"
                  onFocus={() => setIsFocusedNeuron(true)}
                  onBlur={() => setIsFocusedNeuron(false)}
                />
                <p
                  id="addNeuronHint"
                  className={`${isFocusedNeuron ? "opacity-100" : "opacity-0"} tooltip`}
                >
                  {neuralNetwork.layers.length - 2 > 0
                    ? `A réteg indexe, amihez neuront szeretnél hozzáadni (1..${
                        neuralNetwork.layers.length - 2
                      }).`
                    : "Nincs rejtett réteg a hálózatban."}
                </p>
              </div>
              <button
                onClick={() => addNeuron(newNeuronLayerID)}
                className={`btn ${
                  neuralNetwork.layers.length - 2 > 0
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-green-600 cursor-not-allowed opacity-50 "
                }`}
                tabIndex={-1}
                disabled={neuralNetwork.layers.length - 2 <= 0}
              >
                Hozzáadás
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="addLayer"
              className="block text-sm text-gray-400 mb-1"
            >
              Új réteg
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="addLayer"
                  type="number"
                  min={1}
                  max={neuralNetwork.layers.length - 1}
                  step={1}
                  value={newLayerID}
                  onChange={(e) =>
                    setNewLayerID(
                      Math.min(
                        Math.max(Math.round(Number(e.target.value)), 1),
                        neuralNetwork.layers.length - 1,
                      ),
                    )
                  }
                  className="flex-1 input-ring"
                  tabIndex={-1}
                  aria-describedby="addLayerHint"
                  onFocus={() => setIsFocusedLayer(true)}
                  onBlur={() => setIsFocusedLayer(false)}
                />
                <p
                  className={`${isFocusedLayer ? "opacity-100" : "opacity-0"} tooltip`}
                  id="addLayerHint"
                >
                  {`Az új réteg indexe (1..${
                    neuralNetwork.layers.length - 1
                  }).`}
                </p>
              </div>
              <button
                onClick={() => addLayer(newLayerID)}
                className="btn bg-green-600 hover:bg-green-700"
                tabIndex={-1}
              >
                Hozzáadás
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-1 h-[80vh]">
        <style>{`
          .react-flow__controls-button {
            background-color: #ffffff !important;
            border: 1px solid #000000 !important;
            color: #000000 !important;
          }
          .react-flow__attribution {
            display: none;
          }
          .react-flow__controls-interactive { 
            display: none !important; 
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={(_, node) => {
            const layerType = node.data.layerType;
            if (layerType === "input") {
              return;
            }
            const newSelectedNeuron =
              selectedNeuron === node.id ? null : node.id;
            setSelectedNeuron(newSelectedNeuron);
            setSelectedWeight(null);
            setEditingWeight(null);
            if (newSelectedNeuron && node.data.bias !== null) {
              setEditingBias(
                node.data.bias !== null && node.data.bias !== undefined
                  ? Number(node.data.bias)
                  : null,
              );
            } else {
              setEditingBias(null);
            }
          }}
          fitView
          minZoom={0.08}
          maxZoom={1.0}
          nodesFocusable={false}
          edgesFocusable={false}
          disableKeyboardA11y={false}
        >
          <Background color="#374151" />
          <Controls />
          {selectedNeuron && (
            <div className="absolute top-4 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg p-3 min-w-[200px]">
              <label
                htmlFor="bias"
                className="font-semibold mb-2 select-none text-white block"
              >
                Torzítás
              </label>
              <input
                tabIndex={-1}
                id="bias"
                type="number"
                step="0.01"
                min={MIN_VALUE}
                max={MAX_VALUE}
                value={editingBias ?? 0}
                onChange={(e) => setEditingBias(Number(e.target.value))}
                onBlur={(e) => {
                  const newBias = parseFloat(e.target.value);
                  if (!isNaN(newBias)) {
                    updateBias(selectedNeuron, newBias);
                  }
                }}
                className="input-ring px-2 py-1"
                placeholder={`Enter bias value (${MIN_VALUE} to ${MAX_VALUE})`}
                title={`Add meg a torzítás értékét ${MIN_VALUE} és ${MAX_VALUE} között.`}
              />
            </div>
          )}
          {selectedWeight && (
            <div className="absolute top-30 right-4 z-10 bg-gray-800 border border-gray-700 rounded-lg p-3 min-w-[200px]">
              <label
                htmlFor="weight"
                className="font-semibold mb-2 select-none text-white block"
              >
                Súly
              </label>
              <input
                tabIndex={-1}
                id="weight"
                type="number"
                step="0.01"
                min={MIN_VALUE}
                max={MAX_VALUE}
                value={editingWeight ?? 0}
                onChange={(e) => setEditingWeight(Number(e.target.value))}
                onBlur={(e) => {
                  const newWeight = parseFloat(e.target.value);
                  if (!isNaN(newWeight)) {
                    updateWeight(selectedWeight, newWeight);
                  }
                }}
                className="input-ring px-2 py-1"
                placeholder={`Enter weight value (${MIN_VALUE} to ${MAX_VALUE})`}
                title={`Add meg a súly értékét ${MIN_VALUE} és ${MAX_VALUE} között.`}
              />
            </div>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default NetworkEditor;
