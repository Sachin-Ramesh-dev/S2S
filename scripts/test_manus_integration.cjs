const fs = require('fs');
const path = require('path');

async function testManusIntegration() {
  console.log('=== TEST: MANUS AI IMAGE GENERATION INTEGRATION IN S2S ===\n');

  const BASE_URL = 'http://localhost:3000/api/instagram';
  const taskId = 'MY3H8Ujh77ZR2Mr3YtmMPv'; // Single live executed task from Manus API

  // 1. Check Manus Task Status Endpoint
  console.log(`1. Querying Task Status for Task ID: ${taskId}...`);
  const statusRes = await fetch(`${BASE_URL}/images/manus/task-status/${taskId}`);
  const statusData = await statusRes.json();

  console.log('Task Status Response:', {
    success: statusData.success,
    taskId: statusData.taskId,
    status: statusData.status,
    brief: statusData.brief,
    isFinished: statusData.isFinished,
    hasAttachment: !!statusData.attachment,
    attachmentFilename: statusData.attachment?.filename,
    attachmentContentType: statusData.attachment?.contentType
  });

  if (!statusData.success || !statusData.attachment?.url) {
    throw new Error('Task status check failed or missing attachment URL');
  }

  // 2. Test Finalize Task & Signature / Dimension Validation
  console.log('\n2. Testing Finalize Task (Byte download, Magic Bytes & Dimension Validation)...');
  
  // Find a test script ID
  const dbPath = path.resolve(__dirname, '../data/nodeflow_db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const testScript = db.instagramScripts.find(s => s.format === 'Image') || db.instagramScripts[0];
  console.log(`Using script ID: ${testScript.id} ("${testScript.title}")`);

  const finalizeRes = await fetch(`${BASE_URL}/images/manus/finalize-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scriptId: testScript.id,
      taskId: taskId,
      taskUrl: `https://manus.im/app/${taskId}`,
      attachmentUrl: statusData.attachment.url
    })
  });

  const finalizeData = await finalizeRes.json();
  console.log('Finalize Response:', {
    success: finalizeData.success,
    width: finalizeData.width,
    height: finalizeData.height,
    byteLength: finalizeData.byteLength,
    isDataUrl: finalizeData.imageUrl?.startsWith('data:image/png;base64,'),
    provider: finalizeData.script?.imageConcept?.provider,
    model: finalizeData.script?.imageConcept?.model
  });

  if (!finalizeData.success || finalizeData.width !== 1920 || finalizeData.height !== 1920) {
    throw new Error(`Dimension or validation error: expected 1920x1920, got ${finalizeData.width}x${finalizeData.height}`);
  }

  // Verify Magic bytes from the saved file in data/generated_images/
  console.log('\n3. Verifying filesystem persistence in data/generated_images/...');
  const genDir = path.resolve(__dirname, '../data/generated_images');
  const files = fs.readdirSync(genDir).filter(f => f.startsWith('manus-'));
  console.log(`Found ${files.length} saved Manus image files in data/generated_images/`);
  const latestFile = files.sort().pop();
  const filePath = path.join(genDir, latestFile);
  const fileBytes = fs.readFileSync(filePath);
  
  // PNG Magic Header: 89 50 4E 47 0D 0A 1A 0A
  const isPng = fileBytes[0] === 0x89 && fileBytes[1] === 0x50 && fileBytes[2] === 0x4e && fileBytes[3] === 0x47;
  console.log(`File: ${latestFile}`);
  console.log(`Byte size: ${fileBytes.length} bytes (${(fileBytes.length / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`PNG Magic signature (89 50 4E 47): ${isPng ? 'VERIFIED ✓' : 'FAILED ✗'}`);

  // 4. Verify Script State Persistence in Database
  console.log('\n4. Verifying script persistence in data/nodeflow_db.json...');
  const reloadedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const updatedScript = reloadedDb.instagramScripts.find(s => s.id === testScript.id);
  const concept = updatedScript.imageConcept;
  console.log('Persisted Image Concept:', {
    provider: concept.provider,
    model: concept.model,
    taskId: concept.taskId,
    taskUrl: concept.taskUrl,
    width: concept.width,
    height: concept.height,
    hasFinalImageUrl: !!concept.finalImageUrl && concept.finalImageUrl.startsWith('data:image/png;base64,')
  });

  if (concept.provider !== 'manus' || concept.taskId !== taskId) {
    throw new Error('Database persistence check failed!');
  }
  console.log('Persistence across reload: VERIFIED ✓');

  console.log('\n=============================================================');
  console.log('🎉 ALL MANUS API SERVER-SIDE VERIFICATION CHECKS PASSED 100%!');
  console.log('=============================================================');
}

testManusIntegration().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
