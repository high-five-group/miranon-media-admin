---
id: TASK-70.1
title: 'Skiva: Aktivera merge queue — landnings-ordningen mekaniseras'
status: To Do
assignee: []
created_date: '2026-07-28 16:31'
updated_date: '2026-07-28 18:22'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-70
ordinal: 144000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Landnings-ordningen (CONTRIBUTING.md § Landnings-ordningen, rad 155-212) är korrekt skriven och är frivillig efterlevnad. Den brast två gånger under en och samma resume 2026-07-28, trots att den varit nedskriven sedan S81. Merge queue är den mekaniska motsvarigheten.

### SPÄRREN ÄR BORTA — VERIFIERAT 2026-07-28

Merge queue-passet (docs/research/merge-queue-mot-staging-mutex-2026-07-26.md § Spärren) bokförde repot som marcus803/miranon-media-admin med ägartyp User och drog slutsatsen att merge queue inte gick att aktivera ALLS: GitHub kräver org-ägt repo.

Live-kontroll 2026-07-28 mot gh api repos/high-five-group/miranon-media-admin ger owner.type = Organization och visibility = public. Repot har flyttats sedan passet skrevs. Kombinationen publikt + org-ägt uppfyller gated-features-kravet, och passets lager 1 gäller därmed INTE längre.

Verifiera ägarformen på nytt före arbetet — anta den inte ur detta kort.

### VAD SOM GÄLLER ÄVEN EFTER ATT SPÄRREN FÖLL

Passets lager 2 står kvar och är den svåra delen:

1. merge_group-eventet MÅSTE läggas i ci.yml. GitHub är kategorisk: utan det rapporteras inga checkar i kön och mergen failar. ci.yml lyssnar i dag enbart på pull_request och push (rad 4-8). Enda aktivitetstypen är checks_requested.
2. Required checks är KOPPLADE mellan PR-ytan och kö-ytan — en enda lista gäller båda. Olika svit per yta finns inte som inställning; den åstadkoms med villkorade jobb bakom ett gemensamt check-namn. Vi har redan formen: CI Passed or Skipped (ci.yml rad 691).
3. MUTEX-DUBBLERINGEN är den skarpa risken. Ligger Staging (API + E2E) kvar i PR-grinden kör den på BÅDA ytorna och tar den globala staging-tests-mutexen två gånger per PR. Passets räkning för tre parallella kod-PR:er: 27 min i dag mot 55 min med merge queue och staging på båda ytorna. Bästa fallet — staging villkorad till EN yta — är oförändrat 27 min.
4. Rulesetet tillåter i dag enbart merge som metod (allowed_merge_methods). Regelns merge_method måste stämma med det.
5. Regeln får bara sättas i ett repository-ruleset, aldrig på org-nivå.

### INGA DEPS — MEN ORDNINGEN MOT A7:5 ÄR VÄRD ETT VAL

Kortet har medvetet inga beroenden och kan tas när som helst. Landar det EFTER A7:5 är punkt 3 ovan redan avväpnad, eftersom staging då inte längre finns i PR-grinden att dubblera. Landar det före måste villkoringen lösas här.

### ÄNDRAR BETEENDE

Landningen slutar vara manuell sekvensering och blir en kö. Fellägets form är värd att veta i förväg: saknas merge_group-triggern kan INGEN PR landa — inklusive den PR som fixar felet. Ha vägen tillbaka klar (ta bort regeln ur rulesetet) innan aktiveringen.

VID FÖRSTA SKARPA LANDNINGEN EFTERÅT, OBSERVERA:

- att CI Passed or Skipped faktiskt rapporteras på merge_group-ytan och inte bara på PR-ytan,
- att ingen post fastnar på check_response_timeout_minutes,
- att staging-tests-mutexen inte köar dubbelt — jämför antalet körningar som tar mutexen per landad PR före och efter,
- att CONTRIBUTING.md § Landnings-ordningen uppdateras eller avvecklas: den beskriver då en ordning maskinen äger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ägarformen omverifierad live FÖRE arbetet: owner.type = Organization och visibility = public, utdata ur gh api redovisat i PR:n
- [ ] #2 ci.yml lyssnar på merge_group med aktivitetstyp checks_requested, utöver pull_request och push
- [ ] #3 CI Passed or Skipped rapporteras med samma namn på både PR-ytan och merge_group-ytan — ett run-ID per yta redovisat
- [ ] #4 Merge queue-regeln är satt i repository-rulesetet main-skydd (19627609) med merge_method som stämmer med allowed_merge_methods — verifierat mot gh api efter landning
- [ ] #5 Staging (API + E2E) kör INTE på båda ytorna: antalet körningar som tar concurrency-gruppen staging-tests per landad kod-PR är oförändrat eller lägre, mätt före och efter med båda talen redovisade
- [ ] #6 Tvåsidigt bevis: två PR:er armerade samtidigt landar båda utan att någon går BEHIND, OCH vägen tillbaka är prövad — regeln kan tas bort ur rulesetet varefter landningen fungerar som före
- [ ] #7 CONTRIBUTING.md § Landnings-ordningen uppdaterad eller avvecklad så den inte beskriver en ordning som maskinen numera äger
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
OMKLASSAD 2026-07-28 (S91, tolfte resumen): ready-for-human -> ready-for-agent. Marcus kvitterade förslaget muntligt i elfte resumen; ändringen verkställdes i den tolfte. Etiketten säger "kräver inte Marcus omdöme" — den säger inte "ska spawnas som skiva". Precedent: TASK-64, som bär samma form.

EXEKVERINGSFORM — LÄS FÖRE PLOCK: kortet tas av ORKESTRERAREN under egen hand, aldrig av en spawnad bygg-agent, och Marcus kvitterar FÖRE avfyrning.

De två skäl som motiverade den ursprungliga klassningen står kvar och avgör formen:

1. AC 6 kräver att TVÅ PR:er ligger armerade samtidigt. Armering är inte en bygg-agents befogenhet (CONTRIBUTING.md § Landnings-ordningen: agenten öppnar sin PR och lämnar armeringen ifrån sig, eftersom ordningen bara kan väljas av den som ser hela kön). LÖST av att orkestreraren utför — den ser kön.

2. Fellägets form. Saknas merge_group-triggern kan ingen PR landa, inklusive fixen. STÅR KVAR OFÖRÄNDRAT och adresseras INTE av etikettbytet: vägen tillbaka — ta bort merge queue-regeln ur rulesetet — ska vara prövad och klar FÖRE aktiveringen. Det är ett utförande-villkor, inte ett acceptanskriterium bland andra.

Repots precedens för den ursprungliga klassningen var TASK-36.7 (ready-for-human när utförandet kräver omdöme eller befogenhet agenten strukturellt saknar). Den precedensen gäller fortfarande för spawnade agenter — den gäller inte orkestreraren.

ORDNINGSNOT (oförändrad): kortet har inga deps och kan tas när som helst, men landar det EFTER A7:5 är mutex-dubbleringen redan avväpnad. Landar det före måste villkoringen lösas här.
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
