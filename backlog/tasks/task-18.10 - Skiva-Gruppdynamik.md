---
id: TASK-18.10
title: 'Skiva: Gruppdynamik'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 01:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
  - TASK-17.3
parent_task_id: TASK-18
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Gruppdynamik-avsnittet ände-till-ände: erfarenhetsmixens summeringsrad med sekventiell mätare och streck-rader, nivågrupper som accordions med vita personkort som bär per-person-kurshistorik i kursfärgs-tokensen med månad och år, samt motiveringarna som vita kort med Läs mer/Visa mindre där radbrytningar bevaras. Shape-utökning: Erfarenhetsbadge per deltagare, kurshistorik ur Deltaganden och motiverings-fälten (fälten FINNS i basen — K65-rättelsen; ren läsning). Kända luckor i badge-underlaget (T16) visas som de är — designas inte bort. Täcker användarberättelser: 25-27 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Gruppdynamik-shape-utökningen kontraktstestad
- [x] #2 Mätaren, accordions och kurshistoriken i tokens-färgerna renderade mot facit-gruppdynamik-bilagan; Läs mer-beteendet bevisat i e2e
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (task/18.10)

### Snittet
Gruppdynamik-avsnittet ände-till-ände (S73-facit K63–K65), sist av eventsidans datagrupper (före Anteckningar 18.11). Ny komponent src/components/events/detail/Gruppdynamik.tsx wired in i EventDetail efter Närvaro: erfarenhetsmixens summeringsrad + sekventiell mätare + tre nivå-accordions med vita personkort (per-person-kurshistorik i kursfärgs-tokensen + månad/år) + motiveringarna som vita kort med Läs mer/Visa mindre. Delar registrations.byEvent-cachen med arbetskön (Deltagare) — React Query dedupar till EN fetch. Nyskriven mot facit-bilagan.

### Shape-utökningen (2 additiva LÄS-fält, additivt-optional)
erfarenhetsbadge (string|null) + kurshistorik (PersonHistoryEntry[]|null); motivering fanns redan (18.4). Schema + modell + paritetsfilen (via typecheck) i samma commit. INGA nya bas-fält — samtliga FANNS; LIVE-verifierade mot staging 2026-07-23 (L294): Erfarenhetsbadge fld04qqDQLgbJbBef (RIM-3-BLIND) · Personer.Deltaganden fld5shm9UER5CMyTl · Kursnamn(lookup) fldJyjymEoo514AgN · Event startdatum fldExIP1zw5o6ib63 · Session fldBPZnsDL0bNIRHx · Närvaropoäng fldwuo94BY46VUOm4. Ingen allowlist-post (ren LÄS-skiva).

### EF-vägvalet (FAS-direktiv: UTÖKA get-registrations)
berikaPersonhistorik gör nu TVÅ chunkade record-ID-batchar (get-person-mallen, ALDRIG N+1): Personer-batchen bär nu antalGenomfordaEvent + Erfarenhetsbadge + Deltaganden-länken i EN projektion; en NY Deltaganden-batch hämtar kurshistoriken. kurshistorik återanvänder get-person:s PersonHistoryEntry-shape (ingen parallell form) — RÅA per-session-rader; vyn härleder genomförda+deduperade kurser klientside (narvaro && Session in {Dag 1, Föreläsning}). Deployad till STAGING (--project-ref pqtshyierkdgwdnxuirz); PROD ORÖRD.

### Tre öppet bokförda designbeslut (Marcus-granskning)
1. Nivå-bucketarna (0/1–2/3+) härleds ur antalGenomfordaEvent (RIM-3-INKLUDERANDE, redan i shapen ur 18.4) — EXAKT facit-bilagans tre nivåer.
2. Erfarenhetsbadgen visas RÅ på personkortet (RIM-3-BLIND): när en person står i 3+ (räknaren) men bär badge Resenär steg 1–2 ÄR divergensen den kända luckan (T16) visad, ej dold. Badge-chippet är ett tillägg ÖVER facit-bilagan (som ej visar badge) → DoD #5 avgör om det består.
3. Anmälningar utan Person-länk (manuell/+1) saknar underlag → utanför mixen (klassificerbara populationen); N av totalt går över den. Öppet, ej tyst 0-tvingning.

### Tokens
Ny sekventiell skala i semantic.css (--mm-erfarenhet-ny/mellan/erfaren = neutral-300/500/700): NEUTRAL ramp, distinkt från kurs-/kategorifärger, respekterar fokusringens exklusiva #1B4965 (primitivlagret läs-yta; tredje mörk BLÅ saknas). Kurshistorik-strecken använder befintliga --mm-kurs-* (17.3). Spec §17 utökad.

### Läs mer/Visa mindre — MÄTT overflow
MotiveringsKort mäter FAKTISK overflow (scrollHeight > clientHeight mot line-clamp-3-lådan, ResizeObserver) — knappen visas bara vid genuin overflow. Radbrytningar bevaras (whitespace-pre-line). aria-label KONTEXTUELL (Läs hela ⇄ Visa mindre).

### Bevis (TDD RÖTT→GRÖNT)
- api (AC #1): 3 nya kontraktstester (fält-närvaro aldrig-undefined · badge kanonisk + null-utan-Person-länk · kurshistorik ur Deltaganden-batchen). RÖTT mot dåvarande deployade EF (3 failed) → deploy → GRÖNT (13/13 i filen). Hela api-sviten 358/358.
- e2e (AC #2): 8 nya tester (summering av klassificerbara · tre nivå-buckets · accordion→personkort med kurshistorik + kursfärgs-token rgb(96,107,87) computed + månad/år · genomförd-filtret/dedupen [Dag 2 + icke-närvaro bort] · T16-badge RÅ · tom kurshistorik→första gången · Läs mer mätt overflow · axe 0). RÖTT observerat med EventDetail-inkopplingen bortstashad (7 failed) → GRÖNT (8/8). Hela event-detail.staging.test.ts 46/46.
- Facit-order (18.1:s test i kortets yta): h2-listan utökad med Gruppdynamik — enda DETERMINISTISKA testutfall min ändring rör.
- Full e2e isolerings-kontroll: baseline (förgrenings-SHA, stashad) = 250 passed / 4 failed (hem:410, hem:663, mer-segment:105, skapa-event:405 — VARIERANDE flaky + port-5188-CORS på skarpa EF-läsningar). Min ändring lägger NOLL nytt deterministiskt rött; de flaky/CORS-röda ligger utanför min yta och finns i baseline.
- Renderad facit-verifiering (DoD #6, L245/L246): e2e computed-style (kursfärg-rgb, whiteSpace pre-line, aria-tillstånd, badge RÅ, bucket-antal, genomförd-filtret). Marcus visuella jämförelse = DoD #5 (öppen).
- Övriga grindar: typecheck 0 · biome 0 (repo-exit 0; mina 8 filer rena) · build grön (3821 moduler) · a11y 62/62.

### Claims-kvitto
11 ändrade filer (10 M + 1 ny), ALLA inom kortets yta. routeTree.gen.ts ej committad (gitignorad). tasks/lessons.md + docs/reference/data-model.md orörda. Nya staging-fält = INGA (pre-existerande, live-verifierade).

GRANSKNINGSFÄRDIG — väntar design-review (Marcus, DoD #5). Kortet står In Progress. DoD #3 (CI grön per jobb) bocks av orkestratorn efter grön CI.

---

HISTORIK — HALT-NOTEN FRÅN BATCH-KÖRNINGEN (bevarad per ADR-073 Am 3 mandat (b), union; LÄKT av orkestrator-fixen 4416fc0: '+ nivåstreck)' → 'plus nivåstreck', rebruten rad. markdownlint 0 issues efter läkning):

AFK-BATCH MERGE-AGENT HALT (steg 5 — PR-CI-vakten per jobb) 2026-07-23. PR #88 skapad (branch task/18.10, head 7d4ddc86). PR-CI run 29972808069: jobbet 'Docs link check' RÖTT (completed failure). Rotorsak (markdownlint-cli2, lokalt reproducerad mot branch-filen): docs/specs/DESIGN-SYSTEM-SPEC.md:1275 — MD004/ul-style [Expected: dash; Actual: plus] + MD032/blanks-around-lists [Context: '+ nivastreck) som svarar pa...']. Den mjuk-radbrutna parentesen '(matar-segment + nivastreck)' la fragmentet '+ nivastreck)' vid radstart dar Markdown laser '+' som list-bullet -> mis-render + markdownlint-brott. Introducerat av branchens spec-edit (§17-tillagget); mains fil ren. Ovriga PR-jobb vid halt: Lint+Audit+TypeCheck gron, Detect changed files gron, Staging sentinel purge gron, Test+Build pagick (irrelevant — docs redan rott => rod overall). INGEN merge, main OrORD. Atgardsyta: fixa radbrytningen sa '+' inte hamnar vid radstart (t.ex. slut ihop raden eller byt '+' mot 'och'), pusha till branchen, kor om. Branch + PR #88 star kvar.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
