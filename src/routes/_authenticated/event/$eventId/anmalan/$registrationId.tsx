/**
 * [PROTOTYPE] S83 pass 3 — TASK-18.17. KASTBAR KOD (throwaway-kontraktet;
 * prototype-skillen UI-grenen; ny facit-yta — utkast itereras med Marcus).
 *
 * FRÅGAN (nedskriven, klausul i): Hur ska per-anmälan-detaljvyn se ut —
 * route-form, innehållszoner och ordning?
 *
 * STEG 3 — Marcus-iteration 1 (2026-07-24, uppifrån-och-ner-genomgången):
 * status som IKON (grön bock bekräftad + tidsstämpel / varningstriangel
 * obekräftad) + BEKRÄFTA-åtgärD härifrån (läsvy-v1 öppet riven; grön knapp
 * per 18.16-regeln — når utomstående) · rå betalstatus (ej "Snart dags"),
 * deadline kvar · symmetriska noterings-rader · person-relationer som
 * MINI-KORT (ej understrukna länkar) · tidigare-kurser BORT · RIM-behörighet
 * HÄRLEDD (verifierat deltagande slår självrapport) i Avser · "Motivering"
 * med läs mer-klipp · formulär med mutat mono-ID (kopierbart,
 * Stripe-idiomet) · Källa "Formulär" · "URL" (gap-raden kvar) · Intern
 * notering med författar-gap synligt · tidslinjen omgjord
 * branschledarmässigt (linje + ikon-noder, senast överst).
 *
 * Åtgärden är DEMO-lokal (minnes-state, regel 3): klick flippar status +
 * lägger tidslinje-händelse — ingen riktig mutation, ingen allowlist.
 * DEV-grindad route; rivs med passet (klausul iv).
 */
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import {
  BadgeCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Copy,
  Inbox,
  Mail,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { PrototypeSwitcher, type PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { DetaljGrupp, EtikettVardeRad } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';

export const Route = createFileRoute('/_authenticated/event/$eventId/anmalan/$registrationId')({
  beforeLoad: ({ params }) => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: '/event/$eventId', params: { eventId: params.eventId } });
    }
  },
  staticData: { title: 'Anmälan' },
  component: AnmalanDetaljPrototyp,
});

const PROTO_VARIANTS_18_17: PrototypeVariant[] = [
  {
    key: 'k',
    label: 'Anmälningsvyn',
    steg: 4,
    stegLabel: 'Steg 4 — LÅST (Marcus 2026-07-24)',
  },
];

type HandelseTyp = 'inkom' | 'mail' | 'betalning' | 'paminnelse' | 'plus1';
type Handelse = { nar: string; vad: string; typ: HandelseTyp };

type Behorighet =
  | { lage: 'godkand'; krav: string; grund: string }
  | { lage: 'ej-verifierad'; krav: string; grund: string }
  | null;

/** Demo-anmälan — speglar basens fält-rymd (mappning mot Registration/
    get-registration är skivans leverans). */
type DemoAnmalan = {
  anmalanId: number;
  namn: string;
  email: string;
  telefon: string | null;
  personId: string;
  bekraftad: string | null; // Bekräftelse skickad (datum+tid); null = obekräftad
  eventNamn: string;
  eventTyp: string;
  ort: string;
  startdatum: string;
  slutdatum: string | null;
  tidKvar: string | null;
  eventKey: string | null;
  behorighet: Behorighet;
  inskickad: string;
  franFormular: string;
  franFormularId: string; // basens option-ID (proffs-chippen)
  kalla: string | null; // null = formulär (S73 K37-normen)
  antalPlatser: number;
  borOver: boolean;
  medfoljandeTill: { id: string; namn: string } | null;
  plusEttor: { id: string; namn: string }[];
  motivering: string | null;
  fragor: string | null;
  villkorOk: boolean;
  sidUrl: string | null;
  kampanj: string | null; // tolkat UTM: source · medium · campaign
  avgiftStatus: string;
  avgiftNotering: string | null;
  slutStatus: string;
  slutDeadline: string | null;
  slutDagarKvar: number | null;
  slutNotering: string | null;
  noteringar: { text: string; av: string; nar: string }[];
  handelser: Handelse[]; // äldst först; renderas senast-överst
};

const DEMO: Record<string, DemoAnmalan> = {
  'demo-anna': {
    anmalanId: 247,
    namn: 'Anna Andersson',
    email: 'anna.andersson@example.se',
    telefon: '070-123 45 67',
    personId: 'demo-person-anna',
    bekraftad: '2026-07-01T09:15:00',
    eventNamn: 'Resor i medvetandet 2',
    eventTyp: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    behorighet: {
      lage: 'godkand',
      krav: 'Godkänd för RIM 2',
      grund: 'RIM 1 verifierad via deltagande (mars 2026)',
    },
    inskickad: '2026-06-30T14:32:00',
    franFormular: 'Huvudformulär',
    franFormularId: 'selQyiMaRVXuu7Nm5',
    kalla: null,
    antalPlatser: 1,
    borOver: true,
    medfoljandeTill: null,
    plusEttor: [{ id: 'demo-bjorn', namn: 'Björn Berg' }],
    motivering:
      'Har längtat efter att utveckla min medialitet i många år och känner att det är dags nu. ' +
      'Efter RIM 1 i våras har jag övat regelbundet med meditationerna och känner att jag har ' +
      'nått en platå där jag behöver nästa stegs verktyg och Rogers vägledning för att komma ' +
      'vidare. Min man har också sett skillnaden och stöttar helhjärtat att jag fortsätter.',
    fragor: null,
    villkorOk: true,
    sidUrl: 'miranon.se/kurser/resor-i-medvetandet-2',
    kampanj: 'facebook / cpc / rim2-hosten',
    avgiftStatus: 'Mottagen',
    avgiftNotering: 'Swish 2026-07-02',
    slutStatus: 'Ej mottagen',
    slutDeadline: '2026-07-27',
    slutDagarKvar: 3,
    slutNotering: null,
    noteringar: [
      { text: 'Vill sitta nära dörren (ryggbesvär).', av: 'Lotta', nar: '2026-07-02T14:02:00' },
      {
        text: 'Pratade med Anna i telefon — hon tar med egen kudde och kommer kvällen innan.',
        av: 'Roger',
        nar: '2026-07-18T16:45:00',
      },
    ],
    handelser: [
      { nar: '2026-06-30T14:32:00', vad: 'Anmälan inkom via Huvudformulär', typ: 'inkom' },
      { nar: '2026-07-01T09:15:00', vad: 'Bekräftelsemail skickat', typ: 'mail' },
      {
        nar: '2026-07-02T11:40:00',
        vad: 'Anmälningsavgift markerad som mottagen',
        typ: 'betalning',
      },
      { nar: '2026-07-18T10:02:00', vad: 'Påminnelse om slutbetalning skickad', typ: 'paminnelse' },
    ],
  },
  'demo-bjorn': {
    anmalanId: 248,
    namn: 'Björn Berg',
    email: 'bjorn.berg@example.se',
    telefon: '072-987 65 43',
    personId: 'demo-person-bjorn',
    bekraftad: null,
    eventNamn: 'Resor i medvetandet 2',
    eventTyp: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    behorighet: {
      lage: 'ej-verifierad',
      krav: 'Ej verifierad för RIM 2',
      grund: 'Inget deltagande för RIM 1 registrerat',
    },
    inskickad: '2026-07-14T19:05:00',
    franFormular: '—',
    franFormularId: '',
    kalla: '+1',
    antalPlatser: 1,
    borOver: false,
    medfoljandeTill: { id: 'demo-anna', namn: 'Anna Andersson' },
    plusEttor: [],
    motivering: null,
    fragor: null,
    villkorOk: false,
    sidUrl: null,
    kampanj: null,
    avgiftStatus: 'Ej mottagen',
    avgiftNotering: null,
    slutStatus: 'Ej mottagen',
    slutDeadline: '2026-07-27',
    slutDagarKvar: 3,
    slutNotering: null,
    noteringar: [],
    handelser: [
      {
        nar: '2026-07-14T19:05:00',
        vad: 'Anmälan skapad som medföljande (+1) till Anna Andersson',
        typ: 'plus1',
      },
      { nar: '2026-07-14T19:06:00', vad: 'Plus-one-förfrågan skickad', typ: 'mail' },
    ],
  },
};

const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const DATUM_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function datum(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : LANGDATUM.format(d);
}
function datumTid(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATUM_TID.format(d);
}

/** Initial-cirkeln för person-mini-korten ("AA" ur "Anna Andersson"). */
function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * [NY KOMPONENT-KANDIDAT] Person-mini-kort — relationslänk som litet kort i
 * kortet (CRM-record-idiomet) i stället för understruken textlänk:
 * initial-cirkel + namn + roll-underrad + chevron; hela ytan klickbar.
 */
function PersonMiniKort({
  namn,
  roll,
  to,
  params,
}: {
  namn: string;
  roll: string;
  to: '/personer/$personId' | '/event/$eventId/anmalan/$registrationId';
  params: Record<string, string>;
}) {
  return (
    <div className="flex flex-col py-2">
      <Link
        // biome-ignore lint/suspicious/noExplicitAny: kastbar prototyp — typad route-union ovan
        to={to as any}
        // biome-ignore lint/suspicious/noExplicitAny: kastbar prototyp — param-shapen varierar per rutt
        params={params as any}
        className="-mx-2 flex w-auto items-center gap-3 rounded-xl bg-surface px-3 py-2.5 hover:bg-bg-emphasized motion-safe:transition-colors"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-body">{namn}</span>
          <span className="text-caption text-text-muted">{roll}</span>
        </span>
        <ChevronRight
          aria-hidden="true"
          size={18}
          className="ml-auto shrink-0 text-text-secondary"
        />
      </Link>
    </div>
  );
}

/** [NY KOMPONENT-KANDIDAT] Mutat mono-ID-chip med klick-kopiering
    (Stripe-idiomet: tekniska ID:n synliga men nedtonade, kopierbara). */
function IdChip({ id }: { id: string }) {
  const [kopierad, setKopierad] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(id).then(() => {
          setKopierad(true);
          setTimeout(() => setKopierad(false), 1600);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-0.5 font-mono text-caption text-text-muted hover:bg-bg-emphasized motion-safe:transition-colors"
    >
      {kopierad ? 'Kopierat!' : id}
      <Copy aria-hidden="true" size={12} className="shrink-0" />
      <span className="sr-only">Kopiera formulär-ID</span>
    </button>
  );
}

/**
 * [NY KOMPONENT-KANDIDAT] Tonal status-badge (Polaris-idiomet): ikon + ord i
 * en tonal pill. EN form för alla tillstånds-utsagor på sidan (status i
 * headern + behörigheten i Avser) — texten bär, tonen förstärker.
 */
function StatusBadge({ ton, children }: { ton: 'success' | 'warning'; children: string }) {
  const Ikon = ton === 'success' ? CircleCheck : TriangleAlert;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-small ${
        ton === 'success' ? 'bg-success-bg' : 'bg-warning-bg'
      }`}
    >
      <Ikon
        aria-hidden="true"
        size={15}
        className={`shrink-0 ${ton === 'success' ? 'text-success' : 'text-warning'}`}
      />
      {children}
    </span>
  );
}

/**
 * [NY KOMPONENT-KANDIDAT] Fullbredds-fritextblock för långa svar
 * (motiveringar): mikro-etikett + vänsterställd läsbar text med
 * läs mer-klipp — fritext hör INTE hemma i högerställda key-value-rader.
 */
function FritextRad({ etikett, text }: { etikett: string; text: string }) {
  const [oppen, setOppen] = useState(false);
  const lang = text.length > 180;
  return (
    <div className="flex flex-col gap-1.5 py-3">
      <span className="text-caption text-text-muted">{etikett}</span>
      <p className={`my-0 text-body leading-relaxed ${oppen || !lang ? '' : 'line-clamp-3'}`}>
        {text}
      </p>
      {lang ? (
        <button
          type="button"
          aria-expanded={oppen}
          onClick={() => setOppen((o) => !o)}
          className="self-start font-medium text-small text-text-secondary underline hover:text-text"
        >
          {oppen ? 'Visa mindre' : 'Läs mer'}
        </button>
      ) : null}
    </div>
  );
}

/**
 * [NY KOMPONENT-KANDIDAT] Noterings-kort — målbilden för interna noteringar
 * (Anteckningar-mönstret ADR-075: text + författare + tidpunkt per post;
 * skalar till många). Dagens bas-fält rymmer EN anonym text — migreringen
 * är byggkravet.
 */
function NoteringsKort({ text, av, nar }: { text: string; av: string; nar: string }) {
  return (
    <div className="my-2 flex flex-col gap-1.5 rounded-xl bg-surface p-3">
      <p className="my-0 text-body leading-relaxed">{text}</p>
      <span className="text-caption text-text-muted">
        {av} · {datumTid(nar)}
      </span>
    </div>
  );
}

const HANDELSE_IKON: Record<HandelseTyp, typeof Mail> = {
  inkom: Inbox,
  mail: Mail,
  betalning: BadgeCheck,
  paminnelse: Bell,
  plus1: UserPlus,
};

/**
 * [NY KOMPONENT-KANDIDAT] Tidslinje — branschledar-formen (Shopify/Stripe
 * activity): genomgående linje, ikon-noder i cirklar, senaste händelsen
 * överst; texten bär, tiden mutad under.
 */
function Tidslinje({ handelser }: { handelser: Handelse[] }) {
  const senastForst = [...handelser].reverse();
  return (
    <ol className="relative my-0 flex list-none flex-col py-3 pl-0">
      <span aria-hidden="true" className="absolute top-5 bottom-5 left-[15px] w-px bg-border" />
      {senastForst.map((h) => {
        const Ikon = HANDELSE_IKON[h.typ];
        return (
          <li key={h.nar + h.vad} className="relative flex items-start gap-3 pb-5 last:pb-1">
            <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
              <Ikon aria-hidden="true" size={14} className="text-text-secondary" />
            </span>
            <span className="flex min-w-0 flex-col pt-1">
              <span className="text-body">{h.vad}</span>
              <span className="text-caption text-text-muted">{datumTid(h.nar)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AnmalanDetaljPrototyp() {
  const { eventId, registrationId } = Route.useParams();
  const bas = DEMO[registrationId] ?? DEMO['demo-anna'];

  // DEMO-åtgärden (minnes-state, ingen mutation): "Skicka bekräftelse"
  // flippar status + föder tidslinje-händelsen — synliggör hela flödet.
  const [demoBekraftad, setDemoBekraftad] = useState<string | null>(null);
  const bekraftad = bas.bekraftad ?? demoBekraftad;
  const handelser = demoBekraftad
    ? [
        ...bas.handelser,
        { nar: demoBekraftad, vad: 'Bekräftelsemail skickat', typ: 'mail' as const },
      ]
    : bas.handelser;

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <Link
        to="/event/$eventId"
        params={{ eventId }}
        aria-label="Tillbaka till eventet"
        className="mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>

      {/* Header: namn + ID-pill; statusraden bär IKON + tidsstämpel
          (Marcus-iterationen) och bekräfta-åtgärden när obekräftad
          (grön per 18.16 — når utomstående). */}
      <header className="flex flex-col gap-2.5 border-border border-b px-4 pb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 break-words font-semibold text-3xl">{bas.namn}</h1>
          <span className="shrink-0 rounded-full bg-bg-muted px-3 py-1 font-medium font-mono text-small text-text-secondary">
            Anmälan #{bas.anmalanId}
          </span>
        </div>
        {/* Statusraden bär ENDAST badgen (+tid) — åtgärden bor i
            Kontakt-sektionen nedanför (Marcus-iteration 2: tydligare och
            snyggare med knappen vid mailadressen den faktiskt skickar till). */}
        <p className="my-0 flex flex-wrap items-center gap-2">
          {bekraftad ? (
            <>
              <StatusBadge ton="success">Bekräftad</StatusBadge>
              <span className="text-small text-text-muted">{datumTid(bekraftad)}</span>
            </>
          ) : (
            <StatusBadge ton="warning">Obekräftad</StatusBadge>
          )}
        </p>
      </header>

      {/* Kontakt + bekräfta-åtgärden (Marcus-iteration 2): knappen bor hos
          mailadressen den skickar till — kontexten gör åtgärden begriplig.
          E-post finns ALLTID (Marcus 2026-07-24) — ingen saknas-gren. */}
      <DetaljGrupp id="grupp-kontakt" rubrik="Kontakt">
        <EtikettVardeRad term="E-post">{bas.email}</EtikettVardeRad>
        <EtikettVardeRad term="Telefon">
          {bas.telefon ?? <span className="text-text-muted">Inget nummer</span>}
        </EtikettVardeRad>
        {!bekraftad ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="text-small text-text-muted">
              Bekräftelsen skickas till e-postadressen ovan.
            </span>
            <Button
              intent="success"
              size="sm"
              onPress={() => setDemoBekraftad(new Date().toISOString())}
            >
              Skicka bekräftelse
            </Button>
          </div>
        ) : null}
      </DetaljGrupp>

      {/* Avser: eventet länkat + BEHÖRIGHETEN härledd (verifierat deltagande
          slår självrapporten "har du gått steg 1?" — rå-svaret utgår). */}
      <DetaljGrupp id="grupp-eventet" rubrik="Avser">
        <div className="flex flex-col py-1.5">
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            className="-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors"
          >
            {/* Kursfärgs-pricken: samma kontextrad-grammatik som eventväljarens
                stängda läge ska bära (18.18 B-formen) — familje-harmonisering. */}
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-cat-event" />
            {bas.eventNamn}
            {/* EventKey förstärker identiteten (Marcus-iteration 3) — mutad
                mono i samma grammatik som eventsidans pill + anmälans #ID. */}
            {bas.eventKey ? (
              <span className="ml-auto shrink-0 font-mono font-normal text-caption text-text-muted">
                {bas.eventKey}
              </span>
            ) : null}
            <ChevronRight
              aria-hidden="true"
              size={18}
              className={`shrink-0 text-text-secondary ${bas.eventKey ? '' : 'ml-auto'}`}
            />
          </Link>
        </div>
        <EtikettVardeRad term="Typ">{bas.eventTyp}</EtikettVardeRad>
        <EtikettVardeRad term="Ort">{bas.ort}</EtikettVardeRad>
        <EtikettVardeRad term="Datum">
          {datum(bas.startdatum)}
          {bas.slutdatum ? ` – ${datum(bas.slutdatum)}` : ''}
        </EtikettVardeRad>
        {bas.tidKvar ? <EtikettVardeRad term="Tid kvar">{bas.tidKvar}</EtikettVardeRad> : null}
        {bas.behorighet ? (
          <EtikettVardeRad term="Behörighet">
            <span className="flex flex-col items-end gap-1">
              <StatusBadge ton={bas.behorighet.lage === 'godkand' ? 'success' : 'warning'}>
                {bas.behorighet.krav}
              </StatusBadge>
              {/* GRUNDEN är alltid länken till personkortet (understruken) —
                  ingen extra rad, designen behålls (Marcus-iteration 3). */}
              <Link
                to="/personer/$personId"
                params={{ personId: bas.personId }}
                className="text-caption text-text-muted underline hover:text-text"
              >
                {bas.behorighet.grund}
              </Link>
            </span>
          </EtikettVardeRad>
        ) : null}
      </DetaljGrupp>

      {/* Betalningar: RÅ status (Marcus: tydligare än "Snart dags"),
          deadline-raden kvar; noterings-raderna ALLTID symmetriska. */}
      <DetaljGrupp id="grupp-betalningar" rubrik="Betalningar">
        <EtikettVardeRad term="Anmälningsavgift">{bas.avgiftStatus}</EtikettVardeRad>
        <EtikettVardeRad term="Notering (avgift)">
          {bas.avgiftNotering ?? <span className="text-text-muted">Ingen notering</span>}
        </EtikettVardeRad>
        <EtikettVardeRad term="Slutbetalning">{bas.slutStatus}</EtikettVardeRad>
        {bas.slutDeadline ? (
          <EtikettVardeRad term="Deadline">
            <span className="flex items-center justify-end gap-2">
              {datum(bas.slutDeadline)}
              {bas.slutDagarKvar != null && bas.slutStatus !== 'Mottagen' ? (
                // Vit pill = listkortens dagar-kvar-grammatik (EventCards
                // status-slot) — samma form för samma sak i hela familjen.
                <span className="rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption">
                  {bas.slutDagarKvar} dagar kvar
                </span>
              ) : null}
            </span>
          </EtikettVardeRad>
        ) : null}
        <EtikettVardeRad term="Notering (slutbetalning)">
          {bas.slutNotering ?? <span className="text-text-muted">Ingen notering</span>}
        </EtikettVardeRad>
      </DetaljGrupp>

      {/* Uppgifter: platser + bor över + RELATIONERNA som person-mini-kort
          (kontakten flyttad till egen sektion, Marcus-iteration 2). */}
      <DetaljGrupp id="grupp-uppgifter" rubrik="Uppgifter">
        <EtikettVardeRad term="Antal platser">{bas.antalPlatser}</EtikettVardeRad>
        <EtikettVardeRad term="Bor över">{bas.borOver ? 'Ja' : 'Nej'}</EtikettVardeRad>
        {bas.medfoljandeTill ? (
          <PersonMiniKort
            namn={bas.medfoljandeTill.namn}
            roll="Huvudanmälan (denna anmälan är +1)"
            to="/event/$eventId/anmalan/$registrationId"
            params={{ eventId, registrationId: bas.medfoljandeTill.id }}
          />
        ) : null}
        {bas.plusEttor.map((p) => (
          <PersonMiniKort
            key={p.id}
            namn={p.namn}
            roll="Medföljande (+1)"
            to="/event/$eventId/anmalan/$registrationId"
            params={{ eventId, registrationId: p.id }}
          />
        ))}
        <PersonMiniKort
          namn={bas.namn}
          roll="Personkort"
          to="/personer/$personId"
          params={{ personId: bas.personId }}
        />
      </DetaljGrupp>

      {/* Ansökningssvar: "Motivering" (kort etikett, läs mer-klipp);
          tidigare-kurser UTGÅR (behörigheten bär behovet i Avser). */}
      {bas.motivering || bas.fragor ? (
        <DetaljGrupp id="grupp-svar" rubrik="Ansökningssvar">
          {bas.motivering ? <FritextRad etikett="Motivering" text={bas.motivering} /> : null}
          {bas.fragor ? <FritextRad etikett="Frågor/funderingar" text={bas.fragor} /> : null}
        </DetaljGrupp>
      ) : null}

      {/* Inkom (proveniensen): inskickad med klockslag · formulär med mutat
          kopierbart ID (basens option-ID) · Källa kort ("Formulär") ·
          URL-raden bär bas-gapet ärligt. */}
      <DetaljGrupp id="grupp-inkom" rubrik="Inkom">
        <EtikettVardeRad term="Inskickad">{datumTid(bas.inskickad)}</EtikettVardeRad>
        <EtikettVardeRad term="Formulär">
          {bas.kalla == null ? (
            // Staplad högerställd: namnet behåller sin kant-position,
            // ID-chippen mutad UNDER (Marcus: namnet ska inte tryckas in).
            <span className="flex flex-col items-end gap-1">
              <span>{bas.franFormular}</span>
              {bas.franFormularId ? <IdChip id={bas.franFormularId} /> : null}
            </span>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </EtikettVardeRad>
        <EtikettVardeRad term="Källa">{bas.kalla ?? 'Formulär'}</EtikettVardeRad>
        <EtikettVardeRad term="Villkor godkända">
          {bas.kalla != null && !bas.villkorOk ? (
            // En +1:a/manuell anmälan har aldrig mött villkors-kryssrutan —
            // "Nej" hade läst som complianceproblem; ärliga formen är
            // ej-tillämpligt (Marcus granskar; ev. samtyckes-hål är
            // process-fråga, inte vy-fråga).
            <span className="text-text-muted">Ej tillämpligt ({bas.kalla})</span>
          ) : bas.villkorOk ? (
            'Ja'
          ) : (
            'Nej'
          )}
        </EtikettVardeRad>
        {bas.sidUrl ? (
          <EtikettVardeRad term="URL">
            <a
              href={`https://${bas.sidUrl}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-small underline hover:text-text"
            >
              {bas.sidUrl}
            </a>
          </EtikettVardeRad>
        ) : null}
        {bas.kampanj ? (
          <EtikettVardeRad term="UTM">
            <span className="font-mono text-small">{bas.kampanj}</span>
          </EtikettVardeRad>
        ) : null}
      </DetaljGrupp>

      {/* Intern notering (Lottas/Rogers fält — INTE anmälarens; anmälarens
          medskick bor i Ansökningssvar). Författare + tidpunkt saknas i
          basens fält — gap-raden synlig; Anteckningar-mönstret (ADR-075)
          är den riktiga vägen. */}
      {/* Interna noteringar — MÅLBILDEN (Anteckningar-mönstret ADR-075):
          noterings-kort med författare + tidpunkt, skalar till många.
          Dagens bas-fält rymmer EN anonym text — gap-raden bär det ärligt;
          migreringen till Anteckningar-tabellen är byggkravs-rekommendation. */}
      {bas.noteringar.length > 0 ? (
        <DetaljGrupp id="grupp-noteringar" rubrik="Interna noteringar">
          <div className="flex flex-col py-1">
            {bas.noteringar.map((n) => (
              <NoteringsKort key={n.nar} text={n.text} av={n.av} nar={n.nar} />
            ))}
          </div>
        </DetaljGrupp>
      ) : null}

      {/* Händelser: tidslinjen i branschledar-form, senast överst. */}
      <DetaljGrupp id="grupp-handelser" rubrik="Händelser">
        <Tidslinje handelser={handelser} />
      </DetaljGrupp>

      {import.meta.env.DEV ? (
        <div className="print:hidden">
          <PrototypeSwitcher variants={PROTO_VARIANTS_18_17} />
        </div>
      ) : null}
    </section>
  );
}
