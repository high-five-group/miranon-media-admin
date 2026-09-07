import type { Jobbstatus, OppenBetalning } from '@/domain/schemas';
import { normaliseraBeloppKlient, summeraKronorKlient, visaKronor } from './belopp-inmatning';

/**
 * [TASK-346.6, PRD TASK-346 § Inkorgen och formuläret] Inkorgens RENA
 * härledningar: gruppering, rankning, sökning, belopps-knappar och den text
 * som säger vad ett belopp täcker.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN EGEN MODUL OCH INTE LOGIK I KOMPONENTEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma val som `hem-derivations.ts` gjorde för Morgonkollen, av samma skäl:
 * det här är reglerna Lotta faktiskt lutar sig mot när hon prickar av
 * lördagens åtta, och de måste kunna bevisas UTAN en webbläsare. PRD:ns
 * testbeslut kräver dessutom en NEGATIV KONTROLL per regel (DoD #5) - ett
 * test som visar att en trasig implementation fälls. Det går att skriva mot
 * en funktion; det går inte att skriva mot en JSX-gren.
 *
 * INGEN FUNKTION HÄR LÄSER KLOCKAN. `idag` trädas in som ISO-datum av
 * anroparen, precis som `hem-derivations.ts` trär in `idagStartMs`. En
 * härledning som läser `new Date()` går inte att testa två dagar i rad.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ TAL, TVÅ KÄLLOR - OCH VILKET SOM VINNER
 * ═══════════════════════════════════════════════════════════════════════════
 * `saknas` kommer ur Airtable-formeln och är exakt så färsk som spegeln;
 * `summaInbetalt` kommer ur Postgres och är alltid sann (ADR-128 §
 * Konsekvenser, citerat i `Betalningar.schema.ts`). Varje härledning här som
 * behöver veta hur mycket som FAKTISKT är betalt räknar därför ur
 * `gallandePris - summaInbetalt`, aldrig ur `saknas`. `saknas` används bara
 * där basens egen syn är det intressanta, och `spegelIFas` gör skillnaden
 * synlig i stället för att dölja den.
 */

/** ISO-datum, `YYYY-MM-DD`. Samma form som basens datumfält levererar. */
export type IsoDatum = string;

/** En rad i inkorgen: den öppna betalningen plus allt som härleds ur den. */
export type InkorgsRad = {
  betalning: OppenBetalning;
  /** Radens stabila nyckel. Anmälan är unik i listan (en rad per anmälan). */
  nyckel: string;
  namn: string;
  /**
   * Vad som faktiskt återstår enligt POSTGRES (sanningen), inte enligt
   * spegeln. `null` när priset är okänt.
   */
  kvar: number | null;
  /** Vad som återstår av anmälningsavgiften. `null` när avgift saknas. */
  avgiftKvar: number | null;
  /**
   * Klar = hela priset är betalt enligt Postgres. En sådan rad kan finnas
   * KVAR i listan trots att EF:en bara returnerar `Saknas (kr) > 0`: basens
   * formel läser spegeln, och spegeln kan släpa. Det är precis det fallet
   * "Klara hopfällda" (PRD § Inkorgen) finns för.
   */
  klar: boolean;
  /** Slutbetalningens deadline har passerat (ADR-128 beslut 2). */
  forfallen: boolean;
  /** Obekräftad anmälan - räknas med och MÄRKS (ADR-128 beslut 2). */
  obekraftad: boolean;
  /** Basens spegel har inte hunnit ifatt Postgres. */
  spegelSlapar: boolean;
};

export type EventGrupp = {
  nyckel: string;
  eventNamn: string;
  eventStartdatum: IsoDatum | null;
  /** Raderna som fortfarande saknar pengar. */
  oppna: InkorgsRad[];
  /** Raderna som är fullbetalda enligt Postgres. Renderas hopfällda. */
  klara: InkorgsRad[];
  /** Hur många av de öppna som är förfallna. */
  forfallna: number;
};

export type Inkorgsfilter = 'kommande' | 'tidigare';

export type InkorgsVy = {
  kommande: EventGrupp[];
  tidigare: EventGrupp[];
};

/* ═══════════════════════════ RADEN ═══════════════════════════ */

/**
 * En saknad `deadlineSlutbetalning` är ALDRIG förfallen. Fail-open är rätt
 * här och bara här: ett förfallen-märke är en anklagelse mot Lottas deltagare
 * ("den här är sen"), och att sätta det på en anmälan vars deadline vi inte
 * känner vore att hitta på. Jämför beloppen, där fail-closed gäller.
 */
function arForfallen(deadline: string | null, idag: IsoDatum): boolean {
  if (!deadline) return false;
  return deadline < idag;
}

export function harledRad(betalning: OppenBetalning, idag: IsoDatum): InkorgsRad {
  const { gallandePris, anmalningsavgift, summaInbetalt } = betalning;

  const kvar = gallandePris === null ? null : summeraKronorKlient([gallandePris, -summaInbetalt]);
  const avgiftKvar =
    anmalningsavgift === null
      ? null
      : Math.max(0, summeraKronorKlient([anmalningsavgift, -summaInbetalt]));

  return {
    betalning,
    nyckel: betalning.anmalanRecordId,
    namn: betalning.personNamn,
    kvar,
    avgiftKvar,
    klar: kvar !== null && kvar <= 0,
    forfallen: arForfallen(betalning.deadlineSlutbetalning, idag),
    obekraftad: betalning.anmalanStatus === 'Obekräftad',
    spegelSlapar: !betalning.spegelIFas,
  };
}

/* ═══════════════════════════ SAMMANFATTNINGEN ═══════════════════════════ */

export type Betalningssammanfattning = {
  /** Anmälningar som fortfarande saknar pengar enligt Postgres. */
  oppna: number;
  /** Hur många av dem vars slutbetalning passerat sin deadline. */
  forfallna: number;
  /** Kvitton som ligger i kön (`vantar`/`pagar`) och alltså ska skickas. */
  kvittonAttSkicka: number;
};

/**
 * [TASK-346.7 AC #1] De TRE talen Hem-kortet och inkorgens rubrik båda visar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EN FUNKTION, TVÅ YTOR - OCH DET ÄR HELA POÄNGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 11 ger Hem samma tre tal som inkorgens rubrik redan bar
 * inline. Två oberoende uttryck för samma mening hade kunnat glida isär utan
 * att någon mekanism märkte det - och AC #6 kräver uttryckligen att ytorna
 * ger SAMMA resultat. Talen härleds därför på ETT ställe, och båda ytorna
 * läser det.
 *
 * `oppna` RÄKNAR ICKE-KLARA RADER, inte listans längd. EF:en returnerar rader
 * där basens `Saknas (kr) > 0`, men basens formel läser SPEGELN och spegeln
 * kan släpa (ADR-128 § Konsekvenser). En rad som Postgres redan vet är
 * fullbetald är alltså inte öppen, hur listan än ser ut - samma skillnad
 * "Klara hopfällda" bygger på.
 *
 * `kvittonAttSkicka` är kö-talet (`OppenBetalning.kvittonAttSkicka`), alltså
 * kvitton Lotta REDAN tryckt på och som jobbmotorn arbetar av. Det är INTE
 * detsamma som inkorgens session-lokala "väntande"-lista, som räknar
 * registreringar gjorda i denna flik med kvittorutan i men utan att knappen
 * tryckts än (`BetalningsInkorg.tsx` § "SKICKA N KVITTON"). De två talen
 * svarar på olika frågor och slås aldrig ihop.
 */
export function sammanfattaBetalningar(rader: readonly InkorgsRad[]): Betalningssammanfattning {
  return {
    oppna: rader.filter((rad) => !rad.klar).length,
    forfallna: rader.filter((rad) => rad.forfallen && !rad.klar).length,
    kvittonAttSkicka: rader.reduce((summa, rad) => summa + rad.betalning.kvittonAttSkicka, 0),
  };
}

/* ═══════════════════════ KVITTO ATT SKICKA, DURABELT (TASK-367) ═══════════════════════
 *
 * Fyndets kärna (S115 Del 2): en registrerad inbetalning utan kvitto låg
 * bara i `BetalningsInkorg.tsx`s React-state (`vantande`) — stängs fliken
 * innan Lotta trycker "Skicka N kvitton" är listan borta, trots att
 * inbetalningen står kvar obehandlad i Postgres. `OppenBetalning
 * .oskickadeKvitton` är EF:ens svar på det: härlett VARJE hämtning, oberoende
 * av vilken flik, session eller enhet som frågar.
 *
 * `DurabelKvittoPost` HAR SAMMA FORM som `RegistreratNuBlock.tsx`s
 * `VantandeKvitto` (`{inbetalningId, namn, belopp}`) MED AVSIKT: de driver
 * samma "Skicka N kvitton"-mutation (`useKoaKvitton`), och en gemensam form
 * gör det uttryckligt att härledningarna svarar på samma fråga — bara ur
 * OLIKA källor (session-state kontra Postgres). Typen är ändå en EGEN,
 * strukturell definition (inte en import av `RegistreratNuBlock`s typ):
 * denna modul är `api-pure` och importerar aldrig en komponentfil, se
 * `ForhandsgranskningsRad`s docblock ovan för samma regel.
 */
export type DurabelKvittoPost = { inbetalningId: string; namn: string; belopp: number };

/**
 * Alla anmälningars oskickade kvitton, plattade till en enda lista.
 *
 * `doljIds` UTESLUTER rader som redan syns i DENNA flikens
 * `RegistreratNuBlock` (anroparen skickar in `registrerade`s ID:n): den
 * sessionen har redan sin egen, mer detaljerade vy (Ångra, Förhandsgranska
 * per rad) för sina EGNA registreringar, och en rad ska inte visas — och
 * kunna skickas — från TVÅ oberoende knappar samtidigt. En rad som kommer
 * från en ANNAN flik, en annan session eller en annan yta (Åtgärds-panelen,
 * anmälans detaljvy, personkortet — alla skriver till samma Postgres-tabell)
 * har inget sådant motstycke och listas normalt.
 *
 * EN ANMÄLAN KAN BIDRA MED FLERA POSTER: `oskickadeKvitton` är redan
 * per-inbetalning (anmälningsavgift och slutbetalning kan båda vänta
 * samtidigt), så `flatMap` bevarar den granulariteten i stället för att slå
 * ihop dem till en anmälan-nivå-summa.
 */
export function harledKvittoAttSkicka(
  rader: readonly InkorgsRad[],
  doljIds: ReadonlySet<string>,
): DurabelKvittoPost[] {
  return rader.flatMap((rad) =>
    rad.betalning.oskickadeKvitton
      .filter((post) => !doljIds.has(post.inbetalningId))
      .map((post) => ({ inbetalningId: post.inbetalningId, namn: rad.namn, belopp: post.belopp })),
  );
}

/* ═══════════════════════════ GRUPPERINGEN ═══════════════════════════ */

/**
 * Sorterar kommande event NÄRMAST FÖRST och tidigare event SENAST FÖRST -
 * alltså i båda fallen "det som ligger närmast i dag överst".
 *
 * Event utan startdatum hamnar SIST i sin hink i stället för att sorteras som
 * om de låg vid tidens början. Ett saknat datum är inte ett tidigt datum.
 */
function sorteraGrupper(grupper: EventGrupp[], riktning: 1 | -1): EventGrupp[] {
  return [...grupper].sort((a, b) => {
    if (a.eventStartdatum === null && b.eventStartdatum === null) {
      return a.eventNamn.localeCompare(b.eventNamn, 'sv');
    }
    if (a.eventStartdatum === null) return 1;
    if (b.eventStartdatum === null) return -1;
    if (a.eventStartdatum === b.eventStartdatum) {
      return a.eventNamn.localeCompare(b.eventNamn, 'sv');
    }
    return a.eventStartdatum < b.eventStartdatum ? -riktning : riktning;
  });
}

/**
 * Inom en grupp: FÖRFALLNA först (de brådskar), därefter namn i svensk
 * ordning. Ett rent alfabetiskt urval hade begravt de sena raderna mitt i
 * listan, vilket är motsatsen till vad Hem-kortets förfallo-räknare lovar.
 */
function sorteraRader(rader: InkorgsRad[]): InkorgsRad[] {
  return [...rader].sort((a, b) => {
    if (a.forfallen !== b.forfallen) return a.forfallen ? -1 : 1;
    return a.namn.localeCompare(b.namn, 'sv');
  });
}

const UTAN_EVENT_NYCKEL = 'utan-event';

/**
 * Grupperar raderna per event och delar dem i KOMMANDE och TIDIGARE
 * (PRD § Inkorgen: "Listan grupperas per kommande event, närmast först; Klara
 * hopfällda; Tidigare event med saknat belopp under eget filter").
 *
 * GRÄNSEN GÅR VID EVENTETS STARTDATUM, inte vid slutdatum eller deadline: det
 * är den axel Lotta själv tänker i ("lördagens kurs", "kursen i våras"). Ett
 * event som startar I DAG räknas som kommande - det har inte varit.
 *
 * Ett event UTAN startdatum hamnar bland de kommande. Motiveringen är samma
 * fail-open som förfallo-märket: ett okänt datum får inte tysta ned en rad i
 * ett filter Lotta inte tittar i som förstahandsval.
 */
export function grupperaPerEvent(rader: InkorgsRad[], idag: IsoDatum): InkorgsVy {
  const kommandeKarta = new Map<string, EventGrupp>();
  const tidigareKarta = new Map<string, EventGrupp>();

  for (const rad of rader) {
    const { eventId, eventNamn, eventStartdatum } = rad.betalning;
    const nyckel = eventId ?? eventNamn ?? UTAN_EVENT_NYCKEL;
    const tidigare = eventStartdatum !== null && eventStartdatum < idag;
    const karta = tidigare ? tidigareKarta : kommandeKarta;

    let grupp = karta.get(nyckel);
    if (!grupp) {
      grupp = {
        nyckel,
        eventNamn: eventNamn ?? 'Utan event',
        eventStartdatum,
        oppna: [],
        klara: [],
        forfallna: 0,
      };
      karta.set(nyckel, grupp);
    }
    if (rad.klar) grupp.klara.push(rad);
    else grupp.oppna.push(rad);
  }

  const fardigstall = (grupp: EventGrupp): EventGrupp => ({
    ...grupp,
    oppna: sorteraRader(grupp.oppna),
    klara: sorteraRader(grupp.klara),
    forfallna: grupp.oppna.filter((r) => r.forfallen).length,
  });

  return {
    kommande: sorteraGrupper([...kommandeKarta.values()].map(fardigstall), 1),
    tidigare: sorteraGrupper([...tidigareKarta.values()].map(fardigstall), -1),
  };
}

/* ═══════════════════════════ SÖKNINGEN ═══════════════════════════ */

/**
 * Telefonnummer jämförs på SIFFRORNA ENSAMMA. Basen bär `070-102 12 17`,
 * banken visar `0701021217` och Lotta skriver `070 102`. Tre former, samma
 * nummer - och en jämförelse på råtext hade gett noll träffar på alla tre.
 */
function baraSiffror(text: string): string {
  return text.replace(/\D+/g, '');
}

/**
 * Beloppen ett sökt tal rimligen kan syfta på. Lotta ser ETT tal i banken och
 * vill veta vem det passar: hela priset, anmälningsavgiften, det som återstår
 * totalt, eller det som återstår av avgiften.
 *
 * `summaInbetalt` ingår MEDVETET INTE. Det är vad som redan kommit in, aldrig
 * något Lotta kan se på en ny banktransaktion, och att matcha på det hade
 * gett träffar som ser rätt ut men betyder fel sak.
 */
function beloppskandidater(rad: InkorgsRad): number[] {
  const { gallandePris, anmalningsavgift, saknas } = rad.betalning;
  const kandidater: number[] = [];
  if (gallandePris !== null) kandidater.push(gallandePris);
  if (anmalningsavgift !== null) kandidater.push(anmalningsavgift);
  if (saknas !== null) kandidater.push(saknas);
  if (rad.kvar !== null) kandidater.push(rad.kvar);
  if (rad.avgiftKvar !== null && rad.avgiftKvar > 0) kandidater.push(rad.avgiftKvar);
  return kandidater;
}

/**
 * Träffar sökningen raden? Namn, telefon och belopp, per PRD § Inkorgen.
 *
 * TOM SÖKNING TRÄFFAR ALLT. Det är inte en specialregel utan sökfältets
 * viloläge: listan visas i sin helhet tills Lotta börjar skriva.
 */
export function matcharSokning(rad: InkorgsRad, sokterm: string): boolean {
  const term = sokterm.trim();
  if (term === '') return true;

  if (rad.namn.toLocaleLowerCase('sv').includes(term.toLocaleLowerCase('sv'))) return true;

  const siffror = baraSiffror(term);
  const telefon = rad.betalning.personTelefon;
  // Minst tre siffror innan ett tal får läsas som ett telefonnummer: "10"
  // matchar annars varje nummer som råkar innehålla de två siffrorna, vilket
  // gör beloppssökningen oanvändbar för små belopp.
  if (siffror.length >= 3 && telefon && baraSiffror(telefon).includes(siffror)) return true;

  const belopp = normaliseraBeloppKlient(term);
  if (belopp !== null && beloppskandidater(rad).some((k) => Math.abs(k - belopp) < 0.005)) {
    return true;
  }

  return false;
}

/**
 * Rankar träffarna. Personer med öppna betalningar först, klara sist
 * (PRD § Inkorgen: "personer med öppna betalningar rankas först").
 *
 * Rankningen gäller SÖKLÄGET, där gruppering vore i vägen: Lotta har skrivit
 * ett namn eller ett belopp och vill ha svaret överst, inte inbäddat i rätt
 * event-grupp.
 */
export function rankaTraffar(rader: InkorgsRad[], sokterm: string, idag: IsoDatum): InkorgsRad[] {
  const traffar = rader.filter((rad) => matcharSokning(rad, sokterm));
  return [...traffar].sort((a, b) => {
    if (a.klar !== b.klar) return a.klar ? 1 : -1;
    if (a.forfallen !== b.forfallen) return a.forfallen ? -1 : 1;
    const aDatum = a.betalning.eventStartdatum;
    const bDatum = b.betalning.eventStartdatum;
    // Kommande event före tidigare, sedan närmast först.
    const aKommande = aDatum === null || aDatum >= idag;
    const bKommande = bDatum === null || bDatum >= idag;
    if (aKommande !== bKommande) return aKommande ? -1 : 1;
    if (aDatum !== null && bDatum !== null && aDatum !== bDatum) {
      return aKommande ? aDatum.localeCompare(bDatum) : bDatum.localeCompare(aDatum);
    }
    return a.namn.localeCompare(b.namn, 'sv');
  });
}

/* ═══════════════════════════ BELOPPS-KNAPPARNA ═══════════════════════════ */

export type Beloppsknapp = {
  /** Stabil nyckel, oberoende av beloppet (som ändras med inbetalt). */
  nyckel: 'avgift' | 'allt';
  belopp: number;
  /** Vad knappen betalar: `anmälningsavgift`, `allt`, `resten`. */
  etikett: string;
};

/**
 * Belopps-knapparna, HÄRLEDDA ur pris och redan inbetalt (PRD berättelse 3
 * och AC #3: "belopps-knappar härledda, anpassade efter redan inbetalt").
 *
 * Med inget inbetalt och priset 2 500 / avgiften 1 000 ger detta exakt PRD:ns
 * form: `1 000 · anmälningsavgift` och `2 500 · allt`. Med 1 000 redan
 * inbetalt faller avgifts-knappen bort (den är betald) och allt-knappen blir
 * `1 500 · resten`.
 *
 * TRE FALL SOM MEDVETET GER FÄRRE ÄN TVÅ KNAPPAR:
 *   1. Avgiften är redan täckt  -> bara resten-knappen.
 *   2. Avgift och pris är samma belopp (föreläsning har ETT pris utan fack,
 *      ADR-128 beslut 6) -> en knapp, och den heter `allt`, inte
 *      `anmälningsavgift`. Två knappar med samma tal hade varit ett val utan
 *      skillnad.
 *   3. Priset är okänt -> noll knappar, bara det fria fältet. Att gissa en
 *      knapp ur ett okänt pris vore att uppfinna ett belopp.
 */
export function harledBeloppsknappar(rad: InkorgsRad): Beloppsknapp[] {
  const knappar: Beloppsknapp[] = [];
  const harBetaltNagot = rad.betalning.summaInbetalt > 0;

  const avgiftKvar = rad.avgiftKvar;
  const kvar = rad.kvar;

  if (avgiftKvar !== null && avgiftKvar > 0 && !(kvar !== null && avgiftKvar === kvar)) {
    knappar.push({
      nyckel: 'avgift',
      belopp: avgiftKvar,
      etikett: harBetaltNagot ? 'resten av anmälningsavgiften' : 'anmälningsavgift',
    });
  }

  if (kvar !== null && kvar > 0) {
    knappar.push({
      nyckel: 'allt',
      belopp: kvar,
      etikett: harBetaltNagot ? 'resten' : 'allt',
    });
  }

  return knappar;
}

/* ═══════════════════════════ VAD BELOPPET TÄCKER ═══════════════════════════ */

export type Beloppsutfall = {
  text: string;
  ton: 'tacker' | 'delvis' | 'over' | 'okant';
};

/**
 * Meningen som säger rakt ut vad beloppet gör (AC #5: "Belopp som täcker båda
 * facken sägs rakt ut ('2 500 kr täcker anmälningsavgift + slutbetalning');
 * udda belopp visar saknas-rest").
 *
 * FACKEN NÄMNS BARA NÄR DE FAKTISKT ÄR TVÅ. Ett event vars avgift är hela
 * priset har inga fack (ADR-128 beslut 6), och en text som ändå räknade upp
 * dem hade beskrivit en modell Lotta inte har framför sig.
 *
 * ÖVERBETALNING SÄGS OCKSÅ RAKT UT, i stället för att avrundas bort. Ett
 * belopp som är större än priset är antingen ett skrivfel eller något Lotta
 * behöver veta om innan hon sparar - båda kräver att det syns.
 */
export function beloppsutfall(rad: InkorgsRad, belopp: number): Beloppsutfall {
  const { gallandePris, anmalningsavgift, summaInbetalt } = rad.betalning;
  const visat = visaKronor(belopp);

  if (gallandePris === null) {
    return {
      ton: 'okant',
      text: `${visat} kr registreras. Priset saknas i basen, så appen kan inte säga vad det täcker.`,
    };
  }

  const nySumma = summeraKronorKlient([summaInbetalt, belopp]);
  const nyttSaknas = summeraKronorKlient([gallandePris, -nySumma]);
  const tvaFack =
    anmalningsavgift !== null && anmalningsavgift > 0 && anmalningsavgift < gallandePris;

  if (nyttSaknas < 0) {
    return {
      ton: 'over',
      // Samma termbyte som nedan: verbet "saknas" är den gamla domäntermens
      // form och byts med den, så överbetalningen mäts mot samma begrepp som
      // resten av ytorna namnger.
      text: `${visat} kr är ${visaKronor(Math.abs(nyttSaknas))} kr mer än vad som är kvar att betala.`,
    };
  }

  if (nyttSaknas === 0) {
    if (tvaFack && summaInbetalt < anmalningsavgift) {
      return { ton: 'tacker', text: `${visat} kr täcker anmälningsavgift + slutbetalning.` };
    }
    // HELTÄCKNINGEN SÄGS SOM ETT UTFALL, INTE SOM EN TÄCKNINGSGRAD (Marcus dom
    // 2026-09-01): *"'500 kr täcker hela priset' tycker jag är otydlig. kanske
    // 'Inget kvar att betala' är tydligare?"*.
    //
    // "täcker hela priset" tvingade Lotta att själv räkna ut vad det BETYDER —
    // beloppet ställdes mot ett pris hon inte har framför sig, och slutsatsen
    // ("alltså är hon klar") lämnades åt henne. Den nya formen säger slutsatsen
    // direkt, med SAMMA domänterm som resten av betalningsytorna redan bär:
    // "kvar att betala" står i `delvis`-grenen nedan, i `over`-grenen ovan, i
    // registreringens kvittens och på inkorgens rader. Heltäckningen är alltså
    // inte längre den enda meningen som mäter något annat än de andra.
    //
    // BELOPPET NÄMNS INTE, och det är avsiktligt: talet står i beloppsfältet
    // direkt ovanför boxen, oförändrat sedan Lotta skrev det. Att upprepa det
    // hade gjort meningen längre utan att göra den säkrare.
    return { ton: 'tacker', text: 'Inget kvar att betala.' };
  }

  // DOMÄNTERMEN ÄR "KVAR ATT BETALA" (Marcus 2026-09-01), och i löpande text
  // står beloppet först. Samma term som panelen, anmälans detaljvy,
  // personkortet, inkorgens rader och registreringens kvittens bär — samma
  // sak heter samma sak var Lotta än står.
  if (tvaFack && summaInbetalt < anmalningsavgift && nySumma >= anmalningsavgift) {
    return {
      ton: 'delvis',
      text: `${visat} kr täcker anmälningsavgiften. ${visaKronor(nyttSaknas)} kr kvar att betala.`,
    };
  }

  return {
    ton: 'delvis',
    text: `${visat} kr registreras. ${visaKronor(nyttSaknas)} kr kvar att betala.`,
  };
}

/* ═══════════════════════════ JOBBETS DELUTFALL ═══════════════════════════ */

export type JobbUtfallsklass = 'vantar' | 'pagar' | 'allt-skickat' | 'delutfall' | 'inget-skickat';

export type JobbDelutfall = {
  klass: JobbUtfallsklass;
  rubrik: string;
  /** MessageBox-intent. Noll skickade är ALDRIG grönt (ADR-067 D3-formen). */
  intent: 'info' | 'success' | 'warning';
  skickade: number;
  fel: number;
  kvar: number;
  totalt: number;
};

/**
 * Jobbets läge i Delutfallets fyra klasser (ORDLISTA § Delutfall, samma form
 * `atgardsutfall.ts` bär för utskicken).
 *
 * DEN LÅSTA REGELN, ordagrant övertagen från `svep/ResultatVy.tsx`: noll
 * lyckade renderas ALDRIG som grön framgång. Ett halvt utfall får aldrig se
 * helt ut (PRD berättelse 10).
 *
 * SKILLNADEN MOT UTSKICKENS UTFALL: jobbet är ASYNKRONT, så det finns två
 * klasser till - `vantar` och `pagar`. Ett jobb som inte är färdigt är varken
 * lyckat eller misslyckat, och att tvinga in det i en av de tre slutliga
 * klasserna hade gjort raden osann under hela den tid den faktiskt arbetar.
 */
export function jobbDelutfall(status: Jobbstatus | undefined): JobbDelutfall | null {
  if (!status?.jobb) return null;
  const { totalt, skickade, fel, kvar } = status.sammanfattning;

  if (kvar > 0) {
    const pagar = status.rader.some((rad) => rad.status === 'pagar');
    return {
      klass: pagar ? 'pagar' : 'vantar',
      rubrik: pagar
        ? `Skickar kvitton, ${skickade} av ${totalt} klara`
        : `${kvar} av ${totalt} kvitton väntar`,
      intent: 'info',
      skickade,
      fel,
      kvar,
      totalt,
    };
  }

  if (fel === 0) {
    return {
      klass: 'allt-skickat',
      // [TASK-352] KONGRUENSEN, INTE BARA NUMERUSET: "skickade" är particip-
      // formen (plural, kollektivt "kvitton skickade"), inte verbets
      // preteritum (som är formlikt "skickade" oavsett numerus i modern
      // svenska - därför var felet lätt att missa). Vid N=1 är huvudordet
      // "kvitto" (singular, neutrum), och participet ska då böjas "skickat" -
      // mätt fynd, S113-slutvandringen 2026-08-31: regionen visade "1 kvitto
      // skickade" efter ett enda lyckat utskick.
      rubrik: skickade === 1 ? '1 kvitto skickat' : `${skickade} kvitton skickade`,
      intent: 'success',
      skickade,
      fel,
      kvar,
      totalt,
    };
  }

  if (skickade === 0) {
    return {
      klass: 'inget-skickat',
      rubrik: 'Inget kvitto gick fram',
      intent: 'warning',
      skickade,
      fel,
      kvar,
      totalt,
    };
  }

  return {
    klass: 'delutfall',
    rubrik: `${skickade} av ${totalt} kvitton skickade, ${fel} misslyckades`,
    intent: 'warning',
    skickade,
    fel,
    kvar,
    totalt,
  };
}

/* ═══════════════════════ FÖRHANDSGRANSKNINGEN (TASK-353) ═══════════════════════ */

/**
 * Den minsta form `kanForhandsgranska` behöver av en granskningsrad.
 *
 * STRUKTURELL, INTE `SessionsRad` IMPORTERAD: `SessionsRad` bor i
 * `BetalningsInkorg.tsx`, en komponentfil som drar in React och hela
 * vy-trädet. Denna modul är `api-pure` (körs rakt i Node av `tests/api/`,
 * se `betalningar-inkorg.test.ts` § api-pure) och får därför inte importera
 * åt det hållet. Två fält räcker, och en strukturell typ håller beroendet
 * enkelriktat.
 */
export type ForhandsgranskningsRad = {
  /** Lottas kryss vid registreringen. Falskt ⇒ raden får aldrig ett kvitto. */
  medKvitto: boolean;
  inbetalningId: string;
};

/**
 * [TASK-353, Marcus order 2026-09-01] Får DENNA rad förhandsgranskas?
 *
 * Marcus ordagrant: *"lägga en knapp bredvid 'Skicka X kvitton' som heter
 * 'Förhandsgranska' och så tillämpar vi exakt samma metod som … för våra
 * bilagor."*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * REGELN ÄR SNÄV MED AVSIKT: BARA DET SOM ÄNNU INTE GÅTT I VÄG
 * ═══════════════════════════════════════════════════════════════════════════
 * Förhandsgranskningen svarar på EN fråga — *"är det här rätt innan jag
 * trycker?"*. Den får därför erbjudas i exakt ett läge:
 *
 *   • kvitto är begärt (kryssrutan var i), OCH
 *   • raden ligger kvar i den SESSION-LOKALA kön (`vantande`), alltså har
 *     Lotta ännu inte tryckt på "Skicka N kvitton"
 *
 * Allt annat får `false`, och skälen är olika för olika lägen:
 *
 *   – INGET KVITTO BEGÄRT: det finns ingenting att granska. En knapp här
 *     hade antytt att ett kvitto var på väg.
 *   – REDAN KÖAT/PÅGÅR/SKICKAT: för sent — granskningen skulle inte kunna
 *     ändra någonting, och en "förhandsgranskning" av något som redan gått
 *     är en efterhandsgranskning. Det läget har sin EGNA, riktiga väg:
 *     `kvittolage`s `kanVisa` på inbetalningsraderna
 *     (`panel-harledningar.ts`), som visar den FAKTISKT SKICKADE PDF:en ur
 *     Storage. DE TVÅ FÅR ALDRIG BLANDAS IHOP: denna renderar ett utkast som
 *     ännu inte finns, den andra hämtar en fil som finns. `kanVisa: harPdf`
 *     är orörd av denna skiva.
 *   – FALLERAD RAD: medvetet UTANFÖR denna skiva. Raden har lämnat kön, och
 *     dess fel handlar om SÄNDNINGEN (adress, spärr), inte om innehållet —
 *     en innehållsgranskning svarar inte på varför den föll. Att utvidga
 *     hit är ett eget beslut, inte något denna funktion ska glida in i.
 *
 * `vantandeIds` OCH INTE HELA `VantandeKvitto[]`: funktionen behöver bara
 * veta OM raden står i kön, aldrig namn eller belopp. En smalare indata är en
 * mindre yta att hålla synkroniserad.
 */
export function kanForhandsgranska(
  rad: ForhandsgranskningsRad,
  vantandeIds: readonly string[],
): boolean {
  if (!rad.medKvitto) return false;
  return vantandeIds.includes(rad.inbetalningId);
}

/**
 * [TASK-370.4, review-runda 1 FYND 1] Fångar TALET ur EF:ens
 * (`supabase/functions/_shared/kvitto-kombination.ts`s
 * `valideraInbetalningIdLista`) tak-avvisning — den engelska texten
 * "inbetalningIds may contain at most 30 entries (got 35)" — i stället för
 * att duplicera `MAX_KOMBINERADE_KVITTON` som en egen klientkonstant. PRD
 * TASK-370-uppdragets egen motivering: "en klientkopia som kan glida är
 * sämre än att läsa felet från EF:en".
 *
 * UTBRUTEN UR `BetalningsInkorg.tsx` TILL DENNA RENA MODUL, SPECIFIKT FÖR
 * ATT KUNNA BEVISAS MOT EF-KÄLLAN: en regex gömd inline i en komponent kan
 * inte importeras av ett Node-test, och ett test som bara mockar en
 * HANDSKRIVEN kopia av EF:ens sträng (så som `betalningar-inkorg-
 * forhandsgranska-alla.staging.test.ts` gör) bevisar bara att regexen
 * matchar sin egen förlaga — inte att den matchar EF:ens FAKTISKA text.
 * Den bindningen ligger i stället i `tests/api/forhandsgranska-alla-tak-
 * bindning.test.ts`, som importerar BÅDA sidorna: `valideraInbetalningIdLista`
 * (EF-modulen, körd med 31 UUID:er, det verkliga kastade felet) OCH denna
 * funktion, och asserterar att `tolkaTakfel(felets message) ===
 * MAX_KOMBINERADE_KVITTON`. Ändras EF:ens ordalydelse fäller DET testet —
 * inte tyst en drift till att Lotta ser EF:ens råa engelska text.
 *
 * Returnerar `null` när meddelandet inte matchar mönstret (annat fel, eller
 * EF:ens text har ändrats på ett sätt bindnings-testet ännu inte känner
 * till) — anroparen visar då EF:ens råa meddelande i stället för att gissa
 * ett tal, se `BetalningsInkorg.tsx`s `forhandsgranskaAlla`.
 */
const TAK_FELMATCH = /may contain at most (\d+) entries/;

export function tolkaTakfel(meddelande: string): number | null {
  const traff = meddelande.match(TAK_FELMATCH);
  if (!traff) return null;
  const tal = Number(traff[1]);
  return Number.isFinite(tal) ? tal : null;
}
