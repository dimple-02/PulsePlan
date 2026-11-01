import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function audit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));

  console.log('--- 1. Testing Landing Page ---');
  await page.goto('https://pulse-plan.vercel.app/', { waitUntil: 'networkidle2' });
  const landingTitle = await page.title();
  console.log('Landing page title:', landingTitle);

  // Sign up a fresh user to get into the authenticated app
  const testEmail = `tester_${Date.now()}@pulseplan.test`;
  console.log('Creating user:', testEmail);

  await page.goto('https://pulse-plan.vercel.app/signup', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('input[type="email"]', { timeout: 5000 }).catch(() => null);

  const hasEmailInput = await page.$('input[type="email"]');
  console.log('Has signup email input:', !!hasEmailInput);

  if (hasEmailInput) {
    const nameInput = await page.$('input[placeholder*="name" i], input[name="name"], input[type="text"]');
    if (nameInput) await nameInput.type('Mobile Auditor');
    await page.type('input[type="email"]', testEmail);
    await page.type('input[type="password"]', 'StrongPass123!');
    
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Nav timeout/done:', e.message)),
        submitBtn.click()
      ]);
    }
  }

  // Wait 2s for React state to settle
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current URL after signup:', page.url());
  const postSignupHtml = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('Body text preview:', postSignupHtml.replace(/\n+/g, ' '));

  // Check routes
  const routesToTest = [
    'https://pulse-plan.vercel.app/',
    'https://pulse-plan.vercel.app/dashboard',
    'https://pulse-plan.vercel.app/projects',
    'https://pulse-plan.vercel.app/kanban',
    'https://pulse-plan.vercel.app/team',
    'https://pulse-plan.vercel.app/settings',
    'https://pulse-plan.vercel.app/workspace',
    'https://pulse-plan.vercel.app/workspaces'
  ];

  for (const route of routesToTest) {
    console.log(`\n--- Testing Route: ${route} ---`);
    await page.goto(route, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const content = await page.evaluate(() => {
      const root = document.getElementById('root');
      const inner = root ? root.innerText.trim() : '';
      const htmlLen = root ? root.innerHTML.length : 0;
      const mainEl = document.querySelector('main');
      const mainText = mainEl ? mainEl.innerText.trim() : 'NO_MAIN';
      return { innerTextPreview: inner.substring(0, 150), htmlLength: htmlLen, mainText: mainText.substring(0, 150) };
    });
    console.log('Content info:', content);
    console.log('Current URL:', page.url());
  }

  console.log('\n--- Console Logs ---');
  console.log(consoleLogs.slice(-25).join('\n'));

  console.log('\n--- Page Errors ---');
  console.log(errors.length ? errors.join('\n') : 'No JS runtime page errors.');

  await browser.close();
}

audit().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
