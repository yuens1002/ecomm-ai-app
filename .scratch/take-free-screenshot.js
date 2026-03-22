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
    await page.setViewport({ width: 1280, height: 800 });

    // Sign in as admin
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

    // Navigate to support page
    await page.goto(`${BASE}/admin/support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Support page URL:', page.url());

    // Check if we got redirected to access-denied
    if (page.url().includes('access-denied')) {
      console.log('ERROR: Access denied');
      await page.screenshot({ path: `${DIR}/debug-free-error.png` });
      process.exit(1);
    }

    // Take the FREE ticket form screenshot
    await page.screenshot({ path: `${DIR}/free-ticket-form.png` });
    console.log('Saved: free-ticket-form.png');

    // Also take the Subscriptions page in FREE state (plan card: none)
    await page.goto(`${BASE}/admin/support/plans`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/free-plans-page.png` });
    console.log('Saved: free-plans-page.png');

    // Also take the plan detail in FREE state (non-subscriber view)
    await page.goto(`${BASE}/admin/support/plans/priority-support`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: `${DIR}/free-plan-detail.png` });
    console.log('Saved: free-plan-detail.png');

    console.log('All FREE screenshots taken!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
