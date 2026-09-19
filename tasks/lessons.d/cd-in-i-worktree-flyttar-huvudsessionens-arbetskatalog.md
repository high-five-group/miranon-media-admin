# `cd` in i en worktree flyttar harnessets primära arbetskatalog för hela huvudsessionen

`[UNIVERSAL]`

**`cd` in i en worktree flyttar harnessets primära arbetskatalog för
huvudsessionen; read-only-agenter som därefter spawnas i "huvudkatalogen"
rapporterar då syskonpassets ospårade filer i sin egen `git status`.** Det
är inte agenten som är förvirrad — orkestrerarens egen session har
strukturellt bytt arbetskatalog, och varje efterföljande operation som
antar "huvudkatalogen" opererar i praktiken i den worktree som senast
`cd`:ades in i.

Varför `[UNIVERSAL]`: detta är ett harness-beteende (arbetskatalogens
mekanik), inte ett appspecifikt fenomen — gäller varje spoke som använder
`cd` i stället för att hålla huvudkatalogen orörd och delegera worktree-
arbete till subagenter.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 2, Lesson-kandidat 4.
