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
 * DOKUMENTET ÄR DET RIKTIGA: "Skapa" hämtar den faktiska mallen
 * (`docs/mallar/bilagor/<mall>.html`, serverad rakt av Vite i dev), fyller i
 * blocken, TAR BORT de utelämnade och öppnar resultatet i ett nytt fönster.
 * Det är vad Lotta ser — inte en ruta som säger att en PDF hade skapats.
 *
 * LISTA-VYN är en kopia av Dokument-ytans form i eventläget (`DokumentYta.tsx`
 * § DokumentLista) — startpunkten ska vara EXAKT kopia (T66), därför är
 * klasserna stulna rad för rad, inte omtolkade. Skillnaden mot skarpa: två
 * mallrader i stället för en, och mallradens knapp leder till genereringsvyn
 * i stället för direkt till PDF:en.
 */

import { type CalendarDate, parseDate } from '@internationalized/date';
import { Link } from '@tanstack/react-router';
import { Check, ChevronLeft, ChevronRight, Files, FileText, Plus, Upload, X } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { type ReactNode, useMemo, useState } from 'react';
import { Checkbox, DateField, DateInput, DateSegment, I18nProvider } from 'react-aria-components';
import { datumSpannText } from '@/components/events/detail/datumSpann';
import { eventName } from '@/components/events/EventCard';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Dialog } from '@/components/primitives/Dialog';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
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

type AgendaRad = { text: string; tid: string; meditation: boolean };

/**
 * Eventinnehåll för kombinationen Event "Resor i medvetandet 1" × Eventtyp
 * "Utbildning" (ORDLISTA § Eventinnehåll). Texten är mallens, verbatim.
 * Beskrivningen bor i mallens markup (fetade nyckelord) och hämtas därifrån
 * vid rendering; här bär vi bara en förhandsvisning av den.
 */
const EVENTINNEHALL = {
  etikett: 'Resor i medvetandet 1 · Utbildning',
  tid: 'kl. 10:00 – 17:00',
  pris: '2.500',
  anmalningsavgift: '1000:-',
  resterandeBelopp: '1500:-',
  beskrivningForhandsvisning:
    'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om medvetandet, både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt djupa meditationer. …',
  dagEtt: [
    { text: 'Miranon Media', tid: '', meditation: false },
    { text: 'Miranon-Nivåer (lite om)', tid: '', meditation: false },
    { text: 'Additiv Meditation', tid: '', meditation: false },
    { text: 'Meditation: Eken Plus Djup avslappning', tid: '30 min', meditation: true },
    { text: 'Mentala hinder', tid: '', meditation: false },
    { text: 'Filosofi: materialism/idealism', tid: '', meditation: false },
    { text: 'Medvetandemodeller', tid: '', meditation: false },
    { text: 'Kvantfysik', tid: '', meditation: false },
    { text: 'Synkronicitet, fjärrskådning', tid: '', meditation: false },
    { text: 'Meditation: Fåtöljen', tid: '5 min', meditation: true },
    { text: 'Meditation: Kraftfältet Plus', tid: '30 min', meditation: true },
    { text: 'Upplevelser utanför kroppen', tid: '', meditation: false },
    { text: 'Utmaningar utanför kroppen', tid: '', meditation: false },
    { text: 'Meditation: Uthuset', tid: '45 min', meditation: true },
  ] satisfies AgendaRad[],
  dagTva: [
    { text: 'Meditation Fyren', tid: '40 min', meditation: true },
    { text: 'Intention – Föreställning – Skapande', tid: '', meditation: false },
    { text: 'Meditation & fokus', tid: '', meditation: false },
    { text: 'Klicka ut eller sömn', tid: '', meditation: false },
    { text: 'Punktmedvetande', tid: '', meditation: false },
    { text: 'Mentala Ankare / Grundning/Jordning', tid: '', meditation: false },
    { text: 'Meditation Klockan', tid: '40 min', meditation: true },
    { text: 'Ljud & Frekvenser, EEG', tid: '', meditation: false },
    { text: 'Tankeövning', tid: '5 min', meditation: false },
    { text: 'Var observatören', tid: '', meditation: false },
  ] satisfies AgendaRad[],
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
type PlatsFalt = 'adress' | 'parkering' | 'transport' | 'klader';
type Plats = { namn: string } & Record<PlatsFalt, string>;
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
  | 'rubrik'
  | 'datumTid'
  | 'plats'
  | 'pris'
  | 'anmalningsavgift'
  | 'resterande'
  | 'sistaBetalningsdag'
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
  /** Platsens fält — blocket kan sparas som platsens standard (beslut 6 C). */
  platsFalt?: PlatsFalt;
  /** Låst: hämtas ur eventet och ändras på eventsidan, inte här. */
  last?: boolean;
  agenda?: boolean;
  /** Ett datum (ISO-sträng som värde) — redigeras med datumfält, inte text. */
  datum?: boolean;
  /** Rubriken på det ämnesstycke i deltagarinformationen blocket motsvarar. */
  amnesstycke?: string;
};

type Grupp = { rubrik: string; block: BlockDef[] };

const INFORUTA_BAS: BlockDef[] = [
  { id: 'rubrik', etikett: 'Rubrik', kalla: 'event', last: true },
  { id: 'datumTid', etikett: 'Datum och tid', kalla: 'event' },
  { id: 'plats', etikett: 'Plats', kalla: 'plats', platsFalt: 'adress' },
];

const GRUPPER: Record<MallId, Grupp[]> = {
  bekraftelse: [
    {
      rubrik: 'Inforutan',
      block: [
        ...INFORUTA_BAS,
        { id: 'pris', etikett: 'Pris', kalla: 'eventinnehall' },
        { id: 'anmalningsavgift', etikett: 'Anmälningsavgift', kalla: 'eventinnehall' },
        { id: 'resterande', etikett: 'Resterande belopp', kalla: 'eventinnehall' },
        { id: 'sistaBetalningsdag', etikett: 'Sista betalningsdag', kalla: 'event', datum: true },
      ],
    },
    {
      rubrik: 'Om utbildningen',
      block: [{ id: 'beskrivning', etikett: 'Beskrivning', kalla: 'eventinnehall' }],
    },
    {
      rubrik: 'Innehållet dag för dag',
      block: [
        { id: 'dagEtt', etikett: 'Innehåll, Dag Ett', kalla: 'eventinnehall', agenda: true },
        { id: 'dagTva', etikett: 'Innehåll, Dag Två', kalla: 'eventinnehall', agenda: true },
      ],
    },
  ],
  deltagarinfo: [
    { rubrik: 'Inforutan', block: INFORUTA_BAS },
    {
      rubrik: 'Praktisk information',
      block: [
        {
          id: 'forberedelser',
          etikett: 'Förberedelser',
          kalla: 'eventinnehall',
          amnesstycke: 'Förberedelser',
        },
        {
          id: 'klader',
          etikett: 'Kläder',
          kalla: 'plats',
          platsFalt: 'klader',
          amnesstycke: 'Kläder',
        },
        { id: 'tagMed', etikett: 'Tag med', kalla: 'eventinnehall', amnesstycke: 'Tag med' },
        {
          id: 'rokning',
          etikett: 'För dig som röker',
          kalla: 'eventinnehall',
          amnesstycke: 'För dig som röker',
        },
        {
          id: 'parfym',
          etikett: 'Parfym och kosmetika',
          kalla: 'eventinnehall',
          amnesstycke: 'Parfym och kosmetika',
        },
        { id: 'mat', etikett: 'Mat/fika', kalla: 'eventinnehall', amnesstycke: 'Mat/fika' },
        {
          id: 'overnattning',
          etikett: 'Övernattning',
          kalla: 'eventinnehall',
          amnesstycke: 'Övernattning',
        },
        {
          id: 'parkering',
          etikett: 'Parkering',
          kalla: 'plats',
          platsFalt: 'parkering',
          amnesstycke: 'Parkering',
        },
        {
          id: 'transport',
          etikett: 'Transport från tåget',
          kalla: 'plats',
          platsFalt: 'transport',
          amnesstycke: 'Transport från tåget',
        },
        {
          id: 'utrustning',
          etikett: 'Utrustning',
          kalla: 'eventinnehall',
          amnesstycke: 'Utrustning',
        },
      ],
    },
  ],
};

const MALL_META: Record<MallId, { namn: string; fil: string; fastForm: string }> = {
  bekraftelse: {
    namn: 'Bekräftelsebilaga',
    fil: 'bekraftelsebilaga.html',
    fastForm:
      'logga, Swish- och Plusgironummer, "Frågor mejla till", hälsningen och sidfotens QR-koder',
  },
  deltagarinfo: {
    namn: 'Deltagarinformation',
    fil: 'deltagarinformation.html',
    fastForm:
      'logga, ingressen, "Frågor mejla till", "Kom gärna en liten stund innan" och hälsningen',
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

/** Standardvärdet per textblock. `null` = saknas. Agendablock hanteras separat. */
function standardText(
  id: BlockId,
  mall: MallId,
  event: Event,
  plats: Plats | undefined,
): string | null {
  const ei = EVENTINNEHALL;
  switch (id) {
    case 'rubrik':
      return event.eventNamn
        ? mall === 'bekraftelse'
          ? `Utbildning: ${event.eventNamn}`
          : `Välkommen till ${event.eventNamn}!`
        : null;
    case 'datumTid': {
      const d = datumText(event);
      return d ? `${d}, ${ei.tid}` : null;
    }
    case 'plats':
      return plats?.adress || null;
    case 'pris':
      return ei.pris;
    case 'anmalningsavgift':
      return ei.anmalningsavgift;
    case 'resterande':
      return ei.resterandeBelopp;
    case 'sistaBetalningsdag':
      // Finns inte på eventet i dag — därför saknas datumet tills Lotta
      // sätter det (beslut 5 tvingar fram frågan om var det ska bo).
      return null;
    case 'beskrivning':
      return ei.beskrivningForhandsvisning;
    case 'forberedelser':
      return ei.forberedelser;
    case 'klader':
      return plats?.klader || null;
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
      return plats?.parkering || null;
    case 'transport':
      return plats?.transport || null;
    case 'utrustning':
      return ei.utrustning;
    case 'dagEtt':
    case 'dagTva':
      return null;
  }
}

function standardAgenda(id: BlockId): AgendaRad[] {
  return id === 'dagEtt' ? EVENTINNEHALL.dagEtt : EVENTINNEHALL.dagTva;
}

type Override = { typ: 'text'; varde: string } | { typ: 'agenda'; rader: AgendaRad[] };

type Rad = {
  def: BlockDef;
  standardText: string | null;
  standardAgenda: AgendaRad[] | null;
  egen: Override | null;
  /** Texten som gäller (egen före standard). */
  text: string | null;
  agenda: AgendaRad[] | null;
  tomt: boolean;
};

function byggRad(
  def: BlockDef,
  mall: MallId,
  event: Event,
  plats: Plats | undefined,
  egen: Override | null,
): Rad {
  if (def.agenda) {
    const std = standardAgenda(def.id);
    const agenda = egen?.typ === 'agenda' ? egen.rader : std;
    const ifyllda = agenda.filter((r) => r.text.trim());
    return {
      def,
      standardText: null,
      standardAgenda: std,
      egen,
      text: null,
      agenda: ifyllda,
      tomt: ifyllda.length === 0,
    };
  }
  const std = standardText(def.id, mall, event, plats);
  const text = egen?.typ === 'text' ? egen.varde : std;
  return {
    def,
    standardText: std,
    standardAgenda: null,
    egen,
    text,
    agenda: null,
    tomt: !text?.trim(),
  };
}

/** "10 oktober" — som förlagan skriver sista betalningsdag. Tom sträng om inget datum. */
function datumUtanAr(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? '' : DAG_MANAD.format(d);
}

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
 * DOKUMENTET — den riktiga mallen, ifylld, med utelämnade block borttagna.
 * Samma strängersättning som `scripts/render-bilage-mall.mjs`, plus
 * DOM-operationerna för utelämnande och egna texter.
 * ------------------------------------------------------------------ */

const MALL_BAS = '/docs/mallar/bilagor/';

async function renderaDokument(mall: MallId, event: Event, rader: Rad[]): Promise<string> {
  const svar = await fetch(`${MALL_BAS}${MALL_META[mall].fil}`);
  if (!svar.ok) throw new Error(`Mallen kunde inte hämtas (${svar.status}).`);
  const html = await svar.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Relativa sökvägar (CSS, logga, typsnitt) ska lösas mot mallkatalogen,
  // inte mot det nya fönstrets tomma URL.
  const base = doc.createElement('base');
  base.href = new URL(MALL_BAS, window.location.origin).href;
  doc.head.prepend(base);

  const rad = (id: BlockId) => rader.find((r) => r.def.id === id);
  const textEller = (id: BlockId) => rad(id)?.text ?? '';

  // Rubrik + titel.
  const h1 = doc.querySelector('h1.rubrik');
  if (h1) h1.textContent = textEller('rubrik');
  doc.title = event.eventNamn ?? doc.title;

  // Inforutans rader: en <p> per etikett. Tomt block → <p> bort.
  const inforutaRad = (etikett: string) =>
    Array.from(doc.querySelectorAll('.inforuta p')).find((p) =>
      p.querySelector('strong')?.textContent?.trim().startsWith(etikett),
    );
  const sattInforuta = (etikett: string, id: BlockId) => {
    const p = inforutaRad(etikett);
    if (!p) return;
    const r = rad(id);
    if (!r || r.tomt) {
      p.remove();
      return;
    }
    const strong = p.querySelector('strong');
    p.textContent = '';
    if (strong) p.append(strong, ` ${r.text}`);
    else p.textContent = r.text ?? '';
  };
  sattInforuta('Datum och Tid', 'datumTid');
  sattInforuta('Plats', 'plats');

  if (mall === 'bekraftelse') {
    // Meningen om resterande belopp står bara om BÅDA delarna finns —
    // "betalas senast" utan datum är ingen mening. Mallens egen text i övrigt.
    const slutP = Array.from(doc.querySelectorAll('.inforuta p')).find((p) =>
      p.textContent?.includes('{{resterandeBelopp}}'),
    );
    const rest = rad('resterande');
    const sista = rad('sistaBetalningsdag');
    if (slutP && (!rest || rest.tomt || !sista || sista.tomt)) slutP.remove();

    // Beskrivningen: standard = mallens egen markup (fetade ord); egen text
    // = rena stycken.
    const besk = rad('beskrivning');
    const brodtext = doc.querySelector('.brodtext');
    if (brodtext && besk?.egen?.typ === 'text') {
      brodtext.textContent = '';
      for (const stycke of besk.egen.varde.split(/\n{2,}/)) {
        const p = doc.createElement('p');
        p.textContent = stycke.trim();
        brodtext.append(p);
      }
    } else if (brodtext && besk?.tomt) {
      brodtext.remove();
    }

    // Innehållslistorna byggs om ur raderna (typ-rutan styr färgen, beslut 3).
    const listor = doc.querySelectorAll('.innehallslistor .lista');
    (['dagEtt', 'dagTva'] as const).forEach((id, i) => {
      const lista = listor[i];
      const r = rad(id);
      if (!lista) return;
      if (!r || r.tomt || !r.agenda) {
        lista.remove();
        return;
      }
      const ul = lista.querySelector('ul');
      if (!ul) return;
      ul.textContent = '';
      for (const punkt of r.agenda) {
        const li = doc.createElement('li');
        if (punkt.meditation) {
          const namn = doc.createElement('span');
          namn.className = 'meditationsnamn';
          namn.textContent = punkt.text;
          li.append(namn);
        } else {
          li.append(punkt.text);
        }
        if (punkt.tid.trim()) {
          const tid = doc.createElement('span');
          tid.className = 'tid';
          tid.textContent = punkt.tid;
          li.append(' ', tid);
        }
        ul.append(li);
      }
    });
  } else {
    // Ämnesstyckena: tomt → bort; egen text → ersätt löptexten efter etiketten.
    for (const r of rader) {
      if (!r.def.amnesstycke) continue;
      const p = Array.from(doc.querySelectorAll('p.amnesstycke')).find((el) =>
        el
          .querySelector('strong')
          ?.textContent?.trim()
          .startsWith(r.def.amnesstycke as string),
      );
      if (!p) continue;
      if (r.tomt) {
        p.remove();
        continue;
      }
      if (r.egen?.typ === 'text' || r.def.kalla === 'plats') {
        const strong = p.querySelector('strong');
        p.textContent = '';
        if (strong) p.append(strong, ` ${r.text}`);
      }
    }
  }

  // Kvarvarande platshållare — samma ersättning som render-bilage-mall.mjs.
  const ersatt: Record<string, string> = {
    kursnamn: event.eventNamn ?? '',
    datumTid: textEller('datumTid'),
    plats: textEller('plats'),
    pris: textEller('pris'),
    anmalningsavgift: textEller('anmalningsavgift'),
    resterandeBelopp: textEller('resterande'),
    sistaBetalningsdatum: datumUtanAr(textEller('sistaBetalningsdag')),
  };
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`.replace(
    /\{\{(\w+)\}\}/g,
    (_, nyckel: string) => ersatt[nyckel] ?? '',
  );
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

function Kryss({
  vald,
  onChange,
  children,
  label,
}: {
  vald: boolean;
  onChange: (v: boolean) => void;
  children?: ReactNode;
  label: string;
}) {
  return (
    <Checkbox
      isSelected={vald}
      onChange={onChange}
      aria-label={children ? undefined : label}
      className="group flex cursor-pointer items-center gap-2 text-small"
    >
      <span className={KRYSSRUTA_KLASS}>
        <Check
          aria-hidden="true"
          size={12}
          className="text-(--mm-checkbox-check) opacity-0 group-data-[selected]:opacity-100"
        />
      </span>
      {children && <span className="text-text-secondary">{children}</span>}
    </Checkbox>
  );
}

/* ------------------------------------------------------------------ *
 * ROTEN
 * ------------------------------------------------------------------ */

export function GenereringsPrototyp() {
  const [vy, setVy] = useQueryState('vy');
  const [mallParam, setMall] = useQueryState('mall');
  const mall: MallId = mallParam === 'deltagarinfo' ? 'deltagarinfo' : 'bekraftelse';

  // Platser lever i minnet under sessionen — "spara som standard" skapar
  // Arboga-posten här, ingenstans annars.
  const [platser, setPlatser] = useState<Record<string, Plats>>(PLATSER_SEED);

  if (vy === 'generering') {
    return (
      <GenereringsVy
        key={mall}
        event={ARBOGA}
        mall={mall}
        platser={platser}
        onSparaPlats={(namn, falt) =>
          setPlatser((p) => ({
            ...p,
            [namn]: {
              ...(p[namn] ?? { namn, adress: '', parkering: '', transport: '', klader: '' }),
              ...falt,
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
            <ul data-testid="dokument-lista" className={LISTA_KLASS}>
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

type Resultat =
  | { typ: 'ok'; utelamnade: string[]; sparade: string[] }
  | { typ: 'fel'; text: string };

const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-bg-emphasized motion-safe:transition-colors';
const KORT_KLASS =
  'divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';

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
  onSparaPlats: (platsNamn: string, falt: Partial<Record<PlatsFalt, string>>) => void;
  onTillbaka: () => void;
}) {
  const meta = MALL_META[mall];
  const grupper = GRUPPER[mall];
  const plats = event.ort ? platser[event.ort] : undefined;

  // Eventets egna texter (beslut 6 A) och vilka av dem som ska bli platsens
  // standard när bilagan skapas (beslut 6 C) — allt i minnet.
  const [overrides, setOverrides] = useState<Partial<Record<BlockId, Override>>>({});
  const [somStandard, setSomStandard] = useState<Set<BlockId>>(new Set());
  const [oppet, setOppet] = useState<BlockId | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);

  const rader = useMemo(
    () =>
      grupper.map((g) => ({
        ...g,
        rader: g.block.map((b) => byggRad(b, mall, event, plats, overrides[b.id] ?? null)),
      })),
    [grupper, mall, event, plats, overrides],
  );
  const allaRader = rader.flatMap((g) => g.rader);
  const utelamnade = allaRader.filter((r) => r.tomt);
  const oppenRad = oppet ? allaRader.find((r) => r.def.id === oppet) : undefined;

  // Varje ändring efter ett "Skapa" gör bekräftelsen inaktuell — den
  // beskrev ett dokument som inte längre är det Lotta ser framför sig.
  const spara = (id: BlockId, nytt: Override | null, blirStandard: boolean) => {
    setResultat(null);
    setOverrides((o) => {
      const n = { ...o };
      if (nytt) n[id] = nytt;
      else delete n[id];
      return n;
    });
    setSomStandard((s) => {
      const n = new Set(s);
      if (blirStandard && nytt) n.add(id);
      else n.delete(id);
      return n;
    });
  };

  /** Öppnar dokumentet i ett nytt fönster; `skarpt` sparar dessutom platsens standard. */
  const oppnaDokument = (skarpt: boolean) => {
    // KRITISKT: window.open synkront i klicket, före await — annars blockerar
    // webbläsaren popupen (samma regel som DokumentYta § IKONPAR-not).
    const fonster = window.open('', '_blank');
    setResultat(null);
    void (async () => {
      try {
        const html = await renderaDokument(mall, event, allaRader);
        if (fonster) {
          fonster.document.open();
          fonster.document.write(html);
          fonster.document.close();
        }
        if (!skarpt) return;
        // Platsens standard sparas när bilagan skapas — inte när krysset sätts.
        const sparade: string[] = [];
        if (event.ort) {
          const falt: Partial<Record<PlatsFalt, string>> = {};
          for (const r of allaRader) {
            if (r.def.platsFalt && somStandard.has(r.def.id) && r.text?.trim()) {
              falt[r.def.platsFalt] = r.text;
              sparade.push(r.def.etikett.toLowerCase());
            }
          }
          if (sparade.length) {
            onSparaPlats(event.ort, falt);
            setOverrides((o) => {
              const n = { ...o };
              for (const r of allaRader) if (somStandard.has(r.def.id)) delete n[r.def.id];
              return n;
            });
            setSomStandard(new Set());
          }
        }
        setResultat({
          typ: 'ok',
          utelamnade: utelamnade.map((r) => r.def.etikett.toLowerCase()),
          sparade,
        });
      } catch (e) {
        fonster?.close();
        setResultat({ typ: 'fel', text: e instanceof Error ? e.message : 'Okänt fel.' });
      }
    })();
  };

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
                    onPress={() => setOppet(r.def.id)}
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
        return (
          <section
            key={g.rubrik}
            aria-labelledby={rubrikId}
            className="flex min-w-0 flex-col gap-2"
          >
            <h2 id={rubrikId} className="px-4 font-semibold text-lg">
              {g.rubrik}
            </h2>
            <ul className={KORT_KLASS}>
              {g.rader.map((r) => {
                const varde = varderad(r);
                const inre = (
                  <>
                    {/* 21 + 24 px text hade gett 71 px; leading-5 (20 px) + gap-1 (4 px)
                        + py-3 (24 px) = 72 px — på 4 px-rytmen (DESIGN-SYSTEM-SPEC §3). */}
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-small text-text-muted leading-5">{r.def.etikett}</span>
                      {/* Saknat värde = handlingen i värdeplatsen (GOV.UK summary list
                          "Enter …"). Understruken text i textfärg — husets länkaffordans
                          (hem-listornas hover:underline), 14:1 mot kortet; guld mättes
                          till 2,36:1 (gold-500) resp. 4,49:1 (gold-700) och föll. */}
                      <span
                        className={`truncate text-body ${
                          r.tomt ? 'font-medium underline decoration-1 underline-offset-4' : ''
                        }`}
                        title={varde ?? undefined}
                      >
                        {varde ?? `Fyll i ${r.def.etikett.toLowerCase()}`}
                      </span>
                    </span>
                    {r.def.last ? (
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
                return (
                  <li key={r.def.id} data-block={r.def.id} className="flex flex-col">
                    {r.def.last ? (
                      <div className="flex items-center gap-3 py-3">{inre}</div>
                    ) : (
                      <button
                        type="button"
                        className={RAD_KLASS}
                        aria-label={`${r.tomt ? 'Fyll i' : 'Ändra'} ${r.def.etikett.toLowerCase()}`}
                        onClick={() => setOppet(r.def.id)}
                      >
                        {inre}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="flex flex-col gap-4">
        <p className="px-4 text-caption text-text-muted">
          Alltid med, oavsett event: {meta.fastForm}.
        </p>

        {resultat?.typ === 'ok' && (
          <MessageBox intent="success">
            {meta.namn}n är skapad och ligger nu bland eventets dokument, redo att bifogas i
            utskick.
            {resultat.utelamnade.length > 0 && ` Utan ${ochLista(resultat.utelamnade)}.`}
            {resultat.sparade.length > 0 &&
              ` ${event.ort} har nu ${ochLista(resultat.sparade)} som standard.`}{' '}
            <span className="text-text-muted">
              (Prototyp: dokumentet öppnades som sida i ett nytt fönster, ingen PDF sparas.)
            </span>
          </MessageBox>
        )}
        {resultat?.typ === 'fel' && <MessageBox intent="error">{resultat.text}</MessageBox>}

        <div className="flex flex-col gap-2">
          <Button intent="secondary" emphasis="outline" onPress={() => oppnaDokument(false)}>
            Förhandsgranska först
          </Button>
          <Button intent="primary" onPress={() => oppnaDokument(true)}>
            <FileText aria-hidden="true" size={16} className="shrink-0" />
            Skapa {meta.namn.toLowerCase()}
          </Button>
        </div>
      </div>

      {/* Redigeringen bor i en egen yta — villkorad rendering så utkastet är
          färskt per öppning (samma disciplin som RackviddsDialog). */}
      {oppenRad && (
        <BlockDialog
          key={oppenRad.def.id}
          rad={oppenRad}
          ort={event.ort}
          platsFinns={plats != null}
          somStandard={somStandard.has(oppenRad.def.id)}
          onSpara={(nytt, blirStandard) => {
            spara(oppenRad.def.id, nytt, blirStandard);
            setOppet(null);
          }}
          onStang={() => setOppet(null)}
        />
      )}
    </div>
  );
}

/**
 * Radens värde på EN rad — som det står i dokumentet för korta fält; för
 * löptext och agenda en beskrivning (M3: långa värden hör inte hemma som
 * trailing text — "reduce the amount of information shown"). Härkomsten
 * är tyst för det normala (standard) och syns bara i blockets egen yta.
 */
function varderad(r: Rad): string | null {
  if (r.tomt) return null;
  if (r.agenda) return agendaSammanfattning(r.agenda);
  switch (r.def.id) {
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

/* ------------------------------------------------------------------ *
 * BLOCKETS EGEN YTA — utkast tills Spara (M3/GOV.UK: en yta per fält,
 * Spara-verb, återgång till översikten; Avbryt/Escape kastar utkastet).
 * ------------------------------------------------------------------ */

function BlockDialog({
  rad,
  ort,
  platsFinns,
  somStandard,
  onSpara,
  onStang,
}: {
  rad: Rad;
  ort: string | null;
  platsFinns: boolean;
  somStandard: boolean;
  onSpara: (nytt: Override | null, blirStandard: boolean) => void;
  onStang: () => void;
}) {
  const { def } = rad;
  const harStandard = rad.standardText != null || rad.standardAgenda != null;

  // Utkastet startar från det som gäller (egen text före standard).
  const [text, setText] = useState(rad.text ?? '');
  const [agenda, setAgenda] = useState<AgendaRad[]>(
    rad.egen?.typ === 'agenda' ? rad.egen.rader : (rad.standardAgenda ?? []),
  );
  const [blirStandard, setBlirStandard] = useState(somStandard);

  const sparaUtkast = () => {
    if (def.agenda) {
      const rensade = agenda.filter((r) => r.text.trim());
      onSpara({ typ: 'agenda', rader: rensade }, false);
      return;
    }
    // Samma text som standarden = ingen egen text (följer standarden igen).
    const nytt: Override | null =
      rad.standardText != null && text === rad.standardText ? null : { typ: 'text', varde: text };
    onSpara(nytt, blirStandard && !!text.trim());
  };

  return (
    <Modal
      isOpen
      isDismissable
      onOpenChange={(open) => {
        if (!open) onStang();
      }}
    >
      <Dialog
        title={def.etikett}
        size="md"
        actions={
          <>
            <Button intent="secondary" emphasis="outline" onPress={onStang}>
              Avbryt
            </Button>
            <Button intent="primary" onPress={sparaUtkast}>
              Spara
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {def.agenda ? (
            <AgendaEditor rader={agenda} onChange={setAgenda} />
          ) : def.datum ? (
            <DatumEnkel
              label={def.etikett}
              iso={text}
              onChange={setText}
              hjalp={`I bilagan: "Resterande ${EVENTINNEHALL.resterandeBelopp} betalas senast ${
                datumUtanAr(text) || '…'
              }. Anmälan är bindande."`}
            />
          ) : (
            <TextArea
              label={def.etikett}
              hideLabel
              value={text}
              onChange={setText}
              rows={
                def.id === 'beskrivning' ? 8 : def.kalla === 'event' || def.id === 'plats' ? 2 : 5
              }
              placeholder={def.id === 'plats' ? 'Gatuadress och ort' : undefined}
            />
          )}

          {def.platsFalt && ort && (
            <Kryss
              label={`Använd som standard för ${ort}`}
              vald={blirStandard}
              onChange={setBlirStandard}
            >
              Använd som standard för {ort} framöver{platsFinns ? '' : ' (skapar platsen)'}
            </Kryss>
          )}

          <div className="flex items-start justify-between gap-3">
            <p className="text-caption text-text-muted">
              {rad.egen
                ? 'Egen text för det här eventet. Ändras standarden senare påverkas inte eventet.'
                : harStandard
                  ? 'Följer standarden. Ändras standarden senare markeras bilagan som inaktuell.'
                  : 'Ingen standard finns. Texten gäller bara det här eventet om du inte använder den som standard.'}
            </p>
            {rad.egen && harStandard && (
              <Button
                intent="secondary"
                emphasis="outline"
                size="sm"
                className="shrink-0"
                onPress={() => onSpara(null, false)}
              >
                Återgå till standard
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

/**
 * Ett enda datum — samma segment-form som husets `DatumFalt` (som är ett
 * intervall och därför inte passar här). ISO-sträng ut, så värdet kan bo i
 * samma `Override`-typ som texterna.
 */
function DatumEnkel({
  label,
  iso,
  onChange,
  hjalp,
}: {
  label: string;
  iso: string;
  onChange: (iso: string) => void;
  hjalp?: string;
}) {
  const segKlass =
    'rounded tabular-nums outline-none data-[focused]:bg-bg-emphasized data-[placeholder]:text-(color:--mm-input-text-placeholder)';
  let value: CalendarDate | null = null;
  try {
    value = iso ? parseDate(iso) : null;
  } catch {
    value = null;
  }
  // Svensk segmentordning (åååå-mm-dd) oavsett webbläsarens locale — samma
  // lokala I18nProvider som OmEventet sätter runt husets DatumFalt.
  return (
    <I18nProvider locale="sv-SE">
      <DateField
        aria-label={label}
        value={value}
        onChange={(v) => onChange(v ? v.toString() : '')}
        className="flex w-full flex-col gap-1"
      >
        <DateInput className="flex min-h-10 w-full items-center gap-0.5 rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 text-body">
          {(seg) => <DateSegment segment={seg} className={segKlass} />}
        </DateInput>
        {hjalp && <span className="text-caption text-text-muted">{hjalp}</span>}
      </DateField>
    </I18nProvider>
  );
}

/**
 * Agendan som radschema med EXPLICIT typ-ruta (beslut 3, § F): punkttext ·
 * valfri tid · kryss "meditation". Ingen textsniffning — krysset styr färgen.
 */
function AgendaEditor({
  rader,
  onChange,
}: {
  rader: AgendaRad[];
  onChange: (rader: AgendaRad[]) => void;
}) {
  const satt = (i: number, patch: Partial<AgendaRad>) =>
    onChange(rader.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const taBort = (i: number) => onChange(rader.filter((_, j) => j !== i));
  const laggTill = () => onChange([...rader, { text: '', tid: '', meditation: false }]);

  return (
    <div className="flex flex-col gap-2">
      <ul className="scrollbar-inline flex max-h-[40vh] flex-col divide-y divide-border overflow-y-auto">
        {rader.map((r, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: raderna saknar egen identitet — ordningen ÄR identiteten
          <li key={i} className="flex flex-col gap-2 py-2">
            <Input
              label={`Punkt ${i + 1}`}
              hideLabel
              size="sm"
              placeholder="Punkt"
              value={r.text}
              onChange={(v) => satt(i, { text: v })}
            />
            <div className="flex items-center gap-3">
              <Kryss
                label={`Meditation, punkt ${i + 1}`}
                vald={r.meditation}
                onChange={(v) => satt(i, { meditation: v })}
              >
                Meditation
              </Kryss>
              <Input
                label={`Tid, punkt ${i + 1}`}
                hideLabel
                size="sm"
                placeholder="Tid"
                className="ml-auto w-24"
                value={r.tid}
                onChange={(v) => satt(i, { tid: v })}
              />
              <Button
                intent="ghost"
                size="sm"
                className="size-9 shrink-0 p-0"
                aria-label={`Ta bort punkt ${i + 1}`}
                onPress={() => taBort(i)}
              >
                <X aria-hidden="true" size={14} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button
        intent="secondary"
        emphasis="outline"
        size="sm"
        className="self-start"
        onPress={laggTill}
      >
        <Plus aria-hidden="true" size={14} />
        Lägg till punkt
      </Button>
    </div>
  );
}
