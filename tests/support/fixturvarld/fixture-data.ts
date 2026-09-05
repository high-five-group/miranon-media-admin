/**
 * Den frusna fixturvärlden för visuella regressionstester (task-36.7).
 *
 * EN sammanhängande värld som alla visual-specs läser ur (AC 4: mockad data,
 * noll staging-beroende, stabila pixlar) — svaren har exakt EF-respons-form
 * och parsas av samma zod-scheman som skarp data (EventSchema/
 * RegistrationSchema): ett schema-brott syns som parse-fel i vyn, aldrig som
 * tyst tom rendering.
 *
 * Datum-kontraktet (AC 5): "nu" är FROZEN_NOW och all fixtur-data är daterad
 * relativt den — kommande event ligger efter, genomförda före. Formel-härledda
 * strängar (tidKvarTillEvent) är frusna litteraler: appen räknar inte om dem,
 * så pixlarna kan aldrig driva med klockan.
 *
 * Persondata är FIKTIV (inga verkliga deltagare) men realistisk i form,
 * så baselines visar vyerna som de SKA se ut.
 */

/** Fruset "nu": tisdag 2026-09-15 kl 10:00 svensk sommartid (explicit offset —
 *  parsas identiskt på Mac och linux-CI, aldrig via plattformens lokala zon). */
export const FROZEN_NOW = new Date('2026-09-15T10:00:00+02:00');

// ── Fixtur-miljön (AC 4: noll staging-beroende) ──────────────────────────
// Visual-körningens dev-server startas med DESSA värden (playwright.config:s
// webServer-gren injicerar dem; Vite låter process-env vinna över .env-filer)
// så appen binder mot den fiktiva URL:en. Varje anrop mot den interceptas —
// att den aldrig faktiskt nås är hermetik-vaktens bevis. Konstanterna bor här
// (dependency-fritt) så BÅDE config-filen och test-ramen kan läsa dem.
export const VISUAL_SUPABASE_URL = 'https://visual-fixture.supabase.co';
export const VISUAL_SUPABASE_ANON_KEY = 'visual-fixture-anon-key';

/** Skövde-eventets ID exporteras — eventsidans/anmälda-vyns specs navigerar
 *  till `/event/${VISUAL_EVENT_ID}`. */
export const VISUAL_EVENT_ID = 'recVisualEvent0001';
const EVENT_SKOVDE = VISUAL_EVENT_ID;
const EVENT_GBG = 'recVisualEvent0002';
const EVENT_VARBERG = 'recVisualEvent0003';

/**
 * BASDIMENSIONERNA I FIXTUREN (task-255) — `kursfamilj` + `kursniva`.
 *
 * KONTRAKTSVAKTENS ANDRA SKARPA FYND, inte en gissning. `TASK-249.4` (commit
 * `63384db2`) lade AVSIKTLIGT till dimensionerna i läsvägen — `get-events`
 * och `get-event` läser basfälten `Kursfamilj`/`Kursnivå` via `selectName`
 * (`string | null`, nyckeln ALLTID närvarande, aldrig utelämnad) — men rörde
 * inte denna fil. Natten därpå (run `31987759931`, ärende #1483) larmade
 * vakten `FIXTUREN-BAKOM` på båda endpointsen: `kursfamilj`/`kursniva`
 * levererades i 86/86 respektive 1/1 skarpa poster och saknades här.
 *
 * DÄRFÖR BÄR VARJE EVENT BÅDA NYCKLARNA. Att utelämna dem på ett event vore
 * fel form: EF:en skickar dem alltid, `null` är dess "ingen känd familj/nivå".
 *
 * VÄRDENA SPEGLAR TVÅ SANNINGAR SAMTIDIGT — svarets FORM och DOMÄNEN
 * (`supabase/functions/_shared/course-dimensions.ts` § `KURS_KARTA`):
 *
 * - Skövde (`events[0]`) bär en NIVÅLÖS familj (`Fjärrskådning` → `kursniva`
 *   `null` per design, inte en lucka). Valet är formstyrt: `EVENT_DETAIL_RESPONSE`
 *   spreadar just detta event, och skarpa `get-event` bar `kursfamilj: sträng`
 *   + `kursniva: null` (1/1) i samma mätning.
 * - Göteborg är en föreläsning utanför kursfamiljerna → båda `null`. Det är
 *   mappningens ärliga utfall för okänt kursnamn: aldrig en gissad familj.
 * - Varberg bär en NIVÅBÄRANDE familj (`RIM` → `Nivå 2`), så `kursniva` finns
 *   i sin sträng-form någonstans i listan.
 *
 * Tillsammans ger de tre listprofilen `null | sträng` för BÅDA nycklarna —
 * exakt vad staging levererade i 86/86 poster. Hade alla tre burit `null`
 * blivit vakten grön ändå (typjämförelsen hoppar över helt-null-nycklar,
 * `kontraktsjamforelse.ts` § `ickeNullTyper`) — men då hade fixturen aldrig
 * prövat sträng-formen. Form-paritet betyder att båda formerna finns, inte
 * att larmet tystnar.
 *
 * INGEN VY LÄSER FÄLTEN (`grep src/`: endast `Event.ts` + `Event.schema.ts`),
 * så värdena rör inga visuella baselines.
 */
/** `get-events`-svaret: kommande utbildning + kommande föreläsning + genomförd. */
export const EVENTS_RESPONSE = {
  events: [
    {
      id: EVENT_SKOVDE,
      eventlabel: 'Skövde 26–27 sep',
      eventNamn: 'Utbildning Skövde',
      typ: 'Utbildning - 2 dagar',
      ort: 'Skövde',
      startdatum: '2026-09-26',
      slutdatum: '2026-09-27',
      tidKvarTillEvent: '11 dagar',
      maxPlatser: 12,
      antalAnmalda: 8,
      platserKvar: 4,
      anmaldBelaggning: 0.67,
      bekraftadBelaggning: 0.5,
      antalNyaAnmalningar: 2,
      antalAnmalningsavgifter: 4,
      antalSlutbetalningar: 2,
      antalSlutbetalningFelande: 1,
      status: 'Planerat',
      eventKey: 'Event-41',
      // Nivålös familj — `kursniva: null` är korrekt per design (KURS_KARTA),
      // och speglar skarpa get-event (som detaljfixturen nedan spreadar).
      kursfamilj: 'Fjärrskådning',
      kursniva: null,
      // EVENTETS PRIS (TASK-368.7, kontraktsvakts-fyndet 2026-09-04, run
      // `33841484905`) — get-event/get-events/update-event bär `pris` sedan
      // commit `8b6d44e3`, men fixturen rördes aldrig i samma leverans.
      // Vakten larmade FIXTUREN-BAKOM: staging levererade `pris` i 19/19
      // (get-events) resp. 1/1 (get-event) skarpa poster, typ `null | tal`.
      // Skövde bär ett SATT pris (en betald tvådagarsutbildning); Göteborg
      // (föreläsning) bär `null` och Varberg ett annat satt pris — samma
      // form-paritetsmönster som kursfamilj/kursniva ovan: båda typerna i
      // listan, aldrig bara en.
      pris: 1500,
      borOverAntal: 3,
    },
    {
      id: EVENT_GBG,
      eventlabel: 'Göteborg 9 okt',
      eventNamn: 'Föreläsning Göteborg',
      typ: 'Föreläsning',
      ort: 'Göteborg',
      startdatum: '2026-10-09',
      slutdatum: '2026-10-09',
      tidKvarTillEvent: '24 dagar',
      maxPlatser: 40,
      antalAnmalda: 17,
      platserKvar: 23,
      anmaldBelaggning: 0.43,
      bekraftadBelaggning: 0.35,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 0,
      antalSlutbetalningar: 0,
      antalSlutbetalningFelande: 0,
      status: 'Planerat',
      eventKey: 'Event-42',
      // Föreläsning utanför kursfamiljerna — mappningens ärliga utfall för
      // okänt kursnamn är `null`, aldrig en gissad familj.
      kursfamilj: null,
      kursniva: null,
      // Inget pris satt (varken eget eller Eventinnehåll-standardens) — den
      // ÄRLIGA `null`-formen `pris` bär (se docblocket på Skövde-eventet ovan).
      pris: null,
      borOverAntal: 0,
    },
    {
      id: EVENT_VARBERG,
      eventlabel: 'Varberg 22–23 aug',
      eventNamn: 'Utbildning Varberg',
      typ: 'Utbildning - 2 dagar',
      ort: 'Varberg',
      startdatum: '2026-08-22',
      slutdatum: '2026-08-23',
      tidKvarTillEvent: null,
      maxPlatser: 12,
      antalAnmalda: 12,
      platserKvar: 0,
      anmaldBelaggning: 1,
      bekraftadBelaggning: 1,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 12,
      antalSlutbetalningar: 12,
      antalSlutbetalningFelande: 0,
      status: 'Genomfört',
      eventKey: 'Event-38',
      // Nivåbärande familj — bär sträng-formen för `kursniva`, så listprofilen
      // blir `null | sträng` för BÅDA nycklarna (paritet med stagings 86/86).
      kursfamilj: 'RIM',
      kursniva: 'Nivå 2',
      pris: 1200,
      borOverAntal: 5,
    },
  ],
} as const;

/**
 * De FJORTON additiva fälten som `get-registrations` ALLTID skickar i den
 * event-lösa grenen — och som fixturen saknade fram till task-59.2.
 *
 * KONTRAKTSVAKTENS FÖRSTA SKARPA FYND, inte en gissning. Vakten (ADR-080
 * beslut 3) jämförde fixturen mot skarp staging första gången 2026-07-27 och
 * larmade: `FIXTUREN-BAKOM — staging levererar 11 nycklar fixturen saknar`,
 * var och en i 43/43 skarpa poster. Den tolfte, `kalla`, fanns i EN av sex
 * fixtur-poster medan Edge Functionen skickar den i alla.
 *
 * ANDRA SKARPA FYNDET (fynd-TASK-331, samma driftklass som TASK-255 löste
 * för `EVENTS_RESPONSE`s `kursfamilj`/`kursniva`). `eventmatchning` +
 * `datum` lades till ADDITIVT-OPTIONAL i `Registration.schema.ts`
 * (task-284.1/commit `0667ec8c` + task-284.3/commit `3a355a49`,
 * 2026-08-21) utan att denna konstant rördes i samma commit. Vakten larmade
 * tre nätter i rad (25–27/8, run `32800998004` m.fl.):
 * `FIXTUREN-BAKOM — staging levererar 2 nyckel/nycklar som fixturen saknar`.
 * Formprofilen observerad i 81/81 skarpa poster styr valen nedan
 * (`kontraktsjamforelse.ts` jämför TYP, inte värde, och exkluderar `null`
 * via `ickeNullTyper` — se den filens `granskaKontrakt`): `eventmatchning`
 * är ALLTID sträng (formeln har ingen `BLANK()`-väg, `Registration.schema.ts`
 * rad 92) — default `'OK'` här, ALDRIG `null`. `datum` är `null | sträng` —
 * anmälans EGNA fritextsvar (`Datum`, singleLineText; jämförs av
 * Eventmatchning-formeln mot facit-lookupen `Datum (from Event)`,
 * `docs/reference/data-model.md` rad 1186–1187) — default en sträng här,
 * override till `null` på den enda manuellt skapade posten (`kalla:
 * 'Manuell'` nedan), som aldrig gick via det publika formuläret och därför
 * aldrig fick fältet ifyllt.
 *
 * VÄRDENA ÄR MAPPNINGENS, INTE VALDA: `supabase/functions/_shared/
 * registration-read.ts` skriver `?? null` för samtliga och `=== true` för
 * `Bor över`, och den event-lösa grenen kör aldrig `berikaPersonhistorik` —
 * därför är `antalGenomfordaEvent`/`erfarenhetsbadge`/`kurshistorik` null
 * där, dokumenterat i funktionens egen header.
 *
 * FORM-PARITET, INTE VÄRDE-TÄCKNING. Fälten läggs in med de värden som gör
 * fixturen SANN om svarets form; att låta dem bära innehåll hade ändrat vad
 * vyerna renderar och därmed de visuella baselines. Att acceptance-testerna
 * ska prövas mot fältens ifyllda tillstånd hör till migrerings-skivorna, där
 * varje flyttad fil får sitt eget tvåsidiga bevis — inte hit.
 *
 * `'OK'` SOM DEFAULT — DEN VERKLIGA GRUNDEN (rättat i review-runda 2,
 * PR #2051): `datum` LÄSES visst under `src/` —
 * `AnmalningRadResolution.tsx:141` renderar `registration.datum ?? 'Uppgift
 * saknas'` (syskonet `KopplaTillEventDialog.tsx` gjorde detsamma innan det
 * revs som död kod i `TASK-400`, 2026-09-05). Skälet baseliner
 * ändå inte rör sig är `behoverAtgard()` (`registration-display.ts`), som
 * `AnmalningarSida.tsx` (rad ~801/812) villkorar `AnmalningRadResolution`
 * på: den kräver `eventmatchning === 'Avviker' | 'Utan event'`, och var
 * `false` för samtliga poster REDAN FÖRE denna konstant fick `eventmatchning`
 * (fältet var då `undefined`, vilket missar båda likhetsjämförelserna precis
 * som `'OK'` gör nu) — övergången `undefined → 'OK'` ändrar alltså inte
 * sanningsvärdet för någon post. Det är detta, inte frånvaron av läsande
 * vyer, som håller baselinerna stilla.
 *
 * LATENT RISK, DÄRFÖR ÖPPET DOKUMENTERAD: sätter en framtida fixtur-post som
 * delar denna konstant `eventmatchning` till `'Avviker'`/`'Utan event'` (för
 * att t.ex. provtrycka åtgärdskö-läget), dyker `datum`-defaulten
 * `'20 sep 2026'` OFRIVILLIGT upp i `AnmalningRadResolution` där `'Uppgift
 * saknas'` visades tidigare — sätt då `datum` explicit på den posten (samma
 * mönster som `kalla`/`datum`-override på `recVisualReg000006` nedan), lita
 * aldrig på att defaulten råkar passa.
 */
const ADDITIVA_ANMALNINGSFALT = {
  noteringAnmalningsavgift: null,
  noteringSlutbetalning: null,
  paminnelseAnmalningsavgiftSkickad: null,
  paminnelseSlutbetalningSkickad: null,
  kalla: null,
  medfoljandeTill: null,
  bekraftelseSkickad: null,
  deltagarinfoSkickad: null,
  antalGenomfordaEvent: null,
  borOver: false,
  erfarenhetsbadge: null,
  kurshistorik: null,
  eventmatchning: 'OK',
  datum: '20 sep 2026',
} as const;

/**
 * `get-registrations`-svaret (event-lösa grenen — Hem-aggregeringen läser den
 * utan params). Mixen är vald så dashboard-korten får innehåll: två Ny
 * anmälan-flaggade (NyaAnmalningarCard), obetalda avgifter/slutbetalningar
 * (ObetaldaCard) och en skickad betalningspåminnelse.
 */
export const REGISTRATIONS_RESPONSE = {
  registrations: [
    {
      id: 'recVisualReg000001',
      namn: 'Anna Andersson',
      fornamn: 'Anna',
      efternamn: 'Andersson',
      email: 'anna.andersson@example.se',
      telefon: '070-123 45 01',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Obekräftad',
      flagga: 'Ny anmälan',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-13',
      motivering: 'Vill utvecklas i mitt ledarskap.',
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00001',
      ...ADDITIVA_ANMALNINGSFALT,
    },
    {
      id: 'recVisualReg000002',
      namn: 'Björn Bergström',
      fornamn: 'Björn',
      efternamn: 'Bergström',
      email: 'bjorn.bergstrom@example.se',
      telefon: '070-123 45 02',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Obekräftad',
      flagga: 'Ny anmälan',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-14',
      motivering: null,
      tidigareErfarenhet: 'Gick föreläsningen i våras.',
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00002',
      ...ADDITIVA_ANMALNINGSFALT,
    },
    {
      id: 'recVisualReg000003',
      namn: 'Cecilia Ceder',
      fornamn: 'Cecilia',
      efternamn: 'Ceder',
      email: 'cecilia.ceder@example.se',
      telefon: '070-123 45 03',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-02',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: 'Vegetarisk kost.',
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00003',
      ...ADDITIVA_ANMALNINGSFALT,
    },
    {
      id: 'recVisualReg000004',
      namn: 'David Dahl',
      fornamn: 'David',
      efternamn: 'Dahl',
      email: 'david.dahl@example.se',
      telefon: '070-123 45 04',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Mottagen',
      slutbetalning: 'Mottagen',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-08-28',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 2,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00004',
      ...ADDITIVA_ANMALNINGSFALT,
    },
    {
      id: 'recVisualReg000005',
      namn: 'Emma Eklund',
      fornamn: 'Emma',
      efternamn: 'Eklund',
      email: 'emma.eklund@example.se',
      telefon: '070-123 45 05',
      eventNamn: 'Föreläsning Göteborg',
      ort: 'Göteborg',
      status: 'Bekräftad (mail skickat)',
      flagga: 'Mottagen',
      anmalningsavgift: 'Ej relevant (för föreläsningar)',
      slutbetalning: 'Ej relevant (för föreläsningar)',
      betalningspaminnelseSkickad: null,
      inskickad: '2026-09-05',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_GBG,
      personId: 'recVisualPers00005',
      ...ADDITIVA_ANMALNINGSFALT,
    },
    {
      id: 'recVisualReg000006',
      namn: 'Filip Forsberg',
      fornamn: 'Filip',
      efternamn: 'Forsberg',
      email: 'filip.forsberg@example.se',
      telefon: '070-123 45 06',
      eventNamn: 'Utbildning Skövde',
      ort: 'Skövde',
      status: 'Betalningspåminnelse skickad',
      flagga: 'Mottagen',
      anmalningsavgift: 'Ej mottagen',
      slutbetalning: 'Ej mottagen',
      betalningspaminnelseSkickad: '2026-09-10',
      inskickad: '2026-08-25',
      motivering: null,
      tidigareErfarenhet: null,
      antalPlatser: 1,
      notering: null,
      eventId: EVENT_SKOVDE,
      personId: 'recVisualPers00006',
      ...ADDITIVA_ANMALNINGSFALT,
      kalla: 'Manuell',
      // Manuellt skapad rad gick aldrig via det publika formuläret — ingen
      // ifylld `Datum`-fritext att spegla. Provtrycker fixturens `null`-form
      // (staging observerade null | sträng, 81/81 — se docblocket ovan).
      datum: null,
    },
  ],
} as const;

/**
 * `get-event`-svaret (eventsidans aggregerande detalj för Skövde-eventet):
 * beläggningens innehållsmodell (task-18.2-fälten) + auto-utskicks-styrningen
 * — allt fruset mot samma värld som listsvaret.
 */
export const EVENT_DETAIL_RESPONSE = {
  event: {
    // `pris` följer med via spreaden av `events[0]` (Skövde, satt till 1500
    // ovan) — get-event och get-events delar samma `mapEvent`/`mapEventBas`
    // (`_shared/event-map.ts`), så samma tal är korrekt på båda ställena.
    ...EVENTS_RESPONSE.events[0],
    reserverade: 2,
    manuelltTillagda: 1,
    viaFormular: 6,
    medfoljande: 1,
    // TASK-373 (kontraktsvakts-fyndet 2026-09-04, run `33841484905`) —
    // AKTIVA länkade Anmälningar med Källa 'Manuell'/'Väntelista'/framtida
    // värden (`get-event/index.ts` § fetchBelaggning). ALDRIG `null` —
    // en räkning, precis som viaFormular/medfoljande/vantelista.
    //
    // 0, INTE 1 (rättat i review-runda 2, PR #2289): `src/lib/belaggning.ts`s
    // INVARIANT kräver viaFormular + ovrigaAnmalningar + manuelltTillagda =
    // basens `Antal anmälda` (events[0] spreadar `antalAnmalda: 8` hit).
    // 6 (viaFormular) + 0 + 1 (manuelltTillagda) = 8 = antalAnmalda. Ett `1`
    // hade brutit invarianten (9 ≠ 8) och fått mätaren att rendera "11 av 12"
    // i stället för korrekta "10 av 12" — granskningsfynd, inte en gissning.
    ovrigaAnmalningar: 0,
    vantelista: 2,
    deltagarinfoAutoAvstangt: false,
  },
} as const;

/** `get-event-notes`-svaret (eventsidans antecknings-ström, ADR-075). */
export const EVENT_NOTES_RESPONSE = {
  notes: [
    {
      id: 'recVisualNote00001',
      forfattare: 'Lotta',
      text: 'Lokalen bokad och bekräftad — samma sal som i våras.',
      tidpunkt: '2026-09-08T14:30:00.000Z',
      eventId: EVENT_SKOVDE,
    },
    {
      id: 'recVisualNote00002',
      forfattare: 'Roger',
      text: 'Fika beställd till båda dagarna.',
      tidpunkt: '2026-09-12T09:15:00.000Z',
      eventId: EVENT_SKOVDE,
    },
  ],
} as const;

/**
 * `get-event-attachments`-svaret (TASK-147.5, bilageväljarens verkliga
 * fundament). TOM som NORMALLÄGE — realistiskt default (de flesta event har
 * inte fått en bilaga uppladdad/genererad än) och minimalt fotavtryck: inget
 * nytt synligt innehåll i bilageväljaren för de BEFINTLIGA atgarder-testerna
 * (de öppnar aldrig väljarens checkbox-lista, bara actionsraderna ovanför
 * den). Ett test som faktiskt behöver riktiga bilagor att välja mellan
 * överskuggar med `network.use()`, per filhuvudets egen regel.
 */
export const EVENT_ATTACHMENTS_RESPONSE = { attachments: [] } as const;

/**
 * `get-places`-svaret (TASK-309.7, ADR-125 § 7) — den GLOBALA platslistan
 * bakom Mer → Platser OCH, sedan TASK-338.3, bakom räckviddsdialogens
 * Plats-axel. Samma läsväg, en fixtur (PRD TASK-338 berättelse 11: en ny
 * plats ska bara behöva läggas till en gång).
 *
 * TRE PLATSER, inte noll: en tom lista hade gjort Plats-selecten omöjlig att
 * pröva i acceptance-sviterna, och `usePlacesList` anropas numera av VARJE
 * öppning av uppladdningsdialogen — utan handler faller hermetik-vakten
 * (`hermetik-vakt.ts`) på ett omockat EF-anrop i stället för att testet
 * säger något om ytan.
 *
 * RÖNNINGE STÅR FÖRST OCH ÄR INTE GODTYCKLIG: det är PRD TASK-338:s egen
 * drivande instans (Rogers och Lottas hem, parkeringsbilagan och sushimenyn,
 * tråd T153) och ORDLISTA.md § Plats beskriver den som platsen med stabila
 * värden. Falköping och Gotland är de kontrasterande orterna ur PRD:ns
 * berättelse 3 — "ett event i Falköping ska INTE visa Rönninge-dokumenten".
 *
 * `falt` bär de fyra `PLATS_FALT_KEYS` (`PlaceListItemSchema`). De är
 * `null` här med avsikt: räckviddsdialogen läser bara `id`/`namn`, och en
 * fixtur som fyller fält ingen konsument i dessa sviter läser hade bara
 * varit en extra sanning att hålla synkad.
 */
export const PLACES_RESPONSE = {
  places: [
    {
      id: 'recPlatsRonninge01',
      namn: 'Rönninge',
      falt: { adress: null, parkering: null, transport: null, klader: null },
    },
    {
      id: 'recPlatsFalkoping1',
      namn: 'Falköping',
      falt: { adress: null, parkering: null, transport: null, klader: null },
    },
    {
      id: 'recPlatsGotland001',
      namn: 'Gotland',
      falt: { adress: null, parkering: null, transport: null, klader: null },
    },
  ],
} as const;

/** `get-event-formats`-svaret (de två skarpa bas-formaten). */
export const EVENT_FORMATS_RESPONSE = {
  eventFormats: [
    { id: 'recVisualFormat001', namn: 'Utbildning - 2 dagar' },
    { id: 'recVisualFormat002', namn: 'Föreläsning' },
  ],
} as const;

// ══════════════════════════════════════════════════════════════════════════
// PERSONER-VÄRLDEN (get-persons + get-person)
// ══════════════════════════════════════════════════════════════════════════
//
// FORM-TROHET. Fältvärdena nedan är live-verifierade mot PROD-basen
// `app8uGPrVCVOm6LfD` via MCP 2026-07-26 (9 stickprov i Personer, 4 i
// Deltaganden) — inte påhittade etiketter. Det som ändrades mot den första
// fixtur-generationen, och varför:
//
//  · `harAktivAnmalan` är formeln IF(kommande > 0, "Aktiv", "Ingen aktiv
//    anmälan") → ALDRIG null, ALDRIG "Ja". Den gamla fixturen skrev "Ja", ett
//    värde som inte finns i basen. Konsekvensen syns nu i listan: PersonsList
//    renderar bokstavligen "Aktiv anmälan: Ingen aktiv anmälan" (den grenar på
//    truthiness, inte på strängvärdet). Det är en verklig defekt som fixturen
//    tidigare dolde — den ska synas i prototyp-underlaget, inte döljas.
//  · `erfarenhetsniva` / `erfarenhetsbadge` är SWITCH-formler → ALLTID satta,
//    aldrig null. Badge-värdena är "Ej påbörjat" · "Fjärrskådare" ·
//    "Resenär steg 1" · "Resenär steg 1 (upprepat)" · "Resenär steg 1–2" ·
//    "Resenär steg 1–2 (upprepat)" · "Avvikelse" (data-model.md §Insiktskedjan).
//    De gamla värdena "RIM 1"/"RIM 2" existerar inte. Notera längden på
//    "Resenär steg 1–2 (upprepat)" — en pill-design måste tåla den.
//  · `manuellFlagga` ("Manuella flagga") är en singleSelect med choices=[] i
//    basen → ALLTID null (data-model.md §Kända fällor 25). Död yta. Den gamla
//    fixturens "Följ upp betalning" gick inte att få fram i verkligheten.
//  · `senasteInteraktion` har TRE grenar, formen ändrad 2026-08-10 (ADR-108):
//      anmälan   "Anmälde sig" + valfritt " till <Kurs>" + valfritt " i <Ort>"
//      deltagande "Deltog på <Kurs> i <Ort>" ELLER fallback "Deltog · <Event
//                 sammanfattning>" när Kursnamn-lookupen är tom (BEVARAD
//                 prickform, med avsikt — se ADR-108)
//      touchpoint "Hämtade <erbjudande>" (oförändrad; andra Typ-val ger andra
//                 verb, t.ex. "Anmälde sig" vid en touchpoint som förlorar
//                 tie-break mot en riktig anmälan)
//    Live-verifierat mot staging (`apphjj8Q7lkXCMsL4`) 2026-08-10 via
//    `describe_table` + `list_records`. Datumet som tidigare stod FÖRST i
//    strängen ("2026-09-13 09:41 – …") togs bort samma dag — det dubblerade
//    `senasteInteraktionDatum`, som redan är ett eget fält. Nedan täcker
//    samtliga fyra anmälnings-kombinationer, deltagandes båda former och
//    touchpoints huvudform — en radgrammatik ska tåla alla.
//  · `namn` är formeln IF(båda namnfälten tomma, "Ej tillgängligt", …) → en
//    namnlös lead bär STRÄNGEN "Ej tillgängligt", inte null (fälla 43).
//  · `radSkapad` / `senasteInteraktionDatum` är ISO-datetime i prod, inte
//    datum-strängar.
//
// TOMMA FÄLT ÄR AVSIKTLIGA: tre personer saknar e-post, två saknar telefon, en
// saknar båda, flera saknar ort. En design som bara håller för fulla rader är
// inte färdig.

/** De två kuraterade persondetaljerna, exporterade så prototyp-pass och specar
 *  kan djuplänka (`/personer/${VISUAL_PERSON_RIK_ID}`) utan ID-kopiering. */
export const VISUAL_PERSON_RIK_ID = 'recVisualPers00009';
export const VISUAL_PERSON_TUNN_ID = 'recVisualPers00017';

/**
 * DEN RIKA personen — maximal fyllnad: sex anmälningar, tio deltaganden över
 * fem event (varav ett KOMMANDE), tre lead-hämtningar, lång motivering, lång
 * anteckning, AI-flagga, community-flaggor och tre orter.
 *
 * Not om `antalDeltaganden` (3) < `antalGenomfordaEvent` (4): det är basens
 * verkliga form, inte ett slarvfel. "Totala deltaganden" = RIM 1 × + RIM 2 × +
 * Fjärrskådning × och missar övriga kurstyper (data-model.md §Kända fällor 31,
 * LUCKA A) medan "Antal genomförda event" summerar alla. Detaljvyn visar båda
 * talen i samma lista — motsägelsen ska synas i underlaget.
 */
const PERSON_RIK = {
  id: VISUAL_PERSON_RIK_ID,
  namn: 'Ingrid Isaksson',
  fornamn: 'Ingrid',
  efternamn: 'Isaksson',
  email: 'ingrid.isaksson@example.se',
  telefon: '0705558812',
  ort: ['Rönninge', 'Skövde', 'Varberg'],
  manuellFlagga: null,
  aiFlagga: 'Stabil och mottaglig',
  anteckningar:
    'Ringde själv inför Skövde-eventet och erbjöd sig att hjälpa till med incheckningen. Har med sig två vänner som inte anmält sig ännu — stäm av platsantalet med Roger innan bekräftelsen går ut.',
  antalAnmalningar: 6,
  antalDeltaganden: 3,
  erfarenhetsniva: 'Genomfört RIM steg 1–2 (upprepat)',
  erfarenhetsbadge: 'Resenär steg 1–2 (upprepat)',
  senasteInteraktion: 'Anmälde sig till RIM 2 i Rönninge',
  senasteInteraktionDatum: '2026-09-12T18:04:11.482Z',
  dagarSedanSenaste: 3,
  harAktivAnmalan: 'Aktiv',
  ejGodkandMail: false,
  radSkapad: '2024-08-14T09:22:41.000Z',
  anmalningIds: [
    'recVisualReg000101',
    'recVisualReg000102',
    'recVisualReg000103',
    'recVisualReg000104',
    'recVisualReg000105',
    'recVisualReg000106',
  ],
  deltagandeIds: [
    'recVisualDelt00101',
    'recVisualDelt00102',
    'recVisualDelt00103',
    'recVisualDelt00104',
    'recVisualDelt00105',
    'recVisualDelt00106',
    'recVisualDelt00107',
    'recVisualDelt00108',
    'recVisualDelt00109',
    'recVisualDelt00110',
  ],
};

/**
 * DEN TUNNA personen — en namnlös lead som nyss angett sin e-post för ett
 * erbjudande (A4-flödet). Allt utom e-post är tomt: inga anmälningar, inga
 * deltaganden, ingen ort, inget telefonnummer, ingen historik, inga hämtningar,
 * inga flaggor, ingen anteckning.
 *
 * Den är lika viktig som den rika: den är enda sättet att se om designen bär
 * sina TOMTILLSTÅND. `namn` = "Ej tillgängligt" är basens formel-utfall, inte
 * en platshållare vi hittat på — persondetaljens `displayName` faller därför
 * ALDRIG tillbaka på "Namnlös person — <e-post>" i skarp drift, den skriver
 * "Ej tillgängligt" som rubrik. Det är ett designproblem som ska bedömas.
 */
const PERSON_TUNN = {
  id: VISUAL_PERSON_TUNN_ID,
  namn: 'Ej tillgängligt',
  fornamn: null,
  efternamn: null,
  email: 'p.lindqvist@example.se',
  telefon: null,
  ort: [],
  manuellFlagga: null,
  aiFlagga: null,
  anteckningar: null,
  antalAnmalningar: 0,
  antalDeltaganden: 0,
  erfarenhetsniva: 'Ej påbörjat',
  erfarenhetsbadge: 'Ej påbörjat',
  senasteInteraktion: 'Hämtade Meditationen Kraftfältet',
  senasteInteraktionDatum: '2026-09-14T08:12:03.117Z',
  dagarSedanSenaste: 1,
  harAktivAnmalan: 'Ingen aktiv anmälan',
  ejGodkandMail: false,
  radSkapad: '2026-09-14T08:12:03.000Z',
  anmalningIds: [],
  deltagandeIds: [],
};

/**
 * `get-persons`-världen — HELA personmängden (17 personer), i namn-ordning.
 *
 * `nextCursor: null` här betyder "detta är hela världen", inte "en sida".
 * Sidindelningen görs av `resolvePersonsResponse` nedan, som är den mock
 * hermetic.ts faktiskt registrerar.
 */
export const PERSONS_RESPONSE = {
  persons: [
    {
      id: 'recVisualPers00001',
      namn: 'Anna Andersson',
      fornamn: 'Anna',
      efternamn: 'Andersson',
      email: 'anna.andersson@example.se',
      telefon: '070-123 45 01',
      ort: ['Skövde'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      senasteInteraktion: 'Anmälde sig till RIM 1 i Skövde',
      senasteInteraktionDatum: '2026-09-13T09:41:22.184Z',
      dagarSedanSenaste: 2,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-09-13T09:41:21.000Z',
      anmalningIds: ['recVisualReg000001'],
      deltagandeIds: [],
    },
    {
      id: 'recVisualPers00002',
      namn: 'Björn Bergström',
      fornamn: 'Björn',
      efternamn: 'Bergström',
      email: 'bjorn.bergstrom@example.se',
      telefon: '070-123 45 02',
      ort: ['Skövde', 'Varberg'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: 'Återkommande deltagare.',
      antalAnmalningar: 2,
      antalDeltaganden: 1,
      erfarenhetsniva: 'RIM steg 1',
      erfarenhetsbadge: 'Resenär steg 1',
      senasteInteraktion: 'Anmälde sig till RIM 2 i Varberg',
      senasteInteraktionDatum: '2026-09-14T18:07:55.903Z',
      dagarSedanSenaste: 1,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-04-02T11:18:04.000Z',
      anmalningIds: ['recVisualReg000002'],
      deltagandeIds: ['recVisualDelt00001'],
    },
    {
      id: 'recVisualPers00003',
      namn: 'Cecilia Ceder',
      fornamn: 'Cecilia',
      efternamn: 'Ceder',
      email: 'cecilia.ceder@example.se',
      telefon: '070-123 45 03',
      ort: ['Skövde'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: 'Vegetarisk kost.',
      antalAnmalningar: 1,
      antalDeltaganden: 1,
      erfarenhetsniva: 'RIM steg 1',
      erfarenhetsbadge: 'Resenär steg 1',
      senasteInteraktion: 'Deltog på RIM 1 i Varberg',
      senasteInteraktionDatum: '2026-08-22T00:00:00.000Z',
      dagarSedanSenaste: 24,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-02-17T14:03:55.000Z',
      anmalningIds: ['recVisualReg000003'],
      deltagandeIds: ['recVisualDelt00002'],
    },
    {
      id: 'recVisualPers00004',
      namn: 'David Dahl',
      fornamn: 'David',
      efternamn: 'Dahl',
      email: 'david.dahl@example.se',
      telefon: '070-123 45 04',
      ort: ['Skövde'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      senasteInteraktion: 'Anmälde sig till Fjärrskådning i Skövde',
      senasteInteraktionDatum: '2026-09-01T16:20:39.472Z',
      dagarSedanSenaste: 14,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-08-28T10:02:11.000Z',
      anmalningIds: ['recVisualReg000004'],
      deltagandeIds: [],
    },
    // "Ej tillgängligt" sorterar mellan David och Emma — namnlösa leads
    // hamnar mitt i listan i skarp drift, inte samlade i en klump.
    PERSON_TUNN,
    {
      id: 'recVisualPers00005',
      namn: 'Emma Eklund',
      fornamn: 'Emma',
      efternamn: 'Eklund',
      email: 'emma.eklund@example.se',
      telefon: '070-123 45 05',
      ort: ['Göteborg'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 2,
      erfarenhetsniva: 'Genomfört RIM steg 1–2',
      erfarenhetsbadge: 'Resenär steg 1–2',
      senasteInteraktion: 'Anmälde sig till RIM 3 i Göteborg',
      senasteInteraktionDatum: '2026-09-05T12:33:07.611Z',
      dagarSedanSenaste: 10,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2025-11-20T19:44:02.000Z',
      anmalningIds: ['recVisualReg000005'],
      deltagandeIds: ['recVisualDelt00003', 'recVisualDelt00004'],
    },
    {
      id: 'recVisualPers00006',
      namn: 'Filip Forsberg',
      fornamn: 'Filip',
      efternamn: 'Forsberg',
      email: 'filip.forsberg@example.se',
      telefon: '070-123 45 06',
      ort: ['Skövde'],
      // manuellFlagga är ALLTID null i basen (choices=[], fälla 25).
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      // Ort men ingen kurs — samma kombination som live-verifierats mot
      // `ZZ-History Person 01` 2026-08-10 (ADR-108).
      senasteInteraktion: 'Anmälde sig i Skövde',
      senasteInteraktionDatum: '2026-09-10T08:15:44.021Z',
      dagarSedanSenaste: 5,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-08-25T08:15:44.000Z',
      anmalningIds: ['recVisualReg000006'],
      deltagandeIds: [],
    },
    {
      id: 'recVisualPers00007',
      namn: 'Gunilla Granqvist',
      fornamn: 'Gunilla',
      efternamn: 'Granqvist',
      email: 'gunilla.granqvist@example.se',
      telefon: '070-123 45 07',
      ort: ['Varberg'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 3,
      erfarenhetsniva: 'Genomfört RIM steg 1–2 (upprepat)',
      erfarenhetsbadge: 'Resenär steg 1–2 (upprepat)',
      senasteInteraktion: 'Deltog på RIM 2 i Varberg',
      senasteInteraktionDatum: '2026-08-22T00:00:00.000Z',
      dagarSedanSenaste: 24,
      harAktivAnmalan: 'Ingen aktiv anmälan',
      ejGodkandMail: false,
      radSkapad: '2025-05-12T07:31:19.000Z',
      anmalningIds: ['recVisualReg000007'],
      deltagandeIds: ['recVisualDelt00005', 'recVisualDelt00006', 'recVisualDelt00007'],
    },
    {
      id: 'recVisualPers00008',
      namn: 'Hassan Haddad',
      fornamn: 'Hassan',
      efternamn: 'Haddad',
      email: 'hassan.haddad@example.se',
      telefon: '070-123 45 08',
      ort: [],
      manuellFlagga: null,
      aiFlagga: 'Stabil och mottaglig',
      anteckningar: 'Fyllde i intresseformuläret i somras. Vill veta mer om fjärrskådning.',
      antalAnmalningar: 0,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      senasteInteraktion: 'Hämtade Pyramidernas Vajrar',
      senasteInteraktionDatum: '2026-07-30T21:04:18.220Z',
      dagarSedanSenaste: 47,
      harAktivAnmalan: 'Ingen aktiv anmälan',
      ejGodkandMail: true,
      radSkapad: '2026-07-30T21:04:17.000Z',
      anmalningIds: [],
      deltagandeIds: [],
    },
    PERSON_RIK,
    {
      // Utan e-post: anmäld per telefon. contactLine faller tillbaka på ett värde.
      id: 'recVisualPers00010',
      namn: 'Johan Jonsson',
      fornamn: 'Johan',
      efternamn: 'Jonsson',
      email: null,
      telefon: '0703112244',
      ort: ['Ulvåker'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: 'Anmäld per telefon — e-post saknas, ring för bekräftelse.',
      antalAnmalningar: 1,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      senasteInteraktion: 'Anmälde sig till RIM 1 i Ulvåker',
      senasteInteraktionDatum: '2026-09-11T13:52:10.664Z',
      dagarSedanSenaste: 4,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-09-11T13:52:10.000Z',
      anmalningIds: ['recVisualReg000010'],
      deltagandeIds: [],
    },
    {
      id: 'recVisualPers00011',
      namn: 'Karin Kvist',
      fornamn: 'Karin',
      efternamn: 'Kvist',
      email: 'karin.kvist@example.se',
      telefon: '0708871209',
      ort: ['Göteborg', 'Skövde'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 3,
      antalDeltaganden: 2,
      erfarenhetsniva: 'Genomfört RIM steg 1–2',
      erfarenhetsbadge: 'Resenär steg 1–2',
      senasteInteraktion: 'Deltog på RIM 2 i Göteborg',
      senasteInteraktionDatum: '2026-06-13T00:00:00.000Z',
      dagarSedanSenaste: 94,
      harAktivAnmalan: 'Ingen aktiv anmälan',
      ejGodkandMail: false,
      radSkapad: '2024-11-02T18:20:33.000Z',
      anmalningIds: ['recVisualReg000011', 'recVisualReg000012', 'recVisualReg000013'],
      deltagandeIds: [
        'recVisualDelt00011',
        'recVisualDelt00012',
        'recVisualDelt00013',
        'recVisualDelt00014',
      ],
    },
    {
      // Utan telefon.
      id: 'recVisualPers00012',
      namn: 'Leila Khoury',
      fornamn: 'Leila',
      efternamn: 'Khoury',
      email: 'leila.khoury@example.se',
      telefon: null,
      ort: ['Göteborg'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 1,
      antalDeltaganden: 1,
      erfarenhetsniva: 'Fjärrskådning',
      erfarenhetsbadge: 'Fjärrskådare',
      // Erbjudande-fältet tomt i formeln → fallback "ett erbjudande".
      senasteInteraktion: 'Hämtade ett erbjudande',
      senasteInteraktionDatum: '2026-09-09T20:11:38.905Z',
      dagarSedanSenaste: 6,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2026-03-08T09:15:27.000Z',
      anmalningIds: ['recVisualReg000014'],
      deltagandeIds: ['recVisualDelt00015', 'recVisualDelt00016'],
    },
    {
      id: 'recVisualPers00013',
      namn: 'Mikael Malm',
      fornamn: 'Mikael',
      efternamn: 'Malm',
      email: 'mikael.malm@example.se',
      telefon: '0730559914',
      ort: ['Skövde'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: 'Avregistrerade sig från utskick i augusti.',
      antalAnmalningar: 2,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      // Kurs men ingen ort — anmälans egen Ort tom, eventet saknar lookup-träff.
      senasteInteraktion: 'Anmälde sig till RIM 1',
      senasteInteraktionDatum: '2026-08-19T07:48:52.310Z',
      dagarSedanSenaste: 27,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: true,
      radSkapad: '2026-05-19T07:48:52.000Z',
      anmalningIds: ['recVisualReg000015', 'recVisualReg000016'],
      deltagandeIds: [],
    },
    {
      // Utan e-post, med lång kurshistorik — den kombination som gör att en
      // "maila alla"-affordans tyst tappar sin mest erfarna deltagare.
      id: 'recVisualPers00014',
      namn: 'Nina Nyström',
      fornamn: 'Nina',
      efternamn: 'Nyström',
      email: null,
      telefon: '0761224408',
      ort: ['Stockholm'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 4,
      antalDeltaganden: 3,
      erfarenhetsniva: 'Genomfört RIM steg 1–2 (upprepat)',
      erfarenhetsbadge: 'Resenär steg 1–2 (upprepat)',
      // Deltagandegrenens FALLBACK: Kursnamn-lookupen tom → hela Event
      // sammanfattning, prickformen bevarad med avsikt (ADR-108).
      senasteInteraktion: 'Deltog · Stockholm – Utbildning – Fjärrskådning – 2026-04-11',
      senasteInteraktionDatum: '2026-04-11T00:00:00.000Z',
      dagarSedanSenaste: 157,
      harAktivAnmalan: 'Ingen aktiv anmälan',
      ejGodkandMail: false,
      radSkapad: '2024-06-30T16:12:08.000Z',
      anmalningIds: [
        'recVisualReg000017',
        'recVisualReg000018',
        'recVisualReg000019',
        'recVisualReg000020',
      ],
      deltagandeIds: [
        'recVisualDelt00021',
        'recVisualDelt00022',
        'recVisualDelt00023',
        'recVisualDelt00024',
        'recVisualDelt00025',
        'recVisualDelt00026',
      ],
    },
    {
      // Varken e-post eller telefon — backfillad rad. contactLine ger null och
      // raden tappar hela sin mellanrad.
      id: 'recVisualPers00015',
      namn: 'Oskar Olsson',
      fornamn: 'Oskar',
      efternamn: 'Olsson',
      email: null,
      telefon: null,
      ort: [],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: 'Backfillad rad från 2024 — kontaktuppgifter saknas i källan.',
      antalAnmalningar: 1,
      antalDeltaganden: 0,
      erfarenhetsniva: 'Ej påbörjat',
      erfarenhetsbadge: 'Ej påbörjat',
      // Varken kurs eller ort — samma kombination som live-verifierats mot
      // `ZZ-Conformance Person 01-05` 2026-08-10 (ADR-108).
      senasteInteraktion: 'Anmälde sig',
      senasteInteraktionDatum: '2026-04-19T17:15:02.883Z',
      dagarSedanSenaste: 149,
      harAktivAnmalan: 'Ingen aktiv anmälan',
      ejGodkandMail: false,
      radSkapad: '2026-04-19T17:15:01.000Z',
      anmalningIds: ['recVisualReg000021'],
      deltagandeIds: [],
    },
    {
      id: 'recVisualPers00016',
      namn: 'Petra Palm',
      fornamn: 'Petra',
      efternamn: 'Palm',
      email: 'petra.palm@example.se',
      telefon: '0725540071',
      ort: ['Stockholm', 'Rönninge'],
      manuellFlagga: null,
      aiFlagga: null,
      anteckningar: null,
      antalAnmalningar: 2,
      antalDeltaganden: 1,
      erfarenhetsniva: 'RIM steg 1 – upprepat',
      erfarenhetsbadge: 'Resenär steg 1 (upprepat)',
      senasteInteraktion: 'Anmälde sig till RIM 2 i Stockholm',
      senasteInteraktionDatum: '2026-09-08T11:26:44.512Z',
      dagarSedanSenaste: 7,
      harAktivAnmalan: 'Aktiv',
      ejGodkandMail: false,
      radSkapad: '2025-09-01T11:26:44.000Z',
      anmalningIds: ['recVisualReg000022', 'recVisualReg000023'],
      deltagandeIds: ['recVisualDelt00031', 'recVisualDelt00032'],
    },
  ],
  nextCursor: null,
} as const;

type FixturePerson = (typeof PERSONS_RESPONSE)['persons'][number];

/**
 * Sidstorlek i fixturvärlden.
 *
 * Appen skickar `pageSize=50` (PersonsList PAGE_SIZE, ADR-056) och världen har
 * 17 personer — utan tak hade "Ladda fler" ALDRIG renderats och listans näst
 * viktigaste beteende varit osynligt i varje snapshot. Taket är därför ett
 * medvetet instrument, inte en avvikelse från EF-formen: EF:en klampar likaså
 * mot ett tak (Airtables 100). 10 är valt så första sidan är lång nog att se ut
 * som en scanlista och andra sidan (7) fortfarande fylls.
 */
const FIXTURE_PAGE_SIZE = 10;

/**
 * Opak cursor i EF:ens envelope-form (`{ o: <backend-token> }` base64-kodad,
 * `_shared/cursor.ts`). Fixturens backend-token är radindex — klienten ser
 * aldrig formen, precis som mot Airtables offset (ADR-056).
 */
function encodeFixtureCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: String(offset) })).toString('base64');
}

/** Packar upp fixtur-cursorn; felformad → 0 (första sidan), aldrig krasch. */
function decodeFixtureCursor(cursor: string): number {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    const token = (parsed as { o?: unknown } | null)?.o;
    const offset = Number.parseInt(typeof token === 'string' ? token : '', 10);
    return Number.isFinite(offset) && offset > 0 ? offset : 0;
  } catch {
    return 0;
  }
}

/**
 * Speglar EF:ens `buildSearchAcrossFieldsFilter`: gemen-normaliserad
 * delsträngsmatchning över Namn, E-post, Telefon och ARRAYJOIN(Ort)
 * (`get-persons/index.ts` SEARCH_FIELDS).
 */
function matchesSearch(person: FixturePerson, term: string): boolean {
  if (!term) return true;
  return [person.namn, person.email, person.telefon, person.ort.join(' ')]
    .filter((value): value is string => typeof value === 'string')
    .some((value) => value.toLowerCase().includes(term));
}

/**
 * `get-persons`-mocken — param-medveten resolver, inte ett fruset objekt.
 *
 * Respekterar `?search=`, `?pageSize=` och `?cursor=` med samma semantik som
 * EF:en: sortering på Namn stigande, sökning över fyra fält, opak cursor och
 * `nextCursor: null` först på sista sidan. Det är det som gör att BÅDE
 * sökningen och "Ladda fler" går att visa i fixturvärlden.
 *
 * [TOTAL BORTTAGEN, TASK-286.3] Sök-/cursor-grenen bar tidigare ett
 * `total`-fält (TASK-277 Del 1) som speglade EF:ens additiva svarsfält. EF:ens
 * full-walk som producerade talet är RIVEN (`get-persons/index.ts`, AC #2) —
 * kuvertet är åter `{ persons, nextCursor }`, och fixturen speglar det. En
 * fixtur som fortsatt levererat `total` hade varit exakt den divergens
 * kontraktsvakten finns för att fånga.
 *
 * [TILLAGD, TASK-286.2] `?register=true` speglar EF:ens EGEN, TIDIGA retur
 * (`get-persons/index.ts`, ADR-123 beslut 1) — SAMMA plats i denna funktion:
 * en gren FÖRE sök-/cursor-parsningen, aldrig en väg genom den. Returnerar
 * HELA fixturvärlden (alla 17, Namn-asc, ingen sidskärning) i register-
 * formens `{ persons }`, precis som EF-svaret.
 *
 * SORTERINGEN HÄR ÄR EF:ENS, INTE KLIENTENS — medvetet. `localeCompare(…,
 * 'sv')` speglar Airtables `sort: [{ field: 'Namn' }]`, alltså UTAN
 * TASK-286.3:s sentinel-sist-regel. Klientens `sorteraPersonregister`
 * (`src/lib/person-sok.ts`) räknar om ordningen efter hämtningen; att baka in
 * regeln redan här hade dolt om klientsorteringen faktiskt gör något.
 *
 * Sök-/cursor-grenen nedan lever kvar därför att EF:ens motsvarande gren gör
 * det (fyra blockerande testytor läser den — se `get-persons/index.ts`s
 * rivningsnot). Listan konsumerar den inte sedan TASK-286.2.
 */
export function resolvePersonsResponse(url: URL) {
  if (url.searchParams.get('register') === 'true') {
    return {
      persons: [...PERSONS_RESPONSE.persons].sort((a, b) => a.namn.localeCompare(b.namn, 'sv')),
    };
  }

  const term = (url.searchParams.get('search') ?? '').trim().toLowerCase();
  const rawPageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '', 10);
  const pageSize = Math.min(
    Number.isFinite(rawPageSize) && rawPageSize > 0 ? rawPageSize : FIXTURE_PAGE_SIZE,
    FIXTURE_PAGE_SIZE,
  );
  const cursor = url.searchParams.get('cursor');
  const offset = cursor ? decodeFixtureCursor(cursor) : 0;

  const traffar = PERSONS_RESPONSE.persons
    .filter((person) => matchesSearch(person, term))
    .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));

  const slut = offset + pageSize;
  return {
    persons: traffar.slice(offset, slut),
    nextCursor: slut < traffar.length ? encodeFixtureCursor(slut) : null,
  };
}

/**
 * Detaljfälten för DEN RIKA personen (PersonDetailSchema minus list-delmängden
 * — de tretton fält `Person.schema.ts` inte bär; `hamtningar`/`motiveringar`/
 * `flagga` tillkom S103 steg 2, se dedikerad not där de sätts nedan).
 *
 * Två saker att veta innan de läses som sanning:
 *
 *  1. `motivering` är `string[]` här (TASK-52, stängd) — schemat kräver det
 *     (`PersonDetail.schema.ts`) sedan get-person coercar fältet med
 *     `stringArray`. I prod är `Motivering (text)` en rollup-baserad FORMEL
 *     vars ELSE-gren returnerar sin rollup ORÖRD (live-verifierat:
 *     `["Det är dags", null]`) trots att fältet deklarerar `singleLineText`
 *     (data-model.md §Kända fällor #46) — det bas-sidiga typ-löftesbrottet
 *     kvarstår som öppen T16-maximeringskandidat, men konsekvensen ("Kunde
 *     inte hämta persondetaljer" för varje person med motivering) är stängd
 *     på app-sidan. Fixturen speglar nu den KORREKTA kontraktsformen, inte
 *     bas-avvikelsen.
 *  2. `nastaEvent` är MEDVETEN FIKTION — det enda fältet nedan som prod i
 *     praktiken aldrig producerar. EF:en läser `Nästa event (text)`, men basen
 *     bär fältet `Nästa event (rad)`; en live-kontrollerad person MED kommande
 *     event saknade `Nästa event (text)` helt, dvs. `nastaEvent` är i praktiken
 *     alltid null i drift. Värdet står kvar så en prototyp KAN pröva formen —
 *     men designa aldrig som om fältet vore fyllt idag.
 *
 * `antalHamtningar: 1` mot tre poster i `allaHamtningar` är däremot basens
 * verkliga inkonsistens (två olika rollups), inte ett slarvfel.
 */
const RIK_DETALJ = {
  aterkommande: 'Ja',
  nastaEvent: 'Skövde – Utbildning – Resor i medvetandet 3 – 2026-09-26',
  antalGenomfordaEvent: 4,
  senasteDeltagandeDatum: '2026-05-01',
  antalHamtningar: 1,
  allaHamtningar: [
    'Pyramidernas Vajrar (2026-06-09)',
    'Guidad meditation – Första resan (2025-11-25)',
    'Pyramidernas Vajrar (2024-10-02)',
  ],
  // Ettelements-array — den enda multipliciteten LIVE-verifierad hittills
  // (TASK-89: båda observerade staging-personerna hade exakt 1 motivering).
  // Flerhet (>1 element) är oprövad i verklig data; se
  // `tests/api/coerce.test.ts` § schema-parity — motivering för det
  // schema-nivå-beviset att kontraktet BÄR flerhet även om ingen live-post
  // ännu visar den.
  motivering: [
    'Jag har haft egna upplevelser och läst många böcker som gjort mig förvissad om att vi alla är del av samma medvetande. Nu vill jag lära mig metoder för att ta mig till andra nivåer — och den här gången vill jag ta med mig två vänner som är nyfikna men försiktiga.',
  ],
  // S103 steg 2: RIKTIGA poster bredvid `allaHamtningar`/`motivering` ovan —
  // samma tre hämtningar (samma datum/erbjudande, nu strukturerade i stället
  // för regex-plockade ur en rollup-sträng) + motiveringen kopplad till den
  // KOMMANDE anmälan (RIM 3, samma event som `historik`s första/kommande post).
  hamtningar: [
    {
      id: 'recVisualTP00001',
      erbjudande: 'Pyramidernas Vajrar',
      typ: 'Angett e-post för att ta del av ett erbjudande',
      datum: '2026-06-09',
    },
    {
      id: 'recVisualTP00002',
      erbjudande: 'Guidad meditation – Första resan',
      typ: 'Angett e-post för att ta del av ett erbjudande',
      datum: '2025-11-25',
    },
    {
      id: 'recVisualTP00003',
      erbjudande: 'Pyramidernas Vajrar',
      typ: 'Angett e-post för att ta del av ett erbjudande',
      datum: '2024-10-02',
    },
  ],
  motiveringar: [
    {
      id: 'recVisualAnm00001',
      motivering:
        'Jag har haft egna upplevelser och läst många böcker som gjort mig förvissad om att vi alla är del av samma medvetande. Nu vill jag lära mig metoder för att ta mig till andra nivåer — och den här gången vill jag ta med mig två vänner som är nyfikna men försiktiga.',
      event: 'Resor i medvetandet 3',
      datum: '2026-08-01T09:00:00.000Z',
      eventDatum: '2026-09-26',
      ort: 'Skövde',
      eventId: 'recVisualEvent001',
    },
  ],
  flagga: 'Ring innan nästa event',
  inbjudenCommunity: true,
  skapatKontoCommunity: true,
  // Tio deltaganden = fem event × Dag 1/Dag 2, sorterade datum DESC precis som
  // get-person sorterar dem. Statusmixen är basens verkliga optionsuppsättning
  // (Ej avstämt · Närvarande · Frånvarande · Försenad · Avbröt · Deltog online)
  // och `narvaro` = Närvaropoäng === 1, dvs. sant för Närvarande/Deltog online.
  //
  // Det ÖVERSTA eventet är KOMMANDE (2026-09-26 > FROZEN_NOW). Dagens
  // PersonDetail skriver "Ej närvaro" på det — en framtida kurs kan inte ha
  // frånvaro. Den defekten ska synas i prototyp-underlaget, inte döljas.
  historik: [
    {
      id: 'recVisualDelt00101',
      kursnamn: 'Resor i medvetandet 3',
      eventLabel: 'Skövde – Utbildning – Resor i medvetandet 3 – 2026-09-26',
      datum: '2026-09-26',
      session: 'Dag 1',
      status: 'Ej avstämt',
      narvaro: false,
      ort: 'Skövde',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00102',
      kursnamn: 'Resor i medvetandet 3',
      eventLabel: 'Skövde – Utbildning – Resor i medvetandet 3 – 2026-09-26',
      datum: '2026-09-26',
      session: 'Dag 2',
      status: 'Ej avstämt',
      narvaro: false,
      ort: 'Skövde',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00103',
      kursnamn: 'Psionautics',
      eventLabel: 'Ödeshög – Utbildning – Psionautics – 2026-05-01',
      datum: '2026-05-01',
      session: 'Dag 1',
      status: 'Närvarande',
      narvaro: true,
      ort: 'Ödeshög',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00104',
      kursnamn: 'Psionautics',
      eventLabel: 'Ödeshög – Utbildning – Psionautics – 2026-05-01',
      datum: '2026-05-01',
      session: 'Dag 2',
      status: 'Deltog online',
      narvaro: true,
      ort: 'Ödeshög',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00105',
      kursnamn: 'Fjärrskådning',
      eventLabel: 'Varberg – Utbildning – Fjärrskådning – 2026-02-07',
      datum: '2026-02-07',
      session: 'Dag 1',
      status: 'Närvarande',
      narvaro: true,
      ort: 'Varberg',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00106',
      kursnamn: 'Fjärrskådning',
      eventLabel: 'Varberg – Utbildning – Fjärrskådning – 2026-02-07',
      datum: '2026-02-07',
      session: 'Dag 2',
      status: 'Frånvarande',
      narvaro: false,
      ort: 'Varberg',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00107',
      kursnamn: 'Resor i medvetandet 2',
      eventLabel: 'Rönninge – Utbildning – Resor i medvetandet 2 – 2025-10-18',
      datum: '2025-10-18',
      session: 'Dag 1',
      status: 'Närvarande',
      narvaro: true,
      ort: 'Rönninge',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00108',
      kursnamn: 'Resor i medvetandet 2',
      eventLabel: 'Rönninge – Utbildning – Resor i medvetandet 2 – 2025-10-18',
      datum: '2025-10-18',
      session: 'Dag 2',
      status: 'Närvarande',
      narvaro: true,
      ort: 'Rönninge',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00109',
      kursnamn: 'Resor i medvetandet 1',
      eventLabel: 'Rönninge – Utbildning – Resor i medvetandet 1 – 2024-11-17',
      datum: '2024-11-17',
      session: 'Dag 1',
      status: 'Försenad',
      narvaro: true,
      ort: 'Rönninge',
      typ: 'Utbildning',
    },
    {
      id: 'recVisualDelt00110',
      kursnamn: 'Resor i medvetandet 1',
      eventLabel: 'Rönninge – Utbildning – Resor i medvetandet 1 – 2024-11-17',
      datum: '2024-11-17',
      session: 'Dag 2',
      status: 'Avbröt',
      narvaro: false,
      ort: 'Rönninge',
      typ: 'Utbildning',
    },
  ],
};

/**
 * Detaljfälten för DEN TUNNA personen — allt tomt. Detaljvyns tre tomtillstånd
 * (kontakt utan ort, "Ingen registrerad kurshistorik", "Inga
 * lead-magnet-hämtningar registrerade") utlöses alla av den här posten.
 */
const TUNN_DETALJ = {
  aterkommande: 'Nej',
  nastaEvent: null,
  antalGenomfordaEvent: 0,
  senasteDeltagandeDatum: null,
  antalHamtningar: 0,
  allaHamtningar: [],
  motivering: [],
  hamtningar: [],
  motiveringar: [],
  flagga: null,
  inbjudenCommunity: false,
  skapatKontoCommunity: false,
  historik: [],
};

/**
 * Härledd detalj-stomme för de personer som INTE är kuraterade: listradens 22
 * fält + de tio detaljfälten tomma. Finns för att varje rad i listan ska vara
 * klickbar under prototyp-arbetet — utan den ger 15 av 17 rader felruta i
 * stället för en vy.
 *
 * VARNING: stommen är inte konsistent med listraden (en person med
 * `antalDeltaganden: 3` får ändå `historik: []`). Bedöm aldrig
 * historik-designen mot en härledd person — använd de två kuraterade.
 */
const HARLEDD_DETALJ_STOMME = {
  aterkommande: 'Nej',
  nastaEvent: null,
  antalGenomfordaEvent: 0,
  senasteDeltagandeDatum: null,
  antalHamtningar: 0,
  allaHamtningar: [],
  motivering: [],
  hamtningar: [],
  motiveringar: [],
  flagga: null,
  inbjudenCommunity: false,
  skapatKontoCommunity: false,
  historik: [],
};

/** `get-person`-svaren för de två kuraterade personerna, keyed på record-ID. */
export const PERSON_DETAIL_RESPONSE = {
  [VISUAL_PERSON_RIK_ID]: { person: { ...PERSON_RIK, ...RIK_DETALJ } },
  [VISUAL_PERSON_TUNN_ID]: { person: { ...PERSON_TUNN, ...TUNN_DETALJ } },
};

/**
 * `get-person-notes`-svaret (S103 2026-08-12, persondetaljens promoverings-
 * grind). Formen är `PersonNoteSchema`s — syskon till `EVENT_NOTES_RESPONSE`
 * ovan, med `personId` i stället för `eventId`.
 *
 * VARFÖR DEN BEHÖVDES: persondetaljens anteckningsblock (B7) anropar EF:en
 * ovillkorligt, och hermetik-vakten fällde grindens första körning på exakt
 * det omockade anropet (`GET .../get-person-notes?personId=recVisualPers00009`).
 * Vakten gjorde sitt jobb — den tysta alternativa vägen vore ett tomt block
 * som såg ut som ett legitimt tomläge.
 *
 * PER PERSON, inte globalt: den RIKA personen bär två anteckningar (blockets
 * fyllda form med författare + tidpunkt), den TUNNA noll (tomlägets form).
 * Grindens två lägen prövar därmed båda formerna, samma delning som resten av
 * fixturvärldens rik/tunn-par.
 */
export const PERSON_NOTES_RESPONSE = {
  [VISUAL_PERSON_RIK_ID]: {
    notes: [
      {
        id: 'recVisualPNote0001',
        forfattare: 'Lotta',
        text: 'Ringde och undrade om det gick att dela upp betalningen — löste det med två delbetalningar.',
        tidpunkt: '2026-06-14T09:20:00.000Z',
        personId: VISUAL_PERSON_RIK_ID,
      },
      {
        id: 'recVisualPNote0002',
        forfattare: 'Roger',
        text: 'Frågade om allergier inför övernattningen. Noterat: laktosintolerant.',
        tidpunkt: '2026-05-02T16:45:00.000Z',
        personId: VISUAL_PERSON_RIK_ID,
      },
    ],
  },
  [VISUAL_PERSON_TUNN_ID]: { notes: [] },
} as const;

/**
 * `get-person-notes`-mocken. Samma resolver-form som `resolvePersonResponse`:
 * kuraterat svar för de två fixturpersonerna, TOMT för alla andra ID:n.
 *
 * Tomt — inte `undefined` — för okända ID:n med avsikt: en person utan
 * anteckningar är ett legitimt läge i den här EF:en (till skillnad från
 * `get-person`, där ett okänt ID betyder att personen inte finns), och en 501
 * hade fällt varje framtida test som råkar öppna en annan fixturperson.
 */
export function resolvePersonNotesResponse(url: URL) {
  const id = url.searchParams.get('personId');
  if (!id) return { notes: [] };
  return PERSON_NOTES_RESPONSE[id as keyof typeof PERSON_NOTES_RESPONSE] ?? { notes: [] };
}

/**
 * `get-person`-mocken. Kuraterad detalj om ID:t är en av de två; annars en
 * härledd stomme ur listraden. ID utanför fixturvärlden → `undefined`, vilket
 * hermetic.ts besvarar med 501 i klartext (synligt fel, aldrig tyst tom vy).
 * EF:ens 404-gren går alltså inte att öva här — den kräver statuskod-stöd i
 * mock-harnesset och behövs inte för person-ytornas designarbete.
 */
export function resolvePersonResponse(url: URL) {
  const id = url.searchParams.get('id');
  if (!id) return undefined;

  const kuraterad = PERSON_DETAIL_RESPONSE[id as keyof typeof PERSON_DETAIL_RESPONSE];
  if (kuraterad) return kuraterad;

  const listrad = PERSONS_RESPONSE.persons.find((person) => person.id === id);
  if (!listrad) return undefined;
  return { person: { ...listrad, ...HARLEDD_DETALJ_STOMME } };
}

// ── Aktivitetsloggen (TASK-201.7) ────────────────────────────────────────
//
// `get-activity-log`-svaret. LIGGER I NORMALLÄGET, inte per test — och det är
// en följd av hem-vyn, inte en smak: hem-spalten "Senaste aktivitet"
// (`SenasteAktivitet.tsx`) hämtar loggen vid VARJE hem-rendering på ≥xl, och
// acceptance-projektet kör 1280×720 (playwright.config.ts § acceptance) medan
// visual-desktop kör 1440×900. Ett omockat `get-activity-log` hade därmed
// fällt varje befintligt hem-test via hermetik-vakten. Samma resonemang som
// `log-activity` redan bär i `handlers.ts`: anropet är lika mycket en del av
// normalläget som `get-events`/`get-registrations`.
//
// Innehållet speglar K10-facitets fyra rader (aktör + händelse + objekt) och
// är daterat relativt FROZEN_NOW (2026-09-15T10:00+02:00) så spaltens
// relativa tider är stabila: "för 2 tim sedan", "för 5 tim sedan",
// "igår 16:42", "igår 09:15". En FEMTE post ligger med, längre bak, så
// `pageSize`-avkortningen faktiskt går att mäta (fyra rader ur fem).
//
// Personerna är FIKTIVA (samma regel som resten av världen). Aktörsnamnen är
// däremot husets tre verkliga förnamn — de kommer ur `AuthUser.displayName`
// och är inte deltagardata.
const XAPI_BAS = 'https://admin.miranon.dev/xapi';
const REQUEST_ID_IRI = `${XAPI_BAS}/extensions/requestId`;

/** Ett statement i EF-svarets egen form (`ActivityStatementSchema`), aldrig Airtables. */
function aktivitet(
  id: string,
  aktor: string,
  aktorId: string,
  verbSlug: string,
  handelse: string,
  objekt: string,
  timestamp: string,
) {
  return {
    id,
    actor: {
      objectType: 'Agent',
      name: aktor,
      account: { homePage: XAPI_BAS, name: aktorId },
    },
    verb: { id: `${XAPI_BAS}/verbs/${verbSlug}`, display: { 'sv-SE': handelse } },
    object: {
      objectType: 'Activity',
      id: `${XAPI_BAS}/objects/registrations/${id}`,
      definition: {
        name: { 'sv-SE': objekt },
        type: `${XAPI_BAS}/activity-types/anmalan`,
      },
    },
    context: { extensions: { [REQUEST_ID_IRI]: `00000000-0000-4000-9000-${id.slice(-12)}` } },
    timestamp,
  };
}

/** Fallande `timestamp` — EF:ens egen sorteringsordning (`occurred_at` desc). */
export const ACTIVITY_LOG_STATEMENTS = [
  aktivitet(
    '00000000-0000-4000-8000-000000000101',
    'Lotta',
    '00000000-0000-4000-8000-000000000001',
    'markerade-betalning',
    'markerade betalning',
    'Alva Ekström (Utbildning Skövde)',
    '2026-09-15T08:00:00+02:00',
  ),
  aktivitet(
    '00000000-0000-4000-8000-000000000102',
    'Roger',
    '00000000-0000-4000-8000-000000000002',
    'bekraftade-anmalan',
    'bekräftade anmälan',
    'Bosse Frisk (Utbildning Skövde)',
    '2026-09-15T05:00:00+02:00',
  ),
  aktivitet(
    '00000000-0000-4000-8000-000000000103',
    'Marcus',
    '00000000-0000-4000-8000-000000000003',
    'lade-till-person',
    'lade till person',
    'Cilla Grahn',
    '2026-09-14T16:42:00+02:00',
  ),
  aktivitet(
    '00000000-0000-4000-8000-000000000104',
    'Lotta',
    '00000000-0000-4000-8000-000000000001',
    'markerade-betalning',
    'markerade betalning',
    'Doris Hallin (Föreläsning Göteborg)',
    '2026-09-14T09:15:00+02:00',
  ),
  aktivitet(
    '00000000-0000-4000-8000-000000000105',
    'Roger',
    '00000000-0000-4000-8000-000000000002',
    'skickade-bekraftelsemail',
    'skickade bekräftelsemail',
    'Egon Ivarsson (Utbildning Varberg)',
    '2026-09-13T11:05:00+02:00',
  ),
];

/**
 * `get-activity-log`-mocken. Speglar EF:ens `pageSize` — utan det vore
 * spaltens fyra-raders-form (`useLatestActivity(4)`) osynlig i fixturvärlden
 * och en ändring av radantalet omätbar. `cursor` besvaras med en tom sida:
 * fixturvärlden bär EN sida, och en klient som ändå frågar efter nästa ska få
 * ett ärligt slut, inte samma sida igen.
 */
export function resolveActivityLogResponse(url: URL) {
  if (url.searchParams.get('cursor')) return { statements: [], nextCursor: null };
  const begart = Number(url.searchParams.get('pageSize') ?? '20');
  const antal = Number.isFinite(begart) && begart > 0 ? begart : 20;
  return { statements: ACTIVITY_LOG_STATEMENTS.slice(0, antal), nextCursor: null };
}
