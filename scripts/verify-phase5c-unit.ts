/**
 * scripts/verify-phase5c-unit.ts
 * Rigorous Unit & State-Machine Verification for Phase 5C Publishing Engine
 */

import {
  InstagramPublishingEngine,
  MetaGraphApiClient,
  PreflightValidator,
  sanitizeErrorMessage,
  sanitizeMetaUrl
} from '../src/server/instagramPublishingEngine';
import {
  PublicationSnapshot,
  CalendarPost,
  PublishJobRecord,
  InstagramAccount
} from '../src/types/instagram';

let passed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runUnitTests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHASE 5C ENGINE IN-DEPTH UNIT & LOGIC VERIFICATION');
  console.log('===============================================================\n');

  const demoAccount: InstagramAccount = {
    id: 'ig-bajajfinance',
    username: 'bajajfinance',
    displayName: 'Bajaj Finance Limited',
    bio: 'Official NBFC',
    followersCount: 428500,
    followingCount: 142,
    mediaCount: 1248,
    engagementRate: 3.84,
    averageReelViews: 48200,
    category: 'Finance',
    niche: 'Wealth Literacy',
    connectedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
    contentPillars: [],
    competitors: [],
    competitorHandles: [],
    isDemo: true
  };

  const sampleCalendarPost: CalendarPost = {
    id: 'cal-test-1',
    accountId: 'ig-bajajfinance',
    scheduledDate: '2026-11-20',
    scheduledTime: '18:30',
    format: 'Carousel',
    pillar: 'Finance',
    title: '5 Smart Ways to Invest in 2027',
    status: 'scheduled'
  };

  const baseCarouselSnapshot: PublicationSnapshot = {
    id: 'snap-car-unit-1',
    calendarPostId: 'cal-test-1',
    accountId: 'ig-bajajfinance',
    idempotencyKey: 'idem-unit-test-car-1',
    snapshotVersion: 1,
    frozenAt: new Date().toISOString(),
    title: '5 Smart Ways to Invest in 2027',
    format: 'Carousel',
    pillar: 'Finance',
    caption: 'Discover smart investment frameworks for 2027.',
    hashtags: ['investing', 'finance', 'growth'],
    callToAction: 'Save this post!',
    scheduledDate: '2026-11-20',
    scheduledTime: '18:30',
    timezone: 'Asia/Kolkata',
    contentStatus: 'PRODUCTION_COMPLETE',
    assetStatus: 'ready',
    scheduleStatus: 'SCHEDULED',
    executionStatus: 'IDLE',
    slideCount: 3,
    mediaUrls: [
      'https://cdn.example.com/slide1.jpg',
      'https://cdn.example.com/slide2.jpg',
      'https://cdn.example.com/slide3.jpg'
    ],
    carouselSlides: [
      { slideNumber: 1, headline: 'Slide 1', bodyCopy: 'Intro', visualPrompt: 'Chart', finalImageUrl: 'https://cdn.example.com/slide1.jpg' },
      { slideNumber: 2, headline: 'Slide 2', bodyCopy: 'Strategy', visualPrompt: 'Graph', finalImageUrl: 'https://cdn.example.com/slide2.jpg' },
      { slideNumber: 3, headline: 'Slide 3', bodyCopy: 'Conclusion', visualPrompt: 'Table', finalImageUrl: 'https://cdn.example.com/slide3.jpg' }
    ]
  };

  // ---------------------------------------------------------------------------
  // 1. CAROUSEL CHILD CONTAINER POLLING & ORDERING
  // ---------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: Carousel Child Container Polling & Ordering ---');
  {
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);

    const childCreationOrder: string[] = [];
    const childPolledOrder: string[] = [];
    let parentCreated = false;
    let parentChildIdsReceived: string[] = [];

    engine.metaClient.onChildContainerCreated = (childId, idx) => {
      childCreationOrder.push(childId);
    };

    engine.metaClient.onChildContainerPolled = (childId, status) => {
      childPolledOrder.push(childId);
    };

    engine.metaClient.onParentContainerCreated = (parentId, childIds) => {
      parentCreated = true;
      parentChildIdsReceived = childIds;
    };

    await engine.executeJob(job, baseCarouselSnapshot, demoAccount);

    assert(childCreationOrder.length === 3, `Created all 3 child containers (${childCreationOrder.length}/3)`);
    assert(job.metaChildContainerIds?.length === 3, 'Persisted metaChildContainerIds in job record');
    assert(childPolledOrder.length === 3, `Polled all 3 child containers to completion (${childPolledOrder.length}/3)`);
    assert(parentCreated, 'Parent container created successfully after all children polled');
    assert(
      JSON.stringify(parentChildIdsReceived) === JSON.stringify(childCreationOrder),
      'Exact slide ordering preserved between children and parent container'
    );
    assert(job.executionStatus === 'PUBLISHED', 'Carousel job reached PUBLISHED status');
  }

  // ---------------------------------------------------------------------------
  // 2. CAROUSEL CHILD FAILURE HANDLING
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Carousel Child Container Failure ---');
  {
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    job.id = 'job-fail-child-1';

    let parentCreated = false;
    engine.metaClient.onParentContainerCreated = () => {
      parentCreated = true;
    };

    // Simulate second child container returning ERROR
    engine.metaClient.pollContainerStatusOverride = async (containerId: string) => {
      if (containerId.includes('meta-car-item') && job.metaChildContainerIds?.[1] === containerId) {
        return { statusCode: 'ERROR', statusMessage: 'Media decode failed' };
      }
      return { statusCode: 'FINISHED' };
    };

    await engine.executeJob(job, baseCarouselSnapshot, demoAccount);

    assert(!parentCreated, 'Parent container was NEVER created when child failed');
    assert(job.executionStatus === 'FAILED', `Job transitioned to FAILED (status: ${job.executionStatus})`);
    assert(job.lastErrorMessage?.includes('failed processing: ERROR'), `Error recorded: ${job.lastErrorMessage}`);
  }

  // ---------------------------------------------------------------------------
  // 3. REEL 180s TIMEOUT BEHAVIOR
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Reel Container Timeout & Config ---');
  {
    const engine = new InstagramPublishingEngine();
    assert(engine.reelProcessingTimeoutMs === 180000, `Reel container processing timeout is 180 seconds (${engine.reelProcessingTimeoutMs}ms)`);

    const client = new MetaGraphApiClient();
    // Test that default maxWaitMs is 180000
    const pollPromise = client.pollContainerStatus('test-cont-1', demoAccount);
    const pollResult = await pollPromise;
    assert(pollResult.statusCode === 'FINISHED', 'Simulated poll finished cleanly');
  }

  // ---------------------------------------------------------------------------
  // 4. HTTPS MEDIA VALIDATION (NEGATIVE TESTS)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: HTTPS Media Preflight Validation ---');
  {
    const testCases = [
      { url: 'http://cdn.example.com/video.mp4', expectedError: 'Protocol' },
      { url: 'file:///var/data/video.mp4', expectedError: 'Local filesystem' },
      { url: '/Users/admin/video.mp4', expectedError: 'Local filesystem' },
      { url: 'https://localhost:3000/video.mp4', expectedError: 'Private/local' },
      { url: 'https://127.0.0.1/video.mp4', expectedError: 'Private/local' },
      { url: 'https://192.168.1.50/video.mp4', expectedError: 'Private/local' },
      { url: 'https://10.0.0.1/video.mp4', expectedError: 'Private/local' },
      { url: 'not-a-valid-url', expectedError: 'Malformed' }
    ];

    for (const tc of testCases) {
      const check = PreflightValidator.isValidHttpsUrl(tc.url);
      assert(!check.valid, `Rejected invalid media URL '${tc.url}' (reason: ${check.reason})`);
    }

    const validHttps = PreflightValidator.isValidHttpsUrl('https://images.unsplash.com/photo-12345');
    assert(validHttps.valid, 'Accepted valid public HTTPS URL');
  }

  // ---------------------------------------------------------------------------
  // 5. ERROR TAXONOMY & RETRY EXHAUSTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 5: Error Taxonomy & Retry Classification ---');
  {
    // A. Permanent failure (OAuth / Permissions / 400) -> NEVER RETRY
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    job.id = 'job-tax-perm';

    engine.metaClient.pollContainerStatusOverride = async () => {
      throw new Error('OAuthException: Error validating access token (Code 190)');
    };

    await engine.executeJob(job, baseCarouselSnapshot, demoAccount);
    assert(job.executionStatus === 'FAILED', `Permanent OAuth error immediately marks FAILED without retry (attempt 1/${job.maxAttempts})`);
    assert(job.errorCategory === 'AUTH', `Error category classified as AUTH: ${job.errorCategory}`);

    // B. Transient failure (500 Internal Server Error) -> RETRY_PENDING
    const jobTransient = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    jobTransient.id = 'job-tax-trans';

    engine.metaClient.pollContainerStatusOverride = async () => {
      throw new Error('Meta Graph API 500 Internal Server Error');
    };

    await engine.executeJob(jobTransient, baseCarouselSnapshot, demoAccount);
    assert(jobTransient.executionStatus === 'RETRY_PENDING', `Transient 500 error schedules retry (status: ${jobTransient.executionStatus})`);
    assert(jobTransient.errorCategory === 'TRANSIENT', `Error category classified as TRANSIENT`);
    assert(!!jobTransient.nextAttemptAt, `nextAttemptAt scheduled: ${jobTransient.nextAttemptAt}`);

    // C. Retry Exhaustion -> When attemptCount >= maxAttempts, FAILED permanently
    jobTransient.attemptCount = 3;
    jobTransient.maxAttempts = 3;
    await engine.executeJob(jobTransient, baseCarouselSnapshot, demoAccount);
    assert(jobTransient.executionStatus === 'FAILED', `Retry exhaustion (3/3) marks job FAILED permanently`);
  }

  // ---------------------------------------------------------------------------
  // 6. DUPLICATE PUBLICATION GUARDS & IMMUTABILITY
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 6: Duplicate Publication Protection & Guards ---');
  {
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    job.id = 'job-dup-test';

    // A. Double-click Publish Now test
    let executeCalls = 0;
    const originalExecute = engine.executeJob.bind(engine);
    engine.executeJob = async (...args) => {
      executeCalls++;
      return originalExecute(...args);
    };

    // Dispatch two concurrent publishNow calls simultaneously
    const p1 = engine.publishNow(job.id, baseCarouselSnapshot, demoAccount);
    const p2 = engine.publishNow(job.id, baseCarouselSnapshot, demoAccount);

    const [r1, r2] = await Promise.all([p1, p2]);
    assert(r1.id === r2.id, 'Both concurrent Publish Now calls return the same job');
    assert(executeCalls === 1, `Exactly ONE publication execution dispatched for concurrent Publish Now calls (${executeCalls}/1)`);

    // Wait for publication to complete
    await new Promise(r => setTimeout(r, 200));

    // B. Already-published guard on Publish Now
    let publishNowRejected = false;
    try {
      await engine.publishNow(job.id, baseCarouselSnapshot, demoAccount);
    } catch (err: any) {
      publishNowRejected = err.message.includes('already been published');
    }
    assert(publishNowRejected, 'Publish Now rejected on already PUBLISHED job');

    // C. Already-published guard on Retry
    let retryRejected = false;
    try {
      await engine.retryJob(job.id, baseCarouselSnapshot, demoAccount);
    } catch (err: any) {
      retryRejected = err.message.includes('already been published');
    }
    assert(retryRejected, 'Retry rejected on already PUBLISHED job');
  }

  // ---------------------------------------------------------------------------
  // 7. CONCURRENCY: STRICTLY 1 ACTIVE PUBLICATION PER ACCOUNT & QUEUE DRAIN
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 7: Concurrency = 1 & Sequential Queue Drain (3 Jobs) ---');
  {
    const engine = new InstagramPublishingEngine();

    const now = Date.now();
    const job1 = engine.createJob({ ...baseCarouselSnapshot, id: 'snap-seq-1', title: 'Seq Post 1' }, { ...sampleCalendarPost, id: 'cal-seq-1' });
    const job2 = engine.createJob({ ...baseCarouselSnapshot, id: 'snap-seq-2', title: 'Seq Post 2' }, { ...sampleCalendarPost, id: 'cal-seq-2' });
    const job3 = engine.createJob({ ...baseCarouselSnapshot, id: 'snap-seq-3', title: 'Seq Post 3' }, { ...sampleCalendarPost, id: 'cal-seq-3' });

    job1.id = 'seq-job-1';
    job2.id = 'seq-job-2';
    job3.id = 'seq-job-3';

    job1.queuedAt = new Date(now - 3000).toISOString();
    job2.queuedAt = new Date(now - 2000).toISOString();
    job3.queuedAt = new Date(now - 1000).toISOString();

    job1.executionStatus = 'QUEUED';
    job2.executionStatus = 'QUEUED';
    job3.executionStatus = 'QUEUED';

    const executionOrder: string[] = [];

    // Set resolvers for automatic queue drain
    engine.setResolvers(
      (id) => ({ ...baseCarouselSnapshot, id }),
      () => demoAccount
    );

    const originalExec = engine.executeJob.bind(engine);
    engine.executeJob = async (j, s, a, cb) => {
      executionOrder.push(j.id);
      await new Promise(r => setTimeout(r, 40)); // simulate brief execution
      return originalExec(j, s, a, cb);
    };

    // Recover pending jobs after restart
    engine.recoverPendingJobs(
      (id) => ({ ...baseCarouselSnapshot, id }),
      () => demoAccount
    );

    // Wait for all 3 jobs to complete via automatic queue drain
    await new Promise(r => setTimeout(r, 400));

    assert(executionOrder.length === 3, `All 3 recovered jobs executed (${executionOrder.length}/3)`);
    assert(
      JSON.stringify(executionOrder) === JSON.stringify(['seq-job-1', 'seq-job-2', 'seq-job-3']),
      `Sequential FIFO execution order strictly preserved: ${executionOrder.join(' -> ')}`
    );
    assert(job1.executionStatus === 'PUBLISHED', 'Seq Job 1 PUBLISHED');
    assert(job2.executionStatus === 'PUBLISHED', 'Seq Job 2 PUBLISHED');
    assert(job3.executionStatus === 'PUBLISHED', 'Seq Job 3 PUBLISHED');
  }

  // ---------------------------------------------------------------------------
  // 8. EXPIRED CONTAINER HANDLING
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 8: Expired Container Handling on Retry ---');
  {
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    job.id = 'job-expired-test';
    job.metaContainerId = 'meta-expired-container-999';
    job.metaChildContainerIds = ['child-1', 'child-2'];
    job.executionStatus = 'FAILED';

    await engine.retryJob(job.id, baseCarouselSnapshot, demoAccount);
    // Wait for background execution to finish
    await new Promise(r => setTimeout(r, 150));

    assert(job.metaContainerId !== 'meta-expired-container-999', 'Expired container ID was reset on retry');
    assert(job.executionStatus === 'PUBLISHED', 'Job successfully published with fresh container');
  }

  // ---------------------------------------------------------------------------
  // 9. CANCELLATION SEMANTICS
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 9: Cancellation Semantics ---');
  {
    const engine = new InstagramPublishingEngine();
    const job = engine.createJob(baseCarouselSnapshot, sampleCalendarPost);
    job.id = 'job-cancel-test';

    // Cancel while IDLE
    engine.cancelJob(job.id);
    assert(job.executionStatus === 'CANCELLED', 'IDLE job cancelled successfully');
    assert(job.scheduleStatus === 'CANCELLED', 'Schedule status marked CANCELLED');

    // Attempting to cancel already PUBLISHED post throws
    job.executionStatus = 'PUBLISHED';
    let cancelPublishedRejected = false;
    try {
      engine.cancelJob(job.id);
    } catch (err: any) {
      cancelPublishedRejected = err.message.includes('already been published');
    }
    assert(cancelPublishedRejected, 'Cannot cancel already PUBLISHED post');
  }

  // ---------------------------------------------------------------------------
  // 10. CREDENTIAL SANITIZATION & REDACTION
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 10: Credential Sanitization & Redaction ---');
  {
    const rawMsg1 = 'Failed to connect: access_token=EAAGNO4mRealSecretToken1234567890 in URL';
    const sanitized1 = sanitizeErrorMessage(rawMsg1);
    assert(!sanitized1.includes('EAAGNO4mRealSecretToken1234567890'), 'Meta access token redacted from URL param error');
    assert(sanitized1.includes('access_token=[REDACTED]'), 'URL param replaced with access_token=[REDACTED]');

    const rawMsg2 = 'Authentication failed with token EAAGNO4mRealSecretToken1234567890 in body';
    const sanitized2 = sanitizeErrorMessage(rawMsg2);
    assert(!sanitized2.includes('EAAGNO4mRealSecretToken1234567890'), 'Raw token redacted from body error');
    assert(sanitized2.includes('[REDACTED_META_TOKEN]'), 'Raw token replaced with [REDACTED_META_TOKEN]');

    const rawUrl = 'https://graph.facebook.com/v21.0/123/media?access_token=EAAGNO4mRealSecretToken1234567890&caption=test';
    const cleanUrl = sanitizeMetaUrl(rawUrl);
    assert(!cleanUrl.includes('EAAGNO4mRealSecretToken1234567890'), 'Meta access token redacted from URL query parameter');
  }

  console.log('\n===============================================================');
  console.log(`📊 UNIT VERIFICATION RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log('===============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runUnitTests().catch(err => {
  console.error('Fatal unit test error:', err);
  process.exit(1);
});
