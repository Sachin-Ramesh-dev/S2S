const { chromium } = require('playwright');
const path = require('path');

async function captureEnvDark() {
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Switch to dark mode if light
  const darkBtn = page.locator('button:has-text("Dark"), #btn-theme-dark');
  if ((await darkBtn.count()) > 0) {
    await darkBtn.first().click();
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: path.join(artifactsDir, 'env_demo_sandbox_dark.png') });

  // Toggle to live
  await page.click('#btn-toggle-live-mode');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactsDir, 'env_live_production_dark.png') });

  // Go to Settings > General
  await page.click('#nav-settings');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactsDir, 'env_settings_card_dark.png') });

  await browser.close();
  console.log('✅ Dark mode screenshots captured successfully');
}

captureEnvDark();
