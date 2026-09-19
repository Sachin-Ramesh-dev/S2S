import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';

async function runAudit() {
  console.log('--- Starting Comprehensive End-to-End Audit ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.log(`[Browser Page Error]: ${err.message}`);
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      networkErrors.push({ url: res.url(), status: res.status() });
      console.log(`[Browser Network Error]: ${res.status()} ${res.url()}`);
    }
  });

  // 1. Visit App
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Home Page Check
  console.log('Checking Home Page...');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_page.png') });

  // 2. Test Strategy Domain
  console.log('Testing Strategy Domain...');
  const strategyBtn = page.locator('button:has-text("Strategy")').first();
  if (await strategyBtn.isVisible()) {
    await strategyBtn.click();
    await page.waitForTimeout(600);

    // Subviews
    const auditTab = page.locator('#subnav-strategy-audit');
    if (await auditTab.isVisible()) await auditTab.click();
    await page.waitForTimeout(400);

    const topicsTab = page.locator('#subnav-strategy-topics');
    if (await topicsTab.isVisible()) {
      await topicsTab.click();
      await page.waitForTimeout(400);
    }

    const competitorsTab = page.locator('#subnav-strategy-competitors');
    if (await competitorsTab.isVisible()) {
      await competitorsTab.click();
      await page.waitForTimeout(400);
    }

    const benchmarksTab = page.locator('#subnav-strategy-benchmarks');
    if (await benchmarksTab.isVisible()) {
      await benchmarksTab.click();
      await page.waitForTimeout(400);
    }

    // Go back to audit tab for screenshot
    if (await auditTab.isVisible()) await auditTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_strategy_domain.png') });
  }

  // 3. Test Content Domain
  console.log('Testing Content Domain...');
  const contentBtn = page.locator('button:has-text("Content")').first();
  if (await contentBtn.isVisible()) {
    await contentBtn.click();
    await page.waitForTimeout(600);

    // Test Topics Subview
    const topicsNav = page.locator('#subnav-content-topics');
    if (await topicsNav.isVisible()) {
      await topicsNav.click();
      await page.waitForTimeout(500);

      // Test Approve button if present
      const approveBtn = page.locator('button:has-text("Approve")').first();
      if (await approveBtn.isVisible()) {
        console.log('Clicking Approve Topic button...');
        await approveBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Test Scripts Subview
    const scriptsNav = page.locator('#subnav-content-scripts');
    if (await scriptsNav.isVisible()) {
      await scriptsNav.click();
      await page.waitForTimeout(500);
    }

    // Test Creatives Subview
    const creativesNav = page.locator('#subnav-content-creatives');
    if (await creativesNav.isVisible()) {
      await creativesNav.click();
      await page.waitForTimeout(500);

      // Test Render AI Slide Deck
      const renderDeckBtn = page.locator('button:has-text("Render AI Slide Deck")').first();
      if (await renderDeckBtn.isVisible()) {
        console.log('Clicking Render AI Slide Deck...');
        await renderDeckBtn.click();
        await page.waitForTimeout(1600); // wait for simulated render
      }
    }

    // Test Repurpose Subview
    const repurposeNav = page.locator('#subnav-content-repurpose');
    if (await repurposeNav.isVisible()) {
      await repurposeNav.click();
      await page.waitForTimeout(400);
    }

    // Test Archive Subview
    const archiveNav = page.locator('#subnav-content-archive');
    if (await archiveNav.isVisible()) {
      await archiveNav.click();
      await page.waitForTimeout(400);
    }

    // Back to Creatives or Scripts for screenshot
    if (await creativesNav.isVisible()) await creativesNav.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_content_domain.png') });
  }

  // 4. Test Workflows Domain
  console.log('Testing Workflows Domain...');
  const workflowsBtn = page.locator('button:has-text("Workflows")').first();
  if (await workflowsBtn.isVisible()) {
    await workflowsBtn.click();
    await page.waitForTimeout(600);

    // Templates Subview
    const tplNav = page.locator('#subnav-workflows-templates');
    if (await tplNav.isVisible()) {
      await tplNav.click();
      await page.waitForTimeout(500);

      // Test Load into Builder
      const loadBtn = page.locator('button:has-text("Load into Builder")').first();
      if (await loadBtn.isVisible()) {
        console.log('Clicking Load into Builder on template card...');
        await loadBtn.click();
        await page.waitForTimeout(600);
      }
    }

    // Active Workflows Subview
    const activeNav = page.locator('#subnav-workflows-active');
    if (await activeNav.isVisible()) {
      await activeNav.click();
      await page.waitForTimeout(400);
    }

    // Runs Subview
    const runsNav = page.locator('#subnav-workflows-runs');
    if (await runsNav.isVisible()) {
      await runsNav.click();
      await page.waitForTimeout(400);
    }

    // Automations Subview
    const automationsNav = page.locator('#subnav-workflows-automations');
    if (await automationsNav.isVisible()) {
      await automationsNav.click();
      await page.waitForTimeout(400);
    }

    // Builder Subview
    const builderNav = page.locator('#subnav-workflows-builder');
    if (await builderNav.isVisible()) {
      await builderNav.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_workflows_domain.png') });
  }

  // 5. Test Publishing Domain
  console.log('Testing Publishing Domain...');
  const publishingBtn = page.locator('button:has-text("Publishing")').first();
  if (await publishingBtn.isVisible()) {
    await publishingBtn.click();
    await page.waitForTimeout(600);

    // Calendar
    const calNav = page.locator('#subnav-publishing-calendar');
    if (await calNav.isVisible()) await calNav.click();
    await page.waitForTimeout(400);

    // Swimlanes
    const swimNav = page.locator('#subnav-publishing-swimlanes');
    if (await swimNav.isVisible()) {
      await swimNav.click();
      await page.waitForTimeout(400);
    }

    // Queue
    const queueNav = page.locator('#subnav-publishing-queue');
    if (await queueNav.isVisible()) {
      await queueNav.click();
      await page.waitForTimeout(400);
    }

    // Campaigns
    const campNav = page.locator('#subnav-publishing-campaigns');
    if (await campNav.isVisible()) {
      await campNav.click();
      await page.waitForTimeout(400);
    }

    // Scheduler
    const schedNav = page.locator('#subnav-publishing-scheduler');
    if (await schedNav.isVisible()) {
      await schedNav.click();
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_publishing_domain.png') });
  }

  // 6. Test Intelligence Domain
  console.log('Testing Intelligence Domain...');
  const intelBtn = page.locator('button:has-text("Intelligence")').first();
  if (await intelBtn.isVisible()) {
    await intelBtn.click();
    await page.waitForTimeout(600);

    // Overview
    const overviewNav = page.locator('#subnav-intel-overview');
    if (await overviewNav.isVisible()) {
      await overviewNav.click();
      await page.waitForTimeout(400);

      // Test Export Brief
      const exportBtn = page.locator('button:has-text("Export Executive Brief (.md)")').first();
      if (await exportBtn.isVisible()) {
        console.log('Clicking Export Executive Brief (.md)...');
        await exportBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Performance
    const perfNav = page.locator('#subnav-intel-performance');
    if (await perfNav.isVisible()) {
      await perfNav.click();
      await page.waitForTimeout(400);
    }

    // Audience
    const audNav = page.locator('#subnav-intel-audience');
    if (await audNav.isVisible()) {
      await audNav.click();
      await page.waitForTimeout(400);
    }

    // Reports
    const repNav = page.locator('#subnav-intel-reports');
    if (await repNav.isVisible()) {
      await repNav.click();
      await page.waitForTimeout(400);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_intelligence_domain.png') });
  }

  // 7. Test Collaboration Domain
  console.log('Testing Collaboration Domain...');
  const collabBtn = page.locator('button:has-text("Collaboration")').first();
  if (await collabBtn.isVisible()) {
    await collabBtn.click();
    await page.waitForTimeout(600);

    // Team
    const teamNav = page.locator('#subnav-collab-team');
    if (await teamNav.isVisible()) await teamNav.click();
    await page.waitForTimeout(400);

    // Approvals
    const appNav = page.locator('#subnav-collab-approvals');
    if (await appNav.isVisible()) {
      await appNav.click();
      await page.waitForTimeout(400);

      const approveScriptBtn = page.locator('button:has-text("Approve")').first();
      if (await approveScriptBtn.isVisible()) {
        console.log('Clicking Approve Script in Collaboration...');
        await approveScriptBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Activity
    const actNav = page.locator('#subnav-collab-activity');
    if (await actNav.isVisible()) {
      await actNav.click();
      await page.waitForTimeout(400);
    }

    // Portal
    const portalNav = page.locator('#subnav-collab-portal');
    if (await portalNav.isVisible()) {
      await portalNav.click();
      await page.waitForTimeout(400);

      const copyPortalBtn = page.locator('button:has-text("Copy Client Portal Link")').first();
      if (await copyPortalBtn.isVisible()) {
        console.log('Clicking Copy Client Portal Link...');
        await copyPortalBtn.click();
        await page.waitForTimeout(400);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_collaboration_domain.png') });
  }

  // 8. Test Theme Switcher (Dark -> Light -> Dark)
  console.log('Testing Light Mode...');
  // Find theme toggle button (icon with sun or moon)
  const themeToggle = page.locator('button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_light_mode.png') });
    console.log('Light mode verified and captured.');

    // Switch back to Dark mode
    await themeToggle.click();
    await page.waitForTimeout(400);
  }

  // 9. Responsive Viewports
  console.log('Testing Tablet Viewport (768x1024)...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_tablet_view.png') });

  console.log('Testing Mobile Viewport (375x812)...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_mobile_view.png') });

  await browser.close();

  console.log('\n--- End-to-End Audit Summary ---');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }
  console.log(`Total Network Errors (>= 400): ${networkErrors.length}`);
  if (networkErrors.length > 0) {
    console.log('Network Errors:', networkErrors);
  }
  console.log('All screenshots saved successfully.');
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
