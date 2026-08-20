#!/usr/bin/env node
// scripts/mat-ikon-centrering.mjs — mäter ikonernas centrering och
// maskable-safe-zone i de FAKTISKA utfilerna (TASK-282).
//
// ═══ VARFÖR DEN FINNS ═══
// pwa-assets.config.ts instruerar uttryckligen: "ÄNDRAS PADDINGEN: generera
// om och mät bboxen i utfilen. Härled den inte." Fram till TASK-282 fanns
// ingen mätare att göra det MED — talen räknades för hand, en gång, och
// kopierades sedan vidare i prosa. Exakt den kopierings-drift som gjorde att
// TASK-282:s eget kort bar kvoten 0,912 (som hör till den FÖRKASTADE
// paddingen 0.45) som om den gällde nuvarande 0.55, där det faktiska värdet
// är 0,746. Ett mätvärde utan mätare blir förr eller senare fel.
//
// ═══ FEM DEFINITIONER AV "MITT" — DE GER OLIKA SVAR ═══
// För en ASYMMETRISK form sammanfaller de inte, och skillnaden är inte liten:
// på 512-ikonen spänner de över 8,1 px. Skriptet rapporterar alla fem i
// stället för att välja åt läsaren:
//
//   bbox-centrum   — mitt mellan formens ytterkanter. Ser bara extremvärden.
//   centroid       — alfa-viktad tyngdpunkt (första momentet, "medelvärdet").
//                    BEVARAS av symmetrisk suddning, och är därför det
//                    kisa-testet konvergerar mot.
//   hull-centroid  — areatyngdpunkt för formens konvexa hölje. Ser konturen,
//                    inte massan.
//   kant-centroid  — tyngdpunkt för KANTMAGNITUDEN (Difference-of-Gaussians →
//                    potenslagskompression w^0,7 → Sobel). Ren bild-
//                    behandling; tas med därför att den mäter konturens läge
//                    i stället för massans, vilket för en fler-delad form är
//                    ett annat svar.
//   viktad median  — den x där halva massan ligger på var sida ("balans-
//                    punkten"). Skiljer sig från centroiden för sneda
//                    fördelningar.
//
// VARNING MOT ATT PLOCKA ETT MÅTT: för TASK-282:s M-form ger massa-måtten
// (+3,7 px höger) och kontur-måtten (−0,3 px, alltså centrerad) MOTSATT
// besked. Vilket som är "rätt" är ett DESIGNBESLUT, inte en mätning.
//
// Och en varning till, dyrköpt: homogen massviktning är MÄTT fel modell för
// fler-delade former (Denisova, Singh & Kowler 2006, Perception 35(8) — den
// perceptuella referenspunkten ligger vid den STÖRRE DELENS tyngdpunkt, inte
// vid helhetens). Vårt M är två vågformer i lager. Läs
// docs/research/ikon-optisk-centrering-2026-08-20.md innan ett av talen
// nedan används som facit — särskilt § 1.5, som falsifierar en spridd
// felciterad källa på området.
//
// ═══ MASSA-DEFINITION ═══
//   --mass alpha  vikt = alfakanalen. Rätt för TRANSPARENTA ikoner.
//   --mass ink    vikt = avvikelse från bakgrundsfärgen, alfa-dämpad. Enda
//                 möjligheten för OPAKA ikoner (maskable, favicon-plattan).
//                 OBS: färg-partisk — en mörkare delfärg väger tyngre än en
//                 ljusare vid samma täckning. Uppmätt på vår favicon: den
//                 gröna dellinjen (#548235, d=202) väger 79 % av den rödas
//                 (#FF0000, d=255), vilket ensamt flyttar centroiden ~0,3
//                 käll-enheter. Jämför ALDRIG ett ink-tal med ett alpha-tal.
//
// ═══ MASKABLE SAFE ZONE ═══
// Safe zone är en CIRKEL med radie 0,4 × sidan (W3C/Android-konventionen:
// den garanterat synliga ytan är en cirkel med diameter 80 % av ikonen).
// Kvoten som ska hållas ≤ 0,9 är formens största avstånd från ikoncentrum
// delat med den radien. Skriptet rapporterar BÅDE bbox-hörnradien (det mått
// pwa-assets.config.ts historiskt använt) och det faktiska maxavståndet —
// hörnradien är den konservativa övre gränsen, maxavståndet det sanna värdet.
//
// Kör:
//   node scripts/mat-ikon-centrering.mjs                    # hela ikonsetet
//   node scripts/mat-ikon-centrering.mjs <fil> [--mass ink] [--bg RRGGBB]

import { existsSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

/** Vikt under denna tröskel räknas inte som "form" vid bbox/hölje. */
const FORM_TROSKEL = 8;
/** Safe zone-radien som andel av ikonens sida (W3C maskable-konventionen). */
const SAFE_ZONE_ANDEL = 0.4;
/** Kvot-taket för maskable safe zone. */
const SAFE_ZONE_KRAV = 0.9;

/**
 * Läser en bild och beräknar alla centrerings-mått.
 * @param {string} fil sökväg till PNG
 * @param {'alpha'|'ink'} massMode massa-definition
 * @param {string} bgHex bakgrundsfärg för ink-läget, sex hex-tecken
 */
async function matFil(fil, massMode, bgHex) {
  const bg = [
    Number.parseInt(bgHex.slice(0, 2), 16),
    Number.parseInt(bgHex.slice(2, 4), 16),
    Number.parseInt(bgHex.slice(4, 6), 16),
  ];
  const { data, info } = await sharp(fil).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const geomX = (W - 1) / 2;
  const geomY = (H - 1) / 2;

  let sumW = 0;
  let sumX = 0;
  let sumY = 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  const kolumnVikt = new Float64Array(W);
  const radSpann = [];
  // Skalärfält för kantdetektionen, normaliserat 0..1 ur samma massa-def.
  const kantFalt = new Float64Array(W * H);

  for (let y = 0; y < H; y++) {
    let rMin = -1;
    let rMax = -1;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const a = data[i + 3];
      let w;
      if (massMode === 'alpha') {
        w = a;
      } else {
        const d = Math.max(
          Math.abs(data[i] - bg[0]),
          Math.abs(data[i + 1] - bg[1]),
          Math.abs(data[i + 2] - bg[2]),
        );
        w = (d * a) / 255;
      }
      kantFalt[y * W + x] = w / 255;
      if (w <= 0) continue;
      sumW += w;
      sumX += w * x;
      sumY += w * y;
      kolumnVikt[x] += w;
      if (w >= FORM_TROSKEL) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (rMin < 0) rMin = x;
        rMax = x;
      }
    }
    if (rMin >= 0) radSpann.push([y, rMin, rMax]);
  }

  if (sumW === 0) throw new Error(`${fil}: ingen form hittad (massa=${massMode})`);

  // Konvext hölje ur radernas ytterpunkter (räcker för en sammanhängande form).
  const punkter = [];
  for (const [y, a, b] of radSpann) {
    punkter.push([a, y], [b, y]);
  }
  const holje = konvextHolje(punkter);
  let area = 0;
  let hx = 0;
  let hy = 0;
  for (let i = 0; i < holje.length; i++) {
    const [x1, y1] = holje[i];
    const [x2, y2] = holje[(i + 1) % holje.length];
    const kryss = x1 * y2 - x2 * y1;
    area += kryss;
    hx += (x1 + x2) * kryss;
    hy += (y1 + y2) * kryss;
  }
  area /= 2;
  hx /= 6 * area;
  hy /= 6 * area;

  // Viktad median i x.
  let ack = 0;
  let median = geomX;
  for (let x = 0; x < W; x++) {
    const fore = ack;
    ack += kolumnVikt[x];
    if (fore < sumW / 2 && ack >= sumW / 2) {
      median = x + (sumW / 2 - fore) / kolumnVikt[x] - 0.5;
      break;
    }
  }

  let maxAvst = 0;
  for (const [y, a, b] of radSpann) {
    for (const x of [a, b]) {
      const d = Math.hypot(x - geomX, y - geomY);
      if (d > maxAvst) maxAvst = d;
    }
  }

  const kant = kantCentroid(kantFalt, W, H);
  const bredd = maxX - minX + 1;
  const hojd = maxY - minY + 1;
  return {
    kantX: kant ? kant.x : Number.NaN,
    kantY: kant ? kant.y : Number.NaN,
    W,
    H,
    geomX,
    geomY,
    minX,
    maxX,
    minY,
    maxY,
    bredd,
    hojd,
    bboxX: (minX + maxX) / 2,
    bboxY: (minY + maxY) / 2,
    centroidX: sumX / sumW,
    centroidY: sumY / sumW,
    holjeX: hx,
    holjeY: hy,
    medianX: median,
    hornRadie: Math.hypot(bredd / 2, hojd / 2),
    maxAvst,
    safeR: SAFE_ZONE_ANDEL * W,
  };
}

/** Separabel gaussisk faltning över ett skalärfält. */
function gauss(src, W, H, sigma) {
  const rad = Math.max(1, Math.ceil(sigma * 3));
  const k = [];
  let s = 0;
  for (let i = -rad; i <= rad; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v);
    s += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  const tmp = new Float64Array(W * H);
  const ut = new Float64Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let i = -rad; i <= rad; i++) {
        v += src[y * W + Math.min(W - 1, Math.max(0, x + i))] * k[i + rad];
      }
      tmp[y * W + x] = v;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = 0;
      for (let i = -rad; i <= rad; i++) {
        v += tmp[Math.min(H - 1, Math.max(0, y + i)) * W + x] * k[i + rad];
      }
      ut[y * W + x] = v;
    }
  }
  return ut;
}

/**
 * Kant-viktad centroid: DoG(σ=1,0 − σ=1,6) → w^0,7 → Sobel-magnitud.
 * Pipelinen är den opticalcenter.dev beskriver för sitt kant-steg.
 * @param {Float64Array} falt skalärfält (0..1) att detektera kanter i
 */
function kantCentroid(falt, W, H) {
  const g1 = gauss(falt, W, H, 1.0);
  const g2 = gauss(falt, W, H, 1.6);
  const komp = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) komp[i] = Math.abs(g1[i] - g2[i]) ** 0.7;
  let sw = 0;
  let sx = 0;
  let sy = 0;
  const at = (x, y) => komp[y * W + x];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
      const m = Math.hypot(gx, gy);
      if (m <= 0) continue;
      sw += m;
      sx += m * x;
      sy += m * y;
    }
  }
  return sw === 0 ? null : { x: sx / sw, y: sy / sw };
}

/** Andrews monotone chain. */
function konvextHolje(punkter) {
  const p = [...punkter].sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const kryss = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const nedre = [];
  for (const q of p) {
    while (nedre.length >= 2 && kryss(nedre[nedre.length - 2], nedre[nedre.length - 1], q) <= 0) {
      nedre.pop();
    }
    nedre.push(q);
  }
  const ovre = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (ovre.length >= 2 && kryss(ovre[ovre.length - 2], ovre[ovre.length - 1], q) <= 0) {
      ovre.pop();
    }
    ovre.push(q);
  }
  ovre.pop();
  nedre.pop();
  return nedre.concat(ovre);
}

const f3 = (n) => n.toFixed(3).padStart(9);

function skrivUt(fil, massMode, bgHex, m) {
  const dx = (v) => `${f3(v)}  (Δ ${(v - m.geomX >= 0 ? '+' : '') + (v - m.geomX).toFixed(3)})`;
  const dy = (v) => `${f3(v)}  (Δ ${(v - m.geomY >= 0 ? '+' : '') + (v - m.geomY).toFixed(3)})`;
  console.log(`\n${fil}`);
  console.log(
    `  ${m.W}x${m.H}  massa=${massMode}${massMode === 'ink' ? ` bg=#${bgHex}` : ''}  geom.centrum=(${m.geomX}, ${m.geomY})`,
  );
  console.log(
    `  bbox        x ${m.minX}..${m.maxX} (b=${m.bredd})  y ${m.minY}..${m.maxY} (h=${m.hojd})   marginal v=${m.minX} h=${m.W - 1 - m.maxX}`,
  );
  console.log(`  bbox-centrum   x ${dx(m.bboxX)}   y ${dy(m.bboxY)}`);
  console.log(`  centroid       x ${dx(m.centroidX)}   y ${dy(m.centroidY)}`);
  console.log(`  hull-centroid  x ${dx(m.holjeX)}   y ${dy(m.holjeY)}`);
  console.log(`  kant-centroid  x ${dx(m.kantX)}   y ${dy(m.kantY)}`);
  console.log(`  viktad median  x ${dx(m.medianX)}`);
  // Safe zone-kravet gäller ENDAST maskable-ikonen. En transparent ikon
  // genereras med padding 0.05 och ligger med avsikt långt utanför cirkeln —
  // att skriva "FÄLLER" för den vore ett falsklarm av precis den sort kortet
  // handlar om.
  const arMaskable = /maskable/.test(fil);
  const kvot = m.maxAvst / m.safeR;
  const kvotHorn = m.hornRadie / m.safeR;
  console.log(
    `  safe zone      maxAvst=${m.maxAvst.toFixed(3)}  bbox-hörnradie=${m.hornRadie.toFixed(3)}  safeR=${m.safeR.toFixed(1)}`,
  );
  console.log(
    `                 kvot(maxAvst)=${kvot.toFixed(3)}  kvot(hörn)=${kvotHorn.toFixed(3)}  ${
      arMaskable
        ? `krav ≤ ${SAFE_ZONE_KRAV}  →  ${kvotHorn <= SAFE_ZONE_KRAV ? 'KLARAR' : 'FÄLLER'}`
        : '— krav gäller endast maskable-ikonen'
    }`,
  );
}

/** Hittar dagens versionerade ikoner i public/ oavsett hash. */
function standardSet() {
  const filer = readdirSync('public');
  const hitta = (prefix) => filer.filter((f) => f.startsWith(prefix) && f.endsWith('.png'));
  const set = [];
  for (const f of hitta('pwa-192x192-')) set.push([`public/${f}`, 'alpha']);
  for (const f of hitta('pwa-512x512-')) set.push([`public/${f}`, 'alpha']);
  for (const f of hitta('maskable-icon-512x512-')) set.push([`public/${f}`, 'ink']);
  for (const f of ['favicon-96x96.png', 'apple-touch-icon.png']) {
    if (existsSync(`public/favicon/${f}`)) set.push([`public/favicon/${f}`, 'ink']);
  }
  return set;
}

// Argumentparsning: flaggor konsumerar sitt värde, resten är filnamn.
const args = process.argv.slice(2);
const FLAGGOR_MED_VARDE = new Set(['--mass', '--bg']);
let bgHex = 'ffffff';
let massArg = null;
const filArgs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (FLAGGOR_MED_VARDE.has(a)) {
    const v = args[++i];
    if (v === undefined) throw new Error(`${a} saknar värde`);
    if (a === '--mass') massArg = v;
    else bgHex = v;
  } else if (a.startsWith('--')) {
    throw new Error(`okänd flagga: ${a}`);
  } else {
    filArgs.push(a);
  }
}
if (massArg !== null && massArg !== 'alpha' && massArg !== 'ink') {
  throw new Error(`--mass måste vara 'alpha' eller 'ink', fick '${massArg}'`);
}
const jobb = filArgs.length > 0 ? filArgs.map((f) => [f, massArg ?? 'alpha']) : standardSet();

for (const [fil, mass] of jobb) {
  skrivUt(fil, mass, bgHex, await matFil(fil, mass, bgHex));
}
console.log('');
