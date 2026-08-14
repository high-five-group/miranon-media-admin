---
id: TASK-214.3
title: 'Skiva: Referenserna — hermetiska fixturer + ariaSnapshot ur variant-läget'
status: Done
assignee: []
created_date: '2026-08-14 19:16'
updated_date: '2026-08-14 22:49'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.2
parent_task_id: TASK-214
ordinal: 404000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
B4-parets FÖRE-halva byggs i den hermetiska fixturvärlden: fixturer för dörrlistans samtliga lägen och ariaSnapshot-referenser ur variant-läget, tagna EFTER mutations-kopplingen så referenserna speglar den färdiga ytan — personlistans enkelriktade kedja. Styrande: PRD task-214, ADR-103 B4, facit-manifestet. Täcker användarberättelser: 11
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hermetiska fixturer finns för dörrlistans lägen: flera sessioner, en session (utan sessionsval), sök med och utan träff, klargrupp med poster, tomläge
- [x] #2 ariaSnapshot-referenser tagna ur variant-läget (FÖRE-halvan av B4-paret) för dessa lägen och gröna mot den körande ytan
- [x] #3 Referenserna speglar facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)' — divergens mot facit-bilderna rapporteras som fynd, aldrig normaliseras tyst
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [x] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [x] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [x] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DIVERGENS MOT UPPDRAGET (ADR-086, öppet bokförd, ICKE-BLOCKERANDE): worktreens gren var 6 commits bakom origin/main vid sessionsstart — landningen av TASK-214.2 (PR #1301, merge aca14cff) och S105-fas-avslutet (PR #1302) hade skett men fanns inte i mitt ögonblicks-main. `src/data/mutations/attendance.ts` och `tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts`, som uppdraget påstod fanns, saknades därför initialt på disk trots att uppdragets källhänvisning (PR #1301, merge aca14cff) var korrekt. Löst med `git merge --ff-only origin/main` (worktree-grenen hade noll egna commits utöver main, så FF var säkert) innan design påbörjades. Exakt det scenario ADR-086 beskriver: "en 'saknad' referens kan vara en landning du inte sett".

FYRA FIXTURVÄRLDAR BÄR SEX LÄGEN (AC #1): flera sessioner (Värld A, Deltaganden i Dag 1+Dag 2), en session utan sessionsval (Värld B), sök med/utan träff (Värld B via interaktion, personer-precedentens mönster), klargrupp med poster (Värld C, 2 av 4 redan incheckade, expanderad), tomläge (Värld D, alla incheckade, ingen sökning). Rationale för fyra världar i stället för sex: `sessioner`-listan (togglens synlighet) härleds ur `Dorrad[]` (byggRader), INTE det sessions-filtrerade `DorradD[]` — ett andra sessions-värde måste finnas i datat, kan inte simuleras genom interaktion. "Tomläge" hölls medvetet ÅTSKILT från "sök utan träff": förstnämnda är `attGora.length===0` UTAN sökning ("Alla N är incheckade"), sistnämnda är EN sökning mot en icke-tom lista som ger noll träffar ("Ingen kvar... bland träffarna") — två olika kodgrenar i `attGora`-villkoret, därmed två referenser, ingen skulle bevisa den andra.

AVSIKTLIG DIVERGENS MOT RÅ PRECEDENT-FORM (personer-kedjan 46c03f6c/301d17af bar sitt axe-block redan i FÖRE-halvan): axe/a11y-golvet är UTELÄMNAT i denna skiva. PRD task-214 delar explicit ut härdningen som EGEN skiva (TASK-214.5: "Härdningen — a11y-golvet..."), och 214.3:s egna AC/DoD nämner aldrig axe. Att duplicera här hade förgripit 214.5:s scope utan AC-krav. Dokumenterat i spec-filens docblock; 214.5 kan verifiera mot samma lokatorer/fixturvärld.

FYND — HUS-FÄLLA (getByText är skiftlägesokänslig substräng-matchning): `getByText('Dag 2')` matchade OAVSIKTLIGT eventdatum-texten "lördag 26 september" (…lör-**dag 2**-6 september…) i strict-mode-krock. Bytt till rollbaserade lokatorer (`getByRole('radio', {name:...})`) för sessionstoggeln. Samma klass av fälla åt andra hållet: en tidigare `getByText('Vilken session checkar du in?')`-negativassertion visade sig vara tautologisk (strängen är ENDAST radiogroup-ens aria-label, aldrig synlig DOM-text — 0 träffar oavsett om togglen renderas). Bytt till `getByRole('radiogroup', {name:...}).toHaveCount(0)`, ett äkta negativt bevis.

FACIT-GRANSKNING (AC #3): jämförde en riktig PNG-skärmdump av Värld A (flera sessioner — närmast facitets fotograferade tillstånd) mot `slutlage-desktop.png`/`slutlage-mobil.png`. INGEN DIVERGENS: sidkrom (44 px rund chevron + text-3xl), eventidentitet, framstegskort (primary-tint, "N kvar att checka in" + pill + stapel), sessionstoggel (pill-par), sökfält, radanatomi (initialer-cirkel + namn + e-post + omärkt kryssruta) matchar samtliga. Diagnostik-skärmdumpen togs via ett TEMPORÄRT testblock (borttaget innan commit, spårbart i denna sessions historik, inte i den pushade koden).

BEVIS-LOOPENS TVÅSIDIGA SPÅR (DoD #6): (1) 12/12 gröna vid `--update-snapshots` (referenserna föds), (2) 12/12 gröna UTAN `--update-snapshots` (reproducerar), (3) avsiktlig mutation (checkbox-aria-label → "TASK214PROBEMARKER") gav RÖTT med exakt diff (namngiven sträng syns i felmeddelandet), (4) revert → 12/12 grönt igen. Fyra körningar, samtliga loggade.

TESTID-ANKARET `data-testid="dorrlista-yta"` på `VariantD`s yttersta `<section>` — ett attribut, ingen ny DOM-nod, flippar ingen form (samma minimala fotavtryck som `personer-yta`).

DoD-STATUS (samtliga boxar lämnas OMARKERADE — matchar precedentet task-171.1/task-162.1, orkestreraren äger stängningen efter CI-verifikat):
#1 AC avbockade via CLI (gjort, se ovan).
#2 Rörd fil-klass lokala grindar: typecheck 0, biome check . exit 0 (0 fel; 6 varningar/42 infos alla pre-existing i orörda filer), build grönt, test:api 750/750 grönt, `node scripts/check-langa-streck.mjs` OK (0 ofångade), `node scripts/check-mailto.mjs` OK (0 ofångade) — de två CI-naket-grindarna mission-brevet varnade om.
#3 CI grön per jobb — EJ verifierbar av mig, orkestrerarens domän.
#4 Path-scopad add, verifierat: `git status --short` visar endast `src/components/events/CheckinPrototyp.tsx` (M) + `tests/visual/dorrlista-promoverings-grind.spec.ts` (?) + `tests/visual/__aria__/dorrlista-promoverings-grind.spec.ts/` (?).
#5 ariaSnapshot-PARET (variant före == promoverad efter) — BOCKAS INTE: detta är FÖRE-halvan ensam (kortets egen beskrivning). EFTER-halvan föds först i TASK-214.4 när flippen sker.
#6 Bevis-loopens spår — se ovan, bilagt i PR-beskrivningen.
#7 Datavägs-invarianten — trivialt sant för denna skiva: noll rader datakod/mutationskod rörda (endast en `data-testid` på befintlig JSX plus en ny testfil). Inget att invariant-pröva utöver att ingenting rördes.
#8 Test-konsument-svepets träffyta — N/A: ingen flip sker i denna skiva (samma motivering som 171.1 gav för samma DoD-post). Hör till TASK-214.4.
#9 Kvittensfönstrets kontrakt via nätverksobservation — redan bevisat av TASK-214.2:s acceptanstestsvit (landad, `tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts`), rör inte denna skivas läsvägs-referenser.
#10 Facit-granskningen — utförd, se ovan. Ingen divergens funnen.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad av bygg-agent (Sonnet) 2026-08-14/15, PR #1304, merge 52347382 via kön (rollup SUCCESS; svepets armerings-larm var en race mot kön — PR:en var redan MERGED vid disambiguering). B4-parets FÖRE-halva: 12 ariaSnapshot-referenser (6 lägen × desktop/mobil) ur variant-läget i fyra hermetiska fixturvärldar; data-testid dorrlista-yta som enda src-ändring (ett attribut, ingen DOM-nod). AC 1-3 avbockade. Facit-granskning: PNG-skärmdumpar jämförda mot slutlage-bilderna — ingen divergens. Tvåriktnings-bevis: aria-label-mutation gav RÖTT med exakt diff, revert 12/12 grönt två gånger. Grindar: typecheck 0, biome 0, build 0, test:api 750/750, langa-streck 0, mailto 0. Premiss-divergens korrekt hanterad: worktree 6 commits bakom vid start, ff:ad före design. Två testkvalitets-fynd fixade och bokförda i notes: getByText-substräng-fällan ('Dag 2' matchade 'lördag 26') och en tautologisk negativ assertion ersatt med äkta bevis. DoD 5/8/9-arvet hör till 214.4 per 171.1-precedenten — belagt här. Stängd efter landningsverifikat.
<!-- SECTION:FINAL_SUMMARY:END -->
