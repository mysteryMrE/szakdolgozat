import { useEffect, useMemo, useRef, useState } from "react";

/**
 * AI assisted component.
 * AI was used to calculate the angles and rotation, and to implement the animation, draw on canvas.
 */

interface SpinningWheelProps {
  values: number[];
  probabilities: number[];
  size?: number;
  isSpinning: (spinning: boolean) => void;
  setChoice: (value: number | null) => void;
  disabled?: boolean;
  forcedTarget?: number;
  forbidden?: boolean;
  resetToken?: number;
}

export const duration = 3000;

/**
 * SpinningWheel component that renders a spinning wheel with given values and probabilities.
 *
 * @param props - The props for the spinning wheel.
 */
const SpinningWheel = ({
  values,
  probabilities,
  size = 300,
  isSpinning,
  setChoice,
  disabled, //currently non-clickable
  forcedTarget,
  forbidden, //always non-clickable
  resetToken,
}: SpinningWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const startRotationRef = useRef(0);
  const endRotationRef = useRef(0);
  const startTimeRef = useRef(0);

  const lastResetRef = useRef<number | undefined>(undefined);

  const colors = ["#d862ea", "#00d3f3"];

  useEffect(() => {
    if (forcedTarget === undefined) return;
    if (!spinning) spin();
  }, [forcedTarget]);

  useEffect(() => {
    if (resetToken === undefined) return;
    if (resetToken === lastResetRef.current) return;

    lastResetRef.current = resetToken;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setSpinning(false);
    isSpinning(false);
    setChoiceInside(null);
    setRotation(0);
    startRotationRef.current = 0;
    endRotationRef.current = 0;
    startTimeRef.current = 0;
  }, [resetToken]);

  const normalizedProbs = useMemo(() => {
    const total = probabilities.reduce((sum, num) => sum + num, 0);
    if (total === 0) return [];
    return probabilities.map((p) => p / total);
  }, [probabilities]);

  // Draw the wheel on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size and scaling for better resolution
    const dpr = window.devicePixelRatio || 1;
    // Draw buffer
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    // Display size
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    // So we can use the drawing like size * size
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const center = size / 2;
    const radius = center - 10;

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rotation * Math.PI) / 180);

    // fill all slices"#020618"
    let startAngle = 0;
    for (let i = 0; i < values.length; i++) {
      const sliceAngle = (normalizedProbs[i] || 0) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, startAngle + sliceAngle, false);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length] || "#fff";
      ctx.fill();

      startAngle += sliceAngle;
    }
    if (values.length === 0 || disabled) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
      ctx.closePath();
      ctx.fillStyle = "#020618";
      ctx.fill();
    }

    // stroke outer circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw radial lines and text
    startAngle = 0;
    if (!disabled) {
      for (let i = 0; i < values.length; i++) {
        const sliceAngle = (normalizedProbs[i] || 0) * 2 * Math.PI;
        if (values.length > 1) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(
            Math.cos(startAngle) * radius,
            Math.sin(startAngle) * radius,
          );
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        const textAngle = startAngle + sliceAngle / 2;
        const textX = Math.cos(textAngle) * (radius * 0.65);
        const textY = Math.sin(textAngle) * (radius * 0.65);

        ctx.fillStyle = "#000";
        ctx.font = `bold ${size ? size / 16 : 18}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (spinning) {
          ctx.fillText(String(values[i]), textX, textY);
        } else {
          ctx.save();
          ctx.translate(textX, textY);
          ctx.rotate((-rotation * Math.PI) / 180);
          ctx.fillText(String(values[i]), 0, 0);
          ctx.restore();
        }

        startAngle += sliceAngle;
      }
    }

    // Draw pointer, it should not move
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(center, 36);
    ctx.lineTo(center - 12, 8);
    ctx.lineTo(center + 12, 8);
    ctx.closePath();
    ctx.fillStyle = "#ff0000";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
  }, [rotation, values, normalizedProbs, size, disabled, spinning]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = () => {
    if (
      values.length === 0 ||
      values.length !== probabilities.length ||
      disabled
    ) {
      return;
    }
    if (spinning) return;
    setSpinning(true);
    isSpinning(true);
    setChoiceInside(null);

    const rand = Math.random();
    let sum = 0;
    let winnerIndex =
      forcedTarget !== undefined
        ? values.indexOf(forcedTarget)
        : normalizedProbs.length - 1;
    for (let i = 0; i < normalizedProbs.length; i++) {
      sum += normalizedProbs[i]!;
      if (rand <= sum) {
        winnerIndex =
          forcedTarget !== undefined ? values.indexOf(forcedTarget) : i;
        break;
      }
    }
    console.debug(
      "Chosen winner index:",
      winnerIndex,
      "Value:",
      values[winnerIndex],
    );

    const newRotation = rotation % 360;

    let sliceStartAngle = 0;
    for (let i = 0; i < winnerIndex; i++) {
      sliceStartAngle += normalizedProbs[i]! * 360;
    }
    const sliceMiddleAngle =
      sliceStartAngle + (normalizedProbs[winnerIndex]! * 360) / 2;
    const targetPos = (sliceMiddleAngle + newRotation) % 360;

    const pointerAngle = 270;
    const neededRotation = (pointerAngle - targetPos + 360) % 360;
    const extraSpins = 4;
    const totalRotation = extraSpins * 360 + neededRotation;

    startRotationRef.current = newRotation;
    endRotationRef.current = startRotationRef.current + totalRotation;
    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(Math.max(elapsed / duration, 0), 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const newRotation =
        startRotationRef.current +
        (endRotationRef.current - startRotationRef.current) * eased;

      setRotation(newRotation);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        isSpinning(false);
        setChoiceInside(values[winnerIndex] ?? null);
        setRotation(endRotationRef.current % 360);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  const spinWheel = () => {
    if (!forbidden) spin();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      spinWheel();
    }
  };

  const setChoiceInside = (value: number | null) => {
    setLanded(value);
    setChoice(value);
  };

  if (values.length !== probabilities.length) {
    console.error("Values and probabilities arrays must have the same length.");
    return null;
  }

  return (
    <div className="">
      <div className="bg-slate-900 rounded-2xl shadow-1xl p-3 lg:p-8 w-full">
        <div className="flex justify-center">
          <canvas
            onClick={() => {
              spinWheel();
            }}
            onKeyDown={handleKeyDown}
            ref={canvasRef}
            className={`bg-slate-700 rounded-full ${
              disabled
                ? "cursor-not-allowed"
                : forbidden
                  ? ""
                  : "cursor-pointer"
            }`}
            tabIndex={disabled || forbidden ? -1 : 0}
            role="button"
            aria-label={`Spinning Wheel, ${landed !== null ? `landed on ${landed}` : "no selection"}`}
            aria-disabled={disabled || forbidden}
          />
        </div>
      </div>
    </div>
  );
};

export default SpinningWheel;
