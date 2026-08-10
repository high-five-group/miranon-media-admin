// Kvittonummer-allokeraren (TASK-147.7, ADR-109) — REN, dependency-injicerad
// och Deno-global-fri i sin yta → Node-importerbar för api-pure-kontraktstest
// (mockade gränser) OCH Deno-importerbar av send-receipt-email-EF:en. SAMMA
// uppdelning som `_shared/send-action-email.ts` (TASK-147.1) och
// `_shared/confirm-registrations.ts` (task-18.6) — repots FJÄRDE
// mail-adjacenta vertikal ärver den bevisade DI-formen.
//
// VARFÖR EN EGEN ALLOKERINGSPROTOKOLL (inte ett enkelt "läs max, +1, skriv"):
// Airtable saknar strukturellt UNIQUE-constraint (P1), transaktioner (P2) och
// därmed server-side atomisk increment (P3) —
// docs/reference/airtable-constraints.md § A. Ett naivt "läs-högsta, skriv"
// har ett race-fönster: två samtidiga allokeringar kan båda läsa samma
// högsta-värde INNAN någon av dem hunnit skriva sitt eget, och skulle då
// båda försöka ta SAMMA löpnummer.
//
// PROTOKOLLET (läs-högsta + skriv-med-unikhetsverifikation + retry, kortets
// egen föreslagna form): per försök —
//   1. Läs ALLA ledger-poster för året, räkna fram högsta löpnumret (eller
//      KVITTO_START - 1 om året är tomt).
//   2. Skriv en kandidat-post med löpnummer = högsta + 1 DIREKT (billigt,
//      ETT Airtable-anrop) — INGEN väntan på ett andra "är vägen fri"-anrop
//      FÖRE skrivningen, eftersom ett sådant anrop bara flyttar race-fönstret,
//      inte stänger det.
//   3. Läs OM ledger-posterna för samma löpnummer. Är kandidaten ENSAM om
//      numret har den vunnit — returnera den.
//   4. Är den INTE ensam (en konkurrerande allokering skrev SAMMA löpnummer
//      i samma fönster): deterministisk tie-break — den post vars record-ID
//      sorterar LÄGST (lexikografiskt) vinner. Är det INTE min post: min
//      kandidat var en FÖRLORAD allokering som ALDRIG lämnat serverns
//      minne som ett utfärdat kvitto (inget mail skickat, ingen kund såg
//      numret) — den TAS BORT (`remove`) och försöket görs om från steg 1
//      med ett FÄRSKT högsta-värde.
//
// "INGEN RETROAKTIV OMNUMRERING" (AC #2) gäller UTFÄRDADE kvitton — en post
// vars nummer redan lämnat allokeringen (vunnit steg 3/4 och sänts till en
// kund) ändras ALDRIG efteråt. Detta protokoll rör bara kandidater INNAN de
// vunnit racet — en förlorad kandidat blev aldrig ett utfärdat kvitto, så att
// ge den ett NYTT nummer i nästa varv är inte en omnumrering av något
// existerande, det är att fullfölja EN allokering som ännu inte lyckats.
//
// KÄND, ÖPPET ACCEPTERAD RISK (samma disciplin som P1/P2 i väggkatalogen):
// Airtables läs-efter-skriv-konsistens är INTE dokumenterat momentan i alla
// lägen. Ett extremt osannolikt fönster (två `listByYear`-anrop som båda
// missar varandras just-skrivna rader) skulle kunna ge en DUBBLETT som detta
// protokoll inte upptäcker. Risken accepteras öppet — samma "smalt
// multi-session-race-fönster, single-admin-golv"-linje som P1 drar för hela
// basens skrivmodell. Se ADR-109 § Öppna punkter.

/** Kvittoseriens start — MM-2026-1001 (Marcus-beslut S102, kortets Implementation Notes b). */
export const KVITTO_START = 1001;

/** "MM-<år>-<löpnummer>" — synligt avgränsad från Rogers fakturaserie. */
export function formatKvittonummer(ar: number, lopnummer: number): string {
  return `MM-${ar}-${lopnummer}`;
}

/** En existerande ledger-post — det allokeraren behöver för att räkna högsta + tie-breaka. */
export type KvittoLedgerEntry = {
  id: string;
  lopnummer: number;
  ar: number;
};

/** Läs ALLA ledger-poster för ett givet år (obegränsad — basen är liten, se ADR-109). */
export type LedgerReader = (ar: number) => Promise<KvittoLedgerEntry[]>;

/** Skriv en NY kandidat-post. Returnerar dess record-ID (tie-break-nyckeln). */
export type LedgerWriter = (ar: number, lopnummer: number) => Promise<{ id: string }>;

/** Ta bort en FÖRLORAD kandidat-post (aldrig en utfärdad — se filhuvudet). */
export type LedgerRemover = (id: string) => Promise<void>;

export type ReceiptAllocationDeps = {
  listByYear: LedgerReader;
  create: LedgerWriter;
  remove: LedgerRemover;
};

export type AllocatedReceiptNumber = {
  id: string;
  kvittonummer: string;
  lopnummer: number;
  ar: number;
};

export class ReceiptAllocationExhaustedError extends Error {
  constructor(attempts: number) {
    super(
      `Kunde inte allokera ett unikt kvittonummer efter ${attempts} försök — ` +
        'ovanligt hög samtidighet. Försök igen.',
    );
    this.name = 'ReceiptAllocationExhaustedError';
  }
}

function hogstaLopnummer(entries: readonly KvittoLedgerEntry[]): number {
  let hogsta = KVITTO_START - 1;
  for (const e of entries) {
    if (e.lopnummer > hogsta) hogsta = e.lopnummer;
  }
  return hogsta;
}

/**
 * Allokera nästa kvittonummer för `ar` — se filhuvudets protokollbeskrivning.
 * `maxAttempts` (default 20) är en SÄKERHETSVENTIL, inte en förväntad kostnad:
 * normalfallet (Lotta, ensam admin) tar EN runda. Se
 * `tests/api/receipt-numbering.test.ts` § samtidighet för N-vägs-beviset.
 */
export async function allocateReceiptNumber(
  ar: number,
  deps: ReceiptAllocationDeps,
  opts: { maxAttempts?: number } = {},
): Promise<AllocatedReceiptNumber> {
  const maxAttempts = opts.maxAttempts ?? 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const existing = await deps.listByYear(ar);
    const kandidatLopnummer = hogstaLopnummer(existing) + 1;
    const created = await deps.create(ar, kandidatLopnummer);

    const efter = await deps.listByYear(ar);
    const samaNummer = efter.filter((e) => e.lopnummer === kandidatLopnummer);

    // Ensam om numret (normalfallet) — vunnet, ingen kollision att lösa.
    if (samaNummer.length <= 1) {
      return {
        id: created.id,
        kvittonummer: formatKvittonummer(ar, kandidatLopnummer),
        lopnummer: kandidatLopnummer,
        ar,
      };
    }

    // Kollision — deterministisk tie-break: lexikografiskt lägsta record-ID vinner.
    const vinnareId = [...samaNummer].map((e) => e.id).sort()[0];
    if (vinnareId === created.id) {
      return {
        id: created.id,
        kvittonummer: formatKvittonummer(ar, kandidatLopnummer),
        lopnummer: kandidatLopnummer,
        ar,
      };
    }

    // Förlorad — aldrig utfärdad (inget mail skickat med detta nummer ännu).
    // Ta bort och försök igen med ett färskt högsta-värde.
    await deps.remove(created.id);
  }

  throw new ReceiptAllocationExhaustedError(maxAttempts);
}
