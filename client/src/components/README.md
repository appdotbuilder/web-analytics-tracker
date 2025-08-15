# Analytics Tracker Component

## Overview

The Analytics Tracker is a comprehensive, modular React component designed to automatically capture user behavior data on websites. It provides detailed insights into user interactions, device information, geographic location, and session data.

## Features

### 🎯 Automatic Tracking
- **Page Views**: Automatically tracks all page visits and navigation
- **User Sessions**: Monitors session duration and user engagement
- **SPA Support**: Full support for Single Page Applications with route tracking
- **Hash Changes**: Optional tracking of hash-based navigation

### 👥 User Intelligence
- **New vs Returning Users**: Automatically identifies user status
- **Unique User IDs**: Generates and stores anonymous user identifiers
- **Session Continuity**: Tracks user sessions across page visits

### 🌍 Device & Location Data
- **Device Detection**: Identifies desktop, mobile, and tablet devices
- **Operating System**: Detects Windows, macOS, Linux, iOS, Android
- **Browser Information**: Identifies Chrome, Firefox, Safari, Edge, Opera
- **Geographic Location**: Basic country and city detection (configurable)

### ⚡ Performance & Privacy
- **Lightweight**: Minimal performance impact
- **Asynchronous**: Non-blocking data collection
- **Privacy-Friendly**: No personal data collection, uses anonymous IDs
- **GDPR Compliant**: Transparent data collection practices

## Installation

1. Copy the `AnalyticsTracker.tsx` component to your project
2. Ensure you have tRPC client configured (see `client/src/utils/trpc.ts`)
3. Make sure your backend has the corresponding analytics endpoints

## Basic Usage

### Automatic Tracking (Recommended)

```tsx
import { AnalyticsTracker } from './components/AnalyticsTracker';

function App() {
  return (
    <div>
      <AnalyticsTracker enableAutoTracking={true} />
      {/* Your app content */}
    </div>
  );
}
```

### Manual Tracking

```tsx
import { useAnalytics } from './components/AnalyticsTracker';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = async () => {
    await trackEvent({
      page_url: window.location.href + '#button-click',
      page_title: 'Custom Event - Button Clicked'
    });
  };

  return <button onClick={handleClick}>Track This Click</button>;
}
```

## Configuration Options

### AnalyticsTracker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableAutoTracking` | `boolean` | `true` | Automatically track page views and navigation |
| `trackHashChanges` | `boolean` | `true` | Track hash-based navigation changes |

### Advanced Configuration

```tsx
<AnalyticsTracker 
  enableAutoTracking={true}
  trackHashChanges={false} // Disable hash tracking for performance
/>
```

## Data Collected

### Session Information
- **User ID**: Anonymous identifier stored in localStorage
- **IP Address**: Client IP for geographic analysis
- **User Agent**: Browser and device information
- **Referrer**: Source of the visit
- **Timestamp**: Visit time and duration

### Page View Data
- **URL**: Current page URL
- **Title**: Page title
- **Entry Time**: When user arrived
- **Exit Time**: When user left (if available)
- **Time Spent**: Duration on page

### Device & Technical Data
- **Device Type**: Desktop, mobile, or tablet
- **Operating System**: Windows, macOS, Linux, iOS, Android
- **Browser**: Chrome, Firefox, Safari, Edge, Opera
- **Screen Resolution**: Display dimensions
- **Language**: User's browser language

### Geographic Data (Optional)
- **Country**: User's country
- **City**: User's city (if available)
- **Coordinates**: Latitude/longitude (if available)

## Backend Integration

The tracker requires these tRPC endpoints on your backend:

### Required Endpoints

```typescript
// Track a new page view/event
trackEvent: publicProcedure
  .input(trackEventInputSchema)
  .mutation(({ input }) => trackEvent(input)),

// End a page view when user leaves
endPageView: publicProcedure
  .input(endPageViewInputSchema)
  .mutation(({ input }) => endPageView(input)),
```

### Schema Types

The tracker uses these TypeScript types (defined in `server/src/schema.ts`):

- `TrackEventInput`: Data sent when tracking events
- `EndPageViewInput`: Data sent when ending page views
- `UserSession`: User session data structure
- `PageView`: Page view data structure

## Analytics Dashboard

The package includes a comprehensive analytics dashboard (`AnalyticsDashboard.tsx`) that provides:

### 📊 Summary Statistics
- Total users, sessions, and page views
- New vs returning user breakdown
- Average session duration
- Bounce rate analysis

### 📈 Detailed Insights
- Top pages by views and engagement
- Geographic distribution of users
- Device and browser breakdown
- Real-time session monitoring

### 🔍 Filtering & Analysis
- Date range filtering
- Country and device type filters
- User type segmentation (new/returning)
- Custom analytics queries

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **IE11**: Limited support (requires polyfills)

## Performance Considerations

### Optimization Features
- **Debounced Tracking**: Prevents duplicate events
- **Batch Processing**: Efficient data transmission
- **Async Operations**: Non-blocking implementation
- **Error Handling**: Graceful failure recovery

### Best Practices
1. Place `<AnalyticsTracker />` at the app root level
2. Use custom event tracking sparingly
3. Consider disabling hash tracking for better performance
4. Implement proper error boundaries

## Privacy & Compliance

### Data Collection Practices
- **Anonymous IDs**: No personal information collected
- **Transparent**: Users can inspect localStorage data
- **Opt-out Friendly**: Easy to disable tracking
- **Secure**: Data transmitted over HTTPS

### GDPR Compliance
- No cookies used (localStorage only)
- Anonymous data collection
- No cross-site tracking
- Transparent data usage

## Troubleshooting

### Common Issues

**Tracking not working:**
- Verify tRPC client configuration
- Check backend endpoint availability
- Inspect browser console for errors

**Duplicate events:**
- Ensure only one `AnalyticsTracker` instance
- Check for multiple tracking implementations

**Performance issues:**
- Disable hash tracking if not needed
- Reduce custom event tracking frequency
- Implement proper error handling

### Debug Mode

```tsx
// Enable debug logging
<AnalyticsTracker 
  enableAutoTracking={true}
  // The component logs tracking events to console
/>
```

## Integration Examples

### Next.js Integration

```tsx
// pages/_app.tsx
import { AnalyticsTracker } from '../components/AnalyticsTracker';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AnalyticsTracker enableAutoTracking={true} />
      <Component {...pageProps} />
    </>
  );
}
```

### React Router Integration

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnalyticsTracker } from './components/AnalyticsTracker';

function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker enableAutoTracking={true} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Custom Event Tracking

```tsx
// Custom hook for analytics
import { useAnalytics } from './components/AnalyticsTracker';

function useCustomAnalytics() {
  const { trackEvent } = useAnalytics();
  
  const trackPurchase = async (productId: string, amount: number) => {
    await trackEvent({
      page_url: window.location.href + `#purchase-${productId}`,
      page_title: `Purchase - ${productId} - $${amount}`
    });
  };
  
  const trackSearch = async (query: string) => {
    await trackEvent({
      page_url: window.location.href + `#search-${encodeURIComponent(query)}`,
      page_title: `Search - ${query}`
    });
  };
  
  return { trackPurchase, trackSearch };
}
```

## Support

For issues, questions, or contributions:
1. Check the troubleshooting section
2. Review backend endpoint implementations
3. Verify tRPC client configuration
4. Inspect browser console for errors

The Analytics Tracker is designed to be production-ready with comprehensive tracking capabilities while maintaining user privacy and application performance.