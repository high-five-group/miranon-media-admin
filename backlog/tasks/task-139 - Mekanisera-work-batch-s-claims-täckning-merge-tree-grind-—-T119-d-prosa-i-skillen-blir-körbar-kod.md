---
id: TASK-139
title: >-
  Mekanisera work-batch:s claims-täckning + merge-tree-grind — T119 (d): prosa i
  skillen blir körbar kod
status: Done
assignee: []
created_date: '2026-08-04 22:20'
updated_date: '2026-08-05 01:19'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 224000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mekanisera de två obeväpnade grindarna i parallell `/work-batch`-form
(ADR-073): **claims-täckningen** och **`merge-tree`-grinden**. Båda är idag
ENDAST prosa i `plugins/marcus-system/skills/work-batch/SKILL.md` § "Parallell
form" — ingen körbar kod finns i detta repo som faktiskt kör dem.

## Domen — INTE omprövad, byggs på

Research-passet för `T119` (d) item 3 landade `f9abd8e1` (PR #735,
`docs/research/kodfils-partitionering-parallella-agenter-2026-08-04.md`);
domen bokfördes i tråden `2683a715` (PR #736, `tasks/threads/README.md`
rad 162). Domen: **bygg ingen ny mekanismklass** — `ADR-073`:s kombination
(claims-check uppströms + `merge-tree`-grind före PR + smalt bundet
C-mandat) ÄR branschmönstret, bekräftat mot nio+ granskade system över fem
produktkategorier (VCS, monorepo-styrning, CI/merge-kö, orkestrerings-
plattform, agentiska kodningsverktyg — inklusive Cursor, som byggde
peer-to-peer-lås mellan agenter och REV UT det: *"Twenty agents would slow
down to the effective throughput of two or three"*).

Det konkreta gapet är MEKANISERING, inte design. **Verifierat denna
session (disk, inte antaget):** `grep -rn "merge-tree\|merge_tree"
scripts/` ger EN träff — en obesläktad variabel i
`scripts/classify-post-merge.sh` som läser en redan landad commits
träd-SHA (en helt annan kontroll: att landad diff matchar PR:ens diff).
Inget `claims.json`, inget `check-claims*.sh`, inget delade-ytor-register
som fristående fil existerar. `scripts/check-permissions-claims.sh` är
INTE samma sak — den validerar att en styrande fil inte påstår en
`permissions.deny`/`permissions.ask`-mekanism som saknas; en helt annan
"claims"-betydelse (permissions-påståenden, inte kodfils-ytor). Detta
kort mekaniserar de två mekanismerna EXAKT som de redan är designade i
`ADR-073` + skillen — det uppfinner ingenting nytt.

## Skillens egen text (verbatim, `work-batch/SKILL.md` § "Parallell form")

Punkt 1 (claims + täckning):

> Utpekning, inte plock — med claims-check + täcknings-pass: orkestratorn
> pekar ut kortet per pipeline-steg FÖRE spawn [...] och intersekterar
> kortens förutsedda fil-ytor (claims) mekaniskt FÖRE batch-designen [...]
> **Täcknings-passet (OBLIGATORISKT försteg; kollisions-check ≠
> täcknings-check):** intersektionen fångar overlap mellan kort men INTE
> inkompletta claims. Före avfyrning mappas per kort spec-textens namngivna
> artefakter BOTTOM-UP mot repots lagerkarta (disk-verifierat, aldrig
> gissat) och claims måste omfatta resultatet (claims ⊇ krävd yta); gap
> läks i claims-designen FÖRE avfyrning. Repots delade horisontella ytor
> konsulteras ur ett per-repo delade-ytor-REGISTER — skillen bär
> mekanismen, VÄRDENA bor i spoken (ADR/konfig; config-driven-principen);
> varje register-yta batchen rör tilldelas EXPLICIT (fasat schema eller en
> ägare — aldrig onämnd). Empiri: S75-premiären fann 15/21 kort med gap
> efter att batchen haltat 0/22 på första kortet.

Punkt 4 (merge-tree):

> CI-kedjan är orkestrator-ägd och SERIELL per kort: agenten levererar
> branch + push (INGEN PR, ingen stängning); orkestratorn kör
> **merge-tree-grinden** (`git merge-tree --write-tree` mot färsk main —
> exit 0 krävs, exit 1 = konflikt ⇒ det bundna upplösnings-mandatet nedan
> prövas, utanför mandatet halt utan PR) → **claims-kvittot** (faktisk
> diff mot förgrenings-SHA:t ∩ deklarerad yta; fil utanför ⇒ eskalering,
> aldrig tyst pass) → `gh pr create` [...]
> **Bundet konflikt-upplösnings-mandat:** merge-tree-konflikt som ENBART
> rör (a) genererade filer (t.ex. routeTree-filen) → mekanisk regenerering
> med verifierad typecheck före push, eller (b) bokförings-md (kort-filer,
> spec-dok, ADR-kataloger) → union-upplösning med BÅDA sidor bevarade,
> öppet bokförd i PR + kortets notes — därefter återupptas kedjan. VARJE
> konflikt som rör annan kod = HALT.

## ADR-073 Amendering 3 (Session 75) — punkt 2+3 (verbatim, spoke-värdena)

> **Delade-ytor-registret (repo-värden; skript-logik universell, värden
> per projekt).** Horisontella ytor som VARJE partition måste tilldela
> explicit (fasat schema eller en ägare — aldrig onämnd): (1)
> `src/domain/schemas/**` + `src/domain/models/**` + paritetsfilen
> `src/domain/__tests__/schemas.assignable.ts` · (2)
> `supabase/functions/_shared/**` (field-allowlists.ts = allowlist-SSOT) ·
> (3) `src/styles/tokens/**` · (4) primitiv-standard-klustret (barreln +
> `tests/a11y/primitives.spec.ts` + `src/routes/dev/primitives.tsx` +
> `docs/specs/DESIGN-SYSTEM-SPEC.md`) · (5) `src/data/**` (adapter-lagret)
> · (6) `src/queries/**` · (7) manifestet (`package.json`/lockfilen) · (8)
> genererade `src/routeTree.gen.ts` samt config-ytorna.
>
> **Konflikt-upplösnings-mandat för merge-agenten (bundet; halt-first
> orörd för kod).** Merge-tree-konflikt som ENBART rör (a)
> `src/routeTree.gen.ts` → mekanisk regenerering i temp-worktree
> (router-cli finns som devDependency; typecheck-verifierad före push)
> eller (b) bokförings-md-ytor (`backlog/tasks/**`, `docs/specs/**`,
> `docs/decisions/**`) → union-upplösning med BÅDA sidor bevarade, öppet
> bokförd i PR + kortets notes. VARJE konflikt som rör annan kod = HALT.

`ADR-073` rörs INTE av detta kort — texten ovan är citerad, inte flyttad;
beslutstexten bevaras oförändrad per husets immutabilitets-konvention.
Config-filerna nedan CITERAR sitt ursprung i en header-kommentar i stället
för att duplicera texten okommenterat.

## Vad kortet specar — två mekanismer

### Mekanism 1 — `scripts/check-claims-tackning.sh` (täcknings-passet)

Tar en claims-manifest (JSON, sökväg via argument) som orkestratorn
författar per batch-avfyrning: per pipeline en lista deklarerade
allowed-globs, samt EN disposition per post i delade-ytor-registret
(enda-ägare / fasat-delad / uttryckligen-ej-berörd-denna-batch — exakta
fältnamn väljs av den byggande agenten, principen är bindande, inte
formatet). Läser delade-ytor-registret ur en NY config-fil
`.claims-tackning-policy.conf` (de åtta posterna ovan migrerade till
glob-mönster + namn; header citerar `ADR-073` Amendering 3 punkt 2 som
källa) — skript-logiken är universell, värdena bor i configen
(config-driven-principen, Lesson #6, samma separation som
`.staging-semaphore-policy.conf` + `scripts/staging-semaphore.sh`).

Skriptet fäller (exit ≠ 0) om MINST EN registerpost saknar en explicit
disposition i manifestet — det mekaniserar ordagrant "aldrig onämnd" och
stänger exakt den svaghetsklass S75-premiären mätte (15/21 kort med gap).
Skriptet fäller också om två pipelines båda hävdar enda-ägarskap över
samma registerpost utan `fasat`-markering.

**Explicit avgränsat BORT** (inte del av detta kort, för att hålla scope
snävt mot mission-texten): (a) den PARVISA kollisions-checken mellan
pipelines förutsedda fil-ytor FÖRE batch-design (`ADR-073` beslut 1:s
"intersekterar kortens förutsedda fil-ytor mekaniskt") och (b)
claims-kvittot (faktisk diff mot förgrenings-SHA:t ∩ deklarerad yta,
EFTER leverans — skillens delta 4). Båda är andra mekanismer än
täcknings-passet och registreras här explicit ute ur scope så nästa
läsare inte tror de är täckta av detta kort.

### Mekanism 2 — `scripts/check-merge-tree.sh <gren> [<bas-gren>]`

Kör `git fetch` mot bas-grenen (default `origin/main` — färskhets-kravet,
`ADR-073` beslut 2) och därefter `git merge-tree --write-tree <bas>
<gren>`; propagerar git:s EGEN exitkod rakt av utan mellanledd pipe (0 =
konfliktfri, 1 = konflikt, annat = fel att slutföra —
git-scm.com/docs/git-merge-tree, redan primärkälle-citerad i
research-passet). Skriptet skriver ALDRIG till arbetsträd eller index
(`--write-tree` gör det aldrig per definition).

Vid exit 1 skriver skriptet ut de konfliktande sökvägarna och
klassificerar VARDERA mot det bundna upplösnings-mandatet, läst ur en NY
config-fil `.merge-tree-mandat-policy.conf` (mandat-berättigade
path-mönster: `src/routeTree.gen.ts`, `backlog/tasks/**`,
`docs/specs/**`, `docs/decisions/**` — header citerar `ADR-073`
Amendering 3 punkt 3 som källa): enbart mandat-berättigade filer i
konflikten ⇒ skriv ut "mandat-berättigad" (mekanisk lösningsväg finns,
skriptet löser INGET automatiskt — det klassificerar, orkestratorn/
agenten utför); minst en icke-mandat-fil i konflikten ⇒ skriv ut "HALT".

## Config-driven-kravet (Lesson #6)

Båda skriptens LOGIK är universell och duplicerbar till andra spokes utan
refaktor; de PROJEKTSPECIFIKA värdena (delade-ytor-registret,
mandat-berättigade path-mönster) bor i var sin `.<grindvakt>-policy.conf`
— samma separation branschen använder för `.eslintrc`/`.prettierrc`/
`.vale.ini`, och samma mönster som `.staging-semaphore-policy.conf` +
`scripts/staging-semaphore.sh` i detta repo. Ingen repo-specifik path
hårdkodas i själva `.sh`-filerna.

## CI-inwiring — explicit AVGRÄNSAD BORT

Varken skripten eller deras testsviter wiras in i `ci.yml` av detta kort.
Skälen skiljer sig åt mellan mekanismerna: `check-merge-tree.sh` och
`check-claims-tackning.sh` körs av ORKESTRATORN vid en levande parallell
batch-avfyrning (kräver riktiga grenar/en riktig manifest-fil som inte
finns vid en generisk push) — att wira in dem i push-CI:t är strukturellt
fel plats. Testsviterna (`scripts/test-check-*.sh`, mot scratch-fixturer)
KAN i princip wiras in i lint-jobbet som övriga `test-check-*.sh`-rader
(t.ex. `test-check-thread-index.sh`), men det är en separat, senare
avvägning — registreras här som öppen fråga, inte avgjord i detta kort
(samma mönster som `TASK-137`s Resend-lås: "CI-inwiring [...] INTE gjord,
uppdraget sa uttryckligen: registrera frågan här, wire inte in utan
explicit AC").

## Källor

- `docs/research/kodfils-partitionering-parallella-agenter-2026-08-04.md`
  (PR #735, commit `f9abd8e1`)
- `tasks/threads/README.md` rad 162 (`T119`, dom bokförd i commit
  `2683a715`)
- `docs/decisions/ADR-073-parallella-batch-pipelines.md` (Amendering 3,
  Session 75)
- `plugins/marcus-system/skills/work-batch/SKILL.md` § "Parallell form"
  (hub-plugin-cache, citerad verbatim ovan — ej repo-relativ sökväg)
- `tasks/sessions/archive/2026-08/2026-08-04-session-97.md` "Paushistorik — Session 97,
  fjärde pausen" § CARRY (rad ~1413–1417)
- `scripts/classify-post-merge.sh` (verifierat: enda obesläktade träffen
  på "merge-tree" i `scripts/`)
- `scripts/staging-semaphore.sh` + `.staging-semaphore-policy.conf`
  (config-driven-precedent i detta repo)
- `.grind-exitkod-policy.conf` (GRIND_MONSTER-mönstret täcker
  `scripts/check-[a-z-]+\.(sh|mjs)` och `scripts/test-[a-z-]+\.sh`
  automatiskt — de nya skripten omfattas av pipe-skyddet utan egen
  registrering)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 scripts/check-claims-tackning.sh finns: läser en claims-manifest (JSON, sökväg via argument) + .claims-tackning-policy.conf (delade-ytor-registrets åtta poster ur ADR-073 Amendering 3 punkt 2, migrerade till glob-mönster+namn, header citerar källan); exit 0 när VARJE registerpost har en explicit disposition (enda-ägare / fasat-delad / uttryckligen-ej-berörd) i manifestet; manifest-formatets fält dokumenteras i skriptets header-kommentar
- [x] #2 check-claims-tackning.sh fäller (exit ≠0, dokumenterad kod) när minst en registerpost SAKNAS helt i manifestet (S75-gap-klassen: onämnd post) OCH när två pipelines båda hävdar enda-ägarskap över samma registerpost utan fasat-markering
- [x] #3 scripts/test-check-claims-tackning.sh bevisar TVÅSIDIGT: en fullständigt täckt manifest-fixtur ⇒ exit 0; minst tre planterade brist-fixturer (onämnd post, dubbel-ägd post utan fasat, trasig JSON) ⇒ vardera sitt förväntade icke-noll-facit — körd och rapporterad med faktiskt utfall
- [x] #4 scripts/check-merge-tree.sh <gren> [<bas-gren>] finns: git fetch mot bas (default origin/main, färskhets-kravet) + git merge-tree --write-tree, exitkoden propagerad rakt av UTAN mellanledd pipe (0=konfliktfri, 1=konflikt, annat=fel); skriver ALDRIG till arbetsträd eller index
- [x] #5 Vid exit 1 skriver check-merge-tree.sh ut de konfliktande sökvägarna och klassificerar VARDERA mot .merge-tree-mandat-policy.conf (mandat-berättigade path-mönster ur ADR-073 Amendering 3 punkt 3): enbart mandat-berättigade filer ⇒ 'mandat-berättigad' (skriptet löser INGET automatiskt, bara klassificerar); minst en annan fil ⇒ 'HALT'
- [x] #6 scripts/test-check-merge-tree.sh bevisar TVÅSIDIGT i en isolerad scratch-git-repo: (a) konfliktfri divergens ⇒ exit 0, (b) äkta textkonflikt i icke-mandat-fil ⇒ exit 1 + HALT, (c) konflikt ENBART i mandat-berättigad fil ⇒ exit 1 + mandat-berättigad-klassning; samt bevisar att scratch-repots working tree/HEAD är oförändrat efter körning
- [x] #7 Båda .sh-skripten är config-driven (Lesson #6): ingen repo-specifik path/glob hårdkodad i själva skriptlogiken utanför respektive .conf-fil — samma separation som .staging-semaphore-policy.conf + scripts/staging-semaphore.sh
- [x] #8 Båda .sh-skripten är shellcheck-strict-rena (CI:s pinnade shellcheck 0.11.0, samma grind som övriga scripts/*.sh)
- [x] #9 CI-inwiring av VARKEN skripten eller deras testsviter görs av detta kort — bokfört explicit som öppen fråga (samma mönster som TASK-137), inte tyst utelämnad; ADR-073 rörs inte (texten citeras, flyttas inte)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat i PR #745 (main 9b2a08b1). Två mekanismer i kod: scripts/check-claims-tackning.sh + scripts/check-merge-tree.sh, båda config-drivna (.claims-tackning-policy.conf, .merge-tree-mandat-policy.conf) med universell skriptlogik per hub-konstitutionens Lesson #6. Tvåsidigt bevis per grind, inkl. mutationstest som falsifierade testsviterna själva (9/9 -> 8/9 resp. 7/9 när skydden togs bort, återställda och omverifierade). shellcheck --severity=style --enable=all EXIT=0. ci.yml:s befintliga shellcheck-strict-lista utökad 15->17 med de två nya conf-filerna (flaggat öppet som gränsdragning; ingen ny CI-check införd).
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
