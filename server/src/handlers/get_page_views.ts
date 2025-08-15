import { db } from '../db';
import { pageViewsTable, userSessionsTable } from '../db/schema';
import { type PageView, type AnalyticsFilters } from '../schema';
import { eq, and, gte, lte, SQL } from 'drizzle-orm';

export async function getPageViews(filters?: AnalyticsFilters): Promise<PageView[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Determine if we need to join with sessions table
    const needsJoin = filters && (filters.country || filters.device_type || filters.is_new_user !== undefined);

    if (filters) {
      // Date range filtering on entry_time
      if (filters.start_date) {
        conditions.push(gte(pageViewsTable.entry_time, filters.start_date));
      }

      if (filters.end_date) {
        conditions.push(lte(pageViewsTable.entry_time, filters.end_date));
      }

      // Page URL filtering
      if (filters.page_url) {
        conditions.push(eq(pageViewsTable.page_url, filters.page_url));
      }

      // Session-related filters
      if (filters.country) {
        conditions.push(eq(userSessionsTable.country, filters.country));
      }

      if (filters.device_type) {
        conditions.push(eq(userSessionsTable.device_type, filters.device_type));
      }

      if (filters.is_new_user !== undefined) {
        conditions.push(eq(userSessionsTable.is_new_user, filters.is_new_user));
      }
    }

    let results;

    if (needsJoin) {
      // Build query with join and conditions in one go to avoid type reassignment
      const whereClause = conditions.length > 0
        ? (conditions.length === 1 ? conditions[0] : and(...conditions))
        : undefined;

      const joinResults = await (whereClause
        ? db.select()
            .from(pageViewsTable)
            .innerJoin(userSessionsTable, eq(pageViewsTable.session_id, userSessionsTable.id))
            .where(whereClause)
            .execute()
        : db.select()
            .from(pageViewsTable)
            .innerJoin(userSessionsTable, eq(pageViewsTable.session_id, userSessionsTable.id))
            .execute()
      );

      results = joinResults.map(result => (result as any).page_views);
    } else {
      // Build query without join and conditions in one go
      const whereClause = conditions.length > 0
        ? (conditions.length === 1 ? conditions[0] : and(...conditions))
        : undefined;

      results = await (whereClause
        ? db.select().from(pageViewsTable).where(whereClause).execute()
        : db.select().from(pageViewsTable).execute()
      );
    }

    return results.map(pageViewData => ({
      ...pageViewData,
      // Ensure timestamps are properly handled (they should already be Date objects from Drizzle)
      entry_time: pageViewData.entry_time,
      exit_time: pageViewData.exit_time,
      created_at: pageViewData.created_at
    }));
  } catch (error) {
    console.error('Failed to get page views:', error);
    throw error;
  }
}