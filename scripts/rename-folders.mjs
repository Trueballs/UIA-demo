#!/usr/bin/env node
// scripts/rename-folders.mjs
// Renames public/universities/{domain}/ → public/universities/{Full University Name}/
// Also updates universities.ts to store the folder name.

import { rename, readdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const UNI_DIR = join(ROOT, 'public', 'universities');

// Full mapping: domain → full name (used for renaming folders)
const DOMAIN_TO_NAME = {
    'abdn.ac.uk': 'University of Aberdeen',
    'abertay.ac.uk': 'Abertay University',
    'aber.ac.uk': 'Aberystwyth University',
    'aru.ac.uk': 'Anglia Ruskin University',
    'aub.ac.uk': 'Arts University Bournemouth',
    'aup.ac.uk': 'Arts University Plymouth',
    'aston.ac.uk': 'Aston University',
    'bangor.ac.uk': 'Bangor University',
    'bath.ac.uk': 'University of Bath',
    'bathspa.ac.uk': 'Bath Spa University',
    'beds.ac.uk': 'University of Bedfordshire',
    'bbk.ac.uk': 'Birkbeck University of London',
    'birmingham.ac.uk': 'University of Birmingham',
    'bcu.ac.uk': 'Birmingham City University',
    'bishopg.ac.uk': 'Bishop Grosseteste University',
    'bolton.ac.uk': 'University of Bolton',
    'bournemouth.ac.uk': 'Bournemouth University',
    'bpp.com': 'BPP University',
    'bradford.ac.uk': 'University of Bradford',
    'brighton.ac.uk': 'University of Brighton',
    'bristol.ac.uk': 'University of Bristol',
    'brunel.ac.uk': 'Brunel University London',
    'buckingham.ac.uk': 'University of Buckingham',
    'bucks.ac.uk': 'Buckinghamshire New University',
    'cam.ac.uk': 'University of Cambridge',
    'canterbury.ac.uk': 'Canterbury Christ Church University',
    'cardiff.ac.uk': 'Cardiff University',
    'cardiffmet.ac.uk': 'Cardiff Metropolitan University',
    'uclan.ac.uk': 'University of Central Lancashire',
    'chester.ac.uk': 'University of Chester',
    'chi.ac.uk': 'University of Chichester',
    'city.ac.uk': 'City University of London',
    'courtauld.ac.uk': 'Courtauld Institute of Art',
    'coventry.ac.uk': 'Coventry University',
    'cranfield.ac.uk': 'Cranfield University',
    'uca.ac.uk': 'University for the Creative Arts',
    'cumbria.ac.uk': 'University of Cumbria',
    'dmu.ac.uk': 'De Montfort University',
    'derby.ac.uk': 'University of Derby',
    'dundee.ac.uk': 'University of Dundee',
    'durham.ac.uk': 'Durham University',
    'uea.ac.uk': 'University of East Anglia',
    'uel.ac.uk': 'University of East London',
    'edgehill.ac.uk': 'Edge Hill University',
    'ed.ac.uk': 'University of Edinburgh',
    'napier.ac.uk': 'Edinburgh Napier University',
    'essex.ac.uk': 'University of Essex',
    'exeter.ac.uk': 'University of Exeter',
    'falmouth.ac.uk': 'Falmouth University',
    'gla.ac.uk': 'University of Glasgow',
    'gcu.ac.uk': 'Glasgow Caledonian University',
    'glos.ac.uk': 'University of Gloucestershire',
    'gold.ac.uk': 'Goldsmiths University of London',
    'gre.ac.uk': 'University of Greenwich',
    'harper-adams.ac.uk': 'Harper Adams University',
    'hartpury.ac.uk': 'Hartpury University',
    'hw.ac.uk': 'Heriot-Watt University',
    'herts.ac.uk': 'University of Hertfordshire',
    'uhi.ac.uk': 'University of the Highlands and Islands',
    'hud.ac.uk': 'University of Huddersfield',
    'hull.ac.uk': 'University of Hull',
    'imperial.ac.uk': 'Imperial College London',
    'keele.ac.uk': 'Keele University',
    'kent.ac.uk': 'University of Kent',
    'kcl.ac.uk': "King's College London",
    'kingston.ac.uk': 'Kingston University',
    'lancaster.ac.uk': 'Lancaster University',
    'law.ac.uk': 'University of Law',
    'leeds.ac.uk': 'University of Leeds',
    'leeds-arts.ac.uk': 'Leeds Arts University',
    'leedsbeckett.ac.uk': 'Leeds Beckett University',
    'leedstrinity.ac.uk': 'Leeds Trinity University',
    'le.ac.uk': 'University of Leicester',
    'lincoln.ac.uk': 'University of Lincoln',
    'liverpool.ac.uk': 'University of Liverpool',
    'hope.ac.uk': 'Liverpool Hope University',
    'ljmu.ac.uk': 'Liverpool John Moores University',
    'londonmet.ac.uk': 'London Metropolitan University',
    'lse.ac.uk': 'London School of Economics',
    'lshtm.ac.uk': 'London School of Hygiene and Tropical Medicine',
    'lsbu.ac.uk': 'London South Bank University',
    'lboro.ac.uk': 'Loughborough University',
    'manchester.ac.uk': 'University of Manchester',
    'mmu.ac.uk': 'Manchester Metropolitan University',
    'mdx.ac.uk': 'Middlesex University',
    'ncl.ac.uk': 'Newcastle University',
    'newman.ac.uk': 'Newman University',
    'northampton.ac.uk': 'University of Northampton',
    'northumbria.ac.uk': 'Northumbria University',
    'nua.ac.uk': 'Norwich University of the Arts',
    'nottingham.ac.uk': 'University of Nottingham',
    'ntu.ac.uk': 'Nottingham Trent University',
    'open.ac.uk': 'Open University',
    'ox.ac.uk': 'University of Oxford',
    'brookes.ac.uk': 'Oxford Brookes University',
    'plymouth.ac.uk': 'University of Plymouth',
    'port.ac.uk': 'University of Portsmouth',
    'qmu.ac.uk': 'Queen Margaret University',
    'qmul.ac.uk': 'Queen Mary University of London',
    'qub.ac.uk': "Queen's University Belfast",
    'reading.ac.uk': 'University of Reading',
    'regents.ac.uk': "Regent's University London",
    'rgu.ac.uk': 'Robert Gordon University',
    'roehampton.ac.uk': 'University of Roehampton',
    'rau.ac.uk': 'Royal Agricultural University',
    'rhul.ac.uk': 'Royal Holloway University of London',
    'rvc.ac.uk': 'Royal Veterinary College',
    'salford.ac.uk': 'University of Salford',
    'sheffield.ac.uk': 'University of Sheffield',
    'shu.ac.uk': 'Sheffield Hallam University',
    'soas.ac.uk': 'SOAS University of London',
    'solent.ac.uk': 'Solent University',
    'southwales.ac.uk': 'University of South Wales',
    'soton.ac.uk': 'University of Southampton',
    'st-andrews.ac.uk': 'University of St Andrews',
    'sgul.ac.uk': "St George's University of London",
    'stmarys.ac.uk': "St Mary's University Twickenham",
    'staffs.ac.uk': 'Staffordshire University',
    'stir.ac.uk': 'University of Stirling',
    'strath.ac.uk': 'University of Strathclyde',
    'uos.ac.uk': 'University of Suffolk',
    'sunderland.ac.uk': 'University of Sunderland',
    'surrey.ac.uk': 'University of Surrey',
    'sussex.ac.uk': 'University of Sussex',
    'swansea.ac.uk': 'Swansea University',
    'tees.ac.uk': 'Teesside University',
    'ulster.ac.uk': 'Ulster University',
    'ucl.ac.uk': 'University College London',
    'arts.ac.uk': 'University of the Arts London',
    'warwick.ac.uk': 'University of Warwick',
    'uwl.ac.uk': 'University of West London',
    'uwe.ac.uk': 'University of the West of England',
    'uws.ac.uk': 'University of the West of Scotland',
    'westminster.ac.uk': 'University of Westminster',
    'winchester.ac.uk': 'University of Winchester',
    'wlv.ac.uk': 'University of Wolverhampton',
    'worcester.ac.uk': 'University of Worcester',
    'wrexham.ac.uk': 'Wrexham University',
    'york.ac.uk': 'University of York',
    'yorksj.ac.uk': 'York St John University',
};

async function exists(p) {
    try { await access(p); return true; } catch { return false; }
}

async function main() {
    const entries = await readdir(UNI_DIR);
    let renamed = 0, skipped = 0, unknown = 0;
    const unknownList = [];

    console.log(`\n📁 Renaming ${entries.length} university folders...\n`);

    for (const entry of entries) {
        const oldPath = join(UNI_DIR, entry);
        const name = DOMAIN_TO_NAME[entry];

        if (!name) {
            console.log(`⚠️  No mapping for: ${entry}`);
            unknownList.push(entry);
            unknown++;
            continue;
        }

        // Skip if already renamed
        if (!(await exists(oldPath))) {
            skipped++;
            continue;
        }

        const newPath = join(UNI_DIR, name);

        if (await exists(newPath)) {
            console.log(`⏭  "${name}" already exists — skipping`);
            skipped++;
            continue;
        }

        await rename(oldPath, newPath);
        console.log(`✅  ${entry.padEnd(28)} → ${name}`);
        renamed++;
    }

    console.log(`\n─────────────────────────────────────────────────`);
    console.log(`✅ Renamed  : ${renamed}`);
    console.log(`⏭  Skipped  : ${skipped}`);
    if (unknown > 0) {
        console.log(`⚠️  Unknown  : ${unknown}`);
        unknownList.forEach(d => console.log(`   • ${d}`));
    }
    console.log(`\nDone! Folders are now under: public/universities/<Full Name>/`);
}

main().catch(console.error);
