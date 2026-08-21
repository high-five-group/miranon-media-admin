---
id: TASK-283
title: 'PRD: Bokstavsindex i personlistan'
status: To Do
assignee: []
created_date: '2026-08-21 08:41'
updated_date: '2026-08-21 11:34'
labels: []
dependencies: []
ordinal: 509000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta ska hitta en person i ett register på 559. Idag finns exakt en väg in: fritextsökrutan. Den kräver att hon vet vad personen heter och stavar rätt.

Vill hon i stället **bläddra** — "vem var det som började på K?" — finns ingen väg alls. Listan ÄR sorterad på namn, men den hämtas 50 rader i taget, så att ta sig till K betyder elva tryck på "Ladda fler" och en lång skrollning.

Och en tredjedel av registret gör det värre: **186 av 559 personer bär inget namn**. De renderas alla med samma sträng, och eftersom listan sorteras på namn ligger de som ett obrutet block mitt inne i bokstaven E — ungefär fyra hela sidor av identiska rader som Lotta måste passera för att komma till F.

### Lösning

En rad bokstavsknappar under sökrutan. Ett tryck filtrerar listan till personer vars namn börjar på den bokstaven.

Det är ett **filter**, inte ett scroll-hopp — samma serverväg som sökrutan redan går. Valet är inte en preferens: mönstret från iOS och Android förutsätter en färdighämtad, lokalt sorterad lista, och den förutsättningen har vi avsiktligt inte. Datakällan saknar dessutom både numerisk position och räkne-primitiv, så ett ärligt "hoppa till K" måste bli en ny serverfråga ändå. De två vägarna konvergerar till samma mekanism, och filtret är den billiga.

Raden bär de 29 svenska bokstäverna i kollationsordning (A–Z, sedan Å, Ä, Ö) plus en namngiven hink sist: **"Utan namn"**. Bokstäver som saknar personer är kvar på sin plats men nedtonade, så raden aldrig byter längd. Bokstav och fritext kombineras.

Lotta får därmed två ingångar som samverkar i stället för en som kräver att hon minns rätt.

### Användarberättelser

1. Som Lotta vill jag trycka på en bokstav under sökrutan, så att jag ser bara personer vars namn börjar på den, utan att skriva något.
2. Som Lotta vill jag att bokstavsraden ligger direkt under sökrutan, så att jag ser båda ingångarna samtidigt och förstår att de hör ihop.
3. Som Lotta vill jag att den valda bokstaven syns tydligt markerad, så att jag vet varför listan är kort.
4. Som Lotta vill jag kunna trycka på samma bokstav igen för att släppa filtret, så att jag kommer tillbaka till hela listan utan att leta efter en rensa-knapp.
5. Som Lotta vill jag att räknar-raden säger hur många den filtrerade listan innehåller, så att jag vet om jag ser allt eller bara en sida.
6. Som Lotta vill jag att bokstäver utan personer syns men är omöjliga att trycka på, så att raden ser likadan ut varje gång och jag lär mig var bokstäverna sitter.
7. Som Lotta vill jag att Å, Ä och Ö ligger sist efter Z, så att raden följer det svenska alfabetet jag lärde mig.
8. Som Lotta vill jag hitta personer utan namn under en egen knapp som heter "Utan namn", så att jag förstår att de finns och kan nå dem.
9. Som Lotta vill jag att personer utan namn INTE dyker upp när jag trycker på E, så att E visar personer som faktiskt heter något på E.
10. Som Lotta vill jag kunna skriva i sökrutan medan en bokstav är vald, så att jag kan smalna av ytterligare i stället för att börja om.
11. Som Lotta vill jag att en bokstav plus en sökning som inte ger något visar ett tydligt tomläge, så att jag ser att sidan fungerar och att det bara inte fanns någon.
12. Som Lotta vill jag att mitt val ligger kvar i adressfältet, så att jag kan gå in på en person, backa, och hamna i samma filtrerade lista igen.
13. Som Lotta vill jag att bokstavsknapparna är tillräckligt stora att träffa på telefonen, så att jag inte råkar välja fel bokstav.
14. Som Lotta vill jag nå hela raden med tangentbordet, så att jag kan arbeta utan att flytta handen till musen.
15. Som en användare med skärmläsare vill jag höra vilken bokstav som är vald och att listan uppdaterats, så att jag vet att mitt tryck fick effekt.
16. Som en användare med skärmläsare vill jag att raden presenteras som en sammanhållen grupp kontroller, så att jag kan hoppa förbi den i stället för att tabba genom 30 knappar.
17. Som Marcus vill jag att raden inte flyttar innehållet under sig när den ändrar tillstånd, så att appens layouthopp-förbud håller också här.
18. Som utvecklare vill jag att bokstavsfiltret går samma serverväg som fritextsökningen, så att jag inte får en andra filtermekanism att underhålla.

### Implementationsbeslut

**Ytan bär ett stämplat facit, och det styr arbetets form.** Manifestet är `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json`, med en enda yta i `ytor[]`: **`personlistan`** (godkänd av Marcus 2026-08-10, citat *"Ser bra ut, godkänner"*). Manifestets egen not slår fast vad som är låst: tonal kortyta med avdelare, låst radhöjd, status som egen kolumn med reserverad plats, e-post ensam på kontaktraden, interaktionsraden avskild med 4 px utan ikon. **Bokstavsraden rör inte en enda av dem** — den läggs ovanför en i övrigt orörd lista. Manifestet noterar också att det mekaniska facit inte är bilderna utan ARIA-referenserna bakom promoverings-grinden.

**Facit-amenderingen följer väg A (Marcus beslut 2026-08-21, se T157).** Ordningen är enkelriktad och får inte kastas om: bygget landar först bakom sin egen skiva, Marcus granskar raden visuellt, och **först därefter** regenereras ARIA-referenserna i en egen commit med hans citat inskrivet i manifestet som daterad amendering. Att låta bygget regenerera referenserna själv är uttryckligen förkastat — då återställs låset av samma landning som bröt det.

**Filtret byggs som ett tredje AND-villkor i Personer-EF:ens befintliga formel.** EF:en komponerar redan bas-filtret med sökfiltret via AND; bokstaven är samma mönster, inte en ny mekanism. Sökfiltrets egna byggstenar återanvänds.

**Bokstavsjämförelsen är diakritik-korrekt, och det är mätt (fälla 51).** Basens sortering veckar Å mot A, men filter-jämförelse med likhetstecken gör det inte — Å-namn läcker aldrig in i A-hinken. Raden kan därför byggas i svensk kollationsordning trots att bläddringsordningen inte följer den.

**Sentinelen undantas explicit ur E.** Strängen som markerar namnlös person sorterar bokstavligen inuti E, så ett naivt E-filter drar med sig samtliga 186. Undantaget är en mätt korrekthetsbugg om det utelämnas, inte en finess.

**"Utan namn" är en egen hink sist i raden**, byggd på exakt likhet mot sentinel-strängen. Formen är vårt eget val: nummertecken-konventionen i iOS betyder "icke-alfabetisk sorteringsnyckel", inte "saknar namn", och en namngiven hink är begripligare.

**Nedtoningen binds till HELA registret, aldrig till aktuell sökterm.** Bunden till söktermen hade 28 knappar slocknat medan Lotta skriver, och raden hade flimrat. Antalet per bokstav är dessutom nästan gratis: EF:en gör redan en separat genomgång av alla namn för att räkna totalen, så fördelningen är en biprodukt av arbete som redan utförs. Att den faktiskt är det ska verifieras mot koden innan det byggs, inte antas.

**Raden byter aldrig längd.** Tomma bokstäver är nedtonade och kvar på sin plats — appens layouthopp-förbud gäller också en kontrollrad.

**Å, Ä och Ö ligger sist efter Z.** Belagt via två oberoende samstämmiga källor; den formella svenska sorteringsstandarden är en betalstandard och kunde inte citeras, vilket är öppet bokfört i research-passet.

**Noll personer i registret börjar på Ä eller Ö idag.** Nedtoningen är alltså ett konkret nuvarande tillstånd för just de två knapparna, inte ett hypotetiskt kantfall.

**Kontrollerna är vanliga knappar med tryckt-tillstånd, inte en radiogrupp.** Appen har redan gjort samma medvetna val på en annan yta, och den precedenten följs. Raden hålls ihop som en grupp med rullande tabbindex så en skärmläsaranvändare kan passera den i ett steg.

**Träffytan är minst 24×24 CSS-pixlar.** 30 knappar mot det golvet får inte plats på en telefonbredd, så raden bryts över flera rader eller läggs i en horisontellt rullande behållare. Vilket av de två avgörs vid skivningen mot renderad mätning.

**Valet lever i URL:en**, som söktermen redan gör, så tillbaka-knappen återställer läget.

**Detta blir TVÅ landningar, inte en.** Den nya parametern är en EF-form-ändring, och deploy-ordningen gäller: EF:en till staging **före** den landning som börjar skicka parametern. Ordningen står i skivornas beroenden.

### Testbeslut

**Två befintliga skarvar, noll nya filer.** Skarvarna bevisar strukturellt olika saker och ersätter inte varandra.

**Primär skarv — personlistans acceptance-fil.** Den bär redan exakt precedenten: ett testfall som bevisar att sökningen skriver sitt värde till URL:en och filtrerar via server-parametern. Bokstavsfiltret är samma klass av beteende mot samma yta. Här bevisas allt klient-observerbart: filtrering, tryckt-tillstånd, nedtonade bokstäver, "Utan namn"-hinken, att E inte drar med sig de namnlösa, kombinationen med fritext, tomläget, URL-tillståndet och noll axe-överträdelser.

**Sekundär skarv — Personer-EF:ens staging-fil.** Ett testfall för den nya parametern. Motivet är acceptance-klassens eget snitt: den bevisar att appen renderar rätt **givet ett svar av rätt form**, aldrig att EF:en producerar den formen. Ett bokstavsfilter som aldrig når datakällan vore grönt i acceptance och trasigt i drift.

**Testa externt beteende, aldrig implementationen.** Inga assertions på att en viss formel byggdes eller att en handler anropades — det vore att testa fixturen. Det som prövas är vad som syns och vad servern svarar.

**Fixturen måste bära de svåra fallen**, annars bevisar sviten ingenting: minst en person per bokstav som ska vara aktiv, minst en bokstav utan personer, minst två namnlösa personer, och minst ett namn som börjar på Å. Utan Å-posten kan diakritik-korrektheten inte fällas.

**Träffytan mäts i renderad yta**, inte läses ur en klass — samma disciplin som appens övriga geometri-bevis.

### Utanför omfattningen

- **Notis- och felmeddelande-familjen.** Egen arbetsenhet under sitt eget beslut; detta kort rör den inte.
- **Att laga de 186 namnlösa.** Namnen har aldrig funnits i något digitalt system vi äger; det är belagt mot två oberoende källor och Marcus-verifierat. Konsekvensen bärs, den jagas inte.
- **Inkonsekvensen mellan bläddringsordning och bokstavsindex.** Basens sortering veckar Å mot A. Det är en plattformsegenskap vi inte styr, registrerad som känd vägg — bokstavsraden blir korrekt ändå, men bläddrar Lotta utan filter ligger Å-namnen kvar bland A:na.
- **Den generella mekaniken för att amendera ett stämplat facit.** Väg A gäller denna yta; klassen är en öppen tråd.
- **Bas-filtret för vilka personer som över huvud taget visas.** Orört.
- **Ett bokstavsindex på någon annan lista.** Personlistan enbart.

### Estimat

**Fyra skivor plus ett QA-kort.** Liten till medelstor arbetsenhet. Tyngdpunkten ligger inte i mängden kod utan i ordningen: EF före klient, godkännande före facit-amendering.

### ADR-koppling

Styrande i området, alla oförändrade av detta kort: **ADR-056** (cursor-pagineringen, som är skälet till att filter slår hopp), **ADR-078** (layouthopp-förbudet, som binder den nedtonade radens längd), **ADR-080** (testklassernas snitt, som motiverar två skarvar), **ADR-102** och **ADR-103** (facit och promovering, som ger väg A dess form).

**Ingen ny ADR mintas.** Beslutet prövades mot ADR-baren och faller under den: det är svagt återställbart snarare än svårt, formvalet följde av arkitektur i stället för av en verklig avvägning, och de två genuint överraskande delarna — att sortering och filtrering följer olika kollationsregler, och att sentinelen måste undantas — är redan registrerade som känd vägg i datamodellens fäll-register. Skulle skivningen avtäcka en verklig avvägning som håller alla tre villkoren mintas den separat och refereras hit, aldrig inline.

### Ytterligare anteckningar

**Underlagets styrka, ärligt redovisad.** Talen kommer från två oberoende mätningar mot prod samma dag, gjorda av olika parter med olika formler: 186 namnlösa av 559, fem Å-poster, noll Ä- och Ö-poster, och att likhetsjämförelsen skiljer Å från A medan sorteringen inte gör det. Branschprecedenten är svagare: den formella svenska sorteringsstandarden är en betalstandard utan fri fulltext, Apples egna sidor gick inte att hämta, och för tomma bokstäver i en filter-modell fanns **ingen** branschledare alls — två tredjepartsexempel pekar åt olika håll. Nedtoningen vilar därför på appens egen layouthopp-regel, inte på precedent, och det är medvetet.

**Beroendet mot tråden om facit-amendering.** Väg A är beslutad för denna yta men klassen saknar skriven regel. Nästa låsta yta som ska växa möter samma fråga, och den bör inte lösas ad hoc en gång till.

**En kant som inte får glömmas vid skivningen.** Antalet per bokstav ska komma ur den genomgång EF:en redan gör. Går det inte — visar sig genomgången till exempel köras bara på första sidan i en form som inte bär fördelningen — är nedtoningen plötsligt en egen kostnad, och då ska frågan upp igen i stället för att en extra genomgång smygs in.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-manifestet amenderat med Marcus citat FÖRE ARIA-referenserna regenereras (ADR-102 väg A, T157)
- [ ] #6 EF deployad till staging FÖRE den landning som börjar skicka bokstavs-parametern (deploy-ordningen)
- [ ] #7 Sentinelen undantagen ur E-filtret — bevisat med testfall, aldrig antaget (fälla 51)
- [ ] #8 Varje bokstavsknapp minst 24x24 CSS-px — mätt i renderad yta, aldrig läst ur en klass (WCAG 2.5.8 AA)
<!-- DOD:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-21 11:34
---
AMENDERING 2026-08-21 (S109, ADR-123 — väg B): Implementationsbeslutet 'Filtret byggs som ett tredje AND-villkor i Personer-EF:ens befintliga formel' UTGÅR. Marcus valde förladdat register med sök i klienten ('Då kör vi B!'); bokstavsfiltret och fördelningen blir en filter/reduce över den laddade arrayen (ADR-123 beslut 3), sorteringen svensk kollation i klienten (beslut 4) — vilket stänger fälla 51:s bläddrings-/filter-inkonsekvens som detta PRD bokförde som pris. Konsekvens: 283.1 utgår (wontfix), 283.2–283.4 byggs mot klientdata och blockeras av registerskivan i det nya PRD-kortet för personregistret. Användarberättelser, formkrav (raden byter aldrig längd, nedtoning bunden till hela registret, A–Ö-ordning, hinken för namnlösa) och facit-amenderingsvägen (väg A, T157) står oförändrade.
---
<!-- COMMENTS:END -->
