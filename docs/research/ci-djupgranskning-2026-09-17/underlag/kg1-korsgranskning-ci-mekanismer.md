---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# KG1 — korsgranskning av fyra kritiska CI-mekanismer

> **Proveniens:** skriven av korsgransknings-agent KG1 i Session 126:s våg 2,
> 2026-09-17, på modellen Opus 5 (1M context) — medveten avvikelse från
> tier-policyn, bokförd i uppdraget, eftersom fynden här ska bära
> åtgärdsplanen. Ögonblicksbild: `origin/main` `eeca8c72` (2026-09-08).
> Mätfönstret för landningarna är 2026-08-20 → 2026-09-08 (686 landningar);
> nattnätets fönster är 2026-07-28 → 2026-09-17. Allt som står som mätt är
> mätt av mig själv, i denna worktree, denna dag.

## Kort svar

Fyra mekanismer skulle prövas. **Två är verkliga hål, en är en missad vakt
som knappt kostar något att stänga, och en är inget hål alls — den fungerar
bättre än underlagen påstod.**

För en läsare utan teknisk bakgrund, i klartext:

Varje kodändring i det här projektet passerar en rad automatiska kontroller.
Vissa körs innan ändringen släpps in, vissa efter, och vissa på natten. Frågan
var om de kontrollerna faktiskt gör vad de utger sig för.

1. **Täckningsluckan efter merge — verkligt hål, men mindre än befarat.**
   När flera ändringar släpps in i samma ögonblick tittar efterkontrollen
   bara på den översta av dem. Är den översta en ren textändring drar
   kontrollen slutsatsen "inget att testa" och hoppar över hela provet — trots
   att riktig kod låg under. Det hände **60 gånger på nitton dagar**. Men det
   som faktiskt gick förlorat är smalare än underlagen sa: de snabba testerna
   kördes ändå, av en annan kontroll som råkar titta på hela bunten. Det som
   uteblev var de två tyngsta proven — det mot en riktig databas och
   tillgänglighetskontrollen. Och luckan stängde sig själv vid nästa
   kodlandning: **halva timmen i mediantid, men i fyra fall över fyra timmar
   och som värst 33 timmar.**
2. **Merge-dedupen — INGET hål. Underlaget hade fel.** Den mekanism som
   hoppar över ett prov när exakt samma kod redan provats påstods vara utan
   verkan ("noll träffar på 80 körningar"). Jag mätte alla fall där den kunde
   ha gjort nytta: **32 av 32 var träffar.** Den fungerar. Riv den inte.
3. **Vem vaktar vakten — en billig vakt saknas, två risker är redan burna.**
   Det finns en halv vakt som ingen agent hittade, men den kontrollerar fel
   sak. En riktig vakt kostar ungefär trettio rader kod. De två övriga
   farhågorna är redan täckta av annat, och den ena går strukturellt inte att
   stänga i ett repo med en människa.
4. **Nattnätets signal — verkligt hål, och allvarligare än det ser ut.**
   Nattkontrollen har varit röd 51 nätter av 52. Alla har antagit att det
   beror på bokföringsgrindar. Det stämmer inte: **på 25 av 52 nätter var ett
   riktigt produktskyddande test rött** — och ingen kunde se skillnad, för
   allt delar samma röda lampa. Ett konkret pris: ett kort (`TASK-239`) krävde
   "tre gröna nätter i rad" för att få stängas. Det fick **31 gröna nätter i
   rad** och står fortfarande obockat, för ingen kunde se dem.

**Ordningen spelar roll, och beroendena är hårda:**

| Steg | Åtgärd | Varför just denna ordning |
|---|---|---|
| 1 | **Mekanism 4** — dela nattnätets larm i två kanaler | Oberoende av allt annat, störst signalvinst per rad, och nattnätet är det enda nät som fångar det mekanism 1 missar |
| 2 | **Mekanism 1** — låt efterkontrollen klassa hela pushen | Verkligt hål; måste vara lagat innan mekanism 2 ens övervägs |
| 3 | **Mekanism 3 (i)** — vakt för aggregatorns `needs` | Billig, fristående, stänger en tyst felklass |
| 4 | **Mekanism 2** — rör inte nu | En "förbättrad" dedup river det enda nät som i dag täcker mekanism 1:s 60 hål. Först efter steg 2, och då bara med rätt signal |

Mekanism 3 (ii) och (iii) föreslår jag **ingen åtgärd** för utöver en
fem-raders drift-vakt; skälen står i sitt avsnitt.

## Vad jag läste först

Enligt kontraktet inventerade jag befintlig kunskap före första egna mätningen.

| Källa | Vad den gav | Vad jag gjorde med den |
|---|---|---|
| `underlag/00-agentkontrakt.md` | Arbetsform, evidenskrav, tillägg inför våg 2 | Följd |
| `underlag/01-orkestrerarens-stickprov.md` (S1–S18) | Arton mätningar; S18 bär täckningsluckans mekanismhypotes | Reproducerade S18 från grunden och skärpte den på tre punkter |
| `tasks/threads/T166-post-merge-klassningen-laser-sista-pr-en-i-ko-batchen.md` | **Hela mekanism 1, korrekt, redan 2026-08-21** | Bekräftad mot kod och mätning; dess tre vägval är grunden för mitt förslag |
| `backlog/tasks/task-365 …` (To Do, priority high) | Symptomet, men en mekanismförklaring som kortets egen rättelsenot delvis falsifierar | Registrerat som fynd: kortet och `T166` pekar inte på varandra |
| `backlog/tasks/task-334 …`, `task-73`, `task-78` | De tre tidigare kodfixarna på samma yta | Prövade varför ingen räckte |
| `03-andringslogg.md` § Tema 1.4 + § Korrigeringskedja 2 | Fyra fixar på en månad; rekommendation om en gemensam klassnings-tjänst | Byggde vidare, skrev inte om |
| `underlag/j8-5-grindlogik-skip-och-gront.md` | Dedup-analysen, `ADR-077` §2:s falsifierade premiss | **Föll på huvudpunkten** — se mekanism 2 |
| `underlag/j8-7-tid-och-kostnad.md` | Tidsprofilen per yta, publikt repo ⇒ gratis minuter | Använd för kostnadssidan |
| `underlag/j1a`, `j1b`, `j1c`, `j8-4` | Aggregatorn, workflow-inventariet, CI-wirade skript | Prövade J1a:s vakt-observation mot koden |
| `ADR-077`, `ADR-076`, `ADR-082`, `ADR-099`, `ADR-105`, `ADR-131` | Besluten bakom klassning, dedup, nattnät, larmkanaler, review-grind, backlog-rivning | Läste i sin helhet innan förslag |

**Vad som är nytt här:** ingen tidigare fil har (a) mätt hur många landningar
som verkligen är kodklassade enligt `ci.yml`:s egen allowlist, (b) mätt vad
som faktiskt gick förlorat i de hål som fanns, (c) mätt hur länge hålen stod
öppna, (d) mätt om dedupen någonsin träffar, eller (e) gjort nattnätets
rödhet jobb-för-jobb, natt-för-natt över hela perioden.

## Metod

Fem oberoende mätlinjer, alla reproducerbara:

1. **Landnings-inventering ur git.** `git log origin/main --first-parent
   --since=2026-08-20` gav 686 landningar. `gh run list --workflow
   post-merge.yml --limit 1000` och `--workflow ci.yml --event push
   --limit 800` gav körnings-ytorna. Jämförelse på commit-SHA.
2. **Egen D0-klassning med repots EGNA verktyg.** Jag implementerade
   `ci.yml`:s exakta allowlist (`paritet:start klassning-d0`, `ci.yml:219-250`)
   mot repots installerade `micromatch` 4.0.8 — samma bibliotek
   `tj-actions/changed-files` använder — och matade den med `git diff
   --name-only` **med `-c core.quotepath=false`**. Den flaggan är inte en
   detalj: utan den oktal-escapar git svenska tecken i backlog-kortens
   filnamn, och min första körning klassade därför 25 hål i stället för de
   60 verkliga. Det är exakt den fälla `ci.yml`:s egen `quotepath: false`-rad
   stänger (`ci.yml:194`), och jag gick i den innan jag läste raden ordentligt.
3. **Två oberoende valideringar av klassningen.** (a) 18 PR:er hämtade med
   `gh pr view <nr> --json files` — **18 av 18 fillistor byte-identiska** med
   min git-härledning. (b) Min spann-klassning mot `CI [push]`:s EGEN
   klassning på samma push, 14 körningar — **14 av 14 överens**, varav 10 är
   diskriminerande fall (min klassning och tipp-klassningen sa olika, och CI
   följde min).
4. **Utfallskontroll mot verkliga körningar.** 15 post-merge-körningar på
   förutsagda hål + 6 kontroll-körningar + 32 dedup-kandidater + 14
   push-körningar, samtliga via `gh run view --json jobs`, svaren sparade till
   scratch och räknade på fil.
5. **Nattnätet jobb-för-jobb.** 56 schemalagda `nightly.yml`-körningar hämtade
   med `gh run view --json jobs`, en fil per natt, tabellen räknad på filerna.

**En mät-hygienisk incident, öppet bokförd:** min första `ci.yml`-push-lista
skrevs över på disk mitt i passet (1 000 poster blev 40, med andra fält än jag
begärde). Jag upptäckte det när en härledd siffra motsade en tidigare — 39 av
601 där jag nyss mätt 73 av 73. Jag hämtade om till en ny filsökväg och körde
om samtliga berörda analyser; de reproducerade exakt. Alla tal nedan kommer
från den omkörningen. Orsaken till överskrivningen är **inte fastställd**.

## Fynd 1 — Täckningsluckan efter merge

### 1a. Hur den fungerar, belagt i koden

Kedjan är tre rader lång och hela felet bor i den första.

| Var | Rad | Vad den gör |
|---|---|---|
| `.github/workflows/post-merge.yml` | `228` | `SHA: ${{ github.sha }}` — **en enda SHA**, pushens topp |
| `.github/workflows/post-merge.yml` | `229` | `run: bash scripts/classify-post-merge.sh "${SHA}"` |
| `scripts/classify-post-merge.sh` | `199` | `MERGE_SHA="${1:-}"` — skriptet ser aldrig något annat |
| `scripts/classify-post-merge.sh` | `245-261` | hämtar **den commitens** föräldrar och träd |
| `scripts/classify-post-merge.sh` | `295-317` | VÄG A: kö-körningen på **den commitens** SHA |
| `scripts/classify-post-merge.sh` | `342-345` | VÄG B: PR-körningen på **den commitens** andra förälder |
| `.github/workflows/post-merge.yml` | `238` | `if: … needs.klassning.outputs.docs_only != 'true'` — hela sviten hoppas |

Svaret på uppdragets fråga (a) är alltså entydigt: **jobbet "Ärvd klassning"
läser `github.sha` och ingenting annat.** Det läser inte `github.event.before`,
inte `commits[]` ur push-nyttolasten, och inte `HEAD^2` via git (skriptet gör
noll git-operationer alls, `post-merge.yml:190-194`). Bär pushen två eller tre
merge-commitar klassas bara den översta; de under den existerar inte för
mekanismen. **Verifierad.**

Testsviten bekräftar luckan i sin egen form: `scripts/test-classify-post-merge.sh`
har 21 fall (`:8-32`), och **inget av dem handlar om en push med fler än en
merge-commit**. Fail-closed-listan i skriptets filhuvud (`:139-152`) räknar upp
sju avvikelser som ger full svit — flerposts-pushen står inte bland dem.
`T166` sa exakt detta redan 2026-08-21: *"Kö-batchen är den avvikelse listan
inte nämner."*

### 1b. Att merge-kön landar flera PR:er i EN push

Uppdragets fråga (b) ville ha dokumentationsbelägg. Dokumentationen är tunnare
än man skulle vilja, men entydig i riktningen, och min mätning avgör saken.

- GitHubs merge queue-dokumentation beskriver inställningen som *"the minimum
  and maximum number of pull requests to merge into the base branch **at the
  same time**"*, och om squash-läget: *"each pull request will be represented
  by its own commit regardless of the number of pull requests the queue merges
  **in a single operation**"*. Formuleringarna "at the same time" och "in a
  single operation" är dokumentationens sätt att säga att flera poster landar
  i EN operation.
- Push-webhookens `before` är *"The SHA of the most recent commit on ref before
  the push"* och `after` *"The SHA of the most recent commit on ref after the
  push"*; `commits` rymmer *"a maximum of 2048 commits"*. Att en push ger EN
  körning står inte utskrivet, men följer av att `github.sha` är ett enda värde.

**Mätningen avgör, och den är entydig.** Över 686 landningar / 601 pushar:

| Pushens storlek | Antal pushar | Andel |
|---|---|---|
| 1 landning | 528 | 87,9 % |
| 2 landningar | 61 | 10,1 % |
| 3 landningar | 12 | 2,0 % |
| 4 eller fler | **0** | — |

Taket på tre är inte en slump: rulesetet har `max_entries_to_merge: 3`
(mätt av mig 2026-09-17 mot `repos/high-five-group/miranon-media-admin/rulesets/19627609`,
samma värden som S5). Summan stämmer exakt: 61 × 1 + 12 × 2 = **85 landningar
utan egen push** — precis de 85 S18 räknade.

Två kontroller som stänger varje alternativ förklaring:

- **0 av 85** saknade landningar har någon `CI [push]`-körning; **73 av 73**
  gruppetoppar har en. En push ger alltså en körning, på toppens SHA.
- Varje saknad landning följs inom **ett eller två** steg i första-förälder-kedjan
  av en landning som HAR en körning (73 respektive 12 fall, ingen längre bort).
  Det är gruppstorleken sedd från andra hållet.

Tidsspannet inom en och samma push är **3 till 836 sekunder, median 154 s** —
och det förklarar S18:s observation att "alla 85 följdes av en ny landning inom
15 minuter". De var inte *följda av* en ny landning; de låg i *samma* push.
Merge-commitarna skapas när varje post ställs i kön, och rulesetets
`min_entries_to_merge_wait_minutes: 5` är precis den väntetid som gör att
tidsstämplarna hinner glida isär några minuter innan bunten landar.
**Verifierad.**

### 1c. Vad som redan prövats, och varför det inte räckte

Fyra insatser på samma yta, ingen av dem riktad mot detta:

| Insats | Datum | Vad den löste | Varför den inte räckte här |
|---|---|---|---|
| `TASK-73` (`#386`) | 2026-07-28 | Post-merge körde ALLT — lärde sig ärva D0 | Införde ärvningen. Ärvde från början bara en commit |
| `TASK-78` (`#433`) | 2026-07-29 | Kön bröt ärvningen dagen den landade — VÄG A lades till | Gjorde ärvningen **rätt för en commit**. Skriptets huvud (`:39-81`) resonerar genomgående om "merge-commiten", singular |
| `T166` | 2026-08-21 | **Ingen kodfix.** Mekanismen dokumenterad, tre vägval listade, `lifecycle: paused` | Tråden är korrekt och oanvänd. Ingen brytdag, ingen ägare |
| `TASK-334` (`#2059`) | 2026-08-28 | Larmet pekade ut fel landning — ny attribueringslogik | Lagade **larmtexten**, inte klassningen. Kortets eget fynd säger att en trasig staging-test låg osynlig i tre dagar |

En femte fix som upprepar någon av dessa vore värdelös, som uppdraget säger.
Det denna skiljer sig i går att säga på en rad: **de fyra tidigare lagade VILKEN
körning man ärver ur; denna lagar HUR MÅNGA landningar man ärver för.**

**Det tyngsta processfyndet i hela mekanism 1 är inte tekniskt:** repot bär
sedan 2026-08-21 en korrekt diagnos (`T166`) och sedan 2026-09-02 ett
högprioriterat kort (`TASK-365`) med en annan, delvis självfalsifierad
diagnos — och **de två refererar inte varandra**. `TASK-365`:s beskrivning
säger att post-merge-sviten *"AVBRYTS av nästa push (concurrency)"*; kortets
egen rättelsenot falsifierar halva premissen, och `post-merge.yml:181-183`
(grupp per commit-SHA) samt `T135` falsifierar resten — den `cancelled`-signatur
kortet bygger på är `test-staging`-jobbets eget 12-minuterstak, inte en
gruppevakuering. Ett kort med fel rotorsak är dyrare än inget kort: det binder
prioritet och riktar arbete åt fel håll.

### 1d. Vad luckan faktiskt kostade — mätt, inte uppskattat

Här skärper jag S18 på tre punkter, varav två gör bilden allvarligare och en
gör den mildare.

**Skärpning 1 — antalet kodlandningar var 69, inte 55.** S18:s klassning
byggde på grennamnets prefix. Med `ci.yml`:s verkliga allowlist är **69 av de
85 saknade landningarna kodklassade**, 16 dokumentklassade.

**Skärpning 2 — men antalet verkliga hål är 60, inte 85.** Ett hål uppstår
bara när pushens TOPP är dokumentklassad samtidigt som spannet under bär kod.
Är toppen kodklassad kör post-merge full svit på det landade trädet, som
innehåller allt under den — täckningen är komplett. Fördelningen:

| Läge | Pushar | Post-merge-svit | Täckning |
|---|---|---|---|
| Topp = D0, spann = D0 | 0 | hoppas | korrekt — inget att skydda |
| **Topp = D0, spann = KOD** | **60** | **hoppas** | **hål** |
| Topp = KOD | 13 | körs fullt | komplett för hela spannet |

Kontrollerat mot verkligheten: **15 av 15** stickprov bland de 60 visar
`Verifierande svit på det mergade trädet: skipped` med grön körning — exakt
som förutsagt. Kontrollgruppen, **6 av 6** där toppen var kodklassad, visar
sviten körd med 7–10 inre jobb. Tvåsidigt. **Verifierad.**

**Skärpning 3 — vad som gick förlorat är smalare än "ingen verklig kedja
prövades".** S18 skrev att *"för 55 kod-landningar har ingen verklig kedja
prövats med ett läsbart utfall"*. Det håller inte. `CI [push]`-körningen på
toppen klassar **hela push-spannet**, inte toppen — mätt, 14 av 14, och de
10 diskriminerande fallen faller alla åt det hållet. Den körde alltså de
hermetiska klasserna på ett träd som innehöll den missade koden.

Jämförelsen av två jobblistor på samma push (`34144253985` mot `34144253948`)
visar exakt vad som skiljer:

| Klass | `CI [push]` | Post-merge | Saknades i de 60 hålen |
|---|---|---|---|
| Pure + Build | körs | körs | nej |
| Acceptance (hermetisk) 1–3 + självtest | körs | körs | nej |
| Webblasarbeteende | körs | körs | nej |
| **A11y (axe-runner)** | `skipped` | körs | **ja** |
| **Staging (API + E2E)** | `skipped` | körs | **ja** |
| **Staging sentinel purge (före/efter)** | `skipped` | körs | **ja** |

Det stämmer exakt med `T166`:s egen mätning på sitt enda fall — *"två jobb
kördes aldrig, någonstans: `A11y (axe-runner)` och `Staging (API + E2E)`"*.
Det är fortfarande allvarligt: `Staging (API + E2E)` är den enda ytan som
möter en riktig databas, och `ADR-077` gör just den efterkontrollen till
VILLKORET för att den snabba presubmiten ska vara försvarbar.

**Och nu den mildrande punkten, som ingen mätt förut: hur länge stod hålen
öppna?** `T166` hävdade att täckningen *"återkommer av sig själv vid nästa
KOD-landning"*. Det stämmer — **samtliga 60 fönster stängdes**:

| Fönster till nästa post-merge-svit | Antal |
|---|---|
| under 1 timme | 48 |
| 1–4 timmar | 8 |
| 4–12 timmar | 1 |
| 12–24 timmar | 2 |
| **över 24 timmar** | **1** (33,2 h) |

Median 0,57 h, medel 1,99 h, längsta 33,2 h (`#1963` → `#1979`). Det är
`T166`:s "lugna helg" mätt: fyra fall över fyra timmar på nitton dagar.

Två förbehåll som gör att detta inte friskförklarar mekanismen. För det
första är den fördröjda täckningen **täckning med förstörd attribution** —
faller staging först fem landningar senare pekar larmet på fel commit, vilket
är precis `TASK-334`:s felklass. För det andra fanns det andra nätet inte:
nattnätet har varit rött 51 av 52 nätter (fynd 4), så en fördröjd signal hade
landat i ett larm som redan var rött av andra skäl.

### 1e. Åtgärdsriktning

- **Prioritet:** hög (näst efter fynd 4).
- **Problem:** `post-merge.yml`:s ärvda klassning läser en commit medan
  pushen kan bära tre. 60 av 601 pushar på nitton dagar hoppade
  `Staging (API + E2E)` och `A11y` på ett träd som bar ny kod.
- **Föreslagen förändring — den minsta som stänger luckan.** `T166`:s
  vägval 2, som ligger närmast mekanismens egen deklarerade princip:

  1. `post-merge.yml` skickar `BEFORE: ${{ github.event.before }}` till
     skriptet vid sidan av `SHA` (en rad).
  2. `classify-post-merge.sh` går från `MERGE_SHA` bakåt via första föräldern
     — med det commits-API-anrop skriptet **redan gör** (`:245`) — och räknar
     stegen till `BEFORE`. Är det mer än ETT steg: `docs_only=false`, full
     svit, med skälet utskrivet. Är det exakt ett steg: dagens logik orörd.
  3. Fail-closed på varje kant: `BEFORE` tom eller noll-SHA
     (`0000000000000000000000000000000000000000`, alltså ny gren eller första
     push), `BEFORE` ej nådd inom ett tak på tio steg (force-push, omskriven
     historik), eller API-fel under vandringen ⇒ full svit.

  Detta är ingen ny klassnings-implementation — ingen glob-lista kopieras,
  `ADR-077` § Beslut 1 är orörd. Det är samma ärvning, med en räkning framför.
  **Vägval 1** (klassa varje commit i spannet och OCH-vik utfallen) är
  strikt bättre — den sparar 13 av de 73 körningarna — men kräver en loop över
  ärvningen och fler API-anrop. Nämn den som förfining, bygg den inte först.
- **Förväntad effekt:** de 60 hålen försvinner. Kostnaden är **73 extra
  post-merge-sviter på nitton dagar, cirka 3,8 per dygn**. Varje sådan tar den
  globala `staging-tests`-mutexen och tar enligt `j8-7` cirka 16 minuter
  (upp till 56 vid trängsel). **Det är den verkliga kostnaden och den ska
  vägas öppet** — det var precis den `TASK-73` byggdes för att slippa.
  Vägval 1 skulle sänka det till 60 körningar.
- **Risk:** medel, och den är en kö-risk, inte en korrekthets-risk. Fler
  mutex-tagningar gör revert-vägen långsammare — samma led `TASK-73` mätte till
  25 min 16 s när den var blockerad. Mildring: bygg vägval 1 direkt om
  mutex-trycket visar sig, eller lägg ett tak.
- **Berörda filer:** `.github/workflows/post-merge.yml` (en env-rad),
  `scripts/classify-post-merge.sh` (cirka 25 rader),
  `scripts/test-classify-post-merge.sh` (fem nya fall). Inga externa
  inställningar. `.ci-parity-policy.json` berörs inte (post-merge.yml ingår
  inte i paritetsgrindens ytor).
- **Beroenden:** ingen. Men **mekanism 2 får inte röras före denna** — se
  fynd 2.
- **Verifieringsmetod, tvåsidig:** fem nya stubbfall i den befintliga sviten —
  T22 push med två merge-commitar och docs-topp ⇒ `false` (**detta fall fäller
  mot dagens skript och passerar efter fixen, alltså tvåsidighetsbeviset**),
  T23 push med en merge-commit ⇒ oförändrat `true` (bakåtkompatibilitet),
  T24 `BEFORE` = noll-SHA ⇒ `false`, T25 `BEFORE` onåbar inom taket ⇒ `false`,
  T26 `BEFORE` osatt ⇒ `false`. Därutöver **skarpt**, som skriptets filhuvud
  (`:49-57`) kräver: kör klassningen mot två verkliga SHA:n ur min mätning —
  `269f6d476a` (PR `#2448`, topp docs, spann kod, ska ge `false` efter fixen
  och gav `true` före) och en enkelposts docs-landning som ska förbli `true`.
- **Rollback:** ta bort `BEFORE`-raden i `post-merge.yml`. Skriptet faller då
  till dagens beteende utan ändring — steg-räkningen är grindad av att
  variabeln finns.
- **Rekommendation: NU.** Och i samma andetag: knyt ihop `TASK-365` med
  `T166`, eller ersätt `TASK-365`:s beskrivning med den mätta mekanismen.
  Kortet är `priority: high` med fel rotorsak.

## Fynd 2 — Merge-dedupen

### 2a. Hur den fungerar, belagt i koden

Dedupen är ett steg i `changed`-jobbet, `ci.yml:452-499`. Villkorskedjan,
i ordning:

| # | Villkor | Rad | Vid avvikelse |
|---|---|---|---|
| 1 | `EVENT_NAME` är `push` | `473` | "Dedup ej tillämplig" ⇒ full svit |
| 2 | `git rev-parse --verify HEAD^2` lyckas | `474` | ingen andra förälder ⇒ full svit |
| 3 | `HEAD^{tree}` == `HEAD^2^{tree}` | `476-478` | träd-avvikelse ⇒ full svit |
| 4 | `gh run list --commit <HEAD^2> --workflow ci.yml` ⇒ `success` | `479-483` | ej grön ⇒ full svit |

Konsumenten är `suite`-jobbets `if:` (`ci.yml:2163`): sviten hoppas vid
`should_skip_tests` ELLER `dedup_hit`.

**Uppdragets fråga: varför hittar den inte kö-körningen på samma SHA?** Svaret
har två lager, och bara det andra är det intressanta.

- **Direkt svar:** den frågar aldrig efter den. Anropet på rad `479` ställs mot
  `HEAD^2` — PR-grenens huvud — aldrig mot `github.sha`. Kö-körningen ligger på
  `github.sha`. Den är utanför frågans synfält, strukturellt.
- **Men det är inte därför den missar.** Villkor 3 grindar före villkor 4. Är
  träden olika görs API-anropet aldrig. Så felet är **inte** frågan i första
  hand — det är att trädjämförelsen är en svagare identitet än den som finns
  att få.

`ADR-077` § Beslut 2 (`:78`) motiverar sundheten med *"merge-grindens strict
up-to-date-krav (ADR-076)"*. Den premissen är **falsifierad i dagens
konfiguration**: jag mätte `strict_required_status_checks_policy: false` i
rulesetet 2026-09-17. J8.5 hade rätt om det. Men konsekvensen är mildare än
J8.5 drog: dedupen är fail-closed på träd-avvikelse, så en falsifierad
sundhetspremiss kostar **besparing**, aldrig säkerhet.

### 2b. Vad underlagen sade, och vem som hade rätt

J8.5 skrev att dedupen visade sig *"i praktiken utan verkan"* med *"noll
dedup-träffar på 80 körningar"*, och S11 skärpte att samma träd testas tre
gånger per landning. **S11 håller. J8.5:s huvudpåstående faller.**

Mätt över alla 601 pushar i fönstret:

| Läge | Pushar | Andel | Betyder |
|---|---|---|---|
| Träd LIKA, spann = D0 | 157 | 26,1 % | sviten hoppas ändå av D0 — en träff sparar noll |
| **Träd LIKA, spann = KOD** | **32** | **5,3 %** | **de enda fall där en träff sparar något** |
| Träd OLIKA, spann = D0 | 187 | 31,1 % | hoppas av D0 |
| Träd OLIKA, spann = KOD | 225 | 37,4 % | full svit körs; här sitter S11:s tredubbling |

Jag hämtade `CI [push]`-körningens jobblista för **samtliga 32** kandidater.
Eftersom spannet är kodklassat kan `should_skip_tests` inte vara sant, så ett
hoppat `Test suite` kan bara förklaras av `dedup_hit`.

**Utfall: 32 av 32 var dedup-träffar.** Ingen enda miss. **Verifierad.**

Dedupen träffar alltså i 100 % av de fall där den kan göra nytta, cirka 1,7
gånger per dygn, och sparar varje gång en hermetisk svit på cirka 12,5 minuter.
Den mest sannolika förklaringen till J8.5:s nolla är att urvalet inte var
begränsat till `push`-körningar: steget är grindat på `EVENT_NAME = push`
(`ci.yml:473`) och är därför strukturellt otillämpligt på två av tre ytor. Ett
stickprov på 80 blandade körningar visar noll träffar av konstruktion.

### 2c. De två vägarna, vägda mot varandra

**Väg A — laga frågan.** Byt villkor 3+4 mot: "har `github.sha` en grön
`merge_group`-körning av `ci.yml` **där `Test suite` faktiskt KÖRDE**?"
Identiteten blir SHA:t självt — strikt starkare än trädjämförelsen, och exakt
den form `classify-post-merge.sh` § TVÅ KÄLLOR redan argumenterar för.

- **Vinst:** de 225 pushar som i dag kör full svit i onödan skulle kunna
  dedupas. Cirka 225 × 12,5 min ≈ **47 timmars körtid på nitton dagar**.
- **Men vad är den vinsten värd?** Repot är publikt, så Actions-minuter är
  gratis (S14). `CI [push]`-sviten tar **inte** staging-mutexen (`ci.yml`
  skickar `run_staging: false` villkorslöst) och kör parallellt med
  post-merge — den fördröjer alltså ingen landning. Vinsten är
  runner-samtidighet och maskinlast, inte pengar och inte ledtid.
- **Och en fälla som måste namnges:** villkoret får ALDRIG vara "kö-körningen
  är grön". På exakt de 60 hålen i fynd 1 är kö-körningen grön **med sviten
  hoppad**. Ett naivt "grön körning på samma SHA" fail-openar alltså precis
  där det gör mest skada. Signalen måste vara "sviten körde och var grön" —
  samma binära signal `classify-post-merge.sh:266-289` redan läser.
- **Och den avgörande invändningen:** i dag är `CI [push]`-körningen det ENDA
  som verifierar de hermetiska klasserna för fynd 1:s 60 hål. Dedupas den bort
  innan fynd 1 är lagat, förlorar de 60 pusharna sitt sista nät — och den
  besparing som motiverade ändringen blir ett hål. Det är `ADR-077` § Beslut 2
  ordagrant: *"en besparing får aldrig bli ett hål."*

**Väg B — riv dedupen.** Cirka 48 rader ur `ci.yml` (`452-499`), en output
(`:81`) och ett villkor i `suite`-jobbets `if:` (`:2163`).

- **Vinst:** mindre kod, en mekanism-klass mindre att underhålla.
- **Kostnad:** 32 extra hermetiska sviter på nitton dagar, och en mekanism som
  bevisligen fungerar rivs på ett underlag som föll.

**Domen:** väg B är utesluten — man river inte något som mäter 32 av 32. Väg A
är sund i sak men fel i tid.

### 2d. Åtgärdsriktning

- **Prioritet:** låg.
- **Problem:** inget verkligt problem i dag. Dedupen fungerar. Det som finns
  är en **obetald besparing** (225 onödiga sviter på nitton dagar) och en
  **falsifierad mening i `ADR-077` § Beslut 2**.
- **Föreslagen förändring, NU:** ingen kodändring. Rätta `ADR-077` § Beslut 2
  öppet — sundheten vilar inte längre på `strict`, som är avstängd sedan
  2026-08-05, utan på att steget är fail-closed på träd-avvikelse. Det är en
  ren `ADR-083`-rättelse i den öppna korrigerings-formen `ADR-076` redan
  använder.
- **Föreslagen förändring, SENARE (efter fynd 1):** väg A, med signalen
  "`Test suite` körde och var grön i `merge_group`-körningen på `github.sha`",
  och med helpern **delad** med `classify-post-merge.sh` — det är
  ändringsloggens egen rekommendation 2 ("en enda gemensam, testad
  klassnings-tjänst") som då blir konkret, med två faktiska konsumenter i
  stället för en spekulativ abstraktion.
- **Förväntad effekt:** cirka 225 färre hermetiska sviter per nitton dagar.
  Ingen ledtidsvinst; lägre maskinlast.
- **Risk:** hög om den görs före fynd 1 (river fynd 1:s enda nät). Låg efter.
- **Berörda filer:** `docs/decisions/ADR-077-…md` nu; senare `ci.yml`,
  `scripts/classify-post-merge.sh`, en ny delad helper med egen testsvit.
- **Beroenden:** **hård — fynd 1 måste landa först.**
- **Verifieringsmetod:** kontrastpar på en verklig landning (dedup-miss före,
  träff efter) plus tvåsidiga stubbfall där kö-körningen är grön med hoppad
  svit och ska ge `dedup_hit=false`.
- **Rollback:** villkorskedjan är ett enda steg; återställ steget.
- **Rekommendation: ADR-rättelsen NU. Kodändringen SENARE, aldrig före fynd 1.
  Riv inte dedupen — inte alls.**

## Fynd 3 — Vem vaktar vakten

### 3a. (i) Vaktas aggregatorns `needs`-lista?

**Delvis — och J1a missade den halvan.** `scripts/verify-ci-parity.mjs:202-224`
(`verifieraJobbmangd`) fäller fail-closed åt båda håll: ett nytt toppnivåjobb
i `ci.yml`/`ci-suite.yml` som `.ci-parity-policy.json` inte känner till ger fel,
och en policy-post vars jobb försvunnit ger också fel. Filhuvudet (`:36-40`)
skriver ut det som en av två ytor som "fortfarande kan drifta".

Men vakten räcker inte, av två oberoende skäl:

1. **Den kontrollerar fel sak.** Den kräver att jobbet är KLASSAT i policyn,
   inte att det står i `ci-passed.needs`. Ett nytt jobb som lydigt läggs till i
   `knownJobs` men glöms i aggregatorns `needs` passerar.
2. **Den körs inte.** `verify-ci-parity.mjs` är inte wirad i någon workflow —
   bara dess egen testsvit (`node scripts/test-verify-ci-parity.mjs`,
   `ci.yml:1542`) körs i CI. Och `CLAUDE.md` säger uttryckligen **"Kör det
   INTE före varje push"**. En vakt som kostar 910,7 s och som den styrande
   texten avråder från som rutin är i praktiken en diagnos, inte en grind.

`.listparitet-policy.conf` bär sex par (`:140-146`); inget av dem rör
aggregatorn. **Nuläget är korrekt** — mekaniskt verifierat av mig med `js-yaml`:
sju toppnivåjobb, `ci-passed.needs` räknar upp de sex övriga, inget saknas.

**Åtgärdsriktning:**

- **Prioritet:** medel.
- **Problem:** ett nytt toppnivåjobb i `ci.yml` kan utelämnas ur
  `ci-passed.needs` utan att något fäller. Aggregatorn är repots ENDA required
  check; ett jobb utanför dess `needs` är ett jobb som inte kan blockera en
  landning, hur rött det än blir. Det är `L322`-klassen.
- **Föreslagen förändring:** ett litet CI-wirat invariant-skript, exakt i
  formen `scripts/check-fetch-depth-invariant.sh` redan har: läs `ci.yml` med
  `js-yaml`, hävda att varje toppnivåjobb utom `ci-passed` finns i
  `ci-passed.needs`, fäll med jobbets namn annars. Cirka 30 rader plus en
  tvåsidig testsvit, wirad i `lint`-jobbets gatekeeper-steg (samma steg som
  redan kör ett tjugotal sviter). Att lägga hävdelsen i `verify-ci-parity.mjs`
  vore fel hemvist — den filen körs inte i CI.
- **Förväntad effekt:** felklassen blir omöjlig i stället för osannolik.
- **Risk:** mycket låg. Skriptet läser en fil och jämför två mängder.
  Medvetna undantag (ett jobb som AVSIKTLIGT står utanför `needs`) hanteras med
  en explicit allowlist med skrivet skäl — samma form som
  `.listparitet-policy.conf`:s undantag, och `check-listparitet.sh`:s regel om
  att ett onödigt undantag också fäller.
- **Berörda filer:** nytt `scripts/check-aggregator-needs.mjs`, ny
  `scripts/test-check-aggregator-needs.mjs`, en rad i `ci.yml`:s
  gatekeeper-steg, en post i `.ci-parity-policy.json`:s `coveredByCheckDocs`
  om den ytan berörs.
- **Beroenden:** ingen.
- **Verifieringsmetod:** tvåsidig — sviten kör mot en sandlådekopia av `ci.yml`
  med ett jobb borttaget ur `needs` (ska fälla) och mot den riktiga filen (ska
  passera).
- **Rollback:** ta bort raden i gatekeeper-steget.
- **Rekommendation: NU** — billigast av alla fyra åtgärder och stänger en
  felklass som i dag bara upptäcks av att någon råkar köra ett verktyg den
  styrande texten avråder från.

### 3b. (ii) Gate-proof prövar en replik, och körs inte automatiskt

Båda leden håller. **Verifierad.**

- `gate-proof.yml:29-30`: triggern är **enbart** `workflow_dispatch`. Inget
  `pull_request`, inget `paths`-filter.
- `gate-proof.yml:73-102`: jobbet heter `umbrella-replica` och filhuvudet
  (`:26-27`) säger rakt ut att jq-logiken är *"VERBATIM ur ci.yml:s ci-passed"* —
  alltså en handhållen kopia. `ADR-077` § Beslut 4 (`:116`) skriver ut
  konventionen: *"körs efter varje ci.yml-ändring; dess jq-fail-closed-gren är
  en verbatim replik av `ci-passed`:s och speglas om `ci-passed` ändras."*
  Det är ett **frivilligt arbetssätt**, inte en teknisk regel.
- Mätt: gate-proof kördes senast **2026-09-04T13:02:49Z**. `ci.yml` ändrades
  därefter två gånger, båda 2026-09-07 (`d8e2fddd`, `7ab494c4`, `TASK-419`).
  **Den har alltså inte körts efter de två senaste ci.yml-ändringarna** —
  J8.5 höll. Till konventionens försvar: den 2026-09-04 kördes gate-proof
  femton minuter efter att `TASK-395` lagt till `audit`-jobbet, alltså
  efterlevs den ibland. Och de två oefterlevda ändringarna rörde inte
  aggregatorn — `TASK-419` la 30 rader i gatekeeper-steget.

**Åtgärdsriktning:** den uppenbara åtgärden (lägg `pull_request` +
`paths: ['.github/workflows/ci.yml']` på gate-proof) mekaniserar KONVENTIONEN
men löser inte PROBLEMET — repliken förblir en kopia. Den värdefulla minsta
ändringen är den andra:

- **Prioritet:** låg.
- **Problem:** replikens jq-uttryck kan glida från `ci-passed`:s utan att något
  märker det. Beviset blir då grönt för en logik som inte längre är den som
  kör.
- **Föreslagen förändring:** en hävdelse på cirka fem rader i den nya
  `check-aggregator-needs.mjs` (3a) — extrahera `bad=$(…)`-uttrycket ur båda
  filerna och kräv byte-identitet. Samma kopplings-grind som
  `test-classify-post-merge.sh` T13 redan gör för en sträng.
- **Förväntad effekt:** replik-drift blir omöjlig. Att gate-proof inte KÖRTS
  spelar då mindre roll — en grön körning från förr bevisar fortfarande dagens
  logik, eftersom den är bevisat identisk.
- **Risk:** låg. Uttrycket måste extraheras robust; en för lös regex ger
  falska fällningar.
- **Berörda filer:** samma skript som 3a, plus dess testsvit.
- **Beroenden:** bygg ihop med 3a, samma PR.
- **Verifieringsmetod:** tvåsidig mot sandlådekopior där ett tecken ändrats.
- **Rollback:** ta bort hävdelsen.
- **Rekommendation: SENARE**, buntad med 3a om det är billigt. Ett
  `paths`-filter på gate-proof är **inte** värt sin kostnad: det gör ingen
  rad säkrare och lägger en grön check på varje `ci.yml`-PR som ingen läser.

### 3c. (iii) En PR kan ändra `ci.yml` och landa med noll godkännanden

Faktapåståendet håller. Mätt av mig 2026-09-17 mot rulesetet:
`required_approving_review_count: 0`, `require_code_owner_review: false`,
`bypass_actors: []`. `.github/CODEOWNERS` namnger visserligen
`/.github/ @marcus803`, men utan `require_code_owner_review` är filen
verkningslös som grind. **Verifierad.**

**Men risken är redan buren, och den går strukturellt inte att stänga här.**

- **Redan buret:** `ci.yml` ligger i D0-listans exkluderingar
  (`!.github/workflows/**`, `ci.yml:238`). En `ci.yml`-PR är alltså ALLTID
  kodklassad, vilket betyder att `review-backstopp` (`ci.yml:2483-2486`) gäller
  den på kö-ytan: PR:en kan inte mergas utan en välformad och FÄRSK
  Riskbedömnings-sektion. `ADR-105` § beslut 2 säger själv vad den grinden
  inte bevisar (att granskningen ägde rum), men att sektionen måste finnas och
  matcha `granskadSha` är mekaniskt.
- **Går inte att stänga:** `required_approving_review_count: 1` tillsammans med
  `require_code_owner_review: true` och `* @marcus803` skulle låsa repot helt.
  GitHub tillåter inte att man godkänner sin egen PR, och Marcus är den enda
  ägaren — varje PR skulle fastna. Det är inte en avvägning, det är en
  återvändsgränd.
- **Den skarpaste kvarvarande kanten**, som jag registrerar men inte kunde
  mäta till slut: en PR som ändrar `ci.yml` kör sin EGEN `ci.yml` på kö-ytan,
  eftersom kö-grenen innehåller PR:ens ändringar. En PR som tar bort
  `review-backstopp` ur `needs` skulle alltså inte granskas av den grinden i
  sin egen kö-körning. Jag försökte belägga det mot `TASK-395`:s landning
  (`38429d77`, som la till `audit`-jobbet) men `check-runs`-svaret var
  pagineringstrunkerat vid 30 poster och `gh run list --commit` gav ingen
  träff på kö-körningen. **Starkt indikerad, ej verifierad.** Vad som krävs
  för att fylla luckan: `gh api repos/{repo}/commits/{sha}/check-runs?per_page=100`
  med paginering, mot en merge-commit vars PR la till ett toppnivåjobb.
- **Jämförelsen med `ADR-105` beslut 7 haltar.** `.review-policy.json` läses ur
  `origin/main` just för att en gren inte ska mildra sin egen granskning — men
  det skyddet gäller en POLICYFIL som granskaren läser, inte en WORKFLOW som
  GitHub kör. Workflow-ytan kan inte läsas ur `origin/main`; plattformen kör
  kö-grenens version. Precedenten kan alltså inte utvidgas hit.

- **Rekommendation: INTE ALLS**, med ett undantag: 3a:s vakt fångar den
  troligaste konkreta formen (ett jobb som tyst tappas ur `needs`) och är
  redan rekommenderad. Registrera den oprövade kanten ovan som en tråd, inte
  som en åtgärd.

## Fynd 4 — Nattnätets signal

### 4a. Natt för natt, hela perioden

52 schemalagda körningar 2026-07-28 → 2026-09-17: **51 röda, 1 grön**
(2026-07-29). Det bekräftar S7 exakt. I det bredare fönstret jag hämtade (56
nätter från 2026-07-24) finns fem gröna: 07-24, 07-25, 07-26, 07-27 och 07-29.

Jobb-för-jobb, antal nätter rött av 56:

| Jobb | Röda nätter | Klass |
|---|---|---|
| Backlog-stängning (natt-grind) | 44 | bokföring |
| Länkkontroll (utan cache) | 39 | dokument (egen kanal sedan `ADR-082`) |
| Sessionsdok-fönstret (natt-grind, `ADR-099`) | 30 | bokföring |
| Sannings-avstämning — obesvarade larm | 28 | bokföring |
| **Nattlig fullsvit / Staging (API + E2E)** | **15** | **produkt** |
| Bredare sårbarhetsgranskning | 13 | säkerhet |
| **Kontraktsvakt (fixtur mot skarp staging)** | **9** | **produkt** |
| **Nattlig fullsvit / A11y (axe-runner)** | **3** | **produkt** |
| Sannings-avstämning — pausade sessioner | 2 | bokföring |
| **Nattlig fullsvit / Acceptance (hermetisk) (2)** | **1** | **produkt** |

**Inget jobb har aldrig varit grönt.** Uppdragets fråga besvarad: det finns
ingen permanent trasig grind.

### 4b. Vad underlagen sade, och vem som hade rätt

S12 mätte nätterna 09-15 och 09-16 och fann fyra röda jobb — tre
processgrindar plus sårbarhetsgranskningen, inget testjobb — och drog
slutsatsen att *"nätet är inte trasigt, det bär FEL LAST"*.

**S12:s två nätter stämmer exakt** (jag mätte samma: `BL, OL, SD, SÅ`).
**Men generaliseringen håller inte.** Över hela perioden:

| Nätter 2026-07-28 → 09-17 | Antal | Andel |
|---|---|---|
| **Rött PRODUKTSKYDDANDE jobb** (svit, kontraktsvakt, a11y) | **25** | **48 %** |
| Rött enbart av bokföring, dokument eller säkerhet | 26 | 50 % |
| Grön natt | 1 | 2 % |

Nästan hälften av nätterna bar en äkta produktsignal. Två serier sticker ut:

- **Kontraktsvakten röd sex nätter i rad**, 2026-08-22 → 08-27. Det är
  mekanismen som ska visa att den hermetiska fixturvärlden fortfarande liknar
  verkligheten — samma mekanism S10 fann bevakar 7 av 18 mockar. Den var
  alltså både smal och röd, i en vecka, osett.
- **Staging + A11y röda tre nätter i rad**, 2026-08-18 → 08-20.

Det gör bilden allvarligare än S12:s: det handlar inte bara om att nätet bär
fel last, utan om att **en äkta produktsignal legat i det röda bruset i
veckor**.

### 4c. Priset, mätt på ett konkret kort

`TASK-239` (`status: Done`) har AC #3: *"Acceptance grön i nattnätet tre
nätter i rad efter åtgärd (belägg: run-ID:n)"*. Den står **obockad**, med
noteringen *"AC #3 (tre gröna nätter) — bevakas av orkestreraren/nattnätet, ej
görbart idag."*

Jag mätte det. Från 2026-08-17 (åtgärdens landning) till 2026-09-17, 32 nätter:

- **31 nätter i obruten följd där VARJE Acceptance-jobb var grönt.**
- Enda avbrottet: 2026-09-17, då `Acceptance (hermetisk) (2)` föll.
- Workflow-nivåns `conclusion` alla dessa 32 nätter: **`failure`, utan undantag.**

Kriteriet krävde tre. Det fick trettioen. Kortet kan ändå inte stängas, för
"grön natt" läses på workflow-nivå, och där har bokföringsgrindarna hållit
lampan röd hela tiden. **Det är det mest konkreta priset i hela granskningen
på en larmkanal med blandad last.** Och det är inte ett kort: det är en klass —
varje framtida kriterium av formen "N gröna nätter" är omätbart tills detta
lagas.

Två andra poster i samma riktning:

- Grinden `obesvarade-larm` bevakar enligt `.sanningsavstamning-policy.conf:162-164`
  exakt EN etikett: `ci-post-merge:24`. Att den var röd 28 nätter betyder att ett
  post-merge-larm stått obesvarat mer än 24 timmar på 28 av 52 nätter — samma
  sak `TASK-365`:s rättelsenot bokför (*"larm-jobbet avslutades success i minst
  sex röda körningar (~47 h) utan att … agera"*).
- `ADR-131` § beslut 7 river `check-backlog-closure.sh` och nattjobbet
  Backlog-stängning — den enskilt största röda bidragsgivaren, 44 av 56
  nätter. Beslutet är Accepted sedan 2026-09-04 och har `## Updates: Inga än`
  (S15).

### 4d. Att inte riva ett medvetet val

Tre styrande texter måste respekteras, och alla tre pekar åt samma håll som
mitt förslag:

- **`ADR-077` § Beslut 3** kräver att en röd natt skapar ett tilldelat,
  etiketterat ärende med stängningsregel. Den säger **inte** att alla jobb ska
  dela kanal.
- **`ADR-082`** har redan gjort exakt den uppdelning jag föreslår, för
  länkkontrollen. `nightly.yml:674-677` skriver ut skälet ordagrant:
  *"Detta ärende är tilldelat och ska betyda 'något är akut fel'; en extern
  värds dåliga dag hör inte dit och devalverar signalen."* Länkrötan fick en
  egen, mildare kanal med ETT stående ärende (`links-arende`,
  `nightly.yml:195-260`, etikett `lankrota`). **Mönstret är redan taget,
  motiverat och byggt — det saknas bara en andra tillämpning.**
- **`ADR-099` / PRD `task-158`** begär att sessionsdok-fönstrets fynd når en
  kedja som faktiskt bevakas (`L321`: rött utan larm vore en tyst permanent).
  Kravet är **"inte tyst"**, inte **"samma kanal som produktfel"**. Ett stående
  bokförings-ärende uppfyller det.

Och repot tillämpar redan den bärande principen. Samma policyfil (`:159-161`)
säger: *"En grind får aldrig mata den kanal den mäter."* Precis det
resonemanget gäller här — bokföringsgrindarna mäter arbetsformen, inte
produkten, och ska inte färga produktens lampa.

### 4e. Åtgärdsriktning

- **Prioritet:** högst av de fyra.
- **Problem:** `nightly.yml:699` blandar åtta `needs` — fyra produktskyddande
  (`suite`, `kontraktsvakt`, `nightly-audit`, `nightly-metrics`) och fyra
  bokförande (`backlog-closure`, `pausade-sessioner`, `obesvarade-larm`,
  `sessionsdok-fonster`) — i EN kanal med EN etikett. Följden är mätt: 51 röda
  nätter i rad, 21 obesvarade `ci-natt`-larm, en kontraktsvakt röd en vecka
  osett, och ett acceptanskriterium som inte kan bockas trots 31 gröna nätter.
- **Föreslagen förändring — `ADR-082`-mönstret, andra tillämpningen:**
  1. Flytta de fyra bokföringsgrindarna UR `alarm.needs`.
  2. Ge dem ett eget jobb i `links-arende`:s exakta form — ETT stående ärende
     på en egen etikett (t.ex. `natt-bokforing`), nya fynd som kommentarer,
     icke-blockerande, med samma stängningsregel.
  3. `alarm` behåller de fyra produktjobben, sin etikett `ci-natt`, sin
     tilldelning och sin stängningsregel — orörd i form.
  Jobb-status-listan (`nightly.yml:758-782`, `T146`) bör fortsätta redovisa
  **alla åtta** jobbens resultat i båda ärendena; det som ändras är VILKA jobb
  som utlöser vilken kanal, inte vad texten innehåller.
- **Förväntad effekt, mätt mot historiken:** av 52 nätter hade
  **produktkanalen fyrat 35 gånger** (67 %) och **enbart bokföringskanalen 12
  gånger**. Räknar man dessutom sårbarhetsgranskningen som en egen kanal —
  vilket är rimligt, den är beroende-advisories och rör sig med omvärlden,
  inte med vår kod — hade produktkanalen fyrat **25 gånger (48 %)**.
  **Var ärlig om vad det betyder:** delningen gör signalen MENINGSFULL, inte
  TYST. Hälften av nätterna har ett verkligt produktfel, och det är det
  egentliga fyndet. Skillnaden är att efter delningen betyder ett rött
  `ci-natt` en enda sak.
- **Risk:** låg, men inte noll. Den verkliga risken är att bokföringskanalen
  blir en kyrkogård ingen läser — precis det `ADR-077` § Beslut 3 kallar
  kyrkogårdseffekten. Mildring: stängningsregeln följer med, och det stående
  ärendet är per konstruktion ETT, inte sjuttio. Notera också att
  `obesvarade-larm` redan undantar `ci-natt` från sin egen bevakning
  (självförstärkande loop, `.sanningsavstamning-policy.conf:145-158`) — den
  nya etiketten ska undantas på samma grund, annars byggs loopen in på nytt.
- **Berörda filer:** `.github/workflows/nightly.yml` (ett nytt jobb i
  befintlig form, en ändrad `needs`-rad), `.sanningsavstamning-policy.conf`
  (undantagsnot för den nya etiketten), `CONTRIBUTING.md` § Nattnätet
  (stängningsregeln gäller båda kanalerna), `ADR-082` eller en ny kort ADR som
  bokför att mönstret nu har två tillämpningar, `.label-policy.json` (ny
  etikett).
- **Beroenden:** ingen. Kan landa först av allt.
- **Verifieringsmetod:** `nightly.yml` har redan `simulate_failure` för
  larmkedje-bevis. Kör tvåsidigt: (a) dispatch som gör en BOKFÖRINGSGRIND röd
  ⇒ bokföringskanalen får ett ärende, `ci-natt` tyst; (b) dispatch som gör
  `suite` röd ⇒ `ci-natt` får sitt tilldelade ärende, bokföringskanalen tyst.
  Städa testärendena med motivering, som workflowens egen input-beskrivning
  kräver.
- **Rollback:** flytta tillbaka de fyra posterna till `alarm.needs` och ta bort
  det nya jobbet. Ingen datamigrering, inga externa inställningar utöver
  etiketten.
- **Rekommendation: NU.**

**Två sekvensfrågor som hör till Marcus, inte till denna åtgärd:**

1. `ADR-131` § beslut 7 river Backlog-stängning — 44 av 56 röda nätter. Sätts
   en brytdag före delningen krymper problemet av sig självt, och delningen
   blir billigare att motivera. Sätts ingen brytdag underhålls en grind som
   är dömd. Detta är S15:s fråga, och den står kvar.
2. **`TASK-239` AC #3 bör bockas av på belägg, inte vänta på en grön natt.**
   31 gröna Acceptance-nätter i följd (2026-08-17 → 09-16) är starkare belägg
   än kriteriet begärde. Run-ID:n finns i mitt scratch-material och kan hämtas
   om med `gh run list --workflow nightly.yml`.

## Osäkerheter och vad jag inte kunde belägga

| Påstående | Märkning | Vad som krävs för att fylla luckan |
|---|---|---|
| En PR som ändrar `ci.yml` kör sin egen `ci.yml` på kö-ytan | **starkt indikerad** | `gh api repos/{repo}/commits/{sha}/check-runs?per_page=100` med paginering mot en merge-commit vars PR la till ett toppnivåjobb (t.ex. `38429d77`, `TASK-395`) |
| "En push ger EN workflow-körning" som DOKUMENTERAD regel | **starkt indikerad** i dokumentationen, **verifierad** empiriskt (0/85 mot 73/73) | En uttrycklig mening i GitHubs Actions-dokumentation; jag hittade ingen |
| Mitt D0-filter matchar `tj-actions/changed-files` i alla kanter | **verifierad** för 18 PR:er och 14 körningar; **osäker** för raderade filer, symlänkar och mycket stora diffar | Samma kantfall J8.5 också reserverade sig för. Kör klassningen mot en diff med raderade filer |
| Kostnaden för fynd 1:s fix i mutex-kötid | **ej verifierad** — jag härledde 73 extra körningar men mätte inte köeffekten | `npm run metrics:ci` efter att fixen kört en vecka; jämför `staging-tests`-kötiden före och efter |
| Varför min `ci.yml`-push-lista skrevs över på disk | **ej verifierad** | Ingen. Registrerat som mät-hygienisk incident; alla tal kommer från omkörningen |
| Om de 60 hålen faktiskt DOLDE ett fel | **ej verifierad** | Jag mätte att kontrollen uteblev, inte att något var trasigt. En bakåtkörning av `Staging (API + E2E)` mot de 60 träden vore möjlig men dyr och sannolikt inte värd det |

Två saker jag medvetet INTE gjorde: jag körde inte `npm run check:docs`
(kontraktets förbud), och jag rörde ingen annan fil än denna.

## Risker

1. **Att fynd 2 läses som "dedupen är viktig, skynda på väg A".** Den
   viktigaste meningen i fynd 2 är sekvensen, inte mätningen: en förbättrad
   dedup före fynd 1:s fix förvandlar 60 fördröjda kontroller till 60
   permanenta hål.
2. **Att fynd 1:s milda exponeringsfönster läses som "ingen åtgärd behövs".**
   Medianen är 34 minuter, men fördelningen har en svans, det andra nätet var
   rött hela perioden, och fördröjd täckning bär förstörd attribution
   (`TASK-334`).
3. **Att fynd 4:s delning läses som att problemet försvinner.** Produktkanalen
   hade fyrat på hälften till två tredjedelar av nätterna. Delningen gör
   signalen läsbar; den gör inte natten grön. Arbetet med staging-fällningarna
   och kontraktsvakten återstår efteråt.
4. **Att `T166` förblir oanvänd en tredje gång.** Tråden har haft rätt sedan
   2026-08-21 och är `lifecycle: paused`. Den här filen är dess andra läsning.
   Sker ingenting nu är sannolikheten hög att en femte fix på samma yta skrivs
   av någon som inte hittade den.

## Rekommendationer

Detta är rekommendationer, inte beslut.

| # | Åtgärd | Prioritet | Rekommendation |
|---|---|---|---|
| 1 | Dela nattnätets larm i produkt- och bokföringskanal (`ADR-082`-mönstret) | högst | **nu** |
| 2 | Låt post-merge-klassningen fälla fail-closed på flerposts-push | hög | **nu** |
| 3 | CI-wirad vakt för `ci-passed.needs` + gate-proof-replikens identitet | medel | **nu** (3a) / **senare** (3b, buntad) |
| 4 | Rätta `ADR-077` § Beslut 2:s falsifierade sundhetspremiss | låg | **nu** (ren texträttelse) |
| 5 | Knyt `TASK-365` till `T166` eller ersätt dess rotorsaksbeskrivning | medel | **nu** |
| 6 | Bocka `TASK-239` AC #3 på 31 nätters belägg | låg | **nu** |
| 7 | Sätt brytdag för `ADR-131` § beslut 7 (Backlog-stängning) | medel | **Marcus-beslut**, S15:s fråga |
| 8 | Laga dedupens fråga (`merge_group` på samma SHA, "sviten körde") | låg | **senare — aldrig före åtgärd 2** |
| 9 | Riv merge-dedupen | — | **inte alls** — den mäter 32 av 32 |
| 10 | Godkännandekrav eller CODEOWNERS-grind på `ci.yml` | — | **inte alls** — låser repot, risken bärs av `ADR-105` |

## Källor

**Kod och konfiguration i detta repo** (alla rader lästa 2026-09-17 på
`eeca8c72`): `.github/workflows/post-merge.yml` · `.github/workflows/ci.yml` ·
`.github/workflows/ci-suite.yml` · `.github/workflows/nightly.yml` ·
`.github/workflows/gate-proof.yml` · `scripts/classify-post-merge.sh` ·
`scripts/test-classify-post-merge.sh` · `scripts/verify-ci-parity.mjs` ·
`scripts/check-listparitet.sh` · `.listparitet-policy.conf` ·
`.ci-parity-policy.json` · `.sanningsavstamning-policy.conf` ·
`.github/CODEOWNERS`

**Beslut och trådar:** `docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md` ·
`docs/decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md` ·
`docs/decisions/ADR-082-lankgrindens-form-presubmit-postsubmit.md` ·
`docs/decisions/ADR-099-sessionsdok-rotens-rullande-fonster.md` ·
`docs/decisions/ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md` ·
`docs/decisions/ADR-131-work-item-substratet-github-issues.md` ·
`tasks/threads/T166-post-merge-klassningen-laser-sista-pr-en-i-ko-batchen.md` ·
`tasks/threads/T135-post-merge-korningen-avbryts-trots-att-filen-sager-aldrig.md` ·
`backlog/tasks/task-365`, `task-334`, `task-239`, `task-78`, `task-73`

**Syskonfiler i denna granskning:** `00-agentkontrakt.md` ·
`01-orkestrerarens-stickprov.md` · `03-andringslogg.md` ·
`j1a-ci-yml-och-ci-suite.md` · `j1b-ovriga-workflows-och-github-katalogen.md` ·
`j8-4-staging-och-e2e.md` · `j8-5-grindlogik-skip-och-gront.md` ·
`j8-7-tid-och-kostnad.md`

**Kommandon jag körde** (2026-09-17, alla läsande):
`git log origin/main --first-parent --since=2026-08-20` ·
`git -c core.quotepath=false diff --name-only <bas> <topp>` ·
`git cat-file --batch-check` ·
`gh run list --workflow post-merge.yml --limit 1000` ·
`gh run list --workflow ci.yml --event push --limit 800` ·
`gh run list --workflow nightly.yml --limit 70` ·
`gh run view <id> --json jobs` (109 körningar) ·
`gh pr view <nr> --json files` (18 PR:er) ·
`gh api repos/high-five-group/miranon-media-admin/rulesets/19627609` ·
`gh run list --workflow gate-proof.yml --limit 10` ·
`node -e` med repots `micromatch` 4.0.8 och `js-yaml`

**Webbkällor:**

- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue>
- <https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/merging-a-pull-request-with-a-merge-queue>
- <https://docs.github.com/en/webhooks/webhook-events-and-payloads>
- <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows>
