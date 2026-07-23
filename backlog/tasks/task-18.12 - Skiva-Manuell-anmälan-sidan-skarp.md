---
id: TASK-18.12
title: 'Skiva: Manuell anmälan-sidan skarp'
status: Done
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 13:55'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.3
parent_task_id: TASK-18
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Lägg till manuell anmälan-raden leder till en skarp sida i FK-formklassen som skapar Anmälan via befintlig operation med Källa Manuell och server-satt event-koppling; validering och bekräftelseläge per facit; prototypens sida ersätts av den skarpa routen. Täcker användarberättelser: 11 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Flödet ände-till-ände mot staging med teardown: anmälan får Källa Manuell och event-länk server-side
- [x] #2 Formen renderar per facit; skarpa routen ersätter prototyp-grenen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
task-18.12 LEVERERAD (branch task/18.12) — skarpa manuell anmälan-sidan (ManuellAnmalanForm) ersätter prototyp-grenens redirect på /event/$eventId/ny-anmalan; create-registration-vertikalen utökad till facit-formens SEX fält.

BAS-/EF-BOKFÖRING (ADR-063/ADR-050):
- INGA nya bas-fält. 'Antal platser' (flduwoTPdI8elSNyD, number) + 'Notering' (fldPMsiRoLWcgUbsv, multilineText) är BEFINTLIGA skrivbara fält i Anmälningar (tbloOcrppVoyrHbrq), LIVE-VERIFIERADE mot STAGING-schemat (base apphjj8Q7lkXCMsL4, describe_table 2026-07-23, L294) innan write-pathen/allowlisten låstes.
- create-registration allowlist kompletterad med 'Notering' ('Antal platser' fanns redan). EF:en skriver nu Antal platser (när angivet) + Notering (när icke-tom), validerar antalPlatser (positivt heltal) + notering (sträng).
- create-registration EF DEPLOYAD TILL STAGING (project-ref pqtshyierkdgwdnxuirz) 2026-07-23 — krävs för att api-conformance-testet ska vara sant grönt.
- ⚠️ PROD-DEPLOY AV create-registration EF ÅTERSTÅR — separat Marcus-auktoriserad handling (görs EJ av agenten). PROD-fälten Antal platser/Notering finns redan (befintliga), så ingen prod-fält-förutsättning; bara EF-koden ska prod-deployas.

GRINDAR (lokalt gröna): typecheck 0 · typecheck:tests 0 · biome 0 · build grön · test:api 376/376 (4 nya create-registration-fall RÖDA före staging-deploy → GRÖNA efter) · e2e event-ny-anmalan 6/6 (axe-0) · modal-regression event-add-registration 6/6 · test:a11y 62/62.

ÖPPET: DoD #5 (Marcus design-review MOT S73-facit i webbläsaren) + DoD #6 (facit-avprickning) — human-review-grinden lämnad öppen. DoD #3 (CI grön) — orkestratorn efter push.

---

HISTORIK — MERGE-HALT-NOTEN FRÅN BATCH-KÖRNINGEN (bevarad per ADR-073 Am 3 mandat (b), union; INGEN äkta CI-fel — Test+Build var bara ej terminal i agentens fönster; PR-CI därefter GRÖN per jobb 6/6, run 29980247435):

MERGE-HALT (steg 5, PR-CI-vakten) — S75-batch: PR #90 skapad, PR-CI run 29980247435 nådde INGET terminalt tillstånd inom merge-agentens fönster (forcerad output-terminering). Jobb-utfall vid avbrott: Detect changed files=success · Lint+Audit+TypeCheck=success · Docs link check=success · Staging sentinel purge=success · Test + Build=IN_PROGRESS (ej terminal) · CI Passed or Skipped=pending. Alla slutförda jobb GRÖNA (4/6) — detta är INTE ett pipeline-fel utan ett ofullständigt-CI-avbrott. Ingen merge utförd; main orörd. Steg 1–4 passerade: färsk main=fork-SHA (branch redan à jour, audit-arv ancestor), merge-tree exit 0 (ren), claims-kvitto 10/10 filer inom yta. Branch task/18.12 + PR #90 KVAR som åtgärdsyta för ren re-pick (CI körs då färskt om). Stale-vakt-fil (run 29977396636) fångad och kasserad före felaktig HALT.

MERGAD (S75 batch 6): PR #90 → merge-commit 8f9e4bb. PR-CI-run (branch-head fce9f07) GRÖN PER JOBB 6/6. 'Halten' var INGET fel — Test+Build var bara ej terminal i merge-agentens fönster; efterföljande vakt bekräftade grönt. Bygg-agenten deployade create-registration till STAGING själv (ACTIVE). GRANSKNINGSFÄRDIG — In Progress, DoD #5 (design-review + facit-inkonsistens-frågorna) öppna. **PROD-DEPLOY KVAR (Marcus): create-registration till PROD** (staging deployad; prod-fälten Antal platser + Notering är BEFINTLIGA så ingen prod-fält-förutsättning). Done-flippen är Marcus.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Manuell anmälan-sidan skarp levererad i S75-batchen (CI grön per jobb); create-registration-vertikalen med Källa=Manuell och server-satt event-koppling, idempotens per sid-öppning, pessimistisk UI med 409-vägen inline. DESIGN-REVIEW GODKÄND av Marcus 2026-07-23 (omgransknings-protokollet Yta 4, kvittens 'Jag kvitterar yta 4'). [FRÅGA] AVGJORD PÅ DELEGERAD SENIOR-ORDER och ÅTGÄRDAD I REVIEW-VÅG 7 (PR #96, merge-commit 147f3f4; tvåcommit-form, lokalt rött 4/6 → grönt 6/6 inkl. axe 0) — TVÅ DELAR: (1) BEKRÄFTELSE-COPYN kopplad till beläggnings-modellen: 'Anmälan för X är skapad med källan Manuell' → 'X är anmäld och har N plats(er) reserverad(e). Anmälan är obekräftad tills du skickar bekräftelsen från eventsidan.' Platsantalet ur svaret (serverns sanning) med numerus-hantering; ORDLISTA-orden Reserverad plats + Obekräftad bär texten; fält-jargongen Källa utgår (den syns som pillen 'Manuellt tillagd' i arbetskön). (2) MÄRKNINGEN till K84: '(obligatorisk)' bort från de tre obligatoriska, '(valfritt)' på Mobilnummer + Notering, isRequired kvar så skärmläsaren annonserar required. Familjen bar två konventioner (CreateEventForm följde K84, denna sida gjorde tvärtom) — nu en. KONFLIKT MOT GOVERNING SPEC UPPTÄCKT OCH LÖST: ACCESSIBILITY-CHECKLIST.md § Formulär föreskrev '(obligatorisk)'-märkning; STOPPA-fråga ställd, Marcus-beslut A (förena) → PR #97 (merge-commit 755632e) rev raden öppet och ersatte den med den tvådelade regeln (programmatiskt alltid + visuellt på undantagen, naken asterisk förbjuden; GOV.UK-mönstret namngivet), plus följdarbete i Input-primitivens docstring och /dev/primitives-demon. Alla AC + DoD gröna.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
