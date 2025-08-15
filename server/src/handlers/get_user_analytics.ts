import { db } from '../db';
import { userAnalyticsTable } from '../db/schema';
import { type UserAnalytics, type AnalyticsFilters } from '../schema';
import { and, gte, lte, eq, SQL } from 'drizzle-orm';

export async function getUserAnalytics(filters?: AnalyticsFilters): Promise<UserAnalytics[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters) {
      // Filter by date range (first_visit and last_visit)
      if (filters.start_date) {
        conditions.push(gte(userAnalyticsTable.last_visit, filters.start_date));
      }

      if (filters.end_date) {
        conditions.push(lte(userAnalyticsTable.first_visit, filters.end_date));
      }
    }

    // Build and execute query based on whether we have conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(userAnalyticsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(userAnalyticsTable)
          .execute();

    // Convert numeric fields from strings to numbers
    return results.map(analytics => ({
      ...analytics,
      page_views_per_session: parseFloat(analytics.page_views_per_session),
      average_session_duration: parseFloat(analytics.average_session_duration)
    }));
  } catch (error) {
    console.error('Failed to get user analytics:', error);
    throw error;
  }
}