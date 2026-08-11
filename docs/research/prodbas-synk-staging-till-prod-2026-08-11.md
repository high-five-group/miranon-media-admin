# Prod-basens synk mot staging — fullständig schema-diff och additiv apply-plan

> **Proveniens:** avgränsat research-pass (bakgrundsagent), 2026-08-11, kört
> oisolerat i huvudkatalogen på `main` @ `f5be8d1c` (rent arbetsträd).
> **READ-ONLY hela vägen:** ingen tabell, inget fält, ingen formel, ingen
> automation och ingen datarad har skapats, ändrats eller raderats i någon
> Airtable-bas. Ingen write-MCP har anropats. Filen är den enda som skrivits.

---

## Vad jag hittade i repot först

Inventeringen kördes före första live-anropet, per research-passets ordning.

| Yta | Vad den redan täckte | Ålder / status |
|---|---|---|
| `docs/research/` (107 poster) | **Ingen** post gör en staging↔prod-schemadiff. Närmast är [`presentationsmening-bas-eller-app-2026-08-10.md`](presentationsmening-bas-eller-app-2026-08-10.md) (nämner båda baserna i annat ärende) och [`staging-fixturinventering-2026-08-10.md`](staging-fixturinventering-2026-08-10.md) (fixturer, inte schema). | — |
| [`claude-ai-airtable-connector-flera-baser-2026-08-10.md`](claude-ai-airtable-connector-flera-baser-2026-08-10.md) | claude.ai-connectorn når **bara prod**; PAT-servern når båda. | 1 dag — håller, bekräftad i detta pass |
| [`ADR-075`](../decisions/ADR-075-anteckningar-tabell-i-basen.md) | Anteckningar-tabellen + `Person`-fältet, miljöstatus per 2026-08-10. | 1 dag — håller |
| [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md), [`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md), [`ADR-050`](../decisions/ADR-050-isolerad-staging-miljo.md) | Kvittoserien; basen som leverabel; staging-först-disciplinen. | håller |
| **[`data-model.md`](../reference/data-model.md) § Prod-basens additiva tillskott 2026-07-23** | **Ett redan fattat beslut som direkt avgör en av mina delfrågor:** `Väntelista (länkat fält)` speglades MEDVETET INTE till prod. | 2026-07-23 — **motiveringen falsifierad i detta pass, se delfråga 3** |
| [`schema_reference.md`](../reference/schema_reference.md) | Prods automationer A1–A11. | **Frusen mars 2026** — därför live-omläst här |

**Vad som därför är nytt i detta pass:** den fullständiga, mekaniskt beräknade
diffen (ingen sådan finns); en live-omläsning av prods automationer som ersätter
den frusna kartan på den punkt som avgör risken; och en prövning av det
kvarstående divergens-beslutets motivering mot faktiskt bas-tillstånd.

---

## Kort svar

**Prod saknar exakt tre saker, och alla tre är rent additiva:**

1. Tabellen **`Bilagor`** (5 fält)
2. Tabellen **`Kvitton`** (12 fält)
3. Fältet **`Väntelista.Event (länk)`** (`multipleRecordLinks` → Eventplanering)

Därtill föds fyra spegelfält automatiskt av Airtable när ovanstående skapas
(`Eventplanering.Bilagor`, `Eventplanering.Kvitton`, `Anmälningar.Kvitton`,
`Eventplanering.Väntelista`) — de skapas inte för hand.

**Inget finns i prod som saknas i staging.** Diffen är enkelriktad.

**Ingen semantisk drift finns i de 19 gemensamma tabellerna.** Samtliga 10
options-skillnader jag mätte är ren fält-ID-substitution — bevisat mekaniskt,
inte bedömt (se delfråga 1). Noll typändringar, noll namnändringar, noll
borttagna fält, identiska primärfält.

**Ingen av prods 11 automationer bevakar något fält som apply-planen rör** —
live-läst ur prod, inte hämtat ur den frusna kartan. Riskbilden är därmed
väsentligt mildare än `schema_reference.md` antyder.

**Den avgörande delfrågan var inte "vad saknas" utan "vad behöver appen nu".**
Svaret ändrar planens karaktär: **ingen prod-deployad Edge Function konsumerar
någon av de tre saknade ytorna.** Applyn är ett *prerekvisit* för framtida
EF-deployer, inte en reparation av en trasig prod-yta. Ordningen "tabell/fält
FÖRE EF, per miljö" gör detta till steg 1 av två — och steg 2 är ett eget
Marcus-beslut.

**Ett bokfört beslut måste omprövas innan punkt 3 appliceras:** `data-model.md`
motiverar den kvarstående `Väntelista`-divergensen med att *"staging-basen har
konverterat fältet, prod har inte"*. **Det är falskt.** Staging konverterade
aldrig — `Väntelista.Event` är `singleLineText` i BÅDA baserna, med **identiskt
fält-ID** (`fldC01Nf3lVWrOgdw`). Staging la ett nytt fält bredvid. Beslutets
sakskäl faller därmed, men punkt 3 har ett *annat* och starkare skäl att vänta
(inget skriver fältet — se delfråga 3).

---

## Metod och mätvärden

Bas-ID:n ur `data-model.md` / `.purge-staging-policy.json`: staging
`apphjj8Q7lkXCMsL4`, prod `app8uGPrVCVOm6LfD`.

Båda basernas fullständiga meta-schema hämtades **read-only** via Airtables
Meta-API (`GET /v0/meta/bases/{baseId}/tables`) och diffades med skript, i
stället för att jämföras med ögat. Motivet är mätdisciplinen: en fält-för-fält-
jämförelse av 412 mot 390 fält gjord för hand är inte reproducerbar och
felar tyst.

| Mätvärde | Staging | Prod |
|---|--:|--:|
| Tabeller | **21** | **19** |
| Fält totalt | **412** | **390** |

Live-läsningen av prods automationer gjordes via claude.ai-connectorn
(`list_automations`), som enligt föregående pass når prod. Detta kringgår
`airtable-constraints.md` P24:s påstående om automations-blindhet — se
"Oväntade fynd".

---

## Delfråga 1 — Den fullständiga diffen

### 1a. Tabeller som saknas i prod

| Tabell | Staging-ID | Fält | Primärfält |
|---|---|--:|---|
| `Bilagor` | `tblFamrna53MVf1nG` | 5 | `Namn` |
| `Kvitton` | `tblk8fZcArXPpRYnX` | 12 | `Kvittonummer` |

**Inga tabeller finns i prod som saknas i staging.**

### 1b. Fält som saknas i prod

| Tabell | Fält | Typ | Options | Skapas för hand? | Behövs av |
|---|---|---|---|---|---|
| `Väntelista` | `Event (länk)` | `multipleRecordLinks` | → `tblVE3UKWl1CKrphV` (Eventplanering) | **JA** | `get-event` (beläggningens väntelisteräkning) |
| `Eventplanering` | `Väntelista (länkat fält)` | `multipleRecordLinks` | invers till ovan | **NEJ** — auto-föds, men **kräver omdöpning**, se delfråga 3 | `get-event` läser detta namn |
| `Eventplanering` | `Bilagor` | `multipleRecordLinks` | invers till `Bilagor.Event` | **NEJ** — auto-föds | `get-event-attachments` |
| `Eventplanering` | `Kvitton` | `multipleRecordLinks` | invers till `Kvitton.Event` | **NEJ** — auto-föds | — (ingen läsare i kod) |
| `Anmälningar` | `Kvitton` | `multipleRecordLinks` | invers till `Kvitton.Anmälan` | **NEJ** — auto-föds | — (ingen läsare i kod) |

**Inga fält finns i prod som saknas i staging.**

### 1c. Skillnader som INTE är luckor — mekaniskt avfärdade

Diffen ger 10 options-skillnader och 24 fält-ID-skillnader i de gemensamma
tabellerna. Hypotesen "detta är semantisk drift" prövades i stället för att
antas: jag byggde en fält-ID-karta staging→prod (per tabellnamn + fältnamn),
substituerade ID:na i staging-sidans options och jämförde kanoniskt.

**Utfall: 10 av 10 förklarade av ren ID-substitution. 0 oförklarade.**

Det gäller även de fyra icke-triviala fallen — formlerna
`Personer.Senaste interaktion (text)` / `(datum)` och
`Anmälningar.Senaste anmälan (sammanfattning)`, samt rollupen
`Personer.Senaste anmälan datetimekey` — vars formeltext är teckenidentisk
bortsett från de refererade fält-ID:na. Fältbeskrivningarna är dessutom
ordagrant lika i båda baserna.

**Slutsats:** de 19 gemensamma tabellerna är i synk. Diffen är uteslutande de
tre saknade ytorna i 1a–1b.

### 1d. ID-topologin — en precisering av det dokumenterade

`data-model.md` § Snabbreferens bokför att baserna delar tabell- och fält-ID:n
för *duplicerade* ytor, medan *nya fält* får distinkta ID:n per bas. Min mätning
bekräftar båda och lägger till en post dokumentet inte säger:

**Nya TABELLER får också distinkta ID:n.** `Anteckningar` är
`tbl87a23xDv19Mb6R` i staging och `tblaUhH1KF9k9imul` i prod. `Bilagor` och
`Kvitton` kommer alltså att få andra tabell-ID:n i prod än i staging.

**Detta är ofarligt för koden** — verifierat, inte antaget: samtliga
EF-adresseringar går på NAMN (`BILAGOR_TABLE = 'Bilagor'`,
`KVITTON_TABLE = 'Kvitton'`, `ANTECKNINGAR_TABLE = 'Anteckningar'`,
`NOTES_LINK_FIELD = 'Anteckningar 2'`, `ATTACHMENTS_LINK_FIELD = 'Bilagor'`),
och `field-allowlists.ts` sätter `tableId` till tabell-namn genomgående. De
`fld`/`tbl`-strängar som finns i körande kod ligger i kommentarer.

**Konsekvensen är däremot skarp för namnen:** eftersom ID:t inte bär
kopplingen gör NAMNET det. Ett fält- eller tabellnamn som avviker en enda
tecken i prod bryter läsningen **tyst** — tom lista, inte fel. Det är exakt
`Anteckningar 2`-fällan ADR-075 bokför.

---

## Delfråga 2 — Vad behöver appen faktiskt? (den avgörande)

Denna delfråga vänder planens karaktär och är därför värd att läsa före
apply-planen.

`.prod-functions-allowlist.conf` är fail-closed och listar de **14** Edge
Functions som får deployas till prod:

```text
compute-segment · create-admin-user · create-event · create-event-note
get-event-formats · get-event-notes · get-events · get-persons
get-registrations · get-segments · invite-user · save-segment
send-email · update-record
```

Korsläst mot vem som konsumerar de saknade ytorna:

| Saknad yta i prod | Konsumeras av EF | Är den EF:en prod-deployad? |
|---|---|---|
| `Bilagor` | `get-event-attachments`, `upload-attachment`, `finalize-attachment-upload`, `generate-event-attachment`, `send-action-email` | **Nej** — ingen av dem |
| `Kvitton` | `send-receipt-email` | **Nej** |
| `Väntelista.Event (länk)` | `get-event` | **Nej** |

**Ingen prod-deployad funktion rör någon av de tre ytorna.** Slutsatserna:

1. **Ingen prod-yta är trasig i dag på grund av diffen.** Applyn reparerar
   inget akut.
2. **Applyn är ett prerekvisit**, exakt den ordning `data-model.md`
   §Kända fällor 37–38 kodar: *tabell/fält FÖRE EF, per miljö*. Att applicera
   schemat utan att deploya EF:erna är säkert och lämnar prod funktionellt
   oförändrat. Det omvända — EF före schema — fäller Airtable-skrivningen.
3. **Det gör apply-planen billig att godkänna men värdelös ensam.** Nyttan
   uppstår först vid den separata EF-deployen, som är ett eget Marcus-beslut
   och utanför detta pass.

En stilla bekräftelse på att ordningen fungerar: `create-event-note` och
`get-event-notes` ÄR prod-deployade, och `Anteckningar`-tabellen finns i prod.
Motsatt: `create-person-note` / `get-person-notes` är **inte** prod-deployade
trots att `Person`-fältet finns i prod — precis det läge ADR-075 § Miljöstatus
beskriver.

### Föråldrade varningar i `field-allowlists.ts`

Allowlisten bär fem `⚠️ PROD ... är INTE skapad`-varningar. Mätta mot faktiskt
prod-tillstånd i dag:

| Operation | Varningens påstående | Faktiskt läge (mätt 2026-08-11) |
|---|---|---|
| `set-registration-lodging` | `Bor över` saknas i prod | **FÖRÅLDRAD** — finns (`fld4Flif4NoFnNsxS`) |
| `create-event` | `Publicerad på miranon.se` saknas i prod | **FÖRÅLDRAD** — finns (`fldrjj61ovL3Zv1mN`) |
| `create-event-note` | `Anteckningar`-tabellen saknas i prod | **FÖRÅLDRAD** — finns (`tblaUhH1KF9k9imul`) |
| `create-attachment` | `Bilagor`-tabellen saknas i prod | **KORREKT** |
| `create-receipt` | `Kvitton`-tabellen saknas i prod | **KORREKT** |

Tre av fem varningar beskriver ett läge som upphörde 2026-07-23 (S75-vågen).
Det är inte harmlöst: en varning som visat sig falsk tre gånger av fem lär
läsaren att inte lita på den fjärde — och den fjärde och femte är sanna.
`ADR-083`-klassen (prosa som påstår mekanism), fast åt andra hållet: prosa som
påstår ett bas-tillstånd. Registrerat som fynd, inte åtgärdat (detta pass
skriver ingen kod).

---

## Delfråga 3 — `Väntelista (länkat fält)`: det bokförda beslutet omprövat

Detta är passets enda punkt där ett redan fattat beslut står i vägen, och
research-passets ordning kräver att det läses i sin helhet och prövas.

**Det bokförda beslutet** ([`data-model.md`](../reference/data-model.md) rad
126–135, S75-vågen, samt [`BUILD-LOG.md`](../BUILD-LOG.md) rad 2861):

> `Väntelista (länkat fält)` speglades MEDVETET INTE. Staging bär den som
> auto-fött inverse till `Väntelista.Event (länk)`. I PROD är
> `Väntelista.Event` fortfarande **singleLineText** — att skapa länken i prod
> hade antingen lagt ett andra Event-fält bredvid textfältet eller krävt en
> TYPKONVERTERING av ett fält med skarp data, vilket inte är en additiv
> operation. Divergensen är alltså inte en glömska utan en gräns:
> **staging-basen har konverterat fältet, prod har inte.**

**Mätningen (2026-08-11) falsifierar den sista meningen:**

| Bas | `Väntelista.Event` | Fält-ID | `Väntelista.Event (länk)` |
|---|---|---|---|
| Staging | `singleLineText` | `fldC01Nf3lVWrOgdw` | `multipleRecordLinks` (`fldMD8lVebMqXXow7`) |
| Prod | `singleLineText` | `fldC01Nf3lVWrOgdw` | saknas |

Staging **konverterade aldrig** något fält. `Event` är oförändrat
`singleLineText` i båda baserna, med **identiskt fält-ID** — vilket i sig är
beviset: ett delat ID betyder att fältet är det ursprungliga duplicerade
fältet, orört sedan basen klonades. Staging valde den första av de två grenar
motiveringen ställer upp ("lägga ett andra Event-fält bredvid textfältet"), och
den grenen **är** additiv.

Det bekräftas oberoende av kortet [`task-18.2`](../../backlog/tasks/task-18.2%20-%20Skiva-Beläggningen-till-facit.md),
som beskriver skapelsen ordagrant som *"NYTT BAS-FÄLT (ENDAST staging,
additivt)"*.

`get-waitlist`-EF:ens egen docblock bär samma korrekta bild: *"Väntelista.Event
är ett singleLineText-fält (en text-konstant per kampanj, INGET länkfält)"* —
skrivet om staging, där EF:en körs.

**Vad detta betyder:** motiveringen håller inte, men slutsatsen kan ändå vara
rätt — av ett annat och starkare skäl:

**Fältet skulle bli permanent tomt i prod.** Jag sökte igenom hela
`supabase/functions/` och `src/`: **ingen Edge Function och ingen klientkod
skriver någonsin till `Väntelista`** — varken raden eller länken. I staging
fylldes länken manuellt via MCP när beläggnings-fixturen seedades (task-18.2:s
`BELAGGNING_*`). Ingen av prods 11 automationer rör Väntelista heller
(live-läst, se delfråga 5).

Konsekvensen: att skapa `Event (länk)` i prod ger ett tomt fält på samtliga
befintliga väntelisterader. `get-event` skulle fortsätta rapportera
väntelista = 0 — nu inte för att fältet saknas, utan för att det är tomt. Det
är strikt sämre än i dag, eftersom felet blir osynligt i stället för strukturellt
uppenbart.

**Fältet ensamt löser alltså ingenting.** Den fullständiga vägen kräver tre
delar, varav bara den första är schema:

1. fältet `Event (länk)` skapas i prod (additivt, billigt)
2. spegelfältet döps om till `Väntelista (länkat fält)` (se nedan)
3. **en backfill** av befintliga rader (text → länk) **och en skrivare** som
   håller länken aktuell framåt — ingetdera finns

Punkt 3 är inte additiv i samma mening: det är en datamigrering på skarp data,
och den hör hemma i bas-maximeringen (T16) med eget Marcus-beslut. Det stämmer
med `data-model.md`:s egen slutsats — som därmed landar rätt trots fel
motivering.

### Omdöpningsfällan — värd ett eget stycke

Airtable auto-namnger ett spegelfält efter **käll-tabellen**. Ett `Event (länk)`
skapat på `Väntelista` ger därför sannolikt ett fält som heter **`Väntelista`**
på Eventplanering — inte `Väntelista (länkat fält)`, som är namnet
`get-event/index.ts:82` läser.

Belägg för mekaniken finns i basen själv: `Anteckningar.Person` → Personer gav
`Anteckningar 2` (auto-namn efter källtabellen, plus Airtables kollisions-suffix),
och `Bilagor.Event` → Eventplanering gav `Bilagor`. Båda följer regeln.
`Väntelista (länkat fält)` följer den inte, vilket betyder att fältet döptes om
efter skapelsen — trots att staging-fältets egen beskrivning kallar det
"auto-fött" (beskrivningen är korrekt om ursprunget, inte om namnet).

Jag kunde **inte belägga** omdöpningen i något dokument (se "Vad jag inte kunde
belägga"). Den praktiska följden är ändå entydig: **läs det auto-födda fältets
faktiska namn efter skapelsen och döp om vid behov** — anta det aldrig. Ett
felaktigt namn ger tom lista, inte fel.

---

## Delfråga 4 — Sekvenserad additiv apply-plan

Planen är **rekommenderad ordning, inte ett beslut**. Steg 0 och steg 4 är
Marcus-moment i sig.

### Steg 0 — Förutsättningar (innan något skrivs)

| Krav | Varför |
|---|---|
| `AIRTABLE_SCHEMA_TOKEN` med `schema.bases:write` **mot prod-basen** i `.env.seed` | Skriptens dokumenterade krav. Skild från `STAGING_AIRTABLE_TOKEN`, som är pinnad till staging och saknar schema-scope |
| Färsk backup / medveten acceptans att Airtable-restore skapar en **kopia**, inte in-place | `airtable-constraints.md` P17 — rollback av en delvis skrivning kräver manuell radering i originalet |
| Marcus GO i klartext per steg | ADR-063 / ADR-050: prod-skrivning är alltid separat auktoriserad handling |

### Steg 1 — Tabellen `Bilagor`

**Deklarativ hemvist:** `scripts/create-bilagor-table.mjs` (`CONFIG`).

Skriptet är hårdkodat mot staging med prod i `forbiddenBaseIds`, och bär
**medvetet ingen `--prod`-flagga**. Kortet `task-146.2` bokför prod-körningen
som Marcus-moment med exakt form: byt `CONFIG.expectedBaseId` till prod-ID:t
OCH ta bort prod ur `CONFIG.forbiddenBaseIds`. Det är en granskningsbar
kod-redigering, med avsikt.

**Fältuppsättning (`Namn` MÅSTE stå först — Airtable gör första fältet till primärfält):**

| # | Fält | Typ | Options |
|--:|---|---|---|
| 1 | `Namn` | `singleLineText` | — |
| 2 | `Storlek (bytes)` | `number` | `{ precision: 0 }` |
| 3 | `Skapad` | `dateTime` | `{ dateFormat: {name:'local',format:'l'}, timeFormat: {name:'24hour',format:'HH:mm'}, timeZone:'client' }` |
| 4 | `Event` | `multipleRecordLinks` | `{ linkedTableId: 'tblVE3UKWl1CKrphV' }` |
| 5 | `Lagringsnyckel` | `singleLineText` | — |

**Bieffekt (öppet bokförd, mätt vid staging-körningen 2026-08-07):**
Eventplanering får ETT nytt tomt fält `Bilagor`. Airtable har ingen dokumenterad
väg att stänga av spegelfältet — varje länkfält är strukturellt tvåvägs.
`tblVE3UKWl1CKrphV` är korrekt i BÅDA baserna (verifierat i denna mätning).

`Skapad` är avsiktligt `dateTime`, inte `createdTime`: Airtables Meta-API vägrar
skapa `createdTime` programmatiskt (`UNSUPPORTED_FIELD_TYPE_FOR_CREATE`,
skarpt verifierat mot staging 2026-08-07).

### Steg 2 — Tabellen `Kvitton`

**Deklarativ hemvist:** `scripts/create-kvitton-table.mjs`. Samma bas-guard,
samma medvetna redigeringskrav.

**Fältuppsättning (`Kvittonummer` först):**

| # | Fält | Typ | Options |
|--:|---|---|---|
| 1 | `Kvittonummer` | `singleLineText` | — |
| 2 | `Löpnummer` | `number` | `{ precision: 0 }` |
| 3 | `År` | `number` | `{ precision: 0 }` |
| 4 | `Anmälan` | `multipleRecordLinks` | `{ linkedTableId: 'tbloOcrppVoyrHbrq' }` |
| 5 | `Betalning` | `singleSelect` | choices: `Anmälningsavgift`, `Slutbetalning` |
| 6 | `Belopp` | `number` | `{ precision: 2 }` |
| 7 | `Betalsätt` | `singleSelect` | choices: `Swish`, `Bankgiro`, `Plusgiro` |
| 8 | `Kundnamn` | `singleLineText` | — |
| 9 | `Event` | `multipleRecordLinks` | `{ linkedTableId: 'tblVE3UKWl1CKrphV' }` |
| 10 | `Skickad` | `dateTime` | samma options som `Bilagor.Skapad` |
| 11 | `Lagringsnyckel` | `singleLineText` | — |
| 12 | `Notering` | `multilineText` | — |

**Bieffekt:** Eventplanering får `Kvitton`, Anmälningar får `Kvitton` (två nya
tomma spegelfält). Inga namnkollisioner i prod — verifierat: varken
`Eventplanering.Kvitton`, `Eventplanering.Bilagor` eller `Anmälningar.Kvitton`
existerar i dag, så Airtables kollisions-suffix (mönstret `Anteckningar 2`)
utlöses inte.

`singleSelect`-choices skapas utan färg i skriptet; staging fick `grayLight2`
tilldelad av Airtable. Färgen är kosmetisk och ingår inte i något kodkontrakt —
koden matchar på choice-NAMN.

### Steg 3 — `Väntelista.Event (länk)` — **rekommenderas SKJUTAS UPP**

Tekniskt additiv och ofarlig, men levererar ingenting utan backfill och
skrivare (delfråga 3). Om Marcus ändå vill lägga fältet nu, som ren
förberedelse:

1. Skapa `Event (länk)`, `multipleRecordLinks` → `tblVE3UKWl1CKrphV`, på
   `tbl2VxMx7JMkIxD4Q` (`Väntelista`). Prod-tabell-ID:t är identiskt med
   stagings — verifierat.
2. **Läs omedelbart tillbaka Eventplanerings fältlista** och kontrollera det
   auto-födda spegelfältets faktiska namn.
3. Är namnet inte exakt `Väntelista (länkat fält)` — döp om det. `get-event`
   läser det namnet och ger annars tyst 0.

Ingen `create-*.mjs`-hemvist finns för detta fält; det skapades i staging
direkt via MCP. Att skriva ett skript för ETT fält är sannolikt
över-engineering, men då bör fältet i stället bokföras i `data-model.md` med
båda basernas ID:n.

### Steg 4 — EF-deploy (utanför denna plan)

Ingen av de berörda EF:erna står i `.prod-functions-allowlist.conf`. Att lägga
till dem är ett eget, medvetet beslut med egen verifiering — och den enda punkt
där prods faktiska beteende ändras.

---

## Delfråga 5 — Risk: prod bär skarp data, levande automationer och gamla systemet

### Vad som INTE rörs

Apply-planen skapar bara nytt. Den ändrar ingen typ, döper om inget befintligt
fält, raderar inget och skriver ingen datarad. Diffen visar dessutom att det
inte finns något i prod som saknas i staging — så ingen "harmonisering" i
motsatt riktning är på tal, och ingen frestelse att städa bort något.

Airtables Meta-API kan för övrigt varken ändra fälttyp eller radera fält, vilket
gör hela klassen "råka riva något" strukturellt svår att nå via denna väg.

### Automationerna — live-läst ur prod, inte hämtat ur den frusna kartan

`schema_reference.md` är en frusen ögonblicksbild från mars 2026 och duger
inte som riskunderlag för en prod-skrivning. Jag läste därför prods
automationer live 2026-08-11.

**11 automationer, samtliga `deployed` och `configurationStatus: valid`.**

| Automation | Trigger | Bevakar | Berörs av applyn? |
|---|---|---|---|
| A1 | `recordCreated` → Anmälningar | — | Nej — inga rader skapas |
| A2 | `recordCreated` → Anmälningar | — | Nej |
| A3 | `recordMatchesConditions` → Anmälningar | `Person`, `Event`, `Deltaganden` | Nej |
| A4 | `recordCreated` → Hämtade erbjudanden | — | Nej |
| A5 | `recordUpdated` → Hämtade erbjudanden | `Person`, `Erbjudande` | Nej |
| **A7** | `recordUpdated` → Anmälningar | **`watchFields: [Slutbetalning, Event]`** | **Nej** — se nedan |
| A6 | `recordMatchesConditions` → Eventplanering | `Anmäld beläggning (%) = 1` | Nej |
| A8 | `recordUpdated` → Deltaganden | `watchFields: [Status]` | Nej |
| A9 / A10 | `recordMatchesConditions` → Eventplanering | två checkbox-fält | Nej |
| A11 | `recordMatchesConditions` → Deltaganden | `Anmälan`, `Person (länk)` | Nej |

**A7 är det fynd som mattar risken mest.** `schema_reference.md` beskriver den
som *"Varje gång en anmälan uppdateras, räknas alla obetalda om"* — och med den
beskrivningen vore den nya `Anmälningar.Kvitton`-spegeln en verklig risk:
`send-receipt-email` skriver `Anmälan`-länken från Kvitton-sidan, vilket ändrar
den inversa cellen på anmälningsraden, vilket hade räknats som en uppdatering.
Den frusna beskrivningen är dock **ofullständig**: live bär triggern
`watchFields: ["fldIImadnJUZHr5Qh", "fldi3enUaMdbuGSlm"]` — alltså exakt
`Slutbetalning` och `Event`. En skrivning till `Kvitton`-spegeln rör ingetdera
och triggar inte A7.

Samma resonemang gäller A8 (`watchFields: [Status]`) och A5.

**Kvarstående, oeliminerad osäkerhet:** de fyra
`recordMatchesConditions`-automationerna på Eventplanering/Deltaganden (A6, A9,
A10, A11). Airtable avfyrar dem när en rad *inträder* i det matchande
tillståndet, och en ändrad spegelcell ändrar inget av de bevakade värdena — men
jag har **inte mätt** att en invers-länkuppdatering inte kan orsaka en
omvärdering. Bedömningen vilar på hur triggertypen är dokumenterad att fungera,
inte på ett experiment. Se "Vad jag inte kunde belägga".

### Övrigt

- **Zapier/Make:** `schema_reference.md` dokumenterar externa integrationer.
  Jag kunde inte verifiera dem live — de ligger utanför både PAT-serverns och
  claude.ai-connectorns räckvidd. Nya, tomma fält bryter normalt inte en
  inkommande webhook som skriver namngivna fält, men det är slutledning, inte
  mätning.
- **Interfaces och vyer:** ett nytt fält kan dyka upp i en grid-vy. Det är
  kosmetiskt men syns för Roger och Lotta. Två nya tabeller syns i
  bas-navigationen.
- **Kvittoseriens allokeringsprotokoll** (`_shared/receipt-numbering.ts`)
  förutsätter en tom eller konsistent ledger. En nyskapad prod-`Kvitton` är tom
  — serien startar korrekt på `MM-<år>-1001`. Ingen migrering av
  staging-kvitton till prod får ske; de är testdata.

---

## Verifikationsplan efter apply (read-probes per ny yta)

Samtliga steg är läsningar. Ingen kräver en EF-deploy.

| # | Yta | Probe | Förväntat |
|--:|---|---|---|
| 1 | Båda tabellerna | `describe_table` mot prod för `Bilagor` resp. `Kvitton` | Fältnamn, typer och options **exakt** lika stagings (kör diff-skriptet igen — utfallet ska bli 0 tabell-luckor) |
| 2 | Primärfält | Samma svar | `Bilagor` → `Namn`; `Kvitton` → `Kvittonummer`. Fel primärfält betyder fel fältordning vid skapelsen |
| 3 | Spegelfält | `describe_table` prod `Eventplanering` + `Anmälningar` | `Eventplanering.Bilagor`, `Eventplanering.Kvitton`, `Anmälningar.Kvitton` finns, **utan kollisions-suffix** (alltså inte `Bilagor 2`) |
| 4 | Namnkontrakt | Jämför mot `ATTACHMENTS_LINK_FIELD = 'Bilagor'` | Teckenidentiskt. Avvikelse ⇒ tyst tom lista |
| 5 | Väntelista (om steg 3 kördes) | `describe_table` prod `Eventplanering` | Spegelfältets namn är `Väntelista (länkat fält)` — döp om annars |
| 6 | Helhet | Kör om hela schema-diffen staging↔prod | Kvarvarande diff ska vara **noll** poster, eller exakt de poster Marcus medvetet sköt upp |
| 7 | Data orörd | `list_records` med `maxRecords` mot `Eventplanering` och `Anmälningar` | Radantal och innehåll oförändrade; de nya spegelfälten tomma på alla rader |
| 8 | Automationer | `list_automations` mot prod | Fortfarande 11, samtliga `deployed` + `configurationStatus: valid` |

Steg 1 och 6 är samma skript som producerade denna fil och är därför en äkta
före/efter-mätning, inte en ny bedömning.

---

## Vad jag inte kunde belägga

1. **Hur `Eventplanering.Väntelista (länkat fält)` fick sitt namn.** Inget
   dokument bokför en omdöpning, och fältets egen beskrivning kallar det
   "auto-fött". Airtables auto-namngivning ger normalt käll-tabellens namn
   (`Väntelista`), vilket basens två färskaste exempel (`Bilagor`,
   `Anteckningar 2`) följer. Jag kunde inte pröva det utan att skapa ett fält,
   vilket ligger utanför mandatet. **Följd: verifiera namnet efter skapelsen,
   anta det aldrig.**
2. **Om en invers-länkuppdatering kan omvärdera en
   `recordMatchesConditions`-trigger** (A6, A9, A10, A11). Bedömd som nej
   utifrån triggertypens dokumenterade "inträder i tillstånd"-semantik, men
   inte mätt. Ett experiment kräver en prod-skrivning.
3. **Zapier/Make-integrationernas faktiska nuvarande konfiguration.** Utanför
   båda MCP-servrarnas räckvidd. `schema_reference.md`:s bild är frusen mars
   2026 och kan ha drivit.
4. **Om `AIRTABLE_SCHEMA_TOKEN` i `.env.seed` har prod-räckvidd.** Jag läste
   endast variabelnamnen ur filen, aldrig värdet. Skripten kräver `schema.bases:write`
   mot målbasen; utan det faller steg 1–2 på ett token-fel, inte på ett
   guard-fel.
5. **Om prods `Bulkutskick`/`Segment` bär legacy-rader som en ny tabell
   skulle interagera med.** Utanför frågans scope; ingen av de nya tabellerna
   länkar dit.
6. **Interfaces/formulär i prod som kan visa nya fält.** Inte inventerade —
   claude.ai-connectorn kan lista sidor, men jag prioriterade automationerna
   som den högre risken.
7. **Att staging-basen är komplett "facit".** Passet jämför två baser; det
   avgör inte om staging självt saknar något appen behöver.

---

## Rekommendation

Detta är en **rekommendation, inte ett beslut**. Marcus äger prod-basen.

1. **Kör steg 1 och 2 (`Bilagor`, `Kvitton`) — de är okontroversiella.** Rent
   additiva, deklarativt definierade i två skript med bas-guard, noll
   automations-beröring (mätt), noll namnkollisioner (mätt), och de ändrar
   ingenting i prods beteende förrän motsvarande EF:er deployas. Kostnaden att
   göra det nu är nära noll; vinsten är att prerekvisitet är ur vägen när
   EF-deployen väl beslutas.
2. **Skjut upp steg 3 (`Väntelista.Event (länk)`).** Fältet ensamt levererar
   ingenting och gör ett synligt strukturellt gap till ett osynligt tomt fält.
   Rätt hemvist är bas-maximeringen (T16) tillsammans med backfill och en
   skrivare — som ett eget kort, inte som en rad i en schema-apply.
3. **Rätta `data-model.md`:s motivering oavsett vad som appliceras.** Meningen
   *"staging-basen har konverterat fältet, prod har inte"* är falsifierad och
   skulle vilseleda nästa läsare som fattar beslut på den. Slutsatsen (skjut
   upp) står kvar, men på rätt grund.
4. **Städa de tre föråldrade `⚠️ PROD ... INTE skapad`-varningarna i
   `field-allowlists.ts`** i samma veva. Två av fem varningar är sanna och
   viktiga; att tre är falska urholkar dem.
5. **Utvidga `task-191`.** Kortet gäller `Bilagor`, men `Kvitton` saknas lika
   helt i `data-model.md` (0 träffar), och `Anteckningar` har ingen egen
   sektion (3 omnämnanden, alla i prod-vågens tabell). Luckan är tre tabeller,
   inte en.

---

## Oväntade fynd utanför frågan

Registrerade, inte åtgärdade — per triage-regeln "förkasta aldrig tyst".

1. **`airtable-constraints.md` P24 är föråldrad.** Den slår fast att
   automationer är osynliga för MCP/API och att en HAR-export krävs. Jag läste
   prods 11 automationer med fullständiga triggers och watchFields via
   claude.ai-connectorn i detta pass. Den globala `CLAUDE.md` § Verktygsfakta
   bokför redan korrigeringen (S90); väggkatalogen har inte följt med. Posten
   är dessutom en `Fas E-krav`-bärare, så en föråldrad premiss där påverkar
   migrations-kravspecen.
2. **`schema_reference.md`:s A7-beskrivning är imprecis** — den utelämnar
   `watchFields` och beskriver triggern som bredare än den är. Övriga
   automations-ID:n jag korsläste stämde exakt, så filen är i huvudsak
   pålitlig; det är beskrivningen av just A7:s omfång som brister.
3. **`data-model.md` § Prod-basens additiva tillskott är per-våg, inte ett
   fullständigt prod-register.** Tabellen listar 9 poster från S75-vågen, men
   prod bär additiva fält utanför den, t.ex. `Utskickslogg.Idempotensnyckel`
   (`fldXnfsdYxTB7PALv`). §Kända fällor 38 säger fortfarande att prod-kolumnen
   *"läggs vid prod-deploy (separat handling)"* — den finns redan.
4. **`data-model.md` § Snabbreferens är numeriskt föråldrad:** den anger 18
   tabeller och 358 fält (2026-04-28). Prod bär i dag 19 tabeller och 390 fält,
   staging 21 och 412. Datumstämpeln gör påståendet ärligt, men siffrorna
   används som orienteringspunkt och ligger nu drygt tre månader ur fas.
5. **PAT-serverns token har `create`-behörighet mot BÅDA baserna.**
   `create-bilagor-table.mjs` bokför detta redan i sitt filhuvud: skyddet mot
   oavsiktlig prod-skrivning ligger HELT i skriptens bas-guard, inte i tokenets
   scope. Värt att minnas när apply-planen körs — guarden är enda räcket.

---

## Källförteckning

**Primära (live-mätningar, 2026-08-11, read-only):**

- Airtable Meta-API, `GET https://api.airtable.com/v0/meta/bases/apphjj8Q7lkXCMsL4/tables` — staging, 21 tabeller / 412 fält
- Airtable Meta-API, `GET https://api.airtable.com/v0/meta/bases/app8uGPrVCVOm6LfD/tables` — prod, 19 tabeller / 390 fält
- `mcp__airtable__list_tables` mot båda baserna (tabell- och fältidentifierare)
- `mcp__claude_ai_Airtable__list_automations` mot prod — 11 automationer med triggers och watchFields

**Repo-källor (disk, `main` @ `f5be8d1c`):**

- [`docs/reference/data-model.md`](../reference/data-model.md) § Snabbreferens, § Prod-basens additiva tillskott 2026-07-23, §Kända fällor 37–38
- [`docs/reference/schema_reference.md`](../reference/schema_reference.md) § Automationssekvenser A1–A11
- [`docs/reference/airtable-constraints.md`](../reference/airtable-constraints.md) § E (P17, P24, P25), § G
- [`supabase/functions/_shared/field-allowlists.ts`](../../supabase/functions/_shared/field-allowlists.ts) — operations-registret
- [`supabase/functions/get-event/index.ts`](../../supabase/functions/get-event/index.ts) — väntelisteräkningen
- [`supabase/functions/get-waitlist/index.ts`](../../supabase/functions/get-waitlist/index.ts) — den globala läs-designen
- [`supabase/functions/_shared/receipt-numbering.ts`](../../supabase/functions/_shared/receipt-numbering.ts) — allokeringsprotokollet
- [`scripts/create-bilagor-table.mjs`](../../scripts/create-bilagor-table.mjs), [`scripts/create-kvitton-table.mjs`](../../scripts/create-kvitton-table.mjs) — deklarativ hemvist + bas-guard
- [`.prod-functions-allowlist.conf`](../../.prod-functions-allowlist.conf) — de 14 prod-tillåtna EF:erna
- [`docs/BUILD-LOG.md`](../BUILD-LOG.md) § S75 Del 18 — prod-speglingsvågen
- [`ADR-075`](../decisions/ADR-075-anteckningar-tabell-i-basen.md), [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md), [`ADR-063`](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md), [`ADR-050`](../decisions/ADR-050-isolerad-staging-miljo.md)
- [`backlog/tasks/task-146.2`](../../backlog/tasks/task-146.2%20-%20Skiva-Bilagor-tabellen-additivt-i-basen-väggkatalogens-poster.md) § PROD-KÖRNING, [`task-191`](../../backlog/tasks/task-191%20-%20Bilagor-tabellen-saknas-helt-i-data-model.md-—-inkl-nya-Lagringsnyckel-fältet.md)

**Tidigare pass:**

- [`claude-ai-airtable-connector-flera-baser-2026-08-10.md`](claude-ai-airtable-connector-flera-baser-2026-08-10.md) — connectorns räckvidd
