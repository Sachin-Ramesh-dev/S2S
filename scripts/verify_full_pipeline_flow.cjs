const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runVerification() {
  console.log('🚀 Starting Full Closed-Loop Pipeline Verification (Audit -> Topics -> 4-Act Script -> Calendar)...');

  const artifactsDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // 1. Load application
    console.log('\n--- 1. Application Loading & Initial Navigation ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const auditTab = page.locator('#tab-audit');
    await assert(await auditTab.isVisible(), 'Audit tab is visible on page load');
    await auditTab.click();
    await page.waitForTimeout(1000);

    // 2. Audit Studio Verification
    console.log('\n--- 2. Profile Audit Studio & Strategic Action Bridge ---');
    const auditActionBtn = page.locator('#btn-generate-topics-from-audit');
    await assert(await auditActionBtn.isVisible(), 'Strategic Pipeline Action button "#btn-generate-topics-from-audit" is visible in Audit Studio');

    const auditBtnText = await auditActionBtn.innerText();
    console.log(`   - Strategic Pipeline Action button text: "${auditBtnText.trim()}"`);
    await assert(auditBtnText.includes('Generate Topics from Insights'), 'Button displays action text "Generate Topics from Insights"');

    const screenshot1 = path.join(artifactsDir, '01_audit_pipeline_action.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot1}`);

    // Trigger Topic Generation from Audit Insights
    console.log('   - Clicking "#btn-generate-topics-from-audit"...');
    await auditActionBtn.click();

    // Wait for transition to Topics tab
    await page.waitForSelector('button[id^="btn-approve-and-script-"]', { timeout: 60000 });
    console.log('   - Navigated to Topic Ideas tab successfully!');

    // 3. Topic Studio Verification
    console.log('\n--- 3. Topic Studio & "Approve & Generate Script" Action ---');
    const approveAndScriptBtns = page.locator('button[id^="btn-approve-and-script-"]');
    const btnCount = await approveAndScriptBtns.count();
    await assert(btnCount > 0, `Found ${btnCount} "Approve & Generate Script" buttons on topic rows`);

    const firstTopicBtn = approveAndScriptBtns.first();
    const btnLabel = await firstTopicBtn.innerText();
    console.log(`   - First Topic Action button text: "${btnLabel.trim()}"`);
    await assert(btnLabel.includes('Approve & Generate Script'), 'Action button reads "Approve & Generate Script"');

    const screenshot2 = path.join(artifactsDir, '02_topics_studio_with_approve_button.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot2}`);

    // Click "Approve & Generate Script"
    console.log('   - Clicking first "Approve & Generate Script" button...');
    await firstTopicBtn.click();

    // Wait for transition to Scripts tab and editor
    await page.waitForSelector('#retention-score-badge', { timeout: 60000 });
    console.log('   - Navigated to 4-Act Script Studio successfully!');

    // 4. 4-Act Script Studio Verification
    console.log('\n--- 4. 4-Act Script Studio & Real-Time Retention Diagnostics ---');
    const retentionScore = page.locator('#retention-score-badge');
    await assert(await retentionScore.isVisible(), 'Retention Score Badge "#retention-score-badge" is visible');
    const scoreText = await retentionScore.innerText();
    console.log(`   - Dynamic Retention Score: "${scoreText}"`);
    await assert(scoreText.includes('92 / 100'), 'Retention score badge displays 92 / 100');

    // Check 4-Act timeline cards
    const act1 = page.locator('text=Act 1 (0–3s)');
    const act2 = page.locator('text=Act 2 (3–15s)');
    const act3 = page.locator('text=Act 3 (15–45s)');
    const act4 = page.locator('text=Act 4 (45–60s)');
    await assert(await act1.isVisible(), 'Act 1 (0-3s Pattern Interrupt Hook) card is visible');
    await assert(await act2.isVisible(), 'Act 2 (3-15s Conflict & Agitation) card is visible');
    await assert(await act3.isVisible(), 'Act 3 (15-45s Tactical Solution) card is visible');
    await assert(await act4.isVisible(), 'Act 4 (45-60s High-Conversion CTA) card is visible');

    // Verify 1-Click Action: Approve & Schedule in Content Calendar
    const scheduleBtn = page.locator('#btn-approve-and-schedule');
    await assert(await scheduleBtn.isVisible(), '"#btn-approve-and-schedule" button is visible in Script Studio');
    const scheduleBtnText = await scheduleBtn.innerText();
    console.log(`   - Schedule button text: "${scheduleBtnText.trim()}"`);
    await assert(scheduleBtnText.includes('Approve & Schedule in Content Calendar'), 'Button reads "Approve & Schedule in Content Calendar"');

    const screenshot3 = path.join(artifactsDir, '03_script_studio_4act_timeline.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot3}`);

    // Click "Approve & Schedule in Content Calendar"
    console.log('   - Clicking "#btn-approve-and-schedule"...');
    await scheduleBtn.click();

    // Wait for transition to Calendar
    await page.waitForSelector('button:has-text("Reschedule")', { timeout: 30000 });
    console.log('   - Navigated to Content Calendar tab successfully!');

    // 5. Content Calendar Verification
    console.log('\n--- 5. Content Calendar & Scheduled Post Synchronization ---');
    const calendarTab = page.locator('#tab-calendar');
    const calClass = await calendarTab.getAttribute('class');
    await assert(calClass.includes('bg-[#EA580C]'), 'Content Calendar tab is currently active');

    // Check that calendar post cards exist
    const calCards = page.locator('div[id^="calendar-card-"]');
    const cardCount = await calCards.count();
    await assert(cardCount > 0, `Found ${cardCount} post card(s) scheduled in calendar`);

    // Verify card content: status scheduled, clock, linked hook angle or view script
    const firstCard = calCards.first();
    const cardText = await firstCard.innerText();
    console.log(`   - First Calendar Card Content Summary: \n${cardText.split('\n').map(l => '       ' + l).slice(0, 6).join('\n')}`);

    await assert(cardText.includes('scheduled') || cardText.includes('Scheduled'), 'Post status shows "scheduled"');
    await assert(cardText.includes('View Script'), 'Card contains "View Script" link back to Script Studio');

    const screenshot4 = path.join(artifactsDir, '04_calendar_scheduled_post.png');
    await page.screenshot({ path: screenshot4, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshot4}`);

    console.log(`\n🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} assertions verified)`);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    const errorScreenshot = path.join(artifactsDir, 'error_pipeline_failure.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    console.log(`   📸 Failure state screenshot saved to: ${errorScreenshot}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runVerification();
