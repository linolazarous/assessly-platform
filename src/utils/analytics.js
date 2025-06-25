export const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, {
      ...params,
      app_version: process.env.REACT_APP_VERSION
    });
  }
};

// Usage:
trackEvent('assessment_started', { assessment_id: '123' });