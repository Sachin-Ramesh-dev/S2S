const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function checkManusModalFlow() {
  console.log('🚀 Checking "Or connect via Manus Browser Modal / OAuth"...');
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const report = {
    modalOpened: false,
    tabsFound: [],
    logsDrawerWorked: false,
    connectionSimulationWorked: false,
    accountSwitchedSuccessfully: false,
    details: []
  };

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);

    console.log('2. Opening Unified Settings > Integrations > Instagram...');
    await page.click('#nav-settings');
    await page.waitForSelector('#unified-settings-page', { timeout: 5000 });
    await page.click('#tab-settings-integrations');
    await page.waitForSelector('#item-integration-instagram', { timeout: 5000 });
    await page.click('#item-integration-instagram');
    await page.waitForSelector('#btn-open-instagram-modal', { timeout: 5000 });

    console.log('3. Clicking "Or connect via Manus Browser Modal / OAuth" (#btn-open-instagram-modal)...');
    await page.click('#btn-open-instagram-modal');
    await page.waitForTimeout(600);

    // Check if modal rendered
    const modalHeader = page.locator('text=Manus Cloud Browser');
    const modalVisible = (await modalHeader.count()) > 0;
    report.modalOpened = modalVisible;
    console.log(`   - Modal rendered visible: ${modalVisible}`);

    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_opened.png') });
    console.log('   📸 Captured: manus_modal_opened.png');

    // Inspect tabs
    console.log('4. Inspecting modal tabs...');
    const tabLabels = ['Login', 'Public Crawl', 'Graph API'];
    for (const label of tabLabels) {
      const tabEl = page.locator(`button:text-is("${label}")`);
      if ((await tabEl.count()) > 0) {
        report.tabsFound.push(label);
        console.log(`   - Found tab: "${label}"`);
      }
    }

    // Test "View Headless Logs" toggle
    console.log('5. Testing "View Headless Logs" toggle at bottom...');
    const logsToggle = page.locator('button:has-text("View Headless Logs")');
    if ((await logsToggle.count()) > 0) {
      await logsToggle.click();
      await page.waitForTimeout(300);
      report.logsDrawerWorked = true;
      console.log('   - Headless logs drawer opened!');
    }
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_tab1_logs.png') });
    console.log('   📸 Captured: manus_modal_tab1_logs.png');

    // Inspect Public Crawl tab
    console.log('6. Switching to "Public Crawl" tab...');
    await page.click('button:text-is("Public Crawl")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_tab2_crawl.png') });
    console.log('   📸 Captured: manus_modal_tab2_crawl.png');

    // Inspect Graph API tab
    console.log('7. Switching to "Graph API" tab...');
    await page.click('button:text-is("Graph API")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_tab3_graph.png') });
    console.log('   📸 Captured: manus_modal_tab3_graph.png');

    // Switch back to Login and test quick brand preset connection
    console.log('8. Testing Login with Brand Preset (tatacapital_loans)...');
    await page.click('button:text-is("Login")');
    await page.waitForTimeout(400);

    const presetBtn = page.locator('button:has-text("tatacapital_loans")');
    if ((await presetBtn.count()) > 0) {
      await presetBtn.click();
      console.log('   - Selected tatacapital_loans preset!');
    }

    // Submit connection via Log in
    console.log('9. Clicking "Log in" button...');
    await page.click('button[type="submit"]:has-text("Log in")');

    // Wait for connection stage
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_connecting_steps.png') });
    console.log('   📸 Captured: manus_modal_connecting_steps.png');

    // Wait for success screen
    console.log('10. Waiting for Manus sandbox authentication & account ingestion...');
    await page.waitForSelector('text=Successfully Authenticated via Manus', { timeout: 10000 });
    report.connectionSimulationWorked = true;
    console.log('   - Connection simulation completed successfully!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_success.png') });
    console.log('   📸 Captured: manus_modal_success.png');

    // Click completion button
    console.log('11. Clicking "Open Workspace with @tatacapital_loans"...');
    await page.click('button:has-text("Open Workspace with")');
    await page.waitForTimeout(800);

    // Verify modal closed and return to settings
    const modalAfter = await modalHeader.count();
    console.log(`   - Modal closed after completion: ${modalAfter === 0}`);

    await page.screenshot({ path: path.join(artifactsDir, 'settings_after_modal_connect.png') });
    console.log('   📸 Captured: settings_after_modal_connect.png');

    const activeProfileText = await page.locator('strong:has-text("@tatacapital_loans")').count();
    if (activeProfileText > 0) {
      report.accountSwitchedSuccessfully = true;
      console.log('   - Instagram active account successfully updated to @tatacapital_loans in Unified Settings!');
    }

    console.log('\n✅ Manus Browser Modal check completed successfully!');
    fs.writeFileSync(path.join(artifactsDir, 'manus_modal_report.json'), JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('❌ Error during Manus modal verification:', err);
    await page.screenshot({ path: path.join(artifactsDir, 'manus_modal_error.png') });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

checkManusModalFlow();
