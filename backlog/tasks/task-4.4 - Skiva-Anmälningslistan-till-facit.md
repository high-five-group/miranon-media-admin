---
id: TASK-4.4
title: 'Skiva: Anmälningslistan till facit'
status: Done
assignee: []
created_date: '2026-07-07 08:56'
updated_date: '2026-07-11 17:38'
labels:
  - ready-for-agent
dependencies:
  - TASK-4.2
parent_task_id: TASK-4
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
"Nya anmälningar att hantera"-kortet renderar per facit: KOPPAR-kontur runt kortet + koppar-varningsikon (20) vid rubriken; de ~25 senaste anmälningarna i en inline-rullbar lista (maxhöjd, centrerad rundad scrollmarkör, luft mellan markör och innehåll); ZEBRA varannan rad (dämpad ton, rundade rader, INGA skiljelinjer); rad utan chevron = namn (16 semibold) / kursnamn · ort · kortdatum (14) / relativ tid "för 2 tim sedan" (12 dämpad). Eventets identitet på raden hämtas via klient-side-join mot den redan hämtade eventlistan (B4 — INGEN ny EF, ingen bas-ändring, read-only orört; öppet reviderad dataväg, se PRD-beslut 9). Radklick landar på EVENTETS sida (B1); rad utan event-koppling renderas olänkad med "Utan event". Rullningsområdet är fokuserbart och tangentbordsmanövrerbart med begripligt tillgängligt namn (B6).

Täcker användarberättelser: 9, 10, 11, 12, 13, 14, 18.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Raden visar namn / kursnamn · ort · kortdatum / relativ tid med typografin 16/14/12 RENDERAT (computed-style; route-mock)
- [x] #2 Radklick landar på eventets sida; rad utan event-koppling olänkad med 'Utan event' (e2e)
- [x] #3 Zebra varannan rad utan skiljelinjer, rundade rader (renderad verifiering)
- [x] #4 Koppar-kontur + koppar-varningsikon vid rubriken (renderad verifiering)
- [x] #5 ~25 rader i rullbar lista med maxhöjd och centrerad rundad scrollmarkör
- [x] #6 Rullningsområdet tangentbordsfokuserbart med begripligt tillgängligt namn; axe-0 på Hem (e2e + axe)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-AVPRICKNINGEN (DoD #6, L245/L246) — varje berörd facit-/byggkravspunkt, RENDERAD verifiering (permanenta e2e-assertions i tests/e2e/hem.staging.test.ts, describe 'task-4.4', + skärmdumps-probe desktop 1440/mobil 390 mot facit-bilagorna):
1. KOPPAR-kontur (--mm-accent) runt kortet — computed border-color rgb(163,73,28) på ALLA fyra sidor, 1px, kortytan kvar i bg-muted rgb(245,245,243) (AC4-testet, grönt).
2. Koppar-CircleAlert (20) VID rubriken — renderad svg[aria-hidden] inne i h2:n, boxmätt exakt 20×20 px, computed color rgb(163,73,28) (AC4, grönt).
3. Rubriken 'Nya anmälningar att hantera' i kortrubriks-formen (text-xl semibold mörk, task-4.3-mönstret via DashboardCard) — regionens accessible name + task-4.3:s befintliga rubrik-assertions gröna i fulla sviten (DashboardCard-utökningen ändrar inte neutral/primary-renderingen).
4. Inline-rullbar lista ~25 rader med maxhöjd — 30 mockade → EXAKT 25 renderade med recency-cappen bevisad (Person00 synlig, Person25 borta); computed max-height 320px (max-h-80), scrollHeight > clientHeight, overflow-y auto (AC5, grönt).
5. Centrerad rundad scrollmarkör med luft mot innehållet — computed scrollbar-width 'thin', scrollbar-color rgb(196,196,194) transparent (= --mm-border-strong på genomskinlig track), scrollbar-gutter 'stable', padding-right 12px (pr-3-luften) (AC5, grönt). Webkit-fallback (rundad 999px-tumme + 3px kant-luft) i @utility scrollbar-inline; macOS overlay-scrollbars visar markören vid rullning — synligheten i vila är OS-styrd, stylingen är computed-verifierad.
6. ZEBRA varannan rad utan skiljelinjer — computed per rad: index 1/3 bg rgb(237,238,233) (--mm-bg-emphasized) + border-radius ≠ 0 (rounded-lg); jämna rader genomskinliga; border-width 0 runt om SAMTLIGA rader (avdelar-mönstret från task-1.3 utgick) (AC3, grönt).
7. Radens typografi namn/meta/tid = 16/14/12 — computed fontSize 16px + fontWeight 600 (namn), 14px (metaraden), 12px + color rgb(107,107,107) = --mm-text-muted (relativ tid) (AC1, grönt).
8. B4 klient-side-joinen är identitetskällan — divergens-mock (radens lookup-eventNamn ≠ eventlistans namn) renderar EVENTLISTANS 'Fjärrskådning 2 · Skövde · 15 sep'; lookup-strängen förekommer aldrig i kortet; kortdatum sv-SE utan punkt ('15 sep', facit-formen) (AC1, grönt). Join-miss degraderar ärligt till radens lookup-namn; events-fel fäller aldrig kortet (fel-ytan följer anmälnings-hämtningen ensam).
9. B1 radklick → EVENTETS sida — klick på raden landar /event/recEvent1 (uppdaterat befintligt test; anmälda-undervyn utgick som mål per öppna G1a-revideringen); rad utan event-koppling OLÄNKAD med 'Utan event' (uppdaterat test, grönt).
10. Relativa tidens facit-former — fast klocka (setFixedTime 15:00, midnattssäkert per TASK-3-klassen): 'för 10 min sedan', 'för 2 tim sedan', 'igår 14:02', 'för 3 dagar sedan' alla renderade exakt (AC1, grönt).
11. B6 rullningsytans a11y — tabindex 0 (riktigt tab-stopp; olänkade rader nås annars aldrig med tangentbord), aria-label 'Senaste anmälningarna' (begripligt namn, list-rollen stödjer author-naming), ArrowDown rullar fokuserat område (scrollTop > 0 renderat), axe-0 på Hem med FULL rullbar lista så scrollable-region-focusable prövas på riktigt (AC6, grönt).
Skärmdumps-probe (scratchpad, facit-lik K10-exempeldata, fast klocka): desktop 1440 matchar k10-facit-desktop.png på skivans yta (kontur/ikon/rubrik/rader/zebra/radformerna/relativa tider); mobil 390 matchar k10-facit-mobil.png (samma yta, ingen h-scroll). Nästa event-kortets INNEHÅLL skiljer (probens mockdata vs facit-bildens S55-stagingdata) — task-4.3:s yta, utanför denna skiva.

Validering (lokala grindar, L147): hem-e2e 25/25 · fulla e2e:staging 137 passed + 2 by-design-skip · a11y 13/13 · test:api 290 passed + 6 failed i KÄND secrets-klass (TEST_REGISTRATION_RECORD_ID saknas lokalt — 0 träffar i .env.test, bärs av CI-secret ci.yml:320; create-registration 89/129/160, get-registrations väg D 86/132, update-record 92 — samma sex som task-6-fyndets lista, här med explicit env-felmeddelande) · typecheck 0 fel · biome exit 0 · build grön. TDD: 5 cykler rött→grönt (AC1+B1-länkmålet, AC4, AC3, AC5, AC6) — observerade röda utfall före varje grön implementation.

CI-DEFEKT UNDER KÖRNING (bokförd, fixad): leverans-commitens CI-run 29149331316 föll deterministiskt (3/3 attempts) på AC1-testets igår-klockslag — TESTDEFEKT, inte produktkod: runnerns Node byggde tidpunkten i värdzonen (UTC på CI) medan appen formaterar i playwright-configens timezoneId Europe/Stockholm → renderat 'igår 16:02' ≠ förväntade 'igår 14:02'. Fix e2fdea4: förväntningen härleds ur samma absoluta ögonblick med explicit timeZone = browserns config-zon; lokal körning opåverkad (zonerna sammanfaller där). Övriga 136 e2e passerade i den fallna runnen — diffens produktyta var grön hela vägen.

Väntar design-review (S61 batch 2) · leverans 25c63a9 + testfix e2fdea4 · CI-run 29149562570 grön per jobb (Detect changed files ✓, Lint+Audit+TypeCheck ✓, Test+Build ✓ KÖRD, Docs link check skipped by design, CI Passed or Skipped ✓; attempt 1 för fix-commiten — leverans-commitens första pass föll på testdefekten ovan) · facit-avprickningen i notes ovan

Design-review Marcus-GODKÄND 2026-07-11 (första varvet, hela batch 2-leveransen): 'Det ser jättebra ut'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 25c63a9 + testfix e2fdea4 · CI-run 29149562570 grön per jobb (attempt 1 på fixen; leveransens run 29149331316 röd på tidszons-testdefekten) · CI-grön-första-pass: nej · defekter under körning: 1 (AC1-testets igår-klockslag byggdes i runnerns UTC medan appen formaterar i Europe/Stockholm — testdefekt, ej produktkod; fixad e2fdea4 med explicit timeZone) · TDD: 5 cykler rött→grönt · Design-review: Marcus-GODKÄND 2026-07-11 (första varvet) · AFK: S61 batch 2, agent 2
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT K10-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-/byggkravspunkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->
