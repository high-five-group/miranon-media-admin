> **ARKIVERAD 2026-05-06 (Pre-Fas-2-verifiering, K3 åe)**
>
> Denna fil är **superceded** av [`../specs/BYGGPLAN-LÄTTLÄST-v2.md`](../specs/BYGGPLAN-LÄTTLÄST-v2.md).
> v1 bevaras som historisk referens med full git-historik tillgänglig via `git log --follow`.
>
> **Använd v2** för aktuell lättläst byggplan.
> **Detta dokument** används endast för historisk kontext om hur byggplanen formulerades initialt 2026-04-13.
>
> Referens: ADR-021 (docs/-omstrukturering)

---

# Miranon Media Admin — Byggplan

*En komplett guide till vad vi bygger, varför och hur.*
*Skriven så att alla kan förstå — oavsett teknisk bakgrund.*

> **Vem är dokumentet till för?** Roger, Lotta och alla som vill förstå vad som händer med Miranon Medias digitala verktyg. Varje tekniskt begrepp förklaras första gången det dyker upp.

---

## Innehåll

1. [Vad bygger vi?](#1-vad-bygger-vi)
2. [Varför bygger vi om?](#2-varför-bygger-vi-om)
3. [Vem bygger?](#3-vem-bygger)
4. [Hur lång tid tar det?](#4-hur-lång-tid-tar-det)
5. [Tidslinje — alla faser](#5-tidslinje--alla-faser)
6. [Fas 0: Grunden](#fas-0-grunden)
7. [Fas 1: Flytta in det vi redan har](#fas-1-flytta-in-det-vi-redan-har)
8. [Fas 2: Dörrar och lås](#fas-2-dörrar-och-lås)
9. [Fas 3: Byggklossar](#fas-3-byggklossar)
10. [Fas 5: Skalet — det Lotta ser först](#fas-5-skalet--det-lotta-ser-först)
11. [Fas 6: Alla rum — Hem, Event, Personer, Mer](#fas-6-alla-rum--hem-event-personer-mer)
12. [Fas 6.5: Aktivitetsloggen — "Vad har hänt?"](#fas-65-aktivitetsloggen--vad-har-hänt)
13. [Fas 7: Slutbesiktning](#fas-7-slutbesiktning)
14. [Fas 8: Framtiden](#fas-8-framtiden)
15. [Kvalitet och säkerhet](#kvalitet-och-säkerhet)
16. [Verktygslådan — vad vi bygger med](#verktygslådan--vad-vi-bygger-med)
17. [Ordlista A–Ö](#ordlista-aö)

---

## 1. Vad bygger vi?

Miranon Media Admin är **Lottas arbetsverktyg**. Det är en app som samlar allt Lotta behöver för att hantera Miranon Medias event, anmälningar, betalningar, deltagare och kommunikation — på ett ställe, utan papper och block.

Appen öppnas i en webbläsare (som Chrome eller Safari) på dator, surfplatta eller telefon. Den är inte en app man laddar ner från App Store — den lever på en webbadress, precis som en vanlig hemsida, men med funktionalitet som ett skräddarsytt program.

**Fyra flikar — det är hela appen:**

| Flik | Vad Lotta hittar där |
|------|---------------------|
| **Hem** | "Hej Lotta" — en snabb överblick. Nya anmälningar, nästa event, obetalda. Svaret på frågan: "Brinner det?" |
| **Event** | Alla event i en lista. Klicka på ett event för att se anmälda, betalningar och föra närvaro. |
| **Personer** | Sök bland alla som någonsin haft kontakt med Miranon Media. Se en persons hela historik. |
| **Mer** | Leads (intresserade personer), planera nytt event, skicka mail, inställningar, logga ut. |

---

## 2. Varför bygger vi om?

Vi har redan byggt en fungerande version av appen. Den fungerar — men den är byggd med ett verktyg som heter [Vue](https://vuejs.org/) (ett sätt att bygga webbappar). Nu bygger vi om den med ett annat verktyg som heter [React](https://react.dev/).

**Varför byta?**

Tänk på det som att byta motor i en bil. Bilen (appen) ser likadan ut utifrån. Lotta märker ingen skillnad i utseendet. Men under huven får vi:

- **Bättre verktyg.** React har ett större ekosystem — det betyder fler färdiga byggsatser som sparar tid. Saker som vi byggde från grunden i Vue (tusentals rader kod) finns redan färdiga i React-världen, testade av tusentals andra utvecklare.

- **Snabbare utveckling framåt.** Nya funktioner kan byggas snabbare eftersom vi slipper underhålla egna lösningar.

- **Framtidssäkring.** React används av fler utvecklare i världen, vilket gör det lättare att hitta hjälp och kunskap.

**Vad vi INTE gör om:**

- Datan (all information om event, personer, anmälningar) rör vi inte. Den ligger kvar i [Airtable](https://airtable.com/) precis som idag.
- Servern (den dator som hanterar säker kommunikation med Airtable) rör vi inte. Den ligger kvar i [Supabase](https://supabase.com/).
- Designen förenklas faktiskt — vi tar inspiration från [Försäkringskassans app](https://www.forsakringskassan.se/) som är känd för att vara enkel och tillgänglig.

---

## 3. Vem bygger?

Marcus bygger appen med hjälp av AI-verktyg:

- **[Claude](https://claude.ai/)** — en AI-assistent som hjälper till med planering, arkitektur och kodskrivning. Claude finns i två varianter: *Claude Chat* (för planering och diskussion) och *Claude Code* (för att skriva och ändra kod direkt).

Allt arbete sker i **sessioner** — ett arbetspass där Marcus och Claude jobbar tillsammans. Varje session är ungefär 2–4 timmar.

---

## 4. Hur lång tid tar det?

**Ungefär 15 sessioner**, fördelade över 8 faser.

Varje fas har ett tydligt mål. Ingen fas påbörjas förrän föregående fas är klar och verifierad. Det är som att bygga ett hus — man gjuter grunden innan man reser väggarna.

---

## 5. Tidslinje — alla faser

| Fas | Namn | Vad som händer | Sessioner |
|-----|------|----------------|-----------|
| **0** | Grunden | Skapar det nya projektet med alla verktyg | 1 |
| **1** | Flytta in | Kopierar data och logik från gamla appen | 0,5 |
| **2** | Dörrar och lås | Inloggning och sidnavigering | 1 |
| **3** | Byggklossar | Knappar, dialogrutor, listor — allt Lotta trycker på | 2 |
| **5** | Skalet | Det som omger allt — flikraden längst ner | 1,5 |
| **6** | Alla rum | Hem, Event, Personer, Mer — med riktig data | 3,5 |
| **6.5** | Aktivitetslogg | "Vad har hänt?" — automatisk historik | 2 |
| **7** | Slutbesiktning | Tester, säkerhet, kvalitetskontroll | 3 |
| **8** | Framtiden | Fingeravtrycksinloggning, push-notiser (planerat, inte nu) | — |
| | **Totalt** | | **~15** |

> **Varför finns ingen Fas 4?** Fas 4 var ursprungligen planerad för en avancerad tabell-komponent. Den behövs kanske inte — och om den behövs byggs den i Fas 7 istället. Vi bygger bara det som faktiskt behövs.

---

## Fas 0: Grunden

*1 session*

### Vad händer?

Det här är som att gjuta husgrunden, dra el och vatten, och ställa upp byggställningen. Inget synligt för Lotta ännu — men utan detta steg kan inget annat byggas.

Vi skapar ett nytt, tomt projekt och installerar alla verktyg som behövs. Vi bestämmer också appens visuella språk: vilka färger, vilka typsnitt, vilka avstånd som ska användas överallt.

### Vad gör vi konkret?

- **Skapar projektet.** Ett nytt [repository](https://docs.github.com/en/repositories) (en mapp med all kod, lagrad på tjänsten [GitHub](https://github.com/) så att inget kan gå förlorat — ungefär som ett Google Drive för kod, med fullständig versionshistorik).

- **Installerar verktyg.** Alla programbibliotek som appen behöver. Det är som att köpa alla verktyg till ett bygge innan första spiken slås. Se [Verktygslådan](#verktygslådan--vad-vi-bygger-med) för en förklaring av varje verktyg.

- **Bestämmer designsystemet.** Vi definierar appens färgpalett, typsnitt ([Inter](https://rsms.me/inter/) — ett lättläst typsnitt designat för skärmar) och avstånd i något som kallas *tokens*. En token är ett namn för ett designvärde, till exempel: "primärfärgen heter `guld` och har värdet `#D4960A`" (en varm guldfärg). Alla delar av appen använder samma tokens, vilket garanterar att allt ser konsekvent ut.

- **Sätter upp kvalitetskontroll.** Verktyg som automatiskt kontrollerar att koden följer reglerna — innan varje sparning. Det är som en stavningskontroll fast för kod.

- **Sätter upp prestandamätning.** Verktyg som mäter hur snabbt appen laddas och reagerar — inte bara på Marcus dator utan på Lottas faktiska enhet.

- **Sätter upp säkerhetsgrunden.** Regler som berättar för webbläsaren exakt vad appen får och inte får göra. Det skyddar mot en typ av attack där illasinnade webbsidor försöker lura webbläsaren att köra skadlig kod.

### Varför gör vi detta?

Utan en ordentlig grund byggs problem in som är dyra att åtgärda senare. Precis som med ett hus: om grunden är sned märker man det inte förrän väggarna går upp.

### Vad Lotta märker

Ingenting ännu. Appen existerar inte visuellt. Men efter denna fas kan vi bygga allt annat snabbt och säkert.

### Verifiering

Fasen är klar när:
- Projektet startar utan fel
- Alla verktyg fungerar
- Designsystemets färger och typsnitt laddas korrekt
- Kvalitetskontrollen och säkerhetsreglerna är aktiva

---

## Fas 1: Flytta in det vi redan har

*0,5 session*

### Vad händer?

Vi kopierar det som redan fungerar från den gamla appen till den nya. Det handlar om två typer av saker:

1. **Datamodeller** — beskrivningar av vad ett "Event" är, vad en "Person" är, vad en "Anmälan" är. Det är som mallar eller formulär som bestämmer vilken information som finns. Dessa är skrivna i ren [TypeScript](https://www.typescriptlang.org/) (ett programmeringsspråk som är en striktare version av [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) — webbens mest använda programmeringsspråk) och fungerar identiskt i den nya appen.

2. **Kopplingar till Airtable** — koden som hämtar och skickar data till [Airtable](https://airtable.com/) (databasen där all information om event, personer och anmälningar lagras). Denna kod är skriven så att den inte bryr sig om vilken app som använder den — den fungerar lika bra i den gamla som i den nya appen. Det kallas för en *adapter* — ett mellanlager som översätter mellan appen och databasen, ungefär som en universalladdarе som funkar med alla telefoner.

3. **Styrande dokument** — alla planer, specifikationer och designregler som styr bygget. 42 filer med sammanlagt över 9 000 rader text kopieras till det nya projektet. Utan dessa dokument vet inte byggsystemet vad det ska göra.

4. **Serverlogik** — de serverfunktioner som körs på [Supabase](https://supabase.com/) (en tjänst som hanterar inloggning och säker kommunikation med databasen). Dessa funktioner kallas *Edge Functions* och fungerar som en säkerhetsvakt: appen pratar aldrig direkt med databasen, utan alltid via denna vakt som kontrollerar att allt är korrekt.

### Vad gör vi konkret?

- Kopierar 10 datamodeller (Event, Person, Anmälan, Närvaro, med flera)
- Kopierar 3 adapterfiler (kopplingen till Airtable och Supabase)
- Kopierar 7 serverfunktioner (hämta event, hämta personer, med flera)
- Kopierar 22 dokumentfiler (designregler, säkerhetsspecifikationer, kvalitetsdefinitioner)
- Kopierar 2 hjälpfunktioner (bland annat en som meddelar skärmläsare om förändringar — viktigt för synskadade användare)
- Lägger till *validering* vid systemgränser: när appen tar emot data från Airtable kontrolleras att datan ser ut som förväntat. Om Airtable plötsligt ändrar sin struktur upptäcker vi det direkt — istället för att appen visar felaktiga siffror utan att veta om det. Valideringen görs med ett verktyg som heter [Zod](https://zod.dev/).
- Lägger till *återförsök vid fel*: om nätverksanropet till Airtable misslyckas (till exempel vid dålig uppkoppling) försöker appen automatiskt igen — tre gånger, med ökande väntetid mellan varje försök (200 millisekunder, sedan 400, sedan 800).

### Varför gör vi detta?

Istället för att bygga allt från noll återanvänder vi det som redan fungerar och är testat. Det sparar tid och minskar risken för fel.

### Vad Lotta märker

Ingenting synligt ännu. Men all data och alla kopplingar är redo att användas i nästa steg.

### Verifiering

Fasen är klar när:
- All kod kompilerar utan fel
- Datamodellerna fungerar korrekt
- Kopplingen till Airtable kan instantieras (skapas och startas)
- Valideringen fångar felaktig data

---

## Fas 2: Dörrar och lås

*1 session*

### Vad händer?

Nu bygger vi appens dörrar (hur man navigerar mellan sidor) och lås (inloggning).

**Navigering** kallas i tekniska termer för *routing* — det är systemet som bestämmer vad som visas när Lotta skriver in en adress eller klickar på en flik. Vi använder [TanStack Router](https://tanstack.com/router) som ger oss något speciellt: om Lotta filtrerar event på "kommande" och kopierar adressfältet till Roger, ser Roger exakt samma filtrerade vy. Filtret lever i webbadressen — inte gömt inne i appen.

**Inloggning** hanteras av [Supabase Auth](https://supabase.com/docs/guides/auth) — samma tjänst vi redan använder. Lotta loggar in med email och lösenord. Sessionen sparas så att Lotta inte behöver logga in varje gång hon öppnar appen (sessionen lever i 1 timme). Om Lotta är på en plats med dålig uppkoppling och redan är inloggad, fungerar appen ändå — den sparade sessionen räcker.

### Vad gör vi konkret?

- Bygger inloggningssidan med Miranon-design (guld och koppar-toner, Inter-typsnitt)
- Sätter upp alla sidor som platshållare (de fylls med innehåll i Fas 6):
  - `/hem` — Hem-fliken
  - `/event` — Event-listan
  - `/event/[id]` — En specifik event-sida
  - `/personer` — Personlistan
  - `/personer/[id]` — En specifik person
  - `/mer` — Mer-fliken
  - `/login` — Inloggningssidan
- Bygger en *auth guard* — en vakt som kontrollerar om Lotta är inloggad. Om inte, skickas hon till inloggningssidan.
- Installerar [nuqs](https://nuqs.47ng.com/) — ett verktyg som hanterar filter och söktermer i webbadressen. Det gör att Lottas filter överlever när hon trycker "Tillbaka" i webbläsaren, och att hon kan bokmärka en specifik vy.

### Varför gör vi detta?

Utan navigering finns det ingen app — bara en enda sida. Och utan inloggning kan vem som helst se känslig information om event och deltagare.

### Vad Lotta märker

Nu kan hon logga in och se fyra flikar längst ner. Flikarna är tomma ännu — men strukturen finns.

### Verifiering

Fasen är klar när:
- Inloggning och utloggning fungerar
- Alla fyra flikar visas med korrekt markering
- Ej inloggad + direkt besök → skickas till inloggning
- Webbläsarens bakåtknapp fungerar korrekt

---

## Fas 3: Byggklossar

*2 sessioner*

### Vad händer?

Nu bygger vi alla de små delarna som Lotta faktiskt trycker på, läser och interagerar med. Vi kallar dem *komponenter* — det är som LEGO-bitar som kan sättas ihop till större saker.

Varje komponent byggs med [React Aria](https://react-spectrum.adobe.com/react-aria/) — ett verktyg från Adobe som säkerställer att alla knappar, dialogrutor och listor fungerar korrekt för alla användare, inklusive de som:
- Navigerar med tangentbord istället för mus
- Använder skärmläsare (program som läser upp skärmens innehåll högt)
- Har nedsatt syn och behöver hög kontrast
- Har motoriska svårigheter och behöver stora tryckbara ytor

Det kallas *tillgänglighet* (engelska: accessibility, förkortas a11y) och är inte bara en bra sak att ha — det är lag i EU sedan juni 2025 ([European Accessibility Act](https://ec.europa.eu/social/main.jsp?catId=1202)).

### Vilka byggklossar skapas?

| Komponent | Vad den gör | Exempel i appen |
|-----------|-------------|-----------------|
| **Knapp** | En tryckbar yta som utför en handling | "Logga ut", "Följ upp obetalda", "Markera som betald" |
| **Dialogruta** | En ruta som dyker upp ovanpå sidan och kräver ett svar | "Är du säker på att du vill skicka påminnelse?" |
| **Meddelanderuta** | En färgkodad ruta med information | Blå = info, gul = varning, röd = fel, grön = bekräftelse |
| **Statusmärke** | En liten etikett som visar status | "Betald" (grön), "Ny anmälan" (blå), "Obetald" (röd) |
| **Skelett** | En grå form som visas medan riktig data laddas | Grå rektanglar som "pulserar" tills datan är redo |
| **Listrad** | En rad i en lista som kan klickas på | Ett event i eventlistan, en person i sökresultaten |
| **Flikväxlare** | Knappar som byter mellan olika vyer | "Kommande / Tidigare" i eventlistan |
| **Kort** | En avgränsad ruta med sammanhörande information | "Nästa event: Rönninge Retreat, 12 dagar kvar" |

### Hur säkerställer vi kvalitet?

Varje komponent granskas efter en skala vi kallar **11/11/11** — tre dimensioner med maxpoäng 11:

| Dimension | Vad den mäter |
|-----------|---------------|
| **Tillgänglighet** | Fungerar den med tangentbord? Skärmläsare? Hög kontrast? |
| **Teknisk kvalitet** | Följer den designsystemets regler? Inga hårdkodade värden? |
| **Återanvändbarhet** | Kan den användas i olika sammanhang? Är texter anpassningsbara? |

### Varför gör vi detta?

Utan dessa byggklossar kan vi inte bygga sidorna. Det är som att ha ritningarna till ett hus men inga tegelstenar. Genom att bygga dem ordentligt nu slipper vi "lappa och laga" senare.

### Vad Lotta märker

Ingenting direkt — men alla knappar, listor och rutor hon kommer interagera med formas här. Kvaliteten på dessa byggklossar avgör hur appen *känns*.

### Verifiering

Varje komponent är klar när:
- Den fungerar med mus, tangentbord och skärmläsare
- Den följer designsystemets färger och typsnitt exakt
- Den har alla tillstånd: normal, hovrad (muspekaren ovanpå), fokuserad, tryckt, inaktiverad
- En visuell referensbild har sparats (för att upptäcka oavsiktliga förändringar i framtiden)

---

## Fas 5: Skalet — det Lotta ser först

*1,5 sessioner*

### Vad händer?

Nu bygger vi det som omger allt — appens *skal*. Det inkluderar:

- **Flikraden längst ner** — fyra flikar (Hem, Event, Personer, Mer) med ikoner. Den aktiva fliken markeras med en pillerformad markering, precis som i Försäkringskassans app.

- **Sidhuvud** — en enkel rubrik ("Hem", "Event", "Personer") som visar var man befinner sig.

- **"Hoppa till innehåll"-länk** — en osynlig länk som blir synlig när man trycker Tab. Den låter tangentbordsanvändare hoppa förbi navigeringen direkt till sidans innehåll. Det är en tillgänglighetsfunktion som de flesta aldrig märker — men som gör enorm skillnad för de som behöver den.

- **Felberedskap** — om en del av sidan kraschar (till exempel om nätverket är nere) visas ett vänligt meddelande *bara på den delen*. Resten av appen fortsätter fungera. Det kallas *error boundaries* — felgränser som förhindrar att ett litet problem slår ner hela appen.

- **Offline-stöd** — om Lotta öppnar appen utan internet (till exempel på en eventplats med dålig wifi) visas den senaste versionen av datan istället för en tom skärm. En liten text säger "Senast uppdaterad: 08:12" så att Lotta vet att datan kan vara lite gammal. Det möjliggörs av en *service worker* — ett litet program som körs i bakgrunden och sparar en kopia av appen och dess data på enheten.

- **Mjuka övergångar** — när Lotta klickar på ett event i listan och detaljsidan öppnas, sker övergången mjukt. Kortet i listan "blir" detaljsidan. Det hjälper hjärnan att förstå sambandet mellan de två vyerna. Det kallas *View Transitions* och är en relativt ny teknik i webbläsare.

### Varför gör vi detta?

Skalet är det första Lotta ser varje gång hon öppnar appen. Om det känns rörigt, långsamt eller opålitligt spelar det ingen roll hur bra resten är — förtroendet är redan skadat.

### Vad Lotta märker

**Nu ser appen ut som en riktig app.** Fyra flikar, tydlig rubrik, snabb navigering. Om internet är borta fungerar det ändå. Om något går fel syns ett vänligt meddelande istället för en vit skärm.

### Verifiering

Fasen är klar när:
- Alla fyra flikar fungerar och visar rätt markering
- Appen fungerar på telefon (375px), surfplatta (768px) och dator (1024px)
- Appen visar cachad data utan internet
- Ett kraschande avsnitt visar felmeddelande utan att resten påverkas
- Alla mått i appen möter *performance-budgeten* (se [Kvalitet och säkerhet](#kvalitet-och-säkerhet))

---

## Fas 6: Alla rum — Hem, Event, Personer, Mer

*3,5 sessioner*

### Vad händer?

Nu fyller vi appen med liv. Alla fyra flikar byggs med riktig data från Airtable. Det här är den fas där appen går från "struktur" till "verktyg".

### Hem-fliken — "Brinner det?"

**Scenario:** Lotta öppnar appen med kaffe i handen. Hon har 30 sekunder innan första mötet.

Vad hon ser:
- **"Hej Lotta"** — en personlig hälsning.
- **Statustext** — "3 nya anmälningar sedan igår" eller "Inga nya anmälningar — allt är lugnt."
- **1–2 informationskort** — nästa event (namn, datum, beläggning) och antal obetalda.
- **En stor knapp** — kontextuell: "Följ upp obetalda" om det finns obetalda, annars "Se alla event."
- **Systemhälsa** — längst ner: "Senast synkroniserat: 08:14. 234 anmälningar sedan start. 0 tappade." Det bevisar att systemet fungerar. Lotta behöver inte lita blindt — hon kan se det.

Om datan inte kan hämtas (nätverksfel) visas den senaste versionen med en text: "Vi kunde inte hämta anmälningarna just nu. Senaste versionen (från kl 07:52) visas nedan. Vi försöker igen automatiskt."

### Event-fliken — "Vad händer med våra event?"

**Scenario:** Lotta vill se status på alla event.

Vad hon ser:
- **Lista med event** — varje event som en rad med namn, datum och beläggningstext. Klicka för att öppna.
- **Filter** — "Kommande" / "Tidigare" / "Alla" — lever i webbadressen så att de överlever om Lotta laddar om sidan.
- **Event-detaljsida** — klicka på ett event → all information om det eventet. Anmälda personer, betalningsstatus, närvaro. Möjlighet att flikvaxla mellan "Anmälda / Betalning / Närvaro".

Här introduceras *optimistisk uppdatering*: om Lotta markerar en betalning som "Betald", uppdateras skärmen *omedelbart* — innan servern har bekräftat ändringen. I bakgrunden skickas ändringen till Airtable. Om det misslyckas rullas ändringen tillbaka och ett felmeddelande visas. Resultatet: appen känns snabb och responsiv.

### Personer-fliken — "Vem var det som...?"

**Scenario:** Lotta minns ett förnamn men inte mer.

Vad hon ser:
- **Sökfält** — skriv ett namn, en email eller ett telefonnummer. Resultaten dyker upp medan hon skriver (med en kort fördröjning så att appen inte söker efter varje bokstav).
- **Resultatlista** — matchande personer som rader. Klicka för att öppna.
- **Personkort** — all information om en person: kontaktuppgifter, vilka event de deltagit i, betalningshistorik, interaktioner med Miranon Media.

Söktermen lever i webbadressen (`/personer?q=anna`) — om Lotta trycker bakåt kommer hon tillbaka till sina sökresultat, inte till en tom sida.

### Mer-fliken — "Allt annat"

Vad hon ser:
- **Leads** — personer som visat intresse men aldrig deltagit. "Intresserade" på Lottas språk.
- **Planera event** — skapa ett nytt event.
- **Mail** — skicka bekräftelser, påminnelser och praktisk information.
- **Inställningar** — appens inställningar.
- **Logga ut** — längst ner.

### Tekniska detaljer (förklarade)

All data hämtas med [TanStack Query](https://tanstack.com/query) — ett verktyg som:
- **Cachar data** — om Lotta redan hämtat eventlistan och navigerar bort och tillbaka, visas den sparade versionen direkt (utan att vänta på nätverket).
- **Uppdaterar i bakgrunden** — medan cachad data visas skickas en förfrågan efter ny data. Om något har ändrats uppdateras vyn automatiskt.
- **Förhämtar data** — om Lotta håller musen över "Se alla event" börjar appen hämta eventlistan *innan hon klickar*. Resultatet: sidan laddar ögonblickligen.

### Varför gör vi detta?

Det här är appens hjärta. Allt före denna fas var förberedelse. Allt efter är förfining. Fas 6 är det som gör appen till ett verktyg istället för en demo.

### Vad Lotta märker

**Appen är klar att använda.** Alla fyra flikar fungerar med riktig data. Hon kan se nya anmälningar, hantera betalningar, föra närvaro, söka bland personer och skicka mail.

### Verifiering

Fasen är klar när:
- Alla fyra flikar visar riktig data
- Varje flik fungerar i tre storlekar: telefon, surfplatta, dator
- Filter och söktermer överlever omladdning av sidan
- Laddningstillstånd (skelett), feltillstånd (meddelanderuta) och tomma tillstånd ("Inga event") fungerar korrekt
- Optimistiska uppdateringar fungerar (markera betald → omedelbar respons)
- Automatiska tillgänglighetstester visar 0 kritiska problem per vy

---

## Fas 6.5: Aktivitetsloggen — "Vad har hänt?"

*2 sessioner*

### Vad händer?

Vi bygger ett automatiskt loggningssystem som sparar allt Lotta gör i appen: betalningar hon markerat, påminnelser hon skickat, närvaro hon fört, event hon skapat.

Det är inte en övervakningsfunktion — det är ett *bevis* på att systemet fungerar. Lotta kan öppna loggen och se: "Igår markerade du 5 betalningar och skickade 2 påminnelser." Det bygger förtroende.

### Tekniska detaljer (förklarade)

Loggen skrivs i ett format inspirerat av [xAPI](https://xapi.com/) — en internationell standard för att logga händelser. Varje loggpost innehåller:
- **Vem** — Lotta (eller Roger)
- **Vad** — "markerade som betald"
- **Vad det gällde** — en specifik anmälan eller person
- **Resultat** — lyckades det?
- **Tidpunkt** — exakt tidsstämpel
- **Spårnings-ID** — ett unikt nummer som kopplar ihop loggposten med den underliggande operationen (om något gick fel kan vi spåra exakt var)

Loggen följer GDPR (EU:s dataskyddsförordning): data sparas i 12 månader och anonymiseras därefter.

### Varför gör vi detta?

Utan en logg vet ingen vad som hänt. Om Lotta undrar "Skickade jag påminnelsen till Anna?" behöver hon inte gissa — hon tittar i loggen.

### Vad Lotta märker

En ny sektion där hon kan se sin historik. Allt hon gjort — kronologiskt, tydligt, sökbart.

---

## Fas 7: Slutbesiktning

*3 sessioner*

### Vad händer?

Appen är funktionellt klar sedan Fas 6. Nu granskar vi allt — som en slutbesiktning av ett husbygge. Vi testar under sämre förhållanden, mäter prestanda, granskar säkerhet och verifierar tillgänglighet.

### Vad gör vi konkret?

**Säkerhet:**
- Aktiverar *Content Security Policy* (CSP) — regler som berättar för webbläsaren exakt vilka resurser appen får ladda. Om någon försöker injicera skadlig kod blockeras det automatiskt. Se [SECURITY-SPEC.md](docs/specs/SECURITY-SPEC.md).
- Aktiverar *Trusted Types* — en extra säkerhetsnivå som förhindrar en specifik typ av attack (XSS — Cross-Site Scripting, där angripare lurar webbläsaren att köra deras kod).
- Granskar alla beroenden (tredjepartspaket) för kända säkerhetsproblem.

**Prestanda:**
- Verifierar att appen möter *performance-budgeten* — de mål vi satt i Fas 0 för hur snabbt appen ska ladda och reagera. Se [Kvalitet och säkerhet](#kvalitet-och-säkerhet).
- Konfigurerar automatiska prestandatester som körs vid varje förändring.

**Tillgänglighet:**
- Manuell testning med *VoiceOver* (Apples skärmläsare) — en människa navigerar genom appen och verifierar att allt är begripligt utan att se skärmen.
- Verifierar att appen uppfyller [European Accessibility Act](https://ec.europa.eu/social/main.jsp?catId=1202) (EU-lag sedan juni 2025).

**Stresstester:**
- *Friction logs* — testprotokoll där vi går igenom appen som Lotta och markerar varje tvekan, förvirring eller fördröjning. Tre tester: inloggningsflödet, morgonöverblicken och fullständig navigering.
- *Chaos testing* — vi testar vad som händer när saker går fel: nätverket försvinner mitt i en operation, servern svarar långsamt, data saknas. Appen ska aldrig visa en tom skärm eller krascha.

**Publicering:**
- Sätter upp en *deploy-pipeline* — ett automatiskt system som publicerar appen till webben varje gång vi sparar en förändring. Appen publiceras på [Vercel](https://vercel.com/) (en tjänst som hostar webbappar).

### Varför gör vi detta?

En app som fungerar på Marcus dator under perfekta förhållanden är inte en färdig app. En färdig app fungerar på Lottas surfplatta med dåligt wifi, i solen, medan hon har bråttom. Slutbesiktningen säkerställer det.

### Vad Lotta märker

Appen publiceras och Lotta kan öppna den på en riktig webbadress. Den fungerar snabbt, säkert och tillförlitligt — oavsett enhet och uppkoppling.

---

## Fas 8: Framtiden

*Planerad, inte schemalagd*

### Vad är planerat?

Dessa funktioner byggs inte nu — men arkitekturen är förberedd för dem:

- **Fingeravtrycksinloggning (Passkeys)** — Lotta loggar in med Face ID eller fingeravtryck istället för email och lösenord. Ingen kod att komma ihåg. [Supabase](https://supabase.com/) förbereder stöd för detta via [WebAuthn](https://webauthn.io/).

- **Push-notiser** — Lotta får en notis på telefonen: "3 nya anmälningar till Rönninge-eventet." Hon behöver inte öppna appen för att veta att något hänt.

- **Avancerad offline** — möjligheten att göra ändringar (markera betalning, föra närvaro) utan internet. Ändringarna sparas på enheten och synkroniseras automatiskt när uppkopplingen är tillbaka.

### Varför planerar vi det redan?

Genom att veta vilka funktioner som kommer kan vi bygga grunden rätt. Till exempel: aktivitetsloggеns format (Fas 6.5) är redan förberett för push-notiser. Inloggningssidans design har redan plats för en "Logga in med fingeravtryck"-knapp.

---

## Kvalitet och säkerhet

### Performance-budget — "Hur snabb ska appen vara?"

Vi har satt mål för hur snabbt appen ska ladda och reagera. Dessa mål kallas *performance-budget* och mäts med standardiserade mått:

| Mått | Vad det mäter | Mål | Förklaring |
|------|---------------|-----|------------|
| **FCP** | Hur snabbt *något* syns på skärmen | Under 1,5 sekunder | Lotta ska se att något händer — inte stirra på en vit skärm |
| **LCP** | Hur snabbt det *viktigaste* elementet syns | Under 2,5 sekunder | Dashboardens kort, eventlistan — det Lotta faktiskt läser |
| **INP** | Hur snabbt appen *svarar* på tryck | Under 200 millisekunder | Varje knapptryck ska ge omedelbar feedback |
| **CLS** | Hur mycket sidan *hoppar* medan den laddas | Under 0,1 | Inget ska flytta sig efter att det dykt upp — extremt irriterande annars |

Dessa mäts inte bara på Marcus dator — de mäts på Lottas faktiska enhet i produktion med [web-vitals](https://web.dev/vitals/) (Googles verktyg för prestandamätning).

### Säkerhet — "Hur skyddas datan?"

| Skydd | Vad det gör |
|-------|------------|
| **Inloggning** | Bara Lotta och Roger kan komma åt appen. Sessionen varar 1 timme. |
| **Edge Functions** | Appen pratar aldrig direkt med databasen. Alla anrop går via en säkerhetsvakt. |
| **CSP-headers** | Webbläsaren vet exakt vad appen får göra — försök till kodinjicering blockeras. |
| **Beroendegranskningar** | Alla tredjepartspaket granskas automatiskt för kända säkerhetsproblem. |
| **HTTPS** | All kommunikation är krypterad — ingen kan avlyssna data som skickas. |

### Tillgänglighet — "Fungerar den för alla?"

| Krav | Vad det innebär |
|------|----------------|
| **Tangentbordsnavigering** | Allt som kan klickas kan också nås med Tab + Enter |
| **Skärmläsare** | All information som syns kan också *höras* |
| **Hög kontrast** | Appen anpassar sig om användaren har aktiverat hög kontrast i sin enhet |
| **Stora tryckyta** | Alla knappar är minst 44×44 pixlar — enkla att träffa med fingret |
| **Zooming** | Appen fungerar vid 200% zoom utan att något försvinner |
| **Lagskyldighet** | Appen uppfyller EU:s tillgänglighetsdirektiv (European Accessibility Act, i kraft sedan juni 2025) |

### Fem kvaliteter vi eftersträvar

Dessa fem kvaliteter definierar skillnaden mellan "fungerar" och "känns magiskt":

| Kvalitet | Vad det innebär | Exempel |
|----------|----------------|---------|
| **Omedelbarhet** | Data finns redan där | Lotta klickar "Se alla event" — listan dyker upp direkt (den hämtades redan i bakgrunden) |
| **Kontinuitet** | Navigering känns som att flytta fokus | Klicka på ett event → kortet "blir" detaljsidan (mjuk övergång) |
| **Transparens** | Systemet bevisar att det fungerar | "234 anmälningar hanterade. 0 tappade." |
| **Odödlighet** | Appen dör aldrig | Flygplansläge → senaste data visas med "Senast uppdaterad"-text |
| **Profetia** | Appen vet vad Lotta ska göra härnäst | Hon rör sig mot "3 obetalda" → sidan är redan hämtad |

---

## Verktygslådan — vad vi bygger med

Här förklaras alla verktyg och tekniker som nämns i planen. De är grupperade efter vad de gör.

### Appens grund

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **React** | Byggsystemet för hela appen. Bestämmer hur saker visas och reagerar på interaktion. Utvecklas av Meta (Facebook). | [react.dev](https://react.dev/) |
| **TypeScript** | Ett programmeringsspråk som hjälper oss hitta fel innan appen körs. En striktare version av JavaScript. | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vite** | Startar appen lokalt under utveckling och paketerar den för publicering. Extremt snabbt. | [vite.dev](https://vite.dev/) |

### Data och kommunikation

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **Airtable** | Databasen där all information lagras — event, personer, anmälningar. Fungerar som ett avancerat kalkylark. | [airtable.com](https://airtable.com/) |
| **Supabase** | Hanterar inloggning och fungerar som mellanhand mellan appen och Airtable. Kör säkra serverfunktioner. | [supabase.com](https://supabase.com/) |
| **TanStack Query** | Hämtar data smart: cachar, uppdaterar i bakgrunden och förhämtar. | [tanstack.com/query](https://tanstack.com/query) |
| **Zod** | Kontrollerar att data som kommer utifrån ser ut som förväntat. | [zod.dev](https://zod.dev/) |

### Navigering och tillstånd

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **TanStack Router** | Hanterar navigering mellan sidor med typsäkerhet. | [tanstack.com/router](https://tanstack.com/router) |
| **nuqs** | Lagrar filter och söktermer i webbadressen. | [nuqs.47ng.com](https://nuqs.47ng.com/) |

### Design och utseende

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **Tailwind CSS** | Ett sätt att styla appen med fördefinierade klasser istället för att skriva egen stilkod. | [tailwindcss.com](https://tailwindcss.com/) |
| **React Aria** | Adobes verktyg för att bygga tillgängliga komponenter. Hanterar tangentbord, skärmläsare och ARIA-attribut. | [react-spectrum.adobe.com](https://react-spectrum.adobe.com/react-aria/) |
| **Lucide** | Ikonbibliotek med hundratals tydliga, enkla ikoner. | [lucide.dev](https://lucide.dev/) |
| **Motion (Framer)** | Hanterar animationer och övergångar. | [motion.dev](https://motion.dev/) |
| **CVA** | Gör det enkelt att ha varianter av en komponent (t.ex. en knapp som kan vara primär eller sekundär). | [cva.style](https://cva.style/) |
| **Inter** | Typsnittet som används i hela appen. Designat specifikt för skärmar. | [rsms.me/inter](https://rsms.me/inter/) |

### Kvalitet och verktyg

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **Biome** | Kontrollerar koden och formaterar den automatiskt. Ersätter tre separata verktyg med ett enda. | [biomejs.dev](https://biomejs.dev/) |
| **Playwright** | Tar automatiska skärmbilder av appen och jämför dem med tidigare versioner — upptäcker oavsiktliga visuella förändringar. | [playwright.dev](https://playwright.dev/) |
| **Sentry** | Övervakar appen i produktion. Rapporterar fel, prestandaproblem och kraschar. | [sentry.io](https://sentry.io/) |
| **web-vitals** | Mäter appens prestanda på riktiga enheter (inte bara utvecklardatorn). | [web.dev/vitals](https://web.dev/vitals/) |
| **Workbox** | Hanterar offline-stöd via service workers. | [developer.chrome.com/docs/workbox](https://developer.chrome.com/docs/workbox/) |

### Lagring och publicering

| Verktyg | Vad det gör | Webbplats |
|---------|------------|-----------|
| **GitHub** | Lagrar all kod med fullständig historik. Om något går fel kan vi alltid gå tillbaka till en tidigare version. | [github.com](https://github.com/) |
| **Vercel** | Publicerar appen på webben automatiskt vid varje sparning. | [vercel.com](https://vercel.com/) |

---

## Ordlista A–Ö

| Begrepp | Förklaring |
|---------|------------|
| **A11y** | Förkortning av "accessibility" (tillgänglighet). Siffran 11 representerar de 11 bokstäverna mellan a och y. |
| **Adapter** | Ett mellanlager som översätter mellan två system. Som en universalladdare som funkar med alla telefoner. |
| **API** | Application Programming Interface — ett sätt för program att prata med varandra. När appen hämtar data från Airtable gör den det via Airtables API. |
| **ARIA** | Accessible Rich Internet Applications — ett system av attribut som hjälper skärmläsare förstå webbsidors innehåll. |
| **Auth / autentisering** | Processen att verifiera vem en användare är — vanligtvis genom email och lösenord. |
| **Cache** | En sparad kopia av data som kan visas direkt utan att hämta den igen. Som en anteckning du redan har i fickan istället för att ringa och fråga. |
| **Chaos testing** | Att medvetet orsaka problem (nätverksfel, långsamma servrar) för att se hur appen hanterar det. |
| **Compile / kompilera** | Att omvandla kod skriven av människor till kod som datorn kan köra. |
| **Compost / komponent** | En avgränsad del av appen med eget utseende och beteende. En knapp, en lista, ett kort — alla är komponenter. |
| **CSP** | Content Security Policy — säkerhetsregler som berättar för webbläsaren vad appen får göra. |
| **Deploy** | Att publicera appen så att den blir tillgänglig på webben. |
| **DevDeps** | Development Dependencies — verktyg som bara behövs under utveckling, inte i den färdiga appen. |
| **DOM** | Document Object Model — webbläsarens interna representation av en webbsida. |
| **DRY_RUN** | Att "låtsasköra" ett script utan att göra några verkliga ändringar. Som en generalrepetition. |
| **EAA** | European Accessibility Act — EU-lag som kräver att digitala tjänster är tillgängliga. I kraft sedan juni 2025. |
| **Edge Function** | En serverfunktion som körs nära användaren (på en server "vid kanten" av nätverket) för snabb respons. |
| **Error boundary** | En felgräns som förhindrar att ett fel i en del av appen kraschar hela appen. |
| **Exponential backoff** | En strategi där väntetiden fördubblas mellan varje nytt försök vid fel. 200ms → 400ms → 800ms. |
| **Fetch** | Att hämta data från en server via internet. |
| **Fokusring** | En synlig ram runt det element som är markerat med tangentbordet. Avgörande för tangentbordsnavigering. |
| **Framework** | Ett ramverk — en samling verktyg och regler som ger struktur åt ett program. React och Vue är ramverk. |
| **GDPR** | General Data Protection Regulation — EU:s dataskyddsförordning. |
| **Git** | Ett versionskontrollsystem som sparar all historik. Om något går fel kan man alltid gå tillbaka. |
| **Hook** | I React: en funktion som ger en komponent speciella förmågor (t.ex. att komma ihåg ett värde eller reagera på förändringar). |
| **HTTPS** | Krypterad kommunikation mellan webbläsare och server. Symboliseras av hänglåset i adressfältet. |
| **INP** | Interaction to Next Paint — mäter hur snabbt appen svarar på interaktion. |
| **JSON** | JavaScript Object Notation — ett vanligt format för att skicka data mellan system. |
| **JWT** | JSON Web Token — en digital "biljett" som bevisar att användaren är inloggad. |
| **LCP** | Largest Contentful Paint — mäter hur snabbt det viktigaste elementet syns på skärmen. |
| **Lint** | Automatisk kodkontroll som hittar vanliga misstag och stilbrott. Som stavningskontroll för kod. |
| **Mutation** | En operation som ändrar data (till skillnad från att bara läsa den). Markera som betald = mutation. |
| **Offline** | Att fungera utan internetanslutning. |
| **Optimistisk uppdatering** | Att visa en ändring direkt *innan* servern bekräftat den. Ger en snabb upplevelse. |
| **Passkey** | Inloggning via fingeravtryck eller ansiktsigenkänning istället för lösenord. |
| **Performance** | Prestanda — hur snabbt appen laddar och svarar. |
| **Prefetch** | Att hämta data i förväg, innan användaren ber om den. |
| **Provider** | I React: en komponent som delar data med alla komponenter inuti den. |
| **Push-notis** | En avisering som visas på telefonen utan att appen är öppen. |
| **Repository (repo)** | En projektmapp med all kod och historik, lagrad på GitHub. |
| **Retry** | Att försöka igen automatiskt vid fel. |
| **Route / routing** | En koppling mellan en webbadress och det som visas. `/event` visar eventlistan. |
| **RUM** | Real User Monitoring — mätning av prestanda på riktiga användares enheter. |
| **Schema** | En definition av hur data ska se ut. Som en mall för ett formulär. |
| **Service worker** | Ett litet program som körs i bakgrunden och hanterar cachning, offline-stöd och push-notiser. |
| **Session** | En tidsperiod då en användare är inloggad. Eller: ett arbetspass (Marcus + Claude). |
| **Skeleton** | En grå platshållare som visas medan riktig data laddas. Ser ut som en "skiss" av det som kommer. |
| **SPA** | Single-Page Application — en app som laddar en gång och sedan uppdaterar innehållet utan att ladda om hela sidan. |
| **Stale data** | Gammal data som kan vara inaktuell men ändå visas (bättre än inget). |
| **Token (design)** | Ett namngivet designvärde. "Primärfärg = guld (#D4960A)". Alla delar av appen refererar till tokens istället för hårdkodade värden. |
| **Trusted Types** | En säkerhetsfunktion som förhindrar en specifik typ av attack (DOM XSS). |
| **TypeScript** | Ett programmeringsspråk som lägger till typkontroll på JavaScript. Hittar fel innan koden körs. |
| **URL-state** | Information som lever i webbadressen (filter, söktermer, aktiv flik). Överlever omladdning och kan delas som en länk. |
| **Validering** | Att kontrollera att data ser ut som förväntat. |
| **View Transition** | En mjuk visuell övergång mellan två sidor i appen. |
| **WCAG** | Web Content Accessibility Guidelines — internationella riktlinjer för webbtillgänglighet. |
| **XSS** | Cross-Site Scripting — en typ av attack där illasinnad kod injiceras i en webbsida. |
| **xAPI** | Experience API — en standard för att logga händelser och aktiviteter. |

---

*Dokumentet baserat på: [conversion-plan.md](docs/conversion-plan.md), [DESIGN-MANIFESTO.md](docs/specs/DESIGN-MANIFESTO.md), [DESIGN-OPERATING-SYSTEM.md](docs/specs/DESIGN-OPERATING-SYSTEM.md), [DESIGN-SYSTEM-SPEC.md](docs/specs/DESIGN-SYSTEM-SPEC.md), [SECURITY-SPEC.md](docs/specs/SECURITY-SPEC.md), [PERFORMANCE-BUDGET.md](docs/specs/PERFORMANCE-BUDGET.md), [ARIA-UPGRADE.md](docs/specs/ARIA-UPGRADE.md), [gap-analysis.md](docs/logs/gap-analysis.md) och [FILE-INVENTORY.md](docs/react-migration/FILE-INVENTORY.md).*

*Senast uppdaterad: 2026-04-07*
