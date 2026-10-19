import { chromium } from 'playwright';
import path from 'path';

async function main() {
  console.log('Launching browser to verify @bajajfinance in accounts list...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const outDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage';

  try {
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Loaded http://localhost:3005 successfully.');

    await page.waitForTimeout(1000);

    // Take initial screenshot
    await page.screenshot({ path: path.join(outDir, 'verify_01_page_loaded.png') });

    // Find and click the account selector dropdown button
    const accountDropdownBtn = page.locator('#btn-account-dropdown, button:has-text("Connected Accounts"), button:has-text("@")').first();
    console.log('Locating account dropdown button...');
    if (await accountDropdownBtn.isVisible()) {
      console.log('Clicking account dropdown button...');
      await accountDropdownBtn.click();
      await page.waitForTimeout(500);

      // Take screenshot of open dropdown
      await page.screenshot({ path: path.join(outDir, 'verify_02_account_dropdown_open.png') });

      // Check if @bajajfinance is present
      const bajajOption = page.locator('button:has-text("bajajfinance"), #account-opt-ig-bajajfinance');
      const bajajCount = await bajajOption.count();
      console.log(`Found ${bajajCount} elements matching bajajfinance in the dropdown.`);

      if (bajajCount > 0) {
        console.log('SUCCESS: @bajajfinance is visible in the dropdown!');
        await bajajOption.first().click();
        await page.waitForTimeout(1000);

        // Take screenshot after selection
        await page.screenshot({ path: path.join(outDir, 'verify_03_bajajfinance_selected.png') });
        console.log('Selected @bajajfinance as active workspace account!');
      } else {
        console.error('ERROR: @bajajfinance NOT found in the dropdown list.');
      }
    } else {
      console.error('ERROR: Account dropdown button not found on page.');
    }
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
  }
}

main();
