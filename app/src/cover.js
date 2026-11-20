// Golden Hour v4 — the cover renderer.
// Draws the whole poster on a 2D canvas: photographic panels, title ON the
// art (no solid band), white-pill chips, quote strip, sunset band with palms,
// billing line with barcode, and the seal. Written fresh for v4; the v4
// diagnosis (DIAGNOSIS-v3.md §6) is the spec.

import { SIZES, LAYOUTS, GRADES, PHOTOS, DEFAULT_CROPS, PANEL_LABELS, CAPTIONS } from './cover-data.js';

// Vertical layout of the cover, as fractions of the height H.
const PANEL_H = 0.86;  // panels occupy the top 86% of the cover
const STRIP_H = 0.095; // sunset band
const BILL_H = 0.045;  // billing line (0.86 + 0.095 + 0.045 = 1.00)
const QUOTE_H = 0.055; // quote strip, overlaid on the bottom of the panels

export function defaultState() {
  return {
    layout: 'cast',
    grade: 'sunset',
    size: 'wide',
    title: CAPTIONS.title,
    script: CAPTIONS.script,
    tagline: CAPTIONS.tagline,
    quote: CAPTIONS.quote,
    quoteBy: CAPTIONS.quoteBy,
    paint: 10,   // panel tint strength (0..100)
    glow: 26,    // title glow (0..100)
    titleSize: 100, // title scale % (50..140)
    showSeal: true,
    showQuote: true,
    showChips: true,
    showBilling: true,
    selected: 0,
    // one crop per panel slot; layouts with fewer panels use the first N
    crops: DEFAULT_CROPS.map((c) => ({ ...c })),
  };
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}

function panelRects(layoutId, W, H) {
  const area = { x: 0, y: 0, w: W, h: H * PANEL_H };
  const gap = Math.max(2, Math.round(W * 0.006));
  return LAYOUTS[layoutId].panels.map((p) => ({
    x: area.x + p.x * area.w + gap / 2,
    y: area.y + p.y * area.h + gap / 2,
    w: p.w * area.w - gap,
    h: p.h * area.h - gap,
    slant: (p.slant || 0) * area.w,
  }));
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Cover-fit a photo into a rect, with zoom and pan (0..1 = window centre).
function drawPhotoFit(ctx, img, r, zoom, panX, panY) {
  const scale = Math.max(r.w / img.width, r.h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = r.x + (r.w - dw) * panX;
  const dy = r.y + (r.h - dh) * panY;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitFont(ctx, text, family, weight, maxW, startPx) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px *= 0.95;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function spacedText(ctx, text, x, y, spacing) {
  // Draw letterspaced text centred on x (ctx.letterSpacing is not reliable
  // across engines, so we place glyphs by hand).
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
  let cx = x - total / 2;
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + spacing;
  });
  return total;
}

export function drawPalm(ctx, x, y, s, color) {
  // A palm silhouette: curved trunk + six drooping fronds, drawn as strokes.
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.55, x + s * 0.22, y - s);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = y - s;
  ctx.lineWidth = Math.max(1, s * 0.045);
  const fronds = [
    [-1.0, -0.15, -0.95, 0.35], [-0.7, -0.5, -0.6, 0.3],
    [-0.25, -0.65, -0.15, 0.35], [0.3, -0.6, 0.45, 0.3],
    [0.75, -0.45, 0.95, 0.3], [1.0, -0.1, 1.05, 0.4],
  ];
  for (const [dx1, dy1, dx2, dy2] of fronds) {
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + s * dx1 * 0.55, topY + s * dy1 * 0.55,
      topX + s * dx2, topY + s * dy2,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY + s * 0.03, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r, lines) {
  // Starburst seal: 12-point star, yellow, dark outline, two text lines.
  ctx.save();
  ctx.beginPath();
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI * i) / spikes - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.82;
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#FFC93C';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#1A0B2E';
  ctx.stroke();
  ctx.fillStyle = '#1A0B2E';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.34}px Archivo, sans-serif`;
  ctx.fillText(lines[0], cx, cy - r * 0.16);
  ctx.fillText(lines[1], cx, cy + r * 0.2);
  ctx.font = `900 ${r * 0.22}px Archivo, sans-serif`;
  ctx.fillText('★ EST. 2026 ★', cx, cy + r * 0.52);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seedText) {
  // Seeded bars from the title string, so the same title always bars the same.
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + 3;
  while (bx < x + w - 3) {
    const bw = 1 + Math.floor(rnd() * 3);
    if (rnd() > 0.45) ctx.fillRect(bx, y + 2, bw, h - 12);
    bx += bw + 1 + Math.floor(rnd() * 2);
  }
  ctx.font = `400 ${Math.max(7, h * 0.16)}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('8 901234 567890', x + w / 2, y + h - 1);
  ctx.restore();
}

export function renderCover(ctx, W, H, state, images, opts = {}) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const size = SIZES[state.size] || SIZES.wide;
  const rects = panelRects(state.layout, W, H);
  const panelH = H * PANEL_H;
  const stripY = panelH;
  const stripH = H * STRIP_H;
  const billY = panelH + stripH;
  const billH = H * BILL_H;

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0B0614';
  ctx.fillRect(0, 0, W, H);

  // ---- 1. Photographic panels (fix #1: photos are the default everywhere)
  rects.forEach((r, i) => {
    const crop = state.crops[i] || state.crops[0];
    const img = images[crop.photo] || images[0];
    ctx.save();
    ctx.beginPath();
    if (r.slant) {
      ctx.moveTo(r.x + r.slant, r.y);
      ctx.lineTo(r.x + r.w + r.slant, r.y);
      ctx.lineTo(r.x + r.w - r.slant, r.y + r.h);
      ctx.lineTo(r.x - r.slant, r.y + r.h);
      ctx.closePath();
    } else {
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.clip();
    if (img) drawPhotoFit(ctx, img, r, crop.zoom, crop.panX, crop.panY);
    // Per-panel grade tint, alternating strength so panels read apart.
    ctx.globalAlpha = (state.paint / 100) * (i % 2 === 0 ? 0.5 : 0.85);
    ctx.fillStyle = grade.tint;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalAlpha = 1;
    ctx.restore();
    // Dark gutter.
    ctx.strokeStyle = 'rgba(11,6,20,0.9)';
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  });

  // ---- Grade wash + vignette over the whole panel area
  const wash = ctx.createLinearGradient(0, 0, 0, panelH);
  wash.addColorStop(0, 'rgba(255,120,40,0.05)');
  wash.addColorStop(0.6, 'rgba(255,46,136,0.04)');
  wash.addColorStop(1, 'rgba(20,5,40,0.12)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, panelH);
  const vig = ctx.createRadialGradient(W / 2, panelH / 2, Math.min(W, panelH) * 0.35, W / 2, panelH / 2, Math.max(W, panelH) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,2,12,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, panelH);

  // ---- 2. Title ON the art (fix #2: no solid band)
  // The zone covers the whole title block (title + script + tagline), and
  // sits high enough that the bottom-row panels' chips (which start at
  // 0.50 of the panel area) clear the title's bottom edge.
  const titleZoneTop = panelH * 0.24;
  const titleZoneBottom = panelH * 0.62;
  // Scrim: darkens only the middle of the photo, fades out at the edges.
  const scrim = ctx.createLinearGradient(0, titleZoneTop, 0, titleZoneBottom);
  scrim.addColorStop(0, 'rgba(8,3,20,0)');
  scrim.addColorStop(0.25, 'rgba(8,3,20,0.45)');
  scrim.addColorStop(0.75, 'rgba(8,3,20,0.45)');
  scrim.addColorStop(1, 'rgba(8,3,20,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, titleZoneTop, W, titleZoneBottom - titleZoneTop);

  const titlePx = fitFont(ctx, state.title, 'Anton, sans-serif', 400, W * 0.96, H * 0.16 * (state.titleSize / 100));
  const titleW = ctx.measureText(state.title).width;
  const titleY = titleZoneTop + (titleZoneBottom - titleZoneTop) * 0.18;
  const grad = ctx.createLinearGradient(0, titleY, 0, titleY + titlePx);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(0.55, grade.title[1]);
  grad.addColorStop(1, grade.title[2]);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = grade.title[1];
  ctx.shadowBlur = (state.glow / 100) * H * 0.02;
  // 3D extrusion: dark copies offset downwards.
  ctx.fillStyle = '#1A0B2E';
  for (let k = 3; k >= 1; k--) {
    ctx.fillText(state.title, W / 2, titleY + (H * 0.004) * k);
  }
  ctx.fillStyle = grad;
  ctx.fillText(state.title, W / 2, titleY);
  ctx.lineWidth = Math.max(1.5, H * 0.003);
  ctx.strokeStyle = 'rgba(10,3,22,0.85)';
  ctx.strokeText(state.title, W / 2, titleY);
  ctx.restore();

  // Script overlapping the title's bottom edge.
  const scriptPx = Math.round(titlePx * 0.42);
  const scriptY = titleY + titlePx * 0.92;
  ctx.save();
  ctx.font = `${scriptPx}px Yellowtail, cursive`;
  const scriptW = ctx.measureText(state.script).width;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(2, scriptPx * 0.12);
  ctx.strokeStyle = 'rgba(10,3,22,0.9)';
  ctx.strokeText(state.script, W / 2, scriptY);
  ctx.fillStyle = grade.script;
  ctx.fillText(state.script, W / 2, scriptY);
  ctx.restore();

  // Tagline under the script.
  const tagPx = Math.max(11, Math.round(H * 0.026));
  const tagY = scriptY + scriptPx * 1.15;
  ctx.save();
  ctx.font = `700 ${tagPx}px Archivo, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(10,3,22,0.9)';
  ctx.shadowBlur = 4;
  const tagW = spacedText(ctx, state.tagline, W / 2, tagY, tagPx * 0.35);
  ctx.restore();

  // The title block's bounding box: the chips must never sit on it.
  const titleBox = {
    x0: Math.min(W / 2 - titleW / 2, W / 2 - scriptW / 2, W / 2 - tagW / 2),
    x1: Math.max(W / 2 + titleW / 2, W / 2 + scriptW / 2, W / 2 + tagW / 2),
    y0: titleY,
    y1: tagY + tagPx,
  };

  // ---- 7. White-pill chips (fix #7), placed at the panel corner farthest
  // from the title block (fix #4): the title is centred and wide, so a
  // top-left chip on a middle or lower panel can sit on the script or the
  // tagline. Corners are tried top-left, top-right, bottom-left,
  // bottom-right; bottom corners sit just above the quote strip, and no
  // chip may touch the seal.
  if (state.showChips) {
    const chipPx = Math.max(11, Math.round(H * 0.017));
    const inset = Math.max(6, W * 0.008);
    const quoteTop = panelH - H * QUOTE_H;
    const sealCx = W * 0.93;
    const sealCy = panelH - H * 0.005;
    const sealR = H * 0.048;
    const hitsTitle = (r) => r.x < titleBox.x1 && r.x + r.w > titleBox.x0 && r.y < titleBox.y1 && r.y + r.h > titleBox.y0;
    const hitsSeal = (r) => {
      const cx = Math.max(r.x, Math.min(sealCx, r.x + r.w));
      const cy = Math.max(r.y, Math.min(sealCy, r.y + r.h));
      const dx = cx - sealCx;
      const dy = cy - sealCy;
      return dx * dx + dy * dy < (sealR + 4) * (sealR + 4);
    };
    ctx.save();
    ctx.font = `800 ${chipPx}px Archivo, sans-serif`;
    ctx.textBaseline = 'middle';
    rects.forEach((r, i) => {
      const label = PANEL_LABELS[i] || 'PANEL ' + (i + 1);
      const tw = ctx.measureText(label).width;
      const padX = chipPx * 0.7;
      const padY = chipPx * 0.45;
      const cw = tw + padX * 2;
      const ch = chipPx + padY * 2;
      const bottomY = Math.min(r.y + r.h, quoteTop) - inset - ch;
      const corners = [
        { x: r.x + inset, y: r.y + inset },
        { x: r.x + r.w - inset - cw, y: r.y + inset },
        { x: r.x + inset, y: bottomY },
        { x: r.x + r.w - inset - cw, y: bottomY },
      ];
      let pick = corners[0];
      for (const c of corners) {
        const rect = { x: c.x, y: c.y, w: cw, h: ch };
        if (!hitsTitle(rect) && !hitsSeal(rect)) { pick = c; break; }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.96)';
      roundRect(ctx, pick.x, pick.y, cw, ch, ch / 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'left';
      ctx.fillText(label, pick.x + padX, pick.y + ch / 2);
    });
    // VOL badge, top-right of the cover.
    const vol = 'VOL. 1';
    const tw = ctx.measureText(vol).width;
    const padX = chipPx * 0.7;
    const padY = chipPx * 0.45;
    const vw = tw + padX * 2;
    const vh = chipPx + padY * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    roundRect(ctx, W - vw - Math.max(6, W * 0.008), Math.max(6, W * 0.008), vw, vh, vh / 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'left';
    ctx.fillText(vol, W - vw - Math.max(6, W * 0.008) + padX, Math.max(6, W * 0.008) + vh / 2);
    ctx.restore();
  }

  // ---- Quote strip across the bottom of the panels. The text is fitted
  // to 76% of the width and centred left of centre, so the seal
  // (bottom-right) never covers its tail.
  if (state.showQuote) {
    const qy = panelH - H * QUOTE_H;
    ctx.fillStyle = 'rgba(5,2,12,0.55)';
    ctx.fillRect(0, qy, W, H * QUOTE_H);
    const qText = `★★★★★  "${state.quote}" — ${state.quoteBy}`;
    let qPx = Math.max(11, Math.round(H * 0.02));
    ctx.save();
    ctx.font = `700 ${qPx}px Archivo, sans-serif`;
    while (qPx > 10 && ctx.measureText(qText).width > W * 0.76) {
      qPx -= 1;
      ctx.font = `700 ${qPx}px Archivo, sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(qText, W * 0.45, qy + (H * QUOTE_H) / 2);
    ctx.restore();
  }

  // ---- 5. Sunset band as art (fix #5): gradient + sun + palms + band text
  const bandGrad = ctx.createLinearGradient(0, stripY, 0, stripY + stripH);
  bandGrad.addColorStop(0, grade.strip[0]);
  bandGrad.addColorStop(0.55, grade.strip[1]);
  bandGrad.addColorStop(1, grade.strip[2]);
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, stripY, W, stripH);
  // Sun disc removed: in a band this short the disc collided with the
  // palm silhouettes and the centred band text (the rank-1 bands use a
  // gradient + palms + text only). The gradient carries the sunset.
  // Palm silhouettes at the band's edges (not under the centred text).
  drawPalm(ctx, W * 0.04, stripY + stripH * 0.98, stripH * 0.95, '#1A0B2E');
  drawPalm(ctx, W * 0.08, stripY + stripH * 0.98, stripH * 0.7, '#1A0B2E');
  drawPalm(ctx, W * 0.94, stripY + stripH * 0.98, stripH * 0.9, '#1A0B2E');
  drawPalm(ctx, W * 0.975, stripY + stripH * 0.98, stripH * 0.65, '#1A0B2E');
  // Band text, centred left of centre and fitted to 72% of the width,
  // so the seal (bottom-right) never clips its tail.
  let bandPx = Math.max(11, Math.round(H * 0.024));
  ctx.save();
  ctx.font = `800 ${bandPx}px Archivo, sans-serif`;
  const bandSpacing = () => bandPx * 0.3;
  const bandWidth = () => {
    let total = 0;
    for (const ch of CAPTIONS.band) total += ctx.measureText(ch).width;
    return total + bandSpacing() * (CAPTIONS.band.length - 1);
  };
  while (bandPx > 10 && bandWidth() > W * 0.72) {
    bandPx -= 1;
    ctx.font = `800 ${bandPx}px Archivo, sans-serif`;
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(10,3,22,0.8)';
  ctx.shadowBlur = 3;
  spacedText(ctx, CAPTIONS.band, W * 0.44, stripY + stripH / 2, bandPx * 0.3);
  ctx.restore();

  // ---- Billing line
  if (state.showBilling) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, billY, W, billH);
    const bPx = Math.max(8, Math.round(H * 0.013));
    ctx.save();
    ctx.font = `400 ${bPx}px Archivo, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#BBBBBB';
    ctx.fillText(CAPTIONS.billing, W * 0.012, billY + billH / 2);
    ctx.restore();
    const bw = Math.min(W * 0.09, 170);
    drawBarcode(ctx, W - bw - W * 0.012, billY + billH * 0.12, bw, billH * 0.76, state.title);
  }

  // ---- 4. Seal (fix #4): bottom-right, straddling the panel/band boundary,
  // clear of any panel text (chips are top-left, quote text is centred).
  if (state.showSeal) {
    drawSeal(ctx, W * 0.93, panelH - H * 0.005, H * 0.048, ['GOLDEN', 'HOUR']);
  }

  // ---- Editor selection outline (preview only, never in exports)
  if (opts.preview && state.selected != null && rects[state.selected]) {
    const r = rects[state.selected];
    ctx.save();
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.setLineDash([Math.max(6, W * 0.008), Math.max(4, W * 0.005)]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
    const badge = String(state.selected + 1);
    ctx.font = `800 ${Math.max(12, H * 0.02)}px Archivo, sans-serif`;
    const bw = ctx.measureText(badge).width + 16;
    ctx.fillStyle = '#22D3EE';
    roundRect(ctx, r.x + r.w / 2 - bw / 2, r.y + r.h / 2 - 14, bw, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#0B0614';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, r.x + r.w / 2, r.y + r.h / 2);
    ctx.restore();
  }

  ctx.restore();
  return { rects, size };
}

export { SIZES, LAYOUTS, GRADES, PHOTOS, PANEL_LABELS, CAPTIONS };
