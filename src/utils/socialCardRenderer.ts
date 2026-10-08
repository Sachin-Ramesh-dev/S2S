import * as JSZipLib from 'jszip';
// Handle both ESM and CJS bundle exports
const JSZip = (('default' in JSZipLib ? (JSZipLib as any).default : JSZipLib) as any) as typeof import('jszip');

export type AspectRatio = '1:1' | '4:5' | '9:16';

export type StylePreset = 
  | 'Editorial Swiss Graphic'
  | 'Modern Minimalist'
  | 'Brutalist High Contrast'
  | 'Studio Product Lighting'
  | 'Cyberpunk Neon Dark';

export interface RenderCardOptions {
  headline: string;
  bodyText?: string;
  tag?: string;
  authorHandle?: string;
  aspectRatio?: AspectRatio;
  stylePreset?: StylePreset;
  slideNumber?: number;
  totalSlides?: number;
  swipeTrigger?: string;
  watermarkText?: string;
  backgroundImageUrl?: string;
}

interface ThemeConfig {
  bgColor: string;
  bgGradientEnd?: string;
  gridLines?: boolean;
  gridColor?: string;
  textColor: string;
  textSecondary: string;
  accentColor: string;
  accentBg: string;
  cardBorderColor: string;
  fontFamily: string;
  monoFont: string;
}

const THEMES: Record<StylePreset, ThemeConfig> = {
  'Editorial Swiss Graphic': {
    bgColor: '#0f1117',
    bgGradientEnd: '#161922',
    gridLines: true,
    gridColor: 'rgba(255, 255, 255, 0.05)',
    textColor: '#ffffff',
    textSecondary: '#94a3b8',
    accentColor: '#f97316', // Vibrant Swiss orange
    accentBg: 'rgba(249, 115, 22, 0.15)',
    cardBorderColor: 'rgba(249, 115, 22, 0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Modern Minimalist': {
    bgColor: '#18181b',
    bgGradientEnd: '#09090b',
    gridLines: false,
    textColor: '#f4f4f5',
    textSecondary: '#a1a1aa',
    accentColor: '#38bdf8', // Modern Sky Blue
    accentBg: 'rgba(56, 189, 248, 0.12)',
    cardBorderColor: 'rgba(255, 255, 255, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Brutalist High Contrast': {
    bgColor: '#000000',
    bgGradientEnd: '#0a0a0a',
    gridLines: true,
    gridColor: 'rgba(255, 255, 255, 0.08)',
    textColor: '#ffffff',
    textSecondary: '#a3a3a3',
    accentColor: '#10b981', // High-voltage emerald
    accentBg: 'rgba(16, 185, 129, 0.2)',
    cardBorderColor: '#10b981',
    fontFamily: '"Arial Black", Impact, -apple-system, sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Courier, monospace'
  },
  'Studio Product Lighting': {
    bgColor: '#13111c',
    bgGradientEnd: '#211d33',
    gridLines: false,
    textColor: '#ffffff',
    textSecondary: '#c4b5fd',
    accentColor: '#a855f7', // Studio Purple Glow
    accentBg: 'rgba(168, 85, 247, 0.15)',
    cardBorderColor: 'rgba(168, 85, 247, 0.35)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Cyberpunk Neon Dark': {
    bgColor: '#090a10',
    bgGradientEnd: '#130e26',
    gridLines: true,
    gridColor: 'rgba(192, 132, 252, 0.06)',
    textColor: '#ffffff',
    textSecondary: '#9d98b5',
    accentColor: '#06b6d4', // Cyber Cyan
    accentBg: 'rgba(6, 182, 212, 0.18)',
    cardBorderColor: 'rgba(6, 182, 212, 0.4)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  }
};

export function getResolutionForAspect(ratio: AspectRatio = '1:1'): { width: number; height: number } {
  switch (ratio) {
    case '4:5':
      return { width: 1080, height: 1350 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
    default:
      return { width: 1080, height: 1080 };
  }
}

/**
 * Wraps text into lines on canvas and returns lines drawn
 */
function wrapAndDrawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 8
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      if (lineCount >= maxLines - 1) {
        ctx.fillText(line + '...', x, currentY);
        return lineCount + 1;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
    lineCount++;
  }

  return lineCount;
}

/**
 * Renders a single social card to a canvas and returns both dataUrl and Blob
 */
export async function renderSocialCard(options: RenderCardOptions): Promise<{ dataUrl: string; blob: Blob }> {
  const {
    headline,
    bodyText = '',
    tag = 'STRATEGY',
    authorHandle = '@s2s.studio',
    aspectRatio = '1:1',
    stylePreset = 'Editorial Swiss Graphic',
    slideNumber,
    totalSlides,
    swipeTrigger,
    watermarkText = 'S2S CONTENT OS'
  } = options;

  const { width, height } = getResolutionForAspect(aspectRatio);
  const theme = THEMES[stylePreset] || THEMES['Editorial Swiss Graphic'];

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');

  // 1. BACKGROUND (Real Image or Gradient)
  if (options.backgroundImageUrl && options.backgroundImageUrl.trim().length > 0) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load background image'));
        img.src = options.backgroundImageUrl!;
      });

      // Cover canvas maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;
      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawH = width / imgAspect;
        drawY = (height - drawH) / 2;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Contrast scrim for readability
      ctx.fillStyle = 'rgba(10, 12, 18, 0.65)';
      ctx.fillRect(0, 0, width, height);
    } catch {
      // Fallback to gradient if loading fails
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, theme.bgColor);
      bgGradient.addColorStop(1, theme.bgGradientEnd || theme.bgColor);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, theme.bgColor);
    bgGradient.addColorStop(1, theme.bgGradientEnd || theme.bgColor);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. AMBIENT GLOW ACCENT
  const radialGlow = ctx.createRadialGradient(
    width * 0.85, height * 0.15, 20,
    width * 0.85, height * 0.15, width * 0.7
  );
  radialGlow.addColorStop(0, theme.accentColor + '28'); // ~16% opacity
  radialGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. BACKGROUND GRID LINES (if applicable)
  if (theme.gridLines && theme.gridColor) {
    ctx.strokeStyle = theme.gridColor;
    ctx.lineWidth = 1;
    const gridSize = 72;
    for (let x = gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 4. OUTER SAFE-ZONE BORDER
  const margin = 56;
  ctx.strokeStyle = theme.cardBorderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // 5. TOP HEADER BAR
  const headerY = margin + 48;
  const contentLeft = margin + 56;
  const contentRight = width - margin - 56;
  const contentWidth = contentRight - contentLeft;

  // Account handle badge
  ctx.fillStyle = theme.accentBg;
  const badgeWidth = 260;
  const badgeHeight = 44;
  ctx.beginPath();
  ctx.roundRect(contentLeft, headerY - 30, badgeWidth, badgeHeight, 22);
  ctx.fill();
  ctx.strokeStyle = theme.accentColor + '55';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Badge accent dot
  ctx.fillStyle = theme.accentColor;
  ctx.beginPath();
  ctx.arc(contentLeft + 22, headerY - 8, 5, 0, Math.PI * 2);
  ctx.fill();

  // Author handle text
  ctx.font = `bold 18px ${theme.monoFont}`;
  ctx.fillStyle = theme.textColor;
  ctx.fillText(authorHandle, contentLeft + 38, headerY - 2);

  // Slide Number or Tag (Top Right)
  if (slideNumber && totalSlides) {
    const slidePillText = `SLIDE ${String(slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
    ctx.font = `bold 16px ${theme.monoFont}`;
    const pillMetrics = ctx.measureText(slidePillText);
    const pillW = pillMetrics.width + 36;

    ctx.fillStyle = theme.accentBg;
    ctx.beginPath();
    ctx.roundRect(contentRight - pillW, headerY - 30, pillW, badgeHeight, 22);
    ctx.fill();
    ctx.strokeStyle = theme.accentColor + '55';
    ctx.stroke();

    ctx.fillStyle = theme.accentColor;
    ctx.fillText(slidePillText, contentRight - pillW + 18, headerY - 2);
  } else {
    // Format / Category tag
    const tagText = tag.toUpperCase();
    ctx.font = `bold 16px ${theme.monoFont}`;
    const tagMetrics = ctx.measureText(tagText);
    const tagW = tagMetrics.width + 32;

    ctx.fillStyle = theme.accentBg;
    ctx.beginPath();
    ctx.roundRect(contentRight - tagW, headerY - 30, tagW, badgeHeight, 22);
    ctx.fill();
    ctx.strokeStyle = theme.accentColor + '55';
    ctx.stroke();

    ctx.fillStyle = theme.accentColor;
    ctx.fillText(tagText, contentRight - tagW + 16, headerY - 2);
  }

  // 6. MAIN CONTENT SECTION
  let currentY = headerY + 110;

  // Eyebrow / Pillar Indicator
  ctx.font = `bold 15px ${theme.monoFont}`;
  ctx.fillStyle = theme.accentColor;
  ctx.fillText('// ' + (tag ? tag.toUpperCase() : 'CORE PRINCIPLE'), contentLeft, currentY);

  currentY += 45;

  // Headline with dynamic font sizing
  const headlineLen = headline.length;
  let headlineFontSize = 58;
  let headlineLineHeight = 72;
  if (headlineLen > 100) {
    headlineFontSize = 46;
    headlineLineHeight = 58;
  } else if (headlineLen > 65) {
    headlineFontSize = 52;
    headlineLineHeight = 64;
  }

  ctx.font = `bold ${headlineFontSize}px ${theme.fontFamily}`;
  ctx.fillStyle = theme.textColor;
  const linesDrawn = wrapAndDrawText(
    ctx,
    headline,
    contentLeft,
    currentY,
    contentWidth,
    headlineLineHeight,
    5
  );

  currentY += linesDrawn * headlineLineHeight + 28;

  // Horizontal separator divider
  ctx.strokeStyle = theme.cardBorderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contentLeft, currentY);
  ctx.lineTo(contentLeft + 160, currentY);
  ctx.stroke();

  currentY += 48;

  // Body text / Strategic insight
  if (bodyText) {
    const bodyFontSize = 28;
    const bodyLineHeight = 44;
    ctx.font = `400 ${bodyFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textSecondary;
    wrapAndDrawText(
      ctx,
      bodyText,
      contentLeft,
      currentY,
      contentWidth,
      bodyLineHeight,
      6
    );
  }

  // 7. FOOTER SECTION (At bottom margin)
  const footerY = height - margin - 48;

  // Footer subtle line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentLeft, footerY - 40);
  ctx.lineTo(contentRight, footerY - 40);
  ctx.stroke();

  // Watermark / Brand OS on Left
  ctx.font = `bold 14px ${theme.monoFont}`;
  ctx.fillStyle = theme.textSecondary;
  ctx.fillText(`⚡ ${watermarkText} • ${aspectRatio}`, contentLeft, footerY);

  // Swipe Trigger or Action Hint on Right
  if (swipeTrigger) {
    ctx.font = `bold 17px ${theme.fontFamily}`;
    ctx.fillStyle = theme.accentColor;
    const swipeMetrics = ctx.measureText(swipeTrigger);
    ctx.fillText(swipeTrigger, contentRight - swipeMetrics.width, footerY);
  } else {
    const actionText = 'SAVE FOR LATER 📌';
    ctx.font = `bold 15px ${theme.monoFont}`;
    ctx.fillStyle = theme.accentColor;
    const actionMetrics = ctx.measureText(actionText);
    ctx.fillText(actionText, contentRight - actionMetrics.width, footerY);
  }

  // 8. EXPORT BLOB & DATA URL
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Canvas toBlob returned null'));
    }, 'image/png', 1.0);
  });

  return { dataUrl, blob };
}

/**
 * Triggers a browser download for a data URL or blob
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates and downloads a ZIP package containing all carousel slides
 */
export async function downloadCarouselDeckZip(
  slidesData: Array<{ slideNumber: number; blob: Blob; headline: string }>,
  zipFilename: string = 'carousel-slide-deck.zip'
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('slides') || zip;

  slidesData.forEach((slide) => {
    const num = String(slide.slideNumber).padStart(2, '0');
    const safeHeadline = (slide.headline || 'slide')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);
    const fname = `slide-${num}-${safeHeadline}.png`;
    folder.file(fname, slide.blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  downloadDataUrl(url, zipFilename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
