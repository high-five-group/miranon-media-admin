---
id: TASK-17
title: 'PRD: Event-listan till S72-facit'
status: Done
assignee: []
created_date: '2026-07-21 07:56'
updated_date: '2026-07-30 20:39'
labels: []
dependencies: []
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Dagens skarpa event-lista löser "vilka event finns", men inte hur Lotta faktiskt skannar sitt eventår: kontrollraden bär två tekniska Selecter (status + sortering) som inget belagt ärende efterfrågat, korten säger olika mycket beroende på datat, och det finns ingen kalenderform trots att verksamheten är kalenderdriven. Session 72 grillade fram samsynen och konvergerade listan i browsern till ett låst facit (Marcus: "Facit, vi låser hela event-listans yta"). Dagens lista ser inte ut så.

### Lösning

Listan byggs om till facitet: en vy-ikon-toggel (lista förvald) och en period-toggle [ Kommande | Tidigare ] ersätter Selecterna; eventen grupperas under månadsrubriker; varje kort är likformigt i Hem-kortets grammatik (rubrik, datumrad, beläggningsrad, status endast vid avvikelse, bor över-rad); tomt läge är lugn strukturerad text; och en kalendervy visar månaden med kursfärgade dagar, legend och månadssummering — dag-tryck visar dagens event som kort. URL:en bär både tidshorisonten (?period) och vyvalet (?vy) så lägen går att dela och backa till.

### Användarberättelser

1. Som administratör vill jag växla mellan Kommande och Tidigare med en pill-toggle, så att jag når rätt tidshorisont med ett tryck i stället för två Selecter.
2. Som administratör vill jag att Kommande visar närmast först och Tidigare senast först utan sorteringsval, så att ordningen alltid är den jag förväntar mig.
3. Som administratör vill jag se eventen grupperade under månadsrubriker ("Juli 2026"), så att jag ser årets rytm utan att läsa datum rad för rad.
4. Som administratör vill jag att varje kort visar eventnamnet som rubrik och att hela kortet är klickyta till eventets sida, så att jag når handläggningen i ett klick.
5. Som administratör vill jag se veckodag, dag och ort på en rad, och flerdagars-event som spann ("25–27 juli"), så att jag ser när och var utan att öppna kortet.
6. Som administratör vill jag se "X av Y platser" i text på varje kort, så att beläggningen aldrig kräver att jag tolkar enbart en färg.
7. Som administratör vill jag att fullbokade event markeras med grön kontur och "Fullt", så att jag direkt ser var det är stopp.
8. Som administratör vill jag att Inställt och Flyttat visas som tydlig markering — inställda event dämpade med genomstruken rubrik — medan Planerat och Genomfört är tysta, så att endast avvikelser sticker ut.
9. Som administratör vill jag se hur många som bor över per event direkt på kortet, så att logistiken syns redan i översikten.
10. Som administratör vill jag växla till en kalendervy där dagar med event bär kursens färg och en legend förklarar färgerna, så att månadens form syns på en blick.
11. Som administratör vill jag trycka på en dag i kalendern och se dagens event som kort med en väg tillbaka till hela månaden, så att jag kan zooma in utan att tappa sammanhanget.
12. Som administratör vill jag se en månadssummering under kalendern med kursfärgs-markeringar, så att månadens innehåll finns även i listform.
13. Som administratör vill jag att ett tomt läge visar lugn, strukturerad text, så att "inga event" ser avsiktligt ut och inte trasigt.
14. Som administratör vill jag att listan öppnar i sin slutliga geometri utan hopp (Lugnt laddläge), så att skärmen aldrig studsar när data landar.
15. Som administratör vill jag att vy- och periodval ligger i URL:en, så att jag kan dela och återvända till exakt samma läge.
16. Som administratör vill jag nå toggle, kort, kalender och dagval med enbart tangentbord, så att listan fungerar oavsett styrsätt.
17. Som skärmläsaranvändare vill jag att månadsrubrikerna är riktiga rubriker och att kalenderns dagar annonseras begripligt, så att jag får samma karta som ögat.
18. Som administratör vill jag att förhöjd kontrast, reducerad rörelse och utskrift respekteras, så att mina systeminställningar gäller även här.

### Implementationsbeslut

1. S72-facitet är designfacit: facit-skärmdumparna i S72-bilagan (listvyn + kalendervyn) är bedömningsunderlaget; prototypens lägen kan återuppstå ur git via bilagans commit-trail. Prod-listan ska rendera EXAKT lika.
2. Grund-arvet tillämpas rakt av: kort-grammatiken, Lugnt laddläge (skeleton i slutgeometri + persist), app-reglerna, token-disciplinen (inga hårdkodade färger), 16 px inset.
3. Pill-toggeln blir NY biblioteks-primitiv på React Aria ToggleButtonGroup (11/11/11; minimaltest först, demo- och spec-sektion per NavCard-precedenten). Vy-toggeln och period-toggeln konsumerar den; eventsidans flik-kapslar återanvänder formen — delbehovet är belagt.
4. EventCard och månadsgrupperingen är vy-lokala (11/10/10, DashboardCard-snittet); beläggningsstapel och dag-pill lyfts till biblioteket först vid bevisat delbehov.
5. URL-kontraktet: ?period=upcoming|past ersätter ?status+?sort; ?vy=kalender bär vyvalet; URL-STATE-spec:en och berörda e2e-flöden skrivs om i samma skiva. Period härleds alltid ur startdatum mot idag — aldrig ur Status-fältet (ORDLISTA: Period; stänger T14 tekniskt).
6. Kort-anatomin är slot-modellens: alla rader renderas alltid (platshållare vid saknat värde, tvåraders rubrik-reserv) så korten är likformiga; status-slotten topp-höger bär endast avvikelse (Inställt/Flyttat); Fullbokat = grön kontur + grön stapel där texten bär och färgen förstärker.
7. Kalendervyn drivs av React Aria Calendar-motorn (minimaltestad i prototypen) med FK-skinnet: månadsnav ersätter period-toggeln i kalenderläget; dagarnas plattor är solida i exakt legendens kulör; vald dag = guld med mörk ring.
8. Kursfärgerna blir semantiska tokens ur segment-taxonomin (ADR-064) — skarp mappning kurs mot färg, inte prototypens namn-matchning; riktvärdet ≤5–7 färger med "Annat" som uppsamling.
9. Bor över-raden läser en härledd summering av bor över-markeringarna per Anmälan. Själva bas-fältet ägs av eventsida-PRD:n — list-skivan beroende-markeras mot den skivan.
10. Läs-shapen utökas med eventKey och bor över-summeringen (read-only-utökning av befintlig event-läsning; eventKey finns redan i basen).
11. Veckonummer-kolumnen (FK-referensen har den) utelämnas — aldrig efterfrågad i konvergensen; öppet bokfört.
12. Leveransen NYSKRIVS genom leverans-grindarna; prototypkod absorberas aldrig (throwaway-kontraktet) — facit är referens, inte källa.

### Testbeslut

Två befintliga skarvar (familje-skarv-kvittensen, Marcus 2026-07-21), inga nya skarv-klasser. e2e-/axe-skarven bär UI-beteendet: toggle-växlingen och URL-kontraktet (?period/?vy), månadsrubrikernas struktur, slot-modellens likformighet, avvikelse-markeringarna, kalenderns legend-mot-plattor-paritet, dag-tryckets flöde, tomläget och tangentbordsnavigationen — befintliga list-e2e-flöden skrivs om i samma skiva som ändrar ytan; nya primitiven får a11y-mönster-spec och axe-0. Visuella krav verifieras renderat (computed-style/skärmdump), aldrig enbart ur källkod. api-skarven används endast för läs-shape-utökningen (eventKey + bor över-summeringen) per befintligt kontraktstest-mönster. Ingen unit-skarv. Förebilder i kodbasen: Hem-vyns e2e-svit, befintliga event-list-e2e:n, axe-runnern.

### Utanför omfattningen

- Bor över-BAS-fältet och kryss-flödet (eventsida-PRD:n äger dem; listan läser summeringen).
- Skapa-ingången på vy-väljarraden (skapa-PRD:n äger hela ingången).
- Check-in-sidan och anmälans egen sida (ej konvergerade — egna framtida konvergenser).
- Illustrations-tomlägen (eventuellt framtida app-brett beslut).
- Veckonummer-kolumnen.
- Prod-deploy av shape-utökningen (separat auktoriserad handling).

### Estimat

4 skivor + QA-kort: (1) ToggleButtonGroup-primitiven med demo + spec (M) · (2) listvyn till facit — slot-korten, månadsgrupperna, tomläget, ?period-kontraktet + URL-STATE-spec + e2e-omskrivningen (L) · (3) kalendervyn — Calendar-ytan, kursfärgs-tokens, ?vy, månadssummeringen (L) · (4) läs-shape-utökningen + bor över-raden (M; beroende av eventsida-PRD:ns bas-fält-skiva). Cirka 1,5–2 sessioner.

### ADR-koppling

ADR-055 (data via router-context-DI) · ADR-057 (lager-oberoende) · ADR-072 + ADR-017 (persist/poll — Lugnt laddläge-arvet) · ADR-064 (kursfärgs-taxonomin) · ADR-063 (bas-additivitet; fältet ägs av eventsida-PRD:n) · ADR-045 (axe-baseline) · ADR-058 (arkitektur-fitness-audit vid leverans) · ADR-061 (dev mot staging). Inga nya ADR:er påkallade — S72-prövningen lade samtliga beslut under baren.

### Ytterligare anteckningar

- Beslutstrail: S72-doket Del 2 (grillade samsynen, 8 beslut) + Del 3 (facit) + S72-bilagan (facit-paret + commit-trail + öppna punkter).
- Design-review-grinden är L220-loopen MOT FACIT per skiva med UI-yta; facit-avprickning med renderad verifiering före granskning (L245/L246).
- ADR-073-partitionering: primitiven (skiva 1) och kalendervyn (skiva 3) är disjunkta mot eventsida-PRD:ns tidiga skivor — kandidater för parallell batch.
- Kortet fött i Session 74 (familje-PRD-passet) ur S72-konvergensen.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Design-review MOT S72-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
PRD-behållare utan egna AC — fullbordan definieras av barnen, och samtliga SEX är Done: 17.1 ToggleButtonGroup-primitiven, 17.2 listvyn till S72-facit, 17.3 kursfärgs-tokensen (ADR-064-mappningen), 17.4 kalendervyn till S72-facit, 17.5 läs-shape-utökningen + bor över-raden, 17.7 filtervyn + skriv ut (review-iteration 1). Stängd 2026-07-30 (S91 artonde resumen) sedan TASK-90:s nya förälder/barn-invariant fällde den. Kortet var osynligt för den gamla grinden av TVÅ skäl samtidigt — noll egna AC och ingen förälder/barn-kontroll — vilket är exakt den blindhet TASK-90 byggdes för att stänga. Ingen kod rörd vid stängningen; kortet bar ingen kvarvarande bokföring.

— DoD KVITTERAD 2026-07-30 efter att stängnings-grinden fällde kortet på obockade krav. Föräldern bär det DoD-arv skivorna ärvde, och punkternas egen text säger PER SKIVA (L220/L245/L246). Verifierat mot disk, inte antaget: samtliga 6 barn har noll obockade DoD-punkter och status Done — inklusive #5 Marcus design-review mot S72-facit och #6 facit-avprickningen. Kraven är alltså infriade på den nivå där de var ställda. Grinden hade rätt att fälla: en Done-förälder med obockat DoD är oläsbar för nästa läsare, oavsett var kvittensen faktiskt bor.
<!-- SECTION:FINAL_SUMMARY:END -->
