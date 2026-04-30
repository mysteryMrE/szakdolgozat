import { handleApiError, NETWORK_ERROR_MSG, TIMEOUT_ERROR_MSG, DEFAULT_ERROR_MSG } from "../src/utils";
import { AxiosError } from "axios";


describe("handleApiError", () => {
    const mockAddError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns default message for non-Axios, non-Error objects", () => {
        const result = handleApiError("String is bad")
        expect(result).toBe(DEFAULT_ERROR_MSG);
        expect(mockAddError).not.toHaveBeenCalled();
    });

    it("calls addErrorCallback with the default message", () => {
        const result = handleApiError("Stinks bad", { addErrorCallback: mockAddError });
        expect(result).toBe(DEFAULT_ERROR_MSG);
        expect(mockAddError).toHaveBeenCalledWith(DEFAULT_ERROR_MSG);
    });

    it("returns custom fallback message when provided", () => {
        const customMsg = "Custom message";
        const result = handleApiError("Some string error", { fallbackMessage: customMsg });
        expect(result).toBe(customMsg);
    });

    it("calls addErrorCallback with custom fallback message", () => {
        const customMsg = "Custom fallback message";
        const result = handleApiError("Some string error", { fallbackMessage: customMsg, addErrorCallback: mockAddError });
        expect(result).toBe(customMsg);
        expect(mockAddError).toHaveBeenCalledWith(customMsg);
    });

    it("forces default message when forceDefault is true", () => {
        const customMsg = "Custom fallback message";
        const result = handleApiError(new Error("o-o"), { fallbackMessage: customMsg, forceDefault: true, addErrorCallback: mockAddError });
        expect(result).toBe(customMsg);
        expect(mockAddError).toHaveBeenCalledWith(customMsg);
    });

    it("handles standard Error objects", () => {
        const errorMsg = "This is an error";
        const result = handleApiError(new Error(errorMsg), { addErrorCallback: mockAddError });
        expect(result).toBe(errorMsg);
        expect(mockAddError).toHaveBeenCalledWith(errorMsg);
    });

    it("handles empty messaged Error objects", () => {
        const errorMsg = "";
        const fallbackMsg = "Fallback message";
        const result = handleApiError(new Error(errorMsg), { fallbackMessage: fallbackMsg, addErrorCallback: mockAddError });
        expect(result).toBe(fallbackMsg);
        expect(mockAddError).toHaveBeenCalledWith(fallbackMsg);
    });

    it("handles Axios errors with response detail", () => {
        const detailedError = "Detailed error from server";
        const mockAxiosError = new AxiosError(
            "Network Error",
            "ERR_BAD_REQUEST",
            undefined,
            undefined,
            { data: { detail: detailedError } } as any
        );
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError });
        expect(result).toBe(detailedError);
        expect(mockAddError).toHaveBeenCalledWith(detailedError);
    });

    it("handles Axios timeout errors", () => {
        const mockAxiosError = new AxiosError("Timeout Error", "ECONNABORTED");
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError });
        expect(result).toBe(TIMEOUT_ERROR_MSG);
        expect(mockAddError).toHaveBeenCalledWith(TIMEOUT_ERROR_MSG);
    });

    it("handles Axios network errors", () => {
        const mockAxiosError = new AxiosError("Network Error", "ERR_NETWORK");
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError });
        expect(result).toBe(NETWORK_ERROR_MSG);
        expect(mockAddError).toHaveBeenCalledWith(NETWORK_ERROR_MSG);
    });

    it("handles Axios errors with no specific details", () => {
        const errorMessage = "Some Axios error message";
        const mockAxiosError = new AxiosError(errorMessage);
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError });
        expect(result).toBe(errorMessage);
        expect(mockAddError).toHaveBeenCalledWith(errorMessage);
    });

    it("handles Axios errors with no specific details and message", () => {
        const mockAxiosError = new AxiosError();
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError });
        expect(result).toBe(DEFAULT_ERROR_MSG);
        expect(mockAddError).toHaveBeenCalledWith(DEFAULT_ERROR_MSG);
    });

    it("handles Axios errors with no specific details and message, fallback", () => {
        const mockAxiosError = new AxiosError();
        const fallbackMsg = "Fallback message";
        const result = handleApiError(mockAxiosError, { addErrorCallback: mockAddError, fallbackMessage: fallbackMsg });
        expect(result).toBe(fallbackMsg);
        expect(mockAddError).toHaveBeenCalledWith(fallbackMsg);
    });
});