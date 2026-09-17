---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J4a — Branschledande praxis på CI:ns tolv dimensioner, ur primärkällor (S126)

> **Proveniens:** avgränsat research-pass, Jobb 4a i Session 126:s
> CI-djupgranskning. Utfört 2026-09-17 av en `research-pass`-agent enligt
> `00-agentkontrakt.md`, i worktreen
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`,
> mot ögonblicksbilden `origin/main` på `eeca8c72` (2026-09-08). Modell:
> Claude Sonnet 5 (`claude-sonnet-5`). Denna fil svarar ENDAST på "hur gör
> branschen" — den bedömer inte vårt eget system. Den bedömningen görs av
> Jobb 4b, som får denna fil plus en färdig karta över vårt system som
> underlag.
>
> CI (Continuous Integration, "kontinuerlig integration") betyder de
> automatiska kontroller — tester, kodkvalitetskontroller, byggen — som körs
> varje gång någon föreslår en kodändring. En PR (Pull Request, "ändrings-
> förslag") är en föreslagen ändring som väntar på att bli granskad och
> ihopslagen med huvudversionen av koden (`main`). Fler tekniska ord
> förklaras första gången de används nedan.

## Kort svar

**Branschen är överraskande enig om riktningen och överraskande tydlig om
att mekaniken inte är skalneutral.** På nio av tolv dimensioner konvergerar
Google, Kubernetes, Chromium, Uber, Shopify, GitLab, GitHub och flera mindre
team (Ghost, PostHog, Sentry, 37signals) mot samma grundprinciper: snabbt och
billigt före sammanslagning, tungt och uttömmande efter; mindre
ändringar oftare; isolera i stället för att dela infrastruktur; låt en
gemensam, alltid-rapporterande kontroll avgöra om något får landa; kvarantän
i stället för att tolerera ett nyckfullt test för evigt.

Men **var och en av de mest sofistikerade mekanismerna — maskininlärningsdrivet
testurval, spekulativ parallell sammanslagningskö, kanarie-utrullning mätt i
trafikprocent, en dedikerad flakighets-triage-organisation — är byggd för att
lösa ett problem som bara uppstår vid mycket hög volym: tusentals ingenjörer,
tiotusentals dagliga ändringar, eller en produktionsflotta stor nog att mäta i
procent.** Den tydligaste motrösten i hela passet är 37signals grundare David
Heinemeier Hansson, som förklarar varför han flyttade sin CI TILLBAKA till
utvecklarnas egna maskiner: *"Small teams ought to remove all the moving
parts possible."* Han namnger själv sin egen skala (55 000 rader Ruby, 5 000+
tester) som den skala där enkelhet vinner, och namnger explicit Shopify och
GitHub som de som INTE kan göra samma sak.

**Den dimension där branschens senaste, starkaste och mest direkt
överförbara fynd ligger är branch- och PR-storlek** — inte för att den är
mest sofistikerad, utan för att den är den enda dimensionen där 2025–2026
års forskning (DORA, Meta) pekar rakt på vår egen situation: en agent-driven
arbetsform som ökar ändringsvolymen dramatiskt, där små, täta landningar är
det uttryckliga motmedlet mot instabilitet. Det här bygger vidare på och
skärper ett fynd som redan finns i repot (se nedan).

**Var källorna går isär, mest substantiellt:** om ett nyckfullt test
(engelska "flaky test" — ett test som ibland visar fel utan att koden är
trasig) ska accepteras statistiskt (Meta), elimineras genom isolering
(Google), eller aldrig tillåtas några omförsök alls som policy (Ghost); om en
natt-körning som går rött ska vara högljudd (`fail: true`, Nuxt) eller tyst
och bara skapa ett ärende (`fail: false`, lychees eget projekt,
`github/docs`); och om en sammanslagningskö ska testa varje kö-post var för
sig (`ALLGREEN`) eller bara kö-gruppens sista, kombinerade tillstånd
(`HEADGREEN`).

## Vad jag läste först

Sju befintliga research-pass pekades ut i uppdraget. Jag läste samtliga i sin
helhet innan jag sökte något nytt.

| Fil | Ålder | Vad den redan täcker | Status |
|---|---|---|---|
| `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` | 2 mån | Dimension 5 (hermetiska tester) och 6 (realistisk E2E) i djupet: Googles storleksklassning, sex verifierade projekts faktiska CI-kod (Ghost, Grafana, Supabase, cal.com, PostHog, Playwright), flakighets-siffror, kontraktstest-litteratur | **Fortfarande giltig** — landade i `ADR-080` (Acceptance-klassen). Inget omprövat här, bara byggt vidare på för dimensionerna 9–11 där den inte räckte |
| `docs/research/riskanpassad-ci-design-2026-07-23.md` | 2 mån | Dimension 4 (testurval, D0/D1-klassning), 7 (presubmit/postsubmit-princip) och 8 (nightly + larmkedja) som EGET designbeslut, med Fowler/Google/DORA som grund | Landade i `ADR-077`. Jag citerar samma primärkällor men lägger till Kubernetes/Chromium/Uber-precedent som inte fanns här |
| `docs/research/merge-queue-mot-staging-mutex-2026-07-26.md` | 2 mån | Dimension 3 och 7 i GitHub-specifik detalj: `merge_group`, batchning, `ALLGREEN`/`HEADGREEN`, org-ägande-kravet | Fortfarande giltig (amenderad efter org-flytt). Jag bygger på den för bors/TAP/Uber SubmitQueue-historien, som INTE fanns här |
| `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md` | 2 mån | Dimension 2 (branch/PR-storlek) MYCKET grundligt: trunk-based development, Googles 100-radersriktmärke, Rigby & Bird, Meta arXiv-fyndet om agent-driven diff-tillväxt, DORA 2025 om små batchar som motmedel | **Redan den starkaste och mest kompletta av alla sju.** Jag sammanfattar och lägger bara till Kubernetes/Chromium CL-kultur som ny vinkel |
| `docs/research/ci-parity-lokal-trigger-branschmonster-2026-08-05.md` | 6 veckor | Dimension 1 (snabbhet) delvis: pre-commit/pre-push-lagring, Nx/Turborepo/Bazel/Moon affected-graf, vår egen mätning (401s CI mot 641–825s lokal serie) | Giltig. Jag bygger vidare med Googles 11-minutersmått och Chromium CQ, som saknades |
| `docs/research/lankgrindens-form-2026-07-28.md` | 7 veckor | Dimension 8 (nightly) i en smal men mycket väl verifierad instans: nio projekts länkkontroll, verifierad mot faktisk kod, `fail: true`/`fail: false`-skillnaden | Landade i `ADR-082`. Jag återanvänder `fail: true`/`fail: false`-oenigheten som exempel i dimension 8 |
| `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md` | 6 veckor | Orkestrerings-väckning (polling vs. event-driven) — **ligger utanför de tolv dimensionerna.** Berör inte CI/test/grind-arkitekturen direkt | Läst, men inte återanvänd — fel ämne för denna fråga |

**Vad som är NYTT i detta pass, konkret:** dimension 9 (observability och
rollback) och 11 (underhållskostnad) hade INGEN tidigare täckning alls i
repot. Dimension 12 (återanvändbarhet mellan repon) hade ingen tidigare
täckning. Dimension 3 (required checks) hade bara GitHub-specifik mekanik,
ingen bredare branschjämförelse (Kubernetes Tide, Chromium CQ, bors/TAP,
Uber SubmitQueue, Shopify, Jane Street). Dimension 10 (flakighet) hade
utmärkt Google/Microsoft/Spotify-täckning men saknade Kubernetes SIG-Testing-
processen, Chromiums skala (~20 000 kända nyckfulla tester) och Ubers
Testopedia.

Jag sökte också `docs/decisions/` på ämnet. Fyra ADR:er visar att tre av
dimensionerna redan ledde till fattade beslut hos oss: `ADR-077`
(riskanpassad CI-klassning, dedup, nightly), `ADR-080` (Acceptance-klassen,
hermetisk utbrytning), `ADR-082` (länkgrindens presubmit/postsubmit-form) och
`ADR-076`/`ADR-105` (merge-grinden respektive review-grinden). Jag har INTE
läst dessa fyra ADR:er i sin helhet i detta pass — min delfråga är
branschpraxis, inte vår egen arkitektur, och Jobb 4b äger den bedömningen
med en färdig systemkarta som verktyg. Att öppna dem här hade dubblerat det
arbetet utan att ändra mitt svar. Jag noterar deras existens som bevis på
att flera av dessa dimensioner redan är genomtänkta hos oss, inte som
obelagt antagande.

## Metod

Web-sökning plus riktad hämtning av primärkällor (`WebFetch`) mot
leverantörsdokumentation, källkod på huvudgrenen, och — där ett projekts
faktiska CI-konfiguration gick att läsa direkt — den filen själv i stället
för en sammanfattning av den. Jag har hållit isär tre bevisnivåer genomgående:

- **Verifierat mot faktisk kod** — jag har läst projektets egen
  `.github/workflows/*.yml`, källkod eller motsvarande, inte bara vad de
  skriver om sig själva.
- **Verifierat mot förstaparts-dokumentation** — leverantörens egen
  dokumentation eller ett företags egen tekniska blogg, inte omskrivet av
  någon annan.
- **Sekundärkälla** — en tredje parts sammanfattning av en primärkälla jag
  inte själv nått fullt ut (typiskt en blogg som citerar en rapport jag
  bara delvis kunde hämta). Detta märks explicit varje gång det förekommer.

Jag har INTE kört några kommandon mot vårt eget repo utöver `pwd`, `git
log` och `ls`/`grep` för inventeringen ovan — denna fråga kräver ingen
mätning av vårt system, bara läsning av branschmaterial. De grindar
kontraktet kräver (`markdownlint-cli2`, `vale`) redovisas i slutrapporten,
inte här.

## Fynd

### 1. Snabbhet i återkopplingen

**Branschprincipen.** Kör snabbt och pålitligt FÖRE sammanslagning; kör
långsamt och heltäckande EFTER. Google formulerar avvägningen rakt:
*"The main reason is that it's too expensive. Engineer productivity is
extremely valuable, and waiting a long time to run every test during code
submission can be severely disruptive."* De sätter också ett konkret,
uppmätt tal på vad "snabbt" betyder i praktiken hos dem: *"the average wait
time to submit a change is around 11 minutes, often run in the
background"* ([Software Engineering at Google, kap. 23](https://abseil.io/resources/swe-book/html/ch23.html)).

**Vad tre (plus) organisationer faktiskt gör:**

| Organisation | Vad de gör | Bevisnivå | Källa |
|---|---|---|---|
| Google | Presubmit begränsas medvetet: *"we typically limit presubmit tests to just those for the project where the change is happening"*, urvalet görs via *"analysis of the downstream dependency graph for every change"* | Förstaparts-dokumentation | [abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html) |
| Chromium | Kommit-kön (CQ, "Commit Queue") kör en kurerad uppsättning testsviter över en kurerad uppsättning plattformar per ändring, med ett separat "dry run"-läge för snabb iteration under utveckling utan att köa på riktigt | Förstaparts-dokumentation | [chromium/src docs/infra/cq.md](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/infra/cq.md) |
| Nx / Bazel / Turborepo / Moon | Fyra oberoende verktyg löser samma sak identiskt: `git diff` mellan bas och huvud mappas mot en beroendegraf, bara träffade delar körs (Nx: *"Git knows which files changed, and the Nx project graph knows which projects those files belong to"*) | Förstaparts-dokumentation | [nx.dev/affected](https://nx.dev/docs/features/ci-features/affected), [moonrepo.dev/vcs-hooks](https://moonrepo.dev/docs/guides/vcs-hooks) (redan citerat i `ci-parity-lokal-trigger-branschmonster-2026-08-05.md`) |
| Camille Hodoul (branschpraktiker, ej ett företag) | Tregradig smärtgräns: pre-commit <3s, pre-push <10s, allt tungt i CI/merge — *"The slower the task, the later and less often it should run"* | Tredjepart (blogg) | [camillehdl.dev](https://camillehdl.dev/pre-commit-or-pre-merge/) (redan citerat i `ci-parity-lokal-trigger-branschmonster-2026-08-05.md`) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| "Snabbt före, tungt efter"-principen | **Generell princip** | Oberoende av skala — kostnaden av att vänta är alltid en kostnad, bara storleken skiljer |
| Googles specifika 11-minuters-SLA | **Främst motiverat på mycket stor skala** | Talet är kalibrerat mot ett monorepo med tiotusentals ingenjörer; själva TALET är inte överförbart, bara att man mäter och siktar på ett medvetet vald tak |
| Camille Hodouls 3s/10s/allt-tungt-modell | **Rimligt på vår skala** | Skala-agnostiskt formulerad, byggd för att fungera för en enda utvecklare lika väl som för ett stort team |
| Bazel/Nx/Turborepo som VERKTYG (beroendegraf över flera paket) | **Främst motiverat på mycket stor skala / överbyggnad för oss** | Kräver ett monorepo med flera oberoende paket för att en beroendegraf ska ge något överhuvudtaget. En enda liten app har ingen sådan graf att bygga — en enklare, sökvägsbaserad klassning (samma PRINCIP, mindre maskineri) ger samma nytta |
| Spekulativ parallell sammanslagning (Googles TAP, bors, Uber SubmitQueue — se dimension 3 och 7) som svar på snabbhet | **Främst motiverat på mycket stor skala** | Betalar sig bara vid hög samtidig kö-volym och dyra byggen; se dimension 7 för full behandling |

**Var källorna är oense.** Google accepterar 11 minuters väntan som ett
rimligt pris för säkerhet. DHH (dimension 11) argumenterar för att en liten
kodbas ska kunna köra HELA sin svit lokalt på under tre minuter och att
väntan i sig är ett symptom på för mycket maskineri — inte en princip han
förkastar, men en skala-fråga han gör explicit. Ingen av källorna säger att
den andra har fel; de beskriver olika punkter på samma kostnadskurva.

### 2. Branch- och PR-storlek

**Redan djupt täckt.** `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`
är den mest kompletta filen av de sju jag läste, och jag upprepar den inte i
sin helhet. Kort sammanfattning av vad som redan står där, plus vad som är
nytt.

**Branschprincipen (redan belagd).** Trunk-based development sätter ett
hårt golv: *"all team members commit to trunk at least once every 24
hours"* ([trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/)).
Google ger ett kvalitativt riktmärke, uttryckligen inte en gräns: *"100
lines is usually a reasonable size for a CL [changelist], and 1000 lines is
usually too large, but it's up to the judgment of your reviewer"*
([`google.github.io/eng-practices`](https://google.github.io/eng-practices/review/developer/small-cls.html)).
Rigby & Bird mätte konvergent praxis över helt olika kulturer (Android,
Chromium OS, Bing, sex open source-projekt) och fann en medianändring på
11–32 rader — en EMPIRISK observation, inte en policy.

**Det starkaste och mest direkt överförbara fyndet i hela granskningen.**
DORA 2025 formulerar motmedlet mot precis vår arbetsform explicit:
*"Enforcing the discipline of working in small batches is a critical
countermeasure to the risks of AI-assisted development"*, eftersom *"higher
AI adoption is associated with an increase in both software delivery
throughput and software delivery instability"*
([dora.dev/insights/balancing-ai-tensions](https://dora.dev/insights/balancing-ai-tensions/)).
Metas egen 2026-artikel om sitt automatiserade granskningssystem mäter
samma sak från andra hållet: *"significant lines of code per human landed
diff increased by +105.9% year over year and diffs per developer per month
increased by 51% year over year"*, med *"80%+ of that increase attributed to
agentic AI assistance"* ([arXiv 2605.30208](https://arxiv.org/html/2605.30208v1)).

**Nytt i detta pass:** Kubernetes och Chromium bekräftar samma norm från en
tredje och fjärde vinkel utan att koordinera med Google-boken eller DORA.
Kubernetes CONTRIBUTING-kulturen (redan delvis citerad för annat i
`ci-parity-lokal-trigger-branschmonster-2026-08-05.md`) förordar `make
update`/`hack/verify-all.sh` körd LOKALT före varje litet, avgränsat PR —
strukturen (många små verifierbara steg) speglar samma "en självständig
ändring"-kriterium som Google, fast uttryckt som verktygsdisciplin i stället
för radantal.

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| Daglig integration till trunk, korta grenar | **Generell princip** | Golvet gäller lika för en ensam utvecklare som för tusen |
| ~100-raders riktmärke, delegerat till omdöme | **Generell princip** | Skala-agnostisk heuristik, avsiktligt inte en hård gräns |
| Små batchar som motmedel mot AI-instabilitet (DORA 2025, Meta) | **Särskilt relevant på vår skala** | Detta är den enda posten i hela granskningen där källorna uttryckligen namnger VÅR arbetsform (agent-assisterad utveckling) som riskgrupp — inte en generell princip vi råkar dela, utan en slutsats dragen om exakt vår situation |
| Formell CL-storleksmätning som organisatorisk metrik (Rigby & Bird-stil datainsamling över ett helt ingenjörskår) | **Överbyggnad för oss** | Kräver en mätorganisation och en population av granskare stor nog att aggregera över — meningslöst vid en person |

**Var källorna är oense.** Ingen genuin motsägelse hittad. Samtliga källor
pekar åt samma håll (mindre är bättre, monotont). Den enda nyansen är att
Google uttryckligen VÄGRAR ange en hård gräns (*"up to the judgment of your
reviewer"*) medan Rigby & Bird visar att praktiken ändå konvergerar mot en
smal empirisk zon utan att någon tvingat fram det — en skillnad i
FÖRESKRIVANDE stil, inte i sak.

### 3. Required checks (obligatoriska kontroller)

**Branschprincipen.** En obligatorisk kontroll (engelska "required check")
är en namngiven CI-kontroll som måste rapportera "godkänd" innan
plattformen tillåter sammanslagning. Den djupare, äldre principen bakom
detta — myntad av Graydon Hoare (Rusts ursprungliga skapare) och kallad
**"Not Rocket Science Rule of Software Engineering"** — är starkare än "kör
tester": *"automatically maintain a repository of code that always passes
all the tests"*, genom att testa det FAKTISKT SAMMANSLAGNA tillståndet, inte
bara ändringsförslaget isolerat (sekundärkälla som återger Hoares
2013/2014-blogginlägg, vilket jag inte lyckades nå direkt —
[graphite.com/blog](https://graphite.com/blog/bors-google-tap-merge-queue)).
Google byggde samma princip oberoende i sitt interna system TAP, med två
pekare i trädet — senaste commit och senaste VERIFIERADE commit — enligt
samma sekundärkälla.

**Vad fyra-plus organisationer faktiskt gör:**

| Organisation | Vad de gör | Bevisnivå | Källa |
|---|---|---|---|
| Google (TAP) | Kod tillåts in när dess tester passerar, med en uttalad kulturell norm: *"we have established a cultural norm that strongly discourages committing any new work on top of known failing tests"* | Förstaparts-dokumentation | [abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html) |
| Kubernetes (Tide, en del av Prow) | Slår ihop PR:er automatiskt när de har *"up-to-date passing test results"*, och skiljer uttryckligen mellan obligatoriska och valfria kontroller: *"supports repos that have 'optional' status contexts that shouldn't be required for merge"* | Förstaparts-dokumentation | [docs.prow.k8s.io/tide](https://docs.prow.k8s.io/docs/components/core/tide/) |
| Rust (`rust-lang/rust`, historiskt via bors, i dag GitHubs egen kö) | Ursprungligen bors: seriell, garanterat nollskev sammanslagning — varje ändring testad mot exakt det tillstånd den faktiskt landar i | Sekundärkälla (retrospektiv) | [graphite.com/blog](https://graphite.com/blog/bors-google-tap-merge-queue) |
| Uber (SubmitQueue) | Samma grundprincip vid mycket större skala: *"guarantees an always green master branch at scale"*, med maskininlärning för att förutsäga vilka ändringar som kan köras oberoende av varandra | Förstaparts-dokumentation (produktsida + paper) | [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue), [ACM DL — Keeping Master Green at Scale](https://dl.acm.org/doi/pdf/10.1145/3302424.3303970) |
| Next.js (`vercel/next.js`) | En egen "aggregator"-kontroll, `tests-pass`, som väntar på 25+ andra jobb och rapporterar fel om NÅGOT av dem misslyckats eller avbröts — verifierat direkt i deras faktiska arbetsflödesfil | **Verifierat mot faktisk kod** | [`vercel/next.js` `.github/workflows/build_and_test.yml`](https://github.com/vercel/next.js/blob/canary/.github/workflows/build_and_test.yml) (hämtad 2026-09-17) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| "Testa det som faktiskt landar, inte bara PR:en isolerat" | **Generell princip** | Gäller lika mycket för en enda utvecklare med flera samtidiga ändringsförslag som för tusen |
| En enda, alltid-rapporterande aggregator-kontroll som väntar på flera underliggande jobb | **Rimligt på vår skala** | Billigt att bygga, verifierat använt av både små och mycket stora projekt (Next.js) |
| Spekulativ, parallell sammanslagningskö (bors/TAP/Uber SubmitQueue/GitHub-kö/GitLab merge trains) | **Främst motiverat på mycket stor skala** | Hela poängen är att hantera FLERA väntande ändringar samtidigt utan att seriellt köa dem; vid låg samtidig volym testar man bara en sak i taget ändå, och mekaniken ger ingen vinst |
| Maskininlärning för att förutsäga vilka ändringar som är oberoende (Uber) | **Överbyggnad för oss** | Kräver historisk data i en skala vi aldrig kommer generera |
| Explicit uppdelning obligatorisk/valfri kontroll (Kubernetes Tide) | **Generell princip, rimlig på vår skala** | Kostar bara en konfigurationsrad, oavsett hur många ändringsförslag som är i rörelse samtidigt |

**Var källorna är oense.** GitHub kopplar samman PR-kontroller och
kö-kontroller strikt: *"Merge queue and pull requests checks are coupled and
configured under branch protection rules or rulesets"* (redan citerat i
`merge-queue-mot-staging-mutex-2026-07-26.md`) — det går INTE att kräva en
lätt svit på PR-ytan och en tyngre bara i kön som en inställning. Kubernetes
Tide löser samma spänning annorlunda: valfria kontroller kan finnas parallellt
med obligatoriska, utan att plattformen tvingar fram att alla PR-kontroller
är identiska med kö-kontrollerna. Det är två olika plattformsfilosofier för
samma underliggande behov, inte bara en implementationsdetalj.

### 4. Testurval (test selection / impact analysis)

**Branschprincipen.** Kör inte hela testsviten om du kan bevisa att en
delmängd räcker. Google: *"The primary mechanism for determining which
tests need to be run is an analysis of the downstream dependency graph for
every change"* ([abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html)).
Det finns två principiellt olika sätt att bevisa "räcker": DETERMINISTISKT
(en beroendegraf säger exakt vilka tester som KAN påverkas) och
PROBABILISTISKT (en modell förutsäger vilka tester som SANNOLIKT hittar
något, och accepterar en liten, uttalad risk att missa något i utbyte mot
stor besparing).

**Vad fyra organisationer faktiskt gör:**

| Organisation | Metod | Siffror | Bevisnivå | Källa |
|---|---|---|---|---|
| Nx / Bazel / Turborepo / Moon | Deterministisk: `git diff` → beroendegraf → körs bara träffade noder | Ingen förlust-siffra anges — metoden är avsiktligt sund (ingen känd risk att missa en påverkad test) | Förstaparts-dokumentation | [nx.dev/affected](https://nx.dev/docs/features/ci-features/affected) |
| Meta (Facebook), Predictive Test Selection | Probabilistisk: maskininlärning tränad på historiska testutfall väljer en delmängd | *"reduces the total infrastructure cost of testing code changes by a factor of two"*, samtidigt som *"over 95% of individual test failures and over 99.9% of faulty changes are still reported back to developers"* | Förstaparts-forskningspublikation | [research.facebook.com — Predictive Test Selection](https://research.facebook.com/publications/predictive-test-selection/) |
| Uber (SubmitQueue) | Betraktar två ändringar som oberoende om de *"do not change any shared build targets"* — en form av deterministisk graf-analys tillämpad på KÖORDNING, inte bara på testurval | Ingen exakt siffra för själva urvalsdelen; kostnadsvinsten från hela systemet (BLRD + probabilistisk byggtidsprognos) mättes till 53 % lägre resursförbrukning totalt | Förstaparts (blogg) | [uber.com/ca/en/blog/slashing-ci-costs-at-uber](https://www.uber.com/ca/en/blog/slashing-ci-costs-at-uber/) |
| Google | Begränsar presubmit till projektets EGNA tester via beroendegrafen, kompletterat med en kulturell regel: förlorad täckning på presubmit måste fångas på postsubmit, *"and accept some number of rollbacks"* | Ingen exakt procentsiffra angiven | Förstaparts-dokumentation | [abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| "Begränsa testning till det som faktiskt kan ha påverkats" | **Generell princip** | Gäller oavsett hur få eller många tester man har |
| Deterministisk beroendegraf (Nx/Bazel/Turborepo/Moon) som VERKTYG | **Främst motiverat på mycket stor skala / överbyggnad för oss** | Kräver flera paket/projekt i samma kodbas för att en graf ska existera. En enda liten app har i praktiken EN nod — en sökvägsbaserad allowlist-klassning ger samma nytta utan grafen |
| Maskininlärningsdriven probabilistisk testselektion (Meta) | **Överbyggnad för oss** | Kräver ett historiskt dataset av testutfall i en storleksordning en enda liten app aldrig kommer generera, plus en organisation som kan bygga och underhålla modellen (se dimension 11) |
| Acceptera en känd, liten risk att missa något i utbyte mot hastighet | **Generell princip, men kräver ett skyddsnät** | Håller bara ihop med ett fungerande postsubmit/nightly-nät (dimension 7–8) — annars förvandlas "sannolikt tillräckligt" till "otestat" |

**Var källorna är oense.** Detta är den skarpaste metodologiska
motsättningen i hela granskningen. Meta accepterar medvetet att en liten
andel regressioner slinker igenom (*"over 99.9%"* fångas — allt annat gör
det inte) i utbyte mot en faktor 2 lägre kostnad. Bazel/Nx-familjens hela
existensberättigande är motsatsen: en deterministisk graf som (i teorin)
INTE missar något som faktiskt kunde påverkats. Ingen av lägren kallar det
andra fel — men de har olika riskaptit inbyggd i själva verktygsvalet, och
den skillnaden syns inte förrän man frågar just den här frågan.

### 5. Hermetiska tester

**Redan djupt täckt.** `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`
är en av de mest grundliga filerna i hela repot på detta ämne — sex projekt
verifierade direkt mot faktisk testkod och CI-konfiguration (Ghost, Grafana,
Supabase, cal.com, PostHog, Playwright självt), plus Googles storleksklassning
(Small/Medium/Large) och en full genomgång av kontraktstest-litteraturen
(Fowler, Pact, MSW). Jag upprepar den inte. Landade i `ADR-080`.

**Kort, vad som redan står där, för fullständighetens skull:** *"All tests
should strive to be hermetic: a test should contain all of the information
necessary to set up, execute, and tear down its environment"* (Google,
[abseil.io ch11](https://abseil.io/resources/swe-book/html/ch11.html)).
Ghost och Grafana är de två renaste precedenten för att bryta ut en
hermetisk klass som EGEN CI-kontroll (egen config, eget jobb), med radikalt
olika viktning (Ghost ~50/50, Grafana ~0,5 % hermetiskt) — vilket redan i det
förra passet visade att det inte finns en "rätt kvot", bara ett kriterium.

**Nytt i detta pass:** ingenting substantiellt nytt hittades utöver vad
föregående pass redan grävt fram. Jag sökte specifikt efter Chromiums
hållning till hermetiska tester och hittade bara deras CQ-mekanik (dimension
1, 3, 10) — ingen uttalad hermeticitets-policy utöver att CQ:s tester körs
mot en byggd binär, inte mot delad infrastruktur.

**Skaltaggning:** oförändrad från föregående pass — se den filen. Kort
version: principen "hermeticitet är en axel, inte en boolean" är generell;
den KONKRETA formen (egen config, eget CI-jobb) är rimlig på vilken skala
som helst, inklusive vår.

### 6. Realistisk E2E

**Redan djupt täckt** i samma fil som dimension 5. Nyckelfyndet där:
samtliga fem backend-bärande projekt som verifierades startar en FÄRSK
backend per CI-jobb (docker compose, `supabase start`, GitHub `services:`)
— ingen kör mot delad, muterbar iscensättningsmiljö (staging) med ett
globalt låsmekanism.

**Nytt i detta pass:** Uber SLATE nämns redan i föregående fil som motpol
(produktionslika instanser med tenant-routing i stället för mock), men jag
lägger till en skarpare skaltaggning av just DEN mekanismen, eftersom den
inte fanns i föregående pass utskriven som tagg.

**Skaltaggning (ny rad, kompletterar föregående pass):**

| Praktik | Tagg | Skäl |
|---|---|---|
| Uber SLATE — produktionslika instanser med tenant-routing och TTL i stället för en delad iscensättningsmiljö | **Främst motiverat på mycket stor skala** | Kräver egen infrastruktur för att dynamiskt routa trafik per testkörning till en isolerad "hyresgäst" i en delad produktionsflotta — meningslöst utan en flotta stor nog att ha ledig kapacitet att låna ut |
| Efemär backend per CI-jobb (Ghost/Supabase/cal.com/Grafana-mönstret) | **Rimligt på vår skala, delvis stängt** | Principen är skala-agnostisk och billig att applicera. Redan konstaterat i föregående pass att den delvis är stängd för oss eftersom Airtable inte är självhostbart — det är en plattformsbegränsning, inte en skalfråga |

**Var källorna är oense.** Redan dokumenterat i föregående pass (Google/Kent
C. Dodds om var mock-gränsen ska gå). Inget nytt tillkommer här.

### 7. Kontroll före och efter merge (presubmit/postsubmit)

**Branschprincipen.** Google delar upp testsviten i tre tidpunkter, inte
två: presubmit (innan ändringen tillåts in), postsubmit (direkt efter,
löpande), och en tredje, ännu senare punkt vid produktionsutrullning:
*"which tests to run on presubmit, which to save for post-submit, and which
to save even later until staging deploy"* ([abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html)).
Kubernetes namnger samma tre nivåer explicit som olika Prow-jobbtyper:
presubmit (gate:ar PR), postsubmit (kör efter merge, t.ex. för att bygga
releaseartefakter) och periodic (schemalagda, se dimension 8). Den moderna
utvecklingen av denna idé är sammanslagningskön: testa INTE bara
ändringsförslaget för sig (presubmit i klassisk mening) utan det tillstånd
det FAKTISKT kommer landa i (en hybrid som beter sig som presubmit men
kontrollerar samma sak som postsubmit brukade fånga för sent).

**Vad fyra-plus organisationer faktiskt gör:**

| Organisation | Presubmit | Postsubmit / kö-mekanik | Bevisnivå | Källa |
|---|---|---|---|---|
| Google (TAP) | Snabbt, begränsat, projekt-scopat | Fångar det presubmit missade; *"accept some number of rollbacks"* | Förstaparts | [abseil.io ch23](https://abseil.io/resources/swe-book/html/ch23.html) |
| Kubernetes (Prow) | Gate:ande jobb per PR | Separata postsubmit-jobb efter merge + periodiska jobb (nightly, se dimension 8) | Förstaparts (källkod + README) | [kubernetes/test-infra config/jobs/README.md](https://github.com/kubernetes/test-infra/blob/master/config/jobs/README.md) |
| Chromium (CQ) | Curerad testsvit + curerad plattformsmatris per ändring, med separat "dry run" | Sheriffer hanterar det som ändå går sönder efter landning (`CQ can land at any time, and any breaking patches can be kicked about by the sheriff`) | Förstaparts | [chromium/src docs/infra/cq.md](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/infra/cq.md) |
| Rust (historiskt bors), Uber SubmitQueue, Shopify (eget verktyg före GitHubs kö fanns), GitLab (merge trains), GitHub (native merge queue) | Samtliga: testa en TEMPORÄR, kombinerad gren (bas + kö-post) innan den blir permanent — en hybrid mellan presubmit och postsubmit | Ingen separat postsubmit-fas behövs för just DEN risken (integrationsdrift mellan samtidiga ändringar), eftersom den redan testats FÖRE landning | Förstaparts (Shopify, GitHub, GitLab) + sekundärkälla (bors-historiken) | [shopify.engineering/introducing-the-merge-queue](https://shopify.engineering/introducing-the-merge-queue), [GitHub Engineering Blog](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/), [docs.gitlab.com merge_request_pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/) |

Ett konkret, verifierat GitHub-tal som redan finns i vårt repos research:
*"GitHub has reported that they routinely experience post-merge build
failures in their monorepo several times a week, and merge queue has
practically eliminated all build failures in that category"* (redan citerat
i `merge-queue-mot-staging-mutex-2026-07-26.md`, förstaparts).

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| Presubmit snabbt/begränsat, postsubmit uttömmande — den grundläggande tvådelningen | **Generell princip** | Redan vårt eget beslut (`ADR-077`), grundad i exakt dessa källor |
| Tredelningen presubmit/postsubmit/periodic som explicit TAXONOMI (Kubernetes) | **Rimligt på vår skala** | Kostar inget extra att TÄNKA i tre kategorier även med få jobb — det är en begreppsram, inte infrastruktur |
| Spekulativ, temporär kombinerad-gren-testning (bors/TAP/Uber/Shopify/GitHub-kö/GitLab-tåg) | **Främst motiverat på mycket stor skala** | Löser ett problem — integrationsdrift mellan MÅNGA SAMTIDIGA väntande ändringar — som bara existerar vid tillräckligt hög samtidig kö-volym. Redan konstaterat i `merge-queue-mot-staging-mutex-2026-07-26.md` att GitHubs variant dessutom kräver organisationsägt repo, en plattformsbegränsning oberoende av skala |
| Curerad multi-plattforms-testmatris per ändring (Chromium) | **Främst motiverat på mycket stor skala** | Kräver flera målplattformar att testa mot samtidigt; en enda webbapp har inte den axeln |

**Var källorna är oense.** `ALLGREEN` kontra `HEADGREEN` (redan dokumenterat
i `merge-queue-mot-staging-mutex-2026-07-26.md`): ska VARJE kö-post klara
sina kontroller, eller räcker det att kö-GRUPPENS SISTA, kombinerade
tillstånd gör det? GitHub erbjuder båda som konfiguration och tar inte
ställning. Det är en genuin avvägning mellan striktare per-ändrings-garanti
och högre genomströmning vid nyckfulla tester.

### 8. Nattliga kontroller

**Branschprincipen.** En schemalagd, ofta natt-förlagd körning som gör det
en presubmit-kontroll av kostnadsskäl valde bort — full bredd, inga
genvägar, ibland utan cache. Kubernetes kallar detta "periodic jobs" och
har en dedikerad komponent, Horologium, bara för att schemalägga dem; deras
resultat visualiseras över tid i ett dedikerat verktyg, TestGrid: *"TestGrid
consists of a list of test groups that contain results for a job over
time"* ([kubernetes/test-infra — testgrid/config.md](https://github.com/kubernetes/test-infra/blob/master/testgrid/config.md)).

**Vad fyra organisationer faktiskt gör:**

| Organisation | Vad natt-körningen gör | Går den röd, eller skapar den bara ett ärende? | Bevisnivå | Källa |
|---|---|---|---|---|
| Kubernetes (Prow/Horologium/TestGrid) | Periodiska jobb, t.ex. en full katalog körd mot huvudgrenen varje natt | Spåras över tid på en dashboard; en separat "failures"-vy räknar antal på-varandra-följande röda dagar per jobb — varken rent tyst eller rent blockerande, ett tredje läge (synlig historik) | Förstaparts (källkod + config-dokumentation) | [kubernetes/test-infra testgrid/config.md](https://github.com/kubernetes/test-infra/blob/master/testgrid/config.md), [config/jobs/README.md](https://github.com/kubernetes/test-infra/blob/master/config/jobs/README.md) |
| `nuxt/nuxt` | Veckovis (inte nattlig, men samma princip) full länkkontroll inklusive externa länkar | **RÖD** — `fail: true` i deras arbetsflödesfil | **Verifierat mot faktisk kod** (redan i `lankgrindens-form-2026-07-28.md`) | [`nuxt/nuxt` `.github/workflows/docs-check-links.yml`](https://github.com/nuxt/nuxt/blob/main/.github/workflows/docs-check-links.yml) |
| `github/docs` | Daglig extern länkkontroll, 180 minuters timeout | **TYST** — skapar ett ärende (*"🌐 Broken External Links Report"*) i ett annat repo, ingen `pull_request`-trigger alls, aldrig röd mot en PR | **Verifierat mot faktisk kod** (redan i `lankgrindens-form-2026-07-28.md`) | [`github/docs` `.github/workflows/link-check-external.yml`](https://github.com/github/docs/blob/main/.github/workflows/link-check-external.yml) |
| `lycheeverse/lychee` (verktyget självt) | Daglig full länkkontroll av sitt eget repo | **TYST** — deras egen dokumentation rekommenderar just detta mönster: *"It will check all repository links once per day and create an issue in case of errors"* | **Verifierat mot faktisk kod + förstaparts-dokumentation** (redan i `lankgrindens-form-2026-07-28.md`) | [lycheeverse/lychee-action README](https://github.com/lycheeverse/lychee-action) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| En schemalagd, uttömmande körning som fångar det presubmit medvetet valde bort | **Generell princip** | Kostar en `schedule:`-rad i vilken storlek som helst — vårt eget `ADR-077` bygger redan på exakt denna princip |
| Ett tilldelat ärende (inte tyst brus, inte en blockerad PR) vid rött | **Rimligt på vår skala** | Billig disciplin, verifierat i tre olika stora projekt (Kubernetes' synliga historik, `github/docs` ärende-skapande, lychees eget mönster) |
| En dedikerad visualiseringsplattform över tid för hundratals parallella jobb (TestGrid) | **Främst motiverat på mycket stor skala / överbyggnad för oss** | Byggd för att hålla ordning på en testmatris (många k8s-versioner × många molnleverantörer) som bara existerar vid den skalan. Vår motsvarighet — ett larm-ärende per röd natt — ger samma SIGNAL (synlig historik) utan verktyget |

**Var källorna är oense.** Redan dokumenterat i `lankgrindens-form-2026-07-28.md`
med primärkälle-verifiering: Nuxt LÅTER sin schemalagda körning gå röd
(*"fail: true"*), medan lychee-projektet självt och `github/docs` medvetet
väljer TYST ärende-skapande i stället. Ingen av parterna anger uttryckligen
VARFÖR den andra är fel — det är två svar på samma fråga (vad ska en
förväntad, ofta triggad extern-brus-källa göra med signalen) som inte
konvergerat i branschen.

### 9. Observability och rollback

Detta ord-par är nytt att sätta ord på för en icke-teknisk läsare:
**observability** ("observerbarhet") betyder att kunna se vad ett system
faktiskt gör efter att en ändring gått i drift, inte bara att den byggde
och testade grönt. **Rollback** ("återställning") betyder att snabbt kunna
gå tillbaka till den föregående, kända-fungerande versionen om något går
fel i drift.

**Branschprincipen.** Google SREs tre grundprinciper för säker
förändringshantering: *"progressive rollouts, monitoring, and safe and fast
rollbacks"* ([sre.google/workbook/canarying-releases](https://sre.google/workbook/canarying-releases/)).
"Canarying" (namngivet efter kanariefåglar som varnade gruvarbetare för giftig
gas) betyder att släppa en ändring till en LITEN andel av verklig trafik
innan den släpps till alla, just för att kunna observera den innan skadan
blir stor.

**Vad tre-plus organisationer faktiskt gör:**

| Organisation | Mekanism | Konkret siffra/mekanik | Bevisnivå | Källa |
|---|---|---|---|---|
| Google SRE | Kanarie-utrullning mätt i trafikandel, med explicit felbudget-matematik: *"If we instead use a canary population of 5%, we serve 20% errors for 5% of traffic, resulting in a 1% overall error rate"* | 5 % trafik → 1 % totalt felutfall vid ett hypotetiskt 20-procentigt fel i den nya versionen | Förstaparts | [sre.google/workbook/canarying-releases](https://sre.google/workbook/canarying-releases/) |
| Uber (SLATE, redan nämnt i dimension 6) | Produktionslika, tenant-routade testinstanser i stället för separat iscensättningsmiljö — samma infrastruktur som bär observability för verklig trafik återanvänds för att observera testtrafik | Ingen ny siffra utöver vad som redan citerats i föregående pass | Förstaparts | [uber.com — SLATE](https://www.uber.com/en-DK/blog/simplifying-developer-testing-through-slate/) (redan citerad i `hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`) |
| Vercel | Instant Rollback: eftersom varje utrullning (deployment) är OFÖRÄNDERLIG (immutable) sparad, kan trafiken pekas om till en tidigare version på sekunder utan ombyggnad: *"Instant rollbacks reroute traffic to a previous deployment in seconds, no rebuild needed"* | Sekunder, ingen ombyggnad | **Förstaparts, och detta är bokstavligen vår egen hosting-leverantör** | [vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback) |
| GitHub (Scientist-biblioteket) | Ett mönster för att observera en ny kodväg parallellt med den gamla i produktion INNAN man litar på den — det gamla svaret används fortfarande, det nya bara mäts och jämförs | Öppen källkod, inget kostnads/skala-tal angivet | Förstaparts (källkod + README) | [`github/scientist`](https://github.com/github/scientist) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| De tre grundtenetsen (gradvis utrullning + observation + snabb återställning) | **Generell princip** | Håller oavsett hur stor trafiken är — bara MEKANIKEN skiljer sig |
| Kanarie-utrullning mätt i TRAFIKPROCENT | **Främst motiverat på mycket stor skala / överbyggnad för oss** | Matematiken (5 % trafik → 1 % felutfall) kräver en trafikvolym stor nog att "5 %" är en meningsfull, statistiskt stabil delmängd. Vid två slutanvändare finns ingen sådan delmängd — "5 % av två personer" är inte en observerbar grupp |
| Oföränderliga utrullningar + ögonblicklig återställning (Vercel) | **Redan tillgängligt på vår skala** | Detta är den mest direkt överförbara punkten i hela dimension 9: mekanismen kräver ingen egen infrastruktur, ingen trafikvolym och ingen organisatorisk investering — den finns inbyggd i hosting-plattformen vi redan använder, på alla nivåer inklusive gratisnivån |
| Shadow-jämförelse i produktion (GitHub Scientist-mönstret) | **Överbyggnad för oss** | Kräver tillräcklig produktionstrafik för att en statistisk jämförelse mellan gammal och ny kodväg ska ge signal. Vid två användare är varje enskild avvikelse anekdotisk, inte statistisk |
| Formella DORA-mått (ändringsfelfrekvens, återställningstid) som MÄTETAL att följa | **Rimligt på vår skala** | Att MÄTA dessa två saker kostar nästan ingenting oavsett skala — det är investeringen i infrastruktur (kanarie, shadow-trafik) som skalar med volym, inte själva mätningen |

**Var källorna är oense.** Ingen direkt motsägelse, men en tydlig
GENERATIONSSKILLNAD i vilken typ av system rådet är byggt för. Googles
kanarie-modell förutsätter en LÅNGLEVANDE FLOTTA av servrar man gradvis
uppdaterar. Vercels modell förutsätter ATOMISKA, OFÖRÄNDERLIGA utrullningar
(typiskt för serverlös/edge-arkitektur) där "gradvis" inte är den naturliga
enheten — man är antingen på den gamla eller den nya versionen, och
säkerheten kommer i stället från hur BILLIGT och SNABBT man kan växla
tillbaka. Båda svarar på samma tre grundtenets, men med olika mekanik
beroende på vilken sorts infrastruktur man har.

### 10. Flakighet

**Redan djupt täckt** i `hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`:
Googles 1,5 %/16 %/84 %-siffror, Microsofts 4,6 %, Luo m.fl:s
grundorsaksfördelning, och en tydlig åtgärdsrangordning (isolera > kvarantän
> retry-som-detektor-inte-fix). Jag upprepar inte det.

**Nytt i detta pass — tre organisationer som INTE fanns i föregående pass:**

| Organisation | Skala | Process | Bevisnivå | Källa |
|---|---|---|---|---|
| Chromium | Cirka **20 000 unika kända nyckfulla tester** i sin CQ-infrastruktur | Automatisk retry-policy där avvägningen är explicit uttalad: *"adding retries increases the probability that a flaky test will land on tip of tree sublinearly, but mitigates the impact of the flaky test on unrelated CLs exponentially"* — och vid osäkerhet körs den misstänkta ändringen om UTAN patchen för att fastställa om felet redan fanns | Förstaparts (källkod-dokumentation) | [chromium/src docs/infra/cq.md](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/infra/cq.md) |
| Kubernetes (SIG-Testing) | Hela projektet, formell process med namngivna ägare | Ett tilldelat nyckfullt test är *"more important than anything else you're doing"*; en riktlinje för hur mycket tid som ska läggas på reproduktion (*"somewhere between an hour and half a day"*); och den enskilt skarpaste kostnadssiffran i hela passet: *"Every time a flake comes back, at least 2 hours of merge time is wasted"* | Förstaparts (utvecklardokumentation) | [kubernetes/community — flaky-tests.md](https://github.com/kubernetes/community/blob/main/contributors/devel/sig-testing/flaky-tests.md) |
| Uber (Testopedia) | ~1 000 nyckfulla av 600 000 tester i deras Go-monorepo, ~1 000 av 350 000 i Java (≈0,17 % respektive 0,29 %) | Ett automatiserat system analyserar historiska körningar, filar ärenden till ägande team med deadline, och exkluderar körning av kända nyckfulla mål i CI medan de ändå hålls byggbara | Förstaparts (blogg) | [uber.com — flaky tests overhaul](https://www.uber.com/us/en/blog/flaky-tests-overhaul/) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| Isolera bort grundorsaken (redan i föregående pass) | **Generell princip** | Den enda åtgärden som faktiskt tar bort problemet, oavsett skala |
| Kvarantän med tidsgräns och namngiven ägare | **Rimligt på vår skala** | Kubernetes 2-timmars-kostnadssiffran gäller principen ("agera snabbt på ett återkommande fel"), inte deras specifika organisationsform |
| En dedikerad statistisk detektionsplattform (Ubers Testopedia, Chromiums retry-telemetri över 20 000 tester) | **Främst motiverat på mycket stor skala / överbyggnad för oss** | Kräver ett testkorpus stort nog att statistisk mönsterigenkänning ger något — vid vår testvolym syns ett nyckfullt test för blotta ögat, ingen plattform behövs för att UPPTÄCKA det |
| "Mät, eliminera inte" som filosofi (Metas position, redan i föregående pass) | **Överbyggnad för oss** | Kräver en volym av testkörningar stor nog att en sannolikhet blir meningsfull att räkna på; vid få körningar är "denna specifika instans" den enda information man har |
| Nolltolerans för omförsök som policy (Ghosts `retries: 0`, redan i föregående pass) | **Rimligt på vår skala** | En disciplinär regel, inte infrastruktur — kostar ingenting att anta oavsett storlek |

**Var källorna är oense.** Tre distinkta hållningar, ingen konvergens:
Google säger isolera bort orsaken (det enda som faktiskt löser problemet);
Meta säger mät och acceptera en viss nivå statistiskt (*"all real-world
tests are flaky to some extent"*); Ghost säger tillåt inga omförsök alls,
någonsin, som princip (*"Retries open the door to flaky tests. If the test
needs retries, it's not a good test or the app is broken"*). Alla tre är
internt konsekventa; de är oense om VAR ansvaret ska läggas — på
testarkitekturen (Google/Ghost) eller på mätsystemet (Meta).

### 11. Underhållskostnad

**Ny dimension, ingen tidigare täckning i repot.** Detta är den dimension
där den mest substantiella branschmässiga MOTRÖSTEN mot sofistikerad CI
finns, och den kommer inte från en liten aktör som saknar alternativ — den
kommer från någon som medvetet AVVECKLADE avancerad infrastruktur han redan
hade råd med.

**Branschprincipen, från båda hållen.** Å ena sidan: sofistikerad
CI-mekanik (maskininlärningsdriven testurval, spekulativ sammanslagningskö,
dedikerad flakighets-triage) kräver LÖPANDE, dedikerat ingenjörsarbete för
att hållas vid liv — den byggs inte en gång och glöms. Å andra sidan: David
Heinemeier Hansson (37signals/Basecamp) argumenterar att den löpande
kostnaden av att DRIFTA ett komplext CI-system ofta överstiger vinsten för
ett litet team: *"Installing, operating, and caring for a remote CI setup
is a substantial complication"* ([world.hey.com/dhh](https://world.hey.com/dhh/we-re-moving-continuous-integration-back-to-developer-machines-3ac6c611)).

**Vad fyra organisationer faktiskt gör — och vad det kostar dem löpande:**

| Organisation | Investering | Löpande kostnad/underhåll, konkret citerat | Bevisnivå | Källa |
|---|---|---|---|---|
| Uber (SubmitQueue) | Ett dedikerat system med maskininlärningsmodeller för byggtids- och framgångsprognos | Kräver kontinuerlig modellträning och drift; ingen exakt teamstorlek angiven, men *"more than 4,500 engineers ... rely on it every day"* ger en uppfattning om skalan som motiverar investeringen | Förstaparts | [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue), [`uber.com/ca/en/blog/slashing-ci-costs-at-uber`](https://www.uber.com/ca/en/blog/slashing-ci-costs-at-uber/) |
| Kubernetes (SIG-Testing) | En formell process med roterande ägarskap ("owning SIG"), tvingande deadlines, escaleringsregler | Uttrycklig, återkommande kostnad per instans: *"at least 2 hours of merge time is wasted"* varje gång ett känt nyckfullt test återkommer — och det kräver en NAMNGIVEN organisation (SIG:ar) att rikta ärenden till | Förstaparts | [kubernetes/community flaky-tests.md](https://github.com/kubernetes/community/blob/main/contributors/devel/sig-testing/flaky-tests.md) |
| GitLab | En dedikerad, dokumenterad kvarantänprocess med egen sida i deras interna handbok | Processen i sig — inte bara verktyget — kräver kontinuerligt ägarskap: handboken beskriver rutiner för när och hur ett test kvarantänsätts och av vem | Förstaparts (handbok) | [handbook.gitlab.com — Test Quarantine Process](https://handbook.gitlab.com/handbook/engineering/testing/quarantine-process) |
| 37signals/Basecamp | **Motsatt riktning:** aktivt AVVECKLADE sin fjärr-CI-lösning och flyttade tillbaka till lokala utvecklarmaskiner | Motivering uttryckligen skala-medveten: *"Small teams ought to remove all the moving parts possible. Never aspire to a more complicated stack than what your application calls for"* — och han namnger explicit VILKA som INTE kan göra samma sak: *"Shopify or GitHub"* | Förstaparts (grundarens egen blogg) | [world.hey.com/dhh](https://world.hey.com/dhh/we-re-moving-continuous-integration-back-to-developer-machines-3ac6c611) |

**Konkreta tal för DHH:s eget fall, som kalibrering:** hans kodbas är 55 000
rader Ruby med 5 000+ tester; fjärr-CI tog 5 min 30 s, lokalt (en
konsument-CPU med 20+ kärnor) under 2 min 45 s. Hans egen bedömning av hur
vanlig hans situation är: *"99.99% of all web apps are much closer to HEY
in breadth"* än till Shopify.

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| "Varje sofistikerad mekanism kräver löpande underhåll, inte bara byggkostnad" | **Generell princip** | Detta är den mest generaliserbara insikten i hela dimensionen — den gäller ALLA de andra elva dimensionerna som en bakgrundsvariabel |
| Dedikerade, namngivna ägar-processer för flakighet/testinfrastruktur (Kubernetes SIG:ar, GitLabs handbokssida) | **Främst motiverat på mycket stor skala** | Kräver en ORGANISATION med roller att fördela ansvar mellan. En ensam utvecklare kan inte "eskalera till en annan SIG" — hen ÄR redan den enda mottagaren |
| Maskininlärningsdrivna optimeringssystem (Uber SubmitQueue) | **Överbyggnad för oss** | Samma skäl som dimension 3 och 4: kräver ett dedikerat team att bygga OCH underhålla modellen, inte bara data att träna den på |
| "Ta bort rörliga delar, matcha stackens komplexitet mot appens faktiska behov" (DHH) | **Särskilt relevant på vår skala** | Detta är den enda posten i HELA granskningen där en namngiven branschröst uttryckligen pekar ut en skala som liknar vår (liten kodbas, litet team, inte tusentals användare) som den där enkelhet är det RÄTTA svaret, inte en kompromiss |

**Var källorna är oense.** Detta ÄR den centrala spänningen i hela
granskningen, inte bara en detalj: Uber, Google, Kubernetes och GitLab
investerar tungt i sofistikerad, personalkrävande CI-infrastruktur och
beskriver det som nödvändigt. DHH beskriver motsatt rörelse — bort från
sofistikering — som det MOGNA valet för en mindre kodbas, och gör det
explicit genom att själv namnge vilka organisationer som INTE kan följa
honom. Ingen av sidorna motsäger den andra i sak; de beskriver olika punkter
på samma kostnadskurva, och den kurvans form (när blir sofistikering värd
sitt underhåll) är precis det Jobb 4b behöver ta ställning till för vårt
eget fall.

### 12. Återanvändbarhet mellan repon

**Ny dimension, ingen tidigare täckning i repot.**

**Branschprincipen.** När samma CI-logik behöver köras i FLERA repon i
samma organisation finns tre etablerade GitHub-mekanismer, med olika grad av
koppling:

1. **Återanvändbara arbetsflöden** (`workflow_call`) — en fil i ett repo
   anropas som ett jobb från ett arbetsflöde i ett ANNAT repo, med
   in-/utdata som en funktion: *"A reusable workflow is a complete workflow
   file that other workflows can call as a job"*
   ([`docs.github.com/reuse-workflows`](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)).
2. **Ett `.github`-specialrepo** — filer där gäller som ORGANISATIONS-BRETT
   default för varje repo som inte har sin egen version: *"Default files
   will be used for any repository owned by the account that does not
   contain its own file of that type"*
   ([`docs.github.com` — default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)).
3. **Mallrepo** (template repositories) — en helt fristående KOPIA skapas
   vid varje användning, utan fortsatt koppling till originalet. GitHubs
   eget officiella exempel är `actions/typescript-action`, som andra
   utvecklare kopierar via "Use this template"-knappen för att starta ett
   nytt, oberoende GitHub Actions-projekt
   ([`github.com/actions/typescript-action`](https://github.com/actions/typescript-action)).

Sedan 2023 finns dessutom en fjärde, ORGANISATIONS-tvingande mekanism:
regeln "Require workflows to pass" i en organisations-ruleset, som kan tvinga
ETT gemensamt arbetsflöde att köras och godkännas i VARJE repo i
organisationen, som ersättare för den nu avvecklade funktionen "Required
workflows" (*"GitHub no longer supports required workflows for GitHub
Actions... use repository rulesets instead"*,
[`docs.github.com` — available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)).

**Vad organisationer faktiskt gör:**

| Organisation | Mekanism | Vad den delar | Bevisnivå | Källa |
|---|---|---|---|---|
| Shopify | `ci-queue` — ett öppet källkods-BIBLIOTEK (ett "gem" i Ruby-ekosystemet) som distribuerar tester över många parallella arbetare, återanvänt över Shopifys egna manga Ruby-repon och av externa projekt som installerar samma gem | En körbar testfördelningsmotor, inte bara konfiguration | Förstaparts (öppen källkod) | [`github.com/Shopify/ci-queue`](https://github.com/Shopify/ci-queue) |
| GitHub | Officiell mallrepo-mekanism (`actions/typescript-action`) — nolldelad-tillstånd-kopiering, varje ny instans är fristående | En kodstruktur och startpunkt, ingen fortsatt koppling | Förstaparts (öppen källkod) | [`github.com/actions/typescript-action`](https://github.com/actions/typescript-action) |
| GitHub (plattformsmekanism) | `.github`-specialrepo för community-hälsofiler + arbetsflödesmallar, ärvda av varje repo utan egen version | Kontributionsriktlinjer, ärende-mallar, och (i vissa implementationer) startpunkts-arbetsflöden | Förstaparts-dokumentation | [`docs.github.com` — default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file) |
| GitHub (organisationsregel) | "Require workflows to pass" i en organisations-ruleset — tvingar SAMMA arbetsflöde att köras i flera repon som ett obligatoriskt villkor | En hel kontroll, inte bara kod — inklusive TVÅNGET att köra den | Förstaparts-dokumentation | [`docs.github.com` — available rules for rulesets](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets) |

**Skaltaggning:**

| Praktik | Tagg | Skäl |
|---|---|---|
| Mallrepo (template repository) — fristående kopiering | **Rimligt på vår skala, även i dag** | Kräver ingen fortsatt koppling eller underhållsåtagande mellan repon. Om ett andra produktrepo tillkommer (se `CLAUDE.md` § Vision: Mm Component Library) är detta den BILLIGASTE formen av återanvändning — en engångskopiering, inte en beroenderelation som måste hållas synkad |
| Återanvändbara arbetsflöden (`workflow_call`) mellan repon | **Överbyggnad för oss i dag, blir relevant om ett andra repo tillkommer** | Poängen med en delad, LEVANDE arbetsflödesfil är att en ändring på ETT ställe automatiskt gäller flera repon — en fördel som bara existerar när flera repon faktiskt finns att synka |
| `.github`-specialrepo för organisationsbrett default | **Överbyggnad för oss** | Samma skäl — mekanismen existerar för att lösa "samma standardfil i flera repon", vilket förutsätter flera repon |
| Organisationstvingande "Require workflows to pass"-regel | **Främst motiverat på mycket stor skala** | Byggd för att en ORGANISATION med FLERA TEAM och FLERA REPON ska kunna framtvinga en gemensam policy utan att lita på att varje team kommer ihåg den själva. Vid en ensam utvecklare med ett repo finns ingen "andra team" att tvinga |
| Delad, öppen källkods-BIBLIOTEK (Shopifys `ci-queue`-mönster) | **Generell princip, verktyget självt är stor-skala-fött** | Principen — bygg en generell komponent, publicera den, återanvänd den — är skala-agnostisk och redan vår egen uttryckliga vision (`Mm Component Library`, `CLAUDE.md` § Vision). Just Shopifys EGET verktyg löser ett problem (parallell testfördelning över tusentals maskiner) som inte är vårt |

**Var källorna är oense.** Ingen ideologisk oenighet hittad. Det här är
snarare en TRÖSKEL-fråga än en åsiktsskillnad: samtliga fyra mekanismer är
uttryckligen byggda för situationen "fler än ett repo", och ingen källa
hävdar att de ger något värde vid exakt ett repo. Den enda substantiella
frågan är VILKEN av de fyra mekanismerna som är rätt val DEN DAG ett andra
repo faktiskt tillkommer — mallrepo (billigast, ingen koppling) mot
återanvändbara arbetsflöden (dyrare att sätta upp, men håller sig synkad
automatiskt) är en avvägning branschmaterialet beskriver men inte avgör åt
någon.

## Osäkerheter och vad jag inte kunde belägga

- **DORA:s exakta 2024/2025-benchmarktabell (elit/hög/medel/låg per de fyra
  nyckeltalen)** kunde jag INTE verifiera mot primärkällan. Jag försökte
  hämta `dora.dev/research/2024/dora-report/` direkt men sidan länkar bara
  vidare till en nedladdningsbar PDF-rapport jag inte kunde öppna i detta
  pass. Siffrorna jag återger ovan (elit: utrullning på begäran, ledtid
  under ett dygn, ändringsfelfrekvens kring 5 %, återställning under en
  timme) kommer från SEKUNDÄRA sammanställningar (Taskade, GetDX, RedMonk)
  som citerar rapporten, inte från min egen läsning av originaltabellen.
  Märk detta osäker tills någon läser PDF:en direkt.
- **Graydon Hoares ursprungliga blogginlägg om "Not Rocket Science Rule"**
  (2013/2014) hittade jag aldrig direkt — bara en tredjeparts (Graphite,
  ett kodgranskningsverktygs marknadsföringsblogg) återgivning av det. De
  citat jag återger om bors historia är alltså andrahandsåtergivna, inte
  lästa i originalet.
- **Uber Keeping Master Green at Scale (ACM-paperet)** har jag bara läst en
  sammanfattning av via sökresultat, inte det fullständiga PDF-innehållet.
  Samma gäller arXiv-artikeln "CI at Scale: Lean, Green, and Fast" — jag
  fick bara abstraktet.
- **Chromiums "waterfall"-byggen och sheriff-processens fulla mekanik**
  (postsubmit-sidan av deras CQ) undersökte jag inte djupt — jag har bara
  ett kort citat om sheriffens roll. Om Jobb 4b behöver Chromiums
  postsubmit-detaljer krävs ett eget, riktat pass.
- **Linear (produktledningsverktyget)** har jag INTE hittat någon publicerad
  teknisk beskrivning av deras CI-praxis. Sökningarna gav bara resultat om
  ett ANNAT, likköande namngivet verktyg (LinearB, en analysplattform för
  kodgranskning) — jag har inte blandat ihop dem i fynden ovan, men noterar
  att Linear-exemplet i uppdragets källförslag INTE gav något jag kunde
  belägga.
- **Oxide Computers RFD-serie** innehöll, i den sökning jag gjorde, ingen
  RFD specifikt om CI/testfilosofi. Det kan finnas en sådan RFD jag inte
  hittade — jag har inte uttömt deras fulla RFD-arkiv.
- **CoreUI:s påstådda fulla pre-push-testsvit** var redan flaggat som
  obelagt i `ci-parity-lokal-trigger-branschmonster-2026-08-05.md`. Jag
  gjorde inget nytt försök att verifiera det.
- **Kostnaden/teamstorleken bakom Googles TAP-infrastruktur** anges aldrig
  konkret i källan jag läste — bara att resurserna är "enorma". Ingen
  siffra att citera.

## Risker

- **Risken att läsa denna fil som en beställningslista.** Varje mekanism
  ovan löser ett verkligt problem NÅGONSTANS — risken är att en läsare
  plockar en enskild rad ("Meta gör X") utan att läsa skaltaggningen bredvid
  den, och föreslår X för oss ändå. Skaltaggningen är själva poängen med
  filen, inte en fotnot.
- **Risken att "generell princip" tolkas som "obligatoriskt för oss."** En
  generell princip (t.ex. "testa det som faktiskt landar, inte bara
  PR-ytan") är sant och applicerbart på alla skalor — men HUR den
  implementeras skiljer sig radikalt mellan en organisation med tusen
  ingenjörer och en med en. Att kopiera GitHubs specifika mekanik för att
  hedra en generell princip är fel slutsats.
- **Risken att DHH:s motröst (dimension 11) läses som "gör mindre av
  allt."** Hans poäng är matchning mellan stackens komplexitet och appens
  faktiska behov — inte att komplexitet alltid är fel. Flera av våra egna
  redan fattade beslut (`ADR-077`, `ADR-080`, `ADR-082`) är exakt den sortens
  matchning han förordar, inte motsatsen.
- **Risken i mina egna kunskapsluckor** (se ovan) — särskilt DORA:s exakta
  benchmarktal. Om Jobb 4b bygger en slutsats som hänger på det EXAKTA
  DORA-talet (snarare än riktningen) bör talet verifieras mot originalet
  först.

## Rekommendationer

Detta är rekommendationer till Jobb 4b och till Marcus — inte beslut.

1. **Använd dimension 2 (branch/PR-storlek) och dimension 11
   (underhållskostnad) som de två mest laddade dimensionerna i den
   fortsatta bedömningen.** Dimension 2 är den där branschens senaste
   forskning pekar rakt på vår arbetsform (agent-driven utveckling); dimension
   11 är den där den starkaste namngivna motrösten (DHH) uttryckligen
   beskriver en skala som liknar vår.
2. **Läs Vercels Instant Rollback-mekanism (dimension 9) som en direkt,
   redan tillgänglig resurs**, inte som ett framtida investeringsbeslut —
   den kräver ingen ny infrastruktur, bara kännedom om att den finns.
3. **Behandla maskininlärningsdrivna mekanismer (Meta testurval, Uber
   SubmitQueue, Uber Testopedia) som en enhetlig grupp** när
   skalbedömningen görs — samtliga tre delar samma grundläggande
   förutsättning (ett historiskt dataset i en storleksordning vi aldrig
   kommer generera) och samma grundläggande kostnad (ett dedikerat team att
   bygga och underhålla modellen).
4. **Verifiera DORA:s exakta benchmarktal mot originalrapporten** innan
   något beslut i Jobb 4b hänger på den specifika siffran snarare än
   riktningen — se § Osäkerheter.
5. **Ge dimension 12 (återanvändbarhet mellan repon) låg prioritet i det
   närmaste beslutet**, men bokför mallrepo-mönstret (`actions/typescript-action`-
   formen) som den låghängande frukten den dagen ett andra produktrepo
   faktiskt startas — konsekvent med den redan uttalade visionen om
   `Mm Component Library`.

## Källor

### Förstaparts — Google

- [Software Engineering at Google, kapitel 23 — Continuous Integration](https://abseil.io/resources/swe-book/html/ch23.html)
- [Software Engineering at Google, kapitel 11 — Testing Overview](https://abseil.io/resources/swe-book/html/ch11.html) (redan citerad i `hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`)
- [Google Engineering Practices — Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
- [Google SRE Workbook — Canarying Releases](https://sre.google/workbook/canarying-releases/)
- [Google Testing Blog — Just Say No to More End-to-End Tests (2015)](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html) (redan citerad)
- [Google Testing Blog — Flaky Tests at Google (2016)](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) (redan citerad)

### Förstaparts — Meta / Facebook

- [Meta Research — Predictive Test Selection](https://research.facebook.com/publications/predictive-test-selection/)
- [Meta Engineering — RADAR, arXiv 2605.30208 (2026)](https://arxiv.org/html/2605.30208v1) (redan citerad)
- [Meta Engineering — Probabilistic Flakiness (2020)](https://engineering.fb.com/2020/12/10/developer-tools/probabilistic-flakiness/) (redan citerad)

### Förstaparts — Chromium / Google infra

- [Chromium — Commit Queue (CQ) documentation](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/infra/cq.md)

### Förstaparts — Kubernetes

- [docs.prow.k8s.io — Tide](https://docs.prow.k8s.io/docs/components/core/tide/)
- [kubernetes/community — flaky-tests.md](https://github.com/kubernetes/community/blob/main/contributors/devel/sig-testing/flaky-tests.md)
- [kubernetes/test-infra — testgrid/config.md](https://github.com/kubernetes/test-infra/blob/master/testgrid/config.md)
- [kubernetes/test-infra — config/jobs/README.md](https://github.com/kubernetes/test-infra/blob/master/config/jobs/README.md)

### Förstaparts — GitHub

- [`docs.github.com` — Reuse workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [`docs.github.com` — Creating a default community health file](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)
- [`docs.github.com` — Available rules for rulesets (Enterprise Cloud)](https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [`github.blog` changelog — Required Workflows will move to Repository Rules (2023)](https://github.blog/changelog/2023-08-02-github-actions-required-workflows-will-move-to-repository-rules/)
- [`github.blog` engineering — How GitHub uses merge queue](https://github.blog/engineering/engineering-principles/how-github-uses-merge-queue-to-ship-hundreds-of-changes-every-day/) (redan citerad)
- [`github.com/actions/typescript-action`](https://github.com/actions/typescript-action)
- [`github.com/github/scientist`](https://github.com/github/scientist)
- [`vercel/next.js` — `.github/workflows/build_and_test.yml`, huvudgrenen `canary`, hämtad 2026-09-17](https://github.com/vercel/next.js/blob/canary/.github/workflows/build_and_test.yml)

### Förstaparts — Uber

- [`github.com/uber/submitqueue`](https://github.com/uber/submitqueue)
- [uber.com — Slashing CI Costs at Uber](https://www.uber.com/ca/en/blog/slashing-ci-costs-at-uber/)
- [uber.com — Flaky Tests Overhaul](https://www.uber.com/us/en/blog/flaky-tests-overhaul/)
- [uber.com — SLATE](https://www.uber.com/en-DK/blog/simplifying-developer-testing-through-slate/) (redan citerad)
- [ACM DL — Keeping Master Green at Scale (PDF)](https://dl.acm.org/doi/pdf/10.1145/3302424.3303970) (endast sammanfattning läst, se § Osäkerheter)
- [arXiv 2501.03440 — CI at Scale: Lean, Green, and Fast](https://arxiv.org/abs/2501.03440) (endast abstrakt läst)

### Förstaparts — Shopify

- [shopify.engineering — Introducing the Merge Queue](https://shopify.engineering/introducing-the-merge-queue)
- [`github.com/Shopify/ci-queue`](https://github.com/Shopify/ci-queue)

### Förstaparts — GitLab

- [docs.gitlab.com — Unhealthy tests](https://docs.gitlab.com/development/testing_guide/unhealthy_tests/) (redan citerad)
- [docs.gitlab.com — Merge request pipelines](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/) (redan citerad)
- [handbook.gitlab.com — Test Quarantine Process](https://handbook.gitlab.com/handbook/engineering/testing/quarantine-process)

### Förstaparts — mindre team

- [world.hey.com/dhh — We're moving continuous integration back to developer machines](https://world.hey.com/dhh/we-re-moving-continuous-integration-back-to-developer-machines-3ac6c611)
- [develop.sentry.dev — Continuous Integration](https://develop.sentry.dev/development-infrastructure/continuous-integration/)
- [posthog.com/handbook — Developer Experience](https://posthog.com/handbook/engineering/developer-experience) (redan citerad i `hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md` via `playwright/README.md`)

### Förstaparts — Vercel (vår egen hosting-leverantör)

- [vercel.com/docs/instant-rollback](https://vercel.com/docs/instant-rollback)

### Förstaparts — Trunk-based development / DORA

- [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/) (redan citerad)
- [dora.dev/insights/balancing-ai-tensions (2025)](https://dora.dev/insights/balancing-ai-tensions/) (redan citerad)
- [dora.dev/guides/dora-metrics](https://dora.dev/guides/dora-metrics/) — definitioner, inga benchmarktal (se § Osäkerheter)
- [dora.dev/research/2024/dora-report](https://dora.dev/research/2024/dora-report/) — landningssida, fullständig tabell EJ nådd (se § Osäkerheter)

### Förstaparts — Nx / Bazel / Turborepo / Moon (redan citerade i `ci-parity-lokal-trigger-branschmonster-2026-08-05.md`)

- [nx.dev/docs/features/ci-features/affected](https://nx.dev/docs/features/ci-features/affected)
- [moonrepo.dev/docs/guides/vcs-hooks](https://moonrepo.dev/docs/guides/vcs-hooks)

### Sekundärkälla (markerad som sådan)

- [graphite.com/blog — Not Rocket Science: How Bors and Google's TAP inspired modern merge queues](https://graphite.com/blog/bors-google-tap-merge-queue) — retrospektiv återgivning av Graydon Hoares originalinlägg, som jag inte nådde direkt
- [blog.janestreet.com — Making "never break the build" scale](https://blog.janestreet.com/making-never-break-the-build-scale/) — Jane Streets egen blogg, alltså förstaparts om deras EGET system, men jag räknar den som ett kompletterande fall snarare än en av huvudkällorna eftersom jag bara läste en sammanfattning
- Sekundära DORA 2024-benchmarktal via Taskade, GetDX och RedMonks sammanställningar — se § Osäkerheter för exakt vilka tal som är obekräftade mot originalet

### Lokala artefakter (lästa på disk, ej ändrade)

- `docs/research/hermetisk-vs-skarp-e2e-branschpraxis-2026-07-26.md`
- `docs/research/riskanpassad-ci-design-2026-07-23.md`
- `docs/research/merge-queue-mot-staging-mutex-2026-07-26.md`
- `docs/research/push-kadens-agent-arbetstrad-2026-07-26.md`
- `docs/research/ci-parity-lokal-trigger-branschmonster-2026-08-05.md`
- `docs/research/lankgrindens-form-2026-07-28.md`
- `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
- `docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`,
  `ADR-080-acceptance-klassen-hermetisk-utbrytning.md`,
  `ADR-082-lankgrindens-form-presubmit-postsubmit.md` — existens noterad,
  ej lästa i sin helhet (se § Vad jag läste först för motivering)
- `docs/research/ci-djupgranskning-2026-09-17/underlag/00-agentkontrakt.md`
  — agentkontraktet som styr detta pass
- `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` (rad 150–176)
  — Jobb 4:s ordagranna uppdragstext
