---
id: TASK-368
title: 'PRD: Avbokning och ombokning av anmälan i appen'
status: To Do
assignee: []
created_date: '2026-09-03 07:53'
labels: []
dependencies: []
ordinal: 666000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering
Lotta kan inte avboka en anmälan i appen. När en deltagare hör av sig och inte kan komma måste hon gå till Airtable-basen, hitta anmälan och byta status för hand. Vill personen byta till ett annat datum måste hon dessutom skapa en ny anmälan själv och hålla reda på att pengarna sitter kvar på den gamla. Eventets "Platser kvar" i basen räknar avbokade som upptagna, så ett event kan se fullt ut efter avbokningar. Ingenting av detta loggas, och Roger ser inget skäl.

### Lösning
På anmälans egen sida finns "Avboka anmälan": ett bekräftelsesteg med frivilligt skäl som sätter statusen, loggar händelsen, speglar skälet som datumstämplad rad i anmälans Notering i basen, visar personens betalläge med en direkt väg till återbetalning, och påminner om väntelistan när eventet har en. Avbokningen kan återtas på samma sida, och statusen härleds då ur bekräftelsedatumet. I samma steg kan Lotta i stället välja "Boka om till annat event": den nya anmälan skapas direkt, skälet fylls i, inbetalningen följer med, och en prisskillnad sägs rakt ut med väg till tilläggsinbetalning eller återbetalning. Basens räknare rättas så att avbokade inte längre upptar platser. Grillad samsyn: sessionsdok S115 Del 3, elva beslut, slutkvitterade 2026-09-03.

### Användarberättelser
1. Som Lotta vill jag avboka en anmälan på anmälans sida, så att jag slipper gå till basen.
2. Som Lotta vill jag ha ett bekräftelsesteg innan avbokningen sker, så att ett felklick inte avbokar någon.
3. Som Lotta vill jag kunna skriva ett kort skäl, så att jag och Roger senare ser varför.
4. Som Lotta vill jag att skälet syns i basens Notering på anmälan, så att jag ser det även när jag jobbar i basen.
5. Som Lotta vill jag se i Senaste aktivitet att jag avbokade personen, så att historiken är komplett.
6. Som Lotta vill jag att en avbokad person försvinner ur betalningsinkorgen och dörrlistan, så att jag inte påminner eller checkar in fel person.
7. Som Lotta vill jag se personens betalläge i bekräftelsesteget, så att jag vet om det finns pengar att återbetala.
8. Som Lotta vill jag ha en direkt väg till Registrera återbetalning från avbokningen, så att återbetalningen inte glöms.
9. Som Lotta vill jag kunna återta en avbokning, så att "jag kan komma ändå" inte kräver basen.
10. Som Lotta vill jag att en återtagen anmälan får rätt status tillbaka, så att en redan bekräftad person inte får en ny bekräftelse i onödan.
11. Som Lotta vill jag att eventets Platser kvar stämmer efter en avbokning, så att jag kan erbjuda platsen.
12. Som Lotta vill jag se hur många som står på väntelistan när jag avbokar, så att jag kan erbjuda platsen direkt.
13. Som Lotta vill jag boka om en person till ett annat event i samma steg, så att byte av datum är ett klick.
14. Som Lotta vill jag att skälet fylls i automatiskt vid ombokning, så att kopplingen till det nya eventet finns i klartext.
15. Som Lotta vill jag att personens inbetalning följer med till den nya anmälan, så att hon inte ser ut som obetald.
16. Som Lotta vill jag se prisskillnaden rakt ut vid ombokning, så att jag kan säga rätt belopp i telefonen.
17. Som Lotta vill jag att originalkvittot står kvar vid ombokning utan prisskillnad, så att bokföringen inte förbrukar kvittonummer i onödan.
18. Som Lotta vill jag att en prisskillnad bokförs med tilläggsinbetalning eller kreditkvitto för bara mellanskillnaden, så att kvittoserien speglar verkliga pengarörelser.
19. Som Lotta vill jag att avbokade personer syns under Avbokade på eventsidan, så att jag ser vilka som hoppat av.
20. Som Roger vill jag att en avbokning i appen ser likadan ut i basen som en gjord för hand, så att mina vyer fungerar oförändrat.
21. Som Lotta vill jag att knappen försvinner när anmälan redan är avbokad och ersätts av Återta, så att jag inte kan avboka två gånger.
22. Som Lotta vill jag att avbokning fungerar på mobilen, så att jag kan göra det när någon ringer.
23. Som Lotta vill jag att ett fel visas begripligt om avbokningen inte gick igenom, så att jag vet att basen inte ändrats.
24. Som Marcus vill jag att alla skrivningar går via allowlistade operationer, så att prod-basen aldrig skrivs utanför kontraktet.

### Implementationsbeslut
- Ny allowlistad operation för statusskrivning på Anmälningar med exakt två tillåtna övergångar: aktiv status till "Avbokad/Ombokad", och "Avbokad/Ombokad" till härledd status ("Bekräftad (mail skickat)" när Bekräftelse skickad är satt, annars "Obekräftad"). Ingen annan statusskrivning. Notering skrivs som append med datumstämpel och aktör, aldrig som ersättning.
- Aktivitetsloggverb: avbokade anmälan, återtog avbokning, bokade om anmälan. Objekt är anmälan; ombokningens statement refererar båda anmälningarna.
- Avbokningssteget på anmälans sida: bekräftelse, frivilligt skäl, betalläge (summa inbetalt, kvar), väntelistepåminnelse (antal plus länk) när eventet har väntelista, valet Avboka eller Boka om till annat event. Knappen visas bara för aktiva anmälningar; avbokade visar Återta avbokning. Anmälans sida är facit-stämplad sedan S111: ändringen går via ADR-102-amenderingsmekaniken med nytt stämplat facit.
- Ombokning: ny anmälan via befintlig skapa-anmälan-operation (källa Manuell); gamla anmälan sätts till "Avbokad/Ombokad" med skälet "Ombokad till <event, datum>"; aktiva inbetalningar byter anmälan (raden flyttas, ögonblicksbilden av event uppdateras på raden, kvittot rörs aldrig); spegeln räknas om på båda anmälningar; allt loggas. Kvittobeteende per research (docs/research, kvitto vid ombokning 2026-09-03): vid samma pris står originalkvittot oförändrat, flytten är en rättelse av bokföringspost med spårbarhet i loggen; vid prisskillnad bokförs bara mellanskillnaden med befintlig mekanik, tilläggsinbetalning med eget kvitto när det nya eventet är dyrare, negativ inbetalning med kreditkvitto när det är billigare.
- Prisskillnaden visas rakt ut i ombokningssteget med länk till Registrera återbetalning respektive registrera inbetalning. Inkorgen ändras inte.
- Räknarfixen i basen (TASK-213.8 och 213.9): eventets Antal anmälningar blir en rollup över Är aktiv (1/0), och Är aktiv exkluderar även Inställt. Staging-basen först; prod-basen efter Marcus GO i klartext; vyer och interfaces som läser fälten inventeras via claude.ai-connectorn innan bytet.
- Deltaganden-raderna lämnas orörda, appens filtrering vid incheckning är kompensationen (känd gräns).
- Inget mail i v1.
- Beslut 8 (inbetalningen följer bokningen, kvittot orört, mellanskillnad via kreditmekaniken) når ADR-baren och mintas som egen ADR i ombokningsskivan.
- Två leveranser: först avboka, återta och räknarfixen; sedan ombokning och väntelistepåminnelsen.

### Testbeslut
- Acceptanstest i browsern på anmälans sida i den hermetiska fixturvärlden, förebild: anmälans detaljsidas befintliga acceptanstest. Prövar det Lotta ser: avboka med och utan skäl, återta, ombokningsgenvägen, prisskillnadstexten, väntelistepåminnelsen, knappens synlighet per status, felläget, axe noll överträdelser.
- API-test mot staging-funktionen, förebild: bekräftelseutskickets stagingtest. Prövar serverkontraktet: tillåtna och förbjudna övergångar, Notering-append, loggverb, ombokningens flytt av inbetalning med omräknad spegel på båda anmälningar, idempotens vid dubbelanrop.
- Allowlist-vakten (befintlig grind) täcker att inga andra fält skrivs.
- Räknarfixen: schemaläsning och ögonbevis i staging-basen med granskningsfixtur, sedan prod.
- Testa externt beteende, aldrig komponentstate. Skarvarna bedömda på Marcus mandat (S115).

### Utanför omfattningen
Avbokningsmail och mall · automatiskt väntelisteerbjudande · städning av Deltaganden-rader · spårbar länk mellan gammal och ny anmälan i basen · bulkavbokning på Åtgärds-sidan · avbokningsregler och avgifter (inga finns dokumenterade) · inkorgssektion för överbetalningar.

### Estimat
Sex skivor plus QA, alla M: räknarfixen i basen · operationen med funktion, allowlist och logg · anmälans sida med avboka och återta samt facit-amendering · ADR och ombokningens serverdel · ombokningens steg med prisskillnad och väntelistepåminnelse · QA-vandring (ready-for-human). Leverans 1 = de tre första, leverans 2 = resten.

### ADR-koppling
ADR-128 (inbetalningen som sanning, spegeln), ADR-129 (jobbmotorn), ADR-109 (kvittoserien), ADR-102/103/104 (facit, promovering, stämpel), ADR-063 (basen som förstklassig leverabel), ADR-053 (triage). Ny ADR för beslut 8 mintas i ombokningsskivan, aldrig inline här.

### Ytterligare anteckningar
Källor: sessionsdok S115 Del 2 och 3; fakta-passet om avbokning i dagens system (S115); research kvitto vid ombokning 2026-09-03. Prod-deploy av Edge Functions sker via fas4-skriptet i Marcus terminal. Dagens statusvärde "Avbokad/Ombokad" behålls oförändrat.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
