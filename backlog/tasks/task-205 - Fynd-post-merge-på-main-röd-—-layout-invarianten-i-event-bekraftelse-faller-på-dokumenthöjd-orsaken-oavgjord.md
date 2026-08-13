---
id: TASK-205
title: >-
  Fynd: post-merge på main röd — layout-invarianten i event-bekraftelse faller
  på dokumenthöjd, orsaken oavgjord
status: To Do
assignee: []
created_date: '2026-08-12 20:48'
updated_date: '2026-08-13 14:27'
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
KORROBORERANDE BELÄGG, tillagt 2026-08-12 sent (källa: stängningsagentens loggrävning i PR #1238, verifierad mot gh pr diff --name-only):

Post-merge-sviten var röd på FLER merge-SHA:n än 8b4832c7 under samma kväll, och i samtliga fall låg det fällda testet UTANFÖR respektive PR:s diff:

- PR #1202 (TASK-201.2), merge-SHA 50afc936 — fällt: tests/api/update-record.staging.test.ts (fick 503 i stället för 400). Ej i PR:ens diff.
- PR #1215 (TASK-201.5), merge-SHA 71eba715 — fällt: airtable-filter.staging.test.ts (502) samt attachment-upload-large.staging.test.ts (känd flake, TASK-196). Ingen av dem i PR:ens diff.
- Kortens EGNA committade staging-tester (activity-log-rls.staging.test.ts, get-activity-log.staging.test.ts) var GRÖNA i samma körningar.

VAD DETTA BETYDER, OCH VAD DET INTE BETYDER:

Det styrker att post-merge-rödhet mot staging var UTBREDD denna kväll och inte knuten till någon enskild PR:s diff — vilket ytterligare försvagar varje enkel bisekt-attribution, inklusive den mot #1229 som detta kort redan varnar för.

Men det BEVISAR inte att denna fällning är samma fenomen. Signaturerna skiljer sig: de ovan är HTTP-fel (502/503) från Airtable-ytan, medan detta kort gäller en layout-assertion på dokumenthöjd som inte går via något API-svar. Behandla det som kontext om kvällens miljötillstånd, inte som en förklaring.

Fyrstegsplanen ovan gäller oförändrad — den är fortfarande det som avgör frågan.

AVGÖRANDE MÄTNING 2026-08-12 sent (orkestreraren, gh run list mot main, samtliga Post-merge-körningar i fönstret):

Post-merge-utfall per merge-SHA, kronologiskt:

  18:17  e4a110bc  gron
  18:21  6c2f2425  ROD
  18:26  b5534199  gron
  18:43  90b3461d  gron
  18:46  4648823a  gron
  19:50  7e74c94b  ROD   (PR #1230, TASK-201.4)
  20:21  430a8156  gron  (PR #1231, TASK-201.6)
  20:27  8b4832c7  ROD   (PR #1229, S103 — kortets ursprungliga misstankte)
  20:59  9eaf18f8  gron
  21:04  52856e2f  gron
  21:17  b8abfb3c  gron
  21:26  77e18532  gron
  21:42  675fed40  gron
  21:49  417537f5  ROD   (PR #1237, TASK-201.8)

FYRA fallningar, INTERFOLIERADE med gronare korningar. Minst TRE av dem pa exakt samma test (event-bekraftelse.staging.test.ts:409) — verifierat: 8b4832c7 av orkestreraren, 7e74c94b och 417537f5 av stangningsagenten i PR #1241, som i bada fallen bekraftade med gh pr diff --name-only att testet ligger UTANFOR respektive PR:s diff.

VAD DETTA AVGOR:

Forklaring (a), kodregression i #1229, ar FALSIFIERAD. En kodregression ar rod fran den inforande commiten och framat. Monstret gron -> rod -> gron -> rod -> gron ar oforenligt med det. Kortets ursprungliga bisekt-linje (gron pa 430a8156, rod pa 8b4832c7) var en sammantraffande grans, exakt det kortet sjalvt varnade for.

Forklaring (b) star kvar och ar nu den enda som passar: testet mater DOKUMENTHOJD pa en staging-sida vars hojd beror pa hur manga rader eventet faktiskt bar, och staging muterades av flera parallella arbeten hela kvallen.

VARFOR 3/3 SAG DETERMINISTISKT UT: retries kor om samma test i SAMMA korning mot SAMMA datatillstand. Determinism INOM en korning ar helt forenlig med variation MELLAN korningar. Detta ar den exakta fallan — retry-rakningen mater fel axel.

REVIDERAD NASTA-STEG (ersatter fyrstegsplanen ovan):
1. Bisekta INTE. Det ar inte en regression.
2. Behandla det som en datakänslig invariant. Las testet vid rad 409-445 och avgor om dokumenthojd ar ratt matt over huvud taget, eller om assertionen bor mata den yta markera-laget faktiskt ror i stallet for hela dokumentet.
3. Vill man ha ett tal pa raten: kor riggen npm run metrics:flake i stallet for att bygga en egen matserie. Las ut n innan ett nollresultat tolkas.
4. Notera att fyra av fjorton post-merge-korningar foll — det ar en hog rat for en icke-blockerande grind, och det urholkar signalvardet i post-merge som helhet.

TILLÄGG TILL MÄTSERIEN (S105 D3-B, 2026-08-13) — TVÅ NYA RÖDA DATAPUNKTER, UTANFÖR DET URSPRUNGLIGA 14-KÖRNINGARS FÖNSTRET (18:17–21:49):

Två av tre obesvarade ci-post-merge-larm som fällde Nightlys "Sannings-avstämning"-grind tre nätter i rad hörde till DENNA klass. Verbatim ur respektive job-logg (gh run view --log-failed):

- Issue #1174 (träd d18583e5bc4c, merge 19:04Z, körning 19:14–19:22Z, run 31526844868, PR #1166/TASK-147.10): fällt på rad 445 (medUrval.dok vs vilande.dok), Received: 57 (tröskel 1). PR:ens diff (AtgardsSida.tsx + testmail-acceptance-test) rör inte event-bekraftelse.staging.test.ts eller layoutkod — verifierat med gh pr diff 1166 --name-only.
- Issue #1186 (träd 5663b4568c4e, merge 21:48Z, körning 21:58–22:06Z, run 31540350470, PR #1185/TASK-201.1): fällt på rad 437 (aktivt.dok vs vilande.dok), Received: 57 (tröskel 1). PR:ens diff (ADR:er, xAPI-schema, migrationsfil) rör inte event-bekraftelse.staging.test.ts eller layoutkod — verifierat med gh pr diff 1185 --name-only.

Båda ligger UTANFÖR det tidigare mätta fönstret (18:17–21:49) — d18583e5bc4c kl 19:14 föll i en lucka i listan (18:46→19:50), och 5663b4568c4e kl 21:58 låg efter listans sista post (21:49). Detta är alltså inte dubbelräkning av redan kända körningar utan TVÅ GENUINT NYA datapunkter.

REVIDERAD RÄKNING: 16 körningar samplade denna kväll (2026-08-11), 6 röda — samtliga på samma test/invariant (dokumenthöjd), samtliga interfolierade med gröna körningar, samtliga utanför sin respektive PR:s diff. Höjer den redan höga raten (tidigare 4/14 ≈ 29%) till 6/16 = 37,5%. Förstärker ytterligare slutsatsen i REVIDERAD NÄSTA-STEG punkt 4: post-merge-grindens signalvärde för detta test är kraftigt urholkat.

Bägge GitHub-ärendena (#1174, #1186) stängda 2026-08-13 med hänvisning till detta kort (durabelt register). Det tredje larmet i samma Nightly-fällning (#1184, träd d532adbb6ab4) hör INTE till denna klass — det är TASK-196:s redan diagnostiserade och fixade attachment-upload-flake (storage.list limit:100), fixen deployad till staging 2026-08-12 kväll, dvs EFTER denna körnings tidpunkt (2026-08-11 21:03). Stängt med hänvisning till TASK-196 i stället.

Källa: gh run view 31526844868 --log-failed, gh run view 31540350470 --log-failed, gh pr diff 1166/1185 --name-only, samtliga körda 2026-08-13.
<!-- SECTION:NOTES:END -->
