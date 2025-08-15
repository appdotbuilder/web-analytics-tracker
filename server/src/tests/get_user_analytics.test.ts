import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userAnalyticsTable } from '../db/schema';
import { type AnalyticsFilters } from '../schema';
import { getUserAnalytics } from '../handlers/get_user_analytics';

describe('getUserAnalytics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no analytics data exists', async () => {
    const result = await getUserAnalytics();
    expect(result).toEqual([]);
  });

  it('should return all user analytics without filters', async () => {
    // Create test analytics data
    const testAnalytics1 = {
      user_id: 'user1',
      total_sessions: 5,
      total_page_views: 20,
      total_time_spent: 1800, // 30 minutes
      first_visit: new Date('2024-01-01'),
      last_visit: new Date('2024-01-05'),
      page_views_per_session: '4.00',
      average_session_duration: '360.00' // 6 minutes
    };

    const testAnalytics2 = {
      user_id: 'user2',
      total_sessions: 3,
      total_page_views: 9,
      total_time_spent: 900, // 15 minutes
      first_visit: new Date('2024-01-02'),
      last_visit: new Date('2024-01-04'),
      page_views_per_session: '3.00',
      average_session_duration: '300.00' // 5 minutes
    };

    await db.insert(userAnalyticsTable).values([testAnalytics1, testAnalytics2]);

    const result = await getUserAnalytics();

    expect(result).toHaveLength(2);
    
    // Verify first analytics record
    const analytics1 = result.find(a => a.user_id === 'user1');
    expect(analytics1).toBeDefined();
    expect(analytics1!.total_sessions).toEqual(5);
    expect(analytics1!.total_page_views).toEqual(20);
    expect(analytics1!.total_time_spent).toEqual(1800);
    expect(analytics1!.page_views_per_session).toEqual(4.00);
    expect(analytics1!.average_session_duration).toEqual(360.00);
    expect(typeof analytics1!.page_views_per_session).toBe('number');
    expect(typeof analytics1!.average_session_duration).toBe('number');
    expect(analytics1!.first_visit).toBeInstanceOf(Date);
    expect(analytics1!.last_visit).toBeInstanceOf(Date);

    // Verify second analytics record
    const analytics2 = result.find(a => a.user_id === 'user2');
    expect(analytics2).toBeDefined();
    expect(analytics2!.total_sessions).toEqual(3);
    expect(analytics2!.total_page_views).toEqual(9);
    expect(analytics2!.total_time_spent).toEqual(900);
    expect(analytics2!.page_views_per_session).toEqual(3.00);
    expect(analytics2!.average_session_duration).toEqual(300.00);
  });

  it('should filter analytics by start date', async () => {
    // Create analytics data with different last visit dates
    const oldAnalytics = {
      user_id: 'old_user',
      total_sessions: 2,
      total_page_views: 8,
      total_time_spent: 600,
      first_visit: new Date('2023-12-01'),
      last_visit: new Date('2023-12-31'),
      page_views_per_session: '4.00',
      average_session_duration: '300.00'
    };

    const newAnalytics = {
      user_id: 'new_user',
      total_sessions: 3,
      total_page_views: 12,
      total_time_spent: 900,
      first_visit: new Date('2024-01-15'),
      last_visit: new Date('2024-01-20'),
      page_views_per_session: '4.00',
      average_session_duration: '300.00'
    };

    await db.insert(userAnalyticsTable).values([oldAnalytics, newAnalytics]);

    const filters: AnalyticsFilters = {
      start_date: new Date('2024-01-01')
    };

    const result = await getUserAnalytics(filters);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('new_user');
    expect(result[0].last_visit >= filters.start_date!).toBe(true);
  });

  it('should filter analytics by end date', async () => {
    // Create analytics data with different first visit dates
    const earlyAnalytics = {
      user_id: 'early_user',
      total_sessions: 4,
      total_page_views: 16,
      total_time_spent: 1200,
      first_visit: new Date('2024-01-01'),
      last_visit: new Date('2024-01-10'),
      page_views_per_session: '4.00',
      average_session_duration: '300.00'
    };

    const lateAnalytics = {
      user_id: 'late_user',
      total_sessions: 2,
      total_page_views: 6,
      total_time_spent: 400,
      first_visit: new Date('2024-02-01'),
      last_visit: new Date('2024-02-05'),
      page_views_per_session: '3.00',
      average_session_duration: '200.00'
    };

    await db.insert(userAnalyticsTable).values([earlyAnalytics, lateAnalytics]);

    const filters: AnalyticsFilters = {
      end_date: new Date('2024-01-15')
    };

    const result = await getUserAnalytics(filters);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('early_user');
    expect(result[0].first_visit <= filters.end_date!).toBe(true);
  });

  it('should filter analytics by date range', async () => {
    const beforeRangeAnalytics = {
      user_id: 'before_range',
      total_sessions: 1,
      total_page_views: 3,
      total_time_spent: 180,
      first_visit: new Date('2023-12-01'),
      last_visit: new Date('2023-12-31'),
      page_views_per_session: '3.00',
      average_session_duration: '180.00'
    };

    const inRangeAnalytics = {
      user_id: 'in_range',
      total_sessions: 5,
      total_page_views: 25,
      total_time_spent: 2500,
      first_visit: new Date('2024-01-05'),
      last_visit: new Date('2024-01-15'),
      page_views_per_session: '5.00',
      average_session_duration: '500.00'
    };

    const afterRangeAnalytics = {
      user_id: 'after_range',
      total_sessions: 2,
      total_page_views: 8,
      total_time_spent: 400,
      first_visit: new Date('2024-02-01'),
      last_visit: new Date('2024-02-10'),
      page_views_per_session: '4.00',
      average_session_duration: '200.00'
    };

    await db.insert(userAnalyticsTable).values([
      beforeRangeAnalytics,
      inRangeAnalytics,
      afterRangeAnalytics
    ]);

    const filters: AnalyticsFilters = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getUserAnalytics(filters);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('in_range');
    expect(result[0].last_visit >= filters.start_date!).toBe(true);
    expect(result[0].first_visit <= filters.end_date!).toBe(true);
  });

  it('should handle analytics with zero values correctly', async () => {
    const zeroAnalytics = {
      user_id: 'zero_user',
      total_sessions: 0,
      total_page_views: 0,
      total_time_spent: 0,
      first_visit: new Date('2024-01-01'),
      last_visit: new Date('2024-01-01'),
      page_views_per_session: '0.00',
      average_session_duration: '0.00'
    };

    await db.insert(userAnalyticsTable).values(zeroAnalytics);

    const result = await getUserAnalytics();

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('zero_user');
    expect(result[0].total_sessions).toEqual(0);
    expect(result[0].total_page_views).toEqual(0);
    expect(result[0].total_time_spent).toEqual(0);
    expect(result[0].page_views_per_session).toEqual(0.00);
    expect(result[0].average_session_duration).toEqual(0.00);
  });

  it('should handle decimal precision in numeric fields', async () => {
    const precisionAnalytics = {
      user_id: 'precision_user',
      total_sessions: 7,
      total_page_views: 23,
      total_time_spent: 4567,
      first_visit: new Date('2024-01-01'),
      last_visit: new Date('2024-01-07'),
      page_views_per_session: '3.29', // 23/7 ≈ 3.29
      average_session_duration: '652.43' // 4567/7 ≈ 652.43
    };

    await db.insert(userAnalyticsTable).values(precisionAnalytics);

    const result = await getUserAnalytics();

    expect(result).toHaveLength(1);
    expect(result[0].page_views_per_session).toBeCloseTo(3.29, 2);
    expect(result[0].average_session_duration).toBeCloseTo(652.43, 2);
    expect(typeof result[0].page_views_per_session).toBe('number');
    expect(typeof result[0].average_session_duration).toBe('number');
  });

  it('should return empty array when date filters exclude all records', async () => {
    const testAnalytics = {
      user_id: 'test_user',
      total_sessions: 3,
      total_page_views: 12,
      total_time_spent: 900,
      first_visit: new Date('2024-01-01'),
      last_visit: new Date('2024-01-05'),
      page_views_per_session: '4.00',
      average_session_duration: '300.00'
    };

    await db.insert(userAnalyticsTable).values(testAnalytics);

    // Filter with dates that exclude all records
    const filters: AnalyticsFilters = {
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28')
    };

    const result = await getUserAnalytics(filters);
    expect(result).toEqual([]);
  });
});