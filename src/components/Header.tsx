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
      {/* Desktop header */}
      <header className="hidden md:block sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-3 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-gradient">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold bg-primary-gradient bg-clip-text text-transparent">
              JUST TRACKER
            </h1>
          </div>
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className="gap-1.5 px-3"
                  onClick={() => handleNavigation(item.path)}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary-gradient text-primary-foreground text-xs font-semibold">
                  {user?.email?.slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground max-w-20 truncate">
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 px-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <Sheet>
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-1.5 pb-safe pb-3 bg-background/95 backdrop-blur-sm z-50 rounded-t-2xl border-t border-border/50"
          style={{ pointerEvents: 'auto', height: '56px' }}
        >
          {[
            { path: '/', icon: BarChart3, label: 'Dashboard' },
            { path: '/insights', icon: PieChart, label: 'Insights' },
            { path: '/accounts', icon: Wallet, label: 'Savings' },
            { path: '__add__', icon: Plus, label: 'Add' },
          ].map(item => (
            <div key={item.path} className="px-2 py-1">
              <button
                onClick={() => item.path === '__add__' ? window.dispatchEvent(new CustomEvent('open-quick-modal')) : handleNavigation(item.path)}
                className={`flex flex-col items-center ${item.path !== '__add__' && isActive(item.path) ? 'text-primary' : 'text-muted-foreground'} transition-all active:scale-95`}
              >
                <span className={`rounded-full p-1.5 mb-0.5 flex items-center justify-center ${item.path !== '__add__' && isActive(item.path) ? 'bg-primary/15' : 'bg-transparent'}`}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            </div>
          ))}
          <div className="px-2 py-1">
            <SheetTrigger asChild>
              <button className="flex flex-col items-center text-muted-foreground transition-all active:scale-95">
                <span className="rounded-full p-1.5 mb-0.5 flex items-center justify-center">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium leading-none">More</span>
              </button>
            </SheetTrigger>
          </div>
        </nav>
        <SheetContent side="right" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary-gradient text-primary-foreground font-semibold">
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
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className="w-full justify-start gap-3 h-11"
                      onClick={() => handleNavigation(item.path)}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </div>
            <div className="p-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full gap-3 h-11"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
