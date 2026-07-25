import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BedDouble,
  Check,
  CheckCheck,
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
import { DetaljGrupp } from './DetaljGrupp';
import { DAGMANAD } from './datumSpann';

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
function GruppRubrik({
  oppen,
  varning,
  kontrollerarId,
  onToggle,
  handling,
  children,
}: {
  oppen: boolean;
  varning?: boolean;
  kontrollerarId: string;
  onToggle: () => void;
  /** Interaktiv handling på rubrikraden — renderas som syskon till knappen. */
  handling?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center rounded-lg bg-bg-emphasized">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={kontrollerarId}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`flex items-center gap-1.5 font-semibold text-small ${varning ? 'text-error' : ''}`}
        >
          {varning && <TriangleAlert aria-hidden="true" size={14} className="shrink-0" />}
          {children}
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* pr-1 = 4 px — samma inset som knappens topp/botten mot baren
          (rubrik-radens py-2.5 kring 32 px-knappen; review-våg 3). */}
      {handling != null && <span className="flex shrink-0 items-center pr-1">{handling}</span>}
    </div>
  );
}

/** Böjer "anmälan/anmälningar" efter antal — svenskan har ingen 0-singular. */
function anmalanOrd(antal: number): string {
  return antal === 1 ? 'anmälan' : 'anmälningar';
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
 */
function MarkeringsBatchBar({
  antal,
  totalt,
  allaValda,
  pending,
  onBekrafta,
  onMarkeraAlla,
  onRensa,
}: {
  antal: number;
  totalt: number;
  allaValda: boolean;
  pending: boolean;
  onBekrafta: () => Promise<void>;
  onMarkeraAlla: () => void;
  onRensa: () => void;
}) {
  return (
    <div data-testid="markering-batchbar" className="flex flex-wrap items-center gap-2 pb-2.5">
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
 * — ingen 'Vald'-pill ersätter den) och lämnar plats åt WCAG 1.4.1-bäraren,
 * så att valt tillstånd aldrig vilar på färgen ensam. Kategori-pillen står
 * kvar i båda lägena: vägen in är inte ett urvalstillstånd.
 */
function KortInnehall({
  reg,
  eventId,
  lankat,
  vald,
}: {
  reg: Registration;
  eventId: string;
  lankat: boolean;
  vald: boolean;
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
            bredare ytor står de kvar på EN rad som i facit. */}
        <span className="flex max-w-[45%] shrink-0 flex-wrap items-center justify-end gap-1.5">
          {vald && (
            // WCAG 1.4.1-bäraren (byggkrav 7): valt tillstånd får aldrig vila
            // på grönt ensamt. Glyfen bor i pill-radens FRIGJORDA plats —
            // Marcus-låsta formen är orörd, ingen ny yta tillkommer.
            <CheckCheck
              data-testid="markering-check"
              aria-hidden="true"
              size={16}
              className="shrink-0 text-success"
            />
          )}
          {!arBekraftad(reg) && !vald && (
            <span className="rounded-full bg-(--mm-error-bg) px-2 py-0.5 font-medium text-caption text-error">
              Obekräftad
            </span>
          )}
          {pill && (
            <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary">
              {pill}
            </span>
          )}
        </span>
      </div>
      <div
        data-testid="deltagar-metayta"
        className="flex flex-col gap-1 px-4 pt-2.5 pb-3 text-caption text-text-muted"
      >
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
        {bekraftelse && <MetaRad ikon={MailCheck}>{`Bekräftelse ${bekraftelse}`}</MetaRad>}
        {paminnelse && <MetaRad ikon={MailCheck}>{`Påminnelse ${paminnelse}`}</MetaRad>}
        {eventinfo && <MetaRad ikon={MailCheck}>{`Eventinfo ${eventinfo}`}</MetaRad>}
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
function DeltagarKort({ reg, eventId }: { reg: Registration; eventId: string }) {
  return (
    <div
      data-testid="deltagar-kort"
      className="flex flex-col rounded-xl border border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <KortInnehall reg={reg} eventId={eventId} lankat vald={false} />
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
 * kortets vanliga yta. Kanten finns i BÅDA lägena så geometrin aldrig hoppar
 * vid val — bara dess färg byts.
 */
function MarkerbartKort({
  reg,
  eventId,
  vald,
  onChange,
}: {
  reg: Registration;
  eventId: string;
  vald: boolean;
  onChange: (vald: boolean) => void;
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
      <KortInnehall reg={reg} eventId={eventId} lankat={false} vald={vald} />
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
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)"
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
      aria-label={kanRulla ? 'Obekräftade anmälningar' : undefined}
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
            />
          ) : (
            <DeltagarKort reg={reg} eventId={eventId} />
          )}
        </li>
      ))}
    </ul>
  );
}

function ArbetsKo({ event, registreringar }: { event: Event; registreringar: Registration[] }) {
  const panelId = useId();
  const [flik, setFlik] = useState<FlikNyckel>('alla');
  const [filter, setFilter] = useState<SummeringsFilter | null>(null);

  const aktiva = useMemo(() => registreringar.filter(arAktiv), [registreringar]);

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

  // Inbox-fokus (K40): kön öppen, arkivet ett klick bort — är kön tom öppnas
  // arkivet i stället. Initialt tillstånd, därefter Lottas eget val.
  const [oppna, setOppna] = useState({
    obekraftade: true,
    bekraftade: obekraftadeTotalt === 0,
  });

  const traffar = filter == null ? null : visade.filter(FILTER_TEST[filter]);

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
    setFilter((nu) => {
      const next = nu === f ? null : f;
      if (f === 'borOver' && next === 'borOver') {
        setBorOverSnapshot(new Set(aktiva.filter((r) => r.borOver === true).map((r) => r.id)));
      }
      return next;
    });
  };

  const toggleBorOver = (reg: Registration, borOver: boolean) =>
    lodging.mutate({ registration: reg, borOver });

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
  const [utfall, setUtfall] = useState<string | null>(null);

  // Markera-lägets kandidater = kön så som den visas (flikvalet gäller).
  const obekraftadeIds = useMemo(() => obekraftade.map((r) => r.id), [obekraftade]);
  const markering = useMarkeringsLage(obekraftadeIds);

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
    try {
      const result = await bulk.mutateAsync({ registrationIds: ids });
      // Aldrig binärt: allt annat än rent skickat visas som det ÄR (K53-ärligheten).
      // URVALET ÖVERLEVER ett icke-rent utfall (review-fynd 2): servern svarar
      // 200 även vid 'partial'/'failed'/'skipped', och att då nolla markeringen
      // hade tvingat Lotta att markera om tolv kort för att försöka igen. Endast
      // ett RENT skickat utfall betyder att arbetet är utfört — bara då stängs
      // läget. Samma logik som catch-grenen, som alltid behållit urvalet.
      if (result.status !== 'sent') {
        setUtfall(bekraftelseUtfall(result));
        return;
      }
      markering.stang();
    } catch {
      setUtfall('Bekräftelserna kunde inte skickas. Försök igen.');
    }
  };

  // Signalen tänds bara när det finns något ATT skicka (K44).
  const signalText =
    totalt - eventinfoSkickade > 0 ? eventinfoSignal(event.startdatum ?? null) : null;

  return (
    <>
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

      {utfall != null && (
        <div className="pt-3">
          <MessageBox intent="error" title="Bekräftelsen gick inte igenom">
            {utfall}
          </MessageBox>
        </div>
      )}

      <div className="flex flex-col gap-2.5 py-3">
        {/* K41: Formulär-fliken riven — formulärvägen är NORMEN och behöver
            ingen egen flik. Kapseln är familjens ToggleButtonGroup-primitiv. */}
        <ToggleButtonGroup
          label="Visa deltagare"
          spread
          selectedKey={flik}
          onSelectionChange={(key: FlikNyckel) => setFlik(key)}
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

        {traffar != null ? (
          <>
            {/* K57: "Visar:"-raden och instruktionstexten RIVNA — man har ju
                tryckt på raden. Rensa-knappen står ensam, högerställd på
                kortets inner-inset. */}
            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="font-medium text-small underline-offset-2 hover:underline"
              >
                Rensa filtret
              </button>
            </div>
            {filter === 'borOver' ? (
              // KRYSS-LÄGET (K52): ALLA visade anmälda i EN kolumn, säng-kryss
              // per rad, ikryssade (snapshot) överst. Ersätter personkorten helt.
              markeringsLista.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {markeringsLista.map((reg) => (
                    <li key={reg.id}>
                      <BorOverRad reg={reg} onToggle={toggleBorOver} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-2 text-small text-text-secondary">
                  Inga deltagare i denna kategori.
                </p>
              )
            ) : traffar.length > 0 ? (
              <DeltagarListan rader={traffar} eventId={event.id} />
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
                    skickas. §19: rubrikraden är toolbar-ytklass ⇒ kompakt sm;
                    Markera skriver inget utåt (intern handling) ⇒ primary. */}
                <GruppRubrik
                  oppen={oppna.obekraftade}
                  varning
                  kontrollerarId={`${panelId}-obekraftade`}
                  onToggle={() => setOppna((o) => ({ ...o, obekraftade: !o.obekraftade }))}
                  handling={
                    markering.aktivt ? (
                      <Button
                        intent="ghost"
                        size="sm"
                        aria-label="Avbryt markering"
                        onPress={markering.stang}
                      >
                        <X aria-hidden="true" size={14} className="shrink-0" />
                        Avbryt
                      </Button>
                    ) : (
                      <Button
                        ref={markeraKnappRef}
                        intent="primary"
                        emphasis="subtle"
                        size="sm"
                        className="shadow-sm"
                        aria-label="Markera anmälningar"
                        onPress={() => {
                          // Läget kräver att kön är öppen — annars markerar
                          // Lotta i en panel hon inte ser.
                          setOppna((o) => ({ ...o, obekraftade: true }));
                          markering.oppna();
                        }}
                      >
                        Markera
                      </Button>
                    )
                  }
                >
                  {`Obekräftade (${obekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-obekraftade`} hidden={!oppna.obekraftade} className="pt-1.5">
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
                  oppen={oppna.bekraftade}
                  kontrollerarId={`${panelId}-bekraftade`}
                  onToggle={() => setOppna((o) => ({ ...o, bekraftade: !o.bekraftade }))}
                >
                  {`Bekräftade (${bekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-bekraftade`} hidden={!oppna.bekraftade} className="pt-1.5">
                  <DeltagarListan rader={bekraftade} eventId={event.id} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
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
            {error instanceof Error ? error.message : 'Okänt fel.'}
          </MessageBox>
        </div>
      ) : (
        <ArbetsKo event={event} registreringar={data} />
      )}
    </DetaljGrupp>
  );
}
