import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSessionsTable } from '../db/schema';
import { type AnalyticsFilters } from '../schema';
import { getUserSessions } from '../handlers/get_user_sessions';

// Test data for sessions
const testSession1 = {
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
  referrer: 'https://google.com'
};

const testSession2 = {
  user_id: 'user2',
  is_new_user: false,
  ip_address: '192.168.1.2',
  user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  device_type: 'mobile',
  operating_system: 'iOS',
  browser: 'Safari',
  country: 'Canada',
  city: 'Toronto',
  latitude: '43.6532',
  longitude: '-79.3832',
  referrer: null
};

const testSession3 = {
  user_id: 'user3',
  is_new_user: true,
  ip_address: '192.168.1.3',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  device_type: 'desktop',
  operating_system: 'macOS',
  browser: 'Safari',
  country: 'USA',
  city: 'San Francisco',
  latitude: '37.7749',
  longitude: '-122.4194',
  referrer: 'https://twitter.com'
};

describe('getUserSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all sessions when no filters provided', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const result = await getUserSessions();

    expect(result).toHaveLength(3);
    expect(result[0].user_id).toBeDefined();
    expect(result[0].device_type).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter by country', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const filters: AnalyticsFilters = {
      country: 'USA'
    };

    const result = await getUserSessions(filters);

    expect(result).toHaveLength(2);
    result.forEach(session => {
      expect(session.country).toEqual('USA');
    });
  });

  it('should filter by device type', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const filters: AnalyticsFilters = {
      device_type: 'mobile'
    };

    const result = await getUserSessions(filters);

    expect(result).toHaveLength(1);
    expect(result[0].device_type).toEqual('mobile');
    expect(result[0].user_id).toEqual('user2');
  });

  it('should filter by new user status', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const filters: AnalyticsFilters = {
      is_new_user: true
    };

    const result = await getUserSessions(filters);

    expect(result).toHaveLength(2);
    result.forEach(session => {
      expect(session.is_new_user).toBe(true);
    });
  });

  it('should filter by date range', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filters: AnalyticsFilters = {
      start_date: yesterday,
      end_date: tomorrow
    };

    const result = await getUserSessions(filters);

    expect(result.length).toBeGreaterThan(0);
    result.forEach(session => {
      expect(session.created_at >= yesterday).toBe(true);
      expect(session.created_at <= tomorrow).toBe(true);
    });
  });

  it('should apply multiple filters correctly', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2,
      testSession3
    ]).execute();

    const filters: AnalyticsFilters = {
      country: 'USA',
      device_type: 'desktop',
      is_new_user: true
    };

    const result = await getUserSessions(filters);

    expect(result).toHaveLength(2);
    result.forEach(session => {
      expect(session.country).toEqual('USA');
      expect(session.device_type).toEqual('desktop');
      expect(session.is_new_user).toBe(true);
    });
  });

  it('should convert numeric coordinates correctly', async () => {
    // Insert test session with coordinates
    await db.insert(userSessionsTable).values([testSession1]).execute();

    const result = await getUserSessions();

    expect(result).toHaveLength(1);
    expect(typeof result[0].latitude).toBe('number');
    expect(typeof result[0].longitude).toBe('number');
    expect(result[0].latitude).toEqual(40.7128);
    expect(result[0].longitude).toEqual(-74.0060);
  });

  it('should handle null coordinates correctly', async () => {
    const sessionWithoutCoords = {
      ...testSession1,
      latitude: null,
      longitude: null
    };

    await db.insert(userSessionsTable).values([sessionWithoutCoords]).execute();

    const result = await getUserSessions();

    expect(result).toHaveLength(1);
    expect(result[0].latitude).toBeNull();
    expect(result[0].longitude).toBeNull();
  });

  it('should return empty array when no sessions match filters', async () => {
    // Insert test sessions
    await db.insert(userSessionsTable).values([
      testSession1,
      testSession2
    ]).execute();

    const filters: AnalyticsFilters = {
      country: 'Germany'
    };

    const result = await getUserSessions(filters);

    expect(result).toHaveLength(0);
  });

  it('should include all session fields in response', async () => {
    await db.insert(userSessionsTable).values([testSession1]).execute();

    const result = await getUserSessions();

    expect(result).toHaveLength(1);
    const session = result[0];

    // Check all required fields are present
    expect(session.id).toBeDefined();
    expect(session.user_id).toEqual('user1');
    expect(session.is_new_user).toBe(true);
    expect(session.ip_address).toEqual('192.168.1.1');
    expect(session.user_agent).toBeDefined();
    expect(session.device_type).toEqual('desktop');
    expect(session.operating_system).toEqual('Windows');
    expect(session.browser).toEqual('Chrome');
    expect(session.country).toEqual('USA');
    expect(session.city).toEqual('New York');
    expect(session.referrer).toEqual('https://google.com');
    expect(session.created_at).toBeInstanceOf(Date);
    expect(session.updated_at).toBeInstanceOf(Date);
  });
});