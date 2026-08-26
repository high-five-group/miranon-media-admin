# Ett facit taget med animationer påslagna fryser ett övergångstillstånd — och `page.screenshot` skyddar dig inte

**Sätt `animations: 'disabled'` på varje bild som ska bli ett facit. En bild
tagen medan en in-animation löper fångar ett läge som aldrig är det stabila —
halvgenomskinligt, halvskalat, halvvägs — och varje framtida jämförelse mot
det facit blir ojämförbar av skäl som inte har med ändringen att göra. De två
vägarna i samma bibliotek har MOTSATTA defaults: assertionen skyddar dig, den
manuella tagningen gör det inte.**
`[UNIVERSAL]`

Instans (S108, 2026-08-24, facit-tagningen för skiva 9, `TASK-309.10`, PR
`#1961`): mobil-dialogerna fångades mitt i sin in-animation och blev
halvgenomskinliga i bilden. Mekanismen är belagd i källan —
`src/components/primitives/Modal.tsx` rad 34 ger overlayn
`transition-opacity duration-200 data-[entering]:opacity-0`, och rad 38 ger
panelen `transition-transform duration-200 data-[entering]:scale-95`. Det är
alltså ett **200 ms** fönster där både opacitet och skala är på väg någonstans,
och tagningen landade i det. Fixen står i commit `164190b6`: *"allt med
`animations: 'disabled'` (mobil-dialogerna fångades annars mitt i sin
in-animation)"*.

**Det generella:** samma bibliotek bär två defaults åt motsatt håll, och den
som producerar facit för hand hamnar på fel sida. Verbatim ur typerna
(Playwright 1.62.1): `page.screenshot()` — *"Defaults to `"allow"` that leaves
animations untouched"* (`node_modules/playwright-core/types/types.d.ts` rad
25857); `toHaveScreenshot()` — *"Defaults to `"disabled"` that disables
animations"* (`node_modules/playwright/types/test.d.ts` rad 9673, 9776,
10643). Assertions-vägen bär skyddet inbyggt, medan facit-PRODUKTIONEN — som
per definition går via `page.screenshot()` — måste be om det explicit. Att
grinden sedan är grön bevisar ingenting: den jämför mot referensen, och
referensen är det som är fel. Regeln generaliserar bortom animationer till
allt icke-deterministiskt i fångstögonblicket — en bild som ska bli referens
måste tas i ett läge som är STABILT, inte bara i ett läge som råkade
renderas. Närliggande, redan skriven: `L246` (vol-03) neutraliserar
muspekaren före skärmdumps-jämförelse — samma familj, men den gäller
JÄMFÖRELSEN; denna gäller PRODUKTIONEN av referensen. Syskonlärdom om samma
bilds RUMSaxel: `en-fullpage-bild-ljuger-om-varje-viewport-fast-element.md`.
