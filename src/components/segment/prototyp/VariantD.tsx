/**
 * [PROTOTYPE] S104 divergens — VARIANT D: SYNTESEN. KASTBAR KOD.
 *
 * Född på Marcus-beslut 2026-08-10 (`ADR-074` identitetsmodellen: fler
 * varianter föds endast så). Marcus gillade alla tre och bad om en
 * kombination — det utfall `/prototype` UI.md pekar ut som det vanligaste och
 * mest värdefulla ur ett divergens-pass.
 *
 * INSIKTEN SOM BÄR VARIANTEN: `a`/`b`/`c` är inte tre svar på samma fråga.
 * De är tre ÄRENDEN Lotta har vid olika tillfällen. Marcus verifierade
 * frekvensordningen: skapar sällan men i skov · KONTROLLERAR ALLTID · skickar
 * till samma segment återkommande. Alltså **skicka > kontrollera > skapa**.
 *
 *   c som HEM          entitetslistan — den handling som görs oftast, kortast väg
 *   b som DETALJENS    publikvyn är huvudinnehållet, synlig direkt, aldrig
 *     HUVUDINNEHÅLL    bakom en fällning (kontroll är förstklassig)
 *   a som REDIGERING   regelverkstaden som egen yta — får kosta, ska vara tydlig
 *
 * Syntesen är MINDRE på skärmen än `a`, inte större: `a`s mätta svaghet
 * (~5 500 px med 5 par, flera skärmar i prod) kom av att allt bodde på en yta.
 * Uppdelningen ärver regelbygget utan att ärva längdproblemet.
 *
 * PLUS DEN NYA REGELFORMEN (Marcus-beslut 2026-08-10, ADR-klass):
 * predikat över dimensioner i stället för uppräkning av kurs-par. Se
 * variantens egen mappnings-konstant för hur familj/nivå simuleras tills
 * basstrukturen byggts.
 *
 * Fullständig märkning, frågan och det bindande premissunderlaget:
 * `src/components/segment/SegmentPrototyp.tsx` +
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md` +
 * sessionsdok S104 Del 2 (besluten).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FYRA YTOR, INGA NYA ROUTES (samma grepp som `c`: internt `vy`-tillstånd)
 *
 *   lista   — HEM. Segmenten som entiteter. `c`s EventCard-anatomi.
 *   detalj  — `c`s EventDetail-ram MED `b`s publikvy som HUVUDINNEHÅLL.
 *   regel   — `a`s regelverkstad, byggd på den NYA predikat-formen.
 *   utskick — `c`s eget steg i `a`s inline-sändgrammatik.
 *
 * DET FINNS INGEN GENVÄG FÖRBI KONTROLLEN — och det kostar inte ett klick.
 * Listkortet har medvetet INGEN "skicka"-knapp: vägen till ett utskick går
 * alltid genom detaljsidan, och detaljsidan ÄR publiken. Marcus "kontrollerar
 * alltid" blir därmed formens default i stället för en disciplin han måste
 * hålla. `c` hade samma snitt av ett annat skäl (`TASK-145.3`: det som
 * VERKSTÄLLER bor på sin egen yta) — här sammanfaller de.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MULTI-SEGMENT (ärvt ur `c`, Marcus godkände uttryckligen att det prövas)
 *
 * `resolveSegmentMembers` unionerar redan över flera segment och dedupar på
 * person-ID (`supabase/functions/_shared/segment-resolution.ts:185-212`); det
 * är UI:t som begränsar till ett. Markera-läget i listan tar N segment vidare
 * till utskicksvyn, som speglar EF:ens beteende exakt: en `useQueries` per
 * valt segment på SAMMA cache-nyckel som listan/detaljen (regelns signatur →
 * ett redan räknat segment kostar noll extra walks), union på `member.id`.
 *
 * TVÅ SAKER GÖR FUNKTIONEN VÄRD ATT HA, och utan dem är den skadlig:
 *   1. ÖVERLAPPSRADEN. "24 personer" ur två segment om 15 och 12 är ett tal
 *      Lotta inte kan kontrollräkna; skillnaden mot 27 är exakt den tysta
 *      feltyp ett utskick inte får bära. Raden säger båda talen och vad de
 *      betyder ("… finns i flera segment och får ETT mail").
 *   2. VAKTEN MOT TYST UNDERRÄKNING. Unionen byggs ur N oberoende walks, och
 *      en som fallerar bidrar med noll medlemmar UTAN att synas. Talet blir
 *      falskt och bekräftelse-grinden hade låst upp mot det falska talet. Med
 *      ETT segment är felet självrapporterande (noll mottagare); med flera är
 *      det tyst. Därför: talet döljs, `MessageBox intent="error"`, sändningen
 *      låst tills alla walks svarat.
 *
 * MED ETT SEGMENT KOSTAR FUNKTIONEN NOLL RADER. Segmentets namn står redan i
 * utskicksvyns underrubrik; segment-gruppen renderas först vid två eller fler.
 *
 * BYPASSAR MARKERA-LÄGET KONTROLLEN? Nej — det FLYTTAR den. Det finns ingen
 * detaljsida för en union av segment (unionen är inte en entitet), så unionens
 * publik måste granskas där den uppstår. Utskicksvyn bär `PublikSektion` i
 * exakt samma form som detaljsidan: hela publiken, visningsfilter, sök. Regeln
 * "ingen genväg förbi kontrollen" håller alltså i båda vägarna.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REGELFORMEN — predikat, inte uppräkning
 *
 * `SegmentRuleSchema` är i dag en FRUSEN LISTA av `(kurs, modalitet)`-par.
 * När RIM 4 lanseras omfattas den inte av något befintligt segment: segmentet
 * fortsätter fungera men betyder inte längre vad användaren tror. Sju
 * branschverktyg uttrycker i stället segment som PREDIKAT över attribut
 * (`docs/research/dynamiska-segmentregler-branschmonster-2026-08-10.md`).
 *
 * Fem dimensioner beslutades (Marcus 2026-08-10): familj · nivå · modalitet ·
 * format · år. FYRA ÄR BYGGDA. Familj och nivå FINNS INTE i basen än och
 * simuleras här ur `KURS_KARTA`.
 *
 * ÅR-DIMENSIONEN ÄR RIVEN UR PREDIKAT-UI:T — den kunde inte göra det den såg
 * ut att göra. Motorns finaste kornighet är PARET `(kurs, modalitet)`:
 * `AttendanceRow = {personId, kurs, modalitet}` bär ingen tidpunkt
 * (`segment-membership.ts:18`), källfrågan hämtar bara tre fält
 * (`segment-resolution.ts:36` — `Person (länk)`, `Kursnamn (lookup)`,
 * `Event typ`), och `parseSegmentRule` avvisar allt som inte är `Par[]`
 * (`segment-membership.ts:104-113`). En årsangivelse kunde därför bara smalna
 * av VILKA KURSER som räknas, inte vilka TILLFÄLLEN — så "alla som gick något
 * under 2025" gick inte att uttrycka, medan ytan såg ut att erbjuda det. En
 * halv funktion som ser ut att göra en sak men gör en annan är sämre än ingen
 * funktion, och det är samma tysta felklass som modalitets-kravet finns för
 * att avskaffa. Den bor nu som EF-KRAV i stället (se `AR_EF_KRAV`).
 *
 * MODALITET ÄR OBLIGATORISK I VARJE VILLKOR — säkerhetskrav, inte preferens.
 * Marcus: *"det finns material som är direkt olämpligt att skicka till
 * människor som enbart gått föreläsning."* Ett nyskapat villkor har därför
 * INGEN modalitet vald: det är ogiltigt, det räknas inte, och sändningen är
 * låst tills någon aktivt valt. "Båda" är ett av tre likvärdiga val — aldrig
 * en tystnad. Det finns en verklig instans av felet: det nu raderade
 * segmentet "FS-deltagare (fjärrskådning)" BESKREVS som utbildning men körde
 * ett rollup-fält som blandar båda modaliteterna (S104 Del 2).
 *
 * Hur det inte blev tjatigt, tre grepp:
 *   1. Modaliteten är villkorets VERB och står i klartext-meningen under varje
 *      villkor ("… som utbildning"). Den läses varje gång utan att frågas igen.
 *   2. Den är den ENDA radioraden bland chip-raderna — formskillnaden säger
 *      "detta är ett beslut", utan ett ord.
 *   3. Säkerhetsmotiveringen visas BARA medan valet saknas. Har man valt är
 *      den borta; ett villkor man byggt klart nagg-påminner aldrig.
 *
 * VARNING VID BLANDAD MODALITET (Marcus-order 2026-08-10, tillägg under bygget):
 * kravet ovan har två halvor. Den obligatoriska modaliteten hindrar att en
 * blandning uppstår av MISSTAG; granskningens fördelningsruta hindrar att den
 * passerar OSEDD när den uppstått med avsikt ("Båda", eller två villkor med
 * olika modalitet). Se `useModalitetsFordelning` för mekaniken.
 *
 * FYND FÖR PRD:N — `compute-segment` BORDE SVARA MED KVALIFICERINGEN.
 * Svaret bär i dag `{id, namn, email, ejGodkandMail}` per medlem, alltså inte
 * VILKA PAR personen kvalificerade sig genom. Fördelningen går därför bara att
 * få fram genom att ställa en ANDRA fråga till samma motor och jämföra
 * mängderna på person-ID. Det fungerar, men det är ett symptom: bar svaret en
 * `via: Par[]` per medlem vore fördelningen gratis, den skulle behöva noll
 * extra körningar, och den kunde dessutom svara på frågor prototypen inte kan
 * ställa alls ("vilken kurs gjorde henne till medlem?"). Kravet hör hemma i
 * PRD:n som ett EF-krav, inte som en klient-lösning.
 *
 * EXPANSIONEN SKER I KLIENTEN (prototypens genväg): `compute-segment`
 * validerar strikt mot `{include: Par[], exclude: Par[]}` och avvisar allt
 * annat, så predikatet slås upp mot taxonomin och skickas som par-lista.
 * ANTALET OCH PERSONERNA ÄR DÄRMED ÄKTA — bara mekanismen är simulerad. I den
 * skarpa lösningen MÅSTE servern äga expansionen, annars faller T50:s
 * mottagarkontroll (klienten skulle då bestämma vilka som nås).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SKALPROVET (ärvt ur `b`) — variantens tes går inte att bedöma utan det.
 *
 * Detaljvyns hela idé är att publiken är huvudinnehållet, synlig direkt. Men
 * staging ger 1–2 personer med avstämd närvaro, så chunkningen (25),
 * visningsfiltret och söket har aldrig setts arbeta — och det är precis det
 * som ska bedömas. Skalprovet är en AVSTÄNGD-SOM-DEFAULT växel som fyller
 * publiken till 85 med `@exempel.invalid`-personer.
 *
 * `b`s disciplin ärvs oavkortat: skalprovet FYLLER UT en verklig publik, det
 * SKAPAR ingen (villkoret är `raMedlemmar.length > 0`), och en påhittad publik
 * som ser äkta ut är värre än ingen publik alls — därför en varningsruta som
 * inte går att missa, överallt publiken visas. Rivs med prototypen.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ-ONLY FÖRSTÄRKT: `saveSegment`, `sendEmail` och testmail är no-op-
 * stubbar. Filen når ingen mutation — varken prod eller staging. Läsvägarna
 * (`fetchEvents`, `listSegments`, `computeSegment`) går via `useDataSource()`
 * (ADR-055/057); adapter-gränsen kringgås aldrig.
 */
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ListPlus,
  MailCheck,
  Pencil,
  Plus,
  Send,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { DetaljGrupp, EtikettVardeRad } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { Skeleton } from '@/components/primitives/Skeleton';
import { TextArea } from '@/components/primitives/TextArea';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type { Modalitet, Par, SegmentMember, SegmentRule } from '@/domain/schemas';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';

/* ================================================================== *
 * DIMENSIONSMODELLEN — den nya regelformens råmaterial
 * ================================================================== */

type Familj = 'RIM' | 'Fjärrskådning' | 'Psionautics';
type Niva = 'intro' | '1' | '2' | '3';

/**
 * [SIMULERAR KOMMANDE BASSTRUKTUR — Marcus-bekräftad 2026-08-10]
 *
 * Familj och nivå finns INTE som fält i Airtable-basen i dag. Beslutet
 * (S104 Del 2, punkt 2: *"Basen ska leverera vad appen vill ha, punkt!"*) är
 * att de ska byggas — två nya fält på Eventplanering. Tills dess bor
 * mappningen här, som en hårdkodad konstant, och INGEN annanstans.
 *
 * Nakna "Resor i medvetandet" hör till RIM-familjen som nivå `intro` men är en
 * FÖRELÄSNING (fälla #35: det är ett distinkt kursnamn, skilt från RIM
 * 1/2/3-serien). Just det paret är hela skälet till att modaliteten måste
 * anges separat: familj + nivå räcker inte för att veta vad någon faktiskt
 * gått igenom.
 *
 * PROTOTYPENS EGEN LUCKA, öppet: en kurs UTANFÖR kartan får ingen familj och
 * matchar därför inget familj-villkor. Det är precis den tysta ruttnandet
 * predikat-formen finns för att avskaffa — i basen sätts fältet när kursen
 * skapas, och RIM 4 omfattas då automatiskt. Ytan säger det själv (se
 * `OkandaKurser`), i stället för att låta kursen försvinna tyst.
 */
const KURS_KARTA: Record<string, { familj: Familj; niva: Niva | null }> = {
  Fjärrskådning: { familj: 'Fjärrskådning', niva: null },
  'Resor i medvetandet': { familj: 'RIM', niva: 'intro' },
  'Resor i medvetandet 1': { familj: 'RIM', niva: '1' },
  'Resor i medvetandet 2': { familj: 'RIM', niva: '2' },
  'Resor i medvetandet 3': { familj: 'RIM', niva: '3' },
  Psionautics: { familj: 'Psionautics', niva: null },
};

/** Fast ordning — aldrig alfabetisk, aldrig härledd ur datan (deterministisk UI). */
const FAMILJER: Familj[] = ['RIM', 'Fjärrskådning', 'Psionautics'];
const NIVAER: Niva[] = ['intro', '1', '2', '3'];
const NIVA_ETIKETT: Record<Niva, string> = {
  intro: 'Intro',
  '1': 'Nivå 1',
  '2': 'Nivå 2',
  '3': 'Nivå 3',
};

/** Familjer där nivå är meningsfull. FS och Psionautics är nivålösa (beslut 4). */
const FAMILJER_MED_NIVA: Familj[] = ['RIM'];

/**
 * Format-dimensionen. `Eventformat` bär i dag "Utbildning - 2 dagar" (46 event)
 * och "Föreläsning" (4) — dimensionen är alltså DEGENERERAD (1:1 med `Typ`),
 * men strukturen är rätt och blir meningsfull när fler format tillkommer
 * (S104 Del 2). `get-events` exponerar inte fältet, så prototypen härleder det
 * ur modaliteten enligt den kända 1:1-relationen i stället för att gissa.
 */
const FORMAT_FOR_MODALITET: Record<Modalitet, string> = {
  Utbildning: 'Utbildning - 2 dagar',
  Föreläsning: 'Föreläsning',
};

/** Modalitetsvalet i ett villkor. `null` = INTE VALT — villkoret är då ogiltigt. */
type ModalitetsVal = Modalitet | 'Båda';

const MODALITET_ORD: Record<ModalitetsVal, string> = {
  Utbildning: 'utbildning',
  Föreläsning: 'föreläsning',
  Båda: 'utbildning eller föreläsning',
};

/**
 * ÅR-DIMENSIONEN SOM EF-KRAV, INTE SOM KONTROLL.
 *
 * Texten står i regelverkstaden där dimensionen annars hade suttit. Att skriva
 * ut vad ytan INTE kan är billigare än att låta någon upptäcka det efter ett
 * utskick — och kravet ska med i PRD:n, inte lösas i klienten.
 */
const AR_EF_KRAV = {
  rubrik: 'Tidsperiod går inte att välja än',
  brod:
    'En regel kan i dag säga VAD någon gått igenom, inte NÄR. Motorn räknar per kurs ' +
    'och form - den vet inte vilket tillfälle någon var på. "Alla som gick något under 2025" ' +
    'går därför inte att uttrycka, och en årsknapp här hade i själva verket valt KURSER som ' +
    'råkade gå det året. Det är en annan fråga, och sannolikt inte den någon ställer.',
  krav:
    'Kravet hör hemma i servern: deltagandets datum måste följa med i källfrågan och ' +
    'regeln bära ett tidsfönster. Då blir tidsperioden en riktig dimension.',
} as const;

/**
 * ETT VILLKOR = ett predikat över dimensionerna. Tom lista på en dimension
 * betyder "alla värden" — UTOM modaliteten, som aldrig får vara osagd.
 *
 * INGEN `ar`-gren: se `AR_EF_KRAV` + filhuvudet. Dimensionen är riven ur
 * predikatet därför att motorn inte kan bära den, inte därför att den saknar
 * värde.
 */
type Villkor = {
  id: string;
  familjer: Familj[];
  nivaer: Niva[];
  /** OBLIGATORISK. `null` = användaren har inte valt än → villkoret räknas inte. */
  modalitet: ModalitetsVal | null;
  format: string[];
};

/** Regeln som predikat: en union i `med`, en union i `utan`. */
type Predikat = { med: Villkor[]; utan: Villkor[] };

let villkorRaknare = 0;
function nyttVillkor(): Villkor {
  villkorRaknare += 1;
  return {
    id: `v${villkorRaknare}`,
    familjer: [],
    nivaer: [],
    modalitet: null,
    format: [],
  };
}

/* ================================================================== *
 * TAXONOMIN BERIKAD — bron mellan predikatet och `compute-segment`
 * ================================================================== */

/** Ett taxonomi-par med sina dimensionsvärden. `familj: null` = utanför kartan. */
type ParInfo = {
  par: Par;
  nyckel: string;
  familj: Familj | null;
  niva: Niva | null;
  format: string;
};

/**
 * Berikar `deriveTaxonomy`-paren med dimensionerna.
 *
 * INGET ÅR HÄRLEDS HÄR LÄNGRE. Första formen samlade eventens `Startdatum` per
 * par — men ett år knutet till ett PAR kan bara svara på "vilka kurser gick
 * 2025", aldrig på "vem gick något 2025", eftersom motorns rader inte bär
 * någon tidpunkt alls. Datan fanns; frågan den kunde besvara var fel fråga.
 */
function byggParInfo(events: Event[]): ParInfo[] {
  return deriveTaxonomy(events).map((par) => {
    const kartlagt = KURS_KARTA[par.kurs];
    return {
      par,
      nyckel: parKey(par),
      familj: kartlagt?.familj ?? null,
      niva: kartlagt?.niva ?? null,
      format: FORMAT_FOR_MODALITET[par.modalitet],
    };
  });
}

function villkorGiltigt(v: Villkor): boolean {
  return v.modalitet !== null;
}

/** Matchar ett villkor ett par? Tom dimension = alla värden. */
function matchar(v: Villkor, p: ParInfo): boolean {
  if (v.modalitet === null) return false;
  if (v.modalitet !== 'Båda' && p.par.modalitet !== v.modalitet) return false;
  if (v.familjer.length > 0 && (p.familj === null || !v.familjer.includes(p.familj))) return false;
  if (v.nivaer.length > 0 && (p.niva === null || !v.nivaer.includes(p.niva))) return false;
  if (v.format.length > 0 && !v.format.includes(p.format)) return false;
  return true;
}

function traffar(v: Villkor, parInfo: ParInfo[]): ParInfo[] {
  return villkorGiltigt(v) ? parInfo.filter((p) => matchar(v, p)) : [];
}

/**
 * EXPANSIONEN — predikat → `{include, exclude}` som EF:en faktiskt validerar.
 * Unionen dedupas på par-nyckeln: två villkor som råkar träffa samma kurs ger
 * ett par, inte två (EF:ens `parseSegmentRule` bryr sig inte, men en dubblett
 * i klartexten hade läst som ett fel).
 */
function expandera(pred: Predikat, parInfo: ParInfo[]): SegmentRule {
  const plocka = (villkor: Villkor[]): Par[] => {
    const karta = new Map<string, Par>();
    for (const v of villkor) {
      for (const p of traffar(v, parInfo)) karta.set(p.nyckel, p.par);
    }
    return [...karta.values()];
  };
  return { include: plocka(pred.med), exclude: plocka(pred.utan) };
}

/** Deterministisk signatur → query-nyckel + "har regeln ändrats"-jämförelse. */
function regelSignatur(rule: SegmentRule): string {
  const nycklar = (pars: Par[]) => pars.map(parKey).sort();
  return JSON.stringify({ include: nycklar(rule.include), exclude: nycklar(rule.exclude) });
}

/* ── Klartext ─────────────────────────────────────────────────────── */

function listaOrd(delar: string[], bindeord = 'eller'): string {
  if (delar.length <= 1) return delar[0] ?? '';
  return `${delar.slice(0, -1).join(', ')} ${bindeord} ${delar.at(-1)}`;
}

/**
 * Ett villkor som svensk mening. Modaliteten står ALLTID med — den är
 * meningens verb-komplement och därmed omöjlig att läsa förbi.
 */
function villkorKlartext(v: Villkor): string {
  if (v.modalitet === null) return 'Ofullständigt villkor - modalitet saknas.';
  const familj =
    v.familjer.length === 0 ? 'någon kurs' : listaOrd(v.familjer.map((f) => `${f}-kurs`));
  const niva = v.nivaer.length === 0 ? '' : ` på ${listaOrd(v.nivaer.map((n) => NIVA_ETIKETT[n]))}`;
  const modalitet = ` som ${MODALITET_ORD[v.modalitet]}`;
  const format = v.format.length === 0 ? '' : ` i formatet ${listaOrd(v.format)}`;
  return `Deltagit i ${familj}${niva}${modalitet}${format}.`;
}

function predikatKlartext(pred: Predikat): string {
  const giltiga = (lista: Villkor[]) => lista.filter(villkorGiltigt);
  const med = giltiga(pred.med);
  const utan = giltiga(pred.utan);
  if (med.length === 0) return 'Ingen regel byggd än.';
  const medText = `Med: ${med.map((v) => villkorKlartext(v).replace(/\.$/, '')).join('. Eller: ')}.`;
  if (utan.length === 0) return medText;
  return `${medText} Utan: ${utan.map((v) => villkorKlartext(v).replace(/\.$/, '')).join('. Eller: ')}.`;
}

/* ================================================================== *
 * ENTITETEN
 * ================================================================== */

type SegmentEntitet = {
  id: string;
  namn: string;
  /** `null` = sparad i basen i den ÄLDRE uppräknade formen (migrations-sömmen). */
  predikat: Predikat | null;
  /** Satt när `predikat === null`: regeln som den ligger i basen. */
  arvdRegel: SegmentRule | null;
  /** `true` = finns inte i basen. */
  skiss: boolean;
};

function regelFor(entitet: SegmentEntitet, parInfo: ParInfo[]): SegmentRule {
  if (entitet.predikat) return expandera(entitet.predikat, parInfo);
  return entitet.arvdRegel ?? { include: [], exclude: [] };
}

function definitionFor(entitet: SegmentEntitet, parInfo: ParInfo[]): string {
  if (entitet.predikat) return predikatKlartext(entitet.predikat);
  const rule = regelFor(entitet, parInfo);
  if (rule.include.length === 0) return 'Uppräknad regel utan inkluderade kurser.';
  const med = `Med: ${rule.include.map(labelForPar).join(' ELLER ')}.`;
  return rule.exclude.length > 0
    ? `${med} Utan: ${rule.exclude.map(labelForPar).join(' ELLER ')}.`
    : med;
}

/**
 * SKISS-SEGMENTEN — byggda ur RIKTIG taxonomi, i den NYA formen.
 *
 * `Segment`-tabellen i prod är tom sedan 2026-08-10 (Marcus rensade alla
 * testsegment), och staging bär bara CI-fixturer med UUID-namn — som dessutom
 * filtreras bort ur vyn. Utan skisser går formen inte att bedöma.
 *
 * Deras ANTAL räknas på riktigt med samma `compute-segment` som en sparad rad:
 * **posten är påhittad, aldrig siffran.** Den invarianten är hela skälet till
 * att skisserna får finnas, och den gäller även efter att märkningen per kort
 * togs bort (Marcus 2026-08-10) — förbehållet står nu EN gång, i
 * `PrototypNot` under listan, i stället för som en pill på varje rad.
 *
 * Urvalet visar fem saker på en gång: familjeregeln som automatiskt omfattar
 * RIM 4 · nivåurval · en uteslutning · och PARET
 * "Fjärrskådning - bara utbildning" / "Fjärrskådning - alla, oavsett form".
 *
 * Just det paret är passets skarpaste demonstration. Det raderade segmentet
 * "FS-deltagare (fjärrskådning)" BESKREVS som utbildning men körde ett
 * rollup-fält som blandar båda modaliteterna — det gjorde alltså inte vad
 * dess egen beskrivning påstod (S104 Del 2). Här är båda avsikterna
 * uttryckbara, de heter olika, de ger olika publik, och den blandade får en
 * fördelningsruta i granskningen. Skillnaden går inte längre att råka ut för.
 */
function byggSkisser(parInfo: ParInfo[]): SegmentEntitet[] {
  const familjerIBasen = new Set(
    parInfo.map((p) => p.familj).filter((f): f is Familj => f !== null),
  );
  const ut: SegmentEntitet[] = [];

  const skiss = (id: string, namn: string, pred: Predikat) =>
    ut.push({ id, namn, predikat: pred, arvdRegel: null, skiss: true });

  if (familjerIBasen.has('RIM')) {
    skiss('skiss-rim-alla', 'RIM - alla utbildningsnivåer', {
      med: [{ ...nyttVillkor(), familjer: ['RIM'], modalitet: 'Utbildning' }],
      utan: [],
    });
    skiss('skiss-rim-erfarna', 'RIM - erfarna (nivå 2 och 3)', {
      med: [{ ...nyttVillkor(), familjer: ['RIM'], nivaer: ['2', '3'], modalitet: 'Utbildning' }],
      utan: [],
    });
  }
  if (familjerIBasen.has('Fjärrskådning')) {
    skiss('skiss-fs-utbildning', 'Fjärrskådning - bara utbildning', {
      med: [{ ...nyttVillkor(), familjer: ['Fjärrskådning'], modalitet: 'Utbildning' }],
      utan: [],
    });
    // SYSKONET till raden ovan — samma familj, andra avsikten, uttryckt som
    // ett aktivt "Båda". Det är den som utlöser granskningens fördelningsruta.
    skiss('skiss-fs-alla', 'Fjärrskådning - alla, oavsett form', {
      med: [{ ...nyttVillkor(), familjer: ['Fjärrskådning'], modalitet: 'Båda' }],
      utan: [],
    });
  }
  if (familjerIBasen.has('RIM') && familjerIBasen.has('Fjärrskådning')) {
    skiss('skiss-bredd', 'Har gått RIM men aldrig Fjärrskådning', {
      med: [{ ...nyttVillkor(), familjer: ['RIM'], modalitet: 'Båda' }],
      utan: [{ ...nyttVillkor(), familjer: ['Fjärrskådning'], modalitet: 'Båda' }],
    });
  }
  return ut;
}

/* ================================================================== *
 * DELAD GRAMMATIK — klassrader ärvda ur Event-familjen (G2)
 * ================================================================== */

const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';
const TILLBAKA_KLASS =
  'mx-4 flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted hover:bg-bg-emphasized motion-safe:transition-colors';
const KAPSEL_KLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors';

function personform(n: number): string {
  return n === 1 ? 'person' : 'personer';
}

function visatNamn(m: { namn: string | null }): string {
  return m.namn?.trim() || '(namn saknas)';
}

/** Fyller `{förnamn}`/`{namn}` ur EN NAMNGIVEN mottagare + rapporterar ofyllda. */
function fyllPlatshallare(mall: string, mottagare: SegmentMember | undefined) {
  const text = mottagare
    ? mall
        .replaceAll('{förnamn}', visatNamn(mottagare).split(' ')[0] ?? '')
        .replaceAll('{namn}', visatNamn(mottagare))
    : mall;
  return { text, ofyllda: [...new Set(text.match(/\{[^}]+\}/g) ?? [])] };
}

/** Fokus till `<h1>` vid vybyte OCH när data anlänt; rullning till toppen. */
function useVyFokus(rubrikRef: React.RefObject<HTMLHeadingElement | null>, dataKlart: boolean) {
  const senaste = useRef('');
  useEffect(() => {
    const nyckel = dataKlart ? 'data' : 'mount';
    if (senaste.current === nyckel) return;
    senaste.current = nyckel;
    rubrikRef.current?.focus();
  }, [dataKlart, rubrikRef]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

function SidRam({
  onTillbaka,
  tillbakaEtikett,
  children,
}: {
  onTillbaka?: () => void;
  tillbakaEtikett: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      {onTillbaka ? (
        <button
          type="button"
          onClick={onTillbaka}
          aria-label={tillbakaEtikett}
          className={`${TILLBAKA_KLASS} print:hidden`}
        >
          <ChevronLeft aria-hidden="true" size={26} />
        </button>
      ) : (
        <Link to="/mer" aria-label={tillbakaEtikett} className={`${TILLBAKA_KLASS} print:hidden`}>
          <ChevronLeft aria-hidden="true" size={26} />
        </Link>
      )}
      {children}
    </section>
  );
}

function PrototypNot({ children }: { children?: React.ReactNode }) {
  return (
    <p className="text-small text-text-muted">
      <strong className="font-medium">Prototyp.</strong> Inget sparas, inget skickas.{' '}
      {children ?? null}
    </p>
  );
}

/* ================================================================== *
 * MEDLEMSFRÅGAN — lat, delad på regelns signatur
 * ================================================================== */

type Medlemssvar = { members: SegmentMember[]; count: number };

/**
 * Nyckeln är REGELNS SIGNATUR, inte segmentets ID: två segment med samma
 * expanderade regel delar då walk, och vägen lista → detalj → tillbaka →
 * utskick kostar EN walk. `compute-segment` går igenom hela `Deltaganden`
 * (~1012 rader) och får aldrig hamras. Utskicksvyns `useQueries` bygger på
 * SAMMA fabrik — det är därför ett redan räknat segment kostar noll där.
 *
 * TOM REGEL BESVARAS LOKALT, inte med en avstängd fråga. `computeMembership`
 * ger tom OR ⇒ ingen kvalificerar (`segment-membership.ts:58`), så svaret är
 * känt utan walk. Skillnaden spelar roll i unionen: en avstängd fråga står
 * kvar som `isPending` för evigt, och multi-segmentets vakt ("alla walks har
 * svarat") hade då aldrig kunnat släppa igenom sändningen.
 */
function medlemsFraga(
  dataSource: ReturnType<typeof useDataSource>,
  rule: SegmentRule,
): { queryKey: unknown[]; queryFn: () => Promise<Medlemssvar>; staleTime: number } {
  return {
    queryKey: ['proto-d', 'compute', regelSignatur(rule)],
    queryFn: () =>
      rule.include.length === 0
        ? Promise.resolve({ members: [], count: 0 })
        : dataSource.computeSegment(rule),
    staleTime: 5 * 60_000,
  };
}

function useMedlemmar(rule: SegmentRule, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Medlemssvar>({ ...medlemsFraga(dataSource, rule), enabled: aktiv });
}

/* ================================================================== *
 * LISTAN — HEM
 * ================================================================== */

/**
 * TVÅ LÄGEN, SAMMA GEOMETRI (`c` ← `Deltagare.tsx § MarkerbartKort`): i
 * markera-läget ÄR kortet en rå RAC `Checkbox`, med grön KANT som urvals-
 * bärare — kanten, inte plattan, eftersom plattan mäter 1,05:1 mot vitt och
 * därmed inte kan bära WCAG 1.4.1 ensam.
 */
function SegmentKort({
  entitet,
  definition,
  antal,
  raknar,
  markeraLage,
  vald,
  onOppna,
  onVaxla,
}: {
  entitet: SegmentEntitet;
  definition: string;
  antal: number | undefined;
  raknar: boolean;
  markeraLage: boolean;
  vald: boolean;
  onOppna: () => void;
  onVaxla: (vald: boolean) => void;
}) {
  const innehall = (
    <>
      {/* `pr-16` är borta med pillen — den fanns bara för att hålla undan
          rubriken från den absolut placerade etiketten uppe till höger. */}
      {markeraLage ? (
        <span className="line-clamp-2 font-semibold text-body">{entitet.namn}</span>
      ) : (
        <button
          type="button"
          onClick={onOppna}
          className="line-clamp-2 text-left font-semibold text-body after:absolute after:inset-0"
        >
          {entitet.namn}
        </button>
      )}
      <span className="flex items-start gap-1.5 text-small">
        <Filter
          aria-hidden="true"
          size={14}
          className="mt-1 shrink-0 text-text-secondary print:hidden"
        />
        <span className="line-clamp-2 text-text-secondary">{definition}</span>
      </span>
      {/* ANTALET KOMMER AV SIG SJÄLVT — Räkna-knappen är RIVEN (Marcus
          2026-08-10). `b` mätte att en löpande räknad publik kostar ETT
          `compute-segment`-anrop per UNIK regel (frågan nycklas på regelns
          signatur, inte på segmentets id), så kortets tal är inte dyrare än
          knappen var — bara ärligare.

          ÄR TALET ÄNNU INTE KÄNT STÅR RADEN TOM, inte "Antal ej räknat".
          Den texten beskrev appens interna tillstånd, inte segmentet, och det
          enda den sa Lotta var att något inte gjorts. Höjden är ändå låst
          (`min-h-8`) så ingenting flyttar sig när talet landar.

          Live-regionen är ALLTID monterad och byter bara innehåll — en
          `aria-live` som monteras samtidigt som sin text annonseras inte. */}
      <div className="flex min-h-8 flex-wrap items-center gap-1.5">
        <span
          aria-live="polite"
          className="flex items-center gap-1.5 text-caption text-text-secondary"
        >
          {raknar ? (
            <>
              <Users aria-hidden="true" size={14} className="shrink-0" />
              Räknar…
            </>
          ) : antal === undefined ? null : (
            <>
              <Users aria-hidden="true" size={14} className="shrink-0" />
              {antal === 0
                ? '0 personer - inga med genomförd närvaro ännu'
                : `${antal} ${personform(antal)}`}
            </>
          )}
        </span>
      </div>
      {/* SKISS-PILLEN ÄR RIVEN (Marcus 2026-08-10, samma beslut som rev
          "Sparade i basen"-grupperingen). Med CI-fixturerna bortfiltrerade är
          VARJE kort i listan en skiss, så pillen satt på alla och skilde
          ingenting åt — den gjorde bara att listan inte gick att bedöma som
          den yta Lotta möter. Att prototypen inte sparar något står kvar en
          gång, i `PrototypNot` under listan, i stället för på varje rad. */}
    </>
  );

  if (markeraLage) {
    return (
      <li className="flex">
        <Checkbox
          isSelected={vald}
          onChange={onVaxla}
          className={`relative flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl border p-4 motion-safe:transition-colors ${
            vald
              ? 'border-(--mm-success) bg-(--mm-success-bg) contrast-more:border-(--mm-success)'
              : 'border-transparent bg-bg-muted hover:bg-bg-emphasized contrast-more:border-border-strong'
          }`}
        >
          {innehall}
        </Checkbox>
      </li>
    );
  }

  return (
    <li className="relative flex flex-col gap-1.5 rounded-2xl border border-transparent bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong">
      {innehall}
    </li>
  );
}

function SegmentKortMedAntal(props: {
  entitet: SegmentEntitet;
  parInfo: ParInfo[];
  markeraLage: boolean;
  vald: boolean;
  onOppna: () => void;
  onVaxla: (vald: boolean) => void;
}) {
  const rule = regelFor(props.entitet, props.parInfo);
  // ALLTID PÅ (`true`), aldrig bakom ett klick. Kostnaden bärs av frågans
  // nyckel, inte av en spärr: `medlemsFraga` nycklar på REGELNS SIGNATUR med
  // 5 min `staleTime`, så N kort med samma regel delar ETT anrop och ett
  // återbesök kostar noll. Tom regel besvaras lokalt utan nätanrop.
  const { data, isFetching } = useMedlemmar(rule, true);
  return (
    <SegmentKort
      entitet={props.entitet}
      definition={definitionFor(props.entitet, props.parInfo)}
      antal={data?.count}
      raknar={isFetching && data === undefined}
      markeraLage={props.markeraLage}
      vald={props.vald}
      onOppna={props.onOppna}
      onVaxla={props.onVaxla}
    />
  );
}

/**
 * LANDNINGSVYN. Entiteterna ÄR sidan (`c`s tes) — EN lista, ingen gruppering.
 *
 * Formen bar tidigare två block, "Sparade i basen" och "Skisser". Marcus rev
 * den 2026-08-10 av ett skäl som gäller hela ytan: grupperingen fanns bara för
 * prototypens skull, och i skarp drift finns den inte. En yta som ska bedömas
 * som Lottas yta får inte bära vår egen bokföring i rubrikform.
 *
 * Tomläget står kvar och är fortfarande ärligt — det renderas när listan är
 * tom, aldrig ovanpå ett fel (ett tomläge är ett påstående om basen, och
 * misslyckas hämtningen VET vi inte om den är tom).
 */
function SegmentLista({
  poster,
  parInfo,
  laddar,
  fel,
  markeraLage,
  valda,
  onOppna,
  onNytt,
  onOppnaMarkering,
  onStangMarkering,
  onVaxla,
  onMarkeraAlla,
  onRensa,
  onSkicka,
}: {
  poster: SegmentEntitet[];
  parInfo: ParInfo[];
  laddar: boolean;
  fel: Error | null;
  markeraLage: boolean;
  valda: ReadonlySet<string>;
  onOppna: (id: string) => void;
  onNytt: () => void;
  onOppnaMarkering: () => void;
  onStangMarkering: () => void;
  onVaxla: (id: string, vald: boolean) => void;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  onSkicka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, !laddar);

  const markerbara = poster.length;
  const allaValda = markerbara > 0 && valda.size === markerbara;

  const kortLista = (poster: SegmentEntitet[]) => (
    <ul className="flex flex-col gap-3">
      {poster.map((e) => (
        <SegmentKortMedAntal
          key={e.id}
          entitet={e}
          parInfo={parInfo}
          markeraLage={markeraLage}
          vald={valda.has(e.id)}
          onOppna={() => onOppna(e.id)}
          onVaxla={(v) => onVaxla(e.id, v)}
        />
      ))}
    </ul>
  );

  return (
    <section className="flex flex-col gap-6 pt-2 lg:pt-10">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Segment
        </h1>
        <p className="text-small text-text-muted">
          Grupper av personer du sparar och återanvänder. Öppna ett segment för att se vilka som är
          i det - och skicka därifrån. Flera segment i ett utskick: markera dem.
        </p>
      </header>

      <div className="flex flex-col gap-6 px-4">
        {/* EN RAD, ALLTID NÄRVARANDE (`c` ← `Deltagare.tsx § MarkeringsBatchBar`,
            `TASK-145.3` AC #1): läget växlas genom en horisontell utvidgning,
            aldrig en vertikal förskjutning. Läges-knappen är förankrad höger i
            BÅDA lägena och flyttar sig aldrig — den är ankaret man backar ur
            läget med; handlingarna växer ut från vänster och tar "Nytt
            segment"s plats, för mitt i ett urval är att skapa något nytt inte
            det man håller på med.

            PRIMÄRKNAPPEN VERKSTÄLLER ALDRIG. "Skicka utskick" tar urvalet
            VIDARE till utskicksvyn — där publiken står som huvudinnehåll,
            precis som på detaljsidan. Kontrollen hoppas inte över; den utförs
            på den enda yta där en union av segment finns. */}
        <div className="flex min-h-10 flex-wrap items-center gap-2 print:hidden">
          {markeraLage ? (
            <>
              <Button intent="primary" size="sm" isDisabled={valda.size === 0} onPress={onSkicka}>
                Skicka utskick
              </Button>
              <Button intent="secondary" size="sm" isDisabled={allaValda} onPress={onMarkeraAlla}>
                Markera alla
              </Button>
              {valda.size > 0 && (
                <Button intent="ghost" size="sm" onPress={onRensa}>
                  Rensa
                </Button>
              )}
              {/* Kort räknare av mätt skäl (`c`s fynd: full mening wrapade
                  raden och fick listan att hoppa). Skärmläsaren får ändå hela
                  meningen via `aria-atomic` + `sr-only`-tillägget. */}
              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-small text-text-secondary tabular-nums"
              >
                {valda.size} av {markerbara}
                <span className="sr-only"> segment markerade</span>
              </span>
            </>
          ) : (
            <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
              <ListPlus aria-hidden="true" size={18} className="shrink-0" />
              Nytt segment
            </button>
          )}
          {markerbara > 0 && (
            <button
              type="button"
              onClick={markeraLage ? onStangMarkering : onOppnaMarkering}
              className={`${KAPSEL_KLASS} ml-auto`}
            >
              <Check aria-hidden="true" size={18} className="shrink-0" />
              {markeraLage ? 'Avbryt' : 'Markera'}
            </button>
          )}
        </div>

        {fel && (
          <MessageBox intent="error" title="Kunde inte hämta sparade segment">
            {fel.message}
          </MessageBox>
        )}

        {laddar ? (
          // Skeleton i listans SLUTGEOMETRI — datalandningen flyttar ingenting.
          <div role="status" aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">Laddar segment…</span>
            {['a', 'b', 'c'].map((k) => (
              <div
                key={k}
                className="flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-4"
              >
                <Skeleton variant="text" className="w-1/2 text-body" />
                <Skeleton variant="text" className="w-3/4 text-small" />
                <div className="flex min-h-8 items-center">
                  <Skeleton variant="text" className="w-24 text-caption" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {fel ? null : poster.length === 0 ? (
              // TOMLÄGET, på riktigt: basen bär inga segment. Strukturerat och
              // lugnt (`EventsList.tsx § body`) — ingenting har gått fel.
              //
              // DET RENDERAS ALDRIG OVANPÅ ETT FEL. Första formen gjorde det,
              // och renderingspasset visade varför det är fel: felrutan och
              // "Inga sparade segment än" stod under varandra och sa två olika
              // saker om samma sak. Misslyckas hämtningen VET vi inte om basen
              // är tom — och ett tomläge är ett påstående, inte en reservbild.
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <p className="font-medium text-body">Inga sparade segment än</p>
                <p className="max-w-prose text-small text-text-muted">
                  Ett segment är en grupp personer du kan skicka till om och om igen. Du bygger det
                  som en regel - och regeln fortsätter gälla när nya kurser tillkommer.
                </p>
                <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
                  <ListPlus aria-hidden="true" size={18} className="shrink-0" />
                  Skapa ditt första segment
                </button>
              </div>
            ) : (
              // EN LISTA, INGEN GRUPPERING (Marcus 2026-08-10). Tidigare stod
              // korten under "Sparade i basen" respektive "Skisser". Två fel i
              // ett: "basen" är vårt ord — Lotta vet inte att det finns en
              // Airtable-bas och ska inte behöva veta — och distinktionen är en
              // PROTOTYP-egenskap. I skarp drift är varje rad i listan riktig,
              // och då finns ingen gruppering att göra. Ytan gick alltså inte
              // att bedöma som den yta den ska bli.
              //
              // Att inget här sparas på riktigt står kvar EN gång, i
              // `PrototypNot` under listan — inte på varje kort.
              kortLista(poster)
            )}

            <PrototypNot>
              Segmenten ovan är byggda ur riktig taxonomi i den nya regelformen. Posterna är
              påhittade - antalen är det inte: de räknas mot samma källa som en sparad rad.
            </PrototypNot>
          </>
        )}
      </div>
    </section>
  );
}

/* ================================================================== *
 * PUBLIKEN — detaljvyns huvudinnehåll (`b`s tes)
 * ================================================================== */

type PublikVy = 'alla' | 'far' | 'undertryckt';

const CHUNK = 25;

function farMailet(m: SegmentMember): boolean {
  return Boolean(m.email) && !m.ejGodkandMail;
}

/* ── SKALPROVET (ärvt ur `b`) ──────────────────────────────────────────────
   Staging bär 1–2 personer med avstämd närvaro. Chunkningen, visningsfiltret
   och söket finns i koden men har aldrig setts arbeta — och att PÅSTÅ att
   formen skalar utan att kunna visa det vore precis den obelagda sortens
   anspråk hela passet handlar om att inte göra.

   `b`s disciplin ärvs oavkortat: skalprovet FYLLER UT en verklig publik, det
   SKAPAR ingen. Det är ett INSTRUMENT, inte data, och det säger det själv. */
const SKALPROV_MAL = 85;
const SKALPROV_FORNAMN = [
  'Anna',
  'Bengt',
  'Cecilia',
  'David',
  'Elin',
  'Fredrik',
  'Gunilla',
  'Håkan',
  'Ingrid',
  'Johan',
  'Karin',
  'Lars',
  'Maria',
  'Niklas',
  'Olga',
  'Per',
  'Quintus',
  'Rebecka',
  'Sven',
  'Tova',
  'Ulf',
  'Vera',
  'Wilma',
  'Yvonne',
  'Zara',
  'Åsa',
  'Ärling',
  'Örjan',
];
const SKALPROV_EFTERNAMN = [
  'Andersson',
  'Bergström',
  'Carlsson',
  'Dahl',
  'Ek',
  'Forsberg',
  'Gustafsson',
  'Hedlund',
  'Isaksson',
  'Jonsson',
  'Karlsson',
  'Lind',
];

/**
 * Deterministiskt utfyllda exempelpersoner (`b`s form). Var sjunde saknar
 * e-post och var elfte har tackat nej — så att de undertryckta faktiskt finns
 * att titta på i listan, i visningsfiltret och i granskningens varningar.
 */
function byggSkalprov(befintliga: number): SegmentMember[] {
  const ut: SegmentMember[] = [];
  for (let i = befintliga; i < SKALPROV_MAL; i += 1) {
    const f = SKALPROV_FORNAMN[i % SKALPROV_FORNAMN.length] ?? 'Exempel';
    const e = SKALPROV_EFTERNAMN[(i * 5) % SKALPROV_EFTERNAMN.length] ?? 'Person';
    ut.push({
      id: `skalprov-${i}`,
      namn: `${f} ${e}`,
      email: i % 7 === 3 ? null : `${`${f}.${e}`.toLowerCase()}@exempel.invalid`,
      ejGodkandMail: i % 11 === 5,
    });
  }
  return ut;
}

/**
 * FYLLER UT, SKAPAR ALDRIG. En tom publik förblir tom även med skalprovet på —
 * annars hade instrumentet svarat på en fråga ingen ställt ("hur ser 85 av
 * ingenting ut?") och samtidigt dolt fälla #34:s tomläge, som är en av de
 * former som faktiskt ska bedömas.
 */
function fyllUt(medlemmar: SegmentMember[], skalprov: boolean): SegmentMember[] {
  if (!skalprov || medlemmar.length === 0) return medlemmar;
  return [...medlemmar, ...byggSkalprov(medlemmar.length)];
}

/** Skalprovets egna, påhittade personer — aldrig underlag för en äkta kontroll. */
function arPahittad(m: SegmentMember): boolean {
  return m.id.startsWith('skalprov-');
}

/**
 * Instrumentet, i `PrototypRigg`s streckade formspråk: samma visuella klass
 * säger "detta är riggen, inte ytan" utan att det behöver skrivas.
 */
function SkalprovsVaxel({ aktivt, onVaxla }: { aktivt: boolean; onVaxla: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border border-dashed p-3 print:hidden">
      <p className="text-caption text-text-muted">
        <strong className="font-medium">Prototyp-rigg.</strong> Staging har för lite avstämd närvaro
        för att visa hur publiken beter sig i den storlek den är byggd för.
      </p>
      {/* PÅ/AV MÅSTE VARA OMISSKÄNNLIGT. Första formen lånade `PrototypRigg`s
          dämpade markering (`bg-bg-emphasized`) — men den fungerar bara i ett
          treval där något ALLTID är valt och de tre jämförs med varandra. En
          ensam växel har inget att jämföras med, och skärmdumpen visade det:
          påslaget läste som avslaget. Här gäller variantens egen chip-grammatik
          i stället (`ValChip`): vald = `bg-text`, oval = synlig kant på
          `bg-surface` — kanten, aldrig plattan, är WCAG-bäraren. */}
      <div className="flex">
        <ValChip vald={aktivt} onTryck={() => onVaxla(!aktivt)}>
          Skalprov: fyll publiken till {SKALPROV_MAL} personer
        </ValChip>
      </div>
    </div>
  );
}

/**
 * NORMEN ÄR TYST: den som får mailet bär inget märke. Bara avvikelsen märks,
 * och den bärs av TEXT + ikon (`StatusBadge`), aldrig av färg ensam.
 *
 * `endastForelasning` är INGEN avvikelse i leveransmening — personen får
 * mailet precis som alla andra — utan en upplysning om VAD hon faktiskt gått
 * igenom. Den bär därför ett neutralt textpill utan ton, inte en `StatusBadge`:
 * samma skillnad `a` gjorde mellan "fel" och "annan härkomst".
 */
function PersonRad({
  medlem,
  endastForelasning,
}: {
  medlem: SegmentMember;
  endastForelasning?: boolean;
}) {
  return (
    <li className="flex break-inside-avoid items-center gap-3 rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 contrast-more:border-border-strong">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-body">{visatNamn(medlem)}</span>
          {endastForelasning && (
            <span className="shrink-0 rounded-full border border-transparent bg-surface px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong">
              Bara föreläsning
            </span>
          )}
          {!medlem.email && (
            <StatusBadge ton="warning" storlek="sm">
              Saknar e-post
            </StatusBadge>
          )}
          {medlem.email && medlem.ejGodkandMail && (
            <StatusBadge ton="warning" storlek="sm">
              Tackat nej till utskick
            </StatusBadge>
          )}
        </span>
        <span className="truncate text-small text-text-muted">{medlem.email ?? '—'}</span>
      </span>
    </li>
  );
}

/**
 * PUBLIKEN SOM SIDANS HUVUDINNEHÅLL — variantens viktigaste ställningstagande.
 *
 * `c` la mottagarlistan i en `DetaljGrupp` långt ned; `a` bakom en fällning.
 * Här står den direkt under den primära åtgärden, med visningsfilter och sök
 * — `b`s grepp, oförändrat. Skälet är Marcus frekvensordning: han
 * KONTROLLERAR ALLTID. Det som görs varje gång får inte kosta ett klick.
 *
 * Skalan bärs som i `b`: sammanfattningen svarar utan att man läser en rad,
 * visningsfiltret isolerar avvikelserna, söket är vägen till EN person, och
 * listan chunkas i steg om 25.
 *
 * VAD CHUNKEN FAKTISKT GÖR, mätt vid 85 personer (skalprovet, 2026-08-10):
 * hela publiken ligger i DOM:en och de bortom chunken döljs med `hidden
 * print:contents` — det är så papperet får alla rader utan en egen kodväg.
 * Chunken sparar alltså MÅLNING och SIDHÖJD, inte DOM-noder: 3 217 px vid
 * första chunken mot 7 766 px utfälld. (En tidigare formulering här påstod
 * "så DOM:en är liten"; det var fel, och det syntes först när skalprovet
 * gjorde 85 personer möjliga att mäta.)
 */
function PublikSektion({
  medlemmar,
  isPending,
  isError,
  error,
  endastForelasning,
  skalprov,
  onSkalprov,
}: {
  medlemmar: SegmentMember[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** Person-ID:n som kvalificerat sig UTAN någon utbildning (granskningsvyn). */
  endastForelasning?: ReadonlySet<string>;
  /** Skalprovet påslaget — publiken är då delvis påhittad. */
  skalprov?: boolean;
  /** Satt = växeln bor på DENNA yta. Utelämnad = bara varningen följer med hit. */
  onSkalprov?: (v: boolean) => void;
}) {
  const [vy, setVy] = useState<PublikVy>('alla');
  const [sok, setSok] = useState('');
  const [visade, setVisade] = useState(CHUNK);

  const sokTerm = sok.trim().toLocaleLowerCase('sv-SE');
  const synliga = useMemo(
    () =>
      medlemmar
        .filter((m) => (vy === 'alla' ? true : vy === 'far' ? farMailet(m) : !farMailet(m)))
        .filter((m) =>
          sokTerm === ''
            ? true
            : visatNamn(m).toLocaleLowerCase('sv-SE').includes(sokTerm) ||
              (m.email ?? '').toLocaleLowerCase('sv-SE').includes(sokTerm),
        ),
    [medlemmar, vy, sokTerm],
  );

  // Chunken nollställs när underlaget byter karaktär — annars pekar "Visa 25
  // till" på en lista som inte finns längre.
  const underlag = `${medlemmar.length}|${vy}|${sokTerm}`;
  const forra = useRef(underlag);
  useEffect(() => {
    if (forra.current === underlag) return;
    forra.current = underlag;
    setVisade(CHUNK);
  }, [underlag]);

  if (isError) {
    return (
      <div className="px-4">
        <MessageBox intent="error" title="Kunde inte räkna publiken">
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      </div>
    );
  }

  return (
    <section aria-labelledby="grupp-publik" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4">
        <h2 id="grupp-publik" className="font-semibold text-lg">
          Publiken
        </h2>
        {/* RÄKNAREN SYNS BARA NÄR DEN HAR NÅGOT ATT SÄGA — och den säger
            "matchar", inte "visar". Skalprovet avslöjade kollisionen: vid 85
            personer stod "Visar 85 av 85" här samtidigt som chunk-foten sa
            "25 av 85 visade", två nästan identiska meningar om två helt olika
            saker (filtrets utfall respektive hur många som är målade). Nu bär
            den ena ordet "matchar" och den andra "visade", och en ofiltrerad
            lista upprepar inte ett tal som redan står i sidhuvudet. */}
        {!isPending && medlemmar.length > 0 && synliga.length !== medlemmar.length && (
          <span className="text-small text-text-secondary">
            {synliga.length} av {medlemmar.length} matchar
          </span>
        )}
      </div>

      {/* Skalprovet får ALDRIG gå obemärkt förbi (`b`s regel) — en påhittad
          publik som ser äkta ut är värre än ingen publik alls. Rutan följer
          med till VARJE yta som visar publiken, även den där växeln inte bor. */}
      {skalprov && (
        <div className="px-4">
          <MessageBox intent="warning" title="Skalprov påslaget - publiken är delvis påhittad">
            <p>
              Personerna med adressen <code>@exempel.invalid</code> finns inte. Växeln är ett
              mätinstrument och sitter under publikens filter på segmentets sida.
            </p>
            <p>
              Kontroller som bygger på verklig kurshistorik - fördelningen mellan utbildning och
              föreläsning - räknar bara de verkliga personerna.
            </p>
          </MessageBox>
        </div>
      )}

      {isPending ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2 px-4">
          <span className="sr-only">Räknar publiken…</span>
          {['a', 'b', 'c', 'd', 'e'].map((k) => (
            <div
              key={k}
              className="flex flex-col gap-1 rounded-xl border border-transparent bg-bg-muted px-4 py-2.5"
            >
              <Skeleton variant="text" className="w-2/5 text-body" />
              <Skeleton variant="text" className="w-3/5 text-small" />
            </div>
          ))}
        </div>
      ) : medlemmar.length === 0 ? (
        // FÄLLA #34: noll träffar är NEUTRALT, aldrig ett fel. Golvet
        // (Närvaropoäng=1) lättas medvetet inte (ADR-064 beslut 4a).
        <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
          <p className="font-medium text-body">0 personer matchar</p>
          <p className="max-w-prose text-small text-text-muted">
            Inga med genomförd närvaro ännu. Närvaron för de kurser regeln träffar är inte avstämd i
            basen - publiken fylls av sig själv när den blir det.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-4 print:hidden">
            <ToggleButtonGroup<PublikVy>
              label="Visa i publiken"
              spread
              selectedKey={vy}
              onSelectionChange={setVy}
            >
              <ToggleButton id="alla">Alla</ToggleButton>
              <ToggleButton id="far">Får mailet</ToggleButton>
              <ToggleButton id="undertryckt">Undertrycks</ToggleButton>
            </ToggleButtonGroup>
            {medlemmar.length > 10 && (
              <Input
                label="Sök i publiken"
                hideLabel
                size="sm"
                value={sok}
                onChange={setSok}
                placeholder="Sök namn eller e-post i publiken…"
                description="Söker i den redan hämtade publiken - kostar inget serveranrop."
              />
            )}
            {/* VÄXELN BOR DÄR PUBLIKEN BOR, sist bland dess kontroller: den
                är ett instrument för att bedöma listan, inte ett filter över
                den. Den syns bara när det FINNS en publik att fylla ut. */}
            {onSkalprov && <SkalprovsVaxel aktivt={Boolean(skalprov)} onVaxla={onSkalprov} />}
          </div>

          {synliga.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <p className="font-medium text-body">Ingen i publiken matchar</p>
              <button
                type="button"
                onClick={() => {
                  setSok('');
                  setVy('alla');
                }}
                className={KAPSEL_KLASS}
              >
                Visa hela publiken
              </button>
            </div>
          ) : (
            <>
              <ul aria-label="Personer i publiken" className="flex flex-col gap-2 px-4">
                {synliga.map((m, i) => (
                  <span key={m.id} className={i < visade ? 'contents' : 'hidden print:contents'}>
                    <PersonRad medlem={m} endastForelasning={endastForelasning?.has(m.id)} />
                  </span>
                ))}
              </ul>
              {synliga.length > visade && (
                <div className="flex flex-col items-center gap-1 px-4 print:hidden">
                  <button
                    type="button"
                    onClick={() => setVisade((n) => n + CHUNK)}
                    className={KAPSEL_KLASS}
                  >
                    Visa {Math.min(CHUNK, synliga.length - visade)} till
                  </button>
                  <span className="text-caption text-text-muted">
                    {visade} av {synliga.length} visade
                  </span>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

/* ================================================================== *
 * DETALJVYN — `c`s ram, `b`s innehåll
 * ================================================================== */

function SegmentDetalj({
  entitet,
  parInfo,
  skalprov,
  onSkalprov,
  onTillbaka,
  onSkicka,
  onAndra,
}: {
  entitet: SegmentEntitet;
  parInfo: ParInfo[];
  skalprov: boolean;
  onSkalprov: (v: boolean) => void;
  onTillbaka: () => void;
  onSkicka: () => void;
  onAndra: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const rule = regelFor(entitet, parInfo);
  const { data, isPending, isError, error } = useMedlemmar(rule, true);
  useVyFokus(rubrikRef, !isPending);

  // Skalprovet fyller UT den verkliga publiken. Headerns tal räknar den
  // utfyllda mängden — annars hade rubriken sagt "2 personer" ovanför en lista
  // med 85, vilket är precis den motsägelse instrumentet inte får skapa.
  const medlemmar = fyllUt(data?.members ?? [], skalprov);
  const antalFar = medlemmar.filter(farMailet).length;
  const undertryckta = medlemmar.length - antalFar;
  const tomRegel = rule.include.length === 0;

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka till segmenten">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {/* Skiss/Sparad-etiketten är riven här av samma skäl som pillen i
              listan: "basen" är vårt ord, inte Lottas, och distinktionen är en
              prototyp-egenskap som inte finns i skarp drift. */}
          <h1 ref={rubrikRef} tabIndex={-1} className="min-w-0 font-semibold text-3xl">
            {entitet.namn}
          </h1>
        </div>
        {/* KONSEKVENSEN FÖRST: talet och dess uppdelning står i headern, före
            allt annat. Färg är aldrig ensam bärare — uppdelningen är text. */}
        <p className="text-small text-text-muted" aria-live="polite">
          {tomRegel
            ? 'Regeln träffar inga kurser än.'
            : isPending
              ? 'Räknar personer…'
              : isError
                ? 'Antalet kunde inte räknas'
                : medlemmar.length === 0
                  ? '0 personer matchar - inga med genomförd närvaro ännu'
                  : `${medlemmar.length} ${personform(medlemmar.length)} · ${antalFar} får mailet · ${undertryckta} undertrycks`}
        </p>
      </header>

      {/* PRIMÄR ÅTGÄRD I EGET OVILLKORLIGT KORT direkt under headern
          (`EventDetail` + `AtgarderKort`-formen) — inte i headern, inte som
          flytande FAB. Kortet står kvar även när segmentet är tomt; knappen
          blir overksam i stället. En yta som försvinner lär man sig aldrig. */}
      <div className={`${KORT_KLASS} print:hidden`}>
        <div className="flex flex-col py-1.5">
          <button
            type="button"
            onClick={onSkicka}
            disabled={isPending || medlemmar.length === 0}
            className={`${RAD_KLASS} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Send aria-hidden="true" size={16} className="shrink-0" />
            Skicka utskick till det här segmentet
            <ChevronRight
              aria-hidden="true"
              size={18}
              className="ml-auto shrink-0 text-text-secondary"
            />
          </button>
        </div>
      </div>

      {/* PUBLIKEN — HUVUDINNEHÅLLET. Direkt, aldrig bakom en fällning. Och
          det är HÄR skalprovets växel bor: publikens egen yta. */}
      <PublikSektion
        medlemmar={medlemmar}
        isPending={isPending && !tomRegel}
        isError={isError}
        error={error}
        skalprov={skalprov}
        onSkalprov={onSkalprov}
      />

      {/* REGELN STÅR SIST, och det är avsiktligt. Den läses sällan (Marcus
          skapar i skov, kontrollerar alltid) — men den måste gå att nå, och
          "Ändra regeln" är raden som leder vidare (chevron höger). */}
      <DetaljGrupp id="grupp-regel" rubrik="Regeln">
        <EtikettVardeRad term="Form">
          {entitet.predikat ? 'Predikat över dimensioner' : 'Uppräknade kurspar (äldre form)'}
        </EtikettVardeRad>
        <EtikettVardeRad term="Räknas ur">
          Genomförd närvaro (Närvarande eller Deltog online)
        </EtikettVardeRad>
        <EtikettVardeRad term="Motsvarar">
          {rule.include.length === 0
            ? 'Inga kurser'
            : `${rule.include.length} ${rule.include.length === 1 ? 'kurs' : 'kurser'} i basen i dag`}
        </EtikettVardeRad>
        <div className="py-3">
          <p className="text-small text-text-secondary">{definitionFor(entitet, parInfo)}</p>
        </div>
        <div className="flex flex-col py-1.5 print:hidden">
          <button type="button" onClick={onAndra} className={RAD_KLASS}>
            <Pencil aria-hidden="true" size={16} className="shrink-0" />
            Ändra regeln
            <ChevronRight
              aria-hidden="true"
              size={18}
              className="ml-auto shrink-0 text-text-secondary"
            />
          </button>
        </div>
      </DetaljGrupp>

      <div className="px-4">
        <PrototypNot>Publiken hämtas på riktigt med compute-segment.</PrototypNot>
      </div>
    </SidRam>
  );
}

/* ================================================================== *
 * REGELVERKSTADEN — `a`s yta, den nya formen
 * ================================================================== */

/**
 * Ett valbart chip. Multi-val, så INTE `ToggleButtonGroup` (den är låst till
 * singel-val + `disallowEmptySelection` — förseglade beslut i primitiven).
 * `aria-pressed` är toggle-knappens standardsemantik och kräver ingen ny
 * primitiv. Valt läge bär `bg-text` (EventsLists aktiva svärta), ovalt en
 * synlig kant på `bg-surface` — kanten är WCAG-bäraren, inte plattan.
 */
function ValChip({
  vald,
  onTryck,
  children,
}: {
  vald: boolean;
  onTryck: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={vald}
      onClick={onTryck}
      className={`rounded-full border px-3 py-1 text-small motion-safe:transition-colors ${
        vald
          ? 'border-transparent bg-text font-medium text-text-inverse contrast-more:border-border-strong'
          : 'border-border bg-surface text-text-secondary hover:bg-bg-emphasized'
      }`}
    >
      {children}
    </button>
  );
}

function ChipRad({ etikett, children }: { etikett: string; children: React.ReactNode }) {
  // `<fieldset>`/`<legend>` framför `role="group"` + `aria-label`: samma
  // semantik med inbyggd elementbetydelse, och grupprubriken blir synlig text
  // i stället för ett attribut bara skärmläsaren ser.
  return (
    <fieldset>
      <legend className="pb-1.5 font-medium text-small text-text-secondary">{etikett}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function vaxla<T>(lista: T[], varde: T): T[] {
  return lista.includes(varde) ? lista.filter((x) => x !== varde) : [...lista, varde];
}

/**
 * ETT VILLKOR SOM KORT. Ordningen är avsiktlig: kontrollerna först, meningen
 * sist. Man bygger uppifrån och ned och läser resultatet i botten — samma
 * riktning som `a`s klartext-spegling, men per villkor i stället för per sida.
 *
 * MODALITETSRADEN är den enda radioraden. Formskillnaden mot chip-raderna
 * ovanför säger "detta är ett beslut, inte en avgränsning" utan ett ord, och
 * säkerhetsmotiveringen visas BARA medan valet saknas.
 */
function VillkorsKort({
  villkor,
  index,
  parInfo,
  formatIBasen,
  onAndra,
  onTaBort,
}: {
  villkor: Villkor;
  index: number;
  parInfo: ParInfo[];
  formatIBasen: string[];
  onAndra: (v: Villkor) => void;
  onTaBort: () => void;
}) {
  const [merOppen, setMerOppen] = useState(false);
  const merPanelId = useId();
  const traffade = traffar(villkor, parInfo);
  const merAktiva = villkor.format.length;
  /** Orört = ingen dimension vald alls. Styr om den saknade modaliteten är röd. */
  const orort =
    villkor.modalitet === null &&
    villkor.familjer.length === 0 &&
    villkor.nivaer.length === 0 &&
    merAktiva === 0;
  const visaNiva =
    villkor.familjer.length === 0 || villkor.familjer.some((f) => FAMILJER_MED_NIVA.includes(f));

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-small text-text-secondary">Villkor {index + 1}</span>
        <Button
          intent="ghost"
          size="sm"
          aria-label={`Ta bort villkor ${index + 1}`}
          onPress={onTaBort}
        >
          <X aria-hidden="true" size={16} className="shrink-0" />
          Ta bort
        </Button>
      </div>

      <ChipRad etikett="Familj">
        {FAMILJER.map((f) => {
          const antal = parInfo.filter((p) => p.familj === f).length;
          return (
            <ValChip
              key={f}
              vald={villkor.familjer.includes(f)}
              onTryck={() => onAndra({ ...villkor, familjer: vaxla(villkor.familjer, f) })}
            >
              {f}
              <span className="pl-1.5 text-caption tabular-nums opacity-70">{antal}</span>
            </ValChip>
          );
        })}
      </ChipRad>
      {villkor.familjer.length === 0 && (
        <p className="-mt-2.5 text-caption text-text-muted">Inget val = alla familjer.</p>
      )}

      {visaNiva && (
        <ChipRad etikett="Nivå">
          {NIVAER.map((n) => (
            <ValChip
              key={n}
              vald={villkor.nivaer.includes(n)}
              onTryck={() => onAndra({ ...villkor, nivaer: vaxla(villkor.nivaer, n) })}
            >
              {NIVA_ETIKETT[n]}
            </ValChip>
          ))}
        </ChipRad>
      )}

      {/* SÄKERHETSKRAVET (Marcus 2026-08-10, beslut 5). Ingen default, ingen
          tystnad: "Båda" är ett av tre likvärdiga val som någon aktivt gör.

          RÖTT KOMMER FÖRST NÄR BYGGET BÖRJAT. Ett nyss tillagt villkor är
          orört, och att möta det med ett rödt felmeddelande vore att skälla på
          någon innan hon gjort något — renderingspasset visade hur illa det
          läste: hela kortet såg trasigt ut vid första anblicken. Så snart
          första dimensionen valts är villkoret däremot under uppbyggnad, och
          då är den saknade modaliteten ett verkligt fel som ska synas som ett.
          Motiveringen under står kvar i BÅDA lägena — den lär ut, den skäller
          inte. */}
      <div className="flex flex-col gap-1.5">
        <RadioGroup
          label="Räknas som"
          orientation="horizontal"
          value={villkor.modalitet}
          onChange={(v) => onAndra({ ...villkor, modalitet: v as ModalitetsVal })}
          isInvalid={villkor.modalitet === null && !orort}
          errorMessage="Välj vad som räknas innan villkoret kan användas."
        >
          <Radio value="Utbildning">Utbildning</Radio>
          <Radio value="Föreläsning">Föreläsning</Radio>
          <Radio value="Båda">Båda</Radio>
        </RadioGroup>
        {villkor.modalitet === null && (
          <p className="text-caption text-text-muted">
            Det finns material som är direkt olämpligt att skicka till någon som bara gått en
            föreläsning. Därför måste varje villkor säga vilket det gäller.
          </p>
        )}
      </div>

      {/* FORMATET ÄR FÄLLT — det är en avgränsning, inte ett beslut, och en
          ständigt öppen rad per dimension hade gjort kortet dubbelt så högt.
          Modaliteten fälls ALDRIG in: den är kravet, inte finjusteringen.
          Bakom samma fällning står det som INTE går att välja (året) och
          varför — den som letar efter en tidsperiod letar just här. */}
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => setMerOppen((v) => !v)}
          aria-expanded={merOppen}
          aria-controls={merPanelId}
          className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
        >
          Fler avgränsningar
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {merAktiva > 0 && (
              <span className="text-caption text-text-secondary tabular-nums">{merAktiva}</span>
            )}
            <ChevronDown
              aria-hidden="true"
              size={18}
              className={`text-text-secondary motion-safe:transition-transform ${
                merOppen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>
        <div id={merPanelId} hidden={!merOppen} className="flex flex-col gap-4 pt-3">
          <ChipRad etikett="Format">
            {formatIBasen.map((f) => (
              <ValChip
                key={f}
                vald={villkor.format.includes(f)}
                onTryck={() => onAndra({ ...villkor, format: vaxla(villkor.format, f) })}
              >
                {f}
              </ValChip>
            ))}
          </ChipRad>
          <p className="text-caption text-text-muted">
            Formatet är i dag 1:1 med modaliteten - dimensionen blir meningsfull när fler format
            tillkommer.
          </p>
          {/* DET SOM INTE FINNS SÄGS RAKT UT. Alternativet - en årsknapp som
              i själva verket väljer kurser - är exakt den tysta felklass
              modalitets-kravet finns för att avskaffa. */}
          <div className="flex flex-col gap-1 border-border border-t pt-3">
            <p className="font-medium text-small">{AR_EF_KRAV.rubrik}</p>
            <p className="text-caption text-text-muted">{AR_EF_KRAV.brod}</p>
            <p className="text-caption text-text-muted">{AR_EF_KRAV.krav}</p>
          </div>
        </div>
      </div>

      {/* MENINGEN, SIST. Modaliteten står i den varje gång — den läses utan
          att frågas om. Under den: vad villkoret expanderas till just nu. */}
      <div className="flex flex-col gap-1 border-border border-t pt-3">
        <p className="text-body">{villkorKlartext(villkor)}</p>
        <p className="text-small text-text-muted">
          {!villkorGiltigt(villkor)
            ? 'Räknas inte förrän modaliteten är vald.'
            : traffade.length === 0
              ? 'Träffar ingen kurs i basen i dag. Regeln är giltig - den fylls när kursen finns.'
              : `Träffar ${traffade.length} av ${parInfo.length} kurser: ${traffade
                  .map((p) => labelForPar(p.par))
                  .join(', ')}`}
        </p>
      </div>
    </li>
  );
}

/** Kurser utanför `KURS_KARTA` — prototypens egen lucka, sagd rakt ut. */
function OkandaKurser({ parInfo }: { parInfo: ParInfo[] }) {
  const okanda = [...new Set(parInfo.filter((p) => p.familj === null).map((p) => p.par.kurs))];
  if (okanda.length === 0) return null;
  return (
    <MessageBox intent="warning" title="Kurser utan familj i prototypens karta">
      <p>
        {okanda.join(', ')} finns i basen men saknas i den hårdkodade kartan, och matchar därför
        inget familj-villkor.
      </p>
      <p>
        I den skarpa lösningen bär basen fälten och sätter dem när kursen skapas - då kan det här
        inte inträffa.
      </p>
    </MessageBox>
  );
}

function VillkorsLista({
  rubrik,
  hjalptext,
  villkor,
  parInfo,
  formatIBasen,
  onAndra,
  onLaggTill,
  onTaBort,
}: {
  rubrik: string;
  hjalptext: string;
  villkor: Villkor[];
  parInfo: ParInfo[];
  formatIBasen: string[];
  onAndra: (id: string, v: Villkor) => void;
  onLaggTill: () => void;
  onTaBort: (id: string) => void;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2 px-4">
      <h2 id={id} className="font-semibold text-lg">
        {rubrik}
      </h2>
      <p className="text-small text-text-muted">{hjalptext}</p>
      {villkor.length > 0 && (
        <ul className="flex flex-col gap-3 pt-1">
          {villkor.map((v, i) => (
            <VillkorsKort
              key={v.id}
              villkor={v}
              index={i}
              parInfo={parInfo}
              formatIBasen={formatIBasen}
              onAndra={(ny) => onAndra(v.id, ny)}
              onTaBort={() => onTaBort(v.id)}
            />
          ))}
        </ul>
      )}
      <div className="flex pt-1">
        <button type="button" onClick={onLaggTill} className={KAPSEL_KLASS}>
          <Plus aria-hidden="true" size={18} className="shrink-0" />
          {villkor.length === 0 ? 'Lägg till villkor' : 'Lägg till ett villkor till'}
        </button>
      </div>
    </section>
  );
}

/**
 * REGELVERKSTADEN SOM EGEN YTA. `a`s hela poäng — bygget får kosta klick och
 * ska vara tydligt — men utan `a`s kostnad: den bor inte på samma skärm som
 * publiken och utskicket, så ingenting av det man gör OFTAST betalar för det
 * man gör SÄLLAN.
 */
function RegelVerkstad({
  entitet,
  parInfo,
  onTillbaka,
  onSpara,
}: {
  entitet: SegmentEntitet;
  parInfo: ParInfo[];
  onTillbaka: () => void;
  onSpara: (namn: string, pred: Predikat) => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, true);

  const [namn, setNamn] = useState(entitet.namn);
  const [pred, setPred] = useState<Predikat>(
    () => entitet.predikat ?? { med: [nyttVillkor()], utan: [] },
  );
  const [sparNot, setSparNot] = useState(false);

  const formatIBasen = useMemo(
    () => [...new Set(parInfo.map((p) => p.format))].sort((a, b) => a.localeCompare(b, 'sv')),
    [parInfo],
  );

  const rule = expandera(pred, parInfo);
  const ofullstandiga = [...pred.med, ...pred.utan].filter((v) => !villkorGiltigt(v)).length;
  const harRegel = rule.include.length > 0;

  /* RÄKNINGEN FÖLJER REGELN — ingen begäran, ingen knapp (Marcus 2026-08-10).
     `enabled` är `harRegel`, inte en sparad signatur.

     Skyddet mot hamring ligger kvar, men på rätt ställe: `medlemsFraga`
     nycklar på REGELNS SIGNATUR med 5 min `staleTime`, så ett chip-tryck som
     ger en regel vi redan räknat besvaras ur cachen utan nätanrop, och att
     ångra ett val ger tillbaka talet direkt. Det som kostar en ny walk är
     precis det som SKA kosta en: en regel ingen sett förut.

     Historiken är värd att minnas: den första formen bar en `boolean` här och
     hamrade en full-walk per chip-tryck. Fixen då blev en klick-spärr. Rätt
     fix var cache-nyckeln — spärren var en behandling av symptomet. */
  const { data, isFetching, isError, error } = useMedlemmar(rule, harRegel);
  const antal = data?.count;

  const andra = (gren: 'med' | 'utan', id: string, ny: Villkor) =>
    setPred((p) => ({ ...p, [gren]: p[gren].map((v) => (v.id === id ? ny : v)) }));
  const laggTill = (gren: 'med' | 'utan') =>
    setPred((p) => ({ ...p, [gren]: [...p[gren], nyttVillkor()] }));
  const taBort = (gren: 'med' | 'utan', id: string) =>
    setPred((p) => ({ ...p, [gren]: p[gren].filter((v) => v.id !== id) }));

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett="Tillbaka till segmentet">
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Regeln
        </h1>
        <p className="text-small text-text-muted">
          En regel beskriver vad någon har gått igenom - inte vilka kurser som fanns när du byggde
          den. Startar en ny nivå senare omfattas den automatiskt.
        </p>
      </header>

      {entitet.predikat === null && (
        <div className="px-4">
          <MessageBox intent="info" title="Det här segmentet är sparat i den äldre formen">
            Regeln är en uppräkning av kurser: {definitionFor(entitet, parInfo)} Den fortsätter
            fungera, men omfattar inte nya kurser. Villkoren nedan bygger om den som ett predikat.
          </MessageBox>
        </div>
      )}

      <div className="px-4">
        <OkandaKurser parInfo={parInfo} />
      </div>

      <div className="px-4">
        <Input
          label="Namn på segmentet"
          value={namn}
          onChange={setNamn}
          placeholder="t.ex. RIM - alla utbildningsnivåer"
          isRequired
        />
      </div>

      <VillkorsLista
        rubrik="Med - dessa räknas in"
        hjalptext="Den som uppfyller minst ett av villkoren är med i segmentet."
        villkor={pred.med}
        parInfo={parInfo}
        formatIBasen={formatIBasen}
        onAndra={(id, v) => andra('med', id, v)}
        onLaggTill={() => laggTill('med')}
        onTaBort={(id) => taBort('med', id)}
      />

      <VillkorsLista
        rubrik="Utan - dessa räknas bort"
        hjalptext="Den som uppfyller något av villkoren här tas bort igen, även om hon räknades in ovan."
        villkor={pred.utan}
        parInfo={parInfo}
        formatIBasen={formatIBasen}
        onAndra={(id, v) => andra('utan', id, v)}
        onLaggTill={() => laggTill('utan')}
        onTaBort={(id) => taBort('utan', id)}
      />

      {/* SAMMANFATTNINGEN: definitionen och resultatet i ett andetag (`a`s
          hjärta), men här i slutet av en yta som INTE också bär utskicket. */}
      <section aria-labelledby="grupp-summering" className="flex min-w-0 flex-col gap-2">
        <h2 id="grupp-summering" className="px-4 font-semibold text-lg">
          Det här segmentet
        </h2>
        <div className={`divide-y divide-border ${KORT_KLASS}`}>
          <div className="py-4">
            <p className="text-lg">{predikatKlartext(pred)}</p>
          </div>

          <div className="flex flex-col gap-3 py-4">
            <div aria-live="polite" aria-busy={isFetching} className="flex flex-col gap-1">
              {ofullstandiga > 0 ? (
                <p className="text-body text-text-muted">
                  {ofullstandiga} {ofullstandiga === 1 ? 'villkor saknar' : 'villkor saknar'}{' '}
                  modalitet och räknas inte.
                </p>
              ) : !harRegel ? (
                <p className="text-body text-text-muted">
                  Bygg minst ett villkor under Med, så går regeln att räkna.
                </p>
              ) : isFetching ? (
                <>
                  <span className="sr-only">Räknar personer…</span>
                  <Skeleton variant="text" className="w-20 text-3xl" />
                  <Skeleton variant="text" className="w-56" />
                </>
              ) : isError ? (
                <MessageBox intent="error" title="Kunde inte räkna antal">
                  {error instanceof Error ? error.message : 'Okänt fel.'}
                </MessageBox>
              ) : antal === undefined ? (
                // Regeln är ofullständig (ingen modalitet vald, inga villkor).
                // Ingen räkning är begärd av användaren längre — den enda
                // anledningen till att ett tal saknas är att det inte FINNS
                // något att räkna ännu, och det säger raden rakt ut.
                <p className="text-body text-text-muted">Antalet visas när regeln är komplett.</p>
              ) : antal === 0 ? (
                // Fälla #34: neutralt, aldrig som fel.
                <p className="text-lg">
                  <strong className="font-semibold text-3xl tabular-nums">0</strong> personer
                  matchar - inga med genomförd närvaro ännu.
                </p>
              ) : (
                <p className="text-lg">
                  <strong className="font-semibold text-3xl tabular-nums">{antal}</strong>{' '}
                  {personform(antal)} i det här segmentet.
                </p>
              )}
            </div>

            {/* RÄKNA-KNAPPEN ÄR RIVEN (Marcus 2026-08-10). Talet följer
                regeln av sig självt: ändras ett villkor byter frågan nyckel
                och det nya talet hämtas direkt.

                Varför spärren fanns, och varför den ändå faller: varje
                räkning är en walk över ~1012 `Deltaganden`-rader, så den
                fick inte hamras. Men `b` mätte hela interaktionspasset till
                ETT `compute-segment`-anrop — cache-nyckeln på regelns
                signatur bär redan det skyddet, och ett återbesök i
                regelrymden kostar noll eftersom den gamla signaturens svar
                ligger kvar. Spärren skyddade alltså inte mot walken; den
                lade bara ett klick mellan Lotta och svaret. */}
            {/* EXPANSIONEN, SAGD KORT. Kort med flit: den är en not om
                mekaniken, inte en varning om ytan. */}
            <p className="text-caption text-text-muted">
              Regeln slås upp mot {rule.include.length} av {parInfo.length} kurser i webbläsaren och
              skickas som en kurslista till servern. Skarpt måste servern äga uppslaget - annars kan
              mottagarkontrollen inte lita på regeln.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            intent="primary"
            isDisabled={!harRegel || namn.trim() === ''}
            onPress={() => {
              setSparNot(true);
              onSpara(namn.trim(), pred);
            }}
          >
            Spara regeln
          </Button>
          {/* EN LÅST KNAPP SKA SÄGA VARFÖR. `a`s form ("Bygg klart regeln
              först."): skälet står bredvid knappen, inte i huvudet på den som
              redan vet. */}
          {(!harRegel || namn.trim() === '') && (
            <span className="text-small text-text-muted">
              {!harRegel
                ? 'Bygg minst ett fullständigt villkor under Med.'
                : 'Ge segmentet ett namn först.'}
            </span>
          )}
          <Button intent="secondary" onPress={onTillbaka}>
            Avbryt
          </Button>
        </div>
        {sparNot && (
          <MessageBox
            intent="info"
            title="Prototyp - ingenting sparades"
            onDismiss={() => setSparNot(false)}
          >
            Regeln ligger kvar i sidan så länge den är öppen, så du kan följa den vidare till
            publiken och utskicket.
          </MessageBox>
        )}
        <PrototypNot />
      </div>
    </SidRam>
  );
}

/* ================================================================== *
 * UTSKICKET — eget steg, `a`s inline-grammatik
 * ================================================================== */

type UtfallsLage = 'allt' | 'delvis' | 'inget';

type Utfall = {
  accepterade: number;
  utanEpost: number;
  tackatNej: number;
  ejLevererade: number;
  totalt: number;
  /** Vilken publik utfallet gäller — lika många är inte samma personer. */
  signatur: string;
};

function simulera(mottagare: SegmentMember[], lage: UtfallsLage, signatur: string): Utfall {
  const utanEpost = mottagare.filter((m) => !m.email).length;
  const tackatNej = mottagare.filter((m) => m.email && m.ejGodkandMail).length;
  const kvar = mottagare.length - utanEpost - tackatNej;
  const accepterade = lage === 'allt' ? kvar : lage === 'inget' ? 0 : Math.ceil(kvar * (2 / 3));
  return {
    accepterade,
    utanEpost,
    tackatNej,
    ejLevererade: kvar - accepterade,
    totalt: mottagare.length,
    signatur,
  };
}

/** `AtgardsSida.tsx § PrototypRigg` — samma streckade form, samma avsikt. */
function PrototypRigg({
  lage,
  onValj,
  onAterstall,
}: {
  lage: UtfallsLage;
  onValj: (l: UtfallsLage) => void;
  onAterstall?: () => void;
}) {
  const val: { nyckel: UtfallsLage; etikett: string }[] = [
    { nyckel: 'allt', etikett: 'Allt gick fram' },
    { nyckel: 'delvis', etikett: 'Delutfall' },
    { nyckel: 'inget', etikett: 'Inget gick fram' },
  ];
  return (
    <div className="mx-4 flex flex-col gap-2 rounded-lg border border-border border-dashed p-3 print:hidden">
      <p className="text-caption text-text-muted">
        <strong className="font-medium">Prototyp-rigg.</strong> Välj vilket utfall som ska
        simuleras. Inget skickas - svaret byggs i webbläsaren.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {val.map((v) => (
          <button
            key={v.nyckel}
            type="button"
            onClick={() => onValj(v.nyckel)}
            aria-pressed={lage === v.nyckel}
            className={`rounded-full px-3 py-1 text-small ${
              lage === v.nyckel
                ? 'bg-bg-emphasized font-medium'
                : 'text-text-secondary hover:bg-bg-muted'
            }`}
          >
            {v.etikett}
          </button>
        ))}
        {onAterstall && (
          <button
            type="button"
            onClick={onAterstall}
            className="ml-auto text-small text-text-secondary underline"
          >
            Granska igen
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * MODALITETSFÖRDELNINGEN — Marcus-order 2026-08-10, byggd som en andra fråga
 * till samma motor.
 *
 * PROBLEMET: `compute-segment` svarar `{members: [{id, namn, email,
 * ejGodkandMail}]}`. Medlemmarna bär INTE vilket par de kvalificerade sig
 * genom, så ett enda svar kan omöjligt säga vem som bara gått föreläsning.
 *
 * VÄGEN SOM FUNGERAR: ställ frågan "vilka har gått NÅGON utbildning?" som en
 * egen regel och dra bort den mängden. Den som är kvar har bara föreläsning
 * bakom sig.
 *
 * JÄMFÖRELSEMÄNGDEN ÄR HELA TAXONOMINS UTBILDNINGAR, inte bara segmentets.
 * Det är en medveten skärpning: Marcus oro gäller vad personen FAKTISKT gått
 * igenom, inte vad just den här regeln råkar innehålla. Någon som gått en
 * utbildning i en annan familj är inte "enbart föreläsning" och ska inte
 * flaggas som det.
 *
 * MULTI-SEGMENT: `kanBlandas` avgörs av UNIONEN av de valda segmentens regler
 * — en blandning kan uppstå mellan två segment lika gärna som inuti ett.
 *
 * SKALPROV: instrumentets påhittade personer hålls UTANFÖR underlaget. De har
 * ingen kurshistorik, så en kontroll som räknade dem hade svarat på en fråga
 * om påhittad data — och det säger skalprovets egen varningsruta rakt ut.
 *
 * KOSTNADEN ÄR EN WALK — EN GÅNG PER SESSION, inte per segment. Regeln är
 * identisk för alla segment, och `useMedlemmar` nycklar på REGELNS SIGNATUR
 * (`b`s signatur-cache-grepp), så andra och tredje segmentet läser samma
 * cache-post. Walken hoppas dessutom helt över när regeln bara innehåller
 * utbildnings-par: då har varje medlem per definition gått en utbildning.
 *
 * ATT DETTA KRÄVER TVÅ WALKS ÄR ETT SYMPTOM, INTE EN LÖSNING. Se filhuvudets
 * fynd + slutrapporten: bar `compute-segment` med vilka par varje medlem
 * kvalificerade sig genom vore fördelningen gratis.
 */
function useModalitetsFordelning(
  kanBlandas: boolean,
  parInfo: ParInfo[],
  mottagare: SegmentMember[],
) {
  const utbildningsRegel = useMemo<SegmentRule>(
    () => ({
      include: parInfo.filter((p) => p.par.modalitet === 'Utbildning').map((p) => p.par),
      exclude: [],
    }),
    [parInfo],
  );

  const harUtbildningar = utbildningsRegel.include.length > 0;
  const fraga = useMedlemmar(utbildningsRegel, kanBlandas && harUtbildningar);

  // Finns inga utbildningar alls i taxonomin kan ingen ha gått en — svaret är
  // känt utan att fråga, och en walk som aldrig kan svara får inte låsa grinden.
  const utbildadeIds = harUtbildningar
    ? new Set((fraga.data?.members ?? []).map((m) => m.id))
    : new Set<string>();
  const klar = !kanBlandas || !harUtbildningar || fraga.data !== undefined || fraga.isError;
  const ids: ReadonlySet<string> =
    kanBlandas && klar && !fraga.isError
      ? new Set(mottagare.filter((m) => !utbildadeIds.has(m.id)).map((m) => m.id))
      : new Set<string>();

  return { kanBlandas, klar, misslyckades: fraga.isError, ids };
}

function UtskicksVy({
  entiteter,
  parInfo,
  skalprov,
  onTillbaka,
}: {
  entiteter: SegmentEntitet[];
  parInfo: ParInfo[];
  skalprov: boolean;
  onTillbaka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const dataSource = useDataSource();

  // EN fråga per valt segment, på SAMMA cache-nyckel (regelns signatur) som
  // listan och detaljen använder → ett redan räknat segment kostar noll här.
  // Speglar EF:ens `resolveSegmentMembers`: N regler, en union, dedup på person.
  const svar = useQueries({
    queries: entiteter.map((e) => medlemsFraga(dataSource, regelFor(e, parInfo))),
  });
  const isPending = svar.some((s) => s.isPending);
  useVyFokus(rubrikRef, !isPending);

  const [amne, setAmne] = useState('');
  const [text, setText] = useState('Hej {förnamn},\n\n\n\nVarmt hälsat\nRoger och Lotta');
  const [bekraftelse, setBekraftelse] = useState('');
  const [lage, setLage] = useState<'granska' | 'skickar' | 'resultat'>('granska');
  const [utfall, setUtfall] = useState<Utfall | null>(null);
  const [riggLage, setRiggLage] = useState<UtfallsLage>('delvis');
  const [testNot, setTestNot] = useState(false);
  const [visaBlandade, setVisaBlandade] = useState(false);
  const blandadePanelId = useId();

  /* ETT FALLERAT SEGMENT FÅR ALDRIG KRYMPA UNIONEN TYST (`c`s vakt, ärvd).
     Unionen byggs ur N oberoende walks, och en som svarar med fel bidrar med
     noll medlemmar UTAN att synas. Talet i "Utskick till N personer" hade då
     varit FALSKT — på exakt den yta som finns för att inte ljuga — och
     skriv-för-att-bekräfta-grinden hade låst upp mot det falska talet.

     Med ETT segment är felet självrapporterande (noll mottagare, inget att
     skicka). Med flera är det tyst. Därför bor vakten här och inte i
     detaljvyn, och sändningen blockeras helt tills alla walks svarat: en
     delmängd som ser komplett ut är farligare än ett stopp. */
  const misslyckade = svar.filter((s) => s.isError).length;

  // UNIONEN, som EF:en gör den: dedup på person-ID. Förekomsterna bär
  // överlappet — samma person i två segment får ETT mail.
  const forekomster = new Map<string, number>();
  const unionKarta = new Map<string, SegmentMember>();
  for (const s of svar) {
    for (const m of s.data?.members ?? []) {
      unionKarta.set(m.id, m);
      forekomster.set(m.id, (forekomster.get(m.id) ?? 0) + 1);
    }
  }
  const raMottagare = [...unionKarta.values()];
  const overlapp = [...forekomster.values()].filter((n) => n > 1).length;
  const summaPerSegment = svar.reduce((n, s) => n + (s.data?.count ?? 0), 0);

  const mottagare = fyllUt(raMottagare, skalprov);
  const signatur = mottagare.map((m) => m.id).join(',');
  const utanEpost = mottagare.filter((m) => !m.email).length;
  const nekade = mottagare.filter((m) => m.email && m.ejGodkandMail).length;
  const forsta = mottagare[0];
  const brodtext = fyllPlatshallare(text, forsta);
  const amneVisning = fyllPlatshallare(amne, forsta);
  const ofyllda = [...new Set([...brodtext.ofyllda, ...amneVisning.ofyllda])];

  // Blandningen kan uppstå INUTI ett segment ("Båda") lika gärna som MELLAN
  // två — därför avgörs `kanBlandas` av unionen av de valda reglerna.
  const kanBlandas = entiteter.some((e) =>
    regelFor(e, parInfo).include.some((p) => p.modalitet === 'Föreläsning'),
  );
  const fordelningsUnderlag = mottagare.filter((m) => !arPahittad(m));
  const fordelning = useModalitetsFordelning(kanBlandas, parInfo, fordelningsUnderlag);
  const blandade = mottagare.filter((m) => fordelning.ids.has(m.id));

  /* GRINDEN ÄR HÄRLEDD (T50 lager a): `bekraftelse` mäts mot det AKTUELLA
     antalet, så ett tal skrivet mot 14 mottagare kan aldrig låsa upp ett
     utskick till 9. Utfallet bär sin publiks signatur av samma skäl — ett
     resultat räknat för en annan mottagarmängd är inte ett resultat.

     FÖRDELNINGEN INGÅR I GRINDEN medan den hämtas. En kontroll som hinner
     laddas EFTER att knappen tryckts är ingen kontroll — och den här ska
     läsas före ett oåterkalleligt utskick, inte bredvid det. Misslyckas
     hämtningen låser den däremot INTE: antalet är fortfarande sant, bara
     fördelningen okänd, och det säger rutan i stället.

     `misslyckade === 0` INGÅR I "KÄNT VÄRDE": ett tal byggt ur en ofullständig
     union är inte ett känt värde, det är en gissning som ser exakt ut. */
  const upplast =
    !isPending &&
    misslyckade === 0 &&
    fordelning.klar &&
    mottagare.length > 0 &&
    bekraftelse.trim() === String(mottagare.length);
  const kanSkicka = upplast && amne.trim() !== '' && text.trim() !== '';
  const visatUtfall = utfall && utfall.signatur === signatur ? utfall : null;

  /** MED ETT SEGMENT KOSTAR MULTI-STÖDET NOLL RADER: namnet står redan här. */
  const rubrik =
    entiteter.length === 1 ? (entiteter[0]?.namn ?? 'Utskick') : `${entiteter.length} segment`;
  const tillbakaEtikett =
    entiteter.length === 1 ? 'Tillbaka till segmentet' : 'Tillbaka till segmenten';

  function skicka() {
    // T50 lager (c): PESSIMISTISK — ingen optimistisk flip. granska → skickar
    // → resultat, och resultatet kommer först när "servern" (riggen) svarat.
    setLage('skickar');
    window.setTimeout(() => {
      setUtfall(simulera(mottagare, riggLage, signatur));
      setLage('resultat');
    }, 1100);
  }

  if (lage === 'resultat' && visatUtfall) {
    const u = visatUtfall;
    return (
      <SidRam onTillbaka={onTillbaka} tillbakaEtikett={tillbakaEtikett}>
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
            {u.accepterade === 0 ? 'Inget skickades' : 'Skickat'}
          </h1>
          <p className="text-small text-text-muted">{rubrik}</p>
        </header>

        <div className="flex flex-col gap-4 px-4">
          {/* T50 lager (c), icke-binärt: noll accepterade renderas ALDRIG
              grönt, och uppdelningen säger VARFÖR. Fälla #39: siffran kommer
              ur mottagarna, aldrig ur `Utskickslogg.Antal skickade`. */}
          <MessageBox
            intent={u.accepterade === 0 ? 'warning' : u.accepterade < u.totalt ? 'info' : 'success'}
            title={
              u.accepterade === 0
                ? 'Ingen fick mailet'
                : u.accepterade < u.totalt
                  ? 'Utskicket lyckades delvis'
                  : 'Utskicket lyckades'
            }
          >
            {u.accepterade > 0 && (
              <p>
                <strong>
                  {u.accepterade} av {u.totalt}
                </strong>{' '}
                {personform(u.accepterade)} fick mailet.
              </p>
            )}
            {u.tackatNej > 0 && <p>{u.tackatNej} togs bort (har tackat nej till utskick).</p>}
            {u.utanEpost > 0 && <p>{u.utanEpost} togs bort (saknar e-postadress).</p>}
            {u.ejLevererade > 0 && <p>{u.ejLevererade} kunde inte levereras.</p>}
          </MessageBox>

          <div className="flex items-center gap-2">
            <Button intent="primary" onPress={onTillbaka}>
              {tillbakaEtikett}
            </Button>
          </div>
          <PrototypNot />
        </div>

        {import.meta.env.DEV && (
          <PrototypRigg
            lage={riggLage}
            onValj={setRiggLage}
            onAterstall={() => {
              setUtfall(null);
              setBekraftelse('');
              setLage('granska');
            }}
          />
        )}
      </SidRam>
    );
  }

  return (
    <SidRam onTillbaka={onTillbaka} tillbakaEtikett={tillbakaEtikett}>
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Utskick
        </h1>
        <p className="text-small text-text-muted">{rubrik}</p>
      </header>

      {/* KONSEKVENSEN FÖRST OCH STÖRST (T50 lager b): antalet syns före
          sändning, och serverns ägarskap sägs rakt ut. TALET DÖLJS vid ett
          fallerat segment — se vakten ovan. */}
      <p className="px-4 text-lg">
        Utskick till{' '}
        <strong className="font-semibold text-xl tabular-nums" aria-live="polite">
          {isPending || misslyckade > 0 ? '…' : mottagare.length}
        </strong>{' '}
        {personform(mottagare.length)}.
      </p>

      {/* FELET STÅR FÖRE ALLT ANNAT: det gör resten av sidan otillförlitlig. */}
      {misslyckade > 0 && (
        <div className="px-4">
          <MessageBox intent="error" title="Alla segment kunde inte räknas">
            {misslyckade === 1
              ? 'Ett av segmenten svarade inte, så mottagarlistan är ofullständig.'
              : `${misslyckade} av segmenten svarade inte, så mottagarlistan är ofullständig.`}{' '}
            Utskicket är låst tills alla segment är räknade - annars hade du bekräftat ett antal som
            inte stämmer. Gå tillbaka och försök igen.
          </MessageBox>
        </div>
      )}

      {/* SEGMENTEN — multi-segmentets egen grupp, och unionens enda
          kontrollräkningsbara yta. Den renderas FÖRST vid två eller fler:
          med ett segment står namnet redan i underrubriken, så gruppen skulle
          bara vara i vägen i normalfallet. */}
      {entiteter.length > 1 && (
        <DetaljGrupp id="grupp-segment" rubrik="Segment i utskicket">
          {entiteter.map((e, i) => (
            <div key={e.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body">{e.namn}</span>
                <span className="truncate text-caption text-text-muted">
                  {definitionFor(e, parInfo)}
                </span>
              </span>
              <span className="shrink-0 text-small text-text-secondary tabular-nums">
                {svar[i]?.isError ? 'fel' : svar[i]?.isPending ? '…' : (svar[i]?.data?.count ?? 0)}
              </span>
            </div>
          ))}
          {/* ÖVERLAPPSRADEN — funktionens hela existensberättigande i formen.
              Utan den är unionens tal något Lotta inte kan kontrollräkna, och
              skillnaden mot summan är exakt den tysta feltyp ett utskick inte
              får bära. */}
          <div className="py-3">
            <p className="text-small text-text-secondary">
              {misslyckade > 0
                ? 'Överlappet kan inte räknas förrän alla segment svarat.'
                : `${summaPerSegment} platser i segmenten, ${raMottagare.length} unika personer. ${
                    overlapp === 0
                      ? 'Ingen finns i mer än ett segment.'
                      : `${overlapp} ${
                          overlapp === 1 ? 'person finns' : 'personer finns'
                        } i flera segment och får ETT mail.`
                  }`}
            </p>
          </div>
        </DetaljGrupp>
      )}

      {/* ── MODALITETSFÖRDELNINGEN ──────────────────────────────────────
          Marcus säkerhetskrav har TVÅ halvor. Den obligatoriska modaliteten
          per villkor hindrar att en blandning uppstår av MISSTAG. Den här
          rutan hindrar att den passerar OSEDD när den uppstått med avsikt —
          "Båda" är ett tillåtet val, och två villkor med olika modalitet är
          det också.

          RUTAN STÅR FÖRST bland granskningens fynd, före ofyllda platshållare
          och undertryckta, eftersom den ensam bär en konsekvens för MOTTAGAREN
          snarare än för leveransen. Den är `warning`, aldrig `error`:
          blandningen är tillåten. Sista raden säger det rakt ut, så tonen inte
          kan misstas för ett förbud.

          NOLL-FALLET SÄGS OCKSÅ, men som en dämpad rad i stället för en ruta.
          Trygghetstriadens hela idé är att göra det tysta synligt — och "vi
          kontrollerade, ingen berörs" är en upplysning, inte ett larm. */}
      {fordelning.kanBlandas && (
        <div className="px-4">
          {!fordelning.klar ? (
            <p aria-live="polite" className="text-small text-text-muted">
              Kontrollerar hur mottagarna fördelar sig på utbildning och föreläsning…
            </p>
          ) : fordelning.misslyckades ? (
            <MessageBox intent="warning" title="Fördelningen kunde inte kontrolleras">
              Regeln räknar in både utbildning och föreläsning, men kontrollen av vilka som bara
              gått föreläsning gick inte att göra. Antalet ovan stämmer - fördelningen är okänd.
            </MessageBox>
          ) : blandade.length === 0 ? (
            <p className="text-small text-text-secondary">
              Kontrollerat: alla {fordelningsUnderlag.length} mottagare har gått minst en
              utbildning.
            </p>
          ) : (
            // NÄMNAREN ÄR DE VERKLIGA MOTTAGARNA, inte den utfyllda publiken:
            // skalprovets personer har ingen kurshistorik att kontrollera.
            <MessageBox intent="warning" title="Publiken är blandad">
              <p>
                <strong>
                  {blandade.length} av {fordelningsUnderlag.length}
                </strong>{' '}
                mottagare har bara gått föreläsning - ingen utbildning.
              </p>
              <p>
                Det är tillåtet. Kontrollera bara att innehållet passar dem också innan du skickar.
              </p>
              <button
                type="button"
                aria-expanded={visaBlandade}
                aria-controls={blandadePanelId}
                onClick={() => setVisaBlandade((v) => !v)}
                className="flex items-center gap-1.5 self-start font-medium text-small underline hover:no-underline"
              >
                {visaBlandade ? 'Dölj vilka' : `Visa vilka (${blandade.length})`}
                <ChevronDown
                  aria-hidden="true"
                  size={16}
                  className={`shrink-0 motion-safe:transition-transform ${
                    visaBlandade ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <ul
                id={blandadePanelId}
                hidden={!visaBlandade}
                className="flex flex-col gap-0.5 pt-1"
              >
                {blandade.map((m) => (
                  <li key={m.id} className="text-small">
                    {visatNamn(m)}
                    <span className="text-text-muted"> · {m.email ?? 'ingen e-postadress'}</span>
                  </li>
                ))}
              </ul>
            </MessageBox>
          )}
        </div>
      )}

      {ofyllda.length > 0 && (
        <div className="px-4">
          <MessageBox intent="warning" title="Något i texten kunde inte fyllas i">
            {ofyllda.join(', ')} står kvar som det är och går ut ordagrant så. Fyll i det för hand i
            texten.
          </MessageBox>
        </div>
      )}

      {(utanEpost > 0 || nekade > 0) && (
        <div className="px-4">
          <MessageBox intent="warning" title="Några kommer inte fram">
            {utanEpost > 0 && <p>{utanEpost} saknar e-postadress.</p>}
            {nekade > 0 && <p>{nekade} har tackat nej till utskick.</p>}
            <p>Servern tar bort dem - de räknas inte som skickade.</p>
          </MessageBox>
        </div>
      )}

      {/* TRYGGHETSTRIADENS (b): mottagarna i sin fulla form, och listan skiljer
          "får mailet" från "undertrycks av serverns consent-grind". */}
      <PublikSektion
        medlemmar={mottagare}
        isPending={isPending}
        isError={false}
        error={undefined}
        endastForelasning={fordelning.ids}
        skalprov={skalprov}
      />

      <DetaljGrupp id="grupp-utskicket" rubrik="Utskicket">
        <div className="flex flex-col gap-3 py-4">
          <Input
            label="Ämne"
            value={amne}
            onChange={setAmne}
            isRequired
            isDisabled={lage === 'skickar'}
            placeholder="Ämnesraden mottagaren ser"
          />
          <TextArea
            label="Meddelande"
            value={text}
            onChange={setText}
            rows={7}
            isRequired
            isDisabled={lage === 'skickar'}
            description="Skriv {förnamn} där mottagarens förnamn ska stå."
          />
        </div>

        {/* TRYGGHETSTRIADENS (a): EN NAMNGIVEN MOTTAGARE. Var och en får sitt
            eget mail, så det finns ingen enda sann text att visa — att visa
            den första och säga vems den är är ärligare än att visa mallen.
            Plain text, aldrig HTML-render. */}
        <div className="flex flex-col gap-2 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-caption text-text-muted">
              {forsta
                ? `Förhandsvisningsexempel - som ${visatNamn(forsta)} får det`
                : 'Förhandsvisningsexempel'}
            </span>
            {/* TRYGGHETSTRIADENS (c): knappen finns i formen, vägen finns inte
                — `send-email` saknar enkel-mottagar-gren tills task-147.1
                landar. Fälla #44: en testmail-väg får ALDRIG filtrera på
                adressmönster (Marcus egna adresser är riktiga deltagares). */}
            <Button intent="secondary" size="sm" onPress={() => setTestNot(true)}>
              <MailCheck aria-hidden="true" size={16} className="shrink-0" />
              Skicka test till mig
            </Button>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-transparent bg-surface px-3 py-2 contrast-more:border-border-strong">
            <span className="shrink-0 text-small text-text-muted">Ämne</span>
            <span className="min-w-0 text-right text-body">{amneVisning.text || '-'}</span>
          </div>
          <p
            // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
            tabIndex={0}
            className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-transparent bg-surface px-3 py-2 text-body text-text-secondary contrast-more:border-border-strong"
          >
            {brodtext.text || 'Meddelandet visas här när du skrivit det.'}
          </p>
          {testNot && (
            <MessageBox
              intent="info"
              title="Testmailet är inte kopplat än"
              onDismiss={() => setTestNot(false)}
            >
              Knappen finns i formen, men servern har ingen väg för ett enskilt testmail ännu.
            </MessageBox>
          )}
        </div>
      </DetaljGrupp>

      {/* GRINDEN — T50 lager (a). Grön-knapp-regeln (`task-18.16`): utskicket
          når UTOMSTÅENDE → `intent="success"` när det faktiskt går iväg,
          `primary` innan. `danger` används aldrig här. */}
      <div className="flex flex-col gap-3 px-4">
        <Input
          label={`Skriv antalet mottagare (${isPending ? '…' : mottagare.length}) för att låsa upp utskicket.`}
          value={bekraftelse}
          onChange={setBekraftelse}
          autoComplete="off"
          inputMode="numeric"
          isDisabled={isPending || !fordelning.klar || mottagare.length === 0 || lage === 'skickar'}
          isInvalid={bekraftelse.trim() !== '' && !upplast}
          errorMessage={`Det matchar inte. Skriv ${mottagare.length} för att låsa upp.`}
        />

        <p aria-live="polite" className="min-h-5 text-small text-text-muted">
          {!fordelning.klar
            ? 'Låses upp när fördelningen på utbildning och föreläsning är kontrollerad.'
            : kanSkicka && lage === 'granska'
              ? `Rätt antal angivet - knappen "Skicka till ${mottagare.length} ${personform(mottagare.length)}" är nu upplåst.`
              : ''}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            intent={kanSkicka ? 'success' : 'primary'}
            isDisabled={!kanSkicka || lage === 'skickar'}
            onPress={skicka}
          >
            {lage === 'skickar'
              ? 'Skickar…'
              : `Skicka till ${mottagare.length} ${personform(mottagare.length)}`}
          </Button>
          <Button intent="secondary" onPress={onTillbaka} isDisabled={lage === 'skickar'}>
            Tillbaka
          </Button>
          {upplast && (amne.trim() === '' || text.trim() === '') && (
            <span className="text-small text-text-muted">
              Ämne och meddelande måste vara ifyllda.
            </span>
          )}
        </div>

        <div aria-live="polite" aria-busy={lage === 'skickar'} className="min-h-6">
          {lage === 'skickar' && <p className="text-small text-text-muted">Skickar utskicket…</p>}
        </div>

        <PrototypNot />
      </div>

      {import.meta.env.DEV && <PrototypRigg lage={riggLage} onValj={setRiggLage} />}
    </SidRam>
  );
}

/* ================================================================== *
 * VARIANTEN
 * ================================================================== */

/**
 * `utskick` bär en LISTA av id:n (multi-segment) plus varifrån man kom.
 * Returvägen kan inte härledas ur antalet: ETT markerat segment i listan ska
 * backa till LISTAN, inte till en detaljsida man aldrig var på.
 */
type Vy =
  | { namn: 'lista' }
  | { namn: 'detalj'; id: string }
  | { namn: 'regel'; id: string }
  | { namn: 'utskick'; ids: string[]; retur: 'lista' | 'detalj' };

/** Ett tomt segment i byggläge — utgången ur "Nytt segment". */
function nyEntitet(): SegmentEntitet {
  return {
    id: `nytt-${Date.now()}`,
    namn: '',
    predikat: { med: [nyttVillkor()], utan: [] },
    arvdRegel: null,
    skiss: true,
  };
}

export function VariantD() {
  const dataSource = useDataSource();
  const [vy, setVy] = useState<Vy>({ namn: 'lista' });
  /** Segment skapade/ändrade i sidan (no-op-stubb: lever bara i minnet). */
  const [egna, setEgna] = useState<SegmentEntitet[]>([]);
  /**
   * Det ÄNNU OSPARADE utkastet ur "Nytt segment". Utan det landade Avbryt på
   * en detaljsida för ett namnlöst segment utan regel — en yta som varken
   * säger något eller går att göra något med, och som dessutom blev kvar i
   * listan. Ett utkast som avbryts ska försvinna som om det aldrig fanns.
   */
  const [utkastId, setUtkastId] = useState<string | null>(null);
  /** Markera-läget i listan — multi-segmentets ingång. */
  const [markeraLage, setMarkeraLage] = useState(false);
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());
  /**
   * SKALPROVET bor på variant-nivå, inte i detaljvyn. Skälet är att svaret på
   * "håller formen vid 85?" inte får sluta vid detaljsidans dörr: publiken
   * följer med till utskicksvyn, där listan, grinden och granskningens rutor
   * ska klara samma storlek. Växeln bor däremot bara där publiken bor.
   */
  const [skalprov, setSkalprov] = useState(false);

  const segments = useQuery({
    queryKey: ['proto-d', 'segments'],
    queryFn: () => dataSource.listSegments(),
  });
  const events = useQuery({
    queryKey: ['proto-d', 'events'],
    queryFn: () => dataSource.fetchEvents(),
  });

  const parInfo = useMemo(() => (events.data ? byggParInfo(events.data) : []), [events.data]);

  /**
   * CI-FIXTURERNA FILTRERAS BORT (Marcus 2026-08-10).
   *
   * Dev-servern kör `.env.development` → samma Supabase-projekt som staging,
   * och staging-basens `Segment` bär acceptance-svitens egna rader:
   * `app-segment-test+<uuid>`, alla med IDENTISK regel, nyskrivna vid varje
   * CI-körning. De städas av purge-targeten (`TASK-87`) men hinner samlas
   * mellan svepen, och i listan såg de ut som innehåll.
   *
   * Prefixet är sviten egna, stabila namnrymd — inte en gissning på formen.
   * Filtret sitter HÄR, i prototypens vy, och rör varken purge-policyn eller
   * `get-segments`: testdata ska inte synas när formen bedöms, men den ska
   * fortsätta finnas där testerna letar efter den.
   */
  const sparade = useMemo<SegmentEntitet[]>(
    () =>
      (segments.data ?? [])
        .filter((s) => !(s.namn ?? '').startsWith('app-segment-test'))
        .map((s) => ({
          id: s.id,
          namn: s.namn ?? '(namnlöst segment)',
          predikat: null,
          arvdRegel: s.rule,
          skiss: false,
        })),
    [segments.data],
  );

  const skisser = useMemo(() => [...byggSkisser(parInfo), ...egna], [parInfo, egna]);
  const alla = useMemo(() => [...sparade, ...skisser], [sparade, skisser]);
  const hitta = (id: string) => alla.find((e) => e.id === id);

  const laddar = segments.isPending || events.isPending;
  const fel = segments.error instanceof Error ? segments.error : null;

  // Esc lämnar markera-läget (`c` ← `Deltagare.tsx § useMarkeringsLage`):
  // läget äger hela listan och fokus kan stå var som helst när man vill backa.
  useEffect(() => {
    if (!markeraLage) return;
    const vidTangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMarkeraLage(false);
        setValda(new Set());
      }
    };
    document.addEventListener('keydown', vidTangent);
    return () => document.removeEventListener('keydown', vidTangent);
  }, [markeraLage]);

  const sparaRegel = (id: string, namn: string, pred: Predikat) => {
    setEgna((lista) => {
      const finns = lista.some((e) => e.id === id);
      const uppdaterad: SegmentEntitet = {
        id,
        namn: namn || 'Namnlöst segment',
        predikat: pred,
        arvdRegel: null,
        skiss: true,
      };
      return finns ? lista.map((e) => (e.id === id ? uppdaterad : e)) : [...lista, uppdaterad];
    });
    setUtkastId(null);
    setVy({ namn: 'detalj', id });
  };

  /** Avbryt i regelverkstaden: ett osparat utkast rivs, ett befintligt inte. */
  const lamnaRegeln = (id: string) => {
    if (id === utkastId) {
      setEgna((lista) => lista.filter((e) => e.id !== id));
      setUtkastId(null);
      setVy({ namn: 'lista' });
      return;
    }
    setVy({ namn: 'detalj', id });
  };

  if (vy.namn === 'utskick') {
    const valdaEntiteter = vy.ids
      .map((id) => hitta(id))
      .filter((e): e is SegmentEntitet => e !== undefined);
    const forsta = valdaEntiteter[0];
    if (forsta) {
      return (
        <UtskicksVy
          entiteter={valdaEntiteter}
          parInfo={parInfo}
          skalprov={skalprov}
          onTillbaka={() =>
            setVy(vy.retur === 'detalj' ? { namn: 'detalj', id: forsta.id } : { namn: 'lista' })
          }
        />
      );
    }
  }

  if (vy.namn === 'detalj' || vy.namn === 'regel') {
    const entitet = hitta(vy.id);
    if (entitet) {
      if (vy.namn === 'regel') {
        return (
          <RegelVerkstad
            entitet={entitet}
            parInfo={parInfo}
            onTillbaka={() => lamnaRegeln(entitet.id)}
            onSpara={(namn, pred) => sparaRegel(entitet.id, namn, pred)}
          />
        );
      }
      return (
        <SegmentDetalj
          entitet={entitet}
          parInfo={parInfo}
          skalprov={skalprov}
          onSkalprov={setSkalprov}
          onTillbaka={() => setVy({ namn: 'lista' })}
          onSkicka={() => setVy({ namn: 'utskick', ids: [entitet.id], retur: 'detalj' })}
          onAndra={() => setVy({ namn: 'regel', id: entitet.id })}
        />
      );
    }
  }

  return (
    <SegmentLista
      poster={alla}
      parInfo={parInfo}
      laddar={laddar}
      fel={fel}
      markeraLage={markeraLage}
      valda={valda}
      onOppna={(id) => setVy({ namn: 'detalj', id })}
      onNytt={() => {
        const entitet = nyEntitet();
        setEgna((lista) => [...lista, entitet]);
        setUtkastId(entitet.id);
        setVy({ namn: 'regel', id: entitet.id });
      }}
      onOppnaMarkering={() => setMarkeraLage(true)}
      onStangMarkering={() => {
        setMarkeraLage(false);
        setValda(new Set());
      }}
      onVaxla={(id, vald) =>
        setValda((s) => {
          const ny = new Set(s);
          if (vald) ny.add(id);
          else ny.delete(id);
          return ny;
        })
      }
      onMarkeraAlla={() => setValda(new Set(alla.map((e) => e.id)))}
      onRensa={() => setValda(new Set())}
      onSkicka={() => {
        // Ingen begäran att sätta längre: listan räknar redan varje kort, så
        // de markerade segmentens tal ligger i cachen under sin regelsignatur
        // när utskicksvyn öppnas. Vägen lista → utskick kostar noll walks.
        setVy({ namn: 'utskick', ids: [...valda], retur: 'lista' });
      }}
    />
  );
}
