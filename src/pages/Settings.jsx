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
      sendNotification("Lunch", notificationMode);
    } else {
      alert("Please enable notifications in your browser settings.");
    }
  };

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

            <div className="pt-4 border-t border-border">
              <Button onClick={handleTestNotification} variant="outline" className="group w-full sm:w-auto">
                <BellRingIcon size={16} className="mr-2" />
                Test Notification
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
