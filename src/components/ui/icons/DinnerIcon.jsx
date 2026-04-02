import { motion } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const STEAM_VARIANTS = {
  normal: {
    y: 0,
    opacity: 1,
  },
  animate: (custom) => ({
    y: [0, -3, 0],
    opacity: [0, 1, 0],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
      delay: custom * 0.3,
    },
  }),
};

const DinnerIcon = forwardRef(
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
          {/* Tray base */}
          <path d="M2 21h20" />

          {/* Cloche Dome */}
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8H4z" />

          {/* Knob on Top - No Animation */}
          <circle cx="12" cy="11.5" r="1.5" />

          {/* Steam from side */}
          <motion.path
            animate="animate"
            custom={0}
            d="M6 7v3"
            strokeWidth="1.5"
            variants={STEAM_VARIANTS}
          />
          <motion.path
            animate="animate"
            custom={1}
            d="M9 5v3"
            strokeWidth="1.5"
            variants={STEAM_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

DinnerIcon.displayName = "DinnerIcon";

export { DinnerIcon };
