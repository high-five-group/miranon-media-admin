---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.7 — Tid och kostnad: hur länge väntar vi egentligen, och vad kostar det?

> **Proveniens:** delfråga J8.7 i CI-djupgranskningen (Session 126, 2026-09-17),
> körd som ett eget agent-pass mot ögonblicksbilden `origin/main` på `eeca8c72`
> (2026-09-08) plus levande data hämtad direkt från GitHubs API samma dag som
> denna fil skrevs (2026-09-17). Modell: se slutrapporten till orkestreraren.
> Metodkontraktet för hela granskningen (evidenskrav, märkningsregler,
> skrivregler) står i
> [`00-agentkontrakt.md`](00-agentkontrakt.md) och gäller detta dokument fullt
> ut. En rättelse mottagen mitt i passet (staging kör INTE på PR-/kö-ytan) är
> inarbetad genomgående nedan — den bekräftade vad detta pass redan hade mätt
> självständigt via jobblistor, se § Vad jag läste först.

## Kort svar

**Det mesta av det ni väntar på är EN sak: ett självtest av testramverket
självt, som tar 9–14 minuter och körs på varenda kodändring.** Den riktiga
staging-databas-testen (den som pratar med en riktig Airtable-bas och en
riktig server) körs INTE på varje kodändring — den körs en gång per landning
(efter att koden redan är mergad) och en gång per natt. Det ni upplever som
"CI är långsam" på en vanlig kod-PR är alltså inte staging-testerna — det är
en meta-test som kontrollerar att acceptanstesterna är ärliga mot sig själva.

**Pengarna är inte problemet — de är noll.** Repot är publikt (inte privat,
som uppdragets underlag antog), och GitHub fakturerar aldrig
Actions-minuter på publika repon. Det bekräftas dubbelt: GitHubs egen
fakturerings-API visar att augusti månads 76 080 körda minuter (Actions
Linux) gav en nettokostnad på exakt **0 kronor** (rabatten är 100 %), och när
jag frågade samma API om enskilda körningars fakturerbara tid svarade den
**0 millisekunder** på alla fem jag testade. Den enda verkliga notan är ett
enda Enterprise Cloud-abonnemang (~21 dollar/månad för en plats) som köptes
i juli specifikt för att slå på "merge queue" (kö-funktionen) — inte för
Actions.

**Väntetiden är däremot verklig**, och den har tre olika ansikten beroende på
var i flödet man tittar:

| Var | Vad väntetiden faktiskt är | Typisk tid |
|---|---|---|
| PR-ytan (innan kön) | Ett självtest av acceptansramverket, kör parallellt med allt annat | ~10–14 min för en kodändring, ~4 min för en ren dokumentationsändring |
| Kö-ytan (efter "armera") | Samma självtest kör en gång till på samma kod | ~10–14 min (kod) / ~4 min (docs) |
| Efter mergning (post-merge) | Den RIKTIGA testsviten inklusive den riktiga databasen — men bara om ändringen inte var docs-only | ~16 min normalt, upp till **56 min** när ett annat körning håller den delade databas-låset |

**Ja, en del av flödet körs i onödan** — framför allt: ett dyrt
säkerhets-kontrollsteg (`audit-ci`, granskar om något beroende har en känd
sårbarhet) körs på VARJE ändring, även en som bara ändrar ett kommatecken i
en dokumentationsfil, trots att det redan är känt och dokumenterat i repot
att detta är en avsiktlig avvikelse. Och en enskild PR som itereras tio
gånger på en eftermiddag kör hela den 10–14-minuters-långa kontrollen tio
gånger — det är arbetets natur, inte ett fel, men det är den enskilt
största posten i den totala minuträkningen.

**Fail-fast (köra billigt före dyrt och stoppa vid fel) skulle INTE göra det
snabbare i det vanliga fallet** — se § Fail-fast-kalkylen för räkningen.
Dagens parallella upplägg är faktiskt smartare än det låter.

## Vad jag läste först

Jag inventerade `docs/research/` och läste tre pass i sin helhet innan jag
mätte något nytt, eftersom de täcker stora delar av samma mark:

- [`verify-ci-parity-regel-vantetid-2026-08-05.md`](../../verify-ci-parity-regel-vantetid-2026-08-05.md)
  — mätte lokal verifieringstid, inte CI:s egen väggklocka, men innehöll en
  färsk (2026-08-05) `metrics:ci`-körning: 3 röda av 99, samtliga i de
  billiga jobben (Lint/Audit/Docs), noll i Acceptance/Webblasarbeteende.
  **Sex veckor gammalt** — jag körde om samma verktyg (se § Metod) och fick
  ett annat, viktigare svar: 15 röda av 100, och nu dominerat av
  `audit-ci` (13 träffar). Det gamla talet är alltså inaktuellt; jag bygger
  vidare på det nya.
- [`merge-queue-mot-staging-mutex-2026-07-26.md`](../../merge-queue-mot-staging-mutex-2026-07-26.md)
  — grundlig genomgång av att `merge_group`-körningar inte delar bygge
  ("Merge limits do not combine merge_group builds"), och att den delade
  `staging-tests`-mutexen är den verkliga flaskhalsen. **Skriven FÖRE**
  dagens arkitektur (som villkorslöst stänger av staging på PR-/kö-ytan,
  se nedan) — dess räkneexempel ("3 parallella kod-PR:er ⇒ 27 min
  serialiserat") gäller alltså inte längre PR-/kö-ytan, men flyttar rakt
  över till post-merge-ytan, vilket jag bekräftar empiriskt nedan.
- [`riskanpassad-ci-design-2026-07-23.md`](../../riskanpassad-ci-design-2026-07-23.md)
  — designdoket bakom D0/D1/D3-klassningen och merge-dedupen. Fortfarande
  vägledande för att förstå VARFÖR arkitekturen ser ut som den gör.

Jag läste också [ADR-077](../../../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
och [ADR-082](../../../decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md)
i sin helhet (styrande beslut för nattnät/dedup respektive länkgrinden) —
ingen ADR förkastar något jag överväger att föreslå.

**Orkestreraren skickade en rättelse mitt i passet:** min uppdragstexts
hypotes om att "en staging-mutex serialiserar PR-köandet" stämmer inte för
dagens arkitektur — `ci.yml` skickar `run_staging: false` och `run_a11y:
false` **villkorslöst** till testsviten för både PR- och kö-ytan
(`.github/workflows/ci.yml:2271-2272`). Jag hade redan sett detta själv i
mina egna jobblistor (staging-jobbet stod som `skipped` i alla PR- och
kö-körningar jag tittade på) innan rättelsen kom — den bekräftade alltså en
mätning jag redan gjort, snarare än att korrigera en jag hade fel på. Jag
har byggt hela analysen nedan på den bekräftade bilden.

## Metod

Jag mätte, i tur och ordning:

1. `npm run metrics:ci -- --limit 100 --json` — repots egna instrumenterings-
   skript (`scripts/ci-metrics.mjs`), kört i förgrunden 2026-09-17.
2. `gh run list --workflow ci.yml --limit 400 --json …` — 400 körningar,
   täcker 2026-09-05 till 2026-09-17 (endast 6 av dessa 12 kalenderdagar
   hade faktisk aktivitet — se § Aktivitetsmönstret).
3. Motsvarande listor för samtliga sju övriga workflow-filer plus GitHubs två
   inbyggda (CodeQL, Dependabot Updates) — 8 separata `gh run list`/`gh api`-
   anrop, sparade till scratch.
4. `gh api .../actions/runs/<id>/jobs` för 12 enskilda körningar (job-nivå
   start/slut-tider) för att rita den kritiska vägen.
5. `gh api .../actions/runs/<id>/timing` för 5 körningar (fakturerbar tid).
6. `gh pr list --state merged --limit 60 --json …` plus
   `gh api .../issues/<nr>/timeline` för 4 PR:er (kö-in/kö-ut-händelser).
7. `gh api organizations/high-five-group/settings/billing/usage` —
   organisationens faktiska fakturerings-rader.
8. `gh api repos/.../actions/workflows` och `orgs/high-five-group` — repo-
   och org-metadata (synlighet, plan).

Samtliga rådata ligger i mitt scratch-område under körningen; siffrorna
nedan är beräknade direkt ur dem med korta Python-skript (medianer via
"nearest rank", samma konvention som `ci-metrics.mjs` använder).

**Stickprov mot rådata (krävt av uppdraget):** jag kontrollerade
`metrics:ci`s `dedup.hitRate: 1` manuellt genom att leta efter en push-
körning som INTE deduplicerade (se § Onödiga körningar) — jag hittade en,
med explicit logg-rad "Dedup-miss: träd-avvikelse", vilket bevisar att
metoden faktiskt kan ge miss (den är inte en konstant "alltid 1"), samtidigt
som den bekräftar att skriptets egen loggbaserade klassning fungerar som
avsett. Jag kontrollerade även `prLeadTime.medianMin: 4.3` mot min egen,
oberoende beräkning på ett annat fönster (60 mergade PR:er, `createdAt` →
`mergedAt`): samma storleksordning för docs-PR:er (9,4 min median där, mot
`metrics:ci`s 4,3 min — olika mått, se förklaring i § Hela ledtiden).

## Fynd

### 1. Aktivitetsmönstret — inte en jämn ström

Innan jag redovisar tider: CI-körningarna kommer inte jämnt utspritt över
kalendern. Av de 400 senaste `ci.yml`-körningarna föll de på bara 6 distinkta
dagar (2026-09-05, 06, 07, 08, 14, 17) — inga körningar alls 09-09 till
09-13 eller 09-15/16. Detta är sessionsdrivet arbete (Marcus/agenter jobbar i
intensiva pass, inte kontinuerligt), inte ett fel i mätningen. Det betyder
att "per vecka"-siffror nedan är genomsnitt över en **bucklig** verklighet:
vissa veckor nästan tomma, andra med 30+ landningar per dag. **Verifierad**
(direkt räkning på rådata).

### 2. Väntetiden per yta och klass — bimodal, inte en kurva

Jag delade upp väggklockstiden (skapad → klar) för lyckade körningar i två
hinkar: under 400 sekunder ("snabb", docs-liknande) och över ("långsam",
kod). Mönstret är slående konsekvent över alla tre händelsetyper:

| Yta (event) | Andel snabba | Snabb: median | Andel långsamma | Långsam: median | p90 | p95 |
|---|---|---|---|---|---|---|
| PR-ytan (`pull_request`) | 39 % (n=66) | 242 s (4,0 min) | 61 % (n=102) | 748 s (12,5 min) | 818 s (13,6 min) | 827 s (13,8 min) |
| Kö-ytan (`merge_group`) | 57 % (n=59) | 242 s (4,0 min) | 43 % (n=45) | 749 s (12,5 min) | 796 s (13,3 min) | 806 s (13,4 min) |
| Efter merge, dedup-checken (`push` på `ci.yml`) | 57 % (n=53) | 242 s (4,0 min) | 43 % (n=40) | 751 s (12,5 min) | 785 s (13,1 min) | 803 s (13,4 min) |

n = lyckade, avslutade körningar av `ci.yml`, fönster 2026-09-05–09-17.
**Verifierad.**

Det finns i praktiken **två** upplevelser, inte en gradvis skala: en
dokumentationsändring (eller något som klassas likadant) är klar på ~4
minuter; allt annat tar konsekvent 12,5–14 minuter, nästan oavsett hur stor
eller liten kodändringen är. Det är D0/D1/D3-klassningen (ADR-077) som ger
den tydliga tudelningen — se § Kritiska vägen för VARFÖR den långsamma
hinken alltid landar på just ~13 minuter oavsett kodstorlek.

**Notera:** `push`-raden ovan är INTE post-merge-testerna (den riktiga
databas-sviten) — det är `ci.yml`s egen dedup-kontroll som körs på varenda
push till `main`. Den riktiga post-merge-sviten är en helt separat
workflow (`post-merge.yml`), redovisad i § 4.

### 3. Den kritiska vägen — ett självtest, inte staging

Jag ritade den kritiska vägen genom att läsa start/slut-tider för varje
enskilt jobb i 8 fullständiga körningar (2 PR-körningar, 2 kö-körningar, 4
post-merge-körningar). Bilden är entydig och **verifierad direkt** (inte
härledd): på PR- och kö-ytan är `Staging (API + E2E)` (den riktiga
databastesten) och `A11y (axe-runner)` (tillgänglighets-testen) alltid
markerade `skipped` — bekräftat i källkoden:

```yaml
# .github/workflows/ci.yml, rad 2271–2273 (jobbet "suite" anropar ci-suite.yml)
with:
  run_staging: false
  run_a11y: false
  acceptance_selection: ${{ needs.changed.outputs.acceptance_urval }}
```

Så vad tar då 12–14 minuter, om inte staging? Svaret, sett i alla åtta
körningar utan undantag: jobbet **"Acceptance — tvåsidigt bevis
(hermetik-självtest)"**. Namnet betyder: ett test som kontrollerar att
acceptanstesternas egen isoleringsmekanism ("hermetiken" — att de inte av
misstag pratar med internet eller en riktig databas) fungerar, genom att
bevisa att testerna verkligen FALLERAR när isoleringen medvetet bryts
("tvåsidigt bevis" — testet bevisar både att rätt saker passerar OCH att
fel saker fälls). Det är alltså ett test AV testramverket, inte ett test av
produkten.

**Figur — kritisk väg, en typisk kod-PR (körning `34265004584`, 2026-09-08):**

```text
00:00  "Detect changed files"                              (12 s)
00:12  ┬─ Lint + TypeCheck                                  4 min 1 s
       ├─ Audit dependencies (audit-ci)                     31 s
       ├─ Docs link check (om docs ändrats)                 42 s
       ├─ Pure + Build                                      56 s
       ├─ Webblasarbeteende                                 2 min 4 s
       ├─ Acceptance (hermetisk) skärv 1/2/3                3–6 min vardera
       └─ Acceptance — tvåsidigt bevis (hermetik-självtest)  13 min 41 s  ◄── KRITISK VÄG
14:04  "CI Passed or Skipped" (väntar på ALLA ovan)          3 s
14:07  KLAR — total väggklocka 844 s (14 min 4 s)
```

Alla grenar startar nästan samtidigt (inom 15 sekunder efter "changed"), och
den sista aggregator-checken väntar på att ALLA ska vara klara — inklusive
den som redan är klar för länge sedan. **Konsekvens:** de sex snabba jobben
kostar praktiskt taget NOLL extra väggklocka eftersom de göms bakom den
långsamma — men de kostar fortfarande riktiga (om än gratis, se § 5)
CPU-minuter, parallellt.

**Post-merge-ytan är annorlunda — där är väntan verklig mutex-kö, inte
jobbtid.** Tre fullständiga post-merge-körningar, alla med den riktiga
`Staging (API + E2E)`-sviten:

| Körning | Acceptance-fasen klar | Staging startar | **Väntan (mutex-kö)** | Staging-jobbet självt | Total |
|---|---|---|---|---|---|
| `33989193147` (2026-09-05) | 20:17:17 | 20:52:03 | **34 min 46 s** | 11 min 35 s | 56 min |
| `34252657850` (2026-09-08) | 16:53:18 | 16:58:37 | 5 min 19 s | 18 min 50 s | 36 min |
| `34251110998` (2026-09-08) | 16:40:02 | 16:43:05 | 3 min 3 s | 15 min 29 s | 31 min |

**Verifierad** direkt ur jobbens `started_at`/`completed_at`. Den globala
`staging-tests`-mutexen som [merge-queue-forskningen](../../merge-queue-mot-staging-mutex-2026-07-26.md)
varnade för finns alltså kvar — den har bara flyttat sig från PR-/kö-ytan
(där den ADRIG suttit sedan `run_staging: false` blev villkorslöst) till
post-merge-ytan, exakt där den gamla forskningen förutspådde att den skulle
hamna om staging någonsin villkorades bort från kön.

Över samtliga 39 post-merge-körningar som faktiskt körde sviten (av 100
totalt — se § 4): **median 16,0 min, p90 32,2 min, p95 38,0 min, max 56
min.** Den gamla forskningens antagna "9,1 min" staging-tid stämmer alltså
inte längre — den riktiga sviten själv tar nu 11,5–18,8 minuter (uppmätt i
de tre exemplen ovan), och därtill kommer mutex-kön. **Starkt indikerad**
(baserat på 3 fulla exempel plus aggregatet över 39 — inte varje enskild
körnings mutex-väntan isär mätt).

### 4. Hela ledtiden för en landning, som en människa upplever den

Jag mätte fyra faser separat, på riktiga PR:er:

| Fas | Vad den mäter | Kod-PR (exempel) | Docs-PR (exempel) |
|---|---|---|---|
| PR skapad → armerad/i kön | Skrivande + första gröna check + `gh pr merge --auto` | varierar helt med hur länge arbetet på koden tar (se nedan) | varierar |
| I kön → mergad | Kö-körningens egen tid | 10–14 min (PR #2401: 13 min 39 s · #2420: 13 min 5 s · #2403: 10 min 37 s) | ~4 min (PR #2473: 4 min 13 s) |
| Mergad → post-merge klar | Riktig testsvit ELLER skip | 16–56 min (om sviten körs, se § 3) | ~25 s (skip, ärvd klassning) |

**"PR skapad → mergad" totalt**, mätt på 60 senast mergade PR:er
(2026-09-06 till 2026-09-08), uppdelat på om grennamnet var `docs/…` eller
kod:

| Klass | n | Median | p90 | Kortast | Längst |
|---|---|---|---|---|---|
| Alla | 60 | 28,9 min | 100,0 min | 7,5 min | 1415,0 min (23,6 h) |
| Docs (`docs/…`) | 25 | 9,4 min | 20,4 min | — | — |
| Kod | 35 | 40,5 min | 146,2 min | — | — |

**Viktig läsanvisning:** detta är INTE ren maskintid. De längsta talen
(1415 min = 23,6 timmar, 740 min = 12,3 timmar) är PR:er som stod öppna
över en paus i arbetet (session avslutad, återupptagen senare) — det är
människans/agentens arbetstid och väntan på nästa session, inte CI:s
väggklocka. Den delen av ledtiden som faktiskt ÄR maskin (kö-tid +
post-merge) är, som tabellen ovan visar, konsekvent 10–14 minuter för kod
och 4–5 minuter för docs, oavsett hur länge PR:en legat öppen innan den
armerades. **Verifierad** för de fyra citerade PR-exemplen (fullständig
tidslinje läst), **starkt indikerad** för aggregatet (60 PR:er, klassning på
grennamn, inte på filinnehåll).

### 5. GitHub Actions-tid — verklig volym, noll kronor

**Detta är dagens skarpaste korrigering av uppdragets underlag.** Repot är
INTE privat: `gh api repos/high-five-group/miranon-media-admin` svarar
`"private": false, "visibility": "public"`. Ägaren är organisationen
`high-five-group` på ett Enterprise Cloud-abonnemang (1 betald plats).
**Verifierad**, direkt API-svar 2026-09-17.

GitHub fakturerar aldrig Actions-minuter på ett publikt repo, oavsett
kontoplan — det är dokumenterad, mångårig GitHub-policy, och jag bekräftade
det EMPIRISKT på två oberoende sätt samma dag:

1. **Organisationens riktiga fakturaunderlag** (`gh api
   organizations/high-five-group/settings/billing/usage`, den nya
   "enhanced billing"-ändpunkten — den gamla `orgs/.../settings/billing/
   actions` svarar `410 Gone` och pekar hit):

   | Månad | Actions Linux-minuter | Bruttopris | Rabatt | **Nettokostnad** |
   |---|---|---|---|---|
   | Juli 2026 (från org-flytt 07-27) | 8 524 | 51,14 $ | 51,14 $ | **0,00 $** |
   | Augusti 2026 (hel månad) | **76 080** | 456,48 $ | 456,48 $ | **0,00 $** |
   | September 2026 (t.o.m. 09-17, ej fullständig) | 29 376 | 176,26 $ | 176,26 $ | **0,00 $** |

   Rabatten är exakt 100 % varje månad — det är public-repo-policyn i
   praktiken, inte en tillfällig kampanj.

2. **Fakturerbar tid per enskild körning** (`gh api .../actions/runs/<id>/
   timing`), stickprov på 5 av de långsammaste PR-körningarna (14 min
   väggklocka, 16 jobb vardera): samtliga fem svarade `"total_ms": 0` —
   noll fakturerbara millisekunder, trots att `run_duration_ms` (den
   verkliga väggklockan) korrekt visade 833 000–844 000 ms. **Verifierad.**

**Den enda posten med en riktig, icke-nollad kostnad** är
`ghec`/`Enterprise Cloud`-raden: 4,06 $ i juli (delmånad), 11,20 $ i
augusti — det är licenskostnaden för Enterprise Cloud-planen (≈21 $/plats/
månad, prorata), inte Actions. Enligt tidigare forskning
([merge-queue-mot-staging-mutex](../../merge-queue-mot-staging-mutex-2026-07-26.md))
köptes just detta abonnemang 2026-07-27 specifikt för att öppna "merge
queue"-funktionen. **Slutsats: hela CI-apparatens verkliga månadskostnad i
dollar är i praktiken den platsen — inte Actions-volymen.**

**Volymen är ändå verklig och värd att redovisa**, eftersom den beskriver
hur mycket riktig datorkraft som förbrukas (relevant om repot någonsin blir
privat, eller om GitHub ändrar sin publika-repo-policy):

| Period | Minuter | Per dag | Per vecka (extrapolerat) |
|---|---|---|---|
| Augusti (hel månad, säkraste ankaret) | 76 080 | 2 455/dag | **~17 180 min/vecka ≈ 286 timmar/vecka** |
| Juli (delmånad, 5 dagar efter org-flytt) | 8 524 | 1 705–1 894/dag | ~12 500 min/vecka |
| September (delmånad, t.o.m. 09-17) | 29 376 | 1 730–1 840/dag | ~12 500 min/vecka |

**Osäkerhet, öppet:** dessa är MÅNADSTOTALER delade på kalenderdagar — givet
den buckliga aktiviteten (§ 1) är den verkliga fördelningen mycket ojämnare
än ett dagsgenomsnitt antyder: en intensiv arbetsdag kan dra flera tusen
minuter, en tyst vecka nästan noll. Jag har inte brutit ut minuter per
workflow ur faktureringsraden (den ger bara en totalsumma per repo/månad,
inte per workflow-fil) — se § Vad jag inte kunde belägga.

**Fördelning per workflow (körningsfrekvens, inte fakturerad tid — den är
ju noll för alla):**

| Workflow | Körningar i stickprovet | Fönster | Median väggklocka |
|---|---|---|---|
| `ci.yml` | 400 | 2026-09-05–09-17 (6 aktiva dagar) | 4,0 / 12,5 min (bimodal) |
| CodeQL (GitHub-inbyggd) | 100 | 2026-09-06–09-17 (11 dagar, ~9/dag) | 89 s |
| `post-merge.yml` | 100 | 2026-09-04–09-08 (5 dagar, ~20/dag) | 25 s (skip) / 16,0 min (kör) |
| Dependabot Updates | 100 | 2026-07-27–09-14 (7 veckor) | 72 s |
| `nightly.yml` | 72 | 2026-07-23–09-17 (~8 veckor, 1×/natt) | 10,4 min |
| `nightly-watchdog.yml` | 56 | samma period | 15 s |
| `visual-baselines.yml` | 21 | manuellt triggad | 97 s |
| `gate-proof.yml` | 14 | manuellt triggad | 19 s |
| `review-backstopp-proof.yml` | 2 | manuellt triggad | 18 s |

CodeQL:s ~9 körningar/dag är oväntat högt för en manuell "default setup"-
scanning — **oväntat fynd, registrerat men inte utrett vidare** (utanför
denna delfråga).

### 6. Hur ofta körs hela flödet i onödan?

Fyra separata mönster, alla mätta:

**A) Dedupen fungerar, med ett undantag jag själv hittade.**
`metrics:ci` rapporterar 100 % dedup-träff (25/25) i sitt 100-körningars-
fönster — det betyder att när samma träd redan har en grön körning körs
INTE hela sviten om på main-push. Jag letade specifikt efter en MISS för
att inte bara lita på ett aggregat, och hittade en: körning `34142551183`
(push, 2026-09-07) körde HELA sviten igen (inklusive det 12-minuters
självtestet) trots att samma commit-SHA nyss hade en grön `merge_group`-
körning. Loggen är explicit: `"Dedup-miss: träd-avvikelse (5f0420e5… !=
403372c7…) → full svit (fail-closed)."` — mekanismen är fail-closed by
design (ADR-077 §2: en osäkerhet ger alltid full körning, aldrig ett hål),
så detta är sannolikt en legitim avvikelse (t.ex. att en annan post gick
före i kön och ändrade main-trädet), inte en bugg. **Verifierad** som
enskild instans; jag har inte utrett grundorsaken till just denna
träd-avvikelse (utanför denna delfrågas scope).

**B) Iteration på en och samma PR kostar mest i aggregat.** Av 121 unika
PR-grenar i 400-körningsfönstret fick 41 (34 %) MER ÄN EN `pull_request`-
körning — en gren (`task/402.8-formen-fore-stampeln`) fick **14** separata
körningar över 5 timmar 46 minuter. `concurrency`-inställningen
(`.github/workflows/ci.yml:43-45`, `cancel-in-progress: true` för
`pull_request`) avbröt 4 av dessa 14 (de som hann bli inaktuella innan de
hann köra klart) — men 10 körde till fullo, eftersom pushen kom EFTER att
föregående körning redan var klar, inte medan den fortfarande kördes. Det
är inte ett fel i verktyget — det är iterativt arbete som gör precis vad
det ska: ge snabb feedback per push. Men det förklarar en stor del av den
totala minutvolymen: 10 fulla körningar av en 3–14-minuters svit för EN
logisk ändring. **Verifierad** (fullständig körlogg för grenen läst).

**C) `audit-ci` körs på VARJE ändring, oavsett om beroenden ens rörts.**
Jobbet `audit` i `ci.yml` (rad 2097) har VARKEN `needs:` VARKEN `if:` —
det körs villkorslöst på varenda `pull_request`, `merge_group` och `push`-
körning, inklusive en ren dokumentationsändring som inte rör `package.json`
eller `package-lock.json` alls. Kostnaden per körning är låg (26–31
sekunder, mätt på 4 instanser) men den upprepas alltså tiotusentals gånger
över ett repos liv för en kontroll som logiskt sett bara behöver köras när
beroendeträdet faktiskt ändras. **Verifierad direkt i källkoden** — detta
är för övrigt redan bokfört som ett känt fynd i mitt uppdrags eget underlag
("S125:s fynd c").

**D) Dependabot-PR:er kan stå röda i dagar utan att någon tittar.** Fem
Dependabot-PR:er (`#2480`–`#2484`) skapades 2026-09-14 04:17–04:18, och
samtliga fem fick sin `pull_request`-körning fallera samma minut (jobblistan
för en av dem visar ALLA test-suite-jobb röda samtidigt — ett systemiskt
fel, inte fem separata buggar). Alla fem stod fortfarande öppna och
omergerade när jag mätte 2026-09-17, tre dagar senare. De körs INTE om
automatiskt av sig själva (Dependabot triggar bara om vid `@dependabot
rebase` eller ny commit) — så deras röda status är "fryst", inte
"upprepat körd i onödan". Det är ändå ett reellt mönster: fem PR:er som
tar upp plats i kön/listan utan framsteg. **Verifierad** (öppna PR:er
kontrollerade direkt, tidsstämplar matchar exakt mot de fem misslyckade
körningarna i mitt 400-körningsfönster).

### 7. Fail-fast-kalkylen — varför det INTE skulle bli snabbare

Frågan: skulle det löna sig att köra de billiga kontrollerna (Lint,
Audit, Docs) FÖRE de dyra (Acceptance-självtestet) och stoppa vid fel, i
stället för att köra allt parallellt som idag?

**Dagens läge (parallellt):** alla jobb startar nästan samtidigt. Den
långsammaste (Acceptance-självtestet, ~13–14 min) avgör alltid totaltiden,
OAVSETT om något annat jobb fallerar snabbt. En människa SER visserligen
en röd `Audit`-rad efter 30 sekunder i PR:ens checklista, men den
mekaniska grinden ("CI Passed or Skipped", det enda `required`-kravet)
rapporterar inte förrän ALLA jobb är klara — så det formella "PR:en är
röd"-beskedet kommer inte snabbare än idag, oavsett vilket jobb som
fallerade.

**Räkningen för en sekventiell "billigt-först"-ordning:**

- Lint + TypeCheck tar ~3–4 minuter själv (uppmätt 183–242 s i fyra
  instanser) — det är INTE ett par-sekunders jobb, det är bara osynligt
  idag eftersom det göms bakom det 13-minuters jobbet.
- Skulle Acceptance-självtestet vänta på att Lint+Audit+Docs blir gröna
  FÖRST, adderas deras tid (~4 min, eftersom Lint är den långsammaste av
  dem) FÖRE självtestets 13 min — ny total för en GRÖN körning: **~17 min,
  4 minuter LÅNGSAMMARE än idag.**
- Vinsten uppstår bara när Lint/Audit/Docs FALLERAR — då slipper man de 13
  minuternas Acceptance-körning helt. Men det händer sällan: av de
  verkliga (icke-upprepade) incidenter jag kunde urskilja i mitt
  400-körningsfönster (§ 8) var ungefär hälften renodlade Audit-fel och
  hälften renodlade Acceptance-fel — en sekventiell gate hade alltså bara
  hjälpt i HÄLFTEN av de redan sällsynta felfallen.

**Förväntad väggklocka, uppskattat:**

| Ordning | Grön körning (vanligast) | Röd på Lint/Audit | Röd på Acceptance |
|---|---|---|---|
| Dagens (parallellt) | ~14 min | ~14 min (aggregatorn väntar ändå) | ~14 min |
| Sekventiellt "billigt först" | **~17 min** (4 min sämre) | ~4 min (10 min bättre) | ~17 min (3 min sämre) |

Med en grön-frekvens på >90 % (från `metrics:ci`: 85/100 gröna i mitt
fönster) blir den FÖRVÄNTADE väggklockan för sekventiell ordning SÄMRE i
genomsnitt, eftersom den lilla vinsten på de sällsynta röda Lint/Audit-
fallen inte väger upp den garanterade 4-minuters-förlusten på alla gröna
körningar. **Slutsats: dagens parallella upplägg är rätt val, givet att
Acceptance-självtestet redan är så mycket dyrare än de billiga
kontrollerna.** Den enda vägen till en verklig förbättring är att göra
SJÄLVA det dyra jobbet snabbare eller mindre nödvändigt att köra på varje
ändring — inte att ändra ordningen på det som redan är billigt. Detta är
en beräkning byggd på uppmätta tider, inte en gissning — men den bygger på
en förenklad sannolikhetsmodell (grön-frekvens och feltyps-fördelning från
ett litet stickprov, se § Osäkerheter). **Starkt indikerad.**

### 8. Länkkontroll, audit och "staging på varje ändring" — en kontroll i taget

**Länkkontroll.** Sedan [ADR-082](../../../decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md)
(2026-07-28) körs PR-ytans länkkontroll `--offline` — den kontrollerar BARA
interna länkar (filpekare inom repot), aldrig externa webbadresser, och
bara när dokumentationsfiler faktiskt ändrats (`if:
needs.changed.outputs.docs_changed == 'true'`, `.github/workflows/
ci.yml`). Uppmätt kostnad: 42 sekunder i mitt exempel (jobbnivå, inklusive
checkout — själva lychee-verktyget tar enligt ADR-082 bara 31
millisekunder). Externa länkar kontrolleras bara nattetid
(`nightly.yml`), med hela 903 länkar och 125 externa värdar i sprängradien
— ADR-082:s egen motivering (en död extern sida hos någon ANNAN ska inte
kunna stoppa en PR som inte rör den) håller fortfarande och jag hittade
inget som motsäger den. **Dom: rätt avvägd redan, ingen ändring
motiverad.**

**Audit (`audit-ci`).** Se § 6C — körs villkorslöst på varje ändring,
~30 sekunder, och fällde riktiga PR:er minst 2 gånger av 4 observerade
verkliga incidenter i mitt fönster (dvs. den fångar verkliga saker, inte
bara brus). Kostnaden är låg per körning men den körs även när den
logiskt inte behöver (dokumentationsändringar). **Dom: behåll grinden,
men villkora den mot samma "har `package.json`/`package-lock.json`
ändrats"-signal som redan finns i D0-listan — låg kostnad att fixa, redan
identifierat i repots eget spårningsunderlag (S125).**

**Staging E2E (den riktiga databastesten).** Körs INTE på PR-/kö-ytan
längre (se § 3) — bara på post-merge (39 av 100 landningar i mitt
stickprov, resten var docs-only och hoppade sviten via "ärvd klassning",
ADR-077 § Updates 2026-08-28) och en gång per natt. Uppdragets ursprungliga
fråga ("behöver den köras på VARJE kodändring?") bygger alltså på ett
antagande som redan är förkastat i praktiken — svaret är redan "nej, bara
en gång per landning", vilket är en rimlig kompromiss givet att sviten
kostar 11,5–19 minuter ren körtid plus 3–35 minuter mutex-kö. Jag hittade
inget som tyder på att detta har missat en verklig regression (0 röda
"Staging"-jobb i mitt stickprov, men stickprovet är litet och kort — se
§ Osäkerheter). **Dom: dagens en-gång-per-landning-kadens är redan rätt
punkt på skalan; en tätare kadens (t.ex. B-alternativet i ADR-077 §
Updates: köra sviten på ett tidsintervall snarare än per landning) är
flaggad men inte byggd, och nattnätet redan täcker "har main varit grön
senaste dygnet"-frågan.**

## Osäkerheter och vad jag inte kunde belägga

- **Actions-minuter per workflow, i kronor/minuter (inte bara
  körningsfrekvens).** Faktureringsändpunkten ger bara en totalsumma per
  repo och månad, inte uppdelat per workflow-fil. Jag har uppskattat
  fördelningen indirekt via körningsfrekvens × uppmätt medianlängd, men
  har inte reko​nsiliierat den uppskattningen mot fakturerings-totalen
  siffra för siffra — det skulle kräva att summera jobbtider över SAMTLIGA
  körningar i en hel månad (tusentals `gh api`-anrop), vilket jag bedömde
  vara oproportionerligt för denna delfråga och skonsamt mot ett API en
  annan session delar med mig.
- **Nightly-sviten fallerar 56 av 72 gånger (78 %) — men jag har bara
  grundorsaks-utredd EN av dessa 56.** Den jag tittade på (2026-09-17)
  fallerade på FLERA olika grindar samtidigt (backlog-stängning,
  sessionsdok-fönster, sannings-avstämning, bredare sårbarhetsgranskning,
  länkkontroll OCH ett riktigt Acceptance-test) — vilket antyder att en
  stor del av nattnätets röda är PROCESS-grindar (glömda backlog-kort,
  ouppdaterade sessionsdok) snarare än produktregressioner. Jag har INTE
  brutit ut den fördelningen över alla 56 — det är ett separat, större
  utredningsarbete som hör hemma under J8.6 (testtillförlitlighet) eller
  J8.1 (incidentregister), inte denna tid/kostnads-fråga. **Detta är ett
  viktigt öppet fynd som påverkar tolkningen av "hur ofta fallerar CI"
  över hela granskningen, inte bara denna delfråga.**
- **Fail-fast-kalkylens sannolikhetsmodell (§ 7) bygger på ett litet
  stickprov** (4 urskiljbara verkliga incidenter över 6 aktiva dagar).
  Riktningen (dagens parallella upplägg är billigare i förväntat värde) är
  robust så länge Acceptance-självtestet förblir mycket dyrare än
  Lint+Audit+Docs tillsammans — men exakta procenttal ovan ska läsas som
  en storleksordning, inte en exakt kalkyl.
- **Jag har inte mätt hur mycket av "PR skapad → armerad"-fasen (§ 4) som
  är ren mänsklig/agent-tänketid kontra maskinell väntan** på ett sätt som
  går att särskilja i efterhand ur GitHubs API — den datan finns bara i
  sessionsdokens egen prosa, inte i någon strukturerad logg.
  **Ej verifierbar** utan att läsa igenom motsvarande sessionsdok för
  varje enskild PR.
- **`Organizations`-fakturerings-API:t (`gh api organizations/high-five-
  group/settings/billing/usage`) krävde inga extra rättigheter utöver
  Marcus egen autentiserade `gh`-session** i den här körningen — jag vet
  inte om detta hade fungerat från ett agent-token med snävare
  behörigheter. Det gamla `orgs/.../settings/billing/actions`-anropet gav
  ett tydligt `410 Gone` med en pekare till den nya ändpunkten, inte ett
  behörighetsfel — så åtkomstfrågan uppstod aldrig i praktiken denna gång.
- **Jag har inte mätt paritet mellan `metrics:ci`s 100-körningsfönster och
  mitt eget 400-körningsfönster** — de överlappar delvis men täcker olika
  antal dagar (metrics:ci tar de 100 SENASTE oavsett datum; mitt fönster
  är avgränsat till `--limit 400` vilket råkade landa på exakt 12
  kalenderdagar). Talen är alltså inte direkt adderbara, och jag har hållit
  dem åtskilda med egna N och datumintervall genomgående ovan.

## Risker

- **Att läsa "0 kronor" som "kostnadsfrågan är oviktig".** Noll kronor
  betyder inte noll resursförbrukning eller noll risk: om repot någonsin
  blir privat (t.ex. vid en framtida affärsmässig omständighet), eller om
  GitHub ändrar sin publika-repo-policy, slår hela minutvolymen (76 000+
  min/månad i augusti) igenom som en faktisk räkning omedelbart. Att
  fortsätta växa CI-volymen utan att hålla koll på den, med motiveringen
  att den är gratis idag, är en medveten risk att bära öppet — inte ett
  skäl att sluta mäta.
- **Nightly-sviten fälls så ofta (78 %) att larmkedjans "kyrkogårdseffekt"
  (ADR-077 § Kontext) är ett reellt hot** — om varje natt är röd blir röd
  det normala, och en människa slutar reagera. Detta bör utredas vidare
  (se § Osäkerheter), inte ignoreras för att denna delfråga inte hade
  utrymme att gå på djupet.
- **Fail-fast-kalkylen i § 7 gäller EXAKT dagens arkitektur.** Ändras
  balansen (t.ex. om Acceptance-självtestet görs snabbare, eller om
  Audit-felfrekvensen stiger kraftigt) kan slutsatsen vända. Den är inte
  ett permanent naturlag.

## Rekommendationer

**OBS: rekommendationer, inte beslut.** Ingen ADR eller styrande text
förkastar dessa — men de har heller inte grillats med Marcus.

1. **Villkora `audit-ci`-jobbet mot samma dependency-signal som redan
   beräknas i `changed`-jobbet** (t.ex. "har `package.json` eller
   `package-lock.json` ändrats"), i stället för att köra det villkorslöst
   på varje ändring. Låg risk (jobbet är redan `fail-closed` vid osäkerhet
   enligt sina egna kommentarer), låg kostnad att bygga, och tar bort en
   del av den återkommande minutvolymen på rena dokumentations- och
   copy-ändringar. Detta är redan ett registrerat, obehandlat fynd i
   repots eget underlag (S125) — denna granskning bekräftar bara att det
   fortfarande gäller och kvantifierar det.
2. **Rör INTE jobbordningen för att jaga "fail-fast"** — § 7:s kalkyl
   visar att det skulle göra den vanliga (gröna) vägen långsammare, inte
   snabbare, givet dagens tidsförhållanden mellan jobben.
3. **Utred nightly-sviten grundorsaksmässigt innan den tolkas som ett
   kvalitetsmått.** 78 % röd är antingen ett verkligt allvarligt tecken
   (produkten är trasig fyra nätter av fem) eller ett tecken på att
   process-grindarna (backlog-stängning, sessionsdok-fönster) är för
   strikta för nattkörning — dessa två tolkningar kräver helt olika
   åtgärder, och jag kunde inte skilja dem åt inom denna delfrågas scope.
   Peka detta vidare till J8.1/J8.6.
4. **Överväg att sätta ett kalenderpåminnelse eller ett litet
   bevaknings-skript för GitHubs publika-repo-Actions-policy**, givet att
   hela kostnadsbilden (§ 5) vilar på den ena regeln. En policyändring hos
   GitHub skulle omedelbart göra 76 000+ minuter/månad till en riktig
   räkning, utan att något i vårt eget repo behövde ändras för att
   utlösa det.
5. **Behåll dagens en-gång-per-landning-kadens för staging E2E** — inget i
   mitt underlag talar för att köra den oftare (kostnaden är hög, 0
   missade regressioner observerade i det korta stickprovet) eller
   glesare (nattnätet är redan det glesare nätet, och `ADR-077`s egen
   Google-modell kräver att presubmit-selektion ALLTID har ett
   post-submit-nät under sig).

## Källor

**Repo-filer (läst direkt, citerade med rad där det är bärande):**

- `.github/workflows/ci.yml` — rad 43–45 (concurrency), 2097–2100 (audit-
  jobbet, ingen `needs`/`if`), 2259–2273 (`run_staging: false`,
  `run_a11y: false`, `acceptance_selection` villkorslöst för suite-anropet)
- `.github/workflows/post-merge.yml`, `.github/workflows/nightly.yml`,
  `.github/workflows/ci-suite.yml` — jobbstruktur, läst för att förstå
  vilken yta som faktiskt äger staging/a11y
- `scripts/ci-metrics.mjs` — instrumenteringsverktygets egna definitioner
  och läsregler (L314, L319)
- [`docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md`](../../../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
- [`docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md`](../../../decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md)
- [`docs/research/verify-ci-parity-regel-vantetid-2026-08-05.md`](../../verify-ci-parity-regel-vantetid-2026-08-05.md)
- [`docs/research/merge-queue-mot-staging-mutex-2026-07-26.md`](../../merge-queue-mot-staging-mutex-2026-07-26.md)
- [`docs/research/riskanpassad-ci-design-2026-07-23.md`](../../riskanpassad-ci-design-2026-07-23.md)

**Levande data (GitHub API, hämtad 2026-09-17 mot
`high-five-group/miranon-media-admin`):**

- `gh api repos/high-five-group/miranon-media-admin` — synlighet/ägarskap
- `gh api orgs/high-five-group` — plan (`enterprise`)
- `gh api organizations/high-five-group/settings/billing/usage` —
  fakturerings-rader juli–september 2026
- `gh api repos/.../actions/runs/<id>/timing` — fakturerbar tid, 5 körningar
  (`34265004584`, `34082470894`, `34147525702`, `34182683812`,
  `34248030069`)
- `gh api repos/.../actions/runs/<id>/jobs` — jobb-nivå-tider, 12 körningar
  inklusive `34265004584`, `34141405913`, `34142551183`, `33989193147`,
  `34252657850`, `34251110998`
- `gh run list --workflow ci.yml --limit 400` samt motsvarande för
  `nightly.yml`, `post-merge.yml`, `nightly-watchdog.yml`,
  `visual-baselines.yml`, `gate-proof.yml`, `review-backstopp-proof.yml`,
  CodeQL (`workflow id 321349019`) och Dependabot Updates
  (`workflow id 272210299`)
- `gh pr list --state merged --limit 60` samt
  `gh api repos/.../issues/<nr>/timeline` för PR `#2401`, `#2403`, `#2420`,
  `#2473`
- `gh pr list --author app/dependabot --state open` — fem öppna PR:er
  `#2480`–`#2484`
- `npm run metrics:ci -- --limit 100 --json` — kört 2026-09-17
