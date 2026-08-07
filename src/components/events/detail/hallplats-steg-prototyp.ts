/**
 * [PROTOTYPE] S93 hållplats-pass — KASTBAR delad logik + fixturer.
 *
 * Ren härledning (ingen React, inga hooks) delad av
 * `DeltagareHallplatsPrototyp.tsx`, `Deltagare.tsx`:s DEV-grindade gren och
 * `Betalningar.tsx`:s DEV-grindade gren. Frågan denna modul tjänar bor i
 * `DeltagareHallplatsPrototyp.tsx` (huvudprototypfilen).
 *
 * `hallplatsSteg()` är den Fable-designade tillståndsmodellen ur uppdraget:
 * SEX möjliga steg, prioritetsordning uppifrån — en person bär EXAKT ETT
 * märke även när det underliggande datat är ett NÄT (research-doken Del 3),
 * inte en kedja. `Status === Obekräftad` slår ALLTID betalningsläget (4:an
 * före 5:an) — en obekräftad-och-betald person (Del 3 fall A, verifierat i
 * staging) visar därför "Väntar på bekräftelse", inte "Klar": märket visar
 * det längst bak liggande OFÄRDIGA steget.
 *
 * KONVERGENS-PASSET (S93 Del 3, 2026-08-03, 8/8 Marcus-kvitterade beslut):
 * variant A vann divergensen (B/C förkastade och rivna — se
 * `DeltagareHallplatsPrototyp.tsx`), och byggs nu ut till HELA den grillade
 * strukturen. `HallplatsVariant` bär därför bara den vinnande nyckeln;
 * `registerOrdning()` nedan är NY (Del 3 beslut 2/3 — registrets fyra
 * sorterings-hinkar, finmaskigare än `hallplatsSteg()`s tre).
 *
 * KASTBAR (throwaway-kontraktet): rivs med hela S93-hållplats-passet.
 */
import type { Registration } from '@/domain/models/Registration';
import type { PersonHistoryEntry } from '@/domain/schemas';
import {
  PaymentStatus,
  RegistrationSource,
  type RegistrationSourceValue,
  RegistrationStatus,
} from '@/domain/types/Status';

/** Den vinnande variantens stabila nyckel (ADR-074 beslut 1; konvergens-passet
    S93 Del 3 § Valet — B/C rivna, `a` behåller sin nyckel per Marcus beslut). */
export type HallplatsVariant = 'a';

export function isHallplatsVariant(v: string | null): v is HallplatsVariant {
  return v === 'a';
}

/** Tillståndsmodellen — se docblocket ovan för prioritetsordningen. */
export type HallplatsSteg =
  | 'vantar-bekraftelse'
  | 'vantar-betalning'
  | 'klar'
  | 'avbokad'
  | 'installt'
  | 'till-vantelista';

/** Etiketterna — orden ur research-doken Del 6C, ordagrant. */
export const HALLPLATS_LABEL: Record<HallplatsSteg, string> = {
  'vantar-bekraftelse': 'Väntar på bekräftelse',
  'vantar-betalning': 'Väntar på betalning',
  klar: 'Klar',
  avbokad: 'Avbokad',
  installt: 'Inställt',
  'till-vantelista': 'På väg till väntelistan',
};

/**
 * Betalningspåminnelse skickad — förenklad kopia av `Deltagare.tsx`:s privata
 * `harPaminnelse` (samma tre parallella tidsstämplar). Duplicerad hit så
 * `Betalningar.tsx`:s DEV-gren (A′ inbakat — räknaren flyttar hit) kan räkna
 * den utan tvärimport mellan skarpa filer.
 */
export function harPaminnelse(r: Registration): boolean {
  return (
    r.betalningspaminnelseSkickad != null ||
    r.paminnelseAnmalningsavgiftSkickad != null ||
    r.paminnelseSlutbetalningSkickad != null
  );
}

/**
 * Anmälningsavgiften Mottagen (delad formel — se `betalningsSplit` nedan för
 * varför `Betalningar.tsx` sedan S96-granskningen ANROPAR denna modul i
 * stället för att hålla en egen parallell kopia).
 */
export function avgiftKlar(r: Registration): boolean {
  return r.anmalningsavgift === PaymentStatus.MOTTAGEN;
}

/**
 * Slutbetalningen kräver inget mer: Mottagen ELLER Ej relevant (föreläsningar
 * saknar slutbetalning helt — Del 3 fall F). Delad formel, se `betalningsSplit`
 * nedan.
 */
export function slutKlar(r: Registration): boolean {
  return (
    r.slutbetalning === PaymentStatus.MOTTAGEN || r.slutbetalning === PaymentStatus.EJ_RELEVANT
  );
}

/**
 * Betalningen KLAR (delad formel med `Betalningar.tsx`:s `avgiftKlar`/`slutKlar`
 * — förenklad kopia, kastbar precedent ur S86:s `DeltagareBekraftaPrototyp.tsx`):
 * anmälningsavgiften Mottagen OCH slutbetalningen Mottagen ELLER Ej relevant
 * (föreläsningar saknar slutbetalning helt — Del 3 fall F). Skriven i termer av
 * `avgiftKlar`/`slutKlar` ovan — EN formel, inte två (byggkrav-2-passet, S96).
 */
export function betalKlar(r: Registration): boolean {
  return avgiftKlar(r) && slutKlar(r);
}

/** Aggregat-formen `betalningsSplit` producerar — se docblocket nedan. */
export type BetalningsSplit = {
  avgifterMottagna: number;
  avgifterTotalt: number;
  avgifterSaknas: number;
  slutMottagna: number;
  slutSaknas: number;
};

/**
 * Betalnings-splitten DELAD mellan `Betalningar.tsx`s egna räknerader och
 * `Deltagare.tsx`:s hållplats-topp (byggkrav 2, variant A, S96) — EN
 * beräkning på `aktiva`, anropad från BÅDA i stället för två separata
 * implementationer som kan divergera.
 *
 * S96 REVIEW-FIX (Marcus granskning av PR #660, `variant-a-proto.png`):
 * innan denna funktion fanns räknade `Betalningar.tsx`s egen `slutMottagna`
 * strikt `PaymentStatus.MOTTAGEN` inline — INTE modulens `slutKlar` (Mottagen
 * ELLER Ej relevant), fast dess EGEN `slutSaknasAntal` redan använde
 * `slutKlar`. En "Ej relevant"-registrering (föreläsning, ingen
 * slutbetalning) föll därför ur BÅDA talen samtidigt (varken mottagen eller
 * saknad), medan `Deltagare.tsx`:s topprad — som redan använde `slutKlar`
 * korrekt — räknade den registreringen som mottagen. Resultat i
 * fixtur-fixturen (12 aktiva, en `EJ_RELEVANT`-post): toppen visade
 * "3 mottagna −9", blocket "2 mottagna −9" — samma sida, olika tal, trots
 * att BÅDA delta-talen (−9) redan var lika (det var bara `slutMottagna` som
 * drev isär). Riktig-datan i samma granskning saknade en `EJ_RELEVANT`-post
 * bland sina aktiva och dolde därför felet (3/−13 i båda). Fixat genom att
 * BÅDA ställena nu anropar denna enda funktion — drift kan inte uppstå igen
 * utan att ändra HÄR.
 */
export function betalningsSplit(aktiva: Registration[]): BetalningsSplit {
  const avgifterMottagna = aktiva.filter(avgiftKlar).length;
  const avgifterTotalt = aktiva.length;
  const avgifterSaknas = avgifterTotalt - avgifterMottagna;
  const slutMottagna = aktiva.filter(slutKlar).length;
  const slutSaknas = aktiva.filter((r) => !slutKlar(r)).length;
  return { avgifterMottagna, avgifterTotalt, avgifterSaknas, slutMottagna, slutSaknas };
}

/**
 * REGISTRETS sorterings-hinkar (konvergens-passet, Del 3 beslut 2/3): "EN
 * lista, steg-ordning (ogjort överst), anmälningsordning inom steg."
 * Finmaskigare än `hallplatsSteg()`s tre huvudsteg — delar "väntar på
 * betalning" i AVGIFT/SLUT (SAMMA delning som `betalningsSplit`s två
 * räknerader, byggkrav 2), eftersom Del 3s raduppsättning explicit räknar upp
 * fyra rader (Väntar på bekräftelse · Anmälningsavgifter · Slutbetalningar ·
 * Klara), inte tre.
 *
 * Talet är ENDAST en sorterings-nyckel (lägre = högre upp i listan) — samma
 * prioritetsordning som `hallplatsSteg()` (Inställt/Väntelista före
 * Obekräftad-kollen; Avbokad förekommer aldrig här, redan bortfiltrerad ur
 * `aktiva`), men med betalningsledet uppdelat i två.
 *
 * ÖPPET BOKFÖRT DESIGNVAL (ospecat av grillningen): Inställt/Flytta till
 * väntelista placeras EFTER Klara (4/5) — de är sällsynta administrativa
 * undantag, inte del av Del 3s fyra-stegslista, och en placering FÖRE Klara
 * hade blandat administrativa flaggor med betalningsframsteg. Se
 * slutrapporten.
 */
export function registerOrdning(r: Registration): number {
  // ITERATIONSVÅG (Marcus 2026-08-05, punkt 3): "Avbokade måste även synas i
  // registret självt." De låg tidigare ENBART bakom sin egen räknerad och var
  // helt bortfiltrerade ur listan (`aktiva` exkluderar dem). Nu sorteras de
  // SIST — efter de administrativa undantagen — och bär sitt grå "Avbokad"-
  // märke som varje annan post bär sitt. Registret visar därmed hela sanningen
  // om eventet, och filterpanelens Status-dimension kan isolera dem.
  if (r.status === RegistrationStatus.AVBOKAD) return 6;
  if (r.status === RegistrationStatus.INSTALLT) return 4;
  if (r.status === RegistrationStatus.FLYTTA_TILL_VANTELISTA) return 5;
  if (r.status === RegistrationStatus.OBEKRAFTAD) return 0;
  if (!avgiftKlar(r)) return 1;
  if (!slutKlar(r)) return 2;
  return 3;
}

/** Registrets filter-tillstånd (ITERATIONSVÅG, Marcus 2026-08-05).
 *
 *  ETT tillstånd ersätter FYRA separata useState (`filter`, `hallplatsFilter`,
 *  `protoBetalningsFilter`, `protoAvbokadeAktiv`). Splittringen var inte bara
 *  omständlig — den var en BUGGKÄLLA: konvergens-passet fann att den gamla
 *  "Rensa filtret" nollade ett av fyra och därför gjorde ingenting i tre fall
 *  av fyra. Med ett tillstånd kan klassen inte uppstå igen.
 *
 *  TVÅ AXLAR, med avsikt olika natur:
 *  · `steg` — "vad saknas": ömsesidigt uteslutande, för en person kan bara stå
 *    på ETT ställe i kedjan. Sätts av topp-räknarna ELLER panelens dropdown —
 *    samma tillstånd, två ingångar, så panelen alltid visar sanningen om vad
 *    som är valt.
 *  · `vagIn` — hur personen kom in: OBEROENDE axel som kombineras fritt med
 *    `steg` ("visa medföljande som saknar slutbetalning"). Den ersätter
 *    Alla/Manuella/Medföljande-fliken, som inte kunde kombineras med något. */
export type RegisterFilter = {
  steg: RegisterStegFilter | null;
  vagIn: VagInFilter | null;
};

/** Väg in-axeln. `'formular'` är EGET värde, inte ett `RegistrationSource` —
    formulärvägen är NORMEN och bär `kalla: null` i basen (K37, "tysta normen").
    Utan ett eget filtervärde hade den enda vägen Lotta använder mest varit den
    enda hon inte kunde filtrera fram. */
export type VagInFilter = RegistrationSourceValue | 'formular';

/** Stegaxelns val — hållplatsens egna steg plus de logistiska ytorna som bär
    egna räknerader (eventinfo/bor över) och de två betalnings-splitraderna. */
export type RegisterStegFilter =
  | 'vantar-bekraftelse'
  | 'avgift-saknas'
  | 'slut-saknas'
  | 'klar'
  | 'eventinfo-saknas'
  | 'bor-over'
  | 'avbokad';

export const REGISTER_STEG_LABEL: Record<RegisterStegFilter, string> = {
  'vantar-bekraftelse': 'Väntar på bekräftelse',
  'avgift-saknas': 'Saknar anmälningsavgift',
  'slut-saknas': 'Saknar slutbetalning',
  klar: 'Klara',
  'eventinfo-saknas': 'Saknar eventinfo',
  'bor-over': 'Bor över',
  avbokad: 'Avbokade',
};

export const VAG_IN_LABEL: Record<VagInFilter, string> = {
  formular: 'Via formulär',
  [RegistrationSource.MANUELL]: 'Manuellt tillagd',
  [RegistrationSource.MEDFOLJANDE]: 'Medföljande',
  [RegistrationSource.VANTELISTA]: 'Från väntelistan',
};

/** Väg in-axelns predikat — `'formular'` matchar den tysta normen (`kalla` är
    null eller ett värde vi inte känner igen). */
export function vagInTest(f: VagInFilter): (r: Registration) => boolean {
  if (f === 'formular') {
    return (r) =>
      r.kalla !== RegistrationSource.MANUELL &&
      r.kalla !== RegistrationSource.MEDFOLJANDE &&
      r.kalla !== RegistrationSource.VANTELISTA;
  }
  return (r) => r.kalla === f;
}

/** Stegaxelns predikat — EN plats, så filterpanelen och topp-räknarna aldrig
    kan svara olika på samma val. */
export function stegTest(f: RegisterStegFilter): (r: Registration) => boolean {
  switch (f) {
    case 'vantar-bekraftelse':
      return (r) => r.status === RegistrationStatus.OBEKRAFTAD;
    case 'avgift-saknas':
      return (r) => r.status !== RegistrationStatus.AVBOKAD && !avgiftKlar(r);
    case 'slut-saknas':
      return (r) => r.status !== RegistrationStatus.AVBOKAD && !slutKlar(r);
    case 'klar':
      return (r) => r.status !== RegistrationStatus.AVBOKAD && betalKlar(r);
    case 'eventinfo-saknas':
      return (r) => r.status !== RegistrationStatus.AVBOKAD && r.deltagarinfoSkickad == null;
    case 'bor-over':
      return (r) => r.borOver === true;
    case 'avbokad':
      return (r) => r.status === RegistrationStatus.AVBOKAD;
  }
}

export const TOMT_REGISTER_FILTER: RegisterFilter = { steg: null, vagIn: null };

export function harAktivtFilter(f: RegisterFilter): number {
  return (f.steg != null ? 1 : 0) + (f.vagIn != null ? 1 : 0);
}

/**
 * Härledningen (uppdragets prioritetsordning, 1→5):
 * 1. Avbokad/Ombokad → 'avbokad'
 * 2. Inställt → 'installt'
 * 3. Flytta till väntelista → 'till-vantelista'
 * 4. Obekräftad → 'vantar-bekraftelse' (ÄVEN om betald — se docblock ovan)
 * 5. Annars (Bekräftad (mail skickat) ELLER Betalningspåminnelse skickad):
 *    betalKlar → 'klar', annars 'vantar-betalning'.
 */
export function hallplatsSteg(r: Registration): HallplatsSteg {
  if (r.status === RegistrationStatus.AVBOKAD) return 'avbokad';
  if (r.status === RegistrationStatus.INSTALLT) return 'installt';
  if (r.status === RegistrationStatus.FLYTTA_TILL_VANTELISTA) return 'till-vantelista';
  if (r.status === RegistrationStatus.OBEKRAFTAD) return 'vantar-bekraftelse';
  return betalKlar(r) ? 'klar' : 'vantar-betalning';
}

/**
 * Kategori-pillens text (förenklad kopia av `Deltagare.tsx`:s `KATEGORI_PILL`
 * — duplicerad hit eftersom Betalningar.tsx är en ANNAN skarp fil och
 * prototypkonventionen är egna märkta kastbara filer, inte tvärimport mellan
 * skarpa filer). Normen (via formulär) bär inget märke (K37).
 */
export function kategoriPillText(r: Registration): string | null {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'Manuellt tillagd';
    case RegistrationSource.MEDFOLJANDE:
      return 'Medföljande';
    case RegistrationSource.VANTELISTA:
      return 'Från väntelistan';
    default:
      return null;
  }
}

/**
 * FIXTURUPPSÄTTNINGEN (`?data=proto`) — 14 poster, in-memory, READ-ONLY.
 * Täcker research-dokens Del 3-nät + uppdragets datakrav:
 *
 *  · normalflöden i alla tre huvudsteg (01/02 · 03/04 · 05/06)
 *  · obekräftad+betald, Källa Manuell — Del 3 fall A (07, "Maria Holm")
 *  · bekräftad som aldrig betalar, redan påmind — Del 3 fall B (08, "Peter Lund")
 *  · avbokad ×2 — Del 3 fall C (09, 10)
 *  · Inställt — Del 3 fall D (11, "Nina Palm")
 *  · Flytta till väntelista — Del 3 fall D (12, "Oskar Dahl")
 *  · medföljande +1 — Del 3 fall E (13, "Emma Söder", länkad till 05)
 *  · från väntelistan (uppflyttad) — Del 3 fall E (14, "Gustav Wik")
 *
 * `eventId`/`personId` sätts av konsumenten (event.id resp. null — se
 * DeltagareHallplatsPrototyp.tsx docblock om varför personId alltid är null
 * här). `id`-prefixet `proto-hallplats-` gör fixturerna omisskännliga i DOM
 * och devtools.
 */
// [RIVEN, TASK-145.4, AC #10] `PROTO_MOTTAGEN_DATUM` (ITERATIONSVÅG 14, S93
// våg 14) bodde här — en prototyp-lokal uppslagstabell som lät Marcus SE
// mottagen-pillens datumform innan basbeslutet var taget (Anmälningsavgift
// fldJtKQ3qLxRKOvR6/Slutbetalning fldIImadnJUZHr5Qh är fortfarande singleSelect
// utan tidsstämpel, data-model.md:233-234). Marcus väg C (2026-08-07, PRD
// TASK-145 § Implementation Notes) slår fast att pillen SKA visa datum när
// domänmodellens fält bär värde — men fältet läggs i domänmodellen av
// TASK-147, inte här (samma "bygg inte ifall"-skäl som höll konstanten
// prototyp-lokal från början). `Betalningar.tsx`s `mottagenPillText(iso)`
// bär nu kontraktet rent (datum när `iso` finns, annars bara "Mottagen"),
// anropad med `null` tills TASK-147 landar det riktiga fältet.

function bas(overrides: Partial<Registration> & { id: string; namn: string }): Registration {
  return {
    fornamn: null,
    efternamn: null,
    email: `${overrides.namn.toLowerCase().replace(/\s+/g, '.')}@exempel.se`,
    telefon: null,
    eventNamn: null,
    ort: null,
    status: RegistrationStatus.OBEKRAFTAD,
    flagga: null,
    anmalningsavgift: null,
    slutbetalning: null,
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-20T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: null,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 0,
    borOver: false,
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    erfarenhetsbadge: null,
    kurshistorik: null,
    ...overrides,
  };
}

export const HALLPLATS_PROTO_FIXTURES: Registration[] = [
  // 01–02: väntar på bekräftelse (normalflöde)
  bas({
    id: 'proto-hallplats-01',
    namn: 'Anna Ek',
    status: RegistrationStatus.OBEKRAFTAD,
    inskickad: '2026-07-18T08:30:00.000Z',
  }),
  bas({
    id: 'proto-hallplats-02',
    namn: 'Erik Larsson',
    status: RegistrationStatus.OBEKRAFTAD,
    inskickad: '2026-07-22T10:15:00.000Z',
  }),
  // 03–04: väntar på betalning (normalflöde)
  bas({
    id: 'proto-hallplats-03',
    namn: 'Sara Nilsson',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-19T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
    // [PROTOTYPE] [S93] ITERATIONSVÅG 11 — LÅNGT-fallet. Peter Lund (08) visar
    // hur MYCKET som får plats; denna visar hur en ENSKILD notering bryter
    // när Lotta skriver som hon faktiskt skriver. Utan ett långt fall i
    // fixturen ser varje notering ut att rymmas på en rad, och radbrytningen
    // upptäcks först i prod.
    noteringAnmalningsavgift:
      'Hörde av sig 22/7: fick inte OCR-numret att fungera i Swish-appen, ' +
      'ska prova igen via bankgiro i stället. Bad om kvitto till jobbet ' +
      'eftersom arbetsgivaren betalar halva avgiften.',
  }),
  bas({
    id: 'proto-hallplats-04',
    namn: 'Johan Berg',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-19T09:05:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
  }),
  // 05–06: klara (normalflöde)
  bas({
    id: 'proto-hallplats-05',
    namn: 'Karin Ström',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-15T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.MOTTAGEN,
    antalGenomfordaEvent: 2,
    // [PROTOTYPE] [S93] review-fix-våg 2 (uppdraget § FYND 1, defekt 1):
    // Gruppdynamik bucketar denna person under "1–2 tidigare event" ur
    // `antalGenomfordaEvent`, men läste innan denna rad `kurshistorik: null`
    // (bas()-defaulten) — kortet visade då "Inga tidigare event" mitt i
    // "återkommande"-bucketen, en självmotsägelse INOM samma block. Två
    // GENOMFÖRDA rader (arGenomford: narvaro && session ∈ {Dag 1,
    // Föreläsning}) håller kurshistorik-antalet i synk med räknaren.
    kurshistorik: [
      {
        id: 'proto-hallplats-05-hist-1',
        kursnamn: 'Resor i medvetandet 1',
        eventLabel: 'Resor i medvetandet 1',
        datum: '2025-11-10',
        session: 'Dag 1',
        status: 'Bekräftad (mail skickat)',
        narvaro: true,
        ort: 'Stockholm',
        typ: 'Kurs',
      },
      {
        id: 'proto-hallplats-05-hist-2',
        kursnamn: 'Fjärrskådning',
        eventLabel: 'Fjärrskådning',
        datum: '2026-02-14',
        session: 'Dag 1',
        status: 'Bekräftad (mail skickat)',
        narvaro: true,
        ort: 'Stockholm',
        typ: 'Kurs',
      },
    ] satisfies PersonHistoryEntry[],
    // [PROTOTYPE] [S93] ITERATIONSVÅG 18 — badgen KONSISTENT med bucketen.
    // Karin har RIM 1 ×1 och RIM 2 ×0 ⇒ Erfarenhetsnivå "RIM steg 1" ⇒ badge
    // "Resenär steg 1" (data-model.md § Personer.Erfarenhetsbadge). Hon är
    // kontrollfallet mot Gustav Wik nedan, där badge och bucket DIVERGERAR.
    erfarenhetsbadge: 'Resenär steg 1',
    motivering:
      'Har gått RIM 1 och en fjärrskådningshelg tidigare. Vill fördjupa mig i ' +
      'det som öppnade sig då — särskilt hur man skiljer egna projektioner från ' +
      'faktisk information. Har övat regelbundet sedan i våras men kört fast på ' +
      'just den punkten och hoppas kunna få handledning på plats.',
  }),
  bas({
    id: 'proto-hallplats-06',
    namn: 'Fredrik Åkesson',
    status: RegistrationStatus.BEKRAFTAD,
    bekraftelseSkickad: '2026-07-16T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_RELEVANT,
  }),
  // 07: Del 3 fall A — obekräftad OCH betald, Källa Manuell
  bas({
    id: 'proto-hallplats-07',
    namn: 'Maria Holm',
    status: RegistrationStatus.OBEKRAFTAD,
    kalla: RegistrationSource.MANUELL,
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
    inskickad: '2026-07-25T14:00:00.000Z',
  }),
  // 08: Del 3 fall B — bekräftad, betalar aldrig, redan påmind.
  //
  // [PROTOTYPE] [S93] ITERATIONSVÅG 11 — DENNA POST ÄR "MAXAD" (Marcus
  // 2026-08-06: "Du får ju skriva ut några exempel därav några som har allt
  // som en person kan ha, alla noteringar, alla utskick. Så man kan se hur
  // det kan se ut sedan.").
  //
  // Peter Lund var redan fallet "betalar aldrig, redan påmind" och är därför
  // den ENDA posten där hela utskicks-kedjan är trovärdig samtidigt:
  // bekräftelse → påminnelse avgift → påminnelse slutbetalning → eventinfo,
  // plus notering på BÅDA betalningarna. Fyra utskick + två noteringar är
  // taket för vad en person kan bära på denna yta.
  //
  // Posten BERIKADES i stället för att en ny lades till: fixturen är 14
  // poster och konsumeras även av registret, gruppdynamiken och
  // beläggningen — en femtonde post hade flyttat varenda räknare i de
  // vyerna för en fråga som bara gäller betalningskortets form.
  bas({
    id: 'proto-hallplats-08',
    namn: 'Peter Lund',
    status: RegistrationStatus.BETALNINGSPAMINNELSE,
    bekraftelseSkickad: '2026-06-20T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.EJ_MOTTAGEN,
    slutbetalning: PaymentStatus.EJ_MOTTAGEN,
    betalningspaminnelseSkickad: '2026-07-10T09:00:00.000Z',
    paminnelseAnmalningsavgiftSkickad: '2026-07-10T09:00:00.000Z',
    paminnelseSlutbetalningSkickad: '2026-07-24T08:30:00.000Z',
    deltagarinfoSkickad: '2026-07-28T07:00:00.000Z',
    noteringAnmalningsavgift: 'Ringde 24/7 — lovade Swisha samma kväll, inget inkommet.',
    noteringSlutbetalning: 'Vill dela upp i två delbetalningar. Väntar på besked från Roger.',
  }),
  // 09–10: Del 3 fall C — avbokade (exkluderas ur `aktiva`, egen räknerad)
  bas({
    id: 'proto-hallplats-09',
    namn: 'Lisa Fransson',
    status: RegistrationStatus.AVBOKAD,
  }),
  bas({
    id: 'proto-hallplats-10',
    namn: 'Tomas Berggren',
    status: RegistrationStatus.AVBOKAD,
  }),
  // 11: Del 3 fall D — Inställt (arrangör-initierat)
  bas({
    id: 'proto-hallplats-11',
    namn: 'Nina Palm',
    status: RegistrationStatus.INSTALLT,
    bekraftelseSkickad: '2026-07-05T09:00:00.000Z',
  }),
  // 12: Del 3 fall D — Flytta till väntelista (på väg NER)
  bas({
    id: 'proto-hallplats-12',
    namn: 'Oskar Dahl',
    status: RegistrationStatus.FLYTTA_TILL_VANTELISTA,
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
  }),
  // 13: Del 3 fall E — medföljande (+1), betalning ofta huvudpersonens
  bas({
    id: 'proto-hallplats-13',
    namn: 'Emma Söder',
    status: RegistrationStatus.BEKRAFTAD,
    kalla: RegistrationSource.MEDFOLJANDE,
    medfoljandeTill: 'proto-hallplats-05',
    bekraftelseSkickad: '2026-07-15T09:00:00.000Z',
    anmalningsavgift: PaymentStatus.MOTTAGEN,
    slutbetalning: PaymentStatus.MOTTAGEN,
  }),
  // 14: Del 3 fall E — från väntelistan (uppflyttad, egen bana)
  bas({
    id: 'proto-hallplats-14',
    namn: 'Gustav Wik',
    status: RegistrationStatus.OBEKRAFTAD,
    kalla: RegistrationSource.VANTELISTA,
    inskickad: '2026-07-28T09:00:00.000Z',
    // [PROTOTYPE] [S93] ITERATIONSVÅG 18 — T16-DIVERGENSEN, GJORD SYNLIG.
    //
    // Gustav bär TRE genomförda RIM 3-event. Det ger:
    //   · `antalGenomfordaEvent: 3`  ⇒ Gruppdynamik bucketar honom "3+ tidigare
    //     event" (basens RIM-3-INKLUDERANDE räknare `Antal genomförda event`)
    //   · `erfarenhetsbadge: 'Ej påbörjat'` ⇒ personens kanoniska badge, som är
    //     RIM-3-BLIND: Erfarenhetsnivå räknar `Totala deltaganden (gammal)` =
    //     RIM 1 × + RIM 2 × + Fjärrskådning ×, alltså UTAN RIM 3
    //     (data-model.md § Kända buggar i insiktskedjan).
    //
    // Ett kort som säger "3+ tidigare event" och "Ej påbörjat" samtidigt ser ut
    // som ett renderingsfel — men det ÄR basens sanning, och Gruppdynamiks
    // docblock slår uttryckligen fast att divergensen ska visas RÅ, aldrig
    // bortdesignas. Utan detta fixturfall kan formen aldrig granskas: den
    // enda instansen är osynlig tills den dyker upp i prod.
    //
    // Posten fyller dessutom "3+ tidigare event"-bucketen, som stod på 0 och
    // därför aldrig gick att se utfälld.
    antalGenomfordaEvent: 3,
    erfarenhetsbadge: 'Ej påbörjat',
    kurshistorik: [
      {
        id: 'proto-hallplats-14-hist-1',
        kursnamn: 'Resor i medvetandet 3',
        eventLabel: 'Resor i medvetandet 3',
        datum: '2025-03-08',
        session: 'Dag 1',
        status: 'Bekräftad (mail skickat)',
        narvaro: true,
        ort: 'Göteborg',
        typ: 'Kurs',
      },
      {
        id: 'proto-hallplats-14-hist-2',
        kursnamn: 'Resor i medvetandet 3',
        eventLabel: 'Resor i medvetandet 3',
        datum: '2025-09-20',
        session: 'Dag 1',
        status: 'Bekräftad (mail skickat)',
        narvaro: true,
        ort: 'Stockholm',
        typ: 'Kurs',
      },
      {
        id: 'proto-hallplats-14-hist-3',
        kursnamn: 'Resor i medvetandet 3',
        eventLabel: 'Resor i medvetandet 3',
        datum: '2026-04-11',
        session: 'Dag 1',
        status: 'Bekräftad (mail skickat)',
        narvaro: true,
        ort: 'Malmö',
        typ: 'Kurs',
      },
    ] satisfies PersonHistoryEntry[],
    motivering: 'Stod på väntelistan i våras och vill gärna ta chansen nu.',
  }),
];
