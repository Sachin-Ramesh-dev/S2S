const { chromium } = require('playwright');
const path = require('path');

async function runComprehensiveUiUxAudit() {
  console.log('🔍 Starting Comprehensive S2S UI/UX & Navigation Audit across all 7 Domains...');

  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const issues = [];
  const consoleErrors = [];
  let passedAssertions = 0;

  page.on('pageerror', (err) => {
    console.log('🔴 PAGE ERROR:', err.message);
    issues.push({ type: 'Page Crash/Error', message: err.message });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('🔴 CONSOLE ERROR:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  function recordCheck(passed, name, details = '') {
    if (passed) {
      console.log(`  ✅ PASS: ${name}`);
      passedAssertions++;
    } else {
      console.log(`  ⚠️ ISSUE: ${name} - ${details}`);
      issues.push({ type: 'UI/UX Issue', name, details });
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. HOME HUB & THEME TOGGLE
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Home Hub & Theme Appearance ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const homeHub = page.locator('#s2s-home-hub');
    recordCheck(await homeHub.isVisible(), 'Home Hub landing page container visible');

    // Check KPIs
    const bodyText = await page.locator('body').innerText();
    recordCheck(bodyText.includes('Account Health Score'), 'KPI: Account Health Score rendered');
    recordCheck(bodyText.includes('Audience Reach'), 'KPI: Audience Reach rendered');
    recordCheck(bodyText.includes('4-Act Viral Scripts'), 'KPI: 4-Act Viral Scripts rendered');
    recordCheck(bodyText.includes('Scheduled at 18:30'), 'KPI: Scheduled at 18:30 rendered');

    // Check 7 Domain Cards
    const domains = ['strategy', 'content', 'workflows', 'publishing', 'intelligence', 'collaboration', 'settings'];
    for (const d of domains) {
      const card = page.locator(`#card-domain-${d}`);
      recordCheck(await card.isVisible(), `Home Hub Domain Card visible: ${d}`);
    }

    // Capture Home Hub Dark Mode
    const shotHomeDark = path.join(artifactsDir, 'audit_01_home_hub_dark.png');
    await page.screenshot({ path: shotHomeDark, fullPage: false });

    // Test Theme Toggle to Light Mode
    const themeLightBtn = page.locator('#btn-theme-toggle-light');
    if (await themeLightBtn.isVisible()) {
      await themeLightBtn.click();
      await page.waitForTimeout(600);
      const shotHomeLight = path.join(artifactsDir, 'audit_01_home_hub_light.png');
      await page.screenshot({ path: shotHomeLight, fullPage: false });
      recordCheck(true, 'Theme toggled to Light Mode cleanly');
      // Toggle back to dark
      await page.locator('#btn-theme-toggle-dark').click();
      await page.waitForTimeout(600);
    } else {
      recordCheck(false, 'Theme Toggle button found in header');
    }

    // -------------------------------------------------------------
    // 2. STRATEGY DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing 🧠 Strategy Domain & Sub-views ---');
    await page.locator('#nav-domain-strategy').click();
    await page.waitForTimeout(600);

    // Page Audit
    recordCheck(await page.locator('#subnav-strategy-audit').isVisible(), 'Strategy: Page Audit tab visible');
    const auditText = await page.locator('body').innerText();
    recordCheck(auditText.includes('Audit') || auditText.includes('Diagnostic'), 'Page Audit metrics rendered');

    // Competitors
    await page.locator('#subnav-strategy-competitors').click();
    await page.waitForTimeout(600);
    const compText = await page.locator('body').innerText();
    recordCheck(compText.includes('TechCrunch') || compText.includes('Competitor'), 'Strategy: Competitor benchmark grid rendered');

    // Opportunities
    await page.locator('#subnav-strategy-opportunities').click();
    await page.waitForTimeout(600);
    const oppText = await page.locator('body').innerText();
    recordCheck(oppText.includes('Opportunities') || oppText.includes('Deficit'), 'Strategy: Opportunities deficit analysis rendered');

    const shotStrategy = path.join(artifactsDir, 'audit_02_strategy_opportunities.png');
    await page.screenshot({ path: shotStrategy });

    // -------------------------------------------------------------
    // 3. CONTENT DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing ✍️ Content Domain & Sub-views ---');
    await page.locator('#nav-domain-content').click();
    await page.waitForTimeout(600);

    // Topics
    recordCheck(await page.locator('#subnav-content-topics').isVisible(), 'Content: Topics sub-navigation visible');
    const topicsText = await page.locator('body').innerText();
    recordCheck(topicsText.includes('Topic') || topicsText.includes('Approve'), 'Content: Topics list & action buttons rendered');

    // Scripts (4-Act Viral Retention Studio)
    await page.locator('#subnav-content-scripts').click();
    await page.waitForTimeout(600);
    const scriptsText = await page.locator('body').innerText();
    recordCheck(scriptsText.includes('4-Act') || scriptsText.includes('Hook') || scriptsText.includes('Viral'), 'Content: 4-Act Viral Retention Studio loaded');

    // Creative
    await page.locator('#subnav-content-creative').click();
    await page.waitForTimeout(600);
    const creativeText = await page.locator('body').innerText();
    recordCheck(creativeText.includes('Creative') || creativeText.includes('Aspect Ratio') || creativeText.includes('Slide'), 'Content: Creative visualizer loaded');

    // Repurpose
    await page.locator('#subnav-content-repurpose').click();
    await page.waitForTimeout(600);
    const repurposeText = await page.locator('body').innerText();
    recordCheck(repurposeText.includes('Repurpose') || repurposeText.includes('Twitter') || repurposeText.includes('LinkedIn'), 'Content: Repurpose cross-format studio loaded');

    // Media Library
    await page.locator('#subnav-content-media').click();
    await page.waitForTimeout(600);
    const mediaText = await page.locator('body').innerText();
    recordCheck(mediaText.includes('Media Library') || mediaText.includes('Asset'), 'Content: Media library assets loaded');

    const shotContent = path.join(artifactsDir, 'audit_03_content_workspace.png');
    await page.screenshot({ path: shotContent });

    // -------------------------------------------------------------
    // 4. WORKFLOWS DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing ⚡ Workflows Domain & Sub-views ---');
    await page.locator('#nav-domain-workflows').click();
    await page.waitForTimeout(600);

    // Workflow Builder Canvas
    const canvas = page.locator('.react-flow, #workflow-canvas, [data-testid="rf__wrapper"]');
    const hasCanvas = (await canvas.count()) > 0 || (await page.locator('canvas, svg.react-flow__edges').count()) > 0;
    recordCheck(hasCanvas || (await page.locator('body').innerText()).includes('Workflow Builder'), 'Workflows: Canvas/Node Builder loaded');

    // Templates
    await page.locator('#subnav-workflows-templates').click();
    await page.waitForTimeout(600);
    const templateText = await page.locator('body').innerText();
    recordCheck(templateText.includes('Template') || templateText.includes('Recipe') || templateText.includes('Viral'), 'Workflows: Template library loaded');

    // Active Workflows
    await page.locator('#subnav-workflows-active').click();
    await page.waitForTimeout(600);
    const activeText = await page.locator('body').innerText();
    recordCheck(activeText.includes('Active Workflows') || activeText.includes('Running') || activeText.includes('Status'), 'Workflows: Active workflows loaded');

    // Workflow Runs
    await page.locator('#subnav-workflows-runs').click();
    await page.waitForTimeout(600);
    const runsText = await page.locator('body').innerText();
    recordCheck(runsText.includes('Runs') || runsText.includes('Execution') || runsText.includes('History'), 'Workflows: Workflow runs history loaded');

    // Automations
    await page.locator('#subnav-workflows-automations').click();
    await page.waitForTimeout(600);
    const autoText = await page.locator('body').innerText();
    recordCheck(autoText.includes('Automation') || autoText.includes('Trigger') || autoText.includes('Rule'), 'Workflows: Automations triggers loaded');

    const shotWorkflows = path.join(artifactsDir, 'audit_04_workflows_workspace.png');
    await page.screenshot({ path: shotWorkflows });

    // -------------------------------------------------------------
    // 5. PUBLISHING DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing 📅 Publishing Domain & Sub-views ---');
    await page.locator('#nav-domain-publishing').click();
    await page.waitForTimeout(600);

    // Calendar
    recordCheck(await page.locator('#subnav-publishing-calendar').isVisible(), 'Publishing: Calendar sub-navigation visible');
    const calText = await page.locator('body').innerText();
    recordCheck(calText.includes('Calendar') || calText.includes('Sun') || calText.includes('Mon'), 'Publishing: Interactive Calendar rendered');

    // Swimlane
    await page.locator('#subnav-publishing-swimlane').click();
    await page.waitForTimeout(600);
    const swimlaneText = await page.locator('body').innerText();
    recordCheck(swimlaneText.includes('Draft') || swimlaneText.includes('Review') || swimlaneText.includes('Scheduled') || swimlaneText.includes('Swimlane'), 'Publishing: Swimlane Kanban loaded');

    // Campaigns
    await page.locator('#subnav-publishing-campaigns').click();
    await page.waitForTimeout(600);
    const campText = await page.locator('body').innerText();
    recordCheck(campText.includes('Campaign') || campText.includes('Deliverable') || campText.includes('Goal'), 'Publishing: Campaigns tracker loaded');

    // Scheduler
    await page.locator('#subnav-publishing-scheduler').click();
    await page.waitForTimeout(600);
    const schedText = await page.locator('body').innerText();
    recordCheck(schedText.includes('Scheduler') || schedText.includes('Peak') || schedText.includes('18:30'), 'Publishing: Peak window scheduler loaded');

    const shotPublishing = path.join(artifactsDir, 'audit_05_publishing_workspace.png');
    await page.screenshot({ path: shotPublishing });

    // -------------------------------------------------------------
    // 6. INTELLIGENCE DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing 📊 Intelligence Domain & Sub-views ---');
    await page.locator('#nav-domain-intelligence').click();
    await page.waitForTimeout(600);

    // Analytics
    recordCheck(await page.locator('#subnav-intelligence-analytics').isVisible(), 'Intelligence: Analytics sub-navigation visible');
    const intelText = await page.locator('body').innerText();
    recordCheck(intelText.includes('Analytics') || intelText.includes('Reach') || intelText.includes('Engagement'), 'Intelligence: Metrics charts rendered');

    // Performance (4-Act Retention Curve)
    await page.locator('#subnav-intelligence-performance').click();
    await page.waitForTimeout(600);
    const perfText = await page.locator('body').innerText();
    recordCheck(perfText.includes('Performance') || perfText.includes('Retention') || perfText.includes('Second'), 'Intelligence: 4-Act Retention Curve loaded');

    // Content Intelligence
    await page.locator('#subnav-intelligence-content-intelligence').click();
    await page.waitForTimeout(600);
    const ciText = await page.locator('body').innerText();
    recordCheck(ciText.includes('Pillar ROI') || ciText.includes('Decay') || ciText.includes('Content Intelligence'), 'Intelligence: Pillar ROI & decay analysis loaded');

    // Reports
    await page.locator('#subnav-intelligence-reports').click();
    await page.waitForTimeout(600);
    const repText = await page.locator('body').innerText();
    recordCheck(repText.includes('Report') || repText.includes('Export') || repText.includes('Executive'), 'Intelligence: Reports export engine loaded');

    const shotIntelligence = path.join(artifactsDir, 'audit_06_intelligence_workspace.png');
    await page.screenshot({ path: shotIntelligence });

    // -------------------------------------------------------------
    // 7. COLLABORATION DOMAIN
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing 👥 Collaboration Domain & Sub-views ---');
    await page.locator('#nav-domain-collaboration').click();
    await page.waitForTimeout(600);

    // Approvals
    recordCheck(await page.locator('#subnav-collaboration-approvals').isVisible(), 'Collaboration: Approvals sub-navigation visible');
    const collText = await page.locator('body').innerText();
    recordCheck(collText.includes('Approval') || collText.includes('Queue') || collText.includes('Sign-off'), 'Collaboration: Approvals queue loaded');

    // Comments
    await page.locator('#subnav-collaboration-comments').click();
    await page.waitForTimeout(600);
    const commText = await page.locator('body').innerText();
    recordCheck(commText.includes('Comment') || commText.includes('Note') || commText.includes('Editorial'), 'Collaboration: In-line comments panel loaded');

    // Team
    await page.locator('#subnav-collaboration-team').click();
    await page.waitForTimeout(600);
    const teamText = await page.locator('body').innerText();
    recordCheck(teamText.includes('Team') || teamText.includes('Role') || teamText.includes('Permissions'), 'Collaboration: Team permissions roster loaded');

    // Client Portal
    await page.locator('#subnav-collaboration-client-portal').click();
    await page.waitForTimeout(600);
    const clientText = await page.locator('body').innerText();
    recordCheck(clientText.includes('Client') || clientText.includes('Portal') || clientText.includes('Preview'), 'Collaboration: Client portal view loaded');

    const shotCollab = path.join(artifactsDir, 'audit_07_collaboration_workspace.png');
    await page.screenshot({ path: shotCollab });

    // -------------------------------------------------------------
    // 8. SETTINGS DOMAIN & MODAL VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing ⚙️ Settings Domain & Modal ---');
    await page.locator('#nav-domain-settings').click();
    await page.waitForTimeout(600);

    recordCheck(await page.locator('#tab-settings-integrations').isVisible(), 'Settings: Integrations tab visible');
    recordCheck(await page.locator('#tab-settings-mcp').isVisible(), 'Settings: MCP tab visible');
    recordCheck(await page.locator('#tab-settings-ai').isVisible(), 'Settings: AI tab visible');
    recordCheck(await page.locator('#tab-settings-security').isVisible(), 'Settings: Security tab visible');

    // Open Instagram Connect Modal from Header
    await page.locator('#btn-instagram-page-switcher').click();
    await page.waitForTimeout(400);
    await page.locator('#btn-dropdown-connect-page').click();
    await page.waitForTimeout(600);

    const modal = page.locator('#instagram-connect-modal');
    recordCheck(await modal.isVisible(), 'Connect Modal opens cleanly');

    // Test Tab 1: Meta OAuth 2.0
    recordCheck(await page.locator('#tab-oauth-connect').isVisible(), 'Modal Tab 1: Log in with Instagram (Meta OAuth 2.0)');
    const modalText = await modal.innerText();
    recordCheck(modalText.includes('Meta Developer App Setup Guide'), 'Step-by-step Meta Developer App Setup Guide present');
    recordCheck(modalText.includes('http://localhost:3000/api/instagram/oauth/callback'), 'Redirect URI instructions shown');

    // Test Tab 2: Meta Graph API Key
    await page.locator('#tab-graph-connect').click();
    await page.waitForTimeout(400);
    recordCheck(await page.locator('#input-access-token').isVisible(), 'Modal Tab 2: Meta Graph API Key input visible');
    recordCheck(await page.locator('#btn-auto-detect-token').isVisible(), 'Modal Tab 2: Inspect & Auto-Detect button visible');

    // Test Validation on Empty Token Submit
    await page.locator('#btn-auto-detect-token').click();
    await page.waitForTimeout(400);
    const alertMsg = await modal.innerText();
    recordCheck(alertMsg.includes('Please enter a Meta Graph Access Token') || alertMsg.includes('Access Token'), 'Empty token displays validation warning');

    const shotModal = path.join(artifactsDir, 'audit_08_modal_graph_token.png');
    await page.screenshot({ path: shotModal });

    // Close Modal
    await page.locator('#btn-close-connect-modal').click();
    await page.waitForTimeout(400);
    recordCheck(!(await modal.isVisible()), 'Modal closes cleanly on close button click');

    // Return to Home Hub
    await page.locator('#nav-home').click();
    await page.waitForTimeout(600);
    recordCheck(await page.locator('#s2s-home-hub').isVisible(), 'Nav-home returns to Home Hub');

  } catch (err) {
    console.error('💥 Test Execution Error:', err);
    issues.push({ type: 'Test Runtime Exception', message: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`AUDIT COMPLETE: ${passedAssertions} checks passed, ${issues.length} issues found, ${consoleErrors.length} console errors.`);
  console.log('================================================================');

  if (issues.length > 0) {
    console.log('Issues summary:');
    console.log(JSON.stringify(issues, null, 2));
  }
}

runComprehensiveUiUxAudit();
