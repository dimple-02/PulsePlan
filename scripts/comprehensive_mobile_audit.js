import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(EDGE_PATH)
  ? EDGE_PATH
  : fs.existsSync(CHROME_PATH)
  ? CHROME_PATH
  : null;

if (!executablePath) {
  console.error('No suitable browser found for puppeteer');
  process.exit(1);
}

const VIEWPORTS = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
  { name: 'iPhone 8 / SE (2nd gen)', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14/15 Pro Max', width: 430, height: 932 },
];

const BACKEND_URL = 'https://pulseplan-rpl2.onrender.com/api';

async function runAudit() {
  console.log(`Starting Comprehensive Mobile UI Audit using: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1200,900'],
  });

  try {
    const page = await browser.newPage();

    // 1. Obtain test auth token from backend
    console.log('Obtaining authentication token from Render backend...');
    const testEmail = `audit_mobile_${Date.now()}@example.com`;
    const signupRes = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mobile Auditor',
        email: testEmail,
        password: 'Password123!',
      }),
    });

    const signupData = await signupRes.json();
    const token = signupData.token;
    const user = signupData.user;
    console.log('Account provisioned:', user?.email, 'Token received:', !!token);

    // Let's set up local preview server URL or test against local preview / build
    // We'll test against the local Vite dev/preview server
    const BASE_URL = 'http://localhost:5173';

    // Check if localhost:5173 is reachable, else we can start preview
    let isLocalUp = false;
    try {
      const ping = await fetch(BASE_URL);
      if (ping.ok) isLocalUp = true;
    } catch (e) {
      isLocalUp = false;
    }

    console.log(`Local dev server reachable: ${isLocalUp}`);

    const targetBaseUrl = isLocalUp ? BASE_URL : 'https://pulse-plan.vercel.app';
    console.log(`Testing target: ${targetBaseUrl}`);

    const results = [];

    const routesToTest = [
      { path: '/', label: 'Landing Page' },
      { path: '/workspaces', label: 'Workspaces Directory' },
      { path: '/workspace', label: 'Workspace Dashboard' },
      { path: '/settings', label: 'Workspace Settings' },
      { path: '/dashboard', label: 'Main Dashboard' },
      { path: '/projects', label: 'Projects Page' },
      { path: '/kanban', label: 'Kanban Board' },
      { path: '/team', label: 'Team Page' },
    ];

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        isMobile: true,
        hasTouch: true,
      });

      for (const route of routesToTest) {
        const fullUrl = `${targetBaseUrl}${route.path}`;
        
        // Before navigating, inject token into localStorage if authenticated route
        if (route.path !== '/') {
          await page.goto(`${targetBaseUrl}/`, { waitUntil: 'domcontentloaded' });
          await page.evaluate((tok, usr) => {
            localStorage.setItem('token', tok);
            localStorage.setItem('user', JSON.stringify(usr));
          }, token, user);
        }

        await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => {
          console.warn(`Nav timeout for ${route.path}, proceeding anyway`);
        });

        // Wait a small moment for React render
        await new Promise((r) => setTimeout(r, 1200));

        // Evaluate layout metrics
        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const innerWidth = window.innerWidth;

          // Check if page rendered blank
          const text = body.innerText.trim();
          const isBlank = text.length < 30;

          // Check inputs font sizes (to detect iOS auto zoom < 16px)
          const inputs = Array.from(document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), select, textarea'));
          const smallFontInputs = inputs.filter((el) => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            return fontSize < 15.5 && el.offsetParent !== null; // visible
          }).map(el => ({
            tagName: el.tagName,
            placeholder: el.getAttribute('placeholder') || el.getAttribute('name') || '',
            fontSize: window.getComputedStyle(el).fontSize
          }));

          // Check bottom navigation bar presence on app routes
          const bottomNav = document.querySelector('nav.fixed.bottom-0');
          const hasBottomNav = !!bottomNav;

          // Check horizontal overflow
          const hasHorizontalOverflow = scrollWidth > innerWidth + 1;

          return {
            title: document.title,
            scrollWidth,
            clientWidth,
            innerWidth,
            hasHorizontalOverflow,
            isBlank,
            textSnippet: text.slice(0, 100).replace(/\n/g, ' '),
            smallFontCount: smallFontInputs.length,
            smallFontInputs: smallFontInputs.slice(0, 3),
            hasBottomNav,
          };
        });

        const status = (!metrics.isBlank && !metrics.hasHorizontalOverflow && metrics.smallFontCount === 0) ? 'PASS' : 'WARN';
        console.log(`[${status}] ${vp.name} | ${route.label} (${route.path})`);
        console.log(`       Blank: ${metrics.isBlank} | Overflow: ${metrics.hasHorizontalOverflow} (w: ${metrics.scrollWidth} vs ${metrics.innerWidth}) | Small Inputs: ${metrics.smallFontCount}`);

        results.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          route: route.path,
          label: route.label,
          metrics,
        });
      }
    }

    fs.writeFileSync('scripts/audit_results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\nAudit complete! Results saved to scripts/audit_results.json');
  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
