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
        console.log('Clicked Sign in as Admin');
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    console.log('After sign-in URL:', page.url());

    // Ticket form
    await page.goto(`${BASE}/admin/support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v2-ticket-form.png` });
    console.log('Saved: v2-ticket-form.png');

    // Plans page
    await page.goto(`${BASE}/admin/support/plans`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v2-plans-page.png` });
    console.log('Saved: v2-plans-page.png');

    // Plan detail
    await page.goto(`${BASE}/admin/support/plans/priority-support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v2-plan-detail.png` });
    console.log('Saved: v2-plan-detail.png');

    // Terms - license tab
    await page.goto(`${BASE}/admin/support/terms`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/v2-terms-license.png` });
    console.log('Saved: v2-terms-license.png');

    // Terms - privacy tab
    const privacyTab = await page.$('button[value="privacy"]');
    if (privacyTab) {
      await privacyTab.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.screenshot({ path: `${DIR}/v2-terms-privacy.png` });
    console.log('Saved: v2-terms-privacy.png');

    console.log('All v2 screenshots done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
