#!/usr/bin/env node
// scripts/seed-review-fixture.mjs — skapar OCH städar GRANSKNINGSFIXTURER i
// staging-basen: ett kommande event med N bekräftade + M obekräftade
// anmälningar, realistiskt varierade, redo för design-review i browsern.
//
// VARFÖR SKRIPTET FINNS: exakt samma jobb gjordes för hand 2026-07-22
// (Event-796, Ort "Skövde", noteringen "GRANSKNINGSDATA (S75 review-våg 1)")
// och igen 2026-07-26 (Ort "ZZ-GRANSKNING-S91"). Andra gången kostade lika
// mycket som första, eftersom den första inte lämnade någon väg efter sig.
// Detta ÄR vägen — tredje gången är ett kommando.
//
// Kör:
//   npm run seed:review                       # default-fixtur, 8 + 8
//   npm run seed:review -- --ort Falköping --dagar 5 --bekraftade 4 --obekraftade 12
//   npm run seed:review -- --dry-run          # planera, skriv inget
//   npm run seed:review -- --livstid 30       # längre granskningsfönster
//   npm run seed:review -- --rik              # + EN person med HELA kravbilden
//                                              # (kontakt, flerhändig historik,
//                                              # hämtningar, motiveringar,
//                                              # anteckningar, flagga — TASK-97-
//                                              # uppföljningen/S103, se § RIK-LÄGET)
//   npm run seed:review:clean                 # radera default-fixturen
//   npm run seed:review:clean -- --ort Falköping --dry-run
//   npm run seed:review -- --sweep            # ENDAST förfallo-svepet
//   npm run seed:review -- --sweep --dry-run  # visa vad svepet skulle ta
//   npm run seed:review -- --legacy <namn>              # dry-run, alltid
//   npm run seed:review -- --legacy <namn> --bekrafta   # radera på riktigt
//
// DATAN SKA LIKNA VERKLIGHETEN (TASK-97, Marcus 2026-08-10: "riktiga namn,
// riktiga e-postadresser, riktiga orter … det ska vara fiktiva namn och
// adresser, men det ska likna verkligheten, inte massa ZZ-skit överallt").
// Fixturen granskas i personvyerna, och en lista full av
// `seed-review+zz-granskning-s103-01@granskning.test` går inte att designa mot.
// Bytena, vart och ett med sin grund:
//
//   E-POST: `fornamn.efternamn@example.com`, roterat över `.com`/`.org`/`.net`.
//     RFC 2606 § 3 reserverar de tre domänerna PERMANENT för dokumentation och
//     exempel — de är registrerade av IANA och kan aldrig tilldelas någon.
//     Adressen ser alltså äkta ut för ett mänskligt öga och kan bevisbart
//     aldrig tillhöra en verklig deltagare. (Att sändningsrisken dessutom är
//     noll i staging är en ANNAN spärr, oberoende av denna: icke-prod släpper
//     igenom exakt fyra allowlistade adresser och 422:ar allt annat,
//     supabase/functions/_shared/send-bulk.ts.)
//
//   ORT: en riktig svensk stad i stället för `ZZ-GRANSKNING-NN`. Orterna som
//     faktiskt förekommer i basen, MÄTTA read-only mot prod 2026-08-10
//     (`Anmälningar.Ort`, n = 400): Rönninge, Varberg, Ödeshög, Falköping,
//     Arboga, Bredaryd, Gotland, Östersund — plus Skövde ur legacy-registret.
//     Default är `Varberg`; `Skövde` undviks med flit eftersom
//     CONFIG.legacy[Skovde-S75] ankrar på just den orten och en fixtur där
//     hade fått `--legacy`-guarden att larma om "ny data på gammalt ankare".
//
//   ANMÄLNINGENS ORT = EVENTETS ORT, på ~82 % av raderna. Personens `Ort`
//     (fldBd946g2waLT7NG) är en ROLLUP över `Anmälningar.Ort`
//     (fldP1LSzbyOJxrOGP, singleLineText, skrivbar — båda live-verifierade mot
//     staging-schemat 2026-08-10), vilket är exakt varför varje seedad person
//     hittills visat tom Ort: personen HAR en anmälan, men anmälans egna Ort
//     var aldrig satt. Att i stället ge varje rad en EGEN stad ur en pool hade
//     gett en varierad personlista — och samtidigt en anmälan vars Ort
//     motsäger eventets, vilket `registration-read.ts` (`ort`) och
//     `get-registration` (`eventOrt`-fallbacken) visar rakt upp i
//     deltagarkortet. En fixtur som SER ut som en bugg i granskningsvyn är
//     värre än en enfärgad kolumn. Vill man ha flera orter i listan seedar man
//     flera fixturer (`--ort Varberg`, `--ort Falköping`) — det är säkert
//     numera, se IDENTIFIERINGEN nedan.
//
//   TELEFON SEEDAS INTE — FÖR BATCHENS TUNNA RADER. Prod har den på ~58 % av
//     färska personer, men Marcus avgjorde 2026-08-10: "telefon spelar ju
//     ingen roll, det ska vi ju inte visa i personlistan ändå". `Personer.
//     Telefon` lämnas alltså orörd på de tunna raderna. Anmälans
//     `Mobilnummer` sätts som förut — det är ett annat fält, i en annan vy,
//     och rörs inte av beslutet. UNDANTAG: `--rik` (S103-uppföljningen)
//     SÄTTER Telefon på just DEN personen — persondetaljens kontaktblock har
//     en tel-rad att granska, och det kravet väger tyngre än personlistans
//     ursprungliga motivering. Se CONFIG.richPerson för avvägningen i sin
//     helhet.
//
//   LUCKORNA ÄR PRODS, INTE PERFEKT UNIFORMITET. Mätt 2026-08-10: 660 av 662
//     prod-personer har e-post, medan Ort saknas på nästan var femte färsk
//     rad. Ett staging där varje kort bär exakt samma fält är alltså MER
//     enhetligt än verkligheten, och då designar man aldrig mot det tomma
//     fältet. Fördelningen är deterministisk (index-baserad, aldrig slumpad):
//     samma flaggor ger alltid samma fixtur, så en granskning går att
//     återskapa exakt och snapshots är stabila.
//
// IDENTIFIERINGEN — VAD `--clean` OCH SVEPET FÖLJER (TASK-97):
//
//   Fram till TASK-97 hittade clean sina anmälningar och personer genom att
//   söka på e-postmönstret `seed-review+<ort-slug>-NN@granskning.test`. Det
//   mönstret bar TVÅ jobb samtidigt: "detta är en fixturrad" OCH "den tillhör
//   ORTEN X". Realistiska adresser kan inte bära det andra jobbet — och ska
//   inte: två samtidiga fixturer hade då städat varandras rader.
//
//   Nu går clean via LÄNKGRAFEN, som redan finns i basen:
//
//     event (Ort + notering-sentinel, planClean avgör)
//       → eventets `Anmälningar (länkat fält)`
//         → varje anmälans `Person`-länk (läst FÖRE anmälan raderas)
//
//   Grafen startar i EXAKT den event-mängd planClean godkänt för radering —
//   samma anrop, inte ett andra uttryck av samma regel — så ett verkligt
//   Varberg-event utan sentinel bidrar med noll anmälningar och noll personer.
//   Ort grovsorterar, sentineln avgör; oförändrat sedan innan.
//
//   E-POSTMÖNSTRET FINNS KVAR SOM ANDRA SPÄRR, aldrig som bärande
//   identifiering: en rad grafen pekar ut men vars adress inte matchar
//   fixtur-formen raderas ALDRIG, den rapporteras. Mönstret känner igen de två
//   former skriptet någonsin skrivit — `@example.com|org|net`-formen ovan och
//   den pre-TASK-97:a `seed-review+…@granskning.test` — så fixturer som redan
//   ligger i basen förblir städbara med den nya koden.
//
//   FÖRÄLDRALÖSA PERSONER har en egen, smal väg. Avbryts en clean mellan
//   anmälnings- och person-steget blir personerna oåtkomliga för grafen (deras
//   enda väg in gick via anmälan). Clean listar därför också personer som bär
//   fixtur-adress OCH har NOLL anmälningslänkar. En person som tillhör en
//   annan LEVANDE fixtur har alltid minst en anmälan och kan därför aldrig
//   fångas av den vägen.
//
// LIVSTIDEN (TASK-95 del A): create stämplar ett utgångsdatum i eventets
// Notering. Förfallo-svepet läser stämpeln och städar det som passerat — det
// körs automatiskt i create och clean (stäng av med --ingen-svep) och kan
// köras ensamt med --sweep. En fixtur vars datum inte passerat rörs ALDRIG:
// det är "granskningen pågår". Svepet är ingen tidsdriven automat — det körs
// när skriptet körs; se CONFIG.livstid för hela avvägningen.
//
// LEGACY-LÄGET (TASK-95 del B): handbyggda fixturer från tiden före skriptet
// bär inte dess markörer och är osynliga för både clean och svepet.
// CONFIG.legacy är ett slutet register över dem, med mätt räkning per post.
// Dry-run är default; radering kräver --bekrafta.
//
// AVSLUTNINGEN (TASK-101): en post vars fixtur faktiskt STÄDATS bär
// `stadad: { datum, av }` och raderar aldrig mer. Registret skiljer därmed
// "fixturen ligger kvar" från "fixturen är städad" I KODEN — läsbart utan att
// skriptet körs, och utan att `kalla`-proveniensen kastas. Utan det fältet
// beskriver en städad post ett tillstånd basen inte har, och guardens egen
// instruktion ("mät om, uppdatera forvantat") leder till `{0,0,0}` — en post
// som ser aktiv ut men aldrig kan göra något.
//
// Token: STAGING_AIRTABLE_TOKEN ur gitignorade .env.seed (se
// .env.seed.example), laddad av npm-skriptet via
// `node --env-file-if-exists=.env.seed` — samma mekanism som
// `npm run purge:staging`. Tokenet är least-privilege: ENBART
// data.records:read + data.records:write mot staging-basen.
//
// SCHEMA-BLINDHET ÄR ETT DESIGNVILLKOR: tokenet saknar `schema.bases:read`
// (`meta/bases/…/tables` svarar 403). Skriptet får därför ALDRIG läsa schemat
// — alla select-värden är PINNADE konstanter i CONFIG nedan, verifierade mot
// docs/reference/data-model.md § Schema cheat sheet. `typecast` används
// ALDRIG: ett ogiltigt select-värde ska ge hårt 422, aldrig tyst föda en ny
// option i basen.
//
// Sju skyddsräcken (alla hårda, i denna ordning):
//   1. Bas-guard: CONFIG.expectedBaseId måste vara app-formad och får inte
//      finnas i forbiddenBaseIds (PROD app8uGPrVCVOm6LfD hårt blockerad —
//      staging och prod delar tabell-/fält-ID:n för duplicerade fält
//      (data-model.md § ID-topologi), så bas-ID:t är DEN bärande linjen).
//   2. Purge-kollisionsvakt (fälla 1): fixturens markörer korsläses mot den
//      SKARPA .purge-staging-policy.json och avvisas om de skulle kunna
//      matchas av setup-purgen. Policyn LÄSES — mönstren dupliceras aldrig
//      hit, så vakten kan inte drifta ifrån den purge som faktiskt körs.
//      Vakten ser numera ALLA markörbärande värden fixturen skriver: eventets
//      Ort, anmälningarnas Ort och varje e-postadress. Att orten blev en
//      riktig stad gör ingen skillnad för den — purgens enda ort-target
//      exakt-matchar `^ZZ-create-event-test$`, och korsläsningen bevisar det
//      mekaniskt vid varje körning i stället för att lita på att den som läser
//      policyn kommer ihåg det.
//   3. Skyddade record-ID:n (fälla 2): de permanenta assertion-fixturerna
//      (personerna ZZ-Arbetsko / ZZ-History + eventen ZZ-belaggning-fixtur /
//      ZZ-arbetsko-fixtur, TASK-114) står i CONFIG.protectedRecordIds och kan
//      aldrig raderas — inte ens om de mot förmodan matchar en markör.
//   4. Länk-guard vid clean: en person med ANTECKNINGAR (Anteckningar 2) lämnas
//      kvar och rapporteras i stället för att raderas. Fail-safe-riktning,
//      samma form som purge-skriptets skyddsräcke 4. ÄNDRAD i TASK-97-
//      uppföljningen (S103) från `Deltaganden` till `Anteckningar 2` —
//      Deltaganden/Touchpoints städas numera EXPLICIT av stadaOrt (RIK-LÄGET
//      kräver det: den rika personen FÅR Deltaganden av design). Full
//      avvägning i CONFIG.personDataLinkFields-kommentaren.
//   5. Utgångsstämpeln (TASK-95): svepet raderar ENDAST en fixtur vars stämpel
//      passerat. Saknad, trasig eller framtida stämpel ⇒ rörs aldrig. Det är
//      den halva som gör att en pågående granskning inte kan städas bort.
//   6. Legacy-registrets räknings-guard (TASK-95): varje post bär sin MÄTTA
//      räkning, och avviker basen från den vägrar skriptet och raderar
//      ingenting. Registret är slutet — inga mönster från kommandoraden.
//   7. Legacy-registrets avslutning (TASK-101): en post märkt `stadad` får en
//      TOM raderingsplan per konstruktion, oavsett vad basen innehåller. Ser
//      den ändå rader är det NY data på ett gammalt ankare — Airtable
//      återanvänder inte record-ID:n — och skriptet vägrar i stället för att
//      radera någon annans arbete.
//
// SKYDDSRÄCKE 2 ÄR OFÖRÄNDRAT OCH SKA FÖRBLI DET: en granskningsfixtur får
// ALDRIG bli purge-bar. Att lösa livstidsfrågan med en target i
// .purge-staging-policy.json vore att riva skyddet, inte att laga det —
// setup-purgen kör före varje staging-CI-jobb och hade raderat fixturen mitt
// under granskningen. Restlistan bokförde en gång ZZ-GRANSKNING-* och
// app-segment-test som samma klass av lucka; de har MOTSATTA rätta svar.
//
// Logiken är universell (kan bära ett annat projekt utan refactor); ALLA
// projekt-värden bor i CONFIG högst upp. Medvetet avsteg från
// .<grindvakt>-policy.conf-konventionen (CLAUDE.md): den gäller CI-grindvakts-
// logik med flera konsumenter. Detta är ett lokalt utvecklarverktyg med EN
// konsument, och de pinnade select-värdena är ett korrekthetskontrakt med
// koden (schema-blindheten ovan) — att flytta dem till en fristående fil
// hade lagt till ett felläge utan att lägga till en konsument.
//
// Airtable-mekanik (developers-docs, verifierad 2026-07-19/26): max 10 records
// per create/delete-anrop; 5 req/s per bas (≈250 ms throttle); delete via
// ?records[]=…; list pagineras via offset. Formelfält har beräkningsfördröjning
// (data-model § Kända fällor 17) — därav poll vid EventKey-läsning.
//
// Exit: 0 = OK, 1 = guard-/konfigurations-/argumentfel, 2 = Airtable-API-fel.

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { kravStagingLedigt } from './lib/staging-preflight.mjs';

// ---------------------------------------------------------------------------
// CONFIG — allt projekt-specifikt bor här. Logiken nedanför är universell.
// ---------------------------------------------------------------------------

export const CONFIG = {
  /** Staging. Prod är hårt blockerad (skyddsräcke 1). */
  expectedBaseId: 'apphjj8Q7lkXCMsL4',
  forbiddenBaseIds: ['app8uGPrVCVOm6LfD'],

  /**
   * Tabeller: id används i API-anropen, namn för korsläsning mot purge-policyn.
   *
   * De tre sista (TASK-97-uppföljningen, S103) bär den RIKA personens
   * kravbild. `Anteckningar` HAR en purge-target (`create-event-note-sentineler`)
   * — dess `purgeName` är alltså inte kosmetisk, den korsläses skarpt (fälla 1)
   * precis som Eventplanering/Anmälningar. Deltaganden/Touchpoints har ingen
   * target i dagens policy; `purgeName` sätts ändå för att en framtida target
   * fångas AUTOMATISKT av samma korsläsning, inte tyst missas.
   */
  tables: {
    eventplanering: { id: 'tblVE3UKWl1CKrphV', purgeName: 'Eventplanering' },
    anmalningar: { id: 'tbloOcrppVoyrHbrq', purgeName: 'Anmälningar' },
    personer: { id: 'tbl6ZyCm3V026iFTU', purgeName: 'Personer' },
    deltaganden: { id: 'tbldWHH6sSHWoQPHH', purgeName: 'Deltaganden' },
    touchpoints: { id: 'tbl22SCvlHrgcAiZi', purgeName: 'Touchpoints' },
    anteckningar: { id: 'tbl87a23xDv19Mb6R', purgeName: 'Anteckningar' },
  },

  /**
   * PINNADE select-värden — tokenet kan inte läsa schemat, och `typecast`
   * används aldrig. Källa: docs/reference/data-model.md § Schema cheat sheet,
   * samtliga skarpt belagda mot staging 2026-07-26.
   */
  select: {
    eventSource: 'Fjärrskådning',
    eventTyp: 'Utbildning',
    eventStatus: 'Planerat',
    regStatusBekraftad: 'Bekräftad (mail skickat)',
    regStatusObekraftad: 'Obekräftad',
    regKallaManuell: 'Manuell',
    betalningMottagen: 'Mottagen',
    betalningEjMottagen: 'Ej mottagen',
    /** Historik-eventen (--rik) är GENOMFÖRDA, inte planerade. */
    eventStatusGenomfort: 'Genomfört',
    /** Deltaganden.Status — pinnade, live-verifierade 2026-08-10 (--rik). */
    deltagandeNarvarande: 'Närvarande',
    deltagandeFranvarande: 'Frånvarande',
    deltagandeEjAvstamt: 'Ej avstämt',
    /** Deltaganden.Session — samma pinning-disciplin. */
    sessionDag1: 'Dag 1',
    sessionDag2: 'Dag 2',
    /**
     * Touchpoints.Typ — "hämtade ett erbjudande"-grenen av TP sammanfattning-
     * formeln (`SWITCH`, live-verifierad via describe_table 2026-08-10).
     */
    tpTypHamtning: 'Angett e-post för att ta del av ett erbjudande',
  },

  /**
   * Eventformat-raden "Dag 1 + Dag 2". Eventtyp-länken KRÄVS vid create
   * (ADR-066 b5) — utan den saknar eventet Sessionsmall och blir felaktigt.
   */
  eventformatRecordId: 'recclDd7hUQsfxoVs',

  /**
   * Fixtur-markörerna. Medvetet VID SIDAN AV purge-mönstren (fälla 1):
   * setup-purgen jagar `Ort = 'ZZ-create-event-test'` och
   * `create-test+<uuid>@staging.test`. En granskningsfixtur som matchade dem
   * hade raderats mitt under granskningen av nästa CI-körning. Notering-
   * sentineln är ett fält purgen aldrig läser, och e-postdomänerna ligger
   * utanför dess `@staging.test`. Vakten verifierar det mekaniskt mot den
   * skarpa policyn — se purgeCollisions.
   *
   * SENTINELN ÄR BESLUTAREN, inte adressen (TASK-97). Adressen är andra
   * spärren; identifieringen går via länkgrafen. Se § IDENTIFIERINGEN överst.
   */
  marker: {
    noteringSentinel: '[SEED-REVIEW-FIXTUR]',
    /**
     * RFC 2606 § 3-reserverade domäner, roterade så listan inte ser
     * maskinstansad ut. Reservationen är permanent och registrerad av IANA:
     * adressen kan aldrig tillhöra en verklig deltagare, hur äkta den än ser
     * ut. validateConfig vägrar allt utanför de tre — en domän som INTE är
     * reserverad kan tilldelas någon, och då är realismen inte längre gratis.
     */
    emailDomains: ['example.com', 'example.org', 'example.net'],
    /**
     * Formen skriptet skrev FÖRE TASK-97. Behålls som IGENKÄND fixtur-form i
     * andra spärren — inte som något skriptet skriver — så fixturer som redan
     * ligger i staging kan städas med den nya koden. Utan den hade varje
     * befintlig granskningsfixtur blivit ostädbar i samma commit som gjorde
     * den fula adressen snygg.
     */
    tidigareEmailPrefix: 'seed-review+',
    tidigareEmailDomain: '@granskning.test',
  },

  /**
   * Länkfälten grafen går genom (TASK-97). Namnen är basens, och de bär
   * identifieringen sedan e-posten slutade göra det — därför står de i CONFIG
   * i stället för strödda som strängliteraler i tre funktioner.
   */
  linkFields: {
    /** Eventplanering → Anmälningar. Samma fält korCreate efter-verifierar mot. */
    eventAnmalningar: 'Anmälningar (länkat fält)',
    /** Anmälningar → Personer. Sätts av skriptet självt vid create. */
    anmalanPerson: 'Person',
    /** Personer → Anmälningar. Tom lista ⇒ föräldralös fixturperson. */
    personAnmalningar: 'Anmälningar (länkat fält)',
    /**
     * RIK-LÄGET (--rik, S103) — de fyra fälten nedan bär den rika personens
     * kravbild. Namnen är basens LITERALA fältnamn (live-verifierade via
     * describe_table 2026-08-10) — flera skiljer sig från "Syfte"-kolumnens
     * etikett i data-model.md § Schema cheat sheet (t.ex. Deltagandens
     * write-fält heter i basen "Anmälan"/"Event", inte "Anmälan (länk)"/
     * "Event (länk)" — den senare är dokumentets SYFTES-etikett, inte
     * fältnamnet; att skicka fel nyckel ger tyst ignorerat fält, inget fel).
     */
    /** Personer → Deltaganden (rollup-basen för RIM ×/Genomförda dagar m.fl.). */
    personDeltaganden: 'Deltaganden',
    /** Personer → Touchpoints. Källan för Alla hämtningar-rollupen. */
    personTouchpoints: 'Touchpoints',
    /**
     * Personer → Anteckningar (task-18.11/S103). Namnet ÄR "Anteckningar 2" i
     * basen (live-verifierat) — "Anteckningar" var redan upptaget av det
     * gamla fritext-fältet (fldWGlNr3ujRHo85w). INTE ett skrivfel här.
     */
    personAnteckningar: 'Anteckningar 2',
    /** Deltaganden → Personer, DIREKT länk (skild från lookupen "Person"). */
    deltagandePersonLank: 'Person (länk)',
  },

  /**
   * Permanenta fixturer som bär exakta assertions i testsviten: personerna
   * ZZ-Arbetsko Person 01 + ZZ-History Person 01 (rollup-assertions, TASK-31)
   * och eventen ZZ-belaggning-fixtur (EventKey Event-681, task-18.2) +
   * ZZ-arbetsko-fixtur (EventKey Event-845, task-18.4) — alla fyra med facit
   * i tests/api/fixtures.ts. Att länka nya anmälningar till dem — eller
   * radera dem — fäller tester (fälla 2). Skriptet skapar därför EGNA
   * personer och event och kan aldrig röra dessa. Ordningen är bärande:
   * personerna står först (testsviten adresserar index 0), eventen efter
   * (TASK-114).
   */
  protectedRecordIds: [
    'rec7F8jYc7rczwwkM',
    'recqxaFNwHAdQlAqb',
    'recIFrxHZw165ycXk',
    'recZyRIzbqWSifAQO',
  ],

  /**
   * Länkfält på Personer vars närvaro blockerar radering (skyddsräcke 4).
   *
   * ÄNDRAD (TASK-97-uppföljningen/S103): var `['Deltaganden']`, är nu
   * `['Anteckningar 2']`. En MEDVETEN avvägning — den rika personen (--rik)
   * FÅR Deltaganden/Touchpoints AV DESIGN, och den gamla listan hade blockerat
   * varje städning av den för alltid.
   *
   * Varför det är säkert att släppa Deltaganden/Touchpoints ur guarden:
   * personen når hit ENDAST efter att redan ha passerat `isFixtureEmailRecord`
   * (planClean/planLegacyClean anropar guarden EFTER det filtret, aldrig
   * före) — adressen är `@example.com/.org/.net`, RFC 2606 §3-reserverad och
   * kan därför ALDRIG tillhöra en verklig deltagare (samma bevis som redan
   * bär hela skriptets identifiering, se § IDENTIFIERINGEN). Ett Deltagande
   * eller en Touchpoint kan alltså bara ha hamnat på en sådan person genom
   * DETTA skript. `stadaOrt` samlar och raderar dem explicit (satellit-
   * städningen, se dess kropp) INNAN personen raderas.
   *
   * Varför Anteckningar INTE får samma lättnad: `Anteckningar.Person`
   * (task-18.11, S103) är samma dag som detta skrivs under aktiv utbyggnad av
   * en `create-person-note`-EF i EN ANNAN gren — när den landar kan Marcus
   * lägga en ÄKTA anteckning på just den rika granskningspersonen MEDAN han
   * granskar. Skriptets egna anteckningar bär inget säkert maskin-läsbart
   * märke (en sentinel i den synliga texten hade motsagt "ska likna
   * verkligheten"-kravet, TASK-97) — så en blind "radera alla Anteckningar
   * länkade till en fixturperson" KAN INTE skilja Marcus egen anteckning
   * från skriptets. Guarden blockerar därför radering så länge NÅGON
   * anteckning finns kvar — fail-safe, samma riktning som alla andra
   * skyddsräcken i denna fil ("hellre lämna kvar"). Konsekvensen: en
   * granskningsperson med anteckningar kräver ett MANUELLT beslut (radera
   * anteckningarna för hand, eller acceptera att personen blir kvar) innan
   * `--clean`/svepet kan slutföra den raderingen — se § RIK-LÄGET.
   */
  personDataLinkFields: ['Anteckningar 2'],

  /**
   * Beläggnings-tak (fälla 4). Automation A6 skickar fullbokat-notis vid
   * 100 % `Anmäld beläggning (%)`. Automationerna är avstängda i staging idag,
   * men fixturen förlitar sig inte på det: kapaciteten sätts så att kvoten
   * aldrig kan nå taket.
   */
  belaggning: { maxKvot: 0.6, minPlatser: 20 },

  defaults: {
    /**
     * En RIKTIG svensk stad, mätt ur prod (se § DATAN SKA LIKNA VERKLIGHETEN).
     * `Skövde` undviks med flit — CONFIG.legacy[Skovde-S75] ankrar på den
     * orten och en fixtur där hade fått den avslutade postens guard att larma.
     */
    ort: 'Varberg',
    bekraftade: 8,
    obekraftade: 8,
    /**
     * Dagar till eventstart (fälla 3). Ett kluster på ~15 identiska
     * sentinel-event ligger på 2026-09-15 — en fixtur där drunknar i listan.
     * Nära i tiden ⇒ överst i "Kommande".
     */
    dagar: 8,
  },

  /** Anmälnings-taket är en rimlighetsspärr, inte en Airtable-gräns. */
  limits: { maxAnmalningar: 60 },

  /**
   * FIXTURENS LIVSTID (TASK-95 del A). Skapandet stämplar ett utgångsdatum i
   * eventets Notering; förfallo-svepet (korSweep) läser stämpeln och städar
   * det som passerat, via exakt samma planClean-väg och samma skyddsräcken.
   *
   * VAD STÄMPELN LÖSER, OCH VARFÖR DEN BEHÖVS FÖR ATT ÖVERHUVUDTAGET KUNNA
   * SKILJA FALLEN: skyddsräcke 2 svarar på "vem får INTE radera fixturen
   * medan granskningen pågår". Ingenting svarade på "vem raderar den när
   * granskningen är slut" — och ingen mekanism KUNDE svara, eftersom
   * "granskningen pågår" inte var uttryckt någonstans i datan. Stämpeln gör
   * det uttryckbart. Utan den är varje automatisk städning en gissning.
   *
   * TRE FAIL-SAFE-RIKTNINGAR, alla åt samma håll (hellre lämna kvar):
   *   - fixtur UTAN stämpel rörs ALDRIG (t.ex. en handbyggd, eller en skapad
   *     före denna landning) — det är legacy-registrets område, inte svepets
   *   - fixtur vars datum INTE passerat rörs ALDRIG — det ÄR "granskningen
   *     pågår", och det är den halvan som gör mekanismen säker
   *   - ogiltigt/oparsbart datum rörs ALDRIG — en trasig stämpel läses aldrig
   *     som "förfallen"
   *
   * ÄRLIG GRÄNS, utskriven i stället för dold: svepet körs NÄR SKRIPTET KÖRS
   * (create, clean eller --sweep). Det är ingen tidsdriven automat. En fixtur
   * vars stämpel passerat ligger kvar tills någon kör skriptet igen. Det är
   * ett medvetet val — alternativet (ett raderande CI-jobb mot staging)
   * återinför precis den risk skyddsräcke 2 finns för att stänga, med en
   * aktör ingen ser innan den fyrar. Avvägningen i sin helhet, inklusive de
   * tre förkastade formerna, står i TASK-95:s PR — den är INTE ADR-fäst.
   */
  livstid: {
    dagarDefault: 14,
    maxDagar: 365,
    /** Stämpelns form i Noteringen. Läses av parseUtgangsdatum. */
    stampelPrefix: '[UTGÅR:',
  },

  /**
   * LEGACY-REGISTRET (TASK-95 del B) — handbyggda granskningsfixturer från
   * tiden FÖRE skriptet. De bär inte skriptets markörer och är därför
   * osynliga för både clean och svepet (fail-safe: "en rad utan fixtur-markör
   * rörs aldrig"). Registret är den enda vägen till dem.
   *
   * VARFÖR ETT REGISTER OCH INTE EN FRI `--legacy-monster <regex>`: ett
   * mönster som skrivs på kommandoraden i stunden flyttar hela skyddet till
   * den som skriver det. Det är prosa som utger sig för att vara mekanism —
   * ADR-083:s synd, i kodform. Registret flyttar skyddet till kodgranskning
   * och testsvit: varje post är granskad, testad mot riktiga adresser den
   * INTE får matcha, och bär sin egen räkning.
   *
   * FYRA ANKARE PER POST, alla måste hålla:
   *   1. `ort` — grovsorterar server-side
   *   2. `eventRecordId` — EXAKT record-ID. Bärande för `Skövde`, som är ett
   *      RIKTIGT ortsnamn: utan ID-ankaret hade en framtida verklig Skövde-rad
   *      kunnat matchas av ort-filtret.
   *   3. `emailPattern` — ankrat (^…$), aldrig delsträng
   *   4. `forvantat` — räkningen från mätningen. Avviker basen från den
   *      VÄGRAR skriptet. Det gör "räkna FÖRE du raderar" mekaniskt i stället
   *      för en uppmaning till människan (TASK-76:s lärdom).
   *
   * AVSLUTNINGEN — `stadad: { datum, av }` (TASK-101). En post vars fixtur
   * städats bär fältet och raderar aldrig mer. Två tillstånd, båda läsbara här
   * i koden utan att skriptet körs:
   *
   *   AKTIV   (inget `stadad`)  fixturen ligger kvar i basen; `forvantat` är
   *                             guarden före radering
   *   AVSLUTAD (`stadad` satt)  fixturen är städad; `forvantat` är HISTORIK —
   *                             vad som fanns när posten mättes
   *
   * VARFÖR `forvantat` INTE NOLLSTÄLLS: guardens felmeddelande instruerar
   * "mät om, uppdatera forvantat", vilket för en städad post betyder `{0,0,0}`.
   * Det är ingen avslutning — det är en post som ser aktiv ut men aldrig kan
   * göra något, och som dessutom har kastat den mätta räkningen. Klassen är
   * repots egen återkommande: ett värde som ser verifierat ut men inte är det.
   *
   * VARFÖR POSTEN STÅR KVAR HÄR I STÄLLET FÖR I EN EGEN `legacyStadade`-lista:
   * `--legacy <namn>` slår upp i denna lista. En flyttad post hade svarat
   * "finns inte i registret" — missvisande, för den fanns; den är städad. En
   * andra lista med samma postform hade dessutom kunnat drifta (en post i fel
   * lista fäller ingenting), och `kalla`-proveniensen hade lämnat den
   * validering som håller den läsbar.
   *
   * VARFÖR INTE ENBART ETT TYDLIGARE FELMEDDELANDE I GUARDEN: guarden talar
   * bara när skriptet KÖRS, och kravet är att skillnaden syns utan det. Den
   * kan dessutom inte SKILJA fallen utan detta fält — noll träffar mot
   * `forvantat: {1,16,16}` är formmässigt identiskt med "basen har ändrats
   * oväntat". Klartexten i guarden är alltså en FÖLJD av fältet, inte ett
   * alternativ till det.
   */
  legacy: [
    {
      namn: 'ZZ-GRANSKNING-S91',
      ort: 'ZZ-GRANSKNING-S91',
      eventRecordId: 'recBepsw4Qy9scfoj',
      // Grovfilter server-side (måste stå FÖRST i adressen, därav `= 1`);
      // emailPattern är finfiltret som avgör.
      emailSokPrefix: 'zz-granskning-',
      emailPattern: '^zz-granskning-\\d{2}@staging\\.test$',
      forvantat: { event: 1, anmalningar: 16, personer: 16 },
      stadad: { datum: '2026-07-31', av: 'TASK-95 (PR #493)' },
      kalla:
        'Handbyggd 2026-07-26 (S91, task-48 design-review). Mätt av TASK-88, ' +
        'omräknad av TASK-95 2026-07-30. Marcus godkände städning 2026-07-30. ' +
        'STÄDAD 2026-07-31 av TASK-95: 33 poster raderade (1 event + 16 ' +
        'anmälningar + 16 personer), efter-verifiering 0 kvar, oberoende ' +
        'bekräftat mot basen. De permanenta rollup-fixturerna byte-identiska ' +
        'före och efter.',
    },
    {
      namn: 'Skovde-S75',
      ort: 'Skövde',
      eventRecordId: 'recigcY12dDllUkYt',
      // `= 1` gör att detta prefix INTE fångar S91:s `zz-granskning-…`,
      // där `granskning-` står på position 4.
      emailSokPrefix: 'granskning-',
      emailPattern: '^granskning-[a-z0-9-]+@example\\.com$',
      forvantat: { event: 1, anmalningar: 6, personer: 3 },
      stadad: {
        datum: '2026-07-31',
        av: 'TASK-101 (Marcus-mandat; TASK-95 AC #5 lämnade raderingen öppen)',
      },
      kalla:
        'Handbyggd 2026-07-22 (S75 review-våg 1, betalningsvy-granskningen). ' +
        'Mätt av TASK-95 2026-07-30. Event-796, Ort "Skövde" — ett RIKTIGT ' +
        'ortsnamn, därav record-ID-ankaret. STÄDAD 2026-07-31 på Marcus ' +
        'uttryckliga mandat (TASK-95 lämnade raderingen öppen eftersom ' +
        'godkännandet 2026-07-30 löd ordagrant "Angående task-88", alltså ' +
        'endast S91): 6/6 anmälningar, 3/3 personer, 1/1 event raderade, ' +
        'efter-verifiering 0 radera-bara rader kvar (10 raderade).',
    },
  ],

  /** Inskickad-spridning bakåt i tiden (kön sorteras äldst först). */
  inskickadSpann: { aldstDagar: 35, senasteDagar: 2 },

  /**
   * PRODS OJÄMNHET, INTE PERFEKT UNIFORMITET (TASK-97).
   *
   * `ortKvot` är andelen anmälningar som bär `Ort`. Talet är MÄTT read-only
   * mot prod 2026-08-10: 53 av 65 personer i kohorten skapad efter 2026-06-01
   * hade Ort ifylld (82 %). E-post lämnas på 100 % — där är prod nästan
   * universell (660 av 662).
   *
   * VARFÖR INTE 100 % ÄVEN HÄR: ett staging där varje kort bär exakt samma
   * fält är MER enhetligt än verkligheten, och då ser man aldrig hur vyn
   * beter sig när fältet är tomt förrän i prod. Luckan är en del av facit.
   *
   * Fördelningen är deterministisk och index-baserad (aldrig slumpad) — se
   * harOrt. Samma flaggor ger alltid identisk fixtur, annars går varken en
   * granskning eller ett snapshot att återskapa.
   */
  realism: { ortKvot: 0.82 },

  /**
   * RIK-LÄGET (--rik, S103) — den granskningsperson som bär HELA kravbilden
   * (kontakt, flerhändig historik, hämtningar, motiveringar, anteckningar,
   * flagga). All literal text/alla data-värden för den bor HÄR, samma
   * konvention som namnpoolen ovan — logiken (buildRikPrimaryRad m.fl.) är
   * universell, projekt-värdena är inte det.
   *
   * TELEFON är ett MEDVETET AVSTEG från § DATAN SKA LIKNA VERKLIGHETEN ovan
   * ("TELEFON SEEDAS INTE"): den rika personens hela syfte är att bära
   * kontaktblockets tel-rad i granskningen (Marcus, 2026-08-10, se uppdraget).
   * Endast DENNA person får Telefon — batchens tunna personer förblir orörda,
   * Marcus ursprungliga beslut om personlistan gäller oförändrat där.
   */
  richPerson: {
    /**
     * Historik-eventens datum, DAGAR BAKÅT från körningsögonblicket (negeras
     * av byggaren innan de går in i `isoDatum` — funktionen hanterar negativa
     * `dagar` identiskt med positiva). Spridda över nästan ett år så "spridda
     * i tid" är bokstavligt sant, inte tre event skapade i samma sekund med
     * bara olika Startdatum-etikett.
     */
    historyDagarBak: [365, 180, 60],
    /**
     * Eventkälla per historik-event, i SAMMA ordning som historyDagarBak.
     * RIM 1 → RIM 2 (tvådagars, se historySessions) → Fjärrskådning ger en
     * läsbar berättelse ("gick RIM 1, sen RIM 2, provade Fjärrskådning") och
     * lämnar RIM 3 öppen för den kommande/primära anmälan (oförändrad
     * `config.select.eventSource`, satt av den vanliga batch-koden).
     */
    historyEventSources: ['Resor i medvetandet 1', 'Resor i medvetandet 2', 'Fjärrskådning'],
    /**
     * Sessionsrader per historik-event (Deltaganden). Index 1 (RIM 2) bär
     * TVÅ rader — AC-kravet "minst ett tvådagars-event, två sessionsrader på
     * samma event" (grupperaPerEvent, `PersonDetailPrototyp.tsx`). Index 2
     * (Fjärrskådning) sätts Frånvarande med flit: tredje närvaroläget utöver
     * Kommande (primär) och Närvarande (index 0+1).
     */
    historySessions: [
      [{ session: 'Dag 1', status: 'Närvarande' }],
      [
        { session: 'Dag 1', status: 'Närvarande' },
        { session: 'Dag 2', status: 'Närvarande' },
      ],
      [{ session: 'Dag 1', status: 'Frånvarande' }],
    ],
    /**
     * Motiveringstexter (`Varför vill du gå den här utbildningen?`), en per
     * ANMÄLAN — index 0–2 = historik-eventen (samma ordning som ovan), index
     * 3 = den primära/kommande anmälan. `Motivering (text)` på Personer är en
     * ROLLUP över ALLA personens anmälningar (data-model.md §46) — flera
     * ifyllda ger alltså FLERHET, det omätta ledet §46 själv efterlyser
     * ("ingen live-data har ännu visat den"). `null` = fältet lämnas tomt
     * (en realistisk lucka mitt i historiken — luckor är prods sanning, se
     * § DATAN SKA LIKNA VERKLIGHETEN ovan, inte bara batchens tunna rader).
     *
     * Längderna är AVSIKTLIGA (AC-krav): index 0 ligger i 400–600-tecken-
     * spannet (visar att motiveringsblocket klipper långtext), index 3 är
     * kort. validateConfig prövar båda gränserna mekaniskt.
     */
    motiveringar: [
      'Jag har länge känt att det finns mer att upptäcka bortom vardagens ' +
        'larm och har läst en hel del om medvetandeutveckling på egen hand, ' +
        'men känner att jag behöver vägledning och en trygg grupp för att ' +
        'våga ta nästa steg fullt ut. En vän som gick förra årets kurs ' +
        'berättade så varmt om vad det gav henne att jag bestämde mig direkt ' +
        'samma kväll. Jag hoppas kunna lära mig verktyg jag kan bära med mig ' +
        'i vardagen, inte bara under själva kursdagarna, och jag är nyfiken ' +
        'på att möta andra som befinner sig på samma inre resa som jag just ' +
        'nu gör, med samma frågor och samma försiktiga hopp om förändring.',
      'Efter RIM 1 kände jag att jag bara skrapat på ytan. Vill gå vidare ' +
        'med RIM 2 för att fördjupa andningsteknikerna och förstå mer av det ' +
        'som hände förra gången.',
      null,
      'Vill fördjupa mig ytterligare efter RIM 2 — kändes ofullständigt att ' + 'sluta där.',
    ],
    /** Personer.Flagga — Lottas fritext-flagga (S103, fldCXSGQJEVlf1Sa7). */
    flagga: 'Återkommande deltagare, mycket engagerad — har frågat om att bli kursledarassistent.',
    /** Personer.Telefon — se modulhuvudets avstegs-not ovan. */
    telefon: '070-233 14 56',
    /**
     * Touchpoints — kanal-/erbjudande-pooler, roterade över de tre raderna.
     * `Erbjudande`-värdena är basens PINNADE singleSelect-choices (live-
     * verifierade via describe_table 2026-08-10) — samma disciplin som
     * CONFIG.select, ingen typecast.
     */
    touchpointKanaler: ['Nyhetsbrev', 'Instagram', 'Hemsida'],
    touchpointErbjudanden: ['Meditationen Kraftfältet', 'Pyramidernas Vajrar', 'Annat'],
    /** Dagar bakåt per touchpoint — spridda OBEROENDE av händelseeventen. */
    touchpointDagarBak: [300, 150, 30],
    /**
     * Metadata-sentinel. Touchpoints har inget fält granskningen läser för
     * innehåll (till skillnad från Anteckningens `Anteckning`-text kan denna
     * bära en maskin-läsbar markör utan att bryta "ska likna verkligheten").
     * Används av städningen (stadaOrt) för att identifiera EXAKT de
     * touchpoints skriptet skapat, inte "alla touchpoints en fixturperson
     * råkar bära".
     */
    touchpointMetadataMarker: '[SEED-REVIEW-FIXTUR]',
    /**
     * Anteckningar — författare + text, tre rader. INGEN sentinel i texten
     * (skulle synas för Marcus vid granskning och motsäga "ska likna
     * verkligheten"-kravet) — se personDataLinkFields-kommentaren ovan för
     * vad det kostar: guarden blockerar automatisk radering av personen så
     * länge NÅGON anteckning finns kvar.
     */
    anteckningar: [
      {
        forfattare: 'Lotta',
        text:
          'Ringde och undrade om det gick att dela upp betalningen för RIM 2 ' +
          '— löste det med två delbetalningar.',
      },
      {
        forfattare: 'Roger',
        text:
          'Frågade om allergier inför övernattningen på Resor i medvetandet ' +
          '2. Noterat: laktosintolerant.',
      },
      {
        forfattare: 'Lotta',
        text:
          'Mycket engagerad deltagare som frågat om att bli kursledarassistent ' +
          'framöver — följ upp inför nästa kurstillfälle.',
      },
    ],
  },

  batchSize: 10,
  requestThrottleMs: 250,
  appBaseUrl: 'http://localhost:5173',

  /**
   * Namnpool. Index-rotationen ger unika par för väl över maxAnmalningar.
   *
   * Namnen bär numera OCKSÅ e-postadressen (`fornamn.efternamn@example.com`),
   * så varje namn måste reduceras till rena `[a-z]`-tecken av slugify —
   * annars matchar adressen inte det ankrade mönster clean litar på.
   * validateConfig prövar det mekaniskt, för hela poolen, vid varje körning.
   */
  fornamn: [
    'Astrid',
    'Bengt',
    'Cecilia',
    'David',
    'Elin',
    'Fredrik',
    'Gunilla',
    'Hassan',
    'Ingrid',
    'Johan',
    'Karin',
    'Lars',
    'Maja',
    'Nils',
    'Petra',
    'Rasmus',
    'Sofia',
    'Tobias',
    'Ulrika',
    'Viktor',
    'Yasmin',
    'Zara',
    'Åke',
    'Ärla',
    'Össur',
    'Bodil',
    'Erik',
    'Frida',
    'Gustav',
    'Hanna',
  ],
  efternamn: [
    'Almqvist',
    'Bergström',
    'Cederlund',
    'Dahlgren',
    'Ekström',
    'Fjellner',
    'Gunnarsson',
    'Hedlund',
    'Isaksson',
    'Jonsson',
    'Kvist',
    'Lindqvist',
    'Mattsson',
    'Nyberg',
    'Olsson',
    'Pettersson',
    'Rehn',
    'Sandberg',
    'Törnqvist',
    'Ullman',
    'Vikström',
    'Wallin',
    'Ödman',
    'Zetterlund',
  ],
};

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const BASE_ID_PATTERN = /^app[A-Za-z0-9]{14}$/;
const REC_ID_PATTERN = /^rec[A-Za-z0-9]{14}$/;
/** Ort används i filterByFormula — citattecken och backslash är bannlysta. */
const ORT_PATTERN = /^[A-Za-z0-9ÅÄÖåäöÉé _.:-]{3,60}$/;
/**
 * RFC 2606 § 3 — permanent reserverade av IANA för dokumentation och exempel.
 * Listan är sluten och kan inte utökas från kommandoraden: den är hela grunden
 * för att en realistisk fixtur-adress bevisbart aldrig kan vara en kunds.
 */
const RESERVERADE_EMAILDOMANER = ['example.com', 'example.org', 'example.net'];

// ---------------------------------------------------------------------------
// Pura funktioner (exporterade för scripts/test-seed-review-fixture.mjs)
// ---------------------------------------------------------------------------

/**
 * Är strängen ett GILTIGT ISO-datum (YYYY-MM-DD)? Kalender-validerat, inte
 * bara formmässigt: `2026-02-31` passerar regexen men finns inte, och Date
 * normaliserar den tyst till 2026-03-03 — jämförelsen fångar det.
 */
export function arIsoDatum(varde) {
  if (typeof varde !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(varde)) return false;
  const d = new Date(`${varde}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === varde;
}

/**
 * Avslutningens klartext för en städad post — EN formulering, tre konsumenter
 * (skipped-orsaken i planen, korLegacys utskrift, registrets översikt). Att
 * den bor på ett ställe är poängen: en avslutad post får aldrig beskrivas som
 * aktiv i någon av dem.
 */
export function avslutningsOrsak(post) {
  return `posten är AVSLUTAD — fixturen städades ${post.stadad.datum} (${post.stadad.av})`;
}

/**
 * Registrets poster med sitt TILLSTÅND utskrivet. Används i felmeddelandet för
 * ett okänt `--legacy`-namn: en lista som räknar upp avslutade poster utan att
 * märka dem hade fått en läsare att tro att fixturerna ligger kvar.
 */
export function legacyRegisterOversikt(config) {
  const poster = config?.legacy ?? [];
  if (poster.length === 0) return '(registret är tomt)';
  return poster
    .map((p) => (p.stadad ? `${p.namn} (AVSLUTAD ${p.stadad.datum})` : `${p.namn} (aktiv)`))
    .join(', ');
}

/** Skyddsräcke 1: bas-guarden + CONFIG-formen. Kastar vid fel. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('config: förväntade ett objekt');
  const { expectedBaseId, forbiddenBaseIds, eventformatRecordId, protectedRecordIds } = config;
  if (!BASE_ID_PATTERN.test(expectedBaseId ?? '')) {
    throw new Error(`bas-guard: expectedBaseId "${expectedBaseId}" är inte app-formad`);
  }
  if (!Array.isArray(forbiddenBaseIds) || forbiddenBaseIds.length === 0) {
    throw new Error('bas-guard: forbiddenBaseIds saknas — prod-basen måste vara blockerad');
  }
  if (forbiddenBaseIds.includes(expectedBaseId)) {
    throw new Error(
      `bas-guard: expectedBaseId "${expectedBaseId}" är BLOCKERAD (forbiddenBaseIds)`,
    );
  }
  if (!REC_ID_PATTERN.test(eventformatRecordId ?? '')) {
    throw new Error(
      `eventformatRecordId "${eventformatRecordId}" är inte rec-formad — Eventtyp-länken KRÄVS vid create (ADR-066 b5)`,
    );
  }
  if (
    !Array.isArray(protectedRecordIds) ||
    !protectedRecordIds.every((i) => REC_ID_PATTERN.test(i))
  ) {
    throw new Error(
      'protectedRecordIds måste vara en lista av rec-ID:n (de permanenta fixturerna)',
    );
  }
  for (const [nyckel, varde] of Object.entries(config.select ?? {})) {
    if (typeof varde !== 'string' || varde.length === 0) {
      throw new Error(
        `select.${nyckel} saknas — select-värden måste vara pinnade (ingen typecast)`,
      );
    }
  }
  if (!(config.belaggning?.maxKvot > 0) || config.belaggning.maxKvot >= 1) {
    throw new Error('belaggning.maxKvot måste ligga i (0, 1) — A6 larmar vid 100 %');
  }
  // TASK-97: realismen vilar HELT på att domänen är RFC 2606 § 3-reserverad.
  // En adress på example.com/.org/.net kan aldrig tilldelas någon; en adress
  // på vilken annan domän som helst kan det, och då är "ser äkta ut" inte
  // längre gratis utan en risk. Guarden är därför en allowlist, inte en
  // formkontroll.
  const { emailDomains } = config.marker ?? {};
  if (!Array.isArray(emailDomains) || emailDomains.length === 0) {
    throw new Error('marker.emailDomains saknas — fixtur-adresserna måste ha en domän');
  }
  for (const doman of emailDomains) {
    if (!RESERVERADE_EMAILDOMANER.includes(doman)) {
      throw new Error(
        `marker.emailDomains: "${doman}" är inte RFC 2606 § 3-reserverad (${RESERVERADE_EMAILDOMANER.join(', ')}) — ` +
          'en icke-reserverad domän kan tilldelas en verklig mottagare',
      );
    }
  }
  // Namnen bär e-postadressens local-part sedan TASK-97. Reduceras ett namn
  // inte till rena [a-z] matchar adressen inte det ankrade mönstret, och clean
  // hade lämnat kvar sin egen rad med orsaken "e-post matchar inte
  // fixtur-mönstret" — tyst, och först vid städningen.
  for (const nyckel of ['fornamn', 'efternamn']) {
    const pool = config[nyckel];
    if (!Array.isArray(pool) || pool.length === 0) {
      throw new Error(`${nyckel} saknas — namnpoolen bär både namnet och e-postadressen`);
    }
    for (const namn of pool) {
      if (!/^[a-z]+$/.test(slugify(String(namn)))) {
        throw new Error(
          `${nyckel}: "${namn}" reduceras till "${slugify(String(namn))}" — e-postadressens ` +
            'local-part måste bli rena [a-z] (annars matchar cleanens ankrade mönster inte)',
        );
      }
    }
  }
  if (!(config.realism?.ortKvot > 0) || config.realism.ortKvot > 1) {
    throw new Error('realism.ortKvot måste ligga i (0, 1] — den är andelen rader som bär Ort');
  }
  for (const nyckel of ['eventAnmalningar', 'anmalanPerson', 'personAnmalningar']) {
    if (typeof config.linkFields?.[nyckel] !== 'string' || config.linkFields[nyckel].length === 0) {
      throw new Error(
        `linkFields.${nyckel} saknas — länkgrafen är cleanens bärande identifiering (TASK-97)`,
      );
    }
  }
  const { dagarDefault, maxDagar, stampelPrefix } = config.livstid ?? {};
  if (!Number.isInteger(dagarDefault) || dagarDefault < 1 || dagarDefault > (maxDagar ?? 0)) {
    throw new Error(
      `livstid.dagarDefault måste vara ett heltal 1–${maxDagar} — utan livstid har fixturen ingen avslutning`,
    );
  }
  if (typeof stampelPrefix !== 'string' || !stampelPrefix.startsWith('[')) {
    throw new Error('livstid.stampelPrefix måste vara en [-inledd sträng (läses ur Noteringen)');
  }
  // Legacy-registret: varje post måste bära alla fyra ankarna, och mönstret
  // måste vara ankrat i BÅDA ändar. Ett oankrat mönster matchar delsträngar
  // och kunde träffa en riktig adress — det är hela skälet posterna finns i
  // kod i stället för på kommandoraden.
  for (const post of config.legacy ?? []) {
    const namn = post?.namn ?? '(namnlös)';
    if (!ORT_PATTERN.test(post?.ort ?? '')) {
      throw new Error(
        `legacy[${namn}].ort "${post?.ort}" avvisas — värdet går in i filterByFormula`,
      );
    }
    if (!REC_ID_PATTERN.test(post?.eventRecordId ?? '')) {
      throw new Error(
        `legacy[${namn}].eventRecordId saknas eller är inte rec-formad — record-ID-ankaret är obligatoriskt`,
      );
    }
    if (
      typeof post?.emailPattern !== 'string' ||
      !post.emailPattern.startsWith('^') ||
      !post.emailPattern.endsWith('$')
    ) {
      throw new Error(
        `legacy[${namn}].emailPattern måste vara ankrat i BÅDA ändar (^…$) — ett oankrat mönster matchar delsträngar`,
      );
    }
    // Grovfiltret går in i filterByFormula — citattecken och backslash är
    // bannlysta av samma skäl som i ORT_PATTERN.
    if (!/^[a-z0-9+._-]{3,40}$/.test(post?.emailSokPrefix ?? '')) {
      throw new Error(
        `legacy[${namn}].emailSokPrefix saknas eller bär otillåtna tecken (värdet går in i filterByFormula)`,
      );
    }
    // KRAVET STÅR OFÖRÄNDRAT och gäller ÄVEN avslutade poster (TASK-101). För
    // en aktiv post är räkningen guarden; för en avslutad är den historiken —
    // vad som fanns när posten mättes. Att nollställa den vid avslutning hade
    // kastat mätningen och gjort posten oläsbar som historik.
    for (const nyckel of ['event', 'anmalningar', 'personer']) {
      if (!Number.isInteger(post?.forvantat?.[nyckel]) || post.forvantat[nyckel] < 0) {
        throw new Error(
          `legacy[${namn}].forvantat.${nyckel} saknas — räkningen är guarden, inte en anteckning`,
        );
      }
    }
    // Avslutningen (TASK-101). Fältet är valfritt — men finns det måste BÅDA
    // halvorna hålla. En avslutning utan datum eller landnings-referens är en
    // PÅSTÅDD avslutning, alltså exakt den klass av värde detta fält finns för
    // att avskaffa.
    if (post?.stadad !== undefined) {
      if (post.stadad === null || typeof post.stadad !== 'object') {
        throw new Error(
          `legacy[${namn}].stadad måste vara ett objekt { datum, av } — utelämna fältet för en aktiv post`,
        );
      }
      if (!arIsoDatum(post.stadad.datum)) {
        throw new Error(
          `legacy[${namn}].stadad.datum "${post.stadad.datum}" är inget giltigt ISO-datum (YYYY-MM-DD)`,
        );
      }
      if (typeof post.stadad.av !== 'string' || post.stadad.av.trim().length === 0) {
        throw new Error(
          `legacy[${namn}].stadad.av saknas — en avslutning utan landnings-referens går inte att spåra tillbaka`,
        );
      }
    }
  }
  // RIK-LÄGET (--rik, S103): historik-plan + motiverings-/anteckningsdata
  // måste vara internt konsistenta INNAN skriptet kör en enda begäran —
  // samma "fail loud, aldrig gissa"-disciplin som resten av validateConfig.
  const rp = config.richPerson ?? {};
  const historyN = rp.historyDagarBak?.length ?? 0;
  if (historyN === 0) {
    throw new Error('richPerson.historyDagarBak saknas — --rik kräver minst ett historik-event');
  }
  if (!rp.historyDagarBak.every((d) => Number.isInteger(d) && d > 0)) {
    throw new Error('richPerson.historyDagarBak måste vara positiva heltal (dagar BAKÅT)');
  }
  if (rp.historyEventSources?.length !== historyN) {
    throw new Error(
      `richPerson.historyEventSources måste ha samma längd som historyDagarBak (${historyN})`,
    );
  }
  if (!rp.historyEventSources.every((s) => typeof s === 'string' && s.length > 0)) {
    throw new Error(
      'richPerson.historyEventSources: varje post måste vara en icke-tom sträng (pinnat ' +
        'Event (source)-choice — ingen typecast)',
    );
  }
  if (rp.historySessions?.length !== historyN) {
    throw new Error(
      `richPerson.historySessions måste ha samma längd som historyDagarBak (${historyN})`,
    );
  }
  for (const [i, sessioner] of rp.historySessions.entries()) {
    if (!Array.isArray(sessioner) || sessioner.length === 0) {
      throw new Error(`richPerson.historySessions[${i}] måste ha minst en sessionsrad`);
    }
    for (const s of sessioner) {
      if (typeof s?.session !== 'string' || typeof s?.status !== 'string') {
        throw new Error(
          `richPerson.historySessions[${i}] bär en rad utan session/status — båda krävs`,
        );
      }
    }
  }
  // Minst ETT historik-event måste bära ≥2 sessionsrader — AC-kravet om ett
  // synligt tvådagars-event (grupperaPerEvent). Fångas här, inte upptäckt
  // först i browsern.
  if (!rp.historySessions.some((s) => s.length >= 2)) {
    throw new Error(
      'richPerson.historySessions: inget historik-event bär ≥2 sessionsrader — ' +
        'AC-kravet "minst ett tvådagars-event" är då inte uppfyllt',
    );
  }
  // Motiveringarna: N historik-event + 1 primär/kommande anmälan.
  if (rp.motiveringar?.length !== historyN + 1) {
    throw new Error(
      `richPerson.motiveringar måste ha längd historyDagarBak.length + 1 (${historyN + 1}) — ` +
        'en post per historik-anmälan plus den primära',
    );
  }
  const ifyllda = rp.motiveringar.filter((m) => typeof m === 'string' && m.length > 0);
  if (ifyllda.length < 2) {
    throw new Error('richPerson.motiveringar: minst två måste vara ifyllda (kort + lång, AC-krav)');
  }
  if (!ifyllda.some((m) => m.length >= 400 && m.length <= 600)) {
    throw new Error(
      'richPerson.motiveringar: minst en text måste ligga i 400–600-teckenspannet (AC-kravet ' +
        'om att motiveringsblockets klipp ska synas)',
    );
  }
  if (!ifyllda.some((m) => m.length < 150)) {
    throw new Error('richPerson.motiveringar: minst en text måste vara kort (< 150 tecken)');
  }
  for (const m of rp.motiveringar) {
    if (m !== null && typeof m !== 'string') {
      throw new Error('richPerson.motiveringar: varje post måste vara en sträng eller null');
    }
  }
  if (typeof rp.flagga !== 'string' || rp.flagga.length === 0) {
    throw new Error('richPerson.flagga saknas — Personer.Flagga kräver ett värde för --rik');
  }
  if (typeof rp.telefon !== 'string' || rp.telefon.length === 0) {
    throw new Error('richPerson.telefon saknas — kontaktblockets tel-rad kräver ett värde');
  }
  for (const nyckel of ['touchpointKanaler', 'touchpointErbjudanden', 'touchpointDagarBak']) {
    if (!Array.isArray(rp[nyckel]) || rp[nyckel].length === 0) {
      throw new Error(`richPerson.${nyckel} saknas eller är tom`);
    }
  }
  if (
    rp.touchpointKanaler.length !== rp.touchpointErbjudanden.length ||
    rp.touchpointErbjudanden.length !== rp.touchpointDagarBak.length
  ) {
    throw new Error(
      'richPerson: touchpointKanaler/touchpointErbjudanden/touchpointDagarBak måste ha samma längd',
    );
  }
  if (!rp.touchpointDagarBak.every((d) => Number.isInteger(d) && d > 0)) {
    throw new Error('richPerson.touchpointDagarBak måste vara positiva heltal (dagar BAKÅT)');
  }
  for (const nyckel of ['touchpointKanaler', 'touchpointErbjudanden']) {
    if (!rp[nyckel].every((v) => typeof v === 'string' && v.length > 0)) {
      throw new Error(`richPerson.${nyckel}: varje post måste vara en icke-tom sträng`);
    }
  }
  if (
    typeof rp.touchpointMetadataMarker !== 'string' ||
    !rp.touchpointMetadataMarker.startsWith('[')
  ) {
    throw new Error('richPerson.touchpointMetadataMarker måste vara en [-inledd sträng');
  }
  if (!Array.isArray(rp.anteckningar) || rp.anteckningar.length === 0) {
    throw new Error('richPerson.anteckningar saknas — --rik kräver minst en anteckningsrad');
  }
  const forfattare = new Set();
  for (const [i, a] of rp.anteckningar.entries()) {
    if (typeof a?.forfattare !== 'string' || a.forfattare.length === 0) {
      throw new Error(`richPerson.anteckningar[${i}].forfattare saknas`);
    }
    if (typeof a?.text !== 'string' || a.text.length === 0) {
      throw new Error(`richPerson.anteckningar[${i}].text saknas`);
    }
    forfattare.add(a.forfattare);
  }
  if (forfattare.size < 2) {
    throw new Error(
      'richPerson.anteckningar: minst två OLIKA författare krävs (AC-kravet "olika författare")',
    );
  }
  return config;
}

/** Tolka argv. Kastar med läsbart fel vid ogiltig inmatning. */
export function parseArgs(argv, config) {
  const args = {
    clean: argv.includes('--clean'),
    dryRun: argv.includes('--dry-run'),
    /** Kör ENDAST förfallo-svepet — inget skapas, ingen namngiven ort städas. */
    sweep: argv.includes('--sweep'),
    /** Stäng av det automatiska svepet i create/clean. */
    ingenSvep: argv.includes('--ingen-svep'),
    /**
     * Legacy-läget raderar först med --bekrafta. Utan den är det dry-run.
     * Kortets krav "aktivt val och dry-run först" mekaniseras därmed i stället
     * för att stå som en uppmaning: den farliga vägen kräver ETT extra ord,
     * och den ofarliga är default.
     */
    bekrafta: argv.includes('--bekrafta'),
    /**
     * RIK-LÄGET (S103) — lägger en EXTRA person med hela kravbilden (kontakt,
     * flerhändig historik, hämtningar, motiveringar, anteckningar, flagga)
     * ovanpå den vanliga batchen. Additiv modifierare till create, ALDRIG ett
     * eget läge — kan bara anges tillsammans med det vanliga create-flödet
     * (se mutex-kontrollen nedan).
     */
    rik: argv.includes('--rik'),
    legacy: null,
    ort: config.defaults.ort,
    bekraftade: config.defaults.bekraftade,
    obekraftade: config.defaults.obekraftade,
    dagar: config.defaults.dagar,
    livstid: config.livstid.dagarDefault,
  };
  const tal = (namn, ravarde, { min, max }) => {
    const n = Number(ravarde);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw new Error(`--${namn} måste vara ett heltal ${min}–${max} (fick "${ravarde}")`);
    }
    return n;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flagga = argv[i];
    const varde = argv[i + 1];
    switch (flagga) {
      case '--ort':
        if (!ORT_PATTERN.test(varde ?? '')) {
          throw new Error(
            `--ort "${varde}" avvisas: 3–60 tecken, inga citattecken (värdet går in i filterByFormula)`,
          );
        }
        args.ort = varde;
        i += 1;
        break;
      case '--bekraftade':
        args.bekraftade = tal('bekraftade', varde, { min: 0, max: config.limits.maxAnmalningar });
        i += 1;
        break;
      case '--obekraftade':
        args.obekraftade = tal('obekraftade', varde, { min: 0, max: config.limits.maxAnmalningar });
        i += 1;
        break;
      case '--dagar':
        args.dagar = tal('dagar', varde, { min: 0, max: 365 });
        i += 1;
        break;
      case '--livstid':
        args.livstid = tal('livstid', varde, { min: 1, max: config.livstid.maxDagar });
        i += 1;
        break;
      case '--legacy': {
        const post = (config.legacy ?? []).find((p) => p.namn === varde);
        if (!post) {
          const kanda = legacyRegisterOversikt(config);
          throw new Error(
            `--legacy "${varde}" finns inte i registret. Kända poster: ${kanda}. ` +
              'Registret är avsiktligt slutet — en handbyggd fixtur läggs till i CONFIG.legacy ' +
              'med mätt räkning, aldrig som ett mönster på kommandoraden.',
          );
        }
        args.legacy = post;
        i += 1;
        break;
      }
      default:
        break;
    }
  }
  // Lägena är ömsesidigt uteslutande — annars blir det tvetydigt vad --ort styr.
  const lagen = [
    args.clean && '--clean',
    args.sweep && '--sweep',
    args.legacy && '--legacy',
  ].filter(Boolean);
  if (lagen.length > 1) {
    throw new Error(`${lagen.join(' och ')} kan inte kombineras — välj ETT läge`);
  }
  // --rik gäller ENDAST create — den lägger till en person i samma batch och
  // har ingen mening i något av de andra lägena (de rör inte skapande alls).
  if (args.rik && lagen.length > 0) {
    throw new Error(`--rik kan inte kombineras med ${lagen.join(' eller ')} — --rik gäller create`);
  }
  // Fail-safe: --dry-run vinner ALLTID över --bekrafta. Anges båda är avsikten
  // att titta, inte att radera.
  if (args.dryRun) args.bekrafta = false;
  const totalt = args.bekraftade + args.obekraftade;
  if (!args.clean && !args.sweep && !args.legacy && totalt === 0) {
    throw new Error('--bekraftade + --obekraftade är 0 — inget att skapa');
  }
  if (totalt > config.limits.maxAnmalningar) {
    throw new Error(
      `--bekraftade + --obekraftade = ${totalt} överskrider taket ${config.limits.maxAnmalningar}`,
    );
  }
  return args;
}

/**
 * Namn eller ort → slug. Endast [a-z0-9-], så den är formel- och
 * e-post-säker: `Skövde` → `skovde`, `Törnqvist` → `tornqvist`.
 *
 * Sedan TASK-97 bär den också e-postadressens local-part. validateConfig
 * prövar hela namnpoolen mot `^[a-z]+$` — ett namn som skulle ge bindestreck
 * eller siffra avvisas där, inte tyst här.
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fixturens e-postadress: `fornamn.efternamn@example.com`.
 *
 * Domänen roteras över de RFC 2606-reserverade så listan inte ser
 * maskinstansad ut. INGET löpnummer, och det är ett val: namnparen är unika
 * över hela `limits.maxAnmalningar` (index-rotationen har period 120), och
 * testsviten prövar unikheten mot taket. Ett kollisions-suffix hade varit en
 * mekanism utan fall — och en siffra mitt i en adress som ska se äkta ut.
 */
export function fixtureEmail(fornamn, efternamn, index, marker) {
  const doman = marker.emailDomains[index % marker.emailDomains.length];
  return `${slugify(fornamn)}.${slugify(efternamn)}@${doman}`;
}

/**
 * ANDRA SPÄRREN (TASK-97), aldrig den bärande identifieringen — den går via
 * länkgrafen, se § IDENTIFIERINGEN överst.
 *
 * Mönstret känner igen de TVÅ former skriptet någonsin skrivit:
 *   1. `fornamn.efternamn@example.(com|org|net)` — nuvarande
 *   2. `seed-review+<ort-slug>-NN@granskning.test` — pre-TASK-97
 *
 * Form 2 står kvar för att fixturer som redan ligger i staging ska förbli
 * städbara: hade mönstret bara känt igen den nya formen vore varje befintlig
 * granskningsfixtur ostädbar från och med den commit som gjorde adressen
 * snygg. Det är strikt en igenkänning — skriptet skriver aldrig form 2.
 *
 * Båda är ankrade i BÅDA ändar. `granskning-review@example.com` (legacy-
 * registrets Skövde-fixtur) matchar INTE form 1: den saknar punkten mellan
 * två rena bokstavsled.
 */
export function fixtureEmailPattern(marker) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nyForm = `[a-z]+\\.[a-z]+@(?:${marker.emailDomains.map(esc).join('|')})`;
  const tidigareForm = `${esc(marker.tidigareEmailPrefix)}[a-z0-9-]+-\\d{2,3}${esc(marker.tidigareEmailDomain)}`;
  return new RegExp(`^(?:${nyForm}|${tidigareForm})$`);
}

/**
 * filterByFormula som grovsorterar KANDIDATER för föräldralös-vägen
 * server-side (TASK-97). Den är INTE längre cleanens ingång — grafen är det —
 * och den kan därför inte längre koda orten. Finfiltret är
 * fixtureEmailPattern, och föräldralösheten avgörs i arForaldralosFixturperson.
 */
export function fixtureEmailFormula(marker) {
  const villkor = [
    ...marker.emailDomains.map((d) => `FIND('@${d}', {E-post}) > 0`),
    `FIND('${marker.tidigareEmailDomain}', {E-post}) > 0`,
  ];
  return `OR(${villkor.join(', ')})`;
}

/**
 * Bär rad `index` en `Ort`? Prods ojämnhet, deterministiskt återskapad.
 *
 * Formen är Bresenhams: luckorna sprids JÄMNT i stället för att klumpa ihop
 * sig i slutet, antalet blir exakt `floor(n × (1 − kvot))` över n rader, och
 * rad 0 bär alltid Ort — listans första rad ska inte se trasig ut. Ingen
 * slump: samma index ger samma svar i varje körning, i varje process.
 */
export function harOrt(index, kvot) {
  const luckKvot = 1 - kvot;
  return Math.floor(index * luckKvot) === Math.floor((index + 1) * luckKvot);
}

/**
 * filterByFormula som hämtar ALLA event skriptet självt skapat — svepets
 * ingång. Sentineln står först i Noteringen, därav `= 1`.
 */
export function sweepEventFormula(marker) {
  return `FIND('${marker.noteringSentinel}', {Notering}) = 1`;
}

/** filterByFormula som grovsorterar en legacy-posts rader server-side. */
export function legacyEmailFormula(post) {
  return `FIND('${post.emailSokPrefix}', LOWER({E-post} & '')) = 1`;
}

/**
 * Skyddsräcke 2 (fälla 1): korsläs fixturens markörer mot den SKARPA
 * purge-policyn. Träff = fixturen skulle raderas av setup-purgen mitt under
 * granskningen. Returnerar kollisionerna; tom lista = säkert.
 */
export function purgeCollisions(samples, purgePolicy) {
  const kollisioner = [];
  for (const target of purgePolicy?.targets ?? []) {
    for (const sample of samples) {
      if (sample.table !== target.table || sample.field !== target.exactMatchField) continue;
      if (new RegExp(target.exactMatchPattern).test(sample.value)) {
        kollisioner.push({ target: target.name, field: sample.field, value: sample.value });
      }
    }
  }
  return kollisioner;
}

/** ISO-datum (YYYY-MM-DD) `dagar` dagar efter `fran`. */
export function isoDatum(fran, dagar) {
  const d = new Date(fran);
  d.setUTCDate(d.getUTCDate() + dagar);
  return d.toISOString().slice(0, 10);
}

/**
 * Utgångsstämpelns text för ett givet datum: `[UTGÅR: 2026-08-13]`.
 *
 * Kastar vid ogiltigt datum i stället för att foga in det. En stämpel som
 * lyder `[UTGÅR: undefined]` är oläsbar för parseUtgangsdatum, och en oläsbar
 * stämpel betyder "rör aldrig" — fixturen hade alltså blivit odödlig, tyst.
 * Det är precis det felet denna funktion finns för att göra omöjligt.
 */
export function utgangsstampel(datum, livstid) {
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    throw new Error(`utgangsstampel: "${datum}" är inte ett ISO-datum (YYYY-MM-DD)`);
  }
  return `${livstid.stampelPrefix} ${datum}]`;
}

/**
 * Läs utgångsdatumet ur en Notering. Returnerar `'YYYY-MM-DD'` eller `null`.
 *
 * `null` betyder ALLTID "rör aldrig" för svepet, och täcker tre skilda fall
 * med samma svar: ingen stämpel alls (handbyggd fixtur, eller en skapad före
 * TASK-95), en trasig stämpel, och ett formmässigt korrekt men obefintligt
 * datum (`2026-02-31`). Ett oläsbart datum får ALDRIG tolkas som förfallet —
 * fail-safe-riktningen är densamma som resten av skriptets.
 */
export function parseUtgangsdatum(notering, config) {
  if (typeof notering !== 'string') return null;
  const prefix = config.livstid.stampelPrefix;
  const start = notering.indexOf(prefix);
  if (start === -1) return null;
  const slut = notering.indexOf(']', start + prefix.length);
  if (slut === -1) return null;
  const ravarde = notering.slice(start + prefix.length, slut).trim();
  // Kalender-valideringen bor i arIsoDatum — samma prövning som avslutningens
  // datum, så de två kan inte drifta isär.
  return arIsoDatum(ravarde) ? ravarde : null;
}

/**
 * Klassa fixtur-event mot dagens datum. Tre utfall — och bara ETT av dem
 * leder till radering.
 *
 * Detta är den tvåsidiga halvan AC #3 kräver: `forfallna` är "städar när den
 * ska", `aktiva` är "rör INTE en fixtur vars granskning pågår". Att båda
 * listorna returneras i stället för bara den första är med flit — anroparen
 * ska kunna RAPPORTERA vad den lät stå, inte bara vad den tog.
 *
 * Jämförelsen är strikt (`idag > utgår`): en fixtur som går ut IDAG får dagen
 * ut. Granskningen kan pågå just nu.
 */
export function planSweep({ events, idag, config }) {
  const plan = { forfallna: [], aktiva: [], utanStampel: [] };
  const idagIso = idag.toISOString().slice(0, 10);
  for (const rec of events) {
    const notering = rec.fields?.Notering;
    const ort = rec.fields?.Ort;
    // Sentineln är förutsättningen: svepet rör ALDRIG något utanför skriptets
    // egna fixturer. En handbyggd fixtur är legacy-registrets område.
    if (typeof notering !== 'string' || !notering.startsWith(config.marker.noteringSentinel)) {
      continue;
    }
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.utanStampel.push({ id: rec.id, ort, orsak: 'skyddad record-ID' });
      continue;
    }
    const utgar = parseUtgangsdatum(notering, config);
    if (utgar === null) {
      plan.utanStampel.push({ id: rec.id, ort, orsak: 'ingen läsbar utgångsstämpel' });
      continue;
    }
    if (idagIso > utgar) plan.forfallna.push({ id: rec.id, ort, utgar });
    else plan.aktiva.push({ id: rec.id, ort, utgar });
  }
  return plan;
}

/**
 * Klassa rader mot EN legacy-registerpost.
 *
 * Skillnaden mot planClean är eventets ankring: här krävs att record-ID:t
 * matchar registrets, INTE bara Orten. Det är bärande för `Skovde-S75`, vars
 * Ort (`Skövde`) är ett riktigt ortsnamn — ett framtida verkligt Skövde-event
 * skulle träffas av ort-filtret men aldrig av ID-ankaret.
 *
 * En post märkt `stadad` (TASK-101) ger ALLTID en tom raderingsplan — se
 * skyddsräcke 7 i kroppen.
 */
export function planLegacyClean({ events, registrations, persons, post, config }) {
  const pattern = new RegExp(post.emailPattern);
  const plan = { events: [], registrations: [], persons: [], skipped: [] };

  /*
   * SKYDDSRÄCKE 7 (TASK-101) — en AVSLUTAD post får en TOM raderingsplan, och
   * spärren sitter HÄR i stället för i korLegacy med flit: varje väg till en
   * legacy-radering går genom denna funktion, så en framtida anropare kan
   * inte råka kringgå avslutningen.
   *
   * Att en avslutad post ändå ser rader betyder INTE att den gamla fixturen
   * återuppstått — Airtable återanvänder inte record-ID:n. Det betyder att
   * någon skapat NY data som råkar matcha ett gammalt ankare, och att radera
   * den vore att radera någon annans arbete med ett ankare som inte längre
   * beskriver något. Fail-safe-riktningen är densamma som resten av skriptets:
   * hellre lämna kvar.
   */
  if (post?.stadad) {
    const orsak = avslutningsOrsak(post);
    for (const rec of [...events, ...registrations, ...persons]) {
      plan.skipped.push({ id: rec.id, orsak });
    }
    return plan;
  }

  for (const rec of events) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID' });
    } else if (rec.id !== post.eventRecordId) {
      plan.skipped.push({
        id: rec.id,
        orsak: `record-ID matchar inte registrets ankare ${post.eventRecordId}`,
      });
    } else if (rec.fields?.Ort !== post.ort) {
      plan.skipped.push({
        id: rec.id,
        orsak: `Ort "${rec.fields?.Ort}" matchar inte registrets "${post.ort}"`,
      });
    } else {
      plan.events.push(rec.id);
    }
  }
  for (const rec of registrations) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID' });
    } else if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skipped.push({ id: rec.id, orsak: 'e-post matchar inte registrets mönster' });
    } else {
      plan.registrations.push(rec.id);
    }
  }
  for (const rec of persons) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skipped.push({ id: rec.id, orsak: 'skyddad record-ID (permanent fixtur)' });
      continue;
    }
    if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skipped.push({ id: rec.id, orsak: 'e-post matchar inte registrets mönster' });
      continue;
    }
    const lankar = personLinkGuardTrips(rec, config.personDataLinkFields);
    if (lankar.length > 0) {
      plan.skipped.push({ id: rec.id, orsak: `länk-guard: ${lankar.join(', ')}` });
      continue;
    }
    plan.persons.push(rec.id);
  }
  return plan;
}

/**
 * Jämför en legacy-plan mot registrets mätta räkning. Returnerar en lista
 * avvikelser; tom lista = basen ser ut som när posten mättes.
 *
 * Detta är legacy-lägets skarpaste guard, och skälet är TASK-76: en oräknad
 * massradering mot en delad bas är det farliga. Räkningen gör "räkna FÖRE du
 * raderar" till en mekanism i stället för en uppmaning — avviker basen från
 * mätningen har något ändrats sedan dess, och då ska en människa titta.
 *
 * GÄLLER ENDAST AKTIVA POSTER (TASK-101). korLegacy returnerar före denna
 * guard för en `stadad` post: där är noll träffar det väntade utfallet, och
 * fällningen hade beskrivit ett normaltillstånd som ett fel. Funktionen är
 * ren och räknar på det den får — spärren sitter hos anroparen och i
 * planLegacyClean, inte här.
 */
export function legacyRakningsavvikelser(plan, post) {
  const faktiskt = {
    event: plan.events.length,
    anmalningar: plan.registrations.length,
    personer: plan.persons.length,
  };
  return Object.entries(post.forvantat)
    .filter(([nyckel, vantat]) => faktiskt[nyckel] !== vantat)
    .map(([nyckel, vantat]) => `${nyckel}: förväntade ${vantat}, fann ${faktiskt[nyckel]}`);
}

/** ISO-timestamp `dagar` dagar före `fran`, klockslaget stabilt per index. */
export function isoTidBakat(fran, dagar, timmeOffset = 0) {
  const d = new Date(fran);
  d.setUTCDate(d.getUTCDate() - dagar);
  d.setUTCHours(7 + (timmeOffset % 9), (timmeOffset * 7) % 60, 0, 0);
  return d.toISOString();
}

/**
 * Kapacitet (fälla 4): tillräckligt hög för att `Anmäld beläggning (%)` aldrig
 * ska nå 100 % och trigga A6:s fullbokat-notis. Rundas upp till jämna tiotal
 * så eventet ser mänskligt planerat ut.
 */
export function kapacitetFor(totaltAntal, belaggning) {
  const kravd = Math.ceil(totaltAntal / belaggning.maxKvot);
  const jamnad = Math.ceil(Math.max(kravd, belaggning.minPlatser) / 10) * 10;
  return jamnad;
}

/**
 * Eventets fält.
 *
 * `Månad/år` sätts ALDRIG. Appens månadsgruppering härleds klient-sidan ur
 * `Startdatum`, och fältet är ett manuellt singleSelect (data-model § Kända
 * fällor 36 + 45) — att sätta det kräver en giltig option som inte går att
 * läsa utan schema-scope, och en gissad option ger 422 (ingen typecast).
 * Det befintliga granskningseventet bär fältet tomt och renderar rätt.
 *
 * `status`/`eventSource` är valfria overrides (RIK-LÄGET, S103): historik-
 * event är GENOMFÖRDA (inte `Planerat`) och varierar kursnamn (RIM 1/RIM 2/
 * Fjärrskådning) för en läsbar berättelse. Default oförändrat — den vanliga
 * batchens enda anrop får exakt samma fält som innan denna utökning.
 */
export function buildEvent({
  ort,
  startdatum,
  slutdatum,
  maxPlatser,
  utgangsdatum,
  config,
  status = config.select.eventStatus,
  eventSource = config.select.eventSource,
}) {
  return {
    'Event (source)': eventSource,
    Typ: config.select.eventTyp,
    Ort: ort,
    Startdatum: startdatum,
    Slutdatum: slutdatum,
    Status: status,
    'Max antal platser': maxPlatser,
    Eventtyp: [config.eventformatRecordId],
    // Sentineln FÖRST (isFixtureEvent kräver det), stämpeln direkt efter.
    // Stämpeln är maskinläsbar och står före prosan med flit: den är det enda
    // i strängen någon mekanism läser.
    Notering:
      `${config.marker.noteringSentinel} ${utgangsstampel(utgangsdatum, config.livstid)} ` +
      'Granskningsfixtur skapad av scripts/seed-review-fixture.mjs. Syntetisk data i ' +
      `staging — städas av förfallo-svepet vid nästa körning efter ${utgangsdatum}, ` +
      `eller nu med \`npm run seed:review:clean -- --ort ${ort}\`.`,
  };
}

/**
 * Betalstatus per rad. Varieras deterministiskt så båda betalvyerna har något
 * att visa: bland de bekräftade saknar var fjärde anmälningsavgift, bland de
 * obekräftade har var tredje ändå betalat in den.
 */
export function betalstatusFor(index, arBekraftad, select) {
  const { betalningMottagen: JA, betalningEjMottagen: NEJ } = select;
  if (arBekraftad) {
    return {
      Anmälningsavgift: index % 4 === 3 ? NEJ : JA,
      Slutbetalning: index % 3 === 0 ? JA : NEJ,
    };
  }
  return { Anmälningsavgift: index % 3 === 0 ? JA : NEJ, Slutbetalning: NEJ };
}

/**
 * Anmälningarnas + personernas fält. Ren funktion av (ort, antal, nu) — samma
 * indata ger alltid samma fixtur, så en granskning går att återskapa exakt.
 *
 * REALISM (så vyn visar allt den ska): varannan rad bär `Källa = Manuell`
 * (ger kategori-pillen "Manuellt tillagd"), varannan lämnar Källa TOM
 * (formuläranmälan — frånvaro är sanningen, data-model § Källa-värden).
 * `Inskickad` sprids linjärt bakåt så kön får en äkta äldst-först-ordning,
 * betalstatus varieras i båda grupperna, och de bekräftade bär
 * `Bekräftelse skickad` så meta-raden syns på deltagarkortet.
 *
 * TASK-97: adressen är `fornamn.efternamn@example.com` (roterad domän), och
 * ~82 % av raderna bär `Ort` = eventets ort — det är den enda vägen till
 * personens Ort, som är en ROLLUP över just detta fält. Personen får ALDRIG
 * `Telefon` (Marcus-beslut: den visas inte i personlistan); anmälans
 * `Mobilnummer` är ett annat fält och sätts som förut.
 */
export function buildRegistrations({ ort, bekraftade, obekraftade, nu, config }) {
  const totalt = bekraftade + obekraftade;
  const { aldstDagar, senasteDagar } = config.inskickadSpann;
  const rader = [];

  for (let i = 0; i < totalt; i += 1) {
    const arBekraftad = i < bekraftade;
    const fornamn = config.fornamn[i % config.fornamn.length];
    const efternamn = config.efternamn[(i * 11) % config.efternamn.length];
    const epost = fixtureEmail(fornamn, efternamn, i, config.marker);

    // Äldst först: index 0 längst bak i tiden, sista närmast nu.
    const andel = totalt === 1 ? 0 : i / (totalt - 1);
    const dagarBak = Math.round(aldstDagar - andel * (aldstDagar - senasteDagar));
    const inskickad = isoTidBakat(nu, dagarBak, i);

    const anmalan = {
      Förnamn: fornamn,
      Efternamn: efternamn,
      'E-post': epost,
      Mobilnummer: `070-${String(100 + i).padStart(3, '0')} ${String(10 + (i % 80)).padStart(2, '0')} ${String(11 + ((i * 3) % 80)).padStart(2, '0')}`,
      Typ: config.select.eventTyp,
      'Antal platser': 1,
      Inskickad: inskickad,
      Status: arBekraftad ? config.select.regStatusBekraftad : config.select.regStatusObekraftad,
      ...betalstatusFor(i, arBekraftad, config.select),
    };
    // Tom Källa = formuläranmälan. Fältet UTELÄMNAS — tomsträng vore en
    // ogiltig select-option och hade gett 422 (ingen typecast).
    if (i % 2 === 0) anmalan.Källa = config.select.regKallaManuell;
    // Ort UTELÄMNAS på luckraderna av samma skäl som Källa: frånvaro är
    // sanningen. En tomsträng hade gett personens rollup ett tomt element i
    // stället för ingen post alls — en annan sak i vyn.
    if (harOrt(i, config.realism.ortKvot)) anmalan.Ort = ort;
    // Bekräftelsen gick ut dagen efter anmälan, aldrig i framtiden.
    if (arBekraftad) anmalan['Bekräftelse skickad'] = isoTidBakat(nu, Math.max(dagarBak - 1, 1), i);

    rader.push({
      person: { Förnamn: fornamn, Efternamn: efternamn, 'E-post': epost },
      anmalan,
    });
  }
  return rader;
}

// ---------------------------------------------------------------------------
// RIK-LÄGET (--rik, S103) — pura byggfunktioner för den rika personen.
// Samma disciplin som buildRegistrations ovan: ren funktion av (index/nu/
// config), aldrig I/O. korCreate översätter planen till Airtable-anrop.
// ---------------------------------------------------------------------------

/**
 * Den rika personens PRIMÄRA rad — läggs till SIST i `rader` (index =
 * `rader.length` FÖRE tillägget), så den aldrig krockar med batchens egna
 * 0..totalt-1-index (namnpoolens period är 120, väl över taket 60+1). Formen
 * är IDENTISK med en vanlig `buildRegistrations`-rad ({ person, anmalan }) —
 * hela create-/purge-vakts-/efter-verifierings-koden hanterar den därför utan
 * särskiljning, den är bara en rad till i batchen.
 *
 * Avviker medvetet från de tunna radernas realism-regler (Ort/Källa-luckor):
 * detta är den EN person granskningen ska visa fullständig, inte ett
 * statistiskt urval — 100 % Ort, bekräftad status, betalt.
 */
export function buildRikPrimaryRad({ ort, nu, index, config }) {
  const fornamn = config.fornamn[index % config.fornamn.length];
  const efternamn = config.efternamn[(index * 11) % config.efternamn.length];
  const epost = fixtureEmail(fornamn, efternamn, index, config.marker);
  const historyN = config.richPerson.historyDagarBak.length;
  const kortMotivering = config.richPerson.motiveringar[historyN];
  return {
    person: {
      Förnamn: fornamn,
      Efternamn: efternamn,
      'E-post': epost,
      // Avsteg från § DATAN SKA LIKNA VERKLIGHETEN ("TELEFON SEEDAS INTE") —
      // se CONFIG.richPerson-kommentaren för motiveringen.
      Telefon: config.richPerson.telefon,
      Flagga: config.richPerson.flagga,
    },
    anmalan: {
      Förnamn: fornamn,
      Efternamn: efternamn,
      'E-post': epost,
      Mobilnummer: config.richPerson.telefon,
      Typ: config.select.eventTyp,
      'Antal platser': 1,
      Inskickad: isoTidBakat(nu, 3, index),
      Status: config.select.regStatusBekraftad,
      Anmälningsavgift: config.select.betalningMottagen,
      Slutbetalning: config.select.betalningMottagen,
      Ort: ort,
      'Bekräftelse skickad': isoTidBakat(nu, 2, index),
      ...(kortMotivering ? { 'Varför vill du gå den här utbildningen?': kortMotivering } : {}),
    },
  };
}

/**
 * Historik-eventens PLAN — ren data, inga record-ID:n (de finns inte än).
 * `korCreate` slår varje spec genom `buildEvent(status/eventSource-override)`
 * för själva eventet, och använder `sessions`/`motivering` för att bygga
 * Deltaganden- respektive anmälnings-fälten EFTER att event+person existerar.
 *
 * Returlängden är ALLTID `historyDagarBak.length` — validateConfig har redan
 * bevisat att `historyEventSources`/`historySessions`/`motiveringar` har
 * matchande längd, så indexeringen nedan kan aldrig gå utanför.
 */
export function buildRikHistoryEventSpecs({ nu, config }) {
  const { historyDagarBak, historyEventSources, historySessions, motiveringar } = config.richPerson;
  return historyDagarBak.map((dagarBak, i) => ({
    startdatum: isoDatum(nu, -dagarBak),
    slutdatum: isoDatum(nu, -dagarBak + 1),
    eventSource: historyEventSources[i],
    status: config.select.eventStatusGenomfort,
    sessions: historySessions[i],
    motivering: motiveringar[i],
  }));
}

/**
 * Touchpoint-raderna — Person-länken saknas med flit (okänd tills personen
 * finns); `korCreate` lägger till den innan `createRecords`.
 */
export function buildRikTouchpoints({ nu, config }) {
  const { touchpointKanaler, touchpointErbjudanden, touchpointDagarBak, touchpointMetadataMarker } =
    config.richPerson;
  return touchpointDagarBak.map((dagarBak, i) => ({
    Kanal: touchpointKanaler[i % touchpointKanaler.length],
    Typ: config.select.tpTypHamtning,
    Erbjudande: touchpointErbjudanden[i % touchpointErbjudanden.length],
    Datum: isoTidBakat(nu, dagarBak, i),
    Metadata: touchpointMetadataMarker,
  }));
}

/**
 * Anteckningsraderna — Person-länken saknas med flit, se buildRikTouchpoints.
 * INGEN sentinel i texten (§ CONFIG.richPerson.anteckningar-kommentaren) —
 * konsekvensen (personDataLinkFields blockerar automatisk radering) är
 * medveten och dokumenterad där, inte ett hål i denna funktion.
 */
export function buildRikAnteckningar({ config }) {
  return config.richPerson.anteckningar.map((a) => ({
    Författare: a.forfattare,
    Anteckning: a.text,
  }));
}

/** Exakt fixtur-match på event: rätt Ort OCH notering-sentineln. */
export function isFixtureEvent(record, ort, marker) {
  const raderOrt = record.fields?.Ort;
  const notering = record.fields?.Notering;
  if (raderOrt !== ort) return false;
  return typeof notering === 'string' && notering.startsWith(marker.noteringSentinel);
}

/** Exakt fixtur-match på anmälan/person: e-posten matchar fixtur-mönstret. */
export function isFixtureEmailRecord(record, pattern) {
  const epost = record.fields?.['E-post'];
  return typeof epost === 'string' && pattern.test(epost);
}

/**
 * Länkgrafens ett steg: alla record-ID:n `faltnamn` pekar på, i ordning och
 * utan dubbletter (TASK-97).
 *
 * Ordningen bevaras med flit — den gör planer och loggar läsbara och
 * jämförbara mellan körningar. Ett saknat eller tomt länkfält ger tom lista,
 * aldrig ett kast: ett event utan anmälningar är ett giltigt tillstånd.
 */
export function lankadeIdn(records, faltnamn) {
  const ut = [];
  for (const rec of records) {
    const varde = rec.fields?.[faltnamn];
    if (!Array.isArray(varde)) continue;
    for (const id of varde) if (!ut.includes(id)) ut.push(id);
  }
  return ut;
}

/**
 * Är detta en FÖRÄLDRALÖS fixturperson (TASK-97)?
 *
 * Två villkor, båda nödvändiga: adressen matchar fixtur-formen OCH personen
 * har noll anmälningslänkar. Det andra villkoret är hela skyddet — en person
 * som tillhör en annan LEVANDE fixtur har alltid minst en anmälan och kan
 * därför aldrig fångas här, hur lika adresserna än ser ut.
 *
 * Vägen finns för ett verkligt felläge: avbryts en clean mellan anmälnings-
 * och person-steget blir personerna oåtkomliga för grafen, eftersom deras enda
 * väg in gick via anmälan. Utan denna väg vore de kvar för alltid.
 */
export function arForaldralosFixturperson(record, pattern, faltnamn) {
  if (!isFixtureEmailRecord(record, pattern)) return false;
  const anmalningar = record.fields?.[faltnamn];
  return !Array.isArray(anmalningar) || anmalningar.length === 0;
}

/**
 * Skyddsräcke 4: personer med data-länkar (Deltaganden) raderas ALDRIG.
 * `Anmälningar (länkat fält)` räknas inte — den länken är fixturens egen och
 * försvinner när anmälan raderas i steget före.
 */
export function personLinkGuardTrips(record, linkFields) {
  return linkFields.filter((f) => {
    const v = record.fields?.[f];
    return Array.isArray(v) && v.length > 0;
  });
}

/** Klassa listade rader till en clean-plan (raderas / skyddas med orsak). */
export function planClean({ events, registrations, persons, ort, pattern, config }) {
  const plan = {
    events: [],
    registrations: [],
    persons: [],
    skippedEvents: [],
    skippedRegistrations: [],
    skippedPersons: [],
  };
  for (const rec of events) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedEvents.push({ id: rec.id, orsak: 'skyddad record-ID' });
      continue;
    }
    if (isFixtureEvent(rec, ort, config.marker)) plan.events.push(rec.id);
    else plan.skippedEvents.push({ id: rec.id, orsak: 'saknar fixtur-sentinel i Notering' });
  }
  for (const rec of registrations) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedRegistrations.push({ id: rec.id, orsak: 'skyddad record-ID' });
      continue;
    }
    if (isFixtureEmailRecord(rec, pattern)) plan.registrations.push(rec.id);
    else
      plan.skippedRegistrations.push({ id: rec.id, orsak: 'e-post matchar inte fixtur-mönstret' });
  }
  for (const rec of persons) {
    if (config.protectedRecordIds.includes(rec.id)) {
      plan.skippedPersons.push({ id: rec.id, orsak: 'skyddad record-ID (permanent fixtur)' });
      continue;
    }
    if (!isFixtureEmailRecord(rec, pattern)) {
      plan.skippedPersons.push({ id: rec.id, orsak: 'e-post matchar inte fixtur-mönstret' });
      continue;
    }
    const lankar = personLinkGuardTrips(rec, config.personDataLinkFields);
    if (lankar.length > 0) {
      plan.skippedPersons.push({ id: rec.id, orsak: `länk-guard: ${lankar.join(', ')}` });
      continue;
    }
    plan.persons.push(rec.id);
  }
  return plan;
}

/** Dela lista i batchar om max size (Airtable create/delete ≤10 per anrop). */
export function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Den enda raden användaren egentligen behöver. */
export function eventUrl(baseUrl, recordId) {
  return `${baseUrl}/event/${recordId}`;
}

// ---------------------------------------------------------------------------
// Airtable-API (throttlad, 429-medveten) — samma form som purge-skriptet
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiError extends Error {}

async function airtableRequest(url, token, throttleMs, init = {}) {
  await sleep(throttleMs);
  const headers = { Authorization: `Bearer ${token}` };
  if (init.body) headers['Content-Type'] = 'application/json';
  let res = await fetch(url, { ...init, headers });
  if (res.status === 429) {
    console.log('   429 rate limit — väntar 30 s och försöker igen …');
    await sleep(30_000);
    res = await fetch(url, { ...init, headers });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(`Airtable ${init.method ?? 'GET'} ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

async function listRecords(baseId, tableId, formula, token, throttleMs) {
  const records = [];
  let offset;
  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tableId}`);
    if (formula) url.searchParams.set('filterByFormula', formula);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const page = await airtableRequest(url, token, throttleMs);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

async function createRecords(baseId, tableId, fieldsList, token, throttleMs, batchSize) {
  const skapade = [];
  for (const batch of chunk(fieldsList, batchSize)) {
    const url = `${AIRTABLE_API_URL}/${baseId}/${tableId}`;
    // INGEN typecast: ogiltigt select-värde ska ge 422, aldrig föda en option.
    const body = JSON.stringify({ records: batch.map((fields) => ({ fields })) });
    const res = await airtableRequest(url, token, throttleMs, { method: 'POST', body });
    skapade.push(...res.records);
  }
  return skapade;
}

async function deleteRecords(baseId, tableId, ids, token, throttleMs, batchSize) {
  let raderade = 0;
  for (const batch of chunk(ids, batchSize)) {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${tableId}`);
    for (const id of batch) url.searchParams.append('records[]', id);
    const res = await airtableRequest(url, token, throttleMs, { method: 'DELETE' });
    raderade += (res.records ?? []).filter((r) => r.deleted).length;
  }
  return raderade;
}

/**
 * Läs EventKey med poll. Fältet är en formel över autoNumber och har
 * beräkningsfördröjning (data-model § Kända fällor 17) — den får aldrig läsas
 * direkt ur create-svaret.
 */
async function pollEventKey(baseId, tableId, recordId, token, throttleMs) {
  for (let forsok = 0; forsok < 6; forsok += 1) {
    const rec = await airtableRequest(
      `${AIRTABLE_API_URL}/${baseId}/${tableId}/${recordId}`,
      token,
      throttleMs,
    );
    const key = rec.fields?.EventKey;
    if (typeof key === 'string' && /^Event-\d+$/.test(key)) return key;
    await sleep(500);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lägen
// ---------------------------------------------------------------------------

async function korCreate({ args, config, token, purgePolicy }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const nu = new Date();

  const rader = buildRegistrations({
    ort: args.ort,
    bekraftade: args.bekraftade,
    obekraftade: args.obekraftade,
    nu,
    config,
  });
  // RIK-LÄGET (--rik, S103): en extra anmälan+person läggs till SIST i SAMMA
  // batch som de tunna raderna. Allt nedanför (purge-vakten, kapaciteten,
  // skapandet, efter-verifieringen) hanterar den utan särskiljning — den är
  // bara en rad till i `rader`. `totalt` räknas därför härifrån och nedåt,
  // INTE från args.bekraftade+args.obekraftade (som bara vore batchens tunna
  // del och hade gett en felaktig kapacitets-/efter-verifieringsberäkning).
  if (args.rik) {
    rader.push(buildRikPrimaryRad({ ort: args.ort, nu, index: rader.length, config }));
  }
  const totalt = rader.length;

  // Skyddsräcke 2: markörerna får aldrig kunna fångas av setup-purgen. Sedan
  // TASK-97 korsläses ALLA värden fixturen skriver som skulle kunna vara en
  // purge-markör — eventets Ort, anmälningarnas Ort och varje adress. Att
  // orten numera är en riktig stad ändrar inget för vakten; den prövar mot den
  // skarpa policyn i stället för mot ett antagande om vad den innehåller.
  const samples = [
    { table: tables.eventplanering.purgeName, field: 'Ort', value: args.ort },
    ...rader
      .filter((r) => typeof r.anmalan.Ort === 'string')
      .map((r) => ({
        table: tables.anmalningar.purgeName,
        field: 'Ort',
        value: r.anmalan.Ort,
      })),
    ...rader.map((r) => ({
      table: tables.anmalningar.purgeName,
      field: 'E-post',
      value: r.anmalan['E-post'],
    })),
  ];
  const kollisioner = purgeCollisions(samples, purgePolicy);
  if (kollisioner.length > 0) {
    throw new GuardError(
      'purge-kollision: fixturens markörer skulle raderas av setup-purgen — ' +
        kollisioner.map((k) => `${k.value} ⇒ ${k.target}`).join('; '),
    );
  }

  const startdatum = isoDatum(nu, args.dagar);
  const slutdatum = isoDatum(nu, args.dagar + 1); // Eventformatet är Dag 1 + Dag 2.
  const maxPlatser = kapacitetFor(totalt, config.belaggning);
  const utgangsdatum = isoDatum(nu, args.livstid);
  const eventFalt = buildEvent({
    ort: args.ort,
    startdatum,
    slutdatum,
    maxPlatser,
    utgangsdatum,
    config,
  });

  console.log(
    `Granskningsfixtur mot ${expectedBaseId}${args.dryRun ? ' — DRY RUN, inget skrivs' : ''}`,
  );
  console.log(
    `▸ Event: ${args.ort} · ${startdatum} → ${slutdatum} · ${maxPlatser} platser ` +
      `(beläggning ${Math.round((totalt / maxPlatser) * 100)} %, tak ${Math.round(config.belaggning.maxKvot * 100)} %)`,
  );
  console.log(
    `▸ Anmälningar: ${args.bekraftade} bekräftade + ${args.obekraftade} obekräftade = ${totalt}` +
      ` · ${rader.filter((r) => r.anmalan.Källa).length} manuella, ${rader.filter((r) => !r.anmalan.Källa).length} via formulär`,
  );
  const medOrt = rader.filter((r) => typeof r.anmalan.Ort === 'string').length;
  console.log(
    `▸ Realism: e-post på ${totalt}/${totalt}, Ort på ${medOrt}/${totalt} ` +
      `(${Math.round((medOrt / totalt) * 100)} % — mål ${Math.round(config.realism.ortKvot * 100)} %, ` +
      `prods andel; små tal rundar) · Telefon seedas ${args.rik ? 'ENDAST för --rik-personen' : 'aldrig'}`,
  );
  if (args.rik) {
    const historyN = config.richPerson.historyDagarBak.length;
    console.log(
      `▸ RIK-LÄGE: en extra person läggs till (index ${rader.length - 1}, sista raden) med ` +
        `${historyN} historik-event, Touchpoints, Anteckningar, Flagga och Telefon utöver batchen.`,
    );
  }
  console.log(
    `▸ Markör: Ort "${args.ort}" + Notering-sentinel · adresser som ${rader[0].anmalan['E-post']} ` +
      '(RFC 2606-reserverade, kan aldrig nå en verklig mottagare)',
  );
  console.log('▸ Purge-kollisionsvakt: ren mot .purge-staging-policy.json');
  console.log(
    `▸ Livstid: ${args.livstid} dagar — utgångsstämpel ${utgangsstampel(utgangsdatum, config.livstid)} ` +
      'i Noteringen. Förfallo-svepet städar fixturen vid första körningen därefter.',
  );

  // Svepet FÖRE dubbelkörnings-guarden: en förfallen fixtur på samma Ort ska
  // städas bort, inte blockera skapandet av den nya.
  if (!args.ingenSvep) await korSweep({ config, token, dryRun: args.dryRun, idag: nu });

  if (args.dryRun) {
    console.log('\nDry run klar — inget skrevs. Kör utan --dry-run för att skapa.');
    return 0;
  }

  // Refusera dubbelkörning: två fixturer på samma Ort gör granskningen otydlig.
  const befintliga = (
    await listRecords(
      expectedBaseId,
      tables.eventplanering.id,
      `{Ort} = '${args.ort}'`,
      token,
      requestThrottleMs,
    )
  ).filter((r) => isFixtureEvent(r, args.ort, config.marker));
  if (befintliga.length > 0) {
    throw new GuardError(
      `en fixtur på Ort "${args.ort}" finns redan (${befintliga.map((r) => r.id).join(', ')}). ` +
        `Kör \`npm run seed:review:clean -- --ort ${args.ort}\` först, eller välj ett annat --ort.`,
    );
  }

  const [event] = await createRecords(
    expectedBaseId,
    tables.eventplanering.id,
    [eventFalt],
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ event skapat: ${event.id}`);

  const eventKey = await pollEventKey(
    expectedBaseId,
    tables.eventplanering.id,
    event.id,
    token,
    requestThrottleMs,
  );
  if (eventKey) console.log(`   ✅ EventKey: ${eventKey}`);
  else console.log('   ⚠️  EventKey hann inte beräknas — anmälningarna får bara Event-länken');

  const personer = await createRecords(
    expectedBaseId,
    tables.personer.id,
    rader.map((r) => r.person),
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ ${personer.length} personer skapade`);

  /*
   * Person-länken sätts av SKRIPTET, inte av automation A2. Automationerna är
   * avstängda i staging (empiriskt: 16 skapade anmälningar gav 0 Deltaganden,
   * och CI-sentinelerna saknar Person-länk). Utan länken blir personens
   * `Antal genomförda event` okänd, och då uteblir historikraden "Första
   * eventet hos Miranon Media" på deltagarkortet — precis den rad granskningen
   * ofta handlar om.
   */
  const anmalningar = await createRecords(
    expectedBaseId,
    tables.anmalningar.id,
    rader.map((r, i) => ({
      ...r.anmalan,
      Event: [event.id],
      ...(eventKey ? { EventKey: eventKey } : {}),
      Person: [personer[i].id],
    })),
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   ✅ ${anmalningar.length} anmälningar skapade (Person-länk satt av skriptet)`);

  // Efter-verifiering: eventet ska se exakt så många anmälningar som vi skrev.
  let raknat = null;
  for (let forsok = 0; forsok < 6; forsok += 1) {
    const rec = await airtableRequest(
      `${AIRTABLE_API_URL}/${expectedBaseId}/${tables.eventplanering.id}/${event.id}`,
      token,
      requestThrottleMs,
    );
    raknat = (rec.fields?.[config.linkFields.eventAnmalningar] ?? []).length;
    if (raknat === totalt) break;
    await sleep(500);
  }
  if (raknat !== totalt) {
    throw new ApiError(
      `efter-verifiering: eventet bär ${raknat} anmälningar, förväntade ${totalt}`,
    );
  }
  console.log(`   ✅ efter-verifiering: ${raknat}/${totalt} anmälningar länkade till eventet`);

  // -------------------------------------------------------------------
  // RIK-LÄGET (--rik, S103): historik-event, Deltaganden, Touchpoints och
  // Anteckningar för personen som lades till sist i `rader` ovan. Körs
  // EFTER den vanliga batchen är skarpt skapad OCH verifierad, så ett fel
  // härifrån aldrig kan lämna den vanliga batchen halvfärdig.
  // -------------------------------------------------------------------
  let rikRapport = null;
  if (args.rik) {
    const rikIndex = rader.length - 1;
    const rikPersonId = personer[rikIndex].id;
    const rikAnmalanPrimarId = anmalningar[rikIndex].id;
    const rikRad = rader[rikIndex];
    const rikNamn = `${rikRad.person.Förnamn} ${rikRad.person.Efternamn}`;
    console.log(`\n▸ RIK-LÄGE: bygger historik för ${rikNamn} (${rikPersonId}) …`);

    // --- Historik-event (RIM 1 → RIM 2 tvådagars → Fjärrskådning) ---
    const historySpecs = buildRikHistoryEventSpecs({ nu, config });
    const historyEventFalt = historySpecs.map((spec) =>
      buildEvent({
        ort: args.ort,
        startdatum: spec.startdatum,
        slutdatum: spec.slutdatum,
        maxPlatser: kapacitetFor(1, config.belaggning),
        utgangsdatum,
        config,
        status: spec.status,
        eventSource: spec.eventSource,
      }),
    );
    const historyEvents = await createRecords(
      expectedBaseId,
      tables.eventplanering.id,
      historyEventFalt,
      token,
      requestThrottleMs,
      batchSize,
    );
    if (historyEvents.length !== historySpecs.length) {
      throw new ApiError(
        `RIK-LÄGE: ${historyEvents.length}/${historySpecs.length} historik-event skapade`,
      );
    }
    console.log(`   ✅ ${historyEvents.length} historik-event skapade (samma Ort, samma livstid)`);

    const historyEventKeys = [];
    for (const ev of historyEvents) {
      historyEventKeys.push(
        await pollEventKey(
          expectedBaseId,
          tables.eventplanering.id,
          ev.id,
          token,
          requestThrottleMs,
        ),
      );
    }

    // --- Historik-anmälningar: SAMMA person, en ny anmälan per event ---
    const historyAnmalanFalt = historySpecs.map((spec, i) => {
      const falt = {
        Förnamn: rikRad.person.Förnamn,
        Efternamn: rikRad.person.Efternamn,
        'E-post': rikRad.person['E-post'],
        Mobilnummer: config.richPerson.telefon,
        Typ: config.select.eventTyp,
        'Antal platser': 1,
        Status: config.select.regStatusBekraftad,
        Anmälningsavgift: config.select.betalningMottagen,
        Slutbetalning: config.select.betalningMottagen,
        Ort: args.ort,
        Event: [historyEvents[i].id],
        Person: [rikPersonId],
        // Inskickad/Bekräftad FÖRE eventets EGET startdatum, inte "nu" — en
        // historisk anmälan ska se ut som den skedde då, inte idag.
        Inskickad: isoTidBakat(spec.startdatum, 21, i),
        'Bekräftelse skickad': isoTidBakat(spec.startdatum, 20, i),
      };
      if (historyEventKeys[i]) falt.EventKey = historyEventKeys[i];
      if (spec.motivering) falt['Varför vill du gå den här utbildningen?'] = spec.motivering;
      return falt;
    });
    const historyAnmalningar = await createRecords(
      expectedBaseId,
      tables.anmalningar.id,
      historyAnmalanFalt,
      token,
      requestThrottleMs,
      batchSize,
    );
    if (historyAnmalningar.length !== historySpecs.length) {
      throw new ApiError(
        `RIK-LÄGE: ${historyAnmalningar.length}/${historySpecs.length} historik-anmälningar skapade`,
      );
    }
    console.log(
      `   ✅ ${historyAnmalningar.length} historik-anmälningar skapade ` +
        `(${historySpecs.filter((s) => s.motivering).length} med motivering)`,
    );

    // --- Deltaganden: 1 för den KOMMANDE (primära) anmälan + N per historik ---
    const deltagandeFalt = [
      {
        'Person (länk)': [rikPersonId],
        Anmälan: [rikAnmalanPrimarId],
        Event: [event.id],
        Session: config.select.sessionDag1,
        Status: config.select.deltagandeEjAvstamt,
      },
      ...historySpecs.flatMap((spec, i) =>
        spec.sessions.map((s) => ({
          'Person (länk)': [rikPersonId],
          Anmälan: [historyAnmalningar[i].id],
          Event: [historyEvents[i].id],
          Session: s.session,
          Status:
            s.status === 'Närvarande'
              ? config.select.deltagandeNarvarande
              : config.select.deltagandeFranvarande,
        })),
      ),
    ];
    const deltaganden = await createRecords(
      expectedBaseId,
      tables.deltaganden.id,
      deltagandeFalt,
      token,
      requestThrottleMs,
      batchSize,
    );
    if (deltaganden.length !== deltagandeFalt.length) {
      throw new ApiError(
        `RIK-LÄGE: ${deltaganden.length}/${deltagandeFalt.length} Deltaganden skapade`,
      );
    }
    console.log(
      `   ✅ ${deltaganden.length} Deltaganden skapade (1 Kommande + ` +
        `${deltagandeFalt.length - 1} historik, inkl. ett tvådagars-event)`,
    );

    // --- Touchpoints (hämtningar, riktiga datum spridda i tid) ---
    const touchpointFalt = buildRikTouchpoints({ nu, config }).map((tp) => ({
      ...tp,
      'Person (länkat fält)': [rikPersonId],
    }));
    const touchpoints = await createRecords(
      expectedBaseId,
      tables.touchpoints.id,
      touchpointFalt,
      token,
      requestThrottleMs,
      batchSize,
    );
    if (touchpoints.length !== touchpointFalt.length) {
      throw new ApiError(
        `RIK-LÄGE: ${touchpoints.length}/${touchpointFalt.length} Touchpoints skapade`,
      );
    }
    console.log(`   ✅ ${touchpoints.length} Touchpoints skapade (hämtningar, spridda i tid)`);

    // --- Anteckningar (olika författare — INTE auto-städbara, se guarden) ---
    const anteckningFalt = buildRikAnteckningar({ config }).map((a) => ({
      ...a,
      Person: [rikPersonId],
    }));
    const anteckningar = await createRecords(
      expectedBaseId,
      tables.anteckningar.id,
      anteckningFalt,
      token,
      requestThrottleMs,
      batchSize,
    );
    if (anteckningar.length !== anteckningFalt.length) {
      throw new ApiError(
        `RIK-LÄGE: ${anteckningar.length}/${anteckningFalt.length} Anteckningar skapade`,
      );
    }
    console.log(
      `   ✅ ${anteckningar.length} Anteckningar skapade — INTE auto-städbara ` +
        '(§ personDataLinkFields, radera för hand vid behov)',
    );

    rikRapport = { personId: rikPersonId, namn: rikNamn };
  }

  console.log('\nKlart. Öppna:\n');
  console.log(`  ${eventUrl(config.appBaseUrl, event.id)}\n`);
  if (rikRapport) {
    console.log(
      `  Den rika personen — ${rikRapport.namn} (${rikRapport.personId}):\n` +
        `  ${config.appBaseUrl}/personer/${rikRapport.personId}?variant=d\n`,
    );
  }
  console.log(
    'Ser appen gammal data ut? Kör `localStorage.clear()` i konsolen — query-cachen\n' +
      'persistas i localStorage och överlever hårdladdning (staleTime 5 min).',
  );
  // Raden är INTE längre mekanismen — utgångsstämpeln är. Den står kvar som
  // genväg för den som vill städa före förfallodagen.
  console.log(
    `Livstid: fixturen utgår ${utgangsdatum} och städas då av förfallo-svepet vid ` +
      `nästa körning.\nStäda tidigare: npm run seed:review:clean -- --ort ${args.ort}`,
  );
  return 0;
}

/**
 * Hämta records vid EXAKTA record-ID:n (TASK-97). Länkgrafens hämtsteg.
 *
 * `RECORD_ID()` i en filterByFormula ger en enda begäran per 50 ID:n i stället
 * för ett anrop per rad — 5 req/s per bas är en delad budget. ID:na kommer ur
 * Airtables egna länkfält, men de går in i en formel och prövas därför mot
 * rec-formen ändå: ett oväntat värde ska stoppa körningen, inte tolkas.
 */
async function hamtaPerRecordId(baseId, tableId, ids, token, throttleMs) {
  const unika = [...new Set(ids)];
  for (const id of unika) {
    if (!REC_ID_PATTERN.test(id)) {
      throw new ApiError(`länkfältet bar ett oväntat record-ID "${id}" — avbryter utan att radera`);
    }
  }
  const records = [];
  for (const batch of chunk(unika, 50)) {
    const formula = `OR(${batch.map((id) => `RECORD_ID() = '${id}'`).join(', ')})`;
    records.push(...(await listRecords(baseId, tableId, formula, token, throttleMs)));
  }
  return records;
}

/**
 * LÄNKGRAFEN (TASK-97) — cleanens bärande identifiering.
 *
 * Grafen startar i EXAKT den event-mängd planClean godkänner för radering.
 * Att den mängden hämtas genom att ANROPA planClean, i stället för att skriva
 * om dess villkor här, är hela poängen: två uttryck av samma regel kan drifta
 * isär, ett anrop kan det inte. Ett verkligt event på samma Ort utan
 * notering-sentinel bidrar därmed med noll anmälningar och noll personer —
 * dess rader listas aldrig ens.
 *
 * Person-länkarna läses FÖRE något raderas. Efter att anmälan är borta finns
 * ingen väg kvar till personen.
 */
async function samlaFixturgraf({ ort, config, token, pattern }) {
  const { expectedBaseId, tables, requestThrottleMs, linkFields } = config;

  // Sekventiellt, inte parallellt: throttlen räknar per anrop och 5 req/s
  // per bas är en delad budget.
  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    `{Ort} = '${ort}'`,
    token,
    requestThrottleMs,
  );
  const eventPlan = planClean({ events, registrations: [], persons: [], ort, pattern, config });
  const fixturEvents = events.filter((rec) => eventPlan.events.includes(rec.id));

  const registrations = await hamtaPerRecordId(
    expectedBaseId,
    tables.anmalningar.id,
    lankadeIdn(fixturEvents, linkFields.eventAnmalningar),
    token,
    requestThrottleMs,
  );
  const lankadePersoner = await hamtaPerRecordId(
    expectedBaseId,
    tables.personer.id,
    lankadeIdn(registrations, linkFields.anmalanPerson),
    token,
    requestThrottleMs,
  );

  // Föräldralösa: fixtur-adress + NOLL anmälningslänkar. Grovfiltret hämtar
  // kandidater server-side; arForaldralosFixturperson avgör.
  const kandidater = await listRecords(
    expectedBaseId,
    tables.personer.id,
    fixtureEmailFormula(config.marker),
    token,
    requestThrottleMs,
  );
  const foraldralosa = kandidater.filter((rec) =>
    arForaldralosFixturperson(rec, pattern, linkFields.personAnmalningar),
  );

  const sedda = new Set(lankadePersoner.map((r) => r.id));
  const tillagdaForaldralosa = foraldralosa.filter((r) => !sedda.has(r.id));
  const persons = [...lankadePersoner, ...tillagdaForaldralosa];
  return { events, fixturEvents, registrations, persons, lankadePersoner, tillagdaForaldralosa };
}

/**
 * Städa EN fixtur-ort via skriptets egna markörer.
 *
 * Delad av `--clean` och förfallo-svepet. Att svepet går genom EXAKT denna
 * funktion — i stället för en egen raderings-väg — är avsiktligt: det ärver
 * därmed skyddade record-ID:n, länk-guarden, raderings-ORDNINGEN (anmälningar
 * → personer → event) och efter-verifieringen utan att någon av dem kan
 * drifta isär mellan de två vägarna.
 */
async function stadaOrt({ ort, config, token, dryRun }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize, linkFields } = config;
  const args = { ort, dryRun };
  const pattern = fixtureEmailPattern(config.marker);

  const graf = await samlaFixturgraf({ ort: args.ort, config, token, pattern });
  const { events, registrations, persons } = graf;

  const plan = planClean({ events, registrations, persons, ort: args.ort, pattern, config });

  /*
   * SATELLIT-STÄDNING (RIK-LÄGET, S103). Deltaganden/Touchpoints hör till en
   * PERSON men nås ALDRIG via länkgrafen ovan (den går event → anmälan →
   * person). Raderas en person utan att dessa städas EXPLICIT blir de
   * föräldralösa: Airtable rensar bara länk-VÄRDET på den raderade sidan,
   * aldrig den andra tabellens rad. Endast personer som FAKTISKT raderas
   * (plan.persons) bidrar — en person guarden lämnar kvar ska inte få sina
   * Deltaganden/Touchpoints rörda.
   *
   * Säkert att auto-radera UTAN eget märke: personen är redan bevisad
   * fixtur (isFixtureEmailRecord, RFC 2606 §3-reserverad adress — kan
   * ALDRIG tillhöra en verklig deltagare), och Deltaganden/Touchpoints har
   * INGEN organisk skrivväg som skulle kunna länka en ÄKTA rad till en
   * sådan person (se personDataLinkFields-kommentaren i CONFIG för den
   * fullständiga avvägningen, inklusive VARFÖR Anteckningar INTE får samma
   * lättnad).
   */
  const raderasPersoner = persons.filter((p) => plan.persons.includes(p.id));
  const deltagandeIds = lankadeIdn(raderasPersoner, linkFields.personDeltaganden);
  const touchpointIds = lankadeIdn(raderasPersoner, linkFields.personTouchpoints);

  console.log(
    `▸ Länkgraf: ${graf.fixturEvents.length} av ${events.length} event bär sentineln ` +
      `→ ${registrations.length} anmälningar → ${graf.lankadePersoner.length} personer` +
      `${graf.tillagdaForaldralosa.length > 0 ? ` (+ ${graf.tillagdaForaldralosa.length} föräldralösa)` : ''}`,
  );
  console.log(
    `▸ Raderas: ${plan.registrations.length} anmälningar, ${deltagandeIds.length} Deltaganden, ` +
      `${touchpointIds.length} Touchpoints, ${plan.persons.length} personer, ${plan.events.length} event`,
  );
  // En föräldralös rad pekas INTE ut av grafen — den kommer in via adressen
  // plus frånvaron av anmälningar, och kan lika gärna vara en annan orts
  // avbrutna städning. Den redovisas därför en och en, aldrig som en siffra i
  // en summa: en radering ingen kan se är en radering ingen kan granska.
  for (const rec of graf.tillagdaForaldralosa) {
    if (!plan.persons.includes(rec.id)) continue;
    console.log(
      `   ↯ ${rec.id} (${rec.fields?.['E-post']}) raderas som FÖRÄLDRALÖS — ` +
        'fixtur-adress utan anmälningar, alltså rest efter en avbruten städning',
    );
  }
  for (const s of [...plan.skippedEvents, ...plan.skippedRegistrations, ...plan.skippedPersons]) {
    console.log(`   ⚠️  ${s.id} lämnas kvar — ${s.orsak}`);
  }
  if (
    plan.events.length === 0 &&
    plan.registrations.length === 0 &&
    plan.persons.length === 0 &&
    deltagandeIds.length === 0 &&
    touchpointIds.length === 0
  ) {
    console.log('\nInget att städa.');
    return { raderade: 0, planerade: 0 };
  }
  const planerade =
    plan.events.length +
    plan.registrations.length +
    plan.persons.length +
    deltagandeIds.length +
    touchpointIds.length;
  if (args.dryRun) {
    console.log('\nDry run klar — inget raderades.');
    return { raderade: 0, planerade };
  }

  // Ordningen är bärande: anmälningarna först (då släpper personernas
  // Anmälningar-länk), SATELLITERNA näst (Deltaganden/Touchpoints hör till
  // personerna som raderas strax efter — städa dem medan personen fortfarande
  // pekar ut dem), personerna sedan, eventet sist.
  const rAnm = await deleteRecords(
    expectedBaseId,
    tables.anmalningar.id,
    plan.registrations,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rAnm}/${plan.registrations.length} anmälningar raderade`);
  const rDelt = await deleteRecords(
    expectedBaseId,
    tables.deltaganden.id,
    deltagandeIds,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rDelt}/${deltagandeIds.length} Deltaganden raderade`);
  const rTp = await deleteRecords(
    expectedBaseId,
    tables.touchpoints.id,
    touchpointIds,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rTp}/${touchpointIds.length} Touchpoints raderade`);
  const rPers = await deleteRecords(
    expectedBaseId,
    tables.personer.id,
    plan.persons,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rPers}/${plan.persons.length} personer raderade`);
  const rEv = await deleteRecords(
    expectedBaseId,
    tables.eventplanering.id,
    plan.events,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rEv}/${plan.events.length} event raderade`);

  // Efter-verifiering (purge-skriptets form): inget radera-bart kvar. Samma
  // graf-väg som planeringen, av samma anti-drift-skäl — och den fångar båda
  // felen: ett kvarstående fixtur-event drar med sig sina anmälningar och
  // personer, och en person vars radering föll bort dyker upp som föräldralös.
  const kvarGraf = await samlaFixturgraf({ ort: args.ort, config, token, pattern });
  const kvar = planClean({
    events: kvarGraf.events,
    registrations: kvarGraf.registrations,
    persons: kvarGraf.persons,
    ort: args.ort,
    pattern,
    config,
  });
  const rest = kvar.events.length + kvar.registrations.length + kvar.persons.length;
  if (rest > 0) throw new ApiError(`efter-verifiering: ${rest} radera-bara fixtur-rader kvarstår`);
  // Satelliternas efter-verifiering är en RIKTAD ID-koll, inte en graf-
  // omgång — personerna som ägde dem är nu borta, så grafen kan inte längre
  // hitta dem via person-länken. En omfråga mot EXAKT de ID:na vi just bad om
  // att radera är den enda kvarvarande vägen att bevisa att de försvann.
  const kvarDelt =
    deltagandeIds.length > 0
      ? await hamtaPerRecordId(
          expectedBaseId,
          tables.deltaganden.id,
          deltagandeIds,
          token,
          requestThrottleMs,
        )
      : [];
  const kvarTp =
    touchpointIds.length > 0
      ? await hamtaPerRecordId(
          expectedBaseId,
          tables.touchpoints.id,
          touchpointIds,
          token,
          requestThrottleMs,
        )
      : [];
  if (kvarDelt.length > 0) {
    throw new ApiError(`efter-verifiering: ${kvarDelt.length} radera-bara Deltaganden kvarstår`);
  }
  if (kvarTp.length > 0) {
    throw new ApiError(`efter-verifiering: ${kvarTp.length} radera-bara Touchpoints kvarstår`);
  }
  console.log(
    '   ✅ efter-verifiering: 0 radera-bara fixtur-rader kvar (inkl. Deltaganden/Touchpoints)',
  );
  return { raderade: rAnm + rDelt + rTp + rPers + rEv, planerade };
}

async function korClean({ args, config, token }) {
  console.log(
    `Städning av granskningsfixtur "${args.ort}" i ${config.expectedBaseId}` +
      `${args.dryRun ? ' — DRY RUN, inget raderas' : ''}`,
  );
  await stadaOrt({ ort: args.ort, config, token, dryRun: args.dryRun });
  return 0;
}

/**
 * FÖRFALLO-SVEPET (TASK-95 del A) — fixturens livstidsavslutning.
 *
 * Listar varje event skriptet självt skapat, läser utgångsstämpeln, och
 * städar det som passerat via stadaOrt. Rapporterar BÅDA sidorna: vad som
 * togs, och vad som medvetet lämnades (aktiv granskning, eller ingen stämpel).
 *
 * Att den rapporterar det den lämnar är inte kosmetik. En städmekanism som
 * bara redovisar sina raderingar är omöjlig att granska — man ser att den
 * gjorde något, aldrig att den lät bli det den skulle låta bli.
 */
async function korSweep({ config, token, dryRun, idag = new Date() }) {
  const { expectedBaseId, tables, requestThrottleMs } = config;
  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    sweepEventFormula(config.marker),
    token,
    requestThrottleMs,
  );
  const plan = planSweep({ events, idag, config });

  console.log(
    `\n▸ Förfallo-svep (${idag.toISOString().slice(0, 10)})${dryRun ? ' — DRY RUN' : ''}: ` +
      `${plan.forfallna.length} förfallna, ${plan.aktiva.length} aktiva, ` +
      `${plan.utanStampel.length} utan läsbar stämpel`,
  );
  for (const a of plan.aktiva) {
    console.log(`   ⏳ ${a.ort} (${a.id}) lämnas — granskning pågår, utgår ${a.utgar}`);
  }
  for (const u of plan.utanStampel) {
    console.log(`   ⚠️  ${u.ort} (${u.id}) lämnas — ${u.orsak}`);
  }

  let raderade = 0;
  for (const f of plan.forfallna) {
    console.log(`   🕓 ${f.ort} (${f.id}) förföll ${f.utgar} — städas`);
    const utfall = await stadaOrt({ ort: f.ort, config, token, dryRun });
    raderade += utfall.raderade;
  }
  if (plan.forfallna.length === 0) console.log('   ✅ inget förfallet att städa');
  return { plan, raderade };
}

/**
 * LEGACY-LÄGET (TASK-95 del B) — den enda vägen till en handbyggd fixtur.
 *
 * Dry-run är DEFAULT; radering kräver `--bekrafta`. Räkningen mot registrets
 * mätta `forvantat` är hård: avviker basen vägrar skriptet och raderar inget.
 *
 * En AVSLUTAD post (TASK-101) raderar aldrig, och räknings-guarden gäller inte
 * den: noll träffar mot en städad fixtur är det VÄNTADE utfallet, inte en
 * avvikelse. Att låta guarden fälla där hade gett exakt det missvisande
 * meddelande kortet finns för att avskaffa.
 */
async function korLegacy({ args, config, token }) {
  const { expectedBaseId, tables, requestThrottleMs, batchSize } = config;
  const post = args.legacy;
  const skarp = args.bekrafta;
  const emailFormula = legacyEmailFormula(post);

  const lagesText = post.stadad
    ? ' — AVSLUTAD post, raderar aldrig'
    : skarp
      ? ' — SKARPT, rader raderas'
      : ' — DRY RUN (lägg till --bekrafta för att radera)';
  console.log(`Legacy-städning av "${post.namn}" i ${expectedBaseId}${lagesText}`);
  // Tillståndet FÖRST: det avgör hur allt nedanför ska läsas.
  console.log(
    `▸ Status: ${
      post.stadad
        ? `AVSLUTAD — fixturen städades ${post.stadad.datum} (${post.stadad.av})`
        : 'AKTIV — fixturen ligger kvar i basen'
    }`,
  );
  console.log(`▸ Källa: ${post.kalla}`);
  console.log(`▸ Ankare: Ort "${post.ort}" + record-ID ${post.eventRecordId}`);
  console.log(`▸ E-postmönster: ${post.emailPattern}`);

  const events = await listRecords(
    expectedBaseId,
    tables.eventplanering.id,
    `{Ort} = '${post.ort}'`,
    token,
    requestThrottleMs,
  );
  const registrations = await listRecords(
    expectedBaseId,
    tables.anmalningar.id,
    emailFormula,
    token,
    requestThrottleMs,
  );
  const persons = await listRecords(
    expectedBaseId,
    tables.personer.id,
    emailFormula,
    token,
    requestThrottleMs,
  );

  const plan = planLegacyClean({ events, registrations, persons, post, config });
  console.log(
    `▸ Träffar: ${events.length} event, ${registrations.length} anmälningar, ${persons.length} personer`,
  );
  console.log(
    `▸ Planerade: ${plan.events.length} event, ${plan.registrations.length} anmälningar, ${plan.persons.length} personer`,
  );
  for (const s of plan.skipped) console.log(`   ⚠️  ${s.id} lämnas kvar — ${s.orsak}`);

  // AVSLUTAD POST (TASK-101): returnera FÖRE räknings-guarden. För en städad
  // fixtur är noll träffar det väntade, och att fälla på "förväntade 16, fann
  // 0" hade beskrivit ett normaltillstånd som ett fel.
  if (post.stadad) {
    const traffar = events.length + registrations.length + persons.length;
    if (traffar > 0) {
      throw new GuardError(
        `"${post.namn}" är AVSLUTAD (städad ${post.stadad.datum}, ${post.stadad.av}) men basen ` +
          `bär ${traffar} rad(er) som matchar dess ankare. INGET raderades, och posten KAN inte ` +
          'radera något. Airtable återanvänder inte record-ID:n — detta är alltså NY data, inte ' +
          'den gamla fixturen. Låt en människa titta innan något tas bort.',
      );
    }
    console.log(
      `   ✅ 0 rader kvar i basen — det VÄNTADE utfallet för en avslutad post ` +
        `(mätningen ${post.forvantat.event}/${post.forvantat.anmalningar}/` +
        `${post.forvantat.personer} är historik, inte ett krav på basen)`,
    );
    console.log(
      '\nInget att göra. En avslutad post raderar aldrig; räknings-guarden gäller bara aktiva poster.',
    );
    return 0;
  }

  const avvikelser = legacyRakningsavvikelser(plan, post);
  if (avvikelser.length > 0) {
    throw new GuardError(
      `räkningen avviker från registrets mätning för "${post.namn}" — ${avvikelser.join('; ')}. ` +
        'Basen har ändrats sedan posten mättes. INGET raderades. Mät om, uppdatera ' +
        'CONFIG.legacy[].forvantat i en granskad ändring, och kör igen.',
    );
  }
  console.log(
    `   ✅ räkning stämmer mot registret (${post.forvantat.event} event, ` +
      `${post.forvantat.anmalningar} anmälningar, ${post.forvantat.personer} personer)`,
  );

  if (!skarp) {
    console.log('\nDry run klar — inget raderades. Kör med --bekrafta för att radera.');
    return 0;
  }

  // Samma ordning som stadaOrt: anmälningar → personer → event.
  const rAnm = await deleteRecords(
    expectedBaseId,
    tables.anmalningar.id,
    plan.registrations,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rAnm}/${plan.registrations.length} anmälningar raderade`);
  const rPers = await deleteRecords(
    expectedBaseId,
    tables.personer.id,
    plan.persons,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rPers}/${plan.persons.length} personer raderade`);
  const rEv = await deleteRecords(
    expectedBaseId,
    tables.eventplanering.id,
    plan.events,
    token,
    requestThrottleMs,
    batchSize,
  );
  console.log(`   🗑  ${rEv}/${plan.events.length} event raderade`);

  // Efter-verifiering mot basen, samma form som stadaOrt.
  const kvarPlan = planLegacyClean({
    events: await listRecords(
      expectedBaseId,
      tables.eventplanering.id,
      `{Ort} = '${post.ort}'`,
      token,
      requestThrottleMs,
    ),
    registrations: await listRecords(
      expectedBaseId,
      tables.anmalningar.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    persons: await listRecords(
      expectedBaseId,
      tables.personer.id,
      emailFormula,
      token,
      requestThrottleMs,
    ),
    post,
    config,
  });
  const rest = kvarPlan.events.length + kvarPlan.registrations.length + kvarPlan.persons.length;
  if (rest > 0) throw new ApiError(`efter-verifiering: ${rest} radera-bara legacy-rader kvarstår`);
  console.log(`   ✅ efter-verifiering: 0 radera-bara rader kvar (${rAnm + rPers + rEv} raderade)`);
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

class GuardError extends Error {}

async function main() {
  let args;
  let purgePolicy;
  try {
    validateConfig(CONFIG);
    args = parseArgs(process.argv.slice(2), CONFIG);
    purgePolicy = JSON.parse(
      await readFile(new URL('../.purge-staging-policy.json', import.meta.url), 'utf8'),
    );
  } catch (err) {
    console.error(`❌ Guard-/argumentfel: ${err.message}`);
    process.exit(1);
  }

  const token = process.env.STAGING_AIRTABLE_TOKEN;
  if (!token) {
    console.error(
      '❌ STAGING_AIRTABLE_TOKEN saknas i env. Lokalt: .env.seed (gitignorad; se ' +
        '.env.seed.example). Token = least-privilege-PAT scopad till ENBART staging-basen ' +
        '(data.records:read + data.records:write).',
    );
    process.exit(1);
  }

  // TASK-84: EFTER guard-, argument- och token-kontrollerna, FÖRE första
  // begäran mot Airtable. Kolliderar en seed-körning med CI:s staging-purge
  // kan granskningsdata försvinna mitt i Marcus pågående granskning — precis
  // det korsläsningen mot .purge-staging-policy.json finns för att förhindra,
  // fast från den aktör ingen av mutexarna såg. Gäller båda vägarna (create
  // och --clean) och även --dry-run, som läser basen.
  kravStagingLedigt('lokal seed:review');

  try {
    let kod;
    if (args.legacy) {
      // Legacy-läget kör ALDRIG svepet: det rör en fixtur utanför skriptets
      // markörer, och att blanda de två vägarna i en körning gör utfallet
      // svårläst i loggen.
      kod = await korLegacy({ args, config: CONFIG, token });
    } else if (args.sweep) {
      await korSweep({ config: CONFIG, token, dryRun: args.dryRun });
      kod = 0;
    } else if (args.clean) {
      kod = await korClean({ args, config: CONFIG, token });
      if (!args.ingenSvep) await korSweep({ config: CONFIG, token, dryRun: args.dryRun });
    } else {
      kod = await korCreate({ args, config: CONFIG, token, purgePolicy });
    }
    process.exit(kod);
  } catch (err) {
    if (err instanceof GuardError) {
      console.error(`❌ Guard: ${err.message}`);
      process.exit(1);
    }
    if (err instanceof ApiError) {
      console.error(`❌ ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

// Kör endast som CLI — inte vid import från test-skriptet.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`❌ Oväntat fel: ${err.stack ?? err}`);
    process.exit(2);
  });
}
