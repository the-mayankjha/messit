"use client";

import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const HousePlusIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 24, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;

    return {
      startAnimation: () => controls.start("animate"),
      stopAnimation: () => controls.start("normal"),
    };
  });

  const handleMouseEnter = useCallback(
    (e) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        controls.start("animate");
      }
    },
    [controls, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        controls.start("normal");
      }
    },
    [controls, onMouseLeave],
  );

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
      >
        <svg
          fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        >
        <path d="M2.75 10 12 2.75 21.25 10" />
        <path d="M5.25 8.9V20a1 1 0 0 0 1 1H9v-5.25a1.75 1.75 0 0 1 1.75-1.75h2.5A1.75 1.75 0 0 1 15 15.75V21h1.1" />
        <motion.g
          animate={controls}
          variants={{
            normal: { scale: 1, x: 0, y: 0, opacity: 1 },
            animate: {
              scale: [1, 1.12, 1],
              x: [0, 0.4, 0],
              y: [0, -0.6, 0],
              opacity: [1, 0.92, 1],
              transition: {
                duration: 0.55,
                ease: "easeInOut",
                repeat: Infinity,
              },
            },
          }}
          style={{ transformOrigin: "18px 17px" }}
        >
          <path d="M16 17.25h4.5" />
          <path d="M18.25 15v4.5" />
        </motion.g>
      </svg>
    </div>
  );
});

HousePlusIcon.displayName = "HousePlusIcon";

export { HousePlusIcon };
