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
import { useKoaKvitton, useRaderaInbetalning } from '@/data/mutations/inbetalningar';
import { useForhandsgranskaKvitto } from '@/data/mutations/kvitton';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Jobbstatus } from '@/domain/schemas';
import { filtreraPersonregister, personVisningsnamn } from '@/lib/person-sok';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
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
  kanForhandsgranska,
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
  /**
   * Inkorgsradens nyckel (anmälans record-ID), när registreringen kom därifrån.
   * `undefined` för importerade rader, som inte hör till en synlig rad.
   *
   * Den finns HÄR bara för Ångra: kvittenstexten ("500 kr registrerat …") bor i
   * `kvittenser` under den nyckeln, och en ångrad registrering måste ta med sig
   * sin kvittens. Annars står ett kvitto kvar på personens kort och påstår att
   * något registrerades som inte längre finns.
   */
  radNyckel?: string;
};

/**
 * Vad granskningsraden säger om kvittot, plus vilka åtgärder raden får erbjuda.
 *
 * `kanAngra` ÄR AVSIKTLIGT SNÄV (pass 11, Marcus: *"jag kan ju inte ens ta bort
 * Bengt Lindqvist som ligger i granskningsblocket nu, det måste ju gå, eller?"*).
 * Ångra RADERAR inbetalningen — den får bara erbjudas när vi VET att inget
 * kvitto gått i väg:
 *
 *   • inget kvitto begärt (kryssrutan var ur) ⇒ det finns inget att hinna före
 *   • raden ligger i den SESSION-LOKALA kön ⇒ Lotta har inte tryckt på knappen
 *
 * Allt annat får `kanAngra: false`, och skälet står i `angraSkal`. Särskilt
 * `vantar` (köad på SERVERN) är medvetet utesluten trots att kvittot ännu inte
 * skickats: jobbmotorn kan plocka raden i samma sekund, och en radering som
 * kapplöper med en utskickande worker är exakt det vi inte ska bjuda in till.
 * Servern är ändå sista instans — `hantera-inbetalning` skiljer radera (före
 * kvitto) från makulera (efter) — men grinden ska inte förlita sig på att en
 * skarp operation fallerar snyggt.
 */
type Kvittolage = {
  text: string;
  fel: boolean;
  kanAngra: boolean;
  /** Varför Ångra inte erbjuds, i klartext för Lotta. `null` när den erbjuds. */
  angraSkal: string | null;
  /**
   * [TASK-362] Sant när raden är FÄRDIGBEHANDLAD och inte kräver
   * uppmärksamhet — antingen bar registreringen aldrig ett kvitto, eller
   * kvittot har GÅTT I VÄG. Falskt medan något fortfarande pågår (köat i
   * sessionen, köat/pågår på servern) ELLER har fallerat.
   *
   * Detta är granskningsblockets EGEN varningston (Marcus 2026-09-02,
   * S113 resume 8-röktestet: *"jag gillade inte riktigt allt som händer
   * UNDER utskicket, den gula rutan förändrades i höjd"*) — blockets
   * gold/varning-fond ska bara visas medan `registrerade.some(rad =>
   * !kvittolage(...).vila)`. Ett kvitto som gått i väg är inte en
   * varning; det är historia, och raden ska vila lika stilla som en rad
   * utan kvitto alls.
   */
  vila: boolean;
};

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
  const angrabar = { fel: false, kanAngra: true, angraSkal: null, vila: true };
  /** Kvittot är ute eller på väg — undo går via makulering, inte radering. */
  const makuleringsvag =
    'Kvittot är på väg eller skickat. Ångra genom att makulera inbetalningen på anmälans betalningsrader.';

  if (!rad.medKvitto) return { text: 'Inget kvitto', ...angrabar };
  if (vantande.some((v) => v.inbetalningId === rad.inbetalningId)) {
    return { text: 'Kvitto väntar på att skickas', ...angrabar, vila: false };
  }

  const jobbrad = jobbrader.find((j) => j.objektId === rad.inbetalningId);
  if (jobbrad?.status === 'skickat') {
    return {
      text: jobbrad.kvittonummer ? `Kvitto skickat · ${jobbrad.kvittonummer}` : 'Kvitto skickat',
      fel: false,
      kanAngra: false,
      angraSkal: makuleringsvag,
      vila: true,
    };
  }
  if (jobbrad?.status === 'pagar') {
    return {
      text: 'Kvitto skickas ...',
      fel: false,
      kanAngra: false,
      angraSkal: makuleringsvag,
      vila: false,
    };
  }
  if (jobbrad?.status === 'vantar') {
    return {
      text: 'Kvitto köat',
      fel: false,
      kanAngra: false,
      angraSkal: makuleringsvag,
      vila: false,
    };
  }
  if (jobbrad?.status === 'fel') {
    return {
      text: `Kvittot kunde inte skickas: ${jobbrad.skal ?? 'okänt skäl'}`,
      fel: true,
      kanAngra: false,
      angraSkal: makuleringsvag,
      vila: false,
    };
  }

  return {
    text: 'Kvitto köat',
    fel: false,
    kanAngra: false,
    angraSkal: makuleringsvag,
    vila: false,
  };
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
  if (period === 'upcoming') return 'Inga kvarvarande betalningar på kommande event.';
  if (period === 'past') return 'Inga kvarvarande betalningar på tidigare event.';
  return 'Inga kvarvarande betalningar.';
}

export function BetalningsInkorg() {
  const dataSource = useDataSource();
  const [sokterm, setSokterm] = useState('');
  const [oppenRad, setOppenRad] = useState<string | null>(null);
  const [kvittenser, setKvittenser] = useState<Record<string, string>>({});
  const [vantande, setVantande] = useState<VantandeKvitto[]>([]);
  /** Granskningsblockets logg — se `SessionsRad` för varför den inte är kön. */
  const [registrerade, setRegistrerade] = useState<SessionsRad[]>([]);
  /** Inbetalnings-ID vars Ångra-bekräftelse står öppen; `null` = ingen. */
  const [angraId, setAngraId] = useState<string | null>(null);
  /* FOKUS-MÅLET ÄR NU BLOCKET SJÄLVT, inte dess rubrik (Marcus rev rubriken
     2026-09-01). Blocket är en `<section aria-label>` med `tabIndex={-1}`, så
     det är både fokuserbart programmatiskt och har ett tillgängligt namn att
     annonsera när fokus landar där efter en ångrad rad. `HTMLElement` och inte
     `HTMLDivElement`: noden är ett `<section>`. */
  const granskningsBlockRef = useRef<HTMLElement>(null);
  const [jobbId, setJobbId] = useState<string | undefined>(undefined);
  /**
   * [TASK-362] Synligheten på jobbUTFALLETS SUCCESS-BEKRÄFTELSE — SKILD
   * från `jobbId` självt, och (sedan review-runda 1, FYND 1) SKILD från
   * `warning`/`info`-utfallet, som INTE har någon egen dölj-flagga (se
   * `utfall`-konsumenterna nedan). Forskningspasset 2026-09-02
   * (`docs/research/utskicksbekraftelse-inkorg-auto-dismiss-vs-persistent-2026-09-02.md`)
   * mätte rotorsaken: `jobbId` nollställs aldrig, så en gammal bekräftelse
   * stod kvar RESTEN AV BESÖKET. Lösningen är inte att nollställa `jobbId`
   * (jobbstatus-frågan ska fortsätta läsa det senaste jobbet, ADR-129) utan
   * att låta BEKRÄFTELSENS SYNLIGHET vara sin egen flagga:
   *   • Stängs manuellt (kryss, bara `success` — kryss-regeln, S109-facit).
   *   • Döljs AUTOMATISKT så fort Lotta gör nästa handling (ny registrering
   *     ELLER en ny "Skicka") — den gamla bekräftelsen är då inaktuell.
   *   • Visas AUTOMATISKT igen så fort ETT NYTT jobb faktiskt startar
   *     (`jobbId` byter värde, se effekten nedan) — annars hade en
   *     retry/ny sändning blivit stum.
   *
   * VARFÖR `warning`/`info` INTE DELAR DENNA FLAGGA (review-runda 1,
   * FYND 1 — Marcus mandat): kryss-regeln (S109-facit) säger att en
   * varning försvinner när ORSAKEN är borta, aldrig av en obesläktad
   * handling. Nollställer `vidRegistrerad`/`skickaKvitton` en DELAD flagga
   * ovillkorligt döljs en genuin "N kvitton misslyckades"-varning bara för
   * att Lotta registrerar en annan betalning — mätt fel i runda 1 av denna
   * PR. `warning` (och `info`, av samma princip) visas i stället så länge
   * `utfall` beskriver den, och `utfall` byter bara innehåll när ETT NYTT
   * jobb faktiskt startar.
   */
  const [bekraftelseSynlig, setBekraftelseSynlig] = useState(true);
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
  /** [TASK-353] Renderar ett VÄNTANDE kvitto som utkast — skickar ingenting. */
  const forhandsgranska = useForhandsgranskaKvitto();

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

  /* [TASK-362] Ett NYTT jobb (annat `jobbId` än förra rendern) gör den GAMLA
     bekräftelsen inaktuell OCH gör att den NYA förtjänar att synas — annars
     hade en stängd/inaktuell bekräftelse tyst blockerat nästa sändnings egen
     status. `useRef` och inte ett andra `useState`: jämförelsen ska INTE
     trigga en egen render, bara grinda EN `setBekraftelseSynlig`. */
  const foregJobbId = useRef(jobbId);
  useEffect(() => {
    if (foregJobbId.current !== jobbId) {
      foregJobbId.current = jobbId;
      setBekraftelseSynlig(true);
    }
  }, [jobbId]);

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
     "…kvarvarande betalningar laddade."-statusen nedan (Roselli-anatomin: en region
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
    /* [TASK-362, review-runda 1 FYND 1] NÄSTA HANDLING gör en stående
       SUCCESS-bekräftelse om ett TIDIGARE jobb inaktuell — Lotta har gått
       vidare till en annan person. Rör ALDRIG en `warning`/`info`-yta (de
       har ingen egen dölj-flagga, se `bekraftelseSynlig`s docblock).
       Startar DENNA registrering själv ett nytt jobb (nedan) sätter
       jobbId-effekten ovan tillbaka synligheten åt DEN sändningens egen
       status. */
    setBekraftelseSynlig(false);
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
        radNyckel: rad.nyckel,
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

  /* ═══════════════════════ ÅNGRA EN REGISTRERING (pass 11) ═══════════════════
   * Marcus: *"jag kan ju inte ens ta bort Bengt Lindqvist som ligger i
   * granskningsblocket nu, det måste ju gå, eller?"*
   *
   * DEN ÅNGRAR REGISTRERINGEN, INTE RADEN. Att bara plocka bort posten ur
   * loggen hade varit en lögn: inbetalningen ligger i ledgern och kvittot i
   * kön, och en yta som säger "borta" om något som finns kvar är värre än
   * ingen yta alls. `useRaderaInbetalning` är samma väg inbetalningsraderna
   * redan använder (`hantera-inbetalning`, atgard `radera`) — ingen ny
   * serverlogik, ingen ny EF.
   *
   * TRE TILLSTÅND STÄDAS I SAMMA ANDETAG, och alla tre behövs:
   *   1. `vantande` — annars räknar "Skicka N kvitton" en betalning som inte
   *      längre finns, och nästa tryck hade köat ett kvitto för en raderad
   *      inbetalning.
   *   2. `registrerade` — loggen speglar då verkligheten igen.
   *   3. `kvittenser` — kvittenstexten på personens rad ("500 kr
   *      registrerat …") måste bort med sin registrering, annars står ett
   *      påstående kvar om något som är ogjort.
   *
   * ORDNINGEN ÄR SERVERN FÖRST. Städningen sker i `onSuccess`, aldrig
   * optimistiskt: fallerar raderingen ska raden stå kvar exakt som den var,
   * och felet synas vid raden.
   *
   * FOKUS EFTER BORTTAGNING går till blockets rubrik (`tabIndex={-1}`), som är
   * den enda nod som säkert finns kvar när raden fokus stod på rivs ur DOM.
   * Utan det faller fokus till `document.body` — samma felklass som radens
   * `skaAterfaFokus` och `stangImport` redan vaktar.
   */
  const radera = useRaderaInbetalning();

  function angraRegistrering(post: SessionsRad) {
    /* `radNyckel` ÄR anmälans record-ID (`rad.nyckel`), och den skickas med
       så att mutationen kan skriva serverns omräkning rakt in i cachen —
       personens kort återuppstår i listan i samma tick som granskningsraden
       försvinner. Den är `undefined` för rader som kom in via SwishImport;
       då hoppas patchen över och invalideringen sköter jobbet som förut. */
    radera.mutate(
      { inbetalningId: post.inbetalningId, anmalanRecordId: post.radNyckel },
      {
        onSuccess: () => {
          setVantande((tidigare) => tidigare.filter((v) => v.inbetalningId !== post.inbetalningId));
          setRegistrerade((tidigare) =>
            tidigare.filter((p) => p.inbetalningId !== post.inbetalningId),
          );
          if (post.radNyckel !== undefined) {
            setKvittenser((tidigare) => {
              const { [post.radNyckel as string]: _borttagen, ...kvar } = tidigare;
              return kvar;
            });
          }
          setAngraId(null);
          granskningsBlockRef.current?.focus();
        },
      },
    );
  }

  function skickaKvitton() {
    if (vantande.length === 0) return;
    // [TASK-362] Se `vidRegistrerad`s motsvarande rad — samma "nästa
    // handling gör den gamla SUCCESS-bekräftelsen inaktuell"-regel. Rör
    // aldrig `warning`/`info` (FYND 1).
    setBekraftelseSynlig(false);
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

  /**
   * [TASK-353] FÖRHANDSGRANSKA ETT VÄNTANDE KVITTO — husets fönster-först-
   * mönster, kopierat och inte uppfunnet.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * FÖNSTRET ÖPPNAS SYNKRONT, FÖRE `mutate()` — DET ÄR HELA POÄNGEN
   * ═══════════════════════════════════════════════════════════════════════
   * Länken är signerad och PDF:en RENDERAS av EF:en (DocRaptor), så adressen
   * finns inte när Lotta klickar — det tar sekunder. `GenereringsVy.tsx`
   * (`startaForhandsgranskning`), `DokumentYta.tsx` och
   * `InbetalningsLista.tsx` (`visaKvitto`) löste redan exakt detta: öppna
   * fönstret i klickets EGNA tick, skriv en laddningssida i det, sätt
   * adressen när svaret kommer.
   *
   * ATT VÄNTA MED `window.open` TILLS SVARET KOMMER ÄR MÄTT FEL, inte
   * befarat: Marcus prod-röktest 2026-08-26 fick fönstret blockerat när
   * renderingen tog några sekunder (*"Skarpt så måste ju ett chromefönster
   * öppnas direkt"*) — se `useForhandsgranskaBilaga.ts` § HISTORIK för hela
   * den läxan. Denna yta upprepar inte det felet.
   *
   * `fonster.closed`-VAKTEN vid den SENARE href-sättningen är obligatorisk:
   * Lotta kan hinna stänga fliken medan EF:en renderar, och att skriva
   * `location.href` på ett stängt fönster kan kasta.
   *
   * (Vakten är nu husets TREDJE inlinade instans — `GenereringsVy` bär den
   * som `stangOanvantFonster`, `InbetalningsLista` inlinar den. Den är
   * medvetet INTE utbruten här: en enrads-vakt är ingen abstraktion värd
   * en modul, och att röra två redan levererade ytor kvällen före en demo
   * är fel tillfälle. Noterat som kandidat för ett senare pass.)
   */
  function forhandsgranskaKvitto(inbetalningId: string, namn: string) {
    // Dubbelklicks-vakt. Knapparna bär `aria-disabled` och INTE `isDisabled`
    // (se knapparnas egen kommentar), så spärren måste ligga här.
    if (forhandsgranska.isPending) return;

    // MÅSTE ske synkront, före mutate() och all await — se docblocket.
    const fonster = window.open('', '_blank');
    skrivLaddningssida(fonster, {
      titel: 'Skapar förhandsgranskningen …',
      text: `Ett ögonblick, kvittot till ${namn} renderas och visas här om några sekunder.`,
    });

    forhandsgranska.mutate(inbetalningId, {
      onSuccess: ({ url }) => {
        if (fonster && !fonster.closed) fonster.location.href = url;
      },
      onError: () => {
        // Stäng det tomma fönstret — felet sägs på SIDAN (`role="alert"`
        // nedan), där Lotta faktiskt är. Ett kvarlämnat fönster med en
        // laddningstext som aldrig blir något är ett löfte som inte infrias.
        if (fonster && !fonster.closed) fonster.close();
      },
    });
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

  /* [TASK-362] BLOCKETS TON: varning SÅ LÄNGE något faktiskt pågår eller har
     fallerat, annars vila. Marcus 2026-09-02 (S113 resume 8-röktestet): den
     gula fonden stod kvar oavsett vad raderna faktiskt sa — en rad vars
     kvitto redan gått i väg bär exakt lika mycket varningston som en rad som
     fortfarande väntar. `some(!vila)` läser samma `kvittolage` raderna
     redan visar, så tonen kan aldrig säga något annat än vad texten säger. */
  const blockAktivt = registrerade.some(
    (post) => !kvittolage(post, vantande, jobb.data?.rader ?? []).vila,
  );

  /* [TASK-353] FORMVALET, MÄTT MOT DEN FAKTISKA UI-STRUKTUREN OCH BOKFÖRT.
     Marcus order: *"en knapp bredvid 'Skicka X kvitton' som heter
     'Förhandsgranska'"*, och vid FLERA kvitton per-rad i granskningsblocket.

     VAD MÄTNINGEN VISADE: granskningsblocket (C1) renderar EN rad per
     registrering med namn, betalsätt/status och belopp, plus en åtgärdsslot
     till höger som redan bär "Ångra" respektive "Skicka igen". "Skicka N
     kvitton" står ENSAM under listan (`self-start`). Det finns alltså redan
     en per-rad-slot att hänga en tredje åtgärd i — ingen ny struktur behövs.

     VALD FORM, och varför den inte är godtycklig:
       • EXAKT ETT väntande kvitto → knappen står BREDVID "Skicka 1 kvitto".
         Där är den entydig: det finns bara ett kvitto den kan avse, och
         Lottas blick är redan på knappraden hon ska trycka på.
       • FLERA väntande → INGEN knapp vid "Skicka N kvitton", utan en per
         RAD. En ensam "Förhandsgranska" bredvid "Skicka 8 kvitton" hade
         varit tvetydig (granska vilket av de åtta?), och att öppna åtta
         flikar på ett klick är inte en granskning utan ett översvämmat
         fönsterfält.

     KNAPPEN FLYTTAR ALLTSÅ, den dupliceras inte — de två lägena är
     ömsesidigt uteslutande (`vantande.length === 1` respektive `> 1`), så
     samma kvitto kan aldrig ha två förhandsgransknings-knappar. */
  const vantandeIds = vantande.map((v) => v.inbetalningId);
  const enSamKo = vantande.length === 1;

  /* Ett-kvitto-fallets rad, slagen upp i LOGGEN (`registrerade`) och inte
     antagen ur kön. Kön bär bara `{ inbetalningId, namn, belopp }` — den vet
     inget om `medKvitto`, som är `kanForhandsgranska`s första villkor. Att
     skicka in ett påhittat `medKvitto: true` hade varit att flytta regeln från
     härledningen till JSX, alltså precis tvärtemot varför härledningen finns.
     `?? null` gör uppslaget totalt: hittas ingen rad visas ingen knapp. */
  const ensamKandidat = enSamKo
    ? (registrerade.find((post) => post.inbetalningId === vantande[0].inbetalningId) ?? null)
    : null;

  return (
    <section className="flex flex-col gap-4">
      {sidRam}
      <p className="sr-only" role="status" aria-live="polite">
        {`${rader.length} kvarvarande betalningar laddade.`}
      </p>

      {/* SIDHUVUDETS HANDLINGSYTA (designfynd 2c): "Importera kontoutdrag" var
          en ensam strö-knapp mellan segmentväljaren och listan — flyttad hit,
          bredvid rubriken, samma rad. Knappen göms medan importytan är
          öppen (oförändrat beteende) — se `visaImport`-villkoret nedan. */}
      {/* ═══ SIDHUVUDET SPEGLAR FILTERRADENS RUTNÄT (Marcus 2026-09-01) ═══
          Ordagrant: *"Jag tycker 'Importera kontoutdrag'-knappen ska sitta
          liksom centrerat på rubrik-raden men kant i kant med sökrutan."*

          VAD SOM VAR FEL, MÄTT I RUTNÄTET (inre kolumn 568 px, se
          `FilterRad`-anropet nedan för härledningen av det talet):
            sökrutans högerkant .... x=514   (568 − 16 gap − 38 tratt)
            trattens högerkant ..... x=568
            knappens högerkant ..... x=552   ← låg MITT EMELLAN de två
          Knappen linjerade alltså med ingenting alls. Den satt på
          `<header px-4>`s innerkant (552), en linje ingen annan yta på sidan
          bär. Det är den raggade högerkanten Marcus såg.

          LÖSNINGEN ÄR STRUKTURELL, INTE EN MARGINAL: headern får SAMMA
          tre-delade rytm som filterraden — `[innehåll flex-1][gap-4][rund
          ändknapp]`. Filterradens ändknapp är tratten; headern har ingen, så
          den RESERVERAR spåret med en tom spegel av trattens egna mått
          (`p-2.5` + 18 px ikon — samma klasser som `FilterRad.tsx:254-258`,
          inte en uträknad pixel). Följden: knappens högerkant hamnar på 514,
          alltså exakt sökrutans.

          `pl-4` I STÄLLET FÖR `px-4`: högerkanten måste nå 568 för att
          speglingen ska gälla, precis som filterraden når dit via sitt
          `-mx-4`. Vänsterkanten är ORÖRD (16 px) — rubrikens placering var
          aldrig det Marcus klagade på.

          `items-center` (var `items-start`) ÄR "centrerat på rubrik-raden":
          knappen är `size="sm"` medan rubriken är `text-3xl`, så toppjustering
          klistrade den i överkant. Nu delar de mittlinje.

          KNAPPEN OCH SPEGELN LIGGER I EN EGEN GRUPP så `flex-wrap` flyttar dem
          TILLSAMMANS på smal skärm — annars hade spåret kunnat brytas ner på en
          egen rad och lämnat 38 px tomrum. */}
      <header className="flex flex-wrap items-center gap-4 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
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
          <div className="flex shrink-0 items-center gap-4">
            <Button
              ref={importKnappRef}
              intent="secondary"
              emphasis="outline"
              size="sm"
              onPress={() => setVisaImport(true)}
            >
              {/* TERMEN ÄR "KONTOUTDRAG" (Marcus dom 2026-09-01) — se
                  `SwishImport.tsx`s `aria-label` för hela skälet. Knappen och
                  dialogens rubrik bär SAMMA ord, så Lotta känner igen ytan hon
                  just öppnade. */}
              Importera kontoutdrag
            </Button>
            {/* TRATT-SPÅRET, TOMT. Speglar `FilterRad.tsx`s trigger-knapp
                (`inline-flex shrink-0 items-center justify-center ... p-2.5`
                med en 18 px `Filter`-ikon) så att headerns innehållskolumn
                slutar på SAMMA x som filterradens gör. `aria-hidden` +
                `pointer-events-none`: rent rutnät, aldrig något att läsa eller
                träffa. Ändras trattens storlek i primitiven ska denna spegel
                följa med — den korrespondensen är hela skälet att måtten står
                som trattens EGNA klasser i stället för som en summa. */}
            <span
              aria-hidden="true"
              className="pointer-events-none inline-flex shrink-0 items-center justify-center p-2.5"
            >
              <span className="block size-[18px]" />
            </span>
          </div>
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

          RADFORMEN ÄR INBETALNINGSRADERNAS (`InbetalningsLista.tsx` § RADENS
          ANATOMI): bankens tre kolumner — titelled i `text-body`-vikt,
          sekundärled som ETT `·`-svep i `text-caption text-text-muted`, och
          beloppet högerställt i egen kolumn på titelradens baslinje. ETT
          MEDVETET AVSTEG: titelledet är NAMNET och inte betalsättet — det är
          personen som skiljer raderna åt här, medan förlagan listar en enda
          persons betalningar och därför kan låta betalsättet vara identiteten.
          Betalsättet står i klartext i sekundärledet. */}
      {registrerade.length > 0 && (
        /* ETT RIKTIGT BLOCK-I-BLOCK (pass 11, Marcus: *"VA FAN är det här för
           granskningsblock? FAN va dåligt"*).

           ROTORSAKEN, MÄTT: raderna BAR redan inbetalningsradernas kortform
           (`rounded-2xl … bg-surface p-3`) — men behållaren var genomskinlig
           och `body` bär `--mm-bg` = `--p-neutral-0`, alltså VITT. Vita kort
           på en vit botten är osynliga kort, och det Marcus såg var därför
           lös text som svävade. Exakt samma rotorsak som fynd 1 i listan.

           Behållaren är nu bilage-ytans `GRUPPKORT`-form (tonad yta vars
           padding ÄR rännan mellan korten) — samma block-i-block-grepp som
           pass 8 gav "Senaste inbetalningar" på personkortet och anmälans
           detaljvy. Radformen är oförändrad; det var aldrig den som var fel.

           (Denna not sade tidigare "med rubriken INUTI". Rubriken revs
           2026-09-01, se `<div>`-noden nedan — greppet är oförändrat, men
           formuleringen beskrev en nod som inte längre finns.) */
        /* ═══ GULD-TONAD YTA MED KONTUR (Marcus 2026-09-01) ═══
           Ordagrant: *"Kanske ska vi ha gul bakgrund med kontur på
           granskningsblocket, så det syns tydligare? Eller guld/gul eller vad
           vi har"*.

           TOKENVALET, ur husets EGEN familj — ingen ny token, ingen hårdkodad
           färg:
             yta    `bg-primary-tint`   = `--mm-primary-tint` = `--p-gold-100`
             kontur `border-primary-muted` = `--mm-primary-muted` = `--p-gold-400`
             kontrast-more `border-primary` = `--mm-primary` = `--p-gold-500`
           Guldet ÄR husets primärfärg (`semantic.css` § Primär), så "gul" och
           "vad vi har" pekar på samma ställe.

           HERO-RESERVATIONEN GÄLLER INTE HÄR — mätt, inte antaget.
           `NastaEvent.tsx` bär `bg-primary-tint` med en not om att vara Hems
           enda hero. Den reservationen handlar om HERO-ROLLEN på Hem, inte om
           tonen: `bg-primary-tint` används på FEM ytor utanför Hem
           (`EventCheckin.tsx:439` kort, `PersonsList.tsx` rader ×2,
           `PrototypeSwitcher.tsx` ×2). Tonen är alltså husets tonala yta, och
           betalningssidan har ingen hero att konkurrera med.

           (Räkningen sade SEX när detta skrevs. `PersonDetail.tsx`s "Just
           nu"-block lämnade tinten senare samma dag — Marcus: fonden *"skär
           sig med färgerna som event-raderna har"* — och bär nu guld-KONTUR på
           vit botten i stället. Talet är rättat i stället för att stå kvar som
           en tyst osanning; slutsatsen är oförändrad.)

           MÄTVÄRDEN (WCAG 2, sRGB, mot `--p-gold-100` #fbf3e0):
             `--mm-text` #242424 ......... 14,04:1  (var 15,52:1 mot vitt)
             `--mm-text-secondary` ....... 7,16:1
             `--mm-text-muted` #6b6b6b ... 4,82:1   ✓ AA normal text (4,5:1)
             sage-knappen #606b57 ........ 5,08:1   ✓ 1.4.11 icke-text (3:1)
                                                    (var 5,15:1 mot bg-muted —
                                                     alltså ingen regression)
             vit text PÅ sage ............ 5,62:1   ✓ oförändrad, knappens egen yta
             vita kort mot ytan .......... 1,11:1   (var 1,09:1 mot bg-muted —
                                                     kortens avgränsning bärs som
                                                     förut av `contrast-more`)
             konturen mot vit sida ....... 2,33:1, och 2,57:1 i contrast-more
           SAGE-KNAPPEN ÄR OFÖRÄNDRAD I FÄRG OCH FORM — den är husets standard
           för externa utskick och får inte färgändras. Den mättes MOT den nya
           ytan, den ändrades inte.

           KONTUREN ÄR SYNLIG I VILA, till skillnad från repots vanliga
           `border-transparent` + `contrast-more`-idiom. Det är hela poängen med
           Marcus beställning ("så det syns tydligare"): den tonade ytan ensam
           ligger på 1,11:1 mot den vita sidan och bär inte avgränsningen. */
        /* ═══ INGA VITA KORT I BLOCKET (Marcus 2026-09-01, pass 14) ═══
           Ordagrant: *"Cecilias kort borde gå i samma ton/färg-familj som
           bakgrunden och konturen på granskningsblocket"*.

           Raderna låg som vita `bg-surface`-kort på guld-tinten — alltså en
           tredje ton i ett block som bara har två. De ligger nu DIREKT på
           guldytan, skilda av hårlinjer i blockets EGEN konturton, vilket är
           samma bank-anatomi som `InbetalningsLista.tsx` fick i samma pass.

           HÅRLINJENS TON ÄR MÄTT, INTE VALD PÅ KÄNSLA (WCAG 2, sRGB, mot
           `--p-gold-100` #fbf3e0):
             `--mm-border` (neutral-200) ..... 1,17:1  ← husets vanliga
                                                        hårlinje SYNS INTE på
                                                        guld
             `--mm-primary-pale` (gold-300) .. 1,29:1  ← för svag
             `--mm-primary-muted` (gold-400) . 2,11:1  ← VALD, och det är
                                                        blockets egen kontur
             `--mm-primary` (gold-500) ....... 2,33:1  ← `contrast-more`
           Valet är alltså inte bara "en gyllene linje" utan EXAKT samma token
           konturen bär — vilket är vad Marcus bad om ordagrant, och samtidigt
           det enda värde i familjen som faktiskt läser på tinten.

           BEKRÄFTELSEPANELEN FÖLJDE MED UR NEUTRALFAMILJEN: den bar
           `border-border bg-bg-muted`, och `--mm-bg-muted` (#f5f5f3) mot
           tinten mäter 1,09:1 — en panel som praktiskt taget inte syns. Den
           bär nu transparent fond med `border-primary-muted`, alltså samma
           2,11:1 som hårlinjerna, och sin avgränsning i tonfamiljen. */
        /* INGEN `mx-4`: blocket ska ha SAMMA bredd som kortlistorna och
           menybaren (B1). Listorna når 568 px genom `-mx-4` ur en `px-4`-
           förälder; detta block hänger direkt i `<section>`, som redan ÄR den
           bredden — en marginal här hade gjort granskningen 32 px smalare än
           listan den granskar. */
        <section
          /* RUBRIKEN "Registrerat nu" ÄR RIVEN (Marcus: *"känns överflödig"*).
             Den var blockets tillgängliga namn OCH fokus-mål efter en ångrad
             rad, så båda rollerna flyttade hit i samma andetag: `aria-label`
             ger namnet, `tabIndex={-1}` gör noden fokuserbar programmatiskt.
             Utan dem hade rivningen tagit med sig en a11y-egenskap Marcus
             aldrig bad om att förlora — texten försvann ur SYNFÄLTET, inte ur
             tillgänglighetsträdet.

             `<section>` OCH INTE `<div role="group">`: den senare formen var
             första försöket och fälldes av `lint/a11y/useSemanticElements`,
             som föreslår `<fieldset>` — men detta är ingen formulärgrupp, så
             det förslaget är fel för ytan. En `<section>` MED tillgängligt namn
             är i stället en `region`-landmark, vilket är exakt vad blocket är:
             en namngiven del av betalningssidan. Samma form som
             `NastaEvent.tsx` bär (`<section aria-labelledby>`); här blir det
             `aria-label` eftersom det inte finns någon rubrik-nod att peka på. */
          ref={granskningsBlockRef}
          tabIndex={-1}
          aria-label="Registrerat nu"
          /* ═══ SYMMETRISK LUFT (Marcus 2026-09-01, pass 14) ═══
             Ordagrant: *"mer luft över första kortet … lika mycket luft ovan
             som det är under sista kortet"*.

             MÄTT VAD SOM VAR SNETT: blocket bar `p-3` och raderna sina egna
             `p-3`, så avståndet från blockets överkant till första radens TEXT
             var 12 + 12 = 24 px, medan avståndet från knappen till underkanten
             var 12 px. Två olika luftband i samma block.

             LÖSNINGEN BOR I BLOCKETS PADDING, INTE PER RAD (det senare hade
             gjort första och sista raden olika höga än de mellanliggande).
             `p-4` sätter bandet till 16 px, och listans `-my-2` drar tillbaka
             exakt radernas egen `py-2` vid ändarna — så mätpunkterna blir:
               överkant → första radens text .... 16 px
               sista radens text → knappen ...... 16 px  (blockets `gap-4`)
               knappen → underkant .............. 16 px
             Tre lika band. Radernas inbördes rytm är orörd.

             [TASK-362] TONEN ÄR NU VILLKORAD PÅ `blockAktivt`, INTE STATISK.
             Marcus 2026-09-02 (S113 resume 8-röktestet): *"jag gillade inte
             riktigt allt som händer UNDER utskicket, den gula rutan
             förändrades i höjd … det var liksom inte 'rent' eller
             'elegant'"* — och skärmen han visade hade EN skickad rad kvar i
             gult. Guld/varning är rätt ton MEDAN något pågår eller har
             fallerat; ett kvitto som gått i väg är historia, inte en
             varning, och blocket vilar då i SAMMA neutrala form
             `PersonDetail.tsx`s `kortKlass` redan bär för sitt "Just nu"-
             block (`border-transparent bg-bg-muted … contrast-more:
             border-border-strong`) — samma konvention, inte en ny. */
          className={
            blockAktivt
              ? 'flex flex-col gap-4 rounded-2xl border border-primary-muted bg-primary-tint p-4 contrast-more:border-primary'
              : 'flex flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong'
          }
        >
          <ul
            className={
              blockAktivt
                ? '-my-2 flex flex-col divide-y divide-primary-muted contrast-more:divide-primary'
                : '-my-2 flex flex-col divide-y divide-border'
            }
          >
            {registrerade.map((post) => {
              const lage = kvittolage(post, vantande, jobb.data?.rader ?? []);
              const angrarDenna = angraId === post.inbetalningId;
              return (
                <li key={post.inbetalningId} className="py-2">
                  {/* KÄRNRADEN — titel/sekundärled, belopp, åtgärd. EGEN NOD,
                      skild från panelerna nedan, och det är vad som gör Marcus
                      andra fynd lösbart: *"'Ångra'-knappen sitter inte
                      centrerat höjdmässigt på kortet"*.

                      `items-center` CENTRERAR MOT KÄRNRADEN, inte mot hela
                      `<li>`. Låg knappen kvar i samma flexrad som panelerna
                      hade en `items-center` dragit ned den till mitten av en
                      utfälld bekräftelse — alltså rätt i vila och fel i det
                      läge Lotta faktiskt tittar på. Skilda noder ger båda. */}
                  <div className="flex flex-nowrap items-center gap-3">
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="w-full truncate font-medium text-body">{post.namn}</span>
                      <span className="w-full text-caption text-text-muted">
                        {[post.betalsatt, lage.text].join(' · ')}
                      </span>

                      {/* VARFÖR ÅNGRA SAKNAS, i klartext. Ett kvitto som gått
                          i väg går inte att radera bort — då är makulering
                          vägen, och den bor på inbetalningsraderna. Att tiga
                          hade lämnat Lotta med en rad hon inte förstår varför
                          hon inte kan röra.

                          RADEN ÄR INFORMATION, INTE EN TRANSIENT PANEL, och
                          bor därför INUTI kärnradens textkolumn — till
                          skillnad från bekräftelsen och felrutan nedan. Det
                          är vad som gör att beloppet och åtgärdsknappen
                          centreras mot den också (Marcus 2026-09-01:
                          *"Priset och åtgärdsknappen … borde sitta centrerade
                          på raden, höjdmässigt"*). Samma gränsdragning som
                          `InbetalningsLista` gör mellan sina sekundärrader
                          och sina paneler.

                          [TASK-362] NODEN ÄR NU ALLTID MONTERAD — bara
                          SYNLIGHETEN växlar (`invisible`, inte ett villkorat
                          `&&`). En rad som går från "väntar" (en textrad) till
                          "skickat" (två textrader, den här läggs till) knuffade
                          annars VARJE efterföljande rad i loggen, OCH listan
                          under blocket, nedåt mitt under utskicket — exakt det
                          layouthopp Marcus flaggade 2026-09-02.

                          `min-h-9` (36 px = 2 × `text-caption`s egen
                          `line-height: 1.5` på `0.75rem`, `tailwind.css` rad
                          110–111), INTE en enradig nbsp-platshållare ensam
                          — mätt fynd: makuleringsvägens text ("Kvittot är på
                          väg eller skickat. Ångra genom att makulera …")
                          RADBRYTS till två rader i kortets faktiska bredd, så
                          en enradig platshållare reserverade FÖR LITE (mätt
                          skillnad 172 px mot 154 px, exakt en `text-caption`-
                          radhöjd, `tests/e2e/betalningar-inkorg-
                          utskicksflode.staging.test.ts` § "höjd är IDENTISK"
                          — rött innan `min-h-9` fanns, grönt efter). Två
                          rader är alltså reserverade oavsett om texten faktiskt
                          radbryter eller ej — `min-height` täcker båda
                          fallen, en fast nbsp-höjd bara det ena.
                          `aria-hidden` döljer platshållaren för skärmläsare
                          när den inte bär information — ingen ny information
                          tas bort, den flyttar bara till vila-läget osynlig
                          tills den behövs. */}
                      <span
                        className={
                          !lage.kanAngra && lage.angraSkal !== null
                            ? 'block min-h-9 w-full text-caption text-text-muted'
                            : 'invisible block min-h-9 w-full text-caption text-text-muted'
                        }
                        aria-hidden={lage.kanAngra || lage.angraSkal === null}
                      >
                        {lage.angraSkal ?? '\u00A0'}
                      </span>
                    </span>

                    {/* BELOPPSKOLUMNEN — samma sifferpelare som
                        `InbetalningsLista`. `tabular-nums` är vad som gör
                        högerkanten till en linje.

                        DEN KÄNDA KANTEN, BOKFÖRD: åtgärdsslotten till höger är
                        en TEXTKNAPP med varierande bredd ("Ångra" ≈ 60 px,
                        "Skicka igen" ≈ 90 px), inte inbetalningsradernas
                        ⋯-knapp med sin fasta 44 px. Beloppets högerkant kan
                        därför förskjutas mellan en rad med "Ångra" och en med
                        "Skicka igen". En fast slot-bredd hade krävt ett magiskt
                        px-tal utan förankring (⋯-slotten har sina 44 px ur
                        träffytegolvet); knappformen är dessutom ett bokfört val
                        sedan pass 11 (se knappen nedan). Kanten står här i
                        stället för att lappas — "Skicka igen" visas bara på en
                        FALLERAD rad, alltså sällan. */}
                    <span className="shrink-0 font-medium text-body tabular-nums">
                      {`${visaKronor(post.belopp)} kr`}
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      {/* [TASK-353] FÖRHANDSGRANSKA — bara på en rad vars kvitto
                          ännu INTE gått i väg, och bara när kön har FLERA rader
                          (se `vantandeIds`/`enSamKo` ovan för formvalet).
                          `kanForhandsgranska` äger regeln; JSX bedömer inte.

                          EGET TILLGÄNGLIGT NAMN PER RAD. Åtta knappar som alla
                          heter "Förhandsgranska" är åtta identiska namn i
                          skärmläsarens knapplista — `aria-label` namnger
                          personen, samma grepp som `InbetalningsLista`s
                          `Fler val för …`. Den SYNLIGA texten är kort, som
                          husets övriga radknappar.

                          `isLoading`/`loadingText` I STÄLLET FÖR handbyggd
                          `aria-disabled` + villkorad `Loader2` (TASK-361):
                          den gamla formen bytte ENDAST ikonen villkorat in/ut
                          ur `children` — samma bredd-hopp-bugg som fixades på
                          biblioteksnivå i `Button.tsx`, fast handbyggd HÄR
                          också. `Button`s `isLoading` löser BÅDA (stabil
                          bredd OCH stänger klick strukturellt under
                          `forhandsgranska.isPending` — den gamla
                          `aria-disabled`-formen var bara semantisk och
                          spärrade ALDRIG `onPress` på primitiv-nivå;
                          dubbelklicks-skyddet i `forhandsgranskaKvitto`
                          nedan är oförändrat, detta är ett EXTRA lager). */}
                      {!enSamKo && kanForhandsgranska(post, vantandeIds) && (
                        <Button
                          intent="secondary"
                          emphasis="outline"
                          size="sm"
                          isLoading={forhandsgranska.isPending}
                          loadingText="Förhandsgranskar …"
                          aria-label={`Förhandsgranska kvittot till ${post.namn}`}
                          onPress={() => forhandsgranskaKvitto(post.inbetalningId, post.namn)}
                        >
                          Förhandsgranska
                        </Button>
                      )}
                      {/* SKICKA IGEN, bara på en FALLERAD rad — samma regel och
                          samma mutation (`koaKvitton`, inte `skickaKvittoIgen`)
                          som jobbrads-listan nedan bär; se dess docblock för
                          varför. En rad som aldrig fallerat får ingen knapp.

                          EGET TILLGÄNGLIGT NAMN, samma skäl och samma mönster
                          som Förhandsgranska ovan (granskningsfynd runda 1,
                          PR #2193): blocket kan bära ett tjugotal rader, och
                          utan namnet blir varje knapp "Skicka igen" i
                          skärmläsarens knapplista — omöjliga att skilja åt,
                          och det är en DESTRUKTIV-intilliggande handling som
                          köar ett riktigt utskick. */}
                      {lage.fel && (
                        <Button
                          intent="secondary"
                          emphasis="outline"
                          size="sm"
                          isDisabled={koa.isPending}
                          aria-label={`Skicka kvittot till ${post.namn} igen`}
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
                      {/* EN ENKEL KNAPP, INTE EN ⋯-MENY — bokfört val (pass 11
                          bad om det ena eller det andra). Raden har som mest
                          EN åtgärd i detta läge, och pass 8:s egen lärdom om
                          menyavdelaren gäller i samma anda: en meny som bara
                          rymmer en post är ceremoni, inte struktur. Blir
                          åtgärderna fler hör de hemma i `Meny`, precis som på
                          inbetalningsraderna. */}
                      {lage.kanAngra && !angrarDenna && (
                        /* EGET TILLGÄNGLIGT NAMN — se Skicka igen ovan.
                           Formuleringen speglar bekräftelsepanelens egen text
                           ("Ångra registreringen? Inbetalningen raderas."), så
                           knappens namn och det som händer när man trycker
                           säger samma sak. */
                        <Button
                          intent="ghost"
                          size="sm"
                          aria-label={`Ångra registreringen för ${post.namn}`}
                          onPress={() => setAngraId(post.inbetalningId)}
                        >
                          Ångra
                        </Button>
                      )}
                    </span>
                  </div>

                  {/* PANELEN OCH SEKUNDÄRRADERNA LIGGER UNDER KÄRNRADEN, i
                      FULL BREDD — inte längre inuti textkolumnen.

                      DET ÄR SAMMA ÄNDRING SOM GÖR MARCUS ANDRA FYND LÖSBART
                      (se kärnradens kommentar ovan): så länge panelen låg i
                      samma flexrad som knappen kunde knappen inte centreras
                      mot radens tvåradiga kärna utan att glida ned i mitten av
                      en utfälld panel. Full bredd är dessutom rätt form för
                      innehållet: bekräftelsen och felmeddelandena hör till
                      HELA raden, inte till namnkolumnen.

                      "ÖPPNAS PÅ PLATS"-MÖNSTRET ÄR OFÖRÄNDRAT — samma inline-
                      form som `InbetalningsLista`s radera-bekräftelse och
                      `RegistreraForm`. Ingen modal för en engångsfråga. */}
                  {angrarDenna && (
                    /* INGEN KONTUR (Marcus 2026-09-01: *"Ta bort konturen som
                       blir runt 'Ångra registreringen'"*). Bekräftelsen låg i
                       en egen inramad ruta på guldytan — en tredje kant i ett
                       block som redan har sin egen kontur och sina hårlinjer.
                       Den ligger nu direkt på ytan som en rad i listrytmen:
                       frågan står i text och allvaret bärs av "Ja, ångra" i
                       röd fylld vikt, vilket är den signal en kant ändå bara
                       upprepade. */
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-caption">
                        Ångra registreringen? Inbetalningen raderas.
                      </span>
                      <Button
                        intent="danger"
                        size="sm"
                        isDisabled={radera.isPending}
                        isLoading={radera.isPending}
                        onPress={() => angraRegistrering(post)}
                      >
                        Ja, ångra
                      </Button>
                      <Button intent="ghost" size="sm" onPress={() => setAngraId(null)}>
                        Behåll
                      </Button>
                    </div>
                  )}

                  {radera.isError && angrarDenna && (
                    <span
                      role="alert"
                      className="text-(color:--mm-input-error-text) block text-caption"
                    >
                      {radera.error.message}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {/* [TASK-362] EN STATUSYTA, RESERVERAD HÖJD, FRÅN KÖAT TILL KLART.
              Marcus 2026-09-02 (S113 resume 8-röktestet): *"jag gillade inte
              riktigt allt som händer UNDER utskicket, den gula rutan
              förändrades i höjd, olika toastar etc, det var liksom inte
              'rent' eller 'elegant'"*.

              FÖRE denna ändring var knappraden och jobbUTFALLET två separata
              noder på två separata ställen: knappen levde HÄR (i blocket) och
              försvann i samma tick som `vantande` tömdes, medan utfallet levde
              i en EGEN `<div>` under HELA `<section>`, och monterades färskt
              när `utfall` first fick ett värde. Två monterings-/avmonterings-
              händelser i snabb följd, i olika delar av trädet — exakt
              mekaniken forskningspasset 2026-09-02
              (`docs/research/utskicksbekraftelse-inkorg-auto-dismiss-vs-persistent-2026-09-02.md`
              § 1) mätte som layouthoppets rotorsak, tillsammans med `utfall`
              som aldrig nollställdes.

              EFTER: EN slot, `min-h-10` (matchar knappens egen höjd —
              `Button.tsx` `size.md: 'min-h-10'`, husets default-storlek),
              som visar EXAKT en av tre saker i sekvens: knappen (köat) → en
              tyst statusrad (pågår/klart) → ingenting (dold, eller nästa
              handling gjorde den inaktuell). Ingen extra montering, ingen
              extra notis — bara EN nods innehåll som byter text.

              [REVIEW RUNDA 1, FYND 1 — bekraftelseSynlig gäller nu ENDAST
              `success`.] Kryss-regeln (S109-facit): en varning försvinner när
              ORSAKEN är borta, ALDRIG av en obesläktad handling. Den gamla
              koden nollställde EN delad flagga ovillkorligt i både
              `vidRegistrerad` och `skickaKvitton`, vilket hade dolt en genuin
              "N kvitton misslyckades"-varning bara för att Lotta registrerade
              en annan, orelaterad betalning. Nu: `bekraftelseSynlig` styr
              ENDAST success-radens synlighet (döljs av nästa handling ELLER
              manuellt kryss, återställs av ETT NYTT jobb). En `warning` (och
              en `info`, av samma princip — se nedan) har INGEN egen dölj-
              flagga alls: den finns kvar SÅ LÄNGE `utfall` beskriver den, och
              `utfall` byter bara innehåll när ETT NYTT jobb faktiskt startar
              (ny `jobbId` → `jobb.data` läses om). Det är alltså `utfall`
              SJÄLVT, inte en extra boolean, som bär "ersatt av nytt jobb"-
              semantiken FYND 1 efterfrågade — en andra flagga hade bara
              kunnat glida isär från den redan existerande sanningskällan.

              `info` (pågår/köat på servern) FICK SAMMA BEHANDLING SOM
              `warning`, INTE SOM `success` — en egen avvägning (uppdraget
              adresserade bara success/warning explicit). Skälet: ett
              AKTIVT pågående utskick är lika lite en "handlingslös
              bekräftelse man kan gå vidare från" som en varning är — att
              dölja "Skickar kvitton …" bara för att Lotta registrerar en
              annan betalning hade gömt information om ett jobb som
              fortfarande arbetar. Flaggad för samma grillning som resten av
              forskningspassets öppna frågor; se AMENDERING-sidofilen.

              [REVIEW RUNDA 1, FYND 4 — Notis.tsx-mönstret.] Den kompakta
              statusraden (`<p role="status">` nedan) är nu ALLTID MONTERAD
              så snart sändlivscykeln överhuvudtaget börjat (`utfall !==
              null`, oavsett `bekraftelseSynlig`) — bara INNEHÅLLET växlar
              mellan tomt och `utfall.rubrik`, exakt `Notis.tsx`s egna
              dokumenterade form ("Den yttre `role="status"`-regionen är
              ALLTID monterad — bara detta växlar", MDN: "Start with an
              empty live region, then – in a separate step – change the
              content inside the region"). FÖRE denna rättning avmonterades
              hela slotten (knapp OCH statusrad) så fort `bekraftelseSynlig`
              blev falsk — en avfärdad bekräftelse tog den RESERVERADE HÖJDEN
              med sig, vilket var en mindre, kvarstående instans av exakt det
              layouthopp huvudfixen finns för att förhindra. Det yttre
              villkoret nedan är därför `utfall !== null` (utan
              `bekraftelseSynlig`) — regionen finns kvar tom i vila, i
              stället för att försvinna.

              DEN VANLIGA VÄGEN (Lottas EGEN session, `ovrigaJobbrader` tom)
              håller sig alltså inom EN höjd hela vägen; en genuin varning
              (delvis/inget skickat) växer utöver den — medvetet, NN/g:s regel
              om att ett partiellt misslyckande INTE ska klämmas in i en
              kompakt rad (forskningspasset § 3). Den korsflik-sällsynta
              `ovrigaJobbrader > 0`-vägen behåller sin egen, oförändrade
              `MessageBox`+lista under `</section>`, se nedan.

              [REVIEW RUNDA 1, FYND 2 — golvet är RESPONSIVT, `min-h-22
              sm:min-h-10`.] Runda 1 mätte höjd-identiteten bara vid
              1280×720. Vid mobilbredd (375 px, under Tailwinds `sm`
              (640 px)) WRAPPAR knapparaden ("Skicka 1 kvitto" +
              "Förhandsgranska", TASK-353 — den senare erbjuds bara vid
              EXAKT en kö-rad, `enSamKo`) till TVÅ rader (mätt: slotten går
              från 40 px till 88 px), medan `klart`-läget (den kompakta
              statusraden) stannar på 40 px — en 48 px skillnad, mätt live
              med `getBoundingClientRect()` FÖRE denna rättning
              (`tests/e2e/betalningar-inkorg-utskicksflode.staging.test.ts`
              röd vid mobil-varianten). DET VAR ALLTSÅ INTE
              makuleringsväg-texten (`min-h-9` på raderna ovan) som
              radbröt till en tredje rad — den håller exakt sina två rader
              vid alla tre bredderna, mätt och skärmdumpat. `sm:min-h-10`
              (40 px, ≥640 px — täcker iPad 820 px och desktop) är golvet
              enknappsfallet redan höll; `min-h-22` (88 px, <640 px) är
              EXAKT den mätta tvåknapps-wrap-höjden, ingen marginal utöver
              det uppmätta. En `klart`-rad reserverar därmed 88 px även på
              mobil trots att den bara BEHÖVER 40 — samma avvägning som
              `min-h-10` alltid gjort (reservera för det TALLASTE av de
              tillstånd som delar slotten, inte bara det egna). */}
          {(vantande.length > 0 || (utfall !== null && ovrigaJobbrader.length === 0)) && (
            <div className="flex min-h-22 flex-col justify-center gap-2 sm:min-h-10">
              {vantande.length > 0 && (
                /* [TASK-353] KNAPPRADEN, inte längre en ensam knapp. `self-start`
                   flyttade från knappen till detta svep — knappen behåller exakt
                   sin vänsterlinje (svepet ovan är `flex flex-col`, så
                   `self-start` på raden ger samma horisontella läge som på
                   knappen), och "Förhandsgranska" hamnar bredvid den i stället
                   för under. `flex-wrap` gör att paret bryter snyggt på en smal
                   iPad-kolumn i stället för att trycka ihop knapparna under
                   träffytegolvet.

                   VÄNSTERSTÄLLD — OCH DET ÄR EN REVERSERING, INTE EN NY DESIGN.
                   Pass 13 flyttade knappen till HÖGER på Marcus egen beställning
                   samma dag (*"Jag tycker nog att 'skicka 1 kvitto'-knappen ska
                   sitta till höger och inte till vänster"*), med husets
                   dialog-mönster som stöd. Efter att ha sett den på skärmen rev
                   han beslutet i pass 14: *"skicka-knappen ska flyttas tillbaka
                   till vänster sidan"*. BÅDA DOMARNA STÅR KVAR I TEXTEN MED
                   AVSIKT — den senare gäller, men en historik som tyst skriver
                   om sin egen tidigare mening lämnar nästa läsare att "rätta
                   tillbaka" och göra om varvet.

                   [REVIEW RUNDA 1, FYND 1] `&&` I STÄLLET FÖR `? :` MOT
                   status-noderna nedan — INTE längre en TERNARY som
                   ömsesidigt uteslöt knapp och utfall. Mätt fynd (denna
                   PR, runda 2): en ternary hade DOLT en `warning` så fort
                   Lotta köade EN NY, obesläktad rad (`vantande.length`
                   blev > 0 igen) — exakt den regression FYND 1 varnade
                   för, fast orsakad av STRUKTUREN, inte av
                   `bekraftelseSynlig`. Knapp och `warning`/`info` kan nu
                   samexistera i slotten: båda är sanna samtidigt (ett
                   jobb fallerade ELLER pågår OCH en ny rad väntar), och
                   ska synas samtidigt. */
                <div className="flex flex-wrap items-center gap-2 self-start">
                  <Button intent="success" onPress={skickaKvitton} isLoading={koa.isPending}>
                    {`Skicka ${vantande.length} ${vantande.length === 1 ? 'kvitto' : 'kvitton'}`}
                  </Button>

                  {/* [TASK-353] BREDVID SKICKA-KNAPPEN — men BARA när kön har
                      exakt ETT kvitto (se `enSamKo` ovan för hela formvalet).
                      Ordningen är avsiktlig: Skicka först, Förhandsgranska efter.
                      Den primära handlingen behåller sin plats och sin
                      vänsterlinje; granskningen är ett steg man tar FÖRE, men den
                      får inte knuffa undan knappen Lotta trycker på varje lördag.

                      `intent="secondary" emphasis="outline"` är husets form för
                      just denna knapp (`GenereringsVy.tsx` rad ~1505) — sage-
                      knappen (`intent="success"`) är reserverad för det externa
                      utskicket och får inte färgmatchas av en granskningsknapp.

                      `isLoading`/`loadingText` I STÄLLET FÖR handbyggd
                      `aria-disabled` + villkorad `Loader2`/text-swap
                      (TASK-361, landad som #2212 medan denna PR var i
                      granskning — inmergad här, `git merge origin/main`):
                      den gamla formen ändrade BÅDE ikon OCH SYNLIG TEXT
                      utan att `aria-label` (fixerad per person) någonsin
                      ändrades, så bredden hoppade i klienten men
                      skärmläsaren fick ALDRIG någon annonsering av att
                      laddning pågick. Samma migrering som per-rad-knappen
                      ovan (~rad 1500) redan bär. */}
                  {ensamKandidat !== null && kanForhandsgranska(ensamKandidat, vantandeIds) && (
                    <Button
                      intent="secondary"
                      emphasis="outline"
                      isLoading={forhandsgranska.isPending}
                      loadingText="Förhandsgranskar …"
                      aria-label={`Förhandsgranska kvittot till ${vantande[0].namn}`}
                      onPress={() =>
                        forhandsgranskaKvitto(vantande[0].inbetalningId, vantande[0].namn)
                      }
                    >
                      Förhandsgranska
                    </Button>
                  )}
                </div>
              )}

              {/* WARNING — EGEN NOD, HELT OBEROENDE AV `vantande` (FYND 1,
                 skärpt runda 2 — se kommentaren ovan). `MessageBox`s
                 kryss-regel förbjuder ändå `onDismiss` här (S109-facit) —
                 konsekvent, ingen specialundantag skrivs in. NN/g:s regel
                 (forskningspasset § 3): ett DELVIS eller HELT misslyckat
                 utskick är inte en toast-kandidat, oavsett visuell form —
                 det kräver uppmärksamhet och stannar tills ETT NYTT JOBB
                 gör det inaktuellt. */}
              {utfall !== null && utfall.intent === 'warning' && ovrigaJobbrader.length === 0 && (
                <MessageBox intent="warning" title={utfall.rubrik}>
                  Utfallet per kvitto står på raderna ovan.
                </MessageBox>
              )}

              {/* [TASK-362/FYND 4] KOMPAKT STATUSRAD — ALLTID MONTERAD
                 (samma yttre villkor som blockets `<div>`, `utfall !==
                 null`), OBEROENDE av `vantande` (FYND 1, samma skäl som
                 warning-noden ovan: en `info` — "Skickar kvitton …" —
                 ska inte försvinna för att en NY, obesläktad rad köas).
                 Bara INNEHÅLLET växlar mellan tomt och `utfall.rubrik` —
                 samma "empty live region"-form `Notis.tsx` dokumenterar.

                 INTE `MessageBox` — samma avvägning `RegistreraYta.tsx`
                 redan gör för denna UNION (`intent !== 'warning'`): en
                 `MessageBox`s kant+fond-vikt är rätt för en varning som
                 kräver uppmärksamhet, fel för en lugn "klart"-bekräftelse
                 Lotta bara ska kunna se och gå vidare från. En vanlig rad
                 håller dessutom blockets höjd nära knappens (`min-h-10`
                 ovan) i stället för att hoppa till en 70+ px hög ruta för
                 det VANLIGASTE utfallet av alla (allt gick fram).

                 `role="status"` + `aria-live="polite"` — samma roll
                 `MessageBox` själv sätter för info/success (S109-facit),
                 aldrig `alert` här (ingen varning). TOM när: utfallet är
                 en varning (MessageBoxen ovan bär den redan), `success`
                 är avfärdad (`bekraftelseSynlig === false` — vilket också
                 är fallet SÅ FORT `vantande` blir icke-tom igen, eftersom
                 `vidRegistrerad`/`skickaKvitton` sätter den flaggan i
                 SAMMA andetag som de fyller kön), eller inget utfall
                 finns alls. Krysset syns ENDAST för `success`
                 (kryss-regeln): `pagar`/`vantar` är progress utan
                 handling att avfärda ännu. */}
              {utfall !== null && ovrigaJobbrader.length === 0 && (
                <p
                  role="status"
                  aria-live="polite"
                  data-testid="inkorg-sandstatus"
                  className="flex items-center justify-between gap-3 text-small text-text-muted"
                >
                  {(utfall.intent === 'info' ||
                    (utfall.intent === 'success' && bekraftelseSynlig)) && (
                    <>
                      <span>{utfall.rubrik}</span>
                      {utfall.intent === 'success' && (
                        <Button
                          intent="ghost"
                          size="sm"
                          aria-label="Stäng bekräftelse"
                          onPress={() => setBekraftelseSynlig(false)}
                          className="shrink-0"
                        >
                          <X aria-hidden="true" className="size-4" />
                        </Button>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>
          )}

          {/* FELET SÄGS PÅ SIDAN, inte i det fönster som stängdes. `role="alert"`
              därför att Lotta just tryckte och väntar på något som inte kom —
              samma form och samma klass som blockets övriga fel ovan. */}
          {forhandsgranska.isError && (
            <p role="alert" className="text-(color:--mm-input-error-text) text-caption">
              {`Kvittot kunde inte förhandsgranskas: ${forhandsgranska.error.message}`}
            </p>
          )}
        </section>
      )}

      {/* [TASK-362] DEN KORSFLIK-SÄLLSYNTA VÄGEN — ett jobb startat i en ANNAN
          flik/session, vars rader INTE finns i vår egen `registrerade`-logg
          (se `ovrigaJobbrader`s docblock ovan). Denna box är OFÖRÄNDRAD i sin
          form (fanns redan innan denna skiva). Den vanliga vägen
          (`ovrigaJobbrader.length === 0`) visas i stället i slotten OVAN,
          inuti granskningsblocket — se dess docblock.

          [REVIEW RUNDA 1, FYND 1] Ytterkonditionen bär INTE längre
          `bekraftelseSynlig` — samma rättning som slotten ovan: en
          `warning`/`info` här får inte döljas av en obesläktad handling,
          bara av att ETT NYTT jobb ersätter `utfall`. `bekraftelseSynlig`
          flyttade IN i `success`-grenen nedan, där den hör hemma. */}
      {utfall && ovrigaJobbrader.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* [TASK-362] TVÅ SEPARATA `MessageBox`-ANROP, INTE ETT MED
              VILLKORAD `onDismiss` — `MessageBox`s generiska typ (kryss-
              regeln, `MessageBox.tsx` rad 85–88) diskriminerar per ANROP,
              inte per fält: ett enda anrop med `intent={utfall.intent}`
              (en union) och en villkorad `onDismiss` kan inte typas korrekt
              (mätt, `npm run typecheck` — TS2322, `intent` föll till en
              INSKRÄNKT `"success"`-typ som `utfall.intent` inte är
              tilldelningsbar till). Två grenar med var sin LITERALA
              `intent` löser det utan att `as`-tvinga bort felet.

              `success`-grenen ENSAM läser `bekraftelseSynlig` (kryss +
              nästa-handling-dölj); `info`/`warning`-grenen har ingen
              dölj-flagga alls (FYND 1) — den finns kvar tills `utfall`
              själv byter innehåll. */}
          {utfall.intent === 'success' ? (
            bekraftelseSynlig && (
              <MessageBox
                intent="success"
                title={utfall.rubrik}
                onDismiss={() => setBekraftelseSynlig(false)}
              >
                {utfall.klass === 'allt-skickat'
                  ? 'Alla kvitton gick fram.'
                  : 'Raderna nedan visar utfallet per kvitto.'}
              </MessageBox>
            )
          ) : (
            <MessageBox intent={utfall.intent} title={utfall.rubrik}>
              {'Raderna nedan visar utfallet per kvitto.'}
            </MessageBox>
          )}
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
            <p className="text-small text-text-muted">
              Ingen kvarvarande betalning matchar sökningen.
            </p>
          )}
          {/* EN CONTAINER MED HÅRLINJER (designfynd 2a) — samma
              `divide-y`-kortform som `AnmalningarSida.tsx`s "Mer-lista", inte
              separata grå kort med gap mellan sig. Villkorad på längd: en tom
              `<ul>` hade annars ritat en tom rundad ruta under
              "Ingen kvarvarande betalning matchar sökningen." ovan. */}
          {/* `-mx-4`: samma bredd som menybaren, se FilterRad-anropet ovan.
              BEHÅLLAREN ÄR TONAD OCH RÄNNAN ÄR DESS PADDING (pass 11) —
              bilage-ytans `GRUPPKORT`-form (`DokumentYta.tsx`): korten bär den
              vita ytan, den grå behållaren syns mellan dem. MÄTT skäl: `body`
              bär `--mm-bg` = `--p-neutral-0`, alltså VITT, så vita kort på
              sidans egen botten hade varit osynliga — kortlistan kräver en
              tonad fond för att alls läsa som kort. */}
          {traffar.length > 0 && (
            <ul className="-mx-4 flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-2 contrast-more:border-border-strong">
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
              {/* TERMEN ÄR HUSETS KVAR-ATT-BETALA-SPRÅK (Marcus 2026-09-01:
                  *"jag vill byta ut rubriken till 'Utan kvarvarande betalning',
                  det går väl mer i linje med vårt nya språk?"*). Rubriken bar
                  den gamla "öppen"-jargongen som pass 3-svepet missade. */}
              <h2 className="font-semibold text-lg">Utan kvarvarande betalning</h2>
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
                <ul className="-mx-4 flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-2 contrast-more:border-border-strong">
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
    /* ═══ KORTLISTA, INTE RADLISTA (pass 11, Marcus dom 2026-09-01) ═══
       Ordagrant: *"ändra från radlista till kortlista … Då skulle HELA kortet
       kunna markeras när du trycker på 'registrera betalning'"*.

       VAD SOM REVS OCH VARFÖR DET VAR FEL FORM: listan var en `divide-y`-yta
       med hårlinjer mellan rader, och den öppna raden ritade ett EGET
       markerat kort inuti sig med `-mx-3`-utbrytning. Det gav precis den
       ruta-i-raden-effekt Marcus pekar på — en låda inuti en lista i stället
       för en lista AV lådor. Nu är kortet listans enhet: varje anmälan ÄR ett
       kort (bilage-kortens familj — vit yta, `rounded-2xl`, transparent kant
       som tänds i `contrast-more`), och `<ul>` är en genomskinlig behållare
       vars `gap-2` bara är rännan mellan korten. Event-grupprubrikerna står
       kvar ovanför sina kort, oförändrade.

       EXPANSIONEN MARKERAR HELA KORTET, som Marcus bad om: samma element byter
       yta och ram, ingen nästlad låda, ingen utbrytning, ingenting som hoppar i
       sidled. `overflow-hidden` behövs inte längre — det fanns för att hålla
       den rivna utbrytningen i schack.

       FÄRGERNA KOMMER UR EGNA TOKENS (fynd 2). Markeringen bar tidigare
       `--mm-success-bg`, samma token MessageBox success-ytan bär, så en grön
       notisruta inuti kortet blev osynlig. `--mm-betalningskort-markerad-*`
       (components.css) ger kortet en SVAGARE tint och låter ramen bära
       signalen; mätvärdena och kontrasterna står vid tokenet.

       `contrast-more` BOR I VARDERA GRENEN, aldrig i basklasserna: en
       ovillkorad `contrast-more:border-border-strong` hade vunnit över den
       gröna kanten och gett markerade kort en NEUTRAL kant i förhöjd kontrast
       — alltså hade precis de användare regeln finns för tappat
       markerings-signalen (`Deltagare.tsx` § review-fynd 6, samma fälla). */
    <li
      className={`rounded-2xl border p-3 ${
        oppen
          ? 'border-(--mm-betalningskort-markerad-border) bg-(--mm-betalningskort-markerad-bg) contrast-more:border-(--mm-betalningskort-markerad-border)'
          : 'border-transparent bg-surface contrast-more:border-border-strong'
      }`}
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
      {/* `py-3` BORTTAGEN (pass 11): kortets egen `p-3` bär nu rytmen. Låg den
          kvar blev det 12 px kortpadding PLUS 12 px radpadding i topp och
          botten på varje kort. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
              {saknas === null ? 'Pris saknas i basen' : `${visaKronor(saknas)} kr kvar att betala`}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {/* ═══ EN PILL-ANATOMI, TVÅ BETYDELSER (Marcus dom 2026-09-01) ═══
                  Marcus såg "Förfallen" och "Obekräftad" sida vid sida HÄR och
                  kallade dem inkonsekventa. De var det på två sätt samtidigt:
                    • olika ANATOMI — "Förfallen" var en handrullad span med
                      `rounded` (4 px) och kopparfärgad TEXT, "Obekräftad" en
                      `StatusBadge` med `rounded-full` och default-text;
                    • TVÅ VARNINGSSIGNALER på samma rad — klocka OCH
                      varningstriangel, i nästan samma kopparton.
                  Båda pillarna går nu genom `StatusBadge`, och regeln är MAX EN
                  VARNINGSSIGNAL PER RAD: "Förfallen" behåller warning/koppar
                  (en passerad deadline ÄR brådska), "Obekräftad" blir neutral
                  (den har ett eget bekräftelseflöde och är det normala läget
                  för en ny anmälan — inte samma allvar).
                  Se `StatusBadge.tsx` § TON_FORM för hela resonemanget. */}
              {rad.forfallen && (
                /* KLOCKAN BEHÅLLS via `ikon`-proppen: det är TIDEN som gått
                   fel, inte ett generellt larm. Tonen är kopparns och inte
                   guldets — `semantic.css` mappar warning till koppar, och den
                   är auktoriteten. Ikonens storlek sätts nu av skalsteget
                   (`sm` ⇒ 13), inte av anropet: samma 13 px som förut, men
                   omöjlig att sätta fel. */
                <StatusBadge ton="warning" storlek="sm" ikon={Clock}>
                  Förfallen
                </StatusBadge>
              )}
              {rad.obekraftad && (
                <StatusBadge ton="neutral" storlek="sm">
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
        <p role="status" className="pt-2 text-small text-text-muted">
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
    </li>
  );
}
