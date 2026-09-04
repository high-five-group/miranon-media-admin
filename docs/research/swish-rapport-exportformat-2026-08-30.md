---
owner: marcus803
updated: 2026-08-30
review_by: 2026-11-30
status: stable
---

# Swish-transaktionsrapport — exportformat för företag

> **Syfte:** underlag till S113:s grillade samsyn (2026-08-30) om att
> importera Lottas Swish-rapport i appen och matcha raderna mot öppna
> betalningar (telefon → namn+belopp), så att en inbetalning med kvitto
> kan skapas automatiskt. Marcus, ordagrant: *"En swish exportfil måste
> finnas på nätet att ladda ner, swish själva har ju massa material. Så
> bygger vi rätt och korrekt från början."* Detta pass svarar på VILKET
> format en sådan fil faktiskt har, VEM som levererar den, och vad
> branschen gör när formatet varierar per källa.

## Vad jag redan hade — och vad som är nytt i detta pass

**Genomsökt före research:** `docs/research/` (fyra kvitto-relaterade
pass från samma dag), `docs/decisions/` och `tasks/lessons.md` på
"swish"/"betalning"/"bank"/"import"/"matchning".

- [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md)
  § 2.1 har redan verifierat Pretix' bankavstämningsflöde direkt mot
  primärkällan (`docs.pretix.eu/guides/payment/bank-transfer/`, hämtad
  med `curl`) — CSV/MT940-import, matchning mot order, olösta poster i
  en restlista. Detta pass **återanvänder det fyndet rakt av** i § 6
  nedan i stället för att researcha om det, och bygger vidare med
  Fortnox/Bokio-precedens som den filen inte täcker.
- [`kvitto-flodet-kartlaggning-2026-08-30.md`](kvitto-flodet-kartlaggning-2026-08-30.md)
  och [`ADR-109`](../decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md)
  bekräftar att dagens flöde är helt manuellt: Lotta skriver in belopp
  och betalsätt (Swish/Bankgiro/Plusgiro) för hand per rad. Ingen import
  finns i dag — detta pass är alltså genuint nytt underlag, inte en
  uppdatering av något tidigare undersökt.
- Ingen ADR eller lesson träffade på "swish", "bank-import" eller
  "transaktionsrapport" — inget tidigare beslut att pröva om det håller.
- [`tasks/threads/T170-…`](../../tasks/threads/T170-rogers-kvittoforlaga-besvarar-tre-oppna-punkter.md)
  bekräftar Miranon Medias Swish-nummer (`123 061 65 08`) och Plusgiro
  (`216 10 05-0`) men nämner ingen bank. Ingen ny uppgift om banken
  hittades i detta pass heller — se § Vad jag inte kunde belägga.

**Åldersbedömning:** ingen del av detta är tidigare researchat i repot,
så ingen åldersfråga uppstår. Källorna som citeras nedan är själva
daterade (Handelsbankens specifikation bär versionsdatum 2024-06-05) och
åldern anges genomgående.

## Kort svar

**Rapporten kommer från BANKEN, inte från Swish/Getswish centralt — och
formatet är bank-specifikt.** Det finns ingen gemensam "Swish-fil" som
ser likadan ut oavsett vilken bank Miranon Medias Swish-nummer
(`123 061 65 08`) är kopplat till. Handelsbanken publicerar en öppen,
versionerad formatspecifikation och riktiga exempelfiler (verifierat
direkt i detta pass, se `swish-rapport-exempel/`); Swedbank levererar
motsvarande rapport som en textfil via internetbanken; Nordea via ett
separat webbverktyg med Excel-export. **Miranon Medias egen bank är
okänd i detta pass** — det är den avgörande obesvarade frågan (se
§ Rekommendation punkt 1) eftersom allt annat i detta dokument bygger på
en ANNAN banks verifierade format som referens, inte ett facit för
Lottas fil.

Den goda nyheten: den ena riktiga specifikationen som gick att verifiera
i sin helhet (Handelsbanken) visar att en Swish-rapport för företag
FAKTISKT bär exakt de fält matchningsidén behöver — avsändarens
mobilnummer, namn, belopp, meddelande och en unik betalningsreferens.
Idén är alltså tekniskt sund; den återstående frågan är vilket exakt
format Lottas egen bank använder.

---

## 1. Var kommer rapporten ifrån?

**Swish/Getswish (`getswish.se`, `swish.nu`) levererar inte själv någon
nedladdningsbar transaktionsrapport till Swish Företag-kunder.** Getswish
AB sköter clearingen mellan bankerna (och sedan version 3.1.2 av
Handelsbankens format, publicerad 2024-06-05, uttryckligen **Riksbanken**
— se § Oväntade fynd) men rapporten som en företagare faktiskt laddar ner
kommer från **den egna banken**, i internetbanken eller ett separat
webbverktyg:

- **Swedbank:** under "Betala och överföra – Swish" → "Swish-rapport" →
  "Skapa ny rapport", eller via "Ekonomisk översikt" → företagskontot
  ("6-3") → "Beställa rapporter". Format: text (`.txt`) — bekräftat av två
  oberoende tredjepartskällor (Wikimedia Sveriges egen driftrutin och en
  handledningssida), ingen av dem knuten till Swedbank själv.
- **Nordea:** ett separat verktyg, "Nordea Swish företagsverktyg", med
  knappen "Exportera till Excel" ovanför och under transaktionstabellen.
  Kolumner enligt Nordeas egen sida: Datum och Tid, Namn på betalaren,
  Mobilnummer, Belopp — ingen referens-/OCR-kolumn hittad.
- **Handelsbanken:** en versionerad, öppet publicerad CSV-specifikation
  ("Formatbeskrivning Swishrapport", version 3.1.2/3.1.3) med riktiga
  exempelfiler, hämtad och verifierad i sin helhet i detta pass — se § 2.

Jag hittade INGEN motsvarande öppen specifikation för SEB, Danske Bank
eller Länsförsäkringar (sökt, inte funnen — se § Vad jag inte kunde
belägga). Svaret på delfrågan "skiljer sig formatet per bank" är alltså
**ja, bekräftat för minst tre banker** (Swedbank: txt, Nordea: Excel via
eget verktyg, Handelsbanken: CSV enligt egen spec) och **förmodligen även
för resten**, eftersom Handelsbankens dokument själv säger att
beskrivningen *"är specifik för Handelsbankens tjänster och kan endast
användas i samarbete med Handelsbanken"* — bankerna bygger alltså inte
mot en delad standard för just Swish-rapporten.

## 2. Formatet — verifierat mot Handelsbankens egen specifikation

**Detta är den avgörande delfrågan** eftersom det enda direkt verifierade,
fullständiga svaret i hela passet kommer härifrån. Källa:
[www.handelsbanken.com/…/local-formats](https://www.handelsbanken.com/en/our-services/digital-services/global-gateway/local-formats)
(läst 2026-08-30) länkar till Handelsbankens egen PDF "Formatbeskrivning
Swishrapport Kredit-/Debetavisering CSV-format", version 3.1.2 (svenska)
/ 3.1.3 (engelska), publiceringsdatum 2024-06-05 — hämtad med `curl`,
verifierad `Content-Type: application/pdf`, och lästextrahen med
`pdftotext`. Fyra riktiga exempelfiler (samma sida, `Content-Type:
text/plain`) sparade under
[`swish-rapport-exempel/`](swish-rapport-exempel/) med källa-README.

**Formatets uppbyggnad — inte en klassisk kolumnrubrik-CSV.** Filen består
av tre POSTTYPER, en per rad: `01` startpost (rapportens datum + t.o.m.-
datum), ett obegränsat antal `02` informationsposter (en per
Swish-transaktion) och en avslutande `03` slutpost (antal
informationsposter). En parser kan alltså INTE anta att rad 1 är en
kolumnrubrik — den måste filtrera på posttyp.

**Fälten i en informationspost (`02`), i ordning:**

|Fält|Exempel|Kommentar|
|---|---|---|
|Posttyp|`02`|Alltid `02`|
|Organisationsnummer för kontoägaren|`5566778899`|10 siffror|
|Kontonummer|`123456789`|BBAN eller IBAN, avtalat|
|BIC|`HANDSESS`|Alltid Handelsbankens BIC|
|Swish-nummer|`1235524400`|Mottagarens Swish-nummer|
|Transaktionsdatum|`2020-03-16`|ÅÅÅÅ-MM-DD|
|Transaktionstyp|`SWH`|`SWH` inbetalning, `SWR` återbetalning, `SWT` retur av återbetalning, `SWU` utbetalning, `SWZ` retur av utbetalning|
|Belopp|`1500.00`|Två decimaler alltid|
|Valuta|`SEK`|Alltid SEK|
|**Mobilnummer**|`+46709876543`|Avsändarens/mottagarens mobilnummer, max 16 tecken|
|**Namn**|`Anna Swish`|Avsändarens/mottagarens namn, max 35 tecken|
|**Betalningsreferens**|`4469411476093487`|Unik, satt av Getswish/Riksbanken, 16 siffror — **dubblettnyckeln**|
|**Meddelande**|`Hej från Anna`|Max 50 tecken|
|Order ID|`987654321`|För e-handel, max 35 tecken|
|Time Stamp|`2020-04-01T19:32:22:683413`|Datum + klockslag för själva betalningen|
|Bokföringsdatum|`2020-04-01`|ÅÅÅÅ-MM-DD|
|Instruction ID|`EBB99330…`|Unikt instruktions-ID satt av Swish|
|End to End ID|`A6DFA868…`|Kopplar retur/utbetalning till ursprungstransaktionen|

**Avgränsare och talformat, ordagrant ur specen:** *"Decimaltecken för
alla belopp vid kommaseparerad fil är punkt (.)… Decimaltecken för alla
belopp i semikolonseparerad fil är kommatecken (,)"* — vilken variant
banken skickar avtalas, inte fritt val vid nedladdning. *"Fält utan värde
visas genom att efterföljande fältseparator följer direkt efter
föregående (,,) eller (;;)."* Datum är alltid ÅÅÅÅ-MM-DD. Rapporten kan
avse antingen transaktionsdag eller bokföringsdag (avtalat), och kan
skickas dagligen, med fasta intervall, eller flera gånger per dag
("intradag") — periodicitet är också avtalsstyrd, inte ett val i en
nedladdningsdialog.

**Teckenkodning nämns INTE i specifikationen** — svenska tecken (å/ä/ö)
förekommer i exempelfilerna (t.ex. "Meddelande från Anna") men vilken
teckenuppsättning (UTF-8, Windows-1252, ISO-8859-1) filen faktiskt
levereras i står inte utskrivet. Flaggat i § Vad jag inte kunde belägga.

**Nordeas Excel-export** (ej lika djupt verifierad — läst direkt av
Nordeas egen sida, men utan tillgång till en inloggad session eller
exempelfil) har enligt Nordea själva kolumnerna Datum och Tid, Namn,
Mobilnummer, Belopp och Status, sorterbara. Ingen referens-/dubblettkolumn
hittades i den beskrivningen — svagare belägg än Handelsbanken-fyndet.

**Swedbanks format** är bekräftat som text (`.txt`) av två
tredjepartskällor men ingen av dem visar den fullständiga kolumnlistan
— endast att ett meddelandefält och en "bankreferens" förekommer.

## 3. Swish Handel/API — framtida steg, endast en karta

**Detta är Swish HANDEL** (e-handelsintegration via API och certifikat),
en annan tjänst än Swish FÖRETAG (dagens 123-nummer). Verifierat direkt
mot Swish egen officiella "Merchant Integration Guide" version 2.6
(PDF, publicerad av Getswish/Swish, hämtad från
`assets.ctfassets.net` — samma Contentful-innehåll som `developer.swish.nu`
serverar, `pdftotext`-extraherad och citerad exakt):

- Betalningsobjektet innehåller (exempel ur specen, verbatim JSON):
  `"id"`, `"payeePaymentReference"`, `"paymentReference"` (Swish egen
  unika transaktionsreferens), `"callbackUrl"`, `"payerAlias"` (telefon-
  nummer i formatet `46701234768` — landskod, inget ledande `0` eller
  `+`), `"payeeAlias"`, `"amount"`, `"currency"`, `"message"`,
  `"status"`, `"dateCreated"`, `"datePaid"`.
- **Kräver ett digitalt certifikat**, utfärdat via banken, för att
  identifiera företaget och kryptera anropen mot Swish API.
- **Kostnad (Swedbanks prislista, verifierad direkt):** 3 kr per
  transaktion, 50 kr/månad per Swish-nummer, 1 000 kr i uppstartsavgift
  per Swish-nummer. Andra bankers priser är inte undersökta.
- **Swedbank säger uttryckligen att tjänsten INTE är avsedd för
  bokningssystem** — den riktar sig till "e-handelsföretag… Fler
  betalsätt. Kassa. Varukorg för utcheckning." Det är en strukturell
  skillnad mot Miranons flöde (bokning i förväg, betalning i efterhand,
  ingen kassa/varukorg vid betalningstillfället).

Swish Handel skulle ge FÄRSKARE och SÄKRARE matchningsdata än en
bankrapport (telefonnummer och referens direkt i realtid, ingen
filimport), men kräver att betalningen initieras genom en riktig Swish-
knapp/QR-kod i appens flöde, inte en fri betalning till 123-numret som
i dag. Det är en produktförändring, inte bara ett importformat — hålls
uttryckligen UTANFÖR denna skivas beslut.

## 4. Öppen bankdata (PSD2 AIS) — framtida steg, endast en karta

Tink, Enable Banking och GoCardless Bank Account Data är alla
PSD2-licensierade "Account Information"-aggregatorer som kan läsa ett
företags kontotransaktioner via bankens öppna API, oavsett bank.

**GoCardless Bank Account Data** (verifierat direkt mot
`docs.gocardless.com/bank-account-data/overview`): en transaktion bär
datum, motpartens/handlarens namn, en fritextbeskrivning ("info field")
och belopp. **Inget telefonnummerfält nämns.** Upp till 24 månaders
historik går att hämta, och en beviljad åtkomst gäller kontinuerligt i
upp till 90 dagar innan den (per PSD2:s regelverk om stark
kundautentisering) måste förnyas av kontoinnehavaren. Prissättning
anges inte på översiktssidan bortom att vissa funktioner kräver
betalande konto.

**Tink** beskrivs (endast via sökmotorssyntes, inte direkt verifierat)
som licensierad av Finansinspektionen för AIS/PIS med anslutning till
över 3 000–6 000 europeiska banker. Inga fält- eller prisuppgifter
verifierade.

**Enable Banking** hittades bara i en konkurrentjämförelse-sida — inget
om den egna dokumentationen verifierat i detta pass.

**Slutsats för matchningen:** öppen bankdata ger namn + belopp + fri
text, men **sannolikt inte telefonnummer** (samma mönster som en vanlig
bankrapport, se Flashback-tråden i § 6) — vilket gör den svagare för
just telefon-matchningen än en riktig Swish-rapport, men bättre än inget
alls för Bankgiro/Plusgiro-inbetalningar. Kräver samtyckesförnyelse var
90:e dag av Lotta.

## 5. Bankgirot/Plusgiro — kort

**Bankgiro Inbetalningar (BgMax)** verifierat direkt mot Bankgirots
tekniska manual (PDF, `pdftotext`-läst): **fast bredd, 80 tecken per
post, INTE CSV.** Poster inkluderar en Referens (OCR, position 13–37),
Betalningsbelopp (position 38–55, de två sista siffrorna är ören),
Referenskod (kvalitet på referensen) och ett Bankgirots eget löpnummer
("BGC-löpnummer") som är den naturliga dubblettnyckeln. Avsändarens
namn/adress/organisationsnummer finns bara med som EXTRA poster när
banken faktiskt känner till dem — **inget telefonnummerfält finns
någonstans i formatet.**

**Nordea Plusgiro:** Nordea administrerar Plusgirot (bekräftat: Nordeas
egen sida beskriver "PlusGirot – basen till alla in- och utbetalningar").
Exakt filformat för en Plusgiro-inbetalningsrapport hittades inte i
detta pass (endast en hänvisning till att beställa kontoutdrag via en
"Blankettservice") — se § Vad jag inte kunde belägga.

**Praktisk slutsats:** samma transaktionstyp i datamodellen
("Inbetalning") kan bära Bankgiro/Plusgiro-rader, men matchningen där
måste ske via OCR-referens eller namn+belopp — ALDRIG telefon, eftersom
fältet inte finns.

## 6. Precedent — hur branschen löser "formatet varierar per källa"

**Pretix** (redan verifierat direkt i
[`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md)
§ 2.1, återanvänt här): accepterar kontoutdrag i **CSV eller MT940**,
med ett krav på att filen innehåller datum, belopp, referens, betalare,
IBAN, BIC. Pretix matchar själv mot ordrar; olösta transaktioner hamnar
i en lista ("Unresolved transactions") som arrangören löser för hand
genom att söka på ordernummer, köparens namn, deltagarnamn eller
e-post. Detta är strukturellt IDENTISKT med Miranons behov (bokning i
förväg, betalning i efterhand, admin stämmer av) och är den starkaste
precedenten i hela passet.

**Fortnox** löser "formatet varierar" på två nivåer. För kontoutdrag
specifikt har de fem stora svenska bankerna (Handelsbanken, SEB, Nordea,
Danske Bank, Swedbank) konvergerat mot **CAMT.053** (ISO 20022) för
automatisk avstämning — bekräftat direkt på Fortnox egen sida — medan
CSV finns kvar som manuellt fallback. **Men för sina generella
importer** (kund-, artikel-, leverantörsregister m.fl., bekräftat
direkt) använder Fortnox i stället en **kolumnmappningsguide**: filer i
CSV/TXT/TSV/TAB/XLSX/XLS, användaren kopplar sina egna kolumner till
Fortnox fält EN gång, och kan spara kopplingen som en återanvändbar
mall för nästa import av samma typ.

**Bokio** löser problemet genom att inte ha det: via ett Bokio
Företagskonto (drivet av Svea Bank) knyts Swish-numret direkt till
bokföringen — inget importsteg alls, men det förutsätter att kunden byter
bank/kontoleverantör, vilket inte är aktuellt för Miranon.

**Svaret på delfrågans explicita fråga:** branschstandarden när formatet
varierar per källa är **kolumnmappning gjord en gång per källa och
sparad som mall** (Fortnox), kombinerat med ett fåtal accepterade
standardformat plus manuell efterhandsmatchning för resten (Pretix) —
**inte** ett hårdkodat fast format per bank inbyggt i applikationskoden.

---

## Sammanfattande tabell

|Källa|Levererar|Format|Kolumner (tel/ref/meddelande)|Exempelfil funnen?|Källa + datum|
|---|---|---|---|---|---|
|Handelsbanken|Banken (företagsavtal)|CSV, komma ELLER semikolon (avtalat)|Ja: mobilnummer, betalningsreferens (16 siffror), meddelande, namn|**Ja — sparad i `swish-rapport-exempel/`**|[handelsbanken.com/…/local-formats](https://www.handelsbanken.com/en/our-services/digital-services/global-gateway/local-formats), läst 2026-08-30, direkt verifierad|
|Swedbank|Banken (internetbank)|Text (`.txt`)|Ej fullständigt verifierat; meddelande + "bankreferens" nämnda|Nej|Wikimedia Sverige + cogwork.se, tredjepart, läst 2026-08-30|
|Nordea|Banken (eget webbverktyg + app)|Excel (export)|Datum/tid, namn, mobilnummer, belopp — ingen referens hittad|Nej|nordea.se, läst 2026-08-30|
|SEB / Danske / Länsförsäkringar|Sannolikt banken|Ej funnet|Ej funnet|Nej|Ingen källa hittad|
|Swish Handel/API|Swish (via API, certifikat via bank)|JSON över HTTPS|Ja: payerAlias (telefon), paymentReference, message|N/A (API, ej fil)|Swish Merchant Integration Guide v2.6, PDF, verifierad direkt|
|Öppen bankdata (GoCardless)|Banken (PSD2 AIS)|JSON över HTTPS|Namn, belopp, fritext — inget telefonnummer|N/A|docs.gocardless.com, läst 2026-08-30, verifierad direkt|
|Bankgiro Inbetalningar (BgMax)|Bankgirot|Fast bredd, 80 tecken|OCR-referens, BGC-löpnummer — inget telefonnummer|Nej|Bankgirots tekniska manual, PDF, verifierad direkt|
|Plusgiro (Nordea)|Nordea|Ej funnet|Ej funnet|Nej|nordea.se, läst 2026-08-30, ej fullständig|

## Vad detta betyder för matchningen

- **Telefonnummer finns** i den enda fullständigt verifierade
  bankrapporten (Handelsbanken: `MOBILNUMMER`, format `+46XXXXXXXXX`) —
  matchningsidén (telefon → namn+belopp) är alltså tekniskt rimlig,
  under förutsättning att Lottas egen bank levererar samma sorts fält.
  Nordeas Excel-export bekräftar samma sak oberoende (egen "Mobilnummer"-
  kolumn). Bankgiro/Plusgiro har DÄREMOT inget telefonnummer alls —
  matchning där måste vila på OCR-referens eller namn+belopp.
- **Namnet i rapporten är avsändarens registrerade Swish-/bank-namn**,
  inte nödvändigtvis stavat exakt som i Personer-tabellen — samma
  klass av risk som e-postnormaliseringsfällorna i
  [`data-model.md`](../reference/data-model.md) (fälla 40/42): normalisera
  innan jämförelse, förvänta dig inte exakt strängmatchning.
  Telefonnumret är den mer tillförlitliga nyckeln av de två.
  Fällans normaliseringsdimension för TELEFON är sannolikt
  `+46`-prefix vs `0`-prefix vs mellanslag/bindestreck — overifierat mot
  en riktig fil, men samma normaliseringsdisciplin bör tillämpas
  förebyggande.
- **Dubblettnyckel: bankens egen unika transaktionsreferens** (hos
  Handelsbanken: `BETALNINGSREFERENS`, 16 siffror, satt av
  Getswish/Riksbanken), inte telefon+datum+belopp. Två olika personer kan
  betala exakt samma kursavgift samma dag; en person kan swisha flera
  gånger. Utan en riktig unik nyckel blir en omimporterad fil (samma
  rapport laddas upp två gånger) en dubblettkälla.
- **Formatet är avtalat, inte valfritt vid nedladdning** (komma/semikolon,
  dagligen/intradag, transaktionsdag/bokföringsdag hos Handelsbanken) —
  vilket Lottas faktiska avtal ger avgör exakt vilken variant appen möter,
  inte ett antagande.

---

## Dom

Frågan "vilket format har en Swish-transaktionsrapport för företag" har
INGET enhetligt svar — svaret beror på vilken bank Swish-numret är
kopplat till, eftersom det är BANKEN, inte Swish/Getswish, som levererar
rapporten. Det avgörande fyndet i detta pass är att minst en stor svensk
bank (Handelsbanken) publicerar en fullständig, öppen, versionerad
formatspecifikation med riktiga exempelfiler som visar att en sådan
rapport bär exakt de fält Miranons matchningsidé behöver (telefon, namn,
belopp, meddelande, unik referens) — vilket bevisar att idén är
tekniskt genomförbar i grunden. Men den specen gäller Handelsbanken, och
Miranon Medias bank är okänd. Branschmönstret för att hantera denna typ
av per-källa-variation (Fortnox, Pretix) är kolumnmappning gjord en gång
och sparad som mall, inte ett hårdkodat format — det bör vara
utgångspunkten för hur parsern designas, med Handelsbankens fältlista
som en konkret, verifierad referensmall snarare än ett antagande om
Lottas egen fil.

## Vad jag inte kunde belägga

- **Miranon Medias egen bank.** Endast Swish-nummer (`123 061 65 08`)
  och Plusgiro (`216 10 05-0`, administrerat av Nordea) är kända — vilken
  bank som faktiskt levererar Swish-rapporten är obelagt. Plusgiro hos
  Nordea är en LEDTRÅD om att banken kan vara Nordea, inte ett bevis.
- **Exakt kolumnstruktur för Swedbanks, SEB:s, Danske Banks och
  Länsförsäkringars Swish-rapporter.** Endast formatTYPEN (text
  respektive Excel) är bekräftad för Swedbank/Nordea; ingen fullständig
  fältlista eller exempelfil hittades för någon av de fyra.
  - **Reservation, upptäckt sent i passet:** samma sökväg som gav
    Handelsbankens spec (`local-formats`-sidan) kan finnas hos övriga
    storbanker under motsvarande "Global Gateway"/cash management-sidor —
    detta hann inte sökas systematiskt för alla fem banker och bör vara
    första steget om nästa pass behöver täcka en annan bank.
- **Teckenkodning** för Handelsbankens CSV-format — specen anger inte
  UTF-8/Windows-1252/ISO-8859-1 trots att å/ä/ö förekommer i fälten.
- **Swish.nu:s egen FAQ-sida** ("Kan jag få en rapport på inkommande
  betalningar?") kunde inte hämtas — sidan är en JavaScript-renderad SPA
  som blockerade både WebFetch och `curl`. Att Swish/Getswish själva
  eventuellt hänvisar vidare till banken i det svaret är därför en
  SANNOLIK slutsats byggd på övriga källor, inte en direkt verifierad
  citering.
- **`docplayer.se`** gick inte att nå alls i denna miljö (DNS-fel för
  både `curl` och WebFetch) — all information som en WebSearch-syntes
  ursprungligen hämtade DÄRIFRÅN har i stället verifierats mot
  Handelsbankens egen sida direkt (samma dokument, primärkällan).
- **Kostnad för Enable Banking och Tink**, och fullständig fältlista för
  Tink. Endast GoCardless (fält, historik, samtyckestid) och Swedbanks
  Swish Handel-prislista är direkt verifierade.
- **Nordeas Plusgiro-inbetalningsrapport**, format och kolumner — ingen
  teknisk specifikation hittades, bara en hänvisning till en
  beställningstjänst för kontoutdrag.
- **Om Nordeas Swish-rapport (Excel) bär en unik transaktionsreferens.**
  Nordeas egen produktsida nämner bara Datum/Tid, Namn, Mobilnummer,
  Belopp, Status — ingen referenskolumn syntes i den beskrivningen, men
  avsaknaden kan bero på en ofullständig sida snarare än att fältet
  faktiskt saknas.
- **Precedent-rymden för "kolumnmappning som branschmönster"** vilar på
  TVÅ verifierade system (Fortnox, Pretix) plus Bokios motsatta
  arkitektur (vertikal integration). Detta är en tunnare precedent-rymd
  än ADR-barens 3+-riktlinje för arkitekturbeslut med permanens —
  deklareras öppet eftersom denna skiva sannolikt INTE är ADR-klassad
  (ett import-format-val), men om den blir det bör fler system (t.ex.
  Visma, Speedledger) undersökas innan låsning.

## Rekommendation (rekommendation, inte beslut)

1. **Ta reda på Lottas bank och begär en RIKTIG exempelfil eller rapport
   därifrån innan parsern kodas.** Detta pass kan inte ersätta det
   steget — det kan bara visa vilka frågor som ska ställas
   (Handelsbankens spec fungerar som en konkret checklista: komma eller
   semikolon? CSV, txt eller Excel? Finns mobilnummer? Finns en unik
   referens? Transaktionsdag eller bokföringsdag? Vilken periodicitet?).
   Detta är en STOPPA-OCH-FRÅGA-kandidat mot Marcus/Lotta, inte något
   nästa agent bör anta sig fram till.
2. **Bygg parsern med kolumnmappning som grundarkitektur**
   (branschmönstret i § 6), inte ett hårdkodat Handelsbanken-specifikt
   format — även om Handelsbankens verifierade fältlista används som
   den INITIALA målmodellen/testfixturen, eftersom det är den enda
   riktiga specifikationen vi har i handen i dag.
3. **Dubblettnyckel = bankens egen unika transaktionsreferens**, om
   Lottas banks rapport har en (Handelsbanken har det; overifierat för
   övriga). Använd ALDRIG telefon+datum+belopp som ensam nyckel.
4. **Normalisera telefonnummer på båda sidor** av matchningen (rapportens
   fält och Personers registrerade nummer) till ett enhetligt format
   innan jämförelse — samma disciplin som e-postfällorna 40/42 i
   `data-model.md`, tillämpad förebyggande på en ny datatyp.
5. **Håll Swish Handel/API och öppen bankdata (Tink/Enable
   Banking/GoCardless) UTANFÖR denna skiva.** Båda kräver avtal,
   certifikat eller samtyckesförnyelse, kostar per transaktion/månad,
   och Swish Handel är enligt Swedbank själva inte avsett för
   bokningssystem. De är rimliga framtida förbättringar (särskilt Swish
   Handel för realtidsdata), inte förutsättningar för v1.
6. **Bygg matchningslogiken pluggbar per betalsätt från början.**
   Bankgiro/Plusgiro-inbetalningar saknar telefonnummer helt och måste
   matchas via OCR-referens eller namn+belopp — samma transaktionstyp i
   datamodellen, annan matchningsstrategi.

## Källförteckning

**Förstapart, direkt verifierat i detta pass:**

- [Handelsbanken — Other/local file formats (corporate payments)](https://www.handelsbanken.com/en/our-services/digital-services/global-gateway/local-formats), läst 2026-08-30
- Handelsbanken — "Formatbeskrivning Swishrapport Kredit-/Debetavisering CSV-format", v3.1.2 (sv) / v3.1.3 (en), publicerad 2024-06-05 — PDF hämtad och `pdftotext`-läst i sin helhet, sparad som [`swish-rapport-exempel/handelsbanken-formatbeskrivning-swishrapport-sv-v3.1.2.pdf`](swish-rapport-exempel/handelsbanken-formatbeskrivning-swishrapport-sv-v3.1.2.pdf)
- Handelsbankens fyra riktiga exempelfiler (CSV), sparade i [`swish-rapport-exempel/`](swish-rapport-exempel/) med källa-README
- [Swish Merchant Integration Guide v2.6](https://assets.ctfassets.net/zrqoyh8r449h/aBolaUxwMBZWntQ9CsuLD/c5b0c94c5fb2a298bda91bf4e567d039/Merchant_Integration_Guide.pdf) (Swish/Getswish, PDF), `pdftotext`-läst, läst 2026-08-30
- [Bankgirot — Bankgiro Inbetalningar, teknisk manual](https://www.bankgirot.se/globalassets/dokument/tekniska-manualer/bankgiroinbetalningar_tekniskmanual_sv.pdf) (PDF), `pdftotext`-läst, läst 2026-08-30
- [Nordea — Nordea Swish företagsverktyg](https://www.nordea.se/foretag/produkter/betala/nordea-swish-foretagsverktyg.html), läst 2026-08-30
- [Nordea — PlusGirot](https://www.nordea.se/foretag/produkter/betala/plusgirot.html), läst 2026-08-30
- [Swedbank — Swish Handel](https://www.swedbank.se/foretag/betala-och-ta-betalt/swish/swish-handel.html), läst 2026-08-30
- [GoCardless — Bank Account Data overview](https://docs.gocardless.com/bank-account-data/overview), läst 2026-08-30
- [Fortnox — Bank filformat](https://support.fortnox.se/produkthjalp/bankkopplingar/filformat), läst 2026-08-30

**Tredjepart (WebSearch-syntes, ej direkt sidhämtning verifierad — flaggat i texten där det används):**

- [Wikimedia Sverige — Ekonomiska rutiner/Swish](https://se.wikimedia.org/wiki/Ekonomiska_rutiner/Swish), läst 2026-08-30
- [cogwork.se — Swish Företag HANDLEDNING](https://cogwork.se/handledning/ekonomi/swish-foretag/), läst 2026-08-30
- [Flashback — Swish och transaktioner via fil?](https://www.flashback.org/t3573957), läst 2026-08-30
- [Bokio — Vanliga frågor om Swish](https://www.bokio.se/hjalp/bokio-foretagskonto/swish/vanliga-fragor-om-swish/), läst 2026-08-30
- [Fortnox — Mallar och exempelfiler till importfunktionen](https://support.fortnox.se/produkthjalp/fakturering/mallar-och-exempelfiler-till-importfunktionen), läst 2026-08-30

**Återanvänt utan omresearch:**

- [`kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md`](kvitto-branschpraxis-och-svensk-ratt-2026-08-30.md) § 2.1 (Pretix, redan direkt verifierad samma dag)

## Oväntade fynd — registrerade, inte förkastade

Handelsbankens formatspecifikation, version 3.1.2 (2024-06-05), noterar i
sin egen historik-tabell: *"Beskrivningen är nu anpassad till ny
avveckling som nu sker via Riksbanken."* Swish-clearingen har alltså
flyttats från den tidigare privata clearingoperatören till Sveriges
riksbank vid någon tidpunkt före juni 2024. Detta rör inte
matchningsfrågan direkt, men är värt att bokföra: om Miranon Media någon
gång bygger mot Swish Handel/API eller läser transaktionsreferenser på
djupet är "Riksbanken" (inte Getswish) den part som numera sätter den
unika betalningsreferensen.
