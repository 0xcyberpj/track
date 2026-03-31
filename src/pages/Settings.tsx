import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme, THEMES, type ThemeId } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Check, Palette, User, Shield, Bell, Globe, ChevronRight, Sparkles, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { useMonthlyPlanEnabled } from "@/hooks/useMonthlyPlanEnabled";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [currency] = useState('INR');
  const [notifications] = useState({ expense: true, budget: true, weekly: false });

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        <div className="space-y-5 animate-fade-in">
          <div className="px-1 pt-2 sm:pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
          </div>

          {/* Profile */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-foreground truncate">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                      Pro
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Appearance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">8 premium themes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dark themes */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Dark Themes</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {darkThemes.map((t) => (
                    <ThemeCard key={t.id} t={t} active={theme === t.id} onSelect={setTheme} />
                  ))}
                </div>
              </div>

              {/* Light themes */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Light Themes</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {lightThemes.map((t) => (
                    <ThemeCard key={t.id} t={t} active={theme === t.id} onSelect={setTheme} />
                  ))}
                </div>
              </div>

              {/* Active theme label */}
              <div className="flex items-center gap-2 pt-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Active: <span className="text-primary font-medium">{THEMES.find(t => t.id === theme)?.name}</span></span>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <SettingsRow label="Currency" value="₹ INR (Indian Rupee)" />
              <SettingsRow label="Date Format" value="DD/MM/YYYY" />
              <SettingsRow label="Start of Week" value="Monday" />
              <SettingsRow label="Number Format" value="1,00,000.00" />
            </CardContent>
          </Card>

          {/* Features */}
          <FeaturesCard />

          {/* Notifications */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              <ToggleRow label="Expense Reminders" description="Daily reminder to log expenses" enabled={notifications.expense} />
              <ToggleRow label="Budget Alerts" description="Alert when nearing budget limit" enabled={notifications.budget} />
              <ToggleRow label="Weekly Summary" description="Weekly spending report" enabled={notifications.weekly} />
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">About</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">App</span>
                  <span className="font-semibold text-foreground">Just Tracker</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium text-foreground">2.1.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium text-emerald-500">Synced</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

function FeaturesCard() {
  const { enabled, setEnabled } = useMonthlyPlanEnabled();
  return (
    <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold">Features</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <div className="flex items-center justify-between py-3.5">
          <div>
            <span className="text-sm font-medium text-foreground">Monthly Budget Plan</span>
            <p className="text-xs text-muted-foreground mt-0.5">Plan income, allocations, trackers & investments monthly</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-muted'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>{value}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-muted'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function ThemeCard({ t, active, onSelect }: { t: typeof THEMES[number]; active: boolean; onSelect: (id: ThemeId) => void }) {
  return (
    <button
      onClick={() => onSelect(t.id)}
      className={`relative rounded-xl p-2.5 text-left transition-all duration-200 active:scale-[0.96] ${
        active
          ? 'ring-2 ring-primary shadow-glow scale-[1.02]'
          : 'ring-1 ring-border hover:ring-muted-foreground/30 hover:shadow-card'
      }`}
      style={{ background: t.background }}
    >
      {active && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center animate-scale-in shadow-md" style={{ background: t.accent }}>
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          <div className="h-2 rounded-full flex-1" style={{ background: t.accent }} />
          <div className="h-2 rounded-full w-3" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        </div>
        <div className="h-3 rounded-md" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
        <div className="flex gap-1">
          <div className="h-1.5 rounded-full w-5" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)' }} />
          <div className="h-1.5 rounded-full w-3" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
        </div>
      </div>
      <p className={`text-[9px] font-semibold mt-1.5 truncate ${t.mode === 'dark' ? 'text-white/60' : 'text-black/50'}`}>
        {t.name}
      </p>
    </button>
  );
}

export default Settings;
