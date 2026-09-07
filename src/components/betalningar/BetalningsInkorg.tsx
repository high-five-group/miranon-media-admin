import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { AlertTriangle, CalendarRange, ChevronsUpDown, Clock, Upload, X } from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Checkbox,
  Disclosure,
  DisclosurePanel,
  Heading,
  SearchField,
} from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import {
  Button,
  InitialAvatar,
  Meny,
  MenyPost,
  MessageBox,
  Modal,
  SidRam,
  Skeleton,
} from '@/components/primitives';
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
import { useForhandsgranskaAllaKvitton, useForhandsgranskaKvitto } from '@/data/mutations/kvitton';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { filtreraPersonregister, personVisningsnamn } from '@/lib/person-sok';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
import { queryKeys } from '@/queries/keys';
import { visaKronor } from './belopp-inmatning';
import { type Betalsatt, lasSenasteBetalsatt, sparaBetalsatt } from './betalsatt-minne';
import { idagIso } from './idag';
import {
  type DurabelKvittoPost,
  type EventGrupp,
  grupperaPerEvent,
  harledKvittoAttSkicka,
  harledRad,
  type InkorgsRad,
  type IsoDatum,
  jobbDelutfall,
  rankaTraffar,
  sammanfattaBetalningar,
  tolkaTakfel,
} from './inkorg-harledningar';
import {
  allaSynligaMarkerade,
  arBetalningsfamiljen,
  lasMarkering,
  markeraAllaSynliga,
  rensaMarkering,
  saneraMarkering,
  sparaMarkering,
  vaxlaMarkering,
} from './markerings-minne';
import { RegistreraForm, type RegistreringsUtfall } from './RegistreraForm';
import { RegistreratNuBlock, type SessionsRad, type VantandeKvitto } from './RegistreratNuBlock';
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
 * Listan över väntande kvitton (`vantande`, granskningsblockets underlag)
 * byggs därför av de registreringar som gjorts I DENNA SESSION med
 * kryssrutan i, och nollställs när jobbet köats.
 *
 * DEN KÄNDA GRÄNSEN VAR, ÖPPET BOKFÖRD FRAM TILL TASK-367: stängs fliken
 * innan Lotta tryckt på knappen är `vantande` borta, och inbetalningarna
 * står kvar utan kvitto. TASK-367 (S115 Del 2, "kvitto att skicka bor i
 * flikens minne") gav `OppenBetalning` exakt det fält som efterlystes här —
 * `oskickadeKvitton` — och `KvittoAttSkickaBlock` (nedan i denna fil) är den
 * durabla motsvarigheten: en rad utan kvitto och utan jobbrad återuppstår
 * där oavsett flik, session eller enhet. `vantande`/granskningsblocket är
 * ÄNDÅ KVAR, oförändrat: den ger DENNA sessionens egna registreringar Ångra
 * och Förhandsgranska, som `oskickadeKvitton` inte bär data för (se
 * `KvittoAttSkickaBlock`s docblock). `kvittonAttSkicka` (utan "s" framför
 * "Attskicka" — pluralformen) är ett TREDJE, äldre tal och räknar något
 * ANNAT: rader som redan ligger i kön (`vantar`/`pagar`), alltså kvitton
 * Lotta redan tryckt på (namnet är plural, `oskickadeKvitton`s är det med).
 * De tre talen svarar på tre olika frågor och slås aldrig ihop.
 */

/* BETALSÄTTS-MINNET OCH `idagIso` FLYTTADE UT (TASK-346.7).
 *
 * Båda låg privat i denna fil så länge inkorgen var den enda ytan med
 * formuläret. TASK-346.7 ger samma formulär fyra ingångar till, och PRD
 * berättelse 6 lovar "det jag använde senast" - inte "senast på den här
 * sidan". De bor därför i `betalsatt-minne.ts` respektive `idag.ts`, som
 * båda bär motiveringen i sina egna docblock. Beteendet här är oförändrat:
 * samma localStorage-nyckel, samma standardvärde, samma lokala datum. */

/* [TASK-402.2] `VantandeKvitto`, `SessionsRad`, `Kvittolage` och
   `kvittolage()` FLYTTADE till `RegistreratNuBlock.tsx` (importerade
   ovan) — den delade komponenten äger nu blockets radmodell och
   kvittoläges-härledning; denna fil äger fortsatt mutationerna och
   skickar dem ner som props. Se den filens docblock för hela
   resonemanget och facit-kopplingen. */

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
 * [TASK-370.4] SENTINEL-nyckel för "Förhandsgranska alla"-knappens
 * laddläge/spärr i `forhandsgranskaPagar` — SAMMA `Set<string>` som
 * radernas `inbetalningId`, inte ett eget state. Kollisionsfritt PER
 * KONSTRUKTION: varje riktig `inbetalningId` är ett UUID
 * (`[0-9a-f]{8}-...`, se `preview-receipt/index.ts`s `UUID_RE`), och denna
 * sträng är strukturellt aldrig ett giltigt UUID. Att dela Setet i stället
 * för att lägga till ett andra boolean-state innebär att "alla"-knappen
 * automatiskt får SAMMA oberoende-semantik (S116 beslut 5) som raderna
 * redan har, utan ny kod: `forhandsgranskaKvitto`s per-nyckel-vakt och
 * `forhandsgranskaAlla`s nedan läser och skriver samma struktur, aldrig
 * varandras nycklar.
 */
const FORHANDSGRANSKA_ALLA_NYCKEL = '__alla__';

/* [TASK-402.2, formbyte 2] `ForhandsgranskaEtikett` (den DELADE synliga
   etiketten med `RaknarChip`-räknarchippet, TASK-393) ÄR RIVEN — Marcus fynd
   (S121, facit-noten): "Ta bort chipset helt", den synliga texten är alltid
   "Förhandsgranska" utan tal, och antalet bärs uteslutande av respektive
   knapps `aria-label`. De två call sites flyttade med till
   `RegistreratNuBlock.tsx` (`FORHANDSGRANSKA_TEXT`) i samma landning.
   `FORHANDSGRANSKA_ALLA_NYCKEL` ovan är OFÖRÄNDRAD — den är sentinel-nyckeln
   i `forhandsgranskaPagar`, inte UI-text, och ägs fortsatt av
   `forhandsgranskaAlla` nedan. */

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

/* ═══════════════════════════ MARKERA-LÄGET (TASK-402.1) ═══════════════════════════
 *
 * FORMEN ÄR EVENTDETALJENS, INTE EN NY (S121 Del 2 beslut 6, PRD § Markera-
 * läget i inkorgen): `Deltagare.tsx` § MARKERA/AVBRYT-KNAPPEN, § MARKERA-
 * LÄGETS TILLSTÅNDSMASKIN, § BATCH-BAREN och § MARKERBART kort är förlagan,
 * läst i sin helhet innan en rad skrevs här. Marcus mandat, ordagrant om
 * beslut 6: *"Din rek, A."*
 *
 * ═══ VARFÖR FORMEN ÄRVS MEN INTE KODEN ═══
 * `useMarkeringsLage` och `MarkeringsBatchBar` bor privat i `Deltagare.tsx`
 * och är BUNDNA till eventsidan på tre punkter som inte går att generalisera
 * bort utan att röra den promoverade eventytan (`ADR-103` B4:s ariaSnapshot-
 * grind): primärknappen navigerar till `/event/$eventId/atgarder` med ett
 * `eventId`, urvalet skickas i history-state, och `markeraAlla` ERSÄTTER
 * urvalet i stället för att utöka det. Inkorgen har inget event, skickar
 * urvalet i sök-parametern `ids`, och måste utöka (se `markeraAllaSynliga`s
 * docblock i `markerings-minne.ts`).
 *
 * En utbrytning till en delad primitiv hade alltså krävt att eventsidans
 * navigation, dess state-kanal och dess "alla"-semantik alla blev
 * konfigurerbara — tre parametrar för två konsumenter, och en ändring i den
 * promoverade eventytan i ett pass som äger inkorgen. Formen kopieras därför
 * MEDVETET, med förlagan namngiven vid varje bit, och AC #1:s DOM-jämförelse
 * är mekanismen som håller dem i synk. En TREDJE konsument gör utbrytningen
 * rätt — samma regel som filens egen `PERIOD_FILTER`-kopia redan bär.
 *
 * ═══ TVÅ AVSIKTLIGA AVSTEG FRÅN FÖRLAGAN, BÅDA UR KORTETS EGNA AC ═══
 *  1. ETIKETTEN är "Markera alla synliga", inte "Markera alla" (beslut 6):
 *     inkorgen har sök och filter, så "alla" vore tvetydigt.
 *  2. RÄKNAREN säger "N markerade", inte "N av M markerade" (AC #2): M vore
 *     antalet SYNLIGA kandidater, och när Lottas markerade rader är
 *     bortfiltrerade hade räknaren läst "3 av 0 markerade". AC #2 finns
 *     exakt för det fallet. Elementet, rollen, `aria-live`, `aria-atomic`,
 *     `sr-only` och placeringen i barens högerkant är förlagans, oförändrade.
 *
 * ═══ ETT AVSTEG I SEMANTIK, INTE I FORM ═══
 * Eventdetaljens `stang()` NOLLSTÄLLER urvalet. Inkorgens gör det inte:
 * PRD § Markera-läget räknar upp de tre tillfällen minnet rensas — "vid
 * registrering, Rensa och navigation utanför betalningsfamiljen" — och Esc är
 * inte ett av dem. Att lägga till ett fjärde hade brutit AC #4:s löfte om att
 * tillbaka-pilen återvänder med markeringen kvar. AC #1 mäter FORM i DOM;
 * detta är livslängd, som AC #5 äger.
 */

/**
 * MARKERA/AVBRYT-KNAPPEN — `Deltagare.tsx` § MARKERA/AVBRYT-KNAPPEN, samma
 * EMPHASIS-PAR (primary solid ⇄ primary subtle med kryss-glyf) och samma två
 * `aria-label`. Etiketterna namnger inkorgens objekt ("betalningar") i stället
 * för eventsidans ("anmälningar"): det tillgängliga namnet ska säga vad som
 * markeras, och det är inte samma sak på de två ytorna.
 */
function MarkeraKnapp({
  aktivt,
  onOppna,
  onStang,
  buttonRef,
}: {
  aktivt: boolean;
  onOppna: () => void;
  onStang: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return aktivt ? (
    <Button
      ref={buttonRef}
      intent="primary"
      emphasis="subtle"
      size="sm"
      aria-label="Avbryt markering"
      onPress={onStang}
    >
      <X aria-hidden="true" size={14} className="shrink-0" />
      Avbryt
    </Button>
  ) : (
    <Button
      ref={buttonRef}
      intent="primary"
      size="sm"
      aria-label="Markera betalningar"
      onPress={onOppna}
    >
      Markera
    </Button>
  );
}

/**
 * ÅTGÄRDSRADEN — `Deltagare.tsx` § BATCH-BAREN, form för form.
 *
 * GEOMETRIN ÄR KONSTANT ÖVER LÄGENA (förlagans TASK-145.3 AC #1): raden
 * renderas ALLTID med Markera-knappen i vänsterkanten, och `aktivt` styr bara
 * om de tre övriga kontrollerna VÄXER UT åt höger på samma rad. Monterades
 * hela raden först när läget slogs på skulle listan under hoppa nedåt — en
 * vertikal förskjutning där förlagan mätte fram en horisontell utvidgning.
 *
 * VIKTKLASSERNA ÄR FÖRLAGANS (DESIGN-SYSTEM-SPEC §19): primärhandlingen solid
 * `primary`, "Markera alla synliga" neutral `secondary`, "Rensa" lågviktad
 * `ghost` som dyker upp först när det finns något att rensa.
 *
 * `data-testid` DELAS MEDVETET med förlagan (`markering-batchbar`,
 * `markering-live`). De två ytorna kan aldrig renderas samtidigt, så en krock
 * är omöjlig, och AC #1:s DOM-jämförelse blir en fråga om samma nyckel på två
 * sidor i stället för två namn som ska hållas i synk för hand.
 */
function MarkeringsAtgardsRad({
  antal,
  allaSynligaValda,
  onRegistrera,
  onMarkeraAllaSynliga,
  onRensa,
  markeraKnapp,
  aktivt,
}: {
  antal: number;
  allaSynligaValda: boolean;
  onRegistrera: () => void;
  onMarkeraAllaSynliga: () => void;
  onRensa: () => void;
  /** Markera/Avbryt-knappen, förankrad i radens vänsterkant. Renderas i BÅDA
      lägena — se § GEOMETRIN ovan. */
  markeraKnapp: React.ReactNode;
  /** Markera-läget på/av. `false` ⇒ enbart `markeraKnapp` syns. */
  aktivt: boolean;
}) {
  return (
    <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2">
      {markeraKnapp}
      {aktivt && (
        <Button intent="primary" size="sm" isDisabled={antal === 0} onPress={onRegistrera}>
          {`Registrera ${antal}`}
        </Button>
      )}
      {aktivt && (
        <Button
          intent="secondary"
          size="sm"
          isDisabled={allaSynligaValda}
          onPress={onMarkeraAllaSynliga}
        >
          Markera alla synliga
        </Button>
      )}
      {aktivt && antal > 0 && (
        <Button intent="ghost" size="sm" onPress={onRensa}>
          Rensa
        </Button>
      )}
      {/* RÄKNAREN (AC #2). Seende läser talet i primärknappens egen etikett
          ("Registrera 3"), skärmläsaren får det här — samma arbetsfördelning
          som förlagan, där knappen heter "Åtgärder" och räknaren därför är den
          enda bäraren. `polite`: urvalet är löpande arbete, aldrig ett avbrott
          värt assertive. Villkorad på `aktivt` av förlagans skäl: en
          `role="status"` som står och säger "0 markerade" när ingen markerar är
          brus i skärmläsaren.

          TALET ÄR HELA URVALET, aldrig urvalet-inom-vyn — det är precis det AC
          #2 mäter: filtrerar Lotta bort sina markerade rader ska räknaren
          fortfarande säga tre. */}
      {aktivt && (
        <span
          data-testid="markering-live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {`${antal} markerade`}
        </span>
      )}
    </div>
  );
}

/**
 * [TASK-367] "KVITTO ATT SKICKA" — DEN DURABLA SEKTIONEN, sedan Postgres,
 * inte flikens minne.
 *
 * Fyndet (S115 Del 2): Marcus registrerade en inbetalning, bytte flik, och
 * raden försvann ur inkorgen — betalningen täckte hela priset (raden faller
 * ur EF:ens `Saknas (kr) > 0`-filter) OCH "väntar på kvitto" levde bara i
 * `vantande` (React-state, riven med fliken). Denna sektion läser i stället
 * `rad.betalning.oskickadeKvitton`, som EF:en härleder VARJE hämtning: en
 * aktiv inbetalning utan `kvitto_id` och utan jobbrad i `vantar`/`pagar`
 * (`hamta-oppna-betalningar/index.ts` § "KVITTO ATT SKICKA").
 *
 * OBEROENDE AV `RegistreratNuBlock`, MEDVETET — de två blocken svarar på
 * OLIKA frågor. `RegistreratNuBlock` visar DENNA sessionens egna
 * registreringar (Ångra, Förhandsgranska per rad, sessionens logg) och det
 * kräver client-state `RegistreratNuBlock` äger ensam (`betalsatt`,
 * `medKvitto`, `radNyckel` finns bara där — se `RegistreratNuBlock.tsx`s
 * `SessionsRad`). Denna sektion visar ALLT som globalt återstår, oavsett
 * VILKEN flik, session eller yta som registrerade det: Åtgärds-panelen,
 * anmälans detaljvy och personkortet delar samma formulär och skriver till
 * samma Postgres-tabell (`BetalningsInkorg.tsx`s anropare filtrerar bort
 * dubbletter med `doljIds`, se `harledKvittoAttSkicka`s docblock).
 *
 * MEDVETET SMALARE ÄN `RegistreratNuBlock`: ingen Ångra, ingen
 * Förhandsgranska — bara listan och EN "Skicka N kvitton"-knapp. Att
 * återuppfinna hela den andra komponentens funktionalitet här hade krävt
 * data denna sektion inte har (betalsätt, om kvittorutan var i vid
 * registreringen) och touchat `RegistreratNuBlock.tsx`, som `Bekraftelsesteget.tsx`
 * (en annan skivas kollisionsyta i denna omgång, se PR-kroppen) delar.
 */
function KvittoAttSkickaBlock({
  poster,
  pending,
  onSkicka,
}: {
  poster: readonly DurabelKvittoPost[];
  pending: boolean;
  onSkicka: () => void;
}) {
  const rubrikId = useId();
  if (poster.length === 0) return null;
  const flertal = poster.length === 1 ? 'kvitto' : 'kvitton';

  return (
    <section
      aria-labelledby={rubrikId}
      // `data-testid`, INTE `aria-label`: sedan FYND 3 (review runda 1) är
      // `<h2>`:n den ENDA namnkällan (`aria-labelledby` ovan). Testkroken
      // ger sviterna ett stabilt CSS-mål (AxeBuilder `.include()` tar bara
      // CSS-selektorer, ingen roll/namn-matchning) utan att återinföra den
      // dubblering FYND 3 tog bort — samma mönster som `data-testid=
      // "markering-batchbar"`/`"inkorg-sandstatus"` redan bär i denna fil.
      data-testid="kvitto-att-skicka"
      className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
    >
      <div className="flex items-center justify-between gap-3">
        {/* [TASK-367 review runda 1, FYND 3] EN NAMNKÄLLA, INTE TVÅ.
            `RegistreratNuBlock` rev sin rubrik helt (Marcus: "känns
            överflödig") och bär bara `aria-label` — ingen visuell
            dubblering finns där att undvika. HÄR finns motsatt skäl att
            BEHÅLLA rubriken synlig: sektionen ska vara en skanningsbar,
            igenkännbar rubrik på sidan (till skillnad från
            `RegistreratNuBlock`, som är kontextuell till det Lotta just
            gjorde) — men den fick tidigare namnge sektionen TVÅ gånger
            samtidigt (`aria-label` OCH den synliga `<h2>`:n, ord för ord
            identiska). `aria-labelledby` gör `<h2>`:n till den ENDA
            namnkällan: samma text läses upp en gång, inte två. */}
        <h2 id={rubrikId} className="font-semibold text-body">
          Kvitto att skicka
        </h2>
        {/* Räknaren annonseras, seende läser den i knappens egen etikett
            nedan — samma arbetsfördelning som markerings-radens räknare
            (`MarkeringsAtgardsRad`). */}
        <span className="sr-only" role="status" aria-live="polite">
          {`${poster.length} ${flertal} väntar sedan tidigare.`}
        </span>
      </div>
      <ul className="-my-1.5 flex flex-col divide-y divide-border">
        {poster.map((post) => (
          <li key={post.inbetalningId} className="flex items-center justify-between gap-3 py-1.5">
            <span className="min-w-0 flex-1 truncate font-medium text-body">{post.namn}</span>
            <span className="shrink-0 font-medium text-body tabular-nums">
              {`${visaKronor(post.belopp)} kr`}
            </span>
          </li>
        ))}
      </ul>
      <Button intent="success" className="self-start" isLoading={pending} onPress={onSkicka}>
        {`Skicka ${poster.length} ${flertal}`}
      </Button>
    </section>
  );
}

/**
 * MARKERA-LÄGETS TILLSTÅNDSMASKIN — `Deltagare.tsx` § MARKERA-LÄGETS
 * TILLSTÅNDSMASKIN, med minnet inkopplat.
 *
 * ═══ URVALET STARTAR UR MINNET, OCH DET ÄR HELA POÄNGEN ═══
 * AC #4: tillbaka-pilen från bekräftelsesteget ska återvända till inkorgen
 * "med markeringen kvar". Steget är en EGEN route (un-nestad med avsikt), så
 * inkorgen unmountas vid hoppet och monteras om vid returen. Både urvalet OCH
 * lägets på/av-tillstånd läses därför ur `markerings-minne.ts` vid mount: ett
 * icke-tomt minne betyder att Lotta står mitt i en markering, och då ska hon
 * mötas av sina kryss, inte av en knapp som säger "Markera".
 *
 * ═══ SANERINGEN KÖRS ALDRIG FÖRE HÄMTNINGEN ═══
 * Förlagan sanerar mot kandidatmängden vid varje ändring och NOLLSTÄLLER när
 * mängden är tom. Här vore det fel: mellan mount och EF-svaret är
 * `markerbaraIds` tom därför att svaret inte kommit än, inte därför att det
 * inte finns något att markera — en sanering i det fönstret hade raderat
 * precis det urval `ids`-hoppet just bar tillbaka. `harData` skiljer "inga
 * öppna betalningar" från "vet inte än", och saneringen väntar på det.
 *
 * ═══ MÄNGDEN ÄR ALLA MARKERBARA, ALDRIG DE SYNLIGA ═══
 * AC #2: markeringen bevaras över sök och filter. Saneras urvalet mot vyn
 * försvinner precis de rader Lotta plockat från ett annat event i samma stund
 * hon filtrerar om.
 */
function useInkorgsMarkering(markerbaraIds: readonly string[], harData: boolean) {
  const [aktivt, setAktivt] = useState(() => lasMarkering().length > 0);
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set(lasMarkering()));

  /* Nyckel-strängen och inte arrayen som beroende: `markerbaraIds` är en ny
     array vid varje render (den härleds med `map`), och effekten ska köra på
     INNEHÅLLET. Samma idiom, samma skäl, som förlagans `kandidatNyckel`. */
  const markerbarNyckel = markerbaraIds.join('|');
  useEffect(() => {
    if (!harData) return;
    const kvar = markerbarNyckel === '' ? [] : markerbarNyckel.split('|');
    setValda((nu) => {
      if (nu.size === 0) return nu;
      const sanerat = saneraMarkering(nu, kvar);
      // Samma identitets-vakt som förlagan: utan den hade varje render skapat
      // ett nytt `Set` och loopat.
      return sanerat.length === nu.size ? nu : new Set(sanerat);
    });
  }, [harData, markerbarNyckel]);

  // Minnet speglar urvalet, alltid. En egen effekt och inte ett anrop inuti
  // varje handlare: då finns exakt EN skrivväg, och ett urval som ändras av
  // saneringen ovan glöms aldrig bort.
  useEffect(() => {
    sparaMarkering(valda);
  }, [valda]);

  const stang = useCallback(() => setAktivt(false), []);

  /* Esc lämnar läget (förlagans byggkrav 7). Dokument-nivå: läget äger hela
     listan, och fokus kan stå på vilket kort som helst när Lotta vill backa
     ur. `defaultPrevented`-vakten är inkorgens egen: här kan en `Modal` vara
     öppen samtidigt (Ångra-dialogen i granskningsblocket), och Esc tillhör då
     dialogen. URVALET RÖRS INTE — se § ETT AVSTEG I SEMANTIK ovan. */
  useEffect(() => {
    if (!aktivt) return;
    const vidTangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) stang();
    };
    document.addEventListener('keydown', vidTangent);
    return () => document.removeEventListener('keydown', vidTangent);
  }, [aktivt, stang]);

  return {
    aktivt,
    valda,
    antal: valda.size,
    oppna: useCallback(() => setAktivt(true), []),
    stang,
    vaxla: useCallback(
      (id: string, vald: boolean) => setValda((nu) => vaxlaMarkering(nu, id, vald)),
      [],
    ),
    markeraAllaSynliga: useCallback(
      (synligaIds: readonly string[]) => setValda((nu) => markeraAllaSynliga(nu, synligaIds)),
      [],
    ),
    /** Rensa-knappen — ett av PRD:ns tre rensningstillfällen (AC #5). Minnet
        följer med via spegel-effekten ovan; `rensaMarkering()` här är
        bältet-och-hängslen för det fall lagringen råkar bära en post
        effekten inte hunnit skriva över. */
    rensa: useCallback(() => {
      setValda(new Set());
      rensaMarkering();
    }, []),
  };
}

export function BetalningsInkorg() {
  const dataSource = useDataSource();
  const [sokterm, setSokterm] = useState('');
  const [oppenRad, setOppenRad] = useState<string | null>(null);
  const [kvittenser, setKvittenser] = useState<Record<string, string>>({});
  const [vantande, setVantande] = useState<VantandeKvitto[]>([]);
  /** Granskningsblockets logg — se `SessionsRad` för varför den inte är kön. */
  const [registrerade, setRegistrerade] = useState<SessionsRad[]>([]);
  /**
   * [TASK-402.2] Senaste Ångra-felet — samma "delad mutation, senaste vinner"
   * form som `forhandsgranskaFel` nedan bär, och av samma skäl: bara EN
   * `AngraKnapp`-dialog kan praktiskt vara öppen och under interaktion åt
   * gången (`Modal` fångar fokus och blockerar resten av sidan), så en delad
   * felsträng räcker. Nollställs vid varje dialogöppning
   * (`RegistreratNuBlock`s `onAngraDialogOppen`), inte bara vid nytt försök —
   * annars kunde rad B:s dialog hinna visa rad A:s gamla fel innan B faktiskt
   * försökt. Ersätter den tidigare `angraId`-baserade inline-bekräftelsen
   * (riven, se `RegistreratNuBlock.tsx`s docblock § formbyte 3).
   */
  const [angraFel, setAngraFel] = useState<string | null>(null);
  /**
   * [TASK-369] PER-INBETALNING förhandsgransknings-status — se hela
   * resonemanget i `forhandsgranskaKvitto`s docblock. `forhandsgranska`s
   * EGEN `isPending`/`isError` (nedan) bär bara den SENAST STARTADE
   * mutationens läge och kan därför aldrig svara på "väntar DEN HÄR raden?".
   */
  const [forhandsgranskaPagar, setForhandsgranskaPagar] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  /**
   * Senaste förhandsgransknings-felet — DELAD av rad-flödet OCH
   * "alla"-flödet (TASK-370.4), av samma "senaste vinner, ingen kö"-skäl
   * `forhandsgranskaKvitto`s docblock redan ger: bara ETT fel behöver synas
   * åt gången, och ett NYTT försök (rad ELLER alla) gör ett gammalt
   * inaktuellt oavsett vilket flöde som orsakade det.
   *
   * `namn: string | null` — `null` för "alla"-flödet: EF:ens allt-eller-
   * inget-fel NAMNGER redan personen INUTI `message` (`preview-receipt/
   * index.ts`s `vem`-variabel, "NAMN (kvitto I av N)"), så ett andra,
   * klientbyggt "Kvittot till X …"-prefix hade sagt namnet två gånger eller
   * — värre — sagt fel namn om EF:en inte kunde slå upp det (fallback-grenen
   * "kvitto I av N (inbetalning ID)"). Se render-stället nedan för de två
   * textformerna.
   */
  const [forhandsgranskaFel, setForhandsgranskaFel] = useState<{
    namn: string | null;
    message: string;
  } | null>(null);
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
  // [TASK-412, femte varvet] Namn-spannets id — samma `aria-labelledby`-
  // mönster som `EventValjare.tsx`s rubrik-form (`namnId`): triggerns
  // tillgängliga namn kommer från SPANNET, inte från en separat etikett.
  const betalningarRubrikId = useId();
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
  /** [TASK-370.4] "Förhandsgranska alla" — EGEN mutation, se `kvitton.ts`s
   *  `useForhandsgranskaAllaKvitton`-docblock för varför den inte delar
   *  instans med `forhandsgranska` ovan. Namngiven MED "Mutation"-suffix,
   *  till skillnad från `forhandsgranska`, eftersom `forhandsgranskaAlla`
   *  (utan suffix) är HANDLARFUNKTIONEN nedan — samma par-namngivning som
   *  `forhandsgranska`/`forhandsgranskaKvitto` redan etablerar. */
  const forhandsgranskaAllaMutation = useForhandsgranskaAllaKvitton();

  const rader = useMemo(
    () => (oppna?.betalningar ?? []).map((b) => harledRad(b, idag)),
    [oppna, idag],
  );

  /**
   * [TASK-367] DEN DURABLA "KVITTO ATT SKICKA"-LISTAN — se
   * `KvittoAttSkickaBlock`s och `harledKvittoAttSkicka`s docblock för hela
   * resonemanget. `registreradeIds` utesluter DENNA sessionens egna,
   * redan-synliga registreringar (`RegistreratNuBlock` visar dem) — allt
   * annat härleds ur `rader`, alltså ur EF:ens Postgres-svar, och överlever
   * därför omladdning, flikbyte och byte av enhet.
   *
   * MÅSTE STÅ FÖRE `isPending`/`isError`-returerna NEDAN (Regler för
   * hookar — `useMemo` fick tidigare stå efter dem och föll
   * `lint/correctness/useHookAtTopLevel`, mätt av `npx @biomejs/biome check`).
   */
  const registreradeIds = useMemo(
    () => new Set(registrerade.map((post) => post.inbetalningId)),
    [registrerade],
  );
  const kvittoAttSkickaPoster = useMemo(
    () => harledKvittoAttSkicka(rader, registreradeIds),
    [rader, registreradeIds],
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

  /* ═══════════════════ MARKERA-LÄGETS TVÅ MÄNGDER (TASK-402.1) ═══════════════════
   *
   * DE ÄR OLIKA, OCH SKILLNADEN ÄR HELA AC #2. `markerbara` är varje rad som
   * ÖVERHUVUDTAGET får ligga i urvalet — hela datamängden, ofiltrerad, utan de
   * klara raderna (AC #3: "klara rader saknar kryss och kan inte markeras").
   * Den mängden bär saneringen, så en markerad rad överlever att Lotta byter
   * filter eller söker. `synligaMarkerbara` är de markerbara raderna i den
   * mängd som faktiskt renderas just nu, och den bär ENBART "Markera alla
   * synliga" och dess `isDisabled`.
   *
   * SÖKLÄGET MÅSTE FILTRERA SJÄLVT. `rankaTraffar` returnerar BÅDE öppna och
   * klara rader (klara sist, se dess egen sorteringsnyckel) och renderar dem
   * alla som kort — till skillnad från gruppvyn, där `grupperaPerEvent` redan
   * delat upp dem i `oppna`/`klara`. Utan `!rad.klar` här hade en fullbetald
   * rad fått ett kryss så fort Lotta sökte fram den. */
  const markerbaraIds = useMemo(
    () => rader.filter((rad) => !rad.klar).map((rad) => rad.nyckel),
    [rader],
  );
  const synligaMarkerbara = useMemo(
    () =>
      soker
        ? traffar.filter((rad) => !rad.klar)
        : [...vy.kommande, ...vy.tidigare].flatMap((g) => g.oppna),
    [soker, traffar, vy],
  );
  const synligaMarkerbaraIds = useMemo(
    () => synligaMarkerbara.map((rad) => rad.nyckel),
    [synligaMarkerbara],
  );

  /* `oppna !== undefined` OCH INTE `rader.length > 0`: skillnaden är precis
     den `useInkorgsMarkering` § SANERINGEN beskriver — svaret har kommit och
     var tomt, kontra svaret har inte kommit än. */
  const markering = useInkorgsMarkering(markerbaraIds, oppna !== undefined);

  /* Fokus-retur när läget stängs (förlagans § "alla vägar ut"): knappen Lotta
     tryckte på ersattes av sin motsats i DOM:en, så utan detta faller fokus
     till `document.body` och en skärmläsaranvändare tappar sin plats. */
  const markeraKnappRef = useRef<HTMLButtonElement>(null);
  const varMarkeraLageAktivt = useRef(markering.aktivt);
  useEffect(() => {
    if (varMarkeraLageAktivt.current && !markering.aktivt) markeraKnappRef.current?.focus();
    varMarkeraLageAktivt.current = markering.aktivt;
  }, [markering.aktivt]);

  /* ═══ NAVIGATION UTANFÖR BETALNINGSFAMILJEN RENSAR MINNET (AC #5) ═══
   *
   * Tredje och sista rensningstillfället. Vakten sitter i inkorgens UNMOUNT
   * och läser sökvägen DÄR, eftersom det är den enda punkt som vet både att
   * Lotta lämnat inkorgen och vart hon tog vägen: TanStack Router har redan
   * skrivit `history` när React committar unmounten, så `window.location.
   * pathname` är MÅLET, inte ursprunget. Går hon till bekräftelsesteget
   * (`/mer/betalningar/registrera`, samma familj) rensas ingenting — det är
   * hela AC #4.
   *
   * TOM BEROENDELISTA MED AVSIKT: cleanup ska köra vid faktisk unmount, inte
   * vid varje ändring. I StrictMode körs den dessutom en gång i onödan direkt
   * efter mount, och då är sökvägen fortfarande inkorgens — vakten gör då
   * ingenting, vilket är rätt.
   *
   * BEVISAS I STAGING-E2E, inte antaget (AC #5): timing-antagandet om
   * `history` kontra Reacts commit är en egenskap hos routern, och en sådan
   * ska mätas i en riktig webbläsare. Se
   * `tests/e2e/betalningar-inkorg-markera-lage.staging.test.ts`. */
  useEffect(() => {
    return () => {
      if (!arBetalningsfamiljen(window.location.pathname)) rensaMarkering();
    };
  }, []);

  /* "Registrera N" — den enda utgången ur läget mot en handling.
     ORDNINGEN ÄR RADERNAS, inte urvalets insättningsordning: `ids` blir
     deterministisk oavsett i vilken ordning Lotta bockade. Steget sorterar
     ändå om efter hämtningen (`Bekraftelsesteget.tsx` § ORDNINGEN ÄR
     HÄMTNINGENS), så detta är för läsbarheten i URL:en och för testbarheten,
     inte för renderingen. */
  const navigate = useNavigate();
  const registreraMarkerade = () => {
    const ids = rader.filter((rad) => markering.valda.has(rad.nyckel)).map((rad) => rad.nyckel);
    if (ids.length === 0) return;
    void navigate({ to: '/mer/betalningar/registrera', search: { ids: ids.join(',') } });
  };

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
   * [TASK-402.4] `vidImporterade` ÄR RIVEN, och det är en följd av
   * överlämningen, inte en egen ändring.
   *
   * Funktionen lyfte importens registrerade rader in i inkorgens
   * väntande-lista och granskningsblock (`TASK-346.10` AC #4), eftersom
   * importen registrerade i sin egen bekräftelselista här inne. Den listan är
   * riven (`SwishImport.tsx` § VAD SOM RÖRDES): importen registrerar
   * ingenting längre — den lämnar över raderna till bekräftelsesteget, som
   * registrerar dem och visar dem i SITT "Registrerat nu"-block.
   *
   * Kvar i inkorgen är därför bara att öppna och stänga panelen. Fokus går
   * till importknappen när ytan stängs; den nod fokus stod på rivs annars ur
   * DOM och fokus faller till `document.body` (samma felklass som radens
   * `skaAterfaFokus` bär).
   */
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
   * ORDNINGEN ÄR SERVERN FÖRST. Städningen sker EFTER lyckad `mutateAsync`,
   * aldrig optimistiskt: fallerar raderingen ska raden stå kvar exakt som
   * den var, och felet synas i dialogen (`angraFel`, se `RegistreratNuBlock`).
   *
   * FOKUS EFTER BORTTAGNING går till blockets rubrik (`tabIndex={-1}`), som är
   * den enda nod som säkert finns kvar när raden fokus stod på rivs ur DOM.
   * Utan det faller fokus till `document.body` — samma felklass som radens
   * `skaAterfaFokus` och `stangImport` redan vaktar.
   *
   * [TASK-402.2] `mutateAsync` I STÄLLET FÖR `.mutate(..., { onSuccess })` —
   * `RegistreratNuBlock`s `AngraKnapp` kastar dialogen kvar öppen tills detta
   * anrop antingen löser (och den själv kallar `close()`) eller kastar (och
   * felet visas i dialogens kropp). Samma anropsform som
   * `forhandsgranskaKvitto`/`forhandsgranskaAlla` redan bär, av samma skäl:
   * anroparen behöver invänta UTFALLET, inte bara starta ett jobb.
   */
  const radera = useRaderaInbetalning();

  async function angraRegistrering(post: SessionsRad): Promise<void> {
    try {
      /* `radNyckel` ÄR anmälans record-ID (`rad.nyckel`), och den skickas med
         så att mutationen kan skriva serverns omräkning rakt in i cachen —
         personens kort återuppstår i listan i samma tick som
         granskningsraden försvinner. Den är `undefined` för rader som kom in
         via SwishImport; då hoppas patchen över och invalideringen sköter
         jobbet som förut. */
      await radera.mutateAsync({
        inbetalningId: post.inbetalningId,
        anmalanRecordId: post.radNyckel,
      });
    } catch (fel) {
      setAngraFel(fel instanceof Error ? fel.message : 'Okänt fel');
      throw fel;
    }
    setVantande((tidigare) => tidigare.filter((v) => v.inbetalningId !== post.inbetalningId));
    setRegistrerade((tidigare) => tidigare.filter((p) => p.inbetalningId !== post.inbetalningId));
    if (post.radNyckel !== undefined) {
      setKvittenser((tidigare) => {
        const { [post.radNyckel as string]: _borttagen, ...kvar } = tidigare;
        return kvar;
      });
    }
    granskningsBlockRef.current?.focus();
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
   * [TASK-402.2] "Skicka igen" på EN fallerad, redan registrerad rad —
   * utbruten ur `RegistreratNuBlock`s JSX (som nu bara känner till
   * `onSkickaIgen`, inte `koa`/`setJobbId` direkt) till en namngiven
   * funktion här, av samma lager-skäl som `angraRegistrering`. SAMMA mutation
   * (`koaKvitton`, inte en dedikerad "skicka igen"-EF) som jobbrads-listan
   * längre ner i filen bär.
   */
  function skickaIgen(inbetalningId: string) {
    koa.mutate(
      { inbetalningIds: [inbetalningId] },
      { onSuccess: (svar) => setJobbId(svar.jobbId ?? jobbId) },
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
   *
   * ═══════════════════════════════════════════════════════════════════════
   * [TASK-369] DEN DELADE `forhandsgranska.isPending`-VAKTEN ÄR RIVEN — OCH
   * DEN VAR INTE BARA EN VISUELL BUGG
   * ═══════════════════════════════════════════════════════════════════════
   * Marcus prod (S116 start): tryckte Förhandsgranska på EN rad, och en HELT
   * ANNAN rads knapp gick i laddläge också — bara ETT kvitto renderades.
   * Rotorsaken sitter DJUPARE än `isPending`-fältet: `useForhandsgranskaKvitto()`s
   * ENA mutation delas av ALLA rader, och `.mutate(id, { onSuccess, onError })`
   * -formen (per-anrops-callbacks som ANDRA argument) lagras på TanStack
   * Querys OBSERVATÖR — INTE på den enskilda mutationen. Källan
   * (`@tanstack/query-core` `mutationObserver.js`, verifierad mot den
   * installerade 5.101.4): `mutate()` skriver `this.#mutateOptions`
   * OVILLKORAT och kör `this.#currentMutation?.removeObserver(this)` INNAN
   * den nya mutationen kopplas på. Två överlappande klick skriver alltså
   * över VARANDRAS callbacks och kopplar loss den FÖRSTA mutationens
   * observatör — när rad A:s svar kommer tillbaka har den redan tappat sin
   * lyssnare (rad B:s `.mutate()` kopplade loss den), så rad A:s FÖNSTER FÅR
   * ALDRIG SIN ADRESS SATT. Det underliggande nätverksanropet
   * (`mutationFn`) körde HELA TIDEN oberoende per anrop — det var aldrig
   * problemet, bara vad Lotta SÅG av det.
   *
   * FIXEN: `mutateAsync()` I STÄLLET FÖR `.mutate(id, { onSuccess, onError })`.
   * `mutateAsync` returnerar `Mutation.execute()`s EGEN promise — samma
   * instans som ALDRIG passerar den delade observatören/`#mutateOptions` —
   * så varje anrops `.then()` löser ut med SINA EGNA data oavsett hur många
   * andra anrop som startat eller löst ut emellan. Den delade
   * `useForhandsgranskaKvitto()`-mutationen i `kvitton.ts` är OFÖRÄNDRAD —
   * bara ANROPSFORMEN här är ny.
   *
   * Laddläge och dubbelklicks-spärr läser nu `forhandsgranskaPagar` (ett
   * lokalt `Set<inbetalningId>`) I STÄLLET FÖR `forhandsgranska.isPending`:
   * den delade boolean:en visar ändå bara den SENAST STARTADE mutationens
   * läge (samma `#currentMutation`-ersättning som ovan), så den hade aldrig
   * kunnat bära per-rad-sanning ens om callback-bugen fixades för sig. Felet
   * namnger nu personen (`forhandsgranskaFel`) i stället för att bara läsa
   * `forhandsgranska.error` — av samma skäl: den delade mutationen vet inte
   * VILKEN rad som senast felade.
   *
   * [REVIEW RUNDA 1, FYND — lokalt state SJÄLVLÄKER INTE] Den gamla, delade
   * `forhandsgranska.isError`/`.error` nollställdes AUTOMATISKT av TanStack
   * Query så fort en NY mutation gick till `pending` (`#dispatch({ type:
   * 'pending', ... })` sätter `error: null`, se docblocket ovan). Det nya
   * lokala `forhandsgranskaFel` ärver INTE den självläkningen — ett state
   * satt en gång i `setForhandsgranskaFel` lever kvar för evigt om inget
   * explicit nollställer det. Utan denna rad hade rad A:s fel stått kvar i
   * `role="alert"` PERMANENT även efter en lyckad retry på samma rad ELLER
   * en helt annan, felfri förhandsgranskning på rad B — ett löst problem som
   * såg olöst ut. Nollställningen sker HÄR, vid nästa FÖRSÖK (inte t.ex. vid
   * lyckad `onSuccess` på VILKEN SOM HELST rad), av samma skäl som
   * TanStacks egen `pending`-övergång: ett nytt försök är den händelse som
   * gör det gamla felet inaktuellt, oavsett vilken rad som startar det.
   *
   * GRILLAD SAMSYN (S116 fråga 5, Marcus valde A "Oberoende"): bara den
   * TRYCKTA knappen laddar, övriga är fria omedelbart; samma rad kan inte
   * startas två gånger medan den renderar.
   */
  function forhandsgranskaKvitto(inbetalningId: string, namn: string) {
    // Per-inbetalning dubbelklicks-vakt — ERSÄTTER den rivna delade
    // `forhandsgranska.isPending`-vakten. Knapparna bär `aria-disabled` och
    // INTE `isDisabled` (se knapparnas egen kommentar), så spärren måste
    // ligga här. Bara SAMMA rad spärras medan den renderar — övriga rader
    // är fria (S116 beslut 5).
    if (forhandsgranskaPagar.has(inbetalningId)) return;

    // NOLLSTÄLL FÖREGÅENDE FEL — se docblockets § "lokalt state SJÄLVLÄKER
    // INTE". Ett nytt försök (denna rad ELLER en annan) gör ett tidigare
    // fel inaktuellt; utan detta står `role="alert"` kvar för evigt.
    setForhandsgranskaFel(null);

    // MÅSTE ske synkront, före mutateAsync() och all await — se docblocket.
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
          // Stäng det tomma fönstret — felet sägs på SIDAN (`role="alert"`
          // nedan), där Lotta faktiskt är. Ett kvarlämnat fönster med en
          // laddningstext som aldrig blir något är ett löfte som inte infrias.
          if (fonster && !fonster.closed) fonster.close();
          setForhandsgranskaFel({
            namn,
            message: fel instanceof Error ? fel.message : 'Okänt fel',
          });
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
  }

  /**
   * [TASK-370.4, PRD TASK-370 § Implementationsbeslut, S116 Del 2 beslut 1]
   * "Förhandsgranska alla N" — SAMMA fönster-först-mönster och SAMMA
   * per-nyckel-vakt/självläkningsfria-fel-disciplin som `forhandsgranskaKvitto`
   * ovan (läs DEN funktionens docblock för hela TanStack-bakgrunden; den
   * upprepas inte här). Denna funktion skiljer sig på TVÅ punkter, båda
   * ärvda ur S116:s grillade beslut:
   *
   *   1. NYCKELN är `FORHANDSGRANSKA_ALLA_NYCKEL`, inte ett `inbetalningId`
   *      — se konstantens eget docblock för kollisionsfriheten. "Alla" och
   *      VARJE rad är OBEROENDE (beslut 5): ett radförsök spärrar aldrig
   *      "alla" och tvärtom, eftersom de läser och skriver OLIKA nycklar i
   *      SAMMA Set.
   *   2. FELTOLKNINGEN: EF:en (`_shared/kvitto-kombination.ts`s
   *      `valideraInbetalningIdLista`) avvisar en kö längre än
   *      `MAX_KOMBINERADE_KVITTON` (30) med texten "inbetalningIds may
   *      contain at most N entries (got M)". `tolkaTakfel`
   *      (`inkorg-harledningar.ts`) KÄNNER IGEN den texten och lämnar ut
   *      TALET, så denna funktion kan visa ett begripligt, svenskt
   *      meddelande i stället för att lägga fram EF:ens engelska
   *      valideringssträng för Lotta — se `tolkaTakfel`s eget docblock för
   *      VARFÖR talet LÄSES UR FELET i stället för att dupliceras som en
   *      egen klientkonstant (S116-uppdragets egen ordalydelse: "en
   *      klientkopia som kan glida är sämre än att läsa felet från EF:en"),
   *      OCH för var BINDNINGEN mot EF:ens faktiska text bevisas
   *      (`tests/api/forhandsgranska-alla-tak-bindning.test.ts`, review-
   *      runda 1 FYND 1 — den e2e-mockade texten i denna funktions egna
   *      tester bevisar bara att regexen matchar sin egen handskrivna
   *      förlaga, inte EF:ens verkliga sträng). Ett underlagsfel (allt-
   *      eller-inget, EF:ens `vem`-variabel) namnger redan personen INUTI
   *      meddelandet och passerar HÄR OFÖRÄNDRAT — se `forhandsgranskaFel`s
   *      eget docblock för varför `namn` är `null` i detta flödet.
   */
  function forhandsgranskaAlla(inbetalningIds: readonly string[]) {
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
          const ravaMeddelande = fel instanceof Error ? fel.message : 'Okänt fel';
          const tak = tolkaTakfel(ravaMeddelande);
          const message =
            tak !== null
              ? `Förhandsgranskningen klarar högst ${tak} kvitton åt gången. Ta bort några från kön och försök igen.`
              : ravaMeddelande;
          setForhandsgranskaFel({ namn: null, message });
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
  }

  const sidRam = <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />;

  /* ═══════════════════════════════════════════════════════════════════════
   * [TASK-416.2, PRD TASK-416s regel] SIDKROMET RENDERAS I ALLA TRE
   * QUERY-TILLSTÅND — samma mönster som `AnmalningarSida.tsx` (TASK-416.4)
   * och `EventsList.tsx` (isPending-grenen, ~rad 279–292).
   * ═══════════════════════════════════════════════════════════════════════
   * FÖRE DENNA FIX visade isPending/isError bara `sidRam` + en enkel `h1`
   * + tre lösa skeleton-block; sidhuvudets meny-trigger ("Importera
   * kontoutdrag") och hela FilterRad (sökfält, tratt, panel) fanns bara i
   * det laddade läget. Lotta mötte alltså ett annat krom varje gång
   * inkorgen laddade om (sidladdning, flikbyte, TASK-346.7:s
   * `refetchOnMount: 'always'`).
   *
   * `headerBlock`/`filterRadBlock` ÄR DELAD JSX — SAMMA objekt i alla tre
   * return-grenar nedan, så h1:s och FilterRads klasser/DOM-position är
   * BYTE-IDENTISKA oavsett query-läge (`boundingBox()` rör sig aldrig vid
   * datalandning, AC #2 — mätt, se PR-kroppen).
   *
   * FilterRad FÅR `isPending={isPending}` — ALDRIG `dataOkand` nedan. Samma
   * review-fynd `AnmalningarSida.tsx` (TASK-416.4 runda 2) redan betalade:
   * matar man in `isError` här också fryser panelens dropdown-skelett kvar
   * för EVIGT fast källan definitivt gett upp — en vilseledande "laddar
   * fortfarande" när sanningen är "gav upp". I isError degraderar FilterRad
   * i stället till sitt eget, ärliga beteende för tomma/okända dimensioner
   * (`FilterRad.tsx` rad ~298–312).
   *
   * `dataOkand` (isPending || isError) styr ENDAST kö-radens "N kvitton
   * väntar"-text i headerBlock. Den bygger på `sammanfattning`, härledd ur
   * `rader` (`oppna?.betalningar ?? []`, tom i isPending) — men SKA ändå
   * aldrig visas förrän frågan lyckats: `oppna` KAN i sällsynta fall bära
   * KVARVARANDE data från en tidigare lyckad hämtning när en efterföljande
   * bakgrunds-refetch fallerar (`refetchOnMount: 'always'` gör om anropet
   * vid varje montering) — utan vakten hade kö-raden kunnat visa ett tal ur
   * data Lotta inte längre kan lita på, mitt i felbeskedet.
   */
  const dataOkand = isPending || isError;

  /* ═══ SIDHUVUDETS RYTM — BESLUT 1 (designfynd 2c + Marcus 2026-09-01),
      HISTORIK, RIVET AV BESLUT 2 NEDAN ═══
      "Importera kontoutdrag" satt först som en ensam strö-knapp mellan
      segmentväljaren och listan, sedan flyttad hit, bredvid rubriken,
      med knappen gömd medan importytan var öppen. Marcus samma dag, om
      linjeringen: *"Jag tycker 'Importera kontoutdrag'-knappen ska sitta
      liksom centrerat på rubrik-raden men kant i kant med sökrutan."*
      Lösningen var strukturell: headern fick FilterRadens tre-delade
      rytm (`[innehåll flex-1][gap-4][rund ändknapp]`) med en TOM spegel
      av trattens mått för att reservera spåret, `pl-4` i stället för
      `px-4` så högerkanten nådde samma x som filterraden (568 px via
      dess `-mx-4`), och `items-center` för att dela mittlinje med
      rubriken.

      ═══ BESLUT 2 (Marcus prod-granskning 2026-09-06, S121 resume 4,
      TASK-412) — HISTORIK, RIVET AV BESLUT 3 NEDAN ═══
      Marcus, om dialog-formen importen fick (se `<Modal>`-monteringen
      nedan): *"jag vill liksom ha det lite 'renare' upptill."* Knappen
      var RIVEN ur headern helt — INTE flyttad till filterraden (en
      första idé om det prövades och backades samma session: *"Jag vet
      inte om de där med att flytta sökrutan blir bra när jag tänker
      efter. Jag tror vi kan behålla det som det är MEN vi tar bort
      knappen 'Importera kontoutdrag' och skapar istället en rund ikon
      med tre prickar bredvid filtreringsikonen (till höger) som öppnar
      vår dropdown där det står 'Importera kontoutdrag'."*) — och landade
      då i `FilterRad`-radens `extraKnapp`-slot, till höger om tratten.

      ═══ BESLUT 3 (Marcus, femte varvet samma dag) — GÄLLANDE FORM ═══
      Två fynd i samma andetag: *"Agenten ändrade storleken på de tre
      prickarna istället för att ändra storleken på cirkeln som de
      sitter i vilket var vad jag menade. Ändra tillbaka prickarna …
      när filterikonen är aktiv så blir den mörkgrå och SER större ut.
      … Ta bort 'Mer-ikonen' och gör Titeln 'Betalningar' till en
      dropdown (typ som på eventdetalj-sidan)."* ⋯-knappen är ALLTSÅ
      RIVEN IGEN, den här gången för gott — se `FilterRad.tsx` (hela
      `extraKnapp`-slotten riven med den, ingen konsument kvar) och
      `strokeWidth`-fyndet ovan (moot, försvinner med knappen).

      RUBRIKEN "Betalningar" ÄR NU SJÄLV TRIGGERN, i eventväljarens
      RUBRIK-FORM (`EventValjare.tsx` § "RUBRIK-FORMEN", rad ~344-392):
      `h1` runt en `AriaButton` (`-mx-2 inline-flex … rounded-lg px-2
      py-1 text-left hover:bg-bg-emphasized`), chevron 18 px intill
      texten. SKILLNADEN ÄR MEDVETEN OCH SYNS: eventväljaren BYTER
      OBJEKT (en `Select` — `SelectValue`/`selectedKey`), den här
      triggern öppnar sidans ÅTGÄRDER (samma `Meny`/`MenyPost`-primitiv
      `extraKnapp` använde) — därför `ChevronsUpDown` (samma ikon,
      samma "det här fäller ut något"-signal) men `Meny`s `etikett`
      "Åtgärder för Betalningar", inte ett värde-namn. `aria-haspopup`
      sätts INTE manuellt — `MenuTrigger` (react-aria-components) sätter
      den automatiskt på sin `Button`-kontext-medvetna barn, samma sätt
      den redan gjorde det på ⋯-knappen (verifierat: `axe` gav noll fel
      i sviten som byggde den).

      INGEN BESKRIVNINGSRAD under rubriken (eventväljarens "Byt event"-
      motsvarighet) — Marcus: *"jag vill ha det rent upptill"*, chevronen
      ÄR hela signalen. `truncate` (samma nowrap-lås som förlagan) håller
      rubriken på EN rad ner mot 320 px; menyn öppnar UNDER rubriken utan
      att skjuta layouten (samma `Popover`-mekanik som ⋯-knappen redan
      bevisade).

      `importKnappRef` FLYTTAR HIT (från den nu rivna ⋯-knappen):
      `stangImport` fokuserar den när importytan stängs, oförändrad
      logik, ny plats.

      HEADERN BÄR ALLTSÅ ÅTER "BARA RUBRIKEN" — men rubriken är nu
      INTERAKTIV. `px-4` oförändrat sedan BESLUT 2 (ingen spegel-plikt,
      se det stycket). */
  const headerBlock = (
    <header className="flex flex-col gap-1 px-4">
      <h1 className="min-w-0 font-semibold text-3xl">
        <Meny
          etikett="Åtgärder för Betalningar"
          trigger={
            <AriaButton
              ref={importKnappRef}
              aria-labelledby={betalningarRubrikId}
              className="-mx-2 inline-flex max-w-[calc(100%+1rem)] items-center gap-1.5 rounded-lg px-2 py-1 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              <span id={betalningarRubrikId} className="block truncate">
                Betalningar
              </span>
              <ChevronsUpDown
                aria-hidden="true"
                size={18}
                className="shrink-0 text-text-secondary"
              />
            </AriaButton>
          }
        >
          <MenyPost
            ikon={<Upload aria-hidden="true" size={16} />}
            onAction={() => setVisaImport(true)}
          >
            Importera kontoutdrag
          </MenyPost>
        </Meny>
      </h1>
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
          kvitton är inget besked; det är frånvaron av ett.

          [TASK-416.2] `!dataOkand`-VAKTEN ÄR NY: raden läser `sammanfattning`
          (härledd ur `rader`), som i isPending alltid är tom (0, döljs redan
          av villkoret) men i isError KAN bära kvarvarande data från en
          tidigare lyckad hämtning (se `dataOkand`s docblock ovan). Utan
          vakten hade kö-raden kunnat visa ett tal Lotta inte längre kan lita
          på, mitt i felbeskedet — samma disciplin som `AnmalningarSida.tsx`s
          antalsrad. */}
      {!dataOkand && sammanfattning.kvittonAttSkicka > 0 && (
        <p className="text-small text-text-muted">
          {`${sammanfattning.kvittonAttSkicka} ${
            sammanfattning.kvittonAttSkicka === 1 ? 'kvitto väntar' : 'kvitton väntar'
          } på att skickas`}
        </p>
      )}
    </header>
  );

  const filterRadBlock = (
    <div className="flex flex-col gap-3 px-4" data-testid="betalningar-filterrad">
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
        /* Marcus prod-granskning 2026-09-06 (TASK-410): ihopfälld som
           förut ledde till en ensam Markera-knapp på egen rad, vilket såg
           fel ut. Utfälld som default löser det; övriga FilterRad-
           konsumenter (AktivitetsHistorik, EventsList, AnmalningarSida)
           är oförändrade — de skickar inte propen och behåller sitt
           ihopfällda startläge. */
        defaultOppen
        /* [TASK-412, femte varvet] ⋯-KNAPPEN ÄR RIVEN (var HÄR, i denna
           `extraKnapp`-slot) — se sidhuvudets BESLUT 3: Marcus ville
           prickarnas STORLEK ändrad genom cirkeln de sitter i, inte
           genom prickarna själva, och bad samtidigt om en annan väg helt
           ("Ta bort 'Mer-ikonen' och gör Titeln 'Betalningar' till en
           dropdown"). `FilterRad.tsx`s `extraKnapp`-prop är riven i
           samma commit (över-engineering-vakten: ingen konsument kvar).
           Åtgärden bor nu i sidhuvudets rubrik-trigger, se `headerBlock`
           ovan. */
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
        /* [TASK-416.2, AC #1] isPending SKICKAS NU TILL PRIMITIVEN.
           FilterRad degraderar SJÄLV till dropdown-skelett i panelens
           slutgeometri (`FilterRad.tsx` rad ~298–312, ~395–396) tills
           källan landat — se `dataOkand`s docblock ovan för varför detta
           ALDRIG är `dataOkand`. */
        isPending={isPending}
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
  );

  /* ═══════════════════════════════════════════════════════════════════════
   * [TASK-416.2 RUNDA 2, review-fynd 1] SEX FASTA SYSKON-POSITIONER I ETT
   * ENDA RETURTRÄD — INTE TRE SEPARATA `return`, SOM RUNDA 1 SKREV DET.
   * ═══════════════════════════════════════════════════════════════════════
   * Samma mönster som TASK-416.8:s fix i `Intresserade.tsx` (#2395,
   * "annonsering"/"rubrik"/"sokRad"/"datakropp").
   *
   * RUNDA 1:S FEL, MÄTT (review-grinden, Marcus mandat): den laddade grenen
   * sköt in `<p role="status">{N} kvarvarande...</p>` FÖRE `headerBlock`
   * (position 1), medan isPending/isError hade `headerBlock` DIREKT efter
   * `sidRam` (position 0). Reacts keyless reconciliation matchar barn
   * POSITIONELLT (array-index utan explicit `key`): vid isPending→laddat
   * jämförde React position 1 — gammalt `<header>` mot nytt `<p>` — och
   * TYPERNA skiljer sig, så HELA subträdet från den positionen och framåt
   * monterades OM. Fokus i menytriggern (`headerBlock`) eller inskriven
   * text i FilterRads sökfält (redan renderad i isPending) gick förlorad
   * exakt vid landningen — en `boundingBox()`-mätning ser aldrig detta,
   * eftersom den mäter GEOMETRI, inte DOM-identitet.
   *
   * LÖSNINGEN: exakt SEX fasta syskon-positioner i `<section>` (se det
   * enda returträdet längst ner i funktionen) — `sidRam`, `statusAnnons`,
   * `headerBlock`, `realtidsfelBlock`, `filterRadBlock`, `datakropp` — i
   * EXAKT den ordningen i ALLA tre query-lägen. Varje position är ETT
   * JSX-uttryck som ALLTID finns med (även när det evaluerar till
   * `null`/`false`/tom sträng), så barnens ARRAY-INDEX aldrig ändras
   * mellan lägena — bara VÄRDET på en given position varierar.
   * `headerBlock`/`filterRadBlock` jämförs därför alltid mot SIG SJÄLVA,
   * oavsett vad `datakropp` för tillfället representerar.
   *
   * `statusAnnons` ÄR SAMMA `<p>`-ELEMENT I ALLA TRE LÄGEN — bara texten
   * och `aria-busy` varierar (review-fyndets egen föreslagna form:
   * "rendera `<p role='status' aria-live='polite' className='sr-only'>`
   * ALLTID, med tomt/pending-innehåll tills datan landat"). isError ger
   * medvetet TOM text: `MessageBox`s egen felannonsering (i `datakropp`)
   * bär redan beskedet, och en andra, tom live-region-uppdatering är
   * ofarlig brus, inte en dubbelannonsering. */
  const statusAnnons = (
    <p className="sr-only" role="status" aria-live="polite" aria-busy={isPending || undefined}>
      {isPending
        ? 'Laddar betalningar ...'
        : isError
          ? ''
          : `${rader.length} kvarvarande betalningar laddade.`}
    </p>
  );

  /* Realtidsfelet (TASK-346.4:s namngivna TODO, betald här). Byggd på
     nedstängningsvaktens PREDIKAT, aldrig på råa status-värden - annars
     hade rutan blinkat vid varje navigering.

     [TASK-416.2 RUNDA 2] FLYTTAD TILL EN EGEN, FAST SYSKON-POSITION (satt
     tidigare bara i det laddade returträdet, mellan headerBlock och
     filterRadBlock) — av SAMMA skäl som `statusAnnons` ovan: en slot som
     bara fanns i EN av de tre grenarna var en positionell krock i väntan
     på att hända (se docblocket ovan). `realtidsfel` är dessutom en helt
     OBEROENDE källa (`useRealtidsfel()`, en extern websocket-status), så
     banderollen kan nu även synas UNDER pågående laddning eller ett
     fel-läge om realtiden råkar vara nere samtidigt — en STRIKT
     förbättring mot tidigare (banderollen kunde tidigare aldrig synas
     förrän datat landat), inte en beteendeförsämring. */
  const realtidsfelBlock = realtidsfel !== null && (
    <MessageBox intent="warning" title="Realtidsuppdateringen är nere">
      Kvittonas status uppdateras inte av sig själv just nu. Läget läses om varje gång du öppnar
      sidan, så inget går förlorat.
    </MessageBox>
  );

  /* `datakropp` I ISPENDING — SKELETON BARA I KORTLISTAN (AC #1/#2). Se
     docblocket ovan för VARFÖR den här skeleton-grenen numera är ett
     `datakropp`-värde i stället för ett eget returträd, aldrig VAD den
     ritar (den delen är oförändrad sedan förra granskningsvarvet).
     Kortskelettet härmar den LADDADE listans exakta boxmodell
     (grupprubrik + `-mx-4`-kort i `bg-bg-muted`, `BetalningsradKort`s
     stängda form: avatar `size-9`, namnrad `text-body`, metarad
     `text-caption`, en tom badge-rad-spegel så `gap-1`-mellanrummet blir
     detsamma som en rad UTAN förfallen-/obekräftad-/spegelSlapar-pillar,
     plus en knapp-yta för "Registrera betalning") så att FÖRSTA kortets
     boundingBox blir identisk pending/laddat (mätt, se PR-kroppen).
     `<div>`, inte `<ul>/<li>` — samma val som `EventsList.tsx`/
     `AnmalningarSida.tsx` gör i sina skeleton-grenar: rent dekorativa
     block ska inte annonseras som en (tom) lista.

     MARKERA-KNAPPENS RAD RESERVERAS ÄVEN HÄR (mätt, inte antaget): en
     tidigare version av detta skelett saknade denna rad helt och sköt
     FÖRSTA KORTET 73 px för högt jämfört med det laddade läget
     (`MarkeringsAtgardsRad`s `mt-6 px-4`-rad, `Button size="sm"` ~32 px
     hög — headless Playwright, 1280×720, se PR-kroppen för båda
     mätningarna, före och efter). Samma `mt-6 px-4`-geometri som den
     riktiga raden (rad ~1946 nedan), en enda knapp-formad skeleton i
     stället för "Markera".

     [TASK-416.2 RUNDA 2, review-fynd 2 — BOKFÖRT, EJ ÅTGÄRDAT] Raden
     reserveras OVILLKORLIGT, men den RIKTIGA `MarkeringsAtgardsRad`
     renderas bara när `markerbaraIds.length > 0` (se `datakropp`s laddade
     gren längre ner). En GENUINT TOM inkorg (noll öppna betalningar) får
     därför ett litet layout-hopp vid landning — skeletonet speglar det
     SANNOLIKA fallet (Lotta har öppna betalningar att registrera, PRD:ns
     hela premiss), inte det tomma. Detta är SAMMA KLASS avvägning som
     Hem-kortens tomläge (PRD § Öppna frågor, Marcus designval) och rättas
     INTE här — se `tests/e2e/mer-betalningar-laddlage.staging.test.ts`s
     docblock för samma bokföring i testet. */
  const datakroppPending = (
    <>
      <div className="mt-6 px-4">
        <Skeleton variant="text" className="h-8 w-24 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 px-4">
        <Skeleton variant="text" className="w-40 text-lg" />
        <div className="-mx-4 flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-2 contrast-more:border-border-strong">
          {['a', 'b', 'c'].map((k) => (
            <div
              key={k}
              data-testid="betalningar-skeleton-kort"
              className="rounded-2xl border border-transparent bg-surface p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                  <Skeleton variant="text" className="size-9 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Skeleton variant="text" className="w-2/5 text-body" />
                    <Skeleton variant="text" className="w-3/5 text-caption" />
                    <div className="flex flex-wrap items-center gap-2" />
                  </div>
                </div>
                <Skeleton
                  variant="text"
                  className="h-8 w-36 self-start rounded-full sm:self-auto"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const datakroppFel = (
    <MessageBox intent="error" title="Betalningarna kunde inte hämtas">
      {error instanceof Error ? error.message : 'Okänt fel.'}
    </MessageBox>
  );

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

  /* [TASK-402.2] `blockAktivt` (TASK-362s guld/vila-ton) FLYTTADE in i
     `RegistreratNuBlock` — den härleds nu ur `registrerade`/`vantande`/
     `jobbrader`, som redan skickas dit som props, i stället för att räknas
     ut här och passeras ner som en extra boolean. */

  /* [TASK-353 → OMSKRIVEN TASK-370.4] FORMVALET, MÄTT MOT DEN FAKTISKA
     UI-STRUKTUREN OCH BOKFÖRT.

     ═══════════════════════════════════════════════════════════════════════
     DETTA STYCKE ERSÄTTER DEN TIDIGARE MOTIVERINGEN, DET ÄR INTE ETT
     TILLÄGG TILL DEN
     ═══════════════════════════════════════════════════════════════════════
     TASK-353s docblock argumenterade att "en ensam 'Förhandsgranska' bredvid
     'Skicka 8 kvitton' hade varit tvetydig (granska vilket av de åtta?)" och
     att öppna åtta flikar på ett klick "inte är en granskning utan ett
     översvämmat fönsterfält" — och drog slutsatsen att flera väntande kvitton
     ENDAST fick per-rad-knappar, ALDRIG en gemensam. Den slutsatsen är
     UPPHÄVD av S116 Del 2 beslut 1 (grillad samsyn, Marcus: *"Båda"*): PRD
     TASK-370 löser tvetydigheten på ETT ANNAT SÄTT än att förbjuda den
     gemensamma knappen — "Förhandsgranska alla N" öppnar INTE åtta flikar,
     den öppnar ETT fönster med ETT dokument (försättsblad + en sida per
     kvitto, `TASK-370.1`s EF-komposition). Frågan "granska vilket av de
     åtta?" har därmed svaret "alla åtta, i tur och ordning, i EN PDF" — inte
     "omöjligt att veta".

     VAD MÄTNINGEN VISADE (oförändrat sedan TASK-353): granskningsblocket
     (C1) renderar EN rad per registrering med namn, betalsätt/status och
     belopp, plus en åtgärdsslot till höger som redan bär "Ångra" respektive
     "Skicka igen". "Skicka N kvitton" står under listan (`self-start`). Det
     finns alltså redan en per-rad-slot OCH en gemensam knapprad att hänga
     nya åtgärder i — ingen ny struktur behövs för någotdera.

     VALD FORM, S116 beslut 1 ("Båda") — VILKEN KNAPP RENDERAS, oförändrat:
       • EXAKT ETT väntande kvitto (`enSamKo`) → TASK-353s ursprungsform:
         en ensam knapp står BREDVID "Skicka 1 kvitto". Ingen andra,
         separat "alla"-knapp för ett ensamt kvitto — den hade varit en
         synonym till den redan befintliga.
       • TVÅ ELLER FLER väntande (`!enSamKo`) → BÅDA finns: per-RAD-knappen
         (oförändrad, ett enskilt kvitto i taget) OCH den kombinerade
         förhandsgranskningen bredvid "Skicka N kvitton" (`TASK-370.4`,
         hela kön som ETT dokument). De två täcker olika behov ("Annas
         kvitto, snabbt" kontra "allihop, i ordning") och är inte
         varandras ersättning.

     [AMENDERAD TASK-393] BÅDA knapparnas SYNLIGA TEXT/aria-label är nu
     IDENTISK FORM — "Förhandsgranska" + upphöjt räknarchip, aldrig ordet
     "alla" — se `ForhandsgranskaEtikett`s docblock. Det som beskrivs ovan
     ("BYTE FÖR BYTE OFÖRÄNDRAD", "utan tal") gällde etiketten FÖRE denna
     ändring och är inte längre sant för texten; VALET AV VILKEN KNAPP som
     renderas (formvalet ovan) är fortsatt oförändrat.

     KNAPPARNA ÄR OBEROENDE (S116 beslut 5) — se `forhandsgranskaPagar`s och
     `FORHANDSGRANSKA_ALLA_NYCKEL`s docblock: ett tryck på "alla" spärrar
     ALDRIG en radknapp och tvärtom. */
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

  /**
   * [TASK-367] "Skicka N kvitton" för den DURABLA sektionen
   * (`KvittoAttSkickaBlock`, renderad i `datakroppLoaded` nedan) — se
   * `harledKvittoAttSkicka`s docblock för hela resonemanget. En egen
   * funktion, inte inline i JSX, av samma skäl som `skickaKvitton` (den
   * session-lokala motsvarigheten) redan är det.
   */
  function skickaKvittoAttSkicka() {
    if (kvittoAttSkickaPoster.length === 0) return;
    // [TASK-362] Samma regel som `vidRegistrerad`/`skickaKvitton`: nästa
    // handling gör en stående SUCCESS-bekräftelse inaktuell.
    setBekraftelseSynlig(false);
    koa.mutate(
      { inbetalningIds: kvittoAttSkickaPoster.map((post) => post.inbetalningId) },
      { onSuccess: (svar) => setJobbId(svar.jobbId ?? undefined) },
    );
  }

  /* `datakropp` I LADDAT LÄGE — allt som tidigare stod direkt i det enda
     (numera rivna) loaded-returträdet, oförändrat i sak. Fragmentet blir
     VÄRDET på `datakropp`s tredje gren (se konstruktionen och det enda
     returträdet i slutet av funktionen) — `sidRam`/`statusAnnons`/
     `headerBlock`/`realtidsfelBlock`/`filterRadBlock` ligger INTE här
     längre, de är egna fasta syskon-positioner (se docblocket ovan). */
  const datakroppLoaded = (
    <>
      {/* [TASK-346.10] Importen ligger FÖRE "Skicka N kvitton", i den ordning
          Lottas lördag faktiskt går: läs banken, bekräfta raderna, skicka
          kvittona.

          [TASK-412, Marcus prod-granskning 2026-09-06] IMPORTEN ÄR EN
          DIALOG, INTE LÄNGRE EN INLINE-PANEL: *"När jag trycker på
          'Importera kontoutdrag' så kommer den rutan upp nedanför
          filtreringskomponenten när den är utfälld, det är inte bra. Jag
          vill istället att när jag trycker 'importera kontoutdrag' så
          öppnas en dialogruta i husets form."* Husets form är `Modal` +
          `Dialog` (ADR-044) — samma par som Ångra-dialogen i
          `RegistreratNuBlock.tsx`, `SegmentMailCompose.tsx` och
          `AtgardsSida.tsx`. KONTROLLERAT, INTE `DialogTrigger`: öppnaren
          (rubrik-triggerns meny "Importera kontoutdrag", se `<header>` ovan
          § BESLUT 3) sitter inte bredvid Modalen i JSX-trädet, så
          `isOpen={visaImport}`/`onOpenChange` är samma kontrollerade mönster
          som `SegmentMailCompose.tsx`s bekräftelse-modal — `visaImport` var
          redan källan till sanning, bara VISNINGEN är ny.

          STÄNGNING GÅR ALLTID VIA `stangImport` (Esc, klick utanför —
          `isDismissable` — eller `SwishImport`s egna Avbryt-knappar): den
          rör aldrig bankminnet (se `stangImport`s docblock), bara
          `visaImport`-flaggan och fokus-återgången. ÖVERLÄMNINGEN
          (`SwishImport.tsx` § ÖVERLÄMNINGEN) NAVIGERAR i stället för att
          stänga — Modalen avmonteras med sidan när routern byter väg,
          precis som den gjorde som inline-panel.

          [TASK-412, TREDJE GRANSKNINGSVARVET] `<Dialog>` FLYTTADE IN I
          `SwishImport.tsx` SJÄLV — här monteras bara `<Modal>`. Skälet:
          `actions`-raden och steg-underraden måste känna till `steg`
          (`'val'`/`'mappning'`), och det tillståndet är internt i
          `SwishImport`. En `Dialog` byggd HÄR (utanför) hade antingen
          behövt lyfta `steg` upp i denna komponent (samma stat på två
          ställen) eller inte kunnat bygga rätt knapprad alls — samma
          arkitektur som `RegistreratNuBlock.tsx`s `AngraKnapp` och
          `SegmentMailCompose.tsx`, som båda äger sin EGNA fulla
          `Dialog`-komposition. Se `SwishImport.tsx`s eget docblock för
          `size="lg"`-motiveringen (oförändrad, flyttade bara med). */}
      <Modal
        isOpen={visaImport}
        onOpenChange={(oppen) => {
          if (!oppen) stangImport();
        }}
        isDismissable
      >
        <SwishImport oppna={rader} onStang={stangImport} />
      </Modal>

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

          DEN KÄNDA GRÄNSEN ÄR SEDAN TASK-367 BARA HALV: stängs fliken innan
          knappen tryckts är LOGGEN (`registrerade`, denna komponentens
          Ångra/Förhandsgranska-vy) fortfarande borta — den kräver
          session-state ingen server har. KÖN är det inte längre: en rad utan
          kvitto och utan jobbrad återuppstår i `KvittoAttSkickaBlock` nedan,
          härlett ur `OppenBetalning.oskickadeKvitton`
          (`hamta-oppna-betalningar/index.ts` § "KVITTO ATT SKICKA"), och
          "Skicka N kvitton" fungerar därifrån oavsett vilken flik som
          registrerade den. Se `harledKvittoAttSkicka`s docblock för hela
          resonemanget och den medvetna gränsen mot denna komponent.

          RADFORMEN ÄR INBETALNINGSRADERNAS (`InbetalningsLista.tsx` § RADENS
          ANATOMI): bankens tre kolumner — titelled i `text-body`-vikt,
          sekundärled som ETT `·`-svep i `text-caption text-text-muted`, och
          beloppet högerställt i egen kolumn på titelradens baslinje. ETT
          MEDVETET AVSTEG: titelledet är NAMNET och inte betalsättet — det är
          personen som skiljer raderna åt här, medan förlagan listar en enda
          persons betalningar och därför kan låta betalsättet vara identiteten.
          Betalsättet står i klartext i sekundärledet. */}
      {/* [TASK-367] DEN DURABLA SEKTIONEN — före granskningsblocket med
          avsikt: en rad som återuppstår från en ANNAN flik/session/enhet är
          per definition äldre än allt Lotta gjort i DENNA flik, och ska inte
          gömmas under dagens egna aktivitet. Se `KvittoAttSkickaBlock`s
          docblock för hela resonemanget och gränsen mot blocket nedan. */}
      <KvittoAttSkickaBlock
        poster={kvittoAttSkickaPoster}
        pending={koa.isPending}
        onSkicka={skickaKvittoAttSkicka}
      />

      <RegistreratNuBlock
        granskningsBlockRef={granskningsBlockRef}
        registrerade={registrerade}
        vantande={vantande}
        jobbrader={jobb.data?.rader ?? []}
        utfall={utfall}
        ovrigaJobbrader={ovrigaJobbrader}
        bekraftelseSynlig={bekraftelseSynlig}
        onDoljBekraftelse={() => setBekraftelseSynlig(false)}
        koaPending={koa.isPending}
        onSkickaKvitton={skickaKvitton}
        vantandeIds={vantandeIds}
        enSamKo={enSamKo}
        ensamKandidat={ensamKandidat}
        forhandsgranskaPagar={forhandsgranskaPagar}
        forhandsgranskaAllaPagar={forhandsgranskaPagar.has(FORHANDSGRANSKA_ALLA_NYCKEL)}
        onForhandsgranska={forhandsgranskaKvitto}
        onForhandsgranskaAlla={forhandsgranskaAlla}
        onSkickaIgen={skickaIgen}
        onAngra={angraRegistrering}
        angraPending={radera.isPending}
        angraFel={angraFel}
        onAngraDialogOppen={() => setAngraFel(null)}
        forhandsgranskaFel={forhandsgranskaFel}
      />

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

      {/* ═══ ÅTGÄRDSRADEN, DIREKT OVANFÖR LISTAN (TASK-402.1) ═══
          Förlagans placering: `Deltagare.tsx` renderar baren omedelbart ovanför
          registret, inte i sidhuvudet. Samma här — raden hör till listan den
          verkar på, och står därför under filtreringen och granskningsblocket.

          VILLKORAD PÅ ATT DET FINNS NÅGOT ATT MARKERA. Förlagan löser samma sak
          i sin hook (`kandidatNyckel === ''` ⇒ läget stänger sig självt "i
          stället för att stå aktivt mot ingenting"); här är det uttryckt i
          renderingen i stället, eftersom inkorgens hook aldrig får nollställa
          på en tom mängd (den kan betyda "vet inte än" — se hookens
          § SANERINGEN). En Markera-knapp i en tom inkorg vore en död kontroll.

          EXTRA LUFT MOT FILTERKOMPONENTEN — TVÅ VARV.
          VARV 1 (Marcus prod-granskning 2026-09-06, S121 resume 4, TASK-410
          tillägg): *"lägg mer luft mellan markera-knappen och
          filtreringskomponenten också."* MÄTT (ej ögonmätt): sektionsroten
          bär `gap-4` (16 px) mellan ALLA sina direkta barn, alltså även
          mellan filterblocket och denna rad — samma 16 px som varje annan
          brytning på sidan. `mt-2` gav +8 px, 24 px totalt.

          VARV 2 (Marcus granskning på granskningsservern, samma dag),
          ordagrant: *"Jag vill ha mer luft ÖVER markera knappen, luften
          under är bra som det är nu. Men lite mer över för att visualisera
          att markeraknappen hör till listorna nedan, inte till
          filtreringskomponenten."* 24 px räckte alltså inte för att läsa
          som en TYDLIG gruppgräns — knappen skulle fortfarande kunna läsas
          som filterpanelens svans. `mt-6` (+24 px, husets 4 px-skala) höjer
          ÖVERGÅNGEN till 40 px totalt (16 bas + 24 tillägg): en STÖRRE,
          medvetet väl synlig lucka, matchande samma `mt-6` FilterRad.tsx
          själv använder mellan sin tratt-rad och sin egen utfällda panel
          (samma "det här är en annan grupp"-signal, återanvänd i stället
          för uppfunnen).

          LUFTEN UNDER (mot listan/sökträffarna) RÖRS INTE AV NÅGOTDERA
          VARVET: den bärs av SAMMA sektions-`gap-4` mot NÄSTA syskon
          (`{soker ? ... : ...}`-blocket längre ner), och ingen marginal har
          lagts där — 16 px, oförändrat sedan innan TASK-410, exakt vad
          Marcus bad att få behålla ("luften under är bra som det är nu"). */}
      {markerbaraIds.length > 0 && (
        <div className="mt-6 px-4">
          <MarkeringsAtgardsRad
            aktivt={markering.aktivt}
            antal={markering.antal}
            allaSynligaValda={allaSynligaMarkerade(markering.valda, synligaMarkerbaraIds)}
            onRegistrera={registreraMarkerade}
            onMarkeraAllaSynliga={() => markering.markeraAllaSynliga(synligaMarkerbaraIds)}
            onRensa={markering.rensa}
            markeraKnapp={
              <MarkeraKnapp
                aktivt={markering.aktivt}
                /* Ett öppet radformulär stängs när läget slås på: i läget
                   BOCKAR ett tryck på raden (AC #1), så ett formulär som stod
                   kvar hade varit en yta utan väg ut. */
                onOppna={() => {
                  setOppenRad(null);
                  markering.oppna();
                }}
                onStang={markering.stang}
                buttonRef={markeraKnappRef}
              />
            }
          />
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
                  markeraLage={markering.aktivt}
                  /* AC #3 i sökläget: `rankaTraffar` blandar klara och öppna
                     rader, så krysset villkoras på raden själv. En klar rad
                     renderas i läget som ett inert kort — se kortets
                     § MARKERA-LÄGETS TRE KORTFORMER. */
                  kryss={
                    rad.klar
                      ? undefined
                      : {
                          vald: markering.valda.has(rad.nyckel),
                          onChange: (vald) => markering.vaxla(rad.nyckel, vald),
                        }
                  }
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
                      markeraLage={markering.aktivt}
                      /* Ingen `rad.klar`-vakt behövs här: `grupperaPerEvent`
                         har redan delat upp raderna, och `grupp.klara`
                         renderas i sin egen hopfällda lista utan kort. */
                      kryss={{
                        vald: markering.valda.has(rad.nyckel),
                        onChange: (vald) => markering.vaxla(rad.nyckel, vald),
                      }}
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
    </>
  );

  const datakropp = isPending ? datakroppPending : isError ? datakroppFel : datakroppLoaded;

  return (
    <section className="flex flex-col gap-4">
      {sidRam}
      {statusAnnons}
      {headerBlock}
      {realtidsfelBlock}
      {filterRadBlock}
      {datakropp}
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
  /** [TASK-402.1] Markera-läget på/av för HELA listan. */
  markeraLage?: boolean;
  /** [TASK-402.1] Radens kryss. `undefined` i markera-läget betyder att raden
      inte KAN markeras (AC #3) — se § MARKERA-LÄGETS TRE KORTFORMER. Ignoreras
      helt när `markeraLage` är falskt. */
  kryss?: { vald: boolean; onChange: (vald: boolean) => void };
};

/**
 * Kortets INNEHÅLL — delat av alla tre kortformerna så formen aldrig kan driva
 * isär (`Deltagare.tsx` § "Kortets INNEHÅLL — delat av båda lägena", samma
 * skäl och samma konstruktion).
 *
 * `visaEvent` är den enda axeln som skiljer sökläget från gruppvyn; allt annat
 * är identiskt över lägena med avsikt. Ingenting här är interaktivt, vilket är
 * exakt det som gör hela kortet till en laglig kryssruta i markera-läget:
 * L303:s "interaktivt bor aldrig i interaktivt" hålls utan ett enda undantag.
 */
function RadInnehall({ rad, visaEvent }: { rad: InkorgsRad; visaEvent?: boolean }) {
  const saknas = rad.kvar ?? rad.betalning.saknas;
  return (
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
  );
}

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
  markeraLage = false,
  kryss,
}: KortProps) {
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

  /* ═══════════════ MARKERA-LÄGETS TRE KORTFORMER (TASK-402.1) ═══════════════
   *
   * Förlagan är `Deltagare.tsx` § MARKERBART kort ("hela kortet ÄR
   * kryssrutan") — rå RAC `Checkbox` per BorOverRad-precedenten, ingen
   * `GridList` och ingen ny primitiv: kravet på aria-multiselectable-form
   * uppfylls av N fristående kryssrutor med var sitt tillgängliga namn, och
   * namnet kommer ur kortets egen text (namn · belopp · pillar). Det är exakt
   * vad PRD berättelse 27 lovar skärmläsaranvändaren.
   *
   * TRE FORMER, INTE TVÅ:
   *   1. `markeraLage && kryss`  ⇒ KRYSS-KORT. Hela kortet är kryssrutan; ett
   *      tryck bockar i stället för att öppna radformuläret (AC #1).
   *   2. `markeraLage && !kryss` ⇒ INERT KORT. En KLAR rad i sökläget (AC #3:
   *      "klara rader saknar kryss och kan inte markeras"). Den behåller sin
   *      plats i träfflistan men bär varken kryss eller knapp: i markera-läget
   *      är det enda man kan göra att bocka, och en ensam primärknapp mitt i
   *      ett markera-läge hade varit en annan grammatik på samma yta. I
   *      GRUPPVYN kan formen aldrig uppstå — `grupperaPerEvent` har redan
   *      lagt de klara raderna i sin egen hopfällda lista.
   *   3. annars ⇒ det OFÖRÄNDRADE kortet, med "Registrera betalning" och det
   *      expanderbara radformuläret.
   *
   * ═══ VAD SOM ÄRVS RAKT AV, OCH VAD SOM MEDVETET INTE GÖR DET ═══
   * ÄRVS: konstruktionen (rå `Checkbox`, hela kortet som klickyta), att kanten
   * är WCAG 1.4.1-BÄRAREN, och att `contrast-more` bor i VARDERA grenen och
   * aldrig i basklasserna — en ovillkorad `contrast-more:border-border-strong`
   * hade vunnit över den gröna kanten och gett markerade kort en NEUTRAL kant i
   * förhöjd kontrast, alltså hade precis de användare regeln finns för tappat
   * markerings-signalen (`Deltagare.tsx` § review-fynd 6, samma fälla).
   *
   * PLATTANS STYRKA — HISTORIK, TASK-411 river föregående rads påstående:
   * eventdetaljen bär `--mm-success-bg` rakt av, och sedan 2026-09-01 bar
   * inkorgen en EGEN, svagare tint (`--mm-betalningskort-markerad-bg` blandad
   * 50 % mot ytan) eftersom Marcus dom samma dag löd *"du använder samma
   * grön på markeringen som gröna notis-rutan, så notisrutan syns inte"*.
   * Marcus PRÖVADE OM den 2026-09-06 (prod-granskning, S121 resume 4): rätt
   * grön är samma som bekräftelsestegets och eventdetaljens, alltså hela
   * `--mm-success-bg`. `--mm-betalningskort-markerad-bg` pekar därför om till
   * `var(--mm-success-bg)` (se `components.css` § "Markerat betalningskort"
   * för båda besluten i följd) — SAMMA PLATTA som förlagorna nu, ingen egen
   * tint. Kollisionen 2026-09-01 varnade om är löst på ANNAT håll: notisrutan
   * i `RegistreraForm.tsx` får en egen vit bakgrund (SCOPAD till denna yta
   * via `notisBakgrund="vit"` sedan RUNDA 2:s granskningsfynd — se anropet
   * nedan och `RegistreraForm.tsx`s docblock) i stället för att kortet
   * späds ut. RAMEN ÄR OFÖRÄNDRAD:
   * `--mm-betalningskort-markerad-border` ÄR fortfarande `var(--mm-success)`,
   * #606b57, nu 5,62:1 mot vit botten i notisrutan och 5,37:1 mot kortets
   * `--mm-success-bg` (WCAG 1.4.11 kräver 3:1) — se `components.css` för
   * uträkningen.
   *
   * RADIEN är inkorgens `rounded-2xl`, inte eventsidans `rounded-xl`: kortet
   * är samma kort som raden bredvid, bara kryssbart. Ett kort som bytte radie
   * när läget slogs på hade fått listan att se ut som två olika listor.
   */
  if (markeraLage) {
    if (!kryss) {
      return (
        <li className="rounded-2xl border border-transparent bg-surface p-3 contrast-more:border-border-strong">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <RadInnehall rad={rad} visaEvent={visaEvent} />
          </div>
        </li>
      );
    }
    return (
      <li>
        <Checkbox
          data-testid="markerbart-betalningskort"
          isSelected={kryss.vald}
          onChange={kryss.onChange}
          className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:flex-wrap sm:items-center ${
            kryss.vald
              ? 'border-(--mm-betalningskort-markerad-border) bg-(--mm-betalningskort-markerad-bg) contrast-more:border-(--mm-betalningskort-markerad-border)'
              : 'border-transparent bg-surface contrast-more:border-border-strong'
          }`}
        >
          <RadInnehall rad={rad} visaEvent={visaEvent} />
        </Checkbox>
      </li>
    );
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

       FÄRGERNA KOMMER UR EGNA TOKENS (fynd 2, historik — TASK-411 river
       "svagare tint" nedan). Markeringen bar `--mm-success-bg`, samma token
       MessageBox success-ytan bär, så en grön notisruta inuti kortet blev
       osynlig. `--mm-betalningskort-markerad-*` (components.css) fick 2026-
       09-01 en SVAGARE egen tint där ramen bar signalen i stället.
       [TASK-411, Marcus prod-fynd 2026-09-06] Tinten var FEL mot förlagorna
       — bekräftelsestegets och eventdetaljens markerade kort bär hela
       `--mm-success-bg`, och det är vad Lotta ska se här också.
       `--mm-betalningskort-markerad-bg` pekar nu om till `var(--mm-success-
       bg)` (samma platta, ingen egen tint), och kollisionen med notisrutan
       löses i stället hos KONSUMENTEN — `RegistreraForm.tsx` ger den vit
       bakgrund NÄR `notisBakgrund="vit"` (satt HÄR, av det öppna kortet
       nedan; scopad sedan RUNDA 2:s granskningsfynd så de tre andra ytor
       som delar formuläret via `RegistreraYta` behåller sin gröna
       success-botten) — mätvärdena och kontrasterna står vid tokenet i
       components.css.

       `contrast-more` BOR I VARDERA GRENEN, aldrig i basklasserna: en
       ovillkorad `contrast-more:border-border-strong` hade vunnit över den
       gröna kanten och gett markerade kort en NEUTRAL kant i förhöjd kontrast
       — alltså hade precis de användare regeln finns för tappat
       markerings-signalen (`Deltagare.tsx` § review-fynd 6, samma fälla). */
    <li
      data-testid="betalningar-kort"
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
          mobil — den ska stå på sin egen rad, inte bli en helbredds-yta.

          [TASK-402.1] KOMPOSITIONEN ÄR NU DELAD: avatar- och infokolumnen bor
          i `RadInnehall` ovan, så kryss-kortet och det vanliga kortet aldrig
          kan driva isär. Wrappern och den trailing knappen står kvar här,
          eftersom bara denna form har en knapp. */}
      {/* `py-3` BORTTAGEN (pass 11): kortets egen `p-3` bär nu rytmen. Låg den
          kvar blev det 12 px kortpadding PLUS 12 px radpadding i topp och
          botten på varje kort. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <RadInnehall rad={rad} visaEvent={visaEvent} />
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
          // [TASK-411, RUNDA 2 — Marcus: "Ja, begränsa till inkorgen."]
          // BARA denna öppna, gröna kortyta sätter vit botten på
          // success-notisen (se `notisBakgrund`s docblock i
          // `RegistreraForm.tsx` § `PropsGemensamt` för hela resonemanget
          // och kollisionen den löser). `RegistreraYta.tsx`s tre andra
          // ytor lämnar propen utelämnad och behåller sin gröna botten.
          notisBakgrund="vit"
        />
      )}
    </li>
  );
}
