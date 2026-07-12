---
id: TASK-9.2
title: 'Skiva: Mer-vyn till M6-facitet + e2e/axe'
status: In Progress
assignee: []
created_date: '2026-07-12 10:16'
updated_date: '2026-07-12 20:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-9.1
parent_task_id: TASK-9
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mer-landningen NYSKRIVEN mot M6-facitet (throwaway-kontraktet: prototypkod befordras aldrig; facit-källa sessionsdok S64 Del 3 + bilagor s64-mer-konvergens, återupplivningsväg bokförd där). Beteendet ände-till-ände: Lotta öppnar Mer-fliken och möter facitets lugna kortmeny — rubrik, två luftgrupper, centrerad utloggning — och varje rad leder till sitt mål; tangentbord och skärmläsare får samma struktur (nav-landmärke, radnamn utan ikonbrus, handling utanför nav). Skarv 2 (mer-e2e/axe) utökas mot facitet. Täcker användarberättelser: 1, 2, 3, 7, 10, 12 (+ 4–6, 8–9 på vynivå)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /mer renderar M6-facitet: synlig h1 'Mer' (30/600), shell-headern av, sex NavCard-rader i två grupper ([Anmälningar, Väntelista, Intresserade, Maillogg] · [Skapa nytt event, Bygg segment]) med PRD:ns ikonval inkl. Filter för Bygg segment
- [x] #2 Måtten computed-verifierade mot facitet: sidmarginal 16 (ingen egen sidopadding), radhöjd ca 58, 10 px radgap inom grupp, 32 px vertikal rytm, topp-luft i Hem-paritet
- [x] #3 Logga ut: ghost-Button med utloggnings-ikon + text, centrerad under grupperna, UTANFÖR nav-landmärket; logout-kedjan fungerar oförändrat (utloggning → inloggningssidan)
- [x] #4 Mer-e2e/axe-sviten grön: befintligt kontrakt består (nav-namnet, Logga ut utanför nav, ingen Inställningar, axe 0, logout-flödet) + facit-assertioner (synlig h1, header-frånvaro, tvågruppsstruktur, ingen chevron)
- [x] #5 Sidtitel-annonseringen oförändrad ('Mer' i fönstertitel + route-annonsering)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Leverans (S66 parallell-batch 2, do-work): Mer-vyn NYSKRIVEN mot M6-facitet (S64 Del 3; 230f322 = referens, ej källa) på NavCard-primitiven (task-9.1). hideShellHeader via BEFINTLIG per-vy-mekanik (staticData, task-4.2/K10) — ingen shell-ändring behövdes. Mer-e2e-sviten +5 facit-tester (computed-mått per L246/L272: h1 30/600, header-frånvaro, tvågruppsstruktur+ordning+ikoner 20px, ingen chevron, sidmarginal 16/section-padding 0, radhöjd 56-60, radgap 10, rytm 32, logout-block pt-4 16, Hem-paritet topp-luft 1280+390, ghost-logout centrerad m. ikon, titel+annonsering); befintligt kontrakt orört. shell-svitens DoD 1-kommentar synkad (Hem-scopad -> vy-scopad; testkod orörd). Lokala grindar: typecheck 0 fel, typecheck:tests 0, biome exit 0, build gron, test:api 296/296 (TEST_REGISTRATION_RECORD_ID ur BUILD-LOG-seed-ankaret; forsta korningen 290/296 = CONTRIBUTING:s dokumenterade env-symptom, EJ regression), test:a11y 31/31. E2E-STAGING EJ KORD LOKALT: 5173 upptagen av frammande dev-server hela passet (ADR-073-portlaget, servern rors aldrig) -> e2e-beviset = PR-CI:s test:e2e:staging-steg. TDD-avvikelse oppet bokford: facit-specsen skrivna FORE vy-nyskrivningen (permanenta tester) men ROD-observationen ej korbar lokalt; AC 5 ar bevarande-kontrakt (ej ROD-bar by design). AC 1-5 lamnas obockade for orkestratorns post-CI-bock.

GRANSKNINGSFÄRDIG (S66 parallell-batch 2): levererad f4a0288, PR #54, PR-CI 29206889666 + main-CI 29207092485 gröna per jobb. e2e-bevisform: pr-ci. Väntar design-review (DoD 5) — Done-flippen är Marcus. AFK-proveniens: batch 2 pipeline TASK-9.2.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [x] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
