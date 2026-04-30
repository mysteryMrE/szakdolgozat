import { useState, useRef } from "react";
import { IoIosArrowDown } from "react-icons/io";
import FocusLock from "react-focus-lock";

interface DropDownProps {
  options: string[];
  actions: (() => void)[];
  activeOption: string;
  disabled?: boolean;
}

const DropDown = ({
  options,
  actions,
  activeOption,
  disabled = false,
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAbove, setIsAbove] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const buttonCenter = rect.top + rect.height / 2;
      setIsAbove(buttonCenter > viewportHeight / 2);
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      className="relative w-full"
      ref={containerRef}
      aria-label="Dropdown menu"
      role="menu"
    >
      <button
        onClick={handleToggle}
        className={`${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } w-full flex items-center justify-between bg-gray-900 px-4 py-3 rounded-xl text-white hover:bg-gray-700 transition-all`}
        disabled={disabled}
      >
        <span className="font-medium">{activeOption}</span>
        <div
          className={`transition-transform duration-100 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <IoIosArrowDown size={20} />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <FocusLock returnFocus={true}>
            <div
              onKeyDown={(e) => {
                const currentElement = document.activeElement as HTMLElement;

                if (e.key === "ArrowDown") {
                  console.log(currentElement);
                  e.preventDefault();
                  const nextElement =
                    currentElement.nextElementSibling as HTMLElement;
                  if (nextElement && nextElement.tagName === "BUTTON") {
                    nextElement.focus();
                  }
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  const prevElement =
                    currentElement.previousElementSibling as HTMLElement;
                  if (prevElement && prevElement.tagName === "BUTTON") {
                    prevElement.focus();
                  }
                }

                if (e.key === "Escape" || e.key === "Tab") {
                  e.preventDefault();
                  setIsOpen(false);
                }
              }}
              className={`absolute left-0 right-0 bg-gray-900 border-2 border-gray-700 rounded-xl shadow-xl overflow-hidden z-30
              ${isAbove ? "bottom-full mb-2" : "top-full mt-2"}`}
            >
              {options.map((option, index) => {
                const isActive = activeOption === option;
                return (
                  <button
                    onMouseEnter={(e) => {
                      e.currentTarget.focus();
                    }}
                    key={option}
                    onClick={() => {
                      actions[index]!();
                      setIsOpen(false);
                    }}
                    className={`cursor-pointer w-full text-left px-4 py-3 transition-all border-b border-gray-700 last:border-b-0
                              ${
                                isActive
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-300 hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                              }
                            `}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </FocusLock>
        </>
      )}
    </div>
  );
};

export default DropDown;
