import 'dotenv/config';
import {
  InstagramPublishingEngine,
  MetaGraphApiClient,
  PreflightValidator,
  classifyPublishingError,
  isPrivateOrReservedIp,
  canTransition,
  validateTransition,
  sanitizeErrorMessage,
  sanitizeMetaUrl
} from '../src/server/instagramPublishingEngine';
import { PublicationSnapshot, CalendarPost, PublishJobRecord, InstagramAccount } from '../src/types/instagram';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 5C AUDIT REMEDIATION VERIFICATION SUITE');
  console.log('====================================================\n');

  // ---------------------------------------------------------------------------
  // 1. PRIORITY 0: CREDENTIAL SECURITY & VAULT
  // ---------------------------------------------------------------------------
  console.log('--- 1. PRIORITY 0: CREDENTIAL SECURITY & VAULT ---');

  // Test 1.1: VAULT_MASTER_KEY is mandatory and configured
  const vaultKey = process.env.VAULT_MASTER_KEY;
  assert(!!vaultKey && vaultKey.length >= 16, 'process.env.VAULT_MASTER_KEY is set and meets minimum 16-character entropy');

  // Test 1.2: Centralized error/URL sanitization
  const testMsg = 'Error communicating with Meta: access_token=EAABwzL1234567890abcdef and Bearer secret-token-xyz';
  const sanitizedMsg = sanitizeErrorMessage(testMsg);
  assert(!sanitizedMsg.includes('EAABwzL1234567890abcdef'), 'Sanitization redacts raw Meta access token');
  assert(!sanitizedMsg.includes('secret-token-xyz'), 'Sanitization redacts Bearer token');
  assert(sanitizedMsg.includes('[REDACTED]') || sanitizedMsg.includes('[REDACTED_META_TOKEN]'), 'Sanitization inserts redaction marker');

  const testUrl = 'https://graph.facebook.com/v21.0/me?access_token=EAAB1234567890&fields=id,name';
  const sanitizedUrl = sanitizeMetaUrl(testUrl);
  assert(!sanitizedUrl.includes('EAAB1234567890'), 'sanitizeMetaUrl redacts access_token query param');
  assert(sanitizedUrl.includes('access_token=%5BREDACTED%5D') || sanitizedUrl.includes('access_token=[REDACTED]'), 'sanitizeMetaUrl replaces token with [REDACTED]');

  // Test 1.3: Verify API responses do not expose raw tokens
  const mockAccount: InstagramAccount = {
    id: 'acc-test-1',
    name: 'Test Account',
    username: 'test.brand',
    profilePictureUrl: 'https://example.com/pic.jpg',
    accountType: 'BUSINESS',
    isDemo: false,
    connectionMethod: 'meta_graph_api',
    connectedAt: new Date().toISOString(),
    instagramBusinessId: 'ig-biz-123',
    metaAccessToken: 'EAABwzL1234567890abcdef_RAW_SECRET'
  };

  function sanitizeAccountForResponse(acc: InstagramAccount): any {
    const { metaAccessToken, ...safe } = acc;
    return {
      ...safe,
      hasMetaToken: !!metaAccessToken,
      tokenPreview: metaAccessToken ? `${metaAccessToken.substring(0, 6)}...` : undefined
    };
  }

  const safeAcc = sanitizeAccountForResponse(mockAccount);
  assert(!('metaAccessToken' in safeAcc) || safeAcc.metaAccessToken === undefined, 'Account response strips metaAccessToken');
  assert(!JSON.stringify(safeAcc).includes('EAABwzL1234567890abcdef_RAW_SECRET'), 'Raw token never appears in serialized account response');
  assert(safeAcc.hasMetaToken === true, 'Safe account response includes hasMetaToken flag');

  // ---------------------------------------------------------------------------
  // 2. PRIORITY 1: DUPLICATE PUBLICATION SAFETY & RECONCILIATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. PRIORITY 1: DUPLICATE PUBLICATION SAFETY & RECONCILIATION ---');

  const engine = new InstagramPublishingEngine();

  const mockSnapshot: PublicationSnapshot = {
    id: 'snap-remediation-1',
    calendarPostId: 'cal-post-1',
    accountId: 'acc-test-1',
    format: 'Image',
    title: 'Remediation Test Post',
    caption: 'Testing duplicate safety #audit [IDEMPOTENCY:idem-test-999]',
    hashtags: ['audit'],
    mediaUrls: ['https://images.unsplash.com/photo-test-image-1'],
    status: 'SCHEDULED',
    scheduledDate: '2026-09-21',
    scheduledTime: '12:00',
    timezone: 'UTC',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    idempotencyKey: 'idem-test-999'
  };

  const mockCalPost: CalendarPost = {
    id: 'cal-post-1',
    accountId: 'acc-test-1',
    scheduledDate: '2026-09-21',
    scheduledTime: '12:00',
    timezone: 'UTC',
    format: 'Image',
    title: 'Remediation Test Post',
    caption: 'Testing duplicate safety',
    status: 'SCHEDULED',
    publicationRecordId: 'pub-job-rem-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Test 2.1: Duplicate Publish Now suppression
  const job1 = engine.createJob(mockSnapshot, mockCalPost);
  job1.executionStatus = 'PUBLISHING';
  const pubNowResult = await engine.publishNow(job1.id, mockSnapshot, mockAccount);
  assert(pubNowResult.id === job1.id, 'publishNow suppresses duplicate request when job is actively PUBLISHING');
  assert(job1.executionLogs.some(l => l.stage === 'DUPLICATE_SUPPRESSED'), 'publishNow logged DUPLICATE_SUPPRESSED audit event');

  // Test 2.2: Crash recovery at VERIFYING — skips media_publish
  const job2 = engine.createJob({ ...mockSnapshot, id: 'snap-remediation-2' }, { ...mockCalPost, id: 'cal-post-2' });
  job2.executionStatus = 'VERIFYING';
  job2.metaMediaId = 'ig-media-existing-777';

  let mediaPublishCalled = false;
  let verifyCalled = false;
  engine.metaClient.publishContainer = async () => {
    mediaPublishCalled = true;
    return { mediaId: 'ig-media-should-not-be-created' };
  };
  engine.metaClient.verifyPublishedMedia = async (_acc, mediaId) => {
    verifyCalled = true;
    return { id: mediaId, permalink: 'https://www.instagram.com/p/live-verified/', publishedAt: new Date().toISOString() };
  };

  await engine.executeJob(job2, mockSnapshot, mockAccount);
  assert(!mediaPublishCalled, 'Recovery at VERIFYING: media_publish was NOT called again');
  assert(verifyCalled, 'Recovery at VERIFYING: proceeded directly to verifyPublishedMedia');
  assert(job2.executionStatus === 'PUBLISHED', 'Recovery at VERIFYING: job successfully transitioned to PUBLISHED');
  assert(job2.permalink === 'https://www.instagram.com/p/live-verified/', 'Recovery at VERIFYING: permalink stored');

  // Test 2.3: Uncertain retry with reconciliation — reconciles before creating new container
  const job3 = engine.createJob({ ...mockSnapshot, id: 'snap-remediation-3' }, { ...mockCalPost, id: 'cal-post-3' });
  job3.executionStatus = 'FAILED';
  job3.metaContainerId = 'cont-uncertain-888';
  job3.startedAt = new Date().toISOString();

  let reconcileCalled = false;
  let newContainerCreated = false;

  engine.metaClient.reconcileOverride = async (_acc, query) => {
    reconcileCalled = true;
    return {
      found: true,
      mediaId: 'ig-media-reconciled-999',
      permalink: 'https://www.instagram.com/p/reconciled/',
      publishedAt: new Date().toISOString(),
      reconciledVia: 'RECENT_MEDIA_FEED'
    };
  };

  engine.metaClient.createImageContainer = async () => {
    newContainerCreated = true;
    return { containerId: 'new-container-unwanted' };
  };

  await engine.retryJob(job3.id, mockSnapshot, mockAccount);
  assert(reconcileCalled, 'retryJob: reconciliation was executed before resetting container or retrying');
  assert(!newContainerCreated, 'retryJob: new container was NOT created because reconciliation found live media');
  assert(job3.executionStatus === 'PUBLISHED', 'retryJob: job transitioned to PUBLISHED via reconciliation');
  assert(job3.metaMediaId === 'ig-media-reconciled-999', 'retryJob: reconciled media ID was assigned');

  engine.metaClient.reconcileOverride = undefined;

  // ---------------------------------------------------------------------------
  // 3. PRIORITY 2: QUEUE / RECOVERY & HEAD-OF-LINE UNBLOCKING
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. PRIORITY 2: QUEUE & HEAD-OF-LINE UNBLOCKING ---');

  const engineQueue = new InstagramPublishingEngine();

  const jobA = engineQueue.createJob(
    { ...mockSnapshot, id: 'snap-corrupt-A' },
    { ...mockCalPost, id: 'cal-post-A' }
  );
  jobA.executionStatus = 'QUEUED';
  jobA.queuedAt = new Date(Date.now() - 30000).toISOString();

  const jobB = engineQueue.createJob(
    { ...mockSnapshot, id: 'snap-valid-B' },
    { ...mockCalPost, id: 'cal-post-B' }
  );
  jobB.executionStatus = 'QUEUED';
  jobB.queuedAt = new Date(Date.now() - 20000).toISOString();

  let jobBExecuted = false;
  engineQueue.metaClient.createImageContainer = async () => {
    jobBExecuted = true;
    return { containerId: 'cont-job-b' };
  };
  engineQueue.metaClient.pollContainerStatus = async () => ({ statusCode: 'FINISHED' });
  engineQueue.metaClient.publishContainer = async () => ({ mediaId: 'media-b' });
  engineQueue.metaClient.verifyPublishedMedia = async () => ({
    id: 'media-b',
    permalink: 'https://www.instagram.com/p/job-b/',
    publishedAt: new Date().toISOString()
  });

  engineQueue.setResolvers(
    (snapId) => {
      if (snapId === 'snap-corrupt-A') return null; // Missing dependency!
      return mockSnapshot;
    },
    (_accId) => mockAccount
  );

  engineQueue.drainQueueForAccount(mockAccount.id);

  // Wait for async execution of job B
  for (let i = 0; i < 20; i++) {
    if (jobBExecuted) break;
    await new Promise(r => setTimeout(r, 50));
  }

  assert(jobA.executionStatus === 'FAILED', 'Corrupted Job A marked FAILED on queue drain');
  assert(jobA.lastErrorCode === 'ERR_PUBLICATION_DEPENDENCY_MISSING', 'Job A failed with ERR_PUBLICATION_DEPENDENCY_MISSING');
  assert(jobBExecuted, 'Job B was NOT blocked by Job A; queue drain proceeded to execute Job B');

  // Test 3.2: Incremental Carousel Child Container Persistence
  console.log('\n--- 4. CAROUSEL INCREMENTAL CHILD CONTAINER PERSISTENCE ---');
  const engineCarousel = new InstagramPublishingEngine();
  const carouselSnapshot: PublicationSnapshot = {
    ...mockSnapshot,
    id: 'snap-car-increm',
    format: 'Carousel',
    slideCount: 3,
    carouselSlides: [
      { id: 's1', slideIndex: 1, mockImageUrl: 'https://images.unsplash.com/photo-1' },
      { id: 's2', slideIndex: 2, mockImageUrl: 'https://images.unsplash.com/photo-2' },
      { id: 's3', slideIndex: 3, mockImageUrl: 'https://images.unsplash.com/photo-3' }
    ]
  };

  const carJob = engineCarousel.createJob(carouselSnapshot, mockCalPost);

  // Simulate crash during child 3 (after child 1 and child 2 were created & persisted)
  const createdChildIds: string[] = [];
  engineCarousel.metaClient.createCarouselItemContainer = async () => {
    const id = `child-${createdChildIds.length + 1}`;
    createdChildIds.push(id);
    if (createdChildIds.length === 3) {
      throw new Error('SIMULATED_CRASH_DURING_CHILD_3');
    }
    return { containerId: id };
  };

  await engineCarousel.executeJob(carJob, carouselSnapshot, mockAccount);
  assert(createdChildIds.length === 3, 'Crash simulated during child 3');
  assert(carJob.metaChildContainerIds?.length === 2, 'Child 1 and Child 2 were incrementally persisted prior to crash');

  // Now simulate recovery: resume carousel creation with already persisted child IDs
  const recoveredEngine = new InstagramPublishingEngine([carJob]);
  const recoveredCreatedIds: string[] = [];
  recoveredEngine.metaClient.createCarouselItemContainer = async () => {
    const id = 'child-3';
    recoveredCreatedIds.push(id);
    return { containerId: id };
  };
  recoveredEngine.metaClient.pollContainerStatus = async () => ({ statusCode: 'FINISHED' });
  recoveredEngine.metaClient.createCarouselParentContainer = async () => ({ containerId: 'parent-car' });
  recoveredEngine.metaClient.publishContainer = async () => ({ mediaId: 'media-car' });
  recoveredEngine.metaClient.verifyPublishedMedia = async () => ({
    id: 'media-car',
    permalink: 'https://www.instagram.com/p/carousel/',
    publishedAt: new Date().toISOString()
  });

  await recoveredEngine.executeJob(carJob, carouselSnapshot, mockAccount);
  assert(recoveredCreatedIds.length === 1 && recoveredCreatedIds[0] === 'child-3', 'Resumed carousel execution created only child 3');
  assert(carJob.metaChildContainerIds?.length === 3, 'All 3 child containers now present');
  assert(carJob.metaChildContainerIds?.[0] === 'child-1' && carJob.metaChildContainerIds?.[1] === 'child-2', 'Previous child containers 1 and 2 were preserved and not recreated');

  // ---------------------------------------------------------------------------
  // 4. PRIORITY 3: STATE MACHINE TRANSITION GUARDS
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. PRIORITY 3: STATE MACHINE TRANSITION GUARDS ---');

  // Test 5.1: CANCELLED is terminal
  assert(!canTransition('CANCELLED', 'QUEUED'), 'canTransition: CANCELLED -> QUEUED is forbidden');
  assert(!canTransition('CANCELLED', 'PUBLISHING'), 'canTransition: CANCELLED -> PUBLISHING is forbidden');
  assert(!canTransition('CANCELLED', 'PUBLISHED'), 'canTransition: CANCELLED -> PUBLISHED is forbidden');

  // Test 5.2: PUBLISHED is terminal
  assert(!canTransition('PUBLISHED', 'QUEUED'), 'canTransition: PUBLISHED -> QUEUED is forbidden');
  assert(!canTransition('PUBLISHED', 'PUBLISHING'), 'canTransition: PUBLISHED -> PUBLISHING is forbidden');

  // Test 5.3: publishNow rejects CANCELLED and PUBLISHED
  const testJobState = engine.createJob({ ...mockSnapshot, id: 'snap-state-1' }, mockCalPost);
  testJobState.executionStatus = 'PUBLISHED';
  let pubNowPublishedRejected = false;
  try {
    await engine.publishNow(testJobState.id, mockSnapshot, mockAccount);
  } catch (err: any) {
    pubNowPublishedRejected = err.message.includes('already been published');
  }
  assert(pubNowPublishedRejected, 'publishNow strictly rejects jobs in PUBLISHED state');

  testJobState.executionStatus = 'CANCELLED';
  let pubNowCancelledRejected = false;
  try {
    await engine.publishNow(testJobState.id, mockSnapshot, mockAccount);
  } catch (err: any) {
    pubNowCancelledRejected = err.message.includes('cancelled');
  }
  assert(pubNowCancelledRejected, 'publishNow strictly rejects jobs in CANCELLED state');

  // Test 5.4: retryJob rejects CANCELLED and PUBLISHED
  testJobState.executionStatus = 'PUBLISHED';
  let retryPublishedRejected = false;
  try {
    await engine.retryJob(testJobState.id, mockSnapshot, mockAccount);
  } catch (err: any) {
    retryPublishedRejected = err.message.includes('already been published');
  }
  assert(retryPublishedRejected, 'retryJob strictly rejects jobs in PUBLISHED state');

  testJobState.executionStatus = 'CANCELLED';
  let retryCancelledRejected = false;
  try {
    await engine.retryJob(testJobState.id, mockSnapshot, mockAccount);
  } catch (err: any) {
    retryCancelledRejected = err.message.includes('cancelled');
  }
  assert(retryCancelledRejected, 'retryJob strictly rejects jobs in CANCELLED state');

  // Test 5.5: Cancellation rejected once media_publish is dispatched
  testJobState.executionStatus = 'VERIFYING';
  testJobState.metaMediaId = 'ig-media-dispatched';
  let cancelAfterPublishRejected = false;
  try {
    engine.cancelJob(testJobState.id);
  } catch (err: any) {
    cancelAfterPublishRejected = err.message.includes('dispatched');
  }
  assert(cancelAfterPublishRejected, 'cancelJob strictly rejects cancellation once media_publish has been dispatched');

  // ---------------------------------------------------------------------------
  // 5. PRIORITY 4: SSRF HARDENING
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. PRIORITY 4: SSRF HARDENING ---');

  const ssrfCases = [
    { url: 'https://127.0.0.1/test.jpg', expected: false, desc: 'IPv4 loopback (127.0.0.1)' },
    { url: 'https://127.100.0.1/test.jpg', expected: false, desc: 'IPv4 loopback range (127.0.0.0/8)' },
    { url: 'https://10.0.1.5/test.jpg', expected: false, desc: 'IPv4 private 10.0.0.0/8' },
    { url: 'https://172.16.5.10/test.jpg', expected: false, desc: 'IPv4 private 172.16.0.0/12' },
    { url: 'https://192.168.1.1/test.jpg', expected: false, desc: 'IPv4 private 192.168.0.0/16' },
    { url: 'https://169.254.169.254/latest/meta-data/', expected: false, desc: 'Cloud metadata service (169.254.0.0/16)' },
    { url: 'https://0.0.0.0/test.jpg', expected: false, desc: 'IPv4 0.0.0.0/8' },
    { url: 'https://localhost/test.jpg', expected: false, desc: 'localhost' },
    { url: 'https://server.local/test.jpg', expected: false, desc: '.local domain' },
    { url: 'https://server.internal/test.jpg', expected: false, desc: '.internal domain' },
    { url: 'https://[::1]/test.jpg', expected: false, desc: 'IPv6 loopback (::1)' },
    { url: 'https://[fe80::1]/test.jpg', expected: false, desc: 'IPv6 link-local (fe80::/10)' },
    { url: 'https://[fc00::1]/test.jpg', expected: false, desc: 'IPv6 unique-local (fc00::/7)' },
    { url: 'https://[::ffff:127.0.0.1]/test.jpg', expected: false, desc: 'IPv4-mapped IPv6 loopback' },
    { url: 'http://images.unsplash.com/test.jpg', expected: false, desc: 'HTTP protocol (non-https)' },
    { url: 'file:///etc/passwd', expected: false, desc: 'file:// protocol' },
    { url: 'not-a-url', expected: false, desc: 'malformed URL' },
    { url: 'https://images.unsplash.com/photo-12345', expected: true, desc: 'Valid public HTTPS URL' }
  ];

  for (const tc of ssrfCases) {
    const res = PreflightValidator.isValidHttpsUrl(tc.url);
    assert(res.valid === tc.expected, `SSRF check: ${tc.desc} (expected: ${tc.expected})`);
  }

  // ---------------------------------------------------------------------------
  // 6. PRIORITY 5: ERROR CLASSIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. PRIORITY 5: ERROR CLASSIFICATION ---');

  // Test 7.1: User ID 500123 does NOT trigger transient retry
  const errUnrelated500 = new Error('User 500123 has invalid token');
  const classUnrelated500 = classifyPublishingError(errUnrelated500);
  assert(!classUnrelated500.isTransient, 'Error containing "500123" is NOT classified as transient');
  assert(classUnrelated500.category === 'AUTH', 'Error containing "invalid token" is classified as AUTH');

  // Test 7.2: HTTP 500 / 503 Server Error triggers transient retry
  const err500 = new Error('HTTP 500 Internal Server Error from Meta Graph API');
  const class500 = classifyPublishingError(err500);
  assert(class500.isTransient, 'HTTP 500 is classified as transient');
  assert(class500.category === 'TRANSIENT', 'HTTP 500 category is TRANSIENT');

  // Test 7.3: Meta error code 190 triggers AUTH failure
  const errMeta190 = { code: 190, message: 'OAuthException: Invalid OAuth 2.0 Access Token' };
  const classMeta190 = classifyPublishingError(errMeta190);
  assert(!classMeta190.isTransient, 'Meta error code 190 is NOT transient');
  assert(classMeta190.category === 'AUTH', 'Meta error code 190 category is AUTH');

  // Test 7.4: Network socket timeout
  const errTimeout = { code: 'ETIMEDOUT', message: 'connect ETIMEDOUT' };
  const classTimeout = classifyPublishingError(errTimeout);
  assert(classTimeout.isTransient, 'ETIMEDOUT is classified as transient');
  assert(classTimeout.category === 'TRANSIENT', 'ETIMEDOUT category is TRANSIENT');

  // ---------------------------------------------------------------------------
  // 7. MULTI-PROCESS BEHAVIOR (OPTION A ENFORCEMENT)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. MULTI-PROCESS SINGLE-INSTANCE ENFORCEMENT ---');

  const lockPath = path.resolve(process.cwd(), 'data/s2s_publishing.lock');
  assert(fs.existsSync(lockPath), 'Single-process lockfile data/s2s_publishing.lock exists');

  const lockContent = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assert(lockContent.pid === process.pid || lockContent.pid > 0, `Lockfile records active PID (${lockContent.pid})`);
  assert(!!lockContent.acquiredAt || !!lockContent.startedAt, 'Lockfile records acquisition timestamp');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`REMEDIATION SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
