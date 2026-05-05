"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Download, RefreshCw, ChevronLeft, ChevronRight, X, Shuffle, CheckCircle, Upload, ChevronDown, Ban, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toBlob, toPng } from "html-to-image";

import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ALL_UNIVERSITIES } from "@/data/universities";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type LogoVariant = {
    url: string;
    hasBg: boolean;
    isIcon: boolean;
    isText: boolean;
    score: number;
    filename: string;
    isLight?: boolean;
    logoColor?: string | null;
    preferredBg?: string | null;
};

type BrandData = {
    name: string;
    fullName: string;
    domain: string;
    logo: string;
    fullLogo: string;
    iconLogo?: string;
    logoHasBg: boolean;
    logos: LogoVariant[];
    colors: string[];
    fonts: string[];
    images: string[];
};

type Layout = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/* ═══════════════════════════════════════════════════════════════
   LINKEDIN CANVAS CONSTANTS
   Absolute: 1584 × 396 px  (4:1 ratio)
   Danger Zone (avatar): x 0–568, y 132–396  →  keep EMPTY
   Safe Zone: centred 1128 × 300 px  (x 228–1356, y 48–348)
   Mobile margins: outer 64 px each side are cropped on mobile
═══════════════════════════════════════════════════════════════ */
const W = 1584;
const H = 396;

// Danger zone (avatar area) – nothing of value can sit here
const DZ_X = 0;
const DZ_Y = 132;
const DZ_W = 568;
const DZ_H = 264;

// Safe zone for all content
const SZ_X = 228;            // = (1584 - 1128) / 2
const SZ_Y = 48;             // = (396 - 300) / 2
const SZ_W = 1128;
const SZ_H = 300;

// Mobile-safe inner margin (content that appears on mobile)
const MOBILE_MARGIN = 64;

/* ═══════════════════════════════════════════════════════════════
   COLOR UTILITIES
═══════════════════════════════════════════════════════════════ */
function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luma(hex: string) {
    const [r, g, b] = hexToRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
function isDark(hex: string) { return luma(hex) < 140; }

/** Pick contrasting text colour (black or white) for a given background */
function contrastText(bg: string) { return isDark(bg) ? "#ffffff" : "#111111"; }

/** Blend two hex colours at a ratio (0=a, 1=b) */
function blendHex(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg2, bb] = hexToRgb(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg2 - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/** Pick the best contrasting background colour from the brand palette.
 *  Returns null if no fix is needed (logo already contrasts with panel). */
function pickContrastPill(
    logoIsLight: boolean,
    panelColor: string,
    brandColors: string[],
): string | null {
    const panelLight = !isDark(panelColor);
    // Logo and panel are the same brightness class → logo invisible
    const logoBlends = (logoIsLight && panelLight) || (!logoIsLight && isDark(panelColor));
    if (!logoBlends) return null;

    // Find the brand colour with the maximum luma-distance from the panel
    let bestColor: string | null = null;
    let bestDist = 0;
    const pLuma = luma(panelColor);
    for (const c of brandColors) {
        const dist = Math.abs(luma(c) - pLuma);
        if (dist > bestDist) { bestDist = dist; bestColor = c; }
    }
    // Also consider pure white / black as fallbacks
    if (Math.abs(255 - pLuma) > bestDist) { bestColor = "#ffffff"; bestDist = Math.abs(255 - pLuma); }
    if (pLuma > bestDist) { bestColor = "#111111"; }

    return bestColor;
}

/** Check if two colors are too similar to each other */
function colorsAreSimilar(hex1: string, hex2: string, threshold = 40): boolean {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const dist = Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
    return dist < threshold;
}

/**
 * Pick the brand color that provides the BEST contrast for a logo.
 * Avoids colors that are too similar to the logo's own color.
 * Falls back to white or near-black if no brand color works.
 */
function pickBestPanelColor(
    logoColor: string | null,
    logoIsLight: boolean,
    brandColors: string[],
    fallbackPrimary: string,
): string {
    // Score each brand color: high score = good contrast with logo
    let bestColor = fallbackPrimary;
    let bestScore = -Infinity;

    for (const c of brandColors) {
        const lumaDiff = Math.abs(luma(c) - ((logoColor ?? null) ? luma(logoColor!) : (logoIsLight ? 200 : 50)));
        // Penalise if the logo color is too close to the panel color
        const colorDist = (logoColor ?? null)
            ? (() => { const [r1,g1,b1] = hexToRgb(logoColor!); const [r2,g2,b2] = hexToRgb(c); return Math.sqrt((r2-r1)**2+(g2-g1)**2+(b2-b1)**2); })()
            : lumaDiff;
        const score = lumaDiff + colorDist * 0.5;
        if (score > bestScore) { bestScore = score; bestColor = c; }
    }

    // Final safety check: if best brand color is still too similar to the logo, use white or dark
    if ((logoColor ?? null) && colorsAreSimilar(logoColor!, bestColor, 60)) {
        bestColor = logoIsLight ? '#111111' : '#ffffff';
    }
    return bestColor;
}

/* ═══════════════════════════════════════════════════════════════
   LOGO RENDERER
   Handles transparent, opaque-bg, and needs-invert scenarios.
   NEW RULE: if a transparent logo would be invisible against the
   panel (same brightness class), wrap it in a contrasting pill
   using the best brand colour.
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   PREMIUM POLISH ELEMENTS
═══════════════════════════════════════════════════════════════ */
function GrainOverlay() {
    return (
        <div className="absolute inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundSize: '150px 150px',
            }}
        />
    );
}

function FrameOverlay() {
    return (
        <div className="absolute inset-[3px] z-[101] pointer-events-none border border-white/10 rounded-sm mix-blend-overlay" />
    );
}

function SmartLogo({
    src, hasBg, isLight = true, panelColor, h = 100, maxW = 280, brandColors = [], scale = 1, align = "center",
}: {
    src: string; hasBg?: boolean; isLight?: boolean; panelColor: string; h?: number | "auto"; maxW?: number; brandColors?: string[]; scale?: number; align?: "center" | "flex-start" | "flex-end";
}) {
    const [err, setErr] = useState(false);
    if (err || !src) return null;
    const panelDark = isDark(panelColor);

    // We wrap the logo in a flex container of height 'h' to ensure 
    // vertical centering is consistent regardless of the logo file's 
    // internal aspect ratio or whitespace.
    return (
        <div style={{
            height: h === "auto" ? "auto" : (h as number) * scale,
            width: "fit-content",
            display: "flex",
            alignItems: align,
            justifyContent: "center", 
            position: "relative",
            overflow: "hidden"
        }}>
            <img src={src} alt="University logo"
                crossOrigin="anonymous"
                style={{
                    height: "100%", width: "auto", maxWidth: maxW * scale,
                    objectFit: "contain", 
                    objectPosition: align === "center" ? "center" : `center ${align === "flex-start" ? "top" : "bottom"}`,
                    display: "block",
                    mixBlendMode: "normal",
                    filter: !hasBg ? "drop-shadow(0px 2px 2px rgba(0,0,0,0.15))" : "none",
                }}
                onError={() => setErr(true)} />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   GHOST CREST HELPER
   Gracefully handles JPG (solid bg) and PNG crests for watermarking
═══════════════════════════════════════════════════════════════ */
function GhostCrest({ iconLogo, primary, style, opacity = 0.1 }: { iconLogo: any, primary: string, style: any, opacity?: number }) {
    if (!iconLogo) return null;
    const isDarkBg = isDark(primary);

    let filter = isDarkBg ? "brightness(0) invert(1)" : "brightness(0)";
    let mixBlendMode: any = "normal";

    if (iconLogo.hasBg) {
        if (isDarkBg) {
            filter = "grayscale(1) invert(1)";
            mixBlendMode = "screen";
        } else {
            filter = "grayscale(1)";
            mixBlendMode = "multiply";
        }
    }

    return (
        <img src={iconLogo.url} alt="" crossOrigin="anonymous"
            style={{ ...style, filter, mixBlendMode, pointerEvents: "none", opacity }}
            onError={() => { }} />
    );
}

/* ═══════════════════════════════════════════════════════════════
   FONT HELPER
═══════════════════════════════════════════════════════════════ */
function getFont(fontName?: string) {
    return fontName ? `"${fontName}", sans-serif` : "system-ui, sans-serif";
}

function getHeadlineFont(textStyle: "blocky" | "elegant" | "mono", domain?: string) {
    if (domain === "uib.no") {
        return "var(--font-crimson-text), 'Crimson Text', serif";
    }

    if (textStyle === "elegant") return "'Playfair Display', serif";
    if (textStyle === "mono") return "'JetBrains Mono', monospace";
    return "'Inter', sans-serif";
}

/* Shared props for all layout components */
type LayoutProps = {
    brand: BrandData;
    text: string;
    badge?: string;
    estDate?: string;
    statusTag?: string;
    img?: string;
    logoSrc: string;
    logoHasBg: boolean;
    logoIsLight?: boolean;
    primary: string;
    secondary: string;
    headlineColor: string;
    logoPos?: 'top' | 'bottom' | 'center';
    bgStyle?: 'none' | 'brand';
    tintIndex?: number;
    bgOpacity?: number; // 0 to 100
    photoFilter?: string;
    logoScale?: number;
    textSize?: number;
    textStyle?: "blocky" | "elegant" | "mono";
};


/* ═══════════════════════════════════════════════════════════════
   CUSTOM VARIABLE HELPERS
═══════════════════════════════════════════════════════════════ */
function BadgeTag({ text, color }: { text?: string, color: string }) {
    if (!text) return null;
    return <div style={{ color, border: `1px solid ${color}40`, background: `${color}10`, padding: "5px 12px", borderRadius: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16, position: "relative", zIndex: 1 }}>{text}</div>;
}
function EstDateTag({ text, color }: { text?: string, color: string }) {
    if (!text) return null;
    return <div style={{ color, opacity: 0.5, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", marginTop: 12, position: "relative", zIndex: 1 }}>{text}</div>;
}
function StatusTagBadge({ text, bg, color }: { text?: string, bg: string, color: string }) {
    if (!text) return null;
    return <div style={{ background: bg, color, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 800, display: "inline-block", position: "relative", zIndex: 1 }}>{text}</div>;
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 0 — "SPLIT"
   Classic 40/60 vertical split: solid brand panel LEFT (clear
   of avatar zone by design), full campus photo RIGHT.
   Logo sits large, centered in the left panel.
   Inspired by: Princeton / Dartmouth
═══════════════════════════════════════════════════════════════ */
function L0({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, logoSrc, logoHasBg, logoIsLight, primary, img, headlineColor, photoFilter = "none" }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);
    const SPLIT_X = 620;

    return (
        <div className="absolute inset-0 overflow-hidden flex" style={{ background: primary }}>
            {/* Left: Campus Photo */}
            <div className="relative h-full overflow-hidden" style={{ width: SPLIT_X }}>
                {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" style={{ filter: photoFilter }} />
                ) : (
                    <div className="w-full h-full" style={{ background: primary, opacity: 0.1 }} />
                )}
            </div>

            {/* Sharp vertical border */}
            <div className="w-[1px] h-full bg-white/10 z-20" />

            {/* Right: Solid Brand Panel */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-8">
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={primary} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
                
                {text && (
                    <p style={{
                        color: headlineColor, fontSize: 26 * textSize, fontWeight: 900, lineHeight: 1.15,
                        maxWidth: 480, margin: 0, letterSpacing: "-0.02em", fontFamily: font
                    }}>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 1 — "IMMERSIVE"
   Full-bleed campus photo fills everything.
   A strong gradient overlay on the RIGHT half hosts a huge logo.
   Text sits bottom-left (well inside safe zone, clear of avatar).
   Inspired by: UC Berkeley / Oxford
═══════════════════════════════════════════════════════════════ */
function L1({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, img, logoSrc, logoHasBg, logoIsLight, primary, headlineColor, bgOpacity = 100, tintIndex = 0, photoFilter = "none" }: LayoutProps) {
    // Use the primary color (or brand colors[tintIndex] if available)
    const panelColor = brand.colors[tintIndex] ?? primary;
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: primary }}>
            {img ? (
                <img src={img} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" style={{ filter: photoFilter }} />
            ) : (
                <div className="absolute inset-0" style={{ background: primary }} />
            )}

            {/* Very clean solid right-side panel */}
            <div className="absolute inset-y-0 right-0 w-[550px] z-1" style={{
                background: panelColor,
                opacity: 0.9,
            }} />

            <div className="absolute inset-y-0 right-0 w-[550px] flex flex-col items-center justify-center p-12 z-10">
                <div className="flex flex-col items-center gap-8">
                    <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={panelColor} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
                    {text && (
                        <p style={{
                            color: headlineColor, fontSize: 26 * textSize, fontWeight: 900,
                            lineHeight: 1.15, letterSpacing: "-0.02em",
                            textAlign: "center", maxWidth: 400, margin: 0, fontFamily: font
                        }}>
                            {text}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 2 — "BOLD STRIPE"
   Full photo background. A bold diagonal-edged brand panel
   occupies the RIGHT ~35%, housing an enormous logo.
   Text anchored to the bottom of the panel.
   Inspired by: Edinburgh / Loughborough
═══════════════════════════════════════════════════════════════ */
function L2({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, img, logoSrc, logoHasBg, logoIsLight, primary, headlineColor, photoFilter = "none" }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);
    const PANEL_W = 580;

    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
            {img && (
                <img src={img} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" style={{ filter: photoFilter }} />
            )}

            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-8"
                style={{
                    width: PANEL_W, background: primary, zIndex: 10, padding: "48px",
                    clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)'
                }}>
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={primary} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
                
                {text && (
                    <p style={{
                        color: headlineColor, fontSize: 26 * textSize, fontWeight: 900, lineHeight: 1.15,
                        textAlign: "center", maxWidth: 440, margin: 0, letterSpacing: "-0.02em", fontFamily: font
                    }}>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 3 — "CENTRED BRAND"
   No photo — pure brand expression.
   Left: a large, centred text logo on the brand primary colour.
   Right: lighter secondary colour panel with headline text.
   Clean, formal, great for institutions without many photos.
   Inspired by: LSE / Imperial
═══════════════════════════════════════════════════════════════ */
function L3({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, logoSrc, logoHasBg, logoIsLight, primary, headlineColor }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center" style={{ background: primary }}>
            <div className="flex flex-col items-center gap-8" style={{ width: 660 }}>
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={primary} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
                {text && (
                    <p style={{
                        color: headlineColor, fontSize: 28 * textSize, fontWeight: 900, lineHeight: 1.15,
                        width: "100%", margin: 0, letterSpacing: "-0.02em", fontFamily: font
                    }}>
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 4 — "GLASS PANELS"
   Two frosted glass panes floating over a vibrant, completely
   full-bleed campus image. Premium, polished software feel.
═══════════════════════════════════════════════════════════════ */
function L4({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, logoSrc, logoHasBg, logoIsLight, logoPos = 'bottom', img, bgStyle = 'none', tintIndex = 0, photoFilter = "none" }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);
    
    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
            {img && (
                <div className="absolute inset-0">
                    <img src={img} alt="" crossOrigin="anonymous" 
                        className="absolute inset-0 w-full h-full object-cover" style={{ filter: photoFilter }} />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}
            
            <div className={`absolute z-20 flex flex-row-reverse gap-8 ${logoPos === "top" ? "items-start" : (logoPos === "center" ? "items-center" : "items-end")}`}
                style={{ 
                    right: 40,
                    top: logoPos === 'center' ? '50%' : (logoPos === 'top' ? 40 : 'auto'),
                    bottom: logoPos === 'bottom' ? 40 : 'auto',
                    transform: logoPos === 'center' ? 'translateY(-50%)' : 'none'
                }}>
                {logoSrc && (
                    <SmartLogo 
                        src={logoSrc} 
                        hasBg={logoHasBg} 
                        isLight={logoIsLight} 
                        panelColor="#000000" 
                        h={150} 
                        maxW={400} 
                        brandColors={brand.colors} 
                        scale={logoScale} 
                        align={logoPos === "top" ? "flex-start" : (logoPos === "center" ? "center" : "flex-end")} 
                    /> 
                )}
                
                {text && (
                    <div >
                        <p style={{
                            color: 'white', 
                            fontSize: 32 * textSize, 
                            fontWeight: 900,
                            lineHeight: 1.1, 
                            letterSpacing: "-0.03em", 
                            margin: 0, 
                            fontFamily: font,
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            maxWidth: 800, textAlign: "right"
                        }}>
                            {text}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 5 — "ELEGANT STRIPE"
   Massive watermark in the middle, and a sharp solid panel splitting the 
   right side cleanly. Very modern.
═══════════════════════════════════════════════════════════════ */
function L5({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, img, logoSrc, logoHasBg, logoIsLight, primary, headlineColor, bgOpacity = 100, tintIndex = 0, photoFilter = "none" }: LayoutProps) {
    const rawTint5 = brand.colors[tintIndex % brand.colors.length] ?? primary;
    const tintColor = pickBestPanelColor(null, logoIsLight ?? true, brand.colors, rawTint5);
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);

    return (
        <div className="absolute inset-0 overflow-hidden flex bg-white">
            <div className="flex-1 relative overflow-hidden bg-black">
                {img && <img src={img} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" style={{ filter: photoFilter }} />}
            </div>

            <div className="w-[500px] flex flex-col items-center justify-center p-12 text-center gap-10 z-10" style={{ background: primary }}>
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={primary} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
                {text && (
                    <p style={{
                        color: headlineColor, fontSize: 24 * textSize, fontWeight: 900, lineHeight: 1.15,
                        maxWidth: 400, margin: 0, fontFamily: font, letterSpacing: "-0.02em"
                    }}>{text}</p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 6 — "DIAGONAL GRADIENT"
   Full diagonal split with bold gradient on right, photo on left.
   Inspired by: Modern tech branding
═══════════════════════════════════════════════════════════════ */
function L6({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, img, logoSrc, logoHasBg, logoIsLight, primary, headlineColor, photoFilter = "none" }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);

    return (
        <div className="absolute inset-0 overflow-hidden bg-white">
            {img && <img src={img} alt="" crossOrigin="anonymous" className="absolute inset-0 w-3/5 h-full object-cover" style={{ filter: photoFilter }} />}

            <div className="absolute top-0 bottom-0 right-0 flex flex-col items-center justify-center gap-8 p-16"
                style={{
                    width: "55%", background: primary, zIndex: 10,
                    clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)'
                }}>
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor={primary} h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />

                {text && (
                    <p style={{
                        color: headlineColor, fontSize: 26 * textSize, fontWeight: 900,
                        lineHeight: 1.15, maxWidth: 440, margin: 0, fontFamily: font,
                        letterSpacing: "-0.02em", textAlign: "center"
                    }}>{text}</p>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT 7 — "CENTERED LOGO"
   Full-bleed campus photo with a massive, centered logo.
   Simplicity and scale for maximum impact.
═══════════════════════════════════════════════════════════════ */
function L7({ textSize = 1.0, textStyle = "blocky", logoScale = 1.0, brand, text, img, logoSrc, logoHasBg, logoIsLight, primary, headlineColor, photoFilter = "none" }: LayoutProps) {
    const brandFont = getFont(brand.fonts?.[0]);
    const font = getHeadlineFont(textStyle, brand.domain);
    
    return (
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-black">
            {img && (
                <div className="absolute inset-0">
                    <img src={img} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" style={{ filter: photoFilter }} />
                    <div className="absolute inset-0 bg-black/10" />
                </div>
            )}
            
            <div className="relative z-10 flex flex-col items-center justify-center">
                <SmartLogo src={logoSrc} hasBg={logoHasBg} isLight={logoIsLight} panelColor="#000000" h={180} maxW={400} brandColors={brand.colors} scale={logoScale} />
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════
   BANNER WRAPPER — routes to the right layout
═══════════════════════════════════════════════════════════════ */
function BannerCanvas({
    brand, text, badge, estDate, statusTag, layout, imgIndex, logoIndex,
    logoPos = 'bottom', bgStyle = 'none', tintIndex = 0, bgOpacity = 100, photoFilter = "none", logoScale = 1.0, textSize = 1.0, textStyle = "blocky", customImage = null, dataUrlCache = new Map()
}: {
    brand: BrandData; text: string; badge?: string; estDate?: string; statusTag?: string; layout: Layout; imgIndex: number; logoIndex: number;
    logoPos?: 'top' | 'bottom' | 'center';
    bgStyle?: 'none' | 'brand';
    tintIndex?: number;
    bgOpacity?: number;
    photoFilter?: string;
    logoScale?: number;
    textSize?: number;
    textStyle?: "blocky" | "elegant" | "mono";
    customImage?: string | null;
    dataUrlCache?: Map<string, string>;
}) {
    // Use cached Base64 data URL when available (iOS Safari canvas taint fix)
    const resolve = (url: string | undefined): string => url ? (dataUrlCache.get(url) ?? url) : '';

    const img = customImage || (brand.images.length > 0
        ? resolve(brand.images[imgIndex % brand.images.length])
        : undefined);

    // Resolve active logo from logoIndex
    const noLogo = logoIndex === -1;
    const activeLogo = (brand.logos.length > 0 && !noLogo)
        ? brand.logos[logoIndex % brand.logos.length]
        : null;
    const logoSrc = noLogo ? "" : resolve(activeLogo?.url ?? brand.fullLogo);
    const logoHasBg = activeLogo?.hasBg ?? brand.logoHasBg;
    const logoIsLight = activeLogo?.isLight !== false;
    const activeLogoColor = activeLogo?.logoColor;

    let primary = tintIndex !== -1 
        ? brand.colors[tintIndex % brand.colors.length]
        : (activeLogo?.preferredBg ?? brand.colors[0] ?? "#003865");
    let secondary = brand.colors[1] ?? (isDark(primary) ? "#ffffff" : "#111111");

    // Ensure secondary isn't same as primary if we used preferredBg
    if (primary === secondary && brand.colors.length > 1) {
        secondary = brand.colors.find(c => c !== primary) || secondary;
    }

    // ── SMART CONTRAST & HUE-SYNC INJECTION ──────────────────────
    // NEW RULE: If a logo is blue, avoid blue backgrounds. More generally, 
    // force a switch if the logo color and background are too similar.
    const bgIsDark = isDark(primary);
    
    // Check for logo-background similarity
    const logoIsSimilar = activeLogoColor ? colorsAreSimilar(activeLogoColor, primary) : (!logoIsLight && isDark(primary)) || (logoIsLight && !isDark(primary));

    if (tintIndex === -1) {
        if ((!logoIsLight && bgIsDark) || logoIsSimilar) {
            primary = pickBestPanelColor(activeLogoColor ?? null, (logoIsLight !== undefined ? logoIsLight : true), brand.colors, primary);
            secondary = brand.colors.find(c => c !== primary) ?? (isDark(primary) ? "#ffffff" : "#111111");
        } else if (logoIsLight && !bgIsDark && !logoHasBg) {
            if (!activeLogo?.preferredBg) {
                primary = pickBestPanelColor(activeLogoColor ?? null, (logoIsLight !== undefined ? logoIsLight : true), brand.colors, primary);
                secondary = brand.colors.find(c => c !== primary) ?? (isDark(primary) ? "#ffffff" : "#111111");
            }
        }
    }

    // ── HEADLINE COLOUR SYNC ──────────────────────────────
    // Priority: 1. Sampled logo color, 2. Primary brand color, 3. Black/White fallback
    let headlineColor = logoIsLight ? "#ffffff" : (activeLogoColor || brand.colors[0] || "#111111");

    // Safety: if matching the logo makes the text unreadable against 'primary', 
    // fall back to pure black/white contrast.
    if (isDark(headlineColor) === isDark(primary)) {
        headlineColor = contrastText(primary);
    }

    const p = { brand, text, badge, estDate, statusTag, img, logoSrc, logoHasBg, logoIsLight, primary, secondary, headlineColor, logoPos, bgStyle, tintIndex, bgOpacity, photoFilter, logoScale, textSize, textStyle };

    return (
        <div className="w-full h-full relative overflow-hidden bg-white">
            {layout === 0 && <L0 {...p} />}
            {layout === 1 && <L1 {...p} />}
            {layout === 2 && <L2 {...p} />}
            {layout === 3 && <L3 {...p} />}
            {layout === 4 && <L4 {...p} />}
            {layout === 5 && <L5 {...p} />}
            {layout === 6 && <L6 {...p} />}
            {layout === 7 && <L7 {...p} />}

            <GrainOverlay />
            <FrameOverlay />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT THUMBNAIL
═══════════════════════════════════════════════════════════════ */
const PHOTO = "#8fa3b8";
const THUMB_CONFIGS: { label: string; preview: (color: string, accent: string) => React.ReactNode }[] = [
    {
        label: "Split",
        preview: (c, a) => (
            <div className="w-full h-full flex overflow-hidden">
                <div style={{ width: "40%", background: c }} />
                <div style={{ flex: 1, background: PHOTO }} />
            </div>
        ),
    },
    {
        label: "Immersive",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden" style={{ position: "relative", background: PHOTO }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to left, ${c}f0 20%, transparent 65%)` }} />
            </div>
        ),
    },
    {
        label: "Bold Stripe",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden flex" style={{ background: PHOTO }}>
                <div style={{ flex: 1 }} />
                <div style={{ width: "38%", background: c, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }} />
            </div>
        ),
    },
    {
        label: "Sentrum",
        preview: (c, a) => (
            <div className="w-full h-full flex overflow-hidden">
                <div style={{ width: "48%", background: c, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "55%", height: "28%", background: `rgba(255,255,255,0.3)`, borderRadius: 2 }} />
                </div>
                <div style={{ flex: 1, background: a + "55", display: "flex", alignItems: "center", paddingLeft: 8 }}>
                    <div style={{ width: "60%", height: "12%", background: `${a}99`, borderRadius: 1 }} />
                </div>
            </div>
        ),
    },
    {
        label: "Glasspanel",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden" style={{ position: "relative", background: PHOTO }}>
                <div style={{ position: "absolute", left: "6%", top: "18%", width: "36%", height: "64%", background: `${c}cc`, borderRadius: 2 }} />
                <div style={{ position: "absolute", right: "6%", top: "18%", width: "36%", height: "64%", background: "rgba(255,255,255,0.28)", borderRadius: 2 }} />
            </div>
        ),
    },
    {
        label: "Elegant Stripe",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden flex" style={{ background: c }}>
                <div style={{ flex: 1 }} />
                <div style={{ width: "45%", background: "white", clipPath: "polygon(8px 0, 100% 0, 100% 100%, 0 100%)", display: "flex", alignItems: "center", paddingLeft: 14 }}>
                    <div style={{ width: "55%", height: "22%", background: `${c}55`, borderRadius: 1 }} />
                </div>
            </div>
        ),
    },
    {
        label: "Diagonal",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden" style={{ position: "relative", background: PHOTO }}>
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(125deg, transparent 35%, ${c}f0 52%, ${c} 62%)` }} />
            </div>
        ),
    },
    {
        label: "Sentrert logo",
        preview: (c, a) => (
            <div className="w-full h-full overflow-hidden" style={{ position: "relative", background: PHOTO }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "52%", height: "22%", background: "rgba(255,255,255,0.85)", borderRadius: 1 }} />
                </div>
            </div>
        ),
    },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const LAYOUTS = [0, 1, 2, 3, 4, 5, 6, 7];

function BuilderContent() {
    const params = useSearchParams();
    const router = useRouter();
    const bannerRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [brand, setBrand] = useState<BrandData | null>(null);
    const [text, setText] = useState("");
    const [badge, setBadge] = useState("");
    const [estDate, setEstDate] = useState("");
    const [statusTag, setStatusTag] = useState("");
    const [layout, setLayout] = useState<Layout>(0);
    const [imgIndex, setImgIndex] = useState(0);
    const [logoIndex, setLogoIndex] = useState(0);
    const [logoPos, setLogoPos] = useState<'top' | 'bottom' | 'center'>('bottom');
    const [bgStyle, setBgStyle] = useState<'none' | 'brand'>('none');
    const [tintIndex, setTintIndex] = useState(-1);
    const [bgOpacity, setBgOpacity] = useState(100);
    const [photoFilter, setPhotoFilter] = useState("none");
    const [logoScale, setLogoScale] = useState(1.0);
    const [textSize, setTextSize] = useState(1.0);
    const [textStyle, setTextStyle] = useState<"blocky" | "elegant" | "mono">("blocky");
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [campusFilter, setCampusFilter] = useState<'Grimstad' | 'Kristiansand'>('Kristiansand');

    const [scale, setScale] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDownloadPopup, setShowDownloadPopup] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    // Pre-fetched Base64 Data URLs keyed by original URL (iOS Safari fix)
    const [dataUrlCache, setDataUrlCache] = useState<Map<string, string>>(new Map());

    const [fontCss, setFontCss] = useState<string | null>(null);

    // Dynamic Google Font Injection (Safe inline method)
    useEffect(() => {
        const fontName = brand?.fonts?.[0];
        if (!fontName) return;
        
        let isMounted = true;
        const fontUrl = `https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=JetBrains+Mono:wght@400;700&family=${fontName.replace(/\s+/g, "+")}:wght@400;700;800;900&display=swap`;
        
        fetch(fontUrl)
            .then(r => {
                if (!r.ok) throw new Error("Font fetch failed");
                return r.text();
            })
            .then(text => {
                if (!isMounted) return;
                // Only apply if it's a valid CSS file (avoiding 400 Bad Request HTML from Google)
                if (text.includes("@font-face")) {
                    setFontCss(text);
                } else {
                    setFontCss(null);
                }
            })
            .catch(e => {
                if (!isMounted) return;
                console.warn("Retrying font fetch via standard link (CORS or network issue)...", e);
                setFontCss(null);
            });
            
        return () => { isMounted = false; };
    }, [brand?.fonts]);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (showDownloadPopup) {
            document.body.style.overflow = 'hidden';
            document.body.style.height = '100dvh'; // Lock height for mobile safari
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.height = 'auto';
        };
    }, [showDownloadPopup]);

    // ── Scale banner to fit container ──────────────────────────
    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const available = containerRef.current.clientWidth;
            setScale(Math.min(1, available / W));
        };
        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, []);

    // ── Fetch brand on domain param change ────────────────────
    useEffect(() => {
        const domain = params.get("domain");
        const campus = params.get("campus");
        if (!domain) return;
        
        let isMounted = true;
        setLoading(true);
        let path = `/api/brand?q=${encodeURIComponent(domain)}`;
        if (campus) path += `&campus=${encodeURIComponent(campus)}`;
        
        const toDataUrl = async (url: string): Promise<string> => {
            try {
                const r = await fetch(url);
                if (!r.ok) return url;
                const blob = await r.blob();
                return await new Promise<string>((res) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch { return url; }
        };

        fetch(path)
            .then(r => {
                if (!r.ok) throw new Error(`Brand API error: ${r.status}`);
                return r.json();
            })
            .then(async (data: BrandData) => {
                if (!isMounted) return;
                setBrand(data);
                setImgIndex(0);
                setLogoIndex(0);

                const priorityUrls = [
                    data.fullLogo,
                    data.iconLogo,
                    data.images[0],
                    data.logos[0]?.url,
                    data.logos[1]?.url,
                ].filter(Boolean) as string[];

                const backgroundUrls = [
                    ...data.images.slice(1),
                    ...data.logos.slice(2).map((l: any) => l.url),
                ].filter(Boolean) as string[];

                // 1. Fetch priority assets immediately
                const priorityEntries = await Promise.all(
                    priorityUrls.map(async (url) => [url, await toDataUrl(url)] as [string, string])
                );
                
                if (isMounted) {
                    setDataUrlCache(new Map(priorityEntries));
                    // 2. SET LOADING FALSE NOW - Page is usable!
                    setLoading(false);
                }

                // 3. Fetch the rest in the background
                const bgEntries = await Promise.all(
                    backgroundUrls.map(async (url) => [url, await toDataUrl(url)] as [string, string])
                );

                if (isMounted) {
                    setDataUrlCache(prev => {
                        const newCache = new Map(prev);
                        bgEntries.forEach(([u, d]) => newCache.set(u, d));
                        return newCache;
                    });
                }
            })
            .catch(err => {
                if (!isMounted) return;
                console.error("Critical: Failed to fetch brand data:", err);
                setLoading(false);
            });

        return () => { isMounted = false; };
    }, [params]);

    const changeCampus = (campus: string) => {
        const newParams = new URLSearchParams(params.toString());
        newParams.set("campus", campus);
        router.push(`/build?${newParams.toString()}`);
    };

    // ── Layout navigation ─────────────────────────────────────
    const prevLayout = () => setLayout(l => ((l - 1 + LAYOUTS.length) % LAYOUTS.length) as Layout);
    const nextLayout = () => setLayout(l => ((l + 1) % LAYOUTS.length) as Layout);

    // ── Photo navigation ──────────────────────────────────────
    const prevImg = () => setImgIndex(i => Math.max(0, i - 1));
    const nextImg = () => {
        if (!brand) return;
        setImgIndex(i => (i + 1) % brand.images.length);
    };

    // Find the university in the data to get available campuses
    const uniMetadata = ALL_UNIVERSITIES.find(u => u.domain === params.get("domain"));

    // ── Download ──────────────────────────────────────────────
    const handleDownload = async () => {
        if (!exportRef.current || !brand) return;
        setIsDownloading(true);
        try {
            const filename = `linkedin-banner-${brand.name.toLowerCase().replace(/\s+/g, '-')}.png`;

            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            let blob: Blob | null = null;

            if (isSafari) {
                // ── SERVER-SIDE RENDER (Safari/iOS Fix) ───────────────────────
                const activeLogo = brand.logos.length > 0
                    ? brand.logos[logoIndex % brand.logos.length]
                    : null;

                let primaryHex = activeLogo?.preferredBg ?? brand.colors[0] ?? '#003865';
                const logoIsLight = activeLogo?.isLight !== false;
                const logoHasBg = activeLogo?.hasBg ?? brand.logoHasBg;
                if (!logoIsLight && isDark(primaryHex)) {
                    primaryHex = brand.colors.find(c => !isDark(c)) ?? '#ffffff';
                } else if (logoIsLight && !isDark(primaryHex) && !logoHasBg && !activeLogo?.preferredBg) {
                    primaryHex = brand.colors.find(c => isDark(c)) ?? '#111111';
                }

                const imageUrl = brand.images.length > 0
                    ? brand.images[imgIndex % brand.images.length]
                    : null;
                const logoUrl = activeLogo?.url ?? brand.fullLogo ?? null;

                const activeLogoColor = activeLogo?.logoColor;
                let headlineColor = logoIsLight ? "#ffffff" : (activeLogoColor || brand.colors[0] || "#111111");
                if (isDark(headlineColor) === isDark(primaryHex)) {
                    headlineColor = isDark(primaryHex) ? "#ffffff" : "#111111";
                }

                const response = await fetch('/api/render-banner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        imageUrl, logoUrl, primaryHex, layout, text, headlineColor, logoIsLight, photoFilter, logoPos
                    }),
                });

                if (!response.ok) throw new Error(`Server render failed`);
                blob = await response.blob();

            } else {
                // ── CLIENT-SIDE RENDER (PC / Mac) ────────────────────────────
                await new Promise(r => setTimeout(r, 400));
                blob = await toBlob(exportRef.current, {
                    pixelRatio: 2,
                    width: W,
                    height: H,
                    style: { transform: 'none', visibility: 'visible', display: 'block' },
                });
            }

            if (!blob) throw new Error("Canvas generation returned no data.");

            // ── UNIVERSAL DOWNLOAD METHOD ──────────────────────────────
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setTimeout(() => setShowDownloadPopup(true), 800);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Download failed");
        } finally {
            setIsDownloading(false);
        }
    };

    const primary = brand?.colors?.[0] ?? "#1e2d78";
    const accent = brand?.colors?.[1] ?? "#88aaff";
    const textOnPrimary = contrastText(primary);

    return (
        <>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center w-full overflow-x-hidden">
            {/* Safe inline font CSS to prevent html-to-image CORS/SecurityError crashes */}
            {fontCss && <style dangerouslySetInnerHTML={{ __html: fontCss }} />}

            {/* ── NAV ─────────────────────────────────────────── */}
            <Header showStartButton={false} showBackButton activeBrand={brand} />

            <main className="w-full xl:w-[1280px] flex flex-col shrink-0 relative px-4 md:px-8 xl:px-12 py-4 md:py-6">
                <div className="max-w-screen-2xl mx-auto space-y-4 w-full mt-2 md:mt-4 mb-10 md:mb-12 xl:mb-16">

                    {/* ── BANNER PREVIEW ──────────────────────────── */}
                    <section className="sticky top-0 xl:top-4 z-40 pt-4 -mt-4 bg-slate-50/80 backdrop-blur-sm">


                        {/* Live Preview Indicator Container */}
                        <div className="flex items-center justify-end mb-2 mr-1">
                            <div className="flex items-center gap-2 opacity-80">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Preview</span>
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 bg-white">
                            {/* Banner canvas */}
                            <div ref={containerRef}
                                className="w-full relative"
                                style={{ height: brand ? H * scale : 160 }}>
                                {brand ? (
                                    <div style={{
                                        width: W, height: H,
                                        transform: `scale(${scale})`,
                                        transformOrigin: "top left",
                                        position: "relative",
                                    }}>
                                        <div ref={bannerRef} className="absolute inset-0">
                                            <BannerCanvas
                                                brand={brand}
                                                text={text}
                                                badge={badge}
                                                estDate={estDate}
                                                statusTag={statusTag}
                                                layout={layout}
                                                imgIndex={imgIndex}
                                                logoIndex={logoIndex}
                                                logoPos={logoPos}
                                                bgStyle={bgStyle}
                                                tintIndex={tintIndex}
                                                bgOpacity={bgOpacity}
                                                photoFilter={photoFilter}
                                                logoScale={logoScale}
                                                textSize={textSize}
                                                textStyle={textStyle}
                                                customImage={customImage}
                                                dataUrlCache={dataUrlCache}
                                            />
                                        </div>

                                        {/* ── MASTER BANNER (FOR EXPORT) ── */}
                                        {/* Hidden from view, keys ensure it updates instantly with NO transition states */}
                                        <div style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none' }}>
                                            <div 
                                                ref={exportRef} 
                                                key={`export-${layout}-${imgIndex}-${logoIndex}`}
                                                style={{ width: W, height: H, position: 'relative' }}
                                            >
                                                <BannerCanvas
                                                    brand={brand}
                                                    text={text}
                                                    badge={badge}
                                                    estDate={estDate}
                                                    statusTag={statusTag}
                                                    layout={layout}
                                                    imgIndex={imgIndex}
                                                    logoIndex={logoIndex}
                                                    logoPos={logoPos}
                                                    bgStyle={bgStyle}
                                                    tintIndex={tintIndex}
                                                    bgOpacity={bgOpacity}
                                                    photoFilter={photoFilter}
                                                    logoScale={logoScale}
                                                    textSize={textSize}
                                                    textStyle={textStyle}
                                                    customImage={customImage}
                                                    dataUrlCache={dataUrlCache}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                        <p className="text-gray-400 text-base italic">
                                            {loading ? "Loading brand assets…" : "Search for your university to begin"}
                                        </p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </section>

                    
                    {/* ── CONTROLS ────────────────────────────────── */}
                    <div className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {brand ? (
                            <>
                                {/* Column 1: Primary Settings */}
                                <div className="space-y-8 flex flex-col">
                                    {/* Text Style and Text Size controls removed */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Layoutstil</label>
                                            <span className="text-[10px] font-bold text-gray-500">{THUMB_CONFIGS[layout].label}</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {([0, 1, 2, 3, 4, 5, 6, 7] as Layout[]).map(l => (
                                                <button key={l}
                                                    onClick={() => setLayout(l)}
                                                    className="w-full aspect-[4/1] rounded-md overflow-hidden active:scale-95 transition-all"
                                                    style={{
                                                        outline: layout === l ? `2px solid #2563EB` : "2px solid transparent",
                                                        outlineOffset: 2,
                                                    }}>
                                                    {THUMB_CONFIGS[l].preview(primary, brand.colors[1] || primary)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {layout === 4 && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Logoposisjon</p>
                                                <div className="flex gap-2">
                                                    {(['top', 'center', 'bottom'] as const).map(pos => (
                                                        <button key={pos}
                                                            onClick={() => setLogoPos(pos)}
                                                            className="flex-1 py-1.5 rounded-full border-2 text-[10px] font-bold capitalize transition-all"
                                                            style={{
                                                                borderColor: logoPos === pos ? primary : "#e5e7eb",
                                                                background: logoPos === pos ? `${primary}10` : "white",
                                                                color: logoPos === pos ? primary : "#6b7280"
                                                            }}>
                                                            {pos === 'top' ? 'Øverst' : (pos === 'center' ? 'Midten' : 'Nederst')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {brand.images.length > 0 && (
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bilder</label>
                                            {/* Campus toggle */}
                                            <div className="flex gap-1.5 mb-3">
                                                {(['Kristiansand', 'Grimstad'] as const).map(campus => (
                                                    <button
                                                        key={campus}
                                                        onClick={() => {
                                                            setCampusFilter(campus);
                                                            setImgIndex(0);
                                                            setCustomImage(null);
                                                        }}
                                                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                        style={{
                                                            background: campusFilter === campus ? primary : '#f1f5f9',
                                                            color: campusFilter === campus ? '#fff' : '#64748b',
                                                            border: `2px solid ${campusFilter === campus ? primary : 'transparent'}`,
                                                        }}
                                                    >
                                                        {campus}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 flex-wrap items-center">
                                                {/* Upload Button */}
                                                <label className="w-11 h-7 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group active:scale-95">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (event) => {
                                                                    setCustomImage(event.target?.result as string);
                                                                    setImgIndex(-1); // To indicate custom is active
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                                                </label>

                                                {/* Custom Image Preview */}
                                                {customImage && (
                                                    <div className="relative group" style={{ width: 44, height: 28 }}>
                                                        <button
                                                            onClick={() => {
                                                                setImgIndex(-1);
                                                            }}
                                                            className="w-full h-full rounded-lg overflow-hidden transition-all hover:scale-110 active:scale-95 relative"
                                                            style={{ outline: imgIndex === -1 ? `3px solid #2563EB` : '2px solid transparent', outlineOffset: 2 }}>
                                                            <img src={customImage} alt="Uploaded" className="w-full h-full object-cover" />
                                                            {imgIndex === -1 && (
                                                                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center">
                                                                    <Check className="w-3 h-3 text-blue-600 drop-shadow-sm font-bold" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {brand.images.filter(img => img.includes(campusFilter)).map((img) => {
                                                    const actualIdx = brand.images.indexOf(img);
                                                    return (
                                                    <div key={actualIdx} className="relative group" style={{ width: 44, height: 28 }}>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out scale-95 group-hover:scale-100 w-64 aspect-[4/1] rounded-xl overflow-hidden shadow-2xl border-2 border-white ring-1 ring-black/5">
                                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setImgIndex(actualIdx);
                                                                setCustomImage(null);
                                                            }}
                                                            className="w-full h-full rounded-lg overflow-hidden transition-all hover:scale-110 active:scale-95"
                                                            style={{ outline: imgIndex === actualIdx ? `3px solid #2563EB` : '2px solid transparent', outlineOffset: 2 }}>
                                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                                        </button>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                            {brand.images.length > 1 && (() => {
                                                const filtered = brand.images.filter(img => img.includes(campusFilter));
                                                const pos = imgIndex >= 0 ? filtered.indexOf(brand.images[imgIndex]) : -1;
                                                return (
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {customImage ? "Eget bilde lastet opp" : pos >= 0 ? `${campusFilter} — bilde ${pos + 1} av ${filtered.length}` : `${campusFilter} — ${filtered.length} bilder`}
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    )}

                                        {brand.images.length > 0 && (
                                            <div className="mt-6">
                                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Bildefilter</label>
                                                <div className="flex gap-2">
                                                    {([{ label: 'Original', value: 'none' }, { label: 'Mono', value: 'grayscale(100%) contrast(110%) brightness(105%)' }]).map(f => {
                                                        const isActive = photoFilter === f.value;
                                                        const sampleSrc = brand.images[imgIndex % brand.images.length];
                                                        return (
                                                            <button key={f.label} onClick={() => setPhotoFilter(f.value)} className="flex-1 flex flex-col items-center gap-1.5 pb-2 pt-1.5 rounded-xl border-2 transition-all overflow-hidden" style={{ borderColor: isActive ? primary : '#f3f4f6', background: isActive ? `${primary}10` : '#f9fafb' }}>
                                                                <div className="w-full h-8 overflow-hidden rounded-md mx-2" style={{ width: 'calc(100% - 8px)' }}>
                                                                    <img src={sampleSrc} alt="" className="w-full h-full object-cover" style={{ filter: f.value }} />
                                                                </div>
                                                                <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: isActive ? primary : '#9ca3af' }}>{f.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    
                                </div>

                                {/* Column 2: Visual Style & Export */}
                                <div className="space-y-8 flex flex-col pt-4 md:pt-0 pl-1">
                                    {brand.colors.length > 0 && (() => {
                                        const accentDisabled = layout === 4 || layout === 7;
                                        return (
                                            <div className={accentDisabled ? 'opacity-30 pointer-events-none grayscale' : ''}>
                                                <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${accentDisabled ? 'text-gray-300' : 'text-gray-400'}`}>
                                                    Bakgrunnsfarge
                                                    {accentDisabled && <span className="ml-1 text-[9px] font-semibold text-gray-300 normal-case tracking-normal">— not available</span>}
                                                </label>
                                                <div className="flex gap-3 flex-wrap">
                                                    {brand.colors.map((c, i) => (
                                                        <button key={i} onClick={() => setTintIndex(tintIndex === i ? -1 : i)} className="w-10 h-10 rounded-full transition-all hover:scale-110 active:scale-95 relative" style={{ backgroundColor: c, boxShadow: tintIndex === i ? `0 0 0 3px #fbbf24, 0 0 0 5px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.4)` : '0 2px 4px rgba(0,0,0,0.05)' }} />
                                                    ))}
                                                    <button onClick={() => setTintIndex(-1)} className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-all text-[9px] font-bold uppercase" style={{ background: tintIndex === -1 ? '#f3f4f6' : 'transparent', boxShadow: tintIndex === -1 ? `0 0 0 3px #fbbf24, 0 0 0 5px #f59e0b, 0 4px 12px rgba(245, 158, 11, 0.4)` : 'none' }}>
                                                        Auto
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Varianter</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[...brand.logos].map((logo, i) => ({ logo, i })).sort((a,b) => {
                                                const ai = a.logo.isIcon ?? false; const bi = b.logo.isIcon ?? false;
                                                return ai === bi ? 0 : (ai ? 1 : -1);
                                            }).map(({ logo, i }) => (
                                                <button key={i} onClick={() => setLogoIndex(i)} className="w-14 h-14 rounded-lg border-2 flex items-center justify-center p-1.5 transition-all hover:shadow-md relative overflow-hidden" style={{ borderColor: logoIndex === i ? primary : "#e5e7eb", background: logoIndex === i ? `${primary}10` : (logo.isLight ? "#334155" : "#e2e8f0") }}>
                                                    <img src={logo.url} alt="" className="w-full h-full object-contain relative z-10" style={{ filter: 'none' }} onError={e => (e.currentTarget.style.display = "none")} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {brand && (
                                        <div>
                                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
                                                Logostørrelse
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { label: 'Liten', val: 0.75 },
                                                    { label: 'Normal', val: 1.0 },
                                                    { label: 'Stor', val: 1.25 }
                                                ].map(s => (
                                                    <button key={s.label}
                                                        onClick={() => setLogoScale(s.val)}
                                                        className="flex-1 py-2.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all"
                                                        style={{
                                                            borderColor: Math.abs(logoScale - s.val) < 0.01 ? primary : "#f3f4f6",
                                                            background: Math.abs(logoScale - s.val) < 0.01 ? `${primary}10` : "#f9fafb",
                                                            color: Math.abs(logoScale - s.val) < 0.01 ? primary : "#9ca3af"
                                                        }}>
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-auto pt-6 space-y-2">
                                        <button onClick={brand ? handleDownload : () => router.push("/")} disabled={isDownloading} className="w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50 hover:bg-blue-700 active:scale-95" style={{ background: '#2563EB', color: '#ffffff' }}>
                                            {isDownloading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Behandler...</> : <><Download className="w-5 h-5" /> Last ned banner</>}
                                        </button>
                                        <p className="text-center text-[11px] text-gray-400">LinkedIn optimised · Free · Sharp 1584x396 PNG</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="md:col-span-2 py-20 text-center text-gray-400 italic">
                                Search for your university to begin
                            </div>
                        )}
                                        </div>
                </div>
            </main>
        </div>

            {/* DOWNLOAD INSTRUCTION POPUP */}
            <AnimatePresence>
                {showDownloadPopup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-[#111827] flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        Ferdig!
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium">
                                        Banneret ditt er lagret i <span className="text-[#111827] font-bold">Nedlastinger</span> eller <span className="text-[#111827] font-bold">Bilder</span>-appen.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDownloadPopup(false)}
                                    className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 bg-gray-50 overflow-y-auto space-y-4 flex-1">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Slik oppdaterer du LinkedIn</h4>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black flex-shrink-0 text-sm">1</div>
                                        <div>
                                            <p className="font-bold text-[#111827]">Gå til din LinkedIn-profil</p>
                                            <p className="text-sm text-gray-500 mt-0.5">Åpne LinkedIn-appen eller nettsiden og gå til din egen profil.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black flex-shrink-0 text-sm">2</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[#111827]">Klikk på blyantikonen</p>
                                            <p className="text-sm text-gray-500 mt-0.5 mb-2">I øvre høyre hjørne av bannerområdet, klikk på redigeringsikonet.</p>

                                            {/* Visual mockup of LinkedIn banner area */}
                                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden h-28 select-none">
                                                <div className="absolute inset-0 bg-blue-50"></div>
                                                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center animate-pulse">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </div>
                                                <div className="absolute -bottom-6 left-6 w-16 h-16 rounded-full border-4 border-white bg-gray-200 shadow-sm"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black flex-shrink-0 text-sm">3</div>
                                        <div>
                                            <p className="font-bold text-[#111827]">Last opp og bruk</p>
                                            <p className="text-sm text-gray-500 mt-0.5">Velg det nedlastede bildet, plasser det, og klikk «Bruk».</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
                                <button
                                    onClick={() => setShowDownloadPopup(false)}
                                    className="flex-1 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest border-2 border-gray-100 text-[#111827] hover:bg-gray-50 transition-colors active:scale-95"
                                >
                                    Lag et nytt
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="flex-1 py-3.5 rounded-full font-black text-[11px] uppercase tracking-widest bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
                                >
                                    Tilbake til start
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default function BuildPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] text-gray-400">
                Loading…
            </div>
        }>
            <BuilderContent />
        </Suspense>
    );
}
