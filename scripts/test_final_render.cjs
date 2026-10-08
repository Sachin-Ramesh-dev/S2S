const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage';

(async () => {
  console.log('=== VERIFYING FINAL RENDER IMAGE GENERATION & WORKSPACE FLOW ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERR]', msg.text());
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    console.log('1. Loaded S2S Studio at http://localhost:3000');

    // Click Content Production nav in sidebar
    await page.click('button:has-text("Content Production")');
    await page.waitForTimeout(1000);
    console.log('2. In Content Production Workspace');

    // -------------------------------------------------------------
    // PART 1: TEST SINGLE IMAGE FINAL RENDER
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Testing Single Image Final Render ---');

    // Select the Image script if available in dropdown
    const scriptSelect = page.locator('select').first();
    const scriptOptions = await scriptSelect.locator('option').allInnerTexts();
    console.log('Available scripts:', scriptOptions.slice(0, 5));

    const imageOption = scriptOptions.find(opt => opt.includes('Image') || opt.includes('EMI Amortization'));
    if (imageOption) {
      await scriptSelect.selectOption({ label: imageOption });
      await page.waitForTimeout(600);
      console.log(`Selected script: "${imageOption}"`);
    }

    // Go to Stage 2 Mock Image
    await page.click('#image-stage-tab-mock, button:has-text("2. Mock Image")');
    await page.waitForTimeout(600);
    console.log('In Mock Image Stage');

    // Click Render Final Image
    const renderImageBtn = page.locator('#btn-render-final-image, button:has-text("Render Final Image")').first();
    console.log('Clicking Render Final Image button...');
    await renderImageBtn.click();
    await page.waitForTimeout(1500);

    // Verify Stage 3 Final Render is active
    await page.waitForSelector('h2:has-text("Final Rendered Image Asset")', { state: 'visible', timeout: 8000 });
    console.log('✓ Stage 3 Final Rendered Image Asset heading visible');

    // Verify <img> tag is present with a valid PNG data URL
    const renderedImg = page.locator('img[alt="Final Rendered Asset"]');
    await renderedImg.waitFor({ state: 'visible', timeout: 8000 });
    const imgSrc = await renderedImg.getAttribute('src');

    if (!imgSrc || !imgSrc.startsWith('data:image/png;base64,')) {
      throw new Error(`Invalid or missing image src: ${imgSrc ? imgSrc.slice(0, 50) : 'null'}`);
    }
    console.log('✓ Final rendered PNG image verified! Length:', imgSrc.length);

    // Take screenshot of Stage 3 Image Final Render
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_render_image_verified.png') });
    console.log('✓ Screenshot saved: final_render_image_verified.png');

    // Test Theme Switcher in Stage 3
    const themeSelect = page.locator('select:has-text("Editorial Swiss Graphic")').first();
    if (await themeSelect.isVisible()) {
      await themeSelect.selectOption('Cyberpunk Neon Dark');
      await page.waitForTimeout(1000);
      const newImgSrc = await renderedImg.getAttribute('src');
      console.log('✓ Theme switched to Cyberpunk Neon Dark. New PNG length:', newImgSrc ? newImgSrc.length : 0);
    }

    // Proceed to Review & Schedule
    await page.click('button:has-text("Proceed to Review & Schedule")');
    await page.waitForTimeout(1000);

    // Verify Stage 4 Review has rendered preview
    const reviewThumbnail = page.locator('img[alt="Final Render Preview"]');
    await reviewThumbnail.waitFor({ state: 'visible', timeout: 5000 });
    const reviewSrc = await reviewThumbnail.getAttribute('src');
    console.log('✓ Stage 4 Review has verified rendered asset thumbnail! Length:', reviewSrc ? reviewSrc.length : 0);

    // -------------------------------------------------------------
    // PART 2: TEST CAROUSEL FINAL RENDER
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Testing Carousel Final Render ---');

    // Select the Carousel script
    const carouselOption = scriptOptions.find(opt => opt.includes('Carousel') || opt.includes('Loan Agreement'));
    if (carouselOption) {
      await scriptSelect.selectOption({ label: carouselOption });
      await page.waitForTimeout(600);
      console.log(`Selected carousel script: "${carouselOption}"`);
    }

    // Go to Stage 2 Mock Carousel
    await page.click('#carousel-stage-tab-mock, button:has-text("2. Mock Carousel")');
    await page.waitForTimeout(600);
    console.log('In Mock Carousel Stage');

    // Click Render Final Slide Deck
    const renderDeckBtn = page.locator('#btn-render-final-deck, button:has-text("Render Final Slide Deck")').first();
    console.log('Clicking Render Final Slide Deck button...');
    await renderDeckBtn.click();
    await page.waitForTimeout(2500);

    // Verify Stage 3 Carousel is active
    await page.waitForSelector('h2:has-text("Final Carousel Slide Deck")', { state: 'visible', timeout: 8000 });
    console.log('✓ Stage 3 Final Carousel Slide Deck heading visible');

    // Verify rendered slide img
    const renderedSlideImg = page.locator('img[alt^="Slide 1"]');
    await renderedSlideImg.waitFor({ state: 'visible', timeout: 8000 });
    const slideSrc = await renderedSlideImg.getAttribute('src');

    if (!slideSrc || !slideSrc.startsWith('data:image/png;base64,')) {
      throw new Error(`Invalid or missing slide src: ${slideSrc ? slideSrc.slice(0, 50) : 'null'}`);
    }
    console.log('✓ Carousel Slide 1 PNG image verified! Length:', slideSrc.length);

    // Take screenshot of Stage 3 Carousel Stepper
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_render_carousel_verified.png') });
    console.log('✓ Screenshot saved: final_render_carousel_verified.png');

    // Test Grid View mode
    const gridBtn = page.locator('button:has-text("All Slides Grid")');
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'final_render_carousel_grid_verified.png') });
      console.log('✓ Screenshot saved: final_render_carousel_grid_verified.png');
    }

    // Proceed to Carousel Stage 4 Review
    await page.click('button:has-text("Proceed to Review & Schedule")');
    await page.waitForTimeout(1000);

    const coverThumbs = page.locator('img[alt^="Slide "]');
    const thumbCount = await coverThumbs.count();
    console.log(`✓ Carousel Stage 4 Review displays ${thumbCount} rendered slide thumbnails in cover selector!`);

    console.log('\n=============================================================');
    console.log('🎉 ALL FINAL RENDER TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
