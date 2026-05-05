import { existsSync, mkdirSync, copyFileSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";

import { fileURLToPath } from "url";
const BASE = fileURLToPath(new URL("../public", import.meta.url));
const DEST = join(BASE, "marquee-logos");

// if (existsSync(DEST)) rmSync(DEST, { recursive: true, force: true });
if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

const logos = [
    ["Loughborough University", "loughborough"],
    ["Durham University", "durham"],
    ["University of Exeter", "exeter"],
    ["University of Oxford", "oxford"],
    ["London School of Economics", "lse"],
];

for (const [uni, slug] of logos) {
    const dir = join(BASE, "universities", uni, "logo");
    if (!existsSync(dir)) { console.log(`MISSING dir: ${uni}`); continue; }

    const png = join(dir, "logo.png");
    const svg = join(dir, "logo.svg");
    const jpg = join(dir, "logo.jpg");

    if (existsSync(png)) {
        copyFileSync(png, join(DEST, `${slug}.png`));
        console.log(`✓ PNG: ${slug}`);
    } else if (existsSync(svg)) {
        copyFileSync(svg, join(DEST, `${slug}.svg`));
        console.log(`✓ SVG: ${slug}`);
    } else if (existsSync(jpg)) {
        copyFileSync(jpg, join(DEST, `${slug}.jpg`));
        console.log(`✓ JPG: ${slug}`);
    } else {
        console.log(`✗ No logo found: ${uni}`);
    }
}

console.log("\nDone! Files in marquee-logos:");
readdirSync(DEST).forEach(f => console.log(" -", f));
