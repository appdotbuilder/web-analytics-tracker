import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { HomePage, AboutPage } from './components/DemoPages';

type AppView = 'demo' | 'dashboard';
type DemoPage = 'home' | 'about';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('demo');
  const [currentPage, setCurrentPage] = useState<DemoPage>('home');

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
    <div className="min-h-screen bg-background">
      {/* Analytics Tracker - Always Active */}
      <AnalyticsTracker enableAutoTracking={true} trackHashChanges={true} />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">📊 Analytics Platform</h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              🔴 Live Tracking
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {currentView === 'demo' && (
              <>
                <Button 
                  variant={currentPage === 'home' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => navigateToPage('home')}
                >
                  🏠 Home
                </Button>
                <Button 
                  variant={currentPage === 'about' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => navigateToPage('about')}
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
            >
              🎯 Demo Site
            </Button>
            <Button 
              variant={currentView === 'dashboard' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => switchView('dashboard')}
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Demo Website
                  <Badge variant="secondary">Analytics Enabled</Badge>
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
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Analytics Dashboard
                  <Badge variant="secondary">Admin View</Badge>
                </CardTitle>
                <CardDescription>
                  Comprehensive analytics dashboard showing all tracked user behavior, 
                  device information, and engagement metrics in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The backend handlers are currently using placeholder data. 
                  In a production environment, this would show real analytics data from your PostgreSQL database.
                </p>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-3">📊 Analytics Features</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Real-time user tracking</li>
                <li>• Device & browser detection</li>
                <li>• Geographic location data</li>
                <li>• Session duration analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🔧 Technical Stack</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• React + TypeScript</li>
                <li>• tRPC API</li>
                <li>• PostgreSQL Database</li>
                <li>• Radix UI Components</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🛡️ Privacy</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Anonymous tracking</li>
                <li>• GDPR compliant</li>
                <li>• No personal data</li>
                <li>• Transparent collection</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">📈 Integration</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Modular component</li>
                <li>• Easy React integration</li>
                <li>• Custom event tracking</li>
                <li>• SPA route support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-6 pt-6 text-center text-muted-foreground">
            <p>
              🚀 <strong>Analytics Platform Demo</strong> - 
              Comprehensive user behavior tracking and analytics dashboard
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <Badge variant="outline">Current User ID: {localStorage.getItem('analytics_user_id') || 'Generating...'}</Badge>
              <Badge variant="outline">Session: Active</Badge>
              <Badge variant="outline">Tracking: Enabled</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;