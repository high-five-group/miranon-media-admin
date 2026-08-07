---
id: TASK-146
title: >-
  PRD: Bilage-fundamentet — delad hemvist, tre dokumentklasser och
  PDF-generering inom plattformen
status: To Do
assignee: []
created_date: '2026-08-07 07:48'
labels: []
dependencies: []
ordinal: 231000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Roger och Lotta vill kunna bifoga PDF:er till sina utskick — deltagarinformation, brev, kvitton — och välja per utskick vilka bilagor som ska med. Idag finns ingenting av det: appen har ingen plats att lägga en fil, ingen koppling mellan fil och event, och ingen väg att få en fil att följa med ett mail.

Det finns dessutom tre olika sorters dokument i deras verklighet, som ser lika ut för mottagaren men uppstår på helt olika sätt: filer Roger laddar upp själv, brev som genereras per event ur en mall, och kvitton som genereras per person ur betalningsdata. Byggs bara det första blir de andra två en efterhandskonstruktion.

Utan ett fundament blir varje utskickstyp sin egen lösning, och bilagorna hamnar där de råkar passa — vilket för en Airtable-baserad app betyder attachment-fält vars länkar slutar fungera efter två timmar.

### Lösning

Ett **delat bilage-fundament** som de tre dokumentklasserna vilar på, byggt en gång.

**Delad hemvist:** själva filen (bytesen) bor i privat objektlagring; metadatat och eventkopplingen bor i basen som en additiv tabell. Det är research-passets dom, och den blev starkare av varje sten som vändes — inte svagare.

**Tre dokumentklasser, en form:** klass A som laddas upp, klass B som genereras per event ur en systemmall, klass C som genereras per person ur person- och betalningsdata. Alla tre landar som samma sorts bilaga med samma metadata, oavsett hur de uppstod.

**En Dokument-yta** där Lotta ser och hanterar bilagorna, med eventkopplingen synlig.

**PDF-generering inom plattformen** — inget externt beroende, ingen extra tjänst.

Fundamentet levererar förmågan att HA och SKAPA bilagor. Att välja dem per utskick och faktiskt skicka dem hör till Åtgärds-sidans kort.

### Användarberättelser

1. Som Roger vill jag ladda upp en PDF till appen, så att den kan följa med ett utskick.
2. Som Roger vill jag koppla en uppladdad fil till ett specifikt event, så att den bara dyker upp där den hör hemma.
3. Som Roger vill jag se vilka bilagor som finns för ett event, så att jag vet vad som går att skicka.
4. Som Lotta vill jag se en bilagas namn, storlek och när den lades upp, så att jag kan avgöra om det är rätt version.
5. Som Lotta vill jag kunna ta bort en bilaga som blivit fel, så att ingen skickar ut den av misstag.
6. Som Lotta vill jag byta ut en bilaga mot en nyare version, så att jag slipper radera och ladda upp i två steg.
7. Som Roger vill jag att ett deltagarinformations-brev kan genereras per event ur en mall, så att jag inte skriver om samma brev för varje kurs.
8. Som Roger vill jag att ett kvitto kan genereras per person ur betalningsdata, så att jag slipper skriva kvitton för hand.
9. Som Roger vill jag att svenska tecken återges korrekt i genererade PDF:er, så att namn och orter stavas rätt.
10. Som Lotta vill jag ladda upp en stor fil utan att appen hänger sig, så att arbetet inte stannar på en filstorlek.
11. Som Lotta vill jag få veta direkt när en fil är för stor, så att jag inte väntar på en uppladdning som ändå kommer att misslyckas.
12. Som Lotta vill jag att en bilaga bara är åtkomlig för den som ska se den, så att kursdeltagares kvitton inte ligger öppet på nätet.
13. Som Lotta vill jag att en bilagas länk fungerar när mottagaren öppnar mailet, så att ingen möts av en död länk.
14. Som Roger vill jag att en bilaga överlever att appen byter datakälla, så att arkivet inte är inlåst i en leverantör.
15. Som utvecklare vill jag att bilage-ytan når lagringen via samma adapter-kontrakt som all annan data, så att lager-oberoendet håller.
16. Som utvecklare vill jag att båda adaptrarna bär bilage-metoderna, så att en framtida datakällsbyte inte upptäcker ett hål.
17. Som skärmläsaranvändare vill jag att uppladdningens tillstånd annonseras, så att jag vet när den är klar.
18. Som Lotta vill jag att en misslyckad uppladdning säger vad som gick fel, så att jag vet om jag ska försöka igen eller ändra filen.

### Implementationsbeslut

**Delad hemvist — bytes i objektlagring, metadata i basen.** Grillad samsyn S93 beslut 6, sedan research-verifierad. Alternativen och varför de faller, bokförda: basens egna attachment-fält som enda hemvist faller på **två timmars utgångstid** på filens URL (gäller sedan 2022) plus ett **5 MB-tak** på direkt uppladdning via API:t — precis den strukturella väggen som gör delad hemvist till ett grundat val och inte en smaksak. Bytes som base64-text i basen övervägdes aldrig seriöst; det hade sprängt basens längdgränser.

**Metadatat bor i en ADDITIV tabell.** Inga befintliga fält eller tabeller rörs. Detta är den etablerade formen för bas-utökningar i projektet, och den ska bevisas mekaniskt, inte påstås.

**Privat lagring som default, signerad åtkomst per utskick.** Path-prefixas per event så filer grupperas där de hör hemma. Intern precedent finns för en publik bucket i ett systerprojekt — vi väljer medvetet signerade URL:er i stället.

**Uppladdningen går ALDRIG direkt från klienten till lagrings-API:t.** Två mönster, båda server-medierade:

1. **Små filer:** bytesen går genom edge-funktionen, som skriver dem med förhöjd behörighet plus en metadatarad i basen.
2. **Stora filer:** edge-funktionen utfärdar ett tidsbegränsat, path-scopat uppladdnings-tillstånd; klienten laddar upp direkt mot lagringen med återupptagbar uppladdning, utan att bytesen passerar funktionen.

Mönster 2 håller lager-oberoendet trots att klienten rör lagringen: **auktorisationsbeslutet** — vem får ladda upp vad, till vilken path — fattas fortfarande server-side. Klienten får ett scopat tillstånd, inte en genväg runt adaptern.

**Lager-oberoendet, konkret:** bilage-ytan får aldrig importera lagrings-SDK:t eller anropa lagrings-API:t direkt. Den anropar en ny metod på datakälle-adapterns kontrakt, som **båda** adaptrarna implementerar. Bytesen är en tredje, delad resurs bakom samma kontrakt — inte "Airtable-data" och inte "Supabase-data". Kontraktet har idag noll bilage-metoder, så detta är grönfält utan befintlig konflikt att lösa.

**PDF-generering sker inom plattformen** med ett rent JavaScript-bibliotek utan native-beroenden, byggt på koordinat-layout. Externa HTML-till-PDF-tjänster avvisades som förstahandsval — extra leverantörsberoende och ett nätverkshopp för ett problem som redan är löst inom plattformen. De är däremot värda att minnas om en framtida mall-editor kräver HTML/CSS-layout, som koordinat-formen strukturellt inte kan ge.

**FÖRSTA STEGET ÄR ETT BEVIS, INTE EN BYGGSTEN.** Research-passet mätte att biblioteket återger svenska tecken korrekt — men **under Node, som medveten proxy**, eftersom Deno inte fanns i den körmiljön. Beteendet specifikt inuti den skarpa edge-runtimen (minne, CPU-tak, kallstart under verklig last) är **overifierat**. Det ska stängas skarpt innan mer arkitektur läggs ovanpå antagandet. Passet öppnade den luckan medvetet i stället för att tyst anta att den var stängd.

**Dokumentklasserna, med sin v1-gräns:** klass A uppladdad · klass B event-mallad, systemmall som **inte är redigerbar i v1** · klass C person-genererad. Mall-editor och stöd för presentationsformat ligger uttryckligen senare. Klass C tvingas in i v1 av kvitto-behovet, men **kvittots innehåll, nummerserie och utlösande klick hör till Åtgärds-sidans kort** — fundamentet levererar bara förmågan att generera och lagra.

**Känd risk, oförklarad:** ett avbrytande fel i edge-runtimen ("cancelled by supervisor") är rapporterat i plattformens egen diskussionsyta utan att någon rotorsak hittats. Det registreras som **öppen risk**, inte som ett känt och hanterat beteende.

**Väggkatalogen ska uppdateras i denna leverans.** Research-passet identifierade två kandidat-poster om basens attachment-begränsningar men ändrade medvetet inte katalogen. Att lämna dem oförda vore att låta ett belagt fynd dö med sitt dokument.

**Fyndet som rör grannkortet, bokfört här för att det upptäcktes här:** dagens sändkontrakt kan strukturellt inte bära bilagor — batch-ändpunkten stödjer dem inte, och bristen är **tyst** (bilagan försvinner utan felmeddelande). Sändvägen måste grenas i två. Det är Åtgärds-sidans kort som äger den ändringen; raden står här så att fyndet inte tappas i skarven mellan korten.

### Testbeslut

**Skarv 1, befintlig: API-skarven.** Bilage-metadatats livscykel — skapa, lista per event, ersätt, ta bort — testas där appens övriga datakälle-operationer redan testas. Testa **externt beteende**: att en uppladdad bilaga blir listbar för sitt event och inte för andra, att en borttagen försvinner, att en ersatt behåller sin koppling.

**Skarv 2, befintlig: edge-funktionernas kontraktsskarv.** Uppladdnings- och genereringsfunktionerna prövas mot samma kontrakt som projektets övriga edge-funktioner — behörighetskrav, indata-validering, ärliga fel.

**En ny skarv är motiverad och ska deklareras som sådan:** PDF-generering har idag ingen skarv i repot. Den behöver ett bevis som körs mot den **skarpa runtimen**, inte mot en Node-proxy — annars återskapas exakt den lucka som research-passet öppet redovisade. Detta är den enda nya skarven kortet begär, och skälet är att ingen befintlig skarv kan bära den.

**Lager-oberoendet bevisas mekaniskt.** Frånvaron av direkta lagrings-anrop i UI-lagret ska fällas av en grind, inte kontrolleras med ögat. Port-pariteten — att båda adaptrarna bär bilage-metoderna — likaså.

**Bas-additiviteten bevisas mekaniskt.** Att inga befintliga fält rörts är ett påstående som ska mätas mot schemat.

**Storleksgränserna testas vid gränsen**, inte i mitten: en fil strax under taket ska gå igenom, en strax över ska avvisas med ett begripligt fel före uppladdningen påbörjas.

**Signerad åtkomst testas som åtkomst**, inte som konfiguration: en giltig länk ska ge filen, en utgången ska nekas.

### Utanför omfattningen

- **Åtgärds-sidan och bilageväljaren per utskick** — kort 3. Fundamentet levererar förmågan, inte valet.
- **Sändvägens grening i två** (attachment-fri respektive attachment-bärande) och revisionen av utskicks-ADR:n — kort 3.
- **Kvittots innehåll, kvittonummer-serien och kvitto-klicket** — kort 3, efter Roger-avstämningen om var gränsen mot hans faktureringssystem går.
- **Mall-editor för klass B** — uttryckligen senare; systemmallen är inte redigerbar i v1.
- **Stöd för presentationsformat** — senare.
- **Migrering av befintliga dokument** ur andra system — ingen sådan mängd är kartlagd.
- **Publik delningslänk till en bilaga** — inte efterfrågat, och skulle motverka den privata hemvisten.

### Estimat

**Fem till sex skivor, medelstor arbetsenhet.** Grovt snitt: (1) skarpt runtime-bevis för PDF-genereringen — **först, som grind mot resten** · (2) additiv metadatatabell i basen plus väggkatalogens två poster · (3) lagringens bucket, path-form och signerade åtkomst · (4) adapter-ytan med port-paritet i båda adaptrarna, plus edge-funktionen för uppladdning i båda mönstren · (5) Dokument-ytan i Mer · (6) klass B-genereringen ur systemmall.

Skiva 1 är förkrav till 6 men inte till 2–5, som kan gå parallellt. QA-vandringen läggs på det avslutande kortet.

### ADR-koppling

- **ADR KRÄVS för bilage-hemvisten** — grillad samsyn S93 beslut 6 bokförde uttryckligen "ADR vid bygget, research-grundad". Beslutet klarar baren: dyrt att återställa (arkivet flyttar inte tillbaka gratis), överraskande utan kontext (att bytes INTE ligger i basens egna attachment-fält behöver sin motivering), och resultatet av en verklig avvägning med två avvisade alternativ. ADR:n mintas separat och refereras — aldrig inline i en skiva. Research-passet är dess underlag, inklusive sina fem öppet redovisade luckor.
- **ADR-057** (lager-oberoendets fitness-invariant) — styr adapter-ytan: klausul a (UI når datakällan endast via adapterkontraktet) och klausul c (full port-paritet). Grönfält idag, ingen konflikt att lösa, bara en ny yta att lägga rätt från början.
- **ADR-063** (Airtable-basen som förstklassig leverabel) — styr att metadatat läggs additivt i basen och att attachment-väggarna hamnar i väggkatalogen i stället för att lappas bort.
- **ADR-067** (utskickskontraktet) — **revideras av kort 3, inte av detta**. Fyndet som tvingar revisionen är bokfört ovan.

### Ytterligare anteckningar

**Underlaget är ett landat research-pass** med förstapartskällor per delfråga. Läs det före skivningen — särskilt § Vad jag inte kunde belägga, som listar fem punkter där evidensen är svagare än resten. Två av dem styr bygget direkt: PDF-bibliotekets beteende i den skarpa runtimen (skiva 1 finns för att stänga den) och giltighetstiden på uppladdnings-tillståndet, som är svagare belagd än övriga plattformsfakta och ska verifieras vid bygget i stället för citeras.

**Precedent-rymden är bred, inte tunn** — tre oberoende namngivna edge-/serverless-miljöer kör samma PDF-bibliotek. Ingen deklaration av tunn precedent behövs här, till skillnad från vissa tidigare pass i detta repo.

**Prislappen på storlek är inte vår, den är Resends:** taket per mail efter kodning är snävare än plattformens lagringsgränser. Det är alltså mottagarsidan som sätter den praktiska gränsen för hur stor en bilaga får vara, och felmeddelandet till Lotta ska säga det på hennes språk, inte i byte.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 PDF-biblioteket skarpt verifierat mot den riktiga edge-runtimen (ej Node-proxy) INNAN övrig arkitektur byggs ovanpå
- [ ] #6 Lager-oberoendet mekaniskt fällt: noll direkta lagrings-anrop i UI-lagret + port-paritet i BÅDA adaptrarna
- [ ] #7 Bas-additiviteten mätt mot schemat: inga befintliga fält eller tabeller rörda
- [ ] #8 Väggkatalogens två attachment-poster landade (research-passet identifierade dem men ändrade medvetet inte katalogen)
<!-- DOD:END -->
