# En nyspawnad agents worktree grenas från orkestrerarens AKTUELLA HEAD, inte från `origin/main`

**En agent-worktree som skapas via `EnterWorktree` (eller motsvarande
spawn-mekanism) ärver orkestrerarens egen gren och dess aktuella
commit-läge vid spawn-ögonblicket — INTE en ren `origin/main`. Står
orkestreraren på en gren med ocommittat eller icke-landat arbete
(t.ex. en pågående fix-gren) ärver den nya agenten samma commits, och
måste grena om själv för att komma till en ren bas.**

**[UNIVERSAL]**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26): en agent
spawnad för `173.2` fick med sig 4 commits ur orkestrerarens pågående
`ADR-127`-fixgren och fick grena om på egen hand. Orkestrerarens worktree stod då på `fix/adr-127-radcitat` (commits
`cb249085`, `4035fe53`, `85fd5d89`, `20349964` ovanpå main) — harnesset
skapar agent-worktreen ur sessionens aktuella HEAD, inte ur
`origin/main`; samma sak drabbade bunt E-agenten.

**Det generella:** regeln är att STÅ PÅ EN REN GREN (= `origin/main`,
inte en lokal arbetsgren) INNAN nästa agent spawnas i en kedja —
annars ärver varenda spawnad agent orkestrerarens pågående, ofärdiga
arbete som sin startpunkt, vilket är exakt tvärtemot vad en isolerad
worktree är till för. Detta är den spawn-tidiga varianten av samma
princip som `eget-enterworktree-nekar-bash-at-oisolerade-agenter.md`
(isolering är en per-agent-egenskap, inte automatiskt korrekt ärvd) —
här är felet inte att isoleringen saknas, utan att den BAS isoleringen
sker mot är fel.
