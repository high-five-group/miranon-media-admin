/**
 * [TASK-368.5] Ombokningens kvitto: FORMEN som bärs från bekräftelsesteget till
 * den NYA anmälans sida, plus routerns `HistoryState`-augmentering.
 *
 * Modulen är avsiktligt fri från React: den importeras av BÅDA sidorna av
 * navigeringen (`OmbokningsSteg` sätter kvittot, `OmbokningsKvitto` läser det),
 * och det är importen som gör `HistoryState`-augmenteringen nedan laddad i
 * båda. En augmentering i en av komponenterna hade varit osynlig för den andra
 * tills någon råkade importera den.
 *
 * TEXT- OCH TALLOGIKEN BOR I `ombokning-pris.ts` sedan `TASK-368.7` — se den
 * filens huvud för varför augmenteringen nedan tvingar fram det snittet
 * (`TS2664` i tests-projektet). Konsumenter importerar därifrån; denna fil bär
 * bara typen och augmenteringen.
 */

/**
 * Kvittot Lotta möter på den nya anmälans sida — SERVERNS EGNA TAL, inget
 * omräknat.
 *
 * `summaNyAnmalan` och inte `flyttadSumma`: det senare är PER ANROP och är `0`
 * vid en omkörning trots att pengarna sitter rätt sedan förra gången
 * (`RebookRegistration.schema.ts` § "PER ANROP — INTE ETT TILLSTÅND", och
 * review-fyndet på `#2247` runda 1). Ett kvitto beskriver ett TILLSTÅND, så
 * räknaren hör inte hemma här.
 */
export type OmbokningsKvittoData = {
  /** Anmälan kvittot gäller — vaktar mot att ett gammalt kvitto visas på fel sida. */
  nyAnmalanId: string;
  /** Eventets namn så kvittot kan sägas i klartext utan en extra hämtning. */
  nyttEventNamn: string;
  /** Aktiva inbetalningar på den NYA anmälan efter operationen. Stabilt över omkörningar. */
  summaNyAnmalan: number;
  /** Priset som gäller på den nya anmälan. `null` = okänt pris. */
  nyttPris: number | null;
  /** Positiv = saknas, negativ = att återbetala, `null` = okänt. */
  prisskillnad: number | null;
  /** `true` = allt var redan gjort; anropet ändrade ingenting. */
  aterupptaget: boolean;
};

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Ombokningens kvitto (TASK-368.5) — satt av bekräftelsen, läst EN gång
        av den nya anmälans sida. Samma engångsfat-idiom som `mmAvsloja`
        (`ManuellAnmalanForm.tsx`) och `mmAtgardsUrval` (`Deltagare.tsx`):
        ett kvitto är varken durabelt eller delbart, så det hör inte hemma i
        URL:en (URL-STATE-SPEC § "allt som påverkar VAD som visas"). */
    mmOmbokningsKvitto?: OmbokningsKvittoData;
  }
}
