import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pageViewsTable, userSessionsTable, userAnalyticsTable } from '../db/schema';
import { type EndPageViewInput } from '../schema';
import { endPageView } from '../handlers/end_page_view';
import { eq } from 'drizzle-orm';

describe('endPageView', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestSession = async () => {
    const sessions = await db.insert(userSessionsTable)
      .values({
        user_id: 'test-user-123',
        is_new_user: true,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        device_type: 'desktop',
        operating_system: 'Windows',
        browser: 'Chrome',
        country: 'USA',
        city: 'New York'
      })
      .returning()
      .execute();
    
    return sessions[0];
  };

  const createTestPageView = async (sessionId: string, entryTime: Date) => {
    const pageViews = await db.insert(pageViewsTable)
      .values({
        session_id: sessionId,
        page_url: '/test-page',
        page_title: 'Test Page',
        entry_time: entryTime
      })
      .returning()
      .execute();
    
    return pageViews[0];
  };

  const createTestAnalytics = async (userId: string) => {
    const analytics = await db.insert(userAnalyticsTable)
      .values({
        user_id: userId,
        total_sessions: 2,
        total_page_views: 5,
        total_time_spent: 300, // 5 minutes
        first_visit: new Date('2024-01-01'),
        last_visit: new Date('2024-01-02'),
        page_views_per_session: '2.5',
        average_session_duration: '150.0' // 2.5 minutes per session
      })
      .returning()
      .execute();
    
    return analytics[0];
  };

  it('should update page view with exit time and calculate time spent', async () => {
    const session = await createTestSession();
    const entryTime = new Date('2024-01-15T10:00:00Z');
    const exitTime = new Date('2024-01-15T10:03:30Z'); // 3.5 minutes later
    
    const pageView = await createTestPageView(session.id, entryTime);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: exitTime
    };

    const result = await endPageView(input);

    // Verify basic fields
    expect(result.id).toBe(pageView.id);
    expect(result.session_id).toBe(session.id);
    expect(result.page_url).toBe('/test-page');
    expect(result.page_title).toBe('Test Page');
    expect(result.entry_time).toEqual(entryTime);
    expect(result.exit_time).toEqual(exitTime);
    expect(result.time_spent).toBe(210); // 3.5 minutes = 210 seconds
  });

  it('should save updated page view to database', async () => {
    const session = await createTestSession();
    const entryTime = new Date('2024-01-15T10:00:00Z');
    const exitTime = new Date('2024-01-15T10:02:00Z'); // 2 minutes later
    
    const pageView = await createTestPageView(session.id, entryTime);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: exitTime
    };

    await endPageView(input);

    // Verify database was updated
    const updatedPageViews = await db.select()
      .from(pageViewsTable)
      .where(eq(pageViewsTable.id, pageView.id))
      .execute();

    expect(updatedPageViews).toHaveLength(1);
    const updatedPageView = updatedPageViews[0];
    expect(updatedPageView.exit_time).toEqual(exitTime);
    expect(updatedPageView.time_spent).toBe(120); // 2 minutes = 120 seconds
  });

  it('should update user analytics with new time spent data', async () => {
    const session = await createTestSession();
    const analytics = await createTestAnalytics(session.user_id);
    
    const entryTime = new Date('2024-01-15T10:00:00Z');
    const exitTime = new Date('2024-01-15T10:05:00Z'); // 5 minutes later
    
    const pageView = await createTestPageView(session.id, entryTime);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: exitTime
    };

    await endPageView(input);

    // Verify analytics were updated
    const updatedAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, session.user_id))
      .execute();

    expect(updatedAnalytics).toHaveLength(1);
    const updated = updatedAnalytics[0];
    
    // Should add 300 seconds (5 minutes) to existing 300 seconds = 600 total
    expect(updated.total_time_spent).toBe(600);
    expect(updated.last_visit).toEqual(exitTime);
    expect(updated.updated_at).toBeInstanceOf(Date);
    
    // Average session duration should be updated (150 + 300/2 = 300)
    expect(parseFloat(updated.average_session_duration)).toBe(300);
  });

  it('should handle zero or negative time spent correctly', async () => {
    const session = await createTestSession();
    const entryTime = new Date('2024-01-15T10:00:00Z');
    const exitTime = new Date('2024-01-15T09:59:00Z'); // 1 minute before entry (invalid)
    
    const pageView = await createTestPageView(session.id, entryTime);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: exitTime
    };

    const result = await endPageView(input);

    // Should default to 0 for invalid/negative time spans
    expect(result.time_spent).toBe(0);
  });

  it('should work when no existing user analytics record exists', async () => {
    const session = await createTestSession();
    const entryTime = new Date('2024-01-15T10:00:00Z');
    const exitTime = new Date('2024-01-15T10:01:30Z'); // 1.5 minutes later
    
    const pageView = await createTestPageView(session.id, entryTime);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: exitTime
    };

    // Should not throw error even without existing analytics
    const result = await endPageView(input);

    expect(result.id).toBe(pageView.id);
    expect(result.time_spent).toBe(90); // 1.5 minutes = 90 seconds
    expect(result.exit_time).toEqual(exitTime);
  });

  it('should throw error for non-existent page view', async () => {
    const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d999';
    
    const input: EndPageViewInput = {
      page_view_id: nonExistentId,
      exit_time: new Date()
    };

    await expect(endPageView(input)).rejects.toThrow(new RegExp(`Page view with id ${nonExistentId} not found`, 'i'));
  });

  it('should throw error when session is not found', async () => {
    // Create a session and page view first
    const session = await createTestSession();
    const pageView = await createTestPageView(session.id, new Date());
    
    // Temporarily disable foreign key constraints and delete the session manually
    await db.execute(`SET session_replication_role = replica;`);
    await db.execute(`DELETE FROM user_sessions WHERE id = '${session.id}';`);
    await db.execute(`SET session_replication_role = DEFAULT;`);

    const input: EndPageViewInput = {
      page_view_id: pageView.id,
      exit_time: new Date()
    };

    await expect(endPageView(input)).rejects.toThrow(new RegExp(`Session with id ${session.id} not found`, 'i'));
  });

  it('should calculate time spent correctly for various durations', async () => {
    const session = await createTestSession();
    
    const testCases = [
      { minutes: 0.5, expectedSeconds: 30 },   // 30 seconds
      { minutes: 1, expectedSeconds: 60 },     // 1 minute
      { minutes: 5.25, expectedSeconds: 315 }, // 5 minutes 15 seconds
      { minutes: 10, expectedSeconds: 600 }    // 10 minutes
    ];

    for (const testCase of testCases) {
      const entryTime = new Date('2024-01-15T10:00:00Z');
      const exitTime = new Date(entryTime.getTime() + (testCase.minutes * 60 * 1000));
      
      const pageView = await createTestPageView(session.id, entryTime);

      const input: EndPageViewInput = {
        page_view_id: pageView.id,
        exit_time: exitTime
      };

      const result = await endPageView(input);

      expect(result.time_spent).toBe(testCase.expectedSeconds);
    }
  });
});