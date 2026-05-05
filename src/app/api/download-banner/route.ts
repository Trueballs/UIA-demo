import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/download-banner
 * Handles form submissions or JSON requests with a base64 'dataUrl' image.
 * Returns: binary PNG with Content-Disposition so all browsers (incl. Safari)
 *          download the file precisely as "linkedin-banner.png".
 */
export async function POST(req: NextRequest) {
    try {
        let dataUrl: string | null = null;
        
        // Browsers submit forms as x-www-form-urlencoded or multipart/form-data
        const contentType = req.headers.get("content-type") || "";
        
        if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            dataUrl = formData.get("dataUrl") as string;
        } else {
            const body = await req.json();
            dataUrl = body.dataUrl;
        }

        if (!dataUrl || !dataUrl.startsWith("data:image/png;base64,")) {
            return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
        }

        // We decode the base64 string directly into binary data
        const base64 = dataUrl.slice("data:image/png;base64,".length);
        const buffer = Buffer.from(base64, "base64");

        // We tell the browser: "This is a direct download attachment called linkedin-banner.png"
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": 'attachment; filename="linkedin-banner.png"',
                "Content-Length": String(buffer.length),
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("download-banner error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
