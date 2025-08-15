import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  trackEventInputSchema,
  endPageViewInputSchema,
  analyticsFiltersSchema
} from './schema';

// Import handlers
import { trackEvent } from './handlers/track_event';
import { endPageView } from './handlers/end_page_view';
import { getAnalyticsSummary } from './handlers/get_analytics_summary';
import { getUserSessions } from './handlers/get_user_sessions';
import { getPageViews } from './handlers/get_page_views';
import { getUserAnalytics } from './handlers/get_user_analytics';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Core analytics tracking endpoints
  trackEvent: publicProcedure
    .input(trackEventInputSchema)
    .mutation(({ input }) => trackEvent(input)),

  endPageView: publicProcedure
    .input(endPageViewInputSchema)
    .mutation(({ input }) => endPageView(input)),

  // Analytics data retrieval endpoints
  getAnalyticsSummary: publicProcedure
    .input(analyticsFiltersSchema.optional())
    .query(({ input }) => getAnalyticsSummary(input)),

  getUserSessions: publicProcedure
    .input(analyticsFiltersSchema.optional())
    .query(({ input }) => getUserSessions(input)),

  getPageViews: publicProcedure
    .input(analyticsFiltersSchema.optional())
    .query(({ input }) => getPageViews(input)),

  getUserAnalytics: publicProcedure
    .input(analyticsFiltersSchema.optional())
    .query(({ input }) => getUserAnalytics(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Analytics TRPC server listening at port: ${port}`);
}

start();