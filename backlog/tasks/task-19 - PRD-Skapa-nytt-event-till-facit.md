---
id: TASK-19
title: 'PRD: Skapa nytt event till facit'
status: Done
assignee: []
created_date: '2026-07-21 07:57'
updated_date: '2026-07-30 20:39'
labels: []
dependencies: []
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta skapar event i ett formulär under Mer — funktionellt, men utanför event-familjens flöde: ingången syns inte där eventarbetet sker (listan), formen följer inte familjens formspråk, och det finns ingen väg att uttrycka om eventet ska synas på miranon.se. Session 73:s facit-utökning (K73–K85) låste ingång, sida och publicerings-handtag (Marcus: "jag är nöjd med denna sida som facit också"). Dagens skarpa form motsvarar inte det.

### Lösning

Skapa-ingången blir en kapsel på event-listans vy-väljarrad; sidan flyttar hem till event-familjen och byggs i familjens formklass mot basens fältfacit (Event, Eventtyp, Ort, datum, max antal platser, eventformat); publicerings-avsnittet bär ett dra-till-bekräfta-handtag som armerar publiceringsflaggan med bock och diskret pling; Mer-ingången rivs.

### Användarberättelser

1. Som administratör vill jag nå Skapa nytt event direkt från event-listan, så att skapandet bor där eventarbetet bor.
2. Som administratör vill jag fylla i Event, Eventtyp, Ort, datum, max antal platser och eventformat i familjens lugna formspråk, så att skapandet känns som resten av appen.
3. Som administratör vill jag välja eventformat som "2 dagar" eller "1 dag", så att valet talar mitt språk och inte basens.
4. Som administratör vill jag slippa obligatorisk-markeringar när allt krävs, så att formuläret inte skriker i onödan.
5. Som administratör vill jag dra ett handtag till bekräftelse för publicering på miranon.se — med bock och diskret pling när det armerats — så att publicering är ett avsiktligt handgrepp och aldrig ett råkat klick.
6. Som administratör vill jag kunna skapa eventet utan att publicera, så att interna eller ännu ej klara event kan förberedas.
7. Som administratör vill jag att ett nätverkshack aldrig ger dubbla event, så att en osäker sändning är trygg att försöka om.
8. Som administratör vill jag landa med tydlig bekräftelse efter skapandet, så att nästa steg är ett klick bort.
9. Som administratör vill jag kunna armera handtaget även utan mus eller drag, så att publiceringen fungerar med enbart tangentbord.
10. Som skärmläsaranvändare vill jag att handtagets tillstånd (oarmerat/armerat) annonseras begripligt, så att avsikts-mekaniken inte är enbart visuell.
11. Som administratör vill jag att plinget respekterar mina ljud- och rörelsepreferenser, så att återkopplingen aldrig stör.
12. Som administratör vill jag att förhöjd kontrast, reducerad rörelse och utskrift respekteras, så att systeminställningarna gäller även här.

### Implementationsbeslut

1. Facit = S73-bilagans utöknings-sektion (ingången, sidan, armerat handtag) + S72-bilagans utöknings-notering (listans vy-rad rörs av ingången). Prod-formen renderar EXAKT lika.
2. Hemvisten är event-familjens skapa-sida (Marcus-kvitterat 2026-07-21); Mer-ingången RIVS i samma leverans — en självklar hemvist; rivningen bokförs öppet i Mer-vyns testflöden.
3. Formen konsumerar BEFINTLIG skapa-operation (ADR-066: server-side-byggd shape, allowlist, Airtable-nativ upsert-idempotens med klient-genererad nyckel) — ingen ny operation för själva skapandet; fältfacitet ÄR operationens kontrakt.
4. UI-språket Event/Eventtyp per ORDLISTA (basens Typ bär enumen; namnkrocken — basens fält med namnet Eventtyp är Eventformat-länken — hålls explicit i mappningen, aldrig implicit).
5. Eventformat-etiketterna ("2 dagar"/"1 dag") mappas explicit mot basens Eventformat-poster via befintlig format-läsning.
6. SlideToConfirm blir NY biblioteks-primitiv (11/11/11): drag-vakter, grepp-krav och offset ur konvergensen; drag-tillstånd i ref (L300); tangentbords- och icke-drag-väg är KRAV för 11:an (draget är förstärkning, aldrig enda vägen); armerat läge = bock + "Publiceras på miranon.se" i monoteckensnitt, ingen fyllnad (K82-rivningen); pling med preferens-respekt; demo- och spec-sektion + a11y-mönster per primitiv-standarden.
7. Publiceringsflaggan: ADDITIVT bas-fält (staging först, prod separat); skapa-operationens allowlist utökas; handtaget armerar flaggan. Vad flaggan STYR på miranon.se (kalender-synlighet, anmälningsformulär, event-sida på webben) är T79:s kontrakt — inte detta kort.
8. Obligatorisk-markeringar: inga — allt krävs, så inget markeras (K84).
9. Leveransen NYSKRIVS; throwaway-kontraktet gäller även den befintliga skarpa formen — facit vinner, formen byggs om efter det.

### Testbeslut

e2e-/axe-skarven bär huvuddelen: ingångens placering och flöde, formens fältfacit, handtagets armering med både mus och tangentbord, skapa-flödet mot staging med teardown; befintlig skapa-event-e2e skrivs om i samma skiva; SlideToConfirm får a11y-mönster-spec, axe-0 och demo-/spec-sektion; renderad verifiering före granskning (L245/L246). api-skarven för flagg-utökningen: allowlist-avgränsning + staging-write-bevis. Idempotensen är redan kontraktstestad — den regressions-bevakas, byggs inte om. Förebilder i kodbasen: skapa-event-kontraktstesterna, Hem-vyns e2e-svit, axe-runnern.

### Utanför omfattningen

- T79: webbplatsen och publicerings-KONTRAKTET (vad flaggan styr på miranon.se).
- Redigering av befintligt event (eventsida-PRD:n).
- Prod-deploy av flaggan (separat auktoriserad handling).
- Ljud- och notispreferenser som app-bred inställningsyta (endast primitivens preferens-respekt här).

### Estimat

4 skivor + QA-kort: (1) SlideToConfirm-primitiven med demo + spec (M) · (2) ingången på vy-raden + hemvist-flytten + Mer-rivningen (M; sekvenseras med lista-PRD:ns listvy-skiva som äger vy-raden) · (3) sidan till facit mot skapa-operationen (L) · (4) publiceringsflaggan: bas-fält + allowlist + armering (M). Cirka 1–1,5 sessioner.

### ADR-koppling

ADR-066 (styrande skapa-kontraktet) · ADR-063 (flaggan additiv; resolution i basen) · ADR-050/061 (staging först; miljö-isolation) · ADR-045 (axe) · ADR-055/057 (DI + lager) · ADR-058 (fitness-audit). Ingen ny ADR väntad — flaggan är ADR-063-klassens additiva fält; T79 bär de framtida kontraktsbesluten.

### Ytterligare anteckningar

- Beslutstrail: S73-doket Del 7 + bilagornas utöknings-sektioner; språktrailen (Kurs → Utbildning → Event/Eventtyp) öppet rättad i ORDLISTA.
- T79-tråden refereras: publiceringsflaggan är trådens första konkreta leverans-gränssnitt; kontraktet ligger kvar i tråden.
- Design-review-grinden är L220-loopen MOT FACIT per UI-skiva.
- Kortet fött i Session 74 ur S73:s facit-utökning.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PRD-behållare utan egna AC — fullbordan definieras av barnen, och samtliga FYRA är Done: 19.1 SlideToConfirm-primitiven, 19.2 skapa-ingången + hemvist-flytten + Mer-rivningen, 19.3 skapa-sidan till facit, 19.4 publiceringsflaggan. Stängd 2026-07-30 (S91 artonde resumen) sedan TASK-90:s nya förälder/barn-invariant fällde den. Samma dubbla blindhet som TASK-17: noll egna AC och ingen förälder/barn-kontroll. Ingen kod rörd vid stängningen; kortet bar ingen kvarvarande bokföring.

— DoD KVITTERAD 2026-07-30 efter grindens fällning. Samma grund som TASK-17: DoD-arvet är per skiva, och samtliga 4 barn har noll obockade DoD-punkter och status Done — inklusive #5 Marcus design-review mot S73-facit-utökningen och #7 bas-additiviteten (ADR-050/ADR-063). Verifierat mot disk.
<!-- SECTION:FINAL_SUMMARY:END -->
