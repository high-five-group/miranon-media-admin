---
id: TASK-269
title: >-
  create-attendance saknas i prod-allowlisten — utelämnandets skäl har upphört
  att gälla
status: To Do
assignee: []
created_date: '2026-08-17 11:51'
updated_date: '2026-08-17 12:02'
labels:
  - ready-for-human
dependencies: []
ordinal: 485000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur fas 4-underlagets prövning (S102 resume 8, 2026-08-17). Underlagets R9 flaggade luckan som 'kräver medvetet beslut — gissa inte'. Forensiken visar att beslutet REDAN är taget, men att dess förutsättning fallit.

TILLSTÅNDET: supabase/functions/create-attendance/ finns, [functions.create-attendance] står i supabase/config.toml rad 87 — men funktionen saknas i .prod-functions-allowlist.conf och deployas därför ALDRIG av den kanoniska vägen (scripts/deploy-prod-functions.sh, fail-closed allowlist).

SKÄLET, verbatim ur config.toml rad 78-86: 'MEDVETET UTELÄMNAD ur .prod-functions-allowlist.conf tills vidare — ingen UI-yta konsumerar den ännu (dörrlistans mutations-koppling är en senare skiva i samma PRD, task-214.2)'.

SKÄLET HÅLLER INTE LÄNGRE. TASK-214.2 (mutations-kopplingen) landade 2026-08-14/15 via PR #1301, merge aca14cff (S103 Del 16). Appen konsumerar nu EF:en skarpt: src/data/adapters/AirtableAdapter.ts:262 anropar postEdgeFunction('create-attendance', ...). Ytterligare konsumenter: src/data/mutations/attendance.ts:13, src/domain/models/Attendance.ts:25/42, src/domain/schemas/Attendance.schema.ts:46, och acceptance-täckning i tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts:23/67.

KONSEKVENS FÖR SLUTANVÄNDAREN: check-in-dörrens BACKUP-väg fungerar inte i prod. Möter Lotta en anmälan utan förskapad Deltaganden-rad ska raden skapas atomärt/idempotent — i stället får hon ett 404 från en EF som inte finns. Check-in är en kärnyta i hennes vardag.

ATT AVGÖRA: lägg till i allowlisten (och deploya), eller behåll utelämnandet på en NY grund som skrivs ut. Oavsett vilket måste config.toml-kommentaren rättas — den bär i dag ett skäl som är falskt.

Detta kort ÄR beslutsunderlaget underlagets R9 efterlyste.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Beslut fattat och skrivet: create-attendance in i allowlisten, ELLER utelämnandet motiverat på ny, sann grund
- [x] #2 config.toml-kommentaren rad 78-86 rättad — det stale skälet ('ingen UI-yta konsumerar den ännu') står inte kvar
- [ ] #3 Vid allowlist-tillägg: funktionen deployad till prod och verifierad ACTIVE, och dörrens backup-väg prövad skarpt mot en anmälan utan Deltaganden-rad
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
MARCUS GO 2026-08-17 ('create-attendance måste ju funka också, eller vadå?'). AC1 + AC2 utförda i samma pass.

AC1 — BESLUT: funktionen läggs till i .prod-functions-allowlist.conf. Deploy-setet går därmed 38 → 39, verifierat med 'bash scripts/deploy-prod-functions.sh --list' (exit 0, 'Deploy-set (39)', create-attendance listad).

AC2 — config.toml-kommentaren rättad. Det stale skälet ('ingen UI-yta konsumerar den ännu') står inte kvar som gällande påstående; det är bevarat i rättelsetexten som historik, med datum för när det föll och varför. Att bara radera det hade dolt att ytan en gång ljög.

AC3 KVARSTÅR och kan inte stängas av mig: funktionen är nu DEPLOYBAR, inte deployad. Prod-deployen är Marcus HITL-handling (fas 4 steg 3). Efter den ska dörrens backup-väg prövas skarpt mot en anmälan utan Deltaganden-rad.

BREDDMÄTNING (hela ytan, inte bara detta fall): jämförde supabase/functions/ mot allowlisten i båda riktningarna. På disk men ej i allowlist före denna ändring: create-attendance + fyra test-* (test-attachments-storage, test-auth, test-invite-completion, test-pdf-generation — samtliga korrekt utanför prod per allowlistens eget huvud). I allowlist men ej på disk: NOLL — deployen kan inte fela på en saknad funktion. create-attendance var alltså den ENDA verkliga luckan; felklassen upprepas inte någon annanstans.
<!-- SECTION:NOTES:END -->
