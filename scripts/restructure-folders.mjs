#!/usr/bin/env node
// scripts/restructure-folders.mjs
// Migrates flat university folders to the new nested structure:
// Before: University of X/logo.png
// After:  University of X/logo/logo.png
//         University of X/pictures/   (empty, ready for photos)
//         University of X/colors/palette.json

import { mkdir, rename, readdir, writeFile, access, stat } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UNI_DIR = join(ROOT, 'public', 'universities');

// Known brand colour palettes.
// primary   = dominant brand colour (used for backgrounds/gradients)
// secondary = accent / complementary colour
// dark      = dark variant (text on light bg)
// light     = light variant (text on dark bg)
const PALETTES = {
    'University of Aberdeen': { primary: '#1e3a5f', secondary: '#c8b400', dark: '#0d1f34', light: '#f0e9c8' },
    'Abertay University': { primary: '#d4003b', secondary: '#1a1a1a', dark: '#9e002c', light: '#fce8ee' },
    'Aberystwyth University': { primary: '#007a3d', secondary: '#1c3c6e', dark: '#004d26', light: '#e0f5eb' },
    'Anglia Ruskin University': { primary: '#4a1259', secondary: '#f5a623', dark: '#2e0b38', light: '#fdf3e7' },
    'Arts University Bournemouth': { primary: '#000000', secondary: '#e8001d', dark: '#1a1a1a', light: '#fff0f2' },
    'Arts University Plymouth': { primary: '#0057a8', secondary: '#ffffff', dark: '#003878', light: '#e8f1fc' },
    'Aston University': { primary: '#c8102e', secondary: '#1d2a57', dark: '#8a0b1f', light: '#f5e8ea' },
    'Bangor University': { primary: '#002060', secondary: '#c8922a', dark: '#00134a', light: '#fdf3e7' },
    'University of Bath': { primary: '#00307a', secondary: '#d4a200', dark: '#001f55', light: '#fff8e6' },
    'Bath Spa University': { primary: '#e4002b', secondary: '#1a1a1a', dark: '#a3001f', light: '#fce8ec' },
    'University of Bedfordshire': { primary: '#0088a9', secondary: '#f5a623', dark: '#005f76', light: '#fdf3e7' },
    'Birkbeck University of London': { primary: '#c8172b', secondary: '#1c1c1c', dark: '#8c1020', light: '#fce8ea' },
    'University of Birmingham': { primary: '#002147', secondary: '#b5a165', dark: '#001230', light: '#faf6eb' },
    'Birmingham City University': { primary: '#7a1985', secondary: '#ffffff', dark: '#540e5c', light: '#f7e9f9' },
    'Bishop Grosseteste University': { primary: '#003865', secondary: '#c8a200', dark: '#001f3a', light: '#fff8e6' },
    'University of Bolton': { primary: '#003366', secondary: '#e30613', dark: '#001f44', light: '#fce8ea' },
    'Bournemouth University': { primary: '#7D2060', secondary: '#ffffff', dark: '#561544', light: '#f9e9f5' },
    'BPP University': { primary: '#0076a3', secondary: '#f5a623', dark: '#004d6e', light: '#fdf3e7' },
    'University of Bradford': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ec' },
    'University of Brighton': { primary: '#00308f', secondary: '#009c8f', dark: '#001f62', light: '#e0f5f4' },
    'University of Bristol': { primary: '#cf1f32', secondary: '#1d1d1b', dark: '#8c1422', light: '#fce8ea' },
    'Brunel University London': { primary: '#003d6b', secondary: '#c8a327', dark: '#002244', light: '#faf5e7' },
    'University of Buckingham': { primary: '#003f7f', secondary: '#c8a84b', dark: '#002657', light: '#faf6e8' },
    'Buckinghamshire New University': { primary: '#005eb8', secondary: '#e4007c', dark: '#003c7a', light: '#fce8f3' },
    'University of Cambridge': { primary: '#003264', secondary: '#a3c1ad', dark: '#001a38', light: '#eef5f0' },
    'Canterbury Christ Church University': { primary: '#002147', secondary: '#c8a000', dark: '#000f25', light: '#fff8e0' },
    'Cardiff University': { primary: '#d4002a', secondary: '#181818', dark: '#8c001c', light: '#fce8ea' },
    'Cardiff Metropolitan University': { primary: '#006272', secondary: '#f5a800', dark: '#003d48', light: '#fff6e0' },
    'University of Central Lancashire': { primary: '#003262', secondary: '#e4002b', dark: '#001c3a', light: '#fce8ec' },
    'University of Chester': { primary: '#002147', secondary: '#bf8f00', dark: '#000f25', light: '#fff6e0' },
    'University of Chichester': { primary: '#004b87', secondary: '#e4002b', dark: '#002f56', light: '#fce8ec' },
    'City University of London': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'Courtauld Institute of Art': { primary: '#1c1c1c', secondary: '#c8a800', dark: '#000000', light: '#fff8e0' },
    'Coventry University': { primary: '#003366', secondary: '#e4007c', dark: '#001f44', light: '#fce8f3' },
    'Cranfield University': { primary: '#003b5c', secondary: '#009fd4', dark: '#002238', light: '#e0f5fb' },
    'University for the Creative Arts': { primary: '#1a1a1a', secondary: '#d4002a', dark: '#000000', light: '#fce8ea' },
    'University of Cumbria': { primary: '#003865', secondary: '#009c8f', dark: '#001f3a', light: '#e0f5f4' },
    'De Montfort University': { primary: '#007a6c', secondary: '#d4002a', dark: '#004d44', light: '#fce8ea' },
    'University of Derby': { primary: '#640032', secondary: '#009c8f', dark: '#3b001e', light: '#e0f5f4' },
    'University of Dundee': { primary: '#001e62', secondary: '#bb9900', dark: '#000e38', light: '#fff5d4' },
    'Durham University': { primary: '#7D2247', secondary: '#c8a000', dark: '#541630', light: '#fff8e0' },
    'University of East Anglia': { primary: '#005b8e', secondary: '#a18c5a', dark: '#003659', light: '#faf3e8' },
    'University of East London': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'Edge Hill University': { primary: '#d30d4c', secondary: '#1a1a1a', dark: '#8c0934', light: '#fce8ef' },
    'University of Edinburgh': { primary: '#001e62', secondary: '#c8a000', dark: '#000e38', light: '#fff8e0' },
    'Edinburgh Napier University': { primary: '#6a1a53', secondary: '#00b4a0', dark: '#431136', light: '#e0f8f5' },
    'University of Essex': { primary: '#003e74', secondary: '#f5a623', dark: '#002245', light: '#fdf3e7' },
    'University of Exeter': { primary: '#003c57', secondary: '#009faf', dark: '#002233', light: '#e0f6f8' },
    'Falmouth University': { primary: '#004a51', secondary: '#d4002a', dark: '#002b30', light: '#fce8ea' },
    'University of Glasgow': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'Glasgow Caledonian University': { primary: '#003965', secondary: '#e4002b', dark: '#001f3a', light: '#fce8ec' },
    'University of Gloucestershire': { primary: '#005eb8', secondary: '#00a651', dark: '#003c7a', light: '#e0f5ea' },
    'Goldsmiths University of London': { primary: '#003865', secondary: '#d4002a', dark: '#001f3a', light: '#fce8ea' },
    'University of Greenwich': { primary: '#06174a', secondary: '#009faf', dark: '#00082a', light: '#e0f6f8' },
    'Harper Adams University': { primary: '#006633', secondary: '#c8a000', dark: '#003d1d', light: '#fff8e0' },
    'Hartpury University': { primary: '#004b29', secondary: '#a8c800', dark: '#002b18', light: '#f5fce0' },
    'Heriot-Watt University': { primary: '#002147', secondary: '#0082b4', dark: '#000f25', light: '#e0f2fa' },
    'University of Hertfordshire': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of the Highlands and Islands': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Huddersfield': { primary: '#c8102e', secondary: '#1d1d1b', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Hull': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'Imperial College London': { primary: '#0000ce', secondary: '#00b3e3', dark: '#002245', light: '#e0f7fd' },
    'Keele University': { primary: '#003c76', secondary: '#c8a000', dark: '#002246', light: '#fff8e0' },
    'University of Kent': { primary: '#012169', secondary: '#c8a800', dark: '#000e38', light: '#fff8e0' },
    "King's College London": { primary: '#6f1635', secondary: '#c8a800', dark: '#470e22', light: '#fff8e0' },
    'Kingston University': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'Lancaster University': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Law': { primary: '#003865', secondary: '#c8a800', dark: '#001f3a', light: '#fff8e0' },
    'University of Leeds': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'Leeds Arts University': { primary: '#1a1a1a', secondary: '#e4002b', dark: '#000000', light: '#fce8ec' },
    'Leeds Beckett University': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'Leeds Trinity University': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Leicester': { primary: '#003e74', secondary: '#c8a800', dark: '#002245', light: '#fff8e0' },
    'University of Lincoln': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Liverpool': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'Liverpool Hope University': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'Liverpool John Moores University': { primary: '#006272', secondary: '#ffffff', dark: '#003d48', light: '#e0f7f8' },
    'London Metropolitan University': { primary: '#005eb8', secondary: '#e4007c', dark: '#003c7a', light: '#fce8f3' },
    'London School of Economics': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'London School of Hygiene and Tropical Medicine': { primary: '#00445e', secondary: '#c8a000', dark: '#002233', light: '#fff8e0' },
    'London South Bank University': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'Loughborough University': { primary: '#6f2383', secondary: '#ffffff', dark: '#4a185a', light: '#f8e8fd' },
    'University of Manchester': { primary: '#660099', secondary: '#f5a623', dark: '#3e0063', light: '#fdf3e7' },
    'Manchester Metropolitan University': { primary: '#742082', secondary: '#ffe600', dark: '#4a1455', light: '#fffce0' },
    'Middlesex University': { primary: '#d4293b', secondary: '#003865', dark: '#8c1c28', light: '#e8f0f8' },
    'Newcastle University': { primary: '#000000', secondary: '#c8a327', dark: '#1a1a1a', light: '#faf5e7' },
    'Newman University': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Northampton': { primary: '#741fa3', secondary: '#ffffff', dark: '#4d1570', light: '#f6e8fd' },
    'Northumbria University': { primary: '#003865', secondary: '#009c8f', dark: '#001f3a', light: '#e0f5f4' },
    'Norwich University of the Arts': { primary: '#1a1a1a', secondary: '#e4002b', dark: '#000000', light: '#fce8ec' },
    'University of Nottingham': { primary: '#001e62', secondary: '#0082b4', dark: '#000e38', light: '#e0f2fa' },
    'Nottingham Trent University': { primary: '#002147', secondary: '#e4002b', dark: '#000f25', light: '#fce8ec' },
    'Open University': { primary: '#002147', secondary: '#0082b4', dark: '#000f25', light: '#e0f2fa' },
    'University of Oxford': { primary: '#002147', secondary: '#be0000', dark: '#000f25', light: '#fce8ea' },
    'Oxford Brookes University': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Plymouth': { primary: '#007a3d', secondary: '#1c3c6e', dark: '#004d26', light: '#e0f5eb' },
    'University of Portsmouth': { primary: '#003e74', secondary: '#c8a800', dark: '#002245', light: '#fff8e0' },
    'Queen Margaret University': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'Queen Mary University of London': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    "Queen's University Belfast": { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Reading': { primary: '#1d4696', secondary: '#c8a800', dark: '#0f2960', light: '#fff8e0' },
    "Regent's University London": { primary: '#1a1a54', secondary: '#c8a800', dark: '#0a0a30', light: '#fff8e0' },
    'Robert Gordon University': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'University of Roehampton': { primary: '#003865', secondary: '#e4002b', dark: '#001f3a', light: '#fce8ec' },
    'Royal Agricultural University': { primary: '#004b29', secondary: '#c8a800', dark: '#002b18', light: '#fff8e0' },
    'Royal Holloway University of London': { primary: '#002147', secondary: '#c8a327', dark: '#000f25', light: '#faf5e7' },
    'Royal Veterinary College': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Salford': { primary: '#e4002b', secondary: '#1d1d1b', dark: '#9e001e', light: '#fce8ea' },
    'University of Sheffield': { primary: '#002147', secondary: '#009c8f', dark: '#000f25', light: '#e0f5f4' },
    'Sheffield Hallam University': { primary: '#7d0057', secondary: '#ffffff', dark: '#530039', light: '#f9e8f5' },
    'SOAS University of London': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'Solent University': { primary: '#004b87', secondary: '#e4002b', dark: '#002f56', light: '#fce8ea' },
    'University of South Wales': { primary: '#003865', secondary: '#e4002b', dark: '#001f3a', light: '#fce8ea' },
    'University of Southampton': { primary: '#003865', secondary: '#005eb8', dark: '#001f3a', light: '#e0f0fc' },
    'University of St Andrews': { primary: '#001e62', secondary: '#c8a800', dark: '#000e38', light: '#fff8e0' },
    "St George's University of London": { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    "St Mary's University Twickenham": { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'Staffordshire University': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'University of Stirling': { primary: '#1d2a57', secondary: '#c8a327', dark: '#0d1738', light: '#faf5e7' },
    'University of Strathclyde': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'University of Suffolk': { primary: '#005eb8', secondary: '#e4007c', dark: '#003c7a', light: '#fce8f3' },
    'University of Sunderland': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'University of Surrey': { primary: '#003865', secondary: '#009c8f', dark: '#001f3a', light: '#e0f5f4' },
    'University of Sussex': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'Swansea University': { primary: '#002244', secondary: '#c8a327', dark: '#000e28', light: '#faf5e7' },
    'Teesside University': { primary: '#d4002a', secondary: '#1d1d1b', dark: '#8c001c', light: '#fce8ea' },
    'Ulster University': { primary: '#002147', secondary: '#c8a000', dark: '#000f25', light: '#fff8e0' },
    'University College London': { primary: '#002147', secondary: '#d4145a', dark: '#000f25', light: '#fce8ef' },
    'University of the Arts London': { primary: '#1a1a1a', secondary: '#e4002b', dark: '#000000', light: '#fce8ea' },
    'University of Warwick': { primary: '#4b0082', secondary: '#c8a327', dark: '#2e005a', light: '#faf5e7' },
    'University of West London': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of the West of England': { primary: '#003865', secondary: '#009faf', dark: '#001f3a', light: '#e0f6f8' },
    'University of the West of Scotland': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Westminster': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Winchester': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
    'University of Wolverhampton': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'University of Worcester': { primary: '#c8102e', secondary: '#231f20', dark: '#8a0b1f', light: '#fce8ea' },
    'Wrexham University': { primary: '#003865', secondary: '#e4002b', dark: '#001f3a', light: '#fce8ea' },
    'University of York': { primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7' },
    'York St John University': { primary: '#003865', secondary: '#c8a000', dark: '#001f3a', light: '#fff8e0' },
};

// Sub-schools to create inside parent universities
const SUB_SCHOOLS = {
    'University of Oxford': ['Saïd Business School', 'Blavatnik School of Government'],
    'University of Cambridge': ['Judge Business School', 'Cambridge Judge'],
    'University of Reading': ['Henley Business School'],
    'University of Exeter': ['Exeter Business School'],
    'University of Warwick': ['Warwick Business School'],
    'University of Bath': ['School of Management'],
    'University of Edinburgh': ['Edinburgh Business School'],
    'University of Glasgow': ['Adam Smith Business School'],
    'University of Manchester': ['Alliance Manchester Business School'],
    'University of Sheffield': ['Sheffield University Management School'],
    'University of Leeds': ['Leeds University Business School'],
    'University of Bristol': ['Bristol Business School'],
    'King\'s College London': ['King\'s Business School'],
    'University College London': ['UCL School of Management'],
    'Imperial College London': ['Imperial College Business School'],
    'London School of Economics': ['LSE Department of Management'],
    'University of Durham': ['Durham University Business School'],
    'Newcastle University': ['Newcastle University Business School'],
    'University of Southampton': ['Southampton Business School'],
    'University of Nottingham': ['Nottingham University Business School'],
    'University of Liverpool': ['University of Liverpool Management School'],
    'Loughborough University': ['Loughborough University School of Business and Economics'],
    'University of Leicester': ['University of Leicester School of Business'],
};

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

async function isFile(p) {
    try { return (await stat(p)).isFile(); } catch { return false; }
}

async function main() {
    const uniDirs = await readdir(UNI_DIR);
    let processed = 0;

    console.log(`\n🏗️  Restructuring ${uniDirs.length} university folders...\n`);

    for (const uniName of uniDirs) {
        if (uniName.startsWith('.')) continue;
        const uniPath = join(UNI_DIR, uniName);

        // ── 1. Move existing root logo file into /logo/ subfolder ─────────────
        const logoDir = join(uniPath, 'logo');
        const picturesDir = join(uniPath, 'pictures');
        const colorsDir = join(uniPath, 'colors');

        await mkdir(logoDir, { recursive: true });
        await mkdir(picturesDir, { recursive: true });
        await mkdir(colorsDir, { recursive: true });

        // Move any root logo.* file
        for (const ext of ['.svg', '.png', '.jpg', '.ico']) {
            const rootLogo = join(uniPath, `logo${ext}`);
            const newLogo = join(logoDir, `logo${ext}`);
            if (await isFile(rootLogo)) {
                await rename(rootLogo, newLogo);
                process.stdout.write('  📁 ');
            }
        }

        // ── 2. Write palette.json ──────────────────────────────────────────────
        const palette = PALETTES[uniName] ?? {
            primary: '#003865', secondary: '#c8a327', dark: '#001f3a', light: '#faf5e7'
        };
        const palettePath = join(colorsDir, 'palette.json');
        if (!(await exists(palettePath))) {
            await writeFile(palettePath, JSON.stringify({ ...palette, name: uniName }, null, 2));
        }

        // ── 3. Create sub-school folders ──────────────────────────────────────
        const subs = SUB_SCHOOLS[uniName] ?? [];
        for (const sub of subs) {
            for (const sub_dir of ['logo', 'pictures', 'colors']) {
                await mkdir(join(uniPath, sub, sub_dir), { recursive: true });
            }
            // Write default palette for sub-school
            const subPalette = { ...palette, name: sub };
            const subPalettePath = join(uniPath, sub, 'colors', 'palette.json');
            if (!(await exists(subPalettePath))) {
                await writeFile(subPalettePath, JSON.stringify(subPalette, null, 2));
            }
        }

        const subStr = subs.length > 0 ? ` (+${subs.length} sub-school${subs.length > 1 ? 's' : ''})` : '';
        console.log(`✅ ${uniName}${subStr}`);
        processed++;
    }

    console.log(`\n─────────────────────────────────────────────────────`);
    console.log(`✅ Restructured : ${processed} universities`);
    console.log(`\nNew structure:`);
    console.log(`  public/universities/<Name>/`);
    console.log(`    logo/          ← logo files (svg/png)`);
    console.log(`    pictures/      ← campus photos (empty, ready to fill)`);
    console.log(`    colors/`);
    console.log(`      palette.json ← { primary, secondary, dark, light }`);
    console.log(`    <Sub-school>/  ← (for unis with named schools)`);
    console.log(`      logo/ pictures/ colors/`);
}

main().catch(console.error);
