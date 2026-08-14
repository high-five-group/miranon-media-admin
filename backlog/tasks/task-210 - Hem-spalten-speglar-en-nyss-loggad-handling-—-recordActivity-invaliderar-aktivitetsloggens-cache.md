---
id: TASK-210
title: >-
  Hem-spalten speglar en nyss loggad handling — recordActivity invaliderar
  aktivitetsloggens cache
status: Done
assignee: []
created_date: '2026-08-13 19:30'
updated_date: '2026-08-14 18:39'
labels: []
dependencies: []
ordinal: 384000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hem-spalten 'Senaste aktivitet' visade inte en nyss skriven anteckning medan historikvyn gjorde det. useLatestActivity ärver appens globala staleTime (5 min, src/router.ts:13) och refetchOnWindowFocus hjälper inte — den hämtar bara om när datan redan är STALE. Marcus-order 2026-08-13: 'Lös det!'. Fixen: recordActivity invaliderar queryKeys.activityLog.all efter en lyckad loggning. Global staleTime MEDVETET orörd.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hem-spalten 'Senaste aktivitet' visar en nyss loggad handling utan omladdning och utan att vänta ut den globala staleTime
- [x] #2 Invalideringen bor i recordActivity (en plats, alla anropare) och utlöses ENDAST när servern faktiskt tagit emot statementet
- [x] #3 Fire-and-forget-kontraktet är intakt: recordActivity kastar aldrig, blockerar aldrig, och en trasig cache-yta kan inte nå mutationen
- [x] #4 Ingen överinvalidering: en resa till Hem och tillbaka UTAN mutation utlöser noll nya hämtningar; global staleTime är orörd
- [x] #5 Tvasidigt testbevis pa bada nivaerna (enhet + acceptance), och grinden bevisat fallande nar invalideringen tas bort
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTT UTFALL (agent, 2026-08-13).

DESIGN: invalideringen bor i recordActivity (en plats, alla 15 anropare), på PREFIXET queryKeys.activityLog.all — inte latest-nyckeln ensam. queryClient skickas in som OBLIGATORISK DI-parameter (som dataSource); direkt-importerad modul-singleton är det idiom ADR-055 uttryckligen avvisade. Global staleTime MEDVETET orörd.

GRINDAR (exitkoder mätta separat, aldrig genom pipe):
- npm run typecheck: exit 0, 0 fel
- npx @biomejs/biome check .: exit 0 (486 filer)
- npm run build: exit 0
- npm run test:api: exit 1 — MEN api-pure 455/455 gröna. Enda felet är staging-preflighten (TASK-77): CI höll staging (post-merge-körningar 31736391439 och 31736869098), 273 api-staging-tester kunde ej köras. Räcket kringgicks INTE. Mätt två gånger med samma utfall.
- npm run test:acceptance (nytt test): exit 0, 2/2 gröna
- grannsviter (hem-senaste-aktivitet, hem, event-anteckningar, mer-aktivitetshistorik): exit 0, 52/52 gröna

TVÅSIDIGT BEVIS PÅ BÅDA NIVÅERNA — grinden mätt fallande, inte antagen:
- enhet med fixen: 13/13 gröna (exit 0); invalideringsraden borttagen: 2 röda (exit 1)
- acceptance med fixen: 2/2 gröna (exit 0); raden borttagen: 2 röda (exit 1), och de föll på exakt Lottas symptom (nya raden ej synlig)

KOLLISION MED TASK-201.13, hanterad: rebase drog in fyra NYA recordActivity-anrop (useSendActionTestEmail, useConfirmAll, useUpdatePaymentNote, useLogPaymentReminder) + testfilen activity-log-luckor-statements. Den obligatoriska parametern fällde alla i typkontrollen — precis dess syfte. Fixade i egen commit; useSendActionTestEmail saknade useQueryClient() helt (som useSendReceipt).

LOTTAS UPPLEVELSE: handlingen syns vid nästa gång hem-spalten monteras — ingen väntan, ingen omladdning. Var upp till 5 min.

DOD-VERIFIERING (orkestrerar-agent, ADR-086, 2026-08-14): PR #1264 MERGED 2026-08-13T20:03:29Z, merge-commit 6fe93078568332468045f3a992f1c410f6a31c7d — bekräftat ancestor av origin/main (git merge-base --is-ancestor). Merge-queue-körningen (event merge_group, run 31738012955, gren gh-readonly-queue/main/pr-1264-...) är GRÖN PER JOBB: Lint+Audit+TypeCheck success, Docs link check success, Acceptance (hermetisk) success, Webblasarbeteende success, Pure+Build success, A11y/Staging(API+E2E)/Staging sentinel purge skipped (förväntat), gate 'CI Passed or Skipped' success. DoD #4: gh pr diff 1264 --name-only — sjutton filer, samtliga inom scope (backlog-kortet, recordActivity.ts, samtliga 11 mutationsfiler som anropar den obligatoriska queryClient-parametern, useActivityLog.ts, queries/keys.ts, tre testfiler). Noll orelaterade filer — bredden är designens avsikt (en plats, alla 15 anropare). DoD #2 vilar på kortets egna mätta grindutfall (typecheck/biome/build/test:acceptance/enhetstester, alla exit 0, se ovan; test:api:s enda röda var staging-preflighten, ej ett kodfel, mätt två gånger med samma utfall).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hem-spaltens Senaste aktivitet speglade inte en nyss loggad handling förrän den globala staleTime (5 min) gick ut. Fix: recordActivity invaliderar queryKeys.activityLog.all-prefixet efter en lyckad loggning, med queryClient som OBLIGATORISK DI-parameter till alla 15 anropare (direkt-importerad singleton avvisad, ADR-055) — den obligatoriska parametern fällde TASK-201.13s fyra nya anrop mekaniskt vid rebase, exakt sitt syfte. Global staleTime medvetet orörd; fire-and-forget-kontraktet intakt. Tvåsidigt bevis på båda nivåerna (enhet 13/13 → 2 röda utan fixen; acceptance 2/2 → 2 röda utan fixen, på exakt Lottas symptom). Landat via PR #1264, MERGED 2026-08-13T20:03:29Z. Merge-queue-körningen (run 31738012955) grön per jobb, inga orelaterade filer i diffen.
<!-- SECTION:FINAL_SUMMARY:END -->
