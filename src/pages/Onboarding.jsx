import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ChevronRight, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { GithubIcon } from '../components/ui/icons/GithubIcon';
import { GoogleIcon } from '../components/ui/icons/GoogleIcon';
import { Input } from '../components/ui/Input';
import { useRef } from 'react';

export default function Onboarding() {
  const { setIsOnboarded, setUser } = useStore();
  
  const googleRef = useRef(null);
  const githubRef = useRef(null);
  
  // 'welcome' | 'auth'
  const [step, setStep] = useState('welcome');
  // 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    // Mock Auth
    setUser({ name: name || 'User', email });
    setIsOnboarded(true);
  };

  const handleGuestEntry = () => {
    setIsOnboarded(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-background to-background">
      <AnimatePresence mode="wait">
        
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md w-full text-center"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mb-8 inline-block"
            >
              <img src="/icon.png" alt="Messit" className="w-40 h-40 object-contain mx-auto" />
            </motion.div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground">
              Welcome to Messit
            </h1>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
              Your college mess menu, digitized and delivered exactly when you need it.
            </p>

            <div className="space-y-4">
              <Button 
                onClick={() => { setStep('auth'); setAuthMode('signup'); }}
                className="w-full py-7 text-lg rounded-2xl group shadow-lg shadow-accent/20"
              >
                Create an Account
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => { setStep('auth'); setAuthMode('login'); }}
                  className="py-6 rounded-xl border-border/50 hover:bg-muted/50"
                >
                  Log In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGuestEntry}
                  className="py-6 rounded-xl border-border/50 hover:bg-muted/50"
                >
                  Skip for Now
                </Button>
              </div>
            </div>

            <p className="mt-12 text-xs text-muted-foreground/60">
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full px-4"
          >
            <Button 
              variant="ghost" 
              onClick={() => setStep('welcome')}
              className="mb-8 -ml-2 text-muted-foreground hover:text-foreground hover:bg-transparent px-0"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Welcome
            </Button>

            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {authMode === 'login' 
                  ? 'Sign in to access your saved menu.' 
                  : 'Start your journey with Messit today.'}
              </p>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Button 
                variant="ghost" 
                className="py-7 rounded-2xl border-none hover:bg-muted/30 group bg-muted/20"
                onClick={handleGuestEntry}
                onMouseEnter={() => googleRef.current?.startAnimation()}
                onMouseLeave={() => googleRef.current?.stopAnimation()}
              >
                <GoogleIcon 
                  ref={googleRef}
                  className="mr-3 text-foreground/70 group-hover:text-foreground transition-colors" 
                  size={24} 
                  isAnimated={false} // Disable internal mouse trigger
                />
                <span className="text-xs font-bold uppercase tracking-[0.15em] opacity-80 group-hover:opacity-100 transition-opacity">Google</span>
              </Button>
              <Button 
                variant="ghost" 
                className="py-7 rounded-2xl border-none hover:bg-muted/30 group bg-muted/20"
                onClick={handleGuestEntry}
                onMouseEnter={() => githubRef.current?.startAnimation()}
                onMouseLeave={() => githubRef.current?.stopAnimation()}
              >
                <GithubIcon 
                  ref={githubRef}
                  className="mr-3 text-foreground/70 group-hover:text-foreground transition-colors" 
                  size={24} 
                  isAnimated={false} // Disable internal mouse trigger
                />
                <span className="text-xs font-bold uppercase tracking-[0.15em] opacity-80 group-hover:opacity-100 transition-opacity">GitHub</span>
              </Button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">or</span>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <Input
                  label="Full Name"
                  icon={User}
                  placeholder="Mayank Jha"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              
              <Input
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="hello@messit.app"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button type="submit" className="w-full py-7 mt-4 rounded-2xl shadow-lg shadow-accent/10 font-bold tracking-wide">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-muted-foreground">
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-accent font-bold hover:underline ml-1"
                >
                  {authMode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
