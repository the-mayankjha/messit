import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { CloudUploadIcon } from '../components/ui/icons/CloudUploadIcon';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { parseExcelMenu } from '../utils/excelParser';
import { motion } from 'motion/react';

export default function UploadMenu({ onComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setMenuData, accentColor, theme } = useStore();

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      setError("Please upload a valid .xlsx file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsedData = await parseExcelMenu(file);
      setMenuData(parsedData);
      if (onComplete) onComplete();
    } catch (err) {
      setError("Failed to parse the menu file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Update Menu Schedule</h1>
        <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">
          Upload your mess's <span className="font-bold text-foreground">.xlsx</span> file to refresh your automated meal schedule.
        </p>
      </div>

      <div className="relative group">
        <input 
          type="file" 
          id="file-upload" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-wait" 
          accept=".xlsx"
          onChange={handleChange} 
          disabled={loading}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        />
        <div 
          className={`
            border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300
            ${loading ? 'opacity-50 grayscale' : ''}
          `}
          style={{
            backgroundColor: dragActive ? `${accentHex}10` : 'rgba(var(--muted), 0.05)',
            borderColor: dragActive ? accentHex : 'rgba(var(--border), 0.4)',
            transform: dragActive ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-10 h-10 border-4 rounded-full animate-spin" 
                style={{ borderTopColor: accentHex, borderLeftColor: `${accentHex}20`, borderRightColor: `${accentHex}20`, borderBottomColor: `${accentHex}20` }}
              />
              <p className="text-sm font-bold tracking-widest uppercase animate-pulse" style={{ color: accentHex }}>Processing Menu...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 flex justify-center">
                <CloudUploadIcon size={56} style={{ color: accentHex }} />
              </div>
              <div>
                <p className="text-base font-semibold">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse your files</p>
              </div>
              <div className="pt-2">
                <span className="px-3 py-1 bg-background border border-border/50 rounded-full text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                  Microsoft Excel only
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-500"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </motion.div>
      )}

      <div className="mt-12 text-center">
        <p className="text-xs text-muted-foreground/50 leading-relaxed uppercase tracking-[0.1em] font-medium">
          Parsed items: Breakfast, Lunch, Snacks, and Dinner
        </p>
      </div>
    </div>
  );
}
