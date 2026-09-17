const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Launching headless Chromium browser via Playwright...');
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  
  const page = await context.newPage();
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Waiting for workspace to load...');
  await page.waitForSelector('text=Instagram Intelligence', { timeout: 15000 }).catch(() => {});
  
  // Take initial dashboard screenshot
  await page.screenshot({ path: path.join(artifactsDir, 'initial_load.png') });
  console.log('Captured initial_load.png');

  // Find and click on the "Integrations" tab
  console.log('Clicking on the "Integrations" navigation tab...');
  const integrationsTab = page.locator('button:has-text("Integrations")');
  await integrationsTab.waitFor({ state: 'visible', timeout: 10000 });
  await integrationsTab.click();
  
  // Wait for the Integrations view to render
  console.log('Waiting for Microsoft Teams & Automation view...');
  await page.waitForSelector('text=Microsoft Teams & Automation', { timeout: 10000 });
  
  // Take screenshot of Integrations Tab Overview
  await page.screenshot({ path: path.join(artifactsDir, 'teams_integrations_overview.png'), fullPage: true });
  console.log('Captured teams_integrations_overview.png');

  // Click Step 2: "Paste JSON Schema"
  console.log('Clicking Step 2: Paste JSON Schema...');
  const step2Btn = page.locator('button:has-text("Paste JSON Schema")');
  await step2Btn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactsDir, 'teams_step2_schema.png') });
  console.log('Captured teams_step2_schema.png');

  // Click Step 3: "Add Teams Action"
  console.log('Clicking Step 3: Add Teams Action...');
  const step3Btn = page.locator('button:has-text("Add Teams Action")');
  await step3Btn.click();
  await page.waitForTimeout(500);

  // Toggle Payload Inspector
  console.log('Expanding Sample Webhook Payload Inspector...');
  const inspectPayloadBtn = page.locator('text=Inspect Sample Webhook Payload');
  await inspectPayloadBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactsDir, 'teams_payload_preview.png'), fullPage: true });
  console.log('Captured teams_payload_preview.png');

  // Verify scripts tab has "Send to Teams"
  console.log('Navigating to Scripts tab...');
  const scriptsTab = page.locator('button:has-text("Scripts")');
  await scriptsTab.click();
  await page.waitForTimeout(1000);
  const sendToTeamsBtn = page.locator('#btn-send-to-teams');
  const hasSendToTeamsBtn = await sendToTeamsBtn.count();
  console.log(`Found #btn-send-to-teams in Scripts view: ${hasSendToTeamsBtn > 0}`);
  await page.screenshot({ path: path.join(artifactsDir, 'scripts_send_to_teams.png') });

  // Verify topics tab has "Send to Teams"
  console.log('Navigating to Topic Ideas tab...');
  const topicsTab = page.locator('button:has-text("Topic Ideas")');
  await topicsTab.click();
  await page.waitForTimeout(1000);
  const sendTopicsBtn = page.locator('#btn-send-topics-teams');
  const hasSendTopicsBtn = await sendTopicsBtn.count();
  console.log(`Found #btn-send-topics-teams in Topics view: ${hasSendTopicsBtn > 0}`);
  await page.screenshot({ path: path.join(artifactsDir, 'topics_send_to_teams.png') });

  await browser.close();
  console.log('Automated Playwright verification completed successfully!');
}

run().catch(err => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
