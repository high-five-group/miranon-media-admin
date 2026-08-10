---
id: TASK-147.3
title: 'Skiva: Påminnelse, eventinfo och fritt utskick'
status: Done
assignee: []
created_date: '2026-08-10 07:00'
updated_date: '2026-08-10 14:12'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.2
parent_task_id: TASK-147
priority: high
ordinal: 340000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Resterande tre åtgärder på samma sändväg: 'Skicka betalningspåminnelse' (urvalsfilter obetalda — delmängds-påminnelsen som var kortets dyra post), 'Skicka eventinformation' och 'Skicka mail' (fritt). Redigerbar ämnesrad + brödtext följer med per utskick; malltexterna är systemkonstanter (mall-editor uttryckligen senare, PRD § Utanför omfattningen).

Täcker användarberättelser: 4, 5, 6, 19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Alla fyra åtgärdstyperna sänder verkligt via 147.1-vägen; urvalsfiltren biter per typ (obekräftade/obetalda per ATGARDER-definitionen i AtgardsSida.tsx)
- [x] #2 Redigerad text går ut i stället för mallen; platshållare fylls per mottagare
- [x] #3 Ytorna fortsatt identiska med facit tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json (aria-referenserna)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-147.8-DIVERGENS (medvetet bokförd, inte tyst): PrototypRigg och PrototypNots copy lamnas ORORDA i denna skiva. TASK-147.8s Description ager uttryckligen bade rivningen av PrototypRigg och revideringen av PrototypNots copy (se dess Implementation Notes-tillagg). Alla fyra atgardstyper gar nu den verkliga sandvagen (skicka() alltid sendActionEmail.mutate), sa PrototypRigg ar funktionellt INERT for paminnelse/eventinfo/fritt men star kvar monterad i DEV-lage (import.meta.env.DEV, granskning.atgard.nyckel !== 'bekraftelse' orort) - forsta rad i AtgardsSida.tsx docblock uppdaterad for att peka pa detta.

FACIT-GRANSKNING (ADR-102 R3) UTFORD: npm run test:visual (PLAYWRIGHT_VISUAL_DEV_SERVER=1 playwright --project=visual-desktop --project=visual-mobile) mot tests/visual/atgardssida-promoverings-grind.spec.ts = 40/40 gront. git status/diff mot tests/visual/__aria__/atgardssida-promoverings-grind.spec.ts/ = tomt, dvs 0 av 12 aria-yml-filer andrade. Uppdragets '40/40 forvantat' matchar exakt matt testantal i den filen - kallmarkt har som mätt, saknade kalla i uppdraget.

E2E-BEVISFORM (pr-ci-bevisformen, per uppdragets hårda regler): tests/e2e/atgarder-paminnelse-eventinfo-fritt.staging.test.ts kunde INTE koras lokalt - port 5173 (E2E_DEV_PORT) upptagen av Marcus levande npm-run-dev-process (PID 50138, lsof -i :5173 verifierat mot huvudkatalogens cwd). Filen ar verifierad via npm run typecheck + npx biome check (bada gröna) och byggd mot exakt samma monster som atgarder-bekraftelsemail.staging.test.ts (TASK-147.2), men SKARP KORNING ar obevisad lokalt - betalas av PR-CI:ns chromium-authenticated-jobb. En medveten avvikelse fran 147.2:s monster: raden som asserterade 'Prototyp-rigg.' toHaveCount(0) ar INTE kopierad till paminnelse-testet, eftersom PrototypRigg fortfarande monteras (villkoret !== 'bekraftelse' orort) - den skulle ha fallt.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Done S102 batch ⑪: PR #1115, merge 8dc010c2, commit 77d5cdbb. CI grön per jobb på PR:en; facit 40/40 orört; path-scope verifierad av orkestratorn (5 filer). E2e-selektorfix i fix-våg PR #1117 (f5da0a1f), post-merge-run 31393478766 GRÖN.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning mot tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json utförd (ADR-102 R3)
<!-- DOD:END -->
