---
id: TASK-280
title: 'PWA-appikonen uppdateras aldrig — ikon-URL:erna måste versioneras'
status: Done
assignee: []
created_date: '2026-08-20 07:44'
updated_date: '2026-08-24 13:06'
labels:
  - ready-for-agent
dependencies: []
ordinal: 506000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Chrome 144+ behandlar manifestets `icons`-lista som Cache-Control: immutable: så länge `icons`-fältet ser likadant ut som senast applicerade version laddas bilderna ALDRIG ner för visuell jämförelse. Vi bytte innehållet i pwa-192x192.png / pwa-512x512.png / maskable-icon-512x512.png men behöll filnamnen, så Chrome upptäcker aldrig bytet. Följden: 'Öppna i appen'-knappen och den installerade appen visar den GAMLA parallellogram-ikonen, medan faviconen (annan mekanism) redan visar Rogers nya M.

Belagt ur Chromiums källkod (S107, 2026-08-20): IntentPickerTabHelper → WebAppsIntentPickerDelegate::LoadSingleAppIcon → WebAppIconManager läser appens ikon från DISK, inte från nätet. Chrome-teamets blogg 2026-01-21 (gäller from Chrome 144): 'To trigger an icon update, developers are now required to modify either the metadata or the icon URL.' Marcus kör 151.0.7922.138.

Fixen är att versionera ikonernas FILNAMN så manifestets icons-lista faktiskt ändras.

VÄNTAT BETEENDE EFTER FIXEN, ej en defekt: vår ikonändring är långt över Chromes 10-procentströskel (14 567 till 6 979 opaka pixlar, helt andra färger), så uppdateringen blir INTE tyst. Varje användare får 'App Update Available' i appfönstrets trepunktsmeny och måste välja 'Review app update' och acceptera. Det är Chromes avsiktliga skydd mot att en app byter identitet i smyg och ska inte kringgås.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ikonernas filnamn är versionerade så manifestets icons-lista skiljer sig från den nuvarande, och byggd dist/manifest.webmanifest bevisar det
- [x] #2 Samtliga referenser är uppdaterade i takt: vite.config.ts (icons-listan, ca rad 167-175), pwa-assets.config.ts (ca rad 45), filerna i public/, och eventuella referenser i index.html
- [x] #3 npm run verify:manifest är grön och scripts/check-manifest-fields.mjs mäter de nya namnen
- [x] #4 Varje ikon som manifestet refererar är öppnad och verifierad att den bär den NYA vågformade M-formen i rött och grönt, inte den gamla parallellogram-formen
- [x] #5 Inga gamla ikonfiler ligger kvar oreferade i public/ efter bytet, eller så är kvarlämnandet uttryckligen motiverat i kortets notes
- [x] #6 Versioneringsformen är vald med motivering: filnamns-suffix eller innehållshash — och valet är dokumenterat så nästa ikonbyte inte kräver samma utredning igen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Versioneringsform: CONTENT-HASH (sha256 av källbilden, 8 hex-tecken), inte
manuellt suffix (-v2, -v3, …). Implementerat i scripts/pwa-icon-version.ts
(getPwaIconVersion) — importeras av BÅDA vite.config.ts (manifestets
icons-lista) och pwa-assets.config.ts (assetName-override i genereringen),
så de två kan aldrig glida isär.

VARFÖR (så nästa ikonbyte inte kräver samma utredning):
- Samma cache-busting-mönster Vite redan använder för sina egna byggda
  assets (dist/assets/*-[hash].js) — etablerad branschstandard (Vite/
  Webpack/Rollup default), inte en lokal uppfinning.
- Ett manuellt suffix kräver att en människa KOMMER IHÅG att bumpa det —
  exakt den disciplin som saknades och orsakade detta kort (bilderna
  byttes, filnamnen glömdes). Ett hash härlett ur källbilden
  (public/miranon-m-original.svg) kan inte glömmas: ändra källbilden, kör
  `npx pwa-assets-generator` om, och namnet ändras av sig självt.
- Identiskt innehåll ger identisk hash — ingen falsk "app update
  available" visas om en fil bara sparas om utan att faktiskt ändras.
- Källa för assetName-mekanismen: @vite-pwa/assets-generator officiella
  dokumentation (context7 /vite-pwa/docs, "Override PNG Output Names" +
  "Default Asset Naming Function") — assetName(type, size) är den
  DOKUMENTERADE, avsedda vägen att styra utfilnamnen, inte en workaround.
- Källa för Chrome-beteendet: Chrome-teamets blogg 2026-01-21 (citerad på
  kortet) + kortets Chromium-källkodsbelägg (S107).

AC #3 (grinden mäter de nya namnen): scripts/check-manifest-fields.mjs
utökad med en icons-valideringsblock — LEGACY_ICON_SRCS-listan (de tre
exakta gamla filnamnen) fälls explicit, plus en disk-krysskoll (byggd
PNG-fils faktiska pixeldimensioner mot deklarerad `sizes`), plus krav på
minst 192x192 (any) + 512x512 (any) + 512x512 (maskable). Grinden är
MEDVETET INTE hash-format-specifik — den fångar regressionen (återgång
till de kända gamla namnen), inte dagens implementationsdetalj.
scripts/test-check-manifest-fields.mjs: 82/82 gröna, tvåsidigt bevis
(RÖTT vid varje mutation, GRÖNT återställt) inklusive de tre nya
oversionerat-fallen.

AC #4 (visuellt): alla tre byggda dist/-filer öppnade som bild manuellt
och verifierade — vågformad M i rött+grönt, INTE parallelogram. Bytet
rörde ALDRIG bildinnehållet: cmp mot de tre gamla filerna innan de togs
bort gav "IDENTICAL" (byte-för-byte) för alla tre, så generatorn
reproducerade exakt samma godkända pixlar under de nya namnen.

AC #5: de tre gamla, oversionerade filerna (public/pwa-192x192.png,
public/pwa-512x512.png, public/maskable-icon-512x512.png) är BORTTAGNA —
inga oreferade ikonfiler kvar i public/.

Hash för denna körning (källbild oförändrad sedan S107-bytet):
120d7838 — pwa-192x192-120d7838.png / pwa-512x512-120d7838.png /
maskable-icon-512x512-120d7838.png.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1645 (feat/s107-280-pwa-ikon-versionering) MERGED 2026-08-20T08:16:27Z, samtliga checks SUCCESS (gh pr view 1645). Filer scopade till kortets ikon-/manifest-yta. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
