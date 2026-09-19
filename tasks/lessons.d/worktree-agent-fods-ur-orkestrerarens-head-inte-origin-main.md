# En worktree-agent föds ur orkestrerarens AKTUELLA HEAD, inte origin/main

`[UNIVERSAL]`

**En worktree-agent föds ur orkestrerarens AKTUELLA HEAD, inte ur
`origin/main`.** Mätt (S127, 2026-09-18, bygg-våg 1): tre av fem agenter
ärvde en docs-gren orkestreraren råkade stå på, i stället för en ren bas.
Regel: stå på `git switch --detach origin/main` före varje spawn som ska
ge agenten en ren, förutsägbar bas.

Varför `[UNIVERSAL]`: detta är hur worktree-skapelsen faktiskt fungerar i
harnessen (ärver checkout-läget, inte en fjärrgren) — gäller varje spoke
som spawnar parallella bygg-agenter i egna worktrees.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 4, Lesson-kandidat 5.
