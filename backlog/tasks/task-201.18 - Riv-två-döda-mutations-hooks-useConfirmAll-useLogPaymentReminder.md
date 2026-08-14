---
id: TASK-201.18
title: 'Riv: två döda mutations-hooks (useConfirmAll, useLogPaymentReminder)'
status: To Do
assignee: []
created_date: '2026-08-14 19:24'
updated_date: '2026-08-14 19:34'
labels: []
dependencies: []
parent_task_id: TASK-201
ordinal: 401000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-mandat (via orkestreraren, 2026-08-14, S105): RIV `useConfirmAll` (src/data/mutations/registrationConfirmation.ts) och `useLogPaymentReminder` (src/data/mutations/registrationPayments.ts) — TASK-201.13 bokförde noll anropsplatser för båda (konsumenter rivna i TASK-145.3 resp. TASK-145.6), instrumenterade dem ändå för invariantens skull men lämnade rivningen öppen som Marcus-scope-beslut. Rivningen stod som öppet moment i tasks/todo.md rad 28 och TASK-201.13-kortets notes. Omfattning: hook-definitionerna + imports, den exklusiva verb-hjälparen betalningspaminnelseVerb i activityTypes.ts (delade verb/hjälpare rörs ej), motsvarande poster i tests/api/activity-log-luckor-statements.test.ts, samt om-mätning av mutationskatalog-invarianten.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Båda hook-definitionerna + deras unika imports rivna; grep bekräftar noll kvarvarande referenser (utom historik i git-loggen)
- [x] #2 betalningspaminnelseVerb riven ur activityTypes.ts EFTER bekräftat att den saknar andra konsumenter än useLogPaymentReminder; delade verb/hjälpare (BEKRAFTADE_ANMALAN_VERB, registrationObjectId m.fl.) orörda
- [x] #3 tests/api/activity-log-luckor-statements.test.ts beskuren: posterna för de två rivna hooksen borttagna, filens övriga poster (useUpdatePaymentNote/useSendActionTestEmail) intakta och gröna
- [x] #4 Mutationskatalog-invarianten ommätt efter rivning och bokförd i kortet med FAKTISKT tal (förväntat 16/16/0 mot 18/18/0 före); tests/api/mutation-hemvist-vakt.test.ts fortsatt grönt
- [x] #5 Historiknot med rivnings-commitens SHA bokförd i kortets notes
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
BYGGT (egen worktree, agent-ab51c1fcd960f59fd), gren feat/task-201-18-riv-dod-mutations-hooks, byggd ovanpå origin/task-201.15-extrahera-mutation-hooks (PR #1294, öppen/armerad vid start — mission-instruktionen om att bygga ovanpå den följd; main och den grenen var DIVERGERADE vid fetch, normal PR-drift, ej blockerande).

RIVNINGS-COMMIT: 3f2e7f5659d96d30daf14cbeb7a53526775c036b

PREMISS-PASS (ADR-086), tre oberoende verifieringar av "noll anropsplatser" innan rivning:
 1. git archive av origin/task-201.15-extrahera-mutation-hooks + grep repo-brett (exkl. node_modules) — useConfirmAll: enbart definitionsraden + tre kommentarer (Deltagare.tsx, AtgardsSida.tsx, actionEmail.ts). useLogPaymentReminder: enbart definitionsraden + tre kommentarer (Betalningar.tsx, activityTypes.ts, send-action-email.ts/field-allowlists.ts i supabase/functions).
 2. betalningspaminnelseVerb: enda konsumenten var useLogPaymentReminder (registrationPayments.ts:331) — verifierat, ingen annan importerar den.
 3. BEKRAFTADE_ANMALAN_VERB och registrationObjectId (delade av useConfirmAll): verifierat använda av flera LEVANDE hooks (useSendConfirmationFromDetail m.fl.) — INTE rivna.
INGEN DIVERGENS mot uppdragets premisser — allt höll vid egen mätning.

MUTATIONSKATALOGEN — MÄTT FÖRE OCH EFTER (AC #4):
  FÖRE (origin/task-201.15-branchens tipp): exporterade hooks 18 / recordActivity-anropsplatser 18 / filer utan 0.
  EFTER (denna rivning): exporterade hooks 16 / recordActivity-anropsplatser 16 / filer utan 0.
  Kommandon: grep -rn '^export function use|^export const use' src/data/mutations/*.ts | wc -l · grep -rn 'recordActivity({' src/data/mutations/ | wc -l · grep -rLn 'recordActivity' src/data/mutations/*.ts.
  16/16/0 — exakt det förväntade talet.

OMFATTNING UTFÖRD:
 · useConfirmAll + docblock rivna ur registrationConfirmation.ts, ersatta med en kort RIVEN-kommentar som pekar på commit-SHA. Imports (displayName/RegistrationStatus/Registration/BEKRAFTADE_ANMALAN_VERB/registrationObjectId/ACTIVITY_OBJECT_TYPES) alla fortsatt använda av useSendConfirmationFromDetail — inga döda imports kvar.
 · useLogPaymentReminder + docblock rivna ur registrationPayments.ts. PAMINNELSE_FALT-konstanten (exklusivt använd av hooken) riven. Filhuvudets docblock omskriven "tre mutationer" → "två mutationer" + RIVEN-notis. Fälten paminnelseAnmalningsavgiftSkickad/paminnelseSlutbetalningSkickad LÄSES fortfarande på flera ställen (Betalningar.tsx, Deltagare.tsx, AtgardsSida.tsx, AnmalanDetail.tsx, domänmodell/schema) — MEDVETET orörda, det är bara skrivvägen som revs.
 · betalningspaminnelseVerb riven ur activityTypes.ts, ersatt med RIVEN-kommentar. BetalningsSlag-typen och BETALNINGS_ORD delas med betalningsnoteringVerb (LEVANDE) — orörda.
 · tests/api/activity-log-luckor-statements.test.ts: filhuvudet omskrivet (fyra→två mutationer + RIVEN-notis), importerna BEKRAFTADE_ANMALAN_VERB/betalningspaminnelseVerb tagna bort, de två testerna ("påminnelse ..." och "bulk-bekräftelse ...") borttagna, describe-titeln på § 1 omskriven. § 2 INTEGRITETSVAKTEN (useUpdatePaymentNote-beviset) HELT orörd. 9 tester → 7 tester i filen.
 · Sökt brett (tests/, src/) efter fler referenser till de två hooksen/verbet — endast historik-kommentarer kvar i Deltagare.tsx/Betalningar.tsx/AtgardsSida.tsx/actionEmail.ts (pre-existerande, dokumenterar ANDRA historiska händelser som TASK-145.3/145.6 — INTE rörda, utanför scope).
 · docs/research/post-send-tillstandet-bulkutskick-2026-08-08.md nämner useConfirmAll — historiskt forskningsdok, MEDVETET orört (utanför scope, ändrar inte sanningsvärdet av det dokumentet).

GRINDAR (mätta, exitkoder fångade separat, aldrig via pipe):
 · npm run typecheck                    exit 0
 · npx @biomejs/biome check .            exit 0 (endast pre-existerande varningar/infos i orörda filer, 0 fel; biome check på ENDAST de fyra rörda filerna: "Checked 4 files ... No fixes applied", exit 0)
 · npm run build                        exit 0
 · npm run test:api:pure (hela sviten)  exit 0 — 466/466 passed, inkl. 7/7 i activity-log-luckor-statements.test.ts (ner från tidigare 9, som förväntat) och 5/5 i mutation-hemvist-vakt.test.ts (AC #4:s gatekeeper-krav)
 · tests/acceptance/atgarder-betalningsnotering-logg.acceptance.test.ts (berörd, samma fil som useUpdatePaymentNote — den LEVANDE grannen)  exit 0 — 2/2 passed
 · tests/api/confirm-registrations.test.ts (berörd, samma fil-familj som useConfirmAll)  exit 0 — 12/12 passed
 test:api (fullt, med staging-benet) EJ kört lokalt — samma disciplin som TASK-201.13s notes: staging är en delad bas, CI:s jobb.

INGA MAIL SKICKADE, inga hooks utlösta skarpt (de var redan död kod). Inga supabase-kommandon körda. Prod orörd.
<!-- SECTION:NOTES:END -->
