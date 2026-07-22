import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock, type LucideIcon, TriangleAlert } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { RegistrationSource, RegistrationStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp } from './DetaljGrupp';

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
 * SKELETT-AVGRÄNSNINGEN (öppet bokförd): personkortens metayta + historik är
 * task-18.5, hantera-flödet (Skicka bekräftelse / Bekräfta alla) task-18.6 och
 * Bor över-arbetsraden task-18.7. Här renderas deltagaren som en NAMN-rad med
 * sina pillar, och Bor över-raden saknas HELT ur summeringen (bas-fältet föds
 * i 18.7 — en rad som alltid visar 0 vore en osanning).
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
 */
function GruppRubrik({
  oppen,
  varning,
  kontrollerarId,
  onToggle,
  children,
}: {
  oppen: boolean;
  varning?: boolean;
  kontrollerarId: string;
  onToggle: () => void;
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
    </div>
  );
}

/**
 * Deltagar-raden i skelettform: namn + Obekräftad-pill (varningston) +
 * kategori-pill. Metaytan (anmäld dag/tid, utskickshistorik, Miranon-historik)
 * och person-länken bor i task-18.5 — raden växer där, den byts inte ut.
 */
function DeltagarRad({ reg }: { reg: Registration }) {
  const kat = kategori(reg);
  const pill = KATEGORI_PILL[kat];
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-(--mm-navcard-border) bg-surface px-4 py-3 contrast-more:border-(--mm-navcard-border-contrast)">
      <span data-testid="deltagar-namn" className="min-w-0 break-words font-semibold text-body">
        {displayName(reg)}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
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
  );
}

function DeltagarListan({ rader }: { rader: Registration[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rader.map((reg) => (
        <li key={reg.id}>
          <DeltagarRad reg={reg} />
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
            signalText && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-surface px-2.5 py-1 font-medium text-small text-warning">
                <Clock aria-hidden="true" size={14} className="shrink-0" />
                {signalText}
              </span>
            )
          }
        >
          <AvDelta klara={eventinfoSkickade} totalt={totalt} />
        </SummeringsRad>
      </div>

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
              <DeltagarListan rader={traffar} />
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
                >
                  {`Obekräftade (${obekraftade.length})`}
                </GruppRubrik>
                <div id={`${panelId}-obekraftade`} hidden={!oppna.obekraftade} className="pt-1.5">
                  <DeltagarListan rader={obekraftade} />
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
                  <DeltagarListan rader={bekraftade} />
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
