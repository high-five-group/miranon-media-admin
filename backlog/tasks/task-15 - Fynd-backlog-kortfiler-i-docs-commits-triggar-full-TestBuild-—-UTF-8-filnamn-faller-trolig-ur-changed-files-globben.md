---
id: TASK-15
title: >-
  Fynd: backlog-kortfiler i docs-commits triggar full Test+Build — UTF-8-filnamn
  faller trolig ur changed-files-globben
status: Done
assignee: []
created_date: '2026-07-18 19:27'
updated_date: '2026-07-18 22:17'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EXAKT SYMPTOM (S68 kontrastpar samma kväll): run 29657524469 (commit ebc422c: sessionsdok + todo + backlog-kortfil [å/ä/—/~ i namnet] — noll kod) körde Test+Build FULLT (success, ~7 min inkl. staging-stegen) medan run 29657760975 (commit 6d8c71b: ren docs BUILD-LOG + sessionsdok) skippade Test+Build by design. HYPOTES (OVERIFIERAD, K1.17-klassen tj-actions UTF-8-glob; jfr .githooks/pre-commit-kommentaren om core.quotepath): backlog-filnamnets specialtecken matchas inte av **/*.md-globben i changed-jobbet → only_changed=false → Test+Build kör. KOSTNAD: en onödig full Test+Build (runner-minuter + staging-slitage, TASK-6-grannklassen) per commit som rör kortfiler utan kodändring — träffar VARJE tvåstegs-stängnings-commit. UTFÖRARE: (1) verifiera hypotesen mot changed-jobbets logg i run 29657524469 (only_changed-värdet + vilken fil som föll ur); (2) bekräftad → fixen ligger i ci.yml-changed-steget (glob-/quotepath-hantering) — ALDRIG i backlog-filnamnen (verktyget äger dem, L226); falsifierad → omklassa mot faktisk fillista; (3) fixen verifieras med samma kontrastpar-metod (backlog-rörande docs-commit ska skippa Test+Build). Blockerar EJ: extra-runnen är grön, bara spilld.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hypotesen verifierad eller falsifierad mot changed-jobbets faktiska logg — käll-belagd klassning
- [x] #2 Vid bekräftelse: ci.yml-fix landad + kontrastpar-bevisad (backlog-rörande docs-commit skippar Test+Build); vid falsifiering: dokumenterad omklassning
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S68-stängningen: klassad ready-for-agent på Marcus villkorade order ('Sätt ready for agent om den är det') + Code-bedömning mot substrat-kontraktet: mekanisk verifiering med käll-recept (changed-jobbets logg run 29657524469), tydlig fix-gräns (ci.yml-changed-steget, aldrig backlog-filnamnen [L226]), kontrastpar-bevismetod given, inga design-/produktval, ingen mänsklig grind. Tas lämpligen som andra kort efter TASK-14 (high) i nästa session.

S69 leverans: AC 1 VERIFIERAD käll-belagt — (i) run 29657524469: Test+Build KÖRDE (jobbgrafen) trots noll kod ⇒ should_skip_tests≠true ⇒ only_changed=false; (ii) fil-listan ebc422c = kortfil (å/ä/—/~) + session-68-dok + todo.md, där ASCII-paret bevisat matchar (6d8c71b: samma klass → skip) ⇒ utfallna filen = kortfilen; (iii) mekanismen trippel-belagd: git core.quotepath-oktalform lokalt (strängen slutar på citattecken, inte .md) + K1.17-precedenten (samma action @ samma version, bekräftad 2026-05-14) + jobbloggens input-dump 'quotepath: true' (default). FIX: quotepath:false på BÅDA changed-stegen — upstream-dokumenterad input i action.yml @ pinnade SHA:n 9426d40. Följdfynd: docs_changed-steget hade samma default ⇒ UTF-8-namngiven .md-ändring skulle TYST SKIPPA Docs link check — allvarligare granne, fixad i samma invariant. Riskkoll: fil-list-outputs konsumeras ej (endast only_changed/any_changed-boolerna; safe_output default true) — ingen ny injektion-yta. L279: actionlint via CI:ns exakta install-skript + -ignore-flagga = 0 fel · yamllint 0 fel · SHA-pin orörd · advisories live-kollade historiska. Kontrastpar-beviset (AC 2) tas efter merge: kortfils-only-commit ska skippa Test+Build OCH köra Docs link check.

S69 kontrastbevis-commit: denna commit rör ENDAST denna kortfil (UTF-8-namnet är själva testfallet). Förutsägelse per fixen 378db8c: Test+Build SKIPPAS (only_changed=true) och Docs link check KÖRS (docs_changed=true) — utfallet bokförs käll-belagt i stängnings-commiten. Leverans-runnet 29662884252 grönt per jobb (full svit by design, ci.yml-ändring).

S69 stängning: AC 2 BEVISAD — kontrastbevis-run 29663106983 (commit 7f36257, ENDAST kortfilen med UTF-8-namnet): Test+Build SKIPPED + Docs link check KÖRD grön. Före-bilden på samma fil-klass: 29657524469 + 29658357656 full Test+Build. Båda fixsidorna belagda i samma run: skip-sidan (only_changed=true) + docs-sidan (docs_changed=true → länk-checken körde på kortfils-ändringen).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 378db8c · CI-run 29662884252 per jobb · CI-grön-första-pass: ja · defekter under körning: 0 · TDD: undantag (config-/tooling-kort; bevisform = kontrastpar-experiment run 29663106983 [Test+Build skipped + Docs link check körd] mot före-bilden 29657524469)
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
