import { readdir, stat, writeFile, unlink } from 'fs/promises';
import { join, extname } from 'path';
import sharp from 'sharp';

const TARGET_DIR = './public';
const MAX_WIDTH = 2000;
const QUALITY = 85;

async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = join(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            const ext = extname(res).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
                yield res;
            }
        }
    }
}

async function optimize() {
    console.log('🚀 Starting image optimization...');
    let totalSaved = 0;
    let count = 0;

    for await (const file of getFiles(TARGET_DIR)) {
        if (file.includes('favicon') || file.includes('logo-search')) continue; // Skip icons

        try {
            const stats = await stat(file);
            const originalSize = stats.size;

            // Load image metadata
            const image = sharp(file);
            const metadata = await image.metadata();

            // Only optimize if it's "large" (> 500KB) or wider than MAX_WIDTH
            if (originalSize < 500 * 1024 && (!metadata.width || metadata.width <= MAX_WIDTH)) {
                continue;
            }

            count++;
            process.stdout.write(`Optimizing [${count}] ${file} (${(originalSize / 1024 / 1024).toFixed(2)} MB)... `);

            const buffer = await image
                .resize(MAX_WIDTH, null, { withoutEnlargement: true })
                .jpeg({ quality: QUALITY, progressive: true, force: false })
                .webp({ quality: QUALITY, force: false })
                .toBuffer();

            // We overwrite the file. If we changed the format, we might need more logic, 
            // but for now, we'll keep the extension to avoid breaking references in existing data.
            await writeFile(file, buffer);
            
            const newStats = await stat(file);
            const saved = originalSize - newStats.size;
            totalSaved += saved;

            console.log(`DONE. Saved: ${(saved / 1024 / 1024).toFixed(2)} MB`);
        } catch (err) {
            console.error(`\n❌ Error optimizing ${file}:`, err.message);
        }
    }

    console.log(`\n✅ Optimization complete!`);
    console.log(`Total images optimized: ${count}`);
    console.log(`Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimize().catch(console.error);
