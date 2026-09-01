import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CalendarRange, Clock, X } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Disclosure,
  DisclosurePanel,
  Heading,
  SearchField,
} from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import { Button, InitialAvatar, MessageBox, SidRam, Skeleton } from '@/components/primitives';
import {
  antalAktivaFilter,
  type FilterDimension,
  FilterRad,
  filterRaknartext,
} from '@/components/primitives/FilterRad';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useOppnaBetalningar } from '@/data/betalningar/useBetalningar';
import { useJobbstatus, useRealtidsfel } from '@/data/betalningar/useJobbstatus';
import { useKoaKvitton } from '@/data/mutations/inbetalningar';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Jobbstatus } from '@/domain/schemas';
import { filtreraPersonregister, personVisningsnamn } from '@/lib/person-sok';
import { queryKeys } from '@/queries/keys';
import { visaKronor } from './belopp-inmatning';
import { type Betalsatt, lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { idagIso } from './idag';
import {
  type EventGrupp,
  grupperaPerEvent,
  harledRad,
  type InkorgsRad,
  type IsoDatum,
  jobbDelutfall,
  rankaTraffar,
  sammanfattaBetalningar,
} from './inkorg-harledningar';
import { RegistreraForm, type RegistreringsUtfall } from './RegistreraForm';
import { SwishImport } from './SwishImport';

/**
 * [TASK-346.6, PRD TASK-346 § Inkorgen och formuläret] Sidan Betalningar
 * under Mer - Lottas lördagsmorgon på ETT ställe.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD YTAN ERSÄTTER
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD:ns problemformulering, mätt: sex klick till kvittoknappen, sju klick
 * plus ett handskrivet belopp per kvitto, cirka 143 klick och tjugo
 * handskrivna belopp för en hel kurs - därför att avprickningen börjar i
 * EVENTET (event → åtgärder → panel → person). Här är BETALNINGEN
 * arbetsenheten: alla öppna betalningar över alla event, sökbara på det Lotta
 * faktiskt ser i banken.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SÖKFÄLTET FÅR FOKUS, INTE RUBRIKEN — ETT MEDVETET AVSTEG
 * ═══════════════════════════════════════════════════════════════════════════
 * Husets vyer (Waitlist, MailLog) flyttar fokus till `<h1>` när data landat.
 * Denna vy flyttar det till SÖKFÄLTET, därför att AC #2 kräver det och PRD:n
 * motiverar det: Lotta kommer hit med ett namn eller ett belopp i huvudet och
 * ska kunna skriva det direkt. `PersonsList.tsx` avstår medvetet från
 * autofokus med motiveringen "sidladdnings-autofokus är a11y-golv, inte stil"
 * - och den bedömningen står, för en LISTA man bläddrar i. Den här ytan är en
 * inkorg man SKRIVER i.
 *
 * Rubriken förlorar därför inte sin annonsering: `document.title` sätts, och
 * en `role="status"`-region säger hur många betalningar som laddats.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "SKICKA N KVITTON" RÄKNAR SESSIONENS EGNA REGISTRERINGAR
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD berättelse 7 + 8: registrera alla åtta först, granska, tryck EN gång.
 * Listan över väntande kvitton byggs därför av de registreringar som gjorts I
 * DENNA SESSION med kryssrutan i, och nollställs när jobbet köats.
 *
 * DEN KÄNDA GRÄNSEN, öppet bokförd: stängs fliken innan Lotta tryckt på
 * knappen är listan borta, och inbetalningarna står kvar utan kvitto. Ett
 * durabelt svar kräver ett fält på `OppenBetalning` som säger "denna anmälan
 * har inbetalningar utan kvitto" - och den ytan ägs av TASK-346.4:s Edge
 * Functions, inte av denna skiva. `kvittonAttSkicka` som EF:en redan skickar
 * räknar något ANNAT: rader som redan ligger i kön (`vantar`/`pagar`), alltså
 * kvitton Lotta redan tryckt på. Det talet visas separat i sammanfattningen.
 */

/* BETALSÄTTS-MINNET OCH `idagIso` FLYTTADE UT (TASK-346.7).
 *
 * Båda låg privat i denna fil så länge inkorgen var den enda ytan med
 * formuläret. TASK-346.7 ger samma formulär fyra ingångar till, och PRD
 * berättelse 6 lovar "det jag använde senast" - inte "senast på den här
 * sidan". De bor därför i `betalsatt-minne.ts` respektive `idag.ts`, som
 * båda bär motiveringen i sina egna docblock. Beteendet här är oförändrat:
 * samma localStorage-nyckel, samma standardvärde, samma lokala datum. */

type VantandeKvitto = { inbetalningId: string; namn: string; belopp: number };

/**
 * EN rad i granskningsblocket — allt Lotta registrerat i DENNA session.
 *
 * SKILD FRÅN `VantandeKvitto`, med avsikt. `vantande` är en KÖ: den bär bara
 * det som ska skickas, och den TÖMS när knappen trycks. Granskningsblocket är
 * en LOGG: den bär varje registrering, även de utan kvitto och de som redan
 * gått i väg, och den töms aldrig under sessionen. Att låta kön bära båda
 * rollerna hade betytt att raderna försvann i samma tryck som skickade dem —
 * alltså precis när Lotta vill se vad som hände.
 */
type SessionsRad = {
  inbetalningId: string;
  namn: string;
  belopp: number;
  betalsatt: Betalsatt;
  /** Lottas kryss vid registreringen. Falskt ⇒ raden ska aldrig få ett kvitto. */
  medKvitto: boolean;
};

/** Vad granskningsraden säger om kvittot, plus om raden får erbjudas omkörning. */
type Kvittolage = { text: string; fel: boolean };

/**
 * Kvittots läge för EN registrerad rad, läst ur de TVÅ källor som redan finns
 * — ingen ny state, ingen ny serverlogik (C1 är en presentationsyta).
 *
 * ORDNINGEN ÄR EN PRIORITETSORDNING, inte en slump:
 *  1. INGET KVITTO vinner allt. Kryssrutan var ur vid registreringen, och då
 *     ska raden aldrig säga något om skickning.
 *  2. KÖN (`vantande`) går före jobbet. Ligger raden i den session-lokala kön
 *     har Lotta ännu inte tryckt på knappen — jobbet vet inte om den.
 *  3. JOBBRADEN är sanningen om arbetet (ADR-129 beslut 2, se
 *     `JobbRadSchema`s docblock). Den nås på `objektId`, som ÄR
 *     inbetalningens id.
 *  4. FALLBACKEN SÄGER ALDRIG "SKICKAT". Raden kan ha köats i ett TIDIGARE
 *     jobb i samma session (varje "Registrera och skicka" skapar ett nytt
 *     jobb och `jobbId` pekar bara på det senaste), och då finns ingen jobbrad
 *     att läsa. "Köat" är då allt vi vet — att skriva "skickat" hade varit ett
 *     påstående utan täckning.
 */
function kvittolage(
  rad: SessionsRad,
  vantande: readonly VantandeKvitto[],
  jobbrader: readonly Jobbstatus['rader'][number][],
): Kvittolage {
  if (!rad.medKvitto) return { text: 'Inget kvitto', fel: false };
  if (vantande.some((v) => v.inbetalningId === rad.inbetalningId)) {
    return { text: 'Kvitto väntar på att skickas', fel: false };
  }

  const jobbrad = jobbrader.find((j) => j.objektId === rad.inbetalningId);
  if (jobbrad?.status === 'skickat') {
    return {
      text: jobbrad.kvittonummer ? `Kvitto skickat · ${jobbrad.kvittonummer}` : 'Kvitto skickat',
      fel: false,
    };
  }
  if (jobbrad?.status === 'pagar') return { text: 'Kvitto skickas ...', fel: false };
  if (jobbrad?.status === 'vantar') return { text: 'Kvitto köat', fel: false };
  if (jobbrad?.status === 'fel') {
    return { text: `Kvittot kunde inte skickas: ${jobbrad.skal ?? 'okänt skäl'}`, fel: true };
  }

  return { text: 'Kvitto köat', fel: false };
}

/* ═══════════════════════════ FILTRERINGENS AXLAR ═══════════════════════════
 *
 * Marcus dom 2026-09-01, om den kommande/tidigare-toggel som stod här:
 * *"Varför är togglen 'kommande event' och 'tidigare event' så ihoptryckt?"*
 * följt av *"Borde vi inte sätta in filtreringen vi har på Anmälnings-sidan?
 * … Då bör vi ta bort togglen, eller?"* — ja. Period blir en DIMENSION i
 * `FilterRad`-panelen, precis som på anmälningssidan, och togglen är riven i
 * stället för att få sin spacing lappad. En kontroll som är trång är ofta
 * fel kontroll, inte fel marginal.
 *
 * URL-KONTRAKTET ÄR DELAT MED `AnmalningarSida.tsx`: `?period=alla|upcoming|
 * past` plus `?typ`/`?ort`/`?event`, samma parsers, samma `history: 'push'`.
 * Konstanterna nedan är MEDVETET lokala kopior och inte en delad modul: de är
 * små, och en utbrytning hade rört den promoverade anmälningssidan
 * (ADR-103 B4:s `ariaSnapshot`-grind) i ett pass som bara äger inkorgens
 * filteryta. En TREDJE konsument lyfter ut dem — då är dubbleringen ett
 * mönster och inte längre två instanser.
 */
type PeriodFilter = 'alla' | 'upcoming' | 'past';
const PERIOD_FILTER_VALUES: PeriodFilter[] = ['alla', 'upcoming', 'past'];

/**
 * Etikett per periodvärde. Orden är den rivna toggelns EGNA
 * ("Kommande event"/"Tidigare event") — Lotta ska känna igen valet, inte lära
 * om det.
 *
 * ETIKETTERNA MÅSTE VARA IDENTISKA MED DIMENSIONENS `alternativ` nedan.
 * `FilterRad` jämför `valda[nyckel]` mot `alternativ` och renderar ett värde
 * som INTE finns i listan som ett extra, okänt alternativ (dess `okantVarde`-
 * gren, byggd för handskrivna URL:er). Divergerar de två listorna får
 * dropdownen alltså ett fjärde alternativ som ser ut som ett val men är en
 * artefakt.
 */
const PERIOD_FILTER_LABEL: Record<PeriodFilter, string> = {
  alla: 'Alla perioder',
  upcoming: 'Kommande event',
  past: 'Tidigare event',
};
const PERIOD_ALTERNATIV = [PERIOD_FILTER_LABEL.upcoming, PERIOD_FILTER_LABEL.past];
/** Etikett → URL-nyckel. Panelen visar svenska ord, URL:en bär sitt kontrakt. */
const PERIOD_FRAN_ETIKETT: Record<string, PeriodFilter> = {
  [PERIOD_FILTER_LABEL.upcoming]: 'upcoming',
  [PERIOD_FILTER_LABEL.past]: 'past',
};

/** Räknarens substantiv (böjs efter nämnaren i `filterRaknartext`). */
const BETALNINGS_ENHET = { ental: 'betalning', flertal: 'betalningar' };

/** Event-dimensionens nolläge — bärs BÅDE av dimensionens `nollage` och av
    `EventValjare`s `gemensamtAlternativ`, så de aldrig kan glida isär. */
const ALLA_EVENT = 'Alla event';

/**
 * Radens period, med `grupperaPerEvent`s EGEN regel — inte en andra tolkning.
 *
 * Gränsen går vid eventets startdatum, och ett event UTAN startdatum räknas
 * som kommande (fail-open, motiverad i `grupperaPerEvent`s docblock: ett okänt
 * datum får inte tysta ned en rad i ett filter Lotta inte tittar i som
 * förstahandsval). Att spegla regeln i stället för att uppfinna en egen är
 * vad som garanterar att en rad som passerar periodfiltret också hamnar i en
 * SYNLIG grupp — filtret och grupperingen kan inte säga emot varandra.
 */
function radensPeriod(rad: InkorgsRad, idag: IsoDatum): 'upcoming' | 'past' {
  const start = rad.betalning.eventStartdatum;
  return start !== null && start < idag ? 'past' : 'upcoming';
}

/** Radens uppslagna event, eller `undefined` när det inte går att slå upp. */
function radensEvent(rad: InkorgsRad, eventsById: Map<string, Event>): Event | undefined {
  return rad.betalning.eventId ? eventsById.get(rad.betalning.eventId) : undefined;
}

/** Tomlägets copy per period. De två första strängarna är ORDAGRANT den rivna
    toggelns egna; `alla` är den nya, tredje formen. */
function tomtText(period: PeriodFilter): string {
  if (period === 'upcoming') return 'Inga öppna betalningar på kommande event.';
  if (period === 'past') return 'Inga öppna betalningar på tidigare event.';
  return 'Inga öppna betalningar.';
}

export function BetalningsInkorg() {
  const dataSource = useDataSource();
  const [sokterm, setSokterm] = useState('');
  const [oppenRad, setOppenRad] = useState<string | null>(null);
  const [kvittenser, setKvittenser] = useState<Record<string, string>>({});
  const [vantande, setVantande] = useState<VantandeKvitto[]>([]);
  /** Granskningsblockets logg — se `SessionsRad` för varför den inte är kön. */
  const [registrerade, setRegistrerade] = useState<SessionsRad[]>([]);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  const [betalsatt, setBetalsatt] = useState<Betalsatt>(lasSenasteBetalsatt);
  // [TASK-346.10] Importytan bor HÄR, inte på en egen route - kortets egen
  // rubrik säger "samma inkorg, ingen ny yta". Två följder: miljöflaggan
  // gäller utan ny kod (routens `beforeLoad` bär `betalningarPa()`), och
  // "Skicka N kvitton" nedan är samma knapp för importerade och handskrivna
  // registreringar. Se `SwishImport.tsx` § INGEN NY YTA.
  const [visaImport, setVisaImport] = useState(false);
  const sokRef = useRef<HTMLInputElement>(null);
  const importKnappRef = useRef<HTMLButtonElement>(null);
  const annonseratRef = useRef(false);
  const idag = useMemo(idagIso, []);

  /* ═══ PERIODEN STARTAR PÅ KOMMANDE — MARCUS BESLUT, INTE FÖRLAGANS ═══
   *
   * `AnmalningarSida.tsx` startar OFILTRERAT (`'alla'`), och konsekvens med
   * förlagan var utgångsförslaget. Marcus dömde annorlunda, ordagrant
   * 2026-09-01: *"Kommande givetvis, hur ofta kommer hon regga en betalning i
   * efterhand, typ aldrig."* Inkorgens fråga är lördagsmorgonens — vem har
   * inte betalat för det som kommer — och den ställs nästan aldrig bakåt.
   *
   * Defaulten bevarar därmed EXAKT den rivna toggelns startläge
   * (`useState<Inkorgsfilter>('kommande')`): ingen som öppnar sidan i dag ser
   * någon skillnad i urvalet, bara i kontrollen. `'alla'` finns kvar som
   * nolläge i panelen — det är dit `Rensa filter` går.
   *
   * FÖLJDEN ÄR SYNLIG OCH AVSIKTLIG: eftersom `'upcoming'` inte är
   * dimensionens nolläge räknas den som ETT AKTIVT FILTER, så tratten bär
   * badgen "1" direkt vid sidladdning. Det är ärligare än alternativet — en
   * lista som ÄR filtrerad utan att säga det. Övriga axlar startar tomma.
   */
  const [period, setPeriod] = useQueryState(
    'period',
    parseAsStringEnum<PeriodFilter>(PERIOD_FILTER_VALUES).withDefault('upcoming'),
  );
  // Samma kontrakt som anmälningssidan: `history: 'push'` ⇒ delbart OCH
  // back-bart; `null` tar bort parametern helt. `?event` bär ett RECORD-ID,
  // aldrig ett namn — två event kan heta likadant (samma kurs i två orter),
  // och ett namnfilter hade slagit ihop dem.
  const [typ, setTyp] = useQueryState('typ', parseAsString.withOptions({ history: 'push' }));
  const [ort, setOrt] = useQueryState('ort', parseAsString.withOptions({ history: 'push' }));
  const [valtEvent, setValtEvent] = useQueryState(
    'event',
    parseAsString.withOptions({ history: 'push' }),
  );
  const filterKnappRef = useRef<HTMLButtonElement>(null);

  // [TASK-346.7] Läsningen bor nu i `useOppnaBetalningar`, delad med Hem,
  // Åtgärds-panelen, anmälans detaljvy och personkortet. Hooken bär
  // `refetchOnMount: 'always'` och HELA motiveringen för den (den mätta
  // eftersläpningen i acceptansvandringen 2026-08-31) i sitt eget docblock.
  // Beteendet här är oförändrat: samma cache-nyckel, samma färskhetsregel.
  const { data: oppna, isPending, isError, error } = useOppnaBetalningar();

  // Personregistret är redan förladdat av startvärmningen (ADR-123) och har
  // 5 min staleTime - att läsa det här kostar därför normalt noll anrop. Det
  // bär "personer utan öppen betalning" i sökläget (AC #2).
  const { data: register } = useQuery({
    queryKey: queryKeys.persons.register,
    queryFn: () => dataSource.fetchPersonsRegister(),
  });

  // SAMMA `events.list`-nyckel som EventsList/EventValjare/AnmalningarSida —
  // dedupar mot startvärmningen (`src/data/warmup/startvarmningen.ts`), så
  // filtret kostar normalt ingen extra EF-rundtur. Den bär typ/ort-axlarnas
  // värderymd och `EventValjare`s stängda läge.
  //
  // DIMENSIONERNA ÄR EVENTETS FÄLT, inte betalningens: en öppen betalning bär
  // `eventTyp` men INGEN ort (`Betalningar.schema.ts`), så axlarna måste läsa
  // det uppslagna eventet ändå. Att då hämta typ ur betalningen och ort ur
  // eventet hade gett två källor för samma fråga — båda läses ur eventet.
  const { data: events } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const eventsById = useMemo(() => new Map((events ?? []).map((e) => [e.id, e])), [events]);

  const jobb = useJobbstatus(jobbId, jobbId !== undefined);
  const realtidsfel = useRealtidsfel();
  const koa = useKoaKvitton();

  const rader = useMemo(
    () => (oppna?.betalningar ?? []).map((b) => harledRad(b, idag)),
    [oppna, idag],
  );
  /* ═══ FILTRERINGEN: PERIOD → DIMENSIONER → GRUPPERING ═══
   *
   * Ordningen är anmälningssidans, och den är inte godtycklig. Periodfiltret
   * först, dimensionsfiltren på det resultatet, och grupperingen SIST — på
   * exakt de rader som faktiskt visas. Grupperas det före filtreringen kan en
   * grupprubrik stå kvar utan rader under sig.
   *
   * SÖKNINGEN RÖRS INTE. `traffar` nedan läser fortfarande `rader` i sin
   * helhet: söker Lotta på ett namn eller ett belopp ur banken vill hon ha
   * svaret, inte svaret-inom-filtret. Det är samma val den rivna toggeln
   * gjorde (den doldes vid sökning), och filterraden döljs på samma villkor.
   */
  const periodRader = useMemo(
    () => (period === 'alla' ? rader : rader.filter((rad) => radensPeriod(rad, idag) === period)),
    [rader, period, idag],
  );

  const valda: Record<string, string | null> = {
    period: period === 'alla' ? null : PERIOD_FILTER_LABEL[period],
    typ: typ || null,
    ort: ort || null,
    event: valtEvent || null,
  };

  /* Alternativen för typ/ort härleds ur de event RADERNA faktiskt pekar på —
     inte ur hela eventlistan. Ett värde utan öppna betalningar vore en död
     kontroll. Härledningen sker på `rader`, FÖRE periodfiltret, så rymden är
     stabil över periodbyte (EventsLists byggkrav 2). En dimension utan värden
     renderar ingen dropdown alls — `FilterRad`s egen degradering, som också
     är det snälla beteendet innan `events`-frågan landat.

     EVENT-AXELN BRYTER MEDVETET MOT DEN REGELN och listar hela eventrymden
     (`omfattning="alla"`): ett `Typ`-värde som saknas är självförklarande,
     medan ett EVENT som saknas är omöjligt att skilja från "jag hittar det
     inte". Med hela rymden kan Lotta söka fram ett event och få det sanna
     svaret "0 betalningar" via panelfotens räknare. Samma resonemang, samma
     ord, som `AnmalningarSida.tsx` § EVENT-DIMENSIONEN. */
  const dimensioner = useMemo<FilterDimension[]>(() => {
    const lankade = rader
      .map((rad) => radensEvent(rad, eventsById))
      .filter((e): e is Event => e != null);
    const uniq = (vals: (string | null | undefined)[]) =>
      [...new Set(vals.filter((v): v is string => v != null))].sort((a, b) =>
        a.localeCompare(b, 'sv'),
      );
    return [
      {
        nyckel: 'period',
        etikett: 'Period',
        nollage: PERIOD_FILTER_LABEL.alla,
        alternativ: PERIOD_ALTERNATIV,
      },
      {
        nyckel: 'typ',
        etikett: 'Typ',
        nollage: 'Alla typer',
        alternativ: uniq(lankade.map((e) => e.typ)),
      },
      {
        nyckel: 'ort',
        etikett: 'Ort',
        nollage: 'Alla orter',
        alternativ: uniq(lankade.map((e) => e.ort)),
      },
      {
        nyckel: 'event',
        etikett: 'Event',
        nollage: ALLA_EVENT,
        // KONTROLLEN, inte en alternativlista: eventrymden är hundratals
        // poster (mätt: 108 i staging 2026-08-23) där typ/ort är en handfull,
        // och en naken dropdown tappar fotfästet långt innan dess. Se
        // `FilterDimension.kontroll`.
        kontroll: (
          <EventValjare
            valtEventId={valtEvent || undefined}
            valtEvent={valtEvent ? eventsById.get(valtEvent) : undefined}
            onByte={(id) => setValtEvent(id)}
            // Öppna betalningar finns för event som VARIT — panelen har en
            // `Tidigare`-period, så väljarens default (endast kommande) hade
            // tystat bort precis det den perioden finns för.
            omfattning="alla"
            form="fristaende"
            gemensamtAlternativ={{
              etikett: ALLA_EVENT,
              ikon: <CalendarRange aria-hidden="true" size={18} className="shrink-0" />,
              onValj: () => setValtEvent(null),
            }}
          />
        ),
      },
    ];
  }, [rader, eventsById, valtEvent, setValtEvent]);
  const aktivaFilter = antalAktivaFilter(dimensioner, valda);

  /* Dimensionsfiltret läses ur EVENTET, aldrig ur betalningen: "visa
     betalningar vars event har typ X". En rad utan uppslagbart event bär
     inget sådant attribut och matchar därför aldrig ett aktivt
     dimensionsfilter — den försvinner inte ur systemet, den ligger kvar under
     nolläget och räknas numeriskt i panelfotens "Visar X av Y". */
  const visasRader = useMemo(
    () =>
      periodRader.filter((rad) => {
        const ev = radensEvent(rad, eventsById);
        return (
          (valda.typ == null || ev?.typ === valda.typ) &&
          (valda.ort == null || ev?.ort === valda.ort) &&
          (valda.event == null || ev?.id === valda.event)
        );
      }),
    [periodRader, eventsById, valda.typ, valda.ort, valda.event],
  );

  const vy = useMemo(() => grupperaPerEvent(visasRader, idag), [visasRader, idag]);
  const soker = sokterm.trim() !== '';
  const traffar = useMemo(
    () => (soker ? rankaTraffar(rader, sokterm, idag) : []),
    [soker, rader, sokterm, idag],
  );

  // Personer UTAN öppen betalning, sist i sökläget med "registrera ändå"
  // (AC #2). Matchningen mot de träffade raderna sker på NAMN, eftersom
  // `OppenBetalning` inte bär något person-ID (`Betalningar.schema.ts`) - en
  // känd grovhet som gör att en namne kan filtreras bort. Alternativet, att
  // visa personen två gånger, är sämre.
  const ovrigaPersoner = useMemo(() => {
    if (!soker || !register) return [];
    const traffadeNamn = new Set(traffar.map((r) => r.namn.toLocaleLowerCase('sv')));
    return filtreraPersonregister(register, sokterm)
      .filter((p) => !traffadeNamn.has(personVisningsnamn(p).toLocaleLowerCase('sv')))
      .slice(0, 10);
  }, [soker, register, sokterm, traffar]);

  // [TASK-346.7 AC #1] De tre talen härleds nu av `sammanfattaBetalningar`,
  // som Hem-kortet läser med. Uttrycken var tidigare inline här; två
  // oberoende uttryck för samma mening kan glida isär utan att någon
  // mekanism märker det, och AC #6 kräver att ytorna säger samma sak.
  // Räkningen är oförändrad - se funktionens docblock för de två talens
  // exakta innebörd.
  const sammanfattning = useMemo(() => sammanfattaBetalningar(rader), [rader]);

  // ═══ ETT FÄRDIGT JOBB FRÅN EN TIDIGARE SESSION ÄR INTE DAGENS NYHET ═══
  //
  // Mätt i vandringen mot staging 2026-08-31: inkorgen visade "1 kvitto
  // skickade" INNAN Lotta gjort något, därför att `JobbLyssnare` håller
  // `jobbstatus(null)` (det SENASTE jobbet) färsk för hela appen och denna vy
  // läser samma cache-nyckel. Kvittot i fråga hade skickats av TASK-346.4:s
  // egen provkörning dagen innan.
  //
  // Banderollen visas därför i EXAKT två lägen: (a) jobbet är MITT jobb -
  // denna session tryckte på knappen - eller (b) det senaste jobbet arbetar
  // fortfarande, vilket är något Lotta behöver se oavsett vem som startade
  // det (PRD berättelse 31: appen kan stängas mitt i ett kvittojobb). Ett
  // AVSLUTAT jobb från i går är varken, och tystas.
  const senasteUtfall = jobbDelutfall(jobb.data);
  const utfall =
    senasteUtfall && (jobbId !== undefined || senasteUtfall.kvar > 0) ? senasteUtfall : null;

  /* Rensa-knapparna unmountas i samma tryck (aktiva → 0), så fokus flyttas
     programmatiskt till tratt-knappen — filter-ytans stabila ankare — i
     stället för att falla till `document.body`. Perioden går till `'alla'`,
     inte tillbaka till `'upcoming'`: "Rensa filter" betyder nolläget, och
     defaulten är ett STARTVÄRDE, inte ett golv. */
  const rensaFilter = () => {
    void setPeriod('alla');
    void setTyp(null);
    void setOrt(null);
    void setValtEvent(null);
    filterKnappRef.current?.focus();
  };

  /* Live-bekräftelsen av filtret. EGEN region, skild från
     "…öppna betalningar laddade."-statusen nedan (Roselli-anatomin: en region
     per ANSVAR, aldrig återanvänd för två olika besked) — men period och
     dimensioner DELAR region, eftersom båda svarar på samma fråga: "vad visas
     nu?". Skip-first via ref, så sidladdningen inte annonserar sig själv.
     Punkten skiljer annonsen från panelfotens synliga räknartext. */
  const [filterAnnons, setFilterAnnons] = useState('');
  const filterNyckel = `${period}|${valda.typ}|${valda.ort}|${valda.event}`;
  const prevFilterNyckel = useRef(filterNyckel);
  useEffect(() => {
    if (prevFilterNyckel.current === filterNyckel) return;
    prevFilterNyckel.current = filterNyckel;
    setFilterAnnons(`${filterRaknartext(visasRader.length, rader.length, BETALNINGS_ENHET)}.`);
  }, [filterNyckel, visasRader.length, rader.length]);

  useEffect(() => {
    if (oppna && !annonseratRef.current) {
      annonseratRef.current = true;
      document.title = 'Betalningar';
      sokRef.current?.focus();
    }
  }, [oppna]);

  function vidRegistrerad(rad: InkorgsRad, resultat: RegistreringsUtfall) {
    setKvittenser((tidigare) => ({ ...tidigare, [rad.nyckel]: resultat.kvittens }));
    setOppenRad(null);
    sparaBetalsatt(betalsatt);

    /* GRANSKNINGSLOGGEN FÅR VARJE REGISTRERING, inte bara de med kvitto
       (Marcus dom 2026-09-01: *"rader för varje betalning hon registrerar"*).
       Beloppet är SERVERNS (`resultat.belopp` läser `inbetalning.belopp`), inte
       fältets råtext — samma regel kvittensen redan följer. */
    setRegistrerade((tidigare) => [
      ...tidigare,
      {
        inbetalningId: resultat.inbetalningId,
        namn: resultat.namn,
        belopp: resultat.belopp,
        betalsatt,
        medKvitto: resultat.medKvitto,
      },
    ]);

    if (resultat.medKvitto && resultat.skickaNu) {
      koa.mutate(
        { inbetalningIds: [resultat.inbetalningId] },
        { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
      );
    } else if (resultat.medKvitto) {
      setVantande((tidigare) => [
        ...tidigare,
        {
          inbetalningId: resultat.inbetalningId,
          namn: resultat.namn,
          belopp: resultat.belopp,
        },
      ]);
    }

    // AC #3: "fokus åter i tomt sökfält". Tömningen är lika viktig som
    // fokuset - nästa betalning är en annan person, och ett kvarstående
    // filter hade dolt henne.
    setSokterm('');
    sokRef.current?.focus();
  }

  /**
   * [TASK-346.10 AC #4] Importens registrerade rader lyfts in i SAMMA
   * väntande-lista som formulärets, så att "Skicka N kvitton" nedan blir en
   * enda knapp för hela lördagen - oavsett om raden kom ur banken eller ur
   * Lottas huvud. Fokus går till importknappen när ytan stängs; den nod
   * fokus stod på rivs annars ur DOM och fokus faller till `document.body`
   * (samma felklass som radens `skaAterfaFokus` bär).
   */
  function vidImporterade(kvitton: VantandeKvitto[]) {
    setVantande((tidigare) => [...tidigare, ...kvitton]);
    /* Importerade rader hör hemma i SAMMA granskningsblock som de handskrivna
       — knappen under blocket är redan en enda för båda (se `vidImporterade`s
       docblock). Betalsättet är det `SwishImport` fick som prop och registrerade
       med, alltså detta värde; importen bär inget eget. Kvitto per definition:
       raderna landar i `vantande`, som bara bär det som ska skickas. */
    setRegistrerade((tidigare) => [
      ...tidigare,
      ...kvitton.map((k) => ({ ...k, betalsatt, medKvitto: true })),
    ]);
  }

  function stangImport() {
    setVisaImport(false);
    importKnappRef.current?.focus();
  }

  function skickaKvitton() {
    if (vantande.length === 0) return;
    koa.mutate(
      { inbetalningIds: vantande.map((v) => v.inbetalningId) },
      {
        onSuccess: (svar) => {
          setJobbId(svar.jobbId ?? undefined);
          setVantande([]);
        },
      },
    );
  }

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  if (isPending) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <header className="px-4">
          <h1 className="font-semibold text-3xl">Betalningar</h1>
        </header>
        <div aria-busy="true" role="status" className="flex flex-col gap-3 px-4">
          <span className="sr-only">Laddar betalningar ...</span>
          <Skeleton variant="text" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
          <Skeleton variant="listRow" aria-hidden />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="flex flex-col gap-4">
        {sidRam}
        <header className="px-4">
          <h1 className="font-semibold text-3xl">Betalningar</h1>
        </header>
        <MessageBox intent="error" title="Betalningarna kunde inte hämtas">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </section>
    );
  }

  /* Båda hinkarna, alltid — periodfiltret har redan gjort urvalet FÖRE
     grupperingen, så med `upcoming` är `tidigare` tom och tvärtom. Under
     `alla` läses de i den ordning `grupperaPerEvent` sorterat dem: kommande
     närmast först, därefter tidigare senast först. */
  const grupper: EventGrupp[] = [...vy.kommande, ...vy.tidigare];

  /* JOBBRADER SOM GRANSKNINGSBLOCKET INTE REDAN VISAR.
     Sedan C1 bär varje rad Lotta registrerat i denna session sin egen
     kvittostatus i granskningsblocket, med namn och belopp — alltså det den
     gamla jobbrads-listan sade, fast läsbart ("Kvitto utan nummer än"
     identifierar ingen). Att visa båda hade sagt samma sak två gånger.

     LISTAN RIVS ÄNDÅ INTE: `jobbstatus(null)` är det SENASTE jobbet för hela
     appen, och det kan ha startats någon annanstans (en annan flik, en annan
     session — se filens docblock § "ETT FÄRDIGT JOBB FRÅN EN TIDIGARE
     SESSION"). Ett sådant jobbs rader finns inte i vår logg, och de ska
     fortfarande synas med sin "Skicka igen". */
  const ovrigaJobbrader = (jobb.data?.rader ?? []).filter(
    (jobbrad) => !registrerade.some((post) => post.inbetalningId === jobbrad.objektId),
  );

  return (
    <section className="flex flex-col gap-4">
      {sidRam}
      <p className="sr-only" role="status" aria-live="polite">
        {`${rader.length} öppna betalningar laddade.`}
      </p>

      {/* SIDHUVUDETS HANDLINGSYTA (designfynd 2c): "Importera bankrapport" var
          en ensam strö-knapp mellan segmentväljaren och listan — flyttad hit,
          bredvid rubriken, samma rad. Knappen göms medan importytan är
          öppen (oförändrat beteende) — se `visaImport`-villkoret nedan. */}
      <header className="flex flex-wrap items-start justify-between gap-3 px-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-3xl">Betalningar</h1>
          {/* KÖ-RADEN ERSÄTTER TRE-TALS-RADEN (Marcus 2026-09-01, om
              "5 öppna · 5 förfallna · 0 kvitton i kö"): *"vad betyder det?
              … 5 förfallna hör väl inte hit, det hör väl till
              påminnelse-blocket"*. Båda invändningarna håller:

                • FÖRFALLNA-talet hör till påminnelse-arbetet, som bor i
                  Hem-blocket `ForfallnaBetalningar`. Här var det ett tal utan
                  handling — förfallo-MÄRKET per rad finns kvar och är det som
                  faktiskt hjälper när Lotta prickar av.
                • ÖPPNA-talet sades redan två gånger till: av listan själv och
                  av filterpanelens "Visar X av Y betalningar".
                • KVITTON I KÖ var det enda talet som bar något Lotta inte
                  kunde se någon annanstans — men "i kö" är jargong för en
                  jobbmotor hon inte känner till.

              Raden renderas därför BARA när det finns något i kön, och säger
              vad som händer i stället för att räkna en datastruktur. Noll
              kvitton är inget besked; det är frånvaron av ett. */}
          {sammanfattning.kvittonAttSkicka > 0 && (
            <p className="text-small text-text-muted">
              {`${sammanfattning.kvittonAttSkicka} ${
                sammanfattning.kvittonAttSkicka === 1 ? 'kvitto väntar' : 'kvitton väntar'
              } på att skickas`}
            </p>
          )}
        </div>
        {!visaImport && (
          <Button
            ref={importKnappRef}
            intent="secondary"
            emphasis="outline"
            size="sm"
            onPress={() => setVisaImport(true)}
          >
            Importera bankrapport
          </Button>
        )}
      </header>

      {/* Realtidsfelet (TASK-346.4:s namngivna TODO, betald här). Byggd på
          nedstängningsvaktens PREDIKAT, aldrig på råa status-värden - annars
          hade rutan blinkat vid varje navigering. */}
      {realtidsfel !== null && (
        <MessageBox intent="warning" title="Realtidsuppdateringen är nere">
          Kvittonas status uppdateras inte av sig själv just nu. Läget läses om varje gång du öppnar
          sidan, så inget går förlorat.
        </MessageBox>
      )}

      <div className="flex flex-col gap-3 px-4">
        {/* SÖKFÄLTET OCH TRATTEN DELAR RAD (Marcus 2026-09-01: *"sätta
            filterikonen till höger om sökrutan på samma rad, tror det blir
            snyggare"*).

            INGEN NY LAYOUT-KOD BEHÖVDES: `FilterRad`s `children` ÄR den
            slotten — "kontrollen till VÄNSTER om tratt-ingången … Den får
            radens fria bredd; tratten är `shrink-0` bredvid den"
            (`FilterRad.tsx` § `children`). Eventlistan lade sina period-pill
            där; inkorgen lägger sitt sökfält. Sökfältets egen markup,
            `sokRef` och fokus-kontraktet (AC #3: "fokus åter i tomt sökfält")
            är byte för byte oförändrade — bara föräldern är ny.

            OCH DÄRMED ÄR TRATTEN SYNLIG ÄVEN UNDER SÖKNING. Det var tidigare
            villkorat på `!soker`, ärvt från den rivna toggeln, och den kanten
            var bokförd som en öppen fråga i pass 2B ("ett satt filter är
            osynligt medan sökningen pågår"). Marcus layoutbeslut avgör den:
            en kontroll som sitter PÅ sökraden kan inte försvinna när man
            skriver i den utan att raden hoppar.

            KVARSTÅENDE SPÄNNING, ÖPPET BOKFÖRD: sökningen läser fortfarande
            HELA radmängden (`rankaTraffar` på `rader`, inte på `visasRader`),
            så filtren gäller listan — inte träffarna. Det är MEDVETET och
            oförändrat: Lotta söker upp ett namn eller ett belopp ur banken
            och ska hitta personen oavsett vilken period panelen råkar stå på,
            vilket är precis det "registrera i efterhand"-fall som annars gett
            noll träffar. Panelens räknare beskriver alltså listan även medan
            träffarna visas. Ändras detta ska det vara ett eget beslut, inte
            en följd av en layoutflytt. */}
        <FilterRad
          dimensioner={dimensioner}
          valda={valda}
          onValj={(nyckel, varde) => {
            if (nyckel === 'period') {
              void setPeriod(varde ? PERIOD_FRAN_ETIKETT[varde] : 'alla');
            } else if (nyckel === 'typ') void setTyp(varde);
            else if (nyckel === 'ort') void setOrt(varde);
            else void setValtEvent(varde);
          }}
          onRensa={rensaFilter}
          visade={visasRader.length}
          totalt={rader.length}
          enhet={BETALNINGS_ENHET}
          triggerRef={filterKnappRef}
          /* SAMMA BREDD SOM LISTAN OCH MENYBAREN (Marcus dom 2026-09-01:
             *"hela listan är för smal, det ska vara lika bred som menybaren.
             Även filtreringskomponenten"*).

             MÄTT: `<main>` bär `max-w-[600px] px-4` (AppShell), alltså en inre
             kolumn på 568 px, och `TabBar` speglar den exakt med
             `max-w-[568px]` — de två är redan i synk. Det som gjorde ytan smal
             var ett ANDRA `px-4` på blocket här omkring: allt inuti stod på
             536 px, 32 px smalare än menybaren rakt under.

             `-mx-4` tar bort exakt det andra lagret, aldrig det första. Ingen
             ny hårdkodad siffra införs — bredden följer menybaren vid varje
             viewport, och identiskt idiom med `AnmalningarSida.tsx`. */
          className="-mx-4"
        >
          <SearchField
            aria-label="Sök på namn, telefon eller belopp"
            value={sokterm}
            onChange={setSokterm}
            className="group flex flex-col"
          >
            <div className="relative">
              <AriaInput
                ref={sokRef}
                placeholder="Sök på namn, telefon eller belopp"
                className="mm-fokusring-vid-fokus text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 pr-10 text-body [&::-webkit-search-cancel-button]:[-webkit-appearance:none]"
              />
              <AriaButton
                aria-label="Rensa sökningen"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:text-text group-data-[empty]:hidden"
              >
                <X aria-hidden="true" size={16} className="shrink-0" />
              </AriaButton>
            </div>
          </SearchField>
        </FilterRad>
        <p className="sr-only" aria-live="polite">
          {filterAnnons}
        </p>
      </div>

      {/* [TASK-346.10] Importen ligger FÖRE "Skicka N kvitton", i den ordning
          Lottas lördag faktiskt går: läs banken, bekräfta raderna, skicka
          kvittona. Triggerknappen bor sedan TASK-346.14 i sidhuvudet
          (designfynd 2c, se `<header>` ovan) — bara panelen själv monteras
          här. */}
      {visaImport && (
        <SwishImport
          oppna={rader}
          idag={idag}
          betalsatt={betalsatt}
          onRegistrerade={vidImporterade}
          onStang={stangImport}
        />
      )}

      {/* ═══════════════════════ GRANSKNINGSBLOCKET (C1) ═══════════════════════
          Marcus dom 2026-09-01, ordagrant: *"När man trycker 'Registrera' så
          kommer knappen 'Skicka 1 kvitto'. Det räcker ju inte. Vi behöver ju ha
          en granskningsvy … ett 'granskningsblock' och rader för varje betalning
          hon registrerar"*.

          Här stod tidigare EN naken knapp. En knapp som säger "Skicka 8 kvitton"
          utan att visa VILKA åtta är inte granskningsbar — PRD berättelse 7 + 8
          lovar "registrera alla åtta först, GRANSKA, tryck EN gång", och
          granskningssteget saknade yta.

          INGEN NY SERVERLOGIK, INGEN NY KÖ. Blocket är en presentationsyta över
          state som redan fanns: `registrerade` (sessionsloggen), `vantande`
          (kön) och `jobb.data.rader` (jobbets sanning). `skickaKvitton`,
          `koa.mutate` och idempotensen per inbetalning (ADR-128) är byte för
          byte orörda — avbrottskontraktet är alltså detsamma som före passet.

          DEN KÄNDA GRÄNSEN ÄR OFÖRÄNDRAD och ärvs, inte utökas: stängs fliken
          innan knappen tryckts är både kön och loggen borta (båda är
          session-lokala). Ett durabelt svar kräver ett fält på `OppenBetalning`,
          se filens huvud-docblock § "SKICKA N KVITTON".

          RADFORMEN ÄR INBETALNINGSRADERNAS (`InbetalningsLista.tsx` § KORTYTAN):
          vitt kort på tonad botten, primärled i `text-body`-vikt, sekundärled
          som ETT `·`-svep i `text-caption text-text-muted`. TVÅ MEDVETNA
          AVSTEG: (a) primärledet är NAMNET och inte beloppet — det är personen
          som skiljer raderna åt här, medan förlagan listar en enda persons
          betalningar; (b) ingen ledande glyf — beloppet bär raden och betalsättet
          står i klartext i sekundärledet. */}
      {registrerade.length > 0 && (
        <div className="flex flex-col gap-3 px-4">
          <h2 className="font-semibold text-lg">Registrerat nu</h2>
          <ul className="-mx-4 flex flex-col gap-2 px-4">
            {registrerade.map((post) => {
              const lage = kvittolage(post, vantande, jobb.data?.rader ?? []);
              return (
                <li key={post.inbetalningId}>
                  <div className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-transparent bg-surface p-3 contrast-more:border-border-strong">
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                      <span className="font-medium text-body">{post.namn}</span>
                      <span className="w-full text-caption text-text-muted">
                        {[`${visaKronor(post.belopp)} kr`, post.betalsatt, lage.text].join(' · ')}
                      </span>
                    </span>
                    {/* SKICKA IGEN, bara på en FALLERAD rad — samma regel och
                        samma mutation (`koaKvitton`, inte `skickaKvittoIgen`)
                        som jobbrads-listan nedan bär; se dess docblock för
                        varför. En rad som aldrig fallerat får ingen knapp. */}
                    {lage.fel && (
                      <Button
                        intent="secondary"
                        emphasis="outline"
                        size="sm"
                        isDisabled={koa.isPending}
                        onPress={() =>
                          koa.mutate(
                            { inbetalningIds: [post.inbetalningId] },
                            { onSuccess: (svar) => setJobbId(svar.jobbId ?? jobbId) },
                          )
                        }
                      >
                        Skicka igen
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {/* KNAPPEN HÖR TILL BLOCKET, inte till sidan: den skickar exakt de
              rader som står ovanför med "väntar på att skickas". Den försvinner
              när kön är tom — loggen står kvar. */}
          {vantande.length > 0 && (
            <Button
              intent="success"
              onPress={skickaKvitton}
              isLoading={koa.isPending}
              className="self-start"
            >
              {`Skicka ${vantande.length} ${vantande.length === 1 ? 'kvitto' : 'kvitton'}`}
            </Button>
          )}
        </div>
      )}

      {utfall && (
        <div className="flex flex-col gap-2">
          <MessageBox intent={utfall.intent} title={utfall.rubrik}>
            {utfall.klass === 'allt-skickat'
              ? 'Alla kvitton gick fram.'
              : /* VAR utfallet per kvitto står beror på om raderna är VÅRA.
                   Sedan C1 bär granskningsblocket ovan status per rad för allt
                   Lotta registrerat i denna session, och då finns inga rader
                   kvar under rutan att peka på. Texten sade tidigare
                   ovillkorligt "Raderna nedan" — vilket blivit en hänvisning
                   till en tom lista i det vanligaste fallet av alla. */
                ovrigaJobbrader.length > 0
                ? 'Raderna nedan visar utfallet per kvitto.'
                : 'Utfallet per kvitto står på raderna ovan.'}
          </MessageBox>
          <ul className="flex flex-col gap-1 px-4">
            {ovrigaJobbrader.map((jobbrad) => (
              <li
                key={jobbrad.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded bg-bg-muted px-3 py-2 text-small"
              >
                <span>{jobbrad.kvittonummer ?? 'Kvitto utan nummer än'}</span>
                <span className="flex flex-wrap items-center gap-2 text-text-muted">
                  {jobbrad.status === 'skickat'
                    ? 'Skickat'
                    : jobbrad.status === 'fel'
                      ? `Misslyckades: ${jobbrad.skal ?? 'okänt skäl'}`
                      : jobbrad.status === 'pagar'
                        ? 'Skickas ...'
                        : 'Väntar'}
                  {/* SKICKA IGEN, bara på en FALLERAD rad (AC #4).
                      `koaKvitton` och inte `skickaKvittoIgen`: den senare
                      skickar om ett kvitto som REDAN gått i väg (samma PDF,
                      samma nummer). En fallerad rad har per definition inget
                      utskickat kvitto - den ska köas på nytt, och servern
                      avgör om raden är köbar. Idempotensen bärs av den unika
                      nyckeln per inbetalning (ADR-128), så ett dubbeltryck kan
                      inte ge två kvitton. */}
                  {jobbrad.status === 'fel' && (
                    <Button
                      intent="secondary"
                      emphasis="outline"
                      size="sm"
                      isDisabled={koa.isPending}
                      onPress={() =>
                        koa.mutate(
                          { inbetalningIds: [jobbrad.objektId] },
                          { onSuccess: (svar) => setJobbId(svar.jobbId ?? jobbId) },
                        )
                      }
                    >
                      Skicka igen
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {soker ? (
        <div className="flex flex-col gap-4 px-4">
          {/* HUSETS NUMERUS-FORM (Marcus 2026-09-01), samma grammatik som
              "42 nya anmälningar att bekräfta" — inte ett tal i parentes
              efter en rubrik. */}
          <h2 className="font-semibold text-lg">
            {`${traffar.length} ${traffar.length === 1 ? 'träff' : 'träffar'}`}
          </h2>
          {traffar.length === 0 && (
            <p className="text-small text-text-muted">Ingen öppen betalning matchar sökningen.</p>
          )}
          {/* EN CONTAINER MED HÅRLINJER (designfynd 2a) — samma
              `divide-y`-kortform som `AnmalningarSida.tsx`s "Mer-lista", inte
              separata grå kort med gap mellan sig. Villkorad på längd: en tom
              `<ul>` hade annars ritat en tom rundad ruta under
              "Ingen öppen betalning matchar sökningen." ovan. */}
          {/* `-mx-4`: samma bredd som menybaren, se FilterRad-anropet ovan. */}
          {traffar.length > 0 && (
            <ul className="-mx-4 divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
              {traffar.map((rad) => (
                <BetalningsradKort
                  key={rad.nyckel}
                  rad={rad}
                  idag={idag}
                  visaEvent
                  oppen={oppenRad === rad.nyckel}
                  kvittens={kvittenser[rad.nyckel]}
                  betalsatt={betalsatt}
                  onBetalsatt={setBetalsatt}
                  onOppna={() => setOppenRad(rad.nyckel)}
                  onAvbryt={() => setOppenRad(null)}
                  onKlar={(resultat) => vidRegistrerad(rad, resultat)}
                />
              ))}
            </ul>
          )}

          {ovrigaPersoner.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-lg">Utan öppen betalning</h2>
              <ul className="flex flex-col gap-2">
                {ovrigaPersoner.map((person) => (
                  <li
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded bg-bg-muted px-3 py-2"
                  >
                    <span>{personVisningsnamn(person)}</span>
                    <Link
                      to="/personer/$personId"
                      params={{ personId: person.id }}
                      className="text-small underline"
                    >
                      registrera ändå
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-4">
          {/* TVÅ TOMLÄGEN, INTE ETT (anmälningssidans form). Finns det rader i
              perioden men dimensionsfiltren matchar inga, är RENSA återvägen —
              och då ska den erbjudas, inte bara konstateras. Är själva
              perioden tom finns inget att rensa fram, och den vanliga copyn
              gäller. Utan skillnaden hade en filtrerad återvändsgränd sett ut
              som "det finns inget". */}
          {visasRader.length === 0 &&
            (aktivaFilter > 0 && periodRader.length > 0 ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-small text-text-muted">Ingen betalning matchar filtren.</p>
                <AriaButton
                  onPress={rensaFilter}
                  className="rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                >
                  Rensa filter
                </AriaButton>
              </div>
            ) : (
              <p className="text-small text-text-muted">{tomtText(period)}</p>
            ))}
          {grupper.map((grupp) => (
            <div key={grupp.nyckel} className="flex flex-col gap-2">
              <h2 className="font-semibold text-lg">
                {grupp.eventNamn}
                {grupp.eventStartdatum && (
                  // Avdelaren är en riktig TEXTNOD, inte bara en marginal:
                  // rubrikens tillgängliga namn är sammanslagen text, och utan
                  // den läste skärmläsaren "ZZ-GRANSKNING-S1132026-09-07" i ett
                  // svep (mätt i vandringen 2026-08-31).
                  <span className="ml-2 font-normal text-small text-text-muted">
                    {' · '}
                    {grupp.eventStartdatum}
                  </span>
                )}
              </h2>
              {/* Villkorad på längd (samma skäl som träfflistans egen `<ul>`
                  ovan): en grupp kan bestå av ENDAST `klara`-rader, och en
                  tom `divide-y`-ruta hade då stått kvar utan innehåll ovanför
                  "Klara"-fällningen. */}
              {grupp.oppna.length > 0 && (
                /* `-mx-4`: samma bredd som menybaren, se FilterRad ovan. */
                <ul className="-mx-4 divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong">
                  {grupp.oppna.map((rad) => (
                    <BetalningsradKort
                      key={rad.nyckel}
                      rad={rad}
                      idag={idag}
                      oppen={oppenRad === rad.nyckel}
                      kvittens={kvittenser[rad.nyckel]}
                      betalsatt={betalsatt}
                      onBetalsatt={setBetalsatt}
                      onOppna={() => setOppenRad(rad.nyckel)}
                      onAvbryt={() => setOppenRad(null)}
                      onKlar={(resultat) => vidRegistrerad(rad, resultat)}
                    />
                  ))}
                </ul>
              )}

              {grupp.klara.length > 0 && (
                // KLARA HOPFÄLLDA (PRD § Inkorgen). Raderna finns kvar i
                // EF-svaret därför att basens `Saknas (kr)` läser SPEGELN och
                // spegeln kan släpa; Postgres säger att de är betalda. Att
                // dölja dem helt hade gjort eftersläpningen osynlig, att visa
                // dem öppna hade begravt lördagen.
                <Disclosure className="rounded border border-border">
                  <Heading>
                    <Button slot="trigger" intent="ghost" size="sm">
                      {`Klara (${grupp.klara.length})`}
                    </Button>
                  </Heading>
                  <DisclosurePanel>
                    <ul className="flex flex-col gap-2 px-3 pb-3">
                      {grupp.klara.map((rad) => (
                        <li
                          key={rad.nyckel}
                          className="flex flex-wrap items-center justify-between gap-2 text-small"
                        >
                          <span>{rad.namn}</span>
                          <span className="text-text-muted">
                            {`${visaKronor(rad.betalning.summaInbetalt)} kr betalt`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </DisclosurePanel>
                </Disclosure>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type KortProps = {
  rad: InkorgsRad;
  idag: string;
  visaEvent?: boolean;
  oppen: boolean;
  kvittens: string | undefined;
  betalsatt: Betalsatt;
  onBetalsatt: (b: Betalsatt) => void;
  onOppna: () => void;
  onAvbryt: () => void;
  onKlar: (resultat: RegistreringsUtfall) => void;
};

/**
 * EN rad i inkorgen. Radhöjden hålls generös med avsikt: PRD berättelse 29
 * ("jobba på iPad ... med stora rader, så att lördagen går lika bra i
 * soffan"). `py-3` plus knappens egen `min-h` ger ett träffområde över
 * WCAG 2.2 § 2.5.8:s 24 px-golv med marginal.
 */
function BetalningsradKort({
  rad,
  idag,
  visaEvent,
  oppen,
  kvittens,
  betalsatt,
  onBetalsatt,
  onOppna,
  onAvbryt,
  onKlar,
}: KortProps) {
  const saknas = rad.kvar ?? rad.betalning.saknas;

  /* ═══════════════════════════════════════════════════════════════════════
   * FOKUS-RETUR: ALLA VÄGAR UT UTOM DEN SOM MEDVETET GÅR ÅT ANNAT HÅLL
   * ═══════════════════════════════════════════════════════════════════════
   * Granskningsfynd runda 1. Formuläret ERSÄTTER trigger-knappen i DOM:en,
   * så när raden öppnas rivs den nod fokus stod på och fokus faller till
   * `document.body`. Samma felklass som `Deltagare.tsx` § "alla vägar ut"
   * beskriver för batch-baren: "Lotta börjar om från sidans topp, och en
   * skärmläsaranvändare tappar sin plats mitt i arbetet."
   *
   * Mönstret är husets: en `buttonRef` som fokus-retur-mål
   * (`DetaljGrupp.tsx` § `AndraRad`, "tangentbordskontinuitet") plus en
   * effekt som körs EFTER commit, när knappen åter finns i DOM.
   *
   * VARFÖR EN FLAGGA OCH INTE RETUR VID VARJE STÄNGNING: registreringens väg
   * ut flyttar fokus till SÖKFÄLTET med avsikt (AC #3: "efter Enter kvitterar
   * raden, listan uppdateras, fokus åter i tomt sökfält"). En ovillkorlig
   * retur hade konkurrerat med den och gett en kapplöpning mellan två
   * fokus-anrop i samma commit. Flaggan sätts därför bara av Avbryt och Esc.
   */
  const triggerRef = useRef<HTMLButtonElement>(null);
  const varOppen = useRef(false);
  const skaAterfaFokus = useRef(false);

  useEffect(() => {
    if (varOppen.current && !oppen && skaAterfaFokus.current) {
      skaAterfaFokus.current = false;
      triggerRef.current?.focus();
    }
    varOppen.current = oppen;
  }, [oppen]);

  function avbryt() {
    skaAterfaFokus.current = true;
    onAvbryt();
  }

  return (
    // Kortets EGEN kant/bakgrund (`rounded border bg-bg-muted`) är riven
    // (designfynd 2a): containern är nu `<ul>`s `divide-y`-yta, en hårlinje
    // per rad i stället för ett eget kort per person.
    //
    // `overflow-hidden` GÄLLER BARA DEN STÄNGDA RADEN. Den fanns för att
    // formulärets `border-t` inte skulle läcka utanför listans rundade hörn.
    // Den ÖPPNA raden bär sedan Marcus dom 2026-09-01 ett markerat kort som
    // med avsikt bryter ut ur radens bredd (`-mx-3`), och en klippning hade
    // ätit upp precis den ram som är hela poängen — samtidigt som formulärets
    // linje är avstängd där (`visaAvdelare={false}`), så skälet till
    // klippningen är borta i exakt det läge den skulle ha skadat.
    <li className={oppen ? undefined : 'overflow-hidden'}>
      {/* ═══ DEN ÖPPNA RADEN ÄR ETT MARKERAT KORT (Marcus dom 2026-09-01) ═══
          Ordagrant: *"Lotta måste se att … det är på cecilia ödman hon står …
          kanske rama in eller använda vår gröna markeringsruta"*.

          FORMEN ÄR HUSETS, INTE NY. Exakt samma klasser som `Deltagare.tsx`s
          `MarkerbartKort` (S73-facit) bär för ett valt deltagarkort:
          `border-(--mm-success) bg-(--mm-success-bg)` på `rounded-xl border`.
          `contrast-more`-kanten upprepas i den gröna tonen — utan den vinner
          Tailwinds contrast-variant och ger kortet en NEUTRAL kant i förhöjd
          kontrast, alltså tappar precis de användare regeln finns för
          markerings-signalen (review-fynd 6 i förlagan).

          PERSON-HEADER + KVITTENS + FORMULÄR LIGGER INNE I KORTET, så det är
          EN enhet: namnet Lotta står på syns ovanför fälten hon fyller i,
          inuti samma ram. Formulärets egen hårlinje är avstängd av samma skäl.

          `-mx-3 px-3` GER RAMEN UTAN ATT FLYTTA RUTNÄTET: kortet växer 12 px
          åt vardera hållet och betalar tillbaka lika mycket i padding, så
          avatar, namn och fält står kvar på exakt samma vänsterlinje som i den
          stängda raden. Ingenting hoppar i sidled när raden öppnas. */}
      <div
        className={
          oppen
            ? '-mx-3 my-2 rounded-xl border border-(--mm-success) bg-(--mm-success-bg) px-3 contrast-more:border-(--mm-success)'
            : undefined
        }
      >
        {/* AVATAR-CHIP + GRID-ALIGNAD KOMPOSITION (designfynd 2b/2d) — samma
          grammatik som `ForfallnaBetalningar.tsx`s `ForfallenRadInnehall`:
          avatar · namn/meta-kolumn (flex-1) · trailing knapp.

          [TASK-346.14 fix-runda D, D2] STAPLAD PÅ SMALA BRYTPUNKTER, TVÅ
          KOLUMNER FRÅN `sm` — orkestrerarens visuella dom på 375×812 mätte
          namnet och det öppna beloppet trunkerade till "Beng…"/"Saknas …"
          (radens dåvarande ordalydelse, se sekundärraden nedan) när
          "Registrera betalning" delade raden med info-kolumnen
          (`dom-inkorg-375.png`). Lotta ska se VEM som saknar VAD; namnet får
          aldrig trunkeras bort. Raden är därför `flex-col` (mobil, `stretch`
          ger info-blocket och knappen var sin FULLA radbredd, `namn`/`meta`
          bär inget `truncate` och wrappar i stället) och `sm:flex-row` (den
          tidigare tvåkolumnsformen, godkänd i domen på 1440×900 — `truncate`
          återinförs bara där, eftersom bara DÄR delar raden utrymme med
          knappen). `self-start` på knappen förhindrar att `flex-col`s
          default `align-items: stretch` sträcker den till full bredd på
          mobil — den ska stå på sin egen rad, inte bli en helbredds-yta. */}
        <div className="flex flex-col gap-3 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-3 sm:flex-1">
            <InitialAvatar namn={rad.namn} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-medium text-body sm:truncate">{rad.namn}</span>
              <span className="text-caption text-text-muted sm:truncate">
                {visaEvent && rad.betalning.eventNamn ? `${rad.betalning.eventNamn} · ` : ''}
                {/* LÖPANDE TEXT ⇒ BELOPPET FÖRST (Marcus 2026-09-01, samma
                  domänterm över alla betalningsytor): "1 500 kr kvar att
                  betala" läser som svenska efter eventnamnet, medan
                  etikett-först hade läst som en tabellrad i en mening.
                  Etikett-formen ("Kvar att betala" + högerställt värde) bär
                  panelen och anmälans detaljvy. */}
                {saknas === null
                  ? 'Pris saknas i basen'
                  : `${visaKronor(saknas)} kr kvar att betala`}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {rad.forfallen && (
                  <span className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption">
                    <Clock aria-hidden size={13} />
                    Förfallen
                  </span>
                )}
                {rad.obekraftad && (
                  <StatusBadge ton="warning" storlek="sm">
                    Obekräftad
                  </StatusBadge>
                )}
                {rad.spegelSlapar && (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-transparent bg-bg px-2 py-0.5 text-caption text-text-muted"
                    title="Basen har inte hunnit uppdateras än"
                  >
                    <AlertTriangle aria-hidden size={13} />
                    Basen släpar
                  </span>
                )}
              </div>
            </div>
          </div>
          {!oppen && (
            <Button
              ref={triggerRef}
              intent="primary"
              emphasis="outline"
              size="sm"
              onPress={onOppna}
              className="self-start sm:self-auto"
            >
              Registrera betalning
            </Button>
          )}
        </div>

        {kvittens && (
          <p role="status" className="pb-3 text-small text-text-muted">
            {kvittens}
          </p>
        )}

        {oppen && (
          <RegistreraForm
            rad={rad}
            idag={idag}
            betalsatt={betalsatt}
            onBetalsatt={onBetalsatt}
            onAvbryt={avbryt}
            onKlar={onKlar}
            // Kortets gröna ram ÄR grupperingen — se docblocket vid kortet.
            visaAvdelare={false}
          />
        )}
      </div>
    </li>
  );
}
