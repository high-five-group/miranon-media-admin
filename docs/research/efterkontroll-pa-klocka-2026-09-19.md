---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# Efterkontroll efter landning: per landning eller på klocka? (2026-09-19)

> **Ordförklaringar som används genomgående.** *Postsubmit* (engelska,
> "efter-inlämning") betyder en kontroll som körs EFTER att en ändring redan
> landat i huvudgrenen — motsatsen är *presubmit*, kontroller FÖRE
> landning. En *klocka* (engelska "schedule"/"cron") är en kontroll som
> startas på fasta klockslag oavsett om något hänt, till skillnad från en
> *händelsestyrd* (event-driven) kontroll som startas AV en händelse (t.ex.
> "kod landade"). *Culprit finding* ("skyldig-identifiering") betyder att
> peka ut EXAKT vilken ändring som orsakade ett fel, när flera ändringar
> hunnit landa innan felet upptäcktes. *Bisektion* är metoden att hitta den
> skyldiga ändringen genom att testa MITTEN av ett misstänkt spann och
> halvera sökrymden upprepade gånger (samma princip som att slå upp ett ord
> i en pappersordbok). En *mutex* ("ömsesidig uteslutning") är ett lås som
> bara en process åt gången får hålla — hos oss `ci-suite.yml`:s
> `staging-tests`-mutex, som gör att bara EN körning kan prata med
> Airtable-baserad staging samtidigt. En *concurrency-grupp* är GitHub
> Actions egen kö-mekanism: körningar i samma namngivna grupp radas upp,
> och som DEFAULT kastas en väntande körning bort så fort en ny anländer i
> samma grupp — det är den mekanism som gör "kör senaste, hoppa
> mellanliggande" (*debounce*, "avstudsning") möjlig utan egen kod.

## Vad jag redan hade att stå på

Jag läste, i denna ordning, INNAN jag sökte något nytt:

1. **`docs/research/ci-djupgranskning-2026-09-17/underlag/j4a-branschpraxis-ur-primarkallor.md`**
   (829 rader, skriven 2 dagar innan detta pass) — dimension 7
   (presubmit/postsubmit) och 8 (nattliga kontroller) täcker Google TAP,
   Kubernetes Prow, Chromium CQ, Rust/bors, GitLab merge trains, GitHub
   merge queue redan i primärkälle-citat. Detta är i praktiken SAMMA
   organisationer frågan bad mig belägga.
2. **`docs/research/ci-djupgranskning-2026-09-17/05-branschjamforelse.md`**
   (1719 rader) — dimension 7 och 8 BEDÖMER redan vårt läge mot ovanstående,
   inklusive den exakta siffran "85 av 686 landningar saknar post-merge"
   och "60 av dem är de verkliga hålen", skärpt i dess § S30 (KG1).
3. **`docs/research/actions-minutbudget-2026-09-18.md`** (719 rader,
   skriven 1 dag innan) — § S3 härleder efterkontrollens minsta möjliga
   kostnad PER LANDNING (23,5 min i stället för 60,4) OM den bara kör det
   ingen annan yta kör (staging + a11y). Paketet P2 sätter Efterkontrollens
   andel till **11 400 min/månad** vid denna kadens.
4. **`ADR-077`** (274 rader, läst i sin helhet) — det styrande beslutet:
   presubmit/postsubmit-delningen, nattnätets roll som "fördröjning på
   högst ett dygn, aldrig ett permanent hål", och N3-mekaniken (spann-
   klassning, `TASK-450.2`, redan LANDAD i `.github/workflows/post-merge.yml`
   och `scripts/classify-post-merge.sh`).
5. **`ADR-076`** (167 rader, läst i sin helhet) — merge-kön, `ALLGREEN`,
   varför direktpush är stängd.
6. **`CONTRIBUTING.md` § Nattnätet** (rad 960–1200) — de tre larmkanalerna
   sedan `TASK-450.1`, kontraktsvakten, nattvakten.
7. **`.github/workflows/post-merge.yml`** (562 rader) och
   **`scripts/classify-post-merge.sh`** (478 rader) i sin helhet — hur
   dagens efterkontroll faktiskt är byggd, mekanism för mekanism.

**Vad som alltså INTE är nytt i detta pass:** att presubmit och postsubmit
är olika saker hos Google/Kubernetes, att merge-kön testar det faktiskt
landande trädet, och att vi redan har ett nattnät som är den riktiga
klockan. Allt detta stod redan skrivet, med källor, två dagar före detta
pass.

**Vad som ÄR nytt:** (a) frågan "ska EFTERkontrollens TRIGGER vara klockan
eller landningen" ställdes aldrig i `j4a`/branschjämförelsen — de frågorna
handlade om VAD som körs och VAR (Google-modellens presubmit/postsubmit-
gräns), inte HUR OFTA/NÄR triggern går. Inget av de nio existerande passen
undersöker culprit-finding (bisektion, Findit, auto-revert) eller
GitHub Actions' egen `schedule`-mekaniks tillförlitlighet. (b) En skarp,
oplanerad incident inträffade UNDER detta forskningspass (se § Eget mätt
nedan) som ger levande, färsk evidens för exakt den fråga jag ska besvara.
(c) DORA:s upptäcktsfönster-riktvärden (tid till återställning) hade ingen
tidigare täckning i repot alls.

## Kort svar

**Behåll landning som trigger — riv aldrig den — men gör triggern
ADAPTIV i stället för att låta den kollapsa okontrollerat under belastning,
som den mätbart redan gör i dag.** Ingen av de sex organisationer jag
verifierade (Google, Kubernetes, Chromium, Rust, GitLab, Mozilla) kör sin
"landade koden hålla?"-kontroll på en klocka. Alla sex triggar den av
HÄNDELSEN "något landade", och reserverar klockan uteslutande för den
SEPARATA, fullständiga svepningskontrollen (vårt `nightly.yml`) — exakt
den arkitektur vi redan har. Orkestrerarens hypotes "Google buntar
postsubmit på klocka" är **falsifierad i sin bokstavliga form**: Google
BATCHAR flera ändringar i en TAP-körning, men bara för att de tar emot
över en ändring per SEKUND — en genomströmnings-optimering, inte ett
klockbeslut. Det är strukturellt samma sak som redan händer HOS OSS när
`staging-tests`-mutexen köar flera landningar bakom varandra — vi har
alltså redan Googles mekanism, fast som en OAVSIKTLIG bieffekt av en
delad lås i stället för ett medvetet designval.

**Den avgörande delfrågan var GitHub Actions' egen dokumentation om
`schedule`:** GitHub skriver rakt ut att schemalagda körningar **kan
fördröjas under hög belastning** och att **köade jobb kan tappas helt**
vid tillräckligt hög belastning. En klocka byter alltså bort ett
problem vi kan mäta och äga (mutex-kö, synlig i varje körnings tidsstämpel)
mot ett problem vi INTE kan mäta eller äga (GitHubs egen infrastrukturlast).
Det är en försämring på båda de mått Marcus bad om: väntetid (klockan
lägger till upp till halva intervallet i VARJE lugnt fall, mot nästan noll
i dag) och fakturerade minuter (mitt egna, försiktiga överslag ger samma
storleksordning som dagens per-landnings-kostnad efter S3, inte mindre).

**Den proffsigaste formen för vår skala är en tredje väg som varken är
"ren klocka" eller "dagens okontrollerade kö":** push-triggad körning i en
FAST (inte per-SHA) concurrency-grupp. GitHubs egen kö-mekanik ger
"kör senaste, hoppa mellanliggande" HELT GRATIS — noll extra kod, noll
schemarisk. Den enda korrigeringen som krävs är att spann-beräkningen (N3)
byter källa från push-händelsens `before`-fält till "senaste FAKTISKT
avslutade körning" hämtad via API — annars återinförs precis det tysta
täckningshål N3 byggdes för att stänga. **Jag hittade ingen branschkälla
som beskriver exakt denna kombination — precedent-rymden för den specifika
lösningen är TOM, inte tunn.** Den är min egen härledning ur GitHubs
dokumenterade byggstenar, redovisad öppet som sådan.

## Delfråga 1 — Vad gör branschledarna? (falsifiering av "klocka"-hypotesen)

### Google (TAP)

Källan är kapitel 23 i "Software Engineering at Google", verifierad direkt
mot abseil.io i detta pass (tidigare citerad i `j4a` för andra stycken,
men INTE för denna specifika fråga). Det avgörande stycket:

> "After a change has been submitted, we use TAP to asynchronously run all
> potentially affected tests, including larger and slower tests."
>
> — [abseil.io, Software Engineering at Google, kapitel 23](https://abseil.io/resources/swe-book/html/ch23.html), hämtat 2026-09-19

Triggern är **"efter att en ändring lämnats in"** — händelsestyrd, inte
tidsstyrd. Men skalan tvingar fram batchning:

> "TAP must evaluate so many changes a day (more than one a second) that it
> can no longer run every test on every change. Instead, it falls back to
> batching related changes together, which reduces the total number of
> unique tests to be run."
>
> — samma källa

**Detta är den exakta motsvarigheten till vad som redan händer hos oss.**
Google batchar INTE för att en klocka säger att det är dags — de batchar
för att flera ändringar hinner anlända innan föregående batch är klar,
precis som vår `staging-tests`-mutex tvingar tre landningar inom 32
sekunder att köa bakom varandra (se § Eget mätt). Skillnaden är att
Google GÖR det medvetet (en batchnings-algoritm) medan vi får det som en
bieffekt av en delad lås utan design bakom.

Och på culprit-finding-frågan, ett fynd jag inte sett citerat i repot
tidigare:

> "Rolling a change back is often the fastest and safest route to fix a
> build because it quickly restores the system to a known good state. In
> fact, TAP has recently been upgraded to automatically roll back changes
> when it has high confidence that they are the culprit."
>
> — samma källa

Google auto-reverterar alltså redan, men bara vid **hög konfidens** i
skyldig-identifieringen — vilket förutsätter en fungerande
culprit-finding-mekanism (se § Delfråga 2).

### Kubernetes (Prow)

Prow namnger EXAKT de tre tidpunkter frågan ber mig skilja på, och den
mellersta är entydigt händelsestyrd:

> "Postsubmits are run by the trigger plugin when a push event happens on
> a repo."
>
> — [docs.prow.k8s.io, Jobs](https://docs.prow.k8s.io/docs/jobs/), hämtat 2026-09-19

Periodiska jobb är den ENDA av de tre som är klockstyrd:

> "Periodic config looks like so...interval: 1h" [eller ett cron-uttryck]
>
> — samma källa

Detta är repots egen `nightly.yml`-arkitektur, ordagrant: postsubmit
(vårt `post-merge.yml`) triggas av `push`, periodic (vårt `nightly.yml`)
triggas av `schedule`. Ingen tredje, klockstyrd form av postsubmit finns i
Kubernetes egen taxonomi.

### Chromium

Två olika Chromium-delprojekt gav olika delar av svaret. `chromium/src`s
egen `cq.md` (Commit Queue) beskriver bara PRESUBMIT-mekanik — jag
verifierade det direkt och hittade **ingen** text om postsubmit,
sheriffer eller tree-closure i den filen (avvikande från en tidigare
formulering i repots material som antog den filen täckte hela
sheriff-processen). Sheriff- och postsubmit-mekaniken bor i stället i
ChromiumOS-delprojektets policydokument:

> "the postsubmit builder takes the most recent [snapshot] (every 7-10
> hours) and runs builds and hardware tests"
>
> — [chromium.googlesource.com, ChromiumOS Sheriff FAQ](https://chromium.googlesource.com/chromiumos/docs/+/master/sheriff_faq.md), hämtat 2026-09-19

Detta ÄR en klockliknande kadens (var 7:e–10:e timme) — men den gäller
**hårdvarutester som strukturellt inte kan köras per-commit** (fysiska
enheter, begränsad kapacitet), inte "är källkoden trasig?" i allmänhet.
ChromiumOS egen policy bekräftar dessutom att revert-vägen (händelsestyrd,
"så fort en skyldig ändring är trolig") är förstahandsvalet:

> "ChromiumOS is a revert-first project. This means, whenever it's possible
> to solve a breakage simply by reverting a CL or two, this is the
> preferred way to solve the breakage."
>
> — [chromium.org, ChromiumOS Breakage and Flake Policy](https://www.chromium.org/chromium-os/developer-library/guides/testing/breakages-and-flakes/), hämtat 2026-09-19

Och när en skyldig CL inte går att peka ut:

> "If the cause of the failing builder or test cannot be narrowed down to a
> CL that can be reverted, the sheriffs and on-callers may have no other
> choice but to disable it, or mark the builder/test as informational,
> experimental, or non-critical."
>
> — samma källa

### Rust

Redan väl täckt i `actions-minutbudget-2026-09-18.md` § S2, återanvänt här
utan ny hämtning eftersom citatet redan är primärkälle-verifierat i det
passet:

> "Before a commit can be merged into the `main` branch, it needs to pass
> our complete test suite. We call this an `auto` build."
>
> — [rustc-dev-guide, Testing with CI](https://rustc-dev-guide.rust-lang.org/tests/ci.html)

Rust (i dag via GitHubs egen kö, historiskt via `bors`) kör den fulla
sviten **per sammanslagning**, inte på en klocka. Samma mönster som
Kubernetes Tide och vår egen merge-kö.

### GitLab (merge trains)

Verifierat direkt i detta pass mot GitLabs egen dokumentation:

> "If a merge train pipeline fails, the merge request is not merged.
> GitLab removes that merge request from the merge train, and starts new
> pipelines for all the merge requests that were queued after it."
>
> — [docs.gitlab.com, Merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/), hämtat 2026-09-19

GitLabs tåg testar KUMULATIVT (ändring A, sedan A+B, sedan A+B+C) — vilket
ger culprit-identifiering **strukturellt, utan bisektion**: faller
A+B+C-pipelinen men A+B redan var grön, är C den enda rimliga misstänkta,
och GitLab agerar på precis den slutsatsen genom att ta bort C och starta
om resten utan den. Detta är händelsestyrt (varje MR triggar sin egen
pipeline i tåget), inte klockstyrt.

### Mozilla (autoland/sheriffing)

Verifierat direkt i detta pass:

> "When a patch is landed that causes build or test failures, it must be
> backed out to restore the tree to a passing or green state again."
>
> — [wiki.mozilla.org, Sheriffing/How:To:Backouts](https://wiki.mozilla.org/Sheriffing/How:To:Backouts), hämtat 2026-09-19

Sheriffer bevakar trädet LÖPANDE (händelsestyrt av varje ny landning som
Treeherder rapporterar in), inte på en klocka. Ett drag jag inte sett i
någon av de andra källorna: en uttrycklig artighetsregel innan en
back-out görs utan utvecklarens godkännande — "5-minute rule for the
waiting of a response of the developer" (samma källa) — en mänsklig
eskaleringstidsgräns, inte en teknisk klocka.

### Sammanställning — falsifiering, uttryckligt

| Organisation | Vad postsubmit-lagret triggas av | Vad som ÄR klockstyrt hos dem |
|---|---|---|
| Google (TAP) | Händelse ("efter inlämning"), batchat av VOLYM (>1/s) | En separat, ospecificerad kontinuerlig prövning — inget klockexempel hittat |
| Kubernetes (Prow) | `push`-händelse, uttryckligen | `periodic`-jobb (motsvarar vårt `nightly.yml`) |
| Chromium (CQ + ChromiumOS) | Landning (revert-first, händelsestyrt) | Hårdvarusnapshot var 7–10:e timme — en KAPACITETSbegränsning, inte ett designval för mjukvarutester |
| Rust | Sammanslagning (`auto`-bygge) | Inget klockexempel hittat i denna fråga |
| GitLab (merge trains) | Varje kö-post, kumulativt | Inget klockexempel hittat i denna fråga |
| Mozilla (autoland) | Löpande sheriff-bevakning av varje landning | Inget klockexempel hittat i denna fråga |

**Domen på delfråga 1: orkestrerarens hypotes "Google buntar postsubmit på
klocka" är FALSIFIERAD i sin bokstavliga form.** Ingen av de sex
organisationerna kör sin "höll landningen?"-kontroll på ett cron-uttryck.
Samtliga sex reserverar klockan för en TYDLIGT SEPARAT, fullständig
svepningskontroll — och den arkitekturen har vi redan (`nightly.yml`).
Vad som HÅLLER i den mjukare tolkningen ("landningar batchas ibland") är
att när takten är hög nog, batchas näraliggande ändringar av
KOSTNADSSKÄL — men det är en konsekvens av volym och delad
testinfrastruktur, inte ett klockbeslut, och det är EXAKT vad som redan
sker hos oss via mutexen (se § Eget mätt).

## Delfråga 2 — Culprit finding: metod och kostnad

### Chromium Findit ("Chrome Culprit Finder")

Verifierat direkt mot Chromiums egen dokumentationssajt i detta pass:

> "Findit identifies culprits for compile/test/flake failures on Chromium
> Waterfall and Commit Queue."
>
> — [sites.google.com/chromium.org/cat/findit](https://sites.google.com/chromium.org/cat/findit), hämtat 2026-09-19

Metoden är TVÅSTEGS, samma princip som Chromiums retry-avvägning som
redan finns citerad i `j4a` § 10:

1. **Heuristisk analys** — korrelerar en ändring med felmeddelanden i
   loggen. Snabb (1–2 minuter) men kan ge falska positiva.
2. **Try-job-baserad (bisektions-liknande) analys** — kör om det trasiga
   testet/bygget vid olika punkter i det misstänkta spannet för att
   verifiera. Detta ger de faktiska KOSTNADSSIFFRORNA:

> Median execution time: **14 minutes for compile failures** and **24
> minutes for swarmed gtest failures**.
>
> — [sites.google.com/a/chromium.org/cr-culprit-finder/findit](https://sites.google.com/a/chromium.org/cr-culprit-finder/findit), hämtat 2026-09-19

För nyckfulla (flaky) tester är metoden ännu dyrare: Findit triggar om
testet **upp till 400 gånger** vid olika revisioner i en variant av
exponentiell sökning för att smalna av spannet, innan try-jobs bekräftar
den exakta skyldiga ändringen (samma källa). Detta är bara möjligt för
Google eftersom de har en flotta av tusentals byggmaskiner (Swarming) att
köra dessa 400 omkörningar PARALLELLT på — en förutsättning vi inte har
(se § Vad jag inte kunde belägga).

### DORA — vad kostar culprit-finding att INTE ha?

Kopplingen mellan culprit-finding och upptäcktsfönster: DORA:s eget mått
"tid till återställning" (tidigare "Time to Restore Service", nu "Failed
Deployment Recovery Time") mäter precis den tid culprit-finding + åtgärd
tillsammans tar. Definitionen, verifierad direkt mot `dora.dev` i detta
pass:

> "The time it takes to recover from a deployment that fails and requires
> immediate intervention."
>
> — [dora.dev/guides/dora-metrics](https://dora.dev/guides/dora-metrics/), hämtat 2026-09-19

**Jag kunde INTE hitta den exakta tröskeltabellen (Elit/Hög/Medel/Låg) på
en förstapartssida i detta pass** — `dora.dev`s egen landningssida för
2024 års rapport innehåller den inte i den hämtningsbara texten (den
kräver PDF-rapporten). Tabellen nedan är därför en **tredjepartskälla**
(en branschanalytiker som citerar rapporten), explicit märkt:

| Nivå | Tid till återställning (sekundärkälla) |
|---|---|
| Elit | Under 1 timme |
| Hög | Under 1 dygn |
| Medel | 1 dygn till 1 vecka |
| Låg | 1 vecka till 1 månad |

— [getdx.com, Highlights from the 2024 DORA report](https://getdx.com/blog/2024-dora-report/), hämtat 2026-09-19, som i sin tur sammanfattar DORA:s rapport (jag har INTE verifierat detta mot rapportens egen PDF).

**Varför detta spelar roll för vår fråga.** Vårt eget post-merge-lager mäter
redan sitt exponeringsfönster VARJE körning (jobbet `exponeringsfonster` i
`post-merge.yml`, byggt i A7:5/A7:6). Det tidigare uppmätta VÄRSTA fallet
(`j4a`-bedömningens § 1, redan i repot) var **56 minuter totalt, varav 34
minuter 46 sekunder ren köväntan** — fortfarande inom DORA:s Elit-gräns
(under 1 timme), om än nära kanten. Att flytta till en klocka med ett
fast 30-minutersintervall lägger, I DET LUGNA FALLET (den stora
majoriteten av landningar, som i dag detekteras på under en minut — se
körning `35436948227` i § Eget mätt, 22 sekunder totalt), till en
**garanterad** fördröjning på i snitt 15 och som mest 30 minuter INNAN en
kontroll ens startar — en klar försämring för de landningar som i dag
INTE är problemet.

## Delfråga 3 — Upptäcktsfönstret hos oss, mätt

Ingen ny mätning behövdes här utöver vad `j4a`-bedömningen redan
dokumenterat (§ 7 och § 9 i `05-branschjamforelse.md`), plus vad jag mätte
själv nedan (§ Eget mätt). Sammanfattat:

- **Kalmt fall (dominerande):** klassning + exponeringsfönster-mätning
  klar på sekunder till någon minut när klassningen ger `docs_only=true`
  (sviten hoppas), eller ~4–6 minuter när sviten kör men staging-mutexen
  är fri.
- **Belastat fall (mätt, se nedan):** upp till 31+ minuter innan
  Staging-jobbet ens STARTAR, på grund av mutex-kön — inte på grund av
  någon klocka.

Ingen av dessa siffror kräver en klocka för att förbättras eller
försämras. Klockan påverkar BARA det kalma fallet (försämrar det, se
ovan) och gör ingenting åt det belastade fallet (se § Eget mätt — en
klocka med 30-minutersintervall hade INTE upptäckt bristen snabbare än
dagens mutex-kö redan gjorde, eftersom mutex-kön redan tvingar samma
väntan).

## Delfråga 4 — GitHub Actions-mekanik för en klocka

Samtliga citat i detta avsnitt hämtade direkt mot `docs.github.com` i
detta pass, 2026-09-19.

### `schedule` — dokumenterad opålitlighet

> "The `schedule` event can be delayed during periods of high loads of
> GitHub Actions workflow runs. High load times include the start of every
> hour."
>
> — [`docs.github.com` — Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows), hämtat 2026-09-19

GitHubs egen dokumentation säger dessutom, i samma avsnitt, att vid
TILLRÄCKLIGT hög belastning kan köade jobb **tappas helt** — inte bara
försenas. Minimiintervallet är:

> "The shortest interval you can run scheduled workflows is once every 5
> minutes."

Och en fälla som INTE gäller oss (aktivt repo) men värd att känna till:
schemalagda arbetsflöden i publika repon **stängs av automatiskt** efter
60 dagars inaktivitet.

**Tredjepartsmätningar** (inte GitHubs egna, men flera oberoende
observatörer, märkt som sekundärkälla): community-rapporter beskriver
5-minutersdrift som rutin, 15-minutersdrift som vanligt runt varje
timskifte, och 30+ minuters drift på belastade dagar
([crontap.com](https://crontap.com/blog/github-actions-cron-drift-problem),
[dev.to/rulestack](https://dev.to/rulestack/your-github-actions-cron-fires-less-often-than-you-declared-what-we-measured-and-how-to-design-for-80f),
hämtade 2026-09-19). En rekommendation som återkommer i flera av dessa
källor: förlägg klockan till en udda minut (`17 * * * *` i stället för
`0 * * * *`) för att undvika lasttoppen vid varje heltimme — relevant OM
vi ändå bygger en klocka (se § Rekommendation, avvisad väg).

### "Kör bara om `main` rört sig sedan senaste gröna" — mönstret finns, är tredjepart

Jag hittade **ingen förstapartsdokumentation** från GitHub som beskriver
ett inbyggt sätt att villkora en schemalagd körning på "har något ändrats
sedan senaste lyckade körning". Mönstret finns däremot väl etablerat som
community-verktyg: `nx-set-shas`, `last-successful-build-action` och
`Check History Action` löser alla samma sak — fråga Actions-API:t
(`GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs` med
filter `status=success`) efter senaste lyckade körnings SHA, och jämför
med aktuell `main`-spets
([`github.com/SamhammerAG/last-successful-build-action`](https://github.com/SamhammerAG/last-successful-build-action),
[`github.com/nrwl/nx-set-shas`](https://github.com/nrwl/nx-set-shas), hämtade
2026-09-19). Detta ÄR den korrekta byggstenen för en klocka — men den är
alltså en community-konvention, inte ett förstapartsmönster GitHub själva
förespråkar.

### `concurrency` — den byggsten som faktiskt löser "kör senaste, hoppa mellanliggande"

Detta är den viktigaste tekniska upptäckten i detta delsvar. GitHubs egen
dokumentation, verifierad direkt:

> "When a concurrent job or workflow is queued, if another job or workflow
> using the same concurrency group in the repository is in progress, the
> queued job or workflow will be `pending`. By default, any existing
> `pending` job or workflow in the same concurrency group will be canceled
> and the new queued job or workflow will take its place."
>
> — [`docs.github.com` — Control the concurrency of workflows and jobs](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs), hämtat 2026-09-19

Det här är EXAKT den semantik uppdraget frågade efter ("kör senaste, hoppa
mellanliggande") — och den kräver INGEN klocka, inget schema, ingen extra
kod. Den kräver bara att vår `concurrency.group`-nyckel byter från
per-SHA (dagens `post-merge-${{ github.sha }}`, som medvetet ALDRIG
evictar någon körning — se `post-merge.yml` rad 158–183) till en FAST
sträng (t.ex. `post-merge-suite`).

**Den kritiska motpol jag härledde själv, INTE hämtad från någon
branschkälla:** N3-mekaniken (`scripts/classify-post-merge.sh`, TASK-450.2)
beräknar sitt spann via `github.event.before` — push-händelsens EGET
"vad var toppen innan just DENNA push"-fält. Läser man
`.github/workflows/post-merge.yml` rad 229–236 står det uttryckligt att
detta är MEDVETET (rollback-egenskap, grindad av att variabeln finns).
Det fältet fångar korrekt fallet "flera PR:er landade i EN push via
kön" (det N3 byggdes för). Men det fångar **INTE** fallet "en TIDIGARE
push fick sin egen efterkontroll-körning EVICTAD av concurrency-gruppen
innan den ens startade" — för då sätts nästa pushs `before` ändå bara till
den evictade pushens `after` (git-historiken vet inget om vilka
körningar som faktiskt kördes). En debounce byggd på en FAST
concurrency-grupp UTAN att samtidigt byta spann-källan till "SHA:t för
senaste FAKTISKT AVSLUTADE körning" (hämtat via samma Actions-API som
community-verktygen ovan använder) hade alltså tyst återinfört precis det
täckningshål N3 stängde — fast via en annan mekanism.

**Jag hittade ingen branschkälla, i något av de sex verifierade projekten
eller i sökningarna, som beskriver denna exakta kombination** (fast
concurrency-grupp + API-baserad "senaste avslutade körning" i stället för
push-händelsens `before`, tillämpat på ett postsubmit-testlager). Detta är
min egen härledning ur GitHubs dokumenterade byggstenar och vår egen kods
faktiska mekanik — se § Rekommendation för hur jag ändå landar i den, och
§ Vad jag inte kunde belägga för vad som återstår oprövat.

### `workflow_run`

Verifierat: `workflow_run` triggar EFTER att ett ANNAT arbetsflöde
avslutats, inte på en klocka och inte direkt på `push`. Den skulle kunna
användas för att låta `post-merge.yml` trigga EFTER `ci.yml`:s
`merge_group`-körning i stället för att självständigt återhärleda
klassningen via commits-API:t (vilket `klassning`-jobbet gör i dag,
"VÄG B" i `classify-post-merge.sh`s egen terminologi). Det är en
livskraftig framtida förenkling för KÖ-vägen specifikt, men löser inte
grundfrågan (klocka kontra händelse) och adresserar inte landningar
utanför kön (Väg B:s existensskäl). Jag rekommenderar den inte som
huvudåtgärd i detta pass.

## Eget mätt — en skarp incident under själva forskningspasset (2026-09-19)

Detta hände medan jag skrev denna fil, inte i ett historiskt underlag.
Kommandot och tidsstämplarna är körda av mig direkt mot repots faktiska
`gh`-data, inte återgivna ur uppdragets text utan verifiering (ADR-086).

```bash
gh run list --branch main --workflow post-merge.yml --limit 10 \
  --json databaseId,status,conclusion,headSha,createdAt,updatedAt
```

Tre landningar skapade post-merge-körningar inom **32 sekunder** av
varandra 2026-09-19 kl. 09:50 UTC:

| SHA (kort) | Körning skapad | Stagings jobb startade | Stagings jobb klart | Utfall |
|---|---|---|---|---|
| `168dd403` | 09:50:08Z | 09:50:47Z | 10:03:48Z (13m 01s) | **failure** — över `timeout-minutes: 12` |
| `018dfeef` | 09:50:23Z | 10:03:50Z (köad bakom föregående) | 10:21:48Z (17m 58s) | **failure** — över taket |
| `c5fdc75c` | 09:50:40Z | 10:21:50Z (köad bakom BÅDA föregående) | pågick fortfarande vid mättillfället | — |

Den tredje landningens Staging-jobb hade alltså **inte ens startat 31
minuter efter att körningen skapades** — inte på grund av en klocka, utan
på grund av att `ci-suite.yml`s `staging-tests`-mutex bara släpper igenom
en körning i taget, och två redan låg framför i kön. Två av de tre
körningarna landade dessutom över det egna 12-minuterstaket
(`ci-suite.yml`, jobbet `test-staging`) — sannolikt en konsekvens av att
köandet i sig trängde undan tid, inte nödvändigtvis en äkta
koderegression (samma tolkningsfälla som `post-merge.yml`s egen
"Tolkningshjälp"-sektion varnar för: `cancelled` kontra `failure` kräver
att man läser jobbets väggklocka, inte bara etiketten).

Två tilldelade ärenden skapades automatiskt: `#2573` (`168dd403`) och
`#2575` (`018dfeef`).

**Vad detta bevisar för frågan.** "Per landning" är INTE samma sak som
"omedelbar" när flera landningar kommer tätt — systemet degraderar REDAN
i dag till en de facto-kö under belastning, precis som en klocka skulle
göra, men utan klockans fördelar (förutsägbarhet, en enda samlad körning
per fönster) och med en KOSTNAD klockan inte har: varje köad SHA betalar
FULLT pris (en hel svit-körning, `timeout-minutes: 12` och allt), i
stället för att kollapsas till EN körning som täcker hela spannet. Detta
är den konkreta, mätta, LEVANDE illustrationen av § Delfråga 1:s
slutsats: vi har redan Googles TAP-batchningsproblem, fast utan Googles
TAP-batchningslösning.

**Kopplingen till culprit-finding, mätt tidigare i samma session.**
`tasks/sessions/2026-09-17-session-126.md` § "Flaken är större än
handoffen visste" (rad 1472–1484, läst i sin helhet i detta pass)
dokumenterar en TIDIGARE instans samma vecka: ett automatiskt
revert-förslag i ärende `#2549` pekade sannolikt ut FEL landning, eftersom
samma testfel förekom i körningar BÅDE före och efter den landning
förslaget anklagade. Vår nuvarande attributionslogik
(`scripts/post-merge-attribution.sh`, byggd i `TASK-334`) svarar korrekt
"OKÄND" när den inte kan avgöra saken tvärsäkert — men den gör ingen
BISEKTION för att faktiskt lösa upp osäkerheten, till skillnad från
Findits try-job-baserade steg. Detta är ett existerande gap, oberoende av
klocka-kontra-landning-frågan, och relevant för § Rekommendation punkt 2.

## Options-rymden — fyra vägar, kostnad i båda måtten

Samtliga kostnadsöverslag nedan bygger på min EGEN mätning i detta pass,
inte på en fullmånads-dataserie — se explicit osäkerhetsmärkning i varje
rad. Metod: `gh pr list --state merged --search "merged:2026-09-12..2026-09-19"`
gav 64 sammanslagna PR:er, varav 31 med titel som INTE börjar med
`docs(`/`docs:` (en grov proxy för "kod", inte D0-klassningen självt).
Dessa 31 landade inom **15 distinkta 30-minutersfönster** över ett
aktivt spann på ungefär 47 timmar (2026-09-17 11:06Z–2026-09-19 10:16Z) —
kvoten **2,07 landningar per upptaget fönster**. Skalat mot augustis ~409
kodlandningar/månad: **≈198 upptagna 30-minutersfönster/månad**. Detta är
ett litet, buntat tvådagarsprov (en enda sessions arbetstakt, inte ett
representativt månadssnitt) — jag redovisar det som en
storleksordningsindikation, inte en prognos.

| Väg | Väntetid (median / värsta uppmätta) | Fakturerade minuter/månad (överslag) | Upptäckt av flera-i-spann | Culprit-förmåga | Risk |
|---|---|---|---|---|---|
| **1. Per landning, seriell (dagens form)** | ~0 min kalmt fall (mätt: 22 s–1 min); **31+ min under belastning (mätt i dag)** | 409 × 57 min (mätt enstaka körning, `#2556`) ≈ **23 300**; efter S3 (`23,5` min, HÄRLETT): ≈ **9 600–11 400** (senare talet ur P2:s egen budgetrad) | N3 täcker kö-batchar; INGEN täckning av mutex-köade separata pushar (varje betalar fullt pris i stället för att slås ihop) | God i kalmt fall (1 SHA = 1 misstänkt); FÖRSÄMRAS okontrollerat under belastning (mätt: fel-attribuerat revertförslag `#2549`) | Redan LEVANDE risk, mätt två gånger denna vecka |
| **2. Ren klocka (t.ex. var 30:e min, hoppa om ingen kod landat)** | GARANTERAT ≥0, i SNITT ~15 min, VÄRSTA FALL 30+ min PLUS GitHubs egen dokumenterade schemadrift — läggs till på VARJE landning, även de som i dag är klara på under en minut | ≈198 körningar/mån (mitt överslag) × 23,5 min (S3) ≈ **4 650**; × dagens ~57 min ≈ **11 300** — SAMMA storleksordning som väg 1 efter S3, ibland SÄMRE | Bättre än dagens OKONTROLLERADE degradering (planerad batchning i stället för slumpmässig mutex-kö) — men SÄMRE än väg 3/4, eftersom klockan batchar ÄVEN när inget tvingar den till det | Kräver ändå bisektion för att slå isär ett rött fönster med flera landningar — samma problem som i dag, fast PÅTVINGAT oftare | GitHubs egen dokumentation: schema kan försenas ELLER TAPPAS HELT under hög last — ett fel-läge vi varken ser eller äger |
| **3. Push-utlöst med concurrency-sammanslagning ("kör senaste, hoppa mellanliggande")** | ~0 min i kalmt fall (ANNAT än väg 2: ingen väntan när inget är upptaget); begränsad till pågående körnings längd under belastning | Samma STORLEKSORDNING som väg 2 (≈198 tillfällen/mån) MEN utan väg 2:s extra latens-skatt på de landningar som INTE är i en burst | Löser N3-hålet OCH mutex-degraderingen på samma gång, FÖRUTSATT att spann-källan byts till "senaste avslutade körning" (API), inte `event.before` | Samma som i dag (ingen bisektion), men täcker fler landningar per körning korrekt i stället för att flera körningar tävlar om samma mutex | **Ingen branschprecedent hittad för exakt denna kombination** — min egen härledning. Kräver en skriptändring (spann-källa) för att vara säker, inte bara en konfigrad |
| **4. Hybrid — röd klocka/körning bisekterar spannet** | Som väg 1 eller 3 i det VANLIGA (gröna) fallet; +1 extra körning (⌈log₂(spann)⌉, oftast 1) ENDAST vid rött MED spann > 1 | Marginell — mitt egna prov visade 0 av 2 fällningar denna vecka var multi-landnings-spann (båda var mutex-timeout på EN SHA); merkostnaden träffar en sällsynt delmängd | Adresserar den ENDA verkliga luckan i väg 1/3: multi-landnings-spann som blir rött | Löser exakt det Findit/TAP löser, i miniatyr — bisektion PÅ EFTERFRÅGAN, aldrig i förväg | Byggkostnad (ett nytt skript/steg), men noll ny risk för falska positiva jämfört med i dag |

## Dom

**Klocka som primär trigger för efterkontrollen: AVVISAS.** Ingen av de
sex undersökta branschledarna gör det för denna specifika kontrollklass;
GitHubs egen dokumentation gör schemat till en sämre, inte en bättre,
väntetidsgaranti än händelsestyrning; och mitt eget överslag visar att
en ren klocka inte ens sparar pengar jämfört med dagens form EFTER att
den redan planerade S3-optimeringen landat — den bara FÖRDELAR om
kostnaden till en jämnare men i snitt LÅNGSAMMARE form.

**Dagens "per landning, seriell" form: håller INTE under belastning, och
det är mätt, inte antaget.** Den degraderar till en okontrollerad kö så
fort mer än en landning kommer inom mutexens körtid (~6–13 minuter),
betalar fullt pris per köad SHA i stället för att slå ihop dem, och har
redan mätt fel-attribuerat minst ett revert-förslag denna vecka.

**Den proffsigaste formen för vår skala är väg 3 (push + fast
concurrency-grupp), kompletterad med väg 4 (bisektion på efterfrågan) för
den sällsynta röda multi-landnings-spannet.** Detta är INTE en klocka i
någon mening ordet normalt används — det är en förfining av EXAKT den
händelsestyrda arkitektur samtliga sex branschledare redan använder,
byggd av GitHubs egna, dokumenterade primitiv i stället för en ny mekanism.

## Vad jag inte kunde belägga

- **DORA:s exakta tröskeltabell från en förstapartssida.** `dora.dev`s
  2024-rapportsida gav ingen hämtningsbar tabell i detta pass (kräver
  PDF:en). Tabellen jag citerar är en tredjepartssammanfattning
  (getdx.com) — riktningen (Elit under 1 timme) är sannolikt korrekt, men
  jag har inte verifierat den mot rapportens egen text.
- **Chromium `chromium/src`s EGEN postsubmit/sheriff-dokumentation.**
  `cq.md` visade sig vara rent presubmit-fokuserad. Jag fick i stället gå
  via det SYSTERPROJEKT ChromiumOS för sheriff/breakage-policyn. De två
  projekten delar organisation och kultur men är inte identiska —
  slutsatserna om ChromiumOS bör inte antas gälla `chromium/src` exakt.
- **Om Googles Swarming-flotta (400 parallella omkörningar för
  flake-bisektion) är representativ för VAD DET SKULLE KOSTA OSS att bygga
  motsvarande.** Vi har EN staging-mutex, alltså serialiserad kapacitet —
  en bisektion hos oss kostar `⌈log₂(spann)⌉` SERIELLA körningar, inte
  parallella. Jag har inte hittat en källa som ger kostnaden för
  bisektion under serialiserad (icke-parallell) kapacitet specifikt; min
  siffra i § Options-rymden är en egen härledning, inte en mätning.
- **Hur OFTA ett rött, multi-landnings-spann faktiskt uppstår hos oss
  över en längre period.** Mitt underlag är två dagars burst-data (en
  session) med noll äkta multi-landnings-rödspann observerade (de två
  fällningarna denna vecka var båda enstaka SHA:n som körde över sitt
  eget timeout-tak). n är för litet för att dra en kvot — väg 4:s
  "sällan"-påstående är en hypotes att pröva med mer data, inte ett
  mätt faktum.
- **Om `workflow_run`-triggning hade sänkt Actions-API-belastningen eller
  inte.** Jag har inte undersökt om Actions-runnerns egna, körnings-
  scopade `GITHUB_TOKEN`-anrop mot API:t (för att slå upp "senaste
  avslutade körning") har någon praktiskt relevant kvot-begränsning vid
  vår takt (~13–14 landningar/dygn i toppar). Sannolikt inget problem
  (samma slutsats som orkestrerarens egen polling-mätning, `0,8 %` av
  budgeten, i `orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
  — men OBS: den mätningen gällde orkestrerarens EGEN polling mot ett
  annat API-kvot-fack, inte en Actions-runners `GITHUB_TOKEN`-anrop, så
  den är INTE direkt överförbar och jag flaggar den bara som en svag
  indikation, inte ett bevis).
- **Exakt varför två av tre köade körningar denna vecka gick över sitt
  12-minuterstak** (§ Eget mätt) — jag har inte grävt i om det var
  ren köträngsel, en äkta prestandaregression, eller något tredje. Det
  ligger utanför denna frågas scope och hanteras redan av det pågående
  flake-diagnos-uppdraget som spawnades parallellt denna session
  (se sessionsdokets § "Flottan, spawnad ~22:35Z", uppdrag 1).

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus avgör.**

1. **Rör inte triggern från `push` till `schedule`.** Inget branschbelägg
   stödjer det, och GitHubs egen dokumentation om schemaopålitlighet talar
   direkt emot det för en tidskänslig kontroll.
2. **Byt `post-merge.yml`s concurrency-grupp från per-SHA
   (`post-merge-${{ github.sha }}`) till en FAST nyckel** (t.ex.
   `post-merge-suite`), så att GitHubs inbyggda "kör senaste, hoppa
   mellanliggande"-kö gör jobbet i stället för vår mutex att göra det
   okontrollerat.
3. **Byt SAMTIDIGT `classify-post-merge.sh`s spann-källa** från
   `github.event.before` till "SHA:t för senaste FAKTISKT AVSLUTADE
   `post-merge`-körning", hämtat via Actions-API:t (samma mönster som
   `nx-set-shas`/`last-successful-build-action`). Görs punkt 2 UTAN denna
   ändring återinförs ett tyst täckningshål, strukturellt likt det N3
   redan en gång stängde.
4. **Bygg väg 4 (bisektion på efterfrågan) som en SENARE, separat skiva**
   — bara när `larm`-jobbet fyrar OCH det ärvda spannet är > 1 landning.
   Låg prioritet given hur sällan detta faktiskt inträffat hittills (se
   § Vad jag inte kunde belägga) — men billig att bygga när den väl
   behövs, och den enda av de fyra vägarna som faktiskt närmar sig
   branschens culprit-finding-förmåga (Findit, TAP:s auto-revert).
5. **Rör inte `nightly.yml`.** Den ÄR redan den korrekta, branschlika
   klockan — den periodiska, fullständiga svepningskontrollen samtliga
   sex organisationer har vid sidan av sitt händelsestyrda postsubmit-lager.
6. **Kör om kostnadsöverslaget i § Options-rymden mot en HEL månads data**
   (samma metod som `actions-minutbudget-2026-09-18.md` redan använder för
   andra siffror) innan punkt 2–3 byggs, eftersom mitt underlag är en
   tvådagars burst-sample — se § Vad jag inte kunde belägga.

## Källförteckning

**Förstapartskällor, verifierade direkt i detta pass (2026-09-19):**

- [abseil.io — Software Engineering at Google, kapitel 23](https://abseil.io/resources/swe-book/html/ch23.html)
- [docs.prow.k8s.io — Jobs](https://docs.prow.k8s.io/docs/jobs/)
- [chromium.googlesource.com — ChromiumOS Sheriff FAQ](https://chromium.googlesource.com/chromiumos/docs/+/master/sheriff_faq.md)
- [chromium.org — ChromiumOS Breakage and Flake Policy](https://www.chromium.org/chromium-os/developer-library/guides/testing/breakages-and-flakes/)
- [sites.google.com/chromium.org/cat/findit — Findit overview](https://sites.google.com/chromium.org/cat/findit)
- [sites.google.com/a/chromium.org/cr-culprit-finder/findit — mediantider](https://sites.google.com/a/chromium.org/cr-culprit-finder/findit)
- [docs.gitlab.com — Merge trains](https://docs.gitlab.com/ci/pipelines/merge_trains/)
- [wiki.mozilla.org — Sheriffing/How:To:Backouts](https://wiki.mozilla.org/Sheriffing/How:To:Backouts)
- [dora.dev — DORA metrics guide](https://dora.dev/guides/dora-metrics/)
- [`docs.github.com` — Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [`docs.github.com` — Control the concurrency of workflows and jobs](https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs)

**Tredjepartskällor, explicit märkta i texten:**

- [getdx.com — Highlights from the 2024 DORA report](https://getdx.com/blog/2024-dora-report/) (DORA-tröskeltabell, sekundärkälla)
- [crontap.com — Why GitHub Actions cron misses](https://crontap.com/blog/github-actions-cron-drift-problem) (schemadrift, community-mätning)
- [dev.to/rulestack — GitHub Actions cron drift](https://dev.to/rulestack/your-github-actions-cron-fires-less-often-than-you-declared-what-we-measured-and-how-to-design-for-80f) (schemadrift, community-mätning)
- [`github.com/SamhammerAG/last-successful-build-action`](https://github.com/SamhammerAG/last-successful-build-action) (mönster: senaste lyckade körning via API)
- [`github.com/nrwl/nx-set-shas`](https://github.com/nrwl/nx-set-shas) (samma mönster, annan implementation)

**Återanvänt, redan verifierat i tidigare repopass (ej omhämtat i detta pass):**

- [rustc-dev-guide — Testing with CI](https://rustc-dev-guide.rust-lang.org/tests/ci.html) (citerat i `actions-minutbudget-2026-09-18.md` § S2)

**Interna källor:**

- `docs/research/ci-djupgranskning-2026-09-17/underlag/j4a-branschpraxis-ur-primarkallor.md`
- `docs/research/ci-djupgranskning-2026-09-17/05-branschjamforelse.md`
- `docs/research/actions-minutbudget-2026-09-18.md`
- `docs/research/orkestrerar-vackning-polling-vs-event-driven-2026-08-02.md`
- [`ADR-077`](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
- [`ADR-076`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)
- `CONTRIBUTING.md` § Nattnätet
- `.github/workflows/post-merge.yml`
- `scripts/classify-post-merge.sh`
- `tasks/sessions/2026-09-17-session-126.md` § "Flaken är större än handoffen visste"
- Egen mätning: `gh run list --branch main --workflow post-merge.yml …` och
  `gh pr list --state merged --search "merged:2026-09-12..2026-09-19" …`,
  körda 2026-09-19 mot `high-five-group/miranon-media-admin`.
