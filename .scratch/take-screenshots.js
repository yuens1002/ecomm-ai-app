const puppeteer = require('puppeteer');

const BASE = 'http://localhost:3000';
const DIR = 'd:/DEV/artisan-roast/.screenshot/support-services';

async function signIn(page) {
  await page.goto(`${BASE}/auth/admin-signin`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Find "Sign in as Admin" button
  const buttons = await page.$$('button');
  let clicked = false;
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent || '');
    if (text.includes('Sign in as Admin')) {
      await btn.click();
      clicked = true;
      console.log('Clicked "Sign in as Admin" button');
      break;
    }
  }

  if (!clicked) {
    // Fallback: try any button with "admin" text
    for (const btn of buttons) {
      const text = await btn.evaluate(el => el.textContent || '');
      if (text.toLowerCase().includes('admin')) {
        await btn.click();
        clicked = true;
        console.log('Clicked admin button:', text.trim());
        break;
      }
    }
  }

  if (!clicked) {
    const allText = await page.evaluate(() => document.body.innerText);
    throw new Error('Could not find admin sign-in button. Page text: ' + allText.substring(0, 500));
  }

  // Wait for redirect — demoSignIn uses server action that triggers redirect
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  // May need a second navigation wait if there's a redirect chain
  await new Promise(r => setTimeout(r, 2000));

  const url = page.url();
  console.log('After sign-in, URL:', url);

  // If we landed on homepage, navigate to admin
  if (url === `${BASE}/` || url === `${BASE}`) {
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Navigated to admin, URL:', page.url());
  }

  // Check we're on admin
  const finalUrl = page.url();
  if (finalUrl.includes('access-denied') || finalUrl.includes('signin')) {
    throw new Error('Authentication failed, landed on: ' + finalUrl);
  }
}

async function screenshot(page, path, url, opts = {}) {
  if (url) {
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2', timeout: 30000 });
  }
  if (opts.waitFor) {
    await page.waitForSelector(opts.waitFor, { timeout: 10000 }).catch(() => {});
  }
  if (opts.click) {
    const el = await page.$(opts.click);
    if (el) {
      await el.click();
      await new Promise(r => setTimeout(r, 1500));
    } else {
      // Try finding by text content
      if (opts.clickText) {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
          const text = await btn.evaluate(el => el.textContent || '');
          if (text.includes(opts.clickText)) {
            await btn.click();
            await new Promise(r => setTimeout(r, 1500));
            break;
          }
        }
      }
    }
  }
  if (opts.delay) {
    await new Promise(r => setTimeout(r, opts.delay));
  }

  // Check we're not on access denied
  const pageUrl = page.url();
  if (pageUrl.includes('access-denied')) {
    console.log('WARNING: Access denied for', path);
    return false;
  }

  await page.screenshot({ path: `${DIR}/${path}` });
  console.log('Saved:', path);
  return true;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Sign in
    await signIn(page);
    console.log('Authenticated successfully');

    // Terms page screenshots (PRO state)
    // Tab 1: License Key (default)
    await screenshot(page, 'pro-terms-license-tab.png', '/admin/support/terms', {
      waitFor: '[role="tablist"]',
      delay: 1000
    });

    // Tab 2: Data Privacy — click by value attribute
    await screenshot(page, 'pro-terms-privacy-tab.png', null, {
      click: 'button[value="privacy"]',
      clickText: 'Data Privacy',
      delay: 1000
    });

    // Tab 3: Terms & Conditions
    await screenshot(page, 'pro-terms-tc-tab.png', null, {
      click: 'button[value="terms"]',
      clickText: 'Terms & Conditions',
      delay: 1000
    });

    console.log('All screenshots taken!');
  } catch (err) {
    console.error('Error:', err.message);
    // Take debug screenshot
    try {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[pages.length - 1].screenshot({ path: `${DIR}/debug-error.png` });
        console.log('Debug screenshot saved');
      }
    } catch {}
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
