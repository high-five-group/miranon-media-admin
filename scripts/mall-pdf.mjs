#!/usr/bin/env node
// scripts/mall-pdf.mjs — LOKAL PDF-loop för bilage-mallarna. Mall → PDF på
// disk på ~5 sekunder, utan Edge Function-deploy och utan staging.
//
// ═══ VARFÖR DEN FINNS ═══
//
// Fram till 2026-08-27 fanns ingen lokal väg att SE en renderad PDF. Kedjan
// gick: ändra CSS → synka mallen till EF-lagret → `supabase functions deploy`
// till staging → anropa funktionen → hämta PDF → mät. Deployen ensam kostar
// 30–60 s, och varje mätpunkt krävde ett helt varv.
//
// Mätt utfall av den formen: `generate-event-attachment` gick från v37 till
// v49 under EN mätserie 2026-08-26 — tolv deploys av en molnfunktion för att
// titta på tolv PDF:er. En mall-ändring kostade ~45 minuter i stället för
// sekunder, och Marcus ifrågasatte med rätta hela arbetssättet:
//
//   "VARFÖR tar det sådan tid att fixa PDF:er? Håller proffs också på så här
//   där varje liten trivial ändring i en PDF ska ta 30-45 min?"
//
// Svaret var nej. DocRaptor är ett vanligt HTTP-API — samma anrop som
// supabase/functions/_shared/mall-render.ts gör kan göras härifrån. Alla
// bitar fanns redan (render-bilage-mall.mjs fyller mallen,
// docraptor-sjalvbarande.mjs bakar in CSS/typsnitt/bilder, nyckeln ligger i
// .env.docraptor); det som saknades var limmet mellan dem. Ironiskt nog
// hänvisade docraptor-sjalvbarande.mjs redan i sin egen filkommentar till
// "scripts/docraptor-minimaltest.mjs" — en fil som aldrig byggdes. Denna fil
// ÄR den saknade biten, byggd som verktyg i stället för som engångstest.
//
// Detta är fas 1 i diagnos-disciplinen (`marcus-system:diagnosing-bugs`):
// bygg en tät, röd-kapabel återkopplingsslinga FÖRE du försöker lösa något.
// För PDF-spåret hoppades det steget över, och kostnaden blev synlig först
// när någon räknade deployarna.
//
// ═══ SKILLNAD MOT DEN SKARPA VÄGEN — LÄS INNAN DU LITAR PÅ ETT UTFALL ═══
//
// Skriptet renderar ALLTID i DocRaptors test-läge (`test: true`): gratis,
// men PDF:en bär en vattenstämpel. Stämpeln ritas OVANPÅ innehållet och
// påverkar varken sidbrytning eller geometri — mätningarna nedan är därför
// giltiga. Vill du se en PDF utan stämpel går det via den skarpa vägen
// (staging-EF:en), som förut.
//
// Fixturen renderas DIREKT genom Eta av render-bilage-mall.mjs, vilket
// bypassar byggBekraftelseData/byggDeltagarinfoData i EF-lagret. Syftet här
// är att bevisa MALLEN + LAYOUTEN, inte hela resolutionskedjan — samma
// avgränsning som render-bilage-mall.mjs själv gör och motiverar.
//
// ═══ NODE ÄR INTE DENO — EN MÄTT FÄLLA ═══
//
// EF-koden postar till `https://${apiKey}@api.docraptor.com/docs`. Den formen
// fungerar i Deno men KASTAR i Node (undici):
//
//   TypeError: Request cannot be constructed from a URL that includes
//   credentials
//
// Node kräver en Basic-auth-header i stället — DocRaptor tar nyckeln som
// användarnamn med tomt lösenord. Kopiera alltså inte EF:ens anrop rakt av.
//
// ═══ ANVÄNDNING ═══
//
//   npm run mall:pdf -- bekraftelsebilaga
//   npm run mall:pdf -- bekraftelsebilaga --watch     # regenererar vid varje sparning
//   npm run mall:pdf -- deltagarinformation --data egen.json
//   npm run mall:pdf -- bekraftelsebilaga --oppna     # öppnar PDF:en när den är klar
//
// Utdata: test-results/mall-pdf/<mall>.pdf (gitignorerad katalog).
//
// Nyckeln läses ur .env.docraptor via npm-skriptets --env-file-if-exists.
// Den maskeras i ALL utdata härifrån — ett DocRaptor-felsvar kan eka tillbaka
// delar av anropet, och en nyckel som passerar en logg är en nyckel som måste
// roteras.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gorSjalvbarande } from './docraptor-sjalvbarande.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPOROT = join(__dirname, '..');
const MALLROT = join(REPOROT, 'docs', 'mallar', 'bilagor');
const UTROT = join(REPOROT, 'test-results', 'mall-pdf');
const KANDA_MALLAR = ['bekraftelsebilaga', 'deltagarinformation', 'kvitto'];

const DOCRAPTOR_URL = 'https://api.docraptor.com/docs';
const TIMEOUT_MS = 60_000;
/*
 * Även de lokala processanropen tidsbegränsas. Verktygets hela syfte är en
 * TÄT slinga — ett anrop som hänger utan gräns motsäger det, och en hängning
 * är inget felmeddelande (samma felklass som `supabase link` utan styrd
 * stdin, se scripts/fas4-prod-deploy.sh). Fångad av review-grinden på #2019.
 */
const PROCESS_TIMEOUT_MS = 30_000;

/** Maskerar nyckeln i valfri text. Anropas på ALLT som skrivs ut. */
function maskera(text, nyckel) {
  if (!nyckel) return String(text);
  return String(text).replaceAll(nyckel, '<DOCRAPTOR_API_KEY>');
}

function larsArgv() {
  const args = process.argv.slice(2);
  const mall = args.find((a) => !a.startsWith('--'));
  const flagga = (namn) => {
    const i = args.indexOf(`--${namn}`);
    return i === -1 ? undefined : (args[i + 1] ?? true);
  };
  return {
    mall,
    watch: args.includes('--watch'),
    oppna: args.includes('--oppna'),
    data: typeof flagga('data') === 'string' ? flagga('data') : undefined,
  };
}

/** Steg 1 — fyll mallen med fixturdata (återanvänder befintligt skript). */
function fyllMall(mall, data) {
  const argv = [join(__dirname, 'render-bilage-mall.mjs'), mall];
  if (data) argv.push('--data', data);
  const r = spawnSync(process.execPath, argv, {
    encoding: 'utf8',
    timeout: PROCESS_TIMEOUT_MS,
  });
  if (r.error?.code === 'ETIMEDOUT') {
    throw new Error(`render-bilage-mall.mjs svarade inte inom ${PROCESS_TIMEOUT_MS} ms`);
  }
  if (r.status !== 0) {
    throw new Error(`render-bilage-mall.mjs föll (exit ${r.status}):\n${r.stderr || r.stdout}`);
  }
  return join(MALLROT, `${mall}.granskning.html`);
}

/** Steg 3 — posta till DocRaptor. Basic auth, ALDRIG credentials i URL:en. */
async function postaTillDocRaptor(html, namn, nyckel) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(DOCRAPTOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${nyckel}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        test: true,
        document_type: 'pdf',
        document_content: html,
        name: namn,
        javascript: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`DocRaptor svarade ${res.status}: ${maskera(text, nyckel).slice(0, 600)}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Steg 4 — mät PDF:en. Sidantalet är HUVUDMÅTTET: kravet på
 * bekräftelsebilagan är EN sida oavsett hur lång kursbeskrivningen är
 * (Marcus, 2026-08-27: "Jag vill ha allt på en sida, punkt!").
 *
 * Textens ytterkanter mäts via `pdftotext -bbox`, som ger koordinater i
 * punkter med origo i sidans ÖVRE vänstra hörn. Det säger var innehållet
 * faktiskt börjar och slutar — nog för att se om en sida har marginal kvar
 * eller ligger på kanten.
 */
function matPdf(pdfPath) {
  const info = spawnSync('pdfinfo', [pdfPath], {
    encoding: 'utf8',
    timeout: PROCESS_TIMEOUT_MS,
  });
  const sidor = Number((info.stdout.match(/^Pages:\s+(\d+)/m) ?? [])[1] ?? 0);
  const sidhojdPt = Number((info.stdout.match(/^Page size:\s+[\d.]+ x ([\d.]+)/m) ?? [])[1] ?? 0);

  const bbox = spawnSync('pdftotext', ['-bbox', pdfPath, '-'], {
    encoding: 'utf8',
    timeout: PROCESS_TIMEOUT_MS,
  });
  const sidor_ = [
    ...bbox.stdout.matchAll(/<page width="[\d.]+" height="([\d.]+)">([\s\S]*?)<\/page>/g),
  ];
  const perSida = sidor_.map((m, i) => {
    const ord = [...m[2].matchAll(/yMin="([\d.]+)"[^>]*yMax="([\d.]+)"/g)];
    if (ord.length === 0) return { sida: i + 1, tom: true };
    const yMin = Math.min(...ord.map((o) => Number(o[1])));
    const yMax = Math.max(...ord.map((o) => Number(o[2])));
    return {
      sida: i + 1,
      tom: false,
      textTopp_mm: +((yMin / 72) * 25.4).toFixed(2),
      textBotten_mm: +((yMax / 72) * 25.4).toFixed(2),
      bottenmarginal_mm: +(((Number(m[1]) - yMax) / 72) * 25.4).toFixed(2),
      ord: ord.length,
    };
  });
  return { sidor, sidhojd_mm: +((sidhojdPt / 72) * 25.4).toFixed(1), perSida };
}

async function kor({ mall, data, oppna, nyckel }) {
  const t0 = Date.now();
  const htmlPath = fyllMall(mall, data);
  const tFyll = Date.now();

  const html = await gorSjalvbarande(htmlPath);
  const tBaka = Date.now();

  const pdf = await postaTillDocRaptor(html, `mall-pdf-${mall}`, nyckel);
  const tRender = Date.now();

  mkdirSync(UTROT, { recursive: true });
  const pdfPath = join(UTROT, `${mall}.pdf`);
  writeFileSync(pdfPath, pdf);

  const matt = matPdf(pdfPath);

  const krav1Sida = mall === 'bekraftelsebilaga';
  const ok = !krav1Sida || matt.sidor === 1;
  console.log(
    `\n${ok ? '✅' : '❌'} ${mall} — ${matt.sidor} sida${matt.sidor === 1 ? '' : 'r'}` +
      (krav1Sida && matt.sidor !== 1 ? '  ← KRAVET ÄR EN SIDA' : ''),
  );
  for (const s of matt.perSida) {
    if (s.tom) {
      console.log(`   sida ${s.sida}: (ingen text)`);
      continue;
    }
    console.log(
      `   sida ${s.sida}: text ${s.textTopp_mm}–${s.textBotten_mm} mm` +
        `  ·  ${s.bottenmarginal_mm} mm kvar under  ·  ${s.ord} ord`,
    );
  }
  console.log(
    `   ${((tFyll - t0) / 1000).toFixed(1)}s fyll · ` +
      `${((tBaka - tFyll) / 1000).toFixed(1)}s baka in · ` +
      `${((tRender - tBaka) / 1000).toFixed(1)}s DocRaptor · ` +
      `${((Date.now() - t0) / 1000).toFixed(1)}s totalt`,
  );
  console.log(`   ${pdfPath}`);

  if (oppna) spawnSync('open', [pdfPath], { timeout: PROCESS_TIMEOUT_MS });
  return ok;
}

async function main() {
  const { mall, watch: watchLage, oppna, data } = larsArgv();

  if (!mall || !KANDA_MALLAR.includes(mall)) {
    console.error(
      `Användning: npm run mall:pdf -- <${KANDA_MALLAR.join('|')}> [--watch] [--oppna] [--data fil.json]`,
    );
    process.exit(2);
  }

  const nyckel = process.env.DOCRAPTOR_API_KEY;
  if (!nyckel) {
    console.error(
      'DOCRAPTOR_API_KEY saknas.\n' +
        'Nyckeln läses ur .env.docraptor i repo-roten (gitignorerad).\n' +
        'Kör via npm-skriptet så laddas den automatiskt: npm run mall:pdf -- <mall>',
    );
    process.exit(2);
  }

  const ok = await kor({ mall, data, oppna, nyckel }).catch((e) => {
    console.error(`\n❌ ${maskera(e.message, nyckel)}`);
    return false;
  });

  if (!watchLage) process.exit(ok ? 0 : 1);

  // ── Watch-läget: den täta slingan. Spara en fil → ny PDF på ~5 s. ──
  const bevakade = [
    join(MALLROT, `${mall}.html`),
    join(MALLROT, 'bilaga-delad.css'),
    join(MALLROT, 'kvitto.css'),
    data ? resolve(data) : join(MALLROT, 'fixtures', `${mall}.exempel.json`),
  ].filter((f) => existsSync(f));

  console.log(`\n👀 Bevakar (Ctrl+C avslutar):`);
  for (const f of bevakade) console.log(`   ${f.replace(REPOROT + '/', '')}`);

  let kor_ = false;
  let igen = false;
  const trigga = async () => {
    if (kor_) {
      igen = true;
      return;
    }
    kor_ = true;
    await kor({ mall, data, oppna: false, nyckel }).catch((e) =>
      console.error(`\n❌ ${maskera(e.message, nyckel)}`),
    );
    kor_ = false;
    if (igen) {
      igen = false;
      await trigga();
    }
  };

  let avstudsning;
  for (const f of bevakade) {
    watch(f, () => {
      clearTimeout(avstudsning);
      avstudsning = setTimeout(trigga, 150);
    });
  }
}

await main();
