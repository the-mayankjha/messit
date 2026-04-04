import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Check, Crown, Dumbbell, Bell, 
  User, Mail, Building, Key, ShieldCheck,
  ShieldAlert, RefreshCw, Save, UserX, Lock,
  Sparkles, Cloud, Megaphone, BellRing, LogIn
} from 'lucide-react';
import { GoogleIcon } from '../components/ui/icons/GoogleIcon';
import { GithubIcon } from '../components/ui/icons/GithubIcon';
import { BellRingIcon } from '../components/ui/icons/BellRingIcon';
import { MoonIcon } from '../components/ui/icons/MoonIcon';
import { SunIcon } from '../components/ui/icons/SunIcon';
import { useAuth0 } from '@auth0/auth0-react';
import { requestNotificationPermission, sendNotification } from '../utils/notifier';
import { ACCENT_COLORS } from '../constants/colors';
import { submitCoordinatorRequest, getUserCoordinatorRequest, getSupabaseProfile } from '../lib/supabase';

export default function Settings() {
  const { logout, loginWithRedirect, user: auth0User, isAuthenticated } = useAuth0();
  const { 
    user, 
    role, 
    accentColor, 
    setAccentColor,
    theme, setTheme,
    notificationMode, setNotificationMode,
    hostel, setProfile,
    roomNumber, messType,
    setIsOnboarded, setMenuData,
    addNotification, setNotificationPending
  } = useStore();

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  // Local state for editing
  const [localHostel, setLocalHostel] = useState(hostel);
  const [localRoom, setLocalRoom] = useState(roomNumber);
  const [localMess, setLocalMess] = useState(messType);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [coordinatorRequest, setCoordinatorRequest] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const moonIconRef = useRef(null);
  const sunIconRef = useRef(null);
  const bellIconRef = useRef(null);

  const hostels = {
    male: ['MH1', 'MH2', 'MH3', 'MH4', 'MH5', 'MH6', 'MH7'],
    female: ['LH1', 'LH2', 'LH3', 'LH4', 'LH5']
  };

  // Persistent session: Auth0 OR cached store user (works offline too)
  const isEffectivelyAuthenticated = isAuthenticated || (!!user && user.email !== 'guest@messit.co');
  // Derive active user: prefer live Auth0 user, fall back to store cache
  const activeUser = auth0User ?? user;

  const loginProvider = useMemo(() => {
    if (!isEffectivelyAuthenticated) return 'Guest';
    if (!activeUser?.sub && !activeUser?.email) return 'Processing...';
    const sub = activeUser?.sub ?? '';
    if (sub.startsWith('google') || activeUser?.email?.includes('gmail')) return 'Google';
    if (sub.startsWith('github')) return 'GitHub';
    return 'Email';
  }, [activeUser, isEffectivelyAuthenticated]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const calculatedGender = localHostel?.startsWith('MH') ? 'Male' : 'Female';
    
    const updatedProfile = {
      hostel: localHostel,
      roomNumber: localRoom,
      messType: localMess,
      gender: calculatedGender,
      role: role
    };

    setProfile(updatedProfile);

    // Supabase Sync
    try {
      const { syncSupabaseProfile } = await import('../lib/supabase');
      await syncSupabaseProfile({
        ...updatedProfile,
        email: user?.email,
        name: user?.name,
        picture: user?.picture || auth0User?.picture || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      getUserCoordinatorRequest(user.email).then(res => {
        if (res.success && res.data) {
          setCoordinatorRequest(res.data);
        }
      });
    }
  }, [user?.email]);

  // Sync real role from Supabase on mount
  useEffect(() => {
    if (user?.email) {
      getSupabaseProfile(user.email).then(res => {
        if (res.success && res.data?.role && res.data.role !== 'None') {
          setProfile({ role: res.data.role });
        }
      });
    }
  }, [user?.email]);

  const handleRequestCoordinator = async () => {
    if (!user?.email || !user?.name || !hostel) return;
    setIsRequesting(true);
    try {
      const res = await submitCoordinatorRequest(user.email, user.name, hostel);
      if (res.success) {
        setCoordinatorRequest(res.data[0]);
        addNotification(
          "Authority Protocol Initiated 🛡️", 
          "Your request to become a Coordinator is now under review by the Admins."
        );
        setNotificationPending(true);
      }
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleLogout = () => {
    // setUser(null); // Removed as setUser is not in the new destructuring
    setIsOnboarded(false);
    logout({ logoutParams: { returnTo: window.location.origin } });
  };
  const [testMeal, setTestMeal] = useState('Lunch');
  const [lastTestResult, setLastTestResult] = useState(null);

  const themes = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      const result = sendNotification(testMeal, notificationMode);
      setLastTestResult(result);
    } else {
      alert("Please enable notifications in your browser settings.");
    }
  };

  const previewContent = useMemo(() => {
    if (notificationMode === 'stud') {
      return {
        title: `Yo Bro, Fuel Up! 🥩`,
        body: `Grab your protein! ${testMeal} is being served at the mess...`
      };
    }
    return {
      title: `Your Meal Awaits, Princess ✨`,
      body: `It's time for a delicious ${testMeal}. Treat yourself well...`
    };
  }, [notificationMode, testMeal]);

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Header: Responsive Stacking */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your identity and preferences.</p>
        </div>
        {user && (
          <div className="flex items-center gap-4 bg-muted/30 px-4 sm:px-5 py-3 rounded-2xl border border-border/40 w-full sm:w-auto">
            <img src={user?.picture || "/icon.png"} className="w-10 h-10 rounded-full border-2 border-primary shadow-sm" alt="" />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const displayRole = !role || role === 'None' ? 'Student' : role;
                  const dotColor = role === 'Admin' ? '#f59e0b' : role === 'Coordinator' ? accentHex : '#22c55e';
                  const textColor = role === 'Admin' ? '#f59e0b' : role === 'Coordinator' ? accentHex : undefined;
                  return (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      <p className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: textColor || undefined }} >
                        <span className={!textColor ? 'text-muted-foreground/60' : ''}>{displayRole}</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest Login Prompt — shown only for unauthenticated users */}
      {loginProvider === 'Guest' && (
        <div className="mb-8 p-5 rounded-3xl border border-border/50 bg-card shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, ${accentHex}10 0%, transparent 60%)` }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${accentHex}15`, borderColor: `${accentHex}30`, color: accentHex }}
            >
              <LogIn size={22} />
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-black text-sm text-foreground">Unlock the Full Messit Experience</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Sign in to get cloud sync, automated menu updates, personalised notifications, and broadcast access.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: Cloud, label: 'Cloud Sync' },
                  { icon: BellRing, label: 'Smart Alerts' },
                  { icon: Megaphone, label: 'Broadcasts' },
                  { icon: Sparkles, label: 'Auto Menu' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 text-muted-foreground">
                    <Icon size={10} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all text-[10px] font-black uppercase tracking-widest text-foreground"
              >
                <GoogleIcon size={14} />
                Google
              </button>
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { connection: 'github' } })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-all text-[10px] font-black uppercase tracking-widest text-foreground"
              >
                <GithubIcon size={14} />
                GitHub
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column: Account & Profile */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Campus Profile Section — hidden for Guest users */}
          {loginProvider !== 'Guest' && (
          <Card className="overflow-hidden border-none shadow-2xl shadow-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold">Campus Profile</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-balance">Update your mess and hostel preferences.</p>
                </div>
                <Building className="text-muted-foreground/40 w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 sm:space-y-8 pt-4">
              
              {/* Hostel Picker: Integrated Style */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Assigned Hostel</label>
                <div className="space-y-3 bg-muted/20 p-2 rounded-[2rem]">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {hostels.male.map(h => (
                      <button
                        key={h}
                        onClick={() => setLocalHostel(h)}
                        className={`py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-bold transition-all ${
                          localHostel === h ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {hostels.female.map(h => (
                      <button
                        key={h}
                        onClick={() => setLocalHostel(h)}
                        className={`py-2.5 sm:py-3 rounded-2xl text-[10px] sm:text-xs font-bold transition-all ${
                          localHostel === h ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 sm:mb-4 block">Mess Preference</label>
                  <div className="flex bg-muted/20 p-1 rounded-2xl gap-1">
                    {['Veg', 'Non-Veg', 'Special'].map(type => (
                      <button
                        key={type}
                        onClick={() => setLocalMess(type)}
                        className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                          localMess === type ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Room Number"
                  placeholder="e.g. 402"
                  value={localRoom}
                  onChange={(e) => setLocalRoom(e.target.value)}
                />
              </div>

              {/* Role Display: Read-Only */}
              <div className="pt-4 border-t border-border/40">
                 <div 
                   className="flex items-center justify-between p-4 rounded-2xl border"
                   style={{ backgroundColor: `${accentHex}08`, borderColor: `${accentHex}20` }}
                 >
                   <div className="flex items-center gap-4">
                     <div 
                       className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: `${accentHex}15`, color: accentHex }}
                     >
                       <ShieldCheck size={20} />
                     </div>
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Platform Role</p>
                       <p className="font-bold underline decoration-dotted underline-offset-4" style={{ color: accentHex }}>{role || 'None'}</p>
                     </div>
                   </div>
                   <div 
                     className="px-3 py-1 rounded-full border"
                     style={{ backgroundColor: `${accentHex}15`, borderColor: `${accentHex}30` }}
                   >
                     <p className="text-[8px] font-bold uppercase tracking-tighter" style={{ color: accentHex }}>Locked</p>
                   </div>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-3 italic text-center sm:text-left">Your role is set during onboarding and cannot be changed without administrator approval.</p>

                 {/* Coordinator Request Flow: Optimized for High-Density Visibility */}
                 {(role === 'None' || !role) && (
                   <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-border/40 bg-muted/15 shadow-2xl shadow-primary/5">
                     <div className="p-6 sm:p-8">
                       <div className="flex flex-col gap-8">
                         <div className="space-y-2">
                           <div className="flex items-center gap-3">
                             <div 
                               className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                               style={{ backgroundColor: coordinatorRequest?.status === 'pending' ? '#eab308' : (coordinatorRequest?.status === 'rejected' ? '#ef4444' : accentHex) }}
                             />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/90">Administrative Authority</h4>
                           </div>
                           <p className="text-xs sm:text-sm text-balance text-muted-foreground leading-relaxed">
                             Request to manage mess menus and global broadcasts. Your request undergoes an automated security audit.
                           </p>
                         </div>

                         <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                           {coordinatorRequest && coordinatorRequest.status !== 'rejected' ? (
                             <div 
                               className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl flex items-center gap-3 shadow-sm ${
                                 coordinatorRequest.status === 'pending' 
                                   ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                                   : 'bg-green-500/10 text-green-500 border-green-500/20'
                               }`}
                             >
                               {coordinatorRequest.status === 'pending' && <RefreshCw size={14} className="animate-spin" />}
                               {coordinatorRequest.status}
                             </div>
                           ) : (
                             <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                               <Button 
                                 onClick={handleRequestCoordinator}
                                 disabled={isRequesting}
                                 className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto"
                               >
                                 {isRequesting ? (
                                   <RefreshCw className="animate-spin w-4 h-4" />
                                 ) : (
                                   <>
                                     <Crown size={18} />
                                     <span>{coordinatorRequest?.status === 'rejected' ? 'Send Request Again' : 'Send Request'}</span>
                                   </>
                                 )}
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                      <div className="flex flex-wrap items-center gap-3 mb-2 px-8 pb-6">
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.25em]">
                          <ShieldCheck size={10} className="shrink-0" />
                          Verification required via Admins
                        </span>
                      </div>
                    </div>
                 )}
              </div>

              <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                   {saveSuccess && (
                     <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 text-green-500 font-bold text-sm">
                       <ShieldCheck size={18} />
                       Changes Synced
                     </motion.div>
                   )}
                </div>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {isSaving ? (
                    <RefreshCw className="animate-spin mr-2 w-4 h-4" />
                  ) : (
                    <Save className="mr-2 w-4 h-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          )} {/* End Campus Profile guest gate */}

          {/* Identity & Security Card */}
          <Card className="border-none shadow-xl shadow-muted/50">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Identity & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30">
                   <div 
                     className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${accentHex}15`, color: accentHex }}
                   >
                     <User size={20} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</p>
                     <p className="font-semibold truncate">{user?.name}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30">
                   <div 
                     className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${accentHex}15`, color: accentHex }}
                   >
                     <Mail size={20} />
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</p>
                     <p className="font-semibold text-sm truncate">{user?.email}</p>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-5 sm:p-6 rounded-3xl border border-dashed border-border/60 gap-4">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                  {loginProvider === 'Google' && (
                    <div className="w-10 h-10 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center shadow-inner">
                      <GoogleIcon size={24} isAnimated={false} />
                    </div>
                  )}
                  {loginProvider === 'GitHub' && (
                    <div className="w-10 h-10 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center shadow-inner">
                      <GithubIcon size={24} />
                    </div>
                  )}
                  {loginProvider === 'Email' && (
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <User size={22} />
                    </div>
                  )}
                  {loginProvider === 'Guest' && (
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
                      <UserX size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm sm:text-base">Login Method</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Direct {loginProvider} Authentication</p>
                  </div>
                </div>
                {loginProvider === 'Email' && (
                  <Button variant="outline" className="w-full sm:w-auto rounded-[1.2rem] h-12 px-6 border-border/80 hover:bg-primary/5">
                    <Key size={16} className="mr-2" />
                    Change Password
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Theme & Notifications */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Appearance Card */}
          <Card className="border-none bg-muted/5">
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                {themes.map((t) => {
                  const isActive = theme === t.id;
                  const isDark = t.id === 'dark';
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        if (isDark) moonIconRef.current?.startAnimation();
                        else sunIconRef.current?.startAnimation();
                      }}
                      className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all ${
                        isActive ? 'bg-secondary/30' : 'border-border/40 hover:bg-muted'
                      }`}
                      style={isActive ? { borderColor: accentHex, backgroundColor: `${accentHex}10` } : {}}
                    >
                      {isDark ? (
                        <MoonIcon
                          ref={moonIconRef}
                          size={20}
                          className="mb-2"
                          isAnimated={true}
                        />
                      ) : (
                        <SunIcon
                          ref={sunIconRef}
                          size={20}
                          className="mb-2"
                          isAnimated={true}
                        />
                      )}
                      <span className="text-[10px] sm:text-xs font-bold">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Catppuccin Accent Selector */}
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 ml-1">Accent Color</p>
                <div className="flex flex-wrap gap-3 px-1">
                  {Object.entries(ACCENT_COLORS).map(([name, hexes]) => {
                    const isSelected = accentColor === name;
                    // Determine effective color based on current theme
                    // If theme is 'system', we'd need to know actual theme. 
                    // For simplicity, we'll use theme state, and if 'system', default to dark since Messit is elite dark by default.
                    const displayColor = (theme === 'light') ? hexes.light : hexes.dark;
                    
                    return (
                      <button
                        key={name}
                        onClick={() => setAccentColor(name)}
                        className="relative group transition-all active:scale-90"
                        title={name}
                      >
                        <div 
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all duration-300 ${
                            isSelected ? 'scale-110 shadow-lg ring-4 ring-offset-2 ring-offset-background' : 'scale-100 hover:scale-105'
                          }`}
                          style={{ 
                            backgroundColor: displayColor,
                            ringColor: isSelected ? `${displayColor}40` : undefined,
                            '--tw-ring-color': isSelected ? displayColor : 'transparent'
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Check 
                              size={20} 
                              strokeWidth={3.5} 
                              className={`${(name === 'Default' && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))) ? 'text-black' : 'text-white'} drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]`} 
                            />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vibe Settings Card: Redesigned for Vertical Personality */}
          <Card className="border-none bg-muted/5 shadow-xl shadow-muted/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">Notifications</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Configure your meal reminders.</p>
                </div>
                <BellRingIcon ref={bellIconRef} size={22} className="text-muted-foreground/50" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 relative group/notif">
              {/* Guest Lock Overlay */}
              {loginProvider === 'Guest' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 backdrop-blur-[2px] bg-background/60 flex flex-col items-center justify-center rounded-3xl p-6 text-center border border-border/20 m-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border/50 flex items-center justify-center mb-4 shadow-xl">
                    <Lock size={24} className="text-primary" />
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">Notifications Locked</h4>
                  <p className="text-[10px] text-muted-foreground max-w-[180px]">Please sign in to configure your personalized meal reminders.</p>
                </motion.div>
              )}

              <div className={loginProvider === 'Guest' ? 'pointer-events-none opacity-40 grayscale-[0.5]' : ''}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Notification Style</p>
                  <div className="space-y-3">
                    
                    {/* Stud Mode Card */}
                    <button
                      onClick={() => { setNotificationMode('stud'); bellIconRef.current?.shake(); }}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group ${
                        notificationMode === 'stud' 
                          ? 'shadow-lg' 
                          : 'border-border/40 hover:bg-muted/30 bg-muted/20'
                      }`}
                      style={notificationMode === 'stud' ? {
                        borderColor: accentHex,
                        backgroundColor: `${accentHex}08`,
                        boxShadow: `0 4px 24px ${accentHex}15`
                      } : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="p-2 rounded-xl transition-colors"
                          style={notificationMode === 'stud' ? { color: accentHex, backgroundColor: `${accentHex}15` } : {}}
                        >
                          {notificationMode !== 'stud' && <Dumbbell size={20} className="text-muted-foreground" />}
                          {notificationMode === 'stud' && <Dumbbell size={20} />}
                        </div>
                        <h4 className="font-bold text-lg text-foreground">Stud Mode</h4>
                      </div>
                      <p className="text-sm text-muted-foreground pl-11 leading-relaxed opacity-80 italic">
                        "Yo Bro, Fuel Up! Grab your protein..."
                      </p>
                    </button>

                    {/* Princess Mode Card */}
                    <button
                      onClick={() => { setNotificationMode('princess'); bellIconRef.current?.shake(); }}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group ${
                        notificationMode === 'princess' 
                          ? 'shadow-lg' 
                          : 'border-border/40 hover:bg-muted/30 bg-muted/20'
                      }`}
                      style={notificationMode === 'princess' ? {
                        borderColor: accentHex,
                        backgroundColor: `${accentHex}08`,
                        boxShadow: `0 4px 24px ${accentHex}15`
                      } : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="p-2 rounded-xl transition-colors"
                          style={notificationMode === 'princess' ? { color: accentHex, backgroundColor: `${accentHex}15` } : {}}
                        >
                          {notificationMode !== 'princess' && <Crown size={20} className="text-muted-foreground" />}
                          {notificationMode === 'princess' && <Crown size={20} />}
                        </div>
                        <h4 className="font-bold text-lg text-foreground">Princess Mode</h4>
                      </div>
                      <p className="text-sm text-muted-foreground pl-11 leading-relaxed opacity-80 italic">
                        "Your Meal Awaits, Princess. Time for a delicious..."
                      </p>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button onClick={handleTestNotification} variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-all">
                    Fire Test Alert
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <div className="pt-4 sm:pt-8 space-y-6">
             <Button 
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/10 py-7 rounded-3xl font-bold tracking-wide transition-all active:scale-95"
              >
                Sign Out Securely
              </Button>
              <div className="text-center space-y-1 mt-4">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  App Version {__APP_VERSION__} (STABLE)
                </p>
                <p className="text-[9px] text-muted-foreground/40 font-medium whitespace-nowrap">
                  Build: {__BUILD_DATE__}.{__BUILD_VARIANT__}
                </p>
                <p className="text-[9px] text-muted-foreground/30 font-medium mt-3">
                  Developed by{' '}
                  <a 
                    href="https://github.com/the-mayankjha/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-muted-foreground underline underline-offset-2 decoration-muted-foreground/20 transition-colors"
                  >
                    Mayank Jha
                  </a>
                </p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
