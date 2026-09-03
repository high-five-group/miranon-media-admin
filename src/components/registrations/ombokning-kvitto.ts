import { visaKronor } from '@/components/betalningar/belopp-inmatning';

/**
 * [TASK-368.5] Ombokningens kvitto: formen som bärs från bekräftelsesteget
 * till den NYA anmälans sida, och de rena funktioner som formulerar dess text.
 *
 * Modulen är avsiktligt fri från React: den importeras av BÅDA sidorna av
 * navigeringen (`OmbokningsSteg` sätter kvittot, `OmbokningsKvitto` läser det),
 * och det är importen som gör `HistoryState`-augmenteringen nedan laddad i
 * båda. En augmentering i en av komponenterna hade varit osynlig för den andra
 * tills någon råkade importera den.
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

/** Vilken betalningsväg prisskillnaden pekar mot, om någon. */
export type Prisvag = 'inbetalning' | 'aterbetalning' | null;

export type Prisbesked = {
  /** Meningen Lotta läser. Alltid en hel mening, alltid utan valuta-gissning. */
  text: string;
  vag: Prisvag;
};

/**
 * [AC #3] Prisskillnaden sagd rakt ut, i EN formulering som används både i
 * bekräftelsesteget och i kvittot efteråt — "efter bekräftelse visas SAMMA
 * text" är kortets ordalydelse, och två kopior hade kunnat glida isär.
 *
 * TECKNET ÄR SERVERNS: `prisskillnad` är `harledBetalning`s `saknas` för den
 * NYA anmälan, alltså nytt pris minus de aktiva inbetalningar som nu sitter
 * där. Positiv ⇒ personen ska betala mellanskillnaden; negativ ⇒ pengar ska
 * tillbaka; `0` ⇒ jämnt ut. Ingen egen prisregel härleds här.
 *
 * `null` PÅSTÅS ALDRIG VARA NOLL. Saknas priset (eventet har varken eget pris
 * eller en Eventinnehåll-standard) kan vi inte veta om något saknas — och
 * "samma pris" hade då varit ett påstående utan täckning. Texten säger i
 * stället att priset är okänt, och pekar mot ingen betalningsväg alls.
 */
export function prisbesked(nyttPris: number | null, prisskillnad: number | null): Prisbesked {
  if (prisskillnad === null) {
    return {
      text: 'Priset på det nya eventet är inte satt, så prisskillnaden går inte att räkna ut.',
      vag: null,
    };
  }

  const kostar = nyttPris === null ? null : `Nya eventet kostar ${visaKronor(nyttPris)} kr`;

  if (prisskillnad === 0) {
    // Kort bindestreck finns inte här, och det är inte kosmetik:
    // `scripts/check-langa-streck.mjs` (CI-wirad) fäller långt streck i varje
    // användar-synlig sträng, `TemplateElement` inkluderad. Kommatecknet bär
    // samma paus och matchar AC #3:s egen ordform ("… eller 'samma pris'").
    return { text: kostar === null ? 'Samma pris.' : `${kostar}, samma pris.`, vag: null };
  }

  const belopp = `${visaKronor(Math.abs(prisskillnad))} kr`;
  const slut =
    prisskillnad < 0 ? `${belopp} blir att återbetala.` : `${belopp} saknas på den nya anmälan.`;

  return {
    text: kostar === null ? slut.charAt(0).toUpperCase() + slut.slice(1) : `${kostar}, ${slut}`,
    vag: prisskillnad < 0 ? 'aterbetalning' : 'inbetalning',
  };
}

/**
 * Skälets text, EXAKT som servern kommer att skriva den — mål-delen av
 * `byggOmbokningsrad` (`supabase/functions/_shared/rebook-registration.ts`
 * § `byggOmbokningsmal`), utan dess datum-/aktörsstämpel.
 *
 * KÄLLPARITETEN ÄR MÄTT, INTE ANTAGEN (2026-09-03): serverns `lasEvent` läser
 * `namn` ur `selectName(f['Event (source)'])` och `startdatum` ur
 * `f['Startdatum']`; klientens `Event.eventNamn`/`startdatum` kommer ur
 * `_shared/event-map.ts` § `mapEventBas` — SAMMA två Airtable-fält, samma
 * coercion. Därför kan förhandsvisningen vara en sann utsaga om vad som
 * kommer att stå i Noteringen, i stället för en ungefärlig.
 *
 * DATUMET LÄMNAS I ISO-FORM med avsikt: serverns rad bär `Startdatum` rått
 * (`byggOmbokningsmal` gör ingen formatering), och ett svenskt långdatum här
 * hade gjort förhandsvisningen visuellt trevligare och sakligt falsk.
 */
export function ombokningsskal(eventNamn: string | null, startdatum: string | null): string {
  const namn = eventNamn?.trim() ? eventNamn.trim() : 'okänt event';
  const datumDel = startdatum?.trim() ? `, ${startdatum.trim()}` : '';
  return `Ombokad till ${namn}${datumDel}`;
}
