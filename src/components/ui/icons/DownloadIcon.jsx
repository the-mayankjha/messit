"use client";

import { motion, useAnimation, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const DownloadIcon = forwardRef(
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
    const loopActiveRef = useRef(false);

    const runLoop = useCallback(async () => {
      if (reduced) return;

      while (loopActiveRef.current) {
        await controls.start("loop");
      }
    }, [controls, reduced]);

    const startSequence = useCallback(async () => {
      if (reduced) {
        controls.start("normal");
        return;
      }

      loopActiveRef.current = true;
      await controls.start("burst");

      if (loopActiveRef.current) {
        runLoop();
      }
    }, [controls, reduced, runLoop]);

    const stopSequence = useCallback(() => {
      loopActiveRef.current = false;
      controls.start("normal");
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlled.current = true;

      return {
        startAnimation: () => startSequence(),
        stopAnimation: () => stopSequence(),
      };
    });

    const handleMouseEnter = useCallback(
      (e) => {
        if (!isAnimated || reduced) return;

        if (isControlled.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("burst");
        }
      },
      [controls, isAnimated, onMouseEnter, reduced],
    );

    const handleMouseLeave = useCallback(
      (e) => {
        if (isControlled.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave],
    );

    return (
      <motion.div
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M12 3v12"
            strokeDasharray="30"
            initial="normal"
            animate={controls}
            variants={{
              normal: { strokeDashoffset: 0, opacity: 1 },
              burst: {
                strokeDashoffset: [30, 0],
                opacity: [0.35, 1],
                transition: { duration: 0.42 * duration, ease: "easeInOut" },
              },
              loop: {
                y: [0, 1.4, 0],
                transition: { duration: 0.7, ease: "easeInOut" },
              },
            }}
          />

          <motion.path
            d="m7 10 5 5 5-5"
            initial="normal"
            animate={controls}
            variants={{
              normal: { y: 0, opacity: 1, scale: 1 },
              burst: {
                y: [-2, 2, 0],
                scale: [1, 1.06, 1],
                opacity: [0.6, 1],
                transition: {
                  duration: 0.48 * duration,
                  ease: "easeInOut",
                  delay: 0.04,
                },
              },
              loop: {
                y: [0, 2, 0],
                transition: { duration: 0.7, ease: "easeInOut" },
              },
            }}
          />

          <motion.path
            d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            strokeDasharray="60"
            initial="normal"
            animate={controls}
            variants={{
              normal: { strokeDashoffset: 0, opacity: 1 },
              burst: {
                strokeDashoffset: [60, 0],
                opacity: [0.3, 1],
                transition: {
                  duration: 0.52 * duration,
                  ease: "easeInOut",
                  delay: 0.08,
                },
              },
              loop: {
                scale: [1, 1.02, 1],
                transition: { duration: 0.7, ease: "easeInOut" },
              },
            }}
          />
        </svg>
      </motion.div>
    );
  },
);

DownloadIcon.displayName = "DownloadIcon";

export { DownloadIcon };
