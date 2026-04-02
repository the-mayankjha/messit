import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Moon, Sun, Check, Crown, Dumbbell, Bell } from 'lucide-react';
import { BellRingIcon } from '../components/ui/icons/BellRingIcon';
import { requestNotificationPermission, sendNotification } from '../utils/notifier';

export default function Settings() {
  const { 
    theme, 
    setTheme, 
    accentColor, 
    setAccentColor, 
    notificationMode, 
    setNotificationMode,
    setUser,
    setIsOnboarded,
    setMenuData
  } = useStore();
  const [testMeal, setTestMeal] = useState('Lunch');
  const [lastTestResult, setLastTestResult] = useState(null);

  const testMeals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

  const themes = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' }
  ];

  const accents = [
    { id: 'default', color: 'bg-gray-500', label: 'Default' },
    { id: 'red', color: 'bg-red-500', label: 'Red' },
    { id: 'blue', color: 'bg-blue-500', label: 'Blue' },
    { id: 'green', color: 'bg-green-500', label: 'Green' },
    { id: 'purple', color: 'bg-purple-500', label: 'Purple' },
    { id: 'orange', color: 'bg-orange-500', label: 'Orange' }
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
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

      <div className="space-y-6">
        
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Appearance</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Customize how the app looks.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <p className="font-medium mb-3">Theme Mode</p>
              <div className="flex gap-3">
                {themes.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all w-24 ${
                        theme === t.id ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="font-medium mb-3">Accent Color</p>
              <div className="flex flex-wrap gap-3">
                {accents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccentColor(a.id)}
                    className={`flex items-center gap-2 p-2 pr-4 rounded-full border-2 transition-all ${
                      accentColor === a.id ? 'border-foreground shadow-sm' : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${a.color} flex items-center justify-center text-white`}>
                      {accentColor === a.id && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Notifications</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Configure your meal reminders.</p>
              </div>
              <BellRingIcon size={20} className="text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div>
              <p className="font-medium mb-3">Notification Style</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <button
                  onClick={() => setNotificationMode('stud')}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
                    notificationMode === 'stud' ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <Dumbbell className="w-5 h-5" />
                    Stud Mode
                  </div>
                  <p className="text-sm text-muted-foreground">"Yo Bro, Fuel Up! Grab your protein..."</p>
                </button>

                <button
                  onClick={() => setNotificationMode('princess')}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
                    notificationMode === 'princess' ? 'border-accent bg-accent/10' : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <Crown className="w-5 h-5" />
                    Princess Mode
                  </div>
                  <p className="text-sm text-muted-foreground">"Your Meal Awaits, Princess. Time for a delicious..."</p>
                </button>

              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-6">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notification Tester</p>
                
                {/* Meal Selector */}
                <div className="flex flex-wrap gap-2">
                  {testMeals.map(m => (
                    <button
                      key={m}
                      onClick={() => setTestMeal(m)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        testMeal === m ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Preview Card */}
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 relative overflow-hidden group/preview">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/preview:opacity-20 transition-opacity">
                    <BellRingIcon size={40} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2">Live Preview</p>
                  <h4 className="font-bold text-sm mb-1">{previewContent.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{previewContent.body}</p>
                </div>
              </div>

              <Button onClick={handleTestNotification} size="lg" className="group w-full rounded-2xl py-7 text-base font-bold shadow-xl hover:shadow-accent/20 transition-all">
                <BellRingIcon size={20} className="mr-3 group-hover:block hidden animate-bounce" />
                Fire Test Notification
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-xl text-red-500">Danger Zone</CardTitle>
            <p className="text-sm text-red-500/60 mt-1">Irreversible actions for your account and data.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => { setUser(null); setIsOnboarded(false); }}
                variant="outline" 
                className="border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl flex-1"
              >
                Log Out
              </Button>
              <Button 
                onClick={() => setMenuData(null)}
                variant="outline" 
                className="border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl flex-1"
              >
                Clear Menu Data
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
