---
id: TASK-338.3
title: >-
  Skiva: klienten — domän, adapter, RackviddBadge och RackviddsDialog med tre
  axlar och sammanfattningsrad
status: Done
assignee: []
created_date: '2026-08-29 08:03'
updated_date: '2026-08-29 17:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
parent_task_id: TASK-338
ordinal: 613000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan väljer Lotta i uppladdningsdialogen 'Bara detta event' eller 'Delat dokument — gäller flera event'; under det senare tre valfria Select: Familj ('Alla familjer'), Steg (bara för nivåbärande familj, 'Alla steg') och Plats ('Alla platser', listan ur samma läsväg som Mer → Platser, usePlacesList). En sammanfattningsrad uppdateras live i klartext: 'Gäller: alla event' · 'Gäller: RIM-event i Rönninge' · 'Gäller: alla event i Rönninge' · 'Gäller: RIM-event, Nivå 1, i Rönninge'. Listan visar räckvidden som badge komponerad ur axlarna: 'Alla event' · 'RIM · Nivå 1' · 'Rönninge' · 'RIM · Rönninge' · 'RIM · Nivå 1 · Rönninge'. AttachmentScope blir EVENT | GEMENSAM (adaptern mappar legacy defensivt), Attachment-modellen får plats {id, namn} | null. Husets primitiver (RadioGroup/Select), hideLabel-mönstret, fokusordningen och 44 px-golvet behålls; ingen HTML/matchning i klienten. Ytan bor i facit-manifestet tasks/sessions/bilagor/s108-dokumentytan/facit.json (ostämplat) — ändringarna är avsiktliga per PRD:n, ny baslinje efter Marcus godkännande. Täcker användarberättelser: 1, 4, 5, 6, 7, 11, 12.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dialogen: två radioval + tre valfria Select med defaults; sammanfattningsraden speglar valet live i de fyra formerna ovan; 'Bara detta event' inaktiverat i räckviddsläget (som i dag); tangentbordsvandring och axe-svep gröna i dokument-rackviddsval.acceptance.test.ts
- [x] #2 Domän + adapter: AttachmentScope EVENT|GEMENSAM, plats i modellen, legacy-mappning på läsvägen testad; typecheck 0 fel; attachment-layer-independence.test.ts grön
- [x] #3 Ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren' är identisk med facit tasks/sessions/bilagor/s108-dokumentytan/facit.json utom PRD:ns avsiktliga ändringar (tre axlar, sammanfattningsrad, nya badge-former) — avvikelser bokförda i Implementation Notes; aria-/visual-snapshots regenererade via spec-filernas egen mekanism
- [x] #4 RackviddBadge renderar de fem texterna ur axlarna (enhetstest per form); event-egna får 'Detta event' som i dag; badgen syns i eventläget och räckviddsläget — INTE i Åtgärds-sidans bilageväljare (TASK-339, Marcus 2026-08-29 punkt 8)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [x] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
- [x] #7 Facit-granskning mot tasks/sessions/bilagor/s108-dokumentytan/facit.json ytan 'Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren': avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje tas först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Klienten bär nu ADR-125 § 1: AttachmentScope är EVENT | GEMENSAM, Attachment bär plats {id,namn}|null, badgen komponeras ur de tre axlarna och RackviddsDialog har två radioval + tre valfria Select (Familj/Steg/Plats) med en live sammanfattningsrad.

DIVERGENS MOT UPPDRAGET (premiss-passet, ADR-086) — "Nivå 1" vs "Steg 1". Kortets beskrivning och PRD:ns § Implementationsbeslut skriver badge-/sammanfattningsformerna med "Nivå 1", men samma mening säger att steg-etiketten går via befintlig stegEtikett — och den funktionen översätter basvärdet 'Nivå 1' -> 'Steg 1' sedan 2026-08-17 (src/components/dokument/nivaSprak.ts). ORDLISTA.md § Steg är dessutom kategorisk: "Ordet är Steg — aldrig 'Nivå' — överallt". Reglerna slår bokstaven; att rendera "Nivå 1" hade varit en regression av ett landat Marcus-beslut. Byggd form: badge "RIM · Steg 1" / "RIM · Steg 1 · Rönninge", sammanfattning "Gäller: RIM-event, Steg 1, i Rönninge". Orkestreraren bekräftade samma rättelse mid-task (338.5/PR #2089 har redan skrivit ORDLISTA med "Steg 1"). Basvärdet som skickas till EF:en är oförändrat 'Nivå 1'.

DIVERGENS 2 — em-streck i radioetiketten. Kortet skriver "Delat dokument — gäller flera event" (långt streck). scripts/check-langa-streck.mjs (CI-wirad i ci.yml, ej i package.json) fäller långt streck i JSXText, och .langa-streck-policy.json reserverar undantag för tom-markören, inte för text som kan skrivas om. Byggd etikett: "Delat dokument - gäller flera event" (kort bindestreck, Marcus 2026-08-09). Tvåsidigt bevisat: med em-streck exit 1 ("1 långt streck ... DokumentYta.tsx:2245"), med kort bindestreck exit 0 (263 filer skannade).

DIVERGENS 3 — skarv-markören kan inte rivas härifrån. Uppdraget säger att tests/api/attachment-staging-schema.ts ska RIVAS i denna skiva. Filen finns bara på den olandade 338.2-grenen (49e32d9f), inte i denna skivas bas (main c7366aba) — den går alltså inte att ta bort i denna PR. ÖPPEN SKULD för orkestreraren: riv den när både #2084 och denna PR landat. Den blir harmlös men inaktuell (AttachmentSchema bär nu plats strikt-lenient och rackvidd normaliserad); AttachmentSchema är MEDVETET kvar som ren ZodObject (ingen top-level .transform) just för att dess .extend() i den filen inte ska sluta kompilera när båda landar.

DIVERGENS 4 (mindre, ej blockerande) — radnummer/mekanism i uppdraget. RackviddsDialog låg på rad 2091, inte ~1906-2100. Nivåbärande familj bärs av KURSFAMILJ_MED_NIVAER (DokumentYta.tsx rad 300), inte av KURS_KARTA (den bor i supabase/functions/_shared/course-dimensions.ts och rör event-sidan). Status.ts:117-120, usePlacesList, RackviddsDialog-primitiverna och skarvarna stämde exakt.

AVSIKTLIGA YT-ÄNDRINGAR MOT FACIT (AC #3), yta "Dokument-ytan /mer/dokument — räckviddsläget (Delade dokument) och eventväljaren", manifestet ostämplat (godkand: null) så ingen ny baslinje tas:
1. Badgen skriver inte längre ut TOMMA axlar. "RIM · Alla steg" -> "RIM". Tvingat av kortets egen formlista: "RIM · Rönninge" (familj+plats utan "Alla steg" emellan). Konsekvent regel: badgen visar vad som BEGRÄNSAR; den fulla nyansen bor i dialogens sammanfattningsrad.
2. Dialogen: tre radioval -> två; ny sammanfattningsrad; tre selects i stället för två; ledtexten "Välj en familj för att gå vidare." RIVEN (noll axlar är giltigt sedan ADR-125 § 1, så "Ladda upp" är aldrig avstängd av räckviddsskäl).
3. RESERVERAT TOMRUM VÄXER — flaggat för Marcus QA. TASK-309.23:s geometrilås ("rutan aldrig ändrar storlek och läge", Marcus 2026-08-26) kräver att axel-blocket alltid renderas och bara döljs med invisible+inert. Med tre selects + sammanfattningsrad är den reserverade ytan i "Bara detta event"-läget större än den enda rad 309.23 reserverade. Alternativet vore en dialog som hoppar, vilket Marcus uttryckligen avvisat — men tomrummet är en synlig konsekvens som förtjänar hans blick.
4. Selectarna staplas (ingen sm:flex-row). Tre triggers sida vid sida i en 28rem-dialog ger ~128 px var och trunkerar "Alla familjer"/"Alla platser" redan i nolläget; en brytpunkt hade dessutom gjort geometrilåset viewport-beroende.
5. Varje axel har ett EXPLICIT nolläge ("Alla familjer"/"Alla steg"/"Alla platser") i stället för en platshållare — react-aria Select har ingen rensa-knapp, och med valfria axlar måste vägen tillbaka finnas.

SNAPSHOTS (AC #3): ingen aria-referens finns för ytan (facit.json deklarerar frånvaron explicit, "referenser": []), och ingen pixelbaslinje är committad för dokument-yta.png/dokument-yta-kontrast.png — de föds i CI (visual-baselines.yml, CONTRIBUTING.md § Visuell regression), aldrig lokalt av en agent. Spec-filens fixturer är uppdaterade till 'Gemensam'; baslinjen följer spec-filens egen mekanism.

LAGERVAKTEN (DoD #6): ingen matchning i klienten. rackviddsText.ts FORMULERAR filtret (två rena strängfunktioner); normaliseraRaAttachment översätter legacy-VÄRDEN vid datagränsen (ADR-026) och avgör aldrig vilka event något gäller. Matchningen ligger kvar i supabase/functions/_shared/rackvidd-matchning.ts. attachment-layer-independence.test.ts grön (7/7).

LÄSVÄGENS LEGACY-TOLERANS (AC #2): normaliseraRaAttachment körs FÖRE varje AttachmentSchema.parse och paras i parsaAttachment/parsaAttachments så den inte kan glömmas på något av adapterns fem parse-ställen. Nödvändig eftersom (a) prod-raderna migreras först i 338.6 och (b) EF:en med 338.2:s mapAttachmentRecord inte nödvändigtvis är deployad när klienten kör. plats är .nullable().optional() av samma stale-deploy-skäl som mall/kallhash.

"ERSÄTT" BÄR NU PLATS-AXELN. Utan den hade ett filbyte på Rönninge-parkeringsbilagan laddat upp den nya filen som Gemensam med noll axlar = ALLA event — en tyst uppvidgning, precis den skada PRD berättelse 3 finns för att förhindra. Båda anropsställena (BilageRadRow, GemensamBilageRadRow) och ReplaceAttachmentInput/mutationFn uppdaterade.

FIXTURVÄRLDEN: get-places saknade handler. Dialogen läser usePlacesList vid varje öppning, så utan den faller hermetik-vakten på ett omockat EF-anrop. PLACES_RESPONSE (Rönninge/Falköping/Gotland, PRD:ns egna orter) + handler tillagda i tests/support/fixturvarld/.

EJ RÖRDA MED AVSIKT: supabase/ (338.2 äger EF:en), scripts/seed-dokument-fixture.mjs (skriver legacy-värden mot staging via EF:en, som fortfarande accepterar och normaliserar dem på skrivvägen).

GRINDAR (nakna exitkoder, mätta): typecheck 0 · biome 0 · build 0 · test:api:pure 0 (860 test, varav nya tests/api/rackvidds-text.test.ts 25 och attachment-layer-independence 7) · check-langa-streck 0 (263 filer) · check-facit 0 · acceptance --workers=1 över dokument-* + atgarder-bilageval-send: 68 passed, exit 0. En flake observerad i ett mellanliggande varv (dokument-forhandsgranskning-popup-policy, ERR_CONNECTION_REFUSED på page.goto — dev-servern, inte ett assert); grön i isolerad omkörning och i den slutliga batchen.

RUNDA 2 (granskad d029c7d1) — tre rättelser, alla i denna commit.

1. WARNING/auto-fix, Ersätt-fixen saknade test. Två nya fall i dokument-rackviddsval.acceptance.test.ts, samma rigg som "flödet ände-till-ände":
   - "Ersätt i räckviddsläget bär den ersatta radens ALLA axlar vidare (plats inkluderad)" — fångar upload-attachment-kroppen vid Ersätt på BILAGA_GEMENSAM (rackvidd Gemensam, kursfamilj RIM, plats Rönninge) och assertar rackvidd 'Gemensam' + kursfamilj 'RIM' + plats === den ersatta radens rec-ID (recPlatsRonninge01, läst ur fixturens plats.id, inte en literal). Assertar dessutom att tom axel (kursniva) förblir UTELÄMNAD, och att delete-attachment fick den gamla radens id.
   - "Ersätt på en EVENT-EGEN rad skickar INGEN plats-axel (negativ kontroll)" — eventläget, BILAGA_EGEN: rackvidd 'Event' och varken plats, kursfamilj eller kursniva i kroppen (EF:ens write-schema avvisar dem för räckvidd Event, så en läcka blir 400 i drift).
   TVÅSIDIGT BEVIS: med `plats: current.plats?.id ?? undefined` borttagen ur GemensamBilageRadRow föll det positiva testet (exit 1, toMatchObject "- Expected - 1 / + Received + 0" på plats-nyckeln); efter revert exit 0 (3 passed). Mutationen återställd, verifierad med grep (2 förekomster kvar, en per anropsställe).

2. WARNING/auto-fix, ADR-083-prosa i src/domain/schemas/Attachment.schema.ts § normaliseraRaAttachment. Båda påståendena rättade, ingen kodändring:
   (a) "BYTE FÖR BYTE samma tre som EF:ens normaliseraRackvidd" — nu uppdelat: de TRE första grenarna speglar normaliseraRackvidd, den FJÄRDE (okänt optionsnamn -> null) speglar mapAttachmentRecord (_shared/attachments.ts), som defusar mot VALID_ATTACHMENT_SCOPES. Klienten gör båda stegen eftersom den inte kan veta vilken EF-version som är deployad.
   (b) "rackvidds-text.test.ts § Legacy låser BÅDA sidornas utfall mot samma fall-tabell" — FALSKT, struket. Ny text säger rakt ut att ingen korsjämförelse är mekaniserad: klientsviten importerar bara klientfunktionen, EF-sidan låses separat i tests/api/rackvidd-matchning.test.ts (verifierad att den finns på 338.2-grenen, git cat-file mot FETCH_HEAD) med sin EGEN fall-tabell, och de två hålls i synk för hand. En delad fall-tabell båda sviterna läser är BOKFÖRD som egen skiva, inte byggd.

3. INFO, platslistans felfall. usePlacesList som fallerar gav data === undefined -> tom lista, visuellt oskiljbar från "basen har inga platser".
   BYGGT: platserQuery.isError konsumeras; inline MessageBox intent="error" "Platserna kunde inte hämtas" INUTI axelblocket (notistrappans klass "uppgiftsgenererat fel, knutet till en yta", DESIGN-SYSTEM-SPEC.md § 21 / ADR-121 beslut 4 — samma primitiv som ytans övriga fel; trappans egen kolumn "Förskjuter layout?" säger JA för klassen). Plats-selecten får isDisabled i felfallet.
   AVVIKELSE MOT INSTRUKTIONEN, medveten: den DELADE vägen stängs INTE av. I räckviddsläget är "Bara detta event" redan avstängd (inget event att koppla mot), så ett avstängt "Delat dokument" hade lämnat dialogen UTAN något giltigt val alls — en återvändsgränd där Lotta inte kan ladda upp någonting. Dessutom är en axellös gemensam bilaga ("alla event") ett fullt legitimt val som inte behöver platslistan. Instruktionens "eller motsvarande minsta form" tagen: felet syns, Plats-axeln är avstängd i stället för tomt lockande, och sammanfattningsraden fortsätter säga sanningen ("Gäller: alla event") så ingen kan tro att en plats är vald.
   TEST: "platslistan fallerar: felet SYNS, Plats-axeln stängs av, och sammanfattningen ljuger inte" (MSW 500 på get-places) — assertar felrutan, disabled Plats-select, ENABLED delat-radio + Ladda upp-knapp, sammanfattningen "Gäller: alla event", och att de två platsoberoende axlarna fungerar oförändrat ("Gäller: RIM-event").

GEOMETRILÅSET HÅLLER: de fem lägena mäts fortfarande identiska (desktop 1280x720 och mobil 375 px, båda gröna). Felrutan bor inuti axelblocket och är därmed reserverad/inert i event-läget som allt annat; den renderas bara i felfallet, vilket är en annan session än geometritestets.

GRINDAR runda 2 (nakna exitkoder): typecheck 0 · biome 0 · test:api:pure 0 (860) · check-langa-streck 0 (263 filer) · check-facit 0 · acceptance --workers=1 över dokument-* + atgarder-bilageval-send: 71 passed, exit 0 (var 68 i runda 1; +3 nya fall). Ingen flake denna gång.

EJ GJORT, per instruktion: main är INTE inmergad (orkestreraren säger till när #2093 landat, konflikt väntas i DokumentYta.tsx/Attachment.schema.ts). supabase/ orört. Ej armerad.

RÄTTELSE AV RUNDA 2-NOTEN OVAN (runda 3, INFO): ordet "reserverad" är FEL om felrutan. Den renderas VILLKORLIGT och reserverar ingen höjd — notistrappan säger uttryckligen "Förskjuter layout: Ja" för klassen "uppgiftsgenererat fel, knutet till en yta" (DESIGN-SYSTEM-SPEC.md § 21). Rätt formulering: felrutan bor INUTI axelblocket (som är inert i eventläget) men är själv villkorligt monterad, och den får kosta höjd när den syns. Allt ANNAT i dialogen är reservat; felrutan är undantaget, med trappans stöd.

MERGE AV MAIN — GJORD (runda 3 klartecken). Raden "EJ GJORT, per instruktion: main är INTE inmergad" ovan gällde runda 2 och är överspelad; headen ÄR sedan dess en merge-commit.

Merge-SHA 5ecedc21ee78597f93fe4ea52960bfad351d1904 (merge av origin/main be87d128, ingen rebase). TRE konflikter, alla lösta så båda sidorna bevaras:
1. src/domain/schemas/index.ts — rent additiv (338.3:s normaliseraRaAttachment/parsaAttachment/parsaAttachments mot 340.2:s SkapadEventBilagaSchema). Alla behållna.
2. src/data/adapters/AirtableAdapter.ts § skapaEventBilaga — den enda SEMANTISKA konflikten. 340.2 parsar svaret som HELHET (SkapadEventBilagaSchema; de tre booleanerna promoverad/underlagAndrat/ersatte är bekräftelseytans text, och ett handplockat fält vid sidan av schemat är precis den datagräns ADR-026 stänger). 338.3 gjorde rackvidd till ett STRIKT enum som kräver legacy-normalisering FÖRE varje parse. Naivt oförenliga: helhets-parsen når det inbäddade attachment innan någon normalisering hunnit köra, och ett 'Kurstyp' hade KASTAT och fällt hela Skapa.
3. src/components/dokument/DokumentYta.tsx — ren import-konflikt (340.2:s useEventAttachments mot 338.3:s usePlacesList), båda importerade. Kroppen auto-mergade och verifierades koherent: useEventAttachments(eventId) ersätter den inline useQuery, 309.40:s handleRackviddsByte på plats, och 338.3:s dialog + plats-axeln i båda Ersätt-anropen intakta.

NY PUBLIK DOMÄNFUNKTION: parsaSkapadEventBilaga (src/domain/schemas/Attachment.schema.ts, exporterad via schemas/index.ts). Den löser konflikt 2 genom att normalisera det INBÄDDADE attachment-fältet och sedan låta SkapadEventBilagaSchema validera hela svaret — båda skivornas egenskaper bevarade, ingen försvagad. Samma "paras så den inte kan glömmas"-form som parsaAttachment/parsaAttachments: en normalisering som är valfri på ett av fem ställen är en normalisering någon glömmer på det sjätte. I praktiken kan generate-event-attachment inte producera ett legacy-värde (den sätter ALDRIG Räckvidd), så det är ett skyddsräcke snarare än en daglig nödvändighet — bokfört som sådant i funktionens docblock.

SKARV-MARKÖRENS RÄTTA TEARDOWN (tests/api/attachment-staging-schema.ts, kom in med 338.2 i mergen) — GÅR I 338.4, INTE HÄR. En mekanisk rivning skulle FÖRSVAGA en grind: filens rackvidd-vidgning (z.string().nullable()) är numera obsolet eftersom klientens enum bär Gemensam, MEN dess plats-fält är STRIKT med avsikt (338.2: "fältet är hela poängen med skivan, så en EF som INTE bär det ska fälla sviten högljutt") medan klientens är medvetet LENIENT (stale-deploy-skälet, samma som mall/kallhash). Asymmetrin är avsiktlig på båda sidor. Rätt åtgärd är alltså att SMALNA filen till enbart plats-överskrivningen — inte att radera den och peka de fyra staging-sviterna på AttachmentSchema. Filen kompilerar och fungerar oförändrad i grenen (typecheck 0), så inget brådskar.

RUNDA 3 — TVÅ KODRÄTTELSER:

A. A11Y-DEFEKT RÄTTAD (INFO/a11y, golvet är 11). MessageBox intent="error" renderar role="alert", och en alert annonseras när noden DYKER UPP i tillgänglighetsträdet — inte när den blir synlig. Villkorad bara på platserFel monterades rutan redan vid dialogens öppning, alltså INUTI axelblocket som är inert i eventläget (dialogen initieras till EVENT när harEvent). inert tar bort underträdet ur tillgänglighetsträdet, så alerten fyrade där ingen kunde höra den — och vid växlingen till "Delat dokument" fanns noden redan, så inget fyrade då heller. Felet var SYNLIGT men aldrig ANNONSERAT: tyst för precis den grupp som inte kan se att Plats-selecten är avstängd. Fix: villkoret är nu `gemensam && platserFel`, så rutan monteras i samma ögonblick blocket blir aktivt.

   TVÅSIDIGT BEVIS, MED EN FÅNGST PÅ VÄGEN: första versionen av regressionstestet använde getByRole('alert') för båda halvorna och PASSERADE mot den buggiga koden (mutation utan `gemensam &&` → exit 0, falsk grön). Orsak: getByRole gör ARIA-uppslag och utesluter dolda/inerta noder — alltså exakt de noder buggen producerar, så assertionen kunde inte skilja "aldrig monterad" från "monterad men inert". Testet skärptes till locator('[role="alert"]') (CSS-attributuppslag, räknar noden oavsett inert) för DOM-närvaro-halvan, med getByRole kvar för tillgänglighetsträds-halvan. Efter skärpningen: mutant exit 1 ("Expected: 0, Received: 1"), efter revert exit 0. Testet heter "platslistans fel MONTERAS först när det delade läget aktiveras — annars annonseras alerten aldrig".

B. STALE PREMISS I TVÅ DOCBLOCK RÄTTAD (ADR-083). AirtableAdapter.ts § fetchGemensammaBilagor sade att EF:en filtrerar grenen på "Räckvidd IN (Kurstyp, Alla event)" — sant för 275.2:s tre rivna filterByFormula-mängder, falskt sedan 338.2. FAKTISKT (verifierat mot get-event-attachments/index.ts rad 173 och 221): en hämtning med NOT({Räckvidd} = 'Event') — en medveten SUPERMÄNGD — följd av kod-grinden arGemensam efter normalisering. Två steg, eftersom formeln måste släppa igenom legacy-värdena (som normaliseras i kod) medan koden måste hålla ute raderna med TOMT Räckvidd (annars hade 34 mall-genererade, event-bundna PDF:er, mätt i staging 2026-08-29, hamnat i Lottas lista över delade dokument). Slutsatsen i docblocket höll oförändrad; det var premissen som var stale.
   SJÄLVFÅNGST: samma felklass fanns i min EGEN runda-1-rättelse i DataSourceAdapter.ts ("bara Räckvidd = Gemensam sedan TASK-338.2") — närmare, men fortfarande inte vad EF:en gör. Båda ställena är nu skrivna mot den faktiska tvåstegsformen.

GRINDAR runda 3 (nakna exitkoder): typecheck 0 · biome 0 · dokument-rackviddsval 25 passed exit 0 · hela dokument-* + atgarder-bilageval-send (--workers=1, UTAN --reporter så oanvänd-handler-vakten är armerad) exit 0 · check-langa-streck 0 · check-facit 0.
<!-- SECTION:NOTES:END -->
