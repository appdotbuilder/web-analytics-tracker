import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { AnalyticsSummary, UserSession, PageView, AnalyticsFilters } from '../../../server/src/schema';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, sessionsData, pageViewsData] = await Promise.all([
        trpc.getAnalyticsSummary.query(filters),
        trpc.getUserSessions.query(filters),
        trpc.getPageViews.query(filters)
      ]);
      
      setSummary(summaryData);
      setUserSessions(sessionsData);
      setPageViews(pageViewsData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string | boolean | Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">📊 Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive user behavior and website analytics
          </p>
        </div>
        <Button onClick={loadAnalyticsData} disabled={isLoading}>
          {isLoading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📈 Filters & Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.start_date?.toISOString().split('T')[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('start_date', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.end_date?.toISOString().split('T')[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('end_date', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select
                value={filters.country || 'all'}
                onValueChange={(value: string) => handleFilterChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Device Type</label>
              <Select
                value={filters.device_type || 'all'}
                onValueChange={(value: string) => handleFilterChange('device_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Devices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">User Type</label>
              <Select
                value={filters.is_new_user === undefined ? 'all' : filters.is_new_user.toString()}
                onValueChange={(value: string) => 
                  handleFilterChange('is_new_user', value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="true">New Users</SelectItem>
                  <SelectItem value="false">Returning Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">👥 Total Users</CardTitle>
              <span className="text-2xl">👥</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_users}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">New: {summary.new_users}</Badge>
                <Badge variant="outline">Returning: {summary.returning_users}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">📈 Total Sessions</CardTitle>
              <span className="text-2xl">📈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_sessions}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg Duration: {formatDuration(summary.average_session_duration)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">👁️ Page Views</CardTitle>
              <span className="text-2xl">👁️</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_page_views}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Total page impressions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">🔄 Bounce Rate</CardTitle>
              <span className="text-2xl">🔄</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary.bounce_rate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-2">
                Single page sessions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Overview</TabsTrigger>
          <TabsTrigger value="sessions">👥 Sessions</TabsTrigger>
          <TabsTrigger value="pages">📄 Page Views</TabsTrigger>
          <TabsTrigger value="insights">💡 Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top Pages</CardTitle>
                  <CardDescription>Most viewed pages</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.top_pages.length === 0 ? (
                    <p className="text-muted-foreground">No page data available</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.top_pages.map((page, index) => (
                        <div key={page.page_url} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{page.page_url}</p>
                            <p className="text-xs text-muted-foreground">
                              {page.views} views • {page.unique_views} unique
                            </p>
                          </div>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>🌍 Geographic Distribution</CardTitle>
                  <CardDescription>Users by country</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.top_countries.length === 0 ? (
                    <p className="text-muted-foreground">No geographic data available</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.top_countries.map((country) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{country.country}</p>
                            <p className="text-xs text-muted-foreground">
                              {country.sessions} sessions
                            </p>
                          </div>
                          <Badge variant="outline">{country.users} users</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>📱 Device Types</CardTitle>
                  <CardDescription>User device distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">🖥️ Desktop</span>
                      <Badge variant="secondary">{summary.device_breakdown.desktop}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">📱 Mobile</span>
                      <Badge variant="secondary">{summary.device_breakdown.mobile}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">📟 Tablet</span>
                      <Badge variant="secondary">{summary.device_breakdown.tablet}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Browser Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>🌐 Browser Usage</CardTitle>
                  <CardDescription>Most popular browsers</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.browser_breakdown.length === 0 ? (
                    <p className="text-muted-foreground">No browser data available</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.browser_breakdown.map((browser) => (
                        <div key={browser.browser} className="flex items-center justify-between">
                          <span className="text-sm">{browser.browser}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{browser.users} users</Badge>
                            <Badge variant="secondary">{browser.percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>👥 User Sessions</CardTitle>
              <CardDescription>
                Detailed session information with user behavior data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userSessions.length === 0 ? (
                <p className="text-muted-foreground">No session data available</p>
              ) : (
                <div className="space-y-4">
                  {userSessions.map((session: UserSession) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={session.is_new_user ? "default" : "secondary"}>
                              {session.is_new_user ? "🆕 New User" : "🔄 Returning"}
                            </Badge>
                            <Badge variant="outline">{session.device_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            User ID: {session.user_id}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">🌍 Location</p>
                          <p className="text-muted-foreground">
                            {session.country || 'Unknown'}{session.city ? `, ${session.city}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">💻 System</p>
                          <p className="text-muted-foreground">
                            {session.operating_system} • {session.browser}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">📡 Source</p>
                          <p className="text-muted-foreground">
                            {session.referrer || 'Direct'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>📄 Page Views</CardTitle>
              <CardDescription>
                Individual page view records with time spent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pageViews.length === 0 ? (
                <p className="text-muted-foreground">No page view data available</p>
              ) : (
                <div className="space-y-4">
                  {pageViews.map((view: PageView) => (
                    <div key={view.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium">{view.page_title}</h3>
                          <p className="text-sm text-muted-foreground">{view.page_url}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {view.time_spent ? formatDuration(view.time_spent) : 'Active'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(view.entry_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>💡 Key Insights</CardTitle>
                <CardDescription>Automated analytics insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary ? (
                  <>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <h4 className="font-semibold text-blue-900">User Growth</h4>
                      <p className="text-sm text-blue-800">
                        {summary.new_users > summary.returning_users 
                          ? "🚀 Growing user base with more new users than returning users"
                          : "📈 Strong user retention with more returning visitors"
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <h4 className="font-semibold text-green-900">Engagement</h4>
                      <p className="text-sm text-green-800">
                        Average session duration: {formatDuration(summary.average_session_duration)}
                        {summary.average_session_duration > 180 ? " (Great engagement! 🎉)" : " (Room for improvement 📈)"}
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                      <h4 className="font-semibold text-amber-900">Bounce Rate</h4>
                      <p className="text-sm text-amber-800">
                        {summary.bounce_rate < 0.4 
                          ? "✅ Excellent bounce rate - users are exploring multiple pages"
                          : summary.bounce_rate < 0.6 
                            ? "⚠️ Moderate bounce rate - consider improving page engagement"
                            : "🚨 High bounce rate - users may not be finding what they need"
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">Loading insights...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📊 Analytics Summary</CardTitle>
                <CardDescription>Current tracking status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">📈 Tracking Status</span>
                    <Badge variant="default">🟢 Active</Badge>
                  </div>
                  <Separator />
                  <div className="text-sm space-y-2">
                    <p><strong>Data Collection:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                      <li>✅ Page views and navigation</li>
                      <li>✅ User sessions and duration</li>
                      <li>✅ Device and browser detection</li>
                      <li>✅ Geographic location (basic)</li>
                      <li>✅ Referrer tracking</li>
                      <li>✅ New vs returning users</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <p><strong>Privacy:</strong> User-friendly tracking with local storage IDs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}