# Backfill av inbetalningar — regeln, avvikelselistan och Lottas lista

> **Äger:** backfillens regel, avvikelseklasserna och formen för hur Lottas
> lista används som facit (`TASK-346.8` AC #3). **Kartlägger:**
> [`ADR-128`](../decisions/ADR-128-inbetalningen-som-sanning-postgres-och-spegeln.md)
> (beslut 2 härledningen, beslut 8 backfillen), `docs/reference/data-model.md`
> § Stagingbasens additiva tillskott (prisfälten), `scripts/backfill-inbetalningar.mjs`
> (mekaniken, i sitt eget filhuvud). **Vid konflikt vinner:** koden —
> skriptet är den auktoritativa källan för vad backfillen faktiskt gör
> ([`ADR-100`](../decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md) §1).

---

## Varför backfillen finns

`ADR-128` beslut 2 härleder betalningsfacken ur **summan av inbetalningarna**
mot priset. Regeln är sann för varje anmälan som registrerats i appen — och
falsk för varenda anmälan som fanns innan betalningsdomänen byggdes: basen
säger `Anmälningsavgift: Mottagen`, Postgres har noll inbetalningar, och
härledningen säger därför *Ej mottagen* medan `Saknas (kr)` visar hela priset.

PRD `TASK-346` § Datamodell namnger åtgärden: *"Härledningen är universell
från dag ett efter full betalnings-backfill (Närvarande ⇒ betalt, Mottagen ⇒
betalt, belopp = dåvarande pris, betalsätt Historik, datum okänt)"*.

```bash
npm run backfill:inbetalningar                # DRY-RUN (default) — skriver inget
npm run backfill:inbetalningar -- --utfor     # skarp körning
npm run backfill:inbetalningar -- --json      # planen maskinläsbart
```

---

## Regeln, i den ordning villkoren prövas

| # | Villkor | Utfall | Belopp |
|---|---|---|---|
| 1 | Anmälan saknar event-länk | hoppas över (`ingen-event-lank`) | — |
| 2 | Eventet är exkluderat (`ZZ-`-ort eller uttryckligen listat ID) | hoppas över (`exkluderat-event`) | — |
| 3 | En `Historik`-post finns redan | hoppas över (`redan-backfillad`) | — |
| 4 | Avgift `Ej mottagen` **och** slutbetalning `Mottagen` | **AVVIKELSE** (`fack-motsagelse`) | — |
| 5 | Inget mottaget fack och ingen närvaro | hoppas över (`inget-betalt`) | — |
| 6 | Priset kan inte härledas | **AVVIKELSE** (`pris-okant`) | — |
| 7 | Ett `Närvarande`/`Deltog online`-deltagande finns | backfillas (`narvaro`) | **hela priset** |
| 8 | Eventtypen är `Föreläsning` och något fack är `Mottagen` | backfillas (`forelasning`) | **hela priset** |
| 9 | Båda facken `Mottagen` | backfillas (`bada-facken`) | **hela priset** |
| 10 | Bara avgiften `Mottagen`, avgiftens pris känt | backfillas (`anmalningsavgift`) | **anmälningsavgiften** |
| 11 | Bara avgiften `Mottagen`, avgiftens pris **okänt** | **AVVIKELSE** (`avgiftspris-okant`) | — |

**Närvaro står över facken** (rad 7 före 9–10): en person som var på plats har
gått kursen, oavsett vad kryssen säger.

Varje skapad post får `betalsatt = 'Historik'`, `betalningsdatum = NULL`
(datum okänt — kolumnen är nullable med avsikt) och sin **källa bokförd i
`skapad_av`**, till exempel:

```text
Backfill TASK-346.8 (narvaro; pris ur eventinnehall.pris-kr)
```

### Priset hämtas i fyra fallande nivåer, och källan bokförs

1. `Anmälningar.Avtalat pris (kr)` — vinner när satt, **0 inkluderat**
2. `Eventplanering.Pris (kr)` / `Anmälningsavgift (kr)`
3. `Eventinnehåll.Pris (kr)` / `Anmälningsavgift (kr)` — standarden för (Event × Typ)
4. `Eventinnehåll.Pris` / `Anmälningsavgift` — **fritexten**, sist och bara som
   historisk räddning

Nivå 1–3 är `valjPris` ur `_shared/betalningsharledning.ts` — samma funktion
appen kör. Nivå 4 är backfillens egen, och dess tolkningsregel är bokförd:

| Fritext | Tolkas som | Regel |
|---|---|---|
| `"2.500"` | 2500 | avgränsare + **tre** siffror = tusental |
| `"2,500"` | 2500 | samma |
| `"1000:-"` | 1000 | valutasuffix strippas |
| `"2 500 kr"` | 2500 | blanksteg strippas (även hårt/tunt/smalt) |
| `"2500.50"` | 2500,50 | avgränsare + **en–två** siffror = decimaler |
| `"ca 2500"` | **null** | listas för Marcus, gissas aldrig |
| `"1.234.567"` | **null** | två avgränsare är tvetydigt |
| `"-100"` | **null** | ett pris är aldrig negativt |

> **Denna parser är avsiktligt INTE `normaliseraBelopp`.**
> `_shared/betalningsbelopp.ts` avvisar `'2.500'` fail-closed, och dess
> filhuvud drar gränsen uttryckligen: *"Prisfritexten i basen parsas ALDRIG av
> denna funktion."* Skälet är att de två läser olika saker: `normaliseraBelopp`
> läser vad Lotta skriver **nu** (hon står vid fältet och kan skriva om), medan
> denna läser en **historisk prislapp** där ingen finns att fråga. Konvergerar
> de två är den ena felaktig — `scripts/test-backfill-inbetalningar.mjs` § B17
> låser skillnaden.

---

## Vad backfillen ALDRIG gör

**Den gissar aldrig ett pris.** En anmälan vars pris inte kan härledas listas
för Marcus i stället för att backfillas (`TASK-346.8` AC #2).

**Den skriver aldrig ovanpå en inbetalning som redan finns.** En anmälan med
AKTIVA inbetalningar som inte är backfillens egna (`Historik`) hoppas över och
listas som `har-aktiva-inbetalningar`. Grinden prövar **förekomst**, inte
netto, och det är inte teoretiskt: granskningsrunda 3 mätte att
netto-noll-mönstret **finns i verklig staging-data** — en aktiv inbetalning och
en lika stor aktiv återbetalning på samma anmälan summerar till 0. En
netto-grind hade släppt igenom den och backfillat hela priset ovanpå, så att
spegeln sagt "allt betalt" för någon som netto betalat noll. I dag är det
`ZZ`-exkluderingen som skyddar (raderna ligger på fixtur-anmälningar), alltså
ett skydd som gäller av en annan anledning än den här grinden — i prod finns
ingen sådan exkludering, och förekomst-formen är det enda som bär.

**Den skriver aldrig en rad för fack-motsägelsen.** Kombinationen
`Anmälningsavgift: Ej mottagen` + `Slutbetalning: Mottagen` är i sig
motsägelsefull — man betalar inte slutbetalningen före avgiften. Härledningen
är en funktion av summan och kan strukturellt inte uttrycka den; beloppet
(pris − avgift) hade gett `Mottagen` / `Ej mottagen`, alltså **en flip av båda
facken** och en tyst omskrivning av Lottas egen data. Den klassen rättas mot
Lottas lista, av Marcus.

**Den rör aldrig `ZZ-`-namnrymden.** Båda dess klasser hålls utanför, av
motsatta skäl som pekar åt samma håll: en purge-bar sentinel raderas ändå (och
lämnar en föräldralös Postgres-rad), och en permanent fixtur har ett låst
förväntat tillstånd som andra testsviter mäter mot.

**Den rör aldrig prod.** Project-refen prövas mot `.prod-ref-policy.conf`, och
prod-refen står medvetet **inte** i backfillens egen policyfil — en kopia dit
hade gjort `scripts/deny-prod-ref.sh` verkningslös för varje agent som läser
repot.

---

## Avvikelselistan — och hur Lottas lista rättar den

Avvikelselistan är backfillens **huvudleverans** när basen är tunn på priser.
Varje rad bär:

| Kolumn | Betydelse |
|---|---|
| `anmalanRecordId` | Anmälans record-ID i basen — nyckeln att rätta mot |
| `namn` | Deltagarens namn (Förnamn + Efternamn) |
| `event` · `ort` | Vilket event anmälan hör till |
| `fackAvgift` · `fackSlut` | Vad basen säger i dag |
| `kod` | Avvikelseklassen (`pris-okant`, `fack-motsagelse`, `avgiftspris-okant`) |
| `skal` | Varför raden inte kunde backfillas |

### Lottas lista är facit — så används den

"Lottas lista" är hennes egen pappersföring över vem som betalat vad. När den
finns rättas avvikelserna i denna ordning:

1. **`pris-okant` — rätta PRISET, inte inbetalningen.** Fyll eventets
   `Pris (kr)` / `Anmälningsavgift (kr)` i Eventplanering (eller
   Eventinnehåll-standarden, om priset gäller alla event av den typen). Kör
   sedan backfillen igen: raden faller ut av sig själv, med rätt belopp och
   rätt källa. **Skriv aldrig in ett belopp i inbetalningen för hand** — då
   flyttas priset ur basen in i en Postgres-rad ingen kan se.
2. **`fack-motsagelse` — avgör vad som faktiskt hände.** Antingen är avgiften
   betald (rätta `Anmälningsavgift` till `Mottagen` i basen) eller så är
   slutbetalningen inte det (rätta `Slutbetalning` till `Ej mottagen`). Kör
   sedan backfillen igen.
3. **`avgiftspris-okant` — fyll `Anmälningsavgift (kr)`** på eventet eller
   standarden, och kör om.
4. **Ett belopp som inte följer priset** (delbetalning, rabatt) sätts som
   `Avtalat pris (kr)` på anmälan — då vinner det över eventets pris i
   härledningen, för både backfillen och appen.

Efter varje rättning: kör `npm run backfill:inbetalningar` (dry-run) och läs
planen innan `--utfor`. Backfillen är idempotent, så en omkörning rör aldrig
det som redan är gjort.

---

## Idempotensen är strukturell

Varje rad skrivs som `insert … select … where not exists (… betalsatt =
'Historik' …)`. Omkörningen skapar noll rader därför att **databasen** avgör
det i samma sats som insert-en, inte därför att skriptet minns vad det gjorde.

**De två halvorna är idempotenta av OLIKA skäl, och bara den ena är en
databasgaranti:**

| Halva | Egenskap | Varför |
|---|---|---|
| Postgres-raden | **strukturellt idempotent** | `where not exists` — databasen avgör, oavsett vad skriptet tror |
| Spegeln i basen | **konvergent** | skrivs i en andra operation mot ett annat system; ett avbrott emellan lämnar raden skriven och spegeln oskriven |

Spegeln repareras därför av **Del C, som itererar backfill ∪
redan-backfillade** — en anmälan som redan bär sin Historik-post får spegeln
omskriven ändå. Det är säkert per definition: spegeln är en **projektion** ur
Postgres-sanningen (ADR-128 beslut 6), och `harledBetalning` räknar om den
från grunden ur hela postmängden. En avbruten körning läker alltså vid nästa
körning i stället för att lämna ett permanent fel.

### Vad konvergensen kostar, och vad som betalar ned den

Den breddade iterationen har ett pris som är värt att säga rakt ut: spegeln
räknas om för **hela den backfillade populationen vid varje körning** —
linjärt i antal backfillade anmälningar, betalt i Airtable-anrop mot ett delat
tak på 5 req/s. Priset är avsiktligt (alternativet är ett permanent fel efter
ett avbrott), men det halveras billigt:

> **En patch vars värden REDAN står i basen hoppas över.** Skriptet jämför den
> beräknade patchen mot anmälans nuvarande spegelvärden (`patchArIdentisk`) och
> skickar ingen `PATCH` när de är lika. Vid en stabil population är andra
> körningen därför nästan gratis.

Hoppet **bokförs**, aldrig tyst: varje överhoppad rad skrivs som
`spegel <recID> oförändrad — PATCH hoppad`, och körningen avslutas med en
summering (`speglar: N skrivna, M hoppade`). Jämförelsen är **fail-open** —
saknas ett värde att jämföra mot skrivs patchen ändå, eftersom att skriva i
onödan är ofarligt medan att hoppa över en nödvändig skrivning inte är det.

Nyckeln är `(anmalan_record_id, betalsatt = 'Historik')` och **inte**
`bankreferens`, trots att den kolumnen bär ett partiellt unikt index som hade
gett samma garanti: bankreferensen är bankens transaktionsreferens
(dubblettnyckeln vid Swish-import, `TASK-346.10`), och en syntetisk
backfill-nyckel där hade lagt en främmande betydelse i ett fält en annan skiva
äger — och visats för Lotta på inbetalningens rad.

**Mätt 2026-08-31 (staging):** två `--utfor` i följd gav 1 respektive 0 nya
rader; `select … where betalsatt = 'Historik'` returnerade exakt en rad efter
båda.

---

## Mätningen (AC #3)

Skriptet mäter FÖRE och EFTER varje skarp körning:

- antal anmälningar
- antal inbetalningar
- summa (kr)
- antal anmälningar med **känt pris**
- antal "allt betalt", och andelen mot **två nämnare**

Andelen redovisas mot både alla anmälningar och dem med känt pris med avsikt:
ett ensamt tal hade dolt att **nämnaren är det som saknas**. I stagings fall är
det hela poängen — se nedan.

### Staging-mätningen 2026-08-31

> **Vilken körning talen gäller:** den FÖRSTA skarpa körningen (2026-08-31,
> ~02:5x UTC), där backfillen faktiskt skrev. Senare körningar visar andra
> absoluta tal utan att något är fel — dels för att backfillen redan är gjord
> (FÖRE = EFTER), dels för att staging-populationen är RÖRLIG: `TASK-346.6`
> skapade och städade testdata mot `ZZ-GRANSKNING-S113` under samma natt, och
> `exkluderat-event` mättes till 49 → 53 → 57 → 49 i fyra på varandra följande
> körningar. Kortets notes bär den senare körningens tal med egen etikett.
> Jämför alltid FÖRE mot EFTER **inom samma körning** — aldrig mellan två.

| Mått | FÖRE | EFTER |
|---|--:|--:|
| antal anmälningar | 97 | 97 |
| antal inbetalningar | 1 | 2 |
| summa (kr) | 0 | 2 500 |
| anmälningar med känt pris | 23 | 23 |
| varav "allt betalt" | 0 | 1 |
| andel allt betalt (av alla) | 0,0 % | 1,0 % |
| andel allt betalt (av känt pris) | 0,0 % | 4,3 % |

Fördelningen över de 97: **1** backfillad · **24** avvikelser (22
`pris-okant`, 2 `fack-motsagelse`) · **72** överhoppade (49 exkluderat event,
13 inget betalt, 10 ingen event-länk).

**Det låga talet är ett fynd om DATAN, inte om skriptet.** Staging bär i
praktiken inga priser: enda numeriska prisparet utanför `ZZ-`-namnrymden är
Eventinnehåll-standarden `Resor i medvetandet 1 · Utbildning` (2500/1000,
parsad ur fritexten `"2.500"` / `"1000:-"` av `TASK-346.2`), och samtliga
`Fjärrskådning`-event i Falköping och Varberg saknar pris i alla fyra
nivåerna. 37 av 38 icke-`ZZ`-anmälningar med event kan därför inte backfillas
utan att ett pris gissas — vilket AC #2 förbjuder.

I prod väntas bilden vara en annan; se nedan.

---

## Prod — formen är BESTÄMD (`TASK-360`)

Marcus mandat, verbatim, 2026-09-02: *"Kör backfill. Gör det ordentligt."*

**Agenten kör aldrig prod själv, och skriptet kan inte fås att göra det med en
gissad flagga.** Prod är låst av fem oberoende lager, och det är viktigt att
läsa dem som just oberoende — inget av dem är "inställningen som ska ändras".
Kolumnen nedan stod tidigare "Nej" rakt av; det var korrekt för AC #4:s
öppna läge men är numera en förenkling — varje lager har fått en EGEN,
oberoende typa-för-att-bekräfta-gate (samma klass som
`scripts/create-betalningsfalt.mjs`/`scripts/create-eventinnehall-modell.mjs`
fick i `TASK-309.9`/PR #2192), inte en gissad flagga en agent kan sätta åt
honom:

| Lager | Vad det gör | Kan en flagga kringgå det? |
|---|---|---|
| `validateBaseGuard` | `forbiddenBaseIds` prövas **före** `expectedBaseId`, så prod-basen fälls även om den skulle stå som förväntad | **Nej** — men släpper när `AIRTABLE_PROD_GODKAND_AV_MARCUS` == den EXAKTA bas-ID:n |
| `validateProjectRef` | prod-refen läses ur `.prod-ref-policy.conf` och fälls **oberoende** av backfill-policyns egen lista | **Nej** — men släpper när miljövariabeln `.prod-ref-policy.conf`s `PROD_REF_BYPASS_VAR` namnger == den EXAKTA refen |
| `provaLanktillstand` | vägrar om `supabase/.temp/project-ref` pekar någon annanstans än målet — inklusive prod, ÄVEN med korrekt `--projekt-ref` (den HÅRDASTE grenen: den prövar `lankt === prodRef` oavsett `malRef`) | **Nej** — men släpper ENDAST kombinationen länk=PROD + mål=PROD, och ENDAST när BÅDA raderna ovan redan godkänt sin egen bypass (`prodGodkand`, TASK-360) |
| `scripts/deny-prod-ref.sh` | fäller varje **agent**-kommando som bär prod-refen i kommandosträngen | **Nej** — orörd av denna skiva, samma `PROD_REF_BYPASS_VAR`-prefix som redan fanns |
| `losToken` (TASK-360, review r2 PR #2208) | i prod-läge (`korMotProd`) krävs `STAGING_AIRTABLE_TOKEN` satt EXPLICIT i miljön — `.env.seed`s fallback läses ALDRIG, så ett staging-scopat token kan inte råka följa med in i en prod-körning | **Nej** — token-axeln har ingen bypass alls: saknas variabeln vägrar skriptet (tester S1–S5) |

Ingen kopia av prod-refens VÄRDE tillkom: `.backfill-inbetalningar-policy.json`
bär den fortfarande inte (§ A11 i testsviten låser det, oförändrat), och
`AIRTABLE_PROD_GODKAND_AV_MARCUS`/`PROD_REF_BYPASS_VAR` är miljövariabel-NAMN,
inte hemliga värden — värdena kommer alltid från miljön, aldrig från en fil i
repot. Varje gång en override faktiskt släpper igenom skrivs en synlig
`BYPASS ANVÄND`-rad till stderr (samma stil som `scripts/deny-prod-ref.sh`),
aldrig tyst.

**En prod-körning kräver därför fortfarande ett eget Marcus-beslut** — inte
ett kommando en agent konstruerar på eget initiativ. Det körbara kommandot
och den fullständiga miljövariabel-listan bor i prod-runbooken —
`TASK-346.11`/`TASK-360`,
[`prod-driftsattning-betalningsflodet-runbook.md`](prod-driftsattning-betalningsflodet-runbook.md)
§ Steg 13. Skriv det där, inte här: denna fil beskriver backfillens regel,
runbooken äger prod-sekvensen.

### Ordningen när beslutet väl är fattat

1. **Förutsättningen:** prod-basens nio betalningsfält måste finnas
   (`data-model.md` § Prod-fälten — ÖPPET AC #5 för Marcus). Utan dem kan
   inget pris härledas och varje rad blir `pris-okant`.
2. **Upplåsningen** — sätt BÅDA miljövariablerna (tabellen ovan) på
   kommandoraden, exakt till bas-ID:t respektive project-refen som
   `--bas`/`--projekt-ref` pekar på. Det exakta kommandot bor i
   prod-runbooken § Steg 13, inte här.
3. **Dry-run, och läs planen.** Det är här arbetet ligger; själva körningen
   är sekunder.
4. **Avvikelselistan mot Lottas lista** — rätta priserna i basen, kör om
   dry-run, upprepa tills listan är förstådd.
5. **Skarpt**, med `--utfor`.

### "Förväntade tal" — formen, och var de hämtas

**Prod är OMÄTT av agenten och kan inte vara annat.** Det finns därför inga
förväntade tal att skriva av här; att gissa dem vore precis den
kopierings-drift som gör ett tal fel utan att någon märker det. Formen är i
stället denna — Marcus fyller den vid körningen, ur skriptets egen
FÖRE-mätning (dry-run skriver ut den utan att röra något):

| Tal | Hämtas ur | Vad som är ett rimligt utfall |
|---|---|---|
| antal anmälningar | rapportens FÖRE-rad | prod-basens verkliga population |
| antal `pris-okant` | avvikelselistan | **lågt** om steg 1 är gjort; stort ⇒ priserna saknas i basen |
| antal `har-aktiva-inbetalningar` | avvikelselistan | 0 vid första körningen (prod-ledgern är tom, mätt 2026-08-30) |
| antal backfillade | Del B | resten av dem med mottaget fack eller närvaro |
| summa (kr) | EFTER-raden | ska stämma mot Lottas lista |

Blir `pris-okant` stort är svaret att fylla priserna **i basen** och köra om
— aldrig att sänka kravet i skriptet.

## Vad som INTE är gjort

- **Prod-körningen** — AC #4, väntar Marcus GO (ovan).
- **Fixtur-eventet `ZZ-GRANSKNING-S113`** (`recSahYCeTbEzFFe6`, Event-14061)
  är exkluderat i denna körning med bokfört skäl: `TASK-346.6` bygger
  acceptanstester mot dess anmälningar parallellt, och Marcus vandrar där.
  Ska det någon gång backfillas är det ett eget, medvetet beslut.
- **Aktivitetsloggen skrivs inte** av backfillen. `registrera-inbetalning`
  skriver en post per registrering; backfillen gör det inte, eftersom en
  historisk post inte har någon aktör och en logg med 97 rader "Backfill
  registrerade" hade dränkt Lottas verkliga historik. Källan bärs i stället av
  `skapad_av` på varje rad.
