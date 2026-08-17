# Merge-kön gör branch-toppar till icke-ancestors — "är den mergad?" avgörs via PR-status, aldrig via `merge-base`

**Kön bygger om varje post mot `main` plus posterna före den. Den commit som
faktiskt landar är därför en ANNAN commit än grenens topp, och
`git merge-base --is-ancestor <grentopp> origin/main` svarar nej på en gren
vars innehåll ligger i `main`. Avgör "landad?" på PR:ens status eller på om
fjärr-grenen finns kvar — aldrig på ancestor-relationen.**

Instans (S102, 2026-08-17, DoD-driftsvepet, PR **#1508**): svepet
korsverifierade 24 driftande poster mot belägg — **21 PR:er MERGED med exakta
SHA:n** och **37 SHA:n ancestor-prövade**. Ancestor-prövningen var just den
metod som gav fel svar på köade landningar, och klassningen fick därför vila
på PR-statusen. Bokfört som lesson-kandidat i Del 16-skörden.

**Bekräftad en gång till, direkt:** samma dag (2026-08-17) hade en agents
worktree en lokal commit (`1f086671`) som INTE var ancestor till `origin/main`
trots att motsvarande innehåll landat — `git rev-list --count HEAD..origin/main`
gav 2 och `origin/main..HEAD` gav 1. Ett rent ancestor-test hade läst det som
"olandat arbete".

**Det generella:** identiteten hos en commit är inte identiteten hos dess
innehåll. Så snart en mekanism bygger om historik — merge queue, squash,
rebase — mäter SHA-baserad släktskap bara mekaniken, inte om arbetet är
inne. Fråga plattformen som gjorde omskrivningen.
