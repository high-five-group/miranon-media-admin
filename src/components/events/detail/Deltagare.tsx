import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useSetBorOver } from '@/data/mutations/registrationLodging';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { arAktivAnmalan } from '@/lib/aktiv-anmalan';
import { queryKeys } from '@/queries/keys';
// Betalningars arbetsyta flyttade in i Anmälda deltagare (S93 konvergens-pass
// Del 3 beslut 1) — se ArbetsKo:s "Öppna detaljer" nedan.
import { BetalningsDetaljer, DetaljRad } from './Betalningar';
// Registrets steg-märke, toppräknare och filterpanel — PRODUKTIONSKOD sedan
// TASK-145.1/145.2/162.3 trots filnamnet (S93-hållplats-prototypens
// huvudfil): innehållet promoverades i sin helhet, se filens egen docblock.
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
  hallplatsSteg,
  type RegisterFilter,
  type RegisterStegFilter,
  registerOrdning,
  stegTest,
  TOMT_REGISTER_FILTER,
  vagInTest,
} from './hallplats-steg-prototyp';

/**
 * Urvalet (TASK-228) bärs i NAVIGERINGENS history-state — samma idiom som
 * `ManuellAnmalanForm.tsx` § `mmAvsloja`: ett engångs-fat som seedar
 * Åtgärds-sidans INITIALA mottagarurval, inte ett bokmärkbart filter (hon
 * äger urvalet lokalt därefter — `AtgardsSida.tsx` § "därefter äger Lotta
 * urvalet"). Ett urval av registrerings-ID:n, inte ett shareable-state:
 * URL-STATE-SPEC:s "allt som påverkar VAD som visas lever i URL:en" gäller
 * DURABELT/delbart state (filter, sök, flik) — mottagarurvalet är varken,
 * exakt samma skäl som `mmAvsloja` valde history-state framför search-param
 * (`ny-anmalan.tsx`s kommentar om `fran`: "en tillbaka-väg måste överleva en
 * omladdning; avslöjnings-avsikten behöver inte det").
 */
declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Markerade registrerings-ID:n, i visningsordning (TASK-228) — satt av
        `MarkeringsBatchBar`s Åtgärder-knapp, läst EN gång av `AtgardsSida`s
        seedning. */
    mmAtgardsUrval?: string[];
  }
}

/**
 * Anmälda deltagare som ARBETSKÖ — skelettet (task-18.4; S73-facit K35–K58).
 * Nyskriven mot facit-bilagan (throwaway-kontraktet — prototypkod absorberas
 * aldrig); K-referenserna pekar på den låsta konvergens-trailen.
 *
 * Formen (uppifrån och ned): fyra KLICKBARA summeringsrader i Lottas
 * utskicksordning (K42: bekräftelse → påminnelse → eventinfo) med
 * eventinfo-signalens alltid reserverade slot (K43/K44) → REGISTRETS
 * FILTERPANEL (`RegisterFilterRad` — Visa-dropdown åtta val + Väg in-dropdown
 * fem val, kombinerbara) → REGISTRET, sedan TASK-145.1 EN enda
 * `DeltagarListan` (se `registerListaA` i `ArbetsKo`), inte längre
 * Obekräftade/Bekräftade som två separata accordions (K40s ursprungliga par
 * är rivet — se § REGISTRET nedan).
 *
 * [RIVEN, TASK-162.3] Kategori-flikarna ("Alla/Manuella/Medföljande",
 * ToggleButtonGroup, K41) OCH den gamla flata "Rensa filtret"-grenen
 * (K57) är BORTA — ADR-103 B2 steg 1: variant-formens filterpanel
 * (byggd i konvergens-passet, vågorna 5/6/8/9) är nu den OVILLKORLIGA
 * registerformen, för BÅDA `protoVariant`-lägena. "Väg in"-dropdownen
 * ersätter flikarnas tre värden med fem, kombinerbara med steg-axeln
 * ("medföljande som saknar slutbetalning") — se `RegisterFilterRad`
 * (DeltagareHallplatsPrototyp.tsx). Git bevarar flik-grenens kod
 * (TASK-145.1–145.3-historiken i denna fils blame).
 *
 * § REGISTRET (TASK-145.1; PRD TASK-145 "Registret blir EN lista";
 * TASK-162.3 "Registrets promovering") — Obekräftade-kön och
 * Bekräftade-arkivet, var och en med egen `GruppRubrik` och egen
 * sorteringsordning, är RIVNA. Ersättaren är EN `DeltagarListan` sorterad på
 * FYRA steg-hinkar (`registerOrdning`, hallplats-steg-prototyp.ts) — väntar
 * på bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara,
 * med inställt/på-väg-till-väntelista/AVBOKAD sist (TASK-162.3 AC #2:
 * avbokade är numera EN DEL av registrets bas, grå-märkta av `HallplatsMarke`,
 * inte längre bortfiltrerade — se `unifiedSorted`/`registerListaA` nedan) —
 * och INOM varje hink i anmälningsordning (äldst-registrerad-först, samma
 * FIFO-semantik Obekräftade-kön hade, nu enhetlig över hela registret).
 * Steg-märket (`HallplatsMarke`, `registerHallplatsMarke` i `ArbetsKo`) ÄR
 * grupperingen — inga sektionsrubriker renderas, exakt ETT märke per person
 * även när flera steg är ogjorda (prioritetsordningen bor i
 * `hallplatsSteg()`). SKIVGRÄNS (öppet bokförd): de fyra KLICKBARA
 * summeringsraderna ovan (redan ovillkorliga sedan TASK-145.2) är OFÖRÄNDRADE
 * av denna skiva — TASK-162.3 rör ENDAST registrets egen filterpanel/bas/
 * avdelare/Bor över-ram/noll-träffar-form (A2–A6, facitkartan); en ny
 * fyra-hinks räknar-rad äger `TASK-145.2`.
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
 * **Åtgärder** och tar urvalet vidare — sedan TASK-228 en RIKTIG navigation
 * till Åtgärds-sidan (`MarkeringsBatchBar`s egen docblock). Vägen in är
 * Markera-knappen, förankrad i batch-barens vänsterkant (§ REGISTRET ovan —
 * rubrikraden den satt på är riven); Esc och Avbryt är vägarna ut, oförändrat.
 *
 * KANDIDATMÄNGDEN ÄR VISAD LISTA (TASK-145.3 AC #2, promoverad TASK-162.3):
 * `registerListaA` i `ArbetsKo` — den filtrerade vyn när ett steg-/
 * logistik-/väg-in-filter är valt, annars hela den steg-sorterade listan
 * (`unifiedSorted`, avbokade inräknade). Markera-läget kräver alltså inget
 * filter, men följer med i ett — och kan numera markera avbokade poster
 * också, eftersom de är en del av registrets bas (AC #2). Auto-utskicks-
 * krysset (K44) i signal-slotten är rivet sedan TASK-145.2.
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
 * Avbokade/ombokade OCH inställda räknas bort ur SUMMERINGARNA och
 * topp-räknarna (`arAktivAnmalan`, samma basformel-disciplin som
 * Betalningar-gruppen — TASK-368.1/213.8 utökade predikatet till att även
 * exkludera Inställt, 2026-09-03) — en avbokad eller inställd anmälan är
 * inte Lottas ARBETE. [ÄNDRAT, TASK-162.3 AC #2] Registret självt är
 * undantaget: avbokade syns numera i registrets bas (grå-märkta av
 * `HallplatsMarke`, sist i ordningen via `registerOrdning`s hink 6) —
 * Marcus iterationsvågs-beslut "avbokade ska även synas i registret självt",
 * promoverat från `?variant=a` till den ovillkorliga formen. `protoAvbokade`
 * (nedan) läser fortfarande HELA `registreringar` oberoende av detta, för
 * Avbokade-summeringsraden och steg-filtrets 'avbokad'-val.
 *
 * A11y (11/10): summeringsraderna är knappar med `aria-pressed` (filtret är ett
 * toggle-tillstånd); filterpanelen (§ REGISTRET) är två `Select`-primitiv, ingen
 * radiogroup längre — [RIVEN, TASK-162.3] kategori-flikarna (ToggleButtonGroup,
 * "Alla/Manuella/Medföljande") är promoverade bort, se § REGISTRET nedan;
 * registret är en `<ul>` utan `aria-expanded`/`aria-controls` sedan
 * `GruppRubrik`s accordion-par revs (TASK-145.1) — steg-märket bär sin
 * egen text, färg aldrig ensam bärare; räknarna står som TEXT i etiketterna
 * (skärmläsaren får hela bilden); signal-badgen bär sin text likaså.
 */

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

/**
 * [RIVEN, TASK-162.3 AC #1] `FlikNyckel` ('alla' | 'manuell' | 'medfoljande',
 * K41) bodde här — kategori-flikarnas nyckeltyp. Ersatt av `VagInFilter`
 * (hallplats-steg-prototyp.ts), registerpanelens "Väg in"-axel, som redan
 * bar samma tre värden plus två till ('formular', 'vantelista') och kan
 * KOMBINERAS med steg-axeln — flikarna kunde inte kombineras med något.
 */

/**
 * [RIVEN, TASK-145.2] `SummeringsFilter`/`FILTER_TEST` (de fem gamla
 * klickbara summeringsraderna: Obekräftade/Anmälningsbekräftelse skickad/
 * Betalningspåminnelse skickad/Deltagarinfo skickad/Bor över) bodde här.
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
  if (dagarKvar === 0) return 'Dags att skicka - eventet är idag';
  if (dagarKvar === 1) return 'Dags att skicka - eventet är imorgon';
  return `Dags att skicka - eventet är om ${dagarKvar} dagar`;
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
 * UTGÅNGEN ÄR EN RIKTIG NAVIGATION (TASK-228). [RIVEN, TASK-228] Fram till
 * TASK-147 landade var den en ÄRLIG INTERIM (AC #3 i TASK-145.3): en
 * disclosure mot en platshållare på samma sida ("Åtgärds-sidan är inte byggd
 * ännu…", `aria-expanded`/`aria-controls`, `data-testid="atgarder-
 * platshallare") — ingen länk, ingen chevron, eftersom båda hade lovat en
 * navigation som saknades. Åtgärds-sidan finns nu (`/event/$eventId/
 * atgarder`, TASK-147-serien), så knappen NAVIGERAR dit och skickar urvalet
 * med i navigeringens history-state (`mmAtgardsUrval`, se modul-
 * augmenteringen ovan) — samma engångsfat-idiom som `mmAvsloja`.
 */
function MarkeringsBatchBar({
  antal,
  totalt,
  allaValda,
  onMarkeraAlla,
  onRensa,
  eventId,
  valdaIds,
  markeraKnapp,
  aktivt,
}: {
  antal: number;
  totalt: number;
  allaValda: boolean;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  /** Eventet urvalet gäller — Åtgärder navigerar till dess Åtgärds-sida
      (TASK-228). */
  eventId: string;
  /** De markerades registrerings-ID:n, i visningsordning — urvalet som följer
      med till Åtgärds-sidan (TASK-228, AC #1) via navigeringens
      history-state. */
  valdaIds: string[];
  /** Markera/Avbryt-knappen, förankrad i barens vänsterkant. Renderas i BÅDA
      lägena — se § GEOMETRIN ovan. */
  markeraKnapp: React.ReactNode;
  /** Markera-läget på/av. `false` ⇒ enbart `markeraKnapp` syns. */
  aktivt: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2 pb-2.5">
      {markeraKnapp}
      {aktivt && (
        <Button
          intent="primary"
          size="sm"
          isDisabled={antal === 0}
          onPress={() =>
            navigate({
              to: '/event/$eventId/atgarder',
              params: { eventId },
              // Urvalet i history-state (TASK-228) — spridningen bevarar
              // routerns interna nycklar, samma form som ManuellAnmalanForm.tsx
              // § mmAvsloja.
              state: (prev) => ({ ...prev, mmAtgardsUrval: valdaIds }),
            })
          }
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
      {/* Live-räknaren: seende ser antalet i räkningen på Åtgärds-sidan efter
          navigation, skärmläsaren får det här. `polite` — urvalet är löpande
          arbete, aldrig ett avbrott värt assertive.

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
  );
}

/**
 * [RIVEN, TASK-145.2] `isoDatum`/`AutoKryss` (auto-utskicks-krysset, K44) bodde
 * här. Grillad samsyn beslut 2 (S93 Del 3, `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`
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
  /** De tre utskicks-metaraderna (Bekräftelse/Påminnelse/Deltagarinfo-datum)
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
            107,42 · "Medföljande" 90,09 · "Obekräftad" 82,67. (Obekräftad-talet
            är ~2 px lågt sedan 2026-09-01: pillen går nu genom `StatusBadge`,
            som bär `border border-transparent` — den reserverade px:en som gör
            att `contrast-more` inte hoppar. Marginalen till 120 px är
            oförändrat god, så slot-bredden rörs inte; talet står kvar med sin
            avvikelse noterad i stället för att skrivas om utan ommätning.) Två pillar
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
          {/* DEN RÖDA HANDRULLADE PILLEN ÄR RIVEN (Marcus dom 2026-09-01).
              Samma ord bar TRE former i appen: röd `bg-error-bg`/`text-error`
              här och i `AtgardsSida.tsx`, kopparfärgad `StatusBadge
              ton="warning"` på betalningsytorna och anmälans detaljsida.
              `events/detail/Betalningar.tsx` bokförde konflikten redan
              2026-08-06 ("Ett ord, en färg, hela appen") men konverterade bara
              sin egen yta — dessa två blev kvar. Nu går alla genom
              `StatusBadge`, och tonen är NEUTRAL: "Obekräftad" har ett eget
              bekräftelseflöde och är det normala läget för en ny anmälan.
              Rött sade "fel har inträffat" om något som inte är ett fel. */}
          {!arBekraftad(reg) && !vald && !hallplatsMarke && (
            <StatusBadge ton="neutral" storlek="sm">
              Obekräftad
            </StatusBadge>
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
          <MetaRad ikon={MailCheck}>{`Deltagarinfo ${eventinfo}`}</MetaRad>
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
}: {
  reg: Registration;
  onToggle: (reg: Registration, borOver: boolean) => void;
}) {
  const pill = KATEGORI_PILL[kategori(reg)];
  return (
    <Checkbox
      data-testid="bor-over-rad"
      isSelected={reg.borOver === true}
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

/**
 * [RIVEN, TASK-162.3 AC #1] K57:s högerställda "Rensa filtret"-knapp
 * (`RensaFiltretKnapp`) bodde här — den gamla flata registerformens rensa-
 * väg. Registrets ENDA rensa-ingång är nu `RegisterFilterRad`s "Rensa
 * filter"-knapp (DeltagareHallplatsPrototyp.tsx), som redan bar en
 * räknebadge den gamla länken saknade. Git bevarar funktionen i denna fils
 * blame.
 */

/** KRYSS-LÄGET (K52): ALLA aktiva anmälda i EN kolumn, säng-kryss per rad.
    Utbruten sedan konvergens-passet (S93 Del 3). [ÄNDRAT, TASK-162.3] En
    enda anropsplats sedan flik-grenens egen kryss-branch är riven — se
    `ArbetsKo`s render. */
function BorOverKrysslage({
  lista,
  onToggle,
}: {
  lista: Registration[];
  onToggle: (reg: Registration, borOver: boolean) => void;
}) {
  if (lista.length === 0) {
    return <p className="py-2 text-small text-text-secondary">Inga deltagare i denna kategori.</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {lista.map((reg) => (
        <li key={reg.id}>
          <BorOverRad reg={reg} onToggle={onToggle} />
        </li>
      ))}
    </ul>
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

// [RIVEN, TASK-162.3 AC #1/#4] `protoVariant` (`HallplatsVariant | null`) var
// tidigare en egen prop här — hela `ArbetsKo`s rendering grenade på den
// (flikar kontra filterpanel). Sedan promoveringen läste ingen gren i denna
// funktion `protoVariant` längre (registrets form var ovillkorlig), så propen
// var genuint död. [RIVEN, TASK-145.6] `protoDataMode` (`?data=proto` —
// stubbade bekräfta-/Bor-över-mutationerna i fixturläget) är riven av samma
// skäl: hela hållplats-prototypens `?variant=`-maskineri är borta, och
// `registreringar` kommer numera alltid ur den riktiga hämtningen.
function ArbetsKo({ event, registreringar }: { event: Event; registreringar: Registration[] }) {
  // [RIVEN, TASK-145.1] `panelId` (useId) bodde här — dess enda konsumenter
  // var Obekräftade/Bekräftade-panelernas `id`-attribut, borta med
  // `GruppRubrik`s två produktions-anropsplatser (AC #1).
  // [RIVEN, TASK-162.3 AC #1] `flik`/`setFlik` (FlikNyckel-statet som drev
  // kategori-flikarna) bodde här. Registrets "väg in"-axel bor numera i
  // `registerFilter.vagIn` (ETT tillstånd nedan) i stället för ett separat
  // state — samma konsolidering som `registerFilter.steg` redan gjorde med
  // de fem gamla summeringsraderna (se kommentaren nedan).
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

  const aktiva = useMemo(() => registreringar.filter(arAktivAnmalan), [registreringar]);

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
  // [RIVEN, TASK-162.3 AC #1] `hallplatsMarkeFn` (`protoVariant != null ? …
  // : undefined`) bodde här — registrets STEG-märke är nu ovillkorligt (samma
  // form i BÅDA `protoVariant`-lägena), så den villkorade varianten hade blivit
  // AKTIVT FEL efter promoveringen (den hade tystat märket i produktion utan
  // `?variant=a`). `registerHallplatsMarke` (nedan) — redan ovillkorlig,
  // redan skarpa vyns egen — är nu den ENDA källan för registrets märke.

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

  // Summeringarna räknar ALLTID hela eventet (K38) — registrets filterpanel
  // (Visa/Väg in) påverkar bara listan under, aldrig "hur många".
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

  // [RIVEN, TASK-162.3 AC #1] `visade` (flik-filtrerad `aktiva`) och
  // `antalKategori` (flikarnas räknare) bodde här. `markeringsLista` (nedan,
  // Bor över-kryssläget) läser `aktiva` direkt nu — flik-axeln fanns aldrig i
  // variant A:s egen rendering (den var alltid 'alla' där), så bytet är
  // no-op för Bor över-lägets kandidatmängd.

  // [RIVEN, TASK-145.1] `obekraftade`/`bekraftade` (Obekräftade-kön/
  // Bekräftade-arkivet, var sin äldst-/senast-först-sortering) bodde här —
  // ersatta av `unifiedSorted`/`registerListaA` nedan (AC #1: EN lista,
  // `registerOrdning`-sorterad). Ingen annan anropsplats kvar (verifierat
  // med grep).

  // REGISTRETS BAS (konvergens-passet, Del 3 beslut 2/3 — PROMOVERAD,
  // TASK-162.3 AC #1/#2): EN lista, steg-ordning (ogjort överst) +
  // anmälningsordning (ÄLDST FÖRST — samma FIFO-semantik som den gamla
  // Obekräftade-kön, nu tillämpad enhetligt över samtliga steg i stället för
  // bara kön) inom varje steg. `registerOrdning` (hallplats-steg-prototyp.ts)
  // är den finmaskigare fyra-hinks-sorteringen (delar "väntar på betalning" i
  // avgift/slut, samma delning som byggkrav 2:s summeringsrader), med
  // avbokade sist (hink 6).
  //
  // BASEN ÄR HELA `registreringar` — INTE `aktiva`, ITERATIONSVÅG (Marcus
  // punkt 3), promoverad från `?variant=a` till den ENDA formen av denna
  // skiva: "avbokade ska även synas i registret självt", och `aktiva`
  // filtrerar bort dem. Vägen in (tidigare Alla/Manuella/Medföljande-fliken)
  // är sedan TASK-162.3 en axel i filterpanelen i stället, applicerad i
  // `registerListaA` nedan.
  const unifiedSorted = useMemo(
    () =>
      [...registreringar].sort((a, b) => {
        const diff = registerOrdning(a) - registerOrdning(b);
        return diff !== 0 ? diff : inskickadTid(a) - inskickadTid(b);
      }),
    [registreringar],
  );

  // Registrets EGNA steg-märke (TASK-145.1 AC #4/#5, ovillkorlig sedan
  // TASK-162.3 — se `hallplatsMarkeFn`s rivnings-kommentar ovan). Steg-märket
  // ÄR grupperingen överallt i registret, filtrerat eller ej.
  const registerHallplatsMarke = (r: Registration) => <HallplatsMarke steg={hallplatsSteg(r)} />;

  // [RIVEN, TASK-145.1] `bekraftadeVal`/`bekraftadeOppen` (Bekräftade-
  // arkivets fäll-/öppna-tillstånd, K40 inbox-fokus) bodde här — dess enda
  // anropsplats var `GruppRubrik`s `oppen`/`onToggle` på den nu rivna
  // Bekräftade-rubriken (AC #1). Registret har ingen fällbar sektion kvar.

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 1) —
  // den INFLYTTADE betalnings-arbetsytans K27-disclosure (se render, "Öppna
  // detaljer"). Egen lokal state, precis som Betalningar.tsx:s egen `oppen`.
  const [betalningOppen, setBetalningOppen] = useState(false);

  // [RIVEN, TASK-162.3 AC #1] `registerTraffar` (den gamla flata "Rensa
  // filtret"-grenens filtrerade vy, med ett eget specialfall för
  // `registerFilter.steg === 'avbokad'` som läste `protoAvbokade` direkt) och
  // `visadRegisterLista` (`registerTraffar ?? registerLista`) bodde här.
  // Specialfallet behövs inte längre: `registerListaA` (nedan) filtrerar
  // `unifiedSorted`, som redan INKLUDERAR avbokade (hink 6) — `stegTest
  // ('avbokad')` träffar dem via SAMMA väg som alla andra steg-val, med
  // SAMMA registerOrdning+FIFO-sortering i stället för en avvikande
  // `inskickadTid`-bara sortering. `protoAvbokade` lever kvar — den matar
  // fortfarande Avbokade-summeringsradens räknare och `RegisterFilterRad`s
  // "N av dem är avbokade"-tillägg (TALENS OLIKA BASER, se render).
  //
  // REGISTRETS FILTRERADE VY (TASK-145.2/145.3, promoverad TASK-162.3):
  // `registerFilter.steg`/`vagIn` läser samma `stegTest`/`vagInTest`
  // (hallplats-steg-prototyp.ts) som toppblockets sju rader och
  // `RegisterFilterRad`s två dropdowns skriver — EN mekanism, aldrig två som
  // kan divergera. Axlarna KOMBINERAS ("medföljande som saknar
  // slutbetalning"), till skillnad från den rivna flikens ena axel som inte
  // kunde kombineras med något.
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
  // först vid nästa öppning. `Set` av record-ID:n. null = läget är stängt.
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

  const toggleBorOver = (reg: Registration, borOver: boolean) => {
    lodging.mutate({ registration: reg, borOver });
  };

  // Kryss-lägets lista: ALLA aktiva anmälda (arbetsrad, inte filterlista;
  // avbokade hör inte hemma i en säng-tilldelning) med ikryssade — enligt
  // snapshoten — överst. Array.sort är stabil (ES2019) så inbördes ordning
  // bevaras inom varje grupp. [ÄNDRAT, TASK-162.3 AC #1] Läste tidigare
  // `visade` (flik-filtrerad `aktiva`) — flik-axeln fanns aldrig i variant
  // A:s egen Bor över-rendering (den var alltid 'alla' där, se den rivna
  // `FlikNyckel`-kommentaren ovan), så bytet till `aktiva` direkt är no-op.
  const markeringsLista =
    registerFilter.steg === 'bor-over' && borOverSnapshot != null
      ? [...aktiva].sort(
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

  // [RIVEN, TASK-162.3 AC #1] `visadRegisterLista` (`registerTraffar ??
  // registerLista`) bodde här. Markera-lägets kandidatmängd är sedan
  // promoveringen alltid `registerListaA` (nedan) — TASK-145.1 (AC #10) och
  // TASK-145.3 (AC #2): produktionens kandidatmängd är den RENDERADE listan,
  // alltså den filtrerade vyn när ett steg-/väg in-filter är valt och annars
  // HELA den enade steg-sorterade listan. Fram till TASK-145.3 hade
  // produktionens FILTRERADE gren ingen batch-bar alls — Lotta kunde inte
  // "filtrera fram de nio som saknar slutbetalning" och sedan markera sex av
  // dem (PRD användarberättelse 12), vilket är hela den skivans berättelse.
  // EN lista, ETT ställe där markera verkar — och sedan TASK-162.3 kan Lotta
  // markera avbokade poster också, eftersom de nu är en del av samma lista
  // (AC #2).
  //
  // `bor-over` är undantaget och renderas aldrig genom denna variabel: den
  // grenen är KRYSS-läget (`BorOverKrysslage`, K52), en egen arbetsrad med
  // egen sortering — inte registret.
  const markeringKandidatIds = registerListaA.map((r) => r.id);
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
       * Slutbetalningar · Klara, byggkrav 2) + Deltagarinfo/Bor över/Avbokade
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
              term="Deltagarinfo skickad"
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
                (`protoAvbokade`, AC #5) — samma personer som nu (TASK-162.3
                AC #2) redan syns i registrets OFILTRERADE bas; raden ger en
                GENVÄG till just dem, oberoende av `aktiva` som denna räknare
                exkluderar dem ur. */}
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

          OVILLKORLIG SEDAN TASK-162.3 (AC #3, facitkartan § A4). Klassen var
          tidigare scopad till `protoVariant === 'a'` — river nu avdelaren
          alltid, eftersom registrets form (denna wrapper HELA innehållet)
          inte grenar på något variant-villkor (TASK-145.6 rev resten). */}
      {/* [TASK-162.1] `data-testid="register-yta"` — promoverings-grindens
          lokator (ADR-103 B4). Wrappern är redan GEMENSAM för båda vyerna
          (se kommentaren ovan), så testid:t ändrar ingen gren och flippar
          ingen form — det ger bara ariaSnapshot-grinden ett stabilt fäste
          runt precis det innehåll som facitkartan (A2–A6) pekar ut som
          registrets yta, utan att dra in toppblocket (6a, redan identiskt)
          eller betalningsarbetsytan (6h, redan identisk) i referensen. */}
      <div data-testid="register-yta" className="flex flex-col gap-2.5 border-b-0 py-3">
        {/*
         * REGISTRETS PROMOVERING (TASK-162.3, ADR-103 B2 steg 1) —
         * facitkartans A2–A6, EN skiva eftersom avvikelserna delar kod och
         * tillstånd (R9-felet igen annars). Villkoret som höll denna form
         * bakom `protoVariant === 'a'` är FLIPPAT: filterpanelen
         * (`RegisterFilterRad`), registrets bas (avbokade inräknade,
         * AC #2), Bor över-kryssläget bakom SAMMA panel-ram (AC #3) och
         * batch-baren vid noll träffar (AC #3) är nu den OVILLKORLIGA formen
         * — för BÅDA `protoVariant`-lägena. Kategori-flikarna
         * ("Alla/Manuella/Medföljande", K41) och den gamla flata
         * "Rensa filtret"-grenen (`RensaFiltretKnapp`, `registerLista`,
         * `registerTraffar`, `visadRegisterLista`) är RIVNA (AC #1) — git
         * bevarar dem i denna fils blame (TASK-145.1–145.3).
         *
         * [RIVEN, TASK-145.6] `protoVariant`/`protoDataMode` och hela
         * `?variant=`/`?data=proto`-maskineriet (ADR-103 B2 steg 4, efter
         * Marcus godkännande) är rivna — registret läser numera alltid den
         * riktiga hämtningen, ingen datagren kvar att välja mellan.
         */}
        {unifiedSorted.length === 0 ? (
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
              <BorOverKrysslage lista={markeringsLista} onToggle={toggleBorOver} />
            ) : (
              <>
                {/* Baren renderas ALLTID (AC #3, facitkartan § A6) — även vid
                    noll träffar och även när markeringsläget är av: Markera-
                    knappen bor i dess vänsterkant och måste stå kvar.
                    `aktivt` styr resten. */}
                <MarkeringsBatchBar
                  antal={markering.antal}
                  totalt={registerListaA.length}
                  allaValda={markering.allaValda}
                  onMarkeraAlla={markering.markeraAlla}
                  onRensa={markering.rensa}
                  aktivt={markering.aktivt}
                  eventId={event.id}
                  markeraKnapp={
                    <MarkeraKnapp
                      aktivt={markering.aktivt}
                      onOppna={markering.oppna}
                      onStang={markering.stang}
                      buttonRef={markeraKnappRef}
                    />
                  }
                  valdaIds={registerListaA
                    .filter((r) => markering.valda.has(r.id))
                    .map((r) => r.id)}
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
                    hallplatsMarke={registerHallplatsMarke}
                  />
                ) : (
                  <p className="py-2 text-small text-text-secondary">
                    Inga träffar i denna kategori.
                  </p>
                )}
              </>
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
      {/* [TASK-145.4] AC #2 — arbetsytan renderas OVILLKORLIGT (tidigare
          `protoVariant === 'a' && …`): skarpa vyn hade fram till denna skiva
          ingen ersättning alls (Betalningar-toppblocket bar den gamla,
          skrivbara formen — se EventDetail.tsx). [RIVEN, TASK-145.6]
          `BetalningsDetaljer`s `protoAktiv`/`protoDataMode`-props är rivna —
          läsyte-formen (kortyta, ingen Input, Tidslinje, ingen röd etikett)
          är nu komponentens ENDA form, inte längre ett variant-val. */}
      {aktiva.length > 0 && (
        <div>
          <DetaljRad
            oppen={betalningOppen}
            kontrollerarId="deltagare-betalningsdetaljer"
            onToggle={() => setBetalningOppen((v) => !v)}
          />
          <div id="deltagare-betalningsdetaljer" hidden={!betalningOppen}>
            <BetalningsDetaljer event={event} registreringar={aktiva} />
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
            {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
          </MessageBox>
        </div>
      ) : (
        <ArbetsKo event={event} registreringar={data} />
      )}
    </DetaljGrupp>
  );
}
