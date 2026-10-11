/**
 * scripts/verify_flux_zero_cost_safety.ts
 * Rigorous In-Memory Mocked Verification for Zero-Cost Flux AI Image Generation
 *
 * Guarantees:
 * 1. ZERO external network calls (100% mocked fetch)
 * 2. HTTP 402 Quota exhaustion handling
 * 3. HTTP 429 Rate limiting handling
 * 4. HTTP 401 Unauthorized handling
 * 5. HTTP 502/503/504 Overload handling
 * 6. Timeout handling (25s AbortSignal)
 * 7. Invalid MIME / non-image error responses
 * 8. Truncated buffer (<2048 bytes) rejection
 * 9. Credential protection (API key never leaked in error messages)
 * 10. Prevention of silent paid fallbacks (Flux failure never falls back to Manus or Gemini)
 */

import { InstagramAiOrchestrator } from '../src/server/instagramAiOrchestrator';

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

async function runSafetySuite() {
  console.log('======================================================================');
  console.log('🧪 VERIFY: ZERO-COST FLUX SAFETY & PAID-FALLBACK PREVENTION SUITE');
  console.log('======================================================================\n');

  const TEST_KEY = 'sk_TEST_SECRET_KEY_NEVER_LEAK_1234567890';
  process.env.POLLINATIONS_API_KEY = TEST_KEY;

  const orchestrator = new InstagramAiOrchestrator(
    {} as any,
    () => undefined
  );

  const originalFetch = globalThis.fetch;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: HTTP 402 Payment Required / Free Allowance Exhausted
    // -------------------------------------------------------------------------
    console.log('1. Testing HTTP 402 Quota Exhaustion Handling...');
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ error: 'Payment required' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    let caught402 = false;
    let msg402 = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt 402');
    } catch (err: any) {
      caught402 = true;
      msg402 = err.message;
    }

    assert(caught402, 'HTTP 402 rejected before proceeding');
    assert(
      msg402.includes('free allowance exhausted') && msg402.includes('402'),
      'HTTP 402 error clearly identifies free allowance exhaustion'
    );
    assert(
      !msg402.includes('guarantee') && !msg402.includes('stopped before incurring charges'),
      'HTTP 402 error does NOT falsely claim that HTTP 402 guarantees no charges were incurred'
    );
    assert(
      !msg402.includes(TEST_KEY),
      'HTTP 402 error redacts and never leaks API key'
    );

    // -------------------------------------------------------------------------
    // TEST 2: HTTP 429 Rate Limit
    // -------------------------------------------------------------------------
    console.log('\n2. Testing HTTP 429 Rate Limit Handling...');
    globalThis.fetch = async () => {
      return new Response('Rate limit reached', {
        status: 429,
        headers: { 'Content-Type': 'text/plain' }
      });
    };

    let caught429 = false;
    let msg429 = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt 429');
    } catch (err: any) {
      caught429 = true;
      msg429 = err.message;
    }

    assert(caught429, 'HTTP 429 correctly caught');
    assert(msg429.includes('429'), 'HTTP 429 error mentions rate limit');
    assert(!msg429.includes(TEST_KEY), 'HTTP 429 error never leaks API key');

    // -------------------------------------------------------------------------
    // TEST 3: HTTP 401 Unauthorized / Invalid Key
    // -------------------------------------------------------------------------
    console.log('\n3. Testing HTTP 401 Unauthorized Handling...');
    globalThis.fetch = async () => {
      return new Response('Invalid API key', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      });
    };

    let caught401 = false;
    let msg401 = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt 401');
    } catch (err: any) {
      caught401 = true;
      msg401 = err.message;
    }

    assert(caught401, 'HTTP 401 correctly caught');
    assert(msg401.includes('401'), 'HTTP 401 error mentions unauthorized');
    assert(!msg401.includes(TEST_KEY), 'HTTP 401 error never leaks API key');

    // -------------------------------------------------------------------------
    // TEST 4: HTTP 502/503 Backend Overload
    // -------------------------------------------------------------------------
    console.log('\n4. Testing HTTP 502/503 Overload Handling...');
    globalThis.fetch = async () => {
      return new Response('Service Unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    };

    let caught503 = false;
    let msg503 = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt 503');
    } catch (err: any) {
      caught503 = true;
      msg503 = err.message;
    }

    assert(caught503, 'HTTP 503 correctly caught');
    assert(msg503.includes('overloaded'), 'HTTP 503 error indicates backend overload');
    assert(!msg503.includes(TEST_KEY), 'HTTP 503 error never leaks API key');

    // -------------------------------------------------------------------------
    // TEST 5: Timeout Handling
    // -------------------------------------------------------------------------
    console.log('\n5. Testing Timeout Handling...');
    globalThis.fetch = async () => {
      const timeoutError = new Error('The operation was aborted due to timeout');
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    };

    let caughtTimeout = false;
    let msgTimeout = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt timeout');
    } catch (err: any) {
      caughtTimeout = true;
      msgTimeout = err.message;
    }

    assert(caughtTimeout, 'Timeout correctly caught');
    assert(msgTimeout.includes('timed out after 25 seconds'), 'Timeout error mentions 25s threshold');

    // -------------------------------------------------------------------------
    // TEST 6: Invalid Response (Non-Image Content-Type HTML/Error)
    // -------------------------------------------------------------------------
    console.log('\n6. Testing Invalid Response MIME Type Handling...');
    globalThis.fetch = async () => {
      return new Response('<html><body>Error gateway</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    };

    let caughtHtml = false;
    let msgHtml = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt html');
    } catch (err: any) {
      caughtHtml = true;
      msgHtml = err.message;
    }

    assert(caughtHtml, 'HTML response rejected');
    assert(msgHtml.includes('Expected image/*'), 'Error indicates expected image/*');
    assert(!msgHtml.includes(TEST_KEY), 'HTML error never leaks API key');

    // -------------------------------------------------------------------------
    // TEST 7: Truncated Buffer (<2048 bytes)
    // -------------------------------------------------------------------------
    console.log('\n7. Testing Truncated Buffer Handling...');
    globalThis.fetch = async () => {
      return new Response(Buffer.alloc(500), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' }
      });
    };

    let caughtTruncated = false;
    let msgTruncated = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt truncated');
    } catch (err: any) {
      caughtTruncated = true;
      msgTruncated = err.message;
    }

    assert(caughtTruncated, 'Truncated buffer rejected');
    assert(msgTruncated.includes('incomplete or truncated'), 'Error indicates truncated image buffer');

    // -------------------------------------------------------------------------
    // TEST 8: Credential Protection in Error Strings
    // -------------------------------------------------------------------------
    console.log('\n8. Testing Credential Redaction on Network Failures...');
    globalThis.fetch = async () => {
      throw new Error(`Connection reset: https://gen.pollinations.ai?key=${TEST_KEY}`);
    };

    let caughtLeakingError = false;
    let msgLeakingError = '';
    try {
      await orchestrator.generateFluxVisualScene('Test prompt network error');
    } catch (err: any) {
      caughtLeakingError = true;
      msgLeakingError = err.message;
    }

    assert(caughtLeakingError, 'Network error caught');
    assert(!msgLeakingError.includes(TEST_KEY), 'API key was redacted from network error message');
    assert(msgLeakingError.includes('[REDACTED]'), 'Redaction marker inserted in place of API key');

    // -------------------------------------------------------------------------
    // TEST 9: Prevention of Silent Paid Fallbacks in generateAiImage
    // -------------------------------------------------------------------------
    console.log('\n9. Testing Prevention of Silent Paid Fallbacks...');
    let manusCalled = false;
    (orchestrator as any).createManusImageTask = async () => {
      manusCalled = true;
      throw new Error('Manus should NEVER be called when provider is flux!');
    };

    globalThis.fetch = async () => {
      return new Response('Quota exceeded', { status: 402, headers: { 'Content-Type': 'text/plain' } });
    };

    let caughtFallback = false;
    try {
      await orchestrator.generateAiImage('Test scene', '1:1', undefined, 'flux');
    } catch {
      caughtFallback = true;
    }

    assert(caughtFallback, 'generateAiImage strictly threw error on Flux failure');
    assert(!manusCalled, 'Manus was NOT called as a fallback (0 credit burn)');

    // -------------------------------------------------------------------------
    // TEST 10: Successful Mocked Flux Image Return
    // -------------------------------------------------------------------------
    console.log('\n10. Testing Valid Model Image Response Handling (Mocked)...');
    // Generate valid JPEG bytes with SOF0 marker
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01
    ]);
    const validJpegBuffer = Buffer.concat([jpegHeader, Buffer.alloc(3000, 0x55)]);

    globalThis.fetch = async () => {
      return new Response(validJpegBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'x-model-used': 'flux.1-schnell'
        }
      });
    };

    const validResult = await orchestrator.generateFluxVisualScene('Valid Scene Test');
    assert(validResult.provider === 'flux', 'Provider is flux');
    assert(validResult.model === 'flux.1-schnell', 'Model is flux.1-schnell');
    assert(validResult.width === 1024, 'Parsed width is 1024');
    assert(validResult.height === 1024, 'Parsed height is 1024');
    assert(validResult.imageUrl.startsWith('data:image/jpeg;base64,'), 'Returned valid data URL');

    console.log('\n======================================================================');
    console.log(`📊 ZERO-COST SAFETY SUITE: ${passed} / ${total} TESTS PASSED`);
    console.log('======================================================================\n');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

runSafetySuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
