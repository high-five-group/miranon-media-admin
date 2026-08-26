# Ett mätt radspann som sätts direkt som `style.height` glömmer boxens EGEN kant under `box-sizing: border-box`

**Mäter du en behållares innehåll (via barnens `getBoundingClientRect()`) och
applicerar talet rakt av som `element.style.height`, under `box-sizing:
border-box` (Tailwind preflight, gäller universellt): behållarens EGEN
`border`-bredd äts av samma tal innehållet skulle fått — resultatet klipper
för tidigt med exakt kantbredden. Kompensera genom att LÄGGA TILL
`borderTopWidth + borderBottomWidth` (`getComputedStyle`) vid mätningen,
inte efteråt.** `[UNIVERSAL]`

Mätt (TASK-309.24): `<ul>` bar `border border-transparent` (1 px, `--mm-*`
neutral tokens) + `box-sizing: border-box` (universell preflight). En höjd
satt till EXAKT radspannet (`fjarde.bottom - forsta.top`, 396 px i det mätta
fallet) gav `clientHeight = 394` — 2 px FÖR LITE innehållsyta, eftersom
border-box-modellen räknar bort kantens 2 px (1 px topp + 1 px botten) FRÅN
den satta höjden i stället för att lägga dem UTANPÅ. Fjärde radens
underkant hamnade därmed 2 px UTANFÖR den faktiskt tillgängliga ytan —
klippt, trots att mätningen var (för det innehållet) matematiskt korrekt.

Diagnosen som avslöjade det: `getComputedStyle(ul).boxSizing` +
`.borderTopWidth`/`.borderBottomWidth` lästa direkt i en Playwright-
`evaluate`, jämförda mot `ul.clientHeight` och den satta `style.height`.
Symptomet (en STÄNDIG, inte sporadisk, 1–2 px-avvikelse mellan avsedd och
faktisk klippgräns) är den signatur som skiljer detta fel från den
sibling-count-beroende avrundningen i den systerlärdomen som föddes i samma
pass (`en-rads-renderade-hojd-...md`) — de två felen samverkade och gjorde
varandra svårare att isolera tills de mättes var för sig.

En vakt som bara kontrollerar `scrollHeight > clientHeight` (rullningsbar
eller ej) fångar INTE detta — felet syns bara om man prövar den EXAKTA
klippgränsen (`scrollHeight === clientHeight` vid gränsvärdet, eller en
direkt jämförelse mot det avsedda radspannet). Två separata, redan gröna
tester i detta repo (GemensamtLage:s "5 och 6 rader"-test) missade felet
helt av just den anledningen tills ett STRIKTARE test (exakt fyra rader,
ingen slack tillåten) byggdes.
