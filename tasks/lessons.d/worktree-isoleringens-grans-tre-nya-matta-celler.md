# Worktree-isoleringens gräns är bredare än dokumenterat — tre nya mätta celler

`[UNIVERSAL]`

**Worktree-isoleringen för en agent sträcker sig längre än "git-kommandon
mot huvudkatalogen" — den följer med genom `EnterWorktree`, en
återupptagen session, och `!`-prefixet.** Tre oberoende mätta celler
(S127, 2026-09-18/19), samtliga nya utöver det som redan var känt
(worktree-isoleringens gräns går vid egen huvudkatalog, se
`CLAUDE.md` § Worktree-isoleringens gräns):

1. **`EnterWorktree(path)` in i en ANNAN befintlig worktree** rapporterar
   lyckat byte för en isolerad agent, men varje efterföljande Bash-anrop
   nekas ("working directory resolved to the shared checkout"), och
   `ExitWorktree` nekas från en subagent. Vägen tillbaka är
   `EnterWorktree(path=<egen>)`. Mätt av två oberoende agenter.
   Arbetsformen som fungerar i stället: egen worktree, PR-grenen hämtad
   under ANNAT lokalt namn, push med refspec `HEAD:<pr-gren>` som ren
   fast-forward.
2. **En STOPPAD isolerad agent som återupptas med `SendMessage` hamnar i
   orkestrerarens arbetskatalog, inte i sin egen worktree** (mätt: agenten
   vaknade i en annan worktree, upptäckte det och rörde inget). Ett
   meddelande till en agent som fortfarande ARBETAR rubbar inte
   pinningen. Regel: stoppad isolerad agent ⇒ ny spawn, aldrig
   återupptagning.
3. **`!`-prefixet i en session som gått in i en worktree lyder under
   samma isolering som agenten:** `! cd <huvudkatalog> && git …` avvisas.
   Följd: allt som ska köras i huvudkatalogen av en människa (Marcus)
   kräver ett eget terminalfönster — inte `!`-kanalen i en
   worktree-bunden session.

Varför `[UNIVERSAL]`: samtliga tre celler är Claude Code-harnessens egen
mekanik (`EnterWorktree`/`ExitWorktree`/`SendMessage`/`!`-prefix), inte
appspecifika — gäller varje spoke som kör isolerade worktree-agenter.

Oprövat, anta ingenting: `EnterWorktree` mot ett syskon-REPO (skiljt från
en syskon-worktree i samma repo, som cellerna ovan täcker).

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 8 (celler 1–2,
Lesson-kandidater 16–17) + Del 11 (cell 3, Lesson-kandidat 22).
