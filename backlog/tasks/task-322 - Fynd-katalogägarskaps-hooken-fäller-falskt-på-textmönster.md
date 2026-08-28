---
id: TASK-322
title: 'Fynd: katalogägarskaps-hooken fäller falskt på textmönster'
status: To Do
assignee: []
created_date: '2026-08-26 04:42'
updated_date: '2026-08-28 03:48'
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
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GENOMFÖRT (2026-08-28). Klassningen läser nu MÅLET: målkatalogen upplöses per segment (cd-spårning + kumulativ -C + --work-tree, normaliserad med 'cd … && pwd -P') och prövas med gits EGEN upplösning — 'git -C <mål> rev-parse --git-dir == --git-common-dir == COMMON_DIR'. Textmönstret är kvar ENBART som reservväg när målet inte går att upplösa, och matchar då huvudkatalogen som HEL sökväg (en träff följd av '/' är en underkatalog och räknas inte).

FYRA falska-positiv-klasser reproducerade FÖRE fixen och gröna EFTER (repro-rigg med produktionens topologi): (a) 'cd <worktree> && git checkout' med cwd=huvudkatalogen; (b) 'git -C <worktree> checkout' därifrån; (c) VARJE kommando som nämner sin EGEN worktree-sökväg — Claude Code lägger worktrees i <huvudkatalog>/.claude/worktrees/, så worktree-sökvägen BÄR huvudkatalogens som delsträng och gamla väg 2 träffade alltid; (d) heredoc/citerad text som bär git-ord + sökväg. Klass (c)+(d) var STRUKTURELLT OSYNLIGA för den gamla testriggen, vars worktree låg BREDVID huvudrepot i stället för under det — riggen speglade inte produktionens topologi. Klass (d) mättes live under detta bygge: ett 'cat > fil <<EOF' fälldes som 'git-skrivning (add) mot huvudkatalogen'.

Läs/skriv-klassningen är nu flagg-medveten och config-driven (.katalogagarskap-policy.conf: KATALOG_GIT_FLAGGSTYRDA, KATALOG_GIT_SKRIVFLAGGOR, KATALOG_GIT_LASFLAGGOR_ABSOLUTA, KATALOG_GIT_LASFLAGGOR_MED_VARDE, KATALOG_STASH_LASKOMMANDON). branch/tag avgörs av flaggor; stash har OMVÄND default mot worktree (bart 'git stash' = push = skrivning).

RESEARCH (docs/research/git-las-skriv-klassning-och-malkatalog-2026-08-28.md, primärkällor):
- code.claude.com/docs/en/hooks.md, verbatim: 'Worktrees are different. […] cwd follows Claude: the cwd field in the hook's input JSON is the worktree root after Claude enters a worktree, and the new directory after Claude runs cd.' ⇒ cwd är skalets DYNAMISKA katalog vid anropstillfället, inte projektroten. Bekräftar att cwd är rätt BAS, men också att den inte kan se en cd INUTI samma kommando — därav cd-spårningen.
- git-scm.com/docs/git, verbatim: 'When multiple -C options are given, each subsequent non-absolute -C <path> is interpreted relative to the preceding -C <path>.' ⇒ -C hanteras kumulativt i _mal_for_segment.
- Mätt live (git 2.50.1) i en worktree: --git-dir → .git/worktrees/<namn>, --git-common-dir → delad .git. Det är invarianten målprövningen vilar på.
- OpenAI Codex CLI PR #10258 ('fix: unsafe auto-approval of git commands') + is_dangerous_command.rs på huvudgrenen: klassar per underkommando OCH per flagga på TOKENISERAD argv; 'short_flag_group_contains(arg, d)' fångar staplade former. PR:n listar 'grouped short-flag delete forms (e.g. stacked branch flags containing d/D)' som en faktisk approval-bypass. Detta fynd ÄNDRADE implementationen: _kort_grupp_har_skrivflagga och --delete=-formen tillkom EFTER researchen, med nio nya testfall.
- OWASP OS Command Injection Defense Cheat Sheet, verbatim: 'When it comes to the commands used, these must be validated against a list of allowed commands' + 'Positive or allowlist input validation'. ⇒ ingen shell-parser byggd; § SCOPE-GRÄNSER uppdaterad med vad som kvarstår approximativt.
- Gitolite/git-shell löser samma fråga på PROTOKOLL-nivå (upload-pack=läsning, receive-pack=skrivning) och slipper klassa lokala kommandorader — registrerat som alternativ arkitektur, ej vald här.

STÄLLNINGSTAGANDE, 'git worktree remove/prune' (kortets öppna semantiska fråga): de räknas INTE som riktade mot huvudkatalogen när de körs från en annan katalog. ADR-090 beslut 2 skyddar huvudträdets ARBETSTRÄD och INDEX ('den först startade behåller sin plats i huvudträdet'), och skadan regeln finns för är att skriva över ägarens OCOMMITTADE arbete. En session som tar bort sin EGEN worktree rör varken ägarens arbetsträd, index eller HEAD. Det faller ut av målregeln UTAN någon särregel: kört från en worktree är målet den worktreen (släpps), kört I huvudkatalogen är målet huvudkatalogen (nekas) — att ingen särregel behövdes är ett tecken på att gränsen ligger rätt. KVARVARANDE LUCKA, öppet skriven i skriptets § WORKTREE-OPERATIONER: en session kan ta bort en ANNAN sessions worktree-post inifrån sin egen worktree; låg skada, och att stänga den kräver ett ägarregister per worktree som inte finns.

SKARPBEVIS-SKULDEN — ÖPPEN, med mekanisk orsak (starkare än den vanliga 'filbevakaren kan ha missat'). Differentialmätning enligt CLAUDE.md § En ny hooks skarpbevis: (1) skriptet kört manuellt med identisk hook-JSON mot VERKLIGT tillstånd (riktiga huvudkatalogen, dess riktiga ägarlapp med levande pid 77130) — 9 falska positiver släpps, 4 äkta skrivningar nekas, ägarlappen orörd; (2) samma kommando provocerat genom HARNESSET fälldes ändå, och fällningstexten bar den GAMLA träffvägs-strängen ('kommandot pekar explicit på huvudkatalogen') i stället för den nya ('… (textmönster, målet gick inte att upplösa)'). Orsak, mätt: hooken är registrerad som CLAUDE_PROJECT_DIR-relativ sökväg, och CLAUDE_PROJECT_DIR pekar på HUVUDKATALOGEN, inte worktreen — huvudkatalogens kopia av skriptet har 0 träffar på den nya sektionen. Följden är generell och värd att minnas: en worktree-isolerad agent kör alltid huvudkatalogens hook-version, så en hook-fix kan STRUKTURELLT inte skarpbevisas av agenten som bygger den. Skulden betalas först när PR:en landat OCH huvudkatalogen fast-forwardats — logiken är bevisad, laddningen är det inte.

GRINDAR (mätta, ej uppskattade): testsvit 110/110 gröna, exit 0 — 61 fall före, 49 nya i SIDA 11, varav 28 släpp-fall och 21 motprov som ska nekas (tvåsidigt genomgående; talen räknade ur körningens utdata, inte uppskattade). shellcheck --severity=style --enable=all över hela CI-listan: exit 0. bash 3.2 (macOS-golvet, /bin/bash): 110/110. npm run check:docs: exit 0. Bash 5 kunde INTE mätas lokalt (ingen bash 5 installerad på maskinen) — omätt punkt, CI kör ubuntu och mäter den.

DIVERGENSER mot uppdraget, bokförda: (1) skripthuvudets sektion heter '§ SCOPE-GRÄNSER, öppet skrivna' (rad 262), inte '§ Kända begränsningar' — radintervallet ~264-280 stämde. (2) Uppdragets övriga rad-referenser var EXAKTA: väg 1 på 565-567, HOOK_CWD på 460-464, _prova_segment i 470-515-spannet. (3) Kortets divergens-flagga om harnessets 'too complex to verify' bekräftades TRE gånger under bygget — den fällde kommandon helt utan git (ett python3-heredoc, ett echo, en npm-pipeline), och är alltjämt utanför detta repos kod, ej fixbar här.
<!-- SECTION:NOTES:END -->
