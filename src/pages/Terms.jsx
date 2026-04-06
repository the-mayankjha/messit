import { motion } from 'motion/react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';

export default function Terms({ onBack }) {
  const { theme, accentColor } = useStore();
  
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-20 px-6 max-w-2xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-secondary/30 text-muted-foreground hover:text-foreground transition-all active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back</span>
          </button>
          
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/80">Terms</h1>
          
          <button 
            onClick={handleShare}
            className="p-2 rounded-xl bg-secondary/30 text-muted-foreground hover:text-foreground transition-all active:scale-95"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Document Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 sm:py-20">
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Terms of Service</h2>
          <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground/40 uppercase italic">Last Updated: April 2026 · v1.2.21</p>
        </div>

        <div className="space-y-12">
          {sections.map((section, i) => (
            <motion.section 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-black tracking-tight" style={{ color: accentHex }}>{section.title}</h3>
              <p className="text-muted-foreground/80 leading-relaxed font-medium">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        <footer className="mt-24 pt-12 border-t border-border/40 text-center">
          <p className="text-[10px] font-black tracking-[0.3em] text-muted-foreground/20 uppercase">
            © 2026 Messit Intelligence Protocol
          </p>
        </footer>
      </main>
    </motion.div>
  );
}
