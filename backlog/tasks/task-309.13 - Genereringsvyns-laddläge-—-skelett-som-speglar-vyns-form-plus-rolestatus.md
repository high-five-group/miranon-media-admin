---
id: TASK-309.13
title: 'Genereringsvyns laddläge — skelett som speglar vyns form, plus role=status'
status: Done
assignee: []
created_date: '2026-08-24 16:35'
updated_date: '2026-08-24 17:10'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 576000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-08-24: 'När jag trycker på chevronen så står det Hämtar underlag…, det ser inte så snyggt ut.'

GenereringsVy.tsx renderade en naken <p class=text-body text-text-muted>Hämtar underlag …</p>. Två fel, varav bara det ena syntes:

FORMEN: syskonytorna i samma spår — PlatserYta.tsx och EventinnehallYta.tsx — kör redan husets skelett-mönster (Skeleton-primitiven, src/components/primitives/Skeleton.tsx, varianter text/number/listRow). Genereringsvyn var avvikaren. En textrad som byts mot fulla gruppkort får dessutom layouten att hoppa vid datalandning; skelettets poäng är att reservera ytan i förväg.

TILLGÄNGLIGHETEN, som ingen såg: <p> bär varken role=status eller aria-live, så en skärmläsare fick ingen avisering alls om att något laddades — vyn var tyst tills innehållet dök upp. Ribban är 11 utan undantag (CLAUDE.md § Kvalitetsribba). Skeleton självt är aria-hidden; sr-only-texten är det som annonseras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Laddläget renderar skelett som speglar vyns faktiska form: rubrikrad + metarad, sedan två gruppkort med KORT_KLASS och tre listRow-rader vardera
- [x] #2 Skelettblocket bär role=status, aria-live=polite och aria-busy=true, med sr-only-texten 'Hämtar underlag …'
- [x] #3 Sidkromets chevron renderas i laddläget precis som i det landade läget (ingen hoppande chevron)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad i `d9d973d5` (PR #1889, merge `24c39777`).

Genereringsvyns laddläge renderade `<p>Hämtar underlag …</p>`. Två fel, varav bara det ena syntes.

**#1 — formen.** Ersatt av skelett som speglar vyns faktiska form: rubrikrad + metarad, sedan två gruppkort med `KORT_KLASS` och tre `listRow`-rader vardera. Syskonytorna i samma spår (`PlatserYta`, `EventinnehallYta`) körde redan husets `Skeleton`-mönster; genereringsvyn var avvikaren. Skelett reserverar dessutom ytan, så layouten inte hoppar vid datalandning.

**#2 — tillgängligheten, som ingen hade sett.** `<p>` bär varken `role="status"` eller `aria-live`, så en skärmläsare fick INGEN avisering om att något laddades — vyn var tyst tills innehållet dök upp. Blocket bär nu `role="status" aria-live="polite" aria-busy="true"` med `sr-only`-texten. `Skeleton` självt är `aria-hidden`, så `sr-only` är det som faktiskt annonseras.

**#3 — chevronen** renderas i laddläget som i det landade läget (samma `SidRamKnapp`), så den inte hoppar när datan kommer.

Marcus grund (granskning 2026-08-24): *"När jag trycker på chevronen så står det Hämtar underlag…, det ser inte så snyggt ut. Förslag?"* Kvalitetsribban för tillgänglighet är 11 utan undantag (`CLAUDE.md` § Kvalitetsribba).
<!-- SECTION:FINAL_SUMMARY:END -->
