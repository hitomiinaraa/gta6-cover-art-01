// Golden Hour — GTA-style cover renderer.
// Draws a multi-panel poster (panels + gradient 3D title + script subtitle +
// press quote + seal + tagline + billing + barcode) on a canvas, in the
// project's own design. No Rockstar artwork, logo or font: all lettering is
// drawn in code with OFL fonts (Anton, Yellowtail, Archivo).

export const GRADES = {
  sunset: { name: 'Sunset', top: '#ff9a3d', mid: '#ff5e7a', bot: '#7a2d8f', tint: 'rgba(255,110,60,0.10)', vig: 0.22 },
  neon: { name: 'Neon', top: '#ff2e88', mid: '#b44dff', bot: '#1b2a6b', tint: 'rgba(255,46,136,0.12)', vig: 0.26 },
  golden: { name: 'Golden Hour', top: '#ffd76a', mid: '#ff8a3d', bot: '#8f2d5e', tint: 'rgba(255,190,80,0.12)', vig: 0.20 },
  dark: { name: 'After Dark', top: '#2b3a8f', mid: '#5b2d8f', bot: '#120a24', tint: 'rgba(40,60,180,0.14)', vig: 0.30 },
  vice: { name: 'Vice Pink', top: '#ff5fa2', mid: '#ff2e88', bot: '#4a1042', tint: 'rgba(255,47,136,0.14)', vig: 0.24 },
};

export const LAYOUTS = {
  cast: { name: 'Cast Grid', panels: 6 },
  split: { name: 'Sunset Split', panels: 3 },
  slant: { name: 'Comic Slant', panels: 5 },
  strip: { name: 'Triple Strip', panels: 3 },
  hero: { name: 'Hero Single', panels: 3 },
  location: { name: 'Location Grid', panels: 6 },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const CAST_NAMES = ['THE INSIDER', 'THE BOSS', 'THE RIDER', 'THE DRIVER', 'THE COURIER', 'THE FIXER'];
export const PLACES = [
  { label: 'OCEAN DRIVE', time: '6:42 PM' }, { label: 'MARINA DEL SOL', time: '7:48 PM' },
  { label: 'TOWER 2', time: '8:15 PM' }, { label: 'PALM BOULEVARD', time: '9:02 PM' },
  { label: 'INTERSTATE 6', time: '9:37 PM' }, { label: 'PIER 26', time: '10:11 PM' },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Panel rectangles for a layout, in fractions of the panel zone (0..1 x, 0..1 y).
// The panel zone is the top 60% of the cover; the title band sits below it.
export function panelRects(layout, zoneW, zoneH) {
  const g = 0.008; // gap as a fraction of zone width
  const gw = zoneW * g, gh = zoneH * g;
  const R = (x, y, w, h) => ({ x: x * zoneW, y: y * zoneH, w: w * zoneW, h: h * zoneH });
  switch (layout) {
    case 'cast':
    case 'location': {
      const out = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        out.push(R(c / 3 + (c ? g / 2 : 0), r / 2 + (r ? g / 2 : 0), 1 / 3 - g, 1 / 2 - g));
      }
      return out;
    }
    case 'split':
      return [
        R(0, 0, 0.62 - g, 1),
        R(0.62 + g, 0, 0.38 - g, 0.5 - g),
        R(0.62 + g, 0.5 + g, 0.38 - g, 0.5 - g),
      ];
    case 'slant': {
      const out = [];
      for (let i = 0; i < 5; i++) out.push(R(i / 5 + (i ? g / 2 : 0), 0, 1 / 5 - g, 1));
      return out;
    }
    case 'strip':
      return [R(0, 0, 1, 0.36 - g), R(0, 0.36 + g, 1, 0.30 - g), R(0, 0.66 + g, 1, 0.34 - g)];
    case 'hero':
      return [R(0, 0, 1, 0.66 - g), R(0, 0.66 + g, 0.5 - g, 0.34 - g), R(0.5 + g, 0.66 + g, 0.5 - g, 0.34 - g)];
    default:
      return [R(0, 0, 1, 1)];
  }
}

function drawPhotoCover(ctx, img, rect, zoom, panX, panY) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (zoom || 1);
  const dw = iw * scale, dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panX - 0.5) * (dw - rect.w) * 0.9;
  const dy = rect.y + (rect.h - dh) / 2 + (panY - 0.5) * (dh - rect.h) * 0.9;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function fitFont(ctx, text, maxW, startPx, family, weight) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawGradientTitle(ctx, text, cx, y, maxW, maxPx, family) {
  const px = fitFont(ctx, text, maxW, maxPx, family, '900');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const grad = ctx.createLinearGradient(0, y - px, 0, y + px * 0.12);
  grad.addColorStop(0, '#ffe95e');
  grad.addColorStop(0.45, '#ffb03a');
  grad.addColorStop(0.75, '#ff5e7a');
  grad.addColorStop(1, '#ff2e88');
  // 3D extrusion: dark copies stepped down-right.
  ctx.fillStyle = '#2a0a3d';
  for (let i = 5; i >= 1; i--) ctx.fillText(text, cx + i * px * 0.045, y + i * px * 0.05);
  ctx.lineWidth = Math.max(2, px * 0.045);
  ctx.strokeStyle = '#1c0630';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
  return px;
}

function drawSeal(ctx, cx, cy, r, label) {
  // Starburst disc with two lines of tiny text.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i <= points * 2; i++) {
    const ang = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffcf3d';
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = '#7a1d3d';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3c4';
  ctx.fill();
  ctx.fillStyle = '#7a1d3d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = label.split(' ');
  const fs = r * 0.24;
  ctx.font = `900 ${fs}px Anton, sans-serif`;
  ctx.fillText(words.slice(0, 2).join(' '), 0, -fs * 0.55);
  ctx.fillText(words.slice(2).join(' '), 0, fs * 0.55);
  ctx.restore();
}

function drawBarcode(ctx, x, y, w, h, seed) {
  const rnd = mulberry32(seed);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + w * 0.04;
  while (bx < x + w * 0.96) {
    const bw = 1 + rnd() * w * 0.03;
    if (rnd() > 0.35) ctx.fillRect(bx, y + h * 0.08, bw, h * 0.72);
    bx += bw + 1 + rnd() * w * 0.015;
  }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color, flip) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.06, -s * 0.5, s * 0.16, -s * 0.85);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.018);
  for (let k = 0; k < 6; k++) {
    const ang = -Math.PI * (0.05 + 0.17 * k);
    const len = s * (0.32 + 0.05 * Math.cos(k * 2.1));
    const tx = s * 0.16 + Math.cos(ang) * len;
    const ty = -s * 0.85 + Math.abs(Math.sin(ang)) * len * 0.5 + len * 0.1;
    ctx.beginPath();
    ctx.moveTo(s * 0.16, -s * 0.85);
    ctx.quadraticCurveTo(s * 0.16 + Math.cos(ang) * len * 0.5, -s * 0.85 + Math.abs(Math.sin(ang)) * len * 0.2 - len * 0.08, tx, ty);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChip(ctx, x, y, text, h, color) {
  ctx.save();
  ctx.font = `700 ${h * 0.52}px Archivo, sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = h * 0.45;
  ctx.fillStyle = color || 'rgba(12,6,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, tw + pad * 2, h, h * 0.5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad, y + h / 2 + h * 0.03);
  ctx.restore();
  return tw + pad * 2;
}

// The main render. state: {layout, grade, title, subtitle, tagline, quote,
// quoteSource, vol, panels:[{photo, zoom, panX, panY}], photos:[HTMLImageElement]}.
// photos are looked up by index; a missing photo draws a sunset placeholder.
export function renderCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES.golden;
  const zoneH = H * 0.60;
  const gap = 6;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#140820';
  ctx.fillRect(0, 0, W, H);

  // ---- panels ----
  const rects = panelRects(state.layout, W, zoneH);
  const slant = state.layout === 'slant';
  rects.forEach((rect, i) => {
    const panel = (state.panels && state.panels[i]) || {};
    const img = state.photos && state.photos[panel.photo || 0];
    ctx.save();
    if (slant) {
      const sh = rect.w * 0.10;
      ctx.beginPath();
      ctx.moveTo(rect.x + sh, rect.y);
      ctx.lineTo(rect.x + rect.w, rect.y);
      ctx.lineTo(rect.x + rect.w - sh, rect.y + rect.h);
      ctx.lineTo(rect.x, rect.y + rect.h);
      ctx.closePath();
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
    }
    if (img && img.complete && img.naturalWidth) {
      drawPhotoCover(ctx, img, rect, panel.zoom || 1, panel.panX ?? 0.5, panel.panY ?? 0.5);
    } else {
      const g2 = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      g2.addColorStop(0, grade.top);
      g2.addColorStop(1, grade.bot);
      ctx.fillStyle = g2;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // panel inner shade at the bottom so chips read
    const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
    shade.addColorStop(0, 'rgba(10,4,20,0)');
    shade.addColorStop(1, 'rgba(10,4,20,0.45)');
    ctx.fillStyle = shade;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
    // divider
    ctx.strokeStyle = '#140820';
    ctx.lineWidth = gap;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    // chips: cast names / place callouts at the TOP edge of the panel —
    // except panel 0, whose top-left corner holds the VOL badge: its chip
    // goes to the panel's bottom-left instead so the two never collide.
    const chipH = Math.max(16, H * 0.026);
    const chipY = i === 0 ? rect.y + rect.h - chipH - 8 : rect.y + 8;
    if (state.layout === 'cast') {
      drawChip(ctx, rect.x + 8, chipY, CAST_NAMES[i % CAST_NAMES.length], chipH);
    } else if (state.layout === 'location') {
      const p = PLACES[i % PLACES.length];
      drawChip(ctx, rect.x + 8, chipY, `${p.label} · ${p.time}`, chipH);
    }
  });

  // ---- grade wash over the panel zone ----
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const wash = ctx.createLinearGradient(0, 0, W, zoneH);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(0.55, grade.mid);
  wash.addColorStop(1, grade.bot);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, zoneH);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, zoneH);
  // vignette
  const vg = ctx.createRadialGradient(W / 2, zoneH / 2, Math.min(W, zoneH) * 0.35, W / 2, zoneH / 2, Math.max(W, zoneH) * 0.75);
  vg.addColorStop(0, 'rgba(10,4,20,0)');
  vg.addColorStop(1, `rgba(10,4,20,${grade.vig})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, zoneH);
  ctx.restore();

  // ---- title band scrim ----
  const scrim = ctx.createLinearGradient(0, H * 0.50, 0, H * 0.66);
  scrim.addColorStop(0, 'rgba(16,6,30,0)');
  scrim.addColorStop(1, 'rgba(16,6,30,0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.50, W, H * 0.16);
  ctx.fillStyle = '#10061e';
  ctx.fillRect(0, H * 0.66, W, H * 0.34);

  // ---- VOL badge (top-left) + seal (top-right) ----
  const badgeH = Math.max(20, H * 0.032);
  drawChip(ctx, 12, 12, `VOL. ${state.vol || '07'}`, badgeH, 'rgba(255,47,136,0.92)');
  drawSeal(ctx, W - H * 0.055, H * 0.058, H * 0.048, 'ORIGINAL COVER ART');

  // ---- press quote (above the title) ----
  const qy = H * 0.615;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const starPx = Math.max(13, H * 0.020);
  ctx.font = `${starPx}px Archivo, sans-serif`;
  ctx.fillStyle = '#ffcf3d';
  const stars = '★★★★★';
  const quotePx = Math.max(13, H * 0.021);
  ctx.font = `700 ${quotePx}px Archivo, sans-serif`;
  const qText = `"${state.quote || ''}" — ${state.quoteSource || 'VICE DAILY'}`;
  const qW = ctx.measureText(qText).width;
  const sW = ctx.measureText(stars).width;
  const totalW = sW + 10 + qW;
  let qx = (W - totalW) / 2;
  ctx.font = `${starPx}px Archivo, sans-serif`;
  ctx.fillText(stars, qx + sW / 2, qy);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${quotePx}px Archivo, sans-serif`;
  ctx.fillText(qText, qx + sW + 10 + qW / 2, qy);
  ctx.restore();

  // ---- giant gradient title + script subtitle ----
  const titleY = H * 0.775;
  drawGradientTitle(ctx, (state.title || 'GOLDEN COAST').toUpperCase(), W / 2, titleY, W * 0.94, H * 0.115, 'Anton, sans-serif');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const subPx = Math.max(20, H * 0.042);
  ctx.font = `${subPx}px Yellowtail, cursive`;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = H * 0.012;
  ctx.fillStyle = '#ff9ecf';
  ctx.fillText(state.subtitle || 'One Last Ride', W / 2, H * 0.835);
  ctx.restore();

  // ---- tagline strip ----
  const stripY = H * 0.875, stripH = H * 0.038;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, stripY, W, stripH);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tagPx = Math.max(12, H * 0.020);
  ctx.font = `800 ${tagPx}px Archivo, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText((state.tagline || 'NO RULES AFTER DARK').toUpperCase(), W / 2, stripY + stripH / 2 + tagPx * 0.05);
  ctx.restore();

  // ---- palm silhouettes in the title band corners (drawn BEFORE the
  // billing block, so the billing text paints over them, never under) ----
  drawPalm(ctx, W * 0.015, H * 0.985, H * 0.075, 'rgba(8,3,16,0.9)', false);
  drawPalm(ctx, W * 0.985, H * 0.985, H * 0.062, 'rgba(8,3,16,0.9)', true);

  // ---- billing block + barcode (bottom row) ----
  const billY = H * 0.925;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const bPx = Math.max(10, H * 0.0145);
  ctx.font = `700 ${bPx}px Archivo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('A SUNSET PICTURES PRODUCTION', 14, billY);
  ctx.fillText('STARRING YOU · DIRECTED BY GOLDEN HOUR', 14, billY + bPx * 1.5);
  ctx.font = `${bPx}px Archivo, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('GTA VI FAN COVER · NOT AFFILIATED WITH ROCKSTAR GAMES', 14, billY + bPx * 3.0);
  ctx.restore();
  drawBarcode(ctx, W - W * 0.16, billY, W * 0.14, H * 0.055, hashString(state.title || 'GOLDEN COAST'));
}
