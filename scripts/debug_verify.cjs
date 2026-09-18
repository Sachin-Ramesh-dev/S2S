const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('request', req => {
    if (req.url().includes('connect-manus')) {
      console.log('REQ METHOD:', req.method());
      console.log('REQ POST DATA:', req.postData());
    }
  });
  page.on('response', async res => {
    if (res.url().includes('connect-manus')) {
      console.log('RES STATUS:', res.status());
      console.log('RES BODY:', await res.text());
    }
  });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(500);
  const settingsBtn = await page.$('#btn-nav-settings');
  if (settingsBtn) await settingsBtn.click();
  await page.waitForTimeout(500);
  const integrationsTab = await page.$('button:has-text("Integrations")');
  if (integrationsTab) await integrationsTab.click();
  await page.waitForTimeout(500);
  const igCard = await page.$('#item-integration-instagram');
  if (igCard) await igCard.click();
  await page.waitForTimeout(500);
  const addAnotherBtn = await page.$('button:has-text("Add / Switch Instagram Account")');
  if (addAnotherBtn) await addAnotherBtn.click();
  await page.waitForTimeout(500);
  const quickFillBtn = await page.$('button:has-text("Quick Fill Demo Token")');
  if (quickFillBtn) await quickFillBtn.click();
  await page.waitForTimeout(500);
  const verifyBtn = await page.$('button:has-text("Verify Token & Connect")');
  if (verifyBtn) await verifyBtn.click();
  await page.waitForTimeout(1500);
  await browser.close();
})();
