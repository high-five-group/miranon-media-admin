# Två parallella sessioner på samma maskin delar lastbudget — sekvensering fungerar, men bara när den kvitteras åt båda håll

**Maskinens last är en delad resurs som ingen av sessionerna äger. En session
som ensidigt drar ned sin egen flotta löser ingenting om syskonsessionen
fortsätter — och en pausorder som inte kvitteras är en förhoppning, inte en
sekvensering. Formen som mättes fungera: pausorder till egna agenter PLUS
uttryckligt, ömsesidigt kvitterad överenskommelse med den andra sessionen om
vem som får köra tungt.**

Instans (S102, 2026-08-16, "laststormen"): loadavg toppade på **577** — 19
backlog-CLI-processer (gren-skanningen) × 3 samtidiga Playwright-sviter × 2
sessioner. Hanterad med aktiv flottsekvensering: pausorder till egna agenter,
cross-session-samordning med S104 (kvitterad, ömsesidig) och prioritet till
den kritiska fixen. Bokfört i sessionsdokets Del 14.

**Bekräftad andra gången (S102, 2026-08-16/17):** samexistensen med S104
förlöpte friktionsfritt hela natten — S104 landade `#1456`/`#1458`/`#1473`/
`#1477`/`#1480`/`#1481` medan S102 byggde, och merge-kön sekvenserade
landningarna utan att någondera sessionen behövde vänta. Lasten föll från
577 till ~10 efter sekvenseringen.

**Det generella:** flottstorlek är inte en per-sessions-parameter. Vid
staging- eller CLI-tungt arbete ligger det mätta taket runt 5–6 samtidiga
agenter PER MASKIN, inte per session — och den som upptäcker lasten först
äger initiativet att kvittera en ordning med den andra.
