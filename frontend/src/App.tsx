import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import NavBar from "./components/NavBar";
import FooterBar from "./components/FooterBar";
import { AuthProvider } from "./contexts/AuthContext";

import PrivateRoute from "./PrivateRoutes";
import { ErrorProvider } from "./contexts/ErrorContext";
import { JobProvider } from "./contexts/JobContext";
import SmallScreen from "./pages/SmallScreen";
import { useWindowSize } from "./contexts/WindowSizeContext";
import NoPage from "./pages/NoPage";

const PlayPage = lazy(() => import("./pages/PlayPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const PlaygroundPage = lazy(() => import("./pages/PlaygroundPage"));

/**
 * Main application component that sets up routing and context providers.
 * @returns The rendered application component.
 */
const App = (): ReactNode => {
  const { isCritical } = useWindowSize();

  return (
    <BrowserRouter>
      <ErrorProvider>
        <AuthProvider>
          <JobProvider>
            <div className={isCritical ? "" : "hidden"}>
              <SmallScreen />
            </div>
            <div
              className={`${isCritical ? "hidden" : ""} flex min-h-screen flex-col`}
            >
              <NavBar />
              <main className="flex-1 pt-16">
                <div className="mx-auto max-w-[1280px] p-1 pt-3 md:p-3 normal:p-8 text-center">
                  <Suspense
                    fallback={<SmallScreen bg={false} text={"Betöltés..."} />}
                  >
                    <Routes>
                      <Route path="/" element={<PlayPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/learn" element={<LearnPage />} />
                      <Route path="/resources" element={<ResourcesPage />} />
                      <Route
                        path="/playground"
                        element={
                          <PrivateRoute>
                            <PlaygroundPage />
                          </PrivateRoute>
                        }
                      />
                      <Route path="*" element={<NoPage />} />
                    </Routes>
                  </Suspense>
                </div>
              </main>
              <FooterBar />
            </div>
          </JobProvider>
        </AuthProvider>
      </ErrorProvider>
    </BrowserRouter>
  );
};

export default App;
