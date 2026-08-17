---
id: TASK-273
title: 'PRD: UI-fixpaketet S107'
status: To Do
assignee: []
created_date: '2026-08-17 14:53'
labels: []
dependencies: []
ordinal: 488000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Marcus prod-granskning 2026-08-17 fann fem synliga brister över fyra ytor: (1) Förberedelseskärmens laddningsbar är tjockare än nästa event-kortets bar och bär samma guldfärg, så de två förväxlas; (2) genvägarna på hem-vyn ger ingen hover-återkoppling, till skillnad från eventdetaljsidans åtgärdslistor; (3) genvägsknappen heter "Öppna Åtgärds-sidan" i stället för det beslutade "Gå till åtgärder"; (4) åtgärdssidan bär en teknisk metatext om mallar som ska bort; (5) dokument-ytans inbyggda förhandsvisning är för liten för att läsa — Lotta behöver full flik eller nedladdning.

### Lösning

Fem riktade ändringar i ETT batchat paket (S106-prejudikatets form): smalare sage-färgad laddningsbar; eventdetaljens hover-grammatik på genvägarna; ny knappetikett; metatexten rivs; Visa-knappen ersätts av förhandsvisnings-ikon (öppnar dokumentet i ny webbläsarflik i webbläsarens egen visare) + nedladdnings-ikon. Varje berörd stämplad yta amenderas öppet och omstämplas av Marcus.

### Användarberättelser

1. Som Lotta vill jag att laddningsskärmens bar är diskret och i egen färg, så att den inte förväxlas med nästa event-kortets kapacitetsbar.
2. Som Marcus vill jag att systemets laddningssignal (sage) skiljer sig från innehållets guld, så att färgspråket bär betydelse.
3. Som Lotta vill jag få synlig hover-återkoppling på genvägarna, så att jag ser vad som är klickbart — samma känsla som på eventsidans åtgärdslistor.
4. Som Lotta vill jag att knappen heter "Gå till åtgärder", så att etiketten säger vad som händer.
5. Som Lotta vill jag slippa teknisk metatext om mallar på åtgärdssidan, så att ytan känns färdig och talar mitt språk.
6. Som Lotta vill jag öppna ett dokument i en egen webbläsarflik i full storlek, så att jag faktiskt kan läsa vad som står.
7. Som Lotta vill jag kunna ladda ner ett dokument med ett klick, så att jag kan spara eller skriva ut det.
8. Som Marcus vill jag att varje avvikelse från stämplade facit bokförs öppet och omstämplas av mig, så att facit-apparaten förblir sann.

### Implementationsbeslut

- Förberedelseskärmens bar: samma höjd som nästa event-kortets bar (6 px-klassen) och fill i sage-familjen, via komponent-token (aldrig hårdkodad färg); WCAG 1.4.11-kontrasten (3:1 mot spåret) verifieras vid tonvalet, contrast-more-varianten följer med. Sidbytesindikatorn RÖRS INTE (Marcus svar 2, 2026-08-17).
- Genvägarna: eventdetaljens radhover-grammatik (bakgrundsplatta med mjuk övergång, K56-formen) appliceras på NavCard-komponenten. Det tidigare M3-beslutet ("ingen hover-bakgrundsändring") RIVS ÖPPET på Marcus omprövning 2026-08-17 — kodkommentaren som bär beslutet uppdateras i samma ändring så trailen inte ljuger.
- Knappetiketten "Öppna Åtgärds-sidan" byts till "Gå till åtgärder"; acceptanstestet som låser strängen uppdateras i samma skiva.
- Åtgärdssidans "Mallar."-not (PrototypNot) tas bort per Marcus order 2026-08-17. Notens sakpåstående är verifierat SANT (standardmallarnas text är fast i koden; Ändra-knappen redigerar bara det enskilda utskicket) — borttagningen är ett medvetet val att inte visa metatexten, inte en rättelse av ett felaktigt påstående.
- Dokument-ytans Visa-knapp ersätts av två ikonknappar per rad: förhandsvisning (öppnar i NY flik — synkron fliköppning i klicket, omstyrning när den signerade adressen anlänt; popup-blockerar-säker form) och nedladdning. Klass B/C (transient genererad PDF, blob-form) föregås av ett minimalt beteendetest i riktig webbläsare INNAN skivan byggs klart (minimalt-test-principen).
- Berörda facit-manifest — varje avvikelse amenderas öppet via sidofil i passets bilage-katalog; godkand-fältet skrivs ENDAST av Marcus via !-kanalen (ADR-104), aldrig av agent:
  - tasks/sessions/bilagor/s102-hem-konvergens/facit.json — ytan hem-vyn V1 "Lugna morgonen" (godkänd 2026-08-17): berörs av genvägs-hovern + knappetiketten.
  - tasks/sessions/bilagor/s102-dokument-konvergens/facit.json — ytan Dokument-ytan lista + Visa-overlayens tre klasser (godkänd 2026-08-16): berörs av ikonknapparna + flik-beteendet.
  - tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json — ytorna atgarder-tomt-lage, atgarder-mottagarurval, atgarder-granskning: SAMTLIGA utan låsta bilder (bilder: []) — den klass som tystast byggs fel; metatext-rivningen rör granskningsytan och amenderas explicit trots bildlösheten.
  - Förberedelseskärmen bär inget facit-manifest (verifierat mot bilage-katalogerna) — ingen amendering, ändringen bokförs i skivan.

### Testbeslut

Externa beteenden testas via BEFINTLIGA skarvar: de hermetiska acceptanssviterna är primärskarven (knappetikettens stränglås uppdateras där); ingen ny testinfrastruktur mintas. Aria-/pixelgrindarna är lokala verktyg (utanför PR-CI, mätt 2026-08-12) och används som självkontroll före push. Klass B/C-flikbeteendet får ett engångs-minitest som kastas (throwaway-kontraktet). Skarv-kvittens: Marcus kvitterade skivlistan inkl. testansats 2026-08-17 ("Jag kvitterar") — bokförd här i stället för som separat runda, öppet noterat.

### Utanför omfattningen

Sidbytesindikatorn · mall-editor (mallarnas fasta innehåll kvarstår) · universella bilagor (egen grillning) · segment-sändytans wiring (task-271) · utskicks-spärren (eget kort task-274) · bas-datafixarna (spår 2, hanteras direkt i basen).

### Estimat

5 skivor: 3 S (bar · hem-ytan hover+etikett · åtgärdsnoten) + 1 M (dokument-ikonerna) + 1 QA (ready-for-human).

### ADR-koppling

ADR-102 (facit är överordnat), ADR-103 (promoveringsformen/amendering), ADR-104 (stämpelkanalen), ADR-044 (token-/komponentform), ADR-036 (DoD-grinden). Inget över-bar-beslut: M3-rivningen dokumenteras i skivan + amenderings-sidofilen (befintligt maskineri, under ADR-baren).

### Ytterligare anteckningar

Paketets form följer S106-prejudikatet: ETT PRD + skivor för en fler-ytors-batch, aldrig lösa punktfix-kort. Modellpolicy per Marcus kvot-direktiv 2026-08-17: bygg-agenter körs på Sonnet (bokförd avvikelse-yta: ingen), orkestrering på huvudloopen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
