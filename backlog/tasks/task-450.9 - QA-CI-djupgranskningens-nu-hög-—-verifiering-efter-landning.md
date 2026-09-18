---
id: TASK-450.9
title: 'QA: CI-djupgranskningens nu-hög — verifiering efter landning'
status: To Do
assignee: []
created_date: '2026-09-18 09:54'
labels:
  - ready-for-human
dependencies:
  - TASK-450.1
  - TASK-450.2
  - TASK-450.3
  - TASK-450.4
  - TASK-450.5
  - TASK-450.6
  - TASK-450.7
  - TASK-450.8
  - TASK-366
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 783000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Manuell testplan, körs när samtliga skivor och TASK-366 (N6) landat. Inget av detta går att bevisa i en PR — det kräver skarpa nätter och skarpa grupplandningar.

1. NATTEN (N2): efter första skarpa natten — gh run view <natt-id> --json jobs, och gh issue list --label ci-natt --state open. Förväntat: bokföringsfynd ligger som kommentarer i ETT stående ärende på den nya etiketten; ci-natt bär bara produktfel. Upprepa efter en vecka: antalet öppna ci-natt-ärenden ska ha fallit från 21 till en handfull. Mät igen efter fyra veckor — producerar ci-natt fortfarande närmast identiska ärenden natt efter natt är en dubblettspärr rätt även där (planens § K2), som eget kort.
2. EFTERKONTROLLEN (N3): på nästa verkliga grupplandning med texttopp över kod — gh run view <post-merge-id> --json jobs ska visa 'Verifierande svit på det mergade trädet' som KÖRD, inte skipped. Notera mutex-trycket: blir revert-vägen märkbart långsammare är T166 vägval 1 nästa steg (eget kort).
3. PARAPLYET (N4): vakten grön i ett skarpt ändringsförslags lint-jobb.
4. VÄNTAN (N6): självtest-jobbet har mer än två minuters marginal till sitt tak i en PR-körning, utan takhöjning; väntan före landning kring 12 minuter i stället för 25. Mät ur gh api .../jobs på tre landningar.
5. DATABASEN (N7): Lotta (eller Marcus) skapar ett event med startdatum 2027 i produktionen utan fel.
6. BEROENDEGRANSKNINGEN (K1 b): en ren textändring landar utan att audit körs; en ändring som rör package-lock.json kör audit blockerande; nattens beroendekanal har fyrat eller stått tyst på rätt grund minst en natt.
7. RUNBOOKEN (N9): Marcus läser rollback-avsnittet och beslutar när övningen körs; övningens utfall skrivs in.
8. BOKFÖRINGEN (N8): npm run review:metrics visar kalibreringsrader; TASK-365 och TASK-239 i rätt tillstånd.
9. GRANSKNINGENS LEVERABLER: bekräfta att de står orörda som daterad ögonblicksbild, och att den stående dokumentationsytan (eget spår) har ett beslut.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
