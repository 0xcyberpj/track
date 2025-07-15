import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Plus, LogOut, Menu, Wallet, PieChart, Settings, User, MoreHorizontal } from "lucide-react";
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
    console.log('Navigating to:', path); // Debug: verify click
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Only show header for md+ screens */}
      <header className="hidden md:block sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-3 h-14 flex items-center justify-between">
          {/* Remove logo/icon for mobile */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary-gradient">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold bg-primary-gradient bg-clip-text text-transparent hidden sm:block">
              JUST TRACKER
            </h1>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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
          {/* User & Mobile Menu */}
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
              className="hidden md:flex gap-1.5 px-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Logout</span>
            </Button>
            {/* Mobile Menu (hidden on mobile now) */}
          </div>
        </div>
      </header>
      {/* Mobile nav bar at the very top, more compact */}
      <Sheet>
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 pb-safe pb-4 bg-background/80 z-50 rounded-t-xl backdrop-blur supports-[backdrop-filter]:backdrop-blur gap-x-2"
          style={{ pointerEvents: 'auto', height: '56px' }}
        >
          <div className="px-2 py-2.5">
            <button
              onClick={() => handleNavigation('/')}
              className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-muted-foreground'} transition-transform active:scale-95`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="rounded-full bg-primary/10 p-1.5 mb-0.5 flex items-center justify-center"><BarChart3 className="h-6 w-6" /></span>
              <span className="text-[11px] font-medium leading-none">Dashboard</span>
            </button>
          </div>
          <div className="px-2 py-2.5">
            <button
              onClick={() => handleNavigation('/insights')}
              className={`flex flex-col items-center ${isActive('/insights') ? 'text-primary' : 'text-muted-foreground'} transition-transform active:scale-95`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="rounded-full bg-primary/10 p-1.5 mb-0.5 flex items-center justify-center"><PieChart className="h-6 w-6" /></span>
              <span className="text-[11px] font-medium leading-none">Insights</span>
            </button>
          </div>
          <div className="px-2 py-2.5">
            <button
              onClick={() => handleNavigation('/accounts')}
              className={`flex flex-col items-center ${isActive('/accounts') ? 'text-primary' : 'text-muted-foreground'} transition-transform active:scale-95`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="rounded-full bg-primary/10 p-1.5 mb-0.5 flex items-center justify-center"><Wallet className="h-6 w-6" /></span>
              <span className="text-[11px] font-medium leading-none">Savings</span>
            </button>
          </div>
          <div className="px-2 py-2.5">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}
              className={`flex flex-col items-center ${isActive('/add-expense') ? 'text-primary' : 'text-muted-foreground'} transition-transform active:scale-95`}
              style={{ pointerEvents: 'auto' }}
            >
              <span className="rounded-full bg-primary/10 p-1.5 mb-0.5 flex items-center justify-center"><Plus className="h-6 w-6" /></span>
              <span className="text-[11px] font-medium leading-none">Add</span>
            </button>
          </div>
          <div className="px-2 py-2.5">
            <SheetTrigger asChild>
              <button className="flex flex-col items-center transition-transform active:scale-95" style={{ pointerEvents: 'auto' }}>
                <span className="rounded-full bg-primary/10 p-1.5 mb-0.5 flex items-center justify-center"><MoreHorizontal className="h-6 w-6" /></span>
                <span className="text-[11px] font-medium leading-none">Menu</span>
              </button>
            </SheetTrigger>
          </div>
        </nav>
        {/* SheetContent for mobile menu */}
        <SheetContent side="right" className="w-64 p-0">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
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
            {/* Mobile Navigation */}
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
            {/* Mobile Logout */}
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
      {/* NOTE: If navigation still does not work, check that your app is wrapped in <BrowserRouter> in main.tsx or App.tsx. */}
    </>
  );
};