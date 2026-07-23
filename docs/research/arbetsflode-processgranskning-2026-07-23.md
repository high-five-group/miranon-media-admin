# Processgranskning av arbetsflödet — extern analys (Codex, 2026-07-23)

> **Proveniens:** analysjobb som Marcus körde med Codex parallellt med S75:s
> review-våg. Läst underlag: repo, GitHub-metadata och externa källor — inga
> filer eller inställningar ändrades av analysen. Bedömningarna är analysens
> egna och är INTE kvitterade som projektbeslut; upptag sker via ordinarie
> triage (tråd/ADR).

## Min raka bedömning

Ni har lyckats bygga en ovanligt genomtänkt, spårbar och säker process. Men nej: helheten är ännu inte branschledande.

Min sammanvägda bedömning är ungefär:

| Område | Bedömning |
|---|---:|
| Struktur och dokumentation | 9/10 |
| Testdjup och säkerhetstänk | 8/10 |
| Faktisk mekanisk enforcement | 5/10 |
| Leveranshastighet | 4/10 |
| Riskanpassning | 4/10 |
| Helhet | cirka 6,5/10 |

Det här är inte ett kvalitetsproblem i första hand. Det är ett allokeringsproblem: ni lägger väldigt mycket rigor på upprepning och bokföring, men har inte mekaniserat några av de viktigaste skydden runt själva mergen.

Kort sagt: ni har byggt ett imponerande kontrollsystem, men det är bättre på att visa disciplin än på att maximera säker förändringstakt.

## Det ni gör riktigt bra

Processen har flera tydligt seniora egenskaper:

- ADR:er, sessionsspår, lessons och öppet dokumenterade rivningar gör beslut forensiskt läsbara.
- CI har least-privilege-permissions, timeouts, auto-cancel, SHA-pinnad tredjeparts-action och Dependabot-cooldown.
- Staging-tokenen är separat och begränsad; purge-jobbet har ett tydligt säkerhetsansvar.
- Testlagren är starka: pure API, stagingintegration, autentiserad E2E, accessibility och separat visuell testinfrastruktur.
- Felartefakter från Playwright sparas, samtidigt som lösenord saneras.
- Ni använder små PR:er och kortlivade grenar. Det är exakt den riktning DORA och Google rekommenderar: små förändringar är snabbare att granska, enklare att återställa och mindre riskfyllda. [DORA om trunk-based development](https://dora.dev/capabilities/trunk-based-development/), [Google om små changes](https://google.github.io/eng-practices/review/developer/small-cls.html).
- Ni har redan identifierat och försökt lösa parallellitet, stagingkollisioner och agentisolering. Det är betydligt mer avancerat än normal småprojekts-DevOps.

Det finns verklig kvalitet här. Det är inte process-teater i största allmänhet.

## De allvarligaste bristerna

### 1. `main` är inte skyddad

GitHub API rapporterar:

- ingen branch protection på `main`
- inga rulesets

Det betyder att CI inte faktiskt är en mergegrind. Den är en överenskommelse. Direktpush, felaktig merge eller adminhandling kan passera utan grön CI.

Det motsäger i praktiken formuleringen att PR endast mergas efter grön CI i [`CONTRIBUTING.md`](../../CONTRIBUTING.md) rad 122.

Detta är den största luckan. GitHub beskriver required status checks som mekanismen som faktiskt hindrar merge innan kontrollerna har passerat. [GitHubs ruleset-dokumentation](https://docs.github.com/en/enterprise-cloud%40latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

### 2. Review sker inte säkert på slutlig commit

I exempelvis PR #94 granskade Codex den första SHA:n. Därefter tillkom fem commits innan merge. Ingen approval krävdes, och ingen registrerad slutgranskning gjordes på den mergade versionen.

Automatisk review var dessutom `COMMENTED`, inte ett godkännande.

Så ni betalar kostnaden för review-processen utan garantin att slutresultatet är det som granskades. CODEOWNERS pekar dessutom enbart på Marcus, vilket inte skapar oberoende granskning.

För ett soloprojekt är verklig tvåpersonsgranskning förstås svår. Men då bör processen åtminstone vara ärlig:

- automatisk review ska köras på slutlig SHA
- high-risk-ändringar ska få en uttrycklig slutkvittens
- required checks måste gälla senaste committen
- nya commits efter godkännande ska göra tidigare kvittens inaktuell

### 3. Alla kodändringar behandlas nästan lika

För kod körs staging-API, hela autentiserade E2E-sviten och a11y även när ändringen bara rör CSS. Det tunga jobbet styrs i princip av “docs-only eller inte”, se [`ci.yml`](../../.github/workflows/ci.yml) rad 287.

Det är inte frontier. Frontierorganisationer kör relevanta tester baserat på förändringens påverkan:

- Meta rapporterade att deras testselektion fångade över 99,9 % av regressionerna med ungefär en tredjedel av den transitivt berörda testmängden. [Meta Engineering](https://engineering.fb.com/2018/11/21/developer-tools/predictive-test-selection/)
- Shopify byggde deterministisk testselektion och förbättrade både hastighet och stabilitet. [Shopify om snabb CI](https://shopify.engineering/faster-shopify-ci), [Shopify om att köra färre tester](https://shopify.engineering/spark-joy-by-running-fewer-tests).

Ni behöver inte ML-testselektion. Repot är tillräckligt litet för en deterministisk, fail-closed riskmatris.

### 4. Staging är den verkliga flaskhalsen

Den delade stagingmiljön tvingar samtliga stagingberörande körningar genom en global FIFO-kö, dokumenterat i [`ci.yml`](../../.github/workflows/ci.yml) rad 342. Playwrightkonfigurationen förklarar dessutom att API- och E2E-tester skriver mot samma poster och därför inte kan köras parallellt, se [`playwright.config.ts`](../../playwright.config.ts) rad 79.

Mätning av de 30 senaste avslutade PR-körningarna:

- tungt jobb, median: cirka 8 minuter 35 sekunder
- 6 av 30 väntade mer än en minut på staging
- 5 av 30 väntade mer än fem minuter
- maximal observerad väntan: cirka 8 minuter 40 sekunder

I en representativ körning tog:

- pure API: 3 sekunder
- staging-API: 97 sekunder
- E2E staging: 376 sekunder
- a11y: 65 sekunder
- build: 4 sekunder

Det är alltså inte TypeScript, Biome, build eller governancekontrollerna som gör processen långsam. Det är delad, muterbar staging och den breda E2E-sviten.

### 5. Ni kör ofta samma fullsvit två gånger

CI kör på både PR och varje push till `main`, se [`ci.yml`](../../.github/workflows/ci.yml) rad 4. Efter en grön PR kör merge-committen normalt hela den tunga sviten igen.

Det är defensivt, men ineffektivt. En bättre modell är att testa mergekandidaten — senaste `main` plus PR:n — och sedan låta merge ske från exakt den gröna kandidaten. Det är vad merge queues är till för.

GitHub använder själva merge queue för hundratals förändringar per dag och uppger omkring 33 % lägre väntetid. [GitHubs egen engineeringrapport](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/).

Merge queue är dock plan-/ägarformsberoende för privata repos. Om den inte är tillgänglig här kan required checks på test-merge-committen fortfarande ge huvuddelen av skyddet.

### 6. Avsiktligt röda commits skickas genom delad CI

Bland de senaste 29 avslutade PR-körningarna var 11 röda. Flera av dem är uttryckligen “avsiktligt RÖD run” för TDD- eller grindbevis.

Röd-först är bra lokalt. Men en avsiktligt röd commit bör normalt inte konsumera delad staging, FIFO-kön och full CI i nio minuter. Det:

- skapar brus
- blockerar andra pipelines
- försämrar signalvärdet i röd CI
- gör att “main/PR rött” inte längre betyder oväntad regression

Behåll gärna red/green-commits i lokal historik, men publicera först när grenen är ett koherent grönt checkpoint. Kör avsiktliga grindbevis i en separat, manuellt startad workflow som inte delar den normala mergekön.

### 7. CSS får mycket irrelevanta tester men saknar rätt huvudsignal

Det finns ett `test:visual`-kommando i [`package.json`](../../package.json) rad 18, men det körs inte i den ordinarie CI:n.

För en CSS-ändring kör ni alltså sex minuters staging-E2E men inte den signal som mest direkt svarar på frågan: ändrades utseendet oavsiktligt?

Det är ett bra exempel på skillnaden mellan “många tester” och “rätt tester”.

### 8. Supply-chain-härdningen har en konkret lucka

Actionlint installeras genom:

```bash
bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
```

Se [`ci.yml`](../../.github/workflows/ci.yml) rad 143.

Även om skriptet verifierar den hämtade binärens checksumma exekveras själva installationsskriptet direkt från en muterbar `main`. Om den källan komprometteras kan skriptet exekvera kod innan någon binärverifiering spelar roll.

Det går emot den i övrigt tydliga SHA-pin-filosofin. Skriptet bör hämtas från en fixerad commit och dess hash verifieras, eller ersättas av en lokalt versionslåst installation.

## Processen är också för dokumenttung

Per-session-DoD innehåller upp till ett dussin dokument- och synkfrågor, se [`CONTRIBUTING.md`](../../CONTRIBUTING.md) rad 92. CI-filen är 621 rader och mycket av komplexiteten finns för att verifiera governanceartefakternas interna konsistens.

Jag gillar dokumentation, men här har styrsystemet börjat få ett eget underhållsbehov:

- 75 ADR:er
- tusentals rader lessons och todo
- sessions-, tråd-, backlog- och BUILD-LOG-bokföring
- separata commits för paus, resume, post-CI och statusflipp

Det gör systemet läsbart, men varje liten ändring får en administrativ svans. Frontier är inte maximal dokumentation. Frontier är minsta mängd varaktig information som gör ett beslut begripligt, reversibelt och säkert.

Jag skulle behålla ADR:er för verkligt svårreverserade beslut, men inte låta varje arbetsövergång bli repo-global bokföring.

## Bör ni bygga en fast track?

Ja — men inte som en knapp eller etikett som betyder “hoppa över CI”.

Det frontier-liknande är en riskbaserad pipeline där snabbspåret är säkert därför att det kör mer relevanta tester, inte färre tester på måfå.

### Föreslagen modell

| Klass | Exempel | Blocking före merge | Efter merge/natt |
|---|---|---|---|
| D0 Dokumentation | sessionsdok, backlog, prosa | relevanta doc-/lifecyclegrindar | full länk-/prosekontroll vid behov |
| D1 UI-låg risk | CSS, tokens, text, statisk layout | Biome, typecheck, build, riktad a11y, relevanta visual snapshots, lokal komponent-/routesmoke | full UI-/E2E-svit nattligen |
| D2 Applogik | komponentlogik, queries, routing | D1 + pure tests + berörda E2E-flöden | full regression |
| D3 Hög risk | auth, Supabase functions, Airtable-write, schema, env, deps, CI | hela nuvarande sviten, staging, slutgranskning | full regression + säkerhetskontroller |
| Emergency | aktiv prodincident eller säkerhetshål | minsta reproducerande test + build + snabb slutkvittens | omedelbar fullsvit och obligatorisk eftergranskning |

Klassificeringen måste vara:

- deterministisk från changed files och explicita beroenden
- fail-closed: okänd fil eller klassificeringsändring ger D3
- omöjlig att “rösta ned” med en PR-label
- alltid möjlig att höja manuellt till full CI
- sammanfattad i ett required paraplyjobb som alltid rapporterar resultat

GitHub varnar för att required workflows som helt hoppas över med path filters kan ligga kvar som `Pending`. Behåll därför ett alltid startat workflow och skippa jobb internt med `if`; då kan paraplyjobbet fortfarande vara required. [GitHub om required/skippade checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks).

## Vad som kan flyttas till natten

Bra nattkandidater:

- full, oriktad staging-E2E
- full visual regression över alla routes/viewports
- full a11y-svep
- full dokumentlänkkontroll
- bred supply-chain-/licensanalys
- full regression över allt som inte berördes av dagens selektion
- mer kostsamma cross-browser-tester
- test av själva governancegrindarnas truth tables

Men följande bör fortfarande blockera varje kodmerge:

- formattering/lint
- TypeScript
- build
- pure/unit-tester
- berörda tester
- berörd a11y/visual-signal
- säkerhetskritiska tester när auth/write/env/deps påverkas

En nattkörning får aldrig bli kyrkogård. Ett nattfynd måste automatiskt:

1. skapa synligt larm,
2. markera `main` eller release som röd,
3. stoppa deployment,
4. knytas till sannolik introducerande commit,
5. leda till att ett billigare test flyttas fram till PR-grinden när det är möjligt.

Detta motsvarar den klassiska staged-build-modellen: snabb commit build först och lång sekundär regression senare. [Martin Fowler om staged builds](https://martinfowler.com/articles/continuousIntegration.html). Google beskriver på liknande sätt pre-submit som mergegrind och post-submit som release readiness. [Google om pre-/post-submit](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html?m=1).

## Min rekommenderade ordning

### Omedelbart — störst värde, liten konceptuell risk

1. Skydda `main`.
   - PR required.
   - `CI Passed or Skipped` required.
   - blockera force-push och deletion.
   - begränsa eller audit-logga bypass.
   - kräv att checken gäller senaste SHA/test-merge-committen.

2. Sluta använda normal CI för avsiktligt röda commits.

3. Inför D0/D1/D3 först. Börja inte med en komplicerad testgraf.
   - docs
   - UI/CSS
   - full
   - okänt ⇒ full

4. Gör CSS-fasttrack relevant:
   - lint/typecheck/build
   - CSS-cascade-test
   - relevanta a11y-tester
   - visuella snapshots för berörda routes
   - ingen staging-API/E2E om inga integrationsytor påverkas

5. Kör a11y, build och pure tests parallellt med stagingjobbet. De behöver inte ligga efter sex minuters E2E.

### Därefter

<!-- markdownlint-disable MD029 -->
<!-- Numreringen FORTSÄTTER medvetet från föregående avsnitt (1–5 → 6–8):
     analysens rekommenderade ordning är EN sekvens som bara är uppdelad på
     två rubriker. Att starta om på 1 här hade brutit författarens ordning. -->

6. Isolera stagingdata per körning.
   - unikt run-ID i skapade records
   - inga globala fasta poster där det kan undvikas
   - idempotent cleanup per run
   - separata konton/namespaces där domänen tillåter

Detta är den riktiga lösningen på FIFO-flaskhalsen. Semaforen är ett korrekt säkerhetsplåster, inte slutarkitekturen.

7. Använd merge queue om repoformen och planen stödjer den.
   - Kör full relevant CI på merge candidate.
   - Efter merge: minimal smoke/deploy-verifiering, inte en identisk fullsvit.
   - Ersätt handdriven `PR → vänta → merge → vänta` med “merge when ready”.

8. Automatisera mätningen:
   - PR lead time p50/p95
   - kötid p50/p95
   - tid till första fel
   - flaky/retry rate
   - nattliga escaped defects
   - change failure rate
   - rollback/recovery time

<!-- markdownlint-enable MD029 -->

DORA understryker att små batcher förbättrar både hastighet och stabilitet och att förbättringar bör följas med faktiska leveransmått. [DORA:s leveransmått](https://dora.dev/guides/dora-metrics/), [DORA om små batcher](https://dora.dev/capabilities/working-in-small-batches/).

## Slutsats

Ni bör absolut skapa ett fast track. Men kalla det hellre riskanpassad CI eller change-aware CI. “Fast track” låter som ett undantag; det här bör vara normalformen.

Den viktigaste principen är:

> Kör snabbt det som ger hög signal för förändringen. Kör brett när risken kräver det. Kör uttömmande i bakgrunden. Skydda alltid trunk mekaniskt.

Flytta inte bara det långsamma till natten. Då byter ni långsam feedback mot sen feedback. Den professionella vägen är att först göra PR-grinden relevant och snabb, sedan använda nattkörningen som kompletterande full regression.

Och allra rakast: innan ni bygger fler ADR:er, grindvakter eller sessionsmekanismer bör ni skydda `main`, sluta skicka avsiktligt rött till delad CI och avskaffa staging som global seriell resurs. De tre sakerna skulle göra processen både säkrare och märkbart snabbare än ytterligare processlager.

Jag har endast läst repo, GitHubmetadata och externa källor. Inga filer, inställningar eller externa tillstånd ändrades.

## Verifikation och beslutsläge (Code, 2026-07-23)

> **Proveniens:** intern verifiering utförd av Code samma dag som analysen
> landade, i separat läs-pass parallellt med S75 (repo-state läst vid HEAD
> `147f3f4`→`399d77c`; inga filer ändrades under själva verifieringen —
> denna sektion är dess enda skrivavtryck, landad i efterhand). Metod:
> läsning av repo-state, GitHub-API (branch protection, rulesets, run- och
> PR-metadata) samt ADR-/trail-forensik. Analysens externa källpåståenden
> (DORA, Meta, Shopify, GitHub, Fowler, Google) är rimlighetsbedömda mot
> känd litteratur, inte omverifierade.

### Utfall per huvudpåstående

| # | Codex-påstående | Utfall |
|---|---|---|
| 1 | `main` oskyddad | **Bekräftat.** API: `Branch not protected`; rulesets: `[]`. Tillägg: repot är **publikt** (medvetet, [ADR-024](../decisions/ADR-024-publika-professionalitetssignaler.md)) — branch protection och rulesets är alltså kostnadsfritt tillgängliga, inget plan-hinder finns. |
| 2 | Review sker inte på slutlig commit | **Bekräftat, skarpare än analysen:** PR #94:s enda registrerade review (`COMMENTED`, Codex-boten) gjordes på `9cc9c22` — den avsiktligt RÖDA committen. Fem commits följde ogranskade fram till merge `afceeb6`. |
| 3 | Nästan-binär riskklassning | **Bekräftat.** Exakt två klasser existerar: docs-only-skip respektive full svit (`should_skip_tests` i [`ci.yml`](../../.github/workflows/ci.yml)). |
| 4 | Staging är flaskhalsen | **Bekräftat, plus en förvärring analysen missade:** `staging-tests`-mutexen omsluter HELA Test+Build-jobbet. Mätt i run 30012389097: Lint 33 s, changed 8 s, purge 9 s, docs 30 s — och Test+Build 9 min 57 s (plus 1 min 49 s köväntan i den körningen). Endast staging-stegen (API + E2E, ~6 min) behöver låset; pure-tester, a11y, build och npm-install håller det i onödan. |
| 5 | Fullsvit körs dubbelt (PR + main-push) | **Bekräftat** (`on: pull_request` + `push: main`). |
| 6 | Avsiktligt röda runs genom delad CI | **Bekräftat:** 7 röda + 1 avbruten av de 30 senaste körningarna, samtliga ur review-vågornas rött-först-pushar. Nyans: praxisen är kodifierad ([ADR-071](../decisions/ADR-071-afk-batch-kontraktet.md) + fix-vågens femdelade kontrakt) — ändring är ett praxis-beslut, inte en städning. |
| 7 | CSS saknar visual-signal | **Bekräftat men underdrivet:** `tests/visual/` är TOM. `test:visual` har inga tester att köra — signalen måste byggas från noll, inklusive CI-genererade Linux-baselines (lokala macOS-skärmdumpar kan inte tjäna som CI-referens). |
| 8 | actionlint-luckan | **Bekräftat.** Install-skriptet hämtas från muterbar `main` och exekverar före all checksumme-verifiering (verifieringen görs av det hämtade skriptet självt). [ADR-029](../decisions/ADR-029-ci-architektur-changed-files-pattern.md) utelämning #3 motiverade valet med upstream-precedent 2026-05-13; huset har därefter självt etablerat ett starkare mönster — shellcheck-steget i samma fil (pinnad version + egen SHA256-verifiering). |
| 9 | Merge queue | **Ej tillgänglig:** repot ägs av ett User-konto och merge queue kräver org-ägt repo. Required checks + up-to-date-krav ger huvudskyddet. |
| 10 | Dokumenttyngd | Siffrorna stämmer (75 ADR:er, 13-punkters per-session-DoD, 621-raders ci.yml). Bedömningen nyanseras nedan. |

### Forensik: de största luckorna är deferraler, inte missar

- Branch protection sköts medvetet på framtiden 2026-05-13 (ADR-029
  § Medvetna utelämningar #5, K1.A Block A.4), och `ci-passed`-aggregatorn
  byggdes uttryckligen som "branch-protection-required-stable" i väntan på
  aktivering. Deferralen återupptogs aldrig — analysen hittade en glömd
  strömbrytare, inte ett hål i tänket.
- [ADR-036](../decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)
  konstaterar öppet att CI är enda mekaniska enforcement — men adresserar
  pre-commit-frågan, inte merge-grinden.
- Staging-mutexen deklareras redan i ci.yml som "defense-in-depth …
  komplement", inte slutarkitektur — samstämmigt med analysens
  "säkerhetsplåster".

### Nyanser mot analysen

1. **"Mekanisk enforcement 5/10" blandar två axlar.** Innehålls-enforcement
   (fail-closed-detektion, grindvakter som truth-table-testar sig själva) är
   över branschstandard; merge-enforcement är nära noll. Det som saknas är en
   switch, inte ett systemskifte.
2. **Dokumenttyngden är delvis målfunktion, inte overhead.** Systemet är
   självt en leverabel (ADR-024 publika signaler,
   [ADR-063](../decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md)
   bas-som-mall, ADR-068 övningsramverket). Retroaktiv bantning avvisas.
   Kärnan består framåt: en liten ändring ska inte bära en stor administrativ
   svans — riskklassning bör på sikt gälla även processen, som eget senare
   beslut.
3. **Rött-först: byt bärare, avskaffa inte.** Bevisvärdet (citerbara
   run-ID:n) behålls via: rött+grönt pushas ihop (grön head-run), lokalt rött
   körutdrag citeras i kort/sessionsdok, och grind-bevis körs via riktad
   manuellt startad workflow (husets precedent: gate-proof-run 27337333679
   för a11y-grinden).

### Beslutsläge (2026-07-23)

- **Våg 1 GODKÄND av Marcus** — aktivera ruleset på `main` (require PR,
  required check = `ci-passed`-aggregatorn, blockera force-push/deletion,
  up-to-date-krav), migrera actionlint-installen till shellcheck-mönstret,
  och splitta Test+Build så staging-mutexen endast bär staging-stegen.
  Körning inväntar Marcus klartecken och sker EFTER S75:s landning — ci.yml
  rörs inte under aktiv review-våg.
- **Våg 2** — riskklass D1 (css/tokens/copy) i changed-files-idiomet,
  fail-closed (okänd fil ⇒ full svit); rött-först-bärarbytet; visual
  regression byggd som D1:s huvudsignal. Grillnings-kandidat: design före
  bygge.
- **Våg 3** — staging per-run-isolering (run-ID-scoping, inga globala fasta
  poster; [ADR-060](../decisions/ADR-060-sentinel-setup-purge-create-conformance.md)-arkitekturen
  är halva vägen) samdesignad med bas-maximeringen (ADR-063, post-Fas-6);
  tangerar T27 och T45. Därefter nightly-svit med larmkedja (först när D1
  skapat gapet — annars ren duplicering) samt mätskript (lead time, kötid,
  röd-orsak).
- **Avvisat:** merge queue (ägarform), ML-testselektion, retroaktiv
  dok-bantning, "flytta allt tungt till natten" (sen feedback ersätter inte
  snabb).
- **Upptag:** tråd registreras i tråd-registret efter S75:s landning (ID
  tilldelas vid registrerings-ögonblicket; registret rörs inte under aktiv
  session). *Efterhands-not vid landningen: upptaget blev Session 77 —
  tråden fick ID T85; besluten A+A (bokföring via auto-merge-PR;
  rött-först-bärarbyte) låstes av Marcus 2026-07-23 och verkställs S77
  respektive våg 2c.*
