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

    // 1. Plans page (two plans, active PRO)
    await page.goto(`${BASE}/admin/support/plans`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${DIR}/v6-plans-active.png` });
    console.log('Saved: v6-plans-active.png');

    // Scroll to see second plan
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${DIR}/v6-plans-active-scroll.png` });
    console.log('Saved: v6-plans-active-scroll.png');

    // 2. Priority Support detail (active plan)
    await page.goto(`${BASE}/admin/support/plans/priority-support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v6-detail-priority.png` });
    console.log('Saved: v6-detail-priority.png');

    // Scroll to see scope/terms
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${DIR}/v6-detail-priority-scroll.png` });
    console.log('Saved: v6-detail-priority-scroll.png');

    // 3. Enterprise Support detail (non-subscriber — "none" state)
    await page.goto(`${BASE}/admin/support/plans/enterprise-support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v6-detail-enterprise.png` });
    console.log('Saved: v6-detail-enterprise.png');

    // Scroll
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${DIR}/v6-detail-enterprise-scroll.png` });
    console.log('Saved: v6-detail-enterprise-scroll.png');

    // 4. Submit Ticket page
    await page.goto(`${BASE}/admin/support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v6-ticket-pro.png` });
    console.log('Saved: v6-ticket-pro.png');

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
