# Vite-dev-servern blir stale UTAN grenbyte också, omstarta efter varje agentpass i en lokal iterationsloop

Tråden `T178` hade tidigare bara mätt Vite-staleness kopplad till
grenbyten (`git checkout`). Under en lokal iterationsloop med flera
bygg-agenter i serie på SAMMA gren, med lokala commits och ingen
`git checkout` alls, uppstod stale-servern ändå. Mätt 2026-09-01 (S113
Del 14, `tasks/sessions/2026-08-29-session-113.md` rad 1563 till 1564):
fem separata stale-tillfällen under en enda iterationsloop
(`fix/hem-betalningskort-marcus-iteration`), vilket generaliserar T178,
mönstret är alltså agentpass-handoff mot samma igångkörda dev-process, inte
bara grenbyte. Den rutin som etablerades: starta om Vite-dev-servern efter
VARJE agentpass i en sådan loop, inte bara vid ett faktiskt grenbyte.
Rotorsaken är fortfarande okänd (kandidatspår: Vite 8s transform-cache,
`node_modules/.vite`); `touch` av config hjälper inte, hård omstart krävs.
