// src/lib/shopify.ts
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

let cachedClient: any = null;

function getShopifyClient() {
  if (cachedClient) return cachedClient;
  
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL || 'placeholder.myshopify.com';
  const publicAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'placeholder_token';

  cachedClient = createStorefrontApiClient({
    storeDomain,
    apiVersion: '2026-01',
    publicAccessToken,
  });
  return cachedClient;
}

// Track customer data with Helium Custom Fields
export async function trackCustomerData(customerId: string, schoolName: string, university: string) {
  try {
    // Store customer metafield with school/university data
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL}/admin/api/2026-01/customers/${customerId}.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            metafields: [
              {
                namespace: 'linkin_idee',
                key: 'school_name',
                value: schoolName,
                type: 'string',
              },
              {
                namespace: 'linkin_idee',
                key: 'university',
                value: university,
                type: 'string',
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to track customer data:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error tracking customer:', error);
    return null;
  }
}

// Track page view for Shopify Live View & Analytics
export function trackPageView(page: string, university?: string) {
  if (typeof window === 'undefined') return;

  // Send to Shopify Analytics Pixel
  const w = window as any;
  if (w.ShopifyAnalytics) {
    w.ShopifyAnalytics.publish('page_viewed', {
      path: page,
      title: document.title,
      university: university || 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  // Alternative: Send via custom event
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'page_view',
    page_path: page,
    page_title: document.title,
    custom_university: university || 'unknown',
  });
}

// Track custom event (e.g., banner created, campaign viewed)
export function trackEvent(eventName: string, eventData: Record<string, any>) {
  if (typeof window === 'undefined') return;

  const w = window as any;
  if (w.ShopifyAnalytics) {
    w.ShopifyAnalytics.publish(eventName, eventData);
  }

  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: eventName,
    ...eventData,
  });
}

// Get current shop info
export async function getShopInfo() {
  const query = `
    query {
      shop {
        name
        url
        description
      }
    }
  `;

  try {
    const response = await getShopifyClient().request(query);
    return response.data?.shop;
  } catch (error) {
    console.error('Error fetching shop info:', error);
    return null;
  }
}
