import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { 
  ArrowRight, ArrowLeft, Crown, Check,
  RefreshCw, Building2, Utensils, Hash,
  Star, Sparkles, MapPin, User, ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GithubIcon } from '../components/ui/icons/GithubIcon';
import { GoogleIcon } from '../components/ui/icons/GoogleIcon';
import { useAuth0 } from '@auth0/auth0-react';
import { syncSupabaseProfile } from '../lib/supabase';

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
    setUser
  } = useStore();
  
  // 0: Welcome | 1: Hostel | 2: Mess & Room | 3: Finalizing
  // 0: Welcome | 1: Hostel | 2: Mess & Room | 3: Finalizing
  const [step, setStep] = useState(0);
  const [authMode, setAuthMode] = useState('welcome'); // 'welcome' | 'auth'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    loginWithRedirect({
      authorizationParams: {
        connection
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
              {authMode === 'welcome' ? (
                <motion.div
                  key="welcome_view"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center py-12"
                >
                  {/* Premium Brand Icon Container */}
                  <div className="relative mb-12 sm:mb-16">
                    <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-secondary/30 rounded-[2rem] border border-border/50 flex items-center justify-center overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                      <img 
                        src="/icon.png" 
                        alt="Messit Logo" 
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl" 
                      />
                    </div>
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
                        onClick={handleGuestSkip}
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
              ) : (
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
                        onMouseEnter={() => googleIconRef.current?.startAnimation()}
                        onMouseLeave={() => googleIconRef.current?.stopAnimation()}
                        className="flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/50 border border-border/50 py-4 rounded-xl transition-all active:scale-95 group"
                      >
                        <GoogleIcon ref={googleIconRef} />
                        <span className="text-[10px] font-black tracking-[0.2em] text-foreground/80">GOOGLE</span>
                      </button>
                      <button 
                        onClick={() => handleSocialAuth('github')}
                        onMouseEnter={() => githubIconRef.current?.startAnimation()}
                        onMouseLeave={() => githubIconRef.current?.stopAnimation()}
                        className="flex items-center justify-center gap-3 bg-secondary/30 hover:bg-secondary/50 border border-border/50 py-4 rounded-xl transition-all active:scale-95 group"
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
                      <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 ml-1 uppercase">Email Address</label>
                        <div className="relative group">
                          <Utensils size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors" />
                          <input 
                            type="email"
                            placeholder="hello@messit.app"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-secondary/30 border border-border/50 h-16 rounded-2xl pl-14 pr-6 text-foreground font-medium text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/30 transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60 ml-1 uppercase">Password</label>
                        <div className="relative group">
                          <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors" />
                          <input 
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-secondary/30 border border-border/50 h-16 rounded-2xl pl-14 pr-6 text-foreground font-medium text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/30 transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-4 text-center">
                      <button 
                        onClick={() => setStep(1)}
                        className="w-full h-16 rounded-2xl bg-foreground text-background font-black text-xs tracking-[0.2em] shadow-xl hover:opacity-90 transition-all active:scale-95"
                      >
                        CONTINUE
                      </button>
                      <button 
                        onClick={handleGuestSkip}
                        className="text-muted-foreground/40 hover:text-foreground text-[9px] font-black uppercase tracking-[0.3em] transition-colors py-2"
                      >
                        Skip for now
                      </button>
                    </div>
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
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Where do you stay?</h1>
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
                        ? 'bg-white text-background shadow-lg' 
                        : 'text-muted-foreground/60 hover:text-white hover:bg-secondary'
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
                            ? 'bg-white text-background shadow-lg' 
                            : 'bg-secondary/40 text-muted-foreground/40 border border-border/50 hover:bg-secondary hover:text-white'
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
                  className="w-full h-16 rounded-2xl bg-primary text-white border border-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-xl"
                >
                  <span className="font-bold text-lg">Confirm Choice</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <button 
                  onClick={() => setStep(0)}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-white transition-colors"
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
              <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Fine-tune your diet.</h1>
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
                          ? 'bg-white text-background shadow-lg' 
                          : 'text-muted-foreground/40 hover:text-white hover:bg-secondary'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Number */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 ml-1">Room Number</label>
                 <div className="relative group">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/20 group-focus-within:text-primary/60 transition-colors" />
                    <input 
                      placeholder="e.g. 402"
                      value={profileData.roomNumber}
                      onChange={(e) => setProfileData({ ...profileData, roomNumber: e.target.value })}
                      className="flex w-full rounded-2xl border border-border/40 bg-secondary/30 px-5 py-4 text-sm transition-all shadow-inner text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/20 disabled:cursor-not-allowed disabled:opacity-50 selection:bg-primary/30 selection:text-foreground [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset] [&:-webkit-autofill]:text-fill-foreground pl-14 h-16"
                    />
                 </div>
              </div>

              <div className="pt-8 flex flex-col gap-4">
                <Button 
                  onClick={handleFinalizeProfile}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-white hover:bg-white/95 text-background transition-all active:scale-95 flex items-center justify-center gap-2 group shadow-xl"
                >
                  <span className="font-black text-xs tracking-[0.2em]">
                    {isSubmitting ? 'SYNCING...' : 'LAUNCH MESSIT'}
                  </span>
                  {!isSubmitting && <Sparkles size={18} className="group-hover:rotate-12 transition-transform text-primary/60" />}
                </Button>
                <button 
                  onClick={() => setStep(1)}
                  className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-white transition-colors"
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
