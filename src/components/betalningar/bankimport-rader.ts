import { type Matchning, matchaTransaktion } from './bankimport-matchning';
import type { ImporteradRad, Parsresultat } from './bankimport-parser';
import type { InkorgsRad } from './inkorg-harledningar';

/**
 * [TASK-346.10 AC #3 och #4, PRD berättelse 19-22] Bekräftelselistans
 * tillstånd: vad varje bankrad blev, vad Lotta ska bocka i, och vad som
 * redan finns.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DUBBLETTSKYDDET LIGGER I DATABASEN. DENNA MODUL GÖR DET SYNLIGT.
 * ═══════════════════════════════════════════════════════════════════════════
 * Detta är den viktigaste meningen i filen, och den är skriven så här därför
 * att den lätt läses fel åt andra hållet.
 *
 * `inbetalningar.bankreferens` bär ett PARTIELLT UNIKT INDEX
 * (`inbetalningar_bankreferens_unik_idx`, unikt när kolumnen är satt,
 * migration `20260830195728`). Försöker någon skriva en referens som redan
 * finns avvisas raden av POSTGRES, och `registrera-inbetalning` översätter
 * det till HTTP 409 med koden `dubblett_bankreferens`. Det gäller oavsett
 * vilken webbläsare, enhet eller människa som importerar, och det gäller när
 * loggen nedan är tom, rensad eller från en annan dator.
 *
 * Den LOKALA importloggen (`bankmappning-minne.ts`) är ett HJÄLPMEDEL FÖR
 * ÖGAT: den låter listan säga "importerad 30 aug" INNAN Lotta trycker, i
 * stället för att raden faller ut som omatchad. Varför den annars skulle
 * göra det är värt att förstå: matchningen söker bland ÖPPNA betalningar,
 * och en anmälan som redan är betald är inte längre öppen. Utan loggen hade
 * en omimport alltså sett ut som "vi hittade ingen" i stället för "den här
 * har du redan tagit".
 *
 * Loggen avgör ingenting. Den räknar och märker.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FYRA HÖGAR, OCH VARJE BANKRAD LIGGER I EXAKT EN
 * ═══════════════════════════════════════════════════════════════════════════
 * Åtta rader i banken måste bli åtta rader i appen. En rad som varken
 * registreras eller syns någonstans är det enda utfall Lotta inte kan
 * upptäcka, och därför det enda som aldrig får inträffa.
 *
 *   - SÄKRA: telefonträff, förbockade, klara att registrera.
 *   - OSÄKRA: kandidater att välja mellan.
 *   - OMATCHADE: sökfältet.
 *   - REDAN REGISTRERADE: hopfällda, räknade (AC #3).
 *
 * Parserns egna två högar (bortfiltrerade och fel) räknas separat och visas
 * också - se `SwishImport.tsx`.
 */

/** Utfallet för EN rad efter att bekräftelsen körts. */
export type Radutfall =
  | { klass: 'registrerad'; inbetalningId: string; kvittens: string }
  | { klass: 'dubblett' }
  | { klass: 'fel'; skal: string };

export type Importradstillstand = {
  rad: ImporteradRad;
  matchning: Matchning;
  /**
   * Anmälan raden ska bokföras på (`anmalanRecordId`), eller `null`.
   * Förvald bara när matchningen är SÄKER.
   */
  vald: string | null;
  /** Tas raden med när Lotta trycker bekräfta? */
  ibockad: boolean;
  /** Ska ett kvitto skickas för raden? Samma default som formuläret. */
  medKvitto: boolean;
  /** Datumet raden importerades tidigare, enligt den lokala loggen. */
  tidigareImporterad: string | null;
  utfall: Radutfall | null;
};

/**
 * Radens stabila nyckel — ALLTID radnumret, aldrig bankreferensen.
 *
 * RÄTTAT (fix-runda 2, granskning runda 1, fynd 7): nyckeln bar tidigare
 * `bankreferens ?? 'rad-<n>'`, och kolliderar när FLERA rader delar samma
 * bankreferens — vilket mappningsdialogen gör möjligt (Lotta kan peka ut
 * VILKEN kolumn som helst som "Bankens referens", inklusive en med ett
 * konstant värde). Nyckeln bär TRE laster samtidigt (React-`key` i
 * bekräftelselistan, uppslaget i `andraRad`, och nyckeln i `bekrafta()`s
 * utfallskarta), så en kollision hade låtit en ändring på EN rad träffa en
 * ANNAN, och den sista radens utfall skriva över den förstas — en faktiskt
 * registrerad rad hade kunnat visas som "Redan registrerad". Radnumret
 * (`ImporteradRad.radnummer`, 1-baserat, filens egen radräkning) är per
 * definition UNIKT inom en och samma import, oavsett vad bankreferensen
 * råkar bära. Bankreferensen förblir dubblettnyckeln mot DATABASEN
 * (`inbetalningar_bankreferens_unik_idx`) — den behöver aldrig vara
 * React-nyckeln för att fylla den rollen.
 */
export function radnyckel(rad: ImporteradRad): string {
  return `rad-${rad.radnummer}`;
}

/**
 * Bygger listans starttillstånd.
 *
 * DE TRE DEFAULTVÄRDENA, var och en ur AC #4:
 *
 *   - "säkra rader förbockade": `saker` ger `ibockad: true` och `vald` satt.
 *   - "osäkra visar kandidater": `osaker` ger `ibockad: false` och `vald:
 *     null`. En förvald kandidat hade varit en gissning med en bock framför,
 *     och det är exakt vad AC #1 förbjuder på formatnivå.
 *   - "omatchade får sökfältet": `omatchad` ger samma, plus att komponenten
 *     visar sökfältet.
 *
 * EN REDAN IMPORTERAD RAD BOCKAS ALDRIG I, oavsett hur säker matchningen är.
 * Den hamnar i sin egen hög och räknas där (AC #3: "hoppas över och räknas
 * synligt").
 */
export function byggImportrader(
  parsat: Parsresultat,
  oppna: readonly InkorgsRad[],
  importlogg: ReadonlyMap<string, string>,
): Importradstillstand[] {
  return parsat.rader.map((rad) => {
    const matchning = matchaTransaktion(rad.transaktion, oppna);
    const referens = rad.transaktion.bankreferens;
    const tidigareImporterad = referens === null ? null : (importlogg.get(referens) ?? null);
    const saker = matchning.klass === 'saker';

    return {
      rad,
      matchning,
      vald: saker ? matchning.kandidater[0].betalning.anmalanRecordId : null,
      ibockad: saker && tidigareImporterad === null,
      medKvitto: true,
      tidigareImporterad,
      utfall: null,
    };
  });
}

/**
 * Raderna som INTE redan är importerade, alltså listans arbetsyta.
 * De redan importerade når man med `redanImporterade`.
 */
export function attHantera(rader: readonly Importradstillstand[]): Importradstillstand[] {
  return rader.filter((rad) => rad.tidigareImporterad === null);
}

export function redanImporterade(rader: readonly Importradstillstand[]): Importradstillstand[] {
  return rader.filter((rad) => rad.tidigareImporterad !== null);
}

/**
 * Raderna som faktiskt skickas när Lotta bekräftar: ibockade, med en vald
 * anmälan, och inte redan registrerade i denna körning.
 *
 * KRAVET PÅ `vald` ÄR EN SPÄRR, inte en formalitet. En ibockad rad utan
 * anmälan har ingenstans att ta vägen, och att skicka den hade gett ett
 * serverfel i stället för det uppenbara svaret: Lotta har inte valt än.
 * Komponenten kan därför aldrig bocka i en rad utan att också sätta `vald`.
 */
export function raderAttRegistrera(rader: readonly Importradstillstand[]): Importradstillstand[] {
  return rader.filter(
    (rad) =>
      rad.ibockad &&
      rad.vald !== null &&
      rad.tidigareImporterad === null &&
      rad.utfall?.klass !== 'registrerad',
  );
}

export type Importsammanfattning = {
  /** Rader lästa ur filen. */
  lasta: number;
  /** Rader som redan finns, enligt loggen ELLER enligt serverns svar (AC #3). */
  redanRegistrerade: number;
  sakra: number;
  osakra: number;
  omatchade: number;
  /** Rader som fått en inbetalning i denna körning. */
  registrerade: number;
  /** Rader som fallerade av något annat skäl än dubblett. */
  misslyckade: number;
  /** Rader som är klara att skickas just nu. */
  attRegistrera: number;
};

/**
 * Talen listan visar.
 *
 * `redanRegistrerade` SLÅR IHOP TVÅ VÄGAR till samma sanning: rader loggen
 * kände igen innan bekräftelsen, och rader servern avvisade med 409 under
 * den. För Lotta är det ett och samma faktum ("den här har du redan tagit"),
 * och att visa dem som två olika tal hade gjort AC #3:s mening
 * ("3 rader redan registrerade") till två meningar som inte går att lägga
 * ihop.
 *
 * De två vägarna är däremot inte utbytbara, och det syns i vad de täcker:
 * loggen känner bara till denna webbläsare, servern känner till allt.
 */
export function sammanfattaImport(rader: readonly Importradstillstand[]): Importsammanfattning {
  const arbetsyta = attHantera(rader);
  return {
    lasta: rader.length,
    redanRegistrerade:
      redanImporterade(rader).length +
      rader.filter((rad) => rad.utfall?.klass === 'dubblett').length,
    sakra: arbetsyta.filter((rad) => rad.matchning.klass === 'saker').length,
    osakra: arbetsyta.filter((rad) => rad.matchning.klass === 'osaker').length,
    omatchade: arbetsyta.filter((rad) => rad.matchning.klass === 'omatchad').length,
    registrerade: rader.filter((rad) => rad.utfall?.klass === 'registrerad').length,
    misslyckade: rader.filter((rad) => rad.utfall?.klass === 'fel').length,
    attRegistrera: raderAttRegistrera(rader).length,
  };
}

/* ═══════════════════════════ SERVERNS DUBBLETTSVAR ═══════════════════════════ */

/**
 * Är felet serverns dubblett-avvisning (AC #3)?
 *
 * `registrera-inbetalning` svarar HTTP 409 med `code:
 * 'dubblett_bankreferens'` när Postgres partiella unika index avvisar en
 * referens som redan finns. Det är den ENDA vägen som vet sanningen om HELA
 * databasen; importloggen känner bara till denna webbläsare.
 *
 * KONTROLLEN ÄR STRUKTURELL, INTE `instanceof`. Två skäl: modulen förblir ren
 * och testbar utan att dra in nätverkslagret, och en dubblett känns igen även
 * om felet passerat en gräns som tappat prototypkedjan.
 *
 * `status` ensamt räcker som signal, och det är avsiktligt trots att kroppens
 * `code`-fält finns: `registrera-inbetalning` har EXAKT ett 409-svar (sök
 * `409` i dess `index.ts`), så ingen annan avvisning kan förväxlas. Skulle
 * ett andra 409 tillkomma måste denna funktion läsa `code` - och det är
 * skälet till att kontrollen bor här, i en testad funktion, i stället för som
 * ett `err.status === 409` i en JSX-gren.
 */
export function arDubblettfel(fel: unknown): boolean {
  return (
    typeof fel === 'object' &&
    fel !== null &&
    'status' in fel &&
    (fel as { status?: unknown }).status === 409
  );
}
