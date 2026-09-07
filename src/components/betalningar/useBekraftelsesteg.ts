import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useJobbstatus } from '@/data/betalningar/useJobbstatus';
import {
  useKoaKvitton,
  useRaderaInbetalning,
  useRegistreraInbetalning,
} from '@/data/mutations/inbetalningar';
import { useForhandsgranskaAllaKvitton, useForhandsgranskaKvitto } from '@/data/mutations/kvitton';
import type { OppenBetalning } from '@/domain/schemas';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
import { arDubblettfel } from './bankimport-rader';
import { bokforImporterade } from './bankmappning-minne';
import {
  aktivtBeloppslage,
  arRegistrerbar,
  type BekraftelseRad,
  type Beloppsgenvag,
  type Beloppslage,
  baraOmkorning,
  beloppForNyMarkerad,
  byggImportrad,
  byggImportsteg,
  byggRader,
  genvagsbelopp,
  type ObestamdImportrad,
  omkorningsUrval,
  type Radvarden,
  sattBeloppslage,
  summera,
  vantandeKvitton,
} from './bekraftelsesteg-harledningar';
import type { BekraftelsestegModell } from './bekraftelsesteg-modell';
import { visaKronor } from './belopp-inmatning';
import type { Betalsatt } from './betalsatt-minne';
import { lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { type Importminne, importoversiktFranMinne } from './importminne';
import {
  harledRad,
  type InkorgsRad,
  jobbDelutfall,
  rankaTraffar,
  tolkaTakfel,
} from './inkorg-harledningar';
import type { SessionsRad } from './RegistreratNuBlock';

/**
 * [TASK-402.3] Bekräftelsestegets SKARPA modell — samma `BekraftelsestegModell`
 * som prototypens simulering uppfyllde, men varje handling går genom
 * INKORGENS BEFINTLIGA vägar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INGEN NY EDGE FUNCTION, INGET BATCH-KONTRAKT (AC #5)
 * ═══════════════════════════════════════════════════════════════════════════
 * Fyra mutationer, alla redan i bruk av `BetalningsInkorg.tsx`:
 *
 *   `useRegistreraInbetalning`  EN post per rad (`registrera-inbetalning`)
 *   `useKoaKvitton`             kvittokön (`koa-kvitton`)
 *   `useRaderaInbetalning`      Ångra (`hantera-inbetalning`, atgard radera)
 *   `useForhandsgranska*`       kvitto-PDF:en
 *
 * AVVÄGNINGEN ÄR PRD:NS EGEN (`TASK-402` § Körningen är ett steg): "N anrop om
 * cirka en halv sekund ligger inom spinner-fönstret för en morgons volym; ett
 * batch-kontrakt är en senare optimering om mätning kräver det". Priset är
 * synligt och bokfört: `useRegistreraInbetalning` invaliderar
 * `betalningar.all` + `registrations.all` efter VARJE rad, så en tio-raders
 * körning utlöser tio invalideringar. Det är exakt vad "samma kontrakt som
 * enradsregistreringen" betyder — en egen, tystare väg hade varit ett andra
 * kontrakt med egna buggar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SEKVENTIELLT, INTE PARALLELLT — OCH DET ÄR ETT BESLUT
 * ═══════════════════════════════════════════════════════════════════════════
 * `for … await` i stället för `Promise.all`. Tre skäl, i fallande ordning:
 *   1. RÄKNINGEN. "k av N registrerade …" är meningsfull bara om k växer
 *      monotont i en känd ordning (`ADR-112`s förloppskanal).
 *   2. AIRTABLE-TAKET. Varje `registrera-inbetalning` skriver spegeln, och
 *      taket DELAS med Lottas egna klick och automationerna A1–A11
 *      (`ADR-063` § S91-not). Tio parallella skrivningar är ett självmål.
 *   3. FELISOLERINGEN. En rad som fallerar ska inte kunna avbryta de andra
 *      (AC #6); ett `try`/`catch` per varv är den enklaste formen av det.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FELTEXTEN ÄR SERVERNS, INTE EN EGEN
 * ═══════════════════════════════════════════════════════════════════════════
 * En fallerad rad bär `err.message` rått — samma val `RegistreraForm.tsx`
 * redan gör vid `registrera.isError` (`{registrera.error.message}` i en
 * `role="alert"`). Prototypens `FEL_TEXT` ("Beloppet kunde inte sparas.
 * Försök igen.") var ett PÅHITT: fixturen hade ingen server att citera. Att
 * behålla den påhittade texten i den skarpa ytan hade dolt serverns egen
 * diagnos för Lotta — en formregression förklädd till formtrohet.
 * Skillnaden är bokförd som amendering i facit-katalogen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FÖRHANDSGRANSKNINGENS MÖNSTER ÄR INKORGENS, KOPIERAT MED AVSIKT
 * ═══════════════════════════════════════════════════════════════════════════
 * Fönstret öppnas SYNKRONT före `mutateAsync` (annars blockerar Safari
 * popupen), vakten är per nyckel i ett `Set` (inte `mutation.isPending` — den
 * är delad mellan rader), och felet nollställs vid varje nytt försök
 * (lokalt state självläker inte som TanStacks eget). Hela resonemanget står i
 * `BetalningsInkorg.tsx` § `forhandsgranskaKvitto` och upprepas inte här.
 *
 * ATT LOGIKEN FINNS PÅ TVÅ STÄLLEN ÄR EN BOKFÖRD KANDIDAT, INTE EN MISS:
 * `TASK-402.2` bröt ut BLOCKET (renderingen), inte containerns callbacks. En
 * delad `useForhandsgranskningsflode`-hook är rätt nästa steg — den rör
 * `BetalningsInkorg.tsx`, som ägs av `TASK-402.1` i denna våg, och gjordes
 * därför inte här.
 */

/**
 * Sentinel-nyckeln för "Förhandsgranska N kvitton" i `forhandsgranskaPagar`.
 *
 * SAMMA LITERAL som `BetalningsInkorg.tsx` § `FORHANDSGRANSKA_ALLA_NYCKEL`,
 * och kollisionsfri av samma skäl: inbetalnings-id:n är uuid:er, och `__alla__`
 * är inget uuid. Konstanten är LOKAL på båda ställena — de två `Set`:en är
 * skilda tillstånd i skilda komponenter och delar ingen nyckelrymd, så en
 * gemensam export hade antytt en koppling som inte finns.
 */
const FORHANDSGRANSKA_ALLA_NYCKEL = '__alla__';

function felText(fel: unknown): string {
  return fel instanceof Error ? fel.message : 'Okänt fel';
}

/**
 * Hooken som bär bekräftelsestegets hela tillstånd mot de skarpa vägarna.
 *
 * `oppna` är urvalet (matarens `ids`), `idag` är dagens ISO-datum. Byter
 * urvalet identitet byggs raderna om — men BARA när själva NYCKELMÄNGDEN
 * ändrats: `useRegistreraInbetalning`s invalidering ger en ny array-instans
 * efter varje rad, och utan signatur-jämförelsen hade körningen byggt om sina
 * egna rader mitt i sig själv.
 */
export function useBekraftelsesteg(
  oppna: readonly OppenBetalning[],
  idag: string,
  minne: Importminne | null = null,
): BekraftelsestegModell {
  const startBetalsatt = useMemo(() => lasSenasteBetalsatt(), []);
  const [rader, setRader] = useState<BekraftelseRad[]>(() =>
    minne === null
      ? byggRader(oppna, idag, startBetalsatt)
      : byggImportsteg(minne.rader, oppna, idag, startBetalsatt).rader,
  );
  /**
   * [TASK-402.4] Importrader utan anmälan, plus dubbletterna. Tom lista i den
   * manuella och Åtgärds-sidans matare.
   */
  const [obestamda, setObestamda] = useState<ObestamdImportrad[]>(() =>
    minne === null ? [] : byggImportsteg(minne.rader, oppna, idag, startBetalsatt).obestamda,
  );
  const [fas, setFas] = useState<'redigera' | 'registrerar' | 'klart'>('redigera');
  const [korning, setKorning] = useState<{ totalt: number; klara: number } | null>(null);
  const [aktivGenvag, setAktivGenvag] = useState<Beloppsgenvag | null>('forslag');
  const [batchBetalsatt, setBatchBetalsatt] = useState<Betalsatt>(startBetalsatt);
  const [batchDatum, setBatchDatum] = useState(idag);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  const [bekraftelseSynlig, setBekraftelseSynlig] = useState(true);
  const [angraFel, setAngraFel] = useState<string | null>(null);
  const [forhandsgranskaPagar, setForhandsgranskaPagar] = useState<ReadonlySet<string>>(new Set());
  const [forhandsgranskaFel, setForhandsgranskaFel] = useState<{
    namn: string | null;
    message: string;
  } | null>(null);
  const granskningsBlockRef = useRef<HTMLElement>(null);

  // Speglar `rader` synkront så `registrera()` kan läsa ögonblicksbilden utan
  // att lägga en sidoeffekt i en state-updater.
  const raderRef = useRef(rader);
  raderRef.current = rader;

  /**
   * OMBYGGNADS-SIGNATUREN — två källor, och de har OLIKA identitet med avsikt.
   *
   * MANUELLA MATAREN: urvalet ÄR de öppna betalningarnas ID-mängd, så den
   * mängden är signaturen (oförändrat sedan `TASK-402.3`).
   *
   * [TASK-402.4] IMPORTEN: raderna kommer ur importminnet, och minnets
   * `skapad`-stämpel är dess identitet. De öppna betalningarna får INTE ingå,
   * och det är ett mätt krav: importens rader byggs mot HELA den öppna
   * mängden (en omatchad rads sökfält söker i den), och den mängden krymper
   * efter varje registrering eftersom `useRegistreraInbetalning` invaliderar
   * `betalningar.all` och en fullbetald anmälan inte längre är öppen. Med
   * `oppna` i signaturen hade alltså varje rad som registrerades byggt om
   * hela listan under körningen.
   */
  const signaturRef = useRef<string>('');
  const signatur =
    minne === null
      ? `${idag}|${oppna.map((o) => o.anmalanRecordId).join(',')}`
      : `${idag}|import:${minne.skapad}`;
  /**
   * [TASK-402.4, MÄTT FYND UR DENNA SKIVAS E2E] EN KÖRNING BYGGS ALDRIG OM
   * UNDER FÖTTERNA.
   *
   * Ombyggnaden fanns för att fånga ett BYTT URVAL. Den kunde också fyra mitt
   * i en körning: `useRegistreraInbetalning` invaliderar `betalningar.all`
   * efter VARJE rad, refetchen tar bort den nyss betalda anmälan ur de öppna,
   * och den manuella matarens signatur ändras därmed av sin egen körning.
   * Följden var att `fas` föll tillbaka till `redigera`, redan skrivna utfall
   * gick förlorade och den registrerade radens kort försvann ur listan mitt i
   * spinnern.
   *
   * Felet var strukturellt osynligt i `TASK-402.3`:s svit, vars mock svarar
   * med en STATISK lista och alltså aldrig producerar den krympande mängd
   * servern faktiskt ger. Denna skivas import-e2e speglar servern (en
   * registrerad rad lämnar de öppna), och då föll den.
   *
   * Vakten är därför inte importens: den skyddar båda matarna. En körning som
   * pågår eller har lämnat ett utfall efter sig äger sina rader tills Lotta
   * lämnar sidan.
   */
  const korningAger = fas !== 'redigera' || rader.some((rad) => rad.utfall !== null);
  if (signatur !== signaturRef.current && !korningAger) {
    signaturRef.current = signatur;
    if (minne === null) {
      setRader(byggRader(oppna, idag, startBetalsatt));
      setObestamda([]);
    } else {
      const byggt = byggImportsteg(minne.rader, oppna, idag, startBetalsatt);
      setRader(byggt.rader);
      setObestamda(byggt.obestamda);
    }
    setFas('redigera');
    setAktivGenvag('forslag');
    setBatchDatum(idag);
  }

  /**
   * [MÄTT FYND, RÄTTAT] ETT NYTT JOBB GÖR EN AVFÄRDAD BEKRÄFTELSE AKTUELL IGEN
   * — samma effekt `BetalningsInkorg.tsx` bär, och av exakt samma skäl.
   *
   * `registrera()` och `skickaKvitton()` sätter `bekraftelseSynlig = false`
   * ("nästa handling gör den gamla bekräftelsen inaktuell", TASK-362). Utan
   * denna effekt blockerade den avfärdningen sedan den NYA sändningens egen
   * status: efter "Registrera och skicka" gick alla nio kvittona i väg, men
   * blockets statusrad stod TOM där "9 kvitton skickade" skulle synas —
   * `jobbDelutfall` ger `intent: 'success'`, och success-raden är villkorad av
   * `bekraftelseSynlig` (`RegistreratNuBlock.tsx`). Mätt i promoverings-
   * grindens första EFTER-körning: raden `- status` renderades tom.
   *
   * `useRef` och inte ett andra `useState`: jämförelsen ska grinda EN
   * `setBekraftelseSynlig`, inte trigga en egen render.
   */
  const foregJobbId = useRef(jobbId);
  useEffect(() => {
    if (foregJobbId.current !== jobbId) {
      foregJobbId.current = jobbId;
      setBekraftelseSynlig(true);
    }
  }, [jobbId]);

  const registrera = useRegistreraInbetalning();
  const koa = useKoaKvitton();
  const radera = useRaderaInbetalning();
  const forhandsgranska = useForhandsgranskaKvitto();
  const forhandsgranskaAllaMutation = useForhandsgranskaAllaKvitton();
  const jobb = useJobbstatus(jobbId, jobbId !== undefined);

  const sattGenvag = useCallback((genvag: Beloppsgenvag) => {
    setAktivGenvag(genvag);
    setRader((tidigare) =>
      tidigare.map((rad) => {
        if (genvag === 'annat') return { ...rad, belopp: '', ejGenomforbar: null };
        const belopp = genvagsbelopp(rad, genvag);
        return belopp === null
          ? { ...rad, belopp: '', ejGenomforbar: genvag }
          : { ...rad, belopp: visaKronor(belopp), ejGenomforbar: null };
      }),
    );
  }, []);

  /**
   * [TASK-402.8] "Sätt alla belopp" — regeln bor i härledningen, inte här.
   * `setRader` med den rena funktionen är hela implementationen; kanterna
   * (rad utan kandidat, hand-högen, redan registrerad, avmarkerad) prövas i
   * `tests/api/bekraftelsesteg-harledningar.test.ts`.
   */
  const sattBeloppslageNu = useCallback((lage: Beloppslage) => {
    // [varv 5] LÄGET ÄR TILLSTÅND, inte en engångshandling: det visas i
    // kapseln OCH styr vad en rad som markeras senare får för belopp.
    setAktivGenvag(lage);
    setRader((tidigare) => sattBeloppslage(tidigare, lage));
  }, []);

  const sattBetalsattAlla = useCallback((betalsatt: Betalsatt) => {
    setBatchBetalsatt(betalsatt);
    setRader((tidigare) => tidigare.map((rad) => ({ ...rad, betalsatt })));
  }, []);

  const sattDatumAlla = useCallback((datum: string) => {
    setBatchDatum(datum);
    setRader((tidigare) => tidigare.map((rad) => ({ ...rad, datum })));
  }, []);

  /** En fältändring på EN rad — den enda formen alla `sattRad*` behöver. */
  const andraRad = useCallback((nyckel: string, andring: Partial<BekraftelseRad>) => {
    setRader((tidigare) =>
      tidigare.map((rad) => (rad.nyckel === nyckel ? { ...rad, ...andring } : rad)),
    );
  }, []);

  /* [varv 4] EN HANDREDIGERING SLÄCKER TOGGELN. Efter den bär raderna inte
     längre ett uniformt val, och en intryckt pill hade påstått något som inte
     är sant. Samma sak när en rad MARKERAS: den kommer in i mängden med sitt
     eget belopp, inte med valets. En AVmarkering rör däremot ingenting — de
     kvarvarande raderna bär fortfarande valet. */
  const sattRadBelopp = useCallback(
    (nyckel: string, belopp: string) =>
      andraRad(nyckel, { belopp, ejGenomforbar: null, handredigerad: true }),
    [andraRad],
  );
  const sattRadBetalsatt = useCallback(
    (nyckel: string, betalsatt: Betalsatt) => andraRad(nyckel, { betalsatt }),
    [andraRad],
  );
  const sattRadDatum = useCallback(
    (nyckel: string, datum: string) => andraRad(nyckel, { datum }),
    [andraRad],
  );
  const sattRadKvitto = useCallback(
    (nyckel: string, medKvitto: boolean) => andraRad(nyckel, { medKvitto }),
    [andraRad],
  );
  /* [varv 5] EN NYMARKERAD RAD FÖLJER DET AKTIVA LÄGET.
     Läget är en levande regel, inte en engångshandling: markerar Lotta en rad
     mitt i "Hela beloppet" ska raden komma in med hela beloppet, inte med sitt
     förslag. Undantaget är raden hon skrivit beloppet på för hand
     (`handredigerad`) — den behåller sin siffra, annars hade ett bock-klick
     tyst kastat bort den. En AVmarkering rör ingenting.

     Uppslaget sker inuti uppdateraren, mot raden som den ser ut just nu —
     `beloppForNyMarkerad` prövar därför inte `markerad` (fältet är fortfarande
     `false` i det ögonblicket). */
  const sattRadMarkerad = useCallback(
    (nyckel: string, markerad: boolean) => {
      const lage = aktivtBeloppslage(aktivGenvag);
      setRader((tidigare) =>
        tidigare.map((rad) => {
          if (rad.nyckel !== nyckel) return rad;
          if (!markerad) return { ...rad, markerad: false };
          const belopp = beloppForNyMarkerad(rad, lage);
          return belopp === null
            ? { ...rad, markerad: true }
            : { ...rad, markerad: true, belopp, ejGenomforbar: null };
        }),
      );
    },
    [aktivGenvag],
  );
  const sattRadNotering = useCallback(
    (nyckel: string, notering: string) => andraRad(nyckel, { notering }),
    [andraRad],
  );
  const sattRadVarden = useCallback(
    (nyckel: string, varden: Radvarden) =>
      andraRad(nyckel, { ...varden, ejGenomforbar: null, handredigerad: true }),
    [andraRad],
  );

  /**
   * [TASK-402.4 AC #2] Lotta pekar ut anmälan för en osäker eller omatchad
   * bankrad. Raden lämnar hand-högen och blir en vanlig, MARKERAD stegrad med
   * bankens belopp och datum.
   *
   * VALET OCH BOCKEN HÖR IHOP, oförändrat från den rivna bekräftelselistan
   * (`SwishImport.tsx` § VALET OCH BOCKEN HÖR IHOP): ett val är ett beslut,
   * och att kräva ett andra tryck för bocken hade gjort det till två.
   *
   * EN OKÄND ANMÄLAN GÖR INGENTING. Uppslaget sker mot den mängd hooken
   * faktiskt fick, aldrig mot minnets lagrade kandidatlista — den kan vara
   * äldre än verkligheten (`importminne.ts` § KANDIDATERNA ÄR ID:N).
   * En dubblett-rad kan strukturellt inte nå hit: formen renderar varken
   * förslagsknappar eller sökfält för den (`VariantC` § ImportHandKort).
   */
  const valjImportanmalan = useCallback(
    (nyckel: string, anmalanRecordId: string) => {
      const betalning = oppna.find((b) => b.anmalanRecordId === anmalanRecordId);
      if (betalning === undefined) return;
      const bankrad = obestamda.find((rad) => rad.nyckel === nyckel);
      if (bankrad === undefined || bankrad.klass === 'dubblett') return;
      // Samma anmälan två gånger i samma import (två swishar på en anmälan)
      // är ett LEGITIMT fall, men steget bär en rad per anmälan: nyckeln är
      // anmälans record-ID. Vinner den andra raden hade den första förlorat
      // sitt belopp tyst, så valet avvisas i stället.
      if (rader.some((rad) => rad.nyckel === anmalanRecordId)) return;
      setObestamda((tidigare) => tidigare.filter((rad) => rad.nyckel !== nyckel));
      setRader((tidigare) => [
        ...tidigare,
        byggImportrad(
          betalning,
          {
            nyckel: bankrad.nyckel,
            belopp: bankrad.belopp,
            datum: bankrad.datum,
            bankreferens: bankrad.bankreferens,
            namn: bankrad.namn,
          },
          idag,
          batchBetalsatt,
        ),
      ]);
    },
    [batchBetalsatt, idag, obestamda, oppna, rader],
  );

  /**
   * KÖRNINGEN (AC #2/#3/#5/#6). En rad i taget; en fallerad rad stannar i
   * listan med sitt fel och stoppar aldrig de övriga.
   *
   * `attKora` är en ÖGONBLICKSBILD tagen vid knapptrycket — vyn fryser sina
   * kort samtidigt (`VariantC`s `frusna`), så de två kan inte glida isär.
   */
  const registrera_ = useCallback(
    (skickaNu: boolean) => {
      const nuvarande = raderRef.current;
      const attKora = baraOmkorning(nuvarande)
        ? omkorningsUrval(nuvarande)
        : nuvarande.filter(arRegistrerbar);
      if (attKora.length === 0) return;

      setBekraftelseSynlig(false);
      setAngraFel(null);
      setFas('registrerar');
      setKorning({ totalt: attKora.length, klara: 0 });

      void (async () => {
        const attKoa: string[] = [];
        /* [TASK-402.4] Bankreferenser att bokföra i den lokala importloggen:
           både de som REGISTRERADES och de servern avvisade som dubbletter.
           Exakt samma två vägar den rivna bekräftelselistan bokförde
           (`SwishImport.tsx` § LOGGAS ÄVEN HÄR), och av samma skäl: en
           referens databasen känner till men denna webbläsares logg inte gör
           (annan dator, rensad lagring) ska falla ut som "redan registrerad"
           vid NÄSTA import, inte som omatchad. */
        const nyaReferenser: string[] = [];
        for (const rad of attKora) {
          const referens = rad.import?.bankreferens ?? null;
          try {
            const svar = await registrera.mutateAsync({
              anmalanRecordId: rad.nyckel,
              // RÅ STRÄNG, alltid — normaliseringen sker server-side
              // (`RegistreraInbetalningInput.belopp`s eget docblock).
              belopp: rad.belopp,
              betalsatt: rad.betalsatt,
              betalningsdatum: rad.datum,
              // [TASK-367 review runda 1, FYND 2] Raden bär redan `medKvitto`
              // (kryssrutan i steget, samma fält `kvitto`-läsningarna nedan
              // och `kvittolage()` i `RegistreratNuBlock.tsx` redan använder)
              // — bara `mutateAsync`-anropet saknade det. Utan detta hade en
              // rad registrerad med kryssrutan URTAGEN i bekräftelsesteget
              // felaktigt återuppstått i den durabla "kvitto att
              // skicka"-sektionen.
              medKvitto: rad.medKvitto,
              ...(rad.notering.trim() === '' ? {} : { notering: rad.notering }),
              // DUBBLETTNYCKELN (AC #4). Skickas ENDAST för importrader, och
              // utelämnas helt när den saknas: EF:en läser fältet som
              // "sträng och inte tom" (`registrera-inbetalning/index.ts`), så
              // ett `undefined` är byte för byte samma anrop som före
              // importen fanns.
              ...(referens === null ? {} : { bankreferens: referens }),
            });
            const id = svar.inbetalning.id;
            if (rad.medKvitto && skickaNu) attKoa.push(id);
            if (referens !== null) nyaReferenser.push(referens);
            andraRad(rad.nyckel, {
              utfall: {
                klass: 'registrerad',
                text: rad.medKvitto ? 'Registrerad · kvitto väntar' : 'Registrerad',
              },
              inbetalningId: id,
              kvitto: rad.medKvitto ? (skickaNu ? 'koad' : 'vantar') : 'ingen',
            });
          } catch (fel) {
            /* [TASK-402.4 AC #4] SERVERNS 409 ÄR INGET VANLIGT FEL.
               `registrera-inbetalning` svarar 409 `dubblett_bankreferens` när
               Postgres partiella unika index avvisar en referens som redan
               finns — den enda väg som känner HELA databasen, oavsett
               webbläsare och dator. För Lotta är det inte "gick sönder" utan
               "den här har du redan tagit", och raden ska därför AVMARKERAS:
               en omkörning av samma referens kan aldrig lyckas, och att lämna
               den markerad hade satt den i "Försök igen"-urvalet i en loop som
               bara producerar fler 409:or. Ordvalet är den rivna listans, ord
               för ord (`SwishImport.tsx` § `utfallstext`). */
            if (arDubblettfel(fel)) {
              if (referens !== null) nyaReferenser.push(referens);
              andraRad(rad.nyckel, {
                markerad: false,
                utfall: {
                  klass: 'fel',
                  text: 'Redan registrerad. Ingen ny inbetalning skapades.',
                },
              });
            } else {
              andraRad(rad.nyckel, { utfall: { klass: 'fel', text: felText(fel) } });
            }
          }
          setKorning((k) => (k ? { ...k, klara: k.klara + 1 } : k));
        }
        bokforImporterade(nyaReferenser, idag);
        setKorning(null);
        setFas('klart');
        // Betalsättet som faktiskt användes blir nästa gångs förval — samma
        // `sparaBetalsatt`-punkt som inkorgens `vidRegistrerad` bär.
        const sistaBetalsatt = attKora.at(-1)?.betalsatt;
        if (sistaBetalsatt) sparaBetalsatt(sistaBetalsatt);

        if (attKoa.length > 0) {
          try {
            const svar = await koa.mutateAsync({ inbetalningIds: attKoa });
            setJobbId(svar.jobbId ?? undefined);
          } catch {
            // Kvittokön fallerade — raderna ÄR registrerade och står kvar i
            // blocket som köade. Felet syns i blockets statusrad så fort
            // jobbstatus svarar; att kasta här hade rivit hela körningens
            // resultat för ett fel som rör kvittona, inte pengarna.
          }
        }
      })();
    },
    [andraRad, idag, koa, registrera],
  );

  const skickaKvitton = useCallback(() => {
    const kon = vantandeKvitton(raderRef.current);
    if (kon.length === 0) return;
    setBekraftelseSynlig(false);
    koa.mutate(
      { inbetalningIds: kon.map((v) => v.inbetalningId) },
      {
        onSuccess: (svar) => {
          setJobbId(svar.jobbId ?? undefined);
          setRader((t) => t.map((r) => (r.kvitto === 'vantar' ? { ...r, kvitto: 'koad' } : r)));
        },
      },
    );
  }, [koa]);

  /** "Skicka igen" på EN fallerad rad — samma köväg, ett id. */
  const skickaIgen = useCallback(
    (inbetalningId: string) => {
      setBekraftelseSynlig(false);
      koa.mutate(
        { inbetalningIds: [inbetalningId] },
        { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
      );
    },
    [koa],
  );

  /**
   * ÅNGRA (AC #4). SERVERN FÖRST — raden går tillbaka till listan först när
   * raderingen lyckats, aldrig optimistiskt. Kastar vidare så
   * `RegistreratNuBlock`s `AngraKnapp` håller dialogen öppen och visar felet
   * i kroppen (dess eget kontrakt).
   */
  const angra = useCallback(
    async (post: SessionsRad): Promise<void> => {
      try {
        await radera.mutateAsync({
          inbetalningId: post.inbetalningId,
          anmalanRecordId: post.radNyckel,
        });
      } catch (fel) {
        setAngraFel(felText(fel));
        throw fel;
      }
      setRader((t) =>
        t.map((r) =>
          r.inbetalningId === post.inbetalningId
            ? { ...r, utfall: null, inbetalningId: null, kvitto: 'ingen', kvittonummer: null }
            : r,
        ),
      );
      granskningsBlockRef.current?.focus();
    },
    [radera],
  );

  const forhandsgranskaKvitto = useCallback(
    (inbetalningId: string, namn: string) => {
      if (forhandsgranskaPagar.has(inbetalningId)) return;
      setForhandsgranskaFel(null);
      const fonster = window.open('', '_blank');
      skrivLaddningssida(fonster, {
        titel: 'Skapar förhandsgranskningen …',
        text: `Ett ögonblick, kvittot till ${namn} renderas och visas här om några sekunder.`,
      });
      setForhandsgranskaPagar((tidigare) => new Set(tidigare).add(inbetalningId));
      void forhandsgranska
        .mutateAsync(inbetalningId)
        .then(
          ({ url }) => {
            if (fonster && !fonster.closed) fonster.location.href = url;
          },
          (fel: unknown) => {
            if (fonster && !fonster.closed) fonster.close();
            setForhandsgranskaFel({ namn, message: felText(fel) });
          },
        )
        .finally(() => {
          setForhandsgranskaPagar((tidigare) => {
            if (!tidigare.has(inbetalningId)) return tidigare;
            const nasta = new Set(tidigare);
            nasta.delete(inbetalningId);
            return nasta;
          });
        });
    },
    [forhandsgranska, forhandsgranskaPagar],
  );

  const forhandsgranskaAlla = useCallback(
    (inbetalningIds: readonly string[]) => {
      if (forhandsgranskaPagar.has(FORHANDSGRANSKA_ALLA_NYCKEL)) return;
      setForhandsgranskaFel(null);
      const fonster = window.open('', '_blank');
      skrivLaddningssida(fonster, {
        titel: 'Skapar förhandsgranskningen …',
        text: `Ett ögonblick, ${inbetalningIds.length} kvitton renderas och visas här om några sekunder.`,
      });
      setForhandsgranskaPagar((tidigare) => new Set(tidigare).add(FORHANDSGRANSKA_ALLA_NYCKEL));
      void forhandsgranskaAllaMutation
        .mutateAsync([...inbetalningIds])
        .then(
          ({ url }) => {
            if (fonster && !fonster.closed) fonster.location.href = url;
          },
          (fel: unknown) => {
            if (fonster && !fonster.closed) fonster.close();
            const message = felText(fel);
            // EF:ens tak-text är engelsk valideringsprosa; `tolkaTakfel`
            // lämnar ut TALET så Lotta får en svensk mening i stället.
            const tak = tolkaTakfel(message);
            setForhandsgranskaFel({
              namn: null,
              message:
                tak === null
                  ? message
                  : `Förhandsgranskningen tar högst ${tak} kvitton åt gången. Skicka i två omgångar.`,
            });
          },
        )
        .finally(() => {
          setForhandsgranskaPagar((tidigare) => {
            if (!tidigare.has(FORHANDSGRANSKA_ALLA_NYCKEL)) return tidigare;
            const nasta = new Set(tidigare);
            nasta.delete(FORHANDSGRANSKA_ALLA_NYCKEL);
            return nasta;
          });
        });
    },
    [forhandsgranskaAllaMutation, forhandsgranskaPagar],
  );

  const aterstall = useCallback(() => {
    if (minne === null) {
      setRader(byggRader(oppna, idag, batchBetalsatt));
      setObestamda([]);
    } else {
      // Importen byggs om ur MINNET, inte ur de nu öppna betalningarna
      // ensamma: en rad som registrerades i den avbrutna körningen är inte
      // längre öppen, och dess bankreferens ligger nu i importloggen — den
      // faller därför ut som DUBBLETT, vilket är precis rätt svar.
      const byggt = byggImportsteg(minne.rader, oppna, idag, batchBetalsatt);
      setRader(byggt.rader);
      setObestamda(byggt.obestamda);
    }
    setKorning(null);
    setFas('redigera');
    setAktivGenvag('forslag');
    setJobbId(undefined);
  }, [oppna, idag, batchBetalsatt, minne]);

  /**
   * [TASK-402.4] SÖKRYMDEN för en omatchad bankrad, i INKORGENS rankning.
   *
   * `rankaTraffar` är samma funktion inkorgens sökfält och den rivna
   * bekräftelselistan använde (`SwishImport.tsx` § Omatchade rader får
   * sökfältet). Att bygga en egen sökordning här hade gett Lotta två olika
   * svar på samma fråga.
   *
   * RADER SOM REDAN LIGGER I STEGET FILTRERAS BORT. En anmälan som redan bär
   * en rad går inte att välja igen (`valjImportanmalan` avvisar det tyst), och
   * att erbjuda den i en träfflista hade varit en knapp som inte gör något.
   */
  const sokrymd = useMemo(() => oppna.map((b) => harledRad(b, idag)), [oppna, idag]);
  const sokImportanmalan = useCallback(
    (sokterm: string): InkorgsRad[] => {
      if (sokterm.trim() === '') return [];
      const upptagna = new Set(raderRef.current.map((rad) => rad.nyckel));
      return rankaTraffar(
        sokrymd.filter((rad) => !upptagna.has(rad.nyckel)),
        sokterm,
        idag,
      ).slice(0, 8);
    },
    [idag, sokrymd],
  );

  const summering = useMemo(() => summera(rader), [rader]);
  const jobbstatus = jobb.data;
  const utfall = useMemo(() => jobbDelutfall(jobbstatus), [jobbstatus]);

  return {
    rader,
    fas,
    aktivGenvag,
    batchBetalsatt,
    batchDatum,
    summering,
    sattGenvag,
    sattBeloppslage: sattBeloppslageNu,
    sattBetalsattAlla,
    sattDatumAlla,
    sattRadBelopp,
    sattRadBetalsatt,
    sattRadDatum,
    sattRadKvitto,
    sattRadMarkerad,
    sattRadNotering,
    sattRadVarden,
    registrera: registrera_,
    korning,
    skickaKvitton,
    jobbstatus,
    aterstall,
    importrader: obestamda,
    valjImportanmalan,
    sokImportanmalan,
    // [TASK-416.6 fix-runda 2] DELAD härledning med laddläges-skelettet
    // (`Bekraftelsesteget.tsx`, `importoversiktFranMinne`) — se den
    // funktionens docblock (`importminne.ts`) för varför den inte får
    // dupliceras.
    importkalla: importoversiktFranMinne(minne),
    block: {
      granskningsBlockRef,
      jobbrader: jobbstatus?.rader ?? [],
      utfall,
      bekraftelseSynlig,
      onDoljBekraftelse: () => setBekraftelseSynlig(false),
      koaPending: koa.isPending,
      onSkickaKvitton: skickaKvitton,
      forhandsgranskaPagar,
      forhandsgranskaAllaPagar: forhandsgranskaPagar.has(FORHANDSGRANSKA_ALLA_NYCKEL),
      onForhandsgranska: forhandsgranskaKvitto,
      onForhandsgranskaAlla: forhandsgranskaAlla,
      onSkickaIgen: skickaIgen,
      onAngra: angra,
      angraPending: radera.isPending,
      angraFel,
      onAngraDialogOppen: () => setAngraFel(null),
      forhandsgranskaFel,
    },
  };
}
