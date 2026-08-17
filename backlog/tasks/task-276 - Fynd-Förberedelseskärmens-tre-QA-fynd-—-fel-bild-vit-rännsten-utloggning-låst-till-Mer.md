---
id: TASK-276
title: >-
  Fynd: Förberedelseskärmens tre QA-fynd — fel bild, vit rännsten, utloggning
  låst till Mer
status: To Do
assignee: []
created_date: '2026-08-17 19:27'
labels: []
dependencies: []
ordinal: 501000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tre fynd ur Marcus QA-vandring av task-273.5 steg 1 (2026-08-17).

1. FEL BILD: task-273.6 tog repots enda befintliga RL-bild, vilken var fel foto. Marcus levererade rätt original (Roger_och_Lotta_Miranon_Media_1.png, 4096x2714, 20,9 MB). Skalad + konverterad med cwebp -q 80 till 1600x1061, 97 kB (lattare an den gamlas 132 kB). Scrimmets WCAG-luminansanalys omraknad mot nya filen: marginalen steg 4,48 -> 4,52:1.

2. VIT RANNSTEN: foto- och scrimlagren ligger inuti body och kan aldrig na ut i den rannsten scrollbar-gutter: stable both-edges reserverar - tva vita spalter i kanterna. Samma klass som login-fondens S96-fynd. Chromium malar ALDRIG background-image i gutter-ytan (w3c/csswg-drafts#8099), sa bilden kan inte na dit oavsett teknik. Atgardat med platt kamouflagefarg pa <html> via referensraknad markor data-forberedelse-fond. Fotots medelfarg rgb(173,173,159) bakom samma 90 %-scrim = rgb(247,247,245), mott med sharp.

3. UTLOGGNING LAST TILL MER: _authenticated.tsx sparade redirect: location.href aven vid avsiktlig utloggning, och utloggningsknappen finns bara pa Mer-vyn - en sluten loop dar /login:s /hem-default aldrig nåddes. Ny modul lib/auth/utloggningsavsikt.ts (samma monster som inloggningsdestination.ts, TASK-261): engangsfonster som konsumeras vid lasning, fail-safe till dagens beteende.

BIFYND: testhjalparen relativLuminans i Forberedelseskarm.spec.ts antog alltid 0-255 och laste darfor ett near-vitt color-mix-varde (color(srgb ...), 0-1-kanaler) som near-svart - kontrastkvot 20,9 dar sanningen var 1,0. Latent tills forsta color-mix-tokenen mattes. Fixad i samma landning.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Ratt bild i public/roger-och-lotta.webp, skalad och konverterad, med omraknad luminansanalys i components.css-tokenens kommentar
- [ ] #2 Rannstenen bar kamouflagefargen i normallage och faller till --mm-bg under contrast-more/print; markoren ar referensraknad sa flera samtidiga instanser fungerar
- [ ] #3 Avsiktlig utloggning landar pa /hem vid nasta inloggning; sessionsutlopp bevarar ursprungs-URL:en oforandrat
- [ ] #4 relativLuminans hanterar bade rgb() och color(srgb ...); befintliga kontrastassertioner oforandrade
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
