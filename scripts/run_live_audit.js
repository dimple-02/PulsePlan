import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const VIEWPORTS = [
  { name: 'iPhone SE (1st gen)', width: 320, height: 568 },
  { name: 'iPhone 8 / SE (2nd gen)', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone 14/15 Pro Max', width: 430, height: 932 },
];

async function runLiveAudit() {
  console.log('Auditing LIVE Vercel Deployment (https://pulse-plan.vercel.app/)...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const routes = [
    '/',
    '/workspaces',
    '/workspace',
    '/settings',
    '/dashboard',
    '/projects',
    '/kanban',
    '/team',
  ];

  try {
    const page = await browser.newPage();

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`LIVE VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await page.setViewport({
        width: vp.width,
        height: vp.height,
        isMobile: true,
        hasTouch: true,
      });

      for (const route of routes) {
        const url = `https://pulse-plan.vercel.app${route}`;
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise((r) => setTimeout(r, 800));

        const result = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const innerWidth = window.innerWidth;
          const text = body.innerText.trim();

          return {
            scrollWidth,
            innerWidth,
            overflow: scrollWidth > innerWidth + 1,
            isBlank: text.length < 30,
            snippet: text.slice(0, 60).replace(/\n/g, ' '),
          };
        });

        const status = (!result.isBlank && !result.overflow) ? 'PASS' : 'FAIL';
        console.log(`[${status}] ${route.padEnd(12)} | Blank: ${result.isBlank} | Overflow: ${result.overflow} (w: ${result.scrollWidth} vs ${result.innerWidth})`);
      }
    }
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await browser.close();
  }
}

runLiveAudit();
