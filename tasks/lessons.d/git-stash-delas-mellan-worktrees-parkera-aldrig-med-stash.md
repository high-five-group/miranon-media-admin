# `git stash` delas av alla worktrees — en agent som stashar kan poppa en annan sessions post

**`refs/stash` bor i `.git`-common-dir och är EN lista för hela repot, inte
en per worktree. En worktree-isolerad agent som kör `git stash` följt av
`git stash pop` kan därför få ut en FRÄMMANDE post — en annan sessions
parkerade ändring — och samtidigt förskjuta den andra sessionens
index-nummer under fötterna på den. Parkera aldrig med stash i en
worktree-agent: använd `git diff > <fil>` + `git checkout -- <path>`, eller
en WIP-commit på den egna grenen, och rör aldrig `git stash` alls.**
`[UNIVERSAL]`

Mätt 2026-08-28 (S112 resume 2, `TASK-331`, PR `#2051`). Bygg-agenten
isolerade sin fixturändring för ett rött/grönt-bevis med `git stash` och
fick vid `git stash pop` ut `ed98ea55` — S108:s post *"S108 resume 13:
främmande S112-ändring av task-323 … parkerad, ej min"* — i stället för sin
egen. S108 hade under tiden rapporterat posten som droppad; listan hade alltså
redan rört sig i två sessioner samtidigt. Inget gick förlorat: agentens eget
innehåll låg kvar som en oåtkomlig commit (`8bcee4e2`, hittad med `git fsck
--unreachable`) och återställdes med `git checkout <sha> -- <path>`. Men
felet upptäcktes bara för att agenten läste vad som kom ut — en agent som
litat på pop:en hade committat en annan sessions diff i sin PR.

**Det generella:** samma klass som `TASK-322`:s huvudkatalogs-hook och
grenlistan (`TASK-323`): allt under `.git`-common-dir — grenar, stash, reflog,
`worktrees/`-registret — är delat tillstånd mellan varje session på maskinen,
och en operation som ser lokal ut i den egna worktreen (`stash`, `branch -d`,
`worktree remove`) muterar det. Fråga "bor detta i common-dir?" innan ett
git-kommando i en fleet; om ja är det en delad-tillstånds-operation och kräver
antingen ägarskap eller en form som inte kan träffa någon annans post.
Stash saknar den formen (posterna adresseras med löpnummer som skiftar när
någon annan pushar eller poppar), så regeln är binär: aldrig.
