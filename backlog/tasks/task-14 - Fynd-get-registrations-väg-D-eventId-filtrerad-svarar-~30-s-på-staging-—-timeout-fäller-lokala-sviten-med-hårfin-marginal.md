---
id: TASK-14
title: >-
  Fynd: get-registrations väg D (eventId-filtrerad) svarar ~30 s på staging —
  timeout-fäller lokala sviten med hårfin marginal
status: Done
assignee: []
created_date: '2026-07-18 17:48'
updated_date: '2026-07-19 07:57'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S67 post-deps-verifieringen, kväll efter en dags intensivt staging-bruk): lokala test:api fäller EXAKT väg D-paret (get-registrations.staging.test.ts rad 89 + 135) på 'Test timeout of 30000ms exceeded' — konsekvent över full svit + riktad omkörning. MÄTDATA (curl mot EF:n med giltig user-JWT, ×3): eventId-FILTRERADE vägen HTTP 200 på 30,9 s · 29,7 s · 30,2 s — OFILTRERADE vägen 1,7 s. Stabilt ~18× långsammare filtrerad gren; Playwright-30s-gränsen fälls med hårfin marginal. INTE en kod-regression: EF:erna ej omdeployade under dagen, test-koden orörd, och main-CI:s Test+Build körde SAMMA fall GRÖNA ~15 min före lokala mätningen (run 29654016580 m.fl.) — fenomenet är tids-/tillståndsberoende på staging-sidan. HYPOTESRYMD (overifierad, prövas vid utförandet): (a) Airtable-throttling efter dagens hamrande [CI-runs ×10 + lokala sviter ×3 + QA] → fetchWithRetry-backoff-kedja i EF:ns filtrerade fler-anropsväg äter ~30 s; (b) data-ackumulering i staging-basens Anmälningar [dagens seed/purge-cykler] gör filterformelns skanning dyr [TASK-2-klassens granne]; (c) Airtable-kostnad för filter på länkat fält. DIAGNOSTIK-RECEPT: JWT ur felloggen/auth-artefakten → curl -w '%{time_total}' mot .../get-registrations?eventId=reci2UQEPBMl3ebNl vs ofiltrerad; mät KALL morgon för transiens-test över dygn. UTFÖRARE: (1) mät igen vid kall staging — sjunkit → transient-klassa + dokumentera i CONTRIBUTING-noten; (2) kvarstår → profilera EF:ns väg D-implementation [antal Airtable-anrop filtrerad vs ofiltrerad] + överväg TASK-2-klassens immunisering; (3) överväg riktad timeout-höjning ENDAST om rotorsaken är legitim Airtable-kostnad [aldrig maskera äkta regression]. Blockerar EJ: CI grön, funktionellt korrekta svar (200 + rätt data — bara långsamt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rotorsaken klassad med mätserie (transient Airtable-tillstånd / data-ackumulering / filtervägens anropsform) — käll-belagd
- [x] #2 Åtgärd eller dokumenterad accept per klassningen; lokala fulla sviten grön eller känd-form-noterad i CONTRIBUTING
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S68 R3 (Marcus-order 'vi kör på dina rekommendationer', arbetssätts-briefingen): prioriterad som NÄSTA SESSIONS INGÅNG — kall-morgon-mätningen per kortets diagnostik-recept kräver ohamrat staging-dygn, därför utförs INGET av kortet i S68. Etikett + priority är klassnings-akten på ordern. Kontext: väg D-latensen är CI-svansens dominant-granne (API-staging 96 s av Test+Build 409 s) — rotorsaksfixen har dubbel utdelning (CI-tid + lokal svit-stabilitet).

S69 kall-morgon-mätningen (09:35 CEST, ~9 h staging-vila; sista staging-beröring 00:15): filtrerad väg D 32,67/31,63/31,92 s · ofiltrerad 1,65/1,55/1,60 s — TRANSIENT-HYPOTESEN (a) FALSIFIERAD, latensen är strukturell. PROFILERING (AC 1 klassad, käll-belagd): (1) staging-secreten REGISTRATIONS_BATCH_SIZE=2 (medveten, chunk-merge-testbarhet; satt S26) ⇒ väg D gör 1+ceil(N/2) SEKVENTIELLA Airtable-anrop (for-await-loop i fetchByRecordIds); (2) N=357 anmälningar på fixtur-eventet reci2UQEPBMl3ebNl (359 totalt i basen) — juli-kohorten 250 rader skapad UNDER stagings isolering (riktiga juli-anmälningar bor i prod) ⇒ test-ackumulering, TASK-2-klassens granne; juni-107 möjligt dupliceringsarv; (3) EF exekverar i anroparens region (x-sb-edge-region: eu-central-1) ⇒ 180 anrop × ~177 ms EU→Airtable-RTT ≈ 32 s — från CI:s US-runner kortare RTT ⇒ under 30s-timeouten. FÖRKLARAR CI-grön/lokal-röd-klyftan deterministiskt. Hypotes (c) filterkostnad: nej (väg D filtrerar inte serverside — record-ID-batch). Timeout-höjning AVFÖRD per kortets eget räcke (rotorsaken är konfig-amplifiering × ackumulering, ej legitim Airtable-kostnad). Åtgärdsvalet (AC 2) eskalerat till Marcus — STOPPA-OCH-FRÅGA i S69: (A) test-immunisering dedikerat litet väg D-event · (B) städning av ackumuleringen + läck-forensik på teardown · kombinationer.

S69 åtgärd (Marcus-beslut B: läck-forensik + städning): FORENSIKEN visade att 'läckan' är ADR-060 punkt 5:s MEDVETNA interim (bounded sentinel-ackumulering tolereras tills purge wiras; e2e mockar create — enda skrivaren är create-registration-conformancen by design). Prejudikat: S52-tröskeln (ADR-060 Updates 2026-07-06). ÅTGÄRDEN följde samma väg: markör-matchad MCP-radering av samtliga 354 create-test-sentineler ur staging-basen apphjj8Q7lkXCMsL4 (bas-identitet trippelverifierad: seed-ankaret hämtat + basnamn + prod saknar sentinel-träffar; seed + 4 icke-sentineler bevarade, efter-verifiering 0 sentinel-träffar). BEVIS: väg D 32,7/31,6/31,9 s → 1,30/1,39/1,31 s (180 anrop → 3); lokala fulla sviten 294/296 → 296/296 (20,1 s) — RÖD→GRÖN. Strukturella benet: TASK-16 fött (purge-wiring per ADR-060 punkt 3–4; ~6 veckors återackumuleringshorisont) + ADR-060 Updates-post. C-delens A-härdning (dedikerat väg D-event) öppet FÖRKASTAD med motiv: både väg D-testets och create-testets event-ankare härleds från seed-posten by design (ADR-060: robustare än hårdkodat event-ID) — en dedikerad-event-design vore omdesign av båda ankarna mot ADR:ns uttalade val; rätt strukturella ben är purge-wiringen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 843fccd · CI-run 29678945234 per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: ej tillämplig (mät-/datastädnings-kort; bevisform = kall-morgon-mätserien [transient falsifierad ×3] + RÖD→GRÖN: väg D 32,7/31,6/31,9 s → 1,30/1,39/1,31 s och lokala fulla sviten 294/296 → 296/296)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
