import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { ACCENT_COLORS } from '../constants/colors';
import { SendIcon } from '../components/ui/icons/SendIcon';
import { toPng } from 'html-to-image';
import { format, getDay, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday as isDateToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trash2 } from 'lucide-react';
import { ChevronLeftIcon } from '../components/ui/icons/ChevronLeft';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRight';
import { CoffeeIcon } from '../components/ui/icons/CoffeeIcon';
import { LunchIcon } from '../components/ui/icons/LunchIcon';
import { DinnerIcon } from '../components/ui/icons/DinnerIcon';
import { SnacksIcon } from '../components/ui/icons/SnacksIcon';
import { CalendarDaysIcon } from '../components/ui/icons/CalendarDaysIcon';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = [
  { key: 'breakfast', label: 'Breakfast', time: '7:15 - 9:00 AM', icon: CoffeeIcon, startMin: 435, endMin: 540 },
  { key: 'lunch', label: 'Lunch', time: '12:30 - 2:15 PM', icon: LunchIcon, startMin: 750, endMin: 855 },
  { key: 'snacks', label: 'Snacks', time: '4:45 - 6:15 PM', icon: SnacksIcon, startMin: 1005, endMin: 1095 },
  { key: 'dinner', label: 'Dinner', time: '7:15 - 9:00 PM', icon: DinnerIcon, startMin: 1155, endMin: 1260 },
];

import { Megaphone, X, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getAnnouncements } from '../lib/supabase';

export default function Dashboard() {
  const { 
    menuData, setMenuData, accentColor, theme, user,
    cloudMenuInfo, syncStatus, isSyncing 
  } = useStore();
  const [view, setView] = useState('day'); // 'day' | 'week' | 'month'
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  
  const fetchAnnouncements = () => {
    getAnnouncements().then(res => {
      if (res.success) setAnnouncements(res.data);
    });
  };

  useEffect(() => {
    fetchAnnouncements();

    // Listen for real-time announcement events from App.jsx
    window.addEventListener('new-announcement', fetchAnnouncements);
    return () => window.removeEventListener('new-announcement', fetchAnnouncements);
  }, []);
  
  const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const accentHex = ACCENT_COLORS[accentColor]?.[effectiveTheme] || ACCENT_COLORS.Blue[effectiveTheme];

  // Create state for the currently selected date, and the base week date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [monthOffset, setMonthOffset] = useState(0); // Month view offset

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedMeals = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()).getTime();
    
    const isToday = todayStart === selectedStart;
    const isPast = selectedStart < todayStart;

    if (!isToday) {
       return MEALS.map(m => ({ ...m, status: isPast ? 'Done' : 'Upcoming' }));
    }

    const currentMins = today.getHours() * 60 + today.getMinutes();
    const mealsWithStatus = MEALS.map(meal => {
      let status = 'Upcoming';
      if (currentMins > meal.endMin) status = 'Done';
      else if (currentMins >= meal.startMin && currentMins <= meal.endMin) status = 'Ongoing';
      return { ...meal, status };
    });

    const statusWeight = { 'Ongoing': 0, 'Upcoming': 1, 'Done': 2 };
    
    return mealsWithStatus.sort((a, b) => {
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      return a.startMin - b.startMin;
    });
  }, [selectedDate, tick]);

  const clearMenu = () => {
    if(confirm("Are you sure you want to clear your menu schedule?")) {
      setMenuData(null);
    }
  };

  const getWeekDays = (offset) => {
    const today = new Date();
    // Move to the start of the current week (Monday or Sunday? Let's use Monday as start to match screenshot if possible, or standard startOfWeek)
    const baseDate = addDays(today, offset * 7);
    const startOfCurrentWeek = startOfWeek(baseDate, { weekStartsOn: 1 }); // Starts on Monday
    
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  };

  const weekDays = getWeekDays(weekOffset);

  if (!menuData) return null;

  const selectedDayData = menuData[selectedDate.getDate()] || { breakfast: [], lunch: [], snacks: [], dinner: [] };

  const MealCard = ({ meal }) => {
    const items = selectedDayData[meal.key];
    const MealIcon = meal.icon;
    const sendIconRef = useRef(null);
    const cardRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const handleShare = async (e) => {
      e.stopPropagation();
      if (sendIconRef.current) {
        sendIconRef.current.startAnimation();
      }
      
      try {
        setIsCapturing(true);
        
        // Brief delay to ensure UI updates if needed
        await new Promise(resolve => setTimeout(resolve, 100));

        if (cardRef.current) {
          const dataUrl = await toPng(cardRef.current, {
            backgroundColor: effectiveTheme === 'dark' ? '#111111' : '#ffffff', // Elite Theme Sync
            style: { borderRadius: '0' },
            cacheBust: true,
            filter: (node) => {
              const exclusionClasses = ['capture-exclude'];
              return !exclusionClasses.some(cls => node.classList?.contains(cls));
            }
          });

          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `Messit-${meal.label}.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Messit - ${meal.label}`,
              text: `Check out today's ${meal.label} menu with Messit!`,
              url: 'https://messit.nfks.co.in'
            });
          } else if (navigator.share) {
             // Fallback to text if file sharing is not supported
             await navigator.share({
                title: `Messit - ${meal.label}`,
                text: `Check out today's ${meal.label} menu with Messit! \n\nMeal Items: ${items ? items.join(', ') : 'No menu found.'}`,
                url: 'https://messit.nfks.co.in'
              });
          }
        }
      } catch (error) {
        console.error('Sharing failed:', error);
      } finally {
        setIsCapturing(false);
      }
    };

    return (
      <div ref={cardRef} className="relative h-full">
        {isCapturing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md rounded-2xl animate-in fade-in duration-300 capture-exclude">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <SendIcon size={44} strokeWidth={1.4} className="text-foreground" isAnimated={true} />
              </div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-foreground/60">Capturing Snapshot</p>
            </div>
          </div>
        )}
        <Card className="h-full flex flex-col group">
          <CardHeader 
            className={`pb-3 border-b transition-colors ${meal.status === 'Ongoing' ? 'border-primary/20' : 'border-border/50 group-hover:bg-muted/10'}`}
            style={{ backgroundColor: meal.status === 'Ongoing' ? `${accentHex}15` : undefined }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div 
                  className={`p-2.5 rounded-xl shadow-sm ${meal.status === 'Done' ? 'bg-muted text-muted-foreground' : 'text-primary-foreground'}`}
                  style={{ backgroundColor: meal.status !== 'Done' ? `${accentHex}40` : undefined }}
                >
                  <MealIcon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {meal.label}
                    <span 
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${
                        meal.status === 'Ongoing' ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        backgroundColor: meal.status === 'Ongoing' ? accentHex : meal.status === 'Upcoming' ? `${accentHex}30` : undefined,
                        color: meal.status === 'Done' ? undefined : (effectiveTheme === 'light' ? '#000' : '#fff') 
                      }}
                    >
                      {meal.status}
                    </span>
                  </CardTitle>
                  <p 
                    className={`text-xs mt-0.5 font-semibold tracking-wide ${meal.status === 'Done' ? 'text-muted-foreground' : ''}`}
                    style={{ color: meal.status !== 'Done' ? accentHex : undefined }}
                  >
                    {meal.time}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleShare}
                disabled={isCapturing}
                className="p-2 rounded-xl text-muted-foreground/30 hover:text-foreground transition-all duration-300 disabled:opacity-50 capture-exclude"
              >
                <SendIcon ref={sendIconRef} size={24} strokeWidth={1.8} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-grow">
            {items && items.length > 0 ? (
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span 
                      className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0 animate-in zoom-in-0 duration-300" 
                      style={{ backgroundColor: accentHex }}
                    />
                    <span className="leading-relaxed font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground italic my-8 opacity-40">
                No menu found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Month View calculations
  const baseMonthDate = addMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(baseMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Your Schedule</h1>
          <p className="text-muted-foreground">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
        </div>

        {/* Global Announcements Section */}
        <AnimatePresence>
          {showAnnouncements && announcements.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full lg:w-3/5 border rounded-3xl p-4 overflow-hidden relative group shadow-2xl transition-colors duration-500"
              style={{ 
                backgroundColor: `${accentHex}10`, 
                borderColor: `${accentHex}30` 
              }}
            >
              <button 
                onClick={() => setShowAnnouncements(false)}
                className="absolute top-2 right-2 p-1.5 rounded-full transition-all z-20"
                style={{ color: `${accentHex}80` }}
                onMouseEnter={(e) => e.target.style.color = accentHex}
                onMouseLeave={(e) => e.target.style.color = `${accentHex}80`}
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-4">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border"
                  style={{ backgroundColor: `${accentHex}20`, color: accentHex, borderColor: `${accentHex}30` }}
                >
                  <Megaphone size={20} className="animate-bounce" />
                </div>
                <div className="min-w-0 pr-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.25em] mb-1.5" style={{ color: accentHex }}>Latest Broadcast</h4>
                   {announcements[0] && (
                     <div className="animate-in fade-in slide-in-from-right-2 duration-500">
                       <p className="text-sm font-bold text-foreground mb-0.5 truncate">{announcements[0].title}</p>
                       <p className="text-xs text-muted-foreground line-clamp-1">{announcements[0].content}</p>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-secondary/50 border border-border p-1 rounded-xl flex items-center shadow-sm">
              <div className="px-2">
                <CalendarDaysIcon size={18} className="text-muted-foreground/70" />
              </div>
              {['day', 'week', 'month'].map((v) => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all outline-none focus:outline-none focus:ring-0 ${
                    view === v 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            
            <Button variant="outline" size="icon" onClick={clearMenu} title="Clear Menu">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cloud Sync Status (Now managed via Notification Center) */}

      {view === 'day' && (
        <>
          {/* Custom Day Selector */}
          <div className="flex justify-center items-center gap-2 mb-8 select-none">
            <button 
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all group"
            >
              <ChevronLeftIcon size={20} className="w-5 h-5" />
            </button>
            
            <div className="flex-grow grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map(date => {
                const isSelected = isSameDay(date, selectedDate);
                const isDateTodayBool = isDateToday(date);
                
                return (
                  <div 
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center justify-center py-2 sm:py-3 cursor-pointer transition-all duration-300 relative overflow-hidden group/day ${
                      isSelected
                        ? "bg-secondary/60 rounded-2xl shadow-inner border border-border/40"
                        : "bg-transparent hover:bg-muted/10 rounded-2xl"
                    }`}
                  >
                    {isSelected && (
                      <motion.div 
                        layoutId="active-day-marker"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className={`text-[8px] sm:text-[10px] font-black tracking-widest uppercase mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground/60 group-hover/day:text-muted-foreground'}`}>
                      {format(date, 'EEE').toUpperCase()}
                    </span>
                    <span className={`text-base sm:text-xl font-bold ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover/day:text-foreground'}`}>
                      {format(date, 'd')}
                    </span>
                  </div>
                )
              })}
            </div>

            <button 
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all group"
            >
              <ChevronRightIcon size={20} className="w-5 h-5" />
            </button>
          </div>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedMeals.map((meal) => (
              <MealCard key={`${meal.key}-${selectedDate.toISOString()}`} meal={meal} />
            ))}
          </div>
        </>
      )}

      {view === 'week' && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-notion">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Day</th>
                <th className="px-6 py-4 font-medium">Breakfast</th>
                <th className="px-6 py-4 font-medium">Lunch</th>
                <th className="px-6 py-4 font-medium">Snacks</th>
                <th className="px-6 py-4 font-medium">Dinner</th>
              </tr>
             </thead>
            <tbody>
              {weekDays.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const dMenu = menuData[date.getDate()] || { breakfast: [], lunch: [], snacks: [], dinner: [] };
                
                return (
                  <tr key={date.toISOString()} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2 text-foreground">
                        {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <div className="flex flex-col">
                          <span className="font-bold">{format(date, 'd')}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{format(date, 'EEE')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-3 opacity-90">{dMenu.breakfast.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-3 opacity-90">{dMenu.lunch.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-3 opacity-90">{dMenu.snacks.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="line-clamp-3 opacity-90">{dMenu.dinner.join(', ')}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'month' && (
        <div className="bg-card rounded-2xl border border-border shadow-notion overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border bg-secondary/30">
            <button 
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all group"
            >
              <ChevronLeftIcon size={20} className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">{format(baseMonthDate, 'MMMM yyyy')}</h2>
            <button 
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted text-muted-foreground transition-all group"
            >
              <ChevronRightIcon size={20} className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[100px] sm:auto-rows-[120px] bg-border gap-px">
            {calendarDays.map((date) => {
              const isCurrentMonth = isSameMonth(date, baseMonthDate);
              const isDateTodayBool = isDateToday(date);
              const isSelected = isSameDay(date, selectedDate);
              const hasMenu = menuData && menuData[date.getDate()] && (menuData[date.getDate()].breakfast.length > 0 || menuData[date.getDate()].lunch.length > 0);

              return (
                <div 
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setView('day');
                    // Reset week offset to ensure the day view jumps to this date's week accurately
                    // Since weekOffset is relative to today, we need to calculate it.
                    // For simplicity, just switching to day view works, but sliding strip weekOffset might need sync.
                    // A simple approximation:
                    const diffDays = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    setWeekOffset(Math.round(diffDays / 7));
                  }}
                  className={`relative p-2 bg-card hover:bg-secondary/40 transition-colors cursor-pointer flex flex-col ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      isDateTodayBool ? 'bg-primary text-primary-foreground' : isSelected ? 'ring-2 ring-primary text-foreground' : 'text-muted-foreground'
                    }`}>
                      {format(date, 'd')}
                    </span>
                  </div>
                  
                  {hasMenu && isCurrentMonth && (
                    <div className="mt-auto pointer-events-none">
                      <div className="flex gap-1 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/60"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60"></span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 block">Menu Attached</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
