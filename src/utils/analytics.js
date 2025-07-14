import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { app } from '../firebase/firebase';

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const trackEvent = (name, params = {}) => {
  if (!analytics) return;
  
  try {
    logEvent(analytics, name, {
      ...params,
      app_version: process.env.REACT_APP_VERSION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

export const trackPageView = (path) => {
  trackEvent('page_view', {
    page_path: path,
    page_title: document.title
  });
};

export const trackError = (error, context = {}) => {
  trackEvent('exception', {
    description: error.message,
    fatal: false,
    ...context
  });
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);
};

export const initAnalytics = (userId) => {
  if (analytics && userId) {
    // Set user ID for analytics
    analytics.setUserId(userId);
    
    // Set user properties
    analytics.setUserProperties({
      sign_up_method: 'email',
      account_type: 'free_trial'
    });
  }
};
