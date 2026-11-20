// Golden Hour v4 — cover data: sizes, layouts, grades, photos, default crops.
// Pure data. The renderer in cover.js interprets it; the editor in main.js
// exposes it. Nothing here is copied from a previous version: every number
// below was chosen from the v4 diagnosis (photographic defaults, title on
// the art, no dead band) and from viewing the two starter photos.

export const SIZES = {
  square: { id: 'square', label: '1:1 · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { id: 'portrait', label: '4:5 · 1080 × 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', label: '16:9 · 1920 × 1080', w: 1920, h: 1080 },
};

// Panel rects are fractions of the panel area (the cover above the sunset
// band). `slant` is a horizontal shear (fraction of panel width) applied to
// the top edge of the row, for the comic-slant layout.
export const LAYOUTS = {
  cast: {
    id: 'cast', name: 'Cast Grid',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
      { x: 0, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
    ],
  },
  split: {
    id: 'split', name: 'Sunset Split',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 0.5 },
      { x: 0.58, y: 0.5, w: 0.42, h: 0.5 },
    ],
  },
  slant: {
    id: 'slant', name: 'Comic Slant',
    panels: [
      { x: 0, y: 0, w: 1, h: 1 / 3, slant: 0.06 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3, slant: -0.06 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3, slant: 0.06 },
    ],
  },
  strip: {
    id: 'strip', name: 'Triple Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
  },
  hero: {
    id: 'hero', name: 'Hero Single',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.62 },
      { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
    ],
  },
  location: {
    id: 'location', name: 'Location Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.31 },
      { x: 0.5, y: 0, w: 0.5, h: 0.31 },
      { x: 0, y: 0.31, w: 0.5, h: 0.31 },
      { x: 0.5, y: 0.31, w: 0.5, h: 0.31 },
      { x: 0, y: 0.62, w: 1, h: 0.38 },
    ],
  },
};

// Grades: title gradient, script colour, panel tint, sunset-band gradient, sun.
export const GRADES = {
  sunset: {
    id: 'sunset', label: 'Sunset',
    title: ['#FFD93B', '#FF7A1A', '#FF2E88'], script: '#FFFFFF',
    tint: 'rgba(255,110,40,0.16)', strip: ['#FF7A1A', '#FF2E88', '#5B1B7A'], sun: '#FFE98A',
  },
  neon: {
    id: 'neon', label: 'Neon Night',
    title: ['#7DF9FF', '#B537F2', '#FF2E88'], script: '#E8FBFF',
    tint: 'rgba(120,60,255,0.20)', strip: ['#3A0CA3', '#7B2FFF', '#FF2E88'], sun: '#B8FFF9',
  },
  golden: {
    id: 'golden', label: 'Golden Hour',
    title: ['#FFF3B0', '#FFC93C', '#FF8A00'], script: '#FFF7D6',
    tint: 'rgba(255,180,40,0.15)', strip: ['#FFB703', '#FB8500', '#7A2E0E'], sun: '#FFF3B0',
  },
  dark: {
    id: 'dark', label: 'Dark City',
    title: ['#F2F2F2', '#9CA3AF', '#5B6B8C'], script: '#FFFFFF',
    tint: 'rgba(20,30,60,0.22)', strip: ['#1B1B2F', '#3D348B', '#0B0614'], sun: '#E9E9E9',
  },
  vice: {
    id: 'vice', label: 'Vice Pink',
    title: ['#FF9ECD', '#FF2E88', '#7B2FFF'], script: '#FFE3F1',
    tint: 'rgba(255,46,136,0.18)', strip: ['#FF2E88', '#7B2FFF', '#2A0A4A'], sun: '#FFD6EC',
  },
};

// The 6 sample photos. The first two are the starter photos (real photos);
// the last four are PIL illustrations drawn at build time by tools/draw_photos.py.
export const PHOTOS = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', name: 'Boulevard', label: 'BOULEVARD' },
  { id: 'pier', src: 'samples/pier.jpg', name: 'Pier', label: 'THE PIER' },
  { id: 'skyline', src: 'samples/skyline.jpg', name: 'Skyline', label: 'SKYLINE' },
  { id: 'tower', src: 'samples/tower.jpg', name: 'Tower', label: 'THE TOWER' },
  { id: 'motel', src: 'samples/motel.jpg', name: 'Motel', label: 'MOTEL' },
  { id: 'car', src: 'samples/car.jpg', name: 'Getaway Car', label: 'GETAWAY' },
];

// Default crops, chosen by viewing the two starter photos:
// boulevard: woman + red convertible, face upper-centre (0.55, 0.20), sun low-left.
// pier: man + fishing rod, face upper-centre-left (0.42, 0.28), rod right side.
// photo: index into PHOTOS. zoom 1 = cover-fit; pan 0..1 = window centre.
export const DEFAULT_CROPS = [
  { photo: 0, zoom: 1.0, panX: 0.5, panY: 0.3 },   // boulevard, wide (face + sunset + car)
  { photo: 1, zoom: 1.7, panX: 0.42, panY: 0.28 }, // pier, face close-up
  { photo: 0, zoom: 1.5, panX: 0.35, panY: 0.8 },  // boulevard, red car
  { photo: 1, zoom: 1.0, panX: 0.5, panY: 0.5 },   // pier, wide
  { photo: 0, zoom: 1.6, panX: 0.55, panY: 0.2 },  // boulevard, face close-up
  { photo: 1, zoom: 1.6, panX: 0.85, panY: 0.6 },  // pier, rod + reel
];

export const PANEL_LABELS = ['DOWNTOWN', 'THE BEACH', 'NEON ROW', 'THE GETAWAY', 'VICE CITY', 'LAST RIDE'];

export const CAPTIONS = {
  title: 'GOLDEN COAST',
  script: 'One Last Ride',
  tagline: 'NO RULES AFTER DARK',
  quote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
  quoteBy: 'VICE DAILY',
  band: 'VICE CITY · GOLDEN HOUR · NO CURFEW',
  billing: 'A FAN-MADE COVER STUDIO · NOT AFFILIATED WITH ROCKSTAR GAMES · PHOTOS ARE MODEL-MADE',
};
