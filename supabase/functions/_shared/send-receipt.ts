// Kvittots sändorkestrator (TASK-147.7, ADR-109) — REN, dependency-injicerad
// och Deno-global-fri i sin yta → Node-importerbar för api-pure-kontraktstest
// (mockade gränser) OCH Deno-importerbar av send-receipt-email-EF:en. SAMMA
// uppdelning som `_shared/send-action-email.ts` (TASK-147.1).
//
// VARFÖR EN EGEN, MINDRE ORKESTRATOR OCH INTE EN FEMTE `ActionType` PÅ
// `runActionSend` (send-action-email.ts): den bilage-bärande grenen där
// (`runActionSendWithAttachments`, TASK-147.5) hämtar bilagornas bytes EN
// GÅNG, DELAD av alla mottagare i loopen — klass A/B, "inte klass C:s
// per-mottagare-generering, utanför denna skivas scope" (samma fils egen
// docblock, punkt 3, och `generate-event-attachment/index.ts`s SAMTIDIGHETS-
// NOT). Ett kvitto är per definition UNIKT per mottagare (eget nummer, eget
// belopp, eget PDF-innehåll) — att pressa in det i en "delad bilaga"-loop
// hade krävt att bygga om just den delade-hämtningen till per-mottagare-
// generering, vilket ÄR denna skivas jobb, inte en tilläggsgren på 147.5:s
// befintliga kontrakt. Mekaniken ÅTERANVÄNDS ändå utan att kopieras:
// SINGELLOOP-FORMEN (ett `/emails`-anrop per mottagare, no-throw-inspektion,
// per-mottagare idempotensnyckel, aldrig binär status) är EXAKT samma
// disciplin som `runActionSendWithAttachments` — se `ReceiptSender` nedan.
//
// SCOPE (v1, Marcus-beslut S102 Implementation Notes a–d): EN mottagare, EN
// betalning per anrop — UI:t triggas per betalnings-kryss (`BetalningsSkrivYta`
// § `SkrivRad`, AtgardsSida.tsx), inte ett bulk-urval. "En betalning
// kvitteras i exakt ETT system" (beslut a) läses här som "en sändning = en
// betalning" — inget tekniskt hinder mot en framtida bulk-brygga (samma
// orkestrator anropad i loop av en klientsida bulk-knapp), men ingen sådan
// knapp finns i v1 (parkerad idé, `BetalningsSkrivYta`s egen docblock punkt
// 2 nämner samma typ av parkering för "markera alla").
//
// INGEN FÄLT-SKRIVNING PÅ ANMÄLNINGAR (beslut d): kvittot stämplar INGET
// fält på den underliggande anmälan. Dess EGEN existens (Kvitton-tabellen,
// `recordReceipt`) ÄR beständigheten — en efterföljande av-bockning av
// betalnings-krysset (`useSetPaymentStatus`) rör en ANNAN tabellrad helt och
// kan strukturellt inte påverka en redan skapad Kvitton-post. "Kvittot
// består med sitt nummer + notering" (beslut d) är därför inte kod som måste
// skrivas här — det är en EGENSKAP hos att de två tabellerna aldrig kopplas
// ihop av någon skrivande operation.

import { NonProdAddressError, RESEND_TEST_ADDRESSES, UtskickSparratError } from './send-bulk.ts';
import type { AllocatedReceiptNumber, ReceiptAllocationDeps } from './receipt-numbering.ts';
import { allocateReceiptNumber } from './receipt-numbering.ts';

export type Betalning = 'avgift' | 'slut';

export const BETALNING_LABEL: Record<Betalning, string> = {
  avgift: 'Anmälningsavgift',
  slut: 'Slutbetalning',
};

export type Betalsatt = 'Swish' | 'Bankgiro' | 'Plusgiro';
export const BETALSATT_VARDEN: readonly Betalsatt[] = ['Swish', 'Bankgiro', 'Plusgiro'];

export type ReceiptSendInput = {
  registrationId: string;
  eventId: string;
  betalning: Betalning;
  /** Kronor, positivt heltal eller decimal — Lotta-inmatat (basen saknar ett prisfält, se ADR-109 § Öppna punkter). */
  belopp: number;
  betalsatt: Betalsatt;
  kundnamn: string;
  email: string;
  eventNamn: string | null;
  /** [TASK-306] Event-tabellens `Typ` (Utbildning/Föreläsning). */
  eventTyp: string | null;
  /** [TASK-306] ISO — Event-tabellens `Startdatum`. */
  eventStart: string | null;
  /** [TASK-306] ISO — Event-tabellens `Slutdatum`. */
  eventSlut: string | null;
  /** [TASK-306] Event-tabellens frivilliga `Bokföringstext (kvitto)`. */
  bokforingstext: string | null;
  /** Klientens Idempotency-Key (UUID v4) — sänd-nyckeln härleds `<jobId>/kvitto/<registrationId>/<betalning>`. */
  jobId: string;
  /** ENVIRONMENT === 'production'. Fail-closed: allt annat → false (EF:ens ansvar). */
  isProd: boolean;
  /**
   * [TASK-274] `isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))` — klassificerat
   * i EF:en, samma per-EF-läsmönster som `isProd`. Sant → `sendReceipt` kastar
   * `UtskickSparratError` FÖRE allt annat (även före kvitto-nummer-allokering),
   * oberoende av `isProd`.
   */
  utskickSparrat: boolean;
  /** Tidsstämpeln som skrivs/räknas år ur — injicerad så testet slipper systemklockan. */
  nu: string;
};

/** Kvittots renderade innehåll (ADR-109: datum, belopp, betalsätt, event, kundnamn, org-uppgifter — INGEN momsrad). */
export type ReceiptPdf = { filename: string; contentBase64: string };

export type ReceiptPdfBuilder = (spec: {
  kvittonummer: string;
  kundnamn: string;
  /** Köparens e-post (S108, Marcus-beslut 2026-08-22) — `input.email`, härledd server-side, se `sendReceipt` nedan. */
  kundEpost: string;
  belopp: number;
  betalsatt: Betalsatt;
  betalning: Betalning;
  eventNamn: string | null;
  datum: string;
  /** [TASK-306] Se `ReceiptSendInput` — trådas oförändrat till `kvittoBenamning`
   * (via `byggKvittoData`, `_shared/mall-data.ts`, sedan TASK-309.5 — INTE
   * längre direkt till `kvittoRader`, som saknar produktionskonsument efter
   * denna skiva, se `receipt-content.ts`:s filhuvud). */
  eventTyp: string | null;
  eventStart: string | null;
  eventSlut: string | null;
  bokforingstext: string | null;
}) => Promise<ReceiptPdf>;

/**
 * Injicerad SINGEL-sänd-gräns — samma disciplin som `ActionSingleSender`
 * (send-action-email.ts): kastar INTE för radfel, `{accepted, reason?}`
 * no-throw-inspekteras av orkestratorn.
 */
export type ReceiptSender = (
  spec: { email: string; kundnamn: string; kvittonummer: string; pdf: ReceiptPdf },
  ctx: { idempotencyKey: string },
) => Promise<{ accepted: boolean; reason?: string }>;

/**
 * FINALISERAR (PATCH) den REDAN ALLOKERADE Kvitton-raden (`allocated.id` ur
 * `receipt-numbering.ts`) med de fält allokeringen INTE kände till — den
 * skriver aldrig en NY rad. Detta är MEDVETET: reservationsraden och den
 * beständiga posten är SAMMA record, annars hade en avvisad sändning (steg
 * 5 nedan) lämnat en spårlös, oidentifierbar reservation kvar i ledgern
 * (kvittonummer utan Anmälan/Betalning-koppling). Att en avvisad sändning
 * lämnar en ofinaliserad rad (bara Kvittonummer/Löpnummer/År satta, inget
 * `Skickad`) är den öppet accepterade konsekvensen (ADR-109 § Öppna
 * punkter) — numret "hoppas över", ALDRIG omnumrerat eller återanvänt.
 */
export type ReceiptFinalizer = (
  id: string,
  fields: {
    registrationId: string;
    eventId: string;
    betalning: Betalning;
    belopp: number;
    betalsatt: Betalsatt;
    kundnamn: string;
    skickad: string;
    lagringsnyckel: string | null;
  },
) => Promise<void>;

/**
 * [TASK-302.3, ADR-124 § Beslut 2] Best-effort städning av det transienta
 * förhandsgransknings-utkastet (`_shared/utkast.ts` § `rensaUtkast`) —
 * anropad EFTER lyckad sändning (steg 7 nedan), ALDRIG före: ett utkast ska
 * finnas kvar om sändningen avvisas (steg 5). Injicerad som en FEMTE
 * I/O-gräns — inte global — av SAMMA skäl som `sendEmail`/`finalizeReceipt`:
 * filen är REN och Node-importerbar för api-pure-kontraktstestet
 * (`tests/api/send-receipt.test.ts`), som aldrig får röra en riktig Storage-
 * klient (`_shared/utkast.ts` drar transitivt in ett `esm.sh`-URL-import via
 * `attachments.ts`, oimporterbart i Node). Den RIKTIGA implementationen
 * (`makeRealDraftCleaner`, `send-receipt-email/index.ts`) delegerar till
 * `rensaUtkast`, som redan loggar och sväljer sina egna fel — men
 * `sendReceipt` litar inte blint på det, se steg 7.
 */
export type ReceiptDraftCleaner = (eventId: string) => Promise<void>;

export type ReceiptSendDeps = {
  ledger: ReceiptAllocationDeps;
  buildPdf: ReceiptPdfBuilder;
  sendEmail: ReceiptSender;
  finalizeReceipt: ReceiptFinalizer;
  cleanupDraft: ReceiptDraftCleaner;
};

export type ReceiptSendResult =
  | { status: 'sent'; kvittonummer: string; lopnummer: number; ar: number; receiptId: string }
  | { status: 'failed'; reason: string };

/** Idempotensnyckeln — DETERMINISTISK per (jobId, registrationId, betalning), skild från de fyra åtgärdstypernas namnrymd (`<jobId>/<actionType>/<registrationId>`). */
export function receiptIdempotencyKey(
  jobId: string,
  registrationId: string,
  betalning: Betalning,
): string {
  return `${jobId}/kvitto/${registrationId}/${betalning}`;
}

/**
 * Kör EN kvittosändning. Ordning är lastbärande:
 *  0. [TASK-274] UTSKICKS-SPÄRR (Marcus-flip) FÖRE ALLT — `input.utskickSparrat`
 *     sant → kasta `UtskickSparratError`, oberoende av miljö. FÖRE till och med
 *     kvitto-numrets allokering (steg 2): ett nummer ska aldrig förbrukas för
 *     ett mail som ändå inte får skickas.
 *  1. ICKE-PROD-SPÄRR (GOLV, ÅTERANVÄND ur send-bulk.ts — ALDRIG kringgången
 *     eller kopierad) — FÖRE allokering: ett kvitto-NUMMER ska aldrig
 *     förbrukas för ett mail som ändå inte kunde skickas i den här miljön.
 *  2. Allokera kvittonummer (server-side, `_shared/receipt-numbering.ts`) —
 *     året härleds ur `input.nu`, inte klientens systemklocka.
 *  3. Bygg PDF:en ur den ALLOKERADE nummern + beslut (c)-innehållet.
 *  4. Sänd EN gång, deterministisk per-mottagare-idempotensnyckel (AC #2-
 *     arvet: samma disciplin som 147.5:s singelloop).
 *  5. Avvisad sändning → 'failed', INGEN Kvitton-post skrivs (numret är
 *     "förbrukat" i ledgern som en existerande rad utan `Skickad`-stämpel —
 *     se ADR-109 § Öppna punkter för den öppet accepterade konsekvensen: en
 *     retroaktiv NY sändning för samma betalning allokerar ett NYTT nummer,
 *     den gamla ledger-raden lämnas orörd som spårbar historik, aldrig
 *     omnumrerad).
 *  6. Accepterad → persistera Kvitton-posten (beständigheten, beslut d).
 *  7. [TASK-302.3, ADR-124] Städa det transienta förhandsgransknings-
 *     utkastet för eventet (`deps.cleanupDraft`) — EFTER steg 6, aldrig
 *     före. Dubbelt best-effort: `cleanupDraft`s implementation sväljer
 *     redan sina egna fel, men ett kastat fel HÄR fångas ändå — ett
 *     städningsfel får ALDRIG göra en redan lyckad, redan finaliserad
 *     sändning se ut som misslyckad för Lotta.
 */
export async function sendReceipt(
  input: ReceiptSendInput,
  deps: ReceiptSendDeps,
): Promise<ReceiptSendResult> {
  if (input.utskickSparrat) {
    throw new UtskickSparratError();
  }

  const email = input.email.trim();
  if (!input.isProd && !RESEND_TEST_ADDRESSES.includes(email)) {
    throw new NonProdAddressError([email]);
  }

  const ar = new Date(input.nu).getUTCFullYear();
  const allocated: AllocatedReceiptNumber = await allocateReceiptNumber(ar, deps.ledger);

  const pdf = await deps.buildPdf({
    kvittonummer: allocated.kvittonummer,
    kundnamn: input.kundnamn,
    kundEpost: email,
    belopp: input.belopp,
    betalsatt: input.betalsatt,
    betalning: input.betalning,
    eventNamn: input.eventNamn,
    datum: input.nu,
    eventTyp: input.eventTyp,
    eventStart: input.eventStart,
    eventSlut: input.eventSlut,
    bokforingstext: input.bokforingstext,
  });

  const idempotencyKey = receiptIdempotencyKey(input.jobId, input.registrationId, input.betalning);
  const outcome = await deps.sendEmail(
    { email, kundnamn: input.kundnamn, kvittonummer: allocated.kvittonummer, pdf },
    { idempotencyKey },
  );

  if (!outcome.accepted) {
    return { status: 'failed', reason: outcome.reason ?? 'Okänt fel — mailet avvisades.' };
  }

  await deps.finalizeReceipt(allocated.id, {
    registrationId: input.registrationId,
    eventId: input.eventId,
    betalning: input.betalning,
    belopp: input.belopp,
    betalsatt: input.betalsatt,
    kundnamn: input.kundnamn,
    skickad: input.nu,
    lagringsnyckel: null,
  });

  // [TASK-302.3, ADR-124 § Beslut 2] Städa det transienta utkastet EFTER
  // lyckad, redan finaliserad sändning — se docblockets steg 7. Fångar
  // KASTADE fel explicit: den skarpa sändningen är redan klar och ska
  // ALDRIG rapporteras som misslyckad på grund av en städnings-detalj.
  try {
    await deps.cleanupDraft(input.eventId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[sendReceipt] cleanupDraft fel (fäller inte den redan lyckade sändningen) | ` +
        `event=${input.eventId} | error=${message}`,
    );
  }

  return {
    status: 'sent',
    kvittonummer: allocated.kvittonummer,
    lopnummer: allocated.lopnummer,
    ar: allocated.ar,
    receiptId: allocated.id,
  };
}
