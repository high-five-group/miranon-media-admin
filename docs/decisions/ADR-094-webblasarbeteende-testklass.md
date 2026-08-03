# ADR-094: Webbläsarbeteende — egen testklass för datalösa Playwright-tester

- Status: Accepted (Session 96 — 2026-08-03)
- Datum: 2026-08-03
- Fas: Session 96, T95 Spår A (`TASK-131`)

## Kontext

`TASK-126.2` byggde `InstallPrompt` — en bibliotekskomponent utan
produktspecifik text som detekterar installationsväg (iOS/iPadOS, macOS
Safari, Chromium, redan-installerad) och äger prompt-flödet. PRD `task-126`
§ Testbeslut sa: *"Install-ytans externa beteende (rätt väg per plattform,
prompt-flödet, instruktionens tillstånd) testas i acceptance-skarven —
hermetiskt, utan staging."* 11 tester landade där (PR #628, commit
`5b28b6ca`).

`scripts/hermetik-sjalvtest.mjs` ([ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md)
beslut 3, VILLKOR för acceptance-klassens existens — inte ett tillägg) fällde
alla 11: *"Testet överlever utan fixturens svar och bevisar därför inget om
appens databeteende."* 164 tester passerade i sviten; inget påstående
fallerade — det som fällde var självtestet. Rotorsaken: `InstallPrompt` och
dess hook `useInstallPrompt` har **noll databeteende**. Hooken läser
`navigator.userAgent`/`platform`/`maxTouchPoints`, `matchMedia` och lyssnar på
webbläsar-events (`beforeinstallprompt`, `appinstalled`) — aldrig ett
nätverkssvar. Vakten gjorde exakt vad den ska; placeringen av testerna var
fel, och PRD:ns Testbeslut-rad styrde dit.

Ingen undantagsväg fanns i vakten (ingen scope-config, `.hermetik/` tom) —
och skulle ha varit fel att bygga en heller, se Beslut 3 nedan. Repot saknade
en hemvist för Playwright-tester som prövar **webbläsarbeteende utan
datadimension**: `tests/acceptance/` kräver fixtur-beroende (ADR-080 beslut
3), `tests/e2e/` är staging-bundet, `tests/api/` är API, och `tests/a11y/`
kör visserligen redan fixturfria Playwright-tester (`TASK-126.2`:s egna tre
a11y-beteendetester ligger där och fälls inte av vakten) — men katalogens
namn säger *a11y*, inte *beteende*, och a11y-klassens eget kontrakt
(axe-scan + de beteendekontrakt som hänger direkt ihop med den) är en annan
gräns än den `InstallPrompt`s 11 tester behöver.

Marcus tog beslutet mellan tre alternativ (`TASK-131`):

- **A. Egen, explicit namngiven klass** för datalösa webbläsartester. Vald.
- **B. Undantagslista i vakten** (config-driven, repots egen `.conf`-
  konvention för grindvakter). Förkastad: ADR-080 beslut 3 gör vakten till
  VILLKOR för klassens existens, inte en rekommendation — ett undantag i just
  den vakten är ett undantag i klassens DEFINITION, inte en skalning av dess
  mekanik.
- **C. Skriv om testerna så de konsumerar fixtur-data.** Förkastad: konstlad
  koppling till en Edge Function-yta komponenten inte rör — samma sorts
  dubbelarbete-utan-bevisvärde som redan avvisas i a11y:s egen dokumentation
  (`InstallPrompt.spec.ts`: ingen egen contrast/reduced-motion-sektion,
  eftersom `Button`s redan är bevisad).

## Beslut

### 1. Ny klass: `webblasarbeteende` — egen katalog, eget projekt, eget jobb

`tests/webblasarbeteende/`, Playwright-projektet `webblasarbeteende`, eget
CI-jobb `Webblasarbeteende` i `ci-suite.yml`. Namnet beskriver **vad klassen
prövar** (webbläsarbeteende utan datadimension), inte var den råkar bo — samma
princip ADR-080 beslut 1 slog fast för `acceptance` kontra `e2e`. Kallas den
något annat kommer nästa läsare att tro att den bevisar antingen mer
(ett databeteende) eller mindre (bara tillgänglighet) än den gör.

**Hemvist för termen:** denna ADR plus `CONTRIBUTING.md` § Webbläsarbeteende-
klassen — inte `ORDLISTA.md`, av samma skäl som ADR-080 § Beslut 1 gav
`acceptance`: en testklass är inte ett projektspecifikt domänbegrepp.

### 2. Gränsen är en NY axel, inte en gradering av ADR-080:s

ADR-080 drog gränsen *"kräver ett svar av rätt form (acceptance)"* mot
*"kräver att staging faktiskt producerar det svaret (API-sviten)"*. Denna ADR
drar en gräns **inom** den hermetiska (staging-fria) sidan:

|Klass|Vad den bevisar|Hänger på|
|---|---|---|
|**Acceptance**|Att appen renderar och beter sig rätt GIVET ett svar av rätt form|Fixturvärlden (MSW) — och ett bevis (`hermetik-sjalvtest.mjs`) att den faktiskt hänger på den|
|**Webbläsarbeteende**|Att en komponent detekterar plattform/tillstånd och beter sig rätt givet webbläsar-API:er och -events|Ingenting nätverksburet — per konstruktion, inte av tur|
|**A11y**|Att en yta har 0 axe-violations (WCAG 2.2 AA)|En axe-scan — beteendekontrakt som hänger DIREKT ihop med scanen (roll/namn/tangentbord) delas, men klassens identitet är scanen|

Kriteriet för en ny fil: **har testet ett databeteende att bevisa formen av?**
Ja → acceptance. **Behöver det en axe-scan?** Ja → a11y. Nej på båda →
webblasarbeteende.

### 3. Ingen hermetik-vakt-motsvarighet — och det är motiverat, inte en genväg

`hermetik-sjalvtest.mjs` bevisar att acceptance-klassens tester HÄNGER PÅ
fixturvärlden: normalläget töms, och varje test måste då fällas AV VAKTEN.
Beviset förutsätter att det finns en fixturvärld att ta bort. Webbläsar-
beteende-klassens definierande egenskap är motsatsen — noll nätverksanrop,
per konstruktion — så samma bevisform hade varit teater: det finns inget att
ta bort för att visa att ett test fäller.

Beviset som FINNS i stället, kört skarpt vid detta besluts utförande: en
regression injicerad direkt i `useInstallPrompt.ts` (iOS-detekteringsgrenen
villkorad bort) fällde 2 av 11 tester med rätt felsignatur, reverten gav 11/11
grönt igen. Se `CONTRIBUTING.md` § Webbläsarbeteende-klassen för detaljerna.
`PROJEKT` i `hermetik-sjalvtest.mjs` förblir hårdkodat till `'acceptance'` och
rör aldrig denna klass — oförändrat av detta beslut, precis som Marcus
beordrade.

### 4. App-boot delar fixtur-URL:en med acceptance/visual — som platshållare, inte konsumtion

`src/env.ts` kräver bara ett giltigt URL-format (`z.string().url()`) för
`VITE_SUPABASE_URL`; `AuthProvider.getSession()` läser enbart local storage
vid mount och gör aldrig ett nätverksanrop dit på en fräsch Playwright-sida.
Klassen återanvänder därför samma litterala `visual-fixture`-URL som
acceptance/visual för att appen ska boota, UTAN MSW och utan en fixturvärld
att komponera med — eftersom klassens tester per definition aldrig gör ett
nätverksanrop. Alternativet (a11y:s mönster: riktiga `TEST_SUPABASE_URL`-
secrets) förkastades: det hade gjort klassen secret-beroende och
Dependabot-oåtkomlig för noll vunnen korrekthet, eftersom app-bootens enda
krav är URL-FORMATET.

### 5. CI: blockerande presubmit, inte flyttad till post-merge

Jobbet är villkorslöst i `ci-suite.yml` (ingen `run_x`-input, inget
Dependabot-skip) — precis som `Pure + Build`. Det instansieras därför i ALLA
tre anropar-ytorna (`ci.yml` presubmit, `post-merge.yml`, `nightly.yml`).

**Detta var ett medvetet val, inte en förbisedd fråga.** A11y flyttades ur
presubmit-grinden (`TASK-70.4`/A7:6) på en MÄTT grund: jobbet låg 315 s FÖRE
kritiska vägen (Acceptance), så flytten kostade noll väggklocka och sparade
runner-minuter. Lokala mätningar av webbläsarbeteende-klassen (18,1–29,2 s,
se `CONTRIBUTING.md`) pekar åt samma håll — men de är LOKALA, inte CI-mätta,
och en lokal mätning projicerad till CI är inte en mätning (repots egen regel,
se `CLAUDE.md` § Verifiera med CI:s exakta kommandon). Att flytta en HELT NY
klass till post-merge-only på dag ett, utan den CI-mätning A7:6 faktiskt
gjorde, hade varit att göra halva det arbetet utan halva dess bevis. Klassen
startar därför blockerande, som `Acceptance` gjorde vid sin egen födelse
(`task-59.3`) — en framtida flytt kräver samma mätprocess som `TASK-70.4`,
inte ett antagande härifrån.

## Alternativ som övervägdes

- **B. Undantagslista i `hermetik-sjalvtest.mjs`.** Förkastad, se Kontext.
- **C. Koppla testerna till fixturdata.** Förkastad, se Kontext.
- **Vidga a11y-klassens scope** att även täcka rent beteende utan
  tillgänglighets-koppling. Förkastad: a11y:s identitet är axe-scanen (se
  tabellen i Beslut 2); att lägga generisk plattformsdetektering där hade
  återskapat exakt den namn-mot-substans-glidning ADR-080 varnade för när den
  bytte namn från `e2e` till `acceptance` — nästa läsare tror klassen bevisar
  mer (eller mindre) än den gör.
- **Vitest/jsdom i stället för Playwright.** Förkastad: testerna behöver en
  RIKTIG webbläsarkontext — `page.addInitScript` för att skriva över
  `navigator`-egenskaper FÖRE första navigeringen, riktig
  `dispatchEvent('beforeinstallprompt')` och riktig `matchMedia`. jsdom
  simulerar dessa ofullständigt (samma skäl a11y och acceptance redan är
  Playwright-baserade i stället för Testing Library/jsdom).
- **Lägg testerna i en ny gren av Acceptance-projektet** (samma katalog,
  filter på filnamn). Förkastad: hade krävt att `hermetik-sjalvtest.mjs`
  antingen fällde dem (ursprungsläget, `TASK-131`:s upphov) eller fick ett
  eget undantag (alternativ B) — samma problem i en annan skepnad.

## Konsekvenser

**Positiva:** ADR-080 beslut 3 (vakten som villkor) förblir ORÖRT och
konstitutivt — ingen urholkning, inget undantag. Test-taxonomin får en tredje,
explicit gräns: nästa agent som skriver ett datalöst webbläsartest har en
namngiven hemvist i stället för att gissa mellan acceptance (fel, fälls) och
a11y (fel namn, fel identitet). `TASK-126.3`/`TASK-126.5` (systerskivor på
samma install-yta) ärver hemvisten utan att behöva ompröva den.

**Negativa/skuld:** en TREDJE hermetisk Playwright-klass ökar ytan — tre
dedikerade dev-server-portar (5399, 5499, 5199), tre CI-jobb att hålla reda
på. Kostnaden är liten (jobbet är sekunder, inte minuter) men reell som
onboarding-yta; motmedlet är den explicita beslutsregeln i Beslut 2
(databeteende? → acceptance; axe-scan? → a11y; ingetdera → denna klass), inte
ett hopp om att det ska vara uppenbart. Presubmit-grinden växer med ytterligare
ett jobb tills en framtida, MÄTT card (samma process som `TASK-70.4`) visar
att det är off critical path i CI, inte bara lokalt.

## Uppföljning

- Mät klassens faktiska CI-jobbtid (inte lokal projektion) vid första skarpa
  körningen, och jämför mot `Acceptance` för att avgöra om den ligger på
  kritiska vägen. Flytta INTE till post-merge-only förrän den mätningen finns
  — samma regel som räddade `TASK-70.4` från att gissa.
- `TASK-126.3` (Installera-appen-ytan i Mer-fliken) och `TASK-126.5` (QA på
  riktiga enheter) är systerskivor på samma install-yta; landar de fler
  datalösa webbläsartester hör de hemma här, inte i en fjärde klass.
- Ompröva om a11y:s egna "beteendekontrakt hopkopplade med axe-scanen"-tester
  (t.ex. `InstallPrompt.spec.ts`s tangentbords-/aria-live-tester) någonsin bör
  flytta hit i stället — INTE avgjort av denna ADR. De ligger kvar i a11y
  eftersom de hänger direkt ihop med scanen (samma fil, samma sektion), och
  att flytta dem vore en separat, egen övervägning.

## Relaterat

- [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) — acceptance-
  klassens utbrytning och hermetik-vakten som villkor; denna ADR drar en ny
  gräns INOM samma hermetiska sida, river ingenting av ADR-080:s beslut
- [ADR-045](ADR-045-a11y-runner-arkitektur.md) — a11y-runnerns arkitektur;
  gränsen mot den klassen (Beslut 2, tabellen)
- `TASK-131` — fynd-kortet som avtäckte gapet och Marcus beslut A
- `TASK-126.2` — skivan vars 11 tester flyttades hit
- `TASK-130` — precedentet för "avsikt över bokstav" i hemvist-val (Pure+Build
  som stående hemvist för manifest-/bundle-grindar), samma bedömningsform som
  Beslut 5 ovan tillämpar på "blockerande presubmit tills mätt annat"
