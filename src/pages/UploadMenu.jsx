import { useState } from 'react';
import { AlertCircle, Check, RefreshCw, Cloud, Database, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { CloudUploadIcon } from '../components/ui/icons/CloudUploadIcon';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { parseExcelMenu } from '../utils/excelParser';
import { motion, AnimatePresence } from 'motion/react';
import { uploadMessMenu, getMessMenu } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export default function UploadMenu({ onComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [localParsedData, setLocalParsedData] = useState(null);
  
  const { 
    setMenuData, accentColor, theme, 
    role, user, hostel, messType,
    syncStatus, isSyncing, setSyncStatus
  } = useStore();

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const isAuthorizedToCloud = ['Admin', 'Developer', 'Coordinator'].includes(role);

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
    setLocalParsedData(null);
    
    try {
      const parsedData = await parseExcelMenu(file);
      setLocalParsedData(parsedData);
      // Immediately set locally
      setMenuData(parsedData);
    } catch (err) {
      setError("Failed to parse the menu file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToCloud = async () => {
    if (!localParsedData || !user?.email || !hostel) return;
    
    setPublishing(true);
    setError(null);
    
    // Determine category (MH/LH)
    const category = hostel.startsWith('MH') ? 'MH' : (hostel.startsWith('LH') ? 'LH' : hostel);
    
    try {
      const result = await uploadMessMenu(category, messType, localParsedData, user.email);
      if (result.success) {
        setSyncStatus({ 
          syncStatus: 'success', 
          lastSyncedAt: new Date().toISOString() 
        });
        if (onComplete) onComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError("Cloud Publish Failed: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleForceResync = async () => {
    if (!hostel || !messType) return;
    setSyncStatus({ isSyncing: true, syncStatus: 'syncing' });
    try {
      const result = await getMessMenu(hostel, messType);
      if (result.success && result.data) {
        setMenuData(result.data);
        setSyncStatus({ 
          isSyncing: false, 
          syncStatus: 'success', 
          lastSyncedAt: new Date().toISOString() 
        });
        if (onComplete) onComplete();
      } else {
        setError(result.error || "No cloud menu found for your profile.");
        setSyncStatus({ isSyncing: false, syncStatus: 'error' });
      }
    } catch (err) {
      setError("Sync failed. Check your connection.");
      setSyncStatus({ isSyncing: false, syncStatus: 'idle' });
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
    <div className="max-w-xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Database size={12} className="text-primary" />
          <span className="text-[10px] font-black tracking-widest text-primary uppercase">Cloud Sync Node</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Menu Management</h1>
        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
          {isAuthorizedToCloud 
            ? "Upload and publish menus for your entire hostel category."
            : "Automatic cloud sync is active for your authenticated profile."}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Status Dashboard for Regular Users */}
        {!isAuthorizedToCloud && user && (
          <motion.div 
            key="status_card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-6 rounded-3xl bg-muted/5 border border-border/50 shadow-xl overflow-hidden relative group"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-background border border-border/50 flex items-center justify-center shadow-lg">
                  {syncStatus === 'success' ? (
                    <Cloud size={24} className="text-primary animate-pulse" />
                  ) : (
                    <RefreshCw size={24} className={`text-muted-foreground/30 ${isSyncing ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {syncStatus === 'success' ? 'Cloud Sync Active' : 'Manual Mode'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    {hostel} • {messType}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleForceResync}
                disabled={isSyncing}
                className="p-3 rounded-xl bg-background border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all active:scale-90 disabled:opacity-50"
              >
                <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {/* Glossy background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10 rounded-full" />
          </motion.div>
        )}

        {/* Upload Dropzone (Visible for Admins OR Guest/Error users) */}
        {(isAuthorizedToCloud || !user || syncStatus === 'error' || syncStatus === 'idle') && (
           <motion.div 
             key="dropzone"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="relative group mb-8"
           >
            <input 
              type="file" 
              id="file-upload" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-wait" 
              accept=".xlsx"
              onChange={handleChange} 
              disabled={loading || publishing}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            />
            <div 
              className={`
                border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-500
                ${(loading || publishing) ? 'opacity-50 grayscale' : ''}
              `}
              style={{
                backgroundColor: dragActive ? `${accentHex}10` : 'rgba(var(--muted), 0.03)',
                borderColor: dragActive ? accentHex : 'rgba(var(--border), 0.3)',
                transform: dragActive ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110" />
                    <RefreshCw size={48} className="text-primary animate-spin relative z-10" />
                  </div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase text-primary animate-pulse">Analyzing Buffet...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative inline-flex items-center justify-center p-6 bg-background rounded-3xl shadow-2xl border border-border/40 group-hover:scale-110 transition-transform duration-500">
                    <CloudUploadIcon size={48} style={{ color: accentHex }} />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-all duration-300">
                      <Sparkles size={12} fill="currentColor" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-bold">Deploy your Menu</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Drop the .xlsx file here to begin.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Cloud Publish Button */}
      {isAuthorizedToCloud && localParsedData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col gap-4"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
             </div>
             <div>
                <p className="text-xs font-black tracking-widest text-primary uppercase">Authority Verified</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Publishing for <b>{hostel.startsWith('MH') ? 'MH' : 'LH'}</b> • <b>{messType}</b></p>
             </div>
          </div>
          <Button 
            onClick={handlePublishToCloud}
            disabled={publishing}
            className="w-full h-14 rounded-2xl bg-primary text-white font-bold tracking-widest flex items-center justify-center gap-2 group transition-all"
          >
            {publishing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                <span>PUBLISH TO CLOUD</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-all" />
              </>
            )}
          </Button>
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-500"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold leading-relaxed">{error}</p>
        </motion.div>
      )}

      <div className="mt-12 pt-8 border-t border-border/20 text-center">
        <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.2em]">
          Automated Schedule Support: Breakfast • Lunch • Snacks • Dinner
        </p>
      </div>
    </div>
  );
}
