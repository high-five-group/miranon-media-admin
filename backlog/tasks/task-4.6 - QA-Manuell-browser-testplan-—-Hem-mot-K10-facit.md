---
id: TASK-4.6
title: 'QA: Manuell browser-testplan — Hem mot K10-facit'
status: Done
assignee: []
created_date: '2026-07-07 08:56'
updated_date: '2026-07-18 16:37'
labels:
  - ready-for-human
dependencies:
  - TASK-4.1
  - TASK-4.2
  - TASK-4.3
  - TASK-4.4
  - TASK-4.5
parent_task_id: TASK-4
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus i webbläsaren, dev mot staging). Facit-referens: skärmdumps-bilagorna i sessionsmaterialet (k10-facit desktop + mobil) och vid behov K10-koden via worktree på återupplivnings-commiten.

1. Öppna Hem på desktop och jämför SIDA VID SIDA mot k10-facit-desktop: layout, typografi, färger, luft — ska se EXAKT likadan ut (Marcus-kvittensen S55 Del 12).
2. Samma jämförelse i mobilbredd (~390 px) mot k10-facit-mobil; botten-tabbaren oförändrad.
3. Hälsningen: första besöket i sessionen visar "Hej {namn}" utan utropstecken; navigera bort och tillbaka → bara "{namn}".
4. Klickvägar: hela Nästa event-kortet → eventets sida; en anmälningsrad → eventets sida; en rad med "Utan event" är inte klickbar; "Visa alla anmälningar" → samlade listan.
5. Anmälningslistan: ~25 rader, zebra varannan rad utan linjer, rulla i kortet med hjul och med tangentbord, scrollmarkören centrerad, relativ tid ser rimlig ut.
6. Tangentbord: tabba genom hela Hem — allt nåbart, synlig fokusmarkering, rullningsområdet manövrerbart.
7. Osynligheten: sitt kvar > 60 sekunder — inga blinkningar, hopp eller snurror; ändra ett värde i staging-basen (eller invänta poll) → endast det värdet byts, inget rör sig.
8. Kallstart: hård omladdning visar ett lugnt laddläge EN gång; därefter aldrig synlig hämtning.
9. Versionsraden nere till vänster på desktop matchar appens version; ingen versionsrad på mobil.
10. Systemlägen: förhöjd kontrast, reducerad rörelse och utskrift ser korrekta ut på Hem.

Fynd hanteras som NYA kort med exakt symptom + förväntat beteende — planen retuscheras aldrig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Samtliga 10 punkter genomgångna; fynd registrerade som egna kort eller 0 fynd noterat
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QA-vågen genomförd S67 i preview-formen (byggt staging-bygge på 4173 per runbooken — strängare miljö än planens dev-form; Clear site data-momenten gav skarpa kallstarter) · Marcus-kvittens: 'Nu godkänner jag allt. Jag godkänner alla 3 QA-kort som ligger.' — helhetsgodkännande efter vågen med två fynd åtgärdade inom sessionen · FYND registrerade som egna kort per planens regel (planen orörd): task-4.7 fokusring-klippet i anmälningslistans rullningsyta (registrerad → åtgärdad → CI-grön → Marcus-godkänd 'Mycket bra.' samma session; 3 bevisbilder i bilagor) · Kända-avvikelse-noten tillämpad vid facit-jämförelsen: Hem-platshållaren borta BY DESIGN (S64-beslut 3, task-9.3) — korrekt EJ klassad som fynd · Punkt 8:s kallstartsform bar 8.4:s levererade Lugnt laddläge (samverkan med 8.5-vågen; skeleton-tonen justerad via task-8.6) · Aktualitets-koll före vågen: tabbaren oförändrad sedan S52 (före facitbilderna) — punkt 2 höll utan förbehåll.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
