/**
 * Verification Script: Live Instagram MCP + Gemini Agent
 * Tests against the live running Express API on http://localhost:3000
 */

const assert = require('assert');

async function runTests() {
  console.log('=== Starting Verification for Live Instagram MCP + Gemini Agent ===\n');

  const BASE_URL = 'http://localhost:3000';

  console.log('[Test 1] Verifying Instagram MCP connection registered in /api/mcp/connections...');
  const mcpRes = await fetch(`${BASE_URL}/api/mcp/connections`);
  assert.strictEqual(mcpRes.status, 200, 'MCP connections endpoint must return 200');
  const mcpData = await mcpRes.json();
  assert.strictEqual(mcpData.success, true);
  
  const igMcp = mcpData.connections.find(c => c.id === 'mcp-instagram');
  assert.ok(igMcp, 'mcp-instagram must be registered in MCP connections');
  assert.strictEqual(igMcp.status, 'connected');
  assert.strictEqual(igMcp.tools.length, 5);

  const toolNames = igMcp.tools.map(t => t.name);
  const expectedTools = [
    'get_account_profile',
    'get_recent_media',
    'get_media_insights',
    'get_account_insights',
    'get_recent_comments'
  ];
  for (const exp of expectedTools) {
    assert.ok(toolNames.includes(exp), `Expected MCP tool missing: ${exp}`);
  }
  console.log('✓ Instagram MCP active with 5 tools:', toolNames.join(', '));

  console.log('\n[Test 2] Verifying Instagram Account listing in /api/instagram/accounts...');
  const accRes = await fetch(`${BASE_URL}/api/instagram/accounts`);
  assert.strictEqual(accRes.status, 200);
  const accData = await accRes.json();
  assert.ok(accData.accounts.length > 0, 'At least one account should exist');
  const account = accData.accounts[0];
  console.log(`✓ Active account: @${account.username} (ID: ${account.id})`);

  console.log('\n[Test 3] Verifying Zero-Hallucination intercept on expired/invalid token in POST /api/instagram/audits/run...');
  const auditRunRes = await fetch(`${BASE_URL}/api/instagram/audits/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: account.id, auditMode: 'full' })
  });

  const auditRunData = await auditRunRes.json();
  console.log('Audit run response status:', auditRunRes.status);
  console.log('Audit run response body:', auditRunData);

  assert.strictEqual(auditRunRes.status, 500);
  assert.strictEqual(
    auditRunData.error,
    'Instagram data could not be retrieved. Please reconnect the Instagram account or check the required permissions.'
  );
  console.log('✓ Zero-hallucination intercept confirmed: No hallucinated data returned when credentials fail.');

  console.log('\n[Test 4] Verifying Audit history query in GET /api/instagram/audits...');
  const auditsRes = await fetch(`${BASE_URL}/api/instagram/audits?accountId=${account.id}`);
  assert.strictEqual(auditsRes.status, 200);
  const auditsData = await auditsRes.json();
  console.log(`✓ Found ${auditsData.audits.length} existing audit records for @${account.username}`);

  console.log('\n[Test 5] Verifying Topic Generation Pipeline in POST /api/instagram/topics/generate...');
  const topicsRes = await fetch(`${BASE_URL}/api/instagram/topics/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: account.id,
      count: 2,
      format: 'all',
      customAngle: 'Highlight authentic crunch and traditional taste'
    })
  });
  assert.strictEqual(topicsRes.status, 200);
  const topicsData = await topicsRes.json();
  assert.strictEqual(topicsData.success, true);
  assert.ok(Array.isArray(topicsData.topics));
  assert.ok(topicsData.topics.length > 0);
  console.log(`✓ Generated ${topicsData.topics.length} topics successfully via Gemini Topic Engine:`);
  topicsData.topics.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.format}] ${t.title}`);
    console.log(`      Hook: "${t.hook}"`);
  });

  console.log('\n[Test 6] Verifying Script Generation Pipeline from Approved Topic...');
  const testTopic = topicsData.topics[0];
  // Approve the topic
  const approveRes = await fetch(`${BASE_URL}/api/instagram/topics/${testTopic.id}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' })
  });
  assert.strictEqual(approveRes.status, 200);

  // Generate 4-act script for this topic
  const scriptRes = await fetch(`${BASE_URL}/api/instagram/scripts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: account.id,
      topicId: testTopic.id,
      targetDurationSec: 45
    })
  });
  assert.strictEqual(scriptRes.status, 200);
  const scriptData = await scriptRes.json();
  assert.strictEqual(scriptData.success, true);
  assert.ok(scriptData.script);
  assert.strictEqual(scriptData.script.topicId, testTopic.id);
  assert.ok(scriptData.script.title);
  assert.ok(scriptData.script.hook);
  console.log(`✓ Generated Script connected to topic "${testTopic.title}":`);
  console.log(`   Title: "${scriptData.script.title}"`);
  console.log(`   Hook: "${scriptData.script.hook}"`);
  console.log(`   Format: ${scriptData.script.format}`);
  console.log(`   CTA: "${scriptData.script.callToAction || 'None'}"`);

  console.log('\n=== ALL 6 END-TO-END VERIFICATION TESTS PASSED PERFECTLY! ===');
}

runTests().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
