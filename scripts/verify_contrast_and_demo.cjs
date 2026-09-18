const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // 1. Ensure Light mode
  const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log('Initially dark mode:', isDarkInitially);
  if (isDarkInitially) {
    const lightBtn = await page.$('button:has-text("Light")');
    if (lightBtn) {
      await lightBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 2. Open Settings (left sidebar or navigation)
  const settingsBtn = await page.$('#btn-nav-settings, button:has-text("Settings")');
  if (settingsBtn) {
    await settingsBtn.click();
    await page.waitForTimeout(600);
  }

  // 3. Navigate to Integrations tab
  const integrationsTab = await page.$('button:has-text("Integrations")');
  if (integrationsTab) {
    await integrationsTab.click();
    await page.waitForTimeout(500);
  }

  // 4. Click Instagram connector by exact ID
  const igCard = await page.$('#item-integration-instagram');
  if (igCard) {
    await igCard.click();
    await page.waitForTimeout(600);
  }

  // 5. If currently connected, click Disconnect or Add Another Account to see the form
  const addAnotherBtn = await page.$('button:has-text("Add / Switch Instagram Account")');
  if (addAnotherBtn) {
    await addAnotherBtn.click();
    await page.waitForTimeout(500);
  } else {
    const disconnectBtn = await page.$('button:has-text("Disconnect Account")');
    if (disconnectBtn) {
      await disconnectBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // 6. Test Error banner contrast: Click Verify with empty token or invalid token
  const tokenInput = await page.$('input[placeholder="EAA..."]');
  if (tokenInput) {
    await tokenInput.fill('');
  }
  const verifyBtn = await page.$('button:has-text("Verify Token & Connect")');
  if (verifyBtn) {
    await verifyBtn.click();
    await page.waitForTimeout(600);
  }

  // Capture screenshot of Error Banner in Light mode
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'contrast_error_light.png'),
    fullPage: false
  });
  console.log('Saved contrast_error_light.png');

  // Check the error banner element styling
  const errorInfo = await page.evaluate(() => {
    const errBox = document.querySelector('div.bg-rose-50, div.bg-rose-950');
    if (!errBox) return null;
    const computed = window.getComputedStyle(errBox);
    return {
      text: errBox.textContent,
      className: errBox.className,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      border: computed.border
    };
  });
  console.log('Light Mode Error Box styles:', JSON.stringify(errorInfo, null, 2));

  // 7. Test Quick Fill Demo Token and Verify in Demo Sandbox
  const quickFillBtn = await page.$('button:has-text("Quick Fill Demo Token")');
  if (quickFillBtn) {
    await quickFillBtn.click();
    await page.waitForTimeout(400);
  }

  // Click Verify Token & Connect
  const verifyBtn2 = await page.$('button:has-text("Verify Token & Connect")');
  if (verifyBtn2) {
    await verifyBtn2.click();
    await page.waitForTimeout(1200);
  }

  // Capture screenshot of Connected/Success in Light mode
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'contrast_success_light.png'),
    fullPage: false
  });
  console.log('Saved contrast_success_light.png');

  // Check the success banner element styling
  const successInfo = await page.evaluate(() => {
    const succBox = document.querySelector('div.bg-emerald-50, div.bg-emerald-950');
    if (!succBox) return null;
    const computed = window.getComputedStyle(succBox);
    return {
      text: succBox.textContent,
      className: succBox.className,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      border: computed.border
    };
  });
  console.log('Light Mode Success Box styles:', JSON.stringify(successInfo, null, 2));

  // 8. Toggle to Dark Mode to verify dark mode contrast
  const darkBtn = await page.$('button:has-text("Dark")');
  if (darkBtn) {
    await darkBtn.click();
    await page.waitForTimeout(600);
  }

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'contrast_dark_mode.png'),
    fullPage: false
  });
  console.log('Saved contrast_dark_mode.png');

  await browser.close();
  console.log('Verification completed successfully.');
})();
