const { chromium } = require('playwright-core');

async function capture() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Click on Settings in the left sidebar
  console.log('Navigating to Settings...');
  const settingsBtn = await page.waitForSelector('button:has-text("Settings"), [id*="settings"]', { timeout: 5000 });
  await settingsBtn.click();
  await page.waitForTimeout(1000);

  // Click on Integrations tab if not already active
  const integrationsTab = await page.$('button:has-text("Integrations")');
  if (integrationsTab) {
    await integrationsTab.click();
    await page.waitForTimeout(1000);
  }

  const screenshotPath = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/settings_integrations_verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
}

capture().catch(err => {
  console.error('Failed to capture screenshot:', err);
  process.exit(1);
});
