

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
  ChevronRight
} from "lucide-react";
import { ThemeProvider, ThemeToggle } from "@/app/providers/ThemeProvider";
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
} from "@/shared/ui/primitives/sidebar";
import { User as UserEntity } from "@/api/entities";
import { Button } from "@/shared/ui/primitives/design-system-components";
// Removed airtableSync - now using MongoDB backend
import { DataProvider } from "@/app/providers/DataProvider";
import PageLoader from "@/components/PageLoader";
// Removed LoginModal - now using dedicated Login page

// Note: ThemeProvider is now imported from ThemeContext

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // Removed showLoginModal - now using dedicated Login page
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserAuthorization();
  }, []);

  const checkUserAuthorization = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    setAuthError(null);
    
    try {
      // First check if we have a token in localStorage
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        console.log('🔴 No auth token or user data found, redirecting to login');
        setIsAuthorized(false);
        window.location.href = '/Login';
        return;
      }

      // Try to verify the token with the backend
      try {
        const user = await UserEntity.verifyToken();
        console.log('🟢 JWT user authenticated:', user);
        
        if (user) {
          setCurrentUser(user);
          setUserRole(user.role || 'Admin'); // Use actual role from token
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }
      } catch (verifyError) {
        console.log('🔴 Token verification failed, trying fallback user data');
        
        // Fallback: use stored user data if token verification fails temporarily
        try {
          const parsedUser = JSON.parse(userData);
          console.log('🟡 Using stored user data as fallback:', parsedUser);
          
          setCurrentUser(parsedUser);
          setUserRole(parsedUser.role || 'Admin');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        } catch (parseError) {
          console.log('🔴 Failed to parse stored user data');
        }
      }
      
      // If all attempts fail, redirect to login
      setIsAuthorized(false);
      window.location.href = '/Login';
      return;
      
    } catch (error) {
      console.log('🔴 Authentication error:', error);
      setIsAuthorized(false);
      setAuthError(error.message);
      // Redirect to login page instead of showing modal
      window.location.href = '/Login';
      return;
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await UserEntity.logout();
    window.location.href = '/Login';
  };

  // Removed handleLoginSuccess and handleLoginClose - now using dedicated Login page

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Department Manager': return Crown;
      case 'Division Manager': return Shield;
      case 'Coach': return UserCheck;
      case 'Admin': return Crown;
      default: return User;
    }
  };

  const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Trophy, color: "text-cyan-400" },
    { title: "My Players", url: createPageUrl("Players"), icon: Users, color: "text-blue-400" },
    { title: "Games Schedule", url: createPageUrl("GamesSchedule"), icon: Calendar, color: "text-green-400" },
    { title: "Training Planner", url: createPageUrl("TrainingPlanner"), icon: ListChecks, color: "text-purple-400" },
    { title: "Drill Library", url: createPageUrl("DrillLibrary"), icon: ClipboardList, color: "text-orange-400" },
    { title: "Tactic Board", url: createPageUrl("TacticBoard"), icon: Target, color: "text-red-400" },
    { title: "Analytics", url: createPageUrl("Analytics"), icon: TrendingUp, color: "text-yellow-400" },
    { title: "Settings", url: createPageUrl("Settings"), icon: Settings, color: "text-slate-400" },
  ];

  const quickActions = [
    { title: "Add Player", url: createPageUrl("AddPlayer"), icon: Users },
    { title: "Add Team", url: createPageUrl("AddTeam"), icon: Trophy },
    { title: "Add Game", url: createPageUrl("AddGame"), icon: Calendar },
    { title: "Add Report", url: createPageUrl("AddReport"), icon: TrendingUp },
    { title: "Add User", url: createPageUrl("AddUser"), icon: User },
  ];

  if (isLoading) {
    return <PageLoader message="Loading..." />;
  }

  if (!isAuthorized) {
    return (
      <>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-cyan-500/25">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {isLoading ? 'Checking Authentication...' : 'Please Sign In'}
            </h1>
            <p className="text-slate-400 text-lg mb-8">
              {isLoading 
                ? 'Verifying your credentials...' 
                : 'Sign in to access your account and continue.'
              }
            </p>
            {!isLoading && (
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => window.location.href = '/Login'} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={checkUserAuthorization}
                  className="border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                >
                  Retry
                </Button>
              </div>
            )}
            {authError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}
          </div>
        </div>
        {/* Removed LoginModal - now using dedicated Login page */}
      </>
    );
  }

  // Check if current page is DrillDesigner to render full-screen
  if (currentPageName === "DrillDesigner") {
    return (
      <ThemeProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-slate-900 text-slate-100">
          {/* Futuristic Collapsible Sidebar */}
          <div
            className={`fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-cyan-500/20 transition-all duration-500 ease-in-out z-40 ${
              sidebarCollapsed ? 'w-16' : 'w-72'
            } group hover:w-72`}
            style={{
              boxShadow: sidebarCollapsed ? 'inset -2px 0 8px rgba(6, 182, 212, 0.1)' : 'inset -2px 0 8px rgba(6, 182, 212, 0.2), 0 0 20px rgba(6, 182, 212, 0.1)'
            }}
            onMouseEnter={() => setSidebarCollapsed(false)}
            onMouseLeave={() => setSidebarCollapsed(true)}
          >
            {/* RGB Light Strip */}
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Header */}
            <div className="border-b border-slate-700/50 p-4 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 animate-pulse">
                  <Trophy className="w-6 h-6 text-white" />
                  {/* Scanning Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
                </div>
                <div className={`transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'} group-hover:opacity-100 group-hover:w-auto overflow-hidden`}>
                  <h2 className="font-bold text-xl text-white whitespace-nowrap">SquadUp</h2>
                  <p className="text-xs text-cyan-400 font-medium whitespace-nowrap">Youth Soccer Club</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-3 space-y-6">
              <div>
                <div className={`text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100`}>
                  Navigation
                </div>
                <div className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative group/item ${
                        location.pathname === item.url
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10'
                          : 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50'
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                    >
                      {/* Active indicator */}
                      {location.pathname === item.url && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full shadow-lg shadow-cyan-400/50"></div>
                      )}

                      <div className="relative">
                        <item.icon className={`w-5 h-5 ${item.color} transition-all duration-300`} />
                        {/* Glow effect on hover */}
                        <item.icon className={`w-5 h-5 ${item.color} absolute inset-0 opacity-0 group-hover/item:opacity-50 blur-sm transition-all duration-300`} />
                      </div>

                      <span className={`font-medium whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'} group-hover:opacity-100 group-hover:w-auto overflow-hidden`}>
                        {item.title}
                      </span>

                      <ChevronRight className={`w-4 h-4 ml-auto opacity-0 group-hover/item:opacity-100 transition-all duration-300 ${sidebarCollapsed ? 'hidden' : ''} group-hover:block`} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100`}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Quick Actions
                </div>
                <div className="space-y-1">
                  {quickActions.map((item, index) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/30 transition-all duration-300 group/item"
                      style={{
                        animationDelay: `${(navigationItems.length + index) * 50}ms`
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium whitespace-nowrap">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <span className="text-white font-bold text-sm">
                    {currentUser?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'} group-hover:opacity-100 group-hover:w-auto overflow-hidden`}>
                  <p className="font-semibold text-white text-sm truncate whitespace-nowrap">
                    {currentUser?.full_name}
                  </p>
                  <div className="flex items-center gap-1">
                    {React.createElement(getRoleIcon(userRole), { className: "w-3 h-3 text-cyan-400" })}
                    <p className="text-xs text-cyan-400 truncate font-medium whitespace-nowrap">
                      {userRole || 'Coach'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <ThemeToggle 
                  variant="outline" 
                  size="sm" 
                  showLabel={!sidebarCollapsed}
                  className={`w-full border-slate-600 text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-blue-500/10 hover:text-cyan-400 hover:border-cyan-500/50 transition-all duration-300 ${sidebarCollapsed ? 'px-3' : ''}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className={`w-full border-slate-600 text-slate-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/10 hover:text-red-400 hover:border-red-500/50 transition-all duration-300 ${sidebarCollapsed ? 'px-3' : ''}`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className={`transition-all duration-300 ${sidebarCollapsed ? 'hidden' : 'inline'} group-hover:inline`}>
                    Sign Out
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col ml-16">
            <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 md:hidden">
              <div className="flex items-center justify-between px-6 py-4">
                <SidebarTrigger className="hover:bg-slate-700 p-2 rounded-lg transition-colors duration-200">
                  <Menu className="w-5 h-5 text-white" />
                </SidebarTrigger>
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-cyan-500" />
                  <h1 className="text-xl font-bold text-white">SquadUp</h1>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto bg-slate-900">
              <DataProvider>
                {children}
              </DataProvider>
            </div>
          </main>
        </div>

      </SidebarProvider>
    </ThemeProvider>
  );
}

