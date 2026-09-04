---
id: TASK-340.2
title: >-
  Skiva: klienten — inget fönster vid Skapa, 'Skapa om'-etikett, bekräftelseyta
  på plats med fokus och två val
status: Done
assignee: []
created_date: '2026-08-29 08:18'
updated_date: '2026-08-29 11:59'
labels:
  - ready-for-agent
dependencies:
  - TASK-340.1
parent_task_id: TASK-340
ordinal: 621000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Efter skivan: Skapa öppnar inget fönster och skriver ingen laddningssida (förhandsgranskningens synkrona fönster + TASK-309.38:s väntetext behålls oförändrade). Klienten skickar med kallhash från senaste förhandsgranskning (per event × mall i vyns state) och läser svarets promoverad/underlagAndrat/ersatte. Primärknappen heter 'Skapa om <dokumentnamnet>' när en event-mallad rad redan finns för mallen, annars 'Skapa <dokumentnamn>'. Efter lyckat Skapa ersätts formuläret av en bekräftelseyta i husets form (MessageBox intent success, samma mönster som CreateEventForm: knappen som trycktes finns inte kvar → fokus flyttas till bekräftelsen; avvikelsen från MDN:s status-regel namnges i docblocket). Texten komponeras ur svaret: sparad · underlaget ändrat → gjordes om, förhandsgranska gärna igen · ersatte den tidigare · platsens standard sparad. Två val: 'Visa dokumentet' (signerad URL i nytt fönster i ett direkt klick) och 'Till dokumenten' (dokumentvyn ?typ=bilaga). Ingen auto-omdirigering, ingen toast, ingen radmarkering (PRD § Implementationsbeslut — Marcus prövar formen i QA). Förhandsgranskningens egen ruta behålls med 'Öppna'-fallbacken ENDAST vid blockerat fönster. RouteAnnouncer: mät att bekräftelsen läses exakt en gång och att 'Till dokumenten' ger exakt en annonsering. Täcker användarberättelser: 2, 5, 6, 7, 8, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Acceptance: Skapa öppnar inget fönster (negativt bevis: context.waitForEvent('page') firar INTE inom 3 s) medan Förhandsgranska fortfarande gör det; ingen laddningssida för skapa-grenen kvar i koden
- [x] #2 Acceptance: bekräftelseytan ersätter formuläret, tar fokus (document.activeElement inuti ytan), visar rätt textvariant för promoverad / underlagAndrat / ersatte / platsstandard (MSW-fixturer per fall), och bär exakt två val; 'Till dokumenten' landar på dokumentvyn med ?typ=bilaga; axe grönt; tangentbordsvandring bokförd
- [x] #3 Knappens etikett 'Skapa om …' när rad finns, 'Skapa …' annars — testat i båda lägena; kallhash skickas med när en förhandsgranskning gjorts i vyn (nätverkspåstående i test)
- [x] #4 Skärmläsare: exakt EN annonsering vid bekräftelsen (live-region + fokus utan dubblering) och INGEN dubbelannonsering vid 'Till dokumenten' (0 eller 1, mätt och bokfört — samma route annonserar inte om); DOM-nivå-bevis i Playwright, VoiceOver-vandringen hör till TASK-340.5
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön — promovering, hash-verifiering och ersätt-uppslag bor i EF/_shared
- [ ] #5 Facit-granskning mot tasks/sessions/bilagor/s108-generering/facit.json: avvikelser utöver PRD:ns avsiktliga ändringar bokförda; ny baslinje först efter Marcus godkännande (ADR-074)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Implementation Notes (TASK-340.2)

### Facit-skuld — INTE betald här, med avsikt (DoD #5, ADR-074)

Facit `tasks/sessions/bilagor/s108-generering/facit.json` är OSTÄMPLAT (`godkand: null`) och lämnas ORÖRT av denna skiva. Två poster bokförs som öppen skuld i stället för att lösas:

1. **`facit-generering-efter-skapa-desktop.png` / `-mobil.png` är INAKTUELLA.** De visar den gamla resultatrutan (grön ruta under knapparna, med Öppna-knapp) på ett formulär som stod kvar. Efter denna skiva ersätts formuläret av en bekräftelseyta med två val. Avvikelsen är en AVSIKTLIG PRD-ändring (`TASK-340` § Implementationsbeslut "Bekräftelsen på plats"), inte en regression — men en ny baslinje får inte skapas av en agent före Marcus godkännande.
2. **Promoverings-grinden (`tests/visual/dokument-generering-promoverings-grind.spec.ts`) saknar ett EFTER-SKAPA-läge.** Dess sex lägen låser formuläret, block-dialogen och Inforutans morf — bekräftelseytan har ingen aria-referens alls. Ett sjunde läge (och dess desktop/mobile-par) hör till samma godkännande-moment som punkt 1.

De tolv BEFINTLIGA aria-referenserna är byte-identiska efter regenerering med spec-filens egen mekanism (`--update-snapshots`, 12/12 gröna, `git status` rent) — facits deklarerade `sha256`-värden står därmed orörda och `check-facit.sh` är grön (exit 0).

### AC #4 skrevs om i runda 2

Ursprunglig lydelse krävde "exakt en annonsering vid 'Till dokumenten'". Mätningen visade att den vägen ger **0** inifrån appen: `RouteAnnouncer` annonserar routens TITEL, och dokumentlistan och genereringsvyn är SAMMA route ("Dokument"), så `setMessage('Dokument')` ger ingen DOM-ändring. Det är korrekt beteende, inte en brist — och det AC:n skyddar mot (dubbelannonsering) inträffar i ingendera vägen. Omskriven via CLI på orkestrerarens beslut; VoiceOver-vandringen hör till `TASK-340.5`.

### Review-runda 2 — den tidsinställda defekten i "Visa dokumentet"

Runda 1 lagrade den signerade nedladdnings-URL:en i bekräftelsens state (hämtad vid Skapa). Signerade Storage-URL:er lever **300 s** (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`), och bekräftelsen är just den yta Lotta får STÅ KVAR på — ett klick efter fem minuter hade öppnat en flik mot en utgången URL: rått Storage-fel, inget besked i appen.

Rättat till husets mönster (`DokumentYta.tsx` § IKONPAR): `window.open('', '_blank')` synkront i klicket, `skrivLaddningssida` med 309.38:s väntetext, och en FÄRSK URL via den ÅTERANVÄNDA `useForhandsvisaDokument`. `useGenereraEventBilaga` hämtar därmed ingen URL alls längre (`GenereradEventBilaga.url` rivet). Bevisat i test med en fixtur som ger en NY adress per anrop: 0 anrop vid Skapa, adress nr 1 vid första klicket, adress nr 2 vid det andra.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2093 (mergad 2026-08-29 11:57:05Z, main be87d128). Inget fönster vid Skapa; bekräftelseytan ersätter formuläret (fokus, exakt två val: 'Visa dokumentet' med FÄRSK signering per klick i husets mönster — review-runda 1 fann att den frysta 300 s-URL:en hade gett död länk — och 'Till dokumenten'); 'Skapa om <namnBestamd>' när rad finns; kallhash skickas efter förhandsgranskning; 'Öppna'-fallback bara vid blockerat fönster; delad useEventAttachments. Fyra granskningsrundor (r1 medel/ask-user → r2 docblock-drift → r3 prosa → r4 tester efter oanvänd-handler-vakten i CI); AC #4 omskrivet mätbart. Facit s108-generering: efter-Skapa-bilderna inaktuella, ny baslinje efter Marcus godkännande (ADR-074). Lesson: --reporter-flaggan ersätter reporter-listan och stänger av vakten.
<!-- SECTION:FINAL_SUMMARY:END -->
