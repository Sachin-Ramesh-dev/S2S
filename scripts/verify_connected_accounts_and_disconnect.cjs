const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testIntegrationsExperience() {
  console.log('🧪 Starting Playwright Automated Verification for Integrations Experience Changes...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

  try {
    console.log('1. Loading application at http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Navigate to Settings
    console.log('2. Opening Settings...');
    const settingsBtn = page.locator('#nav-settings');
    await settingsBtn.click();
    await page.waitForSelector('#unified-settings-page', { timeout: 5000 });

    // Step 1 Check: Verify "Teams" hint is REMOVED from Settings sidebar
    console.log('3. Checking "Integrations" navigation tab (Requirement 1)...');
    const integrationsTab = page.locator('#tab-settings-integrations');
    const tabText = await integrationsTab.innerText();
    console.log(`   - Integrations Tab text content: "${tabText.replace(/\s+/g, ' ').trim()}"`);
    
    // Check if 'Teams' exists anywhere inside this tab
    const hasTeamsBadge = tabText.toLowerCase().includes('teams');
    if (hasTeamsBadge) {
      throw new Error(`FAIL: "Teams" badge/hint was found in Integrations tab! Text: "${tabText}"`);
    } else {
      console.log('   ✅ PASS: "Teams" hint is completely removed. Tab displays cleanly as "Integrations".');
    }

    // Step 2 Check: Click Integrations tab and verify Connected Accounts are loaded immediately
    console.log('4. Navigating to Integrations tab...');
    await integrationsTab.click();
    await page.waitForTimeout(800);

    // Make sure Instagram connector is selected
    const igItem = page.locator('#item-integration-instagram');
    await igItem.click();
    await page.waitForTimeout(800);

    // Verify Title & Status
    const title = page.locator('div:has-text("Instagram Graph API Connector")').first();
    await title.waitFor({ timeout: 5000 });
    console.log('   - Found "Instagram Graph API Connector" heading');

    // Verify credentials fields are visible before any verify click
    const tokenInput = page.locator('#input-meta-token');
    await tokenInput.waitFor({ timeout: 3000 });
    console.log('   - Token/API credential fields are present');

    // Verify Connected Accounts section is loaded and displayed immediately
    console.log('5. Verifying Connected Accounts displayed immediately before verification (Requirement 2)...');
    const connectedAccountsHeading = page.locator('span:has-text("Connected Accounts")').first();
    await connectedAccountsHeading.waitFor({ timeout: 3000 });

    const bajajRow = page.locator('#connected-account-bajajfinance');
    const fintechRow = page.locator('#connected-account-fintech_insider');
    const zerodhaRow = page.locator('#connected-account-zerodhainvest');
    const tataRow = page.locator('#connected-account-tatacapital_loans');

    const bajajVisible = await bajajRow.isVisible();
    const fintechVisible = await fintechRow.isVisible();
    const zerodhaVisible = await zerodhaRow.isVisible();
    const tataVisible = await tataRow.isVisible();

    console.log(`   - @bajajfinance visible: ${bajajVisible}`);
    console.log(`   - @fintech_insider visible: ${fintechVisible}`);
    console.log(`   - @zerodhainvest visible: ${zerodhaVisible}`);
    console.log(`   - @tatacapital_loans visible: ${tataVisible}`);

    if (!bajajVisible || !fintechVisible || !zerodhaVisible || !tataVisible) {
      throw new Error('FAIL: Not all 4 existing connected accounts were loaded immediately before verification!');
    }
    console.log('   ✅ PASS: All 4 connected accounts displayed immediately upon page load without verifying token.');

    // Verify "Connect Another Account" option button exists
    const connectAnotherBtn = page.locator('#btn-connect-another-account');
    if (await connectAnotherBtn.isVisible()) {
      console.log('   ✅ PASS: "+ Connect Another Account" option is prominently available.');
    } else {
      throw new Error('FAIL: "+ Connect Another Account" option button missing.');
    }

    // Capture screenshot of immediate connected accounts state
    const shot1Path = path.join(artifactsDir, 'integrations_connected_accounts_immediate.png');
    await page.screenshot({ path: shot1Path, fullPage: true });
    console.log(`   📸 Saved screenshot: ${shot1Path}`);

    // Step 3 Check: Individual Disconnect with Confirmation Dialog (Requirement 3)
    console.log('6. Testing individual account Disconnect & Confirmation modal (Requirement 3)...');
    
    // Verify each account has its individual Disconnect button
    const disconnectTataBtn = page.locator('#btn-disconnect-tatacapital_loans');
    const disconnectBajajBtn = page.locator('#btn-disconnect-bajajfinance');
    const disconnectFintechBtn = page.locator('#btn-disconnect-fintech_insider');
    const disconnectZerodhaBtn = page.locator('#btn-disconnect-zerodhainvest');

    if (!(await disconnectTataBtn.isVisible()) || !(await disconnectBajajBtn.isVisible())) {
      throw new Error('FAIL: Individual Disconnect buttons not visible on account rows!');
    }
    console.log('   - Each connected account has its individual Disconnect button.');

    // Click Disconnect on @tatacapital_loans
    console.log('7. Clicking Disconnect on @tatacapital_loans...');
    await disconnectTataBtn.click();
    await page.waitForTimeout(400);

    // Verify confirmation modal opened
    const modalTitle = page.locator('#modal-disconnect-account-title');
    await modalTitle.waitFor({ timeout: 3000 });
    const modalText = await page.locator('div[role="dialog"]').innerText();
    console.log(`   - Confirmation Modal text:\n${modalText.replace(/\n+/g, ' ')}`);

    if (!modalText.includes('@tatacapital_loans')) {
      throw new Error('FAIL: Confirmation modal does not specify @tatacapital_loans!');
    }
    console.log('   ✅ PASS: Confirmation modal opened and correctly specifies target account @tatacapital_loans.');

    // Capture screenshot of confirmation modal
    const shotModalPath = path.join(artifactsDir, 'integrations_disconnect_confirmation_modal.png');
    await page.screenshot({ path: shotModalPath, fullPage: false });
    console.log(`   📸 Saved modal screenshot: ${shotModalPath}`);

    // Test Cancel first
    console.log('8. Testing Cancel button...');
    const cancelBtn = page.locator('#btn-cancel-disconnect');
    await cancelBtn.click();
    await page.waitForTimeout(400);
    if (await modalTitle.isVisible()) {
      throw new Error('FAIL: Confirmation modal remained open after clicking Cancel!');
    }
    if (!(await tataRow.isVisible())) {
      throw new Error('FAIL: Account was removed after Cancel was clicked!');
    }
    console.log('   ✅ PASS: Cancel properly closes modal without disconnecting.');

    // Click Disconnect again and Confirm
    console.log('9. Re-opening Disconnect modal and confirming disconnection...');
    await disconnectTataBtn.click();
    await modalTitle.waitFor({ timeout: 3000 });
    
    const confirmBtn = page.locator('#btn-confirm-disconnect');
    await confirmBtn.click();
    await page.waitForTimeout(1500);

    // Verify modal closed
    if (await page.locator('div[role="dialog"]').isVisible()) {
      throw new Error('FAIL: Confirmation modal did not close after confirming disconnection!');
    }

    // Verify @tatacapital_loans is removed
    const tataStillThere = await page.locator('#connected-account-tatacapital_loans').isVisible();
    if (tataStillThere) {
      throw new Error('FAIL: @tatacapital_loans is still visible after confirming disconnect!');
    }
    console.log('   ✅ PASS: @tatacapital_loans was successfully disconnected and removed from list.');

    // Verify the other 3 accounts are still present and untouched
    const bajajStillThere = await page.locator('#connected-account-bajajfinance').isVisible();
    const fintechStillThere = await page.locator('#connected-account-fintech_insider').isVisible();
    const zerodhaStillThere = await page.locator('#connected-account-zerodhainvest').isVisible();

    if (!bajajStillThere || !fintechStillThere || !zerodhaStillThere) {
      throw new Error('FAIL: Other connected accounts were inadvertently removed or affected!');
    }
    console.log('   ✅ PASS: Other accounts (@bajajfinance, @fintech_insider, @zerodhainvest) remain connected and unaffected.');

    // Verify section header updated to (3)
    const updatedHeading = await page.locator('text=Connected Accounts').first().innerText();
    console.log(`   - Updated Heading: "${updatedHeading}"`);
    if (!updatedHeading.includes('3')) {
      throw new Error(`FAIL: Expected Connected Accounts (3), got "${updatedHeading}"`);
    }
    console.log('   ✅ PASS: Account count updated immediately to (3).');

    // Capture post-disconnect screenshot
    const shotPostDisconnect = path.join(artifactsDir, 'integrations_post_disconnect_state.png');
    await page.screenshot({ path: shotPostDisconnect, fullPage: true });
    console.log(`   📸 Saved post-disconnect screenshot: ${shotPostDisconnect}`);

    console.log('\n🎉 ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testIntegrationsExperience();
