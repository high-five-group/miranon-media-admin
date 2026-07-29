---
id: TASK-78
title: >-
  Fynd: merge queue bryter post-merge-lagrets ärvda klassning — varje PR som
  inte är först i kön drar full staging-svit I POST-MERGE
status: To Do
assignee: []
created_date: '2026-07-29 00:30'
updated_date: '2026-07-29 10:15'
labels:
  - ready-for-agent
dependencies: []
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-73 gav post-merge-lagret ärvd klassning: en docs-only landning ska INTE dra staging. TASK-70.1 (merge queue) bröt den samma dag, för PR:er som inte är först i sin kögrupp.

### MEKANISMEN — MÄTT, INTE ANTAGEN

scripts/classify-post-merge.sh kräver TRÄD-IDENTITET mellan merge-commiten och PR-headen (rad 189: 'träd-avvikelse … landad diff är inte PR:ens diff') och letar efter en grön körning med event=pull_request på PR-headen (rad 198, 208).

Merge queue bygger post N ovanpå posterna före den. Merge-commitens träd bär därmed MER än PR:ens egen diff så snart PR:en inte är först i kön.

Mätt 2026-07-29 på kvällens två första kö-landningar:

  d9f095b (#404, FÖRST i kön)   merge-träd 373455a == head-träd 373455a  -> klassning ärvd, Verifierande svit SKIPPED
  934188e (#405, ANDRA i kön)   merge-träd 89000ee != head-träd ce04838  -> fail-closed, FULL SVIT inkl. Staging

#405 rörde EN backlog-kortfil. Den drog ändå hela staging-sviten i post-merge.

### VARFÖR DET INTE ÄR OFARLIGT

Fail-closed betyder att utfallet är SÄKERT — aldrig otestad kod. Men:

1. TASK-73:s vinst (2 -> 0 mutex-takers per docs-landning) går förlorad så fort två PR:er köar ihop, vilket är precis vad kön är till för.
2. Fler post-merge-körningar med staging = fler purge-jobb = fler tillfällen för TASK-76:s race. De två fynden förstärker varandra.
3. Effekten är osynlig i normalfallet: en ensam PR är alltid först i kön och klassas rätt. Felet visar sig bara under parallellitet — alltså exakt när A7:s målbild uppnås.

### AVGRÄNSNING OCH VÄGVAL

Detta är INTE ett fel i TASK-70.1 eller TASK-73; det är en interaktion mellan två korrekta skivor som landade samma dag. Ingen av dem kunde se den ensam.

Former att väga, ingen vald:
(a) Klassa på merge_group-körningen i stället för PR-körningen — kön kör ju ci.yml med full klassning på det kombinerade trädet, så beslutet finns redan, på rätt träd. Kräver att skriptet accepterar event=merge_group som källa.
(b) Klassa om från grunden i post-merge mot merge-commitens egen diff mot sin första förälder, utan att ärva alls.
(c) Acceptera kostnaden och dokumentera den.

Form (a) ser starkast ut vid första anblick — merge_group-körningens klassning gäller exakt det träd som landar — men ska prövas mot att kö-körningen kan ha skippats av dedup, och mot vad som händer när en kögrupp innehåller både docs och kod. Rekommendationen ska motiveras mot alla tre och den förkastade bära sitt skäl.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 En docs-only PR som landar som post 2 eller senare i en kögrupp drar INTE staging i post-merge — bevisat med två run-ID från samma kögrupp, positionerna redovisade
- [ ] #2 En kod-PR i samma läge drar FORTFARANDE full svit — kontrollen är fixad, inte borttagen; run-ID redovisat
- [x] #3 En kögrupp som blandar docs och kod klassas som KOD — det säkra utfallet; bevisat skarpt eller, om det inte går att framkalla, härlett ur källan med radhänvisning
- [x] #4 Valet mellan formerna (a)/(b)/(c) motiverat i PR:n; de förkastade bär sina skäl
- [x] #5 Fail-closed-egenskapen bevarad: varje API-avvikelse eller oväntad form ger fortfarande full svit — negativt self-test redovisat
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PRECISERING 2026-07-29, efter Marcus fångst. Den första formuleringen sade att #405 'drog full svit' utan att ange VAR, vilket läser som om PR-grinden påverkades. Den gör den inte.

TRE YTOR, OCH BARA DEN TREDJE ÄR DRABBAD — mätt på #405:

  PR-grinden    run 30410841005  event=pull_request  Test suite SKIPPED   ✅ korrekt
  Merge queue   run 30410912068  event=merge_group   Test suite SKIPPED   ✅ korrekt
  Post-merge    run 30410980946  event=push          Staging (API + E2E) SUCCESS  ← fyndet

VAD SOM ALLTSÅ INTE PÅVERKAS: PR-grindens hastighet är orörd. Klassningen fungerar på både pull_request- och merge_group-ytan; en docs-PR får sitt snabba svar precis som förut, och kön klassar rätt. Hela TASK-70.3:s vinst står kvar.

VAD SOM PÅVERKAS: enbart efterkontrollen på main. Den blir dyrare än den behöver vara för PR:er som inte är först i kön, och varje sådan extra staging-körning är ett nytt tillfälle för TASK-76:s purge-race. Det är kostnaden — inte en trasig grind.

Distinktionen är inte kosmetisk: en läsare som tror att PR-grinden är trasig prioriterar kortet som akut och letar i fel fil.

TREDJE DATAPUNKTEN, 2026-07-29 (femtonde resumen) — och den första som inträffade UTANFÖR en kögrupp med flera poster.

PR `#423` (stängningen av `TASK-72`) rörde TRE filer, samtliga markdown:
`backlog/tasks/task-72 - ….md`, `tasks/lessons.d/registret-mot-disk-….md`,
`tasks/s91-restlistan.md`.

PR-grinden klassade den korrekt: run `30437803614` visar `Test suite: skipped`.

Post-merge för merge-commiten `58a1a10` körde ändå **hela sviten** — `Staging
sentinel purge` success, `Acceptance (hermetisk)` och `Staging (API + E2E)` båda
instansierade.

Träd-jämförelsen bekräftar mekanismen exakt som kortet beskriver den:

  merge-träd (58a1a10^{tree})    c89df4bc1d985e1417032823f80613588f78156e
  head-träd  (58a1a10^2^{tree}) efc0154ab5b6d8c668e4f0b57c576d17a16358fe
  -> AVVIKER -> fail-closed -> full svit

VAD DENNA OBSERVATION LÄGGER TILL kortets två föregående: de mättes på en kväll
med flera poster i kön samtidigt, vilket gjorde det naturligt att läsa felet som
"gäller PR:er som inte är först i kön". `#423` låg ensam i kön. Träden avviker
ändå, eftersom kön bygger posten mot `main`s aktuella spets — och `main` hade
rört sig sedan PR:en skapades. **Villkoret är alltså inte "inte först i kön" utan
"main har rört sig sedan PR-headen skrevs"**, vilket är det normala fallet i ett
aktivt repo, inte ett specialfall.

KOSTNADEN ÄR DÄRMED HÖGRE ÄN KORTET ANTAR. Kortets punkt 1 säger att `TASK-73`:s
vinst går förlorad "så fort två PR:er köar ihop". Rätt formulering är att den går
förlorad så fort någon annan landning hunnit emellan — alltså nästan alltid.

BERÖR TASK-76: samma körning gav ett purge-jobb som inte skulle ha funnits
(09:06-klassen). Kortets egen punkt 2 — fler post-merge-körningar med staging ger
fler purge-jobb — är därmed också belagd av denna observation.

VALD FORM: (a) — ÄRV KÖ-KÖRNINGENS KLASSNING. Landad i scripts/classify-post-merge.sh
som VÄG A, med den befintliga PR-vägen kvar som VÄG B.

MEKANISMEN, MÄTT: merge queue kör ci.yml med `event=merge_group` på EXAKT den
commit som sedan landar — kön skapar merge-commiten i förväg i
`gh-readonly-queue/…` och flyttar `main` dit vid grönt. Ingen ny commit mintas.
Bevis: kö-körning 30438569547 har `headSha` = `58a1a10498106de5…`, vilket ÄR
merge-commiten för `#423` på main.

Det gör VÄG A till en STRIKT BÄTTRE källa än VÄG B, inte en genväg: VÄG B måste
BEVISA med träd-jämförelse att klassningen gäller det landade trädet — VÄG A har
det gratis, av SHA-identitet.

KORTETS TVÅ INVÄNDNINGAR MOT (a), BÅDA PRÖVADE:
1. "kö-körningen kan ha skippats av dedup" — NEJ, strukturellt omöjligt.
   Dedup-steget är grindat av `if [ "${EVENT_NAME}" = "push" ]` (ci.yml rad 419)
   och skriver annars "Dedup ej tillämplig … → full svit" (rad 441). `dedup_hit`
   är därför alltid false på merge_group, precis som på pull_request. Kö-ytan bär
   samma exakta ekvivalens `Test suite skipped` ⇔ should_skip_tests ⇔ D0.
2. "kögrupp med både docs och kod" — klassas som KOD. ci.yml:s D0-steg är en
   ALLOWLIST där only_changed blir true ENDAST när VARENDA ändrad fil matchar
   (tj-actions/changed-files @ pinnad SHA, src/changedFilesOutput.ts:
   `onlyChanged = otherChangedFiles.length === 0 && …`). Minst en icke-matchande
   fil ⇒ false ⇒ full svit.

KÖ-BASEN VERIFIERAS, ANTAS INTE. Klassningen gäller diffen mot kö-basen, så den
är sund endast om basen ÄR merge-commitens första förälder. Basen står kodad sist
i grennamnet och jämförs mekaniskt; avvikelse ⇒ full svit. Detta är VÄG A:s
motsvarighet till VÄG B:s träd-identitet. Empiri:
  `pr-423-dbe1c0dbb2bfa…` ↔ första föräldern `dbe1c0dbb2bfa…`
  `pr-424-58a1a10498106…` ↔ första föräldern `58a1a10498106…`

FÖRKASTADE:
 (b) Klassa om mot merge-commitens diff mot första föräldern — avvisad av
     ADR-077 § Beslut 1 rakt ut: kräver en andra kopia av ci.yml:s glob-listor,
     alltså ny hemvist utan paritetsgrind (restlistans A3-skuld igen).
 (c) Acceptera kostnaden — förkastad av storleken, se mätserien nedan.

MÄTSERIE, fixad vs ofixad över de 14 senaste merge-landningarna på main:
  6 av 14 VÄNDER false → true (43 %). Ingen enda vänder true → false.
  Kod- och workflow-landningar förblev false genomgående (#420, #421, #424;
  #427 rörde .github/workflows/ci-suite.yml ⇒ korrekt exkluderad från D0).

FALSK-GRÖN-KONTROLL: för samtliga 14 landningar som den fixade klassningen
släpper som docs_only=true lästes den faktiskt landade diffen ut och varje fil
klassades mot D0-listan. Utfall: 0 icke-docs-filer. Ingen falsk grön.

SKARPT KONTRASTBEVIS på kortets tredje datapunkt (`#423`, merge-commit 58a1a10):
  ofixad: docs_only=false — träd-avvikelse (c89df4bc1d98 != efc0154ab5b6)
  fixad:  docs_only=true  — 'Test suite' skippades i merge_group-körning 30438569547
Och i kod-riktningen (`#424`, c3d134a7):
  fixad:  docs_only=false — 'Test suite' saknas som eget jobb i kö-körning 30439086378

AC#1 och AC#2 ÄR MEDVETET INTE AVBOCKADE. Båda kräver run-ID från en post-merge-
körning EFTER att fixen landat, och den signalen finns inte medan PR:en är öppen.
Substansen är mätt (se ovan); den formella avbockningen hör till CI-verifieringen.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
