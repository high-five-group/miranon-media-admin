---
id: TASK-240
title: >-
  Förberedelseskärmens loadingbar körde inte vid utloggning/inloggning —
  rotorsaka och fixa
status: To Do
assignee: []
created_date: '2026-08-16 09:00'
updated_date: '2026-08-16 10:15'
labels:
  - ready-for-agent
dependencies: []
ordinal: 442000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-16 (skarp yta, logga ut → logga in): Förberedelseskärmen visades men loadingbaren rörde sig INTE alls — sedan släpptes han in abrupt. Förväntat (TASK-218/219, ADR-112): trappan driver baren under startvärmningens 11 EF-anrop. Möjliga spår (HYPOTESER, verifiera mot kod + renderad yta): progress-events inte wirade på ut/inloggnings-vägen (cache tömd? gate-läge?) · varm-start-detektionen delvis fel (skärmen visas men progress-koppling saknas) · warmup klar innan första progress-event når baren. OBS QA-kortet 218.5 (naturlig kallstart m.m.) är fortfarande öppet — denna bugg är sannolikt exakt vad den QA:n skulle fångat. Reproducera FÖRST (logga ut/in mot staging), rotorsaka mot kod, fixa, bevisa på renderad yta i båda riktningar (bar rör sig vid kall start · tyst vid varm start per ADR-112-beslutet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Buggen reproducerad och rotorsakad med fil:rad-belägg
- [ ] #2 Fix: baren driver mot faktisk warmup-progress på ut/inloggnings-vägen; varm-start förblir tyst (ADR-112)
- [ ] #3 Bevis på renderad yta i båda riktningar (kall start: bar rör sig steg för steg · varm start: ingen skärm)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DIAGNOS-PASS 2026-08-16 (agent, ingen fix landad — scope-stopp mot task-236:s seam): De tre ursprungshypoteserna FALSIFIERADE med instrumenterad mätning — logout tömmer cachen korrekt (AuthProvider.tsx ~118-138, 9→0), progress-events avfyras korrekt på SPA-relogin (0/7→7/7, _authenticated.tsx ~130-132), baren renderar events korrekt (Forberedelseskarm.tsx ~100-137, aria-valuenow + stegtext). Mekaniken är alltså KORREKT under rena förhållanden — Marcus exakta symptom kunde inte reproduceras deterministiskt.

TVÅ REELLA DEFEKTER FUNNA: (A) persist-throttle-race vid omedelbar reload efter utloggning (queries/persist.ts ~12-16) — gammal cache läses tillbaka, skärmen hoppas HELT över med stale data (matchar INTE Marcus symptom). (B) STRAGGLER-FÖRGIFTNING, reproducerad x2: en in-flight ensureQueryData från tidigare startvärmning landar EFTER logoutens clear() och skriver in sig igen → arCacheVarm() (startvarmningen.ts ~277-279) tror cachen är varm vid nästa mount. Mitigering cancelQueries() före clear() TESTAD OCH OTILLRÄCKLIG (cache 0→3 ändå) — callEdgeFunction (supabase-client.ts ~77-99) tar ingen AbortSignal, så robust fix kräver signal-trädning genom adapter-seamen = task-236-området. EGET SMALT KORT när 236 landat.

TROLIGASTE FÖRKLARINGEN till Marcus exakta symptom (frusen bar → abrupt släpp), OBEKRÄFTAD HYPOTES: BATCH_SIZE=2 över 7 items → sista batchen (activityLog) kör ENSAM; emit() endast vid settle, ingen stall-indikator — ett segt sista anrop fryser baren visuellt tills 9s-timeouten släpper. Händer det igen: ta HAR/trace ur Marcus session direkt.

Skärmdumpar/loggar: sessionens scratchpad task240/ (efemär). Arbetsträd verifierat rent, allt reverterat.
<!-- SECTION:NOTES:END -->
