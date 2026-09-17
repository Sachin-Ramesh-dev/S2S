import { Workflow, NodeDefinition, SingleNodeExecution, WorkflowNode } from '../types';

export async function exportCanvasSnapshot(
  workflow: Workflow,
  nodeDefinitions: Record<string, NodeDefinition>,
  isDark: boolean,
  executionResults: Record<string, SingleNodeExecution> = {}
): Promise<string> {
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || [];

  // Calculate layout bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nodes.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  } else {
    nodes.forEach((n) => {
      const w = n.type === 'stickyNote' ? (n.parameters?.width || 240) : 220;
      const h = n.type === 'stickyNote' ? (n.parameters?.height || 160) : 90;
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.x + w > maxX) maxX = n.position.x + w;
      if (n.position.y + h > maxY) maxY = n.position.y + h;
    });
  }

  const padding = 100;
  const canvasWidth = Math.max(900, maxX - minX + padding * 2);
  const canvasHeight = Math.max(600, maxY - minY + padding * 2 + 60); // extra 60px for footer/header

  const scale = 2; // Retina sharpness
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  ctx.scale(scale, scale);

  // 1. Draw Background
  ctx.fillStyle = isDark ? '#121215' : '#f8fafc';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw subtle grid dots
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const gridSize = 24;
  for (let x = 0; x < canvasWidth; x += gridSize) {
    for (let y = 0; y < canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Draw Workflow Header & Watermark
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillText(workflow.name || 'Untitled Workflow', padding, 50);

  ctx.fillStyle = isDark ? '#a1a1aa' : '#64748b';
  ctx.font = '12px Inter, system-ui, sans-serif';
  const nodeCountText = `${nodes.length} nodes • ${connections.length} connections`;
  ctx.fillText(nodeCountText, padding, 70);

  ctx.fillStyle = isDark ? '#71717a' : '#94a3b8';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'right';
  const dateStr = new Date().toLocaleString();
  ctx.fillText(`Exported from nodeflow • ${dateStr}`, canvasWidth - padding, 50);
  ctx.textAlign = 'left';

  // Offset coordinate system so all nodes fit inside canvas nicely
  const offsetX = padding - minX;
  const offsetY = padding + 40 - minY;

  // 3. Draw Connections (Bezier curves)
  const nodeMap = new Map<string, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  connections.forEach((conn) => {
    const src = nodeMap.get(conn.sourceNodeId);
    const tgt = nodeMap.get(conn.targetNodeId);
    if (!src || !tgt) return;

    const srcW = src.type === 'stickyNote' ? (src.parameters?.width || 240) : 220;
    const srcH = src.type === 'stickyNote' ? (src.parameters?.height || 160) : 90;
    const tgtH = tgt.type === 'stickyNote' ? (tgt.parameters?.height || 160) : 90;

    const x1 = src.position.x + srcW + offsetX;
    const y1 = src.position.y + srcH / 2 + offsetY;
    const x2 = tgt.position.x + offsetX;
    const y2 = tgt.position.y + tgtH / 2 + offsetY;

    const dx = Math.abs(x2 - x1) * 0.5;
    const cp1x = x1 + Math.max(40, dx);
    const cp1y = y1;
    const cp2x = x2 - Math.max(40, dx);
    const cp2y = y2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.strokeStyle = isDark ? '#EA580C' : '#EA580C';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Small connector dot at target
    ctx.beginPath();
    ctx.arc(x2, y2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#EA580C';
    ctx.fill();
  });

  // 4. Draw Nodes
  nodes.forEach((node) => {
    const isSticky = node.type === 'stickyNote';
    const nx = node.position.x + offsetX;
    const ny = node.position.y + offsetY;
    const def = nodeDefinitions[node.type];
    const color = def?.color || '#EA580C';

    if (isSticky) {
      const sw = node.parameters?.width || 240;
      const sh = node.parameters?.height || 160;
      // Draw sticky note background
      ctx.fillStyle = isDark ? '#272217' : '#fef3c7';
      ctx.strokeStyle = isDark ? '#78350f' : '#fde68a';
      ctx.lineWidth = 1.5;
      roundRect(ctx, nx, ny, sw, sh, 12);
      ctx.fill();
      ctx.stroke();

      // Note text
      ctx.fillStyle = isDark ? '#fef08a' : '#92400e';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(node.name || 'Note', nx + 12, ny + 24);

      ctx.fillStyle = isDark ? '#fef9c3' : '#78350f';
      ctx.font = '11px Inter, sans-serif';
      const text = node.parameters?.content || '';
      wrapText(ctx, text, nx + 12, ny + 46, sw - 24, 16);
      return;
    }

    const nw = 220;
    const nh = 88;

    // Node Card Background
    ctx.fillStyle = isDark ? '#1a1a1e' : '#ffffff';
    ctx.strokeStyle = isDark ? '#2e2e36' : '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, nx, ny, nw, nh, 12);
    ctx.fill();
    ctx.stroke();

    // Top Category Color Accent bar
    ctx.fillStyle = color;
    roundRectTop(ctx, nx, ny, nw, 4, 12);
    ctx.fill();

    // Node Icon Box
    ctx.fillStyle = `${color}25`;
    roundRect(ctx, nx + 12, ny + 16, 32, 32, 8);
    ctx.fill();

    // Draw generic initial or mark
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((node.name || 'N').slice(0, 1).toUpperCase(), nx + 28, ny + 37);
    ctx.textAlign = 'left';

    // Node Title
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 13px Inter, sans-serif';
    const truncatedName = (node.name || 'Node').length > 18
      ? (node.name || 'Node').slice(0, 18) + '...'
      : (node.name || 'Node');
    ctx.fillText(truncatedName, nx + 52, ny + 30);

    // Node Type / Category label
    ctx.fillStyle = isDark ? '#a1a1aa' : '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(def?.name || node.type, nx + 52, ny + 44);

    // Bottom Parameters / Status strip
    const exec = executionResults[node.id];
    if (exec) {
      const isSuccess = exec.status === 'success';
      const isError = exec.status === 'error';
      ctx.fillStyle = isSuccess ? '#10b981' : isError ? '#f43f5e' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(nx + 18, ny + 68, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#d4d4d8' : '#334155';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(isSuccess ? 'Executed successfully' : isError ? 'Run error' : 'Running', nx + 28, ny + 71);
    } else {
      ctx.fillStyle = isDark ? '#71717a' : '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(node.disabled ? 'Disabled' : 'Ready', nx + 14, ny + 71);
    }

    // Input & Output connection dots
    ctx.fillStyle = isDark ? '#27272e' : '#cbd5e1';
    ctx.strokeStyle = isDark ? '#52525b' : '#94a3b8';
    ctx.lineWidth = 2;
    // input port
    ctx.beginPath();
    ctx.arc(nx, ny + nh / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // output port
    ctx.beginPath();
    ctx.arc(nx + nw, ny + nh / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // 5. Export to PNG and trigger download
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create snapshot blob'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const filename = `${(workflow.name || 'workflow').toLowerCase().replace(/[^a-z0-9]+/g, '_')}_snapshot.png`;
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve(filename);
    }, 'image/png');
  });
}

// Canvas helper routines
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function roundRectTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
      if (curY > y + 100) {
        ctx.fillText('...', x, curY);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
