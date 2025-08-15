import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from './AnalyticsTracker';

export function HomePage() {
  const [clickCount, setClickCount] = useState(0);
  const { trackEvent } = useAnalytics();

  const handleInteraction = async () => {
    setClickCount(prev => prev + 1);
    
    // Track custom interaction event
    await trackEvent({
      page_url: window.location.href + '#button-click',
      page_title: `Home Page - Button Clicked ${clickCount + 1} times`
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏠 Welcome to Analytics Demo
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          This is a demonstration of our comprehensive analytics tracking system. 
          Every page view, interaction, and user behavior is being tracked in real-time.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Badge variant="default" className="text-lg px-4 py-2">
            📊 Tracking Active
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            🔄 Real-time Data
          </Badge>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 User Tracking
              <Badge variant="outline">Active</Badge>
            </CardTitle>
            <CardDescription>
              Automatically detects new vs returning users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Unique user identification
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Session duration tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Visit frequency analysis
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌍 Geographic Data
              <Badge variant="outline">Global</Badge>
            </CardTitle>
            <CardDescription>
              Location-based user insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🌐</span>
                Country detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🏙️</span>
                City-level tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">📍</span>
                Regional analytics
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 Device Intelligence
              <Badge variant="outline">Multi-platform</Badge>
            </CardTitle>
            <CardDescription>
              Comprehensive device and browser data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-purple-500">💻</span>
                Device type detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">🖥️</span>
                Operating system
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-500">🌐</span>
                Browser identification
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Interactive Demo</CardTitle>
          <CardDescription>
            Click the button below to generate tracked events and see the analytics in action
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button 
              onClick={handleInteraction}
              size="lg"
              className="text-lg px-8 py-3"
            >
              🎯 Track This Click!
            </Button>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Clicks: {clickCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Each click generates a custom tracking event that you can see in the analytics dashboard
          </p>
        </CardContent>
      </Card>

      {/* Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle>📈 What's Being Tracked Right Now</CardTitle>
          <CardDescription>
            Live preview of the data being collected about your visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">Session Information:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Page URL: {window.location.href}</li>
                <li>• Page Title: {document.title}</li>
                <li>• Referrer: {document.referrer || 'Direct visit'}</li>
                <li>• Timestamp: {new Date().toLocaleString()}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Device Information:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• User Agent: {navigator.userAgent.slice(0, 50)}...</li>
                <li>• Language: {navigator.language}</li>
                <li>• Screen: {screen.width}x{screen.height}</li>
                <li>• Platform: {navigator.platform}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AboutPage() {
  const [readTime, setReadTime] = useState(0);
  const { trackEvent } = useAnalytics();

  // Simulate reading time tracking
  useState(() => {
    const interval = setInterval(() => {
      setReadTime(prev => prev + 1);
    }, 1000);

    // Track reading milestone events
    const trackReading = async (seconds: number) => {
      if (seconds > 0 && seconds % 30 === 0) { // Every 30 seconds
        await trackEvent({
          page_url: window.location.href + `#reading-${seconds}s`,
          page_title: `About Page - Reading for ${seconds} seconds`
        });
      }
    };

    const readingInterval = setInterval(() => {
      trackReading(readTime);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(readingInterval);
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🔍 About Our Analytics System
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Learn how our comprehensive tracking system works
        </p>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          ⏱️ Reading Time: {Math.floor(readTime / 60)}m {readTime % 60}s
        </Badge>
      </div>

      {/* Analytics Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">🎯 What We Track</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  👤 User Behavior
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>New vs returning visitor identification</li>
                  <li>Session duration and page visit time</li>
                  <li>Navigation patterns and user flow</li>
                  <li>Bounce rate and engagement metrics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  🌐 Technical Data
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Device type (desktop, mobile, tablet)</li>
                  <li>Operating system and browser information</li>
                  <li>Screen resolution and user agent</li>
                  <li>IP address and geographic location</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  📊 Page Analytics
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Page views and unique visitors</li>
                  <li>Entry and exit points</li>
                  <li>Time spent on each page</li>
                  <li>Referrer and traffic source analysis</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">🔒 Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  🛡️ User Privacy
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>No personal information collected</li>
                  <li>Anonymous user identification via localStorage</li>
                  <li>GDPR compliant data collection</li>
                  <li>Transparent tracking methods</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  ⚡ Performance
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Lightweight tracking library</li>
                  <li>Asynchronous data collection</li>
                  <li>Minimal impact on page load times</li>
                  <li>Efficient batch processing</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  🔧 Integration
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Easy React component integration</li>
                  <li>Automatic SPA route tracking</li>
                  <li>Custom event tracking support</li>
                  <li>Real-time analytics dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">⚙️ Technical Implementation</CardTitle>
          <CardDescription>
            How our analytics system is built and integrated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2">Tracking Component</h3>
              <p className="text-sm text-muted-foreground">
                React component that automatically tracks page views and user interactions
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-semibold mb-2">tRPC API</h3>
              <p className="text-sm text-muted-foreground">
                Type-safe API communication between frontend and analytics backend
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">🗄️</div>
              <h3 className="font-semibold mb-2">PostgreSQL</h3>
              <p className="text-sm text-muted-foreground">
                Robust database storage for all analytics data with proper indexing
              </p>
            </div>
          </div>

          <div className="bg-muted p-6 rounded-lg">
            <h3 className="font-semibold mb-3">📝 Integration Example:</h3>
            <pre className="text-sm bg-background p-4 rounded border overflow-x-auto">
              <code>{`// Add to your React app
import { AnalyticsTracker } from './AnalyticsTracker';

function App() {
  return (
    <div>
      <AnalyticsTracker enableAutoTracking={true} />
      {/* Your app content */}
    </div>
  );
}`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Your Current Session</CardTitle>
          <CardDescription>
            This information is being tracked about your current visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Session Details:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Page:</span>
                  <span>About Page</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time on page:</span>
                  <span>{Math.floor(readTime / 60)}m {readTime % 60}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="truncate max-w-48">{window.location.pathname}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Device Info:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>{navigator.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{navigator.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Screen:</span>
                  <span>{screen.width}×{screen.height}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}