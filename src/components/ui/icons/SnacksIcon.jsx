import { motion } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const STRAW_VARIANTS = {
  animate: {
    y: [0, -0.85, 0.15, 0],
    scaleY: [1, 1.06, 0.99, 1],
    transition: {
      duration: 1.5,
      ease: [0.34, 1.56, 0.64, 1],
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

const WAVE_VARIANTS = {
  animate: {
    y: [0.5, -0.5, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const BUBBLE_VARIANTS = {
  animate: (delay) => ({
    opacity: [0, 0.9, 0.4, 0],
    y: [0, -3, -10, -14],
    scale: [1, 1, 0.85, 0.6],
    transition: {
      duration: 2,
      ease: "easeIn",
      delay,
      repeat: Infinity,
      repeatDelay: 0.5,
    },
  }),
};

const BUBBLES = [
  { delay: 0, cx: 8.25, cy: 19.5, r: 0.75 },
  { delay: 0.4, cx: 11.25, cy: 18.5, r: 0.6 },
  { delay: 0.8, cx: 14, cy: 19.75, r: 0.6 },
  { delay: 1.2, cx: 9.75, cy: 18, r: 0.75 },
  { delay: 0.6, cx: 12.5, cy: 19, r: 0.45 },
];

const SnacksIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => {},
        stopAnimation: () => {},
      };
    });

    return (
      <div
        className={cn("flex items-center justify-center relative", className)}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          style={{ overflow: "visible" }}
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Cup Body */}
          <path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8" />
          <path d="M5 8h14" />

          {/* Liquid Wave */}
          <motion.path
            animate="animate"
            d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0"
            variants={WAVE_VARIANTS}
          />

          {/* Animating Straw */}
          <motion.path
            animate="animate"
            d="m12 8 1-5h2"
            style={{
              transformBox: "fill-box",
              originX: "50%",
              originY: "100%",
            }}
            variants={STRAW_VARIANTS}
          />

          {/* Infinite Rising Bubbles */}
          {BUBBLES.map((b, i) => (
            <motion.circle
              animate="animate"
              custom={b.delay}
              cx={b.cx}
              cy={b.cy}
              fill="currentColor"
              key={i}
              r={b.r}
              stroke="none"
              style={{
                transformBox: "fill-box",
                originX: "50%",
                originY: "50%",
              }}
              variants={BUBBLE_VARIANTS}
            />
          ))}
        </svg>
      </div>
    );
  }
);

SnacksIcon.displayName = "SnacksIcon";

export { SnacksIcon };
