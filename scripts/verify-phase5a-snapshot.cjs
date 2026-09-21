const { chromium } = require('playwright');
const path = require('path');
const http = require('http');

const ARTIFACT_DIR = path.join(__dirname, '..', '..', '..', 'brain', '56077cb5-6f5e-41dc-975b-dfeee3e234d7', '.tempmediaStorage');

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runVerification() {
  console.log('--- Starting Phase 5A PublicationSnapshot & Lossless Handover Verification ---\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  try {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('#nodeflow-app-root', { state: 'visible', timeout: 10000 });

    // =========================================================================
    // TEST 1: Schedule a Carousel with custom date, time, and verify PublicationSnapshot
    // =========================================================================
    console.log('--- Test 1: Carousel Scheduling & PublicationSnapshot ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(600);

    const approveBtn = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 5000 });
    await approveBtn.click();
    await page.waitForTimeout(400);

    // Select Carousel
    await page.click('#format-card-carousel');
    await page.waitForTimeout(200);
    await page.click('#btn-confirm-topic-format');
    await page.waitForSelector('#carousel-stage-tab-copy', { state: 'visible', timeout: 8000 });

    // Navigate to Review & Schedule
    await page.click('#carousel-stage-tab-review');
    await page.waitForSelector('#btn-schedule-carousel', { state: 'visible', timeout: 5000 });

    // Open Carousel Schedule Modal
    await page.click('#btn-schedule-carousel');
    await page.waitForSelector('#input-carousel-schedule-date', { state: 'visible', timeout: 3000 });

    // Set custom date and time (NOT tomorrow, NOT 18:30)
    const customCarouselDate = '2026-11-15';
    const customCarouselTime = '20:45';
    await page.fill('#input-carousel-schedule-date', customCarouselDate);
    await page.fill('#input-carousel-schedule-time', customCarouselTime);

    // Verify confirmation label dynamically matches custom date and time
    const carouselConfirmLabel = await page.locator('label[for="checkbox-confirm-schedule-carousel"]').innerText();
    const matchesCustomSchedule = carouselConfirmLabel.includes(customCarouselDate) && carouselConfirmLabel.includes(customCarouselTime);
    console.log(`✓ Carousel modal confirmation label reflects custom schedule: ${matchesCustomSchedule}`);
    results.push({ test: 'Carousel modal confirmation label reflects custom date & time', passed: matchesCustomSchedule });

    // Confirm schedule
    await page.check('#checkbox-confirm-schedule-carousel');
    await page.waitForSelector('#btn-confirm-schedule-carousel:not([disabled])', { state: 'visible', timeout: 3000 });
    await page.click('#btn-confirm-schedule-carousel');
    await page.waitForTimeout(1500);

    // Verify via backend API that PublicationSnapshot was created with exact metadata
    const snapshotsRes = await fetchJson('http://localhost:3000/api/instagram/publication-snapshots');
    console.log('snapshotsRes:', JSON.stringify(snapshotsRes));
    const carouselSnap = snapshotsRes.snapshots?.find(s => s.format === 'Carousel' && s.scheduledDate === customCarouselDate);

    const snapExists = !!carouselSnap;
    console.log(`✓ PublicationSnapshot created for Carousel: ${snapExists}`);
    results.push({ test: 'PublicationSnapshot created in backend for Carousel', passed: snapExists });

    if (carouselSnap) {
      const exactSchedulePreserved = carouselSnap.scheduledDate === customCarouselDate && carouselSnap.scheduledTime === customCarouselTime && carouselSnap.timezone === 'Asia/Kolkata';
      console.log(`✓ Exact schedule preserved (Date: ${carouselSnap.scheduledDate}, Time: ${carouselSnap.scheduledTime}, Timezone: ${carouselSnap.timezone}): ${exactSchedulePreserved}`);
      results.push({ test: 'Carousel PublicationSnapshot preserves exact custom date, time, and timezone', passed: exactSchedulePreserved });

      const formatMetadataPreserved = carouselSnap.format === 'Carousel' && carouselSnap.slideCount >= 5 && Array.isArray(carouselSnap.carouselSlides) && carouselSnap.aspectRatio === '1:1';
      console.log(`✓ Carousel format metadata preserved (Slides: ${carouselSnap.slideCount}, AspectRatio: ${carouselSnap.aspectRatio}): ${formatMetadataPreserved}`);
      results.push({ test: 'Carousel PublicationSnapshot preserves slides, slide count, and aspect ratio', passed: formatMetadataPreserved });

      const copyPreserved = !!carouselSnap.caption && Array.isArray(carouselSnap.hashtags) && carouselSnap.hashtags.length > 0;
      console.log(`✓ Approved copy & hashtags preserved in snapshot: ${copyPreserved}`);
      results.push({ test: 'Carousel PublicationSnapshot preserves caption and hashtags', passed: copyPreserved });

      const decoupledStatusesValid = carouselSnap.contentStatus === 'PRODUCTION_COMPLETE' &&
                                     carouselSnap.assetStatus === 'ready' &&
                                     carouselSnap.scheduleStatus === 'scheduled' &&
                                     carouselSnap.executionStatus === 'idle';
      console.log(`✓ Four decoupled lifecycle dimensions valid: ${decoupledStatusesValid}`);
      results.push({ test: 'Carousel PublicationSnapshot decouples content, asset, schedule, and execution statuses', passed: decoupledStatusesValid });

      const hasIdempotencyKey = !!carouselSnap.idempotencyKey && carouselSnap.idempotencyKey.startsWith('idem-');
      console.log(`✓ Idempotency key present: ${hasIdempotencyKey}`);
      results.push({ test: 'Carousel PublicationSnapshot includes idempotencyKey', passed: hasIdempotencyKey });
    }

    // =========================================================================
    // TEST 2: Schedule an Image with custom date/time and verify PublicationSnapshot
    // =========================================================================
    console.log('\n--- Test 2: Image Scheduling & PublicationSnapshot ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(600);

    const approveBtnImage = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').first();
    await approveBtnImage.waitFor({ state: 'visible', timeout: 5000 });
    await approveBtnImage.click();
    await page.waitForTimeout(400);

    // Select Image
    await page.click('#format-card-image');
    await page.waitForTimeout(200);
    await page.click('#btn-confirm-topic-format');
    await page.waitForSelector('#image-stage-tab-concept', { state: 'visible', timeout: 8000 });

    // Navigate to Review & Schedule
    await page.click('#image-stage-tab-review');
    await page.waitForSelector('#btn-schedule-image', { state: 'visible', timeout: 5000 });

    // Open Image Schedule Modal
    await page.click('#btn-schedule-image');
    await page.waitForSelector('#input-image-schedule-date', { state: 'visible', timeout: 3000 });

    const customImageDate = '2026-11-20';
    const customImageTime = '09:15';
    await page.fill('#input-image-schedule-date', customImageDate);
    await page.fill('#input-image-schedule-time', customImageTime);

    await page.check('#checkbox-confirm-schedule-image');
    await page.waitForSelector('#btn-confirm-schedule-image:not([disabled])', { state: 'visible', timeout: 3000 });
    await page.click('#btn-confirm-schedule-image');
    await page.waitForTimeout(1500);

    const snapshotsRes2 = await fetchJson('http://localhost:3000/api/instagram/publication-snapshots');
    const imageSnap = snapshotsRes2.snapshots?.find(s => s.format === 'Image' && s.scheduledDate === customImageDate);

    const imageSnapExists = !!imageSnap;
    console.log(`✓ PublicationSnapshot created for Image: ${imageSnapExists}`);
    results.push({ test: 'PublicationSnapshot created in backend for Image', passed: imageSnapExists });

    if (imageSnap) {
      const imageSchedulePreserved = imageSnap.scheduledDate === customImageDate && imageSnap.scheduledTime === customImageTime && imageSnap.timezone === 'Asia/Kolkata';
      console.log(`✓ Exact Image schedule preserved (Date: ${imageSnap.scheduledDate}, Time: ${imageSnap.scheduledTime}): ${imageSchedulePreserved}`);
      results.push({ test: 'Image PublicationSnapshot preserves exact custom date, time, and timezone', passed: imageSchedulePreserved });

      const imageAssetPreserved = Array.isArray(imageSnap.mediaUrls) && imageSnap.mediaUrls.length > 0 && !!imageSnap.coverImageUrl;
      console.log(`✓ Final Image asset URL preserved: ${imageAssetPreserved}`);
      results.push({ test: 'Image PublicationSnapshot preserves final image asset and cover', passed: imageAssetPreserved });
    }

    // =========================================================================
    // TEST 3: Schedule a Reel with custom date/time and verify PublicationSnapshot
    // =========================================================================
    console.log('\n--- Test 3: Reel Scheduling & PublicationSnapshot ---');
    await page.click('#nav-primary-topics');
    await page.waitForTimeout(600);

    const approveBtnReel = page.locator('button[title="Approve & select format"], [id^="btn-approve-and-script-"]').first();
    await approveBtnReel.waitFor({ state: 'visible', timeout: 5000 });
    await approveBtnReel.click();
    await page.waitForTimeout(400);

    // Select Reel
    await page.click('#format-card-reel');
    await page.waitForTimeout(200);
    await page.click('#btn-confirm-topic-format');
    await page.waitForSelector('#reel-stage-tab-script', { state: 'visible', timeout: 8000 });

    // Navigate to Stage 4: Review & Schedule
    await page.click('#reel-stage-tab-review');
    await page.waitForSelector('#btn-review-schedule', { state: 'visible', timeout: 5000 });

    // Open Reel Schedule Modal
    await page.click('#btn-review-schedule');
    await page.waitForSelector('#input-schedule-date', { state: 'visible', timeout: 3000 });

    const customReelDate = '2026-12-05';
    const customReelTime = '14:20';
    await page.fill('#input-schedule-date', customReelDate);
    await page.fill('#input-schedule-time', customReelTime);

    // Verify confirmation label dynamically matches custom date and time
    const reelConfirmLabel = await page.locator('label[for="checkbox-confirm-schedule"]').innerText();
    const matchesReelSchedule = reelConfirmLabel.includes(customReelDate) && reelConfirmLabel.includes(customReelTime);
    console.log(`✓ Reel modal confirmation label reflects custom schedule: ${matchesReelSchedule}`);
    results.push({ test: 'Reel modal confirmation label reflects custom date & time', passed: matchesReelSchedule });

    await page.check('#checkbox-confirm-schedule');
    await page.waitForSelector('#btn-confirm-schedule:not([disabled])', { state: 'visible', timeout: 3000 });
    await page.click('#btn-confirm-schedule');
    await page.waitForTimeout(1500);

    const snapshotsRes3 = await fetchJson('http://localhost:3000/api/instagram/publication-snapshots');
    const reelSnap = snapshotsRes3.snapshots?.find(s => s.format === 'Reel' && s.scheduledDate === customReelDate);

    const reelSnapExists = !!reelSnap;
    console.log(`✓ PublicationSnapshot created for Reel: ${reelSnapExists}`);
    results.push({ test: 'PublicationSnapshot created in backend for Reel', passed: reelSnapExists });

    if (reelSnap) {
      const reelSchedulePreserved = reelSnap.scheduledDate === customReelDate && reelSnap.scheduledTime === customReelTime && reelSnap.timezone === 'Asia/Kolkata';
      console.log(`✓ Exact Reel schedule preserved (Date: ${reelSnap.scheduledDate}, Time: ${reelSnap.scheduledTime}, Timezone: ${reelSnap.timezone}): ${reelSchedulePreserved}`);
      results.push({ test: 'Reel PublicationSnapshot preserves exact custom date, time, and timezone', passed: reelSchedulePreserved });

      const reelFormatPreserved = reelSnap.format === 'Reel' && reelSnap.aspectRatio === '9:16' && reelSnap.mediaUrls?.length > 0;
      console.log(`✓ Reel format metadata preserved (AspectRatio: ${reelSnap.aspectRatio}, MediaUrls: ${reelSnap.mediaUrls?.length}): ${reelFormatPreserved}`);
      results.push({ test: 'Reel PublicationSnapshot preserves format, 9:16 aspect ratio, and video media', passed: reelFormatPreserved });
    }

    // =========================================================================
    // TEST 4: Immutability Verification — Editing source script does NOT mutate snapshot
    // =========================================================================
    console.log('\n--- Test 4: Immutability Check (Source Edit Isolation) ---');
    if (carouselSnap) {
      const originalTitle = carouselSnap.title;
      const originalCaption = carouselSnap.caption;
      const originalDate = carouselSnap.scheduledDate;

      // Simulate a user modifying the source script in Script Studio
      const scriptId = carouselSnap.sourceScriptId;
      console.log(`Modifying source script ${scriptId} with new title and modified caption...`);
      await fetchJson(`http://localhost:3000/api/instagram/scripts/${scriptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'MUTATED: This is a modified title after scheduling',
          caption: 'MUTATED: This is a modified caption after scheduling',
          hook: 'MUTATED: Modified Hook'
        })
      });

      // Refetch the snapshot to verify it remained completely untouched
      const refetchedSnap = await fetchJson(`http://localhost:3000/api/instagram/publication-snapshots/${carouselSnap.id}`);
      const isStillFrozen = refetchedSnap.snapshot.title === originalTitle &&
                            refetchedSnap.snapshot.caption === originalCaption &&
                            refetchedSnap.snapshot.scheduledDate === originalDate;

      console.log(`✓ PublicationSnapshot remained strictly immutable after script mutation: ${isStillFrozen}`);
      results.push({ test: 'PublicationSnapshot remains strictly immutable when source script is edited', passed: isStillFrozen });
    }

    // =========================================================================
    // TEST 4: CalendarPost linkage to PublicationSnapshot
    // =========================================================================
    console.log('\n--- Test 4: CalendarPost Linkage ---');
    const calRes = await fetchJson('http://localhost:3000/api/instagram/calendar');
    const linkedCalPost = calRes.calendar?.find(c => c.scheduledDate === customCarouselDate);

    const isLinked = !!linkedCalPost && !!linkedCalPost.publicationSnapshotId && linkedCalPost.publicationSnapshotId === carouselSnap?.id;
    console.log(`✓ CalendarPost correctly references PublicationSnapshot ID: ${isLinked}`);
    results.push({ test: 'CalendarPost links to PublicationSnapshot via publicationSnapshotId', passed: isLinked });

  } catch (err) {
    console.error('Test error:', err);
    results.push({ test: `Suite execution: ${err.message}`, passed: false });
  } finally {
    await browser.close();
  }

  // Print Summary Table
  console.log('\n=============================================================');
  console.log('PHASE 5A VERIFICATION RESULTS SUMMARY');
  console.log('=============================================================');
  results.forEach(r => {
    console.log(`${r.passed ? '✓ PASS' : '✗ FAIL'}: ${r.test}`);
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\nOverall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

runVerification();
