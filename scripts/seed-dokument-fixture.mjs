#!/usr/bin/env node
// scripts/seed-dokument-fixture.mjs — skapar OCH städar de PERMANENTA
// DEMO-BILAGORNA på Dokument-ytan (/mer/dokument) i staging: fyra korta,
// realistiska filnamn som visar upp räckviddsdimensionen (ADR-118) i sina
// fyra former, så ytan går att granska och designa mot.
//
// VARFÖR SKRIPTET FINNS: Dokument-ytan visade i staging sex rader av formen
// `ZZ-attachment-test-<uuid>.pdf` — 59 tecken var, varav 36 är ett UUID.
// Marcus 2026-08-17: "Kan du göra filnamnen kortare nu, de är ju orimligt
// långa, så långa kommer de ju inte vara i verkligheten." De sex raderna är
// TESTSVITENS sentineler (`sentinelFilnamn()` i fem `.staging.test.ts`-filer)
// och UUID:t är deras anti-kollisionsmekanism — att korta DEM är avvisat.
// Vägen är i stället EGNA demo-rader vid sidan av testernas namnrymd.
// Marcus svar på livslängdsfrågan, verbatim: "Demo-rader blir väl bra?"
// ⇒ PERMANENTA rader, alltså SKYDDAD klass (se § SKYDDET MOT PURGEN).
//
// Kör:
//   npm run seed:dokument -- --dry-run   # planera, skriv inget
//   npm run seed:dokument                # skapa de fyra (idempotent)
//   npm run seed:dokument:clean          # radera de fyra
//   npm run seed:dokument:clean -- --dry-run
//   npm run seed:dokument -- --event recXXXXXXXXXXXXXX   # annat ankar-event
//
// ═══ VÄGEN GÅR GENOM upload-attachment-EF:en, ALDRIG MOT AIRTABLE ═══
// En direkt Airtable-skrivning ger en Bilagor-rad UTAN Storage-objekt och
// utan `Lagringsnyckel` — exakt den trasiga legacy-formen
// `delete-attachment/index.ts` bokför ("legacy-rader från FÖRE TASK-147.5
// kan sakna fältet"). En sådan rad renderar trasigt i förhandsvisningen och
// går inte att ladda ner, alltså raka motsatsen till vad en demo-rad är till
// för. Skriptet bär därför INGEN Airtable-token alls: allt går via de
// skarpa EF:erna (`upload-attachment`, `get-event-attachments`,
// `delete-attachment`) med en vanlig user-JWT — samma väg appen själv tar,
// och EF-only-gränsen (ADR-060 punkt 2+4) hålls automatiskt.
//
// Creds läses ur .env.test (TEST_SUPABASE_URL/ANON_KEY/USER_EMAIL/PASSWORD),
// laddad av npm-skriptet via `node --env-file-if-exists=.env.test` — INTE ur
// .env.seed, som bär Airtable-token skriptet varken har eller behöver.
//
// ═══ MARKÖREN: `Demo - `, OCH VARFÖR JUST DEN ═══
// Varje demo-rad bär prefixet `Demo - ` i sitt `Namn`. Tre krav möttes:
//
//   (a) INGEN KOLLISION med någon annan namnrymd i basen. Testsviten äger
//       `ZZ-attachment-test-<uuid>.pdf`, generatorn äger
//       `Deltagarinformation – …`. `Demo - ` överlappar ingendera, och
//       purge-kollisionsvakten nedan BEVISAR det mekaniskt vid varje körning
//       i stället för att lita på att den som läser policyn minns den.
//   (b) IGENKÄNNBART SOM DEMO-DATA. Raden syns i den yta Lotta ska använda
//       skarpt; en demo-rad som utger sig för att vara ett riktigt dokument
//       är värre än en lång fil.
//   (c) KORT. Sju tecken. Namnen landar på 17–24 tecken mot dagens 59.
//
// VARFÖR INTE `ZZ-`, husets vanliga sentinel-prefix: Marcus 2026-08-10
// (TASK-97, citerad verbatim i seed-review-fixture.mjs § DATAN SKA LIKNA
// VERKLIGHETEN) — "det ska vara fiktiva namn och adresser, men det ska
// likna verkligheten, inte massa ZZ-skit överallt". Granskningsdata som ser
// ut som skräp går inte att designa mot; det var hela poängen med att byta
// bort `ZZ-GRANSKNING-NN` som ort.
//
// VARFÖR MARKÖREN INTE KAN GÖMMAS I ETT ANNAT FÄLT (som seed:review gömmer
// sin i eventets `Notering`): Bilagor har inget fritextfält —
// `Namn` · `Storlek (bytes)` · `Skapad` · `Event` · `Lagringsnyckel` ·
// `Dokumentklass` · `Räckvidd` · `Kursfamilj` · `Kursnivå`
// (docs/reference/data-model.md rad 148 + 177 + 244–246) — och
// upload-attachment skriver bara de fält dess egen allowlist tillåter.
// `Namn` är alltså den ENDA identitetsbäraren på denna väg.
//
// ═══ FILNAMNEN ÄR ASCII, OCH DET ÄR MÄTT — INTE EN STILPREFERENS ═══
// `sanitizeFilnamn` (_shared/attachments.ts) släpper igenom å/ä/ö och
// en-dash rakt in i Storage-nyckeln: leafen är
// `<attachmentId>-<sanitizeFilnamn(filnamn)>`. Supabase Storage AVVISAR den
// nyckeln. Mätt skarpt mot staging 2026-08-17 (två anrop, samma minut, allt
// annat identiskt):
//
//   filnamn `ZZ-prov ä – nyckel.pdf`     → 502
//     "Uppladdningen misslyckades: Invalid key:
//      alla-event/<uuid>-ZZ-prov ä – nyckel.pdf. Prova igen."
//   filnamn `ZZ-prov ascii nyckel.pdf`   → 201 (raden städad direkt efteråt)
//
// Det utvidgar repots befintliga RÖTT-FÖRST-BELÄGG (TASK-275.3, citerat i
// `_shared/attachments.ts` § buildStorageAnchor), som gällde ANKAR-segmentet
// (`kurstyp/Fjärrskådning` → "Invalid key") och löstes med `KURSFAMILJ_SLUG`.
// LEAF-segmentet har ingen motsvarande slug — och husets egen generator
// kringgår det tyst genom att skriva en ASCII-leaf
// (`…-deltagarinformation.pdf`) under ett display-namn som bär både `–` och
// `å` (mätt i staging: Bilagor recULHiYUS05h0X9A).
//
// KONSEKVENSEN ÄR STÖRRE ÄN DETTA SKRIPT och ligger utanför dess yta:
// Lotta kan i dag inte ladda upp `Vägbeskrivning.pdf` — hon får 502 och
// "Prova igen", ett råd som aldrig kan hjälpa. Bokfört som fynd, INTE löst
// här (fixen bor i `_shared/attachments.ts`).
//
// ═══ SKYDDET MOT PURGEN UTTRYCKS GENOM FRÅNVARO AV TARGET ═══
// `.purge-staging-policy.json` är en ren ALLOWLIST: `purge-staging-
// sentinels.mjs` itererar `policy.targets` och rör ingenting utanför dem.
// Det finns ingen "protected"-lista att skriva in sig i — skyddet ÄR att
// inget target matchar. Samma klass som `ZZ-GRANSKNING-*` (CLAUDE.md
// § Granskningsdata i staging: "`ZZ-GRANSKNING-*` får ALDRIG bli purge-bar")
// och samma domslut som seed-review-fixture.mjs skriver ut verbatim:
//
//   "SKYDDSRÄCKE 2 ÄR OFÖRÄNDRAT OCH SKA FÖRBLI DET: en granskningsfixtur
//    får ALDRIG bli purge-bar. Att lösa livstidsfrågan med en target i
//    .purge-staging-policy.json vore att riva skyddet, inte att laga det"
//
// ⚠️  DEMO-RADERNA HÖR TILL DEN KLASSEN, INTE TILL SENTINEL-KLASSEN. Ser du
// en kvarlämnad demo-rad: kör `npm run seed:dokument:clean`. Lös den ALDRIG
// med ett target i purge-policyn — det river skyddet i stället för att laga
// något, och setup-purgen kör före varje staging-CI-jobb.
//
// Att frånvaron faktiskt HÅLLER är mekaniserat, inte antaget:
// `purgeCollisions()` nedan korsläser den SKARPA policyn vid varje körning
// och fäller om något target skulle kunna matcha ett demo-namn. Formen är
// seed-review-fixture.mjs § skyddsräcke 2, samma funktion i sak.
//
// ═══ LIVSTID: PERMANENT, MED FLIT ═══
// seed:review stämplar ett utgångsdatum och sveper bort det som passerat
// (TASK-95). Demo-raderna gör INTE det: Marcus beslut var permanenta rader,
// och en yta som töms av sig själv är en yta ingen kan granska nästa vecka.
// Enda vägen bort är `--clean` — ett aktivt beslut, aldrig en tidsautomat.
//
// ═══ SKYDDSRÄCKEN (alla hårda, i denna ordning) ═══
//   1. Register-guard: de fyra posterna prövas mot sitt eget kontrakt
//      (markör, ASCII, längd, räckvidds-kombinationer) innan något annat.
//   2. Prod-guard: TEST_SUPABASE_URL måste bära STAGING-refen och får inte
//      bära PROD-refen. Båda värdena LÄSES ur .prod-ref-policy.conf —
//      aldrig en tredje kopia i den här filen. Positiv allowlist, inte bara
//      en negativ spärr: en tom eller okänd URL faller också.
//   3. Purge-kollisionsvakt: se § SKYDDET MOT PURGEN ovan.
//   4. Staging-preflight (kravStagingLedigt): efter guard- och env-
//      kontrollerna, före första nätverksanropet. Gäller även --dry-run,
//      som läser basen via get-event-attachments.
//   5. Idempotens: en post vars namn+räckvidd redan finns skapas ALDRIG om.
//      Kör skriptet två gånger och basen ser likadan ut.
//   6. Clean är EXAKT-MATCHAD mot registret, aldrig en prefix-svepning: en
//      rad raderas bara om dess namn är ETT av de fyra. Markören är ANDRA
//      spärr, aldrig den bärande — samma riktning som seed-review-fixture
//      .mjs:s e-postmönster efter TASK-97.
//
// Exit: 0 = OK, 1 = guard-/argument-/env-fel, 2 = API-fel.

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

/** Prefixet varje demo-rad bär i sitt `Namn`. Se § MARKÖREN i filhuvudet. */
export const MARKOR = 'Demo - ';

/** Taket för ett demo-namn. Dagens sentineler är 59 tecken — det är klagomålet. */
export const MAX_NAMNLANGD = 26;

/**
 * Storage-nyckelns tillåtna teckenklass, MÄTT (se filhuvudet § FILNAMNEN ÄR
 * ASCII). Medvetet snävare än vad Supabase kan tänkas acceptera: den täcker
 * exakt det de fyra namnen behöver, och en framtida post som vill mer måste
 * mäta först i stället för att anta.
 */
const ASCII_FILNAMN = /^[A-Za-z0-9 ._-]+$/;

const REC_ID = /^rec[A-Za-z0-9]{14}$/;

const CONFIG = {
  /**
   * Ankar-eventet för den EVENT-räckviddiga posten.
   *
   * `recIFrxHZw165ycXk` = den PERMANENTA beläggnings-fixturen
   * (`ZZ-belaggning-fixtur`, Kursfamilj `Fjärrskådning`, ingen Kursnivå).
   * Tre skäl, inget av dem bekvämlighet:
   *   · Den är PERMANENT och skyddad — den står i seed-review-fixture.mjs
   *     CONFIG.protectedRecordIds och bär själv "STÄDA INTE bort den" i sin
   *     Notering. En demo-rad hängd på ett städbart event blir en trasig
   *     länk nästa gång fixturen städas.
   *   · Samma precedent testsviten redan följer (upload-attachment
   *     .staging.test.ts § ATTACH-MÅL, create-event-note.staging.test.ts).
   *   · Dess Kursfamilj är `Fjärrskådning`, samma som Kurstyp-posterna
   *     nedan — så väljer man eventet på Dokument-ytan syns unionen
   *     (ADR-118 beslut 2) i arbete, inklusive tom-nivå-regeln: posten utan
   *     nivå matchar, posten med `Nivå 1` gör det inte (eventet saknar nivå).
   */
  ankarEventId: 'recIFrxHZw165ycXk',

  /**
   * REGISTRET ÄR SLUTET — fyra poster, inga mönster från kommandoraden.
   * Samma disciplin som seed-review-fixture.mjs CONFIG.legacy: det som kan
   * raderas av ett skript ska stå uppräknat i skriptet.
   *
   * Räckvidderna är valda så badgen (RackviddBadge.tsx) syns i ALLA sina
   * former: `Alla event` · `Kurstyp` med familj OCH nivå · `Kurstyp` med
   * bara familj (tom nivå = hela familjen, ADR-118 beslut 1) · `Event`.
   */
  poster: [
    {
      namn: 'Demo - Villkor.pdf',
      rackvidd: 'Alla event',
      rubrik: 'Deltagarvillkor',
      beskrivning: 'Gäller alla event.',
    },
    {
      // FAMILJEN MÅSTE VARA RIM HÄR, inte Fjärrskådning. `KURSFAMILJ_MED_NIVAER`
      // (DokumentYta.tsx / _shared/attachments.ts) innehåller ENBART 'RIM' —
      // Fjärrskådning och Psionautics är NIVÅLÖSA familjer, och ADR-118
      // beslut 1 säger att de "lämnar alltid nivån tom, samma regel som
      // eventen". En demo-rad med Fjärrskådning + Nivå 1 hade alltså varit
      // data som bryter mot vår egen domänregel — fångat i dry-run innan
      // något skrevs.
      namn: 'Demo - Upplagg.pdf',
      rackvidd: 'Kurstyp',
      kursfamilj: 'RIM',
      kursniva: 'Nivå 1',
      rubrik: 'Upplägg',
      beskrivning: 'RIM, steg 1.',
    },
    {
      namn: 'Demo - Materiallista.pdf',
      rackvidd: 'Kurstyp',
      kursfamilj: 'Fjärrskådning',
      rubrik: 'Materiallista',
      beskrivning: 'Hela familjen Fjärrskådning — alla nivåer.',
    },
    {
      namn: 'Demo - Schema.pdf',
      rackvidd: 'Event',
      medEvent: true,
      rubrik: 'Schema',
      beskrivning: 'Gäller bara detta event.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Pura funktioner
// ---------------------------------------------------------------------------

/**
 * Skyddsräcke 1: registret prövas mot sitt eget kontrakt FÖRE något annat.
 * Kastar vid fel — en trasig post ska aldrig nå ett nätverksanrop.
 */
export function validateRegister(config) {
  const poster = config?.poster;
  if (!Array.isArray(poster) || poster.length === 0) {
    throw new Error('registret är tomt — inget att skapa');
  }
  if (!REC_ID.test(config.ankarEventId ?? '')) {
    throw new Error(`ankarEventId "${config.ankarEventId}" är inte rec-formad`);
  }
  const sedda = new Set();
  for (const post of poster) {
    const { namn, rackvidd, kursfamilj, kursniva, medEvent } = post;
    if (typeof namn !== 'string' || !namn.startsWith(MARKOR)) {
      throw new Error(`"${namn}" saknar demo-markören "${MARKOR}"`);
    }
    if (!namn.endsWith('.pdf')) {
      throw new Error(`"${namn}" måste sluta på .pdf (EF:en tar bara PDF)`);
    }
    if (namn.length > MAX_NAMNLANGD) {
      throw new Error(
        `"${namn}" är ${namn.length} tecken — taket är ${MAX_NAMNLANGD}. ` +
          'Längden ÄR uppdraget; en demo-rad som växer förbi taket löser inget.',
      );
    }
    if (!ASCII_FILNAMN.test(namn)) {
      throw new Error(
        `"${namn}" bär tecken utanför ${ASCII_FILNAMN} — Supabase Storage avvisar ` +
          'nyckeln med "Invalid key" (MÄTT 2026-08-17, se filhuvudet).',
      );
    }
    if (sedda.has(namn)) throw new Error(`"${namn}" förekommer två gånger i registret`);
    sedda.add(namn);

    // Samma kontrakt som AttachmentScopeInputSchema (_shared/attachments.ts)
    // — prövat HÄR också, så ett registerfel syns som ett guard-fel i stället
    // för som ett 400 mitt i en halvskriven fixtur.
    if (!['Event', 'Kurstyp', 'Alla event'].includes(rackvidd)) {
      throw new Error(`"${namn}": okänd räckvidd "${rackvidd}"`);
    }
    if (rackvidd === 'Kurstyp' && !kursfamilj) {
      throw new Error(`"${namn}": räckvidd Kurstyp kräver kursfamilj`);
    }
    if (rackvidd !== 'Kurstyp' && (kursfamilj || kursniva)) {
      throw new Error(`"${namn}": kursfamilj/kursnivå kräver räckvidd Kurstyp`);
    }
    if (rackvidd === 'Event' && !medEvent) {
      throw new Error(`"${namn}": räckvidd Event kräver medEvent (eventId skickas)`);
    }
    if (rackvidd !== 'Event' && medEvent) {
      throw new Error(
        `"${namn}": medEvent på en gemensam bilaga sätter Event-länken och gör raden ` +
          'svårläst i basen — utelämna den (ADR-118 beslut 5).',
      );
    }
  }
  return config;
}

/**
 * Läser de två project-refsen ur .prod-ref-policy.conf. Enkel rad-parsning
 * med flit: filen är bash-sourcad config med exakt formen `NAMN="värde"`,
 * och att dra in en YAML/dotenv-parser för två rader vore mer maskineri än
 * problem. Kastar om någon av dem saknas — fail-closed.
 */
export function parseProdRefPolicy(text) {
  const las = (namn) => text.match(new RegExp(`^${namn}="([a-z0-9]+)"`, 'm'))?.[1];
  const staging = las('PROD_REF_STAGING');
  const prod = las('PROD_REF_PROD');
  if (!staging || !prod) {
    throw new Error(
      'kunde inte läsa PROD_REF_STAGING/PROD_REF_PROD ur .prod-ref-policy.conf — ' +
        'fail-closed: en guard som inte kunde svara läses aldrig som grönt ljus',
    );
  }
  return { staging, prod };
}

/**
 * Skyddsräcke 2: prod-guarden. POSITIV allowlist (måste vara staging-refen)
 * plus negativ spärr (får aldrig vara prod-refen) — en tom, felstavad eller
 * främmande URL faller på den första, inte tyst igenom.
 */
export function validateSupabaseUrl(url, refs) {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('TEST_SUPABASE_URL saknas');
  }
  if (url.includes(refs.prod)) {
    throw new Error(
      'prod-guard: TEST_SUPABASE_URL pekar på PROD-projektet. Skriptet skriver till ' +
        'basen via EF:er — en körning här hade lagt demo-rader i Lottas skarpa data.',
    );
  }
  if (!url.includes(refs.staging)) {
    throw new Error(
      `prod-guard: TEST_SUPABASE_URL bär varken staging-refen eller prod-refen. ` +
        'Skriptet kör ENDAST mot staging (fail-closed).',
    );
  }
  return url.replace(/\/+$/, '');
}

/**
 * Skyddsräcke 3: korsläs demo-namnen mot den SKARPA purge-policyn. Träff =
 * raderna ÄR purge-bara, alltså inte permanenta — och då är premissen för
 * hela skriptet bruten. Tom lista = säkert. Formen är seed-review-fixture
 * .mjs § purgeCollisions; skillnaden är att den där skyddar en fixtur med
 * utgångsdatum, här en permanent rad.
 */
export function purgeCollisions(namn, purgePolicy) {
  const kollisioner = [];
  for (const target of purgePolicy?.targets ?? []) {
    if (target.exactMatchField !== 'Namn') continue;
    for (const n of namn) {
      if (new RegExp(target.exactMatchPattern).test(n)) {
        kollisioner.push({ target: target.name, table: target.table, namn: n });
      }
    }
  }
  return kollisioner;
}

/** Argument. Lägena är ömsesidigt uteslutande; --dry-run är en modifierare. */
export function parseArgs(argv, config) {
  const args = {
    clean: argv.includes('--clean'),
    dryRun: argv.includes('--dry-run'),
    eventId: config.ankarEventId,
  };
  const i = argv.indexOf('--event');
  if (i !== -1) {
    const varde = argv[i + 1];
    if (!REC_ID.test(varde ?? '')) {
      throw new Error(`--event "${varde}" är inte ett rec-ID (rec + 14 tecken)`);
    }
    args.eventId = varde;
  }
  return args;
}

/** Planera skapandet: vad som saknas, vad som redan finns (idempotens). */
export function planCreate(poster, befintliga) {
  const plan = { skapa: [], finns: [] };
  for (const post of poster) {
    const traff = befintliga.find((b) => b.namn === post.namn && b.rackvidd === post.rackvidd);
    if (traff) plan.finns.push({ post, rad: traff });
    else plan.skapa.push(post);
  }
  return plan;
}

/**
 * Planera städningen: EXAKT namn-match mot registret, aldrig en prefix-
 * svepning. En rad vars namn inte står i registret rapporteras i stället för
 * att raderas — fail-safe-riktningen från purge-skriptets skyddsräcke 4.
 */
export function planClean(poster, befintliga) {
  const registret = new Map(poster.map((p) => [p.namn, p]));
  const plan = { radera: [], saknas: [], frammande: [] };
  for (const rad of befintliga) {
    if (registret.has(rad.namn)) plan.radera.push(rad);
    else if (rad.namn.startsWith(MARKOR)) plan.frammande.push(rad);
  }
  for (const post of poster) {
    if (!befintliga.some((b) => b.namn === post.namn)) plan.saknas.push(post);
  }
  return plan;
}

// ---------------------------------------------------------------------------
// PDF:en — minimal men GILTIG, för att förhandsvisningen ska visa något
// ---------------------------------------------------------------------------

/**
 * WinAnsi-avvikelserna från Latin-1. Demo-namnen är ASCII (se filhuvudet),
 * men PDF:ens INNEHÅLL är svensk prosa med å/ä/ö — och det är helt separat
 * från Storage-nyckeln.
 */
const WINANSI_EXTRA = new Map([
  ['–', 0x96],
  ['—', 0x97],
  ['’', 0x92],
]);

/** Text → PDF-strängliteral i WinAnsiEncoding, med `(`, `)` och `\` escapade. */
export function pdfText(text) {
  let ut = '';
  for (const tecken of text) {
    const kod = WINANSI_EXTRA.get(tecken) ?? tecken.codePointAt(0) ?? 0x3f;
    const c = kod > 0xff ? '?' : String.fromCharCode(kod);
    ut += c === '(' || c === ')' || c === '\\' ? `\\${c}` : c;
  }
  return ut;
}

/**
 * En GILTIG PDF 1.4 på en sida, byggd för hand med korrekt xref-tabell.
 *
 * VARFÖR INTE testernas pseudo-PDF (`%PDF-1.4` + fyllnads-A:n +`%%EOF`):
 * den finns för att pröva EF:ens storleks- och content-type-gränser, och
 * ingen öppnar den. En DEMO-rad öppnas — Dokument-ytan har förhandsvisning
 * — och en trasig fil där gör raden värdelös som granskningsunderlag.
 *
 * VARFÖR INTE pdf-lib (som `_shared/receipt-pdf.ts` använder): det biblioteket
 * dras in via esm.sh i Deno-körtiden. Att lägga det som npm-beroende bara för
 * ett seed-script ändrar package-lock.json, vilket lyfter varje ändring i
 * detta skript ur docs-klassen och in i full CI-klass (ci.yml § klassning-d0).
 * ~40 rader ren PDF-syntax kostar mindre än så.
 *
 * Verifierad: renderad med `qlmanage -t` (CoreGraphics) 2026-08-17 — rubrik,
 * brödtext och å/ä/ö kom ut rätt.
 */
export function buildDemoPdf(rubrik, rader) {
  const innehall =
    `BT\n/F1 20 Tf\n60 760 Td\n(${pdfText(rubrik)}) Tj\n/F1 11 Tf\n` +
    rader.map((r) => `0 -26 Td\n(${pdfText(r)}) Tj\n`).join('') +
    'ET\n';
  const stromLangd = Buffer.byteLength(innehall, 'latin1');

  const objekt = [
    '<</Type /Catalog /Pages 2 0 R>>',
    '<</Type /Pages /Kids [3 0 R] /Count 1>>',
    '<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources <</Font <</F1 5 0 R>>>> /Contents 4 0 R>>',
    `<</Length ${stromLangd}>>\nstream\n${innehall}endstream`,
    '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>',
  ];

  const delar = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
  const offsets = [];
  let pos = delar[0].length;
  objekt.forEach((kropp, i) => {
    const buf = Buffer.from(`${i + 1} 0 obj\n${kropp}\nendobj\n`, 'latin1');
    offsets.push(pos);
    pos += buf.length;
    delar.push(buf);
  });

  let xref = `xref\n0 ${objekt.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) xref += `${String(o).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<</Size ${objekt.length + 1} /Root 1 0 R>>\n` + `startxref\n${pos}\n%%EOF\n`;
  delar.push(Buffer.from(xref, 'latin1'));

  return Buffer.concat(delar);
}

/** PDF-innehållet för en post — rubrik + vad räckvidden betyder i klartext. */
export function postPdf(post, eventId) {
  const rader = [
    post.beskrivning,
    `Räckvidd: ${post.rackvidd}${post.kursfamilj ? ` – ${post.kursfamilj}` : ''}${
      post.kursniva ? ` – ${post.kursniva}` : ''
    }`,
    post.medEvent ? `Event: ${eventId}` : 'Gemensam bilaga – inget enskilt event.',
    'Demo-dokument i staging. Skapat av npm run seed:dokument.',
  ];
  return buildDemoPdf(post.rubrik, rader);
}

// ---------------------------------------------------------------------------
// Edge Function-anropen
// ---------------------------------------------------------------------------

class GuardError extends Error {}
class ApiError extends Error {}

async function loggaIn(baseUrl, anonKey, epost, losenord) {
  const res = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: epost, password: losenord }),
  });
  if (!res.ok) {
    // Lösenordet ligger i requesten, aldrig i svaret — men klipp ändå.
    throw new ApiError(
      `Inloggning misslyckades: ${res.status} ${(await res.text()).slice(0, 200)}`,
    );
  }
  const body = await res.json();
  if (!body.access_token) throw new ApiError('Inloggningen gav ingen access_token');
  return body.access_token;
}

async function efGet(baseUrl, jwt, funktion, params = {}) {
  const url = new URL(`${baseUrl}/functions/v1/${funktion}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${jwt}` } });
  const rå = await res.text();
  if (!res.ok) throw new ApiError(`${funktion} ${res.status}: ${rå.slice(0, 300)}`);
  return JSON.parse(rå);
}

async function efPost(baseUrl, jwt, funktion, kropp, forvantad = 200) {
  const res = await fetch(`${baseUrl}/functions/v1/${funktion}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(kropp),
  });
  const rå = await res.text();
  if (res.status !== forvantad) {
    throw new ApiError(`${funktion} ${res.status} (väntade ${forvantad}): ${rå.slice(0, 300)}`);
  }
  return JSON.parse(rå);
}

/**
 * Alla demo-relevanta rader: gemensamma (räckviddsläget, ingen eventId) plus
 * ankar-eventets egna. TVÅ anrop med flit — räckviddsläget ser aldrig
 * Event-räckviddiga rader, och eventläget ser bara de gemensamma som matchar
 * just det eventets kursfamilj (ADR-118 beslut 2). Dedup på record-ID.
 */
async function hamtaBefintliga(baseUrl, jwt, eventId) {
  const gemensamma = await efGet(baseUrl, jwt, 'get-event-attachments');
  const iEvent = await efGet(baseUrl, jwt, 'get-event-attachments', { eventId });
  const perId = new Map();
  for (const rad of [...gemensamma.attachments, ...iEvent.attachments]) perId.set(rad.id, rad);
  return [...perId.values()].filter((rad) => rad.namn.startsWith(MARKOR));
}

function beskrivRackvidd(rad) {
  if (rad.rackvidd !== 'Kurstyp') return rad.rackvidd ?? 'okänd';
  return `Kurstyp · ${rad.kursfamilj ?? '?'}${rad.kursniva ? ` · ${rad.kursniva}` : ' · (alla nivåer)'}`;
}

// ---------------------------------------------------------------------------
// Lägena
// ---------------------------------------------------------------------------

async function korCreate({ baseUrl, jwt, args }) {
  const befintliga = await hamtaBefintliga(baseUrl, jwt, args.eventId);
  const plan = planCreate(CONFIG.poster, befintliga);

  console.log(`\n▸ Plan: ${plan.skapa.length} skapas, ${plan.finns.length} finns redan`);
  for (const { post, rad } of plan.finns) {
    console.log(`   ⏭  ${post.namn} — finns (${rad.id}, ${beskrivRackvidd(rad)})`);
  }
  for (const post of plan.skapa) {
    const pdf = postPdf(post, args.eventId);
    console.log(
      `   +  ${post.namn} (${post.namn.length} tecken, ${pdf.length} byte) — ` +
        `${beskrivRackvidd(post)}${post.medEvent ? ` → ${args.eventId}` : ''}`,
    );
  }
  if (args.dryRun) {
    console.log('\nDry run klar — inget skrevs.');
    return 0;
  }
  if (plan.skapa.length === 0) {
    console.log('\nInget att göra — basen bär redan alla fyra demo-raderna.');
    return 0;
  }

  for (const post of plan.skapa) {
    const kropp = {
      filnamn: post.namn,
      contentType: 'application/pdf',
      bytesBase64: postPdf(post, args.eventId).toString('base64'),
      rackvidd: post.rackvidd,
    };
    if (post.kursfamilj) kropp.kursfamilj = post.kursfamilj;
    if (post.kursniva) kropp.kursniva = post.kursniva;
    if (post.medEvent) kropp.eventId = args.eventId;

    const svar = await efPost(baseUrl, jwt, 'upload-attachment', kropp, 201);
    console.log(`   ✅ ${post.namn} → ${svar.attachment.id}`);
  }

  // Efter-verifiering (samma form som purge-skriptets): läs tillbaka och
  // bekräfta att alla fyra FAKTISKT ligger där, med rätt räckvidd.
  const efterat = await hamtaBefintliga(baseUrl, jwt, args.eventId);
  const kvar = planCreate(CONFIG.poster, efterat);
  if (kvar.skapa.length > 0) {
    throw new ApiError(
      `efter-verifiering: ${kvar.skapa.map((p) => p.namn).join(', ')} syns inte i basen`,
    );
  }
  console.log('\n✅ Efter-verifiering: alla fyra demo-rader ligger i basen.');
  return 0;
}

async function korClean({ baseUrl, jwt, args }) {
  const befintliga = await hamtaBefintliga(baseUrl, jwt, args.eventId);
  const plan = planClean(CONFIG.poster, befintliga);

  console.log(`\n▸ Plan: ${plan.radera.length} raderas, ${plan.saknas.length} fanns inte`);
  for (const rad of plan.radera) {
    console.log(`   -  ${rad.namn} (${rad.id}, ${beskrivRackvidd(rad)})`);
  }
  for (const post of plan.saknas) console.log(`   ⏭  ${post.namn} — fanns inte`);
  for (const rad of plan.frammande) {
    console.log(
      `   ⚠️  ${rad.namn} (${rad.id}) bär markören men står INTE i registret — rörs ej. ` +
        'Lägg posten i CONFIG.poster om den ska kunna städas härifrån.',
    );
  }
  if (args.dryRun) {
    console.log('\nDry run klar — inget raderades.');
    return 0;
  }

  for (const rad of plan.radera) {
    // ADR-118 beslut 3: en GEMENSAM bilaga raderas ur räckviddsläget
    // (eventId UTELÄMNAD — anges den blir det 403 "ur eventkontext"), en
    // EVENT-bilaga kräver tvärtom sitt eventId för ägarskaps-guarden.
    const kropp =
      rad.rackvidd === 'Event'
        ? { attachmentId: rad.id, eventId: rad.eventId ?? args.eventId }
        : { attachmentId: rad.id };
    await efPost(baseUrl, jwt, 'delete-attachment', kropp, 200);
    console.log(`   🗑  ${rad.namn} raderad (rad + Storage-bytes)`);
  }

  const efterat = await hamtaBefintliga(baseUrl, jwt, args.eventId);
  const kvar = planClean(CONFIG.poster, efterat);
  if (kvar.radera.length > 0) {
    throw new ApiError(`efter-verifiering: ${kvar.radera.length} demo-rader kvarstår`);
  }
  console.log('\n✅ Efter-verifiering: inga demo-rader kvar.');
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  let args;
  let baseUrl;
  let env;
  try {
    validateRegister(CONFIG);
    args = parseArgs(process.argv.slice(2), CONFIG);

    const refs = parseProdRefPolicy(
      await readFile(new URL('../.prod-ref-policy.conf', import.meta.url), 'utf8'),
    );
    baseUrl = validateSupabaseUrl(process.env.TEST_SUPABASE_URL, refs);

    env = {
      anonKey: process.env.TEST_SUPABASE_ANON_KEY,
      epost: process.env.TEST_USER_EMAIL,
      losenord: process.env.TEST_USER_PASSWORD,
    };
    const saknas = Object.entries(env)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (saknas.length > 0) {
      throw new Error(
        `env saknas (${saknas.join(', ')}). Skriptet läser .env.test — TEST_SUPABASE_URL, ` +
          'TEST_SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD. Se .env.test.example.',
      );
    }

    const purgePolicy = JSON.parse(
      await readFile(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
    );
    const kollisioner = purgeCollisions(
      CONFIG.poster.map((p) => p.namn),
      purgePolicy,
    );
    if (kollisioner.length > 0) {
      throw new Error(
        'purge-kollision: demo-raderna skulle raderas av setup-purgen och är alltså inte ' +
          `permanenta — ${kollisioner.map((k) => `${k.namn} ⇒ ${k.target}`).join('; ')}. ` +
          'Lös det i namnet eller i mönstret — ALDRIG genom att ge demo-raderna ett target.',
      );
    }
  } catch (err) {
    console.error(`❌ Guard-/argumentfel: ${err.message}`);
    process.exit(1);
  }

  // Efter guard-, argument- och env-kontrollerna, FÖRE första nätverksanropet
  // (samma placering som purge-staging-sentinels.mjs och seed-review-fixture
  // .mjs). En CI-purge mitt i körningen städar inte demo-raderna — de har
  // inget target — men den delar basens 5 req/s-budget och kan racea med
  // uppladdningarnas Airtable-skrivningar. Gäller även --dry-run, som läser
  // basen via get-event-attachments.
  kravStagingLedigt('lokal seed:dokument');

  console.log(
    `Dokument-demofixtur mot ${baseUrl}` +
      `${args.clean ? ' — CLEAN' : ''}${args.dryRun ? ' — DRY RUN, inget skrivs' : ''}`,
  );
  console.log(`Markör: "${MARKOR}" · ankar-event: ${args.eventId}`);
  console.log('▸ Purge-kollisionsvakt: ren mot .purge-staging-policy.json (0 targets matchar)');

  try {
    const jwt = await loggaIn(baseUrl, env.anonKey, env.epost, env.losenord);
    const kod = args.clean
      ? await korClean({ baseUrl, jwt, args })
      : await korCreate({ baseUrl, jwt, args });
    process.exit(kod);
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(`❌ Guard: ${err.message}`);
      process.exit(1);
    }
    if (err instanceof ApiError) {
      console.error(`❌ ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

// Kör endast som CLI — inte vid import (samma form som purge-staging-sentinels.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
