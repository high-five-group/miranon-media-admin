---
id: TASK-218.2
title: 'Skiva: Förberedelseskärmens UI — logotyp, determinate bar, låst text'
status: In Progress
assignee: []
created_date: '2026-08-15 08:47'
updated_date: '2026-08-15 09:41'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-218
ordinal: 416000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: en props-driven helskärmsyta (klara/totalt) med Miranon-logotypen, en determinate förloppsbar som fylls med förloppet, och exakt texten "Förbereder ditt administrationsverktyg" under baren (Marcus-låst ordalydelse, ORDLISTA: Förberedelseskärmen). Byggs och granskas fristående i dev-primitiva ytan innan integration. Täcker användarberättelser: 1, 6, 7 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skärmen renderar logotyp, determinate bar och den exakta låsta texten; helt props-driven utan egen datahämtning
- [x] #2 Förloppet annonseras med progressbar-semantik och polite-besked för skärmläsare; prefers-reduced-motion respekteras; prefers-contrast: more klarad
- [x] #3 Ytan är granskningsbar i dev-primitives-routen i alla förloppslägen (0 %, delvis, full)
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
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
Byggd av bygg-agenten (2026-08-15). Komponent src/components/AppShell/Forberedelseskarm.tsx, props { klara, totalt } helt props-driven. AppShell-placering (inte primitives/) eftersom Förberedelseskärmen är ett låst ORDLISTA-namngivet domänbegrepp med varumärkesinnehåll, samma klass som AppUpdateBanner. Logotyp: public/miranon-media-ordmarke.svg (fullständigt ordmärke) vald framför public/miranon-logo.svg (textlösa märket, PWA-ikonernas källa) eftersom skärmen är ensam och ordmärket ger starkare igenkänning; asseten låg sedan tidigare oanvänd (VariantB.tsx-kommentaren). Progressbar via react-aria-components ProgressBar, aria-labelledby mot den låsta texten, valueLabel satt till X av Y hämtningar klara. Separat role=status aria-live=polite sr-only-rad för annonsering, aldrig alert. KONTRASTFYND under bygget: gold-9 (--mm-primary) 2,57:1 mot vitt dög inte; gold-10 (3,06:1 mot VITT, kryssrutans platta) räckte inte heller mot det faktiska spåret --mm-bg-muted - egna a11y-sviten mätte computed 2,80:1, under golvet. Fixat till gold-11 (normalläge minst 3:1) + gold-12 (contrast-more minst 4,5:1), tokens --mm-forberedelseskarm-bar-* i components.css. Reducerad rörelse: motion-safe:transition-[width], ingen transition-deklaration alls under reduce (diskret stegning). Tester: primitives.spec.ts fick ny sektion-skan (axe 0 violations); ny fil tests/a11y/Forberedelseskarm.spec.ts (6 tester) taeckande AC 1-3, varav contrast-more-testet faellde en gaang paa riktigt under bygget innan fixen. Dev-demo: tre bundna instanser (0%, delvis 2/5, full 5/5) i /dev/primitives; produktion fyller komponenten sin container (h-full/w-full), hoejden saetts av anroparen i TASK-218.3. Avvikelse: inget scope-avsteg; PR #1326 laag i merge queue vid start och invaentades i foergrunden (~3 min) innan kortfilen fanns paa main.
<!-- SECTION:NOTES:END -->
