---
id: TASK-5
title: >-
  Fynd: e2e-webServer återanvänder föråldrad dev-server — stale moduler ger
  falsk-rött/falsk-grönt lokalt
status: Done
assignee: []
created_date: '2026-07-11 09:42'
updated_date: '2026-07-12 17:37'
labels:
  - ready-for-agent
dependencies: []
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S61 batch 2, task-4.3-körningen): playwright.config.ts e2e-webServer har reuseExistingServer: !CI → en Vite-process startad 6 juli (S55-eran, PID-livslängd 5 dagar) återanvändes tyst; dess fil-watcher hade slutat invalidera modulgrafen, så servern serverade GAMMAL komponentkod trots färska disk-edits (curl mot /src/components/hem/NastaEventCard.tsx returnerade förra sessionens innehåll medan disken bar nya). Effekt: TDD-grönt-kvittot uteblev (falsk-rött) — spegelfallet till Session 15 K2-fyndet (falsk-grönt) som redan är löst för a11y-projektet via dedikerad port + reuseExistingServer: false + --strictPort. Workaround i körningen: döda den föråldrade processen manuellt → Playwright startade färsk server → grönt.

FÖRVÄNTAT BETEENDE: e2e-körningar möter aldrig en server vars modulgraf kan vara äldre än working tree. Kandidatform (avgörs vid plock): samma mönster som a11y-projektet (dedikerad e2e-port + reuseExistingServer: false + --strictPort), alternativt en färskhets-vakt (t.ex. jämför serverns startdatum mot senaste src-mtime och vägra tyst återanvändning). Trade-off att värdera: dev-ergonomin (snabb lokal iteration mot redan igång server) vs riskklassen falsk-rött/falsk-grönt.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 e2e-webServer kan inte tyst servera föråldrad modulgraf: antingen startas alltid färsk server (a11y-mönstret: dedikerad port + reuseExistingServer: false + --strictPort) eller vägras återanvändning med hårt fel — mekanismvalet + dev-ergonomi-trade-offen öppet bokförd i kortets notes
- [x] #2 Symptom-repron belagd stängd: med en avsiktligt föråldrad server igång på porten möter e2e-körningen aldrig gammal kod (bevisas i körning, inte antas)
- [x] #3 Berörda kanoniska kommandon gröna efter ändringen; dok-bäraren (CONTRIBUTING/test-dok) uppdaterad om körform eller port ändras
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MEKANISMVAL (AC 1): a11y-mönstrets skyddsmekanik — reuseExistingServer: false + --strictPort — men på BEFINTLIG port 5173, INTE dedikerad port: staging-CORS_ALLOWED_ORIGINS tillåter exakt origin http://localhost:5173 (tests/api/cors.staging.test.ts; samma vägg som TASK-10:s CORS-blockerade preview-port 4173), så en dedikerad e2e-port hade CORS-blockerat appens staging-anrop och krävt staging-secret-ändring utanför kortets yta. Effekten är AC-formens båda grenar i ett: ledig port → alltid färsk server (modulgraf ≡ disk vid start); upptagen port → hård vägran. Färskhets-vakt-alternativet förkastat: kräver plattformsspecifik process-introspektion (lsof/ps-etime) och har falsknegativ-yta (watchern kan dö EFTER färsk start) — svagare garanti än alltid-färsk.

DEV-ERGONOMI-TRADE-OFF (AC 1): lokal e2e-körning kräver ledig 5173 — egen dev-server stängs först (annars hård vägran 'http://localhost:5173 is already used'); kostnad ~5-10 s serverstart per körning. Vinst: S61-klassen (stale modulgraf → falsk-rött/falsk-grönt) mekaniskt omöjlig. Bokförd även i playwright.config.ts-kommentaren + README Scripts-tabellen.

FÖLJDÄNDRING fångad i körning: Playwrights webServer är GLOBAL per config-fil — den hårda vägran blockerade serverfria API-körningar (test:api exit 1 mot upptagen 5173, bevisat RÖTT i körning). test:api*-scripten sätter nu PLAYWRIGHT_NO_WEB_SERVER=1 (samma env-flagge-idiom som test:a11y) → webServer undefined för API-sviterna (serverfrihet verifierad: inga page.goto i tests/api; helpers-skipvakten env-baserad). Därefter GRÖNT: 290/290 körbara passerade mot upptagen 5173. CI-bieffekt: api-stegen slipper hittills onödig dev-server-boot.

BEVIS I KÖRNING (AC 2): RÖD (gammal config; genuint främmande dev-server PID 10309 på 5173, startad 17:06, + därefter nyare disk via temporär src-markör): DEBUG=pw:webserver visar 'WebServer is already available' — TYST REUSE, 28 tester körde mot potentiellt stale modulgraf utan varning. GRÖN B (ny config, samma arrangemang): exit 1, 0 tester körda, 'is already used'-vägran — e2e-vägen möter ALDRIG den föråldrade servern. GRÖN A (ledig port → färsk server + full svit) bärs av CI-runnets e2e-steg (webServer-grenen körs på ren runner, PLAYWRIGHT_TEST_BASE_URL osatt där). Den främmande servern dödades ALDRIG (orörd PID/starttid efteråt); src-markören återställd byte-identiskt. Lokal full-svit-körning av test:e2e:staging var avsiktligt INTE möjlig utan att döda den främmande servern — utanför min befogenhet (endast egenstartade processer får dödas).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit f8f48f7906c9ce4df4b8d2016ff4783a5b1afa1f · CI-run 29202151402 grön per jobb (Detect changed files / Lint+Audit+TypeCheck / Docs link check / Test+Build / CI Passed or Skipped — Test+Build skarp, ej skipped) · CI-grön-första-pass: ja · defekter under körning: 1 (Playwrights GLOBALA webServer blockerade serverfria test:api-körningar vid upptagen 5173 — min hårda vägran exponerade den; fixad i samma leverans via PLAYWRIGHT_NO_WEB_SERVER-flaggan på test:api*-scripten, RÖD exit 1 → GRÖN 290/290 körbara; de 6 kvarvarande api-staging-felen = pre-existerande env-nyckel-gap, fynd-kort task-11) · TDD: config-kort utan enhetstest-yta — undantaget täckt av AC 2-beviset RÖD→GRÖN i skarp körning (RÖD gammal config: DEBUG=pw:webserver 'WebServer is already available' = tyst reuse av genuint främmande server PID 10309 med nyare disk, 28 tester utan varning; GRÖN ny config samma arrangemang: exit 1 '...is already used', 0 tester, servern orörd; färsk-start-grenen bevisad av CI-runnets e2e-steg)
<!-- SECTION:FINAL_SUMMARY:END -->
