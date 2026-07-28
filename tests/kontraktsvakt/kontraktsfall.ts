import {
  EventFormatSchema,
  EventNoteSchema,
  EventSchema,
  PersonDetailSchema,
  PersonSchema,
  RegistrationSchema,
} from '../../src/domain/schemas';
import { ARBETSKO_EVENT_ID, BELAGGNING_EVENT_ID, HISTORY_PERSON_ID } from '../api/fixtures';
import {
  EVENT_DETAIL_RESPONSE,
  EVENT_FORMATS_RESPONSE,
  EVENT_NOTES_RESPONSE,
  EVENTS_RESPONSE,
  PERSON_DETAIL_RESPONSE,
  PERSONS_RESPONSE,
  REGISTRATIONS_RESPONSE,
  VISUAL_PERSON_RIK_ID,
} from '../support/fixturvarld/fixture-data';
import type { Kontraktsfall } from './kontraktsjamforelse';

/**
 * De bevakade kontrakten (task-59.2, ADR-080 beslut 3; utökad i TASK-68).
 *
 * ALLA SJU FIXTURHANDLERS BEVAKAS. `tests/support/fixturvarld/handlers.ts`
 * registrerar sju EF-handlers, och var och en av dem har ett fall nedan.
 *
 * DEN PARITETEN ÄR I DAG EN KONVENTION, INTE EN GRIND — sagt rakt ut hellre än
 * antytt. Inget test binder listan nedan till handler-listan, så en åttonde
 * handler kan tillkomma utan att något fäller. Att mekanisera den vore billigt
 * (`handlers`-arrayens `info.path` är läsbar), men skulle göra det BLOCKERANDE
 * att registrera ett fall — och därmed flytta en nattlig, icke-blockerande vakt
 * in i presubmits beslutsrymd. Det är ett policyval, inte en implementations-
 * detalj, och det ligger utanför TASK-68.
 *
 * URVALET VAR TIDIGARE VOLYMDRIVET — OCH DET VAR FEL AXEL. De tre första
 * fallen valdes på anropsvolym ur hermetik-mätningen (S91, 863 poster över 32
 * filer; 745 typsnitt, 118 skarpa mot Supabase). Fördelningen av de 118:
 *
 *     55  /functions/v1/get-event-notes      46,6 %
 *     26  /functions/v1/get-registrations    68,6 % ackumulerat
 *     22  /functions/v1/get-events           87,3 % ackumulerat
 *      7  /functions/v1/get-event
 *      3  /functions/v1/get-event-formats
 *      2  /auth/v1/token
 *      1  /auth/v1/logout
 *      1  /functions/v1/get-persons
 *      1  /functions/v1/create-event
 *
 * De tre bär 103 av 118 skarpa restanrop, och svansen bedömdes då som för dyr
 * för sin täckning. MÄTNINGEN VAR RIKTIG, SLUTSATSEN VAR DET INTE:
 * kontraktsrisk följer inte anropsvolym. `TASK-52` är en live-verifierad
 * produktionsdefekt — Airtables `Motivering (text)` är ett lookup och
 * returnerar en ARRAY medan `PersonDetail.schema.ts:44` kräver
 * `z.string().nullable()`, så zod fäller och persondetaljen visar felvy för
 * varje person med motivering. Den defekten sitter i `get-person`, alltså i
 * raden med ETT anrop, längst ned i den svans volym-argumentet skrev av.
 * Kartläggningen (`docs/research/kontraktsdrift-skyddet-2026-07-28.md` § 5–6)
 * kallar utökningen "den enskilt största riskreduktionen" av det skälet.
 *
 * ADR-080 anger 104 av 118 för de tre första. Omräkningen ger 103 (55+26+22).
 * Skillnaden är en enda anropsrad och rör ingen slutsats — men den bokförs
 * här hellre än att siffran ärvs vidare oprövad.
 *
 * `.hermetik/rapport.jsonl` är gitignorerad (en mätartefakt, inte källkod),
 * så tabellen ovan är räkningens hemvist. Den återskapas genom att köra
 * hermetik-mätningen om (`PLAYWRIGHT_HERMETIK_RAPPORT=1`).
 *
 * ANKARE FRAMFÖR FÄRSKVARA. Varje fall som kräver ett `?id=` pekar på en
 * PERMANENT staging-fixtur ur `tests/api/fixtures.ts`, aldrig på en rad någon
 * annan svit skapar. Skälet är mätt, inte principiellt: `get-event-notes`
 * pekade en gång på beläggnings-eventet, vars enda anteckningar är api-svitens
 * sentineler, och ADR-060-purgen är designad att radera dem — utfallet avgjordes
 * då av sekunder (se fallets egen kommentar nedan). Ett `?id=` mot en flyktig
 * rad återinför exakt det racet.
 *
 * VID SUPABASE-BYTET är detta filen som skrivs om (ADR-080 beslut 5:s
 * ~10 %-halva). Jämförelsekärnan och larmformen överlever oförändrade.
 */

const URVAL =
  'Alla sju fixturhandlers bevakas (TASK-68). De tre volymbärarna — ' +
  'get-event-notes, get-registrations och get-events — står för 103 av 118 skarpa ' +
  'restanrop (hermetik-mätningen, S91), men svansen togs med ändå: kontraktsrisk ' +
  'följer inte anropsvolym. TASK-52:s live-verifierade defekt sitter i get-person, ' +
  'som bar ETT anrop. Utanför bevakningen står de 17 Edge Functions fixturvärlden ' +
  'inte mockar, samt felkontrakten (404/400) — de senare är TASK-69.';

export const KONTRAKTSFALL: readonly Kontraktsfall[] = [
  {
    endpoint: 'get-events',
    sokvag: '/functions/v1/get-events',
    kuvertnyckel: 'events',
    schema: EventSchema,
    schemanamn: 'EventSchema',
    schemakalla: 'src/domain/schemas/Event.schema.ts',
    fixtur: EVENTS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENTS_RESPONSE.events',
    urval: URVAL,
  },
  {
    endpoint: 'get-registrations',
    // MEDVETET UTAN PARAMETRAR: fixturens REGISTRATIONS_RESPONSE ÄR den
    // event-lösa grenen (Hem-aggregeringen läser den utan params), och EF:en
    // svarar med olika berikning i de två grenarna — den event-lösa lämnar
    // personbatcharnas fält null, dokumenterat i funktionens egen header.
    // Ett anrop med eventId hade alltså jämförts mot fel gren.
    sokvag: '/functions/v1/get-registrations',
    kuvertnyckel: 'registrations',
    schema: RegistrationSchema,
    schemanamn: 'RegistrationSchema',
    schemakalla: 'src/domain/schemas/Registration.schema.ts',
    fixtur: REGISTRATIONS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → REGISTRATIONS_RESPONSE.registrations',
    urval: URVAL,
  },
  {
    // eventId krävs (utan den svarar EF:en 400). Ankaret är ARBETSKÖ-eventet, som
    // bär den permanenta anteckning-fixturen (ANTECKNING_FIXTUR_NOTE_ID, TASK-61).
    //
    // TIDIGARE PEKADE DEN PÅ BELÄGGNINGS-EVENTET, OCH DET VAR EN DESIGNLUCKA. De
    // enda anteckningarna på det eventet är api-svitens sentineler, som ADR-060-
    // purgen är designad att radera. Vakten mätte alltså mot data som en annan
    // nattjobb-gren tömmer, och eftersom `kontraktsvakt` inte har något `needs:`
    // avgjordes utfallet av sekunder: nightly 30328246805 läste åtta sekunder EFTER
    // purge och föll på `[TOMT-UNDERLAG]`; dispatch 30309427472 läste två sekunder
    // FÖRE och var grön. Skillnaden var timing, inte kontrakt.
    //
    // ETT `needs:` HADE BARA FLYTTAT RACET. Fixen är oberoende data: arbetskö-eventet
    // får aldrig sentinel-anteckningar (create-event-note/get-event-notes skriver
    // uteslutande mot beläggnings-eventet), och fixturtexten kan per konstruktion
    // inte matcha purge-mönstret. Vakten ger därmed samma utfall före, under och
    // efter purge — utan att natten behöver serialiseras en gång till. Beviskedjan
    // och de två spärrarna: se fixturens doc-block i tests/api/fixtures.ts.
    //
    // Att fixturens anteckningar hör till ett ANNAT event spelar fortsatt ingen
    // roll: jämförelsen gäller form, inte innehåll.
    endpoint: 'get-event-notes',
    sokvag: `/functions/v1/get-event-notes?eventId=${ARBETSKO_EVENT_ID}`,
    kuvertnyckel: 'notes',
    schema: EventNoteSchema,
    schemanamn: 'EventNoteSchema',
    schemakalla: 'src/domain/schemas/EventNote.schema.ts',
    fixtur: EVENT_NOTES_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENT_NOTES_RESPONSE.notes',
    urval: URVAL,
  },
  {
    // ENKELPOST: EF:en svarar `{ event: {…} }` (get-event/index.ts:227) och
    // adaptern parsar med `EventSchema.parse`, inte `z.array` — se
    // AirtableAdapter.ts:110. `id` krävs; utan den svarar EF:en 400.
    //
    // ANKARET ÄR BELÄGGNINGS-EVENTET, en permanent seedad fixtur som
    // get-event.staging.test redan konsumerar (`STÄDA INTE`). Purge-racet som
    // sänkte get-event-notes gäller inte här: fallet läser eventRADEN, och
    // sentinel-ANMÄLNINGAR som purgen skapar och raderar ändrar bara
    // räknefältens VÄRDEN, aldrig deras form — och form är allt som jämförs.
    //
    // SAMMA SCHEMA SOM get-events, MEN INTE SAMMA SVARSFORM. get-event
    // aggregerar: beläggningens innehållsmodell (reserverade, manuelltTillagda,
    // viaFormular, medfoljande, vantelista) och auto-utskicks-styrningen bärs
    // bara här. De är ADDITIVT-OPTIONAL i EventSchema, alltså exakt den klass
    // av fält som kan försvinna ur EF:en utan att någon parse fäller. Att båda
    // endpoints delar schema är därför ett argument FÖR två fall, inte emot:
    // list-fallet kan strukturellt inte se den halvan av kontraktet.
    endpoint: 'get-event',
    sokvag: `/functions/v1/get-event?id=${BELAGGNING_EVENT_ID}`,
    kuvertnyckel: 'event',
    enkelpost: true,
    schema: EventSchema,
    schemanamn: 'EventSchema',
    schemakalla: 'src/domain/schemas/Event.schema.ts',
    fixtur: EVENT_DETAIL_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENT_DETAIL_RESPONSE.event',
    urval: URVAL,
  },
  {
    // GLOBAL läs-lista utan parametrar (get-event-formats/index.ts:40) — inget
    // ankare behövs, och ingen purge rör Eventformat-tabellen. Ytan är två
    // nycklar, vilket gör fallet billigt; värdet ligger i att `Eventtyp` KRÄVS
    // vid create-event, så ett glidande format-kontrakt tystar dropdownen i en
    // skriv-väg och inte bara i en vy.
    endpoint: 'get-event-formats',
    sokvag: '/functions/v1/get-event-formats',
    kuvertnyckel: 'eventFormats',
    schema: EventFormatSchema,
    schemanamn: 'EventFormatSchema',
    schemakalla: 'src/domain/schemas/CreateEvent.schema.ts',
    fixtur: EVENT_FORMATS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → EVENT_FORMATS_RESPONSE.eventFormats',
    urval: URVAL,
  },
  {
    // MEDVETET UTAN PARAMETRAR, av samma skäl som get-registrations: fixturen
    // PERSONS_RESPONSE är hela personmängden, och `resolvePersonsResponse`
    // SKIVAR den (sortering, sökning, sidstorlek) utan att röra postens form.
    // Vakten jämför form, så den obeskurna mängden är rätt jämförelseunderlag —
    // och ett `?pageSize=` hade bara gjort fallet beroende av en parameter-
    // semantik som ingenting här prövar.
    //
    // Kuvertets syskonnyckel `nextCursor` jämförs inte (vakten ser bara
    // postlistan) — den luckan står i larmets egen "VAD VAKTEN INTE SER".
    endpoint: 'get-persons',
    sokvag: '/functions/v1/get-persons',
    kuvertnyckel: 'persons',
    schema: PersonSchema,
    schemanamn: 'PersonSchema',
    schemakalla: 'src/domain/schemas/Person.schema.ts',
    fixtur: PERSONS_RESPONSE,
    fixturkalla: 'tests/support/fixturvarld/fixture-data.ts → PERSONS_RESPONSE.persons',
    urval: URVAL,
  },
  {
    // ENKELPOST: EF:en svarar `{ person: {…} }` (get-person/index.ts:215) och
    // adaptern parsar med `PersonDetailSchema.parse` (AirtableAdapter.ts:131).
    //
    // DETTA ÄR FALLET SKIVAN FINNS FÖR. `TASK-52` är live-verifierad och lever i
    // produktion: `Motivering (text)` returnerar en ARRAY, get-person skickar den
    // rått, `PersonDetail.schema.ts:44` kräver `z.string().nullable()` → ZodError
    // i adaptern → felvy för varje person med motivering. `fixture-data.ts:960-965`
    // skriver ut divergensen medvetet: fixturen är schema-trogen där verkligheten
    // inte är det, för att vyn ska gå att rita. Ett larm härifrån är RÄTT UTFALL,
    // inte ett fel i vakten — och det ska stängas av TASK-52 i basen eller i
    // schemat, ALDRIG genom att lappa fixturen (larmets punkt 3: en tystad
    // avvikelse är en tyst).
    //
    // ANKARET ÄR `ZZ-History Person 01`, den permanenta historik-fixtur
    // get-person.staging.test redan konsumerar (`STÄDA INTE`) — samma
    // ankare-framför-färskvara-regel som get-event ovan.
    //
    // ⚠ OCH DÄRFÖR ÄR DETTA FALL I DAG BLINT FÖR JUST MOTIVERING. Mätt mot staging
    // 2026-07-28 (TASK-68, 28 personer prövade): ankaret har `motivering: null`,
    // så schemat (som tillåter null) parsar, och typjämförelsen hoppar över
    // nycklar som är null på någon sida. Vakten är alltså GRÖN på get-person utan
    // att kontraktet är prövat på den punkten — frånvaro av data, inte ett grönt
    // besked. De enda staging-rader som faktiskt bär en motivering är två
    // `seed:review`-personer (`granskning-review*@example.com`), och de är
    // transienta per konstruktion: att ankra vakten där hade återinfört exakt det
    // purge-race TASK-61 avskaffade för get-event-notes.
    //
    // ATT VAKTEN *SKULLE* FÄLLA ÄR ÄNDÅ BEVISAT, bara inte av nattens data:
    // `tests/api/kontraktsvakt-jamforelse.test.ts` spelar upp TASK-52:s exakta
    // form (motivering som array) mot detta fall och får SCHEMA-STAGING +
    // TYPDIVERGENS, i den rena sviten, vid varje PR.
    //
    // ATT STÄNGA BLINDHETEN kräver att en PERMANENT staging-person får en ifylld
    // motivering. Fältet är INTE ett lookup utan en FORMEL (`fld4ENxbma679wvcC`,
    // `IF({fldIuuv4orI0DyLro} & "" = "", "", {fldIuuv4orI0DyLro})`) ovanpå
    // ROLLUPEN `Motivering (från anmälningsformulär)` (`fldIuuv4orI0DyLro`) över
    // personens Anmälningar — verifierat mot staging-schemat 2026-07-28. Värdet
    // kan därför inte skrivas på personen: det måste sättas på en av ankarets
    // länkade Anmälningar. Det är en seedning av staging-data, alltså ett beslut
    // utanför TASK-68 — registrerat, inte tyst förkastat.
    //
    // KURSHISTORIKEN PRÖVAS BARA AV SCHEMAT. `historik` är kontraktets nästlade
    // array, och formprofilen ser den som typen 'lista' utan att gå in i den.
    // Det är vaktens generella djupgräns (larmets "VAD VAKTEN INTE SER"), värd
    // att veta just här eftersom PersonHistoryEntrySchema annars ser bevakat ut.
    endpoint: 'get-person',
    sokvag: `/functions/v1/get-person?id=${HISTORY_PERSON_ID}`,
    kuvertnyckel: 'person',
    enkelpost: true,
    schema: PersonDetailSchema,
    schemanamn: 'PersonDetailSchema',
    schemakalla: 'src/domain/schemas/PersonDetail.schema.ts',
    // Den RIKA kuraterade personen — den enda fixturposten som bär hela
    // PersonDetail-ytan (RIK_DETALJ). Den härledda stommen hade lämnat tio fält
    // på sina tomma default-värden och därmed gjort jämförelsen tunnare.
    fixtur: PERSON_DETAIL_RESPONSE[VISUAL_PERSON_RIK_ID],
    fixturkalla:
      'tests/support/fixturvarld/fixture-data.ts → PERSON_DETAIL_RESPONSE[VISUAL_PERSON_RIK_ID].person',
    urval: URVAL,
  },
];
