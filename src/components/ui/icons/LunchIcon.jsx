import { motion } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const PATH_VARIANTS = {
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
      delay: 0.2 * custom,
    },
  }),
};

const LunchIcon = forwardRef(
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
        className={cn("flex items-center justify-center", className)}
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
          {/* Steam from bowl */}
          <motion.path
            animate="animate"
            initial="normal"
            custom={0}
            d="M6 5v3"
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate="animate"
            initial="normal"
            custom={1}
            d="M10 5v3"
            variants={PATH_VARIANTS}
          />

          {/* Tray base */}
          <path d="M2 22h20" />

          {/* Bowl (Left) */}
          <path d="M4 18a4 4 0 0 0 8 0H4z" />
          {/* Food in bowl */}
          <path d="M4 18c0-2.5 1.5-4 4-4s4 1.5 4 4" />

          {/* Glass / Cup (Right) */}
          <path d="M15 11h5v10h-5V11z" />
          <path d="M15 14h5" />
        </svg>
      </div>
    );
  }
);

LunchIcon.displayName = "LunchIcon";

export { LunchIcon };
