import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ALL_UNIVERSITIES } from '@/data/universities';
import sharp from 'sharp';

const GOOD_LOGO_KEYWORDS = [
    'logo', 'wordmark', 'text', 'full', 'horizontal', 'positive', 'positiv', 'main', 'primary',
    'slogo', 'lockup', 'wordmark', 'official', 'brand', 'color', 'colour', 'wide'
];

const BAD_LOGO_KEYWORDS = [
    'favicon', 'icon', 'mark', 'crest', 'badge', 'seal', 'avatar', 'symbol', 'monogram', 'small'
];

function scoreLogoFile(filename: string): number {
    const fl = filename.toLowerCase();
    let score = 0;
    for (const kw of GOOD_LOGO_KEYWORDS) if (fl.includes(kw)) score += 10;
    for (const kw of BAD_LOGO_KEYWORDS) if (fl.includes(kw)) score -= 10;
    if (fl.endsWith('.svg')) score += 6;
    if (fl.endsWith('.png')) score += 4;
    if (fl.endsWith('.webp')) score += 2;
    if (fl.endsWith('.jpg') || fl.endsWith('.jpeg')) score -= 2;
    return score;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const domain = (searchParams.get('domain') || '').toLowerCase().trim();

    if (!domain) {
        return new Response('No domain', { status: 400 });
    }

    const uni = ALL_UNIVERSITIES.find(u => u.domain === domain);
    if (!uni) {
        return NextResponse.redirect(`https://logo.clearbit.com/${domain}`);
    }

    const logoDir = join(process.cwd(), 'public', uni.root, uni.folder, 'logo-search');

    if (existsSync(logoDir)) {
        // Find the best image file in the logo-search folder
        const files = readdirSync(logoDir).filter(f => /\.(jpe?g|png|svg|webp|ico)$/i.test(f) && !f.startsWith('.'));
        if (files.length > 0) {
            const ranked = [...files].sort((a, b) => scoreLogoFile(b) - scoreLogoFile(a));
            const selected = ranked[0];
            const filePath = join(logoDir, selected);
            const fileBuffer = readFileSync(filePath);
            const ext = selected.split('.').pop()!.toLowerCase();
            const contentType =
                ext === 'svg' ? 'image/svg+xml' :
                    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                        ext === 'png' ? 'image/png' :
                            ext === 'webp' ? 'image/webp' :
                                'image/jpeg';

            if (ext !== 'svg') {
                try {
                    const trimmed = await sharp(fileBuffer)
                        .resize({ width: 128, height: 128, fit: 'inside', withoutEnlargement: true })
                        .toBuffer();

                    return new Response(new Uint8Array(trimmed), {
                        headers: {
                            'Content-Type': contentType,
                            'Cache-Control': 'no-store',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        },
                    });
                } catch {
                    // Fall through to raw buffer if trimming fails
                }
            }

            return new Response(fileBuffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                },
            });
        }
    }

    // Fallback to Clearbit
    return NextResponse.redirect(`https://logo.clearbit.com/${domain}`);
}
