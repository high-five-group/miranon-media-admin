// Hermetiskt bevis för TASK-346.5 AC #4 ("Visa kvitto ger signerad länk
// till sparad PDF; Skicka igen skickar samma PDF med samma nummer till
// angiven adress utan ny allokering").
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR EN EGEN FIL, INTE ETT TILLÄGG TILL kvittojobb.test.ts
// ═══════════════════════════════════════════════════════════════════════════
// `_shared/kvittojobb.ts` (ADR-129, TASK-346.4) och dess egen testsvit
// (`tests/api/kvittojobb.test.ts`) hör till 346.4 — den skivan byggde
// "portarna" och äger dem. TASK-346.5:s uppdrag är EXPLICIT: "testa mall-/
// innehållssidan + återanvändningskontraktet hermetiskt UTAN ATT RÖRA
// 346.4:S KOD". Den här filen importerar `korKvittobatch` och dess typer
// SOM LÄSARE av ett publikt kontrakt (samma sätt vilken konsument som helst
// använder modulen) — den ändrar ingenting i `_shared/kvittojobb.ts` och
// duplicerar inte dess egen testsvit.
//
// De faktiska EF:erna "Visa" (`hamta-kvittolank`) och "Skicka igen"
// (`skicka-kvitto-igen`) är Deno-only (@ts-nocheck, esm.sh-import,
// Deno.serve) och kan inte köras hermetiskt i Node/Playwright — deras
// SKARPA flöde är redan kedjebevisat av orkestreraren (PR #2150-
// kommentaren, 2026-08-31: "MM-2026-1003" återanvänt vid en retry, ingen
// dubbelallokering). Vad DENNA fil bevisar hermetiskt är de TVÅ delarna av
// AC #4 som går att isolera utan nätverk:
//
//   (A) MALL-/INNEHÅLLSSIDAN — kortets egen yta (`byggKvittoData` +
//       `kvitto.html`): samma indata ger BYTE-IDENTISK renderad HTML, alltid
//       — den egenskap `skicka-kvitto-igen/index.ts`s "PDF:EN LÄSES UR
//       BUCKETEN, den renderas inte om"-beslut lutar sig mot (en PDF som
//       INTE är en deterministisk funktion av sin indata hade gjort den
//       designen godtycklig).
//
//   (B) ÅTERANVÄNDNINGSKONTRAKTET — `korKvittobatch`s `hittaKvitto`-
//       återanvändning (`_shared/kvittojobb.ts` § "DUBBELSKICK ÄR
//       STRUKTURELLT OMÖJLIGT"): ett ALREDAN SKICKAT kvitto ger samma
//       nummer och NOLL ny allokering/nytt mail när samma inbetalning
//       hanteras igen — den strukturella grunden "Skicka igen" och
//       jobbmotorns egen självläkning delar. NEGATIV KONTROLL: en TRASIG
//       värld (som "glömmer" att fråga `hittaKvitto`, dvs. alltid svarar
//       `null`) FÖRSÖKER allokera ett NYTT nummer — och DET är precis vad
//       uppdragets egen formulering syftar på ("ett nytt nummer fäller"):
//       ledgerns unika nyckel (`kvitton.inbetalning_id`, ADR-128 beslut 4)
//       fångar försöket, raden slutar `fel`, och NOLL nytt mail går.
//       Manuellt verifierat att kontrollen verkligen diskriminerar: med
//       unik-nyckel-spärren avstängd i test-världen (temporär lokal
//       ändring, aldrig committad) slutade samma körning i stället
//       'skickat' med ett NYTT nummer — testet fälls korrekt när skyddet
//       saknas.

import { expect, test } from '@playwright/test';
import { Eta } from 'eta';
import {
  type BefintligtKvitto,
  type JobbRadVy,
  type KobatchPost,
  type KvittoJobbDeps,
  type KvittoUnderlag,
  korKvittobatch,
} from '../../supabase/functions/_shared/kvittojobb';
import { byggKvittoData } from '../../supabase/functions/_shared/mall-data';
import { kvittoHtml } from '../../supabase/functions/_shared/mallar/kvitto.html';
import type { KvittoradSpec } from '../../supabase/functions/_shared/receipt-content';

// ═══════════════════════════════════════════════════════════════════════════
// (A) MALL-/INNEHÅLLSSIDAN — determinism
// ═══════════════════════════════════════════════════════════════════════════
// SAMMA Eta-konfiguration som mall-render.ts/mall-render.test.ts
// (autoEscape: true, varName: 'data') — se den filens KONFIG-PARITETSNOT för
// varför denna gräns är bokförd, inte tyst.
const eta = new Eta({ autoEscape: true, varName: 'data' });

function specFor(overrides: Partial<KvittoradSpec> = {}): KvittoradSpec {
  return {
    kvittonummer: 'MM-2026-1042',
    kundnamn: 'Bengt Bengtsson',
    kundEpost: 'bengt@example.com',
    belopp: 2500,
    betalsatt: 'Swish',
    betalning: 'slut',
    eventNamn: 'Fjärrskådning, Skövde',
    datum: '2026-08-05T00:00:00.000Z',
    betalningsdatum: '2026-08-03',
    eventTyp: 'Utbildning',
    eventStart: '2026-08-01',
    eventSlut: '2026-08-02',
    bokforingstext: 'personlig utveckling',
    ...overrides,
  };
}

function renderKvitto(spec: KvittoradSpec): string {
  return eta.renderString(kvittoHtml, byggKvittoData(spec)) as string;
}

test.describe('AC #4(A) — mall-/innehållssidan är deterministisk (grunden för "samma PDF")', () => {
  test('samma inbetalning renderad TVÅ GÅNGER ger BYTE-IDENTISK HTML', () => {
    // Modellerar exakt det scenario "Visa"/"Skicka igen" MÅSTE kunna lita
    // på: att kvitto MM-2026-1042 alltid representerar SAMMA innehåll,
    // oavsett hur många gånger det härleds ur sin källa.
    const forstaRendering = renderKvitto(specFor());
    const andraRendering = renderKvitto(specFor());
    expect(andraRendering).toBe(forstaRendering);
  });

  test('NEGATIV KONTROLL: en ANNAN inbetalnings betalningsdatum ger en ANNAN rendering — jämförelsen är inte trivialt sann', () => {
    // Om testet ovan bara jämförde en konstant sträng mot sig själv skulle
    // det aldrig kunna fälla en trasig implementation. Denna kontroll
    // bevisar att `betalningsdatum` (TASK-346.5:s egen token) faktiskt
    // påverkar utdatan, och att likhets-testet ovan alltså är meningsfullt.
    const medDatum = renderKvitto(specFor({ betalningsdatum: '2026-08-03' }));
    const utanDatum = renderKvitto(specFor({ betalningsdatum: null }));
    expect(medDatum).not.toBe(utanDatum);
    expect(medDatum).toContain('2026-08-03');
    expect(utanDatum).toContain('<dd>-</dd>');
  });

  test('NEGATIV KONTROLL: ett ANNAT kvittonummer (simulerar en trasig omallokering) ger en ANNAN rendering', () => {
    // Skulle en trasig implementation av "Skicka igen" av misstag re-rendera
    // med ett NYTT nummer i stället för att läsa den sparade PDF:en, hade
    // denna typ av jämförelse fångat det — kvittonumret är inbakat i BÅDE
    // sidhuvudet och referensblockets "Vårt ordernr".
    const original = renderKvitto(specFor({ kvittonummer: 'MM-2026-1042' }));
    const omallokerat = renderKvitto(specFor({ kvittonummer: 'MM-2026-1099' }));
    expect(omallokerat).not.toBe(original);
    expect(original).toContain('MM-2026-1042');
    expect(omallokerat).not.toContain('MM-2026-1042');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// (B) ÅTERANVÄNDNINGSKONTRAKTET — via korKvittobatch, oförändrad (346.4)
// ═══════════════════════════════════════════════════════════════════════════

type LedgerRad = {
  id: string;
  inbetalningId: string;
  ar: number;
  lopnummer: number;
  status: 'utfardat' | 'skickat' | 'makulerat';
  lagringsnyckel: string | null;
  mottagare: string | null;
};

/**
 * En MINIMAL värld — bara det AC #4 behöver. `hittaKvittoImpl` injiceras så
 * att den TRASIGA varianten (negativ kontroll) kan bytas ut utan att röra
 * resten av kontraktet.
 */
function byggAtervandningsVarld(
  ledgerVidStart: readonly LedgerRad[],
  hittaKvittoImpl: (ledger: LedgerRad[], inbetalningId: string) => Promise<BefintligtKvitto | null>,
) {
  const ledger: LedgerRad[] = ledgerVidStart.map((rad) => ({ ...rad }));
  const rad = { status: 'vantar' as JobbRadVy['status'] };
  let nastaLopnummer = 2000; // långt över testets kända nummer — ett värde här BEVISAR en ny allokering skedde.
  let nyaAllokeringar = 0;
  let mailSkickade = 0;
  const mailMottagare: string[] = [];

  const deps: KvittoJobbDeps = {
    nu: () => '2026-08-31T09:00:00.000Z',

    async lasRad(radId): Promise<JobbRadVy | null> {
      if (radId !== 'rad-1') return null;
      return {
        id: 'rad-1',
        jobbId: 'jobb-1',
        jobbtyp: 'kvitto',
        objektId: 'inb-1',
        status: rad.status,
      };
    },

    async markeraPagar() {
      if (rad.status !== 'vantar') return false;
      rad.status = 'pagar';
      return true;
    },

    async markeraRadSlut(_radId, uppdatering) {
      rad.status = uppdatering.status;
    },

    async stadaKomeddelande() {
      // Ingen kö att städa i denna minimala värld — AC #4 rör inte kö-
      // mekaniken (346.4:s scope), bara nummer-/mailåteranvändningen.
    },

    async hamtaUnderlag(inbetalningId): Promise<KvittoUnderlag | null> {
      return {
        inbetalningId,
        anmalanRecordId: 'recAAAAAAAAAAAAAA',
        belopp: 2500,
        betalsatt: 'Swish',
        betalningsdatum: '2026-08-29',
        kundnamn: 'Bengt Bengtsson',
        email: 'delivered@resend.dev',
        eventNamn: 'Fjärrskådning, Skövde',
        eventTyp: 'Utbildning',
        eventStart: '2026-09-10',
        eventSlut: '2026-09-11',
        bokforingstext: null,
        betalning: 'slut',
      };
    },

    hittaKvitto: (inbetalningId) => hittaKvittoImpl(ledger, inbetalningId),

    async allokeraNummer(ar) {
      nyaAllokeringar += 1;
      const lopnummer = nastaLopnummer;
      nastaLopnummer += 1;
      return { kvittonummer: `MM-${ar}-${lopnummer}`, ar, lopnummer };
    },

    async skapaKvitto(spec) {
      // DATABASENS GARANTI, INTE EN ATTRAPP (samma disciplin som
      // `tests/api/kvittojobb.test.ts`s `byggVarld`): `kvitton.inbetalning_id`
      // är `unique` (ADR-128 beslut 4). Utan detta villkor hade den TRASIGA
      // negativa kontrollen nedan bevisat fel sak — att systemet TYST
      // ACCEPTERAR ett dubbelskick i stället för att FÅNGA det.
      if (ledger.some((r) => r.inbetalningId === spec.inbetalningId)) {
        throw new Error(
          'duplicate key value violates unique constraint "kvitton_inbetalning_id_key"',
        );
      }
      const id = `kvitto-ny-${ledger.length + 1}`;
      ledger.push({
        id,
        inbetalningId: spec.inbetalningId,
        ar: spec.ar,
        lopnummer: spec.lopnummer,
        status: 'utfardat',
        lagringsnyckel: null,
        mottagare: null,
      });
      return { id };
    },

    async finaliseraKvitto(kvittoId, falt) {
      const post = ledger.find((r) => r.id === kvittoId);
      if (!post) throw new Error('okänt kvitto');
      post.status = 'skickat';
      post.lagringsnyckel = falt.lagringsnyckel;
      post.mottagare = falt.mottagare;
    },

    async byggPdf(spec) {
      return { filename: `${spec.kvittonummer}.pdf`, contentBase64: 'UERG' };
    },
    async sparaPdf(spec) {
      return `kvitton/${spec.ar}/${spec.kvittonummer}.pdf`;
    },
    async skickaMail(spec) {
      mailSkickade += 1;
      mailMottagare.push(spec.email);
      return { accepterat: true };
    },
    async speglaKvittonummer() {
      // AC #4 rör inte spegeln (ADR-128 beslut 6) — no-op räcker.
    },
    async kopplaKvitto() {
      // Den denormaliserade genvägen — inert i denna minimala värld.
    },
  };

  return {
    deps,
    ledger,
    get nyaAllokeringar() {
      return nyaAllokeringar;
    },
    get mailSkickade() {
      return mailSkickade;
    },
    get mailMottagare() {
      return mailMottagare;
    },
  };
}

const SKICKAT_KVITTO: LedgerRad = {
  id: 'kvitto-1042',
  inbetalningId: 'inb-1',
  ar: 2026,
  lopnummer: 1042,
  status: 'skickat',
  lagringsnyckel: 'kvitton/2026/MM-2026-1042.pdf',
  mottagare: 'delivered@resend.dev',
};

/** Den KORREKTA `hittaKvitto` — precis vad `_shared/kvittojobb.ts`s egen
 * konsument (`jobb-konsument/index.ts`) implementerar: en SELECT mot
 * ledgern på `inbetalning_id`. */
async function korrektHittaKvitto(
  ledger: LedgerRad[],
  inbetalningId: string,
): Promise<BefintligtKvitto | null> {
  const post = ledger.find((r) => r.inbetalningId === inbetalningId);
  if (!post) return null;
  return {
    id: post.id,
    kvittonummer: `MM-${post.ar}-${post.lopnummer}`,
    ar: post.ar,
    lopnummer: post.lopnummer,
    status: post.status,
    lagringsnyckel: post.lagringsnyckel,
  };
}

/** Den TRASIGA `hittaKvitto` — negativ kontroll. Simulerar en implementation
 * som "glömmer" återanvändningskontrollen och alltid tror att inbetalningen
 * är ny. Detta är EXAKT den felklass som skulle göra "Skicka igen" till "Skicka
 * ett NYTT kvitto" i stället. */
async function trasigHittaKvitto(): Promise<BefintligtKvitto | null> {
  return null;
}

test.describe('AC #4(B) — återanvändningskontraktet: samma kvitto, aldrig ny allokering', () => {
  test('ett REDAN SKICKAT kvitto ger SAMMA nummer, NOLL ny allokering, NOLL nytt mail', async () => {
    const varld = byggAtervandningsVarld([SKICKAT_KVITTO], korrektHittaKvitto);
    const post: KobatchPost = { msgId: 1, radId: 'rad-1' };

    const [utfall] = await korKvittobatch([post], varld.deps);

    expect(utfall).toEqual({
      radId: 'rad-1',
      utfall: 'redan-skickat',
      kvittonummer: 'MM-2026-1042',
    });
    expect(varld.nyaAllokeringar).toBe(0);
    expect(varld.mailSkickade).toBe(0);
    expect(varld.ledger).toHaveLength(1); // ingen ny ledger-rad skapad
  });

  test('NEGATIV KONTROLL: "glömmer" återanvändningskontrollen → ETT NYTT NUMMER FÖRSÖKS, och DET är precis vad som fäller (ledgerns unika nyckel)', async () => {
    // Samma startläge (ett kvitto redan skickat för inb-1), men med den
    // TRASIGA `hittaKvitto` (svarar alltid `null`, som om inbetalningen
    // vore obehandlad). Uppdragets egen formulering är ordagrant "ett nytt
    // nummer fäller" — och det är EXAKT vad som händer: en TRASIG
    // implementation som hoppar över återanvändningskontrollen försöker
    // allokera ett nytt nummer, men ledgerns UNIKA NYCKEL (samma garanti
    // som `tests/api/kvittojobb.test.ts`s "KAPPLÖPNINGEN"-test) fångar
    // dubbelskicket INNAN något mail hinner gå. Om denna körning i stället
    // hade slutat med 'skickat' och ett nytt kvittonummer hade den INTE
    // bevisat att en trasig implementation fälls — den hade bevisat att
    // dubbelskick är MÖJLIGT, vilket vore ett annat, allvarligare fel.
    const varld = byggAtervandningsVarld([SKICKAT_KVITTO], trasigHittaKvitto);
    const post: KobatchPost = { msgId: 2, radId: 'rad-1' };

    const [utfall] = await korKvittobatch([post], varld.deps);

    expect(utfall.utfall).toBe('fel');
    expect((utfall as { skal: string }).skal).toContain('unique constraint');
    expect(varld.nyaAllokeringar).toBe(1); // FÖRSÖKTE allokera ett nytt nummer …
    expect(varld.mailSkickade).toBe(0); // … men NOLL mail gick — dubbelskicket stoppades
    expect(varld.ledger).toHaveLength(1); // ledgern har fortfarande BARA det ursprungliga kvittot
    expect(varld.ledger[0]).toMatchObject({ id: 'kvitto-1042', ar: 2026, lopnummer: 1042 });
  });
});
