/**
 * farg.mjs — färgmatematik för färgatlasen.
 *
 * Konverteringar mellan sRGB, CIE Lab, OKLab och OKLCH plus WCAG-kontrast.
 * Ingen tredjepart: matriserna är publicerade konstanter och algoritmerna är
 * korta nog att äga själva — ett beroende hade kostat mer i kedjan än det
 * sparar i rader.
 *
 * OKLab-koefficienterna kommer från Björn Ottossons publicerade härledning
 * (bottosson.github.io/posts/oklab). OKLCH är samma rymd i polära koordinater
 * och är den rymd Tailwind v4 definierar sin palett i — därför den rymd våra
 * skalor genereras i.
 *
 * Alla funktioner är rena. Hex in, hex ut, tal däremellan.
 */

// ── sRGB ↔ linjär ────────────────────────────────────────────────────────────

const srgbTillLinjar = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linjarTillSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** '#rrggbb' → [r, g, b] i 0–1. Accepterar kort form (#rgb). */
export function hexTillRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Ogiltig hex: ${hex}`);
  return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255);
}

/** [r, g, b] i 0–1 → '#rrggbb'. Klipper till intervallet. */
export function rgbTillHex(rgb) {
  return `#${rgb
    .map((c) => {
      const v = Math.round(Math.min(1, Math.max(0, c)) * 255);
      return v.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

// ── WCAG 2.x relativ luminans och kontrast ───────────────────────────────────

/** Relativ luminans enligt WCAG 2.x (0–1). */
export function luminans(hex) {
  const [r, g, b] = hexTillRgb(hex).map(srgbTillLinjar);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG-kontrastkvot mellan två färger (1–21). Ordningen spelar ingen roll. */
export function kontrast(a, b) {
  const la = luminans(a);
  const lb = luminans(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ── CIE Lab (D65) ────────────────────────────────────────────────────────────

const VITPUNKT = [0.9504559271, 1, 1.0890577508]; // D65, 2°

/**
 * CIE Lab. L* är perceptuell ljushet 0–100 och är rätt mått när man frågar om
 * två steg i en skala känns lika stora — relativ luminans är det inte.
 */
export function lab(hex) {
  const rgb = hexTillRgb(hex).map(srgbTillLinjar);
  const xyz = [
    [0.4123907993, 0.3575843394, 0.1804807884],
    [0.2126390059, 0.7151686788, 0.072192315],
    [0.0193308187, 0.1191947798, 0.9505321522],
  ].map((rad, i) => (rad[0] * rgb[0] + rad[1] * rgb[1] + rad[2] * rgb[2]) / VITPUNKT[i]);

  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = xyz.map(f);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIE LCh — Lab i polär form. C = mättnad, h = kulörton i grader. */
export function lch(hex) {
  const { L, a, b } = lab(hex);
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

// ── OKLab / OKLCH ────────────────────────────────────────────────────────────

/** OKLab. L är 0–1 här (inte 0–100 som CIE Lab). */
export function oklab(hex) {
  const [r, g, b] = hexTillRgb(hex).map(srgbTillLinjar);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLCH: { L: 0–1, C: 0–~0.4, h: 0–360 }. */
export function oklch(hex) {
  const { L, a, b } = oklab(hex);
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

/** OKLCH → linjär sRGB. Kan ge komponenter utanför 0–1 (utanför gamut). */
function oklchTillLinjarRgb({ L, C, h }) {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inomGamut = (rgb) => rgb.every((c) => c >= -1e-4 && c <= 1 + 1e-4);

/**
 * OKLCH → hex med gamut-mappning.
 *
 * Ligger färgen utanför sRGB sänks mättnaden binärsökt tills den ryms, medan
 * ljushet och kulörton hålls fast. Det är CSS Color 4:s föreskrivna strategi
 * och den bevarar det ögat är känsligast för: att stegen i en skala behåller
 * sin ljushetsordning.
 */
export function oklchTillHex({ L, C, h }) {
  const direkt = oklchTillLinjarRgb({ L, C, h });
  if (inomGamut(direkt)) return rgbTillHex(direkt.map(linjarTillSrgb));

  let lag = 0;
  let hog = C;
  for (let i = 0; i < 24; i++) {
    const mitt = (lag + hog) / 2;
    if (inomGamut(oklchTillLinjarRgb({ L, C: mitt, h }))) lag = mitt;
    else hog = mitt;
  }
  return rgbTillHex(oklchTillLinjarRgb({ L, C: lag, h }).map(linjarTillSrgb));
}

/** Högsta mättnad som ryms i sRGB vid given ljushet och kulörton. */
export function maxKroma(L, h) {
  let lag = 0;
  let hog = 0.4;
  for (let i = 0; i < 24; i++) {
    const mitt = (lag + hog) / 2;
    if (inomGamut(oklchTillLinjarRgb({ L, C: mitt, h }))) lag = mitt;
    else hog = mitt;
  }
  return lag;
}

// ── Härledda mått för atlasen ────────────────────────────────────────────────

/** Alla mått en färgruta i atlasen visar. */
export function matning(hex) {
  const cie = lch(hex);
  const ok = oklch(hex);
  return {
    hex: hex.toLowerCase(),
    cieL: cie.L,
    cieC: cie.C,
    cieH: cie.h,
    okL: ok.L,
    okC: ok.C,
    okH: ok.h,
    motVit: kontrast(hex, '#ffffff'),
    motSvart: kontrast(hex, '#000000'),
  };
}

/** Läsbaraste textfärgen på en given yta — svart eller vitt, det som vinner. */
export function textPa(hex) {
  return kontrast(hex, '#ffffff') >= kontrast(hex, '#1a1a1a') ? '#ffffff' : '#1a1a1a';
}
