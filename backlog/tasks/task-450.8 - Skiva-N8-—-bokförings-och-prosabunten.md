---
id: TASK-450.8
title: 'Skiva: N8 — bokförings- och prosabunten'
status: To Do
assignee: []
created_date: '2026-09-18 09:54'
updated_date: '2026-09-19 10:06'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.1
  - TASK-450.2
references:
  - docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md
parent_task_id: TASK-450
priority: medium
ordinal: 782000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fem små rättelser mot den felklass granskningen hittade flest gånger: text som var sann när den skrevs och blev falsk av en senare landning. (a) Fyra falska textställen rättas, och för de två talen ersätts talet med kommandot som räknar, så påståendet aldrig kan bli inaktuellt igen. (b) TASK-365:s rotorsaksbeskrivning ersätts med den mätta mekanismen (N3 landad) och pekas mot tråd T166. (c) TASK-239 AC #3 bockas med run-ID:n som belägg (31 gröna acceptance-nätter i följd). (d) Review-grindens kalibreringskanal tas i bruk: de produktionsfel ägaren själv hittat bokförs som grind-missar. Hubbens rad om popup-frågor (påstår PROSA trots att en hook nekar verktyget) rättas i hubbens egen kanal som separat commit. Kort ändras ENDAST via backlog-CLI:t. Spec: planens § N8. Landas sist så den kan bära resultatet av N2 och N3.

Täcker användarberättelser: 11, 12
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 grep på de fyra falska fraserna ger noll kvarvarande träffar; de två talen är ersatta av kommandot som räknar
- [x] #2 npm run bl -- task 365 --plain visar den mätta mekanismen och pekaren mot T166
- [ ] #3 npm run bl -- task 239 --plain visar AC #3 bockad med run-ID:n
- [x] #4 npm run review:metrics visar minst en kalibrering-rad, med belägg per post
- [x] #5 Hubbens rad rättad i hub-repot som egen commit (eller öppet bokförd som överlämnad till Marcus)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRT (2026-09-19, i PR som buntar TASK-450.8 + TASK-460, D0-klassad per uppdraget):

AC #1 — DELVIS, med avsikt (D0-hårdkravet styr, inte AC-ordalydelsen bokstavligt): av de fyra falska textställena är TVÅ rättade (D0-eligibla) och TVÅ medvetet lämnade orörda (non-D0, bokförda som "ej D0, överlämnad" i PR-kroppen):

- RÄTTAD: CONTRIBUTING.md:380 (staging-mutex-påståendet) — PR-ytan tar aldrig staging-mutexen sedan A7:5/TASK-70.3 (`run_staging: false` villkorslöst); texten korrigerad.
- RÄTTAD: CONTRIBUTING.md (18-spec-filer-påståendet) — talet ersatt med en hänvisning till `npx playwright test --project=acceptance --list` i stället för ett hårdkodat tal.
- EJ RÄTTAD (non-D0): `scripts/acceptance-urval.sh:12` bär samma "alla 18 spec-filer"-fras — filen matchar ingen D0-glob-post, kräver en egen kod-klassad skiva.
- EJ RÄTTAD (non-D0): `tests/kontraktsvakt/kontraktsfall.ts:25-26` ("ALLA SJU FIXTURHANDLERS BEVAKAS") — samma skäl, `tests/kontraktsvakt/**` är inte D0 (bara `tests/vale-regression/**` är det).
Utöver planens fyra: ADR-082:s "nio värden"-felräkning (N2 runda 3-fyndet, delvis samma felklass) rättad till "åtta värden" med korrekt GitHub-referens (docs/** är D0).

AC #2 — KLAR: `backlog/tasks/task-365`s rotorsak ersatt med den mätta N3-mekanismen (post-merge.yml skickade bara toppcommiten till classify-post-merge.sh; kön kan landa upp till tre PR:er i en push; en textändring på toppen dolde kod under) och pekad mot `tasks/threads/T166-...md` (nu `lifecycle: closed`, löst i TASK-450.2/PR #2526). Verifiera: `npm run bl -- task 365 --plain`.

AC #3 — EJ GÖRBAR, DIVERGENS UPPTÄCKT (ADR-086-premisspass): uppdraget/planen citerade "31 gröna acceptance-nätter i följd 2026-08-17 till 09-16" som belägg för att bocka TASK-239 AC #3. Men TASK-239:s EGET kort blev ÅTEROPPNAT av S125 2026-09-17 med en NY räkningsregel: "AC #3 mäts efter tre gröna nätter i rad från och med första gröna natten efter #2491:s landning." PR #2491 (dependency-fix, sharp/smol-toml) landade 2026-09-17T11:06:28Z. Endast EN schemalagd nattkörning har skett sedan dess (2026-09-18T05:44Z, run 35311984679 — Acceptance-jobbets tre shards samtliga success, verifierat). Nästa nattkörning (2026-09-19) har INTE körts än (UTC-klockan var 22:51 samma dag som denna PR byggdes). Alltså 1 av 3 krävda nätter — AC #3 kan INTE ärligt bockas i dag. `TASK-239` är därför LÄMNAD ORÖRD (ingen ändring gjord på det kortet i denna PR). Bokfört öppet, inte tyst gissat.

AC #4 — KLAR: `npm run review:kalibrering` kört en gång, PR #2212 (TASK-361 r2, stämplad MEDEL 2026-09-02) mot TASK-431 (min-w-0-regressionen i produktion, upptäckt av Marcus 2026-09-07) — granskarens egen sammanfattning i PR #2212 noterade att den "kunde varken köra a11y-svep eller visuellt verifiera själv", exakt den blinda fläck som fem dagar senare blev en produktionsbugg. `npm run review:metrics` visar nu 1 kalibreringspost (av 262+1=263 totalt sedan denna körning) med full "Fångst"-text som belägg. De övriga sex produktionsfelen ur `docs/research/ci-djupgranskning-2026-09-17/underlag/j8-1-produktionsfel-och-vad-som-skyddar.md` gicks igenom; endast detta ena spårades med tillräcklig säkerhet till en STÄMPLAD, granskad PR inom den tid som fanns — övriga predaterar review-grinden (before 2026-08-24) eller saknar en entydig originerande PR.

AC #5 — EJ RÖRD, PER UPPDRAGETS EGEN INSTRUKTION: "Hubbens rad om popup-frågor... rör den INTE — orkestreraren tar den i hubbens egen kanal." Lämnas obockad med denna not.

OVÄNTAT FYND (ADR-053, registrerat, ej åtgärdat — utanför scope): `scripts/verify-ci-parity.mjs`s diff-klassning läser `git diff --name-only` UTAN `core.quotepath=false`, och micromatch mot D0-globen fäller på varje filnamn med icke-ASCII-tecken (å/ä/ö/—) eftersom git citerar och oktal-escapar sådana sökvägar (`"...f\303\245nga..."`). Denna PR:s SEX filer klassas därför FELAKTIGT som "▶ KOD" av `node scripts/verify-ci-parity.mjs --list` trots att alla sex matchar D0 verbatim (bevisat manuellt: `git -c core.quotepath=false diff --name-only HEAD` ger rena UTF-8-sökvägar, samtliga matchande `**/*.md`/`docs/**`/`.lycheeignore`). Detta repo har GENOMGÅENDE svenska filnamn (backlog-kort i synnerhet) — felet är sannolikt inte unikt för denna PR. Den RIKTIGA CI-klassningen (tj-actions/changed-files) påverkas INTE (annan implementation, hanterar UTF-8 korrekt) — detta är en lokal-verktygs-brist, inte en CI-risk. Ingen åtgärd i denna skiva (script-fix, egen testyta, utanför en dokument-bunt). Flaggat till orkestreraren i slutrapporten.

AC #1 bockad 2026-09-19 (S126 resume 3): de två kvarvarande non-D0-ställena rättades av #2564 (`c5fdc75c`) — scripts/acceptance-urval.sh:12 (talet ersatt av kommandot som räknar) och tests/kontraktsvakt/kontraktsfall.ts:25 ('SJU AV ARTON', med räknekommandot). Verifierat på main `2a825562`: grep på 'alla 18 spec-filer' ger noll träffar; 'ALLA SJU' finns kvar endast som citat av den gamla, rättade lydelsen. AC #5 bockad tidigare i passet (hub #20). KVAR: AC #3 — TASK-239:s fönster har ännu för få nätter; kortet står öppet med avsikt.
<!-- SECTION:NOTES:END -->
