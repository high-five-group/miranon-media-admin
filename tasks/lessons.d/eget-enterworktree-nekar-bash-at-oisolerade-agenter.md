# En orkestrerare som själv EnterWorktree:at nekar Bash åt varje oisolerad agent den spawnar

**Har orkestreraren själv flyttat in i en worktree via `EnterWorktree`,
ärver varje oisolerad (t.ex. `general-purpose`) agent den sedan spawnar
INTE automatiskt samma isolering — och Bash-verktyget nekas för den
agenten. Botemedlet är att ge agenten `isolation: "worktree"` explicit
vid spawn.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24/26, Paushistorik 1 § Lesson-KANDIDATER punkt
2): mätt **två** gånger — vid hub-agentens körning och vid `173.1`:s
fresh-context-körningar. Botemedlet (`isolation: "worktree"` på
agent-anropet) verifierat fungerande i båda fallen. (Den exakta
felutskriften Bash-verktyget gav i respektive fall står inte utskriven
i källan; detalj saknas i källan.)

**Det generella:** isoleringsmekanismen (se CLAUDE.md § Worktree-
isoleringens gräns) är en egenskap hos VARJE agent för sig, inte hos
sessionen som helhet — en orkestrerare som själv sitter i en worktree
ger INTE sina barn-agenter samma isolering automatiskt, och ett
Bash-avslag hos en nyspawnad oisolerad agent är därför inte
nödvändigtvis ett fel i uppdraget utan ett tecken på att spawn-anropet
saknade isoleringsflaggan.
