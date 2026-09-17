# Tidsinställd landmina: fixturtoken som går ut relativt en frusen klocka plus ett test som installerar riktig tid

**[UNIVERSAL] Ett fel som dyker upp på ett DATUM och inte vid en commit är
ett tidsberoende, inte en regression — kontrollera först att `main` är
oförändrad (`git log`) innan koden misstänks. En fixturvärld med fryst "nu"
(`setFixedTime(FROZEN_NOW)`) och en token som går ut `FROZEN_NOW + 24 h` är
säker bara så länge INGET test ersätter frysningen; Playwrights
`clock.install()` utan `time` startar fejkklockan på riktig systemtid, och
när den passerade tokenens utgång började appen förnya sessionen mot ett
omockat anrop.** Mätt 2026-09-17 (S125, `TASK-448`, #2491): nightly 16/9
kl 05:50Z grön, 17/9 kl 05:57Z röd; gränsen låg 90 s FÖRE `exp` eftersom
Supabase-js förnyar proaktivt (`EXPIRY_MARGIN_MS`) — tvåsidigt bevis
07:55Z grönt, 07:59Z rött. Analysagenten gissade "ny commit"; `git log`
falsifierade det på en rad. Fix i två skyddsräcken: installera klockan på
den frusna tiden (`install({ time: FROZEN_NOW })`) OCH lägg tokenens utgång
långt fram (+10 år) så en framtida ofrusen klocka inte blir en ny mina.
Sök alla kopior av formeln (fyra andra testfiler bar den, `TASK-449`).
