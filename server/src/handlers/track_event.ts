import { db } from '../db';
import { userSessionsTable, pageViewsTable, userAnalyticsTable } from '../db/schema';
import { type TrackEventInput } from '../schema';
import { eq, desc, sql } from 'drizzle-orm';

// Simple user agent parser - extracts device type, OS, and browser
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Device type detection - order matters here
  let deviceType = 'desktop';
  if (/ipad/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  }
  
  // Operating system detection - check iOS patterns first
  let operatingSystem = 'Unknown';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('cpu os') || ua.includes('cpu iphone os')) {
    operatingSystem = 'iOS';
  } else if (ua.includes('android')) {
    operatingSystem = 'Android';
  } else if (ua.includes('windows')) {
    operatingSystem = 'Windows';
  } else if (ua.includes('mac os x')) {
    operatingSystem = 'macOS';
  } else if (ua.includes('linux')) {
    operatingSystem = 'Linux';
  }
  
  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edge')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  return { deviceType, operatingSystem, browser };
}

export async function trackEvent(input: TrackEventInput): Promise<{ sessionId: string; pageViewId: string }> {
  try {
    // Parse user agent to extract device info
    const { deviceType, operatingSystem, browser } = parseUserAgent(input.user_agent);
    
    // Check if user exists (to determine if new or returning user)
    const existingUserAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, input.user_id))
      .limit(1)
      .execute();
    
    const isNewUser = existingUserAnalytics.length === 0;
    
    // Get or create current session
    let sessionId = input.session_id;
    
    if (!sessionId) {
      // Create new session
      const sessionResult = await db.insert(userSessionsTable)
        .values({
          user_id: input.user_id,
          is_new_user: isNewUser,
          ip_address: input.ip_address,
          user_agent: input.user_agent,
          device_type: deviceType,
          operating_system: operatingSystem,
          browser: browser,
          country: input.geolocation?.country || null,
          city: input.geolocation?.city || null,
          latitude: input.geolocation?.latitude?.toString() || null,
          longitude: input.geolocation?.longitude?.toString() || null,
          referrer: input.referrer
        })
        .returning()
        .execute();
      
      sessionId = sessionResult[0].id;
    } else {
      // Update existing session timestamp
      await db.update(userSessionsTable)
        .set({ updated_at: new Date() })
        .where(eq(userSessionsTable.id, sessionId))
        .execute();
    }
    
    // Create page view record
    const pageViewResult = await db.insert(pageViewsTable)
      .values({
        session_id: sessionId,
        page_url: input.page_url,
        page_title: input.page_title
      })
      .returning()
      .execute();
    
    const pageViewId = pageViewResult[0].id;
    
    // Update or create user analytics
    const now = new Date();
    
    if (isNewUser) {
      // Create new user analytics record
      await db.insert(userAnalyticsTable)
        .values({
          user_id: input.user_id,
          total_sessions: 1,
          total_page_views: 1,
          total_time_spent: 0,
          first_visit: now,
          last_visit: now,
          page_views_per_session: '1.00',
          average_session_duration: '0.00'
        })
        .execute();
    } else {
      // Update existing user analytics
      const userAnalytics = existingUserAnalytics[0];
      const newTotalSessions = sessionId === input.session_id ? 
        userAnalytics.total_sessions : userAnalytics.total_sessions + 1;
      const newTotalPageViews = userAnalytics.total_page_views + 1;
      const newPageViewsPerSession = (newTotalPageViews / newTotalSessions);
      
      await db.update(userAnalyticsTable)
        .set({
          total_sessions: newTotalSessions,
          total_page_views: newTotalPageViews,
          last_visit: now,
          page_views_per_session: newPageViewsPerSession.toFixed(2),
          updated_at: now
        })
        .where(eq(userAnalyticsTable.user_id, input.user_id))
        .execute();
    }
    
    return {
      sessionId,
      pageViewId
    };
    
  } catch (error) {
    console.error('Track event failed:', error);
    throw error;
  }
}