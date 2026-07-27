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
import { colorMix, hexTillRgb, matning, oklch, over, textPa } from './lib/farg.mjs';
import { provaKontrakt, STEG_ROLLER } from './lib/skala.mjs';

/**
 * Vad varje primitivgrupp faktiskt ÄR i appen. Gruppnamnet kommer ur
 * tokennamnet och räcker inte: "green — 2 steg" säger ingenting om att det är
 * sage-grönt som bär skapa-knappen och används 33 gånger.
 */
const ETIKETT = {
  'gold\u00a0': 'Guld — primärfärgen',
  'copper\u00a0': 'Koppar — accent och CTA',
  'neutral\u00a0': 'Neutraler — ton 100°, kroma 0,008',
  'sage\u00a0': 'Sage — success och skapa-knappen',
  'blue\u00a0': 'Blå — info och Fjärrskådning. Ankaret flyttat, se F10',
  'red\u00a0': 'Röd — fel',
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

const NAMNGIVNA = { black: '#000000', white: '#ffffff', transparent: 'transparent' };

/**
 * Räknar ut vad en color-mix-deklaration faktiskt ger för färg.
 *
 * Två former förekommer i components.css och de betyder olika saker:
 *   color-mix(in srgb, VAR, black 12%)      → VAR mörknad med tolv procent
 *   color-mix(in srgb, VAR 10%, transparent) → VAR med tio procents opacitet
 *
 * Den andra formen ger alfa och inte en mörkare ton — blandas den i stället
 * mot svart landar man på #110000 där rätt svar är #f6e6e6 över vit yta.
 */
function tolkaMix(varde, alla) {
  if (!varde.startsWith('color-mix')) return null;

  const inre = varde.slice(varde.indexOf('(') + 1, varde.lastIndexOf(')'));
  const delar = inre.split(',').map((d) => d.trim());
  if (delar[0] !== 'in srgb' || delar.length < 3) return null;

  const los = (uttryck) => {
    const m = uttryck.match(/var\(\s*(--[\w-]+)\s*\)/);
    if (m) {
      const v = alla.get(m[1]);
      return v ? losAlias(v, alla) : null;
    }
    const ord = uttryck.replace(/\s*[\d.]+%\s*/, '').trim();
    return NAMNGIVNA[ord] ?? (arHex(ord) ? ord : null);
  };

  const procent = (uttryck) => {
    const m = uttryck.match(/([\d.]+)%/);
    return m ? Number(m[1]) : null;
  };

  const [, forsta, andra] = delar;
  const a = los(forsta);
  const b = los(andra);
  if (!a) return null;

  // Vikten hör till den del som bär procenttalet; saknas den på första delen
  // ligger den på andra, och då är första delens vikt resten.
  const pA = procent(forsta);
  const pB = procent(andra);
  const vikt = pA ?? (pB !== null ? 100 - pB : 50);

  if (b === 'transparent') return { hex: a, alfa: vikt / 100 };
  if (!arHex(a) || !arHex(b)) return null;
  return { hex: colorMix(a, vikt, b).hex, alfa: 1 };
}

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
        // transparent är ett fullgott rollvärde. --mm-border-quiet är
        // transparent i vila per konstruktion, och en roll som filtreras bort
        // för att den saknar hex är en roll atlasen tiger om.
        genomskinlig: lost === 'transparent',
        iTema: Boolean(bas),
        viaVar,
        viaUtility,
        anvandning: viaVar + viaUtility,
      };
    })
    .filter((r) => r.hex || r.beraknad || r.genomskinlig);

  // ── Lager 3 ──
  //
  // Saknades i atlasen tills komponent-kartläggningen. 88 tokens, och de är
  // inte likvärdiga: de som bara alias:ar en roll följer med automatiskt när
  // lager 2 pekas om, medan de som räknar med color-mix gör egen färgmatte på
  // ingångsvärdet. De senare är migreringens verkliga risk.
  const komponentTokens = [...komponent]
    // dialog-width-* är mått, inte färger. Ett token är inte en färg bara för
    // att det bor i samma fil.
    .filter(([namn]) => !/-(width|radius|padding|size|weight)(-|$)/.test(namn))
    .map(([namn, varde]) => {
      const grupp = namn.replace('--mm-', '').split('-')[0];
      const beror = [...varde.matchAll(/var\(\s*(--mm-[\w-]+)\s*\)/g)].map((m) => m[1]);
      const bas = { namn, grupp, varde, beror, anvandning: raknaAnvandning(namn, tsx) };

      const mix = tolkaMix(varde, alla);
      if (mix) return { ...bas, typ: 'mix', ...mix };

      const lost = losAlias(varde, alla);
      if (arHex(lost)) return { ...bas, typ: 'alias', hex: lost.toLowerCase(), alfa: 1 };
      // transparent är ett fullgott värde, inte ett olöst. Fem knappvarianter
      // bygger på det: ytan är genomskinlig och kanten bär identiteten.
      if (lost === 'transparent') return { ...bas, typ: 'transparent', hex: null, alfa: 0 };
      return { ...bas, typ: 'literal', hex: null, alfa: 1 };
    });

  // Utility-namnet Tailwind genererar ur en @theme-post: --color-bg-muted → bg-muted
  const temaRoller = [...tema]
    .filter(([namn]) => namn.startsWith('--color-'))
    .map(([namn, varde]) => {
      const bas = namn.replace('--color-', '');
      return { namn, bas, varde, anvandning: raknaUtility(bas) };
    });

  return { primitivFarger, semantiskaRoller, temaRoller, komponentTokens };
}

/**
 * Vad som händer med varje gammal primitiv vid en migrering.
 *
 * Två mått, inte ett: ljushetsskillnaden avgör om ytan flyttar sig, men den
 * missar helt att en färg byter karaktär vid samma ljushet. Blå är fallet —
 * det nya ankaret ligger 0,5 L*-enheter från det gamla och är ändå en synligt
 * annan blå, eftersom mättnaden är dubblerad. Bara det fulla avståndet fångar
 * det.
 */
function migreringsPaverkan(primitivFarger) {
  const arNy = (n) => /^--p-[a-z]+-([1-9]|1[0-2])$/.test(n);
  const nya = primitivFarger.filter((f) => arNy(f.namn));
  const familj = (n) => {
    const f = n.match(/^--p-([a-z]+)-/)?.[1];
    return f === 'green' ? 'sage' : f;
  };

  return primitivFarger
    .filter((f) => !arNy(f.namn))
    .map((g) => {
      const kandidater = nya.filter((n) => familj(n.namn) === familj(g.namn));
      if (!kandidater.length) return { ...g, mal: null };

      let bast = null;
      for (const n of kandidater) {
        const d = Math.abs(n.cieL - g.cieL);
        if (!bast || d < bast.dL)
          bast = { namn: n.namn, hex: n.hex, dL: d, cieC: n.cieC, cieH: n.cieH };
      }
      // Fullt avstånd i CIE LCh, samma mått som kollisionskontrollen använder
      const dh = (((bast.cieH - g.cieH + 180) % 360) - 180) * 0.5;
      const avstand = Math.hypot(bast.dL, bast.cieC - g.cieC, dh);
      return { ...g, mal: bast, avstand };
    });
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

function byggDtcg(modell, skalor, fynd) {
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

  const komponent = {
    $type: 'color',
    $description:
      'Lager 3 — komponent-tokens. typ=alias följer med när lager 2 pekas om; typ=mix räknar egen färgmatte på ingångsvärdet och är migreringens risk.',
  };
  for (const t of modell.komponentTokens) {
    komponent[t.namn.replace('--mm-', '')] = {
      ...(t.hex ? { $value: dtcgFarg(t.hex) } : {}),
      $description: `${t.namn} → ${t.varde}`,
      $extensions: {
        'se.miranon.atlas': {
          cssVar: t.namn,
          grupp: t.grupp,
          typ: t.typ,
          beror: t.beror,
          alfa: t.alfa,
          anvandning: t.anvandning,
        },
      },
    };
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
      },
    },
    primitiv,
    roll,
    komponent,
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

function byggHtml(modell, skalor, fynd) {
  const nu = new Date().toISOString().slice(0, 10);

  // Skalorna renderas en gång, inte två. Tidigare stod tolvstegsskalorna både
  // som "nuläge" och som "förslag" — samma färger på två ställen med olika
  // status, vilket är precis den sortens motsägelse atlasen finns för att
  // fånga. Rollnamn och kontrakt, som bara fanns i förslagsvyn, följer med hit.
  const renderaSkala = ([grupp, lista]) => {
    const ny = grupp.endsWith(' ');
    const hal = hittaHal(lista);
    const storsta = hal.length ? hal.reduce((a, b) => (b.delta > a.delta ? b : a)) : null;

    const rutor = lista.map((f) =>
      ruta(
        f.hex,
        f.steg ?? f.namn.replace('--p-', ''),
        `<code>${esc(f.hex)}</code>
         ${ny && f.steg ? `<span class="roll">${esc(STEG_ROLLER[f.steg - 1] ?? '')}</span>` : ''}
         <span>L* ${f.cieL.toFixed(1)}</span>
         <span>${f.motVit.toFixed(2)}:1</span>
         <span class="${f.anvandning === 0 ? 'dod' : 'lev'}">${f.anvandning === 0 ? 'oanvänd' : `${f.anvandning}×`}</span>`,
      ),
    );

    let kontraktLista = '';
    if (ny && lista.length === 12) {
      kontraktLista = `<ul class="kontrakt">${provaKontrakt(lista.map((f) => ({ hex: f.hex })))
        .map(
          (k) =>
            `<li class="${k.haller ? 'ok' : 'fel'}"><span>${k.haller ? '✓' : '✗'}</span> ${esc(k.krav)} — <strong>${k.uppmatt.toFixed(2)}</strong> (golv ${k.golv})</li>`,
        )
        .join('')}</ul>`;
    }

    const not = ny
      ? 'Steg 9 är ankaret — den kulör appen redan bär. Kontrakten under är Radix egna garantier, uppmätta.'
      : storsta && storsta.delta > 15
        ? `<strong>Största hål:</strong> ${esc(storsta.fran)} → ${esc(storsta.till)}, ${storsta.delta.toFixed(1)} L*-enheter.`
        : 'Stegen ligger jämnt fördelade.';

    return `${skalRad(`${ETIKETT[grupp] ?? grupp} · ${lista.length} steg`, rutor, not)}${kontraktLista}`;
  };

  const nyaSektioner = [...skalor]
    .filter(([g]) => g.endsWith(' '))
    .map(renderaSkala)
    .join('\n');
  const gamlaSektioner = [...skalor]
    .filter(([g]) => !g.endsWith(' '))
    .map(renderaSkala)
    .join('\n');

  // Lager 3
  const lager3 = { alias: 0, mix: 0, transparent: 0, literal: 0 };
  const rollRakning = new Map();
  for (const t of modell.komponentTokens) {
    lager3[t.typ] = (lager3[t.typ] ?? 0) + 1;
    for (const r of t.beror) rollRakning.set(r, (rollRakning.get(r) ?? 0) + 1);
  }
  lager3.toppRoller = [...rollRakning]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([r, n]) => `<code>${esc(r)}</code> (${n})`)
    .join(', ');

  const komponentRader = modell.komponentTokens
    .map((t) => {
      // Genomskinliga tokens visas mot den yta de faktiskt hamnar på, annars
      // ser de ut som sin egen fullfärg och tabellen ljuger.
      const prov = t.hex ? (t.alfa < 1 ? over(t.hex, t.alfa, '#ffffff') : t.hex) : null;
      return `<tr>
      <td><code>${esc(t.namn)}</code></td>
      <td>${prov ? `<span class="punkt" style="background:${prov}"></span><code>${esc(prov)}</code>${t.alfa < 1 ? ` <span class="delning">alfa ${t.alfa}</span>` : ''}` : `<em>${esc(t.typ)}</em>`}</td>
      <td>${t.typ === 'mix' ? '<strong>mix</strong>' : esc(t.typ)}</td>
      <td>${t.beror.map((r) => `<code>${esc(r)}</code>`).join(' ') || '—'}</td>
      <td><code class="tyst">${esc(t.varde.length > 64 ? `${t.varde.slice(0, 61)}…` : t.varde)}</code></td>
      <td class="${t.anvandning === 0 ? 'dod' : ''}">${t.anvandning || 'oanvänd'}</td>
    </tr>`;
    })
    .join('');

  const migreringsRader = migreringsPaverkan(modell.primitivFarger)
    .map((m) => {
      if (!m.mal)
        return `<tr><td><code>${esc(m.namn)}</code></td><td><span class="punkt" style="background:${m.hex}"></span></td><td colspan="5"><em>ingen ny familj</em></td></tr>`;
      const niva = m.avstand > 5 ? 'fel' : m.avstand > 2.5 ? 'varn' : '';
      const ord = m.avstand > 5 ? 'synlig' : m.avstand > 2.5 ? 'märkbar' : 'försumbar';
      return `<tr>
      <td><code>${esc(m.namn)}</code></td>
      <td><span class="punkt" style="background:${m.hex}"></span><code>${esc(m.hex)}</code></td>
      <td><code>${esc(m.mal.namn)}</code></td>
      <td><span class="punkt" style="background:${m.mal.hex}"></span><code>${esc(m.mal.hex)}</code></td>
      <td>${m.mal.dL.toFixed(1)}</td>
      <td>${m.avstand.toFixed(1)}</td>
      <td class="${niva}">${ord}</td>
    </tr>`;
    })
    .join('');

  // Roller
  const rollRader = modell.semantiskaRoller
    .map(
      (r) => `<tr>
      <td><code>${esc(r.namn)}</code></td>
      <td>${
        r.hex
          ? `<span class="punkt" style="background:${r.hex}"></span><code>${esc(r.hex)}</code>`
          : `<em>${r.genomskinlig ? 'transparent' : 'beräknad'}</em>`
      }</td>
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
  const fyndSektioner = fynd.fynd
    .map(
      (f) => `<article class="fynd ${esc(f.allvar)}">
      <h3><span class="id">${esc(f.id)}</span> ${esc(f.rubrik)} <span class="allvar">${esc(f.allvar)}</span></h3>
      ${f.plats ? `<p class="plats">${f.plats.map((p) => `<code>${esc(p)}</code>`).join(' · ')}</p>` : ''}
      <p>${esc(f.vad)}</p>
      ${f.verifiering ? `<p class="verif"><strong>Verifiering:</strong> ${esc(f.verifiering)}</p>` : ''}
      ${f.foljd ? `<p><strong>Följd:</strong> ${esc(f.foljd)}</p>` : ''}
      ${f.atgard ? `<p class="atgard"><strong>Löst:</strong> ${esc(f.atgard)}</p>` : ''}
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
  .fynd .atgard { border-left: 3px solid var(--ok); padding-left: .7rem; }
  .fynd.löst { border-left-color: var(--ok); opacity: .85; }
  .fynd.löst .allvar { color: var(--ok); }
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
  <p class="lead">Miranon Media Admins palett, mätt och renderad ur <code>src/</code> — inte
     skriven för hand. Sex tolvstegsskalor ligger i appen som material; rollerna pekar
     ännu på den gamla paletten.</p>
  <p class="meta">Byggd ${nu} · ${modell.primitivFarger.length} primitiver ·
     ${modell.semantiskaRoller.length} roller · ${modell.komponentTokens.length} komponent-tokens · ${modell.temaRoller.length} utilities</p>
</header>

<h2>1. Paletten</h2>
<p class="lead">Sex skalor om tolv steg enligt Radix rollindelning: varje steg är en UI-roll,
   inte en godtycklig nyans. Genererade i OKLCH därför att lika stora ljushetssteg där också
   ser lika stora ut. <strong>Steg 9 är ankaret</strong> — den kulör appen redan bär — och det
   är flyttat i exakt en skala: blå, av skäl som står i fynd F10.</p>
<p class="lead">Skalorna finns i <code>primitives.css</code> men ingen roll pekar på dem ännu.
   Migreringen är ett eget beslut; det som står här är materialet, färdigt att väljas ur.</p>
${nyaSektioner}

<h2>2. Den gamla paletten — utgående</h2>
<p class="lead">Vad appens roller faktiskt pekar på idag. Ersätts av skalorna ovan när
   migreringen görs. Kolumnen längst ner i varje ruta visar hur många gånger tokenet
   används.</p>
${gamlaSektioner}

<h2>3. Semantiska roller</h2>
<p class="lead">Lager 2. Kolumnen <em>i @theme</em> visar om rollen är exponerad som
   Tailwind-utility eller bara nåbar via <code>var()</code> — de två konsumtionsvägarna i fynd F2.</p>
<div class="tabellyta"><table>
  <thead><tr><th>Roll</th><th>Löser till</th><th>Definition</th><th>i @theme</th><th>Användning</th></tr></thead>
  <tbody>${rollRader}</tbody>
</table></div>
<ul class="noter">
  <li><strong>${doda.length}</strong> primitiver är oanvända: ${doda.map((d) => `<code>${esc(d.namn)}</code>`).join(', ') || '—'}
      <em>(de nya skalorna ligger här tills rollerna migreras)</em></li>
  <li><strong>${dodaRoller.length}</strong> roller är oanvända: ${dodaRoller.map((d) => `<code>${esc(d.namn)}</code>`).join(', ') || '—'}</li>
  <li><strong>${utilityDoda.length}</strong> av ${modell.temaRoller.length} <code>@theme</code>-utilities används aldrig i TSX
      (flera lever ändå via <code>var()</code> i CSS-lagret)</li>
</ul>

<h2>4. Komponent-tokens — lager 3</h2>
<p class="lead">Det lager som ligger mellan rollerna och komponenterna. Kolumnen <em>typ</em>
   avgör vad som händer vid en migrering: <strong>alias</strong> följer med automatiskt när
   lager 2 pekas om, medan <strong>mix</strong> räknar egen färgmatte på ingångsvärdet och
   därför kan bete sig annorlunda när ingången byter mättnad eller ljushet.</p>
<ul class="noter">
  <li><strong>${lager3.alias}</strong> rena alias · <strong>${lager3.mix}</strong> color-mix ·
      <strong>${lager3.transparent}</strong> transparent · <strong>${lager3.literal}</strong> literala</li>
  <li>Roller som matar flest komponent-tokens: ${lager3.toppRoller}</li>
</ul>
<div class="tabellyta"><table>
  <thead><tr><th>Token</th><th>Färg</th><th>Typ</th><th>Beror på</th><th>Definition</th><th>Anv.</th></tr></thead>
  <tbody>${komponentRader}</tbody>
</table></div>

<h2>5. Migreringens påverkan</h2>
<p class="lead">Vad som händer med varje gammal primitiv om rollerna pekas om. <strong>ΔL*</strong>
   är ljushetsskillnaden — den avgör om ytan flyttar sig. <strong>Avstånd</strong> är det fulla
   perceptuella måttet och fångar också när en färg byter karaktär vid samma ljushet.</p>
<div class="tabellyta"><table>
  <thead><tr><th>Gammal</th><th></th><th>Närmast ny</th><th></th><th>ΔL*</th><th>Avstånd</th><th>Bedömning</th></tr></thead>
  <tbody>${migreringsRader}</tbody>
</table></div>
<ul class="noter">
  <li><strong>Fokusringen migreras inte.</strong> <code>--p-blue-700</code> står i tabellen
      eftersom den är en gammal primitiv, men den är exklusiv per
      <code>lessons.md:298</code> och ska behålla <code>#1B4965</code>. En migrering som
      pekar om den bryter fynd F10:s lösning.</li>
  <li><code>--p-blue-500</code> → <code>--p-blue-9</code> är ingen mappning utan en avsiktlig
      färgändring (fynd F10). Ljushetsskillnaden är liten, avståndet stort.</li>
</ul>

<h2>6. Vad som håller</h2>
<ul class="rent">${rentRader}</ul>

<h2>7. Brister</h2>
${fyndSektioner}

<h2>8. Så här är atlasen byggd</h2>
<p class="lead">Tokens läses ur <code>src/styles/tokens/*.css</code>, användningen räknas i
   <code>src/</code>, mätvärdena beräknas i <code>scripts/lib/farg.mjs</code> och skalorna
   genereras i <code>scripts/lib/skala.mjs</code>. Det enda handskrivna är auditens fynd i
   <code>docs/design/farg-atlas.fynd.json</code>.</p>
<p class="lead"><code>npm run atlas</code> bygger om, formaterar och kör
   <code>scripts/verifiera-farg-atlas.mjs</code> — drygt tusen kontroller som prövar varje
   påstående här mot källkoden med egen, oberoende matematik. Atlasen kan inte tyst glida
   isär från appen.</p>
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

const dtcg = byggDtcg(modell, skalor, fynd);
writeFileSync(
  join(ROT, 'docs/design/farg-atlas.tokens.json'),
  `${JSON.stringify(dtcg, null, 2)}\n`,
);
writeFileSync(join(ROT, 'docs/design/farg-atlas.html'), byggHtml(modell, skalor, fynd));

// Utdata formateras av repots egen formatterare — se npm-scriptet `atlas`, som
// kedjar biome efter generatorn. Genererade filer undantas medvetet INTE från
// husets grindar: ett undantag i konfigen är lättare att lägga till än att ta
// bort, och de växer.

console.log(
  `\n  ${modell.primitivFarger.length} primitiver, ${modell.semantiskaRoller.length} roller, ${modell.komponentTokens.length} komponent-tokens, ${modell.temaRoller.length} utilities`,
);
console.log('  → docs/design/farg-atlas.tokens.json');
console.log('  → docs/design/farg-atlas.html');
