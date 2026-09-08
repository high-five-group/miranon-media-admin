---
id: TASK-402.5
title: >-
  Skiva: Åtgärds-sidans matare — 'Registrera inbetalning för N markerade' öppnar
  steget med urvalet förvalt
status: Done
assignee: []
created_date: '2026-09-05 19:02'
updated_date: '2026-09-08 02:55'
labels:
  - ready-for-agent
dependencies:
  - TASK-402.3
parent_task_id: TASK-402
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Åtgärds-sidans betalningsblock får knappen 'Registrera inbetalning för N markerade' som öppnar bekräftelsesteget med de markerade personernas anmälningar som rader (sök-parametern ids). Per-person-panelen står kvar för läsning, enstaka registrering och återbetalning. Tillbaka-pilen från steget återvänder till Åtgärds-sidan med markeringen kvar. Obekräftade anmälningar registreras som vanligt och förblir märkta Obekräftad (beslut 5). Täcker användarberättelser: 22, 23.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Betalningsblocket visar 'Registrera inbetalning för N markerade' när minst en person är markerad; knappen navigerar till bekräftelsesteget med de markerade personernas anmälnings-ID:n som ids
- [x] #2 Steget öppnat från Åtgärds-sidan är identiskt med facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json ytan bekraftelsesteget i läge 'utgångsläget'
- [x] #3 Tillbaka-pilen från steget återvänder till Åtgärds-sidan med markeringen kvar
- [x] #4 Per-person-panelen (läsning, enstaka registrering, återbetalning) är oförändrad
- [x] #5 Obekräftade anmälningar i urvalet registreras och förblir märkta Obekräftad; ingen bekräftelse skickas
- [x] #6 Staging-e2e (samma skarv som Åtgärds-sidans kvitto-test) täcker knappen, navigationen och tillbaka-pilen med axe-svep utan fel
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Facit-granskning: ytan bekraftelsesteget jämförd mot facit tasks/sessions/bilagor/s121-bekraftelsesteget-konvergens/facit.json (bilderna i samma katalog) i varje läge skivan rör — avvikelse bokförs som AMENDERING-fil i facit-katalogen, aldrig som tyst ändring (ADR-102 B5/R3)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation (bygg-agent, PR mot main, staplad på #2362)

**Gren:** `task/402.5-atgardssidans-matare`, basen `origin/task/402.3-promoveringen-bekraftelsesteget` (head `081a2e95` vid checkout).

**Ändring i `AtgardsSida.tsx`:** knappen "Registrera inbetalning för N markerade" i betalningsblockets FLAGG-PÅ-gren (den enda där routen `/mer/betalningar/registrera` faktiskt bär fram), byggd på den BEFINTLIGA `mottagare`-markeringen (samma markering `AtgardsMeny`/`MottagarYta` redan räknar på) — ingen ny markeringsmekanik. En liten ren härledning `anmalningsIdsCsv(mottagare)` bygger `ids`-strängen. `useNavigate` tillagd i routerimporten.

**Ny e2e-svit** tillagd som eget `test.describe` i `tests/e2e/atgarder-kvitto.staging.test.ts` (skarven AC #6 pekar ut) — återanvänder `bekraftelseFixtur()` ("Lottas morgon", samma data som TASK-402.3s egen `hamta-oppna-betalningar`-mock) för att göra `ids`-strängen och steget BYTE-IDENTISKA med 402.3s redan committade ariaSnapshot-referens; jämförelsen görs INLINE (`toMatchAriaSnapshot(sträng)`) mot filen `tests/e2e/__aria__/bekraftelsesteget-promoverings-grind.staging.test.ts/bekraftelsesteget-utgangslage-desktop-chromium-authenticated.aria.yml`, eftersom `playwright.config.ts`s `pathTemplate` skopar snapshots per testfil.

**Skarpt körd:** `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4173` + `npm run build:staging` + `npm run preview:staging` (5173 upptagen av huvudkatalogens dev-server; worktree-portar saknar CORS-allowlistning mot staging-EF:erna, se `.env`/`tests/support/dev-portar.ts`) — `npx playwright test --project=chromium-authenticated tests/e2e/atgarder-kvitto.staging.test.ts`: 1 passed (+2 pre-existerande skip). Regressionskörning av `atgarder-betalningar.staging.test.ts` + `bekraftelsesteget.staging.test.ts` + `bekraftelsesteget-promoverings-grind.staging.test.ts`: 26 passed, 8 skip (oförändrat) — ingen regression. Staging-semaforen (`scripts/staging-semaphore.sh`) användes hela vägen (väntade ut TASK-402.1s fönster, ~13 min, släpptes direkt efter).

## Öppet fynd — AC #3s räckvidd (bokfört, ej blockerande)

Testet bevisar "markeringen kvar" MEKANISKT för round-trippen: `AtgardsSida` saknar egen persistens över en route-avmontering (tillbaka-pilen är `router.history.back()`, vilket remonterar sidan och kör dess seedning på nytt ur `obekraftad || obetald`). I testet är `get-registrations`-mocken statisk, så reseedningen reproducerar exakt samma tio ID:n. Ett scenario där basens app-skrivna spegling av betalningsstatus redan hunnit uppdateras INNAN Lotta trycker tillbaka (en nu fullbetald, bekräftad person slutar vara `obetald`) skulle kunna krympa reseedningen — INTE prövat här, och ingen ny persistensmekanism byggd i `AtgardsSida.tsx` för det (uppdragets egen instruktion: "annars är det ett fynd att bokföra, inte en tyst fix i steget"). Kandidat till en framtida skiva om Marcus vill stänga gapet: skriv `valda`/`synligaIds` till den egna route-entryns `history.state` (samma idiom som `mmAtgardsUrval`) innan navigeringen till steget.

## Divergenser mot uppdraget (ADR-086)

Inga. Premiss-passet höll: `081a2e95` var faktisk head vid checkout, PR #2362 draft/OPEN/MERGEABLE mot main, `.env.development`s `VITE_FEATURE_BETALNINGAR=pa` bekräftat oförändrat av e2e-webServern, `Bekraftelesteget.tsx`s `ids`-kontrakt (kommaseparerade anmälnings-record-ID:n, samma nyckel som `PanelBetalningar`) bekräftat via läsning, INTE antaget.

## Superseded 2026-09-08 (TASK-435)

Marcus S124: "Jag är helt säker på att jag vill riva betalningsblocket helt från åtgärdssidan." Knappen 'Registrera inbetalning för N markerade' (denna skivas leverans) satt i AtgardsSida.tsx:s betalningsblock — det blocket är rivet i sin helhet, mataren med det. Marcus accepterade förlusten uttryckligen 2026-09-08 (inkorgen har egen markeringsgruppering per event, som fyller samma behov). Kortet ändras inte i övrigt — det förblir Done och en korrekt historisk beskrivning av vad som byggdes och landade.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2364 → main 8f8c5ff7 (2026-09-06 ~07:10 UTC). AFK-proveniens: S121 resume 3 (Marcus mandat vid paus 3), bygg-agent Sonnet 5 i egen worktree, staplad på #2362 (081a2e95), landad utan rebase efter #2362. Review runda 1 (Sonnet 5): risk låg, AC #1–#6 håller med kedjan spårad ner i mapRegistration() och registrera-inbetalning-EF:en (ingen bekräftelseväg finns i flödet); ett info/ask-user (den nya knappens dynamiska räkning saknar egen aria-live medan filens Mottagare-räknare bär mönstret) avgjort på mandatet: armerad som den är — Mottagare-räknarens live-region annonserar redan samma händelse, en andra hade gett dubbel uppläsning per markering; review-loop-beslut exit 20 → mandatbeslut bokfört i S121 Del 6 §6.6; backstopp grön för e27e4907. Levererat: knappen 'Registrera inbetalning för N markerade' i AtgardsSida.tsx:s betalningsblock på befintlig mottagare-markering, härledningen anmalningsIdsCsv (anmälnings-record-ID:n), navigation till /mer/betalningar/registrera?ids=…; e2e i tests/e2e/atgarder-kvitto.staging.test.ts: ids exakt fixturens tio, ariaSnapshot byte-identisk mot 402.3:s utgångsläge-referens, Erik Holm (obekräftad) registrerad med 0 anrop på send-action-email, tillbaka-pilen med markeringen kvar, axe 0. PanelBetalningar.tsx orörd (AC #4). Öppet fynd (byggaren, ej kort): AC #3 täcker inte scenariot där basens spegel hinner uppdateras före tillbaka-trycket. Sessionsdok S121 Del 6 §6.6.
<!-- SECTION:FINAL_SUMMARY:END -->
