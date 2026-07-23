---
id: TASK-18.9
title: 'Skiva: Närvaro-registret'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 00:42'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.1
parent_task_id: TASK-18
ordinal: 55000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Genomförda event visar närvaron som register: attendance-shapen utökas till person gånger session (Session-enumen ur basen — Deltaganden är en rad per Anmälan gånger Session) med närvaropoäng-mappning och Total närvaro i procent; rader gånger sessions-bockar i LMS-registerformen; kommande event visar lugnt läge. Ren LÄSNING — närvaro-write hör till check-in-sidan som byggs i eget framtida pass. Täcker användarberättelser: 24 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Attendance-shape-utökningen kontraktstestad (person gånger session + poäng-mappningen)
- [x] #2 Registret renderar per facit för genomfört event och lugnt läge för kommande (renderad verifiering mot facit-tidigare-helsidan)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## task-18.9 — Närvaro-registret (leverans)

**Shape-utökning (AC #1):** Attendance-shapen får `narvaropoang?: number | null` (schema + modell + paritetsfil symmetriskt). `.optional()` (ej required som personNamn) — den deployade staging-EF:en bär fältet först efter den separata EF-deployen (DoD #7); required hade fällt get-attendance.staging-parsen mot den icke-deployade EF:en (additiv-optional-formen). Kontraktstestat i tests/api/attendance-schema.test.ts (6 nya fall: 1/0/null/saknad/icke-numerisk + cell-koordinaten person×session+poäng). Röd→grön observerad (5 tester rött före schemat, grönt efter).

**Bas-fält (LÄST, EJ skapat):** Deltaganden.Närvaropoäng (fldwuo94BY46VUOm4, formel: 1 om Status ∈ {Närvarande, Deltog online}, annars 0). LIVE-verifierat i staging via MCP describe_table (apphjj8Q7lkXCMsL4 / tbldWHH6sSHWoQPHH) — INGET nytt fält skapat, ren additiv LÄSNING. get-attendance läser fältet rått (scalarNumber) så registret räknar EXAKT samma poäng som rollup-kedjan (all kurshistorik räknas uppåt härifrån).

**EF-ändring (staging-first; deploy SEPARAT — DoD #7):** get-attendance/index.ts läser 'Närvaropoäng' (additiv rad i ATTENDANCE_FIELDS + mapAttendance). EF-DEPLOY är separat Marcus-auktoriserad handling — ännu EJ deployad. Registret binder därför narvaropoang MED status-fallback (identisk mängd som basformeln) → korrekt rendering FÖRE och EFTER deploy. TDD-AVVIKELSE: EF-mappningens röd-fas kan inte observeras lokalt (ingen lokal EF-runner; staging-conformance kör mot deployad EF). Bevisas post-deploy av get-attendance.staging + av mockade register-e2e (deploy-gap-testet bevisar fallbacken NU).

**Register-UI (AC #2):** src/components/events/detail/Narvaro.tsx — genomfört event → LMS-register (rader = personer, kolumner = sessioner-med-rader i fast ordning, bock ⟺ poäng, Total närvaro %); kommande event → lugnt läge. Monteras via EventDetail (ersätter interim-länken 'Öppna närvaro-vyn'). GATING: NarvaroRegister (useQuery get-attendance) monteras ENDAST för Genomfört → kommande event anropar ALDRIG EF:en → NOLL e2e-rippel (verifierat: ingen befintlig e2e-svit monterar detaljsidan med Genomfört-status). e2e: tests/e2e/event-narvaro-register.staging.test.ts (8 fall, röd→grön observerad via temporär komponent-brytning, axe 0).

**RIV INGENTING (avvikelse bokförd):** Den STANDALONE /narvaro-routen (src/routes/_authenticated/event/$eventId/narvaro.tsx) + EventAttendance.tsx + tests/e2e/event-narvaro.staging.test.ts BEHÅLLS orörda per FAS-direktivet (AFK-allowlisten saknar rm/git rm). Registret är nu inline på detaljsidan → standalone-vyn är supersederad men EJ riven; rivningen tas separat. Routen är fortsatt nåbar via Atgarder/CheckInKort ('Gå till check-in' → /narvaro), så Link-typningen + event-detail-e2e:ns href-assert (rad 446) består orörda.

**Inga nya direktberoenden** (package.json/lockfilen orörda). --color-success fanns redan (ingen ny token).

**Grindar (lokalt gröna):** typecheck 0 · biome check . exit 0 · build grön · api-pure 208 · api-staging get-attendance 6 · test:a11y 62 · e2e register 8 + event-detail 47 + regression (deltagare/bekräftelse/bor-över/mark-paid/anmälda/add-registration) 44.

## Merge-agent — post-CI-bokföring (granskningsfärdig)

**Status: In Progress — granskningsfärdig, väntar design-review (Marcus) mot S73-facit (DoD #5/#6 + AC-facit-punkterna kvarstår HITL).**

- Merge-commit på main: c1fe336a1ab88fb3d763d14faaed773f98fabe93 (äkta merge-commit, 2 parents — ingen squash; SHA-bevis bevarat).
- PR #87 (feature-commit e806c51). PR-CI run 29968913808 GRÖN per jobb: Lint+Audit+TypeCheck · Detect changed files · Staging sentinel purge · Docs link check · Test+Build · CI Passed. E2E-steget uttryckligt grönt (E2E staging 254 passed; api-pure 208, api-staging 147, a11y 62).
- main-CI run 29969407963 (push, merge-commit c1fe336) GRÖN per jobb: samma 6 jobb success; Test+Build-stegen api-pure/api-staging/E2E-staging/a11y/Build alla success.
- DoD #3 (CI grön per jobb på pushad commit) bockad på denna grund.
- Claims-kvitto (merge-agent, oberoende disk-verifiering): diff 471b7f0..c1fe336 = 9/9 filer inom kortets deklarerade yta (7 M + 2 A, 0 D). RIV INGENTING respekterad — standalone /narvaro-route + EventAttendance.tsx orörda (rivning tas separat, per byggagentens bokförda avvikelse ovan).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [ ] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
