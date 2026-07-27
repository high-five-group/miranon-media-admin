---
owner: marcus803
updated: 2026-07-26
review_by: 2027-01-26
status: stable
---

# Var går de 9 minuterna i `Staging (API + E2E)` — och hur mycket av dem är flyttbart? (Code, 2026-07-26)

> **Proveniens:** avgränsat mätnings- och analyspass (S91), 2026-07-26. **Ingen
> testsvit har körts** — varken mot staging, mot preview eller pure. All
> tidsdata är hämtad ur GitHub Actions jobb-API:t (`steps[].started_at` /
> `completed_at`) och ur jobbloggarnas reporter-rader för fyra gröna körningar:
> **30201378215**, **30163753632**, **30203536401**, **30200699658**. Alla
> testantal är hämtade med `playwright test --list` (kollektionsfas — laddar
> specfilerna, exekverar inga tester, startar ingen webbserver, gör inga
> nätverksanrop). Klassningen och räckviddsbedömningen bygger på läsning av
> `tests/`, `playwright.config.ts`, `.github/workflows/ci-suite.yml`,
> `.purge-staging-policy.json` och `src/data/`.

---

## Kort svar

> **RÄTTELSE (2026-07-26, samma dag, efter steg 1:s skarpa mätning).** Två
> påståenden nedan höll inte när de prövades mot verkligheten och rivs öppet
> hellre än att stå kvar:
>
> 1. **"E2E-sviten skriver aldrig till staging" är FALSIFIERAT.**
>    `skapa-event.staging.test.ts` gör ett skarpt `POST
>    /functions/v1/create-event` — testet heter uttryckligen *"formuläret skapar
>    ett riktigt event i staging"*. Filen gör dessutom två egna `POST
>    /auth/v1/token`. Den ska alltså **inte** flyttas ur den skarpa sviten.
> 2. **"296 av 332 tester är hermetiska" var för optimistiskt på fil-nivå.**
>    Samtliga 32 e2e-filer har restanrop. Men 86 % av dem går till Google Fonts,
>    inte staging, så slutsatsen står kvar med marginal: **19 av 32 filer blir
>    rena enbart genom typsnitts-pinning**, och 13 filer behöver arbete.
>
> Riktningen i detta pass — att låta mindre arbete behöva den dyra resursen —
> bekräftas av mätningen. Det är premisserna som skärps, inte slutsatsen.
> Fullt utfall: [`hermetik-matning-steg1-2026-07-26.md`](hermetik-matning-steg1-2026-07-26.md).

**Cirka 410 sekunder — 6,8 av jobbets 9,25 minuter, 74 % — bärs av e2e-tester
som redan installerar sina egna Edge-Function-mockar och därför inte behöver
den delade staging-miljön för sin data.** Det som genuint måste ha en verklig
backend är resten: 173 API-tester (65 s), 36 e2e-tester som inte mockar något
(50 s), auth-setupen och jobbets fasta uppstart. Sammanlagt **cirka 145
sekunder — 2,4 minuter**.

Tiden går nästan uteslutande till ett enda steg. E2E-steget är **84 %** av
jobbet (466 s av 555 s). API-steget är **11,7 %** (65 s). Allt annat — checkout,
Node, `npm ci`, webbläsar-cache, teardown — är tillsammans **4,3 %** (24 s).
Något byggsteg finns inte i jobbet: e2e kör mot en Vite-dev-server som startas
av Playwrights `webServer`-block, och den starten är mätt till 4,9 s.

**Den viktigaste nyanseringen, och den som styr beslutet:** de 410 sekunderna
försvinner inte om testerna flyttas. 296 av 332 e2e-tester mockar redan sitt
nätverk, så deras tid är till övervägande del webbläsararbete — inte
Airtable-latens. Vinsten av en flytt är därför **inte** att testerna blir
snabbare i sig, utan att arbetet **lämnar mutexen** och först då kan
parallelliseras fritt. Mutex-hållningen kan gå från 9,25 min till cirka
2,4 min — en faktor 3,8 — och det hermetiska jobbet kan sedan skalas med
workers och shards utan att slåss om Airtables fem anrop per sekund.

Det är alltså rätt lever att dra, men av rätt skäl: **mindre arbete behöver den
dyra resursen**, inte "testerna blir snabbare".

---

## 1. Stegnedbrytning — faktiska sekunder

Fyra gröna körningar av `Test suite / Staging (API + E2E)`. Kolumnen "per
körning" listar dem i ordningen 30201378215 / 30163753632 / 30203536401 /
30200699658.

|Steg|Per körning (s)|Medel (s)|Andel|
|---|---|---|---|
|Set up job|1 / 1 / 1 / 1|1,0|0,2 %|
|Checkout|1 / 1 / 2 / 2|1,5|0,3 %|
|Setup Node|4 / 3 / 5 / 5|4,3|0,8 %|
|Install dependencies (`npm ci`)|14 / 12 / 12 / 13|12,8|2,3 %|
|Cache Playwright browsers|3 / 3 / 4 / 2|3,0|0,5 %|
|Install Playwright Chromium|1 / 1 / 1 / 1|1,0|0,2 %|
|**API tests (staging)**|62 / 64 / 75 / 59|**65,0**|**11,7 %**|
|**E2E tests (staging)**|454 / 468 / 491 / 450|**465,8**|**84,0 %**|
|Post + Complete job|1 / 0 / 0 / 1|0,5|0,1 %|
|**Jobb-total**|**541 / 553 / 591 / 534**|**554,8**|**100 %**|

Medelvärdet 554,8 s = **9,25 min**. Frågans "9,1 minuter" ligger inom
spridningen (8,9–9,85 min över de fyra körningarna).

**Inuti de två teststegen** (mätt från loggens reporter-rader):

|Del|Medel (s)|Kommentar|
|---|---|---|
|API — harness-start till `Running 173 tests`|1,7|config-laddning; ingen webbserver (`PLAYWRIGHT_NO_WEB_SERVER=1`)|
|API — exekvering|63,2|173 tester, 2 workers|
|E2E — harness-start till `Running 333 tests`|4,9|config-laddning **plus** Vite-dev-serverns start på port 5173|
|E2E — exekvering|461,0|333 tester, 2 workers|

**Två observationer som betyder något för beslutet:**

- **Uppstarten är redan billig.** `npm ci` tar 13 s och webbläsar-cachen
  träffar varje gång (`Cache hit`, ~261 MB återställda på ~2 s). Det finns
  ingenting att hämta i uppstarten — den är 4 % av jobbet och redan optimerad.
- **Två workers, inte fler.** Runnern har fyra kärnor och Playwrights default
  är halva kärnantalet. Antalet är alltså inte valt utifrån Airtables tak —
  det är bara defaulten. Att höja det på den nuvarande sviten vore ändå fel:
  TASK-6-noten i `playwright.config.ts` dokumenterar sex deterministiska
  kollisioner när två testmängder rör samma staging-poster samtidigt.

**Kötid till mutexen** var i dessa fyra körningar 28–31 s (från skapad körning
till stegets start), det vill säga i praktiken noll väntan — ingen av dem köade
bakom en annan. Kötiden under verklig samtidighet är inte mätt här; repot har
redan ett stående instrument för den i `scripts/ci-metrics.mjs`, som
rapporterar just "kötid från skapad körning till staging-jobbets start".

---

## 2. Per projekt och per fil

CI kör exakt två projekt i det här jobbet: `api-staging` (med `api-setup` som
dependency) och `chromium-authenticated` (med `setup` som dependency).
`api-pure` kör i det mutexfria jobbet `Pure + Build`, och `staging-preview`
existerar över huvud taget inte i CI — projektet skapas bara när
`PLAYWRIGHT_STAGING_PREVIEW=1` är satt, vilket ingen workflow gör.

|Projekt|Tester|Väggklocka (s)|Andel av jobbet|
|---|---|---|---|
|`api-staging` (+ `api-setup`)|173|65,0|11,7 %|
|`chromium-authenticated` (+ `setup`)|333|465,8|84,0 %|
|`api-pure`|—|kör i annat jobb|—|
|`staging-preview`|—|kör inte i CI|—|

### 2.1 Om per-fil-tiderna — vad som är mätt och vad som är fördelat

**Playwrights reporter ger inga tider per test i CI-loggen.** Reportern är
`dot` (Playwrights default när `CI` är satt, och configen sätter ingen egen),
och den skriver ett tecken per test plus en sammanfattningsrad. Den inbyggda
"Slow test file"-rapporten hjälper inte heller: tröskeln är **300 000 ms** i
`playwright/lib/runner/index.js` (`reportSlowTests: {max: 5, threshold: 3e5}`),
och ingen fil är i närheten av fem minuter — därför saknas raderna helt.
Failure-artefakterna innehåller bara traces och skärmdumpar för fallerande
tester; någon HTML-rapport genereras aldrig.

Per-fil-tabellerna nedan är därför **fördelade, inte mätta**: antalet tester per
fil är exakt (ur `--list`), och sekunderna är projektets uppmätta väggklocka
fördelad jämnt per test — 1,384 s/test för e2e, 0,365 s/test för API. Det är en
modell med en känd svaghet: tester som väntar på nätverk är dyrare än rena
DOM-assertions, så filer med mycket live-trafik är underskattade och filer med
enbart mockar överskattade. Modellen räcker för att rangordna, inte för att
budgetera enskilda filer.

Den grövsta faktiskt mätbara upplösningen är dot-reporterns radbrytningar var
80:e test. E2E-genomströmningen är jämn över körningen: 115 s, 103 s, 105 s,
101 s för de fyra hela 80-testblocken i körning 30201378215. **Ingen enskild
klump dominerar** — det finns ingen "en långsam fil"-förklaring att jaga.

### 2.2 E2E per fil (333 tester, 461 s)

|Fil|Tester|Fördelad tid (s)|Mockar EF|Live|
|---|---|---|---|---|
|`event-detail.staging.test.ts`|56|77,5|50|6|
|`hem.staging.test.ts`|28|38,8|25|3|
|`events-list.staging.test.ts`|25|34,6|25|0|
|`event-bekraftelse.staging.test.ts`|20|27,7|20|0|
|`event-ny-anmalan.staging.test.ts`|18|24,9|18|0|
|`mark-paid.staging.test.ts`|12|16,6|12|0|
|`events-list-kalender.staging.test.ts`|11|15,2|11|0|
|`mer-index.staging.test.ts`|11|15,2|1|10|
|`skapa-event.staging.test.ts`|11|15,2|11|0|
|`mer-segment.staging.test.ts`|10|13,8|10|0|
|`event-deltagare.staging.test.ts`|9|12,5|9|0|
|`event-anteckningar.staging.test.ts`|8|11,1|8|0|
|`event-narvaro-register.staging.test.ts`|8|11,1|8|0|
|`event-narvaro.staging.test.ts`|8|11,1|8|0|
|`mer-maillogg.staging.test.ts`|8|11,1|8|0|
|`person-detail.staging.test.ts`|8|11,1|8|0|
|`shell.staging.test.ts`|8|11,1|0|8|
|`hem-laddlage.staging.test.ts`|7|9,7|7|0|
|`mer-intresserade.staging.test.ts`|7|9,7|7|0|
|`anmalan-detalj.staging.test.ts`|6|8,3|6|0|
|`auth-flow.staging.test.ts`|6|8,3|0|6|
|`event-anmalda.staging.test.ts`|6|8,3|6|0|
|`mer-vantelista.staging.test.ts`|6|8,3|6|0|
|`persist-cache.staging.test.ts`|6|8,3|6|0|
|`event-add-registration.staging.test.ts`|5|6,9|5|0|
|`event-bor-over.staging.test.ts`|5|6,9|5|0|
|`mer-anmalningar.staging.test.ts`|5|6,9|5|0|
|`person-note-edit.staging.test.ts`|4|5,5|4|0|
|`persons-list.staging.test.ts`|4|5,5|4|0|
|`mer-segment-send.staging.test.ts`|3|4,2|3|0|
|`pwa-offline.staging.test.ts`|2|2,8|0|2|
|`css-cascade.staging.test.ts`|1|1,4|0|1|
|`auth.setup.ts` (projekt `setup`)|1|1,4|—|1|
|**Summa**|**333**|**461,0**|**296**|**37**|

Kolumnerna "Mockar EF" och "Live" kommer ur en statisk analys av testkällorna:
ett test räknas som mockande om det — direkt, via en lokalt definierad
hjälpfunktion (transitivt) eller via `beforeEach` — registrerar minst en
`page.route`. Analysen är verifierad mot manuell läsning av de fem största
filerna, som alla följer samma mönster: en `mock*`-hjälpare (`mockEvent`,
`mock`, `mocka`, `mockEndpoints`, `mockSidan`) anropas överst i varje test.

### 2.3 API-staging per fil (173 tester, 63 s)

|Fil|Tester|Fördelad tid (s)|Klass|
|---|---|---|---|
|`edge-functions.staging.test.ts`|20|7,3|LÄS|
|`update-record.staging.test.ts`|14|5,1|BLANDAD|
|`airtable-filter.staging.test.ts`|12|4,4|LÄS|
|`get-registrations.staging.test.ts`|12|4,4|LÄS|
|`create-registration.staging.test.ts`|11|4,0|SKRIV|
|`update-event.staging.test.ts`|11|4,0|BLANDAD|
|`get-event.staging.test.ts`|9|3,3|LÄS|
|`create-event-note.staging.test.ts`|8|2,9|SKRIV|
|`create-event.staging.test.ts`|8|2,9|SKRIV|
|`get-person.staging.test.ts`|7|2,6|LÄS|
|`get-event-notes.staging.test.ts`|6|2,2|BLANDAD|
|`send-registration-confirmation.staging.test.ts`|6|2,2|BLANDAD|
|`get-attendance.staging.test.ts`|5|1,8|LÄS|
|`get-leads.staging.test.ts`|5|1,8|LÄS|
|`get-registration.staging.test.ts`|5|1,8|LÄS|
|`get-waitlist.staging.test.ts`|5|1,8|LÄS|
|`save-segment.staging.test.ts`|5|1,8|SKRIV|
|`send-email.staging.test.ts`|5|1,8|LÄS|
|`require-user.staging.test.ts`|4|1,5|LÄS|
|`compute-segment.staging.test.ts`|3|1,1|LÄS|
|`create-admin-user.staging.test.ts`|3|1,1|LÄS|
|`get-mail-log.staging.test.ts`|3|1,1|LÄS|
|`cors.staging.test.ts`|2|0,7|LÄS|
|`get-event-formats.staging.test.ts`|2|0,7|LÄS|
|`auth.setup.ts` (projekt `api-setup`)|1|0,4|—|
|`get-persons.staging.test.ts`|1|0,4|LÄS|
|**Summa**|**173**|**63,2**||

Två filer genererar tester i loop, vilket är varför literala `test()`-anrop
(145) inte stämmer med körningens antal (173). Siffrorna ovan är körningens.

---

## 3. Läs/skriv-klassningen

### 3.1 Sammanställning i sekunder

|Klass|Tester|Sekunder|Andel av jobbet (555 s)|
|---|---|---|---|
|**E2E, mockat nätverk** — LÄS mot fixtur|296|409,8|73,9 %|
|**E2E, live** — LÄS mot staging|36|49,8|9,0 %|
|**API LÄS** — läser eller avvisar före skrivning|103|37,6|6,8 %|
|**API BLANDAD** — skriver och läser tillbaka|37|13,5|2,4 %|
|**API SKRIV** — skapar sentinel-poster|32|11,7|2,1 %|
|Auth-setup (två projekt)|2|1,8|0,3 %|
|Fast jobb-uppstart och teardown|—|24,0|4,3 %|
|Harness-start (två steg)|—|6,6|1,2 %|

**Det finns inga skrivningar mot staging i e2e-sviten.** Varje muterande
Edge Function som e2e rör — `create-registration`,
`send-registration-confirmation`, `update-record`, `update-event`,
`create-event`, `create-event-note`, `save-segment`, `send-email`,
`compute-segment` — är avlyssnad med `route.fulfill` i den fil som testar den.
Testerna verifierar **payloaden som appen skickar** och **hur användargränssnittet
reagerar på svaret**, inte att Airtable tog emot något. Skrivbeviset ligger
helt i API-sviten.

### 3.2 API-sviten per fil

|Fil|Klass|Vad filen bevisar|Sentinel|
|---|---|---|---|
|`airtable-filter`|LÄS|Formelinjektion i `status`/`search` ger 200 eller 400 mot Airtables riktiga formelparser — aldrig 500 eller tautologi|nej|
|`compute-segment`|LÄS|Segmentmedlemskap ur Deltaganden; 401 utan token|nej|
|`cors`|LÄS|Preflight speglar tillåten origin, avvisar otillåten utan ACAO-header|nej|
|`create-admin-user`|LÄS|Auth-grind och allowlist; rör aldrig Airtable|nej|
|`create-event-note`|SKRIV|Skriver anteckning med eventlänk och serversatt författare ur JWT|ja|
|`create-event`|SKRIV|Upsert-idempotens, härledd `Månad/år`, födda `EventKey` och `Event-nr`|ja|
|`create-registration`|SKRIV|Skapar anmälan; 409-dubblettskydd via EventKey-strängfilter|ja|
|`edge-functions`|LÄS|Deny-vägen per EF: anonym, ogiltig JWT och anon-key ger 401|nej|
|`get-attendance`|LÄS|Record-ID-batch, namnberikning, 404/400/401|nej|
|`get-event-formats`|LÄS|Eventformatlistan bär rec-id och namn|nej|
|`get-event-notes`|BLANDAD|Skriver tre sentinelanteckningar och läser tillbaka dem via omvänd länk, nyast först|ja|
|`get-event`|LÄS|Per-källa-beläggning mot basens formel `Antal anmälda`; NaN-coercion|nej|
|`get-leads`|LÄS|Lead-filtrets invariant, rollup-mappning, cursor-paginering till null|nej|
|`get-mail-log`|LÄS|Kontraktet mot tom tabell parsar rent|nej|
|`get-person`|LÄS|Noll trunkering över chunk-gräns; flervärt rollup som `string[]`|nej|
|`get-persons`|LÄS|Cursor-portens conformance: pageSize 2 ger [2, 2, 1]|nej|
|`get-registration`|LÄS|Detaljshapen; medföljande-relationen i båda riktningar|nej|
|`get-registrations`|LÄS|Väg D som ground truth; sortering med nulls sist; rollup number-vs-null|nej|
|`get-waitlist`|LÄS|Serverside aktiv-filter; `createdTime`-sortering bunden till kända rader|nej|
|`require-user`|LÄS|Helpern isolerat: tre deny-vägar och en allow|nej|
|`save-segment`|SKRIV|Skriver segmentnamn och regel som JSON-rundtur|ja (utan purge-target)|
|`send-email`|LÄS|Enbart avvisningar före skrivning: 401, 405, 400|nej|
|`send-registration-confirmation`|BLANDAD|Läser tillbaka att status och tidsstämpel står orörda efter 422 — atomicitetens negativa gren|ja|
|`update-event`|BLANDAD|Skapar sentinel-event, patchar, läser om, återställer i `finally`|ja|
|`update-record`|BLANDAD|Muterar befintliga poster och läser tillbaka; deny-tester fälls före Airtable|nej|

**Ett fynd som inte hör till tidsbudgeten men som inte får tappas:**
`save-segment` skapar rader med prefixet `app-segment-test+<uuid>` som saknar
motsvarande target i `.purge-staging-policy.json`. De städas alltså aldrig.
Registreras som tråd-kandidat — den blockerar ingenting här.

---

## 4. Den hermetiska formens räckvidd

### 4.1 Vad `tests/visual/support/` faktiskt gör

Ramen är 175 rader i `hermetic.ts` plus 1 134 rader fixturdata, och den
förseglar sex saker:

1. **Frusen klocka** — `page.clock.setFixedTime(FROZEN_NOW)` fixerar `Date`
   medan timers löper vidare, så React och TanStack beter sig normalt.
2. **Seedad session** — ett `addInitScript` lägger en fabricerad session i
   Supabase-klientens lagringsform i `localStorage` under nyckeln
   `sb-visual-fixture-auth-token` **före** app-JS. Ingen inloggning, ingen
   `auth.setup`, inga credentials. JWT:n är syntaktiskt giltig med utgång 24 h
   efter den frusna tidpunkten, så ingen refresh hinner schemaläggas.
3. **Hermetik-vakt** — en `page.route('**/*')` registrerad **först** (och
   därmed prövad **sist**) släpper igenom `localhost` och `127.0.0.1` och
   `abort`:ar allt annat med `blockedbyclient`. Ett anrop som slinker förbi
   mockarna dör hörbart i stället för att tyst göra resultatet miljöberoende.
4. **Pinnat typsnitt** — `fonts.googleapis.com` och `fonts.gstatic.com` servas
   ur incheckade filer i `assets/`, så CDN:en varken är ett beroende eller en
   driftkälla.
5. **EF-mockar i zod-parsad form** — sju funktioner (`get-events`,
   `get-registrations`, `get-event`, `get-event-notes`, `get-event-formats`,
   `get-persons`, `get-person`) svarar med samma form som skarpa
   Edge Functions och parsas av samma zod-scheman i adaptern. Två av dem är
   parameter-medvetna resolvers som speglar EF:ens filter, sök och paginering.
   En omockad EF svarar **501 med namnet i klartext** — aldrig tyst tom data.
6. **Fixtur-server på fiktiv URL** — `webServer` startar dev-servern på egen
   port 5299 med `VITE_SUPABASE_URL` satt till en påhittad adress och
   `reuseExistingServer: false`. Pekar appen fel syns det som utloggat läge,
   inte som tyst staging-trafik.

**Vad formen kostar i CI, mätt:** workflowen `visual-baselines.yml`, körning
**30081527883**, steg "Generera baselines i linux-miljön": **20 sekunder** för
12 tester över sex vyer i två viewports — inklusive dev-serverstart och
helsides-skärmdumpar i `deviceScaleFactor: 2`. Hela jobbet, med `npm ci` och
webbläsarinstallation, tog **50 sekunder**. Det är den empiriska ankarpunkten
för vad ett hermetiskt jobb kostar: cirka 30 s fast uppstart plus själva
testtiden.

### 4.2 Räcker formen för e2e-testerna?

**För 296 av 332 tester: ja, med två tillägg.** Testerna bär redan sina egna
fixturer inline och registrerar sina egna routes — de behöver alltså ingen
delad fixturvärld. Det som saknas är:

- **Hermetik-vakten.** Ingen e2e-fil har en catch-all-route. Ett test som
  mockar `get-event` och `get-registrations` låter fortfarande sidans övriga
  anrop — `get-event-notes`, `get-attendance`, `get-event-formats` — gå till
  staging. Vakten gör den restrafiken synlig i stället för tyst.
- **Den seedade sessionen.** E2E hämtar i dag `storageState` från
  `auth.setup.ts`, som loggar in på riktigt mot staging-Supabase.
  `buildSession()` ersätter det utan nätverk.

Arkitekturen underlättar: hela datalagret går genom **en** adapter,
`src/data/adapters/AirtableAdapter.ts`, som `src/data/dataSource.ts` injicerar
i router-context. Det finns alltså två möjliga sömmar för en fixturvärld —
nätverkssömmen (som visual-ramen använder) eller adaptersömmen. Nätverkssömmen
är den rätta här, av två skäl: den är redan bevisad i repot, och den behåller
zod-parsningen och adapterkoden i testets väg. Adaptersömmen skulle mocka bort
just den kod e2e finns till för att pröva.

### 4.3 Vad som inte går att mocka trovärdigt

|Yta|Varför en mock inte duger|
|---|---|
|**Auth-flödet** (`auth-flow`, 6 tester)|Redirect-kedjan, `router.invalidate` vid auth-byte och att utloggad navigation inte läcker EF-anrop hänger på riktiga Supabase-tokens och riktiga 401:or. En fabricerad session testar per definition inte inloggning.|
|**CORS-gränsen** (`cors`, 2 tester)|Preflight-beteendet bor i den deployade funktionens headers. En mock som svarar 204 bevisar ingenting om vad staging faktiskt tillåter.|
|**Airtables formelparser** (`airtable-filter`)|Att en injektionssträng avvisas eller normaliseras kan bara Airtables egen parser avgöra.|
|**Serversatta och härledda fält**|`EventKey` (formel), `Event-nr` (autoNumber), `Antal anmälda` (rollup), `Månad/år` (härledd singleSelect) föds i basen. En mock kan bara upprepa vad vi redan trodde.|
|**Airtables PATCH-semantik**|Att `null` rensar ett dateTime-fält, att tom multilineText round-trippar till `null`, att ISO-tidsstämplar normaliseras — allt är beteende hos basen.|
|**Opak cursor-paginering**|`offset` är Airtables egen token. Cursor-conformance mot en mock testar vår mock.|
|**Omvända länkar**|Att `Anmälningar (länkat fält)` faktiskt är populerad är en egenskap hos basens schema.|
|**Rate-limit-verkligheten**|Ingen fil asserterar 5 anrop/s explicit, men latensen är verklig: `get-attendance` bär en kommentar om att ~60 ackumulerade sentinel-event à ~750 ms sprängde 30 s-timeouten och tvingade fram signaturfiltrering.|

---

## 5. Rangordnat förslag

Ordningen är vald efter en princip: **mät innan du flyttar, flytta innan du
skalar.** Varje steg är fristående och kan stoppas efter.

### Steg 1 — Mät restrafiken under hermetik-vakt (måste komma först)

Sätt visual-ramens catch-all-vakt på e2e-projektet och kör sviten en gång med
vakten i **rapporterande** läge (logga blockerade anrop i stället för att
avbryta). Utfallet är en exakt lista: vilka tester som redan är hermetiska och
vilka som har restanrop mot staging.

- **Vinst:** noll sekunder direkt. Men det är den enda mätningen som avgör om
  de 410 sekunderna verkligen är flyttbara — den här rapportens siffra bygger
  på att ett test som registrerar en mock är hermetiskt, vilket är en **övre
  gräns**, inte ett bevis.
- **Kostnad:** liten. Vakten finns redan skriven i `hermetic.ts`; det som
  behövs är ett rapporterande läge och en körning.
- **Kräver staging:** ja, en körning. Bör läggas i samma fönster som en
  ordinarie grön körning för att inte stjäla låset.

### Steg 2 — Bryt ut de hermetiska e2e-testerna till ett eget mutexfritt jobb

Flytta de filer som blir rena under vakten till ett `e2e-hermetic`-projekt med
seedad session, pinnat typsnitt och vakten i avbrytande läge. Jobbet får inga
staging-secrets och ingen `concurrency`-grupp.

- **Vinst:** mutex-hållningen går från **9,25 min till cirka 2,4 min** (fast
  uppstart 24 s + API-steget 65 s + de 36 live-testerna 50 s + harness-starter
  och auth-setup). Det är en faktor **3,8** på den resurs som faktiskt är
  knapp. Den totala väggklockan sjunker mindre, eftersom det hermetiska jobbet
  kör parallellt — kritiska vägen blir cirka 6,9 min tills steg 3 är på plats.
- **Kostnad:** måttlig. Testernas fixturer finns redan inline. Arbetet är att
  täcka restanropen från steg 1 och att ersätta `storageState` med den seedade
  sessionen. Uppskattat per fil: litet för de 20 filer som mockar allt, större
  för `event-detail` och `hem` som har blandade tester.
- **Risk:** en fil som flyttas för tidigt blir grön av fel skäl. Vakten i
  avbrytande läge är skyddet — den gör tyst fallthrough omöjlig.

### Steg 3 — Skala det hermetiska jobbet

Först när jobbet är hermetiskt är parallellism gratis: ingen delad bas, ingen
rate-limit, inga kollisioner. Höj `workers` till kärnantalet, och sharda över
flera runners om det behövs.

- **Vinst:** cirka 410 s vid 2 workers → cirka 205 s vid 4 → cirka 105 s vid
  två shards à 4. Kritiska vägen för hela CI-körningen landar då kring
  **2,5–3,5 min**, styrd av staging-jobbet snarare än av e2e.
- **Kostnad:** låg — konfiguration, inte kod. Shardning kräver `blob`-reporter
  och `merge-reports`, vilket är standardvägen.
- **Förbehåll:** projektionen antar linjär skalning i workers. Den antagandet
  är inte verifierat för vår svit och bör mätas i steg 3, inte antas.

### Steg 4 — Städa kvarvarande staging-jobb

Kvar blir API-sviten plus skal-, auth- och PWA-testerna. Överväg om
`mer-index` (10 live-tester, en ren navigationssida utan EF-anrop) och
`shell` (8 tester) hör hemma i den hermetiska mängden — de behöver en session,
inte data.

- **Vinst:** ytterligare cirka 25 s ur mutexen.
- **Kostnad:** liten, men mät först: de saknar mockar i dag av ett skäl som bör
  läsas ur filerna innan de flyttas.

**Vad förslaget uttryckligen inte innehåller:** att flytta någon API-test till
en mock. Se nästa avsnitt.

---

## 6. Var integrationstäckningen måste bevaras

**API-sviten flyttas inte. Punkt.** De 173 testerna kostar 65 sekunder — 11,7 %
av jobbet — och de är hela repots bevis för att Airtable beter sig som koden
tror. Att mocka dem vore att växla in den enda täckning som inte går att
återskapa mot 65 sekunder.

Det gäller även **API-testerna som är klassade LÄS**. En läsning mot en mock
bevisar att vår mock stämmer med vår kod; en läsning mot basen bevisar att
**basen** stämmer med vår kod. Konkreta exempel ur klassningen:

- `get-event` stämmer av appens per-källa-räkningar mot basens **egen formel**
  `Antal anmälda`, och fångar att ett osatt number-fält returneras som
  `{specialValue: "NaN"}`.
- `get-person` och `get-attendance` tvingar chunk-storleken till 2 för att
  bevisa noll trunkering över Airtables formel- och URL-längdstak.
- `get-registrations` bevisar att den omvända länkspegeln faktiskt är
  populerad, och att `Källa` TOM kommer tillbaka som `null` eftersom Airtable
  utelämnar tomma singleSelect-fält.
- `get-waitlist` och `get-leads` bevisar att `createdTime` är record-metadata
  och inte ett sorterbart fält, och att `offset`-cursorn paginerar äkta.

Det är precis den klassen defekter som `docs/reference/data-model.md`
§ Kända fällor samlar, och som ADR-063 gör till kravspec för bas-maximeringen.
Sviten är instrumentet för den leverabeln — den får inte trubbas av.

**Gränsen går alltså vid protokollet, inte vid läs/skriv:**

|Sida|Vad den bevisar|Var den kör|
|---|---|---|
|E2E|Att **appen** renderar och beter sig rätt givet ett svar av rätt form|Hermetiskt, mot fixtur|
|API|Att **staging och Airtable** producerar svar av den formen|Mot staging, bakom mutexen|

Fogen mellan dem är svarsformen, och den fogen är redan bevakad: både
fixturerna och de skarpa svaren parsas av samma zod-scheman i adaptern. Det är
den egenskapen som gör flytten säker — och den får inte tas bort. Om ett
zod-schema och en fixtur någon gång tillåts divergera faller hela argumentet.

**Tre ytor måste dessutom stanna kvar i e2e mot staging**, eftersom de inte
handlar om data utan om gränsen mot omvärlden: `auth-flow` (6 tester, riktig
inloggning och riktiga 401:or), `pwa-offline` (2 tester, service worker mot
verkliga svar) och `css-cascade` (1 test, byggd kaskad). Tillsammans 9 tester,
12 sekunder.

---

## 7. Öppna frågor och mätluckor

1. **Restrafiken per test är inte mätt.** Rapporten skiljer "installerar minst
   en mock" från "installerar inga mockar". Den skiljer **inte** "mockar allt
   sidan anropar" från "mockar det den asserterar på och låter resten gå
   live". Siffran 296 är därför en övre gräns för hur många tester som är
   flyttbara utan arbete. Steg 1 i förslaget stänger luckan.
2. **Per-test-tider saknas helt.** `dot`-reportern skriver dem inte och
   `reportSlowTests`-tröskeln på 300 s släcker även fil-raderna. Att sätta
   `reporter: [['dot'], ['json', { outputFile: … }]]` eller sänka tröskeln
   till 15 s skulle ge per-fil-tider vid nästa gröna körning, till försumbar
   kostnad. Rekommenderas som fristående liten ändring.
3. **Skalar sviten linjärt i workers?** Projektionen i steg 3 antar det. Det är
   inte verifierat, och Playwright-processer per worker har egen minnes- och
   CPU-kostnad på en fyrkärnig runner.
4. **Kötiden under samtidighet är inte mätt här.** De fyra körningarna hade
   28–31 s och köade inte. Den verkliga kostnaden av mutexen visar sig först
   under parallella PR:er, och det måttet finns redan i
   `scripts/ci-metrics.mjs`.
5. **Blir hermetiska tester faktiskt snabbare per test?** Visual-ramen kör 12
   skärmdumpstester på 20 s (~1,7 s/test) mot e2e:s ~1,4 s/test — men
   skärmdumpar är tyngre än DOM-assertions, så talen är inte jämförbara. Om
   restrafiken visar sig liten är hastighetsvinsten per test nära noll, och
   hela vinsten ligger i mutexen och parallellismen. Det påverkar inte
   beslutet, men det påverkar vad man ska förvänta sig.
6. **`save-segment` skapar ostädade rader.** Prefixet
   `app-segment-test+<uuid>` saknar target i `.purge-staging-policy.json`.
   Blockerar ingenting; registreras som tråd-kandidat.
7. **Flakiness kostar också.** Körning 30200699658 hade ett flaky-test; med
   `retries: 2` i CI betalar en flake upp till två omkörningar. Frekvensen
   mäts redan av `ci-metrics.mjs` men är inte inräknad i medelvärdena här.

---

## 8. Källförteckning

**Gröna körningar av `Staging (API + E2E)` (stegtider ur jobb-API:t):**

|Körning|Jobb|Datum|Jobb-total|
|---|---|---|---|
|30201378215|89791814195|2026-07-26 12:05|541 s|
|30163753632|89693227806|2026-07-25 15:30|553 s|
|30203536401|89797585443|2026-07-26 13:11|591 s|
|30200699658|89790053716|2026-07-26 11:44|534 s|

**Referenskörning för den hermetiska formen:** 30081527883
(`visual-baselines.yml`, 2026-07-24 09:09), steg "Generera baselines i
linux-miljön" 20 s, jobb-total 50 s.

**Repofiler lästa:** `playwright.config.ts`, `package.json`,
`.github/workflows/ci-suite.yml`, `.github/workflows/nightly.yml`,
`.purge-staging-policy.json`, `tests/visual/support/hermetic.ts`,
`tests/api/helpers.ts`, samtliga `tests/api/*.staging.test.ts` och
`tests/e2e/*.staging.test.ts`, `src/data/dataSource.ts`,
`src/data/adapters/AirtableAdapter.ts`,
`node_modules/playwright/lib/runner/index.js` (default för
`reportSlowTests`).

**Angränsande passer i samma session:**
[`merge-queue-mot-staging-mutex-2026-07-26.md`](merge-queue-mot-staging-mutex-2026-07-26.md)
och
[`parallell-e2e-mot-delad-backend-2026-07-26.md`](parallell-e2e-mot-delad-backend-2026-07-26.md).
Den senare avslutas med uppmaningen "mät först var de 9,1 minuterna går" — den
här filen är svaret.
