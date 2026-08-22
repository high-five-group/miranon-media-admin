---
id: TASK-295
title: >-
  Fynd: persons-list.acceptance — kontrasttestet för nedtonad text flakar under
  last, oberoende av PR #1799
status: To Do
assignee: []
created_date: '2026-08-22 15:24'
labels:
  - ready-for-agent
dependencies: []
priority: low
ordinal: 537000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Differentialbevisad flake i personlistans kontrasttest, oberoende av PR #1799.

TESTET: `tests/acceptance/persons-list.acceptance.test.ts` › "nedtonad text klarar kontrastgolvet, prefers-contrast: more" (rad ~1070, loopad över `['no-preference', 'more']`).

DEN BRUSTNA ASSERTIONEN: rad 1141, `expect(nedtonad.text).not.toBe(aktiv.text)` — den nedtonade knappens mätta textfärg är identisk med den aktiva knappens (`rgb(36, 36, 36)`), i stället för att förbli synligt skild.

DIFFERENTIALBEVISET (orkestrerarens egen mätning, 2026-08-22):

| Läge | Utfall |
|---|---|
| Ren main, utan NUL-fixen, full svit | 1 failed — samma test |
| Med NUL-fixen, isolerat --workers=1 | 2 passed |

Slutsats: flaken finns redan på main och är OBEROENDE av PR #1799:s diff. `--workers=1` är den kända gröna vägen. Mönstret pekar mot maskinkontention — testet faller under parallell last, går grönt med en worker.

KÄLLA: TASK-283.3-agentens slutrapport. Samma fällning sågs EN gång i agentens första fulla körning (i samma körning som ett grannt test brände hela sin 60 s-timeout), och kunde INTE reproduceras i två efterföljande körningar. Agenten rotorsakade den inte, och lade i stället en utgångsläges-assertion (rad ~1123-1128, `'fel utgångsläge — mätningen jämför inte nedtonad mot aktiv'`, `toEqual({ nedtonad: 'true', aktiv: 'false', ... })`) som gör felläget explicit i stället för tyst — den assertionen finns redan i testet och är INTE vad som brister.

HYPOTES (uttryckligen ohärledd, inte slutsats): mätningen sker innan `prefers-contrast: more`-omritningen hunnit slå igenom under last — dvs ett timing-/målnings-race mellan `page.emulateMedia({ contrast, reducedMotion: 'reduce' })` och den faktiska style-recalc, som bara yppar sig när maskinen är upptagen av parallella workers.

MÄTVÄG: repot har en flake-rigg, `npm run metrics:flake` (`scripts/flake-matserie.mjs`) — interfolierad A/B, loadavg i rådatan, `--retries=0`, rådata per testresultat. Använd DEN för att karaktärisera flaken, bygg aldrig en egen mätserie. Läs alltid ut n innan ett noll-resultat tolkas (ett fåtal gröna körningar bevisar ingenting om en rat som redan är låg) — och klass B (miljöberoende flakighet, denna klass) är övervägande LOKAL: en lokal serie kan vara fel instrument för en flake som huvudsakligen syns under CI:s egen parallellitet/last.

Riggen har INTE körts som del av denna registrering (uppdraget explicit).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flaken karaktäriserad med riggen (npm run metrics:flake): n och felfrekvens mätt, mekanism-hypotesen (timing-race under prefers-contrast: more-omritning under last) prövad mot rådata eller öppet bokförd som obesvarad
- [ ] #2 Läs alltid ut n innan ett noll-resultat tolkas — klass B (miljöberoende) är övervägande lokal, så en lokal nollserie bedöms mot det
- [ ] #3 --workers=1 bekräftat som grön väg med mätning, eller vederlagt
- [ ] #4 Ingen fix utan belagd orsak; åtgärdsförslag klassas rotorsak/acceptera/maskera med rekommendation — vägvalet är Marcus
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
