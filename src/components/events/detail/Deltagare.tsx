import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BedDouble,
  Check,
  Clock,
  History,
  Inbox,
  type LucideIcon,
  MailCheck,
  X,
} from 'lucide-react';
// [PROTOTYPE] [S93] hållplats-pass — kastbar wiring (throwaway-kontraktet):
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import { useSetBorOver } from '@/data/mutations/registrationLodging';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { cn } from '@/lib/cn';
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
 * REGISTRET, sedan TASK-145.1 EN enda `DeltagarListan` (se `registerLista`
 * i `ArbetsKo`), inte längre Obekräftade/Bekräftade som två separata
 * accordions (K40s ursprungliga par är rivet — se § REGISTRET nedan).
 * Klick på en summeringsrad ersätter registret med en flat filtrerad lista
 * + "Rensa filtret" (K57: förklarande texter rivna — man har ju tryckt).
 *
 * § REGISTRET (TASK-145.1; PRD TASK-145 "Registret blir EN lista") —
 * Obekräftade-kön och Bekräftade-arkivet, var och en med egen `GruppRubrik`
 * och egen sorteringsordning, är RIVNA. Ersättaren är EN `DeltagarListan`
 * sorterad på FYRA steg-hinkar (`registerOrdning`, hallplats-steg-
 * prototyp.ts) — väntar på bekräftelse → anmälningsavgift saknas →
 * slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist —
 * och INOM varje hink i anmälningsordning (äldst-registrerad-först, samma
 * FIFO-semantik Obekräftade-kön hade, nu enhetlig över hela registret).
 * Steg-märket (`HallplatsMarke`, `registerHallplatsMarke` i `ArbetsKo`) ÄR
 * grupperingen — inga sektionsrubriker renderas, exakt ETT märke per person
 * även när flera steg är ogjorda (prioritetsordningen bor i
 * `hallplatsSteg()`). SKIVGRÄNS (öppet bokförd): flik-togglen, de fyra
 * KLICKBARA summeringsraderna ovan och filtrerings-/`traffar`-grenen är
 * ALLA OFÖRÄNDRADE — TASK-145.1 rör ENDAST registrets egen gruppering/
 * sortering/märkning; en ny fyra-hinks räknar-rad äger `TASK-145.2`.
 *
 * PERSONKORTEN (task-18.5; S73-facit K45/K62) bor i `DeltagarKort` nedan.
 *
 * HANTERA-FLÖDET — RIVET UR EVENTSIDAN (TASK-145.3 AC #2). Fyra former är
 * borta och kommer inte tillbaka hit:
 *   · K46 — personkortets "Skicka bekräftelse" i kortfoten (task-48). Solid
 *     eller outline spelade ingen roll: en knapp per kort dräpte kortens
 *     läsbarhet. Med den följde `useSendConfirmation`.
 *   · K47/K48 — "Bekräfta alla"-pillen på Obekräftade-rubriken med sin
 *     kontrollfråga (task-48). Den bekräftade ALLA eller inget; urvalet var
 *     osynligt.
 *   · BATCH-BEKRÄFTELSEN som ersatte dem (`useConfirmAll` + kontrollfrågan i
 *     batch-baren) — riven av TASK-145.3. Eventsidan är en REN ÖVERSYN; allt
 *     som verkställer något bor på Åtgärds-sidan (`TASK-147`).
 *   · Utfalls-ytan (`MessageBox`-kvittensen) som bara den kunde producera.
 *
 * Kvar står ett explicit MARKERA-LÄGE (`useMarkeringsLage`) där hela kortet är
 * klickyta med checkbox-semantik, och en batch-bar vars primärknapp bär texten
 * **Åtgärder** och tar urvalet vidare. Vägen in är Markera-knappen, förankrad i
 * batch-barens vänsterkant (§ REGISTRET ovan — rubrikraden den satt på är
 * riven); Esc och Avbryt är vägarna ut, oförändrat.
 *
 * KANDIDATMÄNGDEN ÄR VISAD LISTA (TASK-145.3 AC #2): `visadRegisterLista` i
 * `ArbetsKo` — den filtrerade vyn när ett steg-/logistik-filter är valt,
 * annars hela den steg-sorterade listan. Markera-läget kräver alltså inget
 * filter, men följer med i ett. Auto-utskicks-krysset (K44) i signal-slotten
 * är rivet sedan TASK-145.2.
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
 * registret (§ REGISTRET) är en `<ul>` utan `aria-expanded`/`aria-controls`
 * sedan `GruppRubrik`s accordion-par revs (TASK-145.1) — steg-märket bär sin
 * egen text, färg aldrig ensam bärare; räknarna står som TEXT i etiketterna
 * (skärmläsaren får hela bilden); signal-badgen bär sin text likaså.
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
 * [RIVEN, TASK-145.2] `harPaminnelse` (basens odelade `Betalningspåminnelse
 * skickad` ELLER någon av task-18.8:s två per-betalnings-tidsstämplar) bodde
 * här — dess enda anropsplats var `pamindaTotalt`, som matade den rivna
 * "Betalningspåminnelse skickad"-summeringsraden (grillad samsyn beslut 2).
 * `senastePaminnelse` (nedan) läser samma tre fält direkt för metaytans
 * påminnelserad — den rörs inte. `hallplats-steg-prototyp.ts` bär sedan
 * tidigare en egen, oberoende kopia (samma namn, samma logik, delad med
 * `Betalningar.tsx`s DEV-gren) — den kopian har egna anropsplatser och rivs
 * inte här.
 */

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
 * [RIVEN, TASK-145.2] `SummeringsFilter`/`FILTER_TEST` (de fem gamla
 * klickbara summeringsraderna: Obekräftade/Anmälningsbekräftelse skickad/
 * Betalningspåminnelse skickad/Eventinfo skickad/Bor över) bodde här.
 * Ersättaren är `RegisterStegFilter`/`stegTest` (hallplats-steg-prototyp.ts)
 * — samma facit-byggda mekanism `?variant=a` redan använde för sina egna
 * sju rader (grillad samsyn beslut 2, S93 Del 3). Registrets filtrering
 * (nedan i `ArbetsKo`) läser nu `registerFilter.steg` i stället för denna
 * rivna `filter`-state.
 */

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
 * [RIVEN, TASK-145.1] `GruppRubrik` (Obekräftade/Bekräftade-rubrikerna, K40
 * accordion-raden med chevron/`aria-expanded`) bodde här. Dess två
 * produktions-anropsplatser (Obekräftade-kön, Bekräftade-arkivet) är rivna
 * (AC #1: "inga sektionsrubriker renderas" — steg-märket ÄR grupperingen,
 * AC #4). `?variant=a` använde aldrig `GruppRubrik` (egen `HallplatsToppA`/
 * `SummeringsRad`-form i `DeltagareHallplatsPrototyp.tsx`), så komponenten
 * har noll kvarvarande anropsplatser.
 */

/**
 * MARKERA/AVBRYT-KNAPPEN (task-48 byggkrav 1, EMPHASIS-PARET från S91) —
 * utbruten till en egen funktion sedan konvergens-passet (S93 Del 3 beslut 3)
 * eftersom den nu har TVÅ anropsplatser: `?variant=a`s egna högerställda rad
 * ovanför det enade registret OCH — sedan TASK-145.1 — produktionens EGEN
 * `MarkeringsBatchBar`-vänsterkant (AC #11: knappens nya, egna förankring
 * sedan `GruppRubrik`s `handling`-slot försvann med rubriken den satt på).
 * Ren extraktion/omflyttning, ingen ändring av knappens EGEN form.
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

/**
 * [RIVEN, TASK-145.3] `anmalanOrd` · `Utfall` · `SKICKAT_TITEL` ·
 * `MISSLYCKAD_TITEL` · `skickatKvittens` bodde här — hela batchens
 * UTFALLS-YTA (Marcus design-review 2026-07-26, S91, fynd (c)) med sin
 * GOV.UK/Polaris/Carbon-grundade MessageBox-form.
 *
 * De var samtliga konsumenter av EN sak: bekräfta-flödet från eventsidan.
 * AC #2 river det flödet — "bekräfta-flödet med kontrollfråga är RIVET ur
 * eventsidan, inte dolt" — och när `bekraftaMarkerade` försvann fanns ingen
 * kvar som SATTE ett utfall. En utfalls-yta utan producent är död kod, inte
 * en bevarad möjlighet.
 *
 * FORSKNINGEN ÄR INTE FÖRLORAD, den flyttar med sitt subjekt: utskicket sker
 * på Åtgärds-sidan (`TASK-147`), och kvittensens form — inline framför toast,
 * ingen självförsvinnande timer, stäng-knapp, dubbel bärare för
 * skärmläsaren — är den form som ska byggas DÄR. Referenserna står kvar i
 * git-historiken för denna fil (commit-meddelandet pekar hit).
 *
 * `MessageBox` importeras fortfarande: `Deltagare` bär den för
 * hämtningsfelet (`isError`), en helt annan konsument.
 */

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
 * BATCH-BAREN (task-48 byggkrav 3) — markera-lägets handlingsyta, ovanför
 * registret.
 *
 * §19: Åtgärder är blockets primära handlingsyta (inte en kort- eller radyta)
 * och bär därför solid primary. Markera alla är neutral stödform (secondary),
 * Rensa lågviktad (ghost) och dyker upp först när det finns något att rensa.
 *
 * GEOMETRIN ÄR KONSTANT ÖVER LÄGENA (TASK-145.3 AC #1). Baren renderas ALLTID
 * — även när markera-läget är AV — med Markera-knappen i sin vänsterkant;
 * `aktivt` styr bara om Åtgärder/Markera alla/Rensa VÄXER UT åt höger på
 * samma rad. Förut monterades hela baren först när läget slogs på, och allt
 * under den hoppade nedåt (ITERATIONSVÅG 5, Marcus 2026-08-06: "Vi flyttar ner
 * Markera-knappen till samma rad som 'åtgärder' och 'markera alla' och sätter
 * den längst till vänster"). En vertikal förskjutning byttes mot en
 * horisontell utvidgning — det är den formen AC #1 mäter i renderad DOM.
 *
 * [RIVEN, TASK-145.3] BEKRÄFTA-FLÖDET (`onBekrafta`, `pending`, breddlåsets
 * tvåsiffriga platshållare, `DialogTrigger`/`Modal`/`Dialog`-kontrollfrågan,
 * task-48 byggkrav 6 + PRD task-18 beslut 7/20) bodde här och är BORTA, inte
 * dolt (AC #2). Utskicket är inte längre eventsidans arbete: eventsidan är en
 * ren översyn och allt som VERKSTÄLLER något bor på Åtgärds-sidan
 * (`TASK-147`). Primärknappen bär därför ALLTID texten Åtgärder och tar
 * urvalet vidare — det är eventsidans enda utgång mot en handling.
 *
 * UTGÅNGEN ÄR EN ÄRLIG INTERIM (AC #3): Åtgärds-sidan finns inte ännu, så
 * knappen är en DISCLOSURE mot en platshållare på samma sida — inte en länk
 * och inte en chevron. Båda de senare hade lovat en navigation som saknas.
 * Formen byts mot en riktig väg vidare när `TASK-147` landar.
 */
function MarkeringsBatchBar({
  antal,
  totalt,
  allaValda,
  onMarkeraAlla,
  onRensa,
  valdaNamn,
  markeraKnapp,
  aktivt,
}: {
  antal: number;
  totalt: number;
  allaValda: boolean;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  /** De markerades namn, i visningsordning — urvalet som följer med vidare
      (AC #2), visat i interim-platshållaren tills Åtgärds-sidan finns. */
  valdaNamn: string[];
  /** Markera/Avbryt-knappen, förankrad i barens vänsterkant. Renderas i BÅDA
      lägena — se § GEOMETRIN ovan. */
  markeraKnapp: React.ReactNode;
  /** Markera-läget på/av. `false` ⇒ enbart `markeraKnapp` syns. */
  aktivt: boolean;
}) {
  const [visaPlatshallare, setVisaPlatshallare] = useState(false);
  const platshallareId = useId();

  return (
    <>
      <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2 pb-2.5">
        {markeraKnapp}
        {aktivt && (
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
        {aktivt && (
          <Button intent="secondary" size="sm" isDisabled={allaValda} onPress={onMarkeraAlla}>
            Markera alla
          </Button>
        )}
        {aktivt && antal > 0 && (
          <Button intent="ghost" size="sm" onPress={onRensa}>
            Rensa
          </Button>
        )}
        {/* Live-räknaren: seende ser antalet i platshållaren, skärmläsaren får
            det här. `polite` — urvalet är löpande arbete, aldrig ett avbrott
            värt assertive.

            Villkorad på `aktivt` sedan iterationsvåg 5: i AV-läget finns inget
            urval att räkna, och en `role="status"` som står och säger "0 av 9
            markerade" när ingen markerar är brus i skärmläsaren — samma klass
            av oombedd a11y-struktur som rev två CI-grindar i våg 2. */}
        {aktivt && (
          <span
            data-testid="markering-live"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {`${antal} av ${totalt} markerade`}
          </span>
        )}
      </div>
      {/* INTERIM-PLATSHÅLLAREN (AC #3) — ett litet kort på samma sida, INTE en
          sida och inte ett löfte om en. Texten säger rakt ut att sidan inte
          finns ännu och att urvalet följer med dit när den gör det; Gunilla ska
          förstå exakt vad som händer härnäst utan att kunna något om kort-ID:n.
          Renderas som EGEN syskon-div (inte inuti raden ovan) så barens egen
          radgeometri är oberoende av om platshållaren är utfälld. */}
      {aktivt && visaPlatshallare && (
        <div
          id={platshallareId}
          data-testid="atgarder-platshallare"
          className="mb-2.5 rounded-xl border border-(--mm-navcard-border) bg-surface p-3 text-small contrast-more:border-(--mm-navcard-border-contrast)"
        >
          <p className="font-medium">
            {`Åtgärds-sidan är inte byggd ännu. Här står de ${antal} du markerat — de följer med dit när sidan finns.`}
          </p>
          {valdaNamn.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-0.5 text-text-secondary">
              {valdaNamn.map((namn) => (
                <li key={namn}>{namn}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

/**
 * [RIVEN, TASK-145.2] `isoDatum`/`AutoKryss` (auto-utskicks-krysset, K44) bodde
 * här. Grillad samsyn beslut 2 (S93 Del 3, `tasks/sessions/2026-08-02-session-93.md`
 * rad 158–162) namnger auto-kryssen som EN av exakt tre rivningar ur
 * summeringsblocket (med påminnelse-raden och "Anmälningsbekräftelse skickad"-
 * raden) — samma rivning `?variant=a`s konvergens-pass redan genomförde
 * (Deltagare.tsx docblock, "Auto-kryssen RIVS ur variant-läget"). Eventinfo-
 * radens signal-slot bär därför nu ENDAST "Dags att skicka"-badgen (`signalText`)
 * eller en tom reserv — aldrig ett fallback-kryss. `useUpdateEvent`-mutationen
 * hade ingen annan konsument och är riven med.
 *
 * PREMISS-DIVERGENS, öppet bokförd (ADR-086): uppdragets egen belägg #2
 * (README rad 131, "Eventinfo-raden + Bor över-raden står kvar, ORÖRDA
 * (signal-slot, AutoKryss, kryss-läget)") citerar READMEs FÖRE-konvergens-text
 * — samma dokument river AutoKryss uttryckligen längre ned, i sin egen
 * "KONVERGENS-PASSET"-sektion. Uppdragets ENDA korrekta, icke-motsägda källa
 * (belägg #1, grillad samsyn) och den redan facit-låsta koden är eniga:
 * AutoKryss rivs. Se slutrapporten.
 */

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
  visaUtskicksRader = hallplatsMarke == null,
}: {
  reg: Registration;
  eventId: string;
  lankat: boolean;
  vald: boolean;
  /** [PROTOTYPE] [S93] Steg-märket — undefined utanför hållplats-prototypen
      (default, zero-behaviour-change; se DeltagareHallplatsPrototyp.tsx). */
  hallplatsMarke?: React.ReactNode;
  /** De tre utskicks-metaraderna (Bekräftelse/Påminnelse/Eventinfo-datum)
      döljs när `hallplatsMarke` är satt, eftersom samma information numera
      visas som Tidslinje i den inflyttade betalningsarbetsytan
      (BetalningsDetaljer/"Öppna detaljer", se ArbetsKo). Default
      `hallplatsMarke == null` bevarar det OFÖRÄNDRADE, ej-hallplats-kortet
      (skarpa vyns kort utan steg-märke, om något sådant anrop någonsin
      uppstår — finns inget idag).
      HISTORIK (TASK-145.1 → TASK-145.4): TASK-145.1 satte denna explicit
      `true` på registrets BÅDA produktionsanrop, eftersom ersättningen
      (arbetsytan) då bara existerade i `?variant=a` och raderna annars
      försvunnit utan ersättning. TASK-145.4 flyttade arbetsytan in i
      produktionen (AC #2/#8) och tog samtidigt bort övertrampet — registrets
      kort visar därför nu utskickshistoriken ENDAST i Tidslinjen, aldrig på
      kortet, i BÅDA lägena (matchar `?variant=a`s form, som aldrig hade
      övertrampet). */
  visaUtskicksRader?: boolean;
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
        {visaUtskicksRader && bekraftelse && (
          <MetaRad ikon={MailCheck}>{`Bekräftelse ${bekraftelse}`}</MetaRad>
        )}
        {visaUtskicksRader && paminnelse && (
          <MetaRad ikon={MailCheck}>{`Påminnelse ${paminnelse}`}</MetaRad>
        )}
        {visaUtskicksRader && eventinfo && (
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
  visaUtskicksRader,
}: {
  reg: Registration;
  eventId: string;
  /** [PROTOTYPE] [S93] — se KortInnehall. */
  hallplatsMarke?: React.ReactNode;
  /** [TASK-145.1] — se KortInnehall. */
  visaUtskicksRader?: boolean;
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
        visaUtskicksRader={visaUtskicksRader}
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
  visaUtskicksRader,
}: {
  reg: Registration;
  eventId: string;
  vald: boolean;
  onChange: (vald: boolean) => void;
  /** [PROTOTYPE] [S93] — se KortInnehall. */
  hallplatsMarke?: React.ReactNode;
  /** [TASK-145.1] — se KortInnehall. */
  visaUtskicksRader?: boolean;
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
        visaUtskicksRader={visaUtskicksRader}
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
      {/* Proto-banderollen RIVEN (S93 våg 20) — `protoDataMode` håller
          fortfarande Bor över inaktiverad, bara texten är borta. */}
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
  visaUtskicksRader,
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
  /** [TASK-145.1] — se KortInnehall; vidarebefordrad till varje korts
      `visaUtskicksRader`. */
  visaUtskicksRader?: boolean;
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
              visaUtskicksRader={visaUtskicksRader}
            />
          ) : (
            <DeltagarKort
              reg={reg}
              eventId={eventId}
              hallplatsMarke={hallplatsMarke?.(reg)}
              visaUtskicksRader={visaUtskicksRader}
            />
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
  // [RIVEN, TASK-145.1] `panelId` (useId) bodde här — dess enda konsumenter
  // var Obekräftade/Bekräftade-panelernas `id`-attribut, borta med
  // `GruppRubrik`s två produktions-anropsplatser (AC #1).
  const [flik, setFlik] = useState<FlikNyckel>('alla');
  // [PROTOTYPE] [S93] ITERATIONSVÅG (Marcus 2026-08-05) — ETT filtertillstånd
  // för hela registret, i stället för de TRE separata proto-states som fanns
  // här förut (`hallplatsFilter` · `protoBetalningsFilter` ·
  // `protoAvbokadeAktiv`, alla ömsesidigt uteslutande och alla nollade var för
  // sig). Splittringen var en mätt buggkälla: konvergens-passet fann att den
  // gamla "Rensa filtret" bara nollade `filter` och därför gjorde INGENTING i
  // tre fall av fyra. Med ett tillstånd kan klassen inte uppstå igen.
  //
  // [TASK-145.2] Den gamla, separata `filter`/`setFilter` (SummeringsFilter)
  // är RIVEN — de fem gamla summeringsraderna finns inte längre, och
  // `registerFilter` (steg-axeln) är nu den ENDA filtreringsmekanismen både
  // för skarpa vyn OCH `?variant=a`, i stället för två parallella tillstånd.
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
  // [RIVEN, TASK-145.2] `obekraftadeTotalt`/`bekraftelseSkickade`/
  // `pamindaTotalt` bodde här — de matade de tre rivna summeringsraderna
  // (Obekräftade anmälningar/Anmälningsbekräftelse skickad/Betalnings-
  // påminnelse skickad, grillad samsyn beslut 2). `hallplatsCounts` ovan bär
  // motsvarande "Väntar på bekräftelse"-tal i den nya formen.
  const eventinfoSkickade = aktiva.filter((r) => r.deltagarinfoSkickad != null).length;
  // LIVE-RÄKNAREN (K52): alltid HÄRLEDD ur kryssen i samma cache-rad som
  // kryss-läget muterar optimistiskt — aldrig ett lagrat räknefält (PRD beslut 8).
  const borOverTotalt = aktiva.filter((r) => r.borOver === true).length;

  const visade = useMemo(
    () => (flik === 'alla' ? aktiva : aktiva.filter((r) => kategori(r) === flik)),
    [aktiva, flik],
  );
  const antalKategori = (k: DeltagarKategori) => aktiva.filter((r) => kategori(r) === k).length;

  // [RIVEN, TASK-145.1] `obekraftade`/`bekraftade` (Obekräftade-kön/
  // Bekräftade-arkivet, var sin äldst-/senast-först-sortering) bodde här —
  // ersatta av `registerLista` nedan (AC #1: EN lista, `registerOrdning`-
  // sorterad). Ingen annan anropsplats kvar (verifierat med grep).

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

  // TASK-145.1 (AC #1–#3) — PRODUKTIONENS EGNA enade register. Samma
  // jämförare som `unifiedSorted` ovan (steg-hink → FIFO inom hink), men på
  // `visade` (flik-filtrerad `aktiva` — samma bas Obekräftade-kön/Bekräftade-
  // arkivet läste förut) i stället för hela `registreringar`: flik-togglen
  // (Alla/Manuella/Medföljande, nedan i render) är OFÖRÄNDRAD och ska
  // fortsätta filtrera registret (ingen AC river den), och avbokade är
  // fortsatt bortfiltrerade — samma exkludering `aktiva` redan gjorde.
  // `registerOrdning`s avbokad-hink (6) berör därför aldrig denna lista, bara
  // `unifiedSorted`s variant-A-bas (som läser hela `registreringar`,
  // avbokade inräknade — Marcus egen ITERATIONSVÅG-decision, se ovan). Egen
  // `useMemo` i stället för att återanvända `unifiedSorted`: `?variant=a`s
  // redan facit-låsta beräkning rörs inte alls av denna skiva.
  const registerLista = useMemo(
    () =>
      [...visade].sort((a, b) => {
        const diff = registerOrdning(a) - registerOrdning(b);
        return diff !== 0 ? diff : inskickadTid(a) - inskickadTid(b);
      }),
    [visade],
  );

  // TASK-145.1 (AC #4/#5) — produktionens EGNA steg-märke. Separat från
  // `hallplatsMarkeFn` ovan (alltjämt `protoVariant != null`-gated, konsumerad
  // av `?variant=a`s ARBETSKÖ-render). [TASK-145.2] Delas numera ÄVEN med
  // produktionens `registerTraffar`-drivna filterlista (nedan i render) —
  // Steg-märket ÄR grupperingen överallt i registret, filtrerat eller ej.
  // Samma redan facit-byggda komponent/logik (`HallplatsMarke`/
  // `hallplatsSteg`) som `hallplatsMarkeFn` — ingen ny märkes-form
  // uppfunnen, bara en ny anropsplats.
  const registerHallplatsMarke = (r: Registration) => <HallplatsMarke steg={hallplatsSteg(r)} />;

  // [RIVEN, TASK-145.1] `bekraftadeVal`/`bekraftadeOppen` (Bekräftade-
  // arkivets fäll-/öppna-tillstånd, K40 inbox-fokus) bodde här — dess enda
  // anropsplats var `GruppRubrik`s `oppen`/`onToggle` på den nu rivna
  // Bekräftade-rubriken (AC #1). Registret har ingen fällbar sektion kvar.

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 1) —
  // den INFLYTTADE betalnings-arbetsytans K27-disclosure (se render, "Öppna
  // detaljer"). Egen lokal state, precis som Betalningar.tsx:s egen `oppen`.
  const [betalningOppen, setBetalningOppen] = useState(false);

  // TASK-145.2 (AC #2/#5) — PRODUKTIONENS EGEN filtrerade flata registervy.
  // Ersätter den rivna `traffar` (SummeringsFilter-baserad) med samma
  // `registerFilter.steg`/`stegTest` som toppblockets sju rader nu skriver/
  // läser (samma mekanism `?variant=a`s `registerListaA` redan bar, men denna
  // gren återanvänder OFÖRÄNDRAT den befintliga "Rensa filtret + platt lista"-
  // renderingen i stället för filterpanelen `RegisterFilterRad` — den senare
  // hör inte till denna skivas AC-lista).
  //
  // 'avbokad' är specialfallet (AC #5): avbokade är bortfiltrerade ur `aktiva`
  // och därmed ur `visade` helt (samma exkludering som `arAktiv`), så det
  // enda sättet att visa dem är att läsa `protoAvbokade` (HELA `registreringar`,
  // samma källa Avbokade-radens räknare redan bygger på) — oberoende av
  // flik-valet, precis som den gamla `AvbokadeRad` redan var.
  const registerTraffar = useMemo(() => {
    if (registerFilter.steg == null) return null;
    // [TASK-145.3] Även avbokade FIFO-sorteras: de delar hink (`registerOrdning`
    // 6) så bara anmälningsordningen skiljer dem åt, och registret ska visa
    // samma ordningsprincip oavsett vilket filter som är valt.
    if (registerFilter.steg === 'avbokad') {
      return [...protoAvbokade].sort((a, b) => inskickadTid(a) - inskickadTid(b));
    }
    // [TASK-145.3] Filtret läser `registerLista` (redan steg-/FIFO-sorterad),
    // inte `visade` (källordningen). Fram till denna skiva sorterades den
    // filtrerade vyn INTE alls — samma register kunde alltså visa samma
    // personer i två olika ordningar beroende på om ett filter var valt.
    // "Registret blir EN lista sorterad på fyra steg-hinkar" (PRD) gäller
    // registret, inte bara dess ofiltrerade läge.
    return registerLista.filter(stegTest(registerFilter.steg));
  }, [registerFilter.steg, registerLista, protoAvbokade]);

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 3):
  // "registret ... markera-läget verkar över visad lista" — den visade listan
  // är ANTINGEN ett aktivt steg-räknar-/logistik-filter (`registerTraffar`
  // ovan sedan TASK-145.2, tidigare `traffar`) ELLER, om inget är valt, HELA
  // den enade steg-sorterade listan (unifiedSorted). Variant A:s EGEN
  // "Rensa filter" (`RegisterFilterRad`, se render nedan) nollar
  // `registerFilter` i sin helhet (`TOMT_REGISTER_FILTER`, båda axlarna) —
  // [TASK-145.2] samma nollnings-anrop skarpa vyns `RensaFiltretKnapp` nu
  // använder (se render), sedan den gamla separata `filter`-staten (och dess
  // egen ofullständiga nollning) revs helt.
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
    setRegisterFilter((nu) => ({ ...nu, steg: nu.steg === s ? null : s }));
  };

  // Kryss-lägets STABILA sorterings-snapshot (K52): fångas när läget ÖPPNAS så
  // att en nykryssad rad inte hoppar upp under fingret — omsorteringen sker
  // först vid nästa öppning. `Set` av record-ID:n (visnings-oberoende av vilken
  // flik som är vald). null = läget är stängt.
  const [borOverSnapshot, setBorOverSnapshot] = useState<Set<string> | null>(null);
  const lodging = useSetBorOver(event.id);

  // [RIVEN, TASK-145.2] `vaxlaFilter` (SummeringsFilter-baserad) bodde här —
  // de fem gamla summeringsraderna använde den. `vaxlaSteg` (ovan) är nu den
  // ENDA vägen in i `registerFilter`, för alla sju rader i BÅDA lägena.
  //
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
    registerFilter.steg === 'bor-over' && borOverSnapshot != null
      ? [...visade].sort(
          (a, b) => Number(borOverSnapshot.has(b.id)) - Number(borOverSnapshot.has(a.id)),
        )
      : [];

  // [RIVEN, TASK-145.3] Hantera-flödet (task-48) — `useConfirmAll`-bulken och
  // `utfall`-staten bodde här. Bekräftelse-utskicket är inte längre
  // eventsidans arbete (AC #2): sidan är en ren översyn, och allt som
  // VERKSTÄLLER något bor på Åtgärds-sidan (`TASK-147`). Med
  // `bekraftaMarkerade` försvann den enda producenten av ett `utfall`, så
  // staten och dess MessageBox-yta är rivna med — se docblocket där
  // `SKICKAT_TITEL`/`skickatKvittens` en gång bodde.

  // REGISTRETS VISADE LISTA — TASK-145.3 (AC #2): markera-läget verkar över
  // VISAD lista, alltså den filtrerade vyn när ett steg-/logistik-filter är
  // valt (`registerTraffar`) och annars hela den steg-sorterade listan
  // (`registerLista`). Fram till denna skiva hade produktionens FILTRERADE
  // gren ingen batch-bar alls — Lotta kunde inte "filtrera fram de nio som
  // saknar slutbetalning" och sedan markera sex av dem (PRD användarberättelse
  // 12), vilket är hela skivans berättelse. EN lista, ETT ställe där markera
  // verkar.
  //
  // `bor-over` är undantaget och renderas aldrig genom denna variabel: den
  // grenen är KRYSS-läget (`BorOverKrysslage`, K52), en egen arbetsrad med
  // egen sortering — inte registret.
  const visadRegisterLista = registerTraffar ?? registerLista;

  // Markera-lägets kandidater — TASK-145.1 (AC #10), TASK-145.3 (AC #2):
  // produktionens kandidatmängd är den RENDERADE listan, alltså
  // `visadRegisterLista` ovan. [PROTOTYPE] [S93] konvergens-pass, variant A
  // ENDAST (Del 3 beslut 3): kandidaterna där är i stället `registerListaA` —
  // dess EGEN filtrerade vy, eller hela den enade listan när inget filter är
  // valt.
  const markeringKandidatIds =
    protoVariant === 'a' ? registerListaA.map((r) => r.id) : visadRegisterLista.map((r) => r.id);
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

  // [RIVEN, TASK-145.3] `bekraftaMarkerade` (bulk-mutationen med sin
  // proto-stubb, sitt icke-binära utfall och sin kvittens) och `oppnaMarkering`
  // (som bara nollade kvittensen innan den öppnade läget) bodde här. AC #2:
  // "bekräfta-flödet med kontrollfråga är RIVET ur eventsidan, inte dolt".
  // Vägen in i markera-läget är nu `markering.oppna` rakt av — det finns ingen
  // kvittens kvar att förbruka.

  // Signalen tänds bara när det finns något ATT skicka (K44).
  const signalText =
    totalt - eventinfoSkickade > 0 ? eventinfoSignal(event.startdatum ?? null) : null;

  return (
    <>
      {/*
       * TASK-145.2 (AC #1/#3/#4) — SUMMERINGSBLOCKET, HELA. Fram till denna
       * skiva grenade toppblocket på `protoVariant`: skarpa vyn (`== null`)
       * bar de fem gamla SummeringsRad-raderna, `?variant=a` bar den redan
       * facit-låsta HallplatsToppA + logistik-gruppen. Grenen är RIVEN —
       * facit-formen (nedan) renderas nu OVILLKORLIGT, för BÅDA `protoVariant`-
       * lägena, eftersom "Facit har alltså redan formen byggd i ?variant=a…
       * din uppgift är att flytta produktionsvyn dit" (uppdraget) och de två
       * lägena ska visa EXAKT samma block sedan facit-låsningen.
       *
       * KONVERGENS-PASSET (Del 3 § Valet) — variant A vann divergensen; B
       * (Stations-railen)/C (Nästa steg-panelen) är FÖRKASTADE och RIVNA (se
       * DeltagareHallplatsPrototyp.tsx). `HallplatsToppA` (fyra klickbara
       * steg-rader — Väntar på bekräftelse · Anmälningsavgifter ·
       * Slutbetalningar · Klara, byggkrav 2) + Eventinfo/Bor över/Avbokade
       * som logistik-gruppen — samma sju rader, samma ordning.
       *
       * PREMISS-DIVERGENS, öppet bokförd (ADR-086): uppdragets AC #3 citerar
       * en README-formulering ("egen divide-y-grupp, gap-2 mellan
       * grupperna") som beskriver EN TIDIGARE iterationsvåg. `gap-2` och
       * `border-t` mellan grupperna revs sedan MEDVETET (Marcus
       * 2026-08-05/06, se kommentarerna nedan) till förmån för att VARJE rad
       * bär sin egen `border-b` — sju likformiga rader utan extra luft
       * mellan grupperna. Den redan facit-låsta, Marcus-granskade koden
       * (nedan, ordagrant flyttad) är den auktoritativa formen; README-citatet
       * är stale. Se slutrapporten.
       *
       * PUNKT 3 (Marcus 2026-08-06): "Under Avbokade-raden är sista
       * avdelaren och den är fetare än de övriga."
       *
       * MÄTT: TVÅ kanter 1 px isär — Avbokade-radens egen `border-b` och en
       * på DENNA wrapper. Wrapperns kant kommer från `DetaljGrupp`s
       * `divide-y divide-border`, som lägger en kant på varje barn utom det
       * sista; blocket är inte sista barnet (registret följer nedanför), så
       * det fick en. Två 1 px-linjer med 1 px mellanrum läser som en
       * dubbelt så tjock linje.
       *
       * `border-b-0` river den ÄRVDA kanten. Raderna behåller sina egna, så
       * alla sju är exakt lika höga (53 px). `gap-2` borttaget i samma
       * vända: med kanten på Klara som enda avdelare lämnade gapet 8 px
       * luft mellan just DEN radgränsen och ingen annan — raderna såg olika
       * ut igen, fast åt andra hållet. Stacken är nu helt jämn: varje
       * radgräns är exakt en 1 px-kant.
       */}
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

            MÄTT: Klara-raden slutade med sin egen `border-b`, och DENNA
            wrapper började med en `border-t` — två linjer med 8 px tomrum
            emellan, vilket är precis vad en tunn tom rad ser ut som.
            `border-t pt-1` fanns för att skilja logistik-gruppen från
            steg-räknarna, men sedan förra vändan gav raderna sig själva
            kanter och Klaras `border-b` gör redan exakt det jobbet.

            Wrappern bär nu ingen egen kant och inget toppmellanrum — gruppen
            avgränsas av radens kant, som varje annan radgräns i blocket. */}
        <div className="flex flex-col">
          {/* ITERATIONSVÅG (Marcus 2026-08-05): "alla rader måste såklart
              vara lika höga". Samma `divide-y`-asymmetri som rättades i
              HallplatsRad drabbade sista raden HÄR också — "Avbokade" mättes
              1 px lägre än syskonens. Kanten läggs på VARJE barn i stället
              för mellan dem. */}
          <div className="[&>*]:border-border [&>*]:border-b">
            <SummeringsRad
              term="Eventinfo skickad"
              aktiv={registerFilter.steg === 'eventinfo-saknas'}
              onClick={() => vaxlaSteg('eventinfo-saknas')}
              signalSlot
              signal={
                // Auto-kryssen (K44, task-18.6) är RIVEN (grillad samsyn
                // beslut 2, S93 Del 3 — se docblocket där `AutoKryss` en
                // gång bodde). Slotten bär ENDAST "Dags att skicka"-badgen
                // när den är tänd, annars tom (reserverad höjd).
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
            {/* AC #4 — Avbokade-rad LÄNGST NER under "Bor över", samma
                SummeringsRad-grammatik (term-vänster/värde-höger, aldrig
                "N har avbokat" — facit-bilagan § 1). Klick filtrerar
                registret på de avbokade, lästa ur HELA `registreringar`
                (`protoAvbokade`, AC #5) — oberoende av flik-valet, eftersom
                avbokade redan är bortfiltrerade ur `aktiva`/`visade`. */}
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

      {/* [RIVEN, TASK-145.3] Bekräftelse-utfallets MessageBox-yta
          (`data-testid="bekraftelse-utfall"`) bodde här — se `bekraftaMarkerade`
          ovan. Ingen producent kvar ⇒ ingen yta kvar. */}

      {/* [PROTOTYPE] [S93] ITERATIONSVÅG 7 (Marcus 2026-08-06): "Även den som
          ligger längst ner i blocket precis över 'öppna detaljer'" — den
          ljusgrå avdelaren under denna wrapper.

          MÄTT, inte gissat: kanten sitter INTE på denna div (dess klasslista
          har ingen `border`). Den är ÄRVD från `DetaljGrupp`s
          `divide-y divide-border`, som lägger en kant på varje barn utom det
          sista — och denna wrapper är inte sista barnet, eftersom arbetsytan
          med "Öppna detaljer" följer under. Exakt samma mönster som rev den
          "fetare" avdelaren under Avbokade i iterationsvåg 2; `border-b-0`
          river den ärvda utan att röra något barns egen kant.

          SCOPAD TILL VARIANT A: klassen är villkorad, inte ovillkorlig.
          Wrappern är GEMENSAM för båda vyerna (bara innehållet är grenat), så
          en ovillkorlig `border-b-0` hade tagit bort avdelaren i skarpa vyn
          också — där ingen bett om det. */}
      <div className={cn('flex flex-col gap-2.5 py-3', protoVariant === 'a' && 'border-b-0')}>
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
              {/* [PROTOTYPE] [S93] ITERATIONSVÅG 5 (Marcus 2026-08-06):
                  filtervyn står nu ALLTID framme — Filtrera-knappen och hela
                  `Disclosure` är rivna ur `RegisterFilterRad`, och Markera
                  flyttade ner till batch-barens vänsterkant. Marcus: "Vi tar
                  bort Filtrera-knappen helt. Vi låter 'filtreringsvyn' vara
                  framme som default." Motiveringen bor i komponentens
                  docblock; kort: raden som trycktes ihop fanns bara för att
                  det gick att fälla ut något. */}
              <RegisterFilterRad
                filter={registerFilter}
                onFilterChange={(f) => {
                  markering.stang();
                  setRegisterFilter(f);
                }}
                visadeAntal={registerListaA.length}
                totaltAntal={unifiedSorted.length}
                // TALENS OLIKA BASER (Marcus 2026-08-06): `protoAvbokade` läser
                // HELA `registreringar`; `aktiva` (som topp-räknarna bygger på)
                // filtrerar bort dem. Skillnaden är precis det tal foten
                // förklarar — se RegisterFilterRad § Talens olika baser.
                avbokadeAntal={protoAvbokade.length}
              />
              {registerFilter.steg === 'bor-over' ? (
                <BorOverKrysslage
                  lista={markeringsLista}
                  protoDataMode={protoDataMode}
                  onToggle={toggleBorOver}
                />
              ) : (
                <>
                  {/* Baren renderas ALLTID i variant-läget (till skillnad från
                      skarpa vyn nedan, som monterar den först vid aktivt läge):
                      Markera-knappen bor i dess vänsterkant och måste stå kvar
                      även när markeringsläget är av. `aktivt` styr resten. */}
                  <MarkeringsBatchBar
                    antal={markering.antal}
                    totalt={registerListaA.length}
                    allaValda={markering.allaValda}
                    onMarkeraAlla={markering.markeraAlla}
                    onRensa={markering.rensa}
                    aktivt={markering.aktivt}
                    markeraKnapp={
                      <MarkeraKnapp
                        aktivt={markering.aktivt}
                        onOppna={markering.oppna}
                        onStang={markering.stang}
                        buttonRef={markeraKnappRef}
                      />
                    }
                    valdaNamn={registerListaA
                      .filter((r) => markering.valda.has(r.id))
                      .map(displayName)}
                  />
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
        ) : registerFilter.steg === 'bor-over' ? (
          // KRYSS-LÄGET (K52) är registrets enda gren som INTE är registret:
          // en egen arbetsrad med egen sortering och egen (avsiktlig)
          // skrivväg. Markera-läget verkar inte här — se `visadRegisterLista`.
          <>
            <RensaFiltretKnapp onClick={() => setRegisterFilter(TOMT_REGISTER_FILTER)} />
            <BorOverKrysslage
              lista={markeringsLista}
              protoDataMode={protoDataMode}
              onToggle={toggleBorOver}
            />
          </>
        ) : (
          // TASK-145.1 — REGISTRET SOM EN LISTA (AC #1–#7, #10, #11).
          // Obekräftade-kön och Bekräftade-arkivet (var sin `GruppRubrik`,
          // äldst-/senast-först-sortering) är RIVNA — `registerLista` (ovan)
          // är den enda listan, `registerOrdning`-sorterad i fyra steg-hinkar
          // med FIFO inom var och en. Steg-märket (`registerHallplatsMarke`)
          // ÄR grupperingen — ingen sektionsrubrik renderas, exakt ETT märke
          // per person (se `hallplatsSteg`s prioritetsordning).
          //
          // TASK-145.3 (AC #2) — EN GREN, INTE TVÅ. Fram till denna skiva var
          // filtrerat och ofiltrerat läge två SEPARATA renderingar: den
          // filtrerade bar ingen batch-bar, ingen `rullande`-klipphöjd, inget
          // `testId` och ingen `ariaLabel`. Följden var att markera-läget inte
          // gick att nå ur ett filtrerat läge alls — precis den berättelse
          // skivan äger ("Lotta filtrerar fram de nio som saknar
          // slutbetalning, slår på Markera, bockar sex av dem"). Grenarna är
          // nu EN, driven av `visadRegisterLista`; "Rensa filtret" är det enda
          // som tillkommer när ett filter är valt.
          //
          // K57: "Visar:"-raden och instruktionstexten är RIVNA — man har ju
          // tryckt på raden. Rensa-knappen står ensam, högerställd.
          // `setRegisterFilter(TOMT_REGISTER_FILTER)` nollar HELA
          // filtertillståndet (steg OCH vagIn) i ETT anrop.
          //
          // MARKERA-KNAPPENS EGNA FÖRANKRING (145.1 AC #11): `GruppRubrik`s
          // `handling`-slot försvann med rubriken den satt på — knappen bor i
          // `MarkeringsBatchBar`s vänsterkant via dess `markeraKnapp`-prop.
          <div>
            {registerTraffar != null && (
              <RensaFiltretKnapp onClick={() => setRegisterFilter(TOMT_REGISTER_FILTER)} />
            )}
            {visadRegisterLista.length === 0 ? (
              <p className="py-2 text-small text-text-secondary">
                {registerTraffar != null
                  ? 'Inga träffar i denna kategori.'
                  : 'Inga deltagare i denna kategori.'}
              </p>
            ) : (
              <>
                <MarkeringsBatchBar
                  antal={markering.antal}
                  totalt={visadRegisterLista.length}
                  allaValda={markering.allaValda}
                  onMarkeraAlla={markering.markeraAlla}
                  onRensa={markering.rensa}
                  aktivt={markering.aktivt}
                  markeraKnapp={
                    <MarkeraKnapp
                      aktivt={markering.aktivt}
                      onOppna={markering.oppna}
                      onStang={markering.stang}
                      buttonRef={markeraKnappRef}
                    />
                  }
                  // AC #2, "tar urvalet vidare": namnen läses ur den VISADE
                  // listan i dess visningsordning, så platshållaren speglar
                  // exakt det Lotta ser sig ha markerat.
                  valdaNamn={visadRegisterLista
                    .filter((r) => markering.valda.has(r.id))
                    .map(displayName)}
                />
                {/* [TASK-145.4] `visaUtskicksRader`-övertrampet är BORTA (se
                    KortInnehall § TASK-145.1-docblocket) — ersättningen
                    (BetalningsDetaljer/"Öppna detaljer", Tidslinje) finns nu i
                    produktionen, så defaultbeteendet gäller. */}
                <DeltagarListan
                  rader={visadRegisterLista}
                  eventId={event.id}
                  rullande
                  testId="deltagar-register"
                  ariaLabel="Deltagarregister"
                  markering={
                    markering.aktivt ? { valda: markering.valda, vaxla: markering.vaxla } : null
                  }
                  hallplatsMarke={registerHallplatsMarke}
                />
              </>
            )}
          </div>
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
      {/* [TASK-145.4] AC #2 — arbetsytan renderas nu OVILLKORLIGT (tidigare
          `protoVariant === 'a' && …`), för BÅDA lägena, eftersom facit-formen
          nedan (BetalningsDetaljer, protoAktiv) är den ENDA formen som ska
          visas: skarpa vyn hade fram till denna skiva ingen ersättning alls
          (Betalningar-toppblocket bar den gamla, skrivbara formen — se
          EventDetail.tsx). `protoAktiv` är ovillkorligt sant: läsyte-formen
          (kortyta, ingen Input, Tidslinje, ingen röd etikett) är den enda
          formen som får landa, i BÅDA lägena — inte en prototyp-specifik gren
          längre. */}
      {aktiva.length > 0 && (
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
