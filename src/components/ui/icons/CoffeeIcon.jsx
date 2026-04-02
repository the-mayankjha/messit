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

const CoffeeIcon = forwardRef(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        // No-op since it's always animating, but keeping keys for interface consistency
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
          {/* Steam lines */}
          <motion.path
            animate="animate"
            initial="normal"
            custom={0}
            d="M6 2v2"
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate="animate"
            initial="normal"
            custom={1}
            d="M10 2v2"
            variants={PATH_VARIANTS}
          />
          <motion.path
            animate="animate"
            initial="normal"
            custom={2}
            d="M14 2v2"
            variants={PATH_VARIANTS}
          />
          {/* Cup Body */}
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
          {/* Handle */}
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        </svg>
      </div>
    );
  }
);

CoffeeIcon.displayName = "CoffeeIcon";

export { CoffeeIcon };
