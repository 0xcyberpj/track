import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme, THEMES, type ThemeId } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Check, Palette, User, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Settings = () => {
  const { theme, setTheme, isDark } = useTheme();
  const { user } = useAuth();

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        <div className="space-y-6 animate-fade-in">
          <div className="px-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Settings</h2>
            <p className="text-sm text-muted-foreground mt-1">Customize your experience</p>
          </div>

          {/* Profile */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Appearance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Choose a theme that suits your style</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Dark themes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Dark</p>
                <div className="grid grid-cols-3 gap-3">
                  {darkThemes.map((t) => (
                    <ThemeCard key={t.id} t={t} active={theme === t.id} onSelect={setTheme} />
                  ))}
                </div>
              </div>

              {/* Light themes */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Light</p>
                <div className="grid grid-cols-3 gap-3">
                  {lightThemes.map((t) => (
                    <ThemeCard key={t.id} t={t} active={theme === t.id} onSelect={setTheme} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App</span>
                  <span className="font-medium text-foreground">Just Tracker</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium text-foreground">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Theme</span>
                  <span className="font-medium text-primary">{THEMES.find(t => t.id === theme)?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

function ThemeCard({ t, active, onSelect }: { t: typeof THEMES[number]; active: boolean; onSelect: (id: ThemeId) => void }) {
  return (
    <button
      onClick={() => onSelect(t.id)}
      className={`relative rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.97] ${
        active
          ? 'ring-2 ring-primary shadow-glow'
          : 'ring-1 ring-border hover:ring-muted-foreground/30 hover:shadow-card'
      }`}
      style={{ background: t.background }}
    >
      {active && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center animate-scale-in" style={{ background: t.accent }}>
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}
      {/* Mini preview */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <div className="h-2 rounded-full flex-1" style={{ background: t.accent }} />
          <div className="h-2 rounded-full w-4" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        </div>
        <div className="flex gap-1">
          <div className="h-1.5 rounded-full w-6" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
          <div className="h-1.5 rounded-full w-4" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }} />
        </div>
        <div className="h-4 rounded-md" style={{ background: t.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
      </div>
      <p className={`text-[10px] font-semibold mt-2 truncate ${t.mode === 'dark' ? 'text-white/70' : 'text-black/60'}`}>
        {t.name}
      </p>
    </button>
  );
}

export default Settings;
