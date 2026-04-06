import { motion } from 'motion/react';
import { ArrowLeft, Share2, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function Terms({ onBack }) {
  const { theme, accentColor } = useStore();
  
  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : (theme || 'dark');
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Messit - Terms of Service',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const sections = [
    {
      title: "1. Acceptance of Protocol",
      content: "By accessing Messit, you agree to abide by the digital dining protocols established for your campus. This is a premium intelligence layer for your mess experience."
    },
    {
      title: "2. Platform Intelligence & Algorithms",
      content: "Messit uses sophisticated algorithms to predict meal timings and synchronize notifications. You acknowledge that anonymized usage patterns may be shared with developers to enhance these predictive engines and improve the overall platform protocol."
    },
    {
      title: "3. User Conduct",
      content: "You are responsible for the integrity of the data you upload (menus, updates). Impersonating coordinators or uploading malicious scripts is strictly prohibited and governed by campus security protocols."
    },
    {
      title: "4. Liability",
      content: "Messit is an intelligence layer. While we strive for 100% menu integrity, we are not responsible for sudden changes in the actual physical mess kitchen."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground flex flex-col"
    >
      {/* Sticky Premium Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-20 px-6 max-w-4xl mx-auto w-full">
          <Button 
            variant="outline"
            onClick={onBack}
            className="rounded-2xl h-11 px-6 border-border/60 hover:bg-muted/50 transition-all active:scale-95 flex items-center gap-3"
          >
            <ArrowLeft size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">Back</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic leading-none pt-1">Protocol /</span>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground pt-1">Terms</span>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleShare}
            className="rounded-2xl w-11 h-11 p-0 border-border/60 hover:bg-muted/50 transition-all active:scale-95"
          >
            <Share2 size={18} />
          </Button>
        </div>
      </header>

      {/* Hero Branding Section */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 sm:py-20 space-y-12">
        
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <img 
              src="/icon.png" 
              alt="Messit Logo" 
              className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-500" 
            />
          </motion.div>
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground italic">Terms of Service</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[10px] font-black tracking-[0.4em] text-muted-foreground/40 uppercase italic">v1.2.21</span>
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
              <span className="text-[10px] font-black tracking-[0.4em] text-muted-foreground/40 uppercase italic">APRIL 2026</span>
            </div>
          </div>
        </div>

        {/* Premium Document Card */}
        <Card className="overflow-hidden border-none shadow-2xl shadow-primary/5 bg-muted/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          
          <CardHeader className="pt-10 pb-6 px-8 sm:px-12">
            <div className="flex items-center gap-3 text-primary/60 mb-2">
              <ShieldCheck size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Compliance Protocol</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">University Dining Agreement</CardTitle>
          </CardHeader>

          <CardContent className="px-8 sm:px-12 pb-12 space-y-10">
            {sections.map((section, i) => (
              <motion.section 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="flex items-start gap-6 sm:gap-8">
                  <span className="text-lg font-black italic opacity-10 group-hover:opacity-30 transition-opacity pt-1" style={{ color: accentHex }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-3 flex-1">
                    <h3 className="text-lg font-black tracking-tight group-hover:translate-x-1 transition-transform" style={{ color: accentHex }}>
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground/80 leading-relaxed font-medium text-sm sm:text-base">
                      {section.content}
                    </p>
                  </div>
                </div>
                {i !== sections.length - 1 && (
                  <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                )}
              </motion.section>
            ))}
          </CardContent>
        </Card>

        {/* Footer Brand Seal */}
        <footer className="mt-24 py-12 flex flex-col items-center space-y-6 opacity-30">
          <div className="flex items-center gap-3">
             <Sparkles size={14} className="text-primary" />
             <p className="text-[10px] font-black tracking-[0.4em] uppercase pt-1">
               Messit Intelligence Protocol
             </p>
          </div>
          <p className="text-[9px] font-bold tracking-widest uppercase">
            EST. 2026 / Campus-Layer 01
          </p>
        </footer>
      </main>
    </motion.div>
  );
}
