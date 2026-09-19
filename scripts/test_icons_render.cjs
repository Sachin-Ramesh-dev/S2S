const fs = require('fs');
const { chromium } = require('playwright-core');

const teamsSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2228.833 2073.333" class="w-5.5 h-5.5">
  <path fill="#5059C9" d="M1554.637,777.5h575.713c54.391,0,98.483,44.092,98.483,98.483v524.398c0,199.901-162.051,361.952-361.952,361.952h-1.711c-199.901,0.028-361.975-162-362.004-361.901V828.971C1503.167,800.544,1526.211,777.5,1554.637,777.5z"/>
  <circle fill="#5059C9" cx="1943.75" cy="440.583" r="233.25"/>
  <circle fill="#7B83EB" cx="1218.083" cy="336.917" r="336.917"/>
  <path fill="#7B83EB" d="M1667.323,777.5H717.01c-53.743,1.33-96.257,45.931-95.01,99.676v598.105c-7.505,322.519,247.657,590.16,570.167,598.053c322.51-7.893,577.671-275.534,570.167-598.053V877.176C1763.579,823.431,1721.066,778.83,1667.323,777.5z"/>
  <defs>
    <linearGradient id="teamsTileGrad" gradientUnits="userSpaceOnUse" x1="198.099" y1="1683.0726" x2="942.2344" y2="394.2607" gradientTransform="matrix(1 0 0 -1 0 2075.3333)">
      <stop offset="0" stop-color="#5a62c3"/>
      <stop offset=".5" stop-color="#4d55bd"/>
      <stop offset="1" stop-color="#3940ab"/>
    </linearGradient>
  </defs>
  <path fill="url(#teamsTileGrad)" d="M95.01,466.5h950.312c52.473,0,95.01,42.538,95.01,95.01v950.312c0,52.473-42.538,95.01-95.01,95.01H95.01c-52.473,0-95.01-42.538-95.01-95.01V561.51C0,509.038,42.538,466.5,95.01,466.5z"/>
  <path fill="#FFF" d="M820.211,828.193H630.241v517.297H509.211V828.193H320.123V727.844h500.088V828.193z"/>
</svg>`;

const notionSvg = `<svg role="img" viewBox="0 0 24 24" fill="currentColor" class="w-5.5 h-5.5 text-black">
  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
</svg>`;

const canvaSvg = `<svg role="img" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-white">
  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.962 7.68c.754 0 1.337.549 1.405 1.2.069.583-.171 1.097-.822 1.406-.343.171-.48.172-.549.069-.034-.069 0-.137.069-.206.617-.514.617-.926.548-1.508-.034-.378-.308-.618-.583-.618-1.2 0-2.914 2.674-2.674 4.629.103.754.549 1.646 1.509 1.646.308 0 .65-.103.96-.24.5-.264.799-.47 1.097-.8-.073-.885.704-2.046 1.851-2.046.515 0 .926.205.96.583.068.514-.377.582-.514.582s-.378-.034-.378-.17c-.034-.138.309-.07.275-.378-.035-.206-.24-.274-.446-.274-.72 0-1.131.994-1.029 1.611.035.275.172.549.447.549.205 0 .514-.31.617-.755.068-.308.343-.514.583-.514.102 0 .17.034.205.171v.138c-.034.137-.137.548-.102.651 0 .069.034.171.17.171.092 0 .436-.18.777-.459.117-.59.253-1.298.253-1.357.034-.24.137-.48.617-.48.103 0 .171.034.205.171v.138l-.136.617c.445-.583 1.097-.994 1.508-.994.172 0 .309.102.309.274 0 .103 0 .274-.069.446-.137.377-.309.96-.412 1.474 0 .137.035.274.207.274.171 0 .685-.206 1.096-.754l.007-.004c-.002-.068-.007-.134-.007-.202 0-.411.035-.754.104-.994.068-.274.411-.514.617-.514.103 0 .205.069.205.171 0 .035 0 .103-.034.137-.137.446-.24.857-.24 1.269 0 .24.034.582.102.788 0 .034.035.069.07.069.068 0 .548-.445.89-1.028-.308-.206-.48-.549-.48-.96 0-.72.446-1.097.858-1.097.343 0 .617.24.617.72 0 .308-.103.65-.274.96h.102a.77.77 0 0 0 .584-.24.293.293 0 0 1 .134-.117c.335-.425.83-.74 1.41-.74.48 0 .924.205.959.582.068.515-.378.618-.515.618l-.002-.002c-.138 0-.377-.035-.377-.172 0-.137.309-.068.274-.376-.034-.206-.24-.275-.446-.275-.686 0-1.13.891-1.028 1.611.034.275.171.583.445.583.206 0 .515-.308.652-.754.068-.274.343-.514.583-.514.103 0 .17.034.205.171 0 .069 0 .206-.137.652-.17.308-.171.48-.137.617.034.274.171.48.309.583.034.034.068.102.068.102 0 .069-.034.138-.137.138-.034 0-.068 0-.103-.035-.514-.205-.72-.548-.789-.891-.205.24-.445.377-.72.377-.445 0-.89-.411-.96-.926a1.609 1.609 0 0 1 .075-.649c-.203.13-.422.203-.623.203h-.17c-.447.652-.927 1.098-1.27 1.303a.896.896 0 0 1-.377.104c-.068 0-.171-.035-.205-.104-.095-.152-.156-.392-.193-.667-.481.527-1.145.805-1.453.805-.343 0-.548-.206-.582-.55v-.376c.102-.754.377-1.2.377-1.337a.074.074 0 0 0-.069-.07c-.24 0-1.028.824-1.166 1.373l-.103.445c-.068.309-.377.515-.582.515-.103 0-.172-.035-.206-.172v-.137l.046-.233c-.435.31-.87.508-1.075.508-.308 0-.48-.172-.514-.412-.206.274-.445.412-.754.412-.352 0-.696-.24-.862-.593-.244.275-.523.553-.852.764-.48.309-1.028.549-1.68.549-.582 0-1.097-.309-1.371-.583-.412-.377-.651-.96-.686-1.509-.205-1.68.823-3.84 2.4-4.8.378-.205.755-.343 1.132-.343zm9.77 3.291c-.104 0-.172.172-.172.343 0 .274.137.583.309.755a1.74 1.74 0 0 0 .102-.583c0-.343-.137-.515-.24-.515z"/>
</svg>`;

const elevenLabsSvg = `<svg role="img" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
  <path d="M4.6035 0v24h4.9317V0zm9.8613 0v24h4.9317V0z"/>
</svg>`;

const slackSvg = `<svg viewBox="0 0 24 24" class="w-5.5 h-5.5">
  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
  <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
  <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
  <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
</svg>`;

const youtubeSvg = `<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
</svg>`;

const linkedInSvg = `<svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-white">
  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
</svg>`;

const instagramSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white">
  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
</svg>`;

const webhookSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white">
  <circle cx="18" cy="5" r="3" fill="currentColor" />
  <circle cx="6" cy="12" r="3" fill="currentColor" />
  <circle cx="18" cy="19" r="3" fill="currentColor" />
  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
</svg>`;

const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="bg-[#0e0e11] text-white p-8">
  <h1 class="text-xl font-bold mb-2">S2S All 9 Official Brand Badges</h1>
  <p class="text-xs text-zinc-400 mb-6">Pixel-perfect vector fidelity matching official brand guidelines</p>

  <div class="grid grid-cols-3 gap-4 max-w-4xl">
    <!-- 1. Instagram -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#833AB4]">
        ${instagramSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Instagram Graph API</div>
        <div class="text-xs text-zinc-400">Meta v20.0 telemetry</div>
      </div>
    </div>

    <!-- 2. YouTube -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#FF0000]">
        ${youtubeSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">YouTube Studio API</div>
        <div class="text-xs text-zinc-400">Official Red Badge</div>
      </div>
    </div>

    <!-- 3. LinkedIn -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#0A66C2]">
        ${linkedInSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">LinkedIn Marketing</div>
        <div class="text-xs text-zinc-400">Official #0A66C2</div>
      </div>
    </div>

    <!-- 4. Canva -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-gradient-to-tr from-[#00C4CC] via-[#5B32F4] to-[#7D2AE8]">
        ${canvaSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Canva Connect</div>
        <div class="text-xs text-zinc-400">Official Script Circle</div>
      </div>
    </div>

    <!-- 5. ElevenLabs -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#09090b] border border-zinc-800">
        ${elevenLabsSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">ElevenLabs Voice AI</div>
        <div class="text-xs text-zinc-400">Official Equalizer Mark</div>
      </div>
    </div>

    <!-- 6. Teams -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[#ECEEFA] dark:bg-[#1C1F3B] border border-[#5059C9]/30">
        ${teamsSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Microsoft Teams</div>
        <div class="text-xs text-zinc-400">Official Multi-layer</div>
      </div>
    </div>

    <!-- 7. Slack -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200">
        ${slackSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Slack Webhook</div>
        <div class="text-xs text-zinc-400">Official Octothorpe</div>
      </div>
    </div>

    <!-- 8. Notion -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white border border-slate-200">
        ${notionSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Notion Workspace</div>
        <div class="text-xs text-zinc-400">Official 3D Notebook</div>
      </div>
    </div>

    <!-- 9. Webhooks -->
    <div class="flex items-center gap-3.5 p-3.5 bg-[#141417] border border-[#222226] rounded-2xl">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#C026D3]">
        ${webhookSvg}
      </div>
      <div>
        <div class="text-sm font-semibold">Production Webhooks</div>
        <div class="text-xs text-zinc-400">API Broadcast Nodes</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('/Users/sachinramesh/.gemini/antigravity-ide/scratch/test_icons.html', html);

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 420 } });
  await page.goto('file:///Users/sachinramesh/.gemini/antigravity-ide/scratch/test_icons.html');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/test_all_icons.png' });
  await browser.close();
  console.log("All icons screenshot taken!");
})();
