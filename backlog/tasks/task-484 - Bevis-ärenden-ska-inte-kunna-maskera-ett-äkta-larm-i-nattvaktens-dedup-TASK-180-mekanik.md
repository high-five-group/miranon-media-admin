---
id: TASK-484
title: >-
  Bevis-ärenden ska inte kunna maskera ett äkta larm i nattvaktens dedup
  (TASK-180-mekanik)
status: To Do
assignee: []
created_date: '2026-09-19 12:38'
updated_date: '2026-09-19 13:20'
labels:
  - ready-for-agent
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2590'
  - 'https://github.com/high-five-group/miranon-media-admin/issues/2589'
  - scripts/check-nattvakt-dedup.sh
  - .nattvakt-dedup-policy.conf
priority: high
ordinal: 838000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/check-nattvakt-dedup.sh (TASK-180) dedupar mot VARJE ärende med etiketten `ci-natt` som är stängt med minst en kommentar inom NATTVAKT_DEDUP_FONSTER_TIMMAR (26 h) — oavsett om ärendet kom från en äkta röd natt eller en avsiktlig BEVIS-LÄGE-dispatch. Fyndet kom ur review runda 1 av `TASK-467` (PR #2590, granskad SHA 236bf0d0): två `simulate_beroende_tyst=true`-dispatchar mot PR-grenen skapade och stängde issue #2589 (etikett `ci-natt`, stängt 2026-09-19T12:17:05Z med en motiveringskommentar) — ett kvarlämnat bevis-ärende som, om det stått kvar med etiketten, hade kunnat tysta ett äkta larm fram till ~2026-09-20T12:17Z. Orkestreraren neutraliserade INSTANSEN genom att ta bort `ci-natt`-etiketten från #2589 (2026-09-19T12:35:17Z, ~18 min senare) — detta kort är den STRUKTURELLA fixen så mekanismen inte kan hamna där igen.

Samma risk gäller `simulate_missing`-dispatchar mot nightly-watchdog.yml sedan `TASK-180` (2026-08-10) — TASK-467 lade bara till ett ANDRA bevis-läge (`simulate_beroende_tyst`) som triggar exakt samma dedup-yta, den pre-existerade redan. Den gäller sannolikt även `nightly.yml`s `simulate_failure=produkt`-dispatch (CONTRIBUTING § Nattnätet), eftersom `alarm`-jobbet skapar ärenden med SAMMA `ci-natt`-etikett via samma `gh issue create`-mönster — verifiera vid design, anta inte.

Rör INTE `nightly-watchdog.yml` eller `nightly.yml` i denna skiva om det går att undvika — ändringen hör hemma i `scripts/check-nattvakt-dedup.sh` och/eller `.nattvakt-dedup-policy.conf` (TASK-180s egna filer). Två kandidatlösningar, avväg vid design (ingen är förvald): (a) simulate-vägarna sätter en EGEN etikett (t.ex. `ci-natt-bevis`) i stället för `ci-natt` på sina skapade ärenden, så dedupen aldrig ser dem — kräver ändring i de workflow-filer som skapar bevis-ärenden; (b) dedupen (`check-nattvakt-dedup.sh`) hoppar explicit över ärenden vars titel innehåller "BEVIS-LÄGE" — ren skript-ändring, ingen workflow-touch, men mönster-matchning på titeltext är skörare än en etikett.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tvåsidigt bevisat (testsvit, fixturbaserad, i samma mönster som scripts/test-check-nattvakt-dedup.sh): ett ärende som representerar en bevis-dispatch (BEVIS-LÄGE-markerat, oavsett vald lösning) maskerar INTE ett äkta larm — dedup-beslutet ignorerar det och signalerar LARMA.
- [ ] #2 Samma testsvit bevisar att ett ÄKTA ärende (stängt-med-motivering inom fönstret, ELLER öppet) fortfarande dedupar korrekt — regressionsskydd mot TASK-180s ursprungliga fix (issue #1042).
- [ ] #3 Lösningen dokumenterad i CONTRIBUTING.md § Nattnätet (ersätter ÅTAGANDE-noten TASK-467 lade till om manuell etikett-borttagning) och i scripts/check-nattvakt-dedup.sh + .nattvakt-dedup-policy.conf sina egna huvuden, med instansen (#2589) som källa.
- [ ] #4 Bedömt och antingen fixat eller explicit avfört (med skäl) huruvida samma risk gäller nightly.yml simulate_failure=produkt-dispatchens ci-natt-ärenden.
- [ ] #5 Den kvarlämnade kommentaren i .github/workflows/nightly-watchdog.yml (~rad 262, direkt ovanför alarm_barande_rott-blocket) som säger att SIDA 2 'körs OBEROENDE av produktkanal-checken' är rättad — den motsäger koden och den korrekta kommentaren ~40 rader längre ner (SIDA 2 körs bara i SIDA 1:s else-gren). Fynd ur PR #2590 review runda 2; avskrivet vid landning på Marcus mandat med denna AC som bärare
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
