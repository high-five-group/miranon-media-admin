# S90 — Review-guiden: fyra beslut

Detta är dokumentet du följer. Läs uppifrån och ned, ett beslut i taget, och
skriv in svaret i rutan sist i varje avsnitt. Du behöver inte läsa någon kod.

---

## Innan du börjar

### Vad du ska göra

Fyra beslut om det som byggdes natten till 2026-07-26. Tre av dem är val mellan
färdiga förslag du kan titta på; ett är ett godkänn eller underkänn.

| # | Yta | Formen på beslutet | Ungefär |
|---|---|---|---|
| 1 | Personlistan | Två val — kortytans form + en statuspill | 10 min |
| 2 | Persondetaljen | Välj ett av tre arrangemang (A/B/C) | 20 min |
| 3 | Markera-läget i Anmälda deltagare | Godkänn eller underkänn | 10 min |
| 4 | Check-in vid dörren | Välj ett av tre arrangemang (A/B/C) | 30 min |

Räkna med en dryg timme totalt.

### Varför just den ordningen

- **1 före 2.** Listans språk — pillarna, chevronen, radens rytm — är det som
  persondetaljens toppzon ska eka. Båda ytorna bor dessutom under `/personer`,
  så du tittar på dem i samma svep.
- **3 före 4.** Markera-läget i beslut 3 är exakt samma interaktion som
  check-in-variant A använder. Har du hållit den i handen på riktigt bedömer du
  A på verkligheten i stället för på en bild.
- **Personerna före eventet.** Beslut 1 och 2 håller en annan pågående tråd
  (T96, systemmeddelandena) parkerad tills de landat. Ju tidigare de är valda,
  desto tidigare släpper den låsningen.

### Vad du behöver

Kör detta i repot, på `main`-grenen:

```bash
npm run dev
```

Appen öppnas på **port 5173**. Det är den enda port som fungerar.

```text
http://localhost:5173
```

Logga in som vanligt. Prototyperna läser samma staging-data som du är van vid.

**Portvarning.** I bilagornas README-filer står portarna 4183 och 5299. Det är
maskinernas egna portar från natten och från testsviten. Startar du appen där
blockerar databasen anropen och vyn ser trasig ut utan att vara det. Använd
5173.

**Prototyperna finns endast i utvecklingsläge.** De syns när du kör
`npm run dev`, aldrig i ett riktigt bygge. En felaktig sammanslagning kan inte
nå Lotta.

**Så växlar du.** Lägg till `?variant=a` (eller `b`/`c`) sist i adressen. Det
finns också en liten flytande knapp-rad i högerkanten som växlar mellan
varianterna och tillbaka till den skarpa vyn.

### Så läser du bilderna

Alla bilder ligger i mappar bredvid den här filen. Filnamn som slutar på
`-mobil` är 430 pixlar brett — Lottas verkliga arbetsläge. `-desktop` är 1440
pixlar. Appens innehållsyta är låst till 600 pixlar, så desktop är samma spalt
med mer luft omkring, inte en annan layout.

Vill du se dem i rätt storlek på skärmen: dra webbläsarfönstret smalt, eller
använd webbläsarens mobilläge.

Två saker som gör bilder och live-läge olika:

- **Bilderna visar påhittad testdata** — en fryst uppsättning personer och
  deltagare som byggdes för att pröva formen. Live visar riktig staging-data.
  Samma form, annat innehåll.
- **Menyraden längst ned är bortmaskad** i personlistans och persondetaljens
  bilder, men syns i check-in-bilderna. Jämför därför inte tillgänglig
  skärmhöjd mellan olika bilagor.

### Vad som händer när allt är valt

Code skriver ett spec-kort per yta och delar det i arbetsbitar. Bygget startar
på den valda formen. Prototypkoden raderas — den absorberas aldrig, vinnaren
skrivs om från grunden genom de vanliga kvalitetsgrindarna. Bilderna är det som
överlever och blir facit. Sista avsnittet i den här guiden listar vad som byggs
oavsett vad du väljer.

---

## Beslut 1 — Personlistans kortyta och statuspillen

### 1. Vad du bestämmer

Hur en rad i listan över personer ska se ut — och om statuspillen "Ej påbörjat"
ska visas eller tiga.

### 2. Titta här

Live, i webbläsaren:

```text
http://localhost:5173/personer?variant=a
http://localhost:5173/personer
```

Den första är förslaget, den andra är dagens vy. Växla mellan dem.

Bilderna ligger i `s90-personlistan-konvergens/`. Jämför dessa fyra:

| | Mobil (430 px) | Desktop (1440 px) |
|---|---|---|
| Tonal | `slutlage-tonal-mobil.png` | `slutlage-tonal-desktop.png` |
| Zebra | `slutlage-zebra-mobil.png` | `slutlage-zebra-desktop.png` |

**Tonal** är en sammanhållen ljus yta med tunna linjer mellan raderna. Samma
form som eventsidans grupperade block.

**Zebra** är samma yta men med varannan rad svagt tonad och utan linjer. Samma
form som kortet på Hem-vyn.

Vill du se hela vägen dit — elva steg från dagens vy till förslaget — ligger de
som `k01-mobil.png` till `k11-tomt-mobil.png` i samma mapp, med en README som
förklarar varje steg.

**Statuspillen** ser du i `slutlage-tonal-mobil.png`: fem av tio rader bär en
liten grå pill som säger "Ej påbörjat". Den betyder att personen inte gått
någon kurs än.

### 3. Frågan som avgör

1. **Vad gör Lotta i listan — letar hon upp en person hon redan tänker på,
   eller läser hon av statusar över många rader?** Zebra hjälper ögat att hitta
   radgränsen när man skannar. Tonal ger lugnare läsning per rad. Är listan
   mest en väg vidare till en person väger zebras fördel lätt.
2. **Vilken befintlig yta ska listan kännas släkt med?** Eventsidans block
   (tonal) eller Hem-kortet (zebra). Det är en fråga om sammanhang, inte smak.
3. **Agerar Lotta någonsin på "Ej påbörjat"?** Om pillen aldrig leder till en
   handling är den brus i en lista man skannar.

Fråga 1 och 3 hänger ihop: zebra kostar mer när varje rad redan bär pillar.
Färre pillar gör zebra billigare. Svara på båda i ett svep.

### 4. Vad alternativen kostar

| Alternativ | Optimerar för | Offrar | Vinner när |
|---|---|---|---|
| Tonal kortyta | Lugn läsning per rad, släktskap med eventsidan | Något svagare radseparation vid snabb skanning | Listan är en väg vidare till en person |
| Zebra kortyta | Snabb radseparation utan linjer | Mer visuellt brus när raden bär pillar | Lotta läser av statusar över många rader |
| Pillen visas alltid | Ett fält, en regel, inget att förklara | Halva listan bär en pill som säger att inget hänt | Tomtillståndet i sig är information |
| Pillen tiger under en nivå | Lugnare lista, pillen betyder något när den syns | Kräver ett annat sätt att skilja "ingen erfarenhet" från "vet ej" | Lotta agerar först från "Fjärrskådare" och uppåt |

### 5. Fällor

- **Zebra går inte att växla i webbläsaren.** Formen bor i en inställning i
  koden, inte i adressen — det är ett medvetet val som följer ett tidigare
  arkitekturbeslut. Bilderna är därför enda jämförelsevägen. Vill du hellre
  växla live är det en rads ändring; säg till så görs den, och avsteget bokförs
  öppet.
- **En rad heter "Ej tillgängligt".** Det är inte en platshållare vi hittat på.
  Databasens namnfält är en formel som skriver just den strängen när både för-
  och efternamn saknas. Rättas oavsett vad du väljer.
- **Bilderna visar tio personer, live visar femtio.** Testdatan är kapad till
  tio rader. Antalet grå platshållarrader medan sidan laddar är också en
  uppskattning som ska bekräftas mot verklig sidhöjd i bygget.
- **Två bilder som ser oförändrade ut är det med avsikt.** Steg `k07` är
  identiskt med `k05` — det steget gör att persondetaljen börjar hämtas redan
  när du för muspekaren över raden. Osynligt i bild, tydligt kännbart i handen.
  Slutläget för tonal är av samma skäl identiskt med `k10`.

### 6. Vad valet låser och föder

**Låser.** Radens form blir mall för alla kommande listor i appen som ska tåla
många rader. Personlistan är appens första riktiga 200-radersyta. Formen är en
rads ändring i koden men dyr att ändra i sammanhang — bildjämförelserna i
testsviten, de automatiska klicktesterna och alla efterföljande listor
kalibreras mot valet.

**Föder.** Ett spec-kort för personlistan plus arbetsbitar per stegblock. En av
dem är obligatorisk och måste landa i samma sväng: sju automatiska tester
hänger i den gamla texten i räknarraden, och ett av dem kontrollerar just den
grammatikbugg som steget rättar. De får aldrig lämnas röda.

### 7. Min rekommendation

**Tonal kortyta, och låt pillen tiga för "Ej påbörjat".**

Motiv, i den ordning jag tror de väger:

1. Personlistan kommer att läsas i samma vecka som eventsidan. Tonal är samma
   familj som eventsidans block, och den familjen är redan facit i appen.
2. En pill som betyder att ingenting hänt tar plats utan att bära en handling.
   Halva listan bär den i dag.
3. Zebra löser ett skanningsproblem som listan i praktiken har måttligt av, om
   den mest är en väg vidare till en persons sida.

**Om du svarar tvärtom på fråga 1** — att Lotta faktiskt läser statusar över
många rader — då är zebra rätt val, och då hör tiga-pillen ihop med det:
zebra plus färre pillar är det par som håller.

### 8. Din ruta

```text
Kortyta (tonal / zebra): ______

Pillen "Ej påbörjat" (visa alltid / tig under en nivå): ______

Ev. justeringar som blir byggkrav: ______
```

---

## Beslut 2 — Persondetaljens arrangemang

### 1. Vad du bestämmer

Vad som är huvudsaken på en persons sida — och därmed vad Lotta ser utan att
scrolla.

### 2. Titta här

Öppna `/personer`, klicka en person, och lägg till `?variant=a` sist i
adressen. Byt sedan bokstav, eller använd knapp-raden i högerkanten:

```text
http://localhost:5173/personer
http://localhost:5173/personer/<personens-id>?variant=a
http://localhost:5173/personer/<personens-id>?variant=b
http://localhost:5173/personer/<personens-id>?variant=c
```

Bilderna ligger i `s90-persondetalj-divergens/`. Två jämförelser avgör:

**Jämförelse 1 — vad är sidans huvudsak?** Detta är det som syns utan att
scrolla, på telefon:

```text
a-rik-mobil-topp.png
b-rik-mobil-topp.png
c-rik-mobil-topp.png
```

**Jämförelse 2 — hur ser en person utan historik ut?** Ungefär hälften av
personregistret är leads utan kurshistorik:

```text
a-tunn-mobil.png
b-tunn-mobil.png
```

Hela sidorna finns som `a-rik-mobil.png`, `b-rik-mobil.png`, `c-rik-mobil.png`
och motsvarande `-desktop`. Desktop är samma spalt centrerad och avgör
ingenting nytt här.

De tre arrangemangen i klartext:

- **A — historik-först.** Identitet, tre nyckeltal och en kursmix, sedan
  kurshistoriken som sidans huvudyta. Historiken grupperad per event, inte per
  kursdag. Svarar på "vem är detta för oss?".
- **B — kontakt-först.** Tät identitetszon, sedan kontaktvägarna som
  handlingsrader (skicka mail, ring), sedan ett "Just nu"-kort. Historiken
  komprimerad till tre rader längre ned. Svarar på "hur når jag hen och vad
  behöver jag veta nu?".
- **C — tidslinje.** Identiteten krymper till en remsa, allt daterbart hamnar i
  en kronologisk ström med kommande överst. Svarar på "vad har hänt med den här
  personen?".

### 3. Frågan som avgör

1. **Vad gör Lotta oftast i sekunden hon öppnar en person?** Slår hon upp något
   mitt i något annat — "vem är det som ringer", "vad hette hens mejl" — vinner
   B. Öppnar hon oftare en person för att förbereda ett samtal eller ett event
   vinner A.
2. **Hur stor del av personregistret är leads utan historik?** Underlaget säger
   ungefär hälften. Stämmer det avgör den tunna sidan mer än den rika.
3. **Är "vem är detta för oss" en fråga som hör hemma här — eller besvaras den
   redan på eventsidans deltagarkort?** Deltagarkorten fick metadata och
   historikrad tidigare i år. Om svaret redan finns där tappar A sitt starkaste
   argument.
4. **Är du beredd att vänta på två datainsatser för att få C?** C är den
   vackraste av de tre, men tre av fyra typer av händelser saknar datum i dagens
   data.

### 4. Vad alternativen kostar

| Variant | Optimerar för | Offrar | Vinner när |
|---|---|---|---|
| A — historik-först | Att förstå en person. Kursmixen syns på en sekund | Snabbheten. Vill du mejla måste du scrolla förbi historiken. En lead öppnar med tre nollor | Lotta öppnar en person för att förbereda något |
| B — kontakt-först | Handling. Hela kontakten och nuläget ryms utan scroll | Djupet. "Vem är detta för oss" besvaras inte | Sidan är ett uppslag mitt i något annat |
| C — tidslinje | Berättelsen. Hela relationen i en ström | Överblick över tal och status. Kontaktvägen blir en textremsa | Vi levererar händelser med datum — vilket kräver två datainsatser först |

### 5. Fällor

- **A ser ut att räkna fel.** I `a-rik-mobil-topp.png` står "3 deltaganden"
  bredvid "4 genomförda event". Det är en känd defekt i databasen, inte i
  variant A — två formler räknar olika kurstyper. Den visas med avsikt och
  drabbar varje variant som visar talen.
- **B:s "Just nu"-kort är byggt på sin bästa dag.** Raden om nästa event är
  medveten fiktion i testdatan. I drift är fältet i praktiken alltid tomt, och
  betalstatusen som skulle göra kortet verkligt handlingsbart ligger på en
  annan tabell. Kortet blir tunnare än bilden.
- **C:s ström ser rikare ut än den kan bli.** Två av tio poster kommer ur en
  textsträng som prototypen plockar isär för att formen skulle gå att pröva.
  Den metoden får inte följa med till skarpt bygge. Sex av personens viktigaste
  händelser — anmälningarna — saknar datum i dagens data och kan inte stå i
  tidslinjen alls.
- **Rubriken "Ej tillgängligt"** på den tunna personen är databasens namnformel.
  Rättas oavsett vinnare.
- **Person-id:na i bilagans README fungerar inte i webbläsaren.** De finns
  endast inuti testsviten. Öppna en riktig person via listan i stället.
- **Sidan kraschar för varje person som har en motivering.** Det är en känd
  defekt i den skarpa vyn, registrerad som eget kort, och den gäller alla tre
  varianterna. Får du "Kunde inte hämta persondetaljer" — prova en annan person.
- **Den blinkande ramen kring rubriken** när sidan laddat är avsiktlig. Vyn
  flyttar läsordningen dit när data anlänt, av tillgänglighetsskäl. Samma
  beteende i skarpa vyn.

### 6. Vad valet låser och föder

**Låser.** Vad Lotta ser utan att scrolla. Det är sidans dyraste egenskap och
den enda som inte går att flytta i efterhand utan att bygga om skelettet.

Valet låser också hur direkt sidan kan kännas. Appens regel är att navigering
aldrig väntar på data vi redan har: när du klickar en person ritas allt vi
redan känner till ur listan omedelbart, och resten fylls på. Listan bär redan
e-post, telefon, ort, nivå, antal anmälningar och antal deltaganden — men inte
antal genomförda event, kursmixen eller historiken. Följden: **B:s toppzon kan
ritas direkt. A:s kan det inte** — dess tre tal och kursmix måste stå som grå
platshållare medan hämtningen går, eftersom regeln förbjuder att visa halva
sanningen som om den vore hel. Det är inte ett argument mot A, men det är A:s
pris.

Justeringar du vill ha på den valda varianten blir byggkrav på kortet.
Prototypen itereras inte i valfasen.

**Föder.** Ett spec-kort för persondetaljen plus arbetsbitar. Väljer du B blir
en av dem att bygga in A:s event-grupperade historik som sidans fjärde block.
Väljer du C föds två datainsatser före sidan alls kan byggas. Väljer du inte C
registreras den som en tråd i stället för att kastas — den dagen händelser
levereras med datum är C den självklara persondetaljen.

### 7. Min rekommendation

**B som skelett, med A:s historik-yta inbyggd som fjärde block.**

Motiv:

1. **Ovanför vecket avgör.** B ger hela kontakten och hela nuläget utan en enda
   scroll. A ger tre siffror och en färgstapel.
2. **B är den enda som håller för en lead.** `b-tunn-mobil.png` mot
   `a-tunn-mobil.png` är bilagans tydligaste bild: A öppnar med tre nollor och
   ett tomt kort, B öppnar med en knapp som gör något.
3. **A:s bästa del är ett block, inte ett skelett.** Kursmixen och den
   event-grupperade historiken är det starkaste som byggdes i passet — och de
   förlorar ingenting på att ligga som sidans fjärde block.
4. **C är för tidigt.** Den kräver två datainsatser innan den är sann.

**Om du inte håller med om punkt 1** — alltså om Lotta oftare öppnar en person
för att förbereda något än för att slå upp något — då är A rätt val, inte C. A
och B är oense om ordningen. C är oense om vad datat är, och den oenigheten går
inte att lösa i en designfråga.

### 8. Din ruta

```text
Variant (A / B / C): ______

Ev. justeringar som blir byggkrav: ______

AI-flaggan ("Stabil och mottaglig") — ska den synas för Lotta? ______
```

Den sista frågan är öppen och hör hit: det är ett internt fält som beskriver en
person i tredje person, i en vy Lotta kan ha uppe framför den personen.

---

## Beslut 3 — Markera-läget i Anmälda deltagare

### 1. Vad du bestämmer

Om markera-läget, som redan är byggt och skarpt, är godkänt — eller om det ska
tillbaka för en omgång till.

### 2. Titta här

Detta är inte en prototyp. Koden är landad och lever i appen. Öppna ett
staging-event som har **minst två obekräftade anmälningar**:

```text
http://localhost:5173/event
http://localhost:5173/event/<eventets-id>
```

Scrolla till sektionen **"Anmälda deltagare"**, välj fliken **"Alla"**, hitta
rubrikraden **"Obekräftade (N)"** och tryck **"Markera"**.

Bilderna ligger i `s90-task48-markeringslaget/`:

| | Telefonbredd | Datorbredd |
|---|---|---|
| Vilande läge | `k01-vilande.png` | `d01-vilande.png` |
| Två markerade | `k02-markera-2-valda.png` | `d02-markera-2-valda.png` |
| Alla markerade | `k03-markera-alla.png` | `d03-markera-alla.png` |

Bilderna visar endast själva blocket, inte hela sidan. Titta live för att se hur
det sitter i sammanhanget.

Det du granskar är utförandet av de åtta byggkrav du själv låste 2026-07-25.
Rivningarna som ingick — per-kort-knappen "Skicka bekräftelse" och
"Bekräfta alla"-pillen — är beslutade och ligger utanför denna bedömning.

### 2b. Ställ mot facit — det är detta som är granskningen

Till skillnad från besluten ovan finns här ett **låst facit**: prototypbilderna
du godkände 2026-07-25 med orden "Lås denna". En granskning mot facit är att
lägga bilderna bredvid varandra, inte att bilda en ny åsikt.

| | Facit (det du låste) | Levererat (det som byggdes) |
|---|---|---|
| Vilande | `s86-deltagarkort-markering/k04-vilande.png` | `s90-task48-markeringslaget/d01-vilande.png` |
| Två markerade | `s86-deltagarkort-markering/k04-markera-2-valda.png` | `s90-task48-markeringslaget/d02-markera-2-valda.png` |

Facit-bilderna togs på datorbredd — jämför därför mot `d`-bilderna, inte mot
`k`-bilderna, annars jämför du två olika skärmstorlekar.

**En avvikelse är avsiktlig och ska INTE läsas som ett fel.** På varje markerat
kort sitter en liten grön dubbel-bock till vänster om kategori-pillen. Den finns
inte i facit. Den lades till på ditt eget byggkrav 7: ett valt tillstånd får
inte bäras av färgen ensam, eftersom den som är färgblind annars inte ser vilka
kort som är valda. Bocken bor i den plats som frigjordes när "Obekräftad"-pillen
försvann — den låsta formen är alltså orörd, det tillkom ingen ny yta.

Allt annat ska se likadant ut. Ser du någon **annan** skillnad mot facit är det
ett fynd, och då ska du säga det.

### 2c. De åtta byggkraven — pricka av

Detta är kraven du låste. Kryssa dem medan du tittar; det du inte kan verifiera
i handen lämnar du blankt hellre än att gissa.

- [ ] **1.** "Markera"-knappen står på Obekräftade-rubriken där
      "Bekräfta alla" satt. I läget står "Avbryt" på **samma plats**.
- [ ] **2.** Hela kortet är klickyta. Valt kort får grön botten och grön kant.
      "Obekräftad"-pillen **försvinner** vid val — ingen "Vald"-pill ersätter
      den. Kategori-pillen ("Manuellt tillagd") står kvar.
- [ ] **3.** Baren över kön har tre knappar: "Bekräfta X anmälningar" (mutad
      vid noll valda), "Markera alla" (mutad när allt är valt) och "Rensa"
      (syns först vid minst ett val). Bekräfta-knappen **byter aldrig bredd**.
- [ ] **4.** Kön visar ungefär tre kort och rullar inuti sig själv. Det
      avklippta fjärde kortet är avsiktligt.
- [ ] **5.** Kortet har kvar allt annat: länken på "Anmäld"-raden, raden om
      tidigare event hos Miranon Media, pillar och metayta. I markera-läget
      **vilar** länkarna — texten står kvar men går inte att klicka.
- [ ] **6.** "Bekräfta X" öppnar en kontrollfråga **innan** något skickas.
- [ ] **7.** Escape lämnar läget. Fokus hamnar tillbaka på "Markera"-knappen.
      Den gröna dubbel-bocken bär valt tillstånd utöver färgen (se 2b).
- [ ] **8.** _(Ingen åtgärd för dig — bildjämförelser i den automatiska kedjan
      förnyas när den grinden aktiveras.)_

### 3. Frågan som avgör

1. **Förstår man utan förklaring hur man kommer in i läget och ut ur det?**
   In är knappen "Markera" på Obekräftade-rubriken. Ut är "Avbryt" på samma
   plats, eller Escape. Det är den enda vägen in — att klicka ett kort öppnar
   inte läget.
2. **Går det att markera rätt kort med tummen på telefonbredd?** Hela kortet är
   klickyta. Kön visar ungefär tre kort åt gången och rullar inuti sig själv;
   att fjärde kortet är avklippt är avsiktligt och ska signalera att det finns
   mer.
3. **Står knappen stilla?** Knappen "Bekräfta X anmälningar" har låst bredd så
   att den inte hoppar när antalet ändras. Mätningen säger att den är exakt lika
   bred vid 2 som vid 6 valda. Frågan är om du upplever den stabil.
4. **Saknas per-kort-knappen?** Den är riven helt, även i vilande läge.
   Genvägen för enskild bekräftelse flyttas till Hem-vyn enligt ditt eget
   beslut. Frågan är om rivningen känns rätt i handen nu när den är skarp.

### 4. Vad alternativen kostar

| Alternativ | Optimerar för | Offrar | Vinner när |
|---|---|---|---|
| Godkänn | Tempo. Kortet stängs, nästa arbete blir plockbart | Formen är låst — nästa ändring kostar en ny omgång | De fyra kontrollerna ovan går igenom |
| Underkänn | Att formen blir rätt innan den blir prejudikat | En omgång till innan check-in kan börja | Något av de fyra faller i handen |

Underkänn är ingen dramatisk händelse. Det föder en avgränsad
"review-iteration"-bit, precis som fem tidigare gånger på eventsidan.

### 5. Fällor

- **Knapp-raden radbryts på telefon.** I `k02-markera-2-valda.png` hamnar
  "Rensa" på egen rad under de två andra. Det är dagens beteende — bedöm om det
  är acceptabelt eller om det ska rättas, men läs det inte som ett fel i
  bilden.
- **Namnen i bilderna är påhittade** ("Greta Granskning" och liknande). De finns
  ingenstans i systemet.
- **Bilderna visar blocket urklippt ur sidan.** De svarar inte på hur blocket
  sitter i helheten. Den frågan besvaras endast live.
- **En andra obockad punkt på kortet gäller inte dig.** Kortet har två öppna
  punkter: din granskning, och att den automatiska kontrollkedjan ska vara grön.
  Den andra är mekanisk och hanteras av Code.

### 6. Vad valet låser och föder

**Låser.** Interaktionsgrammatiken för alla massoperationer i appen. Check-in
variant A använder exakt samma markera-läge, och allt framtida massarbete ärver
formen.

Rivningarna är redan gjorda och svåra att backa i sammanhang: två av
knappstandardens exempel beskriver knappar som inte längre finns, och listan
bär nu en not om det.

**Föder.** Godkänt: kortet stängs, och nästa arbete på eventsidans testfixturer
blir plockbart. Underkänt: en avgränsad omgång till på just det som föll.
Oavsett vilket ska genvägen för enskild bekräftelse byggas på Hem-vyn — det
kortet finns ännu inte.

### 7. Min rekommendation

**Godkänn, om de fyra kontrollerna i punkt 3 går igenom i handen.**

Jag har inte hållit ytan själv, så detta är en procedurrekommendation, inte ett
omdöme om utförandet. De två punkter jag bedömer som mest sannolika att falla är
knapp-radens radbrytning på telefon och hur upptäckbar "Markera"-knappen är för
någon som inte vet att läget finns. Faller någon av dem — underkänn den punkten
och godkänn resten. En avgränsad omgång är billigare än en form som blir
prejudikat för alla framtida massoperationer.

### 8. Din ruta

```text
Beslut (godkänn / underkänn): ______

Om underkänt — vad exakt faller: ______

Ev. justeringar som blir byggkrav: ______
```

---

## Beslut 4 — Check-in vid dörren

### 1. Vad du bestämmer

Hur check-in-sidan ska fungera när Lotta står vid dörren och deltagarna kommer
in.

### 2. Titta här

Öppna ett event — helst ett tvådagars, så sessionsväxlaren har innehåll — och
lägg till adressen nedan:

```text
http://localhost:5173/event
http://localhost:5173/event/<eventets-id>/narvaro?variant=a
http://localhost:5173/event/<eventets-id>/narvaro?variant=b
http://localhost:5173/event/<eventets-id>/narvaro?variant=c
http://localhost:5173/event/<eventets-id>/narvaro
```

Den sista är dagens vy, orörd.

Bilderna ligger i `s90-checkin-divergens/`. Utgångslägena:

```text
a-mobil.png    b-mobil.png    c-mobil.png
a-desktop.png  b-desktop.png  c-desktop.png
```

**Den viktiga jämförelsen görs inte på utgångslägena.** B och C har identiska
rader — skillnaden ligger i toppen och i vad som händer efter en incheckning.
Jämför dessa i stället:

```text
b-mobil-halvvags.png    ← 10 av 18 incheckade
c-mobil-halvvags.png    ← 10 av 18, med panelen "Senast incheckade"
```

Övriga lägen:

```text
a-mobil-markeringslage.png     ← registrets markera-läge, två markerade
b-mobil-allt-incheckat.png     ← 18 av 18, måldraget
c-mobil-sok-traff.png          ← sökning "wahl" ger en träff
c-mobil-sok-tomt.png           ← sökning utan träff
```

Varje bild finns också som `-hela` med hela sidan i höjd.

De tre arrangemangen i klartext:

- **A — registret.** Person mot session som ett rutnät, alla sex statusvärdena
  per ruta. Massmarkering bor här: "markera alla närvarande i Dag 1", plus
  markera-läget från beslut 3.
- **B — lista-först.** Alla anmälda i vald session i bokstavsordning som aldrig
  sorterar om under fingret. Ett tryck checkar in, ett tryck till ångrar. Stor
  räknare och framstegsstapel överst.
- **C — sök-först.** Ett sökfält som redan har markören, längst upp. Skriv några
  bokstäver, checka in direkt ur träfflistan. Sökningen nollställs efteråt, så
  ångra bor i en kvarstående panel längst ned. Vid tom sökning ligger hela
  listan under.

### 3. Frågan som avgör

1. **Hur många deltagare ska dörren tåla?** Bilderna visar 18. Ett
   verkligt event i basen (Medvetet Kaos) har 87 anmälda och 218 närvarorader.
   B är byggd för ungefär 15–30 och blir en rullningsövning vid 88. C beter sig identiskt vid båda. Detta är den enskilt
   tyngsta frågan.
2. **Står Lotta upp med telefonen i handen, eller sitter hon med datorn?** A:s
   rutnät kräver precision i pekandet och kapar långa namn på telefonbredd —
   men på datorskärm kapas ingenting. Står hon upp är A ute. Sitter hon vid ett
   bord är A plötsligt konkurrenskraftig även vid dörren.
3. **Hur ofta checkar hon in fel person, och när upptäcker hon det?** Upptäcker
   hon det direkt räcker B:s ångra-på-raden. Upptäcker hon det tre personer
   senare måste ångra bo i C:s kvarstående panel.
4. **Kommer folk en och en eller i klump?** B optimerar för klump — tre till fem
   personer i rad utan att lyfta blicken. C optimerar för en i taget på under
   fem sekunder.
5. **Ställer hon frågan "vem saknas ännu?" under insläppet eller efteråt?**
   Under insläppet är B:s överblick värdefull. Efteråt hör frågan till registret
   och C räcker.

### 4. Vad alternativen kostar

| Variant | Optimerar för | Offrar | Vinner när |
|---|---|---|---|
| A — registret | Fullständighet och rättning. Hela sanningen syns på en gång, alla sex statusvärdena går att sätta | Dörren. Två gester per person, precision i pekandet, kapade namn på telefon | Eventet är slut och Lotta sitter med datorn och ska få dagen rätt |
| B — lista-först | Överblick och tempo när kön kommer i klump. Man ser vilka som saknas utan att skriva ett tecken | Uppslagning. Fungerar vid 18, blir rullande vid 88. Toppen tar drygt halva skärmen innan första raden | Grupperna är små till medelstora och Lotta känner igen namnen |
| C — sök-först | En person i taget, snabbt, oavsett listans längd. Identisk vid 18 och 88 | Överblicken. "Vem saknas?" kräver att hon rullar ned. Sökfältet som töms under fingret kan kännas abrupt | Kön rör sig och varje person ska bli klar på under fem sekunder |

Ett viktigt förtydligande: **A är inte ett svagt dörrförslag — det är ett starkt
förslag på en annan yta.** Väljer du A som dörrlösning väljer du bort dörren.
Registret ska byggas oavsett, men som en egen yta på eventsidan.

### 5. Fällor

- **Ramen kring C:s sökfält ser fel ut.** Den ligger som en rektangel utanför
  fältets rundade form. Det är en app-bred defekt med eget kort, och den syns
  tydligast i C endast för att C är den enda variant som sätter markören i
  fältet automatiskt. Den försvinner när det kortet landar.
- **A visar "4 av 40", B och C visar "3 av 18". Det är ingen inkonsekvens.** A
  räknar alla rutor över båda dagarna och tar med avbokade, eftersom registret
  ska visa allt och markera dem i stället. B och C räknar en session och filtrerar
  bort avbokade. Avfärda inte A som att den räknar fel.
- **Ingen av varianterna sparar något.** Statusändringar lever i minnet och
  försvinner vid omladdning. Skrivvägen till databasen finns ännu inte alls.
  Det betyder att "det funkar ju" i prototypen underskattar den återstående
  kostnaden — men förarbetet för skrivvägen är redan gjort och kan börja i dag.
- **"Checka in"-etiketten är text, inte en knapp.** Hela raden är klickytan i
  både B och C. Vid dörren, under tidspress, är det inte självklart att man kan
  trycka var som helst. Detta är en öppen fråga till nästa steg, inte ett
  argument mot vare sig B eller C.
- **B och C ser nästan identiska ut i utgångsläget.** Gör inte jämförelsen där.

### 6. Vad valet låser och föder

**Låser.** Vilken yta som byggs som check-in-sida, var ångra-vägen bor, och
vilken skala ytan tål.

**Låser inte** skrivvägen till databasen. Den är redan avgjord av researchen:
massmarkering är inget dörr-mönster hos någon av de fem undersökta produkterna,
och därför skriver dörren per person medan registret använder de befintliga
automationerna. En skrivväg per situation.

**Föder.** Ett spec-kort med tio arbetsbitar. Tre av dem — skrivvägen,
läsningen som ska bära e-post och anmälningsstatus, och åtkomsten i
produktionsmiljön — är helt oberoende av ditt val och **kan börja i dag**. Det
var hela poängen med förarbetet: när du valt variant ska bygget starta på
bit fyra, inte på bit ett.

Den bit som svänger på valet är registret. Vinner A blir registret dörrytan.
Vinner B eller C byggs registret ändå, men som egen yta på eventsidan. Att
kasta A vore att kasta bort halva närvaro-problemet.

Väljer du C föds dessutom två byggkrav ur B: framstegsstapeln med "N kvar"
ovanför listan, och texten "tryck för att ångra" på raden som andra väg
tillbaka. Väljer du B ska sökfältet flyttas ned i tumzonen och bli klistrat.

### 7. Min rekommendation

**C — sök-först, med två saker inlyfta från B.**

Motiv:

1. **Den enda som skalar med verkligheten.** 87 anmälda på Medvetet Kaos.
   B:s bläddring fungerar i bilderna för att testdatan har 18 personer.
2. **Uppslagning slår bläddring, och det är belagt.** Alla fem undersökta
   produkter lägger en uppslagningsyta ovanpå listan. Personen framför dig är en
   känd post som ska hittas, inte upptäckas.
3. **Den löser ångra-frågan strukturellt.** C:s panel är alltid synlig i
   tumzonen. B:s ångra-på-raden fungerar endast så länge raden syns — och slutar
   fungera i samma sekund man börjar söka, vilket B ändå tillåter.

De två sakerna från B: framstegsstapeln med "N kvar" ovanför listan, och
"tryck för att ångra" kvar på raden. Stapeln svarar på "är vi snart klara?" med
en blick, och det är en fråga som faktiskt ställs vid dörren.

**Om du väljer B ändå** är det ett legitimt val och inget misstag. Det är rätt
om du bedömer att Lottas grupper i praktiken är 15–25 personer och att
överblicken väger tyngre än hastigheten per person. Då ska sökfältet ändå
flyttas ned i tumzonen.

**A byggs oavsett** — men som registret på eventsidan, inte som dörren.

### 8. Din ruta

```text
Variant (A / B / C): ______

Ev. justeringar som blir byggkrav: ______

Ska sökningen nollställas efter varje incheckning (gäller om C väljs)? ______

Ska "Checka in"-etiketten bli en riktig knapp, eller bort helt? ______
```

---

## När allt är valt

### Vad Code gör härnäst, i ordning

1. **Markera-läget stängs eller får en omgång till.** Godkänt betyder att
   kortet flippas till klart och att nästa arbete på eventsidans testfixturer
   blir plockbart. Underkänt betyder en avgränsad bit.
2. **Spec-kort för personlistan**, delat i ungefär sex till åtta arbetsbitar —
   en per stegblock, plus den obligatoriska bit som migrerar de sju automatiska
   testerna i samma sväng.
3. **Spec-kort för persondetaljen**, ungefär fem till sju bitar. Väljer du C
   föds två datainsatser före sidan alls kan byggas.
4. **Spec-kort för check-in**, tio bitar enligt en färdig karta. Tre av dem kan
   startas omedelbart, oberoende av ditt val.

Bit 1–3 i check-in-kortet kräver inget beslut av dig och kan skrivas som kort
redan innan du valt variant.

### Ett beslut till som väntar

När check-in-kortet grillas dyker en femte fråga upp som hänger i ditt val:
**vem ska bokföras som den som checkade in?** Databasens fält registrerar den
som tekniskt sett skrev, vilket blir systemets konto och inte Lotta.
Rekommendationen är att acceptera det, dokumentera det som en känd fälla, och
skriva ned vad som ska utlösa en riktig lösning: att fler än en person börjar
checka in på samma event. Väljer du i stället ett eget fält i databasen faller
slutsatsen att den befintliga skrivvägen räcker, och check-in kräver då eget
serverarbete, två nya fält över två miljöer och en hård driftsättningsordning.

### Byggkrav som gäller oavsett vad du väljer

Dessa kan skrivas in i korten direkt.

#### Personlistan

- Rubriken "Ej tillgängligt" på namnlösa personer rättas — det är databasens
  namnformel som slår igenom.
- Sökfältets ram visas i dag vid all fokusering, även med mus. Formen ärvdes
  från eventväljaren där den hörde hemma. Rättas.
- Listans tekniska märkning behålls oförändrad — sex automatiska tester och hela
  läsordningen för skärmläsare hänger i den.
- Antalet grå platshållarrader medan sidan laddar bekräftas mot verklig
  sidhöjd.
- Bokstavsgruppering byggs inte. Sidorna hämtas en i taget, så en bokstavsgrupp
  kan skäras mitt itu vid sidgränsen.

#### Persondetaljen

- Rubriken "Ej tillgängligt" — samma rättning som ovan.
- "Ej närvaro" på framtida event är fel. Alla tre varianterna härleder ett
  tredje läge, "Kommande", ur datumet.
- "Aktiv anmälan: Ingen aktiv anmälan" — fältet är aldrig tomt, så jämförelsen
  måste göras mot värdet, inte mot om fältet finns.
- Tvådagars-event dubbelräknas i dag. Historiken grupperas per event.
- "Senaste kontakt för 3 dagar sedan: 2026-09-12 18:04 – Inskickad anmälan" bär
  dubbelt datum, varav ett i råformat. Det bryter appens datumspråk, som skriver
  "26 september" och aldrig "2026-09-26". Antingen delas fältet upp på servern,
  eller visas endast den relativa tiden med den exakta i en tooltip. Välj
  aktivt, inte tyst.

#### Check-in

- Skrivvägen till närvarofältet, med rätt behörighetsrad. Den raden ligger
  färdigskriven i förarbetet.
- Läsningen utökas med e-post och anmälningsstatus, så att två personer med
  samma namn går att skilja åt vid dörren.
- Närvaroläsningen släpps in i produktionsmiljön — den är stängd i dag.
- Avbokade måste filtreras bort. Ingen automation raderar deltagandet vid
  avbokning, så utan filtret visas avbokade som incheckningsbara.
- Incheckat tillstånd bärs av symbol och text, aldrig av grön färg ensam.
- Räknaren har låst bredd så att siffran inte flyttar sig under fingret.
- Sparandet sker optimistiskt med möjlighet att backa. Det är ett golv, inte en
  förfining: automationen som stämplar fältet tar upp till en minut, så
  resultatet kan aldrig visas direkt.
- Vald session visas alltid och går alltid att styra om. Fel session ger fel
  kurshistorik utan att någon ser det.

#### Tvärs över allt

- Kortet för persondetaljens krasch bör landa så att du kan verifiera mot
  staging utan att stöta på felet.
- Kortet för dynamisk sidtitel bör landa innan check-in får en egen adress.
- Kortet för den app-breda fokusramen bör landa före check-ins slutgranskning,
  så defekten inte bokförs som check-ins.
- Bildjämförelserna i testsviten kommer att drifta avsiktligt när formerna
  ändras. De uppdateras samlat i ett eget spår, inte per bit.

---

Guiden bygger på inventeringen av S90 och på de tre bilagornas README-filer.
Varje adress, filnamn och bildnamn i dokumentet är verifierat mot disk
2026-07-26.
