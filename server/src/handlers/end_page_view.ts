import { db } from '../db';
import { pageViewsTable, userAnalyticsTable, userSessionsTable } from '../db/schema';
import { type EndPageViewInput, type PageView } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const endPageView = async (input: EndPageViewInput): Promise<PageView> => {
  try {
    // First, get the existing page view record
    const existingPageViews = await db.select()
      .from(pageViewsTable)
      .where(eq(pageViewsTable.id, input.page_view_id))
      .execute();

    if (existingPageViews.length === 0) {
      throw new Error(`Page view with id ${input.page_view_id} not found`);
    }

    const existingPageView = existingPageViews[0];

    // Calculate time spent (in seconds)
    const entryTime = new Date(existingPageView.entry_time);
    const exitTime = new Date(input.exit_time);
    const timeSpentSeconds = Math.max(0, Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000));

    // Update the page view record with exit time and calculated time spent
    const updatedPageViews = await db.update(pageViewsTable)
      .set({
        exit_time: input.exit_time,
        time_spent: timeSpentSeconds
      })
      .where(eq(pageViewsTable.id, input.page_view_id))
      .returning()
      .execute();

    const updatedPageView = updatedPageViews[0];

    // Get the session associated with this page view to find the user_id
    const sessions = await db.select()
      .from(userSessionsTable)
      .where(eq(userSessionsTable.id, updatedPageView.session_id))
      .execute();

    if (sessions.length === 0) {
      throw new Error(`Session with id ${updatedPageView.session_id} not found`);
    }

    const session = sessions[0];
    const userId = session.user_id;

    // Update user analytics with the new time spent data
    // First, try to get existing user analytics record
    const existingAnalytics = await db.select()
      .from(userAnalyticsTable)
      .where(eq(userAnalyticsTable.user_id, userId))
      .execute();

    if (existingAnalytics.length > 0) {
      // Update existing analytics record
      const currentAnalytics = existingAnalytics[0];
      
      // Calculate new totals
      const newTotalTimeSpent = currentAnalytics.total_time_spent + timeSpentSeconds;
      const newAverageSessionDuration = parseFloat(currentAnalytics.average_session_duration) + 
        (timeSpentSeconds / currentAnalytics.total_sessions);

      await db.update(userAnalyticsTable)
        .set({
          total_time_spent: newTotalTimeSpent,
          average_session_duration: newAverageSessionDuration.toString(),
          last_visit: input.exit_time,
          updated_at: new Date()
        })
        .where(eq(userAnalyticsTable.user_id, userId))
        .execute();
    }
    // Note: If no analytics record exists, it will be created by other handlers (track_event)

    // Return the updated page view
    return updatedPageView;
  } catch (error) {
    console.error('End page view failed:', error);
    throw error;
  }
};