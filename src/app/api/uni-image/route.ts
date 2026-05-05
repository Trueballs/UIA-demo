import { existsSync, readFileSync } from 'fs';

export const dynamic = 'force-dynamic';
import { join } from 'path';
import sharp from 'sharp';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    const file = searchParams.get('file') || '';
    const root = searchParams.get('root') || 'uk-universities';

    if (!folder || !file) return new Response('Missing params', { status: 400 });

    const basePath = join(process.cwd(), 'public', root);
    let filePath = join(basePath, folder, 'Bilder_HighRez', file);
    
    // Support both NFC and NFD normalizations (for special characters like Å, Ø, Æ)
    if (!existsSync(filePath)) {
        const nfc = filePath.normalize('NFC');
        const nfd = filePath.normalize('NFD');
        if (existsSync(nfc)) filePath = nfc;
        else if (existsSync(nfd)) filePath = nfd;
    }
    
    // SIKKERHETSFIKS: Sikre at path-en faktsik starter med basePath for å forhindre Directory Traversal (LFI)
    if (!filePath.startsWith(basePath)) {
        return new Response('Forbidden', { status: 403 });
    }
    
    if (!existsSync(filePath)) return new Response('Not found', { status: 404 });

    const ext = file.split('.').pop()!.toLowerCase();
    const contentType =
        ext === 'webp' ? 'image/webp' :
            ext === 'avif' ? 'image/avif' :
                ext === 'png' ? 'image/png' :
                    'image/jpeg';

    const buf = readFileSync(filePath);

    // OPTIMIZATION: If width is provided, resize the image for faster loading
    const w = searchParams.get('w');
    if (w) {
        try {
            const width = parseInt(w);
            if (!isNaN(width) && width > 0) {
                const optimized = await sharp(buf)
                    .resize(width, null, { withoutEnlargement: true })
                    .sharpen(0.5) // Simplified sharpening to fix lint/type error
                    .webp({ quality: 95, lossless: false, smartSubsample: true })
                    .toBuffer();
                
                return new Response(new Uint8Array(optimized), {
                    headers: {
                        'Content-Type': 'image/webp',
                        'Cache-Control': 'public, max-age=3600',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    },
                });
            }
        } catch (e) {
            console.error('Image optimization failed:', e);
        }
    }

    return new Response(new Uint8Array(buf), {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
    });
}
