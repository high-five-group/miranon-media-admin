import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BedDouble,
  Check,
  ChevronDown,
  Clock,
  History,
  Inbox,
  type LucideIcon,
  Mail,
  MailCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
// [PROTOTYPE] [S93] hållplats-pass — kastbar wiring (throwaway-kontraktet):
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import { bekraftelseUtfall, useConfirmAll } from '@/data/mutations/registrationConfirmation';
import { useSetBorOver } from '@/data/mutations/registrationLodging';
import { useUpdateEvent } from '@/data/mutations/useUpdateEvent';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
// [PROTOTYPE] [S93] konvergens-pass (Del 3 beslut 1): Betalningars arbetsyta
// flyttar in i Anmälda deltagare — se ArbetsKo:s "Öppna detaljer" nedan.
import { BetalningsDetaljer, DetaljRad } from './Betalningar';
// [PROTOTYPE] [S93] hållplats-pass — se DeltagareHallplatsPrototyp.tsx (frågan,
// huvudprototypfilen) + hallplats-steg-prototyp.ts (delad logik/fixturer).
import {
  type HallplatsCounts,
  HallplatsMarke,
  HallplatsToppA,
  RegisterFilterRad,
} from './DeltagareHallplatsPrototyp';
import { DetaljGrupp } from './DetaljGrupp';
import { DAGMANAD } from './datumSpann';
import {
  betalningsSplit,
  HALLPLATS_PROTO_FIXTURES,
  type HallplatsVariant,
  hallplatsSteg,
  isHallplatsVariant,
  type RegisterFilter,
  type RegisterStegFilter,
  registerOrdning,
  stegTest,
  TOMT_REGISTER_FILTER,
  vagInTest,
} from './hallplats-steg-prototyp';

/**
 * Anmälda deltagare som ARBETSKÖ — skelettet (task-18.4; S73-facit K35–K58).
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas
 * aldrig); K-referenserna pekar på den låsta konvergens-trailen.
 *
 * Formen (uppifrån och ned): fyra KLICKBARA summeringsrader i Lottas
 * utskicksordning (K42: bekräftelse → påminnelse → eventinfo) med
 * eventinfo-signalens alltid reserverade slot (K43/K44) → kategori-flikarna i
 * familje-kapseln (K41: formulär-fliken riven, formulärvägen är normen) →
 * Obekräftade ÖPPEN äldst först och Bekräftade STÄNGD senast först som
 * accordions (K40, inbox-fokus: kön i ansiktet, arkivet ett klick bort).
 * Klick på en summeringsrad ersätter accordions med en flat filtrerad lista
 * + "Rensa filtret" (K57: förklarande texter rivna — man har ju tryckt).
 *
 * PERSONKORTEN (task-18.5; S73-facit K45/K62) bor i `DeltagarKort` nedan.
 *
 * HANTERA-FLÖDET — FACIT-REVIDERAT av task-48 (S86-prototypen, Marcus-låst
 * 2026-07-25). Tre former ur task-18.6 är RIVNA och kommer inte tillbaka:
 *   · K46 — personkortets "Skicka bekräftelse" i kortfoten. Solid eller
 *     outline spelade ingen roll: en knapp per kort dräpte kortens läsbarhet.
 *   · K47/K48 — "Bekräfta alla"-pillen på Obekräftade-rubriken med sin
 *     kontrollfråga. Den bekräftade ALLA eller inget; urvalet var osynligt.
 *   · Med K46 följde `useSendConfirmation` (den optimistiska enskilda vägen
 *     från eventsidan). 1-klicks-genvägen byggs på HEM-vyn i stället —
 *     Marcus-beslut 2 på kortet. Skriv INTE in anmälans egen sida här.
 *
 * I deras ställe: ett explicit MARKERA-LÄGE (`useMarkeringsLage`) där hela
 * kortet är klickyta med checkbox-semantik, en batch-bar med live-räknare och
 * breddlås, och kontrollfrågan kvar på massmutationen. Vägen in är ENBART
 * Markera-knappen på rubrikraden; Esc och Avbryt är vägarna ut. Auto-utskicks-
 * krysset (K44) i signal-slotten är orört.
 *
 * SKELETT-AVGRÄNSNINGEN (öppet bokförd): Bor över-arbetsraden är task-18.7. Bor
 * över-raden saknas HELT ur summeringen (bas-fältet föds i 18.7 — en rad som
 * alltid visar 0 vore en osanning).
 *
 * Semantiken (ORDLISTA, S73 K53): Obekräftad/Bekräftad ligger exakt på basens
 * Status-ord — grupperingen läser `Status`, inte tidsstämpeln. Summeringsraden
 * "Anmälningsbekräftelse skickad" läser däremot utskicks-tidsstämpeln: raden är
 * en UTSKICKS-logg, gruppen är anmälans TILLSTÅND. Divergerar de visas det som
 * det är — aldrig hopslaget.
 *
 * Avbokade/ombokade räknas bort överallt (`arAktiv`, samma basformel-disciplin
 * som Betalningar-gruppen) — en avbokad anmälan är inte Lottas arbete.
 *
 * A11y (11/10): summeringsraderna är knappar med `aria-pressed` (filtret är ett
 * toggle-tillstånd); flikarna är ToggleButtonGroup (radiogroup + pilnavigering);
 * accordions bär `aria-expanded`/`aria-controls` mot panelens id; räknarna står
 * som TEXT i etiketterna (skärmläsaren får hela bilden); signal-badgen bär sin
 * text (färg aldrig ensam bärare); listorna är `<ul>`.
 */

/** Aktiv anmälan (basens 'Är aktiv'-formel): endast Avbokad/Ombokad räknas bort. */
function arAktiv(r: Registration): boolean {
  return r.status !== RegistrationStatus.AVBOKAD;
}

/** Bekräftad ⟺ basens Status har lämnat 'Obekräftad' (ORDLISTA; S73 K53). */
function arBekraftad(r: Registration): boolean {
  return r.status !== RegistrationStatus.OBEKRAFTAD;
}

/**
 * Senast skickade betalningspåminnelse: basens odelade `Betalningspåminnelse
 * skickad` ELLER någon av task-18.8:s två per-betalnings-tidsstämplar. Summan
 * "har fått en påminnelse" måste tåla båda formerna — basen bär dem parallellt
 * tills bas-maximeringen (T16) enar dem.
 */
function harPaminnelse(r: Registration): boolean {
  return (
    r.betalningspaminnelseSkickad != null ||
    r.paminnelseAnmalningsavgiftSkickad != null ||
    r.paminnelseSlutbetalningSkickad != null
  );
}

/**
 * Deltagarens beläggnings-kategori ur basens `Källa` (K16-modellen, delad med
 * Beläggnings-gruppen): TOM = via formulär (normen — inget märke, S72:s tysta
 * norm), 'Manuell' = manuellt tillagd, '+1' = medföljande, 'Väntelista' =
 * uppflyttad från kön. Väntelistan klumpas MEDVETET inte ihop med formulär-
 * normen: den är en egen väg in och syns som egen pill.
 */
type DeltagarKategori = 'formular' | 'manuell' | 'medfoljande' | 'vantelista';

function kategori(r: Registration): DeltagarKategori {
  switch (r.kalla) {
    case RegistrationSource.MANUELL:
      return 'manuell';
    case RegistrationSource.MEDFOLJANDE:
      return 'medfoljande';
    case RegistrationSource.VANTELISTA:
      return 'vantelista';
    default:
      return 'formular';
  }
}

/** Pill-etikett per kategori — normen (via formulär) får inget märke (K37). */
const KATEGORI_PILL: Partial<Record<DeltagarKategori, string>> = {
  manuell: 'Manuellt tillagd',
  medfoljande: 'Medföljande',
  vantelista: 'Från väntelistan',
};

/** Flikarnas nycklar — 'alla' plus de två kategorier som har egen flik (K41). */
type FlikNyckel = 'alla' | 'manuell' | 'medfoljande';

/**
 * Summeringsradernas filter (K40: radens siffra ÄR urvalet man ser vid klick).
 * Eventinfo-radens klick visar de som SAKNAR eventinfo — det åtgärdbara är att-
 * göra-mängden, aldrig den avklarade.
 */
type SummeringsFilter = 'obekraftade' | 'bekraftelse' | 'paminda' | 'saknarEventinfo' | 'borOver';

const FILTER_TEST: Record<SummeringsFilter, (r: Registration) => boolean> = {
  obekraftade: (r) => !arBekraftad(r),
  bekraftelse: (r) => r.bekraftelseSkickad != null,
  paminda: harPaminnelse,
  saknarEventinfo: (r) => r.deltagarinfoSkickad == null,
  // Radens SIFFRA är de ikryssade; radens KLICK öppnar däremot kryss-läget med
  // ALLA anmälda (K52 — arbetsrad, inte filterlista). Testet står kvar som
  // urvals-definition (räknaren) och för Record-fullständigheten.
  borOver: (r) => r.borOver === true,
};

/** Två veckor före eventets start — Lottas eventinfo-gräns (mail 2, K42/K44). */
const EVENTINFO_DAGAR_FORE = 14;

/** Gränsdatum (midnatt) för eventinfo-utskicket; null när startdatum saknas/ogiltigt. */
function eventinfoGrans(startdatum: string | null): Date | null {
  if (!startdatum) return null;
  const start = new Date(startdatum);
  if (Number.isNaN(start.getTime())) return null;
  const grans = new Date(start);
  grans.setDate(grans.getDate() - EVENTINFO_DAGAR_FORE);
  grans.setHours(0, 0, 0, 0);
  return grans;
}

/**
 * Dags-att-skicka-texten (K43) — härledd ur tvåveckorsgränsen, aldrig lagrad.
 * Tänder när gränsen passerats och eventet inte hunnit starta; tystnar utanför
 * fönstret. `idag` är injicerbart så beteendet är testbart utan systemklocka.
 */
function eventinfoSignal(startdatum: string | null, idag = new Date()): string | null {
  const grans = eventinfoGrans(startdatum);
  if (grans == null || !startdatum) return null;
  const start = new Date(startdatum);
  start.setHours(0, 0, 0, 0);
  const dag = new Date(idag);
  dag.setHours(0, 0, 0, 0);
  if (dag < grans || dag > start) return null;
  const dagarKvar = Math.round((start.getTime() - dag.getTime()) / 86_400_000);
  if (dagarKvar === 0) return 'Dags att skicka — eventet är idag';
  if (dagarKvar === 1) return 'Dags att skicka — eventet är imorgon';
  return `Dags att skicka — eventet är om ${dagarKvar} dagar`;
}

/**
 * Klickbar summeringsrad (K40) med KONSTANT geometri över lägena (K54-fyndet
 * "siffrorna hoppar in"): insetten (-mx-2 px-2) är alltid reserverad, aktiv
 * togglar ENBART bakgrunden.
 *
 * `signalSlot` reserverar signal-raden PERMANENT (min-h-7) — badgen tänds och
 * släcks utan att raden byter höjd (AC #3). Slotten ligger UTANFÖR filter-
 * knappen: den ska kunna bära egna interaktiva element och interaktivt-i-
 * interaktivt är förbjudet (L303/K44).
 */
function SummeringsRad({
  term,
  ikon: Ikon,
  aktiv,
  onClick,
  signalSlot = false,
  signal,
  children,
}: {
  term: string;
  /** Valfri rad-ikon före termen. */
  ikon?: LucideIcon;
  aktiv: boolean;
  onClick: () => void;
  /** Reservera signal-raden permanent (geometrin får aldrig hoppa). */
  signalSlot?: boolean;
  /** Signalens innehåll när den är tänd; null = tom reserv. */
  signal?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <button
        type="button"
        aria-pressed={aktiv}
        onClick={onClick}
        className={`-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors ${
          aktiv ? 'bg-bg-emphasized' : ''
        }`}
      >
        <span className="flex items-center gap-1.5 text-small text-text-muted">
          {Ikon && <Ikon aria-hidden="true" size={14} className="shrink-0" />}
          {term}
        </span>
        <span className="text-right text-body">{children}</span>
      </button>
      {/* min-h-8 (32 px) — badgens FAKTISKA höjd är 29 px (px-2.5 py-1 +
          text-small); en 28 px-reserv (min-h-7) växte till 29 när badgen tändes
          och raden hoppade 1 px. Mekaniskt fångat i AC #3-mätningen. */}
      {signalSlot && (
        <div data-testid="eventinfo-signal-slot" className="flex min-h-8 items-center">
          {signal}
        </div>
      )}
    </div>
  );
}

/** "X av N" med rött saknas-delta (minustecknet bär; färgen förstärker). */
function AvDelta({ klara, totalt }: { klara: number; totalt: number }) {
  const saknas = totalt - klara;
  return (
    <>
      {`${klara} av ${totalt}`}
      {saknas > 0 && (
        <span className="ml-2 font-medium text-error tabular-nums">{`−${saknas}`}</span>
      )}
    </>
  );
}

/**
 * Accordion-rubrik (K40: "dropdown-rubriker under tabbraden") — vänsterställd
 * etikett + roterande chevron; obekräftade-rubriken i varningston med ikon
 * (texten bär, färgen förstärker).
 *
 * `handling` (K47) är en valfri HANDLINGS-slot på raden — Bekräfta alla-pillen.
 * Visuellt på raden, strukturellt UTANFÖR toggle-knappen som dess syskon (L303:
 * interaktivt bor aldrig i interaktivt); toggle-knappen blir flex-1 så chevronen
 * stannar vid dess högerkant.
 */
/**
 * Grupp-rubrikraden — i TVÅ former, och skillnaden är avsiktlig.
 *
 * FÄLLBAR (Bekräftade): `oppen` + `onToggle` + `kontrollerarId` angivna ⇒ raden
 * är en disclosure-knapp med chevron och `aria-expanded`. Bekräftade är ett
 * REGISTER som växer mot hela deltagarlistan; där betalar fällningen för sig.
 *
 * FAST (Obekräftade): utelämna `onToggle` ⇒ ren rubrikrad, ingen knapp, ingen
 * chevron. Obekräftade är en KÖ som ska tömmas, inte ett arkiv att gömma: den
 * visar aldrig mer än ~3 kort (byggkrav 4 låser höjden och scrollar inuti), så
 * fällningen sparade ingen plats — den kunde bara dölja arbete som väntar.
 * Marcus design-review 2026-07-26 (S91): "varför skulle du vilja gömma den".
 * Öppen revidering av S73-facits accordion-par; kö-vs-register-distinktionen
 * är densamma som L353 landade i.
 *
 * Att fällningen fanns tvingade dessutom fram en lapp: Markera-knappen
 * måste force-öppna panelen, annars kunde läget startas i en kollapsad yta.
 * Den lappen är riven i och med detta — mekanismen behövs inte när det inte
 * går att stänga.
 */
function GruppRubrik({
  oppen,
  varning,
  kontrollerarId,
  onToggle,
  handling,
  children,
}: {
  oppen?: boolean;
  varning?: boolean;
  kontrollerarId?: string;
  onToggle?: () => void;
  /** Interaktiv handling på rubrikraden — renderas som syskon till rubriken. */
  handling?: React.ReactNode;
  children: React.ReactNode;
}) {
  const etikett = (
    <span
      className={`flex items-center gap-1.5 font-semibold text-small ${varning ? 'text-error' : ''}`}
    >
      {varning && <TriangleAlert aria-hidden="true" size={14} className="shrink-0" />}
      {children}
    </span>
  );
  return (
    <div className="flex items-center rounded-lg bg-bg-emphasized">
      {onToggle == null ? (
        <span className="flex min-w-0 flex-1 items-center px-3 py-2.5">{etikett}</span>
      ) : (
        <button
          type="button"
          aria-expanded={oppen}
          aria-controls={kontrollerarId}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left"
        >
          {etikett}
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      {/* pr-1 = 4 px — samma inset som knappens topp/botten mot baren
          (rubrik-radens py-2.5 kring 32 px-knappen; review-våg 3). */}
      {handling != null && <span className="flex shrink-0 items-center pr-1">{handling}</span>}
    </div>
  );
}

/**
 * MARKERA/AVBRYT-KNAPPEN (task-48 byggkrav 1, EMPHASIS-PARET från S91) —
 * utbruten till en egen funktion sedan konvergens-passet (S93 Del 3 beslut 3)
 * eftersom den nu har TVÅ anropsplatser: skarpa vyns `GruppRubrik`-handling
 * (oförändrad) OCH variant A:s egna högerställda rad ovanför det enade
 * registret (registret saknar sektionsrubriker att fästa knappen vid — se
 * `ArbetsKo`). Ren extraktion, ingen beteendeändring.
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
      aria-label="Markera anmälningar"
      onPress={onOppna}
    >
      Markera
    </Button>
  );
}

/** Böjer "anmälan/anmälningar" efter antal — svenskan har ingen 0-singular. */
function anmalanOrd(antal: number): string {
  return antal === 1 ? 'anmälan' : 'anmälningar';
}

/**
 * BATCHENS UTFALLS-YTA — båda riktningarna, samma plats (Marcus design-review
 * 2026-07-26, S91, fynd (c)).
 *
 * Förr tändes ytan ENBART vid partial/failed/fel: ett rent lyckat utfall var
 * den enda tysta vägen genom flödet, alltså precis tvärtemot vad som borde
 * kvitteras tydligast. Lotta tryckte skicka, läget stängde, och ingenting sa
 * att det gick igenom.
 *
 * FORM — research-grundad (web-research-disciplinen; mönstret, inte bara
 * mekanismen):
 *  · GOV.UK Design System, notification banner: den GRÖNA versionen används
 *    "to confirm that something they're expecting to happen has happened", och
 *    "should be removed when the user moves to a new page". Alltså: inline på
 *    arbetsytan, med en livslängd bunden till arbetssteget — inte en artefakt
 *    som ligger kvar. https://design-system.service.gov.uk/components/notification-banner/
 *  · Shopify Polaris, Toast: rätt form för korta framgångskvitton, MEN dess
 *    egna a11y-not varnar för att den "disappears automatically" och är svår
 *    att nå för användare med syn- eller finmotorik-begränsningar; med
 *    handling krävs ≥10 000 ms. https://polaris-react.shopify.com/components/feedback-indicators/toast
 *  · IBM Carbon, notification: inline-notiser är persistenta tills användaren
 *    avfärdar dem; toast är för passiva framgångsmeddelanden.
 *    https://carbondesignsystem.com/components/notification/usage/
 *
 * VALET: MessageBox på samma yta som felen (appen har ingen toast — den är
 * Fas 5-scope, MessageBox-docblocken). Ingen självförsvinnande timer: Polaris
 * egen varning gäller, och GOV.UK:s "removed when the user moves on" översätts
 * i en SPA till nästa arbetssteg i blocket — kvittensen rensas när markera-
 * läget öppnas igen, när fliken byts, när ett summeringsfilter växlas och när
 * nästa batch startar. Dessutom en stäng-knapp, den kontroll en toast saknar.
 *
 * SKÄRMLÄSAREN får kvittensen på det mönster som redan finns i blocket:
 * `MessageBox intent="success"` renderar `role="status"` (polite) — samma
 * live-region-form som batch-barens sr-only-räknare — OCH mutationens
 * `alertScreenReader` (den globala announcern, region i DOM före texten) är
 * kvar som den garanterade bäraren. Två bärare är medvetet: en artig
 * dubbelläsning är billigare än tystnad för den som inte ser plattan.
 */
type Utfall = { ton: 'success' | 'error'; titel: string; text: string };

/**
 * Konstant rubrik per riktning (GOV.UK: "use the same heading for green
 * notification banners within the same service" — igenkänning framför
 * variation, och rubriken bär utfallet så färgen aldrig är ensam bärare).
 */
const SKICKAT_TITEL = 'Skickat';
const MISSLYCKAD_TITEL = 'Bekräftelsen gick inte igenom';

/** Kvittensens brödtext — antalet kommer ur SERVERNS `confirmed`, aldrig urvalet. */
function skickatKvittens(antal: number): string {
  return antal === 1
    ? 'Bekräftelsen är skickad. Anmälan står nu som Bekräftad.'
    : `${antal} bekräftelser är skickade. Anmälningarna står nu som Bekräftade.`;
}

/**
 * MARKERA-LÄGETS TILLSTÅNDSMASKIN (task-48).
 *
 * Ett smalt gränssnitt över en icke-trivial tillståndsmängd: läget självt,
 * urvalet, och de avledningar UI:t behöver (antal, allaValda). Anropare rör
 * aldrig `Set`-mekaniken — de säger vad som ska hända, inte hur.
 *
 * SANERINGEN är hela skälet till att detta är en hook och inte två `useState`:
 * kandidatmängden krymper under läget (en batch bekräftar korten och de lämnar
 * kön), och ett urval som pekar på försvunna record-ID:n skulle räkna fel i
 * batch-barens etikett och skicka spök-ID:n till servern. Effekten skär bort
 * det som inte längre finns — men bara när något FAKTISKT försvunnit, annars
 * hade varje render skapat ett nytt Set och loopat.
 */
function useMarkeringsLage(kandidatIds: readonly string[]) {
  const [aktivt, setAktivt] = useState(false);
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());

  const kandidatNyckel = kandidatIds.join('|');
  useEffect(() => {
    // Töms kön helt finns ingen yta kvar att markera i — läget stänger sig
    // självt i stället för att stå aktivt mot ingenting (review-fynd 3).
    if (kandidatNyckel === '') {
      setAktivt(false);
      setValda((nu) => (nu.size === 0 ? nu : new Set()));
      return;
    }
    const kvar = new Set(kandidatNyckel.split('|'));
    setValda((nu) => {
      if (nu.size === 0) return nu;
      const sanerat = new Set([...nu].filter((id) => kvar.has(id)));
      return sanerat.size === nu.size ? nu : sanerat;
    });
  }, [kandidatNyckel]);

  const stang = useCallback(() => {
    setAktivt(false);
    setValda(new Set());
  }, []);

  // Esc lämnar läget (byggkrav 7). Dokument-nivå: läget äger hela kön, och
  // fokus kan stå på vilket kort som helst när Lotta vill backa ur.
  useEffect(() => {
    if (!aktivt) return;
    const vidTangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stang();
    };
    document.addEventListener('keydown', vidTangent);
    return () => document.removeEventListener('keydown', vidTangent);
  }, [aktivt, stang]);

  return {
    aktivt,
    valda,
    antal: valda.size,
    allaValda: kandidatIds.length > 0 && valda.size === kandidatIds.length,
    oppna: useCallback(() => setAktivt(true), []),
    stang,
    vaxla: useCallback((id: string, vald: boolean) => {
      setValda((nu) => {
        const next = new Set(nu);
        if (vald) next.add(id);
        else next.delete(id);
        return next;
      });
    }, []),
    markeraAlla: useCallback(() => setValda(new Set(kandidatIds)), [kandidatIds]),
    rensa: useCallback(() => setValda(new Set()), []),
  };
}

/**
 * BATCH-BAREN (task-48 byggkrav 3) — markera-lägets handlingsyta, ovanför kön.
 *
 * §19: solid success på bekräfta-knappen är förenligt med emphasis-regeln —
 * baren ÄR blockets primära handlingsyta (inte en kort- eller radyta), och
 * handlingen når utomstående (bekräftelsemail). Markera alla är neutral
 * stödform (secondary), Rensa lågviktad (ghost) och dyker upp först när det
 * finns något att rensa.
 *
 * BREDDLÅSET: etiketten växlar mellan "0/1/6/99 anmälningar" och skulle annars
 * få knappen att ändra bredd under fingret vid varje klick. En osynlig
 * platshållare i tvåsiffrig maxform sätter bredden en gång; den synliga texten
 * ligger i samma grid-cell ovanpå med `tabular-nums` så siffran inte heller
 * rör sig inom sin egen bredd. Platshållaren är `aria-hidden` — knappens
 * tillgängliga namn är den SYNLIGA texten.
 *
 * KONTROLLFRÅGAN (byggkrav 6, PRD task-18 beslut 7 + 20) sitter på
 * bekräfta-knappen: massmutationer passerar alltid en confirm-grind. Bulken är
 * pessimistisk — knappen står i "Skickar…" tills servern svarat, så ett halvt
 * utfall aldrig visas som helt.
 *
 * [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 beslut 1/4/5) — `onBekrafta`
 * satt ⇒ SKARPA vyns oförändrade "Bekräfta"-flöde (ovan, DialogTrigger +
 * kontrollfråga). `onBekrafta` utelämnad (variant A ENDAST) ⇒ primärknappen
 * byter text till "Åtgärder": utskicket flyttar till åtgärds-sidan (byggs i
 * ett eget senare pass), så DENNA knapp öppnar bara en inline-platshållare
 * (litet kort, INTE en riktig sida) — bekräfta-mutationen och kontrollfrågan
 * är rivna ur variant-läget, inte bara dolda.
 */
function MarkeringsBatchBar({
  antal,
  totalt,
  allaValda,
  pending,
  onBekrafta,
  onMarkeraAlla,
  onRensa,
  valdaNamn,
}: {
  antal: number;
  totalt: number;
  allaValda: boolean;
  pending: boolean;
  /** Skarpa vyn: bekräfta-mutationen bakom kontrollfrågan. Utelämnad ⇒
      variant-A-läget (se `valdaNamn`) — exakt en av de två är alltid satt. */
  onBekrafta?: () => Promise<void>;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  /** [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST: satt ⇒ "Åtgärder"-
      läget. De markerades namn, i visningsordning — visas i platshållaren. */
  valdaNamn?: string[];
}) {
  const [visaPlatshallare, setVisaPlatshallare] = useState(false);
  const platshallareId = useId();
  const atgarderLage = valdaNamn != null;

  return (
    <>
      <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2 pb-2.5">
        {onBekrafta ? (
          <DialogTrigger>
            <Button intent="success" size="sm" isDisabled={antal === 0 || pending}>
              <Mail aria-hidden="true" size={14} className="shrink-0" />
              <span className="grid">
                {/* Breddlåsets platshållare — tvåsiffrig maxform, aldrig läst av AT. */}
                <span
                  aria-hidden="true"
                  className="invisible col-start-1 row-start-1 whitespace-nowrap"
                >
                  Bekräfta 99 anmälningar
                </span>
                <span className="col-start-1 row-start-1 whitespace-nowrap tabular-nums">
                  {`Bekräfta ${antal} ${anmalanOrd(antal)}`}
                </span>
              </span>
            </Button>
            {/* isKeyboardDismissDisabled under sändning (review-fynd 5): båda
                dialogknapparna är isDisabled={pending} för att skydda en pågående
                batch — utan detta gick Escape förbi spärren, dialogen försvann mitt
                i "Skickar…" och Lotta stod utan återkoppling. */}
            <Modal isDismissable isKeyboardDismissDisabled={pending}>
              <Dialog
                title="Skicka bekräftelse?"
                actions={({ close }) => (
                  <>
                    <Button intent="ghost" onPress={close} isDisabled={pending}>
                      Avbryt
                    </Button>
                    <Button
                      intent="success"
                      isDisabled={pending}
                      onPress={async () => {
                        await onBekrafta();
                        close();
                      }}
                    >
                      {pending
                        ? 'Skickar…'
                        : `Skicka ${antal} ${antal === 1 ? 'bekräftelse' : 'bekräftelser'}`}
                    </Button>
                  </>
                )}
              >
                {`Bekräftelsemailet skickas till ${antal} obekräftad${antal === 1 ? '' : 'a'} ${anmalanOrd(
                  antal,
                )}, och ${antal === 1 ? 'anmälan blir Bekräftad' : 'anmälningarna blir Bekräftade'}. Det går inte att ångra.`}
              </Dialog>
            </Modal>
          </DialogTrigger>
        ) : (
          <Button
            intent="primary"
            size="sm"
            isDisabled={antal === 0}
            aria-expanded={visaPlatshallare}
            aria-controls={platshallareId}
            onPress={() => setVisaPlatshallare((v) => !v)}
          >
            Åtgärder
          </Button>
        )}
        <Button
          intent="secondary"
          size="sm"
          isDisabled={allaValda || pending}
          onPress={onMarkeraAlla}
        >
          Markera alla
        </Button>
        {antal > 0 && (
          <Button intent="ghost" size="sm" isDisabled={pending} onPress={onRensa}>
            Rensa
          </Button>
        )}
        {/* Live-räknaren: seende ser antalet i knappen, skärmläsaren får det här.
            `polite` — urvalet är löpande arbete, aldrig ett avbrott värt assertive. */}
        <span
          data-testid="markering-live"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {`${antal} av ${totalt} markerade`}
        </span>
      </div>
      {/* [PROTOTYPE] [S93] konvergens-pass, "Åtgärder"-platshållaren (Del 3
          beslut 5) — litet kort, INTE en riktig sida. Renderas som EGEN
          syskon-div (inte inuti raden ovan) så skarpa vyns DOM (onBekrafta
          satt) är BYTE-IDENTISK med före denna ändring. */}
      {atgarderLage && visaPlatshallare && (
        <div
          id={platshallareId}
          data-testid="atgarder-platshallare"
          className="mb-2.5 rounded-xl border border-(--mm-navcard-border) bg-surface p-3 text-small contrast-more:border-(--mm-navcard-border-contrast)"
        >
          <p className="font-medium">
            {`Åtgärds-sidan — eget prototyp-pass; ${antal} mottagare medtagna`}
          </p>
          {(valdaNamn?.length ?? 0) > 0 && (
            <ul className="mt-1.5 flex flex-col gap-0.5 text-text-secondary">
              {(valdaNamn ?? []).map((namn) => (
                <li key={namn}>{namn}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

/** ISO-datum (YYYY-MM-DD) ur ett Date — lokal tid, aldrig UTC-skiftat (T27-klassen). */
function isoDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * AUTO-UTSKICKS-KRYSSET (K44) i signal-slotten: ikryssat = eventinfon är schemalagd
 * att gå ut automatiskt på datumet; urkryssat = inget automatiskt utskick. NEUTRAL
 * ton — urkryssat är ett medvetet val, inte ett fel (skilt från betalkryssens röda
 * obetalt-semantik).
 *
 * Läser och skriver de två ADDITIVA bas-fälten (task-18.6): 'Deltagarinfo schemalagd'
 * (datum) och 'Deltagarinfo auto-utskick avstängt' (opt-out). Saknas ett schemalagt
 * datum i basen visas tvåveckorsgränsen — och det är också datumet som SKRIVS när
 * krysset sätts på, så basen bär ett verkligt datum efteråt.
 *
 * ÖPPET BOKFÖRT (PRD task-18 §Utanför omfattningen): utskicks-MOTORN finns inte än.
 * Krysset styr fälten som motorn ska läsa — det utför inget utskick självt.
 */
function AutoKryss({ event }: { event: Event }) {
  const grans = eventinfoGrans(event.startdatum ?? null);
  const { mutate, isPending } = useUpdateEvent(event.id);
  // Optimistisk överlagring UNDER sparandet (hooken är pessimistisk): krysset får
  // aldrig stå still under fingret. Nollas när mutationen landat — därefter styr
  // cachen (servern är sanningen).
  const [underSparande, setUnderSparande] = useState<boolean | null>(null);

  if (grans == null) return null;

  const faktiskt = !(event.deltagarinfoAutoAvstangt ?? false);
  const vald = underSparande ?? faktiskt;
  const datum = event.deltagarinfoSchemalagd ?? isoDatum(grans);
  const datumText = DAGMANAD.format(new Date(datum));

  return (
    <Checkbox
      isSelected={vald}
      isDisabled={isPending}
      onChange={(v) => {
        setUnderSparande(v);
        mutate(
          {
            deltagarinfoAutoAvstangt: !v,
            // Sätts krysset PÅ skrivs datumet med (basen ska bära schemat, inte bara
            // frånvaron av opt-out). Kryssas det UR rörs datumet inte — så att
            // återkryssning behåller Lottas eventuella egna datum.
            ...(v ? { deltagarinfoSchemalagd: datum } : {}),
          },
          { onSettled: () => setUnderSparande(null) },
        );
      }}
      className="group flex cursor-pointer items-center gap-2 text-small text-text-secondary"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {vald ? `Schemalagt att skickas automatiskt ${datumText}` : 'Skickas inte automatiskt'}
    </Checkbox>
  );
}

/** Klockslag ur en dateTime ('09:00'); null/ogiltigt → null (Gunilla: aldrig rå ISO). */
const KLOCKSLAG = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' });

/** Dag + månad ur en ISO-tidsstämpel ('26 juni'); null/ogiltigt → null. */
function dagManad(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : DAGMANAD.format(d);
}

/**
 * "Anmäld 1 juli 09:00" på EN rad (K45 — metaytans avbrusning; basens
 * `Inskickad` är en dateTime). Saknad/ogiltig tidsstämpel ⇒ null ⇒ raden
 * uteblir helt: "Anmäld —" vore brus utan innehåll.
 */
function anmaldText(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const d = new Date(reg.inskickad);
  if (Number.isNaN(d.getTime())) return null;
  return `Anmäld ${DAGMANAD.format(d)} ${KLOCKSLAG.format(d)}`;
}

/**
 * SENASTE betalningspåminnelsen över basens tre parallella tidsstämplar
 * (odelad `Betalningspåminnelse skickad` + task-18.8:s två per-betalnings-fält).
 * Metaytan visar EN påminnelserad — det Lotta behöver veta är när hon senast
 * jagade, inte vilket fält basen råkar bära den i (T16 enar dem).
 */
function senastePaminnelse(reg: Registration): string | null {
  const kandidater = [
    reg.betalningspaminnelseSkickad,
    reg.paminnelseAnmalningsavgiftSkickad,
    reg.paminnelseSlutbetalningSkickad,
  ].filter((v): v is string => v != null && !Number.isNaN(Date.parse(v)));
  if (kandidater.length === 0) return null;
  return kandidater.reduce((senast, v) => (Date.parse(v) > Date.parse(senast) ? v : senast));
}

/** En rad i metaytan — ikon + text, aldrig interaktiv (K62/L303). */
function MetaRad({ ikon: Ikon, children }: { ikon: LucideIcon; children: React.ReactNode }) {
  return (
    <span data-testid="deltagar-meta-rad" className="flex items-center gap-1">
      <Ikon aria-hidden="true" size={12} className="shrink-0" />
      {children}
    </span>
  );
}

/**
 * Personkortet (task-18.5; S73-facit K45 + K62).
 *
 * IDENTITETSZONEN (namn i fetstil + E-post etikett-över-värde) ÄR person-
 * klickytan — kort-med-titellänk-mönstret: klickytan koncentreras till
 * identiteten i stället för hela kortet, så metaytan kan bära egna element.
 * Saknas person-kopplingen renderas zonen som ren text — en länk till
 * `/personer/null` vore en trasig affordans.
 *
 * PILLARNA står UTANFÖR länken: Obekräftad är anmälans TILLSTÅND och kategorin
 * dess VÄG IN — ingetdera är en del av personens identitet, och att bädda in
 * dem i länken hade gjort dess tillgängliga namn till "Anna Ek Obekräftad
 * Medföljande". Normen (via formulär) bär inget märke alls (tysta normen, K37).
 *
 * METAYTAN är syskon till länken (K62/K44/L303 — interaktivt bor aldrig i
 * interaktivt): "Anmäld dag + klockslag" på EN rad, därunder ENDAST UTFÖRDA
 * åtgärder på var sin rad i Lottas utskicksordning (bekräftelse → påminnelse →
 * eventinfo, K42). Ej-skickat visas ALDRIG — frånvaron är informationen, och
 * summeringsraderna ovan bär "hur många saknar".
 *
 * HISTORIKRADEN sist, med HELA namnet "Miranon Media" (Marcus-ordern K45).
 * Siffran är PERSONENS `Antal genomförda event` — exakt den räknare task-18.4
 * införde i shapen, ingen andra väg till samma tal. Är den okänd (null: ingen
 * person-koppling, eller EF:ens event-lösa gren) uteblir raden: "Första
 * eventet" om en okänd person vore en osanning.
 *
 * ANMÄLD-RADENS LÄNKMÅL (AC #2, rev. 2026-07-23 review-våg 2): PRD task-18
 * p18:s olänkad-beslut REVS ÖPPET av Marcus — facit-K62-formen gäller:
 * understruken rad med "Öppna anmälan"-namnet. Sedan task-18.17 är raden en
 * riktig Link till per-anmälan-detaljvyn (/event/$eventId/anmalan/
 * $registrationId) med PREFETCH PÅ AVSIKT (INSTANT, ADR-078): get-registration
 * (~1–3 s varm mot staging) startar vid hover/fokus — den tidigaste ärliga
 * öppnings-signalen — i stället för vid klicket; React Query dedupar, och
 * detaljvyns placeholder står dessutom på list-cachen den här sidan redan bär.
 */
/**
 * Kortets INNEHÅLL — delat av båda lägena så formen aldrig kan driva isär.
 *
 * `lankat` styr AFFORDANSEN, inte innehållet: i markera-läget vilar person-
 * och anmälnings-länkarna (Marcus-beslut 1, väg A — iOS edit-mode-
 * konventionen) och samma text renderas som ren text. Det är också det som
 * gör hela kortet till en laglig checkbox: utan ankare inuti bryts aldrig
 * L303 (interaktivt bor aldrig i interaktivt).
 *
 * `vald` styr pill-raden: Obekräftad-pillen VIKER för markeringen (byggkrav 2
 * — ingen 'Vald'-pill ersätter den). Kategori-pillen står kvar i båda lägena:
 * vägen in är inte ett urvalstillstånd. WCAG 1.4.1-bäraren är kortets kant,
 * inte en glyf här — se MarkerbartKort.
 */
function KortInnehall({
  reg,
  eventId,
  lankat,
  vald,
  hallplatsMarke,
}: {
  reg: Registration;
  eventId: string;
  lankat: boolean;
  vald: boolean;
  /** [PROTOTYPE] [S93] Steg-märket — undefined utanför hållplats-prototypen
      (default, zero-behaviour-change; se DeltagareHallplatsPrototyp.tsx). */
  hallplatsMarke?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const forberedAnmalan = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.registrations.detail(reg.id),
      queryFn: () => dataSource.fetchRegistration(reg.id),
      staleTime: 30_000,
    });
  };
  const pill = KATEGORI_PILL[kategori(reg)];
  const namn = displayName(reg);
  const anmald = anmaldText(reg);
  const bekraftelse = dagManad(reg.bekraftelseSkickad);
  const paminnelse = dagManad(senastePaminnelse(reg));
  const eventinfo = dagManad(reg.deltagarinfoSkickad);
  const genomforda = reg.antalGenomfordaEvent;

  const identitet = (
    <>
      <span data-testid="deltagar-namn" className="break-words font-semibold text-body">
        {namn}
      </span>
      <span className="text-caption text-text-muted">E-post</span>
      <span className="break-words text-small">
        {reg.email ?? <span className="text-text-muted">Saknas</span>}
      </span>
    </>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        {lankat && reg.personId ? (
          <Link
            to="/personer/$personId"
            params={{ personId: reg.personId }}
            className="flex min-w-0 flex-1 flex-col gap-0.5"
          >
            {identitet}
          </Link>
        ) : (
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">{identitet}</span>
        )}
        {/* Pillarna får WRAPPA i stället för att tvinga identitetskolumnen smal:
            på 390 px åt "Obekräftad" + "Manuellt tillagd" som shrink-0-rad upp
            så mycket bredd att namnet radbröts och e-posten bröts MITT I ORDET
            ("bertil@exa/mple.se"). Fångat i facit-avprickningens 390-px-mätning.
            Staplade pillar i högerkanten är den graciösa degraderingen; på
            bredare ytor står de kvar på EN rad som i facit.

            PILL-SLOTTEN ÄR RESERVERAD, INTE INNEHÅLLS-STYRD (Marcus
            design-review 2026-07-26, S91, fynd (e) — sågtanden). `max-w-[45%]`
            lät slottens bredd följa pillarna, och eftersom identitetskolumnen
            är `flex-1` mot samma rad ÄRVDE den variationen: uppmätt på 430 px
            fick ett kort MED kategori-pill 157,95 px identitetsbredd och ett
            UTAN 214,33 px — e-posten radbröts bara i det smala fallet, och
            korten sågtandade 166/145/166/145. Samma mekanism på 390 px i
            arkivet (170,58 mot 278 px ⇒ 188/167).

            Marcus hypotes var pill-radens HÖJD; mätningen falsifierade den och
            är bokförd öppet på kortet: pill-kolumnen mäter 22 px (en rad) resp.
            50 px (två) mot identitetskolumnens 67 px — den är ALDRIG radens
            högsta element och kan därför inte driva korthöjden. Bäraren är
            BREDDEN. En reserverad slot (samma hus-mönster som signal-slottens
            `min-h-8`) ger varje kort identisk identitetsbredd, vilket gör både
            sågtanden och en dold INOM-kort-instabilitet omöjliga: när
            Obekräftad-pillen viker vid val krympte slotten förr från 139,05 →
            107,42 px, e-posten fick plats igen och kortet HOPPADE 166 → 145
            mitt under fingret (uppmätt före fixen på 430 px).

            7,5rem = 120 px rymmer den bredaste pillen med marginal — uppmätta
            naturliga bredder: "Från väntelistan" 110,95 · "Manuellt tillagd"
            107,42 · "Medföljande" 90,09 · "Obekräftad" 82,67. Två pillar
            samtidigt ryms aldrig på en rad här och staplas som förr (den
            avsiktliga 390-px-lösningen). En framtida bredare pill radbryter
            inuti sin egen pill (två pill-rader = 50 px < identitetens 67) och
            påverkar fortfarande inte höjden. Från `sm` och uppåt är kortets
            innermått ~479–500 px och 45 % (≥215 px) rymmer BÅDA pillarna på en
            rad — facit-formen på breda ytor — utan att identitetskolumnen blir
            trång (mätt: ingen sågtand på 768/1280 varken före eller efter). */}
        <span className="flex w-30 shrink-0 flex-wrap items-center justify-end gap-1.5 sm:w-[45%]">
          {/* [PROTOTYPE] [S93] review-fix-våg 2 (defekt 3) — i en hållplats-
              variant BÄR steg-märket (`hallplatsMarke`) redan exakt samma
              information ("Väntar på bekräftelse") som denna röda status-pill.
              Två märken på samma axel för samma person var dubbel-etikettering
              (granskningsfynd); steg-märket ERSÄTTER pillen i variant-läge. */}
          {!arBekraftad(reg) && !vald && !hallplatsMarke && (
            <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {/* ITERATIONSVÅG (Marcus 2026-08-05): "De här pillsen som sitter på
              kortet 'Medföljande' och 'Manuell' kan vi då ersätta med
              statuspillen som just nu sitter under mail-adressen."

              STEG-MÄRKET OCH KATEGORI-PILLEN BYTER ALLTSÅ INTE PLATS — märket
              flyttar UPP hit och kategorin utgår ur kortet helt. Marcus svar på
              den direkta frågan: "det räcker att den är filtrerbar, vi testar
              de först." Vägen in blir i stället en dimension i registrets
              filterpanel, så informationen finns kvar men tar ingen kortyta.

              Detta ÅTERSTÄLLER inte review-fix-våg 2 (defekt 3) ovan: den fixen
              förbjöd TVÅ märken på samma axel samtidigt, och det gäller fortsatt
              — Obekräftad-pillen viker fortfarande för steg-märket. Skillnaden
              är bara VAR det enda kvarvarande märket sitter.

              Skarpa vyn (`hallplatsMarke` undefined) är ORÖRD: där står
              kategori-pillen kvar precis som förut. */}
          {hallplatsMarke ??
            (pill && (
              <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
                {pill}
              </span>
            ))}
        </span>
      </div>
      <div
        data-testid="deltagar-metayta"
        className="flex flex-col gap-1 px-4 pt-2.5 pb-3 text-caption text-text-muted"
      >
        {/* ITERATIONSVÅG (Marcus 2026-08-05): steg-märket bor inte längre här —
            det flyttade upp i pill-slotten och ersatte kategori-pillen. Se
            pill-slotten ovan för hela motiveringen. */}
        {anmald &&
          (lankat ? (
            <Link
              to="/event/$eventId/anmalan/$registrationId"
              params={{ eventId, registrationId: reg.id }}
              aria-label={`Öppna anmälan för ${namn}`}
              data-testid="deltagar-meta-rad"
              onMouseEnter={forberedAnmalan}
              onFocus={forberedAnmalan}
              className="flex items-center gap-1 self-start underline underline-offset-2"
            >
              <Inbox aria-hidden="true" size={12} className="shrink-0" />
              {anmald}
            </Link>
          ) : (
            <MetaRad ikon={Inbox}>{anmald}</MetaRad>
          ))}
        {/* ITERATIONSVÅG (Marcus 2026-08-05, punkt 2): "Nej inte på kortet. Vi
            måste få in utskickshistoriken under 'Öppna detaljer' på något sätt."
            De tre utskicksraderna renderas därför INTE i variant-läge — de bor
            nu i arbetsytans SKICKAT-zon (Betalningar.tsx § BetalningsPersonRad),
            komplett med betalningspåminnelserna som redan låg där. Skarpa vyn
            (`hallplatsMarke` undefined) behåller dem OFÖRÄNDRADE. */}
        {!hallplatsMarke && bekraftelse && (
          <MetaRad ikon={MailCheck}>{`Bekräftelse ${bekraftelse}`}</MetaRad>
        )}
        {!hallplatsMarke && paminnelse && (
          <MetaRad ikon={MailCheck}>{`Påminnelse ${paminnelse}`}</MetaRad>
        )}
        {!hallplatsMarke && eventinfo && (
          <MetaRad ikon={MailCheck}>{`Eventinfo ${eventinfo}`}</MetaRad>
        )}
        {genomforda != null && (
          <span data-testid="deltagar-historik" className="mt-0.5 flex items-center gap-1.5">
            <History aria-hidden="true" size={12} className="shrink-0" />
            {genomforda === 0
              ? 'Första eventet hos Miranon Media'
              : `${genomforda} tidigare event hos Miranon Media`}
          </span>
        )}
      </div>
    </>
  );
}

/**
 * VILANDE personkort (task-18.5; S73-facit K45 + K62) — kortet Lotta läser.
 *
 * K46-RIVNINGEN (task-48 byggkrav 2, öppet bokförd): kortfotens "Skicka
 * bekräftelse" är BORTA, även här i vilande läge. Enskild bekräftelse från
 * eventsidan finns inte längre — bekräftelser skickas i batch via markera-
 * läget, och 1-klicks-genvägen byggs på HEM-vyn där den hör hemma
 * (Marcus-beslut 2 på kortet). Skriv INTE in anmälans egen sida som
 * ersättare här.
 *
 * Kortet behåller ALLT annat: person-länken på identitetszonen, Anmäld-radens
 * länk med prefetch på avsikt (18.17/ADR-078), historikraden (K45), pillar och
 * metayta. Prototypens avsaknad av dem var en förenkling, inte facit.
 */
function DeltagarKort({
  reg,
  eventId,
  hallplatsMarke,
}: {
  reg: Registration;
  eventId: string;
  /** [PROTOTYPE] [S93] — se KortInnehall. */
  hallplatsMarke?: React.ReactNode;
}) {
  return (
    <div
      data-testid="deltagar-kort"
      className="flex flex-col rounded-xl border border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <KortInnehall
        reg={reg}
        eventId={eventId}
        lankat
        vald={false}
        hallplatsMarke={hallplatsMarke}
      />
    </div>
  );
}

/**
 * MARKERBART kort (task-48 byggkrav 2) — hela kortet ÄR kryssrutan.
 *
 * Rå RAC Checkbox per BorOverRad-precedenten (Marcus-beslut 1): länkarna vilar
 * i läget, så ingen GridList och ingen ny primitiv behövs — kravet på
 * "aria-multiselectable-form" uppfylls av N fristående checkboxar med var sitt
 * tillgängliga namn. Namnet kommer ur kortets egen text (namn + e-post +
 * metarader), vilket är exakt vad en skärmläsaranvändare behöver för att veta
 * VAD som markeras.
 *
 * Formen: `--mm-success-bg` platta + `--mm-success` kant när vald, annars
 * kortets vanliga yta. Kant-BOXEN finns i båda lägena så geometrin aldrig
 * hoppar vid val.
 *
 * KANTEN ÄR WCAG 1.4.1-BÄRAREN — riv den inte, och tona inte ned den.
 * Ovalt kort har `--mm-navcard-border: transparent`, alltså INGEN synlig
 * kontur; valt kort får `--mm-success` (#606b57). Skillnaden mellan lägena är
 * därför att en kontur UPPSTÅR — närvaro/frånvaro av ett visuellt element, inte
 * ett färgbyte — och det är precis det som gör att valt tillstånd inte vilar på
 * färg ensam. Uppmätt 2026-07-26 (S91): kanten mot vitt 5,6:1 (1.4.11 kräver
 * 3:1); under `prefers-contrast: more` står den mot `--mm-border-strong`
 * (#c4c4c2) på 3,2:1 i ren ljushet, alltså läsbar även utan färgseende.
 * Den gröna plattan mäter 1,05:1 mot vitt och bär i praktiken INGENTING för
 * den färgblinde — den är dekor ovanpå signalen. Görs kanten någon gång
 * ljusare, villkorad eller borttagen faller 1.4.1 direkt, oavsett hur tydligt
 * det gröna ser ut för den som ser färg.
 *
 * Byggkrav 7:s check-glyf (`CheckCheck` i pill-radens frigjorda plats) är RIVEN
 * 2026-07-26 på Marcus-beslut i design-reviewen: mätningen ovan visar att den
 * inte behövdes, och dubbel-bocken läste dessutom som "skickat och läst" på ett
 * kort vars hela poäng är att något strax SKA skickas. Öppen revidering av ett
 * låst byggkrav — bokförd på task-48 och i DESIGN-SYSTEM-SPEC §19.
 */
function MarkerbartKort({
  reg,
  eventId,
  vald,
  onChange,
  hallplatsMarke,
}: {
  reg: Registration;
  eventId: string;
  vald: boolean;
  onChange: (vald: boolean) => void;
  /** [PROTOTYPE] [S93] — se KortInnehall. */
  hallplatsMarke?: React.ReactNode;
}) {
  return (
    <Checkbox
      data-testid="markerbart-kort"
      isSelected={vald}
      onChange={onChange}
      // contrast-more-kanten bor i VARDERA grenen, aldrig i bas-klasserna:
      // Tailwind-varianten vinner över den ovillkorade `border-(--mm-success)`
      // och gav annars valda kort den NEUTRALA kortkanten i förhöjd kontrast —
      // exakt de användare regeln finns för tappade urvals-signalen (review-fynd 6).
      className={`flex cursor-pointer flex-col rounded-xl border ${
        vald
          ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
          : 'border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)'
      }`}
    >
      <KortInnehall
        reg={reg}
        eventId={eventId}
        lankat={false}
        vald={vald}
        hallplatsMarke={hallplatsMarke}
      />
    </Checkbox>
  );
}

/**
 * BOR ÖVER-KRYSSRADEN (task-18.7; S73-facit K50/K52). En RAC Checkbox i
 * betalnings-kryssets ruta-grammatik (samma size-5-ruta som AutoKryss ovan) +
 * personkortens radform; säng-glyfen tänds när personen är ikryssad. Obockad är
 * NEUTRAL — att inte bo över är normalläget, inte en avvikelse (skilt från
 * betalkryssets röda obetalt-semantik).
 *
 * Precedent 18.8: rå RAC-Checkbox, INTE lyft till Mm-primitiv (kryss-läget är
 * den enda konsumenten; en primitiv utan andra användare vore spekulation).
 * Kortet ÄR kryssrutan (hela raden är klickytan) — ingen inbäddad interaktiv
 * länk, så L303:s interaktivt-i-interaktivt-förbud hålls; namnet är ren text.
 *
 * A11y: RAC ger `role="checkbox"` + `aria-checked`; det tillgängliga namnet
 * kommer ur radens text (namn + ev. kategori-pill). Kategori-pillen är samma
 * märke som personkortens (via formulär = tyst norm, inget märke, K37).
 */
function BorOverRad({
  reg,
  onToggle,
  disabled = false,
}: {
  reg: Registration;
  onToggle: (reg: Registration, borOver: boolean) => void;
  /** [PROTOTYPE] [S93] review-fix — `?data=proto`: kontrollen görs read-only
      (native disabled-semantik), ingen mutation avfyras (se toggleBorOver). */
  disabled?: boolean;
}) {
  const pill = KATEGORI_PILL[kategori(reg)];
  return (
    <Checkbox
      data-testid="bor-over-rad"
      isSelected={reg.borOver === true}
      isDisabled={disabled}
      onChange={(v) => onToggle(reg, v)}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-text group-data-[selected]:bg-text">
        <Check
          aria-hidden="true"
          size={14}
          className="text-text-inverse opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span data-testid="bor-over-namn" className="truncate font-semibold text-body">
          {displayName(reg)}
        </span>
        {pill && (
          <span className="shrink-0 rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
            {pill}
          </span>
        )}
      </span>
      <BedDouble
        aria-hidden="true"
        size={16}
        className={`shrink-0 ${reg.borOver === true ? 'text-text' : 'text-text-muted opacity-40'}`}
      />
    </Checkbox>
  );
}

/** K57: högerställd "Rensa filtret"-rad. Utbruten sedan konvergens-passet
    (S93 Del 3): TVÅ anropsplatser (skarpa vyns/`filter`-drivna branch,
    oförändrad · variant A:s enade register, som måste nolla FLER filter-
    states — se `ArbetsKo`s `rensaAllaFilterA`). Ren extraktion. */
function RensaFiltretKnapp({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-1.5 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="font-medium text-small underline-offset-2 hover:underline"
      >
        Rensa filtret
      </button>
    </div>
  );
}

/** KRYSS-LÄGET (K52): ALLA visade anmälda i EN kolumn, säng-kryss per rad.
    Utbruten sedan konvergens-passet (S93 Del 3): TVÅ anropsplatser (skarpa
    vyns/`filter`-drivna branch, oförändrad · variant A:s enade register —
    "Bor över"-raden är delad, oförändrad, mellan varianterna). Ren
    extraktion, ingen beteendeändring. */
function BorOverKrysslage({
  lista,
  protoDataMode,
  onToggle,
}: {
  lista: Registration[];
  protoDataMode: boolean;
  onToggle: (reg: Registration, borOver: boolean) => void;
}) {
  if (lista.length === 0) {
    return <p className="py-2 text-small text-text-secondary">Inga deltagare i denna kategori.</p>;
  }
  return (
    <>
      {/* [PROTOTYPE] [S93] review-fix — delad förklaringstext (uppdraget
          § FYND 2): "liten text"-delen; per-rad `title` (BorOverRad) bär
          hover-formen. */}
      {protoDataMode && (
        <p className="pb-1 text-caption text-text-muted">
          Förhandsvisning (proto) — Bor över är inaktiverad nedan, inget sparas.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {lista.map((reg) => (
          <li
            key={reg.id}
            title={
              protoDataMode ? 'Inaktiverad i förhandsvisningen (proto) — inget sparas' : undefined
            }
          >
            <BorOverRad reg={reg} onToggle={onToggle} disabled={protoDataMode} />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Kortlistan. `markering` != null ⇒ markera-läget: korten blir kryssrutor.
 *
 * `rullande` (byggkrav 4) ger OBEKRÄFTADE-kön sin egen höjd: ~3 kort syns och
 * klippet mitt i det fjärde ÄR scroll-affordansen — kön får aldrig trycka ned
 * resten av sidan när inflödet är stort. Rullningsytan är ett riktigt tab-stopp
 * (axe scrollable-region-focusable; NyaAnmalningarCard-precedenten) så
 * tangentbordsanvändare når korten längre ned.
 */
function DeltagarListan({
  rader,
  eventId,
  rullande = false,
  testId,
  markering,
  hallplatsMarke,
  ariaLabel = 'Obekräftade anmälningar',
}: {
  rader: Registration[];
  /** Eventets record-ID — kortens Anmäld-rad länkar till anmälans sida (18.17). */
  eventId: string;
  /** Begränsa höjden till ~3 kort och rulla inline (byggkrav 4). */
  rullande?: boolean;
  testId?: string;
  /** Markera-lägets koppling; null = vilande läge med länkar. */
  markering?: {
    valda: ReadonlySet<string>;
    vaxla: (id: string, vald: boolean) => void;
  } | null;
  /** [PROTOTYPE] [S93] Per-rad steg-märke; undefined = ingen (skarpa vyn). */
  hallplatsMarke?: (reg: Registration) => React.ReactNode;
  /** Tab-stoppets aria-label när `rullande` faktiskt klipper (kanRulla).
      [PROTOTYPE] [S93] konvergens-passet lade till propen (default =
      skarpa vyns oförändrade text) — variant A:s enade register skickar en
      egen etikett, se `ArbetsKo`. */
  ariaLabel?: string;
}) {
  const rullKlasser = rullande
    ? 'focus-ring-inset scrollbar-inline max-h-[25.5rem] overflow-y-auto pr-2.5'
    : '';
  // Tabb-stoppet hör till RULLNINGEN, inte till listan: under fyra kort ryms
  // allt och ett fokuserbart område utan funktion vore ett tomt stopp i
  // tangentbordsflödet (review-småfynd). Fyra är gränsen där max-h börjar bita.
  const kanRulla = rullande && rader.length > 3;
  return (
    <ul
      data-testid={testId}
      tabIndex={kanRulla ? 0 : undefined}
      aria-label={kanRulla ? ariaLabel : undefined}
      className={`flex flex-col gap-2.5 ${rullKlasser}`}
    >
      {rader.map((reg) => (
        <li key={reg.id}>
          {markering ? (
            <MarkerbartKort
              reg={reg}
              eventId={eventId}
              vald={markering.valda.has(reg.id)}
              onChange={(vald) => markering.vaxla(reg.id, vald)}
              hallplatsMarke={hallplatsMarke?.(reg)}
            />
          ) : (
            <DeltagarKort reg={reg} eventId={eventId} hallplatsMarke={hallplatsMarke?.(reg)} />
          )}
        </li>
      ))}
    </ul>
  );
}

function ArbetsKo({
  event,
  registreringar,
  protoVariant = null,
  protoDataMode = false,
}: {
  event: Event;
  registreringar: Registration[];
  /** [PROTOTYPE] [S93] hållplats-pass — null = skarpa vyn, orörd. */
  protoVariant?: HallplatsVariant | null;
  /** [PROTOTYPE] [S93] `?data=proto` — stubbar bekräfta-mutationen (§ DATA). */
  protoDataMode?: boolean;
}) {
  const panelId = useId();
  const [flik, setFlik] = useState<FlikNyckel>('alla');
  const [filter, setFilter] = useState<SummeringsFilter | null>(null);
  // [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus 2026-08-05) — ETT filtertillstånd
  // för hela registret, i stället för de TRE separata proto-states som fanns
  // här förut (`hallplatsFilter` · `protoBetalningsFilter` ·
  // `protoAvbokadeAktiv`, alla ömsesidigt uteslutande och alla nollade var för
  // sig). Splittringen var en mätt buggkälla: konvergens-passet fann att den
  // gamla "Rensa filtret" bara nollade `filter` och därför gjorde INGENTING i
  // tre fall av fyra. Med ett tillstånd kan klassen inte uppstå igen.
  //
  // `filter`/`setFilter` ovan rörs INTE — de bär skarpa vyn, som är oförändrad.
  const [registerFilter, setRegisterFilter] = useState<RegisterFilter>(TOMT_REGISTER_FILTER);

  const aktiva = useMemo(() => registreringar.filter(arAktiv), [registreringar]);

  // [PROTOTYPE] [S93] GEMENSAMT — avbokade (Del 3 fall C): tysta idag, en
  // diskret rad längst ned under hållplats-prototypen. Läser HELA
  // `registreringar` (inte `aktiva`, som redan exkluderar dem).
  const protoAvbokade = useMemo(
    () => registreringar.filter((r) => r.status === RegistrationStatus.AVBOKAD),
    [registreringar],
  );
  // [PROTOTYPE] [S93] De tre stegräknarna — EXKLUDERAR 'installt'/'till-vantelista'
  // (de får egna ärliga märken på kortet, se research-doken Del 6C, men räknas
  // inte in i huvud-pipelinens tre hinkar; snitt bokfört i slutrapporten).
  const hallplatsCounts: HallplatsCounts = useMemo(() => {
    const counts: HallplatsCounts = { 'vantar-bekraftelse': 0, 'vantar-betalning': 0, klar: 0 };
    for (const r of aktiva) {
      const steg = hallplatsSteg(r);
      if (steg === 'vantar-bekraftelse' || steg === 'vantar-betalning' || steg === 'klar') {
        counts[steg] += 1;
      }
    }
    return counts;
  }, [aktiva]);
  const hallplatsMarkeFn =
    protoVariant != null
      ? (r: Registration) => <HallplatsMarke steg={hallplatsSteg(r)} />
      : undefined;

  // [PROTOTYPE] [S93] byggkrav 2 (variant A ENDAST, S96) — "Väntar på
  // betalning" delas i två räknerader i Betalningar-blockets EGNA grammatik.
  // S96 review-fix: talen kommer nu ur den DELADE `betalningsSplit`
  // (hallplats-steg-prototyp.ts) — SAMMA funktion `Betalningar.tsx`s eget
  // block anropar för sina motsvarande räknerader, i stället för en egen
  // parallell uträkning här. Räknat på `aktiva` (samma bas som
  // hallplatsCounts ovan), oberoende av Betalningar-blockets EGEN
  // useQuery-instans (ingen state delas mellan de två skarpa filerna) — men
  // samma FORMEL, mekaniskt garanterad av det delade anropet i stället för
  // konvention.
  const { avgifterMottagna, avgifterTotalt, avgifterSaknas, slutMottagna, slutSaknas } =
    betalningsSplit(aktiva);

  // Summeringarna räknar ALLTID hela eventet (K38) — flikvalet påverkar bara
  // listorna under, aldrig "hur många".
  const totalt = aktiva.length;
  const obekraftadeTotalt = aktiva.filter((r) => !arBekraftad(r)).length;
  const bekraftelseSkickade = aktiva.filter((r) => r.bekraftelseSkickad != null).length;
  const pamindaTotalt = aktiva.filter(harPaminnelse).length;
  const eventinfoSkickade = aktiva.filter((r) => r.deltagarinfoSkickad != null).length;
  // LIVE-RÄKNAREN (K52): alltid HÄRLEDD ur kryssen i samma cache-rad som
  // kryss-läget muterar optimistiskt — aldrig ett lagrat räknefält (PRD beslut 8).
  const borOverTotalt = aktiva.filter((r) => r.borOver === true).length;

  const visade = useMemo(
    () => (flik === 'alla' ? aktiva : aktiva.filter((r) => kategori(r) === flik)),
    [aktiva, flik],
  );
  const antalKategori = (k: DeltagarKategori) => aktiva.filter((r) => kategori(r) === k).length;

  // Obekräftade ÄLDST först (den som väntat längst står överst — köns hela
  // poäng); Bekräftade SENAST först (arkivets nyaste överst).
  const obekraftade = useMemo(
    () => visade.filter((r) => !arBekraftad(r)).sort((a, b) => inskickadTid(a) - inskickadTid(b)),
    [visade],
  );
  const bekraftade = useMemo(
    () => visade.filter(arBekraftad).sort((a, b) => inskickadTid(b) - inskickadTid(a)),
    [visade],
  );

  // [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 beslut 2/3) — variant A ENDAST:
  // registret blir EN lista, steg-ordning (ogjort överst) + anmälningsordning
  // (ÄLDST FÖRST — samma FIFO-semantik som den gamla Obekräftade-kön, nu
  // tillämpad enhetligt över samtliga steg i stället för bara kön) inom varje
  // steg. `registerOrdning` (hallplats-steg-prototyp.ts) är den finmaskigare
  // fyra-hinks-sorteringen (delar "väntar på betalning" i avgift/slut, samma
  // delning som byggkrav 2:s summeringsrader). No-op utanför variant A
  // (unifiedSorted beräknas men används aldrig — se render nedan).
  // [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus punkt 3): registrets bas är HELA
  // `registreringar` — INTE `visade`. Två skäl, båda Marcus beslut:
  //  · avbokade ska "även synas i registret självt", och `aktiva` filtrerar
  //    bort dem (de sorteras sist via registerOrdning och bär sitt grå märke);
  //  · Alla/Manuella/Medföljande-FLIKEN som `visade` bar är riven — vägen in
  //    är nu en axel i filterpanelen i stället, applicerad i `registerListaA`.
  // Skarpa vyn läser fortfarande `visade` genom sina egna grenar, orörd.
  const unifiedSorted = useMemo(
    () =>
      [...registreringar].sort((a, b) => {
        const diff = registerOrdning(a) - registerOrdning(b);
        return diff !== 0 ? diff : inskickadTid(a) - inskickadTid(b);
      }),
    [registreringar],
  );

  /**
   * Inbox-fokus (K40): kön öppen, arkivet ett klick bort — är kön tom fälls
   * arkivet ut i stället. Endast Bekräftade är fällbar (se GruppRubrik):
   * Obekräftade-kön står alltid öppen sedan S91:s review.
   *
   * `null` betyder ALDRIG VÄXLAD och är hela poängen (Marcus design-review
   * 2026-07-26, S91, fynd (b)). Förr var detta `useState(obekraftadeTotalt === 0)`
   * — ett startvärde som beräknades EN gång vid monteringen, vilket gav samma
   * sluttillstånd två olika utseenden: tömdes kön genom en batch i sessionen
   * stod arkivet kvar HOPFÄLLT (uppmätt aria-expanded=false), medan en färsk
   * sidladdning på exakt samma data fällde ut det. Det icke-berörda
   * default-läget FÖLJER nu kön i stället för monteringsögonblicket.
   *
   * Ett explicit klick skriver en riktig boolean och respekteras därefter —
   * Lottas eget val vinner alltid över härledningen, även när kön går till noll.
   *
   * Härledningen läser `obekraftadeTotalt` (hela eventet), inte den visade
   * köns längd: en kategori-flik som råkar sakna obekräftade betyder inte att
   * arbetet är gjort. Samma storhet som det gamla startvärdet läste — det som
   * ändras är NÄR den utvärderas, inte VAD.
   */
  const [bekraftadeVal, setBekraftadeVal] = useState<boolean | null>(null);
  const bekraftadeOppen = bekraftadeVal ?? obekraftadeTotalt === 0;

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 1) —
  // den INFLYTTADE betalnings-arbetsytans K27-disclosure (se render, "Öppna
  // detaljer"). Egen lokal state, precis som Betalningar.tsx:s egen `oppen`.
  const [betalningOppen, setBetalningOppen] = useState(false);

  // [PROTOTYPE] [S93] `traffar` bär NU FYRA filter (verkliga `filter` +
  // hållplats-prototypens `hallplatsFilter` + byggkrav 1/2:s
  // `protoAvbokadeAktiv`/`protoBetalningsFilter`, variant A ENDAST) —
  // ömsesidigt uteslutande (se vaxlaFilter/vaxlaHallplatsFilter/
  // vaxlaBetalningsFilter/vaxlaAvbokadeFilter), så den befintliga
  // filtrerings-grenen nedan (Rensa filtret, borOver-specialfallet,
  // DeltagarListan) återanvänds OFÖRÄNDRAD för alla fyra.
  //
  // Avbokade-filtret (byggkrav 1) läser `protoAvbokade` (HELA `registreringar`)
  // i stället för `visade` — avbokade är i övrigt bortfiltrerade ur `aktiva`
  // och därmed ur `visade` helt, så flik-valet (Alla/Manuella/Medföljande)
  // gäller inte för denna rad (samma disconnect som den gamla `AvbokadeRad`
  // redan hade mot `visade`).
  const traffar = filter != null ? visade.filter(FILTER_TEST[filter]) : null;

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 3):
  // "registret ... markera-läget verkar över visad lista" — den visade listan
  // är ANTINGEN ett aktivt steg-räknar-/logistik-filter (traffar) ELLER, om
  // inget är valt, HELA den enade steg-sorterade listan (unifiedSorted). Den
  // generiska "Rensa filtret" ovan nollar bara `filter` (korrekt DÄR —
  // hallplatsFilter/protoBetalningsFilter/protoAvbokadeAktiv är alltid
  // null/false utanför variant A); variant A:s EGEN Rensa-knapp (se render
  // nedan) måste nolla alla fyra, därav `rensaAllaFilterA`.
  // [PROTOTYPE] [S93] ITERATIONSVÅG — variant A:s visade lista: `unifiedSorted`
  // (som nu INKLUDERAR avbokade, se `registerBas`) genom filtrets två axlar.
  // Axlarna KOMBINERAS ("medföljande som saknar slutbetalning"), till skillnad
  // från den gamla fliken som inte kunde kombineras med något.
  const registerListaA = useMemo(() => {
    let ut = unifiedSorted;
    if (registerFilter.steg != null) ut = ut.filter(stegTest(registerFilter.steg));
    if (registerFilter.vagIn != null) ut = ut.filter(vagInTest(registerFilter.vagIn));
    return ut;
  }, [unifiedSorted, registerFilter]);

  /** Sätter stegaxeln från en topp-räknare — samma tillstånd som panelens
      dropdown skriver, så panelen alltid visar sanningen om vad som är valt
      (klick igen på en aktiv rad nollar axeln, oförändrat växlings-beteende). */
  const vaxlaSteg = (s: RegisterStegFilter) => {
    markering.stang();
    setUtfall(null);
    setRegisterFilter((nu) => ({ ...nu, steg: nu.steg === s ? null : s }));
  };

  // Kryss-lägets STABILA sorterings-snapshot (K52): fångas när läget ÖPPNAS så
  // att en nykryssad rad inte hoppar upp under fingret — omsorteringen sker
  // först vid nästa öppning. `Set` av record-ID:n (visnings-oberoende av vilken
  // flik som är vald). null = läget är stängt.
  const [borOverSnapshot, setBorOverSnapshot] = useState<Set<string> | null>(null);
  const lodging = useSetBorOver(event.id);

  const vaxlaFilter = (f: SummeringsFilter) => {
    // Ett filter ERSÄTTER hela accordion-grenen som bär markera-läget. Läts
    // läget leva vidare osynligt skulle det återuppstå med gamla val när
    // filtret rensas, och dess Esc-lyssnare äta Escape under tiden
    // (review-fynd 3). Läget är bundet till sin yta: försvinner ytan, stängs det.
    markering.stang();
    // Nytt arbetssteg ⇒ förra batchens kvittens är förbrukad (fynd (c)).
    setUtfall(null);
    setFilter((nu) => {
      const next = nu === f ? null : f;
      if (f === 'borOver' && next === 'borOver') {
        setBorOverSnapshot(new Set(aktiva.filter((r) => r.borOver === true).map((r) => r.id)));
      }
      return next;
    });
  };

  // [PROTOTYPE] [S93] ITERATIONSVÅG — de tre växlarna
  // (`vaxlaHallplatsFilter` · `vaxlaBetalningsFilter` · `vaxlaAvbokadeFilter`)
  // är RIVNA. Var och en nollade de tre ANDRA filter-states för hand, och det
  // var precis den bokföringen som en gång missades i "Rensa filtret". Alla
  // topp-räknare går nu genom `vaxlaSteg` ovan, som skriver EN axel i ETT
  // tillstånd — ingen manuell ömsesidig uteslutning kvar att glömma.

  // [PROTOTYPE] [S93] review-fix (uppdraget § FYND 2) — `?data=proto`:
  // stubbad, samma read-only-förstärkning som bekraftaMarkerade ovan.
  // Kontrollen (BorOverRad) görs redan `disabled` nedan — denna guard är
  // försvar-i-djup, inte den enda spärren.
  const toggleBorOver = (reg: Registration, borOver: boolean) => {
    if (protoDataMode) return;
    lodging.mutate({ registration: reg, borOver });
  };

  // Kryss-lägets lista: ALLA visade anmälda (arbetsrad, inte filterlista) med
  // ikryssade — enligt snapshoten — överst. Array.sort är stabil (ES2019) så
  // inbördes ordning bevaras inom varje grupp.
  const markeringsLista =
    filter === 'borOver' && borOverSnapshot != null
      ? [...visade].sort(
          (a, b) => Number(borOverSnapshot.has(b.id)) - Number(borOverSnapshot.has(a.id)),
        )
      : [];

  // Hantera-flödet (task-48): ENDAST batch, alltid pessimistiskt bakom
  // kontrollfrågan. Den enskilda optimistiska vägen (useSendConfirmation) revs
  // med K46 — ett halvt bulk-utfall får aldrig visas som helt, och en
  // 1-klicks-genväg hör hemma på Hem-vyn, inte i eventsidans arbetskö.
  const bulk = useConfirmAll(event.id);
  const [utfall, setUtfall] = useState<Utfall | null>(null);

  // Markera-lägets kandidater: skarpa vyn = kön så som den visas (flikvalet
  // gäller, oförändrat). [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST
  // (Del 3 beslut 3, "markera-läget verkar över visad lista"): kandidaterna
  // är i stället `registerListaA` — den aktuella filtrerade vyn, eller HELA
  // den enade listan när inget filter är valt.
  const obekraftadeIds = useMemo(() => obekraftade.map((r) => r.id), [obekraftade]);
  const markeringKandidatIds =
    protoVariant === 'a' ? registerListaA.map((r) => r.id) : obekraftadeIds;
  const markering = useMarkeringsLage(markeringKandidatIds);

  /**
   * FOKUS-ÅTERLÄMNINGEN när läget stängs (review-fynd 1).
   *
   * Stängs läget från dialogen rivs batch-barens knapp (dialogens trigger) i
   * samma commit som modalens FocusScope — React Aria hittar då ingen ansluten
   * `nodeToRestore` och fokus faller till `document.body`. Lotta börjar om från
   * sidans topp, och en skärmläsaranvändare tappar sin plats mitt i arbetet.
   *
   * Effekten körs EFTER commit, när Markera-knappen åter finns i DOM, och
   * lämnar fokus där arbetet fortsätter. Gäller alla vägar ut: Avbryt, Esc och
   * fullbordad batch — Avbryt-vägen fungerade tidigare bara av en slump (React
   * återanvände DOM-noden).
   */
  const markeraKnappRef = useRef<HTMLButtonElement>(null);
  const varAktivt = useRef(false);
  useEffect(() => {
    if (varAktivt.current && !markering.aktivt) markeraKnappRef.current?.focus();
    varAktivt.current = markering.aktivt;
  }, [markering.aktivt]);

  const bekraftaMarkerade = async () => {
    setUtfall(null);
    const ids = [...markering.valda];
    // [PROTOTYPE] [S93] `?data=proto` — READ-ONLY FÖRSTÄRKT (uppdraget § DATA):
    // mutationen STUBBAS, inget nätverksanrop. Samma kvittens-UI som skarpt —
    // c-variantens genväg ska visa HELA flödet, bara utan att skriva.
    if (protoDataMode) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setUtfall({
        ton: 'success',
        titel: SKICKAT_TITEL,
        text: skickatKvittens(ids.length),
      });
      markering.stang();
      return;
    }
    try {
      const result = await bulk.mutateAsync({ registrationIds: ids });
      // Aldrig binärt: allt annat än rent skickat visas som det ÄR (K53-ärligheten).
      // URVALET ÖVERLEVER ett icke-rent utfall (review-fynd 2): servern svarar
      // 200 även vid 'partial'/'failed'/'skipped', och att då nolla markeringen
      // hade tvingat Lotta att markera om tolv kort för att försöka igen. Endast
      // ett RENT skickat utfall betyder att arbetet är utfört — bara då stängs
      // läget. Samma logik som catch-grenen, som alltid behållit urvalet.
      if (result.status !== 'sent') {
        setUtfall({ ton: 'error', titel: MISSLYCKAD_TITEL, text: bekraftelseUtfall(result) });
        return;
      }
      // FRAMGÅNGEN KVITTERAS (fynd (c)): tystnaden var förr reserverad för
      // exakt det utfall som borde bekräftas tydligast.
      setUtfall({
        ton: 'success',
        titel: SKICKAT_TITEL,
        text: skickatKvittens(result.confirmed.length),
      });
      markering.stang();
    } catch {
      setUtfall({
        ton: 'error',
        titel: MISSLYCKAD_TITEL,
        text: 'Bekräftelserna kunde inte skickas. Försök igen.',
      });
    }
  };

  /** Nytt arbetssteg i blocket ⇒ kvittensen för det förra är förbrukad. */
  const oppnaMarkering = () => {
    setUtfall(null);
    markering.oppna();
  };

  // Signalen tänds bara när det finns något ATT skicka (K44).
  const signalText =
    totalt - eventinfoSkickade > 0 ? eventinfoSignal(event.startdatum ?? null) : null;

  return (
    <>
      {protoVariant == null ? (
        <div className="divide-y divide-border">
          <SummeringsRad
            term="Obekräftade anmälningar"
            aktiv={filter === 'obekraftade'}
            onClick={() => vaxlaFilter('obekraftade')}
          >
            {obekraftadeTotalt > 0 ? (
              <span className="font-medium text-error tabular-nums">{obekraftadeTotalt}</span>
            ) : (
              '0'
            )}
          </SummeringsRad>
          {/* K42 — raderna i LOTTAS UTSKICKSORDNING: bekräftelsen (mail 1, bär
              betalningsinstruktionerna) → ev. betalningspåminnelse → eventinfo
              (mail 2, två veckor före). */}
          <SummeringsRad
            term="Anmälningsbekräftelse skickad"
            aktiv={filter === 'bekraftelse'}
            onClick={() => vaxlaFilter('bekraftelse')}
          >
            <AvDelta klara={bekraftelseSkickade} totalt={totalt} />
          </SummeringsRad>
          <SummeringsRad
            term="Betalningspåminnelse skickad"
            aktiv={filter === 'paminda'}
            onClick={() => vaxlaFilter('paminda')}
          >
            <span className="tabular-nums">{pamindaTotalt}</span>
          </SummeringsRad>
          <SummeringsRad
            term="Eventinfo skickad"
            aktiv={filter === 'saknarEventinfo'}
            onClick={() => vaxlaFilter('saknarEventinfo')}
            signalSlot
            signal={
              // K44: slotten ALLTID reserverad — dags-att-skicka-signalen när den är
              // tänd, annars auto-utskicks-krysset (task-18.6). Aldrig båda: när det
              // är dags att skicka NU är schemat inte längre frågan.
              signalText ? (
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 font-medium text-small text-warning">
                  <Clock aria-hidden="true" size={14} className="shrink-0" />
                  {signalText}
                </span>
              ) : (
                <AutoKryss event={event} />
              )
            }
          >
            <AvDelta klara={eventinfoSkickade} totalt={totalt} />
          </SummeringsRad>
          {/* K50: Bor över SIST — universell rad på ALLA event (hemma-hos-eventen
              är normalfallet med sovande gäster); säng-glyfen bär radens identitet.
              Radens SIFFRA är de ikryssade (härledd live); radens KLICK öppnar
              KRYSS-LÄGET (K52 — arbetsrad, inte filterlista). */}
          <SummeringsRad
            term="Bor över"
            ikon={BedDouble}
            aktiv={filter === 'borOver'}
            onClick={() => vaxlaFilter('borOver')}
          >
            <span className="tabular-nums">{borOverTotalt}</span>
          </SummeringsRad>
        </div>
      ) : (
        // [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 § Valet) — variant A
        // vann divergensen; B (Stations-railen)/C (Nästa steg-panelen) är
        // FÖRKASTADE och RIVNA (se DeltagareHallplatsPrototyp.tsx). Enda
        // kvarvarande gren: `HallplatsToppA` (TRE steg-räknare, mittraden
        // ALLTID delad i Anmälningsavgifter/Slutbetalningar, byggkrav 2) +
        // Eventinfo/Bor över/Avbokade som en visuellt avskild "logistik"-grupp
        // (border-t) UTAN rubrik-text (byggkrav 3 rev — "Utskick"-texten fanns
        // bara för att skilja variant A från B/C; de är borta, så det finns
        // inget kvar att skilja mot).
        // PUNKT 3 (Marcus 2026-08-06): "Under Avbokade-raden är sista
        // avdelaren och den är fetare än de övriga."
        //
        // MÄTT: TVÅ kanter 1 px isär — Avbokade-radens egen `border-b` på
        // y=1683,3 och en på DENNA wrapper på y=1684,3. Wrapperns kant kommer
        // från `DetaljGrupp`s `divide-y divide-border`, som lägger en kant på
        // varje barn utom det sista; variant-grenen är inte sista barnet (fler
        // följer nedanför), så den fick en. Två 1 px-linjer med 1 px mellanrum
        // läser som en dubbelt så tjock linje.
        //
        // `border-b-0` river den ÄRVDA kanten. Raderna behåller sina egna, så
        // alla sju är fortsatt exakt lika höga (53 px) — kravet från förra
        // vändan står kvar, det är bara den yttre dubbletten som försvinner.
        // `gap-2` borttaget i samma vända: med kanten på Klara som enda
        // avdelare lämnade gapet 8 px luft mellan just DEN radgränsen och
        // ingen annan — raderna såg olika ut igen, fast åt andra hållet.
        // Stacken är nu helt jämn: varje radgräns är exakt en 1 px-kant.
        <div className="flex flex-col border-b-0">
          <HallplatsToppA
            counts={hallplatsCounts}
            filter={registerFilter.steg}
            onFilterClick={vaxlaSteg}
            betalning={{
              avgifterMottagna,
              avgifterTotalt,
              avgifterSaknas,
              slutMottagna,
              slutSaknas,
              aktivFilter: registerFilter.steg,
              onFilterClick: vaxlaSteg,
            }}
          />
          {/* PUNKT 2 (Marcus 2026-08-06): "Nu är Klara-raden lika hög som de
              andra raderna MEN det är dubbla avdelare/streck under. Det är som
              att det är en jättesmal rad inklämd emellan."

              MÄTT: Klara-raden slutade y=1473,3 med sin egen `border-b`, och
              DENNA wrapper började y=1481,3 med en `border-t` — två linjer med
              8 px tomrum emellan, vilket är precis vad en tunn tom rad ser ut
              som. `border-t pt-1` fanns för att skilja logistik-gruppen från
              steg-räknarna, men sedan förra vändan gav raderna sig själva
              kanter och Klaras `border-b` gör redan exakt det jobbet.

              Wrappern bär nu ingen egen kant och inget toppmellanrum — gruppen
              avgränsas av radens kant, som varje annan radgräns i blocket. */}
          <div className="flex flex-col">
            {/* ITERATIONSVÅG (Marcus 2026-08-05): "alla rader måste såklart
                vara lika höga". Samma `divide-y`-asymmetri som rättades i
                HallplatsRad drabbade sista raden HÄR också — "Avbokade" mättes
                till 52 px mot syskonens 53. Kanten läggs på VARJE barn i
                stället för mellan dem. Ändringen är scopad till variant-grenen
                (klasserna sitter på denna wrapper, inte i `SummeringsRad`) —
                skarpa vyns egen stack behåller sin `divide-y` OFÖRÄNDRAD. */}
            <div className="[&>*]:border-border [&>*]:border-b">
              <SummeringsRad
                term="Eventinfo skickad"
                aktiv={registerFilter.steg === 'eventinfo-saknas'}
                onClick={() => vaxlaSteg('eventinfo-saknas')}
                signalSlot
                signal={
                  // [PROTOTYPE] [S93] konvergens-pass (Del 3 beslut 2-rivning
                  // 1): Auto-kryssen ("AutoKryss", task-18.6) RIVS ur
                  // variant-läget — eventinfo-raden bär endast räknaren +
                  // signal-badgen. Skarpa vyns egen SummeringsRad ovan
                  // (protoVariant == null-grenen) behåller AutoKryss-fallbacken
                  // OFÖRÄNDRAD.
                  signalText ? (
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 font-medium text-small text-warning">
                      <Clock aria-hidden="true" size={14} className="shrink-0" />
                      {signalText}
                    </span>
                  ) : undefined
                }
              >
                <AvDelta klara={eventinfoSkickade} totalt={totalt} />
              </SummeringsRad>
              <SummeringsRad
                term="Bor över"
                ikon={BedDouble}
                aktiv={registerFilter.steg === 'bor-over'}
                onClick={() => {
                  // Bor över öppnar KRYSS-läget (K52) och behöver därför sin
                  // snapshot — den enda topp-raden som gör mer än att filtrera.
                  if (registerFilter.steg !== 'bor-over') {
                    setBorOverSnapshot(
                      new Set(aktiva.filter((r) => r.borOver === true).map((r) => r.id)),
                    );
                  }
                  vaxlaSteg('bor-over');
                }}
              >
                <span className="tabular-nums">{borOverTotalt}</span>
              </SummeringsRad>
              {/* BYGGKRAV 1 (S96) — Avbokade-rad LÄNGST NER under "Bor över",
                  samma SummeringsRad-grammatik. ITERATIONSVÅG (Marcus punkt 3):
                  raden är nu en GENVÄG till filtret, inte den enda vägen till
                  avbokade — de ligger med i registret självt (sist, med sitt
                  grå märke) sedan `registerOrdning` fick sin avbokad-hink. */}
              <SummeringsRad
                term="Avbokade"
                aktiv={registerFilter.steg === 'avbokad'}
                onClick={() => vaxlaSteg('avbokad')}
              >
                <span className="tabular-nums">{protoAvbokade.length}</span>
              </SummeringsRad>
            </div>
          </div>
        </div>
      )}

      {utfall != null && (
        <div data-testid="bekraftelse-utfall" className="pt-3">
          <MessageBox intent={utfall.ton} title={utfall.titel} onDismiss={() => setUtfall(null)}>
            {utfall.text}
          </MessageBox>
        </div>
      )}

      <div className="flex flex-col gap-2.5 py-3">
        {/* K41: Formulär-fliken riven — formulärvägen är NORMEN och behöver
            ingen egen flik. Kapseln är familjens ToggleButtonGroup-primitiv.
            [PROTOTYPE] [S93] ITERATIONSVÅG: fliken renderas ENDAST i skarpa
            vyn. I variant A är vägen in en axel i filterpanelen (se
            RegisterFilterRad) — Marcus: togglen "behöver byggas om och exakt
            matcha" eventsidans filtrering. */}
        {protoVariant !== 'a' && (
          <ToggleButtonGroup
            label="Visa deltagare"
            spread
            selectedKey={flik}
            onSelectionChange={(key: FlikNyckel) => {
              setUtfall(null);
              setFlik(key);
            }}
          >
            <ToggleButton id="alla" size="sm">
              {`Alla (${totalt})`}
            </ToggleButton>
            <ToggleButton id="manuell" size="sm">
              {`Manuella (${antalKategori('manuell')})`}
            </ToggleButton>
            <ToggleButton id="medfoljande" size="sm">
              {`Medföljande (${antalKategori('medfoljande')})`}
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        {protoVariant === 'a' ? (
          // [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 beslut 3) — registret
          // är EN lista, ingen sektionsrubrik: Steg-märkena (befintliga, se
          // HallplatsMarke) ÄR grupperingen. Visad lista = `registerListaA`
          // (traffar när ett steg-räknar-/logistik-filter är valt, annars
          // HELA den enade steg-sorterade listan) — "markera-läget verkar
          // över visad lista".
          unifiedSorted.length === 0 ? (
            <p className="py-2 text-small text-text-secondary">Inga anmälningar ännu.</p>
          ) : (
            <>
              {/* [PROTOTYPE] [S93] ITERATIONSVÅG — filterraden ERSÄTTER tre lösa
                  kontroller: fliken (ovan, nu skarp-vy-only), den högerställda
                  "Rensa filtret" (flyttad in i panelfoten) och den högerställda
                  Markera-knappen (flyttad hit, till radens högerkant). Marcus:
                  "de kan inte sitta där de gör, ser fult ut." */}
              <RegisterFilterRad
                filter={registerFilter}
                onFilterChange={(f) => {
                  markering.stang();
                  setUtfall(null);
                  setRegisterFilter(f);
                }}
                visadeAntal={registerListaA.length}
                totaltAntal={unifiedSorted.length}
                markeraKnapp={
                  <MarkeraKnapp
                    aktivt={markering.aktivt}
                    onOppna={oppnaMarkering}
                    onStang={markering.stang}
                    buttonRef={markeraKnappRef}
                  />
                }
              />
              {registerFilter.steg === 'bor-over' ? (
                <BorOverKrysslage
                  lista={markeringsLista}
                  protoDataMode={protoDataMode}
                  onToggle={toggleBorOver}
                />
              ) : (
                <>
                  {markering.aktivt && (
                    <MarkeringsBatchBar
                      antal={markering.antal}
                      totalt={registerListaA.length}
                      allaValda={markering.allaValda}
                      pending={false}
                      onMarkeraAlla={markering.markeraAlla}
                      onRensa={markering.rensa}
                      valdaNamn={registerListaA
                        .filter((r) => markering.valda.has(r.id))
                        .map(displayName)}
                    />
                  )}
                  {registerListaA.length > 0 ? (
                    <DeltagarListan
                      rader={registerListaA}
                      eventId={event.id}
                      rullande
                      testId="deltagar-register"
                      ariaLabel="Deltagarregister"
                      markering={
                        markering.aktivt ? { valda: markering.valda, vaxla: markering.vaxla } : null
                      }
                      hallplatsMarke={hallplatsMarkeFn}
                    />
                  ) : (
                    <p className="py-2 text-small text-text-secondary">
                      Inga träffar i denna kategori.
                    </p>
                  )}
                </>
              )}
            </>
          )
        ) : traffar != null ? (
          <>
            {/* K57: "Visar:"-raden och instruktionstexten RIVNA — man har ju
                tryckt på raden. Rensa-knappen står ensam, högerställd på
                kortets inner-inset. */}
            <RensaFiltretKnapp onClick={() => setFilter(null)} />
            {filter === 'borOver' ? (
              <BorOverKrysslage
                lista={markeringsLista}
                protoDataMode={protoDataMode}
                onToggle={toggleBorOver}
              />
            ) : traffar.length > 0 ? (
              <DeltagarListan
                rader={traffar}
                eventId={event.id}
                hallplatsMarke={hallplatsMarkeFn}
              />
            ) : (
              <p className="py-2 text-small text-text-secondary">Inga träffar i denna kategori.</p>
            )}
          </>
        ) : visade.length === 0 ? (
          <p className="py-2 text-small text-text-secondary">Inga deltagare i denna kategori.</p>
        ) : (
          <>
            {obekraftade.length > 0 ? (
              <div>
                {/* Byggkrav 1: Markera ERSÄTTER Bekräfta alla-pillen på samma
                    plats; i läget står Avbryt där. K47/K48-formen (pill +
                    kontrollfråga på rubriken) är riven — massmutationen har
                    flyttat till batch-baren där urvalet syns innan det
                    skickas.

                    EMPHASIS-PARET (Marcus design-review 2026-07-26, S91):
                    Markera bär `primary` SOLID (#282928) = exakt S86-facit;
                    Avbryt ärver den subtle plattan. Bygget hade satt Markera
                    till `primary`/`subtle` med stöd i §19:s rad om
                    toolbar-ytklass — men facit var Marcus-låst och vägde
                    tyngre, och kollisionen skulle ha lyfts i stället för att
                    lösas tyst. §19 är amenderad: en LÄGESÖPPNARE är sektionens
                    primära kontroll, inte ett rad-verktyg, och bär därför
                    solid. Avbryt är däremot en lågviktad utgång och tar den
                    subtle plattan — synligare än ghost, som saknade
                    bakgrund helt och läste som en textlänk. */}
                <GruppRubrik
                  varning
                  handling={
                    <MarkeraKnapp
                      aktivt={markering.aktivt}
                      onOppna={oppnaMarkering}
                      onStang={markering.stang}
                      buttonRef={markeraKnappRef}
                    />
                  }
                >
                  {`Obekräftade (${obekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-obekraftade`} className="pt-1.5">
                  {markering.aktivt && (
                    <MarkeringsBatchBar
                      antal={markering.antal}
                      totalt={obekraftade.length}
                      allaValda={markering.allaValda}
                      pending={bulk.isPending}
                      onBekrafta={bekraftaMarkerade}
                      onMarkeraAlla={markering.markeraAlla}
                      onRensa={markering.rensa}
                    />
                  )}
                  <DeltagarListan
                    rader={obekraftade}
                    eventId={event.id}
                    rullande
                    testId="obekraftade-ko"
                    markering={
                      markering.aktivt ? { valda: markering.valda, vaxla: markering.vaxla } : null
                    }
                    hallplatsMarke={hallplatsMarkeFn}
                  />
                </div>
              </div>
            ) : (
              <p className="text-small text-text-secondary">
                Inga obekräftade — alla är bekräftade.
              </p>
            )}
            {bekraftade.length > 0 && (
              <div>
                <GruppRubrik
                  oppen={bekraftadeOppen}
                  kontrollerarId={`${panelId}-bekraftade`}
                  onToggle={() => setBekraftadeVal(!bekraftadeOppen)}
                >
                  {`Bekräftade (${bekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-bekraftade`} hidden={!bekraftadeOppen} className="pt-1.5">
                  <DeltagarListan
                    rader={bekraftade}
                    eventId={event.id}
                    hallplatsMarke={hallplatsMarkeFn}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 beslut 1) — Betalningars
          avpricknings-arbetsyta FLYTTAR IN här, fällbar UNDER registret, bakom
          samma K27-form (`DetaljRad`, återanvänd oförändrad ur Betalningar.tsx
          — "flytta montering, skriv inte om"). Deadline-badgen renderas INUTI
          `BetalningsDetaljer` och följer därmed automatiskt med. Samma
          `aktiva.length > 0`-vakt och wrapper-form som Betalningar.tsx:s egen
          K28-kommentar (toggeln + regionen i EN wrapper, ingen divide-y
          mellan dem). */}
      {protoVariant === 'a' && aktiva.length > 0 && (
        <div>
          <DetaljRad
            oppen={betalningOppen}
            kontrollerarId="deltagare-betalningsdetaljer"
            onToggle={() => setBetalningOppen((v) => !v)}
          />
          <div id="deltagare-betalningsdetaljer" hidden={!betalningOppen}>
            <BetalningsDetaljer
              event={event}
              registreringar={aktiva}
              protoAktiv
              protoDataMode={protoDataMode}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function Deltagare({ event }: { event: Event }) {
  const dataSource = useDataSource();
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.registrations.byEvent(event.id),
    queryFn: () => dataSource.fetchRegistrations({ eventId: event.id }),
  });
  // [PROTOTYPE] [S93] hållplats-pass — DEV-grindad ?variant=a + ?data=proto
  // (underform A, S86-mekaniken). B/C är rivna i konvergens-passet (Del 3
  // § Valet) — `isHallplatsVariant` känner numera bara igen `a`. Utan
  // ?variant renderas EXAKT dagens träd: `protoVariant` är null, och varje
  // gren nedan faller igenom till den OFÖRÄNDRADE
  // isPending/isError/ArbetsKo-kedjan.
  const [variantParam] = useQueryState('variant');
  const [dataParam] = useQueryState('data');
  const protoVariant: HallplatsVariant | null =
    import.meta.env.DEV && isHallplatsVariant(variantParam) ? variantParam : null;
  // [PROTOTYPE] [S93] fix-våg (uppdraget § D, Marcus punkt 3 — knappen gjorde
  // inget): PrototypeSwitcher togglar `?data=` mellan null och 'verklig'
  // (S90-kontraktet) — i variant-läge är FIXTURERNA default (bypassar den
  // riktiga hämtningen, in-memory fixtur; ADR-061 rörs aldrig), `?data=verklig`
  // ger riktig hämtning. Den tidigare `=== 'proto'`-kontrollen läste ett
  // värde växlaren aldrig satte.
  const protoDataMode = protoVariant != null && dataParam !== 'verklig';

  if (protoDataMode) {
    return (
      <DetaljGrupp id="grupp-deltagare" rubrik="Anmälda deltagare">
        <ArbetsKo
          event={event}
          registreringar={HALLPLATS_PROTO_FIXTURES}
          protoVariant={protoVariant}
          protoDataMode
        />
      </DetaljGrupp>
    );
  }

  return (
    <DetaljGrupp id="grupp-deltagare" rubrik="Anmälda deltagare">
      {isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2 py-3">
          <span className="sr-only">Laddar anmälda deltagare…</span>
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="listRow" className="h-16 rounded-xl" />
        </div>
      ) : isError ? (
        <div className="py-3">
          <MessageBox intent="error" title="Kunde inte hämta anmälda deltagare">
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      ) : (
        <ArbetsKo event={event} registreringar={data} protoVariant={protoVariant} />
      )}
    </DetaljGrupp>
  );
}
