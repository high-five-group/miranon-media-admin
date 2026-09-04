---
owner: marcus803
updated: 2026-08-28
review_by: 2026-11-15
status: stable
---

<!-- vale Miranon.VueToReact = NO -->
<!-- DEFERRED: Session 6.6.6 — Miranon.VueToReact Vue→React-drift fix -->
<!-- vale Vale.Terms = NO -->
<!-- Per ADR-032 (Session 6.6.6 K3.5 2026-05-20): helfil-disable mot L_X.2 Vale 3.14.1-upstream-quirk, ärvd från tasks/lessons/vol-07.md vid rotationen (S112, 2026-08-28). Brand-rule-aktivering bevarad — endast Vale.Terms täcks av helfil-disable. Lift vid upstream-fix per ADR-032 § Lift-protokoll. -->

# tasks/lessons/vol-08.md — Universella lärdomar, volym 8

> **AKTIV volym** sedan rotationen 2026-08-28 · 2026-08-28 → (L598–): Alla nya
> lärdomar tillkommer SIST i denna fil som `### Lnnn`-poster. Flat
> L-nummer-form.
>
> Ingång, uppslags- och append-regler: [`tasks/lessons.md`](../lessons.md) (indexet).
>
> **Volymens födelse:** rotationen utlöstes av indexets egen regel. S112:s
> konsolidering av 85 nummerlösa fragment ur `tasks/lessons.d/` (ADR-081) hade
> ensam tagit `vol-07.md` till 4 634 rader / 278 092 byte — både över
> rotationströskeln 3 000 och över Read-verktygets 256 KB-gräns, alltså exakt
> det läge ADR-085 finns för att förhindra. Tillägget delades därför vid en
> POSTGRÄNS: `L570`–`L597` landade i `vol-07` (2 977 rader, under
> tröskeln), `L598`–`L654` här. Samma form som `vol-07`:s egen födelse —
> volymen föds tom och fylls framåt; varje post nedan är konsoliderad ur ett
> nummerlöst fragment enligt ADR-081 (numret tilldelas vid landning).

---

## Fortsättning: flat L-numrering (ingen ny H2 per session i källan)

> Redaktionell rubrik, tillagd vid rotationen (S112, 2026-08-28) av samma skäl
> som `vol-05`:s, `vol-06`:s och `vol-07`:s motsvarande rubriker: att
> hålla giltig rubrik-hierarki (H1 → H2 → H3) där konventionen sedan Session 59
> är platta `### Lnnn`-poster utan `## Session N`-omslutning — se indexets
> not om konventionsskiftet. Posterna nedan tillkommer SIST i denna volym.
>
> **Markup-normalisering vid konsolideringen, utskriven per `L157`**
> ("Verbatim skyddar INNEHÅLL, inte MARKUP; Code får markup-normalisera men ska
> rapportera det som sådant"): fragmentens H1 blir postens `### Lnnn`-rubrik,
> och deras INRE `##`-rubriker är nedgraderade till `####`. Ingen brödtext
> är ändrad, och ingen `[UNIVERSAL]`-markörform är normaliserad — varje post
> bär den form fragmentet skrevs med.

### L598 — Ett level-triggered svep utan undantagslista larmar om medvetet parkerade poster vid VARJE varv

**Level-triggered rapportering — larma varje svep tillståndet håller, inte
bara vid övergången — är rätt design; den är immun mot den envägs-blindhet
som missar ett rött läge som redan stod rött när vakten startade. Men utan en
undantagslista blir varje MEDVETET parkerad post ett larm per varv. Varje
sådant larm är en modell-tur utan handling, och bruset gör att äkta larm
drunknar. Level-triggered och undantagslista är två halvor av samma design,
inte ett val mellan dem.**

Instans (S102, 2026-08-17, åttonde pausen): Dependabot-PR **#1488** stod
RÖD och PARKERAD i väntan på Marcus review, och larmade i varje
heartbeat-svep. Bokfört som carry-tråd med noteringen "undantagslista saknas".

**Andra instansen av samma tråd, tidigare mätt:** `T144` i
`tasks/threads/README.md` (status `paused`) — S106 väcktes **~35 gånger** av
SAMMA röda syskon-PR (`#1343`, S102:s), som den sessionen per regel aldrig
rör. Kandidatåtgärden står redan formulerad där: filtrera röda-rapporten på
egna grenar/PR:er, alternativt en undantagslista.

**Tredje instansen — FEM handjusteringar i ETT pass (S108, 2026-08-23/24):**
orkestrerarens monitor-filter justerades för hand **fem gånger** för främmande
PR:er (`#1883`, `#1896`, `#1905`, `#1917`, `#1921`) — en visual-baseline-PR
som Marcus äger, S111:s draft och S112:s löpande poster, alla RÖTT eller DIRTY
och ingen av dem sessionens att röra. Handgreppet var varje gång ett `grep -v`
på PR-numren i monitor-kommandot, eftersom `.heartbeat-svep-policy.conf` bara
bär ett FÖRFATTAR-undantag och saknar per-PR-lista. Sessionsdoket bokförde
antalet som fyra vid Del 18 § I och som fem vid pausen — kandidaten stod alltså
formulerad sedan Del 15 § C och fick fem instanser till innan någon byggde den.

**Det generella:** en vakt som inte kan skilja "detta är nytt" från "detta är
känt och accepterat" har bara ett larmläge, och det läget slits ut. Tre
oberoende sessioner har nu betalat för samma lucka — det gör den till en
designskuld med belägg, inte en irritation. Den tredje instansen lägger till
två saker de två första inte visade: (1) fem handgrepp för samma sak i ETT
pass är en mekanism-skuld, inte otur — upprepningsfrekvensen är själva
mätvärdet; (2) workarounden är FLYKTIG, eftersom filtret lever i
monitor-kommandot och inte i config — det försvinner vid varje omstart av
svepet, så kostnaden återkommer även för poster som redan filtrerats bort en
gång.

*Konsoliderad ur `tasks/lessons.d/ett-level-triggered-svep-utan-undantagslista-larmar-om-medvetet-parkerat.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L599 — finally-restore i staging-muterande test överlever inte avbrott — och driften fäller ANDRA test

**Ett staging-test som muterar delad fixtur-data och restaurerar i
`finally` är bara atomärt inom en FULLBORDAD körning. Avbryts processen
(mutex-timeout, SIGKILL, avbruten CI-runda) mellan mutationen och
restore-blocket står sentinel-värdet kvar i basen — och fixtur-driften
fäller sedan ett HELT ANNAT test deterministiskt, i varje körning, tills
någon städar för hand.**

Mätt 2026-08-17 (S104): `update-record.staging.test.ts` sätter
`Flagga = 'ZZ-S103-flagga-sentinel'` på `ZZ-History Person 01` och
restaurerar i finally. En tidigare avbruten körning lämnade sentineln;
`get-person.staging.test.ts:173` (`expect(person.flagga).toBeNull()`)
föll därefter deterministiskt — differentialmätt av 259-agenten mot ren
`origin/main` (fäller identiskt utan diff), rotorsakad av orkestreraren
via MCP-läsning av posten, städad med exakt restore-formen (tom
singleLineText → null vid läsning).

Motmedels-kandidater (design-fråga, inte gjort här): (a) sentinel-städ i
staging-CI:ns setup-purge (`ZZ-*-sentinel`-mönster i muterbara fält),
(b) självläkande fixtur-kontroll i de test som LÄSER fixturen (assert +
återställ i stället för bara assert), (c) sentinel-värden med tidsstämpel
så ålder kan skilja pågående körning från kvarlämning. Baren: (a) är
billigast och följer purge-svepets befintliga mönster.

Instanser: S104 sessionsdok Del 10 § Incidenter; 259-agentens
slutrapport § Grindarnas utfall (differentialmätningen).

*Konsoliderad ur `tasks/lessons.d/finally-restore-i-staging-test-overlever-inte-avbrott.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L600 — `gh pr checks` på en merge-SHA blandar merge_group-runs med post-merge-runs — klassa på merge_group

**Samma SHA bär två olika sorters körningar: `merge_group`-runnen som
avgjorde om posten fick landa, och post-merge-runnen som kör på `main` efteråt.
Frågar man verktyget om "checks" för den SHA:n kommer båda tillbaka blandade,
och en röd post-merge blir då oskiljbar från en röd landningsgrind. Vill du
veta om den PUSHADE COMMITEN var grön — klassa på `merge_group`-runnen, inte
på main-runnen.**

Instans (S102, 2026-08-17, DoD-driftsvepet i PR **#1508**): agenten som
korsverifierade 24 driftande DoD-poster hittade blandningen när CI-instrumentet
användes som belägg för att "pushad commit var grön" på åtta kort. Bokfört som
lesson-kandidat i Del 16-skörden, och den tolkningsburna bockningen redovisades
öppet i PR-beskrivningen för Marcus fällning.

**Det generella:** de två runnerna svarar på olika frågor. `merge_group` svarar
"fick den här diffen landa?" — det är landningsgrinden. Post-merge svarar "är
`main` frisk nu?" — ett rött utfall där kan lika gärna komma från en annan
post i samma batch, eller från en drift-detektor som inte har med diffen att
göra. Att blanda dem ger både falska underkännanden och falska godkännanden,
beroende på vilken som råkar läsas först.

*Konsoliderad ur `tasks/lessons.d/gh-pr-checks-pa-en-merge-sha-blandar-merge-group-och-post-merge.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L601 — Playwrights bundlade Chromium renderar inte PDF i iframe — facit-bilder av en PDF-yta kräver `chrome`-kanalen

**Playwrights medföljande Chromium saknar den proprietära PDF-visaren. En yta
vars innehåll ÄR en PDF (overlay-förhandsvisning, inbäddad `<iframe>`) blir
därför blank i skärmdumpen — bilden ser ut som en trasig komponent fast koden
är korrekt. Kör den bild-tagningen mot systemets riktiga Chrome
(`channel: 'chrome'`), inte mot den bundlade binären.**

Instans (S102, 2026-08-16): facit-låset för dokument-konvergensen
(`s102-dokument-konvergens`, PR **#1437**, `2253fa61`) behövde fem äkta
bilder i `tasks/sessions/bilagor/`. Overlay-bilderna gick inte att ta med
standarduppsättningen — headless bundlad Chromium renderade inte PDF:en — och
löstes med chrome-kanalen. Bokfört i sessionsdokets Del 14 och buret som
carry-kandidat genom tre pauser.

**Det generella:** en blank skärmdump är inte i sig ett bevis för en trasig
yta. Fråga först om RENDERAREN kan visa innehållsformatet alls. Klassen
gäller varje format som webbläsaren delegerar till en inbyggd visare —
PDF är den vi mätt, men resonemanget är detsamma för allt som inte är
HTML/CSS/bild.

*Konsoliderad ur `tasks/lessons.d/headless-bundlad-chromium-renderar-inte-pdf.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L602 — Identifiera och agera aldrig i samma kommandokedja när åtgärden beror på identiteten

**En kedja som först räknar fram VAD som ska åtgärdas och sedan åtgärdar det i
samma andetag har inget läge där ett människo- eller modellöga kan pröva
urvalet. Blir identifieringen fel utförs åtgärden ändå — på fel mål, utan
signal. Dela alltid i två steg: hämta identiteten, LÄS den, agera sedan på det
lästa värdet.** `[UNIVERSAL]`

Instans (S102, 2026-08-17): armeringen av PR **#1511** utfördes i en kedja där
PR-numret härleddes och användes i samma kommando. Bokfört i Del 17-skörden som
"identifiera+agera aldrig i samma kedja när åtgärden beror på identiteten".

**Varför det är en egen klass och inte bara slarv:** felet är osynligt i
efterhand. En kedja som armerade fel PR ser i loggen ut som en lyckad
armering — exitkoden är noll, texten stämmer, och det enda som är fel är
argumentet. Samma familj som repots övriga "läs innan du bygger vidare"-regler
(vakt-event är väckarklocka, aldrig fakta), fast med kortare avstånd mellan
felet och verkan.

**Formen som håller:** `X=$(kommando som identifierar)`, skriv ut `X`, och kör
åtgärden som ett SEPARAT anrop med värdet inklistrat. Kostnaden är ett extra
tool-call; alternativet är en åtgärd mot ett mål ingen granskat.

*Konsoliderad ur `tasks/lessons.d/identifiera-och-agera-aldrig-i-samma-kommandokedja.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L603 — Två parallella sessioner på samma maskin delar lastbudget — sekvensering fungerar, men bara när den kvitteras åt båda håll

**Maskinens last är en delad resurs som ingen av sessionerna äger. En session
som ensidigt drar ned sin egen flotta löser ingenting om syskonsessionen
fortsätter — och en pausorder som inte kvitteras är en förhoppning, inte en
sekvensering. Formen som mättes fungera: pausorder till egna agenter PLUS
uttryckligt, ömsesidigt kvitterad överenskommelse med den andra sessionen om
vem som får köra tungt.**

Instans (S102, 2026-08-16, "laststormen"): loadavg toppade på **577** — 19
backlog-CLI-processer (gren-skanningen) × 3 samtidiga Playwright-sviter × 2
sessioner. Hanterad med aktiv flottsekvensering: pausorder till egna agenter,
cross-session-samordning med S104 (kvitterad, ömsesidig) och prioritet till
den kritiska fixen. Bokfört i sessionsdokets Del 14.

**Bekräftad andra gången (S102, 2026-08-16/17):** samexistensen med S104
förlöpte friktionsfritt hela natten — S104 landade `#1456`/`#1458`/`#1473`/
`#1477`/`#1480`/`#1481` medan S102 byggde, och merge-kön sekvenserade
landningarna utan att någondera sessionen behövde vänta. Lasten föll från
577 till ~10 efter sekvenseringen.

**Det generella:** flottstorlek är inte en per-sessions-parameter. Vid
staging- eller CLI-tungt arbete ligger det mätta taket runt 5–6 samtidiga
agenter PER MASKIN, inte per session — och den som upptäcker lasten först
äger initiativet att kvittera en ordning med den andra.

*Konsoliderad ur `tasks/lessons.d/lastsekvensering-mellan-parallella-sessioner-fungerar-nar-den-kvitteras.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L604 — Merge-kön gör branch-toppar till icke-ancestors — "är den mergad?" avgörs via PR-status, aldrig via `merge-base`

**Kön bygger om varje post mot `main` plus posterna före den. Den commit som
faktiskt landar är därför en ANNAN commit än grenens topp, och
`git merge-base --is-ancestor <grentopp> origin/main` svarar nej på en gren
vars innehåll ligger i `main`. Avgör "landad?" på PR:ens status eller på om
fjärr-grenen finns kvar — aldrig på ancestor-relationen.**

Instans (S102, 2026-08-17, DoD-driftsvepet, PR **#1508**): svepet
korsverifierade 24 driftande poster mot belägg — **21 PR:er MERGED med exakta
SHA:n** och **37 SHA:n ancestor-prövade**. Ancestor-prövningen var just den
metod som gav fel svar på köade landningar, och klassningen fick därför vila
på PR-statusen. Bokfört som lesson-kandidat i Del 16-skörden.

**Bekräftad en gång till, direkt:** samma dag (2026-08-17) hade en agents
worktree en lokal commit (`1f086671`) som INTE var ancestor till `origin/main`
trots att motsvarande innehåll landat — `git rev-list --count HEAD..origin/main`
gav 2 och `origin/main..HEAD` gav 1. Ett rent ancestor-test hade läst det som
"olandat arbete".

**Det generella:** identiteten hos en commit är inte identiteten hos dess
innehåll. Så snart en mekanism bygger om historik — merge queue, squash,
rebase — mäter SHA-baserad släktskap bara mekaniken, inte om arbetet är
inne. Fråga plattformen som gjorde omskrivningen.

*Konsoliderad ur `tasks/lessons.d/merge-kon-gor-branch-toppar-till-icke-ancestors.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L605 — Ett per-post-CLI-anrop i en grind är kvadratklass — mät bulk-vägen innan du bygger loopen

**En grind som frågar verktyget en gång per post skalar som antal poster ×
per-anropskostnad, och båda faktorerna växer med projektet. Bär verktyget en
bulk-väg (`list --json`, ett enda anrop som läser allt) är den nästan alltid
storleksordningar billigare. Mät bulk-vägen FÖRST; skriv per-post-loopen bara
om bulk-vägen bevisligen saknar det du behöver.** `[UNIVERSAL]`

Instans (S102, 2026-08-17, `task-238`): `check-backlog-closure.sh` gjorde
**502 × `task view`** ≈ 22 minuter. Samma faktamängd låg i `task list --json`
på **1,68 s**. Omskrivningen till bulk-faktainsamling med korsvalidering (exit
2 vid oenighet mellan källorna) tog grinden från **1332 s till 14,57 s** —
landad i PR **#1503**, beslutet öppet mintat som `ADR-117`.

**Den skärpande detaljen:** kostnaden var kvadratisk, inte linjär, eftersom
varje enskilt anrop självt gjorde ett svep (gren-skanningen). Det syns aldrig
i en enstaka mätning av ETT anrop — bara i totalen. Därför räcker det inte att
multiplicera ett per-anropstal; totalen måste mätas i den kontext där den gör
ont. Den regeln har fällt oss två gånger i rad, och den står nu även i
`CLAUDE.md` § Kortnummer.

*Konsoliderad ur `tasks/lessons.d/per-post-cli-anrop-i-en-grind-ar-kvadratklass-mat-bulk-vagen-forst.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L606 — En dyr skyddsflagga stängs av där den inte skyddar något — via isolerad config, aldrig genom att mutera den riktiga

**En flagga som skyddar EN operation kostar i alla andra. Rätt svar är
varken att leva med kostnaden eller att slå av flaggan globalt, utan att köra
den icke-skyddade vägen mot en ISOLERAD config där flaggan är av — den
riktiga configen orörd, den skyddade operationen orörd.**

Instans (S102, 2026-08-16/17): `backlog/config.yml`s
`check_active_branches: true` skyddar exakt ID-allokeringen i `task create`.
Varje annat anrop betalade en full gren-skanning. ROOT_CONFIG-mönstret —
en temporär config med flaggan AV för grind-processen — mättes skarpt:
**>120 s → 3,4 s** för grindens faktainsamling. Vidareutvecklat i `TASK-250`
till `scripts/backlog-cli.sh` (`npm run bl`) med `BACKLOG_CWD`-isolering:
**7,63 s → 2,10 s**, utdata byte-identisk (verifierad med `diff`),
`create`-skanningen orörd. Landat i PR **#1505**; beslut och mätserie i
`ADR-117`.

**De två hårda kanterna, båda mätta:**

- **ALDRIG för `create`.** Det är den enda operation flaggan faktiskt
  skyddar; går den genom isoleringen är skyddet borta utan att någon märker
  det.
- **Muteras aldrig via CLI:t.** `backlog config set` är bevisat FÖRLUSTFULL
  vid round-trip (belägg: `task-238`-kortet) — isoleringen ska skapa en EGEN
  config, inte skriva om den riktiga.

**Det generella:** när en säkerhetsflagga är dyr, mät VAD den skyddar innan
du betalar för den överallt. Skyddsytan är nästan alltid smalare än
kostnadsytan, och skillnaden går att isolera bort utan att röra skyddet.

*Konsoliderad ur `tasks/lessons.d/root-config-isolering-tar-bort-en-flaggas-kostnad-dar-den-inte-skyddar.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L607 — "Skicka till mig"-flöden i icke-prod kräver att adress-spärren läses INNAN QA-planen skrivs

**En utskicksyta i staging går inte att QA:a manuellt på det uppenbara sättet,
eftersom miljön bär en adress-spärr som blockerar allt utom vitlistade
mottagare. Skrivs testplanen utan att spärren lästs beskriver den steg som är
strukturellt omöjliga att utföra — och det upptäcks först när Marcus står i
flödet. Läs spärrkonfigurationen först, och klassa om de omöjliga stegen
öppet innan planen lämnas ifrån sig.**

Instans (S102, 2026-08-17, QA 241.6): sändstegen **4/6/7/8** i testplanen var
omöjliga att köra manuellt — `RESEND_TEST_ADDRESSES` gör att staging skickar
noll brev till icke-vitlistade mottagare. Stegen omklassades öppet i PR
**#1530**; täckningen ligger i stället på 241.3/241.4-E2E plus prod-verifikat
i fas 4. En skarp 51-mottagarsändning provades och blockerades **per design** —
vilket i sig blev QA:n av fel-läget. Kortet godkändes och stängdes i PR
**#1533**.

**Det generella:** en miljös skyddsräcken är en del av dess testbarhet, inte
ett hinder man upptäcker på plats. Ett flöde vars kärna är "något lämnar
systemet" har alltid en spärr i icke-prod — läs den, skriv planen mot vad som
FAKTISKT går att göra, och lägg resten som ett uttalat prod-verifikat i stället
för att låta det se ut som en lucka.

*Konsoliderad ur `tasks/lessons.d/skicka-till-mig-floden-i-icke-prod-kraver-adress-sparr-lasning-forst.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L608 — Stämpeln låser formen — den skiljer inte form från rest

**Ett facit-lås (design-stämpel före promovering) bevarar troget ALLT som
står i den godkända ytan — inklusive prototyp-rester (noter, hjälptexter,
dev-copy) som aldrig var menade att promoveras. Stämpeln kan inte skilja
form från rest; det måste ett eget städ-pass göra FÖRE låsningen, annars
promoveras resterna bevisat pixeltroget och upptäcks först av mänsklig QA
i prod.**

Mätt 2026-08-17 (S104): Marcus stämplade prototypformen (`a40f3543`) och
promoveringen levererade den exakt — inklusive PrototypNot-texterna på
fyra ytor, en sök-hjälprad och en steg-instruktion som han sedan fann som
"fel" i prod-QA:n (249.8). Ingen mekanism brast: flippen var pixeltrogen
per kontrakt (ADR-102/103), rivningslistan tog växlar/rigg men noterna
stod inte på den, och QA-steget fångade resten — men en hel fix-skiva
(task-259, PR #1534) hade kunnat undvikas med ett rigg-städ-pass före
stämpeln.

Motmedel för nästa facit-låsning: ett explicit "vad i denna yta är REST,
inte FORM?"-pass före stämpeln — klassa varje not/hjälptext/dev-affordans
som (a) form som promoveras, (b) rigg som rivs (på rivningslistan), eller
(c) sanningsbärande interim (som "ingenting sparades"-noten, vilken ska
BESTÅ tills funktionen är riktig). Data-verklighets-fynd (154 namnlösa)
är däremot INTE stämpelns klass — de kan bara mänsklig QA mot full
prod-data fånga, och det är exakt vad 249.8-steget är till för.

Instanser: S104 sessionsdok Del 10 § Marcus QA; task-259-kortet;
Marcus fråga vid stängningen 2026-08-17 ("Vad var det jag stämplade?").

*Konsoliderad ur `tasks/lessons.d/stampeln-laser-formen-inte-resterna.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L609 — Stängningsgrenen fast-forwardas ur `main` INNAN den skapas — annars kolliderar kortets `updated_date` med sin egen landning

**En stängnings-commit (AC-bockning, `status: Done`) rör exakt den fil som
arbetets egen PR just skrev. Skapas stängningsgrenen ur en `main` som ännu
inte bär arbets-landningen får kortets `updated_date`-rad två skribenter och
mergen konflikter — på en ändring som är ren bokföring. `git fetch` +
fast-forward FÖRE `git switch -c` gör klassen strukturellt omöjlig.**

Instans (S102, 2026-08-16): `task-244`:s stängning i PR **#1429**
(`a92877d9`) fick en `updated_date`-konflikt som fick läkas för hand —
stängningsgrenen var skapad innan arbets-PR:en (#1417/#1424) hunnit landa i
`main`. Bokförd i sessionsdokets Del 14 som "ff-före-stängningsgren-
lärdomen" och buren vidare som carry-kandidat genom sjätte, sjunde och
åttonde pausen.

**Skilj den från `L440`-familjen och från `L499`.** `L499` säger att en grön
grind mot ett föråldrat träd är ett falskt godkännande — där är skadan ett
felaktigt PASS. Här är skadan en MERGE-konflikt i en fil som ägs av verktyget
(backlog-CLI:t), och den kostar en manuell läkning som lätt görs
handredigerande i stället för via CLI:t. Ordningen är därför: landa arbetet →
`git fetch` + ff → skapa stängningsgrenen → `task edit` → commit.

*Konsoliderad ur `tasks/lessons.d/stangningsgrenen-ff-as-ur-main-innan-den-skapas.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L610 — Ett facit som blir irrelevant arkivflyttas med ARKIVERAD.md och pekar-svep — det raderas aldrig

**När en yta byggs om från grunden pekar det gamla, stämplade facitet på
komponenter som inte längre finns, och facit-grinden fäller. Radering är fel
svar: kvittot på en genomförd granskning är historik som ska överleva. Formen
som gäller är ARKIVFLYTT — bilagekatalogen flyttas under
`tasks/sessions/archive/bilagor/`, en `ARKIVERAD.md` förklarar varför och vad
som ersatte den, och alla inpekningar svepas i SAMMA landning.**

Instans (S102, 2026-08-16, Marcus vägval 1): Morgonkollen (`task-243.1`, PR
**#1426**, merge `3792359d`) rev sex hem-komponenter. Facit-grinden fällde
eftersom det gamla `s55-hem-konvergens`-facitet pekade på just dem. Vägvalet
blev arkivflytt till `tasks/sessions/archive/bilagor/s55-hem-konvergens/` +
`ARKIVERAD.md` + pekar-svep — bokfört som PREJUDIKAT, inte som engångsfix.
Två självfångade verktygsfel uppstod under själva flytten (pipe-dold
checkout-exitkod och tyst `git add`-pathspec-avbrott), båda rättade öppet i
samma pass.

**Det generella:** ett stämplat facit är ett granskningskvitto med en
namngiven granskare. Grinden fäller för att kvittot pekar fel, inte för att
kvittot är värdelöst. Flytta det dit där det fortsätter vara sant (arkivet),
lämna en förklaring, och laga pekarna i samma commit — annars blir grinden
grön på bekostnad av spårbarheten.

*Konsoliderad ur `tasks/lessons.d/superseded-facit-arkivflyttas-aldrig-raderas.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L611 — `TaskStop` avslutar agenten, inte dess barnprocesser — servrar den startat lever vidare föräldralösa

**Att stoppa en agent river inte processer agenten startat. En dev-server, en
watcher eller en testrunner som agenten drog igång fortsätter köra utan
förälder, håller sin port och förbrukar last — osynlig för den som stoppade
agenten och för alla andra som senare försöker binda samma port. Städa
processen explicit, eller starta den så att den dör med sitt jobb.**
`[UNIVERSAL]`

Instans (S102, 2026-08-17, `task-239`-agentens fynd): en `vite`-process låg
kvar **föräldralös på port 5399** efter att agenten stoppats med `TaskStop`.
Bokförd som lesson-kandidat i Del 16-skörden.

**Två närliggande instanser samma dygn, samma familj:** flake-riggens `pkill`
dödade FRÄMMANDE agenters dev-servrar (fixat i `task-251`, PR **#1499**), och
`task-251` gav worktree-deriverade portar (basport + index × 1000) just för
att kollisionerna ska upphöra. Städningen och portderiveringen löser olika
halvor av samma problem: den ena att processer överlever sin ägare, den andra
att de krockar när de gör det.

**Det generella:** varje bakgrundsprocess en agent startar är ett tillstånd
som överlever agenten. Livstiden måste ägas av någon — antingen av agenten
själv (starta i förgrunden, eller döda explicit före leverans) eller av
orkestreraren (stoppas i pausen, som heartbeat-monitorn och preview-servern
gör). Det som inte ägs av någon ligger kvar tills en människa märker det.

*Konsoliderad ur `tasks/lessons.d/taskstop-river-inte-agentens-barnprocesser.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L612 — Tester skrivna mot en form som fortfarande rör sig kostar två varv — sekvensera test-PR:en EFTER form-PR:en

**När en skiva ÄNDRAR en yta och en annan skiva TESTAR samma yta är de inte
oberoende, hur väl de än mergar. Merge-kön löser textkonflikten och lämnar
kvar den semantiska: testerna beskriver formen som gällde när de skrevs.
Släpp form-PR:en först, låt den landa, och starta test-skivan mot den landade
formen — parallellisera dem inte.**

Instans (S102, 2026-08-16/17): `task-243.3` (hem-sviterna) och `task-241.2`
(svep-skalet, PR **#1464**) korsade varandras semantik. 243.3 fick rebasas till
`44649e54` och kördes i **två varv** innan sviterna matchade den form som
faktiskt landat. Bokfört som "kö-semantikkorsningen" i sjunde pausens
carry-block, med den uttryckliga slutsatsen "sekvensera test-PR efter
form-PR".

**Det generella:** merge-kön bygger varje post mot `main` plus posterna före
den, så MEKANISKA konflikter mellan parallella landningar är lösta. Vad kön
inte ser är två diffar som mergar rent och ändå är fel tillsammans — och en
testsvit mot en yta som just skrivits om är den vanligaste formen av det.
Beroendet är en ORDNING, inte en konflikt, och ordningar måste sättas av den
som ser båda skivorna.

*Konsoliderad ur `tasks/lessons.d/tester-mot-en-rorlig-form-kostar-tva-varv-sekvensera-form-fore-test.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L613 — /to-issues kopierar DoD-boilerplate över alla skivor oavsett scope

**Skiv-genereringen (/to-issues) lade IDENTISKA DoD-led på varje barn-kort
i task-249-sviten — "ariaSnapshot-referenserna låsta ur variant d FÖRE
flippen" och "check-facit grön genom flipp OCH rivning" — även på skivor
som aldrig rör prototypkoden (ren dokumentation, rena EF-skivor). Ett
DoD-led som inte kan uppfyllas av skivans eget scope är brus som varje
mottagare måste falsifiera själv.**

Mätt 2026-08-17 (S104 natt-orkestreringen): SEX oberoende bygg-agenter
(249.7, 249.2, 249.4, 249.3, 249.5, 249.9) bokförde var för sig samma
divergens — obockat led + ADR-086-kommentar på kortet. Kostnaden är låg
per instans men multipliceras med skiv-antalet, och ett bockat-av-misstag
hade varit värre än bruset.

Motmedlet hör hemma i /to-issues-processen (hubbens skill): DoD-led
scope-prövas per skiva vid genereringen — ett led som pekar på en yta
skivan inte rör utelämnas, i stället för att ärvas ur PRD-mallen. Tills
skillen är justerad är mottagar-mönstret etablerat: lämna obockat, bokför
med kommentar, bocka aldrig något som inte utförts (fem-syskon-precedentet
citerades i uppdragen från våg 2 och framåt — noll felbockningar).

Instanser: S104 sessionsdok Del 10; agenternas slutrapporter §
Avvikelser; task-249.7-kortets Comments (första bokföringen).

*Konsoliderad ur `tasks/lessons.d/to-issues-boilerplate-dod-kopieras-over-alla-skivor.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L614 — En underflotta behöver relä-fallback åt föräldern och aktiv `TaskStop` på den som redan levererat

**En agent som startar egna underagenter är ingen durabel förälder — når
underagentens leverans inte hela vägen upp finns ingen mekanism som
återförsöker. Två former som mättes rädda arbetet: (1) relä-fallback, där
orkestreraren själv hämtar hem en underflottas resultat när mellanledet
tappar det, och (2) `TaskStop` på en agent som ÄR leverans-klar men fortsätter
snurra — en förvirrad agent med färdigt arbete stannar inte av sig själv.**
`[UNIVERSAL]`

Instans (S102, 2026-08-16): 40-listans forensik
(`docs/research/40-listan-proveniens-relevans-2026-08-16.md`, PR **#1436**,
`59795b35`) kördes som underflotta. Grupp B:s resultat räddades via
relä-fallback, och huvudagenten — förvirrad men med färdig leverans — stoppades
med `TaskStop`. Bokfört i sessionsdokets Del 14 och buret som carry-kandidat
genom tre pauser.

**Det generella:** samma kontrakt som `ADR-096` slår fast för en enskild
subagent gäller ett helt led djupare. Väntan ägs av den durabla parten; ett
mellanled som självt är en Activity kan inte äga sin underflottas väntan. Den
som orkestrerar en underflotta måste därför ha en egen väg att hämta hem
resultatet, och ett aktivt sätt att avsluta en agent vars arbete redan är i
hamn.

*Konsoliderad ur `tasks/lessons.d/underflottans-leverans-behover-rela-fallback-och-aktiv-taskstop.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L615 — Ett uppdrag anger det kanoniska npm-scriptet, aldrig en handskriven kommandorad — scriptet bär miljökontraktet

**`package.json`-scripten bär miljövariabler som kommandot inte fungerar utan.
Skrivs kommandoraden av för hand in i en uppdragstext följer flaggorna med men
inte miljön, och mottagaren får ett rött utfall som ser ut som ett äkta fel.
Ange scriptnamnet (`npm run <script> -- <extra>`) och låt scriptet äga
miljön.** `[UNIVERSAL]`

Instans (S102, 2026-08-16, mätt kostnad ~1 h): `task-243.1`:s uppdragsrad
saknade `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1`. Playwrights `webServer` startade
då på fel port, och **åtta identiskt röda körningar** i rad feltolkades som
lastrelaterad flakighet innan roten hittades. Bokfört i sessionsdokets Del 14
med slutsatsen "npm-scripten bär miljökontraktet".

**Det generella:** en kommandorad i prosa är en KOPIA av ett kontrakt som bor
någon annanstans — samma kopierings-drift som repot städat bort ur styrande
dokument. Kopian tappar tyst den del som inte syns i kommandotexten (env,
`pre`/`post`-steg, `--` -vidarebefordran), och den divergensen visar sig som
ett falskt fel hos mottagaren, inte hos skribenten.

*Konsoliderad ur `tasks/lessons.d/uppdragets-kommandorad-maste-vara-det-kanoniska-npm-scriptet.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L616 — Verktygets egen vägran är en starkare vakt än din egen kontroll-loop — en trasig parsning ger falska nollor, aldrig fel

**En hemsnickrad verifierings-loop som parsar utdata rapporterar noll när
parsningen går sönder — och noll ser ut som ett rent resultat. Vakten som
faktiskt håller är verktygets EGEN vägran att utföra en osäker operation: den
kan inte tyst returnera "inget att se här". Bygg destruktiva svep så att
verktygets spärr är det som stoppar dem, inte din egen förkontroll.**
`[UNIVERSAL]`

Instans (S102, 2026-08-17, repo-städet): orkestrerarens dirty-audit-loop före
worktree-raderingen var trasig och gav **falska nollor** ur ett parsningsfel —
den rapporterade alltså att inga träd bar osparat innehåll. Det som räddade
läget var `git worktree remove`s egen spärr, som vägrade ta bort **fem** träd
med innehåll. Allt innehållsprövades därefter mot `main` före force, och två
osäkrade artefakter räddades till scratchpad. 18 worktrees togs bort (28 → 10)
och 148 lokala grenar raderades (18 med unikt innehåll taggades först).
Ärlighetspunkten är öppet bokförd i sessionsdokets Del 16.

**Det generella:** en förkontroll och en spärr misslyckas på motsatta sätt. En
förkontroll som går sönder blir PERMISSIV (noll fynd → kör på); en spärr som
går sönder blir RESTRIKTIV (vägrar → du märker det). Den asymmetrin avgör
vilken av dem som får vara sista ledet före något oåterkalleligt. Kör aldrig
`--force` på grundval av en egen loops tystnad.

*Konsoliderad ur `tasks/lessons.d/verktygets-egen-vagran-ar-en-starkare-vakt-an-din-egen-loop.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L617 — Användarens öga kan slå sex mätmetoder

Marcus såg att en logotyp låg för långt åt höger. Mätning gav sex olika svar:

| Mått | Avvikelse |
|---|---|
| bbox-centrum | 0,000 |
| kant-viktad centroid | −0,318 |
| konvext hölje | −0,483 |
| dominerande delens tyngdpunkt | −1,91 |
| alfa-centroid | +3,667 |
| viktad median | +7,615 |

**Fem av sju sade att formen redan var centrerad eller vänstertung.** Ett
research-pass visade dessutom att det mått som sade "höger" är fel modell för
en fler-delad form.

Det hade varit lätt att svara "mätningen säger att du har fel".

**I stället renderades en skala** — fem alternativ i ram med mittkors — och
Marcus pekade ut ett. Han hade dessförinnan bisekterat intervallet oberoende.

**Regeln:** när flera mätmetoder är oense finns inget objektivt facit att pröva
användarens upplevelse mot. Optisk centrering ÄR vad ögat uppfattar. Då är rätt
metod att ge ögat en skala att välja på, och låta mätningen dokumentera valet i
efterhand i stället för att överpröva det.

**Och när ögat pekar på något mätningen missar — tro på ögat först.** Marcus
observation var riktig; det var åtgärden jag föreslog som var fel (formen är
fler-delad, och ekot orsakade upplevelsen).

Instans: S107 2026-08-20, `TASK-282`.

*Konsoliderad ur `tasks/lessons.d/anvandarens-oga-kan-sla-sex-matmetoder.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L618 — Att försvara grunden när formen är frågan

Marcus dömde ut uppdateringsbannern: *"trycker ner innehållet, en
långtextsträng och en centrerad knapp."* Jag svarade med att bannerns
a11y-grund var gedigen — vilket var sant — och lade formfrågan som en fotnot
("är det rätt plats?").

Han kom tillbaka: *"Detta kan vi ju inte acceptera som 'Proffsigt'. Eller tycker
du verkligen det?"*

**Felet var inte att jag hade fel om a11y.** Det var att jag svarade på en fråga
han inte ställt, och nedgraderade den han ställde. Komponenten hade
`role="status"`, korrekt live-region-hantering, `prefers-reduced-motion`,
`print:hidden` — allt rätt. Och den såg ändå dålig ut.

**Regeln:** när någon dömer ut FORMEN, är ett försvar av FUNKTIONEN inte ett
svar. Två saker kan vara sanna samtidigt: att grunden är gedigen och att
resultatet inte duger. Att peka på den ena för att slippa den andra är att
byta ämne.

Mätningen gav honom rätt i efterhand: CLS 0,0335–0,1469 per visning, och på
390 px spränger en enda visning hela prestandabudgeten.

Instans: S107 2026-08-20.

*Konsoliderad ur `tasks/lessons.d/att-forsvara-grunden-nar-formen-ar-fragan.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L619 — Byggtidsvariabler hör i byggsystemet, inte i körsystemet

**[UNIVERSAL]**

`VITE_SENTRY_DSN` lades som hemlighet i Supabase. Men `VITE_`-variabler bakas
in i JavaScript-bundlen av Vite **vid bygget**, och bygget görs av Vercel.
Supabase-hemligheter är runtime-variabler för Edge Functions som kör på servern.
De två miljöerna möts aldrig.

**Varför det är tyst i båda ändar:** Supabase klagar inte på att ingen läser
variabeln. Bundlen klagar inte på att den saknas — den får bara `undefined`.
Ingen av parterna har anledning att säga ifrån.

**Regeln:** placera en variabel efter NÄR den läses, inte efter var den känns
hemma. Läses den när koden byggs hör den i byggsystemet. Läses den när koden kör
hör den i körsystemet. En variabel med byggverktygets prefix (`VITE_`, `NEXT_PUBLIC_`,
`REACT_APP_`) i ett runtime-hemlighetssystem är alltid fel plats.

**Och verifiera i den miljö som räknas.** Maj-sessionens checklista tillät
`npm run preview` LOKALT som verifiering — och lokalt fungerade det, eftersom
`.env.local` bar värdet. En grön verifiering i fel miljö är värre än ingen, för
den stänger frågan.

Instans: S107 2026-08-20, `T151`. 3,5 månaders tyst blindhet.

*Konsoliderad ur `tasks/lessons.d/byggtidsvariabler-hor-i-byggsystemet-inte-i-korsystemet.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L620 — En bild utan referensram kan inte besvara en fråga om placering

Jag renderade två versioner av en logotyp mot tom vit yta, med en tunn mittlinje,
och bad Marcus avgöra vilken som såg centrerad ut.

Han svarade: *"Jag kan inte avgöra mitten när jag inte har någon ram runt M:et."*

Han hade rätt. Ikonen är transparent; utan ikonytans kanter finns ingenting att
bedöma centrering MOT. Frågan gick inte att svara på, och det borde jag ha sett
innan jag ställde den.

Efter omrendering — svart ram runt ikonytan, ljusgrå botten, streckat mittkors —
kunde han inte bara svara, utan **bisekterade intervallet**: den ena för långt
höger, den andra för långt vänster, alltså ligger svaret emellan.

**Regeln:** en visuell fråga kräver det sammanhang svaret beror av. Centrering
kräver ramen. Kontrast kräver bakgrunden. Storlek kräver något att jämföra med.
Att visa objektet isolerat och fråga om dess förhållande till något som inte
syns är att be om en gissning.

**Följdfel samma dag:** jag renderade bilder och läste dem själv med Read-verktyget
— vilket visar dem för MIG, inte i användarens terminal. Marcus: *"Jag ser inga
bilder, vilka bilder refererar du till?"* En bild som bara agenten ser är inte
visad.

Instans: S107 2026-08-20.

*Konsoliderad ur `tasks/lessons.d/en-bild-utan-referensram-kan-inte-besvara-en-fraga-om-placering.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L621 — En notis som förskjuter layout får inte vara icke-blockerande

Mätt, inte tyckt. Vår uppdateringsbanner kostar per visning:

| Bredd | Bannerhöjd | CLS | `hadRecentInput` |
|---|---|---|---|
| 1440 | 49 px | 0,0335 | `false` |
| 1024 | 49 px | 0,0468 | `false` |
| 390 | **124 px** | **0,1469** | `false` |

Samma budskap överlagrat: **0,0000**, noll skiften.

`hadRecentInput: false` betyder att förskjutningen räknas fullt ut som oväntad
enligt web.devs definition (undantaget kräver inmatning inom 500 ms). **Vid
390 px spränger en enda visning hela prestandabudgetens CLS-mål.**

**Långtextsträngen är mätbart halva problemet:** 118 tecken bryts till tre rader
under 1024 px och dubblar höjden. "Den trycker ner innehållet" och "texten är
för lång" var samma invändning.

**Regeln, från designsystemen:** förskjut aldrig layout för något som inte
kräver handling nu. Carbon och Material tillåter banner i flödet för
system-budskap, men kräver placering **under app-huvudet**, inte som en remsa
över viewportens topp — och Carbon säger rakt ut *"Do not cover other content
with a banner notification."*

**Regeln, hos oss, är hårdare:** `ADR-078` beslut 4 — *"hopp i layouten är
absolut förbjudet i denna app"*. Där branschen tillåter två former väljer vår
egen regel bort den ena.

Instans: S107 2026-08-20,
`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`.

*Konsoliderad ur `tasks/lessons.d/en-notis-som-forskjuter-layout-far-inte-vara-icke-blockerande.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L622 — En omätt diagnos som färdas vidare blir en källmärkt premiss

En bygg-agent fällde ett test lokalt och klassade orsaken som en CORS-/portartefakt.
Rimligt, men **omätt**. Jag förde vidare klassningen till nästa uppdrag som en
källmärkt premiss — komplett med radnummer.

Nästa agent körde på rätt port, föll ändå, och mätte då den verkliga orsaken:
warmup-gaten (`ADR-112`), en helt annan mekanism.

**Felklassen:** en hypotes som passerar genom ett uppdrag får källmärkningens
auktoritet utan att ha förtjänat den. Mottagaren behandlar den som belagd,
eftersom formen säger att den är det.

**Regeln:** märk vidarefört material med dess faktiska evidensgrad, inte med
den grad det ärvde av att stå i en rapport. "Föregående agent klassade detta
som X, **ej mätt**" är en mening som kostar tre ord och räddar ett arbetspass.

Samma dag falsifierades två av mina egna källmärkta premisser av agenter som
prövade dem: safe zone-marginalen (0,912 hörde till en förkastad padding) och
att A11y-felen såg olika ut natt till natt (de gjorde inte det).

Att uppdragen bad agenterna PRÖVA premisserna, inte lyda dem, var enda skälet
att felen fångades.

Instans: S107 2026-08-20, `T150`.

*Konsoliderad ur `tasks/lessons.d/en-omatt-diagnos-som-fardas-vidare-blir-en-kallmarkt-premiss.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L623 — Ett tyst verktyg ser likadant ut som ett verktyg utan fynd

**[UNIVERSAL]**

Sentry visade noll fel i 3,5 månader. Det lästes som "appen är stabil". Det
betydde att `initSentry()` returnerade direkt vid varje sidladdning, eftersom
DSN:en låg i fel system (Supabase-hemlighet i stället för Vercel-byggvariabel).

**Felklassen:** ett övervakningsverktyg som inte når fram producerar exakt samma
utdata som ett verktyg som inte hittar något. Noll är tvetydigt, och tvetydigheten
löses inte av att titta längre.

Samma dag träffade samma klass två gånger till:

- **Flake-riggen** (`T148`) körde mot fel dev-server och producerade 66 falska
  fällningar — en komplett, välformad mätserie utan någon signal om att servern
  aldrig nåddes.
- **Chromes ikoncache** såg ut som en app utan uppdatering, medan den i själva
  verket aldrig laddade ner något att jämföra med.

**Regeln:** för varje verktyg som rapporterar frånvaro — noll fel, noll träffar,
inga avvikelser — måste det finnas ett sätt att skilja "inget att rapportera"
från "rapporteringen är trasig". Ett röktest som medvetet framkallar det
verktyget ska fånga är den billigaste formen.

Utan röktestet hade vi gissat "stabil app" och haft fel i tre månader till.

Instans: S107 2026-08-20, `T151`. Röktestet avgjorde på trettio sekunder vad två
timmars resonemang inte kunde.

*Konsoliderad ur `tasks/lessons.d/ett-tyst-verktyg-ser-likadant-ut-som-ett-verktyg-utan-fynd.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L624 — Halv åtgärd på två kopplade tillstånd gör läget värre

Chromes gamla appikon satt kvar. Jag tog bort Chromes ikoncache från
användarens profil — korrekt diagnos, cachen var verkligen problemet.

Men appen stod kvar som **installerad** i Chromes register, och det tog jag
inte bort. Följden: Chrome hade en installerad app vars ikonfiler saknades, och
enligt Chrome 144-regeln ingen anledning att hämta nya (manifestets `icons`-lista
var oförändrad). Den byggde en shim med macOS default-ikon.

**Före min åtgärd: gammal ikon. Efter: grå platshållarkub.** Sämre.

**Regeln:** när ett tillstånd bärs av två kopplade delar — data och registrering,
cache och index, fil och referens — river en halv åtgärd konsistensen utan att
lösa problemet. Antingen båda, eller ingen.

**Frågan att ställa innan:** vad HÅLLER ihop det här tillståndet, och rör jag
alla delar? Om svaret är "jag rör en av två" är följdfrågan vad den andra gör
när dess motpart försvinner.

Instans: S107 2026-08-20, PWA-ikonkedjan.

*Konsoliderad ur `tasks/lessons.d/halv-atgard-pa-tva-kopplade-tillstand-gor-laget-varre.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L625 — Den tysta felmatchningen är värre än den synliga orphanen — mät alltid båda halvorna av en nyckelfelsklass

**När en matchningsnyckel kan vara fel finns två utfall: nyckeln matchar
INGET (synligt: tom länk, "Utan event", en orphan-räknare) och nyckeln matchar
FEL (osynligt: allt ser kopplat ut). Den som bara mäter orphan-klassen mäter
den lilla halvan. Mät felmatchning genom att korsläsa redundanta fält —
formulärets egna textkopior mot det länkade objektets verkliga värden.**
`[UNIVERSAL]`

Instans (S110, 2026-08-21): orphan-klassen (`{Event} = BLANK()`) bar 1 rad.
Felmatchnings-klassen — anmälans formulärtext `Datum`/`Ort` ≠ det länkade
eventets — bar **64**, varav 52 låg under ett genomfört mars-event och var
obekräftade sedan maj, osynliga i varje kommande-vy. Tre tidigare sveper
(2026-04-26, 2026-08-16, 2026-08-17) hade alla mätt orphan-klassen och
förklarat basen ren.

**Det generella:** A1:s exakta nyckelmatchning var aldrig felet i sig —
felet var att ingen yta jämförde de redundanta fälten som formuläret redan
skickar med. Där redundans finns i datan finns också en gratis
konsistenskontroll; den måste bara köras. Svepet som fann de 64 tog en agent
åtta minuter.

*Konsoliderad ur `tasks/lessons.d/den-tysta-felmatchningen-ar-varre-an-den-synliga-orphanen.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L626 — En datafix utan rotfix håller till nästa inmatning — bokför roten som öppen skuld med ägare, aldrig som "utanför scope"

**När en felklass städas i datan men källan ligger utanför repots rådighet är
städningen inte en lösning utan en paus. Bokför roten som ÖPPEN SKULD med
namngiven ägare och ett datum att mäta på nytt — annars läses "sanerad" som
"löst", och nästa instans kommer ur exakt samma hål.** `[UNIVERSAL]`

Instans (S110, 2026-08-21): S107 länkade 26 orphan-anmälningar och skapade tre
saknade event 2026-08-17, mätte klassen 26 → 0 och bokförde roten som
*"Elfsight-url-parametrar på webbplatsen (Rogers fix; utanför repot)"*. Tre
dagar senare landade nästa orphan (Fredrik Björk, ID 989) via samma länk.
Ingen hade talat om för Roger vad som skulle ändras, och ingen mätte om.
Samma mönster en gång till bakåt: saneringen 2026-04-26 städade fem rader och
bokförde hypotesen "template-kod" som öppen — den prövades aldrig på fyra
månader, och visade sig fel.

**Det generella:** "utanför scope" är ett giltigt avgränsningsbeslut för
ARBETET, men ett ogiltigt slutläge för FELKLASSEN. Rätt form är tre rader:
vem äger roten, vad exakt ska ändras (här: fem URL:er, ordagrant), och när
mäts klassen igen. Saknas någon av de tre står roten kvar och städningen
upprepas — tredje gången i detta repo.

*Konsoliderad ur `tasks/lessons.d/en-datafix-utan-rotfix-haller-till-nasta-inmatning.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L627 — Läs den publika konfigurationen innan du bokför en tredje part som svart låda — widgetar som renderas i webbläsaren är läsbara utan inloggning

**En embed-widget (Elfsight, Typeform, Calendly, …) måste leverera hela sin
konfiguration till besökarens webbläsare för att kunna renderas. Den är därför
läsbar med ett `curl` mot widgetens boot-endpoint — utan konto, utan
HAR-export, utan att be ägaren om en skärmdump. Prova den vägen FÖRE du
klassar roten som "utanför vår räckvidd".** `[UNIVERSAL]`

Instans (S110, 2026-08-21): fälla F.2 hade stått öppen i fyra månader med
formuleringen "granskning av formulärets källa krävs", och S107 bokförde
roten som "Elfsight-url-parametrar — Rogers spår". Tre `curl`-anrop mot
`core.service.elfsight.com/p/boot/?w=<widget-id>` (widget-ID:n lästa ur
sidans HTML-klasser `elfsight-app-<id>`) gav hela kalenderkonfigurationen
som JSON: 39 poster med sina handskrivna anmälnings-URL:er, varav sex bar fel
`EventKey`. Rotorsaken var lokaliserad på under tio minuter, post för post,
med exakt vad som skulle rättas.

**Det generella:** samma familj som Airtable-MCP-lärdomen om automationer
(hub-CLAUDE.md § Verktygsfakta): HAR-export och skärmdumpar är sista utvägen,
inte första. Det som renderas publikt är publikt läsbart — och en
konfiguration man kan läsa är en konfiguration man kan diffa, vilket är
grunden för en driftdetektor. Caveat: endpointen är oofficiell och kan ändras;
ett schemalagt beroende av den kräver research-pass mot leverantörens villkor.

*Konsoliderad ur `tasks/lessons.d/las-den-publika-konfigurationen-innan-du-bokfor-en-tredje-part-som-svart-lada.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L628 — Trådnummer har ingen kollisionsspärr — `check_active_branches` skyddar kort-ID:n, inte trådserien

**`backlog/config.yml`s `check_active_branches: true` (TASK-93) läser andra
aktiva grenar innan CLI:t allokerar ett kort-ID. Trådnummer allokeras i stället
för hand, genom att läsa `tasks/threads/README.md` och ta nästa lediga — en
läsning av det EGNA arbetsträdet, som per definition inte ser vad en parallell
session håller på att skriva. Följden: kortnummer kolliderar sällan, trådnummer
kolliderar rutinmässigt så fort två sessioner arbetar samtidigt.**

Mätt över tre dygn i klustret S108/S109/S110, fyra instanser:

| Instans | Nummer | Vad som hände |
|---|---|---|
| 2026-08-21 | `T157` ×2 | S109 och S110 mintade samma nummer samma dag; S110 omnumrerade till `T158` |
| 2026-08-21 | `T160` | S110 läste disk, såg `T159` som högsta, men S109:s `T160` landade i synken strax före mint — fångad, S110 tog `T161` |
| 2026-08-21 | `T161` | S110 landade `T161` (`#1700`); en parallell sessions `#1701` bar samma nummer och blev DIRTY på indexraden |

Skyddet som FUNGERAR är inte en spärr utan en vana: **re-derivera numret mot
disk i mint-ögonblicket, inte ur en handoff eller ur minnet, och committa
kortet i samma andetag som du skapar det.** Den vanan fångade `T160` ovan.
`ADR-081`s regel "nummer tilldelas vid landning" avgör dessutom tvisten utan
förhandling när två anspråk ändå möts: den som landar först behåller numret,
den andra numrerar om.

Grindarna hjälper inte här. `check-thread-index.sh` fäller på dubblett-nummer
och lucka — men bara INOM ett arbetsträd, alltså först efter att kollisionen
redan skett i ett annat. Den är en konsistensvakt, inte en allokeringsvakt.

**Öppen fråga, ej besvarad här:** om trådserien ska få en mekanism motsvarande
`check_active_branches`, eller om vanan plus landnings-regeln räcker. Det är
ett avvägningsbeslut — en gren-skannande allokering kostar det `TASK-238` mätte
för kort-CLI:t (`task <id>` 1,96 s → 28,5 s med flaggan på), och trådar mintas
långt mer sällan än kort. Frågan hör hos Marcus, inte i en lärdom.

*Konsoliderad ur `tasks/lessons.d/tradnummer-har-ingen-kollisionsspärr-motsvarande-check-active-branches.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L629 — Appens resolution löser länkfel, inte textfel — en formaterings-falsk-positiv blir en permanent kö-rad

**"Koppla till event" sätter `Event` + `EventKey`. Anmälans egen
`Datum`-/`Ort`-text rörs inte. En rad som ligger i åtgärdskön för att
TEXTEN avviker i form (inte i sak) går därför inte att lösa från appen —
Lotta kan välja rätt event hur många gånger som helst, raden blir kvar.**

Mätt i S110 (2026-08-22): i staging (steg 7) låg texten rätt och
resolutionen gav `OK`; i prod låg två rader (ID 197 `+`-kodade mellanslag,
ID 960 kalenderlänkens mellanform) som resolutionen inte hade kunnat
flytta. De rättades i basen (ADR-063, spårbarhetsrad) och återfallet
bokfördes som `TASK-293`.

Designkonsekvens för `ADR-122`-familjen: det finns två felklasser i kön —
**fel länk** (resolution i appen är rätt verktyg) och **fel form på
texten** (normalisering i formel + skript är rätt verktyg, eller en
datarättning). Kön visar dem likadant. Nästa gång en kö-rad inte försvinner
efter resolution är första frågan *vilken klass*, inte *vad gick fel i
skrivningen*.

*Konsoliderad ur `tasks/lessons.d/appens-resolution-loser-lankfel-inte-textfel.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L630 — Be om skärmdumpen när användaren säger att något inte finns — argumentera inte emot

**[UNIVERSAL] Att beskriva ett UI ur dokumentation i stället för ur mätning
kostade tre varv. Skärmdumpen avgjorde på trettio sekunder det två hypoteser
inte kunde. Säger användaren "det finns inte" är nästa drag att be om
bilden, inte att förklara var det borde finnas.**

Instansen (S110 Del 7 § B, 2026-08-22): Airtables input-variabler till ett
skriptsteg VISAS i Properties-panelen men SKAPAS bakom `< > Edit code`.
Agentens första anvisning var skriven ur dokumentationen och pekade på
panelen; Marcus såg ingen variabelrad; två hypoteser prövades (placering i
kedjan, triggertyp) och föll. Skärmdumparna — A1:s panel bredvid prod-A3:s,
som bar sina variabler synligt — visade att sektionerna var identiska men
raderna saknades, och därmed var skapandet, inte visningen, frågan.

Regeln är asymmetrisk med avsikt: användarens "finns inte" är en mätning,
agentens "borde finnas" är en hypotes. Mätning slår hypotes.

*Konsoliderad ur `tasks/lessons.d/be-om-skarmdumpen-nar-anvandaren-sager-att-nagot-inte-finns.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L631 — En mätning svarar bara på den fråga den ställde — avvisning av SKAPANDE säger inget om UPPDATERING

**[UNIVERSAL] Verktygsytans avvisning gällde att skapa en `customScript`-nod.
Att UPPDATERA en befintlig nod med bevarad key var en annan operation och
stod oprövad — generaliseringen "ytan kan inte skriva skriptsteg" vilade
på en mätning av halva frågan.**

Instansen (`T167`, S110 Del 7 § A): tråden registrerades efter två
skarpa försök (skapa, före och efter villkorsgruppen) med
`readOnlyNodeType`. Vid resume 3 prövades den tredje formen — uppdatera —
med samma utfall men rakare felmeddelande. Slutsatsen höll; men den höll
för att den **prövades**, inte för att den var rimlig.

Samma klass som worktree-spärren (CLAUDE.md § Worktree-isoleringens gräns):
en avvisning berättar VAD som stoppades, inte VARFÖR, förrän man läser den
— och en mätning av en operation berättar inget om grannoperationen förrän
den också mäts. Skriv ut vilka former som prövats när en gräns bokförs, så
nästa läsare ser vad som INTE är mätt.

*Konsoliderad ur `tasks/lessons.d/en-matning-svarar-bara-pa-den-fraga-den-stallde.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L632 — Räkningen mot ett förväntat tal är instrumentet, inte bara grinden

**[UNIVERSAL] Ett kontrollsvep som räknar mot ett FÖRVÄNTAT tal fångar
exakt den post som var bokförd som olokaliserad. "5 mot väntat 4" är inte
ett larm att bocka av — det är en pekare till den femte raden.**

Instansen (`TASK-284.6` AC #2, S110 Del 10, 2026-08-22): prod-svepet efter
att `Eventmatchning` skapats gav 5 `Avviker`; Del 2:s svep hade gett 4
(3 väntar Lotta + 1 harmlös). Den femte var ID 197 med `Datum` =
`14–15+maj+2026` — URL-kodade mellanslag ur kalenderlänken — och därmed
**Event-18:s falska positiv**, öppen som "ej lokaliserad" sedan `284.1`:s
underlag och genom fyra pausblock. Ingen letade efter den; räkningen
pekade på den.

Två följder:

1. Skriv alltid ut det förväntade talet INNAN svepet körs, med härledning.
   Ett svep utan förväntan kan bara säga "N", aldrig "en för mycket".
2. Förklara varje avvikande post individuellt innan grinden bockas —
   `284.6` AC #2:s ordalydelse (*"känt och förklarat"*, *"oväntad mängd är
   ett STOPP"*) är rätt form. Här ledde förklaringen till ett datafynd, ett
   nytt kort (`TASK-293`) och en prod-kö som gick 5 → 3 innan vakten slogs
   på.

**Andra instansen lägger till en AXEL: förväntan har en RIKTNING** (S109,
2026-08-22). Efter Marcus stämpling av två facit-manifest rapporterade grinden
**24** ytor utan `referenser`. Talet skulle ha gått NED från 22 — `#1751` hade
just lagt in fälten. Avvikelsen var alltså inte en oväntad mängd utan ett tal
som rörde sig åt fel håll, och den passerade ändå obemärkt i första läsningen.
Orsaken: stämplingen hade gjorts mot en checkout tio commits efter
`origin/main`, och 24 var det gamla trädets tal.

Skriv därför ut både det förväntade talet och åt vilket håll det ska röra sig.
Ett svep vars förväntan saknar riktning kan bara jämföra storlek — och en siffra
som växt när den skulle krympa läses då som brus i stället för som det larm den
är.

*Konsoliderad ur `tasks/lessons.d/rakningen-mot-ett-forvantat-tal-ar-instrumentet-inte-bara-grinden.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L633 — En konstruktion som är korrekt i ett språk kan vara fel i ett annat med samma semantik på ytan

**[UNIVERSAL] `AND()` som inte kortsluter är ingen bugg — det är en annan
språkfamilj. En guard som är vattentät i JavaScript (`if (a === '') return`
före ett uttryck som kan kasta) är verkningslös i en Airtable-formel, där
alla argument evalueras oavsett.**

Instansen (`T168`, S110): `REGEX_EXTRACT` utan träff ger fel, inte blank.
I JavaScript var den första rättningen korrekt (`.match()` ger `null`); i
formeln evaluerades uttrycket även när tomt-guarden redan var falsk →
`#ERROR!`. Den form som ersatte den — kollaps-i-normaliseringen — valdes
inte för att den är elegantare utan för att den **inte har någon funktion
som kan fela** och därför inte behöver någon guard alls.

Regeln vid portering mellan ytor som ska bedöma likadant (här: formel och
skript): porta inte guarden — porta invarianten, och välj en konstruktion
som håller i det svagare språket. Det svagare språket sätter formen.

*Konsoliderad ur `tasks/lessons.d/samma-konstruktion-annat-sprak-and-som-inte-kortsluter.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L634 — Verifiera mot den axel ändringen rör — inte mot den tomhet befintliga fixturer råkar ha

**[UNIVERSAL] En rättning som verifieras mot BEFINTLIGA fixturer prövar den
tomhet som råkar finnas i dem, inte den axel ändringen rör. Fyra gröna
fixturer bevisar ingenting om ett fält ingen av dem har tomt.**

Instansen (`T168`, S110, 2026-08-22): datum-axelns årsblindhet rättades
först med `REGEX_EXTRACT` i Airtable-formeln, verifierades mot de fyra
permanenta fixturerna — alla gröna — och landade. Mätt på befintlig
staging-data gav samma form `#ERROR!` på **varje rad med Event-länk och
tomt `Datum`**, eftersom ingen av de fyra fixturerna hade tomt `Datum`.
Rättningen revs samma dag och ersattes; en femte permanent fixtur
(`ZZ-TASK-284.1 Fixtur Fel år`) bär nu regressionsfallet.

Regeln: innan en ändring verifieras, fråga *vilken axel rör den* — och se
till att minst en fixtur bär det **ogynnsamma** värdet på just den axeln
(tomt, fel år, fel form). `TASK-293` ärver kravet uttryckligen (en
`Fixtur Plus` för `+`-klassen) så att nästa normaliseringsändring inte
upprepar felet.

*Konsoliderad ur `tasks/lessons.d/verifiera-mot-den-axel-andringen-ror-inte-mot-fixturernas-rakade-tomhet.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L635 — En nyspawnad agents worktree grenas från orkestrerarens AKTUELLA HEAD, inte från `origin/main`

**En agent-worktree som skapas via `EnterWorktree` (eller motsvarande
spawn-mekanism) ärver orkestrerarens egen gren och dess aktuella
commit-läge vid spawn-ögonblicket — INTE en ren `origin/main`. Står
orkestreraren på en gren med ocommittat eller icke-landat arbete
(t.ex. en pågående fix-gren) ärver den nya agenten samma commits, och
måste grena om själv för att komma till en ren bas.**

**[UNIVERSAL]**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26): en agent
spawnad för `173.2` fick med sig 4 commits ur orkestrerarens pågående
`ADR-127`-fixgren och fick grena om på egen hand. Orkestrerarens worktree stod då på `fix/adr-127-radcitat` (commits
`cb249085`, `4035fe53`, `85fd5d89`, `20349964` ovanpå main) — harnesset
skapar agent-worktreen ur sessionens aktuella HEAD, inte ur
`origin/main`; samma sak drabbade bunt E-agenten.

**Det generella:** regeln är att STÅ PÅ EN REN GREN (= `origin/main`,
inte en lokal arbetsgren) INNAN nästa agent spawnas i en kedja —
annars ärver varenda spawnad agent orkestrerarens pågående, ofärdiga
arbete som sin startpunkt, vilket är exakt tvärtemot vad en isolerad
worktree är till för. Detta är den spawn-tidiga varianten av samma
princip som [[L639]]
(isolering är en per-agent-egenskap, inte automatiskt korrekt ärvd) —
här är felet inte att isoleringen saknas, utan att den BAS isoleringen
sker mot är fel.

*Konsoliderad ur `tasks/lessons.d/agent-worktrees-skapas-fran-orkestrerarens-head-inte-origin-main.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L636 — En bunt-PR med flera kort passar inte review-utlåtandets `kortId`-schema (en nullable sträng, inte en lista)

**Review-agentens utlåtande-kontrakt (`TASK-173`) har `kortId` som en
NULLABLE STRÄNG — ett fält för exakt noll eller ett kort. En PR som
samlar flera kort (en bunt-PR) tvingar granskaren att antingen klassa
hela PR:en under en enda typ (t.ex. `pr-text`/`lag`) och trycka in
AC-prövningen för samtliga kort i det fria `fynd`-fältet, i stället för
att koppla varje AC-prövning till sitt eget kort.**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26): en
5-korts-PR granskades och klassades av review-agenten som
`pr-text`/`lag`, med AC-prövningen för alla fem korten buntad i
`fynd`-fältet i stället för kopplad per kort. PR:en var `#1978` (fix-våg 4 bunt A: TASK-26/116/138/198/296); samma
klassning upprepades sedan för `#1982` (B1), `#1986`, `#1987` och `#1988`
— fem bunt-PR:er på en dag, alla `kortId: null`.

**Det generella:** schemat kodar ett implicit antagande — en PR
motsvarar ett kort — som inte håller för bunt-landningar, och en
bunt-PR är i sig ett medvetet, återkommande mönster i denna sessions
arbetsform (fix-vågor, småfix-buntar). Detta är en ÖPPEN POLICYFRÅGA
för `173.5`/`173.6`, inte en löst lärdom: antingen styr man mot ETT
kort per PR som konvention (kostar landningstakt), eller utvidgar
schemat till ett listfält för `kortId` (kostar ett schema-brott som
varje konsument av utlåtandet måste hantera). Ingen av vägarna är vald
här.

*Konsoliderad ur `tasks/lessons.d/bunt-prer-passar-inte-review-utlatandets-kortid-schema.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L637 — Closure-grindens 24-timmars-karens kan dölja färska Done-flippar som saknar sin landnings-pekare — "noll oskötta" kan vara sant bara temporärt

**En slutmätning som visar "N röda, noll oskötta" direkt efter en batch
Done-flippar kan vara sann ENDAST för att de färska flipparna ännu
ligger inom closure-grindens 24-timmars-karens — en flippad post vars
Final Summary saknar sin `Landning: PR #<nr>`-pekare (per `TASK-281`s
DoD-mekanism) blir röd så fort karensen löper ut. En slutmätning tagen
omedelbart efter flippar är alltså inte en slutlig mätning.**

Instans (S112, Del 3 § Slutmätningen + Del 4 § Handoff-verifikat,
2026-08-24→26): slutmätningen 2026-08-24 visade **14 röda av 643, noll
oskötta**. Vid resumens ommätning (2026-08-26, agent, read-only,
snapshot `179325fd`) hade talet gått till **15 röda av 650**: samma 11
poster historisk skuld + `241.5` + `284.4`, plus **`190` och `193`** —
S112:s egna våg 3-flippar (`#1943`) vars Final Summary saknar
`Landning: PR #1940`. De låg inom 24-h-karensen vid slutmätningen och
var därför osynliga då. `309.1` hade under tiden försvunnit ur listan
(en parallell S108-session flippade den).

**Det generella:** en grace-period-grind (karens) är rätt design för
att undvika att fälla en post innan dess dokumentation hunnit ikapp —
men den gör varje mätning tagen INNAN karensen löpt ut till en
ögonblicksbild med ett känt utgångsdatum, inte ett slutgiltigt facit.
En "grön" slutmätning tagen samma dag som flipparna landade måste
antingen omprövas efter karensen, eller uttryckligen flagga vilka
poster som fortfarande är inom fönstret och därför overifierade.

*Konsoliderad ur `tasks/lessons.d/closure-grindens-karens-doljer-farska-flippar.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L638 — Ett DIRTY-larm ska bära konfliktens FIL-KLASS innan en kandidat-PR pekas ut

**Ett svep som larmar DIRTY (konflikt i kön eller på en gren) ska bära
VILKEN FILKLASS som konfliktar innan orkestreraren pekar ut en
kandidat-PR som orsak. Att peka ut en kandidat på enbart larmets
tidpunkt/närhet, utan att först läsa filklassen, ger en gissning som
kan träffa fel PR.**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 3):
en hypotes om att `#1915` var konflikt-orsaken visade sig vara fel PR
och fel filklass — bakläxa given av "paket-agenten" som faktiskt löste
konflikten. Rätt orsak var paketborttagningen (`#1921`, `@tanstack/react-table` +
`motion` bort) och filklassen `package.json`/`package-lock.json`; de
DIRTY-larmade posterna var Dependabot `#1487`/`#1826` (S112 Del 2 +
Paushistorik 1 § Öppna PR:er).

**Det generella:** ett level-triggered svep (se CLAUDE.md § Svep vid
varje väckning) berättar ATT något är fel, inte VAD. Att hoppa direkt
till "vilken PR" utan att först läsa "vilken FIL" byter en mekanisk
verifiering mot en gissning grundad i tidsmässig närhet — och
tidsmässig närhet är svagt bevis i en kö med flera samtidiga
landningar.

*Konsoliderad ur `tasks/lessons.d/dirty-larm-ska-bara-filklass-fore-kandidat-utpekning.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L639 — En orkestrerare som själv EnterWorktree:at nekar Bash åt varje oisolerad agent den spawnar

**Har orkestreraren själv flyttat in i en worktree via `EnterWorktree`,
ärver varje oisolerad (t.ex. `general-purpose`) agent den sedan spawnar
INTE automatiskt samma isolering — och Bash-verktyget nekas för den
agenten. Botemedlet är att ge agenten `isolation: "worktree"` explicit
vid spawn.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24/26, Paushistorik 1 § Lesson-KANDIDATER punkt
2): mätt **två** gånger — vid hub-agentens körning och vid `173.1`:s
fresh-context-körningar. Botemedlet (`isolation: "worktree"` på
agent-anropet) verifierat fungerande i båda fallen. (Den exakta
felutskriften Bash-verktyget gav i respektive fall står inte utskriven
i källan; detalj saknas i källan.)

**Det generella:** isoleringsmekanismen (se CLAUDE.md § Worktree-
isoleringens gräns) är en egenskap hos VARJE agent för sig, inte hos
sessionen som helhet — en orkestrerare som själv sitter i en worktree
ger INTE sina barn-agenter samma isolering automatiskt, och ett
Bash-avslag hos en nyspawnad oisolerad agent är därför inte
nödvändigtvis ett fel i uppdraget utan ett tecken på att spawn-anropet
saknade isoleringsflaggan.

*Konsoliderad ur `tasks/lessons.d/eget-enterworktree-nekar-bash-at-oisolerade-agenter.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L640 — Frontmatter-grinden (`updated:` mot `git log -1 --format=%cs`) kan fälla på en PR:s ÅLDER, och på mätning mitt i en ocommittad merge

**En docs-frontmatter-grind som jämför ett dokuments egna
`updated:`-fält mot dess senaste commit-datum (`git log -1
--format=%cs`) kan fälla av två orelaterade skäl som ser identiska ut
utifrån: (1) PR:en har legat öppen så länge att merge-referensens datum
hunnit gå om `updated:`-fältet, och (2) grinden mäts MITT I en
ocommittad merge — `git log` ser då ännu inte `main`s slutgiltiga
commit, vilket ger ett falskt rött resultat som försvinner så fort
mergen committas.**

**[UNIVERSAL]**

Instans (S112 resume 1, 2026-08-26, PR `#1932` ADR-127: grinden fällde
`docs/decisions/README.md — Check 2 (updated): '2026-08-24' driftar från
git log '2026-08-26'`; den falska rödan mitt i mergen var
`CONTRIBUTING.md '2026-08-24' vs '2026-08-23'`, borta efter merge-commiten): en docs-PR som legat två dygn
fick sitt merge-ref-datum att avvika från `updated:`-fältet, och en
mätning som kördes mitt i en ocommittad merge gav falskt rött innan
mergen committats.

**Det generella:** en grind som härleder "sanning" ur `git log` mäter
KOMMITTAT tillstånd — inte avsett, inte pågående. Två distinkta
felklasser döljer sig bakom samma symptom (rött): en genuin drift
mellan dokument och verklighet (åtgärdas genom att uppdatera
`updated:`), och ett mättillfälle som helt enkelt kom för tidigt
(åtgärdas genom att committa mergen FÖRST, mäta sedan). Att blanda
ihop dem riskerar antingen en onödig dokumentändring eller ett
bortförklarat äkta rött — committa mergen, mät sedan, är den billiga
disambigueringen.

*Konsoliderad ur `tasks/lessons.d/frontmatter-grinden-faller-pa-pr-alder.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L641 — Fullt-mandat-formen — presentera besluten samlat, "Go på alla", bokför per kort med mandat-referens — fungerar som beslutsprotokoll

**Vid en samling mogna, redan-underbyggda beslut: presentera dem SAMLAT
för Marcus i en lista, låt ett enda "Go på alla" gälla mandat för hela
listan, och bokför sedan varje enskilt beslut MOT SITT EGET kort med en
referens tillbaka till mandat-ögonblicket. Formen skalar
beslutsfattandet utan att tunna ut spårbarheten per beslut.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Del 2 § Marcus-besluten + Paushistorik 1 §
Lesson-KANDIDATER punkt 7): nio presenterade beslut fick ett samlat
*"Go på alla"* (Marcus, 2026-08-24) — förkasta sex kort (`18`/`18.20`/
`30`/`39`/`40`/`42`), `TASK-281` väg (iii), kontrastspåret alternativ
(a), `TASK-173` start, paketborttagningarna (B+B), `TASK-194` stängd,
`TASK-170`/`192` stängda, `TASK-317` byggd. Varje utfall bokfördes sedan
individuellt mot sitt kort (se `#1924`, mandatbokföringen).

**Det generella:** protokollet löser en verklig spänning i
Roll-arkitekturen (hub-CLAUDE.md § Roll-arkitektur) — Marcus ska besluta
och prioritera utan att bli en review-loop för varje enskild detalj,
men varje beslut ska ändå vara spårbart till sin egen post. Ett samlat
mandat för hela listan plus en per-kort-referens tillbaka till det
mandatet ger båda: låg fråge-kostnad för Marcus, hög spårbarhet i
registret.

*Konsoliderad ur `tasks/lessons.d/fullt-mandat-formen-fungerar-som-beslutsprotokoll.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L642 — Katalogägarskaps-hooken läser hook-inputens `cwd`-fält, inte kommandosträngens `cd`

**En PreToolUse-hook som vaktar vilken katalog Bash-kommandon får rikta
git mot läser Bash-verktygets EGEN `cwd` (satt av harnesset, en gång
per agent-instans) — inte var kommandosträngen själv `cd`:ar till. `cd
<worktree> && git checkout …` fälls så länge verktygets cwd fortfarande
är huvudkatalogen, ÄVEN OM kommandot bevisligen `cd`:ar bort från den
först. Efter att cwd väl persisterat in i worktreen (en separat
mekanism) går exakt samma kommandosträng igenom utan ändring.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): `cd <worktree> && git
checkout …` fälldes när Bash-verktygets cwd var huvudkatalogen; efter
att cwd persisterat in i worktreen gick samma kommando igenom.
`EnterWorktree` svarade i det läget "is the current working directory".
Källa: sessionsdokets Del 4 § Katalogval och parallellitet, som
explicit noterar posten som "Lesson-kandidat 10 — komplement till
kandidat 2" (den om `isolation: "worktree"`,
[[L639]]).

Vidare, enligt uppdragets orkestrerar-trail (S112 resume 1,
2026-08-26; ej verifierat i den del av sessionsdoket jag läste —
flaggat separat): samma hook fäller även på TEXTMÖNSTER —
huvudkatalogens sökväg i kommandosträngen kombinerat med
`checkout`/`prune` fälls även när det FAKTISKA målet är en worktree,
och `for`-loopar klassas som "för komplexa" och fälls schablonmässigt.
Kostade orkestreraren 3 och agenter minst 2 omkörningar.

**Det generella:** en hook som ska avgöra "var pekar det här kommandot"
har två helt olika informationskällor att välja mellan — det
STRUKTURERADE tillståndet (cwd-fältet i hook-inputen, satt en gång) och
den FRIA TEXTEN (kommandosträngens `cd`/sökvägar, tolkad heuristiskt).
Denna hook använder det förra som sanning och mönstermatchar det senare
som tilläggsregel — vilket ger en förutsägbar men kontraintuitiv
avvisningsyta: kommandot kan vara korrekt i sak och ändå fällas, och
rätt åtgärd är att förändra cwd (via `EnterWorktree` eller motsvarande
persisterande mekanism), inte att skriva om kommandosträngen.

*Konsoliderad ur `tasks/lessons.d/katalogagarskaps-hooken-laser-hook-inputens-cwd-inte-cd.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L643 — Kedjade skivor sekvenseras på LANDNING, inte på agentens slutrapport

**En agents "klart"-rapport är inte samma händelse som skivans faktiska
landning på `main`. En efterföljande, beroende skiva som spawnas mot
"rapporterat klart" i stället för mot en verifierad landning riskerar att
starta mot fel bas — sekvensera nästa skiva när FÖREGÅENDES commit
faktiskt finns på `main` (eller dess merge-kö-post är bekräftad), inte
när agenten säger sig vara färdig.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 1):
kortet `TASK-243.5` gav upphov till vad sessionsdoket kallar
"243.5-felspawnen" — en kedjad efterföljande skiva spawnades innan
föregångarens landning var verifierad. Agenten själv fångade felet;
rättelsen landade som dokumentations-PR `#1917`. (Den exakta tekniska
mekanismen bakom felspawnen — vilket antagande som gjordes om
föregångarens tillstånd — står inte utskriven i källan; detalj saknas i
källan.)

**Det generella:** merge-kön (ADR-076) sekvenserar landningar seriellt,
men en orkestrerare som spawnar nästa skiva i en kedja tidigare — mot
agentens egen slutrapport — kopplar bort sig från den mekaniska
garantin kön ger. "Rapporterat klart" och "landat" är två olika
händelser med olika tidpunkter, och skillnaden mellan dem är exakt
fönstret där en kedjad skiva kan spawnas mot fel bas.

*Konsoliderad ur `tasks/lessons.d/kedjade-skivor-sekvenseras-pa-landning-inte-slutrapport.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L644 — Konsumerad armering i tät kö-trafik är ett återkommande mönster, inte en engångshändelse

**En PR:s auto-merge-armering kan konsumeras av kö-trafik (en
`failed_checks`-utsparkning, se CLAUDE.md § `autoMergeRequest: null`
betyder INTE "ej armerad") upprepade gånger inom samma session när
landningstakten är hög. Svepets disambiguerings-runda (ett andra
`gh pr merge --auto` + läsning av `isInMergeQueue`) är rätt form för
att skilja en korrekt köad PR från en som tappat sin armering — och
larmet är level-triggered: det ska hålla tills armeringen faktiskt är
återställd, inte bara vid övergången.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 4):
mätt **fem** gånger i en och samma session — `#1917`, `#1919`, `#1927`,
`#1935`, `#1940`.

**Viktig självrättelse (öppet bokförd):** Paushistorik 1:s ursprungliga
lista räknade även `#1932` hit, "×2". Det var **fel**. Del 4:s
efterforskning (resume 1, 2026-08-26) visade att `#1932` aldrig var i
kön och aldrig fick sin armering konsumerad — required-checken saknades
helt eftersom PR:en var en stackad gren som auto-retargetades till
`main` utan att `ci.yml` någonsin triggade (se den separata lärdomen
"En stackad PR som auto-retargetas till main kan bli BLOCKED för
evigt"). "Konsumerad armering ×2" var en feldiagnos av ett symptom
(`BLOCKED`, aldrig landad) som råkade se ut som klassen den listades
under. Tidslinjen bar i själva verket EN `AutoMergeEnabledEvent` och
INGA kö-händelser. De fem instanserna ovan (`#1917` m.fl.) är däremot
verifierat äkta exempel på klassen.

**Det generella:** att en PR står still olandad i en tät kö-session har
flera möjliga rotorsaker som ser identiska ut utifrån (PR:en rör sig
inte) — konsumerad armering är EN av dem, men inte den enda, och att
räkna en instans till fel klass utan att verifiera dess faktiska
tillstånd (`isInMergeQueue`, check-run-historik) upprepar precis det
fel disambiguerings-rundan finns för att förhindra.

*Konsoliderad ur `tasks/lessons.d/konsumerad-armering-i-tat-kotrafik-ar-aterkommande.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L645 — Landningskadensen brister under den tätaste orkestreringen — bokför avvikelsen öppet, skriv inte i efterhand utan att säga det

**Under en sessions tätaste orkestrerings-fas (många parallella
landningar i tät följd) hinner den löpande dokumentationen av vad som
landar inte hålla jämna steg — ett Del-avsnitt i sessionsdoket kan bli
liggande och behöva skrivas ikapp i ett svep efteråt. Det är inte i sig
ett fel, men det MÅSTE bokföras öppet som avvikelse i samma avsnitt —
aldrig tyst, som om det vore skrivet i realtid.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24): Del 2 i sessionsdoket
(`tasks/sessions/2026-08-24-session-112.md`) bär, verbatim, ingressen:
*"Komprimerad Del-landning som täcker sessionens första ~5 timmar;
skriven ikapp i ett svep (landnings-kadensen bröts under
orkestreringens tätaste fas — bokfört som avvikelse, lesson-kandidat i
skörden)."*

**Det generella:** ett sessionsdok är en filartefakt vars trovärdighet
vilar på att läsaren kan lita på ATT och NÄR något skrevs (samma
princip som gör en "premisskorrigering" farligare än ett vanligt fynd,
se lärdomen om oisolerade pass som läser fel träd,
`L555` i `tasks/lessons/vol-07.md`). En
eftersläpande Del-landning som INTE flaggar sig själv som eftersläpande
läses som samtida dokumentation trots att den inte är det — den öppna
bokföringen är vad som skiljer en accepterad avvikelse från en dold en.

*Konsoliderad ur `tasks/lessons.d/landningskadensen-brister-under-tatast-orkestrering.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L646 — Att kontrollera modell-identiteten i en forks slutrapport fångar en fork som läst fel boilerplate

**En spawnad forks slutrapport bör innehålla vilken modell (identitet)
forken faktiskt kör som. Divergerar den från vad som förväntades kan
det vara ett tecken på att forken missläst sin egen uppstarts-
boilerplate — en billig kontrollpunkt som avslöjar ett strukturellt fel
i hur forken initierades, inte bara ett innehållsfel i dess svar.**

**[UNIVERSAL]**

Instans (S112, 2026-08-24, Paushistorik 1 § Lesson-KANDIDATER punkt 6):
fångat i "triage-halva 2:s forkar" — modell-identiteten i slutrapporten
avslöjade att forkarna hade missläst fork-boilerplate. (Exakt vad
missläsningen bestod i, och vilken modell som förväntades kontra
rapporterades, står inte utskrivet i källan; detalj saknas i källan.)

**Det generella:** en fork ärver hela avsändarens kontext men körs
alltid på avsändarens egen modell — så en fork som rapporterar FEL
modell-identitet har per definition antingen förväxlat sin egen
identitet i rapporten eller läst en generisk mall i stället för det
faktiska uppdraget. Modell-identiteten är därmed ett billigt, mekaniskt
lackmustest för uppdrags-läsningens integritet, inte bara metadata.

*Konsoliderad ur `tasks/lessons.d/modell-identitet-i-slutrapport-fangar-fork-boilerplate.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L647 — Radnummer-citat i skriven dokumentation driftar — citera ankare, inte radnummer, i bevis som ska överleva

**Ett radnummer som citeras i ett ADR, ett kort eller en notering pekar
på en position som förskjuts varje gång filen ändras ovanför den raden.
Ett bevis eller en referens som citerar `rad N` är därför en
tidsstämplad sanning, inte en beständig — citera i stället ett ANKARE
(jobbnamn, stegnamn, funktionsnamn, en unik textsträng) som förblir
sant oavsett hur filen växer eller krymper ovanför.**

**[UNIVERSAL]**

Instans (S112, Del 4 § Handoff-verifikat + orkestrerarens trail,
2026-08-26): **två** instanser fångade av review-agenten samma dag.
(1) `ADR-127` citerade "rad 417" i `nightly.yml` — den faktiska raden
var **421** vid granskningstillfället (review-agenten mot `#1932`,
Sonnet 5, schema-giltigt utlåtande, risk `lag`, noterat som
info-nivå-fynd, ej error/warning). (2) `TASK-198`s notes citerade
radnummer **446/798** som drivit till **450/802** (review-agenten mot `#1978`,
Sonnet 5, klassat `warning`/`auto-fix`; rättat via `npm run bl -- task
edit 198 --notes` i commit `f41235ee` innan armering).

**Det generella:** ett radnummer är korrekt EXAKT vid det ögonblick det
skrivs och kan bli fel av vilken redigering som helst ovanför raden,
gjord av vem som helst, av vilket skäl som helst — inklusive
ORELATERADE ändringar långt från det citerade innehållet. Ett ankare
(en sökbar sträng, ett namngivet block) är stabilt mot exakt den
klassen av drift. Regeln gäller starkast för bevis som är avsedda att
ÖVERLEVA — en engångsreferens i en chattkommentar är inte samma
riskklass som ett radcitat inbakat i en ADR eller ett kort som ska
kunna verifieras månader senare.

*Konsoliderad ur `tasks/lessons.d/radnummer-citat-i-bevis-driftar.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L648 — Rått `npx backlog task edit` under fleet-drift kan ta över 120 sekunder och auto-bakgrundas — även `edit` betalar gren-skanningen

**Ett direkt (icke-wrappat) `npx backlog task edit`-anrop under samtidig
fleet-belastning (många agenter, många grenar) kan ta längre än 120
sekunder och auto-bakgrundas av harnesset. Processen fortsätter då
skriva till disk EFTER att den anropande agenten redan har committat —
en tyst race mellan bakgrundsprocessens skrivning och agentens egen
commit. `edit` betalar samma gren-skannings-kostnad som andra
`backlog`-anrop (se CLAUDE.md § Kortnummer, `check_active_branches`),
och ska därför köras via `npm run bl`-wrappern (`scripts/backlog-cli.sh`)
för allt utom `create`.**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26):
"B1-agenten" körde ett rått `npx backlog task edit`-anrop som tog
längre än 120 sekunder, auto-bakgrundades, och skrev till disk efter
agentens egen commit. (Exakt vilket kort och vilken PR detta gällde
står inte i den del av källan jag haft tillgång till; detalj saknas i
källan.)

**Det generella:** detta är en NY instans av en redan dokumenterad
kostnadsklass (CLAUDE.md § Kortnummer — verktyget skyddar, men bara
halva vägen, mätt för `task list`/`task <id>`/`task create`) — men den
utvidgar räckvidden till `task edit` specifikt, och lägger till en NY
failure-mode utöver ren tidskostnad: en bakgrundad process som skriver
EFTER agentens commit kan lämna backlog-registret i ett tillstånd som
avviker från vad agentens egen commit såg vid commit-tillfället. `npm
run bl -- task edit <id> …` undviker båda genom att köra mot en
isolerad `BACKLOG_CWD`-projektrot utan full gren-skanning.

*Konsoliderad ur `tasks/lessons.d/ratt-backlog-task-edit-under-fleet-last-tar-over-120s.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L649 — Agent-definitionsfilen laddades mitt i sessionen när en parallell session flyttade huvudkatalogen till `main` — samma bonusklass som en hook

**En ny agent-typ (definierad i `.claude/agents/<namn>.md`) kan bli
tillgänglig MITT I en pågående session, precis som en hook kan (se
CLAUDE.md § En ny hooks skarpbevis kan inte FÖRLITAS på i sessionen som
byggde den) — via harnessets filbevakare, utan att sessionen startats
om. Detta är en BONUS när det händer, aldrig en plan att förlita sig
på: en äldre laddad definition kan fungera bakåtkompatibelt utan att
den nyaste policyn/kommandot finns med.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): vid sessionens (resumens)
start saknades agent-typen `review-agent` — huvudkatalogen stod på
`f5ed41d2`, från FÖRE `#1927` (som introducerade agent-definitionen).
Efter att en parallell S108-session bytte huvudkatalogen till `main`
laddade filbevakaren `.claude/agents/review-agent.md` mitt i S112:s
session. Skarpbeviset betalades i förtid: `subagent_type:
"review-agent"` kördes mot `#1932` (Sonnet 5, 42 verktygsanrop) och gav
ett schema-giltigt utlåtande — risk `lag`, 0 error/warning, 2 info-fynd
(bl.a. radnummer-driften i `nightly.yml`, se
[[L647]]). Sessionsdoket namnger explicit
"samma bonus-klass som `task-167`" — mitt-i-sessionen-laddning tas
emot, planeras aldrig.

**Det generella:** både hookar och agent-definitioner bestäms som
utgångspunkt VID SESSIONSSTART (samma strukturella klass som
MCP-verktygsytan, se CLAUDE.md), och en ändring som landar mitt i
sessionen kan INTE förlitas på att slå igenom retroaktivt — men kan
göra det, som bonus, via harnessets filbevakare. Planera alltid för att
förändringen INTE laddas (bokför skulden öppet, betala den nästa
session), och ta emot en tidig laddning som ett giltigt skarpbevis OM
och när den faktiskt inträffar — aldrig som en förutsättning.

*Konsoliderad ur `tasks/lessons.d/review-agent-definitionen-laddades-mitt-i-sessionen.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L650 — `set -e` i ett Bash-verktygskommando propagerar inte som förväntat — en `false` mitt i kedjan stoppar INTE resten

**Ett kommando skickat till Bash-verktyget som börjar med `set -e;
false; echo x` skriver ändå ut `x`. `set -e` ska avsluta ett skript vid
första fallerande kommando, men i den form Bash-verktyget kör
kommandosträngen gäller inte det antagandet pålitligt. En kedja av
kommandon som förlitar sig på `set -e` för att stoppa vid ett fel (t.ex.
ett vale-lint-fel) kan därför fortsätta till commit+push+PR trots att
ett tidigare steg fallerade.**

**[UNIVERSAL]**

Instans (S112, orkestrerarens trail, resume 1, 2026-08-26 — exakt
vilken skarpa kedja/PR detta gällde utöver testkommandot själv står
inte i den del av källan jag haft tillgång till; detalj saknas i
källan): testkommandot `set -e; false; echo x` skrev `x` i stället för
att avbryta vid `false`. En kedja med ett vale-fel gick vidare till
commit, push och PR-skapande.

**Det generella:** lita aldrig på `set -e` ensamt för att bära
felkontroll genom en kommandokedja i Bash-verktyget — kedja med `&&`
explicit, eller fånga varje exitkod och testa den (`|| exit 1`) i
stället för att förlita sig på skalets inbyggda avbrytningsbeteende.
Detta är samma felklass som `L522` i hubben (en pipe utanför ett
skript maskerar skriptets interna `set -o pipefail`) — båda är
instanser av att en skalflaggas räckvidd är snävare än den intuitiva
läsningen antyder, och båda kräver att anroparen bär felkontrollen
explicit i stället för att förlita sig på flaggan.

*Konsoliderad ur `tasks/lessons.d/set-e-ignoreras-av-bash-verktyget.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L651 — En stackad PR som auto-retargetas till main kan bli BLOCKED för evigt utan att någon CI-körning någonsin startar

**`ci.yml`s `pull_request`-trigger lyssnar på `branches: [main]` med
default-eventtyperna (`opened`/`synchronize`/`reopened`). En PR som
öppnas mot en FEATURE-gren (stackad) och sedan auto-retargetas till
`main` via GitHubs `AutomaticBaseChangeSucceededEvent` triggar INGEN av
dessa tre händelser mot `main` — PR:en fortsätter existera, blir
`ready`, kan armeras för auto-merge, men required-checken ("CI Passed
or Skipped") saknas för evigt och `mergeStateStatus` blir `BLOCKED`.
Auto-merge väntar på en check som aldrig kommer att köras. Boten: en
commit på grenen (triggar `synchronize`) eller stäng/öppna PR:en om.**

**[UNIVERSAL]**

Instans (S112 Del 4, resume 1, 2026-08-26): `#1932` (ADR-127).
Rotorsak belagd ur tidslinjen: öppnad 15:17 mot basen `feat/task-281…`
(stackad; Marcus lämnade en draft-kommentar 15:19),
`AutomaticBaseChangeSucceededEvent` utlöstes när `#1930` landade,
`ready` 15:43:58, auto-merge armerad 15:44:01. Verifierat: **noll**
CI-körningar på head-SHA `cb249085` (`actions/runs?head_sha` = 0,
`check-runs` = 0, endast en Vercel-status). Detta hade tidigare
(Paushistorik 1) räknats som "konsumerad armering ×2" — en feldiagnos,
se den separata lärdomen
[[L644]]. Tidslinjen bar
i själva verket EN `AutoMergeEnabledEvent` och INGA kö-händelser.
Åtgärden (resumen, 2026-08-26): en commit på PR-grenen (rättade ett
radcitat, se lärdomen [[L647]]) triggade
`synchronize`, vilket gav CI, vilket lät den redan befintliga
armeringen ta PR:en utan close/reopen.

**Det generella:** GitHubs merge-kö-mekanik (se CLAUDE.md § Landning
sker via MERGE QUEUE) förutsätter att required-checks faktiskt körs mot
`main`-branchen — men ett workflow-triggervillkor som filtrerar på
`branches` ser bara PR:er som VARIT öppna mot den branchen sedan en av
de tre default-händelserna, inte en PR som ANLÄNDER dit via en
bas-ändringshändelse. En stackad PR-strategi (öppna mot en syskon-gren,
låt GitHub retargeta vid landning) är därför strukturellt
inkompatibel med en `pull_request: branches: [main]`-trigger utan
extra hantering av `AutomaticBaseChangeSucceededEvent` — och symptomet
(PR:en rör sig inte, `BLOCKED`) är identiskt med flera andra
felklasser (konsumerad armering, väntande review), vilket gör
rotorsaks-verifiering mot faktisk check-run-historik obligatorisk innan
en åtgärd väljs.

*Konsoliderad ur `tasks/lessons.d/stackad-pr-auto-retargetad-far-aldrig-ci.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L652 — Registrerade worktrees kan tyst passera dev-portschemats tak utan att någon mekanism städar dem

**Antalet registrerade worktrees kan växa förbi
`tests/support/dev-portar.ts`s portschemas tak (`MAX_INDEX`) utan att
något varnar förrän en testsvit (`test:api`) blir okörbar i de
worktrees som hamnat utanför taket. Städning av gamla worktrees är i
dagsläget ett manuellt, inte mekaniserat, steg.**

Instans (S112, Paushistorik 1 § Lesson-KANDIDATER punkt 8 + Del 4 §
Handoff-verifikat, 2026-08-24→26): vid paus (2026-08-25) stod 35
registrerade worktrees mot ett tak på `MAX_INDEX = 26`
(`tests/support/dev-portar.ts`). Vid resume-mätningen (2026-08-26, Del
4) var antalet nedgått till **15** registrerade — disk-verifierat i
sessionsdoket. Uppdraget till detta lesson-skrivpass angav vidare att
städningen landade på 35→13 och att mekaniserad städning fortfarande
saknas; det exakta sluttalet 13 och avsaknaden av ett städ-skript är
INTE verifierat i den del av sessionsdoket jag läste — disk visar 15
vid Del 4:s mättillfälle; en senare manuell städning till 13 kan ha
skett efter det (detalj saknas i det sessionsdok jag läste; källa för
"13" är uppdragets egen instruktion).

**Det generella:** ett numeriskt tak utan en egen bevakare (till
skillnad från t.ex. `check-lesson-numbers.sh` för lesson-nummer) är ett
tillstånd utan bevakare — samma T108-klass som redan är namngiven i
CLAUDE.md § Åtgärdsregeln för en armerings-kandidat. Frågan "städning +
ev. tak-höjning" är fortfarande öppen och egen (ej löst av detta pass).

*Konsoliderad ur `tasks/lessons.d/worktrees-passerar-portschemats-tak-utan-mekaniserad-stadning.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L653 — `git stash` delas av alla worktrees — en agent som stashar kan poppa en annan sessions post

**`refs/stash` bor i `.git`-common-dir och är EN lista för hela repot, inte
en per worktree. En worktree-isolerad agent som kör `git stash` följt av
`git stash pop` kan därför få ut en FRÄMMANDE post — en annan sessions
parkerade ändring — och samtidigt förskjuta den andra sessionens
index-nummer under fötterna på den. Parkera aldrig med stash i en
worktree-agent: använd `git diff > <fil>` + `git checkout -- <path>`, eller
en WIP-commit på den egna grenen, och rör aldrig `git stash` alls.**
`[UNIVERSAL]`

Mätt 2026-08-28 (S112 resume 2, `TASK-331`, PR `#2051`). Bygg-agenten
isolerade sin fixturändring för ett rött/grönt-bevis med `git stash` och
fick vid `git stash pop` ut `ed98ea55` — S108:s post *"S108 resume 13:
främmande S112-ändring av task-323 … parkerad, ej min"* — i stället för sin
egen. S108 hade under tiden rapporterat posten som droppad; listan hade alltså
redan rört sig i två sessioner samtidigt. Inget gick förlorat: agentens eget
innehåll låg kvar som en oåtkomlig commit (`8bcee4e2`, hittad med `git fsck
--unreachable`) och återställdes med `git checkout <sha> -- <path>`. Men
felet upptäcktes bara för att agenten läste vad som kom ut — en agent som
litat på pop:en hade committat en annan sessions diff i sin PR.

**Det generella:** samma klass som `TASK-322`:s huvudkatalogs-hook och
grenlistan (`TASK-323`): allt under `.git`-common-dir — grenar, stash, reflog,
`worktrees/`-registret — är delat tillstånd mellan varje session på maskinen,
och en operation som ser lokal ut i den egna worktreen (`stash`, `branch -d`,
`worktree remove`) muterar det. Fråga "bor detta i common-dir?" innan ett
git-kommando i en fleet; om ja är det en delad-tillstånds-operation och kräver
antingen ägarskap eller en form som inte kan träffa någon annans post.
Stash saknar den formen (posterna adresseras med löpnummer som skiftar när
någon annan pushar eller poppar), så regeln är binär: aldrig.

*Konsoliderad ur `tasks/lessons.d/git-stash-delas-mellan-worktrees-parkera-aldrig-med-stash.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*

### L654 — `page.evaluate` förnyar sidans user activation — därför kan `expect.poll` aldrig mäta popup-blockering

**Ska ett Playwright-test bevisa att en popup BLOCKERAS: vänta tyst
(`page.waitForTimeout`) och läs EN gång. Varje `page.evaluate` räknas som en
användargest och startar om Chromes transient activation-fönster, så ett
`expect.poll(() => page.evaluate(…))` håller popup-tillståndet vid liv under
hela sin egen väntan och gör mätningen meningslös — tyst, och med grönt
resultat på fel grund.** `[UNIVERSAL]`

Mätt (TASK-309.26, 2026-08-28, riktig Chrome med popup-blockeraren på, 6 s
fördröjning, `navigator.userActivation.isActive` avläst i samma ögonblick som
`window.open` anropades):

| väntan under de 6 sekunderna | utfall | `isActive` vid `open` |
|---|---|---|
| `page.waitForTimeout` (tyst) | BLOCKERAD | `false` |
| `page.evaluate` var 100:e ms (= det `expect.poll` gör) | **ÖPPNAD** | **`true`** |

Fällan är tyst i båda riktningarna. Skriver man den negativa kontrollen med
`expect.poll` — husets normala och annars helt riktiga sätt att vänta in ett
värde — mäter testet inte längre popup-policyn utan sin egen pollning. Den
första versionen av `dokument-forhandsgranskning-popup-policy.acceptance.
test.ts` gick i den: den mätte att en popup öppnades och trodde att den mätte
att popup-skyddet släppte igenom den.

**Skilj alltid `undefined` från ett popup-fynd.** Samma test fällde senare med
`Received: undefined` i full parallell svit men passerade ensamt. Orsaken var
en ANNAN: den flik testet öppnat hade fokus, vilket gör appens sida till en
BAKGRUNDSFLIK — och Chrome strypar timers i bakgrundsflikar, så 6 s-timern
drog långt över sin tid under last. `nyFlik.close()` + `page.bringToFront()`
före den negativa kontrollen löser det (förmätning: öppen respektive stängd
flik gav båda BLOCKERAD, så stängningen påverkar inte vad som mäts). En tyst
väntan kan inte anpassa sig efter last, så marginalen ska vara tilltagen —
och en explicit `toBeDefined()` före huvudassertionen skiljer "handlern hann
inte köra" från "popupen öppnades".

**Bakgrund som gör lärdomen värd att minnas:** hela anledningen att mätningen
behövdes är att Playwrights BUNDLADE Chromium aldrig blockerar en popup —
`chromiumSwitches` (`playwright-core` 1.62.1, `lib/coreBundle.js`) skickar
`--disable-popup-blocking` vid varje launch, och även med den flaggan
BORTTAGEN (verifierat i processens kommandorad via `ps`) öppnades en popup
helt utan användargest. Ett popup-bevis kräver därför `channel: 'chrome'`
PLUS `ignoreDefaultArgs: ['--disable-popup-blocking']`; utan båda mäter man
ingenting. `launchOptions` går bara att sätta top-level i en fil, aldrig i
ett `describe`-block ("Cannot use({ launchOptions }) in a describe group,
because it forces a new worker").

*Konsoliderad ur `tasks/lessons.d/playwright-page-evaluate-fornyar-user-activation-och-forstor-popup-matning.md` (S112 resume 2, fragment-vägen `ADR-081`); fragmentet är borttaget.*
