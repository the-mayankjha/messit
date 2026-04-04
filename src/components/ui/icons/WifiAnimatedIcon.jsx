import { motion, useAnimation } from 'motion/react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

const WIFI_LEVELS = [
  { d: "M12 20h.01", delay: 0 },
  { d: "M8.5 16.429a5 5 0 0 1 7 0", delay: 0.1 },
  { d: "M5 12.859a10 10 0 0 1 14 0", delay: 0.2 },
  { d: "M2 8.82a15 15 0 0 1 20 0", delay: 0.3 },
];

const WifiAnimatedIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: async () => {
        await controls.start('fadeOut');
        controls.start('fadeIn');
      },
      stopAnimation: () => controls.start('fadeIn'),
    };
  });

  const handleMouseEnter = useCallback(async (e) => {
    if (isControlledRef.current) { onMouseEnter?.(e); return; }
    await controls.start('fadeOut');
    controls.start('fadeIn');
  }, [controls, onMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    controls.start('fadeIn');
    onMouseLeave?.(e);
  }, [controls, onMouseLeave]);

  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size}>
        {WIFI_LEVELS.map((level, index) => (
          <motion.path
            key={index}
            animate={controls}
            d={level.d}
            initial={{ opacity: 1 }}
            variants={{
              fadeOut: { opacity: index === 0 ? 1 : 0, transition: { duration: 0.2 } },
              fadeIn: { opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20, delay: level.delay } },
            }}
          />
        ))}
      </svg>
    </div>
  );
});

WifiAnimatedIcon.displayName = 'WifiAnimatedIcon';
export { WifiAnimatedIcon };
