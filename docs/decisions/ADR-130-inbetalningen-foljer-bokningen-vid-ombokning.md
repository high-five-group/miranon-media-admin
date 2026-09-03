# ADR-130: Inbetalningen följer bokningen — ombokning flyttar bokföringsposten, aldrig kvittot

- **Status:** Accepted (grillad samsyn S115 Del 3 beslut 8, 2026-09-03:
  *"Pengarna vid ombokning: inbetalningen flyttas till den nya anmälan,
  spegeln räknas om på båda. Kvittots beteende avgörs av research-passet."*
  Beslutet flaggades i samma grillning uttryckligen som ADR-kandidat och
  mintas här, när researchen är klar.)
  **ADR-baren** (`~/.claude/CLAUDE.md` § ADR-BAR) klaras på alla tre villkor:
  **svårt att återställa** — en inbetalning är en bokföringspost, och när den
  bokförts mot en annan anmälan är kopplingen till den ursprungliga
  affärshändelsen bara läsbar via aktivitetsloggen; det är dessutom svårt att
  återställa i KOHERENS, eftersom ett kvitto som redan är utskickat pekar på en
  inbetalning som numera hör till ett annat event. **Överraskande utan kontext**
  — den som läser `inbetalningar`-raden ensam ser ett `ogonblicksbild_event`
  som INTE är det event kvittot beskriver, och skulle utan denna ADR läsa det
  som en defekt. **Resultat av en verklig avvägning** — tre modeller vägdes
  mot svensk rätt, branschpraxis och vår egen datamodell, och den valda bär ett
  pris som redovisas i § Konsekvenser.
- **Datum:** 2026-09-03
- **Fas:** Fas 6 — PRD `TASK-368` (avbokning och ombokning av anmälan i
  appen), skiva `TASK-368.4`
- **Rör:** `supabase/functions/rebook-registration/` ·
  `supabase/functions/_shared/rebook-registration.ts` ·
  `supabase/functions/_shared/create-registration.ts` ·
  `inbetalningar.anmalan_record_id` / `ogonblicksbild_event` /
  `ogonblicksbild_eventdatum` · `kvitton` (rörs ALDRIG) ·
  aktivitetsloggens verb `bokade om anmälan` · anmälans `Notering` i
  Airtable-basen
- **Relation till tidigare beslut:** förutsätter
  [`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
  (inbetalningen är sanningen, basen bär en app-skriven spegel) och
  återanvänder dess härledning oförändrad · lämnar
  [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  helt orörd — ingen ombokning förbrukar ett kvittonummer · ärver
  [`ADR-110`](ADR-110-aktivitetsloggens-lagring-supabase-inte-airtable.md):s
  form (skrivning via Edge Function med `service_role`, spårbarhet i
  `activity_log`) · bygger vidare på `TASK-368.2`:s övergångstabell
  (`_shared/cancel-registration.ts`) i stället för en andra kopia.

---

## Kontext

### Problemet, som Lotta faktiskt möter det

En deltagare ringer och säger att hon inte kan komma på oktoberkursen men gärna
går den i november. I dag måste Lotta gå till Airtable-basen, byta status för
hand på den gamla anmälan, skapa en ny för hand på det nya eventet — och sedan
själv hålla reda på att personens pengar fortfarande sitter registrerade på den
GAMLA anmälan. Följden är att personen ser obetald ut på det event hon faktiskt
ska gå på, och betald på ett event hon inte går på. Betalningsinkorgen
(`hamta-oppna-betalningar`) räknar henne som en öppen post, och
påminnelseutskicket skulle nå henne trots att hon betalat.

Det är inte ett UI-problem. Det är en fråga om var en bokförd betalning HÖR
HEMMA när den affärshändelse den avsåg byter form.

### Vad som gör frågan svår

Ett kvitto är redan utfärdat och utskickat i många av dessa fall. Kvittot är en
**verifikation** i bokföringslagens mening, och verifikationer får inte skrivas
om i tysthet. Samtidigt är själva inbetalningsraden en **bokföringspost**, och
en bokföringspost FÅR rättas — med spårbarhet. Om de två behandlas som samma
sak blir svaret antingen för strängt (varje ombokning kräver kreditkvitto plus
nytt kvitto) eller för slappt (kvittots innehåll skrivs om så att det matchar
det nya eventet).

### Vad research-passet fann

Underlaget är
[`docs/research/kvitto-vid-ombokning-2026-09-03.md`](../research/kvitto-vid-ombokning-2026-09-03.md)
(primärkällor hämtade och extraherade lokalt, inte sammanfattningar i
mellanled). Fyra fynd bär detta beslut:

1. **Bokföringslagen skiljer på två saker som lätt blandas ihop.**
   5 kap. 5 § reglerar rättelse av en **bokföringspost** och kräver bara att
   det framgår *"när rättelsen har skett och vem som har gjort den"*. 5 kap. 9 §
   reglerar rättelse av en **verifikation**. Kontextens ursprungliga fråga
   pekade på fel paragraf; rättelsen är gjord i research-doket § 1.1.
2. **BFN:s vägledning till BFNAR 2013:2 (allmänna råden 5.15/5.16)** ger exakt
   två lagliga vägar när en verifikations innehåll behöver ändras: rättelse där
   *"den ursprungliga uppgiften klart framgår"*, eller ersättning med en ny där
   den ersatta *"utgör även fortsättningsvis räkenskapsinformation"*. Ingen av
   dem KRÄVS för en ren omdisponering av en bokföringspost.
3. **Branschmönstret är entydigt.** Inget av de undersökta systemen
   (Eventbrite, Billetto, Fortnox/Visma/Bokio-mönstret, Pretix) utfärdar ett
   nytt finansiellt dokument för en ren datum-/produktväxling utan prisdelta.
   Prisdeltat hanteras däremot alltid som en EGEN transaktion.
4. **Vårt eget schema har redan avgjort halva frågan.** `kvitton`-tabellens
   grants ger `service_role` INSERT + SELECT plus en KOLUMN-SCOPAD UPDATE på
   `(lagringsnyckel, skickad_nar, mottagare, status)` och ALDRIG DELETE
   (migration `20260830195728`, § 4). `inbetalning_id`, `ar`, `lopnummer` och
   `typ` kan alltså inte ändras efter utfärdandet, oavsett vad
   ombokningskoden gör. Att kvittot står kvar är en **mätt egenskap hos
   databasen**, inte en konvention någon kan glömma.

### Den analytiska nyckeln

`inbetalningar` ÄR bokföringsposten (BFL 5 kap. 5 § — får rättas/omdisponeras
med spårbarhet). `kvitton` plus den sparade PDF:en ÄR verifikationen (5 kap.
9 § — förblir oförändrad eller ersätts av en ny med hänvisning). Ombokningens
flytt av `anmalan_record_id` är därför en rättelse på LEDGER-nivå, inte en
verifikations-rättelse — och kräver just därför inget nytt kvitto, så länge
flytten är spårbar och priset är oförändrat.

---

## Beslut

### 1. Inbetalningen följer bokningen

Vid en ombokning flyttas personens AKTIVA inbetalningar från den gamla anmälan
till den nya: `inbetalningar.anmalan_record_id` pekas om, och
`ogonblicksbild_event`/`ogonblicksbild_eventdatum` uppdateras till mål-eventet.

Ögonblicksbilden uppdateras — den lämnas INTE kvar på det gamla eventet. Skälet
är verifikationskravet självt (`ADR-128` beslut 1: posten ska kunna läsas ensam
år efteråt): en rad vars `anmalan_record_id` pekar på novemberkursen men vars
`ogonblicksbild_event` säger oktoberkursen är sämre spårbar, inte bättre. Vad
kvittot en gång beskrev bevaras i stället där det hör hemma — i kvittots egen,
oföränderliga rad och i den frusna PDF:en.

`ogonblicksbild_namn` rörs aldrig: personen är densamma.

### 2. Kvittot rörs ALDRIG — och kan inte röras

Ombokningen skriver aldrig i `kvitton` och rör aldrig `inbetalningar.kvitto_id`.
Det utfärdade kvittot fortsätter peka på samma inbetalning, med samma nummer,
år och belopp.

Detta är inte en regel koden håller — det är en gräns databasen sätter (§ Vad
research-passet fann, punkt 4). **Skulle ett framtida behov uppstå att "peka om"
ett kvitto direkt är det en signal att designen gått fel, inte något att arbeta
runt med en migration som luckrar upp grant-satserna.**

### 3. Flytten är en rättelse av bokföringspost, och spårbarheten byggs

BFL 5 kap. 5 § kräver att det framgår NÄR rättelsen skedde och VEM som gjorde
den. Två oberoende spår skrivs:

- **Aktivitetsloggen**: verbet `bokade om anmälan` med den gamla anmälan som
  objekt och den nya i `context.extensions`
  (`NY_ANMALAN_EXTENSION_IRI`), skrivet server-side med den verifierade
  anroparens identitet och tidsstämpel.
- **Anmälans `Notering` i basen**: en datumstämplad rad
  `[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>`, appendad så att
  befintlig text bevaras byte för byte. Den raden är för Roger och Lotta, som
  läser basen direkt.

Loggen är best-effort och fäller aldrig operationen (`skrivAktivitet`s egen
disciplin) — men den är det spår paragrafen efterfrågar, och därför byggs BÅDA
spåren, inte ett.

### 4. Prisskillnad bokförs som MELLANSKILLNAD, via befintlig mekanik

Är det nya eventet dyrare eller billigare bokförs **bara mellanskillnaden**,
aldrig hela beloppet om:

- **Dyrare** → en vanlig tilläggsinbetalning (positiv rad) med sitt EGET
  kvitto, nästa nummer i serien. Det är en genuin ny betalning.
- **Billigare** → en återbetalning (negativ rad) med kreditkvitto som hänvisar
  till originalet — exakt den mekanik `TASK-346.9` redan implementerat
  (`kvitton.original_kvitto_id`, constrainten
  `kvitton_kreditkvitto_har_original`). Ingen ny kod, ingen ny relation.

**Ombokningsoperationen utför INTE dessa steg automatiskt.** Den RÄKNAR UT
skillnaden och säger den rakt ut i sitt svar (`prisskillnad`, positiv/negativ/
`null`), så att appen kan visa den med en väg till "Registrera inbetalning"
respektive "Registrera återbetalning". Att automatiskt utfärda ett kvitto eller
en kreditering vore att låta en datumändring flytta pengar utan att någon
beslutat det — se § Alternativ, (v).

Talet härleds inte av en egen prisregel: det ÄR
`harledBetalning(...).saknas` för den nya anmälan
(`_shared/betalningsharledning.ts`, oförändrad).

### 5. Makulerade inbetalningar flyttas aldrig

Bara rader med `status = 'aktiv'` flyttas. En makulerad post är en RÄTTAD post:
den räknas inte i någon summa (härledningen filtrerar på samma villkor) och hör
hemma där den registrerades, mot den affärshändelse den avsåg. Villkoret ligger
i SQL-frågan, inte i en tidigare läsning.

### 6. Idempotensen vilar på server-sida fakta, inte på en nyckel

Ordningen är: ny anmälan → flytt i Postgres → statusbyte på den gamla → spegel
på båda → logg. Den ordningen är vald så att allt som kan gå fel gör det medan
den gamla anmälan fortfarande är aktiv — då är läget läsbart och Lotta kan göra
om.

Vad som redan är gjort avgörs av fakta servern äger: den gamla anmälans STATUS,
om det redan finns en anmälan för personen på mål-eventet (affärs-unikheten
Normaliserad e-post × EventKey, som `create-registration` redan bär), och om
den gamla anmälans Notering bär en Ombokad-rad mot PRECIS detta målevent. En
klient-buren `Idempotency-Key` duger inte som facit (repot lagrar den
bevisligen inte server-side). Ett andra identiskt anrop skapar därför ingen
anmälan, flyttar noll rader, skriver ingen status och loggar inget.

### 7. Adoption sker ENDAST när anropet är samma request upprepad

Finns det redan en anmälan för personen på mål-eventet får ombokningen använda
den — **adoptera** den — bara när BÅDA dessa fakta håller samtidigt:

1. den gamla anmälan är redan `Avbokad/Ombokad`, och
2. dess Notering bär en Ombokad-rad som pekar på detta målevent.

I alla andra lägen avvisas ombokningen med `redan_anmald_pa_malet` (409) — det
gäller oavsett om den befintliga anmälan på målet är aktiv, avbokad eller
inställd. **Två anmälningars ekonomi slås aldrig ihop automatiskt.**

Detta är en INSKRÄNKNING av beslutets första form, gjord efter granskningen av
`PR #2247` (Marcus, 2026-09-03). Den första formen adopterade vilken befintlig
mål-anmälan som helst, vilket gjorde sekvensen omkörbar även efter ett avbrott
mitt i — men innebar också att pengar kunde flyttas mellan två genuina
anmälningar på en knapptryckning, utan att någon beslutat det. Mellan
"alltid omkörbar" och "slår aldrig ihop någons pengar" väljer vi det senare;
priset står i § Konsekvenser.

Notering-raden är alltså INTE en idempotensnyckel i egen rätt — den är ett av
två villkor, och det svagare av dem (Lotta får redigera fältet i basen). Ett
anrop där bara raden finns, eller bara statusen, adopterar ingenting.

---

## Alternativ som övervägdes

### (i) Låt pengarna ligga kvar på den gamla anmälan

**Förkastat.** Det är dagens läge, och det är hela problemet: personen ser
obetald ut på det event hon ska gå på och betald på ett hon inte går på.
Betalningsinkorgen och påminnelseutskicket agerar båda på den bilden.
Alternativet kräver dessutom att Lotta manuellt registrerar om betalningen på
den nya anmälan — vilket skapar en SANN dubblett i ledgern (två inbetalningar
för en betalning) om hon glömmer att makulera den gamla.

### (ii) Kreditera hela originalet och utfärda ett nytt kvitto

**Förkastat för ombokning till samma pris.** Det är den tyngsta vägen: två
extra dokument för en händelse där ingen krona byter riktning. Den förbrukar
TVÅ kvittonummer i en serie som är Rogers bokföringsserie, inte en UI-räknare
— exakt den seriedrift `ADR-109`/`ADR-128` byggdes för att undvika. Den bryter
dessutom mot branschmönstret (inget undersökt system omutfärdar för en ren
produktväxling) och är en semantisk felanvändning av kreditkvittot, vars hela
existensberättigande i vår modell är en ÅTERBETALNING.

**Rätt användning kvarstår:** när ombokningen medför en faktisk prisskillnad
(beslut 4) är kreditkvittot korrekt — för mellanskillnaden, inte för hela
beloppet.

### (iii) Ett nytt, ersättande kvitto som hänvisar till originalet

**Förkastat.** Formen är laglig (BFN allmänt råd 5.16) men fel verktyg här: den
förutsätter att verifikationens INNEHÅLL var felaktigt redan när den
utfärdades. Ett "ersättande" kvitto utan motsvarande pengarörelse är svårt att
förena med BFL 5 kap. 6 § (*"för varje affärshändelse ska det finnas en
verifikation"*) — vilken affärshändelse skulle det dokumentera? Det kräver
dessutom en helt ny typ i `kvitton.typ`-constrainten och en ny relation utöver
`original_kvitto_id` (som är hårdkopplad till `typ = 'kreditkvitto'`), alltså
mer schemaarbete för ett scenario (ii) redan täcker när det verkligen behövs
och beslut 1 täcker när det inte gör det.

### (iv) Skriv om det utfärdade kvittots innehåll så att det matchar nya eventet

**Förkastat, och strukturellt omöjligt.** Det är precis vad BFN:s vägledning
förbjuder e contrario (en tyst överskrivning där originalet inte längre framgår)
— och grant-satserna gör det ogörligt oavsett. Nämns här för att det är den
intuitiva "fixen" en framtida läsare kan tro saknas.

### (v) Låt ombokningen automatiskt bokföra prisskillnaden

**Förkastat.** En tilläggsinbetalning är ett påstående om att pengar KOMMIT IN;
en återbetalning är ett påstående om att pengar GÅTT UT. Ingetdera är sant för
att ett datum ändrades. Att låta ombokningen skriva dem hade skapat
ledger-rader utan motsvarande banktransaktion — och vid dyrare event ett kvitto
på en betalning som ännu inte gjorts. Operationen SÄGER skillnaden; Lotta
utför den när pengarna faktiskt rör sig, via vägar som redan finns.

### (vi) Vidga `service_role`s grants så att kvittot kan pekas om

**Förkastat, och uttryckligen avrått i research-passets rekommendation 3.** Den
kolumn-scopade UPDATE-granten är det enda som gör kvittots identitet
oföränderlig i praktiken, inte bara i prosa. Att luckra upp den för att lösa ett
ombokningsproblem hade tagit bort husets starkaste garanti för att lösa ett
problem som inte kräver den.

---

## Konsekvenser

**Vad som blir bättre.** Personen ser rätt betalläge på rätt event direkt efter
ombokningen. Betalningsinkorgen och påminnelserna agerar på en sann bild.
Kvittoserien fortsätter motsvara exakt de faktiska betalningarna. Lotta slipper
hålla ihop tre manuella steg i basen.

**Priset: en inbetalningsrad kan peka på ett annat event än sitt kvitto.** Det
är den koherenskostnad ADR-baren ovan pekar ut, och den är verklig. Ett kvitto
utfärdat för oktoberkursen ligger kvar på en inbetalning vars ögonblicksbild nu
säger november. Den som läser bara de två raderna ser en avvikelse; den som
läser aktivitetsloggen ser varför. **Vi köper alltså läsbarhet i nuet mot ett
krav på att spåret faktiskt läses vid en granskning** — vilket är exakt vad BFL
5 kap. 5 § tillåter, och exakt varför beslut 3 bygger två spår i stället för
ett.

**Priset för beslut 7: ett smalt läge kräver handpåläggning.** Avbryts en
ombokning EFTER att den nya anmälan skapats men FÖRE statusbytet skrivits, kan
den inte köras om — nästa försök avvisas med `redan_anmald_pa_malet`. Läget är
strukturellt oskiljbart från "personen var redan anmäld dit": den nyskapade
raden bär `Källa: Manuell`, status `Obekräftad` och tom Notering, precis som en
manuellt skapad. Fönstret är smalt (mellan två på varandra följande
skrivningar) och utfallet är läsbart — den gamla anmälan står kvar aktiv med
pengarna på sig, och båda raderna syns i basen — men det kräver att någon
tittar. Alternativet vore att gissa, och en gissning som gissar fel flyttar
någons pengar. **Felmeddelandet säger därför rakt ut vad som ska kontrolleras**
i stället för att bara neka.

**Vad som INTE löses här.** Ingen spårbar LÄNK mellan gammal och ny anmälan
skapas i Airtable-basen (PRD `TASK-368` § Utanför omfattningen) — kopplingen
finns i aktivitetsloggen och i Notering-raden, inte som ett länkfält. Inget mail
går ut vid en ombokning i v1. Prisskillnaden bokförs inte automatiskt
(beslut 4). Och `Avtalat pris (kr)` på den gamla anmälan följer INTE med till
den nya: ett förhandlat pris gällde det event det förhandlades för, och att
flytta det tyst hade varit ett prisbeslut fattat av kod.

**Deploy-konsekvens.** Ingen migration krävs — `service_role` har redan
table-level UPDATE på `inbetalningar` (migration `20260830195728`, § 4:
`grant select, insert, update, delete on public.inbetalningar to
service_role;`), och att kolumnen faktiskt går att skriva är verifierat skarpt
mot staging, inte antaget. Det som måste deployas är den nya funktionen
`rebook-registration` och den omdeployade `create-registration` (dess skrivkärna
flyttades till `_shared/create-registration.ts`, oförändrad i sak).

---

## Relaterat

- [`docs/research/kvitto-vid-ombokning-2026-09-03.md`](../research/kvitto-vid-ombokning-2026-09-03.md)
  — hela underlaget: BFL, BFN:s vägledning, Skatteverkets kassaregisterregler
  (analogt), sju branschsystem, och grant-fyndet.
- [`ADR-128`](ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md) —
  inbetalningen som sanning, spegeln som projektion.
- [`ADR-109`](ADR-109-kvittoserien-nummerformat-server-side-allokering.md) —
  kvittoserien; orörd av detta beslut.
- [`ADR-063`](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — basen som
  förstklassig leverabel; Notering-raden är dess sida av spårbarheten.
- `supabase/functions/_shared/rebook-registration.ts` — beslutens rena logik.
- `supabase/functions/rebook-registration/index.ts` — ordningen och stegens
  felrapportering.

## Updates

### 2026-09-03 — Adoptionen inskränkt till omkörningsfallet (granskningen av `PR #2247`)

Beslutets första form lät ombokningen adoptera vilken befintlig mål-anmälan som
helst. Granskningen av `PR #2247` bedömde det som hög risk, och Marcus avgjorde
samma dag: **ingen tyst sammanslagning av två anmälningars ekonomi.** Beslut 7
ovan är resultatet, och § Konsekvenser bär priset (ett smalt läge som kräver
handpåläggning i stället för en omkörning). Ingen annan del av ADR:n ändrades —
flytten, kvittots orörlighet, de två spåren och prisskillnadens hantering står
som de skrevs.
