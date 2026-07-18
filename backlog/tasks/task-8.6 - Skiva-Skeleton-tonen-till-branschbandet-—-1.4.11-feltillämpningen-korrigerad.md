---
id: TASK-8.6
title: 'Skiva: Skeleton-tonen till branschbandet — 1.4.11-feltillämpningen korrigerad'
status: Done
assignee: []
created_date: '2026-07-18 16:04'
updated_date: '2026-07-18 16:14'
labels: []
dependencies: []
parent_task_id: TASK-8
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QA-FYND (S67, Marcus design-review under 8.5-vågen — L269-klassen: mekaniska grindar gröna, tonen ospecad/fel-specad): skeleton-blocken renderas i #898989 (neutral-400 via --mm-skeleton-block → --mm-border-field-arvet) ≈ 3,5:1 mot vit kortyta — 'vääldigt gråa, ser väldigt b ut'. ROTORSAK: spec §15 + components.css motiverade tonen med WCAG 1.4.11 ≥3:1, men kriteriet undantar dekorativa element uttryckligen (Understanding 1.4.11 'aesthetic purposes'-undantaget) — blocken är aria-hidden-dekorativa, laddinformationen bärs av sr-only + aria-busy (Roselli-anatomin). Fältkants-tokenens 3:1 är RÄTT för fält, fel för platshållare — semantik-lånet var felsteget. BRANSCHBANDET (käll-verifierat S67): MUI alpha(text.primary, 0.11) ≈1,3:1 · Carbon #e5e5e5 ≈1,25:1 (element #bebebe ≈2:1) · shadcn bg-accent ≈1,1:1. FÖRVÄNTAT (Marcus-beslut A i chatten): blocket i neutral-200 #e1e3e1 ≈1,3:1 (branschmitten; ton-identisk med kortens tunna kantlinjer; urskiljbar även mot zebra-radernas neutral-50) · contrast-more BEHÅLLS på text-secondary ≈7:1 (uttalat användarval) · shimmern 45%→75% vit för subtil synlighet på ljus bas · print-konturen orörd · spec §15 Form-punkten omskriven med öppen 1.4.11-korrigering + källor · Skeleton.spec-kontrast-testet vänds till dubbelriktat band-kontrakt (normalläge inom 1,15–2:1, contrast-more ≥4,5:1) — starkare invariant än gamla enkelriktade ≥3:1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Blocket renderar neutral-200 (≈1,3:1 mot kortytan) — computed-verifierat via token-kedjan
- [x] #2 contrast-more-läget orört (text-secondary, ≥4,5:1 asserterat)
- [x] #3 Shimmer-svepet subtilt synligt på nya basen (75 % vit)
- [x] #4 Spec §15 + Skeleton.spec uppdaterade — 1.4.11-korrigeringen öppet bokförd med källor; testet låser nya band-kontraktet dubbelriktat
- [x] #5 Marcus design-review av nytt staging-bygge på 4173 godkänd
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad + Marcus-granskad i samma S67-pass (QA-fyndets hela livscykel inom vågen) · commit 49fbb76 · CI-run 29651370680 grön per jobb (Detect changed files, Lint+Audit+TypeCheck, Test+Build, Docs link check, CI Passed or Skipped — samtliga success) · CI-grön-första-pass: ja · Lokala bevis: typecheck 0 fel · biome 0 fel · a11y 31/31 GRÖN med nya dubbelriktade band-kontraktet (renderat: block == --mm-bg-placeholder == neutral-200, kvot inom 1,15–2:1; contrast-more == text-secondary, ≥4,5:1) — röd-kapabelt by construction (gamla tonen 3,5:1 hade fällt övre gränsen) · Design-review: Marcus omtitt på ombyggt staging-bygge 4173: 'Det blev bättre. Det är OK tillsvidare.' — godkänd tillsvidare; ev. finjustering är nytt kort (B-tonen neutral-300 dokumenterad som närmsta alternativ i chatt-trailen) · Arkitektur: semantik-lånet (skeleton ← border-field) ersatt av ny semantisk roll-token --mm-bg-placeholder — lager-kedjan primitiv→semantisk→komponent hålls (0 primitiv-pekare i components.css bevarat); fältkantens 3:1 orörd (rätt för fält) · Spec §15 Form + ändringslogg + komponent-token-blocket synkade; 1.4.11-korrigeringen öppet bokförd med W3C/MUI/Carbon/shadcn-källor.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
