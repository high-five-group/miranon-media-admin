---
id: TASK-322
title: 'Fynd: katalogägarskaps-hooken fäller falskt på textmönster'
status: Done
assignee: []
created_date: '2026-08-26 04:42'
updated_date: '2026-08-28 06:32'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 595000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`scripts/deny-frammande-huvudkatalog.sh` matchar huvudkatalogens sökväg + git-underkommando som STRÄNGAR i kommandot/cwd-läget vid anropstillfället, inte det faktiska målet efter en inbäddad `cd`. Källmärkt (S112 resume 1, 2026-08-26): VERIFIERAT mot koden (rad 564-577, 508-514): Väg 1 ('arbetskatalogen är huvudkatalogen') läser hookens cwd-fält SATT VID ANROPSTILLFÄLLET — en inbäddad 'cd <egen worktree> && git checkout' fälls alltså felaktigt om anropande sessions cwd var huvudkatalogen, trots att git-skrivningen sker i worktreen. _prova_segment fångar bara underkommandots NAMN (sub=branch) och hoppar över flaggor efteråt — 'git branch --merged' (ren läsning) matchar därför samma väg som en skrivande git branch. BÅDA REPRODUCERADE LIVE i denna session: 'git branch --list' mot huvudkatalogen nekades av hooken med skälet 'kommandot pekar explicit på huvudkatalogen' trots att --list är en läsning. DIVERGENS, FLAGGAD: uppdragstextens instans-attribuering (orkestreraren x4, bunt A/D-agenterna, research-passet x3, review-agenter x2) hittas INTE i den citerade källan (docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md paragraf Sidofynd 2 dokumenterar bara 3 instanser, samtliga från research-passet). Huvudkatalogens .claude/hook-fallningar.jsonl (mätt 2026-08-26, 18 nekanden idag för denna hook) saknar agent-identitetsfält och kan inte styrka den specifika fördelningen — HYPOTES, obelagd, pröva vidare vid genomförande. DIVERGENS, TEKNISK: 'for-loopar och mapfile som för komplexa' matchar INTE denna scripts kod (ingen komplexitetsheuristik finns i deny-frammande-huvudkatalog.sh). Den matchar i stället Claude Code-HARNESSENS egen, separata worktree-isoleringsspärr (engelsk text 'too complex to verify', se CLAUDE.md paragraf Worktree-isoleringens gräns) — en mekanism UTANFÖR detta repos scripts, ej fixbar av AC 1:s testsvit. Självupplevt denna session på ett kommando helt utan git. Nästa agent bör skilja hook-buggen (fixbar här) från harness-begränsningen (ej fixbar här) innan AC 1 påbörjas. 'git worktree remove <path>' + 'prune' i samma kommando och kommandon med arbetskatalog i /private/tmp: delvis korroborerat i huvudkatalogens hook-fallningar.jsonl (1 resp. 5 träffar 2026-08-26) men inte oberoende kod-verifierat som falska (worktree remove av EGEN worktree-post är en legitim skrivning till delat tillstånd per skriptets egen definition — den semantiska frågan om det BORDE räknas som riktat mot huvudkatalogen är öppen, inte kod-bevisad här).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 hookens klassning läser MÅLET (upplöst sökväg/cwd vid faktisk git-exekvering), inte strängförekomst vid anropstillfället, med tvåsidig testsvit för instansklasserna: cd+git-checkout, branch --merged, worktree remove+prune, /private/tmp-arbetskatalog
- [x] #2 läskommandon (branch --merged, worktree list, status, log) fälls aldrig — bevisat med testsvit
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRT (2026-08-28), TVÅ RUNDOR. Runda 2 efter extern granskning som fann en SÄKERHETSREGRESSION införd av runda 1.

═══ RUNDA 1 — klassningen läser MÅLET ═══
Målkatalogen upplöses per segment (cd-spårning, kumulativ -C, --work-tree, normaliserad med 'cd … && pwd -P') och prövas med gits EGEN upplösning: 'git -C <mål> rev-parse --git-dir == --git-common-dir == COMMON_DIR'. Textmönstret kvar ENBART som reservväg. Läs/skriv-klassningen flagg-medveten och config-driven (branch/tag flaggstyrda; stash omvänd default mot worktree). Fyra falska-positiv-klasser stängda: cd+checkout mot worktree från huvudkat., git -C worktree därifrån, kommandon som nämner sin EGEN worktree-sökväg (worktrees bor UNDER huvudkatalogen så sökvägen bär dess som delsträng), och heredoc-text med git-ord + sökväg.

═══ RUNDA 2 — REGRESSIONEN OCH FYRA PRE-EXISTING HÅL ═══
FYND 1 (error, SÄKERHETSREGRESSION, bekräftad av mig själv): runda 1:s skärpning av reservvägen från 'delsträng' till 'hel sökväg' införde regeln 'en träff följd av / är en underkatalog och räknas inte'. Regeln stämde för worktree-sökvägar men INTE för <HUVUD>/.git, som ÄR huvudträdets delade tillstånd. Följd: 'git --git-dir=<HUVUD>/.git commit' SLÄPPTES där origin/main NEKADE. Granskaren bevisade skadan verkningsfull: 'GIT_DIR=<HUVUD>/.git git reset --hard HEAD~1' från en främmande worktree flyttade faktiskt huvudkatalogens branch-ref bakåt.
LÄRDOM, inskriven i skriptets § SCOPE-GRÄNSER: en skärpning på FÄLL-sidan är alltid också en breddning på SLÄPP-sidan. Regressionen fångades av extern granskning, INTE av de 110 testfall som var gröna när den infördes.

ÅTGÄRDAT (målstyrt, ej textmatchning):
- _upplos_segment (ersätter _mal_for_segment) UPPLÖSER nu '--git-dir=<p>', '--git-dir <p>', och inline miljöprefix 'GIT_DIR=' / 'GIT_COMMON_DIR=' / 'GIT_WORK_TREE=' (plus 'env'-omslag) till målkatalog/git-dir. En git-dir jämförs direkt mot COMMON_DIR via _gitdir_ar_huvudkatalogens — en WORKTREES git-dir (<COMMON>/worktrees/<namn>) är INTE huvudträdet och släpps.
- _prova_segment skalar av inline miljötilldelningar före 'git'. Tidigare var segmentets första ord 'GIT_DIR=…', inte 'git', och HELA segmentet hoppades över utan att ens nå reservvägen.
- Reservvägens underkatalog-regel undantar nu explicit <HUVUD>/.git och <HUVUD>/.git/… — en sökväg in i huvudkatalogens egna git-dir ÄR huvudkatalogen.
- Subshell-tvätt i klassa_kommando: ledande '(' och avslutande ')' strippas per segment. ';'-segmenteringen lämnade tidigare 'push)' som aldrig matchade 'push'.
- Avslagstexten visar nu den GIT-UPPLÖSTA toppnivån (rev-parse --show-toplevel) i stället för den literala -C-katalogen (FYND 4).
- FYND 3: research-dokets Codex-sökväg rättad från 'codex-rs/shell-command/src/…' till 'codex-rs/core/src/command_safety/…'. Verifierat av mig med 'gh api repos/openai/codex/pulls/10258/files' — PR:en rör core-crate:n. Rättelsen är bokförd som en synlig not i doket; citaten och slutsatsen var korrekta, bara crate-namnet var fel. Samma fel rättat i skriptets kommentar.

═══ BASELINE-JÄMFÖRELSE (21 former, mot origin/main@90edf82b) ═══
Min fix är STRIKT STARKARE än baseline på samtliga 21 punkter. Baseline NEKAR 2 av de 7 elaka; min fix nekar 7/7. Baseline har dessutom 3 FALSKA POSITIVER som min fix släpper korrekt ('--git-dir=<H>/.git branch --merged' som är en LÄSNING, '--git-dir=<worktree>' och '(cd <egen worktree>; git commit)').
METODVARNING, mätt på mig själv: mitt FÖRSTA baseline-försök visade 'baseline släpper allt' och motsade granskaren. Orsaken var min egen rigg — baseline-kopian i scratchpad saknade 'lib/jq-guard.sh' och dog på rad 301, så tomt stdout lästes som SLAPP. En sanity-check (nekar baseline ETT enkelt fall?) avslöjade det. Granskarens mätning var korrekt hela tiden. Lärdom: en jämförelse mot en kopierad artefakt måste sanity-testas i den riktning man förväntar sig ETT känt utfall, annars mäter man 'skriptet kan inte köras'.

═══ DE SJU ELAKA FORMERNA, mätt mot slutlig kod (framling + levande ägare) ═══
1. git --git-dir=<H>/.git commit → NEKA · 2. git --git-dir <H>/.git commit → NEKA · 3. GIT_DIR=<H>/.git git reset --hard → NEKA · 4. GIT_WORK_TREE=<H> git checkout -f → NEKA · 5. GIT_DIR+GIT_WORK_TREE kombinerat → NEKA · 6. (cd <H>; git push) → NEKA · 7. (cd <H> && git commit) → NEKA.
MOTPROV: samma former som LÄSNINGAR → SLAPP (3/3); ÄGAREN själv → SLAPP (3/3); en WORKTREES egen git-dir → SLAPP (2/2); subshell mot egen worktree → SLAPP (2/2); 'env GIT_DIR=' → NEKA; '( git -C <H> branch -d x )' → NEKA.

═══ STÄLLNINGSTAGANDE, 'git worktree remove/prune' (kortets öppna fråga) ═══
Räknas INTE som riktade mot huvudkatalogen när de körs från en annan katalog. ADR-090 beslut 2 skyddar huvudträdets ARBETSTRÄD och INDEX; en session som tar bort sin EGEN worktree rör varken ägarens arbetsträd, index eller HEAD. Faller ut av målregeln UTAN särregel — kört från en worktree är målet den worktreen (släpps), kört I huvudkatalogen är målet huvudkatalogen (nekas). KVARVARANDE LUCKA, öppet skriven i § WORKTREE-OPERATIONER: en session kan ta bort en ANNAN sessions worktree-post inifrån sin egen worktree; låg skada, kräver ett ägarregister per worktree som inte finns.

═══ RESEARCH (primärkällor, docs/research/git-las-skriv-klassning-och-malkatalog-2026-08-28.md) ═══
- code.claude.com/docs/en/hooks.md verbatim: 'cwd follows Claude: the cwd field in the hook's input JSON is the worktree root after Claude enters a worktree, and the new directory after Claude runs cd.' ⇒ cwd är dynamisk, rätt BAS, men ser inte en cd INUTI samma kommando — därav cd-spårningen.
- git-scm.com/docs/git verbatim: 'each subsequent non-absolute -C <path> is interpreted relative to the preceding -C <path>' ⇒ kumulativ -C. Samma sida: '--git-dir … The --git-dir command-line option also sets this value' ⇒ flagga och miljövariabel styr samma värde, vilket runda 2 speglar.
- Mätt live (git 2.50.1) i worktree: --git-dir → .git/worktrees/<namn>, --git-common-dir → delad .git. Invarianten målprövningen vilar på.
- OpenAI Codex CLI PR #10258 + codex-rs/core/src/command_safety/is_dangerous_command.rs: klassar per underkommando OCH flagga på TOKENISERAD argv; 'short_flag_group_contains' fångar staplade former. Ändrade implementationen i runda 1 (staplade flaggor, --delete=).
- OWASP OS Command Injection Defense Cheat Sheet verbatim: 'these must be validated against a list of allowed commands' + 'Positive or allowlist input validation' ⇒ ingen shell-parser byggd.

═══ GRINDAR (mätta, ej uppskattade) ═══
Testsvit 133/133 gröna, exit 0 (61 före TASK-322 → 110 efter runda 1 → 133 efter runda 2; SIDA 12 bidrar 22 fall i FYRA riktningar: skrivningar nekas · samma former som läsningar släpps · ägaren släpps · worktrees egen git-dir släpps). shellcheck --severity=style --enable=all över hela CI-listan: exit 0. bash 3.2 (/bin/bash, macOS-golvet): 133/133. npm run check:docs: exit 0 (14 grindar per skriptets egen slutrad). Bash 5 ej mätt lokalt (ej installerad) — CI mäter.

═══ SKARPBEVIS-SKULDEN — ÖPPEN, mekanisk orsak ═══
Hooken är registrerad CLAUDE_PROJECT_DIR-relativt, och CLAUDE_PROJECT_DIR pekar på HUVUDKATALOGEN, inte worktreen. Differentialmätning: skriptet kört manuellt mot verkligt tillstånd beter sig rätt, men samma kommando genom HARNESSET fälldes med den GAMLA träffvägs-strängen — huvudkatalogens kopia är oförändrad. Följd, generell: en worktree-isolerad agent kör alltid huvudkatalogens hook-version, så en hook-fix kan STRUKTURELLT inte skarpbevisas av agenten som bygger den. Skulden betalas när PR:en landat OCH huvudkatalogen fast-forwardats.

═══ DIVERGENSER ═══
(1) skripthuvudets sektion heter '§ SCOPE-GRÄNSER, öppet skrivna' (rad 262), inte '§ Kända begränsningar'; radintervallet stämde. (2) Uppdragets övriga rad-referenser var EXAKTA. (3) Harnessets 'too complex to verify' bekräftades SEX gånger under bygget — den fällde kommandon helt utan git (python3-heredoc, echo, npm-pipeline, gh pr create-heredoc, en sammansatt ls). Utanför detta repos kod, ej fixbar här. (4) Min egen felaktiga baseline-mätning, se METODVARNING ovan — rapporterad öppet eftersom den motsade granskaren och jag hade kunnat bygga vidare på den.

## Stängning (S112 resume 2, 2026-08-28 ~10:00)

Landning: PR #2044, merge-commit `71bbcadb` (kön, CI grön per jobb). Två granskningsrundor: runda 1 satte risk HÖG — `git --git-dir=<HUVUD>/.git commit` från främmande worktree släpptes (regression mot main) + två förexisterande hål (`GIT_DIR=… git`, subshell-parentes); runda 2 (e1262efa) fixade alla via målstyrd upplösning av --git-dir/GIT_DIR/GIT_COMMON_DIR/GIT_WORK_TREE/env + segment-tvätt; 133/133, 12/12 elaka former NEKA i granskarens egen rigg, verklig skada-blockering verifierad (`GIT_DIR=… git reset --hard HEAD~1` → NEKA, ref orörd). Risk låg i r2. **Skarpbevis-skulden ÖPPEN med mekanisk orsak:** hooken körs via `CLAUDE_PROJECT_DIR` = huvudkatalogen, vars skriptkopia är den gamla tills huvudkatalogen fast-forwardats (S108 äger den; S108:s session-end pågår). Betalas i S112:s nästa svep efter ff: provocera `cd <worktree> && git checkout -b x` från huvudkatalog-cwd (ska SLÄPPAS nu) + `git --git-dir=<HUVUD>/.git commit` från främmande session (ska NEKAS).

## Skarpbevis BETALT (S112 resume 2, 2026-08-28 ~14:20, efter huvudkatalogens ff till cd98862a)

Genom harnesset mot huvudkatalogens nya hook-kopia: (1) `git -C <HUVUD> log` från främmande session → SLÄPPT (gamla nekade läsning) = AC #2 · (2) `git --git-dir=<HUVUD>/.git branch -d zzz` → NEKAD med den målstyrda texten ("riktar git-katalogen mot huvudträdets delade .git") = r1-regressionen stängd i drift · (3) `git -C <egen worktree> status` → SLÄPPT (prefix-fallet borta). Skulden stängd.
<!-- SECTION:NOTES:END -->
