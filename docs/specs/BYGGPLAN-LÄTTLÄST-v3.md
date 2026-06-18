---
owner: marcus803
updated: 2026-06-18
review_by: 2026-11-15
status: stable
---


# Miranon Media Admin — Byggplan

*Vad vi bygger, varför, och vad det innebär för dig.*

> **Levande dokument.** Den här planen uppdateras löpande när vi går vidare. När en fas är klar förvandlas den till "vad vi har gjort, och varför". När nästa fas planeras får den en plats här. Ingen behöver gissa var vi är — det står i det här dokumentet.
>
> **Version 3** — Fas 5.5 KLAR (Session 22). Senast uppdaterad: 2026-06-18.
> **Status just nu:** Fas 0, Fas 1, Fas A, Fas 2, Fas 2.5, Fas 3, Fas 3.5, Fas 5 och Fas 5.5 är klara. **Fas 6 (alla rum — Hem, Event, Personer, Mer, i fem delar) är nästa.**
> **Föregångare:** [v2](../archive/BYGGPLAN-LÄTTLÄST-v2-2026-04-13.md) (april 2026, arkiverad 2026-05-09) och [v1](../archive/BYGGPLAN-LÄTTLÄST-v1-2026-04-13.md) (arkiverad 2026-05-06). v3 ersätter v2 och speglar byggplan-revisionen från maj 2026.

<!-- markdownlint-disable-next-line MD028 -->  <!-- BYGGPLAN-LÄTTLÄST formatering (pedagogisk struktur per ADR-025) -->

> **Till dig som läser detta:** Det här dokumentet beskriver hela planen för Miranon Medias nya digitala verktyg. Det är skrivet så att du ska förstå allt — oavsett teknisk bakgrund. Första gången ett tekniskt begrepp dyker upp förklaras det direkt i texten. Du behöver aldrig lämna det stycke du läser för att förstå det.

---

## Innehåll

1. [Vad bygger vi?](#1-vad-bygger-vi)
2. [Varför bygger vi om?](#2-varför-bygger-vi-om)
3. [Hur lång tid tar det?](#3-hur-lång-tid-tar-det)
4. [Tidslinjen — alla steg på ett ställe](#4-tidslinjen--alla-steg-på-ett-ställe)
5. [Det här är redan klart](#5-det-här-är-redan-klart)
6. [Det här bygger vi nu](#6-det-här-bygger-vi-nu)
7. [Det här bygger vi sedan](#7-det-här-bygger-vi-sedan)
8. [Parallellspår: städning av databasen](#8-parallellspår-städning-av-databasen)
9. [Senare: byte av databas](#9-senare-byte-av-databas)
10. [Hur vi säkerställer kvalitet](#10-hur-vi-säkerställer-kvalitet)
11. [Verktygslådan](#11-verktygslådan)
12. [Ordlista A–Ö](#12-ordlista-aö)
13. [Versionshistorik](#13-versionshistorik)

---

## 1. Vad bygger vi?

Vi bygger **ditt arbetsverktyg**. En app som samlar allt du behöver för att hantera Miranon Medias event, anmälningar, betalningar, deltagare och kommunikation — på ett ställe.

Du öppnar appen i en webbläsare (Chrome, Safari eller liknande) på dator, surfplatta eller telefon. Det är ingen app du laddar ner från App Store — den lever på en webbadress som du bokmärker, precis som en vanlig hemsida. Skillnaden mot en hemsida är att den är skräddarsydd för dig och dina arbetsuppgifter.

**Appen har fyra flikar:**

| Flik | Vad du hittar |
|------|--------------|
| **Hem** | Din överblick. Nya anmälningar, nästa event, obetalda. Du ser direkt hur läget ser ut — svaret på frågan "brinner det?". |
| **Event** | Alla event i en lista. Klicka på ett för att se anmälda, betalningar och föra närvaro. |
| **Personer** | Sök bland alla som haft kontakt med Miranon Media. Se en persons hela historik. |
| **Mer** | Intresserade personer (leads), planera nytt event, skicka mail, inställningar, logga ut. |

> 📸 *Här kommer en skärmbild av appen att läggas in när Fas 5 är klar.*

---

## 2. Varför bygger vi om?

Vi har redan byggt en fungerande version av appen. Den fungerar — men nu bygger vi om den med bättre verktyg.

**Tänk på det som att byta motor i en bil.** Bilen ser likadan ut utifrån. Du märker ingen skillnad i utseendet. Men under huven får vi en motor som är lättare att underhålla, har fler reservdelar tillgängliga och är bättre förberedd för framtiden.

**Tre konkreta fördelar:**

1. **Snabbare att bygga vidare.** Saker vi byggde för hand i den första versionen (tusentals rader kod) finns redan färdiga och testade i det nya systemet. Det betyder att nya funktioner kan läggas till snabbare framöver.

2. **Enklare att få hjälp.** Det nya systemet ([React](https://react.dev/)) är världens mest använda verktyg för att bygga webbappar. Det gör det lättare att hitta kunskap, mallar och stöd om något krånglar.

3. **Bättre förberett för framtiden.** Samma byggklossar kan återanvändas i Passionslyftet (det större LMS-projektet som ligger längre fram). Vi bygger inte två gånger.

**Vad vi inte gör:** Vi ändrar inte hur appen ser ut eller används. Logiken är samma. Roger och Lotta ska känna igen sig direkt.

---

## 3. Hur lång tid tar det?

Vi mäter inte i kalenderdagar utan i **arbetspass**. Ett arbetspass är ungefär ett par timmars fokuserad utvecklingstid med Marcus och Claude (AI-utvecklarverktyget). Mellan arbetspass kan det gå dagar eller veckor — det beror på Marcus tillgänglighet och vad som behöver verifieras.

**Total uppskattning för hela bygget:** ungefär **16,5 arbetspass** från och med Fas 2.

Det är inget löfte och ingen deadline — det är en realistisk gissning baserad på hur länge varje del brukar ta. Vissa delar kan gå snabbare när vi väl är inne i flytet. Andra kan ta längre om vi upptäcker något oväntat. Den här planen uppdateras när det händer.

**Det som redan är klart** (Fas 0, Fas 1 och Fas A) tog totalt cirka 5 arbetspass under april och tidiga maj 2026.

---

## 4. Tidslinjen — alla steg på ett ställe

| Fas | Vad det är | Status | Storlek |
|-----|------------|--------|---------|
| **Fas 0** | Grunden — projekt och designspråk | ✅ Klar (april) | 1 arbetspass |
| **Fas 1** | Flytta in det vi redan har | ✅ Klar (april) | 0,5 pass |
| **Fas A** | Säkerhetsvakten — låsa serverdörrarna | ✅ Klar (4 maj) | ~3 pass |
| **Fas 2** | Dörrar och lås — navigering + inloggning | ✅ Klar (13 maj) | 3 pass (faktiskt) |
| **Fas 2.5** | Dubbelkoll på datan | ✅ Klar (10 juni) | 1 pass |
| **Fas 3** | Byggklossar — knappar, fält, dialoger | ✅ Klar (11 juni) | 1 pass (faktiskt, planerat 2) |
| **Fas 3.5** | Tillgänglighetstest — för alla som ska använda appen | ✅ Klar (11 juni) | 1 pass |
| **Fas 5** | Skalet — det du ser först | ✅ Klar (12 juni) | 1 pass |
| **Fas 5.5** | Första riktiga interaktionen — markera betalning | ✅ Klar (17 juni) | 2 pass |
| **Fas 6** | Alla rum — Hem, Event, Personer, Mer (i fem delar) | 🟡 Nästa | 3,5 pass |
| **Fas 6.5** | "Vad har hänt?" — automatisk historik | ⏳ | 1 pass |
| **Fas 7** | Slutbesiktning — gör appen redo att publiceras | ⏳ | 3 pass |
| **Fas 8** | Framtid — passkeys, push-notiser, offline-kö | 🔮 Framtid | Senare |
| **Fas B** | Städning av Airtable-databasen | 🅿️ Parallellt | Roger + Lotta |
| **Fas E** | Byte av databas till Supabase | 🅴 Långt fram | Senare |

> **Varför saknas Fas 4?** Den fanns i en tidigare plan (för en stor tabell-vy) men togs bort när vi insåg att FK-designen som styr hela appen använder listor istället för tabeller. Numreringen behålls för att undvika förvirring — Fas 3 går direkt till Fas 5.

---

## 5. Det här är redan klart

Det vi byggt hittills är fundamentet — den del du inte ser men som allt annat står på.

### Fas 0: Grunden ✅

**Klar 14 april 2026.**

Det här var som att gjuta husgrunden, dra el och vatten, och sätta upp byggställningen.

Vi skapade ett nytt tomt projekt och installerade alla verktyg som behövs. Vi bestämde appens visuella språk: vilka färger (en varm guldfärg och dämpade koppartoner), vilket typsnitt ([Inter](https://rsms.me/inter/) — ett lättläst typsnitt designat för skärmar) och vilka avstånd som ska användas genomgående. Sådana värden kallas *tokens* — ett token är ett namn på ett designval, till exempel "primärfärgen heter guld". Alla delar av appen refererar till samma tokens, vilket garanterar att allt ser likadant ut överallt.

Vi satte också upp tre saker som arbetar i bakgrunden:

- **Automatisk kvalitetskontroll.** Verktyg som granskar koden vid varje sparning — som en stavningskontroll, fast för kod.
- **Prestandamätning.** Mäter hur snabbt appen laddar på din faktiska enhet, inte bara på utvecklardatorn.
- **Säkerhetsregler.** Berättar för webbläsaren exakt vad appen får göra. Skyddar mot en typ av attack där illvilliga webbsidor försöker lura webbläsaren att köra skadlig kod.

**Vad du märker:** Ingenting visuellt. Appen existerar inte ännu. Men efter den här fasen kunde vi bygga allt annat snabbt och säkert.

### Fas 1: Flytta in det vi redan har ✅

**Klar 14 april 2026.**

Vi kopierade det som redan fungerade från den gamla appen till den nya:

- **Datamodellerna** — beskrivningar av vad ett "Event" är, vad en "Person" är, vad en "Anmälan" är. Tänk på det som mallar som bestämmer vilken information som finns. De fungerar identiskt i den nya appen.

- **Kopplingen till Airtable** — koden som hämtar och skickar data till [Airtable](https://airtable.com/), molndatabasen där all information om event, personer och anmälningar lagras. Kopplingen fungerar via en *adapter* — ett mellanlager som översätter mellan appen och databasen. Tänk på det som en universalladdare som funkar med alla telefoner: byter vi databas senare så är det bara adaptern som behöver bytas, inte hela appen.

- **Serverfunktionerna** — funktioner som körs på [Supabase](https://supabase.com/) och fungerar som en säkerhetsvakt mellan appen och Airtable. Appen pratar aldrig direkt med Airtable — den går alltid via vakten.

- **De styrande dokumenten** — alla planer, designregler och kvalitetskrav. 42 filer med över 9 000 rader text som styr hela bygget.

Vi lade också till **automatisk datakontroll**: när appen tar emot information från Airtable kontrolleras att informationen ser ut som förväntat. Om Airtable ändrar sin struktur upptäcker vi det direkt — istället för att appen visar felaktiga siffror utan att någon märker det.

Och om nätverket krånglar försöker appen automatiskt igen — tre gånger, med ökande väntetid mellan försöken.

**Vad du märker:** Fortfarande ingenting visuellt. Men datan är på plats och nätverket är robust.

### Fas A: Säkerhetsvakten ✅ *(ny i v3)*

**Klar 4 maj 2026.** Detta var ett oplanerat sidospår som visade sig vara nödvändigt.

När vi granskade serverkoden upptäckte vi åtta hål i säkerheten — inte akuta, men sådant som måste tätas innan appen släpps ut till skarp användning. Vi stängde alla åtta i en sammanhängande arbetsperiod och kallade det Fas A (för att inte krocka med fasnumreringen i bygget).

Vad vi tätade, i klartext:

1. **Vem är du?** Innan vi byggde detta kunde vem som helst som hittade adressen till en serverfunktion fråga den om data. Nu kontrolleras alltid att förfrågan kommer från en inloggad användare.

2. **Var kommer du ifrån?** Servern accepterar nu bara förfrågningar från Miranon Medias egna webbadresser. Om någon annan webbsida försöker fråga servern blockeras den.

3. **Vad får du ändra?** Tidigare kunde en skrivförfrågan teoretiskt ändra vilket fält som helst i Airtable. Nu finns en allowlist — en lista över exakt vilka fält som får ändras genom vilka operationer. Allt annat nekas automatiskt.

4. **Sökfält som vapen.** Vi tätade en lucka där en illvillig sökterm kunde lura Airtable att returnera mer data än den skulle. Nu sker en sträng eskapering av alla söktermer, plus ett självtest som bevisar att eskaperingen fungerar.

5. **Skapa-admin-funktionen.** Den krävde tidigare ingen kontroll alls. Nu kan bara existerande administratörer skapa nya administratörer.

6. **Felmeddelanden som läcker.** När något gick fel kunde servern visa intern teknisk information som kunde hjälpa en angripare att förstå systemet. Nu får utåt-vänliga fel en standardiserad ofarlig text + ett spårnings-ID, medan den interna detaljen sparas i serverloggen där bara vi kommer åt den.

7. **Felövervakning.** Vi aktiverade [Sentry](https://sentry.io/) — ett verktyg som automatiskt rapporterar fel som händer i appen så vi kan upptäcka och åtgärda dem snabbt, även om ingen användare hör av sig.

8. **Konfigurationsfil för servern.** Servern hade ingen versionshanterad konfiguration. Nu finns en sådan fil, så att inställningarna är spårbara och inte kan ändras av misstag utan att någon ser det.

Allt detta verifierades med 113 automatiska tester som körs vid varje ändring för att bevisa att skydden inte gått sönder.

**Vad du märker:** Ingenting just nu — men när appen senare publiceras vet vi att grundläggande server-säkerhet är på plats. Det här är saker man absolut inte vill upptäcka är trasiga *efter* lansering.

> **Varför Fas "A" och inte Fas 4?** Det här arbetet var inte planerat när byggplanen skrevs. Det dök upp efter en granskning av serverkoden och var så omfattande att det förtjänade en egen fas-bokstav. Vi använde A för att markera "akut säkerhetsarbete" snarare än ett steg i den ordinarie sekvensen.

### Fas 2: Dörrar och lås ✅ *(ny i v3 — klar 13 maj 2026)*

**Klar 13 maj 2026** över tre arbetspass (Sessions 4 + 5 + 5b, 2026-05-11 till 2026-05-13).

Nu fungerar appens **navigering** mellan sidor och **inloggning**.

Du loggar in med email och lösenord. Inloggningen sparas så du slipper logga in varje gång appen öppnas. Om du försöker öppna en sida utan att vara inloggad skickas du automatiskt till inloggningsskärmen.

Tre saker byggdes i samma fas:

- **Vägvalsystemet** — koden som vet vilken sida som ska visas när du klickar på en länk eller anger en webbadress. Vi använder [TanStack Router](https://tanstack.com/router), ett modernt vägvalsystem där varje sida automatiskt kopplas till en mapp i koden. När en ny sida läggs till behöver ingen registrera den manuellt — strukturen i mappen blir vägvalslistan.

- **Inloggningssystemet** — kopplingen till Supabase Auth, samma server som hanterar all data. När du loggar in får din webbläsare ett digitalt "passerkort" som följer med varje förfrågan till servern. Säkerhetsvakten från Fas A kontrollerar passerkortet och släpper igenom dig om det är giltigt.

- **Tillstånd som överlever omladdning** — om du till exempel filtrerar event-listan på "kommande" och sedan laddar om sidan, ligger filtret kvar. Det åstadkommer vi genom att lagra sådana val i webbadressen (URL:en). Det betyder också att du kan bokmärka en filtrerad vy, eller skicka en länk till någon annan som öppnar samma vy.

**Tre lager av säkerhet mot oavsiktlig dataläcka:**

1. **Klient-vakt** — webbsidan blockerar utloggade FÖRE den frågar servern om data.
2. **Tydligt fel om vakten brister** — om något går fel i steg 1 (regression) ger koden ett typat felmeddelande istället för att tyst skicka en anonym nyckel.
3. **Server-vakt** — Säkerhetsvakten från Fas A avvisar oberoende anonyma nycklar.

Allt verifieras automatiskt via 6 Playwright-tester som körs vid varje kodändring — om något av lagren bryts vid framtida arbete fångas det innan koden går ut.

**Vad du märker:** Du kan logga in! Sidorna heter fortfarande "Hem", "Event", "Personer", "Mer" — men innehållet är platshållare som byggs ut i Fas 6.

---

## 6. Det här bygger vi nu

### Fas 2.5: Dubbelkoll på datan

<!-- markdownlint-disable-next-line MD036 -->
*1 arbetspass · ✅ klar 10 juni 2026 (Session 13)*

**Så gick det:** Allt i listan nedan blev klart på ett pass, precis som planerat. Vi hittade och rättade dessutom ett fel i själva byggplanen (en hänvisning som hade glidit iväg från det ursprungliga beslutet), och vi dubbelkollade alla statusvärden direkt mot den riktiga Airtable-basen — inte bara mot dokumentationen. Inga av Airtable-städåtgärderna (A1–A12) var gjorda ännu, så koden synkades mot verkligheten som den faktiskt ser ut.

**Vad händer?**

Det här är en kort, teknisk mellanfas. Vi går igenom kodens beskrivning av Anmälningars status (det vill säga listan på möjliga värden — "anmäld", "betald", "inställd" och så vidare) och kontrollerar att den exakt matchar den dokumenterade datamodellen. Om de inte stämmer överens uppdaterar vi koden.

Vi aktiverar också den automatiska datakontrollen från Fas 1 i alla läsfunktioner. Det betyder att appen från och med nu kommer att meckra direkt om Airtable någon gång returnerar data som ser konstig ut, istället för att tyst visa felaktig information.

**Varför nu?** Innan vi börjar bygga UI-vyerna i Fas 3 vill vi vara säkra på att alla datafält i appen matchar exakt det som finns i Airtable. Förebyggande arbete som sparar tid senare.

**Fasen är klar när:**

- Alla statusvärden i koden matchar datamodellen
- Automatisk datakontroll aktiverad i alla läsfunktioner
- Allt verifieras automatiskt med tester

---

## 7. Det här bygger vi sedan

Faserna nedan är planerade men inte påbörjade. Den exakta innebörden kan finjusteras när vi närmar oss respektive fas, men huvudriktningen är låst.

### Fas 3: Byggklossar

<!-- markdownlint-disable-next-line MD036 -->
*2 arbetspass · ✅ klar 11 juni 2026 (Sessions 14–15)*

**Så gick det:** Alla sex byggklossarna blev klara på ETT pass i stället för planerade två. Under tillgänglighetstesterna (Fas 3.5) hittade vi och rättade två färgkontrast-problem — ljusgrå text som var för svag mot vit bakgrund för att alla ska kunna läsa den — och förenklade hur felmeddelanden läses upp av skärmläsare, efter att Marcus själv lyssnade igenom appen med skärmläsaren VoiceOver och hörde att samma felmeddelande lästes upp dubbelt. Nu läses det upp en gång, på det sätt som hjälpmedlen stödjer bäst.

**Vad händer?**

Vi bygger appens **bas-komponenter** — knapparna, fälten, dialogrutorna och listorna som varje vy sedan består av. Tänk på det som att tillverka legobitarna innan vi bygger huset.

Sex byggklossar:

- **Knapp** — primär (guld, för viktiga åtgärder), sekundär (mer dämpad), och varning (för "ta bort"-knappar och liknande).
- **Inmatningsfält** — för text, email, lösenord.
- **Listval** — dropdown-menyer.
- **Meddelanderuta** — för fel, varningar, bekräftelser.
- **Modalfönster** — fönster som dyker upp ovanpå sidan när vi behöver din uppmärksamhet (till exempel "Är du säker att du vill avboka?").
- **Dialog** — som modal men för längre interaktioner.

Allt byggs ovanpå [React Aria](https://react-spectrum.adobe.com/react-aria/) — ett bibliotek från Adobe som ger gratis, världsledande tillgänglighet till varje knapp och fält. Tangentbord, skärmläsare, fokuseringsringar, alla minimitider och pixelmått som webbläsare och hjälpmedel kräver — sköts automatiskt.

**Vad du märker:** Inget direkt — men när vi sedan bygger Fas 5 och 6 hänger vi bara dessa byggklossar på plats istället för att bygga dem från grunden varje gång.

### Fas 3.5: Tillgänglighetstest *(ny i v3)*

<!-- markdownlint-disable-next-line MD036 -->
*1 arbetspass · ✅ klar 11 juni 2026 (Session 15)*

**Så gick det:** Allt levererades på ett pass, precis som planerat. De automatiska testerna är igång och körs nu vid varje kodändring — vi bevisade till och med att vakten fungerar genom att medvetet smyga in ett tillgänglighetsfel och se bygget stoppas, precis som det ska. Testerna hittade dessutom ett riktigt kontrastfel som rättades direkt. De fem mall-mönstren är byggda, dokumenterade och testade, och tillgänglighetsgrinden inför Fas 6 är passerad och dokumenterad.

**Vad händer?**

Det här är en specialfas som tillkom efter att vi noggrant gick igenom vad det krävs för att appen ska klara EU:s tillgänglighetsdirektiv (EAA). Det visade sig att vi behöver:

- **Automatiska tillgänglighetstester** — verktyget [axe-core](https://github.com/dequelabs/axe-core) körs på varje sida och rapporterar om något inte uppfyller WCAG 2.2 AA, internationella standarden för webbtillgänglighet. Dessa tester körs automatiskt vid varje ändring av koden och stoppar bygget om något bryts.

- **Mönsterbibliotek** — fem dokumenterade mall-mönster för komplexa interaktioner (modaler, listval, fällbara sektioner, menyer, sökfält med autoslutförande). Varje mönster har kodexempel + acceptanskriterier + testmall, så att de återanvänds konsekvent i Fas 6.

- **Tillgänglighetsgrind före Fas 6** — innan vi börjar bygga vyerna i Fas 6 ska tillgänglighetsbasen vara godkänd. Annars ärver alla vyer eventuella problem.

**Vad du märker:** Inget direkt. Men appen kommer att fungera för alla — tangentbordsanvändare, skärmläsaranvändare, personer som behöver hög kontrast eller minskad rörelse. Och Miranon Media slipper böter (upp till 100 000 EUR) för EAA-brott.

### Fas 5: Skalet — det du ser först

<!-- markdownlint-disable-next-line MD036 -->
*1 arbetspass · ✅ klar 12 juni 2026 (Session 16)*

**Så gick det:** Klart på ett pass, precis som planerat. Appen har nu sitt skal: fyra flikar längst ner, ett sidhuvud, och en "Hoppa till innehåll"-länk för den som navigerar med tangentbord. Skärmläsare får sidans namn uppläst vid varje sidbyte, och hela skalet klarade tillgänglighetstesterna utan en enda anmärkning. Appen går nu att installera på telefonens hemskärm som en riktig app, och öppnar du den utan internet visas den ändå — med en liten banner som berättar att du är offline och ser senast hämtade data. Går något sönder i en del av appen visas ett vänligt felmeddelande bara där; resten fortsätter fungera. Marcus provlyssnade själv med skärmläsaren VoiceOver, kontrollerade att appen går att installera och godkände ikonerna — appikonen justerades i ett par omgångar så att logotypen håller sig säkert innanför den runda ytan, och webbläsarflikens ikon är nu den runda med vit bakgrund, samma som på miranon.se. Två små skillnader mot planen nedan: flikarna är än så länge text utan ikoner, och offline-bannern visar texten "Du är offline — visar senast hämtade data" (tidsstämpeln kommer när det finns riktig data att stämpla).

> **Hopp i numreringen från 3.5 till 5:** Den ursprungliga Fas 4 (DataTable) togs bort när vi insåg att listor räcker. Numreringen lämnades orörd för att undvika förvirring i arkivet.

**Vad händer?**

Nu bygger vi det som omger allt — appens *skal*.

- **Flikraden längst ner** — fyra flikar (Hem, Event, Personer, Mer) med ikoner. Den aktiva fliken markeras tydligt, precis som i Försäkringskassans app som inspirerar mycket av vår design.

- **Sidhuvud** — en enkel rubrik ("Hem", "Event"...) som visar var du befinner dig.

- **"Hoppa till innehåll"-länk** — en osynlig länk som blir synlig när någon trycker Tab. Den låter tangentbordsanvändare hoppa förbi navigeringen direkt till sidans innehåll. En tillgänglighetsfunktion som de flesta aldrig märker — men som gör enorm skillnad för de som behöver den.

- **Felgränser** — om en del av sidan kraschar (till exempel om nätverket är nere) visas ett vänligt meddelande *bara på den delen*. Resten av appen fortsätter fungera. Det kallas *error boundaries* och förhindrar att ett litet problem slår ner hela appen.

- **Offline-stöd** — om du öppnar appen utan internet (till exempel på en eventplats med dålig wifi) visas den senaste versionen av datan istället för en tom skärm. En liten text säger "Senast uppdaterad: 08:12" så att du vet att datan kan vara lite gammal. Det möjliggörs av en *service worker* — ett litet program som körs i bakgrunden och sparar en kopia av appen och dess data på din enhet.

> **Notering om förenkling.** En tidigare planversion innehöll fler "polish"-funktioner i Fas 5: mjuka övergångar mellan vyer (View Transitions), pre-laddning av sidor du sannolikt klickar på (Speculation Rules), och avancerad prestandamätning (web-vitals). Vi flyttade alla dessa till Fas 7 (Slutbesiktning) eftersom de blir meningsfulla först när det finns flera vyer att glida mellan och en publicerad app att mäta. Beslutet är dokumenterat i ett separat arkitekturdokument (ADR-018) så att framtida läsare ser att Fas 5 *valde* förenkling, inte glömde funktionerna.

**Vad du märker:** **Nu ser appen ut som en riktig app.** Fyra flikar, tydligt sidhuvud, snabb navigering. Om internet är borta fungerar det ändå.

### Fas 5.5: Första riktiga interaktionen *(ny i v3)*

<!-- markdownlint-disable-next-line MD036 -->
*2 arbetspass · ✅ klar 17 juni 2026 (Sessions 18/19 + 22)*

**Så gick det:** Klart sedan Session 22. Nu kan du för första gången göra något i appen som ändrar dina riktiga uppgifter: markera att en anmälningsavgift är betald. Du klickar på en knapp vid anmälan och ändringen syns direkt — ingen väntan. Går något fel ångrar appen ändringen automatiskt och visar ett tydligt meddelande. Bakom kulisserna byggde vi också en separat övningsmiljö, en kopia av systemet där vi kan prova förändringar utan att röra dina skarpa uppgifter — så att allt vi bygger härnäst kan testas i trygghet först.

**Vad händer?**

Det här är en viktig pedagogisk fas — den första gången vi *ändrar* data från appen istället för att bara visa den.

Vi bygger en minimal Event-detaljvy med en flik för "Betalning". I den listas alla anmälda till eventet, och bredvid varje namn finns en knapp: "Markera som betald". Klickar du på den ändras statusen direkt till betald — *innan* servern hunnit svara. Om servern sedan svarar att det inte gick (av någon anledning) rullas ändringen tillbaka. Det här mönstret kallas *optimistisk uppdatering* och är vad som gör moderna appar känns omedelbara.

Varför just "markera som betald" och inte något annat? Tre skäl:

1. Det är en av de allra vanligaste sakerna du gör.
2. Det kräver ingen ny serverfunktion — vi använder den befintliga.
3. Den ändrar bara ett enda fält (Betald: ja/nej), vilket är pedagogiskt rent.

Vi bygger också tre automatiserade tester som bevisar att servern blockerar otillåtna förändringar (till exempel försök att ändra fält som inte borde gå att ändra via just den här knappen) och tillåter den korrekta.

**Vad du märker:** Du kan markera anmälningar som betalda. Det är inte hela betalningsfliken (det kommer i Fas 6) — bara mekanismen. Men den här fasen är mall för alla framtida ändringar i appen.

### Fas 6: Alla rum — Hem, Event, Personer, Mer

*3,5 arbetspass · uppdelat i fem delar* *(ny i v3 — uppdelningen)*

**Vad händer?**

Nu bygger vi själva innehållet i de fyra flikarna. I tidigare planversioner var det ett enda stort bygge, men vi har delat upp det i fem mindre delsteg som körs i en specifik ordning. Ordningen följer en princip som kallas *strangler-fig* (efter strypfikussynamn) — vi bygger den nya funktionaliteten parallellt med den gamla och låter den gradvis ta över. Det minimerar risk och låter oss byta databas senare utan att appen påverkas.

#### Fas 6a: Personer (0,75 pass)

Personlistan med sökning, person-detaljvyn med hela kurshistoriken, leads och kontaktuppgifter. Här bygger vi också serverfunktionen `fetchPerson` som hämtar person-data säkert.

#### Fas 6b: Event (0,75 pass)

Event-listan med kommande och tidigare event, event-detaljvyn med deltagarlista och närvarohantering. Vi bygger serverfunktionerna `fetchEvent` (hämta ett event) och `fetchAttendance` (hämta närvaro).

#### Fas 6c: Anmälningar och väntelista (1 pass)

Det här är den känsligaste delen av systemet — själva anmälningsflödet. Vi bygger `createRegistration` (skapa ny anmälan) och `fetchWaitlist` (hämta väntelistan), och vi skriver ett särskilt arkitekturdokument om hur dubbelanmälningar ska hanteras (om någon klickar två gånger får man inte två anmälningar).

#### Fas 6d: Hem-sidans överblick (0,5 pass)

Det här är den första sidan du ser efter inloggning. "Hej Lotta" + det viktigaste just nu — nya anmälningar, nästa event, obetalda. För att data ska vara aktuell hämtas den om automatiskt var 60:e sekund, och du kan dra ner uppifrån för att uppdatera direkt.

#### Fas 6e: Mer-fliken (0,5 pass — kan justeras)

Leads, planera nytt event, skicka mail, inställningar, logga ut. Den här fliken har minst tryck och minst risk, så vi bygger den sist. Vissa av dess funktioner (som mail-utskick) kan eventuellt skjutas till senare beroende på prioritet.

**Vad du märker:** **Appen är klar att använda.** Du kan göra allt du gör idag i den gamla appen — och en del till. Allt fungerar på telefon, surfplatta och dator.

### Fas 6.5: "Vad har hänt?" — automatisk historik

<!-- markdownlint-disable-next-line MD036 -->
*1 arbetspass*

**Vad händer?**

Vi bygger ett system som automatiskt sparar allt du gör i appen: betalningar du markerat, påminnelser du skickat, närvaro du fört, event du skapat.

Det är inte övervakning — det är ett bevis på att systemet fungerar. Du kan öppna historiken och se "Igår markerade jag 5 betalningar och skickade 2 påminnelser." Om du undrar "Skickade jag påminnelsen till Anna?" behöver du inte gissa — du tittar i historiken.

Historiken sparas i 12 månader och hanteras enligt EU:s dataskyddsregler (GDPR). Loggformatet följer en internationell standard som heter [xAPI](https://xapi.com/) — det betyder att samma logg-data kan återanvändas i Passionslyftet utan ombyggnad.

**Vad du märker:** En ny sektion under Mer-fliken där du kan se din historik. Allt du gjort, kronologiskt, sökbart.

### Fas 7: Slutbesiktning

<!-- markdownlint-disable-next-line MD036 -->
*3 arbetspass*

**Vad händer?**

Appen fungerar sedan Fas 6. Nu granskar vi allt — som en slutbesiktning av ett husbygge. Vi testar under sämre förhållanden, mäter hastighet, granskar säkerhet och verifierar att appen fungerar för alla.

- **Säkerhet i webbläsaren** — vi aktiverar regler ([CSP — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) och [Trusted Types](https://web.dev/articles/trusted-types)) som berättar för webbläsaren exakt vad appen får och inte får göra. Om någon försöker injicera skadlig kod blockeras det. Vi granskar också alla tredjepartsverktyg vi använder mot kända säkerhetsproblem.

- **Hastighet — uppmätt på riktiga enheter.** Vi aktiverar mätning av tre nyckeltal som branschen kallar [Core Web Vitals](https://web.dev/articles/vitals): hur snabbt huvudinnehållet visas, hur snabbt appen reagerar på din första klick, och hur stabilt sidan laddar (att inget hoppar omkring). Mätningen sker på din faktiska enhet, inte på utvecklardatorn — så vi vet hur det känns för dig.

- **Mjuka övergångar** *(flyttat hit från Fas 5)* — när du klickar på ett event i listan och detaljsidan öppnas sker övergången mjukt. Kortet i listan "blir" detaljsidan. Det hjälper hjärnan att förstå sambandet mellan de två vyerna. Tekniken kallas [View Transitions](https://developer.chrome.com/docs/web-platform/view-transitions) och är relativt ny i webbläsare.

- **Pre-laddning** *(flyttat hit från Fas 5)* — om du håller fingret över "Se alla event" börjar appen hämta listan *innan du trycker*. Det gör att sidan laddar ögonblickligen.

- **Tillgänglighet — manuell kontroll.** En människa testar appen med skärmläsare. Automatiska verktyg fångar bara 30–40% av tillgänglighetsproblem — resten kräver mänsklig bedömning.

- **Stresstester.** Vi testar vad som händer när saker går fel: nätverket försvinner, servern svarar långsamt, data saknas. Appen ska aldrig visa en tom vit skärm.

- **Publicering.** Vi sätter upp ett system som automatiskt publicerar nya versioner av appen till webben (på [Vercel](https://vercel.com/) — en tjänst som gör webbappar tillgängliga via en webbadress).

**Vad du märker:** **Appen publiceras.** Du kan öppna den från vilken enhet som helst, dela länkar med Roger, och vara säker på att alla kvalitetskrav är uppfyllda.

### Fas 8: Framtid

<!-- markdownlint-disable-next-line MD036 -->
*Storlek bestäms när vi kommer dit*

**Vad händer?**

Det här är saker vi medvetet skjutit till framtiden. De är värdefulla men inte nödvändiga för en första lansering, och de kräver att appen är publicerad och i drift först (för att vi ska veta vilka som behövs mest).

- **Offline-kö för ändringar** ([Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)) — om du markerar en betalning utan internet ska den sparas och skickas in automatiskt när nätet kommer tillbaka. Idag visas det som ett fel.

- **Inloggning utan lösenord** ([Passkeys](https://www.passkeys.com/)) — i stället för email + lösenord kan du logga in med fingeravtryck eller ansiktsigenkänning. Säkrare *och* enklare. WebAuthn-tekniken är nu mainstream.

- **Push-notiser** — du kan få ett pling när en ny anmälning kommer in, istället för att behöva titta i appen.

Vilken av dessa som byggs först bestäms när Fas 8 aktualiseras — sannolikt baserat på vad du och Roger faktiskt saknar i daglig användning.

---

## 8. Parallellspår: städning av databasen

### Fas B: Airtable-hardening *(ny i v3)*

<!-- markdownlint-disable-next-line MD036 -->
*Storlek bestäms av Roger och Lotta · pågår löpande*

**Vad händer?**

Det här är **inte ett kodbygge** — det är arbete som ni två (Roger + Lotta) gör direkt i Airtable parallellt med React-bygget. Det är en städning som har växt fram över ett par års användning.

Konkret innehåller det:

- **Drift-rensning.** Fält som inte används längre, vyer som blivit bortglömda, automationer som duplicerar varandra. Allt sådant gås igenom.

- **Schema-kontrakt.** Vi säkerställer att Airtable-fältens namn och typer exakt matchar det som dokumenterats i `data-model.md` (källan om datamodellen). När det inte stämmer är det Airtable som rättas, inte dokumentet.

- **Genomgång av automationer.** Airtable kör 11 stycken automationer i bakgrunden (anmälningskedjan A1–A11). Vi går igenom varje en, dokumenterar vad den gör, och rensar de som blivit redundanta.

**Två synk-punkter mot React-bygget:**

- **Innan Fas 6c (anmälningar)** — alla schemaändringar som påverkar Anmälningar-tabellen måste vara på plats, så att React-bygget kan koppla mot rätt fält.
- **Innan Fas E (databasbyte)** — Airtable måste vara städat innan vi migrerar bort från det. Annars migrerar vi smutsen med oss.

**Vad du märker:** Direkt i Airtable, lite snabbare och tydligare för dig och Roger. För Lottas dagliga arbete inget — utom att det blir mindre brus i menyer och vyer.

---

## 9. Senare: byte av databas

### Fas E: Supabase-migration *(ny i v3 — DEFER)*

<!-- markdownlint-disable-next-line MD036 -->
*Långt fram · ingen tidsuppskattning ännu*

**Vad händer?**

På sikt vill vi byta databas från Airtable till [Supabase](https://supabase.com/) (samma företag som hanterar inloggning idag). Skälen är tekniska — Supabase är snabbare på stora datamängder, har bättre stöd för komplexa rapporter, och tillåter live-uppdateringar (om Roger ändrar något ser Lotta det direkt utan att ladda om).

Bytet är planerat sist av en anledning: tack vare adapter-mönstret från Fas 1 är 90 % av appen redan förberedd. Det är bara *adaptern* (universalladdaren från Fas 1-metaforen) som behöver bytas. Resten av appen vet inte ens att databasen byttes.

Migrationen sker i samma ordning som Fas 6 byggdes: Personer först, sedan Event, sedan Anmälningar, sist Hem-aggregeringen. Under en övergångsperiod körs båda databaserna parallellt så vi kan jämföra och vara säkra på att ingen data tappas.

**Vad du märker:** Snabbare app, live-uppdateringar mellan dig och Roger, bättre rapporter. Men samma utseende, samma flöden — du ska inte behöva lära om något.

> **När?** Inte bestämt. Tidigast efter Fas 7 (publicering) och Fas B (Airtable-städning). Sannolikt under hösten 2026 eller senare.

---

## 10. Hur vi säkerställer kvalitet

Vi mäter kvalitet i tre dimensioner och siktar på **11/10** — alltså en överprestation över branschstandarden — i alla tre.

| Dimension | Vad det betyder |
|-----------|-----------------|
| **Datakvalitet** | Datan är korrekt, fullständig, motsägelsefri och spårbar. Inga "gissningar". |
| **Designkvalitet** | Appen är intuitiv, tillgänglig för alla, känns omedelbar. Den löser dina problem utan att lägga på nya. |
| **Kodkvalitet** | Koden är ren, testad, säker och underhållbar. En ny utvecklare kan förstå och bidra utan friktion. |

**Tre kvalitetsgrindar passeras innan publicering:**

1. **Funktionsgrind** — varje fas har en checklista som ska bockas av innan fasen är klar. Inget hoppar över. Ingen "vi fixar det sen".

2. **Tillgänglighetsgrind** — appen testas både automatiskt (axe-core, WCAG 2.2 AA) och manuellt (med skärmläsare). EU:s tillgänglighetsdirektiv är minimum, inte ambition.

3. **Slutbesiktning** — Fas 7 är en hel besiktningsfas där säkerhet, hastighet, och beteende under stress prövas innan appen släpps.

---

## 11. Verktygslådan

Det här är de externa verktyg och tjänster appen står på. Du behöver inte lära dig något om dem — men de är listade här om du undrar varför vi nämner ett namn någonstans.

| Verktyg | Roll |
|---------|------|
| [React 19](https://react.dev/) | Världens mest använda bibliotek för att bygga webbappar. |
| [Vite](https://vite.dev/) | Det som bygger ihop koden snabbt under utveckling. |
| [TypeScript](https://www.typescriptlang.org/) | En striktare version av JavaScript som fångar fel innan koden körs. |
| [TanStack Router](https://tanstack.com/router) | Vägvalsystem (Fas 2). |
| [TanStack Query](https://tanstack.com/query/latest) | Hanterar data från servern (Fas 6). |
| [TanStack Table](https://tanstack.com/table/latest) | Tabell-bygge om vi behöver det (Fas 7 — annars eliminerat). |
| [React Aria](https://react-spectrum.adobe.com/react-aria/) | Tillgänglighet för knappar och fält (Fas 3). |
| [Tailwind v4](https://tailwindcss.com/) | Stylingsystem. |
| [Biome](https://biomejs.dev/) | Kvalitetskontroll och formatering av kod. |
| [Zod](https://zod.dev/) | Datakontroll vid systemgränser. |
| [Airtable](https://airtable.com/) | Databasen idag (Fas 0–7). |
| [Supabase Auth](https://supabase.com/auth) | Inloggningssystem. |
| [Supabase Edge Functions](https://supabase.com/edge-functions) | Säkerhetsvakten mellan app och Airtable. |
| [Workbox](https://web.dev/workbox/) | Offline-stöd (Fas 5). |
| [Sentry](https://sentry.io/) | Felövervakning (Fas A — redan i drift). |
| [Playwright](https://playwright.dev/) | Automatiska tester. |
| [GitHub](https://github.com/) | Lagrar all kod och historik. |
| [Vercel](https://vercel.com/) | Publicerar appen på webben (Fas 7). |

---

## 12. Ordlista A–Ö

> **Bonus-lista.** Alla begrepp förklaras redan i texten ovan första gången de dyker upp. Listan finns om du vill slå upp något du stötte på i ett annat sammanhang.

| Begrepp | Förklaring |
|---------|------------|
| **Adapter** | Mellanlager mellan app och databas. Som en universalladdare. |
| **API** | Sätt för program att prata med varandra. |
| **Authentication / Auth** | Inloggning och kontroll av identitet. |
| **Cache** | Sparad kopia av data som kan visas direkt utan att hämtas igen. |
| **CSP** | Content Security Policy — webbläsar-regel för vad appen får göra. Skyddar mot kodinjektion. |
| **Datamodell** | Beskrivning av vilka typer av information som finns (Event, Person, Anmälan...) och hur de hänger ihop. |
| **DoD** (Definition of Done) | Checklistan som säger när en fas är klar. |
| **Edge Function** | Serverfunktion som körs nära användaren för snabb respons. Vår säkerhetsvakt mellan app och Airtable. |
| **Error boundary** | Felgräns. Förhindrar att ett fel i en del av appen kraschar hela appen. |
| **GDPR** | EU:s dataskyddsförordning. |
| **HTTPS** | Krypterad kommunikation. Hänglåset i adressfältet. |
| **Komponent** | Avgränsad del av appen — en knapp, en lista, ett kort. |
| **Lättläst byggplan** | Det här dokumentet. |
| **Offline** | När enheten inte har internet. |
| **Optimistisk uppdatering** | Att visa en ändring direkt innan servern bekräftat den. Gör appen känns omedelbar. |
| **Passkey** | Inloggning via fingeravtryck eller ansiktsigenkänning, utan lösenord. |
| **Performance** | Hur snabbt appen laddar och svarar. |
| **Repo / Repository** | Projektmapp med all kod och historik, lagrad på GitHub. |
| **Service worker** | Litet bakgrundsprogram i webbläsaren som hanterar offline-stöd och cachning. |
| **Skeleton** (skelett-laddning) | Grå platshållare som visas medan riktig data laddas. |
| **Strangler-fig** | Migrationsmönster där ny funktionalitet gradvis ersätter gammal istället för en stor omkoppling. |
| **Tillgänglighet** | Att appen fungerar för alla — oavsett funktionsnedsättning. WCAG 2.2 AA är vår nivå. |
| **Token** | Namngivet designvärde. "Primärfärgen = guld." |
| **URL-state** | Information i webbadressen (filter, söktermer) som överlever omladdning. |
| **WCAG** | Web Content Accessibility Guidelines — internationell standard för webbtillgänglighet. |
| **xAPI** | Internationell standard för aktivitetsloggar. Används i Fas 6.5. |
| **Zod** | Datakontroll-verktyget som granskar att data ser ut som vi förväntar oss. |

---

## 13. Versionshistorik

| Version | Datum | Ändring |
|---------|-------|---------|
| **v3** | **2026-05-09** (initial), **2026-05-13** (Fas 2 KLAR) | **Aktuell.** Speglar byggplan-revisionen från maj 2026 (P0–P3a). Lagt till: Fas A (säkerhetsvakten), Fas 2.5 (dubbelkoll på datan), Fas 3.5 (tillgänglighetstest), Fas 5.5 (första riktiga interaktionen), Fas 6 uppdelad i 6a–6e (strangler-fig), Fas 8 (framtid), Fas B (Airtable-städning som parallellspår), Fas E (databasbyte). Fas 5 förenklad — fyra polish-funktioner flyttade till Fas 7. Skriven i du-form. Senast uppdaterad-stämpel + status-rad i header. **Uppdaterad 2026-05-13:** Fas 2 — Routing + Auth markerad KLAR efter Sessions 4 + 5 + 5b. Defense-in-depth tre-skikt-arkitektur levererad. Fas 2.5 (schema-kontrakt-sync) flyttad till "Det här bygger vi nu". Status-rad och "Senast uppdaterad"-stämpel uppdaterade per ADR-025 levande dokument-disciplin. **Uppdaterad 2026-06-10:** Fas 2.5 — Dubbelkoll på datan markerad KLAR efter Session 13 (1 pass, estimat hållet). "Så gick det"-stycke tillagt. Fas-tabellen rättad: Fas 2-raden stod kvar som "🟡 Nästa" sedan 2026-05-13 (drift, nu ✅ Klar) och Fas 3 är nu 🟡 Nästa. **Uppdaterad 2026-06-11:** Fas 3 (Byggklossar) + Fas 3.5 (Tillgänglighetstest) markerade KLARA efter Sessions 14–15 — byggklossarna på 1 pass i stället för planerade 2. "Så gick det"-stycken tillagda för båda. Fas-tabell + status-rad uppdaterade (Fas 5 är nu 🟡 Nästa). Kvarlämnad övergångstext under en dubblerad "Fas 3: UI-primitiver"-rubrik i sektion 7 städad (rest från 2026-05-13-flytten). **Uppdaterad 2026-06-12:** Fas 5 (Skalet) markerad KLAR efter Session 16 (1 pass, estimat hållet). "Så gick det"-stycke tillagt — appen är nu installerbar, fungerar offline och har navigationsskal med fullt godkända tillgänglighetstester. Fas-tabell + status-rad uppdaterade (Fas 5.5 är nu 🟡 Nästa). **Uppdaterad 2026-06-18:** Fas 5.5 (Första riktiga interaktionen — markera betalning) markerad KLAR efter Sessions 18/19 + 22 (2 pass, estimat hållet). "Så gick det"-stycke tillagt — appen kan nu för första gången ändra riktig data (markera anmälningsavgift som betald) med optimistisk uppdatering och automatisk återställning vid fel, plus en separat övningsmiljö för säkra tester. Fas-tabell + status-rad uppdaterade (Fas 6 är nu 🟡 Nästa). Driftfix: doc:et låg ett fas-steg efter byggplan.md sedan 2026-06-12 — Session 22:s sessionsavslut uppdaterade inte detta dokument (ADR-025 levande dokument-disciplin). |
| v2 | 2026-04-13 | Tonomställning från "om Lotta" till "till dig". Strukturmedling. **Frusen** efter v3 — beskrev planen innan byggplan-revisionen. |
| v1 | 2026-04-13 | Första versionen. Skriven om Lotta i tredje person. **[Arkiverad](../archive/BYGGPLAN-LÄTTLÄST-v1-2026-04-13.md)** 2026-05-06 i Pre-Fas-2-städningen. |

---

*Baserat på styrande projektdokument: [`docs/byggplan.md`](../byggplan.md) (alla 13 fas-prompter), [`docs/decisions/`](../decisions/) (24 ADR:er), [`docs/specs/`](../specs/) (14 stödspecs), [`docs/reference/data-model.md`](../reference/data-model.md), [`docs/reference/hur-systemet-funkar.md`](../reference/hur-systemet-funkar.md). Sessions-trail i [`tasks/sessions/archive/`](../../tasks/sessions/archive/).*

*Detta dokument uppdateras vid sessionsavslut för varje ny fas — se "Senast uppdaterad" och status-raden i headern.*
