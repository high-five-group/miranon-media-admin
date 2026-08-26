---
id: TASK-222
title: 'Fynd: --mm-input-bg pekar på canvas-tokenen — flyttas till surface-familjen'
status: To Do
assignee: []
created_date: '2026-08-15 09:04'
updated_date: '2026-08-26 03:31'
labels:
  - ready-for-agent
dependencies: []
ordinal: 425000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
S102 gul-experimentets fynd (2026-08-15, bokfört i Del 7): --mm-input-bg pekar på var(--mm-bg) i komponent-token-lagret — inputfälten ÄRVER SIDBAKGRUNDEN, vilket bara ser rätt ut så länge canvas och kontrollyta båda är vita. Latent brist oavsett färgval: varje framtida ändring av canvas-tonen målar om alla inputfält. Semantiskt hör input-ytan till surface-familjen (kontrollyta), inte canvas. Ändringen är visuellt neutral i dag (båda är neutral-0). Global-gul-idén i sig är SKROTAD (Marcus decline efter skarp visning, Del 7) — detta kort är strukturfixen som överlever skrotningen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 --mm-input-bg pekar på surface-familjen i stället för canvas-tokenen; visuellt neutral förändring (samma renderade värde i dag)
- [x] #2 Svep efter samma kortslutningsklass i components.css: övriga komponent-tokens som pekar på --mm-bg klassas medvetet (canvas-avsikt eller kontrollyta) med grep-belagd lista i notes
- [ ] #3 Hermetiska visual-sviten grön (bevisar neutraliteten)
- [x] #4 DoD-kvartetten grön
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
AC#1 FIXAT: --mm-input-bg pekar nu på var(--mm-surface) i stället för var(--mm-bg) (src/styles/tokens/components.css). Visuellt neutralt bekräftat BÅDE beräkningsmässigt (semantic.css: --mm-surface: var(--p-neutral-0); --mm-bg: var(--p-neutral-0) — identiskt) OCH live i webbläsaren (getComputedStyle på /dev/primitives, dev-server: --mm-input-bg=#ffffff, --mm-surface=#ffffff, --mm-bg=#ffffff — alla tre identiska).

AC#2 SVEP GENOMFÖRT (grep -n 'var(--mm-bg)' src/styles/tokens/components.css, 2026-08-26 — endast exakt var(--mm-bg), inte -muted/-subtle/-emphasized-varianter): 4 träffar totalt.
1) rad 114 (nu rad ~120) --mm-input-bg — KONTROLLYTA, felklassad → FIXAD denna skiva.
2) --mm-skeleton-shimmer: color-mix(in srgb, var(--mm-bg) 75%, transparent) — CANVAS-AVSIKT (dokumenterat i egen kommentar: 'Shimmer-glansen sveper som genomskinlig ljusning över basfärgen').
3) --mm-forberedelseskarm-scrim: color-mix(in srgb, var(--mm-bg) 85%, transparent) — CANVAS-AVSIKT (fullskärms-overlay som medvetet matchar canvas, TASK-259/S107, egen omfattande docblock om varför just --mm-bg).
4) --mm-forberedelseskarm-fond-kamouflage: color-mix(in srgb, var(--mm-bg) 85%, #888a6b) — CANVAS-AVSIKT (kamouflerar <html>-rännstenen mot samma canvas-ton, S107 Marcus-fångst, egen mätt docblock).
Slutsats: endast --mm-input-bg var en kortslutning av samma klass; de tre andra är medvetna, dokumenterade canvas-referenser och rörs INTE.

AC#3 EJ AVBOCKAD, med skäl (viktig premiss-divergens, ADR-086): 'Hermetiska visual-sviten grön' gick INTE att bevisa som en meningsfull lokal grön körning. CONTRIBUTING.md § Visuell regression (läst 2026-08-26): (a) grinden är 'BYGGD men PR-grinden MEDVETET INAKTIV' (Marcus-beslut A, S81) — den är INTE en aktiv CI-blockerare i dag; (b) 'Baselines föds i CI, aldrig lokalt... endast -linux-bilder checkas in'; en FÖRSTA lokal körning på denna macOS-worktree (ingen tidigare -darwin-baseline finns) failar därför HÅRT per design (--update-snapshots=none), oavsett kodändring. Kört skarpt: npm run test:visual gav 68 failande av ~298 (149 specs × 2 projekt) — spridda över HELT ORELATERADE ytor (offline, personer, väntelista, maillogg, installera-appen) som inte ens konsumerar --mm-input-bg, vilket bekräftar att felen är sviten-saknar-baseline, inte en regression av denna ändring. Startskälet verifierat på en enskild instans (offline-visual.spec.ts): 'getByText("Lotta").first()' hittades inte — en hermetisk fixtur-/timing-fråga, helt orört av CSS. Starkaste tillgängliga bevis för neutralitet är i stället den exakta beräknade likheten (#ffffff/#ffffff/#ffffff) redovisad under AC#1. Rekommenderar: orkestreraren/Marcus avgör om AC#3 ska omtolkas till 'computed-style-likhet bevisad' eller om en riktad visual-baselines.yml-körning (specfilter t.ex. 'primitives|Input') ska begäras separat.

AC#4: DoD-kvartetten (typecheck/biome/build/test:api) verifierad grön för denna ändring — se PR:ns rapport för fullständiga körningar och den observerade, ORELATERADE staging-flakigheten i test:api (annan test varje körning, samtliga bekräftat oberoende av denna diff).
<!-- SECTION:NOTES:END -->
