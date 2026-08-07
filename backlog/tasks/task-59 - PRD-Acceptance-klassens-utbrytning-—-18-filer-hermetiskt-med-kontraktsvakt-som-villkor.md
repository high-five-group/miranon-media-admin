---
id: TASK-59
title: >-
  PRD: Acceptance-klassens utbrytning — 18 filer hermetiskt, med kontraktsvakt
  som villkor
status: To Do
assignee: []
created_date: '2026-07-27 20:33'
updated_date: '2026-08-07 11:19'
labels:
  - intentionally-open
  - ready-for-human
dependencies: []
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Staging-sviten håller en global mutex i 9,25 minuter vid varje körning. Mätningen (S91) visar att 73,9 % av jobbet — 296 tester, 409,8 sekunder — bärs av e2e-tester som REDAN mockar sina Edge Functions med route.fulfill. De står i kö bakom en mutex de inte behöver, eftersom de inte rör staging alls utom för typsnitt.

Konsekvensen är att varje PR betalar full mutex-tid för bevis som inte kräver den, att parallella landningar svälter varandra, och att shardning är omöjlig så länge allt ligger i samma mutexbundna jobb.

Problemet är inte prestanda i sig utan att sviten inte SÄGER vad den bevisar. En fil som mockar sina EF:er bevisar att APPEN beter sig rätt givet ett svar av rätt form. En fil som går mot staging bevisar att STAGING OCH AIRTABLE producerar svar av den formen. I dag ligger båda i samma klass, under samma namn, bakom samma mutex — och den som läser sviten kan inte se skillnaden.

### Lösning

Bryt ut de filer som redan är hermetiska till en egen klass med eget namn — acceptance — som kör mot fixturvärlden utan mutex. Klassbytet är beslutet; hastigheten är följden.

Snittet går vid PROTOKOLLET, inte vid läs/skriv: acceptance-handlers uttrycks mot Edge Function-gränssnittet och svarar i EF:ens egen form, aldrig mot Airtables svarsform. Samma zod-scheman parsar fixturens svar som parsar skarpa svar — den fogen är vad som gör att klassen bevisar något om appen.

Utbrytningen får INTE ske utan kontraktsvakt. Zod-schemana är halva kontraktet: de fångar form-drift men inte värde-drift, och inte schemats egen drift mot funktionen. Vakten är nattlig och icke-blockerande, kör fixturerna mot skarp staging och jämför.

### Användarberättelser

1. Som utvecklare vill jag att en PR som bara rör appens rendering får sitt svar utan att vänta på en global mutex, så att återkopplingen kommer i minuter i stället för tiotals minuter.
2. Som utvecklare vill jag kunna se av ett tests KLASS vad det bevisar, så att jag inte behöver läsa dess kropp för att veta om det säger något om appen eller om datakällan.
3. Som utvecklare vill jag att ett acceptance-test som råkar nå nätverket FÄLLER med adressen namngiven, så att hermetiken är en vakt och inte en konvention.
4. Som utvecklare vill jag skriva ett acceptance-test mot samma handler-uppsättning som fixturvärlden redan bär, så att jag inte underhåller två sanningar om samma nätverk.
5. Som utvecklare vill jag kunna överskugga en delad handler lokalt i ett enskilt test, så att specialfall inte tvingar fram en egen fixturvärld.
6. Som utvecklare vill jag att ett fixtursvar som glidit ifrån verkligheten upptäcks av maskin och inte av en användare, så att utbrytningen inte byter mutex-tid mot tyst drift.
7. Som utvecklare vill jag att vakten larmar i en kanal som redan finns och redan bevakas, så att den inte blir ännu en signal ingen läser.
8. Som utvecklare vill jag att de filer som GENUINT behöver skarp backend stannar kvar där, så att klassbytet inte tar bort bevis vi faktiskt har.
9. Som utvecklare vill jag att API-sviten lämnas orörd, så att repots enda bevis för att Airtable beter sig som koden tror inte trubbas av.
10. Som Marcus vill jag att arbetet överlever Supabase-bytet till ~90 %, så att CI-arkitekturen inte byggs om när datakällan byts.
11. Som utvecklare vill jag att en fil som flyttats för tidigt blir RÖD och inte grön av fel skäl, så att tyst fallthrough är omöjlig.
12. Som utvecklare vill jag att acceptance-jobbet kan shardas, så att svitens tillväxt inte återskapar dagens tak.
13. Som ny agent vill jag hitta klassens bärande mönster i koden, så att nitton filer inte skrivs mot ett mönster som bara finns i någons huvud.
14. Som granskare vill jag att klassningen av varje fil är HÄRLEDD ur mätdata och inte handplockad, så att gränsdragningen går att kontrollera i efterhand.

### Implementationsbeslut

KLASSNINGEN ÄR HÄRLEDD, INTE ÄRVD. Rådatan från hermetik-mätningen (863 poster, 32 filer) räknades om i detta pass. Utfallet: 19 filer är rena efter typsnitts-pinning, 13 har kvarvarande skarpa anrop. Det reproducerar ADR-080:s siffror exakt.

RÄKNINGEN KORRIGERAS DOCK TILL 18/14. ADR-080:s beslut 2 undantar fyra filer explicit. Tre av dem faller ut som skarpa av mätningen ändå. Den fjärde — pwa-offline — är mekaniskt ren men doktrinärt undantagen, och undantaget är RIKTIGT: testet kräver byggd preview eftersom service workern inte existerar i dev, och det är mekaniskt rent enbart för att det kör oautentiserat mot login-sidan utan EF-anrop. Mätningen kan strukturellt inte se det kravet. ADR:n tycks ha tagit den mekaniska 19:an som beslutets 19:a utan att dra av undantaget. Detta river inget beslut — ADR:n säger själv att kvoten inte bär något och att kriteriet bär. Det rättar en räkning.

EN ENDA HERMETISK SKARV — BELAGD MOT PRIMÄRKÄLLA. De 18 filerna hänger på samma fixturvärld som den visuella regressionssviten redan använder; den flyttas ut ur sin visual-hemvist och blir klassdelad. Beslutet är inte en smaksak: MSW:s egen dokumentation formulerar det som produktens bärande designavsikt — "a single source of truth for your network across the entire stack", och uttryckligen att samma mockar ska återanvändas tvärs miljöer och verktyg, integration och Playwright, samtidigt. Playwrights egen fixturdokumentation säger motsvarande om fixturer: definiera en gång, återanvänd i alla tester, och kombinera moduler med mergeTests. Två parallella fixturvärldar vore alltså både emot båda bibliotekens uttalade avsikt och emot ADR-080:s eget villkor att en fixtur och ett schema aldrig får divergera.

KOMPOSITIONEN SKER MED mergeTests, inte med kopiering eller arv. Mekanismen är verifierad som exporterad funktion i den installerade Playwright-versionen (1.61.1) före beslutet, inte antagen ur dokumentationen.

E2E-SÖMMEN BEHÅLLS FÖR DE 14. Den söm som byggdes som mätinstrument i S91 blir de skarpa filernas hemvist och behåller sin rapporterande roll. De två klasserna får därmed var sin söm, båda befintliga — ingen ny skarv införs.

VAKTEN ÄR AVBRYTANDE I ACCEPTANCE-KLASSEN, rapporterande i mätläget. Formen är statuskod med instruktionstext i klartext, så ett läckande anrop säger vad som ska göras och inte bara att något gick fel.

KONTRAKTSVAKTEN ÄR VILLKOR, INTE TILLÄGG. Den hänger i det befintliga nattnätet med dess larmkedja. Ytan är liten: tre endpoints bär merparten av de skarpa restanropen. Villkoret är skarpt eftersom Airtable-basens maximerings-milstolpe AKTIVT kommer att bygga om basen — fixturer utan vakt driftar tyst under exakt den perioden.

CI-JOBBET ÄR MUTEXFRITT och klassas som egen risk-klass i den befintliga klassnings-mekaniken. Shardning möjliggörs men aktiveras inte i denna arbetsenhet.

### Testbeslut

KLASSEN TESTAR EXTERNT BETEENDE: att appen renderar och beter sig rätt givet ett svar av rätt form. Den testar aldrig att en handler anropades eller hur många gånger — det vore att testa fixturen.

FOGEN BEVAKAS AV DELADE SCHEMAN. Samma zod-scheman ska parsa fixturens svar som parsar skarpa svar. Ett test som kringgår schemat kringgår hela argumentet för klassen.

FÖREBILDERNA FINNS I REPOT och ska följas snarare än återuppfinnas: den visuella regressionssvitens fixturvärld är mönstret för hermetiken, dess negativa self-test är mönstret för hur en vakt bevisas (en grön svit kan aldrig bevisa att en vakt fäller — bara ett test som medvetet gör ett omockat anrop kan det), och överskuggnings-mönstret är dokumenterat i fixturmodulen sedan denna sessions arbete.

VARJE FLYTTAD FIL KRÄVER TVÅSIDIGT BEVIS: att den passerar hermetiskt, och att vakten fäller när dess mockar tas bort. Utan det andra ledet är hermetiken en förhoppning.

A11Y-ASSERTIONER FÖLJER MED. Flera av de 18 filerna bär axe-kontroller; de körs i sidan och påverkas inte av att nätverket blir hermetiskt. De ska inte tappas i flytten.

KONTRAKTSVAKTEN TESTAS SJÄLV genom att en medvetet felaktig fixtur ska få den att larma. En vakt som aldrig setts larma är inte verifierad.

### Utanför omfattningen

- API-sviten. Punkt. Den är repots enda bevis för att Airtable beter sig som koden tror, och instrumentet för Airtable-basens leverabel.
- De fyra filer som stannar skarpa av doktrin: den som skriver skarpt till staging, samt de tre omvärldsytorna (riktig inloggning, service worker mot byggd preview, byggd kaskad).
- Shardning. Möjliggörs av arbetet, aktiveras separat och kräver egen mätning — den linjära skalningen är ett antagande, inte ett mätt värde.
- Merge queue-aktivering. Egen fråga, egen mätning.
- Den visuella grindens aktivering och staging-per-run-isolering. Båda är samdesignade med Airtable-milstolpen och rörs inte här.
- Omprövning av hela hermetik-topologin. Den är inritad vid Supabase-fasen, när datakällan blir klonbar.

### Estimat

Sex skivor, MEDIUM-LARGE. Grovt: den delade skarven med mergeTests-komposition och ett pilotpar filer; kontraktsvakten (villkor, måste stå före eller med migreringen); migreringen av de 18 i tre vågor med tvåsidigt bevis per fil; CI-jobbet mutexfritt med klassning; avslutande QA mot verkligt arbetsflöde.

Ordningen är inte fri: vakten är villkor för utbrytningen, så den kan inte skjutas sist.

### ADR-koppling

Styrande: ADR-080 (acceptance-klassen, hermetisk utbrytning — klassbytet, snittet vid protokollet, kontraktsvakten som villkor, vakten i avbrytande läge, portabilitetsgränsen). ADR-077 (risk-klassning, dedup och nattnätet som vakten hänger i). ADR-063 (Airtable-basen som förstklassig leverabel — API-sviten är instrumentet, och basens ombyggnad är skälet vakten är villkor).

Räknings-korrigeringen 19/13 till 18/14 hör i ADR-080 som en not, inte i en ny ADR: den ändrar en siffra, inte ett beslut, och ADR:n slår själv fast att kriteriet bär och inte kvoten.

Skulle den delade skarvens hemvist visa sig kräva ett strukturellt val som är svårt att återställa, mintas det separat och refereras — aldrig inline.

### Ytterligare anteckningar

MOTIVERINGEN ÄR INTE ATT MOCK ÄR FÖRSTAHANDSVALET. Branschens ledare mockar inte sina egna tjänster. Vår grund är att branschens väg ut — efemär skarp backend — är delvis stängd eftersom Airtable inte är självhostbar. Klassen är en dokumenterad kompromiss, korrekt utförd enligt branschens andrahandsval, med omprövning inritad vid Supabase-fasen. Skulle detta kort påstå att hermetisk är bäst praxis vore det falsifierbart på fem minuter.

EVIDENSLÄGET OM MOCK-DRIFT ÄR TUNT och sägs rakt ut: vakten byggs på ett resonemang om felklassen, inte på publicerad frekvensdata.

DEN TYSTA FELKLASSEN ATT BEVAKA UNDER BYGGET: en överskuggning vars mönster inte matchar faller igenom till den delade handlern utan att något fälls. Testet ser då normalläget i stället för sitt specialfall och kan passera felaktigt. Vakten kan strukturellt inte se det, eftersom anropet ÄR mockat. Detta är dokumenterat i fixturmodulen och ska läsas före den första skivan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Klassningen av varje flyttad fil är HÄRLEDD ur hermetik-mätdatan och räkningen redovisad — ingen handplockning
- [ ] #6 Varje flyttad fil har tvåsidigt bevis: passerar hermetiskt OCH vakten fäller när dess mockar tas bort
- [ ] #7 Kontraktsvakten är i drift och har setts LARMA på en medvetet felaktig fixtur innan sista filen flyttas
- [ ] #8 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
- [ ] #9 Acceptance-jobbet kör utan staging-mutex och den nya mutexhållningen är MÄTT, ej projicerad
<!-- DOD:END -->
