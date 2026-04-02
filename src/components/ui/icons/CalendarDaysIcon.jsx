import { motion } from "motion/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "../../../lib/utils";

const DOTS = [
  { cx: 8, cy: 14 },
  { cx: 12, cy: 14 },
  { cx: 16, cy: 14 },
  { cx: 8, cy: 18 },
  { cx: 12, cy: 18 },
  { cx: 16, cy: 18 },
];

const DOT_VARIANTS = {
  animate: (i) => ({
    opacity: [1, 0.3, 1],
    transition: {
      delay: i * 0.15,
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  }),
};

const CalendarDaysIcon = forwardRef(
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
          {/* Calendar Body */}
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect height="18" rx="2" width="18" x="3" y="4" />
          <path d="M3 10h18" />

          {/* Twinkling Dots */}
          {DOTS.map((dot, index) => (
            <motion.circle
              animate="animate"
              custom={index}
              cx={dot.cx}
              cy={dot.cy}
              fill="currentColor"
              key={index}
              r="1"
              stroke="none"
              variants={DOT_VARIANTS}
            />
          ))}
        </svg>
      </div>
    );
  }
);

CalendarDaysIcon.displayName = "CalendarDaysIcon";

export { CalendarDaysIcon };
