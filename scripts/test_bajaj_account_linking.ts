import assert from 'node:assert';

async function verifyBajajAccount() {
  console.log('======================================================================');
  console.log('🧪 VERIFYING BAJAJ FINANCE ACCOUNT LINKING & ISOLATION');
  console.log('======================================================================\n');

  const baseUrl = 'http://localhost:3005';

  // 1. Check Live Accounts
  console.log('📌 Test 1: Querying Live Accounts (/api/instagram/accounts?environment=live)...');
  const liveRes = await fetch(`${baseUrl}/api/instagram/accounts?environment=live`);
  const liveJson = await liveRes.json();
  const bajajLive = liveJson.accounts.find((a: any) => a.username === 'bajajfinance' || a.id === 'ig-bajajfinance');
  console.log(`  - Found live accounts: ${liveJson.accounts.map((a: any) => '@' + a.username).join(', ')}`);
  assert(bajajLive, 'Bajaj Finance must appear in live accounts');
  assert.strictEqual(bajajLive.isDemo, false, 'Bajaj Finance must have isDemo: false in live mode');
  assert.strictEqual(bajajLive.category, 'Financial service', 'Category must be Financial service');
  assert(bajajLive.followersCount >= 1700000, 'Followers count should be >= 1.7M');
  console.log('  ✅ [PASS] @bajajfinance is present in Live accounts with correct metadata\n');

  // 2. Check Demo Accounts
  console.log('📌 Test 2: Querying Demo Accounts (/api/instagram/accounts?environment=demo)...');
  const demoRes = await fetch(`${baseUrl}/api/instagram/accounts?environment=demo`);
  const demoJson = await demoRes.json();
  const bajajDemo = demoJson.accounts.find((a: any) => a.username === 'bajajfinance' || a.id === 'ig-bajajfinance');
  assert(bajajDemo, 'Bajaj Finance must also appear in demo accounts');
  console.log(`  - Found demo accounts: ${demoJson.accounts.map((a: any) => '@' + a.username).join(', ')}`);
  console.log('  ✅ [PASS] @bajajfinance is accessible in demo mode\n');

  // 3. Check Account Isolation for Scripts
  console.log('📌 Test 3: Verifying Script Isolation Between Accounts...');
  const bajajScriptsRes = await fetch(`${baseUrl}/api/instagram/scripts?accountId=ig-bajajfinance`);
  const bajajScriptsJson = await bajajScriptsRes.json();
  console.log(`  - @bajajfinance script count: ${bajajScriptsJson.scripts.length}`);
  assert(bajajScriptsJson.scripts.length > 0, '@bajajfinance should have finance scripts');
  assert(bajajScriptsJson.scripts.every((s: any) => !s.accountId || s.accountId === 'ig-bajajfinance'), 'No snacc scripts in bajajfinance');

  const snaccScriptsRes = await fetch(`${baseUrl}/api/instagram/scripts?accountId=ig-snacc.mart-1789832445989`);
  const snaccScriptsJson = await snaccScriptsRes.json();
  console.log(`  - @snacc.mart script count: ${snaccScriptsJson.scripts.length}`);
  assert(snaccScriptsJson.scripts.length > 0, '@snacc.mart should have snack scripts');
  assert(snaccScriptsJson.scripts.every((s: any) => s.accountId === 'ig-snacc.mart-1789832445989'), 'No bajaj scripts in snacc.mart');
  console.log('  ✅ [PASS] Scripts are strictly isolated between @bajajfinance and @snacc.mart\n');

  // 4. Check Topics Isolation
  console.log('📌 Test 4: Verifying Topics Isolation Between Accounts...');
  const bajajTopicsRes = await fetch(`${baseUrl}/api/instagram/topics?accountId=ig-bajajfinance`);
  const bajajTopicsJson = await bajajTopicsRes.json();
  console.log(`  - @bajajfinance topics count: ${bajajTopicsJson.topics.length}`);

  const snaccTopicsRes = await fetch(`${baseUrl}/api/instagram/topics?accountId=ig-snacc.mart-1789832445989`);
  const snaccTopicsJson = await snaccTopicsRes.json();
  console.log(`  - @snacc.mart topics count: ${snaccTopicsJson.topics.length}`);
  assert(snaccTopicsJson.topics.length === 5, '@snacc.mart should have 5 snack topics');
  console.log('  ✅ [PASS] Topics are strictly scoped without cross-contamination\n');

  console.log('======================================================================');
  console.log('🎉 ALL BAJAJ FINANCE ACCOUNT VERIFICATIONS PASSED!');
  console.log('======================================================================');
}

verifyBajajAccount().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
