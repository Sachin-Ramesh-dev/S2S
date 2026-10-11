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
    bgColor: '#0a0d14',
    bgGradientEnd: '#141824',
    gridLines: true,
    gridColor: 'rgba(255, 255, 255, 0.05)',
    textColor: '#ffffff',
    textSecondary: '#cbd5e1', // High-contrast Slate 300
    accentColor: '#f97316', // Vibrant Swiss orange
    accentBg: 'rgba(249, 115, 22, 0.18)',
    cardBorderColor: 'rgba(249, 115, 22, 0.4)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Modern Minimalist': {
    bgColor: '#18181b',
    bgGradientEnd: '#09090b',
    gridLines: false,
    textColor: '#ffffff',
    textSecondary: '#d4d4d8', // Zinc 300
    accentColor: '#38bdf8', // Modern Sky Blue
    accentBg: 'rgba(56, 189, 248, 0.16)',
    cardBorderColor: 'rgba(56, 189, 248, 0.35)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Brutalist High Contrast': {
    bgColor: '#000000',
    bgGradientEnd: '#0a0a0a',
    gridLines: true,
    gridColor: 'rgba(255, 255, 255, 0.08)',
    textColor: '#ffffff',
    textSecondary: '#e5e5e5', // High-voltage neutral
    accentColor: '#10b981', // High-voltage emerald
    accentBg: 'rgba(16, 185, 129, 0.22)',
    cardBorderColor: '#10b981',
    fontFamily: '"Arial Black", Impact, -apple-system, sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Courier, monospace'
  },
  'Studio Product Lighting': {
    bgColor: '#110e1a',
    bgGradientEnd: '#211d33',
    gridLines: false,
    textColor: '#ffffff',
    textSecondary: '#ddd6fe', // Violet 200
    accentColor: '#a855f7', // Studio Purple Glow
    accentBg: 'rgba(168, 85, 247, 0.18)',
    cardBorderColor: 'rgba(168, 85, 247, 0.45)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoFont: 'ui-monospace, SFMono-Regular, Menlo, monospace'
  },
  'Cyberpunk Neon Dark': {
    bgColor: '#080911',
    bgGradientEnd: '#130e26',
    gridLines: true,
    gridColor: 'rgba(192, 132, 252, 0.08)',
    textColor: '#ffffff',
    textSecondary: '#c4b5fd', // Cyber Lavender
    accentColor: '#06b6d4', // Cyber Cyan
    accentBg: 'rgba(6, 182, 212, 0.2)',
    cardBorderColor: 'rgba(6, 182, 212, 0.45)',
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
 * Wraps text into lines on canvas and returns lines drawn.
 * Enforces both maxLines and maxAllowedY to strictly prevent text overlaps with the footer.
 */
function wrapAndDrawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 8,
  maxAllowedY?: number
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lineCount = 0;
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      if (lineCount >= maxLines - 1 || (maxAllowedY && currentY + lineHeight > maxAllowedY)) {
        ctx.fillText(line + '...', x, currentY);
        return lineCount + 1;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
      lineCount++;
      if (maxAllowedY && currentY > maxAllowedY) {
        return lineCount;
      }
    } else {
      line = testLine;
    }
  }

  if (line && lineCount < maxLines && (!maxAllowedY || currentY <= maxAllowedY)) {
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

  // Shadow helpers to guarantee crisp contrast on any background
  const setTextShadow = () => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  };

  const clearShadow = () => {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // Safe Margins based on Aspect Ratio
  let marginX = 56;
  let marginTop = 56;
  let marginBottom = 56;

  if (aspectRatio === '9:16') {
    marginX = 64;
    marginTop = 140; // Safe zone below Instagram Story top bar/camera
    marginBottom = 160; // Safe zone above Instagram Story reply bar
  } else if (aspectRatio === '4:5') {
    marginX = 64;
    marginTop = 64;
    marginBottom = 64;
  }

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

      // MULTI-LAYER EDITORIAL SWISS GRADIENT SCRIM (Approved by user)
      // Layer A: Base uniform dimming
      ctx.fillStyle = 'rgba(7, 9, 15, 0.64)';
      ctx.fillRect(0, 0, width, height);

      // Layer B: Directional vertical contrast gradient
      const vScrim = ctx.createLinearGradient(0, 0, 0, height);
      vScrim.addColorStop(0, 'rgba(5, 7, 12, 0.88)'); // Header area
      vScrim.addColorStop(0.20, 'rgba(6, 8, 14, 0.76)');
      vScrim.addColorStop(0.50, 'rgba(6, 8, 14, 0.72)'); // Content zone
      vScrim.addColorStop(0.80, 'rgba(6, 8, 14, 0.82)');
      vScrim.addColorStop(1, 'rgba(5, 7, 12, 0.90)'); // Footer area
      ctx.fillStyle = vScrim;
      ctx.fillRect(0, 0, width, height);

      // Layer C: Subtle vignette behind main content box
      const textVignette = ctx.createRadialGradient(
        width * 0.5, (marginTop + (height - marginBottom)) * 0.5, 60,
        width * 0.5, (marginTop + (height - marginBottom)) * 0.5, width * 0.7
      );
      textVignette.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      textVignette.addColorStop(1, 'transparent');
      ctx.fillStyle = textVignette;
      ctx.fillRect(0, marginTop, width, height - marginTop - marginBottom);
    } catch {
      // Fallback to theme gradient if loading fails
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
  clearShadow();
  ctx.strokeStyle = theme.cardBorderColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(marginX, marginTop, width - marginX * 2, height - marginTop - marginBottom);

  // 5. TOP HEADER BAR
  const headerY = marginTop + 44;
  const contentLeft = marginX + 48;
  const contentRight = width - marginX - 48;
  const contentWidth = contentRight - contentLeft;

  // Account handle badge with dynamic measurement & overflow prevention
  ctx.font = `bold 18px ${theme.monoFont}`;
  const handleMetrics = ctx.measureText(authorHandle);
  const maxHandleBadgeW = contentWidth * 0.46;
  const badgeWidth = Math.max(160, Math.min(maxHandleBadgeW, handleMetrics.width + 56));
  const badgeHeight = 44;

  clearShadow();
  ctx.fillStyle = theme.accentBg;
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

  // Author handle text with truncation protection
  setTextShadow();
  ctx.font = `bold 18px ${theme.monoFont}`;
  ctx.fillStyle = theme.textColor;
  let displayHandle = authorHandle;
  if (handleMetrics.width > badgeWidth - 52) {
    while (displayHandle.length > 3 && ctx.measureText(displayHandle + '...').width > badgeWidth - 52) {
      displayHandle = displayHandle.slice(0, -1);
    }
    displayHandle += '...';
  }
  ctx.fillText(displayHandle, contentLeft + 38, headerY - 2);

  // Slide Number or Tag (Top Right)
  const slidePillText = (slideNumber && totalSlides)
    ? `SLIDE ${String(slideNumber).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`
    : (tag ? tag.toUpperCase() : 'STRATEGY');
  ctx.font = `bold 16px ${theme.monoFont}`;
  const tagMetrics = ctx.measureText(slidePillText);
  const maxTagBadgeW = contentWidth * 0.46;
  const pillW = Math.max(110, Math.min(maxTagBadgeW, tagMetrics.width + 36));

  clearShadow();
  ctx.fillStyle = theme.accentBg;
  ctx.beginPath();
  ctx.roundRect(contentRight - pillW, headerY - 30, pillW, badgeHeight, 22);
  ctx.fill();
  ctx.strokeStyle = theme.accentColor + '55';
  ctx.stroke();

  setTextShadow();
  ctx.fillStyle = theme.accentColor;
  ctx.fillText(slidePillText, contentRight - pillW + 18, headerY - 2);

  // 6. MAIN CONTENT SECTION
  let currentY = headerY + (aspectRatio === '9:16' ? 140 : 100);

  // Eyebrow / Pillar Indicator
  setTextShadow();
  ctx.font = `bold 16px ${theme.monoFont}`;
  ctx.fillStyle = theme.accentColor;
  ctx.fillText('// ' + (tag ? tag.toUpperCase() : 'CORE PRINCIPLE'), contentLeft, currentY);

  currentY += 46;

  // Headline with dynamic font sizing & line wrap
  const headlineLen = headline.length;
  let headlineFontSize = 56;
  let headlineLineHeight = 70;
  const maxHeadlineLines = aspectRatio === '9:16' ? 5 : 4;

  if (headlineLen > 100) {
    headlineFontSize = 42;
    headlineLineHeight = 54;
  } else if (headlineLen > 65) {
    headlineFontSize = 48;
    headlineLineHeight = 60;
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
    maxHeadlineLines
  );

  currentY += linesDrawn * headlineLineHeight + 28;

  // Horizontal separator divider
  clearShadow();
  ctx.strokeStyle = theme.cardBorderColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contentLeft, currentY);
  ctx.lineTo(contentLeft + 160, currentY);
  ctx.stroke();

  currentY += 48;

  // Footer Y Position (Calculated early to guard against body overlap)
  const footerY = height - marginBottom - 44;
  const maxAllowedBodyY = footerY - 50;

  // Body text / Strategic insight with strict overflow & overlap guard
  if (bodyText && currentY < maxAllowedBodyY) {
    setTextShadow();
    const bodyFontSize = 28;
    const bodyLineHeight = 44;
    const availableHeight = maxAllowedBodyY - currentY;
    const maxBodyLines = Math.max(1, Math.min(6, Math.floor(availableHeight / bodyLineHeight)));

    ctx.font = `500 ${bodyFontSize}px ${theme.fontFamily}`;
    ctx.fillStyle = theme.textSecondary;
    wrapAndDrawText(
      ctx,
      bodyText,
      contentLeft,
      currentY,
      contentWidth,
      bodyLineHeight,
      maxBodyLines,
      maxAllowedBodyY
    );
  }

  // 7. FOOTER SECTION (Guaranteed safe margins)
  clearShadow();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(contentLeft, footerY - 36);
  ctx.lineTo(contentRight, footerY - 36);
  ctx.stroke();

  setTextShadow();
  // Watermark / Brand OS on Left
  ctx.font = `bold 15px ${theme.monoFont}`;
  ctx.fillStyle = theme.textSecondary;
  const watermarkStr = `⚡ ${watermarkText} • ${aspectRatio}`;
  ctx.fillText(watermarkStr, contentLeft, footerY);

  // Swipe Trigger or Action Hint on Right
  const actionText = swipeTrigger || 'SAVE FOR LATER 📌';
  ctx.font = `bold 16px ${theme.monoFont}`;
  ctx.fillStyle = theme.accentColor;
  const actionMetrics = ctx.measureText(actionText);
  ctx.fillText(actionText, contentRight - actionMetrics.width, footerY);
  clearShadow();

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
