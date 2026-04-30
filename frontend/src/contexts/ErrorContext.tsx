import React, { createContext, useContext, useState, useCallback } from "react";
import Notification from "../components/Notification";
import type { NotificationMessage } from "../types";
import { v4 as uuidv4 } from "uuid";

type ErrorContextType = {
  addError: (message: string) => void;
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const showDuration = 4000;

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: ErrorProviderProps) => {
  const [errors, setErrors] = useState<NotificationMessage[]>([]);

  const addError = useCallback((message: string) => {
    const id = uuidv4();
    setErrors((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setErrors((prev) => prev.filter((error) => error.id !== id));
    }, showDuration);
  }, []);

  const value = { addError };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <Notification messages={errors} />
    </ErrorContext.Provider>
  );
};

/**
 * Custom hook for using the ErrorContext.
 *
 * Used to add error / warning messages to be displayed in notifications.
 *
 * @returns The error context values.
 */
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used inside ErrorProvider");
  return context;
};
