import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSessionsTable, pageViewsTable } from '../db/schema';
import { type AnalyticsFilters } from '../schema';
import { getPageViews } from '../handlers/get_page_views';

// Test data setup
const testSession = {
  user_id: 'user123',
  is_new_user: true,
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0 test browser',
  device_type: 'desktop',
  operating_system: 'Windows',
  browser: 'Chrome',
  country: 'US',
  city: 'New York',
  latitude: '40.7128',
  longitude: '-74.0060',
  referrer: 'https://google.com'
};

const testSession2 = {
  user_id: 'user456',
  is_new_user: false,
  ip_address: '192.168.1.2',
  user_agent: 'Mozilla/5.0 mobile browser',
  device_type: 'mobile',
  operating_system: 'iOS',
  browser: 'Safari',
  country: 'CA',
  city: 'Toronto',
  latitude: '43.6532',
  longitude: '-79.3832',
  referrer: null
};

describe('getPageViews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no page views exist', async () => {
    const result = await getPageViews();
    expect(result).toEqual([]);
  });

  it('should return all page views without filters', async () => {
    // Create session first
    const sessionResult = await db.insert(userSessionsTable)
      .values(testSession)
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create page views
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: sessionId,
          page_url: '/home',
          page_title: 'Home Page',
          entry_time: new Date('2024-01-01T10:00:00Z'),
          exit_time: new Date('2024-01-01T10:05:00Z'),
          time_spent: 300
        },
        {
          session_id: sessionId,
          page_url: '/about',
          page_title: 'About Page',
          entry_time: new Date('2024-01-01T10:05:00Z'),
          exit_time: null,
          time_spent: null
        }
      ])
      .execute();

    const result = await getPageViews();

    expect(result).toHaveLength(2);
    expect(result[0].page_url).toEqual('/home');
    expect(result[0].page_title).toEqual('Home Page');
    expect(result[0].time_spent).toEqual(300);
    expect(result[0].entry_time).toBeInstanceOf(Date);
    expect(result[0].exit_time).toBeInstanceOf(Date);
    
    expect(result[1].page_url).toEqual('/about');
    expect(result[1].exit_time).toBeNull();
    expect(result[1].time_spent).toBeNull();
  });

  it('should filter page views by date range', async () => {
    // Create session
    const sessionResult = await db.insert(userSessionsTable)
      .values(testSession)
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create page views with different dates
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: sessionId,
          page_url: '/home',
          page_title: 'Home Page',
          entry_time: new Date('2024-01-01T10:00:00Z')
        },
        {
          session_id: sessionId,
          page_url: '/about',
          page_title: 'About Page',
          entry_time: new Date('2024-01-02T10:00:00Z')
        },
        {
          session_id: sessionId,
          page_url: '/contact',
          page_title: 'Contact Page',
          entry_time: new Date('2024-01-03T10:00:00Z')
        }
      ])
      .execute();

    // Test date range filtering
    const filters: AnalyticsFilters = {
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-02T23:59:59Z')
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(2);
    expect(result.some(pv => pv.page_url === '/home')).toBe(true);
    expect(result.some(pv => pv.page_url === '/about')).toBe(true);
    expect(result.some(pv => pv.page_url === '/contact')).toBe(false);
  });

  it('should filter page views by page URL', async () => {
    // Create session
    const sessionResult = await db.insert(userSessionsTable)
      .values(testSession)
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create multiple page views
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: sessionId,
          page_url: '/home',
          page_title: 'Home Page'
        },
        {
          session_id: sessionId,
          page_url: '/about',
          page_title: 'About Page'
        },
        {
          session_id: sessionId,
          page_url: '/home',
          page_title: 'Home Page Again'
        }
      ])
      .execute();

    const filters: AnalyticsFilters = {
      page_url: '/home'
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(2);
    expect(result.every(pv => pv.page_url === '/home')).toBe(true);
  });

  it('should filter page views by country (requires join)', async () => {
    // Create sessions with different countries
    const session1Result = await db.insert(userSessionsTable)
      .values({ ...testSession, country: 'US' })
      .returning()
      .execute();

    const session2Result = await db.insert(userSessionsTable)
      .values({ ...testSession2, country: 'CA' })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create page views for both sessions
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: session1Id,
          page_url: '/us-page',
          page_title: 'US Page'
        },
        {
          session_id: session2Id,
          page_url: '/ca-page',
          page_title: 'CA Page'
        }
      ])
      .execute();

    const filters: AnalyticsFilters = {
      country: 'US'
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(1);
    expect(result[0].page_url).toEqual('/us-page');
  });

  it('should filter page views by device type (requires join)', async () => {
    // Create sessions with different device types
    const session1Result = await db.insert(userSessionsTable)
      .values({ ...testSession, device_type: 'desktop' })
      .returning()
      .execute();

    const session2Result = await db.insert(userSessionsTable)
      .values({ ...testSession2, device_type: 'mobile' })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create page views for both sessions
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: session1Id,
          page_url: '/desktop-page',
          page_title: 'Desktop Page'
        },
        {
          session_id: session2Id,
          page_url: '/mobile-page',
          page_title: 'Mobile Page'
        }
      ])
      .execute();

    const filters: AnalyticsFilters = {
      device_type: 'mobile'
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(1);
    expect(result[0].page_url).toEqual('/mobile-page');
  });

  it('should filter page views by new user status (requires join)', async () => {
    // Create sessions with different new user statuses
    const session1Result = await db.insert(userSessionsTable)
      .values({ ...testSession, is_new_user: true })
      .returning()
      .execute();

    const session2Result = await db.insert(userSessionsTable)
      .values({ ...testSession2, is_new_user: false })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create page views for both sessions
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: session1Id,
          page_url: '/new-user-page',
          page_title: 'New User Page'
        },
        {
          session_id: session2Id,
          page_url: '/returning-user-page',
          page_title: 'Returning User Page'
        }
      ])
      .execute();

    const filters: AnalyticsFilters = {
      is_new_user: false
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(1);
    expect(result[0].page_url).toEqual('/returning-user-page');
  });

  it('should apply multiple filters correctly', async () => {
    // Create sessions
    const session1Result = await db.insert(userSessionsTable)
      .values({ 
        ...testSession, 
        country: 'US', 
        device_type: 'desktop',
        is_new_user: true 
      })
      .returning()
      .execute();

    const session2Result = await db.insert(userSessionsTable)
      .values({ 
        ...testSession2, 
        country: 'US', 
        device_type: 'mobile',
        is_new_user: true 
      })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create page views
    await db.insert(pageViewsTable)
      .values([
        {
          session_id: session1Id,
          page_url: '/target-page',
          page_title: 'Target Page',
          entry_time: new Date('2024-01-01T10:00:00Z')
        },
        {
          session_id: session2Id,
          page_url: '/target-page',
          page_title: 'Target Page',
          entry_time: new Date('2024-01-01T11:00:00Z')
        },
        {
          session_id: session1Id,
          page_url: '/other-page',
          page_title: 'Other Page',
          entry_time: new Date('2024-01-01T12:00:00Z')
        }
      ])
      .execute();

    // Apply multiple filters
    const filters: AnalyticsFilters = {
      country: 'US',
      device_type: 'desktop',
      page_url: '/target-page',
      start_date: new Date('2024-01-01T00:00:00Z'),
      end_date: new Date('2024-01-01T23:59:59Z')
    };

    const result = await getPageViews(filters);

    expect(result).toHaveLength(1);
    expect(result[0].page_url).toEqual('/target-page');
    expect(result[0].page_title).toEqual('Target Page');
    expect(result[0].entry_time).toBeInstanceOf(Date);
  });

  it('should handle empty results with filters', async () => {
    // Create session and page view
    const sessionResult = await db.insert(userSessionsTable)
      .values(testSession)
      .returning()
      .execute();

    await db.insert(pageViewsTable)
      .values({
        session_id: sessionResult[0].id,
        page_url: '/home',
        page_title: 'Home Page'
      })
      .execute();

    // Filter that should return no results
    const filters: AnalyticsFilters = {
      country: 'NonExistentCountry'
    };

    const result = await getPageViews(filters);
    expect(result).toEqual([]);
  });
});