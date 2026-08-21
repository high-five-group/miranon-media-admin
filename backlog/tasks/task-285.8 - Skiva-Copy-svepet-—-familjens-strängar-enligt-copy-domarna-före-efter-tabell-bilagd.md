---
id: TASK-285.8
title: >-
  Skiva: Copy-svepet — familjens strängar enligt copy-domarna, före/efter-tabell
  bilagd
status: To Do
assignee: []
created_date: '2026-08-21 11:13'
updated_date: '2026-08-21 16:44'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.1
  - TASK-285.2
  - TASK-285.3
  - TASK-285.5
  - TASK-285.6
  - TASK-285.7
parent_task_id: TASK-285
ordinal: 523000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: varje text Lotta möter i notisfamiljen — uppdateringsnotisen, chunk-bannern, offline-beskedet, sektionsfelet, appfel-sidan och de fel-/varnings-/kvitto-rutor sidorna redan visar — säger vad som hände, vad som hände med det hon skrev, och vad hon gör nu. Ingenstans står 'Något gick fel', 'Okänt fel' eller ett 'Försök igen' som inte kan hållas. Rubriker saknar avslutande punkt, brödtexten är en till två korta meningar, knappen heter 'Ladda om' och aldrig 'Uppdatera' (kolliderar med 'uppdatera en anmälan'). Inga långa streck i användarsynlig text.

KONTRAKTET är copy-domarna i research-passet om uppdateringsnotisens form (§ 5 och § 7.3: sex granskade strängar, fyra faller, GOV.UK:s fyra krav för systemfels-klassen) och ADR-121 beslut 7 (copy följer formen — formen är nu låst). Svepet görs med grep över all användarsynlig text i källkoden efter 'Något gick fel', 'Okänt fel', 'Försök igen', 'gick fel' och 'Uppdatera' som knapptext; varje träff klassas (skriv om / behåll med motivering) i en före/efter-tabell som bifogas PR:en — Marcus läser tabellen i stämplings-skivan. Strängar som ändras får sina tester uppdaterade till de exakta nya strängarna i samma commit.

Täcker användarberättelser: 9, 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Före/efter-tabellen i PR:en listar varje träff i svepet med klassning och motivering; ingen träff är oklassad
- [x] #2 Ingen användarsynlig sträng i familjen innehåller 'Något gick fel' eller 'Okänt fel'; varje felsträng bär vad som hände och vad användaren gör, och säger vad som hände med det skrivna där inmatning kan ha funnits
- [x] #3 Rubriker saknar avslutande punkt; brödtexter är högst två meningar; knappen för omladdning heter 'Ladda om' överallt
- [x] #4 Långa-streck-grinden grön; alla ändrade strängar prövas exakt i befintliga eller nya tester
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [x] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->
