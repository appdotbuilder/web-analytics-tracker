import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { HomePage, AboutPage } from './components/DemoPages';

type AppView = 'demo' | 'dashboard';
type DemoPage = 'home' | 'about';
type Theme = 'light' | 'dark' | 'system';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('demo');
  const [currentPage, setCurrentPage] = useState<DemoPage>('home');
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark theme

  // Theme management
  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
    
    // Apply dark theme by default to html tag for comprehensive coverage
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    }
  };

  const toggleTheme = () => {
    const themeOrder: Theme[] = ['dark', 'light', 'system'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '🌙';
    }
  };

  // Simulate navigation for SPA routing (this would normally be handled by React Router)
  const navigateToPage = (page: DemoPage) => {
    setCurrentPage(page);
    // Update URL to simulate navigation
    const newUrl = `${window.location.origin}${window.location.pathname}#${page}`;
    window.history.pushState(null, '', newUrl);
  };

  const switchView = (view: AppView) => {
    setCurrentView(view);
    // Update URL
    const newUrl = `${window.location.origin}${window.location.pathname}#${view}`;
    window.history.pushState(null, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Analytics Tracker - Always Active */}
      <AnalyticsTracker enableAutoTracking={true} trackHashChanges={true} />

      {/* Navigation Header */}
      <header className="app-header">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              📊 Analytics Platform
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex status-active">
              🔴 Live Tracking
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleTheme}
              className="theme-toggle"
              title={`Current theme: ${theme}`}
            >
              {getThemeIcon()}
            </Button>
            
            <div className="h-4 w-px bg-border mx-2" />
            
            {currentView === 'demo' && (
              <>
                <Button 
                  variant={currentPage === 'home' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => navigateToPage('home')}
                  className="enhanced-button"
                >
                  🏠 Home
                </Button>
                <Button 
                  variant={currentPage === 'about' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => navigateToPage('about')}
                  className="enhanced-button"
                >
                  ℹ️ About
                </Button>
              </>
            )}
            
            <div className="h-4 w-px bg-border mx-2" />
            
            <Button 
              variant={currentView === 'demo' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => switchView('demo')}
              className="enhanced-button"
            >
              🎯 Demo Site
            </Button>
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => switchView('dashboard')}
              className="enhanced-button"
            >
              📈 Analytics
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'demo' ? (
          <div className="space-y-6">
            {/* Demo Site Introduction */}
            <Card className="gradient-card-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Demo Website
                  <Badge variant="secondary" className="enhanced-badge">Analytics Enabled</Badge>
                </CardTitle>
                <CardDescription>
                  This is a sample two-page website demonstrating our analytics tracking system. 
                  Navigate between pages and interact with elements to generate tracking data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>Page view tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>User session monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✅</span>
                    <span>Device & location data</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demo Pages Content */}
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'about' && <AboutPage />}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analytics Dashboard Introduction */}
            <Card className="gradient-card-green">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Analytics Dashboard
                  <Badge variant="secondary" className="enhanced-badge">Admin View</Badge>
                </CardTitle>
                <CardDescription>
                  Comprehensive analytics dashboard showing all tracked user behavior, 
                  device information, and engagement metrics in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time analytics data fetched directly from PostgreSQL database, 
                  providing comprehensive insights into user behavior and engagement patterns.
                </p>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />
          </div>
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-border/40 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold mb-3 text-primary">📊 Analytics Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Real-time user tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Device & browser detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Geographic location data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Session duration analysis
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold mb-3 text-primary">🔧 Technical Stack</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  React + TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  tRPC API
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  PostgreSQL Database
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Radix UI Components
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold mb-3 text-primary">🛡️ Privacy</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  Anonymous tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  GDPR compliant
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  No personal data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  Transparent collection
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold mb-3 text-primary">📈 Integration</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  Modular component
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  Easy React integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  Custom event tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  SPA route support
                </li>
              </ul>
            </div>
          </div>
          
          <div className="enhanced-separator mt-8 mb-6"></div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🚀</span>
              <strong className="text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Analytics Platform Demo
              </strong>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Comprehensive user behavior tracking and analytics dashboard with dark mode support
            </p>
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <Badge variant="outline" className="enhanced-badge">
                Current User ID: {localStorage.getItem('analytics_user_id') || 'Generating...'}
              </Badge>
              <Badge variant="outline" className="enhanced-badge status-active">
                Session: Active
              </Badge>
              <Badge variant="outline" className="enhanced-badge">
                Tracking: Enabled
              </Badge>
              <Badge variant="outline" className="enhanced-badge">
                Theme: {theme === 'system' ? 'Auto' : theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;