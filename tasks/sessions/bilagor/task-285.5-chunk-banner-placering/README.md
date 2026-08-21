# TASK-285.5 — chunk-bannerns placering + kortning, PR-bevis

Detta är **PR-bevis för Marcus granskning** (kortets AC #2: "skärmdump bilagd"),
INTE ett facit-lås. Filerna matchar medvetet inte `facit-*`
(`.facit-policy.conf`s `FACIT_BILD_GLOB`) och bär inget `facit.json` — den
regeln finns för konvergens-godkända ytor, och chunk-bannern har enligt
`tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json` (yta
`chunk-banner`) **medvetet ingen egen facit-bild** ("ingen bild låstes, inte
en lucka" — ADR-121 beslut 3 är spec-materia, ingen konvergens-fråga). Denna
mapp lägger alltså INGET nytt lås ovanpå den deklarationen.

## Bilder

- `chunk-banner-form.png` — bannern beskuren till sitt eget kort. Visar
  formen mot meddelanderutans facit (`s109-meddelandefamiljen-konvergens/
  facit.json`, yta `meddelanderutan`): ingen kontur, 4 px vänsterkant i
  varning-färg, tonad bakgrund, rubrik i varning-färg utan punkt, en mening
  brödtext, knappen "Ladda om" högerställd.
- `chunk-banner-i-kontext.png` — samma tillstånd på `/dev/primitives`
  (den nya monteringspunkten för komponentens BETEENDE, se
  `src/routes/dev/primitives.tsx`), full sida. Visar bannern som FÖRSTA
  element ovanför sidans `h1` (samma DOM-ordning som produktionens `AppShell`
  ger den, se `src/components/AppShell/AppShell.tsx`).

Producerade med Playwright mot den lokala `webblasarbeteende`-dev-servern
(`PLAYWRIGHT_WEBBLASARBETEENDE_DEV_SERVER=1`), samma syntetiska
`vite:preloadError`-dispatch som `tests/webblasarbeteende/
app-chunk-laddningsfel.test.ts` använder.

Den mekaniserade PLACERINGS-verifieringen (första barn i `main#main`, i
skalets innehållsbredd, ovanför `h1`) bor i
`tests/acceptance/hem.acceptance.test.ts` (describe "Chunk-bannern —
placering i skalet"), inte i denna bild-mapp — bilderna här styrker bara
FORMEN, som inte är mekaniskt mätbar på samma sätt.
