"use client";

import { motion, useAnimation } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const PATH_VARIANTS = {
  normal: { d: "M4.5 12h9.5", x: 0 },
  animate: {
    d: ["M4.5 12h9.5", "M6.5 12h7", "M4.5 12h9.5"],
    x: [0, 1, 0],
    transition: {
      duration: 0.45,
    },
  },
};

const SECONDARY_PATH_VARIANTS = {
  normal: { d: "m10.5 8 4 4-4 4", x: 0 },
  animate: {
    d: "m10.5 8 4 4-4 4",
    x: [0, 1.5, 0],
    transition: {
      duration: 0.45,
    },
  },
};

const PHONE_VARIANTS = {
  normal: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.96, 1],
    transition: {
      duration: 0.45,
    },
  },
};

const ArrowRightIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
      className={cn(className)}
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
          <motion.path
            animate={controls}
            d="M16 2.75H9a2.25 2.25 0 0 0-2.25 2.25v14A2.25 2.25 0 0 0 9 21.25h7A2.25 2.25 0 0 0 18.25 19V5A2.25 2.25 0 0 0 16 2.75Z"
            variants={PHONE_VARIANTS}
          />
          <motion.path animate={controls} d="M4.5 12h9.5" variants={PATH_VARIANTS} />
          <motion.path animate={controls} d="m10.5 8 4 4-4 4" variants={SECONDARY_PATH_VARIANTS} />
        </svg>
    </div>
  );
});

ArrowRightIcon.displayName = "ArrowRightIcon";

export { ArrowRightIcon };
