---
id: TASK-214.8
title: 'QA: Dörrlistan skarp — manuell vandring'
status: Done
assignee: []
created_date: '2026-08-14 19:22'
updated_date: '2026-08-15 08:21'
labels:
  - ready-for-human
dependencies:
  - TASK-214.1
  - TASK-214.2
  - TASK-214.3
  - TASK-214.4
  - TASK-214.5
  - TASK-214.6
  - TASK-214.7
parent_task_id: TASK-214
ordinal: 409000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan mot staging-fixturens event, i browsern: (1) öppna närvaro-ytan utan parametrar — dörrlistan renderar direkt; (2) sessionsvalet syns (fixturen har två sessioner) och togglar arbetslistan; (3) checka in en person — raden kvitterar grönt med Incheckad-tid, flyttar till klargruppen efter 1,2 s, och Status i basen är Närvarande; (4) ångra inom fönstret — raden står kvar och basen är orörd; (5) bocka ur i klargruppen — Status åter Ej avstämt; (6) sök hittar person i arbetslistan; (7) ladda om sidan — incheckningarna står kvar; (8) Insiktskedjan: incheckad persons Närvaropoäng är 1 i basen; (9) felvägen: bruten nätverksväg ger synligt fel och raden åter i arbetslistan; (10) verifiera i loggen att ingen create-attendance-användning skett oväntat. Fynd blir nya kort — planen retuscheras aldrig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hela testplanen genomförd utan oregistrerad avvikelse — varje fynd har fått eget kort med exakt symptom och förväntat beteende
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
QA-VANDRINGEN UTFÖRD AV ORKESTRERAREN 2026-08-15 på Marcus klartext-mandat (samma delegering som 214.6), i browser mot dev-server :5174 (staging-CORS-tillåten, 5173 bars av parallellsession) mot den RIVNA skarpa ytan (main f40c47ca+), via två temporära aldrig-committade Playwright-pass + bas-verifikat i Airtable MCP. SAMTLIGA TIO PUNKTER BEVISADE: (1) närvaro-routen utan parametrar renderar dörrlistan direkt, rubrik Check-in, ingen rail ✅ (2) sessionstoggeln synlig och togglar (fixturens två dagar) ✅ (3) incheckning: grönt kvitto → flytt → basens Status Närvarande (recu1dxl62HtspXK7) ✅ (4) ångra inom fönstret utan skrivning — bevisad i 214.6-passet med nätverksobservation; mutations-koden orörd av 214.7 (enbart rename, acceptans 5/5 gröna efter) ✅ (5) urbockning i klargruppen: exakt EN skrivning Ej avstämt, raden åter i arbetslistan ✅ (6) sök filtrerar (Cecilia-träff, Bengt borta) ✅ (7) reload-persistens: incheckningen står kvar ur BASEN i färsk browserkontext, två oberoende verifikat ✅ (8) INSIKTSKEDJAN LEVANDE I BASEN: Närvaropoäng 1, Genomförda dagar 1, Fjärrskådning ×1, Erfarenhetsbadge Fjärrskådare — allt automatiskt av incheckningen; efter urbockning åter 0 ✅ (9) felvägen: abortad nätverksväg gav role=alert + raden åter obockad (husets fetchWithRetry gjorde fyra väntade omtag innan felet — bokfört, inte en defekt) ✅ (10) noll create-attendance i loggarna — backup-vägen vilar som den ska ✅. STAGING HELT ÅTERSTÄLLD (Bengt Ej avstämt, Närvaropoäng 0). Bonus-verifikat: Registrerad av = token-ägaren live (F5 väg a, exakt som dokumenterat); carry 11 (Kommande event: 2 på tvådagars) syns live i staging — redan ägd av 213-familjen. INGA NYA FYND — noll nya kort ur vandringen. Temp-filer rivna, dev-servern stängd.
<!-- SECTION:FINAL_SUMMARY:END -->
