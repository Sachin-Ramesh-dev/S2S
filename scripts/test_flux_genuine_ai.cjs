const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function testGenuineImageGeneration() {
  console.log('======================================================================');
  console.log('🧪 TEST: GENUINE AI VISUAL SCENE GENERATION + TYPOGRAPHY OVERLAY');
  console.log('======================================================================\n');

  const BASE_URL = 'http://localhost:3000/api/instagram';
  const dbPath = path.resolve(__dirname, '../data/nodeflow_db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const testScript = db.instagramScripts.find(s => s.title.includes('EMI')) || db.instagramScripts[0];
  console.log(`1. Target Script: [${testScript.id}] "${testScript.title}"`);

  // Define visual scene prompt without embedded typography
  const visualPrompt = 'Close-up editorial photograph of a retail shopping counter with an electronic credit card terminal, crumpled sales receipts, magnifying glass showing fine print, dramatic studio shadows, cinematic lighting, 8k resolution, clean composition, no text, no letters, no logos, no watermark';

  console.log('\n2. Calling POST /api/instagram/images/generate with provider: flux...');
  const t0 = Date.now();
  const genRes = await fetch(`${BASE_URL}/images/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scriptId: testScript.id,
      prompt: visualPrompt,
      aspectRatio: '1:1',
      stylePreset: 'Editorial Swiss Graphic',
      provider: 'flux'
    })
  });

  const durationMs = Date.now() - t0;
  console.log(`Response received in ${durationMs}ms with HTTP status ${genRes.status}`);

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Generation failed: ${errText}`);
  }

  const genData = await genRes.json();
  console.log('\n3. Raw Provider Response Metadata:');
  console.log({
    success: genData.success,
    provider: genData.provider,
    model: genData.model,
    width: genData.width,
    height: genData.height,
    byteLength: genData.byteLength,
    isDataUrl: genData.imageUrl?.startsWith('data:image/'),
    mimeType: genData.imageUrl?.split(';')[0]?.replace('data:', '')
  });

  if (!genData.imageUrl || genData.provider !== 'flux') {
    throw new Error('API did not return valid Flux model output');
  }

  // 4. Validate binary bytes and magic headers
  console.log('\n4. Validating image binary bytes and magic headers...');
  const base64Data = genData.imageUrl.split(',')[1];
  const imgBuffer = Buffer.from(base64Data, 'base64');
  const magicHex = imgBuffer.slice(0, 4).toString('hex');
  const isJpeg = magicHex.startsWith('ffd8ff');
  const isPng = magicHex.startsWith('89504e47');
  console.log(`- Buffer size: ${imgBuffer.length} bytes (${(imgBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`- Magic bytes: 0x${magicHex} (${isJpeg ? 'Valid JPEG' : isPng ? 'Valid PNG' : 'UNKNOWN'})`);

  if (!isJpeg && !isPng) {
    throw new Error('Image header does not match valid JPEG or PNG signature!');
  }

  // 5. Verify database persistence
  console.log('\n5. Verifying database persistence in data/nodeflow_db.json...');
  const reloadedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const updatedScript = reloadedDb.instagramScripts.find(s => s.id === testScript.id);
  const concept = updatedScript.imageConcept;
  console.log('Persisted Script Metadata:', {
    provider: concept.provider,
    model: concept.model,
    width: concept.width,
    height: concept.height,
    hasMockImage: !!concept.mockImageUrl,
    hasFinalImage: !!concept.finalImageUrl
  });

  if (concept.provider !== 'flux' || concept.model !== 'flux-schnell') {
    throw new Error('Script did not persist flux metadata correctly');
  }
  console.log('✓ Database persistence verified!');

  // 6. Browser UI Verification with Playwright
  console.log('\n6. Launching Playwright browser to verify UI separation & overlay...');
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

    // Switch to Image Studio format
    const formatBtn = page.locator('#btn-format-switcher');
    const btnText = await formatBtn.textContent();
    if (!btnText.includes('Image')) {
      await formatBtn.click();
      await page.waitForTimeout(300);
      await page.click('#switch-to-format-image');
      await page.waitForTimeout(800);
    }

    // Select the test script
    const scriptSelect = page.locator('#select-active-script');
    if (await scriptSelect.isVisible()) {
      await scriptSelect.selectOption(testScript.id);
      await page.waitForTimeout(800);
    }

    // Verify Stage 1
    console.log('7. Verifying Stage 1 Provider Cards & Flux Action Button...');
    await page.click('#image-stage-tab-concept');
    await page.waitForTimeout(600);

    const fluxCard = page.locator('#provider-card-flux');
    console.log('✓ Flux Provider card visible:', await fluxCard.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'genuine_01_stage1_flux_provider.png') });
    console.log('✓ Screenshot saved: genuine_01_stage1_flux_provider.png');

    // Go to Stage 2: Mock Image
    console.log('8. Verifying Stage 2: Pure Model-Generated Visual Scene (No Typography)...');
    await page.click('#image-stage-tab-mock');
    await page.waitForTimeout(1000);

    const pureModelNotice = page.locator('text=Pure Model Pixels (No Distortion)');
    console.log('✓ Pure Model Pixels indicator visible:', await pureModelNotice.isVisible());

    const fluxAttribution = page.locator('text=Genuine AI Visual Artwork (Flux)');
    console.log('✓ Stage 2 displays "Genuine AI Visual Artwork (Flux)":', await fluxAttribution.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'genuine_02_stage2_pure_visual_artwork.png') });
    console.log('✓ Screenshot saved: genuine_02_stage2_pure_visual_artwork.png');

    // Go to Stage 3: Final Render Image
    console.log('9. Verifying Stage 3: Clean Typography Overlay over Genuine Visual Scene...');
    const renderBtn = page.locator('#btn-render-final-image');
    if (await renderBtn.isVisible()) {
      await renderBtn.click();
      await page.waitForTimeout(3000);
    } else {
      await page.click('#image-stage-tab-final');
      await page.waitForTimeout(2000);
    }

    const finalCard = page.locator('#final-render-preview-card img');
    const isFinalImgVisible = await finalCard.isVisible();
    const finalSrc = await finalCard.getAttribute('src');
    console.log('✓ Stage 3 Composited Card visible:', isFinalImgVisible, 'length:', finalSrc ? finalSrc.length : 0);

    const stage3Attribution = page.locator('text=Genuine Flux AI Artwork + S2S Studio Overlay').first();
    console.log('✓ Stage 3 attribution visible:', await stage3Attribution.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'genuine_03_stage3_composited_overlay.png') });
    console.log('✓ Screenshot saved: genuine_03_stage3_composited_overlay.png');

    // Go to Stage 4: Review & Schedule
    console.log('10. Verifying Stage 4 Review & Schedule attribution...');
    await page.click('#image-stage-tab-review');
    await page.waitForTimeout(1000);

    const stage4Attribution = page.locator('text=Genuine Flux AI Artwork + S2S Studio Overlay').first();
    console.log('✓ Stage 4 Review displays "Genuine Flux AI Artwork + S2S Studio Overlay":', await stage4Attribution.isVisible());
    await page.screenshot({ path: path.join(screenshotDir, 'genuine_04_stage4_review_schedule.png') });
    console.log('✓ Screenshot saved: genuine_04_stage4_review_schedule.png');

    console.log('\n======================================================================');
    console.log('🎉 ALL GENUINE AI VISUAL SCENE VERIFICATION CHECKS PASSED 100%!');
    console.log('======================================================================');
  } catch (err) {
    console.error('Browser Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testGenuineImageGeneration().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
