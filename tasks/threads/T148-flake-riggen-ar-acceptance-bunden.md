---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: stable
lifecycle: active
---

# T148 — Flake-riggen är acceptance-bunden trots sin `--projekt`-flagga

> Registrerad i S107 (2026-08-20) ur NavCard-flakemätningen, där riggens
> första serie (n=6) måste kasseras som ogiltig. Triagerad enligt `ADR-053`:
> blockerar inte — mätningen gick att genomföra via en omväg — men en mätrigg
> som tyst mäter fel sak är farligare än ingen rigg alls.

## Felet

`scripts/flake-matserie.mjs` (rad ~466) sätter miljövariabeln **efter**
spridningen av den befintliga miljön:

```js
{ ...process.env, PLAYWRIGHT_ACCEPTANCE_DEV_SERVER: '1' }
```

Ordningen gör att flaggan alltid vinner. Den kapar
`playwright.config.ts`s webServer-ternary (rad 321) till acceptance-porten,
oavsett vad `--projekt` säger.

## Följden, mätt

Med `--projekt a11y` startas fel dev-server. Varje test faller på
`ERR_CONNECTION_REFUSED` — **66 falska fällningar** i den kasserade serien
(2026-08-20).

Felet är tyst i den meningen som gör det farligt: riggen producerar en
komplett, välformad mätserie med hög fällningsfrekvens. Utfallet ser ut som
ett extremt flakigt test. Ingenting i utdatan säger "jag körde mot fel
server".

## Varför det är värt en tråd

Riggen finns för att göra flake-mätningar ärliga — interfolierad A/B,
loadavg per körning, `--retries=0`, rådata per testresultat. `CLAUDE.md`
säger uttryckligen att man aldrig ska bygga en egen mätserie vid sidan av
den, eftersom talen då blir ojämförbara.

Den regeln håller bara så länge riggen mäter det den säger att den mäter.
Ett fel av den här klassen får varje agent som följer regeln att producera
samma falska tal — och att göra det med tilltro, eftersom verktyget är det
sanktionerade.

## Kringgåendet som användes (inte en fix)

`PLAYWRIGHT_TEST_BASE_URL` pekad mot en egen dev-server. Det fungerade för
den enskilda mätningen men löser ingenting: nästa agent som kör
`--projekt <något-annat-än-acceptance>` går i samma fälla.

## Öppna frågor

- Är rätt fix att sätta variabeln FÖRE `...process.env`, eller att härleda
  den ur `--projekt`? Den andra formen är svårare att missbruka.
- Bär `--projekt` andra värden som har samma problem, eller är
  acceptance/a11y det enda paret som krockar?
- Ska riggen fälla högljutt när noll tester ens kunde nå servern? En serie
  där 100 % faller på anslutningsfel är inte en flake-mätning, och riggen
  borde kunna säga det själv.

## Belägg

NavCard-flakemätningen, S107 2026-08-20. Första serien n=6 kasserad; den
giltiga serien (n=10, 110 testresultat) kördes via kringgåendet ovan och gav
A 15/55 fällda, B 0/55.
