// Data tables for the cover renderer: 5 grades, 6 layouts, 3 sizes.
// Grades: a canvas filter for the photos, a three-stop overlay wash, the
// gradient title colours, the subtitle/seal/accent colours and the 3D
// extrusion colour. Layouts return panel rects inside the panel area;
// `slant` offsets one edge for the comic-book diagonal cut.
export const GRADES = {
  sunset: {
    filter: 'saturate(1.28) contrast(1.06) brightness(1.02)',
    washA: 'rgba(255,122,24,0.16)', washB: 'rgba(255,45,120,0.10)', washC: 'rgba(40,8,60,0.14)',
    titleA: '#ffe259', titleB: '#ffa751', titleC: '#ff2d78',
    subtitle: '#ff8fb3', accent: '#ffb703', seal: '#e63b7a', extrude: '#5c1030',
  },
  neon: {
    filter: 'saturate(1.45) contrast(1.08)',
    washA: 'rgba(0,245,255,0.12)', washB: 'rgba(255,0,168,0.12)', washC: 'rgba(20,0,60,0.16)',
    titleA: '#00f5ff', titleB: '#ff00a8', titleC: '#ffe259',
    subtitle: '#7df9ff', accent: '#00f5ff', seal: '#b5179e', extrude: '#2d0a4e',
  },
  golden: {
    filter: 'saturate(1.22) sepia(0.16) contrast(1.04)',
    washA: 'rgba(255,183,3,0.16)', washB: 'rgba(251,133,0,0.10)', washC: 'rgba(60,30,0,0.14)',
    titleA: '#fff3b0', titleB: '#ffb703', titleC: '#fb8500',
    subtitle: '#ffd166', accent: '#ffb703', seal: '#c77d0a', extrude: '#4a2400',
  },
  dark: {
    filter: 'saturate(0.85) brightness(0.92) contrast(1.10)',
    washA: 'rgba(60,90,140,0.14)', washB: 'rgba(10,10,30,0.12)', washC: 'rgba(0,0,0,0.20)',
    titleA: '#ffffff', titleB: '#ffd166', titleC: '#ef476f',
    subtitle: '#a8dadc', accent: '#ffd166', seal: '#3a506b', extrude: '#101820',
  },
  vice: {
    filter: 'saturate(1.35) hue-rotate(-8deg) contrast(1.05)',
    washA: 'rgba(255,112,166,0.14)', washB: 'rgba(46,196,182,0.10)', washC: 'rgba(30,0,50,0.14)',
    titleA: '#ff70a6', titleB: '#ff9770', titleC: '#ffd670',
    subtitle: '#ff70a6', accent: '#2ec4b6', seal: '#e36488', extrude: '#4d0a33',
  },
};

function grid(area, g, cols, rows) {
  const rects = [];
  const cw = (area.w - g * (cols + 1)) / cols;
  const ch = (area.h - g * (rows + 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: area.x + g + c * (cw + g),
        y: area.y + g + r * (ch + g),
        w: cw, h: ch,
      });
    }
  }
  return rects;
}

export const LAYOUTS = {
  cast(area, g) {
    return grid(area, g, 3, 2);
  },
  split(area, g) {
    const leftW = (area.w - g * 3) * 0.58;
    const rightW = area.w - g * 3 - leftW;
    return [
      { x: area.x + g, y: area.y + g, w: leftW, h: area.h - g * 2 },
      { x: area.x + g * 2 + leftW, y: area.y + g, w: rightW, h: area.h - g * 2 },
    ];
  },
  slant(area, g) {
    const cols = 3;
    const cw = (area.w - g * (cols + 1)) / cols;
    const slant = area.w * 0.03;
    const rects = [];
    for (let c = 0; c < cols; c++) {
      rects.push({
        x: area.x + g + c * (cw + g),
        y: area.y + g,
        w: cw, h: area.h - g * 2,
        slant: c === 1 ? slant : 0,
      });
    }
    return rects;
  },
  strip(area, g) {
    return grid(area, g, 1, 3);
  },
  hero(area, g) {
    return [{ x: area.x + g, y: area.y + g, w: area.w - g * 2, h: area.h - g * 2 }];
  },
  location(area, g) {
    return grid(area, g, 2, 2);
  },
};

export const SIZES = {
  square: { label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
};

// How many panels each layout shows (the editor keeps this many panel slots).
export const LAYOUT_PANELS = { cast: 6, split: 2, slant: 3, strip: 3, hero: 1, location: 4 };
