# Deploy-enheten är funktionen, inte commiten — en delad modul når runtime bara för det som deployats EFTER den

**En ändring i en delad modul landar i EN commit men når runtime i lika många
steg som det finns konsumenter, och bara för dem som deployats efteråt.
Testbädden är alltså inte färsk för att repot är det. Mät deploy-tidsstämpeln
per funktion innan ett rött staging-utfall läses som en kodbugg — och innan
ett grönt läses som ett bevis.**
`[UNIVERSAL]`

Instans (S108, 2026-08-23, Del 16 § A, under skiva 5): **sex** staging-Edge
Functions visade sig vara stale-deployade sedan **2026-08-17** — alltså före
`Mall`/`Källhash`-kontraktet — och redeployades i samma pass.
`send-action-email` var fortfarande stale när passet stängde och bokfördes
öppet i stället för att tigas ihjäl. I samma svep föll `previewEventTemplate`
på att den saknade `mall`-fältet och hade 400:at mot den nya kontraktsformen.

**Det generella:** prod-sidan har disciplinen nedskriven — läs `UPDATED_AT`,
inte `VERSION`, och en driftkarta härledd ur git är en HYPOTES om prod, inte
en mätning (`CLAUDE.md` § Prod-EF-deploy; `[[L204]]`, `[[L216]]`, `[[L332]]`).
Staging saknar den, eftersom staging antas följa med automatiskt. Det gör den
inte: staging deployas av den som råkar behöva den, funktion för funktion.
Följden är värre i staging än i prod, för staging är där BEVISEN produceras —
en grön svit mot en stale funktion bevisar att gammal kod fungerar, och det
beviset läses som att den nya gör det. Regeln gäller varje plattform där
deploy-enheten är mindre än repot: serverless-funktioner, lambdas,
container-per-tjänst.
