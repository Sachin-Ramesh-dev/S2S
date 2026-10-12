import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const outDir = '/Users/sachinramesh/.gemini/antigravity-ide/brain/56077cb5-6f5e-41dc-975b-dfeee3e234d7/.tempmediaStorage';

  // 1. Home Hub Light Mode
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(outDir, 'declutter_v2_01_home_light.png'), fullPage: false });

  // 2. Home Hub Dark Mode
  const darkToggle = page.locator('#btn-theme-toggle');
  if (await darkToggle.isVisible()) {
    await darkToggle.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, 'declutter_v2_02_home_dark.png'), fullPage: false });
    // Switch back to light for subsequent screens
    await darkToggle.click();
    await page.waitForTimeout(300);
  }

  // 3. Script Studio - Image Format (Stage 1)
  const navProduction = page.locator('#nav-item-production, button:has-text("Continue Production")').first();
  if (await navProduction.isVisible()) {
    await navProduction.click();
    await page.waitForTimeout(500);
  }

  // Open format switcher and pick Image
  const switcher = page.locator('#btn-format-switcher');
  if (await switcher.isVisible()) {
    await switcher.click();
    await page.waitForTimeout(300);
    const imageOption = page.locator('#format-option-image, button:has-text("Image"), [data-format="Image"]').first();
    if (await imageOption.isVisible()) {
      await imageOption.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: path.join(outDir, 'declutter_v2_03_image_stage1.png'), fullPage: false });

  // 4. Script Studio - Carousel Format
  if (await switcher.isVisible()) {
    await switcher.click();
    await page.waitForTimeout(300);
    const carouselOption = page.locator('#format-option-carousel, button:has-text("Carousel"), [data-format="Carousel"]').first();
    if (await carouselOption.isVisible()) {
      await carouselOption.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: path.join(outDir, 'declutter_v2_04_carousel_stage1.png'), fullPage: false });

  // 5. Script Studio - Reel Format
  if (await switcher.isVisible()) {
    await switcher.click();
    await page.waitForTimeout(300);
    const reelOption = page.locator('#format-option-reel, button:has-text("Reel"), [data-format="Reel"]').first();
    if (await reelOption.isVisible()) {
      await reelOption.click();
      await page.waitForTimeout(500);
    }
  }
  await page.screenshot({ path: path.join(outDir, 'declutter_v2_05_reel_stage1.png'), fullPage: false });

  await browser.close();
  console.log('✅ Declutter screenshots saved successfully!');
}

main().catch(console.error);
