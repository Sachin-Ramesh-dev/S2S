const { chromium } = require('playwright');
const path = require('path');

async function testS2SArchitecture() {
  console.log('🧪 Starting Verification: S2S 7-Domain Architecture & Meta OAuth Connector...');

  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  let passed = 0;
  let total = 0;

  page.on('pageerror', (err) => console.log('🔴 PAGE ERROR:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('🔴 BROWSER ERROR:', msg.text());
  });

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
    // 1. Boot Application and Verify Home Hub
    console.log('\n--- 1. Testing Home Hub Booting & KPIs ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const homeHub = page.locator('#s2s-home-hub');
    assert(await homeHub.isVisible(), 'Application boots into S2S Home Hub landing page');

    const bodyText = await page.locator('body').innerText();
    assert(bodyText.includes('Enterprise Social Intelligence & Autonomous Workflows'), 'Home Hub hero banner rendered');
    assert(bodyText.includes('Account Health Score'), 'KPI: Health Score rendered');
    assert(bodyText.includes('Audience Reach'), 'KPI: Audience Reach rendered');
    assert(bodyText.includes('4-Act Viral Scripts'), 'KPI: 4-Act Viral Scripts rendered');
    assert(bodyText.includes('Scheduled at 18:30'), 'KPI: Scheduled at 18:30 rendered');

    // Verify 7 Domain Cards
    const domains = ['strategy', 'content', 'workflows', 'publishing', 'intelligence', 'collaboration', 'settings'];
    for (const d of domains) {
      const card = page.locator(`#card-domain-${d}`);
      assert(await card.isVisible(), `Home Hub displays Domain Card for: ${d}`);
    }

    const shotHome = path.join(artifactsDir, '11_s2s_home_hub.png');
    await page.screenshot({ path: shotHome, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotHome}`);

    // 2. Test Strategy Domain & Sub-views
    console.log('\n--- 2. Testing 🧠 Strategy Domain Navigation ---');
    await page.locator('#nav-domain-strategy').click();
    await page.waitForTimeout(600);

    // Audit Subview
    assert(await page.locator('#subnav-strategy-audit').isVisible(), 'Strategy sub-nav shows Page Audit');
    
    // Competitors Subview
    await page.locator('#subnav-strategy-competitors').click();
    await page.waitForTimeout(600);
    const compText = await page.locator('body').innerText();
    assert(compText.includes('Competitor Intelligence & Benchmarks'), 'Competitors sub-view loaded successfully');
    assert(compText.includes('@techcrunch'), 'Competitor benchmark data displayed');

    // Opportunities Subview
    await page.locator('#subnav-strategy-opportunities').click();
    await page.waitForTimeout(600);
    const oppText = await page.locator('body').innerText();
    assert(oppText.includes('AI Content Opportunities & Pillar Deficits'), 'Opportunities sub-view loaded successfully');

    const shotStrategy = path.join(artifactsDir, '12_strategy_workspace.png');
    await page.screenshot({ path: shotStrategy, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotStrategy}`);

    // 3. Test Content Domain & Sub-views
    console.log('\n--- 3. Testing ✍️ Content Domain Navigation ---');
    await page.locator('#nav-domain-content').click();
    await page.waitForTimeout(600);

    // Topics Subview
    assert(await page.locator('#subnav-content-topics').isVisible(), 'Content sub-nav shows Topics');

    // Scripts Subview
    await page.locator('#subnav-content-scripts').click();
    await page.waitForTimeout(600);
    const scriptText = await page.locator('body').innerText();
    assert(scriptText.includes('Viral Retention Score') || scriptText.includes('4-Act') || scriptText.includes('Script Studio'), 
      'Scripts 4-act viral retention studio loaded');

    // Creative Subview
    await page.locator('#subnav-content-creative').click();
    await page.waitForTimeout(600);
    const creativeText = await page.locator('body').innerText();
    assert(creativeText.includes('Carousel & Visual Storyboard Creator'), 'Creative sub-view loaded');

    // Repurpose Subview
    await page.locator('#subnav-content-repurpose').click();
    await page.waitForTimeout(600);
    const repurposeText = await page.locator('body').innerText();
    assert(repurposeText.includes('Cross-Platform Content Repurposing Engine'), 'Repurpose sub-view loaded');

    const shotContent = path.join(artifactsDir, '13_content_workspace.png');
    await page.screenshot({ path: shotContent, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotContent}`);

    // 4. Test Publishing Domain
    console.log('\n--- 4. Testing 📅 Publishing Domain Navigation ---');
    await page.locator('#nav-domain-publishing').click();
    await page.waitForTimeout(600);

    // Calendar Subview
    assert(await page.locator('#subnav-publishing-calendar').isVisible(), 'Publishing sub-nav shows Calendar');

    // Campaigns Subview
    await page.locator('#subnav-publishing-campaigns').click();
    await page.waitForTimeout(600);
    const campText = await page.locator('body').innerText();
    assert(campText.includes('Multi-Post Growth Campaigns'), 'Campaigns sub-view loaded');

    // Scheduler Subview
    await page.locator('#subnav-publishing-scheduler').click();
    await page.waitForTimeout(600);
    const schedText = await page.locator('body').innerText();
    assert(schedText.includes('Publishing Cadence & Peak Time Queue'), 'Scheduler sub-view loaded');

    const shotPublishing = path.join(artifactsDir, '15_publishing_workspace.png');
    await page.screenshot({ path: shotPublishing, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotPublishing}`);

    // 5. Test Intelligence Domain
    console.log('\n--- 5. Testing 📊 Intelligence Domain Navigation ---');
    await page.locator('#nav-domain-intelligence').click();
    await page.waitForTimeout(600);

    const intelText = await page.locator('body').innerText();
    assert(intelText.includes('Account Analytics & Velocity'), 'Intelligence Analytics view loaded');

    await page.locator('#subnav-intelligence-performance').click();
    await page.waitForTimeout(600);
    const perfText = await page.locator('body').innerText();
    assert(perfText.includes('4-Act Hook Retention Diagnostics'), 'Retention diagnostics curve loaded');

    const shotIntel = path.join(artifactsDir, '16_intelligence_workspace.png');
    await page.screenshot({ path: shotIntel, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotIntel}`);

    // 6. Test Collaboration Domain
    console.log('\n--- 6. Testing 👥 Collaboration Domain Navigation ---');
    await page.locator('#nav-domain-collaboration').click();
    await page.waitForTimeout(600);

    const collabText = await page.locator('body').innerText();
    assert(collabText.includes('Editorial Sign-Off Queue'), 'Collaboration Approvals queue loaded');

    await page.locator('#subnav-collaboration-team').click();
    await page.waitForTimeout(600);
    const teamText = await page.locator('body').innerText();
    assert(teamText.includes('Workspace Team & Permissions'), 'Team permissions view loaded');

    const shotCollab = path.join(artifactsDir, '17_collaboration_workspace.png');
    await page.screenshot({ path: shotCollab, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotCollab}`);

    // 7. Test Upgraded Meta OAuth & Token Auto-Discovery Modal
    console.log('\n--- 7. Testing Meta OAuth & Token Auto-Discovery Modal ---');
    // Open modal from top header dropdown
    await page.locator('#btn-instagram-page-switcher').click();
    await page.waitForTimeout(400);
    await page.locator('#btn-dropdown-connect-page').click();
    await page.waitForTimeout(800);

    const modal = page.locator('#manus-connect-modal');
    assert(await modal.isVisible(), 'Connect Instagram Modal is open');

    const modalText = await modal.innerText();
    assert(modalText.includes('Log in with Instagram (Meta OAuth)'), 'Modal has Tab 1: Meta OAuth 2.0');
    assert(modalText.includes('Meta Graph API Key (Auto-Detect)'), 'Modal has Tab 2: Meta Graph API Key');
    assert(modalText.includes('Step-by-Step Meta Developer App Setup Guide'), 'Modal includes Meta Developer App Setup Guide');

    // Switch to Token Auto-Discovery tab
    await page.locator('button:has-text("Meta Graph API Key (Auto-Detect)")').click();
    await page.waitForTimeout(500);

    const tokenInput = page.locator('#input-modal-meta-token');
    assert(await tokenInput.isVisible(), 'Meta Graph Access Token input is visible');
    await tokenInput.fill('EAAGNO4m...98fKq7L3x0ZBa902k');

    const inspectBtn = page.locator('#btn-inspect-token');
    await inspectBtn.click();
    await page.waitForTimeout(1000);

    const inspectedText = await modal.innerText();
    assert(inspectedText.includes('Detected') && inspectedText.includes('Instagram Account'), 
      'Token Auto-Discovery successfully detected accounts from token');

    const shotModal = path.join(artifactsDir, '18_upgraded_connect_modal.png');
    await page.screenshot({ path: shotModal, fullPage: false });
    console.log(`   📸 Captured screenshot: ${shotModal}`);

    // Close modal
    await page.locator('button[title="Close Window"]').click();
    await page.waitForTimeout(500);

    // Return to Home Hub
    console.log('\n--- 8. Testing Return to Home Hub ---');
    await page.locator('#nav-home').click();
    await page.waitForTimeout(500);
    assert(await homeHub.isVisible(), 'Successfully returned to Home Hub via sidebar');

    console.log(`\n🎉 ALL TESTS PASSED! (${passed}/${total} assertions verified)`);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    await page.screenshot({ path: path.join(artifactsDir, 'error_architecture_test.png'), fullPage: true });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testS2SArchitecture();
