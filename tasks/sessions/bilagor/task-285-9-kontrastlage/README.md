# TASK-285.9 — notisfamiljen, hög-kontrast-läge (`prefers-contrast: more`), PR-bevis

Detta är **PR-bevis för Marcus granskning** (kortets AC #2: *"prefers-contrast:
more ger kontur i full intent-färg på varje ruta — skärmdumpar per yta
bilagda"*), INTE ett facit-lås — samma disciplin som
`tasks/sessions/bilagor/task-285.5-chunk-banner-placering/README.md`. Filerna
matchar medvetet inte `facit-*` (`.facit-policy.conf`s `FACIT_BILD_GLOB`) och
bär inget eget `facit.json`.

Samtliga bilder är tagna med **samma emulerade medieläge**:
`page.emulateMedia({ contrast: 'more' })` (Playwright, Chromium), mot den
lokala `webblasarbeteende`-dev-servern
(`PLAYWRIGHT_WEBBLASARBETEENDE_DEV_SERVER=1`). Varje yta gjordes synlig med
samma händelse-simulering som respektive testfil redan etablerat (se
`tests/webblasarbeteende/notisfamiljen-kontrastlage.test.ts` och
`tests/a11y/notisfamiljen.spec.ts` för de mekaniska motsvarigheterna till
dessa bilder — computed `border-width`/`border-style`/`border-color`, inte
bara ögonmått).

## Bilder

- **`uppdateringsnotis.png`** — Uppdateringsnotisen (`/dev/primitives`,
  `mm:app-uppdatering-tillganglig`-eventet skjutet). Facit:
  `tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json` §
  yta "uppdateringsnotis". Se: full kontur runt hela kortet i **info-färg**
  (blå) — i vila bär kortet bara en 4 px vänsterkant, ingen topp-/höger-/
  bottenkant; under `prefers-contrast: more` täcker konturen alla fyra sidor.

- **`offline.png`** — OfflineIndicator (`/dev/primitives`, `window`
  `offline`-event). Samma `Notis`-primitiv och samma facit som ovan (Offline-
  beskedet konsumerar primitiven oförändrad). Se: samma full kontur i
  **info-färg** (blå) — offline-beskedet bär ingen egen intent-färg, det ärver
  Notis-primitivens `info`-form rakt av.

- **`chunk-banner.png`** — ChunkBanner (`/dev/primitives`,
  `vite:preloadError`-eventet skjutet). Formen är meddelanderutans
  (`intent="warning"`), facit: `tasks/sessions/bilagor/
  s109-meddelandefamiljen-konvergens/facit.json` § yta "meddelanderutan".
  Se: full kontur i **varning-färg** (orange/brun) runt hela rutan; rubriken
  "Sidan behöver laddas om" står i samma varning-färg.

- **`messagebox.png`** — Meddelanderutans fyra grundintents samtidigt
  (`/dev/primitives`, sektionen "MessageBox"). Facit: samma
  meddelandefamiljen-manifest som ovan. Se: **info** kontur i blått,
  **success** kontur i grönt, **warning** kontur i orange/brunt, **error**
  kontur i rött — var och en full runt-om, ingen bara vänsterkant. Bilden
  visar även formerna med knapprad/kryss (facit-formens actions-slot och
  kryss-regel), men det AC #2 mäter är enbart konturfärgen.

- **`section-error.png`** — SectionError, det "vanliga felet"-läget
  (`/dev/sektionsfel`, knappen "Kasta sektions-fel"). Samma primitiv-form som
  `messagebox.png`s error-ruta (`intent="error"`), konsumerad av
  `SectionError.tsx`. Se: full kontur i **fel-färg** (rött) runt hela
  alert-regionen.

- **`appfel-fallbacken.png`** — Appfel-fallbacken, den "skarpa" formen
  (`/dev/primitives`, sektionen "AppError: appfel-sidan",
  `appfel-fallback-skarp`-instansen). Facit: `s109-meddelandefamiljen-
  konvergens/facit.json` § yta "appfel-sidan".

  **UNDANTAGET (verifierat visuellt i just denna bild, inte bara påstått i
  PR-texten):** ingen full kontur tänds här under `prefers-contrast: more`
  — bilden visar ENDAST den vanliga 4 px vänsterkanten i rött, oförändrad
  mot normalläget. Det är AVSIKTLIGT, inte ett fynd: facitets egen text
  säger *"Ingen kontur (skuggan bär kanten)"* för just denna yta, och
  `AppErrorFallback.tsx` renderar ENDAST inline `style`-attribut (designvillkoret
  — sidan ska rendera även med ett dött stylesheet). Tailwinds
  `contrast-more:`-variant är en CSS-mediaquery-klass; en komponent som per
  design bär NOLL CSS-klasser kan strukturellt inte använda den. Denna bild
  är alltså facit-bevis för att undantaget HÅLLER, inte ett saknat fynd.

## Producerade med

Playwright (`page.screenshot()` på respektive yt-locator, `contrast: 'more'`
emulerat), samma dev-server och samma händelse-simuleringar som
`tests/webblasarbeteende/notisfamiljen-kontrastlage.test.ts` och
`tests/a11y/notisfamiljen.spec.ts` redan bär mekaniskt. Bilderna här styrker
FÄRGEN för ett mänskligt öga; de mekaniska `border-color`/`border-width`-
assertionerna i de två testfilerna är den del av AC #2 som körs i CI.
