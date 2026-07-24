# Eftergranskning av åtgärderna efter processrapporten

> Datum: 2026-07-24  
> Omfattning: repots arbetsflöde, GitHub-regler, verkliga Actions-körningar, TASK-36/T85, T87 och T86.  
> Arbetssätt: helt skrivskyddad granskning. Inga filer eller externa tillstånd har ändrats.

## Sammanfattande dom

Ni har genomfört ett substantiellt och i flera delar mycket professionellt åtgärdspaket. Det här är inte dokumentationsteater: huvudgrenen är faktiskt skyddad, required check är aktiv, bypass-listan är tom, riskklassningen körs, merge-dedupliceringen fungerar, nattkörningen har körts skarpt och avsiktligt rött har flyttats ur den delade CI-kön.

Min tidigare bedömning låg ungefär på 6,5/10. Nu ligger ni omkring 8/10.

Det betyder:

- Processen är nu på en hög professionell nivå.
- Flera enskilda mekanismer är branschledarmässigt konstruerade.
- Ni har byggt en försvarbar fast track utan att generellt släppa kvalitetskraven.
- Ni är ännu inte empiriskt bevisat på absoluta frontiern. Mätperioden är för kort, visuell regression är inte aktiv, granskningshålet är inte stängt och vissa av era mätare mäter inte riktigt det de påstår.

Det viktigaste positiva omdömet är att ni reagerade rätt på incidenten där en röd PR kunde auto-mergas: ni gömde inte utfallet, utan korrigerade paraply-checken till fail-closed och byggde ett kontrastbevis. Det är ett moget arbetssätt.

Det viktigaste negativa omdömet är att dokumentationen nu påstår att visuell regression och det nattliga säkerhetsnätet är starkare än de faktiskt är. I ett system som bygger på dokumenterad sanning är det inte en kosmetisk brist.

## Bedömning mot ursprungsrapporten

| Ursprungligt fynd | Nuvarande bedömning |
|---|---|
| `main` saknade skydd | **Stängt, starkt löst.** Aktivt ruleset, strict required check, tom bypass-lista, blockerad deletion/force-push. |
| Review skedde inte på slutlig commit | **Fortfarande öppet.** T86 är ett lovande pilotförsök, men ingen slutlig SHA-attestering finns ännu. |
| Nästan alla kodändringar betalade samma CI-pris | **Väsentligt förbättrat.** D0/D1/D3, uppdelade jobb och fail-closed allowlist är rätt modell. |
| Staging var flaskhalsen | **Mitigerat, inte löst.** Snabb signal kommer tidigare och D1 slipper staging, men D3 är fortfarande serialiserad. |
| Samma fullsvit kördes före och efter merge | **Stängt, väl löst.** Innehållsadresserad dedup med fail-closed-fallback. |
| Avsiktligt rött användes i delad CI | **Stängt.** Rött-först är lokalt och riktade gate-proof-körningar används. |
| CSS saknade relevant visuell signal | **Infrastrukturen byggd, men själva grinden är inte aktiv.** Därmed inte stängt. |
| Actionlint laddades från muterbar källa | **Stängt.** Version och SHA256 verifieras. En liknande mindre lucka återstår för Vale. |
| Processen var dokumenttung | **Inte löst.** Automationen gör den snabbare, men mängden landningar och bokföring har snarare ökat. |

## Det ni har gjort särskilt bra

### 1. Main-skyddet är nu verkligt, inte bara normativt

GitHubs aktiva ruleset `main-skydd` är konfigurerat med:

- PR-krav mot default branch
- required check `CI Passed or Skipped`
- strict up-to-date
- blockerad deletion och non-fast-forward
- noll approvals, vilket är ärligt för ett soloprojekt
- tom bypass-lista
- `current_user_can_bypass: never`

Detta stänger rapportens allvarligaste hål. GitHub bekräftar att strict-läget kräver att PR-grenen är aktuell mot målgrenen och att alla required checks gäller senaste SHA:n. Nackdelen är fler omkörningar när `main` rör sig, vilket ni också har observerat korrekt. [GitHubs regler för required checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

### 2. Paraply-checken är nu fail-closed

[ci.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci.yml:553) kör paraplyjobbet med `if: always()` och läser alla beroendejobbs resultat. `failure` och `cancelled` ger explicit `exit 1`.

Detta är rätt konstruktion eftersom GitHub behandlar skippade jobb som lyckade. En required check som kan hoppas över är annars säkerhetsmässigt fail-open. [GitHubs status-check-dokumentation](https://docs.github.com/en/pull-requests/reference/status-checks).

Ännu viktigare: de senare verkliga misslyckade körningarna visar att den riktiga aggregatorn, inte bara gate-proof-repliken, faktiskt blir röd när lint-jobbet faller.

### 3. D1-fasttracken är konservativt utformad

D1-klassningen i [ci.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci.yml:112) är en allowlist, inte en blocklist. Okända eller blandade ändringar faller tillbaka till full svit. CI-, paket-, lås- och byggkonfiguration kan inte dras ned till lågrisk av en samtidig CSS-fil.

Det här är precis hur en säker fast track bör utformas:

- liten, uttrycklig lågriskyta
- default till högre risk
- kontrastbevis för blandade commits
- inga workflow-level path filters som kan göra required check permanent frånvarande

Jag rekommenderar att ni inte introducerar D2 ännu. D0/D1/D3 är en sund första klassrymd.

### 4. Merge-dedupliceringen är ovanligt välgjord

Dedupen i [ci.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci.yml:142) verifierar både att merge-commitens träd är identiskt med PR-headens träd och att just den fullständiga SHA:n har en framgångsrik CI-körning. Alla avvikelser ger full svit.

Det ger rätt asymmetri:

- ett fel kan orsaka en onödig körning
- ett fel ska inte kunna orsaka att oprövad kod hoppas över

Den skarpa träffkvoten är hittills 100 procent: 20 träffar och noll missar bland tillämpliga körningar. Underlaget är kort, men mekanismen fungerar.

En mindre inkonsekvens är att rulesetet tillåter merge, squash och rebase medan dedupens optimala väg förutsätter en merge-commit med andra förälder. Det är säkert eftersom squash/rebase faller tillbaka till full svit, men förutsägbarheten blir bättre om merge-commit verkligen är den enda husformen.

### 5. Jobbuppdelningen ger tidigare återkoppling

[ci-suite.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci-suite.yml:72) separerar pure/build, a11y och staging. Det minskar inte alltid tiden tills en full D3-PR kan mergas, men det ger användbar signal tidigare och begränsar staging-mutexen till rätt jobb.

Detta är en verklig hastighetsförbättring, inte bara ompaketering.

### 6. Rött-först-bärarbytet är rätt

Det röda TDD-varvet bevaras, men sker lokalt. Rött och grönt levereras tillsammans, medan riktade grindbevis sker i en separat workflow.

Det återställer den viktiga semantiken: rött i normal CI betyder oväntat fel, inte pedagogiskt bevis.

### 7. Nattnätet är arkitektoniskt rätt tänkt

[nightly.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/nightly.yml:34) återanvänder samma tunga svit, gör bredare audit, kör kall länkkontroll och har en larmkedja. Två verkliga gröna nattkörningar och en simulerad larmkörning finns.

Det är rätt princip: snabb, selektiv presubmit ovanpå en bredare post-submit-kontroll.

## Viktigaste kvarvarande brister

### 1. Visuell regression beskrivs som aktiv trots att den är parkerad

Detta är rapportens viktigaste kvarvarande sanningsgap.

[CONTRIBUTING](/Users/marcus/Repon/miranon-media-admin/CONTRIBUTING.md:177) säger att varje UI-ändring jämförs mot referensbilder och att CI-jobbet kör jämförelsen. Något sådant jobb finns inte i `ci-suite.yml` eller `nightly.yml`.

TASK-36.7 är dessutom markerad `Done`, trots att AC 7–8 och samtliga DoD-rader är öppna: [TASK-36.7](/Users/marcus/Repon/miranon-media-admin/backlog/tasks/task-36.7%20-%20Skiva-Visuell-regression-från-noll-—-CI-födda-baselines.md:32). Samtidigt kräver QA-planens punkt 11 ett rött visual-jobb som inte existerar: [TASK-36.8](/Users/marcus/Repon/miranon-media-admin/backlog/tasks/task-36.8%20-%20QA-Manuell-testplan-—-riskanpassad-CI-mot-verkligt-arbetsflöde.md:48).

Själva visual-infrastrukturen är däremot bra:

- hermetiska fixturer
- frusen tid
- incheckat typsnitt
- noll staging och mutex
- 12 Linux-baselines i 2×
- baseline-PR skapad av CI och mänskligt granskad i [PR #140](https://github.com/marcus803/miranon-media-admin/pull/140)

Beslutet att parkera en blockerande PR-grind under intensiv UI-iteration är försvarbart. Det som inte är försvarbart är att aktiva dokument och avslutade kort säger att grinden redan finns.

Min rekommendation är:

1. Gör sanningen konsekvent omedelbart: beskriv visual som byggd men inaktiv och gör QA-punkt 11 explicit blockerad av T87.
2. Överväg att aktivera visual i nightly före PR-grinden. Då får ni åtminstone ett automatiskt nät utan att blockera varje designiteration.
3. Aktivera PR-grinden när UI-takten lugnar, enligt [T87](/Users/marcus/Repon/miranon-media-admin/tasks/threads/T87-visual-grind-aktivering.md:39).

Jag skulle inte kalla hela TASK-36 bevisad förrän denna motsägelse är löst.

### 2. CI-mätaren är användbar som prototyp men inte ännu beslutssäker

Det senaste 100-körningsfönstret rapporterar:

- PR-feedback median 1 minut, p95 13,3 minuter
- staging-väntan median 0,2 minuter, p95 7,7 minuter
- två slutligt röda runs
- “flaky-frekvens” 60 procent
- dedup 20/20

Tre mätproblem finns i [ci-metrics.mjs](/Users/marcus/Repon/miranon-media-admin/scripts/ci-metrics.mjs:90):

1. **Staging-kötiden är inte mutex-kötid.** Den mäter workflow-start till staging-jobbets start och inkluderar därför upstream-jobb, runner-kö och purge. Den kan inte isolerat användas för att bedöma mutexen.

2. **Flaky-definitionen är felaktig.** Varje framgångsrik körning med `run_attempt > 1` räknas som tidigare röd. Av de tre räknade körningarna var en första körning `action_required`, inte röd. De två andra hade verkliga failures. Under skriptets nuvarande incidentnämnare är utfallet därför åtminstone 50 procent, inte 60 procent. Dessutom bör “antal flake-incidenter” skiljas från “antal röda försök”.

3. **Röd-orsaksrapporten tar bara `conclusion === failure`.** Den missar `startup_failure`, `timed_out`, `action_required`, `stale` och andra viktiga slutlägen.

GitHub skiljer uttryckligen mellan dessa statusar och slutsatser. [GitHubs statusmodell](https://docs.github.com/en/pull-requests/reference/status-checks).

Mätaren bör därför ses som en första instrumentpanel, inte som facit. Fixera definitionerna innan ni använder siffrorna för att permanenta fler snabbspår.

### 3. Nattlarmet kan inte larma om sitt eget startup-fel

Den verkliga nightly-körningen `30038460735` fick `startup_failure`. Ett larmjobb inne i samma workflow kan inte köras när workflowen inte lyckas starta.

Påståendet att “en röd natt automatiskt skapar ett ärende” är därför för starkt. Det gäller röda jobb efter att workflowen har instansierats, inte alla röda nattutfall.

Ett verkligt fail-closed nattnät behöver en separat observatör, exempelvis:

- en liten `workflow_run`-vakt för nightly
- eller en separat kontroll som larmar även när en schemalagd run saknas
- kompletterat med GitHub-notifieringar

Observatören bör även täcka `startup_failure`, `timed_out`, `action_required` och utebliven schemakörning.

### 4. Stagingflaskhalsen är fortfarande verklig

D1 undviker staging, och D3 ger tidigare signal från parallella jobb. Men fulla produktändringar tar fortfarande omkring åtta minuter och går genom en global staging-mutex.

Den strukturella effekten syns redan i [L328](/Users/marcus/Repon/miranon-media-admin/tasks/lessons.md:4801): PR #133 behövde tre update-branch-varv eftersom snabbare docs-PR:er hann flytta `main` under den långa sviten.

Detta är inte skäl att släppa strict-läget. GitHub dokumenterar att strict ger fler byggen men säkrare kombinationsbevis. En merge queue är branschverktyget för problemet, men GitHubs merge queue är i nuläget begränsad till organisationsägda publika repo eller organisationsägda privata Enterprise Cloud-repo. [GitHubs merge queue-dokumentation](https://docs.github.com/en/enterprise-cloud%40latest/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue).

Så länge repot är användarägt är rätt kortsiktig lösning:

- en tydlig landningskoordinator
- inga snabba docs-PR:er medan en lång PR försöker konvergera
- bokföring i leverans-PR:n när det är naturligt
- samla efterföljande rena bokföringslandningar

Om parallelliteten fortsätter öka kan organisationsflytt för merge queue bli rationell. Inte före dess.

### 5. Required check är inte bunden till förväntad app

Rulesetet kräver checknamnet `CI Passed or Skipped`, men API-konfigurationen visar ingen bunden `integration_id`. GitHub varnar för att användare och integrationer med write-behörighet annars kan publicera samma statusnamn. En required check kan bindas till en förväntad GitHub App. [GitHubs ruleset-dokumentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

Risken är begränsad i ett solorepo, men om målet är säkerhetsmässig frontier bör checken bindas till GitHub Actions som förväntad källa.

### 6. Actionlint-luckan är stängd, men Vale saknar integritetskontroll

Actionlint installeras nu från en fast release och verifieras med SHA256: [ci.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci.yml:233). Det stänger ursprungsfyndet ordentligt.

Vale hämtas däremot som versionspinnad tarball utan checksummeverifiering: [ci.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/ci.yml:506). Det är mycket bättre än muterbar `main`, men inte samma supply-chain-nivå som actionlint. Samma checksummeform bör användas.

### 7. Workflow-ytan har vuxit kraftigt

Före åtgärdspaketet var huvudworkflowen 621 rader. Nu består de centrala workflowfilerna av sammanlagt 1 246 rader:

- `ci.yml`: 571
- `ci-suite.yml`: 230
- `nightly.yml`: 209
- `gate-proof.yml`: 133
- `visual-baselines.yml`: 103

Uppdelningen är i huvudsak bra, men komplexiteten har fördubblats. Det gör drift mellan repliker och dokument till nästa sannolika felklass.

Exempel: gate-proof testar en replik av aggregatorns kärnlogik. Om det riktiga paraplyjobbet senare ändrar `needs`, `if` eller resultattolkning kan repliken fortfarande vara grön.

Jag skulle därför prioritera små kontraktstester för workflowstrukturen framför fler riskklasser och specialfall.

## Bedömning av T86

## Landade delar

### Fakta/beslut-distinktionen och enact-gaten

Detta är en bra förbättring. Agenten ska utforska fakta själv och bara belasta Marcus med verkliga beslut. Samtidigt förhindrar enact-gaten att en grillning glider över i implementation utan kvitterad samsyn.

Det minskar både onödiga frågor och felriktat bygge.

### Valideringskadensen

Typecheck och berörd testfil under arbetet, följt av full svit i slutskedet, är en stark hastighetsförbättring.

Formuleringen “full svit EN gång” bör dock tolkas som:

> Minst en full svit efter den sista materiella ändringen.

Det får inte bli ett hårt maximum. Om reviewn leder till en strukturell kodändring efter fullsviten måste relevanta tester och vid behov fullsviten köras igen.

### Research-skillen

En nedskriven fråga, primärkällor, avgränsad research och varaktig markdown-landning är en bra form. Undantaget för snabbverifiering gör att den inte behöver skapa process kring varje trivial faktakontroll.

Den huvudsakliga risken är dokumenttillväxt, men skillen kräver destillat i stället för rådump och är därför rimligt disciplinerad.

## Review-piloten

Min raka dom: **kör piloten, men permanenta den inte i nuvarande form utan några protokollskärpningar.**

Det som är mycket bra i [T86](/Users/marcus/Repon/miranon-media-admin/tasks/threads/T86-pocock-v11-integrationen.md:108):

- uttrycklig hypotes och nollhypotes
- låsta kriterier före start
- begränsning till 10–15 produktkodsskivor
- färsk kontext utan implementerns resonemang
- två tydliga granskningsaxlar
- max cirka sju fynd
- synlig triage
- brus och tidskostnad mäts
- endast en tillåten justeringsrunda
- paneler och övergranskning har uttryckligen avståtts

Detta är experimentdesign, inte trosbaserad processutbyggnad.

Följande bör skärpas före start:

1. **Registrera granskat träd eller SHA.** Annars vet ni inte vilken kod reviewn faktiskt avsåg.

2. **Definiera omgranskningsregeln.** Materiella ändringar efter ett reviewfynd bör få en fokuserad andra passering. Triviala namn- eller kommentarändringar behöver inte det.

3. **Mät validering efter fynd.** Reviewfixar måste följas av berörda tester och, vid tvärgående ändring, full svit.

4. **Låt inte implementern ensam avgöra värdet.** Implementern triagerar sina egna fynd och har därför ett naturligt bekräftelsebias. Marcus bör åtminstone kontrollera alla blockerfynd, alla omtvistade avfärdanden och ett stickprov av övriga avfärdanden.

5. **Definiera nämnarna.** Ange exakt om brusandelen räknas över alla rapporterade fynd, om dubletter räknas och hur routade fynd hanteras.

6. **Kalla inte “missar nedströms” för recall.** Recall kräver att hela mängden relevanta fel är känd. Här mäter ni observerade escapes, vilket fortfarande är värdefullt men inte samma sak.

7. **Mät total leveranslatens.** Reviewtiden ligger före push och syns inte i CI-måttet. Pilotrapporten bör därför visa både reviewtid och total tid från lokalt grönt till merge.

8. **Var ärlig om oberoendet.** En färsk subagent ger oberoende kontext, men samma modellfamilj kan bära samma systematiska blindhet. Det är en kvalificerad second opinion, inte organisatorisk separation of duties.

Piloten kan höja kvaliteten, men den stänger ännu inte ursprungsfyndet “review på slutlig commit”. Det gör den först när granskat träd, efterföljande ändringar och levererad SHA kan knytas ihop.

## Processhastighet och administrativ kostnad

Åtgärdspaketet visar mycket hög genomströmning: sedan 23 juli finns 83 commits på `origin/main`:s first-parent-historik, varav 52 merge-commits.

Det bevisar att processen kan leverera mycket. Det bevisar samtidigt att den producerar många separata landningar.

Skillnaden mellan throughput och latency är viktig:

- Systemet kan hålla många saker i rörelse.
- En enskild lång PR kan ändå svälta bakom små docs-PR:er.
- En agent kan tolerera administration bättre än en människa, men GitHub-kön och staging-mutexen betalar fortfarande kostnaden.

Min rekommendation är inte att tillåta direktpush igen. Den är att minska antalet separata bokförings-PR:er när informationen naturligt kan landa med den förändring den beskriver.

## Små men konkreta korrigeringar

Nightly-workflowen säger att GitHub-cron saknar tidszon och använder därför ungefärlig UTC-mappning: [nightly.yml](/Users/marcus/Repon/miranon-media-admin/.github/workflows/nightly.yml:11). GitHub Actions stöder nu IANA-tidszon direkt, exempelvis `timezone: Europe/Stockholm`. [Aktuell workflow-syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).

Det är ingen säkerhetsbrist, men en enkel möjlighet att ta bort DST-glidning och en inaktuell kommentar.

## Rekommenderad ordning härifrån

1. Rätta visual-sanningen mellan CONTRIBUTING, TASK-36.7, T87 och QA-planen.
2. Bestäm om visual ska aktiveras nightly redan nu, även om PR-grinden väntar.
3. Korrigera mätdefinitionerna för flake, röda slutsatser och verklig mutex-väntan.
4. Lägg nattlarmet i en separat observatör som kan se `startup_failure` och utebliven körning.
5. Genomför TASK-36.8 först när testplanens förväntningar motsvarar verklig konfiguration.
6. Skärp T86-protokollet och kör därefter piloten på 10–15 produktkodsskivor.
7. Bind required check till förväntad GitHub App och överväg merge-only som husregel.
8. Lägg SHA256-verifiering på Vale.
9. Mät två till fyra veckors normal drift innan fler snabbklasser eller CI-specialfall införs.
10. Om BEHIND-svälten fortsätter: förbättra landningskoordineringen först, utvärdera organisationsflytt/merge queue därefter.

## Slutlig slutsats

Ni har lyckats med huvuddelen av åtgärdspaketet.

Main-skyddet, fail-closed-paraplyet, den konservativa D1-klassen, merge-dedupen, jobbuppdelningen och rött-först-bärarbytet håller hög professionell nivå. Det är en legitim fast track, inte ett kvalitetshål maskerat som snabbhet.

Men ni bör ännu inte deklarera processen som färdig eller bevisat branschledande. Tre saker måste först bli sanna:

1. Dokumentationen måste beskriva den faktiska visual- och nightly-täckningen.
2. Mätarna och nattlarmet måste kunna se de felklasser de påstår sig mäta.
3. T86 måste visa värde på riktig produktkod och knyta reviewn till levererad kod.

Min slutdom är därför:

> **Arkitekturen är nu nära frontier-nivå. Den operativa evidensen och sanningskoherensen är ännu inte där. Fortsätt på inslagen väg, men stäng de observerbarhets- och visual-luckor som åtgärdspaketet själv har exponerat innan ni bygger mer process ovanpå det.**

## Verifikation och beslutsläge (Code, 2026-07-24)

> **Proveniens:** läs-pass i S82-konversationen samma dag som
> eftergranskningen landade ocommittad i huvudkatalogen; denna sektion +
> fil-landningen är passets skrivavtryck. Verifierat mot main `8857c98`
> (workflows, CONTRIBUTING, kort- och tråd-läsning). De positiva
> omdömena (ruleset, dedup, D1, jobbuppdelning, nattnätets arkitektur)
> är S81/T85-leveranser med egen bevis-trail och omverifierades inte
> här; de negativa, beslutsdrivande fynden verifierades.

### Utfall per beslutsdrivande fynd

| # | Codex-påstående | Utfall |
|---|---|---|
| 1 | Visual beskrivs aktiv men är parkerad | **Bekräftat, med nyans Codex delvis ger själv:** `ci-suite.yml` + `nightly.yml` har 0 visual-referenser; infrastrukturen FINNS (`tests/visual/` 3 specar + baselines, `visual-baselines.yml`). 36.7 står `Done` med AC 7–8 + hela DoD-listan obockade — MEN parkeringen är MEDVETEN och öppet bokförd (Marcus-beslut A S81, inline i kortet + [T87](../../tasks/threads/T87-visual-grind-aktivering.md) med komplett aktiverings-steg inkl. färdig YAML). Gapet är alltså SANNINGSKOHERENS, inte smyg. **Åtgärdat i denna landning:** CONTRIBUTING § Visuell regression omskriven till byggd-men-inaktiv med T87-pekare. **Kvar till Marcus:** 36.7-kortets formalia (Done med öppna AC/DoD) + 36.8-punkt-11-ordningen. |
| 2 | Mätardefinitionerna (flaky-nämnaren, kötid ≠ mutex-tid, röd-orsak missar statusklasser) | **Rimliga, EJ omverifierade här** — flaggas till T85-spåret som korrigeringskort FÖRE beslutsanvändning av siffrorna (Codex ordning punkt 3). |
| 3 | Nattlarmet kan inte se eget `startup_failure` | **Logiskt korrekt** (larmjobb i samma workflow kan inte köra när workflown inte instansieras; `startup_failure`-klassen är dessutom redan skördad som L326). Observatörs-designen → T85-triage. |
| 4 | Pilot-skärpningarna 1–8 | **Samtliga antagna FÖRE första pilot-skivan:** SHA-registrering, omgranskningsregeln, validering-efter-fynd och oberoende-ärligheten → T86 § Pilotplanen + do-work-PILOT-blocket (hub 1.20.1); nämnar-definitionerna, escapes-terminologin (ersätter recall-ordet), latens-måttet lokalt-grönt→merge och Marcus-momentet (blocker-fynd + avfärdande-stickprov) → § Pilotplanen. Kadens-tolkningen ("full svit efter sista materiella ändringen", inte hårt maximum) → skill-texten. |
| 5 | Vale utan checksumma · required check obunden till app · cron-timezone-syntaxen · merge-only-husregeln | **Små, trovärdiga, EJ omverifierade** — → T85-triage som kort. |
| 6 | Dokumenttyngden: "minska separata bokförings-PR:er" | **Antagen som riktning:** landningskoordineringen (L328) bor redan i T86 § Körplanen; bokföring landar med sin förändring där det är naturligt. Ingen ny mekanism byggs (över-engineering-vakten). |

### Åtgärder tagna i denna landning

1. CONTRIBUTING § Visuell regression — sanningsfixen (fynd 1).
2. T86-pilotprotokollet v2 — skärpningarna 1–8 inbakade (fynd 4).
3. do-work-skillen (hub 1.20.1): PILOT-blockets SHA-/ompasserings-/
   valideringsrader + kadensradens omformulering.
4. Denna fil committad (låg ocommittad i huvudkatalogen —
   kontinuitets-principen).

### Kvar till Marcus (beslutsklass)

- 36.7-kortformalian och 36.8-timingen (punkt 11 vs T87-ordningen).
- T85-triageflaggorna: mätar-korrigeringskortet, nattlarms-observatören,
  Vale-SHA256, app-bindning av required check, cron-timezone.
- Nightly-visual-frågan (Codex rekommendation 2): aktivera visual i
  nightly FÖRE PR-grinden? Ändrar T87:s ett-stegs-design — grillbar.
