import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BedDouble,
  Check,
  Clock,
  History,
  Inbox,
  type LucideIcon,
  Mail,
  MailCheck,
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
 * Anmälda deltagare — REGISTRET SOM EN LISTA (TASK-145.1; PRD TASK-145 §
 * "Registret blir EN lista"). Ersätter task-18.4:s skelett: Obekräftade-kön
 * och Bekräftade-arkivet, var och en med egen rubrik och egen sorteringsordning,
 * är RIVNA. I deras ställe en enda `DeltagarListan` sorterad på FYRA
 * steg-hinkar (`registerOrdning`, hallplats-steg-prototyp.ts) — väntar på
 * bekräftelse → anmälningsavgift saknas → slutbetalning saknas → klara, med
 * inställt/på-väg-till-väntelista sist — och INOM varje hink i
 * anmälningsordning (äldst-registrerad-först, samma FIFO-semantik den gamla
 * Obekräftade-kön hade, nu tillämpad enhetligt över hela registret i stället
 * för bara kön). Steg-märket (`HallplatsMarke`) ÄR grupperingen — inga
 * sektionsrubriker renderas, och exakt ETT märke visas per person även när
 * flera steg är ogjorda (prioritetsordningen bor i `hallplatsSteg()`).
 * Undantagen (Avbokad, Inställt, På väg till väntelistan) bär sina egna
 * ärliga märken och sorteras sist, inte bortfiltrerade.
 *
 * Inline-scrollen (`rullande`, `DeltagarListan`) är ÅTERANVÄND OFÖRÄNDRAD —
 * samma `max-h-[25.5rem]`-klipphöjd kön hade, ingen ny höjd mintad. Scroll-
 * ytans tillgänglighetsetikett är "Deltagarregister" (sektionens egen text,
 * ärver INTE `DeltagarListan`s default som var köns hårdkodade namn).
 *
 * PERSONKORTEN (task-18.5; S73-facit K45/K62) bor i `DeltagarKort` nedan,
 * oförändrade.
 *
 * SKIVGRÄNS, ÖPPET BOKFÖRD (TASK-145 kedjehuvud): denna skiva rör ENDAST
 * registrets EGEN gruppering/sortering/märkning. De gamla fem klickbara
 * summeringsraderna (Obekräftade/Bekräftelse/Påminnelse/Eventinfo/Bor över),
 * kategori-flikarna och MARKERA-LÄGET (`useMarkeringsLage` + batch-bekräftelse,
 * task-48) är samtliga RIVNA ur produktionsvyn i samma steg — de kan inte
 * överleva rubrikrivningen (Markera-knappen var anchor:ad på Obekräftade-
 * rubriken, som är borta) och deras ersättningar är explicit ANDRA skivors
 * ansvar: `TASK-145.2` (steg-räknarna + filtreringen) och `TASK-145.3`
 * (markera-läget över den nya listan + utgången mot Åtgärds-sidan). Fram
 * till dess är registret en REN LÄSYTA utan bulk-handling — den redan byggda,
 * facit-låsta helheten (räknare + filter + markera + "Åtgärder"-utgång +
 * betalningsytans inflytt) finns kvar OFÖRÄNDRAD bakom `?variant=a` (DEV-
 * grindad, `protoVariant === 'a'`) och graderas dit skiva för skiva.
 *
 * Semantiken (ORDLISTA, S73 K53): `hallplatsSteg()`/`registerOrdning()` läser
 * basens `Status`-fält, aldrig en utskicks-tidsstämpel.
 *
 * Avbokade räknas bort ur `aktiva`/steg-räknarna (samma basformel-disciplin
 * som Betalningar-gruppen) men syns numera I REGISTRET SJÄLVT, sist, med sitt
 * grå "Avbokad"-märke (`registerOrdning`s ITERATIONSVÅG, Marcus 2026-08-05).
 *
 * A11y (11/10): listan är en `<ul>` med steg-märket som textbärare (färg
 * aldrig ensam bärare); rullnings-regionen är ett riktigt tab-stopp
 * (`tabIndex`, `aria-label`) när klippet faktiskt biter.
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
 * [RIVEN, TASK-145.1] `GruppRubrik` (Obekräftade/Bekräftade-rubrikerna, K40)
 * bodde här — se docblocket ovan `ArbetsKo`. Ingen ersättare i denna skiva:
 * registret bär inga sektionsrubriker längre (steg-märket ÄR grupperingen).
 */
/**
 * MARKERA/AVBRYT-KNAPPEN (task-48 byggkrav 1, EMPHASIS-PARET från S91) —
 * utbruten till en egen funktion sedan konvergens-passet (S93 Del 3 beslut 3).
 *
 * [ÄNDRAT, TASK-145.1] Bar tidigare TVÅ anropsplatser: skarpa vyns
 * `GruppRubrik`-handling OCH `?variant=a`s egna högerställda rad ovanför det
 * enade registret. Den förra är riven med `GruppRubrik` (se ovan) — enda
 * kvarvarande anropsplats är `?variant=a`s batch-bar (`ArbetsKo`), tills
 * `TASK-145.3` bygger produktionsvyns ersättning över den nya listan.
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
 * [RIVEN, TASK-145.1] `SKICKAT_TITEL`/`MISSLYCKAD_TITEL`/`skickatKvittens`
 * (batch-bekräftelsens kvittenstext) bodde här — exklusivt konsumerade av
 * `bekraftaMarkerade`, riven i samma steg (se `ArbetsKo`s "Hantera-flödet"-
 * kommentar).
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
  markeraKnapp,
  aktivt,
}: {
  antal: number;
  totalt: number;
  allaValda: boolean;
  pending: boolean;
  /** [PROTOTYPE] [S93] ITERATIONSVÅG 5 (Marcus 2026-08-06): "Vi flyttar ner
      Markera-knappen till samma rad som 'åtgärder' och 'markera alla' och
      sätter den längst till vänster. När man trycker 'Markera' så kommer
      knapparna 'åtgärder' och 'markera alla' fram till höger på samma rad."

      Satt ⇒ baren renderas ÄVEN när markeringsläget är AV, med enbart denna
      knapp. Utelämnad ⇒ skarpa vyns oförändrade form (baren monteras först när
      läget slås på, av anroparen).

      VARFÖR DET ÄR BÄTTRE ÄN ATT BARA FLYTTA EN KNAPP: förut dök hela baren
      upp som en NY RAD när läget slogs på, och allt under den hoppade nedåt.
      Nu står raden still och knapparna växer ut åt höger — en vertikal
      förskjutning byttes mot en horisontell utvidgning. */
  markeraKnapp?: React.ReactNode;
  /** Explicit `false` ⇒ markeringsläget är AV: Åtgärder/Markera alla/Rensa och
      live-räknaren renderas inte. Utelämnad ⇒ dagens beteende (allt visas),
      vilket är vad skarpa vyn får eftersom den monterar baren först i aktivt
      läge. */
  aktivt?: boolean;
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
  const visaHandlingar = aktivt !== false;

  return (
    <>
      <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2 pb-2.5">
        {markeraKnapp}
        {visaHandlingar && onBekrafta ? (
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
        ) : visaHandlingar ? (
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
        ) : null}
        {visaHandlingar && (
          <Button
            intent="secondary"
            size="sm"
            isDisabled={allaValda || pending}
            onPress={onMarkeraAlla}
          >
            Markera alla
          </Button>
        )}
        {visaHandlingar && antal > 0 && (
          <Button intent="ghost" size="sm" isDisabled={pending} onPress={onRensa}>
            Rensa
          </Button>
        )}
        {/* Live-räknaren: seende ser antalet i knappen, skärmläsaren får det här.
            `polite` — urvalet är löpande arbete, aldrig ett avbrott värt assertive.

            Villkorad på `visaHandlingar` sedan iterationsvåg 5: i AV-läget finns
            inget urval att räkna, och en `role="status"` som står och säger
            "0 av 9 markerade" när ingen markerar är brus i skärmläsaren — samma
            klass av oombedd a11y-struktur som rev två CI-grindar i våg 2. */}
        {visaHandlingar && (
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

/**
 * [RIVEN, TASK-145.1] `isoDatum`/`AutoKryss` (K44, auto-utskicks-krysset i
 * eventinfo-signalens slot) bodde här. Den var den ENDA skriv-affordansen
 * kvar i de gamla fem summeringsraderna — och de raderna är rivna i samma
 * steg (se docblocket ovan `ArbetsKo`). Slotten visar numera bara "Dags att
 * skicka"-badgen när den är tänd, annars tomt med bevarad höjd; en ny
 * fyra-raders steg-räknare (`TASK-145.2`) tar radernas plats, alltjämt
 * gated bakom `?variant=a` tills den skivan graderar den till produktion.
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

/**
 * [RIVEN, TASK-145.1] `RensaFiltretKnapp` bodde här — dess enda anropsplats
 * var den gamla `filter`/`traffar`-drivna flata listan (K57), riven i samma
 * steg som `arBekraftad`-grupperingen (se docblocket ovan `ArbetsKo`).
 */

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
  /** [PROTOTYPE] [S93] hållplats-pass — 'a' = den ännu ograderade förhandsvisningen
      bakom `?variant=a` (DEV-only); null = produktionsvyn, som TASK-145.1
      äger. Se docblocket ovan `ArbetsKo`s definition för skivgränsen. */
  protoVariant?: HallplatsVariant | null;
  /** [PROTOTYPE] [S93] `?data=proto` — stubbar bekräfta-mutationen (§ DATA). */
  protoDataMode?: boolean;
}) {
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
  // TASK-145.1: steg-märket ÄR grupperingen (AC #4) och exakt ETT märke visas
  // per person (AC #5) — ovillkorligt, i BÅDA lägena. Var tidigare gated på
  // `protoVariant != null` (prototyp-only); registret bär nu alltid sitt
  // steg-märke, inte bara bakom `?variant=a`.
  const hallplatsMarkeFn = (r: Registration) => <HallplatsMarke steg={hallplatsSteg(r)} />;

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

  // Summeringarna räknar ALLTID hela eventet (K38) — bevarade eftersom
  // ?variant=a:s HallplatsToppA/logistik-rader (nedan) fortfarande läser dem.
  const totalt = aktiva.length;
  const eventinfoSkickade = aktiva.filter((r) => r.deltagarinfoSkickad != null).length;
  // LIVE-RÄKNAREN (K52): alltid HÄRLEDD ur kryssen i samma cache-rad som
  // kryss-läget muterar optimistiskt — aldrig ett lagrat räknefält (PRD beslut 8).
  const borOverTotalt = aktiva.filter((r) => r.borOver === true).length;

  // TASK-145.1 (AC #2/#3): registret är EN lista, steg-ordning (ogjort
  // överst) + anmälningsordning (ÄLDST FÖRST — samma FIFO-semantik som den
  // gamla Obekräftade-kön hade, nu tillämpad enhetligt över samtliga steg i
  // stället för bara kön) inom varje steg. `registerOrdning`
  // (hallplats-steg-prototyp.ts) är den finmaskigare fyra-hinks-sorteringen
  // (delar "väntar på betalning" i avgift/slut, samma delning som
  // `betalningsSplit`s två räknerader). Basen är HELA `registreringar`, inte
  // `aktiva` — avbokade ska "även synas i registret självt" (Marcus
  // 2026-08-05); `aktiva` filtrerar bort dem, `registerOrdning` sorterar dem
  // sist i stället och de bär sitt grå "Avbokad"-märke som varje annan post.
  // Konsumeras av BÅDA lägena: produktionsvyns render (nedan) direkt, och
  // `?variant=a`s `registerListaA` genom filtrets två axlar.
  const unifiedSorted = useMemo(
    () =>
      [...registreringar].sort((a, b) => {
        const diff = registerOrdning(a) - registerOrdning(b);
        return diff !== 0 ? diff : inskickadTid(a) - inskickadTid(b);
      }),
    [registreringar],
  );

  // [PROTOTYPE] [S93] konvergens-pass, variant A ENDAST (Del 3 beslut 1) —
  // den INFLYTTADE betalnings-arbetsytans K27-disclosure (se render, "Öppna
  // detaljer"). Egen lokal state, precis som Betalningar.tsx:s egen `oppen`.
  const [betalningOppen, setBetalningOppen] = useState(false);

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
  // först vid nästa öppning. `Set` av record-ID:n. null = läget är stängt.
  const [borOverSnapshot, setBorOverSnapshot] = useState<Set<string> | null>(null);
  const lodging = useSetBorOver(event.id);

  // [PROTOTYPE] [S93] review-fix (uppdraget § FYND 2) — `?data=proto`:
  // stubbad, samma read-only-förstärkning i variant-läget. Kontrollen
  // (BorOverRad) görs redan `disabled` nedan — denna guard är
  // försvar-i-djup, inte den enda spärren.
  const toggleBorOver = (reg: Registration, borOver: boolean) => {
    if (protoDataMode) return;
    lodging.mutate({ registration: reg, borOver });
  };

  // Kryss-lägets lista: ikryssade — enligt snapshoten — överst. Array.sort är
  // stabil (ES2019) så inbördes ordning bevaras inom varje grupp. TASK-145.1:
  // basen är `aktiva` (var `visade`, den gamla flik-filtrerade mängden — fliken
  // är riven i denna skiva). Konsumeras endast av `?variant=a`s Bor över-rad
  // (nedan); produktionsvyn har ingen Bor över-ingång ännu (`TASK-145.2`).
  const markeringsLista =
    borOverSnapshot != null
      ? [...aktiva].sort(
          (a, b) => Number(borOverSnapshot.has(b.id)) - Number(borOverSnapshot.has(a.id)),
        )
      : [];

  // [RIVEN, TASK-145.1] Batch-bekräftelsens massmutation (task-48,
  // `bekraftaMarkerade`/`bulk`) hade sin ENDA anropsplats i det gamla
  // Obekräftade-anchor:ade `MarkeringsBatchBar`-läget (`onBekrafta`), som är
  // riven i denna skiva tillsammans med GruppRubrik (se docblocket ovan
  // `ArbetsKo`). `MarkeringsBatchBar`s `onBekrafta`-gren finns kvar i
  // komponenten (delad med `?variant=a`s "Åtgärder"-läge) men har numera
  // ingen anropare — ingen skrivväg är RIVEN "dolt", den är strukturellt
  // ONÅBAR, precis som `AutoKryss` ovan. `utfall` lever kvar som delad
  // kvittens-state: `setUtfall(null)` anropas fortfarande av
  // `vaxlaSteg`/`oppnaMarkering` (`?variant=a`).
  const [utfall, setUtfall] = useState<Utfall | null>(null);

  // Markera-lägets kandidater: PRODUKTIONSVYN har inget markera-läge (denna
  // skiva river Obekräftade-kön som var dess enda anchor — `TASK-145.3`
  // bygger ersättningen över den nya listan). `?variant=a` är oförändrad:
  // `registerListaA` — den aktuella filtrerade vyn, eller HELA den enade
  // listan när inget filter är valt.
  const markeringKandidatIds = protoVariant === 'a' ? registerListaA.map((r) => r.id) : [];
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
      {protoVariant === 'a' && (
        // [PROTOTYPE] [S93] KONVERGENS-PASSET (Del 3 § Valet) — variant A
        // vann divergensen; B (Stations-railen)/C (Nästa steg-panelen) är
        // FÖRKASTADE och RIVNA (se DeltagareHallplatsPrototyp.tsx). Enda
        // kvarvarande gren: `HallplatsToppA` (TRE steg-räknare, mittraden
        // ALLTID delad i Anmälningsavgifter/Slutbetalningar, byggkrav 2) +
        // Eventinfo/Bor över/Avbokade som en visuellt avskild "logistik"-grupp
        // (border-t) UTAN rubrik-text (byggkrav 3 rev — "Utskick"-texten fanns
        // bara för att skilja variant A från B/C; de är borta, så det finns
        // inget kvar att skilja mot).
        //
        // TASK-145.1: detta HELA blocket (steg-räknarna, filtreringen, Bor
        // över/Avbokade-logistiken) är OFÖRÄNDRAT och KVAR bakom `?variant=a`
        // — dess graduering till produktion är `TASK-145.2`s ansvar, inte
        // denna skivas. De gamla fem klickbara summeringsraderna
        // (Obekräftade/Bekräftelse/Påminnelse/Eventinfo/Bor över) som stod
        // här för produktionsvyn är RIVNA i samma steg som registrets
        // rubriker (se docblocket ovan `ArbetsKo`s definition) — produktions-
        // vyn har därför ingen räknare-rad alls tills `TASK-145.2` landar.
        //
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
                  // signal-badgen. [ÄNDRAT, TASK-145.1] `AutoKryss` själv och
                  // produktionsvynens motsvarande fallback-gren är rivna i
                  // samma steg (se docblocket ovan `ArbetsKo`s definition) —
                  // AutoKryss finns numera INGENSTANS i denna fil.
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
        {/*
         * [RIVEN, TASK-145.1] Kategori-flikarna (Alla/Manuella/Medföljande,
         * K41) bodde här för produktionsvyn. Vägen in är riven tillsammans
         * med registrets rubriker — registret har ingen kategori-filtrering
         * längre (`?variant=a`s `RegisterFilterRad`-axel `vagIn` är den
         * kommande ersättningen, se docblocket ovan `ArbetsKo`s definition).
         */}

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
                  setUtfall(null);
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
                    pending={false}
                    onMarkeraAlla={markering.markeraAlla}
                    onRensa={markering.rensa}
                    aktivt={markering.aktivt}
                    markeraKnapp={
                      <MarkeraKnapp
                        aktivt={markering.aktivt}
                        onOppna={oppnaMarkering}
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
        ) : unifiedSorted.length === 0 ? (
          // TASK-145.1 (kortets fallback-tomtext) — samma text som
          // `?variant=a`s motsvarande tomma-läge ovan.
          <p className="py-2 text-small text-text-secondary">Inga anmälningar ännu.</p>
        ) : (
          // TASK-145.1 — REGISTRET SOM EN LISTA (AC #1–#7). Obekräftade-kön
          // och Bekräftade-arkivet (med sina två GruppRubrik-rader,
          // Markera-läget och Bekräfta-flödet) är RIVNA — se docblocket ovan
          // `ArbetsKo`s definition för den fullständiga skivgränsen. Listan
          // är `unifiedSorted` (registerOrdning-sorterad, FIFO inom hink)
          // OVILLKORLIGT — ingen flik-/counter-filtrering kvar att växla
          // bort den mot. Samma `DeltagarListan` som `?variant=a` använder:
          // `rullande` återanvänder byggkrav 4:s klipphöjd OFÖRÄNDRAD (AC #6),
          // `ariaLabel="Deltagarregister"` ärver INTE `DeltagarListan`s
          // default (köns hårdkodade namn, AC #7), och `hallplatsMarkeFn` är
          // nu ovillkorlig (AC #4/#5, se derivationen ovan).
          <DeltagarListan
            rader={unifiedSorted}
            eventId={event.id}
            rullande
            testId="deltagar-register"
            ariaLabel="Deltagarregister"
            hallplatsMarke={hallplatsMarkeFn}
          />
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
