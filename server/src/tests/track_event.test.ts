import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSessionsTable, pageViewsTable, userAnalyticsTable } from '../db/schema';
import { type TrackEventInput } from '../schema';
import { trackEvent } from '../handlers/track_event';
import { eq } from 'drizzle-orm';

// Test input for Chrome on Windows
const testInput: TrackEventInput = {
  user_id: 'user-123',
  page_url: 'https://example.com/home',
  page_title: 'Home Page',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  referrer: 'https://google.com',
  geolocation: {
    country: 'United States',
    city: 'New York',
    latitude: 40.7128,
    longitude: -74.0060
  }
};

describe('trackEvent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new user session and page view for new user', async () => {
    const result = await trackEvent(testInput);

    // Should return valid IDs
    expect(result.sessionId).toBeDefined();
    expect(result.pageViewId).toBeDefined();
    expect(typeof result.sessionId).toBe('string');
    expect(typeof result.pageViewId).toBe('string');

    // Verify session was created
    const sessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, result.sessionId))
      .execute();

    expect(sessions).toHaveLength(1);
    const session = sessions[0];
    expect(session.user_id).toBe('user-123');
    expect(session.is_new_user).toBe(true);
    expect(session.ip_address).toBe('192.168.1.1');
    expect(session.device_type).toBe('desktop');
    expect(session.operating_system).toBe('Windows');
    expect(session.browser).toBe('Chrome');
    expect(session.country).toBe('United States');
    expect(session.city).toBe('New York');
    expect(parseFloat(session.latitude!)).toBe(40.7128);
    expect(parseFloat(session.longitude!)).toBe(-74.0060);
    expect(session.referrer).toBe('https://google.com');

    // Verify page view was created
    const pageViews = await db.select()
      .from(pageViewsTable)
      .where(eq(pageViewsTable.id, result.pageViewId))
      .execute();

    expect(pageViews).toHaveLength(1);
    const pageView = pageViews[0];
    expect(pageView.session_id).toBe(result.sessionId);
    expect(pageView.page_url).toBe('https://example.com/home');
    expect(pageView.page_title).toBe('Home Page');
    expect(pageView.entry_time).toBeInstanceOf(Date);
    expect(pageView.exit_time).toBeNull();
    expect(pageView.time_spent).toBeNull();

    // Verify user analytics was created
    const userAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, 'user-123'))
      .execute();

    expect(userAnalytics).toHaveLength(1);
    const analytics = userAnalytics[0];
    expect(analytics.total_sessions).toBe(1);
    expect(analytics.total_page_views).toBe(1);
    expect(analytics.total_time_spent).toBe(0);
    expect(parseFloat(analytics.page_views_per_session)).toBe(1.00);
    expect(parseFloat(analytics.average_session_duration)).toBe(0.00);
    expect(analytics.first_visit).toBeInstanceOf(Date);
    expect(analytics.last_visit).toBeInstanceOf(Date);
  });

  it('should update existing user analytics for returning user', async () => {
    // Create initial user analytics
    await db.insert(userAnalyticsTable)
      .values({
        user_id: 'user-456',
        total_sessions: 2,
        total_page_views: 5,
        total_time_spent: 300,
        first_visit: new Date('2024-01-01'),
        last_visit: new Date('2024-01-02'),
        page_views_per_session: '2.50',
        average_session_duration: '150.00'
      })
      .execute();

    const returningUserInput: TrackEventInput = {
      ...testInput,
      user_id: 'user-456'
    };

    const result = await trackEvent(returningUserInput);

    // Verify session was created as returning user
    const sessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, result.sessionId))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].is_new_user).toBe(false);

    // Verify user analytics was updated
    const userAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, 'user-456'))
      .execute();

    expect(userAnalytics).toHaveLength(1);
    const analytics = userAnalytics[0];
    expect(analytics.total_sessions).toBe(3); // Incremented
    expect(analytics.total_page_views).toBe(6); // Incremented
    expect(analytics.total_time_spent).toBe(300); // Unchanged
    expect(parseFloat(analytics.page_views_per_session)).toBe(2.00); // 6/3
    expect(parseFloat(analytics.average_session_duration)).toBe(150.00); // Unchanged
    expect(analytics.last_visit).toBeInstanceOf(Date);
  });

  it('should use existing session when session_id is provided', async () => {
    // Create an existing session
    const existingSessionResult = await db.insert(userSessionsTable)
      .values({
        user_id: 'user-789',
        is_new_user: true,
        ip_address: '10.0.0.1',
        user_agent: 'test-agent',
        device_type: 'mobile',
        operating_system: 'iOS',
        browser: 'Safari'
      })
      .returning()
      .execute();

    const existingSessionId = existingSessionResult[0].id;

    // Create initial user analytics
    await db.insert(userAnalyticsTable)
      .values({
        user_id: 'user-789',
        total_sessions: 1,
        total_page_views: 2,
        total_time_spent: 0,
        first_visit: new Date('2024-01-01'),
        last_visit: new Date('2024-01-01'),
        page_views_per_session: '2.00',
        average_session_duration: '0.00'
      })
      .execute();

    const inputWithSessionId: TrackEventInput = {
      ...testInput,
      user_id: 'user-789',
      session_id: existingSessionId
    };

    const result = await trackEvent(inputWithSessionId);

    // Should use existing session ID
    expect(result.sessionId).toBe(existingSessionId);

    // Should still create new page view
    expect(result.pageViewId).toBeDefined();

    // Verify analytics updated correctly (same session, so session count doesn't increase)
    const userAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, 'user-789'))
      .execute();

    const analytics = userAnalytics[0];
    expect(analytics.total_sessions).toBe(1); // Not incremented - same session
    expect(analytics.total_page_views).toBe(3); // Incremented
    expect(parseFloat(analytics.page_views_per_session)).toBe(3.00); // 3/1
  });

  it('should parse different user agents correctly', async () => {
    // Test mobile iOS Safari
    const mobileInput: TrackEventInput = {
      ...testInput,
      user_id: 'mobile-user',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    };

    const mobileResult = await trackEvent(mobileInput);

    const mobileSessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, mobileResult.sessionId))
      .execute();

    expect(mobileSessions[0].device_type).toBe('mobile');
    expect(mobileSessions[0].operating_system).toBe('iOS');
    expect(mobileSessions[0].browser).toBe('Safari');

    // Test Android Chrome
    const androidInput: TrackEventInput = {
      ...testInput,
      user_id: 'android-user',
      user_agent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    };

    const androidResult = await trackEvent(androidInput);

    const androidSessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, androidResult.sessionId))
      .execute();

    expect(androidSessions[0].device_type).toBe('mobile');
    expect(androidSessions[0].operating_system).toBe('Android');
    expect(androidSessions[0].browser).toBe('Chrome');
  });

  it('should handle missing optional fields', async () => {
    const minimalInput: TrackEventInput = {
      user_id: 'minimal-user',
      page_url: 'https://example.com/page',
      page_title: 'Test Page',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0',
      referrer: null
      // No geolocation or session_id
    };

    const result = await trackEvent(minimalInput);

    expect(result.sessionId).toBeDefined();
    expect(result.pageViewId).toBeDefined();

    // Verify session was created with null optional fields
    const sessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, result.sessionId))
      .execute();

    const session = sessions[0];
    expect(session.country).toBeNull();
    expect(session.city).toBeNull();
    expect(session.latitude).toBeNull();
    expect(session.longitude).toBeNull();
    expect(session.referrer).toBeNull();
  });

  it('should handle tablet user agent correctly', async () => {
    const tabletInput: TrackEventInput = {
      ...testInput,
      user_id: 'tablet-user',
      user_agent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    };

    const result = await trackEvent(tabletInput);

    const sessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, result.sessionId))
      .execute();

    expect(sessions[0].device_type).toBe('tablet');
    expect(sessions[0].operating_system).toBe('iOS');
    expect(sessions[0].browser).toBe('Safari');
  });
});