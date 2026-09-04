# Appvandring: betalning → kvitto, som Lotta upplever det i dag

> Vandrad 2026-08-30 kl. 17:13–17:26 CEST mot **staging**, i dev-servern på
> `http://localhost:5173`. Inget i repot ändrat, inget committat, inget skickat.
> Skärmdumparna ligger bredvid denna fil (numrerade `01-…` till `33-…`).
> Skrivet så att en person utan teknisk bakgrund ska kunna följa med:
> när ett tekniskt ord dyker upp förklaras det direkt.

---

## 1. Miljö-verifikat

| Vad | Värde | Hur det verifierades |
|---|---|---|
| Dev-server | `http://localhost:5173`, pid 52805, `vite --port 5173` (ingen `--mode`, alltså läser den `.env.development`) | `ps -p 52805`, `lsof -iTCP:5173` |
| Supabase-projekt (appens "server") | `https://pqtshyierkdgwdnxuirz.supabase.co` = **staging** | `.env.development` rad 3; `docs/reference/atkomst-och-nycklar.md` rad 53 listar `pqtshyierkdgwdnxuirz` som staging och `lvjsfnphlauldxqlncpl` som prod |
| Airtable-bas (appens "databas") | **`apphjj8Q7lkXCMsL4` = staging** (prod är `app8uGPrVCVOm6LfD`, rördes ALDRIG) | seed-skriptets egen utskrift *"Granskningsfixtur mot apphjj8Q7lkXCMsL4"*; `.env.seed.example` rad 7; skriptets `forbiddenBaseIds` blockerar prod hårt (`scripts/seed-review-fixture.mjs:227`) |
| Inloggat konto | `staging-admin@miranon.test` (Lottas roll = admin) | `.env.test` `TEST_ADMIN_EMAIL`; appen hälsar "Staging-Admin" i aktivitetsloggen |
| Fixtur | Ort **`ZZ-GRANSKNING-S113`**, event **Fjärrskådning / Utbildning, Event-14061**, `recSahYCeTbEzFFe6`, 7–8 september 2026, 20 platser, 4 bekräftade + 4 obekräftade anmälningar, 16 Deltaganden. **Utgår 2026-09-13** (14 dagars livstid) — lämnad kvar med avsikt så Marcus kan vandra samma fixtur | `npm run seed:review -- --ort ZZ-GRANSKNING-S113 --bekraftade 4 --obekraftade 4 --dagar 8 --ingen-svep`, utskriften kl. 17:16 |
| Kvittoserien | **0 nya rader** i stagings `Kvitton`-ledger (`tblk8fZcArXPpRYnX`) skapade efter kl. 16:00 — inget kvittonummer förbrukades | `list_records` med `IS_AFTER(CREATED_TIME(), …)` → tom lista, kl. 17:25 |
| Git | `main` @ `5b39126b`, rent träd före och efter | `git rev-parse`, `git status` |

**Två medvetna avsteg från uppdragstexten, öppet bokförda:**

1. Seeden kördes med `--ingen-svep`. Dry-runen visade att förfallo-svepet
   annars hade raderat **sex** utgångna fixturer (Falköping ×4, Varberg,
   ZZ-GRANSKNING-S103, utgångna 24–27 aug). Det är skriptets normala beteende,
   men ingen hade bett mig radera dem, så de står kvar. Marcus städar dem själv
   med `npm run seed:review -- --sweep` när han vill.
2. Uppdraget sa "markera 1–2 fixtur-deltagare → Åtgärder → betalningspanelen".
   Det visade sig att **betalningspanelen inte bryr sig om markeringen** — den
   listar alla aktiva anmälningar på eventet oavsett vilka mottagare som är
   markerade (`AtgardsSida.tsx:2964`, `alla.filter(r => r.status !== AVBOKAD)`).
   Jag gick därför direkt Eventsida → "Gå till åtgärder" utan att markera någon.

**Vad som ligger kvar i staging efter vandringen (så ingen blir överraskad):**

- Fixturen ovan, orörd utom: **David Jonsson** (`recTRXOEM29yoTuCI`) fick
  `Anmälningsavgift` bockad som Mottagen och sedan avbockad igen — fältet står
  nu på det uttryckliga värdet `"Ej mottagen"` (verifierat via Airtable-läsning
  kl. 17:21). Om det var tomt före vandringen är det nu ifyllt; det är så
  appens ångra-kryss fungerar (se steg 8).
- Två rader i aktivitetsloggen: "Staging-Admin markerade en betalning" och
  "… avmarkerade en betalning" (David Jonsson).
- Ett förhandsvisnings-utkast i Storage: `utkast/recSahYCeTbEzFFe6/kvitto.pdf`
  (skrivs över vid nästa förhandsvisning, det är dess kontrakt per ADR-124).
- **Playwright-MCP:ns webbläsarprofil är nu inloggad som `staging-admin`** (den
  var inloggad som `Staging-User` när jag kom) och dess `localStorage` är
  tömd. Den som använder samma webbläsare härnäst möter det läget.

---

## 2. Skärm för skärm

Räkningen nedan är "klick från Hem". Ett *klick* = ett tryck på något i
appen. En *handinmatning* = något Lotta måste skriva själv.

| Steg | Skärmdump | Vad Lotta ser | Vad hon gör | Klick (ack.) | Friktion / notering |
|---|---|---|---|---|---|
| 0 | `01-login-desktop.png` | Inloggning: e-post, lösenord, "Logga in", "Logga in med passkey" | Loggar in | – | Placeholder säger `t.ex. lotta@miranon.se`. Passkey finns. |
| 1a | `02-hem-desktop.png` | **Hem**: "Nästa event" (fixturen med "8 dagar kvar", "8 av 20 platser"), bevakningar, "42 nya anmälningar att bekräfta", **"72 förfallna betalningar / Att påminna 72"** med knapp **"Skicka påminnelse till alla"**, genvägar ("Gå till åtgärder"), senaste aktivitet | Klickar "Event" i bottenmenyn — eller direkt på "Nästa event"-kortet | 1 | Hem har alltså en **massknapp för påminnelser** men ingen motsvarighet för kvitton. Bevakningen "Förfallna betalningar" räknar per *betalning* (samma person kan stå två gånger: avgift + slutbetalning). |
| 1b | `03-eventlista-desktop.png` | **Event**-listan grupperad per månad: "Fjärrskådning · ZZ-GRANSKNING-S113 · 7 september 2026 · 8 av 20 platser" | Klickar eventet | 2 | Listan är kort i staging; i prod finns filter ("Visa filter") och Kommande/Tidigare. |
| 2 | `04-eventdetalj-desktop.png`, `04b-…-helsida` | **Eventsidan**: Om eventet, Beläggning, **Anmälda deltagare** med fyra steg-rader: *Väntar på bekräftelse 4 · Anmälningsavgifter 4 av 8 mottagna (−4) · Slutbetalningar 2 klara (−6) · Klara 1*, sedan registret (8 kort) där varje kort bär EN status-pill: "Väntar på bekräftelse", "Väntar på betalning" eller "Klar" | Läser av | 2 | **Svar på frågan "syns betalstatus per person utan att öppna raden?": halvt.** Pillen "Väntar på betalning" säger att *något* saknas, inte om det är avgiften eller slutbetalningen. Steg-radens siffror är summor. Inget belopp någonstans. |
| 2b | `05-eventdetalj-filter-anmalningsavgifter-desktop.png` | Klick på steg-raden "Anmälningsavgifter" filtrerar registret: "Visar 4 av 8 i registret", filtret "Saknar anmälningsavgift" | Klickar steg-raden | (3) | Bra: ett klick ger listan över vilka som inte betalat avgiften. Fortfarande inget belopp. |
| 2c | `06-eventdetalj-oppna-detaljer-betalningar-desktop.png` | Knappen **"Öppna detaljer"** under registret fäller ut betalningsläsytan: flikar "Saknar betalning (7) / Klara (1)", "Deadline passerad · 24 augusti", per person två **låsta** kryss (Anmälningsavgift / Slutbetalning, med "Mottagen"-etikett när bockad) + "Utskickslogg visas här - inget skickat ännu" | Klickar "Öppna detaljer" | (3) | Här SYNS vilken av de två betalningarna som saknas — men kryssen är medvetet låsta (eventsidan är en läsyta, TASK-145). Hon kan inte pricka av här. |
| 3a | `07-atgarder-start-desktop.png`, `07b-…-helsida` | **Åtgärder**: eventväljare, "Mottagare: **7 av 8 deltagare markerade**" (appen förvalde alla obekräftade-eller-obetalda, `AtgardsSida.tsx:2695–2705`), fyra åtgärder (1 Skicka bekräftelsemail 4 av 7 · 2 Skicka betalningspåminnelse · 3 Skicka deltagarinformation · 4 Skicka mail), sist rubriken **Betalningar** med knappen **"Pricka av och notera · 7 saknar"** | Klickar "Gå till åtgärder" på eventsidan, sedan "Pricka av och notera" | 4 | Betalningspanelen ligger **sist** på sidan, under fyra utskicksåtgärder. Rubriken säger "7 saknar" utan att säga vad. |
| 3b | `08-atgarder-betalningspanel-oppen-helsida-desktop.png` | Panelen: **alla 8** anmälda (även Astrid som inte var markerad som mottagare), varje person som en platta med två rader: kryss **Anmälningsavgift** + fritextfält "Notering…", kryss **Slutbetalning** + "Notering…". Rader som redan är Mottagen bär knappen **"Skicka kvitto"** | Letar upp personen | 4 | Ingen sökruta, ingen sortering — vid 20 personer får hon skrolla. Panelen speglar INTE mottagarmarkeringen (se avsteg 2 ovan). |
| 3c | `09-atgarder-avprickad-skicka-kvitto-syns-helsida-desktop.png` | Bockar **Anmälningsavgift för David Jonsson**: krysset blir grönt **omedelbart** (optimistiskt — appen visar det innan servern svarat), knappen **"Skicka kvitto"** dyker upp på raden, räknarna uppdateras live: "Pricka av och notera 6 saknar", "Skicka betalningspåminnelse 6 av 7" | Klickar krysset | 5 | **Vad sparas:** fältet `Anmälningsavgift = "Mottagen"` på anmälan i Airtable (verifierat kl. 17:20) + en rad i aktivitetsloggen. **Ingen bekräftelse på skärmen** ("sparat") — bara krysset. **Notering-fältet** sparas när hon lämnar fältet (blur), utan spara-knapp och utan kvittens (`AtgardsSida.tsx:1318–1326`). Hon kan skriva t.ex. "Swish 2 500 kr 30/8" där — men det är fritext som inte återanvänds av kvittot. |
| 4a | `10-kvittodialog-tom-desktop.png` | Dialogen **"Skicka kvitto - Anmälningsavgift"**: en rad "Kvittot går till David Jonsson för anmälningsavgift.", fältet **Belopp (kr)** (tomt, platshållare `1250`), väljaren **Betalsätt** ("Välj betalsätt"), knapparna **Avbryt** och **Skicka** (Skicka är avstängd) | Klickar "Skicka kvitto" | 6 | Kvittoknappen nådd på **6 klick från Hem** (5 om hon går via "Nästa event"-kortet). Båda fälten obligatoriska, båda tomma. **Inget förifyllt** — inte belopp, inte betalsätt, inte den notering hon nyss skrev. Mottagarens e-post visas inte (den läses av servern, `send-receipt-email/index.ts:244–260`). |
| 4b | `11-kvittodialog-betalsatt-oppen-desktop.png` | Betalsätt-listan: **Swish · Bankgiro · Plusgiro** | Klickar väljaren, väljer Swish | 8 | Tre alternativ, inget förval. Faktura/kort/kontant finns inte (medvetet, ADR-109 beslut a). |
| 4c | `12-kvittodialog-belopp-2-500-00-avvisas-tyst-desktop.png` | Skriver **`2 500,00`** (så som beloppet står i banken) → Skicka **förblir avstängd, utan något felmeddelande** | Skriver belopp | 9 + 1 inmatning | Se tabellen nedan. Ingen text förklarar varför knappen är grå. |
| 4d | `13-kvittodialog-ifylld-skicka-aktiv-EJ-TRYCKT-desktop.png` | Skriver **`2500`** → Skicka blir aktiv | Skulle trycka Skicka (**gjordes INTE**) | 10 | Efter ett lyckat skick visar dialogen enligt koden "Kvitto skickat — MM-2026-NNNN skickat till David Jonsson" och en **Stäng**-knapp (`AtgardsSida.tsx:1224–1258`) = **klick 11**. Vid fel visas serverns skäl, och ett numrerat kvitto kan då ha förbrukats (ADR-109 § Öppna punkter). |
| 5a | `17-anmalan-detalj-david-helsida-desktop.png` | **Anmälans detaljvy**: Kontakt, Avser ("**Namnlöst event** Event-14061" — fixturen saknar `Event (source)`), **Betalningar**: Anmälningsavgift *Ej mottagen* / Notering / Slutbetalning *Mottagen* / Notering, Uppgifter, Inkom, **Händelser** (Bekräftelsemail skickat, Anmälan inkom) | Letar efter kvittot | – | **Inget kvitto syns här.** Händelselistan visar bekräftelse och inkomst, inte betalningar och inte kvitton. Inget belopp. |
| 5b | `18-persondetalj-david-helsida-desktop.png` | **Personkortet**: Kontakt, Just nu (1 aktiv anmälan), Flagga, Interaktioner, Eventhistorik, Hämtade erbjudanden, Motiveringar, Anteckningar | Letar efter kvittot | – | **Inget kvitto, ingen betalstatus alls.** Personkortet läser inte aktivitetsloggen (grep i `PersonDetail.tsx`: bara skrivningar). |
| 5c | `19-aktivitetshistorik-desktop.png` | **Mer → Aktivitetshistorik**: "Staging-Admin markerade en betalning · för 3 min sedan · David Jonsson (okänt event)" och "… avmarkerade en betalning". Filterkategorin **"Kvitto"** finns i listan | Letar | – | **Detta är den ENDA plats där ett skickat kvitto skulle synas** — som en textrad "skickade kvitto · Namn (event)" (`receipts.ts:64–81`, `AktivitetsHistorik.tsx:139`). Raden säger inte *vilken* betalning (avgift/slut) eller belopp, och "(okänt event)" när eventet saknar `Event (source)`. **PDF:en går inte att se eller hämta någonstans** — den sparas inte (`_shared/send-receipt.ts:258`, `lagringsnyckel: null`). |
| 6a | `20-mer-dokument-start-desktop.png`, `21-…-event-valt`, `22-…-skapa-bilaga-meny` | **Mer → Bilagor** (rubriken heter "Bilagor", inte "Dokument"): först "Delade bilagor"; väljer man eventet i väljaren dyker **"Skapa bilaga ▾"** upp med tre poster: Bekräftelsebilaga · Deltagarinformation · **Betalningskvitto** | Väljer event, öppnar menyn, klickar Betalningskvitto | 3–4 från Mer | Kvittot **öppnas i en ny flik** som PDF via en signerad Storage-länk (giltig 5 min). Ingen "Ladda ner" (medvetet rivet 2026-08-29). |
| 6b | `23-kvitto-forhandsvisning-pdf-1.png` (+ `kvitto-forhandsvisning.pdf`) | Kvittot: Miranon Media-logga, "Kvitto", **Kvitto-/OCR-nr: FÖRHANDSVISNING**, Datum 2026-08-30, Vår referens "Miranon Media/Lotta Gotthardsson", Er referens "Exempelperson", Fakturaadress exempel-e-post, Benämning **"Utbildning 2026-09-07/08"** (1 st, 400,00), Netto 400 / Moms 100 / **BETALT SEK 500,00**, org-uppgifter (adress, telefon, plusgiro, Swish-nr, org-nr, momsreg-nr, F-skatt) | Tittar | – | Typexempel (500 kr Swish), aldrig verklig data. I staging bär PDF:en DocRaptors "TEST DOCUMENT"-vattenstämpel. **Kursnamnet ("Fjärrskådning") står inte på kvittot** — benämningen byggs av Typ + datum + "Bokföringstext (kvitto)" (`receipt-content.ts:271–295`), per Marcus-beslut TASK-306. Värt att fråga Lotta om (se § 5). |
| 7 | `14-atgarder-betalningspaminnelse-oppen-helsida-desktop.png`, `16-…-granskning-helsida` | **Åtgärd 2 "Skicka betalningspåminnelse · 6 av 7"**: ämne "Påminnelse om betalning", mall "Hej {förnamn}, Vi ser att betalningen för {event} inte kommit in ännu. Sista dag är {deadline}…", Ändra-knapp, bilageväljare, **"Granska och skicka"**. Granskningen: mottagarkorten (bockbara), utskicket med ifyllt exempel ("Hej Hassan … Sista dag är 24 augusti"), "Skicka till min inkorg" (testmail), **dra-reglage "Bekräfta utskicket"** innan **"Skicka till 7 personer"** aktiveras | Klickar åtgärden, "Granska och skicka" (skickade INTE) | 2 från Åtgärder | Påminnelsen är kvittots spegelbild i form: **en handling för alla**, med granskning, testmail och tvåstegsbekräftelse. Kvittot har inget av det: en dialog per person, ingen förhandsvisning, ingen testväg, ingen "dra för att bekräfta". Räknaren "6 av 7" räknar ur mottagarurvalet; exemplet visar en **redan passerad** deadline (24 aug) eftersom deadline = start − 14 dagar. |
| 8 | `15-atgarder-angrad-avprickning-kvittoknapp-borta-helsida-desktop.png` | Bockar av David igen: krysset släcks direkt, **"Skicka kvitto" försvinner**, räknarna går tillbaka ("7 saknar") | Klickar krysset | – | Sparas som `Anmälningsavgift = "Ej mottagen"` (uttryckligt värde, inte tomt — verifierat i Airtable kl. 17:21). Ett redan skickat kvitto skulle **inte** påverkas (ADR-109 beslut d/6) — men det syns ingenstans på raden att ett kvitto redan gått ut; bockar hon i igen kan hon skicka ett **andra** kvitto med nytt nummer utan varning. |
| iPad | `30-ipad-eventdetalj.png`, `31-ipad-atgarder-start.png`, `32-ipad-atgarder-betalningspanel-helsida.png`, `33-ipad-kvittodialog-EJ-SKICKAD.png` | Samma skärmar i 820 px bredd | – | – | Enkolumn, plattorna tar full bredd, kryss + "Skicka kvitto" på samma rad, notering under. Dialogen centrerad, läsbar. Inga trunkeringar. |

### Beloppsfältets beteende (mätt i dialogen, betalsätt valt)

Fältet är ett vanligt textfält med `inputmode="decimal"` (numeriskt tangentbord
på iPad) och `required`. Det finns **ingen feltext, ingen `aria-invalid`, inget
meddelande** — det enda som händer är att Skicka-knappen är grå eller inte.

| Inmatning | Skicka aktiv? | Kommentar |
|---|---|---|
| *(tomt)* | Nej | |
| `abc` | Nej | Tyst |
| `0` | Nej | Tyst (kräver > 0) |
| `-5` | Nej | Tyst |
| `2500` | **Ja** | |
| `2500,50` | **Ja** | Komma tolkas som decimaltecken |
| `2500.50` | **Ja** | Punkt också |
| **`2 500,00`** | **Nej** | **Tyst.** Så skriver banken och Swish beloppet. Mellanslaget fäller `Number()`. |
| `1e3` | **Ja** | Tolkas som 1000 — ingen varning |
| *(bara mellanslag)* | Nej | |

Logiken: `Number(belopp.replace(',', '.'))` måste vara ändligt och > 0
(`AtgardsSida.tsx:1177–1179`).

### Tillgänglighet på ytan (kort)

- Dialogen är en riktig `role="dialog"` med rubriken som namn ("Skicka kvitto - Anmälningsavgift"), går att stänga med Escape/klick utanför, och har "Avvisa"-knappar för skärmläsare.
- **Fokus landar på dialogens behållare**, inte i Belopp-fältet. Tabb-ordning: Belopp → Betalsätt → Avbryt → Skicka. Ett tabbtryck extra för alla.
- Fälten har synliga etiketter ("Belopp (kr)", "Betalsätt") och `required`.
- **Fel annonseras inte**: en avstängd Skicka-knapp är hela felmeddelandet. En skärmläsaranvändare får ingen förklaring till varför den inte går att trycka.
- Efter skick annonseras "Kvitto MM-… skickat till {namn}" via `alertScreenReader` (kod, ej prövat).
- Kryssrutorna i panelen har egna namn ("Anmälningsavgift för David Jonsson"), noteringsfälten också. Den synliga kryssrutan är ett label-element som fångar klicket (Playwright kunde inte klicka det dolda `<input>`-elementet direkt — ett tecken på att klickytan är etiketten, vilket är rätt för fingrar).

---

## 3. Lottas tisdag

Lotta öppnar bankappen på iPaden. Tre Swish har kommit in under natten: 2 500 kr
från Cecilia Ödman, 2 500 kr från Bengt Lindqvist och 1 000 kr från Gunilla
Törnqvist. Hon vet att Fjärrskådningen i september kostar 2 500, varav 1 000 i
anmälningsavgift — det står i hennes huvud och i bekräftelsebilagan, inte i
appen. Hon öppnar appen. På Hem ser hon "Nästa event: Fjärrskådning, 8 dagar
kvar" och klickar sig in (1), vidare till "Gå till åtgärder" (2) och skrollar
förbi fyra utskicksåtgärder ner till "Pricka av och notera · 7 saknar" (3).
Åtta plattor fälls ut. Hon hittar Cecilia, bockar Anmälningsavgift (4) — krysset
blir grönt, ingen text säger "sparat", men "Skicka kvitto" dyker upp. Hon
trycker (5). Dialogen frågar om belopp och betalsätt; hon växlar till
bankappen för att kolla exakta kronor, växlar tillbaka, skriver "2 500" som hon
är van (6 + inmatning) — knappen är fortfarande grå. Hon suddar mellanslaget,
knappen tänds. Betalsätt → Swish (7, 8). Skicka (9). "Kvitto MM-2026-1001
skickat till Cecilia Ödman." Stäng (10). Samma dans för Bengt och Gunilla, men
för Gunilla är det slutbetalningen som ska bockas, så hon måste läsa raden
noga. Efter tre kvitton har hon ingen kopia — vill hon kontrollera vad som gick
ut får hon be Cecilia vidarebefordra mailet, eller leta i Mer → Aktivitetshistorik
efter tre rader "skickade kvitto". Om Roger frågar "vad skickade vi till
Bengt?" finns svaret bara i Bengts inkorg.

**Räkning, tre betalningar på samma event (desktop-vägen ovan):**

| Moment | Klick | Handinmatningar |
|---|---|---|
| Ingång: Hem → event → Åtgärder → Pricka av | 3 (4 via Event-listan) | 0 |
| Per betalning: bocka · Skicka kvitto · klicka i Belopp · välj Betalsätt (2 klick) · Skicka · Stäng | 7 | 1 (beloppet) |
| **Summa 3 st** | **3 + 3×7 = 24 klick** | **3 belopp** (+ 3 betalsättsval, + 3 uppslag i banken, + 3 avgöranden avgift/slut) |

**Samma sak för tjugo (en hel kurs som betalar slutbeloppet veckan före):**

| Moment | Klick | Handinmatningar |
|---|---|---|
| Ingång | 3 | 0 |
| 20 × 7 | 140 | 20 belopp |
| **Summa 20 st** | **≈ 143 klick** (+ skroll för att hitta rätt platta bland 20, ingen sök) | **20 handskrivna belopp**, 20 betalsättsval, 20 "Stäng" |

Till det: 20 uppslag i banken, 20 gånger risken att skriva "2 500" med
mellanslag, och 20 kvittonummer som allokeras ett i taget — misslyckas
nummer 12 (nätverk, Resend) har numret redan förbrukats (ADR-109 § Öppna
punkter, klient-retry). Jämför påminnelsen: 20 personer = 1 åtgärd, 1
granskning, 1 dra-reglage, 1 "Skicka till 20 personer".

---

## 4. Vad appen redan vet men ändå frågar om

| Fråga i dialogen | Vet appen det? | Var det FINNS | Var det SAKNAS |
|---|---|---|---|
| **Belopp** | **Delvis, som text** | Eventinnehåll-tabellen (`tblwqaBrkm6hJPITd`) har `Pris` / `Anmälningsavgift` / `Resterande belopp` per kurs × typ, och Eventplanering har egna `(bilagetext)`-kopior per event (`data-model.md:517`, `:539`). I prod-modellen är de fritext som `'2.500'`, `'1000:-'`, `'1500:-'` (`scripts/seed-eventinnehall-modell.mjs:113–115`). I staging är de **tomma** för Fjärrskådning/Utbildning (skärmdump `25-…`). De läses av bekräftelsebilagan — inte av kvittodialogen | Inget **numeriskt** belopp per anmälan i `Anmälningar`; inget prisfält i domänmodellen (`ADR-109` § Kontext, ADR-086-pass). Rabatter, delbetalningar, "betalade allt på en gång" har ingen plats |
| **Betalsätt** | **Nej** | – | Inget fält på anmälan säger Swish/Bankgiro/Plusgiro. Enda spåret är om Lotta skrivit det i Notering-fritexten |
| **Vilken betalning (avgift/slut)** | Ja | Bestäms av vilken rad hon klickar "Skicka kvitto" på (`SkrivRad`, `betalning`-prop) | – |
| **Mottagarens e-post** | Ja | Servern läser den ur anmälan (`send-receipt-email/index.ts:244–260`) | Visas inte i dialogen — hon ser inte VART det går |
| **Kundnamn** | Ja | `displayName(registration)` → PDF:ens "Er referens" | – |
| **Event-benämning på kvittot** | Ja | `Typ` + `Startdatum/Slutdatum` + `Bokföringstext (kvitto)` ur Eventplanering (`send-receipt-email/index.ts:290–303`) | **Kursnamnet** (`Event (source)`/"Kurs") används inte i benämningen — kvittot säger "Utbildning 2026-09-07/08", inte "Fjärrskådning" |
| **Datum** | Ja | Sändtidpunkten (UTC-datum, `receipt-content.ts` § formatDatum) | Betalningens faktiska datum (när Swishen kom) frågas inte och står inte på kvittot |
| **Noteringen hon nyss skrev** | Ja (i basen) | `Notering anmälningsavgift` / `Notering slutbetalning` på anmälan | Återanvänds inte i dialogen; kvittots `Notering`-fält i ledgern skrivs aldrig i v1 (`ADR-109` beslut 6) |
| **Att ett kvitto redan skickats** | Ja (i ledgern) | `Kvitton`-tabellen + spegelfältet `Anmälningar.Kvitton` (`data-model.md:152–155`) | Visas ingenstans i UI:t: raden i panelen ser likadan ut före och efter, anmälans detaljvy och personkortet nämner det inte |
| **Moms** | Ja | 25 % räknas ut ur bruttot (`receipt-content.ts:183–192`) | Momssatsen är hårdkodad; om en kurs vore momsfri finns ingen ratt |

---

## 5. Frågor bara Lotta/Marcus kan svara på (till grillningen)

1. **När prickar Lotta av?** En i taget när Swishen plingar, eller i batch (t.ex. varje måndag mot kontoutdraget, eller dagarna före kursstart)? Svaret avgör om "en dialog per betalning" är ok eller om bulk är kravet.
2. **Var läser hon av betalningen?** Bankens app/webb på iPad, eller på datorn? Kopierar hon beloppet eller skriver hon det ur huvudet? (Avgör om `2 500,00`-fällan är verklig.)
3. **Betalar deltagarna exakt det utsatta priset?** Hur vanliga är rabatter, delbetalningar i flera omgångar, "betalade hela beloppet direkt" (avgift + slut i en Swish), par som betalar för två, återbetalningar?
4. **Vad ska stå på kvittot som benämning?** Räcker "Utbildning 2026-09-07/08, personlig utveckling" eller vill hon/deltagaren se kursnamnet "Fjärrskådning"? Vem fyller i "Bokföringstext (kvitto)" per event, och glöms det?
5. **Vill Lotta/Roger ha en kopia av varje kvitto?** Var — i mailen (kopia till lotta@), i appen (en lista per event), eller i Rogers bokföring? Hur gör Roger bokslut i dag — behöver han en export?
6. **Ska betalningsdatumet stå på kvittot** (den dag Swishen kom) eller räcker sänddatumet?
7. **Vilka betalsätt förekommer i verkligheten** utöver Swish/Bankgiro/Plusgiro? Kort på plats, kontant, faktura via Roger, presentkort?
8. **Hur ofta ångrar hon en avprickning?** Och vad ska hända med ett redan skickat kvitto då — kreditnota, mail till kunden, ingenting? (v1: kvittot består, tyst.)
9. **Vill hon skicka kvittot i samma andetag som avprickningen**, eller hellre "pricka av tio, skicka kvitton till alla tio sedan"? (Formvalet i orkestrerarens utlåtande: bulk-handling i Åtgärder.)
10. **Ska kvittot kunna gå till någon annan än anmälans e-post** (arbetsgivare betalar, förälder betalar för barn)?
11. **Hur vill hon se att ett kvitto redan är skickat** — på raden i panelen ("Kvitto MM-2026-1012 skickat 30/8"), på anmälans detaljvy, i personkortet — eller räcker aktivitetshistoriken?

---

## 6. Avvikelser mot kartläggningen

Allt som INTE stämde, eller som kartläggningen inte sa, jämfört med
`docs/research/kvitto-flodet-kartlaggning-2026-08-30.md`:

1. **Uppdragets premiss "Markera 1–2 fixtur-deltagare → Åtgärder → betalningspanelen"** stämmer inte med appen: panelen "Pricka av och notera" listar **alla** aktiva anmälningar på eventet, oberoende av mottagarmarkeringen (`AtgardsSida.tsx:2964`). Kartläggningen säger "Åtgärder → betalningspanelen" utan att nämna markering, så det är uppdragstexten, inte kartläggningen, som avviker.
2. Kartläggningen (a) 3: *"Dialog: belopp + betalsätt … båda obligatoriska, inmatade för hand"* — **stämmer**, men den nämner inte att **inga felmeddelanden finns alls**: ogiltigt belopp ger bara en grå knapp, och `2 500,00` (bankens format) avvisas tyst. Det är den enskilt största praktiska fällan i dialogen och saknas i kartläggningen.
3. Kartläggningen (a) 6: *"Aktivitetsloggen: 'skickade kvitto'"* — **stämmer** enligt kod (`receipts.ts:64–81`), men den utelämnar att detta är den **enda** synliga platsen. Verifierat live: anmälans detaljvy och personkortet visar inget om kvitton, personkortet visar inte ens betalstatus. Betalningsraderna i loggen säger "markerade en betalning" utan att ange avgift/slut, och "(okänt event)" när `Event (source)` saknas.
4. Kartläggningen säger *"Bilagor-ytans 'Betalningskvitto' (Skapa bilaga ▾, `DokumentYta.tsx:292`)"* — **stämmer** (`GENERATORER` på rad 292), men menyn syns **först när ett event valts** i väljaren, och kvittot öppnas i en **ny flik** via signerad Storage-URL (`utkast/<eventId>/kvitto.pdf`, 5 min giltig) — inte i appen. I staging bär PDF:en DocRaptors "TEST DOCUMENT"-band.
5. Kartläggningen (b) *"Data … `kvittoBenamning`"* — **stämmer**, men konsekvensen syns först på pappret: kvittot säger **"Utbildning 2026-09-07/08"** och nämner aldrig kursnamnet "Fjärrskådning". Inget fel mot koden (Marcus-beslut TASK-306), men en Lotta-fråga kartläggningen inte ställer.
6. Kartläggningen (e) 6 / ADR-109 § Öppna punkter: *"Belopp/betalsätt är alltid handpåläggning"* — **stämmer**, men kartläggningen (c) "Datan" skriver att `Eventinnehåll`/`Platser` bär `Pris`/`Anmälningsavgift`/`Resterande belopp` som fritext. Platser-tabellen bär enligt `data-model.md:526–530` **inga** prisfält (Namn, Adress, Parkering/Transport/Kläder, Eventplanering-spegel); prisfälten på rad 539 tillhör **Eventplanerings `(bilagetext)`-fält**, inte Platser. Kartläggningens formulering "`Eventinnehåll` … och `Platser` … bär Pris" är alltså **fel om Platser** — rätt par är Eventinnehåll + Eventplanering (bilagetext). Fritext-värdena är dessutom tomma i staging (skärmdump 25).
7. Kartläggningen (a) 2 / ADR-109 beslut 7: *"synlig först när betalningen är Mottagen"* — **stämmer**, verifierat live åt båda håll (dyker upp vid bock, försvinner vid avbock). Tillägg som saknas: avbocken skriver det **uttryckliga** värdet `"Ej mottagen"` (inte tomt), och raden bär ingen markör för "kvitto redan skickat", så ett andra kvitto kan skickas utan varning.
8. Kartläggningen (a) 4: *"Kvitto skickat — MM-2026-1001 skickat till {namn}"* — **kunde inte verifieras** (Skicka trycktes aldrig, per uppdraget). Koden bekräftar formen; dessutom finns en **Stäng**-knapp efteråt som kostar ett klick till, vilket kartläggningen inte räknar.
9. Radnummer i kartläggningen (`main @ 2b3d105c`) är förskjutna 1–3 rader mot dagens `main @ 5b39126b` (t.ex. `kanSkicka` på 1177–1179, inte 1175–1177). Innehållet stämmer.
10. Kartläggningen nämner inte att **Hem** har en massknapp "Skicka påminnelse till alla" (72 förfallna) — kvittots syskon har alltså redan en bulk-ingång på startsidan, kvittot har ingen ingång alls utanför panelen.
11. Kartläggningen nämner inte att panelen saknar **sök/sortering** och ligger **sist** på Åtgärder-sidan under fyra utskicksåtgärder — vid 20 deltagare är skroll den tysta kostnaden.

Inga blockeringar. Inget i prod rört. Inget kvittonummer förbrukat.
