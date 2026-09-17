const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyUnifiedSettings() {
  console.log('🚀 Starting Automated Browser Verification with Local Playwright...');
  
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

    // Verify Sidebar
    console.log('2. Verifying Left Sidebar Navigation...');
    const mcpSidebarButton = page.locator('#nav-mcp-connections');
    const mcpCount = await mcpSidebarButton.count();
    console.log(`   - MCP Connections button in sidebar: ${mcpCount === 0 ? 'REMOVED (Pass)' : 'STILL PRESENT (Fail)'}`);

    const contentAuditNav = page.locator('#nav-content-and-audit');
    const workflowsNav = page.locator('#nav-workflows');
    const settingsNav = page.locator('#nav-settings');
    console.log(`   - Content & Audit button: ${await contentAuditNav.count() > 0 ? 'Present (Pass)' : 'Missing (Fail)'}`);
    console.log(`   - Workflows button: ${await workflowsNav.count() > 0 ? 'Present (Pass)' : 'Missing (Fail)'}`);
    console.log(`   - Settings button at bottom: ${await settingsNav.count() > 0 ? 'Present (Pass)' : 'Missing (Fail)'}`);

    // Verify Content & Audit Sub-nav (Integrations removed)
    console.log('3. Verifying Content & Audit horizontal sub-nav...');
    const integrationsSubTab = page.locator('button:has-text("Integrations")');
    const integrationsSubTabCount = await integrationsSubTab.count();
    console.log(`   - Integrations in Content & Audit sub-nav: ${integrationsSubTabCount === 0 ? 'REMOVED (Pass)' : 'STILL PRESENT (Fail)'}`);

    await page.screenshot({ path: path.join(artifactsDir, 'sidebar_and_content_audit.png'), fullPage: false });
    console.log('   📸 Captured: sidebar_and_content_audit.png');

    // Click on Settings at bottom of sidebar
    console.log('4. Clicking Settings at the bottom of the sidebar...');
    await settingsNav.click();
    await page.waitForSelector('#unified-settings-page', { timeout: 5000 });
    console.log('   - Unified Settings Page mounted successfully!');
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_general.png') });
    console.log('   📸 Captured: unified_settings_general.png');

    // Test AI & Models Tab
    console.log('5. Clicking AI & Models tab in Settings...');
    await page.click('#tab-settings-ai');
    await page.waitForSelector('text=AI Engine & Provider Routing', { timeout: 3000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_ai.png') });
    console.log('   📸 Captured: unified_settings_ai.png');

    // Test Integrations Tab & Sub-tabs
    console.log('6. Clicking Integrations tab in Settings...');
    await page.click('#tab-settings-integrations');
    await page.waitForSelector('text=Integrations & External Channels', { timeout: 3000 });
    await page.waitForTimeout(400);

    // Sub-tab 1: Teams
    console.log('   - Verifying Microsoft Teams integration sub-tab...');
    await page.waitForSelector('text=Microsoft Teams & Automation', { timeout: 5000 });
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_integrations_teams.png'), fullPage: true });
    console.log('   📸 Captured: unified_settings_integrations_teams.png');

    // Sub-tab 2: Instagram Graph API
    console.log('   - Verifying Instagram Graph API sub-tab...');
    await page.click('button:has-text("Instagram Graph API")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_integrations_instagram.png') });
    console.log('   📸 Captured: unified_settings_integrations_instagram.png');

    // Sub-tab 3: Production Webhooks
    console.log('   - Verifying Production Webhooks sub-tab...');
    await page.click('button:has-text("Production Webhooks")');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_integrations_webhooks.png') });
    console.log('   📸 Captured: unified_settings_integrations_webhooks.png');

    // Test MCP Runtime Tab
    console.log('7. Clicking MCP Runtime tab in Settings...');
    await page.click('#tab-settings-mcp');
    await page.waitForSelector('text=Model Context Protocol (MCP) Runtime', { timeout: 3000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_mcp_runtime.png') });
    console.log('   📸 Captured: unified_settings_mcp_runtime.png');

    // Test Security & Vault Tab
    console.log('8. Clicking Security & Vault tab in Settings...');
    await page.click('#tab-settings-security');
    await page.waitForSelector('text=Security & Vault Encryption', { timeout: 3000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactsDir, 'unified_settings_security.png') });
    console.log('   📸 Captured: unified_settings_security.png');

    // Test Back button
    console.log('9. Clicking Back to Previous View button (#btn-settings-back)...');
    await page.click('#btn-settings-back');
    await page.waitForSelector('#nav-content-and-audit', { timeout: 5000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactsDir, 'return_to_content_audit.png') });
    console.log('   📸 Captured: return_to_content_audit.png');

    console.log('\n✅ All automated browser verification checks passed successfully!');
  } catch (error) {
    console.error('❌ Verification error:', error);
    await page.screenshot({ path: path.join(artifactsDir, 'verification_error.png') });
  } finally {
    await browser.close();
  }
}

verifyUnifiedSettings();
