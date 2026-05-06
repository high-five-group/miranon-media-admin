# Miranon Media Admin — Byggplan

*Vad vi bygger, varför och vad det innebär för dig.*

> **Till dig som läser detta:** Det här dokumentet beskriver hela planen för Miranon Medias nya digitala verktyg. Det är skrivet så att du ska förstå allt — oavsett teknisk bakgrund. Första gången ett tekniskt begrepp dyker upp förklaras det direkt i texten. Du behöver aldrig lämna det stycke du läser för att förstå det.

---

## Innehåll

1. [Vad bygger vi?](#1-vad-bygger-vi)
2. [Varför bygger vi om?](#2-varför-bygger-vi-om)
3. [Hur lång tid tar det?](#3-hur-lång-tid-tar-det)
4. [Tidslinjen — alla steg på ett ställe](#4-tidslinjen--alla-steg-på-ett-ställe)
5. [Fas 0–3: Förberedelserna under huven](#fas-03-förberedelserna-under-huven)
6. [Fas 5: Skalet — det du ser först](#fas-5-skalet--det-du-ser-först)
7. [Fas 6: Alla rum — Hem, Event, Personer, Mer](#fas-6-alla-rum--hem-event-personer-mer)
8. [Fas 6.5: "Vad har hänt?" — automatisk historik](#fas-65-vad-har-hänt--automatisk-historik)
9. [Fas 7: Slutbesiktning](#fas-7-slutbesiktning)
10. [Fas 8: Framtiden](#fas-8-framtiden)
11. [Hur vi säkerställer kvalitet](#hur-vi-säkerställer-kvalitet)
12. [Verktygslådan](#verktygslådan)
13. [Ordlista A–Ö](#ordlista-aö)

---

## 1. Vad bygger vi?

Vi bygger **ditt arbetsverktyg**. En app som samlar allt du behöver för att hantera Miranon Medias event, anmälningar, betalningar, deltagare och kommunikation — på ett ställe.

Du öppnar appen i en webbläsare (Chrome, Safari eller liknande) på dator, surfplatta eller telefon. Det är ingen app du laddar ner — den lever på en webbadress som du bokmärker.

**Appen har fyra flikar:**

| Flik | Vad du hittar |
|------|--------------|
| **Hem** | Din överblick. Nya anmälningar, nästa event, obetalda. Du ser direkt hur läget ser ut. |
| **Event** | Alla event i en lista. Klicka på ett för att se anmälda, betalningar och föra närvaro. |
| **Personer** | Sök bland alla som haft kontakt med Miranon Media. Se en persons hela historik. |
| **Mer** | Intresserade personer, planera nytt event, skicka mail, inställningar, logga ut. |

> 📸 *Här kommer en skärmbild av appen att läggas in.*

---

## 2. Varför bygger vi om?

Vi har redan byggt en fungerande version av appen. Den fungerar — men nu bygger vi om den med bättre verktyg.

**Tänk på det som att byta motor i en bil.** Bilen ser likadan ut utifrån. Du märker ingen skillnad i utseendet. Men under huven får vi en motor som är lättare att underhålla, har fler reservdelar tillgängliga och är bättre förberedd för framtiden.

**Tre konkreta fördelar:**

1. **Snabbare att bygga vidare.** Saker vi byggde för hand (tusentals rader kod) finns redan färdiga och testade av andra utvecklare i det nya systemet. Det betyder att nya funktioner kan läggas till snabbare.

2. **Enklare att få hjälp.** Det nya systemet ([React](https://react.dev/)) är världens mest använda verktyg för att bygga webbappar. Det gör det lättare att hitta kunskap och stöd.

3. **Bättre förberett för framtiden.** Fingeravtrycksinloggning, push-notiser, offline-stöd — allt detta är enklare att bygga med de nya verktygen.

**Vanliga frågor:**

*Kostar det mer?*
Nej. Ombyggnaden görs inom samma arbetsprocess. Den tid vi lägger på att bygga om hade annars lagts på att bygga vidare med de gamla verktygen — och då hade det tagit längre tid att nå samma resultat.

*Förlorar vi något?*
Nej. All data (event, personer, anmälningar) ligger kvar i [Airtable](https://airtable.com/) och rör sig inte. Serverfunktionerna ligger kvar i [Supabase](https://supabase.com/). Vi byter bara det du ser och interagerar med.

*Tar det längre tid?*
Det tar ungefär 15 arbetspass. Det hade tagit minst lika lång tid att bygga klart med de gamla verktygen, och resultatet hade varit svårare att underhålla.

---

## 3. Hur lång tid tar det?

**Ungefär 15 arbetspass**, fördelade på 8 steg.

Marcus bygger appen med hjälp av [Claude](https://claude.ai/) — en AI-assistent som hjälper till att planera och skriva kod. Varje arbetspass är ungefär 2–4 timmar. Inget steg påbörjas förrän det föregående är klart och verifierat.

---

## 4. Tidslinjen — alla steg på ett ställe

| Steg | Namn | Vad det innebär för dig | Arbetspass |
|------|------|------------------------|------------|
| **0–3** | Förberedelser | Inget synligt ännu — grunden byggs | 4,5 |
| **5** | Skalet | Du ser flikarna och kan navigera | 1,5 |
| **6** | Alla rum | **Appen fungerar — med riktig data** | 3,5 |
| **6.5** | Historik | Du kan se vad du gjort | 2 |
| **7** | Slutbesiktning | Allt testas och publiceras | 3 |
| **8** | Framtiden | Fingeravtryck, push-notiser (planerat) | — |
| | **Totalt** | | **~15** |

---

## Fas 0–3: Förberedelserna under huven

*4,5 arbetspass totalt*

> **Dessa fyra steg handlar om allt som sker under huven.** Du märker ingenting av dem i appen — men utan dem kan inget annat byggas. Om du vill hoppa direkt till det som berör dig, gå till [Fas 5: Skalet](#fas-5-skalet--det-du-ser-först).

### Fas 0: Grunden (1 arbetspass)

Det här är som att gjuta husgrunden, dra el och vatten, och sätta upp byggställningen.

Vi skapar ett nytt tomt projekt, installerar alla verktyg och bestämmer appens visuella språk: vilka färger (den varma guldfärgen, koppartoner), vilket typsnitt ([Inter](https://rsms.me/inter/) — ett lättläst typsnitt designat för skärmar) och vilka avstånd som ska användas genomgående. Vi kallar dessa värden för *tokens* — ett token är helt enkelt ett namn för ett designval, till exempel "primärfärgen heter guld". Alla delar av appen refererar till samma tokens, vilket garanterar att allt ser likadant ut överallt.

Vi sätter också upp automatisk kvalitetskontroll (verktyg som kontrollerar koden vid varje sparning — som en stavningskontroll fast för kod), prestandamätning (som mäter hur snabbt appen laddar på din faktiska enhet, inte bara på utvecklardatorn) och säkerhetsregler (som berättar för webbläsaren exakt vad appen får och inte får göra).

**Fasen är klar när** projektet startar utan fel, färgerna och typsnittet laddas korrekt, och alla verktyg fungerar.

### Fas 1: Flytta in det vi redan har (0,5 arbetspass)

Vi kopierar det som redan fungerar från den gamla appen till den nya:

- **Datamodeller** — beskrivningar av vad ett "Event" är, vad en "Person" är, vad en "Anmälan" är. Det är som mallar som bestämmer vilken information som finns. Dessa fungerar identiskt i den nya appen.

- **Kopplingen till Airtable** — koden som hämtar och skickar data till [Airtable](https://airtable.com/), som är databasen där all information om event, personer och anmälningar lagras. Kopplingen fungerar via en *adapter* — ett mellanlager som översätter mellan appen och databasen, ungefär som en universalladdare som funkar med alla telefoner.

- **Serverfunktioner** — de funktioner som körs på [Supabase](https://supabase.com/) och fungerar som en säkerhetsvakt mellan appen och databasen. Appen pratar aldrig direkt med Airtable — den går alltid via denna vakt.

- **Styrande dokument** — planer, designregler och kvalitetskrav. 42 filer med över 9 000 rader text som styr hela bygget.

Vi lägger också till automatisk datakontroll: när appen tar emot information från Airtable kontrolleras att informationen ser ut som förväntat. Om Airtable ändrar sin struktur upptäcker vi det direkt — istället för att appen visar felaktiga siffror utan att någon märker det.

Och om nätverket krånglar försöker appen automatiskt igen — tre gånger, med ökande väntetid.

**Fasen är klar när** all data och alla kopplingar fungerar korrekt i det nya projektet.

### Fas 2: Dörrar och lås (1 arbetspass)

Nu bygger vi appens navigation (hur du tar dig mellan sidor) och inloggning.

Du loggar in med email och lösenord. Inloggningen sparas i en timme, så du slipper logga in varje gång. Om du är på en plats med dålig uppkoppling och redan är inloggad fungerar appen ändå.

En smart detalj: om du filtrerar eventlistan på "kommande" och kopierar webbadressen till Roger, ser Roger exakt samma filtrerade vy. Filtret lever i webbadressen — inte gömt inne i appen. Det betyder också att om du trycker "Tillbaka" i webbläsaren kommer du tillbaka till din filtrerade vy, inte till en tom sida.

Vi sätter upp alla sidor som platshållare (de fylls med innehåll i Fas 6). Alla fyra flikar finns — men de är tomma ännu.

**Fasen är klar när** du kan logga in, se fyra flikar och navigera mellan dem.

### Fas 3: Byggklossar (2 arbetspass)

Nu bygger vi alla de små delarna du interagerar med: knappar, dialogrutor, listor, kort, statusmärken, laddningsindikatorer. Vi kallar dem *komponenter* — det är som LEGO-bitar som kan sättas ihop till större saker.

Varje komponent byggs så att den fungerar för alla:
- Med mus, tangentbord och skärmläsare (ett program som läser upp skärmens innehåll högt för synskadade)
- I hög kontrast (för personer med nedsatt syn)
- Med stora tryckbara ytor (minst 44×44 pixlar — enkla att träffa med fingret)

Det kallas *tillgänglighet* och är inte bara bra att ha — det är lag i EU sedan juni 2025.

Varje komponent testas i tre dimensioner: fungerar den för alla? Följer den designreglerna? Kan den återanvändas i olika sammanhang? Vi har satt ribban till högsta möjliga betyg i alla tre.

**Fasen är klar när** alla byggklossar fungerar korrekt, är testade och har sparade referensbilder.

---

## Fas 5: Skalet — det du ser först

*1,5 arbetspass*

### Vad händer?

Nu bygger vi det som omger allt — appens skal. Det är det första du ser varje gång du öppnar appen.

**Flikraden längst ner** — fyra flikar (Hem, Event, Personer, Mer) med ikoner. Den flik du befinner dig på markeras med en tydlig markering, precis som i Försäkringskassans app.

**En enkel rubrik högst upp** — "Hem", "Event", "Personer" — som visar var du befinner dig.

**Om något krånglar** syns ett vänligt meddelande bara på den del som inte fungerar. Resten av appen fortsätter som vanligt. Om eventlistan inte kan laddas (till exempel vid nätverksproblem) ser du: "Den här delen kunde inte laddas just nu. Försök igen." — men Hem-fliken och Personfliken fungerar fortfarande.

**Om internet är borta** visas den senaste versionen av datan istället för en tom skärm. En liten text säger "Senast uppdaterad: 08:12" så att du vet att informationen kan vara lite gammal. I bakgrunden finns ett litet program (en så kallad *service worker*) som sparar en kopia av appen och dess data på din enhet — så att du alltid har tillgång till det senaste.

**Mjuka övergångar** — när du klickar på ett event i listan och detaljsidan öppnas, sker övergången mjukt. Kortet i listan "blir" detaljsidan. Det hjälper ögat att förstå sambandet mellan de två vyerna.

### Vad du märker

**Appen ser ut som en riktig app.** Fyra flikar, tydlig rubrik, snabb navigering. Om internet försvinner fungerar det ändå. Om något går fel syns ett vänligt meddelande istället för en vit skärm.

> 📸 *Här kommer en skärmbild av flikraden och skalet.*

### Fasen är klar när

- Alla fyra flikar fungerar och visar rätt markering
- Appen ser bra ut på telefon, surfplatta och dator
- Appen visar sparad data utan internet
- Ett kraschande avsnitt visar felmeddelande utan att resten påverkas

---

## Fas 6: Alla rum — Hem, Event, Personer, Mer

*3,5 arbetspass*

Nu fyller vi appen med liv. Alla fyra flikar byggs med riktig data. Det här är steget där appen går från "struktur" till "verktyg".

### Hem — din morgonöverblick

**Situation:** Du öppnar appen med kaffe i handen. Du vill snabbt se hur läget ser ut.

Vad du ser:

- **"Hej Lotta"** — en personlig hälsning.
- **Statustext** — "3 nya anmälningar sedan igår" eller "Inga nya anmälningar — allt är lugnt."
- **1–2 informationskort** — nästa event (namn, datum, hur många som är anmälda) och antal obetalda.
- **En stor knapp** — anpassad efter läget. Finns det obetalda? Då står det "Följ upp obetalda." Annars "Se alla event."
- **Längst ner: ett bevis på att systemet fungerar** — "Senast synkroniserat: 08:14. 234 anmälningar sedan start. 0 tappade." Du behöver inte lita blindt — du kan se att det fungerar.

Om informationen inte kan hämtas (nätverksfel) visas den senaste versionen med en text: "Vi kunde inte hämta anmälningarna just nu. Senaste versionen (från kl 07:52) visas nedan. Vi försöker igen automatiskt." Du står aldrig inför en tom skärm.

> 📸 *Här kommer en skärmbild av Hem-fliken.*

### Event — allt om dina event

**Situation:** Du vill se status på alla event och gå in i ett specifikt.

Vad du ser:

- **En lista med event** — varje event som en rad med namn, datum och hur många som anmält sig. Tryck för att öppna.
- **Filter** — "Kommande", "Tidigare" eller "Alla". Filtret sparas i webbadressen, så om du laddar om sidan eller trycker "Tillbaka" är filtret kvar.
- **Event-detaljsida** — tryck på ett event → all information. Anmälda personer, vem som betalat, närvaro. Du kan växla mellan flikarna "Anmälda", "Betalning" och "Närvaro".

**En smart detalj:** Om du markerar en betalning som "Betald" uppdateras skärmen direkt — innan servern hunnit bekräfta ändringen. Det sker i bakgrunden. Om det mot förmodan misslyckas visas ändringen som ångrad med ett felmeddelande. Resultatet: appen känns snabb. Du väntar aldrig.

> 📸 *Här kommer en skärmbild av Event-listan och en event-detaljsida.*

### Personer — "Vem var det som...?"

**Situation:** Du minns ett förnamn men inte mer.

Vad du ser:

- **Sökfält** — skriv ett namn, en email eller ett telefonnummer. Resultaten dyker upp medan du skriver.
- **Resultatlista** — matchande personer. Tryck för att öppna.
- **Personkort** — all information om en person: kontaktuppgifter, vilka event de deltagit i, betalningshistorik, alla interaktioner med Miranon Media.

Det du sökt på sparas i webbadressen. Om du trycker "Tillbaka" i webbläsaren kommer du tillbaka till dina sökresultat — inte till en tom sida.

> 📸 *Här kommer en skärmbild av personsökningen.*

### Mer — allt annat

Vad du ser:

- **Intresserade** — personer som visat intresse men aldrig deltagit i ett event.
- **Planera event** — skapa ett nytt event.
- **Mail** — skicka bekräftelser, påminnelser och praktisk information.
- **Inställningar** — appens inställningar.
- **Logga ut** — längst ner.

### Hur data hämtas — kort förklarat

All data hämtas smart. Första gången du öppnar eventlistan hämtas den från Airtable. Om du navigerar bort och kommer tillbaka visas den sparade versionen direkt — utan att vänta på nätverket. I bakgrunden hämtas ny data, och om något ändrats uppdateras det automatiskt.

Om du håller fingret över "Se alla event" börjar appen hämta listan *innan du trycker*. Det gör att sidan laddar ögonblickligen.

### Vad du märker

**Appen är klar att använda.** Du kan se nya anmälningar, hantera betalningar, föra närvaro, söka bland personer och skicka mail. Allt med riktig data. Allt snabbt.

### Fasen är klar när

- Alla fyra flikar visar riktig data
- Varje flik fungerar på telefon, surfplatta och dator
- Filter och söktermer överlever omladdning
- Skelettladdning (grå platshållare medan data hämtas), felmeddelanden och tomma tillstånd ("Inga event") fungerar korrekt
- Appen reagerar omedelbart på interaktion

---

## Fas 6.5: "Vad har hänt?" — automatisk historik

*2 arbetspass*

### Vad händer?

Vi bygger ett system som automatiskt sparar allt du gör i appen: betalningar du markerat, påminnelser du skickat, närvaro du fört, event du skapat.

Det är inte övervakning — det är ett bevis på att systemet fungerar. Du kan öppna historiken och se: "Igår markerade du 5 betalningar och skickade 2 påminnelser." Om du undrar "Skickade jag påminnelsen till Anna?" behöver du inte gissa — du tittar i historiken.

Historiken sparas i 12 månader och hanteras enligt EU:s dataskyddsregler (GDPR).

### Vad du märker

En ny sektion i appen där du kan se din historik. Allt du gjort — kronologiskt, tydligt, sökbart.

---

## Fas 7: Slutbesiktning

*3 arbetspass*

### Vad händer?

Appen fungerar sedan Fas 6. Nu granskar vi allt — som en slutbesiktning av ett husbygge. Vi testar under sämre förhållanden, mäter hastighet, granskar säkerhet och verifierar att appen fungerar för alla.

**Säkerhet** — Vi aktiverar regler som berättar för webbläsaren exakt vad appen får göra. Om någon försöker injicera skadlig kod blockeras det. Vi granskar alla tredjepartsverktyg för kända säkerhetsproblem.

**Hastighet** — Vi verifierar att appen laddar och svarar inom de mål vi satt (se [Hur vi säkerställer kvalitet](#hur-vi-säkerställer-kvalitet)). Vi mäter på riktiga enheter, inte bara på utvecklardatorn.

**Tillgänglighet** — En människa testar appen med en skärmläsare (ett program som läser upp allt på skärmen högt). Automatiska verktyg fångar bara 30–40% av problem — resten kräver mänsklig bedömning.

**Stresstester** — Vi går igenom appen som du och markerar varje tvekan, förvirring eller fördröjning. Vi testar också vad som händer när saker går fel: nätverket försvinner, servern svarar långsamt, data saknas. Appen ska aldrig visa en tom skärm.

**Publicering** — Vi sätter upp ett system som automatiskt publicerar appen till webben. Appen publiceras på [Vercel](https://vercel.com/) — en tjänst som gör den tillgänglig via en webbadress.

### Vad du märker

**Appen publiceras.** Du kan öppna den på en riktig webbadress — från din telefon, surfplatta eller dator. Den fungerar snabbt, säkert och tillförlitligt, oavsett uppkoppling.

---

## Fas 8: Framtiden

*Planerad, inte schemalagd*

Dessa funktioner byggs inte nu — men appen är förberedd för dem:

**Fingeravtrycksinloggning** — Du loggar in med Face ID eller fingeravtryck istället för email och lösenord. Inget att komma ihåg. Inloggningssidans design har redan plats för den knappen.

**Push-notiser** — Du får en notis på telefonen: "3 nya anmälningar till Rönninge-eventet." Du behöver inte öppna appen för att veta att något hänt.

**Avancerat offline-stöd** — Du kan göra ändringar (markera betalning, föra närvaro) utan internet. Ändringarna sparas på enheten och synkroniseras automatiskt när uppkopplingen är tillbaka. Perfekt för eventplatser med dåligt wifi.

---

## Hur vi säkerställer kvalitet

### Hastighet — "Hur snabb ska appen vara?"

Vi har satt konkreta mål för hur snabbt appen ska ladda och reagera:

| Vad vi mäter | Mål | Vad det betyder för dig |
|-------------|-----|------------------------|
| Tid till första synliga innehåll | Under 1,5 sekunder | Du ser att något händer — inte en vit skärm |
| Tid till det viktigaste innehållet | Under 2,5 sekunder | Informationskorten, eventlistan — det du faktiskt läser |
| Tid att svara på tryck | Under 200 millisekunder | Varje knapptryck ger omedelbar feedback |
| Visuell stabilitet | Minimal | Inget hoppar runt medan sidan laddas |

Dessa mäts på din faktiska enhet — inte bara på utvecklardatorn. Vi använder [web-vitals](https://web.dev/vitals/) (Googles verktyg) och [Sentry](https://sentry.io/) (som rapporterar fel och prestandaproblem i realtid).

### Säkerhet — "Hur skyddas informationen?"

| Skydd | Vad det innebär |
|-------|----------------|
| Inloggning | Bara du och Roger kan komma åt appen |
| Säkerhetsvakt | Appen pratar aldrig direkt med databasen — allt går via en säker mellanhand |
| Webbläsarregler | Webbläsaren vet exakt vad appen får göra — försök till kodinjicering blockeras |
| Granskningar | Alla tredjepartsverktyg granskas automatiskt för kända problem |
| Kryptering | All kommunikation är krypterad (HTTPS) — ingen kan avlyssna |

### Tillgänglighet — "Fungerar den för alla?"

| Krav | Vad det innebär |
|------|----------------|
| Tangentbord | Allt som kan tryckas kan också nås med Tab + Enter |
| Skärmläsare | All information som syns kan också *höras* |
| Hög kontrast | Appen anpassar sig om du har aktiverat hög kontrast |
| Stora tryckytor | Alla knappar är minst 44×44 pixlar |
| Zooming | Appen fungerar vid 200% zoom utan att något försvinner |
| EU-lag | Appen uppfyller EU:s tillgänglighetsdirektiv (i kraft sedan juni 2025) |

### Fem egenskaper vi eftersträvar

| Egenskap | Vad du upplever |
|----------|----------------|
| **Appen är snabb** | Du trycker på "Se alla event" — listan dyker upp direkt. Den hämtades redan i bakgrunden. |
| **Navigeringen hänger ihop** | Du klickar på ett event i listan — kortet "blir" detaljsidan med en mjuk övergång. Ögat förstår sambandet. |
| **Systemet visar att det fungerar** | "234 anmälningar sedan start. 0 tappade." Du behöver inte lita blindt. |
| **Appen fungerar alltid** | Flygplansläge → senaste informationen visas med en "Senast uppdaterad"-text. Ingen tom skärm. |
| **Appen gissar rätt** | Du rör dig mot "3 obetalda" — sidan är redan hämtad innan du hinner trycka. |

---

## Verktygslådan

> **Du behöver inte förstå dessa verktyg.** De listas här om du är nyfiken på vad som används under huven. Varje verktyg har en länk till sin officiella webbplats.

### Appens grund

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **React** | Byggsystemet för hela appen. Utvecklas av Meta. | [react.dev](https://react.dev/) |
| **TypeScript** | Ett programmeringsspråk som hittar fel innan appen körs. | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | Startar appen under utveckling och paketerar den för publicering. | [vite.dev](https://vite.dev/) |

### Data och kommunikation

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **Airtable** | Databasen där all information lagras. | [airtable.com](https://airtable.com/) |
| **Supabase** | Hanterar inloggning och säker kommunikation med databasen. | [supabase.com](https://supabase.com/) |
| **TanStack Query** | Hämtar data smart: sparar, uppdaterar i bakgrunden, förhämtar. | [tanstack.com/query](https://tanstack.com/query) |
| **Zod** | Kontrollerar att data som kommer utifrån ser ut som förväntat. | [zod.dev](https://zod.dev/) |

### Navigering

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **TanStack Router** | Hanterar navigering mellan sidor. | [tanstack.com/router](https://tanstack.com/router) |
| **nuqs** | Lagrar filter och söktermer i webbadressen. | [nuqs.47ng.com](https://nuqs.47ng.com/) |

### Design och utseende

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **Tailwind CSS** | Fördefinierade stilklasser istället för egen stilkod. | [tailwindcss.com](https://tailwindcss.com/) |
| **React Aria** | Adobes verktyg för tillgängliga komponenter. | [react-spectrum.adobe.com](https://react-spectrum.adobe.com/react-aria/) |
| **Lucide** | Ikonbibliotek. | [lucide.dev](https://lucide.dev/) |
| **Motion** | Animationer och övergångar. | [motion.dev](https://motion.dev/) |
| **Inter** | Typsnittet i hela appen. Designat för skärmar. | [rsms.me/inter](https://rsms.me/inter/) |

### Kvalitet och övervakning

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **Biome** | Automatisk kodkontroll och formatering. | [biomejs.dev](https://biomejs.dev/) |
| **Playwright** | Automatiska skärmbilder som upptäcker oavsiktliga visuella ändringar. | [playwright.dev](https://playwright.dev/) |
| **Sentry** | Övervakar appen i produktion — rapporterar fel och prestandaproblem. | [sentry.io](https://sentry.io/) |
| **web-vitals** | Mäter appens hastighet på riktiga enheter. | [web.dev/vitals](https://web.dev/vitals/) |
| **Workbox** | Offline-stöd. | [developer.chrome.com/docs/workbox](https://developer.chrome.com/docs/workbox/) |

### Lagring och publicering

| Verktyg | Vad det gör | Länk |
|---------|------------|------|
| **GitHub** | Lagrar all kod med fullständig historik. | [github.com](https://github.com/) |
| **Vercel** | Publicerar appen på webben. | [vercel.com](https://vercel.com/) |

---

## Ordlista A–Ö

> **Den här listan är en bonus.** Alla begrepp förklaras redan i texten ovan. Ordlistan finns om du vill slå upp något du stötte på i ett annat sammanhang.

| Begrepp | Förklaring |
|---------|------------|
| **Adapter** | Ett mellanlager som översätter mellan två system. Som en universalladdare. |
| **API** | Ett sätt för program att prata med varandra. |
| **Cache** | En sparad kopia av data som kan visas direkt utan att hämta den igen. |
| **Deploy** | Att publicera appen så att den blir tillgänglig på webben. |
| **Edge Function** | En serverfunktion som körs nära användaren för snabb respons. |
| **Error boundary** | En felgräns som förhindrar att ett fel i en del kraschar hela appen. |
| **GDPR** | EU:s dataskyddsförordning. |
| **HTTPS** | Krypterad kommunikation. Hänglåset i adressfältet. |
| **Komponent** | En avgränsad del av appen — en knapp, en lista, ett kort. |
| **Offline** | Att fungera utan internet. |
| **Optimistisk uppdatering** | Att visa en ändring direkt innan servern bekräftat den. |
| **Passkey** | Inloggning via fingeravtryck eller ansiktsigenkänning. |
| **Performance** | Hur snabbt appen laddar och svarar. |
| **Push-notis** | En avisering på telefonen utan att appen är öppen. |
| **Repository** | En projektmapp med all kod och historik, lagrad på GitHub. |
| **Service worker** | Ett litet bakgrundsprogram som hanterar offline-stöd och cachning. |
| **Skeleton** | Grå platshållare som visas medan riktig data laddas. |
| **Tillgänglighet** | Att appen fungerar för alla — oavsett funktionsnedsättning. |
| **Token** | Ett namngivet designvärde. "Primärfärgen = guld." |
| **URL-state** | Information i webbadressen (filter, söktermer) som överlever omladdning. |

---

*Baserat på projektets styrande dokument: [conversion-plan.md](../archive/conversion-plan-2026-04-14.md), [DESIGN-MANIFESTO.md](docs/specs/DESIGN-MANIFESTO.md), [DESIGN-OPERATING-SYSTEM.md](docs/specs/DESIGN-OPERATING-SYSTEM.md), [DESIGN-SYSTEM-SPEC.md](docs/specs/DESIGN-SYSTEM-SPEC.md), [SECURITY-SPEC.md](docs/specs/SECURITY-SPEC.md), [PERFORMANCE-BUDGET.md](docs/specs/PERFORMANCE-BUDGET.md), [ARIA-UPGRADE.md](docs/specs/ARIA-UPGRADE.md), [gap-analysis.md](docs/logs/gap-analysis.md).*

*Senast uppdaterad: 2026-04-07*
