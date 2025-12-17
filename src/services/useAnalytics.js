import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnalyticsService } from './AnalyticsService';

export const useAnalytics = (pageName = null) => {
    const location = useLocation();

    // Auto-track page views if a pageName is provided
    useEffect(() => {
        if (pageName) {
            AnalyticsService.trackPageView(pageName);
        }
    }, [pageName, location.pathname]);

    return {
        logEvent: AnalyticsService.logEvent,
        trackPageView: AnalyticsService.trackPageView
    };
};
