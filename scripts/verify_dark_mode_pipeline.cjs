const { chromium } = require('playwright');
const path = require('path');

async function verifyDarkPipeline() {
  console.log('🌙 Verifying Dark Mode Aesthetics for Full Pipeline...');
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Switch to dark mode
    const darkToggle = page.locator('button:has-text("Dark")');
    if (await darkToggle.isVisible()) {
      await darkToggle.click();
      await page.waitForTimeout(500);
      console.log('  Switched to Dark Mode');
    }

    // 1. Audit Tab Dark
    const auditTab = page.locator('#tab-audit');
    await auditTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactsDir, '05_dark_audit_pipeline.png'), fullPage: false });

    // 2. Topics Tab Dark
    const topicsTab = page.locator('#tab-topics');
    await topicsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactsDir, '06_dark_topics_studio.png'), fullPage: false });

    // 3. Scripts Tab Dark
    const scriptsTab = page.locator('#tab-scripts');
    await scriptsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactsDir, '07_dark_scripts_studio_4act.png'), fullPage: false });

    // 4. Calendar Tab Dark
    const calendarTab = page.locator('#tab-calendar');
    await calendarTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactsDir, '08_dark_calendar_view.png'), fullPage: false });

    console.log('  ✅ Dark mode screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

verifyDarkPipeline();
