# En PR skapad med GITHUB_TOKEN får aldrig CI, close/reopen med annan auth triggar `pull_request`-eventet

**[UNIVERSAL] GitHub Actions kör aldrig andra workflows automatiskt på en PR
som skapades av ett anrop autentiserat med det standardgenererade
`GITHUB_TOKEN`, en avsiktlig plattformsspärr mot rekursiv workflow-
triggering. En sådan PR står därför utan CI för alltid, tyst, om den inte
åtgärdas.** Mätt 2026-09-01 (S113 resume 7,
`tasks/sessions/2026-08-29-session-113.md` rad 2091 till 2093): en
baselines-PR skapad med `GITHUB_TOKEN` fick aldrig CI. Åtgärden var att
stänga och återöppna PR:en med en annan autentisering (ett personligt
token, `gh auth`), vilket triggar `pull_request`-eventet på nytt och
startar CI. Fyndet förklarar även äldre baseline-PR:er i repot som aldrig
blivit granskade, de har troligen stått utan CI av samma skäl. Regel: en PR
som skapas programmatiskt via `GITHUB_TOKEN` (t.ex. i ett CI-jobb) måste
stängas och återöppnas med en annan autentisering innan den kan förväntas
få CI, eller skapas med ett PAT/annat token från början.
