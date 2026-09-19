import type { OppenBetalning } from '@/domain/schemas';
import { normaliseraBeloppKlient, summeraKronorKlient, visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import { type ImportradIMinnet, importradsklass, oppnaKandidater } from './importminne';
import {
  type Beloppsknapp,
  harledBeloppsknappar,
  harledRad,
  type InkorgsRad,
} from './inkorg-harledningar';

/**
 * [TASK-402.3] Bekräftelsestegets RENA HÄRLEDNINGAR — raden, avstämningen,
 * summeringen, grupperingen, "vad kan registreras nu" och omkörnings-urvalet.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR MODULEN FINNS: FUNKTIONERNA LEVDE I ETT SIMULERINGSLAGER SOM RIVS
 * ═══════════════════════════════════════════════════════════════════════════
 * Fram till promoveringen bodde de här funktionerna i
 * `prototype/bekraftelseSimulering.ts` — samma fil som bär prototypens
 * in-memory-mutation, och som `ADR-103` B2 steg 4 river efter Marcus stämpel
 * (`TASK-402.6`). Härledningarna är däremot INTE prototyp-kod: de bär
 * avstämningen Lotta jämför med kontoutdraget, och de ska överleva rivningen.
 *
 * Flytten är REN — funktionskropparna är oförändrade, ord för ord.
 * `bekraftelseSimulering.ts` RE-EXPORTERAR dem tills den rivs, så
 * `VariantA`/`VariantB`/`radfalt.tsx` fortsätter kompilera utan en enda
 * ändring i sina importrader.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN EGEN PRISREGEL, ALDRIG
 * ═══════════════════════════════════════════════════════════════════════════
 * All prislogik LÅNAS ur `inkorg-harledningar.ts` (`harledRad`,
 * `harledBeloppsknappar`). Det var prototypens krav och det är den skarpa
 * ytans lika hårt: en andra pengalogik vid sidan av inkorgens är exakt det
 * `ADR-128` finns för att förhindra.
 *
 * INGEN REACT HÄR. Modulen är ren indata → utdata och testas som sådan
 * (`tests/api/bekraftelsesteg-harledningar.test.ts`) — hooken som driver
 * tillståndet bor i `useBekraftelsesteg.ts`, formen i `VariantC.tsx`.
 */

/**
 * Beloppsgenvägarna (grillningens beslut 2) plus `forslag` — appens eget
 * förval per rad. BULKVALEN ÄR RIVNA UR FORMEN sedan konvergens varv 12
 * (Marcus), men `forslag` lever kvar som radens startbelopp och typen bärs
 * fortfarande av `VariantA`/`VariantB` tills de rivs i `TASK-402.6`.
 */
export type Beloppsgenvag = 'forslag' | 'avgift' | 'allt' | 'annat';

export const BETALSATT: readonly Betalsatt[] = ['Swish', 'Bankgiro', 'Plusgiro'];

export type RadUtfall = { klass: 'registrerad'; text: string } | { klass: 'fel'; text: string };

export type Kvittoläge = 'ingen' | 'vantar' | 'koad' | 'skickas' | 'skickat' | 'fel';

export type Fas = 'redigera' | 'registrerar' | 'klart';

/** En rad i bekräftelsesteget: den öppna betalningen plus hennes val på plats. */
export type BekraftelseRad = {
  /** Stabil nyckel = anmälans record-ID. */
  nyckel: string;
  /** Härledningen ur `harledRad` — kvar, avgiftKvar, förfallen, obekräftad. */
  inkorg: InkorgsRad;
  /** Beloppsgenvägarnas belopp för DENNA rad (`harledBeloppsknappar`). */
  beloppsknappar: Beloppsknapp[];
  /** Beloppet som ska registreras, som sträng (skrivbart). `''` = inget satt. */
  belopp: string;
  betalsatt: Betalsatt;
  /** ISO-datum, `YYYY-MM-DD`. */
  datum: string;
  medKvitto: boolean;
  /**
   * Markerad = med i registreringen. Raderna kommer markerade från mataren;
   * ett tryck på kortet avmarkerar, som på eventdetaljen och Åtgärds-sidan
   * (`MarkerbartKort`). En avmarkerad rad står kvar i listan, vit, och räknas
   * ingenstans.
   */
  markerad: boolean;
  /** Notering, som i inkorgens formulär. */
  notering: string;
  /**
   * Satt när det SENASTE bulk-beloppsvalet inte gick ihop för raden (avgiften
   * redan betald, eller en föreläsning utan fack). Raden får ingen siffra utan
   * en markering och väntar på hennes hand. Bär vilket val det var.
   */
  ejGenomforbar: Beloppsgenvag | null;
  /**
   * [TASK-402.8 varv 5] LOTTA HAR SPARAT RADFORMULÄRET (Klar) — RADEN ÄR
   * HENNES.
   *
   * ORDALYDELSEN ÄR VIDARE ÄN "skrivit beloppet för hand", och det är den
   * ärliga beskrivningen av koden: `sattRadVarden` sätter flaggan för HELA
   * formuläret — betalsätt, betalningsdatum och notering lika mycket som
   * beloppet. En rad där hon bara bytte betalsätt räknas alltså också som
   * hennes undantag. Det är avsiktligt (hon har varit inne i raden och sagt
   * Klar), men docblocket sade tidigare bara "beloppet" och beskrev därmed
   * ett smalare fält än det som finns.
   *
   * Fältet finns för EN sak: en sådan rad som avmarkeras och markeras igen
   * ska behålla sina värden i stället för att tyst få beloppsläget påtvingat
   * (`beloppForNyMarkerad`). Utan flaggan går hennes undantag förlorat vid
   * ett bock-klick hon uppfattar som ofarligt.
   *
   * SÄTTS av `sattRadBelopp`/`sattRadVarden`, NOLLAS av `sattBeloppslage` —
   * ett läge skriver över undantaget, precis som blockets egen text lovar.
   *
   * ASYMMETRI, ÖPPET BOKFÖRD: `sattGenvag` (varianternas A/B-genvägar) nollar
   * INTE flaggan, till skillnad från `sattBeloppslage`. De två har olika
   * semantik och olika konsumenter — genvägarna rivs med A/B i `TASK-402.6`,
   * så skillnaden harmoniseras inte här utan försvinner med dem.
   */
  handredigerad: boolean;
  /** Registreringens utfall, satt efter "Registrera N". */
  utfall: RadUtfall | null;
  /** Inbetalningens id ur serverns svar; `null` tills raden registrerats. */
  inbetalningId: string | null;
  /**
   * Kvittots läge efter registreringen — inkorgens `kvittolage`-tillstånd:
   * `ingen` (inget kryss), `vantar` (i den session-lokala kön), `koad`/
   * `skickas`/`skickat`/`fel` (utskicksjobbets radstatus).
   */
  kvitto: Kvittoläge;
  kvittonummer: string | null;
  /**
   * [TASK-402.4] BANKRADEN raden kom ur, när mataren var kontoutdraget.
   * `undefined` för den manuella och Åtgärds-sidans matare — fältet är
   * frånvarande, inte tomt, så en rad utan import aldrig kan förväxlas med en
   * importrad vars referens råkade vara `null`.
   */
  import?: Importkoppling;
};

/**
 * Vad en importrad bär med sig in i registreringen.
 *
 * `bankreferens` ÄR DUBBLETTSKYDDET (AC #4). Den skickas med i
 * `registrera-inbetalning` exakt som den gamla bekräftelselistan gjorde, så
 * Postgres partiella unika index (`inbetalningar_bankreferens_unik_idx`) kan
 * avvisa en referens som redan finns och EF:en översätta det till 409
 * `dubblett_bankreferens`. Tappas fältet på vägen till servern försvinner
 * skyddet — därför bor det på RADEN och inte i ett sidoregister som kan glida
 * isär från den.
 */
export type Importkoppling = {
  /** Radens nyckel i importminnet (`rad-<n>`). */
  nyckel: string;
  /** Bankens referens, eller `null` när filen saknar kolumnen. */
  bankreferens: string | null;
  /** Betalarens namn i banken. Skiljer sig ofta från deltagarens. */
  bankNamn: string | null;
};

/** Beloppet en genväg ger för en rad, eller `null` när valet inte går ihop. */
export function genvagsbelopp(rad: BekraftelseRad, genvag: Beloppsgenvag): number | null {
  if (genvag === 'annat') return null;
  if (genvag === 'forslag') return forslagsbelopp(rad.beloppsknappar);
  const knapp = rad.beloppsknappar.find((k) => k.nyckel === genvag);
  return knapp ? knapp.belopp : null;
}

/**
 * Appens förval för en rad (Marcus berättelse, S121 Del 4 § varv 2): finns en
 * avgift kvar att betala är det den — en ny anmälan betalar avgiften först.
 * Är avgiften redan betald är det resten. Saknas båda (pris saknas i basen)
 * finns inget förval.
 */
export function forslagsbelopp(knappar: readonly Beloppsknapp[]): number | null {
  const avgift = knappar.find((k) => k.nyckel === 'avgift');
  if (avgift) return avgift.belopp;
  const allt = knappar.find((k) => k.nyckel === 'allt');
  return allt ? allt.belopp : null;
}

/** Vad radens NUVARANDE belopp är, sett mot radens egna kandidater. */
export type Beloppsklass = 'avgift' | 'resten' | 'allt' | 'annat' | 'saknas';

export function beloppsklass(rad: BekraftelseRad): Beloppsklass {
  const belopp = radbelopp(rad);
  if (belopp === null) return 'saknas';
  for (const k of rad.beloppsknappar) {
    if (k.belopp !== belopp) continue;
    if (k.nyckel === 'avgift') return 'avgift';
    return k.etikett === 'resten' ? 'resten' : 'allt';
  }
  return 'annat';
}

/**
 * Avstämningen i Lottas klumpar: så många anmälningsavgifter, så många
 * slutbetalningar, så mycket. Det är kontoutdragets form — "sex à 1 000 och
 * fyra à 1 500" — och det hon jämför mot innan hon trycker Registrera.
 */
export type Avstamning = { klass: Beloppsklass; antal: number; summa: number }[];

export function avstamning(rader: readonly BekraftelseRad[]): Avstamning {
  const ordning: Beloppsklass[] = ['avgift', 'resten', 'allt', 'annat', 'saknas'];
  const karta = new Map<Beloppsklass, { antal: number; summa: number }>();
  for (const rad of rader) {
    const klass = beloppsklass(rad);
    const post = karta.get(klass) ?? { antal: 0, summa: 0 };
    post.antal += 1;
    post.summa += radbelopp(rad) ?? 0;
    karta.set(klass, post);
  }
  return ordning
    .filter((k) => karta.has(k))
    .map((klass) => ({ klass, ...(karta.get(klass) ?? { antal: 0, summa: 0 }) }));
}

/**
 * Läsbart skäl till att en rad markerats (bulk-valet gick inte ihop). Skiljer
 * "avgiften redan betald" från "föreläsning utan fack" — samma två fall
 * `harledBeloppsknappar` drar bort avgifts-knappen för.
 */
export function markeringsSkal(rad: BekraftelseRad): string {
  const { anmalningsavgift, gallandePris, summaInbetalt } = rad.inkorg.betalning;
  if (rad.ejGenomforbar === 'avgift') {
    if (anmalningsavgift !== null && gallandePris !== null && anmalningsavgift >= gallandePris) {
      return 'Ett pris utan anmälningsavgift. Välj "Allt som saknas" eller skriv beloppet.';
    }
    if (anmalningsavgift !== null && summaInbetalt >= anmalningsavgift) {
      return 'Anmälningsavgiften är redan betald. Välj "Allt som saknas" eller skriv beloppet.';
    }
  }
  if (gallandePris === null) return 'Priset saknas i databasen. Skriv beloppet för hand.';
  return 'Välj ett belopp eller skriv det för hand.';
}

/** Beloppet en rad faktiskt bär, som tal, eller `null` när fältet inte duger. */
export function radbelopp(rad: BekraftelseRad): number | null {
  const tal = normaliseraBeloppKlient(rad.belopp);
  return tal !== null && tal > 0 ? tal : null;
}

/**
 * Kan raden registreras nu? Markerad, giltigt belopp, och inte redan
 * registrerad — en rad vars registrering FALLERADE är omkörbar (inkorgens
 * "försök igen" är att registrera igen).
 */
export function arRegistrerbar(rad: BekraftelseRad): boolean {
  if (!rad.markerad) return false;
  if (rad.utfall?.klass === 'registrerad') return false;
  return radbelopp(rad) !== null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BELOPPSLÄGET (TASK-402.8) — EN REGEL FÖR DE MARKERADE RADERNA
   ═══════════════════════════════════════════════════════════════════════════

   Fyra varv med Marcus ledde hit, och varje varv rev något av det förra:

     varv 1  två fristående knappar som SATTE beloppet en gång
     varv 3  plus en "Återställ förslagen"-knapp för vägen tillbaka
     varv 4  knapparna blev en toggel som visade vilket val som gällde
     varv 5  *"Togglen behöver ju sitta i något. När ingen knapp är vald så
             ser ju knapparna inte ut som knappar utan bara en textsträng på
             grå bakgrund."*

   Svaret på varv 5 är inte en ram runt två knappar utan ett TREDJE LÄGE.
   `Förslag` är inte längre frånvaron av ett val — det ÄR ett val, förvalt och
   lysande från start. Därmed finns inget tomt läge att rita, och
   återställnings-knappen behövs inte: att välja `Förslag` ÄR återställningen.

   LÄGET ÄR EN LEVANDE REGEL, INTE EN ENGÅNGSHANDLING. Det beskriver vad
   kapseln senast gjorde OCH vad en rad som markeras HÄREFTER ska få
   (`beloppForNyMarkerad`). Utan det hade en nymarkerad rad kommit in med sitt
   förslag mitt i ett "Hela beloppet"-läge, och Lotta hade fått en avvikelse
   hon aldrig bad om.

   EN HANDREDIGERING SLÄCKER INTE LÄGET (ändrat i varv 5). Den är hennes
   medvetna undantag från regeln, och raden bär det i `handredigerad` så en
   senare markering inte skriver över det hon just skrev. */

/** Kapselns tre lägen. `forslag` är förvalet och den neutrala vägen tillbaka. */
export type Beloppslage = 'forslag' | 'avgift' | 'allt';

/**
 * Raden saknar ett belopp — den bor i "Behöver din hand".
 *
 * Flyttad hit ur `VariantC.tsx` i `TASK-402.8`: hög-indelningen och
 * lägesregeln måste läsa SAMMA predikat, annars kan en rad vara i högen
 * enligt formen och utanför den enligt regeln.
 */
export function saknarBelopp(rad: BekraftelseRad): boolean {
  return rad.ejGenomforbar !== null || rad.belopp.trim() === '';
}

/**
 * Radens belopp i ett givet läge, eller `null` när läget inte går ihop för
 * raden (avgiften redan betald, pris utan fack, pris saknas i basen).
 *
 * ALL PRISLOGIK LÅNAS, som överallt annars här: `forslagsbelopp` och
 * `genvagsbelopp` läser radens egna kandidater ur inkorgens
 * `harledBeloppsknappar`. Det finns inget delat belopp — priset är per event
 * OCH per person.
 */
export function beloppForLage(rad: BekraftelseRad, lage: Beloppslage): number | null {
  return lage === 'forslag' ? forslagsbelopp(rad.beloppsknappar) : genvagsbelopp(rad, lage);
}

/**
 * Rör läget denna rad? Fyra villkor, alla ur kortets AC #3.
 *
 *   1. MARKERAD. En avmarkerad rad räknas ingenstans och registreras inte.
 *   2. INTE REDAN REGISTRERAD. Raden är bokförd; dess belopp är historik.
 *      (En rad vars registrering FALLERADE är däremot med — den ska kunna
 *      köras om, samma regel som `arRegistrerbar`.)
 *   3. INTE I "BEHÖVER DIN HAND". Högen väntar på Lottas hand.
 *   4. RADEN HAR ETT BELOPP I LÄGET. Saknas kandidaten rörs raden inte alls;
 *      den behåller vad den hade.
 */
export function berorsAvLage(rad: BekraftelseRad, lage: Beloppslage): boolean {
  if (!rad.markerad) return false;
  if (rad.utfall?.klass === 'registrerad') return false;
  if (saknarBelopp(rad)) return false;
  return beloppForLage(rad, lage) !== null;
}

/** Hur många rader läget KAN röra — pillens av/på. */
export function antalILage(rader: readonly BekraftelseRad[], lage: Beloppslage): number {
  return rader.filter((rad) => berorsAvLage(rad, lage)).length;
}

/**
 * Hur många rader läget faktiskt ÄNDRAR — beskedets tal.
 *
 * Skiljer sig från `antalILage` med avsikt: en rad som redan bär lägets
 * belopp ändras inte, och ett besked som räknade den hade sagt "6 belopp
 * satta" när noll flyttade sig.
 */
export function antalAndradeILage(rader: readonly BekraftelseRad[], lage: Beloppslage): number {
  return rader.filter(
    (rad) => berorsAvLage(rad, lage) && radbelopp(rad) !== beloppForLage(rad, lage),
  ).length;
}

/**
 * Raderna efter att ett läge valts. Orörda rader returneras som SAMMA objekt,
 * så React kan se på referensen att kortet inte ändrats.
 *
 * `handredigerad` NOLLAS på de rader läget skriver: hennes undantag är
 * överskrivet, precis som blockets egen text lovar ("Skriver över föreslaget
 * belopp på alla markerade rader").
 */
export function sattBeloppslage(
  rader: readonly BekraftelseRad[],
  lage: Beloppslage,
): BekraftelseRad[] {
  return rader.map((rad) => {
    if (!berorsAvLage(rad, lage)) return rad;
    const belopp = beloppForLage(rad, lage);
    return belopp === null
      ? rad
      : { ...rad, belopp: visaKronor(belopp), ejGenomforbar: null, handredigerad: false };
  });
}

/**
 * Beloppet en rad ska få NÄR DEN MARKERAS, enligt det aktiva läget — eller
 * `null` när raden ska lämnas ifred.
 *
 * TRE FALL LÄMNAS IFRED, och det tredje är hela poängen med `handredigerad`:
 * en registrerad rad (historik), en rad utan kandidat i läget, och en rad
 * Lotta skrivit beloppet på för hand. Utan det sista hade en avmarkering och
 * en ny markering tyst kastat bort hennes siffra.
 *
 * `markerad` PRÖVAS INTE HÄR, till skillnad från `berorsAvLage`: funktionen
 * anropas i samma ögonblick som raden blir markerad, alltså medan fältet
 * fortfarande är `false`.
 */
export function beloppForNyMarkerad(rad: BekraftelseRad, lage: Beloppslage): string | null {
  if (rad.utfall?.klass === 'registrerad') return null;
  if (rad.handredigerad) return null;
  const belopp = beloppForLage(rad, lage);
  return belopp === null ? null : visaKronor(belopp);
}

/**
 * Vilket läge kapseln ska visa som valt. Modellens `aktivGenvag` är bredare
 * än de tre lägena — den bär `annat` åt varianterna A/B — och kapseln har
 * ALLTID ett val, så allt utanför de tre faller till `forslag`.
 */
export function aktivtBeloppslage(genvag: Beloppsgenvag | null): Beloppslage {
  return genvag === 'avgift' || genvag === 'allt' ? genvag : 'forslag';
}

/**
 * [TASK-402.3 AC #6] OMKÖRNINGS-URVALET: vilka rader "Försök igen" faktiskt
 * kör. Regeln är EN mening — de registrerbara rader som redan fallerat EN
 * gång — men den är värd en egen, testbar funktion av två skäl.
 *
 * För det FÖRSTA är den inte samma sak som `rader.filter(arRegistrerbar)`:
 * ett omkörnings-tryck får aldrig dra med sig en rad som ännu inte prövats
 * (t.ex. en som Lotta markerade EFTER den första körningen), och inte heller
 * en rad vars fel Lotta redan läkt genom att ändra beloppet — den senare bär
 * fortfarande `utfall.klass === 'fel'` tills nästa körning skriver över det,
 * vilket är rätt: den ska köras med.
 *
 * För det ANDRA avgör den knappens ORD. `baraOmkorning` nedan är sant först
 * när INGA andra registrerbara rader finns kvar, och det är då knappen byter
 * från "Registrera N inbetalningar" till "Försök igen".
 */
export function omkorningsUrval(rader: readonly BekraftelseRad[]): BekraftelseRad[] {
  return rader.filter((rad) => arRegistrerbar(rad) && rad.utfall?.klass === 'fel');
}

/**
 * Är allt som går att registrera redan fallerat en gång? Då är knappen en
 * OMKÖRNING, inte en förstagångsregistrering.
 */
export function baraOmkorning(rader: readonly BekraftelseRad[]): boolean {
  const registrerbara = rader.filter(arRegistrerbar);
  return registrerbara.length > 0 && registrerbara.every((r) => r.utfall?.klass === 'fel');
}

/**
 * Antal kvitton för de FAKTISKT REGISTRERADE raderna — det tal "Skicka N
 * kvitton" ska bära efter registreringen. `summera` duger inte här: efter
 * registreringen är utfallet satt, så `arRegistrerbar` ger noll.
 */
export function antalRegistreradeKvitton(rader: readonly BekraftelseRad[]): number {
  return rader.filter((r) => r.utfall?.klass === 'registrerad' && r.medKvitto).length;
}

export type Summering = {
  /** Antal rader som kan registreras nu. */
  antal: number;
  /** Summan av deras belopp. */
  summa: number;
  /** Summa per betalsätt, i BETALSATT-ordning (utelämnar noll-poster). */
  perBetalsatt: { betalsatt: Betalsatt; summa: number; antal: number }[];
  /** Summa per event, i radordning (utelämnar noll-poster). */
  perEvent: { eventNamn: string; summa: number; antal: number }[];
  /** Antal rader vars kvitto-kryss är i. */
  antalKvitton: number;
};

export function summera(rader: readonly BekraftelseRad[]): Summering {
  const registrerbara = rader.filter(arRegistrerbar);
  const belopp = registrerbara.map((r) => radbelopp(r) ?? 0);

  const perBetalsattKarta = new Map<Betalsatt, { summa: number; antal: number }>();
  for (const r of registrerbara) {
    const post = perBetalsattKarta.get(r.betalsatt) ?? { summa: 0, antal: 0 };
    post.summa = summeraKronorKlient([post.summa, radbelopp(r) ?? 0]);
    post.antal += 1;
    perBetalsattKarta.set(r.betalsatt, post);
  }

  const perEventKarta = new Map<string, { summa: number; antal: number }>();
  for (const r of registrerbara) {
    const namn = r.inkorg.betalning.eventNamn ?? 'Utan event';
    const post = perEventKarta.get(namn) ?? { summa: 0, antal: 0 };
    post.summa = summeraKronorKlient([post.summa, radbelopp(r) ?? 0]);
    post.antal += 1;
    perEventKarta.set(namn, post);
  }

  return {
    antal: registrerbara.length,
    summa: summeraKronorKlient(belopp),
    perBetalsatt: BETALSATT.filter((b) => perBetalsattKarta.has(b)).map((betalsatt) => ({
      betalsatt,
      ...(perBetalsattKarta.get(betalsatt) as { summa: number; antal: number }),
    })),
    perEvent: [...perEventKarta.entries()].map(([eventNamn, v]) => ({ eventNamn, ...v })),
    antalKvitton: registrerbara.filter((r) => r.medKvitto).length,
  };
}

export type EventGruppRader = {
  eventId: string;
  eventNamn: string;
  eventStartdatum: string | null;
  rader: BekraftelseRad[];
};

/**
 * Grupperar raderna per event i FÖRSTA-SEDD-ordning (hämtningens ordning
 * bevaras — ingen egen sortering, steget speglar datat rakt av).
 */
export function grupperaRader(rader: readonly BekraftelseRad[]): EventGruppRader[] {
  const karta = new Map<string, EventGruppRader>();
  for (const rad of rader) {
    const { eventId, eventNamn, eventStartdatum } = rad.inkorg.betalning;
    const nyckel = eventId ?? eventNamn ?? 'utan-event';
    let grupp = karta.get(nyckel);
    if (!grupp) {
      grupp = {
        eventId: nyckel,
        eventNamn: eventNamn ?? 'Utan event',
        eventStartdatum,
        rader: [],
      };
      karta.set(nyckel, grupp);
    }
    grupp.rader.push(rad);
  }
  return [...karta.values()];
}

/**
 * Bygger stegets rader ur de öppna betalningarna. Startbeloppet är radens
 * FÖRVAL (`forslagsbelopp`): avgiften för den som inte betalat något, resten
 * för den som redan betalat avgiften. Husets visningsform ("1 000"), samma som
 * `RegistreraForm` § forifyllt — fältet ska se ut som raden bredvid.
 */
export function byggRader(
  oppna: readonly OppenBetalning[],
  idag: string,
  betalsatt: Betalsatt,
): BekraftelseRad[] {
  return oppna.map<BekraftelseRad>((betalning) => {
    const inkorg = harledRad(betalning, idag);
    const beloppsknappar = harledBeloppsknappar(inkorg);
    const forslag = forslagsbelopp(beloppsknappar);
    const start = forslag !== null ? visaKronor(forslag) : '';
    return {
      nyckel: inkorg.nyckel,
      inkorg,
      beloppsknappar,
      belopp: start,
      betalsatt,
      datum: idag,
      medKvitto: true,
      markerad: true,
      notering: '',
      ejGenomforbar: null,
      handredigerad: false,
      utfall: null,
      inbetalningId: null,
      kvitto: 'ingen',
      kvittonummer: null,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   KONTOUTDRAGET SOM MATARE (TASK-402.4)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * En importrad som ännu inte pekar på en anmälan — eller som aldrig ska göra
 * det (dubbletten).
 *
 * VARFÖR DEN INTE ÄR EN `BekraftelseRad`: stegets rad ÄR en öppen betalning
 * med Lottas val ovanpå. `inkorg`, `beloppsknappar` och hela prislogiken
 * förutsätter en anmälan. En omatchad bankrad har ingen, och en osäker har
 * flera kandidater där ett val vore en gissning med en bock framför —
 * precis det `bankimport-rader.ts` § DE TRE DEFAULTVÄRDENA förbjuder.
 *
 * Att ge `BekraftelseRad` en nullbar `inkorg` hade spridit den nullbarheten
 * till varje härledning, varje summering och varje kort i formen, för ett
 * tillstånd som per definition är ÖVERGÅENDE: så fort Lotta väljer en anmälan
 * blir raden en fullvärdig `BekraftelseRad` (`byggImportrad`) och lämnar denna
 * typ för alltid. Dubbletten är undantaget som aldrig konverteras, och det är
 * hela dess poäng.
 */
export type ObestamdImportrad = {
  nyckel: string;
  /** `saker` finns inte här — en säker rad är redan en `BekraftelseRad`. */
  klass: 'osaker' | 'omatchad' | 'dubblett';
  /** Betalarens namn i banken, eller husets fallback. */
  namn: string;
  belopp: number;
  datum: string | null;
  telefon: string | null;
  meddelande: string | null;
  bankreferens: string | null;
  /** Matchningens skäl i klartext, eller dubblettens. */
  grund: string;
  /** Kandidaterna som fortfarande är öppna, bäst först. Tom för omatchad/dubblett. */
  kandidater: InkorgsRad[];
  /** Datum raden importerades tidigare. Satt endast för dubbletter. */
  tidigareImporterad: string | null;
};

/**
 * En bankrad som PEKAR PÅ en anmälan blir en vanlig stegrad — med bankradens
 * belopp och datum i stället för radens förval.
 *
 * BELOPPET ÄR BANKENS, ALLTID (AC #2: "säker rad: förbockad med bankradens
 * belopp och datum"). Det är hela skillnaden mot den manuella mataren, där
 * beloppet är appens förslag: banken VET vad som betalades, appen gissar.
 *
 * DATUMET FALLER TILL `idag` när filen saknar det, och det är parserns egen
 * gräns som gör fallet möjligt (`Transaktion.datum` är nullbar med avsikt:
 * "ett saknat datum är något Lotta behöver se och fylla i"). Hon ser det
 * genom att öppna radformuläret, där datumet står som vilket annat fält som
 * helst.
 */
export function byggImportrad(
  betalning: OppenBetalning,
  bankrad: {
    nyckel: string;
    belopp: number;
    datum: string | null;
    bankreferens: string | null;
    namn: string | null;
  },
  idag: string,
  betalsatt: Betalsatt,
): BekraftelseRad {
  const inkorg = harledRad(betalning, idag);
  return {
    nyckel: inkorg.nyckel,
    inkorg,
    beloppsknappar: harledBeloppsknappar(inkorg),
    belopp: visaKronor(bankrad.belopp),
    betalsatt,
    datum: bankrad.datum ?? idag,
    medKvitto: true,
    markerad: true,
    notering: '',
    ejGenomforbar: null,
    handredigerad: false,
    utfall: null,
    inbetalningId: null,
    kvitto: 'ingen',
    kvittonummer: null,
    import: {
      nyckel: bankrad.nyckel,
      bankreferens: bankrad.bankreferens,
      bankNamn: bankrad.namn,
    },
  };
}

/**
 * Delar importens rader i de två högar formen renderar: de som är klara att
 * registreras och de som väntar på Lottas hand.
 *
 * ORDNINGEN ÄR FILENS (`radnummer`), inte hämtningens — och det är ett
 * medvetet avsteg från den manuella matarens regel (`Bekraftelsesteget.tsx`
 * § ORDNINGEN ÄR HÄMTNINGENS). Skälet är att Lotta jämför mot kontoutdraget
 * hon har framför sig: raderna i appen ska ligga i samma ordning som raderna i
 * filen. Grupperingen per event sker efteråt (`grupperaRader`) och rör bara de
 * klara raderna.
 *
 * `oppna` är HELA mängden öppna betalningar, inte ett urval: en omatchad rads
 * sökfält söker i samma rymd som inkorgens sökning, och en kandidat måste gå
 * att slå upp oavsett om den råkade ligga i något urval.
 */
export function byggImportsteg(
  rader: readonly ImportradIMinnet[],
  oppna: readonly OppenBetalning[],
  idag: string,
  betalsatt: Betalsatt,
): { rader: BekraftelseRad[]; obestamda: ObestamdImportrad[] } {
  const perId = new Map(oppna.map((b) => [b.anmalanRecordId, b]));
  const oppnaIds = new Set(perId.keys());
  const klara: BekraftelseRad[] = [];
  const obestamda: ObestamdImportrad[] = [];

  for (const rad of [...rader].sort((a, b) => a.radnummer - b.radnummer)) {
    const klass = importradsklass(rad, oppnaIds);
    if (klass === 'saker') {
      // `vald` ÄR satt och öppen — det är vad `saker` betyder (se
      // `importradsklass`), så uppslaget kan inte missa.
      klara.push(
        byggImportrad(perId.get(rad.vald as string) as OppenBetalning, rad, idag, betalsatt),
      );
      continue;
    }
    obestamda.push({
      nyckel: rad.nyckel,
      klass,
      namn: rad.namn ?? 'Utan namn',
      belopp: rad.belopp,
      datum: rad.datum,
      telefon: rad.telefon,
      meddelande: rad.meddelande,
      bankreferens: rad.bankreferens,
      grund:
        klass === 'dubblett'
          ? 'Den här bankraden är redan registrerad. Ingen ny inbetalning skapas.'
          : rad.grund,
      kandidater:
        klass === 'osaker'
          ? oppnaKandidater(rad, oppnaIds).map((id) =>
              harledRad(perId.get(id) as OppenBetalning, idag),
            )
          : [],
      tidigareImporterad: rad.tidigareImporterad,
    });
  }

  return { rader: klara, obestamda };
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRON TILL DET DELADE "REGISTRERAT NU"-BLOCKET (TASK-402.2)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Blockets radmodell, DEKLARERAD HÄR I STÄLLET FÖR IMPORTERAD — och det är
 * inte en dubblett utan ett medvetet lagerval.
 *
 * `RegistreratNuBlock.tsx` är en `.tsx`-fil, och `tsconfig.tests.json`
 * kompilerar api-pure-sviten UTAN `--jsx` (mätt: `error TS6142` på varje
 * typimport härifrån). En ren härledningsmodul som ska kunna testas som ren
 * funktion får därför inte peka in i komponentlagret alls — beroendet går EN
 * väg, och den vägen är nedåt.
 *
 * TYPERNA KAN INTE DRIFTA I TYSTHET: `VariantC.tsx` matar `blockrader()`s
 * resultat rakt in i `RegistreratNuBlock`s `registrerade`-prop, och
 * TypeScripts strukturella typning fäller call site i samma sekund fälten
 * skiljer sig. Kontraktet bevakas alltså av kompilatorn, på det ställe där
 * det faktiskt används.
 */
export type Blockrad = {
  inbetalningId: string;
  namn: string;
  belopp: number;
  betalsatt: Betalsatt;
  /** Lottas kryss vid registreringen. */
  medKvitto: boolean;
  /** Anmälans record-ID — blocket behöver den för Ångras cache-patch. */
  radNyckel?: string;
};

/** Ett kvitto i den SESSION-LOKALA kön. Samma lagerskäl som `Blockrad`. */
export type KoatKvitto = { inbetalningId: string; namn: string; belopp: number };

/**
 * De registrerade raderna i blockets radmodell.
 *
 * `radNyckel` sätts ALLTID här, till skillnad från importvägen: en rad i
 * steget kommer per definition ur en synlig inkorgsrad, och blocket behöver
 * nyckeln för att Ångra ska kunna skriva serverns omräkning rakt in i cachen
 * (`useRaderaInbetalning` § `skrivHarledningTillOppna`).
 *
 * En registrerad rad UTAN `inbetalningId` hoppas över. Den kan inte uppstå i
 * den skarpa vägen (id:t kommer ur serverns svar), men typen tillåter den —
 * och en post utan id hade gjort Ångra och kvittokön omöjliga att koppla till
 * rätt rad.
 */
export function blockrader(rader: readonly BekraftelseRad[]): Blockrad[] {
  return rader
    .filter((r) => r.utfall?.klass === 'registrerad' && r.inbetalningId !== null)
    .map((r) => ({
      inbetalningId: r.inbetalningId as string,
      namn: r.inkorg.namn,
      belopp: radbelopp(r) ?? 0,
      betalsatt: r.betalsatt,
      medKvitto: r.medKvitto,
      radNyckel: r.nyckel,
    }));
}

/** Kvittona som ligger i den SESSION-LOKALA kön ("Skicka N kvitton"). */
export function vantandeKvitton(rader: readonly BekraftelseRad[]): KoatKvitto[] {
  return rader
    .filter((r) => r.kvitto === 'vantar' && r.inbetalningId !== null)
    .map((r) => ({
      inbetalningId: r.inbetalningId as string,
      namn: r.inkorg.namn,
      belopp: radbelopp(r) ?? 0,
    }));
}

/** De fem fälten radformuläret lämnar tillbaka vid "Klar". */
export type Radvarden = Pick<
  BekraftelseRad,
  'belopp' | 'betalsatt' | 'datum' | 'medKvitto' | 'notering'
>;
