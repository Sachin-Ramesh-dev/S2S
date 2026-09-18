const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);

  // Ensure Light mode
  const lightBtn = await page.$('button:has-text("Light")');
  if (lightBtn) await lightBtn.click();
  await page.waitForTimeout(400);

  // Go to Settings -> AI & Models
  const settingsBtn = await page.$('#nav-settings');
  if (settingsBtn) await settingsBtn.click();
  await page.waitForTimeout(500);

  const aiTab = await page.$('button:has-text("AI & Models")');
  if (aiTab) await aiTab.click();
  await page.waitForTimeout(500);

  // Click Test on a provider
  const testBtn = await page.$('button:has-text("Test Connection")');
  if (testBtn) {
    await testBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/contrast_ai_test_light.png'
  });
  console.log('Saved contrast_ai_test_light.png');
  await browser.close();
})();
