# `gh run view --job --log` går inte att läsa förrän hela körningen är klar

`[UNIVERSAL]`

**`gh run view --job --log` går inte att läsa förrän HELA körningen är
klar — ett rött jobb i en pågående körning kan inte diagnostiseras direkt
via den kommandoformen.** Vägen runt (mätt, `TASK-452`/PR #2538): REST-API:t
fungerar oberoende av körningens totalstatus —
`gh api repos/<org>/<repo>/actions/jobs/<job-id>/logs` läser loggen för ett
enskilt AVSLUTAT jobb även medan andra jobb i samma run fortfarande väntar.

Varför `[UNIVERSAL]`: detta är en `gh`-CLI-egenskap, inte specifik för
detta repo — gäller varje projekt som använder GitHub Actions och vill
diagnostisera ett rött jobb innan hela runet avslutats.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 4, Lesson-kandidat 7.
