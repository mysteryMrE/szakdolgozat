import { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import { useWindowSize } from "../contexts/WindowSizeContext";
import { FaUser } from "react-icons/fa6";
import { Squash as Hamburger } from "hamburger-react";
import FocusLock from "react-focus-lock";

const NavBar = () => {
  const { user, logout } = useAuth();
  const { isMobile } = useWindowSize();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-1 select-none text-lg ${
      isActive
        ? "text-white underline decoration-cyan-400 decoration-3 underline-offset-8"
        : "text-slate-300 hover:text-white"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block text-left border-l-5 px-4 py-3 select-none text-lg font-semibold ${
      isActive
        ? "border-l-cyan-500 text-white"
        : "border-l-slate-500 text-slate-300 hover:text-white hover:border-l-cyan-500 focus:text-white focus:border-l-cyan-500"
    }`;

  const closeMenu = () => setIsMenuOpen(false);

  const scrollToTop = (target: string) => {
    if (location.pathname === target) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const hamburgerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <>
      <nav className="fixed inset-x-0 h-16 top-0 z-50 border-b border-slate-800 bg-slate-900/94">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 h-full text-slate-100">
          {/* Mobile Hamburger Button */}
          {isMobile && (
            <div className="-ml-2" ref={hamburgerRef}>
              <Hamburger
                toggled={isMenuOpen}
                toggle={setIsMenuOpen}
                label={isMenuOpen ? "Close menu" : "Open menu"}
                hideOutline={false}
              />
            </div>
          )}
          {/* Logo */}
          <span className="text-xl font-semibold text-cyan-400 select-none">
            TicTacToe
          </span>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              <NavLink
                to="/"
                onClick={() => scrollToTop("/")}
                className={navLinkClass}
              >
                Kezdőlap
              </NavLink>
              <NavLink
                to="/learn"
                onClick={() => scrollToTop("/learn")}
                className={navLinkClass}
              >
                Tanulás
              </NavLink>
              {user && (
                <NavLink
                  to="/playground"
                  onClick={() => scrollToTop("/playground")}
                  className={navLinkClass}
                >
                  Barkácsolás
                </NavLink>
              )}
            </div>
          )}

          {/* Desktop Auth Section */}
          {!isMobile && (
            <div className="ml-auto flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-slate-300">
                    {user.username.slice(0, 15)}
                    {user.username.length > 15 ? "..." : ""}
                  </span>
                  <button className="btn select-none" onClick={logout}>
                    Kijelentkezés
                  </button>
                </>
              ) : (
                <NavLink
                  className={({ isActive }) =>
                    `btn select-none ${isActive ? "pointer-events-none" : ""}`
                  }
                  to="/login"
                >
                  Bejelentkezés
                </NavLink>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && (
        <>
          {/*Layer on the remaining screen*/}
          <div
            className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
              isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Mobile Slide-out Menu */}
          <FocusLock
            disabled={!isMenuOpen}
            shards={hamburgerRef ? [hamburgerRef] : []}
          >
            <aside
              className={`fixed top-16 bottom-0 left-0 z-50 w-64 bg-slate-900 transition-transform duration-300 ease-in-out ${
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              aria-label="Mobile navigation menu"
              inert={!isMenuOpen ? true : undefined}
            >
              <nav className="flex flex-col h-full z-70">
                <div className="pl-3 flex flex-col gap-4 mt-4 overflow-y-auto">
                  <NavLink
                    to="/"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      closeMenu();
                      scrollToTop("/");
                    }}
                  >
                    Kezdőlap
                  </NavLink>
                  <NavLink
                    to="/learn"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      closeMenu();
                      scrollToTop("/learn");
                    }}
                  >
                    Tanulás
                  </NavLink>
                  {user && (
                    <NavLink
                      to="/playground"
                      className={mobileNavLinkClass}
                      onClick={() => {
                        closeMenu();
                        scrollToTop("/playground");
                      }}
                    >
                      Barkácsolás
                    </NavLink>
                  )}
                </div>

                {/* Auth Section in Mobile Menu*/}
                <div className="p-4 mt-auto border-t border-gray-700 bg-slate-900 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-center gap-2">
                        <FaUser className="text-slate-300" />
                        <span className="text-slate-300 text-lg">
                          {user.username.slice(0, 20)}
                          {user.username.length > 20 ? "..." : ""}
                        </span>
                      </div>
                      <button
                        className="btn select-none w-full"
                        onClick={() => {
                          logout();
                          closeMenu();
                        }}
                      >
                        Kijelentkezés
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      className={({ isActive }) =>
                        `btn select-none block text-center ${
                          isActive ? "pointer-events-none" : ""
                        }`
                      }
                      to="/login"
                      onClick={closeMenu}
                    >
                      Bejelentkezés
                    </NavLink>
                  )}
                </div>
              </nav>
            </aside>
          </FocusLock>
        </>
      )}

      {/* Gradient fade behind navbar */}
      <div
        className="fixed top-0 left-0 w-full h-16 z-40 bg-gradient-to-b from-slate-900/90 to-slate-900/25 pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
};

export default NavBar;
