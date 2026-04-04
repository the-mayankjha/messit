import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AlertCircle, Check, RefreshCw, Cloud, Database, 
  Sparkles, ShieldCheck, ChevronRight, UserCheck, 
  UserX, Megaphone, FlaskConical, Send, History,
  LayoutDashboard, Users, Zap, BellRing, Settings2,
  Crown, Code2, Handshake, AlertTriangle, Trash2, X,
  ShieldAlert, ShieldOff, ChevronDown, Mail, Building2, Hash, Utensils
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
  updateAnnouncement, deleteAnnouncement,
  getAnnouncements, getAllUsers,
  supabase, getPrivilegedUsers, revokeUserRole
} from '../lib/supabase';
import { parseExcelMenu } from '../utils/excelParser';
import { requestNotificationPermission, sendNotification } from '../utils/notifier';
import { SlidersHorizontalIcon } from '../components/ui/icons/SlidersHorizontalIcon';

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
  const [privilegedUsers, setPrivilegedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [expandedUserEmail, setExpandedUserEmail] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState('All');
  const [messFilter, setMessFilter] = useState('All');
  const [isUserFiltersOpen, setIsUserFiltersOpen] = useState(false);
  const [warnTarget, setWarnTarget] = useState(null);   // { email, name, role }
  const [revokeTarget, setRevokeTarget] = useState(null); // { email, name, role }
  const userFilterIconRef = useRef(null);
  
  // Mess Ops State
  const [dragActive, setDragActive] = useState(false);
  const [localParsedData, setLocalParsedData] = useState(null);
  const [publishing, setPublishing] = useState(false);
  
  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null); // { id, title, content }

  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];
  const hostelFilters = ['All', 'MH', 'LH'];
  const messFilters = ['All', 'Veg', 'Non-Veg', 'Special'];
  const hasActiveUserFilters = hostelFilter !== 'All' || messFilter !== 'All';

  const adminTabs = [
    { id: 'identity', label: 'Identity Desk', icon: Users, roles: ['Admin'] },
    { id: 'ops', label: 'Mess Ops', icon: Zap, roles: ['Admin', 'Developer', 'Coordinator'] },
    { id: 'lab', label: 'Dev Lab', icon: FlaskConical, roles: ['Developer', 'Admin'] },
  ].filter(t => t.roles.includes(role));

  useEffect(() => {
    if (activeTab === 'identity' && role === 'Admin') {
      fetchRequests();
      fetchRoster();
    }
    if (activeTab === 'ops') {
      fetchAnnouncements();
    }
    if (activeTab === 'lab' && ['Developer', 'Admin'].includes(role)) {
      fetchAllProfiles();
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

  const fetchRoster = async () => {
    setRosterLoading(true);
    const res = await getPrivilegedUsers();
    if (res.success) setPrivilegedUsers(res.data);
    setRosterLoading(false);
  };

  const fetchAllProfiles = async () => {
    setAllUsersLoading(true);
    const res = await getAllUsers();
    if (res.success) setAllUsers(res.data);
    setAllUsersLoading(false);
  };

  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();

    return allUsers.filter((profile) => {
      const name = (profile.name || '').toLowerCase();
      const email = (profile.email || '').toLowerCase();
      const hostel = profile.hostel || '';
      const messType = profile.mess_type || '';

      const matchesQuery =
        !query ||
        name.includes(query) ||
        email.includes(query) ||
        hostel.toLowerCase().includes(query) ||
        messType.toLowerCase().includes(query);

      const matchesHostel =
        hostelFilter === 'All' ||
        (hostelFilter === 'MH' && hostel.startsWith('MH')) ||
        (hostelFilter === 'LH' && hostel.startsWith('LH'));

      const matchesMess =
        messFilter === 'All' ||
        messType === messFilter;

      return matchesQuery && matchesHostel && matchesMess;
    });
  }, [allUsers, userSearchQuery, hostelFilter, messFilter]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    const res = await revokeUserRole(revokeTarget.email);
    if (res.success) {
      setPrivilegedUsers(prev => prev.filter(u => u.email !== revokeTarget.email));
      setSuccess(`${revokeTarget.name}'s access has been revoked.`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError('Failed to revoke access.');
      setTimeout(() => setError(null), 3000);
    }
    setRevokeTarget(null);
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
    
    let res;
    if (editingAnnouncement) {
      res = await updateAnnouncement(editingAnnouncement.id, announcementTitle, announcementBody);
    } else {
      res = await createAnnouncement(announcementTitle, announcementBody, user?.email);
    }

    if (res.success) {
      setSuccess(editingAnnouncement ? "Broadcast updated!" : "Broadcast sent to all students!");
      // Optimistic update: immediately reflect change in the local list
      if (editingAnnouncement) {
        setAllAnnouncements(prev => prev.map(ann =>
          ann.id === editingAnnouncement.id
            ? { ...ann, title: announcementTitle, content: announcementBody }
            : ann
        ));
      } else if (res.data) {
        setAllAnnouncements(prev => [res.data, ...prev]);
      }
      setAnnouncementTitle('');
      setAnnouncementBody('');
      setEditingAnnouncement(null);
      fetchAnnouncements(); // Sync from server for guaranteed consistency
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error);
    }
    setIsBroadcasting(false);
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    const res = await getAnnouncements();
    if (res.success) setAllAnnouncements(res.data);
    setAnnouncementsLoading(false);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this broadcast?")) return;
    // Optimistic: remove from list immediately
    setAllAnnouncements(prev => prev.filter(ann => ann.id !== id));
    const res = await deleteAnnouncement(id);
    if (res.success) {
      setSuccess("Broadcast deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.error);
      fetchAnnouncements(); // Revert on failure
    }
  };

  const startEditing = (ann) => {
    setEditingAnnouncement(ann);
    setAnnouncementTitle(ann.title);
    setAnnouncementBody(ann.content);
    // Scroll to the composer
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="flex p-1.5 bg-muted/10 backdrop-blur-xl rounded-[2rem] border border-border/20 mb-6 sm:mb-12 gap-1 overflow-hidden pointer-events-auto">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-[1.5rem] sm:rounded-[1.8rem] font-bold text-[10px] sm:text-xs transition-all duration-300 relative ${
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
            <div className="grid grid-cols-1 gap-10">

              {/* SECTION 1 — Pending Petitions */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 whitespace-nowrap">Pending Petitions</h3>
                  <div className="h-px flex-1 bg-border/20" />
                  <span className="text-[10px] font-black text-primary/60 whitespace-nowrap">{requests.length} REQUESTS</span>
                </div>

                {loading ? (
                  <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground/20">
                    <RefreshCw size={40} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Vault...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-10 text-center rounded-[2rem] border-2 border-dashed border-border/10 bg-muted/5 flex flex-col items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/20">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">Protocol Secure. No Pending Requests.</p>
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

              {/* SECTION 2 — Active Roster */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 whitespace-nowrap">Active Roster</h3>
                  <div className="h-px flex-1 bg-border/20" />
                  <span className="text-[10px] font-black text-primary/60 whitespace-nowrap">{privilegedUsers.length} MEMBERS</span>
                </div>

                {rosterLoading ? (
                  <div className="py-12 flex flex-col items-center gap-4 text-muted-foreground/20">
                    <RefreshCw size={36} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading Roster...</p>
                  </div>
                ) : privilegedUsers.length === 0 ? (
                  <div className="py-10 text-center rounded-[2rem] border-2 border-dashed border-border/10 bg-muted/5">
                    <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">No privileged users found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {privilegedUsers.map((u, i) => {
                      const roleConfig = {
                        Admin:       { icon: Crown,      color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/20'   },
                        Developer:   { icon: Code2,      color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20'    },
                        Coordinator: { icon: Handshake,  color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                      }[u.role] || { icon: Users, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/20' };
                      const RoleIcon = roleConfig.icon;
                      const isSelf = u.email === user?.email;

                      return (
                        <motion.div
                          key={u.email}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-4 p-4 sm:p-5 rounded-[1.8rem] bg-secondary/10 border border-border/30 hover:bg-secondary/20 transition-all group relative overflow-hidden"
                        >
                          {/* Role stripe */}
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-[1.8rem] ${roleConfig.color.replace('text-', 'bg-')}/40 group-hover:${roleConfig.color.replace('text-', 'bg-')} transition-all`} />

                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-xl ${roleConfig.bg} border ${roleConfig.border} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                            <RoleIcon size={20} className={roleConfig.color} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm truncate">{u.name || 'Unknown'}</span>
                              {isSelf && (
                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">YOU</span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 truncate">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                                {u.role}
                              </span>
                              {u.hostel && (
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase">{u.hostel}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions — hidden for self */}
                          {!isSelf && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setWarnTarget({ email: u.email, name: u.name || u.email, role: u.role })}
                                title="Issue Warning"
                                className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all active:scale-90"
                              >
                                <ShieldAlert size={16} />
                              </button>
                              <button
                                onClick={() => setRevokeTarget({ email: u.email, name: u.name || u.email, role: u.role })}
                                title="Revoke Access"
                                className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all active:scale-90"
                              >
                                <ShieldOff size={16} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* WARN MODAL */}
              <AnimatePresence>
                {warnTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                    onClick={() => setWarnTarget(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.92, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.92, y: 20 }}
                      onClick={e => e.stopPropagation()}
                      className="w-full max-w-sm bg-card border border-border/60 rounded-[2rem] p-8 shadow-2xl space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <AlertTriangle size={22} className="text-amber-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-base tracking-tight">Issue Warning</h4>
                          <p className="text-xs text-muted-foreground">{warnTarget.name}</p>
                        </div>
                        <button onClick={() => setWarnTarget(null)} className="ml-auto p-2 rounded-xl hover:bg-muted/30 text-muted-foreground transition-all">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
                          A formal warning will be recorded against <span className="font-black">{warnTarget.name}</span>. Their access isn't revoked yet — this serves as an official notice.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setWarnTarget(null)}
                          className="flex-1 py-3 rounded-2xl border border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted/20 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setSuccess(`Warning issued to ${warnTarget.name}.`);
                            setTimeout(() => setSuccess(null), 3000);
                            setWarnTarget(null);
                          }}
                          className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-xl shadow-amber-500/20"
                        >
                          Issue Warning
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* REVOKE MODAL */}
              <AnimatePresence>
                {revokeTarget && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                    onClick={() => setRevokeTarget(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.92, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.92, y: 20 }}
                      onClick={e => e.stopPropagation()}
                      className="w-full max-w-sm bg-card border border-red-500/20 rounded-[2rem] p-8 shadow-2xl space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <ShieldOff size={22} className="text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-base tracking-tight">Revoke Access</h4>
                          <p className="text-xs text-muted-foreground">{revokeTarget.name} &middot; {revokeTarget.role}</p>
                        </div>
                        <button onClick={() => setRevokeTarget(null)} className="ml-auto p-2 rounded-xl hover:bg-muted/30 text-muted-foreground transition-all">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                        <p className="text-xs text-red-400/80 font-medium leading-relaxed">
                          This will permanently remove <span className="font-black">{revokeTarget.name}</span>'s <span className="font-black">{revokeTarget.role}</span> role and reset them to a standard user. This action cannot be undone automatically.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setRevokeTarget(null)}
                          className="flex-1 py-3 rounded-2xl border border-border/40 text-muted-foreground text-xs font-bold uppercase tracking-widest hover:bg-muted/20 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRevoke}
                          className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Megaphone size={22} style={{ color: accentHex }} />
                      <span>{editingAnnouncement ? 'Edit Protocol' : 'Elite Broadcast'}</span>
                    </div>
                    {editingAnnouncement && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingAnnouncement(null);
                          setAnnouncementTitle('');
                          setAnnouncementBody('');
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-red-500"
                      >
                        Cancel Edit
                      </Button>
                    )}
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
                      className="w-full min-h-[120px] border border-border/40 rounded-2xl p-4 text-sm font-medium focus:outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground/40 bg-background"
                      style={{ 
                        colorScheme: effectiveTheme,
                        borderColor: undefined
                      }}
                      onFocus={e => e.target.style.borderColor = `${accentHex}60`}
                      onBlur={e => e.target.style.borderColor = ''}
                    />
                  </div>
                  <Button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting || !announcementTitle || !announcementBody}
                    className="w-full h-14 rounded-2xl text-white font-black tracking-widest"
                    style={{ 
                      backgroundColor: accentHex,
                      boxShadow: `0 8px 24px ${accentHex}25`
                    }}
                  >
                    {isBroadcasting ? <RefreshCw className="animate-spin" /> : editingAnnouncement ? "UPDATE BROADCAST" : "BROADCAST TO ALL"}
                  </Button>
                </CardContent>
              </Card>

              {/* Broadcast Archive / Management */}
              <div className="lg:col-span-2 space-y-4 mt-6">
                <div className="flex items-center gap-4 px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 whitespace-nowrap">Broadcast Archive</h3>
                  <div className="h-px flex-1 bg-border/20" />
                  <span 
                    className="text-[10px] font-black whitespace-nowrap"
                    style={{ color: `${accentHex}90` }}
                  >{allAnnouncements.length} BROADCASTS</span>
                </div>

                {announcementsLoading ? (
                  <div className="py-12 flex flex-col items-center gap-4 text-muted-foreground/20 text-center">
                    <RefreshCw size={36} className="animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Archive...</p>
                  </div>
                ) : allAnnouncements.length === 0 ? (
                  <div className="py-10 text-center rounded-[2rem] border-2 border-dashed border-border/10 bg-muted/5 flex flex-col items-center gap-3">
                    <Megaphone size={24} className="text-muted-foreground/20" />
                    <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">Archive Empty. No Protocols Logged.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {allAnnouncements.map((ann, i) => {
                      const canManage = role === 'Admin' || (role === 'Coordinator' && ann.created_by === user?.email);
                      const isOwn = ann.created_by === user?.email;

                      return (
                        <motion.div 
                          key={ann.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-6 rounded-[2rem] bg-secondary/10 border border-border/40 hover:bg-secondary/20 transition-all group pointer-events-auto"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-bold text-base truncate pr-2">{ann.title}</h4>
                                {role === 'Admin' && (
                                  <span 
                                    className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border`}
                                    style={isOwn
                                      ? { backgroundColor: `${accentHex}15`, color: accentHex, borderColor: `${accentHex}30` }
                                      : { backgroundColor: 'rgba(128,128,128,0.1)', color: 'rgba(128,128,128,0.7)', borderColor: 'rgba(128,128,128,0.2)' }
                                    }
                                  >
                                    BY: {ann.created_by?.split('@')[0]}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                  {new Date(ann.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                            
                            {canManage && (
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                  onClick={() => startEditing(ann)}
                                  className="p-2.5 rounded-xl bg-background border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all active:scale-90"
                                  title="Edit Broadcast"
                                >
                                  <Settings2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="p-2.5 rounded-xl bg-background border border-border/40 text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition-all active:scale-90"
                                  title="Delete Broadcast"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
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

              <div className="sm:col-span-2">
                <Card className="border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Users size={22} style={{ color: accentHex }} />
                        <span>User Section</span>
                      </div>
                      <span
                        className="text-[10px] font-black uppercase tracking-[0.3em]"
                        style={{ color: `${accentHex}90` }}
                      >
                        {filteredUsers.length} Profiles
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="Search by name, email, hostel or mess..."
                            className="rounded-[1.4rem]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            userFilterIconRef.current?.startAnimation();
                            setIsUserFiltersOpen((prev) => !prev);
                            window.setTimeout(() => {
                              userFilterIconRef.current?.stopAnimation();
                            }, 550);
                          }}
                          className="h-[58px] w-[58px] rounded-[1.2rem] flex items-center justify-center transition-all shadow-sm"
                          style={isUserFiltersOpen || hasActiveUserFilters ? {
                            backgroundColor: `${accentHex}14`,
                            color: accentHex,
                          } : {
                            backgroundColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
                          }}
                          title="Toggle filters"
                        >
                          <SlidersHorizontalIcon ref={userFilterIconRef} size={20} />
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {isUserFiltersOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -6 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -6 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div
                              className="rounded-[1.35rem] border px-3 py-3 sm:px-4 sm:py-3.5"
                              style={{
                                backgroundColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.025)' : `${accentHex}05`,
                                borderColor: `${accentHex}20`,
                              }}
                            >
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)] gap-2 sm:gap-3 items-start">
                                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/55 pt-1.5">
                                    Hostel
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {hostelFilters.map((filter) => {
                                      const active = hostelFilter === filter;
                                      return (
                                        <button
                                          key={filter}
                                          type="button"
                                          onClick={() => setHostelFilter(filter)}
                                          className="min-w-[72px] px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.18em] transition-all"
                                          style={active ? {
                                            backgroundColor: `${accentHex}14`,
                                            borderColor: `${accentHex}35`,
                                            color: accentHex,
                                          } : undefined}
                                        >
                                          {filter}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)] gap-2 sm:gap-3 items-start">
                                  <span className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/55 pt-1.5">
                                    Mess
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {messFilters.map((filter) => {
                                      const active = messFilter === filter;
                                      return (
                                        <button
                                          key={filter}
                                          type="button"
                                          onClick={() => setMessFilter(filter)}
                                          className="min-w-[78px] px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.18em] transition-all"
                                          style={active ? {
                                            backgroundColor: `${accentHex}14`,
                                            borderColor: `${accentHex}35`,
                                            color: accentHex,
                                          } : undefined}
                                        >
                                          {filter}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {allUsersLoading ? (
                      <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground/30">
                        <RefreshCw size={36} className="animate-spin" style={{ color: accentHex }} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading User Graph...</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-12 text-center rounded-[2rem] border-2 border-dashed border-border/10 bg-muted/5">
                        <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest">No users match this search or filter.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredUsers.map((profile, index) => {
                          const isExpanded = expandedUserEmail === profile.email;
                          const isCurrentUser = profile.email === user?.email;
                          const displayName = profile.name || profile.email?.split('@')[0] || 'Unknown User';
                          const initials = displayName
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(part => part[0]?.toUpperCase())
                            .join('') || 'U';

                          return (
                            <motion.div
                              key={profile.email || index}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="rounded-[1.5rem] border border-border/40 bg-secondary/10 overflow-hidden shadow-sm"
                              style={{
                                backgroundColor: isExpanded ? `${accentHex}08` : undefined,
                                borderColor: isExpanded ? `${accentHex}35` : undefined,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => setExpandedUserEmail(isExpanded ? null : profile.email)}
                                className="w-full text-left p-3.5 sm:p-4 transition-all hover:bg-background/40"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className="w-12 h-12 rounded-[1.1rem] border flex items-center justify-center font-black text-sm shadow-md flex-shrink-0"
                                    style={{
                                      backgroundColor: `${accentHex}15`,
                                      borderColor: `${accentHex}30`,
                                      color: accentHex,
                                    }}
                                  >
                                    {profile.picture ? (
                                      <img
                                        src={profile.picture}
                                        alt={displayName}
                                        className="w-full h-full object-cover rounded-2xl"
                                      />
                                    ) : (
                                      initials
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-[15px] truncate">{displayName}</h4>
                                      {isCurrentUser && (
                                        <span
                                          className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                          style={{
                                            backgroundColor: `${accentHex}12`,
                                            color: accentHex,
                                            borderColor: `${accentHex}28`,
                                          }}
                                        >
                                          You
                                        </span>
                                      )}
                                      {profile.role && profile.role !== 'None' && (
                                        <span
                                          className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                          style={{
                                            backgroundColor: `${accentHex}10`,
                                            color: accentHex,
                                            borderColor: `${accentHex}25`,
                                          }}
                                        >
                                          {profile.role}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[13px] text-muted-foreground truncate">{profile.email}</p>
                                  </div>

                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="hidden sm:flex flex-col items-end">
                                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/45">
                                        Tap To {isExpanded ? 'Collapse' : 'Expand'}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground/50 mt-0.5">
                                        {profile.hostel || 'Profile details'}
                                      </span>
                                    </div>
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="w-9 h-9 rounded-[0.95rem] flex items-center justify-center"
                                      style={{
                                        color: accentHex,
                                        backgroundColor: `${accentHex}08`,
                                      }}
                                    >
                                      <ChevronDown size={18} />
                                    </motion.div>
                                  </div>
                                </div>
                              </button>

                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.24, ease: 'easeOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3.5 sm:px-4 pb-4">
                                    <div
                                      className="rounded-[1.2rem] border p-3 sm:p-3.5"
                                      style={{
                                        backgroundColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.03)' : `${accentHex}05`,
                                        borderColor: `${accentHex}20`,
                                      }}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                          {[
                                            { label: 'Email', value: profile.email || 'Not available', icon: Mail },
                                            { label: 'Hostel', value: profile.hostel || 'Not set', icon: Building2 },
                                            { label: 'Room', value: profile.room_number || 'Not set', icon: Hash },
                                            { label: 'Mess', value: profile.mess_type || 'Not set', icon: Utensils },
                                            { label: 'Gender', value: profile.gender || 'Not set', icon: Users },
                                            { label: 'Role', value: profile.role || 'None', icon: ShieldCheck },
                                          ].map(({ label, value, icon: DetailIcon }) => (
                                            <div
                                              key={label}
                                              className="rounded-[0.95rem] border px-3 py-2.5"
                                              style={{
                                                backgroundColor: effectiveTheme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.75)',
                                                borderColor: `${accentHex}18`,
                                              }}
                                            >
                                              <div className="flex items-center gap-2 mb-1">
                                                <DetailIcon size={13} style={{ color: accentHex }} />
                                                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
                                                  {label}
                                                </span>
                                              </div>
                                              <p className="text-[13px] font-semibold break-words leading-snug">{value}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
      
      {/* Footer Branding */}
      <div className="mt-16 pt-8 border-t border-border/10 text-center flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/40 shadow-sm">
          <History size={12} className="text-muted-foreground/40" />
          <span className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">Elite Maintenance Protocol v{__APP_VERSION__}</span>
        </div>
      </div>
    </div>
  );
}
