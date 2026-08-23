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
  datumUtanAr,
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
import type { UtkastTyp } from '@/data/adapters/DataSourceAdapter';
import { useForhandsgranskaBilaga } from '@/data/mutations/useForhandsgranskaBilaga';
import type { Event } from '@/domain/models/Event';
import { cn } from '@/lib/cn';
import { gorSjalvbarande } from './sjalvbarande';

/* ------------------------------------------------------------------ *
 * FIXTURER
 * ------------------------------------------------------------------ */

/**
 * Event-59, läst ur prod 2026-08-21 (`recqA2Us1FByBnibz`).
 *
 * [TASK-302.1] `id` är den RIKTIGA rec-formen (var `'proto-event-59'` innan
 * denna skiva) — `laggUtkast`/`test-docraptor-render` validerar `eventId`
 * mot Airtable-rec-formen (`isValidEventId`, `_shared/attachments.ts`,
 * SAMMA grind som `create-registration`/`create-event-note`) innan den
 * används som Storage-sökvägssegment. Storage-anropet slår aldrig upp
 * eventet i Airtable (till skillnad från t.ex. `upload-attachment`) — id:t
 * behöver bara ha RÄTT FORM, inte peka mot en rad som existerar i den bas
 * appen just nu pratar med. Ingen annan plats i filen bryr sig om
 * id-formen (enda övriga användningen är `EventValjare`s display-prop
 * `valtEventId`, som redan förväntar sig `rec…`-nycklar för riktiga event).
 */
const ARBOGA: Event = {
  id: 'recqA2Us1FByBnibz',
  eventlabel: 'Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31',
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

// AgendaRad UTBRUTEN (TASK-309.7) till `@/components/dokument/BlockDialog`
// — importerad ovan.

/**
 * Eventinnehåll för kombinationen Event "Resor i medvetandet 1" × Eventtyp
 * "Utbildning" (ORDLISTA § Eventinnehåll). Texten är mallens, verbatim.
 * Beskrivningen bor i mallens markup (fetade nyckelord) och hämtas därifrån
 * vid rendering; här bär vi bara en förhandsvisning av den.
 */
const EVENTINNEHALL = {
  etikett: 'Resor i medvetandet 1 · Utbildning',
  tid: 'kl. 10:00 - 17:00',
  pris: '2.500',
  anmalningsavgift: '1000:-',
  resterandeBelopp: '1500:-',
  /* Rogers VERBATIM beskrivningstext ur `docs/mallar/bilagor/
     bekraftelsebilaga.html` — inte en forhandsvisning. Den forra fixturen
     var avkortad med ett ellipsis-tecken, vilket dolde att blockets egen
     yta klippte texten: Lotta maste se ALLT som hamnar i bilagan. */
  beskrivning:
    'Utbildningen Resor i Medvetandet kommer att ge dig en djupare insikt om medvetandet, både genom att teoretiskt förklara vad vi är och att praktiskt öva i extremt djupa meditationer. Vi går igenom helt nya medvetandemodeller som faktiskt kan förklara det som tidigare kallats för övernaturligt och paranormalt. I denna utbildning får du själv ta de första stegen på din resa i vårt gemensamma medvetande. Medvetandet är det centrala och du kommer både få göra praktiska övningar tillsammans med massor med konkreta tips, samtidigt som vi förklarar de djupare insikter som ligger bakom våra upplevelser i våra liv.\n\nDu behöver inga förberedande kunskaper eller erfarenheter, men du måste komma med ett mycket öppet sinne. I utbildningen har vi lagt ett starkt fokus på din egen upplevelse och din egen personliga resa i medvetandet. Boken Utanför Verkligheten ligger till grund för nya sätt att se på verkligheten genom att öppna upp ditt sinne för en helt ny värld och verklighet.\n\nDu kommer även att få lära dig om Additiv meditation, en meditationsteknik, som gör det möjligt att ta sig extremt djupt i medvetandet. Med en kombination av tusenårig kunskap och modern teknik kan man uppnå mentala tillstånd som helt klart bryter mot vad vi tror är begränsningar i verkligheten. Vi arbetar med mentala ankare och planerar intentioner. Du får tillfälle att fråga om precis vad som helst, exempelvis om synkronicitet, Akashi arkivet, reinkarnationsprocessen, eller om dina guider. Du kommer att i detalj få reda på hur du planerar och utför dina resor med hjälp av extrem meditation och en välfylld mental verktygslåda. Vi berättar om varför Punktmedvetandet är så viktigt för att uppnå högre mentala tillstånd. Du kommer att få en inblick varifrån kreativitet, inspiration och ökade mentala förmågor kommer.',
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
    { text: 'Intention - Föreställning - Skapande', tid: '', meditation: false },
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

/**
 * [TASK-302.1] `MallId` → utkast-vägens `typ`-diskriminator
 * (`UtkastTyp`, `DataSourceAdapter.ts`) — `bekraftelse` ÄR en `bilaga`
 * (bekräftelsebilagan), `deltagarinfo` är `deltagarinformation`. Samma tre
 * enum-värden som `_shared/utkast.ts`s `UTKAST_TYPER`; `kvitto` hör till
 * Dokument-ytans klass C-väg (`TASK-302.2`, utanför denna prototyp).
 */
const MALL_TILL_UTKAST_TYP: Record<MallId, UtkastTyp> = {
  bekraftelse: 'bilaga',
  deltagarinfo: 'deltagarinformation',
};
// BlockId/BlockDef/Kalla/Grupp/INFORUTA_BAS/GRUPPER/INFORUTA_IDN UTBRUTNA
// (TASK-309.7, ADR-125 § 7) till `@/components/dokument/blockDefinitioner`
// — Mer-sidans Eventinnehåll-/Platser-ytor delar samma blockkarta, se den
// modulens filhuvud för hela motiveringen. Importerade ovan.

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

/**
 * "lördag-söndag den 31 oktober-1 november 2026". Förlagan skriver spannet
 * med tankstreck (–); vi skriver kort streck per `.langa-streck-policy.json`
 * (Marcus-beslut 2026-08-09: korta streck vinner även i datumspann, samma
 * rivning som `datumSpann.ts`). Avvikelsen mot förlagan är MEDVETEN och
 * ligger hos Marcus som fråga F8 i malldiff-rapporten (S108 resume 5).
 */
function datumText(event: Event): string | null {
  if (!event.startdatum) return null;
  const start = new Date(`${event.startdatum}T12:00:00`);
  const slut = event.slutdatum ? new Date(`${event.slutdatum}T12:00:00`) : start;
  if (slut.getTime() === start.getTime()) {
    return `${VECKODAG.format(start)} den ${DAG_MANAD.format(start)} ${AR.format(start)}`;
  }
  return `${VECKODAG.format(start)}-${VECKODAG.format(slut)} den ${DAG_MANAD.format(start)}-${DAG_MANAD.format(slut)} ${AR.format(slut)}`;
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

// Override/Rad UTBRUTNA (TASK-309.7) till `@/components/dokument/BlockDialog`
// — importerade ovan.

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

// NAV_TROSKEL/datumUtanAr UTBRUTNA (TASK-309.7) till
// `@/components/dokument/BlockDialog` — importerade ovan.

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

  /* STILEN INLINAS, den länkas inte. I ett `document.write`-fönster börjar
     `<img class="logga">` målas så fort taggen parsats — en EXTERN stilmall
     hämtas parallellt och hinner inte fram, så loggan visades en bildruta i
     SVG:ns egen storlek innan `.logga { width: 92mm }` slog till. Marcus,
     varv 17: *"typ hela deras logotyp på helskärm i en mikrosekund."*
     Med stilen i dokumentet finns måtten redan vid första målningen.
     `url()` i CSS:en löses fortfarande rätt: `<base>` pekar på samma katalog
     som stilmallen låg i, så relativa typsnitts- och bildvägar är oförändrade.
     Detta gör dessutom dokumentet självbärande — allt utom bilderna bor i
     filen, vilket en förhandsgranskning som ska kunna sparas behöver. */
  const stilLank = doc.querySelector('link[rel="stylesheet"]');
  if (stilLank) {
    const href = stilLank.getAttribute('href');
    if (href) {
      /* `?direct` är INTE dekoration — Vites dev-server serverar annars
         `.css` som en JAVASCRIPT-modul med HMR-wrapper (`import {
         createHotContext } from "/@vite/client"…`). Utan flaggan hamnade
         den JS-texten i `<style>`, gav noll giltiga regler, och loggan blev
         884 px PERMANENT i stället för en bildruta — fixen var värre än
         buggen tills det mättes. Verifierat mot dev-servern: utan flaggan
         börjar svaret med `import`, med den börjar det med CSS-kommentaren.
         Flaggan är harmlös för en vanlig statisk server (okänd query
         ignoreras); i skarp drift renderas mallen server-side (ADR-119) och
         den här vägen finns inte alls. */
      const cssSvar = await fetch(`${new URL(href, base.href).href}?direct`);
      const css = cssSvar.ok ? await cssSvar.text() : '';
      /* FAIL-SAFE: ser svaret inte ut som CSS behålls LÄNKEN. En bildrutas
         FOUC är ett skönhetsfel; ett dokument utan stil är trasigt. */
      if (css.includes('{') && !css.trimStart().startsWith('import ')) {
        const stil = doc.createElement('style');
        stil.textContent = css;
        stilLank.replaceWith(stil);
      }
    }
  }

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
      saknade: string[];
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
  /* Dialogen är EN transaktion, inte en rad i taget. Bläddrar Lotta mellan
     fälten skrivs varje rad till utkastet när hon lämnar den — och då måste
     Avbryt ångra HELA genomgången, inte bara raden hon råkar stå på. Samma
     semantik som Inforutans sektionsmorf: du ändrar flera fält, du ångrar
     sektionen. */
  const foreDialogen = useRef<{
    overrides: Partial<Record<BlockId, Override>>;
    somStandard: Set<BlockId>;
  } | null>(null);
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

  const oppnaBlock = (id: BlockId) => {
    foreDialogen.current = { overrides, somStandard };
    setOppet(id);
  };
  const stangDialog = () => {
    foreDialogen.current = null;
    setOppet(null);
  };
  /** Avbryt = tillbaka till läget innan dialogen öppnades, hur många rader
   *  som än hunnit skrivas av bläddringen. */
  const avbrytDialog = () => {
    const fore = foreDialogen.current;
    if (fore) {
      setOverrides(fore.overrides);
      setSomStandard(fore.somStandard);
    }
    stangDialog();
  };

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
  /* Bläddringen håller sig inom den grupp raden bor i — den är gruppens
     genomgång, inte hela bilagans. */
  const oppenGrupp = oppet ? rader.find((g) => g.rader.some((r) => r.def.id === oppet)) : undefined;
  const navSyskon = oppenGrupp ? dialogRader(oppenGrupp.rader) : [];

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

  /**
   * Skapar dokumentet som PDF; `skarpt` sparar dessutom platsens standard.
   *
   * ÖPPNAR INGENTING. Marcus 2026-08-22: *"Lotta ska inte skickas till
   * pdf:en automatiskt utan välja att gå dit."* Laddningen visas på knappen
   * i appen, och den färdiga PDF:en presenteras som ett val i resultatytan.
   *
   * Det tar dessutom bort behovet av den synkrona `window.open` som första
   * bygget bar (`DokumentYta` § IKONPAR-not): öppnandet sker nu i ett eget,
   * direkt klick, och en popup-blockerare har inget att invända mot det.
   */
  const skapaDokument = (skarpt: boolean) => {
    if (forhandsgranska.isPending) return;
    setResultat(null);
    forhandsgranska.mutate(
      {
        byggHtml: async () => await gorSjalvbarande(await renderaDokument(mall, event, allaRader)),
        namn: meta.namn,
        eventId: event.id,
        typ: MALL_TILL_UTKAST_TYP[mall],
      },
      {
        onSuccess: ({ url, saknade }) => {
          const sparade: string[] = [];
          if (skarpt && event.ort) {
            // Platsens standard sparas när bilagan skapas — inte när krysset sätts.
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
          /* DOKUMENTET ÖPPNAS DIREKT NÄR DET FINNS. Marcus 2026-08-22:
             "Kan inte bara ett nytt fönster öppnas när pdf finns, det är nog
             ännu bättre. Så gör alla proffs." Öppningen sker EFTER await,
             vilket den ursprungliga popup-regeln (`DokumentYta` § IKONPAR)
             sa var omöjligt — mätt 2026-08-22 att Chrome tillåter
             `window.open` även efter 7 s väntan, tre försök av tre.
             Mätningen gjordes dock i Playwrights Chromium, samma instrument
             som en gång bevisade den motsatta regeln, så utfallet behandlas
             som osäkert: blockeras fönstret returnerar `window.open` null,
             och då står "Öppna"-knappen kvar som väg in. Ingen
             återvändsgränd i något av fallen. */
          const fonster = window.open(url, '_blank');
          setResultat({
            typ: 'klar',
            skarpt,
            url,
            blockerad: fonster === null,
            utelamnade: skarpt ? utelamnade.map((r) => r.def.etikett.toLowerCase()) : [],
            sparade,
            saknade,
          });
        },
        onError: (e) => setResultat({ typ: 'fel', text: e.message }),
      },
    );
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
            aria-disabled={forhandsgranska.isPending}
            onPress={() => skapaDokument(false)}
          >
            {forhandsgranska.isPending && (
              <Loader2 aria-hidden="true" size={16} className="shrink-0 motion-safe:animate-spin" />
            )}
            {forhandsgranska.isPending ? 'Skapar PDF …' : 'Förhandsgranska först'}
          </Button>
          <Button
            intent="primary"
            aria-disabled={forhandsgranska.isPending}
            onPress={() => skapaDokument(true)}
          >
            <FileText aria-hidden="true" size={16} className="shrink-0" />
            Skapa {meta.namn.toLowerCase()}
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
            if (!open) avbrytDialog();
          }}
        >
          <BlockDialog
            rad={oppenRad}
            ort={event.ort}
            somStandard={somStandard.has(oppenRad.def.id)}
            syskon={navSyskon}
            resterandeBeloppHjalp={EVENTINNEHALL.resterandeBelopp}
            onVaxla={(id, nytt, blirStandard) => {
              spara(oppenRad.def.id, nytt, blirStandard);
              setOppet(id);
            }}
            onSpara={(nytt, blirStandard) => {
              spara(oppenRad.def.id, nytt, blirStandard);
              stangDialog();
            }}
            onStang={avbrytDialog}
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

// DIALOG_PANEL_KLASS/DIALOG_ANKARE/ProtoDialog/BlockDialog/DatumEnkel/
// AGENDA_OPPEN_KLASS/AgendaEditor UTBRUTNA (TASK-309.7, ADR-125 § 7) till
// `@/components/dokument/BlockDialog` — VERBATIM flytt, ingen formändring.
// Importerade ovan. Se den modulens filhuvud för fullständig motivering.
