import React, { type ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ErrorProvider } from "../src/contexts/ErrorContext";
import { JobProvider } from "../src/contexts/JobContext";
import userEvent, { type UserEvent } from "@testing-library/user-event";

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MemoryRouter initialEntries={["/start"]}>
      <ErrorProvider>
        <AuthProvider>
          <JobProvider>{children}</JobProvider>
        </AuthProvider>
      </ErrorProvider>
    </MemoryRouter>
  );
};

const customRender = (ui: ReactElement) =>
  render(ui, { wrapper: AllTheProviders });

const clearAndType = async (
  user: UserEvent,
  element: HTMLElement,
  text: string,
) => {
  await user.click(element);
  await user.keyboard(`{Control>}{a}{/Control}${text}`);
};

const user = userEvent.setup();

export { user, clearAndType };

export { customRender as render };
