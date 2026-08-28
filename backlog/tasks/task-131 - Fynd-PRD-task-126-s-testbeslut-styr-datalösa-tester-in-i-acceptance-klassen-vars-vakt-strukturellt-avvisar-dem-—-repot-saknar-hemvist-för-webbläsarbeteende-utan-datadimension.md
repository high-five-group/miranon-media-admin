---
id: TASK-131
title: >-
  Fynd: PRD task-126:s testbeslut styr datalösa tester in i acceptance-klassen,
  vars vakt strukturellt avvisar dem — repot saknar hemvist för
  webbläsarbeteende utan datadimension
status: To Do
assignee: []
created_date: '2026-08-02 17:26'
updated_date: '2026-08-28 05:07'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 217000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
STOPPADE TASK-126.2 i CI natten 2026-08-02 (S96). PR #628 står RÖD och olandad. Detta är ett spec-konflikt, inte ett byggfel.

VAD SOM HÄNDE: TASK-126.2 (InstallPrompt, bibliotekskomponent) lade 11 acceptance-tester enligt PRD task-126 § Testbeslut, som säger ordagrant: 'Install-ytans externa beteende (rätt väg per plattform, prompt-flödet, instruktionens tillstånd) testas i acceptance-skarven — hermetiskt, utan staging.' Jobbet 'Test suite / Acceptance (hermetisk)' föll efter 7m12s. 164 tester PASSERADE — inget påstående fallerade. Det som fällde är scripts/hermetik-sjalvtest.mjs, som flaggar alla 11 nya tester med: 'Testet överlever utan fixturens svar och bevisar därför inget om appens databeteende.'

ROTORSAKEN: acceptance-klassen är DEFINIERAD av fixtur-beroende. hermetik-sjalvtest.mjs (task-60 / T104 / ADR-080 beslut 3) kräver att varje test i klassen faller med OmockadRequestError när fixturens svar tas bort. InstallPrompt har inget databeteende — den läser navigator.userAgent, matchMedia och beforeinstallprompt. Att dess tester överlever utan fixturen är korrekt av naturen. Vakten gör alltså rätt; det är placeringen som är fel.

INGEN UNDANTAGSVÄG FINNS: skriptet bär ingen scope-config och ingen exclusion-lista (verifierat: ingen .hermetik-policy.conf, .hermetik/ tom). ADR-080 beslut 3 gör vakten till VILLKOR för klassens existens, inte ett tillägg. Skriptets eget felmeddelande formulerar resolutionen binärt: 'Ett test som överlever utan fixturens svar hör inte hemma i klassen, eller behöver skrivas om så att det faktiskt konsumerar svaret det påstår sig pröva.'

DEN VERKLIGA LUCKAN: repot saknar en hemvist för Playwright-tester som prövar WEBBLÄSARBETEENDE utan datadimension. tests/acceptance/ kräver fixtur-beroende. tests/e2e/ är staging-bundet. tests/api/ är API. tests/a11y/ finns och kör faktiskt fixturfria Playwright-tester (TASK-126.2:s egna tre a11y-beteendetester ligger där och fälls INTE av vakten) — men katalogens namn säger a11y, inte beteende.

ALTERNATIV (ej beslutade — detta är Marcus):
A. Flytta de 11 testerna ur acceptance-klassen till en ny, explicit namngiven klass för datalöst webbläsarbeteende. Orkestrerarens rekommendation: vakten är konstitutiv by design, och att urholka den träffar exakt det ADR-080 skyddar.
B. Ge hermetik-sjalvtest.mjs en config-driven undantagslista per repots .conf-konvention. Billigast, men försvagar en vakt som ADR-080 gjorde till villkor.
C. Skriva om testerna så de konsumerar fixtur-data. Avrådes — konstlad koppling till en EF-yta komponenten inte rör.

FÖLJDER OAVSETT VAL: PRD task-126 § Testbeslut måste rättas (den styrde in dem fel), och TASK-126.2:s AC#4 refererar samma skarvar. Systerkorten 126.3 och 126.5 rör samma install-yta och ärver frågan.

INGET FEL HOS AGENTEN: den följde PRD:ns testbeslut exakt, körde npm run test:acceptance lokalt (161/162, den enda röda en känd hem-flake per TASK-121) och hade ingen lokal signal — hermetik-självtestet är ett separat CI-steg, inte del av sviten.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄTTELSE (orkestreraren, samma natt). Kortets och sessionsdokets ursprungliga formulering — att PR #628 'kan landa av sig själv när klassfrågan är avgjord' — är FEL och rättas här.

PR #628 är sedan 2026-08-02 ~17:33 UTC inte bara RÖD utan DIRTY. Main har avancerat 27 commits sedan grenens bas (d5aed8d1). Enda konfliktande filen är 'backlog/tasks/task-126.2 - ...md': grenen bär agentens AC/DoD-bockningar, main bär den parkerings-not orkestreraren skrev efter stoppet. Båda sidor är rena tillägg i olika sektioner — resolutionen är 'behåll båda', men den måste göras för hand.

#628 kräver alltså TVÅ åtgärder, inte en: (1) klassbeslutet i detta kort, och (2) en kortfils-konfliktlösning.

ORSAKEN ÄR ORKESTRERARENS EGEN: att skriva bokföring till ett kort vars ändringar ligger olandade i en öppen PR skapar garanterat en konflikt i just den filen. Noten hade kunnat bo enbart här och i sessionsdokets Del 4, som inte finns på grenen. Fångad som lessons-fragment.

PRECISERING av rättelsen ovan (orkestreraren, samma natt). Rättelsens EGEN attribution var fel och rättas här — sista ledet, ingen vidare kedja.

Rättelsen skrev: 'Kortets och sessionsdokets ursprungliga formulering — att PR #628 kan landa av sig själv när klassfrågan är avgjord — är FEL.' Det stämmer inte. Verifierat mot disk: sessionsdokets Del 4 säger endast 'står öppen, röd och armerad', och TASK-126.2:s not säger 'den kan inte landa röd, och armeringen behöver inte återställas när felet är löst'. Båda var korrekta när de skrevs; de var OFULLSTÄNDIGA eftersom DIRTY inte hade inträffat ännu.

Det direkt felaktiga påståendet — 'den landar av sig själv när klassfrågan är avgjord' — gjordes i orkestrerarens rapport till Marcus, alltså i sessionens efemära trail och inte i någon artefakt.

SAKINNEHÅLLET I RÄTTELSEN STÅR OFÖRÄNDRAT: #628 är röd OCH dirty, kräver klassbeslut plus kortfils-konfliktlösning, och konflikten orsakades av att bokföring skrevs till ett kort med olandade ändringar. Endast attributionen var fel.

KLASSAD ready-for-human / high (orkestreraren, 2026-08-03, på Marcus delegation). SKÄL: HIGH eftersom det är enda kortet som håller färdigt arbete parkerat — PR #628 bär en komplett, granskad bibliotekskomponent som inte kan landa förrän klassfrågan är avgjord. ready-for-human eftersom båda utgångarna är kontraktsbeslut: A flyttar en testklass-gräns, B urholkar en vakt ADR-080 gjorde konstitutiv. Ingen agent kan välja mellan dem utan att besluta åt Marcus.

BESLUT: ALTERNATIV A (Marcus, 2026-08-03). Datalösa webbläsartester får en EGEN, explicit namngiven klass. Vakten i scripts/hermetik-sjalvtest.mjs och acceptance-klassens kontrakt lämnas ORÖRDA — ADR-080 byggde vakten som villkor, inte rekommendation, och ett undantag i den vakten är ett undantag i klassens definition.

Alternativ B (undantagslista i vakten) och C (koppla testerna till fixturdata) är därmed FÖRKASTADE, öppet och med skäl.

OMKLASSAD ready-for-human → ready-for-agent: den mänskliga grinden var valet mellan A/B/C, och det är taget. Kvarvarande arbete är specificerbart.

ARBETET SOM ÅTERSTÅR (utförs i nästa resume, Marcus order):
1. Skapa den nya klassen — katalog + Playwright-projekt + namn som säger vad den prövar (webbläsarbeteende utan datadimension), inte var den råkar bo.
2. Flytta TASK-126.2:s 11 tester dit ur tests/acceptance/. De ligger i PR #628, gren task-126.2-install-prompt-bibliotekskomponent, commit 5b28b6ca.
3. Wira klassen i CI. OBS lärdomen ur TASK-130: verifiera att den nya klassen FAKTISKT anropas av .github/workflows/ — preview-skarven är precedensfallet på en skarv som finns men aldrig körs.
4. Lös kortfils-konflikten i #628 (backlog/tasks/task-126.2-...md — grenen bär AC-bockningar, main bär parkerings-noten; resolutionen är behåll båda).
5. Rätta PRD task-126 § Testbeslut, som styrde testerna fel från början (TASK-130 bär den posten).
6. ADR-bar prövas: klassbytet är svårt att återställa i koherens och resultatet av en verklig avvägning — sannolikt ÖVER baren. Avgörs vid utförandet, inte här.

Kandidat att stänga (registerhygien-passet 2026-08-28, ADR-053: registrera, aldrig tyst): kortets eget Final Summary beskriver arbetet som utfört (ALTERNATIV A), och det är BEKRÄFTAT LANDAT på origin/main. Belägg: git log --oneline --all -- docs/decisions/ADR-094-webblasarbeteende-testklass.md → commit 1956b1ee 'feat(tests): [TASK-131] ny testklass webblasarbeteende'; git merge-base --is-ancestor 1956b1ee origin/main → ANCESTOR (sant, kört 2026-08-28). docs/decisions/ADR-094-webblasarbeteende-testklass.md finns på disk. tests/webblasarbeteende/install-prompt.test.ts finns på disk. .github/workflows/ci-suite.yml rad ~527 har jobbet 'webblasarbeteende' wirat. Sätter INTE Done själv (utanför detta uppdrags mandat) — flaggar till orkestreraren för stängningsbeslut. Ingen AC skriven eftersom kortet redan är överspelat.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ALTERNATIV A UTFÖRT. Ny testklass `webblasarbeteende` (`tests/webblasarbeteende/`, Playwright-projektet `webblasarbeteende`, eget mutexfritt/secret-fritt CI-jobb `Webblasarbeteende` i `ci-suite.yml`) för datalösa Playwright-tester. `scripts/hermetik-sjalvtest.mjs` och acceptance-klassens kontrakt (ADR-080 beslut 3) lämnade ORÖRDA — verifierat: `npm run test:acceptance:sjalvtest` grönt på de kvarvarande 153 testerna (var 164 före flytten; -11 matchar exakt).

ARBETET (de sex punkterna):
1. Klassen skapad: `tests/webblasarbeteende/`, projektet i `playwright.config.ts` (dedikerad dev-server port 5499, samma alltid-färsk-mönster som a11y/visual/acceptance), npm-script `test:webblasarbeteende`.
2. TASK-126.2:s 11 tester flyttade ur `tests/acceptance/` till `tests/webblasarbeteende/install-prompt.test.ts`, plockade ur commit `5b28b6ca` (PR #628) via `git cherry-pick -n`. Import bytt från `./support/acceptance-bas` till plain `@playwright/test` (klassen har ingen fixturvärld). Header-kommentar omskriven för ny hemvist; RUNDA 1–4-historiken (TDD-bevisraden) bevarad oförändrad.
3. Wirad i CI, ANROP BEVISAT: `npm run test:webblasarbeteende` kört lokalt = 11/11 gröna (18,1 s). Jobbet i `ci-suite.yml` är VILLKORSLÖST (inget `run_x`, inget dependabot-skip) och instansieras därför i ALLA tre anropar-ytor via `ci-suite.yml`s reusable-workflow-mekanik (`suite`-jobbets conclusion aggregerar hela den anropade workflowen — samma mekanik som redan bär `Pure + Build`/`Acceptance`, verifierat mot `ci.yml`s `suite`-jobb och `ci-passed`s `needs: [..., suite]`). TASK-130-lärdomen (en grind som aldrig körs är ingen grind — preview-skarvens fall) tillämpad: ingen ny skarv byggd utan bevisad anropskedja.
4. #628 STÄNGS UTAN MERGE (denna kommentar/PR-länk sätts vid PR-öppning). Kortfilskonflikten (grenen bar AC/DoD-bockningar, main bar parkerings-noten) löstes genom att INTE rebasa/merga #628 — i stället grenades färskt från `origin/main` och kod-/testfilerna plockades över. `task-126.2` uppdaterat: AC #1–#3 checkade (sant oavsett testklass), AC #4 lämnat OKRYSSAT med avsikt (ordalydelsen "Acceptance- och a11y-sviterna..." åldrades med flytten — samma "adress kontra avsikt"-lärdom TASK-130 bokförde för 126.4 AC#3); fullständig not tillagd via `--append-notes`.
5. PRD `task-126` § Testbeslut RÄTTAD (denna agents arbetspunkt enligt TASK-130s arbetsfördelning): pekar nu på webbläsarbeteende-klassen (TASK-131/ADR-094) i stället för "acceptance-skarven", och på `ci-suite.yml` Pure+Build i stället för "preview-skarven" (TASK-130s beslut, bokfört där — denna agent utförde bara TASK-126-halvan, rörde INTE `task-126.4`).
6. ADR-bar PRÖVAD ÄRLIGT mot de tre villkoren — samtliga höll: (a) svårt att återställa i KOHERENS (en tredje hermetisk Playwright-klass är en permanent gränsdragning framtida agenter navigerar efter), (b) överraskande utan kontext (tre hermetiska klasser utan en skriven boundary-regel hade varit gissningsarbete), (c) resultat av en verklig avvägning (A mot B mot C, med B:s urholkning av ADR-080 som den verkliga kostnaden). ADR-094 myntad, nummer re-deriverat mot disk vid `origin/main` `e2515cac` (94:e filen — bekräftat fritt, ingen kollision med parallella sessioner). `docs/decisions/README.md`-index och rot-`README.md`s räkneton (93→94) synkade i samma commit (fångat av `check:docs`s ADR-räkningsgrind, som fällde EN gång innan detta fixades — se premiss-avsnittet).

BEVIS I BÅDA RIKTNINGAR: en regression injicerades skarpt i `useInstallPrompt.ts` (iOS-detekteringsgrenen villkorad bort med `false &&`), `npm run test:webblasarbeteende` fällde 2/11 med rätt felsignatur (`toHaveText` väntat 'ios-manuell', fick 'chromium-prompt'), reverten (från scratchpad-backup) gav 11/11 grönt igen. Klassen fäller alltså på riktigt, inte bara vacuöst.

GRINDAR, MÄTTA: `npx @biomejs/biome check .` exit 0 (0 errors, 6 pre-existing warnings/27 infos, orörda av denna diff) · `npm run typecheck` exit 0 · `npm run build` exit 0 · `npm run test:webblasarbeteende` 11/11 grönt (18,1 s) · `npm run test:acceptance` 153/153 grönt (2,6 min) · `npm run test:acceptance:sjalvtest` 153/153 fällda med OmockadRequestError (vakten HÅLLER) · `npm run test:a11y` 79/79 grönt (inkl. 3 nya InstallPrompt-tester) · `npm run test:api` 443/443 grönt · `npm run check:docs` 13/13 gröna (fällde EN gång på ADR-räknings-drift 93≠94, fixat i README.md) · `npm run lint:prose` (Vale) 0 errors (fällde EN gång på 3 st 'dependabot'→'Dependabot', fixat) · `actionlint -color -ignore 'unexpected key "queue" for "concurrency" section'` exit 0 · `yamllint .github/` exit 0.

PREMISS-PASSET (ADR-086): alla fyra uppdragspremisser prövade mot disk.
1. Vakten konstitutiv (ADR-080 beslut 3) — HÖLL, läst i sin helhet.
2. PR #628/gren/commit 5b28b6ca — HÖLL, verifierat med `gh pr view` + `git log`.
3. tests/a11y/ kör fixturfria tester — HÖLL, verifierat (a11y-projektets `fixtures.ts` har ingen route-interception).
4. #628 RÖD och DIRTY, main avancerad sedan noten — HÖLL, och FÖRSTÄRKT: main hade avancerat ÄNNU LÄNGRE än uppdragets 426e6b9e (till e2515cac vid arbetets start, sedan vidare till PR #644 mitt i arbetet) — task-126.2s DoD #5/#6 var redan borttagna av #642 (TASK-132s rättning), och #644 hade redan bokfört TASK-130s arbetsfördelning (Testbeslut-radens ägarskap: task-126 = denna agent, task-126.4 = parallell agent — exakt matchande uppdragets delegation, oberoende bekräftat). Ingen divergens som blockerade; allt bokfört ovan i stället för antaget.

INGET AVVIKANDE FRÅN UPPDRAGET UTÖVER DET SOM STÅR OVAN.
<!-- SECTION:FINAL_SUMMARY:END -->
