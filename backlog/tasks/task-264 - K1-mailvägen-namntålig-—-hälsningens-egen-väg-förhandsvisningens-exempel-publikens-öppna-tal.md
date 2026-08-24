---
id: TASK-264
title: >-
  K1: mailvägen namntålig — hälsningens egen väg, förhandsvisningens exempel,
  publikens öppna tal
status: Done
assignee: []
created_date: '2026-08-17 10:03'
updated_date: '2026-08-24 13:07'
labels:
  - qa-fix
dependencies: []
ordinal: 480000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur publik-utredningen (docs/research/utskickspublikens-leads-och-namnlosa-2026-08-17.md § Rekommendation; Marcus GO 2026-08-17 'vi kan och bör definitivt köra K1 direkt' — namnen finns inte i basen och kan inte backfillas, appen ska vara ärlig och professionell UTAN dem): 1) visatNamn/hälsningsvägen i utskicksytan tål BÅDA namnlösa formerna ('Ej tillgängligt' OCH tomt/BLANK — 213.4-framtidssäkring): {förnamn} härleds ENDAST ur äkta namn; saknas namn blir hälsningen generisk ('Hej!'), ALDRIG 'Hej Ej,' eller 'Hej (namn,'. 2) Mail-förhandsvisningen väljer exempel-mottagare MED äkta namn; finns ingen → neutral exempelform, aldrig 'som Ej tillgängligt får det'. 3) Publiken visar talet öppet: 'N av M saknar registrerat namn' (dynamiskt) — QA-fyndet hade förklarat sig självt med den raden. Berörda aria-referenser re-genereras öppet med diff-bevis (Marcus beställning = kvittens, samma form som 249.6/259). OBS: samma fil som task-259 — byggs EFTER att 259:s PR landat (sekvenserat av orkestreraren).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hälsningen är generisk vid namnlöst (båda formerna), aldrig härledd ur platshållartext
- [x] #2 Förhandsvisningen exemplifierar med namngiven mottagare eller neutral form
- [x] #3 Publiken visar N-av-M-talet för namnlösa
- [x] #4 Berörda aria-referenser re-genererade med diff-bevis; övriga byte-identiska
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Byggd (Opus), landad och CI-verifierad via merge-kön (259: PR #1534 MERGED 10:58Z · 264: PR #1546 MERGED 12:09Z); Marcus slutkvittens i prod 'Ser bra ut' 2026-08-17. Done-flippad vid S104 session-end.

S112 bokföringspass (2026-08-24): PR #1546 MERGED 2026-08-17T12:09:29Z, CI SUCCESS (gh pr view 1546). Filer = kortfilen + VariantD.tsx + acceptance-test, inga orelaterade. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
