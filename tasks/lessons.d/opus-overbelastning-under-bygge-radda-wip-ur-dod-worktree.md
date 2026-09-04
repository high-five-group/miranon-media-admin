# Opus-överbelastning mitt i ett bygge: rädda WIP ur den döda agentens worktree i stället för att börja om

**En bygg-agent som dör mitt i arbetet på grund av modell-endpointens
överbelastning (529/500-fel) förlorar inte sitt ocommittade arbete — det
ligger kvar i agentens worktree tills någon rör den.** Mätt 2026-09-03
(S115, `tasks/sessions/2026-09-03-session-115.md` Del 7, `368.5`/`#2267`
runda 3): Opus-byggaren hade bekräftat läckan rött först (testet utan
`key`-fixen fick `toHaveCount(0)` → 1) men gav sedan 529/500/529 i tre
återupptagningsförsök i rad. I stället för att starta om från noll räddades
den ocommittade diffen med `git -C <agentens worktree> diff > patch`
(scratchpad `2267-wip.patch`), och en NY bygg-agent — på Sonnet i stället för
Opus, en medveten tier-avvikelse bokförd i uppdraget — applicerade patchen
och slutförde. Den nya agenten behövde dessutom `git checkout
--ignore-other-worktrees` för att kunna checka ut grenen som fortfarande
stod utcheckad i den döda agentens (numera övergivna) worktree. Regel: vid
upprepad endpoint-överbelastning på en byggande agent, rädda WIP ur dess
worktree med `git diff` innan worktreen städas eller ersätts, och bokför
tier-avvikelsen explicit i uppdraget till efterträdaren.
