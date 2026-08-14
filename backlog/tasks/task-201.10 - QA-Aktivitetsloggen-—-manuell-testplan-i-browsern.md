---
id: TASK-201.10
title: 'QA: Aktivitetsloggen — manuell testplan i browsern'
status: Done
assignee: []
created_date: '2026-08-11 20:28'
updated_date: '2026-08-14 19:25'
labels:
  - ready-for-human
dependencies:
  - TASK-201.1
  - TASK-201.2
  - TASK-201.3
  - TASK-201.4
  - TASK-201.5
  - TASK-201.6
  - TASK-201.7
  - TASK-201.8
  - TASK-201.9
parent_task_id: TASK-201
ordinal: 375000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan (Marcus, i browsern — staging först, prod efter 201.9):

1. FACIT-JÄMFÖRELSEN: hem-vyn ≥xl sida vid sida med k10-facit-desktop.png — spalten identisk (position, bottenlinjering mot anmälningskortet, postform, länken). Vid godkänt: stämpla via npm run facit:godkann (ADR-104; ev. undantag per yta) — det bockar 201.7:s facit-DoD.
2. HÄNDELSETÄCKNINGEN: utför en åtgärd av varje typ (betalning, bekräftelse, ny anmälan, boende, varje mail-typ, kvitto, event-ändring, flagga, event- och personanteckning) — varje ger en post med rätt aktör, svensk sammanfattning och tid; antecknings-poster visar ALDRIG innehållet.
3. HISTORIKVYN: tidsgrupperingen (Idag/Igår/datum), post-klick till person respektive event, tomläget (töm filtren mot ett event utan poster).
4. FILTERRADEN: kategori + event + tidsperiod var för sig och i kombination; "inga träffar"-tomläget; tangentbordsväg genom alla kontroller.
5. MOBILVÄGEN: mobil/platta — ingen spalt på hem-vyn; Mer bär posten Aktivitetshistorik; vyn fungerar i 390 px.
6. FLERANVÄNDARE: gör en åtgärd som Roger-kontot — posten syns med Roger som aktör hos Lotta.
7. A11Y-STICKPROV: VoiceOver över spalten (aria-label-namnet läses) och filterraden.
8. DEVTOOLS: en post korrelerar mot EF-loggen via requestId (byggplanens DoD 3–4).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Vid punkt 2 (händelsetäckningen): mail-typerna testas mot fixtur-personer med @example.com-adresser eller testmail-vägen (testSend) — aldrig riktiga mottagare; appen är i skarp drift.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd 2026-08-14 mot MEKANISK browser-vandring (orkestreraren, Playwright mot staging-preview localhost:4173, bygge verifierat staging-host) sedan Marcus descope:at den manuella vandringen (verbatim: "Jag orkar inte göra QA-vandringen i staging-appen ... Jag litar på att att det här skiten funkar nu" — bokfört, ej tyst). Utfall per plan-punkt:
1 FACIT: redan klar via Marcus stämpel 2026-08-13 (facit.json § godkand, mittpunkts-undantaget).
2 HÄNDELSETÄCKNING: anteckning live-testad genom två konton (post med rätt aktör, svensk sammanfattning, relativ tid; fritexten ALDRIG i payload eller render — payload-läst i nätverksfliken). Övriga typer: mekaniskt belagda sedan #1256-passet + per-typ acceptance-sviter; mail-typer utlöstes INTE (mailförbudet).
3 HISTORIKVYN: Idag/Igår-gruppering, post-länkar till event, tomläge + "Rensa filter" — verifierat.
4 FILTERRADEN: alla nio kategorier, event- och tidsfilter enskilt + kombinerat, URL-synk, tomläge, tangentbordsväg (pil=fokus, mellanslag=val per ToggleButtonGroup-semantiken) — verifierat. FYND: event-alternativen oskiljbara vid namndubbletter (33× "Fjärrskådning") → eget fynd-kort + fix i separat landning.
5 MOBIL 390px: spalten display:none, Mer bär Aktivitetshistorik, ingen h-scroll — verifierat.
6 FLERANVÄNDARE: staging-admin-kontots post attribuerades skilt från Lottas (Roger-kontot ej testat; admin utan visningsnamn föll till e-post — noterat).
7 A11Y: complementary-landmärke med aria-namn, korrekta roller på filterkontroller, statusar/live-regions — verifierat strukturellt. VoiceOver-LJUDPROV EJ UTFÖRT (ej mekaniskt möjligt; descope:at av Marcus).
8 DEVTOOLS/requestId: statementet bär requestId i context.extensions, läst i nätverksfliken (01979e47-…) — verifierat.
Prod-beviskedjan för hem-spalten: se task-201.9 § stängningsnoten.
<!-- SECTION:FINAL_SUMMARY:END -->
