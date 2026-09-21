const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const issues = [];

  function issue(name, details) {
    issues.push({ name, details });
    console.log(`  ⚠️ ISSUE: ${name} - ${details}`);
  }
  function pass(name) {
    console.log(`  ✅ PASS: ${name}`);
  }

  try {
    // ===================== HOME DARK =====================
    console.log('\n--- HOME (Dark Mode) ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check the home hub container
    const homeHub = page.locator('#s2s-home-action-center');
    if (await homeHub.isVisible().catch(() => false)) {
      pass('Home Action Center visible');
    } else {
      issue('Home Action Center', 'Container #s2s-home-action-center not visible');
    }

    // ===================== LIGHT MODE =====================
    console.log('\n--- SWITCHING TO LIGHT MODE ---');
    const lightBtn = page.locator('#btn-theme-toggle-light');
    if (await lightBtn.isVisible().catch(() => false)) {
      await lightBtn.click();
      await page.waitForTimeout(1000);
      
      // Check body background color
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      console.log(`  Light mode body bg: ${bgColor}`);
      
      // Check sidebar text contrast
      const sidebarTextColor = await page.evaluate(() => {
        const el = document.querySelector('#app-sidebar');
        return el ? window.getComputedStyle(el).color : 'N/A';
      });
      console.log(`  Sidebar text color: ${sidebarTextColor}`);
      
      // Take light mode screenshots of key areas
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_01_home.png'), fullPage: false });
      
      // Check text visibility in light mode - look for low contrast
      const contrastIssues = await page.evaluate(() => {
        const problems = [];
        // Check all text elements for contrast against their background
        const textEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a, label, td, th, li');
        for (const el of textEls) {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bg = style.backgroundColor;
          const text = el.textContent?.trim()?.substring(0, 30);
          
          // Check if text is white/very light on white/very light background
          if (color && bg && text) {
            // Parse rgb values
            const parseRgb = (str) => {
              const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
            };
            const fg = parseRgb(color);
            const bgc = parseRgb(bg);
            if (fg && bgc) {
              // Both very light
              const fgLight = fg.r > 200 && fg.g > 200 && fg.b > 200;
              const bgLight = bgc.r > 200 && bgc.g > 200 && bgc.b > 200;
              if (fgLight && bgLight && text.length > 0) {
                problems.push(`LOW CONTRAST: "${text}" - fg:${color} bg:${bg}`);
              }
            }
          }
        }
        return problems.slice(0, 15);
      });
      
      if (contrastIssues.length > 0) {
        console.log('\n  🔴 Light Mode Contrast Issues:');
        contrastIssues.forEach(i => console.log(`    ${i}`));
        issue('Light Mode Contrast', `${contrastIssues.length} low contrast text elements found`);
      } else {
        pass('Light mode contrast appears acceptable');
      }
    } else {
      issue('Light Mode Toggle', 'Light mode toggle button not found');
    }

    // ===================== PAGE AUDIT =====================
    console.log('\n--- PAGE AUDIT (Light Mode) ---');
    const auditNav = page.locator('#nav-primary-audit');
    if (await auditNav.isVisible().catch(() => false)) {
      await auditNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_02_audit.png'), fullPage: false });
      
      const bodyText = await page.locator('body').innerText();
      if (bodyText.includes('Health') || bodyText.includes('Audit') || bodyText.includes('Diagnostic')) {
        pass('Page Audit content rendered');
      } else {
        issue('Page Audit', 'No audit content visible');
      }
    } else {
      issue('Page Audit Nav', '#nav-primary-audit not found');
    }

    // ===================== TOPICS =====================
    console.log('\n--- TOPICS (Light Mode) ---');
    const topicsNav = page.locator('#nav-primary-topics');
    if (await topicsNav.isVisible().catch(() => false)) {
      await topicsNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_03_topics.png'), fullPage: false });
      pass('Topics page rendered');
    }

    // ===================== CONTENT PRODUCTION =====================
    console.log('\n--- CONTENT PRODUCTION (Light Mode) ---');
    const prodNav = page.locator('#nav-primary-production');
    if (await prodNav.isVisible().catch(() => false)) {
      await prodNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_04_production.png'), fullPage: false });
      pass('Content Production page rendered');
    }

    // ===================== PUBLISHING =====================
    console.log('\n--- PUBLISHING (Light Mode) ---');
    const pubNav = page.locator('#nav-primary-publishing');
    if (await pubNav.isVisible().catch(() => false)) {
      await pubNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_05_publishing.png'), fullPage: false });
      
      // Check if calendar area has content
      const contentArea = page.locator('[class*="flex-1"]').first();
      const areaHeight = await contentArea.boundingBox();
      console.log(`  Publishing content area: ${JSON.stringify(areaHeight)}`);
    }

    // ===================== PERFORMANCE =====================
    console.log('\n--- PERFORMANCE (Light Mode) ---');
    const perfNav = page.locator('#nav-primary-performance');
    if (await perfNav.isVisible().catch(() => false)) {
      await perfNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_06_performance.png'), fullPage: false });
      pass('Performance page rendered');
    }

    // ===================== COMPETITORS =====================
    console.log('\n--- COMPETITORS (Light Mode) ---');
    const compNav = page.locator('#nav-supporting-competitors');
    if (await compNav.isVisible().catch(() => false)) {
      await compNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_07_competitors.png'), fullPage: false });
      pass('Competitors page rendered');
    }

    // ===================== GUARDRAILS =====================
    console.log('\n--- GUARDRAILS (Light Mode) ---');
    const guardNav = page.locator('#nav-supporting-guardrails');
    if (await guardNav.isVisible().catch(() => false)) {
      await guardNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_08_guardrails.png'), fullPage: false });
      pass('Guardrails page rendered');
    }

    // ===================== COLLABORATION =====================
    console.log('\n--- COLLABORATION (Light Mode) ---');
    const collabNav = page.locator('#nav-supporting-collaboration');
    if (await collabNav.isVisible().catch(() => false)) {
      await collabNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_09_collaboration.png'), fullPage: false });
      pass('Collaboration page rendered');
    }

    // ===================== SETTINGS =====================
    console.log('\n--- SETTINGS (Light Mode) ---');
    const settingsNav = page.locator('#nav-supporting-settings');
    if (await settingsNav.isVisible().catch(() => false)) {
      await settingsNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_10_settings.png'), fullPage: false });
      pass('Settings page rendered');
    }

    // ===================== WORKFLOWS (Light Mode) =====================
    console.log('\n--- WORKFLOWS (Light Mode) ---');
    const wfNav = page.locator('#nav-automation-workflows');
    if (await wfNav.isVisible().catch(() => false)) {
      await wfNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactsDir, 'check_light_11_workflows.png'), fullPage: false });
      pass('Workflows page rendered');
    }

    // ===================== Switch back to dark and check remaining =====================
    console.log('\n--- SWITCHING BACK TO DARK ---');
    const darkBtn = page.locator('#btn-theme-toggle-dark');
    if (await darkBtn.isVisible().catch(() => false)) {
      await darkBtn.click();
      await page.waitForTimeout(800);
    }

    // Navigate to audit to check health snapshot
    await page.locator('#nav-primary-audit').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactsDir, 'check_dark_audit.png'), fullPage: false });

    // Scroll down to see more of audit
    await page.evaluate(() => {
      const main = document.querySelector('#s2s-home-action-center, [class*="overflow-y-auto"]');
      if (main) main.scrollTop = main.scrollTop + 500;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactsDir, 'check_dark_audit_scrolled.png'), fullPage: false });

    // ===================== SUMMARY =====================
    console.log('\n================================================================');
    console.log(`AUDIT COMPLETE: ${issues.length} issues found`);
    console.log('================================================================');
    if (issues.length > 0) {
      issues.forEach(i => console.log(`  ⚠️ ${i.name}: ${i.details}`));
    } else {
      console.log('  ✅ All checks passed!');
    }

  } catch (err) {
    console.error('💥 Error:', err.message);
  }

  await browser.close();
})();
