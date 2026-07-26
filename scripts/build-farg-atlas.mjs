#!/usr/bin/env node
/**
 * build-farg-atlas.mjs — bygger färgatlasen ur källkoden.
 *
 * Atlasen läser src/styles/tokens/*.css och src/-koden i stället för att
 * upprepa dem. Det är hela poängen: en handskriven palettdokumentation börjar
 * ljuga första gången någon ändrar ett tokenvärde utan att uppdatera doket, och
 * en palett man inte litar på är värre än ingen alls.
 *
 * Producerar två artefakter ur samma körning, så de aldrig kan säga olika:
 *   docs/design/farg-atlas.tokens.json  maskinläsbar, DTCG 2025.10
 *   docs/design/farg-atlas.html         visuell, självständig, utan beroenden
 *
 * Kurerat innehåll (auditens fynd) läses ur docs/design/farg-atlas.fynd.json.
 *
 * Kör: npm run atlas
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hexTillRgb, matning, oklch, textPa } from './lib/farg.mjs';
import { byggSkala, hittaKollisioner, provaKontrakt } from './lib/skala.mjs';

/**
 * Vad varje primitivgrupp faktiskt ÄR i appen. Gruppnamnet kommer ur
 * tokennamnet och räcker inte: "green — 2 steg" säger ingenting om att det är
 * sage-grönt som bär skapa-knappen och används 33 gånger.
 */
const ETIKETT = {
  'gold\u00a0': 'Guld — tolvstegsskalan (ny, ingen roll pekar hit än)',
  'copper\u00a0': 'Koppar — tolvstegsskalan (ny)',
  'neutral\u00a0': 'Neutraler — tolvstegsskalan (ny, ton 100° kroma 0,008)',
  'sage\u00a0': 'Sage — tolvstegsskalan (ny)',
  'red\u00a0': 'Röd — tolvstegsskalan (ny)',
  gold: 'Guld/amber — primärfärgen',
  copper: 'Koppar — accent, CTA och varning',
  neutral: 'Neutraler — bär omkring 450 av appens färganvändningar',
  blue: 'Blå — info, kommunikation, Fjärrskådning. Plus fokusringen, som är exklusiv',
  red: 'Röd — fel och RIM 3',
  green: 'Sage — success, skapa-knappen och RIM 1',
};

const ROT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const las = (p) => readFileSync(join(ROT, p), 'utf8');

// ── Steg 1: läs tokens ur CSS ────────────────────────────────────────────────

/** Plockar ut `--namn: värde;` ur en CSS-fil. Kommentarer strippas först. */
function parsaTokens(css) {
  const utanKommentarer = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map();
  for (const m of utanKommentarer.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  return tokens;
}

/**
 * Följer var(--x)-kedjor till ett faktiskt färgvärde.
 *
 * Mellanslagen i mönstret är inte kosmetik: biome bryter långa deklarationer
 * över flera rader, så `var(\n  --p-neutral-400\n)` är lika vanligt i filerna
 * som den kompakta formen. Ett mönster utan dem tappar tyst fyra roller.
 */
const ALIAS = /^var\(\s*(--[\w-]+)\s*\)$/;

function losAlias(varde, alla, djup = 0) {
  if (djup > 10) return null;
  const m = varde.match(ALIAS);
  if (!m) return varde;
  const nasta = alla.get(m[1]);
  return nasta ? losAlias(nasta, alla, djup + 1) : null;
}

const arHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());

// ── Steg 2: räkna faktisk användning ─────────────────────────────────────────

function samlaFiler(katalog, filter, traff = []) {
  for (const post of readdirSync(join(ROT, katalog))) {
    const rel = join(katalog, post);
    if (post === 'node_modules' || post.startsWith('.')) continue;
    if (statSync(join(ROT, rel)).isDirectory()) samlaFiler(rel, filter, traff);
    else if (filter.test(post)) traff.push(rel);
  }
  return traff;
}

/**
 * Hur många gånger ett token nämns utanför sin egen definitionsfil.
 *
 * Gränsen skrivs ut som (?![\w-]) och inte som \b. Regexens ordgräns räknar
 * bindestreck som gräns, så `--mm-text\b` matchar inuti `--mm-text-muted` —
 * och varje token vars namn är prefix till ett annat fick sin användning
 * uppräknad med de andras. --mm-text rapporterades som 21 när den verkliga
 * siffran var 15.
 */
function raknaAnvandning(namn, kallor) {
  let n = 0;
  for (const { text } of kallor) {
    n += (text.match(new RegExp(`${namn}(?![\\w-])`, 'g')) || []).length;
  }
  return n;
}

// ── Steg 3: bygg datamodellen ────────────────────────────────────────────────

function byggModell() {
  const primitivCss = las('src/styles/tokens/primitives.css');
  const semantiskCss = las('src/styles/tokens/semantic.css');
  const komponentCss = las('src/styles/tokens/components.css');
  const temaCss = las('src/styles/tailwind.css');

  const primitiv = parsaTokens(primitivCss);
  const semantisk = parsaTokens(semantiskCss);
  const komponent = parsaTokens(komponentCss);
  const tema = parsaTokens(temaCss);
  const alla = new Map([...primitiv, ...semantisk, ...komponent]);

  // Källor att räkna användning i: all TSX plus stilarna, men aldrig filen
  // tokenet definieras i (annars räknas definitionsraden som en användning).
  // Både .ts och .tsx: uppslagstabeller som src/lib/kursfarg.ts bär
  // klassnamnen för kursfärgerna, och en scan som bara tittar på komponenter
  // rapporterar dem felaktigt som döda.
  const tsx = samlaFiler('src', /\.tsx?$/)
    .filter((f) => !f.endsWith('routeTree.gen.ts'))
    .map((f) => ({ fil: f, text: las(f) }));
  // Kommentarerna strippas före räkning. En roll som bara NÄMNS i en
  // motiveringstext är inte använd, och stilfilerna här är tätt kommenterade —
  // --mm-success rapporterades som 14 träffar i components.css där 13 var
  // faktiska deklarationer och en var brödtext om färgen.
  const utanKommentar = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const cssKallor = [
    { fil: 'semantic.css', text: utanKommentar(semantiskCss) },
    { fil: 'components.css', text: utanKommentar(komponentCss) },
    { fil: 'tailwind.css', text: utanKommentar(temaCss) },
    { fil: 'base.css', text: utanKommentar(las('src/styles/base.css')) },
  ];

  const primitivFarger = [...primitiv]
    .filter(([, v]) => arHex(v))
    .map(([namn, varde]) => ({
      namn,
      ...matning(varde),
      anvandning: raknaAnvandning(namn, [...tsx, ...cssKallor]),
    }));

  // En roll kan konsumeras på två vägar (fynd F2): som Tailwind-utility om den
  // är exponerad i @theme, eller som var() direkt. Räknas bara den ena ser
  // hårt använda roller ut som döda — --mm-text-muted bärs av 164
  // utility-träffar och 2 var()-träffar.
  const utilityFor = new Map();
  for (const [temaNamn, temaVarde] of tema) {
    const m = temaVarde.match(ALIAS);
    if (m?.[1].startsWith('--mm-') && temaNamn.startsWith('--color-'))
      utilityFor.set(m[1], temaNamn.replace('--color-', ''));
  }

  // Vänstergränsen skrivs (^|[^\w-]) och inte \b. Ordgränsen matchar efter ett
  // bindestreck, så \b(outline)-text träffar inuti CSS-variabelnamnet
  // --mm-button-primary-outline-text och räknade tre klassnamn som inte finns.
  const raknaUtility = (bas) =>
    tsx.reduce(
      (n, { text }) =>
        n +
        (
          text.match(
            new RegExp(
              `(^|[^\\w-])(bg|text|border|ring|outline|divide|fill|stroke)-${bas}(?![\\w-])`,
              'gm',
            ),
          ) || []
        ).length,
      0,
    );

  const semantiskaRoller = [...semantisk]
    .map(([namn, varde]) => {
      const lost = losAlias(varde, alla);
      const bas = utilityFor.get(namn);
      // tailwind.css utesluts: @theme-raden är en exponering, inte en användning.
      const viaVar = raknaAnvandning(
        namn,
        [...tsx, ...cssKallor].filter(
          (k) => !k.fil.endsWith('semantic.css') && !k.fil.endsWith('tailwind.css'),
        ),
      );
      const viaUtility = bas ? raknaUtility(bas) : 0;
      return {
        namn,
        varde,
        hex: arHex(lost) ? lost.toLowerCase() : null,
        beraknad: !arHex(lost) && /color-mix/.test(varde),
        iTema: Boolean(bas),
        viaVar,
        viaUtility,
        anvandning: viaVar + viaUtility,
      };
    })
    .filter((r) => r.hex || r.beraknad);

  // Utility-namnet Tailwind genererar ur en @theme-post: --color-bg-muted → bg-muted
  const temaRoller = [...tema]
    .filter(([namn]) => namn.startsWith('--color-'))
    .map(([namn, varde]) => {
      const bas = namn.replace('--color-', '');
      return { namn, bas, varde, anvandning: raknaUtility(bas) };
    });

  return { primitivFarger, semantiskaRoller, temaRoller };
}

// ── Steg 4: gruppera primitiver i skalor ─────────────────────────────────────

function grupperaSkalor(primitivFarger) {
  const grupper = new Map();
  for (const f of primitivFarger) {
    const m = f.namn.match(/^--p-([a-z]+)-(\d+)$/);
    // Två generationer lever sida vid sida under migreringen. Tolvstegsskalorna
    // numreras 1–12, den gamla paletten 100–1000; utan den här delningen
    // blandas de i samma rad och sorteras 1, 2, … 12, 100, 200 som om de vore
    // en enda skala.
    const nyGeneration = m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
    const nyckel = m ? (nyGeneration ? `${m[1]}\u00a0` : m[1]) : 'ovrigt';
    if (!grupper.has(nyckel)) grupper.set(nyckel, []);
    grupper.get(nyckel).push({ ...f, steg: m ? Number(m[2]) : null });
  }
  for (const lista of grupper.values()) lista.sort((a, b) => (a.steg ?? 0) - (b.steg ?? 0));
  return grupper;
}

/** Hål i en skala, mätt i CIE L*. Stora hopp betyder att steg saknas. */
function hittaHal(skala) {
  const hal = [];
  for (let i = 1; i < skala.length; i++) {
    hal.push({
      fran: skala[i - 1].namn,
      till: skala[i].namn,
      delta: skala[i - 1].cieL - skala[i].cieL,
    });
  }
  return hal;
}

// ── Steg 5: DTCG-utdata ──────────────────────────────────────────────────────

/** Ett DTCG-färgvärde: srgb-komponenter plus hex som fallback. */
function dtcgFarg(hex) {
  return {
    colorSpace: 'srgb',
    components: hexTillRgb(hex).map((c) => Number(c.toFixed(4))),
    hex: hex.toLowerCase(),
  };
}

function byggDtcg(modell, skalor, forslag, fynd, neutralvagar) {
  const primitiv = { $type: 'color', $description: 'Lager 1 — råa värden.' };
  for (const [grupp, lista] of skalor) {
    primitiv[grupp] = {};
    for (const f of lista) {
      primitiv[grupp][f.steg ?? f.namn.replace('--p-', '')] = {
        $value: dtcgFarg(f.hex),
        $description: `${f.namn} · CIE L* ${f.cieL.toFixed(1)} · kontrast mot vit ${f.motVit.toFixed(2)}:1`,
        $extensions: {
          'se.miranon.atlas': {
            cssVar: f.namn,
            anvandning: f.anvandning,
            status: f.anvandning > 0 ? 'levande' : 'oanvänd',
            oklch: {
              L: +oklch(f.hex).L.toFixed(4),
              C: +oklch(f.hex).C.toFixed(4),
              h: +oklch(f.hex).h.toFixed(1),
            },
          },
        },
      };
    }
  }

  const roll = { $type: 'color', $description: 'Lager 2 — semantiska roller.' };
  for (const r of modell.semantiskaRoller) {
    const alias = r.varde.match(ALIAS);
    const dtcgVag = alias?.[1].match(/^--p-([a-z]+)-(\d+)$/);
    roll[r.namn.replace('--mm-', '')] = {
      ...(r.hex
        ? { $value: dtcgVag ? `{primitiv.${dtcgVag[1]}.${dtcgVag[2]}}` : dtcgFarg(r.hex) }
        : {}),
      $description: r.beraknad ? `Beräknad: ${r.varde}` : `${r.namn} → ${r.varde}`,
      $extensions: {
        'se.miranon.atlas': {
          cssVar: r.namn,
          anvandning: r.anvandning,
          viaUtility: r.viaUtility,
          viaVar: r.viaVar,
          status: r.anvandning > 0 ? 'levande' : 'oanvänd',
          exponeradITheme: r.iTema,
        },
      },
    };
  }

  const forslagsGrupp = { $type: 'color', $description: 'Förslag — ej implementerat.' };
  for (const [namn, data] of Object.entries(forslag)) {
    forslagsGrupp[namn] = {};
    for (const s of data.skala) {
      forslagsGrupp[namn][s.steg] = {
        $value: dtcgFarg(s.hex),
        $description: `Steg ${s.steg} — ${s.roll}`,
      };
    }
  }

  // Neutralvägarna renderades först bara i HTML. En maskinläsbar fil som visar
  // mindre än den visuella är ett tyst löftesbrott: den som konsumerar JSON:en
  // ser inte de alternativ sidan lägger fram.
  const jamforelse = {
    $type: 'color',
    $description: 'Neutralernas mättnadsnivåer — underlag, ej implementerat.',
  };
  for (const v of neutralvagar) {
    jamforelse[v.nyckel] = { $description: `${v.rubrik} — ${v.not}` };
    for (const s of v.skala) {
      jamforelse[v.nyckel][s.steg] = {
        $value: dtcgFarg(s.hex),
        $description: `Steg ${s.steg} — ${s.roll}`,
      };
    }
  }

  return {
    $description:
      'Färgatlas för Miranon Media Admin. Genererad ur src/ av scripts/build-farg-atlas.mjs — redigera inte för hand.',
    $extensions: {
      'se.miranon.atlas': {
        format: 'DTCG 2025.10',
        granskat: fynd.granskat,
        rent: fynd.rent,
        fynd: fynd.fynd,
        kontrakt: Object.fromEntries(Object.entries(forslag).map(([n, d]) => [n, d.kontrakt])),
      },
    },
    primitiv,
    roll,
    forslag: forslagsGrupp,
    jamforelse,
  };
}

// ── Steg 6: HTML ─────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

function ruta(hex, etikett, under) {
  return `<div class="ruta"><div class="prov" style="background:${hex};color:${textPa(hex)}">${esc(etikett)}</div><div class="under">${under}</div></div>`;
}

function skalRad(titel, poster, beskrivning) {
  return `<section class="skala">
  <h3>${esc(titel)}</h3>
  ${beskrivning ? `<p class="ingress">${beskrivning}</p>` : ''}
  <div class="rutor">${poster.join('')}</div>
</section>`;
}

function byggHtml(modell, skalor, forslag, fynd, neutralvagar) {
  const dagensNeutral = (skalor.get('neutral') ?? [])
    .map((f) =>
      ruta(f.hex, f.steg, `<code>${esc(f.hex)}</code><span>L* ${f.cieL.toFixed(1)}</span>`),
    )
    .join('');
  const neutralSektioner = neutralvagar
    .map((v) => {
      const rutor = v.skala
        .map((s) =>
          ruta(s.hex, s.steg, `<code>${esc(s.hex)}</code><span class="roll">${esc(s.roll)}</span>`),
        )
        .join('');
      const kontrakt = provaKontrakt(v.skala)
        .map(
          (k) =>
            `<li class="${k.haller ? 'ok' : 'fel'}"><span>${k.haller ? '✓' : '✗'}</span> ${esc(k.krav)} — <strong>${k.uppmatt.toFixed(2)}</strong> (golv ${k.golv})</li>`,
        )
        .join('');
      return `<section class="skala">
      <h3>${esc(v.rubrik)}</h3>
      <p class="ingress">${esc(v.not)}</p>
      <div class="rutor">${rutor}</div>
      <ul class="kontrakt">${kontrakt}</ul>
    </section>`;
    })
    .join('\n');

  const nu = new Date().toISOString().slice(0, 10);

  // Nuläge — en rad per skala
  const nulageSektioner = [...skalor]
    .map(([grupp, lista]) => {
      const hal = hittaHal(lista);
      const storsta = hal.length ? hal.reduce((a, b) => (b.delta > a.delta ? b : a)) : null;
      const rutor = lista.map((f) =>
        ruta(
          f.hex,
          f.steg ?? f.namn.replace('--p-', ''),
          `<code>${esc(f.hex)}</code>
           <span>L* ${f.cieL.toFixed(1)}</span>
           <span>${f.motVit.toFixed(2)}:1</span>
           <span class="${f.anvandning === 0 ? 'dod' : 'lev'}">${f.anvandning === 0 ? 'oanvänd' : `${f.anvandning}×`}</span>`,
        ),
      );
      const not =
        storsta && storsta.delta > 15
          ? `<strong>Största hål:</strong> ${esc(storsta.fran)} → ${esc(storsta.till)}, ${storsta.delta.toFixed(1)} L*-enheter. Där ryms flera steg.`
          : 'Stegen ligger jämnt fördelade.';
      const etikett = ETIKETT[grupp] ?? grupp;
      return skalRad(`${etikett} · ${lista.length} steg`, rutor, not);
    })
    .join('\n');

  // Roller
  const rollRader = modell.semantiskaRoller
    .map(
      (r) => `<tr>
      <td><code>${esc(r.namn)}</code></td>
      <td>${r.hex ? `<span class="punkt" style="background:${r.hex}"></span><code>${esc(r.hex)}</code>` : '<em>beräknad</em>'}</td>
      <td><code class="tyst">${esc(r.varde)}</code></td>
      <td>${r.iTema ? 'ja' : '<span class="varn">nej</span>'}</td>
      <td class="${r.anvandning === 0 ? 'dod' : ''}">${
        r.anvandning === 0
          ? 'oanvänd'
          : `${r.anvandning}× <span class="delning">${r.viaUtility} utility · ${r.viaVar} var()</span>`
      }</td>
    </tr>`,
    )
    .join('');

  // Förslag
  const forslagSektioner = Object.entries(forslag)
    .map(([namn, data]) => {
      const rutor = data.skala.map((s) =>
        ruta(s.hex, s.steg, `<code>${esc(s.hex)}</code><span class="roll">${esc(s.roll)}</span>`),
      );
      const kollisioner = (data.kollisioner ?? [])
        .map(
          (k) =>
            `<li class="fel"><span>!</span> Steg ${k.steg} (<code>${esc(k.hex)}</code>) ligger på avstånd ${k.avstand.toFixed(1)} från ${esc(k.vad)} — perceptuellt samma färg</li>`,
        )
        .join('');
      const kontrakt = data.kontrakt
        .map(
          (k) =>
            `<li class="${k.haller ? 'ok' : 'fel'}"><span>${k.haller ? '✓' : '✗'}</span> ${esc(k.krav)} — <strong>${k.uppmatt.toFixed(2)}</strong> (golv ${k.golv})</li>`,
        )
        .join('');
      return `<section class="skala">
      <h3>${esc(data.rubrik ?? namn)} — förslag, 12 steg</h3>
      <p class="ingress">${esc(data.not)}</p>
      <div class="rutor">${rutor.join('')}</div>
      <ul class="kontrakt">${kollisioner}${kontrakt}</ul>
    </section>`;
    })
    .join('\n');

  const fyndSektioner = fynd.fynd
    .map(
      (f) => `<article class="fynd ${esc(f.allvar)}">
      <h3><span class="id">${esc(f.id)}</span> ${esc(f.rubrik)} <span class="allvar">${esc(f.allvar)}</span></h3>
      ${f.plats ? `<p class="plats">${f.plats.map((p) => `<code>${esc(p)}</code>`).join(' · ')}</p>` : ''}
      <p>${esc(f.vad)}</p>
      ${f.verifiering ? `<p class="verif"><strong>Verifiering:</strong> ${esc(f.verifiering)}</p>` : ''}
      ${f.foljd ? `<p><strong>Följd:</strong> ${esc(f.foljd)}</p>` : ''}
      ${f.fallan ? `<p class="fallan"><strong>Fällan:</strong> ${esc(f.fallan)}</p>` : ''}
      ${f.ovrigt ? `<p>${esc(f.ovrigt)}</p>` : ''}
    </article>`,
    )
    .join('\n');

  const rentRader = fynd.rent
    .map(
      (r) =>
        `<li><span class="ok">✓</span> ${esc(r.kontroll)}: <strong>${esc(r.resultat)}</strong>${r.not ? ` — ${esc(r.not)}` : ''}</li>`,
    )
    .join('');

  const doda = modell.primitivFarger.filter((f) => f.anvandning === 0);
  const dodaRoller = modell.semantiskaRoller.filter((r) => r.anvandning === 0);
  const utilityDoda = modell.temaRoller.filter((t) => t.anvandning === 0);

  return `<title>Färgatlas — Miranon Media Admin</title>
<style>
  :root {
    color-scheme: light dark;
    /* Atlasen är byggd i den palett den dokumenterar. Varje värde här är ett
       levande Miranon-token — inklusive --p-gold-700, som appen definierar men
       aldrig använder och som här får bära varningsgraden. Neutralerna är
       husets egna svagt varma toner, inte inköpt grått. */
    --yta: #ffffff;        /* --p-neutral-0   */
    --yta2: #f5f5f3;       /* --p-neutral-50  */
    --text: #242424;       /* --p-neutral-900 */
    --tyst: #6b6b6b;       /* --p-neutral-500 */
    --kant: #e1e3e1;       /* --p-neutral-200 */
    --accent: #a3491c;     /* --p-copper-500  */
    --ok: #606b57;         /* --p-green-500   */
    --fel: #a90000;        /* --p-red-500     */
    --varn: #956800;       /* --p-gold-700, en hårsmån mörkare — se noten nedan */
    /* gold-700 rakt av mäter 4,49:1 mot --yta2 och missar AA med 0,01. Att
       atlasens egen varningsfärg fick mörkas för att hålla är inte en
       parentes: det är fynd F9 som inträffar i atlasen medan den skrivs. */
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --yta: #1a1a1a;      /* --p-neutral-1000, appens andra oanvända token */
      --yta2: #242424;     /* --p-neutral-900 */
      --text: #edeee9;     /* --p-neutral-100 */
      --tyst: #c4c4c2;     /* --p-neutral-300, ljusnad för läsbarhet mot mörk yta */
      --kant: #3a3a3a;     /* --p-neutral-700 */
      --accent: #e5ae4e;   /* guldskalans steg 7 — kopparn blir för tung mot mörkt */
      --ok: #8f9b84;
      --fel: #ff9a9a;
      --varn: #e6aa3a;
    }
  }
  :root[data-theme="dark"] {
    --yta: #1a1a1a; --yta2: #242424; --text: #edeee9; --tyst: #c4c4c2;
    --kant: #3a3a3a; --accent: #e5ae4e; --ok: #8f9b84; --fel: #ff9a9a; --varn: #e6aa3a;
  }
  :root[data-theme="light"] {
    --yta: #ffffff; --yta2: #f5f5f3; --text: #242424; --tyst: #6b6b6b;
    --kant: #e1e3e1; --accent: #a3491c; --ok: #606b57; --fel: #a90000; --varn: #96680a;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--yta); color: var(--text);
         font: 16px/1.55 system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
  .omslag { max-width: 1180px; margin: 0 auto; padding: 2.5rem 1.25rem 5rem; }
  header { border-bottom: 2px solid var(--kant); padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
  h1 { font-size: clamp(1.6rem, 4vw, 2.3rem); margin: 0 0 .4rem; letter-spacing: -.02em; }
  h2 { font-size: 1.3rem; margin: 3rem 0 .5rem; padding-top: 1.5rem; border-top: 1px solid var(--kant); letter-spacing: -.01em; }
  h3 { font-size: 1rem; margin: 1.75rem 0 .5rem; }
  p { margin: .5rem 0; }
  .lead { color: var(--tyst); max-width: 68ch; }
  .meta { color: var(--tyst); font-size: .85rem; margin-top: .75rem; }
  .ingress { color: var(--tyst); font-size: .9rem; max-width: 80ch; }
  code { font: .8em ui-monospace, "JetBrains Mono", monospace;
         background: var(--yta2); padding: .1em .35em; border-radius: 3px; }
  code.tyst { background: none; color: var(--tyst); padding: 0; }

  .rutor { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: .5rem; }
  .prov { aspect-ratio: 3/2; border-radius: 6px 6px 0 0; display: flex; align-items: flex-end;
          padding: .4rem .5rem; font-size: .8rem; font-weight: 600; border: 1px solid var(--kant); border-bottom: 0; }
  .under { font-variant-numeric: tabular-nums;
           border: 1px solid var(--kant); border-top: 0; border-radius: 0 0 6px 6px;
           padding: .4rem .5rem; display: flex; flex-direction: column; gap: .1rem;
           font-size: .7rem; color: var(--tyst); background: var(--yta2); }
  .under code { background: none; padding: 0; font-size: .95em; color: var(--text); }
  .under .roll { font-size: .95em; line-height: 1.3; }
  .dod { color: var(--fel); font-weight: 600; }
  .lev { color: var(--tyst); }
  .delning { display: block; font-size: .9em; color: var(--tyst); }
  .varn { color: var(--varn); font-weight: 600; }

  .tabellyta { overflow-x: auto; margin: 1rem 0; border: 1px solid var(--kant); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; font-size: .82rem; min-width: 720px;
          font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid var(--kant); vertical-align: middle; }
  th { background: var(--yta2); font-weight: 600; position: sticky; top: 0; }
  tbody tr:last-child td { border-bottom: 0; }
  .punkt { display: inline-block; width: .85em; height: .85em; border-radius: 3px;
           border: 1px solid var(--kant); margin-right: .4em; vertical-align: -1px; }

  .kontrakt { list-style: none; padding: 0; margin: .85rem 0 0; font-size: .82rem;
              display: grid; gap: .25rem; }
  .kontrakt li { padding: .3rem .55rem; border-radius: 4px; background: var(--yta2);
                 font-variant-numeric: tabular-nums; }
  .kontrakt .ok, li.ok { color: var(--ok); }
  .kontrakt li.fel { color: var(--fel); background: color-mix(in srgb, var(--fel) 10%, transparent); }
  .kontrakt li span:first-child { font-weight: 700; margin-right: .3rem; }

  .fynd { border: 1px solid var(--kant); border-left: 4px solid var(--tyst);
          border-radius: 6px; padding: .9rem 1.1rem; margin: 1rem 0; background: var(--yta2); }
  .fynd.hög { border-left-color: var(--fel); }
  .fynd.medel { border-left-color: var(--varn); }
  .fynd.låg { border-left-color: var(--tyst); }
  .fynd h3 { margin: 0 0 .5rem; font-size: .98rem; display: flex; align-items: baseline; gap: .5rem; flex-wrap: wrap; }
  .fynd .id { font: .8rem ui-monospace, monospace; color: var(--tyst); }
  .fynd .allvar { font-size: .7rem; text-transform: uppercase; letter-spacing: .05em;
                  color: var(--tyst); margin-left: auto; }
  .fynd p { font-size: .87rem; margin: .4rem 0; }
  .fynd .plats code { font-size: .75rem; }
  .fynd .verif { color: var(--tyst); }
  .fynd .fallan { border-left: 3px solid var(--varn); padding-left: .7rem; }
  .rent { list-style: none; padding: 0; font-size: .87rem; display: grid; gap: .3rem; }
  .rent .ok { color: var(--ok); font-weight: 700; margin-right: .4rem; }
  .noter { font-size: .85rem; color: var(--tyst); }
  .noter li { margin: .25rem 0; }
</style>
<div class="omslag">
<header>
  <h1>Färgatlas</h1>
  <p class="lead">Nuläget i Miranon Media Admins färgsystem, mätt och renderat — plus vad som saknas
     och hur en fullständig palett skulle se ut. Genererad ur <code>src/</code>, inte skriven för hand.</p>
  <p class="meta">Byggd ${nu} · ${modell.primitivFarger.length} primitiver ·
     ${modell.semantiskaRoller.length} roller · ${modell.temaRoller.length} utilities i <code>@theme</code></p>
</header>

<h2>1. Nuläget — primitiva skalor</h2>
<p class="lead">Varje ruta visar hex, CIE L* (perceptuell ljushet — måttet som avgör om två steg
   känns lika stora), kontrast mot vit yta, och hur många gånger tokenet faktiskt används.</p>
${nulageSektioner}

<h2>2. Nuläget — semantiska roller</h2>
<p class="lead">Lager 2. Kolumnen <em>i @theme</em> visar om rollen är exponerad som
   Tailwind-utility eller bara nåbar via <code>var()</code> — de två konsumtionsvägarna i fynd F2.</p>
<div class="tabellyta"><table>
  <thead><tr><th>Roll</th><th>Löser till</th><th>Definition</th><th>i @theme</th><th>Användning</th></tr></thead>
  <tbody>${rollRader}</tbody>
</table></div>
<ul class="noter">
  <li><strong>${doda.length}</strong> primitiver är oanvända: ${doda.map((d) => `<code>${esc(d.namn)}</code>`).join(', ') || '—'}</li>
  <li><strong>${dodaRoller.length}</strong> roller är oanvända: ${dodaRoller.map((d) => `<code>${esc(d.namn)}</code>`).join(', ') || '—'}</li>
  <li><strong>${utilityDoda.length}</strong> av ${modell.temaRoller.length} <code>@theme</code>-utilities används aldrig i TSX
      (flera lever ändå via <code>var()</code> i CSS-lagret)</li>
</ul>

<h2>3. Vad som håller</h2>
<ul class="rent">${rentRader}</ul>

<h2>4. Brister</h2>
${fyndSektioner}

<h2>5. Neutralernas värme — hur mycket?</h2>
<p class="lead">Neutralerna bär omkring 450 av appens färganvändningar, så deras ton slår
   igenom överallt. Men <strong>tonvalet spelar nästan ingen roll</strong> — 70°, 106° och 120°
   skiljer en till två hexpunkter. Det som avgör om värmen syns är mättnaden, och där ligger
   dagens neutraler på 0,003 medan Radix egen sand ligger på 0,0013. Alla fyra nedan har
   samma ton (100°, Radix natural pairing mot guldet) och skiljs bara av kroma.</p>
<p class="lead">Dagens skala hoppar dessutom mellan 106°, 116° och 146°, och fem av tretton
   steg är helt rena. Det är ojämnheten som märks — inte tonen.</p>
<section class="skala">
  <h3>Dagens skala, som referens · 13 steg</h3>
  <div class="rutor">${dagensNeutral}</div>
</section>
${neutralSektioner}

<h2>6. Möjligheten — fullständiga skalor</h2>
<p class="lead">Tolvstegsmodellen är Radix rollindelning: varje steg är en UI-roll, inte en
   godtycklig nyans. Skalorna nedan är genererade i OKLCH runt de befintliga varumärkesfärgerna
   — <strong>ankaret flyttas aldrig</strong>, steg 9 är exakt den kulör appen redan bär.
   Kontrakten under varje skala är samma garantier Radix ger för sina egna.</p>
${forslagSektioner}

<h2>7. Så här är atlasen byggd</h2>
<p class="lead">Tokens läses ur <code>src/styles/tokens/*.css</code>, användningen räknas i
   <code>src/**/*.tsx</code>, mätvärdena beräknas i <code>scripts/lib/farg.mjs</code> och
   skalförslagen genereras i <code>scripts/lib/skala.mjs</code>. Det enda handskrivna är
   auditens fynd i <code>docs/design/farg-atlas.fynd.json</code>.</p>
<p class="lead">Kör <code>npm run atlas</code> för att bygga om. Ändras ett tokenvärde i appen
   följer atlasen med — den kan inte hamna i otakt med koden.</p>
</div>
<script>
  // Respekterar en ev. temaväxlare i värdmiljön utan att kräva en.
  const t = new URLSearchParams(location.search).get('theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
</script>`;
}

// ── Kör ──────────────────────────────────────────────────────────────────────

const modell = byggModell();
const skalor = grupperaSkalor(modell.primitivFarger);
const fynd = JSON.parse(las('docs/design/farg-atlas.fynd.json'));

const forslag = {
  guld: {
    rubrik: 'Guld/amber',
    ankare: '#d4960a',
    not: 'Ankaret är --p-gold-500. Kulörtonen låses till ankarets 78,7° vilket rätar ut brottet i fynd F7 — dagens ljusa steg driver mot 92°. Steg 9 når inte 3:1 mot vit yta; det är en fysisk egenskap hos en mättad gul-orange, inte ett fel i skalan. Behövs guld som UI-yta mot vitt är steg 10 den ljusaste som duger.',
  },
  koppar: {
    rubrik: 'Koppar',
    ankare: '#a3491c',
    not: 'Ankaret är --p-copper-500. Skalan byggs ut från ankaret i stället för från en fast ljushetstabell — Miranons koppar är mörkare än vad ett steg 9 brukar vara, och en fast tabell hade gjort skalan icke-monoton. Mellanbandet som saknas i fynd F8 fylls av stegen 3–8.',
  },
  neutral: {
    rubrik: 'Neutraler',
    ankare: '#6b6b6b',
    not: 'Ankaret är --p-neutral-500. Neutralerna bär omkring 450 av appens färganvändningar — de förtjänar högst upplösning. Nuvarande skala har ett hål på 22 L*-enheter mellan 300 och 400 och tre nästan identiska steg i botten (800/900/1000 ligger inom 5 enheter). OBS: en genererad skala blir kromatiskt neutral, medan dagens neutraler är svagt varma. Den tonen är ett designval som bör fattas medvetet, inte tappas bort i en omräkning.',
  },
  sage: {
    rubrik: 'Sage',
    ankare: '#606b57',
    not: 'Ankaret är --p-green-500, sage-grönt ur Vue-arvet. Rollen --mm-success används 33 gånger och bär bland annat skapa-knappen, men primitiven har idag bara två steg: 100 och 500. Det är den mest använda kulören som helt saknar skala.',
  },
  bla: {
    rubrik: 'Blå',
    ankare: '#4a6b8a',
    not: 'Ankaret är --p-blue-500. Skalan har en konflikt som inte går att räkna bort — se kollisionsnoten under stegen.',
    reserverade: [{ hex: '#1b4965', vad: 'fokusringen (--p-blue-700)' }],
  },
  rod: {
    rubrik: 'Röd',
    ankare: '#a90000',
    not: 'Ankaret är --p-red-500. Bär både fel-tillstånd och kursfärgen RIM 3 — två roller på samma primitiv, vilket är värt att hålla ögonen på om röd ska börja bära fler betydelser.',
  },
};
for (const [namn, data] of Object.entries(forslag)) {
  data.skala = byggSkala(data.ankare, { reserverade: data.reserverade });
  data.kontrakt = provaKontrakt(data.skala);
  data.kollisioner = data.reserverade ? hittaKollisioner(data.skala, data.reserverade) : [];
  const brutna = data.kontrakt.filter((k) => !k.haller).length;
  const kollision = data.kollisioner.length ? `, ${data.kollisioner.length} kollision` : '';
  console.log(
    `  ${namn.padEnd(8)} 12 steg runt ${data.ankare} — ${brutna === 0 ? 'alla kontrakt håller' : `${brutna} kontrakt faller`}${kollision}`,
  );
}

// Neutralernas ton är det enda palettvalet som slår igenom på hela appen — de
// bär omkring 450 användningar.
//
// Mätningen flyttade frågan. Tonvalet spelar nästan ingen roll: 70°, 106° och
// 120° skiljer en till två hexpunkter vid rimlig mättnad. Det som avgör om
// värmen syns är kroma. Dagens neutraler ligger på 0,003 och Radix egen sand på
// 0,0013 — branschen håller tintade gråskalor mycket diskreta, eftersom en
// mättad grå börjar konkurrera med accenten.
//
// Tonen 100° följer Radix natural pairing: välj gråskalan vars ton ligger
// närmast accenten. Guldet sitter på 78,7°, kopparn på 44°, och appens egna
// ljusa steg ligger redan på 106°.
const NEUTRALTON = 100;
const neutralvagar = [
  {
    nyckel: 'ren',
    rubrik: 'Ren — ingen ton alls',
    not: 'Referens. Äkta grå, kulörerna gör allt färgarbete. Risken är att ytorna känns kliniska bredvid guld och koppar.',
    skala: byggSkala('#6b6b6b', { kroma: 0 }),
  },
  {
    nyckel: 'dagens',
    rubrik: 'Dagens nivå — kroma 0,003',
    not: 'Den värme appen har nu, men jämnt fördelad. Dagens ton hoppar mellan 106°, 116° och 146°, och fem av tretton steg är helt rena — det är ojämnheten som märks, inte tonen.',
    skala: byggSkala('#6b6b6b', { kulorton: NEUTRALTON, kroma: 0.003 }),
  },
  {
    nyckel: 'varm',
    rubrik: 'Varm — kroma 0,008 (rekommenderad)',
    not: 'Ungefär dubbelt dagens värme. Märkbart varmare ytor, fortfarande långt under det som skulle läsa som beige. Följer Radix natural pairing mot guldet.',
    skala: byggSkala('#6b6b6b', { kulorton: NEUTRALTON, kroma: 0.008 }),
  },
  {
    nyckel: 'sand',
    rubrik: 'Sand — kroma 0,025',
    not: 'Tydligt varm. Här börjar neutralen läsa som en egen kulör och konkurrera med guldet — Radix varnar uttryckligen för mättade gråskalor av det skälet. Med som ytterlighet så du ser var gränsen går.',
    skala: byggSkala('#6b6b6b', { kulorton: NEUTRALTON, kroma: 0.025 }),
  },
];

const dtcg = byggDtcg(modell, skalor, forslag, fynd, neutralvagar);
writeFileSync(
  join(ROT, 'docs/design/farg-atlas.tokens.json'),
  `${JSON.stringify(dtcg, null, 2)}\n`,
);
writeFileSync(
  join(ROT, 'docs/design/farg-atlas.html'),
  byggHtml(modell, skalor, forslag, fynd, neutralvagar),
);

// Utdata formateras av repots egen formatterare — se npm-scriptet `atlas`, som
// kedjar biome efter generatorn. Genererade filer undantas medvetet INTE från
// husets grindar: ett undantag i konfigen är lättare att lägga till än att ta
// bort, och de växer.

console.log(
  `\n  ${modell.primitivFarger.length} primitiver, ${modell.semantiskaRoller.length} roller, ${modell.temaRoller.length} utilities`,
);
console.log('  → docs/design/farg-atlas.tokens.json');
console.log('  → docs/design/farg-atlas.html');
