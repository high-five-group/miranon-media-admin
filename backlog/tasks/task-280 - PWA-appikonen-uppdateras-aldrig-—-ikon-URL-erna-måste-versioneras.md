---
id: TASK-280
title: 'PWA-appikonen uppdateras aldrig — ikon-URL:erna måste versioneras'
status: To Do
assignee: []
created_date: '2026-08-20 07:44'
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
- [ ] #1 Ikonernas filnamn är versionerade så manifestets icons-lista skiljer sig från den nuvarande, och byggd dist/manifest.webmanifest bevisar det
- [ ] #2 Samtliga referenser är uppdaterade i takt: vite.config.ts (icons-listan, ca rad 167-175), pwa-assets.config.ts (ca rad 45), filerna i public/, och eventuella referenser i index.html
- [ ] #3 npm run verify:manifest är grön och scripts/check-manifest-fields.mjs mäter de nya namnen
- [ ] #4 Varje ikon som manifestet refererar är öppnad och verifierad att den bär den NYA vågformade M-formen i rött och grönt, inte den gamla parallellogram-formen
- [ ] #5 Inga gamla ikonfiler ligger kvar oreferade i public/ efter bytet, eller så är kvarlämnandet uttryckligen motiverat i kortets notes
- [ ] #6 Versioneringsformen är vald med motivering: filnamns-suffix eller innehållshash — och valet är dokumenterat så nästa ikonbyte inte kräver samma utredning igen
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
