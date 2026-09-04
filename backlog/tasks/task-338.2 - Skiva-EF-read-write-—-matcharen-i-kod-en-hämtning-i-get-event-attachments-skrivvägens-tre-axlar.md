---
id: TASK-338.2
title: >-
  Skiva: EF read + write — matcharen i kod, en hämtning i get-event-attachments,
  skrivvägens tre axlar
status: Done
assignee: []
created_date: '2026-08-29 08:03'
updated_date: '2026-09-04 08:16'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.1
parent_task_id: TASK-338
ordinal: 612000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan returnerar get-event-attachments för ett event unionen av (a) eventets egna bilagor och (b) alla rader med Räckvidd ≠ Event — hämtade i EN Airtable-hämtning — som matchar eventet på alla satta axlar: Kursfamilj (tom = alla), Kursnivå (tom-nivå-regeln oförändrad), Plats (länk-ID mot eventets Plats-länk, aldrig namn). Matcharen är en ren funktion i _shared med egen enhetstestsvit (ingen staging). Läsvägen tolererar legacy-värdena 'Kurstyp'/'Alla event' som Gemensam med sina axlar (så prod fungerar oavsett i vilken ordning EF-deploy och radmigrering sker i TASK-338.6). Svaret bär rackvidd ('Event'|'Gemensam'), kursfamilj, kursniva och plats {id, namn} (namn ur Platsnamn-lookupen). Räckviddsläget listar Räckvidd ≠ Event. Skrivvägen (upload-attachment + finalize-attachment-upload) tar rackvidd ∈ {Event, Gemensam}; vid Gemensam är kursfamilj, kursniva (bara med kursfamilj) och plats (Platser-record-ID, existenskontrollerat mot Platser — samma vaktklass som generate-event-attachments ersatt-guard) valfria; noll axlar giltigt; legacy 'Kurstyp'/'Alla event' accepteras och mappas till Gemensam (bokförd rivningsskuld i filhuvudet). Dagens tre filterByFormula-mängder rivs. Deployas till staging. Täcker användarberättelser: 2, 3, 4, 5, 9, 10, 16.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ren matchare i _shared med enhetstester (tests/api, deterministiska): tom axel begränsar inte; tom-nivå-regeln; Plats matchar på record-ID; familj-mismatch; plats-mismatch; kombination RIM+Rönninge; legacy-mappning Kurstyp/Alla event → Gemensam — varje fall grönt, antal fall bokfört
- [x] #2 get-event-attachments.staging.test.ts utökad och grön mot deployad staging-EF: Rönninge-event ser en Plats=Rönninge-bilaga, ett event på annan plats ser den inte; RIM+Rönninge syns bara på RIM-event i Rönninge; inga axlar = syns på alla; svaret bär plats {id, namn}; dedup mellan mängderna
- [x] #3 Skrivvägen: upload-attachment.staging.test.ts bevisar Gemensam med plats (sparas som länk), Gemensam utan axlar, ogiltigt plats-ID → 4xx, legacy 'Alla event' → sparas som Gemensam; Zod-schemat strikt på write-sidan (P22-noten kvar)
- [x] #4 Räckviddsläget (fetchAllaGemensamma) listar Räckvidd ≠ Event; delete-attachment/atgarder-bilageval-sviterna fortsatt gröna; ingen klient-ändring krävs för Åtgärds-sidan (verifierat i acceptance-testet atgarder-bilageval-send)
- [x] #5 Filhuvudena i attachments.ts och get-event-attachments/index.ts beskriver den nya formen (ADR-083); TASK-275.2-prosan om tre mängder omskriven, inte lämnad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [x] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Modell-identitet:** Opus 5 (1M context), exakt modell-ID `claude-opus-5[1m]` — orkestreraren bokförde avvikelsen mot frontmatterns Sonnet i uppdraget.

**Premiss-pass (ADR-086):** samtliga uppdragets premisser prövade mot faktiskt tillstånd. `git fetch` gav `origin/main` = `28ec4610` (PR #2076, kortet 338.2 på plats). Grenen baserad på `origin/main`, INTE på worktree-basen `763e8abc`. `338.1`:s fält-ID:n verifierade LIVE mot staging (`describe_table tblFamrna53MVf1nG`): option `Gemensam` `selxFObtdzHsUJiun` på `fldU6i9Ju5HRwSRBf`, `Plats` `fldmkHUxPNRRA0Rxi` → Platser `tbl7ER0wNqAZ9ZhEq`, `Platsnamn` `fldyEDJD3Y3InHJ7J` (lookup av `fldSDJcY7cb4dam3Y` via Plats) — alla tre EXAKT som uppdraget angav. `Eventplanering.Plats` `fld8OmPGNgEYZ8eER` bekräftad. `src/domain/types/Status.ts:117–120` bär `AttachmentScope` som uppdraget sade (ORÖRD, 338.3). Radintervallen i `attachments.ts`/`get-event-attachments/index.ts` stämde.

**TVÅ divergenser mot uppdraget, båda rapporterade och hanterade:**

1. `ATTACHMENT_FIELDS` är INTE exporterad ur `_shared/attachments.ts` — den är en LOKAL const i `get-event-attachments/index.ts:88` (grep: noll träffar utanför den filen). Koordinationsnoten mot `TASK-340.1` gäller alltså bara `mapAttachmentRecord`. Den returformen är UTÖKAD (nytt `plats`-fält), aldrig smalnad; `ATTACHMENT_FIELDS` rördes bara inuti sin egen fil.
2. **`delete-attachment` och `get-attachment-download-url` MÅSTE ändras — de stod inte i uppdraget.** Båda beräknade `isGemensam = rackvidd === 'Kurstyp' || rackvidd === 'Alla event'` mot det RÅA fältvärdet. Med den nya `Gemensam`-räckvidden hade varje ny gemensam bilaga klassats som Event-räckviddig: ORADERBAR i räckviddsläget (403) och 403:ad vid nedladdning från varje annat event än uppladdnings-eventet — alltså exakt den regression `TASK-275.3` AC #2 en gång redan fällde, återuppstånden genom ett nytt optionsnamn. Kortets AC #4 ("delete-attachment-sviterna fortsatt gröna") kräver fixen. Båda läser nu den delade `arGemensam(normaliseraRackvidd(...))`.

**Designbeslut som INTE stod i kortet, med mätning bakom:**

- **`Räckvidd ≠ Event` är en SUPERMÄNGD, och kod-grinden är det som avgör.** Mätt mot staging 2026-08-29 gav `NOT({Räckvidd} = 'Event')` **49 rader**, varav **34** var event-bundna, mall-genererade rader med TOMT `Räckvidd`. Utan `arGemensam` (som säger nej till tomt värde, den historiska default-formen för `Event` enligt basfältets egen beskrivning) hade de 34 landat på VARJE events dokumentlista OCH i Lottas lista över delade dokument. Kortets formel behölls (den tolererar varje framtida optionsnamn utan uppdatering); grinden ligger i koden, där PRD:n placerar matchningen.
- **Matcharen bor i en EGEN, ZOD-FRI modul** (`_shared/rackvidd-matchning.ts`). `attachments.ts` importerar zod från esm.sh, vilket gör HELA den filen omöjlig att Node-importera i ett `tests/api`-test — samma strukturella skäl som `attachment-filename.ts` bröts ut för (TASK-309.22). Scope-konstanterna flyttade med och RE-EXPORTERAS ur `attachments.ts`, så ingen befintlig EF-importsats behövde ändras.
- **`buildStorageAnchor` fick en `Gemensam`-gren men BEHÖLL path-formerna** (`kurstyp/<slug>`, `alla-event`). De 9 rader `338.1` migrerade bär sina bytes under de gamla prefixen; ett nytt prefix hade gjort varje sådan fil tyst oöppningsbar och oraderbar. De två legacy-grenarna är byte för byte oförändrade (inklusive att `Kurstyp` utan `Kursfamilj` fortfarande ger `null`). Plats-axeln fick MEDVETET ingen egen gren: funktionen har två läsande konsumenter som härleder ur radens egna fält, och en plats-gren hade krävt att båda också läser `Plats` — en ny väg för skriv- och läshärledning att drifta isär.
- **Legacy-kontraktet BEVARAS, inte mildras:** reglerna prövas på det RÅA `rackvidd`-värdet. `Kurstyp` kräver fortfarande `kursfamilj` (annars 400) trots att värdet normaliseras — att släppa igenom det bara för att normaliseringen finns hade mildrat ett kontrakt i stället för att bevara det. `Alla event` normaliseras med axlarna TÖMDA (värdet betyder per definition inga begränsningar; en kvarglömd axel hade tyst SMALNAT).
- **`plats`-existenskontrollen (`platsFinns`) bor i `_shared`, inte inline i två EF:er.** Airtable TYSTAR ett okänt record-ID i ett länkfält, så ett felstavat plats-ID hade gett en PLATS-LÖS bilaga synlig på ALLA event — en tyst uppvidgning, precis den skada berättelse 3 finns för att förhindra. En säkerhetsvakt duplicerad på två ställen driver isär vid nästa ändring.
- **Kursnivå utan kursfamilj är fail-CLOSED på läsvägen** (nivån tillämpas som eget villkor, bilagan syns på färre event). Skrivvägen kan inte producera formen; läsvägen möter historisk data. Asymmetrin avgör: skadan i denna produkt är att fel information går ut, inte att ett dokument syns på för få event.
- **Plats-matchningen är "minst ett ID", inte "exakt ett".** Airtable kan strukturellt inte tvinga max en länk, och basen är en yta Lotta och Marcus arbetar direkt i (ADR-063) — en handredigerad tvåplats-rad ska bete sig som "gäller båda", aldrig som "matchar ingenting".

**AC-status, mätt värde per kriterium:**

- **AC #1 UPPFYLLT.** `supabase/functions/_shared/rackvidd-matchning.ts` (ren, zod-fri, Node-importerbar). `tests/api/rackvidd-matchning.test.ts`: **34 fall, 34 passed, exit 0** (api-pure, ingen staging). Täcker varje uppräknat fall: tom axel begränsar inte (5), tom-nivå-regeln (3), Plats på record-ID (5), familj-mismatch (3), plats-mismatch (ingår i plats-blocket), kombination RIM+plats (4), legacy-mappning (6), räckvidden själv (4), `lasPlatsIds` (4). **BEVIS I BÅDA RIKTNINGAR — fyra mutationer, var och en fällde:** plats-OCH→ELLER `exit 1, 6 failed` · tom-nivå-regeln bruten `exit 1, 5 failed` · legacy-Kurstyp-normaliseringen borttagen `exit 1, 2 failed` · tomt `Räckvidd` räknat som gemensamt `exit 1, 2 failed`. Källan verifierat återställd efter varje mutation.
- **AC #2 UPPFYLLT.** `tests/api/get-event-attachments.staging.test.ts` utökad 9 → **13 test-fall**, **13 passed, exit 0** mot deployad staging-EF. Nya fall: PLATS-axeln (event PÅ platsen ser bilagan; ett event på ANNAN plats gör det inte; ett event utan plats-länk ser ingen; svaret bär `plats: {id: recVWAYh1cbVQKxi7, namn: 'ZZ-plats-unik-fixtur'}`), KOMBINATIONEN Familj+Plats (RIM+platsA syns på RIM-event i platsA; RIM+platsB syns INTE; Psionautics+platsA syns INTE — OCH-beviset), LEGACY-toleransen. Dedup bevisad i kombinations-fallet (varje ID exakt en gång).
- **AC #3 UPPFYLLT.** `tests/api/upload-attachment.staging.test.ts` utökad 20 → **27 test-fall**. Bevisar: `Gemensam` + plats → 201 med `Plats: [recVWAYh1cbVQKxi7]` som LÄNK-array och `Platsnamn: ['ZZ-plats-unik-fixtur']` (lookup-array) · `Gemensam` utan axlar → 201 · `Gemensam` + familj + plats → 201 · okänt plats-ID (rec-form) → **404** · ogiltig plats-FORM → **400** · plats med räckvidd Event → **400** · kursnivå utan kursfamilj → **400** · LEGACY `Alla event` → 201 sparad som `Räckvidd: 'Gemensam'` · LEGACY `Kurstyp` → sparad som `Gemensam` med `Kursfamilj`/`Kursnivå` bevarade. Zod-schemat är strikt på write-sidan, P22-noten (läsvägen defensiv) kvar i docblocken.
- **AC #4 UPPFYLLT.** Räckviddsläget (`fetchAllaGemensamma`) hämtar `Räckvidd ≠ Event` och kod-filtrerar med `arGemensam`. `delete-attachment.staging.test.ts` och `get-attachment-download-url.staging.test.ts` gröna. Samlad körning av alla fyra staging-sviterna: **65 passed, exit 0** (1,2 min). Acceptance: `atgarder-bilageval-send` + `dokument-rackviddsval` **20 passed, exit 0** — ingen klient-ändring krävdes för Åtgärds-sidan.
- **AC #5 UPPFYLLT.** Filhuvudena omskrivna, inte lämnade: `get-event-attachments/index.ts` säger nu explicit att "unionen av TRE mängder" är RIVEN och varför (ADR-125 § 1, länkfält kan inte jämföras mot record-ID i filterByFormula); `attachments.ts` beskriver de två levande räckvidderna, legacy-toleransen och varför läsvägen flyttat till `rackvidd-matchning.ts`. `upload-attachment`, `finalize-attachment-upload`, `delete-attachment` och `get-attachment-download-url` har alla fått sina ADR-118-stycken uppdaterade till ADR-125 § Beslut 1 / TASK-338.2.

**Grindar, mätta exitkoder:** `npm run typecheck` **0** · `npx @biomejs/biome check tests/api/ supabase/functions/` **0** · `npm run build` **0** · `npm run test:api:pure` **0** (869 passed) · `npm run test:api:staging` (fyra bilage-sviter) **0** (65 passed) · `npm run test:acceptance` (två bilage-sviter) **0** (20 passed) · `node scripts/check-langa-streck.mjs` **0** (261 filer, 0 fynd — diffen rör inte `src/`).

`npx @biomejs/biome check .` (hela repot) ger **exit 1 med 3 fel som ALLA är pre-existerande och ligger utanför diffen**: `biome.json:2` schema-version 2.5.5 mot lokalt installerad CLI 2.5.7, plus två `suppressions/unused` i `src/components/dokument/DokumentYta.tsx:1820/2224`. Ingen av dem rör en fil denna skiva ändrar; scopad körning mot de rörda katalogerna är exit 0.

**Deploy till staging (`pqtshyierkdgwdnxuirz`, prod ALDRIG anropad):** fem EF:er, `npx supabase@2.115.0 functions deploy <fn> --project-ref <staging>`, **exit 0 var och en** — `get-event-attachments`, `upload-attachment`, `finalize-attachment-upload`, `delete-attachment`, `get-attachment-download-url`. `--project-ref`-formen valdes framför `link` med avsikt: `supabase/.temp/project-ref` skapades ALDRIG (verifierat efteråt), så det sticky-länk-läge `CLAUDE.md` § Prod-EF-deploy varnar för kan inte uppstå. Staging-semaforen togs (`preflight` exit 0, `acquire` exit 0) före sviterna och släpptes efteråt (`release` exit 0).

**RÖTT-FÖRST-FYND i mitt eget test (bokfört, inte städat bort):** första versionen av PLATS-axel-testet krävde att en platsbunden bilaga var FRÅNVARANDE på `BELAGGNING_EVENT_ID`. Staging fällde det. Orsaken är korrekt EF-beteende: bilagorna laddas upp i beläggnings-fixturens kontext, så deras `Event`-länk pekar dit och mängd (a) "eventets egna" visar dem där oavsett räckvidd (`upload-attachment` § filhuvudet: `Event` förblir satt även för en gemensam bilaga, den bär storage-path-ankaret). Testet mätte alltså fel mekanism. Rättat till `ARBETSKO_EVENT_ID` (den andra permanenta fixturen — ingen Plats-länk, aldrig uppladdnings-kontext), med orsaken skriven i testet.

**ÖPPEN SKARV mot TASK-338.3, den viktigaste posten att läsa vidare på:** `src/domain/types/Status.ts`s `AttachmentScope` bär fortfarande bara `Event | Kurstyp | Alla event`, och `AttachmentSchema.rackvidd` är `z.enum(AttachmentScope).nullable()`. Den deployade staging-EF:en svarar nu med `Gemensam`, så en `.parse()` mot domänschemat KASTAR på varje gemensam bilaga. Klienten körd mot STAGING är därmed trasig för gemensamma bilagor tills 338.3 landar (prod är orörd — den migreras i 338.6). Uppdraget sade uttryckligen att `Status.ts` inte skulle röras i denna skiva, så jag rörde den inte; staging-sviterna läser i stället via `tests/api/attachment-staging-schema.ts`, en medvetet vidare testsidig variant. **Den filen ÄR skarv-markören: den ska RIVAS när 338.3 breddat enumet**, och sviterna gå tillbaka till `AttachmentSchema` rakt av. Åtgärden i 338.3 är två rader (lägg `GEMENSAM: 'Gemensam'` i `AttachmentScope`, lägg `plats` i `AttachmentSchema`).

**Kvarlämnade staging-rader (bokfört):** det fällda testet hann inte köra sin teardown, så två `ZZ-attachment-test-<uuid>.pdf`-rader ligger kvar i Bilagor. De matchar purge-targeten `upload-attachment-sentineler` och städas av nästa setup-purge. Ingen ny purge-target behövs för `Plats`/`Platsnamn` (samma slutsats som 338.1 bokförde: inga nya rader skapas av fälten).

**DoD-noter:** #4 N/A — inget prod-anrop gjordes (deploy och Airtable-läsning gick uteslutande mot `apphjj8Q7lkXCMsL4`/`pqtshyierkdgwdnxuirz`). #5 uppfyllt via sub-fas-mönstret: `Plats` tillagd i `create-attachment`s allowlist med allow-bevis (fältet skrivet som länk) och deny-bevis (okänd rad 404, fel form 400, fel räckvidd 400) i `upload-attachment.staging.test.ts`. Lookup-fältet `Platsnamn` står MEDVETET INTE i allowlisten — ett `multipleLookupValues`-fält är beräknat och kan inte skrivas. #6 grön: `tests/api/attachment-layer-independence.test.ts`, `ef-metod-vakt` och `mutation-hemvist-vakt` gröna i api-pure-körningen; all matchning och validering bor i `_shared`, ingen klientfil rörd.

Nattgrind-stängning 2026-09-04: DoD bockad mot belägg — samtliga 5 AC redan bockade (mekanisk DoD#1); DoD#2 styrks av notens grindtabell (typecheck/biome/build/test:api:pure/test:api:staging/acceptance/check-langa-streck 0); DoD#3 verifierat mot git show --stat eeef0b54 (PR #2084): enbart EF:er + delade moduler + testfiler i bilage-featuren ändrade; DoD#5 styrks av notens egen text (Plats i create-attachments allowlist, allow/deny-bevis i upload-attachment.staging.test.ts); DoD#6 styrks av notens egen text (attachment-layer-independence.test.ts, ef-metod-vakt, mutation-hemvist-vakt gröna). DoD#4 KVARSTÅR OBOCKAD — N/A per notens egen klassning (inget prod-anrop gjordes, prod-migreringen är TASK-338.6); rapporterat, inte bockat på gissning.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2084 (mergad 2026-08-29 09:30:08Z, main eeef0b54). Ren matchare (_shared/rackvidd-matchning.ts, 34 fall), get-event-attachments = egna + Räckvidd ≠ Event i EN hämtning med matchning i kod på länk-ID, svar med plats {id, namn}; skrivvägen Event|Gemensam + legacy-mappning + Plats-existenskontroll (404); delete-attachment/get-attachment-download-url rättade (arGemensam — annars oraderbar/403 för nya delade). Review-grinden: runda 1 konvergerad (risk låg, 2 info/ask-user avgjorda på Marcus mandat: tomt Räckvidd+tom Event-länk = känt randfall → 338.5; biome-diskrepansen = granskarens mätning exit 0 auktoritativ). Klient-skarv: AttachmentScope saknar GEMENSAM tills 338.3.
<!-- SECTION:FINAL_SUMMARY:END -->
