// Golden Hour — cover renderer. Draws a GTA-style multi-panel poster on a canvas.
// Own design, drawn entirely in code: panels, gradient 3D lettering, script subtitle,
// press quote, seal, barcode, billing block and palm silhouettes. No Rockstar artwork,
// no copied layout: every panel rect, colour and word below is ours.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.25) contrast(1.08)',
    wash: ['rgba(255,120,40,0.16)', 'rgba(255,40,120,0.20)'],
    titleTop: '#ffe95c', titleMid: '#ff9a3d', titleBot: '#ff2e88',
    subtitle: '#ff6fb5', accent: '#ffb03a', strip: '#2a0a2e',
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.45) contrast(1.12) hue-rotate(-8deg)',
    wash: ['rgba(255,0,160,0.20)', 'rgba(0,220,255,0.14)'],
    titleTop: '#fff36b', titleMid: '#ff5c8a', titleBot: '#b14bff',
    subtitle: '#5cf2ff', accent: '#ff5c8a', strip: '#12041f',
  },
  golden: {
    name: 'Golden Hour',
    filter: 'sepia(0.28) saturate(1.35) contrast(1.06)',
    wash: ['rgba(255,190,60,0.16)', 'rgba(255,120,20,0.14)'],
    titleTop: '#fff7ae', titleMid: '#ffc53d', titleBot: '#ff7a1a',
    subtitle: '#ffd94d', accent: '#ff9a3d', strip: '#241204',
  },
  afterdark: {
    name: 'After Dark',
    filter: 'brightness(0.92) saturate(1.25) contrast(1.12)',
    wash: ['rgba(40,20,90,0.30)', 'rgba(255,40,140,0.16)'],
    titleTop: '#ffe95c', titleMid: '#ff7a3d', titleBot: '#ff2e88',
    subtitle: '#ff8ac2', accent: '#7ab8ff', strip: '#0b0618',
  },
  vicepink: {
    name: 'Vice Pink',
    filter: 'saturate(1.4) contrast(1.07)',
    wash: ['rgba(255,60,160,0.18)', 'rgba(255,120,200,0.10)'],
    titleTop: '#fff3a0', titleMid: '#ff8ac2', titleBot: '#ff2e88',
    subtitle: '#ffffff', accent: '#ff5c8a', strip: '#2e0a24',
  },
};

// Layouts. Every panel is a polygon (4 points, 0..1 space) so slanted comic
// panels and plain rectangles share one code path. titleZone is where the big
// title block sits; stripZone is the bottom tagline/billing band.
export const LAYOUTS = {
  cast: {
    name: 'Cast Grid',
    blurb: 'Six panels, named cast, title across the middle',
    panels: [
      { x: 0.015, y: 0.02, w: 0.235, h: 0.40, label: 'THE INSIDER', sub: 'KNOWS EVERYTHING' },
      { x: 0.265, y: 0.02, w: 0.47, h: 0.40, label: 'THE DRIVER', sub: 'NEVER LOOKS BACK' },
      { x: 0.75, y: 0.02, w: 0.235, h: 0.40, label: 'THE BOSS', sub: 'OWNS THE COAST' },
      { x: 0.015, y: 0.46, w: 0.235, h: 0.36, label: 'THE RIDER', sub: 'RIDES AT DAWN' },
      { x: 0.265, y: 0.46, w: 0.47, h: 0.36, label: 'THE FIXER', sub: 'MAKES IT VANISH' },
      { x: 0.75, y: 0.46, w: 0.235, h: 0.36, label: 'THE COURIER', sub: 'ALWAYS ON TIME' },
    ],
    titleZone: { x: 0.03, y: 0.44, w: 0.94, h: 0.30, align: 'center' },
    stripZone: { x: 0.015, y: 0.86, w: 0.97, h: 0.12 },
  },
  split: {
    name: 'Sunset Split',
    blurb: 'One big hero photo left, four small panels right',
    panels: [
      { x: 0.015, y: 0.02, w: 0.52, h: 0.80, label: 'OCEAN DRIVE', sub: '6:42 PM · ENGINE RUNNING' },
      { x: 0.545, y: 0.02, w: 0.215, h: 0.39, label: 'MARINA BAY', sub: '7:05 PM · LAST BOAT' },
      { x: 0.775, y: 0.02, w: 0.21, h: 0.39, label: 'PALM ROW', sub: '6:12 PM · GOLDEN LIGHT' },
      { x: 0.545, y: 0.43, w: 0.215, h: 0.39, label: 'DECO ROW', sub: '8:40 PM · NEON ON' },
      { x: 0.775, y: 0.43, w: 0.21, h: 0.39, label: 'PIER 9', sub: '5:30 AM · FIRST CAST' },
    ],
    titleZone: { x: 0.03, y: 0.58, w: 0.94, h: 0.26, align: 'left' },
    stripZone: { x: 0.015, y: 0.86, w: 0.97, h: 0.12 },
  },
  comic: {
    name: 'Comic Slant',
    blurb: 'Slanted comic panels, title dead centre',
    slant: 0.03,
    panels: [
      { x: 0.01, y: 0.02, w: 0.22, h: 0.94, label: 'THE INSIDER', sub: 'KNOWS EVERYTHING' },
      { x: 0.245, y: 0.02, w: 0.125, h: 0.44, label: 'MOTEL', sub: 'PALM COURT' },
      { x: 0.385, y: 0.02, w: 0.26, h: 0.44, label: 'THE GETAWAY', sub: 'RED, FAST, LOUD' },
      { x: 0.66, y: 0.02, w: 0.115, h: 0.44, label: 'CITY', sub: 'NEVER SLEEPS' },
      { x: 0.79, y: 0.02, w: 0.20, h: 0.94, label: 'THE BOSS', sub: 'OWNS THE COAST' },
      { x: 0.245, y: 0.50, w: 0.125, h: 0.34, label: 'OCEAN', sub: 'SALT IN THE AIR' },
      { x: 0.385, y: 0.50, w: 0.26, h: 0.34, label: 'THE BOAT', sub: 'NO WAY BACK' },
      { x: 0.66, y: 0.50, w: 0.115, h: 0.34, label: 'PIER', sub: 'LAST LIGHT' },
    ],
    titleZone: { x: 0.30, y: 0.40, w: 0.52, h: 0.30, align: 'center' },
    stripZone: { x: 0.015, y: 0.86, w: 0.97, h: 0.12 },
  },
  strip: {
    name: 'Triple Strip',
    blurb: 'Three wide cinema strips, title over the last',
    panels: [
      { x: 0.015, y: 0.02, w: 0.97, h: 0.26, label: 'GOLDEN LIGHT', sub: '6:12 PM · PALM ROW' },
      { x: 0.015, y: 0.30, w: 0.97, h: 0.26, label: 'NEON ON', sub: '8:40 PM · DECO ROW' },
      { x: 0.015, y: 0.58, w: 0.97, h: 0.24, label: 'LAST BOAT', sub: '7:05 PM · MARINA BAY' },
    ],
    titleZone: { x: 0.03, y: 0.56, w: 0.94, h: 0.28, align: 'center' },
    stripZone: { x: 0.015, y: 0.86, w: 0.97, h: 0.12 },
  },
  hero: {
    name: 'Hero Single',
    blurb: 'One full-bleed photo, title over the sunset',
    panels: [
      { x: 0, y: 0, w: 1, h: 1, label: '', sub: '' },
    ],
    titleZone: { x: 0.03, y: 0.55, w: 0.94, h: 0.30, align: 'left' },
    stripZone: { x: 0.015, y: 0.86, w: 0.97, h: 0.12 },
  },
  locations: {
    name: 'Location Grid',
    blurb: 'Seven panels, every one stamped with a place and time',
    panels: [
      { x: 0.01, y: 0.02, w: 0.30, h: 0.60, label: 'OCEAN DRIVE', sub: '6:42 PM · ENGINE RUNNING' },
      { x: 0.325, y: 0.02, w: 0.33, h: 0.29, label: 'MARINA BAY', sub: '7:05 PM · LAST BOAT' },
      { x: 0.67, y: 0.02, w: 0.32, h: 0.29, label: 'PALM ROW', sub: '6:12 PM · GOLDEN LIGHT' },
      { x: 0.325, y: 0.33, w: 0.16, h: 0.29, label: 'DECO ROW', sub: '8:40 PM · NEON ON' },
      { x: 0.50, y: 0.33, w: 0.16, h: 0.29, label: 'PIER 9', sub: '5:30 AM · FIRST CAST' },
      { x: 0.675, y: 0.33, w: 0.155, h: 0.29, label: 'MOTEL', sub: 'PALM COURT · VACANCY' },
      { x: 0.845, y: 0.33, w: 0.145, h: 0.29, label: 'CITY', sub: 'NEVER SLEEPS' },
    ],
    titleZone: { x: 0.03, y: 0.64, w: 0.94, h: 0.22, align: 'center' },
    stripZone: { x: 0.015, y: 0.88, w: 0.97, h: 0.10 },
  },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  landscape: { w: 1920, h: 1080, label: '1920 × 1080' },
};

// Deterministic PRNG so the same state always renders the same pixels.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function polyPoints(p, W, H, slant) {
  const x0 = p.x * W, y0 = p.y * H, x1 = (p.x + p.w) * W, y1 = (p.y + p.h) * H;
  const s = (slant || 0) * W;
  return [[x0 + s, y0], [x1 + s, y0], [x1 - s, y1], [x0 - s, y1]];
}

function drawPanelPhoto(ctx, img, panel, W, H, slant, grade) {
  const pts = polyPoints(panel, W, H, slant);
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const bx = Math.min(...xs), by = Math.min(...ys);
  const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.clip();
  // Cover-fit the photo into the panel box, with the panel's zoom + pan.
  const zoom = panel.zoom || 1, ox = panel.ox || 0, oy = panel.oy || 0;
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(bw / iw, bh / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const dx = bx + (bw - dw) / 2 + ox * bw * 0.25;
  const dy = by + (bh - dh) / 2 + oy * bh * 0.25;
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  // Grade wash: warm top, hot bottom.
  const wash = ctx.createLinearGradient(0, by, 0, by + bh);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(bx, by, bw, bh);
  // Gentle top light so faces keep their highlights.
  const top = ctx.createLinearGradient(0, by, 0, by + bh * 0.45);
  top.addColorStop(0, 'rgba(255,220,140,0.10)');
  top.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = top;
  ctx.fillRect(bx, by, bw, bh * 0.45);
  ctx.restore();
  // Cream border around the panel.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,244,214,0.92)';
  ctx.lineWidth = Math.max(2, W * 0.0022);
  ctx.stroke();
  ctx.restore();
}

function drawCallout(ctx, panel, W, H, slant, titleZone) {
  if (!panel.label) return;
  const pts = polyPoints(panel, W, H, slant);
  const bx = Math.min(...pts.map((q) => q[0]));
  const panelTop = Math.min(...pts.map((q) => q[1]));
  const panelBottom = Math.max(...pts.map((q) => q[1]));
  // Callout goes on the panel edge farthest from the title block, so the big
  // title never paints over it.
  const titleCenterY = (titleZone.y + titleZone.h / 2) * H;
  const panelCenterY = (panel.y + panel.h / 2) * H;
  const atTop = panelCenterY < titleCenterY;
  const fs = Math.max(11, Math.round(W * 0.013));
  ctx.save();
  ctx.font = `800 ${fs}px Archivo, sans-serif`;
  const labelW = ctx.measureText(panel.label).width;
  ctx.font = `600 ${Math.round(fs * 0.78)}px Archivo, sans-serif`;
  const subW = panel.sub ? ctx.measureText(panel.sub).width : 0;
  const pad = fs * 0.55;
  const cw = Math.max(labelW, subW) + pad * 2;
  const ch = panel.sub ? fs * 2.5 : fs * 1.6;
  // Keep the chip inside the canvas: slanted panels bleed off the edges.
  const cx = Math.max(W * 0.008, Math.min(bx + W * 0.008, W - cw - W * 0.008));
  const cy = atTop ? panelTop + H * 0.012 : panelBottom - ch - H * 0.012;
  ctx.fillStyle = 'rgba(12,4,18,0.82)';
  ctx.fillRect(cx, cy, cw, ch);
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(cx, cy, W * 0.004, ch);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${fs}px Archivo, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(panel.label, cx + pad, cy + ch * (panel.sub ? 0.30 : 0.5));
  if (panel.sub) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `600 ${Math.round(fs * 0.78)}px Archivo, sans-serif`;
    ctx.fillText(panel.sub, cx + pad, cy + ch * 0.74);
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r, lines, grade) {
  ctx.save();
  ctx.translate(cx, cy);
  // Starburst edge.
  ctx.beginPath();
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI / spikes) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.78;
    const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#f7b731';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#7a4d00';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe9a8';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.strokeStyle = '#7a4d00';
  ctx.stroke();
  ctx.fillStyle = '#5c3400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shrink the seal text until the widest line fits inside the inner circle,
  // so no letter falls off the cream disc onto the dark poster.
  let fs = r * 0.24;
  ctx.font = `800 ${fs}px Archivo, sans-serif`;
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const maxW = r * 0.78 * 2 * 0.88;
  if (widest > maxW) {
    fs = Math.max(6, Math.floor(fs * maxW / widest));
    ctx.font = `800 ${fs}px Archivo, sans-serif`;
  }
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * fs * 1.25);
  });
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - w * 0.04, y - h * 0.12, w * 1.08, h * 1.24);
  ctx.fillStyle = '#111111';
  let bx = x;
  while (bx < x + w) {
    const bw = (1 + Math.floor(rnd() * 4)) * (w / 90);
    if (rnd() > 0.42) ctx.fillRect(bx, y, bw, h);
    bx += bw + (w / 90) * (0.6 + rnd() * 1.4);
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -34, 2, -62);
  ctx.stroke();
  // Fronds.
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.17);
    const len = 34 - Math.abs(i - 2.5) * 4;
    ctx.beginPath();
    ctx.moveTo(2, -62);
    ctx.quadraticCurveTo(
      2 + Math.cos(a) * len * 0.6, -62 + Math.sin(a) * len * 0.55 - 8,
      2 + Math.cos(a) * len, -62 + Math.sin(a) * len + 14,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function fitTitleFont(ctx, lines, maxW, startSize, family) {
  let size = startSize;
  while (size > 24) {
    ctx.font = `${size}px ${family}`;
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch (e) { /* older canvas */ }
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxW) return size;
    size = Math.floor(size * 0.92);
  }
  return size;
}

function drawTitleBlock(ctx, state, zone, W, H, grade) {
  const zx = zone.x * W, zy = zone.y * H, zw = zone.w * W, zh = zone.h * H;
  const lines = state.title.split('\n').map((s) => s.trim()).filter(Boolean);
  const align = zone.align || 'center';
  const qfs = Math.max(12, Math.round(W * 0.014));
  const zoneBottom = zy + zh * 0.98;
  // Save FIRST: fitTitleFont sets ctx.letterSpacing while measuring, and the
  // restore at the end must take that back to zero for the strip text.
  ctx.save();
  // Fit the whole block (quote + title + subtitle) inside the zone: shrink the
  // title until the subtitle's bottom clears the zone's bottom edge.
  const blockFor = (s) => {
    const lineH = s * 1.02;
    const ss = Math.round(s * 0.42);
    const q = zy + qfs;
    // Title baseline: quote gap + shadow allowance + cap height, so the title
    // never paints over the quote above it.
    const titleBase = q + qfs + s * 0.12 + s * 0.72;
    const first = titleBase - (lines.length - 1) * lineH;
    const sub = titleBase + s * 0.25 + ss * 0.8;
    return { lineH, subSize: ss, qy: q, titleBase, firstBase: first, subY: sub, bottom: sub + ss * 0.3 };
  };
  let size = fitTitleFont(ctx, lines, zw, Math.round(W * 0.115), 'Anton, sans-serif');
  let b = blockFor(size);
  while (b.bottom > zoneBottom && size > 24) {
    size = Math.floor(size * 0.92);
    b = blockFor(size);
  }
  const { lineH, subSize, qy, firstBase, subY } = b;
  ctx.textAlign = align === 'left' ? 'left' : 'center';
  ctx.textBaseline = 'alphabetic';
  const tx = align === 'left' ? zx : zx + zw / 2;
  // Kicker: press quote with five stars, above the title. Centred on the
  // whole quote block (stars + text), not on the text alone.
  const starR = qfs * 0.62;
  const starsW = starR * 2.3 * 5;
  ctx.font = `700 ${qfs}px Archivo, sans-serif`;
  const quoteText = `"${state.quote}" — ${state.quoteSource}`;
  const quoteW = starsW + qfs * 0.5 + ctx.measureText(quoteText).width;
  let qx = align === 'left' ? tx : tx - quoteW / 2;
  for (let i = 0; i < 5; i++) drawStar(ctx, qx + starR + i * starR * 2.3, qy - starR * 0.2, starR, '#ffd94d');
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${qfs}px Archivo, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(quoteText, qx + starsW + qfs * 0.5, qy);
  // Main title: 3D extrusion + vertical gradient + dark outline.
  ctx.textAlign = align === 'left' ? 'left' : 'center';
  const titleTop = firstBase + (lines.length - 1) * lineH;
  ctx.font = `${size}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch (e) { /* older canvas */ }
  const grad = ctx.createLinearGradient(0, titleTop - size, 0, titleTop + size * 0.12);
  grad.addColorStop(0, grade.titleTop);
  grad.addColorStop(0.55, grade.titleMid);
  grad.addColorStop(1, grade.titleBot);
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const by = firstBase + i * lineH;
    // Extrusion: stacked dark copies down-right.
    ctx.fillStyle = '#3d0a33';
    for (let k = 6; k >= 1; k--) ctx.fillText(line, tx + k * size * 0.012, by + k * size * 0.02);
    // Soft drop shadow.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    ctx.fillStyle = grad;
    ctx.fillText(line, tx, by);
    ctx.restore();
    // Crisp dark outline over the fill.
    ctx.strokeStyle = '#2a0a24';
    ctx.lineWidth = Math.max(2, size * 0.022);
    ctx.strokeText(line, tx, by);
  });
  // Script subtitle, slightly rotated, glowing pink. A dark underlay copy
  // first, so it stays readable over any photo, even a bright neon sign.
  ctx.save();
  const subX = align === 'left' ? zx : tx;
  ctx.translate(subX, subY);
  ctx.rotate(-0.035);
  ctx.font = `${subSize}px Yellowtail, cursive`;
  ctx.textAlign = align === 'left' ? 'left' : 'center';
  ctx.fillStyle = '#2a0a24';
  ctx.fillText(state.subtitle, subSize * 0.04, subSize * 0.05);
  ctx.fillStyle = grade.subtitle;
  ctx.shadowColor = grade.subtitle;
  ctx.shadowBlur = subSize * 0.35;
  ctx.fillText(state.subtitle, 0, 0);
  ctx.restore();
  ctx.restore();
}

export function renderCover(canvas, state, images) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.cast;
  const seed = hashString(`${state.title}|${state.layout}|${state.grade}`);
  // Background: deep plum, so panel gaps read as poster board.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1c0a20');
  bg.addColorStop(1, '#12041a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // Panels.
  layout.panels.forEach((panel, i) => {
    const photoId = state.panels?.[i]?.photoId;
    const img = (photoId && images[photoId]) || null;
    const p = { ...panel, ...(state.panels?.[i] || {}) };
    if (img) drawPanelPhoto(ctx, img, p, W, H, layout.slant || 0, grade);
    else {
      // Empty panel slot: dark card so the layout still reads.
      const pts = polyPoints(p, W, H, layout.slant || 0);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < 4; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.restore();
    }
    drawCallout(ctx, p, W, H, layout.slant || 0, layout.titleZone);
  });
  // Title block over the panels.
  drawTitleBlock(ctx, state, layout.titleZone, W, H, grade);
  // Chrome: volume badge top-right, seal bottom-right, barcode, billing, palms.
  const sz = layout.stripZone;
  const sx = sz.x * W, sy = sz.y * H, sw = sz.w * W, sh = sz.h * H;
  // Palm silhouettes along the strip.
  const palmColor = 'rgba(10,3,14,0.85)';
  const palmScale = Math.max(0.5, W / 1400);
  drawPalm(ctx, sx + sw * 0.06, sy + sh * 0.92, palmScale, palmColor);
  drawPalm(ctx, sx + sw * 0.12, sy + sh * 0.95, palmScale * 0.8, palmColor);
  drawPalm(ctx, sx + sw * 0.90, sy + sh * 0.92, palmScale * 0.9, palmColor);
  // Tagline strip text, centred between the palms.
  const tfs = Math.max(12, Math.round(W * 0.017));
  ctx.save();
  ctx.font = `800 ${tfs}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(state.tagline, sx + sw / 2, sy + sh * 0.30);
  // Billing block.
  const bfs = Math.max(9, Math.round(W * 0.0085));
  ctx.font = `600 ${bfs}px Archivo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText(state.billing, sx + sw / 2, sy + sh * 0.72);
  ctx.restore();
  // Volume badge, top-right.
  const vfs = Math.max(12, Math.round(W * 0.016));
  ctx.save();
  ctx.font = `800 ${vfs}px Archivo, sans-serif`;
  const vw = ctx.measureText(state.vol).width + vfs * 1.4;
  const vh = vfs * 1.9;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(W - vw - W * 0.015, H * 0.015, vw, vh);
  ctx.fillStyle = '#160818';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.vol, W - vw / 2 - W * 0.015, H * 0.015 + vh / 2);
  ctx.restore();
  // Seal, bottom-right, overlapping the strip.
  const sealR = Math.max(26, W * 0.038);
  drawSeal(ctx, W - sealR * 1.25, H - sealR * 1.35, sealR, state.sealLines, grade);
  // Barcode, bottom-left of the strip.
  drawBarcode(ctx, sx + sw * 0.02, sy + sh * 0.62, W * 0.055, sh * 0.26, seed);
  // Global grade wash + vignette, so the whole poster shares one sunset.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,2,12,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  return canvas;
}
