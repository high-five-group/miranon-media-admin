---
id: TASK-210
title: >-
  Hem-spalten speglar en nyss loggad handling — recordActivity invaliderar
  aktivitetsloggens cache
status: To Do
assignee: []
created_date: '2026-08-13 19:30'
updated_date: '2026-08-13 19:42'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
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
<!-- SECTION:NOTES:END -->
