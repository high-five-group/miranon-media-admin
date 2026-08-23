/**
 * [PROTOTYPE, S108] Genereringsvyn — KONVERGENS, NU MOT RIKTIG DATA
 * (TASK-309.6, ADR-125).
 *
 * FRÅGAN PROTOTYPEN BESVARADE (S108 Del 2 § I, Marcus 2026-08-20):
 *
 *   "Vad ser Lotta när hon genererar bekräftelsebilagan för Arboga-eventet
 *    31 oktober?"
 *
 * Den stängde `T153` (modellen prövad mot fler dokument än två) och `T154`
 * (logiska luckan mellan beslut 6 och 7 — vad inaktuell-markeringen betyder
 * när ett event skrivit över ett block). Formen var DIREKT KONVERGENS
 * (Marcus 2026-08-20): en variant, ingen divergensfas, itererad i
 * dev-servern tills han var nöjd. Promoveringskontraktet (ADR-103) gäller —
 * DENNA skiva byter bara datavägarna, formen är oförändrad mot det
 * godkända varvet (Marcus *"Nu är jag helt nöjd"*).
 *
 * HEMVIST: underform A — monterad på den skarpa routen `/mer/dokument` bakom
 * `?variant=a`, DEV-grindad i routen (ADR-044/ADR-103 B3: EN läspunkt).
 * `?vy=lista|generering` + `?mall=bekraftelse|deltagarinfo` adresserar läget
 * så en URL kan delas. `?event=` (delad med `DokumentYta.tsx`, samma
 * queryKey) väljer eventet.
 *
 * DATA ÄR NU RIKTIG (TASK-309.6): eventet kommer ur `EventValjare`
 * (`dataSource.fetchEvents()`), och underlaget (Eventinnehåll/Platser/
 * agenda/eventets egna kopior) ur `getDocumentSources` — ARBOGA-fixturen,
 * `PLATSER_SEED` och `EVENTINNEHALL`-konstanten (som bar allt detta i
 * minnet) är RIVNA. Block-dialogens Spara skriver DIREKT mot skiva 2:s
 * skrivvägar (`useSaveEventText`/`useGenereraEventBilaga`s
 * platsstandard-gren) — inget lokalt `overrides`-state längre; `sources`
 * (React Query-cachen) ÄR sanningskällan, en lyckad skrivning invaliderar
 * den och nästa render läser det som faktiskt sparades.
 *
 * DOKUMENTET ÄR DET RIKTIGA: "Skapa" anropar `generate-event-attachment`
 * (via adaptern, `useGenereraEventBilaga`) som renderar server-side
 * (`_shared/mall-render.ts`, Eta + DocRaptor) och persisterar en Bilagor-
 * rad — ingen HTML byggs längre i klienten (`sjalvbarande.ts` riven,
 * AC #6). Det är vad Lotta ser — inte en ruta som säger att en PDF hade
 * skapats.
 *
 * LISTA-VYN är en kopia av Dokument-ytans form i eventläget (`DokumentYta.tsx`
 * § DokumentLista) — startpunkten var EXAKT kopia (T66), därför är
 * klasserna stulna rad för rad, inte omtolkade. Skillnaden mot skarpa: två
 * mallrader i stället för en, och mallradens knapp leder till genereringsvyn
 * i stället för direkt till PDF:en. Denna skiva byter bara vilket event
 * listan/knapparna pekar på (eventväljaren, riktig) — den skarpa
 * DokumentYta.tsx-listans EGNA komponenter (Mall-badge, INAKTUELL, Skapa om)
 * byggs INTE in i denna kopia (skiva 7 ersätter kopian helt).
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Files,
  FileText,
  Loader2,
  Pencil,
  Upload,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useMemo, useRef, useState } from 'react';
import {
  type AgendaRad,
  BlockDialog,
  DatumEnkel,
  DIALOG_ANKARE,
  DIALOG_PANEL_KLASS,
  IKON_STORLEK,
  Kryss,
  type Override,
  type Rad,
} from '@/components/dokument/BlockDialog';
import {
  type BlockDef,
  type BlockId,
  GRUPPER,
  INFORUTA_IDN,
  type MallId,
} from '@/components/dokument/blockDefinitioner';
import { datumSpannText } from '@/components/events/detail/datumSpann';
import { eventName } from '@/components/events/EventCard';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { useForhandsgranskaBilaga } from '@/data/mutations/useForhandsgranskaBilaga';
import { useGenereraEventBilaga } from '@/data/mutations/useGenereraEventBilaga';
import { useSaveEventText } from '@/data/mutations/useSaveEventText';
import { useDocumentSources } from '@/data/queries/useDocumentSources';
import { useDataSource } from '@/data/useDataSource';
import type { DocumentSources } from '@/domain/models/DocumentSources';
import type { Event } from '@/domain/models/Event';
import type { EventTextFalt, PlatsFalt } from '@/domain/schemas';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/queries/keys';

/* ------------------------------------------------------------------ *
 * BLOCKMODELLEN — beslut 1 (fält med standardvärde), 5 (tomt block
 * utelämnas, aldrig tyst), 6 (texten hör till eventet, kan sparas som
 * platsens standard). RIKTIG DATA (TASK-309.6): fixturerna
 * (`ARBOGA`/`EVENTINNEHALL`/`PLATSER_SEED`) är RIVNA — eventet kommer ur
 * `EventValjare` och underlaget ur `getDocumentSources` (adaptern),
 * `useDocumentSources`-hooken.
 * ------------------------------------------------------------------ */

// BlockId/BlockDef/Kalla/Grupp/INFORUTA_BAS/GRUPPER/INFORUTA_IDN UTBRUTNA
// (TASK-309.7, ADR-125 § 7) till `@/components/dokument/blockDefinitioner`
// — Mer-sidans Eventinnehåll-/Platser-ytor delar samma blockkarta, se den
// modulens filhuvud för hela motiveringen. Importerade ovan.

const MALL_META: Record<MallId, { namn: string }> = {
  bekraftelse: { namn: 'Bekräftelsebilaga' },
  deltagarinfo: { namn: 'Deltagarinformation' },
};

/**
 * BlockId → `DocumentSourcesKopior`/`EventTextFalt`-nyckeln blockets
 * standard/kopia-par bor under (TASK-309.6, ADR-125 § 2) — SAMMA nyckel
 * används för LÄSNING (`sources.kopior[nyckel]`) och SKRIVNING
 * (`useSaveEventText`s `falt: { [nyckel]: värde }`), en enda karta så de
 * två aldrig kan glida isär. `'rubrik'` (låst, härlett ur eventet) och
 * `'dagEtt'`/`'dagTva'` (agenda, egen väg) saknas MEDVETET — de har ingen
 * `kopior`-nyckel. `'datumTid'` mappar till `'tid'` — se `byggRad`s
 * dokblock för varför blockets VÄRDE ändå är en kombinerad, härledd sträng.
 */
const BLOCK_TILL_FALT: Partial<Record<BlockId, EventTextFalt>> = {
  datumTid: 'tid',
  plats: 'adress',
  tid: 'tid',
  pris: 'pris',
  anmalningsavgift: 'anmalningsavgift',
  resterande: 'resterandeBelopp',
  sistaBetalningsdag: 'sistaBetalningsdag',
  beskrivning: 'beskrivning',
  forberedelser: 'forberedelser',
  klader: 'klader',
  tagMed: 'tagMed',
  rokning: 'rokning',
  parfym: 'parfym',
  mat: 'mat',
  overnattning: 'overnattning',
  parkering: 'parkering',
  transport: 'transport',
  utrustning: 'utrustning',
};

const DAG_MANAD = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long' });
const AR = new Intl.DateTimeFormat('sv-SE', { year: 'numeric' });

/**
 * Bygger en `Rad` DIREKT ur `DocumentSources` (TASK-309.6) — inget lokalt
 * `overrides`-state längre: `sources.kopior[nyckel].kopia` ÄR den persisterade
 * egna texten (eller `null` om eventet följer standarden), servern äger
 * fallback-regeln (`kopia ?? standard`, ADR-125 § 4 "en renderare — samma
 * regel FÅR inte tolkas på två ställen").
 *
 * `'rubrik'` (låst, `def.last`) härleds ur `event.eventNamn` precis som
 * fixtur-prototypen gjorde — den ändras på eventsidan, aldrig här, och har
 * ingen `kopior`-nyckel.
 *
 * `'datumTid'` ÄR SÄRSKILT: blockets VÄRDE är en HÄRLEDD, kombinerad sträng
 * (datumspannet, strukturellt fast ur eventets Start-/Slutdatum, plus den
 * fria "Tid"-texten) — SAMMA kombination servern gör
 * (`_shared/mall-data.ts`s `byggDatumTidText`), men klienten återanvänder
 * husets EGEN datumformatterare (`datumSpannText`, redan i bruk i denna
 * fils header) i stället för att duplicera mall-data.ts:s handrullade
 * svenska datumtabell — raden här är en LIST-/DIALOG-VISNING, aldrig det
 * som faktiskt hashas eller skrivs till PDF:en.
 *
 * DET REDIGERBARA I 'datumTid'-blockets dialog är däremot BARA "Tid"-
 * fragmentet (`kopior.tid`, det enda skrivbara fältet — `EventTextFalt`
 * saknar en "hela datum-och-tid-strängen"-nyckel) — datumet sätts på
 * eventet, inte här. `rad.tomt` speglar det: en bilaga UTAN egen Tid-text
 * är INTE "utelämnad" (datumspannet finns ändå, PDF:en blir fullt giltig)
 * — bara total avsaknad av ett beräkningsbart datumspann räknas som tomt.
 */
function byggRad(def: BlockDef, event: Event, sources: DocumentSources, mall: MallId): Rad {
  if (def.agenda) {
    const par = def.id === 'dagEtt' ? sources.agenda.dag1 : sources.agenda.dag2;
    const agenda = par.kopia ?? par.standard;
    const ifyllda = agenda.filter((r) => r.text.trim());
    return {
      def,
      standardText: null,
      standardAgenda: par.standard,
      egen: par.kopia ? { typ: 'agenda', rader: par.kopia } : null,
      text: null,
      agenda: ifyllda,
      tomt: ifyllda.length === 0,
    };
  }

  if (def.id === 'rubrik') {
    const text = event.eventNamn
      ? mall === 'bekraftelse'
        ? `Utbildning: ${event.eventNamn}`
        : `Välkommen till ${event.eventNamn}!`
      : null;
    return {
      def,
      standardText: text,
      standardAgenda: null,
      egen: null,
      text,
      agenda: null,
      tomt: !text,
    };
  }

  if (def.id === 'datumTid') {
    const par = sources.kopior.tid;
    const tidText = par.kopia ?? par.standard;
    const spann = datumSpannText(event);
    const kombinerat = spann
      ? tidText?.trim()
        ? `${spann}, ${tidText}`
        : spann
      : tidText?.trim()
        ? tidText
        : null;
    return {
      def,
      // `standardText` bär BARA Tid-fragmentets standard (dialogens
      // "revert till standard"-jämförelse, se BlockDialog.tsx) — INTE det
      // kombinerade värdet, som aldrig är vad Lotta skriver in.
      standardText: par.standard,
      standardAgenda: null,
      egen: par.kopia != null ? { typ: 'text', varde: par.kopia } : null,
      // `text` (blockdialogens redigerade/visade värde) är Tid-fragmentet —
      // `varderad` (listans/radens visning) räknar om `kombinerat` separat.
      text: tidText,
      agenda: null,
      tomt: !kombinerat,
    };
  }

  const faltKey = BLOCK_TILL_FALT[def.id];
  if (!faltKey) {
    // Strukturellt oåtkodligt (varje icke-agenda/rubrik/datumTid-block i
    // GRUPPER har en BLOCK_TILL_FALT-nyckel) — defensiv exhaustiveness,
    // ingen BlockDef i GRUPPER når hit i praktiken.
    return {
      def,
      standardText: null,
      standardAgenda: null,
      egen: null,
      text: null,
      agenda: null,
      tomt: true,
    };
  }
  const par = sources.kopior[faltKey];
  const text = par.kopia ?? par.standard;
  return {
    def,
    standardText: par.standard,
    standardAgenda: null,
    egen: par.kopia != null ? { typ: 'text', varde: par.kopia } : null,
    text,
    agenda: null,
    tomt: !text?.trim(),
  };
}

/** Gruppens rader som redigeras via DIALOG. Två slag faller bort, och båda
 *  måste stå här explicit: de låsta ändras på eventsidan, och Inforutans bor i
 *  sektionsmorfen. Filtret bar först bara `last` — på antagandet att Inforutan
 *  ändå har för få rader för att nå tröskeln. Fel: i bekräftelsebilagan har
 *  den SEX olåsta (pris, anmälningsavgift, resterande, sista betalningsdag
 *  utöver basen), så gruppens ingång slog på i den godkända bilagan. Mätt och
 *  rättat, varv 14 — ett antagande om antal är inget filter. */
function dialogRader(rader: Rad[]): Rad[] {
  return rader.filter((r) => !r.def.last && !INFORUTA_IDN.has(r.def.id));
}

// NAV_TROSKEL UTBRUTEN (TASK-309.7) till `@/components/dokument/BlockDialog`.
// `datumUtanAr` UTBRUTEN dit i samma skiva men INTE längre importerad här
// (TASK-309.6): den bodde bara i `renderaDokument` (riven, AC #6 —
// mall-ifyllnaden sker nu server-side, `_shared/mall-data.ts`).

/** "10 oktober 2026" — listans visning av ett datumblock. */
function datumMedAr(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : `${DAG_MANAD.format(d)} ${AR.format(d)}`;
}

/** "plats och sista betalningsdag" — naturligt språk, inga listpunkter i en mening. */
function ochLista(delar: string[]): string {
  if (delar.length <= 1) return delar.join('');
  return `${delar.slice(0, -1).join(', ')} och ${delar[delar.length - 1]}`;
}

/** Meningens första ord med versal, resten som de står — etiketter är vanliga substantiv. */
function meningsStart(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------ *
 * FORMKONSTANTER — stulna ur DokumentYta.tsx / AtgardsSida.tsx, inte
 * omtolkade (exakt-kopia-startpunkten).
 * ------------------------------------------------------------------ */

const TACKNING_KLASS =
  'inline-flex shrink-0 items-center rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong';
const IKONKNAPP_KLASS = 'size-11 shrink-0 p-0';
// BLADDRAKNAPP_KLASS/IKON_STORLEK/KRYSSRUTA_KLASS UTBRUTNA (TASK-309.7)
// till `@/components/dokument/BlockDialog` — importerade ovan (KRYSSRUTA_KLASS
// är intern där, se `Kryss`).
const GRUPP_KORT_KLASS =
  'flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong';
const LISTA_KLASS =
  'divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:border-border-strong';

/**
 * Husets sidkrom-knapp — EXAKT `DokumentYta`s klasser. Knappvarianten är en rå
 * `<button>` med samma klasser, inte `Button`-primitiven: dess egna
 * `min-h`/`px`/`gap` hade ändrat storleken (Marcus 2026-08-21: "fel storlek").
 */
function KromKnapp({ onPress, label }: { onPress?: () => void; label: string }) {
  const klass =
    'flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted';
  if (onPress) {
    return (
      <button type="button" aria-label={label} className={klass} onClick={onPress}>
        <ChevronLeft aria-hidden="true" size={26} />
      </button>
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

// Kryss UTBRUTEN (TASK-309.7) till `@/components/dokument/BlockDialog` —
// importerad ovan.

/* ------------------------------------------------------------------ *
 * ROTEN
 * ------------------------------------------------------------------ */

export function GenereringsPrototyp() {
  const [vy, setVy] = useQueryState('vy');
  const [mallParam, setMall] = useQueryState('mall');
  const mall: MallId = mallParam === 'deltagarinfo' ? 'deltagarinfo' : 'bekraftelse';
  // [TASK-309.6] Delad queryKey med `DokumentYta.tsx`s `?event=` — samma
  // val följer med om Lotta växlar `?variant=a` av/på.
  const [eventId, setEventId] = useQueryState('event');

  const dataSource = useDataSource();
  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const valtEvent = eventsQuery.data?.find((e) => e.id === eventId);

  // Genereringsvyn kräver ett RIKTIGT event — en direktlänk till
  // `?vy=generering` utan (eller med ett okänt) `?event=` faller tillbaka
  // till listvyn i stället för att krascha på ett odefinierat event.
  if (vy === 'generering' && valtEvent) {
    return (
      <GenereringsVy
        key={`${valtEvent.id}-${mall}`}
        event={valtEvent}
        mall={mall}
        onTillbaka={() => {
          void setVy(null);
          void setMall(null);
        }}
      />
    );
  }

  return (
    <ListaVy
      event={valtEvent}
      onByte={(id) => void setEventId(id)}
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

function ListaVy({
  event,
  onByte,
  onOppnaMall,
}: {
  /** [TASK-309.6] `undefined` = inget event valt ÄN (eventväljarens tomma
   *  startläge, eller ett `?event=`-värde som inte matchar något laddat
   *  event) — katalogen (MALLAR/GENERATORER) kräver ett riktigt event att
   *  peka generering mot, se villkoret nedan. */
  event: Event | undefined;
  onByte: (eventId: string) => void;
  onOppnaMall: (m: MallId) => void;
}) {
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
        valtEventId={event?.id}
        valtEvent={event}
        onByte={onByte}
        gemensamtAlternativ={{
          etikett: 'Delade dokument',
          ikon: <Files aria-hidden="true" size={18} className="shrink-0" />,
          onValj: () => undefined,
        }}
      />

      {event ? (
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
              <ul data-testid="dokument-lista" className={LISTA_KLASS}>
                {visaMallar &&
                  MALLAR.map((m) => (
                    <li key={m.id}>
                      <div data-testid="dokument-mall" className="flex items-center gap-3 py-3">
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
                    <div data-testid="dokument-generator" className="flex items-center gap-3 py-3">
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
      ) : (
        // [TASK-309.6] Katalogen (MALLAR/GENERATORER) pekar generering mot
        // ETT event — utan ett valt finns inget att peka mot. Prototypens
        // ListaVy har aldrig implementerat räckviddsläget (`gemensamtAlternativ`
        // ovan är en no-op, oförändrat sedan fixtur-varvet).
        <p className="px-1 text-small text-text-muted">
          Välj ett event ovan för att se dess mallar.
        </p>
      )}

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
 *
 * FORMEN (varv 5, 2026-08-21) är en SYNTES av husets och branschens svar:
 *
 *   · Husets läsyte-grammatik (DetaljGrupp.tsx, S73-facit): rubriken står
 *     UTANFÖR det tonala kortet, indragen till inner-inset (px-4); kortet är
 *     LISTPOSTEN (`bg-bg-muted border-transparent`, aldrig en behållare i en
 *     listpost) med divide-y mellan raderna; etiketten dämpad, värdet
 *     primärt. Inga piller för härkomst — TACKNING_KLASS är kategori-
 *     grammatik (RackviddBadge.tsx), inte status, och osynlig mot bg-muted.
 *   · Branschens summary-list på smal skärm (GOV.UK < 641 px, M3 compact,
 *     HIG; docs/research/mall-ifyllnadsvyer-branschmonster-2026-08-21.md):
 *     etikett och värde STAPLADE, saknat värde som handlingslänk i
 *     värdeplatsen, härkomst som sekundärtext eller tyst, EN handling per
 *     rad, redigering i egen yta med Spara-verb. Ingen chip, inget rött.
 *
 * Det NYA mönstret (Marcus 2026-08-21: "behöver vi etablera något nytt så
 * gör vi det"): en TVÅRADS-rad — etikett (text-small, dämpad) över värdet
 * (text-body, alltid exakt en rad, trunkerad) — som LEDER VIDARE (chevron,
 * DESIGN-SYSTEM-SPEC §14: "chevron betyder att raden leder vidare") till
 * blockets egen yta. Hela raden är knappen, i husets handlingsrads-platta
 * (`-mx-2 rounded-lg px-2 hover:bg-bg-emphasized`, HandlingsRad.tsx).
 * Värde-höger (eventsidans form) prövades och föll: datum, adress och
 * rubrik trunkerades till oläslighet på 390 px. Alla rader har samma
 * höjd per konstruktion — två led, aldrig fler, aldrig färre.
 * ------------------------------------------------------------------ */

/*
 * `url` bär den färdiga PDF:en. Den ligger i resultatet och inte i en egen
 * state-variabel därför att de två alltid ska bytas SAMTIDIGT: ett nytt
 * resultat utan ny URL hade lämnat en "Öppna"-knapp som pekar på förra
 * dokumentet — precis den sortens tysta fel som inte syns förrän någon
 * öppnar fel bilaga.
 *
 * `skarpt` skiljer granskning från skapande. Texten "ligger nu bland
 * eventets dokument" är osann om en granskning, och ett halvsant
 * framgångsbesked är värre än inget.
 */
type Resultat =
  | {
      typ: 'klar';
      skarpt: boolean;
      url: string;
      /** Webbläsaren stoppade den automatiska öppningen — knappen bär vägen in. */
      blockerad: boolean;
      utelamnade: string[];
      sparade: string[];
    }
  | { typ: 'fel'; text: string };

// INGEN bakgrundstint vid hover — husets divide-y-grammatik (AktivitetsHistorik
// § radKlass, Marcus 2026-08-15: tinten skar sig mot separatorlinjerna; samma
// fynd igen 2026-08-21). Affordansen är personlistans: underline på värdet via
// group, chevronen bär resten.
const RAD_KLASS = 'group flex w-full items-center gap-3 py-3 text-left';
const KORT_KLASS =
  'divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

/**
 * INFORUTANS ÄNDRA-LÄGE — sektionsmorf, ingen dialog.
 *
 * Formen är eventsidans, verifierad mot disk OCH mot renderad yta
 * (`OmEventet.tsx` + `DetaljGrupp.tsx`, mätt 2026-08-21 på 390x844):
 * grupprubrik utanför kortet, rader med `divide-y`, och en `Ändra`-rad i
 * kortbotten som byter HELA sektionen till fält och ersätts av
 * Spara/Avbryt på samma plats. Där mätte läsläge och ändraläge IDENTISK
 * geometri — 279 px, radhöjder 49/49/49/48.
 *
 * MEN `RedigeringsRad`s trekolumnsform (etikett · "ändrar från" · fält)
 * ÄR INTE KOPIERAD, och det är ett medvetet avsteg: på 390 px klämmer dess
 * `w-60`-slot nuvarande-värdet till oläslighet — uppmätt renderade
 * eventsidan "Ut…", "ZZ…", "2.", "P." för Typ/Ort/Datum/Status. Inforutans
 * värden (adress, datumspann, rubrik) är längre än eventsidans, så samma
 * form hade blivit värre här. Morfen staplar i stället etikett över fält i
 * radens egen 72 px-grammatik — samma sak GOV.UK:s summary list gör under
 * 641 px.
 *
 * Sektionen är rätt yta för de KORTA fälten. Löptexten och agendorna
 * behåller sin dialog: de ryms inte i en rad, och en sektionsmorf som
 * sväller till 1800 tecken är inte längre en morf.
 */
function InforutanMorf({
  rader,
  fokus,
  ort,
  somStandard,
  onSpara,
  onStang,
}: {
  rader: Rad[];
  /** Fältet som ska få markören; null = första fältet. */
  fokus: BlockId | null;
  ort: string | null;
  somStandard: Set<BlockId>;
  onSpara: (andringar: { id: BlockId; nytt: Override | null; blirStandard: boolean }[]) => void;
  onStang: () => void;
}) {
  const falt = rader.filter((r) => !r.def.last);
  // Markören landar i det efterfrågade fältet, annars i det första.
  const fokusId = fokus ?? falt[0]?.def.id;
  const [utkast, setUtkast] = useState<Record<string, string>>(() =>
    Object.fromEntries(falt.map((r) => [r.def.id, r.text ?? ''])),
  );
  const [standard, setStandard] = useState<Set<BlockId>>(new Set(somStandard));

  const spara = () => {
    onSpara(
      falt.map((r) => {
        const varde = utkast[r.def.id] ?? '';
        // Samma text som standarden = ingen egen text (foljer standarden igen).
        const nytt: Override | null =
          varde.trim() === '' || (r.standardText != null && varde === r.standardText)
            ? null
            : { typ: 'text', varde };
        return { id: r.def.id, nytt, blirStandard: standard.has(r.def.id) && nytt != null };
      }),
    );
  };

  return (
    <ul className={KORT_KLASS}>
      {rader.map((r, i) => (
        <li
          key={r.def.id}
          data-block={r.def.id}
          /* Sista raden bär extra luft mot separatorn — ett skrivfält stod dikt
             an mot linjen. Samma tillägg finns på läslägets sista rad, så Δ=0
             håller: båda lägena växer lika mycket. */
          className={cn('flex flex-col', i === rader.length - 1 && 'pb-2')}
        >
          {r.def.last ? (
            // Rubriken andras pa eventsidan, inte har — las-only i bada lagen.
            <div className="flex items-center gap-3 py-3">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-small text-text-muted leading-5">{r.def.etikett}</span>
                <span className="truncate text-body">{varderad(r)}</span>
              </span>
            </div>
          ) : (
            /* Δ=0 MOT LÄSRADEN — eventsidans lösning (DetaljGrupp.tsx:12-13,
               "py-2 + 32 px fält = py-3 + 24 px textrad"): morfen KOMPENSERAR
               fältets extrahöjd med mindre padding i stället för att växa.
               py-1 (8) + etikett 20 + gap-1 (4) + fält 40 = 72 px, exakt
               läsradens py-3 (24) + 20 + 4 + värde 24. Mätt före fixen hoppade
               sektionen 594 -> 690 px vid Ändra. Fälten behåller 40 px —
               höjden tas ur paddingen, aldrig ur träffytan. */
            /* Fälten som saknas bär varningsytans färg — men på SJÄLVA
               SKRIVFÄLTET, inte på hela raden: markeringen hör till det som
               ska fyllas i, inte till etiketten bredvid. Raden är därmed
               orörd, så Δ=0 håller utan kompensation. */
            <div className="flex flex-col gap-1 py-1">
              <span className="text-small text-text-muted leading-5" id={`morf-${r.def.id}`}>
                {r.def.etikett}
              </span>
              {r.def.datum ? (
                <DatumEnkel
                  label={r.def.etikett}
                  iso={utkast[r.def.id] ?? ''}
                  autoFocus={r.def.id === fokusId}
                  faltKlass={r.tomt ? 'border-(--mm-messagebox-warning-border)' : undefined}
                  onChange={(v) => setUtkast((u) => ({ ...u, [r.def.id]: v }))}
                />
              ) : (
                /* min-h-10 = DatumEnkels DateInput-höjd, så textfält och
                     datumfält ger EXAKT samma radhöjd. Utan den mätte raderna
                     81/81/81/81/81/89 px — olika höga, vilket är just det
                     Marcus fällt. */
                <Input
                  label={r.def.etikett}
                  hideLabel
                  size="sm"
                  autoFocus={r.def.id === fokusId}
                  className={cn(
                    'min-h-10',
                    /* Saknat värde markeras med KONTUR i varningsrutans
                       konturfärg, inte med fylld bakgrund: en rosa yta i
                       skrivfältet blev tung och otydlig, medan konturen ramar
                       in exakt det som ska fyllas i och låter texten stå kvar
                       på vitt. Primitivens className går till WRAPPERN;
                       <input> får bara inputVariants(...) — därav
                       barnvarianten. */
                    r.tomt && '[&_input]:border-(--mm-messagebox-warning-border)',
                  )}
                  placeholder={r.def.id === 'plats' ? 'Gatuadress och ort' : undefined}
                  value={utkast[r.def.id] ?? ''}
                  onChange={(v) => setUtkast((u) => ({ ...u, [r.def.id]: v }))}
                />
              )}
              {r.def.platsFalt && ort && (utkast[r.def.id] ?? '').trim() !== '' && (
                <span className="pt-1">
                  <Kryss
                    label={`Använd som standard för ${ort}`}
                    vald={standard.has(r.def.id)}
                    onChange={(v) =>
                      setStandard((sv) => {
                        const n = new Set(sv);
                        if (v) n.add(r.def.id);
                        else n.delete(r.def.id);
                        return n;
                      })
                    }
                  >
                    Använd som standard för {ort} framöver
                  </Kryss>
                </span>
              )}
            </div>
          )}
        </li>
      ))}
      {/* Spara/Avbryt pa Andra-radens plats och hojd — eventsidans morf. */}
      {/* Avbryt före Spara — SAMMA ordning som blockdialogens knapprad.
          Eventsidan har motsatt ordning, men inom den här vyn väger den
          interna konsekvensen tyngre än att spegla en annan sida.
          Luften under sista fältet bor på FÄLTRADEN, inte här: Marcus pekade
          ovanför separatorn, och en pt här sköt sektionen 594 -> 602 px. */}
      <li className="flex items-center justify-center gap-2 py-2">
        <Button size="sm" intent="secondary" emphasis="outline" onPress={onStang}>
          Avbryt
        </Button>
        <Button size="sm" intent="primary" onPress={spara}>
          Spara
        </Button>
      </li>
    </ul>
  );
}

function GenereringsVy({
  event,
  mall,
  onTillbaka,
}: {
  event: Event;
  mall: MallId;
  onTillbaka: () => void;
}) {
  const meta = MALL_META[mall];
  const grupper = GRUPPER[mall];

  // [TASK-309.6] Underlaget kommer nu ur `getDocumentSources` (adaptern) —
  // React Query-cachen ÄR sanningskällan. Inget lokalt `overrides`-state
  // längre: varje blocks Spara skriver DIREKT mot servern (`spara`/
  // `sparaSektion` nedan), och en lyckad skrivning invaliderar denna query
  // (`useSaveEventText`), så nästa render läser det som faktiskt sparades.
  const sourcesQuery = useDocumentSources(event.id);
  const sources = sourcesQuery.data;

  // Vilka block som ska bli platsens standard NÄR bilagan skapas (beslut
  // 6 C, AC #2 "vid Skapa, inte vid krysset") — det enda som fortfarande är
  // rent lokalt UI-tillstånd (en avsikt, inte en skrivning i sig).
  const [somStandard, setSomStandard] = useState<Set<BlockId>>(new Set());
  const [oppet, setOppet] = useState<BlockId | null>(null);
  // Inforutan andras som SEKTION (eventsidans morf), inte block for block.
  const [morfar, setMorfar] = useState(false);
  /* Vilket fält morfen ska sätta markören i. "Fyll i plats" i värdeplatsen
     är ett LÖFTE — trycker Lotta där ska hon landa i just det fältet, inte
     bara i sektionen. null = första fältet (Ändra-radens väg in). */
  const [morfFokus, setMorfFokus] = useState<BlockId | null>(null);
  const oppnaMorf = (fokus: BlockId | null) => {
    setMorfFokus(fokus);
    setMorfar(true);
  };
  const andraKnappRef = useRef<HTMLButtonElement>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const forhandsgranska = useForhandsgranskaBilaga();
  const saveEventText = useSaveEventText(event.id);
  const genereraBilaga = useGenereraEventBilaga(event.id);

  const oppnaBlock = (id: BlockId) => setOppet(id);
  const stangDialog = () => setOppet(null);

  const rader = useMemo(
    () =>
      sources
        ? grupper.map((g) => ({
            ...g,
            rader: g.block.map((b) => byggRad(b, event, sources, mall)),
          }))
        : [],
    [grupper, event, sources, mall],
  );
  const allaRader = rader.flatMap((g) => g.rader);
  const utelamnade = allaRader.filter((r) => r.tomt);
  const oppenRad = oppet ? allaRader.find((r) => r.def.id === oppet) : undefined;
  /* Bläddringen håller sig inom den grupp raden bor i — den är gruppens
     genomgång, inte hela bilagans. */
  const oppenGrupp = oppet ? rader.find((g) => g.rader.some((r) => r.def.id === oppet)) : undefined;
  const navSyskon = oppenGrupp ? dialogRader(oppenGrupp.rader) : [];
  // BlockDialog.tsx:s resterande-belopp-hjälptext citerar det AKTUELLA
  // (kopia-resolvda) beloppet — `allaRader` bär redan den upplösningen.
  const resterandeBeloppText = allaRader.find((r) => r.def.id === 'resterande')?.text ?? null;

  /**
   * Persisterar ETT blocks kopia (text ELLER agenda) DIREKT mot skiva 2:s
   * skrivväg (AC #2) — `saveEventText` (fire-and-forget, samma disciplin
   * som `useUploadAttachment`: felytan renderas nedan ur `mutation.error`,
   * inte här). Ingen lokalt "utkast" kvar att ångra: dialogens Avbryt
   * stänger bara panelen (`stangDialog`), den skriver aldrig något.
   */
  const spara = (id: BlockId, nytt: Override | null, blirStandard: boolean) => {
    setResultat(null);
    setSomStandard((s) => {
      const n = new Set(s);
      if (blirStandard && nytt) n.add(id);
      else n.delete(id);
      return n;
    });
    if (id === 'dagEtt' || id === 'dagTva') {
      const dag = id === 'dagEtt' ? 1 : 2;
      saveEventText.mutate({ agenda: { dag, rader: nytt?.typ === 'agenda' ? nytt.rader : [] } });
      return;
    }
    const faltKey = BLOCK_TILL_FALT[id];
    if (!faltKey) return; // 'rubrik' — låst, öppnas aldrig via dialog.
    saveEventText.mutate({ falt: { [faltKey]: nytt?.typ === 'text' ? nytt.varde : null } });
  };

  /** Sektions-spara: samtliga fält i EN batch (`SaveEventTextInput.falt`
   *  tar flera nycklar) — ETT nätverksanrop för hela Inforutan-sektionen. */
  const sparaSektion = (
    andringar: { id: BlockId; nytt: Override | null; blirStandard: boolean }[],
  ) => {
    setResultat(null);
    setSomStandard((s) => {
      const n = new Set(s);
      for (const a of andringar) {
        if (a.blirStandard && a.nytt) n.add(a.id);
        else n.delete(a.id);
      }
      return n;
    });
    const falt: Partial<Record<EventTextFalt, string | null>> = {};
    for (const a of andringar) {
      const faltKey = BLOCK_TILL_FALT[a.id];
      if (!faltKey) continue;
      falt[faltKey] = a.nytt?.typ === 'text' ? a.nytt.varde : null;
    }
    if (Object.keys(falt).length > 0) saveEventText.mutate({ falt });
    setMorfar(false);
    andraKnappRef.current?.focus();
  };

  /**
   * Skapar dokumentet; `skarpt` sparar dessutom platsens standard.
   *
   * [RIVEN OM, TASK-309.6] `false` (Förhandsgranska) anropar preview-grenen
   * (`useForhandsgranskaBilaga`, `{eventId, mall}` — ingen HTML byggs
   * klient-side, AC #6). `true` (Skapa) anropar den PERSISTERANDE grenen
   * (`useGenereraEventBilaga`) som skapar en NY Bilagor-rad, sparar ev.
   * platsstandard i samma andetag, och slår upp en nedladdnings-URL.
   *
   * ÖPPNAR INGENTING FÖRRÄN RESULTATET FINNS. Marcus 2026-08-22: *"Lotta
   * ska inte skickas till pdf:en automatiskt utan välja att gå dit."*
   * Laddningen visas på knappen i appen, och den färdiga PDF:en
   * presenteras som ett val i resultatytan — `window.open` sker EFTER
   * mutationen löst ut, i onSuccess, exakt samma popup-säkra mönster som
   * förlagan (mätt 2026-08-22: Chrome tillåter `window.open` även efter
   * flera sekunders väntan; `blockerad: fonster === null` är fallbacken om
   * inte).
   */
  const skapaDokument = (skarpt: boolean) => {
    if (forhandsgranska.isPending || genereraBilaga.isPending) return;
    setResultat(null);

    if (!skarpt) {
      forhandsgranska.mutate(
        { eventId: event.id, mall },
        {
          onSuccess: ({ url }) => {
            const fonster = window.open(url, '_blank');
            setResultat({
              typ: 'klar',
              skarpt: false,
              url,
              blockerad: fonster === null,
              utelamnade: [],
              sparade: [],
            });
          },
          onError: (e) => setResultat({ typ: 'fel', text: e.message }),
        },
      );
      return;
    }

    // Platsens standard sparas när bilagan skapas — inte när krysset sätts
    // (AC #2). Insamlat ur `allaRader`s AKTUELLA (redan sparade) värden.
    const platsFalt: Partial<Record<PlatsFalt, string>> = {};
    const sparadeEtiketter: string[] = [];
    for (const r of allaRader) {
      if (r.def.platsFalt && somStandard.has(r.def.id) && r.text?.trim()) {
        platsFalt[r.def.platsFalt] = r.text;
        sparadeEtiketter.push(r.def.etikett.toLowerCase());
      }
    }

    genereraBilaga.mutate(
      { mall, platsFalt: Object.keys(platsFalt).length > 0 ? platsFalt : undefined },
      {
        onSuccess: ({ url }) => {
          setSomStandard(new Set());
          const fonster = window.open(url, '_blank');
          setResultat({
            typ: 'klar',
            skarpt: true,
            url,
            blockerad: fonster === null,
            utelamnade: utelamnade.map((r) => r.def.etikett.toLowerCase()),
            sparade: sparadeEtiketter,
          });
        },
        onError: (e) => setResultat({ typ: 'fel', text: e.message }),
      },
    );
  };

  if (sourcesQuery.isPending) {
    return (
      <div className="flex flex-col gap-4" data-testid="generering-vy">
        <KromKnapp label="Tillbaka till Dokument" onPress={onTillbaka} />
        <p className="text-body text-text-muted">Hämtar underlag …</p>
      </div>
    );
  }
  if (!sources) {
    return (
      <div className="flex flex-col gap-4" data-testid="generering-vy">
        <KromKnapp label="Tillbaka till Dokument" onPress={onTillbaka} />
        <MessageBox intent="error">
          {sourcesQuery.error instanceof Error
            ? sourcesQuery.error.message
            : 'Underlaget kunde inte hämtas.'}
        </MessageBox>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="generering-vy">
      <div className="flex flex-col gap-4">
        <KromKnapp label="Tillbaka till Dokument" onPress={onTillbaka} />
        <header className="flex flex-col gap-1">
          <h1 className="font-semibold text-3xl">{meta.namn}</h1>
          <p className="text-small text-text-secondary">
            <span className="font-medium text-text">{eventName(event)}</span> · {event.ort} ·{' '}
            {datumSpannText(event)}
          </p>
        </header>

        {/* [TASK-309.6] Block-dialogens Spara skriver nu direkt mot servern
            (`saveEventText`, fire-and-forget) — felytan renderas här ur
            `mutation.error`, samma disciplin som `useUploadAttachment`s
            docblock beskriver ("adaptern kastar redan ett fel på Lottas
            språk, komponenten renderar det"). */}
        {saveEventText.isError && (
          <MessageBox intent="error">
            Ändringen kunde inte sparas:{' '}
            {saveEventText.error instanceof Error ? saveEventText.error.message : 'Okänt fel.'}
          </MessageBox>
        )}

        {/* BESLUT 5: tomma block utelämnas — men aldrig tyst. Beskedet står
            FÖRE knappen, i klartext, med en väg in per block. */}
        {utelamnade.length > 0 && (
          <MessageBox intent="warning">
            <span className="flex flex-col gap-3">
              <span>
                <strong>
                  {meningsStart(ochLista(utelamnade.map((r) => r.def.etikett.toLowerCase())))}
                </strong>{' '}
                saknas för det här eventet. {utelamnade.length === 1 ? 'Den delen' : 'De delarna'}{' '}
                tas inte med i bilagan förrän du fyllt i {utelamnade.length === 1 ? 'den' : 'dem'}.
              </span>
              <span className="flex flex-wrap gap-2">
                {utelamnade.map((r) => (
                  <Button
                    key={r.def.id}
                    intent="primary"
                    emphasis="subtle"
                    size="sm"
                    onPress={() => {
                      // Inforutans block bor i sektionsmorfen, inte i en dialog.
                      if (INFORUTA_IDN.has(r.def.id)) oppnaMorf(r.def.id);
                      else oppnaBlock(r.def.id);
                    }}
                  >
                    Fyll i {r.def.etikett.toLowerCase()}
                  </Button>
                ))}
              </span>
            </span>
          </MessageBox>
        )}
      </div>
      {rader.map((g) => {
        const rubrikId = `grupp-${g.rubrik.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const arInforutan = g.rubrik === 'Inforutan';
        return (
          <section
            key={g.rubrik}
            aria-labelledby={rubrikId}
            className="flex min-w-0 flex-col gap-2"
          >
            {/* Rubriken bär INGEN "N saknas"-ingång. En sådan byggdes i varv
                14 och revs i varv 15: det som saknas pekas redan ut på TRE
                ställen — varningsrutan överst namnger allt, radens värdeplats
                bär "Fyll i …" i fet understruken stil, och dialogen bläddrar
                dit. En fjärde väg var brus, inte hjälp. */}
            <h2 id={rubrikId} className="px-4 font-semibold text-lg">
              {g.rubrik}
            </h2>
            {arInforutan && morfar ? (
              <InforutanMorf
                rader={g.rader}
                fokus={morfFokus}
                ort={event.ort}
                somStandard={somStandard}
                onSpara={sparaSektion}
                onStang={() => {
                  setMorfar(false);
                  andraKnappRef.current?.focus();
                }}
              />
            ) : (
              <ul className={KORT_KLASS}>
                {g.rader.map((r, i) => {
                  const varde = varderad(r, event);
                  const inre = (
                    <>
                      {/* 21 + 24 px text hade gett 71 px; leading-5 (20 px) + gap-1 (4 px)
                        + py-3 (24 px) = 72 px — på 4 px-rytmen (DESIGN-SYSTEM-SPEC §3). */}
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-small text-text-muted leading-5">
                          {r.def.etikett}
                        </span>
                        {/* Saknat värde = handlingen i värdeplatsen (GOV.UK summary list
                          "Enter …"). Understruken text i textfärg — husets länkaffordans
                          (hem-listornas hover:underline), 14:1 mot kortet; guld mättes
                          till 2,36:1 (gold-500) resp. 4,49:1 (gold-700) och föll. */}
                        {/* I Inforutan är raden inte längre en knapp, men
                            "Fyll i …" SER ut som en handling — fet och
                            understruken — och ska då VARA en. Den öppnar
                            ändraläget och sätter markören i just det fältet;
                            en affordans som inte infrias är värre än ingen
                            alls. Övriga grupper: raden är knappen, texten
                            förblir en span (ingen knapp i en knapp). */}
                        {arInforutan && r.tomt ? (
                          <button
                            type="button"
                            className="truncate text-left font-medium text-body underline decoration-1 underline-offset-4"
                            onClick={() => oppnaMorf(r.def.id)}
                          >
                            Fyll i {r.def.etikett.toLowerCase()}
                          </button>
                        ) : (
                          <span
                            className={`truncate text-body underline-offset-4 ${
                              r.tomt
                                ? 'font-medium underline decoration-1'
                                : r.def.last
                                  ? ''
                                  : 'group-hover:underline'
                            }`}
                            title={varde ?? undefined}
                          >
                            {varde ?? `Fyll i ${r.def.etikett.toLowerCase()}`}
                          </span>
                        )}
                      </span>
                      {/* Chevron bara där raden LEDER någonstans. Inforutan
                          ändras via Ändra-raden, så dess rader bär ingen — en
                          pil som inte går någonstans är ett löfte som inte
                          infrias. */}
                      {arInforutan ? null : r.def.last ? (
                        <span aria-hidden="true" className="size-4 shrink-0" />
                      ) : (
                        <ChevronRight
                          aria-hidden="true"
                          size={16}
                          className="shrink-0 text-text-muted"
                        />
                      )}
                    </>
                  );
                  /* Inforutan ändras som SEKTION via Ändra-raden — dess rader
                     är därför ren läsning, inga knappar och inga dialoger.
                     Övriga grupper (löptext, agenda) behåller sin dialog: de
                     ryms inte i en sektionsmorf. */
                  const lasEndast = r.def.last || arInforutan;
                  return (
                    <li
                      key={r.def.id}
                      data-block={r.def.id}
                      /* Speglar morfens sista rad — se InforutanMorf. Utan
                         motsvarigheten här skulle Ändra bli ett hopp igen. */
                      className={cn(
                        'flex flex-col',
                        arInforutan && i === g.rader.length - 1 && 'pb-2',
                      )}
                    >
                      {lasEndast ? (
                        <div className="flex items-center gap-3 py-3">{inre}</div>
                      ) : (
                        <button
                          type="button"
                          className={RAD_KLASS}
                          aria-label={`${r.tomt ? 'Fyll i' : 'Ändra'} ${r.def.etikett.toLowerCase()}`}
                          onClick={() => oppnaBlock(r.def.id)}
                        >
                          {inre}
                        </button>
                      )}
                    </li>
                  );
                })}
                {/* Inforutans Ändra-rad — eventsidans AndraRad, verbatim form
                  (py-3 + 24 px innehåll = 48 px, penna + centrerad text).
                  Bara denna grupp bär den: löptexten och agendorna ryms inte
                  i en sektionsmorf och behåller sin dialog. */}
                {arInforutan && (
                  <li className="py-3">
                    <button
                      ref={andraKnappRef}
                      type="button"
                      onClick={() => oppnaMorf(null)}
                      className="flex w-full items-center justify-center gap-2 font-medium text-body"
                    >
                      <Pencil aria-hidden="true" size={16} />
                      Ändra
                    </button>
                  </li>
                )}
              </ul>
            )}
          </section>
        );
      })}
      <div className="flex flex-col gap-4">
        {resultat?.typ === 'klar' && (
          <MessageBox intent="success">
            {resultat.skarpt
              ? `${meta.namn}n är skapad och ligger nu bland eventets dokument, redo att bifogas i utskick.`
              : `${meta.namn}n är klar att granska.`}
            {resultat.utelamnade.length > 0 && ` Utan ${ochLista(resultat.utelamnade)}.`}
            {resultat.sparade.length > 0 &&
              ` ${event.ort} har nu ${ochLista(resultat.sparade)} som standard.`}
            {resultat.blockerad
              ? ' Webbläsaren stoppade det nya fönstret. Öppna det härifrån i stället.'
              : ' Den öppnades i ett nytt fönster.'}
            {!resultat.skarpt && (
              <span className="text-text-muted"> (Prototyp: ingen PDF sparas.)</span>
            )}
            {/* DOKUMENTET ÄR ETT VAL, INTE EN OMDIRIGERING. `window.open` sker
                här, i ett eget direkt klick — därför finns ingen popup-
                blockerare att smita förbi, och Lotta bestämmer själv när hon
                lämnar formuläret. `noreferrer` utelämnas medvetet: målet är en
                blob:-URL byggd av vår egen JS, aldrig en främmande adress
                (samma resonemang som DokumentYta § IKONPAR). */}
            <span className="mt-3 block">
              <Button
                intent="primary"
                emphasis="outline"
                size="sm"
                onPress={() => window.open(resultat.url, '_blank')}
              >
                <ExternalLink aria-hidden="true" size={16} className="shrink-0" />
                Öppna {meta.namn.toLowerCase()}n
              </Button>
            </span>
          </MessageBox>
        )}
        {resultat?.typ === 'fel' && <MessageBox intent="error">{resultat.text}</MessageBox>}

        <div className="flex flex-col gap-2">
          {/* `aria-disabled`, INTE `isDisabled`: ett native `disabled` tar
              knappen ur tabordningen mitt i klicket. Vakten först i
              `skapaDokument` bär dubbelklicks-skyddet i stället — samma
              mönster som `DokumentYta` § DokumentAtgardsKnappar. */}
          <Button
            intent="secondary"
            emphasis="outline"
            aria-disabled={forhandsgranska.isPending || genereraBilaga.isPending}
            onPress={() => skapaDokument(false)}
          >
            {forhandsgranska.isPending && (
              <Loader2 aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
            )}
            {forhandsgranska.isPending ? 'Skapar PDF …' : 'Förhandsgranska först'}
          </Button>
          <Button
            intent="primary"
            aria-disabled={forhandsgranska.isPending || genereraBilaga.isPending}
            onPress={() => skapaDokument(true)}
          >
            {genereraBilaga.isPending ? (
              <Loader2 aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
            ) : (
              <FileText aria-hidden="true" size={16} className="shrink-0" />
            )}
            {genereraBilaga.isPending ? 'Skapar …' : `Skapa ${meta.namn.toLowerCase()}`}
          </Button>
        </div>
      </div>
      {/* Redigeringen bor i en egen yta — villkorad rendering så utkastet är
          färskt per öppning (samma disciplin som RackviddsDialog).
          Panelen bor HÄR och inte i BlockDialog: bläddringen byter rad utan
          att stänga, och en panel som monterades om per rad hade spelat sin
          öppningsanimation vid varje steg. `key` är av samma skäl borta —
          utkastet synkas i stället på prop-byte, se BlockDialog. */}
      {oppenRad && (
        <Modal
          isOpen
          isDismissable
          /* Löptextdialogen FYLLER sitt tak (`h-` utöver panelklassens
             `max-h`). Utan det är panelen innehållsdriven, bodyn får ingen
             bestämd höjd, och en textruta som ska fylla den kan inte veta hur
             hög den är — då hamnar rullningen på dialogen i stället för i
             rutan. */
          /* Ett mått, inga undantag — se DIALOG_PANEL_KLASS. */
          className={DIALOG_PANEL_KLASS}
          style={DIALOG_ANKARE}
          onOpenChange={(open) => {
            if (!open) stangDialog();
          }}
        >
          <BlockDialog
            rad={oppenRad}
            ort={event.ort}
            somStandard={somStandard.has(oppenRad.def.id)}
            syskon={navSyskon}
            resterandeBeloppHjalp={resterandeBeloppText}
            onVaxla={(id, nytt, blirStandard) => {
              spara(oppenRad.def.id, nytt, blirStandard);
              setOppet(id);
            }}
            onSpara={(nytt, blirStandard) => {
              spara(oppenRad.def.id, nytt, blirStandard);
              stangDialog();
            }}
            onStang={stangDialog}
          />
        </Modal>
      )}
    </div>
  );
}

/**
 * Radens värde på EN rad — som det står i dokumentet för korta fält; för
 * löptext och agenda en beskrivning (M3: långa värden hör inte hemma som
 * trailing text — "reduce the amount of information shown"). Härkomsten
 * är tyst för det normala (standard) och syns bara i blockets egen yta.
 *
 * `event` är OPTIONAL — bara 'datumTid' behöver den (kombinerar
 * datumspannet, byggRad-docblockets resonemang). Den enda anroparen som
 * saknar `event` (InforutanMorf, `r.def.last`-grenen) frågar bara om
 * 'rubrik', som aldrig når 'datumTid'-fallet.
 */
function varderad(r: Rad, event?: Event): string | null {
  if (r.tomt) return null;
  if (r.agenda) return agendaSammanfattning(r.agenda);
  switch (r.def.id) {
    case 'datumTid': {
      if (!event) return r.text;
      const spann = datumSpannText(event);
      if (!spann) return r.text;
      return r.text?.trim() ? `${spann}, ${r.text}` : spann;
    }
    case 'pris':
      return `${r.text} Kr`;
    case 'anmalningsavgift':
      return `${r.text}, betalas vid anmälan.`;
    case 'sistaBetalningsdag':
      return datumMedAr(r.text ?? '');
    case 'beskrivning':
      return r.egen ? 'Egen text för det här eventet' : 'Standardtexten om utbildningen';
    default:
      return r.text;
  }
}

function agendaSammanfattning(rader: AgendaRad[]): string {
  const meditationer = rader.filter((r) => r.meditation).length;
  const punkter = `${rader.length} punkter`;
  return meditationer ? `${punkter}, varav ${meditationer} meditationer` : punkter;
}

// DIALOG_PANEL_KLASS/DIALOG_ANKARE/ProtoDialog/BlockDialog/DatumEnkel/
// AGENDA_OPPEN_KLASS/AgendaEditor UTBRUTNA (TASK-309.7, ADR-125 § 7) till
// `@/components/dokument/BlockDialog` — VERBATIM flytt, ingen formändring.
// Importerade ovan. Se den modulens filhuvud för fullständig motivering.
