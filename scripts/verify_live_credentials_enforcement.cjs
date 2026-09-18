const { chromium } = require('playwright');
const path = require('path');

async function testLiveCredentialsEnforcement() {
  console.log('🧪 Starting Verification: Live Production Mode Credentials & Sandbox Isolation...');

  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Backend Direct API Verification
    console.log('\n--- 1. Testing Backend Live Enforcement Endpoints ---');

    // Test A: Calling simulated crawler in Live Production mode must be rejected with 400
    const liveCrawlRes = await fetch('http://localhost:3000/api/instagram/accounts/connect-manus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'manus_browser_crawl',
        username: 'randomfakeuser123',
        isDemo: false
      })
    });
    const liveCrawlJson = await liveCrawlRes.json();
    assert(liveCrawlRes.status === 400, 'Backend rejects simulated browser crawl in Live Production mode with HTTP 400');
    assert(liveCrawlJson.error && liveCrawlJson.error.includes('Live Production mode requires an authentic Meta Graph API Access Token'), 
      'Backend returns expected live enforcement error message');
    console.log(`   - Backend Error: "${liveCrawlJson.error}"`);

    // Test B: Calling simulated login in Live Production mode must be rejected with 400
    const liveLoginRes = await fetch('http://localhost:3000/api/instagram/accounts/connect-manus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'manus_instagram_login',
        username: 'randomfakeuser123',
        password: 'fakepassword',
        isDemo: false
      })
    });
    const liveLoginJson = await liveLoginRes.json();
    assert(liveLoginRes.status === 400, 'Backend rejects simulated login in Live Production mode with HTTP 400');

    // Test C: Calling with placeholder token in Live mode must be rejected
    const placeholderTokenRes = await fetch('http://localhost:3000/api/instagram/accounts/connect-manus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'meta_graph_api',
        username: 'fakeuser',
        metaAccessToken: 'EAAGNO4m...placeholder',
        isDemo: false
      })
    });
    const placeholderJson = await placeholderTokenRes.json();
    assert(placeholderTokenRes.status === 400, 'Backend rejects placeholder token in Live mode with HTTP 400');

    // Test D: Live accounts query must NOT contain fake account or demo accounts
    const liveAccountsRes = await fetch('http://localhost:3000/api/instagram/accounts?environment=live');
    const liveAccountsJson = await liveAccountsRes.json();
    const liveAccounts = liveAccountsJson.accounts || [];
    assert(!liveAccounts.some(a => a.username === 'sachinsachinsachin'), 'Fake account @sachinsachinsachin is NOT in live accounts');
    console.log(`   - Current Live Accounts count: ${liveAccounts.length}`);

    // 2. UI Verification in Live Production Mode
    console.log('\n--- 2. UI Verification in Live Production Mode ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Switch environment to Live Production via pill
    console.log('   - Switching to Live Production mode in UI...');
    const liveBtn = page.locator('#btn-toggle-live-mode');
    if (await liveBtn.isVisible()) {
      await liveBtn.click();
      await page.waitForTimeout(1000);
    }

    // Open Connect Modal in Live Mode
    console.log('   - Opening Instagram Connect Modal in Live Mode...');
    const liveConnectHeroBtn = page.locator('#btn-live-connect-instagram');
    const pageSwitcherBtn = page.locator('#btn-instagram-page-switcher');

    if (await liveConnectHeroBtn.isVisible()) {
      await liveConnectHeroBtn.click();
      await page.waitForTimeout(1000);
    } else if (await pageSwitcherBtn.isVisible()) {
      await pageSwitcherBtn.click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Connect Instagram Page")').click();
      await page.waitForTimeout(1000);
    }

    // Check modal contents in Live mode
    const modal = page.locator('#manus-connect-modal');
    assert(await modal.isVisible(), 'Instagram Connect Modal is opened in Live Mode');

    const modalText = await modal.innerText();
    assert(modalText.includes('Meta Graph API v20.0') && modalText.includes('Live Mode Required'), 
      'Modal tab switcher locked to "Meta Graph API v20.0 (Live Mode Required)" in Live Production');
    assert(modalText.includes('Live Production Mode:') || modalText.includes('Live Production Enforcement:'), 
      'Modal displays Live Production credential enforcement banner');
    assert(!modalText.includes('Autonomous Headless Login') && !modalText.includes('Public Profile Crawl'),
      'Simulated browser tabs (Login, Crawl) are completely hidden/locked in Live Production');

    const screenshot1 = path.join(artifactsDir, '09_live_mode_connect_modal_locked.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot1}`);

    // Close modal via close button
    const closeBtn = page.locator('#manus-connect-modal button[title="Close Window"], #manus-connect-modal button:has(svg.lucide-x)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // 3. UI Verification in Demo Sandbox Mode
    console.log('\n--- 3. UI Verification in Demo Sandbox Mode ---');
    const demoBtn = page.locator('#btn-toggle-demo-mode');
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(1000);
    }

    // Open Connect Modal in Demo Mode
    console.log('   - Opening Instagram Connect Modal in Demo Mode...');
    if (await pageSwitcherBtn.isVisible()) {
      await pageSwitcherBtn.click();
      await page.waitForTimeout(500);
      await page.locator('button:has-text("Connect Instagram Page")').click();
      await page.waitForTimeout(1000);
    } else if (await page.locator('#btn-switch-to-demo').isVisible()) {
      // fallback
      await page.locator('#btn-switch-to-demo').click();
      await page.waitForTimeout(1000);
    }

    const demoModal = page.locator('#manus-connect-modal');
    assert(await demoModal.isVisible(), 'Instagram Connect Modal is opened in Demo Mode');

    const demoModalText = await demoModal.innerText();
    assert(demoModalText.includes('Demo Sandbox Mode:') || demoModalText.includes('Sandbox Safe'), 
      'Demo Sandbox banner displayed when in Demo mode');
    assert(demoModalText.includes('Login') && demoModalText.includes('Public Crawl'), 
      'Simulated browser tabs (Login, Public Crawl) are available in Demo Sandbox mode');

    const screenshot2 = path.join(artifactsDir, '10_demo_mode_connect_modal_unlocked.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot2}`);

    console.log(`\n🎉 ALL TESTS PASSED! (${passed}/${total} assertions verified)`);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    await page.screenshot({ path: path.join(artifactsDir, 'error_credentials_test.png'), fullPage: true });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testLiveCredentialsEnforcement();
