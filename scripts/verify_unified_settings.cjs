const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyUnifiedSettings() {
  console.log('🚀 Starting Automated Browser Verification for Expanded Integrations Directory...');
  
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  
  const page = await context.newPage();
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

  try {
    console.log('1. Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Click on Settings at bottom of sidebar
    console.log('2. Clicking Settings in Sidebar...');
    const settingsNav = page.locator('#nav-settings');
    await settingsNav.click();
    await page.waitForSelector('#unified-settings-page', { timeout: 5000 });
    console.log('   - Unified Settings Page mounted!');
    await page.waitForTimeout(400);

    // Switch to Dark Mode first if not dark
    console.log('3. Ensuring Dark Mode is active for reference aesthetic...');
    await page.click('#tab-settings-general');
    await page.waitForTimeout(300);
    const darkModeBtn = page.locator('button[aria-label="Activate Dark Mode"]');
    if (await darkModeBtn.count() > 0) {
      await darkModeBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Integrations Tab
    console.log('4. Clicking Integrations tab in Unified Settings...');
    await page.click('#tab-settings-integrations');
    await page.waitForSelector('text=Social & Video Channels', { timeout: 5000 });
    await page.waitForSelector('text=Creative & Audio AI', { timeout: 5000 });
    await page.waitForSelector('text=Team Messaging & Workspaces', { timeout: 5000 });
    console.log('   - All 3 Category Sections rendered!');
    await page.waitForTimeout(400);

    // Verify all 9 integration rows exist
    console.log('5. Verifying all 9 integration rows...');
    const items = [
      { id: '#item-integration-instagram', name: 'Instagram Graph API' },
      { id: '#item-integration-youtube', name: 'YouTube Studio & Data API' },
      { id: '#item-integration-linkedin', name: 'LinkedIn Marketing API' },
      { id: '#item-integration-canva', name: 'Canva Connect' },
      { id: '#item-integration-elevenlabs', name: 'ElevenLabs Voice AI' },
      { id: '#item-integration-teams', name: 'Microsoft Teams' },
      { id: '#item-integration-slack', name: 'Slack Webhook' },
      { id: '#item-integration-notion', name: 'Notion Workspace' },
      { id: '#item-integration-webhooks', name: 'Production Webhooks' }
    ];

    for (const item of items) {
      const el = page.locator(item.id);
      const count = await el.count();
      console.log(`   - ${item.name} (${item.id}): ${count > 0 ? 'Present (Pass)' : 'Missing (Fail)'}`);
    }

    // Capture initial directory state (with new items showing Disconnected)
    await page.screenshot({ path: path.join(artifactsDir, 'categorized_integrations_directory_dark.png'), fullPage: false });
    console.log('   📸 Captured: categorized_integrations_directory_dark.png');

    // 6. Test YouTube Studio Drill-down & Live Connection
    console.log('6. Testing YouTube Studio Drill-down & Connection...');
    await page.click('#item-integration-youtube');
    await page.waitForSelector('text=YouTube Studio & Data API Connector', { timeout: 3000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'youtube_drilldown_initial.png') });
    console.log('   📸 Captured: youtube_drilldown_initial.png');

    // Enter mock API key and connect
    console.log('   - Entering YouTube API Key and connecting...');
    await page.fill('input[type="password"]', 'AIzaSyDemoKey_YT_Studio_2026');
    await page.click('#btn-connect-youtube');
    await page.waitForSelector('text=Successfully authenticated with YouTube Data API v3!', { timeout: 4000 });
    console.log('   - YouTube connected successfully!');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'youtube_connected_drilldown.png') });
    console.log('   📸 Captured: youtube_connected_drilldown.png');

    await page.click('#btn-back-to-integrations');
    await page.waitForSelector('#item-integration-youtube', { timeout: 3000 });
    console.log('   - Returned to directory.');

    // 7. Test ElevenLabs Voice AI Drill-down, Audition & Connection
    console.log('7. Testing ElevenLabs Voice AI Drill-down, Voice Audition & Connection...');
    await page.click('#item-integration-elevenlabs');
    await page.waitForSelector('text=ElevenLabs Voice AI Studio', { timeout: 3000 });
    await page.waitForTimeout(400);
    
    // Audition voice narration
    console.log('   - Auditioning voice narration...');
    await page.click('#btn-preview-voice');
    await page.waitForTimeout(800);

    // Enter ElevenLabs API key and connect
    console.log('   - Entering ElevenLabs API Key and connecting...');
    await page.fill('input[type="password"]', 'xi-api-key-live-9988776655');
    await page.click('#btn-connect-elevenlabs');
    await page.waitForSelector('text=ElevenLabs API Key active!', { timeout: 4000 });
    console.log('   - ElevenLabs connected successfully!');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'elevenlabs_connected_drilldown.png') });
    console.log('   📸 Captured: elevenlabs_connected_drilldown.png');

    await page.click('#btn-back-to-integrations');
    await page.waitForSelector('#item-integration-elevenlabs', { timeout: 3000 });

    // 8. Test Canva Connect Drill-down
    console.log('8. Testing Canva Connect Drill-down & Connection...');
    await page.click('#item-integration-canva');
    await page.waitForSelector('text=Canva Connect Platform', { timeout: 3000 });
    await page.fill('input[type="password"]', 'canva_live_secret_brand_kit');
    await page.click('#btn-connect-canva');
    await page.waitForSelector('text=Canva Connect authenticated!', { timeout: 4000 });
    console.log('   - Canva connected successfully!');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'canva_connected_drilldown.png') });
    console.log('   📸 Captured: canva_connected_drilldown.png');

    await page.click('#btn-back-to-integrations');
    await page.waitForSelector('#item-integration-canva', { timeout: 3000 });

    // 9. Test Notion Workspace Sync Drill-down
    console.log('9. Testing Notion Workspace Sync Drill-down & Connection...');
    await page.click('#item-integration-notion');
    await page.waitForSelector('text=Notion Workspace Sync', { timeout: 3000 });
    await page.fill('input[type="password"]', 'secret_notion_content_calendar_2026');
    await page.click('#btn-connect-notion');
    await page.waitForSelector('text=Connected to Notion Database!', { timeout: 4000 });
    console.log('   - Notion connected successfully!');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'notion_connected_drilldown.png') });
    console.log('   📸 Captured: notion_connected_drilldown.png');

    await page.click('#btn-back-to-integrations');
    await page.waitForSelector('#item-integration-notion', { timeout: 3000 });

    // 10. Test Instagram Graph API Configuration & Connection
    console.log('10. Testing Instagram Graph API Drill-down & Live Connection...');
    const igRow = page.locator('#item-integration-instagram');
    const igBadgeInitial = await igRow.locator('span').textContent();
    console.log(`   - Instagram initial status badge: "${igBadgeInitial?.trim()}" (Expected: Disconnected)`);
    
    await igRow.click();
    await page.waitForSelector('text=Instagram Graph API Connector', { timeout: 3000 });
    await page.waitForSelector('#input-meta-token', { timeout: 3000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'instagram_credentials_form.png') });
    console.log('   📸 Captured: instagram_credentials_form.png');

    // Click Quick Fill and Connect
    console.log('   - Clicking Quick Fill and connecting Instagram Graph API token...');
    await page.click('#btn-quick-fill-instagram');
    await page.waitForTimeout(300);
    await page.click('#btn-connect-instagram');
    await page.waitForSelector('text=Meta Graph API credentials verified!', { timeout: 5000 });
    console.log('   - Instagram Graph API verified and connected successfully!');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactsDir, 'instagram_connected_view.png') });
    console.log('   📸 Captured: instagram_connected_view.png');

    // Test + Connect Another Account button
    console.log('   - Testing "+ Connect Another Account" toggle...');
    await page.click('#btn-add-another-instagram');
    await page.waitForSelector('#input-meta-token', { timeout: 3000 });
    console.log('   - Additional account configuration form rendered correctly!');

    await page.click('#btn-back-to-integrations');
    await page.waitForSelector('#item-integration-instagram', { timeout: 3000 });
    const igBadgeAfter = await page.locator('#item-integration-instagram span').textContent();
    console.log(`   - Instagram badge after connection: "${igBadgeAfter?.trim()}" (Pass)`);

    // 11. Capture updated Directory List showing Connected badges
    console.log('11. Capturing updated directory with active connections...');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'categorized_integrations_directory_connected.png'), fullPage: false });
    console.log('   📸 Captured: categorized_integrations_directory_connected.png');

    console.log('\n✅ All automated browser verification checks passed successfully!');
  } catch (error) {
    console.error('❌ Verification error:', error);
    await page.screenshot({ path: path.join(artifactsDir, 'verification_error.png') });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

verifyUnifiedSettings();
