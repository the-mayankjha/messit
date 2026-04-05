import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EllipsisVertical, HousePlus, Plus, Share2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { DownloadIcon } from './ui/icons/DownloadIcon';

const DISMISS_KEY = 'messit-install-dismissed';

export default function InstallPrompt() {
  const { accentColor, theme } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showBrowserSteps, setShowBrowserSteps] = useState(false);
  const [activeBrowserStep, setActiveBrowserStep] = useState(0);

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const installContext = useMemo(() => {
    if (typeof window === 'undefined') {
      return { supported: false, ios: false, standalone: false, android: false, chromeLike: false };
    }

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const android = /Android/i.test(navigator.userAgent);
    const chromeLike = /Chrome|CriOS|Edg|SamsungBrowser|OPR/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    return { supported: true, ios, standalone, android, chromeLike };
  }, []);

  const browserHintPosition = useMemo(() => {
    if (!installContext.android || !installContext.chromeLike) {
      return {
        top: '5.1rem',
        right: '1rem',
        arrowOffset: '0px',
      };
    }

    return {
      top: 'calc(env(safe-area-inset-top, 0px) + 3.4rem)',
      right: '0.45rem',
      arrowOffset: '8px',
    };
  }, [installContext.android, installContext.chromeLike]);

  useEffect(() => {
    if (!installContext.supported || installContext.standalone) return;
    if (localStorage.getItem(DISMISS_KEY) === 'true') return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowBrowserSteps(false);
      window.setTimeout(() => setIsOpen(true), 900);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalling(false);
      setIsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    const timer = window.setTimeout(() => setIsOpen(true), installContext.ios ? 1200 : 1400);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [installContext]);

  useEffect(() => {
    if (!showBrowserSteps) return;

    const interval = window.setInterval(() => {
      setActiveBrowserStep((current) => (current + 1) % 2);
    }, 2400);

    return () => window.clearInterval(interval);
  }, [showBrowserSteps]);

  const closePrompt = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setIsOpen(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowBrowserSteps(true);
      setActiveBrowserStep(0);
      return;
    }

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
                      style={{ backgroundColor: `${accentHex}12` }}
                    >
                      <img src="/icon.png" alt="Messit" className="h-7 w-7 rounded-lg object-cover" />
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
                  <div className="mt-4 space-y-3">
                    {!deferredPrompt && (
                      <div className="rounded-[1.2rem] border border-border/30 bg-muted/15 p-3.5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">
                          Browser Install
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                          If the direct install prompt is not ready yet, use your browser menu and choose
                          <span className="font-semibold"> Install app</span> or
                          <span className="font-semibold"> Add to Home Screen</span>.
                        </p>
                      </div>
                    )}

                    {showBrowserSteps && !deferredPrompt && (
                      <>
                        {installContext.android && installContext.chromeLike && (
                          <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-none fixed z-[95] flex flex-col items-end gap-2"
                            style={{
                              top: browserHintPosition.top,
                              right: browserHintPosition.right,
                            }}
                          >
                            <motion.div
                              animate={{
                                y: activeBrowserStep === 0 ? [0, -9, 0] : [0, -3, 0],
                                x: activeBrowserStep === 0 ? [0, 5, 0] : [0, 1, 0],
                                opacity: [0.75, 1, 0.75],
                                scale: activeBrowserStep === 0 ? [1, 1.08, 1] : [1, 1.03, 1],
                              }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                              className="text-3xl"
                              style={{ color: accentHex, marginRight: browserHintPosition.arrowOffset }}
                            >
                              ↗
                            </motion.div>
                            <motion.div
                              key={activeBrowserStep}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="max-w-[11.5rem] rounded-2xl border px-3 py-2 text-right text-[11px] font-bold uppercase tracking-[0.18em] shadow-xl"
                              style={{
                                color: accentHex,
                                borderColor: `${accentHex}2c`,
                                backgroundColor: effectiveTheme === 'dark' ? 'rgba(12, 12, 12, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                              }}
                            >
                              {activeBrowserStep === 0 ? 'Tap the three dots' : 'Choose Add to Home Screen'}
                            </motion.div>
                          </motion.div>
                        )}

                        <div
                          className="rounded-[1.2rem] border p-3.5"
                          style={{
                            borderColor: `${accentHex}24`,
                            backgroundColor: `${accentHex}10`,
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <p
                              className="text-[11px] font-black uppercase tracking-[0.18em]"
                              style={{ color: accentHex }}
                            >
                              Quick Steps
                            </p>
                            <div className="flex gap-1.5">
                              {[0, 1].map((step) => (
                                <span
                                  key={step}
                                  className="h-1.5 w-1.5 rounded-full transition-all"
                                  style={{
                                    backgroundColor: step === activeBrowserStep ? accentHex : `${accentHex}30`,
                                    transform: step === activeBrowserStep ? 'scale(1.15)' : 'scale(1)',
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2.5">
                            <motion.div
                              animate={{
                                borderColor: activeBrowserStep === 0 ? `${accentHex}52` : 'rgba(0,0,0,0)',
                                backgroundColor: activeBrowserStep === 0 ? `${accentHex}14` : 'transparent',
                              }}
                              className="flex items-start gap-3 rounded-2xl border px-3 py-3"
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                                style={{ backgroundColor: `${accentHex}18`, color: accentHex }}
                              >
                                1
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <EllipsisVertical size={15} style={{ color: accentHex }} />
                                  <p className="text-sm font-semibold text-foreground">Open the browser menu</p>
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  Tap the three-dot menu in the top-right corner of your browser.
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              animate={{
                                borderColor: activeBrowserStep === 1 ? `${accentHex}52` : 'rgba(0,0,0,0)',
                                backgroundColor: activeBrowserStep === 1 ? `${accentHex}14` : 'transparent',
                              }}
                              className="flex items-start gap-3 rounded-2xl border px-3 py-3"
                            >
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                                style={{ backgroundColor: `${accentHex}18`, color: accentHex }}
                              >
                                2
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <HousePlus size={15} style={{ color: accentHex }} />
                                  <p className="text-sm font-semibold text-foreground">Install from the menu</p>
                                </div>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                  Choose <span className="font-semibold text-foreground">Add to Home Screen</span> or
                                  <span className="font-semibold text-foreground"> Install app</span>.
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      onClick={handleInstall}
                      className="flex flex-1 items-center justify-center gap-3 rounded-[1.25rem] border px-4 py-3.5 font-bold transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: `${accentHex}12`,
                        color: accentHex,
                        borderColor: `${accentHex}24`,
                      }}
                      disabled={isInstalling}
                    >
                      <DownloadIcon size={18} />
                      {isInstalling ? 'Installing...' : deferredPrompt ? 'Install Now' : 'Open Browser Install'}
                    </button>
                    <button
                      onClick={closePrompt}
                      className="rounded-[1.25rem] border border-border/35 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
                    >
                      Maybe Later
                    </button>
                    </div>
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
