#!/usr/bin/env node
// scripts/download-logos.mjs
// Usage: node scripts/download-logos.mjs
// Downloads logo for each university from their own website or favicon service.

import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'universities');

// Manual logo URLs for universities where the auto-finder works well.
// For the rest, we'll scrape the homepage og:image or apple-touch-icon.
const KNOWN_LOGOS = {
    'cam.ac.uk': 'https://www.cam.ac.uk/sites/all/themes/fresh/images/interface/cambridge_university2.svg',
    'ox.ac.uk': 'https://www.ox.ac.uk/sites/all/themes/oxweb/logo.svg',
    'imperial.ac.uk': 'https://www.imperial.ac.uk/brand-context/stationery/img/logo-blue.svg',
    'ucl.ac.uk': 'https://www.ucl.ac.uk/brand/sites/brand/files/ucl-logo.svg',
    'lse.ac.uk': 'https://www.lse.ac.uk/lse-information/brand/images/LSE-Logo.svg',
    'kcl.ac.uk': 'https://www.kcl.ac.uk/etc.clientlibs/settings/wcm/designs/kings/clientlibs/base/resources/img/Kings_logo_red.svg',
    'ed.ac.uk': 'https://www.ed.ac.uk/sites/all/themes/uoe/images/UoE_logo.svg',
    'manchester.ac.uk': 'https://www.manchester.ac.uk/medialibrary/corporate/Manchester_UoM_logo_RGB.svg',
    'bristol.ac.uk': 'https://cms.bris.ac.uk/assets/logo/UoB_CMYK_24.svg',
    'warwick.ac.uk': 'https://warwick.ac.uk/fac/arts/theatre_s/cp/resources/logo/warwick_logo_2017_high_res_digital_RGB.svg',
    'soton.ac.uk': 'https://www.southampton.ac.uk/assets/importing/logos/unilogo/UoS_logo_horizontal_RGB.svg',
    'gla.ac.uk': 'https://www.gla.ac.uk/brand-assets/web/img/2015/UofG_colour.svg',
    'sheffield.ac.uk': 'https://www.sheffield.ac.uk/themes/custom/uos_default/img/UoSheffield_Primary_Logo_Red.svg',
    'nottingham.ac.uk': 'https://www.nottingham.ac.uk/brand/guidelines/images/logos/uon-logo.svg',
    'exeter.ac.uk': 'https://www.exeter.ac.uk/media/universityofexeter/webteam/images2014/brand/ExeterLogo.svg',
    'lancaster.ac.uk': 'https://www.lancaster.ac.uk/sass/images/logos/LancasterUniversity_1ColBlue.svg',
    'durham.ac.uk': 'https://www.durham.ac.uk/media/durham-university/official-logo/logo.svg',
    'bath.ac.uk': 'https://www.bath.ac.uk/images/branding/logo-university-of-bath.svg',
    'york.ac.uk': 'https://www.york.ac.uk/static/stable/img/logotype/lg-logo.svg',
    'lboro.ac.uk': 'https://www.lboro.ac.uk/system/files/content/styles/flex-ratio/fieldgroup-logo/lboro-logo.svg',
    'surrey.ac.uk': 'https://www.surrey.ac.uk/sites/default/files/2017-03/university-of-surrey-logo.svg',
    'sussex.ac.uk': 'https://www.sussex.ac.uk/brand/images/Sussex_logo.svg',
    'qmul.ac.uk': 'https://www.qmul.ac.uk/media/qmul/media/branding/qmul-logo-red.svg',
    'st-andrews.ac.uk': 'https://www.st-andrews.ac.uk/assets/university/university-imports/images/logo/st-andrews-logo.svg',
    'cardiff.ac.uk': 'https://www.cardiff.ac.uk/sites/default/files/shared-assets/img/brand/corporate-logo.svg',
    'hww.ac.uk': 'https://www.hw.ac.uk/uk/media/img/hw-logo.png',
    'strath.ac.uk': 'https://www.strath.ac.uk/media/1newwebsite/webteam/logos/UoS_Logo.svg',
    'ncl.ac.uk': 'https://www.ncl.ac.uk/media/wwwnclacuk/usingourlogo/ncl-logo-2020.svg',
    'bham.ac.uk': 'https://www.birmingham.ac.uk/images/branding/logo.svg',
};

const UNIVERSITIES = [
    { name: "University of Aberdeen", domain: "abdn.ac.uk" },
    { name: "Abertay University", domain: "abertay.ac.uk" },
    { name: "Aberystwyth University", domain: "aber.ac.uk" },
    { name: "Anglia Ruskin University", domain: "aru.ac.uk" },
    { name: "Arts University Bournemouth", domain: "aub.ac.uk" },
    { name: "Arts University Plymouth", domain: "aup.ac.uk" },
    { name: "Aston University", domain: "aston.ac.uk" },
    { name: "Bangor University", domain: "bangor.ac.uk" },
    { name: "University of Bath", domain: "bath.ac.uk" },
    { name: "Bath Spa University", domain: "bathspa.ac.uk" },
    { name: "University of Bedfordshire", domain: "beds.ac.uk" },
    { name: "Birkbeck, University of London", domain: "bbk.ac.uk" },
    { name: "University of Birmingham", domain: "birmingham.ac.uk" },
    { name: "Birmingham City University", domain: "bcu.ac.uk" },
    { name: "Bishop Grosseteste University", domain: "bishopg.ac.uk" },
    { name: "University of Bolton", domain: "bolton.ac.uk" },
    { name: "Bournemouth University", domain: "bournemouth.ac.uk" },
    { name: "BPP University", domain: "bpp.com" },
    { name: "University of Bradford", domain: "bradford.ac.uk" },
    { name: "University of Brighton", domain: "brighton.ac.uk" },
    { name: "University of Bristol", domain: "bristol.ac.uk" },
    { name: "Brunel University London", domain: "brunel.ac.uk" },
    { name: "University of Buckingham", domain: "buckingham.ac.uk" },
    { name: "Buckinghamshire New University", domain: "bucks.ac.uk" },
    { name: "University of Cambridge", domain: "cam.ac.uk" },
    { name: "Canterbury Christ Church University", domain: "canterbury.ac.uk" },
    { name: "Cardiff University", domain: "cardiff.ac.uk" },
    { name: "Cardiff Metropolitan University", domain: "cardiffmet.ac.uk" },
    { name: "University of Central Lancashire", domain: "uclan.ac.uk" },
    { name: "University of Chester", domain: "chester.ac.uk" },
    { name: "University of Chichester", domain: "chi.ac.uk" },
    { name: "City, University of London", domain: "city.ac.uk" },
    { name: "Courtauld Institute of Art", domain: "courtauld.ac.uk" },
    { name: "Coventry University", domain: "coventry.ac.uk" },
    { name: "Cranfield University", domain: "cranfield.ac.uk" },
    { name: "University for the Creative Arts", domain: "uca.ac.uk" },
    { name: "University of Cumbria", domain: "cumbria.ac.uk" },
    { name: "De Montfort University", domain: "dmu.ac.uk" },
    { name: "University of Derby", domain: "derby.ac.uk" },
    { name: "University of Dundee", domain: "dundee.ac.uk" },
    { name: "Durham University", domain: "durham.ac.uk" },
    { name: "University of East Anglia", domain: "uea.ac.uk" },
    { name: "University of East London", domain: "uel.ac.uk" },
    { name: "Edge Hill University", domain: "edgehill.ac.uk" },
    { name: "University of Edinburgh", domain: "ed.ac.uk" },
    { name: "Edinburgh Napier University", domain: "napier.ac.uk" },
    { name: "University of Essex", domain: "essex.ac.uk" },
    { name: "University of Exeter", domain: "exeter.ac.uk" },
    { name: "Falmouth University", domain: "falmouth.ac.uk" },
    { name: "University of Glasgow", domain: "gla.ac.uk" },
    { name: "Glasgow Caledonian University", domain: "gcu.ac.uk" },
    { name: "University of Gloucestershire", domain: "glos.ac.uk" },
    { name: "Goldsmiths, University of London", domain: "gold.ac.uk" },
    { name: "University of Greenwich", domain: "gre.ac.uk" },
    { name: "Harper Adams University", domain: "harper-adams.ac.uk" },
    { name: "Hartpury University", domain: "hartpury.ac.uk" },
    { name: "Heriot-Watt University", domain: "hw.ac.uk" },
    { name: "University of Hertfordshire", domain: "herts.ac.uk" },
    { name: "University of the Highlands and Islands", domain: "uhi.ac.uk" },
    { name: "University of Huddersfield", domain: "hud.ac.uk" },
    { name: "University of Hull", domain: "hull.ac.uk" },
    { name: "Imperial College London", domain: "imperial.ac.uk" },
    { name: "Keele University", domain: "keele.ac.uk" },
    { name: "University of Kent", domain: "kent.ac.uk" },
    { name: "King's College London", domain: "kcl.ac.uk" },
    { name: "Kingston University", domain: "kingston.ac.uk" },
    { name: "Lancaster University", domain: "lancaster.ac.uk" },
    { name: "University of Law", domain: "law.ac.uk" },
    { name: "University of Leeds", domain: "leeds.ac.uk" },
    { name: "Leeds Arts University", domain: "leeds-arts.ac.uk" },
    { name: "Leeds Beckett University", domain: "leedsbeckett.ac.uk" },
    { name: "Leeds Trinity University", domain: "leedstrinity.ac.uk" },
    { name: "University of Leicester", domain: "le.ac.uk" },
    { name: "University of Lincoln", domain: "lincoln.ac.uk" },
    { name: "University of Liverpool", domain: "liverpool.ac.uk" },
    { name: "Liverpool Hope University", domain: "hope.ac.uk" },
    { name: "Liverpool John Moores University", domain: "ljmu.ac.uk" },
    { name: "London Metropolitan University", domain: "londonmet.ac.uk" },
    { name: "London School of Economics and Political Science", domain: "lse.ac.uk" },
    { name: "London School of Hygiene & Tropical Medicine", domain: "lshtm.ac.uk" },
    { name: "London South Bank University", domain: "lsbu.ac.uk" },
    { name: "Loughborough University", domain: "lboro.ac.uk" },
    { name: "University of Manchester", domain: "manchester.ac.uk" },
    { name: "Manchester Metropolitan University", domain: "mmu.ac.uk" },
    { name: "Middlesex University", domain: "mdx.ac.uk" },
    { name: "Newcastle University", domain: "ncl.ac.uk" },
    { name: "Newman University", domain: "newman.ac.uk" },
    { name: "University of Northampton", domain: "northampton.ac.uk" },
    { name: "Northumbria University", domain: "northumbria.ac.uk" },
    { name: "Norwich University of the Arts", domain: "nua.ac.uk" },
    { name: "University of Nottingham", domain: "nottingham.ac.uk" },
    { name: "Nottingham Trent University", domain: "ntu.ac.uk" },
    { name: "Open University", domain: "open.ac.uk" },
    { name: "University of Oxford", domain: "ox.ac.uk" },
    { name: "Oxford Brookes University", domain: "brookes.ac.uk" },
    { name: "University of Plymouth", domain: "plymouth.ac.uk" },
    { name: "University of Portsmouth", domain: "port.ac.uk" },
    { name: "Queen Margaret University", domain: "qmu.ac.uk" },
    { name: "Queen Mary University of London", domain: "qmul.ac.uk" },
    { name: "Queen's University Belfast", domain: "qub.ac.uk" },
    { name: "University of Reading", domain: "reading.ac.uk" },
    { name: "Regent's University London", domain: "regents.ac.uk" },
    { name: "Robert Gordon University", domain: "rgu.ac.uk" },
    { name: "University of Roehampton", domain: "roehampton.ac.uk" },
    { name: "Royal Agricultural University", domain: "rau.ac.uk" },
    { name: "Royal Holloway, University of London", domain: "rhul.ac.uk" },
    { name: "Royal Veterinary College", domain: "rvc.ac.uk" },
    { name: "University of Salford", domain: "salford.ac.uk" },
    { name: "University of Sheffield", domain: "sheffield.ac.uk" },
    { name: "Sheffield Hallam University", domain: "shu.ac.uk" },
    { name: "SOAS, University of London", domain: "soas.ac.uk" },
    { name: "Solent University", domain: "solent.ac.uk" },
    { name: "University of South Wales", domain: "southwales.ac.uk" },
    { name: "University of Southampton", domain: "soton.ac.uk" },
    { name: "University of St Andrews", domain: "st-andrews.ac.uk" },
    { name: "St George's, University of London", domain: "sgul.ac.uk" },
    { name: "St Mary's University, Twickenham", domain: "stmarys.ac.uk" },
    { name: "Staffordshire University", domain: "staffs.ac.uk" },
    { name: "University of Stirling", domain: "stir.ac.uk" },
    { name: "University of Strathclyde", domain: "strath.ac.uk" },
    { name: "University of Suffolk", domain: "uos.ac.uk" },
    { name: "University of Sunderland", domain: "sunderland.ac.uk" },
    { name: "University of Surrey", domain: "surrey.ac.uk" },
    { name: "University of Sussex", domain: "sussex.ac.uk" },
    { name: "Swansea University", domain: "swansea.ac.uk" },
    { name: "Teesside University", domain: "tees.ac.uk" },
    { name: "Ulster University", domain: "ulster.ac.uk" },
    { name: "University College London", domain: "ucl.ac.uk" },
    { name: "University of the Arts London", domain: "arts.ac.uk" },
    { name: "University of Warwick", domain: "warwick.ac.uk" },
    { name: "University of West London", domain: "uwl.ac.uk" },
    { name: "University of the West of England", domain: "uwe.ac.uk" },
    { name: "University of the West of Scotland", domain: "uws.ac.uk" },
    { name: "University of Westminster", domain: "westminster.ac.uk" },
    { name: "University of Winchester", domain: "winchester.ac.uk" },
    { name: "University of Wolverhampton", domain: "wlv.ac.uk" },
    { name: "University of Worcester", domain: "worcester.ac.uk" },
    { name: "Wrexham University", domain: "wrexham.ac.uk" },
    { name: "University of York", domain: "york.ac.uk" },
    { name: "York St John University", domain: "yorksj.ac.uk" },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

// Use curl (which works) to download a URL to a file
async function curlDownload(url, outPath) {
    const { stdout, stderr } = await execAsync(
        `curl -sL --max-time 15 --retry 2 -A "Mozilla/5.0" -o "${outPath}" -w "%{http_code}|%{size_download}" "${url}"`,
        { timeout: 20000 }
    );
    const [code, size] = stdout.trim().split('|');
    if (code !== '200') throw new Error(`HTTP ${code}`);
    if (Number(size) < 200) throw new Error(`File too small (${size} bytes)`);
    return Number(size);
}

// Scrape homepage to find og:image or apple-touch-icon or logo img
async function findLogoUrl(domain) {
    const url = `https://www.${domain}`;
    let html = '';
    try {
        const { stdout } = await execAsync(
            `curl -sL --max-time 10 -A "Mozilla/5.0" "${url}"`,
            { timeout: 15000 }
        );
        html = stdout;
    } catch { return null; }

    // Priority 1: apple-touch-icon (high quality, always a proper logo)
    const touchIcon = html.match(/apple-touch-icon[^>]*href=["']([^"']+)["']/i);
    if (touchIcon) return resolveUrl(touchIcon[1], url);

    // Priority 2: og:image
    const ogImg = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImg) return resolveUrl(ogImg[1], url);

    // Priority 3: SVG with "logo" in src
    const svgLogo = html.match(/src=["']([^"']*logo[^"']*\.svg)["']/i)
        || html.match(/href=["']([^"']*logo[^"']*\.svg)["']/i);
    if (svgLogo) return resolveUrl(svgLogo[1], url);

    return null;
}

function resolveUrl(href, base) {
    try {
        return new URL(href, base).toString();
    } catch {
        return null;
    }
}

async function getExt(url) {
    if (url.includes('.svg')) return '.svg';
    if (url.includes('.png')) return '.png';
    if (url.includes('.jpg') || url.includes('.jpeg')) return '.jpg';
    if (url.includes('.ico')) return '.ico';
    return '.png'; // default guess
}

async function main() {
    let ok = 0, skipped = 0, failed = 0;
    const failures = [];

    await mkdir(OUT_DIR, { recursive: true });

    console.log(`\n📦 Downloading logos for ${UNIVERSITIES.length} universities...\n`);

    for (let i = 0; i < UNIVERSITIES.length; i++) {
        const { name, domain } = UNIVERSITIES[i];
        const dir = join(OUT_DIR, domain);

        process.stdout.write(`[${String(i + 1).padStart(3)}/${UNIVERSITIES.length}] ${name.padEnd(58)} `);

        // Skip if logo already exists (either extension)
        const exts = ['.svg', '.png', '.jpg', '.ico'];
        let alreadyExists = false;
        for (const ext of exts) {
            if (await exists(join(dir, `logo${ext}`))) {
                console.log(`⏭  skipped`);
                alreadyExists = true;
                skipped++;
                break;
            }
        }
        if (alreadyExists) continue;

        await mkdir(dir, { recursive: true });

        let success = false;

        // 1. Try known manual URL first
        if (KNOWN_LOGOS[domain]) {
            const ext = await getExt(KNOWN_LOGOS[domain]);
            const outPath = join(dir, `logo${ext}`);
            try {
                const size = await curlDownload(KNOWN_LOGOS[domain], outPath);
                console.log(`✅ ${(size / 1024).toFixed(0)} KB (known)`);
                ok++;
                success = true;
            } catch (e) {
                // will fall through to scraping
            }
        }

        // 2. Scrape homepage
        if (!success) {
            try {
                const logoUrl = await findLogoUrl(domain);
                if (logoUrl) {
                    const ext = await getExt(logoUrl);
                    const outPath = join(dir, `logo${ext}`);
                    const size = await curlDownload(logoUrl, outPath);
                    console.log(`✅ ${(size / 1024).toFixed(0)} KB (scraped)`);
                    ok++;
                    success = true;
                }
            } catch (e) { /* continue */ }
        }

        // 3. Fallback: favicon
        if (!success) {
            const faviconUrls = [
                `https://www.${domain}/favicon.png`,
                `https://www.${domain}/apple-touch-icon.png`,
                `https://www.${domain}/apple-touch-icon-precomposed.png`,
                `https://${domain}/favicon.png`,
            ];
            for (const furl of faviconUrls) {
                try {
                    const outPath = join(dir, 'logo.png');
                    const size = await curlDownload(furl, outPath);
                    console.log(`✅ ${(size / 1024).toFixed(0)} KB (favicon)`);
                    ok++;
                    success = true;
                    break;
                } catch { /* try next */ }
            }
        }

        if (!success) {
            console.log(`❌ not found`);
            failures.push({ name, domain });
            failed++;
        }

        await sleep(200);
    }

    console.log(`\n─────────────────────────────────────────────`);
    console.log(`✅ Downloaded : ${ok}`);
    console.log(`⏭  Skipped   : ${skipped}`);
    console.log(`❌ Failed     : ${failed}`);
    if (failures.length) {
        console.log('\n⚠️  Need manual logos for:');
        failures.forEach(f => console.log(`   • ${f.name}  →  public/universities/${f.domain}/`));
    }
    console.log(`\nLogos saved to: public/universities/<domain>/logo.<ext>`);
}

main().catch(console.error);
