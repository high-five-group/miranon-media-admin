---
id: TASK-22
title: >-
  Fynd: Tailwind v4 skannar docs/**.md — klass-formade literaler i markdown
  emitteras i produktions-CSS
status: In Progress
assignee: []
created_date: '2026-07-21 23:25'
updated_date: '2026-08-26 04:51'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Proveniens: S75-batch v2.1, bygg-agenten task-17.3.

Symptom: spec-kodexempel i klass-form (t.ex. bg-(--mm-kurs-…)) i docs/ emitterades som skräp-utility i dist/assets/*.css; 17.3 läkte sin instans via omformulering men klassen är latent repo-bred (alla docs med klass-exempel).

Förväntat: dokumentation påverkar aldrig produktions-bundeln — kandidat: explicit @source-styrning i src/styles/tailwind.css så skanningen begränsas till src/.
<!-- SECTION:DESCRIPTION:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
S112 fix-våg 4 bunt D: fixat i src/styles/tailwind.css. Premiss-pass (2026-08-26): bekräftat live i dist/assets/*.css FÖRE fix — .bg-[#D4960A]{...} (ADR-002:s exempeltext), .bg-[#…]{...} (bokstavlig ellips ur docs/design/farg-atlas.html, ogiltigt CSS-värde), .text-[Npx]{...} (docs-placeholder) samtliga emitterade i produktions-bundeln. Rotorsak: @tailwindcss/vite v4:s automatiska källdetektion skannar hela projektroten (allt icke-.gitignore:at), inte bara src/. Fix: @import "tailwindcss" source(none); + explicit @source för index.html + src/**/*.ts + src/**/*.tsx (Tailwind CSS-dokumentationen, tailwindcss.com/docs/detecting-classes-in-source-files § Disabling automatic detection, verifierat via context7 mot tailwindcss 4.3.3 källkod). Före/efter-mätning (git stash-jämförelse, samma build): 769→705 unika klass-selektorer (-64), 84955→79803 byte CSS (-6,1%), 0 klasser TILLKOMNA. Samtliga 64 borttagna klasser verifierat FRÅNVARANDE som exakt träff i src/ (grep -E, ordgräns) — ingen legitim app-klass rörd; en av de 64 (bar animate-pulse) var ett dubbelfynd: motion-safe:animate-pulse (den FAKTISKT använda varianten, Forberedelseskarm.tsx:382) finns kvar i after-CSS, bara den ORÖRDA basvarianten (accidentellt plockad ur en JSDoc-kommentar på rad 73 i samma fil) försvann. Byggd + verifierad grön: npm run build exit 0, npm run typecheck exit 0, npx @biomejs/biome check . exit 0. Ingen levande AC/DoD på kortet vid start ("No acceptance criteria defined") — inga bockade.

Stangningsbatch 2 (S112 resume 1, 2026-08-26): granskningsfardig-lage (ADR-071 beslut 3) - rör global CSS (src/styles/tailwind.css), ingen visuell CI-grind pa PR:en. Marcus: klick igenom 3-4 vyer i staging/prod-preview; satt sedan status Done. DIVERGENS mot uppdragets tal: uppdragstabellen pastod 69 docs-klasser borttagna - kortets egna, kallbelagda notes (git stash-jamforelse) sager -64 (769->705 unika klass-selektorer). 64 ar den verifierade siffran (aritmetiken stammer: 769-705=64); 69 var fel i uppdraget och propageras inte vidare.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #1987
<!-- SECTION:FINAL_SUMMARY:END -->
