import { motion, useAnimation } from 'motion/react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

const WifiOffAnimatedIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 24, duration = 1, ...props }, ref) => {
  const groupControls    = useAnimation();
  const arcLargeControls = useAnimation();
  const arcMidControls   = useAnimation();
  const arcSmallControls = useAnimation();
  const dotControls      = useAnimation();
  const slashControls    = useAnimation();
  const isControlled     = useRef(false);

  const allToState = (state) => {
    groupControls.start(state);
    arcLargeControls.start(state);
    arcMidControls.start(state);
    arcSmallControls.start(state);
    dotControls.start(state);
    slashControls.start(state);
  };

  useImperativeHandle(ref, () => {
    isControlled.current = true;
    return {
      startAnimation: () => allToState('animate'),
      stopAnimation:  () => allToState('normal'),
    };
  });

  const handleEnter = useCallback((e) => {
    if (!isControlled.current) allToState('animate');
    else onMouseEnter?.(e);
  }, [onMouseEnter]);

  const handleLeave = useCallback((e) => {
    if (!isControlled.current) allToState('normal');
    else onMouseLeave?.(e);
  }, [onMouseLeave]);

  return (
    <motion.div className={`inline-flex items-center justify-center ${className ?? ''}`} onMouseEnter={handleEnter} onMouseLeave={handleLeave} {...props}>
      <motion.svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial="normal" animate={groupControls}
        variants={{ normal: { scale: 1, rotate: 0 }, animate: { scale: [1, 1.04, 0.98, 1], rotate: [0, -1.5, 1.5, 0], transition: { duration: 0.9 * duration, ease: [0.22, 0.9, 0.32, 1] } } }}
      >
        <motion.path d="M12 20h.01" initial="normal" animate={dotControls}
          variants={{ normal: { scale: 1, opacity: 1 }, animate: { scale: [0.6, 1.15, 1], opacity: [0, 1, 1], transition: { duration: 0.6 * duration, ease: 'easeOut', delay: 0.22 } } }} />
        <motion.path d="M8.5 16.429a5 5 0 0 1 7 0" initial="normal" animate={arcSmallControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.7 * duration, ease: 'easeOut', delay: 0.18 } } }} />
        <motion.path d="M5 12.859a10 10 0 0 1 5.17-2.69" initial="normal" animate={arcMidControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.8 * duration, ease: 'easeOut', delay: 0.12 } } }} />
        <motion.path d="M19 12.859a10 10 0 0 0-2.007-1.523" initial="normal" animate={arcMidControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.8 * duration, ease: 'easeOut', delay: 0.12 } } }} />
        <motion.path d="M2 8.82a15 15 0 0 1 4.177-2.643" initial="normal" animate={arcLargeControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.9 * duration, ease: 'easeOut', delay: 0.05 } } }} />
        <motion.path d="M22 8.82a15 15 0 0 0-11.288-3.764" initial="normal" animate={arcLargeControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0.2, 1], transition: { duration: 0.9 * duration, ease: 'easeOut', delay: 0.05 } } }} />
        <motion.path d="m2 2 20 20" initial="normal" animate={slashControls}
          variants={{ normal: { pathLength: 1, opacity: 1 }, animate: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.5 * duration, ease: 'easeInOut', delay: 0.02 } } }} />
      </motion.svg>
    </motion.div>
  );
});

WifiOffAnimatedIcon.displayName = 'WifiOffAnimatedIcon';
export { WifiOffAnimatedIcon };
