import { type ReactNode } from "react";

const SmallScreen = ({
  bg = true,
  text = "Gyere vissza nagyobb képernyővel!",
}: {
  bg?: boolean;
  text?: string;
}): ReactNode => {
  return (
    <div
      className={`flex flex-col items-center justify-center overflow-hidden gap-8 ${
        bg
          ? "fixed inset-0 bg-gray-900 z-50"
          : "relative w-full py-16 bg-transparent"
      }`}
    >
      <img
        src="x_o.png"
        alt="Robot"
        className={`w-3/5 h-auto mx-auto sm:w-1/2 max-w-[220px] ${
          bg ? "animate-robot " : "animate-robot-light"
        }`}
      />

      <div className="px-6 text-center">
        <h2
          className={`${bg ? "glowing-text" : "glowing-text-light"} animate-flicker`}
        >
          {text}
        </h2>
      </div>
    </div>
  );
};
export default SmallScreen;
