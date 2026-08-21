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
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Files,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog as AriaDialog,
  Checkbox,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
} from 'react-aria-components';
import { datumSpannText } from '@/components/events/detail/datumSpann';
import { eventName } from '@/components/events/EventCard';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
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
  /* Rogers VERBATIM beskrivningstext ur `docs/mallar/bilagor/
     bekraftelsebilaga.html` — inte en forhandsvisning. Den forra fixturen
     var avkortad med ett ellipsis-tecken, vilket dolde att blockets egen
     yta klippte texten: Lotta maste se ALLT som hamnar i bilagan. */
  beskrivning:
    'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om medvetandet, både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt djupa meditationer. Vi går igenom helt nya medvetandemodeller som faktiskt kan förklara det som tidigare kallats för övernaturligt och paranormalt. I denna utbildning får du själv ta de första stegen på din resa i vårt gemensamma medvetande. Medvetandet är det centrala och du kommer både få göra praktiska övningar tillsammans med massor med konkreta tips, samtidigt som vi förklarar de djupare insikter som ligger bakom våra upplevelser i våra liv. Du behöver inga förberedande kunskaper eller erfarenheter, men du måste komma med ett mycket öppet sinne. I utbildningen har vi lagt ett starkt fokus på din egen upplevelse och din egen personliga resa i medvetandet. Boken Utanför Verkligheten ligger till grund för nya sätt att se på verkligheten genom att öppna upp ditt sinne för en helt ny värld och verklighet. Du kommer även att få lära dig om Additiv meditation, en meditationsteknik, som gör det möjligt att ta sig extremt djupt i medvetandet. Med en kombination av tusenårig kunskap och modern teknik kan man uppnå mentala tillstånd som helt klart bryter mot vad vi tror är begränsningar i verkligheten. Vi arbetar med mentala ankare och planerar intentioner. Du får tillfälle att fråga om precis vad som helst, exempelvis om synkronicitet, Akashi arkivet, reinkarnationsprocessen, eller om dina guider. Du kommer att i detalj få reda på hur du planerar och utför dina resor med hjälp av extrem meditation och en välfylld mental verktygslåda. Vi berättar om varför Punktmedvetandet är så viktigt för att uppnå högre mentala tillstånd. Du kommer att få en inblick varifrån kreativitet, inspiration och ökade mentala förmågor kommer.',
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
      return ei.beskrivning;
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
  ort,
  platsFinns,
  somStandard,
  onSpara,
  onStang,
}: {
  rader: Rad[];
  ort: string | null;
  platsFinns: boolean;
  somStandard: Set<BlockId>;
  onSpara: (andringar: { id: BlockId; nytt: Override | null; blirStandard: boolean }[]) => void;
  onStang: () => void;
}) {
  const falt = rader.filter((r) => !r.def.last);
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
      {rader.map((r) => (
        <li key={r.def.id} data-block={r.def.id} className="flex flex-col">
          {r.def.last ? (
            // Rubriken andras pa eventsidan, inte har — las-only i bada lagen.
            <div className="flex items-center gap-3 py-3">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-small text-text-muted leading-5">{r.def.etikett}</span>
                <span className="truncate text-body">{varderad(r)}</span>
              </span>
              <span aria-hidden="true" className="size-4 shrink-0" />
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-3">
              <span className="text-small text-text-muted leading-5" id={`morf-${r.def.id}`}>
                {r.def.etikett}
              </span>
              {r.def.datum ? (
                <DatumEnkel
                  label={r.def.etikett}
                  iso={utkast[r.def.id] ?? ''}
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
                  className="min-h-10"
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
                    {platsFinns ? '' : ' (skapar platsen)'}
                  </Kryss>
                </span>
              )}
            </div>
          )}
        </li>
      ))}
      {/* Spara/Avbryt pa Andra-radens plats och hojd — eventsidans morf. */}
      <li className="flex items-center justify-center gap-2 py-2">
        <Button size="sm" intent="primary" onPress={spara}>
          Spara
        </Button>
        <Button size="sm" intent="secondary" emphasis="outline" onPress={onStang}>
          Avbryt
        </Button>
      </li>
    </ul>
  );
}

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
  // Inforutan andras som SEKTION (eventsidans morf), inte block for block.
  const [morfar, setMorfar] = useState(false);
  const andraKnappRef = useRef<HTMLButtonElement>(null);
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

  /** Sektions-spara: samtliga fält som absoluta värden, ett anrop per block
      (naturligt idempotent — samma form som OmEventetForm.spara). */
  const sparaSektion = (
    andringar: { id: BlockId; nytt: Override | null; blirStandard: boolean }[],
  ) => {
    for (const a of andringar) spara(a.id, a.nytt, a.blirStandard);
    setMorfar(false);
    andraKnappRef.current?.focus();
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
        const arInforutan = g.rubrik === 'Inforutan';
        return (
          <section
            key={g.rubrik}
            aria-labelledby={rubrikId}
            className="flex min-w-0 flex-col gap-2"
          >
            <h2 id={rubrikId} className="px-4 font-semibold text-lg">
              {g.rubrik}
            </h2>
            {arInforutan && morfar ? (
              <InforutanMorf
                rader={g.rader}
                ort={event.ort}
                platsFinns={plats != null}
                somStandard={somStandard}
                onSpara={sparaSektion}
                onStang={() => {
                  setMorfar(false);
                  andraKnappRef.current?.focus();
                }}
              />
            ) : (
              <ul className={KORT_KLASS}>
                {g.rader.map((r) => {
                  const varde = varderad(r);
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
                {/* Inforutans Ändra-rad — eventsidans AndraRad, verbatim form
                  (py-3 + 24 px innehåll = 48 px, penna + centrerad text).
                  Bara denna grupp bär den: löptexten och agendorna ryms inte
                  i en sektionsmorf och behåller sin dialog. */}
                {arInforutan && (
                  <li className="py-3">
                    <button
                      ref={andraKnappRef}
                      type="button"
                      onClick={() => setMorfar(true)}
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

/* ------------------------------------------------------------------ *
 * DIALOGFORMEN
 * ------------------------------------------------------------------ */

/**
 * Panelklassen för husets dialogform: LÅST ÖVRE KANT och bredd, höjden
 * innehållsdriven upp till ett tak — inte `Modal`-primitivens `w-fit` +
 * fritt centrerade panel.
 *
 * VARFÖR FÖRANKRAD, mätt och inte tyckt (2026-08-21,
 * `test-results/matlagg.mjs` + `matpos.mjs`, 390x844, 5 varv per dialog):
 * med primitivens default fick de nio blockdialogerna ett HÖJDSPANN på
 * 298 px (282-580) och ett POSITIONSSPANN på 149 px (top 132-281) — varje
 * dialog landade på sin egen y och skalade från sin egen mittpunkt
 * (`transform-origin` y = halva höjden, uppmätt 141/157/170/186/206/290 px).
 *
 * Samma mätning falsifierade duration-hypotesen: Hem-svepets overlay, som
 * Marcus pekar ut som FÖREBILD, mäter 406 ms från klick till klar mot en
 * enkel blockdialogs 208 ms — nästan dubbelt så långsam, och ändå den som
 * upplevs lugn. Skillnaden är att svepet är förankrat och alltid öppnar
 * likadant (358x717, top 64 i samtliga fem varv). ANKRINGEN är axeln, inte
 * hastigheten.
 *
 * AVFÄRDAT UNDER VARVET, med bild som grund: en helt LÅST höjd
 * (`h-[min(76vh,600px)]`) gav visserligen spann 0/0, men lämnade en
 * enfältsdialog med ~500 px tom yta under sitt enda fält — konsekvent och
 * fult. Ankringen ger samma stabila startpunkt utan tomrummet: dialogen
 * växer nedåt från en fast kant och slutar där innehållet slutar.
 */
const DIALOG_PANEL_KLASS =
  'flex max-h-[min(76vh,600px)] w-(--mm-dialog-width-md) max-w-full origin-top flex-col overflow-hidden';

/** Fast avstånd till viewportens överkant — dialogens ankarpunkt. Sätts via
 *  `style` på `Modal`, eftersom scrimmens `items-center` är hårdkodad i
 *  primitiven (`Modal.tsx:32-34`) och inte kan nås med `className`. Samma
 *  väg som `Hem.tsx:93` redan använder för scrim-färgen. */
const DIALOG_ANKARE = { alignItems: 'flex-start', paddingTop: 'clamp(2rem, 12vh, 7rem)' } as const;

/**
 * Husets dialogform i tre zoner — prövad här före promovering (ADR-103).
 *
 * Rubriken och knappraden STÅR STILLA; bara bodyn rullar. Rubriken hamnar
 * därmed på exakt samma pixel i varje dialog (ankringen ovan), och
 * knappraden ligger alltid direkt under innehållet i stället för att
 * flyta i ett tomrum.
 *
 * Panelen bär `overflow-hidden` (se `DIALOG_PANEL_KLASS`) i stället för
 * primitivens `overflow-auto`, annars rullar rubrik och knappar ut ur bild
 * tillsammans med innehållet. Den dubbelrullningen — panelen OCH en inre
 * `max-h-[40vh]`-lista — var precis det som klippte agendan mitt i en rad.
 *
 * `Heading slot="title"` behålls ur primitiven: den ger `aria-labelledby`
 * automatiskt (KVALITETSDEFINITIONER checklist 6.1).
 */
function ProtoDialog({
  title,
  children,
  actions,
  ariaDescription,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  ariaDescription?: string;
}) {
  const rullRef = useRef<HTMLDivElement>(null);
  // Sant bara nar det FINNS orullat innehall nedanfor — se uttoningen nedan.
  const [merNedanfor, setMerNedanfor] = useState(false);

  useEffect(() => {
    const el = rullRef.current;
    if (!el) return;
    const mat = () =>
      setMerNedanfor(Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 1);
    mat();
    el.addEventListener('scroll', mat, { passive: true });
    // Innehallet andrar hojd nar en agendarad oppnas/stangs — ResizeObserver
    // pa rullytan fangar det utan att varje konsument behover rapportera in.
    const ro = new ResizeObserver(mat);
    ro.observe(el);
    for (const barn of Array.from(el.children)) ro.observe(barn);
    return () => {
      el.removeEventListener('scroll', mat);
      ro.disconnect();
    };
  }, []);

  return (
    <AriaDialog
      aria-description={ariaDescription}
      className="flex min-h-0 w-full flex-1 flex-col p-6 outline-none"
    >
      <Heading slot="title" className="shrink-0 text-xl">
        {title}
      </Heading>
      {/* -mx-6 + px-6: rullytans kant gar ut till panelkanten sa den lasas
          som en yta, medan innehallet behaller dialogens padding.
          Uttoningen gor en avskuren rad till en SIGNAL ("det finns mer") i
          stallet for ett renderingsfel — utan den klipptes agendans nionde
          punkt mitt i sin textrad. Den ar MATT villkorad, inte alltid pa:
          med innehallsdriven panelhojd slutar innehallet exakt vid
          rullytans nederkant nar det far plats, sa en ovillkorad mask hade
          tonat ut sista raden i VARJE dialog. */}
      <div
        ref={rullRef}
        className="scrollbar-inline -mx-6 mt-4 min-h-0 flex-1 overflow-y-auto px-6 text-body"
        style={
          merNedanfor
            ? { maskImage: 'linear-gradient(to bottom, black calc(100% - 1.5rem), transparent)' }
            : undefined
        }
      >
        {children}
      </div>
      <div className="mt-4 flex shrink-0 justify-end gap-3 border-border border-t pt-4">
        {actions}
      </div>
    </AriaDialog>
  );
}

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
      className={DIALOG_PANEL_KLASS}
      style={DIALOG_ANKARE}
      onOpenChange={(open) => {
        if (!open) onStang();
      }}
    >
      <ProtoDialog
        title={def.etikett}
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
        <div className="flex h-full flex-col gap-4">
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
            /* Loptexten visar ALLT: `autoGrow` (field-sizing-content) later
               rutan folja innehallet, och taket slacks sa dialogens body blir
               den enda rullytan. Utan det far Lotta en 16rem-lucka in i en
               1800 teckens text — hon kan inte se vad som hamnar i bilagan.
               MATT: forsta forsoket satte `max-h-none` rakt pa `className`
               och gjorde INGENTING (falt-hojd 256 av 1288 px innehall) —
               primitivens `className` gar till TextField-WRAPPERN, medan
               `<textarea>` bara far `textAreaVariants(...)`. Darav
               barnvarianten; en override-prop pa primitiven vore
               bibliotekskod och hor till promoveringen, inte hit. */
            <TextArea
              label={def.etikett}
              hideLabel
              autoGrow
              className={def.id === 'beskrivning' ? '[&_textarea]:max-h-none' : undefined}
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
      </ProtoDialog>
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
/** Den ÖPPNA agendaradens yta. Kant-i-kant mot panelen (`-mx-6`/`px-6`
 *  speglar dialogens padding) så raden läses som en ZON i listan, inte som
 *  en indragen ruta — och `border-t-transparent` släcker `divide-y`:ns
 *  linje just där, som annars skar tvärs över zonens överkant. */
const AGENDA_OPPEN_KLASS = '-mx-6 flex flex-col gap-3 border-t-transparent bg-bg-muted px-6 py-4';

/**
 * Agendan som LÄSLISTA med redigering per rad — inte fjorton formulär på
 * en gång.
 *
 * RADHÖJDEN ÄR LÅST TILL 72 px, samma grammatik som genereringsvyns egna
 * rader (`KORT_KLASS`-raderna ovan): en 24 px primärrad + `gap-1` (4 px) +
 * en 20 px `leading-5`-metarad + `py-3` (24 px). Metaraden RESERVERAS även
 * när punkten saknar meta (`min-h-5`) — annars blir raderna olika höga,
 * vilket är exakt det Marcus fällt två gånger.
 *
 * MEDITATION ÄR EN PUNKTTYP, INTE EN KRYSSRUTA. Den sätts när punkten
 * skapas ("Lägg till meditation") i stället för att varje rad ska bära en
 * kryssruta den nästan aldrig använder — 14 kryssrutor för 4 meditationer
 * är brus, och redigeringsraden blir smalare utan den.
 *
 * Den gamla formen monterade 42 fältkontroller samtidigt (28 `Input`, 14
 * `Kryss`) i tvåradsrader, 1301 px innehåll i en `max-h-[40vh]`-ruta som
 * kapade listan mitt i en rad. Uppmätt kostnad
 * (`test-results/matlagg.mjs`): 170 ms montering mot 44 ms för en
 * enfältsdialog — den enda innehållsberoende termen i hela mätserien.
 */
function AgendaEditor({
  rader,
  onChange,
}: {
  rader: AgendaRad[];
  onChange: (rader: AgendaRad[]) => void;
}) {
  // Bara EN rad är öppen i taget — listan förblir läsbar medan man ändrar.
  const [oppen, setOppen] = useState<number | null>(null);
  const satt = (i: number, patch: Partial<AgendaRad>) =>
    onChange(rader.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const taBort = (i: number) => {
    onChange(rader.filter((_, j) => j !== i));
    setOppen(null);
  };
  const laggTill = (meditation: boolean) => {
    onChange([...rader, { text: '', tid: '', meditation }]);
    setOppen(rader.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border border-border border-b">
        {rader.map((r, i) =>
          oppen === i ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: raderna saknar egen identitet — ordningen ÄR identiteten
            <li key={i} className={AGENDA_OPPEN_KLASS}>
              <Input
                label={`Punkt ${i + 1}`}
                hideLabel
                size="sm"
                autoFocus
                placeholder={r.meditation ? 'Vilken meditation?' : 'Vad händer på punkten?'}
                value={r.text}
                onChange={(v) => satt(i, { text: v })}
              />
              <div className="flex items-center gap-3">
                {r.meditation && <span className="text-caption text-text-muted">Meditation</span>}
                <Input
                  label={`Tid, punkt ${i + 1}`}
                  hideLabel
                  size="sm"
                  placeholder="Tid"
                  className="ml-auto w-24"
                  value={r.tid}
                  onChange={(v) => satt(i, { tid: v })}
                />
                {/* Husets raderaknapp, verbatim ur DokumentYta.tsx:1705-1712
                    (intent danger + emphasis subtle + size-11-ikonytan). */}
                <Button
                  intent="danger"
                  emphasis="subtle"
                  size="sm"
                  className="size-11 shrink-0 p-0"
                  aria-label={`Ta bort punkt ${i + 1}`}
                  onPress={() => taBort(i)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </Button>
                <Button
                  intent="secondary"
                  emphasis="outline"
                  size="sm"
                  onPress={() => setOppen(null)}
                >
                  Klar
                </Button>
              </div>
            </li>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: raderna saknar egen identitet — ordningen ÄR identiteten
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-3 text-left"
                onClick={() => setOppen(i)}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-body" title={r.text}>
                    {r.text || <span className="text-text-muted">Tom punkt</span>}
                  </span>
                  {/* Metaraden reserveras ALLTID — se docblockets 72 px-regel. */}
                  <span className="min-h-5 truncate text-caption text-text-muted leading-5">
                    {[r.meditation ? 'Meditation' : null, r.tid || null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" size={16} className="shrink-0 text-text-muted" />
              </button>
            </li>
          ),
        )}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button intent="secondary" emphasis="outline" size="sm" onPress={() => laggTill(false)}>
          <Plus aria-hidden="true" size={14} />
          Lägg till punkt
        </Button>
        <Button intent="secondary" emphasis="outline" size="sm" onPress={() => laggTill(true)}>
          <Plus aria-hidden="true" size={14} />
          Lägg till meditation
        </Button>
      </div>
    </div>
  );
}
