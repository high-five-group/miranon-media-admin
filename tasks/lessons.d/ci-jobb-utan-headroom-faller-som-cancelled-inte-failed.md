# Ett CI-jobb utan headroom mot sitt `timeout-minutes` faller som `cancelled`, inte `failed` — och `gh run view` visar bara senaste försöket

**[UNIVERSAL] Ett jobb som når sitt `timeout-minutes`-tak avslutas av GitHub
Actions som `cancelled`, inte `failed` — och `gh run view` visar bara det
SENASTE försöket, så en omkörd körning ser grön ut fast attempt 1 timeoutade.
Diagnosen kräver `gh api repos/<org>/<repo>/actions/runs/<id>/attempts/1/jobs`.**
Mätt 2026-09-03 (S115): jobbet "Acceptance — tvåsidigt bevis
(hermetik-självtest)" i `ci-suite.yml` bar `timeout-minutes: 12` — ett tak
satt för att matcha en jämnstor systervikt, inte den faktiska sviten.
27 nya acceptanstester i S115 (`anmalan-avbokning.acceptance.test.ts` +9,
`anmalan-ombokning.acceptance.test.ts` +18) åt upp marginalen och gav fyra
`cancelled`-avbrott samma dag: PR-run `33758913155` + `33763097230` (`#2267`),
`33760261291` (`#2272`), kö-run `33765539135` (`#2267`, 12 min 18 s — bara
18 s över taket). `gh run rerun --failed` gav grönt samtliga gånger, vilket
dolde felklassen bakom en till synes vanlig flake. Fixat i `#2278`:
`timeout-minutes` höjt 12→20 (≈2× typisk körtid, branschpraxis-headroom, ingen
ny mätserie). Regel: håll ~2× headroom mot uppmätt typisk körtid, läs varje
`cancelled`-utfall som en möjlig timeout innan det avfärdas som flake, och mät
alltid attempt 1 — aldrig bara det senaste.
