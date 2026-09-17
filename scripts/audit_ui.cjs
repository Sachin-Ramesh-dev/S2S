const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function inspectAllViews() {
  console.log('Launching Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/ui_audit';
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const tabs = [
    { name: 'dashboard', selector: 'button:has-text("Dashboard")' },
    { name: 'audit', selector: 'button:has-text("Page Audit")' },
    { name: 'topics', selector: 'button:has-text("Topic Ideas")' },
    { name: 'scripts', selector: 'button:has-text("Scripts")' },
    { name: 'swimlane', selector: 'button:has-text("Swimlane View")' },
    { name: 'calendar', selector: 'button:has-text("Content Calendar")' },
    { name: 'integrations', selector: 'button:has-text("Integrations")' }
  ];

  for (const tab of tabs) {
    console.log(`Inspecting tab: ${tab.name} (Light Mode)...`);
    const btn = page.locator(tab.selector);
    if (await btn.count() > 0) {
      await btn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, `${tab.name}_light.png`), fullPage: true });
    }
  }

  // Toggle to Dark Mode
  console.log('Toggling to Dark Mode...');
  const darkToggle = page.locator('button:has-text("Dark")').or(page.locator('input[type="checkbox"]').first());
  // Look for Dark button in top bar: <button>Dark</button> or similar
  const darkBtn = page.locator('button:has-text("Dark")');
  if (await darkBtn.count() > 0) {
    await darkBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('Switched to dark mode');

    for (const tab of tabs) {
      console.log(`Inspecting tab: ${tab.name} (Dark Mode)...`);
      const btn = page.locator(tab.selector);
      if (await btn.count() > 0) {
        await btn.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(artifactsDir, `${tab.name}_dark.png`), fullPage: true });
      }
    }
  }

  fs.writeFileSync(path.join(artifactsDir, 'console_issues.json'), JSON.stringify(consoleLogs, null, 2));
  console.log(`Finished capturing all views. Logged ${consoleLogs.length} console warnings/errors.`);

  await browser.close();
}

inspectAllViews().catch(console.error);
