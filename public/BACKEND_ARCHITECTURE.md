# Backend Architecture Summary: LinkedIn Banner Generator

## 1. Tech Stack

- **Runtime**: Node.js (ESM modules)
- **Framework**: Next.js (App Router)
- **Image Processing**: 
  - `sharp` (resizing, metadata extraction, pixel sampling)
  - `html-to-image` (client-side banner rendering to PNG)
- **Frontend UI**: React + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **API**: Next.js Route Handlers (REST endpoints)
- **Data Format**: JSON (brand data, color palettes)

**Note**: No traditional Python/PIL backend detected. Image generation is **entirely client-side** (React component → `html-to-image` → PNG).

---

## 2. Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── brand/route.ts          # Fetch university brand data
│   │   ├── full-logo/route.ts      # Logo file selection & metadata
│   │   ├── logo/route.ts           # Logo lookup (Clearbit fallback)
│   │   └── uni-image/route.ts      # Campus photo serving
│   ├── build/page.tsx              # Main banner builder (6 layouts)
│   ├── page.tsx                    # Landing page
│   └── layout.tsx                  # Root layout
├── lib/
│   └── logo.ts                     # Helper: getLogoUrl()
└── data/
    └── universities.ts             # UK_UNIVERSITIES array

public/
├── universities/
│   ├── <University Name>/
│   │   ├── Logo/                   # Logo files (SVG/PNG/JPG)
│   │   ├── Bilder_HighRez/         # Campus photos
│   │   ├── Brand_Farger_Fonter/    # brand.json (colors/fonts)
│   │   └── colors/
│   │       └── palette.json        # Color palettes
│   └── [130+ UK universities]
└── marquee-logos/                  # Carousel logos on homepage

scripts/
├── download-logos.mjs              # Fetch logos from university sites
├── retry-logos.mjs                 # Deep scraping for failed downloads
├── fetch-university-assets.mjs     # Wikimedia Commons search
├── update-colors.mjs               # Generate palette.json files
├── restructure-folders.mjs         # Organize university folders
└── setup-marquee-logos.mjs         # Copy logos for homepage carousel
```

---

## 3. Data Flow

```
User Request
    ↓
[1] /api/brand?q=domain
    ├─ Look up UK_UNIVERSITIES array
    ├─ Read brand.json (colors, fonts)
    ├─ Scan Logo/ directory → scoreFile() → rank by relevance
    ├─ Detect logo background (hasBg via corner alpha sampling)
    ├─ Detect if logo is "light" colored (for contrast logic)
    ├─ Scan Bilder_HighRez/ → get image URLs
    └─ Return: BrandData JSON
         {
           colors: [primary, secondary, accent, ...],
           fonts: ["Inter", ...],
           logos: [{url, hasBg, isLight, isIcon, isText, score}, ...],
           images: ["/api/uni-image?folder=...&file=...", ...]
         }
    ↓
[2] React Component (BuilderContent)
    ├─ Store BrandData in state
    ├─ User selects layout (0–5)
    ├─ User picks image index
    ├─ User enters custom text
    ├─ BannerCanvas routes to layout component:
    │   L0 (SPLIT), L1 (IMMERSIVE), L2 (BOLD STRIPE),
    │   L3 (CENTRED BRAND), L4 (GLASS PANELS), L5 (ELEGANT STRIPE)
    └─ Each layout renders JSX with:
         • Brand colors as inline styles
         • Logos via <SmartLogo> component
         • Campus photos via <img src="/api/uni-image?...">
         • Text positioning via absolute/relative CSS
    ↓
[3] SmartLogo Helper Component
    ├─ If hasBg: wrap in glass badge (white bg, rounded)
    ├─ If transparent + needs invert:
    │   └─ Apply CSS filter (invert/brightness) based on panel color contrast
    └─ Render <img> with crossOrigin="anonymous"
    ↓
[4] html-to-image Export (Client-side)
    ├─ User clicks "Download"
    ├─ toPng(bannerRef) → captures rendered DOM
    ├─ Google Font injected via <link> tag (searchable by html-to-image)
    └─ Returns: PNG blob
    ↓
[5] Download to User's Device
    └─ Save as "banner-{timestamp}.png"
```

---

## 4. Key Files

### 4.1 LLM Integration & JSON Parsing
**Current Status**: ❌ **NO LLM BACKEND DETECTED**

The system currently uses **hardcoded layout templates** (L0–L5) with fixed design rules, not LLM-generated coordinates.

However, if you plan to integrate LLM:
- **Candidate integration point**: `src/app/api/brand/route.ts` (could be extended to call LLM for layout hints)
- **Layout decision logic**: Currently in `src/app/build/page.tsx` lines 610–630 (BannerCanvas component)

### 4.2 Image Processing & Drawing
**Primary file**: `src/app/build/page.tsx`
- **Logo metadata detection**: `src/app/api/full-logo/route.ts` (lines 18–100)
  - `detectPngBackground()` → samples corner pixels for opacity
  - `scoreFile()` → ranks logos by keyword matching
- **Image serving**: `src/app/api/uni-image/route.ts` (lines 5–24)

### 4.3 Layout & Coordinate System
**All layout logic is in React/CSS**. No explicit "place text at X,Y" — instead:
- Each layout component (L0–L5) uses **CSS Grid/Flexbox + absolute positioning**
- Text and logos positioned via:
  - `position: "absolute"` with `top`, `left`, `right`, `bottom`, `width`, `height` properties
  - `style={{}}` object in JSX

Example from `src/app/build/page.tsx` line 303 (Layout 1):
```tsx
{text && (
    <div className="absolute"
        style={{ bottom: 42, left: 600, zIndex: 4, maxWidth: 520 }}>
        {/* Text positioned at (600, ~354px from top) */}
    </div>
)}
```

---

## 5. Current Layout Logic (X/Y Coordinate Application)

### 5.1 Fixed Coordinates Per Layout

Each of the 6 layouts uses **hardcoded safe zones** to avoid the LinkedIn avatar "danger zone" (X: 0–568px, Y: 132–396px):

| Layout | Strategy | Text Position | Logo Position |
|--------|----------|---------------|---------------|
| **L0** | 40/60 split | LEFT panel (x 0–600) | LEFT panel centered |
| **L1** | Full photo + overlay | BOTTOM-LEFT (x 32, y 42) | RIGHT panel (high contrast gradient) |
| **L2** | Bold stripe | RIGHT panel (x 1000+) | RIGHT panel |
| **L3** | Centered brand | RIGHT panel (x 600+) | RIGHT panel |
| **L4** | Glass panels | RIGHT floating (x 1200+) | CENTER on glass box |
| **L5** | Elegant stripe | RIGHT panel (x 660+) | CENTER watermark |

### 5.2 Example: How L1 Positions Text

From `src/app/build/page.tsx` line 303–310:

```tsx
{text && (
    <div className="absolute"
        style={{ 
            bottom: 42,           // 42px from bottom
            left: 600,            // 600px from left (safe zone)
            zIndex: 4, 
            maxWidth: 520 
        }}>
```

**Canvas dimensions**: 1584 × 396px
- **bottom: 42** → Y coordinate ≈ 354px (from top)
- **left: 600** → X coordinate = 600px
- Result: Text sits in lower-left quadrant, **outside danger zone** (X 0–568)

### 5.3 Danger Zone Awareness

All layouts respect the **568px boundary**:
- Danger zone occupies: X 0–568, Y 132–396 (where LinkedIn avatar appears)
- **Safe zone**: X 228–1356, Y 48–348 (centered content area)

Example from L2 (`src/app/build/page.tsx` line 368):
```tsx
const LEFT_W = 600;  // Intentionally covers danger zone (will be hidden by avatar)
const PANEL_W = 570; // Right panel starts at ~1014px (safe)
```

---

## 6. Current Rendering Pipeline

```
React JSX (L0–L5 components)
    ↓ (no server-side rendering; purely client-side)
Rendered DOM in <div ref={bannerRef}>
    ↓
html-to-image toPng()
    ↓
Canvas/2D Context (browser's canvas API)
    ↓
PNG Blob
    ↓
User Download
```

**No backend image processing** — the heavy lifting is done by the browser's rendering engine and `html-to-image` library.

---

## 7. Next Steps for LLM Integration

To integrate dynamic constraint-based layout (vs. fixed coordinates):

1. **Create LLM endpoint**: `POST /api/layout-generate`
   - Input: `{ brand: BrandData, userText: string, preferredStyle?: string }`
   - LLM output: Layout constraints (e.g., `{ textPosition: "bottom-left-safe", logoSize: "large", ... }`)

2. **Parse constraints into CSS**: Map LLM output to React style objects

3. **Modify layout components**: Replace hardcoded `style={{}}` with dynamic constraint evaluation

4. **Example constraint format**:
   ```json
   {
     "layout": "immersive",
     "text": {
       "anchor": "bottom-left",
       "x_min": 100,
       "x_max": 700,
       "y_position": "bottom-48px",
       "font_size": "28px"
     },
     "logo": {
       "anchor": "top-right",
       "size": "large",
       "opacity": 0.85
     }
   }
   ```

This would allow the LLM to dynamically suggest layouts while respecting LinkedIn's danger zone constraints.

---

## 8. API Endpoints Reference

### GET /api/brand?q={domain}
Fetches complete brand data for a university.

**Response**:
```json
{
  "name": "University of Oslo",
  "domain": "uio.no",
  "colors": ["#1e2d78", "#0066cc", "#ff6600"],
  "fonts": ["Inter"],
  "logos": [
    {
      "url": "/universities/University of Oslo/Logo/...",
      "hasBg": false,
      "isLight": false,
      "score": 95
    }
  ],
  "images": ["/api/uni-image?folder=uio.no&file=..."]
}
```

### GET /api/uni-image?folder={name}&file={filename}
Serves campus photos from the university folder.

### GET /api/full-logo?q={domain}
Returns ranked list of logos for a university.

### GET /api/logo?q={domain}
Legacy endpoint; returns single best logo (or Clearbit fallback).

---

## 9. Environment Variables

```env
# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Analytics (Shopify)
NEXT_PUBLIC_SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxx
```

---

## 10. Key Dependencies

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "typescript": "^5",
    "tailwindcss": "^3",
    "framer-motion": "^11",
    "html-to-image": "^1.11",
    "sharp": "^0.33",
    "lucide-react": "latest"
  }
}
```

---

Generated: 27 March 2026
Backend Architecture Version: 1.0
