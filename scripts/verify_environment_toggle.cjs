const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyEnvironmentToggle() {
  console.log('🚀 Starting Environment Toggle & Demo Isolation Verification...');
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const report = {
    demoModeActive: false,
    liveModeActive: false,
    demoIsolatedInLive: false,
    modalLiveBannerShown: false,
    settingsCardWorked: false,
    restoredDemoSuccessfully: false
  };

  try {
    // 1. Initial Load in Demo Mode
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);

    // Verify demo toggle exists
    const demoButton = page.locator('#btn-toggle-demo-mode');
    report.demoModeActive = (await demoButton.count()) > 0;
    console.log(`   - Demo Sandbox button present: ${report.demoModeActive}`);

    // Verify @bajajfinance is present in Demo mode
    const bajajHandle = page.locator('text=@bajajfinance');
    const hasBajajInDemo = (await bajajHandle.count()) > 0;
    console.log(`   - @bajajfinance visible in Demo mode: ${hasBajajInDemo}`);

    await page.screenshot({ path: path.join(artifactsDir, 'env_demo_sandbox_active.png') });
    console.log('   📸 Captured: env_demo_sandbox_active.png');

    // 2. Toggle to Live Production Mode
    console.log('2. Clicking Live Production toggle (#btn-toggle-live-mode)...');
    await page.click('#btn-toggle-live-mode');
    await page.waitForTimeout(1000);

    // Verify Live Production button is active
    const liveButton = page.locator('#btn-toggle-live-mode');
    const liveClass = await liveButton.getAttribute('class');
    const isLiveActive = liveClass && (liveClass.includes('text-emerald') || liveClass.includes('bg-emerald'));
    report.liveModeActive = !!isLiveActive;
    console.log(`   - Live Production active state: ${isLiveActive}`);

    // Verify @bajajfinance is NOT visible anywhere in Live mode
    const bajajInLive = page.locator('text=@bajajfinance');
    const bajajCountInLive = await bajajInLive.count();
    report.demoIsolatedInLive = bajajCountInLive === 0;
    console.log(`   - Demo @bajajfinance count in Live mode: ${bajajCountInLive} (isolated: ${report.demoIsolatedInLive})`);

    await page.screenshot({ path: path.join(artifactsDir, 'env_live_production_active.png') });
    console.log('   📸 Captured: env_live_production_active.png');

    // 3. Check Live Modal Behavior
    console.log('3. Opening Instagram connection modal in Live mode...');
    // Look for switcher or add page button
    const switcher = page.locator('#btn-instagram-page-switcher');
    if ((await switcher.count()) > 0) {
      await switcher.first().click();
      await page.waitForTimeout(400);
      const addBtn = page.locator('text=+ Add Instagram Page, text=Connect Another Account, text=Add Page');
      if ((await addBtn.count()) > 0) {
        await addBtn.first().click();
        await page.waitForTimeout(600);
      }
    } else {
      const liveConnectBtn = page.locator('#btn-live-connect-instagram');
      if ((await liveConnectBtn.count()) > 0) {
        await liveConnectBtn.first().click();
        await page.waitForTimeout(600);
      }
    }

    const liveBanner = page.locator('text=Live Production Mode:');
    report.modalLiveBannerShown = (await liveBanner.count()) > 0;
    console.log(`   - Modal shows Live Production Mode banner: ${report.modalLiveBannerShown}`);

    await page.screenshot({ path: path.join(artifactsDir, 'env_modal_live_mode.png') });
    console.log('   📸 Captured: env_modal_live_mode.png');

    // Close modal if open
    const closeBtn = page.locator('button[title="Close Window"], button:has-text("×")');
    if ((await closeBtn.count()) > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(500);
    }

    // 4. Test Settings Card Toggle
    console.log('4. Navigating to Settings > General to inspect Environment Card...');
    await page.click('#nav-settings');
    await page.waitForSelector('#unified-settings-page', { timeout: 5000 });
    await page.click('#tab-settings-general');
    await page.waitForTimeout(500);

    const cardToggle = page.locator('#btn-env-demo-card, #btn-env-live-card');
    report.settingsCardWorked = (await cardToggle.count()) > 0;
    console.log(`   - General Settings Environment Card present: ${report.settingsCardWorked}`);

    await page.screenshot({ path: path.join(artifactsDir, 'env_settings_card.png') });
    console.log('   📸 Captured: env_settings_card.png');

    // 5. Switch back to Demo Sandbox from settings
    console.log('5. Switching back to Demo Sandbox via settings card (#btn-env-demo-card)...');
    await page.click('#btn-env-demo-card');
    await page.waitForTimeout(800);

    // Return to Content & Audit view
    await page.click('button:has-text("Back to Content & Audit")');
    await page.waitForTimeout(1000);

    const bajajRestored = page.locator('text=@bajajfinance');
    report.restoredDemoSuccessfully = (await bajajRestored.count()) > 0;
    console.log(`   - @bajajfinance restored in Demo Sandbox: ${report.restoredDemoSuccessfully}`);

    await page.screenshot({ path: path.join(artifactsDir, 'env_demo_sandbox_restored.png') });
    console.log('   📸 Captured: env_demo_sandbox_restored.png');

    console.log('\n🎯 Final Verification Summary:');
    console.log(JSON.stringify(report, null, 2));

    fs.writeFileSync(
      path.join(artifactsDir, 'environment_verification_report.json'),
      JSON.stringify(report, null, 2)
    );
  } catch (err) {
    console.error('❌ Verification failed with error:', err);
    await page.screenshot({ path: path.join(artifactsDir, 'env_verification_error.png') });
  } finally {
    await browser.close();
  }
}

verifyEnvironmentToggle();
