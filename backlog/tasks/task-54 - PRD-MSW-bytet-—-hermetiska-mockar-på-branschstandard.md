---
id: TASK-54
title: 'PRD: MSW-bytet — hermetiska mockar på branschstandard'
status: To Do
assignee: []
created_date: '2026-07-27 15:02'
updated_date: '2026-07-30 19:45'
labels:
  - intentionally-open
dependencies: []
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Den hermetiska testvärlden fungerar, men dess matchningsmotor är handskriven. En uppslagstabell från EF-namn till fruset svar, en 501-fallback för omockade anrop, och egen preflight-hantering — allt byggt för hand i en fixturmodul. Verktygsvals-passet 2026-07-27 prövade fyra egenbyggen mot mogna alternativ och fann att detta var det ENDA äkta försummade verktygsvalet: `check-docs.sh`, `ci-wait.sh` och `changed-files`-uppställningen försvarade sig alla, MSW-fallet gjorde det inte.

Kostnaden är inte att koden är dålig — den fungerar och är välkommenterad. Kostnaden är att varje framtida behov måste byggas för hand: request-matchning på metod och body, dynamiska svar per anropsordning, delade handlers över testfiler, felinjektion. Det är en matchningsmotor vi underhåller själva i stället för att konsumera.

Frågan är skarp NU därför att ADR-080 beslutade acceptance-klassen: nitton e2e-filer ska brytas ut till hermetisk form. De skrivs mot den mekanism som finns när de skrivs. Byggs de på handrullad matchning ärver de den, och bytet blir dyrare för varje fil som tillkommer.

### Lösning

Byt matchningsmotorn till `msw` med dess egen Playwright-bindning, och behåll allt annat i den hermetiska ramen oförändrat.

MSW ersätter ENDAST API-lagret: uppslagstabellen, 501-fallbacken och preflight-hanteringen. Den frusna klockan, den seedade sessionen och typsnitts-pinningen är inte mockningsproblem och rörs inte.

Vakten byter form från catch-all-route till MSW:s `onUnhandledRequest` som callback, i den form Ghost använder: felet pekas på TESTET med en lista över vad som faktiskt var mockat, i stället för att kastas anonymt inne i avlyssningslagret. Ett omockat anrop ska säga vad man glömde, inte bara att något gick fel.

Bindningen registrerar sig på context-nivå medan befintliga mockar ligger på sid-nivå, och sid-routes vinner. Migreringen kan därför ske utan att någon befintlig testfil rörs — samexistensen är belagd i Playwrights egen dokumentation om route-precedens, inte antagen.

### Användarberättelser

1. Som utvecklare vill jag skriva en request-mock genom att deklarera metod, path och svar, så att jag slipper bygga uppslagslogik för hand varje gång ett nytt anrop tillkommer.
2. Som utvecklare vill jag att ett omockat anrop fäller testet med besked om VILKEN request som saknade handler, så att jag kan åtgärda det utan att gissa.
3. Som utvecklare vill jag att felet dessutom listar vad som VAR mockat, så att jag ser om jag stavat fel snarare än glömt helt.
4. Som utvecklare vill jag kunna dela handlers mellan testfiler, så att samma EF-svar inte definieras om per fil.
5. Som utvecklare vill jag kunna överskugga en delad handler lokalt i ett test, så att specialfall inte tvingar fram en egen fixturvärld.
6. Som utvecklare vill jag kunna matcha på request-body och inte bara URL, så att tester av skrivflöden kan skilja två anrop till samma endpoint.
7. Som utvecklare vill jag kunna returnera olika svar vid upprepade anrop till samma endpoint, så att polling- och omförsöks-beteende kan testas.
8. Som utvecklare vill jag kunna injicera felsvar och nätverksfel deklarativt, så att felvyer kan verifieras utan att ändra produktionskod.
9. Som utvecklare vill jag att handlers uttrycks mot Edge Function-kontraktet, så att de överlever bytet av datakälla utan att skrivas om.
10. Som agent som ärver kodbasen vill jag att mockningen använder ett dokumenterat bibliotek, så att jag kan slå upp beteendet i stället för att läsa mig till det ur en egen fixturmodul.
11. Som granskare vill jag se att den visuella sviten ger identiska bilder före och efter bytet, så att jag vet att mekanismen är utbytt och inte beteendet.
12. Som granskare vill jag se ett negativt bevis på att vakten fäller, så att hermetiken är verifierad och inte antagen.
13. Som Marcus vill jag att bytet inte rör en enda befintlig e2e-fil, så att risken är isolerad till den hermetiska ramen.
14. Som Marcus vill jag att acceptance-klassens filer kan byggas direkt på den nya mekanismen, så att arbetet inte görs två gånger.
15. Som Marcus vill jag att typsnitts-pinningen förblir orörd, så att den visuella grindens pixelstabilitet inte sätts på spel av ett infrastrukturbyte.

### Implementationsbeslut

**Beslutade på Marcus delegering 2026-07-27, filtrerade genom mottot "Bygg ordentligt eller bygg inte alls".**

1. **Tillgångs-optionen lämnas på sitt defaultvärde.** Restlistan hävdade tidigare att den måste stängas av, med argumentet att 86,4 procent av mätt restrafik går till Google Fonts och annars släpps igenom tyst. Det var en felläsning: posten bar passets varning som om den vore dess slutsats. Typsnitts-routen ligger på sid-nivå och vinner över MSW:s context-nivå, så ingen font-trafik når optionen överhuvudtaget. Att stänga av den hade kostat omkring tre gångers fördröjning på hela sviten, dokumenterat i bibliotekets egen issue för just Vite-projekt, utan någon vinst. Restlistan är rättad.

2. **Vaktens option måste sättas explicit.** Bindningens default är genomsläpp, inte varning — till skillnad från MSW:s vanliga default. Sätts optionen inte alls är vakten avstängd, tyst. Detta är den enskilt farligaste fällan i bytet, eftersom resultatet ser ut som en fungerande hermetisk svit.

3. **Vakten skrivs som callback, aldrig som färdig strängnivå.** De inbyggda nivåerna hoppar över statiska tillgångar innan strategin tillämpas, vilket gör dem oanvändbara som hermetik-vakt. Callbacken tar hela beslutet själv.

4. **Handlers uttrycks mot Edge Function-kontraktet, inte mot datakällans svarsform.** Detta är ADR-080:s snitt tillämpat: gränsen går vid protokollet, inte vid läs eller skriv. Den befintliga uppslagstabellen är redan skriven så — nycklarna är EF-namn och svaren parsas av samma scheman som adaptern använder — så porteringen bevarar en egenskap som redan finns i stället för att införa en ny. Konsekvensen är att handlers överlever bytet av datakälla, vilket gör passets öppna fråga om dubbelportering obsolet i stället för uppskjuten.

5. **Den frusna klockan, den seedade sessionen och typsnitts-pinningen migreras INTE.** De löser inte mockningsproblem och har inget i en request-matchningsmotor att göra. Typsnitts-routerna gör dessutom redan det rätta: de serverar ur incheckade filer i stället för att blockera, vilket är vad passet rekommenderar oavsett bibliotek.

6. **Ingen befintlig e2e-fil rörs i denna arbetsenhet.** Sid-routes vinner över context-routes, så de omkring 141 route-anropen i 33 filer fortsätter fungera oförändrat. Migreringen av dem hör till acceptance-klassens arbete, där filerna ändå skrivs om — att flytta dem nu vore att göra jobbet två gånger.

7. **Omförsöks- och felinjektions-behov löses av biblioteket, inte av egen kod.** Det är hela poängen med bytet; varje handrullad hjälpfunktion ovanpå MSW är ett tecken på att bytet gjorts halvt.

### Testbeslut

**Ekvivalens bevisas på den visuella sviten, inte på nya assertions.** Den hermetiska ramen bär redan tolv baseline-bilder i två vyportar. Är bilderna pixel-identiska efter bytet är mekanismen bevisat likvärdig — det är en hårdare invariant än något påstående som kunde skrivas för hand, och den kostar ingenting extra att köra. Detta är den primära skarven, och den är befintlig.

**Vakten kräver ett negativt bevis.** En grön svit kan aldrig visa att vakten fäller; bara ett test som medvetet gör ett omockat anrop kan det. Beviset ska visa både att testet fälls OCH att felmeddelandet namnger den saknade requesten samt listar vad som var mockat. Detta följer husets rött-först-praxis: den röda körningen är leveransen, inte ett steg på vägen.

**Handler-modulen testas genom sin användning, inte separat.** Att enhetstesta en tabell av frusna svar bevisar att tabellen innehåller vad den innehåller. Värdet ligger i att den visuella sviten och acceptance-filerna konsumerar den — externt beteende, inte implementationsdetalj.

**Fällan att bevaka under arbetet:** en tyst avstängd vakt ger en svit som ser hermetisk ut men släpper igenom allt. Verifiera vaktens option skarpt innan ekvivalens-beviset körs, annars bevisar bilderna bara att appen renderar likadant med och utan nätverk.

Förebild i kodbasen: den befintliga hermetiska ramen och dess mätta restanrops-profil.

### Utanför omfattningen

- Migrering av befintliga e2e-filer till den nya mekanismen. Hör till acceptance-klassens arbete.
- Acceptance-klassens nitton filer som sådana. Egen arbetsenhet, bygger på denna.
- Ändringar i den frusna klockan, sessionsseedningen eller typsnitts-pinningen.
- Avveckling av staging-mutexen. Kräver att den delade ytan krympts först, vilket är acceptance-arbetets utfall.
- Shardning av testsviten. Blockerad av datakällans kvottak oavsett mockningslösning.
- Prestandaoptimering av testsviten. Bytet ska vara neutralt eller bättre, men optimering är inte målet.

### Estimat

Tre skivor plus ett QA-kort. Liten till medelstor arbetsenhet — riskerna ligger i vaktens tysta default och i att ekvivalens-beviset körs innan vakten är verifierad, inte i mängden kod.

### ADR-koppling

- **ADR-080** styr snittet: klassbytet är beslutet, gränsen går vid protokollet, kontraktsvakten är villkor. Handler-formen följer direkt av det.
- **ADR-063 § S91-not** förklarar varför hermetisk utbrytning behövs alls: datakällan kan inte isoleras per körning, och efemär backend är strukturellt otillgänglig.
- **ADR-071 § Rött-först** styr formen för vaktens negativa bevis.
- Inget nytt ADR bedöms krävas. Bytet är ett verktygsval inom en redan beslutad arkitektur, och de tre villkoren för ADR-baren nås inte: det är återställbart, det är inte överraskande givet ADR-080, och avvägningen är redan gjord och dokumenterad i verktygsvals-passet.

### Ytterligare anteckningar

**Precedent-rymden är tunn och det deklareras öppet.** Bindningen är förhandsversion med en huvudsaklig underhållare och begränsad spridning i kodsök. Baren om tre branschledande projekt hålls — crates.io, Camunda och Coveo kör alla formen i produktion — men marginalen är liten. Två projekt som ofta nämns i sammanhanget bär INTE frågan: Ghost kör en annan testrunner, och Grafana kör mot skarp server med punktvis mockning.

**Ghosts felform lånas medvetet trots att deras uppställning är en annan.** De löser vaktproblemet med en catch-all-handler som svarar med en avvikande statuskod, bokför träffen och fäller i efterhand med en lista över vad som var mockat. Den formen är bättre än ett anonymt fel oavsett vilken mekanism som bär den.

**Bibliotekets upphovsman avråder från mockning i allmänhet.** Invändningen är noterad men träffar en fråga som redan är avgjord i ADR-080: att sviten ska bli hermetisk är beslutat och restrafiken är mätt. Kvar står bara hur mockningen skrivs, och där är invändningen neutral.

**Fyndet som utlöste rättelsen i restlistan bör läsas som mönster, inte som engångsfel.** Posten skrevs samma dag som en sammanfattning av passet och drifade från källan på en punkt med mätbar kostnad. Den fångades vid läsfasen före kodskrivning, vilket är exakt vad läsfasen finns för.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Visuella sviten ger pixel-identiska bilder före och efter bytet — ekvivalensen bevisad, inte antagen
- [ ] #6 Negativt self-test bevisar att vakten fäller OCH namnger saknad request + listar mockade
- [ ] #7 Vaktens option verifierad skarpt satt (bindningens default är tyst genomsläpp)
- [ ] #8 Ingen befintlig e2e-fil rörd — diffen visar det
<!-- DOD:END -->
