const sharp = require('sharp');
const path = require('path');

async function testImg() {
    const f = path.join(__dirname, 'public/Universiteter test/Imperial/Logo/020A-FBBA-47EC-9477-83A0.png');
    console.log("Testing:", f);
    const img = sharp(f);
    const meta = await img.metadata();
    console.log("Metadata:", meta);

    const stats = await img.stats();
    console.log("Stats (alpha channel):", stats.channels[3] || 'No alpha');

    // Check corners
    const PATCH = 8;
    const { width, height, channels } = meta;
    const corners = [
        { left: 0, top: 0 },
        { left: Math.max(0, width - PATCH), top: 0 },
        { left: 0, top: Math.max(0, height - PATCH) },
        { left: Math.max(0, width - PATCH), top: Math.max(0, height - PATCH) },
    ];
    for (const [i, corner] of corners.entries()) {
        const { data } = await sharp(f)
            .extract({ left: corner.left, top: corner.top, width: PATCH, height: PATCH })
            .raw()
            .toBuffer({ resolveWithObject: true });
        console.log(`Corner ${i} data length:`, data.length, 'sample:', data.subarray(0, 16));
    }
}
testImg().catch(console.error);
