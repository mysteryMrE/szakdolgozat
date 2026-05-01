import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  useCallback,
} from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";
import NetworkTable from "../components/playground/NetworkTable";
import NetworkCreateForm from "../components/playground/NetworkCreateForm";
import NetworkTrainingForm from "../components/playground/NetworkTrainingForm";
import NetworkTrainingStatus from "../components/playground/NetworkTrainingStatus";
import { handleApiError } from "../utils";

import { type NetworkDoc, type TrainStatus } from "../types";
import NetworkEditor from "../components/playground/NetworkEditor";
import { useError } from "../contexts/ErrorContext";
import { useJob } from "../contexts/JobContext";
import { useWindowSize } from "../contexts/WindowSizeContext";

const invalidNetworkParametersMessage =
  "Adjon meg egy érvényes rétegkonfigurációt. (pl. 18,9)";
let ids = 0;
/**
 * Playground component for managing, editing, and training neural networks.
 * @returns The rendered Playground component.
 */
const PlaygroundPage = (): ReactNode => {
  const { addError } = useError();
  const { getFreshToken } = useAuth();
  const {
    jobID: jobContextID,
    jobNetworkName,
    setJobNetworkName,
    setJobID: setJobContextID,
    clearJob: clearJobContext,
  } = useJob();
  const [networkId, setNetworkId] = useState<string>("");
  const [editNetworkId, setEditNetworkId] = useState<string>("");
  const [networkRefreshKey, setNetworkRefreshKey] = useState<number>(0);

  const [networks, setNetworks] = useState<NetworkDoc[]>([]);
  const [toggleStatus, setToggleStatus] = useState<boolean>(true);

  const [jobStatus, setJobStatus] = useState<TrainStatus | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollerCancelRef = useRef<(() => void) | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const lastMessageRef = useRef<number>(Date.now());
  const pollingTimeoutRef = useRef<number | null>(null);
  const isSubscribingRef = useRef<boolean>(false); // Guard against double subscription
  const isMountedRef = useRef<boolean>(true);

  const selectedNetwork = networks.find((n) => n.id === editNetworkId) ?? null;

  const { isAboveMd } = useWindowSize();

  useEffect(() => {
    if (!isAboveMd) {
      setEditNetworkId("");
    }
  }, [isAboveMd]);

  // On component mount, check if there's an ongoing job in context and try to reconnect
  useEffect(() => {
    isMountedRef.current = true;
    const id = ++ids;
    console.debug("PlaygroundPage mounted, checking for ongoing job..." + id);
    if (jobContextID) {
      console.debug("Condition passed, calling reconnect() " + id);
      const reconnect = async () => {
        try {
          console.debug("Checking status:", jobContextID + " " + id);
          const response = await api.get(`/jobs/train/${jobContextID}/status`);
          const status: TrainStatus = response.data;
          status["networkName"] = jobNetworkName!;
          setJobStatus(status);
          setToggleStatus(true);
          if (!isMountedRef.current) return;
          if (status.status === "running" || status.status === "queued") {
            if (!isSubscribingRef.current) {
              console.debug("Subscribing NOW:", jobContextID + " " + id);
              isSubscribingRef.current = true;
              await subscribeToTraining(jobContextID, id);
            }
          } else if (status.status === "done" || status.status === "error") {
            clearJobContext();
          }
        } catch (error) {
          handleApiError(error, { addErrorCallback: addError });
        }
      };

      reconnect();
    } else {
      setToggleStatus(false);
    }

    return () => {
      isMountedRef.current = false;
      console.debug("PlaygroundPage unmounting, cleaning up..." + id);
      isSubscribingRef.current = false;
      if (sseRef.current) sseRef.current.close();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      pollerCancelRef.current?.();
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      sseRef.current = null;
      heartbeatRef.current = null;
      pollerCancelRef.current = null;
      pollingTimeoutRef.current = null;
    };
  }, []);

  /**
   * Trigger network creation API call. If successful, adds the new network to state.
   * @param networkName The name of the network to create
   * @param layers The layer configuration for the network
   * @returns A promise that resolves when the network is created.
   */
  const createNetwork = async (
    networkName: string,
    layers: number[],
  ): Promise<void> => {
    if (networkName && layers.length > 1) {
      try {
        const response = await api.post("/networks/create_network", {
          name: networkName,
          layers: layers,
        });

        console.debug("Network created:", response.data);
        setNetworks((prev) => [...prev, response.data]);
      } catch (error) {
        handleApiError(error, { addErrorCallback: addError });
      }
    } else {
      addError(invalidNetworkParametersMessage);
    }
  };

  const listNetworks = useCallback(async () => {
    try {
      const response = await api.get("/networks/list_networks");
      setNetworks(response.data);
      setNetworkRefreshKey((prev) => (prev + 1) % 1000);
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
    }
  }, [addError]);

  const deleteNetwork = async (id: string) => {
    try {
      const response = await api.delete(`/networks/${id}`);
      console.debug("Network deleted:", response.data);
      setNetworks((prev) => prev.filter((net) => net.id !== id));
      if (networkId === id) {
        setNetworkId("");
        setToggleStatus(false);
      }
    } catch (error) {
      handleApiError(error, { addErrorCallback: addError });
    }
  };

  const openEdit = (id: string) => {
    if (editNetworkId === id) {
      setEditNetworkId("");
      return;
    }
    setEditNetworkId(id);
  };

  const openTrainMenu = (id: string) => {
    if (networkId === id) {
      setNetworkId("");
      setToggleStatus(false);
      return;
    }
    setNetworkId(id);
    setToggleStatus(true);
  };

  /**
   * Triggers network training API call.
   *
   * Sets jobStatus, jobContext id and name, and subscribes to the training.
   * @param networkId The ID of the network to train
   * @param epochs Number of training epochs
   * @param learningRate Learning rate for training
   * @param earlyStopping Early stopping threshold
   * @returns A promise that resolves when training subscription is set up.
   */
  const trainNetwork = async (
    networkId: string,
    epochs: number,
    learningRate: number,
    earlyStopping: number,
  ): Promise<void> => {
    console.debug("Starting training for network:", networkId);
    if (networkId && epochs && learningRate && earlyStopping) {
      try {
        console.debug("Training network with ID:", networkId);
        const response = await api.post(`/jobs/train`, {
          networkId: networkId,
          method: "backpropagation",
          params: {
            epochs: epochs,
            learning_rate: learningRate,
            early_stopping_threshold: earlyStopping,
          },
        });
        const data: TrainStatus = response.data;
        const name = networks.find((n) => n.id === networkId)?.name || "";
        setJobStatus({
          ...data,
          networkName: name,
        });
        setJobContextID(data.jobId);
        setJobNetworkName(name);
        console.debug("Network training started:", response.data);
        if (!isMountedRef.current) return;
        await subscribeToTraining(data.jobId, 0);
      } catch (error) {
        handleApiError(error, { addErrorCallback: addError });
      }
    }
  };

  /**
   * Subscribes to training events for a specific job.
   * @param jobId The ID of the job to subscribe to.
   * @returns A promise that resolves when the subscription is successful.
   */
  const subscribeToTraining = async (
    jobId: string,
    id: number,
  ): Promise<void> => {
    console.debug("Subscribing to training events for job:", jobId + " " + id);
    // Clean up any previous connections (shouldn't happen with guard)
    pollerCancelRef.current?.();
    pollerCancelRef.current = null;
    console.debug("Cancelled previous poller and set to null " + id);

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    if (sseRef.current) {
      console.debug("Closing previous SSE connection " + id);
      sseRef.current.close();
      sseRef.current = null;
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    lastMessageRef.current = Date.now();

    const token = await getFreshToken();
    if (!isMountedRef.current) {
      console.debug(
        `[${id}] Component unmounted during token fetch. Aborting subscription.`,
      );
      isSubscribingRef.current = false; // Reset lock
      return;
    }
    if (!token) {
      addError("Nem sikerült friss tokent szerezni");
      return;
    }

    console.debug("fresh token obtained for job:", jobId + " " + id);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const url = `${backendUrl}/jobs/train/${jobId}/events?token=${token}`;
    console.debug("Attempting SSE connection to URL:", url + " " + id);

    let eventSource: EventSource;
    try {
      eventSource = new EventSource(url);
    } catch {
      addError("SSE kapcsolat létrehozása sikertelen, polling-ra váltás");
      startPolling(jobId);
      return;
    }
    console.debug(
      "Established SSE connection object for job:",
      jobId + " " + id,
    );
    console.log(
      "EventSource readyState after establishment:",
      eventSource.readyState,
    );
    if (!eventSource) {
      console.log("wtf");
    }
    sseRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened successfully");
      lastMessageRef.current = Date.now();
    };

    // Heartbeat to detect dead connections
    const localCapture = setInterval(() => {
      console.log(`[SSE] Heartbeat check ${id}`);
      if (Date.now() - lastMessageRef.current > 30000) {
        // kill the timer for sure
        clearInterval(localCapture);

        // only clear ref if this is the currently active timer
        if (heartbeatRef.current === localCapture) {
          if (sseRef.current) {
            // sse and heartbeat are linked
            sseRef.current.close();
          }
          sseRef.current = null;
          heartbeatRef.current = null;

          if (isMountedRef.current) {
            startPolling(jobId);
            console.log("stopped heartbeat and SSE, started polling " + id);
          }
        } else {
          console.log(
            `[${id}] Heartbeat timed out but skipped clearing, because stale.`,
          );
        }
      }
    }, 10000);

    heartbeatRef.current = localCapture;

    eventSource.onmessage = (event) => {
      lastMessageRef.current = Date.now();
      //console.log("Received SSE raw event:", event);
      try {
        const message = JSON.parse(event.data);
        //error, progress, log, metric, done
        if (message.type === "progress") {
          setJobStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: prev.status === "queued" ? "running" : prev.status,
                  progress: Number(message.progress ?? prev.progress),
                }
              : {
                  jobId: jobId,
                  status: "running",
                  progress: Number(message.progress ?? 0),
                },
          );
        } else if (message.type === "metric") {
          setJobStatus((prev) => {
            const history = prev?.history ? [...prev.history] : [];
            if (typeof message.accuracy === "number") {
              history.push(message.accuracy);
            }
            const newUpdates = {
              accuracy: message.accuracy,
              loss: message.loss,
              history,
            };
            if (prev) {
              return { ...prev, ...newUpdates };
            }
            return {
              jobId: jobId,
              status: "running",
              progress: 0,
              ...newUpdates,
            };
          });
        } else if (message.type === "done") {
          setJobStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: "done",
                  progress: 1,
                  accuracy: message.accuracy,
                  loss: message.loss,
                }
              : {
                  jobId: jobId,
                  status: "done",
                  progress: 1,
                  accuracy: message.accuracy,
                  loss: message.loss,
                },
          );
          clearJobContext();
          if (sseRef.current) sseRef.current.close();
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          sseRef.current = null;
          heartbeatRef.current = null;
          listNetworks();
        } else if (message.type === "error") {
          setJobStatus((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  error: message.error || "Training failed",
                }
              : {
                  jobId: jobId,
                  status: "error",
                  progress: 0,
                  error: message.error || "Training failed",
                },
          );
          clearJobContext();
          if (sseRef.current) sseRef.current.close();
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          sseRef.current = null;
          heartbeatRef.current = null;
          listNetworks();
        }
      } catch (err) {
        console.warn("SSE parse error:", err);
      }
    };

    eventSource.onerror = (error) => {
      clearInterval(localCapture);

      if (sseRef.current !== eventSource) {
        console.warn(
          `[SSE] Ignoring error from stale connection. ReadyState: ${eventSource.readyState}`,
        );
        eventSource.close();
        return;
      }

      if (sseRef.current === eventSource) {
        sseRef.current.close();
        sseRef.current = null;
      }

      if (heartbeatRef.current === localCapture) {
        heartbeatRef.current = null;
      }

      console.error(
        "[SSE] !!! onerror FIRED - Connection error:",
        error + " " + id,
      );
      console.log("[SSE] Falling back to polling");

      addError("SSE kapcsolat megszakadt, polling-ra váltás");
      startPolling(jobId);
    };
  };

  const startPolling = async (jobId: string) => {
    console.log("Starting polling fallback for job:", jobId);
    pollerCancelRef.current?.();
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    let cancelled = false;
    pollerCancelRef.current = () => {
      cancelled = true;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };

    const poll = async () => {
      if (cancelled) return;

      try {
        const status: TrainStatus = await api
          .get(`/jobs/train/${jobId}/status`)
          .then((res) => res.data);
        if (!isMountedRef.current || cancelled) return;
        setJobStatus((prev) =>
          prev
            ? {
                ...prev,
                ...status,
                history: prev.history
                  ? [...prev.history, status.accuracy]
                  : [status.accuracy],
              }
            : { ...status, history: status.accuracy ? [status.accuracy] : [] },
        );

        if (status.status === "done" || status.status === "error") {
          clearJobContext();
          cancelled = true;
          pollerCancelRef.current = null;
          listNetworks();
          return;
        }
      } catch (err) {
        handleApiError(err, { addErrorCallback: addError });
        // Not clearing the jobContext, allow sse and polling retries if user leaves and returns to playground
        // (upon refresh context is lost)
        cancelled = true;
        pollerCancelRef.current = null;
        return;
      }

      if (!cancelled) {
        pollingTimeoutRef.current = setTimeout(poll, 2000);
      }
    };

    pollingTimeoutRef.current = setTimeout(poll, 500);
  };

  const saveNetwork = async (network: NetworkDoc) => {
    if (network.name.length === 0 || network.name.length > 15) {
      addError("A név 1-15 karakter hosszú lehet");
      return;
    }
    try {
      const response = await api.put(`/networks/${network.id}`, {
        name: network.name,
        nn: network.nn,
      });
      console.log("Network saved successfully:", response.data);
    } catch (err) {
      handleApiError(err);
    }
    listNetworks();
  };

  useEffect(() => {
    listNetworks();
  }, [listNetworks]);

  return (
    <div className="content-container">
      <h1 className="mb-5 md:mb-10">Barkácsolás</h1>
      <div className="content-box mb-5 normal:mb-10">
        Itt létrehozhatsz neurális hálózatokat, illetve elindíthatod a
        tanításukat. <br /> A létrehozáskor add meg a hálózat nevét és a rétegek
        számát. <br />A tanításnál beállíthatod a tanítási ciklusok (epoch)
        számát, a kezdeti tanulási rátát és a korai terminálási határt. <br />A
        pontosság azt mutatja, hogy a 627 egyedi játéktáblából hány esetén
        választja a minimax algoritmus lépését.
        <br /> A veszteség pedig az egy tanítási ciklus alatti átlagos
        kereszt-entrópia veszteség értéke. <br />{" "}
        <span className="note">
          A bemeneti mezők megszorításait elolvashatod, ha rájuk viszed az
          egeret.
        </span>
      </div>
      <NetworkCreateForm onCreateNetwork={createNetwork} />
      <NetworkTable
        teachNetworkId={networkId}
        editNetworkId={editNetworkId}
        networks={networks}
        openEdit={openEdit}
        openTrainMenu={openTrainMenu}
        deleteNetwork={deleteNetwork}
        toggled={true}
        editDisabled={!isAboveMd}
      />
      <NetworkTrainingForm
        job={jobStatus}
        networkName={networks.find((n) => n.id === networkId)?.name || null}
        networkId={networkId}
        onTrainNetwork={trainNetwork}
      />
      <NetworkTrainingStatus job={jobStatus} toggled={toggleStatus} />
      {selectedNetwork && (
        <NetworkEditor
          key={`${editNetworkId}-${networkRefreshKey}`}
          networkDoc={selectedNetwork}
          saveNetwork={saveNetwork}
        />
      )}
    </div>
  );
};

export default PlaygroundPage;
