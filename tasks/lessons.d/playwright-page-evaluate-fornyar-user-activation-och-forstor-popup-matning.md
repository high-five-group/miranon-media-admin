# `page.evaluate` förnyar sidans user activation — därför kan `expect.poll` aldrig mäta popup-blockering

**Ska ett Playwright-test bevisa att en popup BLOCKERAS: vänta tyst
(`page.waitForTimeout`) och läs EN gång. Varje `page.evaluate` räknas som en
användargest och startar om Chromes transient activation-fönster, så ett
`expect.poll(() => page.evaluate(…))` håller popup-tillståndet vid liv under
hela sin egen väntan och gör mätningen meningslös — tyst, och med grönt
resultat på fel grund.** `[UNIVERSAL]`

Mätt (TASK-309.26, 2026-08-28, riktig Chrome med popup-blockeraren på, 6 s
fördröjning, `navigator.userActivation.isActive` avläst i samma ögonblick som
`window.open` anropades):

| väntan under de 6 sekunderna | utfall | `isActive` vid `open` |
|---|---|---|
| `page.waitForTimeout` (tyst) | BLOCKERAD | `false` |
| `page.evaluate` var 100:e ms (= det `expect.poll` gör) | **ÖPPNAD** | **`true`** |

Fällan är tyst i båda riktningarna. Skriver man den negativa kontrollen med
`expect.poll` — husets normala och annars helt riktiga sätt att vänta in ett
värde — mäter testet inte längre popup-policyn utan sin egen pollning. Den
första versionen av `dokument-forhandsgranskning-popup-policy.acceptance.
test.ts` gick i den: den mätte att en popup öppnades och trodde att den mätte
att popup-skyddet släppte igenom den.

**Skilj alltid `undefined` från ett popup-fynd.** Samma test fällde senare med
`Received: undefined` i full parallell svit men passerade ensamt. Orsaken var
en ANNAN: den flik testet öppnat hade fokus, vilket gör appens sida till en
BAKGRUNDSFLIK — och Chrome strypar timers i bakgrundsflikar, så 6 s-timern
drog långt över sin tid under last. `nyFlik.close()` + `page.bringToFront()`
före den negativa kontrollen löser det (förmätning: öppen respektive stängd
flik gav båda BLOCKERAD, så stängningen påverkar inte vad som mäts). En tyst
väntan kan inte anpassa sig efter last, så marginalen ska vara tilltagen —
och en explicit `toBeDefined()` före huvudassertionen skiljer "handlern hann
inte köra" från "popupen öppnades".

**Bakgrund som gör lärdomen värd att minnas:** hela anledningen att mätningen
behövdes är att Playwrights BUNDLADE Chromium aldrig blockerar en popup —
`chromiumSwitches` (`playwright-core` 1.62.1, `lib/coreBundle.js`) skickar
`--disable-popup-blocking` vid varje launch, och även med den flaggan
BORTTAGEN (verifierat i processens kommandorad via `ps`) öppnades en popup
helt utan användargest. Ett popup-bevis kräver därför `channel: 'chrome'`
PLUS `ignoreDefaultArgs: ['--disable-popup-blocking']`; utan båda mäter man
ingenting. `launchOptions` går bara att sätta top-level i en fil, aldrig i
ett `describe`-block ("Cannot use({ launchOptions }) in a describe group,
because it forces a new worker").
