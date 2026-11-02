import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

async function verifyLive() {
  console.log('Testing Live Vercel Deployment (https://pulse-plan.vercel.app/)...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

    // 1. Check live landing page
    await page.goto('https://pulse-plan.vercel.app/', { waitUntil: 'networkidle2' });
    const landingTitle = await page.title();
    console.log('Landing page title:', landingTitle);

    // 2. Check /workspaces
    await page.goto('https://pulse-plan.vercel.app/workspaces', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const wsText = await page.evaluate(() => document.body.innerText.trim());
    const isBlank = wsText.length < 30;
    console.log('Workspaces page isBlank:', isBlank, 'Snippet:', wsText.slice(0, 80).replace(/\n/g, ' '));

    // 3. Check /settings
    await page.goto('https://pulse-plan.vercel.app/settings', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const settingsText = await page.evaluate(() => document.body.innerText.trim());
    console.log('Settings page isBlank:', settingsText.length < 30, 'Snippet:', settingsText.slice(0, 80).replace(/\n/g, ' '));

  } catch (err) {
    console.error('Live test error:', err);
  } finally {
    await browser.close();
  }
}

verifyLive();
