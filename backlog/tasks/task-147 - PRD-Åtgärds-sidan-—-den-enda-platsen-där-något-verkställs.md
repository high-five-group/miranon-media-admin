---
id: TASK-147
title: 'PRD: Åtgärds-sidan — den enda platsen där något verkställs'
status: To Do
assignee: []
created_date: '2026-08-07 07:52'
updated_date: '2026-08-07 11:27'
labels: []
dependencies: []
ordinal: 232000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Lotta kan idag inte skicka något från appen som verkligen skickas.

Åtgärds-listan på eventsidan bär numrerade rader som ser ut som handlingar men är grå löften — flödena bakom dem finns inte. Där något ändå går att avfyra öppnar appen Lottas egen mailklient, och antecknar samtidigt i basen att utskicket är gjort. Det är en **stämplingslögn**: appen påstår sig veta något den inte kan veta. Stänger Lotta mailfönstret utan att trycka skicka står posten ändå som skickad.

Handlingarna är dessutom allt-eller-inget. "Skicka betalningspåminnelse till obetalda" träffar alla eller ingen; sex av tjugo går inte att välja. Och en påminnelse via mailklient till sex personer blir antingen sex fönster eller ett massutskick där alla ser varandras adresser.

Efter eventsidans konsolidering är läget dessutom skarpare: **eventsidan skriver ingenting alls längre.** Allt som verkställer — båda betalnings-kryssen, noteringen, påminnelsen, utskicken — har ingen hemvist förrän denna sida finns.

### Lösning

En **event-knuten Åtgärds-sida** som är den enda platsen där något verkställs.

**Mottagarna kommer med.** Lotta markerar i registret och drar med urvalet hit. På sidan är varje mottagare avmarkeringsbar — sista kontrollen sker där handlingen sker, inte där urvalet gjordes.

**Åtgärdsval, redigerbar text, bilageväljare.** Hon väljer vad som ska göras, ser mallens text och kan ändra den, och väljer vilka bilagor som ska med — **utan förvals-logik**, eftersom en gissad förvald bilaga är värre än ingen.

**Förhandsvisning före skick**, och sedan en pessimistisk körning som redovisar ett **ärligt delutfall**: lyckades fjorton av tjugo står det fjorton av tjugo, och de sex som föll ligger kvar markerade.

**Alla utskick är riktiga server-utskick.** Mailto-eran stängs. Stämpeln "skickad" sätts först när det faktiskt skickades, av den som vet.

**Betalningarnas skrivvertikal bor här.** Avprickning av anmälningsavgift och slutbetalning, noteringen och påminnelsen — allt det eventsidan gav upp.

**Kvittot genereras här** ur betalningsdata, med appens egen kvittonummer-serie.

### Användarberättelser

1. Som Lotta vill jag ta med mig ett markerat urval från registret hit, så att jag slipper välja om.
2. Som Lotta vill jag avmarkera en mottagare på plats, så att jag kan ångra ett enskilt val utan att börja om.
3. Som Lotta vill jag se exakt vilka som får utskicket innan jag trycker, så att ingen får ett mail av misstag.
4. Som Lotta vill jag välja vilken sorts åtgärd jag ska göra, så att rätt text och rätt logik följer med.
5. Som Lotta vill jag kunna skriva ett helt fritt utskick, så att jag inte är låst till mallarna när något oväntat händer.
6. Som Lotta vill jag se mallens text och kunna ändra i den, så att jag kan anpassa tonen till gruppen.
7. Som Lotta vill jag välja vilka bilagor som följer med, så att deltagarna får rätt papper.
8. Som Lotta vill jag att ingen bilaga är förvald, så att jag aldrig skickar en fil jag inte tänkte på.
9. Som Lotta vill jag förhandsvisa utskicket som mottagaren ser det, så att jag upptäcker fel innan de går ut.
10. Som Lotta vill jag att varje mottagare får sitt eget mail, så att ingen ser vem mer som fick det.
11. Som Lotta vill jag se hur många som lyckades och hur många som föll, så att jag vet om jag är klar.
12. Som Lotta vill jag att de som föll ligger kvar markerade, så att jag kan köra om just dem.
13. Som Lotta vill jag att ett utskick aldrig går ut dubbelt om jag råkar trycka två gånger, så att deltagarna slipper dubbla mail.
14. Som Lotta vill jag att "skickad" i basen betyder att det faktiskt skickades, så att jag kan lita på historiken.
15. Som Lotta vill jag pricka av en mottagen anmälningsavgift, så att registret visar rätt läge.
16. Som Lotta vill jag pricka av en mottagen slutbetalning, så att jag ser vem som är helt klar.
17. Som Lotta vill jag ta bort en felaktig avprickning, så att ett misstag går att rätta.
18. Som Lotta vill jag skriva en notering om en persons betalning, så att jag minns vad vi kommit överens om.
19. Som Lotta vill jag skicka en betalningspåminnelse till ett urval, så att jag kan jaga sex personer utan att störa de fjorton som betalat.
20. Som Roger vill jag att ett kvitto genereras automatiskt ur betalningen, så att jag slipper skriva det för hand.
21. Som Roger vill jag att kvittonumren är unika och löper, så att bokföringen håller.
22. Som Roger vill jag att appens kvittoserie syns skild från min befintliga serie, så att de aldrig förväxlas.
23. Som Roger vill jag att en betalning kvitteras i exakt ett system, så att samma betalning inte kvitteras två gånger.
24. Som Lotta vill jag att ett gammalt kvitto behåller sitt nummer för alltid, så att ett utskickat kvitto aldrig blir ogiltigt i efterhand.
25. Som mottagare vill jag att bilagan faktiskt finns i mailet, så att jag inte behöver be om den.
26. Som skärmläsaranvändare vill jag att körningens förlopp och resultat annonseras, så att jag vet när utskicket är klart.
27. Som Lotta vill jag att sidan säger vad som gick fel på mitt språk, så att jag vet om jag ska försöka igen.

### Implementationsbeslut

**Mailto-eran stängs, enhetligt.** Grillad samsyn S93 beslut 4: alla utskick är riktiga server-utskick. Det river stämplingslögnen vid roten — tidsstämpeln sätts av den som vet att sändningen skedde, inte av ett klick som öppnade ett fönster.

**SÄNDVÄGEN MÅSTE GRENAS I TVÅ. Detta är kortets farligaste detalj.** Research-passet fällde att dagens batch-ändpunkt **inte stödjer bilagor alls** — och bristen är **TYST**: bilagan försvinner utan felmeddelande. Ett utskick med valbar bilaga kan alltså inte gå genom dagens enda sändväg, och att bara lägga till en bilage-parameter på befintlig kod ger ett utskick som ser lyckat ut och saknar bilagan. Grenarna: **bilage-fri** (dagens batch, oförändrad mekanik, behåller sin genomströmningsfördel) och **bilage-bärande** (loopad singelsändning, en mottagare per anrop). Att lägga ALLA sändningar i singel-loop avvisades — ingen anledning att ge upp batchens fördel för utskick som aldrig bär en bilaga. Att vänta på leverantörsstöd avvisades — inget datum eller åtagande finns, och att bygga mot en ohärledd framtida API-yta är precis vad över-engineering-vakten avvisar.

**Idempotens-, samtyckes- och spärrlist-mönstren bär rakt över** från det befintliga utskickskontraktet till den nya grenen utan omdesign. Bara sändmekaniken behöver en ny implementation vid sidan av den befintliga. Nyckeln för den bilage-bärande grenen är deterministisk per mottagare, så en omkörning aldrig dubblerar.

**Pessimistisk bulk med ärligt delutfall.** Ett partiellt fel får aldrig rapporteras som helt lyckat. Urvalet överlever ett icke-rent utfall så omkörning träffar bara de som föll.

**Bilageväljaren bär ingen förvals-logik.** Grillad samsyn beslut 5, bokstavligt. En gissad förvald bilaga är farligare än en tom väljare.

**Betalningarnas skrivvertikal flyttar hit i sin helhet** — Marcus 2026-08-07, samma beslut som gjorde eventsidan till ren översyn: *"alla åtgärder flyttar till åtgärdssidan."* Det omfattar avprickning av båda betalningstyperna, noterings-redigering och påminnelsen. Två vakter följer med: basens takt tål inte obegränsad parallellitet vid en batch-avprickning, och statusvärdet "Ej relevant" får aldrig skrivas över av ett urval — föreläsnings-semantiken får inte plattas till.

**Påminnelsen är den dyra posten, inte en UI-koppling.** Dagens väg är mailto. En delmängds-påminnelse förutsätter server-side-utskick, alltså en egen skrivvertikal. Det ska synas i skivningen, inte upptäckas mitt i den.

**Kvittots nummerserie — Marcus beslut, tre principer bokförda.** Appen får en EGEN räknare; ingen integration mot Rogers faktureringssystem nu. (1) Räknaren bor i basen, additivt, och numret allokeras **server-side vid genereringen** — aldrig i klienten. (2) Formatet avgränsas **synligt** från Rogers serie: eget prefix, löpnummer, årssuffix, och start skild från ett. Rogers krav var att serien inte får börja om från ett bredvid en levande serie. (3) En betalning kvitteras i exakt **ETT** system.

**FÖRKRAV, ej uppfyllt:** var gränsen mot Rogers system går är den kvarvarande avstämningen. Kvitto-skivan får inte låsas innan den är gjord.

**Namnkollision att lösa här:** eventsidan bär redan en Åtgärds-rubricerad grupp med statiska länkar, och urvalets väg hit bär samma ord i en annan betydelse. Två Åtgärds-ytor på samma sida är känd skavning — den löses när denna sida får sitt namn på riktigt.

**Åtgärds-listans grå löften rivs eller görs om till genvägar.** Rader som pekar på flöden som nu bor här får inte stå kvar som inaktiva. Radernas numrering är byggkrav och deras referentbarhet ska hanteras uttryckligen vid rivning.

### Testbeslut

**Skarv 1, befintlig: edge-funktionernas kontraktsskarv.** Sändvägarnas kontrakt — behörighet, indata-validering, idempotens, ärliga fel — prövas där projektets övriga edge-funktioner prövas.

**Skarv 2, befintlig och ÄRVD: avprickningens staging-skarv.** Den testar idag betalnings-skrivningen på eventsidan. Subjektet flyttar hit, alltså följer skarven med. Den skrivs inte om från noll och den lämnas inte kvar och pekande på en yta som inte längre skriver.

**Skarv 3, befintlig: den hermetiska acceptance-skarven** för sidans egen renderade form — mottagarlistan, avmarkeringen, åtgärdsvalet, textredigeringen, bilageväljaren, förhandsvisningen, resultatredovisningen. Tillgänglighet med noll överträdelser i varje läge.

**Den tysta bilage-bristen kräver ett ÄNDE-TILL-ÄNDE-bevis, inte ett kontraktstest.** Ett test som verifierar att vi skickade rätt anrop bevisar ingenting här — det var precis så bristen kunde vara tyst. Beviset ska vara att bilagan **kommer fram**. Detta är kortets enskilt viktigaste testbeslut.

**Delutfallet testas som delutfall.** Ett scenario där några mottagare faller ska ge ett resultat som säger just det, och lämna de fallna kvar i urvalet. Ett test som bara prövar den lyckade vägen missar hela poängen.

**Idempotensen testas genom omkörning**, inte genom att läsa nyckelns form: samma körning två gånger ska ge ett mail, inte två.

**Kvittonumren testas på unikhet och beständighet:** två samtidiga genereringar får aldrig ge samma nummer, och ett redan utfärdat nummer ändras aldrig i efterhand.

**Mailto-frånvaron bevisas mekaniskt.** Att inga mailto-vägar återstår i utskicksflödena ska fällas av en grind, inte kontrolleras med ögat.

### Utanför omfattningen

- **Bilage-fundamentet** — kort 2. Denna sida KONSUMERAR bilagor; den definierar inte var de bor.
- **Eventsidans konsolidering** — kort 1. Urvalet föds där, verkställs här.
- **Mall-editor** för systemmallar — uttryckligen senare.
- **Integration mot Rogers faktureringssystem** — beslutat bort för nu; appen får egen serie.
- **Auto-utskickets motor** (schemalagda utskick utan Lottas hand) — en annan produkt än en manuell åtgärdssida.
- **Utskickshistorikens kortvisning** — bokförd som iterationspunkt, tas i formfasen.
- **Stöd för presentationsformat i bilagor** — senare.

### Estimat

**Åtta till tio skivor, stor arbetsenhet.** Det är kortet som bär mest av de tre, dels för att det är en helt ny sida, dels för att eventsidans hela skrivvertikal landar här.

Grovt snitt: (1) divergens-pass och formval — **först** · (2) sidans skal med mottagarlistan och avmarkeringen · (3) åtgärdsvalet och den redigerbara texten · (4) bilageväljaren · (5) den bilage-fria sändvägen · (6) den bilage-bärande sändvägen med sitt ände-till-ände-bevis · (7) förhandsvisning, pessimistisk körning och ärligt delutfall · (8) betalningarnas skrivvertikal · (9) påminnelsen som server-utskick · (10) kvittogenereringen med nummerserien · (11) QA-vandring.

Skiva 6 beror på kort 2. Skiva 10 beror på kort 2 och på Roger-avstämningen. Skiva 1 är förkrav till allt som rör form.

### ADR-koppling

- **ADR-067 REVIDERAS av detta kort** — grillad samsyn S93 beslut 4 bokförde det redan, och research-passet gav revisionen dess innehåll: inte bara mailto → server-utskick, utan en **grening av sändvägen i två**. Revisionen ska bära den tysta bilage-bristen som sitt skäl, med båda avvisade alternativen bokförda.
- **ADR KRÄVS för kvittonummer-serien** — mintas separat. Beslutet klarar baren: ett utfärdat kvittonummer är per definition oåterkalleligt (dyrt att återställa), serien som medvetet INTE börjar på ett är överraskande utan kontext, och valet mellan egen serie och integration mot Rogers system var en verklig avvägning med bokfört utfall.
- **ADR-063** (Airtable-basen som förstklassig leverabel) — styr att räknaren läggs additivt i basen.
- **Läsyte-gränsens ADR** (mintas av kort 1) — denna sida är dess andra hälft. Kort 1 säger var skrivning INTE sker; detta kort är svaret på var den sker i stället.

### Ytterligare anteckningar

**ÖPPEN PUNKT SOM MÅSTE STÄNGAS FÖRE SKIVNING — de sex åtgärdstyperna är inte nedskrivna.** Grillad samsyn beslut 5 säger *"åtgärdsval (6 typer inkl. Fritt utskick)"* och ORDLISTA säger *"åtgärdsval (utskickstyp)"*. Enumerationen finns **ingenstans** — sessionsdoket, research-passen, ordlistan, specarna och koden är genomsökta. Sex typer kvitterades; vilka de var överlevde inte transkriptet. De ska återges av Marcus och skrivas in innan skivan för åtgärdsvalet låses. Detta är en instans av att bara filartefakter överlever en session — den registreras öppet i stället för att gissas.

**Formen är INTE låst.** Till skillnad från kort 1, vars facit Marcus låste efter tjugo iterationsvågor, har denna sida inget facit. Grillad samsyn beslut 8 föreskriver ett **eget divergens-pass** för den. Kortet är produkt-spec; formen kommer ur passet.

**Kortet är sist i sekvensen med avsikt** — det konsumerar kort 2:s fundament och kort 1:s urval, och dess dyraste skiva står och faller med en avstämning som ännu inte är gjord.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Bilagan bevisad ände-till-ände FRAMME hos mottagaren — ett kontraktstest räcker inte, det var så bristen kunde vara tyst
- [ ] #6 Mailto-frånvaron mekaniskt fälld: noll mailto-vägar kvar i utskicksflödena
- [ ] #7 Delutfallet prövat som delutfall: partiellt fel rapporteras aldrig som helt lyckat, och de fallna ligger kvar markerade
- [ ] #8 Kvittonummer: unikhet under samtidighet + ingen retroaktiv omnumrering + allokering server-side bevisad
- [ ] #9 De sex åtgärdstyperna nedskrivna av Marcus FÖRE åtgärdsvalets skiva låses (enumerationen saknas i alla artefakter)
- [ ] #10 Roger-avstämningen om kvitto-gränsen bokförd före kvitto-skivan låses
- [ ] #11 Avprickningens E2E-täckning återupprättad på Åtgärds-sidan — skulden ärvd från TASK-145.3, där bekräfta-flödet revs ur eventsidan
<!-- DOD:END -->



## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
DOKUMENT-YTAN TAS I SAMMA SESSION (Marcus 2026-08-07). T131 bröts ut ur TASK-146 men ingår i DENNA sidas sessionsarbete, inte i ett eget spår.

SKÄLET: bilageväljaren på åtgärds-sidan visar det Dokument-ytan förvaltar. Designas väljaren utan att biblioteket är designat — vilken metadata som finns, hur bilagor grupperas per event, hur en ersatt version syns — designas den baklänges. Två vyer av samma objekt.

TVÅ PROTOTYP-PASS, INTE ETT: ytorna är distinkta (event-knuten åtgärds-sida respektive Mer-yta) och ska ha var sin form. Det delade är domänen och metadatats vokabulär.

BIEFFEKT: TASK-146 får därmed tillbaka en UI-konsument — utbrytningen hade lämnat fundamentet utan användare.

PARALLELLITET MOT BYGGSPÅRET: körs denna session samtidigt som agenter bygger TASK-145 finns tre krockytor (platshållarna, prototyp-växlarens registrering, hållplats-substratet som TASK-145.6 river). Reglerna står i docs/specs/ATGARDSSIDAN-UNDERLAG.md § 9 — egna filer och egen route, platshållarna orörda av båda tills facit är låst, TASK-145.6 allra sist.
<!-- SECTION:NOTES:END -->
