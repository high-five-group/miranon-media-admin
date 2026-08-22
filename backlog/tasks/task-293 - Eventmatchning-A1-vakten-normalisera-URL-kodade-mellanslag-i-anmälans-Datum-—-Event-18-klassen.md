---
id: TASK-293
title: >-
  Eventmatchning + A1-vakten: normalisera URL-kodade mellanslag (+) i anmälans
  Datum — Event-18-klassen
status: To Do
assignee: []
created_date: '2026-08-22 11:52'
updated_date: '2026-08-22 11:53'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 535000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur TASK-284.6 AC #2 (prod-kontrollsvepet 2026-08-22, S110 Del 10): Event-18:s falska positiv, öppen sedan 284.1:s underlag, LOKALISERAD — ID 197 (Andreas Pettersson) bar Datum '14–15+maj+2026': URL-kodade mellanslag ur kalenderlänken på miranon.se. Rätt event, rätt datum i sak; formeln (tre normaliseringsklasser: skiftläge, mellanslag runt tankstreck, upprepat årtal) ser '+' som tecken och fäller. Datat rättades i basen (ADR-063, spårbarhetsrad i Notering) — prod-kön gick 5 → 3 (bara Lottas 21/22/23). ÅTERFALLSRISK: '+' kommer ur hur kalenderlänken URL-kodar datumparametern; en ny handskriven länk kan bära samma form, och då VÄGRAR A1-vakten länka (korrekt fail-closed) och Lotta får en kö-rad som appens resolution INTE kan lösa (resolution sätter Event+EventKey, inte Datum-texten — mätt 2026-08-22). TRE YTOR att ändra i samma pass, identisk normalisering: (1) Eventmatchning-formeln i staging (fldYz2NRZJjyX8VWB) och prod (fld40RI3Jf7RaHpTa) — lägg REGEX_REPLACE av '\+' → ' ' i datum-axeln FÖRE whitespace-kollapsen; (2) docs/reference/automation-scripts/a1-eventmatchning-vakt.js normDatum — samma steg; A1 i staging uppdateras via UI (T167: verktygsytan kan inte skriva automationer), prod-A1 via 284.6-mönstret; (3) en ny permanent fixtur 'ZZ-TASK-284.1 Fixtur Plus' i tests/api/fixtures.ts som bär '+'-formen, så T168-lärdomen (verifiera mot den axel ändringen rör, inte mot tomhet som råkar finnas) hålls. Pröva i BÅDA riktningar: Avviker före, OK efter. Lesson-kandidat: ett kontrollsvep som räknar mot ett förväntat tal fångar exakt den post som var bokförd som olokaliserad — räkningen är instrumentet, inte bara grinden.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Datum-axelns normalisering behandlar '+' som mellanslag i Eventmatchning-formeln i BÅDA baserna (staging + prod), verifierat med describe_table att formlerna är strukturellt identiska
- [ ] #2 a1-eventmatchning-vakt.js normDatum bär samma steg; staging-A1 uppdaterad och deployed; sex-fallen ur 284.2 + det nya '+'-fallet körda ände-till-ände i staging
- [ ] #3 Permanent fixtur 'ZZ-TASK-284.1 Fixtur Plus' registrerad i tests/api/fixtures.ts; mätt Avviker före ändringen och OK efter
- [ ] #4 Prod-A1 uppdaterad sist, efter staging-beviset, med Marcus GO (284.6-mönstret)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
