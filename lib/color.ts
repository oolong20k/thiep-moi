export const DEFAULT_COLORS = {
  mainColor: '#eab8c2',
  accentColor: '#1a561e',
  textColor: '#29372c',
  pageColor: '#fbf6f2',
  cardColor: '#fffdf8',
  envelopeColor: '#eab8c2',
};
const DEFAULT_MAIN = DEFAULT_COLORS.mainColor;
const DEFAULT_ACCENT = DEFAULT_COLORS.accentColor;

function parseHex(hex: string): [number, number, number] | null {
  let t = String(hex || '').trim().replace(/^#/, '');
  if (t.length === 3) t = t.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(t)) return null;
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const m = r / 255;
  const l = g / 255;
  const p = b / 255;
  const max = Math.max(m, l, p);
  const min = Math.min(m, l, p);
  const light = (max + min) / 2;
  if (max === min) return [0, 0, light];
  const d = max - min;
  const sat = d / (1 - Math.abs(2 * light - 1));
  let h = 0;
  if (max === m) h = ((l - p) / d) % 6;
  else if (max === l) h = (p - m) / d + 2;
  else h = (m - l) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, sat, light];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function relLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0.2;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

type TuneOpts = {
  lumMin?: number;
  lumMax?: number;
  satMax?: number;
  satMin?: number;
  hueFallback?: number | null;
  greySat?: number;
  hueShift?: number;
};

function tuneColor(hex: string, opts: TuneOpts = {}, fallback: string): string {
  const { lumMin = 0, lumMax = 1, satMax = 1, satMin = 0, hueFallback = null, greySat = 0.04, hueShift = 0 } = opts;
  const rgb = parseHex(hex);
  if (!rgb) return fallback;
  const [h, s, l0] = rgbToHsl(...rgb);
  const spread = (Math.max(...rgb) - Math.min(...rgb)) / 255;
  const hue = ((spread < 0.02 && hueFallback !== null ? hueFallback : h) + hueShift + 360) % 360;
  const sat = spread < 0.02 ? Math.min(satMax, greySat) : Math.min(satMax, Math.max(satMin, s));
  let l = l0;
  let out = hslToHex(hue, sat, l);
  let iter = 0;
  while (relLuminance(out) > lumMax && l > 0.02 && iter < 120) {
    l -= 0.01;
    out = hslToHex(hue, sat, l);
    iter += 1;
  }
  while (relLuminance(out) < lumMin && l < 0.98 && iter < 240) {
    l += 0.01;
    out = hslToHex(hue, sat, l);
    iter += 1;
  }
  return out;
}

function rgbStr(hex: string, fallback: string): string {
  const rgb = parseHex(hex);
  return rgb ? rgb.join(', ') : fallback;
}

const MAIN_OPTS: TuneOpts = { satMin: 0.12, satMax: 0.45, hueFallback: 262, greySat: 0.25 };
const ACCENT_OPTS: TuneOpts = { satMin: 0.15, satMax: 0.55, hueFallback: 45, greySat: 0.3 };

export function shades(mainHex = DEFAULT_MAIN, accentHex = DEFAULT_ACCENT, overrides: {
  textColor?: string;
  pageColor?: string;
  cardColor?: string;
  envelopeColor?: string;
} = {}): Record<string, string> {
  const main = tuneColor(mainHex, { lumMin: 0.48, lumMax: 0.65, ...MAIN_OPTS }, DEFAULT_MAIN);
  const accent = tuneColor(accentHex, ACCENT_OPTS, DEFAULT_ACCENT);
  const mainText = tuneColor(mainHex, { lumMax: 0.10, ...MAIN_OPTS }, '#581ec8');
  const mainDeep = tuneColor(mainHex, { lumMax: 0.065, ...MAIN_OPTS }, '#401693');
  const paper = tuneColor(accentHex, { lumMin: 0.935, lumMax: 0.955, satMax: 0.8, satMin: 0.5, hueFallback: 45, greySat: 0.6 }, '#fdf9ed');
  return {
    '--ct-main': main,
    '--ct-main-rgb': rgbStr(main, '107, 47, 224'),
    '--ct-main-hi': tuneColor(mainHex, { lumMin: 0.68, lumMax: 0.78, ...MAIN_OPTS }, '#9469e9'),
    '--ct-main-text': mainText,
    '--ct-main-soft': tuneColor(mainHex, { lumMin: 0.86, lumMax: 0.91, satMax: 0.7, hueFallback: 262, greySat: 0.25 }, '#f3eefc'),
    '--ct-main-deep': mainDeep,
    '--ct-accent': accent,
    '--ct-accent-rgb': rgbStr(accent, '255, 201, 51'),
    '--ct-accent-text': tuneColor(accentHex, { lumMax: 0.12, satMax: 0.95, satMin: 0.6, hueFallback: 45, greySat: 0.7 }, '#7c5c03'),
    '--ct-accent-soft': tuneColor(accentHex, { lumMin: 0.9, lumMax: 0.94, satMax: 0.9, hueFallback: 45, greySat: 0.7 }, '#fdf5dd'),
    '--ct-paper': paper,
    '--ct-cap-3': tuneColor(mainHex, { lumMin: 0.6, lumMax: 0.7, satMin: 0.15, satMax: 0.4, hueFallback: 262, greySat: 0.6, hueShift: 40 }, '#e02fdf'),
    '--ct-cap-4': tuneColor(accentHex, { lumMin: 0.65, lumMax: 0.75, satMin: 0.15, satMax: 0.5, hueFallback: 45, greySat: 0.8, hueShift: -40 }, '#ff6257'),
    '--ct-ink': overrides.textColor ?? mainText,
    '--ct-ink-2': overrides.textColor ?? mainDeep,
    '--ct-text': overrides.textColor ?? mainDeep,
    '--ct-muted': overrides.textColor ?? mainText,
    '--ct-muted-2': overrides.textColor ?? mainText,
    '--ct-line': 'color-mix(in srgb, var(--ct-ink), transparent 84%)',
    '--ct-line-strong': 'color-mix(in srgb, var(--ct-ink), transparent 72%)',
    '--ct-page-bg': overrides.pageColor ?? paper,
    '--ct-card-bg': overrides.cardColor ?? paper,
    '--ct-envelope': overrides.envelopeColor ?? accent,
    '--ct-envelope-soft': 'color-mix(in srgb, var(--ct-envelope), white 65%)',
    '--public-main': mainText,
    '--public-accent': accentHex || DEFAULT_ACCENT,
  };
}
