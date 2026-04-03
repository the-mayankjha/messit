import { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, Check, RefreshCw, Cloud, Database, 
  Sparkles, ShieldCheck, ChevronRight, UserCheck, 
  UserX, Megaphone, FlaskConical, Send, History,
  LayoutDashboard, Users, Zap, BellRing, Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  getPendingRequests, updateRequestStatus, 
  uploadMessMenu, createAnnouncement,
  supabase 
} from '../lib/supabase';
import { parseExcelMenu } from '../utils/excelParser';
import { requestNotificationPermission, sendNotification } from '../utils/notifier';

export default function AdminDashboard() {
  const { 
    role, user, hostel, messType, accentColor, theme,
    setMenuData, setSyncStatus, syncStatus, isSyncing,
    addNotification, setNotificationPending 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState(role === 'Admin' ? 'identity' : role === 'Developer' ? 'lab' : 'ops');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Identity Desk State
  const [requests, setRequests] = useState([]);
  
  // Mess Ops State
  const [dragActive, setDragActive] = useState(false);
  const [localParsedData, setLocalParsedData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  
  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  const adminTabs = [
    { id: 'identity', label: 'Identity Desk', icon: Users, roles: ['Admin'] },
    { id: 'ops', label: 'Mess Ops', icon: Zap, roles: ['Admin', 'Developer', 'Coordinator'] },
    { id: 'lab', label: 'Dev Lab', icon: FlaskConical, roles: ['Developer', 'Admin'] },
  ].filter(t => t.roles.includes(role));

  useEffect(() => {
    if (activeTab === 'identity' && role === 'Admin') {
      fetchRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    // Listen for real-time coordinator requests from App.jsx
    if (role === 'Admin') {
      window.addEventListener('new-coordinator-request', fetchRequests);
      return () => window.removeEventListener('new-coordinator-request', fetchRequests);
    }
  }, [role]);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await getPendingRequests();
    if (res.success) setRequests(res.data);
    setLoading(false);
  };

  const handleRequestAction = async (requestId, email, status) => {
    const res = await updateRequestStatus(requestId, status, email, status === 'approved' ? 'Coordinator' : 'None');
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setSuccess(`Request ${status} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const processFile = async (file) => {
    setLoading(true);
    try {
      const parsedData = await parseExcelMenu(file);
      setLocalParsedData(parsedData);
      setMenuData(parsedData);
      setSuccess("Menu parsed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Parsing failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishMenu = async () => {
    if (!localParsedData || !user?.email || !hostel) return;
    setPublishing(true);
    const category = hostel.startsWith('MH') ? 'MH' : (hostel.startsWith('LH') ? 'LH' : hostel);
    const res = await uploadMessMenu(category, messType, localParsedData, user.email);
    if (res.success) {
      setSuccess("Cloud Publish Success!");
      setSyncStatus({ syncStatus: 'success', lastSyncedAt: new Date().toISOString() });
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error);
    }
    setPublishing(false);
  };

  const handleBroadcast = async () => {
    if (!announcementTitle || !announcementBody) return;
    setIsBroadcasting(true);
    const res = await createAnnouncement(announcementTitle, announcementBody, user?.email);
    if (res.success) {
      setSuccess("Broadcast sent to all students!");
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error);
    }
    setIsBroadcasting(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className="p-2 rounded-xl bg-background border border-border/40 shadow-xl"
              style={{ color: accentHex }}
            >
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase">Admin Center</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground ml-1">Precision governance for the Messit ecosystem.</p>
        </div>
        
        {/* Role Badge */}
        <div 
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border bg-background/50 backdrop-blur-md shadow-xl"
          style={{ borderColor: `${accentHex}30` }}
        >
          <ShieldCheck size={18} style={{ color: accentHex }} />
          <span className="text-xs font-black tracking-widest" style={{ color: accentHex }}>{role.toUpperCase()} LEVEL ACCESS</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1.5 bg-muted/10 backdrop-blur-xl rounded-[2rem] border border-border/20 mb-6 sm:mb-12 gap-1 overflow-x-auto no-scrollbar pointer-events-auto">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] sm:min-w-[130px] flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-[1.5rem] sm:rounded-[1.8rem] font-bold text-[10px] sm:text-sm transition-all duration-300 relative ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
              }`}
            >
              <Icon size={16} className={`${isActive ? 'animate-pulse' : ''} sm:w-[18px] sm:h-[18px]`} />
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="admin-tab-pill"
                  className="absolute inset-0 bg-background rounded-[1.5rem] sm:rounded-[1.8rem] -z-10 shadow-xl border border-border/60"
                  style={{ borderColor: `${accentHex}30` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.4, ease: "circOut" }}
          className="space-y-6 sm:space-y-8"
        >
          
          {/* Messages Overlay */}
          {(success || error) && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300 border ${
              success ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {success ? <Check size={18} /> : <AlertCircle size={18} />}
              <p className="text-xs font-bold uppercase tracking-widest">{success || error}</p>
            </div>
          )}

          {/* IDENTITY DESK (ADMIN) */}
          {activeTab === 'identity' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">Pending Petitions</h3>
                  <div className="h-px flex-1 mx-6 bg-border/20" />
                  <span className="text-[10px] font-black text-primary/60">{requests.length} REQUESTS</span>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center gap-4 text-muted-foreground/20">
                    <RefreshCw size={48} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Vault...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-border/10 bg-muted/5 flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/20">
                      <ShieldCheck size={32} />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Protocol Secure. No Pending Requests.</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {requests.map((req, i) => (
                      <motion.div 
                        key={req.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 rounded-[2.2rem] bg-secondary/10 border border-border/40 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-secondary/20 transition-all group relative overflow-hidden backdrop-blur-sm"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary/60 transition-all" />
                        
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                          <div className="w-14 h-14 rounded-2xl bg-background border border-border/40 flex items-center justify-center text-primary shadow-2xl group-hover:scale-105 transition-transform duration-500 relative">
                             <Users size={24} />
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-lg tracking-tight truncate group-hover:text-primary transition-colors">{req.user_name}</h4>
                            <p className="text-xs text-muted-foreground font-medium truncate mb-2">{req.user_email}</p>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-full bg-primary/10 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20 shadow-sm">
                                {req.hostel}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                {new Date(req.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <button 
                            onClick={() => handleRequestAction(req.id, req.user_email, 'rejected')}
                            className="flex-1 sm:flex-none p-4 rounded-2xl bg-muted/20 border border-border/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95 flex items-center justify-center"
                            title="Reject"
                          >
                            <UserX size={20} />
                          </button>
                          <button 
                            onClick={() => handleRequestAction(req.id, req.user_email, 'approved')}
                            className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-foreground text-background font-black text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
                          >
                            APPROVE <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MESS OPS (COORD / ADMIN / DEV) */}
          {activeTab === 'ops' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Cloud Sync Tool */}
              <Card className="border-none shadow-xl border-border/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Cloud className="text-primary" size={22} />
                    <span>Cloud Sync Protocol</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dropzone Logic Integrated */}
                  <div className="relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                      accept=".xlsx"
                      onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
                    />
                    <div 
                      className="border-2 border-dashed border-border/40 rounded-[2rem] p-10 text-center bg-muted/5 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500"
                    >
                      <Database size={40} className="mx-auto text-muted-foreground/30 mb-4 group-hover:text-primary group-hover:scale-110 transition-all" />
                      <p className="text-sm font-bold">Deploy xlsx Menu</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Hostel Authority Level: {hostel?.substring(0, 2) || 'GLOBAL'}</p>
                    </div>
                  </div>

                  {localParsedData && (
                    <Button 
                      onClick={handlePublishMenu}
                      disabled={publishing}
                      className="w-full h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                    >
                      {publishing ? <RefreshCw className="animate-spin" /> : <>PUBLISH LIVE <Send size={16} /></>}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Announcement Composer */}
              <Card className="border-none shadow-xl border-border/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Megaphone className="text-orange-500" size={22} />
                    <span>Elite Broadcast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input 
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="Headline e.g. Menu Update"
                    className="rounded-2xl"
                  />
                  <div className="relative">
                    <textarea 
                      value={announcementBody}
                      onChange={(e) => setAnnouncementBody(e.target.value)}
                      placeholder="Write your broadcast message here..."
                      className="w-full min-h-[120px] bg-muted/20 border border-border/40 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting || !announcementTitle || !announcementBody}
                    className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest shadow-xl shadow-orange-500/10"
                  >
                    {isBroadcasting ? <RefreshCw className="animate-spin" /> : "BROADCAST TO ALL"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DEV LAB (DEV / ADMIN) */}
          {activeTab === 'lab' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Notification Lab */}
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="text-yellow-500" size={22} />
                    <span>Notification Lab</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-4 rounded-2xl bg-secondary/20 border border-border/40 space-y-4 text-center">
                      <BellRing size={40} className="mx-auto text-yellow-500/40" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Alert Simulator</p>
                      <Button 
                        variant="outline" 
                        onClick={() => sendNotification('Test Meal', 'stud')}
                        className="w-full rounded-xl"
                      >
                        Fire 'Stud' Alert
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => sendNotification('Test Meal', 'princess')}
                        className="w-full rounded-xl"
                      >
                        Fire 'Princess' Alert
                      </Button>
                   </div>
                </CardContent>
              </Card>

              {/* System State */}
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Settings2 className="text-blue-500" size={22} />
                    <span>System Heartbeat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        <span>Database Status</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> ONLINE</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        <span>Sync Latency</span>
                        <span>42ms</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-blue-500">
                        <span>Role Entropy</span>
                        <span>{role === 'Developer' ? '0.00x' : '1.00x'}</span>
                      </div>
                   </div>
                   <Button variant="ghost" className="w-full text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.4em]">Dump Store State</Button>
                </CardContent>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
      
      {/* Footer Branding */}
      <div className="mt-16 pt-8 border-t border-border/10 text-center flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/40 shadow-sm">
          <History size={12} className="text-muted-foreground/40" />
          <span className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">Elite Maintenance Protocol v1.4</span>
        </div>
      </div>
    </div>
  );
}
