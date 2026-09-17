---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.1 — Vilka verkliga fel har nått produktion, och vilken kontroll skyddar mot vart och ett?

> Skrivet av en agent i CI-djupgranskningen (Session 126), 2026-09-17.
> Modell: Sonnet 5 (`claude-sonnet-5`). Ögonblicksbild: `origin/main`
> `eeca8c72` (2026-09-08) — arbetskatalog
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`,
> en fristående utcheckning av samma commit. Session 125:s nightly-analys
> (2026-09-17) hämtades via `git show origin/docs/s125-fodelse:...` eftersom
> den grenen ännu inte var mergad till `main` vid skrivtillfället — det är
> "pågående, ej landat" och behandlas så här.

## Kort svar

**Ja, verkliga fel har nått produktion — minst fjorton gånger sedan maj 2026
— och de flesta av dem hade **ingen** automatisk kontroll som skulle ha
fångat dem, av två olika och legitima skäl.** Det första skälet: flera fel
var designluckor (var lagras ett tillstånd? vilken mängd filtrerar en
plockare mot?) som ingen automatisk grind kan upptäcka utan att någon redan
vetat att just den frågan behövde ställas — de hittades av Marcus när han
använde appen, inte av ett test. Det andra skälet är en **medveten
arkitektur**: de två tyngsta produktkontrollerna — riktig inloggning/data
(`Staging API + E2E`) och tillgänglighet (`A11y`) — körs **inte** före en
merge (en sammanslagning av kod till huvudgrenen `main`) utan **efter**,
på ett schema som liknar Googles "presubmit/postsubmit"-mönster. Det är
skrivet ut öppet i koden (`.github/workflows/ci.yml:2271-2273`) och backas
av ett eget skyddslager (`post-merge.yml`) som mäter — men inte stoppar —
hur länge ett fel hinner ligga i produktion innan någon larmas.

Den enda kontroll som **bevisligen** har fångat en verklig sårbarhet gång på
gång, med legitimitet bortom allt tvivel, är beroendegranskningen
(`audit-ci`, jobbet **Audit dependencies**): den stoppade ett publicerat
skadligt npm-paket innan det någonsin installerades (maj 2026), och har
sedan dess fällt fyra ytterligare verkliga säkerhetsvarningar (esbuild,
linkify-it, js-yaml, och just nu — 2026-09-17 — `sharp` och `smol-toml`).
Den enda kontroll vars **frånvaro** en gång släppte igenom ett trasigt
resultat till `main` är slutgrinden ("CI Passed or Skipped"): 2026-07-23
mergades en röd pull request (PR — ett granskningsbart ändringsförslag)
eftersom slutgrinden tolkade "hoppades över" som "godkänd". Felet upptäcktes
och lagades inom minuter, och just den lagningen (fail-closed, dvs. grinden
säger explicit nej vid minsta osäkerhet i stället för att anta ja) är i dag
den mest skarpt bevisade kontrollen i hela systemet.

De flesta processkontrollerna (dokumentation, backlog-kort, sessionsdok) är
väl motiverade för sitt eget syfte — men de skyddar **aldrig** det Lotta
faktiskt använder, och nattnätet har därför stått rött i tolv nätter i rad
(2026-09-06 till 2026-09-17) av sex orsaker, ingen av dem en produktbugg.

## Vad jag läste först

Jag inventerade `docs/research/` (ingen tidigare fil täcker just
incidenthistorik + kontrollkoppling — närmast släkt är
[`riskanpassad-ci-design-2026-07-23.md`](../../riskanpassad-ci-design-2026-07-23.md),
som är designunderlaget för dagens klassning, inte en incidentgenomgång) och
läste hela `00-agentkontrakt.md` i denna gransknings underlagsmapp. Jag läste
samtliga åtta ADR:er som pekats ut (ADR-028, ADR-036, ADR-039, ADR-058,
ADR-077, ADR-083, ADR-099, ADR-127) i sin helhet — ingen av dem förkastar
något jag föreslår här; flera av dem **är** själva incidentrapporten för de
fel jag listar (särskilt ADR-028 för leverantörskedje-attacken och ADR-077
för mutex-incidenten). Jag hittade inget beslut som redan besvarar J8.1 —
frågan "vilket verkligt fel skyddar varje jobb mot" är, vad jag kan se, aldrig
ställd i den formen tidigare i repot. Materialet jag byggde på (BUILD-LOG,
sessionsdok, backlog-kort) är löpande uppdaterat fram till och med 2026-09-08
(Session 123/124); Session 125:s nightly-genomlysning (2026-09-17, samma dag
detta skrivs) är färskast och citeras separat.

## Metod

Jag sökte `docs/BUILD-LOG.md` (3 470 rader), `tasks/todo.md` (8 292 rader)
och `tasks/lessons.d/` (125 fragment) på ord som "prod", "incident",
"regression", "röktest" och specifika kortnummer Marcus uppdrag redan pekade
ut (`TASK-338/339/340/359/361/367/431/433/434/435`). Jag läste
motsvarande `backlog/tasks/*.md`-kort i sin helhet för varje träff som såg ut
att vara ett verkligt produktionsfel, inte bara en refaktorering. Jag läste
`.github/workflows/*.yml` (samtliga åtta filer) rad för rad för de avsnitt
som avgör VAD som körs VAR och NÄR, och `scripts/check-docs.sh` för de
fjorton dokumentationsgrindarna. Jag körde `gh run list --workflow ci.yml
--status failure` (2026-09-17) och stickprovade två körningar med `gh run
view --json jobs` för att se vilka jobb som faktiskt fällde. Jag hämtade
Session 125:s nightly-genomlysning via `git show` mot en ännu olandad gren.

Jag har **inte** hunnit läsa GitHub-ärendena (`gh issue list`) i detalj,
inte hela `tasks/lessons/vol-01`–`vol-08.md` (bara `lessons.d/`-fragmenten
och riktade träffar), och inte de äldre arkiverade sessionsdoken före
Session 60 — mina fynd är alltså starkast för perioden maj–september 2026,
vilket också är hela produktionsperioden (appen gick live i Fas 4,
2026-08-17, med intern användning av Marcus dessförinnan).

## Fynd

### Delfråga 1 — Vilka verkliga fel har tidigare nått produktion?

**Ordförklaring för denna tabell:** "Prod" betyder produktionsmiljön —
appen och basen (databasen) som Lotta faktiskt använder, till skillnad från
"staging" (en testkopia) eller den hermetiska (helt isolerade, mockade)
testmiljön. "Merge" betyder att en kodändring slås samman till huvudgrenen
`main`, varifrån den automatiskt går live via Vercel (verktyget som bygger
och publicerar appen).

| # | Datum | Vad hände (i klartext) | Rotorsak | Hur upptäcktes | Hur länge levde felet i prod |
|---|---|---|---|---|---|
| 1 | 2026-05-11/12 | Ett skadligt npm-paket (`@tanstack/history`, malware) publicerades av angripare som kapat ett riktigt bibliotek-konto. | Leverantörskedje-attack (supply chain) — inget internt fel. | `npm audit` vid sessionsstart, **innan** paketet någonsin installerades hos oss. | 0 — installerades aldrig. Ett förhindrat fel, inte ett som nådde prod. |
| 2 | 2026-07-23 | En röd (fällande) pull request mergades ändå till `main`, eftersom slutgrinden räknade "hoppades över" som "godkänd" — ett verkligt hål i CI-arkitekturen, inte i appkoden. | Slutgrindens `if`-villkor var "fail-open" (default ja) i stället för "fail-closed" (default nej). | Marcus/orkestreraren märkte den röda körningen på `main` inom minuter. | Minuter. Lagad samma dag med en ny självtestad, fail-closed variant. |
| 3 | (odaterat, före 2026-07-23) | En 8-raders dokumentationsändring tog den enda delade "biljetten" (mutex) till stagingmiljön; en akut revert (återställning) som stod bakom i kön blockerades i **25 minuter 16 sekunder** trots att reverten själv tog under en minut att köra. | Alla ändringar — även rena textfiler — körde samma tunga testsvit mot en delad, enda testmiljö. | Marcus/orkestreraren märkte att reverten inte gick igenom. | ~25 minuter förlorad återställningstid, inget kod-fel i sig. |
| 4 | 2026-07-24 | Ett smoke-test (ett snabbt handgjort stickprov mot riktig prod) visade att appen inte kan skapa event längre fram än december 2026 — den bakomliggande listan i basen ("Månad/år") tar rakt av slut. | Ett val-fält (singleSelect) i Airtable-basen har en hårdkodad lista av månader som slutar 2026-12. | Manuellt smoke-test av en människa/agent, inte ett automatiskt test. | **Fortfarande olöst 2026-09-17** — se § Risker. |
| 5 | 2026-08-10 16:47 | Fem serverfunktioner (Edge Functions) deployades av misstag till fel Supabase-projekt — riktig prod i stället för avsett mål. | En CLI (kommandoradsverktyg) var länkad mot prod sedan en tidigare session; ingen kontroll verifierade länken före en skarp operation. | Marcus/orkestreraren, manuellt, samma dag. | Timmar — täckt innan det gjorde skada, men utan mekaniskt skydd i stunden. |
| 6 | (upptäckt igen 2026-09-02) | Inbjudningslänkar till nya användare landade på appens rotsida i stället för lösenordssidan — steget för att sätta lösenord hoppades över. | En miljövariabel (`INVITE_REDIRECT_URL`) saknades i **båda** miljöerna (prod och staging); ett tidigare kort hade redan flaggat frågan men klassat den som "ej blockerande" och den glömdes. | Rediagnostiserad av orkestreraren under en annan uppgift — ingen automatisk larm. | Okänt exakt hur länge (frågan var känd sedan tidigare men obesvarad i minst några veckor). |
| 7 | 2026-09-03 | Lotta registrerade en betalning i prod; bytte flik; raden försvann ur betalningskön. Ingen data gick förlorad, men det SÅG ut så. | Listan över "kvitto att skicka" byggdes av webbläsarens tillfälliga minne (React-state) i stället för att läsas ur databasen (Postgres) varje gång. | Marcus, i produktion, samma dag ("prod-incidenten 2026-09-03 (S115)"). | Upptäckt direkt av Marcus; fixat fyra dagar senare. |
| 8 | 2026-09-02 (landad), upptäckt 2026-09-07 | Ett gemensamt UI-element (`Button.tsx`, appens delade knapp-komponent) fick ett nytt lager runt sin text för att lösa en annan bugg. Det nya lagret saknade en CSS-egenskap (`min-w-0`) — följden: långa filnamn på bilagor slutade klippas av och rann **584 pixlar** utanför sitt kort på datorn, **794 pixlar** på mobilen. | En delad komponent ändrades utan ett test som provade ett extra långt textinnehåll — ingen fixtur (testmiljö) hade någonsin ett sådant namn. | Marcus, i produktion, fem dagar efter att ändringen gick live — allt annat var grönt hela tiden. | 5 dagar. |
| 9 | Design från S100 (okänt datum, sannolikt augusti), upptäckt 2026-09-08 | En "lägg till fler personer"-lista på åtgärdssidan visade aldrig personer som Lotta/Marcus tidigare avmarkerat — de försvann helt ur listan i stället för att visas som avmarkerade. | Koden filtrerade på fel mängd: "syns i listan" i stället för "är markerad". Ett designval som aldrig prövats mot en riktig användare. | Marcus, i produktion. | Okänt (designvalet var flera veckor gammalt; ingen vet exakt när det senast fungerade rätt eftersom det aldrig fungerat rätt). |
| 10 | 2026-09-07 | Det första försöket att driftsätta betalningsflödet till prod (57 serverfunktioner) föll, eftersom en extern tjänst (`esm.sh`, en CDN — ett nätverk som levererar kodpaket) ännu inte hunnit bygga en nypublicerad version av ett bibliotek. | Extern beroende-instabilitet; koden pekade på en rörlig "senaste major-version" i stället för en fast, pinnad version. | Deployskriptet själv (felmeddelande vid körning), inte ett test. | Minuter — omkörning löste det, men klassat som öppen skuld (HIGH) för framtiden. |
| 11 | 2026-09-03 (samma dag som #7) | En konfliktlösning under en sammanslagning av grenar råkade committa ett backlog-kort **med kvarvarande konfliktmarkörer** (`<<<<<<<` osv.) rakt in på `main`. | En katalogbred `git add backlog/tasks/` i stället för att peka ut den enskilda filen; ett icke-ASCII-tecken i sökvägen gjorde att `checkout --theirs` missade filen. | Upptäcktes manuellt, rättat samma dag. | Timmar. Filen är dokumentation (markdown), så ingen bygg- eller typkontroll skulle någonsin ha sett felet. |
| 12 | 2026-09-04 | GitHubs (leverantörens) egen tjänst för sårbarhetsdata (`npm`s advisory-endpoint) blev instabil och blockerade granskningssteget i CI i flera timmar för **alla** pull requests samtidigt — inte ett appfel, men det stoppade allt annat arbete och lämnade nio redan klara ändringsförslag "tyst oarmerade" (redo att landa men utan aktiv order att göra det). | Ett nätverksberoende i en obligatorisk grind saknade en reträttväg (degradering) för när leverantören själv har driftstörning. | Orkestreraren, när landningar slutade gå igenom. | Flera timmar denna dag; löst med en egen, smalare kontroll för just det scenariot. |
| 13 | Löpande sedan maj 2026 | Fyra ytterligare bekräftade säkerhetsvarningar i öppen källkod-beroenden (esbuild, linkify-it, js-yaml, samt `sharp`/`smol-toml` som är **olösta just nu**, 2026-09-17) har fällt beroendegranskningen och blockerat landningar tills de åtgärdats. | Sårbarheter i tredjepartspaket vi beror på — ett normalt, återkommande drag av att bygga med öppen källkod. | Beroendegranskningen (`audit-ci`) i CI, automatiskt, varje gång. | Timmar till dagar per tillfälle — grinden stoppade landning tills fixat, precis som den ska. |
| 14 | 2026-09-06 → 2026-09-17 | Nattnätet (den fördjupade testkörning som går varje natt) har stått **rött tolv nätter i rad**, av sex orsaker — men **noll** av dem är ett fel i appen Lotta använder. | Fem processkontroller (dokumentationsfönster, inkonsekventa backlog-kort, obesvarade larm, en bredare säkerhetsgranskning som redan är känd via #13, samt en instabil extern länkkontroll) plus ett engångs-testflak. | Nattnätets egen larmkedja, automatiskt. | Pågående vid skrivtillfället. |

**Källor per rad**, i ordning: (1) `docs/decisions/ADR-028-supply-chain-incident-respons.md` hela dokumentet. (2)
`docs/BUILD-LOG.md:2876` ("END-PASS-INCIDENTEN") + `.github/workflows/ci.yml:2537-2564`
(dagens fail-closed-lagning). (3) `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` § Beslut 1 +
`.github/workflows/post-merge.yml:82-93` (merge `ed51b95`, revert-PR `#375`, run `30393323548`/`30393415005`). (4) `docs/reference/data-model.md:2130`ff, post 45 ("LIVE-BEKRÄFTAD 2026-07-24 — Session 84, T40-prod-smoken"). (5) hub-`CLAUDE.md` § "Prod-EF-deploy körs via SKRIPTET" + `docs/BUILD-LOG.md:3322`. (6) `backlog/tasks/task-359 - INVITE_REDIRECT_URL-saknades-i-båda-miljöer-—-inbjudan-landade-på-rotsidan-mekanisk-kontroll-docs.md` (hela kortet). (7) `backlog/tasks/task-367 - Fynd-kvitto-att-skicka-bor-i-flikens-minne-...md` (hela kortet) + `docs/BUILD-LOG.md:3421-3430`. (8) `tasks/lessons.d/en-delad-primitivs-inre-wrapper-bryter-konsumenternas-min-w-0-kedja-utan-att-nagot-test-faller.md` + `backlog/tasks/task-431 - ...md` (hela kortet). (9) `tasks/todo.md:52` (Session 124-posten) + `backlog/tasks/task-434 - ...md`. (10) `docs/BUILD-LOG.md:3466-3467` (TASK-433). (11) `docs/BUILD-LOG.md:3426` (S115 avvikelser). (12) `docs/BUILD-LOG.md:3432,3436-3438` (Session 119). (13) `docs/BUILD-LOG.md:736,1178,2960` + Session 125-doket, § Ingångstillstånd ("`audit-ci` lokalt: exit 1, två high"). (14) Session 125-doket (`origin/docs/s125-fodelse:tasks/sessions/2026-09-17-session-125.md`) § Ingångstillstånd, verbatim.

Märkning: rad 1, 2, 3, 4, 7, 8, 9, 12, 13, 14 är **verifierade** — jag har
läst primärkällan (ADR, kort, workflow-fil eller körningslogg) och den
säger vad tabellen säger. Rad 5, 6, 10, 11 är **starkt indikerade** — jag har
läst BUILD-LOG:s sammanfattning och ett kort/en lesson som pekar samma väg,
men har inte själv läst den ursprungliga sessionens fulla transkript eller
körningslogg för den specifika incidenten.

### Delfråga 2 — Vilka av testerna fångar sådana fel? (Täckningsmatrisen)

**Ordförklaring:** en "grind" är ett steg i CI (Continuous Integration —
den automatiska kedjan av kontroller som kör vid varje ändringsförslag) som
kan säga "stopp" eller "gå vidare". "PR-grinden" är grindarna som körs
**före** en merge och som måste vara gröna för att kön ska släppa igenom.
"Post-merge" och "natt" är grindar som körs **efter** att koden redan ligger
på `main`.

| Incident (från tabellen ovan) | Fanns kontrollen VID tillfället? | Vilken kontroll fångar den TYPEN av fel i dag? | I PR-grinden (blockerar merge) eller efteråt? |
|---|---|---|---|
| 1. Malware-paket | Ja — `npm audit` vid sessionsstart var redan rutin. I dag: **Audit dependencies (audit-ci)**, `ci.yml:2098` | Ja, samma mekanism, nu ett eget CI-jobb i stället för en manuell vana. | PR-grinden (obligatorisk, blockerar). |
| 2. Röd PR mergad ändå | Nej — hålet var kontrollens egen konstruktion. | **CI Passed or Skipped**, `ci.yml:2537-2564`, plus dess eget dubbelriktade självtest **`gate-proof.yml`** (kör ett påhittat fel OCH ett påhittat "hoppat över"-läge, kräver att båda ger rätt svar). | PR-grinden — det ÄR slutgrinden. |
| 3. Mutex-blockerad revert | Nej — klassningen (D0/D1/D3, se nedan) fanns inte än. | **`Detect changed files`** (`ci.yml:50-501`), som i dag hoppar över tunga tester för rena dokumentationsändringar. | PR-grinden (avgör VAD som körs, inte om resultatet blockerar). |
| 4. Månad/år-gränsen (fälla 45) | Nej. | **Ingen.** Se § Osäkerheter/Risker — detta är den öppna gränsen ingen kontroll bevakar i dag. | — |
| 5. Fel Supabase-projekt | Nej — deployet gjordes för hand, utanför CI helt. | `scripts/fas4-prod-deploy.sh:73,124-130` verifierar länkat projekt-ID före varje skarp operation. **Detta är INTE en CI-grind** — det är ett manuellt körd skript, prod-deploy sker aldrig via GitHub Actions. | Varken/eller — ett fristående, manuellt körskript. |
| 6. INVITE_REDIRECT_URL saknades | Nej. | `scripts/fas4-prod-deploy.sh --kontrollera` (via `scripts/kontrollera-hemlighets-namn.sh` + `.hemlighets-namn-policy.conf`) listar nu obligatoriska miljövariabler och stoppar om någon saknas. **Samma manuella skript som ovan** — ingen CI-grind. | Varken/eller. |
| 7. Kvitto i flikens minne | Nej — ingen automatisk test fanns för denna arkitektur-egenskap. | **Ingen mekanisk grind i dag.** Fixen (databas-härledning i stället för webbläsarminne) är ett arkitekturval, inte något en generisk grind kan bevaka framåt utan ett specifikt, nyskrivet test för just detta beteende. | — |
| 8. min-w-0-regressionen | Nej — inget test provade extremt lång text i den delade knappen. | Ett NYTT, specifikt hermetiskt test skrevs i samma fix (`dokument-bilagenamn-trunkering.acceptance.test.ts`) och körs nu i **Acceptance (hermetisk)**, `ci-suite.yml:232`. Skyddar framåt MOT EXAKT DENNA regression, inte mot nästa liknande. | PR-grinden. |
| 9. Plockarens exklusionsmängd | Nej. | Ett NYTT "rött-först"-test skrevs i fixen (per kortets notes) och körs i **Acceptance (hermetisk)**. Samma begränsning som ovan — punktinsats, inte generellt skydd. | PR-grinden. |
| 10. esm.sh saknade paketet | Delvis — deployskriptet fällde tydligt i stunden. | Ingen CI-grind alls (extern CDN-tillgänglighet vid MANUELL prod-deploy). Öppen skuld: pinning av `esm.sh`-importen till en exakt version i stället för en rörlig "senaste". | — |
| 11. Konfliktmarkörer på `main` | Delvis-nej — filen är dokumentation (markdown) och ingen av de 14 dokumentationsgrindarna letar efter `<<<<<<<`-mönster. | **Ingen kontroll i dag.** En sådan grind vore billig att bygga (en `grep` i `check-docs.sh`) men existerar inte. | — (skulle i så fall vara PR-grinden). |
| 12. npm advisory-endpoint flappade | Nej. | Egen, smal nätverksdegradering i **Audit dependencies**-jobbet (`TASK-395`): kör ändå om extern endpoint är nere OCH beroendeträdet är oförändrat, annars fail-closed. | PR-grinden. |
| 13. Återkommande GHSA-fynd | Ja, hela tiden. | **Audit dependencies (audit-ci)**, samma som #1. | PR-grinden. |
| 14. Nightly rött 12 nätter | Ja (det ÄR kontrollerna som slår rött). | Sex olika processgrindar i `nightly.yml` — se § Delfråga 3. | Natten (blockerar aldrig merge). |

**Det viktigaste enskilda faktumet i hela matrisen:** `Staging (API + E2E)`
(riktig inloggning, riktig databas) och `A11y (axe-runner)`
(tillgänglighetskontroll) instansieras **aldrig** av PR-grinden — varken vid
en vanlig pull request, i kön (`merge_group`), eller vid en direkt push till
`main`. Det är kodat, medvetet och väl kommenterat, som `run_staging: false`
och `run_a11y: false` i `.github/workflows/ci.yml:2271-2272` (**verifierad**
— jag har läst villkoret och det är ovillkorligt, inget `if` styr det). De
körs i stället på `post-merge.yml` (varje landning på `main`, EFTER att
koden redan är där) och i `nightly.yml` (en gång per dygn). Det är samma
mönster Google beskriver för sina egna "presubmit/postsubmit"-köer, och
skälet som anges i koden är mätt, inte gissat: att köra staging i PR-grinden
kostade väggklocka utan motsvarande nytta eftersom en delad testmiljö bara
kan hantera en åtgärd i taget (samma mutex-problem som incident #3 ovan).
Konsekvensen, öppet bokförd i `post-merge.yml:296-343`, är ett
"exponeringsfönster" — tiden mellan att en ändring går live och att
efterhandskontrollen hinner svara. Systemet **mäter** detta fönster i
sekunder vid varje landning, men **stoppar ingenting** om det blir rött; det
skapar bara ett ärende med ett färdigt återställningsförslag.

### Delfråga 3 — Vilka kontroller finns bara för att de "känns bra att ha"?

Jag hittade **fjorton** rena dokumentationsgrindar (`scripts/check-docs.sh`,
en per `run_gate`-anrop: länkkontroll, markdown-lint, två Vale-körningar
(språkgranskning), sju register-/räkningskontroller och en som just
bevakar att ingen text i repot påstår sig vara en mekanism den inte är —
`check-permissions-claims.sh`, sprungen ur ADR-083). **Ingen enda av dem
rör appens kod.** De skyddar repots egen dokumentation och processens
trovärdighet — inte Lotta. Det gör dem inte värdelösa: ADR-083 beskriver
själv hur en falsk mening ("mekaniserad som spärr") låg oemotsagd i
månader eftersom ingen misstänkte att den var falsk — men frågan "ska
detta blockera en KOD-merge" har ett annat svar för dem än för ett test
som rör appens beteende (se Delfråga 4/5).

Fem av nattnätets sex nuvarande röda orsaker (Session 125-doket, § Ingångstillstånd) är av samma klass:
"Sessionsdok-fönstret" (ADR-099, ett arkiv-städningsfönster för
sessionsdokument), "Backlog-stängning" (ADR-127, att avslutade kort har
avbockade rutor), "Obesvarade larm" (att gamla larmärenden fått svar inom
ett dygn), och "Länkröta — stående ärende". Dessa är **legitima
processkontroller** — de löser verkliga problem som en gång kostade tid att
upptäcka manuellt (se ADR-039 § Kontext: en ADR-räkning som var fel i
månader) — men de är **inte** kandidater för att blockera en kod-merge,
eftersom de per definition inte kan avgöra om appen fungerar. Jag klassar
dem inte som rivningskandidater — bara som feletiketterade om någon kallar
dem "kvalitetsgrindar för produkten".

Den enda kontroll jag hittade som jag **inte** kan hitta en enda verklig
incident bakom, och som ADR:n själv medger detta öppet, är
**Arkitektur-fitness-auditen** (`arch-audit`, ADR-058). Den är inte en
CI-grind (den körs på kommando, vid fasgränser) och den är inte byggd för
att svara på en historisk incident utan för att förebygga arkitektonisk
"drift" — ADR:n citerar branschmönstret (Ford/Parsons/Kua,
*Building Evolutionary Architectures*) som sitt skäl, inte ett eget
produktionsfel. Det gör den inte till "känns bra att ha" i nedsättande
mening — legitima kontroller behöver inte alla ha en egen incident bakom
sig — men den ska inte förväxlas med en kontroll som fångat något verkligt,
och den blockerar aldrig en merge.

### Delfråga 4 — Vilka fel är så allvarliga att de måste blockera en merge?

**MÅSTE BLOCKERA**, med motivering per post:

1. **Lint + TypeCheck** (`ci.yml:516`). Typfel och lintfel är den billigaste
   och snabbaste kontrollen som finns, och historien visar att när den var
   trasig (Session 7, `tsc --noEmit` utan `-b` var en no-op — se ADR-036 §
   Kontext) var typkontrollen falsk-grön utan att någon märkte det på
   veckor. Måste blockera eftersom kostnaden att köra den är sekunder.
2. **Audit dependencies (audit-ci)** (`ci.yml:2098`). Bevisat, upprepade
   gånger (incident 1, 12, 13), att detta är den kontroll som stoppar
   verkliga, publicerade sårbarheter innan de installeras. Måste blockera —
   men se § Delfråga 5 för nyansen mellan "high" (blockerar i dag) och
   "moderate" (bara natten granskar, se `nightly.yml:67-141`).
3. **Acceptance (hermetisk) + dess tvåsidiga bevis** (`ci-suite.yml:232,517`).
   Det tvåsidiga beviset (körning som stänger av mockarna och kräver att
   testerna DÅ failar) är den direkta tekniska kontrollen mot precis den oro
   Marcus uttrycker i uppdragets fråga 8.3 ("en perfekt simulering kan ge
   falsk trygghet om verkligheten ändrats") — den bevisar att mockarna
   faktiskt gör något, inte bara att de finns.
4. **CI Passed or Skipped** (`ci.yml:2537`). Den ENDA kontroll vars egen
   trasighet en gång släppte igenom ett rött resultat. Måste vara
   fail-closed, och är det i dag, med ett eget dubbelriktat självtest
   (`gate-proof.yml`).
5. **Review-backstopp** (`ci.yml:2484`, TASK-173.4). Säkerställer att en
   människa-läsbar riskbedömning existerar innan kön får mergas. Har en känd,
   öppet bokförd lucka (dokumentations-PR:er är undantagna, se hub-`CLAUDE.md`
   § Review-grinden) — men för KOD-ändringar är den rätt att hålla blockerande,
   eftersom review-agenten (den granskande AI-agenten) bevisligen fångat
   verkliga problem innan merge (t.ex. `#2055`s ej nollställda felmeddelande,
   `#2312`/`#2474`s `ask-user`-fynd — `docs/BUILD-LOG.md:3418,3436`).

### Delfråga 5 — Vilka fel kan i stället vara varningar?

**KAN VARA VARNING** (eller redan är det, flyttat till natt/post-merge — jag
bedömer nuvarande placering som rimlig, inte fel):

1. **Staging (API + E2E) och A11y** är redan flyttade ur PR-grinden till
   post-merge/natt (se Delfråga 2). Detta är rätt DESIGNVAL givet den delade
   testmiljöns mutex-begränsning (incident #3 visar priset av motsatsen) —
   MEN det betyder att en accessibility-regression eller en verklig
   API-kontraktsbrytning kan hinna gå live innan någon larmas. Jag
   klassar detta inte som ett misstag — det är en medveten avvägning,
   dokumenterad öppet — men det förtjänar en tydlig varningsetikett:
   "detta är en varning EFTER leverans, inte en spärr FÖRE."
2. **Audit dependencies, moderate severity.** PR-grinden stoppar bara
   `high`/`critical`; `moderate` granskas bara på natten
   (`nightly.yml:67-141`, "Bredare sårbarhetsgranskning"). Rimlig
   riskavvägning — en `moderate`-varning som blockerar VARJE landning tills
   den löses (ofta veckor, i väntan på en uppströms-fix) hade kostat mer än
   den skyddar.
3. **Docs link check-buntens processdel** (11 av 14 undergrindar — allt
   utom lychee/markdownlint/Vale som faktiskt hindrar en trasig länk eller
   ett obegripligt dokument från att publiceras). ADR-count,
   fetch-depth-invarianten, tråd-registrets index osv. är legitima men
   skyddar aldrig produkten — de KAN vara varningar snarare än blockerande
   för en ren KOD-PR som inte rör dokumentation alls (jag har inte kunnat
   verifiera om `Docs link check`-jobbet faktiskt körs eller hoppas över för
   en PR som inte rör någon `.md`-fil — se § Osäkerheter).

### Incidentklasser ingen kontroll täcker i dag

Fyra klasser, konkret:

- **Arkitektoniska tillståndsluckor** (incident #7, prod-incidenten
  2026-09-03): ett UI som
  bygger sin sanning på webbläsarens tillfälliga minne i stället för
  databasen. Ingen generisk grind kan hitta detta i förväg — det kräver
  antingen kod-granskning med rätt fråga i huvudet, eller en specifik,
  medvetet skriven test för just det beteendet.
- **Aldrig-prövade designval mot en riktig användare** (incident #9,
  plockaren): kod som är internt konsekvent men löser fel problem. Samma
  begränsning som ovan.
- **En kalenderbunden datagräns i själva databasen** (incident #4, fälla 45):
  detta är **inte en kodbugg** utan en data-modell-gräns (en lista med
  fasta alternativ som tar slut). Den är **känd, dokumenterad och olöst**
  sedan 2026-07-24. Ingen kontroll — varken i CI eller manuellt — bevakar
  att appen fortfarande kan skapa event när ett nytt kalenderår närmar sig.
- **Konfliktmarkörer eller annat trasigt innehåll i dokumentationsfiler**
  (incident #11): eftersom de 14 dokumentationsgrindarna letar efter
  specifika mönster (länkar, rubriker, frontmatter) men inte efter
  bokstavliga Git-konfliktmarkörer, kan ett sådant misstag i dag nå `main`
  igen på samma sätt.

### Ett rakt, fristående svar på "de fem viktigaste frågornas" fråga 1: "Vilket verkligt produktionsfel skyddar varje jobb mot?"

Skrivet för en läsare utan teknisk bakgrund. Varje rad är antingen "ja, det
här hände på riktigt" eller ett ärligt "nej, det här jobbet finns av ett
annat skäl."

- **Lint + TypeCheck** — skyddar mot skrivfel och typfel i koden. Har inget
  eget enskilt "det här hände"-ögonblick i mitt underlag, men är den
  billigaste kontrollen som finns och var själv en gång trasig utan att
  någon märkte det (se ovan).
- **Audit dependencies** — skyddar mot att ett förgiftat eller sårbart
  paket från internet blir en del av appen. **Ja, det har hänt: ett
  riktigt skadligt paket stoppades i maj 2026, och fyra riktiga
  säkerhetsvarningar har fällts sedan dess (senast pågående nu, 2026-09-17).**
- **Pure + Build** — skyddar mot att appen inte ens går att bygga, eller att
  ren logik (funktioner utan sidoeffekter) ger fel svar. Inget eget
  dokumenterat produktionsfel hittat i mitt underlag, men bygget är
  förutsättningen för att någon av de andra kontrollerna ska betyda något.
- **Acceptance (hermetisk) + dess tvåsidiga bevis** — skyddar mot att appens
  gränssnitt beter sig fel i vanliga användarflöden, testat mot en helt
  isolerad, konstgjord miljö. **Ja: samma mekanism (fixturvärlden) är där
  de NYA testerna för incident #8 och #9 lades till efter att felen redan
  nått Lotta** — kontrollen finns, men den lärde sig av skadan i efterhand,
  den förutsåg den inte.
- **Webblasarbeteende** — jag har inte kunnat fastställa exakt vilket
  verkligt fel detta jobb en gång var svaret på (se § Osäkerheter).
- **Staging (API + E2E)** — skyddar mot att appen pratar fel med den
  riktiga databasen (Airtable/Supabase), sådant en konstgjord testmiljö
  inte kan avslöja. Körs bara EFTER en merge, aldrig före. Ett dokumenterat
  exempel (BUILD-LOG, äldre session) beskriver hur denna klass av kontroll
  fångade att ett ärvt länkfilter i Airtable-formler matchade fel data —
  ett äkta kontraktsfel mellan koden och databasen.
- **A11y (axe-runner)** — skyddar tillgängligheten (att appen går att
  använda med skärmläsare, tangentbord med mera) från att försämras. Körs
  också bara EFTER en merge. Jag hittade inget dokumenterat fall där en
  riktig regression nådde Lotta och sedan fångades här — se § Osäkerheter.
- **Review-backstopp** — skyddar mot att en kodändring landar utan att
  NÅGON (människa eller AI-granskare) någonsin läst igenom den och skrivit
  ett omdöme. **Ja: den granskande AI-agenten har flera gånger hittat
  verkliga problem före merge** (felmeddelande som aldrig nollställs,
  felaktiga premisser i produktbeskrivningar) — men backstoppen i sig
  bevisar bara att ETT dokument finns, inte att granskningen var bra (se
  hub-`CLAUDE.md` § "Vad backstoppen INTE bevisar").
- **CI Passed or Skipped** (slutgrinden) — skyddar mot att något jobb tyst
  hoppas över och ändå räknas som godkänt. **Ja, absolut: det är exakt vad
  som en gång gick fel** (2026-07-23, se incident #2) — och lagningen efter
  den händelsen är i dag systemets mest bevisade enskilda kontroll.
- **De fjorton dokumentationsgrindarna** — skyddar repots egen
  dokumentation från att motsäga sig själv eller peka på döda länkar. De
  skyddar **aldrig** appen Lotta använder. Flera av dem har sitt eget,
  dokumenterade "det här hände"-ögonblick (en ADR-räkning som var fel i
  månader; en falsk mening om en spärr som inte fanns), men det är fel av
  en annan sort än ett produktionsfel.

## Osäkerheter och vad jag inte kunde belägga

- **`Webblasarbeteende`-jobbets ursprungliga incident.** Jag har läst
  koden (`ci-suite.yml:625-683`) och vet VAD den testar tekniskt
  (webbläsarbeteende utan nätverksanrop, fixturfritt), men jag har inte
  hittat den grundande incidenten — vilket verkligt fel som en gång
  motiverade att bygga just detta jobb, till skillnad från att bygga in
  samma tester i `Acceptance`. **Ej verifierbar** inom mitt tidsfönster;
  kräver antingen en sökning i det äldre BUILD-LOG-materialet jag inte hann
  läsa i sin helhet, eller en fråga till den session som byggde jobbet
  (namnet pekar mot TASK-131 enligt en kommentar i `post-merge.yml:35`).
- **Om `Docs link check`-jobbet körs på en ren kod-PR som inte rör någon
  `.md`-fil.** Jag har läst att `changed`-jobbet klassar filer i D0/D1/D3,
  men jag har inte spårat exakt vilket villkor (`ci.yml`s `docs`-jobb, rad
  ~2278) styr instansieringen — om det alltid körs (och därmed alltid
  kostar tid för en ren kod-ändring) eller bara vid dokumentationsändring.
  **Osäker** — spåren pekar åt "villkorat på docs-ändringar" (kommentaren
  vid `docs`-jobbet säger "Conditional på docs-changes"), men jag har inte
  själv läst villkorsuttrycket rad för rad.
- **A11y:s egen fångst-historik.** Jag har inte hittat ett dokumenterat
  fall där `A11y (axe-runner)` fångade en regression som annars hade nått
  Lotta. Det betyder inte att den aldrig gjort det — bara att jag inte
  hittade belägget i mitt sökfönster. **Frånvaro av bevis är inte bevis på
  frånvaro** (agentkontraktets egen regel) — detta bör inte tolkas som att
  jobbet är onödigt.
- **Kompletta GitHub-ärenden.** Jag körde inte `gh issue list --state all`
  fullt ut (uppdraget nämnde det som en källa, men jag prioriterade
  backlog-korten och BUILD-LOG givet tidsramen och att de senare redan gav
  rik, primärkälle-nära information om samma incidenter). Öppna
  `ci-natt`/`ci-post-merge`-ärenden (48 stycken per Session 125-doket) kan
  bära ytterligare produktionsfel jag inte sett.
- **Äldre sessioner (före ~Session 60, 2026-07-08).** Jag har inte läst
  arkiverade sessionsdok från Fas 0–3 i detalj. Appen var inte i produktion
  då (den gick live i Fas 4, 2026-08-17), så risken att jag missat ett
  RIKTIGT produktionsfel där är låg, men inte noll — det kan finnas interna
  Marcus-synliga fel under den tidiga interna körningsperioden jag inte
  fångat.
- **Kontraktsvakten** (`nightly.yml:343-408`, "fixtur mot skarp staging").
  Jag hittade en spår-tråd (en gren `fix/kontraktsvakt-fixtur-pris` som
  föll i CI 2026-09-04) som antyder att den en gång fångat en inaktuell
  prisfixtur, men jag har inte läst det bakomliggande kortet eller commiten
  och kan inte bekräfta detaljerna. **Osäker.**

## Risker

- **Fälla 45 (Månad/år-gränsen) är den enda av de fjorton incidenterna som
  fortfarande är helt olöst och obevakad.** Om Lotta eller Marcus försöker
  skapa ett event med startdatum i 2027 innan detta löses, kommer
  serverfunktionen `create-event` att svara med ett tekniskt felmeddelande
  (HTTP 500) i stället för att skapa eventet. Ingen kontroll — automatisk
  eller manuell — varnar i förväg när det datumet närmar sig.
- **Exponeringsfönstret för Staging/A11y-flytten är mätt men obegränsat.**
  Systemet vet exakt hur många sekunder det tar från merge till svar, men
  det finns inget tak för hur illa det svaret får vara innan något händer
  automatiskt — allt vilar på att en människa eller agent läser det larmade
  ärendet och agerar. En röd post-merge-körning under en period ingen
  bevakar aktivt (natten, en paus mellan sessioner) kan i teorin ligga
  obesvarad — precis den situation "Sannings-avstämning — obesvarade larm"
  (nattnätet) finns för att fånga, men den är själv en av de tolv röda
  nätterna just nu.
- **D0-undantaget (dokumentation) gäller även Review-backstoppen.** En
  ändring som råkar klassas som ren dokumentation (även om den av misstag
  bär trasigt innehåll, som incident #11) går igenom utan att någon
  AI-granskare någonsin tittat på den.

## Rekommendationer

Markerat tydligt som rekommendationer — inga beslut fattas här.

1. **Bygg en liten, billig kontroll som letar efter Git-konfliktmarkörer
   (`<<<<<<<`, `=======`, `>>>>>>>`) i varje committad fil**, som ett
   femtonde steg i `check-docs.sh` eller ett eget snabbt lint-steg. Priset
   är en `grep`; skälet är incident #11, som redan hänt en gång.
2. **Sätt ett datum-larm för Månad/år-gränsen (fälla 45)** — antingen ett
   kalenderpåminnelse-kort i backloggen med förfallodatum några månader
   före nästa årsskifte, eller (bättre, men större arbete) konvertera
   fältet till en beräknad formel som datamodellens egen "Kända fällor"-post
   redan föreslår. Detta bör INTE vänta till nästa gång någon råkar prova
   ett 2027-datum i prod.
3. **Fastställ, genom att läsa `ci.yml`s `docs`-jobb rad för rad (min egen
   osäkerhet ovan), om en ren kod-PR faktiskt kör alla fjorton
   dokumentationsgrindar i onödan** — om ja, är det en kandidat för att
   smalna av, eftersom de per definition inte kan säga något om en
   kod-ändring.
4. **Överväg att dokumentera exponeringsfönstrets p95/p99 (den vanligaste
   väntetiden) som ett eget mått i `nightly-metrics`**, så att frågan "hur
   länge kan ett fel hinna ligga i prod innan post-merge svarar" har ett
   siffersvar i stället för att bara vara en princip.

## Källor

- `docs/decisions/ADR-028-supply-chain-incident-respons.md` (hela dokumentet, inkl. § Updates)
- `docs/decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md` (hela dokumentet)
- `docs/decisions/ADR-039-konsistens-grindar-kadens.md` (hela dokumentet)
- `docs/decisions/ADR-058-arkitektur-fitness-audit-mekanism.md` (hela dokumentet)
- `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` (hela dokumentet, inkl. § Updates 2026-08-28)
- `docs/decisions/ADR-083-prosa-som-pastar-mekanism.md` (hela dokumentet)
- `docs/decisions/ADR-099-sessionsdok-rotens-rullande-fonster.md` (hela dokumentet)
- `docs/decisions/ADR-127-backlog-stangningsformerna-harledd-dod-och-avstadda-krav.md` (hela dokumentet)
- `docs/BUILD-LOG.md` (rader 736, 1178, 1858, 2620–2960, 3300–3470 — sessionerna 74–123)
- `tasks/todo.md` (rader 1–76 — Session 124/123/119/115-posterna)
- `backlog/tasks/task-359 - INVITE_REDIRECT_URL-saknades-i-båda-miljöer-—-inbjudan-landade-på-rotsidan-mekanisk-kontroll-docs.md`
- `backlog/tasks/task-367 - Fynd-kvitto-att-skicka-bor-i-flikens-minne-—-en-registrerad-inbetalning-utan-kvitto-försvinner-ur-betalningsinkorgen-vid-omladdning.md`
- `backlog/tasks/task-431 - Fynd-PROD-REGRESSION-—-långa-bilagenamn-klipps-inte-längre-på-Bilagor-sidan-Mer-→-Bilagor-namnet-rinner-ut-ur-kortet-orsak-TASK-361-r2-s-nya-etikett-span-i-Button.tsx-saknar-min-w-0-och-bryter-truncate-kedjan.md`
- `backlog/tasks/task-434 - Fynd-åtgärdssidans-plockare-Lägg-till-fler-personer-från-eventet-visar-inte-avmarkerade-personer-—-exklusionsmängden-är-listmedlemskapet-inte-markeringen.md`
- `tasks/lessons.d/en-delad-primitivs-inre-wrapper-bryter-konsumenternas-min-w-0-kedja-utan-att-nagot-test-faller.md`
- `docs/reference/data-model.md` (rad ~2130, § Kända fällor, post 45)
- `.github/workflows/ci.yml` (rader 50–2564, hela obligatoriska kedjan)
- `.github/workflows/ci-suite.yml` (rader 89–965, den återanvändbara sviten)
- `.github/workflows/post-merge.yml` (rader 1–380, hela filen)
- `.github/workflows/nightly.yml` (jobblistan, rad 52–698)
- `scripts/check-docs.sh` (rad 198–257, de fjorton grindarna)
- `scripts/fas4-prod-deploy.sh` (rad 73, 124–130)
- `origin/docs/s125-fodelse:tasks/sessions/2026-09-17-session-125.md` (hela Del 1, hämtad via `git show` 2026-09-17)
- `gh run list --workflow ci.yml --status failure --limit 30 --json databaseId,headBranch,createdAt,event,conclusion` (kört 2026-09-17)
- `gh run view 35205123500 --json jobs` och `gh run view 33864133334 --json jobs` (kört 2026-09-17, stickprov)
- hub-`~/.claude/CLAUDE.md` (för agentkontraktets regler, ej som fakta om detta repo)
- Spoke-`CLAUDE.md` § "Review-grinden", § "Prod-EF-deploy körs via SKRIPTET"
