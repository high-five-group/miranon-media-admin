---
id: TASK-173.5
title: 'Skiva: Rundtaks-loopen + eskaleringsformen'
status: Done
assignee: []
created_date: '2026-08-09 13:15'
updated_date: '2026-08-26 08:12'
labels:
  - ready-for-agent
  - intentionally-unchecked
dependencies:
  - TASK-173.1
parent_task_id: TASK-173
ordinal: 328000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: granskningsloopens flöde runda 1 → bygg-agent-fix → runda 2 (färsk kontext, error-tröskel) → vid tak en STOPPA-OCH-FRÅGA-eskalering med öppna fynd som markeringsbar lista; konvergensregeln är den direkta motåtgärden mot förlagans 27-rundors-incident (ADR-105 beslut 4). Täcker användarberättelser: 6, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Runda 2 körs i färsk kontext och blockerar — i betydelsen tvingar fram ännu en runda — endast på error-klass; warnings/info bokförs i utlåtandet utan att stoppa. Ett kvarstående warning i runda 2 tvingar alltså ingen tredje runda, men räknas som ÖPPET fynd vid taket och eskalerar därmed till Marcus enligt AC #2 — 'blockerar' och 'öppet vid tak' är två skilda trösklar, och grinden självgodkänner aldrig (AC #4)
- [x] #2 Efter runda 2 sker aldrig en tredje automatisk runda — kvarvarande öppna fynd presenteras som markeringsbar STOPPA-OCH-FRÅGA-lista i chatten och armeringen väntar på Marcus beslut
- [x] #3 auto-fix-klassade fynd routas till bygg-agenten för rättning; ask-user-klassade eskaleras till Marcus oavsett runda
- [x] #4 Grinden självgodkänner aldrig vid tak — taket byter automatik mot eskalering
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Tvåsidig skript-testsvit (ska-fälla + ska-passera) per nytt deterministiskt skript, grön lokalt
- [ ] #6 CI-backstoppens grind-verkan bevisad med rött-först-form: positivt bevis + negativ self-test
- [ ] #7 Instrumenteringsloggen bevisat skrivande från första skarpa körningen (findings-per-runda + risk-kalibrering + grind-missar)
- [x] #8 Mekanism som inte kan skarpbevisas i byggsessionen bokförs som öppen skuld i handoff, aldrig som klar
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
OBOCKAT MED AVSIKT: DoD #6 (CI-backstoppens grind-verkan) och DoD #7 (instrumenteringsloggens skrivning) kräver mekanismer som INTE ännu finns i repot — de hör till TASK-173.4 respektive TASK-173.6 (se CLAUDE.md § Review-grinden, 'Vad som SAKNAS än'). Kan strukturellt inte skarpbevisas i detta kort. Etikett intentionally-unchecked satt enligt ADR-127 B2.

Skarpbevis av loop-CLI:t (DoD #3-underlag), 2026-08-26 (stängningsbatch 4): körde node scripts/review-loop-beslut.mjs mot ett VERKLIGT utlåtande (review-utlatande-pr2000.json — PR #2000, runda 1, risk 'lag', 5 fynd severity=info men samtliga action=ask-user). Resultat: EXIT 20 (ej det uppdrags-antagna 0/'konvergerad' — divergens bokförd i PR-beskrivningen), beslut='eskalera-ask-user', skal="5 fynd är klassade 'ask-user' och eskalerar till Marcus oavsett runda (AC #3) - bygg-agenten far inte gissa sig forbi dem.", armeringTillaten=false. Detta AR ratt utfall enligt AC #3/#4 (varje ask-user-fynd eskalerar oavsett severity/risk, grinden sjalvgodkanner aldrig) - mekanismen ar bevisad fungera end-to-end mot verklig granskningsdata med deterministisk exitkod och korrekt STOPPA-OCH-FRAGA-lista. Testsvit scripts/test-review-loop.mjs: 103 grona, 0 roda (re-korn 2026-08-26).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2007 (merge-commit fafaf6a3a5d51d020ab49855aa5f4e579a81d7b0, mergad 2026-08-26T07:27:00Z, merge_group success). Skarpbevis av loop-CLI:t betalt i stangningsbatch 4 (se Notes) - exit 20/eskalera-ask-user mot verklig data, ej det forvantade 0/konvergerad; se PR-beskrivning for divergensanalys. AC #1-4 avbockade i PR #2007. DoD #6/#7 intentionally-unchecked (kraver TASK-173.4/173.6).
<!-- SECTION:FINAL_SUMMARY:END -->
