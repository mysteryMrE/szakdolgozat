import { useEffect, useState } from "react";
import { IoIosArrowUp } from "react-icons/io";
import { useWindowSize } from "../../contexts/WindowSizeContext";
import DropDown from "../DropDown";

interface LearnMenuProps {
  activeTopic: string;
  topics: { [key: string]: string };
  handleTopicChange: (topic: string) => void;
}

export const jumpVisible = 300;

const LearnMenu = ({
  activeTopic,
  topics,
  handleTopicChange,
}: LearnMenuProps) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const { isAboveSm, isAboveMd } = useWindowSize();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > jumpVisible);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const cba = (entries: IntersectionObserverEntry[]) => {
      setFooterVisible(entries[0]?.isIntersecting ?? false);
    };
    const observer = new IntersectionObserver(cba, { threshold: 0 });
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div
        aria-label="Learn content menu"
        className="normal:w-5/6 w-95/100 sm:w-9/10 mx-auto relative mb-4 mt-1 normal:-mt-4"
      >
        <DropDown
          options={Object.values(topics)}
          actions={Object.values(topics).map(
            (topic) => () => handleTopicChange(topic),
          )}
          activeOption={activeTopic}
        />
      </div>

      {/* Scroll up button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed cursor-pointer bg-blue-600 text-white rounded-full shadow-lg z-30 hover:bg-blue-700 hover:scale-110 transition-all ${
            !isAboveMd
              ? `${footerVisible ? "bottom-[calc(4rem+env(safe-area-inset-bottom))]" : "bottom-[calc(0.5rem+env(safe-area-inset-bottom))]"} right-2`
              : `${footerVisible ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"} right-4`
          }${" "}${!isAboveSm ? "p-2" : "p-3"}`}
          aria-label="Scroll to top"
        >
          <IoIosArrowUp size={!isAboveSm ? 36 : 30} />
        </button>
      )}
    </div>
  );
};

export default LearnMenu;
