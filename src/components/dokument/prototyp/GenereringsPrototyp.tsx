/**
 * [PROTOTYPE, S108] Genereringsvyn — KONVERGENS.
 *
 * FRÅGAN PROTOTYPEN BESVARAR (S108 Del 2 § I, Marcus 2026-08-20):
 *
 *   "Vad ser Lotta när hon genererar bekräftelsebilagan för Arboga-eventet
 *    31 oktober?"
 *
 * Den stänger `T153` (modellen prövad mot fler dokument än två) och `T154`
 * (logiska luckan mellan beslut 6 och 7 — vad inaktuell-markeringen betyder
 * när ett event skrivit över ett block). Formen är DIREKT KONVERGENS (Marcus
 * 2026-08-20, i samma andetag som pausen): en variant, ingen divergensfas,
 * itererad i dev-servern tills han är nöjd. Promoveringskontraktet (ADR-103)
 * gäller — den godkända formen promoveras, det som rivs är växlar.
 *
 * HEMVIST: underform A — monterad på den skarpa routen `/mer/dokument` bakom
 * `?variant=a`, DEV-grindad i routen (ADR-044/ADR-103 B3: EN läspunkt).
 * `?vy=lista|generering` + `?mall=bekraftelse|deltagarinfo` adresserar läget
 * så en URL kan delas.
 *
 * DATA: Arboga-eventet (`Event-59`, prod-läst 2026-08-21 — finns INTE i
 * staging) är en in-memory-fixtur; Eventinnehåll och Platser är de två
 * ENTITETER S108-grillningen beslutade (Del 2 § D beslut 1, 6, 8) men som
 * inte finns i basen än — här som fixturer med mallens VERBATIM-text
 * (`docs/mallar/bilagor/*.html`). Ingen write någonstans; allt tillstånd
 * lever i minnet och dör med omladdning (prototype-skillen, regel 3).
 *
 * LISTA-VYN är en kopia av Dokument-ytans form i eventläget (`DokumentYta.tsx`
 * § DokumentLista) — startpunkten ska vara EXAKT kopia (T66), därför är
 * klasserna stulna rad för rad, inte omtolkade. Skillnaden mot skarpa: två
 * mallrader i stället för en, och mallradens knapp leder till genereringsvyn
 * i stället för direkt till PDF:en.
 */
import { Link } from '@tanstack/react-router';
import { Check, ChevronLeft, ChevronRight, Files, FileText, Upload } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { TextArea } from '@/components/primitives/TextArea';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import type { Event } from '@/domain/models/Event';

/* ------------------------------------------------------------------ *
 * FIXTURER
 * ------------------------------------------------------------------ */

/** Event-59, läst ur prod 2026-08-21 (`recqA2Us1FByBnibz`). */
const ARBOGA: Event = {
  id: 'proto-event-59',
  eventlabel: 'Arboga – Utbildning – Resor i medvetandet 1 – 2026-10-31',
  eventNamn: 'Resor i medvetandet 1',
  typ: 'Utbildning',
  ort: 'Arboga',
  startdatum: '2026-10-31',
  slutdatum: '2026-11-01',
  tidKvarTillEvent: '10 veckor och 1 dagar',
  maxPlatser: 20,
  antalAnmalda: 1,
  platserKvar: 19,
  anmaldBelaggning: 0.05,
  bekraftadBelaggning: 0,
  antalNyaAnmalningar: 1,
  antalAnmalningsavgifter: 0,
  antalSlutbetalningar: 0,
  antalSlutbetalningFelande: 1,
  status: 'Planerat',
  eventKey: 'Event-59',
  kursfamilj: 'RIM',
  kursniva: 'Nivå 1',
};

type AgendaRad = { text: string; tid: string | null; meditation: boolean };

/**
 * Eventinnehåll för kombinationen Event "Resor i medvetandet 1" × Eventtyp
 * "Utbildning" (ORDLISTA § Eventinnehåll). Texten är mallens, verbatim.
 */
const EVENTINNEHALL_RIM1_UTBILDNING = {
  etikett: 'Resor i medvetandet 1 · Utbildning',
  tid: 'kl. 10:00 – 17:00',
  pris: '2.500',
  anmalningsavgift: '1000:-',
  resterandeBelopp: '1500:-',
  beskrivning: [
    'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om medvetandet, både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt djupa meditationer. Vi går igenom helt nya medvetandemodeller som faktiskt kan förklara det som tidigare kallats för övernaturligt och paranormalt. I denna utbildning får du själv ta de första stegen på din resa i vårt gemensamma medvetande. Medvetandet är det centrala och du kommer både få göra praktiska övningar tillsammans med massor med konkreta tips, samtidigt som vi förklarar de djupare insikter som ligger bakom våra upplevelser i våra liv.',
    'Du behöver inga förberedande kunskaper eller erfarenheter, men du måste komma med ett mycket öppet sinne. I utbildningen har vi lagt ett starkt fokus på din egen upplevelse och din egen personliga resa i medvetandet. Boken Utanför Verkligheten ligger till grund för nya sätt att se på verkligheten genom att öppna upp ditt sinne för en helt ny värld och verklighet.',
    'Du kommer även att få lära dig om Additiv meditation, en meditationsteknik, som gör det möjligt att ta sig extremt djupt i medvetandet. Med en kombination av tusenårig kunskap och modern teknik kan man uppnå mentala tillstånd som helt klart bryter mot vad vi tror är begränsningar i verkligheten. Vi arbetar med mentala ankare och planerar intentioner. Du får tillfälle att fråga om precis vad som helst, exempelvis om synkronicitet, Akashi arkivet, reinkarnationsprocessen, eller om dina guider. Du kommer att i detalj få reda på hur du planerar och utför dina resor med hjälp av extrem meditation och en välfylld mental verktygslåda. Vi berättar om varför Punktmedvetandet är så viktigt för att uppnå högre mentala tillstånd. Du kommer att få en inblick varifrån kreativitet, inspiration och ökade mentala förmågor kommer.',
  ].join('\n\n'),
  dagEtt: [
    { text: 'Miranon Media', tid: null, meditation: false },
    { text: 'Miranon-Nivåer (lite om)', tid: null, meditation: false },
    { text: 'Additiv Meditation', tid: null, meditation: false },
    { text: 'Meditation: Eken Plus Djup avslappning', tid: '30 min', meditation: true },
    { text: 'Mentala hinder', tid: null, meditation: false },
    { text: 'Filosofi: materialism/idealism', tid: null, meditation: false },
    { text: 'Medvetandemodeller', tid: null, meditation: false },
    { text: 'Kvantfysik', tid: null, meditation: false },
    { text: 'Synkronicitet, fjärrskådning', tid: null, meditation: false },
    { text: 'Meditation: Fåtöljen', tid: '5 min', meditation: true },
    { text: 'Meditation: Kraftfältet Plus', tid: '30 min', meditation: true },
    { text: 'Upplevelser utanför kroppen', tid: null, meditation: false },
    { text: 'Utmaningar utanför kroppen', tid: null, meditation: false },
    { text: 'Meditation: Uthuset', tid: '45 min', meditation: true },
  ] satisfies AgendaRad[],
  dagTva: [
    { text: 'Meditation Fyren', tid: '40 min', meditation: true },
    { text: 'Intention – Föreställning – Skapande', tid: null, meditation: false },
    { text: 'Meditation & fokus', tid: null, meditation: false },
    { text: 'Klicka ut eller sömn', tid: null, meditation: false },
    { text: 'Punktmedvetande', tid: null, meditation: false },
    { text: 'Mentala Ankare / Grundning/Jordning', tid: null, meditation: false },
    { text: 'Meditation Klockan', tid: '40 min', meditation: true },
    { text: 'Ljud & Frekvenser, EEG', tid: null, meditation: false },
    { text: 'Tankeövning', tid: '5 min', meditation: false },
    { text: 'Var observatören', tid: null, meditation: false },
  ] satisfies AgendaRad[],
  // Deltagarinformationens ämnesstycken som INTE är platsbundna.
  forberedelser:
    'Kom som du är! Ta en lugn hemmakväll dagen före utbildningen, men ändra absolut inte på dina mediciner eller vanor. Sluta inte med nikotin eller kaffe strax före utbildningen. Förändringar påverkar din mentala kapacitet negativt. Däremot skall du inte dricka alkohol alls några dagar före. Naturligtvis tillåter vi inte användandet av droger. Förbered dig gärna genom att läsa boken och lyssna på meditationerna Eken & Kraftfältet som finns på Spotify.',
  tagMed:
    'Kudde, filt, ögonmask (förtejpade skidglasögon, så du kan öppna ögonen under masken). Vi har madrasser till alla deltagare. Vi mediterar upp till 45 minuter, så det är bra om du kan ligga bekvämt. Tag med ett anteckningsblock, penna och vattenflaska.',
  rokning:
    'Hela området är rökfritt, med hänsyn till alla andra. Du kommer att få tid att ta en promenad under pauserna.',
  parfym:
    'Under meditationerna ägnar vi oss åt sensorisk deprivation, dvs. minimerar sinnesintryck. Var snäll och använd INTE parfym, parfymerade krämer, eller något som luktar starkt.',
  mat: 'Mat ingår inte, men vi kommer att arrangera hämtmat, och det går bra att ta med matlåda. Vi bjuder på fika.',
  overnattning: 'Ingår inte, maila lotta@outsidereality.se om du vill ha tips på boende.',
  utrustning:
    'Under utbildningen gör vi meditationer med hörlurar, vi har utrustning till alla. Du får använda egna hörlurar om du vill, men de måste då ha en sladd med 3,5 mm anslutning.',
};

/** Platser (ORDLISTA § Plats) — Rönninge seedas vid bygget (beslut 6). Arboga finns INTE. */
type Plats = { namn: string; adress: string; parkering: string; transport: string; klader: string };
const PLATSER_SEED: Record<string, Plats> = {
  Rönninge: {
    namn: 'Rönninge',
    adress: 'Uttringe Hages väg 17, Rönninge',
    parkering:
      'Vi har 15 parkeringsplatser om vi dubbelparkerar. Om dessa är fulla så finns det plats att parkera på andra platser i området, det kostar inget, men du kanske får promenera några minuter.',
    transport:
      'Vi kan hämta och lämna dig på Rönninge Station, boka detta med lotta@outsidereality.se',
    klader:
      'Under utbildningen mediterar vi en hel del, så välj några sköna mjukiskläder. Lätta skor eller tofflor är praktiskt att ha med när man går mellan husen. Ta gärna med skor för promenad och lämpliga ytterkläder. Det kan vara så att vi behöver jorda oss mellan meditationerna.',
  },
};

/* ------------------------------------------------------------------ *
 * BLOCKMODELLEN — beslut 1 (fält med standardvärde), 5 (tomt block
 * utelämnas, aldrig tyst), 6 (texten hör till eventet, kan sparas som
 * platsens standard).
 * ------------------------------------------------------------------ */

type MallId = 'bekraftelse' | 'deltagarinfo';
type Kalla = 'event' | 'eventinnehall' | 'plats';
type BlockId =
  | 'kursnamn'
  | 'datumTid'
  | 'plats'
  | 'pris'
  | 'anmalningsavgift'
  | 'resterande'
  | 'sistaBetalningsdatum'
  | 'beskrivning'
  | 'dagEtt'
  | 'dagTva'
  | 'forberedelser'
  | 'klader'
  | 'tagMed'
  | 'rokning'
  | 'parfym'
  | 'mat'
  | 'overnattning'
  | 'parkering'
  | 'transport'
  | 'utrustning';

type BlockDef = {
  id: BlockId;
  etikett: string;
  kalla: Kalla;
  /** Platsbundet block — kan sparas som platsens standard (beslut 6 C). */
  platsbundet?: boolean;
  /** Låst: hämtas ur eventet och redigeras på eventsidan, inte här. */
  last?: boolean;
  agenda?: boolean;
};

const BLOCK_BEKRAFTELSE: BlockDef[] = [
  { id: 'kursnamn', etikett: 'Utbildning', kalla: 'event', last: true },
  { id: 'datumTid', etikett: 'Datum och tid', kalla: 'event' },
  { id: 'plats', etikett: 'Plats', kalla: 'plats', platsbundet: true },
  { id: 'pris', etikett: 'Pris', kalla: 'eventinnehall' },
  { id: 'anmalningsavgift', etikett: 'Anmälningsavgift', kalla: 'eventinnehall' },
  { id: 'resterande', etikett: 'Resterande belopp', kalla: 'eventinnehall' },
  { id: 'sistaBetalningsdatum', etikett: 'Betalas senast', kalla: 'event' },
  { id: 'beskrivning', etikett: 'Om utbildningen', kalla: 'eventinnehall' },
  { id: 'dagEtt', etikett: 'Innehåll, Dag Ett', kalla: 'eventinnehall', agenda: true },
  { id: 'dagTva', etikett: 'Innehåll, Dag Två', kalla: 'eventinnehall', agenda: true },
];

const BLOCK_DELTAGARINFO: BlockDef[] = [
  { id: 'kursnamn', etikett: 'Utbildning', kalla: 'event', last: true },
  { id: 'datumTid', etikett: 'Datum och tid', kalla: 'event' },
  { id: 'plats', etikett: 'Plats', kalla: 'plats', platsbundet: true },
  { id: 'forberedelser', etikett: 'Förberedelser', kalla: 'eventinnehall' },
  { id: 'klader', etikett: 'Kläder', kalla: 'plats', platsbundet: true },
  { id: 'tagMed', etikett: 'Tag med', kalla: 'eventinnehall' },
  { id: 'rokning', etikett: 'För dig som röker', kalla: 'eventinnehall' },
  { id: 'parfym', etikett: 'Parfym och kosmetika', kalla: 'eventinnehall' },
  { id: 'mat', etikett: 'Mat/fika', kalla: 'eventinnehall' },
  { id: 'overnattning', etikett: 'Övernattning', kalla: 'eventinnehall' },
  { id: 'parkering', etikett: 'Parkering', kalla: 'plats', platsbundet: true },
  { id: 'transport', etikett: 'Transport från tåget', kalla: 'plats', platsbundet: true },
  { id: 'utrustning', etikett: 'Utrustning', kalla: 'eventinnehall' },
];

const MALL_META: Record<MallId, { namn: string; block: BlockDef[]; fastForm: string }> = {
  bekraftelse: {
    namn: 'Bekräftelsebilaga',
    block: BLOCK_BEKRAFTELSE,
    fastForm: 'Logga, Swish/Plusgiro, "Frågor mejla till", hälsning och sidfotens QR-koder',
  },
  deltagarinfo: {
    namn: 'Deltagarinformation',
    block: BLOCK_DELTAGARINFO,
    fastForm: 'Logga, ingress, "Frågor mejla till", "Kom gärna en stund innan" och hälsning',
  },
};

const VECKODAG = new Intl.DateTimeFormat('sv-SE', { weekday: 'long' });
const DAG_MANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
const AR = new Intl.DateTimeFormat('sv-SE', { year: 'numeric' });

/** "lördag–söndag den 31 oktober–1 november 2026" — förlagans form. */
function datumText(event: Event): string | null {
  if (!event.startdatum) return null;
  const start = new Date(`${event.startdatum}T12:00:00`);
  const slut = event.slutdatum ? new Date(`${event.slutdatum}T12:00:00`) : start;
  if (slut.getTime() === start.getTime()) {
    return `${VECKODAG.format(start)} den ${DAG_MANAD.format(start)} ${AR.format(start)}`;
  }
  return `${VECKODAG.format(start)}–${VECKODAG.format(slut)} den ${DAG_MANAD.format(start)}–${DAG_MANAD.format(slut)} ${AR.format(slut)}`;
}

function agendaText(rader: AgendaRad[]): string {
  return rader
    .map((r) => `${r.meditation ? '◆ ' : ''}${r.text}${r.tid ? ` · ${r.tid}` : ''}`)
    .join('\n');
}

/** Standardvärdet per block — ur eventet, Eventinnehållet eller Platsen. `null` = saknas. */
function standardVarde(id: BlockId, event: Event, plats: Plats | undefined): string | null {
  const ei = EVENTINNEHALL_RIM1_UTBILDNING;
  switch (id) {
    case 'kursnamn':
      return event.eventNamn;
    case 'datumTid': {
      const d = datumText(event);
      return d ? `${d}, ${ei.tid}` : null;
    }
    case 'plats':
      return plats?.adress ?? null;
    case 'pris':
      return `${ei.pris} Kr`;
    case 'anmalningsavgift':
      return `${ei.anmalningsavgift}, betalas vid anmälan.`;
    case 'resterande':
      return ei.resterandeBelopp;
    case 'sistaBetalningsdatum':
      return null;
    case 'beskrivning':
      return ei.beskrivning;
    case 'dagEtt':
      return agendaText(ei.dagEtt);
    case 'dagTva':
      return agendaText(ei.dagTva);
    case 'forberedelser':
      return ei.forberedelser;
    case 'klader':
      return plats?.klader ?? null;
    case 'tagMed':
      return ei.tagMed;
    case 'rokning':
      return ei.rokning;
    case 'parfym':
      return ei.parfym;
    case 'mat':
      return ei.mat;
    case 'overnattning':
      return ei.overnattning;
    case 'parkering':
      return plats?.parkering ?? null;
    case 'transport':
      return plats?.transport ?? null;
    case 'utrustning':
      return ei.utrustning;
  }
}

/* ------------------------------------------------------------------ *
 * FORMKONSTANTER — stulna ur DokumentYta.tsx / AtgardsSida.tsx, inte
 * omtolkade (exakt-kopia-startpunkten).
 * ------------------------------------------------------------------ */

const TACKNING_KLASS =
  'inline-flex shrink-0 items-center rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong';
const IKONKNAPP_KLASS = 'size-11 shrink-0 p-0';
const IKON_STORLEK = 16;
const KRYSSRUTA_KLASS =
  'flex size-4 shrink-0 items-center justify-center rounded border border-(--mm-input-border) bg-(--mm-input-bg) group-data-[selected]:border-(--mm-checkbox-selected-border) group-data-[selected]:bg-(--mm-checkbox-selected-bg)';
const GRUPP_KORT_KLASS =
  'flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong';

function KromKnapp({ onPress, label }: { onPress?: () => void; label: string }) {
  const klass =
    'flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted';
  if (onPress) {
    return (
      <Button intent="ghost" aria-label={label} className={klass} onPress={onPress}>
        <ChevronLeft aria-hidden="true" size={26} />
      </Button>
    );
  }
  return (
    <Link to="/mer" aria-label={label} className={klass}>
      <ChevronLeft aria-hidden="true" size={26} />
    </Link>
  );
}

function MetaRad({ delar }: { delar: (string | null)[] }) {
  const text = delar.filter(Boolean).join(' · ');
  if (!text) return null;
  return (
    <span className="w-full min-w-0 truncate text-caption text-text-muted" title={text}>
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * ROTEN
 * ------------------------------------------------------------------ */

export function GenereringsPrototyp() {
  const [vy, setVy] = useQueryState('vy');
  const [mallParam, setMall] = useQueryState('mall');
  const mall: MallId = mallParam === 'deltagarinfo' ? 'deltagarinfo' : 'bekraftelse';

  // Platser lever i minnet under sessionen — "Spara som standard" skapar
  // Arboga-posten här, ingenstans annars.
  const [platser, setPlatser] = useState<Record<string, Plats>>(PLATSER_SEED);

  if (vy === 'generering') {
    return (
      <GenereringsVy
        event={ARBOGA}
        mall={mall}
        platser={platser}
        onSparaPlats={(namn, falt, varde) =>
          setPlatser((p) => ({
            ...p,
            [namn]: {
              ...(p[namn] ?? { namn, adress: '', parkering: '', transport: '', klader: '' }),
              [falt]: varde,
            },
          }))
        }
        onTillbaka={() => {
          void setVy(null);
          void setMall(null);
        }}
      />
    );
  }

  return (
    <ListaVy
      event={ARBOGA}
      onOppnaMall={(m) => {
        void setMall(m);
        void setVy('generering');
      }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * LISTA-VYN — kopia av DokumentYta i eventläget
 * ------------------------------------------------------------------ */

type ListaTyp = 'alla' | 'bilaga' | 'mall' | 'generator';
const LISTA_FILTER: { key: ListaTyp; label: string }[] = [
  { key: 'alla', label: 'Alla' },
  { key: 'bilaga', label: 'Bilagor' },
  { key: 'mall', label: 'Mallar' },
  { key: 'generator', label: 'Kvitton' },
];

const MALLAR: { id: MallId; namn: string; fyllerI: string[] }[] = [
  {
    id: 'bekraftelse',
    namn: 'Bekräftelsebilaga',
    fyllerI: ['Datum', 'Plats', 'Pris', 'Betalning', 'Innehåll'],
  },
  { id: 'deltagarinfo', namn: 'Deltagarinformation', fyllerI: ['Datum', 'Plats', 'Praktisk info'] },
];

function ListaVy({ event, onOppnaMall }: { event: Event; onOppnaMall: (m: MallId) => void }) {
  const [filter, setFilter] = useQueryState('typ');
  const aktivtFilter: ListaTyp =
    filter === 'bilaga' || filter === 'mall' || filter === 'generator' ? filter : 'alla';
  const visaBilagor = aktivtFilter === 'alla' || aktivtFilter === 'bilaga';
  const visaMallar = aktivtFilter === 'alla' || aktivtFilter === 'mall';
  const visaGeneratorer = aktivtFilter === 'alla' || aktivtFilter === 'generator';

  return (
    <div className="flex flex-col gap-4" data-testid="dokument-yta">
      <KromKnapp label="Tillbaka till Mer" />
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Dokument</h1>
      </header>

      <EventValjare
        form="fristaende"
        valtEventId={event.id}
        valtEvent={event}
        // Prototypen är låst till Arboga — frågan gäller det eventet.
        onByte={() => undefined}
        gemensamtAlternativ={{
          etikett: 'Delade dokument',
          ikon: <Files aria-hidden="true" size={18} className="shrink-0" />,
          onValj: () => undefined,
        }}
      />

      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-3">
          <div data-testid="grupp-kort" className={GRUPP_KORT_KLASS}>
            <ToggleButtonGroup
              label="Filtrera på typ"
              spread
              selectedKey={aktivtFilter}
              onSelectionChange={(key) => void setFilter(key === 'alla' ? null : key)}
            >
              {LISTA_FILTER.map((f) => (
                <ToggleButton key={f.key} id={f.key} size="sm" className="min-h-11">
                  {f.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <ul
              data-testid="dokument-lista"
              className="divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong"
            >
              {visaMallar &&
                MALLAR.map((m) => (
                  <li key={m.id}>
                    <div data-testid="dokument-mall" className="flex items-start gap-3 py-3">
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <span
                          className="w-full min-w-0 truncate font-medium text-body"
                          title={m.namn}
                        >
                          {m.namn}
                        </span>
                        <span className={TACKNING_KLASS}>Detta event</span>
                        <MetaRad delar={[`Fyller i ${m.fyllerI.join(', ').toLowerCase()}`]} />
                      </span>
                      <span className="flex shrink-0 items-center gap-0.5">
                        <Button
                          intent="primary"
                          emphasis="subtle"
                          size="sm"
                          className={IKONKNAPP_KLASS}
                          aria-label={`Skapa ${m.namn}`}
                          onPress={() => onOppnaMall(m.id)}
                        >
                          <ChevronRight aria-hidden="true" size={IKON_STORLEK} />
                        </Button>
                      </span>
                    </div>
                  </li>
                ))}
              {visaGeneratorer && (
                <li>
                  <div data-testid="dokument-generator" className="flex items-start gap-3 py-3">
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <span className="w-full min-w-0 truncate font-medium text-body">
                        Betalningskvitto
                      </span>
                      <span className={TACKNING_KLASS}>Detta event</span>
                      <MetaRad
                        delar={['Byggs ur namn, e-post, betalt belopp, betaldatum, eventnamn']}
                      />
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      <Button
                        intent="primary"
                        emphasis="subtle"
                        size="sm"
                        className={IKONKNAPP_KLASS}
                        aria-label="Öppna Betalningskvitto"
                        onPress={() => undefined}
                      >
                        <ChevronRight aria-hidden="true" size={IKON_STORLEK} />
                      </Button>
                    </span>
                  </div>
                </li>
              )}
              {visaBilagor && !visaMallar && !visaGeneratorer && (
                <li className="py-3 text-small text-text-muted">
                  Inga bilagor för det här eventet än.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>

      <div data-testid="ladda-upp-ny-fil">
        {/* Inert i prototypen — uppladdning är utanför frågan. Samma utseende
            som skarpa så lista-vyn förblir en exakt kopia. */}
        <Button intent="primary" onPress={() => undefined}>
          <Upload aria-hidden="true" size={16} className="shrink-0" />
          Ladda upp ny fil
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * GENERERINGSVYN — det nya mellanledet
 * ------------------------------------------------------------------ */

type Override = { varde: string };

function GenereringsVy({
  event,
  mall,
  platser,
  onSparaPlats,
  onTillbaka,
}: {
  event: Event;
  mall: MallId;
  platser: Record<string, Plats>;
  onSparaPlats: (platsNamn: string, falt: keyof Omit<Plats, 'namn'>, varde: string) => void;
  onTillbaka: () => void;
}) {
  const meta = MALL_META[mall];
  const plats = event.ort ? platser[event.ort] : undefined;
  // Eventets egna texter (beslut 6 A) — lever i minnet.
  const [overrides, setOverrides] = useState<Partial<Record<BlockId, Override>>>({});
  const [oppet, setOppet] = useState<BlockId | null>(null);
  const [skapad, setSkapad] = useState<{ antal: number; utelamnade: string[] } | null>(null);

  const rader = useMemo(
    () =>
      meta.block.map((b) => {
        const standard = standardVarde(b.id, event, plats);
        const egen = overrides[b.id]?.varde ?? null;
        const varde = egen ?? standard;
        return { def: b, standard, egen, varde, tomt: !varde?.trim() };
      }),
    [meta.block, event, plats, overrides],
  );
  const utelamnade = rader.filter((r) => r.tomt);

  const kallaText = (r: (typeof rader)[number]): string => {
    if (r.egen != null) return 'Egen text för detta event';
    if (r.tomt) return 'Saknas';
    switch (r.def.kalla) {
      case 'event':
        return 'Från eventet';
      case 'eventinnehall':
        return `Standard · ${EVENTINNEHALL_RIM1_UTBILDNING.etikett}`;
      case 'plats':
        return `Standard · Plats ${event.ort}`;
    }
  };

  const platsFalt = (id: BlockId): keyof Omit<Plats, 'namn'> | null => {
    switch (id) {
      case 'plats':
        return 'adress';
      case 'parkering':
        return 'parkering';
      case 'transport':
        return 'transport';
      case 'klader':
        return 'klader';
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4" data-testid="generering-vy">
      <KromKnapp label="Tillbaka till Dokument" onPress={onTillbaka} />
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">{meta.namn}</h1>
        <p className="text-small text-text-muted">
          {[event.ort, event.typ, event.eventNamn, datumText(event)].filter(Boolean).join(' · ')}
        </p>
      </header>

      {/* BESLUT 5: tomma block utelämnas — men aldrig tyst. Listan står FÖRE
          knappen, så Lotta ser vad som inte kommer med innan hon skapar. */}
      {utelamnade.length > 0 ? (
        <MessageBox intent="warning">
          <span className="flex flex-col gap-2">
            <span>
              {utelamnade.length === 1
                ? 'Ett block saknar text och utelämnas ur PDF:en:'
                : `${utelamnade.length} block saknar text och utelämnas ur PDF:en:`}
            </span>
            <ul className="flex flex-col gap-1">
              {utelamnade.map((r) => (
                <li key={r.def.id} className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.def.etikett}</span>
                  <Button
                    intent="primary"
                    emphasis="subtle"
                    size="sm"
                    onPress={() => setOppet(r.def.id)}
                  >
                    Skriv in
                  </Button>
                </li>
              ))}
            </ul>
          </span>
        </MessageBox>
      ) : (
        <MessageBox intent="success">Alla block har text — inget utelämnas.</MessageBox>
      )}

      <section className="flex flex-col gap-3">
        <div className={GRUPP_KORT_KLASS}>
          <ul className="divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong">
            {rader.map((r) => {
              const arOppet = oppet === r.def.id;
              const pf = platsFalt(r.def.id);
              return (
                <li key={r.def.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <span className="w-full min-w-0 truncate font-medium text-body">
                        {r.def.etikett}
                      </span>
                      <span
                        className={`${TACKNING_KLASS} ${
                          r.tomt ? 'text-(--mm-messagebox-warning-border)' : ''
                        }`}
                      >
                        {kallaText(r)}
                      </span>
                      {!arOppet && !r.tomt && (
                        <span
                          className={`w-full min-w-0 text-caption text-text-muted ${
                            r.def.agenda ? 'whitespace-pre-line' : 'line-clamp-2'
                          }`}
                        >
                          {r.varde}
                        </span>
                      )}
                    </span>
                    {!r.def.last && (
                      <Button
                        intent="primary"
                        emphasis="subtle"
                        size="sm"
                        className={IKONKNAPP_KLASS}
                        aria-label={arOppet ? `Stäng ${r.def.etikett}` : `Ändra ${r.def.etikett}`}
                        onPress={() => setOppet(arOppet ? null : r.def.id)}
                      >
                        {arOppet ? (
                          <Check aria-hidden="true" size={IKON_STORLEK} />
                        ) : (
                          <FileText aria-hidden="true" size={IKON_STORLEK} />
                        )}
                      </Button>
                    )}
                  </div>

                  {arOppet && (
                    <BlockEditor
                      etikett={r.def.etikett}
                      varde={r.varde ?? ''}
                      harStandard={r.standard != null}
                      arEgen={r.egen != null}
                      agenda={r.def.agenda === true}
                      platsNamn={pf && event.ort ? event.ort : null}
                      platsHarPost={plats != null}
                      onAndra={(v) => setOverrides((o) => ({ ...o, [r.def.id]: { varde: v } }))}
                      onAterstall={() =>
                        setOverrides((o) => {
                          const n = { ...o };
                          delete n[r.def.id];
                          return n;
                        })
                      }
                      onSparaSomStandard={
                        pf && event.ort
                          ? () => {
                              onSparaPlats(event.ort as string, pf, r.varde ?? '');
                              setOverrides((o) => {
                                const n = { ...o };
                                delete n[r.def.id];
                                return n;
                              });
                            }
                          : undefined
                      }
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-caption text-text-muted">Fast form, alltid med: {meta.fastForm}.</p>
        </div>
      </section>

      {skapad && (
        <MessageBox intent="info">
          Prototyp — här skapas PDF:en med {skapad.antal} block
          {skapad.utelamnade.length > 0 ? ` (utelämnat: ${skapad.utelamnade.join(', ')})` : ''}.
          Ingen fil genereras i prototypen.
        </MessageBox>
      )}

      <Button
        intent="primary"
        onPress={() =>
          setSkapad({
            antal: rader.length - utelamnade.length,
            utelamnade: utelamnade.map((r) => r.def.etikett),
          })
        }
      >
        <FileText aria-hidden="true" size={16} className="shrink-0" />
        Skapa {meta.namn.toLowerCase()}
      </Button>
    </div>
  );
}

/**
 * Blockets redigerare. T154-sonden bor i ledtexten längst ner: ett block
 * med EGEN text följer inte standarden — ändras standarden senare påverkas
 * inte eventet, och dokumentet markeras inte inaktuellt av den ändringen.
 * Ett block som FÖLJER standarden markeras däremot inaktuellt när
 * standarden ändras (beslut 7). Det är förslaget prototypen ställer.
 */
function BlockEditor({
  etikett,
  varde,
  harStandard,
  arEgen,
  agenda,
  platsNamn,
  platsHarPost,
  onAndra,
  onAterstall,
  onSparaSomStandard,
}: {
  etikett: string;
  varde: string;
  harStandard: boolean;
  arEgen: boolean;
  agenda: boolean;
  platsNamn: string | null;
  platsHarPost: boolean;
  onAndra: (v: string) => void;
  onAterstall: () => void;
  onSparaSomStandard?: () => void;
}) {
  const [sparaSomStandard, setSparaSomStandard] = useState(false);

  return (
    <div className="mt-3 flex flex-col gap-3">
      <TextArea
        label={etikett}
        hideLabel
        value={varde}
        onChange={onAndra}
        rows={agenda ? 10 : 5}
        description={
          agenda
            ? 'En rad per punkt. ◆ markerar meditation (färgas i PDF:en), tid efter " · ".'
            : undefined
        }
      />

      {platsNamn && onSparaSomStandard && (
        <Checkbox
          isSelected={sparaSomStandard}
          onChange={(v) => {
            setSparaSomStandard(v);
            if (v) onSparaSomStandard();
          }}
          className="group flex cursor-pointer items-center gap-2 text-small"
        >
          <span className={KRYSSRUTA_KLASS}>
            <Check
              aria-hidden="true"
              size={12}
              className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
            />
          </span>
          <span className="text-text-secondary">
            {platsHarPost
              ? `Spara som standard för ${platsNamn}`
              : `Spara som standard för ${platsNamn} (skapar platsen)`}
          </span>
        </Checkbox>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-text-muted">
          {arEgen
            ? 'Egen text — följer inte standarden. Ändras standarden senare påverkas inte detta event.'
            : harStandard
              ? 'Följer standarden. Ändras den markeras dokumentet som inaktuellt.'
              : 'Ingen standard finns. Texten gäller bara detta event om du inte sparar den som standard.'}
        </p>
        {arEgen && harStandard && (
          <Button intent="secondary" emphasis="outline" size="sm" onPress={onAterstall}>
            Återgå till standard
          </Button>
        )}
      </div>
    </div>
  );
}
