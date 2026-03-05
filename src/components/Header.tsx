import { Button } from "@/components/ui/button";
import { BarChart3, Plus, LogOut, Wallet, PieChart, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/accounts', label: 'Savings', icon: Wallet },
    { path: '/add-expense', label: 'Add Expense', icon: Plus },
    { path: '/insights', label: 'Insights', icon: PieChart }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop header - true black */}
      <header className="hidden md:block sticky top-0 z-50 w-full" style={{ background: 'hsl(0 0% 2% / 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid hsl(0 0% 8%)' }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-gradient">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-primary-gradient bg-clip-text text-transparent tracking-tight">
              JUST TRACKER
            </h1>
          </div>
          <nav className="flex items-center gap-0.5">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2">
              <Avatar className="h-7 w-7 ring-1 ring-border">
                <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                  {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-muted-foreground max-w-24 truncate">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav - pure black */}
      <Sheet>
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-1 pb-safe z-50"
          style={{ background: 'hsl(0 0% 2% / 0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid hsl(0 0% 8%)', height: '58px', pointerEvents: 'auto' }}
        >
          {[
            { path: '/', icon: BarChart3, label: 'Dashboard' },
            { path: '/insights', icon: PieChart, label: 'Insights' },
            { path: '/accounts', icon: Wallet, label: 'Savings' },
            { path: '__add__', icon: Plus, label: 'Add' },
          ].map(item => (
            <div key={item.path} className="flex-1 flex justify-center">
              <button
                onClick={() => item.path === '__add__' ? window.dispatchEvent(new CustomEvent('open-quick-modal')) : handleNavigation(item.path)}
                className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all active:scale-95 ${item.path !== '__add__' && isActive(item.path) ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <item.icon className={`h-5 w-5 ${item.path !== '__add__' && isActive(item.path) ? 'drop-shadow-[0_0_6px_hsl(152,72%,40%,0.4)]' : ''}`} />
                <span className="text-[9px] font-medium mt-1 tracking-wide">{item.label}</span>
              </button>
            </div>
          ))}
          <div className="flex-1 flex justify-center">
            <SheetTrigger asChild>
              <button className="flex flex-col items-center py-1 px-2 rounded-xl text-muted-foreground transition-all active:scale-95">
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[9px] font-medium mt-1 tracking-wide">More</span>
              </button>
            </SheetTrigger>
          </div>
        </nav>
        <SheetContent side="right" className="w-64 p-0 border-l-0" style={{ background: 'hsl(0 0% 3%)' }}>
          <div className="flex flex-col h-full">
            <div className="p-5 border-b" style={{ borderColor: 'hsl(0 0% 8%)' }}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-border">
                  <AvatarFallback className="bg-muted text-foreground font-semibold">
                    {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-4">
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      className={`w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <IconComponent className="h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'hsl(0 0% 8%)' }}>
              <button
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
