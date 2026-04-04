import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const OfflineIndicator = () => {
  const isOnline = useStore((state) => state.isOnline);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[min(380px,90%)]"
        >
          <div className="bg-background/40 backdrop-blur-xl border border-red-500/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
              <WifiOff size={20} strokeWidth={2.5} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-red-500/20"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                Offline Mode Active
                <AlertCircle size={12} className="text-red-500" />
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-tight mt-0.5">
                Using local intelligence vault. Real-time protocols are paused.
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-end">
              <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">
                Protected
              </div>
              <div className="w-8 h-1 bg-red-500/20 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  animate={{ x: [-32, 32] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-1/2 h-full bg-red-500/50"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
