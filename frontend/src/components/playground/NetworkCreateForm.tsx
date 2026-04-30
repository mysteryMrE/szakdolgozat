import { type FormEvent, useState } from "react";

interface NetworkCreateFormProps {
  onCreateNetwork: (name: string, layers: number[]) => void;
}

const NetworkCreateForm = ({ onCreateNetwork }: NetworkCreateFormProps) => {
  const [networkName, setNetworkName] = useState<string>("");
  const [layers, setLayers] = useState<number[]>([18, 9]);
  const [layerInput, setLayerInput] = useState(layers.join(","));
  const [isFocusedName, setIsFocusedName] = useState<boolean>(false);
  const [isFocusedLayers, setIsFocusedLayers] = useState<boolean>(false);

  const parseLayers = (value: string): number[] =>
    value
      .split(",")
      .map((layer) => parseInt(layer.trim(), 10))
      .filter((num) => !isNaN(num));

  const handleLayerChange = (value: string) => {
    setLayerInput(value);

    if (value.trim() === "") {
      setLayers([]);
      return;
    }

    const layerArray = parseLayers(value);

    setLayers(layerArray);
  };

  const handleLayerBlur = () => {
    setIsFocusedLayers(false);
    const normalizedLayers = parseLayers(layerInput);
    setLayers(normalizedLayers);
    setLayerInput(normalizedLayers.join(","));
  };

  const tryToCreate = (e: FormEvent) => {
    e.preventDefault();
    setLayerInput(layers.join(","));
    onCreateNetwork(networkName, layers);
  };

  return (
    <div className="content-box ">
      <form
        onSubmit={tryToCreate}
        className="flex flex-col sm:flex-row justify-around gap-4"
      >
        <div>
          <label
            htmlFor="networkName"
            className="block text-sm text-gray-400 mb-1"
          >
            Hálózat neve
          </label>
          <div className="relative">
            <input
              type="text"
              required
              id="networkName"
              maxLength={15}
              placeholder="Add meg a hálózat nevét"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              onFocus={() => setIsFocusedName(true)}
              onBlur={() => setIsFocusedName(false)}
              className="input-ring"
              aria-describedby="networkNameHint"
            />
            {
              <p
                id="networkNameHint"
                className={`${isFocusedName ? "opacity-100" : "opacity-0"} tooltip`}
              >
                A hálózat neve maximum 15 karakter hosszú lehet.
              </p>
            }
          </div>
        </div>
        <div>
          <label
            htmlFor="layers"
            id="layersLabel"
            className="block text-sm text-gray-400 mb-1"
          >
            Rétegek
          </label>
          <div className="relative">
            <input
              type="text"
              required
              id="layers"
              placeholder="Add meg a rétegeket"
              value={layerInput}
              onFocus={() => setIsFocusedLayers(true)}
              onChange={(e) => handleLayerChange(e.target.value)}
              onBlur={handleLayerBlur}
              className="input-ring"
              aria-describedby="layersHint"
            />
            <p
              id="layersHint"
              className={`${isFocusedLayers ? "opacity-100" : "opacity-0"} tooltip`}
            >
              Rétegek száma vesszővel elválasztva, pl.: 18,5,9. Az első rétegnek
              18, az utolsónak 9 neuronja kell legyen.
            </p>
          </div>
        </div>
        <div className="flex justify-end items-center">
          <button className="btn" type="submit">
            Neuronháló létrehozása
          </button>
        </div>
      </form>
    </div>
  );
};

export default NetworkCreateForm;
