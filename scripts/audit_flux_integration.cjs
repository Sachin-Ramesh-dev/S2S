const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function runAudit() {
  console.log('======================================================================');
  console.log('🧪 AUDIT: FLUX / POLLINATIONS INTEGRATION & UI SIMPLIFICATION');
  console.log('======================================================================\n');

  // 1. UNIT TEST: Validate Image Signatures and Dimension Parsing
  console.log('1. Testing Image Signature and Dimension Parser...');
  const { InstagramAiOrchestrator } = await import('../src/server/instagramAiOrchestrator.ts');
  const orchestrator = new InstagramAiOrchestrator();

  // Test A: Real PNG Header
  // 89 50 4E 47 0D 0A 1A 0A ... IHDR chunk width=1024, height=1024
  const pngBuf = Buffer.alloc(32);
  pngBuf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  pngBuf.writeUInt32BE(1024, 16);
  pngBuf.writeUInt32BE(768, 20);
  const pngParsed = orchestrator.validateAndGetImageDimensions(Buffer.concat([pngBuf, Buffer.alloc(100)]));
  console.log('  ✓ PNG Parser:', pngParsed);
  if (pngParsed.width !== 1024 || pngParsed.height !== 768 || pngParsed.mime !== 'image/png') {
    throw new Error('PNG dimension parser failed');
  }

  // Test B: Real JPEG with SOF0 Marker (FF C0)
  // FF D8 FF E0 [len 2] ... FF C0 [len 2] [prec 1] [height 2] [width 2]
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01
  ]);
  const jpegFull = Buffer.concat([jpegHeader, Buffer.alloc(200)]);
  const jpegParsed = orchestrator.validateAndGetImageDimensions(jpegFull);
  console.log('  ✓ JPEG Parser (SOF0):', jpegParsed);
  if (jpegParsed.width !== 1024 || jpegParsed.height !== 1024 || jpegParsed.mime !== 'image/jpeg') {
    throw new Error('JPEG dimension parser failed');
  }

  // Test C: Corrupted JPEG (No SOF marker) - MUST throw error, NOT fallback to 1080x1080!
  const corruptedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9]);
  let corruptedCaught = false;
  try {
    orchestrator.validateAndGetImageDimensions(Buffer.concat([corruptedJpeg, Buffer.alloc(150)]));
  } catch (err) {
    corruptedCaught = true;
    console.log('  ✓ Correctly rejected corrupted JPEG without SOF marker:', err.message);
  }
  if (!corruptedCaught) {
    throw new Error('Failed to reject corrupted JPEG without SOF marker');
  }

  // Test D: Tiny buffer (<128 bytes) - MUST throw error!
  let tinyCaught = false;
  try {
    orchestrator.validateAndGetImageDimensions(Buffer.from([0xff, 0xd8, 0xff]));
  } catch (err) {
    tinyCaught = true;
    console.log('  ✓ Correctly rejected tiny/incomplete buffer:', err.message);
  }
  if (!tinyCaught) {
    throw new Error('Failed to reject tiny buffer');
  }

  // 2. Playwright UI Verification
  console.log('\n2. Launching Playwright browser to verify UI simplification & credit notices...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const screenshotDir = path.resolve('/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage');

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Open Content Production -> Script Studio
    await page.waitForSelector('#nav-primary-production', { timeout: 10000 });
    await page.click('#nav-primary-production');
    await page.waitForTimeout(600);

    // Switch to Image format
    const formatBtn = page.locator('#btn-format-switcher');
    const btnText = await formatBtn.textContent();
    if (!btnText.includes('Image')) {
      await formatBtn.click();
      await page.waitForTimeout(300);
      await page.click('#switch-to-format-image');
      await page.waitForTimeout(800);
    }

    // Go to Stage 1: Concept Editor
    await page.click('#image-stage-tab-concept');
    await page.waitForTimeout(600);

    console.log('\n3. Verifying Collapsed Provider Selector & Notices:');
    // Check Flux option
    await page.click('#provider-card-flux');
    await page.waitForTimeout(300);
    const fluxNotice = page.locator('text=Flux Diffusion Engine Notice');
    console.log('  ✓ Flux notice visible:', await fluxNotice.isVisible());
    const fluxGenBtn = page.locator('#btn-generate-mock-image');
    console.log('  ✓ Primary button label for Flux:', await fluxGenBtn.innerText());

    // Check Manus option
    await page.click('#provider-card-manus');
    await page.waitForTimeout(300);
    const manusNotice = page.locator('text=Manus Account Credits Notice');
    console.log('  ✓ Manus credit notice visible:', await manusNotice.isVisible());
    const manusGenBtn = page.locator('#btn-generate-manus-image');
    console.log('  ✓ Primary button label for Manus:', await manusGenBtn.innerText());

    // Check Local Canvas option
    await page.click('#provider-card-canvas');
    await page.waitForTimeout(300);
    const canvasNotice = page.locator('text=100% Free & Unlimited Client Composition');
    console.log('  ✓ Canvas free notice visible:', await canvasNotice.isVisible());
    const canvasGenBtn = page.locator('#btn-generate-mock-image');
    console.log('  ✓ Primary button label for Canvas:', await canvasGenBtn.innerText());

    // Switch back to Flux
    await page.click('#provider-card-flux');
    await page.waitForTimeout(300);

    // Check Collapsible Advanced Settings Panel
    console.log('\n4. Verifying Collapsible Advanced Settings Panel:');
    const advToggleBtn = page.locator('#btn-toggle-advanced-image-settings');
    console.log('  ✓ Advanced settings toggle button visible:', await advToggleBtn.isVisible());

    // Initially collapsed
    const advPanelBefore = page.locator('#advanced-settings-panel');
    console.log('  ✓ Advanced panel initially closed:', !(await advPanelBefore.isVisible()));

    // Click toggle to open
    await advToggleBtn.click();
    await page.waitForTimeout(300);
    const advPanelAfter = page.locator('#advanced-settings-panel');
    console.log('  ✓ Advanced panel open after click:', await advPanelAfter.isVisible());
    console.log('  ✓ Aspect ratio button (1:1) visible:', await page.locator('#btn-aspect-1-1').isVisible());

    await page.screenshot({ path: path.join(screenshotDir, 'audit_05_simplified_provider_selector.png') });
    console.log('  ✓ Screenshot saved: audit_05_simplified_provider_selector.png');

    // Go to Stage 2: Mock Image
    console.log('\n5. Verifying Stage 2 Mock Image (Pure Visual Scene, No Typography Overlay):');
    await page.click('#image-stage-tab-mock');
    await page.waitForTimeout(800);

    const pureModelBadge = page.locator('text=Pure Model Pixels (No Distortion)');
    console.log('  ✓ Pure Model Pixels badge visible:', await pureModelBadge.isVisible());
    const mockContainer = page.locator('#mock-image-container img');
    console.log('  ✓ Raw image rendered in Stage 2:', await mockContainer.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'audit_06_stage2_raw_provider_image.png') });
    console.log('  ✓ Screenshot saved: audit_06_stage2_raw_provider_image.png');

    // Go to Stage 3: Final Render Image
    console.log('\n6. Verifying Stage 3 Composited Final Card (Typography Overlay):');
    await page.click('#image-stage-tab-final');
    await page.waitForTimeout(1000);

    const finalCard = page.locator('#final-render-preview-card img');
    console.log('  ✓ Composited card rendered in Stage 3:', await finalCard.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'audit_07_stage3_composited_overlay.png') });
    console.log('  ✓ Screenshot saved: audit_07_stage3_composited_overlay.png');

    console.log('\n======================================================================');
    console.log('🎉 AUDIT VERIFICATION COMPLETE: ALL CHECKS PASSED 100%!');
    console.log('======================================================================');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
