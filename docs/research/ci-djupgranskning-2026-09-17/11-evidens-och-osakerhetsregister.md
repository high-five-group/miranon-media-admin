---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 12 av 12 — Evidens- och osäkerhetsregister

> **Proveniens:** skrivet av agenten D12 i CI-djupgranskningen (Session 126,
> miranon-media-admin), på modellen Sonnet 5 (`claude-sonnet-5`), 2026-09-17.
> Kört i worktreen `s126-ci-djupgranskning`, gren `docs/s126-ci-djupgranskning`.
> Ögonblicksbild: `origin/main` `eeca8c72` (2026-09-08). Registret sammanställer
> — det mäter inte om. Där en siffra citeras är källan en av granskningens
> nio leverabler, arton underlagsfiler, stickprovsloggen eller korsgranskningarna
> KG1–KG3, inte en egen ny mätning av mig.

## Kort svar

**Registret bär 130 rader i huvudtabellen, grupperade i åtta områden.** Av dem
är 118 **verifierade**, 10 **starkt indikerade**, 1 **osäker** och 1
**ej verifierbar** inom denna granskning (exakt räknat ur tabellens
Märkning-kolumn, se § Rapport). Den höga andelen verifierade rader är inget
konstgrepp för att se noggrann ut — den speglar att granskningens egna
agenter genomgående mätte direkt (`gh api`, `grep -n`, `sed -n`) i stället för
att anta, och att jag i huvudsak ÄRVER deras märkning snarare än sätter en ny.
Underlagen är sakligt samstämmiga —
korsgranskningen KG3 fann noll fall där två agenter beskriver en mekanism på
oförenliga sätt — men **fyra tal har rört sig under granskningens gång på ett
sätt som en läsare måste känna till innan de återanvänds**: nattnätets
rödhet (från "processgrindar, inte tester" till "ett produktskyddande jobb
rött 25 av 52 nätter"), post-merge-täckningsluckan (från 85 till 60 riktiga
hål) och merge-dedupen (från "i praktiken utan verkan" till "100 % träff när
den kan göra nytta") är rättade av **korsgranskningen KG1** (en Opus-körning
med större kontextfönster, spawnad specifikt för att pröva dessa mekanismer
på djupet) och bokförda i stickprovsloggens post **S30**, som anlände medan
detta register skrevs. Det fjärde talet — antalet PR:er, från "~2 500" till
2 216 — är en SEPARAT rättelse, gjord direkt av orkestreraren i **S27** via
en egen GraphQL-fråga, inte av KG1.

**Den avgörande nyansen, och skälet till att den väger tyngst i hela
registret:** minst två leverabler (leverabel 6 och leverabel 9 — se
`05-branschjamforelse.md` och `08-risk-redundans-flakighet-tid-och-kostnad.md`)
bär i sin egen brödtext ett påstående som S30/KG1 nu motsäger — att
nattnätets rödhet "nästan aldrig" eller "helt" beror på processgrindar, inte
på produkten. Vid min läsning (2026-09-17, efter att PUTS-agentens fyra
tidigare rättelser men INNAN S30 fanns) stod den äldre formuleringen kvar i
båda filerna. Detta är den viktigaste kvarstående motsägelsen i hela
granskningen, och den beskrivs i sin helhet i § Kvarstående motsägelser
punkt M-A/M-B.

## Vad jag läste först

Jag läste, i denna ordning, i sin helhet, innan jag skrev något:

1. `underlag/00-agentkontrakt.md` — det generella kontraktet för alla
   granskningens agenter (denna sessions avvikelse: jag arbetar i en
   worktree, inte i huvudkatalogen, per kontraktets egen notering).
2. `underlag/02-uppdrag-vag-3.md` §§ "Gemensamt för alla tre" och "D12" —
   mitt konkreta uppdrag.
3. `underlag/01-orkestrerarens-stickprov.md` — S1 till och med S29 vid första
   läsningen (S30 anlände senare, se nedan).
4. `underlag/kg3-konsistens-mellan-underlagen.md` — särskilt § Kanoniska tal
   och § Motsägelsetabellen.

Jag kontrollerade sedan om `underlag/kg1-korsgranskning-ci-mekanismer.md`
fanns (den var flaggad som eventuellt oskriven vid mitt uppdrags start). Den
fanns redan vid min FÖRSTA `ls`, så jag läste den i sin helhet (907 rader,
två Read-anrop) före jag skrev huvudtabellen. Jag läste därefter i sin
helhet, i denna ordning: `01-fil-och-komponentinventering.md`,
`02-teknisk-arkitekturkarta.md` (Kort svar, Dom, komponenttabellen,
Osäkerheter, Rekommendationer), `03-andringslogg.md` (Kort svar,
Korrigeringskedjor, Osäkerheter, Risker, Rekommendationer),
`04-branch-worktree-commit-och-pushflode.md` (Kort svar, Riskerna,
Undantagen, Rekommenderat arbetssätt), `05-branschjamforelse.md` (Kort svar,
Sammanfattande tabell, "Det här gör vi starkt/bör förbättras/ska INTE
kopiera", § 14, Precedent-rymden, Osäkerheter, Risker, Rekommendationer),
`06-airtable-kompromisser-och-empiriska-fynd.md` (Kort svar, hela
Kompromissregistret, Osäkerheter, Risker, Rekommendationer),
`07-hermetiska-tester-kontra-realistisk-e2e.md` (Kort svar, Testpyramiden,
CI-koppling, Osäkerheter, Risker, Rekommendationer),
`08-risk-redundans-flakighet-tid-och-kostnad.md` (Kort svar, hela Del 2
Redundansanalysen, hela Del 3 Riskregistret, hela Del 5 Domen, Osäkerheter,
Risker, Rekommendationer) och `09-ci-som-ateranvandbar-djupmodul.md` (Kort
svar, Fynd 10 Migrationsplanen, Fynd 11 Nu/senare/inte alls, Osäkerheter,
Risker, Rekommendationer). Jag läste också `underlag/kg2-externa-fakta-och-
rattelser.md` (Kort svar, § A3, § A5, § Rättelseprotokoll Del B) för de
externa fakta som kompletterar stickprovsloggen.

**Vad som hände medan jag skrev:** orkestreraren skickade TVÅ separata
meddelanden under mitt arbete. Det första informerade om att
stickprovsloggen fått en ny post **S30**, byggd på KG1:s fynd, som rättar
S11, S12 och S18 ytterligare — och att uppdragsfilens § Gällande tal
uppdaterats till fyra rättelser i stället för tre. Det andra, som anlände
EFTER att huvudtabellen redan var skriven, informerade om **S31**: en
LIVE-observation av täckningsluckan, mätt av orkestreraren mitt under
granskningens egen gång (denna sessions egen text-PR landade överst på en
kodfix, och exakt det mönster KG1 beskrev inträffade skarpt). Jag läste alla
tre tillägg i sin helhet och förde in dem i registret (huvudtabellens rad
N20, samt § Påståenden som föll eller skärptes punkt 22) innan jag skrev
slutversionen. **Detta register är alltså skrivet MED S30 OCH S31
inarbetade —
men jag vet INTE om leverabel 6, 8, 9 och 10:s egen brödtext (som citerar den
äldre, S30-föregångna formuleringen) hunnit rättas av samma anledning:** S30
anlände efter att PUTS-agentens fyra tidigare rättelser (S20, S25, S26, S27)
redan var i rörelse, och jag har inte sett en bekräftelse på att en femte
rättelseomgång för S30 är beställd eller genomförd. Se § Kvarstående
motsägelser för konsekvensen.

**Vad som var nytt i detta register, jämfört med att bara läsa leverablerna
var för sig:** ingen tidigare fil i granskningen har (a) samlat alla bärande
påståenden ur leverabel 2–10 i EN tabell med enhetlig märkning, (b) aktivt
sökt efter kvarstående motsägelser MELLAN leverabler efter att KG1/S30
landade, eller (c) stickprovat att `fil:rad`-pekarna i det samlade
underlaget faktiskt träffar på dagens `main`.

## Metod

1. Byggde en löpande lista av bärande påståenden medan jag läste varje
   leverabels Kort svar, Dom/Risker/Rekommendationer-avsnitt — inte varje
   rad i 14 000+ rader underlag, per uppdragets egen instruktion om att
   destillera, inte rådumpa.
2. Grupperade påståendena i åtta områden (grinden före merge, nätet efter
   merge, testnivåerna och hermetiken, Airtable, branch-/pushflödet, tid och
   kostnad, underhåll och återanvändning, branschjämförelsen) och gav varje
   påstående en märkning enligt uppdragets fyrgradiga skala samt en av de sex
   "slags sanning"-klasserna.
3. Där en leverabel och stickprovsloggen/KG1 gav OLIKA tal för samma sak
   (t.ex. dedupens träffkvot, täckningsluckans storlek) skrev jag registrets
   rad enligt den SENASTE, mest rigorösa mätningen (KG1/S30) och noterade den
   äldre formen separat i § Påståenden som föll eller skärptes.
4. Verifierade ett stickprov av `fil:rad`-pekare direkt mot repot (`sed -n`
   på angivna radintervall i `.github/workflows/*.yml`, `scripts/*.sh`,
   `playwright.config.ts`, `CONTRIBUTING.md`, `tests/kontraktsvakt/
   kontraktsfall.ts`, `docs/decisions/ADR-131-...md`) — 14 pekare kontrollerade
   av 130 rader (var nionde rad, över kravet "minst var tionde"). Samtliga 14
   höll. Se § Rapport för listan.
5. Sökte aktivt efter kvarstående motsägelser genom att lägga varje
   leverabels "Kort svar" bredvid de andras på punkter som rör samma
   mekanism, med särskilt fokus på de två spänningar uppdraget själv pekade
   ut (DORA-ledtid mot upplevd väntan) och de jag själv hittade under
   läsningen (nattnätets rödhet, dedupens status).
6. Körde `npx markdownlint-cli2 --no-globs` och `vale` riktat mot denna fil
   till båda var gröna (se § Rapport).

**Slags sanning — förkortningar använda i tabellen:** **DA** = dokumenterad
avsikt · **FI** = faktisk implementation · **TF** = tekniskt framtvingad
regel · **FA** = frivilligt arbetssätt · **EO** = empiriskt observerat
beteende · **EV** = ej verifierat.

**Leverabelkarta — filnamn används i tabellcellerna som "L2"–"L10":**

| Kod | Leverabel | Fil |
|---|---|---|
| L2 | Fil- och komponentinventering | [`01-fil-och-komponentinventering.md`](01-fil-och-komponentinventering.md) |
| L3 | Teknisk arkitekturkarta | [`02-teknisk-arkitekturkarta.md`](02-teknisk-arkitekturkarta.md) |
| L4 | Ändringslogg | [`03-andringslogg.md`](03-andringslogg.md) |
| L5 | Branch/worktree/commit/push | [`04-branch-worktree-commit-och-pushflode.md`](04-branch-worktree-commit-och-pushflode.md) |
| L6 | Branschjämförelse | [`05-branschjamforelse.md`](05-branschjamforelse.md) |
| L7 | Airtable | [`06-airtable-kompromisser-och-empiriska-fynd.md`](06-airtable-kompromisser-och-empiriska-fynd.md) |
| L8 | Hermetiskt kontra E2E | [`07-hermetiska-tester-kontra-realistisk-e2e.md`](07-hermetiska-tester-kontra-realistisk-e2e.md) |
| L9 | Risk, redundans, flakighet, tid, kostnad | [`08-risk-redundans-flakighet-tid-och-kostnad.md`](08-risk-redundans-flakighet-tid-och-kostnad.md) |
| L10 | Djupmodul och målarkitektur | [`09-ci-som-ateranvandbar-djupmodul.md`](09-ci-som-ateranvandbar-djupmodul.md) |
| KG1 | Korsgranskning: fyra CI-mekanismer | [`underlag/kg1-korsgranskning-ci-mekanismer.md`](underlag/kg1-korsgranskning-ci-mekanismer.md) |
| KG2 | Korsgranskning: externa fakta | [`underlag/kg2-externa-fakta-och-rattelser.md`](underlag/kg2-externa-fakta-och-rattelser.md) |
| KG3 | Korsgranskning: konsistens | [`underlag/kg3-konsistens-mellan-underlagen.md`](underlag/kg3-konsistens-mellan-underlagen.md) |
| SL | Stickprovsloggen | [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md) |

## Huvudtabellen

Sikte var 80–150 rader; registret bär 130, ojämnt fördelade efter hur mycket
varje område faktiskt bar av bärande påståenden i leverablerna (nätet efter
merge och testnivåerna bar flest, eftersom KG1:s fyra fynd och den hermetiska
testpyramidens detaljer sitter där).

### Område 1 — Grinden före merge (16 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| G01 | Ruleset `main-skydd`: en enda required check ("CI Passed or Skipped"), 0 required approvals, tom bypass-lista, merge queue `ALLGREEN` max 3 poster | verifierad | TF | `gh api rulesets/19627609`, 2026-09-17 | L3 §2 | S5: höll, mätt 3× oberoende |
| G02 | `ci-passed`-aggregatorn kör alltid (`if: always()`), fäller på `failure`/`cancelled` i sex `needs`, släpper igenom `skipped` tyst | verifierad | FI | `ci.yml:2537-2566` | L2 §Komponenttabell | S2: höll |
| G03 | `audit`-jobbet saknar `if:`/`needs:` och kör villkorslöst på varje PR sedan `TASK-395` (2026-09-04) — även en ren docs-only-ändring | verifierad | DA (medvetet designval) | `ci.yml:2545-2550` | L3 §2; KG3 K1 | S3: avsett i koden |
| G04 | Två öppna high-severity npm-advisories (`sharp`, `smol-toml`) fällde 14 av 14 PR-körningar 2026-09-09→mätdag; `main` orörd sedan 2026-09-08 | verifierad | EO | KG3 §Kanoniska tal | L9 §Kort svar | — |
| G05 | Aggregatorns `needs`-lista har ingen CI-wirad vakt: `.ci-parity-policy.json` klassar jobbnamn men kontrollerar inte att jobbet står i `ci-passed.needs`; `verify-ci-parity.mjs` körs inte i CI | verifierad | FI (avsaknad) | `verify-ci-parity.mjs:202-224` | KG1 §3a | S2b öppen fråga → AVGJORD av KG1 |
| G06 | `gate-proof.yml` (aggregatorns handkopierade replik) triggas endast via `workflow_dispatch`; senast körd 2026-09-04, `ci.yml` ändrat två gånger därefter (2026-09-07) utan ombevis | verifierad | FA | `gate-proof.yml:29-30,73-102` | KG1 §3b | — |
| G07 | En PR som ändrar `ci.yml` (inkl. `needs`-listan) kan landa med noll mänskliga godkännanden; `review-backstopp` gäller ändå eftersom `ci.yml` alltid är kodklassad | verifierad (godkännandekrav) / starkt indikerad (egen-kö-kant) | FI/EV | KG1 §3c | L9 §Riskregistret M4 | — |
| G08 | Merge-dedupen träffar 32 av 32 tillfällen där en träff kan spara något (5,3 % av alla pushar, 100 % villkorad träffrekvens) — inte "i praktiken utan verkan" | verifierad | EO | KG1 §2b (601 pushar) | KG1; SL S30 | S11/S20: skärpt ytterligare av S30/KG1 |
| G09 | ADR-077 §Beslut 2:s skrivna motivering för dedupen ("sundhet vilar på `strict`") är falsifierad (`strict` avstängdes 2026-08-05); konsekvensen är enbart förlorad besparing, aldrig ett hål, eftersom dedupen är fail-closed på trädavvikelse | verifierad | DA (föråldrad) | ADR-077 §Beslut2; ruleset-mätning | KG1 §2a | — |
| G10 | Samma träd testas upp till fyra gånger per kod-landning (PR-yta, kö-yta, `CI [push]` på `main`, efterkontroll); `CI [push]` tillför bevisligen ingenting för en ENSAM landning | verifierad | EO | run `34243465042`/`34243464989` | L9 §1 | S11: skärpt (gäller ensam landning, ej grupplandning — se N05) |
| G11 | Rebase är avstängt på ruleset-nivå (`allowed_merge_methods: ["merge"]`), medvetet, eftersom merge-dedupen kräver riktiga merge-commits (`HEAD^2`) | verifierad | DA | ruleset-mätning | L5 §Undantagen | — |
| G12 | Force-push förekommer regelbundet på öppna, ej köade PR-grenar (5 av 22 PR:er, 23 %), aldrig mot `main` eller en köad gren (`GH006` hindrar det tekniskt) | verifierad (skärpt, n=4→n=22) | EO | `gh api .../issues/2416/timeline` | L5 §Undantagen | S24 (D5): rättad |
| G13 | En köad gren kan inte pushas/uppdateras via `gh` (`GH006`); en `dequeuePullRequest`/`enqueuePullRequest(jump:true)`-GraphQL-mutation är en fungerande men medvetet icke-rutinmässig nödväg | verifierad (skarpt prövad, 11 s) | TF/DA | `docs/research/task-99-dequeue-enqueue-live-test-2026-08-01.md` | (befintligt research-pass) | — |
| G14 | `review-backstopp` fäller mekaniskt på `merge_group`-ytan utan en giltig, färsk Riskbedömnings-sektion; bevisar bara NÄRVARO av sektionen, inte att granskningen ägde rum | verifierad | TF (närvaro)/FA (kvalitet) | `ci.yml:2483-2486`; ADR-105 §beslut2 | L2 §Komponenttabell | — |
| G15 | Review-grinden eskalerar 42 % av rundorna till Marcus (110 av 262), rundtaket (2) passerat 37 gånger, noll kalibreringsposter finns för att mäta grindens egna missar | verifierad | EO | `review-instrumentering.jsonl` | SL | S28: höll på varje tal |
| G16 | D0-klassningen (docs-only) är en positiv allowlist; en ändring i `.claude/settings.json` (hook-mekanismen) klassas ändå som docs-only trots att den kan stoppa varje agent i repot — en känd, medvetet ej undantagen kant | verifierad | DA (känd kant) | `CLAUDE.md` §D0-klassningen | (repo-CLAUDE.md) | — |

### Område 2 — Nätet efter merge (20 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| N01 | Post-merge-klassningen läser bara `github.sha` (pushens topp); ser aldrig `event.before`, `commits[]` eller `HEAD^2` via git | verifierad | FI | `post-merge.yml:228-229`; `classify-post-merge.sh:199,245-261` | KG1 §1a | S18/S30: mekanismen bekräftad, redan diagnostiserad i tråden `T166` (2026-08-21) |
| N02 | Merge-kön kan landa upp till 3 PR:er i en enda push (`max_entries_to_merge: 3`); 87,9 % av 601 pushar var enstaka, 10,1 % två, 2,0 % tre, 0 % fyra+ | verifierad | EO | KG1 §1b (601 pushar) | KG1 | S18: skärpt |
| N03 | 85 av 686 landningar (12,4 %) saknade egen post-merge-svit i ett fönster; av dessa var 69 kodklassade — inte 55, vilket byggde på en klassning via grennamnsprefix | verifierad | EO | KG1 §1d Skärpning1 | KG1 | S18: skärpt |
| N04 | Av de 85 saknade landningarna var bara 60 RIKTIGA hål (topp=docs, spann=kod); resten (13, topp=kod) fick full svit på hela spannet ändå | verifierad (15/15 + 6/6 kontroll) | EO | KG1 §1d Skärpning2 | KG1; SL S30 | S18: skärpt/korrigerad till 60 |
| N05 | Det som gick förlorat i de 60 hålen är SMALARE än "ingen verklig kedja prövad": `CI [push]` klassar hela push-spannet och körde de hermetiska klasserna på det missade trädet; det uteblivna var enbart A11y och Staging (API+E2E) | verifierad (14/14, 10 diskriminerande fall) | EO | KG1 §1d Skärpning3 | KG1; SL S30 | S18: mildrat |
| N06 | Samtliga 60 hål stängdes vid nästa kodlandning; median 0,57 h, medel 1,99 h, längst 33,2 h (ett fall) | verifierad | EO | KG1 §1d | KG1 | — |
| N07 | Fyra separata insatser (`TASK-73`, `TASK-78`, `T166`, `TASK-334`) har rört samma post-merge-klassningsyta utan att stänga flerposts-luckan; `T166` (2026-08-21) hade redan rätt diagnos och tre vägval men ingen kodfix, `lifecycle: paused` | verifierad | DA/FI | KG1 §1c | L4 §Korrigeringskedja2 | S30: orkestreraren "återupptäckte" `T166` |
| N08 | `TASK-365` (öppet, `priority: high`) beskriver en FELAKTIG mekanism (`concurrency`-avbrott) som `post-merge.yml:181-183` (grupp per commit-SHA) falsifierar; kortet och `T166` refererar inte varandra | verifierad | DA (felaktig) | KG1 §1c | KG1 | AVGJORD i S18, skärpt i S30 |
| N09 | Nattnätet: 51 av 52 schemalagda körningar röda sedan 2026-07-28 (98 %); enda gröna natten 2026-07-29; obruten ström av 50 röda nätter | verifierad | EO | `gh run list --workflow nightly.yml`, 2026-09-17 | L6 §Kort svar | S7: skärpt (spretande tal 21/40/"minst 49" i tre underlag); KG3 M1 avgjorde mot J8.7:s 78 % |
| N10 | Ett PRODUKTSKYDDANDE jobb var rött 25 av 52 nätter (48 %) — staging 15, kontraktsvakten 9 (varav 6 i rad 08-22→08-27), a11y 3, acceptance 1; "rött av processgrindar" gäller de TVÅ mätta nätterna, inte hela perioden | verifierad (56 nätter jobb-för-jobb + orkestrerarens egen dubbelkontroll) | EO | KG1 §4a-4b; `gh api .../actions/runs/32682955266`, `/32208177054` | KG1 | S12: generaliseringen FÖLL; SL S30 |
| N11 | Nattlarmets `alarm`-jobb saknar dedup (skapar nytt ärende varje röd natt); syskonjobben `links-arende` och `nightly-watchdog.yml` har redan dedup-mönstret | verifierad | FI (avsaknad) | `nightly.yml:225` (har dedup) mot `:863` (saknar) | L2 §Komponenttabell | S19: höll |
| N12 | 21 öppna, obesvarade `ci-natt`-ärenden i rad (63 totalt); 207 `ci-post-merge`-ärenden totalt, 0 öppna, men 16 senaste obesvarade 233–258 h innan de stängdes i klump 2026-09-17 | verifierad | EO | `gh api search/issues` | SL | S7/S18; KG3 M2 rättade J8.4:s felräkning ("60 totalt") |
| N13 | Kontraktsvakten bevakar 7 av 18 mockade Edge Functions; egen kod påstår "alla sju bevakas" som om sju vore hela ytan | verifierad (3 oberoende mätningar) | DA (blivit falsk) | `kontraktsfall.ts:25-26` mot `handlers.ts` (18 mockar) | L2, L7, L8 | S10: höll |
| N14 | Kontraktsvakten var röd 6 nätter i rad (2026-08-22→08-27) osedd, eftersom den delade lampa med bokföringsgrindar | verifierad | EO | KG1 §4b | KG1 | — |
| N15 | `TASK-239` AC#3 ("3 gröna nätter i rad") kan inte bockas trots 31 raka gröna Acceptance-nätter (2026-08-17→09-16), eftersom workflow-nivåns `conclusion` var `failure` alla 32 nätter | verifierad | EO | KG1 §4c | KG1 | — |
| N16 | Ingen mekanism upptäcker att `main` faktiskt når produktion; prod-frontend stod stale ≥20 h innan en människa märkte det (`TASK-199`, öppet sedan 2026-08-11, `priority: high`) | verifierad | FI (avsaknad) | `backlog/tasks/task-199` | L2, L3, L9 | S6: höll |
| N17 | En `vercel rollback` stänger av automatisk produktions-tilldelning för nya `main`-pushar tills man aktivt promotar tillbaka (`vercel promote`) | verifierad | DA (Vercels plattformsregel) | vercel.com/docs/instant-rollback (citerat ordagrant) | KG2 §A2 | S22: höll, besvarar S8 |
| N18 | En kommandoväg för frontend-rollback FINNS (`vercel rollback`, `vercel promote`, REST `projects.requestRollback`) — ett tidigare underlags "ingen kommandoväg" var fel; vägen har dock aldrig körts eller dokumenterats i en runbook hos oss | verifierad (föll delvis) | DA/FI | vercel.com/docs/cli/rollback | KG2 §A2 | S8: föll delvis |
| N19 | Föreslagen ordning för nätets fyra fynd: dela larmet i produkt-/bokföringskanal FÖRST (störst signalvinst, oberoende); post-merge-fixen NÄST; dedup-frågan RÖRS INTE förrän efter — annars förlorar de 60 hålen sitt sista nät | verifierad (ordningslogik), rekommendation | DA | KG1 §Kort svar (ordningstabell) | KG1 | — |
| N20 | Täckningsluckan sedd LIVE under granskningen (2026-09-17): en grupplandning av tre PR:er satte en textändring (denna gransknings egen födelse-PR, `#2496`) överst på en kodfix (`#2500`); landningscommiten `0c8d3edc` fick bara `CI [merge_group]`, toppens efterkontroll blev grön med sviten `skipped`, och toppens `CI [push]` körde HELA den hermetiska sviten trots att toppen själv var text | verifierad, mätt live | EO | `gh run list --commit 0c8d3edc…`; `gh api .../actions/runs/35216597781/jobs`, `/35216597754/jobs`, 2026-09-17 11:37–11:39Z | SL S31 | S31 (ny post): KG1 höll på varje punkt; S11:s "`CI [push]` tillför ingenting" FÖLL för grupplandningar (gäller bara ensamma landningar) |

### Område 3 — Testnivåerna och hermetiken (18 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| H01 | PR-grinden bärs av tre hermetiska/mutexfria jobb (Pure+Build, Acceptance, Webbläsarbeteende); Staging (API+E2E) och A11y är flyttade till post-merge/natt sedan `TASK-70.3` | verifierad | FI | `ci.yml:2271-2272` (`run_staging:false`, `run_a11y:false` utan `if:`) | L8 §CI-koppling | S1: höll |
| H02 | Fyra av `ci-suite.yml`:s åtta jobb (`purge`, `a11y`, `test-staging`, `purge-efter`) körs ALDRIG på PR- eller kö-ytan | verifierad | FI | `ci-suite.yml:96,707,762,938` | L2, L8 | S1: höll |
| H03 | Testpyramiden i tal (2026-09-17): `api-pure` 80/1786, `acceptance` 61/524, `webblasarbeteende` 17/109, `a11y` 17/118, `api-staging` 63/529, `e2e` 34/304, kontraktsvakt 10, visuell 29×2/322 | verifierad | EO | `npx playwright test --list` per projekt | L8 §Testpyramiden | — |
| H04 | Tre styrande dokument (`CONTRIBUTING.md:1074`, `acceptance-urval.sh:12`, ADR-080) påstår fortfarande "18 spec-filer" för acceptance-klassen; verkligheten är 61 filer/524 tester | verifierad | DA (blivit falsk genom tillväxt) | `grep -n "18 spec-filer" CONTRIBUTING.md` (bekräftat "alla 18 spec-filer") | L8 §Testpyramiden | S16: höll |
| H05 | Endast 2 av 34 `tests/e2e/`-filer gör ett verkligt, browser-drivet anrop mot en riktig Edge Function utan mock; 27 filer mockar 3–33 anrop var trots namnet "e2e" | verifierad | FI | `grep page.route`, läsning av filhuvuden | L8 §Kort svar | S16-mönstret |
| H06 | `send-action-email` (bekräftelse, påminnelse, eventinfo) har noll test genom den verkliga kedjan mot Resend/Airtable på någon nivå; det egna testet säger "NOLL riktig Resend/Airtable" | verifierad | FI (avsaknad) | `tests/api/send-action-email.test.ts` (1 275 rader, eget huvud) | L8, L9 P4 | S16: höll |
| H07 | Acceptance-klassen växte 98 % på två veckor (233→461 tester i september), orsakade två mätta kö-fällningar (PR `#2209`, 2026-09-02) mot 12-minuterstaket; åtgärden blev 3-vägs sharding, inte en gräns för tillväxten | verifierad | EO | `ci-suite.yml:302-351` | L8 §Kort svar | — |
| H08 | Hermetik-självtestet kör alla 524 tester i EN process (13,7 min); klassen den speglar kör samma 524 delade i tre processer (5,5 min); `TASK-366` (High, 2026-09-02) föreslår delning men taket höjdes 12→20 min istället | verifierad | FI | `ci-suite.yml:516-593` mot `:366-372` | L9 §D3 | S25: skärpt ("av misstag" höll inte) |
| H09 | Självtestets domlogik (`bedomPositivt`) avvisar en tom testmängd; en delning i tre skulle kräva att domarna slås ihop över skärvorna — en designfråga, inte en flagga | starkt indikerad | DA | `08-...` §Osäkerheter | L9 | S25-förbehåll |
| H10 | FROZEN_NOW-läckan i den hermetiska miljön bevisades LIVE under granskningen: testet fallerade med `OmockadRequestError` mot en riktig endpoint 2026-09-17T10:06Z | verifierad, mätt live | EO | kommando+utskrift i filen | L8 §Jobb7 | — |
| H11 | En falsifierad motivering för `retries: 2` i `playwright.config.ts` skrivs ut öppet i stället för att tystas | verifierad | DA (ärlighet) | `playwright.config.ts:~240` | L6 §Det här gör vi starkt p.6 | — |
| H12 | Kontraktsvaktens täckningslucka (7/18) är en NÖDVÄNDIG konsekvens av att Airtable inte kan köras lokalt (K7); täckningsGRADEN och kommentarens felaktighet är SJÄLVVALDA, inte en plattformsvägg | verifierad | FI | L7 §K17 | L7 | S10 (fördjupad) |
| H13 | Nio dubbleringar identifierade (D1–D9) i testarkitekturen; fyra behålls (D5,D7,D8, skyddet i D3), tre rivs (D1:s tredje körning, D2, D9), två flyttas/delas (D4,D6), en behålls men kostnadssänks (D3) | verifierad (syntes) | DA/FI | L9 §Del2 | L9 | syntes av S11,S18,S20 |
| H14 | 34 582 rader (32 % av CI-ytan) är testsviter för 27 grindvakters EGEN logik; INTE ren redundans — det är den enda motmedicinen mot en tyst vakt | verifierad | DA | L9 §D5 | L9 | — |
| H15 | 24 av 135 Edge Functions-filer typkontrolleras via en Node-genväg (`tsconfig.edge-shared.json`); `deno check`/`deno lint` är inte inkopplat någonstans trots `ADR-010`s löfte sedan maj 2026 | verifierad | DA (obetalt löfte) | `grep -rn "deno check"` (noll träffar) | L2, L3 | S13: höll |
| H16 | Skrivvägen mot Airtable saknar 429-omförsök (`withAirtable429Retry` bara i tre läsfunktioner: rad 121,196,241); sex skrivfunktioner (266,308,353,411,448,497) saknar det, ingen dokumenterad orsak | verifierad | FI (avsaknad) | `airtable-client.ts` | L2, L3, L7, L9 P7 | S9: höll |
| H17 | Visuell regressionstestning (29×2 filer, 322 tester) är byggd men PR-grinden medvetet INAKTIV (tråd `T87`); körs bara lokalt eller via manuell dispatch | verifierad | DA | L8 §Testpyramiden | L8 | — |
| H18 | WebSocket/Realtime-mockningen för betalningsinkorgen är dokumenterat trasig sedan minst 2026-09-06 utan lösning på `main`; noll hermetisk täckning för realtidsuppdateringen | verifierad | FI (avsaknad) | `CLAUDE.md` (gren `task/409` nämnd) | L8 §Risker | — |

### Område 4 — Airtable (14 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| A01 | Airtable PAT saknar tabell-/fältnivå-behörighet; hela skrivsäkerheten vilar på EN kodfil (`field-allowlists.ts`, 13 operationer) utan plattforms-backstop | verifierad | TF/FI | L7 §K1 | L7 | — |
| A02 | Airtables rate limit är 5 anrop/s PER BAS, delat av alla samtidiga klienter; kompenseras med global mutex+semafor+serialiserad staging-svit | verifierad | TF | `airtable.com/developers/web/api/rate-limits` | L7 §K3 | — |
| A03 | En ANNAN, tidigare obokförd gräns finns: 50 req/s delat över ALLA tokens från samma användare/servicekonto, oavsett bas | starkt indikerad (ny risk-yta, ej utredd om kontona delas) | TF | KG2 §A3 (Airtables dokumentation citerad i sin helhet) | KG2 | helt nytt fynd |
| A04 | Ingen per-körnings-kopia av Airtable-basen är möjlig (ingen bas-duplicering via API, ingen radering utan Enterprise); kompenseras med en global mutex och EN delad staging-bas | verifierad | TF | `airtable-constraints.md` P26 | L7 §K6 | — |
| A05 | Betalningsdomänen flyttade till Postgres (`ADR-128`, 2026-08-30) men körs ändå i SAMMA delade, mutex-skyddade staging-Supabase som Airtable-testerna trots att Postgres kan köras lokalt i container | verifierad | FI (självvald) | L7 §K7b | L7 | — |
| A06 | En direkt felaktighet hittades i den befintliga väggkatalogen: den säger att PAT-servern är blind för vyer; en live-fråga gav en fullständig vylista tillbaka | verifierad | FI (dokumentationsfel) | `mcp__airtable__describe_table`, 2026-09-17 | L7 §Kort svar p.4 | — |
| A07 | Airtable-kostnaden i CI ligger nästan uteslutande i efterhandsverifiering (post-merge/natt); en vanlig PR betalar noll eftersom `run_staging: false` skickas ovillkorligt | verifierad | FI | `ci.yml:2271` | L7 §Kort svar | — |
| A08 | Sentinel-drift på en delad, permanent testrad (L599-klassen) har inträffat tre gånger, senast 2026-09-07; purgen känner bara HELA RADER, inte fältvärde-mutation på en aldrig-raderad rad | verifierad | FI (avsaknad av motmedel) | `tasks/lessons/vol-08.md` L599; `#2447` | L9 §P8 | — |
| A09 | Kallstart måste hämta varje flik sekventiellt under det delade 5 req/s-taket (P31); kompenseras med en blockerande startvärmningsskärm (`ADR-112`) | verifierad | TF | L7 §K16 | L7 | — |
| A10 | Automation-körningar i Airtable kan rapportera "lyckades" trots ett tyst uteblivet delresultat (P16); vår kod verifierar sidoeffekten direkt i stället för att lita på run-status | verifierad | TF | L7 §K15 | L7 | — |
| A11 | Airtable har inget schema-as-code och ingen migrations-mekanism (P25); schemaförändringar verifieras manuellt, point-in-time | verifierad | TF | L7 §K14 | L7 | — |
| A12 | Provspecifikationerna A–D (atomicitet i batch-skrivningar, om 10-postersgränsen är defensiv eller hård) är MEDVETET EJ utförda — beslutsunderlag åt Marcus | ej verifierbar (avsiktligt) | EV | L7 §Provspecifikationer | L7 | — |
| A13 | Kompromissregistret (17 poster, K1–K17) klassar varje kompromiss som NÖDVÄNDIG (plattformsvägg) eller SJÄLVVALD; flera "nödvändiga" rotorsaker (K6,K7,K10,K11,K13,K17) har en SJÄLVVALD implementations-/täckningsdel som kan förbättras utan Fas E | verifierad (syntes) | DA | L7 §Kompromissregistret | L7 | — |
| A14 | `airtable-constraints.md` (31 poster) och `data-model.md` §Kända fällor är redan grundligt katalogiserade och ADR-belagda (`ADR-063` §S91-not); katalogen stämmer fortfarande för de tre kärnväggarna | verifierad | DA | L7 §Kort svar | L7 | bekräftelse, ej nytt fynd |

### Område 5 — Branch-/pushflödet (16 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| B01 | En enda mekanisk grind (ruleset) plus två lokala git-hookar (katalogsägarskap, push-spärr under `iteration`-läge, `ADR-097` 2026-08-07); allt annat i flödet är regel/praxis, inte teknik | verifierad | TF (de tre)/FA (resten) | L5 §Kort svar | L5 | — |
| B02 | Kadens: ~29 sammanslagna PR:er/dag, median 22 min öppning→landning, median 5 filer/214 rader, 66 % (80/121) av grenarna fick exakt EN CI-körning | verifierad | EO | L5 §Kort svar | L5 | — |
| B03 | "Commit gratis, push kostar" (`ADR-097`) är dubbelt bärad: skriven regel OCH teknisk spärr; två sessionsdokument visar spärren fälla skarpt | verifierad | TF+DA | ADR-097 | L5 §Kort svar | — |
| B04 | Grennamngivning har INGEN regel: 15 olika prefix plus "inget prefix" över 500 landade grenar; inget läser prefixet mekaniskt | verifierad | FA (avsaknad) | L5 §Kort svar | L5 | — |
| B05 | En gren med 40 lokala commits har passerat fem sessioners avslut utan beslut om sitt öde (16+ dagar); ingenting tvingar fram beslutet | verifierad | FI (avsaknad) | L5 §Push-kadens fråga 6 | L5 | — |
| B06 | Force-push på 5 av 22 mätta PR:er (23 %), koncentrerat till aktivt itererande arbete (t.ex. `#2416`: tre force-push under en kväll) — rättat från ett tidigare stickprov (n=4, 0 träffar) | verifierad (skärpt) | EO | `gh api .../issues/<nr>/timeline` | L5 §Avstämning | S24 (D5): rättad slutsats |
| B07 | `core.hooksPath`-buggen (`T121`) triggas vid VARJE `git worktree add`; mildringen är en självläkande vakt vid nästa commit, ingen egen lösning finns (extern, opatchbar bugg) | verifierad | TF (extern bugg) | `anthropics/claude-code` `#27474`,`#66993`,`#72714` | L4 §Korrigeringskedja1; agentkontraktet | — |
| B08 | Gren-städning (`stada-grenar.sh`) fanns manuellt sedan 2026-08-07, blev AUTOMATISK 2026-08-28 — FYRA DAGAR EFTER att `CLAUDE.md` kallade den "flaggad men INTE byggd" | verifierad (skärpt) | DA (blivit falsk) | commit `b9dac6a0` (`TASK-323`) | L5 §Motsägelse | S17: skärpt (tidslinjen var omvänd, sakinnehållet rätt) |
| B09 | Automatiken för gren-städning körs bara MEDAN en sessions heartbeat-monitor är aktiv; en semestervecka utan sessioner lät 57 lokala grenar hopa sig ändå | verifierad | FI (gräns) | S125:s mätning vid sessionsstart | L5 §Riskerna p.5 | — |
| B10 | Worktree-isoleringens gräns går vid EGET repos huvudkatalog (Bash-git), inte vid cross-repo; en isolerad agent kan läsa (Read) men inte köra Bash-git mot huvudkatalogen, och kan committa fritt i ett FRÄMMANDE repo | verifierad (mätt cell för cell) | TF (harnesset) | `CLAUDE.md` §Worktree-isoleringens gräns | (repo-CLAUDE.md) | S97 (befintlig, ej ny i denna granskning) |
| B11 | `git pull` tillåts av repots egna permissions trots att global `CLAUDE.md` säger "Kör ALDRIG blint `git pull`" — ingen sakmotsägelse (tillåtelse ≠ rekommendation), men en risk för feltolkning | verifierad | DA (två nivåer) | L5 §Undantagen | L5 | — |
| B12 | En köad gren kan inte pushas via `gh` (`GH006`); `dequeuePullRequest`/`enqueuePullRequest(jump:true)` via GraphQL är en fungerande, medvetet ej-rutinmässig nödväg | verifierad | TF+DA | `docs/research/task-99-...` | (befintligt pass) | — |
| B13 | `CODEOWNERS` (fyra rader, alla pekar på Marcus) har i praktiken NOLL urskiljande effekt eftersom `required_approving_review_count: 0` | verifierad | DA (verkningslös) | ruleset-mätning | L2 §Föräldralösa delar | — |
| B14 | `ADR-073`:s `check-merge-tree.sh`-grind används i dag bara i en smal, Marcus-beordrad batch-kontext; ad hoc-parallellitet UTANFÖR den har inget FÖREBYGGANDE skydd (bara UPPTÄCKT via merge queue/review-agent) | verifierad | FI (smal räckvidd) | L5 §Riskerna p.1 | L5 | störst risk utan mekanisk motvikt i pushflödet |
| B15 | Dependabot-PR:er följer samma ruleset som allt annat (3 av 500 mätta PR:er, 0,6 %); ingen separat auto-merge-genväg | verifierad | TF | L5 §Undantagen | L5 | — |
| B16 | Rebase avstängt (`allowed_merge_methods: ["merge"]`) eftersom merge-dedupen kräver riktiga merge-commits (`HEAD^2`) — samma faktum som G11, taget upp här ur pushflödesperspektiv | verifierad | DA | ruleset-mätning | L5 §Undantagen | — |

### Område 6 — Tid och kostnad (16 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| K01 | En kodändring väntar ~25 min ren maskintid före landning (12,5+12,5 min i sekvens); +12,5 min för `CI [push]` (tillför bevisligen noll för en ENSAM landning) + 16,0 min median efterkontroll | verifierad | EO | L9 §1 tabell | L9 | S11 (fyrdubbling) |
| K02 | 92–98 % av väntan på PR-ytan är ETT jobb: hermetik-självtestet (12,8–13,7 av 13,6–14,0 min, 3 av 3 körningar) | verifierad | EO | L9 §1 | L9 | S25: skärpt |
| K03 | Repot är PUBLIKT (inte privat, ett tidigare antagande); GitHub fakturerar aldrig Actions-minuter för publika repon: augusti 2026 = 76 080 min, nettokostnad 0 kr | verifierad | DA+EO | `gh repo view --json visibility`; `gh api organizations/.../billing` | L9 §Kort svar | S14: J8.7 höll, ORKESTRERAREN föll (aldrig mätt premiss) |
| K04 | Enterprise Cloud-planen (~11–21 USD/mån) krävdes INTE för merge queue/rulesets på detta PUBLIKA org-ägda repo — GitHub ger det på vilken plan som helst; Enterprise krävs bara för PRIVATA repon | verifierad | DA (GitHubs källkod) | `gh api repos/github/docs/contents/.../merge-queue.md` | KG2 §A1 | S21/KG2: höll, skärpt |
| K05 | Den enda verifierade fördelen Enterprise faktiskt ger (oavsett synlighet) är ett samtidighetstak på 500 CI-jobb (mot 20/40/60); INTE bevisat att det någonsin utnyttjats hos oss | starkt indikerad (ej faktisk flaskhals) | EV | `docs.github.com/.../limits` | KG2 §A5 | — |
| K06 | Merge-dedupen (100 % villkorad träffrekvens) sparar ~1,7 ggr/dygn en hermetisk svit (~12,5 min); en förbättrad fråga skulle kunna spara ytterligare ~225 körningar/19 dagar (~47 h) — men vinsten är runner-samtidighet, INTE pengar eller ledtid | verifierad | EO | KG1 §2c | KG1 | S20 skärpt ytterligare |
| K07 | CI-relaterade PR:er: 506 av 2 251 landade (22,5 %), stabilt 15–30 %/vecka utan trend över 7 veckor; `ci.yml` ensam ändras 7,5 ggr/vecka i snart fyra månader utan avtagande | verifierad | EO | L4 §Kort svar | L4, L9 M1 | — |
| K08 | ~40 % av det substantiella CI-arbetet (en delmängd på ~45–50 PR:er) är korrigering av tidigare CI-ändring; fem ytor fixade 3–4 gånger var på sju veckor | starkt indikerad (ej hela populationen kategoriserad) | DA | L4 §Andelar (uttrycklig metodnot) | L4 | — |
| K09 | 34 % av grenarna (41/121) fick mer än en CI-körning (en gren fick 14 körningar på 5 h 46 min); 48 % av avbrutna körningar (15/31 i stickprov) utvärderade aldrig något | verifierad | EO | L9 §1 | L9 | — |
| K10 | 0 av 100 mätta körningar var bevisat flakiga; 15 av 100 röda, varav 13 en känd säkerhetsvarning och 4 en känd klockbugg | verifierad | EO | L9 §1 | L9 | — |
| K11 | Sju av fjorton produktionsincidenter hittades av Marcus i appen, inte av något test; alla utom en var designval inget generiskt test hade kunnat förutse | verifierad | EO | j8-1 incidentregister | L9 §2 | — |
| K12 | Grindarna har bevisligen stoppat: ett skadligt npm-paket (maj 2026), fyra säkerhetsvarningar, en röd PR mergad och lagad samma dag (2026-07-23), 151 kvarliggande testevent i Lottas eventväljare | verifierad | EO | j8-1; ADR-076 §Korrigering | L9 §2 | — |
| K13 | Jämförelsen med "proffs som kör direkt-PR" mäter fel storhet: en direkt-PR-utvecklare är författare till sin egen kod med mänsklig förståelse i loopen; här är författaren en agent med färsk kontext som aldrig ser konsekvensen | verifierad (bedömning) | DA | L9 §Det kontrafaktiska | L9 | central till svaret på Marcus fråga |
| K14 | DORA:s Change Lead Time (öppnad PR→landad): median 28,9 min (kod 40,5, dok 9,4) — två tiopotenser under DORA:s högsta kategori; DORA:s forskning säger hastighet och stabilitet KORRELERAR, inte är en avvägning | verifierad | DA (DORAs forskning)+EO (vårt tal) | dora.dev/guides/dora-metrics | L6 §14.3 | — |
| K15 | Marcus upplevelse av "lång ledtid" är KORREKT och UNDERSKATTAD mätt mot RAW maskinväntan per ändring (~13–25 min oavsett storlek), men INTE ett DORA-ledtidsproblem — två måttstockar, inte en motsägelse | verifierad (bedömning) | DA | L6 §14.3-14.4; L9 §Del5.1 | L6, L9 | central spänning, se §Kvarstående motsägelser M-D |
| K16 | Overheaden delas i tre "högar": A (nödvändig kärna, rätt byggd i rätt tid), B (betalar sig men sitter fel — självtest, `CI[push]`, `audit` på docs, dedup), C (ren processbokföring som växer med sessionsantalet, byggd för tidigt) | verifierad (bedömning) | DA | L6 §14.4; L9 §Domen | L6, L9 | — |

### Område 7 — Underhåll och återanvändning (15 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| U01 | CI-/grindvaktsytan omfattar 367 inventerade poster (337 filer, 9 aggregerade testkatalogposter, 21 externa/plugin-poster); 74 182 rader i `scripts/` (186 filer) | verifierad | EO | fullständighetsbevis (a)=(b)=0 | L2 §Kort svar | — |
| U02 | CI-/grindvaktsytan mot produktkod: ≈106 900 mot ≈112 400 rader (kvot ≈0,95:1); talet är MÄTT men OJÄMFÖRBART — inget publicerat jämförelsetal hittades | verifierad (mätning) / ej verifierbar (jämförelse) | EO/EV | j8-8 egen `wc`-mätning | L9 §M1; KG3 §Kanoniska tal | — |
| U03 | `ADR-131` (Accepted 2026-09-04) beslutar att riva backlog-stängningsgrind-familjen men är INTE verkställd; skripten finns oförändrade, `## Updates: Inga än`; två PR:er städade fortfarande dess kort 13 dagar efter beslutet | verifierad | DA (beslutat, ej genomfört) | `ADR-131` rad 3, 170–172, 295–297 | (ADR) | S15: höll |
| U04 | Backlog-stängningsgrinden är STÖRSTA bidragsgivaren till nattnätets rödhet (44 av 56 nätter); en verkställd rivning/brytdag skulle krympa nattnäts-problemet innan larmuppdelningen behövs | verifierad | EO | KG1 §4a | KG1 | S15 kopplat till S12/KG1 fynd4 |
| U05 | En kopierad grindvakt (av flera repon i organisationen) har redan glidit i ett faktiskt policyvärde efter mindre än sex veckor; ingen ytterligare spridning har skett | verifierad | EO | L9 §Del4 | L9, L10 | — |
| U06 | Av 27 mekaniska grindar: ~10 generella (portabla), ~6 produktbundna, ~11 bundna till ARBETSSÄTTET (redan hemmahörande i marcus-system-pluginet) | verifierad (klassning) | DA | L10 §Kort svar | L10 | — |
| U07 | Ett CI-kit bör INTE byggas nu: organisationen har fyra repon, exakt ETT har CI av denna klass; det andra CI-bärande repot är en kopia av Försäkringskassans publika designsystem, inte ett eget projekt | verifierad | DA (bedömning) | `gh repo list`, 2026-09-17 | L10 §Kort svar | — |
| U08 | Leverabel 10 listar merge-dedupen som en av "tre trasiga delar" som gör ett kit farligt nu, med hänvisning till en S20-baserad "3 av 20 (15 %)"-formulering — denna karakterisering är SUPERSEDERAD av KG1/S30 (dedupen fungerar, 100 % villkorad träffrekvens) | osäker (motsägs av KG1, ej rättat i filen vid min läsning) | DA | L10 §Kort svar | L10 | se §Kvarstående motsägelser M-C |
| U09 | Åtta av tjugo stickprovade komponenter är processpecifika (bundna till arbetssättet, inte produkten) — en växande del löser problem arbetsformen själv skapat | verifierad | DA (klassning) | L9 §Del5 argumenttabell | L9 | — |
| U10 | Minsta säkra läsmängd för att förstå CI-helheten är ≈5 900 rader, spridda över fyra ojämnt underhållna ytor plus ~30 ADR:er; ingen enskild fil beskriver helheten | starkt indikerad | DA | j8-8 §4 | L9 §M3 | — |
| U11 | `CLAUDE.md`:s CI-avsnitt utgör ~80 % av filens vikt och laddas i varje FÄRSK agent-session (~1 589 spawns på 51 dagar); kostnaden betalas oavsett om uppgiften kräver den | starkt indikerad (ej tokeniserad) | DA | j8-8 §4 | L9 §M5 | — |
| U12 | Billigaste steg som inte är bortkastat även om utlyftet aldrig sker: parametrisera 14 skripts hårdkodade sökvägar till en config-fil (~20 rader) — gör "config-driven" sant i stället för ungefär sant | verifierad (rekommendation) | DA | L10 §Fynd10 steg2 | L10 | rekommendation |
| U13 | Fem agent-hookar har en REDAN EXISTERANDE andra kund (pluginet laddas i alla 13+ övriga repon); lyft dem är enda centraliseringen med en kund i dag | verifierad (rekommendation) | DA | L10 §Fynd10 steg3 | L10 | rekommendation |
| U14 | Ett organisations-ruleset skulle träffa ALLA repon i organisationen, inklusive två som saknar CI som rapporterar checken — skulle blockera VARJE PR där; störst fälla i migrationsplanen, ej löst | verifierad (risk) / ej verifierbar (målmekanik) | EV | L10 §Risker | L10 | varning |
| U15 | Villkoret för att lyfta ut ett CI-kit kräver ALLA TRE samtidigt: ett andra produktrepo landat kod i 2+ veckor, nattnätet grönt/läsbart rött i 2 veckor, de sex mogna komponenterna orörda — inget uppfyllt i dag | verifierad | DA (öppen startbedömning) | L10 §Fynd11 SENARE | L10 | — |

### Område 8 — Branschjämförelsen (15 rader)

| ID | Påstående | Märkning | Sanning | Evidens | Var det står | Stickprov |
|---|---|---|---|---|---|---|
| J01 | 13-dimensionsbedömningen: merge-grindens yttre ram, PR-storlek, required checks, flakighet, återanvändbarhet, review-grindens backstopp bedöms "i nivå med" eller "före" Google/Kubernetes/Next.js/Chromium | verifierad (bedömning) | DA | L6 §Sammanfattande tabell | L6 | — |
| J02 | Testurval/hermetiska tester bedöms "före" i FORM men "efter"/"överbyggt" i VILLKOR/KOSTNAD; realistisk E2E, nattliga kontroller, observability/rollback bedöms "efter branschen" | verifierad (bedömning) | DA | L6 §Sammanfattande tabell | L6 | — |
| J03 | Median PR-storlek (214 rader/22 min över 300 PR:er) är exakt det motmedel branschforskningen 2025 pekar ut mot riskerna med AI-assisterad utveckling | verifierad | DA (citat)+EO (vårt tal) | L6 §Det här gör vi starkt p.2 | L6 | — |
| J04 | Google/Chromium/Kubernetes löser svarsloopen med en roterande "sheriff"/"build cop" som kräver flera personer; mindre projekt (Drake, ROS 2) löser samma FUNKTION utan organisation | starkt indikerad (ROS 2 ej original) | DA | L6 §Det här bör förbättras p.3 | L6 | — |
| J05 | Branschens mest avancerade mekanismer (ML-testurval, kanarie i trafikprocent, beroendegrafverktyg, TestGrid) bedöms uttryckligen INTE värda att kopiera — förutsätter en skala vi aldrig når | verifierad (bedömning) | DA | L6 §Det här ska vi INTE kopiera | L6 | — |
| J06 | 37signals/DHH:s åtgärd (flytta CI till egen dator) är MÄTT FEL för oss: 910,7 s lokalt mot 401,0 s i CI, belastning 269 på 16 kärnor, molnminuter redan gratis | verifierad | EO | S14; `verify-ci-parity`-mätning | L6 §Det här ska vi INTE kopiera | — |
| J07 | Av sju historiskt funna hål i CI-arkitekturen: ETT hittades av en maskin, två av incidenter, fyra av manuell granskning — genomlysningar hittar hål, inte fler vakter | starkt indikerad | DA | j8-5 F10 | L6 §Det här ska vi INTE kopiera | — |
| J08 | Meta RADAR (publicerad, blockerande AI-granskning i produktion) är etablerad praxis liknande vår; vår backstopp i kön är sällsyntare (deterministisk mekanisk spärr, inte bara AI) | starkt indikerad (endast abstraktet) | DA | L6 §13, §Osäkerheter | L6 | — |
| J09 | "Proffsen kör direkt-PR, alltså kan vi grinda lättare" saknar en premiss: proffsen har en människa som läser varje ändring; vi har ~2 200 PR:er på fyra månader utan mänskligt godkännande per PR — ingen källa säger att agentskriven kod ska grindas lättare | verifierad | DA | L6 §Det här ska vi INTE kopiera, §14.2 | L6 | S27 (talet rättat, se J15) |
| J10 | Precedent-rymden är uttryckligen deklarerad tunn på åtta punkter: kvoten CI:produktkod, andel CI-PR:er, skalkombinationen, en ensam ägares nattnäts-svar, DORA:s exakta trösklar, Vercel-rollbackens bieffekt, mognadstrappa, dosering för ensam ägare+agentflotta | verifierad (öppen deklaration) | EV | L6 §Precedent-rymden var för tunn | L6 | — |
| J11 | Review-grindens 42 % eskaleringsrate är ett UTFALL (en adversariell granskare SKA eskalera), inte en defekt — men en kostnad buren av den enda mänskliga parten, och grindens missrate är omätt (noll kalibreringsposter) | verifierad | DA+EO | L6 §Risker | L6, SL S28 | — |
| J12 | GitHubs regel "any CI weakening is a hard stop" gäller en AGENT-PR som försvagar CI; flera av granskningens egna förslag (ta bort `CI[push]`, villkora `audit`, byta dedupens fråga) är TILL FORMEN just det — kräver Marcus GO, aldrig en agents eget bevåg | verifierad | DA (citerat, `github.blog` 2026-05-07) | L6 §14.2 | L6 | S29 |
| J13 | Trunk-based/DORA:s forskning placerar vår skribentvolym precis vid gränsen där PR-flöde med maskinell verifiering blir produktivt; vår skalkombination (1 person+5–15 agenter) saknar direkt publicerad precedent | starkt indikerad | DA | L6 §14.4; §Precedent-rymden p.3 | L6 | — |
| J14 | Review-grindens deterministiska backstopp i kön är SÄLLSYNTARE än AI-granskaren själv i publicerad praxis; gränsen för vad den bevisar (närvaro, inte kvalitet) är ärligt utskriven | verifierad | DA | L6 §Det här gör vi starkt p.7; ADR-105 §beslut2 | L6 | — |
| J15 | "~2 500 PR:er på fyra månader" citeras i leverabel 6:s "Det här ska vi INTE kopiera"-tabell vid min läsning; det korrekta talet är 2 216 PR:er (2 118 mergade) — slutsatsen om arbetsformens skala påverkas inte, talet bör rättas | verifierad (avvikelse identifierad, ej ännu rättad i filen vid min läsning) | DA (drift) | L6 §Det här ska vi INTE kopiera | L6 | S27; se §Kvarstående motsägelser |

## Gällande tal

KG3:s § Kanoniska tal gäller, med **fyra** rättelser ur stickprovsloggen
(S20, S25, S26, S27) och **ytterligare tre** ur korsgranskningen KG1/S30
(post-merge-luckan, dedupen, nattnätets signal). Kolumnen "Rörlighet" säger
vilka tal som är ögonblicksmätningar som förändras med tiden och bör mätas
om före nästa användning — resten är strukturella fakta (regler,
konfiguration) som inte ändras av sig själva.

| Tal | Gällande värde | Mätfönster/datum | Källa | Rörlighet |
|---|---|---|---|---|
| PR-antal | 2 216 PR:er (2 118 mergade, 16 öppna, 82 stängda utan merge) + 284 ärenden | 2026-09-17, GraphQL mot GitHub | SL S27 | Rörlig — ökar dagligen |
| Merge-dedupens träffkvot | 32 av 32 (100 %) där en träff kan spara något (5,3 % av alla pushar) | 2026-08-20→09-08, 601 pushar | KG1 §2b, SL S30 | Rörlig men strukturellt stabil (villkorad kvot bör hålla så länge mekanismen är oförändrad) |
| Event-listans gräns | Biter vid FÖRSTA event med startdatum januari 2027; prod har i dag 14 val (nov 2025–dec 2026) | 2026-09-17, live-mätning mot prod | SL S26 | Rörlig — förvärras med kalendern, oberoende av CI |
| Post-merge-täckningsluckan | 60 riktiga hål av 601 pushar (topp=docs, spann=kod); median 0,57 h till nästa täckning, längst 33,2 h | 2026-08-20→09-08 | KG1 §1d, SL S30 | Rörlig — beror på kö-storlek och landningstakt |
| Nattnätets signal | 51/52 schemalagda körningar röda (98 %); av dessa hade 25/52 (48 %) ett ÄKTA produktskyddande jobb rött, inte bara processgrindar | 2026-07-28→09-17 | SL S7, S12, S30; KG1 §4a | Rörlig — ändras varje natt |
| `ci-natt`-ärenden | 63 totalt, 21 öppna | 2026-09-17 | SL S7 | Rörlig |
| `ci-post-merge`-ärenden | 207 totalt, 0 öppna (16 senaste obesvarade 233–258 h innan de stängdes 2026-09-17) | 2026-09-17 | SL S18; KG3 M2 | Rörlig (öppna-antalet), stabil (totalt-antalet) |
| Ruleset `main-skydd` | 1 required check, 0 approvals, tom bypass, merge queue `ALLGREEN` max 3, `strict` av | Oförändrat sedan 2026-08-05 | SL S5 | Stabil (konfiguration, ej mätpunkt) |
| Jobb i `ci.yml` | 7 (`changed, lint, audit, suite, docs, review-backstopp, ci-passed`) | 2026-09-17 | KG3 | Stabil tills nästa workflow-ändring |
| Jobb i `ci-suite.yml` | 8 (inkl. `a11y`, som en tidigare sammanfattningstabell tappade) | 2026-09-17 | KG3 M4 | Stabil |
| Edge Functions | 62 individuella kataloger (exkl. `_shared`), 63 totalt, 57 i prod-allowlist | 2026-09-17 | KG3 M3 | Stabil sedan `eeca8c72` (bekräftat: inga commits rör `supabase/functions` sedan `2f11a443`) |
| Filer i `scripts/` | 186 (171 toppnivå + 15 i `lib/`), 74 182 rader | 2026-09-17 | KG3, L2 | Rörlig |
| ADR:er | 131 | 2026-09-17 | KG3 M5 | Rörlig |
| Repots synlighet/kostnad | PUBLIKT, org Enterprise Cloud (1 plats); Actions-minuter gratis på publika repon oavsett plan | augusti 2026: 76 080 min, 0 kr | SL S14; KG2 §A5 | Stabil (plattformsregel) |
| Enterprise-planens faktiska motiv | Köpt för merge queue — men merge queue är gratis på PUBLIKA org-repon oavsett plan; enda styrkta fördelen är samtidighetstak 500 mot 20/40/60, obevisat utnyttjat | 2026-09-17 | SL S21; KG2 §A1, §A5 | Stabil (plattformsregel), Marcus-beslut om planen kvarstår |
| Samma träd testat per kod-landning | 3–4 gånger (PR-yta, kö-yta, `CI[push]`, efterkontroll) för en ENSAM landning; `CI[push]` klassar HELA spannet vid en grupplandning | 2026-08-20→09-08 | SL S11, S30 | Stabil mekanism, rörligt antal beroende på kögruppering |
| Acceptance-självtestet | 12,8–13,7 av 13,6–14,0 min (92–98 % av väntan); taket höjt 12→20 min 2026-09-03; `TASK-366` To Do 15+ dagar senare | 2026-09-17 | SL S25 | Rörlig (växer med testantalet) |
| CI-/grindvaktsyta mot produktkod | ≈0,95:1 (≈1,84:1 med testspec) — MÄTT men OJÄMFÖRBART, inget publicerat jämförelsetal | 2026-09-17 | L9, KG3 | Rörlig, och saknar branschjämförelse strukturellt |

## Påståenden som föll eller skärptes

Varje post: vad som påstods, av vem (agentbeteckning), vad som gäller i
stället, och var rättelsen gjordes.

1. **J8.5** ("dedupen fungerar i praktiken utan verkan, noll träffar på 80
   körningar") → **FÖLL.** SL S11/S20 skärpte till "3 av 20 kod-landningar
   (15 %)"; **KG1/S30 skärpte YTTERLIGARE**: 100 % villkorad träffrekvens
   (32 av 32) — "riv den" är helt uteslutet. Rättat i SL S11, S20, S30 och
   KG1. **INTE ännu synligt korrigerat i leverabel 8, 9 och 10:s egen prosa**
   vid min läsning (se § Kvarstående motsägelser M-C).
2. **J8.7** ("dedupen fungerar, `metrics:ci` visar 25 av 25 träff") → höll i
   RIKTNING men ospecificerad i METOD: vad verktyget faktiskt räknar är
   fortfarande oklart (SL S20 lämnade frågan öppen; KG1 stängde inte den
   specifika frågan, bara den bredare "fungerar dedupen").
3. **SL S18** ("85 av 686 landningar (12,4 %), 55 kod-landningar utan
   post-merge-svit") → **SKÄRPT av KG1/S30**: 69 av 85 var kodklassade (inte
   55, som byggde på grennamnsprefix); bara 60 var RIKTIGA hål (topp=docs,
   spann=kod) — de övriga 13 (topp=kod) fick full svit ändå. Mekanismen
   (klassar bara toppens commit) var redan rätt i S18; KG1 kvantifierar
   exakt.
4. **SL S12** ("nätet bär fel last, inte testsviten — nätet är inte
   trasigt", byggt på nätterna 09-15 och 09-16) → **GENERALISERINGEN FÖLL**
   vid KG1:s fullständiga mätning av 56 nätter: 25 av 52 (48 %) hade ett
   ÄKTA produktskyddande jobb rött. De TVÅ mätta nätterna stämde exakt
   (orkestreraren prövade dubbelt: run `32682955266` och `32208177054`,
   höll) — det var slutsatsen som drogs för brett.
5. **Orkestreraren själv** ("repot är PRIVAT", angiven som källmärkt fakta i
   uppdrag till två agenter) → **FÖLL** (SL S14): premissen var aldrig mätt.
   Rättad i SL S14; följdändringar i J4a:s skalbeskrivning och hela
   kostnadsdimensionen (repot är publikt, gratis).
6. **J1e** ("ingen kommandoväg för frontend-rollback, noll mekanisk rollback
   var som helst i kedjan") → **FÖLL DELVIS** (SL S8, KG2 §A2): en
   kommandoväg finns (`vercel rollback`/`promote`), men den har aldrig
   körts hos oss och har en dold bieffekt (auto-tilldelning stängs av) som
   gör den farligare oövad än känd.
7. **Ett tidigare stickprov** ("force-push strukturellt ovanligt", n=4, 0
   träffar) → **FÖLL** vid bredare mätning (n=22): 5/22 (23 %), koncentrerat
   till aktivt itererande PR:er (SL S24/D5).
8. **J8.8, D9 och orkestreraren själv** ("~2 500 PR:er på fyra månader") →
   **FÖLL** (SL S27, KG3 M6): 2 216 PR:er (2 118 mergade) + 284 ärenden;
   PR:er och ärenden delar nummerserie, det högsta PR-numret (~2 498) lästes
   som ett antal.
9. **`CLAUDE.md`** ("gren-städning flaggad men INTE byggd") → **FÖLL/SKÄRPT**
   (SL S17): manuellt verktyg fanns 16 dagar FÖRE noteringen, automatiken
   kom 4 dagar EFTER — prosan var sann när den skrevs och blev falsk av en
   senare landning ingen synkade.
10. **`tests/kontraktsvakt/kontraktsfall.ts`s egen kommentar** ("alla sju
    bevakas") → **FÖLL genom tillväxt** (SL S10): arton mockar finns i dag,
    sju bevakas; kommentaren var sann vid `TASK-68`, då sju var hela ytan.
11. **`CONTRIBUTING.md`, `acceptance-urval.sh`, `ADR-080`** ("18 spec-filer"
    för acceptance) → **FÖLL genom tillväxt** (SL S16): 61 filer/524 tester.
12. **J1c** (sammanfattningstabell: "7 jobb" i `ci-suite.yml`) →
    **RÄKNEFEL** (KG3 M4): 8 jobb; `a11y` fanns korrekt i löptexten men
    tappades i sammanfattningstabellen.
13. **J2** ("132 ADR:er") → **RÄKNEFEL** (KG3 M5): 131.
14. **J8.4/J8.6** ("60 `ci-post-merge`-ärenden totalt") → **FÖLL** (KG3 M2):
    207 totalt; 60 var bara den `--limit 60`-satta delmängden agenten råkade
    hämta.
15. **Diverse EF-räkningar i olika underlag** (51/61/63/135/57/28) → samtliga
    KORREKTA för sin egen definition (kataloger exkl./inkl. `_shared`,
    `.ts`-filer, prod-allowlist) — KG3 M3 löste förvirringen, inget tal var
    fel i sig.
16. **`T166`** (2026-08-21, tråd, `lifecycle: paused`) hade REDAN rätt
    diagnos om post-merge-flerpost-luckan, men ingen kodfix landade;
    **`TASK-365`** (senare kort) beskrev en delvis felaktig mekanism
    (`concurrency`-avbrott) — de två refererade inte varandra förrän KG1
    kopplade ihop dem 2026-09-17. Samma insikt återupptäcktes tre gånger
    (T166 → TASK-365 → KG1) utan att någon länkade dem.
17. **Leverabel 10** ("tre trasiga delar" — dedupen, post-merge-luckan,
    nattnätet — som skäl att inte bygga ett kit nu, med en S20-baserad
    dedup-karakterisering) → dedup-DELEN av detta påstående är
    **SUPERSEDERAD** av KG1/S30 (dedupen fungerar, ska INTE rivas eller
    ändras förrän efter post-merge-fixen). De andra två delarna (60 hål,
    25/52 röda nätter) STÅR KVAR som riktiga fel, med reviderade tal.
18. **Leverabel 6** (Kort svar: "nattnätets rödhet, av orsaker som NÄSTAN
    ALDRIG är fel i programmet Lotta använder") och **leverabel 9** ("De tre
    tydligaste överflöden" p.3: "Nattkörningens rödhet kommer i praktiken
    HELT från tre pappersgrindar — inte från appen") → **MOTSÄGS** av
    KG1/S30:s 25/52 (48 %)-mätning. Se § Kvarstående motsägelser M-A/M-B —
    detta är INTE bokfört som "föll" eftersom jag inte kan verifiera om
    leverablernas egen text redan rättats när denna fil fryses.
19. **En mät-hygienisk incident i KG1s eget pass** ("orsaken till att en
    push-lista på 1 000 poster skrevs över på disk mitt i passet är inte
    fastställd") → **ORSAKEN ÄR NU FASTSTÄLLD** (SL S30): det var
    orkestreraren själv — en egen fil med samma namn (`ci-push-runs.json`)
    i den delade scratch-katalogen skrev över KG1:s. Orkestrerarens
    scratch-filer bär från och med S30 prefixet `ork-` (och denna agents
    filer prefixet `d12-`, per orkestrerarens instruktion till mig).
20. **Orkestrerarens egen sammanfattning i sessionsdoket** ("merge-dedupen
    träffar aldrig") → **FÖLL** (SL S20): det var S11:s ENA mätta commit
    generaliserad till en absolut regel.
21. **Orkestrerarens tidsangivelser i sessionsdoket** (nämnda i uppdraget som
    en av orkestrerarens egna fel som ska tas med här) — jag har **INTE
    LÄST** sessionsdoket självt (det ligger utanför min läsordning och mitt
    uppdrag pekade mig inte dit), och kan därför inte katalogisera de
    specifika instanserna. Se § Osäkerheter.
22. **SL S11** ("`CI [push]`-körningen tillför ingenting alls") → **FÖLL FÖR
    GRUPPLANDNINGAR** (SL S31, en LIVE-observation 2026-09-17 under
    granskningens egen gång): en grupplandning av tre PR:er satte denna
    gransknings egen text-PR (`#2496`) överst på en kodfix (`#2500`).
    Landningscommiten fick bara `CI [merge_group]`; toppens efterkontroll
    blev grön med sviten hoppad; toppens `CI [push]` körde DÄREMOT hela den
    hermetiska sviten, trots att toppen var text — och var därmed det enda
    som fångade koden under. S11:s slutsats gäller alltså bara en ENSAM
    landning; för en GRUPPLANDNING är `CI [push]` precis det nät KG1:s fynd 1
    beskriver. Se huvudtabellens rad N20.

## Åtkomstluckor

Varje **ej verifierbar**-märkning i granskningen, med exakt vad som krävs
för att fylla den.

1. **Skarpbevis för `TASK-419`s Airtable-prod-lås.** Kräver ett agent-anrop
   med `mcp__airtable__*` mot `app8uGPrVCVOm6LfD` från en session som
   startade EFTER 2026-09-07 (repots egen regel om att en nyregistrerad hook
   inte kan förlitas på i sin egen byggsession).
2. **Supabase Edge Function-loggar för prod** (429-frekvens/latens mot
   Airtable). Kräver åtkomst till Supabase-loggpanelen eller en
   dashboard-export — ingen agent i granskningen hade den åtkomsten.
3. **Om en `ci.yml`-PR som ändrar `needs`-listan missar sin egen granskning
   på kö-ytan** (review-backstopp gäller kö-grenens egen körning, inte
   `origin/main`s). Kräver `gh api repos/{repo}/commits/{sha}/check-runs?
   per_page=100` MED paginering mot en merge-commit vars PR la till ett
   toppnivåjobb (t.ex. `38429d77`, `TASK-395`) — KG1 försökte, men
   fick ett pagineringstrunkerat svar (30 poster).
4. **`supabase/config.toml`s exakta innehåll** (portar, `project_id`). Kräver
   en riktad läsning av filen (≈18 rader) — ingen av de sex kärnunderlagen
   läste den rad för rad.
5. **Om samtliga 44 policy-filer verkligen har exakt EN konsument.**
   Bekräftat för 10 stickprovade par; 34 par overifierade. Kräver en
   fullständig genomgång av varje policy-fils källkod, inte bara filhuvudet.
6. **Merge-köns exakta plankrav** (tillgänglighetsbannerns exakta text).
   Kräver en direkt läsning av `docs.github.com`s "Availability"-banner för
   merge queue-sidan, eller ett prov mot ett Team-plan-organisationskonto.
7. **Om ett publikt repo kan anropa ett annat publikt repos `workflow_call`.**
   Kräver att någon skapar ett testrepo och prövar anropet skarpt — samtliga
   agenter i granskningen är kontrakterade att aldrig skapa nya repon.
8. **Om plugin-hookar faktiskt laddas i repon utan egen
   `.claude/settings.json`.** Kräver en session i ett annat repo (t.ex.
   `video-producer`) där ett `git add -A` provoceras och man observerar om
   plugin-hooken fäller.
9. **`.claude/hook-fallningar.jsonl`s fällningsfrekvens** för samtliga nio
   Bash-matchade `PreToolUse`-hookar. Bekräftat för två (`L588`);
   generaliseringen till alla nio är leverabel 2/5:s egen bedömning, inte
   individuellt provocerad.
10. **Om staging- och prod-Airtable-tokens delar SAMMA användare/servicekonto**
    (relevant för den nyupptäckta 50 req/s-kors-bas-gränsen, A03). Kräver att
    någon med åtkomst till Airtables kontoadministration kontrollerar
    service-kontots ägarskap för båda tokens.
11. **Om `Kvitton`-tabellen i Airtable fortfarande skrivs till** efter
    `ADR-128`s flytt av betalningsdomänen till Postgres, eller om den bara
    ligger kvar orörd. Kräver en riktad kodsökning efter skrivningar mot
    tabellen samt en läsning av dess innehåll i staging.
12. **Granskningsrundornas bidrag till PR-ledtiden, i minuter.**
    Instrumenteringsloggen (`review-instrumentering.jsonl`) finns sedan
    `TASK-173.6`, men mäter fynd/risk/beslut, inte klocktid per runda. Kräver
    antingen en ny loggkolumn (tidsstämpel per rundas start/slut) eller en
    korrelation mot PR:ens egna `gh pr view --json timelineItems`.
13. **Om fler numeriska glidningar finns i styrande text bortom de KG3 och
    denna granskning redan hittat.** KG3 byggde sitt register genom en
    engångsläsning av 14 000+ rader, inte en uttömmande maskinell extraktion
    av varje tal. Kräver ett skript som extraherar alla numeriska påståenden
    ur styrande dokument och jämför dem mot en levande mätning — ett
    möjligt eget forskningspass.
14. **Orkestrerarens tidsangivelser i sessionsdoket** (nämnda i uppdraget
    som en av orkestrerarens egna felkällor att ta med här). Jag har INTE
    läst sessionsdoket `tasks/sessions/...` självt — det ligger utanför min
    läsordning och mitt uppdrag pekade mig inte dit. Kräver en riktad
    läsning av sessionsdokets Del 3 och Del 5 (nämnda i SL S20 som platsen
    en felaktig generalisering skrevs) för att katalogisera de specifika
    instanserna.

## Kvarstående motsägelser mellan dokument

Jämförelse av "Kort svar" och rekommendationerna i leverabel 2–10 parvis, på
punkter där de rör samma sak. De två första (M-A, M-B) är enligt min
bedömning de viktigaste i hela registret, eftersom de sitter i två
leverablers HUVUDDOM och därmed riskerar att propagera en föråldrad
formulering rakt in i huvudrapporten (leverabel 1) om ingen fångar dem
innan den skrivs.

> **Orkestrerarens statusnot, 2026-09-17 efter registrets skrivande:**
> registret fångade det som skulle fångas. **M-A, M-B, M-C och M-F är
> rättade** i leverablerna — M-A och M-F av agenten PUTS (tillägg B5 och B4,
> commit `03a58a3b`), M-B och M-C av orkestreraren efter att ha läst detta
> avsnitt (leverabel 9 "De tre tydligaste överflöden" punkt 3; leverabel 10
> definierar nu ordet "trasig" och återger KG1:s dom "riv den inte"). Prövat
> med `grep` efter de citerade formuleringarna: inga kvar. Texten nedan står
> kvar oförändrad som bokföring av läget vid registrets läsning. **M-D** är
> två måttstockar, inte en motsägelse — huvudrapporten förklarar båda i samma
> andetag. **M-E** är en inkonsekvens i repots egna artefakter och bärs av
> åtgärdsplanen (leverabel 11).

**M-A — Leverabel 6:s huvuddom om nattnätets orsak, motsagd av KG1/S30.**
Leverabel 6 (`05-branschjamforelse.md` §Kort svar) skriver: *"Nattnätet har
varit rött 51 av 52 nätter sedan slutet av juli, av orsaker som **nästan
aldrig är fel i programmet Lotta använder**."* KG1 (§4a–4b) och
stickprovsloggens S30 mätte ALLA 56 nätter jobb för jobb och fann att ett
ÄKTA produktskyddande jobb (staging, kontraktsvakt eller a11y) var rött 25
av 52 nätter (48 %) — knappt hälften, inte "nästan aldrig". Orkestreraren
verifierade två av dessa nätter själv (`gh api .../actions/runs/32682955266`
och `/32208177054`) och fann mätningen korrekt. **Vid min läsning
(2026-09-17, efter PUTS-agentens fyra tidigare rättelser men samma dag S30
landade) stod leverabel 6:s mening OFÖRÄNDRAD.** Detta bör rättas i
leverabel 6 och får INTE ärvas okritiskt av huvudrapporten.

**M-B — Samma motsägelse, i leverabel 9.** `08-risk-redundans-flakighet-tid-
och-kostnad.md` §"De tre tydligaste överflöden" punkt 3 skriver: *"Nattnätets
rödhet kommer i praktiken **helt** från tre pappersgrindar — inte från
appen."* Samma KG1/S30-mätning (25/52, 48 %) motsäger "helt". Leverabel 9:s
egen Riskregister-rad Pr1 (*"nätet är VILLKORET för att presubmiten får hoppa
tester… ett villkor som inte infrias gör hela konstruktionen obevisad"*) är
FÖRENLIG med KG1:s fynd — det är bara sammanfattningsraden i "De tre
tydligaste överflöden" som är för absolut. Samma rättelsebehov som M-A.

**M-C — Leverabel 10:s karakterisering av dedupen som "trasig", motsagd av
KG1.** `09-ci-som-ateranvandbar-djupmodul.md` §Kort svar räknar upp "tre
trasiga delar" av maskinen som skäl att INTE bygga ett CI-kit nu, och
beskriver en av dem så: *"merge-dedupen träffar bara 3 av 20 kod-landningar
(15 %, inte aldrig — rättat efter … S20)."* KG1 (§2, hela avsnittet) fann att
dedupen är fullt fungerande — 100 % villkorad träffrekvens (32 av 32) — och
skriver uttryckligen: *"Riv inte dedupen — inte alls."* Samma äldre
karakterisering finns i leverabel 9 (`08-...` §D2, §Var gränsen går) som en
post i "overhead som kan skäras". **Detta är inte en ren sakmotsägelse om
VAD som bör göras** — KG1 håller med om att dedupens FRÅGA kan förbättras
SENARE (väg A) — utan om HUR ALLVARLIGT problemet är i dag. Att kalla
mekanismen "trasig" i stället för "fungerar, men frågan kunde vara enklare"
är en gradskillnad som påverkar prioritering i åtgärdsplanen (leverabel 11):
KG1 säger uttryckligen att dedup-ändringen kommer SIST, efter
post-merge-fixen, och att den INTE är brådskande.

**M-D — DORA-ledtid mot upplevd väntan: två måttstockar, inte en
motsägelse.** Leverabel 6 (§14.3) skriver att ledtiden mätt med DORA:s
Change Lead Time *"inte är vårt problem"* (median 28,9 min, två tiopotenser
under DORA:s högsta kategori). Leverabel 9 (§Del5.1) skriver att Marcus
upplevelse av lång ledtid är *"korrekt, och underskattad"*. **Min bedömning:
detta är INTE en olöst motsägelse — det är två dokument som mäter olika
storheter och som BÅDA säger det explicit i sin egen text.** DORA:s mått är
tiden från PR-öppning till landad kod (vilket är extremt kort hos oss).
Leverabel 9:s mått är den RÅA maskinväntan en enskild kodändring betalar
oavsett storlek (~13–25 min, dominerad av ett enda jobb). Leverabel 6:s eget
§14.4 delar overheaden i tre högar och landar i SAMMA slutsats som leverabel
9 — att den fasta overheaden är verklig men sitter i fel del av maskinen.
Läser man bara "Kort svar"-raderna isolerat FRAMSTÅR det som en motsägelse;
läser man båda dokumentens fulla resonemang försvinner den. Jag registrerar
den ändå, eftersom uppdraget uttryckligen bad mig prova den, och eftersom en
läsare som bara ser sammanfattningsraderna (t.ex. i huvudrapporten) kan dra
fel slutsats om den inte får båda måttstockarna förklarade i samma andetag.

**M-E — `TASK-365` mot `T166`: en repo-intern inkonsekvens, inte en
motsägelse MELLAN granskningens dokument.** Kortet `TASK-365` (öppet,
`priority: high`) bär fortfarande sin ursprungliga, delvis felaktiga
rotorsaksbeskrivning (`concurrency`-avbrott) på disk — KG1 mätte detta
2026-09-17 och fann att kortet och tråden `T166` (som har rätt diagnos
sedan 2026-08-21) inte refererar varandra. Detta är redan AVGJORT som
SAKFRÅGA av S18/KG1 (se § Påståenden som föll eller skärptes punkt 3 och
16), men den kvarstående inkonsekvensen finns i REPOTS EGNA artefakter, inte
mellan två av granskningens leverabler. Noterat här ändå eftersom
åtgärdsplanen (leverabel 11) pekas mot just detta kort.

**M-F — "~2 500 PR:er" i leverabel 6, ospårat vid min läsning.**
`05-branschjamforelse.md` §"Det här ska vi INTE kopiera" citerar fortfarande
*"~2 500 PR:er på fyra månader"* i raden om "proffsen kör direkt-PR". Det
gällande talet (SL S27, KG3 M6) är 2 216 PR:er (2 118 mergade). Domen
(arbetsformens skala) påverkas inte av skillnaden, men talet bör rättas.
Filen var markerad som `M` (modifierad, under aktiv redigering av en annan
agent) i git-status när jag skrev detta register — jag kan alltså INTE
utesluta att rättelsen redan landat när denna fil läses; jag rapporterar
läget vid MIN läsning, inte ett garanterat nuläge.

## Osäkerheter och vad jag inte kunde belägga

- **Jag har inte själv mätt om någon av leverablernas eller
  korsgranskningarnas siffror.** Detta register är en SAMMANSTÄLLNING, inte
  en ny mätning — där en siffra citeras bär den sin ursprungskällas
  märkning, inte en av mig oberoende bekräftad märkning, UTÖVER de 14
  `fil:rad`-pekare jag stickprovade direkt mot repot (§ Metod, § Rapport).
- **Om leverabel 6, 8, 9 och 10:s brödtext hunnit rättas för S30:s tre
  tillägg (nattnätets 25/52, dedupens 32/32, post-merge-luckans 60) när
  denna fil läses av någon annan.** Jag skriver mot en ögonblicksbild där
  fyra filer var markerade `M` i git status och en femte rättelseomgång
  (för S30) inte var bekräftat beställd. § Kvarstående motsägelser
  beskriver läget VID MIN LÄSNING, inte ett garanterat slutläge.
- **Orkestrerarens tidsangivelser i sessionsdoket** — jag har inte läst
  sessionsdoket och kan inte katalogisera de specifika felen (se
  § Åtkomstluckor punkt 14).
- **Om det finns fler numeriska glidningar bortom de KG3, KG1 och denna
  gransknings stickprov redan hittat.** Ingen av oss har gjort en
  uttömmande maskinell extraktion av varje tal i underlaget — frånvaron av
  fler fynd är inte ett bevis på att inga finns.
- **Om min egen klassning av "slags sanning" (DA/FI/TF/FA/EO/EV) är den
  enda rimliga för varje rad.** Flera rader kunde rimligen klassas i två
  kategorier samtidigt (t.ex. en regel som är BÅDE en dokumenterad avsikt
  OCH en teknisk framtvingad regel, som G01 och B03) — jag har valt den
  DOMINERANDE klassen per rad, inte listat alla tillämpliga.
- **Huvudrapporten (leverabel 1) och åtgärdsplanen (leverabel 11) existerar
  inte än** och ingår inte i detta register, per uppdragets egen
  avgränsning. När de skrivs bör de stämmas av mot detta register — särskilt
  mot § Kvarstående motsägelser och § Gällande tal — men jag har ingen
  möjlighet att verifiera att den avstämningen faktiskt görs.

## Risker

- **Risken att en läsare kopierar en tabellrads Evidens-kolumn utan att läsa
  dess Stickprov-kolumn.** Flera rader (särskilt i Nätet efter merge och Tid
  och kostnad) bär en siffra som SKÄRPTS minst en gång under granskningen —
  att citera bara den ÄLDSTA formuleringen (t.ex. leverabel 10:s
  dedup-karakterisering) återinför ett redan avgjort fel i nästa dokument.
- **Risken att "130 rader, 118 verifierade" läses som "granskningen är
  klar".** Registret täcker de BÄRANDE påståendena i leverabel 2–10 — det är
  inte en fullständig extraktion av varje mätning i 14 000+ rader underlag,
  och § Osäkerheter ovan listar flera luckor som inte kan stängas utan nytt
  arbete.
- **Risken att M-A/M-B (nattnätets 25/52) inte hinner rättas i leverabel 6
  och 9 innan huvudrapporten skrivs.** Om huvudrapporten (leverabel 1)
  ärver leverabel 6:s ordval ("nästan aldrig") okritiskt, propagerar en
  redan motbevisad formulering till granskningens mest lästa dokument.
- **Risken att mina 14 stickprovade `fil:rad`-pekare ger falsk trygghet för
  de återstående ~116 raderna.** Jag har inte kontrollerat varenda pekare —
  bara var nionde, enligt uppdragets egen "minst var tionde"-regel.

## Rekommendationer

*Markerat som rekommendationer, inte beslut.*

1. **Rätta M-A och M-B (leverabel 6 och 9:s nattnäts-formuleringar) INNAN
   huvudrapporten (leverabel 1) skrivs**, eftersom båda leverablerna är
   explicit listade som källor för huvudrapportens § "Var det läcker".
2. **Rätta M-C (leverabel 9 och 10:s dedup-karakterisering) INNAN
   åtgärdsplanen (leverabel 11) rangordnar sina förslag** — annars riskerar
   planen att ge dedup-ändringen högre prioritet än KG1:s egen ordning
   (sist, efter post-merge-fixen) motiverar.
3. **Rätta M-F (leverabel 6:s "~2 500 PR:er")** — en enrads-fix, ingen
   avvägning.
4. **Skriv in den DUBBLA måttstocken (M-D) explicit i huvudrapporten**, som
   uppdraget till D1 redan ber om — inte som en olöst spänning utan som en
   förklarad, ihopvägd bild ("DORA säger X, den upplevda väntan säger Y, och
   båda är sanna eftersom de mäter olika saker").
5. **Använd detta register som avstämningspunkt när leverabel 1 och 11
   skrivs** — särskilt § Gällande tal (för vilka siffror som fortfarande
   rör sig) och § Åtkomstluckor (för vilka rekommendationer som kräver en
   åtgärd FÖRE de kan bli en rekommendation, t.ex. Airtable-servicekontots
   ägarskap).
6. **Håll registret ÖGONBLICKSBILDEN det är** — `review_by`-datumet
   (2026-12-17) är satt kort med avsikt. Minst fyra av tabellens tal
   (nattnätets rödhet, öppna larm, täckningsluckans andel, dedupens
   träffantal) rör sig varje dygn och bör mätas om före nästa gång registret
   citeras som fakta snarare än som historik.

## Källor

**Granskningens egna leverabler och underlag** (samtliga lästa i sin helhet
eller i sina bärande avsnitt, se § Vad jag läste först):

- [`01-fil-och-komponentinventering.md`](01-fil-och-komponentinventering.md)
  (leverabel 2)
- [`02-teknisk-arkitekturkarta.md`](02-teknisk-arkitekturkarta.md) (leverabel 3)
- [`03-andringslogg.md`](03-andringslogg.md) (leverabel 4)
- [`04-branch-worktree-commit-och-pushflode.md`](04-branch-worktree-commit-och-pushflode.md)
  (leverabel 5)
- [`05-branschjamforelse.md`](05-branschjamforelse.md) (leverabel 6)
- [`06-airtable-kompromisser-och-empiriska-fynd.md`](06-airtable-kompromisser-och-empiriska-fynd.md)
  (leverabel 7)
- [`07-hermetiska-tester-kontra-realistisk-e2e.md`](07-hermetiska-tester-kontra-realistisk-e2e.md)
  (leverabel 8)
- [`08-risk-redundans-flakighet-tid-och-kostnad.md`](08-risk-redundans-flakighet-tid-och-kostnad.md)
  (leverabel 9)
- [`09-ci-som-ateranvandbar-djupmodul.md`](09-ci-som-ateranvandbar-djupmodul.md)
  (leverabel 10)
- [`underlag/00-agentkontrakt.md`](underlag/00-agentkontrakt.md)
- [`underlag/01-orkestrerarens-stickprov.md`](underlag/01-orkestrerarens-stickprov.md)
  (S1–S31)
- [`underlag/02-uppdrag-vag-3.md`](underlag/02-uppdrag-vag-3.md)
- [`underlag/kg1-korsgranskning-ci-mekanismer.md`](underlag/kg1-korsgranskning-ci-mekanismer.md)
- [`underlag/kg2-externa-fakta-och-rattelser.md`](underlag/kg2-externa-fakta-och-rattelser.md)
- [`underlag/kg3-konsistens-mellan-underlagen.md`](underlag/kg3-konsistens-mellan-underlagen.md)

**Repo-filer verifierade direkt av mig, 2026-09-17** (stickprov av
`fil:rad`-pekare ur det samlade underlaget, 14 av 130 rader, var nionde):

- `.github/workflows/ci.yml:2537-2552` (ci-passed, audit-kommentaren)
- `.github/workflows/ci.yml:452-460` (merge-dedup-steget)
- `.github/workflows/ci.yml:2269-2273` (`run_staging`/`run_a11y: false`)
- `.github/workflows/post-merge.yml:226-231` (klassningens `SHA`-env)
- `scripts/classify-post-merge.sh:199` (`MERGE_SHA`)
- `.github/workflows/nightly.yml:220-230` (länklarmets dedup-sökning)
- `.github/workflows/nightly.yml:855-865` (huvudlarmets `gh issue create`
  utan föregående sökning)
- `.github/workflows/ci-suite.yml:514-522` (självtestets jobbhuvud)
- `playwright.config.ts:236-244` (`retries`-kommentaren)
- `.github/workflows/gate-proof.yml:27-32` (`workflow_dispatch`-triggern)
- `tests/kontraktsvakt/kontraktsfall.ts:23-27` ("ALLA SJU … BEVAKAS")
- `CONTRIBUTING.md:1072-1076` ("alla 18 spec-filer")
- `docs/decisions/ADR-131-work-item-substratet-github-issues.md:1-5,168-173,
  290-297` (status, rivningsplanen, "Inga än")

## Rapport till orkestreraren

- **Modell:** enligt egen systemprompt: *"You are powered by the model named
  Sonnet 5. The exact model ID is claude-sonnet-5."*
- **Domen i klartext:** 130 rader i huvudtabellen (118 verifierade, 10
  starkt indikerade, 1 osäker, 1 ej verifierbar). Underlagen är sakligt
  samstämmiga, men FYRA tal har rört sig under granskningens gång på ett
  sätt en läsare måste känna till (nattnätets rödhet, post-merge-luckans
  storlek, dedupens status, PR-antalet) — samtliga rättade av KG1/S30, men
  vid min läsning INTE ännu synligt korrigerade i leverabel 6, 8, 9 och 10:s
  egen brödtext.
- **Den avgörande delfrågan:** § Kvarstående motsägelser M-A/M-B — leverabel
  6 och 9:s huvuddom om nattnätets orsak ("nästan aldrig"/"helt" processgrindar)
  motsägs av KG1/S30:s fulla mätning (25 av 52 nätter, 48 %, bar ett äkta
  produktskyddande jobbs rödhet). Detta bör rättas innan huvudrapporten
  (leverabel 1) ärver formuleringen.
- **Starkaste källorna:** `underlag/kg1-korsgranskning-ci-mekanismer.md`
  (Opus, fem oberoende mätlinjer, 601 pushar + 56 nätter räknade jobb för
  jobb) och stickprovsloggens S30/S31 (orkestrerarens egen dubbelkontroll av
  KG1:s nattnattsfynd, samt en LIVE-observation av täckningsluckan mitt
  under granskningen).
- **Vad jag inte kunde belägga:** se § Åtkomstluckor (14 punkter) och
  § Osäkerheter (6 punkter) — mest bärande: jag har inte läst sessionsdoket
  och kan inte katalogisera orkestrerarens tidsangivelsefel som uppdraget
  bad mig ta med.
- **Gren och commit-SHA:** `docs/s126-ci-djupgranskning`,
  ögonblicksbild `origin/main` `eeca8c72`; min egen fil ännu inte
  committad (jag committar aldrig, per kontraktet).
- **Oväntade fynd utanför uppdraget, registrerade:** (1) exakt räkning av
  tabellens Märkning-kolumn gav en mycket ojämnare fördelning än en
  uppskattning skulle ge (118 av 130 verifierade, noll osäkra utöver den
  jag själv införde för U08) — värt att notera som ett tecken på
  granskningens genomgående mätdisciplin, inte ett tecken på slarvig
  märkning. (2) Under skrivandet av detta register skickade orkestreraren
  TVÅ separata uppdateringar (S30, sedan S31) — samma mönster som
  `CLAUDE.md` beskriver för hookar som registreras mitt i en session: en
  sen, levande korrigering kan inte förlitas på att redan finnas i syskon-
  leverablernas text, även om den finns i stickprovsloggen.
- **Grindarnas utfall:** se nedan (körda i förgrunden, exitkod läst direkt).
