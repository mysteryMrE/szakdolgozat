import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface WindowSizeContextValue {
  isCritical: boolean; // <360px
  isMobile: boolean; // <768px
  isAboveSm: boolean;
  isAboveMd: boolean;
  isAboveNormal: boolean;
  isAboveLg: boolean;
}

// Matching index.css @theme values
const QUERIES: Record<keyof WindowSizeContextValue, string> = {
  isCritical: "(max-width: 359px)",
  isMobile: "(max-width: 767px)",
  isAboveSm: "(min-width: 480px)",
  isAboveMd: "(min-width: 768px)",
  isAboveNormal: "(min-width: 1024px)",
  isAboveLg: "(min-width: 1120px)",
};

const WindowSizeContext = createContext<WindowSizeContextValue | null>(null);

interface WindowSizeProviderProps {
  children: ReactNode;
}

export const WindowSizeProvider = ({ children }: WindowSizeProviderProps) => {
  const [windowSize, setWindowSize] = useState<WindowSizeContextValue>({
    isCritical: window.matchMedia(QUERIES.isCritical).matches,
    isMobile: window.matchMedia(QUERIES.isMobile).matches,
    isAboveSm: window.matchMedia(QUERIES.isAboveSm).matches,
    isAboveMd: window.matchMedia(QUERIES.isAboveMd).matches,
    isAboveNormal: window.matchMedia(QUERIES.isAboveNormal).matches,
    isAboveLg: window.matchMedia(QUERIES.isAboveLg).matches,
  });

  const updateState = (key: keyof WindowSizeContextValue, matches: boolean) => {
    // The listener should only update state if there's an actual change
    // Still, safe guard to be sure
    console.log(`WindowSizeContext: ${key} changed to ${matches}`);
    setWindowSize((prev) => {
      if (prev[key] === matches) return prev;
      return { ...prev, [key]: matches };
    });
  };

  useEffect(() => {
    const listeners = Object.entries(QUERIES).map(([key, query]) => {
      const mediaQueryList = window.matchMedia(query);
      const handler = (e: MediaQueryListEvent) =>
        updateState(key as keyof typeof QUERIES, e.matches);
      mediaQueryList.addEventListener("change", handler);
      return { mediaQueryList, handler };
    });

    return () => {
      listeners.forEach(({ mediaQueryList, handler }) => {
        mediaQueryList.removeEventListener("change", handler);
      });
    };
  }, []);

  return (
    <WindowSizeContext.Provider value={windowSize}>
      {children}
    </WindowSizeContext.Provider>
  );
};

/**
 * Custom hook for using the WindowSizeContext.
 *
 * Used to get the breakpoint information.
 *
 * @returns The window size context values.
 */
export const useWindowSize = (): WindowSizeContextValue => {
  const context = useContext(WindowSizeContext);
  if (!context) {
    throw new Error("useWindowSize must be used within a WindowSizeProvider");
  }
  return context;
};
