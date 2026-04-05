"use client";

import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const EllipsisVerticalIcon = forwardRef(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 24,
      duration = 1,
      isAnimated = true,
      ...props
    },
    ref,
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () => (reduced ? controls.start("normal") : controls.start("animate")),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e);
      },
      [controls, reduced, isAnimated, onMouseEnter],
    );

    const handleLeave = useCallback(
      (e) => {
        if (!isControlled.current) controls.start("normal");
        else onMouseLeave?.(e);
      },
      [controls, onMouseLeave],
    );

    const dotVariants = {
      normal: { x: 0 },
      animate: (i) => ({
        x: [0, -3, 0],
        transition: {
          duration: 0.35 * duration,
          delay: i * 0.12,
          ease: "easeInOut",
        },
      }),
    };

    return (
      <motion.div
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial="normal"
          animate={controls}
        >
          <motion.circle cx="12" cy="5" r="1" variants={dotVariants} custom={0} />
          <motion.circle cx="12" cy="12" r="1" variants={dotVariants} custom={1} />
          <motion.circle cx="12" cy="19" r="1" variants={dotVariants} custom={2} />
        </motion.svg>
      </motion.div>
    );
  },
);

EllipsisVerticalIcon.displayName = "EllipsisVerticalIcon";

export { EllipsisVerticalIcon };
