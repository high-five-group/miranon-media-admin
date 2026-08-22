---
id: TASK-299
title: >-
  PRD: Anmälningssidan (/mer/anmalningar) — konvergens och Mer-familjens delade
  sidram
status: To Do
assignee: []
created_date: '2026-08-22 18:38'
labels: []
dependencies: []
ordinal: 539000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Anmälningssidan `/mer/anmalningar` är den enda kvarvarande Fas 1-ytan i Mer-familjen som aldrig gått ett konvergenspass. Den saknas i alla 12 facit-manifest och 27 stämplade ytor, har ingen markör i facit-policyn, och ingen prototyp föregick den. Marcus dom vid QA-vandringen (TASK-284.5, 2026-08-22): "skitful".

Sidan är samtidigt ÅTGÄRDSKÖNS landningsyta: Hem-vyns åtgärdskö-rad navigerar hit med det filtrerade läget, så Lotta möter den gamla formen i exakt det ögonblick något gått fel och ska lösas. Kön, markören och resolutionen är byggda och live i prod — men de sitter i en yta ingen designat.

Bakom sidan ligger ett husproblem: appen bär TVÅ oförenliga layout-dialekter, båda facit-stämplade. Den ena har chevron och rubrik indragna med kortytan kant-i-kant; den andra lägger allt på samma marginal. Den ena kallar den andra ett dubbleringsfel i sin egen kodkommentar. Designsystem-specen saknar sektion för sidram helt. Följden är att varje ny yta väljer sida utan att frågan ställts — och att fyra av Mer-familjens fem sidor dessutom bär en TREDJE, äldre form med dubblerad sidmarginal och textlänk i stället för chevron.

Samma splittring finns i initialcirkeln: sju byte-identiska renderingar av samma klass-sträng och sex kopior av initialer-hjälparen, med tre motstridiga skrivna ställningstaganden i koden om huruvida duplicering av presentationsformer är avsiktlig husmanskost eller skuld.

### Lösning

Anmälningssidan konvergeras som EGEN arbetsenhet — inte som utvidgning av åtgärdskö-arbetet, vars prod-värde är oberoende av sidans form.

Radanatomin ÄRVS från personlistan, som är facit-låst och byggd som scanlista för 200 rader. Samma rad, annat innehåll: initialcirkel ur anmälarens namn, namnet som länk, undertext "N dagar sedan · Eventnamn", status som egen kolumn med reserverad plats, chevron. Det ger Lotta de två uppgifter hon faktiskt letar efter på en anmälningsrad — NÄR den kom in och VILKET event den gäller — i en form hon redan känner igen från personvyn.

Åtgärden bärs av raden själv: en rad som behöver kopplas om leder till resolutionsdialogen i stället för till eventet. Inget separat knappelement, så personlistans höjdlås och breddlås överlever.

Husets sidram avgörs till kant-i-kant och lyfts till en delad vy-grund som promoveras till hela Mer-familjen. Initialcirkelns befintliga komponent flyttas till primitiv-hemvisten och konsumeras av de tre sidor vars rader bär en person.

Hur BRETT den delade vy-grunden dras — bara sidkromet, också rubrikblocket, eller hela vägen inklusive de två ytor som i dag bär den andra dialekten — avgörs INTE i text. Formen byggs bakom en dev-parameter på de fyra befintliga ytorna, Marcus ser förändringen med riktig data i handen och väljer på bild. Växeln rivs efter valet; formen står kvar.

### Användarberättelser

1. Som Lotta vill jag se när en anmälan kom in direkt på raden, så att jag kan bedöma vad som är färskt utan att öppna varje post.
2. Som Lotta vill jag se vilket event en anmälan gäller direkt på raden, så att jag kan skanna listan efter ett visst tillfälle.
3. Som Lotta vill jag att anmälningsraderna ser ut som personraderna, så att jag inte behöver lära mig två listformer i samma app.
4. Som Lotta vill jag att varje rad har samma höjd oavsett innehåll, så att ögat kan skanna en lång lista utan att tappa spåret.
5. Som Lotta vill jag att en anmälan som behöver åtgärd är synligt markerad, så att jag ser den utan att läsa varje rad.
6. Som Lotta vill jag att statusen alltid sitter på samma ställe i raden, så att jag kan fixera blicken och skanna kolumnen.
7. Som Lotta vill jag att en rad som behöver kopplas om tar mig direkt till resolutionen, så att jag inte behöver leta efter en knapp.
8. Som Lotta vill jag komma tillbaka från det filtrerade åtgärdskö-läget till hela listan, så att filtret aldrig blir en återvändsgränd.
9. Som Lotta vill jag att åtgärdskö-läget säger hur många rader som väntar, så att jag vet om jag är klar.
10. Som Lotta vill jag att tomt läge säger något vänligt i stället för att se trasigt ut, så att jag vet att inget är fel.
11. Som Lotta vill jag att alla sidor under Mer ser likadana ut, så att appen känns som en app och inte som flera.
12. Som Lotta vill jag ha samma tillbaka-knapp överallt, så att jag aldrig behöver leta efter vägen ut.
13. Som Lotta vill jag känna igen initialcirkeln från Hem och personlistan, så att raderna går snabbare att skanna.
14. Som Lotta vill jag att sidan fungerar lika bra på telefonen som på datorn, så att jag kan jobba vid dörren.
15. Som Lotta vill jag att sidan läser upp sig begripligt i skärmläsare, så att den är användbar oavsett hur jag navigerar.
16. Som Marcus vill jag se den nya sidramen på befintliga ytor med riktig data innan jag låser omfattningen, så att jag beslutar på bild och inte på beskrivning.
17. Som Marcus vill jag att ett stämplat facit ändras öppet med mitt citat, så att formen aldrig glider utan spår.
18. Som Marcus vill jag att den vunna formen promoveras till systersidorna utan ny designrunda, så att konsekvensen kommer utan att kosta fem pass.
19. Som utvecklare vill jag ha EN delad vy-grund att importera, så att nästa yta inte kopierar sidkromet en åttonde gång.
20. Som utvecklare vill jag att initialcirkeln bor i primitiv-hemvisten, så att villkoret koden själv skrev ned äntligen är uppfyllt.
21. Som utvecklare vill jag att varje yta jag rör har en visuell vakt när jag lämnar den, så att nästa ändring inte driver tyst.

### Implementationsbeslut

FACIT-MANIFEST SOM STYR ARBETET (auktoritativa över denna prosa, ADR-102 B1):

- `tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json` — yta "personlistan", 2 facit-bilder. FORMEN SOM ÄRVS. Låst av Marcus: tonal kortyta med divide-y-avdelare (aldrig fristående kort per rad) · låst radhöjd · status som EGEN kolumn med reserverad plats · interaktionsraden avskild med 4 px, utan ikon. Manifestet varnar uttryckligen att katalogen bär 28 PNG:er varav två är en FÖRKASTAD zebra-fork som ligger kvar som historik — bara slutläges-bilderna är facit. Det mekaniska facit är ariaSnapshot-referenserna, inte bilderna.
- `tasks/sessions/bilagor/s103-persondetalj-konvergens/facit.json` — yta "persondetaljen", 0 bilder (deklarerad frånvaro; mekaniskt facit = ariaSnapshot). BERÖRS av sidram-växeln.
- `tasks/sessions/bilagor/s103-checkin-konvergens/facit.json` — yta "check-in (dörrlistan, variant D)", 2 bilder. BERÖRS av sidram-växeln.
- `tasks/sessions/bilagor/s106-aktivitetslogg/facit.json` — yta "aktivitetshistorik-sidan", 2 bilder. BERÖRS endast om den bredaste omfattningen väljs (ytan bär i dag den andra dialekten).
- `tasks/sessions/bilagor/s102-dokument-konvergens/facit.json` — yta "Dokument-ytan /mer/dokument, lista med filter + Visa-overlayens tre klasser", 5 bilder. Samma villkor som föregående.

Anmälningssidan själv har INGET manifest — det är premissen för hela arbetsenheten, och ett stämplat manifest för den är en leverabel.

BESLUT:

1. Divergensen körs på anmälningssidan ENSAM och startar som EXAKT kopia av nuvarande vy, aldrig från tomt blad. Tre varianter växlingsbara på en dev-route; Marcus väljer EN.
2. Divergensen ska bära sidans tre lägen: ofiltrerad lista, åtgärdskö-läget och tomt läge. Det filtrerade läget är samma yta, inte en egen sida.
3. Sidramen blir kant-i-kant: chevron och rubrik indragna, kortytan kant i kant mot innehållsytan. Valet avgör husets två levande dialekter till förmån för den fyra av sex skarpa ytor redan bär.
4. Den delade vy-grunden byggs som bibliotekskomponent på 11/11/11 och ersätter sidkromets kopiering.
5. Vy-grundens BREDD är mätningsberoende och avsiktligt olåst i denna spec: formen byggs bakom en dev-parameter på de fyra befintliga ytorna, och Marcus väljer på bild mellan sidkrom enbart, sidkrom plus rubrikblock, eller full omfattning inklusive de två ytor som bär den andra dialekten. Växeln rivs efter valet.
6. Initialcirkelns befintliga komponent flyttas till primitiv-hemvisten — ren flytt, samma klasser, noll visuell förändring — och konsumeras av anmälningssidan, väntelistan och intresserade. Maillogg får ingen cirkel: raden är ett utskick med ett mottagarantal, inte en person. Installera-appen är ingen lista.
7. De sex kvarvarande inline-renderingarna av cirkeln migreras INTE i denna arbetsenhet. De sitter i facit-stämplade filer och migreringen blir riskfri först när de fått visuella vakter.
8. Den kodkommentar som påstår att duplicering av presentationsformer är avsiktlig rivs öppet i samma landning som lyftet — huset väljer motsatsen, och texten får inte stå kvar och påstå annat.
9. Åtgärden bärs av raden: en rad som behöver kopplas om leder till resolutionsdialogen. Inget separat knappelement i raden, eftersom en knapp aldrig får nästlas i en anchor och radens hela yta är en länk.
10. Höjdlåset och breddlåset från personlistans facit gäller: raden renderas alltid med samma höjd oavsett data, och statuskolumnen reserverar alltid sin plats och döljs med visibility i stället för villkorad rendering.
11. Status bär ALDRIG betydelse enbart genom färg — ikon eller ord alltid, oavsett vilken form varianten väljer.
12. Datavägen är oförändrad: läsning via befintlig Edge Function utan filter, klient-sort senaste först, filtrering av redan hämtad lista som rendringssteg. Ingen ny EF, ingen allowlist-ändring, inget nytt nätverksanrop.
13. Det delade predikatet för "behöver hanteras" återanvänds oförändrat — sidan får aldrig en egen tolkning, eftersom Hem-vyns räknare läser samma funktion.
14. Designsystem-specen får en sidram-sektion. Den saknas i dag helt, vilket är varför dialekterna kunde divergera obemärkt.
15. Promoveringen till systersidorna sker som egna skivor, en per sida, utan ny designrunda.

### Testbeslut

Skarv-valet (avgjort på Marcus mandat 2026-08-22): SKARVARNA FÖLJER SKIVORNA — inga nya testfiler i förskott. Anmälningssidans acceptance-skarv och visuella skarv finns redan och utvidgas; varje promoveringsskiva utvidgar sin egen acceptance-fil och lägger sin visuella spec när den landar.

Promoveringsgrinden får EGEN fil enligt husets mönster, trots principen om högsta möjliga skarv. Mätt: inget hänger mekaniskt på filnamnet, så konsolidering vore tekniskt fri — men nio filer följer konventionen, agenter grepar efter den, och grinden har en egen livscykel (referensen fångas ur variant-läget FÖRE flippen och ska vara grön mot den promoverade ytan efter). De två sakerna mäter olika ting vid olika tidpunkter.

Tester ska pröva EXTERNT BETEENDE, aldrig implementationsdetaljer: att raden visar när anmälan kom in och vilket event den gäller, att en rad som behöver åtgärd leder till resolutionen, att vägen tillbaka ur filtret finns, att tomt läge och felläge visar rätt sak. Aldrig att en viss klass-sträng finns.

Förebilder i kodbasen: anmälningssidans egen acceptance-fil bär redan rätt form (rader senaste först, rad-klick, olänkad rad, tomt läge, 4xx via role=alert, axe 0) och utvidgas i stället för att skrivas om. Personlistans promoveringsgrind är förebilden för ariaSnapshot-mönstret.

Den visuella baslinjen för anmälningssidan OM-BASELINJERAS med avsikt — sidan ändras, och den gamla baslinjen är det vi river. Det är en legitim ändring och ska bokföras som sådan, aldrig smygas förbi.

Höjdlåset testas som beteende: rader med och utan status, med och utan åtgärdsbehov, ska ha samma höjd. Det är den invariant som lättast går sönder tyst.

Axe 0 på varje ny och ändrad yta, i alla tillstånd inklusive tomt och fel.

### Utanför omfattningen

- Migrering av de sex kvarvarande inline-renderingarna av initialcirkeln — väntar på visuella vakter, eget kort.
- Facit-regimernas täckning i stort: kartläggning av alla 27 stämplade ytor, regimvalet per yta, och wiringen av stämplade referenser till en vakt. Egen tråd (T172) och eget kort (TASK-297).
- Åtgärdskö-RADENS särskiljning på Hem — eget kort (TASK-291), eget litet divergenspass; sessionens andra spår.
- Normalisering av URL-kodade mellanslag i eventmatchningen — eget kort (TASK-293).
- Maillogg och installera-appen får sidramen men ingen initialcirkel och ingen radanatomi-ändring; deras innehåll rörs inte.
- Datamodell, Edge Functions och Airtable-basen rörs inte alls.

### Estimat

8–9 skivor, medelstor arbetsenhet. Grovt: delad vy-grund plus cirkel-lyft plus dev-växel (1) · Marcus mäter och låser omfattningen (1, mänsklig) · anmälningssidans divergens (1, mänskligt val) · konvergens plus facit-stämpel plus promovering (1) · promovering till fyra systersidor (2–3) · facit-amendering av berörda stämplade ytor i vald omfattning (1) · QA-vandring (1, mänsklig).

### ADR-koppling

Styrande i området: ADR-102 (prototypen ÄR facit; stämplad form byggs aldrig om, den flyttas) · ADR-103 (promoveringskontraktet, inklusive regressionslåset som fångas före flippen och rivningen som tar växlar men aldrig form) · ADR-104 (stämpelns schema och kanalseparation) · ADR-055 (router-context-DI för datavägen) · ADR-122 (åtgärdskön, dess familjegräns mot notisfamiljen och det delade predikatet) · ADR-123 (personregistrets förladdning, som personlistans radform vilar på) · ADR-074 (växlar-standarden och snapshot-paret för dev-parametrar) · ADR-051 (distinkt scope motiverar egen session).

ÖVER BAREN, MINTAS SEPARAT: ADR-124 — delade presentationsformer. Principen ("delar det här huset presentationsformer, eller kopierar det dem?") med sidramsvalet och initialcirkeln som sina två instanser. Baren prövad öppet: svår att återställa i koherens eftersom varje framtida yta byggs ovanpå svaret; överraskande utan kontext eftersom koden i dag bär tre motstridiga skrivna positioner; verklig avvägning eftersom två dialekter lever parallellt med dokumenterad oenighet. Initialcirkeln får INGEN egen ADR — den är samma beslut i en andra skepnad.

### Ytterligare anteckningar

Åtgärdskö-sidan och anmälningssidan är SAMMA yta. Det filtrerade läget byter rubrik-copy och lägger till en väg tillbaka till hela listan. Konvergeras sidan konvergeras kön — det är inget spill, det är ett läge av samma vy.

Anmälningssidan är en SJÄTTE facit-lös yta utöver de fem byggplanen listar som överordnat förkrav för Fas 6:s stängning. Den härstammar ur Fas 1, inte Fas 6e, och står därför inte i listan. Väljs den bredaste omfattningen i beslut 5 ändras Fas 6:s closeout-räkning, och byggplanen ska uppdateras öppet i samma landning.

Grillningens rättelser mot kortets ursprungliga faktabas, bevarade så de inte återupptäcks: initialcirkeln finns i SJU renderingar, inte fyra som kortet uppgav; personlistan BÄR cirkeln (kortets radnummer var föråldrat, men sakuppgiften stämde — en mellanliggande moträttelse under grillningen var själv fel och är korrigerad); sidkromet finns i sex skarpa instanser fördelade på två dialekter.

Samsyn kvitterad av Marcus 2026-08-22 efter grillning. Skarv-valet delegerat till agenten i klartext: "DU har mandat att avgöra om skarv-valet."
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Facit-amendering av berörda stämplade manifest sker i EGEN commit med Marcus citat daterat (ADR-102/103) — aldrig i samma commit som formändringen
- [ ] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
- [ ] #7 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [ ] #8 Dev-växeln riven före arbetsenhetens stängning; formen kvar (ADR-103 B2 steg 4 — villkor och växlar, aldrig form)
- [ ] #9 check-facit grön; anmälningssidan bär ett eget stämplat manifest vid stängning
<!-- DOD:END -->
