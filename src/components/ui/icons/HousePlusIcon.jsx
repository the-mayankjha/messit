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
        <path d="M3 11L12 3L21 11" />
        <path d="M5 10V19C5 20.1 5.9 21 7 21H10.5" />
        <path d="M9 21V14C9 12.7 10.5 12 12.5 12H14.5V15.2" />
        <motion.g
          animate={controls}
          variants={{
            normal: { scale: 1, x: 0, y: 0, opacity: 1 },
            animate: {
              scale: [1, 1.1, 1],
              x: [0, 0.2, 0],
              y: [0, -0.4, 0],
              opacity: [1, 0.92, 1],
              transition: {
                duration: 0.55,
                ease: "easeInOut",
                repeat: Infinity,
              },
            },
          }}
          style={{ transformOrigin: "19px 19px" }}
        >
          <path d="M19 16V22" />
          <path d="M16 19H22" />
        </motion.g>
      </svg>
    </div>
  );
});

HousePlusIcon.displayName = "HousePlusIcon";

export { HousePlusIcon };
