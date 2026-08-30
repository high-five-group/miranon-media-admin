# ADR-128: Inbetalningen som sanning — Postgres som lagringsyta, basen som app-skriven spegel

- **Status:** Accepted (grillad samsyn S113 Del 11, 2026-08-30 — tretton
  kvitterade beslut; Postgres-beslutet är Marcus eget, ordagrant: *"Om
  Airtable är flaskhalsen för något så här viktigt så funderar jag skarpt
  på om vi ska migrera det som måste migreras för just detta redan nu till
  Supabase … jag vill inte att vi ger Lotta något 'Halvbra'."* Samsynen
  kvitterad i klartext, nattmandatet ~18:35 UTC: *"B4 ja, B3 ja — kör
  vidare."*)
  **ADR-baren** (`~/.claude/CLAUDE.md` § ADR-BAR) är klarad på alla tre
  villkor: **svårt att återställa** — en inbetalning är en
  bokföringspost, och ett lagringsval som redan bär hundratals verkliga
  betalningar plus en utfärdad kvittoserie kan inte flyttas tillbaka utan
  att verifikationskedjan bryts; det är dessutom svårt att återställa i
  KOHERENS, eftersom valet delar sanningen i två lager. **Överraskande
  utan kontext** — [`ADR-063`](ADR-063-airtable-bas-som-forstklassig-leverabel.md)
  beslut 6 säger uttryckligen att Supabase-migrationen är ett *"separat
  SENARE spår, INTE en ersättning"*, och den som läser den raden utan
  denna ADR skulle uppfatta betalningsdomänens flytt som en tyst
  motsägelse. **Resultat av en verklig avvägning** — tre lagringsvägar
  vägdes (allt i basen, allt i Postgres, delad sanning med spegel), och
  den valda bär ett verkligt pris som redovisas i § Konsekvenser.
- **Datum:** 2026-08-30
- **Fas:** Fas 6 — PRD [`TASK-346`](../../backlog/tasks) (Lottas
  betalningsflöde), skiva `TASK-346.1`
- **Rör:** Supabase Postgres (nya tabeller `inbetalningar`, kvittoledger,
  jobbtabeller — byggs av `TASK-346.3`) · Airtable båda baser (nya
  numeriska prisfält, spegelfält, `Saknas (kr)`-formel — `TASK-346.2`) ·
  domänlagret + adaptern + Edge Functions (`TASK-346.4`) ·
  `docs/reference/data-model.md` · `supabase/functions/_shared/field-allowlists.ts`
- **Relation till tidigare beslut:** river öppet
  [`ADR-063`](ADR-063-airtable-bas-som-forstklassig-leverabel.md) beslut 2
  och 6 **för betalningsdomänen** (se den ADR:ns § Updates 2026-08-30 —
  rivningen bor där, inte här) · river
  [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  beslut 2, 5 och 7 samt mekanismen i beslut 6 (se den ADR:ns § Updates
  2026-08-30) · bygger på
  [`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
  som prejudikat för formen *Postgres-tabell + RLS + skrivning via Edge
  Function med `service_role`* · respekterar
  [`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md) utan
  amendering (se § Relaterat) · jobbmotorn som bär kvittoutskicken bor i
  [`ADR-129`](ADR-129-jobbmotorn-ko-cron-och-kick.md).

## Kontext

### Problemet, som Lotta faktiskt möter det

Marcus beskrev en lördagsförmiddag ordagrant (S113 Del 11 § Ingång):
*"Lotta kollar bankkontot eller swish-appen … ser att 6 personer har
swishat och 2 har betalat via plusgiro/bankgiro. Det hon gör då är att
titta i hennes papper … letar upp dem en efter en och skriver 'bet'."*

Appen hjälper henne inte. Avprickningen börjar i eventet (event →
åtgärder → panel → person), beloppet skrivs för hand, och åtta
betalningar för åtta event blir åtta navigeringar. Mätt i vandringen
(`tasks/sessions/bilagor/s113-kvittovandring`): sex klick till
kvittoknappen, sju klick plus ett handskrivet belopp per kvitto, cirka
143 klick och tjugo handskrivna belopp för en hel kurs.

Den djupare bristen är inte klickräkningen utan att **appen inte vet vad
någon ska betala**. Priser är fritext i basen, och det finns ingen post
som säger *"den här summan kom in den här dagen, för den här anmälan"*.
Utan en sådan post kan appen varken räkna ut vad som saknas, veta vilket
fack en betalning fyller, eller ge Roger en verifikation.

### Vad en inbetalning är

Termen är kanoniserad i [`ORDLISTA.md`](../../ORDLISTA.md) § Inbetalning:
en betalning som faktiskt kommit in på Miranon Medias konto, **en post
per bankrad**, med belopp, betalsätt, datum och den anmälan den gäller.
Ordet *avstämning* betyder NÄRVARO i basen och används aldrig om pengar.

### Varför lagringsfrågan inte kunde skjutas upp

Tre av Airtables strukturella väggar
([`airtable-constraints.md`](../reference/airtable-constraints.md) §A)
träffar betalningsdomänen samtidigt:

- **P1 — ingen unique-constraint på ett skrivbart fält.** Kvittots
  viktigaste garanti (ett nummer, en gång) kan inte uttryckas i basen.
- **P2 — inga transaktioner.** En inbetalning och dess spegelvärde kan
  inte skrivas atomärt.
- **P3 — server-side idempotens är strukturellt omöjlig** som direkt
  följd av P1+P2.

`ADR-109` § Beslut 2 byggde ett helt kompensationsprotokoll (läs högsta,
skriv kandidat, läs om, deterministisk tie-break, radera förloraren) just
för att komma runt P1–P3. Protokollet är korrekt och hermetiskt bevisat —
men det är en **kompensation för en vägg som inte finns i Postgres**. Att
bygga vidare på det när grunden flyttar vore att betala priset utan att
få något för det.

Därtill: `ADR-110` mätte att en evigt växande, aldrig raderad tabell hotar
basens radtak för ALL data i samma bas. En inbetalningsledger är exakt den
klassen — den växer med varje betald kursplats och raderas aldrig.

### Marcus beslut

Grillningen ställde frågan rakt, och Marcus svarade (S113 Del 11,
Postgres-beslutet 11/13): *"Om Airtable är flaskhalsen för något så här
viktigt så funderar jag skarpt på om vi ska migrera det som måste
migreras för just detta redan nu till Supabase … jag vill inte att vi ger
Lotta något 'Halvbra'."*

Formuleringen bär hela avgränsningen: *det som MÅSTE migreras för just
detta*. Inte basen, inte anmälningarna, inte eventen — betalningsdomänen.

### Orkestrerarens självfällning, bokförd

Sex risker skrevs ned i grillningen INNAN beslutet togs, inte efteråt:
tvålagers-sanning (anmälan i basen, inbetalning i Postgres),
spegelskrivning som kan fallera, jobb som dör mitt i, dubbelskick,
befintlig kvittoserie, och **rollup-rättelsen** — den första skissen lät
`Summa inbetalt (kr)` vara en rollup, vilket är strukturellt omöjligt när
raderna den skulle summera ligger i en annan databas. Var och en av dem
har ett svar i § Beslut nedan.

## Beslut

### 1. Inbetalningen är arbetsenheten och sanningen om vad som betalats

En domänpost `Inbetalning` per bankrad, med fälten: anmälan (record-ID i
basen **plus en ögonblicksbild** av namn, event och belopp), belopp
(positivt, eller negativt för en återbetalning), betalsätt (Swish,
Bankgiro, Plusgiro eller *Historik*), betalningsdatum, typ (inbetalning
eller återbetalning), status (aktiv eller makulerad med skäl),
bankreferens (dubblettnyckeln vid import), kvittolänk, samt skapad av och
när.

Ögonblicksbilden är inte redundans utan **verifikationskravet**: en
bokföringspost måste kunna läsas ensam, år efter att anmälan eventuellt
ändrats eller tagits bort.

### 2. Facken härleds ur summan — Lotta väljer aldrig fack

Anmälningsavgift och Slutbetalning är inte något Lotta bockar i. De
räknas ut ur summan av inbetalningarna mot priset:

- avgiften är klar när summan når **anmälningsavgiftens** pris,
- allt är klart när summan når **hela** priset,
- oavsett i vilken ordning och i hur många poster pengarna kom,
- en föreläsning har ett pris utan fack.

`Avtalat pris` per anmälan (frivilligt, förvalt = eventets pris) vinner
över eventets pris när Lotta gett rabatt eller par-pris — annars stämmer
inte "allt betalt" för den anmälan.

**Öppen betalning** = `Saknas (kr) > 0` och status ≠ Avbokad/Ombokad.
Obekräftade anmälningar räknas med och märks. **Förfallen** = slut­
betalningens deadline passerad.

### 3. Betalningsdata bor i Supabase Postgres

Inbetalningar, kvittoledger och jobbtabeller (`ADR-129`) blir nya tabeller
i Supabase Postgres. **RLS** — databasens egen regel för vem som får läsa
och skriva vilka rader — är aktiv med deny-all för `anon` och
`authenticated`; skrivning sker uteslutande via en Edge Function (ett
litet serverprogram hos Supabase) med `service_role`-nyckeln, som aldrig
når klienten.

Det är samma väg `ADR-110` etablerade för aktivitetsloggen, med samma
skäl (volym, skrivväg, striktare grind) plus två som är nya här: en
riktig **sekvens** (databasens egen räknare, som aldrig ger samma tal två
gånger) och en riktig **unik nyckel**.

### 4. Kvittonumret allokeras med en databassekvens per år

Formatet `MM-<år>-<löpnummer>` från 1001 (`ADR-109` beslut 1) står
oförändrat. Vad som byts är HUR numret tas: en sekvens per år i Postgres
i stället för `ADR-109` beslut 2:s läs-verifiera-retry-protokoll.
Sekvensen startar efter det högsta befintliga numret i respektive miljö —
prod bär **0 kvitton** (mätt read-only av orkestreraren 2026-08-30, S113
Del 11), staging bär max `MM-2026-1002` (samma mätning, verifierings­
rapporten § 5), så staging startar på 1003.

En **unik nyckel per inbetalning** i kvittoledgern gör dubbelskick
strukturellt omöjligt: ett andra kvitto för samma inbetalning kan inte
skrivas, oavsett hur många gånger ett jobb körs om. Det är den garanti
`ADR-109` beslut 2 fick bevisa hermetiskt med ett samtidighetstest — i
Postgres är den en `unique`-klausul.

Numeriska hopp (en påbörjad men aldrig avslutad allokering) är fortsatt en
accepterad konsekvensklass, precis som `ADR-109` § Öppna punkter redan
bokförde: ett nummer som aldrig blev ett kvitto återanvänds aldrig.

### 5. Basen förblir förstklassig leverabel — och bär en app-skriven spegel

Airtable-basen är fortsatt sanning för **anmälan, event och priser**, och
maxas kontinuerligt som leverabel (`ADR-063` beslut 1, orört). Vad den
INTE längre är sanning om är pengarna.

För att Lottas vyer, automationer och rollups ska fungera orörda
(användarberättelse 35) skriver appen en **spegel** i basen:

| Fält på Anmälningar | Form | Vem skriver |
|---|---|---|
| Anmälningsavgift (val) | befintligt valfält | **appen**, härlett |
| Slutbetalning (val) | befintligt valfält | **appen**, härlett |
| `Summa inbetalt (kr)` | **talfält** | **appen**, summan ur Postgres |
| Kvittonummer | textfält | **appen**, vid utfärdat kvitto |
| `Saknas (kr)` | **Airtable-formel** | basen själv (pris − summa) |

`Summa inbetalt (kr)` är ett **talfält, inte en rollup** — och det är
inte en preferens utan en strukturell nödvändighet: en rollup summerar
länkade rader i samma bas, och raderna den skulle summera ligger i
Postgres. `Saknas (kr)` kan däremot vara en formel, eftersom båda dess
led (priset och summan) finns i basen när spegeln är skriven.

Spegeln skrivs i samma operation som inbetalningen, med omförsök.
Eftersläpning kan uppstå (P2: ingen transaktion över två system) och
**syns i appen** i stället för att tystas. Lotta rör aldrig valfälten för
hand — den handlingen ersätts av att registrera en betalning.

### 6. Spegeln är en projektion, aldrig sanningen

Riktningen är enkelriktad: Postgres → basen. Ingen läsning i appen
härleder pengar ur spegelvärdena; de finns för basens egna konsumenter
(Lottas vyer, automation A7, rollups, formler, Interface-sidorna).

Bryggan mellan lagren är anmälans record-ID plus ögonblicksbilden
(beslut 1). En **konsistensvakt** larmar på inbetalningar vars anmälan
försvunnit — den tvålagers-risken tystas inte, den bevakas.

### 7. Priser blir numeriska fält BREDVID fritexten

Eventinnehåll och Eventplanering får `Pris (kr)` och `Anmälningsavgift
(kr)` som numeriska fält. Den befintliga fritexten `Pris` **byter aldrig
typ** — bilagemallarna läser den (`_shared/document-sources.ts` läser
`eif['Pris']` och `bilagetext('Pris')`), och en typändring hade knäckt
dem tyst. Additiva fält är samma princip `ADR-063` och `ADR-109` redan
följer.

### 8. Härledningen är universell från dag ett

Basen har aldrig använts av Lotta för betalningar, så det finns ingen
historik att respektera. En **full betalnings-backfill** körs före
golive: Närvarande ⇒ betalt, Mottagen ⇒ betalt, belopp = dåvarande pris,
betalsätt *Historik*, datum okänt. "Lottas lista" blir facit för
avvikelser när den kommer.

Alternativet — en historik-brytpunkt där äldre anmälningar följer gamla
regler — hade gett två sanningar i samma vy och ett undantag att förklara
för alltid.

## Alternativ som övervägdes

**A. Allt i Airtable — `Inbetalningar` som Airtable-tabell med rollup.**
Avvisat på fyra mätta grunder: (i) kvittots unikhet kräver `ADR-109`:s
kompensationsprotokoll för evigt, eftersom P1–P3 inte går att designa
bort; (ii) 5 anrop/sekund är ett DELAT tak per bas (`ADR-063` S91-not) —
åtta kvitton i ett svep konkurrerar med Lottas egna klick och med A1–A11;
(iii) append-only-volymen hotar radtaket för ALL data i basen, exakt
`ADR-110`:s volymargument; (iv) en sekvens som inte kan vara atomär kan
inte bära en bokföringsserie.

**B. Allt i Postgres — hela Fas E nu.** Avvisat: det river `ADR-063` i
sin helhet i stället för i en enda domän, dödar Lottas vyer, formulär och
automationer, och gör en PRD om betalningar till en full migrations-PRD.
Marcus formulering avgränsade uttryckligen till *"det som måste migreras
för just detta"*.

**C. Postgres utan spegel — appen som enda läsväg.** Avvisat mot
användarberättelse 35 (*"Som Marcus vill jag att Lottas Airtable-vyer,
automationer och rollups fungerar orörda, så att basen förblir en
förstklassig leverabel"*). Utan spegel slutar A7, rollupsen och Lottas
egna vyer stämma samma dag betalningarna flyttar.

**D. Spegeln som rollup i stället för app-skrivet talfält.** Förkastat
för att det är **strukturellt omöjligt**, inte för att det är olämpligt.
Bokfört som orkestrerarens egen rättelse under grillningen, inte som ett
alternativ som aldrig övervägdes.

**E. Bokföra flytten som ett "undantag" av `ADR-110`-klass.** Avvisat på
verifieringsrapportens argument (§ 4): `ADR-110` kunde kalla sitt fall ett
undantag därför att `activity_log` *"ALDRIG legat i Airtable … flyttar
ingenting UT ur basen"*. Kvittoledgern LIGGER i basen (`ADR-109` beslut 5,
tabellen `Kvitton`) och flyttas ut. Rätt form är därför **öppen rivning**
av `ADR-063` beslut 2 och 6 för betalningsdomänen, i den ADR:ns § Updates
— samma form som dess egen post 2026-08-14 — inte ett tyst undantag här.

**F. Behålla `ADR-109`:s allokeringsprotokoll även i Postgres.** Avvisat:
protokollet finns till för att kompensera P1–P3. En sekvens plus en unik
nyckel ger samma garanti med två rader SQL i stället för fem steg med
retry, och den gör garantin till en databasegenskap i stället för kod som
kan glömmas.

## Konsekvenser

**Positiva.** Kvittots unikhet blir en databasgaranti i stället för ett
bevisat protokoll. Sekvensen är tät och atomär utan kompensation.
Betalningsvolymen hotar aldrig basens radtak eller dess delade
anropstak. Lottas bas fungerar orörd genom spegeln. Verifikationskravet
(Roger, användarberättelse 32–33) uppfylls av en post per bankrad med
ögonblicksbild. Härledningen tar bort hela klassen "Lotta väljer fel
fack".

**Negativa och skuld.** Sanningen är **tvålagrig** — anmälan i basen,
pengarna i Postgres — och den kostar: en spegelskrivning som kan
fallera (omförsök, eftersläpning synlig), en konsistensvakt att bygga och
underhålla, och ett mentalt hopp för den som felsöker. Prod-momenten
(migrationer, fält, backfill, flagga) är Marcus-steg med checklista, inte
något en agent kan göra. `docs/reference/data-model.md` måste uppdateras
per fält-ID i BÅDA baser. Spegelfälten kräver poster i
`supabase/functions/_shared/field-allowlists.ts` (deny-by-default) innan
någon skrivning fungerar. Och en gräns som inte får glömmas: så länge
`Saknas (kr)` är en Airtable-formel över spegelvärden är den lika färsk
som spegeln — aldrig färskare.

**Prod-halvan är obelagd, med avsikt.** Prod-Postgres-versionen och
prod-planens gränser kunde inte mätas av en agent (prod-ref fälls av
`scripts/deny-prod-ref.sh`). De mäts av Marcus i prod-runbooken
(`TASK-346.11`).

## Relaterat

- [`ADR-063`](ADR-063-airtable-bas-som-forstklassig-leverabel.md) —
  basen som förstklassig leverabel; § Updates 2026-08-30 bär den öppna
  rivningen av beslut 2 och 6 för betalningsdomänen.
- [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  — kvittoserien; § Updates 2026-08-30 bär rivningen av beslut 2, 5 och 7
  samt mekanismen i beslut 6.
- [`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md)
  — prejudikatet: Postgres-tabell, RLS, skrivning via Edge Function med
  `service_role`.
- [`ADR-129`](ADR-129-jobbmotorn-ko-cron-och-kick.md) — jobbmotorn som
  bär kvittoutskicken.
- [`ADR-057`](ADR-057-lager-oberoende-fitness-invariant.md) — **krockar
  inte, och behöver ingen amendering.** (a) UI når data via adaptern;
  (b) beroendet är enkelriktat; (c) port-pariteten gäller — nya portar
  måste in i BÅDA adaptrarna (`SupabaseAdapter` får kasta
  `NOT_IMPLEMENTED` som i dag); (d) dubbel-källa är precis den vision
  invarianten skrevs för. Edge Function-lagret är fortsatt "adaptern"
  utåt, och Postgres nås via den med `service_role` precis som i
  `ADR-110`.
- [`ADR-125`](ADR-125-bilagornas-modell-och-promoveringsvag.md) —
  bilagemallarna som läser prisfritexten (beslut 7:s skäl).
- [`airtable-constraints.md`](../reference/airtable-constraints.md) §A
  (P1–P3) — den strukturella grunden för varför en atomär sekvens och en
  unik nyckel inte kan uttryckas i basen.
- `tasks/sessions/2026-08-29-session-113.md` § Del 11 — grillningens
  tretton beslut med Marcus kvittenser.
- [`verifiering-kvittoskivning-afk-natt-2026-08-30.md`](../research/verifiering-kvittoskivning-afk-natt-2026-08-30.md)
  § 4 — den adversariella granskningen av ADR-snittet, vars rättelse av
  ordet "undantag" alternativ E följer.
