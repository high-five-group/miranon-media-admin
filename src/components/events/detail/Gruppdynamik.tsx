import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Skeleton } from '@/components/primitives/Skeleton';
import { displayName } from '@/components/registrations/registration-display';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import type { PersonHistoryEntry } from '@/domain/schemas';
import { RegistrationStatus } from '@/domain/types/Status';
import { arGenomford } from '@/lib/genomford';
import { kursfargForKurs } from '@/lib/kursfarg';
import { queryKeys } from '@/queries/keys';
import { DetaljGrupp } from './DetaljGrupp';

/**
 * Gruppdynamik (task-18.10; S73-facit K63–K65). Lottas "vilka är i rummet?" —
 * erfarenhetsmixen (summeringsrad + sekventiell mätare + nivå-accordions) och
 * deltagarnas motiveringar. Nyskriven mot facit-bilagan (throwaway-kontraktet —
 * prototypkod absorberas aldrig); sist av eventsidans datagrupper före
 * Anteckningar (18.11).
 *
 * DATAKÄLLA: samma `registrations.byEvent`-query som arbetskön (Deltagare) —
 * React Query DEDUPAR till EN fetch. get-registrations eventId-grenen berikar
 * varje anmälan med `antalGenomfordaEvent`, `erfarenhetsbadge` (kanonisk,
 * RIM-3-BLIND) och `kurshistorik` (RÅA deltagande-rader, PersonHistoryEntry-shape).
 *
 * NIVÅ-BUCKETarna (0 / 1–2 / 3+) härleds ur `antalGenomfordaEvent` (basens
 * RIM-3-INKLUDERANDE räknare) — facit-formen. Personens kanoniska
 * `Erfarenhetsbadge` (RIM-3-BLIND) visas RÅ på kortet: när den avviker från
 * bucketen är just den divergensen den kända badge-luckan (T16) visad som den
 * ÄR — aldrig bortdesignad.
 *
 * Anmälningar UTAN Person-länk (manuell/+1 innan A2 kopplat dem) saknar
 * erfarenhets-underlag (`antalGenomfordaEvent === null`) → de kan inte
 * klassificeras och ingår därför INTE i mixen. "N av totalt" och nivå-bucketarna
 * går över den KLASSIFICERBARA populationen; utelämnandet är öppet bokfört, inte
 * en tyst 0-tvingning ("0 tidigare event" vore en osanning om en okänd person).
 * Motiveringarna listas separat och beror inte på klassificerbarheten.
 *
 * A11y (11/10): accordions bär aria-expanded/aria-controls mot panelens id;
 * nivåns antal står som TEXT i knapp-etiketten (skärmläsaren får hela bilden);
 * mätarens segment och kurs-/nivåstreck är aria-hidden (färg aldrig ensam
 * bärare); Läs mer/Visa mindre bär aria-expanded + kontext i aria-label;
 * radbrytningar i motiveringen bevaras (whitespace-pre-line).
 */

/** Aktiv anmälan (basens 'Är aktiv'-formel): endast Avbokad/Ombokad räknas bort. */
function arAktiv(r: Registration): boolean {
  return r.status !== RegistrationStatus.AVBOKAD;
}

/** Erfarenhetsmixens tre nivåer — sekventiell skala ur semantic.css (task-18.10). */
const ERFARENHETS_NIVAER: readonly {
  etikett: string;
  streck: string;
  test: (n: number) => boolean;
}[] = [
  { etikett: 'Första eventet', streck: 'bg-(--mm-erfarenhet-ny)', test: (n) => n === 0 },
  {
    etikett: '1-2 tidigare event',
    streck: 'bg-(--mm-erfarenhet-mellan)',
    test: (n) => n >= 1 && n <= 2,
  },
  { etikett: '3+ tidigare event', streck: 'bg-(--mm-erfarenhet-erfaren)', test: (n) => n >= 3 },
];

const MANAD_AR = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' });

/**
 * Personens GENOMFÖRDA, deduperade kurser ur de råa kurshistorik-raderna via
 * det DELADE `arGenomford`-predikatet (src/lib/genomford.ts — basens
 * `Genomfört event (1 rad per event)`-formel; samma definition som
 * RIM-behörigheten, task-18.17). Kronologiskt (äldst först, som facit).
 */
function genomfordaKurser(historik: PersonHistoryEntry[] | null | undefined): PersonHistoryEntry[] {
  return (historik ?? [])
    .filter(arGenomford)
    .slice()
    .sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''));
}

/** Månad + år ur en ISO-datumsträng; ogiltig/tom → tom sträng (renderas ej). */
function manadAr(datum: string | null): string {
  if (!datum) return '';
  const d = new Date(datum);
  return Number.isNaN(d.getTime()) ? '' : MANAD_AR.format(d);
}

/**
 * Initialerna för cirkeln ("AA" ur "Anna Andersson") — max två, versala.
 *
 * Duplicerad ur `PersonMiniKort.tsx` med avsikt: den komponentens API är
 * FÖRSEGLAT ("className/style/children är förseglade: radens form är facit-låst
 * … konsumenter komponerar inte om den"), så den kan inte bära gruppdynamikens
 * badge och kurshistorik. Vi ärver dess FORM, inte dess kod. Om en tredje
 * konsument dyker upp är hjälparen kandidat för `lib/` — inte förr.
 */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Ett personkort i en nivågrupp — initial-cirkel, namn, kanonisk badge och
 * (när den finns) kurshistoriken.
 *
 * FORMEN ÄR `PersonMiniKort`s (S93 våg 19, Marcus 2026-08-06: "de personkorten
 * vill jag ska se ut som dem på anmälan-detaljsidan"): initial-cirkel i
 * `bg-bg-emphasized` + namn, i en `rounded-xl bg-surface`-yta med
 * `border-transparent` och `contrast-more`-kant. CRM-record-idiomet.
 *
 * TVÅ MEDVETNA AVVIKELSER från förlagan, båda för att undvika en lögn:
 *
 *  · INGEN CHEVRON. `PersonMiniKort` är en `createLink`-länk vars chevron
 *    lovar navigering. Detta kort leder ingenstans — anmälningarna här bär
 *    ofta `personId: null` (manuell/+1 innan A2 kopplat dem), och en chevron
 *    utan mål är exakt den sortens falska affordans som `AnmalanDetail`s
 *    behörighetsrad undviker med sitt "länk utan mål ljuger". Klickbarhet är
 *    en egen fråga, inte en formfråga.
 *  · INGEN ROLL-UNDERRAD. Förlagans andra rad bär relationsrollen
 *    ("Medföljande (+1)"). Här finns ingen roll — bucketen ÄR rollen.
 *
 * "INGA TIDIGARE EVENT"-RADEN ÄR RIVEN (samma våg, Marcus: "på dem som listas
 * under 'Första eventet' så behövs inte raden … det är ju bara
 * dubbelinformation"). Han har rätt: raden stod ENDAST i kort utan
 * kurshistorik, och de korten bor per definition i bucketen "Första eventet" —
 * så raden upprepade bucketens namn tio gånger. Samma redundans-klass som
 * "Saknas"/"Mottagen" i betalningsvyn.
 */
function PersonKort({ reg }: { reg: Registration }) {
  const kurser = genomfordaKurser(reg.kurshistorik);
  const namn = displayName(reg);
  return (
    <div
      data-testid="gruppdynamik-personkort"
      className="flex flex-col gap-2 rounded-xl border border-transparent bg-surface px-3 py-2.5 contrast-more:border-border-strong"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span data-testid="gruppdynamik-namn" className="min-w-0 truncate font-medium text-body">
          {namn}
        </span>
        {/* Kanonisk Erfarenhetsbadge RÅ ur basen (RIM-3-BLIND). När den avviker
            från nivå-bucketen ÄR det den kända luckan (T16) — visad, ej dold.
            Pill-skalans `sm` per T127 (px-2 py-0.5 + transparent kant). */}
        {reg.erfarenhetsbadge && (
          <span
            data-testid="gruppdynamik-badge"
            className="ml-auto shrink-0 rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong"
          >
            {reg.erfarenhetsbadge}
          </span>
        )}
      </div>
      {/* Kurshistoriken renderas ENDAST när den finns — tomläget bar förut en
          rad som upprepade bucketen (se docblocket ovan). `pl-12` = cirkelns
          36 px + `gap-3`:s 12 px, så raderna linjerar under namnet. */}
      {kurser.length > 0 && (
        <ul className="flex flex-col gap-1 pl-12">
          {kurser.map((h) => {
            const kf = kursfargForKurs(h.kursnamn);
            // Legendens korta etikett för mappade kurser (facit: "RIM 1"); rå
            // kursnamn för uppsamlingen 'Annat' så en okänd kurs inte döljs.
            const label = kf.klass === 'annat' ? (h.kursnamn ?? 'Annat') : kf.etikett;
            return (
              <li
                key={h.id}
                data-testid="gruppdynamik-kurshistorik-rad"
                className="flex items-center justify-between gap-3 text-caption"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={`h-3.5 w-1 shrink-0 rounded-full ${kf.bgClass}`}
                  />
                  <span className="truncate text-text-secondary">{label}</span>
                </span>
                <span className="shrink-0 text-text-muted">{manadAr(h.datum)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** En nivågrupp som accordion — radens antal är urvalet (K40-grammatiken). */
function NivaAccordion({
  etikett,
  streck,
  personer,
}: {
  etikett: string;
  streck: string;
  personer: Registration[];
}) {
  const [oppen, setOppen] = useState(false);
  const panelId = useId();
  return (
    // HOVER-PLATTANS FORM (S93 våg 19, Marcus 2026-08-06: "när jag hovrar så
    // täcks ju allt yta mellan seperatorerna mellan raderna, 'knappen' är
    // alltså inte likadan som på till exempel 'anmälda deltagare-blocket'").
    //
    // Mätt, och han hade rätt: knappen bar `py-3` och satt i en förälder UTAN
    // padding, så hover-plattan blev 48 px — exakt radhöjden — och gick kant
    // till kant mellan `divide-y`-separatorerna. Deltagares hållplats-rader
    // gör tvärtom: `py-1.5` på knappen (36 px platta) i en förälder med `py-2`,
    // vilket lämnar 8 px luft över och under så plattan läser som en KNAPP i
    // raden, inte som raden själv.
    //
    // Formen härmas nu exakt (`py-2` på föräldern, `py-1.5` + `w-auto` på
    // knappen). Radhöjden går 48 → 52 px, samma som Deltagares — det är
    // avsikten: Marcus jämförde med just den ytan.
    <div className="flex flex-col py-2">
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={panelId}
        onClick={() => setOppen((v) => !v)}
        className="-mx-2 flex w-auto items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-left hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <span className="flex items-center gap-2 text-small text-text-muted">
          <span aria-hidden="true" className={`w-1 shrink-0 self-stretch rounded-full ${streck}`} />
          {etikett}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-body tabular-nums">{personer.length}</span>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className={`shrink-0 text-text-secondary motion-safe:transition-transform ${oppen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>
      {/* `pt-2` skiljer panelen från knappen; föräldern bär redan `py-2` nedåt
          så ingen egen `pb` behövs (den hade adderats till förälderns). */}
      <div id={panelId} hidden={!oppen} className="flex flex-col gap-2 pt-2">
        {personer.map((r) => (
          <PersonKort key={r.id} reg={r} />
        ))}
      </div>
    </div>
  );
}

/**
 * Motiveringskortet (K65): långa svar (verkliga spänner en rad → ~600 tecken)
 * klipps på 3 rader med Läs mer/Visa mindre; radbrytningar bevaras
 * (whitespace-pre-line). Knappen visas ENDAST vid FAKTISK overflow — mätt mot
 * den klippta lådan (scrollHeight > clientHeight), aldrig en teckenantals-
 * heuristik (skarp form mäter faktisk overflow).
 */
function MotiveringsKort({ namn, svar }: { namn: string; svar: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const [utfalld, setUtfalld] = useState(false);
  const [kanExpandera, setKanExpandera] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mat = () => {
      // Mät bara i KLIPPT läge — utfälld är clientHeight == scrollHeight (falskt
      // negativt). kanExpandera behålls från den klippta mätningen.
      if (!utfalld) setKanExpandera(el.scrollHeight > el.clientHeight + 1);
    };
    mat();
    const ro = new ResizeObserver(mat);
    ro.observe(el);
    return () => ro.disconnect();
  }, [utfalld]);

  return (
    <figure
      data-testid="gruppdynamik-motivering"
      className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface px-4 py-3 contrast-more:border-border-strong"
    >
      <blockquote
        ref={ref}
        data-testid="gruppdynamik-motivering-text"
        className={`whitespace-pre-line text-body ${utfalld ? '' : 'line-clamp-3'}`}
      >
        {svar}
      </blockquote>
      <div className="flex items-center justify-between gap-3">
        <figcaption className="text-caption text-text-muted">{namn}</figcaption>
        {kanExpandera && (
          <button
            type="button"
            aria-expanded={utfalld}
            aria-label={`${utfalld ? 'Visa mindre av' : 'Läs hela'} motiveringen från ${namn}`}
            onClick={() => setUtfalld((v) => !v)}
            className="shrink-0 font-medium text-caption underline-offset-2 hover:underline"
          >
            {utfalld ? 'Visa mindre' : 'Läs mer'}
          </button>
        )}
      </div>
    </figure>
  );
}

export function Gruppdynamik({ event }: { event: Event }) {
  const dataSource = useDataSource();
  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.registrations.byEvent(event.id),
    queryFn: () => dataSource.fetchRegistrations({ eventId: event.id }),
  });
  if (isPending) {
    return (
      <DetaljGrupp id="grupp-gruppdynamik" rubrik="Gruppdynamik">
        <div role="status" aria-busy="true" className="flex flex-col gap-2.5 py-3">
          <span className="sr-only">Laddar gruppdynamik…</span>
          <Skeleton variant="text" className="w-2/5" />
          <Skeleton variant="listRow" className="h-10 rounded-lg" />
          <Skeleton variant="listRow" className="h-10 rounded-lg" />
        </div>
      </DetaljGrupp>
    );
  }

  if (isError) {
    return (
      <DetaljGrupp id="grupp-gruppdynamik" rubrik="Gruppdynamik">
        <div className="py-3">
          <MessageBox intent="error" title="Kunde inte hämta gruppdynamiken">
            {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
          </MessageBox>
        </div>
      </DetaljGrupp>
    );
  }

  const registreringar = data;
  const aktiva = registreringar.filter(arAktiv);
  // Erfarenhetsmixen går över den KLASSIFICERBARA populationen (känd räknare).
  const klassificerbara = aktiva.filter((r) => r.antalGenomfordaEvent != null);
  const totalt = klassificerbara.length;
  const aterkommande = klassificerbara.filter((r) => (r.antalGenomfordaEvent ?? 0) > 0).length;
  const nivaer = ERFARENHETS_NIVAER.map((n) => ({
    ...n,
    personer: klassificerbara.filter((r) => n.test(r.antalGenomfordaEvent ?? 0)),
  }));
  // Motiveringarna: alla aktiva anmälningar med ett formulärsvar (manuell/+1 går
  // utanför formuläret → null → utelämnas naturligt), i listans ordning.
  const roster = aktiva.filter((r) => r.motivering != null && r.motivering !== '');

  if (totalt === 0 && roster.length === 0) {
    return (
      <DetaljGrupp id="grupp-gruppdynamik" rubrik="Gruppdynamik">
        {/* Review-våg 2 (2026-07-23): centrerad muted-text + samma min-h som
            Närvaros tomläge — tomma kort ser lika stora ut. */}
        <p className="flex min-h-28 items-center justify-center text-center text-small text-text-muted">
          Inget att visa ännu
        </p>
      </DetaljGrupp>
    );
  }

  return (
    <DetaljGrupp id="grupp-gruppdynamik" rubrik="Gruppdynamik">
      {/* Summeringsrad + sekventiell mätare (streck-segment per nivå). */}
      <div className="flex flex-col gap-1.5 py-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-small text-text-muted">Varit hos Miranon Media förut</span>
          <span
            data-testid="gruppdynamik-summering"
            className="font-medium text-small text-text-secondary tabular-nums"
          >
            {aterkommande} av {totalt}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="flex h-1.5 gap-px overflow-hidden rounded-full bg-surface"
        >
          {nivaer
            .filter((n) => n.personer.length > 0)
            .map((n) => (
              <div
                key={n.etikett}
                className={n.streck}
                style={{ width: `${(100 * n.personer.length) / totalt}%` }}
              />
            ))}
        </div>
      </div>

      {/* Nivågrupperna som accordions (facitets tre nivåer, alla synliga). */}
      {nivaer.map((n) => (
        <NivaAccordion
          key={n.etikett}
          etikett={n.etikett}
          streck={n.streck}
          personer={n.personer}
        />
      ))}

      {/* Motiveringarna som vita kort (K65). */}
      {roster.length > 0 && (
        <div className="flex flex-col py-3">
          <ul className="flex flex-col gap-2.5">
            {roster.map((r) => (
              <li key={r.id}>
                <MotiveringsKort namn={displayName(r)} svar={r.motivering ?? ''} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetaljGrupp>
  );
}
