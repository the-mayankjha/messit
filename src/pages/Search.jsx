import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDaysIcon } from '../components/ui/icons/CalendarDaysIcon';
import { CoffeeIcon } from '../components/ui/icons/CoffeeIcon';
import { LunchIcon } from '../components/ui/icons/LunchIcon';
import { SnacksIcon } from '../components/ui/icons/SnacksIcon';
import { DinnerIcon } from '../components/ui/icons/DinnerIcon';
import { CookingPotIcon } from '../components/ui/icons/CookingPotIcon';

export default function Search() {
  const { menuData } = useStore();
  const [query, setQuery] = useState('');

  // Map dates to day names for the current month
  const dayNameMap = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });
    
    const map = {};
    days.forEach(day => {
      map[format(day, 'd')] = {
        name: format(day, 'eeee').toLowerCase(),
        short: format(day, 'eee').toLowerCase(),
        full: format(day, 'MMMM d')
      };
    });
    return map;
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || !menuData) return [];
    
    const lowQuery = query.toLowerCase().trim();
    const isNumeric = /^\d+$/.test(lowQuery);
    const hits = [];

    Object.entries(menuData).forEach(([date, meals]) => {
      const dayInfo = dayNameMap[date] || {};
      let matchType = null;
      let matchedMealTypes = [];

      // 1. Match by Date (Strict for numeric queries)
      if (date === lowQuery || date === lowQuery.replace(/(st|nd|rd|th)$/, '')) {
        matchType = 'date';
        matchedMealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
      }
      // 2. Match by Day (Strict for day name queries)
      else if (dayInfo.name === lowQuery || dayInfo.short === lowQuery) {
        matchType = 'day';
        matchedMealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
      }
      // 3. Match by Dish (Only if NOT a pure numeric search)
      else if (!isNumeric) {
        const categories = ['breakfast', 'lunch', 'snacks', 'dinner'];
        categories.forEach(cat => {
          const items = meals[cat] || [];
          if (items.some(item => item.toLowerCase().includes(lowQuery))) {
            matchType = 'dish';
            matchedMealTypes.push(cat);
          }
        });
      }

      if (matchType) {
        hits.push({
          date,
          dayInfo,
          meals,
          matchType,
          matchedMealTypes
        });
      }
    });

    // Sort entries by date number
    return hits.sort((a, b) => Number(a.date) - Number(b.date));
  }, [query, menuData, dayNameMap]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16 min-h-screen">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4">Search Menus</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-sm sm:max-w-md mx-auto">
          Find your favorite dishes by searching for a date, day of the week, or dish name. 
        </p>
      </div>

      <div className="relative mb-8 sm:mb-12 group">
        <Input 
          icon={SearchIcon}
          placeholder="Try '15', 'Monday', 'Paneer'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="py-6 sm:py-9 text-base sm:text-lg rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl transition-all focus:ring-accent/20 border-border/40 group-hover:border-accent/30 group-focus-within:border-accent bg-background"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground p-3"
            >
              Clear
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="popLayout text-center">
          {!query ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center opacity-30 select-none"
            >
              <div className="flex justify-center mb-10 overflow-hidden w-full max-w-[320px] mx-auto mask-fade-edges">
                <motion.div 
                  className="flex gap-12 whitespace-nowrap"
                  animate={{ x: [0, -456] }}
                  transition={{ 
                    duration: 15, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                >
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-12 shrink-0">
                      <CalendarDaysIcon size={28} className="text-accent/60 shrink-0" />
                      <CoffeeIcon size={28} className="text-accent/60 shrink-0" />
                      <LunchIcon size={28} className="text-accent/60 shrink-0" />
                      <SnacksIcon size={28} className="text-accent/60 shrink-0" />
                      <DinnerIcon size={28} className="text-accent/60 shrink-0" />
                      <CookingPotIcon size={28} className="text-accent/60 shrink-0" />
                    </div>
                  ))}
                </motion.div>
              </div>
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.5em] uppercase italic opacity-40">The Whole Day in One Scroll</p>
            </motion.div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <motion.div
                key={result.date}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <Card className="overflow-hidden border-border/40 hover:border-accent/40 bg-card/20 hover:bg-card/40 transition-all duration-300 backdrop-blur-sm">
                  <CardHeader className="py-3 sm:py-4 border-b border-border/40 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-sm sm:text-base">
                        {result.date}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-lg capitalize leading-tight">{result.dayInfo.name}</h3>
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{result.dayInfo.full}</p>
                      </div>
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-3 py-1 bg-accent/10 text-accent rounded-full border border-accent/20 whitespace-nowrap">
                      {result.matchType} match
                    </span>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 sm:py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.matchedMealTypes.map((mealType) => {
                        const items = result.meals[mealType];
                        if (!items || items.length === 0) return null;
                        
                        // Highlight matching items
                        const isHit = items.some(i => i.toLowerCase().includes(query.toLowerCase().trim()));
                        const Icon = mealType === 'breakfast' ? CoffeeIcon : mealType === 'lunch' ? LunchIcon : mealType === 'snacks' ? SnacksIcon : DinnerIcon;

                        return (
                          <div 
                            key={mealType} 
                            className={`p-4 rounded-2xl border transition-all ${
                              isHit ? 'bg-accent/5 border-accent/30' : 'bg-muted/10 border-border/20 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                               <Icon size={14} className={isHit ? "text-accent" : "text-muted-foreground"} />
                               <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{mealType}</span>
                            </div>
                            <ul className="space-y-1">
                              {items.map((item, i) => {
                                const highlighted = item.toLowerCase().includes(query.toLowerCase().trim()) && result.matchType === 'dish';
                                return (
                                  <li key={i} className={`text-sm ${highlighted ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                    {item}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="py-24 text-center border-2 border-dashed border-border/30 rounded-[2.5rem] bg-muted/5"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500/60">
                <SearchIcon size={24} />
              </div>
              <h2 className="text-xl font-bold mb-2">No flavors found</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                We couldn't find any meals matching "<span className="text-foreground font-semibold italic">{query}</span>" for this month. 🍱☁️
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
