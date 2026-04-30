import axios from "axios";

const translateTime: Record<string, string> = {
  "minute": "perc",
  "hour": "óra",
  "day": "nap"
}

export const NETWORK_ERROR_MSG = "Nem sikerült kapcsolódni a szerverhez";
export const TIMEOUT_ERROR_MSG = "A kérés időtúllépés miatt megszakadt";
export const DEFAULT_ERROR_MSG = "Ismeretlen hiba történt";
export const TOO_MANY_REQUESTS_MSG = "Túl sok kérés érkezett. Próbáld újra később.";

type ErrorOptions ={
    fallbackMessage?: string;
    addErrorCallback?: (msg: string) => void;
    forceDefault?: boolean;
}

/**
 * AI assisted error handling regex.
 */

/**
 * @param error - the raw error object
 * @param options - configuration for handling and logging
 */
export const handleApiError = (
  error: unknown, 
  {
    fallbackMessage = DEFAULT_ERROR_MSG,
    forceDefault = false,
    addErrorCallback,
  }: ErrorOptions = {}
) => {
  let finalMessage = fallbackMessage;

  if (axios.isAxiosError(error)) {
    console.debug("Axios error detected");
    const responseData = error.response?.data;
    const statusCode = error.response?.status;
    if(statusCode === 429){
      finalMessage = TOO_MANY_REQUESTS_MSG;
      const rateLimitError = responseData?.error;
      if (typeof rateLimitError === 'string') { 
        const errorMessage: string = rateLimitError;
        const regex = /(\d+)\s+per\s+(\d+)\s+(\w+)/;
        const match = errorMessage.match(regex);
        if (match) {
          const [, limit, timeVal, timeUnit] = match;
          if (limit && timeVal && timeUnit) {
            finalMessage = `Túl sok kérés érkezett. Maximum ${limit} kérés engedélyezett ${timeVal} ${translateTime[timeUnit] || "adott "} időtartamon belül. Próbáld újra később.`;
          }
        }
      }
    }
    else if (responseData?.detail) {
      if (Array.isArray(responseData.detail)) {
        finalMessage = responseData.detail[0]?.msg || JSON.stringify(responseData.detail); //pydantic style
      } else if (typeof responseData.detail === 'string') {
        finalMessage = responseData.detail;
      } else {
        finalMessage = JSON.stringify(responseData.detail);
      }
    }
    else if (error.code === 'ECONNABORTED') {
       finalMessage = TIMEOUT_ERROR_MSG;
    }
    else if (error.code === 'ERR_NETWORK') {
       finalMessage = NETWORK_ERROR_MSG;
    }
    else if(error.message) {
       finalMessage = error.message;
    }
  } else if (error instanceof Error) {
    finalMessage = error.message;
  }

  if (typeof finalMessage !== 'string' || finalMessage.trim() === '') {
    finalMessage = String(finalMessage || fallbackMessage);
  }

  if (forceDefault) {
    finalMessage = fallbackMessage;
  }

  console.error(`[API Error]: ${finalMessage}`);
  console.debug("Raw error object:", error);
  
  if (addErrorCallback) {
    addErrorCallback(finalMessage);
  }
  
  return finalMessage;
};