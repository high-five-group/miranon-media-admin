---
owner: marcus803
updated: 2026-07-28
review_by: 2027-01-28
status: stable
---

# Acceptance-utbrytningens utfall — mätt, inte projicerat (task-59.7, 2026-07-28)

> **Proveniens:** detta är en MÄTNING, inte ett research-pass. Varje tal nedan är
> hämtat ur GitHubs körnings-API (`repos/{owner}/{repo}/actions/runs/<id>/jobs`)
> den 2026-07-28 och bär sitt run-ID, så det går att hämta om. Inget tal är
> projicerat ur ett annat tal. Ett lokalt uppmätt tal märks uttryckligen som
> lokalt — `TASK-60` kostade oss en prognos på ~50 s mot 289 s faktiskt
> (5,8× fel) för att en lokal mätning lästes som en CI-mätning.

## Kort svar

|fråga|svar|
|---|---|
|Föll mutex-hållningen?|**Ja: 9,77 → 6,55 min** (median, **−32,9 %**)|
|Höll projektionen 9,25 → ~2,4 min?|**Nej.** Faktorn blev **1,49**, inte 3,8|
|Vad kostar acceptance-jobbet?|**6,78 min** (median), i egen mutexfri parallell|
|Är avvikelsen förklarad?|**Ja, aritmetiskt** — projektionen tillämpades på fel population (§ 4)|

Vinsten är verklig och den är strukturellt rätt sorts vinst: mindre arbete
behöver den dyra resursen. Men den är hälften så stor som projektionen lovade,
och skälet går att räkna fram exakt — det är inte en mätosäkerhet.

## 1. Vad som mättes, och varför just det

**Mutex-hållning := `test-staging`-jobbets väggklocka** (`started_at` →
`completed_at`). Motiveringen är strukturell: `concurrency: group:
staging-tests` sitter på JOBBET i `ci-suite.yml`, alltså är gruppen upptagen
exakt så länge jobbet kör. Alla andra staging-rörande körningar köar under
precis det intervallet.

**Detta är INTE `ci-metrics`-skriptets `stagingQueue`-mått.** Det måttet är
`created_at` → staging-jobbets `started_at` och innehåller runner-allokering,
uppströmsjobb OCH mutex-väntan — skriptet säger det självt i sin egen
rapportrad (*"INTE isolerad mutex-tid"*). Att läsa AC #1 ur det talet hade varit
att mäta väntan i stället för hållning.

**Fönstren.** *FÖRE* = de sex CI-körningar som ligger omedelbart före
`task-59.3`, den första skivan som faktiskt flyttade filer. *EFTER* = de tre
körningar som har samtliga 18 filer ute. Endast lyckade jobb ingår; en avbruten
körning har ingen hållningstid att bidra med.

|fönster|run-ID|
|---|---|
|FÖRE|`30300688448` `30301603941` `30305038957` `30306250598` `30310189367` `30311000898`|
|EFTER|`30346750369` `30350071842` `30351478757`|

**Ärlig avgränsning.** Låsets faktiska tagning och släpp är inte instrumenterat
— jobbets väggklocka är den bästa tillgängliga proxyn, och det är samma storhet
som ADR-080:s egen 9,25-siffra mätte. Medianen är nearest-rank (repots
konvention i `ci-metrics.mjs`), inte interpolerad.

## 2. Mutex-hållningen (AC #1)

|mått|FÖRE (n=6)|EFTER (n=3)|förändring|
|---|---|---|---|
|**jobbets väggklocka, median**|**586 s = 9,77 min**|**393 s = 6,55 min**|**−193 s / −32,9 %**|
|spann|491–606 s|391–411 s|—|
|medelvärde|571,7 s|398,3 s|−30,3 %|
|steget `E2E tests (staging)`, median|458 s|271 s|−187 s / −40,8 %|
|steget `API tests (staging)`, median|91 s|90 s|oförändrat (per design)|

API-steget rör sig inte, och det är rätt: ADR-080 beslut 2 säger *"API-sviten
flyttas inte. Punkt."* Hela rörelsen sitter i e2e-steget, vilket är precis vad
en korrekt utförd utbrytning ska ge.

**Mot projektionen:** ADR-080 § Konsekvenser lovade `9,25 → ~2,4 min`, en faktor
3,8. Utfallet är faktor **1,49**.

**Om ADR-080 § UTFALL:s tal `9,10 → 6,50`.** Efter-siffran reproduceras (jag
mäter 6,55). Före-siffran gör jag inte: medianen över de sex körningarna
omedelbart före migreringen är 9,77 min, inte 9,10. Jag vet inte hur 9,10
härleddes och gissar inte. Talen ovan bär sina run-ID:n; det gör inte 9,10.

**Sidoeffekt värd att veta om:** hela svitens kritiska väg (körningens
`created_at` → sista tunga jobbets slut) föll från **627 s till 453 s median**,
−27,8 %. Men i körning `30351478757` var det **acceptance-jobbet, inte
staging**, som avslutade sist. Mutexen är alltså inte längre självklart svitens
längsta stolpe — se § 3.

## 3. Acceptance-jobbets egen körtid (AC #2)

Tre körningar med samtliga 18 filer ute:

|run|totalt|uppstart|`test:acceptance`|`test:acceptance:sjalvtest`|
|---|---|---|---|---|
|`30346750369` (PR `#318`)|404 s = 6,73 min|26 s|174 s|202 s|
|`30350071842` (PR `#323`)|407 s = 6,78 min|24 s|175 s|203 s|
|`30351478757` (PR `#324`)|452 s = 7,53 min|60 s|182 s|202 s|

Kolumnerna summerar inte exakt till totalen (2–8 s per rad): efterstegen
(`Post Cache`, `Post Setup Node`, `Post Checkout`, `Complete job`) och glappen
mellan steg ingår i jobbets väggklocka men har ingen egen kolumn här.

**Median 407 s = 6,78 min.** Jobbets tak var `timeout-minutes: 8` (480 s) —
marginal 28 s vid värsta observationen, 5,8 %.

**De 45 sekundernas skillnad mellan `#323` och `#324` är inte testvarians.**
Nedbruten per steg: uppstarten gick 24 → 60 s, varav steget *Cache Playwright
browsers* ensamt 4 → 33 s; de två teststegen tillsammans gick 378 → 384 s.
Alltså **~80 % infrastruktur, ~20 % test**. Det spelar roll för slutsatsen: en
enda uppstartsstegs observerade spridning (29 s) är större än hela den
kvarvarande marginalen (28 s), så nästa körning kunde slå i taket utan att något
i koden ändrats. Åtgärden och dess prislapp står i `ci-suite.yml` vid jobbet.

**Självtestet kostar mer än den skarpa sviten** (202 s mot 174 s) trots att det
kör samma 152 tester. Det är inte ologiskt — i självtestläget fälls varje test,
och en fällning är dyrare än ett godkännande — men det betyder att **hälften av
acceptance-jobbets tid går till hermetik-beviset, inte till appens beteende**.
Det är en design-fråga (bevisets kadens), inte ett fel, och den lämnas öppen
här.

**Vad jobbet inte kostar:** ingenting på mutexen. Det är hela poängen. Sviten
tog 187 s ur det serialiserade e2e-steget och betalar 174 s för samma tester i
en parallell körning som ingen annan väntar på.

### 3.1 Efter takhöjningen — mätt på den commit som gjorde den

Run **`30354520046`** (PR `#328`, den här skivans egen körning) är den första
med taket på 12 min:

|jobb|väggklocka|mot sitt tak|
|---|---|---|
|`Acceptance (hermetisk)`|**403 s = 6 min 43 s** (uppstart 20 s · skarp svit 176 s · självtest 203 s)|720 s — marginal **317 s / 44 %**|
|`Staging (API + E2E)`|**358 s = 5,97 min**|720 s|

Två saker bekräftas av den körningen. Dels att `#324`:s 452 s var
uppstartsvarians och inte en ny normalnivå: uppstarten är tillbaka på 20 s och
teststegen ligger på 176 + 203 s, alltså inom det spann § 3 mäter. Under det
GAMLA taket hade marginalen varit 77 s.

Dels att **acceptance-jobbet återigen avslutade sist av svitens tunga jobb**
(11:29:24 mot stagings 11:28:53). Mutexen är inte längre svitens längsta stolpe
— det hermetiska jobbet är det, i två av de fyra körningar som mätts.

## 4. Avvikelsen mot projektionen (AC #4)

Avvikelsen är stor: lovat −74 %, levererat −33 %. Den redovisas som utfall, och
orsaken är räknebar.

### 4.1 Projektionen tillämpades på fel population

[Tidsbudget-passet](staging-svitens-tidsbudget-2026-07-26.md) härledde `410 s`
så här: **296 av 333 e2e-tester** registrerar minst en `page.route` och räknas
därför som *"mockar redan sin EF"*; passets fördelningsmodell sätter **1,384
s/test**; 296 × 1,384 ≈ **410 s**. Det talet blev ADR-080:s `~2,4 min`.

Men **klassnings-kriteriet är fil-nivå, inte test-nivå.** En fil flyttas bara om
HELA filen är hermetiserbar. Utfallet blev 18 filer med **152 tester** — inte
296.

|population|tester|modellens tid|
|---|---|---|
|projektionens («tester som mockar»)|296|410 s|
|migreringens (18 hela filer)|152|210 s|
|**skillnad**|**−144 tester**|**−200 s**|

**147 av de 296 mockande testerna lämnade aldrig e2e** — de bor i filer som
också innehåller minst ett live-test, eller i filer som ADR-080 undantog av
strukturella skäl. Den enskilt största posten är
`event-detail.staging.test.ts`: **56 tester, varav 50 mockande, 77,5 s modellerad
tid** — hela filen stannade för att 6 av testerna går live.

### 4.2 Modellen höll — populationen gjorde inte det

Prövat mot mätningen:

|led|förutsagt e2e-steg|
|---|---|
|projektionen (296 tester bort)|461 − 410 = **51 s**|
|samma modell, rätt population (152 tester bort)|461 − 210 = **251 s**|
|**faktiskt uppmätt**|**271 s**|

(`461 s` är tidsbudget-passets egen uppmätta e2e-steg-tid. Min egen FÖRE-median
är `458 s` — 3 sekunder isär, alltså samma storhet. Jag räknar mot 461 för att
hålla ledet inom projektionens eget underlag i stället för att blanda två
mätningar mitt i en jämförelse.)

Fördelningsmodellen träffar alltså inom **8 %** när den tillämpas på den
population som faktiskt flyttades. Felet ligger inte i s/test-modellen — det
ligger i att två research-pass kombinerades utan att skäras mot varandra:
**anrops-mätningen** (863 anrop / 32 filer) avgjorde VILKA FILER som kunde
flyttas, **tidsbudgeten** avgjorde HUR MYCKET TID som skulle försvinna, och
ingen räknade skärningen mellan dem.

### 4.3 ADR-080:s egen hypotes — delvis rätt, inte hela vägen

ADR-080 § UTFALL gissar: *"de arton filerna bar en mindre andel av sviten än
tidsbudget-passet uppskattade, eftersom mätningen räknade ANROP och inte
väggklocka."*

Första ledet stämmer. Andra ledet är inte riktigt: de 410 sekunderna kom inte ur
en anrops-räkning utan ur en per-test-väggklocksmodell. Hypotesen pekar ändå åt
rätt håll, eftersom det VAR anrops-mätningen som satte fil-klassningen — men
mekanismen är skarpare än gissningen: **populations-krock mellan två pass**, inte
fel storhet i ett.

Modellen bar dessutom en KÄND bias i rätt riktning, öppet skriven i passet
självt: *"filer med mycket live-trafik är underskattade och filer med enbart
mockar överskattade."* Den biasen syns i mätningen — modellen sa 210 s för de
152 testerna, faktiskt utfall 187 s, alltså **12 % överskattning** precis som
varningen förutsåg. Den delen av felet är liten. Populationsfelet är det stora.

## 5. Jämförbarhet — vad talen INTE får läsas som

- **`ci-metrics`-baslinjen är inte längre samma svit.** Fönstret innehåller nu
  ett femte tungt jobb (acceptance) som inte fanns vid S91:s ursprungstal.
  PR-ledtid och `stagingQueue` ur det skriptet är därför inte äpplen mot äpplen
  över migreringen. **Mätningen ovan är det**, eftersom den läser en enda
  jobb-varaktighet som existerar identiskt i båda fönstren.
- **Testmängden är oförändrad totalt.** Räknat 2026-07-28 med
  `playwright test --list`: acceptance **152 tester / 18 filer**, e2e
  **181 tester / 15 filer** (14 spec-filer + `auth.setup.ts`). Summa **333** —
  exakt tidsbudget-passets 333. Ingen täckning försvann; den bytte klass.
  (Uppdragsbeskrivningens formulering om *"62 färre e2e-tester"* går jag inte i
  god för — jag mäter 333 → 181 i e2e-projektet, alltså −152, och +152 i
  acceptance-projektet.)
- **n är litet.** Tre EFTER-körningar i § 2. Spridningen är liten (391–411 s) men
  tre punkter är tre punkter, och medianen ska läsas därefter. En fjärde punkt
  tillkom efteråt (§ 3.1, run `30354520046`): staging **358 s**, alltså under
  hela det tidigare spannet — den stärker riktningen men ingår inte i medianen,
  eftersom fönstret var stängt när talet uppstod.
- **Runner-varians ingår i jobb-talen.** FÖRE-fönstret ligger kvällen 2026-07-27,
  EFTER-fönstret förmiddagen 2026-07-28, och § 3 visar att uppstartssteg kan
  variera med tiotals sekunder mellan körningar. Därför bär e2e-STEGET
  (458 → 271 s) mer bevisvikt än jobbets totala väggklocka: det steget innehåller
  ingen checkout, ingen `npm ci` och ingen browser-cache.
- **Ingen av siffrorna i § 2–4 är lokal.** Alla kommer ur CI. De enda lokala
  körningarna i denna skiva är T105-prövningen (§ 6), och de mäter inte tid.

## 6. T105 — hermetik-rapporten skrevs ur en gammal mätning

Åtgärdad i samma skiva. `tests/global-setup.ts` nollställde JSONL:en endast i
mätläget, medan `tests/global-teardown.ts` läste och skrev ut den utan att pröva
flaggan. En kvarlämnad fil presenterades därför som den just körda svitens
utfall.

**Reproducerat i sin värsta form** (lokalt, 2026-07-28): en plantad
`.hermetik/rapport.jsonl` plus ett `--grep` som inte matchade något gav
`Error: No tests found` — och därefter en fullständig hermetik-rapport som namngav
den skarpa staging-värden. **Noll tester kördes; rapporten skrevs ändå ut.**

**Prövad åt båda håll efter fixen:**

|riktning|uppställning|utfall|
|---|---|---|
|röd|plantad fil, flagga AV, noll tester|**ingen utskrift** — filen ligger kvar orörd|
|grön|`PLAYWRIGHT_HERMETIK_RAPPORT=1`, `mer-segment-send.acceptance.test.ts`|**rapport utskriven**: 18 anrop, två värdar (fixtur-origin + typsnitts-CDN), inget tredje värdnamn|

Villkoret är nu flaggan, inte filens existens: en kvarlämnad fil kan aldrig bli
en rapport, och en påslagen mätning skriver alltid sin.

## 7. Risk-klassningen (AC #3) — vad som är bevisat och vad som inte är det

Acceptance-klassen fick i denna skiva sin plats i `changed`-jobbets
klassnings-mekanik: ett nytt `changed-acceptance`-steg med allowlisten
`tests/acceptance/**`, wirat till `suite`-jobbets `run_staging`-input via samma
lever som D1. En commit vars varenda fil ligger i klassen tar därmed inte
staging-mutexen.

**Fail-open-frågan är källverifierad, inte antagen.** Om `only_changed` blivit
vakuöst `true` när ingen fil matchar hade staging släckts för varje PR.
`src/changedFilesOutput.ts` vid den pinnade SHA:n kräver
`allChangedFiles.paths.length > 0` — noll matchningar ger `false` ger full svit.
Villkoret står också i `ci.yml` vid steget.

**Bevisläget, ärligt.** ADR-077 sätter kontrastbevis som beviskrav för
klassning. Denna PR ger den NEGATIVA grenen skarpt: dess diff rör `ci.yml`,
`tests/global-teardown.ts` och dokumentation, alltså filer utanför allowlisten,
och staging ska köra. Den POSITIVA grenen — en PR vars hela diff ligger under
`tests/acceptance/**`, där staging ska vara skippad och acceptance ändå kört —
är **inte körd här**, eftersom denna skiva inte hade någon äkta ändring i den
katalogen och en påhittad sådan inte är ett bevis utan en rekvisita.

Receptet för den positiva grenen, när nästa acceptance-lokala ändring ändå ska
landa: kontrollera i den PR:ens körning att `Staging (API + E2E)` står som
`skipped`, att `Staging sentinel purge` står som `skipped`, och att
`Acceptance (hermetisk)` kört grönt. Blir någon av de tre annorlunda är
klassningen fel och ska rivas, inte justeras.

## 8. Ett oväntat fynd ur verifieringen — `T106`

Den lokala DoD-körningen av `npm run test:acceptance:sjalvtest` gav **151/152 av
vakten** första gången och **152/152** i en omedelbar omkörning på exakt samma
träd. Grindens verdikt beror alltså på ett race: i självtestläget når `get-events`
— ett anrop appskalet gör, inte testet — vakten ASYNKRONT via MSW:s
`onUnhandledRequest`, medan testets `toBeFocused` har 5000 ms timeout. Landar
timeouten först bär resultatet bara assertion-felet, och skriptet rapporterar då
korrekt att fällningen inte var vaktens.

Isolerat föll samma fils tre tester alla på vakten (3/3), så det är LAST och inte
testet. I CI är steget grönt 3/3. Registrerat som `T106`, ej åtgärdat här:
grindens gröna besked är fortsatt trovärdigt, men dess RÖDA kan vara falskt — och
en falsk röd i acceptance-jobbet är samma signal-förstörelse som resten av denna
skiva handlar om.

## 9. Följder

- **Taket höjt 8 → 12 min** på acceptance-jobbet, med prislappen utskriven vid
  jobbet i `ci-suite.yml`. Höjningen är andrum, inte fix.
- **Den varaktiga häven är parallellisering** (workers/shards). Den är
  medvetet deferad av ADR-080 och `TASK-59`-kortet: den linjära skalningen i
  workers är ett ANTAGANDE som ska mätas när den aktiveras. Utbrytningen har
  gjort den möjlig — sviten delar ingen muterbar resurs — men den aktiveras
  inte här.
- **Självtestets kadens är en öppen fråga.** Det bär halva acceptance-jobbets
  tid. Att flytta det vore att ge upp ett per-push-bevis; att behålla det är att
  betala 200 s per körning för det. Beslutet är inte taget här.
- **Lärdomen för nästa projektion:** två mätningar som svarar på olika frågor
  (VILKA filer kan flyttas · HUR MYCKET tid finns i sviten) får aldrig
  multipliceras ihop utan att skärningen räknas. Det är hela avvikelsen.

## Relaterat

- [ADR-080](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md) —
  beslutet, projektionen och § UTFALL som denna mätning stänger
- [Tidsbudgeten](staging-svitens-tidsbudget-2026-07-26.md) — där 410 s och
  1,384 s/test kommer ifrån
- [Hermetik-mätningen steg 1](hermetik-matning-steg1-2026-07-26.md) —
  anrops-mätningen som satte fil-klassningen
- [ADR-077](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md) —
  risk-klassningen som acceptance-klassen wirades in i
