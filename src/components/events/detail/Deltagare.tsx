import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  Clock,
  History,
  Inbox,
  type LucideIcon,
  Mail,
  MailCheck,
  TriangleAlert,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import {
  bekraftelseUtfall,
  useConfirmAll,
  useSendConfirmation,
} from '@/data/mutations/registrationConfirmation';
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
 * HANTERA-FLÖDET (task-18.6; S73-facit K44/K46/K47/K48) bor här sedan skivan efter:
 * kortets Skicka bekräftelse-knapp, Bekräfta alla-pillen med kontrollfråga på
 * Obekräftade-rubriken, och auto-utskicks-krysset i signal-slotten.
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
type SummeringsFilter = 'obekraftade' | 'bekraftelse' | 'paminda' | 'saknarEventinfo';

const FILTER_TEST: Record<SummeringsFilter, (r: Registration) => boolean> = {
  obekraftade: (r) => !arBekraftad(r),
  bekraftelse: (r) => r.bekraftelseSkickad != null,
  paminda: harPaminnelse,
  saknarEventinfo: (r) => r.deltagarinfoSkickad == null,
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
      {handling != null && <span className="flex shrink-0 items-center pr-2">{handling}</span>}
    </div>
  );
}

/**
 * BEKRÄFTA ALLA (K47/K48) — sidans positiva massåtgärd i success-grönt med vit text
 * och kuvertet (grammatiken: Mail = skicka-handling, MailCheck = skickat-status).
 *
 * KONTROLLFRÅGAN är obligatorisk (PRD task-18 beslut 7 + 20: confirm-grind på varje
 * massmutation) — pillen ÖPPNAR bara dialogen; ingenting skickas förrän Lotta
 * bekräftat. Bulken är pessimistisk: knappen står kvar i "Skickar…" tills servern
 * svarat, så ett halvt utfall aldrig visas som helt.
 */
function BekraftaAlla({
  antal,
  pending,
  onBekrafta,
}: {
  antal: number;
  pending: boolean;
  onBekrafta: () => Promise<void>;
}) {
  return (
    <DialogTrigger>
      <Button
        intent="success"
        size="sm"
        className="rounded-lg shadow-sm"
        aria-label="Bekräfta alla obekräftade"
      >
        <Mail aria-hidden="true" size={14} className="shrink-0" />
        Bekräfta alla
      </Button>
      <Modal isDismissable>
        <Dialog
          title="Skicka bekräftelse till alla?"
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
          {`Bekräftelsemailet skickas till ${antal} obekräftade ${
            antal === 1 ? 'anmälan' : 'anmälningar'
          }, och anmälningarna blir Bekräftade. Det går inte att ångra.`}
        </Dialog>
      </Modal>
    </DialogTrigger>
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
 * ANMÄLD-RADENS LÄNKMÅL (AC #2, belagt beslut): anmälans egen sida finns INTE
 * (PRD task-18 §Utanför omfattningen), och ingen befintlig yta visar EN
 * anmälan — varken `/event/$eventId/anmalda` eller `/mer/anmalningar` kan
 * djuplänkas per anmälan. Raden renderas därför OLÄNKAD. Facitets understrukna
 * länk var en prototyp-no-op; i skarp produkt vore en understruken rad som
 * inte leder någonstans en osann affordans. Länkformen återinförs i samma
 * skiva som föder anmälans route.
 */
function DeltagarKort({
  reg,
  onBekrafta,
  pending,
}: {
  reg: Registration;
  /** Kortets hantera-handling (task-18.6) — endast obekräftade kort bär den. */
  onBekrafta: (reg: Registration) => void;
  pending: boolean;
}) {
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
    <div
      data-testid="deltagar-kort"
      className="flex flex-col rounded-xl border border-(--mm-navcard-border) bg-surface contrast-more:border-(--mm-navcard-border-contrast)"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        {reg.personId ? (
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
          {!arBekraftad(reg) && (
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
        {anmald && <MetaRad ikon={Inbox}>{anmald}</MetaRad>}
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
      {/* K46 (hantera-handlingen, task-18.6): obekräftat kort bär Skicka
          bekräftelse i kortbotten — UTANFÖR person-länken (L303), som dess
          syskon. Bekräftade kort bär den ALDRIG: handlingen är gjord, och en
          knapp som skickar om mailet är inte kortets jobb. */}
      {!arBekraftad(reg) && (
        <button
          type="button"
          aria-label={`Skicka bekräftelse till ${namn}`}
          disabled={pending}
          onClick={() => onBekrafta(reg)}
          className="flex w-full items-center justify-center gap-2 rounded-b-xl border-border border-t px-4 py-2.5 font-medium text-small hover:bg-bg-emphasized disabled:opacity-50 motion-safe:transition-colors"
        >
          {/* Kuvertet — samma ikon som betalningarnas Påminn och utskicksraderna
              (Mail = skicka-handling, MailCheck = skickat-status, K47). */}
          <Mail aria-hidden="true" size={14} className="shrink-0" />
          {pending ? 'Skickar…' : 'Skicka bekräftelse'}
        </button>
      )}
    </div>
  );
}

function DeltagarListan({
  rader,
  onBekrafta,
  pendingId,
}: {
  rader: Registration[];
  onBekrafta: (reg: Registration) => void;
  pendingId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rader.map((reg) => (
        <li key={reg.id}>
          <DeltagarKort reg={reg} onBekrafta={onBekrafta} pending={pendingId === reg.id} />
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
  const vaxlaFilter = (f: SummeringsFilter) => setFilter((nu) => (nu === f ? null : f));

  // Hantera-flödet (task-18.6): enskild bekräftelse OPTIMISTISK, bulken PESSIMISTISK
  // bakom kontrollfrågan. Båda går genom samma server-operation.
  const enskild = useSendConfirmation(event.id);
  const bulk = useConfirmAll(event.id);
  const [utfall, setUtfall] = useState<string | null>(null);
  const pendingId = enskild.isPending ? (enskild.variables?.registration.id ?? null) : null;

  const bekraftaEn = (reg: Registration) => {
    setUtfall(null);
    enskild.mutate(
      { registration: reg },
      {
        onError: () => setUtfall(`Bekräftelsen till ${displayName(reg)} kunde inte skickas.`),
        onSuccess: (result) => {
          if (result.confirmed.length === 0) setUtfall(bekraftelseUtfall(result));
        },
      },
    );
  };

  const bekraftaAlla = async () => {
    setUtfall(null);
    try {
      const result = await bulk.mutateAsync({ registrationIds: obekraftade.map((r) => r.id) });
      // Aldrig binärt: allt annat än rent skickat visas som det ÄR (K53-ärligheten).
      if (result.status !== 'sent') setUtfall(bekraftelseUtfall(result));
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
            {traffar.length > 0 ? (
              <DeltagarListan rader={traffar} onBekrafta={bekraftaEn} pendingId={pendingId} />
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
                <GruppRubrik
                  oppen={oppna.obekraftade}
                  varning
                  kontrollerarId={`${panelId}-obekraftade`}
                  onToggle={() => setOppna((o) => ({ ...o, obekraftade: !o.obekraftade }))}
                  handling={
                    <BekraftaAlla
                      antal={obekraftade.length}
                      pending={bulk.isPending}
                      onBekrafta={bekraftaAlla}
                    />
                  }
                >
                  {`Obekräftade (${obekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-obekraftade`} hidden={!oppna.obekraftade} className="pt-1.5">
                  <DeltagarListan
                    rader={obekraftade}
                    onBekrafta={bekraftaEn}
                    pendingId={pendingId}
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
                  <DeltagarListan
                    rader={bekraftade}
                    onBekrafta={bekraftaEn}
                    pendingId={pendingId}
                  />
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
