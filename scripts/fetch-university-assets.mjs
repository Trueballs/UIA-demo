#!/usr/bin/env node
/**
 * fetch-university-assets.mjs
 * Downloads campus pictures (min 800x600) and logos (SVG/transparent PNG)
 * from Wikimedia Commons for a given university.
 *
 * Usage: node scripts/fetch-university-assets.mjs "University of Aberdeen"
 */

import { existsSync, mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { join, extname } from 'path';
import https from 'https';
import http from 'http';

const BASE = join(process.cwd(), 'public', 'universities');
const UNI_NAME = process.argv[2] || 'University of Aberdeen';

const PICTURES_DIR = join(BASE, UNI_NAME, 'pictures');
const LOGO_DIR = join(BASE, UNI_NAME, 'logo');
const LOGO_SEARCH_DIR = join(BASE, UNI_NAME, 'logo-search');

[PICTURES_DIR, LOGO_DIR, LOGO_SEARCH_DIR].forEach(d => mkdirSync(d, { recursive: true }));

// ── helpers ──────────────────────────────────────────────────────────────────

function get(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'LNBackground/1.0 (student project)' } }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return get(res.headers.location).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function download(url, destPath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'LNBackground/1.0 (student project)' } }, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const contentType = res.headers['content-type'] || '';
            if (contentType.includes('text/html')) return reject(new Error('Got HTML instead of image'));
            const file = createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
            file.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function downloadWithRetry(url, destPath, retries = 4) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await download(url, destPath);
            return true;
        } catch (e) {
            if (attempt < retries) {
                const wait = attempt * 3000;
                console.log(`    ↩ Retry ${attempt}/${retries - 1} after ${wait / 1000}s (${e.message})`);
                await sleep(wait);
            } else {
                throw e;
            }
        }
    }
    return false;
}

// ── Wikimedia Commons search ──────────────────────────────────────────────────

async function searchImages(query, limit = 30) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=${limit}&gsrsearch=${encodeURIComponent(query)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1200&format=json`;
    const raw = await get(url);
    const data = JSON.parse(raw);
    const pages = Object.values(data?.query?.pages ?? {});
    return pages.map(p => {
        const ii = p.imageinfo?.[0];
        return {
            title: p.title,
            url: ii?.url,
            thumburl: ii?.thumburl,
            width: ii?.width,
            height: ii?.height,
            mime: ii?.mime,
        };
    }).filter(p => p.url);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function fetchPictures() {
    console.log(`\n📸 Fetching campus pictures for: ${UNI_NAME}`);

    // Search with multiple queries to get varied results
    const queries = [
        `${UNI_NAME} campus`,
        `${UNI_NAME} building`,
        `${UNI_NAME} library`,
    ];

    const seen = new Set();
    const candidates = [];

    for (const q of queries) {
        try {
            const results = await searchImages(q, 20);
            for (const r of results) {
                if (!seen.has(r.url) && r.width >= 800 && r.height >= 600) {
                    const mime = r.mime || '';
                    if (mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp')) {
                        seen.add(r.url);
                        candidates.push(r);
                    }
                }
            }
        } catch (e) {
            console.warn(`  ⚠ Search failed for "${q}": ${e.message}`);
        }
        await sleep(600);
    }

    // Sort by image size (largest first) and take top 12
    candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const toDownload = candidates.slice(0, 12);

    console.log(`  Found ${candidates.length} candidates, downloading top ${toDownload.length}...`);

    let downloaded = 0;
    for (let i = 0; i < toDownload.length; i++) {
        const img = toDownload[i];
        const ext = img.mime === 'image/png' ? '.png' : img.mime === 'image/webp' ? '.webp' : '.jpg';
        const num = String(i + 1).padStart(2, '0');
        const dest = join(PICTURES_DIR, `${num}-campus${ext}`);

        if (existsSync(dest)) {
            console.log(`  ⏭  Skip (exists): ${num}-campus${ext}`);
            downloaded++;
            continue;
        }

        try {
            await downloadWithRetry(img.url, dest);
            console.log(`  ✅ ${num}-campus${ext} (${img.width}x${img.height})`);
            downloaded++;
        } catch (e) {
            console.warn(`  ⚠ Failed ${num}: ${e.message}`);
        }
        await sleep(1500);
    }

    console.log(`  → Downloaded ${downloaded} pictures`);
}

async function fetchLogos() {
    console.log(`\n🎨 Fetching logos for: ${UNI_NAME}`);

    const queries = [
        `${UNI_NAME} logo`,
        `${UNI_NAME} crest`,
        `${UNI_NAME} seal`,
    ];

    const seen = new Set();
    const candidates = [];

    for (const q of queries) {
        try {
            const results = await searchImages(q, 15);
            for (const r of results) {
                if (!seen.has(r.url)) {
                    const mime = r.mime || '';
                    // Only accept SVG or PNG (which can have transparency)
                    if (mime === 'image/svg+xml' || mime === 'image/png') {
                        seen.add(r.url);
                        candidates.push(r);
                    }
                }
            }
        } catch (e) {
            console.warn(`  ⚠ Search failed for "${q}": ${e.message}`);
        }
        await sleep(600);
    }

    console.log(`  Found ${candidates.length} logo candidates (SVG/PNG only)...`);

    // Download up to 5 logos to logo/, first one also to logo-search/
    const toDownload = candidates.slice(0, 5);
    let downloaded = 0;

    for (let i = 0; i < toDownload.length; i++) {
        const img = toDownload[i];
        const ext = img.mime === 'image/svg+xml' ? '.svg' : '.png';
        const num = String(i + 1).padStart(2, '0');
        const dest = join(LOGO_DIR, `logo-${num}${ext}`);

        if (existsSync(dest)) {
            console.log(`  ⏭  Skip (exists): logo-${num}${ext}`);
            downloaded++;
        } else {
            try {
                await downloadWithRetry(img.url, dest);
                console.log(`  ✅ logo-${num}${ext} (${img.width ?? '?'}x${img.height ?? '?'})`);
                downloaded++;
            } catch (e) {
                console.warn(`  ⚠ Failed logo-${num}: ${e.message}`);
                continue;
            }
            await sleep(1500);
        }

        // First successful logo → also save to logo-search/
        if (i === 0) {
            const searchDest = join(LOGO_SEARCH_DIR, `logo${ext}`);
            if (!existsSync(searchDest)) {
                try {
                    await downloadWithRetry(img.url, searchDest);
                    console.log(`  ✅ logo-search/logo${ext} (search field logo)`);
                } catch (e) {
                    console.warn(`  ⚠ Failed logo-search copy: ${e.message}`);
                }
            }
        }
    }

    console.log(`  → Downloaded ${downloaded} logos`);
}

// ── Run ─────────────────────────────────────────────────────────────────────

(async () => {
    console.log(`\n🎓 LNBackground Asset Fetcher`);
    console.log(`   University: ${UNI_NAME}`);
    console.log(`   Pictures dir: ${PICTURES_DIR}`);
    console.log(`   Logo dir:     ${LOGO_DIR}`);

    await fetchPictures();
    await fetchLogos();

    console.log('\n🏁 Done!\n');
})();
