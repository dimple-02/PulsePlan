import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testAuthMobile() {
  // 1. Create a user via backend API to get real credentials and token
  const testEmail = `mobuser_${Date.now()}@pulseplan.test`;
  const regRes = await fetch('https://pulseplan-rpl2.onrender.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mobile User',
      email: testEmail,
      password: 'StrongPass123!'
    })
  });
  const regData = await regRes.json();
  console.log('Registered test user:', testEmail, regData.success);
  const token = regData?.data?.token;

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

  // Set auth cookie
  await page.setCookie({
    name: 'token',
    value: token,
    domain: 'pulse-plan.vercel.app',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  // Also set cookie for api domain if needed
  await page.setCookie({
    name: 'token',
    value: token,
    domain: 'pulseplan-rpl2.onrender.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  console.log('\n--- Navigating to Dashboard (Authenticated) ---');
  await page.goto('https://pulse-plan.vercel.app/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('URL:', page.url());
  const dashInfo = await page.evaluate(() => {
    const main = document.querySelector('main');
    return {
      mainText: main ? main.innerText.substring(0, 300) : 'NO_MAIN',
      mainHtmlLen: main ? main.innerHTML.length : 0,
      bodyText: document.body.innerText.substring(0, 300)
    };
  });
  console.log('Dashboard Info:', dashInfo);

  // Now test each route
  const routes = [
    '/settings',
    '/projects',
    '/kanban',
    '/team',
    '/workspace',
    '/workspaces'
  ];

  for (const r of routes) {
    console.log(`\n--- Testing ${r} ---`);
    await page.goto(`https://pulse-plan.vercel.app${r}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Current URL:', page.url());
    const info = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        mainText: main ? main.innerText.substring(0, 300) : 'NO_MAIN',
        mainHtmlLen: main ? main.innerHTML.length : 0,
        bodyText: document.body.innerText.substring(0, 300)
      };
    });
    console.log(`${r} Info:`, info);
  }

  console.log('\n--- Console Logs ---');
  console.log(consoleLogs.join('\n'));

  console.log('\n--- Page Errors ---');
  console.log(errors.length ? errors.join('\n') : 'No JS runtime page errors.');

  await browser.close();
}

testAuthMobile().catch(e => {
  console.error(e);
  process.exit(1);
});
