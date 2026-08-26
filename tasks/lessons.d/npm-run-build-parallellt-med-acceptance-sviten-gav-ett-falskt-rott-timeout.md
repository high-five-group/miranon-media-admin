# Att köra `npm run build` parallellt med acceptance-sviten gav ett FALSKT rött 15 s-timeout

Samma acceptance-testfil kördes två gånger i rad utan kodändring mellan
körningarna: en gång medan `npm run build` (+ ett fullt `biome check .`)
kördes SAMTIDIGT i samma worktree, en gång ensam. Den samtidiga körningen
fällde ETT test (`toBeVisible` på ett 15 s-budget-`expect`, testets
FÖRSTA assertion efter `page.goto`) — samma testfil, ORÖRD kod, gick 15/15
grönt i den ensamma körningen 90 sekunder senare, med varje enskilt tests
tid nedkortad ~3–4× (46,4 s → 6,9 s för det test som fällde).

Detta var INTE en flake i testet eller i fixen — det var CPU-kontention:
en fullständig `vite build` + `biome check .` över hela repot pressade
samma maskin som chromium-headless-shell-processerna (flera parallella
worktrees/agenter körde dessutom EGNA Playwright-svep samtidigt, synligt i
`ps aux`). Acceptance-klassens 15 s-`expect`-budget (`playwright.config.ts`,
TASK-74) är härledd mot en normalbelastad maskin, inte mot "bygg + lint +
flera andra agenters browser-instanser samtidigt".

**Regel:** kör inte tunga CPU-bundna DoD-kommandon (`npm run build`, ett
repo-brett `biome check .`) PARALLELLT med en Playwright-svit du samtidigt
vill lita på tidsbudgeten för. Antingen sekventiellt, eller acceptera att en
röd tidsbudget under uppmätt samtidig belastning kräver en ren ISOLERAD
omkörning innan den tolkas som en regression — läs alltid `ps aux` (eller
motsvarande) innan en enstaka `expect`-timeout bokförs som en kodbugg.

Instans: `TASK-309.23`, 2026-08-26.
