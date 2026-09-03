# Instrumenteringsloggen konfliktar mellan parallella sessioner — säkra raderna i scratchpad, merga som union

Två sessioner som var för sig kör `review-loop-beslut.mjs` appendar rader
till `docs/reference/review-instrumentering.jsonl` i sina egna träd; den
som landar sist får en konflikt på filens slut, och en modifierad logg
blockerar dessutom varje `git checkout` mellan grenar i den egna worktreen.
Mätt 2026-09-03 (S116 ‖ S115): `#2251` blev DIRTY på exakt den filen, och
tre gren-byten i S116:s worktree stoppades av den omodifierade loggen tills
raderna säkrats. Formen som höll: efter varje loop-beslut `git diff <logg>
| grep '^+{' | sed 's/^+//' >> <scratchpad>/instr-rader.jsonl`, sedan `git
checkout -- <logg>` före gren-byte; vid landning: gren från färsk
`origin/main`, `cat <scratchpad-rader> >> <logg>`, och vid rebase-konflikt
`git checkout --ours` + append (union — raderna är oberoende JSON-poster,
ordningen spelar ingen roll). Samma sak gäller ett korts kopia i
orkestrerarens worktree när kortet reser med agentens PR: en ospårad kopia
blockerar `git checkout` av agentens gren — flytta kopian till scratchpad så
snart agenten spawnats, agentens version är den kanoniska.
