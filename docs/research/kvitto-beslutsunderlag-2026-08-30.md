---
owner: marcus803
updated: 2026-08-30
review_by: 2026-11-30
status: stable
---

# Kvittot för Lotta — beslutsunderlag inför grillningen

> **Syfte:** ett enda ingångsdokument till grillningen om Lottas
> kvittoflöde (S113 resume 4, 2026-08-30). Det knyter ihop tre underlag
> och pekar ut vad Marcus ska besluta. Inget här är beslut — allt som
> liknar en rekommendation är märkt som sådan. Skrivet så att en person
> utan teknisk bakgrund kan följa; fackord förklaras där de dyker upp.
>
> **De tre underlagen (läs dem för detaljerna, inte kopian här):**
>
> 1. [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md)
>    — hur koden gör i dag, rad för rad (S113 resume 3).
> 2. [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md)
>    — vad lagen kräver och hur tolv system gör (research-pass, resume 4;
>    lagrummet verifierat och rättat av orkestreraren).
> 3. [`../../tasks/sessions/bilagor/s113-kvittovandring/rapport.md`](../../tasks/sessions/bilagor/s113-kvittovandring/rapport.md)
>    — appvandringen i Lottas skor mot staging, 31 skärmdumpar,
>    klick-räkning (resume 4). Fixturen `ZZ-GRANSKNING-S113` står kvar i
>    staging till 2026-09-13 så att Marcus kan gå samma väg själv.

## 1. Frågan som ställdes — och varför den är fel fråga

Utgångsfrågan var: *"Kan Lotta lägga med kvitton när hon skickar
deltagarinformation — 20 deltagare, 20 kvitton före utskicket?"*

Tre saker talar samfällt emot just den formen:

- **Kvittot hör till betalningen, inte till informationsrundan.**
  Kopplas kvittot till utskicket får den som inte betalat klart ett
  kvitto, den som betalar efteråt inget, och ett fel i sändning 12 bränner
  ett kvittonummer mitt i ett annat jobb (kartläggningen § Orkestrerarens
  utlåtande).
- **Ingen undersökt branschledare bygger en "skicka N nya kvitton"-knapp.**
  Bulk finns bara som export av redan utfärdade dokument. Kvittot är i
  varje undersökt system en biprodukt av EN betalningshändelse
  (branschpraxis § Mönster 4).
- **Friktionen sitter inte i antalet knapptryck utan i vad Lotta måste
  veta och skriva.** Vandringen mätte 7 klick + ett handskrivet belopp per
  kvitto; det handskrivna beloppet är det som kostar (uppslag i banken,
  formatfällan, risken att skriva fel).

**Rätt fråga är alltså:** *hur blir varje enskilt kvitto så billigt att
20 stycken inte gör ont — och vad ska ett kvitto vara för Lotta, Roger och
deltagaren?*

## 2. Vad vi vet — mätt, inte antaget

### Lottas flöde i dag (vandringen)

| Mått | Värde |
|---|---|
| Klick från Hem till "Skicka kvitto"-knappen | **6** (5 via "Nästa event"-kortet) |
| Per kvitto | **7 klick + 1 handskrivet belopp** + betalsättsval + ett uppslag i banken + avgörandet "avgift eller slutbetalning?" |
| Tre betalningar | **24 klick, 3 belopp** |
| Tjugo betalningar (en hel kurs) | **≈ 143 klick, 20 handskrivna belopp**, skroll utan sök |
| Påminnelsen till samma tjugo | 1 åtgärd · 1 granskning · 1 dra-reglage · 1 "Skicka till 20 personer" |

De tre största friktionerna, i vandringens ord:

1. **Belopp och betalsätt skrivs för hand varje gång**, och `2 500,00`
   (bankens format, med mellanslag) avvisas **tyst** — inga
   felmeddelanden alls i dialogen, bara en grå knapp.
2. **Ett skickat kvitto syns bara som en textrad i Mer → Aktivitetshistorik.**
   Anmälans detaljvy och personkortet nämner det inte, PDF:en sparas inte,
   och raden i panelen ser likadan ut före och efter — ett andra kvitto kan
   skickas utan varning.
3. **Kvittot är en dialog per person**, längst ner på Åtgärder-sidan,
   utan förhandsvisning, testmail eller bulk — medan påminnelsen (samma
   personer, motsatt läge) har allt det, plus en massknapp på Hem.

Vad appen frågar om trots att den vet — eller borde veta — svaret:
belopp (finns bara som fritext på `Eventinnehåll`/Eventplanerings
bilagetext-fält, tomt i staging), betalsätt (finns ingenstans),
betalningsdatum (frågas inte, står inte på kvittot), att ett kvitto redan
skickats (finns i ledgern, visas inte). Kvittots benämning säger
"Utbildning 2026-09-07/08" — kursnamnet "Fjärrskådning" står inte med
(enligt beslut `TASK-306`, men en Lotta-fråga).

### Vad lagen kräver (branschpraxis § Del 1)

- **Kassaregisterlagens kvittoplikt gäller sannolikt inte Miranon Media.**
  Regeln bor i skatteförfarandelagen (2011:1244) 39 kap. 5 §, som
  undantar den som *"säljer varor eller tjänster genom distansavtal eller
  hemförsäljningsavtal"* — bokning online, betalning i efterhand via
  Swish/Bankgiro. En oberoende andra väg till samma slutsats är undantaget
  för försäljning under fyra prisbasbelopp per år. **Reservation:** ingen
  juristgranskning; gäller inte en betalning som tas emot på plats.
- **Vad Miranon Media själv behöver är en verifikation för sin egen
  bokföring** (bokföringslagen 5 kap.): datum, belopp, motpart, innehåll,
  löpnummer — sparad. Ett kundriktat PDF-kvitto är EN väg dit, inte den
  enda. Men: **dagens PDF sparas aldrig**, så om avsikten är att
  app-kvittot ska vara Miranon Medias verifikation uppfyller flödet inte
  det i dag. Kvittot till kunden är juridiskt en **servicehandling**.

### Hur proffsen gör (branschpraxis § Del 2–3, tolv system)

| Mönster | Branschen | Vi i dag |
|---|---|---|
| **Trigger** | Delad: automatiskt vid elektronisk betalning (Stripe, Eventbrite, Tito, Humanitix); **kryssruta i samma dialog som betalningen registreras**, förbockad, vid manuell avstämning (Pretix — verifierat ordagrant, Acuity, Zettle) | Separat knapp som dyker upp efteråt, egen dialog |
| **Beloppskälla** | Alltid ordern/bokningen, förifyllt och högst justerbart — **utan undantag** | Handskrivet från tomt |
| **Kunden kan hämta kvittot igen** | Alltid (portal, "resend", app-profil, historik) | Finns bara i kundens mail |
| **Admin-kopia** | Alltid | Ingen |
| **Bulk** | Bara export av redan utfärdade dokument; bulk-AVSTÄMNING finns (Pretix läser hela kontoutdraget), men bekräftelsen uppstår per order | Ingen |
| **Fel mitt i serie** | Obelagt ur branschmaterialet; ADR-109:s "numret hoppas över, återanvänds aldrig" är den enda bevisade mekanismen | Byggd och testad |

Pretix-guidens rad om manuell avstämning, ordagrant: *"By default, pretix
will notify the customer about the order being marked as paid via email.
You can prevent this by unchecking the box next to 'Notify customer by
email'."* — och beloppet: *"Adjust the payment amount and date if
necessary."*

## 3. Det låsta beslutet som prövas

`ADR-109` § Kontext, Marcus-beslut (a) från S102: *"Kvittot är en AKTIV
handling — aldrig automatik som följer på avprickningen."* Skälet står
inte utskrivet i ADR:n.

Branschmaterialet ger beslutet **stöd i princip** (system med manuell
avstämning behåller en aktiv handling) men **talar emot dess nuvarande
form** (en separat knapp och dialog efteråt). Den starkaste precedenten är
en förbockad kryssruta *i samma ögonblick* som Lotta bockar "Mottagen".
Det bryter inte "aldrig automatik" — hon kan bocka ur — men gör
handlingen gratis. Beslutet får bara rivas eller omformas av Marcus, öppet
i ADR-109 § Updates.

## 4. Besluten att grilla (Marcus)

| # | Beslut | Alternativ | Vad som hänger på det |
|---|---|---|---|
| **A** | **Trigger** | (1) behåll separat knapp · (2) kryssruta "Skicka kvitto" i avprickningen, förbockad eller ej · (3) helautomatik (river ADR-109 a) | Hela friktionen per kvitto; om bulk behövs alls |
| **B** | **Beloppskälla** | (1) fortsatt handskrivet · (2) numeriskt pris per event × typ i basen (i dag fritext på `Eventinnehåll`) som förifyller · (3) dessutom faktiskt belopp per betalning sparat på anmälan | Förutsättning för A(2)/A(3), för rabatter/delbetalningar, för Rogers bokföring. Basen är förstklassig leverabel — additivt fält (`ADR-063`) |
| **C** | **Lagring och synlighet** | spara PDF:en (`lagringsnyckel`) · kvittorad på anmälans detaljvy/panelen ("MM-2026-1012 skickat 30/8") · kopia till Lottas egen inkorg · lista per event | Bokföringsverifikationen (§ 2), "vad skickade vi till Bengt?", skydd mot dubbelkvitto |
| **D** | **Innehåll** | betalningsdatum på kvittot? kursnamn i benämningen? | Vad deltagaren och Roger ser |
| **E** | **Felhantering i serie** | ADR-109:s modell räcker? per-mottagare-utfall som i utskicken? | Bara relevant om A ger flera sändningar i följd |
| **F** | **Bulk** | behövs den efter A+B? i så fall: "Skicka kvitto till alla med mottagen betalning utan kvitto" i Åtgärder, med påminnelsens form (granskning, dra-reglage, per-mottagare-utfall) | Sista utvägen, inte första |

**Orkestrerarens rekommendation (REKOMMENDATION, inte beslut):** B(2)+B(3)
först — beloppet är flaskhalsen och varje annat alternativ förutsätter det.
Sedan A(2) med kryssrutan förbockad (Pretix/Acuity-formen) — aktiv handling
bevaras, friktionen försvinner, ingen bulk-knapp behövs för normalfallet.
C: spara PDF:en och visa kvittoraden — det är både UX och bokföring. F
byggs bara om vandringen med Lotta visar att hon prickar av i batch
*efter* att betalningarna kommit, inte en i taget.

## 5. Frågor bara Lotta (via Marcus) kan svara på

Vandringens elva frågor, de fem viktigaste först:

1. **När prickar Lotta av?** En i taget när Swishen plingar, eller i batch
   mot kontoutdraget? Avgör om A(2) räcker eller om F behövs.
2. **Betalar deltagarna exakt det utsatta priset?** Rabatter,
   delbetalningar, "hela beloppet direkt", par som betalar för två?
   Avgör formen på B.
3. **Vill Lotta/Roger ha en kopia av varje kvitto — och var?** Mail, lista i
   appen, Rogers bokföring? Hur gör Roger bokslut i dag? Avgör C.
4. **Ska betalningsdatumet stå på kvittot**, och ska kursnamnet med? (D)
5. **Var läser hon av betalningen** — bankens app på iPad, datorn? Kopierar
   hon beloppet? (Avgör om `2 500,00`-fällan är verklig.)
6. Vilka betalsätt förekommer utöver Swish/Bankgiro/Plusgiro?
7. Hur ofta ångrar hon en avprickning — och vad ska hända med ett skickat
   kvitto då?
8. Vill hon skicka kvittot i samma andetag som avprickningen, eller "pricka
   av tio, skicka sedan"?
9. Ska kvittot kunna gå till någon annan än anmälans e-post?
10. Hur vill hon se att ett kvitto redan är skickat?
11. Vem fyller i "Bokföringstext (kvitto)" per event, och glöms det?

## 6. Vad som inte är belagt

- Juridiken är läst ur lagtext och Skatteverkets sammanfattningar, inte
  juristgranskad; arkiveringstiden för verifikationer är inte
  djupresearchad.
- Pretix fakturaläge (trelägesmodellen) är osäkert sedan dokumentationen
  byggdes om; bankavstämningen är verifierad.
- Svenska nischade kurssystem (Invajo, Confetti, Trippus, Lyyti, Billetto)
  gav tunn precedens.
- Om ett numeriskt prisfält är genomförbart i basen utan att störa
  bilagemallarna (som läser fritextfälten) är en teknisk fråga för
  skivningen, inte för grillningen.
- Steg 7 i `TASK-147.9` (kvitto-QA, två snabba genereringar ger olika
  nummer) är fortfarande obockat — vandringen tryckte aldrig Skicka.

## Nästa steg

Grillningen startar Marcus med `/grill-me`. Utfallet blir ett PRD-kort
under `TASK-147` eller ett nytt, med skivor; ADR-109 § Updates bär det
Marcus beslutar om trigger-frågan.
