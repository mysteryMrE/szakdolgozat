import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

type JobContextType = {
  setJobID: (id: string) => void;
  jobID: string | null;
  jobNetworkName: string | null;
  clearJob: () => void;
  setJobNetworkName: (name: string) => void;
};

interface JobProviderProps {
  children: ReactNode;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

// no point of useCallback or useMemo here since if any of the values change, the context would re-render and would
// update the useMemo or useCallbacks too because the deps would change as well

export const JobProvider = ({ children }: JobProviderProps) => {
  const { user } = useAuth();
  const [jobID, setJobID] = useState<string | null>(null);
  const [jobNetworkName, setJobNetworkName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setJobID(null);
      setJobNetworkName(null);
    }
  }, [user]);

  const clearJob = () => {
    setJobID(null);
    setJobNetworkName(null);
  };

  return (
    <JobContext.Provider
      value={{
        setJobID,
        jobID,
        jobNetworkName,
        clearJob,
        setJobNetworkName,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

/**
 * Custom hook for using the JobContext.
 *
 * Used to remember running jobs and their network names.
 *
 * @returns The job context values.
 */
export const useJob = (): JobContextType => {
  const context = useContext(JobContext);
  if (!context) throw new Error("useJob must be used inside JobProvider");
  return context;
};
