#!/usr/bin/env node
/**
 * verifiera-farg-atlas.mjs — prövar atlasens påståenden mot källkoden.
 *
 * Avsiktligt OBEROENDE av scripts/lib/farg.mjs och scripts/build-farg-atlas.mjs.
 * Kontrastformeln, färgrymdsmatematiken och tokenutläsningen är skrivna en gång
 * till här, från specifikationerna, i stället för importerade. En verifiering
 * som lånar generatorns kod bekräftar bara att koden är konsekvent med sig
 * själv — den kan inte upptäcka att formeln är fel, att ett mönster missar
 * radbrutna deklarationer, eller att en räkning glömmer en filändelse. Alla tre
 * felen har inträffat i den här atlasen.
 *
 * Kör: node scripts/verifiera-farg-atlas.mjs
 * Avslutar med kod 1 om något avviker.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const las = (p) => readFileSync(join(ROT, p), 'utf8');

const avvikelser = [];
let prov = 0;

function kolla(pastaende, villkor, detalj = '') {
  prov++;
  if (!villkor) avvikelser.push(`${pastaende}${detalj ? ` — ${detalj}` : ''}`);
}

// ── Oberoende färgmatematik (skriven från WCAG 2.2 och CIE-definitionerna) ───

function hexTillKanaler(hex) {
  const h = hex.replace('#', '');
  return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map((p) => Number.parseInt(p, 16) / 255);
}

// WCAG 2.2, "relative luminance". Tröskeln 0.04045 enligt sRGB-definitionen.
function wcagLuminans(hex) {
  const [r, g, b] = hexTillKanaler(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function wcagKontrast(a, b) {
  const [x, y] = [wcagLuminans(a), wcagLuminans(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// CIE L* via XYZ under D65. Skriven ur formeldefinitionen, inte kopierad.
function cieLjushet(hex) {
  const [r, g, b] = hexTillKanaler(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  return Y > (6 / 29) ** 3 ? 116 * Y ** (1 / 3) - 16 : (29 / 3) ** 3 * Y;
}

// ── Oberoende tokenutläsning (annan strategi än generatorns) ────────────────

/**
 * Läser deklarationer rad för rad efter att kommentarer strippats, i stället
 * för med ett enda globalt mönster. Två olika lässtrategier som ger samma svar
 * är ett verkligt besked; samma strategi två gånger är det inte.
 */
function lasTokens(fil) {
  const platt = las(fil)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s*\n\s*/g, ' ');
  const tokens = new Map();
  for (const bit of platt.split(';')) {
    // Mönstret måste ankras på tokennamnet, inte på bitens början: den första
    // biten i varje fil är ":root { --namn: värde" och ett kolonbaserat split
    // tappar då den deklarationen tyst.
    const m = bit.match(/(--[\w-]+)\s*:\s*(.+)$/s);
    if (m) tokens.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  return tokens;
}

// ── A. Primitiverna ─────────────────────────────────────────────────────────

const atlas = JSON.parse(las('docs/design/farg-atlas.tokens.json'));
const primKalla = lasTokens('src/styles/tokens/primitives.css');
const semKalla = lasTokens('src/styles/tokens/semantic.css');
const temaKalla = lasTokens('src/styles/tailwind.css');

const atlasPrimitiv = new Map();
for (const [grupp, innehall] of Object.entries(atlas.primitiv)) {
  if (grupp.startsWith('$')) continue;
  for (const [steg, token] of Object.entries(innehall)) {
    if (steg.startsWith('$')) continue;
    atlasPrimitiv.set(token.$extensions['se.miranon.atlas'].cssVar, {
      hex: token.$value.hex,
      komponenter: token.$value.components,
      anvandning: token.$extensions['se.miranon.atlas'].anvandning,
      beskrivning: token.$description,
      grupp,
      steg,
    });
  }
}

for (const [namn, data] of atlasPrimitiv) {
  const kallVarde = primKalla.get(namn);
  kolla(`Primitiv ${namn} finns i primitives.css`, Boolean(kallVarde));
  if (!kallVarde) continue;
  kolla(
    `Primitiv ${namn} har samma värde i atlas och källa`,
    kallVarde.toLowerCase() === data.hex.toLowerCase(),
    `källa ${kallVarde}, atlas ${data.hex}`,
  );

  // DTCG-komponenterna ska motsvara hexen
  const vantade = hexTillKanaler(data.hex).map((c) => Number(c.toFixed(4)));
  kolla(
    `Primitiv ${namn} har DTCG-komponenter som matchar hexen`,
    vantade.every((v, i) => Math.abs(v - data.komponenter[i]) < 0.0002),
    `hex ger ${vantade.join(', ')}, filen har ${data.komponenter.join(', ')}`,
  );

  // Mätvärdena i beskrivningen ska stämma mot oberoende beräkning
  const mL = data.beskrivning.match(/CIE L\* ([\d.]+)/);
  const mK = data.beskrivning.match(/kontrast mot vit ([\d.]+):1/);
  if (mL) {
    kolla(
      `Primitiv ${namn} har rätt CIE L*`,
      Math.abs(Number(mL[1]) - cieLjushet(data.hex)) < 0.15,
      `atlas ${mL[1]}, oberoende ${cieLjushet(data.hex).toFixed(1)}`,
    );
  }
  if (mK) {
    kolla(
      `Primitiv ${namn} har rätt kontrast mot vitt`,
      Math.abs(Number(mK[1]) - wcagKontrast(data.hex, '#ffffff')) < 0.02,
      `atlas ${mK[1]}, oberoende ${wcagKontrast(data.hex, '#ffffff').toFixed(2)}`,
    );
  }
}

// Fullständighet åt andra hållet: varje hex-primitiv i källan ska finnas i atlasen
for (const [namn, varde] of primKalla) {
  if (!/^#[0-9a-fA-F]{3,8}$/.test(varde)) continue;
  kolla(`Primitiv ${namn} i källan finns även i atlasen`, atlasPrimitiv.has(namn));
}

// ── B. Rollerna ─────────────────────────────────────────────────────────────

const atlasRoller = new Map();
for (const [namn, token] of Object.entries(atlas.roll)) {
  if (namn.startsWith('$')) continue;
  const ext = token.$extensions['se.miranon.atlas'];
  atlasRoller.set(ext.cssVar, { ...ext, varde: token.$value });
}

for (const [namn, data] of atlasRoller) {
  kolla(`Roll ${namn} finns i semantic.css`, semKalla.has(namn));

  // Alias i DTCG-form ska peka på den primitiv källan faktiskt refererar
  if (typeof data.varde === 'string' && data.varde.startsWith('{primitiv.')) {
    const [, grupp, steg] = data.varde.replace(/[{}]/g, '').split('.');
    const kallAlias = semKalla.get(namn)?.match(/var\(\s*(--[\w-]+)\s*\)/)?.[1];
    kolla(
      `Roll ${namn} aliasar rätt primitiv`,
      kallAlias === `--p-${grupp}-${steg}`,
      `atlas pekar på --p-${grupp}-${steg}, källan på ${kallAlias}`,
    );
  }

  kolla(
    `Roll ${namn} har korrekt @theme-status`,
    data.exponeradITheme ===
      [...temaKalla].some(([t, v]) => t.startsWith('--color-') && v.trim() === `var(${namn})`),
    `atlas säger ${data.exponeradITheme}`,
  );
}

for (const [namn] of semKalla) {
  if (!namn.startsWith('--mm-')) continue;
  const varde = semKalla.get(namn);
  const arFarg =
    /^#/.test(varde) ||
    /var\(\s*--p-/.test(varde) ||
    /color-mix/.test(varde) ||
    /var\(\s*--mm-/.test(varde);
  if (!arFarg) continue;
  if (/-(width|offset|offset-inset)$/.test(namn)) continue;
  kolla(`Roll ${namn} i källan finns även i atlasen`, atlasRoller.has(namn));
}

// ── B2. Komponent-tokens (lager 3) ──────────────────────────────────────────

const kompKalla = lasTokens('src/styles/tokens/components.css');

/**
 * Oberoende color-mix, skriven ur CSS Color 5 i stället för importerad.
 *
 * Interpolationen sker i gamma-kodad sRGB — inte i linjärt ljus. Blandning mot
 * `transparent` ger alfa och inte en mörkare färg; den skillnaden är stor nog
 * att synas direkt (#f6e6e6 mot #110000 för samma deklaration).
 */
function mixaOberoende(farg, vikt, mot) {
  if (mot === 'transparent') return { hex: farg.toLowerCase(), alfa: vikt / 100 };
  const p = vikt / 100;
  const a = hexTillKanaler(farg);
  const b = hexTillKanaler(mot);
  const kanal = (i) => Math.round(Math.min(1, Math.max(0, a[i] * p + b[i] * (1 - p))) * 255);
  return {
    hex: `#${[0, 1, 2].map((i) => kanal(i).toString(16).padStart(2, '0')).join('')}`,
    alfa: 1,
  };
}

/** Följer en var()-kedja i källan till ett faktiskt värde. */
function slutvarde(uttryck, djup = 0) {
  if (djup > 10) return null;
  const m = uttryck.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (!m) return uttryck.trim();
  const nasta = kompKalla.get(m[1]) ?? semKalla.get(m[1]) ?? primKalla.get(m[1]);
  return nasta ? slutvarde(nasta, djup + 1) : null;
}

const atlasKomponent = Object.entries(atlas.komponent ?? {})
  .filter(([n]) => !n.startsWith('$'))
  .map(([, t]) => ({ ...t.$extensions['se.miranon.atlas'], hex: t.$value?.hex }));

kolla('Atlasen har ett lager 3', atlasKomponent.length > 50, `${atlasKomponent.length} tokens`);

for (const t of atlasKomponent) {
  const kallVarde = kompKalla.get(t.cssVar);
  kolla(`Komponent-token ${t.cssVar} finns i components.css`, Boolean(kallVarde));
  if (!kallVarde) continue;

  // Beroendena ska vara exakt de roller källan refererar
  const iKalla = [...kallVarde.matchAll(/var\(\s*(--mm-[\w-]+)\s*\)/g)].map((m) => m[1]);
  kolla(
    `Komponent-token ${t.cssVar} har rätt beroenden`,
    JSON.stringify(t.beror) === JSON.stringify(iKalla),
    `atlas ${JSON.stringify(t.beror)}, källa ${JSON.stringify(iKalla)}`,
  );

  // Typen ska stämma med hur värdet faktiskt ser ut
  const vantadTyp = kallVarde.startsWith('color-mix')
    ? 'mix'
    : slutvarde(kallVarde) === 'transparent'
      ? 'transparent'
      : /^#/.test(String(slutvarde(kallVarde)))
        ? 'alias'
        : 'literal';
  kolla(
    `Komponent-token ${t.cssVar} har rätt typ`,
    t.typ === vantadTyp,
    `atlas ${t.typ}, härlett ${vantadTyp}`,
  );

  // Alias: färgen ska vara vad kedjan landar på
  if (t.typ === 'alias') {
    kolla(
      `Komponent-token ${t.cssVar} löser till rätt färg`,
      t.hex === String(slutvarde(kallVarde)).toLowerCase(),
      `atlas ${t.hex}, kedjan ${slutvarde(kallVarde)}`,
    );
  }

  // Mix: räkna om från grunden och jämför
  if (t.typ === 'mix') {
    const inre = kallVarde.slice(kallVarde.indexOf('(') + 1, kallVarde.lastIndexOf(')'));
    const delar = inre.split(',').map((d) => d.trim());
    if (delar.length >= 3) {
      const namngivna = { black: '#000000', white: '#ffffff', transparent: 'transparent' };
      const los = (u) => {
        const v = u.match(/var\(\s*(--[\w-]+)\s*\)/);
        if (v) return slutvarde(`var(${v[1]})`);
        const ord = u.replace(/\s*[\d.]+%\s*/, '').trim();
        return namngivna[ord] ?? ord;
      };
      const pct = (u) => {
        const m = u.match(/([\d.]+)%/);
        return m ? Number(m[1]) : null;
      };
      const a = los(delar[1]);
      const b = los(delar[2]);
      const vikt = pct(delar[1]) ?? (pct(delar[2]) !== null ? 100 - pct(delar[2]) : 50);
      if (a && b && /^#/.test(a)) {
        const vantat = mixaOberoende(a, vikt, b);
        kolla(
          `Komponent-token ${t.cssVar} har rätt uträknad färg`,
          t.hex === vantat.hex && Math.abs(t.alfa - vantat.alfa) < 0.001,
          `atlas ${t.hex}/alfa ${t.alfa}, oberoende ${vantat.hex}/alfa ${vantat.alfa}`,
        );
      }
    }
  }
}

// Fullständighet: varje färgtoken i källan ska finnas i atlasen
for (const [namn, varde] of kompKalla) {
  if (/-(width|radius|padding|size|weight)(-|$)/.test(namn)) continue;
  if (!/var\(|color-mix|^#|transparent/.test(varde)) continue;
  kolla(
    `Komponent-token ${namn} i källan finns även i atlasen`,
    atlasKomponent.some((t) => t.cssVar === namn),
  );
}

// ── C. Användningsräkningen ────────────────────────────────────────────────

/**
 * Räknar förekomster utan reguljära uttryck.
 *
 * Tredje försöket, och skälet är lärorikt. Ett grep-mönster med utskriven
 * vänster- och högergräns KONSUMERAR gränstecknet, så två träffar separerade av
 * ett enda tecken ("text-text bg-text") räknas som en. Generatorns lookahead
 * gör det inte. Att verifiera en lookahead med ett konsumerande mönster jämför
 * två olika frågor och ger falska avvikelser åt båda håll.
 *
 * Strängsökning plus explicit kontroll av tecknen omkring är trögare men har
 * inga egenheter alls — och det är hela poängen med en oberoende kontroll.
 */
function raknaForekomster(text, ord) {
  const ordtecken = (c) => c !== undefined && /[a-zA-Z0-9_-]/.test(c);
  let n = 0;
  let i = text.indexOf(ord);
  while (i !== -1) {
    if (!ordtecken(text[i - 1]) && !ordtecken(text[i + ord.length])) n++;
    i = text.indexOf(ord, i + 1);
  }
  return n;
}

function raknaIFiler(filer, ord) {
  return filer.reduce((n, f) => {
    // CSS-kommentarer bort: ett tokennamn i en motiveringstext är inte en
    // användning. Gäller bara stilfiler — i TSX är /* */ inte kommentarsyntax
    // på samma sätt och klassnamnen står i JSX-attribut.
    const text = f.endsWith('.css') ? las(f).replace(/\/\*[\s\S]*?\*\//g, '') : las(f);
    return n + raknaForekomster(text, ord);
  }, 0);
}

function listaFiler(monster) {
  return execFileSync(
    'sh',
    ['-c', `find src -type f \\( ${monster} \\) ! -name routeTree.gen.ts`],
    { cwd: ROT, encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean);
}

// Samma filuppsättningar som generatorn räknar över, men hittade med find i
// stället för med dess egen rekursion.
const kodFiler = listaFiler("-name '*.ts' -o -name '*.tsx'");
// Samma uppsättning generatorn räknar över: koden plus components.css och
// base.css. semantic.css utesluts (där DEFINIERAS rollerna), tailwind.css
// likaså (@theme-raden är en exponering, inte en användning), och
// primitives.css innehåller inga --mm-roller alls.
const varFiler = [
  ...kodFiler,
  ...listaFiler("-name '*.css'").filter((f) =>
    ['components.css', 'base.css'].some((n) => f.endsWith(n)),
  ),
];

for (const [namn, data] of atlasRoller) {
  const viaVar = raknaIFiler(varFiler, namn);
  const bas = temaBas(namn);
  const viaUtility = data.exponeradITheme
    ? ['bg', 'text', 'border', 'ring', 'outline', 'divide', 'fill', 'stroke'].reduce(
        (n, prefix) => n + raknaIFiler(kodFiler, `${prefix}-${bas}`),
        0,
      )
    : 0;

  kolla(
    `Roll ${namn} har rätt var()-räkning`,
    data.viaVar === viaVar,
    `atlas ${data.viaVar}, oberoende ${viaVar}`,
  );
  if (data.exponeradITheme) {
    kolla(
      `Roll ${namn} har rätt utility-räkning`,
      data.viaUtility === viaUtility,
      `atlas ${data.viaUtility}, oberoende ${viaUtility}`,
    );
  }
}

/**
 * @theme-posten som exponerar en roll, matchad exakt.
 *
 * includes() duger inte: var(--mm-text-secondary) innehåller strängen
 * --mm-text, så en delsträngsökning ger --mm-text utility-namnet
 * "text-secondary" och räknar fel klasser.
 */
function temaBas(mmNamn) {
  for (const [t, v] of temaKalla) {
    if (t.startsWith('--color-') && v.trim() === `var(${mmNamn})`) return t.replace('--color-', '');
  }
  return mmNamn.replace('--mm-', '');
}

// ── D. Fynden ───────────────────────────────────────────────────────────────

const fynd = JSON.parse(las('docs/design/farg-atlas.fynd.json'));
const fyndIds = fynd.fynd.map((f) => f.id);
kolla('Fyndregistret har unika id:n', new Set(fyndIds).size === fyndIds.length);
kolla(
  'Atlasen bär samma fynd som fyndfilen',
  JSON.stringify(atlas.$extensions['se.miranon.atlas'].fynd.map((f) => f.id)) ===
    JSON.stringify(fyndIds),
);

const login = las('src/routes/login.tsx');
const tema = las('src/styles/tailwind.css');
kolla('F1: text-white finns kvar i login.tsx', login.includes('text-white'));
kolla('F1: text-red-600 finns kvar i login.tsx', login.includes('text-red-600'));
kolla('F1: @theme nollställer Tailwinds palett', tema.includes('--color-*: initial'));
kolla(
  'F1: varken white eller red-600 är definierade i @theme',
  !temaKalla.has('--color-white') && !temaKalla.has('--color-red-600'),
);
kolla(
  'F1: mörk text på bg-primary ger 6,04:1',
  Math.abs(wcagKontrast('#242424', '#d4960a') - 6.04) < 0.02,
  wcagKontrast('#242424', '#d4960a').toFixed(2),
);
kolla(
  'F1: vit text på bg-primary hade gett 2,57:1',
  Math.abs(wcagKontrast('#ffffff', '#d4960a') - 2.57) < 0.02,
);

kolla(
  'F3: border-text-muted/20 förekommer 11 gånger',
  raknaIFiler(kodFiler, 'border-text-muted/20') === 11,
  `oberoende ${raknaIFiler(kodFiler, 'border-text-muted/20')}`,
);

kolla(
  'F4: cat-rollerna används inte i src',
  ['personal', 'event', 'people', 'comm', 'system'].every(
    (k) => raknaIFiler(kodFiler, `--mm-cat-${k}`) === 0,
  ),
);
kolla(
  'F4: cat-personal och cat-event pekar på samma primitiv',
  semKalla.get('--mm-cat-personal') === semKalla.get('--mm-cat-event'),
);

const spec = las('docs/specs/DESIGN-SYSTEM-SPEC.md');
kolla(
  'F5: specen anger fortfarande neutral-400 för text-muted',
  spec.includes('--mm-text-muted: var(--p-neutral-400)'),
);
kolla('F5: koden använder neutral-500', semKalla.get('--mm-text-muted') === 'var(--p-neutral-500)');
kolla(
  'F5: neutral-400 mäter 3,50:1 mot vitt',
  Math.abs(wcagKontrast('#898989', '#ffffff') - 3.5) < 0.02,
);
kolla(
  'F5: neutral-500 mäter 5,33:1 mot vitt',
  Math.abs(wcagKontrast('#6b6b6b', '#ffffff') - 5.33) < 0.02,
);

kolla(
  'F9: gold-500 mäter 2,57:1 mot vit yta',
  Math.abs(wcagKontrast('#d4960a', '#ffffff') - 2.57) < 0.02,
);
kolla(
  'F9: gold-700 är enda guldsteget över AA mot vitt',
  wcagKontrast('#96680a', '#ffffff') >= 4.5,
);

// ── E. De nya skalorna ──────────────────────────────────────────────────────

for (const skala of ['gold', 'copper', 'neutral', 'sage', 'red']) {
  for (let steg = 1; steg <= 12; steg++) {
    kolla(
      `Ny skala --p-${skala}-${steg} finns i primitives.css`,
      primKalla.has(`--p-${skala}-${steg}`),
    );
  }
  // Ljushetsordning: varje steg ska vara mörkare än det föregående
  const varden = Array.from({ length: 12 }, (_, i) => primKalla.get(`--p-${skala}-${i + 1}`));
  if (varden.every(Boolean)) {
    const ljushet = varden.map(cieLjushet);
    kolla(
      `Ny skala ${skala} är monoton i ljushet`,
      ljushet.every((v, i) => i === 0 || v < ljushet[i - 1] + 0.01),
      ljushet.map((v) => v.toFixed(1)).join(' → '),
    );
    kolla(
      `Ny skala ${skala} steg 11 klarar AA mot steg 2`,
      wcagKontrast(varden[10], varden[1]) >= 4.5,
      wcagKontrast(varden[10], varden[1]).toFixed(2),
    );
  }
}

// Ankarna ska vara identiska med den gamla palettens motsvarigheter
for (const [ny, gammal] of [
  ['--p-gold-9', '--p-gold-500'],
  ['--p-copper-9', '--p-copper-500'],
  ['--p-neutral-9', '--p-neutral-500'],
  ['--p-sage-9', '--p-green-500'],
  ['--p-red-9', '--p-red-500'],
]) {
  kolla(
    `Ankaret ${ny} är oförändrat mot ${gammal}`,
    primKalla.get(ny) === primKalla.get(gammal),
    `${primKalla.get(ny)} mot ${primKalla.get(gammal)}`,
  );
}

// Blå är den enda skala vars ankare flyttades (fynd F10). Att det INTE är den
// gamla kulören är själva åtgärden, så kontrollen är omvänd mot de andra fem.
kolla('Blå har en tolvstegsskala', primKalla.has('--p-blue-1'));
kolla(
  'Blåskalans ankare är flyttat bort från den gamla kulören',
  primKalla.get('--p-blue-9') !== primKalla.get('--p-blue-500'),
  `${primKalla.get('--p-blue-9')} mot ${primKalla.get('--p-blue-500')}`,
);

// ── F. Appen ska vara oförändrad ────────────────────────────────────────────

const fokus = '#1b4965';
kolla('Fokusringen är oförändrad', primKalla.get('--p-blue-700') === fokus);
for (const roll of ['--mm-primary', '--mm-accent', '--mm-success', '--mm-error', '--mm-info']) {
  const pekar = semKalla.get(roll)?.match(/var\(\s*(--[\w-]+)\s*\)/)?.[1];
  kolla(
    `Rollen ${roll} pekar fortfarande på den gamla paletten`,
    pekar && !/^--p-[a-z]+-([1-9]|1[0-2])$/.test(pekar),
    `pekar på ${pekar}`,
  );
}

// ── G. Den visuella atlasen ─────────────────────────────────────────────────
//
// HTML:en och JSON:en genereras i samma körning men av olika kod, så de kan
// divergera. Den renderade sidan är dessutom det Marcus faktiskt tittar på —
// en korrekt JSON bakom en felaktig sida är ingen tröst.

const html = las('docs/design/farg-atlas.html');

// Varje färgruta bär sin hex både som bakgrund och som utskriven kod. Stämmer
// de inte överens visar sidan en färg och påstår en annan.
const rutor = [
  ...html.matchAll(
    /<div class="prov" style="background:(#[0-9a-f]{6});[^"]*">([^<]*)<\/div>\s*<div class="under">\s*<code>(#[0-9a-f]{6})<\/code>/g,
  ),
];
kolla('Atlasen renderar färgrutor', rutor.length > 100, `hittade ${rutor.length}`);
let ruteFel = 0;
for (const [, bakgrund, , utskriven] of rutor) {
  if (bakgrund.toLowerCase() !== utskriven.toLowerCase()) ruteFel++;
}
kolla(
  'Varje färgruta visar samma hex som den skriver ut',
  ruteFel === 0,
  `${ruteFel} rutor visar en färg och påstår en annan`,
);

// Varje primitiv i källan ska synas på sidan
for (const [namn, varde] of primKalla) {
  if (!/^#[0-9a-fA-F]{3,8}$/.test(varde)) continue;
  kolla(
    `Primitiv ${namn} syns i den renderade atlasen`,
    html.toLowerCase().includes(varde.toLowerCase()),
  );
}

// Ingen hex på sidan får sakna motsvarighet i källan. Sedan paletten spikades
// finns inga förslag eller jämförelser kvar att rendera, så varje färgruta ska
// gå att spåra till en primitiv i primitives.css — en färg utan ursprung är
// precis den sortens påhitt atlasen finns för att förhindra.
const kandaHexar = new Set([...primKalla.values()].map((h) => String(h).toLowerCase()));
const provHexar = [...html.matchAll(/class="prov" style="background:(#[0-9a-f]{6})/g)].map((m) =>
  m[1].toLowerCase(),
);
const okanda = [...new Set(provHexar)].filter((h) => !kandaHexar.has(h));
kolla(
  'Varje renderad färgruta har ett ursprung i källan eller förslagen',
  okanda.length === 0,
  `okända: ${okanda.join(', ')}`,
);

// Räknade påståenden i ingressen ska stämma
const mPrim = html.match(/(\d+) primitiver/);
kolla(
  'Atlasens angivna antal primitiver stämmer',
  mPrim && Number(mPrim[1]) === atlasPrimitiv.size,
  `sidan säger ${mPrim?.[1]}, JSON har ${atlasPrimitiv.size}`,
);
const mRoll = html.match(/(\d+) roller/);
kolla(
  'Atlasens angivna antal roller stämmer',
  mRoll && Number(mRoll[1]) === atlasRoller.size,
  `sidan säger ${mRoll?.[1]}, JSON har ${atlasRoller.size}`,
);

// Fynden ska stå på sidan, inte bara i JSON
for (const f of fynd.fynd) {
  kolla(`Fynd ${f.id} redovisas i den renderade atlasen`, html.includes(f.id));
}

// Sidan ska vara självständig — en atlas som hämtar något utifrån kan visa
// annat än den påstår, och blockeras dessutom av artefaktens CSP.
kolla(
  'Atlasen har inga externa referenser',
  !/(src|href)="https?:/.test(html),
  'sidan hämtar något utifrån',
);

// ── Utfall ──────────────────────────────────────────────────────────────────

console.log(`\n  ${prov} kontroller körda mot källkoden.\n`);
if (avvikelser.length === 0) {
  console.log('  Inga avvikelser. Atlasen stämmer med appen.\n');
  process.exit(0);
}
console.log(`  ${avvikelser.length} AVVIKELSER:\n`);
for (const a of avvikelser) console.log(`   ✗ ${a}`);
console.log();
process.exit(1);
