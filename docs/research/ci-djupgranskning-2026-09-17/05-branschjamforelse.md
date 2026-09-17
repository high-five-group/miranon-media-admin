---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# Leverabel 6 av 12 — Branschjämförelse: hur branschledande är vi, dimension för dimension

> **Proveniens:** Jobb 4b i Session 126:s CI-djupgranskning, utfört 2026-09-17
> av en analysagent enligt `underlag/00-agentkontrakt.md`, i worktreen
> `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s126-ci-djupgranskning`,
> mot ögonblicksbilden `origin/main` `eeca8c72` (2026-09-08). Modell: Claude
> Opus 5 (1M context) — medveten avvikelse från tier-policyn, bokförd i
> uppdraget, eftersom bedömningen ÄR leveransen. Denna fil BEDÖMER; den mäter
> inte om. Fakta om oss kommer ur våg 1:s underlag och ur orkestrerarens
> stickprovslogg; måttstocken kommer ur `underlag/j4a-branschpraxis-ur-primarkallor.md`.
> De egna mätningar jag gjort i detta pass står utskrivna i § Metod.
>
> **Ordförklaringar som återkommer nedan.** *CI* (Continuous Integration,
> "kontinuerlig integration") är de automatiska kontroller — tester,
> kodkvalitetskontroller, byggen — som körs varje gång någon föreslår en
> ändring. En *PR* (Pull Request) är ett ändringsförslag som väntar på att bli
> ihopslaget med huvudversionen av koden (`main`). *Presubmit* betyder
> kontroller FÖRE ihopslagningen, *postsubmit* betyder kontroller EFTER den.
> En *merge-kö* är en maskin som testar varje köad ändring mot exakt det
> tillstånd den faktiskt landar i, en i taget. Fler ord förklaras första
> gången de används.

## Kort svar

**Vi är inte efter branschen. Vi är ojämnt fördelade i förhållande till
den — mycket längre fram på vägen IN till huvudgrenen än på vägen UT till
användaren.**

Tänk på systemet som en fabrik med en port och en utlastning. Porten — det
som avgör vad som får komma in — är byggd som de allra bästa bygger den, och
den är bevisad i båda riktningar: den släpper in det som ska in, och den
säger nej när något är fel. Där håller vi samma nivå som Google, Kubernetes
och Next.js, med mekanismer som är enklare men principiellt likadana. På två
punkter är vi till och med före: våra ändringar är ovanligt små och
kortlivade (mitten av alla ändringar: 214 rader, 22 minuters livstid), vilket
är exakt det motmedel forskningen 2025 pekar ut mot riskerna med
AI-assisterad utveckling — och vi bevisar att våra isolerade tester faktiskt
är isolerade, i stället för att lita på det.

Utlastningen är en annan historia. Efter att en ändring släppts igenom
porten finns två skyddsnät: en kontroll direkt efter ihopslagningen och en
fullständig körning varje natt. Nattnätet har varit rött **51 av 52
nätter** sedan slutet av juli, och **21 larm står obesvarade**. **Rättat
efter orkestrerarens stickprov S30 (KG1):** orsaken är INTE "nästan aldrig
fel i programmet Lotta använder" — över alla 52 nätter var ETT
produktskyddande jobb rött 25 gånger (staging 15, kontraktsvakten 9, a11y
3, acceptance 1). Nätet bär både fel last OCH en äkta produktsignal som
har legat gömd i bruset ungefär varannan natt. Kontrollen direkt efter
ihopslagningen hoppas över för ungefär var åttonde landning (85 av 686
mätta), av en mekanisk orsak som först fastställdes i denna granskning —
**skärpt i S30:** de verkliga hålen är 60 (textändring i toppen OCH kod i
spannet), och det som uteblir där är staging, a11y och städning; de
hermetiska testklasserna körs ändå, via `push`-ytans körning som klassar
hela det pushade spannet. Och ingenting alls kontrollerar att en godkänd
ändring verkligen når fram till användaren — det upptäcktes en gång efter
tjugo timmar, av en människa.

Branschen har ett namn på det som saknas. Google, Chromium och Kubernetes
löser det med en utsedd person, en "sheriff" eller "build cop", vars enda
uppgift under en period är att hålla huvudgrenen grön. Den rollen förutsätter
flera människor att rotera mellan — vi har en. Men de mindre projekt jag
hittade löser samma sak utan en organisation: de gör larmet till EN stående
tråd i stället för ett nytt varje natt, de skiljer kontroller som skyddar
produkten från kontroller som skyddar bokföringen, och de stänger av ett
trasigt jobb hellre än att låta det färga hela natten röd. Allt det tre är
billigt och kan göras i den storlek vi har.

**Det som bör förbättras är alltså inte fler grindar. Det är svarsloopen
efter merge, och sedan tre enskilda kostnader som inte längre bär sig.**
Den dyraste av dem: 13 av de 14 minuter en kodändring väntar går åt till ett
test av testramverket självt, inte av programmet.

**Och det vi INTE ska kopiera är lätt att räkna upp**, eftersom branschens
mest avancerade mekanismer alla förutsätter en volym vi aldrig kommer nå:
maskininlärning som väljer tester, kanarie-utrullning mätt i trafikprocent
(fem procent av två användare är ingen grupp), och plattformar för att hålla
ordning på tjugotusen nyckfulla tester. Inte heller den motsatta ytterligheten
— att flytta tillbaka all testning till den egna datorn, som 37signals gjorde
— håller för oss: hos oss betyder "kör lokalt" femton samtidiga körningar på
en laptop, och det är mätt dyrare, inte billigare.

**På Marcus egen fråga — byggde vi grindarna för tidigt? — är mitt svar
delat, och det har ett eget avsnitt (§ 14).** Kort: ledtiden är inte
problemet. Mätt med branschens eget mått (tid från sparad ändring till den är
i drift) ligger vi långt inne i den högsta kategorin, och forskningen bakom
det måttet säger dessutom rakt ut att snabbt och säkert **inte** är ett
motsatspar. Den fasta overheaden är däremot verklig — men när jag delar upp
den i tre högar sitter huvuddelen inte i testarkitekturen utan i
arbetsformens egen bokföring. Att skära i tester skulle träffa fel hög.

## Vad jag läste först

Enligt kontraktet läste jag i denna ordning, i sin helhet:
`underlag/00-agentkontrakt.md` (arbetskontraktet) och
`underlag/01-orkestrerarens-stickprov.md` (arton egna mätningar av
orkestreraren — loggens version gäller före underlagen där de skiljer sig).
Därefter `underlag/j4a-branschpraxis-ur-primarkallor.md` i sin helhet (829
rader, måttstocken), och uppdragets ordagranna text
(`tasks/sessions/bilagor/s126-uppdrag/uppdraget-verbatim.md` rad 150–176).

Sedan våg 1:s fakta om oss. "Kort svar", "Fynd" och "Risker" i samtliga
utpekade filer, och hela avsnitt där dimensionen krävde det:

| Fil | Vad jag hämtade | Hur djupt |
|---|---|---|
| `underlag/j1a-ci-yml-och-ci-suite.md` | jobbuppsättning, aggregatorn, `run_staging: false` | Kort svar + § 5 via stickprovsloggen |
| `underlag/j1b-ovriga-workflows-och-github-katalogen.md` | nattnätet, nattvakten, post-merge, bevis-workflows | Kort svar + §§ post-merge/nightly/watchdog i sin helhet |
| `underlag/j1e-externa-installningar-och-deployvagar.md` | fyra deployspår, rollback per spår, hemligheter | Kort svar + § 3 i sin helhet |
| `underlag/j1f-test-bygg-och-lintkonfiguration.md` | Deno-luckan, två öppna sårbarheter | Kort svar |
| `underlag/j3-push-kadens.md` | PR-storlek, grenlivslängd, draft-mönstret | Kort svar + §§ 2–4 |
| `underlag/j8-1-produktionsfel-och-vad-som-skyddar.md` | fjorton produktionsfel, täckningsmatrisen | Kort svar + delfrågorna 1–3 |
| `underlag/j8-4-staging-och-e2e.md` | delad miljö, täckningsluckan, larmkedjan | Kort svar + § 8.4.9 + samtidighetsmatrisen |
| `underlag/j8-5-grindlogik-skip-och-gront.md` | required checks, klassningen, 46 scenarier, dedupen | Kort svar + F1–F10 |
| `underlag/j8-6-stabilitet-flakighet-och-felsokning.md` | flakighetstalen, omkörningar, felmeddelanden | Kort svar + §§ 1–7 |
| `underlag/j8-7-tid-och-kostnad.md` | väntetider, kritisk väg, noll kronor, fail-fast-kalkylen | Kort svar + §§ 1–8 |
| `underlag/j8-8-underhall-och-andra-repon.md` | storlek, ändringstakt, tvärrepo, Marcus slutfråga | Kort svar + §§ 1–7 + § Marcus slutfråga |
| `03-andringslogg.md` | korrigeringskedjor, andelar, ADR-131 | Kort svar + §§ regressioner/andelar |
| `04-branch-worktree-commit-och-pushflode.md` | den enda mekaniska grinden, isoleringsmodellen | Kort svar |
| `07-hermetiska-tester-kontra-realistisk-e2e.md` | testpyramiden i tal, CI-kopplingen | Kort svar + §§ testpyramid/CI-koppling |

**Vad som därför är nytt i denna fil.** Ingenting om vårt eget system är
uppmätt här för första gången — utom två saker (se § Metod): en egen
sammanräkning av review-grindens instrumenteringslogg, och fem
webbkällor som täcker luckor där `j4a` inte räckte för VÅR skala
(automatiserad kodgranskning som publicerad praxis, sheriff-/build
cop-rollen i små projekt, och Vercels egna mekanismer utöver Instant
Rollback). Det som är nytt är **domen**: `j4a` säger vad branschen gör och
skaltaggar det, våg 1 säger vad vi gör — ingen av dem sätter de två mot
varandra.

## Metod

**Bedömningsskalan.** Uppdraget ger fyra steg, och jag använder dem så här:

| Steg | Betyder |
|---|---|
| **före branschen** | Vi gör något som branschens jämförbara projekt inte gör, eller gör det med starkare bevis — och det är motiverat på vår skala |
| **i nivå** | Samma princip, samma styrka, proportionerlig mekanik |
| **efter** | Branschen löser något vi inte löser, och lösningen är billig nog att vara relevant för oss |
| **överbyggt för vår skala** | Vi bär en kostnad branschen bara bär vid mycket större volym |

**En dimension kan bära två av dem samtidigt**, och gör det på fyra ställen
nedan. Där skriver jag ut båda, med den skiljelinje som gäller.

**Egna mätningar i detta pass (2026-09-17).**

1. **Review-grindens instrumenteringslogg**, `docs/reference/review-instrumentering.jsonl`
   (186 789 byte, 262 rader), sammanräknad med `jq` i ett engångsskript:
   fördelning på risknivå, beslut, runda, armeringstillstånd, fynd per
   allvarsgrad och distinkta PR-nummer. Ingen skrivning, ingen nätverkstrafik.
   Resultaten står i § 13.
2. **Fem webbkällor** hämtade med `WebFetch`/`WebSearch` plus en sökning i
   Vercels egen dokumentation via deras MCP-server. Samtliga är
   förstapartskällor utom där annat anges, och samtliga är listade i
   § Källor med full URL.

Jag har **inte** kört någon mätning mot GitHubs API, mot vår CI eller mot
Airtable/Supabase — kontraktet ber om sparsamhet, och våg 1 plus
stickprovsloggen bär redan de talen. Där jag citerar ett tal står källan
inom parentes.

**Källmärkningen.** Varje bärande tal nedan bär sin källa i formen
`underlag/<fil> § <avsnitt>` eller `S<n>` (stickprovsloggens post). Där
stickprovsloggen och ett underlag säger olika saker gäller loggen, enligt
kontraktet — det inträffar på tre ställen och är utskrivet varje gång.

## Fynd

### 1. Snabbhet i återkopplingen

**Vad vi gör.** Väntetiden är tudelad, inte en kurva. En ren
dokumentationsändring är klar på **4,0 minuter** (median); allt annat tar
konsekvent **12,5 minuter** (median), p95 13,8 minuter — nästan oavsett hur
stor kodändringen är (`underlag/j8-7-tid-och-kostnad.md` § 2, n=168 på
PR-ytan, fönster 2026-09-05–09-17). Den tudelningen kommer av
riskklassningen i `ADR-077`.

Den kritiska vägen — det jobb som ensamt avgör totaltiden — är **inte** ett
test av produkten. I samtliga åtta fullständigt lästa körningar är det
`Acceptance — tvåsidigt bevis (hermetik-självtest)`, ett test som
kontrollerar att acceptanstesterna verkligen är isolerade genom att bevisa
att de FALLERAR när isoleringen bryts. I körning `34265004584` (2026-09-08)
tog det **13 minuter 41 sekunder** av en total väggklocka på **14 minuter 4
sekunder** (`underlag/j8-7-tid-och-kostnad.md` § 3). Alla övriga sex jobb
göms bakom det.

Efter merge är bilden en annan: där är väntan en verklig kö till en delad
testmiljö. Median 16,0 minuter, p90 32,2, max **56 minuter**, varav 34
minuter 46 sekunder var ren köväntan i det värsta fallet
(`underlag/j8-7-tid-och-kostnad.md` § 3, 39 körningar).

En räkning värd att lyfta: att köra billiga kontroller först och stoppa vid
fel hade gjort det **4 minuter LÅNGSAMMARE** i det gröna fallet, som är
>90 % av fallen (`underlag/j8-7-tid-och-kostnad.md` § 7). Dagens parallella
form är alltså mätt rätt, inte bara intuitivt rätt.

**Vad branschen gör.** Google formulerar avvägningen rakt — *"waiting a long
time to run every test during code submission can be severely disruptive"* —
och sätter ett uppmätt tal på vad "snabbt" betyder hos dem: *"the average
wait time to submit a change is around 11 minutes, often run in the
background"* (Software Engineering at Google kap. 23, via `j4a` § 1). Camille
Hodouls tregradiga smärtgräns (under 3 s före commit, under 10 s före push,
allt tungt i CI) taggas av `j4a` som rimlig på vår skala.
Beroendegrafverktygen (Nx, Bazel, Turborepo, Moon) taggas som överbyggnad:
de kräver flera paket i samma kodbas för att en graf ska existera alls.

**Bedömningen: i nivå på talet — men överbyggt i det som skapar talet.** Två
saker samtidigt.

*I nivå:* 12,5 minuter mot Googles 11 är samma storleksordning, för ett
projekt som är oändligt mycket mindre. Det är ingen dålig siffra. Men det är
ett sammanträffande, inte ett designmål: vi har inget uttalat tak och mäter
inte mot ett. Googles tal är kalibrerat och följt upp; vårt är en
biprodukt.

*Överbyggt:* **91 % av väntetiden på varje kodändring går åt till ett test av
testramverket.** Det är en kostnad branschen inte bär — inget av de sex
projekt `j4a` och det tidigare hermetik-passet verifierade mot faktisk kod
kör ett tvåsidigt självtest på presubmit-ytan. Att mekanismen finns är en
styrka (§ 5); att den ligger i den kritiska vägen på varje kodändring är
kostnaden som inte bär sig.

**Vår styrka här.** Att fail-fast-frågan är **räknad** i stället för antagen
— och besvarad åt det kontraintuitiva hållet. Det är den sortens
efterhandskontroll av en egen intuition som de flesta projekt aldrig gör.
Och D0-klassningen ger en genuint snabb väg för dokumentation (4 minuter),
vilket i ett repo där 55 % av PR:erna är dokumentation
(`underlag/j3-push-kadens.md` § 2) är en stor besparing.

**Vad som proportionerligt bör förbättras.** Ett: **sätt ett uttalat tak**
för presubmit-väntan och mät mot det — det är det enda Google gör som vi inte
gör, och det kostar en rad i en ADR. Två: **självtestet är det enda som
betyder något för väntetiden** — antingen flyttas det till post-merge/natt
(där `j4a`:s presubmit/postsubmit-princip säger att det hör hemma, eftersom
det inte skyddar mot en regression i diffen) eller körs det som ett
stickprov på PR-ytan och i full bredd efteråt. Allt annat man gör åt de
12,5 minuterna är kosmetika.

**Kopiera INTE:** beroendegrafverktyg (Nx/Bazel/Turborepo). En app är en nod
i grafen; sökvägsbaserad klassning ger samma nytta utan verktyget
(`j4a` § 1, § 4).

### 2. Branch- och PR-storlek

**Vad vi gör.** Mätt över 300 sammanslagna PR:er (2026-08-29–09-08,
`underlag/j3-push-kadens.md` § 2):

| Mått | Median | p90 | Max |
|---|---|---|---|
| Tid öppen → sammanslagen | 22 min 27 s | 3 t 21 min | 4 dygn 5 t |
| Ändrade filer | 5 | 18 | 52 |
| Rader ändrade | 214 | 1 616 | 9 762 |

Takten är ~29 sammanslagna PR:er per dag i mätfönstret, och omkring 2 200
PR:er, varav omkring 2 100 landade, på fyra månader (rättat efter
orkestrerarens stickprov S27 — inte "~2 496"). Bärande princip: *"commit är
gratis, push kostar"*
(`ADR-097`), och den är inte bara prosa — `scripts/deny-arbetsform-push.sh`
blockerar fysiskt `git push` medan ett uttryckligt "under arbete"-läge är
aktivt, mätt verksamt i två sessioner (`underlag/j3-push-kadens.md` § 4).

Två skavanker: grennamngivningen är ren praxis utan regel (15 prefix plus
"inget prefix" över 500 grenar, `04-branch-worktree-commit-och-pushflode.md`
§ Kort svar), och en gren med 40 lokala commits har passerat fem sessioners
avslut utan beslut (16+ dagar, `underlag/j3-push-kadens.md` § Kort svar).

**Vad branschen gör.** Trunk-based development sätter golvet: integrera till
huvudgrenen minst en gång per dygn. Google ger ett riktmärke men vägrar en
gräns: *"100 lines is usually a reasonable size for a CL, and 1000 lines is
usually too large, but it's up to the judgment of your reviewer"*. Rigby &
Bird mätte en medianändring på 11–32 rader över helt olika kulturer. Och —
detta är `j4a`:s enda post som uttryckligen namnger VÅR arbetsform — DORA
2025: *"Enforcing the discipline of working in small batches is a critical
countermeasure to the risks of AI-assisted development"*, eftersom *"higher
AI adoption is associated with an increase in both software delivery
throughput and software delivery instability"* (`j4a` § 2).

Metas RADAR-artikel mäter samma sak från andra hållet och ger ett tal som
sätter vår volym i perspektiv: rader per mänskligt landad diff växte
**105,9 %** på ett år och diffar per utvecklare och månad **51 %**, med
**över 80 %** av ökningen tillskriven agentdriven AI (arXiv 2605.30208, läst
i abstraktform av mig 2026-09-17).

**Bedömningen: före branschen.** Detta är den dimension där vi står
starkast, och det är inte en slump: 214 rader är inom Googles "rimligt"-zon,
22 minuters grenlivstid är långt under trunk-based-golvets 24 timmar, och
disciplinen är dessutom delvis **mekaniserad**, inte bara skriven. DORA:s
motmedel mot exakt vår riskklass är redan vårt normalläge.

**Vår styrka här.** Att den mest laddade dimensionen i hela
branschjämförelsen — den där 2025–2026 års forskning pekar rakt på
agentdriven utveckling som riskgrupp — är den vi redan gör bäst. Och att
disciplinen bärs av en teknisk spärr och inte bara av en regel: `j4a` har
inget exempel på ett projekt som mekaniserat push-kadensen.

**Vad som proportionerligt bör förbättras.** Mycket lite, och inget som rör
mekanik. Den enda mätta skavanken är **de långlivade grenarna utan beslut**
— en ensam gren med 40 commits som ingen dömt av på 16 dagar. Det är en
rutinfråga (en rad i sessionsavslutet: "vilka grenar är äldre än sju dagar,
och vad gör vi med dem?"), inte ett verktyg. Grennamngivningen kostar
ingenting mekaniskt och bör lämnas i fred.

**Kopiera INTE:** formell mätning av ändringsstorlek som organisatorisk
metrik (Rigby & Bird-stilen). Den kräver en population av granskare att
aggregera över — vid en person mäter man sig själv (`j4a` § 2).

### 3. Required checks (obligatoriska kontroller)

**Vad vi gör.** Exakt **en** obligatorisk kontroll: `CI Passed or Skipped`,
bunden till GitHub Actions-appen, i rulesetet `main-skydd`. Noll krävda
mänskliga godkännanden, tom bypass-lista, merge-kö med `ALLGREEN` och högst
tre poster per svep, oförändrat sedan 2026-08-05. Mätt tre gånger oberoende
— av `j1a`, av `j1e` och av orkestreraren själv (S5) — med identiskt utfall
och **noll drift** mot `ADR-076`.

Grindens logik är kort nog att citera och är fail-closed: den kör alltid
(`if: always()`), räknar `failure` och `cancelled` positivt och avbryter om
summan inte är noll. `skipped` är ett tillåtet utfall med avsikt. Tre av sju
jobb kan aldrig hoppas (`changed`, `lint`, `audit`), och `lint` bär ett
trettiotal grindvakter, inte bara formatkontroll
(`underlag/j8-5-grindlogik-skip-och-gront.md` F1–F2).

Båda riktningarna är belagda i verkliga körningar, inklusive den sällan
prövade `cancelled`-grenen (`34247226761`). Hålet som orsakade S77-incidenten
— en röd PR som auto-mergades 2026-07-23 — är stängt.

Två reservationer. Bevis-workflowen `gate-proof.yml` prövar en **replik** av
mönstret med sin egen `needs`-lista, inte den skarpa instansen: tar någon
bort ett jobb ur aggregatorns `needs` förblir beviset grönt. Och regeln att
den ska köras efter varje `ci.yml`-ändring efterlevdes inte senast — filen
har ändrats två gånger sedan bevisets senaste körning 2026-09-04
(`underlag/j8-5-grindlogik-skip-och-gront.md` F9).

**Vad branschen gör.** Den djupare principen är Graydon Hoares "Not Rocket
Science Rule": *"automatically maintain a repository of code that always
passes all the tests"* — genom att testa det FAKTISKT sammanslagna
tillståndet. Next.js gör exakt vår konstruktion: en egen aggregator-kontroll
`tests-pass` som väntar på 25+ jobb och rapporterar fel om något
misslyckats eller avbröts (verifierat mot deras faktiska arbetsflödesfil i
`j4a` § 3). Kubernetes Tide skiljer uttryckligen obligatoriska från valfria
kontroller. `j4a` taggar aggregator-mönstret **rimligt på vår skala** och
spekulativ parallell kö som stor-skala-motiverad.

**Bedömningen: i nivå med de bästa — och på en punkt före dem.**

*I nivå:* aggregator-formen är Next.js egen, ordagrant samma idé.

*Före:* vår aggregator är **bevisad i båda riktningar mot verkliga
körningar**, och beviset är dessutom mekaniserat i en egen workflow. `j4a`
hittade inget projekt som publicerar ett tvåsidigt bevis för sin egen
paraplykontroll. Det är rätt sorts investering: den kostade en gång och
vaktar en invariant som redan brustit skarpt en gång.

*Reservationen som drar ner:* beviset gäller MÖNSTRET, inte INSTANSEN, och
regeln som ska hålla det färskt är ett arbetssätt som inte efterlevdes. Det
är `ADR-083`-felklassen i miniatyr — en mekanism som påstås vaktad är
vaktad på en kopia.

**Vår styrka här.** Den yttre ramen är den bäst belagda delen av hela
arkitekturen. Tre oberoende mätningar av samma ruleset gav samma svar, och
den har inte glidit på sex veckor. För en granskning som letar efter
självmotiverande komplexitet är detta motbeviset: här är komplexiteten
minimal (EN kontroll) och beviset maximalt.

**Vad som proportionerligt bör förbättras.** Ett: lägg en `paths:`-trigger
på `gate-proof.yml` så att den körs automatiskt vid ändring i `ci.yml` —
det förvandlar ett arbetssätt till en mekanism och kostar en rad. Två:
villkora `audit`-jobbet mot manifest-diffen. I dag körs det på varenda
ändring, även ett kommatecken i ett dokument (`underlag/j8-7-tid-och-kostnad.md`
§ 6C), och just nu låser en känd sårbarhet därför VARJE landning, även rena
textändringar (S3). Det är en avvägning, inte ett fel — men den avvägningen
bör fattas medvetet, inte ärvas.

**Kopiera INTE:** maskininlärning för att förutsäga oberoende ändringar
(Uber SubmitQueue). Kräver historisk data i en storleksordning vi aldrig
genererar (`j4a` § 3).

### 4. Testurval

**Vad vi gör.** Klassningen (`Detect changed files`) är byggd som en
**tillåtelselista**: bara det som uttryckligen står med får hoppa, och
utfallet blir sant endast om VARENDA ändrad fil matchar. Osäkerhet faller
alltid till "kör allt", i fem oberoende lager
(`underlag/j8-5-grindlogik-skip-och-gront.md` F6):

| Lager | Vad det gör vid osäkerhet |
|---|---|
| Tillåtelselistans form | Allt okänt hamnar i full klass |
| `only_changed`-semantiken | Noll matchningar ger falskt, alltså full svit |
| Undantagslistan | Byggkonfig och låsfil kan aldrig bli lågrisk |
| Dedupen | Varje avvikelse eller API-fel ger full svit |
| Acceptance-urvalet | En post som inte är en spec-fil ger hela klassen |

46 konstruerade ändringsscenarier prövades mot de verkliga mönstren, och
**ingen** kombination hittades där ett jobb som borde ha kört blev hoppat av
misstag och ändå gav grönt. En okänd katalog, en fil utan ändelse och en tom
diff faller alla tre till full svit.

Tre skavanker. `docs/**/*.sh` är **genuint ogrindad** — klassningen hoppar
den och `shellcheck`-steget listar den inte (F5 scenario S31, F7).
`quotepath`-fixen (som en gång orsakade en tyst hoppad dokumentationsgrind på
en äkta dokumentationsändring) står på fyra ställen och **ingen grind kräver
att den finns kvar** (F3). Och dedupen: 70 % av de sammanslagna träden
skiljer sig från PR-huvudets, och dess skrivna motivering vilar på ett
`strict`-krav som togs bort 2026-08-05 (F7c). Orkestrerarens egen mätning
(stickprov S20, ett fönster på 40 `push`-körningar) fann att dedupen träffar
3 av 20 kod-landningar (15 %) — sällan, inte aldrig; F7c:s "noll gånger i
fönstret" var ett annat, mindre fönster och rättas här.

**Vad branschen gör.** Google: *"The primary mechanism for determining which
tests need to be run is an analysis of the downstream dependency graph"*, och
den kulturella regeln att förlorad presubmit-täckning måste fångas på
postsubmit *"and accept some number of rollbacks"*. Meta väljer den andra
vägen: maskininlärning, hälften så dyrt, med uttalad acceptans att *"over
95% of individual test failures and over 99.9% of faulty changes"* fångas —
resten inte. `j4a` § 4 taggar båda verktygsfamiljerna som överbyggnad för
oss och lyfter principen: *"Acceptera en känd, liten risk i utbyte mot
hastighet — generell princip, men kräver ett skyddsnät."*

**Bedömningen: före branschen på formen, efter den på villkoret.** Två
saker samtidigt, och skiljelinjen är viktig.

*Före på formen:* en tillåtelselista där osäkerhet alltid eskalerar uppåt är
**strängare** än Metas probabilistiska modell och kräver noll infrastruktur.
Att någon läste actionens källkod i stället för att anta dess semantik —
`onlyChanged` kräver att antalet matchande filer är större än noll, annars
hade en tom diff klassats som "bara dokumentation" — är den enskilt viktigaste
designhandlingen i hela filen, och den är dokumenterad där den gjordes.
Playwrights egen `--only-changed` prövades och förkastades empiriskt just för
att den saknar den egenskapen.

*Efter på villkoret:* branschens princip håller ihop **bara** med ett
fungerande skyddsnät. Vårt villkor står utskrivet i `ci.yml` självt (citerat
ur `ADR-077`: *"försvarbar ENDAST med ett post-submit-nät under sig"*) — och
det nätet bär i dag ingen signal (§ 7, § 8). Urvalet är alltså inte osäkert;
det är **obevakat**.

**Vår styrka här.** Fem oberoende fail-safe-lager och 46 prövade scenarier
är mer verifiering av en urvalsmekanism än något av `j4a`:s jämförda projekt
publicerar. Och den intellektuella ärligheten i att lämna "D2-slotten" öppen
med skälet utskrivet — *"klassas ärligt D3 tills en framtida
testgrafs-design"* — är precis motsatsen till en maskin som motiverar sig
själv.

**Vad som proportionerligt bör förbättras.** Ett: **byt dedupens fråga**
(rättat efter orkestrerarens stickprov S20 — den träffar 3 av 20
kod-landningar, inte noll). Den bär full komplexitet för en träffkvot på 15
%; den bättre signalen finns redan, eftersom varje kö-landning ger två
körningar på exakt samma commit (S11) — fråga "har denna SHA redan en grön
körning?" i stället för den svagare frågan om PR-huvudets träd. Säkerheten i
den enklare frågan är inte prövad än (KG1). Två: **vakta
`quotepath`** med en rad i paritetsgrinden — en lagning utan vakt återkommer
tyst. Tre: ta bort de två döda utdata (`ui_low_risk`, `acceptance_local`),
som beräknas vid varje körning och styr ingenting (F4).

**Kopiera INTE:** ML-baserat testurval (Meta) eller beroendegraf-verktyg. Det
första kräver ett dataset vi aldrig genererar, det andra en graf som inte
finns i en app (`j4a` § 4).

### 5. Hermetiska tester

**Vad vi gör.** Den hermetiska klassen — tester som kör i en isolerad värld
med mockad backend, utan nätverk — är i dag **61 filer / 524 tester**
(acceptance), plus 109 tester i webbläsarbeteende-klassen och 1 786 i den
rena logikklassen (`07-hermetiska-tester-kontra-realistisk-e2e.md`
§ Testpyramiden). Ovanpå det ligger `acceptance-sjalvtest`: samma 524 tester
körda med fixturens svar bortplockade, som ett **tvåsidigt bevis** att
isoleringen verkligen håller.

Två fakta som hör ihop. Styrande text på två ställen påstår fortfarande att
klassen har **18 spec-filer** (`CONTRIBUTING.md:1074`,
`scripts/acceptance-urval.sh:12`) — sant när det skrevs 2026-07-29, mer än
tre gånger fel i dag (S16). Och klassen växte 98 % på två veckor, slog i sitt
12-minuterstak i merge-kön och sparkade ut PR `#2209` ur kön **två gånger**;
åtgärden blev 3-vägs sharding — inte en gräns för klassens storlek
(`07-...` § Kort svar).

**Vad branschen gör.** Google: *"All tests should strive to be hermetic."*
Ghost och Grafana är de renaste precedenten för att bryta ut en hermetisk
klass som EGEN CI-kontroll — med radikalt olika viktning (Ghost ~50/50,
Grafana ~0,5 %), vilket redan i det förra passet visade att det inte finns en
"rätt kvot", bara ett kriterium (`j4a` § 5).

**Bedömningen: före branschen i mekanism, överbyggt för vår skala i
kostnad.** Två saker samtidigt.

*Före:* det tvåsidiga beviset — att bevisa att testerna FALLERAR när
isoleringen bryts — har jag ingen publicerad motsvarighet till i `j4a`:s
material, varken hos de sex projekt som verifierades mot faktisk testkod
eller i kontraktstest-litteraturen. Det är en genuint stark idé: den
besvarar frågan "är mockarna fortfarande sanna?" för själva
isoleringsmekanismen.

*Överbyggt:* att köra det på **varje kodändring, i den kritiska vägen**, är
kostnaden som inte bär sig (§ 1). Ett metatest skyddar mot att testsviten
tappar sin isolering — en långsam, sällsynt förändring — inte mot en
regression i den diff som väntar. Det är en definitionsmässig
postsubmit-kandidat enligt Googles egen tredelning.

**Vår styrka här.** Hermetiken är **verifierad, inte påstådd**. Och
utbrytningen till en egen CI-klass följer exakt Ghost/Grafana-precedenten.

**Vad som proportionerligt bör förbättras.** Ett: flytta självtestet till
post-merge och natt, med ett billigt stickprov kvar på PR-ytan om det känns
otryggt. Två: **ge klassen en gräns eller ett urvalskriterium.** Att svara på
"klassen blev för stor för sitt tak" med att dela den i tre är att flytta
taket, inte att äga gränsen — och `j4a` är tydlig med att kvoten är ett
kriterium, inte ett tal. Tre: rätta de två platser som fortfarande säger "18
spec-filer"; det är samma felklass (`ADR-083`) repot städat bort två gånger,
fast i volymtal i stället för mekanismpåståenden.

**Kopiera INTE:** Metas "mät flakighet och acceptera en nivå"-filosofi som
grund för hermeticitet. Den kräver en körningsvolym där en sannolikhet blir
meningsfull (`j4a` § 10).

### 6. Realistisk E2E

**Vad vi gör.** Katalogen `tests/e2e/` bär 34 filer och 304 tester. Men av de
34 gör **två** ett verkligt, webbläsardrivet anrop mot en riktig Edge
Function utan att mocka det: `invite-rundtur.staging.test.ts` och en enskild
grupp i `skapa-event.staging.test.ts`. Fem filer mockar ingenting men rör
heller aldrig en serverfunktion. De återstående 27 mockar mellan 3 och 33
anrop var (`07-hermetiska-tester-kontra-realistisk-e2e.md` § Kort svar).

Åtgärdsutskicken — bekräftelse, påminnelse, eventinformation — har **inget
test genom den verkliga kedjan på någon nivå** (S16). Det är appens mest
följdtunga handling: ett fel där går inte att ta tillbaka.

Kontraktsvakten, mekanismen som ska visa att mockarna fortfarande liknar
verkligheten, jämför **7 av 18** mockade funktioner mot skarp staging — och
dess egen kommentar påstår full täckning (S10). Elva mockar binds av
ingenting.

Miljön är delad och muterbar. Purgen är fail-closed och idempotent och är
inte problemet; problemet är att en delad rad kan lämnas med fel VÄRDE på ett
fält som en annan testfil läser, och ingen mekanism läker det
(`underlag/j8-4-staging-och-e2e.md` § Samtidighetsmatrisen, klassen bevisad
tre gånger).

**Vad branschen gör.** Samtliga fem backend-bärande projekt som verifierades
i det tidigare hermetik-passet startar en **färsk backend per CI-jobb**
(docker compose, `supabase start`, GitHub `services:`). **Ingen** kör mot en
delad, muterbar iscensättningsmiljö med ett globalt lås (`j4a` § 6).

**Bedömningen: efter branschen.** På båda halvorna: färre genuina flöden än
någon rimlig tolkning av "ett litet antal kritiska flöden" (svaret är två,
inte 5–15), och en miljöform ingen av de jämförda projekten använder.

Men **en del av avståndet är inte vårt fel**, och det ska sägas: Airtable går
inte att självhosta, vilket stänger den efemära-backend-vägen för just den
delen av kedjan. Det är en plattformsbegränsning, inte en skalfråga
(`j4a` § 6, redan konstaterat i det tidigare passet).

**Vår styrka här.** Staging är **riktig** autentisering, **riktig** Postgres
och en **riktig** Airtable-bas med identiska fält-ID:n som prod för delade
ytor (`underlag/j8-4-staging-och-e2e.md` § Paritetstabellen). Många små
projekt har ingen verklighetsnära miljö alls. Och samtidighetsskyddet är
byggt i flera lager, inklusive ett maskinbrett fillås som serialiserar
lokala körningar mot varandra.

**Vad som proportionerligt bör förbättras.** Ett: **kurera listan.** 5–15
flöden rankade efter risk, med utskickskedjan överst — det är ett
skrivbordsarbete, inte ett bygge, och det förvandlar 34 ärvda filer till ett
medvetet urval. Två: **stäng kontraktsvaktens lucka eller rätta dess
kommentar.** Elva obundna mockar är den starkaste kandidaten till "hur vet vi
att simuleringen fortfarande motsvarar verkligheten" — svaret för elva av
arton är: det vet vi inte. Att utöka vakten är billigt (samma mönster, fler
rader); att låta kommentaren stå kvar och ljuga är inte ett alternativ.

**Kopiera INTE:** Uber SLATE-mönstret (produktionslika instanser med
tenant-routing). Kräver en flotta stor nog att låna ut ledig kapacitet
(`j4a` § 6).

### 7. Kontroll före och efter merge

**Vad vi gör.** Presubmit bär de hermetiska klasserna plus lint och
beroendegranskning. Postsubmit — `Staging (API + E2E)` och `A11y` — körs
**aldrig** på PR- eller kö-ytan: `ci.yml` skickar `run_staging: false` och
`run_a11y: false` utan villkor (S1, verifierad ordagrant). Merge-kön testar
varje post för sig (`ALLGREEN`).

Två mätta problem.

**Samma träd testas fyra gånger per landad, ENSAM kod-PR.** På commit
`01c33c145` körde `CI [merge_group]` 15:00:46→15:14:00, `CI [push]`
15:14:27→15:26:24 och `Post-merge [push]` 15:14:27→15:34:15 — plus
körningen på PR-ytan före kön. Push-körningen körde exakt samma jobb som
kö-körningen; **den tillför ingenting alls, i DETTA fall.** Bara
post-merge-körningens a11y- och staging-jobb tillför ny information efter
kön (S11, skärpt av orkestreraren från J8.5:s "två gånger" till "tre, plus
PR-ytan"). **Preciserat i S30 (KG1):** detta gäller en ENSAM landning. Vid
en GRUPPLANDNING (flera köade PR:er i samma push) är `push`-ytans körning
inte overksam — det är just den som klassar och kör mot hela det pushade
spannet, vilket är anledningen till att gruppfallet har färre verkliga
täckningshål än en naiv läsning av 85/686 antyder (se nedan).

**Var åttonde landning saknar en egen post-merge-körning — men de VERKLIGA
hålen är färre.** 85 av 686 landningar (12,4 %) saknar post-merge-körning,
och mekanismen fastställdes först i denna granskning: merge-kön landar
flera köade PR:er i EN push till `main`, bara toppens commit får en
push-händelse, och `post-merge.yml` klassar bara toppen. Är toppen en
dokumentations-PR hoppas sviten, körningen blir grön — och kod-PR:en under
den får **aldrig** den kontroll som bara finns efter merge (S18). 55 av de
saknade är kod-PR:er vars nästa landning var en dokumentations-PR.
**Skärpt i S30 (KG1):** av dessa 85 är **60 de verkliga hålen** — bara när
toppen är en textändring OCH spannet under faktiskt bär kod. Vad som
uteblir där är staging-sviten, a11y och städningen; de hermetiska
testklasserna KÖRS ändå, eftersom `push`-ytans körning (ovan) klassar och
kör mot hela det pushade spannet, inte bara toppen. Exponeringsfönstret för
dessa 60 är kort — median 0,57 timmar, längst 33 timmar — innan nästa
landning täcker dem.

**Vad branschen gör.** Google delar i tre tidpunkter, inte två: presubmit,
postsubmit, och en tredje vid staging-utrullning. Kubernetes namnger samma tre
som Prow-jobbtyper. Merge-kön är den moderna utvecklingen: testa det
tillstånd ändringen FAKTISKT landar i. GitHub rapporterar att kön *"has
practically eliminated all build failures in that category"* (`j4a` § 7).

Viktigt för vår fråga om dubbelkörning: **ingen källa i `j4a` beskriver en
princip som kräver att samma träd testas flera gånger.** Kö-mekaniken finns
för att ERSÄTTA postsubmit-fångsten av integrationsdrift — inte för att
upprepa den. `ALLGREEN` betyder att varje köad post prövas för sig, inte att
varje post prövas flera gånger.

**Bedömningen: grinden före merge i nivå med de bästa — nätet efter merge
långt efter.** Detta är dimensionen där den tudelade domen uppdraget
efterfrågar är mest nödvändig.

*Grinden:* presubmit/postsubmit-delningen är inte lånad utan **mätt hos
oss**. Motexemplet som motiverar den är namngivet: en åtta-raders
dokumentationsändring tog det globala låset i 10 minuter och blockerade en
akut återställning i 25 minuter 16 sekunder. Det är precis den sortens
evidensdrivna avvägning `j4a` beskriver som god praxis.

*Nätet:* Googles princip förutsätter att postsubmit-rött **åtgärdas**, och
Chromiums CQ-dokumentation förutsätter en sheriff. Vi har principen men inte
loopen (§ 8). Och täckningsluckan betyder att för (skärpt i S30: 60,
tidigare skrivet 55) kod-landningar har ingen verklig kedja för staging och
a11y prövats med ett läsbart utfall — det hermetiska svaret KÖRDES ändå, via
`push`-ytans körning.

Den fjärde körningen (`CI [push]`) är ren kostnad **för en ENSAM landning**,
utan motsvarighet i branschmaterialet. **Preciserat i S30 (KG1):** vid en
grupplandning är den inte kostnad utan täckning — den enda körning som
klassar och prövar hela det pushade spannet.

**Vår styrka här.** Att kö-formen är rätt vald och rätt konfigurerad
(`ALLGREEN`, tom bypass-lista), och att avvägningen bakom
presubmit/postsubmit-delningen är belagd med en mätt incident i stället för
ett antagande.

**Vad som proportionerligt bör förbättras.** Ett: **låt post-merge klassa
hela det pushade spannet** (`github.event.before` → `github.sha`) i stället
för bara toppen, och kör sviten om NÅGON landning i spannet är kodklassad.
Det är en liten, reversibel ändring som stänger en lucka på 12,4 %
(orkestrerarens egen riktning i S18 — ej beslutad). Två: **ta bort
`CI [push]`-körningen** eller reducera den till dedup-frågan på SHA. Fyra
körningar av samma hermetiska svit per landning har ingen branschgrund.
**Tillägg efter S30 (KG1), samma fälla D9/åtgärdsplanen ska undvika:** denna
ändring får INTE göras före lagningen av post-merge-klassningen (ett) —
annars förloras just den täckning `push`-ytan i dag ger vid en
grupplandning. Och villkoret för att reducera till en dedup-fråga får
ALDRIG vara "har denna SHA en grön körning?" — på de 60 verkliga hålen ÄR
kö-körningen grön, med sviten HOPPAD. Villkoret måste vara "sviten körde OCH
var grön".

**Kopiera INTE:** spekulativ parallell kö-mekanik utöver GitHubs egen
(bors/TAP/SubmitQueue), eller Chromiums curerade plattformsmatris. Båda
löser problem som uppstår vid hög samtidig kö-volym respektive flera
målplattformar (`j4a` § 7).

### 8. Nattliga kontroller

**Vad vi gör.** `nightly.yml` kör tio jobb klockan 03:00: full svit,
bredare sårbarhetsgranskning, länkkontroll utan cache, CI-mätning,
kontraktsvakt, och fyra processgrindar (backlog-stängning, pausade
sessioner, sessionsdok-fönstret, obesvarade larm). Ovanpå det finns
`nightly-watchdog.yml` — en vakt FÖR vakten, som frågar "kom natten ens
igång?" och som bär en nyanserad filtrering så att den tiger när det bara är
länkjobbet som är rött.

Utfallet, mätt av orkestreraren 2026-09-17: **52 schemalagda nattkörningar
sedan 2026-07-28, varav 51 röda och 1 grön. Senaste gröna natten:
2026-07-29.** 63 `ci-natt`-ärenden totalt, **21 öppna**, äldsta öppna
2026-08-28 (S7 — skärpt från J1b:s "30 av 30", som var mätfönstrets tak, inte
sanningens).

Nätterna 09-15 och 09-16 var röda på exakt fyra jobb: de tre
processgrindarna plus den bredare sårbarhetsgranskningen. Inget testjobb var
rött just de nätterna (S12). **Skärpt i S30 (KG1), inte mildrat:** att
generalisera från dessa två nätter till "nätet bär fel last, inte
produktfel" höll inte. Räknat över alla 52 nätter var ETT
PRODUKTSKYDDANDE jobb rött **25 gånger** (staging 15, kontraktsvakten 9 —
varav sex i rad 08-22→08-27 — a11y 3, acceptance 1). Rätt bild: nätet bär
fel last OCH en äkta produktsignal har legat gömd i bruset ungefär varannan
natt — det är inte antingen eller. Och när ytterligare en äkta
testregression kom (natten 09-17) föll den in i ett larm som varit rött i
femtio dygn av andra skäl.

En strukturell orsak till ärendehögen: `alarm`-jobbet saknar
dedup-kontroll. `links-arende` har den och `post-merge.yml`:s larm har den
— men nattlarmet skapar ett **nytt** ärende varje gång det fyrar, oavsett om
gårdagens står öppet (`underlag/j1b-...` § nightly.yml, verifierat genom
radvis läsning).

Och en av de tre processgrindarna är redan **dömd att rivas**: `ADR-131` är
Accepted sedan 2026-09-04 och river bland annat `check-backlog-closure.sh` —
som fortfarande underhålls aktivt med två PR:er samma dag (S15).

**Vad branschen gör.** Kubernetes spårar periodiska jobb över tid i
TestGrid, med en särskild vy som räknar antal på-varandra-följande röda dagar
per jobb. Nuxt låter sin schemalagda körning gå röd (`fail: true`).
`github/docs` och lychee-projektet självt väljer i stället **tyst
ärendeskapande**: *"It will check all repository links once per day and
create an issue in case of errors"* — **ett** ärende, inte ett per natt
(`j4a` § 8).

Och för svarsloopen, som `j4a` inte täckte och jag därför sökte själv:
ChromiumOS skriver ut sin hållning rakt — *"ChromiumOS is a revert-first
project"* — och namnger den sista utvägen när orsaken inte går att isolera:
sheriffen får *"disable it, or mark the builder/test as informational,
experimental, or non-critical"*. Hos Drake (ett litet, akademiskt-industriellt
robotikprojekt, inte en storskalig organisation) roterar build cop-rollen i
**par, en vecka i taget**, med uttrycklig överlämning vid varje skifte. ROS 2:s
guide lägger uppgiften på en daglig rutin: gå igenom nattens jobb varje
morgon och agera på nytt fallerande jobb.

**Bedömningen: efter branschen — men inte i mekanik.** Detta är den skarpaste
inversionen i hela granskningen: **vi har byggt MER natt-mekanik än något av
de tre jämförda projekten** (tio jobb, en egen vakthund med falsklarm-filter,
dedup i två av tre kanaler, ett larm som räknar commit-spann sedan senaste
gröna natt) **och får ut MINDRE signal**, eftersom ett larm som är rött 50
dygn i rad har upphört att vara ett larm. `ADR-077` byggdes uttryckligen för
att undvika den effekten.

**Vår styrka här.** `nightly-watchdog.yml` är genuint god ingenjörskonst:
den är fail-closed, den bär en nyanserad regel som kodades efter ett verkligt
falsklarm, och den dedupar mot både öppna och nyligen stängda ärenden. Att en
vakt för vakten över huvud taget finns, med sin egen begränsning öppet
utskriven av upphovspersonen (den ärver samma cron-beroende den ska täcka),
är mer transparens än branschmaterialet visar.

**Vad som proportionerligt bör förbättras — tre saker, i denna ordning.**

1. **Ge nattlarmet samma dedup som länklarmet redan har.** EN stående tråd i
   stället för ett ärende per natt. Det är `github/docs`- och
   lychee-mönstret, det är verifierat i tre projekt, och koden finns redan i
   samma repo — den ska bara återanvändas. Detta ensamt förvandlar 21 öppna
   ärenden till 1.
2. **Skilj produktskyddande jobb från processgrindar i två kanaler**, så att
   rött betyder en sak. ChromiumOS namnger den legitima formen: markera ett
   jobb som *informational* i stället för att låta det färga helheten. I dag
   delar "fungerar appen?" och "är backlog-korten avbockade?" ett och samma
   rött. **Skärpt i S30 (KG1):** detta är inte längre bara en
   signal-hygien-fråga. Ett produktskyddande jobb var rött 25 av 52 nätter —
   utan en egen kanal hade den signalen fortsatt drunkna i bruset.
3. **Verkställ `ADR-131`:s rivning eller lyft grinden ur rött/grönt under
   tiden.** Ett Accepted-beslut utan brytdag är en stående kostnad:
   maskineriet underhålls tills någon river det (S15).

Om svarsloopen och den saknade sheriffen: **rollen kan inte kopieras, men
funktionen kan.** Drake visar att formen fungerar med två personer; vi har en
och en flotta agenter. Den minsta ärliga formen hos oss är en **tidsregel med
en ägare** — ett rött nattnät som stått mer än N dygn eskaleras till Marcus
som en egen punkt, inte som ännu ett ärende i en hög. Det är en rad i
sessionsstarten, inte ett bygge.

**Kopiera INTE:** TestGrid eller motsvarande visualiseringsplattform. Den är
byggd för en testmatris (många versioner × många molnleverantörer) som inte
existerar hos oss; en stående tråd ger samma signal (`j4a` § 8).

### 9. Observability och rollback

*Ordförklaring:* **observability** ("observerbarhet") betyder att kunna se
vad ett system faktiskt gör efter att en ändring gått i drift — inte bara att
den byggde grönt. **Rollback** ("återställning") betyder att snabbt kunna gå
tillbaka till den föregående, fungerande versionen.

**Vad vi gör.** Fyra deployspår, och de skiljer sig helt åt
(`underlag/j1e-externa-installningar-och-deployvagar.md` § 3):

| Spår | Automatik | Verifiering att det gick fram | Rollback |
|---|---|---|---|
| Frontend (Vercel) | Ja, på push till `main` | **Ingen mekanism** — manuell SHA-jämförelse | CLI finns, aldrig körd hos oss |
| Edge Functions | Nej, `ADR-050` avvisar automatik | Manuellt smoke-test per funktion | **Finns inte** i Supabase CLI:t (verifierad plattformsbegränsning) |
| Databasmigrationer | Nej | `migration list` + RLS-prober | Bara FÖRE verklig data finns |
| Airtable-schema | Nej | Engångs-läsprob ur ett research-pass | Restore skapar en KOPIA, aldrig in-place |

Det bärande fyndet är `TASK-199`: prod-frontenden stod **stale i minst 20
timmar** trots Vercels git-integration, det upptäcktes av en människa, och
kortet står öppet sedan 2026-08-11 (S6). Det är granskningens första belagda
instans av en felklass **ingen grind täcker**: allt maskineri vaktar vägen
FRAM till `main`, ingenting vaktar att `main` når användaren.

Post-merge-lagret mäter ett **exponeringsfönster** (tid från landning till
svar) vid varje landning — men stoppar ingenting; det skapar ett ärende med
ett färdigt återställningsförslag (`underlag/j8-1-...` delfråga 2).

Och de två senaste produktionsfelen hittades av Marcus i appen, inte av en
mätning: prod-incidenten 2026-09-03 (S115), och en layoutregression som låg
live i **fem dygn** medan allt var grönt (`underlag/j8-1-...` delfråga 1,
raderna 7 och 8).

**Vad branschen gör.** Google SRE:s tre grundprinciper: *"progressive
rollouts, monitoring, and safe and fast rollbacks"*. Kanarie-utrullning mätt
i trafikprocent taggas av `j4a` som överbyggnad för oss — *"5 % av två
personer är inte en observerbar grupp"*. Vercels Instant Rollback taggas
som **redan tillgängligt på vår skala**: *"Instant rollbacks reroute traffic
to a previous deployment in seconds, no rebuild needed"* (`j4a` § 9).

Orkestreraren rättade här ett fel i J1e:s underlag: kommandovägen FINNS
(`vercel rollback`, `vercel promote`, REST-anropet `projects.requestRollback`,
plus `vercel bisect`) — det som står kvar av fyndet är att den aldrig körts
och aldrig dokumenterats hos oss (S8).

**Mina egna två tillägg ur Vercels dokumentation (2026-09-17).** Först en
bekräftelse: Vercel bär numera även **rolling releases** (`vercel
rolling-release start/abort`, med en `complete`-ändpunkt som flyttar 100 % av
trafiken) — alltså finns kanariemekaniken i vår egen hosting. Det **ändrar
inte** `j4a`:s skaltaggning; det bekräftar den, eftersom mekaniken saknar
statistiskt underlag vid två användare. Sedan det praktiskt viktiga:
**Vercel kan trigga ett GitHub Actions-arbetsflöde vid lyckad utrullning**,
via `repository_dispatch` med typen `vercel.deployment.success` (deras egen
migreringsanvisning bort från det utfasade `deployment_status`). Det är exakt
den saknade signalen i `TASK-199`.

**Bedömningen: efter branschen — och det är dimensionen där avståndet är
störst i förhållande till hur billigt det vore att stänga.** Google SRE:s tre
tenets är: gradvis utrullning (inte tillämplig på vår skala), observation
(saknas helt för frontenden), snabb återställning (finns som mekanism, är
oövad och odokumenterad). Två av tre är öppna, och den ena av dem har en
färdig, förstapartsdokumenterad lösning i en plattform vi redan betalar för.

**Vår styrka här.** Att exponeringsfönstret **mäts** vid varje landning — de
flesta småprojekt mäter det inte alls, och `j4a` har ingen motsvarighet i sitt
material för ett projekt av vår storlek. Och att revert-vägen genom kön är
övad och dokumenterad, inte bara påstådd.

**Vad som proportionerligt bör förbättras.** Ett: **koppla
`repository_dispatch: vercel.deployment.success` till ett litet jobb som
jämför den utrullade commiten mot `main`.** Det stänger `TASK-199` mekaniskt,
kostar ett kort arbetsflöde, och kräver ingen ny infrastruktur. Två: **öva
`vercel rollback` en gång, mot en föregående utrullning, och skriv
runbooken** — en återställningsväg som aldrig körts är inte en
återställningsväg. Vercels egen incidentsekvens (bekräfta i loggarna, rulla
tillbaka, verifiera, hitta den dåliga utrullningen, `vercel bisect`) är en
färdig mall.

**Kopiera INTE:** kanarie mätt i trafikprocent, och GitHubs
Scientist-mönster (shadow-jämförelse i produktion). Båda kräver en
trafikvolym där en avvikelse blir statistisk i stället för anekdotisk
(`j4a` § 9).

### 10. Flakighet

*Ordförklaring:* ett **nyckfullt** test ("flaky test") visar ibland fel utan
att koden är trasig.

**Vad vi gör.** Repots eget mätverktyg fann **0 bevisat flakiga körningar av
100** i sitt rullande fönster (definition: rött som blir grönt vid omkörning
av identisk kod). 15 av 100 körningar var röda — men 13 av dem på en enda,
identifierad orsak (en äkta beroende-sårbarhet) och 4 på en annan
(en deterministisk klockbugg i exakt en testrad)
(`underlag/j8-6-stabilitet-flakighet-och-felsokning.md` § 1).

Ett stickprov på 31 röda eller avbrutna körningar klassades: 48 % var
körningar som en ny push gjorde överflödiga (aldrig utvärderade), 32 %
beroende-sårbarheten, 10 % klockbuggen, 6 % äkta fel i diffen, 3 %
oklassade. **Noll** i klassen klassisk flakighet, noll infrastruktur, noll
extern tjänst — ett äkta nollresultat i fönstret, med det ärliga tillägget
att n=31 över elva dagar är för litet för att säga att klasserna inte finns.

Omkörningar: 2 i CI, **0 lokalt**. Historiken här är ovanligt ärlig och värd
att lyfta: kommentaren vid `playwright.config.ts:240` redovisar att skälet som
en gång motiverade omkörningarna **var falsifierat av egen mätning** — de
maskerade ett äkta race-villkor — och beslutet blev ändå att behålla dem, som
ett medvetet, kostnadskänt val med två motvikter (en egen rapport skriver "N
flaky" i loggen; lokalt är omkörningar helt av).

Mätriggen (`npm run metrics:flake`) kodar interfolierad A/B (`A,B,A,B,…`,
aldrig blockad), `--retries=0`, belastningstal per körning och rådata per
testresultat — metodval som gör att ett utfall kan deflateras i efterhand.

En öppen klassisk flake finns: `TASK-418`, 2 av 7 i hel-filskörning men 4/4
isolerat — ordningsberoende, mätt 2026-09-06, oåtgärdad.

**Vad branschen gör.** Chromium har cirka **20 000 unika kända nyckfulla
tester** och en uttalad retry-avvägning. Kubernetes SIG-Testing ger det
skarpaste kostnadstalet i hela `j4a`: *"Every time a flake comes back, at
least 2 hours of merge time is wasted"*, med en reproduktionsbudget på *"an
hour and half a day"*. Uber mäter 0,17–0,29 % nyckfulla av hundratusentals
tester och driver en egen plattform. Ghost förbjuder omkörningar helt som
policy. Google säger: isolera bort orsaken (`j4a` § 10).

**Bedömningen: före branschen, för vår skala.** Tre skäl. Flakighetsnivån är
**mätt** och noll i fönstret. Mätriggens metod (interfolierad A/B med
belastningstal) är striktare än vad ett projekt av vår storlek normalt har —
`j4a` har ingen motsvarighet bland de mindre projekten. Och åtgärdsvalet är
dokumenterat **falsifierings-testat**: motiveringen prövades, föll, och
beslutet skrevs om med ett nytt skäl i stället för att tyst behållas.

Reservationen: n är litet, och klass (c) infrastruktur finns bevisligen
(`TASK-386`, där långsam paketinstallation fällde fyra körningar på ett dygn)
— den var bara inte aktiv i mätfönstret.

**Vår styrka här.** Ärligheten. En kommentar som säger "skälet jag skrev för
tre veckor sedan var fel, här är det nya skälet" är sällsynt i vilket projekt
som helst, och den är exakt det `ADR-083`-disciplinen finns för.

**Vad som proportionerligt bör förbättras.** Ett: **låt någon läsa
"N flaky"-raden maskinellt** och lägg den i en serie över tid. I dag skrivs
den vid varje körning och läses bara när någon grepar loggar för hand — en
enkelrads-ansamling ger Kubernetes signal utan Kubernetes plattform. Två:
stäng `TASK-418`; det är den enda öppna, äkta flaken och den har en känd
orsak (delat tillstånd mellan tester i samma fil).

**Kopiera INTE:** en statistisk detektionsplattform (Testopedia, Flake
Portal). Vid vår testvolym syns ett nyckfullt test för blotta ögat
(`j4a` § 10). Och kopiera inte Metas "mät och acceptera"-filosofi: den
kräver en volym där en sannolikhet blir meningsfull.

### 11. Underhållskostnad

**Vad vi gör — och vad det väger.** Mätt av J8.8 med egna radräkningar
2026-09-17:

| Mått | Värde |
|---|---|
| CI-/grindvakts-/processyta | ≈ 106 900 rader, ≈ 333 filenheter |
| Produktkod (`src/` + serverfunktioner) | ≈ 112 400 rader |
| **Kvot** | **≈ 0,95 : 1** (≈ 1,84 : 1 med testspecifikationerna inräknade) |
| `ci.yml` ensam, ändringstakt | 116 commits på 15,4 veckor ≈ **7,5 per vecka** |
| Hela ytans andel av alla commits sedan 2026-06-01 | 813 av 6 498 = **12,5 %**, utan avtagande trend |
| PR:er som rör minst en fil på ytan | **22,5 %** (stickprov 40 av 400, filbaserat) |
| Minsta läsning innan en säker `ci.yml`-ändring | ≈ **5 900 rader** |

Av ytan är 34 582 rader (32 %) testsviter som skyddar **grindvakternas egen
logik**. Ungefär 40 % av de substantiella CI-PR:erna är **korrigeringar av
tidigare CI-ändringar** (`03-andringslogg.md` § Andelar). Och den dolda
kostnaden: `CLAUDE.md`:s CI-avsnitt är cirka 15 555 token av filens 19 518,
och filen laddas i varje agent-spawn — 1 589 färska spawns på 51 dagar ger
storleksordningen **24,7 miljoner token enbart för CI-avsnittet**, oavsett om
agenten någonsin rör `ci.yml` (`underlag/j8-8-...` § 4, starkt indikerad).

**Vad branschen gör.** Två läger som inte motsäger varandra utan beskriver
olika punkter på samma kostnadskurva. Uber, Kubernetes och GitLab investerar
tungt i personalkrävande CI-infrastruktur och beskriver det som nödvändigt.
DHH (37signals) flyttade sin CI **tillbaka till utvecklarnas egna maskiner**:
*"Small teams ought to remove all the moving parts possible. Never aspire to
a more complicated stack than what your application calls for"* — och han
namnger uttryckligen vilka som inte kan följa honom: *"Shopify or GitHub"*.
Hans kalibrering: 55 000 rader Ruby, 5 000+ tester, fjärr-CI 5 min 30 s mot
lokalt under 2 min 45 s (`j4a` § 11).

**Bedömningen: överbyggt för vår skala på processlagret — motiverat på
merge-lagret.** Och DHH-positionen är **inte** direkt tillämplig på oss, av
en mätbar anledning.

*Varför DHH:s räkning vänder tecken hos oss.* Hans premiss är att "kör
lokalt" är billigare än att köra i molnet. Hos oss betyder "kör lokalt"
**femton samtidiga körningar på en laptop**. Två mätningar visar vad det
kostar: `verify:ci-parity` tar **910,7 sekunder** lokalt mot CI:s **401,0
sekunder** parallellt (`CLAUDE.md` § verify:ci-parity), och under DENNA
granskning gav fyra samtidiga dokumentkontroller plus övrig agentlast en
**belastning på 269 på en maskin med 16 kärnor** medan en annan session körde
tidskänsliga webbläsartester (`underlag/00-agentkontrakt.md` § Grindar).
Lägg till att molnminuterna är **gratis** eftersom repot är publikt — 76 080
minuter i augusti till nettokostnad noll (S14) — och DHH:s kostnadskalkyl
pekar åt motsatt håll för oss: den delade maskinen är den knappa resursen,
inte molnkapaciteten.

*Vad som DÄREMOT håller av hans argument.* Den andra halvan — matcha
stackens komplexitet mot appens faktiska behov. Och där finns det mätta
fyndet: av ~20 stickprovade komponenter är **8 processpecifika** — bundna
varken till produkten eller till CI som allmänt begrepp, utan till
Marcus/Code-arbetsformen själv (facit-kedjan, arbetsform-tillstånd,
review-loopen, backlog-wrappern). Det är en fjärde kategori uppdragets
ursprungliga tre inte hade ett fack för, och den växer.

*Finns jämförelsetal för kvoten 0,95:1?* **Nej — jag hittade inget.** Jag
sökte efter publicerade studier av förhållandet mellan CI-/infrastrukturkod
och produktkod och fann ingen. Den närmaste publicerade familjen mäter något
annat: förhållandet mellan produktionskod och **enhetstestkod** (metriken
"TPRatio", studerad över 82 447 projekt), vilket inte är samma sak som
grindvaktsmaskineri — och jag nådde inte dess fördelningsvärden. Samma gäller
"22,5 % av PR:erna på CI-ytan": inget jämförelsetal hittat. **Kvoterna är
alltså mätta men ojämförbara.** De duger som intern trendindikator över tid,
inte som betyg mot en bransch.

**Vår styrka här.** Att varje enskilt tillägg är spårbart till ett mätt fel.
Mönstret genom hela lärdomsregistret är "hände två gånger → mekaniserades",
vilket är den globala över-engineering-vaktens eget kriterium för legitim
komplexitet. Och kommentarandelen (78,5 % i `ci.yml`) är en investering i
just den begriplighet underhållsfrågan efterlyser.

**Vad som proportionerligt bör förbättras.** Ett: **en ADR-karta** — inte en
sammanslagning av besluten (det vore att riva historik), utan en kuraterad
läsordning över de 30 CI-relaterade ADR:erna. Det sänker
5 900-radersströskeln utan att röra en enda mekanism. Två: **flytta
CI-avsnittet ur den alltid-laddade filen** till en pekare plus en fil som
läses vid behov; besparingen är mätbar och stor, och risken (att en agent
missar en regel) hanteras av samma pekar-disciplin `ADR-100` redan kräver.
Tre — och detta är det verkliga svaret på Marcus fråga: **ingen mekanism
frågar i dag om SUMMAN är proportionerlig.** ADR-baren prövar varje beslut
för sig, review-loopen prövar varje PR för sig, lärdomsregistret prövar varje
misstag för sig. En återkommande nedskalnings-övning (denna granskning är den
första) är den saknade motvikten.

**Kopiera INTE:** DHH:s faktiska åtgärd — att flytta CI till den egna
maskinen. Den är **mätt fel för oss** (talen ovan). Och kopiera inte
dedikerade ägar-processer med roterande ansvar (Kubernetes SIG:ar, GitLabs
handbokssida): de kräver en organisation med roller att fördela mellan
(`j4a` § 11).

### 12. Återanvändbarhet mellan repon

**Vad vi gör.** **En enda** grindvakt är kopierad till ett annat repo:
`check-frontmatter.sh` till hubben. Kopian har noll skillnader i körbar logik
— men ett faktiskt **policyvärde** har redan glidit (hubben rekommenderar
"~3 månader" där spoken säger "6 månader"), upptäckt vid mindre än sex
veckors ålder på duplikatet. Ingen av nio övriga undersökta repon bär någon
del av maskineriet (`underlag/j8-8-...` § 5).

Det finns inget mallrepo, inget bootstrap-skript och ingen checklista.
"Installationsguiden" är en kommentarsrad **inuti den fil som ska kopieras**
(§ 7 i samma underlag).

En distinktion som är lätt att förväxla: agent-lagret (pluginet med sina
hookar och skills) **ÄR** centraliserat och laddas i varje session oavsett
repo — men det är en annan axel än CI-maskineriet, och dess centralisering
bär fyra dokumenterade underhållsincidenter i repots eget lärdomsregister.

**Vad branschen gör.** Fyra etablerade mekanismer: återanvändbara
arbetsflöden (`workflow_call`), ett `.github`-specialrepo för
organisationsbrett standardvärde, mallrepon, och en organisations-ruleset som
tvingar ett gemensamt arbetsflöde. `j4a` § 12 taggar samtliga utom mallrepo
som överbyggnad eller stor-skala-motiverade, av ett enda skäl: alla fyra är
byggda för situationen "fler än ett repo behöver samma sak".

**Bedömningen: i nivå — och det är rätt läge, av rätt skäl.** Frånvaron av
spridning är **disciplin**, inte försummelse: förutsättningen för spridning
(ett andra konsumerande repo) finns inte. Att bygga en
centraliseringsmekanism nu vore precis den "lösning som letar problem" som
den globala över-engineering-vakten förbjuder.

**Vår styrka här.** Att apparaten INTE spridits till repon som inte behöver
den. Nio repon utan CI är nio repon där ingen betalat en kostnad i onödan.

**Vad som proportionerligt bör förbättras.** Ett: **gör skillnaden mellan
processpecifikt och produktspecifikt explicit nu, medan den är gratis.**
Kommer ett andra produktrepo (komponentbiblioteket i visionen) följer de
processpecifika delarna naturligt med — samma arbetsform används där — medan
de produktspecifika uttryckligen inte ska följa med. Den sorteringen görs
billigast innan den behövs. Två: gör "installationsguiden" till en kort
checklista med ett uttryckligt steg *"jämför policyvärden mot källan"* — den
enda kända instansen av kopiering gled på exakt den punkten inom sex veckor.

**Kopiera INTE:** `workflow_call` mellan repon, `.github`-specialrepot eller
den organisationstvingande workflow-regeln — inte förrän repo två faktiskt
finns. Alla tre kräver löpande synk-underhåll och bär noll värde vid ett repo
(`j4a` § 12).

### 13. Utanför de tolv: review-grinden (ADR-105) — påståendet prövat

Uppdraget ber mig pröva, inte anta, hypotesen att vi ligger FÖRE publicerad
praxis med en AI-granskare i färsk kontext. Jag prövade den mot `j4a` och mot
två egna källor, och **den håller bara delvis**.

**Vad vi gör.** Efter en bygg-agents push, och före armering, spawnas en
granskar-agent i **färsk kontext** — ett nytt anrop, aldrig ett meddelande
till bygg-agentens session. Path-reglerna injiceras ur `origin/main` med `git
show`, aldrig från PR-grenen, så en gren kan inte mildra sin egen granskning.
Utlåtandet renderas in i PR-kroppen, och ett CI-jobb på **kö-ytan**
(`review-backstopp`) fäller landningen om sektionen saknas eller är inaktuell.

**Min egen mätning av instrumenteringsloggen** (262 rader,
2026-08-28→2026-09-08, sammanräknad av mig 2026-09-17):

| Mått | Värde |
|---|---|
| Loggade granskningsrundor | 262, över 148 distinkta PR-nummer |
| Risknivå | låg 162 · medel 57 · **hög 43** (16,4 %) |
| Beslut | konvergerad 130 · eskalera-ask-user 55 · eskalera-risk 43 · ny runda 22 · eskalera-tak 12 |
| Armering tillåten | **nej i 132 av 262** (50,4 %) |
| Fynd totalt | 643 — varav 13 `error`, 133 `warning`, 497 `info` |
| Fynd riktade till Marcus | 109 |
| Rundor per PR | runda 1: 140 · 2: 85 · 3: 25 · 4: 9 · 5: 3 |

Tre observationer ur de talen, och de är mina egna.

1. **110 av 262 rundor (42 %) eskalerade till Marcus** — cirka nio per dag i
   mätfönstret. Det är grindens verkliga pris, och det priset bärs av den
   enda mänskliga parten.
2. **Rundtaket är två, men 37 loggade rundor är runda tre eller högre.** Det
   är förenligt med att Marcus beordrade fler rundor efter en eskalering, och
   det är inte ett fel. Men det bekräftar empiriskt vad `CLAUDE.md` redan
   säger rakt ut: taket *"är fortfarande ett åtagande du håller, inte ett lås
   som håller dig"*.
3. **Noll kalibreringsposter.** Alla 262 rader är av typen `korning`. Kanalen
   för att bokföra en Marcus-fångst som en grind-miss (`npm run
   review:kalibrering`) finns — men har aldrig använts. **Grindens missrate
   är därmed omätt**, och den härledda fångstraten i `review:metrics` vilar
   på en nämnare som aldrig fyllts.

**Vad branschen gör — och här faller halva påståendet.** Metas RADAR-artikel
(2026) beskriver ett **publicerat, blockerande, LLM-baserat
kodgranskningssystem**: en flerstegstratt med behörighetsgrindar, statiska
heuristiker, en maskininlärd riskpoäng per ändring, LLM-granskning och
deterministisk validering — som **godkänner och landar** kvalificerande
ändringar. 535 000+ diffar granskade, 331 000+ landade, med en
återställningsfrekvens på en tredjedel och en produktionsincidentfrekvens på
en femtiondel av icke-granskade diffar (arXiv 2605.30208, abstraktet läst av
mig 2026-09-17). Automatiserad kodgranskning i grindposition är alltså
**publicerad praxis**, inte obruten mark.

På andra änden av skalan: GitHub Copilots kodgranskning är **rådgivande som
standard** — *"Copilot leaves a 'Comment' review, not an 'Approve' review...
Copilot's reviews do not count toward required approvals"* — och möjligheten
att låta den räknas som ett krävt godkännande gick i publik förhandsvisning
först 2026-09-01, avstängd som standard.

**Bedömningen: före den etablerade normalpraxisen, inte före
frontlinjen — och unik i en detalj.**

*Inte före:* Meta gör mer, blockerande, i större skala, med publicerade
utfallstal. Vår grind är i kind samma idé, mindre.

*Före:* mot vad ett projekt av vår storlek normalt har, och mot plattformens
egen standardinställning (rådgivande kommentarer), är vår form starkare på
tre punkter: strukturell separation av utförare och granskare, policy hämtad
ur `origin/main` så en gren inte kan mildra sin egen granskning, och — den
sällsyntaste — en **deterministisk backstopp i merge-kön** som fäller en
landning utan färskt utlåtande. Varken `j4a`:s material eller mina egna
källor visar den kombinationen hos ett litet projekt.

*Den ärliga gränsen:* backstoppen bevisar att ett **utlåtande finns och är
färskt** — inte att en granskning ägt rum. PR-kroppen är skrivbar av
författaren. Det står utskrivet i repots egen styrande text, och den raden
ska inte skrivas om till att påstå mer.

**Vad som proportionerligt bör förbättras.** Ett: **använd
kalibreringskanalen.** En grind vars missrate aldrig mätts kan inte påstås
fungera — och verktyget finns redan byggt. Två: väg de 42 % eskaleringarna
mot vad de fångar: 13 `error`-fynd på 148 PR:er. Det är ett legitimt utfall
för en adversariell granskare (de flesta PR:er ÄR bra), men det är också ett
tal som bör följas över tid innan grinden växer ytterligare.

### 14. När inför branschen grindar, och hur tunga? (Marcus fråga)

Marcus formulerade under passet en fråga som hör hemma i jämförelsen.
Ordagrant, 2026-09-17:

> *"Jag har länge funderat på om jag gjort rätt eller fel genom att bygga upp
> en sådan här test-arkitektur så tidigt i projektet, jag ser att många proffs
> liksom kör direkt-PR väldigt långt in i projekten och kan därför jobba
> mycket snabbare och 'produkt-effektivare', vi har ju ganska stor fast
> overhead som tar mycket resurser, och ganska (som jag uppfattar det i alla
> fall) lång ledtid."*

Jag delar upp svaret i fyra delar, och deklarerar där precedent-rymden är
tunn i stället för att fylla ut den.

#### (1) Vad gör välrenommerade små team tidigt — och när skärper de?

**Den kanoniska källan ger ett intervall, inte en trappa.**
`trunkbaseddevelopment.com` beskriver "Committing Straight to the Trunk" som
*"Suitable for active committer counts between 1 and 100, for the same
repository"* — men tillägger att *"These days teams doing this practice are
likely to be much smaller (say less than 16) because of the advent of
alternatives"*. Sajten är också ovanligt ärlig om att tröskeln är omtvistad:
*"Super skilled XP era developers ... might say the cut-off is now 100
committers. People who've only ever know the pull-request way of working may
suggest 10 committers is the cut off point."*

**Men "direkt till trunk" betyder inte "utan kontroller" i någon av
källorna.** Samma sajt kräver att teamet kör *"the full build locally ... and
see that it pass, **before** declaring 'done' and committing/pushing"*.
Kontrollen finns — den har bara flyttat från molnet till utvecklarens
skrivbord, och bärs av en människa som ser resultatet innan hen trycker på
knappen.

**PostHog säger samma sak i klartext, och de säger det som en avvägning, inte
som en trappa.** Ur deras egen handbok: *"If we have a long process that
requires extensive QA and 10 approvals, we will never make mistakes because
we will never release anything. However, if we have no checks in place, we
will release quickly but everything will be broken."* Deras praktiska form:
*"PRs should ideally be sized to be doable in one day, including code review
and QA"*, och *"Merge anytime. Friday afternoon? Merge. Our testing,
reviewing and building process should be good enough that we're comfortable
merging any time."* De begär alltid en granskning och undviker att merga
utan.

Läs den sista meningen noga: **deras snabbhet vilar på att testprocessen
redan är tillräckligt bra.** Det är inte frånvaron av kontroller som gör dem
snabba — det är att kontrollerna är billiga nog att aldrig behöva ceremonier
ovanpå sig.

**Vad jag INTE hittade — och det är svaret på "när skärper de?".** Ingen av
de källor jag läste beskriver en livscykel-tidpunkt: ingen säger "lägg till
grind X vid första betalande kund" eller "vid första incidenten". PostHogs
handbok nämner över huvud taget inte att processen skärps när produkten
mognar; deras hållning är densamma oavsett skala. Trunk-based-sajten knyter
tröskeln till **antal samtidiga skribenter**, inte till produktens ålder
eller kundantal. **Precedent-rymden är alltså tunn på exakt den punkt frågan
gäller** — och det lilla som finns pekar på att branschen inte tänker i
mognadstrappa utan i parallellitet.

Det har en direkt konsekvens för oss, och den är obekväm: vår relevanta
variabel är inte hur långt in i projektet vi är. Det är att **5–15 skribenter
landar kod samtidigt** — vilket enligt den kanoniska källan är precis det
intervall där direkt-till-trunk slutar vara den produktiva formen.

#### (2) Är jämförelsen rättvis för ett agentdrivet flöde?

**Nej, och det finns publicerad praxis som säger varför.** Detta är den
viktigaste rättelsen jag har att göra på frågans premiss.

Proffsen som "kör direkt-PR långt in i projekten" har en sak vi inte har: en
människa som läser varje ändring innan den landar. PostHog begär alltid en
granskning. Trunk-based-sajten förutsätter att den som pushar har sett bygget
passera på sin egen skärm. Hos oss finns ingen människa i den positionen —
omkring 2 200 PR:er, varav omkring 2 100 landade, på fyra månader (rättat
efter orkestrerarens stickprov S27), utan mänskligt godkännande per PR. **Grinden
ÄR granskaren.** Frågan är alltså inte "kan vi ha lika lite grind som de?"
utan "vad ersätter det de har som vi saknar?".

Tre förstapartskällor svarar på det, och de pekar åt samma håll.

**Anthropic, om ett bygge med sexton parallella agenter.** Författaren
beskriver exakt vårt driftläge — agenterna mergade sitt eget arbete, med ett
låsmönster i stället för en människa — och formulerar villkoret rakt:
*"Claude will work autonomously to solve whatever problem I give it. So it's
important that the task verifier is nearly perfect, otherwise Claude will
solve the wrong problem."* Och, om varför en grön svit inte räcker: *"When a
human sits with Claude during development, they can ensure consistent quality
and catch errors in real time. For autonomous systems, it is easy to see
tests pass and assume the job is done, when this is rarely the case."*

**Anthropic, om långkörande agenter.** Det namngivna felläget är *"Claude's
tendency to mark a feature as complete without proper testing ... but would
fail recognize that the feature didn't work end-to-end"*, och åtgärden var
att ge agenten verktyg att pröva funktionen som en verklig användare.
Det är, ord för ord, vår svagaste dimension (§ 6: två genuina flöden av 34
filer, och utskickskedjan otestad genom hela kedjan).

**GitHub, 2026-05-07.** *"More than one in five code reviews on GitHub now
involve an agent."* Och om kapacitetsgapet: *"Throughput has scaled
exponentially. Human review capacity hasn't. The gap is widening."* Deras
rekommendation är att låta automatisk granskning gå först men behandla den
som *"a prerequisite, not a replacement"* — och de ger en regel som träffar
oss direkt: *"Any CI weakening is a hard stop."*

**Meta går längst.** RADAR är en blockerande, LLM-baserad granskningstratt
som godkänner och landar kvalificerande ändringar, byggd som svar på att
rader per landad diff växte 105,9 % på ett år med över 80 % tillskrivet
agentdriven AI. Deras svar på agentvolym var alltså **mer** automatisk
grind, inte mindre.

**Och DORA 2025 mäter samma spänning från utsidan:** högre AI-användning
hänger ihop med både högre genomströmning **och** högre instabilitet, och det
uttryckliga motmedlet är små batchar (`j4a` § 2).

**Slutsatsen, och den är entydig i materialet: ingen publicerad källa säger
att man ska grinda LÄTTARE för att agenter skriver koden. Samtliga säger
motsatsen.** Det som varierar är vilken form grinden tar — en nästan perfekt
verifierare (Anthropic), en blockerande granskningstratt (Meta), en
automatisk förgranskning plus hårda stoppregler (GitHub).

**Var precedent-rymden ändå är tunn:** samtliga publicerade fall är
organisationer med många människor bakom agenterna. Ingen har publicerat hur
tungt **en ensam ägare** med 5–15 agenter bör grinda. Vår skala har ingen
direkt precedent — men riktningen i materialet är entydig nog att jag inte
behöver en.

#### (3) Vad säger DORA om ledtid, batchstorlek och stabilitet?

Detta är delen där frågans inbyggda motsättning faller.

DORA:s egen formulering, ordagrant: *"speed and stability are not tradeoffs.
In fact, we see that the metrics are correlated for most teams."* Och: *"Top
performers do well across all five metrics, and low performers do poorly."*
Deras mått **Change Lead Time** definieras som *"the amount of time it takes
for a change to go from committed to version control to deployed in
production"*.

**"Snabbt ELLER säkert" är alltså inte rätt motsättning enligt den forskning
som mätt det längst.** Den rätta variabeln är **batchstorlek**: små
ändringar ger både kortare ledtid och lägre felfrekvens, samtidigt.

Och mätt med DORA:s eget mått är ledtiden inte vårt problem. Median från
öppnad PR till landad: **28,9 minuter** (kod 40,5, dokumentation 9,4), och
den maskinella delen är konsekvent 10–14 minuter
(`underlag/j8-7-tid-och-kostnad.md` § 4). Även med den osäkerhet `j4a` själv
flaggar kring DORA:s exakta tröskeltabell — den högsta kategorin ligger kring
"under ett dygn" enligt sekundära sammanställningar — ligger vi två
tiopotenser under den. **Upplevelsen av lång ledtid kommer inte från
maskinen.** Den kommer från att en kodändring alltid tar ~13 minuter oavsett
hur liten den är (tudelningen i § 1), och 13 av de minuterna är ett test av
testramverket.

#### (4) Min bedömning: var sitter den fasta overheaden egentligen?

**Öppet märkt som bedömning.** Jag delar overheaden i tre högar och räknar på
dem.

**Hög A — den nödvändiga kärnan för ett agentflöde.** Den skulle jag behålla
även om allt annat skars bort:

- **merge-kön plus EN fail-closed obligatorisk kontroll.** Utan den landar
  5–15 agenter ovanpå varandra. Detta är inte en mognadsfråga — det är en
  parallellitetsfråga, och den inträffade den dag agent nummer två landade
  kod, inte vid någon produktmilstolpe.
- **lint och typkontroll.** Billigast som finns, och historiskt trasig en
  gång utan att någon märkte det.
- **beroendegranskningen.** Den enda kontroll som bevisligen fångat verkliga
  sårbarheter gång på gång, inklusive ett skadligt paket innan det
  installerades (`underlag/j8-1-...` delfråga 1, rad 1).
- **de hermetiska testerna som grind.** Snabba, isolerade, och de bär redan
  regressionsskydd skrivet efter verkliga produktionsfel.
- **review-grinden.** Den är svaret på det GitHub och Anthropic båda pekar
  ut: när människan inte granskar per ändring måste något annat göra det.

Det är i stort vad som faktiskt körs på PR-ytan i dag — **minus
självtestet**.

**Hög B — overhead som betalar sig, men på fel plats eller i fel takt.**
Fyra poster, alla mätta:

| Post | Kostnad | Varför den sitter fel |
|---|---|---|
| Hermetik-självtestet i kritiska vägen | 13 min 41 s av 14 min 4 s | Skyddar mot att sviten tappar sin isolering — en långsam förändring, inte en risk i diffen |
| Fjärde körningen av samma träd (`CI [push]`) | en full svit per landning | Tillför ingen ny information alls **vid en ensam landning** (S11); vid en grupplandning är det just den som klassar hela spannet (rättat efter orkestrerarens stickprov S30) |
| `audit` på varje dokumentändring | ~30 s × varje körning | Kör även när beroendeträdet inte rörts |
| Dedupen | full komplexitet för en låg träffkvot | Mätt 3 av 20 kod-landningar (15 %), inte noll (rättat efter orkestrerarens stickprov S20). KG1 mätte samma sak från andra hållet: 32 av 32 träffar där dedupen KAN göra nytta (samma träd, kodspann; 5,3 % av 601 pushar) — den bättre signalen (SHA mot kön) finns redan |

**Detta är nästan hela den upplevda långsamheten på PR-ytan** — och inget av
det skyddar produkten bättre där det sitter än det skulle göra efter merge.

**Hög C — det som inte är CI alls, utan arbetsformens bokföring.** Fyra
processgrindar i nattnätet, backlog-stängningsgrinden (redan dömd att rivas,
S15), sessionsdok-fönstret, sanningsavstämningarna; 8 av ~20 stickprovade
komponenter klassade som processpecifika; 34 582 rader testsviter som skyddar
**grindvakternas egen logik** (`underlag/j8-8-...` §§ 1, 6).

**Min bedömning: Marcus känsla är riktig, men riktad mot fel hög.** Den fasta
overheaden är verklig och stor — men den sitter till största delen i **C**,
inte i testarkitekturen. Och C syns inte i en PR:s ledtid alls; den syns i
sessionstid, i uppmärksamhet, och i att kvoten mot produktkoden är 0,95:1 med
en ändringstakt som inte avtar. Att skära i testarkitekturen skulle träffa A
och B och lämna C orörd — alltså kosta säkerhet utan att ge tillbaka den tid
som faktiskt går förlorad.

**Gjorde vi rätt som byggde det så tidigt?** Delat svar, öppet märkt:

- **A byggdes vid rätt tidpunkt.** Utlösaren var parallellitet, och den kom
  när den kom. Den kanoniska trunk-based-källan placerar vår skribentvolym
  precis vid den gräns där PR-flöde med maskinell verifiering blir den
  produktiva formen, och samtliga agent-källor säger att grinden bär mer när
  människan granskar mindre.
- **B byggdes rätt men växte in i fel plats — och det är inte obemärkt.**
  Självtestet var en god idé som hamnade i den dyraste positionen; de andra
  tre är rester av beslut vars förutsättningar ändrats (kön kom, `strict`
  togs bort). Tillägg efter orkestrerarens stickprov S25: obalansen är känd
  sedan 2026-09-02 och kortad med hög prioritet (`TASK-366`) — samma dag som
  fyra avbrott, medan `ci-suite.yml:526-535` bokför att taket i stället
  höjdes 12→20 minuter dagen efter. Femton dagar senare (fram till denna
  granskning) är kortet fortfarande To Do: kort med hög prioritet är alltså
  inte samma sak som en åtgärdad orsak.
- **C byggdes för tidigt, och fortsätter växa av egen kraft.** Det löser
  problem arbetsformen själv skapat, och det växer med antalet sessioner —
  inte med produktens ålder eller användarantal.

**En ärlighet som måste stå med: den kontrafaktiska frågan går inte att
mäta.** Vi vet inte hur många fel som ALDRIG nådde produktion tack vare
apparaten. Vi vet att fjorton nådde den, att de flesta var designluckor ingen
automatisk grind kan se, och att en enda kontroll bevisligen fångar verkliga
saker gång på gång. Det är svagt underlag för både "det var värt det" och
"det var inte värt det" — och den som säger sig veta svaret på den frågan
gissar.

## Sammanfattande tabell

| Dimension | Bedömning | Viktigaste belägg | Proportionerlig åtgärd |
|---|---|---|---|
| 1. Snabbhet | **i nivå** på talet · **överbyggt** i orsaken | 12,5 min median (kod) mot Googles 11; självtestet 13 min 41 s av 14 min 4 s | Sätt ett uttalat tak; flytta självtestet till post-merge |
| 2. Branch-/PR-storlek | **före branschen** | median 214 rader / 22 min över 300 PR:er; push-spärren mekaniserad | Rutin för grenar utan beslut äldre än en vecka |
| 3. Required checks | **i nivå med de bästa**, före på beviset | EN required check, fail-closed, tre oberoende mätningar, noll drift på sex veckor | `paths:`-trigger på `gate-proof.yml`; villkora `audit` |
| 4. Testurval | **före** på formen · **efter** på villkoret | fem fail-safe-lager, 46 scenarier utan träff; nätet under bär ingen signal | Riv eller omformulera dedupen; vakta `quotepath` |
| 5. Hermetiska tester | **före** i mekanism · **överbyggt** i kostnad | tvåsidigt bevis utan publicerad motsvarighet; 91 % av väntetiden | Flytta självtestet; ge klassen en gräns |
| 6. Realistisk E2E | **efter branschen** | två genuina flöden av 34 filer; kontraktsvakten bevakar 7 av 18 | Kurera 5–15 flöden; stäng eller rätta kontraktsvakten |
| 7. Före/efter merge | **grinden i nivå** · **nätet långt efter** | 85 av 686 landningar utan efterkontroll (12,4 %; **60 verkliga hål** — S30/KG1); fyra körningar av samma träd (ren kostnad bara vid en ENSAM landning — S30) | Klassa hela pushade spannet FÖRST; reducera `CI [push]` bara med villkoret "sviten körde OCH var grön" (S30) |
| 8. Nattliga kontroller | **efter** — mer mekanik, mindre signal | 51 röda av 52 nätter; 21 öppna larm; nattlarmet saknar dedup; **ETT produktjobb rött 25/52 nätter, inte bara processgrindar (S30/KG1)** | Stående tråd; skilj process från produkt; verkställ `ADR-131` |
| 9. Observability/rollback | **efter** — störst avstånd, billigast att stänga | `TASK-199` öppen sedan 2026-08-11; rollback aldrig körd | `repository_dispatch` från Vercel; öva rollback en gång |
| 10. Flakighet | **före branschen** för vår skala | 0 bevisat flakiga av 100; interfolierad A/B-rigg; falsifierad motivering utskriven | Läs "N flaky" maskinellt; stäng `TASK-418` |
| 11. Underhållskostnad | **överbyggt** på processlagret · motiverat på merge-lagret | 0,95:1; 7,5 ändringar/vecka i `ci.yml`; ingen avtagande trend | ADR-karta; flytta CI-avsnittet ur alltid-laddad fil; ställ summfrågan |
| 12. Återanvändbarhet | **i nivå** — rätt läge av rätt skäl | en kopierad grindvakt, redan gliden i ett policyvärde | Sortera processpecifikt från produktspecifikt nu |
| 13. Review-grinden | **före normalpraxis**, inte före frontlinjen | Meta RADAR är publicerad blockerande praxis; vår backstopp i kön är sällsynt | Använd kalibreringskanalen — missraten är omätt |

## Det här gör vi starkt

Högst sju punkter, var och en belagd.

1. **Merge-grindens yttre ram.** En enda obligatorisk kontroll, fail-closed,
   bevisad i BÅDA riktningar mot verkliga körningar, tom bypass-lista, noll
   drift på sex veckor — mätt tre gånger oberoende (S5, `j8-5` F1–F2).
2. **Ändringsstorleken och grenlivstiden.** Median 214 rader och 22 minuter
   över 300 PR:er, med push-disciplinen delvis mekaniserad — exakt det DORA
   2025 utpekar som motmedlet mot riskerna i AI-assisterad utveckling
   (`j3` § 2, `j4a` § 2).
3. **Riskklassningens form.** Tillåtelselista, fem oberoende fail-safe-lager,
   46 prövade scenarier utan en enda felaktig hoppning — och en central
   designhandling som byggde på att LÄSA verktygets källkod i stället för att
   anta dess semantik (`j8-5` F4–F6).
4. **Det tvåsidiga hermetik-beviset.** Vi bevisar att testerna fallerar när
   isoleringen bryts, i stället för att lita på att den håller. Jag hittade
   ingen publicerad motsvarighet i `j4a`:s material (`07-...` § Testpyramiden).
5. **Flakighetsbilden och mätriggen.** 0 bevisat flakiga av 100, och en rigg
   med interfolierad A/B och belastningstal som är metodologiskt striktare än
   normalt för vår storlek (`j8-6` §§ 1, 3).
6. **Ärligheten i den styrande texten.** En falsifierad motivering skrivs ut
   i stället för att tystas (`playwright.config.ts:240`), och `ADR-083`-
   disciplinen städar prosa som påstår mekanismer. Det är den egenskap som
   gjorde DENNA granskning möjlig över huvud taget.
7. **Review-grindens deterministiska backstopp i kön.** Att en landning fälls
   utan färskt granskningsutlåtande är sällsyntare än AI-granskaren själv —
   och gränsen för vad den bevisar står ärligt utskriven (§ 13).

## Det här bör förbättras, i proportion

Högst sju, i fallande ordning av värde per krona.

1. **Nattnätets signal.** Ge nattlarmet den dedup som länklarmet redan har
   (en stående tråd, inte ett ärende per natt), och skilj processgrindar från
   produktskyddande jobb så att rött betyder en sak. 21 öppna ärenden blir 1,
   och ett femtio dygn gammalt rött blir läsbart igen (S7, S12, `j4a` § 8).
2. **Täckningsluckan efter merge.** Låt `post-merge.yml` klassa hela det
   pushade spannet i stället för bara toppens commit. Stänger 12,4 % av
   landningarna som i dag ser gröna ut utan att ha prövats (S18).
3. **Svarsloopen.** En tidsregel och en namngiven ägare för postsubmit-rött.
   Sheriff-ROLLEN kan vi inte bemanna med en person — sheriff-FUNKTIONEN kan
   vi, i den minsta publicerade formen: någon äger rött, med en gräns
   (ChromiumOS, ROS 2, Drake).
4. **Deployverifieringen.** Koppla `repository_dispatch:
   vercel.deployment.success` till ett jobb som jämför utrullad commit mot
   `main`; öva `vercel rollback` en gång och skriv runbooken. Stänger
   `TASK-199` mekaniskt och gör en oövad återställningsväg till en övad.
5. **Den kritiska vägen.** Hermetik-självtestet äger 91 % av väntetiden på
   varje kodändring och skyddar inte mot en regression i diffen. Flytta det
   dit `j4a`:s presubmit/postsubmit-princip säger att det hör hemma.
6. **De realistiska flödena.** Kurera 5–15 efter risk, med utskickskedjan
   överst (den saknar test genom hela kedjan i dag), och stäng eller rätta
   kontraktsvaktens lucka (7 av 18 bevakade, kommentaren påstår alla).
7. **Underhållsytan.** En ADR-karta över de 30 CI-ADR:erna, CI-avsnittet ut
   ur den alltid-laddade filen — och en återkommande fråga ingen mekanism
   ställer i dag: *"är summan av alla dessa välmotiverade tillägg fortfarande
   proportionerlig?"*

## Det här ska vi INTE kopiera

| Mekanism | Vem | Varför inte |
|---|---|---|
| Maskininlärt testurval · SubmitQueue · Testopedia | Meta, Uber | Alla tre kräver samma sak: ett historiskt dataset i en storleksordning vi aldrig genererar, plus ett team som underhåller modellen (`j4a` §§ 3, 4, 10) |
| Kanarie mätt i trafikprocent · Scientist-shadow | Google SRE, GitHub | Fem procent av två användare är ingen observerbar grupp; varje avvikelse är anekdotisk, inte statistisk (`j4a` § 9) |
| Beroendegrafverktyg (Nx, Bazel, Turborepo, Moon) | flera | En app är en nod. Sökvägsbaserad klassning ger samma nytta utan grafen (`j4a` §§ 1, 4) |
| TestGrid eller motsvarande dashboard | Kubernetes | Byggd för en testmatris av versioner × molnleverantörer som inte finns hos oss; en stående tråd ger samma signal (`j4a` § 8) |
| Sheriff-ORGANISATIONEN (SIG:ar, roterande ägarskap, eskaleringsvägar) | Kubernetes, GitLab | Kräver flera parter att fördela ansvar mellan. Men ta FUNKTIONEN — se förbättringspunkt 3 |
| `workflow_call` · `.github`-specialrepo · organisationstvingande workflow-regel | GitHub-plattformen | Samtliga förutsätter fler än ett konsumerande repo; de bär löpande synk-underhåll och noll värde vid ett (`j4a` § 12) |
| DHH:s faktiska åtgärd: flytta CI till den egna maskinen | 37signals | **Mätt fel för oss.** 910,7 s lokalt mot 401,0 s i CI, belastning 269 på 16 kärnor av lintning ensam, och molnminuterna är gratis (S14). Hans PRINCIP håller; hans ÅTGÄRD vänder tecken vid en agentflotta |
| Fler automatiska grindar som svar på denna granskning | — | Av sju historiskt funna hål hittades **ett** av en maskin; två av incidenter, fyra av manuell granskning (`j8-5` F10). Det som hittar hål är genomlysningar, inte vakter |
| "Proffsen kör direkt-PR, alltså kan vi grinda lättare" | allmän iakttagelse | Premissen saknar en del: de har en människa som läser varje ändring. Vi har omkring 2 200 PR:er, varav omkring 2 100 landade (rättat efter orkestrerarens stickprov S27 — inte "~2 500"), på fyra månader utan mänskligt godkännande per PR. **Ingen** publicerad källa säger att man ska grinda lättare för att agenter skriver koden — Anthropic, GitHub och Meta säger alla motsatsen (§ 14.2) |

## Där precedent-rymden var för tunn för en ärlig jämförelse

Kontraktet kräver att tunn precedens deklareras öppet i stället för att
fyllas ut. Sex ställen.

1. **Kvoten CI-maskineri : produktkod.** Inget publicerat jämförelsetal
   hittat. Närmaste familj mäter produktionskod mot **enhetstestkod**
   ("TPRatio", studerad över 82 447 projekt) — en annan sak, och jag nådde
   inte dess fördelningsvärden. Vår 0,95:1 är mätt men **ojämförbar**; den
   duger som intern trend, inte som betyg.
2. **Andel PR:er som rör CI-ytan.** Samma sak: 22,5 % är mätt, och jag
   hittade ingen publicerad motsvarighet att ställa den mot.
3. **Vår skalkombination.** En ensam utvecklare med 5–15 parallella agenter
   och ~29 landningar per dag har, som uppdraget själv förutspådde, knappast
   publicerad precedent. DHH mäter teamstorlek; Google, Meta och Uber mäter
   organisationsstorlek; ingen källa jag hittade mäter *få människor, hög
   parallellitet*. Metas RADAR är den enda som mäter den agentdrivna
   volymökningen alls — men i en organisation med tusentals ingenjörer.
4. **Vad ett team om EN person gör när nattnätet är rött.** Jag hittade
   rotationsformer för små projekt (Drake: par, en vecka, uttrycklig
   överlämning; ROS 2: en daglig morgonrutin) men ingen publicerad form för
   en ensam ägare. Rekommendationen i § 8 är därför en **härledning** ur
   rotationsformernas gemensamma nämnare, inte ett kopierat mönster.
5. **DORA:s exakta benchmarktal.** `j4a` flaggar öppet att elit/hög/medel/
   låg-tabellen kommer ur sekundära sammanställningar, inte ur originalet.
   Jag har inte stängt den luckan, och ingen slutsats ovan hänger på ett
   exakt DORA-tal — bara på riktningen.
6. **Om en Vercel-rollback pausar den automatiska git-kopplingen.** S8 lämnade
   frågan öppen inför våg 2. Min sökning i Vercels egen dokumentation gav
   rollback-kommandona, rullande releaser och `repository_dispatch` — men
   **inget svar på just den frågan**. Den kvarstår öppen, och en runbook för
   rollback måste besvara den innan den skrivs färdig.
7. **När i ett projekts livscykel branschen skärper sina grindar** (§ 14.1).
   Ingen av källorna beskriver en tidpunkt — inte första användaren, inte
   första betalande kunden, inte första incidenten. PostHogs handbok nämner
   inte att processen skärps alls när produkten mognar; trunk-based-sajten
   knyter tröskeln till antal samtidiga skribenter, inte till ålder. Att
   branschen inte tänker i mognadstrappa är i sig ett fynd — men det är ett
   fynd byggt på frånvaro, och frånvaro av bevis är inte bevis.
8. **Hur tungt en ENSAM ägare med en agentflotta bör grinda** (§ 14.2).
   Samtliga publicerade fall — Anthropics sexton parallella agenter, Metas
   RADAR, GitHubs mätning — ligger i organisationer med många människor bakom
   agenterna. Riktningen i materialet är entydig (grinden bär mer när
   människan granskar mindre), men ingen har publicerat en dosering för vår
   bemanning.

## Osäkerheter och vad jag inte kunde belägga

- **Mina bedömningar är bedömningar.** Fakta under (a) i varje dimension är
  hämtade ur våg 1:s mätningar och orkestrerarens stickprov och bär deras
  märkning. Bedömningen under (c) är min tolkning av dem mot `j4a` — den är
  argumenterad, inte mätt, och en annan läsare kan väga samma tal annorlunda,
  särskilt på dimension 1, 5 och 11 där jag sätter två betyg samtidigt.
- **Instrumenteringsloggens 148 distinkta PR-nummer mot 140 runda-1-rader**
  går inte ihop. Antingen loggades några PR:er först från runda två, eller så
  bär något PR-nummer flera runda-1-poster. Jag har inte utrett vilket —
  talen ovan står som de står, med den reservationen. **Osäker.**
- **Loggen börjar 2026-08-28.** De fjorton skarpa granskningskörningarna
  från S112 (2026-08-26) är inte backfyllda, vilket repots egen styrande text
  redan bokför. Mina andelar gäller alltså fönstret, inte grindens hela liv.
- **Jag har inte läst `underlag/j1c` och `j1d`** (CI-wirade skript och lokala
  hookar) i sin helhet — uppdraget pekade inte ut dem, och de dimensioner de
  bär täcks av stickprovsloggen (S4, S17). En bedömning av hook-lagret som
  egen dimension saknas därför här. **Ej verifierbar** utan ett eget pass.
- **Metas RADAR-tal har jag bara ur abstraktet**, inte ur artikelns
  metoddel. Talen (535 000+ granskade, återställningsfrekvens 1/3) är
  återgivna som författarna sammanfattar dem. Att systemet är blockerande
  och landar ändringar automatiskt är det som bär min slutsats, och det står
  i abstraktet.
- **Jag har inte mätt om något av våg 1:s tal.** Där ett tal är avgörande för
  en bedömning har jag i stället kontrollerat att det bekräftas av minst två
  oberoende underlag eller av stickprovsloggen — det gäller nattnätets
  rödhet (J1b, J8.5, J8.6, S7, S12), täckningsluckan (J8.4, J8.5, S18) och
  `run_staging: false` (J1a, J8.1, J8.7, 07, S1).
- **Att branschen inte publicerat något är inte att den inte gör det.** Där
  jag skriver "jag hittade ingen motsvarighet" (det tvåsidiga beviset, det
  tvåsidiga grindbeviset, backstoppen i kön) betyder det exakt det — inte att
  mekanismen är unik i världen.
- **Tredjepartsmätningar om agent-PR:er som jag medvetet lämnat utanför.**
  Sökningen för § 14 gav flera 2026-siffror om hur agentskrivna
  ändringsförslag granskas långsammare än mänskliga (bland annat en
  benchmark från ett analysföretag). Jag har **inte** nått originalen och
  bygger därför ingen slutsats på dem. De nämns här bara för att en senare
  läsare inte ska tro att jag missade dem.
- **ROS 2:s build cop-guide nådde jag inte i original.** Sidan svarade med en
  åtkomstspärr; innehållet jag återger kommer ur ett sökresultats utdrag.
  **Sekundär**, och ingen slutsats hänger på den ensam — Drakes
  rotationswiki bär samma poäng och lästes direkt.

## Risker

- **Risken att tabellen läses utan brödtexten.** Fyra av tretton rader bär
  två betyg samtidigt, och i tre av dem är det ena "före" och det andra
  "överbyggt" eller "efter". Läses bara ordet före kommat blir domen fel åt
  båda hållen.
- **Risken att "efter branschen" läses som "bygg mer".** Tre av de fyra
  "efter"-bedömningarna (dimension 7, 8, 9) handlar om en **svarsloop**, inte
  om en saknad mekanism. Vi har redan mer natt-mekanik än de projekt vi
  jämförs med. Att svara på ett signalproblem med ännu en vakt är att göra
  problemet värre.
- **Risken att den mätta kvoten 0,95:1 används som dom.** Den är ojämförbar
  (se § Där precedent-rymden var för tunn). Den säger något om trend, och
  trenden — ingen avtagande ändringstakt — är det verkliga fyndet, inte
  talet.
- **Risken att review-grindens 42 % eskaleringar läses som ett fel.** Det är
  ett utfall, inte en defekt: en adversariell granskare SKA eskalera hellre än
  att godkänna. Men det är en kostnad som bärs av den enda mänskliga parten,
  och den bör följas innan grinden växer.
- **Risken i att jag byggt tre slutsatser på en enda ny primärkälla var**
  (RADAR för dimension 13, ChromiumOS för dimension 8, Vercels
  `repository_dispatch` för dimension 9). Var och en är förstaparts och läst
  direkt, men ingen av dem är korsverifierad mot en andra källa.

## Rekommendationer

Rekommendationer till Marcus och till jobb 6 — **inte beslut**.

1. **Behandla `§ Det här bör förbättras` som en ordnad lista, inte en
   meny.** De två första punkterna (nattnätets signal, täckningsluckan) är
   billiga, reversibla och stänger den felklass hela granskningen pekar mot:
   ett grönt som inte betyder något. De bör göras först, och de bör göras
   ensamma, så att effekten går att mäta.
2. **Fatta ett uttryckligt beslut om hermetik-självtestets placering.** Det
   är den enskilt största posten i väntetiden, och frågan "presubmit eller
   postsubmit?" är precis den fråga `ADR-077` redan har ett ramverk för.
   Beslutet hör hemma i en amendering av den ADR:n, inte i en PR.
3. **Låt inte denna granskning sluta med ett tillägg.** Det starkaste
   argumentet för att komplexiteten börjat motivera sig själv är inte kvoten
   utan att **ingen mekanism ställer summfrågan**. Om granskningen resulterar
   i en ny grind har mönstret bekräftats; om den resulterar i en
   nedskalning och en återkommande summfråga har det brutits.
4. **Använd review-grindens kalibreringskanal innan grinden utvidgas.** En
   grind vars missrate aldrig mätts kan inte utvärderas, och verktyget är
   redan byggt.
5. **Besvara Vercel-frågan innan rollback-runbooken skrivs.** Om en
   återställning pausar den automatiska kopplingen mellan `main` och
   produktion har den en bieffekt på hela landningsflödet som runbooken måste
   bära. Det kräver ett skarpt prov, inte en dokumentationssökning — min
   sökning räckte inte.
6. **Om overheaden ska minska: skär i hög C, inte i hög A** (§ 14.4).
   Processbokföringens grindar är den enda av de tre högarna som varken
   skyddar produkten eller bär agentflödet — och den enda som växer med
   antalet sessioner i stället för med produkten. `ADR-131` har redan dömt en
   av dem; den domen är obetald sedan 2026-09-04. Hög B (självtestets
   placering, den fjärde körningen, `audit`-villkoret, dedupen) är nästa
   ställe att hämta tid, och där handlar det om att flytta kostnaden, inte om
   att ta bort skyddet.

## Källor

### Lokala artefakter i denna granskning (lästa, ej ändrade)

`underlag/00-agentkontrakt.md` · `underlag/01-orkestrerarens-stickprov.md`
(S1–S18) · `underlag/j4a-branschpraxis-ur-primarkallor.md` ·
`underlag/j1a-ci-yml-och-ci-suite.md` ·
`underlag/j1b-ovriga-workflows-och-github-katalogen.md` ·
`underlag/j1e-externa-installningar-och-deployvagar.md` ·
`underlag/j1f-test-bygg-och-lintkonfiguration.md` ·
`underlag/j3-push-kadens.md` ·
`underlag/j8-1-produktionsfel-och-vad-som-skyddar.md` ·
`underlag/j8-4-staging-och-e2e.md` ·
`underlag/j8-5-grindlogik-skip-och-gront.md` ·
`underlag/j8-6-stabilitet-flakighet-och-felsokning.md` ·
`underlag/j8-7-tid-och-kostnad.md` ·
`underlag/j8-8-underhall-och-andra-repon.md` · `03-andringslogg.md` ·
`04-branch-worktree-commit-och-pushflode.md` ·
`07-hermetiska-tester-kontra-realistisk-e2e.md`

### Repo-filer citerade (som `kod`, ej öppnade i detta pass utöver nedan)

`docs/reference/review-instrumentering.jsonl` (öppnad och sammanräknad av
mig, 2026-09-17) · `.markdownlint-cli2.jsonc` och `.vale.ini` (lästa för att
följa grindarna) · `.github/workflows/ci.yml`, `ci-suite.yml`,
`post-merge.yml`, `nightly.yml`, `nightly-watchdog.yml`, `gate-proof.yml`,
`playwright.config.ts`, `scripts/deny-arbetsform-push.sh`,
`scripts/check-backlog-closure.sh`, `CLAUDE.md`, `CONTRIBUTING.md`,
`docs/decisions/ADR-076`, `ADR-077`, `ADR-080`, `ADR-083`, `ADR-097`,
`ADR-100`, `ADR-105`, `ADR-131` — samtliga citerade via våg 1:s underlag med
rad- eller avsnittsangivelse där underlaget gav en.

### Webbkällor hämtade av mig i detta pass (2026-09-17)

- [arXiv 2605.30208 — RADAR: Risk Aware Diff Auto Review (Meta)](https://arxiv.org/abs/2605.30208)
  — abstraktet läst direkt; blockerande LLM-baserad granskning, 535 000+
  diffar granskade, 331 000+ landade.
- [GitHub Docs — Using Copilot code review](https://docs.github.com/en/copilot/using-github-copilot/code-review/using-copilot-code-review)
  — rådgivande som standard; godkännanden i publik förhandsvisning
  2026-09-01, avstängda som standard.
- [chromium.org — ChromiumOS Breakage and Flake Policy](https://www.chromium.org/chromium-os/developer-library/guides/testing/breakages-and-flakes/)
  — *"ChromiumOS is a revert-first project"*; sista utvägen är att markera ett
  jobb som informational/experimental/non-critical.
- [RobotLocomotion/drake-ci — Build Cop Rotation](https://github.com/RobotLocomotion/drake-ci/wiki/Build-Cop-Rotation)
  — rotation i par, en vecka, uttrycklig överlämning vid skifte (litet
  projekt, inte en storskalig organisation).
- [docs.ros.org — Build Cop and Build Farmer Guide](https://docs.ros.org/en/crystal/Contributing/Build-Cop-and-Build-Farmer-Guide.html)
  — daglig morgonrutin över nattens jobb. **Not:** sidan svarade med en
  åtkomstspärr vid mitt direktanrop; innehållet ovan kommer ur
  sökresultatets utdrag, inte ur en egen fullständig läsning. **Sekundär.**
- Vercels egen dokumentation, sökt via deras MCP-server: `vercel rollback` /
  `vercel promote` / `projects.requestRollback` / `vercel bisect`
  ([vercel.com/docs/cli/rollback](https://vercel.com/docs/cli/rollback),
  [vercel.com/docs/deployments/rollback-production-deployment](https://vercel.com/docs/deployments/rollback-production-deployment));
  rullande releaser
  ([vercel.com/docs/rolling-releases](https://vercel.com/docs/rolling-releases));
  och triggern `repository_dispatch` med typen `vercel.deployment.success`
  ([Vercel för GitHub](https://vercel.com/docs/git/vercel-for-github)).
- Sökning efter publicerade jämförelsetal för CI-/infrastrukturkod mot
  produktkod gav **inget användbart**; närmaste familj är studier av
  produktionskod mot enhetstestkod, till exempel
  [Studying the co-evolution of production and test code (Empirical Software Engineering)](https://link.springer.com/article/10.1007/s10664-010-9143-7).
  Redovisas som en lucka, inte som ett svar.

### Webbkällor för § 14 (Marcus fråga), hämtade 2026-09-17

- [trunkbaseddevelopment.com — Committing straight to the trunk](https://trunkbaseddevelopment.com/committing-straight-to-the-trunk/)
  och [Styles and Trade-offs](https://trunkbaseddevelopment.com/styles/) —
  *"Suitable for active committer counts between 1 and 100"*, *"much smaller
  (say less than 16) because of the advent of alternatives"*, den omtvistade
  tröskeln (10 mot 100 committers), och kravet att köra hela bygget lokalt
  före push.
- [PostHog — Shipping & releasing (handboken)](https://posthog.com/handbook/engineering/development-process)
  — avvägningen mellan ceremoni och hastighet, endagsregeln för PR-storlek,
  *"Merge anytime"*, och att deras hastighet vilar på att testprocessen redan
  är tillräckligt bra. **Nämner ingen skärpning vid produktmognad.**
- [Anthropic Engineering — Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
  — sexton parallella agenter som mergar sitt eget arbete; *"it's important
  that the task verifier is nearly perfect"*; *"For autonomous systems, it is
  easy to see tests pass and assume the job is done, when this is rarely the
  case."*
- [Anthropic Engineering — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
  — felläget att en agent markerar en funktion som klar utan att ha prövat
  den genom hela kedjan, och att testverktyg åtgärdade det.
- [The GitHub Blog — Agent pull requests are everywhere. Here's how to review them (2026-05-07)](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/)
  — *"More than one in five code reviews on GitHub now involve an agent"*;
  *"Throughput has scaled exponentially. Human review capacity hasn't"*;
  automatisk granskning som *"a prerequisite, not a replacement"*; *"Any CI
  weakening is a hard stop."*
- [dora.dev — DORA's software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
  — *"speed and stability are not tradeoffs. In fact, we see that the metrics
  are correlated for most teams"*; definitionen av Change Lead Time.
