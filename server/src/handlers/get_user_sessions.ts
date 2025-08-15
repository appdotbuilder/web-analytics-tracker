import { db } from '../db';
import { userSessionsTable } from '../db/schema';
import { type UserSession, type AnalyticsFilters } from '../schema';
import { and, gte, lte, eq, type SQL } from 'drizzle-orm';

export const getUserSessions = async (filters?: AnalyticsFilters): Promise<UserSession[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters) {
      // Date range filters
      if (filters.start_date) {
        conditions.push(gte(userSessionsTable.created_at, filters.start_date));
      }

      if (filters.end_date) {
        conditions.push(lte(userSessionsTable.created_at, filters.end_date));
      }

      // Country filter
      if (filters.country) {
        conditions.push(eq(userSessionsTable.country, filters.country));
      }

      // Device type filter
      if (filters.device_type) {
        conditions.push(eq(userSessionsTable.device_type, filters.device_type));
      }

      // New user filter
      if (filters.is_new_user !== undefined) {
        conditions.push(eq(userSessionsTable.is_new_user, filters.is_new_user));
      }
    }

    // Build final query with all conditions and ordering
    const baseQuery = db.select().from(userSessionsTable);
    
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)).orderBy(userSessionsTable.created_at)
      : baseQuery.orderBy(userSessionsTable.created_at);

    const results = await finalQuery.execute();

    // Convert numeric fields back to numbers
    return results.map(session => ({
      ...session,
      latitude: session.latitude ? parseFloat(session.latitude) : null,
      longitude: session.longitude ? parseFloat(session.longitude) : null
    }));
  } catch (error) {
    console.error('Get user sessions failed:', error);
    throw error;
  }
};