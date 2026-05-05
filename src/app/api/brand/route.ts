import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { ALL_UNIVERSITIES } from '@/data/universities';
import { existsSync, readFileSync, readdirSync } from 'fs';

import { join } from 'path';
import sharp from 'sharp';

const DEFINITELY_NOT_LOGO = ['wide', 'campus', 'aerial', 'panorama', 'university college london', 'background'];
const GOOD_LOGO_KEYWORDS = ['tekst', 'text', 'horizontal', 'fullname', 'fullcolour', 'full-colour', 'full colour', 'manchester - logo', 'logo - tekst', 'imperial_logo', 'logo-tekst'];

function scoreFile(f: string): number {
    const fl = f.toLowerCase();
    if (DEFINITELY_NOT_LOGO.some(kw => fl.includes(kw))) return -999;
    let s = 0;
    if (GOOD_LOGO_KEYWORDS.some(kw => fl.includes(kw))) s += 100;
    if (fl.includes('icon')) s -= 10;
    if (fl.includes('crest')) s -= 5;
    // Prefer colour logos over black/monochrome
    if (fl.includes('colour') || fl.includes('color') || fl.includes('fullcolour') || fl.includes('full-colour')) s += 10;
    if (fl.includes('black') || fl.includes('white') || fl.includes('singlecolour') || fl.includes('monochrome')) s -= 10;
    if (fl.endsWith('.svg')) s += 20;
    if (fl.endsWith('.png')) s += 10;
    if (fl.endsWith('.webp')) s += 5;
    if (fl.endsWith('.jpg') || fl.endsWith('.jpeg')) s -= 5;
    return s;
}

async function rasterHasBg(filePath: string): Promise<boolean> {
    try {
        const img = sharp(filePath);
        const { width, height, channels } = await img.metadata();
        if (!width || !height) return false;
        const PATCH = 6;
        const corners = [
            { left: 0, top: 0 },
            { left: Math.max(0, width - PATCH), top: 0 },
            { left: 0, top: Math.max(0, height - PATCH) },
            { left: Math.max(0, width - PATCH), top: Math.max(0, height - PATCH) },
        ];
        const hasAlphaChannel = channels && channels >= 4;
        let totalAlpha = 0;
        for (const corner of corners) {
            const raw = await sharp(filePath)
                .extract({ left: corner.left, top: corner.top, width: PATCH, height: PATCH })
                .raw()
                .toBuffer({ resolveWithObject: true });
            const data = raw.data;
            const stride = hasAlphaChannel ? 4 : 3;
            const pixCount = data.length / stride;
            let patchAlpha = 0;
            for (let i = 0; i < data.length; i += stride) {
                patchAlpha += hasAlphaChannel ? data[i + 3] : 255;
            }
            totalAlpha += patchAlpha / pixCount;
        }
        const avgAlpha = totalAlpha / corners.length;
        return !hasAlphaChannel || avgAlpha >= 240;
    } catch { return false; }
}

async function imageIsLight(filePath: string): Promise<boolean> {
    try {
        const raw = await sharp(filePath).resize(32, 32, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
        const data = raw.data;
        const stride = raw.info.channels;
        let totalLuma = 0;
        let count = 0;
        let diffs = 0;
        let lastLuma = -1;
        
        for (let i = 0; i < data.length; i += stride) {
            const r = data[i], g = data[i+1], b = data[i+2], a = stride >= 4 ? data[i+3] : 255;
            if (a > 20) { // Slight alpha threshold
                const luma = (0.299 * r + 0.587 * g + 0.114 * b);
                totalLuma += luma;
                count++;
                if (lastLuma !== -1) diffs += Math.abs(luma - lastLuma);
                lastLuma = luma;
            }
        }
        
        // If the image is basically one solid color (no variation), it might be "empty" or a background block
        if (count > 0 && diffs === 0 && (totalLuma / count) > 250) return true; // Pure white square

        return count === 0 ? true : (totalLuma / count) > 130;
    } catch {
        const f = filePath.toLowerCase();
        return f.includes('white') || f.includes('light') || f.includes('inv') || f.includes('hvit');
    }
}

async function isLogoEmpty(filePath: string): Promise<boolean> {
    try {
        const stats = await sharp(filePath).stats();
        // If standard deviation is extremely low across all channels
        const totalStdev = stats.channels.reduce((acc, c) => acc + c.stdev, 0);
        if (totalStdev < 1) return true; // Less than 1 is basically a solid block
        return false;
    } catch { return false; }
}

async function getLogoColor(filePath: string): Promise<string | null> {
    try {
        const { data, info } = await sharp(filePath).resize(100, 100, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
        const stride = info.channels;
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += stride) {
            const r = data[i], g = data[i+1], b = data[i+2], a = stride >= 4 ? data[i+3] : 255;
            if (a < 128) continue;
            if (r > 240 && g > 240 && b > 240) continue;
            const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        const sorted = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);
        return sorted[0]?.[0] || null;
    } catch { return null; }
}

async function getAllLogos(basePath: string, folder: string, domain: string, campus?: string | null): Promise<Array<{
    url: string; hasBg: boolean; isIcon: boolean; isText: boolean; score: number; filename: string; isLight: boolean; logoColor: string | null;
}>> {
    const rootLogoDir = join(basePath, folder, 'Logo');
    if (!existsSync(rootLogoDir)) return [];

    let logoDir = rootLogoDir;
    if (campus) {
        const campusLogoPath = join(rootLogoDir, campus);
        if (campusLogoPath.startsWith(rootLogoDir) && existsSync(campusLogoPath)) {
            logoDir = campusLogoPath;
        }
    }

    const files = readdirSync(logoDir)
        .filter(f => /\.(png|svg|webp|jpg|jpeg)$/i.test(f) && !f.startsWith('.'))
        .filter(f => scoreFile(f) > -500);

    const results = await Promise.all(files.map(async (f) => {
        const logoPath = join(logoDir, f);
        if (await isLogoEmpty(logoPath)) return null;

        const ext = f.split('.').pop()?.toLowerCase() ?? '';
        const isIcon = f.toLowerCase().includes('icon') || f.toLowerCase().includes('crest');
        let hasBg = ext === 'jpg' || ext === 'jpeg';
        if (!hasBg && (ext === 'png' || ext === 'webp')) hasBg = await rasterHasBg(logoPath);
        const isLight = await imageIsLight(logoPath);
        const logoColor = await getLogoColor(logoPath);
        
        // Let's add a smart hint for background preferences
        let preferredBg: string | null = null;
        if (f.toLowerCase().includes('hvit teskt')) {
            preferredBg = '#575756'; // Specifically for NTNU's request
        } else if (f.toLowerCase().includes('henley') && f.toLowerCase().includes('white')) {
            preferredBg = '#1E3582'; // Henley Blue
        } else if (folder === 'LSE' && (isLight || f.toLowerCase().includes('white') || f.toLowerCase().includes('light'))) {
            preferredBg = '#f33131'; // Force new LSE Red background for LSE light logos
        }

        // We only want the relative filename to re-fetch via api/full-logo
        // But if it's in a subfolder, we need that path segment
        const fileParam = (logoDir !== rootLogoDir && campus) ? join(campus, f) : f;

        return {
            url: `/api/full-logo?domain=${domain}&file=${encodeURIComponent(fileParam)}&v=${Date.now()}`,
            hasBg, isLight, logoColor, isIcon, isText: !isIcon, score: scoreFile(f), filename: f,
            preferredBg
        };
    }));
    return (results.filter(r => r !== null) as any[]).sort((a, b) => b.score - a.score);
}

function getImageFiles(basePath: string, folder: string, campus?: string | null): string[] {
    const rootDir = join(basePath, folder, 'Bilder_HighRez');
    if (!existsSync(rootDir)) return [];
    
    let targetDir = campus 
        ? join(rootDir, campus)
        : rootDir;

    // Handle character normalization (NFC vs NFD) for folders like "Ås" or "Bodø"
    if (!existsSync(targetDir)) {
        const nfc = targetDir.normalize('NFC');
        const nfd = targetDir.normalize('NFD');
        if (existsSync(nfc)) targetDir = nfc;
        else if (existsSync(nfd)) targetDir = nfd;
        else if (!campus) return []; // Root doesn't exist even with norm
        else targetDir = rootDir; // Fallback to root if campus folder literally not found
    }
    
    function walk(d: string): string[] {
        let results: string[] = [];
        const items = readdirSync(d, { withFileTypes: true });
        for (const item of items) {
            const fullPath = join(d, item.name);
            if (item.isDirectory()) {
                results = results.concat(walk(fullPath));
            } else if (/\.(jpe?g|png|webp|avif)$/i.test(item.name) && !item.name.toLowerCase().includes('with logo')) {
                // Get the path relative to rootDir to reconstruct the file param
                const relPath = fullPath.replace(rootDir + '/', '');
                const root = basePath.split('/').pop() || '';
                const encodedFolder = folder.split('/').map(encodeURIComponent).join('/');
                const encodedRel = relPath.split('/').map(encodeURIComponent).join('/');
                results.push(`/${root}/${encodedFolder}/Bilder_HighRez/${encodedRel}`);
            }
        }
        return results;
    }
    
    return walk(targetDir);
}

function getBrand(basePath: string, folder: string) {
    const jsonDir = join(basePath, folder, 'Brand_Farger_Fonter');
    if (!existsSync(jsonDir)) return null;
    const file = readdirSync(jsonDir).find(f => f.endsWith('.json'));
    if (!file) return null;
    try {
        return JSON.parse(readFileSync(join(jsonDir, file), 'utf8'));
    } catch { return null; }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('domain')?.toLowerCase().trim() || searchParams.get('q')?.toLowerCase().trim() || '';
    const campus = searchParams.get('campus');
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 });

    const match = ALL_UNIVERSITIES.find(u =>
        u.domain === query || u.name.toLowerCase() === query || u.short?.toLowerCase() === query
    ) ?? ALL_UNIVERSITIES.find(u =>
        u.name.toLowerCase().includes(query) || u.short?.toLowerCase().includes(query) || u.domain.toLowerCase().includes(query)
    );

    if (!match) return NextResponse.json({ error: 'University not found' }, { status: 404 });

    const cacheDir = join(process.cwd(), 'src', 'data', 'cache');
    const cachePath = join(cacheDir, `${match.domain}${campus ? `-${campus}` : ''}.json`);

    // ── CACHE CHECK ──────────────────────────────────────────
    if (existsSync(cachePath)) {
        try {
            const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
            // Still check for fresh image files (in case they were added) but skip the sharp analysis
            return NextResponse.json(cached);
        } catch { /* proceed to re-analyze */ }
    }

    const basePath = join(process.cwd(), 'public', match.root);
    const brand = getBrand(basePath, match.folder);
    const images = getImageFiles(basePath, match.folder, campus);
    const logos = await getAllLogos(basePath, match.folder, match.domain, campus);
    const colors: string[] = brand?.colors?.map((c: { hex: string }) => c.hex) ?? ['#003865'];
    const fonts: string[] = brand?.fonts?.map((f: { name: string }) => f.name) ?? ['Inter'];

    const bestTextLogo = logos.find(l => l.isText) ?? logos[0];
    const bestIconLogo = logos.find(l => l.isIcon) ?? logos[logos.length - 1] ?? logos[0];

    const finalData = {
        name: match.short || match.name,
        fullName: match.name,
        domain: match.domain,
        folder: match.folder,
        root: match.root,
        logo: `/api/logo?domain=${match.domain}`,
        fullLogo: (bestTextLogo?.url ?? `/api/full-logo?domain=${match.domain}&v=${Date.now()}`) + "&w=800",
        iconLogo: bestIconLogo?.url ? (bestIconLogo.url + "&w=800") : undefined,
        logoHasBg: bestTextLogo?.hasBg ?? false,
        logos: logos.map(l => ({ ...l, url: l.url + "&w=800" })), 
        colors, 
        fonts, 
        images,
    };

    // ── SAVE TO CACHE ───────────────────────────────────────
    try {
        if (!existsSync(cacheDir)) {
          const fs = require('fs');
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        const fs = require('fs');
        fs.writeFileSync(cachePath, JSON.stringify(finalData), 'utf8');
    } catch (e) { console.error("Cache write failed:", e); }

    return NextResponse.json(finalData);
}
