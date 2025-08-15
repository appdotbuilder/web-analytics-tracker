import { z } from 'zod';

// User session schema
export const userSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  is_new_user: z.boolean(),
  ip_address: z.string(),
  user_agent: z.string(),
  device_type: z.string(),
  operating_system: z.string(),
  browser: z.string(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  referrer: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserSession = z.infer<typeof userSessionSchema>;

// Page view schema
export const pageViewSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  page_url: z.string(),
  page_title: z.string(),
  entry_time: z.coerce.date(),
  exit_time: z.coerce.date().nullable(),
  time_spent: z.number().nullable(), // in seconds
  created_at: z.coerce.date()
});

export type PageView = z.infer<typeof pageViewSchema>;

// User analytics schema (aggregated data)
export const userAnalyticsSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  total_sessions: z.number().int(),
  total_page_views: z.number().int(),
  total_time_spent: z.number(), // in seconds
  first_visit: z.coerce.date(),
  last_visit: z.coerce.date(),
  page_views_per_session: z.number(),
  average_session_duration: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserAnalytics = z.infer<typeof userAnalyticsSchema>;

// Input schema for tracking events
export const trackEventInputSchema = z.object({
  user_id: z.string(),
  session_id: z.string().optional(),
  page_url: z.string(),
  page_title: z.string(),
  ip_address: z.string(),
  user_agent: z.string(),
  referrer: z.string().nullable(),
  geolocation: z.object({
    country: z.string().nullable(),
    city: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable()
  }).optional()
});

export type TrackEventInput = z.infer<typeof trackEventInputSchema>;

// Input schema for ending page view (when user leaves page)
export const endPageViewInputSchema = z.object({
  page_view_id: z.string(),
  exit_time: z.coerce.date()
});

export type EndPageViewInput = z.infer<typeof endPageViewInputSchema>;

// Analytics query filters
export const analyticsFiltersSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  country: z.string().optional(),
  device_type: z.string().optional(),
  page_url: z.string().optional(),
  is_new_user: z.boolean().optional()
});

export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;

// Analytics summary response
export const analyticsSummarySchema = z.object({
  total_users: z.number().int(),
  total_sessions: z.number().int(),
  total_page_views: z.number().int(),
  new_users: z.number().int(),
  returning_users: z.number().int(),
  average_session_duration: z.number(),
  bounce_rate: z.number(),
  top_pages: z.array(z.object({
    page_url: z.string(),
    views: z.number().int(),
    unique_views: z.number().int()
  })),
  top_countries: z.array(z.object({
    country: z.string(),
    users: z.number().int(),
    sessions: z.number().int()
  })),
  device_breakdown: z.object({
    desktop: z.number().int(),
    mobile: z.number().int(),
    tablet: z.number().int()
  }),
  browser_breakdown: z.array(z.object({
    browser: z.string(),
    users: z.number().int(),
    percentage: z.number()
  }))
});

export type AnalyticsSummary = z.infer<typeof analyticsSummarySchema>;