// _shared/belaggning.ts — TASK-373. SSOT för beläggningens ANMÄLNINGS-räkning:
// vilka länkade Anmälningar som fyller eventets tak, och i vilken del.
//
// VARFÖR FILEN FINNS: räkningen låg inline i `get-event/index.ts` och tappade
// tyst varje anmälan vars `Källa` varken var TOM eller '+1'. Prod 2026-09-03
// (RIM 3 Rönninge, Event-25): mätaren visade "12 av 20 platser upptagna" medan
// basen sa 13 — differensen var EN anmälan skapad via appens Ny anmälan
// (`create-registration` → `Källa = 'Manuell'`). Samma hål gällde `Källa =
// 'Väntelista'` (uppflyttning ur kön) och skulle gälla varje FRAMTIDA
// Källa-värde. Utbruten hit för att räkningen ska (a) vara hermetiskt testbar
// utan Airtable och (b) ha exakt EN definition att ändra.
//
// TVÅ INVARIANTER, båda mot basens egna formler (docs/reference/data-model.md
// § Fält tillagda 2026-09-03):
//
//   (1) AKTIV = basens `Anmälningar.Är aktiv (1/0)` (fld4j7PeckDViTdIB):
//       IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1).
//       Sedan TASK-368.1 bygger `Eventplanering.Antal aktiva anmälningar` på
//       den, och `Antal anmälda` = {Antal aktiva anmälningar} + {Manuella
//       platser}. Räknar servern avbokade/inställda blir mätaren en PARALLELL
//       sanning mot basen — därför filtreras de här.
//
//   (2) INGEN AKTIV ANMÄLAN FÅR TAPPAS:
//         viaFormular + medfoljande + ovrigaAnmalningar
//           === antalet aktiva länkade anmälningar
//       Det håller genom konstruktion: `ovrigaAnmalningar` är en FAIL-CLOSED
//       restpost (`else`), inte en uppräkning av kända värden. Ett Källa-värde
//       som läggs till i basen i morgon hamnar där — synligt i summan, aldrig
//       tappat. Prövat i båda riktningar i `tests/api/belaggning.test.ts`.
//
// GRÄNSEN: modulen räknar ANMÄLNINGSRADER. Eventradens egna number-fält
// ('Manuella platser', 'Extra platser') hör till `event-map.ts`s
// kategorifält-mappning och rörs inte här — de är SKRIVBARA fält, inte
// härledda räkningar, och den skillnaden bär hela Ändra-morfens
// "ändrar från"-mönster på eventsidan.
//
// Node-typkollad via `tsconfig.edge-shared.json` (transitivt Deno-fri: enda
// importen är `coerce.ts`, som redan står i den listan).

import { selectName } from './coerce.ts';

/**
 * Statusvärdena som basens `Är aktiv (1/0)`-formel nollar. Speglar
 * `RegistrationStatus.AVBOKAD`/`.INSTALLT` i `src/domain/types/Status.ts` —
 * EF-koden kan inte importera från `src/` (tsconfig-projektgränsen, samma skäl
 * som `betalningsbelopp.ts`s klientspegel), så pariteten vaktas mekaniskt av
 * `tests/api/belaggning.test.ts` § klientparitet i stället för av en import.
 */
export const INAKTIVA_ANMALNINGSSTATUSAR = ['Avbokad/Ombokad', 'Inställt'] as const;

/** `Källa`-värdet för en CompanionModal-medföljande (`RegistrationSource.MEDFOLJANDE`). */
export const KALLA_MEDFOLJANDE = '+1';

/**
 * Anmälnings-fälten räkningen behöver. Skickas som `fields`-listan till
 * Airtable så EF:en aldrig kan glömma `Status` (det var precis vad den gjorde
 * före TASK-373 — fältet hämtades inte alls, och avbokade räknades med).
 */
export const BELAGGNING_ANMALAN_FALT = ['Källa', 'Status'] as const;

/** Airtable-radens form räkningen läser (samma i list- och single-get-svar). */
export type AnmalanRad = { fields: Record<string, unknown> };

/** Beläggningens anmälnings-delar — tillsammans ALLA aktiva länkade anmälningar. */
export type AnmalningsRakning = {
  /** `Källa` TOM = formuläranmälan (frånvaro är sanning, data-model § Källa-värden). */
  viaFormular: number;
  /** `Källa` '+1' = medföljande (CompanionModal). */
  medfoljande: number;
  /**
   * ALLT ANNAT: 'Manuell' (appens Ny anmälan), 'Väntelista' (uppflyttad ur kön)
   * och varje framtida Källa-värde. Restposten är avsiktlig — se invariant (2).
   */
  ovrigaAnmalningar: number;
};

/**
 * Är anmälningsraden AKTIV? Speglar basens `Är aktiv (1/0)` (invariant 1).
 * Saknad/tom Status → AKTIV, samma väg som basformeln tar (`IF(OR(…))` är
 * falskt när fältet är tomt) och samma väg som `arAktivAnmalan` i
 * `src/lib/aktiv-anmalan.ts` tar för `status === null`.
 */
export function arAktivAnmalanRad(fields: Record<string, unknown>): boolean {
  const status = selectName(fields['Status']);
  if (status === null) return true;
  return !(INAKTIVA_ANMALNINGSSTATUSAR as readonly string[]).includes(status);
}

/**
 * Räknar eventets länkade anmälningar i beläggningens tre delar. Inaktiva
 * (avbokade/inställda) hoppas över helt — de fyller ingen plats, precis som i
 * basens `Antal aktiva anmälningar`.
 */
export function raknaAnmalningar(regs: readonly AnmalanRad[]): AnmalningsRakning {
  let viaFormular = 0;
  let medfoljande = 0;
  let ovrigaAnmalningar = 0;

  for (const reg of regs) {
    if (!arAktivAnmalanRad(reg.fields)) continue;
    const kalla = selectName(reg.fields['Källa']);
    if (kalla === null) viaFormular += 1;
    else if (kalla === KALLA_MEDFOLJANDE) medfoljande += 1;
    // FAIL-CLOSED restpost: 'Manuell', 'Väntelista' och varje okänt framtida
    // värde. Aldrig en `else if` per känt värde — då hade nästa Källa-option
    // fallit ur summan tyst, vilket ÄR buggen TASK-373 rättar.
    else ovrigaAnmalningar += 1;
  }

  return { viaFormular, medfoljande, ovrigaAnmalningar };
}
