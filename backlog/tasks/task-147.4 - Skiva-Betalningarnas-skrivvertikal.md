---
id: TASK-147.4
title: 'Skiva: Betalningarnas skrivvertikal'
status: Done
assignee: []
created_date: '2026-08-10 07:00'
updated_date: '2026-08-10 14:12'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - src/data/mutations/registrationPayments.ts
  - src/components/events/atgarder/AtgardsSida.tsx
  - tests/e2e/atgarder-betalningar.staging.test.ts
parent_task_id: TASK-147
priority: high
ordinal: 341000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Betalningsblocket på åtgärdssidan görs verkligt: avprickning av anmälningsavgift (befintlig operation mark-registration-fee-paid), NY operation för slutbetalning, ångra felaktig avprickning, och betalningsnotering. Två vakter ur PRD:t: basens takt tål inte obegränsad parallellitet vid batch-avprickning, och statusvärdet 'Ej relevant' får aldrig skrivas över av ett urval (föreläsnings-semantiken). Varje ny operation registreras i field-allowlists.ts + deny/allow-test per byggplanens per-sub-fas-krav. Ärver E2E-skulden från TASK-145.3: avprickningens E2E-täckning återupprättas på åtgärdssidan — skarven flyttar hit, skrivs inte om från noll.

Täcker användarberättelser: 15, 16, 17, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Avprickning av båda betalningstyperna + ångra + notering skriver verkligt via adapter-vägen; operationerna i field-allowlists.ts med deny/allow-test grönt
- [x] #2 Taktvakten: batch-avprickning begränsad parallellitet; Ej relevant-vakten: värdet skrivs aldrig över av urval
- [x] #3 Avprickningens E2E-täckning återupprättad på åtgärdssidan (ärvd staging-skarv)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086): två av uppdragets faktapåståenden var stale, verifierat mot källkod/git-historik. (1) 'NY operation för slutbetalning' — FALSK: mark-final-payment-paid registrerades redan i c3d39360 [task-18.8], långt före TASK-147, med deny/allow-test redan grönt i tests/api/update-record.staging.test.ts (rad ~291/~357) — ingen ny operation byggd, ingen dubblett skapad. (2) 'Betalningsblocket görs verkligt' antog skrivandet inte fanns — men BetalningsSkrivYta (AtgardsSida.tsx) skriver redan verkligt via useSetPaymentStatus/useUpdatePaymentNote mot real adapter sedan ytan promoverades till produktionskod (TASK-171.5, Marcus godkännande 2026-08-09, facit.json). Ej relevant-vakten (VAKT 1) var redan kodad (ingen kryssruta renderas för Ej relevant-rader). Vad som FAKTISKT saknades vid granskning: taktvakten (AC#2 andra halvan) och all E2E-täckning för skrivandet på den nya platsen (AC#3/DoD#5).

IMPLEMENTATION: (a) Taktvakten byggd i src/data/mutations/registrationPayments.ts — useSetPaymentStatus fick scope: {id: 'atgardssida-betalningsstatus'} (TanStack Query v5s inbyggda mekanism för seriella mutationer, dokumenterad i docs/framework/react/guides/mutations.md — verifierad direkt i node_modules/@tanstack/query-core/src/mutationCache.ts#canRun, ingen egen semafor uppfanns). Scope är GLOBALT, inte event-scopat, eftersom Airtables 5 req/s-tak (docs/reference/airtable-constraints.md § P4) är bas-brett, delat mellan alla klienter. Ingen ny UI ('markera alla') byggd — det hade varit en form-ändring utanför skivans mandat (facit-lås); taktvakten skyddar i stället EXISTERANDE per-klick-avprickning mot en snabb klick-svit. (b) Ny fil tests/e2e/atgarder-betalningar.staging.test.ts — sju e2e-tester: avprickning avgift, ångra, slutbetalning (mark-final-payment-paid), notering (+ ADR-063-avgränsningen bevisad), fel-väg-rollback, Ej relevant-vakten (0 checkboxes + inget update-record-anrop mekaniskt bevisat) + axe, taktvakten (tre snabba klick, maxSamtidiga()===1 mätt via route-handler-räknare). (c) AtgardsSida.tsx docblock rad ~1171 uppdaterad (kommentar ENDAST, ingen JSX/DOM rörd — inget facit-brott) så den inte längre påstår vakten 'otillämplig'. AVVIKELSE, ÖPPET BOKFÖRD: den nya e2e-filen KÖRDES INTE lokalt (npm run test:e2e:staging) — uppdragets egen regel 4 pekar ut pr-ci-bevisformen för staging-mutex-känsliga grindar under en 14-korts batch; verifiering sker via PR:ens CI-jobb 'Test suite / Staging (API + E2E)'. DoD#2 lämnas därför delvis: typecheck/biome/build/test:api är gröna lokalt (mätt), men e2e-filens egen körning är EJ mätt lokalt — bokfört, inte gissat grönt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Done S102 batch våg 1: PR-kedjan + e2e-klick-fix PR #1105 (merge 88396b49). Post-merge-run 31384608953 (88396b49) GRÖN = det post-merge-gröna staging-bevis Done-flippen väntade på. Lokala grindar gröna per byggarens rapport i leveransen.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Avprickningens E2E-täckning återupprättad (PRD DoD 11-arv)
<!-- DOD:END -->
