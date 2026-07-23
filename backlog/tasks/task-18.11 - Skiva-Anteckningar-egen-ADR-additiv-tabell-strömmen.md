---
id: TASK-18.11
title: 'Skiva: Anteckningar (egen ADR + additiv tabell + strömmen)'
status: Done
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 12:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Eventets minne: tidsstämplad antecknings-ström med composer överst och nyast först, författare = inloggad användare, härledd Under/Efter-fas ur tidpunkten mot eventets dagar (Innan omärkt per tysta normen) och auto-grow-composer (innehållsstyrd höjd med tak och intern rull, fast treradig reserv där webbläsarstödet saknas). Backend per Marcus-kvitterat vägval 2026-07-21: ADDITIV Anteckningar-tabell i basen (staging först) med läs- och skriv-operation; beslutet mintas som EGEN ADR i skivan (över baren — tabell-form, attribuerings-avvägningen mot record comments) och refereras från PRD-kortet. Täcker användarberättelser: 28-30 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ADR:n mintad; tabellen additiv i staging; läs- och skriv-operationerna kontraktstestade med teardown
- [x] #2 Strömmen, fas-etiketterna och auto-grow bevisade i e2e; renderat mot facit-anteckningarna
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## task-18.11 leverans (agent, branch task/18.11)

### Additiv staging-tabell (ADR-063/050, staging apphjj8Q7lkXCMsL4)
Ny tabell **Anteckningar** (tbl87a23xDv19Mb6R), skapad additivt via MCP 2026-07-23. Fält:
- Författare — singleLineText, PRIMÄR (fldYrr6yZn0PY1klo); satt SERVER-SIDE ur JWT user_metadata.display_name
- Anteckning — multilineText (fldySy08jfMimADIt)
- Event — multipleRecordLinks → Eventplanering (fldSJ5Vjx8QcBOaYR)
- Tidpunkt = Airtables createdTime (inget skrivet fält)
Omvänd länk på Eventplanering: 'Anteckningar' (fld5ExUmcDPtUnUiM). Skrivbarheten LIVE-VERIFIERAD (create+läs+radera) INNAN allowlist-posten låstes (L294). Ny allowlist-operation 'create-event-note' i field-allowlists.ts. (data-model.md-synk deferrad till sessionens end-pass.)

### Deploy-gap (DoD #7 — separat Marcus-auktoriserad handling; agenten saknar deploy-creds)
- STAGING-deploy av EF:erna get-event-notes + create-event-note KRÄVS innan api-conformance-sviterna (tests/api/*-event-note*.staging.test.ts) blir gröna. Tills dess deploy-gatade (404 function-not-found). CI-verifiering efter deploy.
- PROD: tabellen + EF:erna EJ skapade i prod (app8uGPrVCVOm6LfD) — hård prod-deploy-förutsättning (tabell FÖRE EF, per miljö).

### Orkestrator-handoff (utanför kort-yta)
- ROOT README.md rad ~144 ADR-räkningen 74→75 måste bumpas för scripts/check-adr-count.sh (CI-grind). Roten ligger UTANFÖR kortets tillåtna yta (claims-listan pekade docs/decisions/README.md, men check-adr-count läser ROOT README). Räkne-bumpen är dessutom en merge-serialiserings-punkt för parallella ADR-mintande kort → korrekt att orkestratorn sätter den vid merge. docs/decisions/README.md katalog-rad + ADR-075-filen är levererade i kort-ytan.

### TDD-bevis
- e2e (mockad, chromium-authenticated mot port 5188): RÖTT observerat — event-anteckningar-sviten föll 7/7 på 'h1 saknas' (mock-eventet saknade EventSchema-required number-fält → fetchEvent-parse kastade). GRÖNT efter komplett event-shape: 8/8. Andra RÖD→GRÖNT: läs-fel-testet föll (fel-ytan hann inte fram inom 5s — 500 retry-kedja fetchWithRetry×React Query) → timeout 12s → grönt.
- api-conformance: RÖD-fasen ej observerbar lokalt (EF ej deployad) → TDD-AVVIKELSE, deploy-gatad enligt ovan.

---

HISTORIK — HALT-NOTEN FRÅN BATCH-KÖRNINGEN (bevarad per ADR-073 Am 3 mandat (b), union; LÄKT av orkestrator-fixen 1ff5760: ADR-räkning 74→75 · biome-format · MD032 · staging-EF-deploy. Alla fyra åtgärdade, se leverans-noten ovan):

HALT vid steg 5 (PR-CI-vakten). PR #89, CI-run 29977396636 (pull_request). ROD CI: jobb 'Lint + Audit + TypeCheck' => FAILURE pa steget 'Biome check'; jobb 'Docs link check' => FAILURE pa steget 'Check markdown hygiene (markdownlint-cli2)'; 'Detect changed files' + 'Staging sentinel purge' grona, 'Test + Build' var in_progress vid HALT. Deterministisk rot-orsak aven verifierad fore PR: branchen adderar ADR-075 (75 ADR-filer i docs/decisions/) men rot-README.md star kvar pa '74 arkitekturbeslut' och orordes ej pa branchen => scripts/check-adr-count.sh (ci.yml ADR-039-grinden) faller. Ingen merge utford. Fixytor ligger delvis UTANFOR merge-agentens skrivbara yta (rot-README.md ej i claims v2). Branch task/18.11 + PR #89 lamnade STAENDE som atgardsyta.

MERGAD (S75 batch 5, orkestrator-läkt halt + staging-deploy): PR #89 → merge-commit 3962cc9. PR-CI-run 29977902924 GRÖN PER JOBB (6/6: de två jobb som föll [Lint+Audit+TypeCheck biome/ADR-count · Docs link check markdownlint] nu gröna + Test + Build med conformance-sviterna mot deployade EF). AC #1 bockad (conformance NU grön mot deployade EF). GRANSKNINGSFÄRDIG — In Progress, DoD #5 (design-review + ADR-075-granskning) + prod-EF-deploy öppna. **PROD-DEPLOY KVAR (Marcus): create-event-note + get-event-notes till PROD** (staging deployad + ACTIVE v1; .prod-functions-allowlist.conf ej rörd, fail-closed). Done-flippen är Marcus.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-23 09:08
---
Review-våg 2 (2026-07-23): tomläget — FACIT-REVIDERING (svansen '— det du skriver här sparas…' riven; 'Inga anteckningar ännu' och inget mer). PR #91. DoD #5 fortsatt öppen tills omgranskning.
---

created: 2026-07-23 09:40
---
Review-våg 3 (2026-07-23, PR #92): composern K68–K71 reviderad — 'Lägg till anteckning' → 'Spara' + sekundär 'Rensa' (ghost) som visas först vid innehåll (CRM-notes-formen, Marcus punkt 8; ordvalet Rensa på delegerad senior-order); fokus återförs till skrivrutan efter Rensa; TextArea-primitiven fick React-19-ref. DoD #5 fortsatt öppen tills omgranskning.
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Anteckningar (ADR-075 + additiv tabell + strömmen) levererad (PR #89 efter orkestrator-läkt halt, merge-commit 3962cc9; PR-CI 29977902924 GRÖN PER JOBB 6/6 inkl. conformance mot deployade EF). Omgranskad efter fix-våg 2 (tomlägets svans riven) + våg 3 (composern 'Spara' + sekundär 'Rensa' vid innehåll, fokus-återföring, TextArea-primitivens React-19-ref). DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (omgransknings-protokollet Yta 3). DE FEM ÖVRIGA ÖPPNA DoD-POSTERNA STÄNGDA MED BEVIS vid granskningen: #1 båda AC bockade (ADR mintad + tabell additiv + operationerna kontraktstestade med teardown · strömmen/fas-etiketterna/auto-grow e2e-bevisade). #2 grind-klassen täckt av PR-runnets 6/6 gröna jobb (CI kör samma grindar som lokalt, L147-klassen). #4 diffen path-scopad — merge-committens fil-lista verifierad: enbart kort-ytans filer (komponenter, adapters/mutations/schemas, de två EF:erna, config.toml, field-allowlists, api/e2e-tester, ADR-075, primitives-demon), inga orelaterade. #6 FACIT-AVPRICKNING mot skarp staging: composern visar ENBART 'Spara' i tomt läge och 'Rensa' + 'Spara' så snart fältet bär innehåll (våg 3:s CRM-notes-form, mätt via knapp-inventering), tomläget renderar 'Inga anteckningar ännu' utan svans (våg 2:s facit-revidering); strömmen + fas-etiketterna bärs av e2e-beviset eftersom staging saknar anteckningsdata — öppet bokfört, ej påstått browser-verifierat. #7 tabellen + de två EF:erna finns i STAGING (create-event-note + get-event-notes ACTIVE v2, redeployade i STALE-åtgärden 2026-07-23); PROD-tabellen är EJ skapad, så prod-deploy förblir separat Marcus-auktoriserad handling per ADR-050/ADR-063. OBS INFÖR PROD-DEPLOY-VÅGEN: kortets egen not säger att .prod-functions-allowlist.conf lämnades orörd, men allowlistan BÄR create-event-note + get-event-notes (tillagda i kortets egen commit 4093af1) — de är alltså prod-DEKLARERADE. Ordningen tabell FÖRE EF måste därför hållas manuellt i prod-vågen, annars deployas två EF:er mot en tabell som inte finns. Alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
