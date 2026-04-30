import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

const FooterBar = (): ReactNode => {
  const location = useLocation();

  const scrollToTop = (target: string) => {
    if (location.pathname === target) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const footerLinkClass = ({ isActive }: { isActive: boolean }) =>
    `select-none text-sm sm:text-base ${
      isActive
        ? "text-white underline decoration-cyan-400 decoration-2 underline-offset-4"
        : "text-slate-300 hover:text-white"
    }`;

  return (
    <footer className="mt-10 w-full border-t border-slate-800 bg-slate-900">
      <div className="mx-auto flex min-h-14 max-w-[1280px] items-center justify-between px-4 py-3 text-slate-100">
        <div className="text-left">
          <p className="text-sm sm:text-base font-semibold text-cyan-400 select-none">
            Gerzsényi Levente
          </p>
          <p className="text-xs sm:text-sm text-slate-300">
            <span className="select-none">Kapcsolat: </span>
            <a
              href="mailto:levente.gerzsenyi@gmail.com?subject=TicTacToe - Észrevétel / Kérdés"
              className="ml-1 underline decoration-slate-100 underline-offset-2 hover:text-white transition-colors"
            >
              levente.gerzsenyi@gmail.com
            </a>
          </p>
        </div>

        <NavLink
          to="/resources"
          className={footerLinkClass}
          onClick={() => scrollToTop("/resources")}
        >
          Források
        </NavLink>
      </div>
    </footer>
  );
};

export default FooterBar;
