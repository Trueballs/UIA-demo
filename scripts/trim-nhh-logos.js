
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function trimLogo(filePath) {
    console.log(`Trimming ${filePath}...`);
    const buffer = fs.readFileSync(filePath);
    try {
        await sharp(buffer)
            .trim()
            .toFile(filePath + '.tmp');
        fs.renameSync(filePath + '.tmp', filePath);
        console.log(`Done: ${filePath}`);
    } catch (err) {
        console.error(`Error trimming ${filePath}:`, err);
    }
}

const logoDir = '/Users/oscarwoldskaarderud/linkin idee/public/norske-universiteter/NHH/Logo';
const files = fs.readdirSync(logoDir).filter(f => /\.(png|webp|jpg|jpeg)$/i.test(f));

(async () => {
    for (const f of files) {
        await trimLogo(path.join(logoDir, f));
    }
})();
