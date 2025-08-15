import { pgTable, text, boolean, timestamp, numeric, integer, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User sessions table
export const userSessionsTable = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: text('user_id').notNull(),
  is_new_user: boolean('is_new_user').notNull(),
  ip_address: text('ip_address').notNull(),
  user_agent: text('user_agent').notNull(),
  device_type: text('device_type').notNull(),
  operating_system: text('operating_system').notNull(),
  browser: text('browser').notNull(),
  country: text('country'),
  city: text('city'),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  referrer: text('referrer'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Page views table
export const pageViewsTable = pgTable('page_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  session_id: uuid('session_id').notNull().references(() => userSessionsTable.id, { onDelete: 'cascade' }),
  page_url: text('page_url').notNull(),
  page_title: text('page_title').notNull(),
  entry_time: timestamp('entry_time').defaultNow().notNull(),
  exit_time: timestamp('exit_time'),
  time_spent: integer('time_spent'), // in seconds
  created_at: timestamp('created_at').defaultNow().notNull()
});

// User analytics table (aggregated data)
export const userAnalyticsTable = pgTable('user_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: text('user_id').notNull().unique(),
  total_sessions: integer('total_sessions').notNull().default(0),
  total_page_views: integer('total_page_views').notNull().default(0),
  total_time_spent: integer('total_time_spent').notNull().default(0), // in seconds
  first_visit: timestamp('first_visit').notNull(),
  last_visit: timestamp('last_visit').notNull(),
  page_views_per_session: numeric('page_views_per_session', { precision: 10, scale: 2 }).notNull().default('0'),
  average_session_duration: numeric('average_session_duration', { precision: 10, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const userSessionsRelations = relations(userSessionsTable, ({ many }) => ({
  pageViews: many(pageViewsTable)
}));

export const pageViewsRelations = relations(pageViewsTable, ({ one }) => ({
  session: one(userSessionsTable, {
    fields: [pageViewsTable.session_id],
    references: [userSessionsTable.id]
  })
}));

export const userAnalyticsRelations = relations(userAnalyticsTable, ({ many }) => ({
  sessions: many(userSessionsTable, {
    relationName: 'user_analytics_sessions'
  })
}));

// TypeScript types for the table schemas
export type UserSession = typeof userSessionsTable.$inferSelect;
export type NewUserSession = typeof userSessionsTable.$inferInsert;

export type PageView = typeof pageViewsTable.$inferSelect;
export type NewPageView = typeof pageViewsTable.$inferInsert;

export type UserAnalytics = typeof userAnalyticsTable.$inferSelect;
export type NewUserAnalytics = typeof userAnalyticsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  userSessions: userSessionsTable,
  pageViews: pageViewsTable,
  userAnalytics: userAnalyticsTable
};

export const schemaRelations = {
  userSessionsRelations,
  pageViewsRelations,
  userAnalyticsRelations
};