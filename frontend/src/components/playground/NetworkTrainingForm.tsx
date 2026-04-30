import { useState, type FormEvent } from "react";
import type { TrainStatus } from "../../types";

interface NetworkTrainingFormProps {
  networkId: string | null;
  networkName: string | null;
  onTrainNetwork: (
    networkId: string,
    epochs: number,
    learningRate: number,
    earlyStopping: number,
  ) => void;
  job: TrainStatus | null;
  minEpochs?: number;
  maxEpochs?: number;
  minLearningRate?: number;
  maxLearningRate?: number;
  minEarlyStopping?: number;
  maxEarlyStopping?: number;
}

const NetworkTrainingForm = ({
  job,
  networkId,
  onTrainNetwork,
  networkName,
  minEpochs = 10,
  maxEpochs = 10000,
  minLearningRate = 0.000001,
  maxLearningRate = 30,
  minEarlyStopping = 0,
  maxEarlyStopping = 25,
}: NetworkTrainingFormProps) => {
  const [localEpochs, setLocalEpochs] = useState(10);
  const [localLearningRate, setLocalLearningRate] = useState(0.01);
  const [localEarlyStopping, setLocalEarlyStopping] = useState(0.01);
  const [isFocusedEpochs, setIsFocusedEpochs] = useState(false);
  const [isFocusedLearningRate, setIsFocusedLearningRate] = useState(false);
  const [isFocusedEarlyStopping, setIsFocusedEarlyStopping] = useState(false);

  const normalizeEpochs = (value: number) =>
    Math.max(minEpochs, Math.min(maxEpochs, value || 10));

  const normalizeLearningRate = (value: number) =>
    Math.max(minLearningRate, Math.min(maxLearningRate, value || 0.001));

  const normalizeEarlyStopping = (value: number) =>
    Math.max(minEarlyStopping, Math.min(maxEarlyStopping, value || 0.0001));

  const handleEpochsBlur = () => {
    setIsFocusedEpochs(false);
    setLocalEpochs((prev) => normalizeEpochs(prev));
  };

  const handleLearningRateBlur = () => {
    setIsFocusedLearningRate(false);
    setLocalLearningRate((prev) => normalizeLearningRate(prev));
  };

  const handleEarlyStoppingBlur = () => {
    setIsFocusedEarlyStopping(false);
    setLocalEarlyStopping((prev) => normalizeEarlyStopping(prev));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (job && (job.status === "running" || job.status === "queued")) {
      return;
    }

    const finalEarlyStopping = normalizeEarlyStopping(localEarlyStopping);
    const finalEpochs = normalizeEpochs(localEpochs);
    const finalLearningRate = normalizeLearningRate(localLearningRate);

    setLocalEarlyStopping(finalEarlyStopping);
    setLocalEpochs(finalEpochs);
    setLocalLearningRate(finalLearningRate);

    if (networkId) {
      onTrainNetwork(
        networkId,
        finalEpochs,
        finalLearningRate,
        finalEarlyStopping,
      );
    }
  };

  return (
    <>
      {networkId && (
        <div className="content-box mt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="block text-sm text-gray-400 mb-1">Név</span>
                <span className="inline-block px-3 py-2 bg-gray-700 rounded w-full text-white">
                  {networkName}
                </span>
              </div>

              <div>
                <label
                  htmlFor="epochs"
                  className="block text-sm text-gray-400 mb-1"
                >
                  Iterációk száma
                </label>
                <div className="relative w-full">
                  <input
                    id="epochs"
                    type="number"
                    placeholder={`Add meg az iterációk számát (${minEpochs}-${maxEpochs})`}
                    value={localEpochs}
                    onChange={(e) => {
                      setLocalEpochs(Number(e.target.value));
                      console.log("Changing epochs", e.target.value);
                    }}
                    onFocus={() => setIsFocusedEpochs(true)}
                    onBlur={handleEpochsBlur}
                    className="input-ring"
                    aria-describedby="setEpochsHint"
                  />
                  <p
                    id="setEpochsHint"
                    className={`${isFocusedEpochs ? "opacity-100" : "opacity-0"} tooltip`}
                  >
                    Az iterációk száma ({minEpochs}-{maxEpochs})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="learningRate"
                  className="block text-sm text-gray-400 mb-1"
                >
                  Kezdeti tanulási ráta
                </label>
                <div className="relative w-full">
                  <input
                    id="learningRate"
                    type="number"
                    step="0.001"
                    placeholder="0.000001 - 1"
                    value={localLearningRate}
                    onChange={(e) =>
                      setLocalLearningRate(Number(e.target.value))
                    }
                    onBlur={handleLearningRateBlur}
                    onFocus={() => setIsFocusedLearningRate(true)}
                    className="input-ring"
                    aria-describedby="setLearningRateHint"
                  />
                  <p
                    id="setLearningRateHint"
                    className={`${isFocusedLearningRate ? "opacity-100" : "opacity-0"} tooltip`}
                  >
                    Kezdeti tanulási ráta, ({minLearningRate}-{maxLearningRate})
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="earlyStopping"
                  className="block text-sm text-gray-400 mb-1"
                >
                  Korai terminálási határ (veszteség)
                </label>
                <div className="relative w-full">
                  <input
                    id="earlyStopping"
                    type="number"
                    step="0.005"
                    placeholder="0 - 100"
                    value={localEarlyStopping}
                    onChange={(e) =>
                      setLocalEarlyStopping(Number(e.target.value))
                    }
                    onFocus={() => setIsFocusedEarlyStopping(true)}
                    onBlur={handleEarlyStoppingBlur}
                    className="input-ring"
                    aria-describedby="setEarlyStoppingHint"
                  />
                  <p
                    id="setEarlyStoppingHint"
                    className={`${isFocusedEarlyStopping ? "opacity-100" : "opacity-0"} tooltip`}
                  >
                    Korai terminálási határ, ({minEarlyStopping}-
                    {maxEarlyStopping})
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className={`btn ${
                  job && (job.status === "running" || job.status === "queued")
                    ? "bg-blue-600 opacity-50 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={
                  (job &&
                    (job.status === "running" || job.status === "queued")) ??
                  undefined
                }
              >
                Tanítás indítása
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default NetworkTrainingForm;
