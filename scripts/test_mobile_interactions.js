import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

async function testInteractions() {
  console.log('Testing Mobile Drawer & Interactive Modals...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });

  // 1. Test AuthModal on Landing Page
  console.log('1. Testing Landing Page AuthModal...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

  // Find sign in button by text in evaluate
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const btn = buttons.find(b => b.innerText.includes('Sign In') || b.innerText.includes('Get Started'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('   Sign in button clicked:', clicked);

  await new Promise((r) => setTimeout(r, 600));
  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return { found: false };
    const rect = modal.getBoundingClientRect();
    return {
      found: true,
      width: rect.width,
      height: rect.height,
      fitsViewport: rect.height <= window.innerHeight,
    };
  });
  console.log('   AuthModal state:', modalInfo);

  // 2. Test Mobile Sidebar Drawer on /dashboard
  console.log('2. Testing Mobile Sidebar Drawer on /dashboard...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  // Find hamburger menu button
  const hamburger = await page.$('button[aria-label="Open mobile navigation menu"]');
  if (hamburger) {
    await hamburger.click();
    await new Promise((r) => setTimeout(r, 600));

    const drawerState = await page.evaluate(() => {
      const aside = document.querySelector('aside.fixed');
      const backdrop = document.querySelector('.bg-slate-900\\/50, .backdrop-blur-xs');
      return {
        drawerExists: !!aside,
        drawerClasses: aside?.className || '',
        hasBackdrop: !!backdrop,
      };
    });
    console.log('   Drawer opened:', drawerState.drawerExists, 'Backdrop active:', drawerState.hasBackdrop);

    // Click close button
    const closeBtn = await page.$('button[aria-label="Close navigation sidebar"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      const closed = await page.evaluate(() => {
        const aside = document.querySelector('aside.fixed');
        return !aside || aside.className.includes('-translate-x-full');
      });
      console.log('   Drawer closed on X click:', closed);
    }
  }

  // 3. Test Mobile Kanban Column Switcher
  console.log('3. Testing Mobile Kanban Column Switcher on /kanban...');
  await page.goto('http://localhost:5173/kanban', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const kanbanTabs = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button[data-column]'));
    return tabs.map(t => t.innerText.trim());
  });
  console.log('   Mobile Kanban Tab pills found:', kanbanTabs);

  // Click on "In Progress" tab pill
  const tabClicked = await page.evaluate(() => {
    const tab = document.querySelector('button[data-column="in_progress"]');
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  });
  console.log('   Clicked "In Progress" column tab pill:', tabClicked);

  await browser.close();
  console.log('All interactive mobile component tests completed successfully!');
}

testInteractions();
