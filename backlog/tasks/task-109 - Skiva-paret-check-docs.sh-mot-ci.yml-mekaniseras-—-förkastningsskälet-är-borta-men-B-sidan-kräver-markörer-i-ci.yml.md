---
id: TASK-109
title: >-
  Skiva: paret check-docs.sh mot ci.yml mekaniseras — förkastningsskälet är
  borta, men B-sidan kräver markörer i ci.yml
status: Done
assignee: []
created_date: '2026-07-31 08:54'
updated_date: '2026-08-01 12:56'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.listparitet-policy.conf` bokförde paret `check-docs.sh`:s gate-lista ↔ `ci.yml`:s lint-jobb som **förkastat**, med motiveringen att grönt först krävde att någon wirade grinden i CI eller skrev om `check-docs.sh`:s påstående. **Båda är gjorda:** `TASK-98` wirade `check-permissions-claims.sh`, `TASK-106` tog in de två grindar listan saknade. Det ursprungliga förkastningsskälet är därmed borta.

Paret är värt att mekanisera: utan det kan felklassen återuppstå tyst. `TASK-98` och `TASK-106` är två olika riktningar av **samma** drift, funna av två olika agenter, båda genom manuell `grep` — inte av någon grind.

**Varför `TASK-106` ändå inte byggde det.** En robust B-sida kräver `# paritet:start`-markörer i `ci.yml`, precis som paret `lychee-scope` redan har. `.github/workflows/**` låg utanför `TASK-106`:s filyta (fem systeragenter parallellt), och en CI-wiring skulle beskrivas, inte byggas.

**Hela-filen-varianten duger inte — mätt, inte antaget (2026-07-31).** Med tom markör läses hela `ci.yml`, och uttrycket plockar då grind-namn ur **kommentarer** lika gärna som ur `run:`-rader. Kontrollerat experiment: med körningen på rad 615 borttagen ger `grep -oE 'bash scripts/check-[a-z0-9-]+\.sh'` ändå posten `bash scripts/check-listparitet.sh` — den plockas ur kommentaren på rad 612 (`` `time bash scripts/check-listparitet.sh` ``). Paret hade rapporterat synk på en avwirad grind, alltså `TASK-98`:s felklass återinförd av grindens egen config.

Ett `^[[:space:]]+run: `-ankare löser läsningen men inte paret: `grep -oE` returnerar hela matchningen, så B-posterna får prefixet `run: bash ` och kan aldrig bli lika med A-sidans. ERE har ingen capture-extraktion i `grep -oE`, och `check-listparitet.sh` jämför posterna som strängar.

Markörer i `ci.yml` är alltså inte en bekvämlighet utan förutsättningen — och skriptets eget huvud säger varför: *"GÖR MARKÖREN KOPPLINGEN SYNLIG för den som redigerar listan."*
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 paritet-markörer satta i ci.yml runt lint-jobbets check-grindar, verifierat att yamllint + actionlint är gröna och att blockets värden är oförändrade
- [x] #2 Par-posten skriven i .listparitet-policy.conf med riktning som fångar drift i BÅDA riktningarna — en grind CI kör men listan saknar, och en listan har men CI inte kör
- [x] #3 Tvåsidigt bevis: paret är grönt när listorna är i synk, och FÄLLER när en grind tas bort ur endera sidan — båda mätta, inte resonerade
- [x] #4 Kommentar-fällan bevisligen stängd: med en run:-rad borttagen ur ci.yml FÄLLER paret, till skillnad från hela-filen-varianten som rapporterade synk (mätt 2026-07-31)
- [x] #5 FÖRKASTADE-sektionens post för detta par borttagen ur .listparitet-policy.conf — ett förkastningsskäl som överlevt sin orsak maskerar nästa drift
- [x] #6 check-docs.sh:s not 'INGEN GRIND HÅLLER DENNA LISTA MOT ci.yml' borttagen eller omskriven, så filen inte påstår en lucka som stängts
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Leveransen (PR #542, head 6cfa9e2, merge 1877c84 via merge queue): wiring 3 — sjätte listparitets-paret `docs-grindar` mekaniserat. Paritet-markörer i ci.yml runt lint-jobbets nio check-grindar + A-markörer runt check-docs.sh:s run_gate-block (post 5–13) + par-post i .listparitet-policy.conf med riktning `bada` (SUMMA 5/8 → 6/7); FÖRKASTADE-posten ersatt med flytt-notis och INGEN-GRIND-noten omskriven (AC#6). Tvåsidigt bevis mätt, inte resonerat: baslinje 6 par i synk exit 0 · A-borttag (check-adr-count) exit 1 · B-borttag (check-listparitet-körningen) exit 1 — samma borttag som hela-filen-varianten bevisligen missade (fantom-post ur kommentar, re-mätt 2026-08-01 mot aktuell fil). Parsad ci.yml värde-identisk mot origin/main (js-yaml, 12176 tecken JSON) — markör-kommentarerna ändrar ingen semantik. DoD#3 verifierad per jobb: merge_group-run 30700260450 på merge-SHA 1877c84 — Detect changed files: success · Lint + Audit + TypeCheck: success · Docs link check: success · Test suite / Pure + Build: success · Test suite / Acceptance (hermetisk): success · A11y + Staging-jobben: skipped by-design · CI Passed or Skipped: success. ci.yml-ändringen körde alltså den bredare sviten, som väntat. Stängd 2026-08-01 efter CI-verifikat.
<!-- SECTION:FINAL_SUMMARY:END -->
