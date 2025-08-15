import { useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/utils/trpc';

// Device detection utilities
function getDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

function getOperatingSystem(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Windows') !== -1) return 'Windows';
  if (userAgent.indexOf('Mac OS') !== -1) return 'macOS';
  if (userAgent.indexOf('Linux') !== -1) return 'Linux';
  if (userAgent.indexOf('Android') !== -1) return 'Android';
  if (userAgent.indexOf('iOS') !== -1) return 'iOS';
  return 'Unknown';
}

function getBrowser(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
  if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
  if (userAgent.indexOf('Safari') !== -1) return 'Safari';
  if (userAgent.indexOf('Edge') !== -1) return 'Edge';
  if (userAgent.indexOf('Opera') !== -1) return 'Opera';
  return 'Unknown';
}

// Generate a unique user ID and store it in localStorage
function getUserId(): string {
  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
}

// Get client IP address (simplified - in production you'd use a service)
async function getClientIP(): Promise<string> {
  try {
    // In a real implementation, you'd use a service like ipapi.co or similar
    return '127.0.0.1'; // Placeholder for development
  } catch (error) {
    return '127.0.0.1';
  }
}

// Get basic geolocation (simplified - in production you'd use a geolocation service)
async function getGeolocation() {
  try {
    // In a real implementation, you'd use a geolocation API
    return {
      country: 'Unknown',
      city: 'Unknown',
      latitude: null,
      longitude: null
    };
  } catch (error) {
    return {
      country: null,
      city: null,
      latitude: null,
      longitude: null
    };
  }
}

interface AnalyticsTrackerProps {
  // Optional props for customization
  enableAutoTracking?: boolean;
  trackHashChanges?: boolean;
}

export function AnalyticsTracker({ 
  enableAutoTracking = true, 
  trackHashChanges = true 
}: AnalyticsTrackerProps) {
  const currentPageViewId = useRef<string | null>(null);
  const pageStartTime = useRef<Date>(new Date());
  const isTracking = useRef<boolean>(false);

  const trackPageView = useCallback(async (url: string, title: string) => {
    if (isTracking.current) return; // Prevent duplicate tracking
    
    try {
      isTracking.current = true;
      
      const userId = getUserId();
      const ipAddress = await getClientIP();
      const geolocation = await getGeolocation();
      
      const trackingData = {
        user_id: userId,
        page_url: url,
        page_title: title,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        geolocation
      };

      const response = await trpc.trackEvent.mutate(trackingData);
      currentPageViewId.current = response.pageViewId;
      pageStartTime.current = new Date();
      
      console.log('📊 Page view tracked:', url);
    } catch (error) {
      console.error('❌ Failed to track page view:', error);
    } finally {
      isTracking.current = false;
    }
  }, []);

  const endPageView = useCallback(async () => {
    if (currentPageViewId.current) {
      try {
        await trpc.endPageView.mutate({
          page_view_id: currentPageViewId.current,
          exit_time: new Date()
        });
        console.log('📊 Page view ended');
      } catch (error) {
        console.error('❌ Failed to end page view:', error);
      }
    }
  }, []);

  // Track initial page load
  useEffect(() => {
    if (enableAutoTracking) {
      trackPageView(window.location.href, document.title);
    }
  }, [trackPageView, enableAutoTracking]);

  // Track route changes (for SPAs)
  useEffect(() => {
    if (!enableAutoTracking) return;

    const handlePopState = () => {
      endPageView();
      setTimeout(() => {
        trackPageView(window.location.href, document.title);
      }, 100);
    };

    const handleHashChange = () => {
      if (trackHashChanges) {
        endPageView();
        setTimeout(() => {
          trackPageView(window.location.href, document.title);
        }, 100);
      }
    };

    // Listen for browser navigation
    window.addEventListener('popstate', handlePopState);
    
    if (trackHashChanges) {
      window.addEventListener('hashchange', handleHashChange);
    }

    // Override pushState and replaceState to track programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      endPageView();
      originalPushState.apply(history, args);
      setTimeout(() => {
        trackPageView(window.location.href, document.title);
      }, 100);
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => {
        trackPageView(window.location.href, document.title);
      }, 100);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [enableAutoTracking, trackHashChanges, trackPageView, endPageView]);

  // Track when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      endPageView();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endPageView();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      endPageView(); // End tracking when component unmounts
    };
  }, [endPageView]);

  // This component doesn't render anything - it's purely for tracking
  return null;
}

// Hook for manual tracking
export function useAnalytics() {
  const trackEvent = useCallback(async (eventData: {
    page_url: string;
    page_title: string;
    custom_data?: Record<string, any>;
  }) => {
    try {
      const userId = getUserId();
      const ipAddress = await getClientIP();
      const geolocation = await getGeolocation();
      
      await trpc.trackEvent.mutate({
        user_id: userId,
        page_url: eventData.page_url,
        page_title: eventData.page_title,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        geolocation
      });
      
      console.log('📊 Custom event tracked:', eventData);
    } catch (error) {
      console.error('❌ Failed to track custom event:', error);
    }
  }, []);

  return { trackEvent };
}