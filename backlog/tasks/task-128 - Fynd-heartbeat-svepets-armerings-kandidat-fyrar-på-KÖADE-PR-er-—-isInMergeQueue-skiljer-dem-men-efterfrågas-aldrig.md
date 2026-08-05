---
id: TASK-128
title: >-
  Fynd: heartbeat-svepets armerings-kandidat fyrar på KÖADE PR:er —
  isInMergeQueue skiljer dem men efterfrågas aldrig
status: Done
assignee: []
created_date: '2026-08-02 16:16'
updated_date: '2026-08-05 15:56'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 215000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt två gånger under TASK-119:s första skarpa natt (2026-08-02, S96): PR #614 och PR #617 flaggades båda som ARMERINGS-KANDIDAT av scripts/heartbeat-svep.sh trots att båda var korrekt armerade och KÖADE. Disambigueringen skriptet självt föreslår (gh pr merge <nr> --auto --merge) svarade i båda fallen 'already queued to merge'.

SYMPTOM: varje PR som armeras och sedan når kön nollar autoMergeRequest (CLAUDE.md § Landning, tabellrad 2: 'PR:en redan CLEAN → köades direkt; inget autoMergeRequest skapas någonsin'). Skriptets kandidat-villkor är automerge==false && !draft && (CLEAN||UNSTABLE) — vilket alltså matchar VARJE framgångsrikt köad PR. Larmet fyrar på normalfallet.

FÖRVÄNTAT BETEENDE: en korrekt armerad och köad PR ska INTE larma. Kandidat-klassen ska bara fånga ALDRIG ARMERAD och UTSPARKAD-med-konsumerad-armering.

ORSAK: skriptets kommentar (rad 286-288) räknar upp TVÅ möjligheter bakom automerge==false och kallar dem 'INTE urskiljbara ur statiskt svar'. Verkligheten har TRE — den tredje är 'redan köad', och den ÄR urskiljbar: GraphQL-fältet isInMergeQueue finns på PullRequest-typen och kan hämtas i samma query. Empiriskt verifierat 2026-08-02 mot PR #617: {"autoMergeRequest":null,"isInMergeQueue":true,"mergeStateStatus":"CLEAN"}. Skriptets EGEN A3b-rubrik (rad 44) nämner isInMergeQueue som något gh pr merge kollar — fältet lästes förbi.

VARFÖR DET SPELAR ROLL: falsklarm på den viktigaste signalen är hur larm slutar läsas. Samma familj som L328/L443 — en vakt vars utslag inte går att lita på efterlevs inte.

ÅTGÄRDSRIKTNING (ej beslutad): lägg isInMergeQueue i GraphQL-queryn och exkludera köade PR:er ur kandidat-klassen; utöka testsviten med ett fall per riktning (köad → EJ kandidat, oarmerad → kandidat). Rör även skriptets kommentar och CLAUDE.md-tabellens läsning.
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
EVIDENS FÖRSTÄRKT (S96-natten 2026-08-02, orkestreraren). Falsklarmet mättes SJU gånger under mekanismens första skarpa natt, inte två: PR #614, #617, och därefter #621, #623, #624 i ett enda svep (plus #617 upprepat två gånger till, level-triggered var 300:e sekund). Samtliga disambiguerade med 'already queued to merge'.

FIXEN VERIFIERAD MOT ALLA INSTANSER: gh api graphql mot PullRequest.isInMergeQueue gav true för #621, #623 och #624 samtidigt som autoMergeRequest var null och mergeStateStatus CLEAN. Fältet hade alltså tystat varje falsklarm korrekt utan att röra de äkta vägarna.

OPERATIV KOSTNAD MÄTT: bruset tvingade orkestreraren att höja svep-intervallet från 90 s till 300 s (skriptets dokumenterade --interval-flagga, mekanismen orörd) för att inte riskera att monitorn stängs av för många events. Det är en reell försämring av vaktens upplösning som fixen skulle återställa.

KLASSAD ready-for-agent / medium (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: inget beslut återstår. Fixen är specificerad och empiriskt verifierad — GraphQL-fältet isInMergeQueue finns på PullRequest-typen och gav true för #621/#623/#624 samtidigt som autoMergeRequest var null. Arbetet är mekaniskt: lägg fältet i queryn, exkludera köade PR:er ur kandidat-klassen, lägg två testfall (köad → EJ kandidat, oarmerad → kandidat) i den befintliga 22-fallssviten. Ingen ADR rörs, inget kontrakt ändras. MEDIUM och inte high: vakten fungerar, den är bara brusig — bruset tvingade fram en upplösnings-sänkning 90→300 s, vilket är en reell men inte blockerande försämring.

BYGG-AGENT (Sonnet 5, claude-sonnet-5), 2026-08-03. Fix implementerad exakt enligt ÅTGÄRDSRIKTNING: isInMergeQueue tillagd i GraphQL-queryn (scripts/heartbeat-svep.sh) och som 6:e TSV-kolumn i --jq-tupeln; KANDIDAT-villkoret kräver nu även inqueue==false. Skriptets header-kommentar (§ fjärde vägen, § EXIT-KODER) och CLAUDE.md § Landning (raden efter "Disambiguera med ett andra...") uppdaterade att beskriva den nya diskriminatorn utan att röra den kvarvarande ambiguiteten (aldrig-armerad vs. utsparkad).

TESTSVIT utökad 22→24 namngivna fall (27 assertions inkl. sub-checks): T9b (KÖAD, isInMergeQueue=true, PR #617-mönstret → EJ kandidat) och T9c (genuint UTSPARKAD, isInMergeQueue=false, i övrigt identiskt → FORTFARANDE kandidat). Alla 15 set_rows-anrop i test-heartbeat-svep.sh fick en 6:e TSV-kolumn (isInMergeQueue) för att matcha skriptets nya read-signatur.

TVÅSIDIGT BEVIS (mot ORÖRD kod före fixen): T9b/T9c + 8 andra fall körda mot det ursprungliga (ofixade) skriptet gav 10 failade av 24 — bl.a. T9b exit 5 (väntade 0) och T9c exit 5 (väntade 4), eftersom den gamla 5-fälts-read-satsen svalde den 6:e TSV-kolumnen in i "rollup"-variabeln och triggade falsk RÖTT. Efter fixen: 27/27 gröna, 0 failade.

GRINDAR: shellcheck --severity=style --enable=all (CI:s exakta flaggor) på båda skripten + .heartbeat-svep-policy.conf → 0/0/0/0. npm run check:docs → 13/13 gröna (CLAUDE.md-frontmatter opåverkad, pre-commit-hooket bumpar updated: automatiskt vid commit). npx biome check . → 0 errors (repo-brett existerande 6 warnings/27 infos, orörda av denna diff, ingen av mina tre filer bland dem — biome lintar inte .sh/.md).

AVVIKELSE MOT UPPDRAGET: uppdraget angav "åtta mätta instanser"; kortets egna Implementation Notes säger uttryckligen SJU (#614, #617, #621, #623, #624, plus #617 två gånger till = 7). Jag har utgått från kortets tal (sju), inte uppdragets (åtta), per ADR-086 — kortet är den primära källan.

PREMISS-PASS (bygg-agent, 2026-08-05): FYNDET ÄR TVÅ HYPOTESER SOM PRÖVADES INNAN BYGGE — resultat: fixen är REDAN på plats, kortet var en bokförings-rest. Ingen ny kod skrevs.

1) Läste scripts/heartbeat-svep.sh rad för rad: isInMergeQueue finns redan i GraphQL-queryn (rad 344) och som 6:e TSV-kolumn (rad 358), och kandidat-villkoret kräver redan inqueue=="false" (rad 415). git log -S"isInMergeQueue" -- scripts/heartbeat-svep.sh visar exakt EN träff: commit 2d6bad0e ("fix(scripts): [TASK-128] heartbeat-svepets armerings-kandidat larmar inte längre på köade PR:er"), landad via PR #645 (mergedAt 2026-08-03T12:22:22Z, merge-commit 1e9247a5). git merge-base --is-ancestor 1e9247a5 HEAD bekräftar att den commit:en är förfader till denna worktrees HEAD (2519c7f2). CLAUDE.md § Landning-raden "Fixad i TASK-128" är alltså VERIFIERAD SANN, inte en hypotes som visade sig fel.

2) gh pr checks 645 bekräftar CI grön per jobb på den landade fixen: samtliga required-jobb (CI Passed or Skipped, CodeQL, Docs link check, Acceptance, Pure+Build, Lint+Audit+TypeCheck, Analyze×2, Detect changed files) pass; A11y/Staging/Staging sentinel purge legitimt skippade (samma D0-klassning som alltid). DoD #3 ("CI grön per jobb på pushad commit") är därmed uppfyllt av den redan landade fixen och bockas här mot detta verifierade bevis, inte mot en ny commit.

3) Verifierade även uppdragets premiss 2 (isInMergeQueue INTE i gh pr list --json): skriptet hämtar fältet via gh api graphql (rad 335-360), inte via gh pr list --json — konsistent med den premissen.

4) FÄRSKT TVÅSIDIGT BEVIS byggt denna session (den historiska notisen ovan hävdade redan tvåsidigt bevis, men jag byggde ett eget oberoende): tog en scratch-kopia av heartbeat-svep.sh, tog bort exakt raden '&& "${inqueue}" == "false"' ur kandidat-villkoret (rad 413-415), körde scripts/test-heartbeat-svep.sh mot den REVERTERADE koden → 35 passerade, 1 FAILADE: T9b (KÖAD, isInMergeQueue=true) gav exit 4, väntade 0 — exakt den regression fixen skyddar mot. Återställde med git checkout -- scripts/heartbeat-svep.sh (git diff --stat tomt efteråt, git status rent), körde om testsviten mot ORÖRD/fixad kod → 36 passerade, 0 failade, exit 0. Ingen spårad fil lämnades ändrad.

OVÄNTAT FYND (registrerat, EJ åtgärdat — utanför detta korts scope): scripts/heartbeat-svep.sh rad 126 och rad 426 föreslår fortfarande disambigueringskommandot 'gh pr merge <nr> --auto --merge'. Per CLAUDE.md § Landning (uppdaterad 2026-08-04, S97) är strategiflaggan BORTA ur formen sedan dess — exakt det kommandot svarar nu '! The merge strategy for main is set by the merge queue' och exit 1. Skriptets egen ALARM-text ger alltså en instruktion som numera felar. Ej fixat här (scope-beslut, rapporterat till orkestreraren i stället för att fatta det på eget bevåg) — kandidat för nytt fynd-kort eller tråd.

Status lämnas OFÖRÄNDRAD (To Do) och Done sätts INTE av denna agent — det är orkestrerarens steg efter egen CI-verifiering av DENNA (bokförings-)commit, per bygg-agentens ALLTID-PÅ-regel.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
STÄNGD 2026-08-05 (S96 femte resumen, orkestreraren) mot verifierat tillstånd — inte mot nytt arbete.

Fixen var redan landad när kortet plockades: commit 2d6bad0e via PR #645, mergad 2026-08-03T12:22:22Z. scripts/heartbeat-svep.sh hämtar isInMergeQueue i sin GraphQL-query, exponerar det som TSV-kolumn och kräver inqueue == 'false' i kandidat-villkoret. Köade PR:er larmar därmed inte längre.

Kortet stod To Do i två dagar efter att arbetet var gjort — en bokförings-rest, upptäckt först när en agent sattes på det.

BEVIS UTÖVER LÄSNING (bygg-agenten, oberoende av den ursprungliga leveransen): scratch-borttagning av inqueue-villkoret fick regressionstestet T9b att falla (exit 4, väntade 0); återställning gav 36/36 grönt. Skyddet är alltså mekaniskt verifierat, inte bara kodgranskat.

SIDOFYND SOM LEVERERADES SEPARAT: skriptets egen ALARM-text föreslog gh pr merge <nr> --auto --merge — en form upphävd sedan 2026-08-04. Fyndet visade sig ha sju aktiva bärare, inklusive .claude/agents/bygg-agent.md. Rivet i PR #799.

Samtliga fyra DoD bockade; kortet bar inga AC.
<!-- SECTION:FINAL_SUMMARY:END -->
