import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageResponse } from 'next/og';
import React from 'react';

const W = 1584, H = 396;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const c = hex.replace('#', '').padEnd(6, '0');
    return {
        r: parseInt(c.slice(0, 2), 16) || 0,
        g: parseInt(c.slice(2, 4), 16) || 0,
        b: parseInt(c.slice(4, 6), 16) || 0,
    };
}

async function fetchBuf(url: string, origin: string): Promise<Buffer> {
    // QUALITY FIX: Strip optimization params like '&w=1600' to fetch the original high-rez master
    const cleanUrl = url.replace(/([?&])w=\d+&?/, '$1').replace(/[?&]$/, '');
    const fullUrl = cleanUrl.startsWith('/') ? `${origin}${cleanUrl}` : cleanUrl;
    
    const r = await fetch(fullUrl, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Fetch failed (${r.status}): ${fullUrl}`);
    return Buffer.from(await r.arrayBuffer());
}

async function safeFetchPng(url: string, maxW: number, maxH: number, origin: string): Promise<Buffer | null> {
    try {
        const raw = await fetchBuf(url, origin);
        const meta = await sharp(raw).metadata();
        let pipeline = sharp(raw);
        if (meta.format === 'svg') {
            pipeline = sharp(raw, { density: 600 }); // High density for SVGs
        }
        return await pipeline
            .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true, background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .ensureAlpha()
            .png()
            .toBuffer();
    } catch (e) {
        console.error('safeFetchPng error for', url, e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const host = req.headers.get('host') || 'myunibanner.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        const body = await req.json();
        console.log('API render-banner body:', body);
        const {
            imageUrl,
            logoUrl,
            primaryHex = '#003865',
            layout = 0,
            text = '',
            photoFilter = 'none',
            logoScale = 1.0,
            textSize = 1.0,
        } = body as {
            imageUrl?: string | null;
            logoUrl?: string | null;
            primaryHex?: string;
            layout?: number;
            text?: string;
            logoIsLight?: boolean;
            photoFilter?: string;
            logoPos?: 'top' | 'bottom' | 'center';
            logoScale?: number;
            textSize?: number;
        };

        const primary = hexToRgb(primaryHex);
        const composites: sharp.OverlayOptions[] = [];

        // ── LAYOUT CALCULATIONS ──
        let PHOTO_W = W;
        let PHOTO_H = H;
        let PANEL_W = 0;
        let PANEL_X = 0;

        if (layout === 0) { PHOTO_W = 620; PANEL_W = W - 620; PANEL_X = 620; }
        else if (layout === 1) { PHOTO_W = W; PANEL_W = 550; PANEL_X = W - 550; }
        else if (layout === 2) { PHOTO_W = W; PANEL_W = 580; PANEL_X = W - 580; }
        else if (layout === 5) { PHOTO_W = W - 500; PANEL_W = 500; PANEL_X = W - 500; }
        else if (layout === 6) { PHOTO_W = Math.floor(W * 0.6); PANEL_W = Math.floor(W * 0.55); PANEL_X = W - PANEL_W; }

        // ── 1. Background photo ────────────────────────────────────────
        if (imageUrl) {
            try {
                const raw = await fetchBuf(imageUrl, origin);
                let pipeline = sharp(raw)
                    .resize(PHOTO_W, PHOTO_H, { fit: 'cover', position: 'center' });

                // ── APPLY CSS FILTERS ──
                if (photoFilter && photoFilter !== 'none') {
                    if (photoFilter.includes('grayscale(100%)')) {
                        pipeline = pipeline.grayscale();
                    }
                    
                    // Simple regex to extract modulate parameters
                    const bMatch = photoFilter.match(/brightness\(([\d.]+)\)/);
                    const sMatch = photoFilter.match(/saturate\(([\d.]+)\)/);
                    const hMatch = photoFilter.match(/hue-rotate\(([-\d.]+)deg\)/);
                    const cMatch = photoFilter.match(/contrast\(([\d.]+)\)/);
                    
                    const modulate: any = {};
                    if (bMatch) modulate.brightness = parseFloat(bMatch[1]);
                    if (sMatch) modulate.saturation = parseFloat(sMatch[1]);
                    if (hMatch) modulate.hue = parseFloat(hMatch[1]);
                    
                    if (Object.keys(modulate).length > 0) {
                        pipeline = pipeline.modulate(modulate);
                    }

                    // Sharp's linear(a, b) can simulate contrast(a)
                    // contrast(X) in CSS is roughly linear(X, -(0.5 * X) + 0.5)
                    if (cMatch) {
                        const c = parseFloat(cMatch[1]);
                        pipeline = pipeline.linear(c, -(128 * c) + 128);
                    }

                    // Tints (Sepia-like)
                    if (photoFilter.includes('sepia(')) {
                        const sepMatch = photoFilter.match(/sepia\(([\d.]+)\)/);
                        const intensity = sepMatch ? parseFloat(sepMatch[1]) : 0.5;
                        // Tint with a warm color
                        pipeline = pipeline.tint({ r: 255, g: 240, b: 200 }); 
                    }
                }

                const finalBg = await pipeline.png().toBuffer();
                composites.push({ input: finalBg, top: 0, left: 0 });
            } catch (e) {
                console.error('BG image failed:', e);
            }
        }

        // ── 2. Panel overlay ───────────────────────────────────────────
        const PANEL_ALPHA = 232;

        if ([0, 1, 2, 5, 6].includes(layout)) {
            let panelBuffer: Buffer;
            
            if (layout === 2) {
                const mask = Buffer.from(
                    `<svg width="${PANEL_W}" height="${H}">
                        <polygon points="60,0 ${PANEL_W},0 ${PANEL_W},${H} 0,${H}" fill="white" />
                    </svg>`
                );
                panelBuffer = await sharp({ create: { width: PANEL_W, height: H, channels: 4, background: { ...primary, alpha: 255 } } })
                    .composite([{ input: mask, blend: 'dest-in' }])
                    .png().toBuffer();
            } else if (layout === 6) {
                const mask = Buffer.from(
                    `<svg width="${PANEL_W}" height="${H}">
                        <polygon points="120,0 ${PANEL_W},0 ${PANEL_W},${H} 0,${H}" fill="white" />
                    </svg>`
                );
                panelBuffer = await sharp({ create: { width: PANEL_W, height: H, channels: 4, background: { ...primary, alpha: 255 } } })
                    .composite([{ input: mask, blend: 'dest-in' }])
                    .png().toBuffer();
            } else {
                panelBuffer = await sharp({ create: { width: PANEL_W, height: H, channels: 4, background: { ...primary, alpha: layout === 0 ? 255 : PANEL_ALPHA } } })
                    .png().toBuffer();
            }
            
            composites.push({ input: panelBuffer, top: 0, left: PANEL_X });
        }


        // ── 3. Logo ───────────────────────────────────────────────────
        if (logoUrl) {
            // Match client SmartLogo h/maxW values per layout, scaled by user's logoScale
            const LOGO_BASE_H = layout === 6 ? 120 : layout === 7 ? 180 : layout === 4 ? 150 : 140;
            const LOGO_BASE_W = layout === 6 ? 360 : layout === 7 ? 400 : layout === 4 ? 400 : 380;
            const LOGO_MAX_H = Math.round(LOGO_BASE_H * logoScale);
            const LOGO_MAX_W = Math.round(LOGO_BASE_W * logoScale);

            const logoBuf = await safeFetchPng(logoUrl, LOGO_MAX_W, LOGO_MAX_H, origin);
            if (logoBuf) {
                const lm = await sharp(logoBuf).metadata();
                const lw = lm.width ?? LOGO_MAX_W;
                const lh = lm.height ?? LOGO_MAX_H;
                const textOffset = text ? Math.floor(lh * 0.35) : 0;

                let logoLeft: number, logoTop: number;

                if (PANEL_W > 0) {
                    logoLeft = PANEL_X + Math.floor((PANEL_W - lw) / 2) + (layout === 2 ? 30 : layout === 6 ? 60 : 0);
                    logoTop = Math.floor((H - lh) / 2) - textOffset;
                } else if (layout === 4) {
                    const lPos = body.logoPos || 'bottom';
                    logoLeft = W - lw - 40;
                    if (lPos === 'top') logoTop = 40;
                    else if (lPos === 'center') logoTop = Math.floor((H - lh) / 2);
                    else logoTop = H - lh - 40; // bottom
                } else {
                    // Centered layouts (3, 7)
                    logoLeft = Math.floor((W - lw) / 2);
                    logoTop = Math.floor((H - lh) / 2) - textOffset;
                }

                logoLeft = Math.max(0, Math.min(logoLeft, W - lw));
                logoTop = Math.max(0, Math.min(logoTop, H - lh));

                composites.push({ input: logoBuf, top: logoTop, left: logoLeft, blend: 'over' });
            }
        }

        // ── 4. Text Overlay ───────────────────────────────────────────
        if (text && text.trim().length > 0) {
            let panelW = 0, panelX = 0;
            if (layout === 0) { panelW = W - 620; panelX = 620; }
            else if (layout === 1) { panelW = 550; panelX = W - 550; }
            else if (layout === 2) { panelW = 580; panelX = W - 580; }
            else if (layout === 5) { panelW = 500; panelX = W - 500; }
            else if (layout === 6) { panelW = Math.floor(W * 0.55); panelX = W - panelW; }

            const MAX_LINE_LEN = 30;
            const words = text.split(/\s+/);
            const lines: string[] = [];
            let currentLine = '';
            words.forEach(word => {
                if ((currentLine + ' ' + word).trim().length <= MAX_LINE_LEN) {
                    currentLine = (currentLine + ' ' + word).trim();
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            });
            if (currentLine) lines.push(currentLine);

            const finalLines = lines.slice(0, 3);
            
            let centerX: number, centerY: number;
            
            if (layout === 4) {
                const lPos = body.logoPos || 'bottom';
                const lBuf = composites.find(c => c.input && !c.input.toString().includes('svg'))?.input; // find the logo buffer
                // For Layout 4, the text should be to the left of the logo
                // Let's simplify: place it right-aligned with the logo area
                const LOGO_W_EST = 180; // approximate
                centerX = W - 40 - (LOGO_W_EST / 2) - 300; // Shifted left to clear logo
                if (lPos === 'top') centerY = 40 + 60;
                else if (lPos === 'center') centerY = Math.floor(H / 2);
                else centerY = H - 40 - 60;
            } else {
                centerX = panelW > 0 ? (panelX + (panelW / 2) + (layout === 2 ? 30 : layout === 6 ? 60 : 0)) : (W / 2);
                centerY = [0, 1, 2, 5, 6].includes(layout) ? 320 : layout === 3 ? 340 : 310;
            }
            
            const hColor = body.headlineColor || (body.logoIsLight ? '#ffffff' : '#111111');
            console.log(`Rendering text: "${text}" with color: ${hColor} at center: ${centerX},${centerY}`);

            const textWidth = Math.floor(panelW > 0 ? panelW + 100 : W);
            const textHeight = 150;
            const textLeft = Math.floor(centerX - textWidth / 2);
            const textTop = Math.floor(centerY - textHeight / 2) - 10;

            try {
                // Satori strictly requires an explicit font in Node API environments!
                // Fetching a fast, reliable bold TTF from Google Fonts to guarantee text renders.
                const fontRes = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmYUtfBBc9.ttf');
                const fontData = await fontRes.arrayBuffer();

                const textImageRes = new ImageResponse(
                    React.createElement('div', {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: textWidth,
                            height: textHeight,
                            color: hColor,
                            fontSize: Math.round(30 * textSize),
                            fontWeight: 900,
                            lineHeight: 1.15,
                            letterSpacing: '-0.02em',
                            textAlign: 'center',
                            fontFamily: '"Roboto"',
                            background: 'transparent'
                        }
                    }, finalLines.map((line, i) => React.createElement('div', {
                        key: i,
                        style: { display: 'flex', justifyContent: 'center' }
                    }, line))),
                    { 
                        width: textWidth, 
                        height: textHeight,
                        fonts: [{
                            name: 'Roboto',
                            data: fontData,
                            weight: 900,
                            style: 'normal',
                        }]
                    }
                );

                const textImgBuffer = Buffer.from(await textImageRes.arrayBuffer());
                
                // Only composite if we got a valid image buffer
                if (textImgBuffer.length > 100) {
                    composites.push({ input: textImgBuffer, top: textTop, left: textLeft, blend: 'over' });
                } else {
                    console.error('ImageResponse produced an empty image buffer');
                }
            } catch (textErr) {
                console.error('Text overlay generation failed via ImageResponse:', textErr);
            }
        } else {
            console.log('Skipping text overlay: text is empty or missing.');
        }

        // ── 5. Compose ────────────────────────────────────────────────
        const usePhotoBase = !![0, 1, 2, 4, 5, 6, 7].includes(layout) && imageUrl;
        const baseColor = usePhotoBase ? { r: 0, g: 0, b: 0 } : primary;

        const output = await sharp({
            create: { width: W, height: H, channels: 3, background: baseColor }
        })
            .composite(composites)
            .png({ compressionLevel: 9, effort: 10 }) // Maximum PNG quality
            .toBuffer();

        return new NextResponse(new Uint8Array(output), {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': 'attachment; filename="linkedin-banner.png"',
                'Content-Length': String(output.length),
                'Cache-Control': 'no-store',
            },
        });
    } catch (err) {
        console.error('render-banner error:', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
