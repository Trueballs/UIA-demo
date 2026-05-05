// src/hooks/useShopifyTracking.ts
import { useEffect } from 'react';
import { trackPageView, trackEvent } from '@/lib/shopify';

export function useShopifyTracking(university?: string, eventName?: string) {
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined') {
      trackPageView(window.location.pathname, university);
    }
  }, [university]);

  return {
    trackEvent: (event: string, data?: Record<string, any>) => {
      trackEvent(event, {
        university,
        ...data,
        timestamp: new Date().toISOString(),
      });
    },
  };
}

export function useStudentRegistration() {
  return {
    // Track when student completes onboarding
    trackOnboardingComplete: (studentData: {
      country: string;
      language: string;
      degree: string;
      year: string;
      industry: string;
      university: string;
    }) => {
      trackEvent('student_onboarding_complete', {
        country: studentData.country,
        language: studentData.language,
        degree: studentData.degree,
        year: studentData.year,
        industry: studentData.industry,
        university: studentData.university,
      });
    },

    // Track banner creation
    trackBannerCreated: (university: string, layout: number) => {
      trackEvent('banner_created', {
        university,
        layout,
      });
    },

    // Track banner download
    trackBannerDownload: (university: string, layout: number, format: string) => {
      trackEvent('banner_downloaded', {
        university,
        layout,
        format,
      });
    },

    // Track campaign drop/launch
    trackCampaignDrop: (campaignName: string, university: string, visibleAudience: number) => {
      trackEvent('campaign_drop', {
        campaign_name: campaignName,
        university,
        visible_audience: visibleAudience,
      });
    },
  };
}
