import React, { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Users,
  User,
  Trophy,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Shield,
  UserCheck,
  Crown,
  Calendar,
  ClipboardList,
  Target,
  Sun,
  Moon,
  ListChecks,
  ChevronRight,
  Home,
  BarChart3,
  Gamepad2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { User as UserEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { airtableSync } from "@/api/functions";
import { DataProvider } from "../components/DataContext";
import LoginModal from "../components/LoginModal";

// --- Theme Provider ---
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
    localStorage.setItem('squadup-theme', 'dark');
  }, []);

  const toggleTheme = () => {
    setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}

export default function LayoutNew({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuthorization();
  }, []);

  const checkUserAuthorization = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    setAuthError(null);
    
    try {
      const user = await UserEntity.me();
      console.log('Firebase user authenticated:', user);
      
      if (user) {
        setCurrentUser(user);
        setUserRole('Admin');
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }
      
      setIsAuthorized(false);
      setShowLoginModal(true);
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthorized(false);
      setAuthError(error.message);
      setShowLoginModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setUserRole('Admin');
    setIsAuthorized(true);
    setShowLoginModal(false);
    setAuthError(null);
  };

  const handleLoginClose = () => {
    setShowLoginModal(false);
    setAuthError(null);
  };

  const handleLogout = async () => {
    try {
      await UserEntity.logout();
      setCurrentUser(null);
      setUserRole(null);
      setIsAuthorized(false);
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const quickActions = [
    { title: "Add Player", url: createPageUrl("AddPlayer"), icon: Users },
    { title: "Add Team", url: createPageUrl("AddTeam"), icon: Trophy },
    { title: "Add Report", url: createPageUrl("AddReport"), icon: TrendingUp },
    { title: "Add User", url: createPageUrl("AddUser"), icon: User },
  ];

  const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
    { title: "Players", url: createPageUrl("Players"), icon: Users },
    { title: "Games", url: createPageUrl("GamesSchedule"), icon: Calendar },
    { title: "Tactic Board", url: createPageUrl("TacticBoard"), icon: Target },
    { title: "Drill Library", url: createPageUrl("DrillLibrary"), icon: ClipboardList },
    { title: "Training Planner", url: createPageUrl("TrainingPlanner"), icon: ListChecks },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-background)' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-var(--color-accent) to-var(--color-secondary) rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ boxShadow: 'var(--shadow-glow)' }}>
            <Gamepad2 className="w-8 h-8" style={{ color: 'var(--color-background)' }} />
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--color-text-dark)' }}>Loading SquadUp...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--gradient-background)' }}>
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-var(--color-accent) to-var(--color-secondary) rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ boxShadow: 'var(--shadow-glow)' }}>
              <Shield className="w-12 h-12" style={{ color: 'var(--color-background)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-light)' }}>
              {isLoading ? 'Checking Authentication...' : 'Welcome to SquadUp'}
            </h1>
            <p className="text-lg mb-8" style={{ color: 'var(--color-text-dark)' }}>
              {isLoading 
                ? 'Verifying your credentials...' 
                : 'Sign in to access your squad management dashboard.'
              }
            </p>
            {!isLoading && (
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setShowLoginModal(true)} 
                  className="btn btn-primary"
                >
                  <UserCheck className="w-4 h-4" />
                  Sign In
                </Button>
                <Button
                  onClick={checkUserAuthorization}
                  className="btn btn-secondary"
                >
                  <Shield className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            )}
            {authError && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)' }}>
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{authError}</p>
              </div>
            )}
          </div>
        </div>
        {showLoginModal && (
          <LoginModal 
            onLoginSuccess={handleLoginSuccess} 
            onClose={handleLoginClose} 
          />
        )}
      </>
    );
  }

  return (
    <ThemeProvider>
      <DataProvider>
        <div className="min-h-screen" style={{ background: 'var(--gradient-background)' }}>
          <SidebarProvider>
            <Sidebar 
              className="border-r bg-custom-primary" 
              style={{ 
                background: 'var(--color-primary) !important', 
                borderColor: 'rgba(79, 183, 179, 0.2)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <SidebarHeader className="p-6 border-b" style={{ borderColor: 'rgba(79, 183, 179, 0.2)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-var(--color-accent) to-var(--color-secondary) rounded-lg flex items-center justify-center" style={{ boxShadow: 'var(--shadow-glow)' }}>
                    <Gamepad2 className="w-6 h-6" style={{ color: 'var(--color-background)' }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-light)' }}>SquadUp</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-dark)' }}>Futuristic Squad Management</p>
                  </div>
                </div>
              </SidebarHeader>

              <SidebarContent className="p-4">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-dark)' }}>
                    Navigation
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {navigationItems.map((item) => {
                        const isActive = location.pathname === item.url;
                        const Icon = item.icon;
                        
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild
                              className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                              <Link to={item.url}>
                                <Icon className="w-4 h-4" />
                                <span>{item.title}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-8">
                  <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-dark)' }}>
                    Quick Actions
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        
                        return (
                          <SidebarMenuItem key={action.title}>
                            <SidebarMenuButton asChild className="nav-item">
                              <Link to={action.url}>
                                <Icon className="w-4 h-4" />
                                <span>{action.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter className="p-4 border-t" style={{ borderColor: 'rgba(79, 183, 179, 0.2)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-var(--color-secondary) to-var(--color-accent) rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" style={{ color: 'var(--color-background)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-light)' }}>
                      {currentUser?.displayName || currentUser?.email || 'User'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-dark)' }}>
                      {userRole}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  className="btn btn-ghost w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </SidebarFooter>
            </Sidebar>

            <div className="flex-1 flex flex-col">
              <header className="h-16 border-b flex items-center justify-between px-6" style={{ background: 'var(--color-primary)', borderColor: 'rgba(79, 183, 179, 0.2)' }}>
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="btn btn-ghost btn-sm" />
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-light)' }}>
                    {currentPageName || 'Dashboard'}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm" style={{ color: 'var(--color-text-dark)' }}>
                    Welcome back, {currentUser?.displayName?.split(' ')[0] || 'Coach'}!
                  </div>
                </div>
              </header>

              <main className="flex-1 p-6">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </div>
      </DataProvider>
    </ThemeProvider>
  );
}
