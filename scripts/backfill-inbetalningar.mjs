#!/usr/bin/env node

// scripts/backfill-inbetalningar.mjs — historiska inbetalningar ur basens
// befintliga sanning (TASK-346.8, ADR-128 beslut 8).
//
// Kör:  npm run backfill:inbetalningar              (DRY-RUN, default)
//       npm run backfill:inbetalningar -- --utfor   (skarpt)
//
// Exit: 0 = OK · 1 = guard-/konfigurationsfel · 2 = API-fel (Airtable/Postgres)
//       76/77 = staging-semaforens egna koder (CI håller staging / sonden tyst)
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SKRIPTET GÖR, OCH VARFÖR DET BEHÖVS
// ═══════════════════════════════════════════════════════════════════════════
// ADR-128 beslut 2 härleder betalningsfacken ur SUMMAN av inbetalningarna mot
// priset. Den regeln är sann för varje anmälan som fått sina inbetalningar
// registrerade i appen — och FALSK för varenda anmälan som fanns innan
// betalningsdomänen byggdes: de bär `Anmälningsavgift: Mottagen` i basen men
// har noll inbetalningar i Postgres, så härledningen säger "Ej mottagen" och
// `Saknas (kr)` visar hela priset. PRD TASK-346 § Datamodell namnger
// åtgärden: "Härledningen är universell från dag ett EFTER FULL
// BETALNINGS-BACKFILL (Närvarande ⇒ betalt, Mottagen ⇒ betalt, belopp =
// dåvarande pris, betalsätt Historik, datum okänt)".
//
// Skriptet gör TVÅ saker, i denna ordning:
//
//   A. EVENTPRISER. Ett event vars pris bara finns som Eventinnehåll-STANDARD
//      får standardens tal skrivna till sina EGNA numeriska fält. Det är inte
//      kosmetik: basens `Saknas (kr)`-formel läser lookupen
//      `Pris (kr) (from Event)` (alltså Eventplanering.`Pris (kr)`), ALDRIG
//      standarden — så ett sådant event ger `Saknas (kr)` = BLANK, och raden
//      blir OSYNLIG i inkorgen. Det är ask-user-fyndet ur PR #2150:s
//      granskning, och `data-model.md` § Stagingbasens additiva tillskott
//      lämnar det uttryckligen hit: "En fullständig events-prisbackfill hör
//      till TASK-346.8".
//
//   B. INBETALNINGAR. En `Historik`-post per anmälan som basen redan säger är
//      betald, med beloppet härlett ur dåvarande pris.
//
// ═══════════════════════════════════════════════════════════════════════════
// SKRIVVÄGEN ÄR DIREKT SQL — OCH DET ÄR ETT MÄTT VAL, INTE ETT BEKVÄMT
// ═══════════════════════════════════════════════════════════════════════════
// Uppdragets väg (a) var att gå via Edge Function-en `registrera-inbetalning`
// (deployad i staging, ger härledning + spegel + aktivitetslogg gratis). Tre
// mätningar stängde den vägen för DENNA skiva:
//
//   1. EF:en KAN INTE lämna betalningsdatumet tomt. `registrera-inbetalning/
//      index.ts` gör `const betalningsdatum = typeof raDatum === 'string'
//      ? raDatum : nu.slice(0, 10)` — ett utelämnat datum blir DAGENS datum.
//      Kortets AC #1 kräver TOMT datum ("datum okänt"), och en historisk post
//      stämplad med backfill-dagens datum är en osanning i Rogers
//      verifikationskedja. Kolumnen `betalningsdatum date` ÄR nullable
//      (migrationen saknar `not null` — verifierat) så databasen tillåter det
//      EF:en inte gör.
//   2. EF:en kräver en INLOGGAD ANVÄNDARE (`requireUser`, JWT i
//      Authorization-headern). Ett CLI-skript har ingen.
//   3. PostgREST-vägen med `service_role` är stängd för agenter:
//      `supabase projects api-keys` fälls av `scripts/deny-hemlighet-
//      utskrift.sh` (TASK-203). Nyckeln går alltså inte att hämta.
//
// Att i stället ÄNDRA EF:en hade krävt en `functions deploy` — och den ägs av
// orkestreraren (uppdragets B5-ordning), inte av denna skiva.
//
// PENGALOGIKEN DUPLICERAS ÄNDÅ INTE, och det är hela poängen med formen:
// skriptet IMPORTERAR `harledBetalning`/`valjPris` ur
// `supabase/functions/_shared/betalningsharledning.ts` och validerar sin
// spegelpatch mot `write-registration-payment-mirror` i
// `_shared/field-allowlists.ts` — samma moduler EF:en kör. Node 24:s
// type-stripping laddar dem direkt (mätt: `node <fil>.mjs` med en `.ts`-import
// returnerar rätt värden, 2026-08-31). Vore logiken kopierad hit hade
// backfillen och appen kunnat drifta isär utan att någon grind såg det; nu
// fäller `tests/api/betalningsharledning.test.ts` båda på en gång.
//
// ORDNINGEN ÄR EF:ENS: Postgres FÖRST, spegeln SEDAN. Vore det tvärtom kunde
// basen bära en summa som ingen inbetalning motsvarar — en osanning i det
// lager Lottas vyer läser (`registrera-inbetalning/index.ts` § ORDNINGEN).
//
// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENSEN ÄR STRUKTURELL, INTE IHÅGKOMMEN
// ═══════════════════════════════════════════════════════════════════════════
// Varje rad skrivs som `insert … select … where not exists (… betalsatt =
// 'Historik' …)`. Omkörningen skapar noll rader därför att DATABASEN avgör
// det i samma sats som insert-en, inte därför att skriptet minns vad det
// gjorde förra gången. En avbruten körning kan alltså köras om rakt av, och
// två körningar kan inte racea in en dubblett.
//
// Nyckeln är (anmalan_record_id, betalsatt='Historik') och INTE bankreferens-
// kolumnen, trots att den bär ett partiellt unikt index som hade gett samma
// garanti. Bankreferensen är BANKENS transaktionsreferens (migrationens
// kolumnkommentar, dubblettnyckeln vid Swish-import i TASK-346.10); att fylla
// den med en syntetisk backfill-nyckel hade lagt en främmande betydelse i ett
// fält en annan skiva äger, och den strängen hade dessutom visats för Lotta
// på inbetalningens rad.
//
// ═══════════════════════════════════════════════════════════════════════════
// VAD SOM ALDRIG GISSAS (AC #2)
// ═══════════════════════════════════════════════════════════════════════════
// En anmälan vars pris inte går att härleda backfillas INTE. Den listas, med
// skäl, för Marcus. Detsamma gäller fack-kombinationen `Anmälningsavgift:
// Ej mottagen` + `Slutbetalning: Mottagen`: den är i sig motsägelsefull (man
// betalar inte slutbetalningen före avgiften), och en backfill av den hade
// FLIPPAT BÅDA facken i basen — en tyst omskrivning av Lottas egen data.
// Härledningen är en funktion av summan och kan strukturellt inte uttrycka
// "slutbetalning mottagen men inte avgiften"; att ändå skriva en rad hade
// bytt ut hennes sanning mot vår. Marcus avgör den klassen mot Lottas lista.
//
// Se `docs/reference/backfill-inbetalningar.md` för avvikelselistans form och
// hur Lottas lista används som facit.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { harledBetalning, valjPris } from '../supabase/functions/_shared/betalningsharledning.ts';
import {
  findDisallowedField,
  getOperation,
} from '../supabase/functions/_shared/field-allowlists.ts';
// STATISK import, inte dynamisk: `scripts/check-staging-preflight-wiring.mjs`
// läser importsatsen för att bevisa att haken finns, och en `await import()`
// inne i `main()` är osynlig för den. Vakten fällde exakt det 2026-08-31.
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

const HAR_KATALOG = dirname(fileURLToPath(import.meta.url));
const REPO_ROT = resolve(HAR_KATALOG, '..');

export const POLICY_FIL = '.backfill-inbetalningar-policy.json';
export const SPEGEL_OPERATION = 'write-registration-payment-mirror';
export const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
export const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
export const REC_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;
export const PROJECT_REF_PATTERN = /^[a-z]{20}$/;

/** CLI-version som pinnas för `supabase db query` — EN sanning, i policyfilen. */
export const SUPABASE_CLI_POLICY_FIL = '.supabase-cli-policy.conf';

// ───────────────────────────────────────────────────────────────────────────
// Guards
// ───────────────────────────────────────────────────────────────────────────

/**
 * Bas-guarden. Samma form som `scripts/backfill-bilagor-dokumentklass.mjs`
 * och `purge-staging-sentinels.mjs`: staging och prod delar tabell- och
 * fält-ID:n (`data-model.md` § ID-topologi), så BAS-ID:t är den enda bärande
 * skyddslinjen — ett tabellnamn säger ingenting om vilken bas man är i.
 */
export function validateBaseGuard(policy, basId) {
  const forbidden = policy?.forbiddenBaseIds;
  if (!Array.isArray(forbidden) || forbidden.length === 0) {
    throw new Error('Policyn saknar forbiddenBaseIds — vägrar köra utan prod-spärr');
  }
  if (!BASE_ID_PATTERN.test(basId ?? '')) {
    throw new Error(`Bas-ID har fel form: ${JSON.stringify(basId)}`);
  }
  if (forbidden.includes(basId)) {
    throw new Error(`BLOCKERAD bas: ${basId} står i forbiddenBaseIds (prod är förbjuden)`);
  }
  if (basId !== policy.expectedBaseId) {
    throw new Error(
      `Bas ${basId} är varken expectedBaseId (${policy.expectedBaseId}) eller uttryckligen tillåten`,
    );
  }
  return true;
}

/**
 * Project-ref-guarden.
 *
 * `prodRef` skickas IN (läst ur `.prod-ref-policy.conf` av anroparen) i
 * stället för att stå i denna fils policy. Skälet står i policyfilens
 * `_kommentar`: prod-refen bor på exakt ett ställe i repot, och en andra
 * kopia hade gjort det bekvämt att bygga ett anrop som läser den ur config —
 * vilket är precis vad `scripts/deny-prod-ref.sh` finns för att omöjliggöra
 * (CLAUDE.md § Prod-EF-deploy: "Project-refen anges som ARGUMENT, aldrig ur
 * config").
 */
export function validateProjectRef(policy, ref, prodRef) {
  const tillatna = policy?.tillatnaProjectRefs;
  if (!Array.isArray(tillatna) || tillatna.length === 0) {
    throw new Error('Policyn saknar tillatnaProjectRefs — vägrar köra utan mål-spärr');
  }
  if (!PROJECT_REF_PATTERN.test(ref ?? '')) {
    throw new Error(`Project-ref har fel form: ${JSON.stringify(ref)}`);
  }
  if (prodRef && ref === prodRef) {
    throw new Error(
      `BLOCKERAD project-ref: ${ref} är PROD enligt .prod-ref-policy.conf. ` +
        'Prod-backfillen är AC #4 — ett öppet kriterium för Marcus, aldrig en agent-körning.',
    );
  }
  if (!tillatna.includes(ref)) {
    throw new Error(`Project-ref ${ref} står inte i tillatnaProjectRefs`);
  }
  return true;
}

// ───────────────────────────────────────────────────────────────────────────
// Prisfritextens tolkning (AC #2)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Tusentalsavgränsare som strippas, angivna som KODPUNKTER och inte som råa
 * tecken — verbatim samma lista och samma skäl som
 * `_shared/betalningsbelopp.ts`: hårt blanksteg, siffer-blanksteg, tunt
 * blanksteg och smalt hårt blanksteg är OSYNLIGT olika från ett vanligt
 * blanksteg i en editor, och en teckenklass ingen kan LÄSA är en teckenklass
 * ingen kan granska. Ingen av kodpunkterna är regex-meta, så strängbygget
 * behöver ingen escaping.
 */
const GRUPPTECKEN = [
  0x0020, // vanligt blanksteg
  0x00a0, // hårt blanksteg (no-break space)
  0x2007, // siffer-blanksteg (figure space)
  0x2009, // tunt blanksteg (thin space)
  0x202f, // smalt hårt blanksteg (narrow no-break space)
  0x0027, // apostrof (schweizisk/tysk tusentalsform)
];
const GRUPPTECKEN_RE = new RegExp(
  `[${GRUPPTECKEN.map((kod) => String.fromCodePoint(kod)).join('')}]`,
  'g',
);
const VALUTASUFFIX_RE = /(?:\s*(?::-|kr|kronor|sek))+$/i;

/**
 * Tolkar en HISTORISK prislapp ur basens fritextfält till kronor, eller
 * `null` när formen inte entydigt är ett pris.
 *
 * ═══ VARFÖR DETTA INTE ÄR `normaliseraBelopp`, OCH INTE FÅR VARA DET ═══
 *
 * `_shared/betalningsbelopp.ts` avvisar `'2.500'` som `null` MED AVSIKT, och
 * dess filhuvud säger varför: formen är tvetydig mellan 2,50 och 2500, och
 * "de två läsningarna skiljer sig med en faktor tusen på en bokföringspost".
 * Samma filhuvud drar dessutom gränsen uttryckligen: "Prisfritexten i basen
 * parsas ALDRIG av denna funktion."
 *
 * Den regeln är rätt för Lottas INMATNING — hon står vid fältet och kan
 * skriva om. Den är fel för en HISTORISK prislapp: där finns ingen att fråga,
 * och `data-model.md` § Stagingbasens additiva tillskott bokför den faktiska
 * formen i basen som `Pris` = `"2.500"` / `Anmälningsavgift` = `"1000:-"`,
 * redan handparsad till 2500 respektive 1000 av TASK-346.2. AC #2 kräver
 * samma tolkning i kod.
 *
 * DISAMBIGUERINGEN, bokförd: ett avgränsartecken följt av EXAKT TRE siffror
 * i slutet är TUSENTAL (`2.500` → 2500, `2,500` → 2500); ETT ELLER TVÅ är
 * DECIMALER (`2500.50` → 2500.5, `12,5` → 12.5). Regeln är sann för svenska
 * kronpriser därför att ett pris aldrig anges med tre decimaler, medan
 * tusentalsgruppering med punkt är vanlig i äldre material. Fler än ett
 * avgränsartecken, eller något som inte matchar efteråt, ger `null` — och
 * `null` betyder "listas för Marcus", aldrig ett gissat tal.
 */
export function tolkaPrisFritext(ratext) {
  if (typeof ratext !== 'string') return null;

  const utanValuta = ratext.trim().replace(VALUTASUFFIX_RE, '');
  const utanGrupp = utanValuta.replace(GRUPPTECKEN_RE, '');
  if (utanGrupp === '') return null;

  // Exakt ETT avgränsartecken tillåts. Två (`1.234.567`) är en form vi inte
  // behöver i denna domän, och att stödja den hade krävt en regel för när
  // den SISTA gruppen är decimaler — precis den tvetydighet funktionen finns
  // för att vägra.
  const avgransare = utanGrupp.match(/[.,]/g) ?? [];
  let kanonisk = utanGrupp;
  if (avgransare.length > 1) return null;
  if (avgransare.length === 1) {
    const delar = utanGrupp.split(/[.,]/);
    const [heltal, svans] = delar;
    if (!/^-?\d+$/.test(heltal) || !/^\d+$/.test(svans)) return null;
    kanonisk = svans.length === 3 ? `${heltal}${svans}` : `${heltal}.${svans}`;
    if (svans.length > 3) return null;
  }

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(kanonisk)) return null;
  const tal = Number(kanonisk);
  if (!Number.isFinite(tal) || tal < 0) return null;
  return tal;
}

// ───────────────────────────────────────────────────────────────────────────
// Prisbilden per anmälan
// ───────────────────────────────────────────────────────────────────────────

/**
 * Löser prisets tre nivåer OCH bokför VARIFRÅN varje tal kom — källan är ett
 * AC-krav ("källa bokförd per rad"), inte en trevlighet.
 *
 * Nivåerna är `valjPris`ens (`_shared/betalningsharledning.ts`), som är den
 * delade sanningen; fritexten kommer in som en FJÄRDE, sist prövad nivå och
 * bara när de numeriska saknas — ADR-128 beslut 7 säger att priser läses ur
 * de numeriska fälten, så fritexten är en historisk räddning, aldrig
 * förstahandskällan.
 */
export function harledPrisbild({ anmalan, event, standard }) {
  const evPris = event?.pris ?? null;
  const evAvgift = event?.anmalningsavgift ?? null;
  const stdPris = standard?.pris ?? null;
  const stdAvgift = standard?.anmalningsavgift ?? null;

  const fritextPris = tolkaPrisFritext(standard?.prisFritext ?? null);
  const fritextAvgift = tolkaPrisFritext(standard?.anmalningsavgiftFritext ?? null);

  const numerisktPris = valjPris(anmalan?.avtalatPris ?? null, evPris, stdPris);
  const numeriskAvgift = valjPris(null, evAvgift, stdAvgift);

  const pris = numerisktPris !== null ? numerisktPris : fritextPris;
  const anmalningsavgift = numeriskAvgift !== null ? numeriskAvgift : fritextAvgift;

  const prisKalla =
    anmalan?.avtalatPris != null && numerisktPris === anmalan.avtalatPris
      ? 'anmalan.avtalat-pris'
      : evPris !== null
        ? 'eventplanering.pris-kr'
        : stdPris !== null
          ? 'eventinnehall.pris-kr'
          : fritextPris !== null
            ? 'eventinnehall.pris-fritext'
            : null;

  const avgiftKalla =
    evAvgift !== null
      ? 'eventplanering.anmalningsavgift-kr'
      : stdAvgift !== null
        ? 'eventinnehall.anmalningsavgift-kr'
        : fritextAvgift !== null
          ? 'eventinnehall.anmalningsavgift-fritext'
          : null;

  return {
    pris,
    anmalningsavgift,
    prisKalla,
    avgiftKalla,
    eventTyp: event?.typ ?? null,
    /** Fritext som FANNS men inte gick att tolka — listas separat för Marcus. */
    otolkbarPrisFritext:
      numerisktPris === null &&
      fritextPris === null &&
      typeof standard?.prisFritext === 'string' &&
      standard.prisFritext.trim() !== ''
        ? standard.prisFritext
        : null,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Klassificeringen — regeln, en anmälan i taget
// ───────────────────────────────────────────────────────────────────────────

export const BESLUT = {
  backfilla: 'backfilla',
  redanBackfillad: 'redan-backfillad',
  hoppa: 'hoppa',
  avvikelse: 'avvikelse',
};

export const FORELASNING = 'Föreläsning';

/**
 * Avgör vad som ska hända med EN anmälan.
 *
 * Regeln, ur PRD TASK-346 § Datamodell och ADR-128 beslut 8, i den ordning
 * villkoren prövas:
 *
 *   1. Exkluderad (ZZ-namnrymd, uttryckligen exkluderat event, ingen
 *      event-länk) → hoppas över.
 *   2. Redan backfillad (en `Historik`-post finns) → hoppas över. Detta är
 *      rapporteringssidan av idempotensen; SQL-satsens `where not exists` är
 *      garantin.
 *   3. Fack-motsägelse (avgift `Ej mottagen` + slutbetalning `Mottagen`) →
 *      AVVIKELSE. Se filhuvudet § VAD SOM ALDRIG GISSAS.
 *   4. Inget betalt alls (inga mottagna fack, ingen närvaro) → hoppas över.
 *      Det är inte en avvikelse: "har inte betalat" är ett giltigt tillstånd
 *      och blir korrekt av sig självt när noll inbetalningar finns.
 *   5. Pris okänt → AVVIKELSE. Aldrig gissat.
 *   6. NÄRVARO ⇒ hela priset. Regeln står över facken: en person som var på
 *      plats har gått kursen, oavsett vad kryssen säger.
 *   7. Annars fackens summa: avgift `Mottagen` ⇒ avgiftens pris;
 *      slutbetalning `Mottagen` ⇒ resten av priset (pris − avgift).
 *      En FÖRELÄSNING har ett pris utan fack (ADR-128 beslut 2) — där ger
 *      vilket mottaget fack som helst hela priset.
 */
export function klassificera({ anmalan, event, standard, harNarvaro, harHistorik, policy }) {
  const mottaget = policy?.mottagetVarde ?? 'Mottagen';

  if (!anmalan?.eventId) {
    return { beslut: BESLUT.hoppa, kod: 'ingen-event-lank', skal: 'Anmälan saknar event-länk' };
  }
  if (arExkluderat(event, policy)) {
    return {
      beslut: BESLUT.hoppa,
      kod: 'exkluderat-event',
      skal: `Eventet ligger i den exkluderade namnrymden (${event?.ort ?? '?'})`,
    };
  }
  if (harHistorik) {
    return {
      beslut: BESLUT.redanBackfillad,
      kod: 'redan-backfillad',
      skal: 'En Historik-post finns redan för anmälan',
    };
  }

  const avgiftMottagen = anmalan.anmalningsavgiftFack === mottaget;
  const slutMottagen = anmalan.slutbetalningFack === mottaget;

  if (!avgiftMottagen && slutMottagen) {
    return {
      beslut: BESLUT.avvikelse,
      kod: 'fack-motsagelse',
      skal:
        'Slutbetalning Mottagen men Anmälningsavgift Ej mottagen. Härledningen är en ' +
        'funktion av summan och kan inte uttrycka den kombinationen — en backfill hade ' +
        'flippat BÅDA facken. Rättas mot Lottas lista.',
    };
  }

  const prisbild = harledPrisbild({ anmalan, event, standard });
  const arForelasning = prisbild.eventTyp === FORELASNING;

  if (!avgiftMottagen && !slutMottagen && !harNarvaro) {
    return {
      beslut: BESLUT.hoppa,
      kod: 'inget-betalt',
      skal: 'Varken mottaget fack eller närvaro — inget att backfilla',
      prisbild,
    };
  }

  if (prisbild.pris === null) {
    return {
      beslut: BESLUT.avvikelse,
      kod: 'pris-okant',
      skal:
        'Inget pris kan härledas (avtalat pris, eventets pris, Eventinnehåll-standarden ' +
        'och fritexten är alla tomma eller otolkbara)',
      prisbild,
    };
  }

  // NÄRVARO ⇒ hela priset (regeln står över facken).
  if (harNarvaro) {
    return {
      beslut: BESLUT.backfilla,
      kod: 'narvaro',
      belopp: avrundaOre(prisbild.pris),
      skal: 'Närvarande deltagande ⇒ hela dåvarande priset betalt',
      prisbild,
    };
  }

  // En föreläsning har ett pris UTAN fack — vilket mottaget fack som helst
  // betyder att hela priset är betalt (ADR-128 beslut 2).
  if (arForelasning) {
    return {
      beslut: BESLUT.backfilla,
      kod: 'forelasning',
      belopp: avrundaOre(prisbild.pris),
      skal: 'Föreläsning: ett pris utan fack, mottaget fack ⇒ hela priset',
      prisbild,
    };
  }

  if (avgiftMottagen && slutMottagen) {
    return {
      beslut: BESLUT.backfilla,
      kod: 'bada-facken',
      belopp: avrundaOre(prisbild.pris),
      skal: 'Båda facken Mottagen ⇒ hela priset',
      prisbild,
    };
  }

  // Bara avgiften är mottagen — då MÅSTE avgiftens eget pris vara känt.
  if (prisbild.anmalningsavgift === null) {
    return {
      beslut: BESLUT.avvikelse,
      kod: 'avgiftspris-okant',
      skal:
        'Anmälningsavgiften är Mottagen men avgiftens pris är okänt. Att använda hela ' +
        'priset hade sagt att allt är betalt; att gissa ett avgiftsbelopp är förbjudet.',
      prisbild,
    };
  }

  return {
    beslut: BESLUT.backfilla,
    kod: 'anmalningsavgift',
    belopp: avrundaOre(prisbild.anmalningsavgift),
    skal: 'Anmälningsavgift Mottagen ⇒ avgiftens dåvarande pris',
    prisbild,
  };
}

export function arExkluderat(event, policy) {
  if (!event) return true;
  const idn = policy?.exkluderadeEventIds ?? [];
  if (idn.includes(event.id)) return true;
  const prefix = policy?.exkluderadeOrtPrefix ?? [];
  const ort = typeof event.ort === 'string' ? event.ort : '';
  return prefix.some((p) => ort.startsWith(p));
}

/** Samma öres-avrundning som `betalningsharledning.ts` — IEEE 754-driften är verklig. */
export function avrundaOre(kronor) {
  return Math.round(kronor * 100) / 100;
}

// ───────────────────────────────────────────────────────────────────────────
// SQL-bygget
// ───────────────────────────────────────────────────────────────────────────

/**
 * Escaping för en SQL-strängliteral.
 *
 * `standard_conforming_strings` är `on` sedan PostgreSQL 9.1, så en backslash
 * är ett vanligt tecken och apostrofen är det ENDA som behöver dubblas. En
 * NUL-byte kan Postgres inte lagra i `text` alls och kastar därför här, i
 * stället för att ge ett obegripligt fel mitt i en batch.
 *
 * Värdena kommer ur Airtable — alltså ur Lottas egen data, inte ur en
 * angripares hand — men "datan är snäll" är aldrig ett försvar. Ett namn med
 * apostrof (O'Brien) är fullt normalt och hade brutit satsen.
 */
export function escapeSqlText(varde) {
  const text = String(varde);
  if (text.includes('\u0000')) {
    throw new Error('NUL-byte i värde som ska bli SQL-literal — vägrar bygga satsen');
  }
  return `'${text.replace(/'/g, "''")}'`;
}

/** `null` eller ett datum på ISO-form. Allt annat kastar. */
export function sqlDatum(varde) {
  if (varde === null || varde === undefined || varde === '') return 'null';
  const text = String(varde).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(`Datum har fel form: ${JSON.stringify(varde)}`);
  }
  return `date ${escapeSqlText(text)}`;
}

/** Ett belopp som SQL-numeriskt. Kastar på allt som inte är ett ändligt tal. */
export function sqlBelopp(varde) {
  if (typeof varde !== 'number' || !Number.isFinite(varde)) {
    throw new Error(`Belopp är inte ett tal: ${JSON.stringify(varde)}`);
  }
  return varde.toFixed(2);
}

/**
 * En idempotent insert-sats för EN backfill-post.
 *
 * `where not exists` gör omkörningen till en no-op i DATABASEN — se
 * filhuvudet § IDEMPOTENSEN ÄR STRUKTURELL. Predikatet matchar på
 * (anmalan_record_id, betalsatt) och tar med BÅDA statusvärdena med avsikt:
 * en makulerad Historik-post är fortfarande en post skriven av backfillen, och
 * att skriva en ny bredvid den hade återuppväckt ett belopp någon aktivt
 * makulerat.
 */
export function byggInsertSats(post, policy) {
  if (!REC_ID_PATTERN.test(post.anmalanRecordId ?? '')) {
    throw new Error(`Anmälans record-ID har fel form: ${JSON.stringify(post.anmalanRecordId)}`);
  }
  const betalsatt = policy?.betalsatt ?? 'Historik';
  const anmalan = escapeSqlText(post.anmalanRecordId);
  const bet = escapeSqlText(betalsatt);

  return [
    'insert into public.inbetalningar',
    '  (anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event,',
    '   ogonblicksbild_eventdatum, belopp, betalsatt, betalningsdatum, typ, status, skapad_av)',
    `select ${anmalan}, ${escapeSqlText(post.ogonblicksbildNamn)}, ${escapeSqlText(post.ogonblicksbildEvent)},`,
    `       ${sqlDatum(post.ogonblicksbildEventdatum)}, ${sqlBelopp(post.belopp)}, ${bet},`,
    // BETALNINGSDATUM ÄR ALLTID `null` HÄR. Kortets AC #1: "betalningsdatum
    // tomt". Kolumnen är nullable; EF:en kan inte göra detta (filhuvudet).
    "       null, 'inbetalning', 'aktiv',",
    `       ${escapeSqlText(post.skapadAv)}`,
    'where not exists (',
    '  select 1 from public.inbetalningar',
    `  where anmalan_record_id = ${anmalan} and betalsatt = ${bet}`,
    ');',
  ].join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
// Planeringen
// ───────────────────────────────────────────────────────────────────────────

/**
 * Eventprisernas plan (del A i filhuvudet).
 *
 * Ett event får standardens tal skrivna till sina EGNA numeriska fält när
 * (i) det inte är exkluderat, (ii) det har minst en anmälan — annars är
 * skrivningen meningslös, (iii) dess eget fält är tomt, och (iv) standarden
 * (eller dess fritext) bär ett tal. Källan bokförs per event.
 */
export function planeraEventpriser({ event, standarder, anmalningar, policy }) {
  const anmalningarPerEvent = new Map();
  for (const a of anmalningar) {
    if (!a.eventId) continue;
    anmalningarPerEvent.set(a.eventId, (anmalningarPerEvent.get(a.eventId) ?? 0) + 1);
  }

  const plan = [];
  for (const e of event) {
    if (arExkluderat(e, policy)) continue;
    if (!anmalningarPerEvent.has(e.id)) continue;

    const std = standarder.get(standardNyckel(e.namn, e.typ)) ?? null;
    if (!std) continue;

    const falt = {};
    const kallor = {};

    if (e.pris === null) {
      const fran = std.pris !== null ? std.pris : tolkaPrisFritext(std.prisFritext);
      if (fran !== null) {
        falt['Pris (kr)'] = fran;
        kallor['Pris (kr)'] =
          std.pris !== null
            ? `Eventinnehåll ${std.id} · Pris (kr)`
            : `Eventinnehåll ${std.id} · fritext ${JSON.stringify(std.prisFritext)}`;
      }
    }
    if (e.anmalningsavgift === null) {
      const fran =
        std.anmalningsavgift !== null
          ? std.anmalningsavgift
          : tolkaPrisFritext(std.anmalningsavgiftFritext);
      if (fran !== null) {
        falt['Anmälningsavgift (kr)'] = fran;
        kallor['Anmälningsavgift (kr)'] =
          std.anmalningsavgift !== null
            ? `Eventinnehåll ${std.id} · Anmälningsavgift (kr)`
            : `Eventinnehåll ${std.id} · fritext ${JSON.stringify(std.anmalningsavgiftFritext)}`;
      }
    }

    if (Object.keys(falt).length > 0) {
      plan.push({
        eventId: e.id,
        namn: e.namn,
        ort: e.ort,
        antalAnmalningar: anmalningarPerEvent.get(e.id),
        falt,
        kallor,
      });
    }
  }
  return plan;
}

/**
 * Uppslagsnyckeln för Eventinnehåll-standarden: (Event (source) × Typ).
 *
 * Separatorn är U+0000, skriven som ESCAPE och inte som ett rått tecken —
 * dels för att den aldrig kan förekomma i ett Airtable-fältvärde (och därför
 * inte kan ge en falsk träff mellan `("A", "B C")` och `("A B", "C")`), dels
 * för att en rå NUL-byte i källfilen gör hela filen BINÄR för grep och
 * diffverktyg. Samma läsbarhetsdisciplin som grupptecknen ovan.
 */
export function standardNyckel(namn, typ) {
  return `${namn ?? ''}\u0000${typ ?? ''}`;
}

/**
 * Hela planen. REN funktion — all I/O är gjord av anroparen, så planen kan
 * bevisas hermetiskt mot syntetiska fixturer.
 */
export function planera({
  anmalningar,
  event,
  standarder,
  narvaroPerAnmalan,
  historikPerAnmalan,
  policy,
}) {
  const eventMap = new Map(event.map((e) => [e.id, e]));
  const backfill = [];
  const avvikelser = [];
  const hoppade = [];

  for (const a of anmalningar) {
    const e = a.eventId ? (eventMap.get(a.eventId) ?? null) : null;
    const std = e ? (standarder.get(standardNyckel(e.namn, e.typ)) ?? null) : null;
    const utfall = klassificera({
      anmalan: a,
      event: e,
      standard: std,
      harNarvaro: narvaroPerAnmalan.has(a.id),
      harHistorik: historikPerAnmalan.has(a.id),
      policy,
    });

    const rad = {
      anmalanRecordId: a.id,
      namn: a.namn,
      ort: e?.ort ?? null,
      event: e?.namn ?? null,
      eventTyp: e?.typ ?? null,
      eventStartdatum: e?.startdatum ?? null,
      fackAvgift: a.anmalningsavgiftFack,
      fackSlut: a.slutbetalningFack,
      ...utfall,
    };

    if (utfall.beslut === BESLUT.backfilla) {
      backfill.push({
        ...rad,
        ogonblicksbildNamn: a.namn || 'Okänt namn',
        // Samma ögonblicksbild-källa som `registrera-inbetalning/index.ts`
        // (`event?.namn ?? 'Okänt event'`, alltså `Event (source)`). Att
        // avvika hade gett två format i samma kolumn.
        ogonblicksbildEvent: e?.namn ?? 'Okänt event',
        ogonblicksbildEventdatum: e?.startdatum ?? null,
        skapadAv: `${policy?.kallaPrefix ?? 'Backfill'} (${utfall.kod}; pris ur ${utfall.prisbild?.prisKalla ?? 'okänd källa'})`,
      });
    } else if (utfall.beslut === BESLUT.avvikelse) {
      avvikelser.push(rad);
    } else {
      hoppade.push(rad);
    }
  }

  return {
    backfill,
    avvikelser,
    hoppade,
    eventpriser: planeraEventpriser({ event, standarder, anmalningar, policy }),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Mätningen (AC #3)
// ───────────────────────────────────────────────────────────────────────────

/**
 * FÖRE/EFTER-talen. `andelAlltBetalt` redovisas mot TVÅ nämnare med avsikt:
 * mot alla anmälningar (det tal som ser lågt ut) och mot dem vars pris är
 * känt (det tal som faktiskt mäter härledningens sanning). Ett ensamt tal
 * hade dolt att nämnaren är det som saknas i staging.
 */
export function berknaMatning({ anmalningar, event, standarder, inbetalningarPerAnmalan }) {
  const eventMap = new Map(event.map((e) => [e.id, e]));
  let medKantPris = 0;
  let alltBetalt = 0;
  let summa = 0;
  let antalInbetalningar = 0;

  for (const a of anmalningar) {
    const e = a.eventId ? (eventMap.get(a.eventId) ?? null) : null;
    const std = e ? (standarder.get(standardNyckel(e.namn, e.typ)) ?? null) : null;
    const prisbild = harledPrisbild({ anmalan: a, event: e, standard: std });
    const poster = inbetalningarPerAnmalan.get(a.id) ?? [];
    antalInbetalningar += poster.length;

    const h = harledBetalning(poster, {
      avtalatPris: a.avtalatPris ?? null,
      eventPris: prisbild.pris,
      anmalningsavgift: prisbild.anmalningsavgift,
      eventTyp: prisbild.eventTyp,
    });
    summa = avrundaOre(summa + h.summa);
    if (h.gallandePris !== null) medKantPris += 1;
    if (h.alltKlart) alltBetalt += 1;
  }

  return {
    antalAnmalningar: anmalningar.length,
    antalInbetalningar,
    summaKronor: summa,
    antalMedKantPris: medKantPris,
    antalAlltBetalt: alltBetalt,
    andelAlltBetaltAvAlla: anmalningar.length === 0 ? 0 : alltBetalt / anmalningar.length,
    andelAlltBetaltAvKantPris: medKantPris === 0 ? 0 : alltBetalt / medKantPris,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Airtable-lagret
// ───────────────────────────────────────────────────────────────────────────

async function airtableHamtaAlla(basId, tabell, token, pausMs) {
  const ut = [];
  let offset;
  do {
    const u = new URL(`${AIRTABLE_API_URL}/${basId}/${encodeURIComponent(tabell)}`);
    u.searchParams.set('pageSize', '100');
    if (offset) u.searchParams.set('offset', offset);
    const svar = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
    if (!svar.ok) {
      throw new Error(`Airtable ${tabell}: HTTP ${svar.status} ${await svar.text()}`);
    }
    const kropp = await svar.json();
    ut.push(...kropp.records);
    offset = kropp.offset;
    if (offset) await paus(pausMs);
  } while (offset);
  return ut;
}

async function airtablePatch(basId, tabell, recordId, falt, token) {
  const u = `${AIRTABLE_API_URL}/${basId}/${encodeURIComponent(tabell)}/${recordId}`;
  const svar = await fetch(u, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: falt }),
  });
  if (!svar.ok) {
    throw new Error(
      `Airtable PATCH ${tabell}/${recordId}: HTTP ${svar.status} ${await svar.text()}`,
    );
  }
  return svar.json();
}

const paus = (ms) => new Promise((klar) => setTimeout(klar, ms));

/**
 * Läser ETT Airtable-fält vid NAMN.
 *
 * Namnet skickas som argument och inte som en literal nyckel, och det är
 * inte kosmetik: Airtable-fält läses BY NAME genom hela repot för
 * bas-portabilitet prod↔staging (ADR-050, samma val som
 * `send-receipt-email/index.ts` § readEventKvittoFalt motiverar), och en
 * hjälpare gör den avsikten explicit i stället för att gömma den i
 * hakparenteser. Att den dessutom tystar `lint/complexity/useLiteralKeys` —
 * vars föreslagna punktnotation ändå är omöjlig för namn som `E-post` och
 * `Pris (kr)` — är en följd, inte skälet.
 */
const falt = (fields, namn) => fields[namn];

const forstaLank = (varde) =>
  Array.isArray(varde) && typeof varde[0] === 'string' ? varde[0] : null;
const tal = (varde) => (typeof varde === 'number' && Number.isFinite(varde) ? varde : null);
const text = (varde) => (typeof varde === 'string' && varde !== '' ? varde : null);

export function lasAnmalanRad(record) {
  const f = record.fields;
  const fornamn = falt(f, 'Förnamn') ?? '';
  const efternamn = falt(f, 'Efternamn') ?? '';
  return {
    id: record.id,
    namn: `${fornamn} ${efternamn}`.trim(),
    eventId: forstaLank(falt(f, 'Event')),
    anmalningsavgiftFack: text(falt(f, 'Anmälningsavgift')),
    slutbetalningFack: text(falt(f, 'Slutbetalning')),
    avtalatPris: tal(falt(f, 'Avtalat pris (kr)')),
    summaInbetaltSpegel: tal(falt(f, 'Summa inbetalt (kr)')),
    status: text(falt(f, 'Status')),
  };
}

export function lasEventRad(record) {
  const f = record.fields;
  return {
    id: record.id,
    namn: text(falt(f, 'Event (source)')),
    typ: text(falt(f, 'Typ')),
    ort: text(falt(f, 'Ort')),
    startdatum: text(falt(f, 'Startdatum')),
    pris: tal(falt(f, 'Pris (kr)')),
    anmalningsavgift: tal(falt(f, 'Anmälningsavgift (kr)')),
  };
}

export function lasStandardRad(record) {
  const f = record.fields;
  return {
    id: record.id,
    namn: text(falt(f, 'Event')),
    typ: text(falt(f, 'Typ')),
    pris: tal(falt(f, 'Pris (kr)')),
    anmalningsavgift: tal(falt(f, 'Anmälningsavgift (kr)')),
    // FRITEXTEN, inte de numeriska fälten. `Pris` och `Anmälningsavgift` är
    // Lottas ursprungliga textfält (`data-model.md`: `"2.500"` / `"1000:-"`);
    // `Pris (kr)` ovan är TASK-346.2:s numeriska tillskott BREDVID dem.
    // Fritexten byter aldrig typ (ADR-128 beslut 7).
    prisFritext: text(falt(f, 'Pris')),
    anmalningsavgiftFritext: text(falt(f, 'Anmälningsavgift')),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Postgres-lagret (supabase db query)
// ───────────────────────────────────────────────────────────────────────────

async function lasSupabaseCliVersion() {
  const innehall = await readFile(join(REPO_ROT, SUPABASE_CLI_POLICY_FIL), 'utf8');
  const trafF = innehall.match(/^SUPABASE_CLI_VERSION="([^"]+)"/m);
  if (!trafF) throw new Error(`Kunde inte läsa SUPABASE_CLI_VERSION ur ${SUPABASE_CLI_POLICY_FIL}`);
  return trafF[1];
}

export async function lasProdRef() {
  try {
    const innehall = await readFile(join(REPO_ROT, '.prod-ref-policy.conf'), 'utf8');
    return innehall.match(/^PROD_REF_PROD="([^"]+)"/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Kör SQL via `supabase db query`.
 *
 * `--linked --project-ref <ref>` är den enda formen som når ett fjärrprojekt
 * UTAN att först köra `supabase link` — mätt 2026-08-31: `--project-ref`
 * ensamt faller med `LegacyDbQueryMutuallyExclusiveFlagsError`, medan paret
 * fungerar mot ett OLÄNKAT träd. Det är avgörande här: `supabase link` skriver
 * `supabase/.temp/project-ref`, och det tillståndet är STICKY och osynligt
 * (CLAUDE.md § Prod-EF-deploy). En backfill ska inte lämna en länkning efter
 * sig som nästa kommando i katalogen ärver.
 */
function korSql(sql, { ref, cliVersion, timeoutMs = 240_000 }) {
  const katalog = mkdtempSync(join(tmpdir(), 'backfill-inbetalningar-'));
  const fil = join(katalog, 'backfill.sql');
  try {
    writeFileSync(fil, sql, 'utf8');
    const resultat = spawnSync(
      'npx',
      [`supabase@${cliVersion}`, 'db', 'query', '--linked', '--project-ref', ref, '-f', fil],
      { encoding: 'utf8', timeout: timeoutMs, cwd: REPO_ROT },
    );
    if (resultat.error) throw new Error(`supabase db query: ${resultat.error.message}`);
    if (resultat.status !== 0) {
      throw new Error(
        `supabase db query exit ${resultat.status}\n${resultat.stdout ?? ''}\n${resultat.stderr ?? ''}`,
      );
    }
    return parsaDbQuerySvar(resultat.stdout);
  } finally {
    rmSync(katalog, { recursive: true, force: true });
  }
}

/**
 * Plockar ut `rows` ur CLI:ts svar.
 *
 * Utdatan är JSON men INTE bara JSON: CLI:t skriver `Initialising login
 * role...` före och en versionsnotis efter, båda på stdout. Att `JSON.parse`
 * hela strömmen faller därför. Vi klipper från första `{` till sista `}` —
 * och kastar hellre än gissar när det inte går.
 */
export function parsaDbQuerySvar(stdout) {
  const text = String(stdout ?? '');
  const start = text.indexOf('{');
  const slut = text.lastIndexOf('}');
  if (start === -1 || slut <= start) {
    throw new Error(`Kunde inte hitta JSON i db query-svaret:\n${text.slice(0, 400)}`);
  }
  let kropp;
  try {
    kropp = JSON.parse(text.slice(start, slut + 1));
  } catch (fel) {
    throw new Error(`db query-svaret är inte giltig JSON: ${fel.message}`);
  }
  if (kropp?._tag === 'Error') {
    throw new Error(`db query-fel: ${kropp.error?.code ?? '?'} ${kropp.error?.message ?? ''}`);
  }
  return Array.isArray(kropp?.rows) ? kropp.rows : [];
}

// ───────────────────────────────────────────────────────────────────────────
// Spegeln
// ───────────────────────────────────────────────────────────────────────────

/**
 * Bygger spegelpatchen och validerar den mot EF-lagrets allowlist.
 *
 * Kontrollen är inte ceremoni: skriptet skriver med en PAT som kan röra
 * VILKET fält som helst i basen, alltså en bredare rättighet än EF:en har.
 * Att köra samma `findDisallowedField` som `_shared/betalningar-bas.ts` gör
 * att backfillen inte kan skriva ett fält betalnings-spegeln inte äger — och
 * att en framtida drift i allowlisten fäller HÄR, före anropet.
 *
 * `null` hoppas över precis som i `skrivSpegel`: ett fack härledningen inte
 * kan avgöra ska lämnas orört, aldrig rensas.
 */
export function byggSpegelPatch(harledning) {
  const patch = { 'Summa inbetalt (kr)': harledning.summa };
  if (harledning.anmalningsavgiftVarde !== null) {
    patch['Anmälningsavgift'] = harledning.anmalningsavgiftVarde;
  }
  if (harledning.slutbetalningVarde !== null) {
    patch['Slutbetalning'] = harledning.slutbetalningVarde;
  }

  const operation = getOperation(SPEGEL_OPERATION);
  if (!operation) throw new Error(`Okänd allowlist-operation: ${SPEGEL_OPERATION}`);
  const otillatet = findDisallowedField(operation, patch);
  if (otillatet !== null) {
    throw new Error(`Fältet "${otillatet}" är inte tillåtet för ${SPEGEL_OPERATION}`);
  }
  return patch;
}

// ───────────────────────────────────────────────────────────────────────────
// Rapporten
// ───────────────────────────────────────────────────────────────────────────

function skrivRapport({ plan, fore, efter, utfor, ref, basId }) {
  const r = [];
  r.push('');
  r.push('═══ BACKFILL AV INBETALNINGAR (TASK-346.8) ═══');
  r.push(`  Läge:            ${utfor ? 'SKARPT (--utfor)' : 'DRY-RUN (default)'}`);
  r.push(`  Airtable-bas:    ${basId}`);
  r.push(`  Supabase-projekt: ${ref}`);
  r.push('');
  r.push('── Del A: eventpriser att fylla ──');
  if (plan.eventpriser.length === 0) {
    r.push('  (inga — varje event med anmälningar bär redan sina numeriska priser,');
    r.push('   eller saknar en Eventinnehåll-standard att hämta dem ur)');
  }
  for (const e of plan.eventpriser) {
    r.push(`  ${e.eventId}  ${e.namn} · ${e.ort}  (${e.antalAnmalningar} anmälningar)`);
    for (const [falt, varde] of Object.entries(e.falt)) {
      r.push(`      ${falt} = ${varde}   ← ${e.kallor[falt]}`);
    }
  }
  r.push('');
  r.push('── Del B: inbetalningar att skapa ──');
  if (plan.backfill.length === 0) r.push('  (inga)');
  for (const p of plan.backfill) {
    r.push(
      `  ${p.anmalanRecordId}  ${(p.namn || '(namnlös)').padEnd(20)} ${String(p.belopp).padStart(8)} kr  ` +
        `[${p.kod}]  ${p.event} · ${p.ort}`,
    );
  }
  r.push('');
  r.push('── AVVIKELSER (för Marcus — aldrig gissade) ──');
  if (plan.avvikelser.length === 0) r.push('  (inga)');
  const perKod = new Map();
  for (const a of plan.avvikelser) perKod.set(a.kod, [...(perKod.get(a.kod) ?? []), a]);
  for (const [kod, rader] of perKod) {
    r.push(`  ${kod} (${rader.length} st): ${rader[0].skal}`);
    for (const a of rader) {
      r.push(
        `      ${a.anmalanRecordId}  ${(a.namn || '(namnlös)').padEnd(20)} ` +
          `${a.event ?? '?'} · ${a.ort ?? '?'}  avg=${a.fackAvgift ?? '-'} slut=${a.fackSlut ?? '-'}`,
      );
    }
  }
  r.push('');
  r.push('── Överhoppade ──');
  const hoppPerKod = new Map();
  for (const h of plan.hoppade) hoppPerKod.set(h.kod, (hoppPerKod.get(h.kod) ?? 0) + 1);
  for (const [kod, antal] of hoppPerKod) r.push(`  ${String(antal).padStart(4)}  ${kod}`);
  r.push('');
  r.push('── MÄTNING (AC #3) ──');
  const rad = (etikett, f, e) =>
    r.push(`  ${etikett.padEnd(34)} ${String(f).padStart(12)} → ${String(e ?? f).padStart(12)}`);
  rad('antal anmälningar', fore.antalAnmalningar, efter?.antalAnmalningar);
  rad('antal inbetalningar', fore.antalInbetalningar, efter?.antalInbetalningar);
  rad('summa (kr)', fore.summaKronor, efter?.summaKronor);
  rad('anmälningar med känt pris', fore.antalMedKantPris, efter?.antalMedKantPris);
  rad('varav "allt betalt"', fore.antalAlltBetalt, efter?.antalAlltBetalt);
  rad(
    'andel allt betalt (av alla)',
    procent(fore.andelAlltBetaltAvAlla),
    efter ? procent(efter.andelAlltBetaltAvAlla) : undefined,
  );
  rad(
    'andel allt betalt (av känt pris)',
    procent(fore.andelAlltBetaltAvKantPris),
    efter ? procent(efter.andelAlltBetaltAvKantPris) : undefined,
  );
  r.push('');
  return r.join('\n');
}

const procent = (andel) => `${(andel * 100).toFixed(1)} %`;

// ───────────────────────────────────────────────────────────────────────────
// main
// ───────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { utfor: false, json: false, ref: null, bas: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--utfor') args.utfor = true;
    else if (a === '--json') args.json = true;
    else if (a === '--dry-run') args.utfor = false;
    else if (a === '--projekt-ref') args.ref = argv[++i];
    else if (a === '--bas') args.bas = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Okänd flagga: ${a}`);
  }
  return args;
}

const HJALP = `
backfill-inbetalningar.mjs — historiska inbetalningar ur basens sanning (TASK-346.8)

  npm run backfill:inbetalningar                 dry-run (default), skriver ingenting
  npm run backfill:inbetalningar -- --utfor      skarp körning
  npm run backfill:inbetalningar -- --json       maskinläsbar plan

Flaggor:
  --utfor              skriv faktiskt (annars ren planering)
  --json               skriv planen som JSON i stället för text
  --projekt-ref <ref>  Supabase-projekt (default: policyns enda tillåtna)
  --bas <appXXXX>      Airtable-bas (default: policyns expectedBaseId)

Prod är AC #4 — ett ÖPPET kriterium för Marcus. Skriptet vägrar prod-refen.
`;

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (fel) {
    console.error(`❌ ${fel.message}`);
    console.error(HJALP);
    process.exit(1);
  }
  if (args.help) {
    console.log(HJALP);
    process.exit(0);
  }

  let policy;
  try {
    policy = JSON.parse(await readFile(join(REPO_ROT, POLICY_FIL), 'utf8'));
  } catch (fel) {
    console.error(`❌ Kunde inte läsa ${POLICY_FIL}: ${fel.message}`);
    process.exit(1);
  }

  const basId = args.bas ?? policy.expectedBaseId;
  const ref = args.ref ?? policy.tillatnaProjectRefs?.[0];
  const prodRef = await lasProdRef();

  try {
    validateBaseGuard(policy, basId);
    validateProjectRef(policy, ref, prodRef);
  } catch (fel) {
    console.error(`❌ Guard: ${fel.message}`);
    process.exit(1);
  }

  const token = process.env.STAGING_AIRTABLE_TOKEN ?? (await lasTokenUrEnvFil());
  if (!token) {
    console.error('❌ STAGING_AIRTABLE_TOKEN saknas (env eller .env.seed)');
    process.exit(1);
  }

  // Semaforen EFTER de egna guardsen och FÖRE första Airtable-anropet — samma
  // ordning `purge-staging-sentinels.mjs` och `seed-review-fixture.mjs` följer.
  kravStagingLedigt('backfill-inbetalningar');

  const cliVersion = await lasSupabaseCliVersion();
  const pausMs = policy.airtablePausMs ?? 220;

  let anmalningar;
  let event;
  let standarder;
  let narvaroPerAnmalan;
  try {
    const [rawAnm, rawEv, rawEi, rawDelt] = [
      await airtableHamtaAlla(basId, 'Anmälningar', token, pausMs),
      await airtableHamtaAlla(basId, 'Eventplanering', token, pausMs),
      await airtableHamtaAlla(basId, 'Eventinnehåll', token, pausMs),
      await airtableHamtaAlla(basId, 'Deltaganden', token, pausMs),
    ];
    anmalningar = rawAnm.map(lasAnmalanRad);
    event = rawEv.map(lasEventRad);
    standarder = new Map(rawEi.map(lasStandardRad).map((s) => [standardNyckel(s.namn, s.typ), s]));
    narvaroPerAnmalan = new Set();
    const narvaro = new Set(policy.narvaroStatus ?? []);
    for (const d of rawDelt) {
      if (!narvaro.has(falt(d.fields, 'Status'))) continue;
      for (const id of falt(d.fields, 'Anmälan') ?? []) narvaroPerAnmalan.add(id);
    }
  } catch (fel) {
    console.error(`❌ Airtable: ${fel.message}`);
    process.exit(2);
  }

  let inbetalningarPerAnmalan;
  let historikPerAnmalan;
  try {
    ({ inbetalningarPerAnmalan, historikPerAnmalan } = await lasInbetalningar({
      ref,
      cliVersion,
      betalsatt: policy.betalsatt ?? 'Historik',
    }));
  } catch (fel) {
    console.error(`❌ Postgres: ${fel.message}`);
    process.exit(2);
  }

  const plan = planera({
    anmalningar,
    event,
    standarder,
    narvaroPerAnmalan,
    historikPerAnmalan,
    policy,
  });

  const fore = berknaMatning({ anmalningar, event, standarder, inbetalningarPerAnmalan });

  if (!args.utfor) {
    if (args.json) {
      console.log(JSON.stringify({ plan, fore, utfor: false }, null, 2));
    } else {
      console.log(skrivRapport({ plan, fore, efter: null, utfor: false, ref, basId }));
      console.log('DRY-RUN — ingenting skrevs. Kör om med --utfor för skarp körning.\n');
    }
    process.exit(0);
  }

  // ── SKARP KÖRNING ────────────────────────────────────────────────────────
  try {
    // Del A: eventpriserna FÖRST — härledningen nedan ska se dem.
    for (const e of plan.eventpriser) {
      await airtablePatch(basId, 'Eventplanering', e.eventId, e.falt, token);
      console.log(`  ✅ eventpris ${e.eventId} ${JSON.stringify(e.falt)}`);
      await paus(pausMs);
    }

    // Del B: Postgres-raderna, en idempotent sats per post.
    if (plan.backfill.length > 0) {
      const sql = plan.backfill.map((p) => byggInsertSats(p, policy)).join('\n');
      korSql(sql, { ref, cliVersion });
      console.log(`  ✅ ${plan.backfill.length} insert-satser körda (idempotenta)`);
    }

    // Del C: spegeln — EFTER Postgres, aldrig före (EF:ens ordning).
    const efterInbetalningar = await lasInbetalningar({
      ref,
      cliVersion,
      betalsatt: policy.betalsatt ?? 'Historik',
    });
    const eventEfter = (await airtableHamtaAlla(basId, 'Eventplanering', token, pausMs)).map(
      lasEventRad,
    );
    const eventMapEfter = new Map(eventEfter.map((e) => [e.id, e]));

    for (const p of plan.backfill) {
      const a = anmalningar.find((x) => x.id === p.anmalanRecordId);
      const e = a?.eventId ? (eventMapEfter.get(a.eventId) ?? null) : null;
      const std = e ? (standarder.get(standardNyckel(e.namn, e.typ)) ?? null) : null;
      const prisbild = harledPrisbild({ anmalan: a, event: e, standard: std });
      const poster = efterInbetalningar.inbetalningarPerAnmalan.get(p.anmalanRecordId) ?? [];
      const harledning = harledBetalning(poster, {
        avtalatPris: a?.avtalatPris ?? null,
        eventPris: prisbild.pris,
        anmalningsavgift: prisbild.anmalningsavgift,
        eventTyp: prisbild.eventTyp,
      });
      const patch = byggSpegelPatch(harledning);
      await airtablePatch(basId, 'Anmälningar', p.anmalanRecordId, patch, token);
      console.log(`  ✅ spegel ${p.anmalanRecordId} ${JSON.stringify(patch)}`);
      await paus(pausMs);
    }

    const anmalningarEfter = (await airtableHamtaAlla(basId, 'Anmälningar', token, pausMs)).map(
      lasAnmalanRad,
    );
    const efter = berknaMatning({
      anmalningar: anmalningarEfter,
      event: eventEfter,
      standarder,
      inbetalningarPerAnmalan: efterInbetalningar.inbetalningarPerAnmalan,
    });

    console.log(skrivRapport({ plan, fore, efter, utfor: true, ref, basId }));
  } catch (fel) {
    console.error(`❌ Skarp körning avbröts: ${fel.message}`);
    process.exit(2);
  }
  process.exit(0);
}

async function lasInbetalningar({ ref, cliVersion, betalsatt }) {
  const rader = korSql(
    'select anmalan_record_id, belopp, status, betalsatt from public.inbetalningar;',
    { ref, cliVersion },
  );
  const inbetalningarPerAnmalan = new Map();
  const historikPerAnmalan = new Set();
  for (const rad of rader) {
    const id = rad.anmalan_record_id;
    const belopp = Number(rad.belopp);
    if (!inbetalningarPerAnmalan.has(id)) inbetalningarPerAnmalan.set(id, []);
    inbetalningarPerAnmalan.get(id).push({ belopp, status: rad.status });
    if (rad.betalsatt === betalsatt) historikPerAnmalan.add(id);
  }
  return { inbetalningarPerAnmalan, historikPerAnmalan };
}

async function lasTokenUrEnvFil() {
  try {
    const innehall = await readFile(join(REPO_ROT, '.env.seed'), 'utf8');
    return innehall.match(/^STAGING_AIRTABLE_TOKEN=(.*)$/m)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

// Kör bara som CLI, aldrig vid import från testsviten.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
