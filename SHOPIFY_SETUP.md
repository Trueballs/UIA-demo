# Shopify Integration Setup Guide

## Overview
This integration connects your Next.js banner builder with Shopify to track:
- 🎓 Student registrations (via Custom Fields)
- 🔍 Real-time visitors (via Live View)
- 📊 Campaign performance metrics

## 1. Create Shopify Store & App

### Step 1a: Create Store
1. Go to https://www.shopify.com/partners
2. Create a development store or use existing store
3. Note your store URL: `https://your-store.myshopify.com`

### Step 1b: Create Custom App
1. In Shopify Admin, go to **Settings > Apps and integrations > Develop apps**
2. Click **Create an app**
3. Name it "Linkin Idee Banner Builder"
4. In **Configuration**, enable these scopes:
   ```
   write_customers
   read_customers
   write_products
   write_orders
   read_analytics
   ```
5. Install the app
6. Copy **Access Token** and **API Key**

## 2. Get Storefront Access Token

1. In Shopify Admin, go to **Settings > Apps and integrations > Sales channels**
2. Click **Storefront API**
3. Create a new token with scopes:
   ```
   customer_account_api
   publish_orders
   ```
4. Copy the **Access Token**

## 3. Update `.env.local`

Replace these values:

```env
NEXT_PUBLIC_SHOPIFY_STORE_URL=https://your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxx
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxx
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
NEXT_PUBLIC_SHOPIFY_PIXEL_ID=your_pixel_id_here
NEXT_PUBLIC_HELIUM_API_KEY=your_helium_api_key_here
```

## 4. Install Customer Fields App (Helium)

1. In Shopify App Store, search for **"Customer Fields"** by Helium
2. Click **Add app**
3. Install it
4. In the app, create these custom fields:
   ```
   Field Name: Din Skole (Your School)
   Type: Dropdown
   Options: 
     - UiO
     - OsloMet
     - NTNU
     - UiB
     - Nord
     - UiA
     - UiS
     - UiT
     - BI
     - NMBU
     - USN
     - HINN
   ```

5. Create another field:
   ```
   Field Name: University Domain
   Type: Text
   ```

## 5. Set Up Shopify Pixel (Analytics)

1. In Shopify Admin, go to **Analytics > Setup**
2. Click **Add channel** > **Shopify Pixel**
3. Copy the Pixel ID and paste in `.env.local`
4. This enables **Live View** to track real-time visitors

## 6. How It Works

### Student Registration Flow
```
Student fills onboarding form
        ↓
Data saved to localStorage
        ↓
trackEvent() sends to Shopify Analytics
        ↓
Shopify Live View shows new "student_onboarding_complete" event
        ↓
Custom Fields (Helium) stores "Din Skole" for segmentation
```

### Real-Time Tracking (Live View)
1. Open Shopify Admin → **Analytics > Live View**
2. You'll see:
   - Current visitors on your site
   - Their geographic location
   - University they selected
   - Event "student_onboarding_complete"
   - Event "banner_created"
   - Event "banner_downloaded"
   - Event "campaign_drop"

## 7. Track Custom Events in Code

### Track Banner Creation
```typescript
import { trackEvent } from '@/lib/shopify';

trackEvent('banner_created', {
  university: 'uio.no',
  layout: 2,
  timestamp: new Date().toISOString(),
});
```

### Track Campaign Drop
```typescript
trackEvent('campaign_drop', {
  campaign_name: 'Spring 2026 Campaign',
  university: 'ntnu.no',
  visible_audience: 1500,
});
```

## 8. Monitor in Shopify Dashboard

### Command Center Workflow
1. **Live View** (Real-time):
   - Open Shopify Admin → **Analytics > Live View**
   - Watch students registering in real-time
   - See which universities are trending
   - Monitor active visitors by location

2. **Reports** (Historical):
   - **Events** report shows all `student_onboarding_complete` events
   - **Customer** report shows students tagged by school
   - **Product** report shows banner downloads

3. **Segmentation** (Advanced):
   - Use Custom Fields to create **Segments**
   - Segment: "Students from UiO"
   - Run email campaigns targeted by university

## 9. API Endpoints

### Sync Student Data
```bash
POST /api/shopify-sync
Content-Type: application/json

{
  "customerId": "gid://shopify/Customer/12345",
  "schoolName": "University of Oslo",
  "university": "uio.no",
  "email": "student@uio.no"
}
```

### Retrieve Student Data
```bash
GET /api/shopify-sync?customerId=gid://shopify/Customer/12345
```

## 10. Troubleshooting

### Events not showing in Live View?
1. Check `.env.local` has correct tokens
2. Verify Shopify Pixel is installed
3. Check browser DevTools → Network → ensure events POST to Shopify

### Students not tagged with school?
1. Verify Helium app is installed
2. Check Custom Fields are created correctly
3. Ensure `/api/shopify-sync` endpoint is being called

### Can't connect to Shopify API?
1. Verify tokens in `.env.local`
2. Check store URL format: `https://store-name.myshopify.com`
3. Ensure API scopes are enabled in Custom App settings

## Next Steps

1. ✅ Create Shopify store & app
2. ✅ Install Customer Fields (Helium)
3. ✅ Add `.env.local` values
4. ✅ Restart Next.js server
5. ✅ Test by filling onboarding form
6. ✅ Check Shopify Live View for events
7. ✅ Set up email campaigns in Shopify
