---
id: TASK-205
title: >-
  Fynd: post-merge på main röd — layout-invarianten i event-bekraftelse faller
  på dokumenthöjd, orsaken oavgjord
status: To Do
assignee: []
created_date: '2026-08-12 20:48'
labels: []
dependencies: []
priority: high
ordinal: 380000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Post-merge-svepet på main är RÖTT sedan 2026-08-12 kväll. Fällningen är verklig och obesvarad; detta kort registrerar den durabelt så den inte dör med sessionen (ADR-053: blockerar ej, men värdefullt).

FAKTISKT UTFALL (verbatim ur run 31637775613, job-loggen läst 2026-08-12):

  [chromium-authenticated] tests/e2e/event-bekraftelse.staging.test.ts:409
  'Markera-läget — urvalet och utgången mot Åtgärds-sidan (task-48 + TASK-145.3)'
  AC #1: markera-läget förskjuter inte sidans innehåll vertikalt — vilande, aktivt och med urval

  > 437 | expect(Math.abs(aktivt.dok - vilande.dok)).toBeLessThanOrEqual(1);
  > 445 | expect(Math.abs(medUrval.dok - vilande.dok)).toBeLessThanOrEqual(1);
  Error: expect(received).toBeLessThanOrEqual(expected)

Övriga 272 tester passerade. Fällningen skedde i initialkörningen och i BÅDA retries.

TIDSGRÄNSEN, mätt mot GitHub:
- 430a8156 (PR #1231, TASK-201.6) — post-merge run 31637201893 GRÖN
- 8b4832c7 (PR #1229, S103 persondetalj-promovering) — post-merge run 31637775613 RÖD

TVÅ KONKURRERANDE FÖRKLARINGAR, ingen avgjord:

(a) Kodregression i #1229. TALAR EMOT: den PR:ens diff rör enbart persondetalj-ytan (PersonDetail.tsx, PersonDetailPrototyp.tsx, PersonNoteEditor.tsx, routes/personer/$personId.tsx, dess tester, .facit-policy.conf, .mailto-policy.json, visuella aria-snapshots). Ingen global CSS, ingen delad layoutprimitiv, ingenting på event-bekräftelsesidan. Ingen rimlig mekanism är identifierad.

(b) Stagings DATATILLSTÅND. Testet är en staging-e2e som mäter dokumenthöjd, och den höjden beror på hur många rader eventet faktiskt bär. Under samma fönster pågick omfattande samtidig staging-aktivitet: TASK-201.4/201.5/201.6/201.12 kördes mot skarp staging, och TASK-201.12-agenten mätte en Airtable-kontentionsflake i update-event.staging.test.ts i just detta fönster.

VARFÖR 3/3 INTE AVGÖR SAKEN: Playwrights retries kör om samma test i samma session mot samma staging-data. Ett datadrivet fel reproducerar sig därför alla tre gångerna UTAN att vara en kodbugg. Retry-räkningen skiljer alltså inte (a) från (b) — den utesluter bara ren timingflake.

NÄSTA STEG FÖR DEN SOM TAR KORTET:
1. Kör testet isolerat mot nuvarande staging. Grönt => (b) styrks, datatillståndet hade hunnit ändras.
2. Checka ut 430a8156 och kör samma test mot SAMMA staging nu. Rött även där => (a) faller, eftersom koden då är den som var grön i CI.
3. Först om (1) och (2) pekar på koden: bisekta #1229:s diff.
4. Läs test-failed-1.png ur artefakterna om de finns kvar — dokumenthöjdens skillnad kan synas direkt. NOT: TASK-26 bokför att CI inte laddar upp Playwright-artefakter, så de kan mycket väl vara oåtkomliga.

ATTRIBUTIONSVARNING: fyndet rapporterades först till orkestreraren som orsakat av PR #1231 (TASK-201.6). Det var fel — #1231:s egen post-merge var grön. Låt inte den felattributionen leva vidare.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
