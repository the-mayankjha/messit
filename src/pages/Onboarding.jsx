import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { 
  ArrowRight, ArrowLeft, Crown, Check,
  RefreshCw, Building2, Utensils, Hash,
  Star, Sparkles, MapPin, User, ChevronRight,
  ShieldCheck, Lock, Cloud, BellRing, Megaphone, X
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { GithubIcon } from '../components/ui/icons/GithubIcon';
import { GoogleIcon } from '../components/ui/icons/GoogleIcon';
import { useAuth0 } from '@auth0/auth0-react';
import { syncSupabaseProfile } from '../lib/supabase';
import { ACCENT_COLORS } from '../constants/colors';

export default function Onboarding() {
  const { 
    loginWithRedirect, 
    isLoading: isAuthLoading,
    isAuthenticated,
    user: auth0User
  } = useAuth0();

  const { 
    setIsOnboarded, 
    setProfile,
    setUser,
    accentColor,
    theme
  } = useStore();

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : (theme || 'dark');
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];
  
  // 0: Welcome | 1: Hostel | 2: Mess & Room | 3: Finalizing
  // 0: Welcome | 1: Hostel | 2: Mess & Room | 3: Finalizing
  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState('welcome'); // 'welcome' | 'auth' | 'guest-confirm'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // null | 'google' | 'github'

  // Local Profile State
  const [profileData, setProfileData] = useState({
    hostel: null,
    roomNumber: '',
    messType: 'Veg',
    role: 'None'
  });
  
  // Local state for Hostel UI category toggle
  const [tempHostelType, setTempHostelType] = useState('male');

  // Refs for icon animations
  const googleIconRef = useRef(null);
  const githubIconRef = useRef(null);

  // Flow control: automatically move to hostel if logged in
  useEffect(() => {
    if (isAuthenticated && auth0User && step === 0) {
      setStep(1);
    }
  }, [isAuthenticated, auth0User, step]);

  const handleFinalizeProfile = async () => {
    setIsSubmitting(true);
    
    const calculatedGender = profileData.hostel?.startsWith('MH') ? 'Male' : 'Female';
    
    const finalizedProfile = {
      ...profileData,
      gender: calculatedGender,
      email: auth0User?.email || email,
      name: auth0User?.name || email?.split('@')[0] || 'User'
    };

    setProfile(finalizedProfile);

    // Supabase Sync
    try {
      await syncSupabaseProfile(finalizedProfile);
      setIsOnboarded(true);
    } catch (err) {
      console.error("Onboarding sync failed:", err);
      setIsOnboarded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = (connection) => {
    const key = connection === 'google-oauth2' ? 'google' : 'github';
    setSocialLoading(key);
    loginWithRedirect({
      authorizationParams: { connection }
    });
  };

  const handleEmailAuth = () => {
    if (!email) return;
    setIsSubmitting(true);
    loginWithRedirect({
      authorizationParams: {
        connection: 'Username-Password-Authentication',
        login_hint: email,
      }
    });
  };

  const handleGuestSkip = () => {
    setUser({
      name: 'Guest User',
      email: 'guest@messit.co',
      picture: '/icon.png'
    });
    setIsOnboarded(true);
  };

  // Show the "what you'll miss" screen before truly skipping
  const handleSkipIntent = () => setAuthMode('guest-confirm');

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-6 text-center">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-bold tracking-widest uppercase text-primary animate-pulse">Initializing Platform...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative selection:bg-primary/20">
      
      {/* Notion-style Minimal Background Accents */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* OAuth Progress Bar */}
      <AnimatePresence>
        {socialLoading && (
          <motion.div
            key="oauth-bar"
            className="fixed top-0 left-0 h-[3px] z-50 rounded-r-full"
            style={{ backgroundColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)' }}
            initial={{ width: '0%' }}
            animate={{ width: '85%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* STEP 0: WELCOME & AUTH */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full relative z-10"
          >
            <AnimatePresence mode="wait">
              {authMode === 'welcome' && (
                <motion.div
                  key="welcome_view"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center py-12"
                >
                  {/* Logo — no box, just the icon */}
                  <div className="relative mb-12 sm:mb-16">
                    <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <img 
                      src="/icon.png" 
                      alt="Messit Logo" 
                      className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-2xl" 
                    />
                  </div>

                  <div className="text-center mb-16 space-y-4 px-4">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">Welcome to Messit</h1>
                    <p className="text-muted-foreground/60 text-sm sm:text-base leading-relaxed max-w-[320px] mx-auto font-medium">
                      Your college mess menu, digitized and delivered exactly when you need it.
                    </p>
                  </div>

                  <div className="w-full space-y-4 px-6">
                    <button 
                      onClick={() => setAuthMode('auth')}
                      className="w-full h-16 rounded-2xl bg-foreground border border-border shadow-lg hover:opacity-90 transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-bold text-background tracking-wide">Create an Account</span>
                        <ChevronRight size={18} className="text-background/40 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setAuthMode('auth')}
                        className="h-14 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 text-foreground font-bold text-xs tracking-wider transition-all"
                      >
                        Log In
                      </button>
                      <button 
                        onClick={handleSkipIntent}
                        className="h-14 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 text-foreground font-bold text-xs tracking-wider transition-all"
                      >
                        Skip for Now
                      </button>
                    </div>
                  </div>

                  <div className="mt-20">
                    <p className="text-[10px] text-muted-foreground/40 text-center leading-relaxed">
                      By continuing, you agree to our <br/>
                      <span className="underline decoration-muted-foreground/20 underline-offset-4">terms of service</span> and <span className="underline decoration-muted-foreground/20 underline-offset-4">privacy policy</span>.
                    </p>
                  </div>
                </motion.div>
              )}

              {authMode === 'auth' && (
                <motion.div
                  key="auth_view"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="py-12"
                >
                  <div className="text-center mb-16 px-4 relative">
                    <button 
                      onClick={() => setAuthMode('welcome')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-secondary/30 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-foreground">Messit</h1>
                    <p className="text-muted-foreground/60 text-sm font-medium">Your elite dining companion.</p>
                  </div>

                  <div className="space-y-8 px-2">
                    {/* Social Auth Row (Notion Style) */}
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleSocialAuth('google-oauth2')}
                        onMouseEnter={() => !socialLoading && googleIconRef.current?.startAnimation()}
                        onMouseLeave={() => googleIconRef.current?.stopAnimation()}
                        disabled={!!socialLoading}
                        className="flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/50 border border-border/50 py-4 rounded-xl transition-all active:scale-95 group disabled:opacity-50"
                      >
                        <GoogleIcon ref={googleIconRef} />
                        <span className="text-[10px] font-black tracking-[0.2em] text-foreground/80">GOOGLE</span>
                      </button>
                      <button 
                        onClick={() => handleSocialAuth('github')}
                        onMouseEnter={() => !socialLoading && githubIconRef.current?.startAnimation()}
                        onMouseLeave={() => githubIconRef.current?.stopAnimation()}
                        disabled={!!socialLoading}
                        className="flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/50 border border-border/50 py-4 rounded-xl transition-all active:scale-95 group disabled:opacity-50"
                      >
                        <GithubIcon ref={githubIconRef} size={18} />
                        <span className="text-[10px] font-black tracking-[0.2em] text-foreground/80">GITHUB</span>
                      </button>
                    </div>

                    {/* Minimalist OR Divider */}
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/30"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-4 text-[9px] font-black tracking-[0.3em] text-muted-foreground/40 italic uppercase">OR</span>
                      </div>
                    </div>

                    {/* Email & Password Input Section */}
                    <div className="space-y-6">
                      <Input
                        label="Email Address"
                        type="email"
                        icon={Utensils}
                        placeholder="hello@messit.app"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-16"
                      />

                      <Input
                        label="Password"
                        type="password"
                        icon={ShieldCheck}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-16"
                      />
                    </div>

                    <div className="pt-4 space-y-4 text-center">
                      <button 
                        onClick={handleEmailAuth}
                        disabled={isSubmitting || !email}
                        className="w-full h-16 rounded-2xl bg-foreground text-background font-black text-xs tracking-[0.2em] shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : 'CONTINUE'}
                      </button>
                      <button 
                        onClick={handleSkipIntent}
                        className="text-muted-foreground/40 hover:text-foreground text-[9px] font-black uppercase tracking-[0.3em] transition-colors py-2"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* GUEST CONFIRM: What you'll miss — inside AnimatePresence so it replaces the form */}
              {authMode === 'guest-confirm' && (
                <motion.div
                  key="guest_confirm"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="py-10 px-2"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 mb-5">
                      <X size={24} className="text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">You'll miss out on…</h2>
                    <p className="text-sm text-muted-foreground/60 max-w-[280px] mx-auto">Guest mode is limited. Here's what you won't get:</p>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      { icon: Cloud, title: 'Cloud Sync & Auto Menu', desc: 'Your menu updates automatically every week — no uploads needed.' },
                      { icon: Megaphone, title: 'Broadcasts & Announcements', desc: 'Real-time notices from coordinators and campus admins.' },
                      { icon: BellRing, title: 'Personalised Notifications', desc: 'Smart alerts for your mess timings and meal preferences.' },
                      { icon: Building2, title: 'Campus Profile', desc: 'Hostel and mess preferences synced to your account.' },
                      { icon: ShieldCheck, title: 'Platform Role & Authority', desc: 'Apply for Coordinator or Admin access.' },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div key={title} className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/40">
                        <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                          <Icon size={16} className="text-muted-foreground/60" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">{title}</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {/* Go back to welcome to use existing login/signup buttons */}
                    <button
                      onClick={() => setAuthMode('welcome')}
                      className="w-full h-14 rounded-2xl bg-foreground text-background font-black text-xs tracking-[0.2em] hover:opacity-90 transition-all active:scale-95"
                    >
                      CREATE ACCOUNT / LOG IN
                    </button>
                    <button
                      onClick={handleGuestSkip}
                      className="w-full h-12 rounded-2xl border border-border/40 bg-transparent text-muted-foreground/50 hover:text-foreground hover:border-border transition-all text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                      Continue as Guest
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* STEP 1: HOSTEL SELECTION */}
        {step === 1 && (
          <motion.div
            key="hostel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-xl w-full py-12 relative z-10 px-4"
          >
            <div className="mb-12">
              <div className="flex items-center gap-3 text-primary mb-4">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Building2 size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80">Campus Setup</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Where do you stay?</h1>
              <p className="text-muted-foreground text-base mb-10">Pick your hostel to tailor your dining schedule.</p>

              <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border/50 mb-10 w-full max-w-[340px] mx-auto">
                {[
                  { id: 'male', label: "Men's", icon: User },
                  { id: 'female', label: "Ladies", icon: User }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setTempHostelType(cat.id);
                      setProfileData({ ...profileData, hostel: null });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                      tempHostelType === cat.id
                        ? 'bg-foreground text-background shadow-lg' 
                        : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <cat.icon size={14} />
                    {cat.label.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="min-h-[180px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={tempHostelType}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`grid ${tempHostelType === 'male' ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-5'} gap-2 w-full`}
                  >
                    {(tempHostelType === 'male' ? ['MH1', 'MH2', 'MH3', 'MH4', 'MH5', 'MH6', 'MH7'] : ['LH1', 'LH2', 'LH3', 'LH4', 'LH5']).map(h => (
                      <button
                        key={h}
                        onClick={() => setProfileData({ ...profileData, hostel: h })}
                        className={`aspect-square sm:aspect-auto sm:py-5 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                          profileData.hostel === h 
                            ? 'bg-foreground text-background shadow-lg' 
                            : 'bg-secondary/40 text-muted-foreground/50 border border-border/50 hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!profileData.hostel}
                  className="w-full h-16 rounded-2xl bg-foreground text-background font-bold border border-border/20 transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-xl disabled:opacity-50"
                >
                  <span className="font-bold text-lg">Confirm Choice</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <button 
                  onClick={() => setStep(0)}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  Back to Security
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: MESS & ROOM */}
        {step === 2 && (
          <motion.div
            key="routine"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md w-full py-12 relative z-10 px-4"
          >
            <div className="mb-12">
              <div className="flex items-center gap-3 text-primary mb-4">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Utensils size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/80">Preferences</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Fine-tune your diet.</h1>
              <p className="text-muted-foreground text-sm">Set your specific mess type and room details.</p>
            </div>

            <div className="space-y-10 w-full">
              {/* Mess Selector */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Mess Type</label>
                <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border/50 w-full">
                  {['Veg', 'Non-Veg', 'Special'].map(type => (
                    <button
                      key={type}
                      onClick={() => setProfileData({ ...profileData, messType: type })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 ${
                        profileData.messType === type 
                          ? 'bg-foreground text-background shadow-lg' 
                          : 'text-muted-foreground/40 hover:text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Room Number"
                placeholder="e.g. 402"
                icon={Hash}
                value={profileData.roomNumber}
                onChange={(e) => setProfileData({ ...profileData, roomNumber: e.target.value })}
                className="h-16"
              />

              <div className="pt-8 flex flex-col gap-4">
                <Button 
                  onClick={handleFinalizeProfile}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-foreground hover:opacity-90 text-background transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-xl"
                >
                  <span className="font-black text-xs tracking-[0.2em]">
                    {isSubmitting ? 'SYNCING...' : 'LAUNCH MESSIT'}
                  </span>
                  {!isSubmitting && <Sparkles size={18} className="group-hover:rotate-12 transition-transform text-primary/60" />}
                </Button>
                <button 
                  onClick={() => setStep(1)}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  Change Campus Location
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Step Indicator Dot Navigation */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {[0, 1, 2].map(s => (
          <div 
            key={s} 
            className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-primary' : 'w-1.5 bg-border/40'}`} 
          />
        ))}
      </div>
    </div>
  );
}
