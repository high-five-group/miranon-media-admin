# Bevaka en prod-deploy via Vercel-API:t — aldrig `curl` i tät loop mot sajten

**En bevakning som pollade `https://admin.miranon.dev/` var 5:e sekund (60
anrop) för att se när den nya bundlen kom ut utlöste Vercels bot-skydd:
`HTTP 403`, `x-vercel-mitigated: challenge`, en "Vercel Security
Checkpoint"-sida för hela IP:n — och den släppte inte för headless
Chromium heller, så prod-verifieringen som skulle följa blockerades i
minuter.** Mätt 2026-08-30 (S113 resume 3, `TASK-309.46`), på Marcus egen
dator, alltså samma publika IP som hans webbläsare. Vercel-MCP:ns
`list_deployments`/`get_deployment` (`readyState`, `ready`-tidsstämpel,
`alias`) gav redan exakt svaret — deployen var READY 19 s efter build-start —
utan ett enda anrop mot sajten. Regel: bevaka deploy-tillstånd via
plattformens API, och träffa prod-URL:en bara med de anrop verifieringen
själv behöver; en polling-loop mot en publik yta är ett angreppsmönster i
skyddets ögon oavsett avsikt. Bonus-fälla: `grep` på `src="/assets/index-…"`
matchade inte den nya index-filen alls (tom sträng lästes som "ny bundle"),
så loopen hade dessutom gett fel svar — läs `readyState`, inte HTML.
