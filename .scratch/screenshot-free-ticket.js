const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Step 1: Sign in via admin demo button
  console.log('Navigating to admin sign-in...');
  await page.goto('http://localhost:3000/auth/admin-signin', { waitUntil: 'networkidle2', timeout: 15000 });

  const buttons = await page.$$('button');
  let adminButton = null;
  for (const btn of buttons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text && text.includes('Admin')) {
      adminButton = btn;
      break;
    }
  }

  if (!adminButton) {
    console.error('Admin sign-in button not found');
    await browser.close();
    process.exit(1);
  }

  console.log('Clicking admin sign-in button...');
  await adminButton.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
  console.log('Signed in, current URL:', page.url());

  // Step 2: Navigate to /admin/support
  console.log('Navigating to /admin/support...');
  await page.goto('http://localhost:3000/admin/support', { waitUntil: 'networkidle2', timeout: 15000 });
  console.log('Support page loaded, URL:', page.url());

  // Wait for client-side rendering
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: Take screenshot
  await page.screenshot({
    path: 'd:/DEV/artisan-roast/.screenshot/support-services/free-ticket-form.png',
    fullPage: false
  });
  console.log('Screenshot saved.');

  // Grab page text for reporting
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('\n--- PAGE TEXT (first 3000 chars) ---');
  console.log(bodyText.substring(0, 3000));

  await browser.close();
})();
