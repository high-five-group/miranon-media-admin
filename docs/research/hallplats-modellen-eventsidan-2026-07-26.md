---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Hållplats-modellen på eventsidan — nulägeskarta, prövning och alternativ (Code, 2026-07-26)

> **Proveniens:** avgränsat utforsknings- och kartläggningspass (S91),
> 2026-07-26. Ingen produktionskod rörd — passet är läsning plus denna fil.
> Kod-påståenden är lästa ur `origin/main` @ `029a175`; bas-påståenden ur
> `docs/reference/data-model.md` plus read-only-läsning mot **staging**
> (`apphjj8Q7lkXCMsL4`). Prod rördes inte. Branschpåståenden är verifierade
> mot angiven käll-URL samma dag; tunn precedent-rymd deklareras öppet.
> Underlaget ska mata en **grillning**, inte ett bygge.

---

## Frågan

Marcus i design-review 2026-07-26 (S91):

> "Blocket 'Anmälda deltagare' borde bara hantera anmälningsbekräftelse liksom.
> Blocket har idag 'Betalningspåminnelse skickad' och 'Eventinfo skickad', hela
> den grejen borde ju flyttas ner till Betalningar-blocket, eller hur? Steg 1 är
> ju de hamnar under anmälda där man administrerar anmälningsbekräftelse,
> därefter bör ju alla personer liksom 'flyttas' ner till Betalningar-blocket som
> hållplats 2, där administrerar man betalningar, och först när allt är betalt
> skickar man ju eventinfo."

Förslaget är en **hållplats-modell**: eventsidans block blir stationer i ett
arbetsflöde, och personer vandrar mellan dem.

**Bedömningskriteriet som väger tyngst i detta underlag** (Marcus, samma dag):
*"extremt bra och proffsigt, och framförallt logiskt och extremt enkelt för
Lotta."* Lotta är enda faktiska användaren av produktsidan, hon sitter inte i
verktyget dagligen, och hon ska förstå sidan utan att någon förklarat den
(Gunilla-principen). Där branschmönstret krockar med begripligheten för en
ovan användare vinner begripligheten — krocken skrivs ut, inte jämkas ihop.

---

## Sammanfattning — sex svar

1. **Marcus har rätt om ordningen och fel om mekanismen.** Sekvensen bekräfta →
   betala → informera är korrekt och dessutom inbyggd i datat på ett sätt han
   sannolikt inte känt till: slutbetalnings-deadline och eventinfo-gränsen är
   **exakt samma dag** (start − 14 dagar, samma regel i två kodfiler och i
   basens formelfält). Men det finns **ingen betalnings-grind** för eventinfo
   någonstans — inte i koden, inte i basen, inte i ordlistan, inte i historiken.

2. **Det finns över huvud taget ingen eventinfo-motor.** Krysset "Schemalagt att
   skickas automatiskt 20 juli" på skärmen skriver två fält som *ingen kod
   läser*. Det är öppet bokfört i kod och ordlista — men **inte** på skärmen.
   För Lotta ser krysset ut som ett löfte. Det är det enskilt största
   Gunilla-problemet på sidan idag.

3. **Marcus har rätt om betalningspåminnelse-raden och fel om eventinfo-raden.**
   Påminnelse-RÄKNAREN står i Anmälda deltagare medan påminnelse-HANDLINGEN och
   påminnelse-HISTORIKEN står i Betalningar — en genuin split, som ska lagas.
   Eventinfo är däremot varken anmälnings- eller betalnings-domän. Flyttas den
   till Betalningar påstår sidan tyst att eventinfo hänger på betalning, vilket
   är osant idag.

4. **Tillståndsrymden är ett NÄT, inte en kedja.** Bekräftelse och betalning är
   två oberoende axlar, och sex verkliga fall faller utanför kedjan (se Del 3).
   Ett av dem är belagt i data: en person kan vara **obekräftad och betald**
   samtidigt, och dagens UI låter Lotta göra just det.

5. **TASK-18.20 är inte i konflikt med hållplats-frågan — den är BLOCKERAD av
   den.** Två av kortets fyra öppna Marcus-frågor (A2 handlingsuppsättningen, A3
   Åtgärds-radernas form) kan inte besvaras utan att sidans struktur är avgjord.
   Ungefär 60 % av kortet överlever vilken omstrukturering som helst.

6. **Branschen väger entydigt mot data-domäner med filter** — och ingen
   verifierad källa visar en deltagar-pipeline. Men Splash och Luma visar en
   MELLANFORM som ger hållplats-KÄNSLAN utan hållplats-MODELLEN, och den formen
   är också den som klarar Lotta-testet bäst. Det är rekommendationen.

---

## Del 1 — Nulägeskartan, block för block

### 1.1 Vad Lotta ser, uppifrån och ned

Facit-bilden (`tasks/sessions/bilagor/s73-eventsida-konvergens/FACIT-eventsidan-helsida.png`)
och koden är överens. Ordningen är låst i PRD task-18 § Lösning.

| # | Vad hon ser på skärmen | Vad blocket ÄR | Skriver den något? |
|---|---|---|---|
| 0 | Eventnamnet som rubrik + `Event-21`-pill + "3 veckor kvar till eventet" | Identitet + eventväljare | Nej |
| 1 | **Gå till check-in** (rubriklöst kort, chevron) | Ingång | Nej — leder tills vidare till Närvaro-sidan (check-in-sidan finns inte) |
| 2 | **Åtgärder** — sex numrerade rader | Handlingslista | 1 och 6 fungerar. **2, 3, 4 och 5 gör ingenting** |
| 3 | **Om eventet** — Typ · Ort · Datum · Status + *Ändra* | Fakta | `update-event` |
| 4 | **Beläggning** — Max antal platser · Extra platser · Anmälda deltagare · Manuellt tillagda · Medföljande · Väntelista + mätare "11 av 12 platser upptagna · 92 %" + *Ändra* | Kapacitet (bara SIFFROR — inga namn) | `update-event` |
| 5 | **Anmälda deltagare** — fem summeringsrader, tre flikar, Obekräftade-kön, Bekräftade-registret | Arbetskö + register | Se 1.2 |
| 6 | **Betalningar** — två räknerader + *Öppna detaljer* → arbetsytan | Betalnings-arbetsyta | Se 1.3 |
| 7 | **Närvaro** | Register — endast för genomförda event, annars "Eventet är inte genomfört ännu" | Nej (ren läsning) |
| 8 | **Gruppdynamik** — "Vant hos Miranon Media först 7 av 10" + nivågrupper + motiveringar | Läsning om gruppen | Nej |
| 9 | **Anteckningar** — skrivruta + ström | Eventets minne | `create-event-note` |

### 1.2 Anmälda deltagare i detalj

**Fem klickbara summeringsrader** (S73-facit K40/K42; `Deltagare.tsx` 1157–1217):

| Rad | Vad den visar | Vad klicket gör | Vilket fält den läser |
|---|---|---|---|
| Obekräftade anmälningar | `2` (röd om > 0) | filtrerar på obekräftade | `Status` |
| Anmälningsbekräftelse skickad | `8 av 10 −2` | filtrerar på de som FÅTT | tidsstämpeln `Bekräftelse skickad` |
| Betalningspåminnelse skickad | `2` | filtrerar på de som fått | **tre** parallella tidsstämplar |
| Eventinfo skickad | `0 av 10 −10` + signal-slot | filtrerar på de som SAKNAR | `Deltagarinfo skickad` |
| Bor över | `2` (säng-ikon) | öppnar **kryss-läget** med ALLA aktiva | `Bor över` |

Under eventinfo-raden står en permanent reserverad slot (K44) som visar
**antingen** en gul badge "Dags att skicka — eventet är om 11 dagar" **eller**
kryssrutan "Schemalagt att skickas automatiskt 20 juli" / "Skickas inte
automatiskt". Aldrig båda.

**Tre flikar:** `Alla (10)` · `Manuella (2)` · `Medföljande (1)`.

**Två sektioner:**
- **Obekräftade (2)** — FAST rubrik utan chevron (revs 2026-07-26, task-48
  review-våg 2), max ~3 kort med inline-scroll, mörk solid **Markera**-knapp.
  I markera-läget: batch-bar `[Bekräfta 2 anmälningar]` `[Markera alla]`
  `[Rensa]` + kontrollfråga.
- **Bekräftade (8)** — FÄLLBAR rubrik med chevron. **Ren läsyta. Ingen handling
  alls.** (Det är precis detta TASK-18.20 vill rätta.)

**Vad blocket faktiskt SKRIVER:** tre saker och inget mer.
`send-registration-confirmation` (`Status` + `Bekräftelse skickad`, batch,
pessimistisk) · `set-registration-lodging` (`Bor över`) · `update-event`
(`Deltagarinfo schemalagd` + `Deltagarinfo auto-utskick avstängt`, via krysset).

### 1.3 Betalningar i detalj

Två räknerader: "Anmälningsavgifter 5 av 8 mottagna **−3**" och
"Slutbetalningar 2 mottagna **−6**". Sedan **Öppna detaljer ▾** (K27, Marcus
"stanna på samma sida" — ersatte navigationen till en egen betalningsvy).

Utfälld arbetsyta: två flikar `Saknar betalning (6)` / `Klara (2)`, en
deadline-badge ("Deadline 20 juli · om 3 dagar" → gul imorgon/idag → röd
passerad), och per person: **namnet** (länk till personsidan) + en rad per
betalning med kryss + fritt noteringsfält + en mailikon **Påminn** + en tyst
påminnelsehistorik ("Påminnelse om slutbetalning skickad 16 juli").

Fyra skrivvägar: `mark-registration-fee-paid` · `mark-final-payment-paid` ·
`update-registration-payment-note` · `log-payment-reminder`.

**Viktig detalj om Påminn-ikonen:** den skickar inget mail. Den öppnar en
`mailto:` i Lottas mailklient och **antecknar samtidigt tidsstämpeln** i basen —
alltså loggas påminnelsen som skickad även om Lotta stänger mailfönstret utan
att skicka. Öppet bokfört i `Betalningar.tsx` (K32/K33), men värt att veta när
räknaren "Betalningspåminnelse skickad: 2" ska tolkas.

### 1.4 Åtgärder — fyra av sex rader gör ingenting

| # | Radens text | Läge |
|---|---|---|
| 1 | Lägg till manuell anmälan | **fungerar** (länk) |
| 2 | Skicka bekräftelsemail till obekräftade | grå — *ersatt i praktiken av Markera-läget, men står kvar* |
| 3 | Skicka betalningspåminnelse till obetalda | grå — flödet finns inte |
| 4 | Markera alla obetalda som betalda | grå — flödet finns inte |
| 5 | Skicka eventinfo till alla anmälda | grå — flödet finns inte |
| 6 | Skriv ut denna detaljsida | **fungerar** |

Detta är i sig ett Lotta-problem oberoende av hållplats-frågan: sidans första
handlingsblock består till två tredjedelar av knappar som inte gör något. Det
kan hon inte gissa sig till.

### 1.5 Dubbleringen — var samma person förekommer

Detta är kärnan i Marcus observation, och den är större än de två raderna han
pekade på.

**Anna Ek, aktiv anmälan på ett kommande event, står med NAMN på tre ställen
samtidigt** (fyra om Bor över-läget är öppet):

| Block | Var hon står | Vad blocket säger om henne |
|---|---|---|
| Anmälda deltagare | i **Obekräftade** *eller* **Bekräftade** — exakt en av dem | bekräftelseläge, kategori, tre utskicks-datum, kurshistorik |
| Anmälda deltagare → Bor över-läget | i listan över **ALLA** aktiva | om hon sover över |
| Betalningar → arbetsytan | i **Saknar betalning** *eller* **Klara** | två betalningsrader + noteringar + påminnelsehistorik |
| Gruppdynamik | i sin **erfarenhetsnivå-grupp** (+ som citat om hon skrivit motivering) | hur många event hon gått |
| Närvaro | *endast* om eventet är **Genomfört** | närvaro per session |

Fyra observationer ur den kartan:

1. **Betalningar visar inte om personen är bekräftad.** `BetalningsPersonRad`
   renderar namn + betalningsrader, punkt. En obekräftad person står i
   betalningslistan utan minsta markering.
2. **Betalningar visar inte att någon är medföljande.** Kategori-pillen
   ("Medföljande", "Manuellt tillagd") finns bara i Anmälda deltagare. I
   Betalningar kan Lotta alltså jaga en `+1` för en betalning som
   huvudanmälaren äger. Det är ett konkret vardagsfel.
3. **Räknaren och handlingen är åtskilda för betalningspåminnelser.** Siffran
   står i Anmälda deltagare, mailikonen och historiken i Betalningar. **Här har
   Marcus alldeles rätt.**
4. **Eventinfo har ingen handling någonstans.** Räknaren och krysset står i
   Anmälda deltagare; den enda "handlingen" (Åtgärds-rad 5) är grå. Att flytta
   räknaren till Betalningar flyttar den inte till sin handling — den har ingen.

---

## Del 2 — Vad styr eventinfo? (passets viktigaste fråga)

**Svar: idag styr ingenting eventinfo, för det finns ingen motor. Det som
FINNS är en datum-härledd signal och två schema-fält. Betalning ingår
ingenstans — varken i kod, bas, ordlista eller historik.**

### 2.1 Sju belägg

1. **Ordlistan** (`ORDLISTA.md`, "Eventinfo"): *"den praktiska informationen
   inför eventet …, som går ut cirka två veckor före start."* Ingen
   betalningsvillkorlighet. Kanoniskt domänspråk, ägt av Marcus själv.

2. **Signalens kod** (`Deltagare.tsx` 162–193): `EVENTINFO_DAGAR_FORE = 14`;
   `eventinfoSignal()` tänder när dagens datum passerat start − 14 och eventet
   inte startat. Enda extravillkoret (rad 1150–1152) är att *någon saknar*
   eventinfo. **Filen läser inte ett enda betalningsfält** — `PaymentStatus`
   importeras inte ens.

3. **Krysset** (`AutoKryss`, `Deltagare.tsx` 559–603) skriver
   `Deltagarinfo schemalagd` (datum) och `Deltagarinfo auto-utskick avstängt`
   (checkbox) via `update-event`. Datum + opt-out. Inget betalningsvillkor.

4. **Airtable-automationerna A1–A11** (`data-model.md` § Automationssekvenser):
   ingen av dem rör eventinfo. A6 = fullbokat-notis · A7 = synk av ej betalda ·
   A8/A9/A10 = närvaro · A11 = personkoppling · A1–A5 = anmälnings- och
   lead-kedjorna. **Det finns alltså ingen automation som skickar eventinfo, och
   följaktligen ingen som grindar den.**

5. **`send-email`-EF:en i DETTA repo** (ADR-067) är ett *segment*-bulkutskick med
   fritt ämne och fri mailtext. Den känner inte till mallen
   `medveten-kontakt-deltagarinformation` och skriver inte `Deltagarinfo
   skickad`. Sökning på `participant-info` i `supabase/` och `src/` ger **noll
   träffar**. `type='participant-info'`-vägen som `data-model.md` beskriver är
   Vue-erans EF, inte denna app.

6. **Det enda verkliga eventinfo-utskicket i loggen** (`data-model.md` § Skarpa
   skick, rad 988): 2026-04-16 09:48, mallen
   `medveten-kontakt-deltagarinformation`, **74 mottagare** — *"75
   incheckning-aktiva minus 1 (Ulrika Arvas — saknar e-post). Bulk-utskick.
   Lotta körde själv i admin."* Urvalskriteriet var **aktiv**, inte **betald**.

7. **PRD task-18 § Utanför omfattningen:** *"Eventinfo-auto-utskickets MOTOR
   (schemaläggnings- och utskicksmekaniken — eget framtida beslut, trolig egen
   ADR)."* Beslut 14 säger dessutom uttryckligen att signalen *härleds ur
   tvåveckorsgränsen*.

### 2.2 Fyndet som förenar de två bilderna

`Betalningar.tsx` rad 86: slutbetalnings-deadline = `startdatum − 14 dagar`.
`Deltagare.tsx` rad 163: eventinfo-gränsen = `startdatum − 14 dagar`.
Basens formelfält `Deadline slutbetalning` bär samma regel (verifierat i
staging: startdatum 2025-10-20 → deadline 2025-10-06).

**Slutbetalnings-deadlinen och eventinfo-datumet är samma dag.**

Marcus mentala modell ("först när allt är betalt skickar man eventinfo") och
kodens datumregel pekar alltså på **samma ögonblick** i tidslinjen. Hållplats 2
stänger och hållplats 3 öppnar på samma datum, by construction. Sekvensen är
riktig; det som saknas är att någon *sagt* det, och att någon *bygger* det.

### 2.3 Vad frågan till Marcus egentligen är

Inte "datum eller betalning". Utan:

> **Ska eventinfo bli ett PER PERSON-utskick som grindas på betalning — eller
> förbli ett PER EVENT-bulkutskick på ett datum?**

Det är en produktdesign-fråga, inte en beskrivning av nuläget, och den är den
enda som avgör om hållplats 3 finns. Fyra konsekvenser att väga:

- **Bekräftelse och betalning är per person. Eventinfo är idag per event.** De
  är inte samma sorts sak, vilket är precis varför eventinfo skaver som
  hållplats 3 i en person-pipeline.
- **En grind låser fast icke-betalarna.** Se Del 3, fall B: en person som aldrig
  betalar får då aldrig praktisk information om ett event hon fortfarande är
  anmäld till och mycket väl kan dyka upp på.
- **Föreläsningar har ingen slutbetalning** (`Ej relevant`). "Allt betalt"
  betyder olika saker för olika eventtyper.
- **Motorn är uttryckligen utanför task-18:s omfattning.** En betalningsgrind är
  en del av motorn. Beslutet kräver alltså sin egen ADR och sitt eget kort.

**Rekommendation på just denna punkt:** behåll datumregeln som *signal* och gör
betalningsläget till *filter på mottagarna* när motorn byggs — exakt det
mönster branschen använder (Del 5: Luma grindar påminnelser på
godkännandestatus, aldrig på betalning). Och laga omedelbart det som är
osant på skärmen: krysset ska inte lova ett automatiskt utskick som ingen kod
utför.

---

## Del 3 — Hållplats-modellen prövad mot verkligheten

Modellen förutsätter att en person rör sig i en sekvens. Basen har **två
oberoende axlar** plus en logg:

- **Bekräftelse-axeln** — `Status`, sex värden: Obekräftad · Bekräftad (mail
  skickat) · Betalningspåminnelse skickad · Avbokad/Ombokad · Flytta till
  väntelista · Inställt.
- **Betalnings-axeln** — `Anmälningsavgift` (Mottagen / Ej mottagen) och
  `Slutbetalning` (Mottagen / Ej mottagen / Ej relevant). **Helt oberoende av
  Status.**
- **Utskicks-loggen** — tre tidsstämplar (bekräftelse, påminnelse ×3, eventinfo).
  Detta är en logg över vad som *hänt*, inte ett tillstånd personen *är i*.

Sex fall som faller utanför kedjan:

### A. Betald men obekräftad — **belagt, och nåbar i dagens UI**

`create-registration` skriver inte betalfälten (allowlisten:
`Förnamn, Efternamn, E-post, Mobilnummer, Källa, Status, Antal platser,
Notering, Inskickad, EventKey, Event`). Betalning sätts alltid manuellt av
Lotta. Och **Betalningar-blocket visar alla aktiva anmälningar oavsett
bekräftelseläge** — hon kan alltså kryssa "Anmälningsavgift" för en person som
står i Obekräftade-kön.

Verifierat i staging (read-only, 2026-07-26): fyra anmälningar med
`Status = Obekräftad` **och** `Anmälningsavgift = Mottagen`, samtliga
`Källa = Manuell`. *(Caveat: staging-fixturer, syntetiska. Vad som är bevisat är
att tillståndet är representerbart och nåbart i UI:t — inte hur ofta det
inträffar i prod.)*

Att det är just manuella anmälningar är logiskt: bekräftelsemailet bär
betalningsinstruktionerna (ORDLISTA), så i formulärflödet *kan* betalningen
knappast komma först. Men en telefonanmälan som Lotta lägger in och som
personen swishar direkt hamnar precis här.

**Under en hållplats-modell står hon på två hållplatser samtidigt.**

### B. Bekräftad men betalar aldrig — **hon fastnar, permanent**

`Status` har inget "obetald"-värde och betalfälten har ingen "avskriven"-form.
Deadline passerar → badgen blir röd "Deadline passerad · 20 juli". Eventet
genomförs. Personen står kvar i "Saknar betalning" för alltid. Enda utgången är
att Lotta manuellt sätter `Avbokad/Ombokad`, vilket är ett annat påstående.

Under en betalnings-grind för eventinfo betyder det: hon får aldrig
eventinfo, och dyker sannolikt upp ändå utan att veta tider och plats.

### C. Avbokad/Ombokad — **försvinner tyst ur tre block, men står kvar i ett**

`arAktiv()` filtrerar bort henne ur Anmälda deltagare, Betalningar och
Gruppdynamik. Ingenstans på sidan står det att någon avbokat — siffran bara
sjunker. Men A3 har redan skapat hennes Deltaganden-rader, och avbokningen tar
inte bort dem, så **på ett genomfört event står hon kvar i Närvaro-registret**.

Det är en inkonsekvens oavsett hållplats-frågan, och en Lotta-fälla: hon kan
inte se att någon hoppat av.

### D. `Inställt` och `Flytta till väntelista` — **räknas idag som BEKRÄFTADE**

`arBekraftad(r) = r.status !== 'Obekräftad'`. Alla fyra icke-obekräftade,
icke-avbokade statusvärden hamnar därmed i Bekräftade-registret — inklusive
`Inställt` (arrangör-initierat) och `Flytta till väntelista`. Basens egen
`Är aktiv`-formel gör samma sak, så koden ljuger inte om basen; men båda ljuger
om verkligheten. **Kandidat för bas-maximeringen (T16).**

Är hela *eventet* inställt (`Eventplanering.Status = Inställt`) renderas sidan
som vanligt, och Närvaro visar "Eventet är inte genomfört ännu". Hela
hållplats-kedjan är då meningslös men syns inte som meningslös.

### E. Medföljande (`+1`) och väntelista — **egna banor, olika sorters**

- **Medföljande** är en helt vanlig anmälan med `Källa = '+1'` plus en länk
  `Medföljande till` huvudanmälan. Egen `Status`, egna betalfält, egen
  bekräftelse. Samma bana alltså — men betalningen är i praktiken ofta
  huvudpersonens. Och i Betalningar syns inte att namnet är en `+1`.
- **Väntelista betyder tre olika saker på samma sida:** (1) `Väntelista`-tabellen
  — personer i kö, visas *bara* som en siffra i Beläggning, aldrig som namn;
  (2) `Källa = Väntelista` — personer som flyttats UPP, vanliga anmälningar med
  pillen "Från väntelistan"; (3) `Status = Flytta till väntelista` — personer på
  väg NER, som idag landar i Bekräftade-registret (se D).

### F. Föreläsningar — **halva hållplats 2 saknas**

`Slutbetalning = 'Ej relevant (för föreläsningar)'` renderas som stilla text
utan kryss, och `slutKlar()` räknar den som klar. Summeringsraden visar då
"0 mottagna" utan delta — ärligt men märkligt läsbart. "Allt betalt" har alltså
olika innebörd per eventtyp, och en generell betalningsgrind måste hantera det
explicit.

### Slutsats för Del 3

**Tillståndsrymden är ett nät. Det ska sägas rakt ut.** Två oberoende axlar plus
en logg ger fler kombinationer än kedjan rymmer, och sex verkliga fall bryter
sekvensen.

**Men — och detta är lika viktigt — det dödar inte modellen.** Merparten av
volymen följer kedjan, och *Lottas arbete* är sekventiellt även när *datat* inte
är det. Frågan är inte om kedjan är sann för alla, utan **vad sidan gör med de
som inte följer den**. En modell som *flyttar* personer måste svara på var
undantagen hamnar. En modell som *märker* personer behöver bara ge dem en ärlig
etikett. Det är hela skillnaden mellan alternativ B och C i Del 6.

---

## Del 4 — Kollisionen med pågående arbete

### 4.1 Läget just nu

- **TASK-48** (*Markera-läget i Anmälda deltagare*) — `In Progress`,
  `ready-for-agent`. Två review-vågor landade idag. Öppen DoD: CI + Marcus
  design-review. **Kod är i rörelse i `Deltagare.tsx` medan detta skrivs.**
- **TASK-18.20** (*Bekräftade-sektionen till paritet med Obekräftade*) — skapat
  idag 11:32, `To Do`, **oetiketterat** (alltså inte plockbart), beroende av
  TASK-48. Låst på fyra Marcus-beslut (A1–A4) plus två Code-fynd (B1–B2).

### 4.2 Hur de två idéerna förhåller sig — punkt för punkt

TASK-18.20 beställer att **Bekräftade** ska få markera-läge och
batch-handlingar. Hållplats-modellen säger att bekräftade personer ska *lämna*
det blocket. Ytligt ser det ut som en direkt motsättning. Det är det inte.

| Del av 18.20 | Under hållplats-modellen | Bedömning |
|---|---|---|
| **AC #3** — generalisera `MarkeringsBatchBar` till en handlings-uppsättning (etikett, ikon, intent, dialogtext, mutation som indata) | Krävs *oavsett* — varje station behöver sina egna handlingar i samma bar | **Helt förenligt. Bör byggas först i båda världarna.** |
| **AC #2** — markera-läge på Bekräftade i samma grammatik | Mekaniken följer med dit sektionen tar vägen; bara *var* den monteras ändras | **Förenligt; wiring och tester måste skrivas om** |
| **AC #4** — delmängds-operationer med kontrollfråga, pessimistisk bulk, ärligt delutfall | Oförändrat krav | **Helt förenligt** |
| **A2** — *vilken* uppsättning batch-handlingar registret ska bära | Hållplats-modellen **besvarar frågan**: markera betald + påminnelse hör till Betalningar, eventinfo till en tredje yta | **18.20 är blockerad av strukturfrågan** |
| **A3** — Åtgärds-radernas allt-eller-inget-form | Samma sak: under stationsmodellen blir rad 3+4 Betalningars, rad 2 Anmäldas, rad 5 eventinfons — och genvägs-varianten (b) blir den självklara | **18.20 är blockerad av strukturfrågan** |
| **A1** — inline-scroll på Bekräftade | Meningslös om sektionen försvinner eller blir ett filter | **Utesluts / faller bort** |
| **B2** — fällningen × lägesöppnaren (force-open-lappen) | Meningslös om sektionen inte längre är en egen fällbar panel | **Utesluts / faller bort** |
| **B1** — två samtidiga markera-lägen | Blir **mer** relevant: en station = ett läge, och de kan krocka | **Förstärks** |
| **AC #5** — Åtgärds-radernas rivning/ändring bokförd, numreringens referentbarhet | Oförändrat krav, större omfattning | **Förenligt** |
| Ramen "**paritet med Obekräftade**" | Faller — det finns inget "Obekräftade" att ha paritet med om båda blir filter | **Ramen måste skrivas om** |

**Utfall: cirka 60 % av kortet överlever vilken omstrukturering som helst, och
den delen (AC #3, den generaliserade batch-baren) är dessutom det som måste
byggas först i alla varianter. Det som faller är A1, B2 och kortets ram.**

**Den skarpaste formuleringen:** 18.20 kolliderar inte med hållplats-frågan — den
är **blockerad** av den. A2 och A3 är hållplats-frågan i förklädnad. Marcus kan
inte svara på "vilka batch-handlingar ska registret bära" utan att först ha
avgjort om det *finns* ett register.

### 4.3 Billigaste ordningen

1. **Låt TASK-48 landa.** Den är i flykt, koden rör sig, och dess mekanik är
   fundamentet i alla alternativ. Rör den inte.
2. **Grilla hållplats-frågan** (detta underlag) och lås strukturen + svaret på
   eventinfo-frågan i Del 2.3.
3. **Skriv om TASK-18.20** mot den valda strukturen. Behåll AC #3 ordagrant —
   generaliseringen av batch-baren är sann i alla utfall.
4. **Bryt ut eventinfo-motorn** till eget kort med egen ADR om betalnings-grinden
   väljs (PRD task-18 lägger den uttryckligen utanför).

Att bygga 18.20 först innebär att montera markera-läget på en sektion som kan
komma att flyttas. Mekaniken överlever; **wiring, e2e-svit och visual baselines
gör det inte.**

### 4.4 Låsta beslut som en omflyttning rör — vid namn

Detta är listan Marcus behöver se innan han bestämmer sig. Varje post är ett
beslut som redan är fattat och som en omflyttning reviderar.

| Beslut | Vad det säger | Hur det berörs |
|---|---|---|
| **S73-facit K42** | Summeringsraderna står i **Lottas utskicksordning**: bekräftelse → påminnelse → eventinfo, medvetet grupperade | **Direkt reviderat.** Marcus föreslår nu att den mellersta bryts loss. Detta är det beslut förslaget kolliderar hårdast med. |
| **S73-facit K43/K44** | Signal-sloten (dags-att-skicka / auto-kryss) är **permanent reserverad** och bunden till eventinfo-raden, placerad utanför den interaktiva raden (L303) | Flyttas raden flyttas sloten. Placeringen måste omprövas. |
| **PRD task-18 användarberättelse 12** | "klickbara summeringsrader (bekräftelser, **påminnelser**, **eventinfo**, bor över)" — alla fyra namngivna i Anmälda deltagare | Reviderad om två flyttas ut. |
| **PRD task-18 beslut 14** | Eventinfo-signalen härleds ur tvåveckorsgränsen; schemafälten additiva; sloten alltid reserverad. **Motorn utanför omfattningen.** | En betalningsgrind är motor-materia → utanför task-18. |
| **PRD task-18 beslut 7** | Bekräftad ⟺ bekräftelsen skickad; servern flippar Status i samma operation | Oförändrat — hållplats 1 är redan byggd så. |
| **S73-facit K27** | Marcus "stanna på samma sida": Betalningar fick **inline-arbetsyta** i stället för egen vy | Vilken lösning som helst måste behålla detta. Alt B riskerar att göra Betalningar till en sida igen. |
| **S73-facit K38** | Summeringarna räknar **alltid hela eventet**; flikvalet påverkar bara listorna | Oförändrat i alla alternativ. |
| **S73-facit K40** | Inbox-fokus: kön i ansiktet, arkivet ett klick bort | Redan delvis reviderat (task-48 våg 2 rev accordion-paret). |
| **S73-facit K53 / ORDLISTA** | Obekräftad/Bekräftad ligger exakt på basens Status-ord | Måste hållas — annars driver UI-språket från basen. |
| **task-48 byggkrav 4** | Obekräftade-kön låst till ~3 kort + inline-scroll; klippet är affordansen | Marcus-låst för två dagar sedan. Alt C bevarar den; Alt B river den. |
| **task-48 byggkrav 3** | Batch-barens form (breddlås, live-count, §19-intents) | Bärande i alla alternativ. |
| **ADR-067** | Bulk-mail-kontraktet (allowlist, idempotensnyckel, nonprod-guard) | Varje verkligt eventinfo-utskick måste gå via detta eller ett syskon. |
| **ADR-063** | Alla bas-ändringar additiva; resolution sker i basen | Nya fält (t.ex. ett steg-fält) måste vara additiva, staging först. |

---

## Del 5 — Branschprecedenten

Verifierat mot producenternas egen dokumentation 2026-07-26. Där fulltext
blockerades (403) står `[snippet]` och påståendet vilar på sökmotorns
citatutdrag ur samma hjälpartikel.

### 5.1 Åtta produkter

| Produkt | Toppnivå i event-vyn | Betalning = yta eller fält? | Utskick |
|---|---|---|---|
| **Eventbrite Organizer** | *Manage attendees* → *Manage Orders*, *Emails to attendees* | **Fält.** 11 order-statusar inkl. `Unpaid`, `Pending`, `Completed` — "You'll find these statuses in the Orders report" | Egen yta, mottagarfilter "All attendees" eller valda |
| **Luma** | *Registration* · *Guests* · *Blasts* · *More* | **Varken eller** — ingen betalningsflik, inget betalningsfilter | Egen yta (*Blasts*), schemaläggbar, filtrerbar på **guest status** + ticket type |
| **Cvent** | *General* · *Website* · *Registration* · *Attendees* · *Marketing* · *Email* | **Åtgärd på posten** — öppna registranten → *Actions → Submit Payment* | Egen *Email*-sektion; "Registration Confirmation" och "Know Before You Go" som *post-registration transactional* |
| **Splash** `[snippet]` | *Guests*-flik med sju statusar | **Fält** | Filter "By Email Campaign" — kommunikationshistorik som filter PÅ registret |
| **Sched** | *Attendees*-flik med Registration-sektion inuti | Fält | — |
| **RingCentral Events** `[snippet]` | Flikarna **omorganiseras efter eventfas** (före / live / efter) | Fält | — |
| **Whova** | *Attendees* med *Attendee Segments* | Fält | Segment |
| **Ticket Tailor** | *Orders* + *Issued tickets* som separata listor med filter | Fält | — |

**Tunn precedent-rymd, öppet deklarerad:** ingen dedikerad event-produkt med
kanban-/pipeline-vy för deltagare hittades. De enda kanban-träffarna är
generiska verktyg (Airtable, Notion, Trello) där kanban är en databasvy, inte
produktens IA. Detta rapporteras som **frånvaro av funnen precedent**, inte som
bevisad frånvaro.

### 5.2 Eventinfo-frågan i branschen — entydig

**Alla verifierade källor: datum-schemalagt. Ingen produkt grindar eventinfo på
betalning.**

- **Eventbrite:** automatiskt påminnelsemail 48 h före (online: 48 h, 2 h, 10
  min). Dokumentationen nämner inte betalning, saldo eller grind.
- **Luma:** "Our standard reminders go out 1 day and 1 hour before the event."
  Den grind som *finns* är på **godkännandestatus**: *"Guests who are still
  pending approval or on the waitlist do not receive automated reminders."*
- **Cvent:** "Know Before You Go" är *post-registration transactional* — utlöst
  av registrering, inte av betalning.

**Detta är den viktigaste branschobservationen för Marcus fråga:** en grind
existerar i branschen — men den sitter på **bekräftelse/godkännande**, alltså på
hållplats 1, inte på betalning. Lumas regel översatt till Miranon Media vore
*"obekräftade och väntelistade får ingen eventinfo"* — vilket är en billig,
precedent-belagd och begriplig regel. Betalningsgrinden saknar precedent.

### 5.3 Mönsterlitteraturen

- **Shopify Polaris** — det starkaste normativa argumentet: *"Tabs represent a
  list of saved views, where each tab represents a subset of the list that has
  been sorted, filtered, and/or queried"*, och flikar ska **inte** "be used to
  group content that is dissimilar". En "steg-flik" som egentligen är ett filter
  *ska* byggas som sparad vy över ett register.
- **Salesforce** — även branschens kanoniska pipeline-UI är i modellen ett
  **fält**: Kanban organiseras efter `Stage`, "each column represents one
  stage", och Path drivs av "a picklist field specified by declarative
  metadata". Pipeline är en **vy** över ett statusfält, inte en egen
  arkitektur.
- **Icke-linjära pipelines** — praxislitteraturen varnar för att standardstadier
  "assume every deal follows a linear path", rekommenderar **sub-fält framför
  fler stadier**, och noterar att fler än 4–5 stadier gör vyerna oläsliga.
  *(Konsultkällor, sekundära.)*
- **Atlassian/Jira** — brädan är för pågående arbete, listan för volym:
  "Managing your backlog in the first column of your kanban board becomes
  difficult as your backlog grows."
- **Shneiderman** — "Overview first, zoom and filter, then details-on-demand."

### 5.4 Den tredje IA:n, som faktiskt är vanligast

**Domänträd + översikt + drill-down** dominerar (Cvent renodlat, Eventbrite som
sektionsgrupper). RingCentral lägger till en tidsaxel: **flikarna omprioriteras
efter eventets fas** — före / live / efter. Det ger processkänslan utan att
flytta personer: **navigationen** rör sig genom faserna, inte deltagarna.

### 5.5 Krocken mellan bransch och Lotta — skriven, inte jämkad

Branschmönstret (register med filter) är byggt för administratörer som sitter i
verktyget dagligen och som **vet vad de letar efter**. De öppnar Attendees för
att de redan har en fråga. Lotta öppnar eventsidan för att få veta **vad hon ska
göra**. Ett rent register svarar inte på den frågan — det förutsätter den.

Det är precis den luckan Marcus hållplats-modell försöker fylla, och han har
rätt i att den finns. Men lösningen behöver inte vara att *flytta* personer.
Splash och Luma visar mellanformen: **ett register, med en statusfilter-rail som
bär antalen**. Räknarna blir att-göra-listan; listan förblir ett register. Det
ger hållplats-KÄNSLAN utan hållplats-MODELLENS problem — och det är det enda av
alternativen som klarar båda Lotta-testen (Del 6).

---

## Del 6 — Fyra alternativ

Varje alternativ bedöms mot fyra saker. De två Lotta-testen väger tyngst.

- **L1 — "Kan Lotta gissa nästa steg utan att någon förklarat det?"**
- **L2 — "Kan Lotta hitta Anna utan att först veta var Anna befinner sig?"**
- **Kostnad** — arbete, och vilka låsta beslut som rivs.
- **Ärlighet** — påstår sidan något som inte är sant?

---

### Alternativ A — Flytta bara de två summeringsraderna

*Den minsta möjliga tolkningen av Marcus förslag, ordagrant.*

"Betalningspåminnelse skickad" och "Eventinfo skickad" flyttas ned till
Betalningar. Anmälda deltagare behåller Obekräftade anmälningar ·
Anmälningsbekräftelse skickad · Bor över. Inget annat ändras.

| | |
|---|---|
| **Vinner** | Påminnelse-räknaren hamnar hos påminnelse-handlingen och påminnelse-historiken. Anmälda deltagare blir ett renare block med tre rader i stället för fem. Snabbt. |
| **Kostar** | ~3–4 h. Reviderar K42 (utskicksordningen som grupp), användarberättelse 12, K43/K44:s slot-placering. |
| **L1** | Marginell förbättring. Sidan säger fortfarande inte vad som ska göras härnäst; fyra grå Åtgärds-rader står kvar. |
| **L2** | Oförändrat. Anna står kvar på tre ställen. |
| **⚠️ Ärlighet** | **Eventinfo-halvan skapar en osanning.** Står "Eventinfo skickad" under rubriken Betalningar drar Lotta rimligen slutsatsen att eventinfo hänger på betalning. Det gör den inte. Vi bygger in i layouten en regel som inte finns i systemet. |

**Variant A′ (rekommenderad om A väljs):** flytta **bara** påminnelse-raden.
Eventinfo-raden med sin signal och sitt kryss står kvar tills eventinfo-frågan
(Del 2.3) är avgjord. Samma vinst, ingen osanning, ännu billigare.

---

### Alternativ B — Hållplats-modellen fullt ut

*Tre stationer; personen lämnar den ena och dyker upp i den nästa.*

**Anmälda deltagare** = bara Obekräftade. Vid bekräftelse **lämnar** personen
blocket och dyker upp i **Betalningar**. Vid full betalning lämnar hon
Betalningar och dyker upp i en ny tredje station, **Eventinfo**. Varje station
får markera-läge och sina egna batch-handlingar. Åtgärds-raderna 2–5 blir
stationernas handlingar.

| | |
|---|---|
| **Vinner** | Starkast tänkbara "vad gör jag härnäst". En person, en plats. De grå Åtgärds-raderna får ett hem. Modellen matchar exakt hur Marcus tänker om arbetet. |
| **Kostar** | Störst av alla. (1) Nytt tredje block. (2) **Eventinfo-motorn måste byggas** — explicit utanför task-18. (3) Betalningsgrinden är ett nytt produktbeslut som saknar branschprecedent. (4) Varje undantag i Del 3 måste få en egen plats, annars faller personer av sidan. (5) **Bekräftade-registret försvinner** — Lotta tappar "vilka kommer?" som en läsbar lista, vilket är precis det hon skriver ut (Åtgärd 6) och läser inför eventet. (6) task-48 byggkrav 4 rivs. (7) 18.20 måste skrivas om från grunden. |
| **L1** | **Bäst — men bara om undantagen syns.** Gör de inte det blir modellen aktivt vilseledande: personen som är obekräftad *och* betald måste finnas på en station, och vilken den än är ljuger den. |
| **L2** | **Sämst.** Lotta måste veta vilken station Anna står på innan hon kan hitta henne. Det är exakt den förkunskap Gunilla-principen förbjuder. |
| **Ärlighet** | Kräver att betalningsgrinden faktiskt byggs — annars påstår stationsordningen en regel som inte finns. Och Del 3 fall B (aldrig-betalaren) blir synlig som en person som permanent aldrig når station 3. |
| **Bransch** | **Noll verifierad precedent** för en deltagar-pipeline. Där pipeline finns (Salesforce) är den en *vy över ett fält*, inte en flytt mellan ytor. |

---

### Alternativ C — Hållplatsen som ETIKETT, inte som flytt ⭐

*Ett deltagarregister. Varje person bär ett synligt steg-märke. Summeringsraderna
blir steg-räknare som filtrerar.*

Konkret, i det Lotta ser:

- **Anmälda deltagare** behåller sin struktur: Obekräftade-kön överst (fast,
  ~3 kort, scroll — **task-48 byggkrav 4 orört**), Bekräftade-registret under,
  fällbart.
- De fem summeringsraderna ersätts av **tre steg-räknare** i Marcus ordning:
  - `Väntar på bekräftelse — 2`
  - `Väntar på betalning — 6`
  - `Klara — 2`
  Varje rad klickbar och filtrerar registret, precis som idag.
- **Varje kort i registret bär ett litet steg-märke** med samma tre ord. Märket
  visar **det längst bak liggande ofärdiga steget** — en person kan bara ha ett
  märke, även när datat är ett nät. Undantagen får ärliga egna märken:
  `Avbokad`, `Inställt`, `På väg till väntelistan`.
- **Betalningar rörs inte alls.** Blocket förblir betalningsstegets
  detaljarbetsyta — K27:s inline-arbetsyta står orörd. Steg-räknaren
  "Väntar på betalning" och Betalningars räknerader visar samma sanning från två
  håll, vilket är rimligt: den ena är en att-göra-siffra, den andra en
  avstämning.
- Påminnelse-räknaren flyttar till Betalningar (som i A′).
- Eventinfo-raden med signal och kryss står kvar som **utskicks-rad**, inte som
  hållplats — den är per event, inte per person (Del 2.3).
- **Åtgärds-raderna 2–5 blir genvägar** (18.20 A3, alternativ b): raden öppnar
  registret filtrerat på rätt steg med rätt personer förmarkerade. Numreringen
  1–6 och referentbarheten (18.15) bevaras. Ingen rad behöver rivas.

| | |
|---|---|
| **Vinner** | Lotta ser tre siffror som **bokstavligen är hennes att-göra-lista**, i den ordning hon arbetar. Hon klickar en, ser exakt de personerna, markerar, agerar. Hon behöver aldrig veta att en person kan vara på två ställen, eftersom hon aldrig ser en person på två ställen. Undantagen får ett ärligt märke i stället för att försvinna tyst. |
| **Kostar** | Medel, och lägst av de strukturella. En härledd `steg()`-funktion (ren, testbar, ingen bas-ändring), ett märke på kortet, omdöpta summeringsrader, genvägs-wiring på Åtgärds-raderna. **Ingen ny write-vertikal. Inget grind-beslut. Inget nytt bas-fält.** |
| **Rivs** | K42:s tre-raders utskicksordning (blir tre steg-rader plus en utskicks-rad). Användarberättelse 12:s radlista. Ingenting Marcus-låst från task-48. |
| **L1** | **Näst bäst efter B — och utan B:s pris.** Steg-räknarna säger vad som ska göras; genvägarna i Åtgärder säger det en gång till med ord. |
| **L2** | **Bäst.** En lista, ett namn, ett märke. Anna finns alltid på samma ställe. |
| **Ärlighet** | Hög. Märket är härlett, inte lagrat — det kan inte driva ifrån sanningen. Nätet döljs inte, det sammanfattas till en enda ärlig etikett per person. Eventinfo påstås inte hänga på betalning. |
| **Bransch** | **Starkaste stödet av alla alternativ.** Detta är exakt Splash statusfilter-rail med antal och Lumas guest-status-filter, och exakt vad Polaris föreskriver ("flikar = sparade vyer över samma register"). Det är också Salesforce-modellen: steget är ett fält, inte en yta. |

---

### Alternativ D — Behåll domänerna, gör deras ROLL explicit

*Ingen strukturändring. Varje block får en förklarande mening, och varje handling
flyttas till det block där dess data bor.*

- Under varje rubrik en rad i klartext: "Här bekräftar du nya anmälningar" ·
  "Här prickar du av betalningar och påminner" · "Här ser du vilka som kom".
- Påminnelse-räknaren flyttar till Betalningar (som i A′).
- Åtgärds-raderna 2–5 blir genvägar eller rivs öppet.

| | |
|---|---|
| **Vinner** | Billigast av alla strukturella grepp. Löser splitten Marcus såg. Rör inget låst utom K42-raden och Åtgärds-radernas form. |
| **Kostar** | ~1 dag. |
| **L1** | Förklarande meningar är det billigaste sättet att säga "vad är detta". Men de säger inte **vad som är kvar att göra** — de beskriver blocket, inte arbetet. |
| **L2** | Oförändrat. Anna står kvar på tre ställen. |
| **Ärlighet** | Hög. Inga nya påståenden. |

---

### Jämförelsen på en rad

| | A / A′ | B | **C** | D |
|---|---|---|---|---|
| L1 — gissa nästa steg | svag | **starkast, men skör** | **stark** | medel |
| L2 — hitta Anna | oförändrad | **sämst** | **bäst** | oförändrad |
| Kostnad | mycket låg | **mycket hög** | medel | låg |
| Låsta beslut som rivs | 3 | 8+ | 2 | 2 |
| Ny write-vertikal krävs | nej | **ja (eventinfo-motorn)** | nej | nej |
| Nytt produktbeslut krävs | nej | **ja (betalningsgrinden)** | nej | nej |
| Branschprecedent | neutral | **ingen funnen** | **stark** | stark |
| Löser Marcus faktiska klagomål | delvis | ja | **ja** | delvis |

---

## Del 7 — Rekommendation

**Bygg alternativ C, med A′ inbakat. Skjut eventinfo-stationen till ett eget
beslut.**

Sju skäl:

1. **Det ger Marcus vad han faktiskt vill ha.** Sidan säger vad som ska göras
   härnäst, i hans ordning, med hans ord. Skillnaden mot hans förslag är bara
   att steget bärs av en **etikett** i stället för av en **flytt** — och den
   skillnaden är osynlig för Lotta i det normala fallet.

2. **Det överlever nätet.** En person med en udda kombination får *en* ärlig
   etikett i stället för att tvingas stå på en station hon inte hör hemma på.
   Del 3:s sex undantag blir sex märken, inte sex specialfall i en kedja.

3. **Det påstår inget som inte är sant.** Ingen betalningsgrind hittas på;
   eventinfo förblir vad den är — ett per-event-utskick på ett datum.

4. **Det respekterar det som redan är låst.** K27:s inline-arbetsyta orörd.
   task-48 byggkrav 3 och 4 orörda. K53:s språk orört. Två reviderade beslut mot
   åtta.

5. **Det låser upp TASK-18.20 i stället för att slåss med det.** A2 besvaras
   (handlingarna är stegets handlingar), A3 besvaras (genvägar, alternativ b),
   A1 och B2 faller bort, AC #3 byggs oförändrad.

6. **Branschen stöder det starkast av alla fyra.** Splash rail, Lumas
   statusfilter, Polaris "flikar = sparade vyer", Salesforce "steget är ett
   fält". Och där branschen krockar med Lotta — att ett rent register förutsätter
   att man redan har en fråga — är räknarna precis den bro som saknas.

7. **Det är billigast per vunnen begriplighet.** Ingen ny write-vertikal, inget
   nytt bas-fält, inget nytt produktbeslut.

**Vad rekommendationen INTE gör:** den bygger inte hållplats 3. Eventinfo blir
kvar som en utskicks-rad tills Marcus svarat på frågan i Del 2.3. Det är
avsiktligt — hållplats 3 kräver en motor som är explicit utanför task-18, och
att bygga en station för ett utskick som inte finns vore att lova på skärmen
igen.

**Om Marcus ändå vill ha B:** då är den ärliga vägen att först bygga C, och
sedan avgöra om flytten tillför något som märket inte redan gav. C är ett
delsteg mot B, inte en återvändsgränd — steg-funktionen är exakt det fält en
pipeline skulle renderas ur (Salesforce-mönstret).

### Det som måste lagas oavsett vilket alternativ som väljs

1. **Krysset ljuger.** "Schemalagt att skickas automatiskt 20 juli" utförs av
   ingen kod. Antingen skrivs texten om så den beskriver vad den gör (styr
   schemat, skickar inte), eller så byggs motorn. Nuvarande form är det största
   Gunilla-brottet på sidan.
2. **Fyra av sex Åtgärds-rader gör ingenting.** Genvägar (C) eller öppen rivning.
3. **Betalningar visar inte om en person är bekräftad eller medföljande.** Två
   pillar räcker; det är ett konkret vardagsfel idag.
4. **`Inställt` och `Flytta till väntelista` räknas som bekräftade.** Fynd för
   T16 / bas-maximeringen.
5. **Avbokade försvinner ur tre block men står kvar i Närvaro.** Inkonsekvens.

---

## Del 8 — Öppna frågor till Marcus

Ordnade efter hur mycket som hänger på svaret.

1. **Ska eventinfo bli ett per-person-utskick grindat på betalning, eller förbli
   ett per-event-bulkutskick på ett datum?** Detta avgör om hållplats 3 finns.
   Code:s hållning: **behåll datumet som signal, gör betalningsläget till ett
   mottagarfilter när motorn byggs.** Branschen grindar på bekräftelse (Luma),
   aldrig på betalning.

2. **Flytt eller märke?** Ska personen *lämna* ett block när steget är klart
   (B), eller *bära* sitt steg i en enda lista (C)? Code:s hållning: **märke** —
   av L2-skäl (Lotta ska aldrig behöva veta var någon är för att hitta henne).

3. **Vad ska krysset säga tills motorn finns?** Skriv om texten, eller bygg
   motorn nu? Code:s hållning: **skriv om texten omedelbart**, motorn som eget
   kort.

4. **Vad händer med Bekräftade-registret?** Under B försvinner det. Under C blir
   det den enda listan. Är "vilka kommer?" som en sammanhållen, utskrivbar lista
   ett krav? *(Åtgärd 6 skriver ut sidan — vad ska då stå på pappret?)*

5. **Är K42:s utskicksordning ett facit som ska bevaras, eller ett resultat av
   att raderna råkade hamna i samma block?** Marcus förslag reviderar den; det
   ska ske öppet, med kvittens, inte som en sidoeffekt.

6. **Ska undantagen synas på eventsidan?** Idag försvinner avbokade tyst. Ska
   Lotta se "2 har avbokat", eller är tystnaden avsiktlig?

7. **Får Betalningar visa bekräftelseläge och kategori-pill?** Billigt, löser ett
   verkligt vardagsfel — men rör en yta som fick åtta konvergenssteg (K27–K34).

8. **Vilken ordning?** Code:s hållning: låt task-48 landa → grilla detta →
   skriv om 18.20 → eventinfo-motorn som eget kort med egen ADR.

---

## Källor

### Kod och repo (läst @ `origin/main` `029a175`)

- `src/components/events/EventDetail.tsx` — blockordningen
- `src/components/events/detail/Deltagare.tsx` — summeringsrader (1157–1217),
  `eventinfoSignal` (162–193), `AutoKryss` (559–603), `useMarkeringsLage`
  (366–421), `MarkeringsBatchBar` (444–538), sektionerna (1288–1377)
- `src/components/events/detail/Betalningar.tsx` — `deadlineStatus` (81–96),
  arbetsytan (363–463), `BetalningsPersonRad` (291–355)
- `src/components/events/detail/Atgarder.tsx` — de sex raderna (167–190)
- `src/components/events/detail/Belaggning.tsx`, `Narvaro.tsx`,
  `Gruppdynamik.tsx`, `OmEventet.tsx`, `Anteckningar.tsx`
- `src/domain/types/Status.ts` — `RegistrationStatus`, `PaymentStatus`,
  `RegistrationSource`
- `supabase/functions/_shared/field-allowlists.ts` — samtliga write-operationer
- `supabase/functions/send-email/index.ts` — ADR-067-kontraktet
- `ORDLISTA.md` — Eventinfo · Auto-utskick · Obekräftad/Bekräftad · Bor över
- `docs/reference/data-model.md` — Status-värden (169–218), write-fält
  (223–251), automationer (806–946), mallkatalog + skarpa skick (960–998),
  prod-additiva fält (92–129)
- `docs/decisions/ADR-049-fas-5-5-betalfalt-val.md`
- `tasks/lessons.md` L353
- `tasks/sessions/bilagor/s73-eventsida-konvergens/` — FACIT-bilder + README
- Backlog: `TASK-18`, `TASK-18.20`, `TASK-48`

### Airtable (read-only, staging `apphjj8Q7lkXCMsL4`, 2026-07-26)

- `Anmälningar` filtrerad på `Status = Obekräftad AND Anmälningsavgift =
  Mottagen` → 4 träffar (fixturer, `Källa = Manuell`)
- `Anmälningar` filtrerad på `Deltagarinfo skickad AND Anmälningsavgift ≠
  Mottagen` → 1 träff (fixtur)
- **Anmärkning:** `list_automations` mot staging avvisades
  (`INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`) via claude.ai-connectorn.
  Automations-påståendena vilar därför på `data-model.md` § Automationssekvenser
  (JSON-export 2026-03-16 + skärmdumps-verifiering 2026-04-28), inte på en
  live-läsning. **Prod rördes inte.**

### Bransch (verifierat 2026-07-26)

- Eventbrite — statusordlista:
  <https://www.eventbrite.se/help/sv/articles/291888/glossary-of-order-and-attendee-statuses/>
- Eventbrite — Emails to attendees:
  <https://www.eventbrite.com/help/en-us/articles/484221/how-to-email-your-attendees-through-eventbrite/>
- Eventbrite — Orders report:
  <https://www.eventbrite.com/help/en-us/articles/855993/how-to-customize-and-export-an-orders-report/>
- Eventbrite — 48 h-påminnelsen:
  <https://www.eventbrite.ca/help/en-ca/articles/222665/how-to-create-or-disable-the-48-hr-reminder-email/>
- Luma — gästlistan: <https://help.luma.com/p/managing-your-guest-list>
- Luma — Blasts: <https://help.luma.com/p/sending-or-scheduling-event-blasts>
- Luma — påminnelser (godkännande-grinden):
  <https://help.luma.com/p/update-to-reminders-on-luma>
- Cvent — registrant management:
  <https://www.cu.edu/blog/ecomm-wiki/cvent-registrant-management>
- Cvent — betalning som åtgärd:
  <https://support.cvent.com/s/communityarticle/Processing-Online-Payments>
- Cvent — Know Before You Go:
  <https://www.cu.edu/blog/ecomm-wiki/cvent-event-session-emails>
- Splash — statusar/kolumner/filter `[snippet, 403 på fulltext]`:
  <https://support.splashthat.com/hc/en-us/articles/115003676183-3-Navigating-your-list-with-Columns-Statuses-and-Filters>
- Sched: <https://sched.com/guide/add-attendees/>
- RingCentral Events — fas-adaptiv navigation `[snippet, 403]`:
  <https://events-support.ringcentral.com/hc/en-us/articles/4799039693716-Navigating-the-Event-Dashboard>
- Whova: <https://whova.com/blog/assign-add-ons-to-attendees/>
- Ticket Tailor:
  <https://help.tickettailor.com/en/articles/10561157-what-ticket-information-can-i-see>
- Shopify Polaris — Index filters:
  <https://polaris-react.shopify.com/components/selection-and-input/index-filters>
- Shopify Polaris — Tabs:
  <https://polaris-react.shopify.com/components/navigation/tabs>
- Salesforce — Path och Kanban:
  <https://trailhead.salesforce.com/content/learn/modules/leads_opportunities_lightning_experience/visualize-success-with-path-and-kanban>
- Atlassian — kanban-backlog:
  <https://support.atlassian.com/jira-software-cloud/docs/use-your-kanban-backlog/>
- NN/g — card view vs list view:
  <https://www.nngroup.com/videos/card-view-vs-list-view/>
- Shneiderman 1996 — "Overview first, zoom and filter, details-on-demand":
  <https://www.cs.umd.edu/~ben/papers/Shneiderman1996eyes.pdf>
- Sekundära/opinionskällor om icke-linjära pipelines (markerade som svagare):
  <https://garysmithpartnership.com/opportunity-stages/> ·
  <https://www.demandfarm.com/blog/salesforce-opportunity-stages-best-practices-are-you-managing-deals-or-losing-them/>
