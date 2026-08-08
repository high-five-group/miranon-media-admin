---
owner: marcus803
updated: 2026-08-08
review_by: 2027-02-08
status: draft
---

# Prototypkod-isolering och parallella arbetsströmmar: branschmönster (RP3, Code, 2026-08-08)

> **Proveniens:** avgränsat research-pass (RP3) beställt av orkestreraren
> 2026-08-08 som underlag för grillningarna G3 och G6 i processauditen S93
> (`docs/research/processaudit-syntes-och-grillningsunderlag-2026-08-08.md`,
> gren `docs/s93-processaudit-underlag`, ej ännu mergad — läst via
> `git show origin/...`). Ingen kod, inget kort och ingen ADR ändrad — enda
> leveransen är denna fil. Dev-servern på 5173 rördes inte, inga
> git-mutationer gjordes.

## Vad jag hittade FÖRST — och vad som därför är nytt här

Före första externa sökning lästes de två interna underlagsfilerna i sin
helhet, plus ADR-074, ADR-102, ADR-044 och sex tidigare research-pass som
redan täcker delar av delfråga (d):

| Källa | Vad den redan täcker | Ålder/skick |
|---|---|---|
| `adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md` | R7/R8 mätt mot kod; options-rymderna O1–O4 (R7) och O1–O4 (R8) formulerade men uttryckligen **omätta mot branschprecedent** ("Research-behov, öppet deklarerat") | Samma dag |
| `processaudit-syntes-och-grillningsunderlag-2026-08-08.md` | K1–K8 klustrade ur tidslinjen; K1 och K6 pekas ut som RP3:s mål | Samma dag |
| `kodfils-partitionering-parallella-agenter-2026-08-04.md` | Fil-nivå-kollisioner mellan parallella agenter: claims-check + `git merge-tree`-grind är **redan verifierat branschmönster** (9+ system) | 4 dagar — premisser oförändrade (ingen kodändring i mekanismklassen sedan dess) |
| `nummerallokering-parallella-aktorer-2026-07-29.md` | Nummerkollisioner i delad serie (ADR/tråd/kort): derivera-mot-disk + committa-direkt är etablerad mönsterfamilj | 10 dagar |
| `sessions-parallellitet-frontier-praxis-2026-08-02.md` | Worktree-per-session är Anthropics egen rekommendation + 4 namngivna leverantörer; auto-detektion har **ingen** precedent | 6 dagar |
| `obevakade-tillstand-vaktens-form-2026-07-30.md` | Level- vs edge-triggered bevakning av delat tillstånd (K6-angränsande, ej dokument-specifikt) | 9 dagar |
| ADR-074 | Query-param-formen för prototyp är ett **medvetet** beslut (live-jämförelse mot Vercel Toolbar-mönstret), inte en olyckshändelse | 17 dagar, oförändrat |
| ADR-044 | Repot har REDAN, en gång, valt "egen route + DEV-grind" i stället för samma-fil-flagga — för ett annat scope (primitiv-demo, inte prototyp-mot-skarp) | 2 månader, oförändrat |

**Vad som därför är nytt i detta pass, och inte en dubblett:**

1. **Delfråga (a)–(c) — feature-flag-livscykel och samma-fil-vs-egen-yta-gränsen
   — har INGEN tidigare täckning i `docs/research/`.** Det är den öppna
   punkten fyra tidigare pass (inklusive R7–R9-rapporten självt) uttryckligen
   lämnade omätt: *"Jag känner ingen branschprecedent med källa för mönstret
   'prototyp och skarpa i samma komponentfil bakom en URL-flagga'."*
2. **K1 — stale dokumentkopior mellan huvudkatalog och worktree — har INGEN
   tidigare täckning.** De sex befintliga parallellitets-passen ovan handlar
   om kod-kollisioner, nummerkollisioner och session-detektion — aldrig om
   att STYRANDE DOKUMENT (sessionsdok, tråd-kort, ägarlappar) blir stale
   mellan arbetsytor. Detta pass stänger den luckan med en förstapartskälla
   (Claude Codes egen worktree-dokumentation) plus en engineering-blogg som
   namnger exakt detta problem.
3. **K6 — katalogägarskap/lås som mönster — har delvis täckning** (claims-check
   i `kodfils-partitionering`-passet), men INGEN tidigare täckning av det
   bredare branschmönstret för statisk, deklarativ katalogägarskap (CODEOWNERS
   och släktingar). Det läggs till här.

Ingen ADR förkastar något av det som diskuteras nedan. `ADR-074` och `ADR-044`
är läsa och citeras som levande, medvetna beslut — inte som något som rivs.

## Kort svar

**(a)** Ledarna drar gränsen efter EN axel: **behöver prototypen dela
runtime-tillstånd (auth-session, riktig data, riktig route) med produktionen?**
Om ja → flagga i samma fil/komponent, med strikt livscykeldisciplin (Martin
Fowlers klassificering). Om nej → helt separat build-pipeline (Storybook) eller
egen, DEV-grindad route. Ingen granskad källa förespråkar "samma fil, ingen
flagga, inget slutdatum" — vilket är den form R7 beskriver **innan** O4:s
härdning.

**(b)** Mekanisering sker på TVÅ oberoende lager som branschen aldrig
sammanblandar: **build-time-eliminering** (statisk konstant → dead-code
elimination, Vite/webpack/esbuild) hindrar att flaggad kod NÅR bundeln, och
**källkods-scanning med deadline** (LaunchDarkly code references,
Uber Piranha) hindrar att flaggan lever för länge. Repot har (a) men saknar
(b) på den ena grenen R7-rapporten redan mätte (`EventDetail.tsx:284`), och
saknar (b) helt som klass (ingen unused-export- eller flag-debt-grind finns).

**(c)** Ja — rivningsprotokollet är branschstandard och namngivet:
**deprecate → archive → (valfritt) delete**, aldrig direkt delete, med
källkods-referens-scanning som utlöser en riv-PR mot flaggans ORIGINALFÖRFATTARE.
Uber Piranha är den mest konkreta, körbara implementationen; LaunchDarklys
`ld-find-code-refs` är den kommersiella motsvarigheten. Ingen granskad källa
raderar en flagga för hand utan att först bevisa att inga kodreferenser finns
kvar.

**(d)** Kollisions-delen (K5/kodfils-partitionering) är redan branschbelagd i
tidigare pass — ingen ny mekanism behövs där. Den NYA delen (K1: stale
styrdokument mellan arbetsytor) har en namngiven branschklass:
**"config drift across worktrees"**, med Anthropics EGEN förstapartsdokumentation
som bekräftar rotorsaken (varje worktree är en fräsch checkout; inget
synkroniseras automatiskt utom `.git`, plugins och permission-godkännanden) och
en praktikers lösningsförslag (hardlinks) med explicit dokumenterade
begränsningar. K6:s katalogägarskaps-fråga har ett etablerat, mekaniserat
branschsvar: **CODEOWNERS-mönstret** (statisk, path-baserad ägar-deklaration +
obligatorisk granskning), som är en annan mekanismklass än claims-check
(deklarativt ägarskap vs. dynamiskt anspråk) och kompletterar den, inte
ersätter den.

---

## (a) Var drar ledarna gränsen mellan prototypkod och produktionskod?

**Källa: Martin Fowler, "Feature Toggles (aka Feature Flags)"**
(martinfowler.com/articles/feature-toggles.html). Detta är den mest citerade
förstapartstexten i branschen för just denna fråga (skriven med Pete Hodgson,
ThoughtWorks) och behandlas som facit av samtliga produktleverantörer
(LaunchDarkly och Unleash bygger sin egen dokumentation explicit på dess
taxonomi).

**BELAGT — klassificering efter livslängd och dynamik**, verbatim ur "Categories
of toggles"-avsnittet:

- **Release Toggles** — låter ofärdig kod nå produktion "som latent kod som
  kanske aldrig aktiveras", livslängd typiskt "en vecka eller två", statiskt
  omslagna beslut.
- **Experiment Toggles** — A/B-test, dynamiska per request, men kortlivade
  ("timmar eller veckor").
- **Ops Toggles** — driftkontroller, kan vara kortlivade eller permanenta
  (manuell circuit breaker).
- **Permissioning Toggles** — ändrar vilken funktionalitet en viss användare
  ser, kan vara flerårigt permanenta, ALLTID per-request dynamiska.

**Vår prototyp-mot-skarp-form är strukturellt en Release Toggle**: statiskt
beslutad (query-param satt vid navigering, inte per-request-beräknad), avsedd
att vara kortlivad (throwaway-kontraktet), och ska rivas efter ett beslut.
Fowlers egen text placerar exakt denna klass som den **billigaste att bära
länge** men samtidigt den som **oftast glöms** — vilket är precis R7:s
observation om `EventDetail.tsx:284`.

**BELAGT — var logiken ska bo, oavsett fil-gräns.** Fowler förespråkar
"De-coupling decision points from decision logic": centralisera VARFÖR
(vilken variant gäller) i en dedikerad plats, och låt komponenterna vara
omedvetna om att en flagga existerar ("Inversion of Control" — beslutet
injiceras via ett config-objekt vid konstruktion, snarare än att varje
komponent frågar flagg-systemet självt). **Detta är exakt O3:s (R7) princip**
— en läspunkt för `?variant` som propagerar nedåt via props, i stället för
fem oberoende `useQueryState`-anrop — formulerad oberoende av vårt repo, i en
artikel från 2017.

**BELAGT — Storybooks gräns går vid RUNTIME-behovet, inte vid
komponentgränsen.** ADR-044 avvisade Storybook för primitiv-demo av ett annat
skäl (build-kostnad oproportionerlig mot 6 primitiver), men den underliggande
branschprincipen håller ändå: Storybook är en **helt separat build-pipeline**
(egen `storybook build`, egna story-filer som aldrig importeras av
produktions-entrypointen) — vilket är rätt val när komponenten INTE behöver
riktig auth/data/routing. ADR-074 (rad 159–160) namnger själv skälet Storybook
avvisades för prototyp-substratet: *"riktig auth/datahämtning är
prototyp-modellens kärna"* — vilket är precis den situationen där Fowlers
Release Toggle-mönster (samma app, samma runtime, en flagga) är rätt val
i stället för en separat build.

**TOLKAT (min syntes, inte ett direkt citat):** de fyra observerade
branschformerna bildar en axel, inte fyra lösryckta alternativ:

| Form | När branschen väljer den | Vår motsvarighet |
|---|---|---|
| Separat build/paket (Storybook) | Komponenten behöver INTE riktig runtime | ADR-044:s val, avvisat för prototyp-substratet med uttalat skäl |
| Egen route, DEV-grindad | Komponenten behöver riktig runtime men inte samexistens på SAMMA sida | O2 (R7) |
| Release Toggle i samma fil, centraliserad beslutspunkt | Komponenten behöver samexistera på samma sida/route med live-växling | O3 (R7) — Fowlers Inversion-of-Control-mönster |
| Release Toggle, decentraliserad (varje komponent frågar själv) | **Ingen granskad källa förespråkar detta som stabilt sluttillstånd** — Fowler beskriver det som den form som ackumulerar skuld snabbast | O1 (R7) — nuvarande läge |

---

## (b) Hur mekaniseras att experimentkod aldrig når produktion oavsiktligt?

Två oberoende mekanismlager, källbelagda var för sig — branschen blandar
aldrig ihop dem:

**Lager 1 — build-time-eliminering (Vite, förstapartskälla:
`vite.dev/guide/env-and-mode`).** Verbatim: *"Vite exposes certain constants
under the special import.meta.env object. These constants are defined as
global variables during dev and statically replaced at build time to make
tree-shaking effective."* Med exempel: `if (import.meta.env.DEV) { … }` —
kod inuti blocket **"will be tree-shaken in production builds"**.

**BELAGT, mätt mot vårt repo (ärvt av R7–R9-rapporten, ej omräknat här):**
`EventDetail.tsx:356` använder mönstret korrekt (`import.meta.env.DEV &&
isHallplatsVariant(...)`); `:284` gör det INTE. Vites egen dokumentation
bekräftar alltså att den saknade grinden på `:284` inte är en stilfråga —
det är skillnaden mellan "elimineras vid build" och "kompileras in i
produktionsbunten som körbar, om än osannolik, gren".

**Lager 2 — källkods-scanning med deadline (LaunchDarkly, förstapartskälla:
launchdarkly.com/docs/guides/flags/technical-debt).** Verbatim: *"Use code
references to find and remove references to flags"* — verktyget
(`ld-find-code-refs`) skannar repot och skapar en *"extinction event"* när en
flagga inte längre refereras i koden. Kompletterande citat: *"A feature is
done when the flag is archived"* — flagg-städning är en del av
Definition-of-Done, inte ett separat efterarbete.

**BELAGT — lint-liknande grindar mot flag-läckage finns i produktion hos
branschledare, men som EXTERNT verktyg, inte en generisk `eslint`-regel.**
Uber byggde **Piranha** (`github.com/uber/piranha`, `eng.uber.com/piranha`)
specifikt för detta: statisk AST-analys som tar flagg-namn + förväntat
beteende + författare som input och genererar en färdig rivnings-diff,
skickad automatiskt till flaggans ursprungliga författare när
flagghanteringssystemet flaggar den som stale. Detta är starkare mekanisering
än en lint-regel — det är kodgenerering, inte bara upptäckt.

**Vår lucka, mätt av R7–R9-rapporten och bekräftad här mot källorna ovan:**
inget av lagren finns som körande mekanism. Lager 1 finns som SPRÅKMÖNSTER
(fyra av fem `?variant`-läsare använder det rätt) men har ingen grind som
FÄLLER när mönstret saknas — vilket är precis vad Piranha/`ld-find-code-refs`
löser hos branschledarna: automatisk UPPTÄCKT av undantagen, inte bara
korrekt användning där den redan finns.

---

## (c) Rivningsprotokoll — hur rivs experimentkod säkert?

**BELAGT — branschstandardens sekvens är deprecate → archive → (valfritt)
delete, ALDRIG direkt delete.** LaunchDarkly, verbatim: *"We strongly
recommend deprecating or archiving flags rather than deleting them, because
an archived flag's history remains in your LaunchDarkly project."* Rekommenderad
kadens: *"a healthy time-to-archive is in the 90-120 day range."*

**BELAGT — Unleash kodifierar samma sekvens som en explicit tillståndsmaskin**
(docs.getunleash.io, sekundärkälla via sökresultat eftersom direkthämtningen
gav 404 på den specifika undersidan — se § Vad jag inte kunde belägga):
fem stadier **Define → Develop → Production → Cleanup → Archived**, med
automatisk "potentially stale"-märkning när en flagga passerar sin förväntade
livstid, och ett arkiveringsförslag efter sju dagars total inaktivitet i
Cleanup-stadiet.

**BELAGT — trunk-based development-litteraturen namnger exakt vårt
felläge.** trunkbaseddevelopment.com, avsnittet "Tech Debt - pitfall",
verbatim: *"Flags get put into codebases over time and often get forgotten as
development teams pivot towards new business deliverables."* Rekommenderad
motåtgärd: *"Try to get the business to allow the remediation of flags (and
the code they apply to) a month after the release. Maybe add them to the
project's readme with a 'review for delete' date."*

**BELAGT — Piranhas rivningsprotokoll är den mest konkreta, körbara
implementationen av "säker rivning":** tre AST-nivåer i sekvens —
(1) radera koden kring själva flagg-API-anropet, (2) radera kod som blir
onåbar som FÖLJD av (1) (transitiv dead-code-eliminering, inte bara
punktradering), (3) radera tester knutna till flaggan. Detta är strukturellt
identiskt med R7-rapportens observation att `Betalningar()`/`BetalningsInnehall`
redan är död kod EFTER en tidigare rivning (`TASK-145.4`) men förblir
mekaniskt osynliga — Piranha-klassens verktyg är branschens svar på just den
klassen av kvarleva.

**TOLKAT — vad detta säger om ADR-102 B3/B4:** vår egen ordning ("skarpa görs
identisk → Marcus jämför → Marcus godkänner → FÖRST DÅ rivs") är strängare än
branschstandardens tidsbaserade arkivering (90–120 dagar, "en månad efter
release") — den är HÄNDELSEBASERAD (godkännande) snarare än tidsbaserad. Ingen
granskad källa motsäger detta; tvärtom är händelsebaserad rivning en
delmängd av samma familj ("arkivera när beslutet är fattat", oavsett om
triggern är en tidsstämpel eller en mänsklig kvittens). B3/B4 har alltså
branschstöd i PRINCIP (rivning kräver ett explicit, bokfört beslut, aldrig
tyst radering), om än inte i EXAKT samma triggerform.

---

## (d) Parallella arbetsströmmar — mönster för att inte korrumpera delade ytor

Denna delfråga har TVÅ delar med olika tidigare täckning.

### Kollisions-delen (K5, kodfils-partitionering) — redan branschbelagd

`kodfils-partitionering-parallella-agenter-2026-08-04.md` fastställde med 9+
granskade system (VCS, monorepo-styrning, CI/merge-kö, orkestreringsplattform,
agentiska kodningsverktyg) att claims-check-FÖRE-arbete + merge-tree-grind-
FÖRE-PR är etablerat branschmönster, redan kodifierat i `ADR-073`. **Detta
pass tillför inget nytt här** — dess "Dom" står oförändrad och citeras, inte
upprepas.

### Den nya delen — K1: stale dokumentkopior mellan huvudkatalog och worktree

**BELAGT — förstapartskälla, Anthropic (code.claude.com/docs/en/worktrees).**
Verbatim, avsnittet "Set up the worktree environment": *"A worktree is a
fresh checkout, so initialize your development environment there"* — och
under "Copy gitignored files into worktrees": *"A worktree is a fresh
checkout, so untracked files like `.env` or `.env.local` from your main
repository are not present."*

Under "What worktrees share with the main checkout" räknar Anthropic upp
EXAKT tre delade ytor och inget mer: **`.git`-katalogen** (git-kommandon
skriver till den delade katalogen), **projekt-scopade plugins**, och
**sparade permission-godkännanden** (`.claude/settings.local.json`). Inget av
de tre täcker godtyckliga TRACKED filer som ett sessionsdok eller en
ägarlapp — de synkas alltså INTE automatiskt mellan worktrees förutom via
git själv (commit + fetch/merge), exakt det steg som uteblir när en agent
skriver ett sessionsdok i en worktree utan att pusha/hämta i den andra.

Detta bekräftar och skärper vår egen `L278` (worktree-familjen delar EN
`.git`, remote-refs är en delad rörlig yta) från en annan vinkel: `L278`
handlar om att REFS är delade (så en `origin/main`-flytt syns överallt), men
säger inget om att VARJE worktrees ARBETSKATALOG är sin egen fristående
checkout av samma tracked-filer — vilket är den mekanism som faktiskt
producerar K1: två worktrees kan ha olika INNEHÅLL i samma path samtidigt,
utan att någon av dem vet om det, tills en fetch/merge körs.

**BELAGT — namngiven branschklass, praktikerkälla (arri.gay/articles/
sharing-is-caring/, tredjepart men förstahandsbeskrivning av eget verktyg).**
Artikeln namnger fenomenet rakt av: *"Having to setup every new worktree
would more than negate the positive advantages that multiple worktrees
confer"* och identifierar att manuell kopiering *"creates synchronization
issues"*. Föreslagen lösning: **hardlinks** (`cp -lfR` mot en central
katalog) i stället för symlinks — filer redigerade i EN worktree uppdateras
automatiskt överallt eftersom de är samma fil på disk, inte en kopia.
Författarens egna dokumenterade begränsningar, citerade explicit så
räkningen inte fejkas: concurrency-risk vid samtidig redigering ("just like
any shared file"), Windows/FAT saknar hardlink-stöd, och GIT-TRACKADE filer
kräver manuell losskoppling vid rebase.

**TOLKAT — vad detta betyder för vårt fall.** Hardlink-mönstret löser
`.env`-/config-klassen (untracked, sällan ändrad, avsiktligt delad). Det är
INTE en direkt lösning för K1, eftersom våra styrdokument (sessionsdok,
ägarlappar, tråd-kort) ÄR git-tracked och FÖRVÄNTAS divergera tillfälligt
mellan grenar — problemet är inte "de borde vara samma fil", det är "ingen
mekanism upptäcker när de har blivit olika utan att någon avsåg det". Det är
alltså närmare Piranha/`ld-find-code-refs`-klassen (upptäckt genom scanning)
än hardlink-klassen (fysisk sammanslagning) — men **ingen granskad källa
adresserar just denna underklass** (stale GOVERNANCE-dokument, till skillnad
från stale KONFIG eller stale KOD). Detta är passets tydligaste
precedens-lucka, deklarerad öppet nedan.

### Den nya delen — K6: katalogägarskap som mönster

**BELAGT — förstapartskälla, GitHub (`docs.github.com`, CODEOWNERS).**
Verbatim: *"A CODEOWNERS file uses a pattern that follows most of the same
rules used in gitignore files"*, med exempel som `apps/ @octocat` för
katalog-nivå-ägarskap. Enforcement: *"Repository owners can update branch
protection rules to ensure that changed code is reviewed by the owners of
the changed files"* — aktiverat via *"Require review from Code Owners"*, och
*"an approval from any of the owners is sufficient"* (kräver INTE alla
ägare, bara en).

**TOLKAT — mekanismklass, jämfört med claims-check.** CODEOWNERS är
**statiskt och deklarativt** (en path-till-ägare-mappning som ligger i repot
och gäller tills den ändras), medan `ADR-073`s claims-check är **dynamiskt
och per-batch** (en agent deklarerar sitt anspråk vid start, giltigt för den
körningen). De löser olika delar av K6: CODEOWNERS svarar på "VEM äger den
här katalogen, permanent, oavsett vem som råkar arbeta i den just nu";
claims-check svarar på "VEM arbetar i den här filen just NU, tillfälligt".
K6:s ägarlapp-friktion (F55, "ägarlapp-furyn") är strukturellt närmare
CODEOWNERS-klassen (den beskriver en persistent, om än informell,
ägar-markering) än claims-check-klassen — men F55:s rotorsak/lösning är enligt
syntesen själv outredd (592 rader transkript oläst) och kan alltså INTE
mappas mot en specifik mekanism härifrån utan den utredningen.

---

## Mappning mot options-rymderna — precedent-styrka per väg

### R7 (delad kod i samma fil) — O1–O4

| Väg | Precedent-styrka | Källa |
|---|---|---|
| **O1 — behåll variant-formen** | **Namngiven branschklass, men EXPLICIT flaggad som skuld-genererande i sin decentraliserade form.** Fowler beskriver mönstret (Release Toggle) som legitimt men varnar uttryckligt för att det ackumulerar skuld om beslutspunkten inte centraliseras. | Fowler, "Categories of toggles" + "Managing the carrying cost" |
| **O2 — separata filer/routes** | **Stark, och redan PRÖVAD i repot för ett annat scope.** ADR-044 valde exakt denna form (egen route + DEV-grind) i stället för samma-fil-flagga — men för ett fall utan behovet av samexisterande live-jämförelse. Precedensen håller för "separera när runtime-behovet tillåter det", inte för vårt fall rakt av. | ADR-044 (internt) + Fowler (branschens gräns går vid runtime-behovet) |
| **O3 — hybrid, en läspunkt** | **Starkast av de fyra.** Detta ÄR Fowlers "Inversion of Control"-mönster ordagrant — beslutet injiceras vid en punkt, komponenter är omedvetna om flaggan. Oberoende formulerad källa, oberoende av vårt repo, från 2017. | Fowler, "Implementation Techniques" |
| **O4 — minimal härdning** | **Stöds indirekt av Vites egen dokumentation** (build-time-eliminering kräver konsekvent `import.meta.env.DEV`-användning för att fungera alls) och av Piranha-klassens princip (transitiv dead-code-radering efter flagg-borttagning). Ingen källa förespråkar O4 som SLUTTILLSTÅND — bara som hygien oavsett vilken arkitektur som väljs. | `vite.dev` + Uber Piranha |

**Ingen källa avgör O1 vs O2 vs O3 som en ren teknisk fråga** — samtliga
granskade källor är eniga om att valet hänger på RUNTIME-behovet (delad
auth/data/route eller ej), vilket är exakt den axel ADR-074 redan resonerade
längs (Storybook avvisad av samma skäl som skulle avvisa O2 rakt av: prototypen
behöver riktig auth/data). Den branschförankrade slutsatsen är alltså: **O3
är den enda vägen som håller BÅDE ADR-074:s live-jämförelse-krav OCH Fowlers
skuld-varning** — O1 håller det förra men inte det senare, O2 håller det
senare men inte det förra (vilket ADR-102 § "Alternativ som övervägdes" redan
konstaterar om O2: "jämförelsen blir svårare, inte lättare").

### R8 (mekanisk jämförelse prototyp-mot-skarp) — O1–O4

**Ingen av de fyra granskade förstapartskällorna (Fowler, LaunchDarkly,
Unleash, trunk-based dev) beskriver en "prototyp-mot-skarp-grind" som EGEN
mekanism.** De löser flaggans LIVSCYKEL (när den föds, när den dör) —
INTE frågan "renderar de två lägena samma sak just nu". Detta bekräftar
R7–R9-rapportens egen slutsats: branschens visuella regressionsverktyg
(Chromatic, Percy, Applitools — nämnda i syntesen, ej omverifierade här)
löser "har DENNA yta ändrats mot sitt EGET förflutna", aldrig "skiljer sig
LÄGE A från LÄGE B av samma yta". **Precedent-rymden för R8:s options-rymd
förblir omätt av detta pass** — frågan ligger utanför vad flagg-livscykel-
litteraturen täcker, och en riktad sökning mot testverktygs-precedent (inte
flagg-precedent) är ett eget, avgränsat pass om O1–O4 (R8) ska kallas
branschförankrade.

### K1 (stale dokumentkopior) och K6 (katalogägarskap)

| Kandidat | Precedent-styrka | Källa |
|---|---|---|
| **K1 — stale dokumentkopior** | **Fenomenet är namngivet och förstapartsbekräftat** (Anthropics egen worktree-dokumentation bekräftar rotorsaken: fräsch checkout, ingen auto-sync av tracked filer). **Lösningsförslaget (hardlinks) är tredjepart och löser en ANNAN underklass** (untracked config) än vår (tracked governance-dokument som avsiktligt divergerar tillfälligt). Ingen granskad källa löser just vår underklass. | code.claude.com/docs/en/worktrees + arri.gay (löser angränsande, ej identiskt problem) |
| **K6 — katalogägarskap** | **CODEOWNERS-mönstret är starkt och brett etablerat** (GitHub förstapartskälla, obligatorisk-granskning-mekanism). Mappningen mot K6:s SPECIFIKA friktion (ägarlapp-UX under parallella agent-sessioner, F55) är dock TOLKAT — F55:s egen rotorsak är outredd och kan falsifiera eller stärka mappningen när den utreds. | `docs.github.com` (CODEOWNERS) — starkt för mekanismklassen, svagt för det specifika F55-fallet |

---

## Dom

**Delfråga (a)–(c) är nu källbelagda med förstapartsmaterial (Fowler,
LaunchDarkly, Unleash, trunkbaseddevelopment.com, Vite, Uber Piranha) — den
precedent-lucka fyra tidigare pass lämnade öppen är stängd för dessa tre
delfrågor.** Slutsatsen är entydig över alla fyra källor: gränsen mellan
prototyp och produktion dras efter RUNTIME-behovet, flagglogik centraliseras
till EN beslutspunkt oavsett filgräns, build-time-eliminering är det enda
mekaniska skyddet mot oavsiktlig produktionsläckage, och rivning sker alltid
via deprecate→archive-sekvens med källkods-scanning som utlösare — aldrig
direkt radering.

**O3 (R7) är den väg som samtliga fyra källor pekar mot, oberoende av
varandra och oberoende av vårt repo.** Det är den starkaste enskilda
slutsatsen i detta pass.

**R8:s options-rymd förblir OMÄTT mot branschprecedent** — flagg-livscykel-
litteraturen adresserar inte "mekanisk jämförelse av två renderade lägen".
Det kräver ett eget, avgränsat pass mot testverktygs-precedent (visuell
regression, DOM-diff-verktyg) om O1–O4 (R8) ska vägas branschförankrat.

**K1 är en namngiven, förstapartsbekräftad branschklass ("config drift across
worktrees") men UTAN en färdig lösning för vår specifika underklass**
(tracked governance-dokument, avsiktlig tillfällig divergens). Hardlink-
mönstret är fel verktyg för just detta fall — det är byggt för untracked,
sällan-ändrad, avsiktligt IDENTISK data.

**K6 har ett starkt, mekaniserbart branschmönster (CODEOWNERS)** för den
generella katalogägarskaps-frågan, men mappningen mot vårt specifika F55-fall
är öppen tills F55 utreds separat.

## Vad jag inte kunde belägga

1. **Unleashs exakta flagg-typ-till-livstid-tabell** (t.ex. "40 dagar för
   release, 7 dagar för operational"). Sökresultatens sammanfattning gav
   siffrorna, men direkthämtningen mot `docs.getunleash.io/reference/
   feature-toggle-types` gav en 404-sida — siffrorna står ovan märkta som
   sekundärkälla (sökmotor-sammanfattning), INTE verifierade mot Unleashs
   egen sida ordagrant. Bör verifieras separat om exakta dagssiffror ska
   citeras normativt.
2. **OpenFeature-specifikationens flagg-livscykel-avsnitt** kunde inte
   lokaliseras via glossary-sidan (den täcker bara terminologi, inte
   livscykel). Specifikationens huvuddelar (Flag Evaluation API-sektioner)
   söktes inte igenom i detta pass.
3. **Chromatic/Percy/Applitools som R8-precedent** — nämnda i syntesen som
   kända verktyg men INTE omverifierade i detta pass; jag bekräftar bara att
   de löser ett ANNAT problem (regression mot eget förflutna) än R8, inte
   exakt vad de gör.
4. **F55:s ("ägarlapp-furyn") rotorsak** — outredd i källan (592 rader
   transkript oläst enligt syntesen), så K6-mappningen mot CODEOWNERS är en
   mekanismklass-hypotes, inte en verifierad lösning på det specifika
   incidentmönstret.
5. **Om Storybooks egna officiella docs formulerar "separat build, aldrig i
   produktionsbunten" lika explicit som jag skriver ovan.** Jag drog denna
   slutsats ur sekundärkällor (GitHub-diskussioner, community-svar) plus
   allmänt känd arkitektur (`storybook build` är ett separat kommando från
   appens byggkommando) — ingen direkt Storybook-förstapartssida citerades
   ordagrant för just denna mening.
6. **Vår egen repo-specifika kollisionsfrekvens för K1** (hur ofta stale
   dokumentkopior FAKTISKT uppstått, utöver syntesens "4× på 6 dagar" som
   redan är mätt av tidslinje-passet) — mättes inte om här; siffran ärvs
   oprövad.

## Rekommendation — MÄRKT SOM REKOMMENDATION, INTE BESLUT

Inget nedan är beslutat. Allt kräver Marcus, och flera punkter hör hemma i
G3/G6.

1. **G3: väg O3 (R7) tungt** — det är den enda vägen med oberoende,
   fyrfaldig branschbekräftelse, och den enda som håller både ADR-074:s
   live-jämförelse-krav och Fowlers skuld-varning samtidigt.
2. **G3: bygg O4:s (b) och (c)-delar (DEV-grinda `:284`, riv död kod) oavsett
   vilken av O1–O3 som väljs** — Vite-dokumentationen och Piranha-mönstret
   visar att detta är hygien, inte arkitektur, och kostar litet i förhållande
   till R7:s produktions-nåbara gren.
3. **Kör ett eget, avgränsat pass mot testverktygs-precedent för R8** innan
   O1–O4 (R8) kallas branschförankrade — flagg-litteraturen räcker inte för
   den delfrågan, vilket detta pass visar snarare än antar.
4. **G6: K1 kräver en EGEN mekanism, inte lånad från hardlink-mönstret.**
   Formulera K1 som en scanning-/upptäckts-fråga (närmare Piranha-klassen än
   hardlink-klassen) i grillningen — hardlinks löser fel underklass av
   problemet.
5. **G6: mät F55 innan K6 mappas definitivt mot CODEOWNERS.** Mekanismklassen
   är sund, men bindningen till det specifika incidentmönstret är obelagd
   tills transkriptet lästs.

## Källförteckning

**Förstapartskällor:**

- Martin Fowler & Pete Hodgson, ["Feature Toggles (aka Feature Flags)"](https://martinfowler.com/articles/feature-toggles.html) — martinfowler.com
- [LaunchDarkly: "Reducing technical debt from feature flags"](https://launchdarkly.com/docs/guides/flags/technical-debt) — launchdarkly.com/docs
- [Unleash: "Technical debt"](https://docs.getunleash.io/concepts/technical-debt) (glosaria/koncept-nivå; typ-tabellen är sekundärkälla, se § Vad jag inte kunde belägga)
- [Trunk Based Development: "Feature Flags"](https://trunkbaseddevelopment.com/feature-flags/) — trunkbaseddevelopment.com
- [Vite: "Env Variables and Modes"](https://vite.dev/guide/env-and-mode) — `vite.dev`
- [Uber Engineering: "Introducing Piranha"](https://www.uber.com/us/en/blog/piranha/) / [`eng.uber.com/piranha`](https://eng.uber.com/piranha/) · [`github.com/uber/piranha`](https://github.com/uber/piranha)
- [GitHub: "About code owners"](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners) — `docs.github.com`
- [git-scm: `git-worktree`](https://git-scm.com/docs/git-worktree) — git-scm.com
- [Anthropic: "Run parallel sessions with worktrees"](https://code.claude.com/docs/en/worktrees) — code.claude.com/docs

**Tredjepartskällor (praktiker/community, ej förstaparts men förstahands
beskrivning av eget verktyg/erfarenhet):**

- Arriana Blais, ["Sharing is Caring: Solving the config problem in Worktrees"](https://arri.gay/articles/sharing-is-caring/) — arri.gay

**Repo-interna dokument (läst i sin helhet före externa sökningar):**

- `adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md` — läst via
  `git show origin/docs/s93-processaudit-underlag:docs/research/adr-102-rotorsaksverifiering-r7-r9-2026-08-08.md`;
  gren `docs/s93-processaudit-underlag`, ej ännu mergad (PR öppnas separat),
  därför ingen relativ länk här
- `processaudit-syntes-och-grillningsunderlag-2026-08-08.md` — samma gren, samma skäl
- [`kodfils-partitionering-parallella-agenter-2026-08-04.md`](kodfils-partitionering-parallella-agenter-2026-08-04.md)
- [`nummerallokering-parallella-aktorer-2026-07-29.md`](nummerallokering-parallella-aktorer-2026-07-29.md)
- [`sessions-parallellitet-frontier-praxis-2026-08-02.md`](sessions-parallellitet-frontier-praxis-2026-08-02.md)
- [`obevakade-tillstand-vaktens-form-2026-07-30.md`](obevakade-tillstand-vaktens-form-2026-07-30.md)
- [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md) — växlar-standarden
- [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) — prototyp-är-facit-beslutet
- [`ADR-044`](../decisions/ADR-044-react-aria-components-demo-route.md) — egen route + DEV-grind, tidigare val i repot
- `tasks/lessons.md` L278 (worktree-familjen delar `.git`) — skärpt av detta pass, ej motsagt

**Git-referens:** `HEAD` vid pass-start `8392ca6a` (main, oförändrat under
passet — inga mutationer gjorda).
