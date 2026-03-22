const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const DIR = 'd:/DEV/artisan-roast/.screenshot/support-services';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Sign in
    await page.goto(`${BASE}/auth/admin-signin`, { waitUntil: 'networkidle2', timeout: 30000 });
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent || '');
      if (text.includes('Sign in as Admin')) {
        await btn.click();
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    // Plans page with multiple plans
    await page.goto(`${BASE}/admin/support/plans`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${DIR}/v5-plans-multi.png` });
    console.log('Saved: v5-plans-multi.png');

    // Scroll down to see second plan
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${DIR}/v5-plans-multi-scroll.png` });
    console.log('Saved: v5-plans-multi-scroll.png');

    // Plan detail (cleaned up - no add-ons)
    await page.goto(`${BASE}/admin/support/plans/priority-support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v5-plan-detail-clean.png` });
    console.log('Saved: v5-plan-detail-clean.png');

    // Submit ticket page
    await page.goto(`${BASE}/admin/support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v5-ticket-pro.png` });
    console.log('Saved: v5-ticket-pro.png');

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
