import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Create an HTML page containing the layout of the logo exactly as described
    await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            background: transparent; 
          }
          .giant-letter {
            font-size: 170px;
            line-height: 0.8;
            font-family: ui-sans-serif, system-ui, sans-serif;
            font-weight: 900;
            color: #131313; /* Black/Dark gray for better visibility when downloaded */
          }
          .container {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            width: 800px;
          }
        </style>
      </head>
      <body>
        <div id="logo-container" class="container">
          <span class="giant-letter">L</span>
          <span class="giant-letter">N</span>
          <span class="giant-letter">B</span>
          <span class="giant-letter">G</span>
        </div>
      </body>
    </html>
  `);

    // Wait a moment for fonts/rendering
    await page.waitForTimeout(500);

    const locator = page.locator('#logo-container');
    await locator.screenshot({
        path: 'public/LNBG-logo-giant.png',
        omitBackground: true
    });


    // Also generate the small "in LNBackground" one
    await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap" rel="stylesheet">
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            background: transparent; 
            font-family: 'Inter', sans-serif;
          }
          .container { display: flex; align-items: center; gap: 8px; width: fit-content; }
          .box { width: 32px; height: 32px; border-radius: 8px; background: #0A66C2; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; }
          .text { font-weight: 700; font-size: 18px; letter-spacing: -0.025em; text-transform: uppercase; color: #111827; }
          .blue { color: #0A66C2; }
        </style>
      </head>
      <body>
        <div class="container" id="logo">
          <div class="box">in</div>
          <div class="text">LN<span class="blue">Background</span></div>
        </div>
      </body>
    </html>
  `);

    await page.waitForTimeout(500);
    const locator2 = page.locator('#logo');
    await locator2.screenshot({
        path: 'public/LNBackground-logo.png',
        omitBackground: true
    });

    await browser.close();
    console.log("Images generated successfully in the public/ folder.");
})();
