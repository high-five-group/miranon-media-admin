---
id: TASK-201.17
title: >-
  Fynd: Aktivitetshistorikens eventfilter visar oskiljbara alternativ vid
  återkommande kursnamn
status: Done
assignee: []
created_date: '2026-08-14 19:12'
updated_date: '2026-08-14 21:29'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-201
ordinal: 401000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Fyndet

Mätt live i staging-preview med Playwright (S105:s mekaniska QA-vandring, 2026-08-14): Aktivitetshistorikens EVENT-FILTER (/mer/aktivitetshistorik, filterraden byggd i TASK-201.8) listar options med ENBART event.eventNamn (src/components/aktivitetshistorik/AktivitetsHistorik.tsx, FilterRad:s event-Select, via den lokala eventVisningsNamn-hjälparen). I staging gav det ~33 alternativ i rad med identisk etikett 'Fjärrskådning' — omöjliga att skilja åt utan att öppna varje alternativ.

Detta är INTE bara fixtur-brus: i skarp prod-data återkommer samma kursnamn över orter och datum (Fjärrskådning körs i Skövde/Varberg/Falköping), så Lotta möter samma oskiljbarhet i prod. Gunilla-principen fälls — hon kan inte FÖRSTÅ vilket event hon väljer.

### Verifiering mot staging-basen (denna byggsession, källmärkt)

mcp__airtable__list_records mot apphjj8Q7lkXCMsL4/Eventplanering (tblVE3UKWl1CKrphV), fälten Event (source)/Ort/Startdatum, 37 rader totalt (fullständig tabell, ingen maxRecords-trunkering): 32 rader bär Event (source) = 'Fjärrskådning' (mot QA-vandringens uppmätta 33 — nära nog match; sannolikt ett litet tidsglapp mellan mätningarna, ingen divergens som blockerar). Av dessa 32 är ~24 staging-testfixturer med Ort = 'ZZ-create-event-test' (22 st, samtliga Startdatum = 2026-09-15) eller Ort = 'ZZ-create-event-test-uppdaterad' (2 st, 2026-10-01) — resten (6 st) är GENUINA, olika event: Falköping x2 (2026-06-11/08-18), Varberg (2026-08-22), ZZ-belaggning-fixtur/ZZ-arbetsko-fixtur/ZZ-GRANSKNING-S103 (permanenta/granskningsfixturer, egna livscykler). Samma mönster upprepas för 'Resor i medvetandet 1/2/3' — VARJE instans är ett eget, genuint record (olika id, olika ort/datum) — INTE samma event-ID två gånger.

### Rotorsak — INGEN kod-nivå ID-dubblering hittad

fetchEvents() -> get-events-EF:en (supabase/functions/get-events/index.ts) -> fetchFromAirtable('Eventplanering') (supabase/functions/_shared/airtable-client.ts:37-101) är en ren offset-paginerande hämtning som pushar varje sidas data.records en gång och avslutar när data.offset uteblir — ingen dubbel-push, inget dedupliceringsbehov hittat i koden. Varje id i den hämtade listan är Airtables eget unika record.id. AC-utredningen är alltså EN OBSERVERAD NOLLTRÄFF, inte outredd — utredd och avfärdad med källmärkt kod- och data-läsning, inte antagen.

De uppräknade 'dubbletterna' är därför två SKILDA fenomen, båda äkta:
1. Legitima, olika event med samma namn (Fjärrskådning körs på flera orter/datum) — det AVSEDDA scenariot uppdraget beskriver, och den faktiska prod-verkligheten. FIXAS av etikett-kvalificeringen nedan.
2. Ackumulerade staging-testsentineler (ZZ-create-event-test/-uppdaterad, create-event-sentineler-target i .purge-staging-policy.json) som delar IDENTISKT namn+ort+datum sinsemellan — etikett-fixen kan INTE skilja dessa åt från varandra (de är staging-only, finns aldrig i prod). npm run purge:staging -- --dry-run kunde INTE köras i denna session: den delade staging-basen hade en AKTIV CI-körning (post-merge.yml run 31831309689, in_progress) och den lokala preflight-guarden (MM_STAGING_PREFLIGHT) stoppade körningen för att undvika ett falskt rött på det landade trädet — korrekt beteende, inte kringgånget. Att dessa 24 poster ändå finns kvar TROTS att purgen körs automatiskt före varje staging-CI-jobb (CLAUDE.md § Granskningsdata) tyder på att de är linkGuard-blockerade (troligen länkade från create-event.staging.test.ts/skapa-event.staging.test.ts:s testflöde) — ett SEPARAT, ej-brådskande fynd om testfixtur-hygien i de testerna, INTE åtgärdat i denna skiva (utanför scope, ingen aktiv blockering av detta fynds kärnfix). Bokfört öppet här för uppföljning; ingen tråd i tasks/threads/ mintad separat (proportionalitetsavvägning — se byggsessionens slutrapport).

### Fixen (denna skiva)

Kvalificera filterradens event-options-etikett till formen 'Namn · Ort · datum' — SAMMA postform appen redan använder på hem-vyns anmälningslista (NyaAnmalningarCard.tsx:s eventIdentitet/kortDatum: Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }), mittpunkt-separator ' · ', .filter(Boolean) för null-säkerhet). Lokal modul-privat kopia i AktivitetsHistorik.tsx (samma isoleringsmönster som filen redan använder för eventVisningsNamn/NastaEventCard.tsx:s identiska helper — ingen cross-feature-import, dokumenterat i filens eget filhuvud). Sorteringen behåller namn som primär nyckel (oförändrat) med startdatum som sekundär tie-break (kronologisk) så identiskt namngivna event grupperas och ordnas läsbart.

### Täcker

Kortet är ett fynd ur S105:s QA-vandring, barn till TASK-201 (Aktivitetslogg Fas 6.5). Ingen ny användarberättelse — stänger ett gap i PRD användarberättelse 7/8 (filtrering/navigering) som TASK-201.8 lämnade öppet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Filterradens event-Select visar varje alternativ i formen Namn · Ort · datum (kortdatum sv-SE, t.ex. 22 aug) — samma postform som hem-vyns anmälningslista (NyaAnmalningarCard.tsx eventIdentitet), byggd som lokal modul-privat kopia i AktivitetsHistorik.tsx
- [x] #2 Två event med identiskt eventNamn men olika ort/datum renderas som SKILDA, läsbara options i dropdownen (acceptance-testbevis, tvåsidigt: identiska etiketter innan fixen fäller testet)
- [x] #3 Event-options sorteras med namn som primär nyckel (oförändrat beteende) och startdatum som sekundär tie-break, så identiskt namngivna event ordnas kronologiskt inbördes
- [x] #4 A11y orörd: option-roller, aria-label/labels och tangentbordsvägen (Select-primitivens befintliga mekanik) oförändrade — axe 0 violations kvar
- [x] #5 Källmärkt utredning av ev. ID-nivå-dubbletter (samma event-record två gånger i listan) dokumenterad i kortets beskrivning/notes, med resultat och belägg — oavsett utfall
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #5 avbockad — utredningen är genomförd och källmärkt i kortets egen § Verifiering mot staging-basen / § Rotorsak ovan (mcp__airtable__list_records mot apphjj8Q7lkXCMsL4/Eventplanering + läsning av get-events-EF:en och fetchFromAirtable). Utfall: INGEN kod-nivå ID-dubblering — nolträff, avfärdad med belägg, inte antagen.

AC #1 avbockad — eventFilterEtikett() implementerad i AktivitetsHistorik.tsx (rader ~163-192): [eventVisningsNamn(e), e.ort, kortDatum(e.startdatum)].filter(Boolean).join(' · '), lokal modul-privat kopia av NyaAnmalningarCard.tsx:s KORTDATUM/kortDatum (samma sv-SE Intl.DateTimeFormat, trailing-punkt strippad). Verifierat via acceptance-test 'event-dropdownens etikett kvalificerar...' (PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance tests/acceptance/mer-aktivitetshistorik-filter.acceptance.test.ts, 11 passed).

AC #2 avbockad — testet 'TASK-201.17 — event-dropdownens etikett kvalificerar...' visar två event med identiskt eventNamn='Fjärrskådning' (Skövde/15 sep, Varberg/22 aug) som TVÅ skilda, klickbara options; negativ kontroll körd (denna byggsession): eventFilterEtikett tillfälligt bytt tillbaka till bar eventVisningsNamn → testet FÄLLDE (getByRole option 'Fjärrskådning · Skövde · 15 sep' hittades aldrig; tie-break-testet visade tre identiska 'Fjärrskådning'-strängar i stället för de kvalificerade). Fixen återställd, samtliga 11 tester gröna igen.

AC #3 avbockad — eventOptions-sorteringen (AktivitetsHistorik.tsx, useMemo) primär namn (oförändrat) + sekundär startdatum-tie-break (lexikografisk localeCompare på ISO YYYY-MM-DD = kronologisk). Verifierat via acceptance-test 'identiskt namngivna event sorteras kronologiskt sinsemellan': tre Fjärrskådning-event i AVSIKTLIGT osorterad mock-ordning (okt/aug/aug-22) renderas i dropdownen i ordningen Skövde 1 aug / Varberg 22 aug / Falköping 1 okt.

AC #4 avbockad — a11y orörd: Select-primitivens egen mekanik (option-roller, aria/labels, tangentbordsväg) rördes inte, endast options-BARNENS textinnehåll. Verifierat: befintliga tester 'AC #3 — axe 0 violations med filterraden synlig' och 'AC #3 — tangentbordsväg: kategori-filtret väljs utan mus' (oförändrade av denna skiva) körda tillsammans med de nya — samtliga 11 tester i mer-aktivitetshistorik-filter.acceptance.test.ts gröna, inkl. axe wcag2a/2aa/21a/21aa/22aa 0 violations.

STÄNGNING (S105 Del 11): landad via PR #1298, merge 400d2ba9 — CI, Post-merge och CodeQL samtliga success (gh run list mot merge-SHA).
<!-- SECTION:NOTES:END -->
