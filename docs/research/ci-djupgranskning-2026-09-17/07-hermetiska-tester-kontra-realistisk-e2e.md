---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J7 — Hermetiska tester kontra realistiska E2E-flöden: hur arbetar vi faktiskt?

> **Proveniens.** Skrivet av en `research-pass`-agent (modell: se § Rapport i
> orkestrerarens slutsammanställning) som ett av flera parallella jobb i
> CI-djupgranskningen, Session 126, 2026-09-17. Arbetskatalog: worktreen
> `s126-ci-djupgranskning`. Uppdragsfilens deklarerade ögonblicksbild är
> `origin/main` vid `eeca8c72` (2026-09-08) — men worktreens faktiska `HEAD`
> vid skrivtillfället är `2f11a443` (2026-09-17, nio dagars ytterligare
> commits, `eeca8c72` bekräftat som förfader via `git merge-base
> --is-ancestor`). Alla testräkningar i denna fil är körda direkt mot DISK i
> denna worktree (`npx playwright test --list`, inga tester exekverade — bara
> statisk uppräkning, se § Metod), inte mot uppdragsfilens sju veckor gamla
> siffror. Denna fil svarar på Jobb 7 (uppdraget rad 273–292), 8.2 (rad
> 308–317), 8.3 (rad 319–328) samt fråga 2 av "de fem viktigaste" (rad 388).
> Riskbedömning av vad som BÖR blockera en merge görs av ett annat jobb i
> granskningen (8.5) — den här filen är faktagrunden och domen över just
> hermetik/E2E-balansen, inte över hela grindlogiken.

## Kort svar

**Delvis.** På ARKITEKTUR-nivå har vi flyttat oss tydligt mot Marcus princip:
sedan `TASK-70.3` (juli 2026) kör INGEN riktig-backend-svit längre på PR eller
i kön — `Staging (API + E2E)` och `A11y` är flyttade till post-merge och natt,
och PR-grinden bärs i dag av tre hermetiska/mutexfria jobb (`Pure + Build`,
`Acceptance (hermetisk)`, `Webblasarbeteende`). Det är exakt Marcus riktning:
"testa det mesta snabbt och isolerat" på den yta som faktiskt grindar en
merge.

Men **den andra halvan av principen — "ett litet antal kritiska flöden genom
den verkliga kedjan" — håller inte i praktiken.** Tre fristående fynd bär den
slutsatsen:

1. **Det finns ingen kuraterad lista över 5–15 kritiska flöden.** Katalogen
   `tests/e2e/` innehåller i dag 34 specfiler (304 tester) — ett historiskt
   sediment av allt som en gång låg i den gamla, odelade e2e-sviten plus vad
   som lagts till sedan, inte ett medvetet urval rankat efter risk.
2. **Filnamnet `*.staging.test.ts` lovar mer än de flesta filerna håller.**
   Av de 34 filerna gör bara **två** ett verkligt, browser-drivet
   skriv-eller-läsanrop mot en riktig Edge Function utan att mocka det:
   `invite-rundtur.staging.test.ts` (hela inbjudningskedjan) och en enskild
   `describe`-grupp i `skapa-event.staging.test.ts` ("SKARPT mot staging").
   **Fem filer** mockar ingenting alls men rör heller aldrig en Edge
   Function — de testar navigering, CSS-lager, PWA-offline och auth-redirect,
   inte dataflöden. De återstående **27 filerna** mockar en varierande andel
   av sitt eget nätverkstrafik (mellan 3 och 33 `page.route`-interceptioner
   per fil) trots att de ligger i "e2e"-katalogen och körs i projektet
   `chromium-authenticated`.
3. **Den hermetiska klassen har vuxit okontrollerat, inte avgränsat.**
   Acceptance-klassen gick från 18 filer/~164 tester (augusti) till **61
   filer / 524 tester** i dag — en tillväxt som redan tvingat fram en
   nödåtgärd: klassen orsakade två verkliga, mätta CI-fällningar
   (`ci-suite.yml:302–351`, PR `#2209`, 2026-09-02) när den växte 98 % på två
   veckor och slog i sitt 12-minuterstak i kön, vilket sparkade PR:en ur
   merge-kön två gånger. Åtgärden blev 3-vägs sharding, inte en gräns för
   klassens storlek.

**Så: principens FORM är på plats (hermetiskt gate:ar, riktigt kör efter), men
dess DISCIPLIN är det inte** — varken i hur få realistiska flöden vi har
(svaret är egentligen "två", inte "5–15") eller i hur få hermetiska tester vi
håller (svaret är "händer utan tak", inte "ett medvetet urval"). Det är inte
en avancerad maskin som motiverar sig själv — men det är heller inte den
plattform Marcus beskrev. Det är en plattform som RÄTT RIKTNING valdes för i
juli, och som sedan dess fått växa utan att någon ägt gränsen.

## Vad jag läste först

`docs/research/` bär redan ett djupt, aktivt underlag för exakt denna fråga —
fem pass, alla från samma linje (S91, 2026-07-23 till 2026-08-05), plus två
syskonfiler i denna granskning:

| Fil | Vad den redan visade | Ålder/status idag |
|---|---|---|
| [`riskanpassad-ci-design-2026-07-23.md`](../riskanpassad-ci-design-2026-07-23.md) | Designen bakom hela riskklassningen (D0/D1/D3), nightly-nätet och merge-dedup — grundstenen för "hermetiskt gate:ar, riktigt kör efter". | Design-dokument, EXEKVERAT sedan dess (våg 2a). Premisserna höll; jag verifierade utfallet mot dagens `ci.yml`/`ci-suite.yml` snarare än att lita på planen. |
| [`hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`](../hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md) | Sex branschledar-repon lästa i källkod (Ghost, Grafana, Supabase, cal.com, PostHog, Playwright). Ingen skriven branschnorm för ANDEL hermetiskt/skarpt finns — kriteriet är kvalitativt (Google: "fast, deterministic, simple dependencies"), inte en kvot. Ghost/Grafana är de enda med exakt vår typ av klassbyte (hermetisk utbrytning ur en tidigare enhetlig e2e-svit). | 7,5 veckor gammal. Slutsatserna om branschmönster är arkitektur-nivå och åldras långsamt — jag har INTE omprövat primärkällorna, men repots EGET utfall (nedan) är nymätt. |
| [`hermetik-matning-steg1-2026-07-26.md`](../hermetik-matning-steg1-2026-07-26.md) | Den ursprungliga mätningen som satte grunden för utbrytningen: av 865 restanrop i den gamla, odelade e2e-sviten gick 86 % till Google Fonts, bara 118 (13,6 %) till riktig staging, koncentrerat till 13 filer. `skapa-event` identifierades redan då som filen som måste förbli skarp. | Mätt på en svit som inte längre finns i sin dåvarande form (32 filer, före utbrytningen). Jag har byggt en NY, likvärdig mätning på dagens 34 e2e-filer (§ Fynd, mock-räkningstabellen) i stället för att extrapolera den gamla. |
| [`acceptance-utbrytningens-utfall-2026-07-28.md`](../acceptance-utbrytningens-utfall-2026-07-28.md) | Utfallsmätning av utbrytningen: mutex-hållningen föll 9,77→6,55 min (−33 %), INTE de projicerade 74 % — avvikelsen förklarades räknebart (fel population användes i projektionen). 18 filer/152 tester flyttade, inte 296 tester som modellen antog. | 7 veckor gammal — talen (152 tester, 18 filer) är den STALA baslinjen dagens `CONTRIBUTING.md` och `scripts/acceptance-urval.sh` fortfarande citerar. Jag har ersatt den med dagens `--list`-mätning (524 tester, 61 filer). |
| [`testklass-namn-och-support-kataloger-2026-08-02.md`](../testklass-namn-och-support-kataloger-2026-08-02.md) | Namnfrågan ("acceptance" kolliderar med ATDD-begreppet) prövad och avgjord: behåll namnet, kostnaden av att byta (~255 förekomster) överväger nyttan. Stödkatalogerna slogs ihop (TASK-123). | Beslutet står; jag har inte ifrågasatt det, det ligger utanför min fråga. |
| [`kallkodsdrivet-testurval-verktyg-2026-07-29.md`](../testurval-kallkodsdrivet-2026-07-29.md) + syskonfilen | Ingen branschledare härleder E2E-testurval ur källkod utan ett byggsystems egen beroendegraf; vår form (Playwright mot en dev-server) bryter importkedjan helt (`--only-changed` mätt oanvändbar: en ändrad routfil gav "0 tester"). Rekommendationen: bygg inte en egen graf, mät miss-raten först. | Slutsatsen är arkitektonisk och håller. Relevant för min "är urvalet motiverat av risk"-fråga: det finns medvetet INGET källkods-baserat urval, bara ett filnamns-baserat (spec-filer). |
| [`underlag/j1a-ci-yml-och-ci-suite.md`](underlag/j1a-ci-yml-och-ci-suite.md) (syskonfil, samma granskning) | Fullständig rad-för-rad-kartläggning av `ci.yml`/`ci-suite.yml` i sin nuvarande form — bekräftar oberoende att `test-staging` och `a11y` ALDRIG körs på PR/kö-ytan. | Skriven samma dag av en parallell agent i samma granskning. Jag har korsverifierat mina egna, oberoende mätningar mot dess kort svar (identisk slutsats) i stället för att kopiera den. |
| [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md) | Orkestreraren har redan spot-checkat "Staging-sviten kör aldrig före merge" mot J1a och funnit det bekräftat. | Bekräftar min egen, oberoende mätning ytterligare en gång (tredje oberoende källan). |

**Vad som var nytt att undersöka:** inget tidigare pass har räknat dagens
FAKTISKA testantal per nivå (alla ovanstående mätningar är 5–8 veckor gamla
och beskriver en svit som sedan dess vuxit 2–4×), och inget tidigare pass har
klassificerat VARJE e2e-fil efter hur mycket den faktiskt mockar eller vilka
verkliga tjänster den passerar. Det är denna fils huvudsakliga bidrag.

Jag sökte `docs/decisions/` brett (`ADR-050`, `ADR-080`, `ADR-094`, `ADR-107`
per uppdraget, plus `ADR-077`) och läste `CONTRIBUTING.md` §§ "Acceptance-
klassen", "Post-merge-lagret", "Webbläsarbeteende-klassen" och "Visuell
regression" i sin helhet. **En rättelse av uppdragets premiss:** `ADR-107`
("Reproducerbarhets-målet — lättviktsvägen före Nix") handlar om Marcus egen
maskinkonfiguration för lokal utveckling (Nix kontra Brewfile) — den har
INGEN koppling till testarkitektur eller hermetik. Jag antar att uppdraget
avsåg en annan ADR eller att referensen är felaktig; jag har inte hittat en
dold koppling.

## Metod

Alla testräkningar nedan är körda av mig 2026-09-17 med
`npx playwright test --project=<namn> --list` (statisk uppräkning — inga
tester exekverade, ingen server startad utöver vad `--list` självt kräver;
`@playwright/test` enligt `package.json`/`package-lock.json` i denna
worktree). Miljövariablerna per projekt är hämtade ur `playwright.config.ts`s
egna `process.env.…`-villkor. Mock-räkningen per e2e-fil är
`grep -c "page.route\|route.fulfill"` per fil — en grov men verifierbar proxy
för "hur mycket nätverk mockas", inte en exakt räkning av unika endpoints.
Flödesklassificeringen (vilka filer gör riktiga anrop) är gjord genom att läsa
källkoden i utvalda filer i sin helhet (`invite-rundtur`, `skapa-event`,
`mark-paid`, de fem mock-fria filerna) och genom riktade `grep`-sökningar mot
resten. En parallell delutredning i samma granskning (§ Vad jag läste först,
sista raden) har läst hermetikvaktens kod och `tests/kontraktsvakt/` i detalj
och rapporterat sina fynd till mig; jag har korsverifierat de bärande
punkterna direkt mot filerna själv (se fotnoter i § Fynd) i stället för att
citera dem oprövat.

## Fynd

### Testpyramiden i tal — dagens fakta, inte augusti månads

| Nivå | Filer | Tester | Miljö | Körs var |
|---|---|---|---|---|
| Gatekeeper-skriptsviter (Node/bash, ej Playwright) | ~75 (`scripts/test-*.sh` 49 + `test-*.mjs` 26) | ej summerat helt; enskilda exempel: `test-review-loop.mjs` 103, `test-review-metrics.mjs` 49, `test-review-risk-sektion.mjs` 47, `test-review-policy.mjs` 46, `test-validera-review-utlatande.mjs` 35, `test-review-backstopp.mjs` 40, `test-backlog-cli.sh` 16, `test-deny-prod-airtable.sh` 20 (`CLAUDE.md` § Review-grinden) | Node/bash, inga externa nätverksanrop | PR (`ci.yml` lint-jobbets steg "Test gatekeeper script suites") |
| `api-pure` | 80 | **1786** | Ren logik, credential-fri, inget nätverk | PR (`Pure + Build`) |
| `acceptance` | 61 | **524** | Hermetisk browser, MSW-mockad backend, egen dev-server :5399 | PR (`Acceptance (hermetisk)`, 1 shard om PR-urval smalnat, annars 3 shards) |
| `acceptance-sjalvtest` | (samma 524, med fixturens svar bortplockade) | 524 (negativ kontroll, inga NYA tester) | samma | PR (`Acceptance — tvåsidigt bevis`) |
| `webblasarbeteende` | 17 | **109** | Hermetisk browser, NOLL nätverksdimension (bara `navigator`/`matchMedia`/DOM-events) | PR (`Webblasarbeteende`) |
| `a11y` | 17 | **118** | Hermetisk browser + axe-scan | **ALDRIG på PR/kö** — bara post-merge + natt |
| `api-staging` | 63 | **529** | Riktig Supabase + riktig Airtable (staging) | **ALDRIG på PR/kö** — `Staging (API + E2E)`-jobbet, post-merge + natt |
| `e2e` (`chromium-authenticated`) | 34 | **304** | Blandat — se tabellen nedan | **ALDRIG på PR/kö** — samma jobb som ovan, efter API-staging |
| `kontraktsvakt` | 1 spec (2 filer räknat av `--list`) | 10 | Läser riktig staging (GET), jämför mot fixturschema | **Bara natt**, icke-blockerande, ingår inte i `ci-suite.yml` |
| `visual` (desktop+mobile) | 29×2 | **322** (161×2) | Hermetisk browser, mockad backend, pixel-diff | **ALDRIG automatiskt** — byggd men PR-grinden medvetet INAKTIV (tråd T87); körs lokalt på begäran eller via `visual-baselines.yml`-dispatch |

Summa distinkta Playwright-testfall (exklusive självtestets omkörning och
visuell, som inte körs automatiskt): **1786+529+524+304+118+109+10 ≈ 3 380**.
Räknar man med acceptance-självtestets 524 omkörningar och visuell blir en
FULL post-merge/natt-körning cirka **4 200** enskilda testfall.

**Var siffrorna i uppdraget kom ifrån, och varför de var fel:** tre separata
platser i repot — `CONTRIBUTING.md:1074`, `scripts/acceptance-urval.sh:12`
och `ADR-080`s ursprungstext — påstår fortfarande att acceptance-klassen har
"18 spec-filer". Det var korrekt när `TASK-75` skrevs (2026-07-29), och det är
mer än **tre gånger fel i dag**. Samma mönster syns i e2e-klassen (ADR-080
nämnde 13–14 skarpa filer vid utbrytningen; disk visar 34 i dag) och i
webbläsarbeteende-klassen (ADR-094 dokumenterade 11 tester i 1 fil; disk
visar 109 tester i 17 filer). **Detta är inte tre isolerade skrivfel — det är
ETT mönster: varje testklass som infördes med en specifik, korrekt uppmätt
siffra har vuxit organiskt sedan dess, och ingen styrande text har hållit
jämna steg.** Det är samma klass av drift `CLAUDE.md` självt varnar för under
ADR-083 ("prosa som påstår en mekanism") — fast här gäller det volymtal,
inte mekanismer.

### CI-koppling — vilka nivåer körs var

Hela bilden bekräftas oberoende av tre källor i denna granskning (min egen
läsning av `ci.yml`/`ci-suite.yml`, syskonfilen
[`underlag/j1a-ci-yml-och-ci-suite.md`](underlag/j1a-ci-yml-och-ci-suite.md),
och orkestrerarens eget stickprov
[`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md)):

| Nivå | PR | Kö (`merge_group`) | Post-merge | Natt | Aldrig automatiskt |
|---|---|---|---|---|---|
| Gatekeeper-skriptsviter | ✔ | ✔ (samma jobb) | — | — | — |
| `api-pure` (Pure + Build) | ✔ | ✔ | ✔ | ✔ | — |
| `acceptance` | ✔ (urval eller full klass) | ✔ | ✔ (full klass, 3 shards) | ✔ (full klass, 3 shards) | — |
| `webblasarbeteende` | ✔ | ✔ | ✔ | ✔ | — |
| `a11y` | — | — | ✔ | ✔ | — |
| `api-staging` | — | — | ✔ | ✔ | — |
| `e2e` (chromium-authenticated) | — | — | ✔ | ✔ | — |
| `kontraktsvakt` | — | — | — | ✔ | — |
| `visual` | — | — | — | — | ✔ (byggd, gate inaktiv) |
| review-backstopp | — | ✔ | — | — | — |

Källan är `ci.yml:2271` (`run_staging: false` och `run_a11y: false`,
VILLKORSLÖST — kommentaren där är >80 rader lång och förklarar exakt varför,
med tre mätta run-jämförelser: en ensam PR gick 7,8 min mot 20,3 min när
staging fick köa bakom en annan körning, hela skillnaden var kötid). Samma
mekanism gäller på `merge_group`-ytan: `ci.yml` anropar `ci-suite.yml` med
samma `with:`-block oavsett om triggern är `pull_request` eller
`merge_group`, så kön ärver exakt samma uteslutning. `post-merge.yml` och
`nightly.yml` skickar INGA inputs alls och får därför `ci-suite.yml`s
defaulter (`true` för allt) — vilket är den enda platsen full bredd faktiskt
körs.

**Konsekvensen, sagd rakt ut (samma formulering som `CONTRIBUTING.md` §
Post-merge-lagret): en kod-PR kan landa på `main` utan att staging, riktig
Airtable, riktig Supabase-auth eller a11y-scan någonsin körts mot dess
innehåll.** Det är en medveten avvägning, inte ett hål — revert-vägen och
post-merge-larmkedjan (automatiskt GitHub-ärende, attribution, `ci-natt`/
`ci-post-merge`-etiketter) är byggda för att bära den risken, och är mätt och
övade. Men det betyder att SVARET på uppdragets fråga "körs testet på varje
PR för att det behövs eller bara för att det råkar vara möjligt" (8.4, ej min
delfråga men gränsande till min) redan är avgjort åt "det körs INTE på PR" —
vilket är precis Marcus riktning, applicerad hela vägen.

### Jobb 7 — frågorna, en i taget

**Är det så vi faktiskt arbetar i dag?**
Delvis, se § Kort svar. Arkitekturen (PR gate:as av hermetiskt, riktigt körs
efter) matchar principen. Urvalet av VILKA flöden som är "de kritiska" gör
det inte — det är historiskt ärvt, inte riskrankat, och den hermetiska sidan
saknar ett tak.

**Hur många tester finns på varje nivå?**
Se tabellen ovan — 3 380 distinkta Playwright-testfall plus ~75
skriptsviter, mot uppdragets sju veckor gamla underliggande antaganden
(baserade på "152 hermetiska / 181 e2e"-nivån från augusti).

**Vilka verkliga kedjor täcker E2E-testerna?**
Detta är passets skarpaste fynd. Av de 34 filerna i `chromium-authenticated`:

| Grupp | Antal filer | Beskrivning |
|---|---|---|
| **Helt real, browserdriven Edge Function-kedja** | **2** | `invite-rundtur.staging.test.ts` (invite-user → GoTrue-redirect → /valkommen → /login → /hem,äkta lösenordssättning och inloggning, äkta radering efteråt) och EN `describe`-grupp i `skapa-event.staging.test.ts` ("SKARPT mot staging" — formuläret skickas genom riktig UI och skapar ett riktigt event i Airtable via `create-event`, ingen `page.route` på den vägen) |
| **Noll mock, men rör aldrig en Edge Function** | **5** | `auth-flow`, `css-cascade`, `pwa-offline`, `shell` — testar redirect-logik, CSS-lagerordning, offline-cache och navigations-skal. Verifierat: `grep -oE "functions/v1/[a-z-]+"` gav NOLL träffar i alla fyra. (`invite-rundtur` räknas i gruppen ovan, inte här, trots att den också saknar `page.route`.) |
| **Delvis mockade** | **27** | Mockar mellan 3 och 33 egna `page.route`/`route.fulfill`-anrop (median ~10). Ytterlighetsfallet är `event-detail.staging.test.ts` med 33 mock-interceptioner — mer mockat nätverk än någon acceptance-fil behöver vara i en klass som per definition ska vara den "skarpa" motparten. |

Ingen av de 27 delvis mockade filerna gick att verifiera i sin HELHET inom
denna delutrednings tidsbudget (34 filer, flera hundra rader var); mock-
räkningen (`grep -c`) är en STARKT INDIKERANDE proxy, inte en fullständig
klassificering rad för rad av varje enskild fils återstående verkliga anrop.
En parallell delutredning i samma granskning gör en fullständig
per-fil-genomgång av vilka riktiga tjänster (Supabase/Airtable/Resend/
DocRaptor) varje fil passerar — se den filens tabell för den detaljerade
matchningen mellan fil och tjänst.

**Är antalet och urvalet motiverat av risk?**
Nej, inte påvisbart. Det finns inget dokument, kommentar eller
commit-meddelande som säger "dessa N flöden valdes för att de är repots
högst-risk-skrivvägar". Filerna i `tests/e2e/` är i stället det som blev
kvar efter en historisk utbrytning (juli 2026, se § Vad jag läste först) plus
vad som lagts till sedan när en ny funktion råkade byggas med ett riktigt
staging-beroende (`invite-rundtur` är ett sådant exempel — den byggdes för
att `TASK-127.9` explicit krävde ett bevisat, äkta flöde, inte för att någon
rankade om invite-flödet var repots högsta risk).

**Går för många tester mot riktiga tjänster?**
Nej — om något är problemet det omvända på PR-nivå (nästan inga gör det,
eftersom staging är helt borttagen ur PR-grinden) och ETT problem till på
post-merge-nivå: flera av de 27 "delvis mockade" filerna mockar SÅ mycket av
sitt eget nätverk (upp mot 33 interceptioner i en enda fil) att den marginella
skillnaden mot att köra dem hermetiskt i `acceptance`-klassen är liten, medan
de ändå betalar `test-staging`-jobbets städ-, purge- och mutex-kostnad. Det är
precis den situation `hermetik-matning-steg1-2026-07-26.md` identifierade för
den GAMLA sviten (86 % av restrafiken var Google Fonts, inte riktig data) —
och mönstret verkar ha återuppstått i den nya, mindre e2e-katalogen.

**Ger hermetiska tester falsk trygghet?**
Ja, på tre konkreta, källbelagda sätt:

1. **En "hermetisk" acceptance-fil kan i praktiken bero på väggklockan.**
   `tests/acceptance/hem.acceptance.test.ts:281` anropar
   `await page.clock.install();` UTAN ett `time`-argument. Playwrights egen
   typdeklaration säger att detta initierar klockan till *"current system
   time"* — inte till fixturvärldens frusna `FROZEN_NOW`
   (`tests/support/fixturvarld/fixture-data.ts:22`,
   `2026-09-15T10:00:00+02:00`). Fixtursessionens JWT sätts till
   `FROZEN_NOW + 24h` (`hermetic.ts:83`) = **2026-09-16T08:00:00Z** — exakt
   den tidsstämpel en samtidig delutredning (S125) rapporterar som starten
   på en pågående CI-fällning i acceptance shard 2. Supabase-klientens egen
   kod (`node_modules/@supabase/auth-js/…/GoTrueClient.js:4108-4109`)
   triggar automatiskt en refresh-POST när sessionen ser utgången ut — ett
   anrop `handlers.ts` inte mockar. **Märkning: VERIFIERAD — körd live under
   detta pass, 2026-09-17T10:06Z, inte bara spårad i källkod.** Kommando:
   `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance
   tests/acceptance/hem.acceptance.test.ts -g "refetchInterval"`. Utfall:
   **testet fallerar**, med exakt den förutspådda mekanismen:

   ```text
   OmockadRequestError: Hermetik-vakten stoppade ett omockat anrop i fixturvärlden.

     POST https://visual-fixture.supabase.co/auth/v1/token?grant_type=refresh_token
   ```

   Supabase-klienten läste den nu-förfallna, felfrusna klockan, bedömde
   sessionen utgången och försökte på eget initiativ förnya token mot
   fixturens platshållar-URL — hermetik-vakten fångade det korrekt och fällde
   testet i stället för att låta anropet läcka ut på det riktiga nätet.
   Sökning bekräftar att mönstret är **isolerat till denna enda fil**
   (`grep -rn "page.clock.install()" tests/acceptance/` gav bara
   `hem.acceptance.test.ts:281`) — inte ett systemiskt problem, men ett
   **aktivt, pågående, mätt fel** i det ögonblick denna rapport skrivs, och
   det kommer förbli rött i varje framtida körning tills det rättas (rad
   1281 → `page.clock.install({ time: FROZEN_NOW })`, samma form som redan
   används korrekt på tre andra ställen i sviten, t.ex.
   `event-checkin-dorrlistan.acceptance.test.ts:212`). Poängen för "falsk
   trygghet": en testklass vars HELA existensberättigande är att vara
   oberoende av väggklockan (`ADR-080`) hade en levande, reproducerbar läcka
   av precis den variabeln — och det gick att bevisa på under en minut genom
   att faktiskt köra testet, snarare än att bara läsa koden.
2. **11 av 18 mockade Edge-Function-svar i acceptance-klassens fixturvärld
   har ingen mekanism som binder dem mot verkligheten.** `tests/kontraktsvakt/`
   jämför bara **7** endpoints (`get-events`, `get-registrations`,
   `get-event-notes`, `get-event`, `get-event-formats`, `get-persons`,
   `get-person`) mot riktig staging, nattligt. De 11 obundna:
   `get-event-attachments`, `get-attendance`, `hamta-oppna-betalningar`,
   `get-places`, `get-person-notes`, `get-activity-log`, `log-activity`,
   `get-waitlist`, `get-leads`, `get-mail-log`, `get-segments`
   (`tests/support/fixturvarld/handlers.ts`, verifierat genom att räkna
   registrerade `EF(...)`-handlers och jämföra mot `kontraktsvakt/
   kontraktsfall.ts`s lista). Varje ändring av en av dessa 11 Edge Functions
   kan glida ifrån fixturens antagande om dess svarsform utan att NÅGON
   mekanism upptäcker det — exakt den tysta driftklass `ADR-080` § 3 själv
   varnar för.
3. **Supabase Realtime/WebSocket-mockningen är strukturellt trasig** (fynd
   från en samtidig delutredning i denna granskning, verifierat av mig
   direkt mot koden: `hermetic.ts:377` registrerar WebSocket-vakten SIST i
   handler-listan, vilket enligt
   [`supabase-realtime-hermetisk-mock-2026-09-06.md`](../supabase-realtime-hermetisk-mock-2026-09-06.md)
   stänger vägen för att någon WS-mock ska hinna svara). Konsekvensen:
   betalningsinkorgens Realtime-beroende funktionalitet är avstängd i
   acceptance-klassen (`VITE_FEATURE_BETALNINGAR: 'av'` i fixturvärlden) —
   dess ENDA testtäckning är de sju `betalningar-inkorg-*.staging.test.ts`-
   filerna i e2e-klassen, som i sin tur (se tabellen ovan) mockar 8–22 av
   sina egna anrop. Ett fel i själva Realtime-uppdateringen skulle alltså
   kunna slinka igenom BÅDA nivåerna samtidigt.

**Finns kritiska flöden som inte verifieras realistiskt?**
Ja, ett konkret antal, funna genom att korsa `docs/reference/
airtable-interaction.md`s write-kontrakt (§7, 13 `update-record`-operationer)
och `supabase/functions/`s fullständiga lista (63 Edge Functions — rättat i
våg 2, KG2, 2026-09-17: stod som "51" här, samma felräkning som § Källor
nedan; ingen av de namngivna funktionerna i tabellen nedan påverkas, se
rättelsen där) mot `tests/e2e/`s innehåll:

| Skrivande flöde | Edge Function(er) | Realistisk E2E (browser + riktig backend)? | Vad som FINNS i stället |
|---|---|---|---|
| Avbokning | `cancel-registration` | **Nej** — noll träffar i `tests/e2e/` | Real API-kontraktstest (`tests/api/cancel-registration.staging.test.ts`) + hermetisk UI-täckning i acceptance |
| Ombokning | `rebook-registration` | **Nej** — noll träffar i `tests/e2e/` | Samma mönster: `tests/api/rebook-registration.staging.test.ts` (real, API-nivå) |
| PDF-bilagor (dokumentgenerering) | `generate-event-attachment` | **Nej** — noll träffar i `tests/e2e/` | `tests/api/generate-event-attachment.staging.test.ts` (real, API-nivå) |
| Betalningsregistrering (klassiskt Airtable-fält) | `update-record` med `mark-registration-fee-paid`/`mark-final-payment-paid` | **Nej UI-driven** — och **ingen träff i `src/` överhuvudtaget** (`grep -rl` gav noll filer) | Real API-kontraktstest i `tests/api/update-record.staging.test.ts` (muterar + återställer). **Öppen fråga, ej fullt utredd här:** operationerna kan vara legacy — appens faktiska betalningsflöde tycks ha flyttat till en Postgres-baserad ledger (`hantera-inbetalning`/`registrera-inbetalning`, se nedan). Om så: dessa två API-tester bevakar ett skriv-kontrakt UI:t inte längre anropar. |
| Betalningsregistrering (nyare Postgres-väg) | `hantera-inbetalning`, `registrera-inbetalning` | **Delvis** — 10 e2e-filer refererar dem (`betalningar-inkorg-*`, `bekraftelsesteget*`), men dessa filer mockar 8–22 egna anrop var; hur stor andel av just BETALNINGS-skrivningen som är riktig kontra mockad i varje fil är inte verifierat i denna delutrednings tidsbudget | — |
| Inbjudan (UI-flöde) | `invite-user` | **Ja — gold standard** | `invite-rundtur.staging.test.ts`, hela kedjan real |
| Kvitto-utskick/omutskick | `send-receipt-email`, `skicka-kvitto-igen`, `koa-kvitton` | **Delvis** — refereras i `betalningar-inkorg-utskicksflode.staging.test.ts` (22 mocks) och `betalningar-inkorg-kvitto-att-skicka-durabelt.staging.test.ts` (14 mocks); realism av just kvitto-anropet i dessa filer overifierad | — |
| Per-registrering-mail (bekräftelse/påminnelse/fritt/testutskick) | `send-action-email` | **NEJ — NOLL, på ALLA nivåer, verifierat uttömmande.** Jag korsreferererade samtliga ~40 distinkta Edge-funktionsnamn som mockas i `tests/acceptance/` mot varenda fil under `tests/api/*.staging.test.ts` (`grep -rl "$ef" tests/api/*.staging.test.ts` per namn, 2026-09-17); `send-action-email` är den ENDA som gav noll träffar. Den saknas dessutom i kontraktsvaktens 7-lista, och varje `tests/e2e/`-fil som refererar den mockar den explicit (`atgarder-bekraftelsemail.staging.test.ts:110`, `atgarder-testmail.staging.test.ts`, `atgarder-paminnelse-eventinfo-fritt.staging.test.ts`). Den enda "riktiga"-klingande motparten, `tests/api/send-action-email.test.ts`, är själv **api-pure** — dess EGEN kommentar (rad 3) säger *"ren logik, ingen staging, inga creds, NOLL riktig Resend/Airtable"*. Skarpast belagda enskilda lucka i hela detta pass. | Tre oberoende, samstämmiga MOCKAR (acceptance, e2e, api-pure) som aldrig jämförts mot en riktig tjänst |

**Sidofynd, korroborerat av repots eget backlog (upptäckt vid en
tilläggsgranskning av denna tabell, ej tidigare känt förrän kortet lästes):**
`backlog/tasks/task-441` (skapat 2026-09-08, status "To Do", nio dagar
gammalt och olöst vid granskningstillfället) bekräftar självständigt en
SKARPARE, snävare version av `registrera-inbetalning`-raden ovan: en
review-agent på en oberoende PR (#2459) fann att
`supabase/functions/registrera-inbetalning`s aktivitetslogg-payload aldrig
har ett serversidigt test som bevisar att en fritext-notering INTE läcker in
i loggen — klientsidans motsvarande garanti är testad
(`tests/acceptance/atgarder-betalningsnotering-logg.acceptance.test.ts`),
men serversidan är obevakad. Kortet bokför luckan som "pre-existerande, inte
införd av" den granskade PR:en. Det är en ANNAN agent i repot (utanför denna
granskning) som redan självständigt flaggat samma strukturella klass av gap
som `registrera-inbetalning`-raden ovan pekar ut, och den var vid
läsningstillfället fortfarande öppen och olöst.

**Testas samma beteende redundant på flera nivåer?**
Delvis ja, men på ett sätt som inte alltid är slöseri. `mark-paid.staging.test.ts`
är det tydligaste exemplet: filen ligger i `tests/e2e/`, körs i projektet
`chromium-authenticated`, och är **helt mockad** — `page.route` på
`get-event`, `get-registrations`, `update-record`, `hamta-oppna-betalningar`
och `hamta-inbetalningar`. Filens EGEN docblock säger det rakt ut: *"SERVER-
write-kontraktet prövas mot skarp staging i
`tests/api/update-record.staging.test.ts`; dessa e2e bevisar klientens form
och beteende flak-fritt utan att mutera delad staging-data."* Det är en
MEDVETEN, dokumenterad tvådelning (UI-form hermetiskt, skriv-kontrakt på
API-nivå) — INTE en blind dubblering. Problemet är strukturellt, inte
innehållsligt: filen skulle lika gärna (arkitektoniskt sett) kunna ligga i
`tests/acceptance/` — dess placering i `tests/e2e/` ger en falsk signal om
att den bidrar till "realistisk E2E-täckning" när den räknas i den kolumnen.
Samma mönster gäller sannolikt flera av de 27 "delvis mockade" filerna (se
ovan) men är inte verifierat rad för rad för var och en.

**Ett andra par är en ÄKTA dubblering, inte bara en strukturell
tvådelning** — `tests/acceptance/atgarder-bekraftelsemail-send.acceptance.
test.ts:61` och `tests/e2e/atgarder-bekraftelsemail.staging.test.ts:154` har
BÅDA ett `describe`-block som ordagrant heter **"Skicka bekräftelsemail —
verklig sändväg"** (e2e-filen: "... mot send-action-email"), och båda testar
samma delutfalls-scenario ("en lyckad, en redan bekräftad, fallna kvar
markerade"). Skillnaden mot `mark-paid` ovan: här finns INGEN kommentar som
delar ansvaret mellan nivåerna — tvärtom hänvisar acceptance-filens egen
kommentar (rad 18) till `tests/api/send-action-email.test.ts` som om DEN
filen bevisade "den verkliga sändvägen". Den är api-**pure** (se föregående
tabells rad om `send-action-email` — noll riktig Resend/Airtable). Så ingen
av de tre filer i hela sviten som använder ordet "verklig"/"skarp" om detta
flöde gör faktiskt ett nätverksanrop till Resend. Tas e2e-versionen bort
förloras noll unik information; namnen i alla tre filer bör skrivas om så de
inte lovar en verklighet ingen av dem har.

### 8.2 — Testnivåerna

**Vad testar `Pure + Build` (`api-pure`, 1786 tester) som lint/TypeScript
inte redan gör?** Skillnaden är statisk kontroll kontra KÖRD verifiering av
beteende. TypeScript verifierar att typerna stämmer ihop; Biome verifierar
stil. Ingetdera exekverar koden och kontrollerar UTFALL. `api-pure` kör
faktisk logik — exempel: `tests/api/bankimport-parser.test.ts` (parsar en
verklig bankfil-rad till rätt belopp), `tests/api/airtable-retry.test.ts`
(verifierar att en retry faktiskt backar av med rätt intervall vid 429/5xx),
`tests/api/betalningsharledning.test.ts` (verifierar att en härledd summa
faktiskt blir rätt tal). Detta är den lager-oberoende regel `CLAUDE.md`
skriver in som princip ("datalagret nås endast via sin adapter") gjord
mätbar: TypeScript kan inte se att en funktion RÄKNAR fel, bara att den
returnerar rätt TYP.

**Vad täcker hermetisk acceptance (524 tester)?** Att APPEN renderar och
beter sig rätt givet ett svar av given FORM — UI-logik, tillståndshantering,
tillgänglighet inom komponenten, felvägar. Uttryckligen INTE att staging
eller Airtable faktiskt producerar den formen (`ADR-080`, citerat i
`CONTRIBUTING.md` § Acceptance-klassen). Fogen mellan denna nivå och
verkligheten är enbart zod-schemat — och det schemat är, som ovan visat,
bara bevakat mot verkligheten för 7 av 18 mockade endpoints.

**Vad täcker staging-E2E som hermetiskt INTE kan täcka?** I teorin: att en
riktig webbläsare, en riktig GoTrue-session, en riktig Edge Function och en
riktig Airtable-bas faktiskt hänger ihop — CORS-huvuden, serialisering,
auth-refresh, faktisk latens, Airtables verkliga formel-/filterbeteende. I
PRAKTIKEN, mätt ovan: bara 2 av 34 filer levererar detta fullt ut. Resten
levererar en delmängd av det (allt från "browsermekanik utan backend alls"
till "nästan helt mockat backend i en fil som ändå betalar mutex-priset").

**Dubbleringar identifierade:** se § "Testas samma beteende redundant"
ovan — `mark-paid.staging.test.ts` är den tydligast bevisade instansen; ett
strukturellt mönster (fler av de 27 delvis mockade filerna) är sannolikt men
inte fullt kartlagt här.

**Är gränsen tydlig mellan enhet/integration/acceptance/E2E?** Nej, inte
alltid — två konkreta exempel:

- `InstallPrompt`s 11 tester låg felaktigt i `acceptance` tills
  `hermetik-sjalvtest.mjs` bevisade att de klarade sig UTAN fixturens svar
  (noll databeteende — bara `navigator`/`matchMedia`/webbläsarevents).
  Lösningen blev en helt ny klass (`webblasarbeteende`, `ADR-094`) snarare än
  ett undantag i vakten. Gränsdragningsfrågan (`har detta test ett
  databeteende att bevisa formen av, eller bara ett plattforms-API att
  reagera på?`) är inte alltid uppenbar i förväg — den upptäcktes genom att
  vakten FÄLLDE, inte genom omdöme i förhand.
- `tests/kontraktsvakt/` passar inte i den klassiska fyrdelningen alls: den
  är varken ren enhetstestning (anropar en LEVANDE Edge Function), ren
  integrationstestning (jämför bara svarsFORM, aldrig appens beteende), ren
  acceptance (kör aldrig UI:t) eller klassisk E2E (går aldrig via
  webbläsaren). Den är en femte, egen kategori — kontraktstest — som
  uppdraget inte explicit efterfrågar en plats för men som bär hela svaret på
  8.3s sista fråga.

**Vilken unik information ger varje nivå — och svaret på "de fem
viktigaste" fråga 2 (rad 388):**

| Nivå | Unik information den ger | Vad den INTE kan ge |
|---|---|---|
| `api-pure` | Att ren logik (parsning, härledning, retry-beräkning) ger rätt UTFALL | Om appen renderar rätt; om backend finns |
| `acceptance` (hermetisk) | Att appen renderar och beter sig rätt GIVET en viss svarsform; snabb, deterministisk, parallelliserbar | Att staging/Airtable FAKTISKT producerar den formen; att en riktig auth-session, riktiga CORS-huvuden eller riktig latens fungerar |
| `webblasarbeteende` | Att en komponent detekterar plattform/tillstånd rätt via webbläsar-API:er, helt utan nätverksdimension | Något om nätverk över huvud taget |
| `api-staging` | Att en Edge Function-kedja faktiskt fungerar mot RIKTIG Airtable/Postgres — rätt statuskod, rätt skrivning, rätt avvisning | Att FRONTEND faktiskt anropar den korrekt, eller att en användare kan slutföra flödet i en webbläsare |
| `e2e` (de 2 verkligt realistiska filerna) | Att HELA kedjan — webbläsare → riktig auth → riktig Edge Function → riktig Airtable/Postgres — faktiskt hänger ihop, den ENDA nivån som kan visa detta | Bredd — för dyrt och för skört för mer än ett fåtal flöden |
| `kontraktsvakt` | Att fixturens ANTAGNA svarsform fortfarande matchar den riktiga Edge Functionens FAKTISKA svarsform, för 7 av 18 mockade endpoints | Beteende — den kör aldrig appen, bara ett rått HTTP-anrop |
| `visual` | Pixel-exakt regression i sex facit-tunga vyer | Allt annat — och den körs i dag inte automatiskt alls |

**Svaret på fråga 2, kort:** hermetisk acceptance ger information om APPENS
EGET beteende given en form; staging-E2E ger information om att KEDJAN
hänger ihop. De är inte utbytbara — men i dag ger BARA två av 34 e2e-filer
den andra sortens information överhuvudtaget, medan uppdragets tumregel ("om
två nivåer i praktiken ger samma svar finns sannolikt en dubblering") slår
till på minst en verifierad fil (`mark-paid`) och sannolikt fler.

### 8.3 — Den hermetiska miljön

**Är den verkligen isolerad från externa tjänster?** Mekanismen (verifierad
av mig och en parallell delutredning oberoende, samma slutsats): MSW (Mock
Service Worker) registrerat på Playwright-CONTEXT-nivå i
`tests/support/fixturvarld/hermetic.ts`, med en vakt
(`hermetik-vakt.ts`) som kastar `OmockadRequestError` för varje anrop till
något annat än `localhost`/`127.0.0.1`. Vakten är AVBRYTANDE (fäller
testet), inte tyst — en fil som flyttats till acceptance-klassen för tidigt
blir röd, inte grön av fel skäl. Det är en robust mekanism i sig. Men "isolerad
från externa tjänster" är inte samma sak som "isolerad från verkligheten" —
FROZEN_NOW-fyndet ovan visar exakt hur en till synes hermetisk miljö ändå kan
läcka in en extern, orörlig variabel (väggklockan) genom ett API-anrop
(`page.clock.install()`) som ser lokalt ut men beter sig som en global
klocka.

**Startar varje test med ett känt dataläge?** Ja — MSW-handlers är
test-scopade (ingen delad state mellan tester, verifierat: `network`-
fixturen instansieras per test), och `tests/global-setup.ts` rör bara en
mätartefakt (hermetik-rapportens JSONL), aldrig testdata.

**Kan testerna köras i valfri ordning?** Ingen `test.describe.serial`
hittades i acceptance-katalogen vid en riktad sökning, och Playwrights
default (`fullyParallel: false` om inget annat sätts — inget `workers:`- eller
`fullyParallel:`-block hittades för `acceptance`-projektet i
`playwright.config.ts`) serialiserar bara INOM en fil, aldrig mellan filer.
**En viktig avgränsning:** jag har inte kört sviten i slumpad ordning för att
skarpt bevisa frånvaro av dold ordningsberoende — detta är en kodläsning, inte
ett körd experiment.

**Kan flera tester köras parallellt utan att påverka varandra?** Ja, med en
mätt kvalificering: CI sharadar den fulla klassen i 3 delar på fil-gränser
(`ci-suite.yml:372`, `Playwright`s egen `createTestGroups`, ingen fil delas
mellan shards). Talet 3 är en marginalberäkning (461 s/3 ≈ 154 s
testtid/shard mot ett 12-minuterstak), satt EFTER att klassen redan en gång
växt sig för stor för en enda shard och orsakat två `cancelled`-fällningar
i kön (`ci-suite.yml:302–332`, PR `#2209`, 2026-09-02, mätt: 233→461 tester
på två veckor, +98 %). Klassen har sedan dess vuxit YTTERLIGARE, till 524
tester — om 3-shardsvärdet fortfarande ger tillräcklig marginal är INTE
omprövat i detta pass eller (såvitt jag kan se i skarpa körningsloggar) sedan
sharding infördes.

**Används mocks, emulatorer eller tillfälliga databaser?** Enbart mocks
(MSW), ingen emulator, ingen tillfällig databas. Supabase Auth ersätts av en
handskriven JWT direkt i `localStorage` (ingen nätverksvalidering — vilket är
själva orsaken till att FROZEN_NOW-läckan kan uppstå). Airtable konsumeras
aldrig direkt av frontend, så den nivån är inte relevant här. Resend/mail och
DocRaptor/PDF har INGEN mock i `handlers.ts` — träffar något acceptance-test
en sådan väg på riktigt skulle det falla på `OmockadRequestError` (jag har
inte sökt igenom samtliga 61 filer för att bekräfta om något faktiskt gör
det).

**Hur vet vi att simuleringen fortfarande motsvarar de riktiga tjänsterna? —
uppdragets "särskilt viktiga" fråga.** Svaret är: **för en tredjedel av
ytan, mekaniskt; för resten, inte alls.** `tests/kontraktsvakt/` kör
nattligt, läsande (GET, ingen mutex), och jämför FIXTURENS svar och det
RIKTIGA svaret genom SAMMA zod-schema för **7 av 18** mockade
endpoints (`get-events`, `get-registrations`, `get-event-notes`, `get-event`,
`get-event-formats`, `get-persons`, `get-person`) plus 2 "felkontrakt"
(avvisningsform, statuskod). De **11 obundna mockarna** (lista ovan under
"Ger hermetiska tester falsk trygghet", punkt 2) har ingen motsvarande vakt —
`handlers.ts` egen kommentar vid en av dem (`hamta-oppna-betalningar`) säger
uttryckligen "RUNTIME-beteendet är overifierat i denna PR" och "ANVÄNDS INTE
ÄNNU AV NÅGOT ACCEPTANCE-TEST". Och kontraktsvakten själv fångar bara
FORM-drift (ett fält byter typ eller försvinner) — den fångar per
konstruktion inte VÄRDE-drift (fältet finns, betydelsen har ändrats) eller
att SCHEMAT SJÄLVT glidit i samma commit som funktionen (Googles "there is no
signal"-observation, citerad redan i
[`hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`](../hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md)
§2).

## Osäkerheter och vad jag inte kunde belägga

- ~~FROZEN_NOW-fyndet är starkt indikerat, inte verifierat genom en faktisk
  röd testkörning~~ — **UPPDATERAT, LÖST UNDER SAMMA PASS:** testet kördes
  live 2026-09-17T10:06Z och fallerade med exakt den förutspådda mekanismen
  (`OmockadRequestError` mot `visual-fixture.supabase.co/auth/v1/token`). Se
  § Jobb 7, "Ger hermetiska tester falsk trygghet?" punkt 1, för kommando och
  full utskrift. Kvarstående, mindre osäkerhet: jag har INTE läst senaste
  CI-loggen för acceptance shard 2 för att bekräfta att produktionskörningen
  fälls av SAMMA test (bara att den lokala reproduktionen fäller det testet
  detta pass identifierade som mekanismen).
- **De 27 "delvis mockade" e2e-filerna är klassificerade genom en
  `grep`-räkning av `page.route`-anrop, inte genom en fullständig läsning av
  var och en.** Jag har läst en (`mark-paid`, helt mockad trots
  filnamnet) i sin helhet och gjort riktade funktionsnamns-sökningar mot
  resten, men en systematisk, rad-för-rad-genomgång av alla 27 (vilken
  specifik del av varje fil som är riktig kontra mockad) är inte gjord här.
  En parallell delutredning i samma granskning gör exakt detta; dess tabell
  bör läsas tillsammans med denna fil.
- **Om `mark-registration-fee-paid`/`mark-final-payment-paid` är levande
  eller legacy är inte avgjort.** Noll träffar i `src/` betyder att INGEN
  frontend-kod i dag anropar dessa två `update-record`-operationer — men jag
  har inte uteslutit att de triggas från en Airtable-vy/knapp eller
  automation utanför appen. Om de är legacy testar
  `tests/api/update-record.staging.test.ts` ett skriv-kontrakt ingen
  användare längre når via UI:t — ett värt-att-utreda sidofynd, inte en
  slutsats.
- **Hur stor andel av kvitto-utskicksflödet (`send-receipt-email`,
  `skicka-kvitto-igen`, `koa-kvitton`) som faktiskt är riktigt i de fyra e2e-
  filer som refererar det** är inte verifierat — dessa filer mockar 8–22 andra
  anrop var, och jag har inte isolerat vilka rader som rör just
  kvitto-anropet.
- **Om 3-shards-marginalen för acceptance-klassen fortfarande håller vid
  dagens 524 tester** (mot de 461 talet ursprungligen räknades från) är inte
  omprövat i detta pass. Det kräver en faktisk mätning av en skarp CI-körning
  efter senaste tillväxten.
- **Jag har inte sökt igenom samtliga 61 acceptance-filer efter ett faktiskt
  mail- eller PDF-triggande test** som skulle falla på den obefintliga
  Resend/DocRaptor-mocken — bara konstaterat att ingen sådan mock finns.

## Risker

- **Acceptance-klassens tillväxt har redan orsakat en verklig CI-fällning
  och kommer göra det igen om inget tak sätts.** Mönstret (98 % tillväxt på
  två veckor, från 233 till 461 tester i september, nu 524) är inte avtagande
  — det är samma organiska drift som gav "18 spec-filer"-siffran fel i tre
  styrande dokument samtidigt. Nästa tillväxtsprång kan äta upp
  3-shards-marginalen på samma sätt som det gamla enda jobbet åts upp i
  september.
- **De 11 obundna mockarna är en tyst risk som växer med Airtable-basens
  egen omarbetning** — `ADR-080` § 3 pekar själv ut att basen aktivt byggs om
  under "AT-Max"-milstolpen, exakt den period fixturer driftar tyst.
- **WebSocket/Realtime-mockningen är dokumenterat trasig sedan minst
  2026-09-06** (elva dagar innan denna granskning) utan att vara löst på
  `main` — betalningsinkorgens realtidsuppdatering har därför NOLL hermetisk
  täckning och en ofullständigt karterad E2E-täckning samtidigt.
- **En förväxling är lätt att göra:** en läsare (mänsklig eller agent) som
  ser en fil i `tests/e2e/*.staging.test.ts` antar rimligen att den testar
  mot riktig staging. För 32 av 34 filer är det antagandet helt eller delvis
  fel. Namnet på katalogen och filändelsen BÄR en trovärdighetssignal som
  innehållet inte längre håller.

## Rekommendationer

*Detta är rekommendationer, inte beslut.*

1. **Kuratera en explicit, namngiven lista över 5–15 kritiska realistiska
   flöden**, rankad efter risk (skrivvägar mot pengar, mot data som inte går
   att återskapa, mot extern kommunikation) snarare än historiskt ursprung.
   `invite-rundtur.staging.test.ts` är mallen att kopiera — inte bara för sitt
   innehåll utan för sin dokumenterade avsikt (docblocket säger uttryckligen
   vad som är riktigt och varför). Naturliga kandidater att bygga näst, i
   samma form: betalningsregistrering via den nya Postgres-vägen,
   avbokning/ombokning, ett kvitto-utskick, en PDF-genereringsrundtur.
2. **Flytta de filer i `tests/e2e/` som i praktiken redan är hermetiska (som
   `mark-paid.staging.test.ts`) till `tests/acceptance/`.** Det är ingen
   funktionsförlust — deras eget UI-bevis flyttar bara till rätt hylla — och
   det gör katalognamnet `e2e`/filändelsen `.staging.test.ts` trovärdig igen.
3. **Sätt ett explicit tak (eller ett larm) på acceptance-klassens storlek**,
   parat med en periodisk omprövning av 3-shards-marginalen, i stället för
   att låta nästa tillväxtsprång upptäckas genom en ny kö-fällning.
4. **Bind fler av de 11 obundna mockarna till kontraktsvakten** — särskilt
   `hamta-oppna-betalningar`, som redan har ett `satisfies`-schema men ingen
   nattlig verifiering, och som bär betalningsflödets Postgres-sanning.
5. **Uppdatera de tre platser som citerar "18 spec-filer"** (`CONTRIBUTING.md`,
   `scripts/acceptance-urval.sh`, ADR-080) till dagens tal, ELLER — bättre —
   ersätt det hårdkodade talet med en hänvisning till att köra
   `npx playwright test --project=acceptance --list` självt, så påståendet
   aldrig kan bli stalt igen.
6. **Lös WebSocket-mock-ordningen** (grenen `task/409-hermetisk-
   betalningsvarld` finns redan enligt `CLAUDE.md`) innan betalningsinkorgens
   Realtime-beteende får ännu en okontrollerad tillväxtperiod utan hermetisk
   täckning.

## Källor

### Repo-filer (kod, konfiguration, dokumentation)

- `.github/workflows/ci.yml:2160-2274` (run_staging/run_a11y-uteslutningen,
  fullt motiverad i kommentar)
- `.github/workflows/ci-suite.yml:1-53` (jobbstruktur, tre anropande
  workflower), `:153-260` (Pure + Build), `:231-364` (Acceptance, tillväxt-
  och shardingshistorik), `:516-536` (Acceptance-självtest), `:625-712`
  (Webbläsarbeteende, A11y), `:755-935` (Staging API+E2E)
- `playwright.config.ts:481-790` (samtliga projektdefinitioner, env-
  villkor)
- `package.json` (test:-skript, rad 23-34)
- `tests/e2e/*.staging.test.ts` (34 filer, lästa i sin helhet:
  `invite-rundtur.staging.test.ts`, `skapa-event.staging.test.ts`,
  `mark-paid.staging.test.ts`, `auth-flow.staging.test.ts`,
  `css-cascade.staging.test.ts`, `pwa-offline.staging.test.ts`,
  `shell.staging.test.ts`; övriga grep-sökta)
- `tests/support/fixturvarld/handlers.ts`, `hermetic.ts`, `fixture-data.ts`,
  `hermetik-vakt.ts` (hermetikvaktens mekanism)
- `tests/acceptance/hem.acceptance.test.ts:274-301` (FROZEN_NOW-fyndet)
- `tests/kontraktsvakt/kontraktsfall.ts`, `kontraktsvakt.staging.test.ts`
- `docs/reference/airtable-interaction.md` §7 (write-kontraktet, 13
  operationer)
- `supabase/functions/` (63 Edge Functions, verifierat både på disk och i
  commiten vid denna gransknings ögonblicksbild)

  > **Rättat i våg 2 (KG2, 2026-09-17):** raden stod tidigare här som "51
  > Edge Functions vid första katalog-listningen ... en omräkning senare
  > samma dag gav 63", med förklaringen "VOLATIL under detta pass ... denna
  > worktree delas med flera samtidigt körande bygg-agenter". Stickprov S16
  > (`underlag/01-orkestrerarens-stickprov.md`) prövade detta mot disk och
  > `git ls-tree HEAD supabase/functions/` och fann **63 poster på BÅDA
  > ställena** — katalogen hade inte vuxit under dagen. "51" var en
  > felräkning i det ursprungliga passet, inte en verklig förändring, och
  > "snabbt rörlig worktree" som förklaring stryks härmed. Ingen av
  > slutsatserna nedan byggde på talet 51 eller på tillväxt-hypotesen, så
  > inget annat i denna fil ändras.
- `CONTRIBUTING.md` §§ "Acceptance-klassen", "Post-merge-lagret",
  "Webbläsarbeteende-klassen", "Visuell regression"
- `docs/decisions/ADR-050-isolerad-staging-miljo.md`,
  `ADR-080-acceptance-klassen-hermetisk-utbrytning.md`,
  `ADR-094-webblasarbeteende-testklass.md`,
  `ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`
- `docs/decisions/ADR-107-reproducerbarhets-malet-lattviktsvagen-fore-nix.md`
  (läst för att pröva uppdragets premiss — INTE relevant för
  testarkitektur, se § Vad jag läste först)
- `scripts/acceptance-urval.sh:1-30` (stale "18 spec-filer"-kommentaren)
- [`docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`](../hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md)
- [`docs/research/hermetik-matning-steg1-2026-07-26.md`](../hermetik-matning-steg1-2026-07-26.md)
- [`docs/research/acceptance-utbrytningens-utfall-2026-07-28.md`](../acceptance-utbrytningens-utfall-2026-07-28.md)
- [`docs/research/riskanpassad-ci-design-2026-07-23.md`](../riskanpassad-ci-design-2026-07-23.md)
- [`docs/research/testklass-namn-och-support-kataloger-2026-08-02.md`](../testklass-namn-och-support-kataloger-2026-08-02.md)
- [`docs/research/testurval-kallkodsdrivet-2026-07-29.md`](../testurval-kallkodsdrivet-2026-07-29.md)
- [`docs/research/kallkodsdrivet-testurval-verktyg-2026-07-29.md`](../kallkodsdrivet-testurval-verktyg-2026-07-29.md)
- [`docs/research/supabase-realtime-hermetisk-mock-2026-09-06.md`](../supabase-realtime-hermetisk-mock-2026-09-06.md)
- [`docs/research/task-79-flake-baslinje-2026-08-02.md`](../task-79-flake-baslinje-2026-08-02.md)
- [`docs/research/auth-invite-e2e-service-role-branschprecedent-2026-08-05.md`](../auth-invite-e2e-service-role-branschprecedent-2026-08-05.md)
- [`docs/research/task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md`](../task-127-9-rundtur-e2e-service-role-blocker-2026-08-05.md)
- [`underlag/j1a-ci-yml-och-ci-suite.md`](underlag/j1a-ci-yml-och-ci-suite.md)
  (syskonfil, samma granskning — oberoende bekräftelse av CI-kopplingen)
- [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md)
  (syskonfil, orkestrerarens stickprov — tredje oberoende bekräftelsen)

### Mätningar gjorda i detta pass (2026-09-17)

- `npx playwright test --project=<namn> --list` för samtliga tolv projekt
  (`acceptance`, `chromium-authenticated`, `a11y`, `webblasarbeteende`,
  `api-pure`, `api-staging`, `kontraktsvakt`, `visual-desktop`,
  `visual-mobile`) — exakta testantal citerade i tabellen ovan, exit 0 på
  samtliga.
- `grep -c "page.route\|route.fulfill"` per fil i `tests/e2e/*.staging.test.ts`
  (mock-räkningstabellen).
- `grep -rl "<funktionsnamn>" tests/e2e tests/api src/` för elva namngivna
  Edge Functions (skriv-flödes-gap-tabellen).
- `git log -1` + `git merge-base --is-ancestor` för att verifiera
  worktreens faktiska HEAD mot uppdragets deklarerade ögonblicksbild.
- **En faktisk testkörning** (inte bara `--list`):
  `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1 npx playwright test --project=acceptance
  tests/acceptance/hem.acceptance.test.ts -g "refetchInterval"`, 2026-09-17
  10:06Z — fallerade med `OmockadRequestError` mot
  `visual-fixture.supabase.co/auth/v1/token?grant_type=refresh_token`, vilket
  verifierar FROZEN_NOW-fyndet definitivt (uppgraderat från "starkt
  indikerad" till "verifierad" under samma pass).
- `grep -rohE "EF\('[a-z0-9-]+'\)"` över hela `tests/acceptance/` +
  `tests/support/fixturvarld/` gav 40 distinkta, giltiga Edge-funktionsnamn
  (en 41:a träff, `get-persosn`, är en avsiktlig felstavning i en
  kod-kommentar, `overskuggnings-vakt.ts:24`). En loop av
  `grep -rl "$ef" tests/api/*.staging.test.ts` per namn (2026-09-17) visade
  att exakt ett namn — `send-action-email` — saknar träff helt: ingen
  kontraktsvakt-post, ingen `tests/api/*.staging.test.ts`-fil, och varje
  `tests/e2e/`-fil som refererar det mockar det explicit.
