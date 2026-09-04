---
id: TASK-370
title: >-
  PRD: Förhandsgranska alla väntande kvitton som ett dokument — försättsblad +
  en sida per kvitto, ett fönster
status: Done
assignee: []
created_date: '2026-09-03 08:26'
updated_date: '2026-09-04 13:34'
labels: []
dependencies: []
references:
  - tasks/sessions/2026-09-03-session-116.md
  - docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md
ordinal: 666000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering
Lotta registrerar flera inbetalningar i betalningsinkorgen och vill se hur kvittona blir INNAN hon trycker Skicka N kvitton. I dag finns förhandsgranskning bara per rad: sex kvitton betyder sex klick och sex webbläsarfönster. Dessutom delade alla rader ett enda laddläge, så när ett kvitto renderade såg alla knappar ut att arbeta och ingen annan rad gick att klicka (Marcus 2026-09-03, prod; buggen rättas i TASK-369). Marcus ordagrant: 'INTE att sex nya fönster öppnas i webbläsaren utan ETT fönster med 6 sidor.'

### Lösning
En knapp Förhandsgranska alla N bredvid Skicka N kvitton (när N ≥ 2) öppnar ETT fönster med ETT PDF-dokument: först ett försättsblad (kontrollblad i kvittots formspråk med kvittots sidhuvud, antal kvitton och tidpunkt, tabell namn · mottagarens e-post · event · belopp · betalsätt, summarad, notraden 'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.'), därefter en sida per väntande kvitto i granskningsblockets ordning, varje sida identisk med dagens enskilda förhandsgranskning inklusive platshållaren FÖRHANDSVISNING som kvittonummer. Per-rad-knappen finns kvar för ett enskilt kvitto; med exakt ett väntande kvitto är det dagens knapp oförändrad. Går ett av N kvitton inte att rendera skapas inget dokument alls: fönstret stängs och felet på sidan namnger personen. Knapparna är oberoende: bara den tryckta laddar, övriga är klickbara och öppnar egna fönster. Grillad samsyn S116 Del 2, sex beslut kvitterade i klartext.

### Användarberättelser
1. Som Lotta vill jag trycka på EN knapp och se alla väntande kvitton i ett enda dokument, så att jag slipper öppna ett fönster per kvitto.
2. Som Lotta vill jag att dokumentet börjar med ett försättsblad som listar namn, e-postadress, event, belopp och betalsätt för varje kvitto, så att jag ser på en sida om rätt kvitto går till rätt person innan jag trycker Skicka.
3. Som Lotta vill jag att försättsbladet visar summan av alla kvitton, så att jag kan stämma av mot vad jag registrerat.
4. Som Lotta vill jag att försättsbladet ser ut som kvittona (samma logga, samma typsnitt, samma rutor), så att dokumentet känns som ett och inte som en utskrift ur appen.
5. Som Lotta vill jag att varje kvittosida ser ut exakt som det kvitto som kommer att skickas, så att förhandsgranskningen är sann.
6. Som Lotta vill jag att förhandsgranskningen tydligt visar att inget nummer tilldelats och inget skickats, så att jag aldrig förväxlar ett utkast med ett skickat kvitto.
7. Som Lotta vill jag att fönstret öppnas direkt när jag klickar och fylls när dokumentet är klart, så att webbläsaren inte blockerar det som popup.
8. Som Lotta vill jag att kvittona kommer i samma ordning som i listan på skärmen, så att jag kan bläddra och jämföra rad för rad.
9. Som Lotta vill jag få ett tydligt fel med personens namn om något kvitto inte går att skapa, i stället för ett dokument där ett kvitto tyst saknas, så att jag rättar rätt sak.
10. Som Lotta vill jag kunna förhandsgranska ett enskilt kvitto per rad som i dag, så att jag snabbt kan titta på Annas kvitto utan att bläddra i tjugo sidor.
11. Som Lotta vill jag kunna trycka på flera förhandsgranskningsknappar i följd utan att vänta, så att en rendering inte låser resten av sidan.
12. Som Lotta vill jag se laddläge bara på den knapp jag tryckte, så att jag vet vilket kvitto som är på väg.
13. Som Lotta vill jag att en förhandsgranskning aldrig skickar något eller tilldelar ett nummer, så att jag kan öppna den hur många gånger som helst.
14. Som Lotta vill jag att förhandsgranskningen fungerar även när kvittona i kön hör till olika event, så att en blandad omgång inte blir ett specialfall.
15. Som Lotta vill jag få ett begripligt meddelande om jag har fler väntande kvitton än dokumentet klarar, så att jag vet vad jag ska göra i stället för att få en tyst delmängd.
16. Som Lotta med skärmläsare vill jag att knappen Förhandsgranska alla N har ett namn som säger hur många kvitton den avser, så att den går att skilja från radknapparna.
17. Som Roger vill jag att förhandsgranskningen aldrig påverkar kvittoserien eller verifikationskedjan, så att bokföringen förblir orörd tills kvittona faktiskt skickas.
18. Som Marcus vill jag att kvittomallen och det skarpa sändflödet inte rörs av denna funktion, så att ett fel i förhandsgranskningen aldrig kan regrediera utskicket.
19. Som Marcus vill jag att ett dokument med N sidor kostar lika mycket som ett med en sida, så att förhandsgranskning aldrig blir en kostnadsfråga.
20. Som utvecklare vill jag att försättsbladets utseende granskas av Marcus mot renderad PDF, eftersom mallen saknar förlaga hos Lotta.

### Implementationsbeslut
- Teknisk väg (beslut 6, forskningsbelagd): ETT dokument, ETT DocRaptor-anrop. Edge Function-lagret fyller kvittomallen en gång per kvitto med befintlig underlags- och fyllningslogik, sätter försättsbladet först och kvittoblocken efter varandra med sidbrytning (break-before: page), gör dokumentet självbärande EN gång och skickar det som ett HTML-dokument. Kvittomallen, dess CSS och det skarpa sändflödet rörs inte. DocRaptor fakturerar per dokument, inte per sida (verifierat 2026-09-03), så kostnaden är oförändrad.
- Kontrakt mot klienten: förhandsgransknings-EF:en tar additivt en lista av inbetalnings-ID:n (i visningsordning) vid sidan av dagens enskilda ID; svarsformen (signerad länk + utgångstid) är densamma. Listan valideras som UUID:er, dubbletter avvisas, tomma listor avvisas.
- Tak: 30 kvitton per dokument som startvärde, justeras efter mätning vid N ≈ 30 mot vårt eget klienttak (30 s, DocRaptors synkrona gräns är 60 s). Över taket svarar EF:en med ett tydligt fel som klienten visar; aldrig en tyst delmängd.
- Allt eller inget (beslut 4): ett trasigt underlag bland N fäller hela anropet med personens namn i felet. Ingen felsida i dokumentet, ingen markering på försättsbladet.
- Lagringsnyckel: kön kan spänna över flera event, så det kombinerade utkastet får en egen nyckelform (under en utkast-prefix för kombinerade dokument, nycklad på anrop, inte på event). ADR-124:s invariant 'en fil per event och typ' amenderas i § Updates med den nya formen; samma livstid och städning som dagens utkast.
- Försättsbladet (beslut 2–3): egen mall i kvittomallens familj som återanvänder kvittots sidhuvud (logga + rubrikblock) och delade CSS. Innehåll: rubrik Förhandsgranskning, antal kvitton och tidpunkt, tabell namn · mottagarens e-post · event · belopp · betalsätt, summarad, notrad. Husets första mall utan förlaga: Marcus är facit mot renderad PDF; beslutet bokförs i mallkatalogens README § Förlagorna. Mallen finns bara i förhandsgranskningen, aldrig i ett skickat kvitto.
- Kvittosidorna: identiska med dagens enskilda förhandsgranskning, platshållaren FÖRHANDSVISNING på varje sida (Stripe-precedent: inget gissat löpnummer före finalisering).
- Klienten (beslut 1 och 5): knappen Förhandsgranska alla N bredvid Skicka N kvitton när N ≥ 2, med tillgängligt namn som bär antalet; per-rad-knappen kvar; N = 1 oförändrat. Fönster-först-mönstret oförändrat (fönstret öppnas synkront i klicket, laddningssida, adress sätts vid svar, stängt-fönster-vakt). Laddläge och spärr per anrop, byggt på per-ID-mekanismen från TASK-369; alla förhandsgranskningsknappar oberoende av varandra.
- Sekvens: minimaltest (två kvitton, en sidbrytning, verifierat med pdfinfo/pdftotext/pdffonts mot DocRaptors testnyckel) FÖRE EF-bygget, sedan mätning vid N ≈ 30; testet lever vidare som permanent staging-test.

### Testbeslut
Tre befintliga skarvar, ingen ny (orkestrerarens bedömning på Marcus mandat, S116):
1. Enhetsnivå utan DocRaptor — samma skarv som förhandsgranskningens och mall-renderarens befintliga tester: kompositionen (N underlag → ett dokument, försättsbladet först, sidbrytning mellan kvittona), allt-eller-inget med personens namn, taket, valideringen av ID-listan, lagringsnyckelns form. Testa externt beteende (indata → HTML-struktur och svar), inte interna hjälpfunktioner.
2. Staging-skarpbevis — samma skarv som dagens preview-receipt-test i staging: två kvitton in, en PDF ut med exakt tre sidor, Carlito inbäddat på alla sidor, rätt namn och belopp på rätt sida, ingen överlappning vid sidbrytningen. Minimaltestet blir detta test.
3. Hermetisk acceptance för betalningsinkorgen (EF-mockad, som befintliga inkorgstester): knappen finns bara vid N ≥ 2 och bär antalet i namnet, fönster-först, per-anrop-laddläge, radknapparna opåverkade, felmeddelande med personens namn vid mockat fel. Negativt bevis mot förlagans komponent.
Försättsbladets utseende verifieras med mall:pdf-renderingen och Marcus ögon i QA-skivan (ready-for-human).

### Utanför omfattningen
Efterhandsgranskning av redan skickade kvitton i bulk (visa-vägen är orörd). Felsidor eller partiella dokument. Gissade löpnummer. Ändringar i kvittomallen, kvittots CSS eller sändflödet. Server-härledd kö (utan kvitto-fältet, TASK-346.4/S115) — funktionen läser dagens session-lokala kö och följer automatiskt om kön blir server-härledd. Utskrift eller nedladdning från försättsbladet.

### Estimat
Fem skivor, storleksklass S–M: EF-komposition + lagringsnyckel + ADR-124-amendering (M) · försättsbladets mall (S–M, ready-for-human-kontroll) · staging-skarpbevis inkl. N ≈ 30-mätning (S) · knappen i inkorgen + acceptance (S–M, beroende TASK-369) · QA-vandring (ready-for-human).

### ADR-koppling
ADR-124 (utkastens lagring: 'en fil per event och typ' amenderas i § Updates — under baren, amendering inte ny ADR) · ADR-125 (mall-renderaren i EF-lagret) · ADR-128/129 (inbetalningen som sanning, jobbmotorn: förhandsgranskningen är sidoeffektsfri och rör ingen av dem) · ADR-119 (pdf-lib rivet — bekräftas: ingen sammanslagning, ingen återinförd dependency) · ADR-113 (knappars laddläge). Inget beslut i denna PRD når ADR-baren; grillad samsyn bor i sessionsdok S116 Del 2.

### Ytterligare anteckningar
Research: research-passet 'kvitto-forhandsgranskning-flera-som-ett-dokument' (2026-09-03) — DocRaptor per dokument, Visma/Fortnox/Pretix-precedent, Prince break-before, transient activation. Ordlista: Förhandsgranskning (kvitton), Försättsblad. Buggfixen TASK-369 (laddläge per rad) landar först och bär per-ID-mekanismen som knappen hänger på.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket
- [x] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga
- [x] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Samtliga fem barn (370.1-370.5) Done. Landning: EF-kompositionen + lagringsnyckel (370.1), försättsbladet (370.2), staging-skarpbevis PR #2264 (mergad 90cc3ac1, 2026-09-04), knappen i inkorgen PR #2255 (mergad), QA-vandring 370.5 (Marcus godkännande, S119 stängningsbatch 1). DoD #4-6 (ärvda PRD-grindar: minimaltest/N≈30-mätning, ADR-124-amendering, mallparitet) verifierat gröna på 370.1/370.2, ej upprepade på parent-nivå. Flippad av orkestrerar-svepet i S119 stängningsbatch 1 efter att invariant 3 (samtliga barn Done, förälder öppen) upptäcktes av scripts/check-backlog-closure.sh.
<!-- SECTION:FINAL_SUMMARY:END -->
