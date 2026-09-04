# `vercel --prod` ur ett repo med agent-worktrees spränger 15 000-filsgränsen

En prod-runbooks steg för direkt-deploy föll: `npx vercel --prod` avvisade
uploaden med "files should NOT have more than 15000 items, received 35693".
Mätt 2026-09-02 (S113 Del 16, `tasks/sessions/2026-08-29-session-113.md`
rad 1725 till 1735): repot bär agent-worktrees under `.claude/worktrees/`,
och Vercel-CLI:t försöker ladda upp dem eftersom `.vercelignore` inte
utesluter katalogen. Rätt väg blev i stället att låta git-integrationen
bygga och deploya senaste commit automatiskt, aliasat mot produktions-
domänen, verifierat med `get_deployment` (rätt SHA, `source: git`,
`READY`). Fynd: `.vercelignore` bör bära `.claude/worktrees/`
(kort-kandidat, ej mintad vid mättillfället). Regel: kör aldrig
`vercel --prod` direkt ur ett repo som har agent-worktrees på disk utan att
först verifiera att `.vercelignore` utesluter dem, eller förlita dig på
git-integrationens egen deploy i stället.
