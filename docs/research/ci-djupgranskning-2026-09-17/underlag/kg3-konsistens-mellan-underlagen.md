---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# KG3 — Konsistensgranskning: säger de arton underlagen samma sak?

> **Proveniens:** skrivet av en `research-pass`-agent (modell: se § Rapport till
> orkestreraren) som uppdrag KG3 i CI-djupgranskningen (Session 126), 2026-09-17,
> efter att våg 1 (arton agentpass, fyra leverabler + fjorton underlag,
> 14 272 rader) rapporterat komplett. Kört i worktreen
> `s126-ci-djupgranskning`, gren `docs/s126-ci-djupgranskning`, HEAD `99839e78`
> vid skrivandet. Läste `00-agentkontrakt.md` och
> `01-orkestrerarens-stickprov.md` i sin helhet FÖRE allt annat, per
> uppdragets instruktion — orkestrerarens arton stickprov (S1–S18) räknas som
> AVGJORDA där de säger så, och byggs inte om här. Detta dokument utreder
> ENDAST det orkestreraren INTE redan hunnit pröva.

## Kort svar

**Underlagen är i sak anmärkningsvärt samstämmiga.** Arton oberoende agenter,
flera med avsiktligt överlappande frågor, motsäger varandra i **grundläggande
mekanik nästan aldrig** — där två filer beskriver samma jobb, samma hook eller
samma flöde är beskrivningarna kompatibla rad för rad. De motsägelser som
finns är nästan uteslutande **mätfönster- eller definitionsskillnader** (olika
`--limit`, olika tidpunkt på samma dag, olika enhet räknad), inte oense
sakuppgifter. Jag hittade **noll** fall där två agenter beskriver en mekanism
(en hook, ett jobbs `if:`-villkor, en grinds blockeringsförmåga) på sätt som
inte går att förena.

Där jag prövade siffror mot disk/GitHub själv höll de flesta, men jag hittade
**sex nya, tidigare obokförda avvikelser** utöver orkestrerarens arton — fem
är nu lösta med ett enda kommando vardera, en (Jobb 6) är ingen motsägelse
utan en ren lucka. De **tre viktigaste att bära in i slutrapporten**, i
fallande allvar:

1. **Nattnätets rödhetsgrad citeras i FEM olika former** (21, 40, "49 minst",
   "56 av 72 = 78 %", "51 av 52 = 98 %") över fem filer. Jag har räknat om
   samtliga 72 körningar `nightly.yml` någonsin haft, uppdelat på händelsetyp
   och datum: den KORREKTA, mest talande siffran är **51 av 52 schemalagda
   körningar röda sedan 2026-07-28** (enda gröna natten var 2026-07-29), vilket
   ger en **obruten ström på 50 raka röda schemalagda nätter** (2026-07-30 →
   2026-09-17, mättdatum). J8.7:s ofta citerbara "78 %" blandar in 16 manuella
   `workflow_dispatch`/`simulate_failure`-självtester i nämnaren och
   **underskattar** därmed hur illa nätet faktiskt mår — den siffran bör INTE
   användas i slutrapporten. Se § Motsägelsetabellen post M1.
2. **Jobb 6 — "CI som återanvändbar, centralt förvaltad djup modul" — och
   leverabel 6 ("Branschjämförelse", den faktiska bedömningen av VÅRT system
   mot branschpraxis) saknas HELT.** Ingen av de arton passen gör
   klassificeringen "behåll lokalt / centralisera / produktifiera / förenkla /
   ta bort" per komponent, föreslår en målarkitektur, en migrationsplan eller
   en installationsväg för ett nytt repo. J8.8 pekar uttryckligen bort från
   sig själv ("det är jobb 6:s uppgift"), och J4a pekar mot ett aldrig
   spawnat "Jobb 4b". Detta är inte en motsägelse mellan filer — det är
   granskningens enskilt största kvarvarande skuld mot uppdraget. Se §
   Luckorna.
3. **`ci-post-merge`-ärendenas totalantal ges som "207" (J1b) och, underförstått,
   "60" (J8.4: "Samtliga 60 ... i repot")** — jag har räknat live: **207 är
   rätt**, 0 öppna. J8.4:s "60" var bara den `--limit 60`-satta delmängden
   agenten råkade hämta utan att kontrollera om fler fanns; sakinnehållet i
   J8.4:s djupare analys (alla stängda, de 16 senaste stängda i en klump
   2026-09-17) håller ändå. Se § Motsägelsetabellen post M2.

Utöver dessa tre: **Jobb 4:s egentliga branschJÄMFÖRELSE** (till skillnad
från J4a:s rena branschKARTLÄGGNING) är obesvarad av samma skäl som Jobb 6 —
värt att nämna i samma andetag eftersom åtgärdsplanen (leverabel 11) inte kan
skrivas utan endera.

## Vad jag läste

I denna ordning, i sin helhet, innan jag prövade något själv:
`00-agentkontrakt.md`, `01-orkestrerarens-stickprov.md`,
`tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` (samtliga 454
rader, inklusive § Obligatoriska leverabler och § Slutlig kvalitetsgrind —
INTE bara jobb-avsnitten uppdraget själv pekade mig mot), samtliga fyra
färdiga leverabler (`03-andringslogg.md`, `04-branch-worktree-commit-och-
pushflode.md`, `06-airtable-kompromisser-och-empiriska-fynd.md`,
`07-hermetiska-tester-kontra-realistisk-e2e.md`) och samtliga fjorton
underlag (`j1a`–`j1f`, `j3`, `j4a`, `j8-1`, `j8-4`–`j8-8`). Total läsning:
drygt 14 000 rader. Jag har INTE öppnat något som ligger utanför denna
katalog (t.ex. `backlog/tasks/`-korten agenterna citerar) — där en agents
källhänvisning behövde prövas har jag prövat mot GitHub/disk direkt i
stället, aldrig mot en tredje, ny källa.

## Metod

1. Byggde ett påståenderegister medan jag läste: varje bärande TAL (antal,
   andel, tidsfönster) och varje bärande PÅSTÅENDE OM MEKANISM, med agent,
   fil:rad-motsvarighet och datum.
2. Grupperade registret per storhet och letade efter par som INTE kan vara
   sanna samtidigt.
3. För varje sådant par: avgjorde om skillnaden var (a) olika definition/
   mätfönster (ofarligt, men ska sägas explicit i slutrapporten) eller (b) en
   verklig motsägelse (en part har fel). Där (b) verkade möjligt prövade jag
   själv med EXAKT ett kommando, i linje med uppdragets krav om sparsamhet
   mot GitHub-API:t — samtliga svar sparades och återanvänds nedan i stället
   för att frågas om igen.
4. Läste 07-hermetiska-tester-kontra-realistisk-e2e.md särskilt vaksamt på
   interna sömmar, eftersom orkestrerarens logg (S16) noterar att den är en
   sammanfogning av tre egna forkar. Jag hittade inga interna motsägelser i
   filen — samma tal (18 mockade EF, 7 bevakade, 34 e2e-filer) upprepas
   konsekvent på minst tre ställen i filen utan att glida.
5. Gick igenom `uppdraget-verbatim.md` rad 50–393 punkt för punkt och
   markerade varje delfråga mot vilken/vilka fil(er) som besvarar den, för
   att bygga § Luckorna.

**Kommandon jag körde själv, samtliga läsande, 2026-09-17:**

```text
find supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name "_shared" | wc -l   → 62
find supabase/functions -mindepth 1 -maxdepth 1 -type d | wc -l                      → 63 (inkl. _shared)
grep -nE '^  [a-zA-Z][a-zA-Z0-9_-]*:$' .github/workflows/ci-suite.yml                → 8 jobb
grep -n "a11y" .ci-parity-policy.json                                               → finns i knownJobs
find docs/decisions -maxdepth 1 -name "ADR-*.md" | wc -l                            → 131
gh api search/issues -f q="repo:.../... label:ci-post-merge" --jq '.total_count'    → 207
gh api search/issues -f q="repo:.../... label:ci-post-merge is:open" --jq …         → 0
gh api search/issues -f q="repo:.../... label:ci-natt" --jq '.total_count'          → 63
gh api search/issues -f q="repo:.../... label:ci-natt is:open" --jq …               → 21
gh api search/issues -f q="repo:.../... is:pr" --jq '.total_count'                  → 2214
gh run list --workflow nightly.yml --limit 90 --json event,conclusion,createdAt     → 72 körningar totalt
  (uppdelat: 56 schedule [51 failure/5 success], 16 dispatch [5F/10S/1 startup_failure])
git log 2f11a443..HEAD --oneline -- supabase/functions                              → tomt (ingen ändring)
```

## Motsägelsetabellen

| # | Storhet/påstående | Agent A säger | Agent B säger | Orsak | Vem har rätt / vilken definition gäller | Hur jag prövade |
|---|---|---|---|---|---|---|
| M1 | Nattnätets rödhetsgrad | J1b: "21 sammanhängande nätter" (#2072–#2488, från 08-28) | J8.5: "40 nätter i rad" (från 08-10); J8.6: "minst 49" (från 07-30); J8.7: "56 av 72 (78 %)" | J1b/J8.5/J8.6 samplade med olika `--limit` (mindre fönster, alla sanna för SITT fönster). J8.7 blandar in 16 `workflow_dispatch`/`simulate_failure`-körningar i nämnaren — en annan population än "riktiga nätter" | **51 av 52 schemalagda körningar röda sedan 2026-07-28 (98 %), enda gröna natten 2026-07-29 → obruten ström på 50 raka röda schemalagda nätter 2026-07-30–2026-09-17.** J8.7:s 78 % ska INTE användas — den är en korrekt räkning av FEL population, inte ett fel i sig, men den späder ut allvaret | `gh run list --workflow nightly.yml --limit 90 --json event,conclusion,createdAt` (72 körningar totalt, det är ALLA som någonsin funnits), uppdelat på `event` och sorterat på datum — listade samtliga 56 schemalagda med resultat |
| M2 | Antal `ci-post-merge`-ärenden totalt | J1b: "207 ärenden totalt" | J8.4: "Samtliga 60 ci-post-merge-taggade ärenden i repot är i dag stängda" (implicit totalt = 60); J8.6 använde samma `--limit 60` utan att flagga att det kunde vara en delmängd | J8.4/J8.6 körde `gh issue list --label ci-post-merge --state all --limit 60` och tolkade svaret som hela populationen | **J1b har rätt: 207 totalt, 0 öppna** (bekräftat). J8.4:s djupare analys av de 16 senaste (skapade 09-06/07, stängda i klump 09-17) är fortfarande korrekt som en delmängd, bara talet "60 = alla" är fel | `gh api search/issues -f q="… label:ci-post-merge"` → `total_count: 207`; samma med `is:open` → `0` |
| M3 | Antal Edge Functions | J5 (`06-airtable-kompromisser-och-empiriska-fynd.md`): "61" (kataloger, exkl. `_shared`) | J7 (07-hermetiska): "51" (första läsning) → omräknat till "63" samma dag; j1f: "135" (.ts-filer totalt, inkl. `_shared`), "73" (.ts-filer bara i `_shared`); CLAUDE.md/J1e: "57" (prod-allowlist) | Olika ENHETER räknas: kataloger exkl./inkl. `_shared`, filer i stället för kataloger, en kurerad delmängd | **62 individuella EF-kataloger (exkl. `_shared`), 63 kataloger totalt (inkl. `_shared`).** J5:s 61 är ett litet räknefel (av 1) — trädet har inte ändrats sedan `eeca8c72` (bekräftat, inga commits rör `supabase/functions` mellan `2f11a443` och `HEAD`). J7:s slutliga 63 (inkl. `_shared`) och CLAUDE.md:s 57 (= 62 − de 5 `test-*`-katalogerna) är BÅDA korrekta för sin egen definition, inte fel | `find supabase/functions -mindepth 1 -maxdepth 1 -type d …` med och utan `! -name "_shared"`; listade alla 62 namn och räknade manuellt; `git log 2f11a443..HEAD -- supabase/functions` tomt |
| M4 | Antal jobb i `ci-suite.yml` | J1a (läste hela filen rad för rad): "åtta jobb" (`purge, test-fast, acceptance, acceptance-sjalvtest, webblasarbeteende, a11y, test-staging, purge-efter`) | J1c ("Tal att bära med sig"-tabellen): "7 (`purge, test-fast, acceptance, acceptance-sjalvtest, webblasarbeteende, test-staging, purge-efter`)" — **saknar `a11y`** | J1c:s egen sammanfattningstabell tappade en rad vid nedskrivning — filens EGEN löptext (§ 4.1, § "Tal att bära med sig" ovanför tabellen) nämner `a11y` korrekt på andra ställen | **8, verifierat live.** Detta är en ren avskrivningsmiss i J1c, inte en systemskillnad — `.ci-parity-policy.json`s `knownJobs` KÄNNER TILL `a11y` (rad 43), så paritetsgrinden är opåverkad | `grep -nE '^  [a-zA-Z][a-zA-Z0-9_-]*:$' .github/workflows/ci-suite.yml` → 8 träffar; `grep -n "a11y" .ci-parity-policy.json` → finns i `knownJobs` |
| M5 | Antal ADR:er i `docs/decisions/` | J8.8: "131 ADR-filer" | J2 (04-branch…): "132 ADR:er" | Sannolikt en glob-skillnad (en fil, t.ex. en mall, räknad in eller ute) | **131, verifierat live.** Skillnaden är liten och bär ingen slutsats, men bör rättas i leverabel 2/3 | `find docs/decisions -maxdepth 1 -name "ADR-*.md"` räknat mot `wc -l` → 131 |
| M6 | Totalt antal PR:er | J2/J3: "2 116 sammanslagna PR:er" (mergade, uttryckligt märkt som sådant) | J8.8 (i sitt eget avslutande domsavsnitt, källa saknas i löptexten): "~2 496 PR:er på fyra månader" | J8.8:s tal är ett oreferentierat närmevärde i ett resonemangsstycke, inte en egen mätning | **2 214 PR:er totalt (alla tillstånd), 2 116 av dem mergade** (J2/J3 håller exakt). J8.8:s "~2 496" matchar VARKEN det ena eller det andra och bör strykas eller korrigeras i slutrapporten | `gh api search/issues -f q="… is:pr"` → `total_count: 2214` |

**Läsanvisning:** ingen av dessa sex är en motsägelse om VAD systemet gör —
samtliga är räkne-/definitionsfel eller mätfönsterskillnader. Ingen av dem
förändrar någon agents huvudsakliga dom. De hör hemma i slutrapportens
faktaunderlag som RÄTTELSER, inte som olösta tvister.

## Spänningar mellan domar

Agenterna motsäger varandra i sak nästan aldrig, men de drar olika
SLUTSATSER ur samma fakta beroende på vilken höjd de bedömer från. Ingen av
följande är ett fel — slutrapporten måste bära spänningen öppet, inte lösa
den i förtid.

### T1 — "Inte en självrättfärdigande maskin" (J1f) mot "motiverar en nedskalningsövning" (J8.8)

J1f (test-/bygg-/lintkonfigurationen): *"Domen på min delfråga: konfigurationen
är inte en självrättfärdigande maskin som byggt komplexitet för sin egen skull
— den är i stort verifierat motiverad."* J8.8 (underhåll och andra repon): *"Den
ärligaste sammanfattningen är: detta är en plattform som VAR välmotiverad vid
varje enskilt tillägg … men … evidensen motiverar en medveten NEDSKALNINGS-
övning snarare än ännu ett tillägg."*

**Starkaste belägg för J1f:** varje tröskel, undantag och gränsdragning J1f
läste bär en skriven motivering kopplad till en specifik ADR eller ett mätt
incident (t.ex. `sha_pinning`, `.lycheeignore`s form, `retries: 2` trots känd
falsifiering av ursprungsskälet — se J1f § 1). Inget av det var spekulativt
byggt "ifall".

**Starkaste belägg för J8.8:** ändringstakten på CI-ytan AVTAR INTE efter 3,5
månader (W31 och W35, långt in i perioden, hade HÖGRE andel CI-commits än
uppstartsveckorna); kvoten CI-yta:produktkod ligger på 0,95:1–1,84:1; ingen
mekanism i hela systemet frågar regelbundet "är summan av alla dessa
välmotiverade tillägg fortfarande proportionerlig?"

**Skillnaden är höjden man mäter från:** J1f bedömer VARJE ENSKILD REGEL för
sig (och har rätt att nästan alla håller); J8.8 bedömer SUMMAN och dess
riktning över tid (och har rätt att summan inte planar ut). Båda kan vara
sanna samtidigt.

### T2 — "Stabiliseras inte" (03-andringslogg) mot "välbyggt och fail-closed genomgående" (J1b)

03-andringslogg: *"Arkitekturen har vuxit i minst tre distinkta faser … och den
**stabiliserar sig inte** i betydelsen 'blir alltmer orörd'."* J1b (övriga
workflows): *"Arkitekturen bakom dessa sex filer är, tekniskt, **VÄL BYGGD**:
fail-closed genomgående, medvetna dokumenterade avvägningar … Detta är inte en
maskin som byggts för sin egen skull — varje mekanism jag läste har en skriven
motivering kopplad till en verklig, tidigare incident."*

**Starkaste belägg för "stabiliseras inte":** fyra distinkta felklasser (T121,
post-merge-klassningens ärvning, acceptance-tidsbudgeten, backlog-
stängningsgrinden) har fått tre–fyra separata fixar VAR under samma
sjuveckorsperiod; `ADR-131` river redan en hel gate-familj utan att
verkställandet skett.

**Starkaste belägg för "välbyggt":** J1b:s egen fil (de sex "övriga"
workflow-filerna) har INTE ändrats sedan 2026-08-28, medan RESULTATET de
producerar har försämrats kontinuerligt under exakt samma period — komplexi-
teten i just den ytan är stillastående, det är den mänskliga svarsloopen
runt den som brustit, inte koden.

**Skillnaden:** 03-andringslogg mäter HELA CI-ytans förändringstakt (inklusive
`ci.yml`, som ändrats 116 gånger); J1b mäter EN specifik delmängd (sex
sidofiler) som råkar vara stabil. Ingen motsägelse i fakta — bara olika
sökljus.

### T3 — Är sofistikeringen framtvingad av verkliga incidenter, eller byggd före sitt behov?

J4a:s skaltaggning (branschjämförelsen) klassar de flesta AVANCERADE
mekanismerna — spekulativ sammanslagningskö, maskininlärningsdrivet
testurval, kanarie-utrullning mätt i trafikprocent — som **"överbyggnad för
oss"** eller **"främst motiverat på mycket stor skala"** rakt över hela tolv
dimensioner, vilket lutar mot att vi (om vi någonsin byggde motsvarigheter)
skulle bygga för en skala vi inte har. Samtidigt slår J8.1, J1b, J1d och J8.5
gång på gång fast att repots FAKTISKA mekanismer (merge queue, review-
backstoppen, `deny-*`-hookarna) uttryckligen är svar på MÄTTA, NAMNGIVNA,
UPPREPADE fel — inte spekulativ förbyggnad. J1d: *"varje mekanism jag läste har
en skriven motivering kopplad till en verklig, tidigare incident."* J8.1
identifierar den enda kontrollen utan en egen incident bakom sig
(`arch-audit`) och namnger den explicit som avvikande från mönstret.

**Spänningen är inte att någon har fel** — det är att J4a bedömer branschens
MEST sofistikerade verktyg (som vi INTE har byggt: ingen ML-testselektion,
ingen kanarie, ingen spekulativ kö-parallellism) medan J8.1/J1b/J1d bedömer
det vi FAKTISKT byggt (som är enklare än branschens tyngsta verktyg och
genomgående incident-utlöst). Slutrapporten bör vara tydlig om att dessa två
observationer — "vi har inte byggt det mest sofistikerade" och "det vi byggt
är motiverat" — är FÖRENLIGA, inte att den ena vederlägger den andra.

## Krockande rekommendationer

### K1 — Ska `audit-ci` villkoras mot diffen, eller förbli diff-oberoende med avsikt?

**Mot varandra:**

- **Bevara diff-oberoendet (implicit, redan beslutat):** orkestrerarens S3
  citerar aggregatorns egen kommentar (`ci.yml:2545-2550`): jobbet *"har varken
  `if:` eller `needs:` och kan därför aldrig bli `skipped`"* — ett MEDVETET
  designval sedan `TASK-395` (2026-09-04): en ny säkerhetsvarning ska
  blockera VARJE landning, även en ren textändring.
- **Villkora mot diffen (J8.7 Rek. 1, J8.6 Rek. 3):** J8.7: *"Villkora
  `audit-ci`-jobbet mot samma dependency-signal som redan beräknas i
  `changed`-jobbet … i stället för att köra det villkorslöst på varje
  ändring."* J8.6 ställer samma fråga försiktigare ("Överväg om `Audit
  dependencies` bör blockera en REN dokumentationsändring") men landar i
  samma riktning.

Detta är en genuin avvägning mellan SÄKERHET (en okänd, framtida sårbarhet
ska aldrig kunna glida in via en docs-only-landning som "ser ofarlig ut") och
EFFEKTIVITET (en ren textändring behöver inte vänta på en beroende-granskning
som per definition inte kan hitta något nytt i den diffen). Åtgärdsplanen
måste välja sida explicit — det går inte att göra "lite av båda" utan att
förlora poängen med endera.

### K2 — Tre olika första-steg för nattnätets "kyrkogårdseffekt"

Samtliga tre nedan löser (delar av) samma problem — att 21 identiska,
obesvarade `ci-natt`-larm i rad har normaliserat rött — men är olika
INGÅNGAR, och åtgärdsplanen måste bestämma ordning/kombination, inte bara
"göra alla tre":

1. **Separera process-grindarna från testsviten i själva larmet** (J8.5 R1):
   gör så att "natten är röd" åter betyder "något är sönder i produkten",
   genom att låta de tre process-grindarna (Backlog-stängning, Sessionsdok-
   fönstret, Sannings-avstämning) larma i en EGEN kanal.
2. **Lägg samma dedup-mönster som `nightly-watchdog.yml`/`links-arende`
   redan har på `nightly.yml`s eget `alarm`-jobb** (J1b Rek. 1): en ny
   `ci-natt`-tråd skapas bara om gårdagens inte redan täcker samma
   grundorsak — löser INTE att ingen svarar, men stoppar ärendeantalet från
   att växa linjärt.
3. **Bygg en veckovis, mekanisk sammanfattning** (J8.6 Rek. 4) i stället för
   att förlita sig på att någon läser 21 separata identiska ärenden.

Ingen av de tre är fel, och de är inte ömsesidigt uteslutande — men (1)
ändrar VAD som räknas som "rött", (2) ändrar HUR OFTA ett nytt ärende skapas,
och (3) ändrar HUR informationen PRESENTERAS. Att bygga alla tre samtidigt
utan att fråga vilken som löser störst andel av problemet vore precis den
"lösning som letar problem"-risk global `CLAUDE.md` varnar för.

### Ett tredje kandidat-fall som INTE är en krock, värt att notera

J8.5 R3 rekommenderar att antingen riva merge-dedupen eller byta dess fråga
(den ger i dag bara ~30 % träffbarhet mot en teoretisk ~100 % med en enklare
fråga, och dess skrivna motivering i `ADR-077` §2 vilar på en premiss —
`strict`-kravet — som redan föll 2026-08-05). Ingen annan agent argumenterar
för att BEHÅLLA dedupen i sin nuvarande form — J1a beskriver den bara
neutralt. Detta är alltså en OEMOTSAGD rekommendation, inte en krock, men
den bör inte tystas bort i slutrapporten bara för att ingen bestred den.

## Luckorna mot uppdraget, punkt för punkt

Genomgång av `uppdraget-verbatim.md` rad 50–393, jobb för jobb.

| Jobb/delfråga | Status | Kommentar |
|---|---|---|
| **Jobb 1** (rad 50–105), inkl. Ändringslogg (90–104) | **Fullt täckt** | j1a–j1f (inventeringen) + 03-andringslogg (ändringsloggen). Enda kvarstående: leverabel 3 ("Teknisk arkitekturkarta med beroenden och dataflöden") finns bara som SPRIDDA mermaid-diagram (j1a, j1c, j1e) — ingen konsoliderad, ände-till-ände-visualisering "lokal ändring → merge → staging → produktion → nattliga kontroller" i EN fil ännu |
| **Jobb 2** (108–129) | **Fullt täckt** | 04-branch-worktree-commit-och-pushflode.md |
| **Jobb 3** (133–146) | **Fullt täckt** | j3-push-kadens.md, inkl. konkret förslag (Rek. 3, förfallodatum för obeslutade grenar) |
| **Jobb 4** (150–176) | **Delvis täckt — hälften obesvarad** | J4a besvarar samtliga tolv namngivna dimensioner grundligt, men ENDAST branschens EGEN praxis. Den efterfrågade JÄMFÖRELSEN ("vad vi redan gör starkt och vad som proportionerligt bör förbättras", rad 176) är obesvarad som egen syntes — J4a pekar uttryckligen mot ett "Jobb 4b" som aldrig spawnades. Leverabel 6 ("Branschjämförelse") existerar alltså inte än |
| **Jobb 5** (180–213) | **Fullt täckt** | `06-airtable-kompromisser-och-empiriska-fynd.md`, samtliga 15 delfrågor. Skrivproven A–D är medvetet ej utförda (öppet flaggat som beslutsunderlag åt Marcus, inte en brist) |
| **Jobb 6** (217–269) | **OBESVARAT I SIN HELHET** | Ingen fil gör: klassificeringen "behåll lokalt/centralisera/produktifiera/förenkla/ta bort" per komponent, en föreslagen minimal målarkitektur, en migrationsplan, eller ett konkret installationsförslag (`workflow_call`/composite action/mallrepo/generator) för ett nytt repo. J8.8 §5–§7 ger VÄRDEFULLT UNDERLAG (tvärrepo-inventering, en fyrvägs generellt/config/produkt/process-klassning av ~20 komponenter) men avstår uttryckligen ("jag designar inte en lösning här"). **Granskningens största kvarvarande skuld** |
| **Jobb 7** (273–292) | **Fullt täckt** | 07-hermetiska-tester-kontra-realistisk-e2e.md, samtliga åtta delfrågor med konkret evidens (inte bara principiell rekommendation, vilket uppdraget uttryckligen krävde) |
| **8.1** (300–306) | Fullt täckt | j8-1 |
| **8.2** (308–317) | Fullt täckt | 07-hermetiska § 8.2 |
| **8.3** (319–328) | Fullt täckt | 07-hermetiska § 8.3, kompletterat av `06-airtable-kompromisser-och-empiriska-fynd.md` § K17 |
| **8.4** (330–341) | Fullt täckt | j8-4 |
| **8.5** (342–352) | Fullt täckt | j8-5 (46 konstruerade scenarier prövade) |
| **8.6** (354–362) | Fullt täckt | j8-6 |
| **8.7** (364–371) | Fullt täckt | j8-7 |
| **8.8** (373–381) | **Fakta täckt, framåtblick uteslämnad med avsikt** | j8-8 besvarar alla sju understrecksfrågor på faktanivå; den sista ("Vilka delar kan lyftas ut till återanvändbara workflows eller ett centralt CI-kit?") lämnas uttryckligen öppen för Jobb 6 |
| **"Fem viktigaste", fråga 1** (Vilket verkligt produktionsfel skyddar varje jobb mot?) | Fullt täckt, explicit rubricerad | j8-1 § "Ett rakt, fristående svar på … fråga 1" |
| **Fråga 2** (Unik information: hermetiskt vs. staging-E2E) | Fullt täckt, explicit rubricerad | 07-hermetiska § "Svaret på fråga 2, kort" |
| **Fråga 3** (Kan CI bli grönt trots hoppat test?) | Fullt täckt, explicit rubricerad | j8-5 § "F11 — Rakt svar på fråga 3" |
| **Fråga 4** (Falska stopp / eget underhåll) | **Delvis — aldrig sammanförd** | "Falska stopp" är grundligt besvarat av j8-6 (§ 1, "portvakts"-liknelsen); "eget underhåll" är grundligt besvarat av j8-8. Men INGEN fil binder ihop de två halvorna till ETT fristående svar märkt "fråga 4" — slutrapportens författare måste själv syntetisera j8-6 + j8-8 |
| **Fråga 5** (Generell CI-produkt vs. appspecifikt) | Fullt täckt i sak, inte i rubrikform | j8-8 § 6 (fyrvägsklassningen) svarar funktionellt exakt på detta, utan att explicit skriva "detta är svar på fråga 5" |

**"Slutlig kvalitetsgrind" (rad 440–452), status vid denna avstämning
(förväntat ofullständig — våg 1 är ett delsteg, inte slutet):**
huvudrapporten (leverabel 1), åtgärdsplanen (leverabel 11) och evidens-
registret (leverabel 12) existerar inte än. Inga faktiska kodändringar har
gjorts av någon av de arton (korrekt, per deras eget skrivskyddade kontrakt)
— kraven "alla faktiska ändringar är testade, dokumenterade och reversibla"
och "huvudrapporten anger vad som bör göras nu/senare/inte alls" kan alltså
INTE avprickas förrän Jobb 6 och en syntesrunda är gjorda.

**Positivt att notera:** samtliga arton pass levererar konsekvent alla sex
begärda delar (metod, fynd, evidens, osäkerheter, risker, rekommendationer,
rad 37–43) och använder den föreskrivna tiokolumnstabellen för
komponentbedömningar där det är relevant (j1a, j1b, j1c, j1e). God
efterlevnad av uppdragets EGEN formkrav, oberoende av sakinnehållet.

## Kanoniska tal — att använda i slutrapporten och övriga leverabler

| Tal | Värde | Källa och mätfönster |
|---|---|---|
| Ruleset `main-skydd` (id `19627609`) | 1 required check (`CI Passed or Skipped`, `integration_id 15368`), 0 required approvals, `bypass_actors: []`, `merge_queue.grouping_strategy: ALLGREEN`, `max_entries_to_merge: 3`, `strict` avstängd sedan 2026-08-05 | J1a/J1e/J8.5, `gh api rulesets/19627609`, 2026-09-17. Oförändrat sedan 2026-08-05 |
| Jobb i `ci.yml` | 7 (`changed, lint, audit, suite, docs, review-backstopp, ci-passed`) | J1a/J1c/J8.5, noll drift |
| Jobb i `ci-suite.yml` | **8** (`purge, test-fast, acceptance, acceptance-sjalvtest, webblasarbeteende, a11y, test-staging, purge-efter`) | Korrigerat mot J1c:s tabellrad "7" (M4) — verifierat live av mig 2026-09-17 |
| Edge Functions | **62** individuella kataloger (exkl. `_shared`); **63** kataloger totalt (inkl. `_shared`); **57** i prod-deploy-allowlisten (= 62 − 5 `test-*`-kataloger) | Verifierat live av mig 2026-09-17 (M3) |
| Filer i `scripts/` | **186** (171 toppnivå + 15 i `scripts/lib/`), 74 182 rader | J1c/J8.8, redan avgjort av orkestreraren mot dennes egen "172" |
| Policy-filer i repo-roten | 44 (42 med `scripts/`-konsument, 2 utanför) | J1c |
| ADR:er i `docs/decisions/` | **131** | Verifierat live av mig 2026-09-17 (M5); rättar J2:s "132" |
| Repots synlighet och kostnad | **Publikt** (inte privat), org `high-five-group` (Enterprise Cloud, 1 plats). GitHub fakturerar aldrig Actions-minuter på publika repon: augusti 2026 = 76 080 minuter, nettokostnad 0 kr. Enda reella kostnaden = Enterprise Cloud-platsen (~21 USD/mån, köpt för merge queue) | J8.7 (`gh api organizations/.../billing/usage`), bekräftat av orkestrerarens S14, 2026-09-17 |
| Nattnätets rödhet | **51 av 52 schemalagda körningar röda sedan 2026-07-28 (98 %)**, enda gröna natten 2026-07-29. **Obruten ström: 50 raka röda schemalagda nätter, 2026-07-30–2026-09-17.** Använd INTE J8.7:s "56 av 72 (78 %)" (blandar in 16 manuella dispatch-körningar) | Verifierat live av mig 2026-09-17, samtliga 72 körningar `nightly.yml` någonsin haft (M1) |
| `ci-natt`-ärenden | 63 totalt, 21 öppna, noll kommenterade | Orkestrerarens S7, bekräftat oförändrat av mig 2026-09-17 |
| `ci-post-merge`-ärenden | **207 totalt, 0 öppna.** De 16 senaste (skapade 2026-09-06/07) stod obesvarade 233–258 timmar innan de stängdes i klump 2026-09-17 | J1b (207-talet) + J8.4 (16-detaljen), verifierat live av mig 2026-09-17 (M2) |
| Täckningsluckan efter merge | **85 av 686 landade träd (12,4 %)** fick aldrig en post-merge-körning (2026-08-20→); mekanismen är FASTSTÄLLD: merge-kön landar flera PR:er i EN push, post-merge klassar bara toppens commit | Orkestrerarens S18 (auktoritativ förklaring). J8.4:s mindre fönster (31/230, 13,5 %, 2026-08-31→09-08) är konsistent men hade INTE hittat orsaken — S18 äger förklaringen |
| Push-kadens | ~29 landade PR:er/dag (500 PR:er, 2026-08-22–09-08); median PR-livstid 22 min 27 s; medianstorlek 5 filer/214 rader | J2/J3 |
| Totalt antal PR:er | **2 214 (alla tillstånd), 2 116 mergade.** Använd INTE J8.8:s "~2 496" (ospårat, matchar ingen verifierad räkning) | Verifierat live av mig 2026-09-17 (M6); J2/J3:s 2 116 håller |
| Samma träd testas per landad kod-PR | 3–4 gånger (PR-ytan + kö-körning + push-körning + post-merge-körning). Dedupen (som ska förhindra detta) träffar bara ~30 % (568/1 887 sedan 2026-07-29) trots att en enklare, redan tillgänglig SHA-fråga skulle träffat ~100 % (19/19 observerade) | Orkestrerarens S11 (skärpt) + J8.5 (dedup-mätningen) |
| `audit-ci` | Körs VILLKORSLÖST (varken `if:` eller `needs:`) sedan `TASK-395` (2026-09-04) — ett MEDVETET designval, inte ett förbiseende. Två öppna high-severity-sårbarheter (`sharp` GHSA-rgj7-g3m4-5g8c, `smol-toml` GHSA-7w5x-hrqm-74c2) blockerade i praktiken VARJE landning 2026-09-09→mätdag (14 av 14 PR-körningar röda; `main` orörd sedan 2026-09-08) | Orkestrerarens S3 (design-avsikten) + J1f (körde `audit-ci` live) + J8.5/J8.6/J8.7 (oberoende bekräftelse via `metrics:ci`/`gh run list`) |
| Kontraktsvaktens täckning | 7 av 18 mockade Edge Functions bevakas nattligen mot skarp staging; kommentaren "alla sju bevakas" är sann historiskt (`TASK-68`) men vilseledande i dag | Orkestrerarens S10, oberoende bekräftat av J5 och J7 (tre oberoende mätningar, samma svar — starkast belagda enskilda faktum i hela granskningen) |
| CI-/grindvaktsyta mot produktkod | ≈ 106 900 rader mot ≈ 112 400 rader (kvot ≈ 0,95:1; ≈ 1,84:1 med testspecifikationer inräknade) | J8.8, egen `wc`-mätning. Flaggat med fem namngivna svagheter i måttet (kommentarandel, körkostnad, statisk vs. historisk möda, återanvändning, ADR-klassningens grovhet) — läs aldrig kvoten utan brödtexten |

## Vad jag inte kunde belägga

- **Om `ci-natt`-ärendena (till skillnad från `ci-post-merge`) verkligen har
  noll kommentarer på samtliga 63**, eller bara på de 21 öppna — jag har
  bekräftat totalantal och öppna-antal via `search/issues`, men inte öppnat
  varje ärendes kommentarsfält. J8.6:s påstående ("noll kommentarer på något
  av dem") är därför **starkt indikerad**, inte verifierad av mig.
- **Om fler numeriska glidningar finns bortom de sex jag hittade** — jag har
  byggt registret genom att läsa allt en gång och leta efter par som stack ut
  vid genomläsning, inte genom en uttömmande, maskinell extraktion av VARJE
  tal i 14 000 rader. Frånvaro av fler fynd här är inte bevis på att inga
  finns.
- **Jobb 6:s och leverabel 6:s innehåll** kan jag per definition inte bedöma
  konsistensen av — de existerar inte. Jag kan bara bekräfta att INGEN av de
  arton filerna innehåller dem, vilket jag har gjort genom att läsa samtliga
  arton i sin helhet och söka riktat efter nyckelorden "målarkitektur",
  "migrationsplan", "behåll lokalt", "centralisera", "produktifiera" — de
  förekommer bara i J8.8 § "Rekommendationer" som pekare TILL Jobb 6, aldrig
  som Jobb 6:s eget innehåll.

## Rapport till orkestreraren

- **Modell:** enligt egen systemprompt: *"You are powered by the model named
  Sonnet 5. The exact model ID is claude-sonnet-5."*
- **Domen i klartext:** underlagen är sakligt samstämmiga; de sex avvikelser
  jag hittade är räkne-/fönsterfel, inte oense sakuppgifter, och samtliga är
  nu lösta med ett kommando vardera. Den enda GENUINA luckan är Jobb 6 (och
  därmed leverabel 6/10/11), som ingen av de arton passen besvarar eller
  ens delvis täcker bortom att peka mot den.
- **Den avgörande delfrågan:** nattnätets rödhetsgrad (M1) — fem olika citerade
  tal i fem filer, där ett av dem (J8.7:s 78 %) systematiskt underskattar
  allvaret genom att blanda in självtestkörningar. Detta är det tal som med
  störst sannolikhet annars hade smugit sig fel in i huvudrapporten.
- **Starkaste källorna:** `01-orkestrerarens-stickprov.md` (S1–S18, samtliga
  höll vid min egen läsning); egna liverkörningar mot GitHub och disk,
  2026-09-17 (citerade inline ovan).
- **Vad jag inte kunde belägga:** se § ovan.
- **Gren och commit-SHA:** `docs/s126-ci-djupgranskning`, HEAD `99839e78` vid
  skrivandet (min egen fil ej ännu committad).
- **Oväntade fynd utanför uppdraget, registrerade:** (1) `.ci-parity-
  policy.json` känner faktiskt till `a11y` (rad 43) — J1c:s eget sammanfattnings-
  fel (M4) hade kunnat läsas som ett verkligt paritetsgrind-hål om det inte
  prövats; det är det inte. (2) 07-hermetiska-tester-kontra-realistisk-
  e2e.md, trots att den enligt orkestrerarens logg är en sammanfogning av tre
  forkar, visade sig vid min genomläsning vara internt koherent — samma tal
  (18/7, 34 e2e-filer) upprepas identiskt genom hela filen utan att glida.
- **Grindarnas utfall:** se nedan.

## Källor

Samtliga arton underlagsfiler och fyra leverabler i
`docs/research/ci-djupgranskning-2026-09-17/` (lästa i sin helhet, se § Vad
jag läste), plus:

- [`00-agentkontrakt.md`](00-agentkontrakt.md)
- [`01-orkestrerarens-stickprov.md`](01-orkestrerarens-stickprov.md)
- `tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` (454 rader,
  läst i sin helhet)
- Egna liverkörningar 2026-09-17 mot `high-five-group/miranon-media-admin`
  och lokal disk i denna worktree — samtliga kommandon citerade inline i
  § Metod och § Motsägelsetabellen.
