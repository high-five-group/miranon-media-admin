# En avslutad agents worktree håller kvar grenen — ta bort den före nästa agent på samma gren

**[UNIVERSAL] `git` tillåter en gren i exakt en worktree. En bygg-agent som
avslutat sitt uppdrag lämnar sin worktree kvar med grenen utcheckad, och
nästa agent (fix-runda, omstämpling) får "already used by worktree" vid
checkout. Ta bort den gamla worktreen (verifiera ren + 0/0 mot origin) INNAN
den nya spawnas; grenen överlever borttagningen.** Mätt 2026-09-17 (S125):
tre gånger — 442-grenen (S124:s agent), #2491-grenen (audit-agenten) och
PR #2498-grenen (TanStack-agenten); den sista upptäcktes av runda 2-agenten,
som stannade korrekt. Bieffekt att känna till: harnesset tar bort en
oförändrad agent-worktree när agenten stoppar, så en återupptagen agent
landar i orkestrerarens katalog och måste skapa sin worktree själv
(`git worktree add` + `EnterWorktree(path)` fungerade). Regel i ett
kommando före spawn: `git -C <wt> status --porcelain | wc -l` = 0 och
`git rev-list --left-right --count gren...origin/gren` = 0 0 → `git
worktree remove`.
