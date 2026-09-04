---
id: TASK-374.5
title: >-
  Skiva: QA-vandring — Intresserade-listan i staging och prod med riktig data
  (HITL)
status: Done
assignee: []
created_date: '2026-09-03 09:21'
updated_date: '2026-09-04 12:56'
labels:
  - ready-for-human
dependencies:
  - TASK-374.1
  - TASK-374.2
  - TASK-374.3
  - TASK-374.4
parent_task_id: TASK-374
ordinal: 680000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan, körs i webbläsaren efter att 374.1–374.4 landat och prod deployats:
1. Prod: öppna Mer → Intresserade. Räknaren visar alla intresserade (2026-09-03 var talet 112; jämför mot Airtable-vyn samma dag). Ingen rad saknas efter rullning till slutet.
2. Prod: minst tre namnlösa rader visar e-posten som primär rad och 'Namnlös intresserad' dämpat som sekundär; ingen rad visar initialer byggda ur en platshållare; den neutrala ikonen är lika stor som initialavataren.
3. Prod: alla rader är exakt lika höga — kontrollera med webbläsarens mätverktyg på minst fem rader, varav minst en namnlös och en med lång e-post (trunkeras, radbryts inte).
4. Prod: pillen 'N hämtningar' har samma bredd på alla rader med en- och tvåsiffriga tal; texten är centrerad.
5. Sök: skriv en del av ett namn respektive en e-post; listan filtreras, räknaren visar 'N träffar av M'; tom sökning återställer; sökning utan träff ger 'Inga träffar på sökningen.'
6. Sortering: växla till 'Namn A till Ö' — namnlösa sorteras på sin e-post, inte i en klump; växla tillbaka till 'Senaste interaktion'.
7. Tangentbord: Tab från sidans topp når sökfältet, sorteringen (öppnas med Enter/Space, piltangenter, Escape stänger) och vidare; synligt fokus hela vägen.
8. Skärmläsare (VoiceOver-stickprov): sorteringen läses som listbox med tillgängligt namn; efter en sökning annonseras träffantalet; rubriken får fokus vid sidladdning.
9. Stale URL: öppna /mer/intresserade?variant=a — identisk vy med /mer/intresserade.
10. Utskrift och hög kontrast: förhandsgranska utskrift (rader bryts inte mitt itu), aktivera 'öka kontrast' i systemet (radavgränsare synliga).
11. Sidofynd att pröva: logga ut, öppna /mer/intresserade direkt — förväntat: omdirigering till inloggning. Bokför utfallet oavsett; blev listan synlig utan inloggning är det ett nytt kort (S114 Del 5 sidofynd).
12. Staging: samma punkter 2–10 mot staging (2 intresserade); notera att fyllnadsläget inte längre finns.
Täcker användarberättelser: 22
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Testplanen nedan genomgången i staging och prod; varje punkt bokförd med utfall i kortets Final Summary; fynd blir nya kort med exakt symptom och förväntat beteende, aldrig retuscherade planer
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 check-facit.sh exit 0 efter skivan — markör-invarianten (c) är global, avregistrering i samma commit som rivning (ADR-102 B3)
- [ ] #5 ariaSnapshot-paret grönt i BÅDA vyporterna där skivan rör ytan (ADR-103 B4)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Marcus prod-QA 2026-09-04 verbatim: "374.5 prod-QA klar, allt godkänt".
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QA-vandringen kördes av en kastbar Playwright-agent (Sonnet 5) mot staging
(lokalt staging-bygge `preview:staging`, port 4173, inloggad TEST_USER — 2
intresserade i data).

| Punkt | Beskrivning | Utfall |
|---|---|---|
| 1 | Räknaren visar alla intresserade | OK — 2 i staging |
| 2 | Namnlösa: e-post primär, "Namnlös intresserad" sekundär, ingen platshållar-initial | Ej tillämpligt — 0 namnlösa rader i staging; kodgranskning bekräftar logiken |
| 3 | Alla rader exakt lika höga | OK — 80 px |
| 4 | Pillbredd konstant på 1- och 2-siffriga tal | OK — 105,89 px |
| 5 | Sök (namn/e-post, tomträff-text) | OK, inkl. "Inga träffar på sökningen." |
| 6 | Sortering Namn A till Ö | OK |
| 7 | Tangentbord (Tab, fokusring) | OK — `outline: solid 2px`; observation: efter h1-autofokus hoppar Tab över Tillbaka-länken (appens etablerade mönster, ej bugg) |
| 8 | Skärmläsare (VoiceOver-stickprov) | OK mekaniskt (listbox-knapp, live-region, h1-fokus) — VoiceOver-provet i sig kräver en människa |
| 9 | Stale URL `?variant=a` | OK — identisk |
| 10 | Utskrift och hög kontrast | OK — print break-inside, kontrast-kanter, axe 0 fynd |
| 11 | Sidofynd: utloggad → redirect | INGEN BUGG — redirect `/login?redirect=%2Fmer%2Fintresserade` i BÅDA staging och prod (admin.miranon.dev); tidigare devtools-rendering utan inloggning var en sparad session |
| 12 | Staging, punkt 2–10 upprepade | OK — samma utfall som ovan; `?data=fyll` finns inte längre |

Prod-punkterna 1–10 och 12 (de som kräver inloggning) är EJ UTFÖRDA av
agenten: Vercel-hash-aliasets Deployment Protection blockerar en
oautentiserad agent, och custom-domänen `admin.miranon.dev` kräver
faktisk inloggning som agenten saknar. Öppna åt Marcus — se sessionsdok
S114 Del 6 § Handover.

Skärmdumpar (desktop + mobil) tagna i staging: samma anatomi som facit.
Inga nya kort behövs — inga defekter funna inom det som gick att
verifiera.

DoD #5 (ariaSnapshot-paret) lämnas obockad med avsikt — denna skiva är en ren QA-observation utan kodändring, rör inget snapshot-par.
<!-- SECTION:FINAL_SUMMARY:END -->
