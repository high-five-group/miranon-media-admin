---
id: TASK-8.6
title: 'Skiva: Skeleton-tonen till branschbandet — 1.4.11-feltillämpningen korrigerad'
status: To Do
assignee: []
created_date: '2026-07-18 16:04'
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
- [ ] #1 Blocket renderar neutral-200 (≈1,3:1 mot kortytan) — computed-verifierat via token-kedjan
- [ ] #2 contrast-more-läget orört (text-secondary, ≥4,5:1 asserterat)
- [ ] #3 Shimmer-svepet subtilt synligt på nya basen (75 % vit)
- [ ] #4 Spec §15 + Skeleton.spec uppdaterade — 1.4.11-korrigeringen öppet bokförd med källor; testet låser nya band-kontraktet dubbelriktat
- [ ] #5 Marcus design-review av nytt staging-bygge på 4173 godkänd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
