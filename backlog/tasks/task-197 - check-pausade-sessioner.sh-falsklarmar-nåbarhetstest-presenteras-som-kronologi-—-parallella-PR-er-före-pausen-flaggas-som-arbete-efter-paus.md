---
id: TASK-197
title: >-
  check-pausade-sessioner.sh falsklarmar: nåbarhetstest presenteras som
  kronologi — parallella PR:er före pausen flaggas som arbete efter paus
status: Done
assignee: []
created_date: '2026-08-11 18:30'
updated_date: '2026-08-24 13:55'
labels: []
dependencies: []
priority: high
ordinal: 362000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Belägg (rödklassningen 2026-08-11, run 31454392944 job 93665096969): grinden flaggade S103 för 'arbete landat efter pausen' på commits fa41a1be (22:21:14+02) och 0507c77c (22:34:10+02) — men paus-commiten 9af3c004 är 23:02:29+02, så arbetet FÖREGÅR pausen med 28 resp 41 min. Mekanismen: skriptets rad 152+198 tar PAUS_SHA=git log -1 -- <fil> och listar PAUS_SHA..HEAD — ett NÅBARHETSTEST, inte kronologi. Arbetet landade via parallella PR:er (#1151 merge 20:25Z, #1153 merge 20:48Z) som paus-grenen grenades ut före → icke-nåbara från paus-SHA → flaggade. Mekaniskt motbevis: git merge-base --is-ancestor fa41a1be 9af3c004 → NEJ (dito 0507c77c). Fix-riktning: jämför %ct mot paus-commitens %ct före larm, ELLER mät mot första-förälder-historiken på main. Larmet återkommer varje natt tills grinden lagas eller S103 stängs — S103 pausades KORREKT, det är grinden som räknar fel. Oprövat om tidigare nätter drabbats (endast denna run granskad).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Rotorsak bekräftad (verifierad mot skriptet på disk, ADR-086): rad 152/198 (nu
207-226/261-270) bygger PAUS_SHA via `git log -1 -- <fil>` och listar sedan
`PAUS_SHA..HEAD --no-merges` — ett DAG-icke-nåbarhetstest, inte kronologi. Två
grenar som förgrenas från SAMMA bas innan endera mergats in är per konstruktion
icke-nåbara från varandra oavsett i vilken ORDNING de sedan landar. S103:s
verkliga topologi (verifierad i graf): PR #1155 (feat/s103-rik-
granskningsperson, fa41a1be/0507c77c) och PR #1157 (docs/s103-del7-och-
basfynd, bär paus-commiten 9af3c004) förgrenades från samma main-punkt; #1155
mergades FÖRE #1157 trots att dess commits (22:21/22:34) föregår paus-tiden
(23:02) med 28-41 min.

Fix: committer-tid (%ct) jämförs mot paus-commitens EGEN %ct, men ENDAST när
paus-commiten INTE är en DAG-förfader till kandidaten (git merge-base
--is-ancestor). Skopningen är medveten och empiriskt tvingad: ett första
utkast prövade tiden OVILLKORAT och slog av fyra ÄKTA positiva i den
BEFINTLIGA testsviten (SIDA 1-4) — git:s 1-sekunds-tidsupplösning plus en
rigg som medvetet backdaterar för att simulera "gammalt arbete" förbi
karensen, utan relation till paus-commitens egen tid. En ättling-commit kan
per definition inte ha skapats före sin egen förälder (hash-kedjan garanterar
det), så nåbarhetstestet ensamt räcker där — tidsjämförelsen behövs bara för
DAG-syskon.

Kandidat (b), första-förälder-historiken, PRÖVAD och FÖRKASTAD: 200
first-parent-commits ur historiken gav NOLL som inte är "Merge pull
request..."-subjects (repot mergar äkta merge-commits, ingen squash).
[S<N>]-taggade arbetscommits lever uteslutande som andra-förälder-commits —
--first-parent hade gjort grinden blind för allt taggat arbete, äkta som
falskt.

Bevis: scripts/test-check-pausade-sessioner.sh utökad med SIDA 5, två
hermetiska riggar som planterar S103:s exakta topologi (två grenar ur samma
bas, äkta merge-commits, arbete mergat FÖRE paus). Fall A (falsklarmet):
arbete kronologiskt FÖRE paus -> GRON efter fixen, med en inbyggd
sanity-check som bevisar att den RÅ nåbarhets-träffen finns (gamla logiken
skulle ha fällt). Fall B (sanna positiven bevaras): identisk topologi, tiderna
vända (arbete EFTER paus) -> DRIFT fortfarande. 19/19 fall gröna
(shellcheck-strict 0.11.0 ren, 0/0/0/0).

Levande verifikation (S103 står lifecycle: paused på main): fixad grind ->
GRON, "7 pausat/pausade dok prövade, inga motsägelser". Samma körning med
FÖRE-fix-skriptet (git show dd8ae755:scripts/check-pausade-sessioner.sh) mot
SAMMA repo-state -> RÖD, flaggar exakt fa41a1be och 0507c77c med exakt de
rapporterade tiderna — differentialbevis, inte bara frånvaro av signal.

Oväntat fynd (registrerat, INTE åtgärdat i denna PR — utanför kortets scope,
ADR-053): scripts/test-check-pausade-sessioner.sh är INTE wired in i
ci.yml:s "Test gatekeeper script suites"-steg (grep mot .github/workflows/
gav noll träffar för filnamnet) — till skillnad från test-check-backlog-
closure.sh och test-check-nattvakt-dedup.sh, vars grindar också kör i natten.
Sviten (nu 19 fall) körs alltså bara lokalt/manuellt, aldrig av CI. Flaggas
till orkestreraren för ett separat beslut.

STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad). Belägg verifierat mot disk: fixen (merge-base --is-ancestor-nåbarhetsgrind, SIDA 5) finns i scripts/check-pausade-sessioner.sh rad 238 och 287 (grep-bekräftat). Testsviten scripts/test-check-pausade-sessioner.sh kördes lokalt av mig: 19/19 gröna, exit 0. Fixen landade i PR #1170 (merge 43070f95, 2026-08-11T19:36:21Z), verifierad ancestor av origin/main (git merge-base --is-ancestor), samtliga checks SUCCESS/SKIPPED. Kortet saknar egna AC (No acceptance criteria defined) — inget att bocka där. DoD #1-4 bockade mot detta belägg.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redan löst på disk sedan PR #1170 (2026-08-11) — falsklarmet (nåbarhetstest presenterat som kronologi) rättat med SIDA 5:s merge-base --is-ancestor-skopning. Kortet flippades aldrig till Done i backlog-CLI:t. Bokförd stängning, S112 städvåg A.
<!-- SECTION:FINAL_SUMMARY:END -->
