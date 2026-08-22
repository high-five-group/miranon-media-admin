---
id: TASK-300
title: >-
  Fynd: baslinje-PR #1811 drev pixel-drift på tre ytor (eventsida,
  event-anmalda, mer-anmalningar) — landad orörd, orsak oprövad
status: To Do
assignee: []
created_date: '2026-08-22 19:10'
updated_date: '2026-08-22 19:15'
labels:
  - ready-for-agent
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/1811'
  - >-
    https://github.com/high-five-group/miranon-media-admin/actions/runs/32591327919
priority: medium
ordinal: 541000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTNING (2026-08-22, källa: `gh pr view 1811`, `gh run view 32591327919 --log`, egen `git diff --stat`/`git rev-parse` mot lokal worktree). Baslinje-PR #1811 (`visual-baselines/run-32591327919`, https://github.com/high-five-group/miranon-media-admin/pull/1811, dispatch-run https://github.com/high-five-group/miranon-media-admin/actions/runs/32591327919) uppdaterade **16** linux-skärmdumpar — inte 18. Talet är bekräftat av TRE oberoende källor: PR-titeln ("test(visual): baseline-uppdatering ur CI (16 bilder)"), CI-jobbets egen loggrad i "Generera linux-baselines + öppna baseline-PR" ("16 files changed, 0 insertions(+), 0 deletions(-)" / "Baseline-PR öppnad (16 bilder)"), och `gh pr view 1811 --json changedFiles` = 16. Uppdraget till detta korts skapare angav 18 — en felaktig premiss, rättad här (ADR-086).

Baslinje-SHA:er för reproduktion: `main` vid dispatch/PR-bas = `d749874747b18e192e68cb2e39facca79ca9b6a0`. PR-huvud (bilderna som ska granskas) = `25c8bbfb9937ca79650f0d216b54d18a6044a277`. Hämta diffen med `gh pr diff 1811` medan PR:en lever, eller — efter att den landat via merge-kön — via `gh pr view 1811 --json mergeCommit` och jämför den commiten mot `d749874747b18e192e68cb2e39facca79ca9b6a0`.

Av de 16 hör 10 till ytor som faktiskt rördes samma dag av TASK-285.x-familjen (personer, chunk-banner, notis-visual, offline-visual, hem — vardera desktop+mobile) och är väntade, INTE del av detta fynd.

**DE TRE OFÖRKLARADE YTORNA** (ingen skiva rörde dessa sidor idag):

- `tests/visual/__screenshots__/eventsida.spec.ts/eventsida-visual-desktop-linux.png`
- `tests/visual/__screenshots__/eventsida.spec.ts/eventsida-visual-mobile-linux.png`
- `tests/visual/__screenshots__/event-anmalda.spec.ts/event-anmalda-visual-desktop-linux.png`
- `tests/visual/__screenshots__/event-anmalda.spec.ts/event-anmalda-visual-mobile-linux.png`
- `tests/visual/__screenshots__/mer-anmalningar.spec.ts/mer-anmalningar-visual-desktop-linux.png`
- `tests/visual/__screenshots__/mer-anmalningar.spec.ts/mer-anmalningar-visual-mobile-linux.png`

Samtliga sex fick nytt blob-innehåll (`git diff --stat d749874747b18e192e68cb2e39facca79ca9b6a0 25c8bbfb9937ca79650f0d216b54d18a6044a277 -- 'tests/visual/__screenshots__/'` visar binärstorlek före/efter för var och en, en ~0,2–0,5 % storleksförskjutning per fil — betydligt mindre än hem/personer som växte 40–60 % samma körning, konsekvent med en subtil pixelförskjutning snarare än en avsedd om-design).

**KONTRAST, utesluter generell rendering-drift** (Chromium-version, typsnitt, plattform): `tests/visual/__screenshots__/event-lista.spec.ts/event-lista-visual-desktop-linux.png` + `-mobile-linux.png` är BYTE-IDENTISKA mellan bas-SHA och PR-huvud — samma blob-hash i båda leden: desktop `49e297bafe50e798c70aa55c6221bcd41e1196ca`, mobile `824dec47c8f0e4a3bc9214e38b5829b21b640e34` (verifierat med `git rev-parse <SHA>:<sökväg>` mot båda SHA:erna ovan, körda separat 2026-08-22). Hade drivningen varit generell hade även event-lista ändrats. Den gjorde inte det — något SPECIFIKT träffar just de tre ytorna ovan, inte renderingsmiljön i stort.

MÄTMETOD, reproducerbar av vem som helst utan specialverktyg:
```
git rev-parse <SHA>:<sökväg-till-png>
```
kört en gång mot `d749874747b18e192e68cb2e39facca79ca9b6a0` och en gång mot `25c8bbfb9937ca79650f0d216b54d18a6044a277` per fil — identisk hash = ingen drift, olika hash = drift. `git diff --stat <bas-SHA> <pr-head-SHA> -- 'tests/visual/__screenshots__/'` ger hela mängden på en gång (binärstorlek-delta per fil, inga pixlar).

**HYPOTES — MÄRKT SOM HYPOTES, INTE SLUTSATS:** TASK-285.5 flyttade `ChunkBanner` in i `AppShell` som FÖRSTA barn i `<main>`, alltså närvarande i DOM:et på varje autentiserad sida (källa: task-285.5-kortets Beskrivning, "chunk-grenen flyttar från den globala roten in i det inloggade skalet som första barn i innehållsytan (main), så den ärver innehållets bredd och hamnar omedelbart före varje sidas h1"). Komponenten ska rendera `null` i viloläge, och 285.5-agenten mätte att h1-invarianten höll (`scroll-lock.spec.ts` 4/4) — men pixlar är en KÄNSLIGARE mätning än DOM-ordning: en tom eller null-renderad nod kan ändå flytta layout enstaka pixlar (marginal-collapse, en tom flex/grid-cell, etc.) utan att DOM-strukturens invariant bryts.

**Detta är OMÄTT.** Ingen har kört visual-sviten mot en SHA före respektive efter TASK-285.5 för att isolera effekten. Oprövade alternativ som INTE är uteslutna och inte ska antas bort:

- TASK-285.8:s copy-svep (31 filer — kan råka träffa strängar som renderas på dessa tre sidor, t.ex. delad navigation/header-copy)
- Design-token-ändringar som landat i samma S109-våg (semantic.css/components.css)
- Playwright/Chromium-versionsdrift mellan run 32591327919 och den föregående baseline-körningen (miljödrift, inte kodändring)

Ingen av dessa tre är utesluten. ChunkBanner-hypotesen är den mest sannolika given att den är den enda ändringen som medvetet rör varje sidas DOM-topp, men "mest sannolik" är inte "bevisad".

**MARCUS BESLUT:** fyndet lades fram för Marcus med rekommendationen att mäta eller granska visuellt före merge. Marcus svarade "merga bara" (2026-08-22), och PR #1811 armerades. Beslutet var INFORMERAT — invändningen restes och avvisades explicit, inte ett förbiseende.

**KONSEKVENS, varför detta kort finns:** är driften oavsiktlig är den nu på väg att cementeras som facit (PR #1811 stod `isInMergeQueue: true` vid detta korts skapande — CLEAN, köad, ännu inte landad i `main`, men armeringen är Marcus eget beslut och rullas inte tillbaka av detta kort). Från och med landningen jämförs all framtida rendering av eventsida/event-anmalda/mer-anmalningar mot en baslinje ingen granskat visuellt. Avvikelsen kan därefter aldrig fällas av testet igen — den HAR BLIVIT normen. Fönstret att avgöra "var det rätt att landa" krymper för varje ny commit som byggs ovanpå den nya baslinjen.

Detta kort bär INGEN utredning och INGEN kodändring — bara registrering av fyndet, mätmetoden och det obesvarade läget, för att göra det plockbart senare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Beskriv konkret vad som skiljer varje ändrad bild från sin föregångare på de tre ytorna (pixelregion, layoutförskjutning i px, färgskillnad — inte bara att storleken ändrades)
- [ ] #2 Avgör om skillnaden är AVSIKTLIG (spårbar till en identifierad, namngiven commit/skiva) eller OAVSIKTLIG (ingen ändring i sidans src/-kod förklarar den)
- [ ] #3 Pröva ChunkBanner-hypotesen (TASK-285.5) explicit — checka ut SHA före respektive efter TASK-285.5 landade, kör visual-sviten på de tre ytorna, jämför, och bekräfta eller avfärda hypotesen med belägg
- [ ] #4 Pröva de tre oprövade alternativen (TASK-285.8 copy-svep, design-token-ändringar samma våg, Playwright/Chromium-versionsdrift) — var och en antingen utesluten med belägg eller identifierad som (del av) orsaken
- [ ] #5 Om skillnaden bedöms oavsiktlig: fatta och dokumentera ett beslut om baslinjen ska tas om — och görs den om, kör om via det ordinarie visual-baselines-flödet och länka den nya PR:en här
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
