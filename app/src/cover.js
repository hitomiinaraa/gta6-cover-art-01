// Golden Hour — canvas cover renderer for the GTA 6 cover studio.
// Pure canvas 2D, no libraries. Draws one cover from a state object:
// { layout, grade, size, title, subtitle, tagline, quote, quoteSource, vol,
//   panels: [{ photo, zoom, panX, panY, label }] }
// Layouts and grades are data-driven; every panel photo is cover-fit with
// zoom + pan, then the poster furniture (title, quote strip, seal, barcode,
// billing, palms, per-panel chips) is painted on top.
import { GRADES, LAYOUTS, SIZES } from './cover-data.js';

export const LAYOUT_IDS = ['cast', 'split', 'slant', 'strip', 'hero', 'location'];
export const GRADE_IDS = ['sunset', 'neon', 'golden', 'dark', 'vice'];
export const SIZE_IDS = ['square', 'portrait', 'wide'];

export const SIZE_DIMS = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

// Small deterministic PRNG (mulberry32) so the barcode is stable per cover.
function rngFor(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitFont(ctx, text, weight, family, maxWidth, startPx, minPx) {
  let px = startPx;
  while (px > minPx) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return px;
    px -= 2;
  }
  ctx.font = `${weight} ${minPx}px ${family}`;
  return minPx;
}

function drawCoverFit(ctx, img, rect, zoom, panX, panY) {
  const pw = rect.w, ph = rect.h;
  const scale = Math.max(pw / img.width, ph / img.height) * zoom;
  const sw = pw / scale, sh = ph / scale;
  const sx = Math.max(0, Math.min(img.width - sw, (img.width - sw) / 2 + panX * img.width * 0.4));
  const sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) / 2 + panY * img.height * 0.4));
  ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, pw, ph);
}

function starburst(ctx, cx, cy, rOuter, rInner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve leaning right.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 44, -128);
  ctx.stroke();
  // Fronds: arcs fanning from the crown.
  const crown = [44, -128];
  for (let i = 0; i < 6; i++) {
    const ang = -Math.PI * (0.08 + i * 0.16);
    const len = 74 - Math.abs(i - 2.5) * 10;
    const ex = crown[0] + Math.cos(ang) * len;
    const ey = crown[1] + Math.sin(ang) * len * 0.55;
    ctx.beginPath();
    ctx.moveTo(crown[0], crown[1]);
    ctx.quadraticCurveTo(
      crown[0] + Math.cos(ang) * len * 0.5, crown[1] + Math.sin(ang) * len * 0.5 - 16,
      ex, ey,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seed) {
  const rand = rngFor(seed);
  ctx.fillStyle = '#ffffff';
  let cx = x;
  while (cx < x + w - 4) {
    const bw = 1 + Math.floor(rand() * 4);
    if (rand() > 0.42) ctx.fillRect(cx, y, bw, h);
    cx += bw + 1 + Math.floor(rand() * 3);
  }
}

export function renderCover(canvas, state, images) {
  const [W, H] = SIZE_DIMS[state.size] || SIZE_DIMS.square;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.golden;
  const layout = LAYOUTS[state.layout] || LAYOUTS.cast;
  const g = 0.008 * W; // gutter
  const stripH = 0.115 * H; // bottom quote/billing strip
  // Dedicated title band at the top (never overlaid on the photos, so the
  // title can never collide with bright photo content or panel chips).
  const bandH = (W > H ? 0.30 : 0.24) * H;
  const panelArea = { x: 0, y: bandH, w: W, h: H - stripH - bandH };
  const rects = layout(panelArea, g);

  // --- panels ---
  ctx.save();
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const p = state.panels[i] || { photo: 0, zoom: 1, panX: 0, panY: 0, label: '' };
    const img = images[p.photo] || images[0];
    ctx.save();
    ctx.beginPath();
    if (r.slant) {
      ctx.moveTo(r.x + r.slant, r.y);
      ctx.lineTo(r.x + r.w, r.y);
      ctx.lineTo(r.x + r.w - r.slant, r.y + r.h);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.closePath();
    } else {
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.clip();
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.filter = grade.filter;
      drawCoverFit(ctx, img, r, p.zoom || 1, p.panX || 0, p.panY || 0);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#1b1b22';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    // Panel inner border, following the clip path (slant panels included).
    ctx.save();
    ctx.beginPath();
    if (r.slant) {
      ctx.moveTo(r.x + r.slant, r.y);
      ctx.lineTo(r.x + r.w, r.y);
      ctx.lineTo(r.x + r.w - r.slant, r.y + r.h);
      ctx.lineTo(r.x, r.y + r.h);
      ctx.closePath();
    } else {
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // --- grade wash over the panel area ---
  ctx.save();
  ctx.beginPath();
  ctx.rect(panelArea.x, panelArea.y, panelArea.w, panelArea.h);
  ctx.clip();
  const wash = ctx.createLinearGradient(0, panelArea.y, W * 0.35, panelArea.y + panelArea.h);
  wash.addColorStop(0, grade.washA);
  wash.addColorStop(0.55, grade.washB);
  wash.addColorStop(1, grade.washC);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(panelArea.x, panelArea.y, panelArea.w, panelArea.h);
  ctx.globalCompositeOperation = 'source-over';
  // Vignette: darken the panel edges a touch.
  const vig = ctx.createRadialGradient(W / 2, panelArea.y + panelArea.h * 0.45, Math.min(W, panelArea.h) * 0.42, W / 2, panelArea.y + panelArea.h * 0.45, Math.max(W, panelArea.h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(panelArea.x, panelArea.y, panelArea.w, panelArea.h);
  ctx.restore();

  // --- title band (solid, so the title always reads) ---
  const bandGrad = ctx.createLinearGradient(0, 0, 0, bandH);
  bandGrad.addColorStop(0, '#170b24');
  bandGrad.addColorStop(1, '#241031');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, 0, W, bandH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, bandH - Math.max(3, H * 0.004), W, Math.max(3, H * 0.004));

  const titlePx = fitFont(ctx, state.title, 400, 'Anton, sans-serif', W * 0.92, Math.round(Math.min(W * 0.148, bandH * 0.55)), Math.round(W * 0.05));
  const titleY = Math.round(bandH * 0.52);
  const grad = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY + titlePx * 0.25);
  grad.addColorStop(0, grade.titleA);
  grad.addColorStop(0.55, grade.titleB);
  grad.addColorStop(1, grade.titleC);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // 3D extrusion: offset copies downwards in deep magenta, then the gradient face.
  ctx.fillStyle = grade.extrude;
  for (let d = 9; d >= 3; d -= 3) {
    ctx.fillText(state.title, W * 0.035 + d, titleY + d);
  }
  ctx.fillStyle = grad;
  ctx.fillText(state.title, W * 0.035, titleY);
  ctx.lineWidth = Math.max(2, W * 0.0016);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeText(state.title, W * 0.035, titleY);

  // Subtitle in script, tucked under the title.
  const subPx = Math.round(Math.min(W * 0.042, bandH * 0.17));
  ctx.font = `${subPx}px Yellowtail, cursive`;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(state.subtitle, W * 0.04, Math.round(bandH * 0.76));

  // VOL badge, top-right inside the title band.
  const volPx = Math.round(Math.min(W * 0.026, bandH * 0.15));
  ctx.font = `700 ${volPx}px Archivo, sans-serif`;
  const volW = ctx.measureText(state.vol).width + volPx * 1.2;
  const volX = W - volW - W * 0.03;
  const volY = bandH * 0.10;
  ctx.fillStyle = 'rgba(10,6,18,0.72)';
  ctx.fillRect(volX, volY, volW, volPx * 1.7);
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeRect(volX, volY, volW, volPx * 1.7);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(state.vol, volX + volW / 2, volY + volPx * 1.22);
  ctx.textAlign = 'left';

  // Tagline strip at the bottom of the band.
  const tagPx = Math.round(Math.min(W * 0.021, bandH * 0.10));
  ctx.font = `700 ${tagPx}px Archivo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(state.tagline, W * 0.04, Math.round(bandH * 0.95));

  // --- seal (starburst, right side just below the title band) ---
  const sealR = W * 0.052;
  const sealX = W * 0.885, sealY = bandH + panelArea.h * 0.10;
  ctx.save();
  ctx.translate(sealX, sealY);
  ctx.rotate(-0.22);
  starburst(ctx, 0, 0, sealR, sealR * 0.78, 14);
  ctx.fillStyle = grade.seal;
  ctx.fill();
  ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${Math.round(sealR * 0.30)}px Archivo, sans-serif`;
  ctx.fillText('GOLDEN', 0, -sealR * 0.22);
  ctx.fillText('HOUR', 0, sealR * 0.12);
  ctx.font = `700 ${Math.round(sealR * 0.20)}px Archivo, sans-serif`;
  ctx.fillText('EST. 2026', 0, sealR * 0.44);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // --- palms at the bottom corners of the panel area (before the strip) ---
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawPalm(ctx, W * 0.015, panelArea.h - 4, W * 0.00042, false, '#0a0512');
  drawPalm(ctx, W * 0.985, panelArea.h - 4, W * 0.00038, true, '#0a0512');
  ctx.restore();

  // --- per-panel chips (top-left; the title band sits above the panels now,
  // so no chip can ever meet the title or the VOL badge) ---
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    const p = state.panels[i] || { label: '' };
    const label = (p.label || '').trim();
    if (!label) continue;
    const chipPx = Math.round(W * 0.019);
    ctx.font = `700 ${chipPx}px Archivo, sans-serif`;
    const tw = ctx.measureText(label).width;
    const cw = tw + chipPx * 1.4, ch = chipPx * 1.9;
    const cx = r.x + Math.max(g, W * 0.008);
    const cy = r.y + Math.max(g, W * 0.008);
    ctx.fillStyle = 'rgba(8,4,14,0.78)';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(1, W * 0.0012);
    ctx.strokeRect(cx, cy, cw, ch);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, cx + chipPx * 0.7, cy + chipPx * 1.32);
  }

  // --- bottom strip: press quote + barcode + billing ---
  const stripY = H - stripH;
  ctx.fillStyle = '#0d0a14';
  ctx.fillRect(0, stripY, W, stripH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, stripY, W, Math.max(3, H * 0.004));
  const qPx = Math.round(W * 0.024);
  const stars = '★★★★★';
  ctx.font = `${qPx}px Archivo, sans-serif`;
  ctx.fillStyle = '#ffd166';
  const starW = ctx.measureText(stars).width;
  ctx.fillText(stars, W * 0.035, stripY + stripH * 0.38);
  const quotePx = fitFont(ctx, `“${state.quote}”`, 700, 'Archivo, sans-serif', W * 0.58, Math.round(W * 0.026), Math.round(W * 0.014));
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`“${state.quote}”`, W * 0.035 + starW + W * 0.015, stripY + stripH * 0.38);
  const srcPx = Math.round(W * 0.018);
  ctx.font = `700 ${srcPx}px Archivo, sans-serif`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(`— ${state.quoteSource}`, W * 0.035, stripY + stripH * 0.68);
  ctx.font = `${Math.round(W * 0.013)}px Archivo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.fillText('A FAN-MADE COVER STUDIO · NOT AFFILIATED WITH ROCKSTAR GAMES · PHOTOS ARE MODEL-MADE', W * 0.035, stripY + stripH * 0.90);
  // Barcode, bottom-right.
  const barW = W * 0.13, barH = stripH * 0.52;
  drawBarcode(ctx, W * 0.845, stripY + stripH * 0.16, barW, barH, state.title.length * 7919 + state.panels.length);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(W * 0.013)}px Archivo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('8 90216 07713 4', W * 0.845 + barW / 2, stripY + stripH * 0.16 + barH + W * 0.016);
  ctx.textAlign = 'left';
}
