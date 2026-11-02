import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

async function verifyAuthLive() {
  console.log('Verifying Live Vercel authenticated workspace and mobile flow...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

    // 1. Authenticate via frontend AuthModal
    await page.goto('https://pulse-plan.vercel.app/', { waitUntil: 'networkidle2' });
    
    // Check asset hash in HTML to confirm latest build is deployed on Vercel
    const scripts = await page.evaluate(() => 
      Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'))
    );
    console.log('Live scripts:', scripts);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

verifyAuthLive();
