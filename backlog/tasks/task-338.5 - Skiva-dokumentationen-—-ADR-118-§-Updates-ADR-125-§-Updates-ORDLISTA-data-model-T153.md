---
id: TASK-338.5
title: >-
  Skiva: dokumentationen — ADR-118 § Updates, ADR-125 § Updates, ORDLISTA,
  data-model, T153
status: Done
assignee: []
created_date: '2026-08-29 08:04'
updated_date: '2026-08-29 09:56'
labels:
  - ready-for-agent
dependencies:
  - TASK-338.2
parent_task_id: TASK-338
ordinal: 615000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan bokför repot ersättningen öppet: ADR-118 får en § Updates-sektion som daterat beskriver att beslut 1/4/5 ersatts av S108 Del 2 § D → ADR-125 § Beslut 1 → TASK-338 (och att beslut 2/3 gäller vidare); ADR-125 får en § Updates-rad med lagringsformen (Räckvidd 'Gemensam' + axlarna Kursfamilj/Kursnivå/Plats, matchning i kod, legacy-tolerans) och skälen; ORDLISTA § Räckvidd och § Gemensam bilaga nämner värdet 'Gemensam' och badge-formerna; data-model.md § Bilagor beskriver fälten (staging-ID:n, prod väntar 338.6); tråd T153:s indexrad pekar på TASK-338 för sushimenyn/parkeringsbilagan. Inga kodändringar. Täcker användarberättelser: 13, 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR-118 har § Updates med datum, ersättningskedjan och vilka beslut som gäller vidare; ADR-125 § Updates bär lagringsformen; check-adr-räkningen oförändrad (ingen ny ADR)
- [x] #2 ORDLISTA § Räckvidd/§ Gemensam bilaga uppdaterade i ordlistans format; data-model.md § Bilagor med fält-ID:n; T153-raden pekar på TASK-338; check-thread-index.sh exit 0
- [x] #3 npm run check:docs exit 0 (14 gröna)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Modell-identitet:** Sonnet 5 (Claude Sonnet 5, agent-transcript — "You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5.").

**Premiss-pass (ADR-086):** `git fetch` gav `origin/main` = worktree-basen `eeef0b54` (ingen divergens — 338.1/338.2/339 redan landade och synliga). Verifierat mot disk INNAN design: ADR-118 saknade helt `## Updates` (rubrikerna var Kontext/Beslut/Alternativ/Konsekvenser/ADR-bar) — bekräftar uppdragets premiss. ADR-125 hade redan ett `## Updates` med fyra befintliga poster (senast 2026-08-28) i samma format jag följde. ORDLISTA § Räckvidd/§ Gemensam bilaga fanns redan (S108-grillningens konceptuella beskrivning av tre-axel-filtret), men saknade värdet "Gemensam" och badge-formerna, och bar den stale frasen "… och i Åtgärds-sidans bilageväljare" precis som TASK-339 flaggat. data-model.md § "Bilagornas Gemensam-räckvidd — Plats-axel" (skapad av TASK-338.1) hade redan fält-ID:n och prod-kolumnen "väntar TASK-338.6" — rörde INTE den kolumnen, kompletterade bara med matchningsregel + randfall. tasks/threads/README.md T153-raden bar exakt den text uppdraget citerade. Ingen divergens funnen mellan uppdrag och faktiskt tillstånd.

**AC #1 — UPPFYLLT.** ADR-118 fick `## Updates` med daterad post (2026-08-29): beslut 1 (radioval Event/Kurstyp/Alla event) och beslut 4 (basform) ERSATTA av tre-axel-modellen; beslut 5 (administration) ERSATT i konkret form men princip kvarstår; beslut 2 (union + badge i Åtgärds-sidan) AMENDERAT — unionen kvarstår, badgen bort ur Åtgärds-sidan (TASK-339); beslut 3 (raderingsskydd) GÄLLER VIDARE oförändrat. Kedjan S108 Del 2 § D → ADR-125 § Beslut 1 → TASK-338 bokförd explicit. ADR-125 fick en ny `### 2026-08-29`-post med lagringsformen (Räckvidd="Gemensam" + Kursfamilj/Kursnivå/Plats-länk/Platsnamn-lookup), matchningsregeln (EN hämtning, OCH i kod, record-ID aldrig namn), legacy-toleransen som bokförd rivningsskuld, och det kända randfallet. check-adr-räkningen: `npm run check:docs` bekräftar "126 ADR-filer == README (126)" — oförändrat, ingen ny ADR mintad.

**AC #2 — UPPFYLLT.** ORDLISTA § Räckvidd nämner nu explicit att filtret lagras som EN singleSelect-option "Gemensam" oavsett antal satta axlar. § Gemensam bilaga listar badge-formerna ("Alla event" · "RIM · Steg 1" · "Rönninge" · "RIM · Rönninge" · "RIM · Steg 1 · Rönninge") och korrigerar "… och i Åtgärds-sidans bilageväljare" till att badgen visas i Dokument-ytan och sedan TASK-339 INTE i Åtgärds-sidans bilageväljare. data-model.md § Bilagor fick en ny "Matchningsregeln"-paragraf (pekar på `supabase/functions/_shared/rackvidd-matchning.ts`, modul-pekare, inget radnummer) plus det kända randfallet (tomt Räckvidd + tom Event-länk = osynlig rad, oskapbart från appen). Prod-kolumnen "väntar TASK-338.6" lämnad orörd. `bash scripts/check-thread-index.sh` → exit 0 ("tråd-index OK").

**Badge-formerna, en medveten synteslösning värd att flagga:** uppdraget citerade badge-strängarna med "Nivå 1" (PRD `TASK-338` § Implementationsbeslut → Domän och klient skriver "RIM · Nivå 1" ordagrant), men samma PRD-mening bär en parentes: "('Steg'-etiketten via befintlig stegEtikett)" — dvs den FAKTISKA renderade texten är "Steg 1", inte "Nivå 1"; "Nivå 1" i PRD-prosan är basfältets rå etikett, inte UI-strängen. ORDLISTA § Steg slår redan fast "Steg — aldrig 'Nivå' — överallt" (Marcus S108). Jag skrev därför badge-formerna med "Steg 1" och en förklarande bisats om att Kursnivåns basfältnamn ("Nivå 1") mappas till "Steg 1" i presentationslagret — samma upplösning PRD:n själv gjorde, för att inte introducera en synlig motsägelse mot ORDLISTANS egen § Steg-regel. Bokfört här som en tolkning, inte en tyst avvikelse; TASK-338.3 (klienten, ej byggd än) avgör den faktiska renderade strängen skarpt.

**AC #3 — UPPFYLLT.** `npm run check:docs` → exit 0, "14 gröna" (samtliga 14 dokumentations-grindar). `npx markdownlint-cli2 --fix` kördes FÖRE grinden (0 issues efter fix, inga ändringar behövdes). `node scripts/check-langa-streck.mjs` → exit 0 (diffen rör inte `src/`, körd ändå för säkerhets skull: 262 filer skannade, 0 fynd).

**DoD-notering (orkestrerarens beslut, inte satt av mig — kortet lämnas i To Do, Done sätts av orkestreraren efter CI):**
- #1 alla tre AC avbockade via `--check-ac`.
- #2 rörd fil-klass grind (`check:docs`, markdownlint) grön.
- #3 `git status --porcelain` visar exakt 5 rörda filer: `ORDLISTA.md`, `docs/decisions/ADR-118-bilagors-rackviddsmodell.md`, `docs/decisions/ADR-125-bilagornas-modell-och-promoveringsvag.md`, `docs/reference/data-model.md`, `tasks/threads/README.md` — samtliga uppdragets fem punkter, ingen orelaterad fil.
- #4 N/A — inga prod-schemaändringar, inget Airtable-anrop alls i denna skiva.
- #5 N/A — ingen EF-operation ändrad, inga kodändringar (ren docs-skiva).
- #6 N/A — ingen matchnings-/valideringskod skriven eller ändrad; ADR/ORDLISTA/data-model beskriver befintlig, redan landad kod (TASK-338.2).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2089 (mergad 2026-08-29 09:54:00Z, main 9b9c1d9f). ADR-118 fick § Updates (beslut 1/4/5 ersatta, 2 amenderat per TASK-339, 3 gäller), ADR-125 § Updates med lagringsformen, ORDLISTA § Räckvidd/§ Gemensam bilaga (värdet Gemensam, badge-formerna med 'Steg' — aldrig 'Nivå' — ordlistan vann över PRD:ns exempelsträngar), data-model § Bilagor, T153 → TASK-338. check:docs 14/14.
<!-- SECTION:FINAL_SUMMARY:END -->
