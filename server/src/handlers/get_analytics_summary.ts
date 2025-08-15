import { db } from '../db';
import { userSessionsTable, pageViewsTable } from '../db/schema';
import { type AnalyticsFilters, type AnalyticsSummary } from '../schema';
import { and, gte, lte, eq, count, countDistinct, avg, sql, desc, SQL } from 'drizzle-orm';

export async function getAnalyticsSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
  try {
    // Build base conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filters?.start_date) {
      conditions.push(gte(userSessionsTable.created_at, filters.start_date));
    }

    if (filters?.end_date) {
      conditions.push(lte(userSessionsTable.created_at, filters.end_date));
    }

    if (filters?.country) {
      conditions.push(eq(userSessionsTable.country, filters.country));
    }

    if (filters?.device_type) {
      conditions.push(eq(userSessionsTable.device_type, filters.device_type));
    }

    if (filters?.is_new_user !== undefined) {
      conditions.push(eq(userSessionsTable.is_new_user, filters.is_new_user));
    }

    // 1. Get basic user and session metrics
    const basicQuery = db.select({
      total_users: countDistinct(userSessionsTable.user_id),
      total_sessions: count(userSessionsTable.id),
      new_users: count(sql`CASE WHEN ${userSessionsTable.is_new_user} = true THEN 1 END`),
      returning_users: count(sql`CASE WHEN ${userSessionsTable.is_new_user} = false THEN 1 END`)
    })
    .from(userSessionsTable);

    const [basicMetrics] = await (conditions.length > 0 
      ? basicQuery.where(and(...conditions)) 
      : basicQuery)
      .execute();

    // 2. Get page view metrics with session filtering
    const pageViewBaseQuery = db.select({
      total_page_views: count(pageViewsTable.id),
      avg_session_duration: avg(pageViewsTable.time_spent),
      bounce_sessions: count(sql`CASE WHEN page_count.count = 1 THEN 1 END`)
    })
    .from(pageViewsTable)
    .innerJoin(userSessionsTable, eq(pageViewsTable.session_id, userSessionsTable.id))
    .innerJoin(
      db.select({
        session_id: pageViewsTable.session_id,
        count: count(pageViewsTable.id).as('count')
      })
      .from(pageViewsTable)
      .groupBy(pageViewsTable.session_id)
      .as('page_count'),
      eq(pageViewsTable.session_id, sql`page_count.session_id`)
    );

    const [pageViewMetrics] = await (conditions.length > 0 
      ? pageViewBaseQuery.where(and(...conditions)) 
      : pageViewBaseQuery)
      .execute();

    // 3. Get top pages
    const pageConditions: SQL<unknown>[] = [...conditions];
    if (filters?.page_url) {
      pageConditions.push(eq(pageViewsTable.page_url, filters.page_url));
    }

    const topPagesBaseQuery = db.select({
      page_url: pageViewsTable.page_url,
      views: count(pageViewsTable.id),
      unique_views: countDistinct(pageViewsTable.session_id)
    })
    .from(pageViewsTable)
    .innerJoin(userSessionsTable, eq(pageViewsTable.session_id, userSessionsTable.id));

    const topPages = await (pageConditions.length > 0 
      ? topPagesBaseQuery.where(and(...pageConditions))
      : topPagesBaseQuery)
      .groupBy(pageViewsTable.page_url)
      .orderBy(desc(count(pageViewsTable.id)))
      .limit(10)
      .execute();

    // 4. Get top countries
    const countryConditions = [...conditions, sql`${userSessionsTable.country} IS NOT NULL`];
    
    const topCountriesBaseQuery = db.select({
      country: userSessionsTable.country,
      users: countDistinct(userSessionsTable.user_id),
      sessions: count(userSessionsTable.id)
    })
    .from(userSessionsTable);

    const topCountries = await topCountriesBaseQuery
      .where(and(...countryConditions))
      .groupBy(userSessionsTable.country)
      .orderBy(desc(countDistinct(userSessionsTable.user_id)))
      .limit(10)
      .execute();

    // 5. Get device breakdown
    const deviceBaseQuery = db.select({
      device_type: userSessionsTable.device_type,
      count: count(userSessionsTable.id)
    })
    .from(userSessionsTable);

    const deviceData = await (conditions.length > 0 
      ? deviceBaseQuery.where(and(...conditions))
      : deviceBaseQuery)
      .groupBy(userSessionsTable.device_type)
      .execute();

    // 6. Get browser breakdown
    const browserBaseQuery = db.select({
      browser: userSessionsTable.browser,
      users: countDistinct(userSessionsTable.user_id)
    })
    .from(userSessionsTable);

    const browserData = await (conditions.length > 0 
      ? browserBaseQuery.where(and(...conditions))
      : browserBaseQuery)
      .groupBy(userSessionsTable.browser)
      .orderBy(desc(countDistinct(userSessionsTable.user_id)))
      .limit(10)
      .execute();

    // Process device breakdown
    const deviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0
    };

    deviceData.forEach(device => {
      const deviceType = device.device_type.toLowerCase();
      if (deviceType === 'desktop') {
        deviceBreakdown.desktop = device.count;
      } else if (deviceType === 'mobile') {
        deviceBreakdown.mobile = device.count;
      } else if (deviceType === 'tablet') {
        deviceBreakdown.tablet = device.count;
      }
    });

    // Process browser breakdown with percentages
    const totalBrowserUsers = browserData.reduce((sum, browser) => sum + browser.users, 0);
    const browserBreakdown = browserData.map(browser => ({
      browser: browser.browser,
      users: browser.users,
      percentage: totalBrowserUsers > 0 ? (browser.users / totalBrowserUsers) * 100 : 0
    }));

    // Calculate bounce rate
    const bounceRate = basicMetrics.total_sessions > 0 
      ? (pageViewMetrics.bounce_sessions / basicMetrics.total_sessions) * 100 
      : 0;

    // Format top countries data
    const formattedTopCountries = topCountries
      .filter(country => country.country !== null)
      .map(country => ({
        country: country.country!,
        users: country.users,
        sessions: country.sessions
      }));

    return {
      total_users: basicMetrics.total_users,
      total_sessions: basicMetrics.total_sessions,
      total_page_views: pageViewMetrics.total_page_views,
      new_users: basicMetrics.new_users,
      returning_users: basicMetrics.returning_users,
      average_session_duration: pageViewMetrics.avg_session_duration 
        ? parseFloat(pageViewMetrics.avg_session_duration.toString()) 
        : 0,
      bounce_rate: bounceRate,
      top_pages: topPages.map(page => ({
        page_url: page.page_url,
        views: page.views,
        unique_views: page.unique_views
      })),
      top_countries: formattedTopCountries,
      device_breakdown: deviceBreakdown,
      browser_breakdown: browserBreakdown
    };

  } catch (error) {
    console.error('Analytics summary retrieval failed:', error);
    throw error;
  }
}