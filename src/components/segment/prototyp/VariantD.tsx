/**
 * [PROMOVERAD TASK-249.5, ADR-103 B2 steg 1] Denna fil ÄR sedan flippen den
 * OVILLKORLIGA skarpa formen på `/mer/segment` (`src/routes/_authenticated/
 * mer/segment.tsx`) — inte längre bara nåbar via `?variant=d`. Docblocket
 * nedan är historiskt kvar (S104 divergens-passets resonemang, korrekt som
 * HISTORIK) men FYRA claims är nu STALE och superseded av 249.5:
 *   - "KASTBAR KOD" (rad nedan) — filen är permanent, inte kastbar.
 *   - § EXPANSIONEN SKER I KLIENTEN + § AND-PRIMITIVEN's "prototyp-genväg"/
 *     "klient-snittet" — LÖST: `predikatTillDnfRegel` bygger regeln som EN
 *     DNF-formad `SegmentRuleDnf` och skickar den i ETT `compute-segment`-
 *     anrop; `Frageplan`/`byggFrageplan`/`raknaSammansatt` (klient-side
 *     snitt/union) är BORTTAGNA (AC#2).
 *   - `KURS_KARTA` (härnäst i filen) — BORTTAGEN; `byggParInfo` läser
 *     `Event.kursfamilj`/`Event.kursniva` (TASK-249.4:s basfält) via
 *     `familjFranBas`/`nivaFranBas` (AC#3).
 *   - Tidsperiodens "räknesteget markerar öppet att antalet är utan
 *     tidsfiltret" (§ REGELFORMEN + `RegelVerkstad`) — LÖST: `Villkor.period`
 *     följer med som `Par.period` i DNF-regeln, servern filtrerar (ADR-115
 *     EF-krav 2/5, TASK-249.3), och räkne-ärlighets-disclaimern är borttagen.
 * `saveSegment`/`sendEmail`/testmail RÖRS INTE av 249.5 (AC#1: den
 * promoverade formen är identisk med den körande prototypen i variant
 * d-läge) — de förblir no-op/simulerade, exakt som innan flippen.
 *
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
 * Frågan och det bindande premissunderlaget:
 * `tasks/sessions/bilagor/s104-segment-divergens/DUKNING.md` +
 * sessionsdok S104 Del 2 (besluten). Divergens-passets märkning bodde i
 * `src/components/segment/SegmentPrototyp.tsx` — växeln mellan a/b/c/d — och
 * revs med varianterna (TASK-249.6); denna fil är sedan TASK-249.5 den skarpa
 * segment-ytan, monterad direkt av `src/routes/_authenticated/mer/segment.tsx`.
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
 * AND-PRIMITIVEN — konjunkt-grupper i `med` (S104 Del 3, resume-bygget)
 *
 * De fjorton verkliga Skool-grupperna falsifierade den platta villkorslistan:
 * "RIM1 + RIM2" betyder *gått båda*, och `med` som ren OR kunde aldrig säga
 * det — 10 av 14 grupper, 127 av 416 personer, var outtryckbara
 * (`tasks/sessions/bilagor/s104-segment-divergens/underlag-de-fjorton-skool-grupperna.md`).
 * `med` är därför en lista av KONJUNKT-GRUPPER (disjunktiv normalform): minst
 * en grupp ska uppfyllas, och inom gruppen gäller alla villkor samtidigt.
 * `utan` är kvar platt — exklusiviteten behövde aldrig AND.
 *
 * MOTORN KAN BARA OR (`segment-membership.ts` rad 11), så konjunktionen
 * räknas som SNITT AV MEDLEMSMÄNGDER i webbläsaren: varje villkor är en egen
 * `compute-segment`-fråga (cachad på sin signatur), gruppen är snittet av
 * sina villkors svar, `med` unionen av grupperna, `utan` dras bort sist. Se
 * `byggFrageplan` — ett predikat utan flerledade grupper går exakt dagens väg
 * (EN walk, samma cache-nyckel som förut), och de fjorton delar FYRA
 * villkor-frågor totalt: kombinatoriken bor i algebran, inte i walks.
 *
 * SAMMA STATUS SOM EXPANSIONEN OVAN (EF-krav 4): skarpt måste AND-stödet in i
 * `segment-membership.ts` och därmed i BÅDE `compute-segment` och
 * `send-email` — ett klient-snitt kan mottagarkontrollen aldrig lita på
 * (T50 lager b). Klient-snittet får inte promoveras.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SKALPROVET ÄR RIVET (TASK-249.6) — det var en rigg, och riggar rivs med
 * promoveringen (ADR-103: flaggor och växlar, aldrig formen).
 *
 * Vad det var, för den som läser en äldre referens: detaljvyns hela idé är att
 * publiken är huvudinnehållet, synlig direkt — men staging ger 1–2 personer
 * med avstämd närvaro, så chunkningen (25), visningsfiltret och söket hade
 * aldrig setts arbeta. Skalprovet var en AVSTÄNGD-SOM-DEFAULT växel som fyllde
 * publiken till ett mål per segment med `@exempel.invalid`-personer, med en
 * varningsruta som inte gick att missa överallt publiken visades. Det FYLLDE
 * UT en verklig publik, det SKAPADE aldrig en.
 *
 * Eftersom det var avstängt som default rörde det aldrig någon referens eller
 * någon granskad yta — rivningen tar därför bort kontrollen och dess kod utan
 * att ett enda tal eller en enda rad i formen ändras.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ-ONLY FÖRSTÄRKT: `saveSegment`, `sendEmail` och testmail är no-op-
 * stubbar. Filen når ingen mutation — varken prod eller staging. Läsvägarna
 * (`fetchEvents`, `listSegments`, `computeSegment`) går via `useDataSource()`
 * (ADR-055/057); adapter-gränsen kringgås aldrig.
 */
import { parseDate } from '@internationalized/date';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Group,
  Layers,
  ListPlus,
  Minus,
  Pencil,
  Plus,
  Send,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Checkbox } from 'react-aria-components';
import { DetaljGrupp, EtikettVardeRad } from '@/components/events/detail/DetaljGrupp';
import { Button } from '@/components/primitives/Button';
import { DatumFalt } from '@/components/primitives/DatumFalt';
import { Input } from '@/components/primitives/Input';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { SidRam, SidRamKnapp } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { StegSektion } from '@/components/primitives/StegSektion';
import { TextArea } from '@/components/primitives/TextArea';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import type {
  MedVillkor,
  Modalitet,
  Par,
  SegmentMember,
  SegmentRule,
  SegmentRuleDnf,
} from '@/domain/schemas';
import { deriveTaxonomy, labelForPar, parKey } from '@/lib/segment-taxonomy';
import { lasSegmentStartinfoDold, sparaSegmentStartinfoDold } from './segment-startinfo-minne';

/* ================================================================== *
 * DIMENSIONSMODELLEN — den nya regelformens råmaterial
 * ================================================================== */

type Familj = 'RIM' | 'Fjärrskådning' | 'Psionautics';
type Niva = 'intro' | '1' | '2' | '3';

/**
 * [TASK-249.5, AC#3] BASFÄLTEN — Kursfamilj/Kursnivå finns nu som fält på
 * Eventplanering (TASK-249.4, verifierat prod 51/51 satta) och exponeras av
 * `get-events` (`Event.kursfamilj`/`Event.kursniva`). Den tidigare hårdkodade
 * `KURS_KARTA`-konstanten är BORTTAGEN — `byggParInfo` nedan läser
 * dimensionerna ur `Event`-raderna direkt via `familjFranBas`/`nivaFranBas`.
 *
 * BASENS RÅVÄRDEN SKILJER SIG FRÅN UI-INTERNA `Niva`-KONSTANTERNA:
 * `Kursnivå` bär "Intro"/"Nivå 1"/"Nivå 2"/"Nivå 3" (data-model.md), medan
 * `Niva`-typen internt är `'intro' | '1' | '2' | '3'` (radio-/toggle-värden,
 * `NIVA_ETIKETT` nedan). `nivaFranBas` är den ENDA översättningspunkten.
 * `Kursfamilj` bär redan exakt `Familj`-unionens värden ('RIM' ·
 * 'Fjärrskådning' · 'Psionautics') — `familjFranBas` validerar bara att
 * strängen är en av de tre kända (fail-closed mot en framtida okänd familj).
 *
 * Nakna "Resor i medvetandet" (RIM-familjen, nivå Intro) är en FÖRELÄSNING
 * (fälla #35: distinkt kursnamn, skilt från RIM 1/2/3-serien) — basens
 * backfill (`course-dimensions.ts`) speglar exakt samma mappning som den
 * tidigare `KURS_KARTA` bar, så detta ändras inte i sak, bara i källa.
 *
 * DEN ÖPPNA LUCKAN LEVER KVAR, NU MOT VERKLIG DATA: en kurs UTAN känd
 * Kursfamilj i basen (okänt kursnamn, `create-event` utelämnar fälten öppet
 * — `course-dimensions.ts`) får `familj: null` och matchar därför inget
 * familj-villkor. `OkandaKurser` nedan säger det öppet i UI:t i stället för
 * att låta kursen försvinna tyst — samma disciplin som innan, nu mot basens
 * faktiska tillstånd i stället för en hårdkodad karta.
 */
const NIVA_FRAN_BAS: Readonly<Record<string, Niva>> = {
  Intro: 'intro',
  'Nivå 1': '1',
  'Nivå 2': '2',
  'Nivå 3': '3',
};

/** Kursnivå-basvärde → intern `Niva`. Okänt/tomt värde → `null` (nivålös familj
 *  eller okänd sträng — bägge räknas som "ingen nivå att villkora på"). */
function nivaFranBas(varde: string | null): Niva | null {
  return varde === null ? null : (NIVA_FRAN_BAS[varde] ?? null);
}

/** Kursfamilj-basvärde → `Familj`, fail-closed mot okänd sträng (bidrar då
 *  till `OkandaKurser` i stället för att gissa en familj). */
function familjFranBas(varde: string | null): Familj | null {
  return varde !== null && (FAMILJER as readonly string[]).includes(varde)
    ? (varde as Familj)
    : null;
}

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

/**
 * ÅR-DIMENSIONEN SOM EF-KRAV, INTE SOM KONTROLL.
 *
 * Texten står i regelverkstaden där dimensionen annars hade suttit. Att skriva
 * ut vad ytan INTE kan är billigare än att låta någon upptäcka det efter ett
 * utskick — och kravet ska med i PRD:n, inte lösas i klienten.
 */
/**
 * ETT VILLKOR = ett predikat över dimensionerna. Tom lista på en dimension
 * betyder "alla värden" — UTOM modaliteten, som aldrig får vara osagd.
 *
 * `period` ÄR EN UI-DIMENSION MED ETT SERVER-KRAV (varv 6d, Marcus
 * 2026-08-16: "jag vill kunna välja tidsperiod … på proffsigast möjliga
 * sätt"). Formen bär valet och klartexten bär det i regelmeningen.
 * [TASK-249.5] LÖST: `predikatTillDnfRegel` lägger `period` på varje `Par`
 * regeln expanderas till, och servern (`_shared/segment-membership.ts`,
 * TASK-249.3, ADR-115 EF-krav 2/5) filtrerar deltagandet inom fönstret —
 * `AttendanceRow` bär numera datum (`Event startdatum`,
 * `segment-resolution.ts`). Antalet är därför ALLTID det verkställda talet;
 * ingen räkne-ärlighets-disclaimer behövs längre (den tidigare "Tidsperioden
 * räknas av servern - antalet är ännu utan den"-raden i `RegelVerkstad` är
 * borttagen).
 */
type Villkor = {
  id: string;
  familjer: Familj[];
  nivaer: Niva[];
  /** OBLIGATORISK. `null` = användaren har inte valt än → villkoret räknas inte. */
  modalitet: ModalitetsVal | null;
  format: string[];
  /** ISO-datumpar (från/till). `null` = deltagande när som helst räknas. */
  period: { start: string; end: string } | null;
};

/** Perioden som människotext — "1 feb. 2025 till 30 juni 2025". */
function periodText(p: { start: string; end: string }): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  return p.start === p.end ? fmt(p.start) : `${fmt(p.start)} till ${fmt(p.end)}`;
}

/**
 * EN KONJUNKT-GRUPP: alla villkor i gruppen ska uppfyllas SAMTIDIGT (och).
 * Fött ur de fjorton Skool-grupperna (S104 Del 3): "RIM1 + RIM2" betyder
 * *gått båda*, och det kunde en platt villkorslista aldrig uttrycka.
 */
type Konjunkt = { id: string; villkor: Villkor[] };

/**
 * Regeln som predikat i disjunktiv normalform: minst EN grupp i `med` ska
 * uppfyllas (eller mellan grupperna, och inom dem). `utan` är en platt union
 * som dras bort sist — exklusiviteten behövde aldrig AND (Del 3).
 */
type Predikat = { med: Konjunkt[]; utan: Villkor[] };

let villkorRaknare = 0;
function nyttVillkor(): Villkor {
  villkorRaknare += 1;
  return {
    id: `v${villkorRaknare}`,
    familjer: [],
    nivaer: [],
    modalitet: null,
    format: [],
    period: null,
  };
}

let konjunktRaknare = 0;
function nyKonjunkt(villkor: Villkor[] = [nyttVillkor()]): Konjunkt {
  konjunktRaknare += 1;
  return { id: `k${konjunktRaknare}`, villkor };
}

/* ================================================================== *
 * TAXONOMIN BERIKAD — bron mellan predikatet och `compute-segment`
 * ================================================================== */

/** Ett taxonomi-par med sina dimensionsvärden. `familj: null` = okänd
 *  Kursfamilj i basen (TASK-249.5 § BASFÄLTEN ovan) — inte längre "utanför
 *  en hårdkodad karta". */
type ParInfo = {
  par: Par;
  nyckel: string;
  familj: Familj | null;
  niva: Niva | null;
  format: string;
};

/**
 * Berikar `deriveTaxonomy`-paren med dimensionerna — LÄSTA UR BASENS FÄLT
 * (TASK-249.5, AC#3), inte längre ur `KURS_KARTA`.
 *
 * DIMENSIONERNA ÄR PER KURSNAMN, INTE PER EVENT-RAD: flera Eventplanering-
 * rader kan dela samma `eventNamn` (kursen hålls flera gånger), så
 * `dimsPerKurs` indexerar FÖRSTA kända (icke-null Kursfamilj) träffen per
 * kursnamn — en enstaka rad utan fälten (t.ex. föddes innan create-event
 * satte dem, eller ett CI-skapat ZZ-event, data-model.md § kända kanten)
 * spärrar då inte hela kursens dimension om en ANNAN rad med samma namn bär
 * den. Matchar `deriveTaxonomy`s eget "första förekomst vinner"-mönster.
 *
 * INGET ÅR HÄRLEDS HÄR LÄNGRE. Första formen samlade eventens `Startdatum` per
 * par — men ett år knutet till ett PAR kan bara svara på "vilka kurser gick
 * 2025", aldrig på "vem gick något 2025", eftersom motorns rader inte bär
 * någon tidpunkt alls. Datan fanns; frågan den kunde besvara var fel fråga.
 */
function byggParInfo(events: Event[]): ParInfo[] {
  const dimsPerKurs = new Map<string, { familj: string | null; niva: string | null }>();
  for (const e of events) {
    if (!e.eventNamn) continue;
    const kand = dimsPerKurs.get(e.eventNamn);
    if (kand?.familj) continue; // en känd familj för kursnamnet räcker
    dimsPerKurs.set(e.eventNamn, { familj: e.kursfamilj ?? null, niva: e.kursniva ?? null });
  }
  return deriveTaxonomy(events).map((par) => {
    const dims = dimsPerKurs.get(par.kurs);
    return {
      par,
      nyckel: parKey(par),
      familj: familjFranBas(dims?.familj ?? null),
      niva: nivaFranBas(dims?.niva ?? null),
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

/** En grupp räknas bara när den har villkor och SAMTLIGA är giltiga — ett
 *  halvbyggt och-krav får aldrig VIDGA gruppen genom att tyst falla bort. */
function konjunktGiltig(k: Konjunkt): boolean {
  return k.villkor.length > 0 && k.villkor.every(villkorGiltigt);
}

/**
 * BRUTTO-EXPANSIONEN — vilka kurspar predikatet RÖR, som `{include, exclude}`.
 * Unionen dedupas på par-nyckeln: två villkor som råkar träffa samma kurs ger
 * ett par, inte två (EF:ens `parseSegmentRule` bryr sig inte, men en dubblett
 * i klartexten hade läst som ett fel).
 *
 * SEDAN AND-PRIMITIVEN ÄR DETTA INTE ALLTID FRÅGAN — bruttot är METADATA
 * (tomhets-avgörandet, modalitets-vakten, verkstadens expansions-not), aldrig
 * frågevägen. (Motsvarar-raden stod här som första exempel tills TASK-390
 * iteration 3 rev den, 2026-09-05.) Den frågevägen (TASK-249.5) är
 * `predikatTillDnfRegel` nedan,
 * som skickar EN DNF-regel direkt (ingen klient-side snitt/union, AC#2).
 * Ogiltiga grupper bidrar med INGENTING — inte heller sina giltiga villkor.
 */
function expandera(pred: Predikat, parInfo: ParInfo[]): SegmentRule {
  const plocka = (villkor: Villkor[]): Par[] => {
    const karta = new Map<string, Par>();
    for (const v of villkor) {
      for (const p of traffar(v, parInfo)) karta.set(p.nyckel, p.par);
    }
    return [...karta.values()];
  };
  return {
    include: plocka(pred.med.filter(konjunktGiltig).flatMap((k) => k.villkor)),
    exclude: plocka(pred.utan),
  };
}

/** Ett villkor som EGEN, FLAT OR-regel — generatorns per-atom-frågor
 *  (`DelaUppIGrupper`) behöver K OBEROENDE medlemsmängder (en per vald atom)
 *  för att räkna bitmask-kombinationer (`raknaKombinationer`); det är en
 *  annan fråga än AND-primitivens (som numera går via `predikatTillDnfRegel`
 *  i EN DNF-regel), så denna enkla byggare lever kvar oförändrad. */
function villkorsRegel(v: Villkor, parInfo: ParInfo[]): SegmentRule {
  return { include: traffar(v, parInfo).map((p) => p.par), exclude: [] };
}

/** Deterministisk signatur → query-nyckel + "har regeln ändrats"-jämförelse.
 *  [TASK-249.5] DNF-medveten (`MedVillkor` = `Par` ELLER en Konjunkt-grupp
 *  `Par[]`) och periodmedveten — två regler som skiljer sig bara i
 *  `Par.period` MÅSTE få olika signatur, annars delar de fel cache-post. */
function parNyckelMedPeriod(p: Par): string {
  return p.period ? `${parKey(p)}@${p.period.start}..${p.period.end}` : parKey(p);
}
function medVillkorNyckel(v: MedVillkor): string {
  return Array.isArray(v)
    ? `[${v.map(parNyckelMedPeriod).sort().join(',')}]`
    : parNyckelMedPeriod(v);
}
function regelSignatur(rule: SegmentRuleDnf): string {
  const include = rule.include.map(medVillkorNyckel).sort();
  const exclude = rule.exclude.map(parNyckelMedPeriod).sort();
  return JSON.stringify({ include, exclude });
}

/* ================================================================== *
 * DNF-REGELN DIREKT — EN regel, ETT compute-segment-anrop (AC#2, TASK-249.5)
 * ================================================================== */

/** Ett `Par` med villkorets `period` (om satt) — ADR-115 EF-krav 2/5:
 *  servern filtrerar deltagande inom fönstret; `undefined` = när som helst. */
function parMedPeriod(v: Villkor, p: Par): Par {
  return v.period ? { ...p, period: v.period } : p;
}

/** Kartesisk produkt över flera villkors par-mängder — en kombination per
 *  Konjunkt-term (ett par PER villkor, alla samtidigt). Ett villkor utan
 *  träffar gör HELA kombinationen omöjlig (tom produkt), aldrig ett
 *  fail-open "hoppa över villkoret". */
function kombinationer(perVillkor: Par[][]): Par[][] {
  return perVillkor.reduce<Par[][]>(
    (acc, pars) =>
      pars.length === 0 ? [] : acc.flatMap((kombo) => pars.map((p) => [...kombo, p])),
    [[]],
  );
}

/**
 * Predikatet → EN `SegmentRuleDnf`, inget klient-side snitt/union (AC#2:
 * "ingen medlemsberäkning eller regelexpansion sker i klienten" — ersätter
 * `Frageplan`/`byggFrageplan`/`raknaSammansatt`, som körde 1..N
 * `compute-segment`-frågor och räknade snittet i webbläsaren).
 *
 * Enledade giltiga grupper (vanligast — mallvyns "minst en av", ett enkelt
 * villkor) blir platta `Par`-poster i `include`, EXAKT `expandera()`s
 * semantik. Flerledade giltiga grupper (AND, ADR-115) distribueras till sina
 * konkreta AND-kombinationer (kartesisk produkt över gruppens villkor, se
 * `kombinationer`) — servern (`_shared/segment-membership.ts` `Konjunkt`)
 * kräver en FLAT `Par[]`-lista som alla ska vara uppfyllda samtidigt, så ett
 * villkor med flera träffande par inom en AND-grupp måste distribueras ut
 * som separata Konjunkt-termer (standard AND-över-OR). `utan` förblir platt
 * (ADR-115: exklusiviteten behövde aldrig AND).
 */
function predikatTillDnfRegel(pred: Predikat, parInfo: ParInfo[]): SegmentRuleDnf {
  const include: MedVillkor[] = [];
  for (const k of pred.med) {
    if (!konjunktGiltig(k)) continue;
    if (k.villkor.length === 1) {
      const v = k.villkor[0] as Villkor;
      for (const p of traffar(v, parInfo)) include.push(parMedPeriod(v, p.par));
    } else {
      const perVillkor = k.villkor.map((v) =>
        traffar(v, parInfo).map((p) => parMedPeriod(v, p.par)),
      );
      for (const term of kombinationer(perVillkor)) include.push(term);
    }
  }
  const exclude = pred.utan
    .filter(villkorGiltigt)
    .flatMap((v) => traffar(v, parInfo).map((p) => parMedPeriod(v, p.par)));
  return { include, exclude };
}

/* ── Klartext ─────────────────────────────────────────────────────── */

function listaOrd(delar: string[], bindeord = 'eller'): string {
  if (delar.length <= 1) return delar[0] ?? '';
  return `${delar.slice(0, -1).join(', ')} ${bindeord} ${delar.at(-1)}`;
}

/**
 * Ett villkor som svensk mening. Modaliteten står ALLTID med — den är
 * meningens verb-komplement och därmed omöjlig att läsa förbi.
 *
 * ÖPPEN SPÄNNING EFTER ORDBYTET (mätt i webbläsaren 2026-08-16, Marcus
 * beslut "Utbildning ska definitivt vara globalt"). Meningen har TVÅ led som
 * nu kan bära samma ord av olika skäl: familj-ledet (taxonomin — det som
 * hette "kurs") och modalitets-ledet (formen deltagandet hade). De tre
 * utfallen, verbatim ur ytan:
 *
 *   "Deltagit i RIM-utbildning som utbildning."      ← TAUTOLOGI
 *   "Deltagit i någon utbildning som utbildning."    ← värst, familjen tom
 *   "Deltagit i RIM-utbildning som föreläsning."     ← läsbart, men skaver
 *
 * ORDBYTET ÄR ÄNDÅ GJORT RAKT AV, med avsikt: ordern gällde ordet, och
 * meningens FORM är ett Marcus-beslut som inte fattas här. Modaliteten får
 * inte falla bort som lösning — den är säkerhetskrav (filhuvudet § MODALITET
 * ÄR OBLIGATORISK), inte stilistik.
 *
 * VÄGEN UT, om formen ska ändras: stryk substantivet ur FAMILJ-ledet i
 * stället ("Deltagit i RIM på Nivå 1 som utbildning" / "… som föreläsning").
 * Då bär modaliteten ordet ensam och ingen mening säger det två gånger.
 * Tomma familj-fallet behöver då ett eget ord — `publikOrd` löser samma
 * problem genom att baka in modaliteten i frasen.
 *
 * Jämför `manniskoMening`, som redan gör ett VILLKORAT val åt andra hållet
 * (ordet bara när modaliteten ÄR Utbildning) — den precedensen finns, men
 * dess meningsstruktur är en annan och går inte att kopiera rakt hit.
 */
function villkorKlartext(v: Villkor): string {
  if (v.modalitet === null) return 'Ofullständigt villkor - välj vilka som räknas.';
  // VERBET BÄR FORMEN (Marcus 2026-08-16, textinventeringen: "Deltagit i
  // något som utbildning" var ingen mening, och "som utbildning" efter valet
  // "De som gått utbildningar" var dubbelmacka). Samma princip som
  // `manniskoMening`/`publikOrd`: "Har gått" ÄR utbildning, "Har varit på en
  // föreläsning" ÄR föreläsning — bara "Båda" behöver ett förtydligande led,
  // för där är det inte redundant.
  const namn = v.familjer.length === 0 ? null : listaOrd(v.familjer);
  const niva = v.nivaer.length === 0 ? '' : ` på ${listaOrd(v.nivaer.map((n) => NIVA_ETIKETT[n]))}`;
  const format = v.format.length === 0 ? '' : ` i formatet ${listaOrd(v.format)}`;
  const period = v.period === null ? '' : `, under perioden ${periodText(v.period)}`;
  const stomme =
    v.modalitet === 'Utbildning'
      ? namn === null
        ? `Har gått någon utbildning${niva}`
        : `Har gått ${namn}${niva}`
      : v.modalitet === 'Föreläsning'
        ? namn === null
          ? `Har varit på någon föreläsning${niva}`
          : `Har varit på en föreläsning i ${namn}${niva}`
        : namn === null
          ? `Har gått någon utbildning eller varit på någon föreläsning${niva}`
          : `Har deltagit i ${namn}${niva} - som utbildning eller föreläsning`;
  return `${stomme}${format}${period}.`;
}

/**
 * En grupp som svensk mening: villkoren bundna med "och samtidigt" — bindningen
 * måste höras, för det är exakt skillnaden mot "Eller:" mellan grupperna.
 * "RIM1 + RIM2" ska läsas *gått båda*, aldrig *den ena eller den andra*.
 */
function konjunktKlartext(k: Konjunkt): string {
  const delar = k.villkor.map((v) => villkorKlartext(v).replace(/\.$/, ''));
  const [forsta, ...rest] = delar;
  if (forsta === undefined) return '';
  return rest.length === 0
    ? forsta
    : `${forsta}, och samtidigt ${rest.map((d) => sankInledning(d)).join(', och samtidigt ')}`;
}

/** "Deltagit i …" → "deltagit i …" när meningen fortsätter efter ett komma. */
function sankInledning(mening: string): string {
  return mening.charAt(0).toLowerCase() + mening.slice(1);
}

function predikatKlartext(pred: Predikat): string {
  const med = pred.med.filter(konjunktGiltig);
  const utan = pred.utan.filter(villkorGiltigt);
  if (med.length === 0) return 'Ingen regel byggd än.';
  // "Med:"-prefixet är borta (Marcus 2026-08-10). Det var en etikett på det
  // enda som stod där i de allra flesta fall - villkoret bär redan sin egen
  // mening ("Deltagit i ..."). "Utan:" står kvar, för den behövs: den vänder
  // betydelsen och får aldrig läsas som en fortsättning på raden före.
  const medText = `${med.map((k) => konjunktKlartext(k)).join('. Eller: ')}.`;
  if (utan.length === 0) return medText;
  // UTESLUTNINGARNA BINDS MED "eller" I LÖPANDE TEXT (Marcus 2026-08-10,
  // korttext-varvet): "Utan: A. Eller: B." lästes som att B var ett
  // INKLUSIONS-alternativ till hela regeln — exakt den boolesk-parsning
  // ingen ska behöva göra. "Utan: A eller B." kan inte missläsas så.
  // Med-sidans ". Eller: " står kvar: där ÄR grupperna genuina alternativ.
  return `${medText} Utan: ${utan.map((v) => villkorKlartext(v).replace(/\.$/, '')).join(' eller ')}.`;
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
  /**
   * Människo-mening skriven UR AVSIKTEN vid skapandet (`manniskoMening` via
   * `byggGrupp`) — kortens beskrivning för genererade grupper. Saknas den
   * faller `definitionFor` till regel-klartexten. Redigeras en genererad
   * grupp i verkstaden skapas en NY entitet utan beskrivning (`sparaRegel`)
   * — avsikts-meningen följer med AVSIKTEN, aldrig en regel som kan ha
   * ändrats bort från den.
   */
  beskrivning?: string;
};

/**
 * BRUTTO-regeln för en entitet — vilka kurspar den RÖR. Sedan AND-primitiven
 * är detta INTE frågan för ett predikat med flerledade grupper (frågan äger
 * `useEntitetsMedlemmar` via frågeplanen); bruttot bär modalitets-vakten,
 * tomhets-avgörandet (`tomRegel`) och `RegelStruktur`s uppräknade gren. För
 * ärvda uppräknade regler och predikat utan flerledade grupper är brutto och
 * fråga samma sak. (Detaljvyns "Motsvarar"-rad läste också härifrån tills
 * TASK-390 iteration 3 rev den, Marcus dom 2026-09-05.)
 */
function bruttoRegelFor(entitet: SegmentEntitet, parInfo: ParInfo[]): SegmentRule {
  if (entitet.predikat) return expandera(entitet.predikat, parInfo);
  return entitet.arvdRegel ?? { include: [], exclude: [] };
}

function definitionFor(entitet: SegmentEntitet, parInfo: ParInfo[]): string {
  // Avsikts-meningen vinner över regel-klartexten överallt den finns —
  // kortet, detaljen och utskickets segmentrad läser alla samma beskrivning.
  // Precisionen (den fulla regeln) bor kvar i regelverkstaden.
  if (entitet.beskrivning) return entitet.beskrivning;
  if (entitet.predikat) return predikatKlartext(entitet.predikat);
  const rule = bruttoRegelFor(entitet, parInfo);
  if (rule.include.length === 0) return 'Uppräknad regel utan inkluderade utbildningar.';
  const med = `${rule.include.map(labelForPar).join(' ELLER ')}.`;
  // Samma "eller"-språkfix som predikatKlartexts utan-sida (Marcus 2026-08-10).
  return rule.exclude.length > 0
    ? `${med} Utan: ${rule.exclude.map(labelForPar).join(' eller ')}.`
    : med;
}

/* ================================================================== *
 * REGELN SOM CHIPS — läs-only strukturvy (TASK-390 punkt 7)
 * ================================================================== */

/**
 * En LÄS-ONLY chip för en INKLUDERAD utbildning — husets SUCCESS-TON, EXAKT
 * de tokens `StatusBadge ton="success"` och täckningskvittensen (rad ~1713)
 * redan bär: `bg-success-bg` + `contrast-more:border-success` på kapseln,
 * `text-success` på ikonen ENSAM — texten själv står i default-färg (samma
 * val båda förlagorna gör, AA mätt mot 100-tonen; att tinta hela texten hade
 * varit en NY parning ingen annan yta bär). `<span>`, ingen knapp-semantik.
 *
 * ITERATION 2, TVÅ MARCUS-DOMAR I RAD (2026-09-04, mot staging):
 *   1. "Ta också bort alla 'utan' och 'eller' chips i regelblocket, det blev
 *      ju ännu otydligare nu." — operatorORDEN (och/eller/Utan:) är RIVNA.
 *   2. "Chipsen borde ligga på samma rad, och den/de chips vars utbildning
 *      inkluderas i segmentet bör vara grön ju? De andra nedtonade?" — de två
 *      RADERNA (första domens svar) är i sin tur ersatta av EN rad (se
 *      `RegelStruktur`), och tonen bär nu distinktionen i stället för
 *      positionen.
 *
 * FÄRG ÄR ALDRIG ENSAM BÄRARE (WCAG 1.4.1, `CLAUDE.md` § Kvalitetsribba,
 * Tillgänglighet alltid 11): `Check`-ikonen (`aria-hidden`) är en ANDRA,
 * form-baserad signal utöver tonen, och en `sr-only`-svans ("ingår") gör
 * skillnaden hörbar för skärmläsare som inte förmedlar bakgrundsfärg alls.
 * Under `prefers-contrast: more` tar kanten (`border-success`) över som
 * bärare när tonytan i sig kan tunnas ut.
 */
function RegelChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-success-bg px-3 py-1 text-small contrast-more:border-success">
      <Check aria-hidden="true" size={14} className="shrink-0 text-success" />
      {children}
      <span className="sr-only">, ingår</span>
    </span>
  );
}

/**
 * DÄMPAD läs-only chip för en EXKLUDERAD utbildning — SAMMA ANATOMI som
 * `RegelChip`, bara annan ton: `Minus`-ikon i stället för `Check`,
 * `bg-bg-emphasized` i stället för `bg-success-bg`, `text-text-muted` i
 * stället för default. Form, radie, padding (`px-3 py-1`), typsnittsgrad
 * (`text-small`) och `border-transparent` är IDENTISKA rader — de två
 * chipsen är samma objekt i två tillstånd, inte två olika objekt.
 *
 * ITERATION 3 (Marcus dom 2026-09-05): *"De 'ej-aktiverade' chipsen har
 * kontur bara, snyggare om stilen går konsekvent med aktiverade/valda chips
 * (de gröna), så en grå fyllnadsfärg istället för kontur tycker jag."* Det
 * VÄNDER iteration 2:s "kant i stället för platta" — den domen gällde en yta
 * där de gröna ännu inte var stämplade, och en kant mot en platta läste som
 * två skilda komponenter.
 *
 * TONVALET ÄR PÅTVINGAT AV BÄRYTAN, inte valt: chipsen sitter i
 * `DetaljGrupp`s kort, vars egen bakgrund ÄR `bg-bg-muted` (neutral-50). En
 * `bg-bg-muted`-chip hade alltså varit osynlig. `bg-bg-emphasized`
 * (neutral-100) är husets etablerade nästa steg på samma yta — exakt det
 * `RAD_KLASS` redan använder som hovertillstånd PÅ ett `bg-bg-muted`-kort.
 * Kontrasten `text-text-muted` (#6b6b6b) mot `bg-bg-emphasized` (#edeee9)
 * är 4,57:1, alltså över WCAG AA 4,5:1 för normal text (14 px).
 *
 * FÄRG ÄR FORTFARANDE ALDRIG ENSAM BÄRARE (WCAG 1.4.1) — och nu bär den
 * MINDRE ensam än förut, eftersom två ytor i samma tonfamilj skiljs åt av
 * mindre än en ton mot en kant gjorde: `Minus` kontra `Check` är den
 * form-baserade signalen, `sr-only`-svansen ("ingår inte") den hörbara.
 * `contrast-more:border-border-strong` tänder kanten igen i högkontrastläge
 * (mot `RegelChip`s `contrast-more:border-success` — två OLIKA kanter, så
 * paret går isär också där tonytorna tunnas ut).
 *
 * `print:border-border` ÅTERFÖR KONTUREN PÅ PAPPER, och den raden är inte
 * dekoration: webbläsare utelämnar bakgrundsfärger vid utskrift som default
 * (`print-color-adjust: economy`; "Background graphics" är en ruta användaren
 * måste kryssa i). Utan den hade båda plattorna tvättats bort och paret vilat
 * ensamt på ikonskillnaden. Nu skiljs de på papper som de gjorde före denna
 * ändring — kant kontra ingen kant — utöver `Minus`/`Check`.
 */
function RegelChipDampad({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-transparent bg-bg-emphasized px-3 py-1 text-small text-text-muted contrast-more:border-border-strong print:border-border">
      <Minus aria-hidden="true" size={14} className="shrink-0 text-text-muted" />
      {children}
      <span className="sr-only">, ingår inte</span>
    </span>
  );
}

/**
 * EN UTBILDNINGS-ETIKETT PER VILLKOR, I GRUPPKORTENS EGEN FORM ("RIM 1",
 * "Fjärrskådning", …) — INTE regelverkstadens dimension-chips (modalitet
 * separat, `NIVA_ETIKETT`s långform "Nivå 1"). Samma `familj`/`NIVA_KORT`-
 * sammansättning som `KursAtom.etikett` (rad ~938: `` `${familj}
 * ${NIVA_KORT[niva]}` ``) och `DE_FJORTON_ATOMER`s etiketter (rad
 * ~1056–1059) — gruppkortens NAMN, återanvänt rakt av i stället för
 * uppfunnet på nytt. Modaliteten (Utbildning/Föreläsning/Båda) är RIVEN som
 * egen chip (orkestrerarens fynd, iteration 2): den bär noll information —
 * varenda grupp i dagens taxonomi är "Utbildning", chippen upprepade bara
 * det.
 *
 * De fjorton förskapade gruppernas villkor har ALLTID exakt en familj och
 * som mest en nivå (`villkorForAtom`), så cross-produkten nedan kollapsar
 * till EN etikett för dem. För ett fritt byggt villkor (regelverkstaden,
 * flera familjer/nivåer i samma villkor) ger cross-produkten en etikett per
 * kombination — familjer UTAN nivådimension (`FAMILJER_MED_NIVA`) får sin
 * egen etikett oavsett vilka nivåer som råkar vara valda på ANDRA familjer
 * i samma villkor.
 */
function atomEtiketterForVillkor(v: Villkor): string[] {
  return v.familjer.flatMap((f) => {
    if (!FAMILJER_MED_NIVA.includes(f) || v.nivaer.length === 0) return [f];
    return v.nivaer.map((n) => `${f} ${NIVA_KORT[n]}`);
  });
}

/** Samma etikett-form som `atomEtiketterForVillkor`, men för ETT taxonomi-
 *  par (den äldre uppräknade regelformen) — slår upp familj/nivå via
 *  `parInfo` (`byggParInfo`s berikning). Saknar paret en känd familj (data-
 *  model-fälla, se `ParInfo`s docblock) faller den till `labelForPar`s
 *  fullständiga etikett i stället för att gissa. */
function atomEtikettForPar(p: Par, parInfo: ParInfo[]): string {
  const info = parInfo.find((pi) => pi.par.kurs === p.kurs && pi.par.modalitet === p.modalitet);
  if (!info?.familj) return labelForPar(p);
  return info.niva ? `${info.familj} ${NIVA_KORT[info.niva]}` : info.familj;
}

/**
 * Regeln STRUKTURERAT, under avsiktsmeningens prosa (`definitionFor`,
 * renderad av anroparen) — EN RAD, ordfritt (iteration 2, andra tillägget):
 * inkluderade chips (gröna) FÖRST, exkluderade chips (dämpade) DIREKT
 * EFTER, i samma `flex-wrap`-flöde. Marcus två domar i rad river först
 * operatorORDEN, sedan RADINDELNINGEN själv ("Chipsen borde ligga på samma
 * rad") — tonen (grön kontra dämpad, se `RegelChip`/`RegelChipDampad`) är nu
 * den ENDA visuella avgränsningen, förstärkt av varje chips egen ikon +
 * sr-only-svans i stället för en grupperande rad/rubrik.
 *
 * AND/OR/NOT-TRÄDET PLATTAS MEDVETET (samma skäl som första tillägget):
 * precisionen finns kvar i avsiktsmeningens prosa och i regelverkstaden,
 * chipsen här är en SKANBAR SAMMANFATTNING, inte en fullständig återgivning
 * av predikatet.
 *
 * TVÅ GRENAR, en per lagringsform — ingen egen parallell datakälla:
 * `entitet.predikat` läser Konjunkt/Villkor-trädet, den äldre uppräknade
 * formen (`predikat === null`) läser `bruttoRegelFor`s platta union.
 * Dubbletter (samma utbildning i flera villkor/grupper) dedupas var för sig
 * inom inkluderade/exkluderade — en utbildning kan aldrig vara båda samtidigt
 * i en giltig regel, så de två mängderna kan aldrig kollidera i DOM-nyckeln.
 *
 * Tom regel (inget giltigt villkor byggt än) renderar ingenting — samma
 * neutrala tomhet som `tomRegel`-grenen ovanför i `SegmentDetalj` redan
 * hanterar; prosan ovan ("Ingen regel byggd än."/"Uppräknad regel utan
 * inkluderade utbildningar.") räcker då som ensam text.
 */
function RegelStruktur({ entitet, parInfo }: { entitet: SegmentEntitet; parInfo: ParInfo[] }) {
  let inkluderade: string[];
  let exkluderade: string[];

  if (entitet.predikat) {
    const med = entitet.predikat.med.filter(konjunktGiltig);
    if (med.length === 0) return null;
    inkluderade = [
      ...new Set(
        med.flatMap((k) => k.villkor.filter(villkorGiltigt).flatMap(atomEtiketterForVillkor)),
      ),
    ];
    exkluderade = [
      ...new Set(entitet.predikat.utan.filter(villkorGiltigt).flatMap(atomEtiketterForVillkor)),
    ];
  } else {
    const rule = bruttoRegelFor(entitet, parInfo);
    if (rule.include.length === 0) return null;
    inkluderade = [...new Set(rule.include.map((p) => atomEtikettForPar(p, parInfo)))];
    exkluderade = [...new Set(rule.exclude.map((p) => atomEtikettForPar(p, parInfo)))];
  }
  if (inkluderade.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {inkluderade.map((etikett) => (
        <RegelChip key={`in-${etikett}`}>{etikett}</RegelChip>
      ))}
      {exkluderade.map((etikett) => (
        <RegelChipDampad key={`ut-${etikett}`}>{etikett}</RegelChipDampad>
      ))}
    </div>
  );
}

/**
 * PARTITION-GENERATORN — kärnan bakom "Dela upp i grupper" och de fjorton
 * förskapade grupperna nedan (S104 Del 3, Marcus-beslut "partition som
 * GENERATOR, inte som andra sortens segment"). En partition är INGEN
 * segmenttyp: den är en skapande-handling som tar en uppsättning kurs-atomer
 * och genererar N vanliga predikat-segment, ett per icke-tom kombination.
 *
 * ERSÄTTER de fem exempel-skisserna (`byggSkisser`, riven i denna commit —
 * git-historiken har den kvar om formen ska återställas med en rad). Skälet
 * är samma som filhuvudets § AND-PRIMITIVEN: verkliga målsegment (de fjorton)
 * avtäcker vad ytan faktiskt behöver på ett sätt fem egna påhittade exempel
 * aldrig gjorde (lesson-kandidat 7, Paushistorik 2).
 */

/** En KURS-ATOM: minsta byggkloss i en partition — ett (familj, nivå)-par
 *  som existerar i basen. FS och Psionautics är nivålösa (`niva: null`). */
type KursAtom = { familj: Familj; niva: Niva | null; nyckel: string; etikett: string };

/**
 * Presentationsordning för atom-chips OCH genererade gruppnamn — FS, RIM
 * (stigande nivå), Psionautics. Matchar bilagans EGEN ordning verbatim
 * ("Fjärrskådning + RIM1 + RIM2", aldrig omkastad) — en annan ordning hade
 * gjort listan svår att känna igen mot källan den kom ur. `FAMILJER` (chip-
 * radens ordning i `VillkorsKort`) har ett annat syfte och rörs inte.
 */
const ATOM_FAMILJORDNING: Familj[] = ['Fjärrskådning', 'RIM', 'Psionautics'];

/** Kort nivå-etikett för atom-chippet ("RIM 1", inte "RIM Nivå 1" — `NIVA_ETIKETT`
 *  är till för villkorskortets löptext, den här är till för en tät chip-rad). */
const NIVA_KORT: Record<Niva, string> = { intro: 'Intro', '1': '1', '2': '2', '3': '3' };

/**
 * Härleder kurs-atomerna som FINNS I BASEN för given modalitet, i
 * `ATOM_FAMILJORDNING`s ordning. `modalitet: 'Båda'` visar en atom om NÅGON
 * av de två modaliteterna har paret — samma "inget val = allt"-princip som
 * `matchar` använder för ett vanligt villkor.
 */
function harledKursAtomer(parInfo: ParInfo[], modalitet: ModalitetsVal): KursAtom[] {
  const finns = new Set(
    parInfo
      .filter((p) => p.familj !== null && (modalitet === 'Båda' || p.par.modalitet === modalitet))
      .map((p) => `${p.familj}|${p.niva ?? ''}`),
  );
  const atomer: KursAtom[] = [];
  for (const familj of ATOM_FAMILJORDNING) {
    if (FAMILJER_MED_NIVA.includes(familj)) {
      for (const niva of NIVAER) {
        const nyckel = `${familj}|${niva}`;
        if (finns.has(nyckel)) {
          atomer.push({ familj, niva, nyckel, etikett: `${familj} ${NIVA_KORT[niva]}` });
        }
      }
    } else if (finns.has(`${familj}|`)) {
      atomer.push({ familj, niva: null, nyckel: `${familj}|`, etikett: familj });
    }
  }
  return atomer;
}

/** Villkoret EN kurs-atom motsvarar, med given modalitet. Delad av både
 *  förhandsvisningens per-atom-frågor och `byggGrupp`s slutliga predikat —
 *  SAMMA kodväg, så en atom betyder exakt samma sak i förhandsvisningen som
 *  i den skapade gruppen. */
function villkorForAtom(a: KursAtom, modalitet: ModalitetsVal): Villkor {
  return { ...nyttVillkor(), familjer: [a.familj], nivaer: a.niva ? [a.niva] : [], modalitet };
}

/**
 * PARTITION-GENERATORNS KÄRNA — EXAKT-KOMBINATION-SEMANTIK
 * (`underlag-de-fjorton-skool-grupperna.md` § Semantiken). Given alla atomer
 * och en delmängd S av dem: `med` blir EN konjunkt-grupp av S (alla samtidigt),
 * `utan` blir ATOMERNA UTANFÖR S — så "RIM1" aldrig läcker in någon som också
 * gått RIM2. Samma funktion bygger BÅDE den interaktiva generatorns
 * "Skapa N segment" och de fjorton förskapade grupperna nedan.
 */
const ANTALSORD: Record<number, string> = {
  2: 'två',
  3: 'tre',
  4: 'fyra',
  5: 'fem',
  6: 'sex',
  7: 'sju',
  8: 'åtta',
  9: 'nio',
  10: 'tio',
};

/**
 * MÄNNISKO-MENINGEN — beskrivningen genererad UR AVSIKTEN (exakt
 * kombination), aldrig ur regelns booleska struktur. Marcus dömde ut
 * regeldumpen på korten ("fullständigt obegriplig", 2026-08-10): "Utan: A.
 * Eller: B" tvingade Lotta att parsa boolesk logik. Generatorn VET att
 * gruppen betyder "exakt de här, inget mer" — då kan den skriva det som en
 * människa.
 *
 * ROGER SÄGER UTBILDNING, INTE KURS (Marcus 2026-08-10) — därför
 * "utbildningarna" när modaliteten ÄR Utbildning. För föreläsning/"båda"
 * vore ordet fel; där bär en egen slutmening modaliteten i stället.
 * (Koden behåller domäntermen kurs/KursAtom — ORDLISTA.md: kursen är
 * taxonomi-axeln; detta är Rogers PRESENTATIONSSPRÅK, inte en typomdöpning.)
 *
 * Formeln är mekanisk och skalar till varje generator-körning:
 *   alla valda        → "Har gått alla fyra utbildningarna."
 *   en vald           → "Har bara gått RIM 1 - ingen av de andra tre
 *                        utbildningarna."
 *   två valda         → "Har gått både RIM 1 och RIM 2 - men ingen av de
 *                        andra två utbildningarna."
 *   en enda utesluten → "... - men inte Psionautics." (nämns vid namn)
 */
function manniskoMening(ivalda: KursAtom[], utanfor: KursAtom[], modalitet: ModalitetsVal): string {
  const antalOrd = (n: number) => ANTALSORD[n] ?? String(n);
  const etiketter = ivalda.map((a) => a.etikett);
  const utbildningsord = modalitet === 'Utbildning';

  const uteslutning =
    utanfor.length === 1
      ? `inte ${utanfor[0]?.etikett ?? ''}`
      : `ingen av de andra${utbildningsord ? ` ${antalOrd(utanfor.length)} utbildningarna` : ''}`;

  let mening: string;
  if (utanfor.length === 0) {
    mening = `Har gått alla ${antalOrd(ivalda.length)}${utbildningsord ? ' utbildningarna' : ''}.`;
  } else if (ivalda.length === 1) {
    mening = `Har bara gått ${etiketter[0] ?? ''} - ${uteslutning}.`;
  } else {
    mening = `Har gått ${ivalda.length === 2 ? 'både ' : ''}${listaOrd(etiketter, 'och')} - men ${uteslutning}.`;
  }
  if (modalitet === 'Föreläsning') return `${mening} Räknat som föreläsning.`;
  if (modalitet === 'Båda') return `${mening} Räknat som utbildning eller föreläsning.`;
  return mening;
}

function byggGrupp(
  allaAtomer: KursAtom[],
  ivalda: KursAtom[],
  modalitet: ModalitetsVal,
  namn: string,
  id: string,
): SegmentEntitet {
  const ivaldaNycklar = new Set(ivalda.map((a) => a.nyckel));
  const utanfor = allaAtomer.filter((a) => !ivaldaNycklar.has(a.nyckel));
  return {
    id,
    namn,
    predikat: {
      med: [nyKonjunkt(ivalda.map((a) => villkorForAtom(a, modalitet)))],
      utan: utanfor.map((a) => villkorForAtom(a, modalitet)),
    },
    arvdRegel: null,
    skiss: true,
    beskrivning: manniskoMening(ivalda, utanfor, modalitet),
  };
}

/**
 * DE FJORTON FÖRSKAPADE GRUPPERNA. Marcus lathund till Roger/Lotta inför
 * Skool-inbjudan (juli 2026) delade 416 personer i 14 disjunkta grupper efter
 * EXAKT vilken kombination av kurser de gått. Atomerna här är FASTA — inte
 * härledda ur `parInfo` som generatorns egna — så de fjorton finns oavsett
 * vad staging råkar innehålla just nu. Staging kan dessutom omöjligt befolka
 * och-kombinationerna på riktigt; juli-talen bärs av `DE_FJORTON_DATA.facit`
 * och av bilagan `underlag-de-fjorton-skool-grupperna.md`. Uppslagskartan
 * `FACIT_KARTA` och `skalprovMal`, som lät riggen fylla grupperna till just de
 * talen, revs med skalprovet (TASK-249.6) — grupperna räknas nu mot
 * compute-segment som varje annat segment.
 */
const DE_FJORTON_ATOMER: KursAtom[] = [
  { familj: 'Fjärrskådning', niva: null, nyckel: 'Fjärrskådning|', etikett: 'Fjärrskådning' },
  { familj: 'RIM', niva: '1', nyckel: 'RIM|1', etikett: 'RIM 1' },
  { familj: 'RIM', niva: '2', nyckel: 'RIM|2', etikett: 'RIM 2' },
  { familj: 'Psionautics', niva: null, nyckel: 'Psionautics|', etikett: 'Psionautics' },
];

type FjortonRad = { gruppnummer: number; facit: number; atomNycklar: string[] };

/**
 * Grupptabellen VERBATIM ur bilagan
 * (`underlag-de-fjorton-skool-grupperna.md` § Grupptabellen), juli 2026.
 * Σ facit = 416, samma summa som bilagans egen ("416 inbjudningar går ut").
 * Den femtonde icke-tomma delmängden (Fjärrskådning + RIM2 + Psionautics) är
 * obefolkad och FÖRSKAPAS INTE — bilagan listar bara 14 av de 15 möjliga.
 */
const DE_FJORTON_DATA: FjortonRad[] = [
  { gruppnummer: 1, facit: 188, atomNycklar: ['RIM|1'] },
  { gruppnummer: 2, facit: 59, atomNycklar: ['Fjärrskådning|'] },
  { gruppnummer: 3, facit: 39, atomNycklar: ['Psionautics|'] },
  { gruppnummer: 4, facit: 34, atomNycklar: ['RIM|1', 'RIM|2'] },
  { gruppnummer: 5, facit: 30, atomNycklar: ['Fjärrskådning|', 'RIM|1'] },
  { gruppnummer: 6, facit: 24, atomNycklar: ['Fjärrskådning|', 'RIM|1', 'RIM|2'] },
  { gruppnummer: 7, facit: 14, atomNycklar: ['Fjärrskådning|', 'RIM|1', 'RIM|2', 'Psionautics|'] },
  { gruppnummer: 8, facit: 9, atomNycklar: ['RIM|1', 'Psionautics|'] },
  { gruppnummer: 9, facit: 8, atomNycklar: ['RIM|1', 'RIM|2', 'Psionautics|'] },
  { gruppnummer: 10, facit: 3, atomNycklar: ['Fjärrskådning|', 'RIM|1', 'Psionautics|'] },
  { gruppnummer: 11, facit: 3, atomNycklar: ['Fjärrskådning|', 'Psionautics|'] },
  { gruppnummer: 12, facit: 3, atomNycklar: ['RIM|2'] },
  { gruppnummer: 13, facit: 1, atomNycklar: ['RIM|2', 'Psionautics|'] },
  { gruppnummer: 14, facit: 1, atomNycklar: ['Fjärrskådning|', 'RIM|2'] },
];

/** Bygger de fjorton entiteterna vid mount, via SAMMA `byggGrupp` som
 *  generatorns "Skapa N segment". Modaliteten är fast Utbildning — bilagan
 *  utelämnar föreläsning helt (Del 3 § Modalitets-frågan). */
function byggDeFjorton(): SegmentEntitet[] {
  return DE_FJORTON_DATA.map((rad) => {
    const ivalda = DE_FJORTON_ATOMER.filter((a) => rad.atomNycklar.includes(a.nyckel));
    const namn = ivalda.map((a) => a.etikett).join(' + ');
    return byggGrupp(
      DE_FJORTON_ATOMER,
      ivalda,
      'Utbildning',
      namn,
      `de-fjorton-${rad.gruppnummer}`,
    );
  });
}

/* [TASK-249.6] `FACIT_KARTA` — juli 2026 års uppmätta Skool-antal per
   förskapad grupp — är RIVEN med skalprovet. Dess eget docblock namngav
   uppslagets enda konsumenter: `skalprovMal` och invariant-undantaget i
   `fyllUt`/`visatAntal`, samtliga rigg-funktioner som gick i samma rivning
   (ADR-103). Talen finns kvar i `DE_FJORTON_DATA.facit` och i bilagan
   `tasks/sessions/bilagor/s104-segment-divergens/underlag-de-fjorton-skool-
   grupperna.md` — det som försvann var instrumentets uppslagsväg, inte
   underlaget. Grupperna själva räknas nu som varje annat segment: mot
   compute-segment, aldrig mot ett förväntat tal. */

/* ================================================================== *
 * DELAD GRAMMATIK — klassrader ärvda ur Event-familjen (G2)
 * ================================================================== */

const KORT_KLASS =
  'rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong';
const RAD_KLASS =
  '-mx-2 flex w-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-body hover:bg-bg-emphasized motion-safe:transition-colors';
const KAPSEL_KLASS =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent bg-bg-muted px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors';

function personform(n: number): string {
  return n === 1 ? 'person' : 'personer';
}

/**
 * BASENS SENTINEL FÖR EN NAMNLÖS PERSON — `data-model.md` § Kända fällor 43.
 *
 * `Personer.Namn` (`fldnYys0Ac3UGOdpe`) är en FORMEL:
 * `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", TRIM(Förnamn & " " &
 * Efternamn))`. Den som saknar namn bär alltså en ICKE-TOM sträng, och en
 * falsy-fallback (`m.namn?.trim() || '…'`) blir därmed DÖD KOD i drift.
 *
 * Jämförelsen är gemen-normaliserad mot `sv-SE`: strängen kommer ur en formel
 * vi inte äger, och en framtida versaländring där ska inte tyst återuppliva
 * felet. Den är däremot INTE en substrängs-match — en verklig person kan heta
 * något som innehåller orden, och en normal fallback får aldrig äta ett namn.
 */
const NAMN_SENTINEL = 'ej tillgängligt';

/**
 * Mottagarens ÄKTA namn, eller `null` när hon inte har ett registrerat.
 *
 * BÅDA NAMNLÖSA FORMERNA FALLER HÄR, med avsikt. Sentinel-strängen är formen
 * basen skriver i dag; tomt/`null` är formen `TASK-213.4` byter till
 * (`BLANK()`). Utan den andra grenen hade bas-fixen flyttat felet i mailvägen
 * från pinsamt ("Hej Ej,") till obegripligt ("Hej (namn,") — utredningens
 * mätta slutsats, `docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md`
 * § Den avgörande delfrågan. 154 av 247 mottagare i den publik Marcus
 * granskade 2026-08-17 är namnlösa; det är majoritetsfallet, inte en kant.
 *
 * NAMNEN FEJKAS ALDRIG (Marcus beslut 2026-08-17). De finns inte i basen och
 * kan inte backfillas — appen ska vara ärlig och professionell UTAN dem, inte
 * hitta på ett "Vän" eller ett "Hej du".
 */
function aktaNamn(m: { namn: string | null }): string | null {
  const rensat = m.namn?.trim() ?? '';
  if (rensat === '') return null;
  return rensat.toLocaleLowerCase('sv-SE') === NAMN_SENTINEL ? null : rensat;
}

/**
 * Namnet som det VISAS i en lista — fallbacken är en upplysning, aldrig ett
 * namn. UTAN parentes (TASK-390 punkt 4, Marcus 2026-09-04): "(namn saknas)"
 * var appens enda parentetiska variant — `Waitlist.tsx`, `Narvaro.tsx`,
 * `EventCheckin.tsx`, `EventRegistrations.tsx` och `registration-display.ts`
 * skriver alla samma upplysning utan parentes ("Namn saknas"). Formen bär nu
 * samma ord som resten av appen.
 */
function visatNamn(m: { namn: string | null }): string {
  return aktaNamn(m) ?? 'Namn saknas';
}

/**
 * Initialerna för radens rundel — DUPLICERAD ur `PersonsList.tsx:162-169`
 * (som i sin tur kopierade `PersonMiniKort.tsx:6-13`), avsiktligt. Att i
 * stället importera hjälparen hade bundit prototypen till en skarp fil, och
 * att bredda `PersonMiniKort` till en delad primitiv före Marcus godkännande
 * är exakt det `ADR-102 B3` förbjuder. Konsolideringen hör till promoveringen.
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
 * HÄLSNINGENS EGEN VÄG — platshållaren plus det den bär med sig.
 *
 * `{förnamn}`/`{namn}` fick aldrig plockas isär ur en FALLBACK-sträng: den
 * gamla vägen körde `visatNamn(mottagare).split(' ')[0]`, vilket för en
 * namnlös mottagare gav `"Ej tillgängligt".split(' ')[0]` = `Ej` och därmed
 * ***"Hej Ej,"*** i skarpt mail (mätt i prod 2026-08-17). Efter `TASK-213.4`
 * hade samma rad gett `(namn` och alltså *"Hej (namn,"*. Ingen platshållar-
 * text får någonsin nå en mottagare.
 *
 * SAKNAS NAMNET FALLER HELA NAMNFRASEN, inte bara namnet. Mönstret äter
 * platshållaren, det blanksteg som bar den, och det skiljetecken som skulle
 * följt namnet — annars blir "Hej {förnamn}," till "Hej ," i stället för
 * "Hej!". Regeln har två grenar, båda förutsägbara:
 *
 *   · Stod platshållaren SIST PÅ SIN RAD — hälsningens normalfall — blir en
 *     hängande separator (`,` `;` `:`) eller ett saknat tecken till `!`:
 *     "Hej {förnamn}," → "Hej!"   ·   "Hej {namn}" → "Hej!"
 *     En meningsavslutare får stå kvar som den är: "Hej {namn}!" → "Hej!".
 *   · Stod den MITT I EN MENING behålls tecknet orört och bara namnet faller:
 *     "Hej {förnamn}, nu är det dags" → "Hej, nu är det dags".
 *
 * `[^\S\n]` är horisontellt blanksteg — radbrytningen får aldrig ätas, den
 * bär mallens styckeindelning.
 */
const NAMN_PLATSHALLARE = /[^\S\n]*\{(?:förnamn|namn)\}([,;:!.?]?)/gu;

function utanNamn(mall: string): string {
  return mall.replace(NAMN_PLATSHALLARE, (trad: string, tecken: string, position: number) => {
    const efter = position + trad.length;
    const sistPaRaden = efter === mall.length || mall[efter] === '\n';
    if (!sistPaRaden) return tecken;
    return tecken === '' || tecken === ',' || tecken === ';' || tecken === ':' ? '!' : tecken;
  });
}

/**
 * Fyller `{förnamn}`/`{namn}` ur EN mottagare + rapporterar ofyllda.
 *
 * Har mottagaren ett äkta namn fylls det som förut. Saknas det tas namnfrasen
 * bort helt (`utanNamn` ovan) — hälsningen blir generisk, aldrig härledd ur
 * en platshållartext. `ofyllda` räknar det som står kvar oersatt efteråt och
 * är därmed fortfarande en ärlig varning: den fäller på `{ort}` och andra
 * okända platshållare, men inte på en namnlucka som är MEDVETET stängd.
 */
function fyllPlatshallare(mall: string, mottagare: SegmentMember | undefined) {
  const namn = mottagare ? aktaNamn(mottagare) : undefined;
  const text =
    namn === undefined
      ? mall
      : namn === null
        ? utanNamn(mall)
        : mall.replaceAll('{förnamn}', namn.split(' ')[0] ?? namn).replaceAll('{namn}', namn);
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

/* Den lokala `SidRam`-funktionen bodde här — RIVEN i TASK-349 (ADR-126).
 *
 * Den var en EGEN kopia av husets sidkrom-geometri (samma klasser som
 * `PersonDetail.tsx`/`EventCheckin.tsx` bar innan `TASK-299.1` samlade dem),
 * och delade namn med `primitives/SidRam.tsx` utan att vara den — ADR-126
 * § "Kvarvarande kopior" namngav uttryckligen just detta som "den värsta
 * varianten: en grep efter SidRam ger en falsk träff som ser ut som en
 * konsument". Startvyns egen chevron (till `/mer`) SAKNADES helt — filen
 * bar bara den interna, knapp-baserade grenen; ingen av de sju ytorna
 * navigerade ut ur segment-ytan. Bygg inte tillbaka en lokal kopia: husets
 * `SidRam` (route-länk) och `SidRamKnapp` (state-baserad "tillbaka") bär
 * geometrin nu, delad av `CHEVRON_KLASS` i `primitives/SidRam.tsx`. */

/* `PrototypNot` ÄR RIVEN (TASK-259, Marcus QA-fynd 2026-08-17). Noten satt
   på sju ställen och sa "Prototyp. Inget sparas, inget skickas." på en yta
   som sedan TASK-249.5 är routens ovillkorliga, skarpa form — Lotta mötte
   alltså en prototyp-etikett på en produktionssida, samma stale grå-löfte
   TASK-147.8 rev ur `AtgardsSida.tsx` av exakt samma skäl. Docblocken som
   sa att noten "står kvar" (TASK-249.1/249.6-ankarkommentarerna vid varje
   `data-testid`) är rättade i samma commit; den kommentar i `VariantD` som
   påstod att noten försvinner vid flippen — bokförd som felaktig i
   249.6-rapporten och listad på städkortet TASK-258 — dör med noten själv. */

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
  rule: SegmentRuleDnf,
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

function useMedlemmar(rule: SegmentRuleDnf, aktiv: boolean) {
  const dataSource = useDataSource();
  return useQuery<Medlemssvar>({ ...medlemsFraga(dataSource, rule), enabled: aktiv });
}

/**
 * MEDLEMSUTFALLET FÖR ETT PREDIKAT — EN `compute-segment`-fråga (TASK-249.5,
 * AC#2), inte 1..N + klient-side snitt (`Frageplan`/`raknaSammansatt`,
 * borttagna). `predikatTillDnfRegel` bygger regeln direkt; servern äger
 * AND/OR-algebran (ADR-115). Signaturen (`regelSignatur`, DNF+period-medveten)
 * ärver cache-delningen `medlemsFraga`s docblock beskriver.
 */
function usePredikatMedlemmar(
  predikat: Predikat | null,
  arvdRegel: SegmentRule | null,
  parInfo: ParInfo[],
  aktiv: boolean,
) {
  const regel = useMemo<SegmentRuleDnf>(
    () =>
      predikat
        ? predikatTillDnfRegel(predikat, parInfo)
        : (arvdRegel ?? { include: [], exclude: [] }),
    [predikat, arvdRegel, parInfo],
  );
  const { data, isPending, isFetching, isError, error } = useMedlemmar(regel, aktiv);
  return { data, isPending, isFetching, isError, error };
}

function useEntitetsMedlemmar(entitet: SegmentEntitet, parInfo: ParInfo[]) {
  return usePredikatMedlemmar(entitet.predikat, entitet.arvdRegel, parInfo, true);
}

/**
 * UNIONEN ÖVER FLERA ENTITETER (utskicksvyn). Varje entitets predikat blir
 * EN DNF-regel (`predikatTillDnfRegel`/ärvd regel), dedupad på signatur ÖVER
 * entitets-gränserna (två segment med identisk regel delar walk) — samma
 * dedup-princip som förut, nu på HELA entitetens regel i stället för på
 * enskilda villkors-frågor (AC#2: ingen klient-side snitt kvar att dedupa
 * byggblock för). Vakten mot tyst underräkning (filhuvudet § MULTI-SEGMENT)
 * ärvs oförändrad: `misslyckade` räknar segment vars fråga felat.
 */
function useUnionsUtfall(entiteter: SegmentEntitet[], parInfo: ParInfo[]) {
  const dataSource = useDataSource();
  const { regler, indexPerEntitet } = useMemo(() => {
    const regler: SegmentRuleDnf[] = [];
    const index = new Map<string, number>();
    const nrFor = (regel: SegmentRuleDnf): number => {
      const sig = regelSignatur(regel);
      const finns = index.get(sig);
      if (finns !== undefined) return finns;
      regler.push(regel);
      index.set(sig, regler.length - 1);
      return regler.length - 1;
    };
    const indexPerEntitet = entiteter.map((e) =>
      nrFor(
        e.predikat
          ? predikatTillDnfRegel(e.predikat, parInfo)
          : (e.arvdRegel ?? { include: [], exclude: [] }),
      ),
    );
    return { regler, indexPerEntitet };
  }, [entiteter, parInfo]);

  const svar = useQueries({ queries: regler.map((r) => medlemsFraga(dataSource, r)) });

  const perEntitet = indexPerEntitet.map((i) => ({
    data: svar[i]?.data,
    vantar: svar[i]?.data === undefined,
    fel: svar[i]?.isError ?? false,
  }));

  return {
    perEntitet,
    isPending: svar.some((s) => s.isPending),
    misslyckade: perEntitet.filter((p) => p.fel).length,
  };
}

/* ================================================================== *
 * TÄCKNINGSVYN — ett LÄGE på listan, ingen ny objekttyp
 * (S104 Del 3 "partition som GENERATOR" + Del 4 konvergens, task-181)
 * ================================================================== */

/**
 * Visar en genererad grupp-UPPSÄTTNING som HELHET: de fjorton förskapade
 * grupperna, eller en enskild körning av "Dela upp i grupper" — aldrig en
 * enstaka grupp (den frågan besvarar redan kortets eget antal).
 *
 * SVARAR PÅ TRE TAL, INGET ANNAT (Del 3: "det var den egenskapen som gjorde
 * Skool-uppladdningen trygg"): hur många är i EXAKT en grupp, hur många i
 * MER ÄN EN (ska vara noll per konstruktion — `byggGrupp`s `utan`-hälft
 * utesluter grannarna, se PARTITION-GENERATORNS KÄRNA ovan — men kan bli
 * >0 om någon redigerar en genererad grupps regel i efterhand), och hur
 * många med genomförd närvaro i uppsättningens modalitet är i INGEN grupp
 * alls. Den sista är den som gör RIM 4-rötan (filhuvudet § REGELFORMEN)
 * synlig i stället för tyst: en ny kurs ger folk `harledKursAtomer` inte
 * känner till, de hamnar i ingen atom och därmed i ingen grupp — täckningen
 * visar dem, i stället för att uppsättningen tyst blir ofullständig.
 *
 * UPPSÄTTNINGS-IDENTITETEN HÄRLEDS UR ID-PREFIXET, INGEN FJÄRDE BOKFÖRING
 * (minsta yta): `byggDeFjorton` ger alla sina entiteter prefixet
 * `de-fjorton-`, en generator-körning ger alla sina samma `gen-<ts>-`
 * (samma `Date.now()`-anrop, se `DelaUppIGrupper.skapa`). En entitet
 * UTANFÖR de två familjerna (sparat Airtable-segment, ett obesparat "Nytt
 * segment") hör inte till någon uppsättning — täckning är en fråga bara en
 * GENERERAD partition kan svara på, för bara den lovar att ha delat upp
 * ALLA atomer den byggdes ur.
 *
 * MODALITETEN LÄSES UR PREDIKATET, INTE UR EN EGEN KARTA (`harledModalitet`):
 * `byggGrupp` sätter SAMMA modalitet-parameter på varje villkor den skapar
 * — `med` OCH `utan` — så det räcker att läsa det FÖRSTA. En parallell
 * karta (`FACIT_KARTA`s form) hade kunnat glida isär från predikatet den
 * beskriver; att läsa modaliteten ur samma data som redan bär den kan det
 * aldrig göra.
 *
 * FLERA UPPSÄTTNINGAR SAMTIDIGT (de fjorton finns alltid från mount, plus
 * noll eller fler generator-körningar): den enklaste ÄRLIGA lösningen är
 * täckning PER uppsättning, alla synliga samtidigt när läget är på — inte
 * en väljare som pekar ut en. En väljare hade krävt ett default-val och en
 * extra stat för en yta som i praktiken visar 1–2 uppsättningar samtidigt;
 * att lista dem alla är varken dyrare att räkna (varje panel kör sin egen
 * fråga oavsett vald/ej vald) eller svårare att läsa.
 */
type Uppsattning = {
  nyckel: string;
  namn: string;
  entiteter: SegmentEntitet[];
  modalitet: ModalitetsVal;
};

/** Modaliteten `byggGrupp` skrev in i varje villkor — se docblocket ovan. */
function harledModalitet(entitet: SegmentEntitet): ModalitetsVal | null {
  return (
    entitet.predikat?.med[0]?.villkor[0]?.modalitet ?? entitet.predikat?.utan[0]?.modalitet ?? null
  );
}

/** Grupperar posterna på id-prefix. Entiteter utanför `de-fjorton-`/`gen-<ts>-`
 *  hör inte till någon uppsättning och bidrar inte till täckningsvyn. */
function harledUppsattningar(poster: SegmentEntitet[]): Uppsattning[] {
  const grupper = new Map<string, SegmentEntitet[]>();
  const namn = new Map<string, string>();
  for (const e of poster) {
    let nyckel: string | null = null;
    if (e.id.startsWith('de-fjorton-')) {
      nyckel = 'de-fjorton';
      namn.set(nyckel, 'De fjorton');
    } else {
      const traff = /^gen-(\d+)-/.exec(e.id);
      if (traff?.[1]) {
        nyckel = `gen-${traff[1]}`;
        if (!namn.has(nyckel)) {
          const tid = new Date(Number(traff[1])).toLocaleTimeString('sv-SE', {
            hour: '2-digit',
            minute: '2-digit',
          });
          namn.set(nyckel, `Uppdelning kl. ${tid}`);
        }
      }
    }
    if (nyckel === null) continue;
    const lista = grupper.get(nyckel);
    if (lista) lista.push(e);
    else grupper.set(nyckel, [e]);
  }
  const uppsattningar: Uppsattning[] = [];
  for (const [nyckel, entiteter] of grupper) {
    const modalitet = entiteter.map(harledModalitet).find((m): m is ModalitetsVal => m !== null);
    // Kan i praktiken inte inträffa (`villkorForAtom` sätter alltid en konkret
    // modalitet), men en uppsättning utan känd modalitet kan inte besvara
    // populationsfrågan och utelämnas därför hellre än att gissa.
    if (modalitet === undefined) continue;
    uppsattningar.push({ nyckel, namn: namn.get(nyckel) ?? nyckel, entiteter, modalitet });
  }
  return uppsattningar;
}

type TackningsUtfall =
  | { status: 'raknar' }
  | { status: 'fel' }
  | { status: 'klar'; tackta: number; dubbla: number; utanfor: SegmentMember[] };

/**
 * TÄCKNINGENS RÄKNING. `useUnionsUtfall` ger gruppernas medlemsmängder på
 * SAMMA frågefabrik som listans egna kort (`medlemsFraga`s signatur-cache)
 * — ett redan räknat kort kostar noll här. Den enda NYA frågan är
 * populationsregeln: alla taxonomins par för uppsättningens modalitet,
 * byggd exakt som `useModalitetsFordelning`s `utbildningsRegel` för
 * Utbildning — samma innehåll ⇒ samma `regelSignatur` ⇒ samma cache-post om
 * den hooken råkar vara monterad någon annanstans (frågeekonomin, beslut 5).
 *
 * RÄKNAS ALLTID PÅ VERKLIGA MÄNGDER (beslut 4): både `perEntitet` och
 * `population` är `compute-segment`s obehandlade svar. Det gällde redan när
 * skalprovet fanns — täckningen gick aldrig via dess utfyllnad, oavsett vilket
 * läge växeln stod i — och med riggen riven (TASK-249.6) finns ingen annan
 * mängd att förväxla dem med.
 */
function useTackning(uppsattning: Uppsattning, parInfo: ParInfo[]): TackningsUtfall {
  const {
    perEntitet,
    isPending: grupperVantar,
    misslyckade,
  } = useUnionsUtfall(uppsattning.entiteter, parInfo);

  const populationRegel = useMemo<SegmentRule>(
    () => ({
      include: parInfo
        .filter(
          (p) => uppsattning.modalitet === 'Båda' || p.par.modalitet === uppsattning.modalitet,
        )
        .map((p) => p.par),
      exclude: [],
    }),
    [parInfo, uppsattning.modalitet],
  );
  const population = useMedlemmar(populationRegel, true);

  if (misslyckade > 0 || population.isError) return { status: 'fel' };
  if (grupperVantar || population.data === undefined) return { status: 'raknar' };

  const forekomster = new Map<string, number>();
  for (const p of perEntitet) {
    for (const m of p.data?.members ?? []) {
      forekomster.set(m.id, (forekomster.get(m.id) ?? 0) + 1);
    }
  }
  const dubbla = [...forekomster.values()].filter((n) => n >= 2).length;
  const tackta = forekomster.size - dubbla;
  const { data: populationSvar } = population;
  const utanfor = populationSvar.members.filter((m) => !forekomster.has(m.id));

  return { status: 'klar', tackta, dubbla, utanfor };
}

/**
 * Publiken i Rogers ord (Marcus 2026-08-10: "genomförd närvaro" är
 * systemspråk, och "modalitet" ska aldrig stå i UI-text). Verbfrasen bär
 * BÅDE vilka som räknas och vilken modalitet uppsättningen gäller.
 */
function publikOrd(modalitet: ModalitetsVal): string {
  if (modalitet === 'Föreläsning') return 'har varit på någon föreläsning';
  if (modalitet === 'Båda') return 'har gått någon utbildning eller varit på någon föreläsning';
  return 'har gått någon utbildning';
}

/**
 * Samma mekanik som `publikOrd` (modalitet in, verbfras ut) men i den
 * RELATIVSATS kvittensraden kräver - "Alla deltagare som ..." tar `som gått`,
 * inte `har gått`. Marcus gav Utbildnings-varianten ordagrant ("som gått en
 * eller flera utbildningar", granskning 2026-08-16 varv 4); "en eller flera"
 * i stället för `publikOrd`s "någon" är avsiktligt kvar bara här - den friska
 * kvittensen påstår FULLSTÄNDIGHET, och räkneordet bär den nyansen.
 *
 * TVÅ FUNKTIONER, INTE EN UTBYGGD: `publikOrd` bär fortfarande
 * avvikelse-boxens brödtext oförändrad (Marcus: "+ befintlig brödtext"), och
 * att tvinga båda kasus genom en gemensam formulerare hade kostat en
 * parameter för två anropsplatser.
 */
function tacktaOrd(modalitet: ModalitetsVal): string {
  if (modalitet === 'Föreläsning') return 'varit på en eller flera föreläsningar';
  if (modalitet === 'Båda') return 'gått någon utbildning eller varit på någon föreläsning';
  return 'gått en eller flera utbildningar';
}

/**
 * EN UPPSÄTTNING, EN KVITTENS. Kvittenserna läggs ÖVER listan (mellan
 * handlingsraden och korten) — listan döljs aldrig, kontrollen är ett
 * TILLÄGG, inte en ersättning.
 *
 * DET FRISKA FALLET BÄR INGEN PANEL (Marcus granskning 2026-08-16, tredje
 * varvet: "otydligt, fult, oproffsigt"). Formen före detta varv gav VARJE
 * uppsättning en `rounded-2xl border bg-surface p-4`-ruta med en `<h2>`
 * ("Täckning: De fjorton"), en grön badge ("Täckningen stämmer") och en
 * mening — tre lager chrome runt beskedet "allt är som det ska". En ruta
 * med rubrik är en INNEHÅLLSBÄRARE; ett friskt utfall har inget innehåll
 * att bära, bara ett svar. Nu är friskt läge EN rad — bock + mening på en
 * tonal grön yta, ingen kant, ingen rubrik — och rutan sparas till det som
 * faktiskt behöver den.
 *
 * "TÄCKNING" ÄR MARCUS ORD OCH STÅR I KLARTEXT (granskning 2026-08-16, fjärde
 * varvet — en RIVEN tes, inte en glömd). Varv 3 rensade ordet ur all synlig
 * text på tesen att det var systemspråk i klass med "genomförd närvaro" och
 * "modalitet"; Marcus underkände den ordagrant ("Jag vill ha tillbaka
 * täckningsyta och ikonen vi hade innan"). Skillnaden mot de två andra orden
 * är att täckning är ett ord han själv använder om saken — inte ett vi
 * översatt från mängdläran åt honom.
 *
 * PROCENTEN ÄR GOLVAD, OCH DET ÄR EN SANNINGSEGENSKAP: `Math.floor` gör att
 * "100 %" kan visas ENDAST när `utanfor` är exakt 0 — 99,7 % blir 99 %, aldrig
 * en avrundning uppåt som påstår fullständighet den inte har. Nämnaren är
 * `tackta + utanfor` (populationen minus dubbelräkning), och det gröna läget
 * kräver dessutom `dubbla === 0`, så den gröna raden och talet 100 % kan bara
 * uppträda tillsammans.
 *
 * PROCENT HÖR TILL UTANFÖR-DIMENSIONEN, ALDRIG TILL DUBBEL (Marcus, samma
 * varv: "blanda inte"). Att vara med i två segment gör ingen otäckt — det är
 * ett annat fel med en annan konsekvens (flera mail, inte uteblivet mail), och
 * ett procenttal i den rubriken hade beskrivit fel storhet.
 *
 * AVVIKELSEN FÅR TA PLATS, OCH HAR EN RUBRIK SOM SÄGER FELET RAKT. Två
 * oberoende fynd ⇒ två `MessageBox`ar, aldrig en sammanslagen: "2 deltagare
 * finns i mer än ett segment" och "93 % täckning - 1 deltagare saknas i
 * segmenten" är olika problem med olika konsekvenser (dubbla mail respektive
 * uteblivet mail). Rubriken bär hela fyndet — en badge som säger samma sak en
 * gång till är borta av samma skäl som det friska fallets panel.
 *
 * EN ENDA LIVE-REGION, OCH DEN LIGGER UTANPÅ INGENTING (fälla 6 + nästlade
 * regioner). `MessageBox` bär SJÄLV `role="alert"` för `warning`/`error`
 * (primitivens egen semantik) — låg den inuti en `role="status"`-wrapper
 * blev det en nästlad live-region, där den yttre `aria-atomic` läser om
 * hela blocket vid varje ändring. Därför är regionen ett SYSKON till
 * rutorna: den bär kvittensraden och avvikelsens ledtext, rutorna larmar
 * själva. Regionen är monterad så länge kontrolläget är på och byter bara
 * innehåll — en `aria-live` som monteras SAMTIDIGT som sin text annonseras
 * inte (samma regel som `SegmentKort`s antal-rad och generatorns steg 3).
 *
 * "Visa vilka"-listan speglar `UtskicksVy`s blandade-mottagare-mönster:
 * antal ≤ `CHUNK` visas hel, annars de första `CHUNK` + ett rest-antal.
 */
function TackningsPanel({
  uppsattning,
  parInfo,
  visaNamn,
}: {
  uppsattning: Uppsattning;
  parInfo: ParInfo[];
  /** Sant när ytan visar FLER än en uppsättning — då måste varje kvittens
      säga VILKEN den gäller, annars är två rader omöjliga att skilja åt.
      Vid en ensam uppsättning vore namnet brus: det finns inget att välja
      mellan. */
  visaNamn: boolean;
}) {
  const utfall = useTackning(uppsattning, parInfo);
  const [visaUtanfor, setVisaUtanfor] = useState(false);
  const utanforPanelId = useId();

  const klart = utfall.status === 'klar' ? utfall : null;
  const friskt = klart !== null && klart.dubbla === 0 && klart.utanfor.length === 0;
  // TÄCKNINGSGRADEN. Nämnaren är populationen sedd genom uppsättningen:
  // `tackta` (i exakt en grupp) + `utanfor` (i ingen). `dubbla` ingår
  // medvetet i VARKEN täljare eller nämnare — de är täckta, men fel täckta,
  // och deras fel bärs av sin egen ruta.
  //
  // NOLL-NÄMNAREN ÄR ETT EGET FALL, INTE EN DIVISION. En uppsättning vars
  // modalitet inte har en enda person i basen ger `0/0` → `NaN %`; en yta
  // vars hela syfte är att avslöja tysta fel får aldrig själv skriva NaN på
  // skärmen. Då finns ingen täckningsgrad att uttala sig om, och raden säger
  // det i stället för att räkna.
  const namnare = klart === null ? 0 : klart.tackta + klart.utanfor.length;
  const procent =
    klart === null || namnare === 0 ? null : Math.floor((klart.tackta / namnare) * 100);
  // Uppsättningens namn som PREFIX i varje utfall - friskt som avvikande ("De
  // fjorton: 100 % - Full täckning …", Marcus form 2026-08-16). Kolon-formen
  // scopar fyndet utan att böja rubriken, som en invävning ("… i De fjorton")
  // hade tvingat fram i tre olika kasus. Varv 3 vävde in namnet i den friska
  // meningen och prefixade avvikelserna — två former för samma sak; nu är det
  // en, och den fungerar i båda.
  const prefix = visaNamn ? `${uppsattning.namn}: ` : '';

  return (
    <div className="flex flex-col gap-3">
      <div role="status" aria-live="polite" aria-atomic="true">
        {utfall.status === 'raknar' && (
          <p className="mm-laddtext text-small text-text-muted">Räknar täckningen…</p>
        )}

        {friskt && klart !== null && (
          // KVITTENSRADEN. Bocken är samma ikon och samma `text-success` som
          // `StatusBadge ton="success"` redan använder, på samma
          // `bg-success-bg` — ingen ny token, ingen ny färgparning. Texten bär
          // hela beskedet ensam; ikonen är `aria-hidden` och förstärker bara
          // (WCAG 1.4.1). `items-start` + `mt-px` håller bocken mot första
          // textraden när meningen bryter till två.
          <p className="flex items-start gap-2 rounded-xl bg-success-bg px-4 py-2.5 text-small">
            <CircleCheck aria-hidden="true" size={18} className="mt-px shrink-0 text-success" />
            <span>
              {procent === null
                ? `${prefix}Ingen som ${tacktaOrd(uppsattning.modalitet)} finns i basen än - det finns ingen täckning att räkna.`
                : `${prefix}${procent} % - Full täckning. Alla deltagare som ${tacktaOrd(uppsattning.modalitet)} finns representerade i något av segmenten.`}
            </span>
          </p>
        )}

        {klart !== null && !friskt && (
          // AVVIKELSENS LEDTEXT — hur många som ÄR rätt placerade. Den står
          // kvar även när något är fel, för den är det enda talet som säger
          // hur STORT felet är i förhållande till helheten.
          <p className="text-small text-text-secondary">
            {`${prefix}${klart.tackta} ${personform(klart.tackta)} är med i exakt en grupp.`}
          </p>
        )}
      </div>

      {utfall.status === 'fel' && (
        <MessageBox intent="error" title="Täckningen kunde inte räknas">
          Något av delsvaren gick inte att hämta. Försök igen om en stund.
        </MessageBox>
      )}

      {klart !== null && klart.dubbla > 0 && (
        <MessageBox
          intent="warning"
          // INGEN PROCENT HÄR (Marcus 2026-08-16: "blanda inte") - se
          // docblockets § PROCENT HÖR TILL UTANFÖR-DIMENSIONEN. "deltagare"
          // böjs inte i plural, så rubriken bär ordet oböjt i stället för via
          // `personform` (som ger person/personer).
          title={`${prefix}${klart.dubbla} deltagare finns i mer än ett segment`}
        >
          De hamnar i mer än en av grupperna och får därför flera mail om du skickar till alla
          grupperna.
        </MessageBox>
      )}

      {klart !== null && klart.utanfor.length > 0 && (
        <MessageBox
          intent="warning"
          // RUBRIKEN SPEGLAR PROCENTFORMEN: samma tal som den gröna raden
          // hade visat om allt stämt, men här som det det är - ett underskott.
          // `procent` kan inte vara null i den här grenen (`utanfor.length >
          // 0` ⇒ nämnaren > 0), men typen tvingar fram en gren och en tyst
          // `?? 0` hade varit en gissning; utan tal säger rubriken bara felet.
          title={
            procent === null
              ? `${prefix}${klart.utanfor.length} deltagare saknas i segmenten`
              : `${prefix}${procent} % täckning - ${klart.utanfor.length} deltagare saknas i segmenten`
          }
        >
          <p>
            De {publikOrd(uppsattning.modalitet)} men är inte med i någon av grupperna - de nås inte
            om du skickar till hela uppsättningen.
          </p>
          <button
            type="button"
            aria-expanded={visaUtanfor}
            aria-controls={utanforPanelId}
            onClick={() => setVisaUtanfor((v) => !v)}
            className="flex items-center gap-1.5 self-start font-medium text-small underline hover:no-underline"
          >
            {visaUtanfor ? 'Dölj vilka' : `Visa vilka (${Math.min(klart.utanfor.length, CHUNK)})`}
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={`shrink-0 motion-safe:transition-transform ${
                visaUtanfor ? 'rotate-180' : ''
              }`}
            />
          </button>
          <ul id={utanforPanelId} hidden={!visaUtanfor} className="flex flex-col gap-0.5 pt-1">
            {klart.utanfor.slice(0, CHUNK).map((m) => (
              <li key={m.id} className="text-small">
                {visatNamn(m)}
                <span className="text-text-muted"> · {m.email ?? 'ingen e-postadress'}</span>
              </li>
            ))}
            {klart.utanfor.length > CHUNK && (
              <li className="text-small text-text-muted">+ {klart.utanfor.length - CHUNK} till</li>
            )}
          </ul>
        </MessageBox>
      )}
    </div>
  );
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
      {/* LÅST KORTHÖJD — GLOBAL REGEL (Marcus 2026-08-10, värdet omstämplat
          168 → 132 px vid B2-promoveringen, S114 Del 3 beslut 3 + S117-
          stämpeln — facit.json, tasks/sessions/bilagor/s114-segmentlistan-
          konvergens/): varje kort reserverar höjden för sitt MAXINNEHÅLL (EN
          rad namn, trunkerad med `title` + 2 rader beskrivning + antal-
          radens min-h-6) och får ALDRIG växa eller krympa med innehållet.
          Principen — fast, innehållsoberoende höjd — är oförändrad; bara
          namnradens reservation (2 rader → 1, trunkerad) och antal-radens
          höjd (min-h-8 → min-h-6) krympte till K3-anatomin. `min-h-[2lh]`/
          `min-h-[1lh]` reserverar radhöjd i elementets egen typografi —
          samma grepp som personlistans låsta radhöjd (S103): geometrin
          ligger fast när data landar, när namnet är kort eller långt. */}
      {markeraLage ? (
        <span className="min-h-[1lh] truncate font-semibold text-body" title={entitet.namn}>
          {entitet.namn}
        </span>
      ) : (
        <button
          type="button"
          onClick={onOppna}
          title={entitet.namn}
          className="min-h-[1lh] truncate text-left font-semibold text-body after:absolute after:inset-0"
        >
          {entitet.namn}
        </button>
      )}
      {/* Filter-ikonen är riven (Marcus 2026-08-10). Den var `aria-hidden`, så
          den bar ingen information för skärmläsaren - och för seende sa den
          bara "detta är ett filter" om en rad som redan börjar "Deltagit i".
          Med ikonen borta behövs varken flex-raden eller `mt-1`-justeringen. */}
      <span className="line-clamp-2 min-h-[2lh] text-small text-text-secondary">{definition}</span>
      {/* ANTALET KOMMER AV SIG SJÄLVT — Räkna-knappen är RIVEN (Marcus
          2026-08-10). `b` mätte att en löpande räknad publik kostar ETT
          `compute-segment`-anrop per UNIK regel (frågan nycklas på regelns
          signatur, inte på segmentets id), så kortets tal är inte dyrare än
          knappen var — bara ärligare.

          ÄR TALET ÄNNU INTE KÄNT STÅR RADEN TOM, inte "Antal ej räknat".
          Den texten beskrev appens interna tillstånd, inte segmentet, och det
          enda den sa Lotta var att något inte gjorts. Höjden är ändå låst
          (`min-h-6`, K3-anatomin) så ingenting flyttar sig när talet landar.

          Live-regionen är ALLTID monterad och byter bara innehåll — en
          `aria-live` som monteras samtidigt som sin text annonseras inte. */}
      <div className="flex min-h-6 items-center">
        <span
          aria-live="polite"
          className="flex items-center gap-1.5 text-caption text-text-secondary"
        >
          {raknar ? (
            <>
              <Users aria-hidden="true" size={14} className="shrink-0" />
              {/* VÅGEN BÄRS AV EN EGEN SPAN, INTE AV LIVE-REGIONEN. `.mm-laddtext`
                  sätter `color: transparent` (background-clip: text), och
                  `Users`-ikonen ritas med `currentColor` — låg klassen på den
                  gemensamma föräldern hade ikonen blivit osynlig i samma
                  ögonblick som texten började vaja. Spanen bär ingen roll och
                  bidrar bara med sin text till tillgänglighetsträdet. */}
              <span className="mm-laddtext">Räknar…</span>
            </>
          ) : antal === undefined ? null : (
            <>
              <Users aria-hidden="true" size={14} className="shrink-0" />
              {antal === 0 ? '0 personer ännu' : `${antal} ${personform(antal)}`}
            </>
          )}
        </span>
      </div>
      {/* SKISS-PILLEN ÄR RIVEN (Marcus 2026-08-10, samma beslut som rev
          "Sparade i basen"-grupperingen). Med CI-fixturerna bortfiltrerade är
          VARJE kort i listan en skiss, så pillen satt på alla och skilde
          ingenting åt — den gjorde bara att listan inte gick att bedöma som
          den yta Lotta möter. [TASK-259] Raden pekade tidigare vidare till
          `PrototypNot` under listan som stället där prototyp-förbehållet stod
          en gång; noten är riven, och listan bär inget förbehåll alls. */}
    </>
  );

  if (markeraLage) {
    return (
      <li className="flex">
        <Checkbox
          isSelected={vald}
          onChange={onVaxla}
          className={`relative flex w-full cursor-pointer flex-col gap-1 rounded-2xl border p-4 motion-safe:transition-colors ${
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
    <li className="relative flex flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors contrast-more:border-border-strong">
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
  // ALLTID PÅ, aldrig bakom ett klick. Kostnaden bärs av frågans nyckel,
  // inte av en spärr: varje fråga i planen nycklar på SIN signatur med 5 min
  // `staleTime`, så N kort som delar regel — eller bara delar ett VILLKOR,
  // sedan AND-primitiven — delar walk, och ett återbesök kostar noll. Tom
  // regel besvaras lokalt utan nätanrop.
  const { data, isFetching } = useEntitetsMedlemmar(props.entitet, props.parInfo);
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
 * Sektionsrubrik: h2 + antalet som BRICKA i Hem-mönstret
 * (`ForfallnaBetalningar.tsx` § "Att påminna"), explicit liten text så den
 * inte ärver h2:ans storlek; ingen bricka vid noll. Ingen ikon — lagerikonen
 * betyder täckning på denna yta och lånas inte ut. Promoverad ur
 * `SegmentListaKonvergens.tsx` (K3, B2-promoveringen, S117).
 */
function SektionsRubrik({ namn, antal }: { namn: string; antal: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-semibold text-lg">{namn}</h2>
      {antal > 0 && (
        <span className="rounded-md bg-bg-emphasized px-1.5 py-0.5 font-semibold text-small text-text tabular-nums">
          {antal}
        </span>
      )}
    </div>
  );
}

/** Neutral uppsättning för `useTackning`s hook-anrop när ingen
 *  "de-fjorton"-uppsättning finns (kan i praktiken inte inträffa — de fjorton
 *  finns alltid från mount och tas aldrig bort, se `byggDeFjorton`). Ren
 *  Rules-of-Hooks-nödvändighet: `useTackning` måste anropas ovillkorligt
 *  varje rendering, och behöver då ett giltigt objekt även i det läget. */
const TOM_UPPSATTNING: Uppsattning = {
  nyckel: '',
  namn: '',
  entiteter: [],
  modalitet: 'Utbildning',
};

/**
 * LANDNINGSVYN. Entiteterna delas i TVÅ sektioner (B2-promoveringen, S117,
 * ADR-103 — omprövning av 2026-08-10s "EN lista, ingen gruppering", S114
 * Del 3 beslut 3): "Dina segment" (sparade ur basen + osparade "Nytt
 * segment"-utkast — allt som INTE hör till en genererad partition) och
 * "Färdiga grupper" (de fjorton + ev. körningar av "Dela upp i grupper" —
 * samma "generator-identitet" `harledUppsattningar` redan använder för
 * täckningsvyns gruppering, se dess docblock: id-prefix `de-fjorton-`/
 * `gen-<ts>-`). Delningen återanvänder den befintliga uppsättnings-
 * härledningen i stället för att duplicera prefix-logiken.
 *
 * Formen bar tidigare två block, "Sparade i basen" och "Skisser", rivna
 * 2026-08-10 av skälet att grupperingen bara var en prototyp-egenskap. Den
 * nya sektioneringen är INTE en återgång till det — "Dina segment"/"Färdiga
 * grupper" är Lottas egna begrepp (facitet), inte vår interna bokföring.
 *
 * Tomläget står kvar per sektion och är fortfarande ärligt — det renderas
 * när "Dina segment" är tomt, aldrig ovanpå ett fel (ett tomläge är ett
 * påstående om basen, och misslyckas hämtningen VET vi inte om den är tom).
 * "Färdiga grupper" kan i praktiken aldrig bli tomt (de fjorton finns
 * alltid) — se `SegmentLista`s eget kommentarblock för det prövade fyndet.
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
  onDelaUpp,
  onOppnaMarkering,
  onStangMarkering,
  onVaxla,
  onMarkeraAlla,
  onRensa,
  onSkicka,
  tackningsLage,
  onTackning,
}: {
  poster: SegmentEntitet[];
  parInfo: ParInfo[];
  laddar: boolean;
  fel: Error | null;
  markeraLage: boolean;
  valda: ReadonlySet<string>;
  onOppna: (id: string) => void;
  onNytt: () => void;
  onDelaUpp: () => void;
  onOppnaMarkering: () => void;
  onStangMarkering: () => void;
  onVaxla: (id: string, vald: boolean) => void;
  onMarkeraAlla: () => void;
  onRensa: () => void;
  onSkicka: () => void;
  /** Täckningsvyns läge (S104 Del 4, task-181) — se docblocket ovan `TackningsPanel`. */
  tackningsLage: boolean;
  onTackning: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, !laddar);
  const uppsattningar = useMemo(() => harledUppsattningar(poster), [poster]);
  // SEKTIONERINGEN (B2-promoveringen, se filhuvudets docblock ovan
  // `SegmentLista`): en entitet hör till "Färdiga grupper" om den ingår i
  // NÅGON uppsättning `harledUppsattningar` känner igen (de-fjorton eller en
  // generator-körning) — allt annat (sparade segment, osparade "Nytt
  // segment"-utkast) hör till "Dina segment". Härlett ur `uppsattningar` i
  // stället för att duplicera prefix-matchningen.
  const genereradeIder = useMemo(
    () => new Set(uppsattningar.flatMap((u) => u.entiteter.map((e) => e.id))),
    [uppsattningar],
  );
  const dinaSegment = useMemo(
    () => poster.filter((e) => !genereradeIder.has(e.id)),
    [poster, genereradeIder],
  );
  const fardigaGrupper = useMemo(
    () => poster.filter((e) => genereradeIder.has(e.id)),
    [poster, genereradeIder],
  );
  // TÄCKNINGSKNAPPENS ETIKETT (facitet: "Full täckning · N av N" när räknad
  // och frisk, annars skarpa vyns "Visa täckning"/"Dölj täckning"). N är
  // "de fjorton"s uppsättning specifikt — den finns alltid (aldrig riven),
  // så uppslaget mot `TOM_UPPSATTNING` ovan är en typ-nödvändighet, inte ett
  // förväntat läge. EN generator-körning ("Dela upp i grupper") räknas INTE
  // in i etiketten — bara de fjorton, facitets enda testade fall; se
  // PR-kroppens § Avvikelser för avvägningen.
  //
  // EGET "raknar"-LÄGE, SAMMA ORD SOM `TackningsPanel` ("Räknar
  // täckningen…", ovan) — inte en fri nykonstruktion. Utan det hade
  // etiketten legat kvar på "Visa täckning" medan populations-frågan (en
  // NY fråga, delar ingen cache med kortens egna) fortfarande väntar in
  // svar, och grindens `vantaInRakningar` (väntar in ALLA `/Räknar/`-texter
  // innan den fångar en ariaSnapshot) hade då inte känt av den — samma
  // ordstam gör att den gör det.
  const deFjortonUppsattning = useMemo(
    () => uppsattningar.find((u) => u.nyckel === 'de-fjorton') ?? TOM_UPPSATTNING,
    [uppsattningar],
  );
  const deFjortonUtfall = useTackning(deFjortonUppsattning, parInfo);
  const deFjortonFriskt =
    deFjortonUtfall.status === 'klar' &&
    deFjortonUtfall.dubbla === 0 &&
    deFjortonUtfall.utanfor.length === 0;
  const tackningsEtikett =
    deFjortonUtfall.status === 'raknar'
      ? 'Räknar täckningen…'
      : deFjortonFriskt && deFjortonUtfall.status === 'klar'
        ? `Full täckning · ${deFjortonUtfall.tackta} av ${deFjortonUtfall.tackta}`
        : tackningsLage
          ? 'Dölj täckning'
          : 'Visa täckning';
  // [TASK-349] Dismiss minns per ENHET (localStorage), inte per flik — se
  // `segment-startinfo-minne.ts` för varför den skiljer sig från
  // `AppUpdateBanner.tsx`s sessionsskopade "Inte nu". Lazy initializer: läses
  // en gång vid mount, aldrig på varje rendering.
  const [infoDold, setInfoDold] = useState(() => lasSegmentStartinfoDold());
  const doljInfo = () => {
    setInfoDold(true);
    sparaSegmentStartinfoDold();
  };

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
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets sidkrom — chevron till `/mer`, den enda
          utgången ur segment-ytan. Saknades helt innan denna skiva: filen
          bar bara den interna, knapp-baserade `onTillbaka`-grenen, så det
          gick inte att lämna startvyn annat än via TabBar. Smalare
          omfattning (ingen `rubrik`-prop) — sidan äger sitt eget
          rubrikblock nedan, samma anatomi som `Intresserade.tsx`. */}
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />
      <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
        <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
          Segment
        </h1>
      </header>

      {/* [TASK-349] Marcus text verbatim - men NY text sedan 2026-08-16
          (begreppsrenheten), inte den från 2026-08-10. Den ersatta lydelsen
          löd "Grupper av personer som du kan skicka riktade mail till. Spara
          en grupp och återanvänd den - …" och kallade alltså ett SEGMENT för
          en grupp. Det ordet är sedan uppdelnings-generatorn finns upptaget
          av något annat: en grupp är en av de delar publiken delas upp i.
          Ingressen säger därför "urval", och ordet segment står kvar som
          sidans egen term. Den tidigare tredje meningen ("Flera grupper i
          samma utskick: markera dem") ströks redan 2026-08-10 - markera-
          funktionen får bära sig själv - och återinförs inte här.

          KRYSSBAR sedan TASK-349 (KRYSS-REGELN, MessageBox.tsx): `info` får
          avfärdas, till skillnad från `error`/`warning`. Dismiss minns per
          enhet (`segment-startinfo-minne.ts`, localStorage). Utanför
          `data-testid="segment-listan"`-scopet nedan, precis som headern
          — ariaSnapshot-referenserna för de sju facit-ytorna är därför
          oförändrade av detta. */}
      {!infoDold && (
        <div className="px-4">
          <MessageBox intent="info" onDismiss={doljInfo}>
            Urval av personer som du kan skicka riktade mail till. Spara ett segment och återanvänd
            det - antalet räknas upp automatiskt, så antalet stämmer även när fler personer
            tillfaller segmentet.
          </MessageBox>
        </div>
      )}

      {/* [TASK-249.1] Wrappern bär grindens ariaSnapshot-fäste
          (`data-testid="segment-listan"`, ADR-103 B4) — samma
          testid-avgränsningsmönster som `atgardssida-promoverings-grind.
          spec.ts` etablerade för `granskning-yta`: instrumenten står som
          EGNA syskon-noder UTANFÖR denna div, inte som barn till den. En
          ariaSnapshot scopad hit kan därför aldrig fånga dem —
          strukturellt, inte via ett filter i testet.

          [TASK-249.6] `SkalprovsVaxel` är RIVEN med promoveringen (ADR-103:
          flaggor och växlar rivs, aldrig formen). [TASK-259] `PrototypNot`
          stod kvar efter den rivningen, med motiveringen att sändningen och
          sparandet ännu är no-op (TASK-249.9 § Observera). Marcus QA-fynd
          2026-08-17 avgjorde frågan åt andra hållet: ett internt förbehåll
          om vad koden ännu inte gör hör inte hemma på en yta Lotta använder
          skarpt. Noten är riven, och referensen för denna yta är oförändrad
          — den stod aldrig inom testid-scopet (se ankaret ovan). */}
      <div data-testid="segment-listan" className="flex flex-col gap-6 px-4">
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
        {/* RADEN BÄR TRE KNAPPAR, ALDRIG FYRA (Marcus 2026-08-10, två varv).
            Första formen la Täckning i raden — fyra kapslar ryms inte i
            innehållsspalten, och varken trängsel (varv 1: Markera "skitnära")
            eller radbrytning (varv 2: sicksack med en svävande högerzon) går
            att zonera bort. Skapande-paret bor vänster, Markera behåller sitt
            etablerade högerankare (`ml-auto`), och Täckning bor på en EGEN
            lågmäld rad direkt ovanför panelerna den styr — växeln sitter hos
            det den växlar, inte bland skapandeknapparna. */}
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
            <>
              <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
                <ListPlus aria-hidden="true" size={18} className="shrink-0" />
                Nytt segment
              </button>
              {/* PARTITION-GENERATORNS INGÅNG (S104 Del 3 konvergens, beslut
                  "partition som generator"). Egen kapsel bredvid "Nytt
                  segment" — samma nivå, för handlingen ÄR i samma familj:
                  båda producerar segment, den ena en åt gången, den andra N
                  på en gång. Göms i markera-läget av samma skäl som
                  "Nytt segment": mitt i ett urval är att skapa nytt inte det
                  man håller på med. */}
              <button type="button" onClick={onDelaUpp} className={KAPSEL_KLASS}>
                <Group aria-hidden="true" size={18} className="shrink-0" />
                Dela upp i grupper
              </button>
            </>
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
                <div className="flex min-h-6 items-center">
                  <Skeleton variant="text" className="w-24 text-caption" />
                </div>
              </div>
            ))}
          </div>
        ) : fel ? null : (
          // TVÅ SEKTIONER (B2-promoveringen, se filhuvudets docblock ovan
          // `SegmentLista`): "Dina segment" och "Färdiga grupper" i stället
          // för EN flat lista (Marcus 2026-08-10, omprövad S114 Del 3
          // beslut 3). DET RENDERAS ALDRIG OVANPÅ ETT FEL — samma princip
          // som förut (`fel ? null : …` ovan): misslyckas
          // `segments`-hämtningen VET vi inte om basen är tom, och då ska
          // ingen sektion visas som ett påstående om innehåll.
          <>
            <div className="flex flex-col gap-3">
              <SektionsRubrik namn="Dina segment" antal={dinaSegment.length} />
              {dinaSegment.length === 0 ? (
                // TOMLÄGET, på riktigt: inga sparade segment i basen.
                // Facitets form + ordval ("urval personer" — ORDLISTA:n
                // reserverar "grupp" för uppdelnings-generatorn). Ersätter
                // den TIDIGARE GLOBALA tomläges-grenen (`poster.length ===
                // 0`), som inte längre kan inträffa: `egna` förpopuleras med
                // de fjorton vid mount (byggDeFjorton, ovan) och de tas
                // aldrig bort, så `poster.length === 0` är dött sedan denna
                // landning — pröva-och-bokför-fyndet från B2-promoveringens
                // uppdrag.
                //
                // S120 ITERATION 2 — STÄMPLAD av Marcus 2026-09-04: "Agenten
                // har redan byggt om. Nu blev det en streckad kontur bara.
                // Ser jättebra ut. Kör på den." Facit.json rad "ingen grå
                // låda" är AMENDERAD genom
                // tasks/sessions/bilagor/s114-segmentlistan-konvergens/
                // AMENDERING-2026-09-04-tomlagets-yta.md (stämpel-PR #2293
                // äger själva `godkand`-fältet, orört av denna ändring).
                // ITERATION 1 (dot-grid-textur ovanpå KORT_KLASS, samma
                // tonala grå som "Färdiga grupper"-korten) underkändes av
                // Marcus: "Gillar inte bakgrunden med prickarna. Och jag
                // tycker den är för grå liksom, bör vara en ljusare variant
                // så ytan skiljer sig från alla andra gråa saker på sidan."
                // Texturen (--mm-tomlage-punkt/--mm-tomlage-textur,
                // components.css) är RIVEN, inga döda tokens kvar.
                //
                // Ny yta: `bg-surface` (VIT, samma yta InbetalningsLista.tsx
                // och PersonDetail.tsx redan bär för att skilja sig från
                // gruppkortens `bg-bg-muted`) i stället för KORT_KLASS —
                // skiljer sig alltså MEDVETET från "Färdiga grupper"-korten
                // strax nedanför, som Marcus efterfrågade. Tomläges-
                // affordansen är i stället en STRECKAD ram
                // (`border-dashed border-border`, husets kant-token, samma
                // familj Tailwind UI/Primer Blankslate använder för "detta
                // är en tom platshållare" utan att luta sig på en textur)
                // med `contrast-more:border-border-strong`.
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-border border-dashed bg-surface px-4 py-10 text-center contrast-more:border-border-strong">
                  <p className="font-medium text-body">Inga sparade segment än</p>
                  <p className="max-w-prose text-small text-text-muted">
                    Ett segment är ett urval personer du kan skicka till om och om igen. Du bygger
                    det som en regel - och regeln fortsätter gälla när nya utbildningar tillkommer.
                  </p>
                  <button type="button" onClick={onNytt} className={KAPSEL_KLASS}>
                    <ListPlus aria-hidden="true" size={18} className="shrink-0" />
                    Skapa ditt första segment
                  </button>
                </div>
              ) : (
                kortLista(dinaSegment)
              )}
            </div>

            <div className="flex flex-col gap-3 pb-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SektionsRubrik namn="Färdiga grupper" antal={fardigaGrupper.length} />
                {/* KONTROLLÄGETS INGÅNG (S104 Del 4, task-181, beslut 1: "ett
                    LÄGE på listan") — flyttad från en egen rad OVANFÖR hela
                    listan till "Färdiga grupper"s rubrikrad vid
                    B2-promoveringen (S117, facitet): täckningen gäller bara
                    de fjorton/generator-uppsättningarna (`harledUppsattningar`
                    ovan), så knappen bor hos sektionen den mäter i stället
                    för att sitta ovanför BÅDA sektionerna.

                    ETIKETTEN "VISA TÄCKNING" ÄR ETT ÅTERSTÄLLT BESLUT (Marcus
                    granskning 2026-08-16, fjärde varvet: "Jag vill ha
                    tillbaka täckningsyta och ikonen vi hade innan" — git-
                    historiken bär hela turordningen). Facitets tillägg: när
                    täckningen redan är räknad OCH frisk visar knappen SVARET
                    ("Full täckning · N av N", N ur `useTackning`) i stället
                    för uppmaningen — `tackningsEtikett` ovan. `Layers`
                    framför `ListChecks`: lagren är bilden av flera segment
                    som tillsammans ska täcka en population. */}
                {!markeraLage && fardigaGrupper.length > 0 && (
                  <button
                    type="button"
                    onClick={onTackning}
                    aria-expanded={tackningsLage}
                    className={`-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-small motion-safe:transition-colors print:hidden ${
                      tackningsLage
                        ? 'bg-bg-emphasized'
                        : 'text-text-secondary hover:bg-bg-emphasized'
                    }`}
                  >
                    <Layers aria-hidden="true" size={16} className="shrink-0" />
                    {tackningsEtikett}
                  </button>
                )}
              </div>

              {/* KVITTENSERNA (S104 Del 4, task-181). Läggs ÖVER listan -
                  mellan rubrikraden och korten, listan döljs aldrig. Göms i
                  markera-läget: de två lägena löser olika ärenden och har
                  inget gemensamt att visa samtidigt (samma princip som
                  "Nytt segment"/"Dela upp i grupper" göms där). En
                  uppsättning per kvittens (flera-uppsättningar-beslutet i
                  docblocket ovan `TackningsPanel`) - de fjorton finns från
                  mount, så listan är aldrig tom när läget slås på. Nästlad
                  inuti "inte laddar, inte fel"-grenen ovan — samma
                  `!laddar`-skydd som förut (kommentaren stod tidigare här:
                  en kontroll som räknar mot en tom taxonomi innan `events`
                  svarat hade kunnat visa "ingen saknas" en bråkdel av en
                  sekund innan det rätta talet landar). */}
              {tackningsLage && !markeraLage && (
                // [TASK-249.1] `data-testid="tackningsvyn"` — nästlad INUTI
                // `segment-listan`s scope (en referens kan scopa till
                // endera; se spec-filens huvud). Panelerna bär ingen egen
                // rigg/scaffolding, så ingen ytterligare avgränsning krävs
                // här.
                <div data-testid="tackningsvyn" className="flex flex-col gap-4">
                  {uppsattningar.length === 0 ? (
                    <p className="text-small text-text-muted">
                      Det finns inga grupper att räkna täckning för än. Täckningen gäller de fjorton
                      förskapade grupperna eller en körning av "Dela upp i grupper".
                    </p>
                  ) : (
                    uppsattningar.map((u) => (
                      <TackningsPanel
                        key={u.nyckel}
                        uppsattning={u}
                        parInfo={parInfo}
                        visaNamn={uppsattningar.length > 1}
                      />
                    ))
                  )}
                </div>
              )}

              {kortLista(fardigaGrupper)}
            </div>
          </>
        )}
      </div>
      {/* [TASK-259] Prototyp-noten som stod som egen syskon-div här — utanför
          `segment-listan`s testid-scope, bakom samma `!laddar`-grind — är
          riven med komponenten. Listan slutar med sitt sista kort. */}
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

/**
 * NORMEN ÄR TYST: den som får mailet bär inget märke. Bara avvikelsen märks,
 * och den bärs av TEXT + ikon (`StatusBadge`), aldrig av färg ensam.
 *
 * `endastForelasning` är INGEN avvikelse i leveransmening — personen får
 * mailet precis som alla andra — utan en upplysning om VAD hon faktiskt gått
 * igenom. Den bär därför ett neutralt textpill utan ton, inte en `StatusBadge`:
 * samma skillnad `a` gjorde mellan "fel" och "annan härkomst".
 *
 * ANATOMIN ÄR PERSONLISTANS (Marcus granskning 2026-08-16: publiklistan ska
 * vara "snygg och proffsig som andra listor på personer i appen"). Förebilden
 * är den S103-promoverade `PersonsList.tsx:513-545`, och den bär tre saker som
 * kopieras hit rakt av:
 *
 *   1. RUNDEL + NAMN + UNDERRAD. `size-9 rounded-full bg-bg-emphasized` med
 *      initialer, namnet `font-medium text-body`, e-posten `text-caption
 *      text-text-muted`.
 *   2. TONAL SCANLISTA, INTE KORT PER RAD. `rounded-xl bg-bg-muted` per rad är
 *      formen för 3-12 poster; publiken ska tåla 600+ (Marcus 2026-08-16: prod
 *      har 600+ mottagare under "Alla"). Plattan rivs, radgrammatiken blir
 *      `flex items-center gap-3 py-2.5` och avdelarna bärs av listans egen
 *      `divide-y` — exakt PersonsLists val, av exakt samma skäl.
 *   3. HÖJDLÅSET. E-postraden renderas ALLTID, med en platshållare när adressen
 *      saknas (Marcus app-globala regel, S104 `16c25de6`). Villkorad rendering
 *      hade gjort radhöjden till en funktion av datan — och `medlem.email` ÄR
 *      null för en del av publiken, så det är inte ett teoretiskt fall här.
 *      Tom-markören `—` som stod här förut sa samma sak men band höjden till
 *      att någon skrev ut den.
 *
 *      PLATSHÅLLAREN ÄR ` `, INTE `' '` — mätt 2026-08-16, och det är en
 *      avvikelse från förebilden. `PersonsList.tsx:542` (och `:601`) skriver
 *      `{contact ?? ' '}`; ett vanligt mellanslag är kollapsbar whitespace och
 *      ger elementet höjden NOLL, så låset öppnar sig i exakt det fall det
 *      finns för. Mätning i publiklistan: 63 px mot 56 px mellan en rad med
 *      och en utan e-post, underradens egen höjd 0 px. Med ` ` (icke
 *      kollapsbar) blir båda raderna lika höga. Förebilden har aldrig fällt
 *      felet eftersom var och en av de 50 personerna i staging HAR e-post
 *      (mätt: 0 rader med platshållare) — tekniken är oprövad där, inte rätt.
 *      Fyndet rör en skarp yta och rapporteras, men rättas inte härifrån.
 *
 * DUPLICERAT, INTE BREDDAT (`ADR-102` B3): `PersonsList`/`PersonMiniKort` är
 * skarpa ytor och rörs inte före godkännande — samma val PersonsList själv
 * bokför åt andra hållet i sin `k13`-kommentar.
 *
 * INGEN LÄNK TILL PERSONDETALJEN, medvetet: PersonsLists rad leder vidare och
 * bär därför `relative` + `after:inset-0`. Publiken är en KONTROLLISTA mitt i
 * ett sändflöde — man läser den för att bedöma utskicket, inte för att navigera
 * bort från det. Övervägt och avstått; formen tål att länken läggs till senare
 * (anatomin är redan förebildens).
 */
function PersonRad({
  medlem,
  endastForelasning,
}: {
  medlem: SegmentMember;
  endastForelasning?: boolean;
}) {
  const namn = visatNamn(medlem);
  // NAMNLÖS → PERSON-IKON, ALDRIG INITIALER UR PLATSHÅLLARTEXTEN (TASK-390
  // punkt 5, Marcus 2026-09-04). "NS" (initialerna ur "Namn saknas") hade
  // sett ut som en persons riktiga initialer — exakt den missvisning
  // `Intresserade.tsx`s `KonvergensRad` redan löste ut för "Namnlös
  // intresserad" (`UserRound size-5` i en `size-9`-rundel, kopierad rakt av).
  // `aktaNamn`, inte `namn`-strängen: den enda källan till sanning om
  // huruvida personen HAR ett namn.
  //
  // ITERATION 3 (Marcus dom 2026-09-05): *"'initial-ikonen' för dem som inte
  // har namn har fel grå fyllnadsfärg eller ingen alls, de ska ha exakt samma
  // som de som har namn."* TONEN är därför INTE längre `Intresserade`s
  // (`bg-bg-muted`/`text-text-muted`) utan den NAMNGIVNA GRENENS EGEN,
  // tecken för tecken: `bg-bg-emphasized` + `text-text-secondary`. Skälet är
  // kontexten, inte smaken — `Intresserade`s rundel sitter på en VIT
  // `bg-surface`-yta där `bg-bg-muted` (neutral-50) syns som en rundel; här
  // sitter den på publiklistans EGEN `bg-bg-muted`-platta, alltså exakt samma
  // ton som bakgrunden (mätt 2026-09-05: `rgb(245,245,243)` mot plattans
  // `rgb(245,245,243)`), och rundeln försvann. Namngivna rader bar redan
  // `bg-bg-emphasized` (neutral-100, `rgb(237,238,233)`) och syntes.
  // `UserRound` ärver `currentColor`, så ikonen får samma `text-secondary`
  // som initialerna. `font-semibold text-small` följer INTE med: de är
  // textegenskaper utan verkan på en ikon, och att kopiera dem hade varit
  // brus, inte likhet.
  const namnlos = aktaNamn(medlem) === null;
  return (
    <li className="flex break-inside-avoid items-center gap-3 py-2.5">
      {namnlos ? (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized text-text-secondary"
        >
          <UserRound className="size-5" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-emphasized font-semibold text-small text-text-secondary"
        >
          {initialer(namn)}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-medium text-body">{namn}</span>
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
        <span className="truncate text-caption text-text-muted">{medlem.email ?? ' '}</span>
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
 * visningsfiltret isolerar avvikelserna, och söket är vägen till EN person.
 *
 * CHUNKEN ÄR RIVEN (Marcus 2026-08-16: prod har 600+ mottagare under "Alla").
 * Den sparade SIDHÖJD, inte DOM-noder — hela publiken låg redan i DOM:en och
 * de bortom chunken doldes med `hidden print:contents` (mätt vid 85 personer,
 * 2026-08-10: 3 217 px vid första chunken mot 7 766 px utfälld). Men "Visa 25
 * till" skalar inte: vid 600 mottagare är det 24 klick för att se listans slut,
 * och sidhöjden växer ändå med varje klick.
 *
 * INLINE-SCROLL I STÄLLET — appens etablerade mönster för en lång lista som
 * inte får trycka ned resten av sidan (`Deltagare.tsx:1188-1200`,
 * `NyaAnmalningarCard.tsx:111-115`): `max-h` + `overflow-y-auto`, klippet mitt
 * i en rad ÄR scroll-affordansen, och rullningsytan blir ett riktigt tab-stopp
 * (axe scrollable-region-focusable, WCAG 2.1.1) — men BARA när den faktiskt
 * klipper. Under tröskeln vore ett fokuserbart område utan funktion ett tomt
 * stopp i tangentbordsflödet; det är `kanRulla`-vaktens hela uppgift, ärvd
 * verbatim ur `DeltagarListan`.
 *
 * PAPPERET FÅR FORTFARANDE ALLA RADER. Det var `hidden print:contents` som bar
 * det förut; nu bär `print:max-h-none print:overflow-visible` samma sak — en
 * klippt scrollyta hade annars gett papperet de sex första raderna och tyst
 * ätit resten. Ingen egen kodväg för print, som förut.
 */
function PublikSektion({
  medlemmar,
  isPending,
  isError,
  error,
  endastForelasning,
}: {
  medlemmar: SegmentMember[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  /** Person-ID:n som kvalificerat sig UTAN någon utbildning (granskningsvyn). */
  endastForelasning?: ReadonlySet<string>;
}) {
  const [vy, setVy] = useState<PublikVy>('alla');
  const [sok, setSok] = useState('');

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

  // PUBLIKENS ÖPPNA TAL. 154 av 247 rader som säger "Namn saknas" är inte en
  // kontrollista man kan granska — och QA-fyndet 2026-08-17 ("varför står det
  // Hej Ej?") hade besvarat sig självt med den här raden på plats. Räknas ur
  // HELA publiken, aldrig ur `synliga`: talet beskriver mängden man ska skicka
  // till, inte vad filtret råkar visa just nu.
  const namnlosa = useMemo(() => medlemmar.filter((m) => aktaNamn(m) === null).length, [medlemmar]);

  // RULLNINGENS TRÖSKEL. `max-h-[25.5rem]` (408 px) rymmer drygt sex rader vid
  // radens mätta höjd (~60 px: `py-2.5` + `size-9`-rundelns 36 px, med
  // namn/e-post-blocket som den högre av de två). Sju rader är alltså den
  // första mängd som faktiskt klipps — och klippet mitt i den sjunde ÄR
  // affordansen. Talet är förebildens eget (`Deltagare.tsx:1189`), där det
  // valdes för ~3 av dess betydligt högre kort; samma höjd, annan radhöjd,
  // annat radantal. Tab-stoppet hör till RULLNINGEN, inte till listan.
  const kanRulla = synliga.length > 6;

  if (isError) {
    return (
      <div className="px-4">
        <MessageBox intent="error" title="Kunde inte räkna publiken">
          {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
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

      {/* NAMNLÖSHETEN SÄGS RAKT UT, aldrig underförstått av 154 identiska
          rader. Den syns BARA när den finns (`namnlosa > 0`) — en publik där
          alla har namn ska inte bära en rad som säger "0 av 12", exakt samma
          norm-är-tyst-regel som `PersonRad`s märken följer.

          TALET STÅR FÖRE FILTREN, inte bland dem: det är en egenskap hos
          publiken man behöver veta INNAN man börjar sålla i den. Formen är
          ren fakta utan råd — vad namnlösheten betyder för mailet syns i
          utskicksvyns förhandsvisning, och att upprepa det här hade varit
          samma dubbling Marcus rev två gånger på den här ytan (noll-fallets
          överlappsrad, "Visar N av M" mot "N av M visade"). */}
      {!isPending && namnlosa > 0 && (
        <p className="px-4 text-small text-text-secondary">
          {namnlosa} av {medlemmar.length} saknar registrerat namn.
        </p>
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
        //
        // ITERATION 2 (Marcus 2026-09-04, dev-servern mot staging): "jag kan
        // ju inte granska publiklistan för det finns ingen lista, jag ser
        // tomläget, som dessutom saknar den streckade konturen som vi precis
        // stämplade på Segment-vyn." Samma yta som `SektionsRubrik`s
        // "Inga sparade segment än"-tomläge (`TASK-392`, facit-amendering
        // s114, PR #2308, `feat/segment-tomlage-textur` rad ~2180): vit
        // `bg-surface`-platta med streckad ram i stället för `KORT_KLASS`s
        // toniga grå — samma val, för samma skäl (skiljer tomläget visuellt
        // från de FYLLDA gruppkorten/listorna runtomkring). Klassträngen är
        // DUPLICERAD, inte importerad — unifiering är ett separat kort.
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border border-dashed bg-surface px-4 py-10 text-center contrast-more:border-border-strong">
          <p className="font-medium text-body">0 personer ännu</p>
          <p className="max-w-prose text-small text-text-muted">
            Närvaron för de utbildningar regeln träffar är inte avstämd i basen - publiken fylls av
            sig själv när den blir det.
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
              {/* "Undertrycks" är serverspråk (Marcus 2026-08-16). Paret
                  "Får mailet"/"Får inte mailet" säger samma sak i Lottas ord
                  och läses som ett par utan att man tänker efter. Nyckeln
                  `undertryckt` är kod och rörs inte. */}
              <ToggleButton id="undertryckt">Får inte mailet</ToggleButton>
            </ToggleButtonGroup>
            {/* [TASK-259] HJÄLPRADEN UNDER SÖKRUTAN ÄR RIVEN (Marcus QA-fynd
                2026-08-17). Den sa "Söker i den redan hämtade publiken -
                kostar inget serveranrop." — en upplysning om appens INRE
                mekanik (att sökningen sker i minnet och inte kostar ett
                anrop), inte om vad Lotta gör. Att det går fort märks; att
                det går fort för att datan redan är hämtad är vår sak.
                Sökrutan bär sin egen platshållare och behöver inget mer. */}
            {medlemmar.length > 10 && (
              <Input
                label="Sök i publiken"
                hideLabel
                size="sm"
                value={sok}
                onChange={setSok}
                placeholder="Sök namn eller e-post i publiken…"
              />
            )}
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
            // LISTYTAN ÄR PERSONLISTANS (`PersonsList.tsx:476-479`): tonal
            // platta, `divide-y` som avdelare, `px-4` inner-inset "där
            // rundningen slutar" — och EN inset, aldrig två (TASK-390 punkt 2,
            // Marcus 2026-09-04, DOM-mätt): den ursprungliga ytterdiven
            // (`<div className="px-4">`) lade sin EGEN `px-4` UTANPÅ ulens
            // redan egna `px-4`, alltså dubbel inset — 32 px på mobil (311 px
            // platta mot knappkortets 343 px bredd, samma vänsterkant +16 px
            // förskjuten), 16 px på varje sida på desktop (536 px platta mot
            // knappkortets 568 px, x=452 mot kortets x=436). Plattan bär nu
            // SAMMA mönster som `KORT_KLASS`-korten ovanför den (samma
            // `rounded-2xl border ... bg-bg-muted px-4`-stomme som
            // primärknappens kort), direkt under sektionens flöde — exakt
            // samma vänster/högerkant som knappkortet och rubrikraden.
            //
            // DEN YTTRE `<div>` FINNS IGEN SEDAN ITERATION 3 (blocket nedan),
            // men bär INTE tillbaka dubbel-insetet: paddingen ligger på ETT
            // element, kortet, och `<ul>` har ingen egen. Vad div:en löser är
            // rullningslistens geometri — se nästa stycke.
            //
            // ── ITERATION 3, PUNKT B: PLATTAN OCH RULLNINGSYTAN ÄR TVÅ
            // ELEMENT, INTE ETT (Marcus dom 2026-09-05, tredje domen på samma
            // punkt) ────────────────────────────────────────────────────────
            //
            // Marcus: *"Scrollbaren går för högt och för lågt så den hamnar
            // utanför blocket/listan fortfarande."*
            //
            // ROTORSAKEN, DOM-MÄTT 2026-09-05 (1440, headless Chromium, före
            // ändringen): `<ul>` var SAMMA ELEMENT som den rundade plattan —
            // `scrollerArPlattan: true`, båda `top 479,75 / bottom 887,75 /
            // left 436 / right 1004`, `plattaRadie 16px`, `rannaPx 13`. En
            // klassisk rullningslist ritas i scroll-containerns PADDING-BOX,
            // alltså över HELA det elementets höjd. När det elementet också ÄR
            // kortet betyder det tre fel på en gång:
            //   1. tracket började 7,00 px OVANFÖR första radens överkant
            //      (`overhangTopp: 7` = ulens egen `py-1.5` + kanten) — "går
            //      för högt";
            //   2. det slutade lika långt NEDANFÖR sista raden — "går för
            //      lågt";
            //   3. det låg i x mellan 991 och 1004, alltså ända ut till
            //      kortets absoluta högerkant — där en 16 px hörnradie kröker
            //      bakgrunden INÅT. Ett rektangulärt spår i ett rundat hörn
            //      ligger per definition utanför plattan: "hamnar utanför
            //      blocket".
            // Iteration 2:s `py-1.5` flyttade radernas INNEHÅLL bort från
            // hörnkurvan, men rörde aldrig tracket — därför föll punkten igen.
            //
            // FÖREBILDEN HAR ALDRIG HAFT PROBLEMET, och nu vet vi varför:
            // `DeltagarListan`s `<ul>` (`Deltagare.tsx:1211-1213`) är
            // OSMYCKAD — `flex flex-col gap-2.5` plus rullklasserna, ingen
            // rundning, ingen bakgrund, ingen padding. Där bär varje KORT sin
            // egen form, så scroll-containern har ingen ram att sticka utanför.
            // `DokumentYta.tsx:2833` löser samma sak likadant ("RULLEN LIGGER
            // UTANFÖR KORTEN, PÅ DEN GRÅ BEHÅLLAREN — `<ul>` är genomskinlig").
            //
            // FIXEN ÄR DÄRFÖR STRUKTURELL, inte ännu en paddingjustering: den
            // yttre `<div>` är KORTET (rundning, kant, `bg-bg-muted`, padding)
            // och `<ul>` är ENBART rullningsytan (transparent, formlös). Då
            // ligger trackets överkant exakt på första radens överkant och
            // underkanten på listytans, och hela spåret sitter innanför
            // plattans ram i båda riktningar.
            //
            // GEOMETRIN ÄR BEVARAD, inte omritad (punkt 2 från iteration 2 får
            // inte falla tillbaka): kortets ytterkant är fortfarande `<div>`:ens
            // och alltså identisk med `KORT_KLASS`-kortens (mätt: samma
            // `left`/`right`/`width` som primärknappens kort). Vänster-insetet
            // till radens innehåll är fortfarande 16 px (`pl-4` på kortet, ulen
            // har ingen egen). `pr-1.5` (6 px) i stället för `px-4` när listan
            // rullar är rännans nya hemvist — den ersätter iteration 2:s
            // `pr-2.5` INUTI ulen, som var det som sköt spåret ut i kanten.
            // Rullar listan inte finns ingen ränna, och kortet är symmetriskt
            // `px-4` igen. `print:pr-4` återställer symmetrin på papper, där
            // `overflow` ändå är `visible` och ingen list finns.
            //
            // INGEN EGEN RUNDNING PÅ `<ul>`, medvetet: `border-radius` på en
            // scroll-container klipper spårets ändar i hörnen — samma avhuggna
            // intryck vi just rättar, bara i en annan form. Fokusringen
            // (`focus-ring-inset`, tab-stoppet nedan) blir därmed rak innanför
            // en rundad platta. Det är ett aktivt-tillståndsmärke, inte en
            // vilande yta, och läsbarheten vinner över hörnformen.
            //
            // OFÖRÄNDRAT: `kanRulla`-vakten (tab-stoppet sätts bara när listan
            // faktiskt klipper), `divide-y` på ulen, `max-h-[25.5rem]`,
            // `print:max-h-none print:overflow-visible` (papperet får alla
            // rader), och `contrast-more:border-border-strong` — den följer med
            // kanten till det element som numera bär den.
            <div
              className={`rounded-2xl border border-transparent bg-bg-muted py-1.5 contrast-more:border-border-strong ${
                kanRulla ? 'pr-1.5 pl-4 print:pr-4' : 'px-4'
              }`}
            >
              <ul
                aria-label="Personer i publiken"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningarCard.tsx:112.
                tabIndex={kanRulla ? 0 : undefined}
                className={`flex flex-col divide-y divide-border ${
                  kanRulla
                    ? 'focus-ring-inset scrollbar-inline max-h-[25.5rem] overflow-y-auto print:max-h-none print:overflow-visible'
                    : ''
                }`}
              >
                {synliga.map((m) => (
                  <PersonRad
                    key={m.id}
                    medlem={m}
                    endastForelasning={endastForelasning?.has(m.id)}
                  />
                ))}
              </ul>
            </div>
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
  onTillbaka,
  onSkicka,
  onAndra,
}: {
  entitet: SegmentEntitet;
  parInfo: ParInfo[];
  onTillbaka: () => void;
  onSkicka: () => void;
  onAndra: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  const rule = bruttoRegelFor(entitet, parInfo);
  const { data, isPending, isError, error } = useEntitetsMedlemmar(entitet, parInfo);
  useVyFokus(rubrikRef, !isPending);

  // [TASK-249.6] Publiken är EF:ens svar, rakt av. Skalprovets utfyllnad —
  // som stod här och blåste upp mängden till ett mål per segment — är riven
  // med promoveringen (ADR-103). Talen i headern nedan räknas därför på
  // samma mängd som listan visar, vilket de gjorde redan med riggen AV.
  const medlemmar = data?.members ?? [];
  const antalFar = medlemmar.filter(farMailet).length;
  const undertryckta = medlemmar.length - antalFar;
  const tomRegel = rule.include.length === 0;

  return (
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets `SidRamKnapp` — state-baserad "tillbaka"
          (byter vy, byter aldrig route), ersätter den lokala `SidRam`-kopian.
          Geometrin är identisk (delad `CHEVRON_KLASS`), bara hemvisten
          flyttad. */}
      <SidRamKnapp tillbakaEtikett="Tillbaka till segmenten" onTillbaka={onTillbaka} />
      {/* [TASK-249.1] Wrappern bär grindens ariaSnapshot-fäste
          (`data-testid="segment-detaljvyn"`, ADR-103 B4) — `gap-6` speglar
          den omslutande sektionens klass exakt, så DETTA extra DOM-lager
          ändrar inget synligt avstånd (samma grepp som `granskning-yta`/
          `segment-listan` ovan). [TASK-259] `PrototypNot`, som stod sist i
          funktionen som en egen syskon-div av samma skäl, är riven.

          [TASK-249.6] DEN AVGRÄNSNING SOM STOD HÄR ÄR UPPLÖST AV RIVNINGEN.
          Till skillnad från de sex andra ytorna kunde `SkalprovsVaxel` inte
          uteslutas strukturellt härifrån: den satt mitt i `PublikSektion`s
          delade kontrolldiv tillsammans med `ToggleButtonGroup`/`Input`, och
          en `ariaSnapshot`-lokator kan inte hoppa över ett mittensyskon. Att
          FLYTTA växeln hade ändrat en redan godkänd (facit.json, sha
          a40f3543) DOM-position — det `ADR-102` förbjuder — så referensen
          bar växeln synligt. När växeln nu är RIVEN i stället för flyttad
          försvinner noderna utan att formen rörs, och de två referenserna
          (`segment-detaljvyn-visual-{desktop,mobile}.aria.yml`) är
          omgenererade i rivnings-committen med Marcus kvittens 2026-08-17.
          Ytformen omkring — `ToggleButtonGroup`, `Input`, publiklistan —
          står rad för rad oförändrad. */}
      <div data-testid="segment-detaljvyn" className="flex flex-col gap-6">
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
            allt annat. Färg är aldrig ensam bärare — uppdelningen är text.

            [TASK-259] Raden byter innehåll mellan fem lägen i SAMMA nod (en
            `aria-live` som monteras samtidigt som sin text annonseras inte),
            så laddvågen måste sättas villkorligt på noden i stället för att
            omsluta texten. Villkoret är härlett ur samma två flaggor grenen
            nedan använder — ingen egen kopia av kedjan. */}
          <p
            className={
              !tomRegel && isPending
                ? 'mm-laddtext text-small text-text-muted'
                : 'text-small text-text-muted'
            }
            aria-live="polite"
          >
            {tomRegel
              ? 'Regeln träffar inga utbildningar än.'
              : isPending
                ? 'Räknar personer…'
                : isError
                  ? 'Antalet kunde inte räknas'
                  : medlemmar.length === 0
                    ? '0 personer ännu'
                    : `${medlemmar.length} ${personform(medlemmar.length)} · ${antalFar} får mailet · ${undertryckta} får inte mailet`}
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
              {/* TASK-390 punkt 1 (Marcus 2026-09-04): "Skicka" var appens ord
                  för AVSÄNDANDET (mailet går ut nu); "Gör" är ordet för att
                  ÖPPNA VERKTYGET — knappen leder till granska-läget, den
                  skickar ingenting själv. */}
              Gör ett utskick till det här segmentet
              <ChevronRight
                aria-hidden="true"
                size={18}
                className="ml-auto shrink-0 text-text-secondary"
              />
            </button>
          </div>
        </div>

        {/* PUBLIKEN — HUVUDINNEHÅLLET. Direkt, aldrig bakom en fällning. */}
        <PublikSektion
          medlemmar={medlemmar}
          isPending={isPending && !tomRegel}
          isError={isError}
          error={error}
        />

        {/* REGELN STÅR SIST, och det är avsiktligt. Den läses sällan (Marcus
          skapar i skov, kontrollerar alltid) — men den måste gå att nå, och
          "Ändra regeln" är raden som leder vidare (chevron höger). */}
        <DetaljGrupp id="grupp-regel" rubrik="Regeln">
          {/* [TASK-390 punkt 6, orkestrerarens rekommendation, Marcus
              2026-09-04] "Form"-raden ("Predikat över dimensioner" /
              "Uppräknade utbildningspar (äldre form)") ÄR RIVEN. Den skiljde
              två INTERNA lagringsformer (den nya predikat-motorn mot den
              äldre uppräknade regelformen, migrationssömmen `TASK-249.5`
              öppnade) — en distinktion Lotta aldrig har nytta av
              (Gunilla-principen). "Räknas ur" bär den mening som faktiskt
              finns. */}
          <EtikettVardeRad term="Räknas ur">
            Genomförd närvaro (Närvarande eller Deltog online)
          </EtikettVardeRad>
          {/* [TASK-390 iteration 3, Marcus dom 2026-09-05: "Raden 'Motsvarar'
              behöver vi den?"] NEJ — RIVEN. Raden sa "2 utbildningar i basen
              i dag", ett TAL över exakt den mängd `RegelStruktur`s chips
              räknar upp med NAMN direkt under den ("RIM 1" "RIM 2"). Att
              först säga hur många och sedan vilka är en dubbling, och talet
              är den svagare av de två: man kan räkna chipsen, man kan inte
              härleda chipsen ur talet. Samma dubblings-klass Marcus rev två
              gånger tidigare på den här ytan ("Visar N av M" mot "N av M
              visade", noll-fallets överlappsrad).

              "Räknas ur" står KVAR och är inte samma sak: den säger vilken
              närvaro som kvalificerar (Närvarande/Deltog online) — en
              upplysning som inte finns någon annanstans i blocket.

              REVERSIBEL: `rule` lever kvar (`tomRegel` läser den), så raden
              kommer tillbaka med sitt eget uttryck om Marcus säger annat.
              KÄND FÖLJD: `segment-detaljvyn-visual-{desktop,mobile}.aria.yml`
              bär `term: Motsvarar` + `definition: 2 utbildningar i basen i
              dag` och diffar tills referenserna görs om vid stämpeln
              (AC #6/#7) — medvetet INTE omgenererade här. */}
          <div className="flex flex-col gap-3 py-3">
            <p className="text-small text-text-secondary">{definitionFor(entitet, parInfo)}</p>
            {/* [TASK-390 punkt 7, orkestrerarens rekommendation, Marcus
                2026-09-04] Avsiktsmeningen (ovan) vinner alltid som PROSA;
                själva regeln renderas STRUKTURERAT under den, som
                läs-only chip-grupper — Linear/GitHub/Notions filter-pill-
                mönster. `RegelStruktur` läser samma predikat/`bruttoRegelFor`
                som prosan redan gör, aldrig en egen parallell källa. */}
            <RegelStruktur entitet={entitet} parInfo={parInfo} />
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
      </div>
    </section>
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

function ChipRad({
  etikett,
  doldEtikett,
  children,
}: {
  etikett: string;
  /** Döljer legenden VISUELLT (`sr-only`) - aldrig från tillgänglighetsträdet.
      Sätts där en stegrubrik direkt ovanför redan namnger gruppen, se nedan. */
  doldEtikett?: boolean;
  children: React.ReactNode;
}) {
  // `<fieldset>`/`<legend>` framför `role="group"` + `aria-label`: samma
  // semantik med inbyggd elementbetydelse, och grupprubriken blir synlig text
  // i stället för ett attribut bara skärmläsaren ser.
  //
  // ...UTOM när steget ovanför redan ställt frågan (Marcus 2026-08-16, varv 4:
  // "ta bort alla under rubriken exempelvis 'Utbildningar' som visas över
  // pill-valen"). Under rubriken "Vilka utbildningar ska publiken delas upp
  // efter?" är legenden "Utbildningar" en andra, svagare rubrik för samma sak.
  // Den tas därför ur SYNFÄLTET, inte ur trädet: `sr-only` håller kvar
  // fieldsetens tillgängliga namn, så gruppen fortfarande annonseras
  // ("Utbildningar, grupp") för den som inte ser stegrubrikens närhet.
  // Ribban är 11 - en dold etikett är ett layout-beslut, aldrig ett
  // semantiskt. En egen prop framför en global ändring: regelverkstadens tre
  // chip-rader (Familj, Nivå, Format) står UTAN stegrubrik ovanför sig och
  // behöver sina synliga legender.
  return (
    <fieldset>
      <legend
        className={doldEtikett ? 'sr-only' : 'pb-1.5 font-medium text-small text-text-secondary'}
      >
        {etikett}
      </legend>
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
  etikett,
  parInfo,
  formatIBasen,
  onAndra,
  onTaBort,
  kanTasBort = true,
}: {
  villkor: Villkor;
  etikett: string;
  parInfo: ParInfo[];
  formatIBasen: string[];
  onAndra: (v: Villkor) => void;
  onTaBort: () => void;
  /** Regelns enda villkor kan inte tas bort (Marcus 2026-08-16) — att ta
      bort det sista hade bara gett en tom regel, en handling utan mening. */
  kanTasBort?: boolean;
}) {
  const [merOppen, setMerOppen] = useState(false);
  const merPanelId = useId();
  const traffade = traffar(villkor, parInfo);
  const merAktiva = villkor.format.length + (villkor.period ? 1 : 0);
  /** Orört = ingen dimension vald alls. Styr om den saknade modaliteten är röd. */
  const orort =
    villkor.modalitet === null &&
    villkor.familjer.length === 0 &&
    villkor.nivaer.length === 0 &&
    villkor.format.length === 0 &&
    villkor.period === null;
  const visaNiva =
    villkor.familjer.length === 0 || villkor.familjer.some((f) => FAMILJER_MED_NIVA.includes(f));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong">
      {/* KORTETS IDENTITET SOM EYEBROW (Marcus 2026-08-16: "Villkor 1"
          hade exakt samma stil som fältetiketterna — hierarkin syntes inte).
          Versal spärrad caption i dämpad ton är den klassiska
          överrads-etiketten: identitet, inte fält. Ta bort-knappen visas
          bara när borttagning är en meningsfull handling. */}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <span className="font-medium text-caption text-text-muted uppercase tracking-wider">
          {etikett}
        </span>
        {kanTasBort && (
          <Button
            intent="ghost"
            size="sm"
            aria-label={`Ta bort ${etikett.toLowerCase()}`}
            onPress={onTaBort}
          >
            <X aria-hidden="true" size={16} className="shrink-0" />
            Ta bort
          </Button>
        )}
      </div>

      {/* MODALITETSVALET FÖRST OCH MED MALLVYNS ORD (Marcus 2026-08-16:
          '"Räknas som" fattar jag inte … ska man fylla i den först kan den
          inte ligga på rad 3'). Det obligatoriska valet ligger nu överst —
          dess framträdande färg är därmed rätt signal i stället för en
          vilseledande — och frågan/alternativen är ordagrant samma som
          mallvyns och generatorns steg 1, så alla tre ytorna talar samma
          språk. Säkerhetskravet (ingen default, rött när bygget börjat utan
          val) är oförändrat. */}
      {/* SAMMA VALRADS-FORM SOM MALLVYN/GENERATORN (Marcus 2026-08-16:
          "Lista dem vertikalt exakt som vi gjorde på grupper"), med EN
          nyansinvertering: kortet är självt `bg-bg-muted`, så raderna bär
          `bg-surface` — grå rader på grå botten hade varit osynliga (samma
          nästlingsregel som stegkortens minikort, fast åt andra hållet).
          Etiketten renderas i ChipRads legendstil så "Vilka räknas med?",
          "Familj" och "Nivå" delar typsnitt och färg — primitivens egen
          Label-stil avviker, därför `hideLabel` + egen rad. */}
      <div className="flex flex-col gap-1.5">
        <span aria-hidden="true" className="font-medium text-small text-text-secondary">
          Vilka räknas med?
        </span>
        <RadioGroup
          label="Vilka räknas med?"
          hideLabel
          value={villkor.modalitet}
          onChange={(v) => onAndra({ ...villkor, modalitet: v as ModalitetsVal })}
          isInvalid={villkor.modalitet === null && !orort}
          errorMessage="Välj vilka som räknas innan villkoret kan användas."
        >
          <Radio
            value="Utbildning"
            className="w-full rounded-xl border border-transparent bg-surface px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
          >
            De som gått utbildningar
          </Radio>
          <Radio
            value="Föreläsning"
            className="w-full rounded-xl border border-transparent bg-surface px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
          >
            De som varit på föreläsningar
          </Radio>
          <Radio
            value="Båda"
            className="w-full rounded-xl border border-transparent bg-surface px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
          >
            Båda
          </Radio>
        </RadioGroup>
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
          {/* TIDSPERIODEN SOM RIKTIG KONTROLL (varv 6d) — text-utlägget om
              varför året inte gick att välja är rivet på Marcus order
              ("jag vill kunna välja tidsperiod … proffsigast möjliga sätt").
              Server-kravet och räkne-ärligheten: se `Villkor.period`s
              docblock + steg 3-raden i verkstaden. */}
          <div className="flex flex-col gap-1.5 border-border border-t pt-3">
            <span className="font-medium text-small">Tidsperiod</span>
            <DatumFalt
              value={
                villkor.period
                  ? { start: parseDate(villkor.period.start), end: parseDate(villkor.period.end) }
                  : null
              }
              onChange={(r) =>
                onAndra({
                  ...villkor,
                  period: r ? { start: r.start.toString(), end: r.end.toString() } : null,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* MENINGEN, SIST. Modaliteten står i den varje gång — den läses utan
          att frågas om. Under den: vad villkoret expanderas till just nu. */}
      {/* MENINGEN VISAS FÖRST NÄR DEN FINNS (Marcus 2026-08-16: hellre
          ingenting än "Ofullständigt villkor …" — meningen dyker upp när
          valen är gjorda, samma princip som mallvyns steg 3). Radiogruppens
          eget felmeddelande bär kravet tills dess. */}
      {villkorGiltigt(villkor) && (
        <div className="flex flex-col gap-1 border-border border-t pt-3">
          <p className="text-body">{villkorKlartext(villkor)}</p>
          {/* TRÄFF-ORDET FÖLJER VALET (Marcus 2026-08-16, viktigt): vid
              "Båda" omfattar träffarna både utbildningar och föreläsningar —
              samlingsordet är "event"; vid föreläsningsvalet är träffarna
              föreläsningar. */}
          <p className="text-small text-text-muted">
            {(() => {
              const ord =
                villkor.modalitet === 'Föreläsning'
                  ? { ingen: 'ingen föreläsning', den: 'föreläsningen', flera: 'föreläsningar' }
                  : villkor.modalitet === 'Båda'
                    ? { ingen: 'inget event', den: 'eventet', flera: 'event' }
                    : { ingen: 'ingen utbildning', den: 'utbildningen', flera: 'utbildningar' };
              return traffade.length === 0
                ? `Träffar ${ord.ingen} i basen i dag. Regeln är giltig - den fylls när ${ord.den} finns.`
                : `Träffar ${traffade.length} av ${parInfo.length} ${ord.flera}: ${traffade
                    .map((p) => labelForPar(p.par))
                    .join(', ')}`;
            })()}
          </p>
        </div>
      )}
    </div>
  );
}

/** Kurser utan känd Kursfamilj i basen (TASK-249.5 § BASFÄLTEN) — sagt rakt ut,
 *  i stället för att kursen tyst försvinner ur familj-villkoren. */
function OkandaKurser({ parInfo }: { parInfo: ParInfo[] }) {
  const okanda = [...new Set(parInfo.filter((p) => p.familj === null).map((p) => p.par.kurs))];
  if (okanda.length === 0) return null;
  return (
    <MessageBox intent="warning" title="Utbildningar utan familj i basen">
      <p>
        {okanda.join(', ')} saknar Kursfamilj på sin(a) Eventplanering-rad(er), och matchar därför
        inget familj-villkor.
      </p>
      <p>
        Lägg till Kursfamilj (och Kursnivå om det är en RIM-nivå) på utbildningen i basen - då
        omfattas den automatiskt.
      </p>
    </MessageBox>
  );
}

function VillkorsLista({
  hjalptext,
  villkor,
  parInfo,
  formatIBasen,
  onAndra,
  onLaggTill,
  onTaBort,
}: {
  hjalptext: string;
  villkor: Villkor[];
  parInfo: ParInfo[];
  formatIBasen: string[];
  onAndra: (id: string, v: Villkor) => void;
  onLaggTill: () => void;
  onTaBort: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-small text-text-muted">{hjalptext}</p>
      {villkor.length > 0 && (
        <ul className="flex flex-col gap-3 pt-1">
          {villkor.map((v, i) => (
            <li key={v.id} className="flex flex-col">
              <VillkorsKort
                villkor={v}
                etikett={`Villkor ${i + 1}`}
                parInfo={parInfo}
                formatIBasen={formatIBasen}
                onAndra={(ny) => onAndra(v.id, ny)}
                onTaBort={() => onTaBort(v.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="flex pt-1">
        <button type="button" onClick={onLaggTill} className={`${KAPSEL_KLASS} w-64`}>
          <Plus aria-hidden="true" size={18} className="shrink-0" />
          {villkor.length === 0 ? 'Lägg till villkor' : 'Lägg till ett villkor till'}
        </button>
      </div>
    </div>
  );
}

/**
 * MED-GRENEN SOM KONJUNKT-ALTERNATIV. Ett alternativ med ETT villkor renderas
 * exakt som förut — inget ramverk, ingen ny terminologi förrän någon aktivt
 * bett om ett och-krav. Först vid TVÅ eller fler villkor får alternativet sin
 * ram och sin egen rubrik, och "och"-bindningen står som text mellan korten —
 * semantiken bärs av rubriken och klartext-meningen, aldrig av enbart
 * layouten.
 *
 * Två tillägg-knappar med olika verb, med avsikt: "och-krav" bor PER
 * ALTERNATIV (smalnar av det), "nytt alternativ" bor på sektionen (vidgar
 * regeln). Att ge dem samma knapp hade återinfört exakt den tvetydighet
 * AND-luckan bestod av.
 *
 * ORDET "GRUPP" ÄR UTE UR VERKSTADENS SYNLIGA TEXT (Marcus 2026-08-16,
 * begreppsrenheten). Det kolliderade med uppdelnings-betydelsen, där en grupp
 * är en MÄNGD PERSONER som får ett eget mail ("Dela upp i grupper",
 * täckningen) - här betydde samma ord en OR-gren i ett predikat. Två
 * betydelser, ett ord, på ytor man rör sig mellan i samma arbetspass.
 * Verkstaden säger därför "alternativ"; uppdelningen behåller "grupp" ensam.
 * Identifierarna (`onLaggTillGrupp`, `gruppEtikett`, `KonjunktLista`) är
 * ORÖRDA per Marcus order - de är inte synlig text, och ett namnbyte hade
 * breddat diffen utan att flytta en pixel.
 */
function KonjunktLista({
  konjunkter,
  parInfo,
  formatIBasen,
  onAndraVillkor,
  onLaggTillVillkor,
  onLaggTillGrupp,
  onTaBortVillkor,
}: {
  konjunkter: Konjunkt[];
  parInfo: ParInfo[];
  formatIBasen: string[];
  onAndraVillkor: (konjunktId: string, villkorId: string, v: Villkor) => void;
  onLaggTillVillkor: (konjunktId: string) => void;
  onLaggTillGrupp: () => void;
  onTaBortVillkor: (konjunktId: string, villkorId: string) => void;
}) {
  const flera = konjunkter.length > 1;
  const harFlerledad = konjunkter.some((k) => k.villkor.length > 1);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-small text-text-muted">
        {harFlerledad || flera
          ? 'Den som uppfyller minst ett av alternativen är med i segmentet. Inom ett alternativ måste alla villkor uppfyllas samtidigt.'
          : 'Den som uppfyller minst ett av villkoren är med i segmentet.'}
      </p>
      {konjunkter.length > 0 && (
        <ul className="flex flex-col gap-3 pt-1">
          {konjunkter.map((k, ki) => {
            const gruppEtikett = (vi: number) =>
              flera || harFlerledad
                ? `Alternativ ${ki + 1} · villkor ${vi + 1}`
                : `Villkor ${vi + 1}`;
            const kort = (v: Villkor, vi: number) => (
              <VillkorsKort
                villkor={v}
                etikett={gruppEtikett(vi)}
                parInfo={parInfo}
                formatIBasen={formatIBasen}
                onAndra={(ny) => onAndraVillkor(k.id, v.id, ny)}
                onTaBort={() => onTaBortVillkor(k.id, v.id)}
                kanTasBort={flera || k.villkor.length > 1}
              />
            );
            return (
              <li key={k.id} className="flex flex-col gap-3">
                {ki > 0 && (
                  <p className="text-center font-medium text-small text-text-secondary">eller</p>
                )}
                {k.villkor.length === 1 ? (
                  k.villkor[0] && kort(k.villkor[0], 0)
                ) : (
                  <div className="flex flex-col gap-3 rounded-2xl border border-border p-3">
                    <p className="font-medium text-small text-text-secondary">
                      Alternativ {ki + 1} - alla villkor nedan måste uppfyllas samtidigt
                    </p>
                    {k.villkor.map((v, vi) => (
                      <div key={v.id} className="flex flex-col gap-3">
                        {vi > 0 && (
                          <p
                            aria-hidden="true"
                            className="text-center font-medium text-small text-text-secondary"
                          >
                            och
                          </p>
                        )}
                        {kort(v, vi)}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex">
                  {/* SAMMA GEOMETRI SOM ELLER-KNAPPEN, ANNAN GRÅ NYANS (Marcus
                      2026-08-16): kapselformen (radie, padding, typografi) är
                      identisk med `KAPSEL_KLASS`; nyansskillnaden bär
                      hierarkin - Eller (vidgar regeln) står på grå platta,
                      Och (smalnar ett alternativ) som grå kontur. */}
                  <button
                    type="button"
                    onClick={() => onLaggTillVillkor(k.id)}
                    className="inline-flex w-64 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 font-medium text-small hover:bg-bg-emphasized motion-safe:transition-colors"
                  >
                    <Plus aria-hidden="true" size={18} className="shrink-0" />
                    Och: lägg till ett krav till
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex pt-1">
        {/* Samma fasta bredd som Och-knappen (Marcus 2026-08-16: paret ska
            vara lika brett och lika högt; nyansen skiljer dem). */}
        <button type="button" onClick={onLaggTillGrupp} className={`${KAPSEL_KLASS} w-64`}>
          <Plus aria-hidden="true" size={18} className="shrink-0" />
          {konjunkter.length === 0 ? 'Lägg till villkor' : 'Eller: lägg till ett alternativ'}
        </button>
      </div>
    </div>
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
    () => entitet.predikat ?? { med: [nyKonjunkt()], utan: [] },
  );
  const [sparNot, setSparNot] = useState(false);

  const formatIBasen = useMemo(
    () => [...new Set(parInfo.map((p) => p.format))].sort((a, b) => a.localeCompare(b, 'sv')),
    [parInfo],
  );

  const rule = expandera(pred, parInfo);
  const ofullstandiga = [...pred.med.flatMap((k) => k.villkor), ...pred.utan].filter(
    (v) => !villkorGiltigt(v),
  ).length;
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
  const { data, isFetching, isError, error } = usePredikatMedlemmar(pred, null, parInfo, harRegel);
  const antal = data?.count;

  /* Med-grenen är konjunkt-grupper; utan-grenen är platt. En grupp vars sista
     villkor tas bort försvinner — en tom grupp är inte "alla", den är inget. */
  const andraMed = (konjunktId: string, villkorId: string, ny: Villkor) =>
    setPred((p) => ({
      ...p,
      med: p.med.map((k) =>
        k.id === konjunktId
          ? { ...k, villkor: k.villkor.map((v) => (v.id === villkorId ? ny : v)) }
          : k,
      ),
    }));
  const laggTillOchKrav = (konjunktId: string) =>
    setPred((p) => ({
      ...p,
      med: p.med.map((k) =>
        k.id === konjunktId ? { ...k, villkor: [...k.villkor, nyttVillkor()] } : k,
      ),
    }));
  const laggTillGrupp = () => setPred((p) => ({ ...p, med: [...p.med, nyKonjunkt()] }));
  const taBortMedVillkor = (konjunktId: string, villkorId: string) =>
    setPred((p) => ({
      ...p,
      med: p.med
        .map((k) =>
          k.id === konjunktId ? { ...k, villkor: k.villkor.filter((v) => v.id !== villkorId) } : k,
        )
        .filter((k) => k.villkor.length > 0),
    }));
  const andraUtan = (id: string, ny: Villkor) =>
    setPred((p) => ({ ...p, utan: p.utan.map((v) => (v.id === id ? ny : v)) }));
  const laggTillUtan = () => setPred((p) => ({ ...p, utan: [...p.utan, nyttVillkor()] }));
  const taBortUtan = (id: string) =>
    setPred((p) => ({ ...p, utan: p.utan.filter((v) => v.id !== id) }));

  return (
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets `SidRamKnapp` ersätter den lokala
          `SidRam`-kopian — samma geometri, delad `CHEVRON_KLASS`. */}
      <SidRamKnapp tillbakaEtikett="Tillbaka till segmentet" onTillbaka={onTillbaka} />
      {/* [TASK-249.1] `data-testid="verkstaden"` (ADR-103 B4) — `gap-6`
          speglar den omslutande sektionens klass, samma noll-synligt-avstånd-
          grepp som övriga sex ytor. Riggarna förekom aldrig i denna vy —
          bara `PrototypNot` behövde uteslutas ur scopet, och den är sedan
          TASK-259 riven helt (TASK-249.6 rev `PrototypRigg`/
          `SkalprovsVaxel`, noten överlevde det varvet). */}
      <div data-testid="verkstaden" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          {/* RUBRIKEN ÄR SEGMENTET, INTE SYSTEMORDET (Marcus 2026-08-16:
            "'Regeln' … väldigt förvirrande"). Befintligt segment bär sitt
            namn; ett namnlöst utkast (vägen ur mallvyns "Bygg med egna
            villkor") heter det man håller på att göra. Den gamla tekniska
            ingressen ("En regel beskriver vad någon har gått igenom - inte
            vilka utbildningar som fanns …") är ersatt av en rad i
            nyttospråk — automatik-poängen bor nu i villkorens egen text. */}
          <h1 ref={rubrikRef} tabIndex={-1} className="min-w-0 truncate font-semibold text-3xl">
            {entitet.namn.trim() !== '' ? entitet.namn : 'Nytt segment'}
          </h1>
          <p className="text-small text-text-muted">
            Egna villkor för vilka som ingår - antalet räknas medan du bygger.
          </p>
        </header>

        {entitet.predikat === null && (
          <div className="px-4">
            <MessageBox intent="info" title="Det här segmentet är sparat i den äldre formen">
              Regeln är en uppräkning av utbildningar: {definitionFor(entitet, parInfo)} Den
              fortsätter fungera, men omfattar inte nya utbildningar. Villkoren nedan bygger om den
              som ett predikat.
            </MessageBox>
          </div>
        )}

        <div className="px-4">
          <OkandaKurser parInfo={parInfo} />
        </div>

        {/* SAMMA TRE STEGKORT SOM MALLVYN OCH GENERATORN (varv 6c, Marcus:
          "gör HELA sidan lika bra"). Appens tre skapandeytor delar nu form:
          numrerade kort, namnet sist, summeringen i brödtextgrad. Namnet
          flyttade från toppen till steg 3 — man vet vad segmentet ÄR innan
          man döper det (mallvyns ordning). Steg 2 är valfritt och dämpas
          därför aldrig. */}
        <div className="flex flex-col gap-4 px-4">
          <StegSektion nummer={1} rubrik="Vilka ska ingå?">
            <KonjunktLista
              konjunkter={pred.med}
              parInfo={parInfo}
              formatIBasen={formatIBasen}
              onAndraVillkor={andraMed}
              onLaggTillVillkor={laggTillOchKrav}
              onLaggTillGrupp={laggTillGrupp}
              onTaBortVillkor={taBortMedVillkor}
            />
          </StegSektion>

          <StegSektion nummer={2} rubrik="Ska några räknas bort?">
            <VillkorsLista
              hjalptext="Valfritt. Den som uppfyller något av villkoren här tas bort igen, även om hon räknades in ovan."
              villkor={pred.utan}
              parInfo={parInfo}
              formatIBasen={formatIBasen}
              onAndra={andraUtan}
              onLaggTill={laggTillUtan}
              onTaBort={taBortUtan}
            />
          </StegSektion>

          <StegSektion nummer={3} rubrik="Det här blir segmentet" dampad={!harRegel}>
            <div aria-live="polite" aria-busy={isFetching} className="flex flex-col gap-1">
              {ofullstandiga > 0 ? (
                // "Modalitet" är systemspråk (Marcus 2026-08-16: "Jag förstår
                // inte modalitet och det kommer inte Lotta heller göra") — raden
                // pekar i stället på det val som saknas, med dess egna ord.
                <p className="text-small text-text-muted">
                  {ofullstandiga === 1
                    ? 'Ett villkor saknar valet av vad som räknas (Räknas som) och används inte.'
                    : `${ofullstandiga} villkor saknar valet av vad som räknas (Räknas som) och används inte.`}
                </p>
              ) : !harRegel ? (
                <p className="text-small text-text-muted">
                  Bygg minst ett villkor ovan, så visas segmentet här.
                </p>
              ) : (
                <>
                  {/* Brödtextgrad, bara antalet bär vikt — samma beslut som
                    mallvyns steg 3 (Marcus 2026-08-16). */}
                  <p className="text-body">{predikatKlartext(pred)}</p>
                  {isFetching ? (
                    <p className="mm-laddtext text-small text-text-muted">Räknar personer…</p>
                  ) : isError ? (
                    <MessageBox intent="error" title="Kunde inte räkna antal">
                      {error instanceof Error ? error.message : 'Inget felmeddelande angavs.'}
                    </MessageBox>
                  ) : antal === undefined ? (
                    // Regeln är ofullständig — det enda skälet till att ett tal
                    // saknas är att det inte FINNS något att räkna ännu.
                    <p className="text-small text-text-muted">
                      Antalet visas när regeln är komplett.
                    </p>
                  ) : (
                    <>
                      {/* Fälla #34: noll är neutralt, aldrig ett fel. */}
                      <p className="text-body">
                        <strong className="font-semibold text-xl tabular-nums">{antal}</strong>{' '}
                        {antal === 0
                          ? 'personer ännu.'
                          : `${personform(antal)} i det här segmentet.`}
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
            {/* RÄKNA-KNAPPEN ÄR RIVEN (Marcus 2026-08-10): cache-nyckeln på
              regelns signatur bär hamrings-skyddet, spärren lade bara ett
              klick mellan Lotta och svaret. EXPANSIONS-NOTEN ÄR RIVEN UR
              SYNLIG TEXT (Marcus 2026-08-16): mekaniken bor i filhuvudets
              EF-krav — servern måste skarpt äga både uppslaget och snittet
              (segment-membership.ts § AND-PRIMITIVEN). */}

            {harRegel && (
              <>
                <Input
                  label="Namn på segmentet"
                  value={namn}
                  onChange={setNamn}
                  placeholder="t.ex. RIM - alla utbildningsnivåer"
                  isRequired
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    intent="primary"
                    isDisabled={!harRegel || namn.trim() === ''}
                    onPress={() => {
                      setSparNot(true);
                      onSpara(namn.trim(), pred);
                    }}
                  >
                    Spara segmentet
                  </Button>
                  {/* [TASK-259] "Ge segmentet ett namn först." ÄR RIVEN
                      (Marcus QA-fynd 2026-08-17). Raden dök upp bredvid en
                      redan inaktiverad Spara-knapp och sa samma sak en andra
                      gång: namnfältet ovanför är `isRequired` och bär redan
                      märkningen, och knappens `isDisabled` bär spärren.
                      Tredubbelt besked om ett tomt fält läser som en
                      tillrättavisning, inte som hjälp. */}
                  <Button intent="secondary" onPress={onTillbaka}>
                    Avbryt
                  </Button>
                </div>
              </>
            )}
          </StegSektion>

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
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * "DELA UPP I GRUPPER" — partition-generatorns egna yta
 * ================================================================== */

/** Generatorns laddtext. Egen konstant eftersom steg 3:s enda live-region
 *  bär FYRA lägen i samma nod (se `steg3Text`): laddvågen måste kunna
 *  frågas efter i renderingen utan att villkorskedjan skrivs av en andra
 *  gång — två kopior av samma villkor glider isär, en konstant kan inte. */
const RAKNAR_GRUPPERNA = 'Räknar grupperna…';

/**
 * Ett tal per icke-tom delmängd av de valda kurserna. Räknat lokalt ur K
 * medlemssvar (ett per vald kurs-atom) via en bitmask per person: `bit i` =
 * "gick kurs i". Två personer med SAMMA bitmask hör till SAMMA exakta grupp,
 * så en grupps storlek är helt enkelt antalet personer med den gruppens
 * bitmask — `K` frågor räcker för `2^K - 1` kombinationer, ingen fråga per
 * kombination. Samma exakt-kombination-semantik som `byggGrupp`, bara räknad
 * i stället för byggd till ett predikat.
 */
function raknaKombinationer(
  atomer: KursAtom[],
  svar: readonly (Medlemssvar | undefined)[],
): { mask: number; namn: string; antal: number }[] {
  const bitmaskPerPerson = new Map<string, number>();
  atomer.forEach((_, i) => {
    for (const m of svar[i]?.members ?? []) {
      bitmaskPerPerson.set(m.id, (bitmaskPerPerson.get(m.id) ?? 0) | (1 << i));
    }
  });
  const antalPerMask = new Map<number, number>();
  for (const mask of bitmaskPerPerson.values()) {
    antalPerMask.set(mask, (antalPerMask.get(mask) ?? 0) + 1);
  }
  const rader: { mask: number; namn: string; antal: number }[] = [];
  for (let mask = 1; mask < 1 << atomer.length; mask += 1) {
    const namn = atomer
      .filter((_, i) => (mask & (1 << i)) !== 0)
      .map((a) => a.etikett)
      .join(' + ');
    rader.push({ mask, namn, antal: antalPerMask.get(mask) ?? 0 });
  }
  // Största gruppen (flest kurser i kombinationen) sist, ren för att den mest
  // sammansatta - och sannolikt minsta - gruppen inte ska konkurrera om
  // uppmärksamheten med de enkla korten längst upp.
  return rader.sort(
    (a, b) => popcount(a.mask) - popcount(b.mask) || a.namn.localeCompare(b.namn, 'sv'),
  );
}

function popcount(mask: number): number {
  let n = 0;
  let m = mask;
  while (m > 0) {
    n += m & 1;
    m >>= 1;
  }
  return n;
}

/* STEGSEKTIONEN BOR NU I `primitives/StegSektion.tsx` (S107 QA-vandringen,
   Marcus steg 5). Formen föddes här, men Dokument-ytans uppladdningsflöde
   ska bära exakt samma steg-grammatik — och en delad FORM måste delas som
   KOD, inte som en kopierad beskrivning (samma lärdom `HandlingsRad` bär).
   Komponenten är oförändrad in i minsta klassnamn; `segment-promoverings-
   grind.spec.ts` är beviset för att renderingen står still genom lyftet. */

/**
 * PARTITION-GENERATORN SOM EGEN YTA (S104 Del 3, beslut "partition som
 * generator"). Samma verkstads-princip som `RegelVerkstad`: den kostar klick
 * och tar plats, men bor inte på samma skärm som listan.
 *
 * ORDNINGEN ÄR AVSIKTLIG: modaliteten väljs FÖRST, kurserna härleds sedan ur
 * den (`harledKursAtomer`) — så en atom-chip betyder alltid "den här kursen,
 * räknad som den modalitet du redan valt", aldrig en tyst gissning.
 *
 * TRE SYNLIGA STEG (varv 2). Formen före detta varv öppnade med en ensam
 * radiogrupp och en död "Skapa 0 segment"-knapp; utbildningsvalet och
 * förhandsvisningen dök upp stegvis utan förvarning. Nu står alla tre stegen
 * på sidan från mount — de som väntar med en ledtext — och knappen bär ett
 * tal först när talet betyder något.
 */
function DelaUppIGrupper({
  parInfo,
  onTillbaka,
  onSkapa,
}: {
  parInfo: ParInfo[];
  onTillbaka: () => void;
  onSkapa: (entiteter: SegmentEntitet[]) => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, true);
  const dataSource = useDataSource();

  const [modalitet, setModalitet] = useState<ModalitetsVal | null>(null);
  const [valda, setValda] = useState<ReadonlySet<string>>(() => new Set());

  const atomer = useMemo(
    () => (modalitet === null ? [] : harledKursAtomer(parInfo, modalitet)),
    [parInfo, modalitet],
  );
  // En atom som försvinner (modaliteten byttes) kan inte förbli vald - annars
  // hade en osynlig kurs kunnat räknas in i förhandsvisningen utan att synas
  // i chip-raden.
  useEffect(() => {
    setValda((s) => {
      const kvar = new Set([...s].filter((k) => atomer.some((a) => a.nyckel === k)));
      return kvar.size === s.size ? s : kvar;
    });
  }, [atomer]);

  const valdaAtomer = useMemo(() => atomer.filter((a) => valda.has(a.nyckel)), [atomer, valda]);
  const visaForhandsvisning = modalitet !== null && valdaAtomer.length >= 2;

  // K FRÅGOR, EN PER VALD ATOM — samma cache-fabrik (`medlemsFraga`) och
  // därmed samma signatur-cache som resten av varianten: ett villkor som
  // redan ställts av ett sparat segment eller en annan vy kostar noll här.
  // Regellistan är MINNAD (`usePredikatMedlemmar`s mönster) - annars räknar
  // `nyttVillkor()`s globala id-räknare om sig på varenda oberoende render.
  const regler = useMemo(
    () =>
      modalitet === null
        ? []
        : valdaAtomer.map((a) => villkorsRegel(villkorForAtom(a, modalitet), parInfo)),
    [valdaAtomer, modalitet, parInfo],
  );
  const svar = useQueries({
    queries: regler.map((r) => ({ ...medlemsFraga(dataSource, r), enabled: visaForhandsvisning })),
  });
  const allaSvarat = svar.every((s) => s.data !== undefined);
  const nagotFel = svar.some((s) => s.isError);

  // INGEN `useMemo` HÄR MED FLIT: `svar` (useQueries) är en ny array varje
  // render, så en minnesfunktion hade antingen räknat om varje gång ändå
  // (deps = `svar`) eller riskerat ett inaktuellt resultat (deps utan
  // `svar`). Beräkningen är billig - bitmaskräkning över K korta
  // medlemslistor, inte en walk - så priset för att alltid räkna om är noll.
  const kombinationer =
    visaForhandsvisning && allaSvarat
      ? raknaKombinationer(
          valdaAtomer,
          svar.map((s) => s.data),
        )
      : [];
  const befolkade = kombinationer.filter((k) => k.antal > 0);
  const kanSkapa = visaForhandsvisning && allaSvarat && !nagotFel && befolkade.length > 0;

  /* TÄCKNINGEN ÄR EN REN SUMMA, INTE EN UPPSKATTNING. Varje person bär exakt
     EN bitmask (`raknaKombinationer` slår ihop personens alla atom-träffar
     till ett tal per person-id), så en person kan omöjligt räknas i två
     kombinationer — summan över de befolkade är därför antalet UNIKA personer
     som hamnar i någon grupp. Den som inte gått någon av de valda
     utbildningarna har mask 0 och finns inte i räkningen alls; det är också
     rätt, för hen får inget av de här mailen. */
  const tackta = befolkade.reduce((summa, k) => summa + k.antal, 0);
  const tomma = kombinationer.length - befolkade.length;

  /* STEG 3:s ENDA LIVE-REGION bär hela stegets tillstånd — vilande, räknande,
     mätt-men-tomt eller klart — i stället för att varje läge monterar sin egen
     rad. Skälet står i `SegmentKort` (antal-raden): en `aria-live` som monteras
     SAMTIDIGT som sin text annonseras inte, så regionen måste finnas hela
     tiden och bara byta innehåll. Den gamla formen monterade sin summering
     inuti `allaSvarat`-grenen och led av precis det felet. */
  const steg3Text =
    modalitet === null
      ? 'Välj först vilka som räknas med.'
      : valdaAtomer.length < 2
        ? 'Välj minst två utbildningar, så visas grupperna här.'
        : nagotFel
          ? ''
          : !allaSvarat
            ? RAKNAR_GRUPPERNA
            : befolkade.length === 0
              ? 'Ingen har någon av de här kombinationerna än.'
              : // "N personer täcks" var samma systemord som listans kontrolläge
                // rensade bort (Marcus 2026-08-16) - och dessutom passivt om en
                // handling Lotta utför. "får en grupp" säger vad som händer med
                // personerna, i samma riktning som resten av meningen.
                `${befolkade.length} ${befolkade.length === 1 ? 'grupp skapas' : 'grupper skapas'} · ${tackta} ${personform(tackta)} får en grupp`;

  function skapa() {
    if (!kanSkapa || modalitet === null) return;
    const nu = Date.now();
    const entiteter = befolkade.map((k) => {
      const ivaldaIGrupp = valdaAtomer.filter((_, i) => (k.mask & (1 << i)) !== 0);
      return byggGrupp(valdaAtomer, ivaldaIGrupp, modalitet, k.namn, `gen-${nu}-${k.mask}`);
    });
    onSkapa(entiteter);
  }

  return (
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets `SidRamKnapp` ersätter den lokala
          `SidRam`-kopian — samma geometri, delad `CHEVRON_KLASS`. */}
      <SidRamKnapp tillbakaEtikett="Tillbaka till segmenten" onTillbaka={onTillbaka} />
      {/* [TASK-249.1] `data-testid="generatorn"` (ADR-103 B4) — `gap-6`
          speglar den omslutande sektionens klass. Omsluter BÅDA de befintliga
          topp-nivå-divarna (stegkorten + Avbryt-raden, redan syskon till
          varandra). `PrototypNot`, som låg i en egen syskon-div sist just
          för att hållas utanför scopet, är riven (TASK-259). Riggarna
          förekom aldrig i denna vy (och är rivna sedan TASK-249.6). */}
      <div data-testid="generatorn" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
            Dela upp i grupper
          </h1>
          {/* INGRESSEN SÄGER NYTTAN, INTE PARTITIONEN (Marcus 2026-08-16).
            Den gamla underrubriken beskrev matematiken - "EXAKT en grupp ...
            precis hens egen kombination" - vilket är sant men svarar på en
            fråga Lotta inte ställt. Den som står här undrar varför hon skulle
            vilja dela upp någonting alls; löftet "ett mail per person" är
            svaret, och det bär partitionens garanti på köpet. */}
          <p className="text-small text-text-muted">
            Vill du skriva olika mail till olika delar av publiken? Här delas den upp åt dig: var
            och en hamnar i exakt en grupp och får exakt ett mail.
          </p>
        </header>

        <div className="flex flex-col gap-4 px-4">
          {/* SAMMA FORM + SÄKERHETSMOTIVERING SOM `VillkorsKort`. Ingen
            röd/ogiltig-styling här: till skillnad från ett villkor mitt i
            byggnad finns det inget FÖRE modaliteten att röra vid - så det
            "orörda" läget varar hela tiden fram till första valet, och en röd
            ram hade skällt på någon som ännu inte gjort något. */}
          <StegSektion nummer={1} rubrik="Vilka räknas med?">
            {/* ETIKETTERNA BÄR SUBJEKT (varv 2). "Utbildning"/"Föreläsning"
                namngav formatet på ett event; frågan steget ställer handlar om
                PERSONER. De interna värdena är oförändrade `ModalitetsVal` -
                bara orden på skärmen är nya.

                VERTIKALA VALRADER (varv 5, Marcus 2026-08-16: "Blev inte så
                bra med togglen. … rada upp alternativen i steg 1 vertikalt
                … grå bakgrund"). Knappgruppen (varv 3) och dess
                naturlig-bredd-form (varv 4) är rivna - historiken bor i git.
                Formen nu: appens `RadioGroup`/`Radio`-primitiv (samma som
                regelverkstadens "Räknas som"), vertikal default-orientering,
                varje alternativ som en full-bredds valrad i listpostens
                grammatik (`rounded-xl bg-bg-muted px-4 py-2.5` - samma yta
                som steg 3:s förhandsvisningsposter, så de två stegen läser
                som samma familj). Vald rad markeras med kant i `--mm-text`
                UTÖVER indikatorpricken - kanten är förstärkning, aldrig enda
                bäraren (WCAG 1.4.1).

                KONTROLLERAD, till skillnad från togglens okontrollerade läge:
                `RadioGroup` tar `value={modalitet}` där `null` är "inget
                valt" - react-arias RadioGroup är null-medveten, så någon
                okontrollerad→kontrollerad-växling (togglens mätta fälla)
                existerar inte här. Radiosemantiken ger enval + inget avval
                gratis. */}
            {/* SÄKERHETSFÖRKLARINGEN ÄR BORTTAGEN, INTE BORTGLÖMD (Marcus
              2026-08-16, varv 4, ordagrant: "Ta bort 'Det finns material som
              är direkt...'"). Stycket ("Det finns material som är direkt
              olämpligt att skicka till någon som bara gått en föreläsning
              …") stod i BÅDA lägena - före och efter valet - och är ute i
              båda. Stegrubriken "Vilka räknas med?" ställer frågan; svaret
              behöver ingen brasklapp under sig. */}
            <RadioGroup
              label="Räknas med"
              hideLabel
              value={modalitet}
              onChange={(v) => setModalitet(v as ModalitetsVal)}
            >
              <Radio
                value="Utbildning"
                className="w-full rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
              >
                De som gått utbildningar
              </Radio>
              <Radio
                value="Föreläsning"
                className="w-full rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
              >
                De som varit på föreläsningar
              </Radio>
              <Radio
                value="Båda"
                className="w-full rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong"
              >
                Båda
              </Radio>
            </RadioGroup>
          </StegSektion>

          <StegSektion
            nummer={2}
            rubrik="Vilka utbildningar ska publiken delas upp efter?"
            vilar={modalitet === null ? 'Välj först vilka som räknas med.' : undefined}
          >
            <div className="flex flex-col gap-2">
              <ChipRad etikett="Utbildningar" doldEtikett>
                {atomer.length === 0 ? (
                  <p className="text-small text-text-muted">
                    Inga utbildningar i basen matchar det valet.
                  </p>
                ) : (
                  atomer.map((a) => (
                    <ValChip
                      key={a.nyckel}
                      vald={valda.has(a.nyckel)}
                      onTryck={() =>
                        setValda((s) => {
                          const ny = new Set(s);
                          if (ny.has(a.nyckel)) ny.delete(a.nyckel);
                          else ny.add(a.nyckel);
                          return ny;
                        })
                      }
                    >
                      {a.etikett}
                    </ValChip>
                  ))
                )}
              </ChipRad>
              {valdaAtomer.length === 1 && (
                <p className="text-small text-text-muted">
                  Välj minst två utbildningar för att dela upp - en ensam utbildning är redan sin
                  egen grupp.
                </p>
              )}
            </div>
          </StegSektion>

          <StegSektion
            nummer={3}
            rubrik="Det här blir grupperna"
            dampad={modalitet === null || valdaAtomer.length < 2}
          >
            {/* [TASK-259] Laddvågen sätts på NODEN, villkorad av att raden
                just nu ÄR laddtexten. Jämförelsen går mot samma konstant
                kedjan ovan skriver, aldrig mot en kopia av dess villkor —
                det är den enda formen som inte kan glida isär. */}
            <p
              aria-live="polite"
              className={
                steg3Text === RAKNAR_GRUPPERNA
                  ? 'mm-laddtext text-small text-text-muted'
                  : 'text-small text-text-muted'
              }
            >
              {steg3Text}
            </p>
            {nagotFel ? (
              <MessageBox intent="error" title="Kunde inte räkna grupperna">
                Försök igen, eller välj färre utbildningar.
              </MessageBox>
            ) : visaForhandsvisning && !allaSvarat ? (
              /* Skeletonen är REN DEKOR här - live-regionen ovan säger redan
               "Räknar grupperna…", så en egen `role="status"` med sr-only-text
               hade annonserat samma sak två gånger. */
              <div aria-hidden="true" className="flex flex-col gap-2 pt-1">
                {['a', 'b', 'c'].map((k) => (
                  <Skeleton key={k} variant="text" className="w-2/3 text-body" />
                ))}
              </div>
            ) : modalitet !== null && kanSkapa ? (
              <>
                {/* EN RAD PER GRUPP SOM FAKTISKT BLIR AV — ett MINI-SEGMENTKORT,
                  för det är precis vad raden är: den blir ett kort i listan när
                  man trycker på knappen nedanför. Anatomin är listpostens (namn,
                  meningen dämpad under, talet höger) i publikradens nedskalade
                  mått (`rounded-xl bg-bg-muted px-4 py-2.5`, `font-medium`) —
                  en förhandsvisning ska likna resultatet utan att konkurrera
                  med det, och den ligger dessutom INUTI steg 3:s vita
                  behållare, där den tonala fyllningen är det som gör den synlig.

                  Meningen kommer ur `manniskoMening` - EXAKT samma formulerare
                  som `byggGrupp` kör när gruppen skapas, med samma två
                  argument. Förhandsvisningen kan därför inte säga en annan sak
                  än kortet kommer säga: de delar formulerare precis som de
                  sedan tidigare delar predikat-kodväg (`villkorForAtom`). */}
                <ul className="flex flex-col gap-2">
                  {befolkade.map((k) => {
                    const ivaldaIGrupp = valdaAtomer.filter((_, i) => (k.mask & (1 << i)) !== 0);
                    const utanfor = valdaAtomer.filter((_, i) => (k.mask & (1 << i)) === 0);
                    return (
                      <li
                        key={k.mask}
                        className="flex items-start justify-between gap-3 rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 contrast-more:border-border-strong"
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-medium text-body">{k.namn}</span>
                          <span className="text-small text-text-secondary">
                            {manniskoMening(ivaldaIGrupp, utanfor, modalitet)}
                          </span>
                        </span>
                        <span className="shrink-0 text-small tabular-nums">
                          {k.antal} {personform(k.antal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {/* DE TOMMA KOMBINATIONERNA ÄR EN RAD, INTE N RADER (varv 2).
                  Förut fick varje obefolkad kombination ett eget listobjekt med
                  texten "utelämnas (0 personer)" - vid fyra valda utbildningar
                  är det upp till elva rader som beskriver vad som INTE händer,
                  placerade mellan de rader som beskriver vad som händer.

                  NAMNEN STÅR UT BARA NÄR DE ÄR EN. Då är namnet gratis och gör
                  raden konkret. Vid flera är antalet den enda signal som bär
                  något ("det blir färre grupper än max - väntat"): vilka de är
                  går att räkna ut ur listan ovanför, och en utfällning med
                  elva namn hade konkurrerat med grupperna om uppmärksamheten
                  för att beskriva frånvaro. Utfällningen är därför medvetet
                  bortvald, inte förbisedd. */}
                {tomma > 0 && (
                  <p className="text-small text-text-muted">
                    {tomma === 1
                      ? `1 kombination finns inte i publiken än och skapas inte: ${kombinationer.find((k) => k.antal === 0)?.namn ?? ''}.`
                      : `${tomma} kombinationer finns inte i publiken än och skapas inte.`}
                  </p>
                )}
              </>
            ) : null}

            {/* HANDLINGEN BOR I STEGET (varv 3). Knappen stod förut i sidfoten
              bredvid "Avbryt" - två knappar i rad, den ena en verkställande
              handling på steg 3:s innehåll, den andra en flykt från hela
              sidan. Den listan man just läst ("Det här blir grupperna") och
              knappen som gör den verklig hör ihop; att lämna sidan gör de
              inte. Kortet är därför handlingens hem, sidfoten flyktens.

              TALET STÅR I KNAPPEN BARA NÄR DET BETYDER NÅGOT. "Skapa 0
              segment" var sidans första möte i den gamla formen: ett löfte om
              noll, på en knapp som inte gick att trycka på. Utan tal är
              knappen ärlig i väntläget, och talet dyker upp i samma sekund som
              det finns grupper att skapa. */}
            <div className="flex pt-1">
              <Button intent="primary" isDisabled={!kanSkapa} onPress={skapa}>
                {befolkade.length > 0 ? `Skapa ${befolkade.length} segment` : 'Skapa segmenten'}
              </Button>
            </div>
          </StegSektion>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button intent="secondary" onPress={onTillbaka}>
              Avbryt
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * NYTT SEGMENT — mall-lagret (S104 varv 6, Marcus GO 2026-08-16)
 * ================================================================== */

type MallVag = 'nagon' | 'menInte' | 'exakt';

/**
 * MALL-LAGRET FRAMFÖR BYGGAREN — branschmönstret, inte en egen idé.
 * Research-passet (docs/research/segment-byggare-branschmonster-2026-08-16.md)
 * fann att samtliga 8 undersökta produkter bär en teknisk villkorsbyggare i
 * botten och att de bästa (Mailchimp Pre-Built Segments tydligast) lägger
 * namngivna mallar som PRIMÄR ingång, med byggaren som avancerat läge —
 * ingen av de 8 ersätter byggaren med mallar, så vår `RegelVerkstad` står
 * kvar och nås via "Bygg med egna villkor". UX-forskningen (Hearst kap. 4,
 * Nielsen) mäter varför mallarna behövs: rå boolesk logik missförstås även
 * av vana användare. Lotta ska aldrig se en operator — hon väljer en mening.
 *
 * TRE VÄGAR täcker domänens verkliga segmentklasser (4 utbildningar ×
 * modalitet): "minst en av" (bred), "dessa men inte de här" (snäv) och
 * "exakt kombinationen" (`byggGrupp`-motorn — samma som de fjorton).
 * Predikatet genereras UR VALET; människomeningen är kvittot, i samma
 * meningsfamilj som gruppkorten (`manniskoMening`).
 *
 * SAMMA STEGFORM SOM "DELA UPP I GRUPPER" (StegSektion, valrader, chips):
 * appens två skapandevägar är syskon och ska läsa som det. Steg 1 är
 * ordagrant generatorns steg 1.
 */
function malMening(
  vag: MallVag,
  valdaA: KursAtom[],
  valdaB: KursAtom[],
  alla: KursAtom[],
  modalitet: ModalitetsVal,
): string {
  // VERBET BÄR FORMEN (textinventeringen 2026-08-16, samma princip som
  // `villkorKlartext`): "Har gått" ÄR utbildning, föreläsning får sitt eget
  // verb, och bara "Båda" bär en slutmening — där är den inte redundant.
  const A = valdaA.map((a) => a.etikett);
  if (vag === 'exakt') {
    const ivaldaNycklar = new Set(valdaA.map((a) => a.nyckel));
    return manniskoMening(
      valdaA,
      alla.filter((a) => !ivaldaNycklar.has(a.nyckel)),
      modalitet,
    );
  }
  const verb = (namn: string) =>
    modalitet === 'Utbildning'
      ? `Har gått ${namn}`
      : modalitet === 'Föreläsning'
        ? `Har varit på en föreläsning i ${namn}`
        : `Har deltagit i ${namn}`;
  const slut = modalitet === 'Båda' ? ' Räknat som utbildning eller föreläsning.' : '';
  if (vag === 'menInte') {
    const B = valdaB.map((a) => a.etikett);
    return `${verb(`${A.length === 2 ? 'både ' : ''}${listaOrd(A, 'och')}`)} - men inte ${listaOrd(B, 'eller')}.${slut}`;
  }
  return A.length === 1
    ? `${verb(A[0] ?? '')}.${slut}`
    : `${verb(`minst en av ${listaOrd(A, 'och')}`)}.${slut}`;
}

/** Namnförslaget ur valet — redigerbart, aldrig ett krav. */
function malNamnForslag(vag: MallVag, valdaA: KursAtom[], valdaB: KursAtom[]): string {
  const A = valdaA.map((a) => a.etikett);
  if (vag === 'exakt') return A.join(' + ');
  if (vag === 'menInte')
    return `${listaOrd(A, 'och')} utan ${listaOrd(
      valdaB.map((a) => a.etikett),
      'och',
    )}`;
  return listaOrd(A, 'eller');
}

function NyttSegmentVy({
  parInfo,
  onSkapa,
  onAvancerat,
  onTillbaka,
}: {
  parInfo: ParInfo[];
  onSkapa: (entitet: SegmentEntitet) => void;
  /** Öppnar RegelVerkstad — med mallvalets predikat som utgångsläge när ett finns. */
  onAvancerat: (predikat: Predikat | null, namn: string) => void;
  onTillbaka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);
  useVyFokus(rubrikRef, true);
  const [modalitet, setModalitet] = useState<ModalitetsVal | null>(null);
  const [vag, setVag] = useState<MallVag | null>(null);
  const [valdaA, setValdaA] = useState<ReadonlySet<string>>(() => new Set());
  const [valdaB, setValdaB] = useState<ReadonlySet<string>>(() => new Set());
  const [namn, setNamn] = useState('');
  const [namnRedigerat, setNamnRedigerat] = useState(false);

  const atomer = useMemo(
    () => (modalitet === null ? [] : harledKursAtomer(parInfo, modalitet)),
    [parInfo, modalitet],
  );
  // Samma vakt som generatorn: en atom som försvinner vid modalitetsbyte får
  // inte förbli vald osynligt.
  useEffect(() => {
    const kvar = (s: ReadonlySet<string>) =>
      new Set([...s].filter((k) => atomer.some((a) => a.nyckel === k)));
    setValdaA((s) => {
      const ny = kvar(s);
      return ny.size === s.size ? s : ny;
    });
    setValdaB((s) => {
      const ny = kvar(s);
      return ny.size === s.size ? s : ny;
    });
  }, [atomer]);

  const atomerA = useMemo(() => atomer.filter((a) => valdaA.has(a.nyckel)), [atomer, valdaA]);
  const atomerB = useMemo(() => atomer.filter((a) => valdaB.has(a.nyckel)), [atomer, valdaB]);

  const komplett =
    modalitet !== null &&
    vag !== null &&
    atomerA.length > 0 &&
    (vag !== 'menInte' || atomerB.length > 0);

  /* PREDIKATET GENERERAS UR VALET — Lotta ser aldrig strukturen, bara
     meningen. "nagon" = en konjunktgrupp PER atom (grupper är ELLER);
     "menInte" = EN grupp av alla A (OCH) + B i utan; "exakt" = byggGrupps
     form (alla valda + allt annat uteslutet). */
  const pred = useMemo<Predikat | null>(() => {
    if (!komplett || modalitet === null || vag === null) return null;
    if (vag === 'nagon')
      return {
        med: atomerA.map((a) => nyKonjunkt([villkorForAtom(a, modalitet)])),
        utan: [],
      };
    if (vag === 'menInte')
      return {
        med: [nyKonjunkt(atomerA.map((a) => villkorForAtom(a, modalitet)))],
        utan: atomerB.map((a) => villkorForAtom(a, modalitet)),
      };
    const ivaldaNycklar = new Set(atomerA.map((a) => a.nyckel));
    return {
      med: [nyKonjunkt(atomerA.map((a) => villkorForAtom(a, modalitet)))],
      utan: atomer
        .filter((a) => !ivaldaNycklar.has(a.nyckel))
        .map((a) => villkorForAtom(a, modalitet)),
    };
  }, [komplett, modalitet, vag, atomerA, atomerB, atomer]);

  const mening =
    komplett && modalitet !== null && vag !== null
      ? malMening(vag, atomerA, atomerB, atomer, modalitet)
      : null;
  const { data, isFetching, isError } = usePredikatMedlemmar(pred, null, parInfo, pred !== null);
  const antal = data?.count;

  // Namnförslaget följer valet tills Lotta själv rört fältet — därefter är
  // hennes text helig (samma princip som höjdlåset: datan får inte svika).
  useEffect(() => {
    if (namnRedigerat || vag === null) return;
    setNamn(komplett ? malNamnForslag(vag, atomerA, atomerB) : '');
  }, [namnRedigerat, vag, komplett, atomerA, atomerB]);

  const kanSkapa = komplett && pred !== null && namn.trim() !== '';

  function skapa() {
    if (!kanSkapa || pred === null || mening === null) return;
    onSkapa({
      id: `nytt-${Date.now()}`,
      namn: namn.trim(),
      predikat: pred,
      arvdRegel: null,
      skiss: true,
      beskrivning: mening,
    });
  }

  // VÄGETIKETTERNA FÖLJER MODALITETEN (textinventeringen 2026-08-16):
  // "Alla som gått … utbildningarna" var fel mening när man valt
  // föreläsningar — samma dubbelmacke-klass som villkorsmeningarna.
  const VAGAR: { id: MallVag; etikett: string }[] = [
    {
      id: 'nagon',
      etikett:
        modalitet === 'Föreläsning'
          ? 'Alla som varit på minst en av föreläsningarna'
          : modalitet === 'Båda'
            ? 'Alla som deltagit i minst en av dem'
            : 'Alla som gått minst en av utbildningarna',
    },
    {
      id: 'menInte',
      etikett:
        modalitet === 'Föreläsning'
          ? 'Varit på vissa - men inte andra'
          : modalitet === 'Båda'
            ? 'Deltagit i vissa - men inte andra'
            : 'Har gått vissa - men inte andra',
    },
    { id: 'exakt', etikett: 'Exakt den här kombinationen' },
  ];
  const VALRAD_KLASS =
    'w-full rounded-xl border border-transparent bg-bg-muted px-4 py-2.5 data-[selected]:border-(--mm-text) contrast-more:border-border-strong';

  const chipsFor = (
    valda: ReadonlySet<string>,
    satt: (fn: (s: ReadonlySet<string>) => ReadonlySet<string>) => void,
    filtreraBort?: ReadonlySet<string>,
  ) =>
    atomer
      .filter((a) => !filtreraBort?.has(a.nyckel))
      .map((a) => (
        <ValChip
          key={a.nyckel}
          vald={valda.has(a.nyckel)}
          onTryck={() =>
            satt((s) => {
              const ny = new Set(s);
              if (ny.has(a.nyckel)) ny.delete(a.nyckel);
              else ny.add(a.nyckel);
              return ny;
            })
          }
        >
          {a.etikett}
        </ValChip>
      ));

  return (
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets `SidRamKnapp` ersätter den lokala
          `SidRam`-kopian — samma geometri, delad `CHEVRON_KLASS`. */}
      <SidRamKnapp tillbakaEtikett="Tillbaka till segmenten" onTillbaka={onTillbaka} />
      {/* [TASK-249.1] `data-testid="nytt-segment-mallvyn"` (ADR-103 B4) —
          `gap-6` speglar den omslutande sektionens klass. `PrototypNot`, som
          stod sist i funktionen som egen syskon-div utanför scopet, är
          riven (TASK-259). Riggarna förekom aldrig i denna vy (och är
          rivna sedan TASK-249.6). */}
      <div data-testid="nytt-segment-mallvyn" className="flex flex-col gap-6">
        <header className="flex flex-col gap-1.5 border-border border-b px-4 pb-5">
          <h1 ref={rubrikRef} tabIndex={-1} className="font-semibold text-3xl">
            Nytt segment
          </h1>
          <p className="text-small text-text-muted">
            Välj vilka som ska ingå - antalet räknas medan du väljer.
          </p>
        </header>

        <div className="flex flex-col gap-4 px-4">
          <StegSektion nummer={1} rubrik="Vilka räknas med?">
            <RadioGroup
              label="Räknas med"
              hideLabel
              value={modalitet}
              onChange={(v) => setModalitet(v as ModalitetsVal)}
            >
              <Radio value="Utbildning" className={VALRAD_KLASS}>
                De som gått utbildningar
              </Radio>
              <Radio value="Föreläsning" className={VALRAD_KLASS}>
                De som varit på föreläsningar
              </Radio>
              <Radio value="Båda" className={VALRAD_KLASS}>
                Båda
              </Radio>
            </RadioGroup>
          </StegSektion>

          <StegSektion
            nummer={2}
            rubrik="Vilka ska ingå?"
            vilar={modalitet === null ? 'Välj först vilka som räknas med.' : undefined}
          >
            <RadioGroup
              label="Vad ska segmentet innehålla"
              hideLabel
              value={vag}
              onChange={(v) => setVag(v as MallVag)}
            >
              {VAGAR.map((v) => (
                <Radio key={v.id} value={v.id} className={VALRAD_KLASS}>
                  {v.etikett}
                </Radio>
              ))}
            </RadioGroup>

            {vag !== null &&
              (vag === 'menInte' ? (
                <div className="flex flex-col gap-3">
                  <ChipRad
                    etikett={
                      modalitet === 'Föreläsning'
                        ? 'Varit på'
                        : modalitet === 'Båda'
                          ? 'Deltagit i'
                          : 'Har gått'
                    }
                  >
                    {chipsFor(valdaA, setValdaA, valdaB)}
                  </ChipRad>
                  <ChipRad etikett="Men inte">{chipsFor(valdaB, setValdaB, valdaA)}</ChipRad>
                </div>
              ) : (
                <ChipRad etikett="Utbildningar" doldEtikett>
                  {chipsFor(valdaA, setValdaA)}
                </ChipRad>
              ))}
          </StegSektion>

          <StegSektion nummer={3} rubrik="Det här blir segmentet" dampad={!komplett}>
            {/* Live-regionen är monterad från mount och byter bara innehåll —
              samma disciplin som generatorns steg 3. */}
            <div aria-live="polite" aria-busy={isFetching} className="flex flex-col gap-1">
              {!komplett ? (
                <p className="text-small text-text-muted">
                  {vag === 'menInte' && atomerA.length > 0
                    ? 'Välj också vilka som inte ska ingå.'
                    : 'Gör valen ovan, så visas segmentet här.'}
                </p>
              ) : (
                <>
                  {/* Brödtextstorlek, inte plakat (Marcus 2026-08-16): meningen
                    läser som text, bara ANTALET får bära vikt och ett steg
                    större grad. */}
                  <p className="text-body">{mening}</p>
                  {isFetching ? (
                    <p className="mm-laddtext text-small text-text-muted">Räknar personer…</p>
                  ) : isError ? (
                    <p className="text-small text-text-muted">Antalet kunde inte räknas.</p>
                  ) : antal !== undefined ? (
                    <p className="text-body">
                      <strong className="font-semibold text-xl tabular-nums">{antal}</strong>{' '}
                      {personform(antal)} i det här segmentet.
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {komplett && (
              <>
                <Input
                  label="Namn på segmentet"
                  value={namn}
                  onChange={(v) => {
                    setNamn(v);
                    setNamnRedigerat(true);
                  }}
                  isRequired
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button intent="primary" isDisabled={!kanSkapa} onPress={skapa}>
                    Skapa segmentet
                  </Button>
                  <Button intent="secondary" onPress={onTillbaka}>
                    Avbryt
                  </Button>
                </div>
              </>
            )}
          </StegSektion>

          {/* AVANCERAT LÄGE — byggaren står kvar (research: 0 av 8 ersätter den
            med mallar). Lågmäld textknapp i täckningsväxelns grammatik; tar
            mallvalets predikat med sig så finjustering aldrig börjar om. */}
          <div className="flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => onAvancerat(pred, namn.trim())}
              className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-small text-text-secondary hover:bg-bg-emphasized motion-safe:transition-colors"
            >
              <Pencil aria-hidden="true" size={16} className="shrink-0" />
              Bygg med egna villkor
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== *
 * UTSKICKET — eget steg, `a`s inline-grammatik
 * ================================================================== */

type Utfall = {
  accepterade: number;
  utanEpost: number;
  tackatNej: number;
  ejLevererade: number;
  totalt: number;
  /** Vilken publik utfallet gäller — lika många är inte samma personer. */
  signatur: string;
};

/**
 * Utskickets svar byggs fortfarande i webbläsaren: sändningen är NO-OP i den
 * promoverade formen (TASK-249.9 § Observera — den skarpa mutations-wiringen
 * är ett eget, ännu obyggt kort), och AC #1 på TASK-249.5 kräver att formen är
 * IDENTISK med den godkända prototypen.
 *
 * [TASK-249.6] VÄXELN ÖVER UTFALLEN ÄR RIVEN, INTE SIMULERINGEN. `PrototypRigg`
 * lät en utvecklare välja allt/delvis/inget och är exakt en sådan flagga
 * ADR-103 river; delutfallet var dess default och är därmed det beteende varje
 * referens och varje granskning redan speglar. Kvar står alltså den form som
 * godkändes, utan kontrollen som kunde ändra den.
 */
function simulera(mottagare: SegmentMember[], signatur: string): Utfall {
  const utanEpost = mottagare.filter((m) => !m.email).length;
  const tackatNej = mottagare.filter((m) => m.email && m.ejGodkandMail).length;
  const kvar = mottagare.length - utanEpost - tackatNej;
  const accepterade = Math.ceil(kvar * (2 / 3));
  return {
    accepterade,
    utanEpost,
    tackatNej,
    ejLevererade: kvar - accepterade,
    totalt: mottagare.length,
    signatur,
  };
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
 * UNDERLAGET ÄR MOTTAGARNA, RAKT AV. Så länge skalprovet fanns sållades dess
 * påhittade personer bort först — de hade ingen kurshistorik, så en kontroll
 * som räknat dem hade svarat på en fråga om påhittad data. Med riggen riven
 * (TASK-249.6) är varje mottagare verklig och sållningen har inget kvar att
 * göra.
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
  onTillbaka,
}: {
  entiteter: SegmentEntitet[];
  parInfo: ParInfo[];
  onTillbaka: () => void;
}) {
  const rubrikRef = useRef<HTMLHeadingElement>(null);

  // Alla valda segments frågeplaner plattas till EN uppsättning unika frågor
  // på SAMMA cache-nyckel (frågans signatur) som listan och detaljen använder
  // → ett redan räknat segment kostar noll här, och två segment som delar ett
  // VILLKOR delar walk. Speglar EF:ens `resolveSegmentMembers`: en union,
  // dedup på person.
  const { perEntitet, isPending, misslyckade } = useUnionsUtfall(entiteter, parInfo);
  useVyFokus(rubrikRef, !isPending);

  const [amne, setAmne] = useState('');
  const [text, setText] = useState('Hej {förnamn},\n\n\n\nVarmt hälsat\nRoger och Lotta');
  const [bekraftelse, setBekraftelse] = useState('');
  const [lage, setLage] = useState<'granska' | 'skickar' | 'resultat'>('granska');
  const [utfall, setUtfall] = useState<Utfall | null>(null);
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
     delmängd som ser komplett ut är farligare än ett stopp. `misslyckade`
     räknar SEGMENT vars någon fråga felat (hooken ovan). */

  // UNIONEN, som EF:en gör den: dedup på person-ID. Förekomsterna bär
  // överlappet — samma person i två segment får ETT mail.
  const forekomster = new Map<string, number>();
  const unionKarta = new Map<string, SegmentMember>();
  for (const p of perEntitet) {
    for (const m of p.data?.members ?? []) {
      unionKarta.set(m.id, m);
      forekomster.set(m.id, (forekomster.get(m.id) ?? 0) + 1);
    }
  }
  const raMottagare = [...unionKarta.values()];
  const overlapp = [...forekomster.values()].filter((n) => n > 1).length;
  // `summaPerSegment` (summan av segmentens egna tal) föll med noll-fallets rad
  // 2026-08-16 — den enda konsumenten. Det talet står kvar per segment i
  // segment-gruppens rader, så inget mätvärde försvann; bara uppräkningen.

  // [TASK-249.6] Mottagarna ÄR unionen. Skalprovets utfyllnad — som här tog
  // summan av de ingående segmentens mål som tak — är riven med promoveringen
  // (ADR-103). Dedupen ovan (`unionKarta`) är och förblir den enda
  // bearbetningen mellan EF-svaren och mottagarlistan.
  const mottagare = raMottagare;
  const signatur = mottagare.map((m) => m.id).join(',');
  const utanEpost = mottagare.filter((m) => !m.email).length;
  const nekade = mottagare.filter((m) => m.email && m.ejGodkandMail).length;
  /* EXEMPEL-MOTTAGAREN VÄLJS — den råkar inte längre bli `mottagare[0]`.
     Ordningen är EF-svarets, alltså första-förekomst-ordningen i
     `Deltaganden`-walken, och den är namnlös i 62 % av fallen för den grupp
     Marcus råkade lista först (mätt 2026-08-17). Utfallet "som Ej tillgängligt
     får det" var alltså deterministiskt, inte otur.

     ETT NAMNGIVET EXEMPEL ÄR ÄRLIGARE — det visar vad `{förnamn}` faktiskt
     gör. Finns ingen namngiven i publiken finns inget att exemplifiera med,
     och då säger etiketten det i stället för att peka ut en platshållartext
     som om den vore en person. Fallbacken till `mottagare[0]` bär då den
     NAMNLÖSA formen, vilket är exakt vad var och en i publiken får. */
  const namngivetExempel = mottagare.find((m) => aktaNamn(m) !== null);
  const exempel = namngivetExempel ?? mottagare[0];
  const brodtext = fyllPlatshallare(text, exempel);
  const amneVisning = fyllPlatshallare(amne, exempel);
  const ofyllda = [...new Set([...brodtext.ofyllda, ...amneVisning.ofyllda])];

  // Blandningen kan uppstå INUTI ett segment ("Båda") lika gärna som MELLAN
  // två — därför avgörs `kanBlandas` av unionen av de valda reglerna.
  const kanBlandas = entiteter.some((e) =>
    bruttoRegelFor(e, parInfo).include.some((p) => p.modalitet === 'Föreläsning'),
  );
  // [TASK-249.6] Underlaget är hela mottagarmängden. Filtret som stod här höll
  // skalprovets påhittade personer utanför kontrollen — med riggen riven finns
  // ingen påhittad person kvar att sålla bort.
  const fordelning = useModalitetsFordelning(kanBlandas, parInfo, mottagare);
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
      setUtfall(simulera(mottagare, signatur));
      setLage('resultat');
    }, 1100);
  }

  if (lage === 'resultat' && visatUtfall) {
    const u = visatUtfall;
    return (
      <section className="flex flex-col gap-6">
        {/* [TASK-349, ADR-126] Husets `SidRamKnapp` ersätter den lokala
            `SidRam`-kopian — samma geometri, delad `CHEVRON_KLASS`. */}
        <SidRamKnapp tillbakaEtikett={tillbakaEtikett} onTillbaka={onTillbaka} />
        {/* [TASK-249.1] `data-testid="utskicksvyn"` (ADR-103 B4) — DELAS
            med `granska`-lägets gren nedan (mutuellt uteslutande DOM-träd,
            samma mönster som `granskning-yta` i
            `atgardssida-promoverings-grind.spec.ts`). `PrototypNot` stod
            UTANFÖR som egen syskon-nod och är riven (TASK-259);
            `PrototypRigg` (utfallslägena) stod bredvid den och revs redan
            i TASK-249.6 (ADR-103). */}
        <div data-testid="utskicksvyn" className="flex flex-col gap-6">
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
              intent={
                u.accepterade === 0 ? 'warning' : u.accepterade < u.totalt ? 'info' : 'success'
              }
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
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {/* [TASK-349, ADR-126] Husets `SidRamKnapp` ersätter den lokala
          `SidRam`-kopian — samma geometri, delad `CHEVRON_KLASS`. */}
      <SidRamKnapp tillbakaEtikett={tillbakaEtikett} onTillbaka={onTillbaka} />
      {/* [TASK-249.1] `data-testid="utskicksvyn"` — samma testid som
          `resultat`-grenen ovan (mutuellt uteslutande DOM-träd). Se
          docblocket där för fullständig motivering. */}
      <div data-testid="utskicksvyn" className="flex flex-col gap-6">
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
              Utskicket är låst tills alla segment är räknade - annars hade du bekräftat ett antal
              som inte stämmer. Gå tillbaka och försök igen.
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
                  {perEntitet[i]?.fel
                    ? 'fel'
                    : perEntitet[i]?.vantar
                      ? '…'
                      : (perEntitet[i]?.data?.count ?? 0)}
                </span>
              </div>
            ))}
            {/* ÖVERLAPPSRADEN — funktionens hela existensberättigande i formen.
              Utan den är unionens tal något Lotta inte kan kontrollräkna, och
              skillnaden mot summan är exakt den tysta feltyp ett utskick inte
              får bära.

              NOLL-FALLET ÄR RIVET (Marcus 2026-08-16, ordagrant om just den
              strängen). "N platser i segmenten, M unika personer. Ingen finns i
              mer än ett segment." sa Lotta ingenting hon behövde: när ingen
              överlappar ÄR summan antalet, och raden bad henne jämföra två tal
              som är lika. Kvar står bara det som bär en verklig konsekvens.

              PLATS-FÖRLEDET FÖLJDE MED UT även ur överlapps-fallet: "N platser
              i segmenten, M unika personer" var uppräkningen som gjorde raden
              lång, och konsekvensen ("får ETT mail") står starkare ensam.
              Räknefaktan finns kvar per segment i raderna ovanför.

              MISSLYCKANDE-RADEN STÅR KVAR OFÖRÄNDRAD: där är tystnaden farlig -
              ett tal som inte gick att räkna får aldrig se ut som ett tal som
              råkade bli noll. */}
            {(misslyckade > 0 || overlapp > 0) && (
              <div className="py-3">
                <p className="text-small text-text-secondary">
                  {misslyckade > 0
                    ? 'Överlappet kan inte räknas förrän alla segment svarat.'
                    : `${overlapp} ${
                        overlapp === 1 ? 'person finns' : 'personer finns'
                      } i flera segment och får ETT mail.`}
                </p>
              </div>
            )}
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
                Kontrollerat: alla {mottagare.length} mottagare har gått minst en utbildning.
              </p>
            ) : (
              // NÄMNAREN ÄR MOTTAGARNA. Den stod tidigare mot ett eget
              // `fordelningsUnderlag` som sållade bort skalprovets påhittade
              // personer — de hade ingen kurshistorik att kontrollera. Med
              // riggen riven (TASK-249.6) är varje mottagare verklig, och de
              // två mängderna är samma mängd.
              <MessageBox intent="warning" title="Publiken är blandad">
                <p>
                  <strong>
                    {blandade.length} av {mottagare.length}
                  </strong>{' '}
                  mottagare har bara gått föreläsning - ingen utbildning.
                </p>
                <p>
                  Det är tillåtet. Kontrollera bara att innehållet passar dem också innan du
                  skickar.
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
              {ofyllda.join(', ')} står kvar som det är och går ut ordagrant så. Fyll i det för hand
              i texten.
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
            {/* HJÄLPTEXTEN ÄR RIVEN (Marcus 2026-08-16): "Skriv {förnamn} där
              mottagarens förnamn ska stå." Platshållar-MEKANIKEN är orörd -
              `fyllPlatshallare` fyller fortfarande, ofyllda-varningen fäller
              fortfarande, och förhandsvisningen visar fortfarande resultatet
              för en namngiven mottagare. Det som föll var instruktionen under
              fältet, inte funktionen. */}
            <TextArea
              label="Meddelande"
              value={text}
              onChange={setText}
              rows={7}
              isRequired
              isDisabled={lage === 'skickar'}
            />
          </div>

          {/* TRYGGHETSTRIADENS (a): EN NAMNGIVEN MOTTAGARE. Var och en får sitt
            eget mail, så det finns ingen enda sann text att visa — att visa
            EN och säga vems den är är ärligare än att visa mallen.
            Plain text, aldrig HTML-render.

            [TASK-264] "DEN FÖRSTA" ÄR NU "EN VALD" — se `namngivetExempel`
            ovan. Ordet stod här i sin gamla form ända tills exempelvalet
            slutade vara `mottagare[0]`. */}
          <div className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-caption text-text-muted">
                {namngivetExempel
                  ? `Förhandsvisningsexempel - som ${aktaNamn(namngivetExempel)} får det`
                  : exempel
                    ? 'Förhandsvisningsexempel - ingen i publiken har ett registrerat namn'
                    : 'Förhandsvisningsexempel'}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-transparent bg-surface px-3 py-2 contrast-more:border-border-strong">
              <span className="shrink-0 text-small text-text-muted">Ämne</span>
              <span className="min-w-0 text-right text-body">{amneVisning.text || '-'}</span>
            </div>
            {/* [TASK-264] `data-testid` — brödtexten måste gå att assertera
                UTAN att `Meddelande`-fältets egen mall räknas med. Ett bevis
                för "hälsningen är generisk" som läser hela vyn läser också
                `Hej {förnamn},` i inmatningsfältet och blir därmed ett svagare
                påstående än det utger sig för. `data-testid` syns inte i
                `ariaSnapshot`, så referenserna berörs inte (ADR-103 B4 samma
                motiv som `utskicksvyn` ovan). */}
            <p
              data-testid="forhandsvisning-brodtext"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som AtgardsSida.tsx:2267.
              tabIndex={0}
              className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-transparent bg-surface px-3 py-2 text-body text-text-secondary contrast-more:border-border-strong"
            >
              {brodtext.text || 'Meddelandet visas här när du skrivit det.'}
            </p>
          </div>

          {/* TRYGGHETSTRIADENS (c) — TESTMAILET SOM RAD, INTE SOM KNAPP I EN
            RUBRIKRAD (Marcus 2026-08-16). Formen är åtgärdssidans, verbatim:
            `AtgardsSida.tsx:2708-2741`, där platsvalet redan är fattat och
            motiverat (S102, Marcus form-beslut A) — etikett vänster dämpad,
            handling/utfall höger, sist i samma grupp som fältens innehåll.
            Den gamla `intent="secondary"`-knappen i förhandsvisningens
            rubrikrad var samma grå form Marcus underkände där.

            HOVERN ÄR MÄTT NÖDVÄNDIG, inte kosmetik: `intent="ghost"` hovrar
            till `--mm-button-ghost-bg-hover` = `--mm-bg-muted`, och
            `DetaljGrupp`s egen kortbakgrund ÄR `bg-bg-muted` (DetaljGrupp.tsx
            :31) - identiska toner, hovern försvinner in i panelen. Samma fix
            som förebilden: `data-[hovered]:bg-bg-emphasized`, ALDRIG `hover:`
            (en annan tailwind-merge-modifierare än primitivens egen bas, och
            den vinner aldrig mot den).

            SERVERVÄGEN ÄR FORTFARANDE INTE KOPPLAD - `send-email` saknar
            enkel-mottagar-gren tills task-147.1 landar, och fälla #44 står
            kvar orörd: en testmail-väg får ALDRIG filtrera på adressmönster
            (Marcus egna adresser är riktiga deltagares). Klicket visar därför
            samma `testNot`-info som förut, med samma text. Den ligger UNDER
            raden i stället för i höger-sloten: en `MessageBox` är bred, och
            högerjusterad hade den brutit rad-grammatiken den just fick.

            EN `divide-y`-avdelare, inte två: raden och dess info delar ETT
            barn i `DetaljGrupp`s kort (avvikelse mot förebildens `py-3` direkt
            på raden - `py-3` sitter här på wrappern i stället, geometriskt
            identiskt när infon är dold). */}
          <div className="flex flex-col gap-2 py-3">
            <div className="flex items-start justify-between gap-4">
              <span className="shrink-0 text-small text-text-muted">Testmail</span>
              <div className="flex flex-col items-end gap-1">
                <Button
                  intent="ghost"
                  size="sm"
                  className="data-[hovered]:bg-bg-emphasized"
                  isDisabled={lage === 'skickar'}
                  onPress={() => setTestNot(true)}
                >
                  <Send aria-hidden="true" size={12} className="shrink-0" />
                  Skicka till min inkorg
                </Button>
              </div>
            </div>
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
            isDisabled={
              isPending || !fordelning.klar || mottagare.length === 0 || lage === 'skickar'
            }
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
            {lage === 'skickar' && (
              <p className="mm-laddtext text-small text-text-muted">Skickar utskicket…</p>
            )}
          </div>
        </div>
      </div>
    </section>
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
  | { namn: 'nytt' }
  | { namn: 'detalj'; id: string }
  | { namn: 'regel'; id: string }
  | { namn: 'generator' }
  | { namn: 'utskick'; ids: string[]; retur: 'lista' | 'detalj' };

/** Ett segment i byggläge — utgången ur mallvyns "Bygg med egna villkor".
    Predikatet förbefolkas ur mallvalet när ett finns (varv 6): finjustering
    ska aldrig börja om från noll. */
function nyEntitet(predikat: Predikat | null = null, namn = ''): SegmentEntitet {
  return {
    id: `nytt-${Date.now()}`,
    namn,
    predikat: predikat ?? { med: [nyKonjunkt()], utan: [] },
    arvdRegel: null,
    skiss: true,
  };
}

export function VariantD() {
  const dataSource = useDataSource();
  const [vy, setVy] = useState<Vy>({ namn: 'lista' });
  /**
   * Segment skapade/ändrade i sidan (no-op-stubb: lever bara i minnet).
   * FÖRPOPULERAD MED DE FJORTON (S104 Del 3 konvergens, PAUSLÄGE punkt 5):
   * lazy initializer, körs EN gång vid mount. Atomerna är fasta konstanter
   * (`DE_FJORTON_ATOMER`), inte härledda ur laddad data, så de fjorton finns
   * omedelbart - Marcus ville att de "förskapas åt Roger och Lotta och finns
   * från start".
   */
  const [egna, setEgna] = useState<SegmentEntitet[]>(() => byggDeFjorton());
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
  /** Täckningsvyns läge (S104 Del 4, task-181) — bor på variant-nivå därför
   *  att läget hör till LISTAN, inte till en enskild post, och listan är den
   *  enda ytan som renderar `SegmentLista`. (Skalprovs-läget bodde här av
   *  samma skäl och är rivet med promoveringen, TASK-249.6.) */
  const [tackningsLage, setTackningsLage] = useState(false);

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

  // `byggSkisser` (de fem påhittade exemplen) är riven — `egna` bär redan de
  // fjorton förskapade grupperna från mount, plus vad "Nytt segment" och
  // "Dela upp i grupper" lägger till under sessionen.
  const alla = useMemo(() => [...sparade, ...egna], [sparade, egna]);
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

  if (vy.namn === 'generator') {
    return (
      <DelaUppIGrupper
        parInfo={parInfo}
        onTillbaka={() => setVy({ namn: 'lista' })}
        onSkapa={(entiteter) => {
          // READ-ONLY-KONTRAKTET (filhuvudet): de nya grupperna läggs bara i
          // `egna`-state, precis som "Nytt segment" — ingen `saveSegment`.
          setEgna((lista) => [...lista, ...entiteter]);
          setVy({ namn: 'lista' });
        }}
      />
    );
  }

  if (vy.namn === 'nytt') {
    return (
      <NyttSegmentVy
        parInfo={parInfo}
        onTillbaka={() => setVy({ namn: 'lista' })}
        onSkapa={(entitet) => {
          setEgna((lista) => [...lista, entitet]);
          // WOW-skarven: det nya segmentet öppnas direkt — "här är ditt
          // segment, det här är publiken" — i stället för att landa i listan
          // och leta upp sitt eget kort.
          setVy({ namn: 'detalj', id: entitet.id });
        }}
        onAvancerat={(predikat, namn) => {
          const entitet = nyEntitet(predikat, namn);
          setEgna((lista) => [...lista, entitet]);
          setUtkastId(entitet.id);
          setVy({ namn: 'regel', id: entitet.id });
        }}
      />
    );
  }

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
      onNytt={() => setVy({ namn: 'nytt' })}
      onDelaUpp={() => setVy({ namn: 'generator' })}
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
      tackningsLage={tackningsLage}
      onTackning={() => setTackningsLage((v) => !v)}
    />
  );
}
