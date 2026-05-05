#!/usr/bin/env node
// scripts/retry-logos.mjs
// Deep retry for universities that failed the first time.
// Run with: node scripts/retry-logos.mjs

import { mkdir, writeFile, access, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'universities');

// The 41 that failed — with manually curated logo URL hints from each site:
const FAILED = [
    { name: "University of Bedfordshire", domain: "beds.ac.uk", hints: ["https://www.beds.ac.uk/site-elements/images/logo-uob.svg", "https://www.beds.ac.uk/site-elements/images/logo.svg", "https://www.beds.ac.uk/images/logo.png"] },
    { name: "Bishop Grosseteste University", domain: "bishopg.ac.uk", hints: ["https://www.bishopg.ac.uk/wp-content/themes/bgu/images/logo.svg", "https://www.bishopg.ac.uk/wp-content/themes/bgu/images/logo.png", "https://www.bishopg.ac.uk/assets/img/logo.svg"] },
    { name: "University of Bolton", domain: "bolton.ac.uk", hints: ["https://www.bolton.ac.uk/assets/Uploads/UoB-logo.svg", "https://www.bolton.ac.uk/assets/Uploads/logo.png", "https://www.bolton.ac.uk/images/logo.png"] },
    { name: "Bournemouth University", domain: "bournemouth.ac.uk", hints: ["https://www.bournemouth.ac.uk/sites/default/files/asset/image/BU-crest-white.svg", "https://www.bournemouth.ac.uk/sites/default/files/asset/image/bu-logo.svg", "https://www.bournemouth.ac.uk/themes/custom/bu/images/bu-logo-blue.svg"] },
    { name: "Canterbury Christ Church University", domain: "canterbury.ac.uk", hints: ["https://www.canterbury.ac.uk/assets/images/logo.svg", "https://www.canterbury.ac.uk/media/images/CCCU-logo.svg", "https://www.canterbury.ac.uk/assets/img/cccu-logo.png"] },
    { name: "Cardiff University", domain: "cardiff.ac.uk", hints: ["https://www.cardiff.ac.uk/sites/default/files/shared-assets/img/brand/corporate-logo.svg", "https://www.cardiff.ac.uk/sites/default/files/shared-assets/img/brand/cardiff-university-logo.svg", "https://www.cardiff.ac.uk/brand/media/images/cardiff-logo.svg", "https://www.cardiff.ac.uk/themes/custom/main/images/svg/cardiff-logo.svg"] },
    { name: "City, University of London", domain: "city.ac.uk", hints: ["https://www.city.ac.uk/themes/custom/city_base/logo.svg", "https://www.city.ac.uk/__data/assets/image/0004/537027/City_logo_white.png", "https://www.city.ac.uk/about/city-at-a-glance/brand/logos", "https://www.city.ac.uk/themes/custom/city_base/images/city-logo.svg"] },
    { name: "Courtauld Institute of Art", domain: "courtauld.ac.uk", hints: ["https://courtauld.ac.uk/wp-content/themes/courtauld/images/logo.svg", "https://courtauld.ac.uk/wp-content/uploads/logo.png", "https://www.courtauld.ac.uk/wp-content/themes/courtauld/src/images/logo.svg"] },
    { name: "University of Cumbria", domain: "cumbria.ac.uk", hints: ["https://www.cumbria.ac.uk/themes/custom/ucumbria/logo.svg", "https://www.cumbria.ac.uk/media/university-of-cumbria-website/content-assets/images/logo.svg", "https://www.cumbria.ac.uk/images/logo.png"] },
    { name: "University of Dundee", domain: "dundee.ac.uk", hints: ["https://www.dundee.ac.uk/sites/default/files/styles/front_page_banner/public/dundee-logo.svg", "https://www.dundee.ac.uk/themes/bootstrap/logo.png", "https://www.dundee.ac.uk/brand/files/logos/dundee-logo-rgb.svg", "https://www.dundee.ac.uk/sites/all/themes/uod/images/logo.svg"] },
    { name: "Durham University", domain: "durham.ac.uk", hints: ["https://www.durham.ac.uk/media/durham-university/official-logo/logo.svg", "https://www.durham.ac.uk/themes/custom/durham/images/du-logo.svg", "https://www.durham.ac.uk/assets/img/du-logo.svg", "https://www.durham.ac.uk/static/img/logo.svg"] },
    { name: "University of East London", domain: "uel.ac.uk", hints: ["https://www.uel.ac.uk/themes/custom/uel/logo.svg", "https://www.uel.ac.uk/sites/default/files/uploads/uel-logo.png", "https://www.uel.ac.uk/assets/images/uel-logo.svg", "https://www.uel.ac.uk/assets/img/logo.png"] },
    { name: "Glasgow Caledonian University", domain: "gcu.ac.uk", hints: ["https://www.gcu.ac.uk/brand/logos/gcu-logo.svg", "https://www.gcu.ac.uk/brand/logos/GCU_Logo_RGB.svg", "https://www.gcu.ac.uk/assets/img/gcu-logo.png", "https://www.gcu.ac.uk/sites/default/files/gculogo.svg"] },
    { name: "Hartpury University", domain: "hartpury.ac.uk", hints: ["https://www.hartpury.ac.uk/wp-content/themes/hartpury/images/logo.png", "https://www.hartpury.ac.uk/wp-content/themes/hartpury/images/logo.svg", "https://www.hartpury.ac.uk/assets/images/logo.svg", "https://www.hartpury.ac.uk/images/logo.png"] },
    { name: "Heriot-Watt University", domain: "hw.ac.uk", hints: ["https://www.hw.ac.uk/uk/media/img/hw-logo.png", "https://www.hw.ac.uk/uk/media/img/logo.png", "https://www.hw.ac.uk/img/hw-logo.png", "https://www.hw.ac.uk/brand/hw-logo.svg", "https://www.hw.ac.uk/assets/img/logo.svg"] },
    { name: "University of Hertfordshire", domain: "herts.ac.uk", hints: ["https://www.herts.ac.uk/style-guide/images/logo.svg", "https://www.herts.ac.uk/docstore/images/logo.png", "https://www.herts.ac.uk/themes/custom/uoh/logo.svg", "https://www.herts.ac.uk/assets/images/uoh-logo.svg"] },
    { name: "University of Kent", domain: "kent.ac.uk", hints: ["https://www.kent.ac.uk/brand/logos/kent.svg", "https://www.kent.ac.uk/brand/logos/kent-logo.svg", "https://www.kent.ac.uk/img/logo.svg", "https://www.kent.ac.uk/content/dam/kent/logos/kent-university-logo.svg"] },
    { name: "Kingston University", domain: "kingston.ac.uk", hints: ["https://www.kingston.ac.uk/assets/i/logo.svg", "https://www.kingston.ac.uk/images/logo.svg", "https://www.kingston.ac.uk/assets/img/ku-logo.svg", "https://www.kingston.ac.uk/brand/images/logo.svg"] },
    { name: "Leeds Arts University", domain: "leeds-arts.ac.uk", hints: ["https://leeds-arts.ac.uk/wp-content/themes/lau/images/logo.svg", "https://leeds-arts.ac.uk/wp-content/uploads/logo.png", "https://www.leeds-arts.ac.uk/assets/images/lau-logo.svg"] },
    { name: "Leeds Beckett University", domain: "leedsbeckett.ac.uk", hints: ["https://www.leedsbeckett.ac.uk/media/1066/lbu-logo.svg", "https://www.leedsbeckett.ac.uk/assets/img/lbu-logo.png", "https://www.leedsbeckett.ac.uk/themes/custom/lbu/logo.svg"] },
    { name: "University of Leicester", domain: "le.ac.uk", hints: ["https://www.le.ac.uk/brand/logos/uol-logo.svg", "https://www.le.ac.uk/brand/logos/logo.svg", "https://www.le.ac.uk/images/logo.svg", "https://le.ac.uk/themes/custom/uol/logo.svg", "https://www.le.ac.uk/assets/images/logo-uol.svg"] },
    { name: "University of Lincoln", domain: "lincoln.ac.uk", hints: ["https://www.lincoln.ac.uk/media/images/logo.svg", "https://www.lincoln.ac.uk/themes/uol/images/logo.svg", "https://www.lincoln.ac.uk/assets/img/logo.png", "https://www.lincoln.ac.uk/images/logo-lincoln.svg"] },
    { name: "Liverpool Hope University", domain: "hope.ac.uk", hints: ["https://www.hope.ac.uk/media/liverpoolhope/contentassets/images/logo/hope-logo.svg", "https://www.hope.ac.uk/assets/img/logo.svg", "https://www.hope.ac.uk/images/logo.png", "https://www.hope.ac.uk/website/assets/images/logo.png"] },
    { name: "London South Bank University", domain: "lsbu.ac.uk", hints: ["https://www.lsbu.ac.uk/assets/img/lsbu-logo.svg", "https://www.lsbu.ac.uk/themes/custom/lsbu/logo.svg", "https://www.lsbu.ac.uk/sites/default/files/lsbu-logo.png", "https://www.lsbu.ac.uk/media/images/logo.svg"] },
    { name: "Norwich University of the Arts", domain: "nua.ac.uk", hints: ["https://www.nua.ac.uk/wp-content/themes/nua/images/nua-logo.svg", "https://www.nua.ac.uk/wp-content/themes/nua/assets/images/NUA-logo.svg", "https://nua.ac.uk/wp-content/uploads/logo.png"] },
    { name: "Nottingham Trent University", domain: "ntu.ac.uk", hints: ["https://www.ntu.ac.uk/__data/assets/image/0026/1005060/NTU-logo-2019.svg", "https://www.ntu.ac.uk/images/ntu-logo.svg", "https://www.ntu.ac.uk/assets/img/logo.svg", "https://www.ntu.ac.uk/__data/assets/image/logo.svg"] },
    { name: "Open University", domain: "open.ac.uk", hints: ["https://www.open.ac.uk/includes/ou-brand-assets/masterband-and-logo/ou-logo-large-master.svg", "https://www.open.ac.uk/assets/img/logo.svg", "https://www.open.ac.uk/images/ou-logo.svg", "https://www.open.ac.uk/brand/logo.svg"] },
    { name: "Queen Mary University of London", domain: "qmul.ac.uk", hints: ["https://www.qmul.ac.uk/brand-assets/images/qmul-logo.svg", "https://www.qmul.ac.uk/brand-assets/logo-download/", "https://www.qmul.ac.uk/media/images/logo.svg", "https://www.qmul.ac.uk/assets/img/qmul-logo.svg"] },
    { name: "Regent's University London", domain: "regents.ac.uk", hints: ["https://www.regents.ac.uk/media/3030/ru-logo.svg", "https://www.regents.ac.uk/assets/img/ru-logo.png", "https://www.regents.ac.uk/images/logo.svg", "https://regents.ac.uk/wp-content/themes/regents/images/logo.svg"] },
    { name: "Robert Gordon University", domain: "rgu.ac.uk", hints: ["https://www.rgu.ac.uk/assets/img/rgu-logo.svg", "https://www.rgu.ac.uk/media/rgu/images/rgu-logo-white.svg", "https://www.rgu.ac.uk/media/images/rgu-logo.svg", "https://www.rgu.ac.uk/themes/rgu/images/rgu-logo.svg"] },
    { name: "Royal Veterinary College", domain: "rvc.ac.uk", hints: ["https://www.rvc.ac.uk/assets/img/rvc-logo.svg", "https://www.rvc.ac.uk/images/logo.svg", "https://www.rvc.ac.uk/media/9820/rvc-logo.svg", "https://www.rvc.ac.uk/brand/images/logo.png"] },
    { name: "Sheffield Hallam University", domain: "shu.ac.uk", hints: ["https://www.shu.ac.uk/assets/img/logo.svg", "https://www.shu.ac.uk/brand/img/shu-logo.svg", "https://www.shu.ac.uk/images/logo.svg", "https://www.shu.ac.uk/themes/shu/images/shu_logo.svg"] },
    { name: "University of South Wales", domain: "southwales.ac.uk", hints: ["https://www.southwales.ac.uk/assets/img/usw-logo.svg", "https://www.southwales.ac.uk/media/images/usw-logo.svg", "https://www.southwales.ac.uk/brand/images/logo.svg", "https://www.southwales.ac.uk/themes/custom/usw/logo.svg"] },
    { name: "University of Southampton", domain: "soton.ac.uk", hints: ["https://www.southampton.ac.uk/assets/importing/logos/unilogo/UoS_logo_horizontal_RGB.svg", "https://www.southampton.ac.uk/assets/img/logo.svg", "https://www.southampton.ac.uk/brand/logos/UoS_logo_horizontal.svg", "https://www.soton.ac.uk/assets/img/logo.svg"] },
    { name: "St George's, University of London", domain: "sgul.ac.uk", hints: ["https://www.sgul.ac.uk/assets/img/sgul-logo.svg", "https://www.sgul.ac.uk/images/logo.svg", "https://www.sgul.ac.uk/brand/images/sgul-logo.png", "https://www.sgul.ac.uk/media/images/sgul-logo.svg"] },
    { name: "Staffordshire University", domain: "staffs.ac.uk", hints: ["https://www.staffs.ac.uk/assets/img/logo.svg", "https://www.staffs.ac.uk/images/logo.svg", "https://www.staffs.ac.uk/themes/custom/staffs/logo.svg", "https://www.staffs.ac.uk/media/images/staffs-logo.svg"] },
    { name: "Ulster University", domain: "ulster.ac.uk", hints: ["https://www.ulster.ac.uk/assets/img/uu-logo.svg", "https://www.ulster.ac.uk/brand/images/logo.svg", "https://www.ulster.ac.uk/media/logos/uu-brand-logo.svg", "https://www.ulster.ac.uk/themes/custom/ulster/logo.svg"] },
    { name: "University of the Arts London", domain: "arts.ac.uk", hints: ["https://www.arts.ac.uk/assets/img/ual-logo.svg", "https://www.arts.ac.uk/media/images/ual-logo.svg", "https://www.arts.ac.uk/brand/images/logo.svg", "https://www.arts.ac.uk/themes/custom/ual/logo.svg"] },
    { name: "University of Westminster", domain: "westminster.ac.uk", hints: ["https://www.westminster.ac.uk/sites/default/files/media/images/uow-logo.svg", "https://www.westminster.ac.uk/assets/img/logo.svg", "https://www.westminster.ac.uk/brand/images/UoW-logo.svg", "https://www.westminster.ac.uk/themes/custom/westminster/logo.svg"] },
    { name: "University of Winchester", domain: "winchester.ac.uk", hints: ["https://www.winchester.ac.uk/assets/img/uow-logo.svg", "https://www.winchester.ac.uk/images/logo.svg", "https://www.winchester.ac.uk/brand/images/logo.svg", "https://www.winchester.ac.uk/themes/custom/winchester/logo.svg"] },
    { name: "University of Wolverhampton", domain: "wlv.ac.uk", hints: ["https://www.wlv.ac.uk/assets/img/wlv-logo.svg", "https://www.wlv.ac.uk/images/logo.svg", "https://www.wlv.ac.uk/brand/images/logo.svg", "https://www.wlv.ac.uk/media/images/logo.svg"] },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

async function curlDownload(url, outPath) {
    const { stdout } = await execAsync(
        `curl -sL --max-time 20 --retry 2 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -o "${outPath}" -w "%{http_code}|%{size_download}" "${url}"`,
        { timeout: 25000 }
    );
    const [code, size] = stdout.trim().split('|');
    if (code !== '200') throw new Error(`HTTP ${code}`);
    if (Number(size) < 200) throw new Error(`Too small (${size}B)`);
    return Number(size);
}

async function scrapeDeep(domain) {
    const urlsToTry = [
        `https://www.${domain}`,
        `https://${domain}`,
        `https://www.${domain}/about`,
        `https://www.${domain}/brand`,
        `https://www.${domain}/branding`,
    ];

    for (const pageUrl of urlsToTry) {
        let html = '';
        try {
            const { stdout } = await execAsync(
                `curl -sL --max-time 15 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${pageUrl}"`,
                { timeout: 20000 }
            );
            html = stdout;
        } catch { continue; }

        if (!html || html.length < 100) continue;

        // Try many patterns for logos in HTML
        const patterns = [
            // SVG logo refs
            /src=["']([^"']*?logo[^"']*?\.svg)["']/gi,
            /href=["']([^"']*?logo[^"']*?\.svg)["']/gi,
            /url\(["']?([^"')]*?logo[^"')]*?\.svg)["']?\)/gi,
            // Apple touch icon
            /apple-touch-icon[^>]+?href=["']([^"']+?)["']/gi,
            /href=["']([^"']+?)["'][^>]+?apple-touch-icon/gi,
            // OG image
            /og:image[^>]*?content=["']([^"']+?)["']/gi,
            /content=["']([^"']+?)["'][^>]*?og:image/gi,
            // PNG logo refs
            /src=["']([^"']*?logo[^"']*?\.png)["']/gi,
            /src=["']([^"']*?brand[^"']*?\.svg)["']/gi,
            // Header/nav images  
            /class=["'][^"']*?logo[^"']*?["'][^>]*?src=["']([^"']+?)["']/gi,
            /src=["']([^"']+?)["'][^>]*?class=["'][^"']*?logo[^"']*?["']/gi,
            // Twitter image
            /twitter:image[^>]*?content=["']([^"']+?)["']/gi,
        ];

        const candidates = new Set();
        for (const re of patterns) {
            let m;
            while ((m = re.exec(html)) !== null) {
                const raw = m[1];
                try {
                    const resolved = new URL(raw, pageUrl).toString();
                    // Filter out social icons, user avatars, photos etc
                    if (!resolved.match(/twitter|facebook|youtube|instagram|avatar|photo|banner|hero|banner|news|event|article/i)) {
                        candidates.add(resolved);
                    }
                } catch { /* skip */ }
            }
        }

        // Score candidates: prefer SVG, prefer URLs with "logo" or "brand"
        const sorted = [...candidates].sort((a, b) => {
            const score = (u) => {
                let s = 0;
                if (u.includes('.svg')) s += 10;
                if (u.toLowerCase().includes('logo')) s += 5;
                if (u.toLowerCase().includes('brand')) s += 3;
                if (u.toLowerCase().includes('apple-touch')) s += 4;
                if (u.toLowerCase().includes('-og')) s -= 2;
                return s;
            };
            return score(b) - score(a);
        });

        if (sorted.length > 0) return sorted;
    }
    return [];
}

async function getExt(url) {
    if (url.includes('.svg')) return '.svg';
    if (url.includes('.png')) return '.png';
    if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
    return '.png';
}

async function tryAlreadyExists(domain) {
    for (const ext of ['.svg', '.png', '.jpg', '.ico']) {
        if (await exists(join(OUT_DIR, domain, `logo${ext}`))) return true;
    }
    return false;
}

async function main() {
    let ok = 0, stillFailed = 0;
    const remaining = [];

    console.log(`\n🔍 Deep retry for ${FAILED.length} universities...\n`);

    for (let i = 0; i < FAILED.length; i++) {
        const { name, domain, hints } = FAILED[i];
        const dir = join(OUT_DIR, domain);
        await mkdir(dir, { recursive: true });

        process.stdout.write(`[${String(i + 1).padStart(2)}/${FAILED.length}] ${name.padEnd(55)} `);

        // Already fixed?
        if (await tryAlreadyExists(domain)) {
            console.log('⏭  already done');
            ok++;
            continue;
        }

        let success = false;

        // ── Phase 1: Try curated hint URLs ──────────────────────────────────────
        for (const url of (hints || [])) {
            const ext = await getExt(url);
            const outPath = join(dir, `logo${ext}`);
            try {
                const sz = await curlDownload(url, outPath);
                console.log(`✅ ${(sz / 1024).toFixed(0)}KB  (hint: ${url.split('/').slice(-1)[0]})`);
                ok++;
                success = true;
                break;
            } catch { /* try next */ }
        }

        // ── Phase 2: Deep HTML scrape across multiple pages ──────────────────────
        if (!success) {
            process.stdout.write('↳ scraping... ');
            const candidates = await scrapeDeep(domain);
            for (const url of candidates.slice(0, 8)) {
                const ext = await getExt(url);
                const outPath = join(dir, `logo${ext}`);
                try {
                    const sz = await curlDownload(url, outPath);
                    console.log(`✅ ${(sz / 1024).toFixed(0)}KB  (scraped: ${url.split('/').slice(-1)[0]})`);
                    ok++;
                    success = true;
                    break;
                } catch { /* try next */ }
            }
        }

        // ── Phase 3: Common favicon / touch icon patterns ────────────────────────
        if (!success) {
            const fallbacks = [
                `https://www.${domain}/apple-touch-icon.png`,
                `https://www.${domain}/apple-touch-icon-180x180.png`,
                `https://www.${domain}/apple-touch-icon-152x152.png`,
                `https://www.${domain}/apple-touch-icon-precomposed.png`,
                `https://www.${domain}/img/logo.svg`,
                `https://www.${domain}/img/logo.png`,
                `https://www.${domain}/images/logo.svg`,
                `https://www.${domain}/images/logo.png`,
                `https://www.${domain}/assets/img/logo.svg`,
                `https://www.${domain}/assets/img/logo.png`,
                `https://www.${domain}/assets/images/logo.svg`,
                `https://www.${domain}/assets/images/logo.png`,
                `https://www.${domain}/static/img/logo.svg`,
                `https://www.${domain}/static/images/logo.svg`,
                `https://www.${domain}/media/logo.svg`,
                `https://www.${domain}/media/images/logo.svg`,
                `https://www.${domain}/brand/logo.svg`,
                `https://www.${domain}/branding/logo.svg`,
                `https://www.${domain}/logo.png`,
                `https://www.${domain}/logo.svg`,
                `https://${domain}/apple-touch-icon.png`,
                `https://${domain}/apple-touch-icon-180x180.png`,
            ];

            for (const url of fallbacks) {
                const ext = await getExt(url);
                const outPath = join(dir, `logo${ext}`);
                try {
                    const sz = await curlDownload(url, outPath);
                    console.log(`✅ ${(sz / 1024).toFixed(0)}KB  (fallback)`);
                    ok++;
                    success = true;
                    break;
                } catch { /* try next */ }
            }
        }

        if (!success) {
            console.log('❌ still not found');
            remaining.push({ name, domain });
            stillFailed++;
        }

        await sleep(400);
    }

    console.log(`\n─────────────────────────────────────────────────`);
    console.log(`✅ Found this run : ${ok}`);
    console.log(`❌ Still missing  : ${stillFailed}`);

    if (remaining.length > 0) {
        console.log('\n⚠️  Still need manual logos for:');
        remaining.forEach(f => console.log(`   • ${f.name}  (${f.domain})`));
        console.log('\nTip: Drop a logo.png or logo.svg into each university folder under public/universities/');
    } else {
        console.log('\n🎉 All logos found!');
    }
}

main().catch(console.error);
