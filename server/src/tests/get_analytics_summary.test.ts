import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSessionsTable, pageViewsTable } from '../db/schema';
import { type AnalyticsFilters } from '../schema';
import { getAnalyticsSummary } from '../handlers/get_analytics_summary';

describe('getAnalyticsSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create user sessions
    const sessions = await db.insert(userSessionsTable)
      .values([
        {
          user_id: 'user1',
          is_new_user: true,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          device_type: 'desktop',
          operating_system: 'Windows',
          browser: 'Chrome',
          country: 'USA',
          city: 'New York',
          latitude: '40.7128',
          longitude: '-74.0060',
          referrer: 'https://google.com',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          user_id: 'user1',
          is_new_user: false,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
          device_type: 'mobile',
          operating_system: 'iOS',
          browser: 'Safari',
          country: 'USA',
          city: 'New York',
          latitude: '40.7128',
          longitude: '-74.0060',
          referrer: null,
          created_at: new Date('2024-01-16T14:30:00Z')
        },
        {
          user_id: 'user2',
          is_new_user: true,
          ip_address: '192.168.1.2',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          device_type: 'desktop',
          operating_system: 'macOS',
          browser: 'Firefox',
          country: 'Canada',
          city: 'Toronto',
          latitude: '43.6532',
          longitude: '-79.3832',
          referrer: 'https://twitter.com',
          created_at: new Date('2024-01-17T09:15:00Z')
        },
        {
          user_id: 'user3',
          is_new_user: true,
          ip_address: '192.168.1.3',
          user_agent: 'Mozilla/5.0 (iPad; CPU OS 17_0)',
          device_type: 'tablet',
          operating_system: 'iOS',
          browser: 'Safari',
          country: 'UK',
          city: 'London',
          latitude: '51.5074',
          longitude: '-0.1278',
          referrer: 'https://facebook.com',
          created_at: new Date('2024-01-18T16:45:00Z')
        }
      ])
      .returning()
      .execute();

    // Create page views
    await db.insert(pageViewsTable)
      .values([
        // User1 Session1 - Multiple pages (not bounce)
        {
          session_id: sessions[0].id,
          page_url: '/home',
          page_title: 'Home Page',
          entry_time: new Date('2024-01-15T10:00:00Z'),
          exit_time: new Date('2024-01-15T10:02:30Z'),
          time_spent: 150
        },
        {
          session_id: sessions[0].id,
          page_url: '/products',
          page_title: 'Products',
          entry_time: new Date('2024-01-15T10:02:30Z'),
          exit_time: new Date('2024-01-15T10:05:00Z'),
          time_spent: 150
        },
        {
          session_id: sessions[0].id,
          page_url: '/about',
          page_title: 'About Us',
          entry_time: new Date('2024-01-15T10:05:00Z'),
          exit_time: new Date('2024-01-15T10:06:30Z'),
          time_spent: 90
        },
        // User1 Session2 - Single page (bounce)
        {
          session_id: sessions[1].id,
          page_url: '/home',
          page_title: 'Home Page',
          entry_time: new Date('2024-01-16T14:30:00Z'),
          exit_time: new Date('2024-01-16T14:30:30Z'),
          time_spent: 30
        },
        // User2 Session1 - Multiple pages
        {
          session_id: sessions[2].id,
          page_url: '/products',
          page_title: 'Products',
          entry_time: new Date('2024-01-17T09:15:00Z'),
          exit_time: new Date('2024-01-17T09:18:00Z'),
          time_spent: 180
        },
        {
          session_id: sessions[2].id,
          page_url: '/contact',
          page_title: 'Contact Us',
          entry_time: new Date('2024-01-17T09:18:00Z'),
          exit_time: new Date('2024-01-17T09:20:00Z'),
          time_spent: 120
        },
        // User3 Session1 - Single page (bounce)
        {
          session_id: sessions[3].id,
          page_url: '/home',
          page_title: 'Home Page',
          entry_time: new Date('2024-01-18T16:45:00Z'),
          exit_time: new Date('2024-01-18T16:45:15Z'),
          time_spent: 15
        }
      ])
      .execute();

    return sessions;
  };

  it('should return comprehensive analytics summary without filters', async () => {
    await createTestData();

    const result = await getAnalyticsSummary();

    // Basic metrics
    expect(result.total_users).toEqual(3);
    expect(result.total_sessions).toEqual(4);
    expect(result.total_page_views).toEqual(7);
    expect(result.new_users).toEqual(3);
    expect(result.returning_users).toEqual(1);

    // Average session duration
    expect(typeof result.average_session_duration).toBe('number');
    expect(result.average_session_duration).toBeGreaterThan(0);

    // Bounce rate (2 bounce sessions out of 4 total = 50%)
    expect(result.bounce_rate).toEqual(50);

    // Top pages
    expect(result.top_pages).toHaveLength(4);
    const homePage = result.top_pages.find(p => p.page_url === '/home');
    expect(homePage).toBeDefined();
    expect(homePage!.views).toEqual(3);
    expect(homePage!.unique_views).toEqual(3);

    // Top countries
    expect(result.top_countries).toHaveLength(3);
    const usaCountry = result.top_countries.find(c => c.country === 'USA');
    expect(usaCountry).toBeDefined();
    expect(usaCountry!.users).toEqual(1);
    expect(usaCountry!.sessions).toEqual(2);

    // Device breakdown
    expect(result.device_breakdown.desktop).toEqual(2);
    expect(result.device_breakdown.mobile).toEqual(1);
    expect(result.device_breakdown.tablet).toEqual(1);

    // Browser breakdown
    expect(result.browser_breakdown).toHaveLength(3);
    const chromeStats = result.browser_breakdown.find(b => b.browser === 'Chrome');
    expect(chromeStats).toBeDefined();
    expect(chromeStats!.users).toEqual(1);
    expect(typeof chromeStats!.percentage).toBe('number');
  });

  it('should filter by date range correctly', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      start_date: new Date('2024-01-16T00:00:00Z'),
      end_date: new Date('2024-01-17T23:59:59Z')
    };

    const result = await getAnalyticsSummary(filters);

    // Should only include sessions from Jan 16-17
    expect(result.total_users).toEqual(2); // user1 and user2
    expect(result.total_sessions).toEqual(2);
    expect(result.total_page_views).toEqual(3); // 1 from user1, 2 from user2
  });

  it('should filter by country correctly', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      country: 'USA'
    };

    const result = await getAnalyticsSummary(filters);

    expect(result.total_users).toEqual(1);
    expect(result.total_sessions).toEqual(2);
    // When filtering by country, top_countries will still only show that filtered country
    expect(result.top_countries).toHaveLength(1);
    expect(result.top_countries[0].country).toEqual('USA');
  });

  it('should filter by device type correctly', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      device_type: 'desktop'
    };

    const result = await getAnalyticsSummary(filters);

    expect(result.total_sessions).toEqual(2); // 2 desktop sessions
    expect(result.device_breakdown.desktop).toEqual(2);
    expect(result.device_breakdown.mobile).toEqual(0);
    expect(result.device_breakdown.tablet).toEqual(0);
  });

  it('should filter by new users correctly', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      is_new_user: true
    };

    const result = await getAnalyticsSummary(filters);

    expect(result.new_users).toEqual(3);
    expect(result.returning_users).toEqual(0);
    expect(result.total_sessions).toEqual(3); // Only new user sessions
  });

  it('should filter by page URL correctly', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      page_url: '/home'
    };

    const result = await getAnalyticsSummary(filters);

    // Should still show overall session/user metrics, but top_pages filtered
    expect(result.top_pages).toHaveLength(1);
    expect(result.top_pages[0].page_url).toEqual('/home');
    expect(result.top_pages[0].views).toEqual(3);
  });

  it('should handle multiple filters combined', async () => {
    await createTestData();

    const filters: AnalyticsFilters = {
      start_date: new Date('2024-01-15T00:00:00Z'),
      end_date: new Date('2024-01-16T23:59:59Z'),
      country: 'USA',
      device_type: 'desktop'
    };

    const result = await getAnalyticsSummary(filters);

    // Should only match user1's first session (desktop, USA, in date range)
    expect(result.total_users).toEqual(1);
    expect(result.total_sessions).toEqual(1);
    expect(result.device_breakdown.desktop).toEqual(1);
    expect(result.device_breakdown.mobile).toEqual(0);
    expect(result.device_breakdown.tablet).toEqual(0);
    // Should have USA in top countries
    expect(result.top_countries).toHaveLength(1);
    expect(result.top_countries[0].country).toEqual('USA');
  });

  it('should handle empty database correctly', async () => {
    const result = await getAnalyticsSummary();

    expect(result.total_users).toEqual(0);
    expect(result.total_sessions).toEqual(0);
    expect(result.total_page_views).toEqual(0);
    expect(result.new_users).toEqual(0);
    expect(result.returning_users).toEqual(0);
    expect(result.average_session_duration).toEqual(0);
    expect(result.bounce_rate).toEqual(0);
    expect(result.top_pages).toHaveLength(0);
    expect(result.top_countries).toHaveLength(0);
    expect(result.device_breakdown.desktop).toEqual(0);
    expect(result.device_breakdown.mobile).toEqual(0);
    expect(result.device_breakdown.tablet).toEqual(0);
    expect(result.browser_breakdown).toHaveLength(0);
  });

  it('should calculate bounce rate correctly', async () => {
    await createTestData();

    const result = await getAnalyticsSummary();

    // We have 2 bounce sessions (user1 session2, user3 session1) out of 4 total
    expect(result.bounce_rate).toEqual(50);
  });

  it('should handle null country values correctly', async () => {
    // Create session with null country
    await db.insert(userSessionsTable)
      .values({
        user_id: 'user_no_country',
        is_new_user: true,
        ip_address: '192.168.1.99',
        user_agent: 'Mozilla/5.0 Test',
        device_type: 'desktop',
        operating_system: 'Linux',
        browser: 'Chrome',
        country: null, // Explicitly null
        city: null,
        latitude: null,
        longitude: null,
        referrer: null
      })
      .execute();

    const result = await getAnalyticsSummary();

    expect(result.total_users).toEqual(1);
    expect(result.total_sessions).toEqual(1);
    // Should not include null countries in top_countries
    expect(result.top_countries).toHaveLength(0);
  });

  it('should calculate browser percentages correctly', async () => {
    await createTestData();

    const result = await getAnalyticsSummary();

    // Looking at test data:
    // user1 session1: Chrome
    // user1 session2: Safari  
    // user2 session1: Firefox
    // user3 session1: Safari
    // 
    // Browser user counts: Chrome(1), Firefox(1), Safari(2)
    // Total unique browser users: 4 (because we count user1 for both Chrome and Safari)
    // Percentages: Chrome 25%, Firefox 25%, Safari 50%
    expect(result.browser_breakdown).toHaveLength(3);
    
    const safariStats = result.browser_breakdown.find(b => b.browser === 'Safari');
    const chromeStats = result.browser_breakdown.find(b => b.browser === 'Chrome');
    const firefoxStats = result.browser_breakdown.find(b => b.browser === 'Firefox');
    
    expect(safariStats?.users).toEqual(2); // user1 and user3
    expect(chromeStats?.users).toEqual(1); // user1 
    expect(firefoxStats?.users).toEqual(1); // user2

    expect(safariStats?.percentage).toBeCloseTo(50, 1);
    expect(chromeStats?.percentage).toBeCloseTo(25, 1);
    expect(firefoxStats?.percentage).toBeCloseTo(25, 1);

    // Total percentage should sum to 100
    const totalPercentage = result.browser_breakdown.reduce((sum, browser) => sum + browser.percentage, 0);
    expect(totalPercentage).toBeCloseTo(100, 1);
  });
});