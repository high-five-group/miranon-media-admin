---
id: TASK-286.6
title: >-
  QA: Personregistret — manuell vandring: skriv tecken för tecken, offline, ny
  person, bokstavsraden
status: To Do
assignee: []
created_date: '2026-08-21 11:54'
labels:
  - ready-for-human
dependencies:
  - TASK-286.1
  - TASK-286.2
  - TASK-286.3
  - TASK-286.4
parent_task_id: TASK-286
ordinal: 521000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, mot staging-preview eller prod-kandidat; bokstavsraden ingår om TASK-283.2–283.3 hunnit landa):

1. FÖRSTA BESÖKET. Öppna appen på mobil (390 px), stå på Hem. Peka/fokusera Personer-fliken utan att klicka, vänta två sekunder, klicka. Förväntat: listan visas utan skelett. Ladda om appen, gå direkt till Personer utan att peka först. Förväntat: skelett i slutgeometri EN gång, sedan listan.
2. SKRIV. Skriv 'an' ... 'anna' ... radera till 'an'. Förväntat: listan smalnar och breddas vid varje tecken utan blink, utan skelett, utan fördröjning. Räknarraden följer. Devtools nätverkspanel: inga anrop under skrivandet.
3. PARITET. Sök 'åsa' (träffar), 'asa' (inga, om beslutet 286.5 inte sagt annat), ett telefonnummer med mellanslag, en ort, en e-postdel. Förväntat: samma personer som i dagens prod.
4. SORTERING. Töm sökrutan, bläddra. Förväntat: A–Z, sedan Å, Ä, Ö, sist de namnlösa. Åsa står inte bland A:na.
5. LADDA FLER. Bred sökning ('a'). Förväntat: 50 rader, 'Ladda fler' ger 50 till, annonsering hörs i VoiceOver, fokus hamnar rätt.
6. NY PERSON. Gör en manuell anmälan för en ny person, gå till Personer. Förväntat: personen syns direkt.
7. OFFLINE. Slå av nätet, sök. Förväntat: sökningen fungerar på det laddade registret.
8. DELA. Sök något, kopiera URL:en, öppna i ny flik. Förväntat: samma urval.
9. BOKSTAVSRADEN (om landad). Tryck K, tryck K igen, kombinera med fritext, tryck Ä (nedtonad). Förväntat per TASK-283.2/283.3.
10. SKÄRMLÄSARE. Skriv ett ord, pausa. Förväntat: träffantalet annonseras en gång efter paus, inte per tecken.

Varje avvikelse blir ett NYTT fynd-kort med exakt symptom och förväntat beteende.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Punkt 1–10 genomgångna av Marcus på mobil och desktop; utfall per punkt bokfört i notes
- [ ] #2 Varje avvikelse har ett eget fynd-kort; inga avvikelser lösta ad hoc
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
