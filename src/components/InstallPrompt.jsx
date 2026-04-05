import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Share2, Smartphone, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { DownloadIcon } from './ui/icons/DownloadIcon';

const DISMISS_KEY = 'messit-install-dismissed';

export default function InstallPrompt() {
  const { accentColor, theme } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const installContext = useMemo(() => {
    if (typeof window === 'undefined') return { supported: false, ios: false, standalone: false };

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    return { supported: true, ios, standalone };
  }, []);

  useEffect(() => {
    if (!installContext.supported || installContext.standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      window.setTimeout(() => setIsOpen(true), 900);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    let timer = null;
    if (installContext.ios) {
      timer = window.setTimeout(() => setIsOpen(true), 1200);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [installContext]);

  const closePrompt = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsOpen(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstalling(false);
    setIsOpen(false);
  };

  if (!installContext.supported || installContext.standalone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px]"
            onClick={closePrompt}
          />

          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-4 top-4 z-[90] mx-auto max-w-lg"
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-border/40 bg-background shadow-2xl">
              <div
                className="absolute inset-x-0 top-0 h-20 pointer-events-none blur-3xl"
                style={{ background: `radial-gradient(circle at top, ${accentHex}16 0%, transparent 72%)` }}
              />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${accentHex}12`, color: accentHex }}
                    >
                      <Smartphone size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black tracking-tight sm:text-lg">Install Messit</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Add it to your phone for quicker launch, offline support, and an app-like experience.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closePrompt}
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    aria-label="Close install prompt"
                  >
                    <X size={18} />
                  </button>
                </div>

                {installContext.ios ? (
                  <div className="mt-4 rounded-[1.35rem] border border-border/30 bg-muted/15 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
                      Add To Home Screen
                    </p>
                    <p className="mt-3 text-sm text-foreground/85 leading-relaxed">
                      Tap <Share2 size={14} className="inline-block mx-1 align-[-2px]" />
                      then choose <span className="font-semibold">Add to Home Screen</span>
                      <Plus size={14} className="inline-block mx-1 align-[-2px]" /> to install Messit on iPhone.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                    <button
                      onClick={handleInstall}
                      disabled={!deferredPrompt || isInstalling}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[1.25rem] border px-4 py-3.5 font-bold transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: `${accentHex}12`,
                        color: accentHex,
                        borderColor: `${accentHex}24`,
                      }}
                    >
                      <DownloadIcon size={18} />
                      {isInstalling ? 'Installing...' : 'Install Now'}
                    </button>
                    <button
                      onClick={closePrompt}
                      className="rounded-[1.25rem] border border-border/35 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
                    >
                      Maybe Later
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
