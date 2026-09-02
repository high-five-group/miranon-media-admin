# Acceptance-jobbets timeout-marginal krymper under kö-last, och en timeout konsumerar armeringen

Acceptance-jobbets väggklocka växer redan monotont mot sitt 12-minuterstak
(dokumenterat i `TASK-239`), men marginalen krymper ytterligare när flera
PR:er ligger i merge-kön samtidigt, eftersom kö-lasten förlänger den
faktiska körtiden. Mätt 2026-09-02 (S113 paus 9,
`tasks/sessions/2026-08-29-session-113.md` rad 1878): PR `#2215`s
Acceptance-jobb (hermetiskt) föll efter 12m2s under en period med flera
PR:er i kön, vilket sparkade posten ur kön och konsumerade dess armering
(samma "fjärde läge" som CLAUDE.md § Landning beskriver för
`failed_checks`-utsparkning). Regel: när flera PR:er väntar i kön samtidigt,
räkna med att en PR vars svit redan ligger nära taket (Acceptance-klassen)
har högre risk att sparkas ut och behöva omarmeras; landa sådana poster en
i taget i stället för att armera flera parallellt, och prioritera
`TASK-239`-klassens sharding-åtgärd för att återta marginalen.
