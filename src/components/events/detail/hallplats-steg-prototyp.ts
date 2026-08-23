/**
 * Registrets steg-modell och filter-logik — PRODUKTIONSKOD sedan
 * TASK-145.1/145.2/162.3 (ADR-103 B2 steg 1), trots filnamnet. Ren härledning
 * (ingen React, inga hooks) delad av `DeltagareHallplatsPrototyp.tsx`,
 * `Deltagare.tsx` och `Betalningar.tsx`.
 *
 * [RIVEN, TASK-145.6, AC #1] Modulen bar tidigare hela hållplats-prototypens
 * `?variant=`-väljare (`HallplatsVariant`, `isHallplatsVariant`) och en
 * fixtururuppsättning (`HALLPLATS_PROTO_FIXTURES`, 14 in-memory-poster) för
 * fixturläget (`?data=proto`) — se historiken i denna fils blame. Efter
 * Marcus godkännande av den promoverade ytan (ADR-103 B2 steg 4) är båda
 * rivna: filen läses numera alltid mot riktig data, ingen variant kvar att
 * välja. FILNAMNET är en öppet bokförd kvarleva (AC #5) — samma skäl som
 * `DeltagareHallplatsPrototyp.tsx`s docblock: en `git mv` hade krävt
 * import-uppdatering i tre skarpa filer för en rent kosmetisk vinst,
 * deferrad hellre än gjord mitt i denna rivning.
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
 * `DeltagareHallplatsPrototyp.tsx`), och byggdes ut till HELA den grillade
 * strukturen. `registerOrdning()` nedan tillkom då (Del 3 beslut 2/3 —
 * registrets fyra sorterings-hinkar, finmaskigare än `hallplatsSteg()`s tre).
 */
import type { Registration } from '@/domain/models/Registration';
import {
  PaymentStatus,
  RegistrationSource,
  type RegistrationSourceValue,
  RegistrationStatus,
} from '@/domain/types/Status';

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
  'eventinfo-saknas': 'Saknar deltagarinfo',
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
 * [RIVEN, TASK-145.6, AC #1/#2] `HALLPLATS_PROTO_FIXTURES` (14 in-memory
 * READ-ONLY-poster, `id`-prefix `proto-hallplats-`) + dess `bas()`-hjälpare
 * bodde här — fixturuppsättningen som drev `?data=proto`-läget i
 * Deltagare.tsx/Betalningar.tsx/Belaggning.tsx/Anteckningar.tsx/
 * Gruppdynamik.tsx. `PROTO_MOTTAGEN_DATUM` (samma fixturblock) var redan
 * riven sedan TASK-145.4. Rivningen är villkorad (ADR-102 B3-spärren,
 * ADR-104 check-facit-invarianten): Marcus godkännande av den promoverade
 * ytan (`tasks/sessions/bilagor/s93-hallplats-prototyp/facit.json`) satte
 * `godkand` innan detta kort plockades. Git bevarar fixturerna (denna fils
 * blame, senast före denna commit).
 */
