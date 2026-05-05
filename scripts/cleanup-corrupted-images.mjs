import fs from 'fs';
import path from 'path';

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDir(fullPath);
        } else if (fullPath.endsWith('.svg') || fullPath.endsWith('.png') || fullPath.endsWith('.jpg')) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8').substring(0, 800);
                if (content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) {
                    console.log('Deleting corrupted file:', fullPath);
                    fs.unlinkSync(fullPath);
                }
            } catch (e) {
                // ignore read errors for actual binary images
            }
        }
    }
}

checkDir('public/universities');
console.log('Cleanup complete.');
