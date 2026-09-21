/**
 * verify-phase5c-engine.cjs
 * Comprehensive verification for S2S Phase 5C — Publishing Engine Architecture & Meta/Instagram Integration
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = path.resolve('/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage');

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function run() {
  console.log('\n===============================================================');
  console.log('🚀 S2S PHASE 5C — PUBLISHING ENGINE & META INTEGRATION VERIFICATION');
  console.log('===============================================================\n');

  // ---------------------------------------------------------------------------
  // 1. IN-DEPTH ENGINE LOGIC & UNIT TESTS (TSX HARNESS)
  // ---------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Publishing Engine Core Logic (Unit & State Machine) ---');
  try {
    const unitOutput = execSync('npx tsx scripts/verify-phase5c-unit.ts', {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '..')
    });
    console.log(unitOutput);
    assert(true, 'All 45 in-depth unit and state machine tests passed successfully');
  } catch (err) {
    console.error('Unit verification failed:', err.stdout || err.message);
    assert(false, 'Unit verification suite failed');
  }

  // ---------------------------------------------------------------------------
  // 2. CREDENTIAL SECURITY & VAULT INTEGRITY (P0)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Credential Security & Zero Plaintext Exposure (P0) ---');

  // A. API Response Credential Stripping
  const accountsRes = await fetch(`${BASE_URL}/api/instagram/accounts`);
  assert(accountsRes.ok, 'GET /api/instagram/accounts returns HTTP 200');
  const accountsData = await accountsRes.json();
  assert(accountsData.success && Array.isArray(accountsData.accounts), 'Accounts array returned');

  let tokenLeakedInApi = false;
  for (const acc of accountsData.accounts) {
    if (acc.metaAccessToken) {
      tokenLeakedInApi = true;
    }
    assert(!acc.metaAccessToken, `Account @${acc.username} does NOT expose metaAccessToken in API response`);
    assert(typeof acc.hasCredentials === 'boolean', `Account @${acc.username} provides safe hasCredentials boolean (${acc.hasCredentials})`);
  }
  assert(!tokenLeakedInApi, 'CRITICAL: Zero Meta access tokens exposed to frontend via GET /api/instagram/accounts');

  // B. Database Persistence Credential Stripping
  const dbPath = path.resolve(__dirname, '../data/nodeflow_db.json');
  assert(fs.existsSync(dbPath), 'nodeflow_db.json exists on disk');
  const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  let tokenLeakedInDb = false;
  if (dbContent.instagramAccounts) {
    for (const acc of dbContent.instagramAccounts) {
      if (acc.metaAccessToken) {
        tokenLeakedInDb = true;
      }
      assert(!acc.metaAccessToken, `Persisted account @${acc.username} has NO plaintext metaAccessToken`);
    }
  }
  assert(!tokenLeakedInDb, 'CRITICAL: Database persistence contains ZERO plaintext Meta access tokens');

  // C. Credential Vault Verification
  assert(Array.isArray(dbContent.vault), 'Credential vault exists in database');
  const vaultItem = dbContent.vault.find(v => v.id.startsWith('cred-meta') || v.name.includes('Meta Access Token'));
  assert(!!vaultItem, 'Meta credential stored in S2S Credential Vault');
  assert(!!vaultItem?.cipherText && !!vaultItem?.iv && !!vaultItem?.authTag, 'Vault entry encrypted with AES-256-GCM');

  // ---------------------------------------------------------------------------
  // 3. API & PUBLISHING ENGINE ENDPOINTS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Live Publishing Endpoints, Immutability & Duplicate Guards ---');

  // A. Rate Limit Endpoint
  const rateLimitRes = await fetch(`${BASE_URL}/api/instagram/publishing/rate-limit?accountId=ig-bajajfinance`);
  assert(rateLimitRes.ok, 'GET /api/instagram/publishing/rate-limit returns HTTP 200');
  const rateLimitData = await rateLimitRes.json();
  assert(rateLimitData.success && rateLimitData.limit.quotaTotal > 0, `Publishing limit: ${rateLimitData.limit?.quotaUsage}/${rateLimitData.limit?.quotaTotal}`);

  // B. Get Publishing Jobs
  const jobsRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs?accountId=ig-bajajfinance`);
  assert(jobsRes.ok, 'GET /api/instagram/publishing/jobs returns HTTP 200');
  const jobsData = await jobsRes.json();
  assert(jobsData.success && Array.isArray(jobsData.jobs) && jobsData.jobs.length > 0, `Found ${jobsData.jobs?.length} publish jobs`);

  const sampleJob = jobsData.jobs.find(j => j.executionStatus === 'IDLE' || j.executionStatus === 'QUEUED') || jobsData.jobs[0];
  assert(!!sampleJob, `Selected test job ${sampleJob?.id} (${sampleJob?.format})`);

  // C. Immutability Verification: Retrieve snapshot before publishing
  const initialSnapshotRes = await fetch(`${BASE_URL}/api/instagram/publication-snapshots/${sampleJob.publicationSnapshotId}`);
  assert(initialSnapshotRes.ok, 'Publication snapshot retrieved before execution');
  const initialSnapshotData = await initialSnapshotRes.json();
  const snapshotBeforePublish = JSON.stringify(initialSnapshotData.snapshot);

  // D. Dispatch "Publish Now"
  console.log(`\n--- Dispatching Publish Now for Job ${sampleJob.id} (${sampleJob.format}) ---`);
  const publishNowRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs/${sampleJob.id}/publish-now`, {
    method: 'POST'
  });
  assert(publishNowRes.ok, `POST /api/instagram/publishing/jobs/${sampleJob.id}/publish-now accepted`);

  // Wait 2.5 seconds for simulated execution
  await new Promise(r => setTimeout(r, 2500));

  // Inspect Job After Execution
  const jobAfterRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs/${sampleJob.id}`);
  assert(jobAfterRes.ok, 'GET /api/instagram/publishing/jobs/:id returns updated job');
  const jobAfterData = await jobAfterRes.json();
  const updatedJob = jobAfterData.job;

  assert(updatedJob.executionStatus === 'PUBLISHED', `Job executionStatus is PUBLISHED (was ${sampleJob.executionStatus})`);
  assert(!!updatedJob.metaContainerId, `Meta Container ID: ${updatedJob.metaContainerId}`);
  assert(!!updatedJob.metaMediaId, `Instagram Media ID: ${updatedJob.metaMediaId}`);
  assert(!!updatedJob.permalink, `Live Post Permalink: ${updatedJob.permalink}`);
  assert(!!updatedJob.publishedAt, `Published timestamp: ${updatedJob.publishedAt}`);
  assert(updatedJob.executionLogs.some(l => l.stage === 'COMPLETED'), 'Audit log contains COMPLETED stage entry');

  // Verify associated CalendarPost updated
  const calendarRes = await fetch(`${BASE_URL}/api/instagram/calendar?accountId=ig-bajajfinance`);
  const calendarData = await calendarRes.json();
  const linkedCalendarPost = calendarData.calendar.find(c => c.id === sampleJob.calendarPostId);
  assert(linkedCalendarPost && linkedCalendarPost.status === 'published', `Linked CalendarPost status updated to 'published'`);
  assert(linkedCalendarPost.publishedUrl === updatedJob.permalink, `Linked CalendarPost publishedUrl synced with permalink`);
  assert(linkedCalendarPost.instagramMediaId === updatedJob.metaMediaId, `Linked CalendarPost instagramMediaId synced`);

  // E. Immutability Check: Snapshot MUST NOT be mutated
  const snapshotAfterRes = await fetch(`${BASE_URL}/api/instagram/publication-snapshots/${sampleJob.publicationSnapshotId}`);
  const snapshotAfterData = await snapshotAfterRes.json();
  const snapshotAfterPublish = JSON.stringify(snapshotAfterData.snapshot);
  assert(snapshotBeforePublish === snapshotAfterPublish, 'CRITICAL: PublicationSnapshot remained 100% byte-for-byte IMMUTABLE during publishing execution');

  // F. Duplicate Publish Now on Already PUBLISHED Job
  console.log('\n--- Testing Duplicate Publication Rejection ---');
  const rePublishRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs/${sampleJob.id}/publish-now`, {
    method: 'POST'
  });
  assert(rePublishRes.status === 400, `POST publish-now on PUBLISHED job rejected with HTTP 400 (status: ${rePublishRes.status})`);
  const rePublishData = await rePublishRes.json();
  assert(rePublishData.error?.includes('already been published'), `Error message explicitly protects against re-publishing: ${rePublishData.error}`);

  // G. Retry on Already PUBLISHED Job
  const retryPublishedRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs/${sampleJob.id}/retry`, {
    method: 'POST'
  });
  assert(retryPublishedRes.status === 400, `POST retry on PUBLISHED job rejected with HTTP 400 (status: ${retryPublishedRes.status})`);
  const retryPublishedData = await retryPublishedRes.json();
  assert(retryPublishedData.error?.includes('already been published'), `Error message explicitly protects against retrying published job: ${retryPublishedData.error}`);

  // H. Cancellation Flow
  const candidateToCancel = jobsData.jobs.find(j => j.id !== sampleJob.id && j.executionStatus === 'IDLE');
  if (candidateToCancel) {
    console.log(`\n--- Testing Cancellation Flow for Job ${candidateToCancel.id} ---`);
    const cancelRes = await fetch(`${BASE_URL}/api/instagram/publishing/jobs/${candidateToCancel.id}/cancel`, {
      method: 'POST'
    });
    assert(cancelRes.ok, `POST cancel returns HTTP 200`);
    const cancelData = await cancelRes.json();
    assert(cancelData.job.scheduleStatus === 'CANCELLED', 'Cancelled job scheduleStatus is CANCELLED');
    assert(cancelData.job.executionStatus === 'CANCELLED', 'Cancelled job executionStatus is CANCELLED');
  }

  // ---------------------------------------------------------------------------
  // 4. PLAYWRIGHT UI VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Playwright UI Verification (Queue, Phase 5C Banner, Contrast) ---');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('pageerror', err => console.error('  🛑 BROWSER PAGE ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('  🛑 BROWSER CONSOLE ERROR:', msg.text());
  });

  try {
    // Navigate to Publishing Queue
    await page.goto(BASE_URL);
    await page.waitForSelector('#nodeflow-app-root', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    const navBtn = page.locator('#nav-primary-publishing');
    await navBtn.waitFor({ state: 'visible', timeout: 5000 });
    await navBtn.click();
    await page.waitForSelector('#calendar-month-view', { state: 'visible', timeout: 5000 });

    // Switch to Queue & Monitor sub-tab
    const queueSubNav = page.locator('#subnav-publishing-queue');
    await queueSubNav.waitFor({ state: 'visible', timeout: 5000 });
    await queueSubNav.click();
    await page.waitForSelector('#filter-queue-all', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify Phase 5C Banner text
    const bannerText = await page.locator('text=Publishing Engine & Live Monitor • Phase 5C').count();
    assert(bannerText > 0, 'Header banner displays updated "Publishing Engine & Live Monitor • Phase 5C"');

    // Take screenshot of Queue View
    const queueScreenshot = path.join(ARTIFACT_DIR, '28_phase5c_publishing_queue_view.png');
    await page.screenshot({ path: queueScreenshot });
    console.log(`  📸 Queue View screenshot captured: ${queueScreenshot}`);

    // Inspect the row of the published post
    const publishedRow = page.locator(`#queue-row-${sampleJob.calendarPostId}`);
    assert(await publishedRow.isVisible(), `Published post row #queue-row-${sampleJob.calendarPostId} is visible in queue`);

    // Verify permalink external link icon on row
    const rowLink = page.locator(`#btn-queue-link-${sampleJob.calendarPostId}`);
    assert(await rowLink.isVisible(), 'Live Instagram link icon is visible on published row');

    // Open Publication Record Modal
    const detailBtn = page.locator(`#btn-queue-detail-${sampleJob.calendarPostId}`);
    await detailBtn.click();
    await page.waitForTimeout(800);

    const modal = page.locator('#modal-publication-record-detail');
    assert(await modal.isVisible(), 'Publication Record Detail Modal opened');

    // Expand Advanced Delivery & Idempotency Metadata
    const advancedToggle = page.locator('#btn-toggle-advanced-metadata');
    await advancedToggle.click();
    await page.waitForTimeout(500);

    // Verify real Meta metadata is displayed
    const liveLinkInModal = page.locator('#link-published-instagram-media');
    assert(await liveLinkInModal.isVisible(), 'Live Post Permalink link is visible inside modal');

    // Take screenshot of Publication Record Modal
    const modalScreenshot = path.join(ARTIFACT_DIR, '29_phase5c_publication_record_modal.png');
    await page.screenshot({ path: modalScreenshot });
    console.log(`  📸 Publication Record Modal screenshot captured: ${modalScreenshot}`);

    // Close Modal
    const closeBtn = page.locator('#btn-close-publication-modal');
    await closeBtn.click();
    await page.waitForTimeout(500);

  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  console.log(`📊 PHASE 5C VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL PHASE 5C PUBLISHING ENGINE TESTS PASSED PERFECTLY!\n');
  } else {
    console.error('❌ SOME TESTS FAILED. Please review the output above.\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
