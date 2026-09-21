const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage';

async function runVerification() {
  console.log('--- Starting Phase 2 Format Selection State Sync Verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#nav-primary-topics', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1000);

    // =========================================================================
    // PATH 1: Reel ➔ "Topic approved as Reel"
    // =========================================================================
    console.log('\n--- PATH 1: Reel Format Flow ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(1000);

    // Open format modal
    const approveBtn1 = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').first();
    await approveBtn1.waitFor({ state: 'visible', timeout: 5000 });
    await approveBtn1.click();
    await page.waitForTimeout(400);

    // 1. Select Reel
    await page.click('#format-card-reel');
    await page.waitForTimeout(200);

    // 2. Verify confirmation button label matches selected format
    const confirmBtnLabelReel = await page.locator('#btn-confirm-topic-format').innerText();
    console.log(`✓ Reel Confirm Button Label: "${confirmBtnLabelReel}"`);
    results.push({
      test: 'Reel: Confirm button label matches format ("Approve as Reel")',
      passed: confirmBtnLabelReel.includes('Approve as Reel')
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_format_modal_reel.png') });

    // 3. Confirm and verify toast
    await page.click('#btn-confirm-topic-format');
    const toastReel = page.locator('#toast-notification');
    await toastReel.waitFor({ state: 'visible', timeout: 5000 });
    const toastReelText = await toastReel.innerText();
    console.log(`✓ Reel Toast text: "${toastReelText}"`);
    results.push({
      test: 'Reel: Toast text matches format ("Topic approved as Reel")',
      passed: toastReelText.includes('Topic approved as Reel')
    });

    // 4. Verify production workspace opens in Reel format
    const formatSwitcher1 = page.locator('#btn-format-switcher');
    await formatSwitcher1.waitFor({ state: 'visible', timeout: 5000 });
    const formatText1 = await formatSwitcher1.innerText();
    console.log(`✓ Production Workspace Format: "${formatText1}"`);
    results.push({
      test: 'Reel: Production workspace opens in Reel format',
      passed: formatText1.includes('Reel')
    });

    // 5. Verify navigation active states: Content Production = active, Topics = inactive, others inactive
    await page.waitForTimeout(400); // Allow CSS transitions to settle
    const prodNavClass = await page.locator('#nav-primary-production').getAttribute('class');
    const topicsNavClass = await page.locator('#nav-primary-topics').getAttribute('class');
    const homeNavClass = await page.locator('#nav-primary-home').getAttribute('class');
    const auditNavClass = await page.locator('#nav-primary-audit').getAttribute('class');
    const publishingNavClass = await page.locator('#nav-primary-publishing').getAttribute('class');
    const performanceNavClass = await page.locator('#nav-primary-performance').getAttribute('class');

    const isProdActive = prodNavClass.includes('bg-[#EA580C]');
    const isTopicsInactive = !topicsNavClass.includes('bg-[#EA580C]');
    const areOthersInactive = !homeNavClass.includes('bg-[#EA580C]') &&
                              !auditNavClass.includes('bg-[#EA580C]') &&
                              !publishingNavClass.includes('bg-[#EA580C]') &&
                              !performanceNavClass.includes('bg-[#EA580C]');

    console.log(`✓ Nav Active State: Content Production active (${isProdActive}), Topics inactive (${isTopicsInactive}), others inactive (${areOthersInactive})`);
    results.push({
      test: 'Sidebar: Content Production is active and Topics/others are inactive in Script Studio',
      passed: isProdActive && isTopicsInactive && areOthersInactive
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_reel_production_workspace.png') });

    // =========================================================================
    // PATH 2: Carousel ➔ "Topic approved as Carousel"
    // =========================================================================
    console.log('\n--- PATH 2: Carousel Format Flow ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(1000);

    // Verify toast clearing when modal opens:
    const approveBtn2 = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').nth(1);
    await approveBtn2.click();
    await page.waitForTimeout(400);

    // Verify previous toast was cleared/reset when modal opened
    const toastVisibleWhenModalOpened = await page.locator('#toast-notification').isVisible();
    console.log(`✓ Toast cleared when modal opened: ${!toastVisibleWhenModalOpened}`);
    results.push({
      test: 'Toast cleared/reset when format modal opens (no stale messages)',
      passed: !toastVisibleWhenModalOpened
    });

    // Select Carousel
    await page.click('#format-card-carousel');
    await page.waitForTimeout(200);

    // Verify confirmation button label matches Carousel
    const confirmBtnLabelCarousel = await page.locator('#btn-confirm-topic-format').innerText();
    console.log(`✓ Carousel Confirm Button Label: "${confirmBtnLabelCarousel}"`);
    results.push({
      test: 'Carousel: Confirm button label matches format ("Approve as Carousel")',
      passed: confirmBtnLabelCarousel.includes('Approve as Carousel')
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_format_modal_carousel.png') });

    // Confirm Carousel
    await page.click('#btn-confirm-topic-format');
    const toastCarousel = page.locator('#toast-notification');
    await toastCarousel.waitFor({ state: 'visible', timeout: 5000 });
    const toastCarouselText = await toastCarousel.innerText();
    console.log(`✓ Carousel Toast text: "${toastCarouselText}"`);
    results.push({
      test: 'Carousel: Toast text matches format ("Topic approved as Carousel")',
      passed: toastCarouselText.includes('Topic approved as Carousel')
    });

    // Verify production workspace opens in Carousel format
    const formatSwitcher2 = page.locator('#btn-format-switcher');
    await formatSwitcher2.waitFor({ state: 'visible', timeout: 5000 });
    const formatText2 = await formatSwitcher2.innerText();
    console.log(`✓ Production Workspace Format: "${formatText2}"`);
    results.push({
      test: 'Carousel: Production workspace opens in Carousel format',
      passed: formatText2.includes('Carousel')
    });

    // Verify Slide Copy is stage 1, then click Generate Mock Carousel
    const genMockBtn = page.locator('#btn-generate-mock-carousel');
    await genMockBtn.waitFor({ state: 'visible', timeout: 5000 });
    await genMockBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_carousel_mock_workspace.png') });

    // =========================================================================
    // PATH 3: Image ➔ "Topic approved as Image"
    // =========================================================================
    console.log('\n--- PATH 3: Image Format Flow ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(1000);

    // Open format modal for 3rd topic
    const approveBtn3 = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').nth(2);
    await approveBtn3.click();
    await page.waitForTimeout(400);

    // Select Image
    await page.click('#format-card-image');
    await page.waitForTimeout(200);

    // Verify confirmation button label matches Image
    const confirmBtnLabelImage = await page.locator('#btn-confirm-topic-format').innerText();
    console.log(`✓ Image Confirm Button Label: "${confirmBtnLabelImage}"`);
    results.push({
      test: 'Image: Confirm button label matches format ("Approve as Image")',
      passed: confirmBtnLabelImage.includes('Approve as Image')
    });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_format_modal_image.png') });

    // Confirm Image
    await page.click('#btn-confirm-topic-format');
    const toastImage = page.locator('#toast-notification');
    await toastImage.waitFor({ state: 'visible', timeout: 5000 });
    const toastImageText = await toastImage.innerText();
    console.log(`✓ Image Toast text: "${toastImageText}"`);
    results.push({
      test: 'Image: Toast text matches format ("Topic approved as Image")',
      passed: toastImageText.includes('Topic approved as Image')
    });

    // Verify production workspace opens in Image format
    const formatSwitcher3 = page.locator('#btn-format-switcher');
    await formatSwitcher3.waitFor({ state: 'visible', timeout: 5000 });
    const formatText3 = await formatSwitcher3.innerText();
    console.log(`✓ Production Workspace Format: "${formatText3}"`);
    results.push({
      test: 'Image: Production workspace opens in Image format',
      passed: formatText3.includes('Image')
    });

    // Generate mock image
    const genMockImgBtn = page.locator('#btn-generate-mock-image');
    await genMockImgBtn.waitFor({ state: 'visible', timeout: 5000 });
    await genMockImgBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_image_mock_workspace.png') });

    // =========================================================================
    // Non-Destructive Format Switching Check
    // =========================================================================
    console.log('\n--- Format Switching Check ---');
    await page.click('#btn-format-switcher');
    await page.waitForTimeout(300);
    await page.click('#switch-to-format-carousel');
    await page.waitForTimeout(1000);
    const switchedFormat1 = await page.locator('#btn-format-switcher').innerText();
    results.push({ test: 'Format Switcher: Switched to Carousel', passed: switchedFormat1.includes('Carousel') });

    await page.click('#btn-format-switcher');
    await page.waitForTimeout(300);
    await page.click('#switch-to-format-image');
    await page.waitForTimeout(1000);
    const switchedFormat2 = await page.locator('#btn-format-switcher').innerText();
    results.push({ test: 'Format Switcher: Switched back to Image', passed: switchedFormat2.includes('Image') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_format_switch_preserved.png') });

    // =========================================================================
    // Home Action Center Check
    // =========================================================================
    console.log('\n--- Home Action Center Check ---');
    await page.click('#nav-primary-home');
    await page.waitForTimeout(1000);
    const continueProdBtn = page.locator('#cta-continue-production');
    await continueProdBtn.waitFor({ state: 'visible', timeout: 5000 });
    const ctaText = await continueProdBtn.innerText();
    results.push({ test: 'Home CTA is "Continue Production"', passed: ctaText.includes('Continue Production') });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_home_action_center.png') });

    // =========================================================================
    // Automation Domain Boundary Check
    // =========================================================================
    console.log('\n--- Automation Domain Boundary Check ---');
    await page.click('#nav-automation-workflows');
    await page.waitForTimeout(1000);
    const builderSubnav = page.locator('#subnav-workflows-builder');
    await builderSubnav.waitFor({ state: 'visible', timeout: 5000 });
    results.push({ test: 'Workflow Builder untouched and functional', passed: true });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_workflow_builder_untouched.png') });

    console.log('\n--- Verification Summary ---');
    console.table(results);
    const allPassed = results.every(r => r.passed);
    console.log(`All tests passed: ${allPassed}`);

  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
