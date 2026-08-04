---
owner: marcus803
updated: 2026-08-04
review_by: 2027-02-04
status: draft
---

# Hur modellerar branschens elit relationer i ett kunskaps-/dokumentationssystem — och vad bygger vi? (Code, 2026-08-04)

> **Proveniens:** Marcus order 2026-08-04, verbatim: *"Det jag vill är att vi
> gör som den absoluta toppeliten eller seniorerna hade gjort [...] Vi behöver
> ju liksom bygga i mönstret av en RIKTIG RELATIONSDATABAS [...] Om det
> betyder att vi behöver migrera hela vårt dokumentationssystem till en
> extern databas typ Supabase eller liknande så GÖR VI DET."* Ramen är
> uttryckligen bredare än den föregående, avgränsade frågan i
> [`barn-falt-tradregister-designbeslut-2026-08-04.md`](barn-falt-tradregister-designbeslut-2026-08-04.md)
> (landad i `#721`) — den frågan besvaras HÄR som en instans av ett större
> arkitekturval, inte separat.
>
> Metod: primärkälla där möjligt (produktens/verktygets egen dokumentation
> eller källkod), sekundärkälla flaggad explicit där primärkälla inte gick
> att nå. Inget kod- eller filbeslut fattas i detta dokument — endast
> research + rekommendation.

## Kort svar

**Filerna förblir sanningskällan. Ingen migrering till Supabase (eller någon
annan extern databas) för dokumentationssubstratet.** Det är inte en
eftergift för att vi är för små för "riktig" arkitektur — det är **exakt vad
branschens mest citerade property-graph-i-dokumentation-system gör**:
Backstage (Spotify/CNCF, den starkaste precedensen i denna research) håller
sina entiteter som YAML i git, och beskriver sin databas rakt ut som en
**ingest-mål**, inte en sanningskälla: *"entities are ingested from various
authoritative sources and held in a database"* och *"the catalog makes sure
to keep itself up to date with changes to those files"*
([life-of-an-entity.md](https://github.com/backstage/backstage/blob/master/docs/features/software-catalog/life-of-an-entity.md)).
Filerna är källan; databasen är en beräknad, disponibel cache ovanpå dem.

Den datamodell branschens elit faktiskt använder — sett i Backstage, Notion,
Airtable (som vi redan kör), Linear, Jira, och Obsidian-pluginet Breadcrumbs
— är samstämmig på en punkt som direkt löser vår `besläktad`-mot-`barn`-fråga:
**asymmetriska relationer deklareras EN gång och den motsatta riktningen
beräknas/härleds** (aldrig manuellt dubbelbokförd), medan **symmetriska
relationer deklareras EN gång per par** och behandlas som ömsesidiga utan att
någonsin bli två motsägelsebara rader. Se § 2.

T119:s egen rekommendation (`barn-falt`-dokumentet, Option C: separat
manifest) **konvergerar oberoende med detta branschmönster** — den nåddes
utan att känna till denna bredare research. Det är ett starkt tecken att
Option C var rätt riktning, inte en slump.

Vid genuin frågbarhets-smärta (inte idag, se § 4): en **genererad** indexfil
byggd FRÅN filerna, i CI eller on-demand, aldrig handredigerad, aldrig
sanningskälla — Backstage-mönstret i litet format. Om och när den byggs är
**SQLite en bättre matchning än Supabase** för just detta syfte (se § 3).

Frågan är ADR-bar (§ ADR-bar-bedömning), tydligare än T119:s egen snävare
fråga. Ingenting är byggt.

## Vårt faktiska tillstånd — verifierat mot disk denna session

| Entitet | Stabil ID? | Sanningskälla | Antal (mätt 2026-08-04) |
|---|---|---|---|
| Tråd | Ja (`T<NN>`) | `tasks/threads/README.md` (index) + `T*.md` (kort) | 124 rader (`grep -c '^\|[[:space:]]*\`T[0-9]\+\`' tasks/threads/README.md`), 25 med kortfil |
| ADR | Ja (`ADR-NNN`) | `docs/decisions/ADR-*.md` | 94 (`ls docs/decisions \| grep -c '^ADR-'`) |
| Backlogg-kort/skiva | Ja (`TASK-N`/`task-N.M`) | backlog-CLI:t (Backlog.md), ENDAST via CLI | 233 (`npx backlog task list --plain \| wc -l`) |
| Sessionsdok | Ja (datum + `session-N`) | `tasks/sessions/*.md` | ej räknat denna session |
| Lesson | Ja (`L<N>`) | `tasks/lessons.md` (8486 rader) | 426 (mätt via grinden, se nedan) |

**Lessons HAR en stabil per-post-ID, men jag missade formen i mitt första
sökförsök.** Fyra egna regex-gissningar (`^### [0-9]+\.`, `^\*\*[0-9]+\.`,
`^\*\*L[0-9]`, `^####`) gav 0, 0, 0 respektive 5 träffar och fick mig att
tro att lessons saknade adresserbar struktur. Att köra repots egen grind
(`npm run check:docs` → `scripts/check-lesson-numbers.sh`) motbevisade det:
rubrikformen är `### L<N>` (konfigurerad i `.lesson-policy.conf`,
`LESSON_HEADING_PREFIX="L"`), och grinden rapporterar **"426 unika poster i
tasks/lessons.md, 7 nummerlösa fragment"** — exakt Marcus-orderns tal,
mekaniskt verifierat, inte bara stipulerat. Verifierat efteråt:
`grep -cE '^### L[0-9]+' tasks/lessons.md` → `426`. **Rättelse noterad
explicit** (inte tyst): mitt eget första sökförsök var fel, inte filen.
Konsekvensen för relationsfrågan omvänds därmed — `lesson→X`-relationer KAN
uttryckas strukturellt redan idag (`L<N>` är en lika giltig adresserbar
entitet som `T<NN>` eller `ADR-NNN`), det saknas bara en mekanism som
kopplar dem till andra entitetstyper, inte ett ID-system i sig.

Relations-inventeringen för TRÅDAR är redan gjord av T119
(`barn-falt-tradregister-designbeslut-2026-08-04.md` § Relations-inventering)
och återanvänds här utan omkörning:

| Relation | Ägs redan av | Art |
|---|---|---|
| kort→kort (PRD→skiva) | Ja — backlog-CLI:t, hierarkiska ID:n + `Subtasks`-fält | Asymmetrisk |
| tråd→commit | Delvis — `[T<NN>]`-taggkonvention + `git log --grep`, 25 % missrate mätt (T119) | Asymmetrisk, annan axel (aktivitet, ej barnskap) |
| tråd→kort | Nej — 1/124 rader har informell konvention (`kort: TASK-N`) | Asymmetrisk |
| tråd→tråd (förälder/kluster) | Nej — en instans (`T30`), fri text | Asymmetrisk |
| tråd→tråd (`besläktad`) | Delvis — semi-konvention, 7 instanser, ingen grind | **Symmetrisk** |

Till detta lägger jag ADR-lagrets egen relationsmekanik, som T119 inte
täckte (dess scope var trådar): `docs/decisions/README.md` dokumenterar att
en ADR som ersätts skrivs som `Supersedes ADR-NNN`, och **den gamla ADR:n
uppdateras manuellt** med `Superseded by ADR-MMM` (`docs/decisions/README.md`
rad 28, 35). Det är ett **manuellt tvåsidigt** mönster — samma familj som
Python PEP:s `Replaces`/`Superseded-By` (§ 2) — och det är rimligt HÄR,
eftersom ADR-ersättning är sällsynt och hanteras med omsorg (94 ADR:er,
låg churn). Det är inte samma riskklass som `besläktad`/`barn`, som skrivs
oftare och mer informellt.

## 1. Vad gör branschledarna — jämförelsetabell (9 system, 5+ krävt)

| System | Kategori | Relationsmekanik | Symmetrisk hantering | Sanningskälla | Källa |
|---|---|---|---|---|---|
| **Backstage** | Utvecklarplattform (software catalog) | Typade `relations` i YAML (`spec.dependsOn`, `spec.owner`, …); catalog-processorn **beräknar den motsatta riktningen automatiskt** | N/A (alla well-known-par är asymmetriska: `dependsOn`↔`dependencyOf`, `parentOf`↔`childOf`, `memberOf`↔`hasMember`, `ownedBy`↔`ownerOf`, `partOf`↔`hasPart`, `providesApi`↔`apiConsumedBy`, `consumesApi`↔`apiProvidedBy`) | Filer i git (`catalog-info.yaml`), databasen är ingest-cache | [well-known-relations](https://backstage.io/docs/features/software-catalog/well-known-relations/), [life-of-an-entity.md](https://github.com/backstage/backstage/blob/master/docs/features/software-catalog/life-of-an-entity.md) |
| **Obsidian + Breadcrumbs** | PKM (community-plugin ovanpå filbaserad kärna) | Frontmatter-fält (`parent:`, `up:`, …); pluginet **härleder motsatt riktning automatiskt** (*"if A is `up` from B, then B is `down` from A"*) | Symmetriska typer (`same`/sibling) hanteras separat, behandlas ömsesidigt, INTE auto-inverterade (inget ATT invertera) | Markdown-filer, ingen databas | [Breadcrumbs README](https://github.com/SkepticMystic/breadcrumbs), [Obsidian backlinks](https://help.obsidian.md/plugins/backlinks) |
| **Notion** | No-code-databas | Relation-property; **two-way sync** skapar automatiskt en spegel-kolumn i den andra databasen | Symmetri är plattformens standardläge för relationer mellan två databaser ("sync both ways"); vid själv-relation konverteras det uttryckligen till 1-way för att undvika dubblering | Notions egen hostade databas (ej filbaserad — annan kategori) | [Notion — Relations & rollups](https://www.notion.com/help/relations-and-rollups) |
| **Airtable** (vi kör den redan) | No-code relationsdatabas | Linked-record-fält; skapar **automatiskt** ett reciprokt fält i andra tabellen (och sedan 2026 även för själv-länkar inom samma tabell) | Byggs in som default-beteende, ingen manuell dubbelbokföring | Airtables egen hostade databas | [Linking records](https://support.airtable.com/docs/linking-records-in-airtable), [Connect data with linked records](https://www.airtable.com/guides/build/connect-data-with-linked-records) |
| **Linear** | Issue-tracker | `IssueRelation`-objekt med `type`-enum (`blocks`/`duplicate`/`related`/`similar`) — en post, renderad från båda hållen | `related` ligger i samma enum som de asymmetriska typerna; UI:t visar `blocks`/`is blocked by` som motsatta vyer av samma post | Linears egen hostade databas | [Issue relations](https://linear.app/docs/issue-relations) (schema-detaljen `type`-enum är söksammanfattnings-belagd, ej direkt schema-fetch — se § Vad jag inte kunde belägga) |
| **Jira** | Issue-tracker | Ett `IssueLinkType`-objekt med **namn + inward-beskrivning + outward-beskrivning** (t.ex. `blocks`/`is blocked by`) — EN länk-post, två beskrivningar | Länktypen `relates to` är den symmetriska default-typen; asymmetriska typer bär alltid ett par av beskrivningar, aldrig två separata poster | Jiras egen hostade databas | [Jira issue linking model](https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/) |
| **adr-tools / MADR / Log4brains** | Docs-as-code (ADR) | `adr new -s N` skapar den nya filen OCH **muterar den gamla filens statusfält** i samma kommando — skriptet garanterar båda sidor, inte disciplin | N/A — supersedes är strukturellt asymmetriskt | Rena markdown-filer i git | [npryce/adr-tools README](https://github.com/npryce/adr-tools), [MADR](https://adr.github.io/madr/) |
| **Python PEP** | Docs-as-code (RFC-liknande) | `Requires`/`Replaces`/`Superseded-By`-header-fält — **manuellt, tvåsidigt**, ingen verktygsmutation garanterar konsistens | N/A | Rena RST/markdown-filer i git | [PEP 1](https://peps.python.org/pep-0001/) |
| **Kubernetes KEP / Rust RFC** | Docs-as-code, storskaligt (kontroll-grupp) | **Ingen strukturerad relationsfält alls** — relationer till andra proposals uttrycks i fri text (Alternatives/Drawbacks) eller externt via GitHub issue-länkar/tracking issues | N/A | Rena markdown-filer i git | [KEP-mall](https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/README.md) (verifierat: mallen har inga dedikerade relationsfält), [Rust RFC tracking issues](https://rust-lang.github.io/rfcs/0002-rfc-process.html) |

**Diátaxis** (tutorials/how-to/reference/explanation,
[diataxis.fr](https://diataxis.fr/)) är medvetet UTELÄMNAD ur tabellen — den
är en taxonomi för dokument-**typ**, inte för relationer mellan dokument, och
svarar inte på frågan. Den är ändå värd att notera: våra fyra dokumentklasser
(`docs/research/` ≈ explanation/investigation, `docs/decisions/` ≈
beslutsreferens, `tasks/lessons.md` ≈ reference-kunskapsbas,
`tasks/threads/` ≈ aktivitetslogg/index) mappar löst mot Diátaxis fyra
kvadranter, men det är en sidoiakttagelse, inte ett svar på relationsfrågan.

**Antora och Docusaurus** undersöktes och uteslöts som svaga precedent: båda
är publiceringsverktyg med ett `xref`/länk-mekanism för sid-till-sid-länkar,
men **ingen typad relationsmodell** — en xref är en oformaterad hyperlänk,
strukturellt jämförbar med vår nuvarande fria markdown-länkning, inte med
Backstages typade graf. ([Antora xref](https://docs.antora.org/antora/latest/page/xref/))

**Roam Research och Logseq** (block-referenser, automatiskt bidirektionella
länkar på block-nivå) bekräftar samma symmetri-princip som Obsidian —
en `[[länk]]` skapar en bidirektionell relation UTAN att användaren skriver
den två gånger, plattformen (klienten som indexerar filerna/blocken)
härleder baklänkarna. Källorna för dessa två är svagare än övriga i tabellen
(se § Vad jag inte kunde belägga) och är därför inte inkluderade som egen
tabellrad, men stärker mönstret genom convergens: **fem oberoende
produktkategorier — utvecklarplattform (Backstage), PKM (Obsidian/Roam/
Logseq), no-code-databas (Notion/Airtable), issue-tracker (Linear/Jira) och
docs-as-code (adr-tools) — landar alla på samma regel: en asymmetrisk
relation lagras/deklareras EN gång, den andra riktningen härleds av
verktyget, aldrig av handpåförd disciplin.**

**Anytype** (lokal-first, grafdatabas, egna typade relationer som
`"builds upon"`, `"contradicts"`) bekräftar att fri relationstypning (utöver
ett fast schema) är en etablerad produktkategori-egenskap, men är inte en
filbaserad-git-precedent (den har en egen lokal binär databas) och vägs
därför lägre för VÅR arkitekturfråga — den svarar på "kan relationstyper vara
fria" (ja) men inte på "ska filer eller databas vara sanning" (Anytype är
databas-först by design, en annan produktkategori än vårt git-native repo).

## 2. Datamodellen — symmetriska vs asymmetriska relationer, den centrala frågan

Mätningen ovan ger ett entydigt svar på uppdragets kärnfråga: **branschen
delar upp relationstyper i två strukturellt olika klasser redan i
datamodellen, aldrig i samma fält.**

**Asymmetriska relationer (barn/förälder, blocks/blocked-by, dependsOn/
dependencyOf):** deklareras EN gång, i den ena riktningen. Den motsatta
riktningen är antingen (a) **beräknad vid läsning** av ett processlager
(Backstage catalog-processorn, Breadcrumbs-pluginet, Airtables reciproka
fält) eller (b) **skriven av ett verktyg vid skapandet**, inte av en
människa för hand (adr-tools' `-s`-flagga muterar båda filerna i samma
kommando). Ingen av de granskade systemen ber en människa hålla två
fritextlistor i synk manuellt som sin PRIMÄRA mekanism — där det ändå sker
manuellt (PEP:s `Replaces`/`Superseded-By`, vårt eget ADR-`Superseded by`)
är det en medveten eftergift på en LÅGFREKVENT, HÖGOMSORGS-relation, inte
normen för högfrekventa relationer.

**Symmetriska relationer (besläktad, `same`, `relates to`, Notions
two-way-relation):** deklareras EN gång **per par**, inte per riktning. Det
finns ingen "riktning att invertera" — A besläktad B och B besläktad A är
samma faktapåstående. De granskade systemen löser konsistensen på ett av två
sätt: (i) plattformen lagrar och visar en enda kant från båda ändarna
(Notion, Airtable, Jira `relates to`), eller (ii) ett tunt indexeringslager
läser samma token från valfri fil och behandlar det som ömsesidigt utan att
kräva en spegelpost (Breadcrumbs `same`-typ). **Ingen granskad implementation
förväxlar symmetriska med asymmetriska relationer i samma fält** — det är
alltid separata typade relationer, även när de lagras i samma underliggande
tabell/graf. Detta bekräftar oberoende T119:s egen varning (dess § "Den
fjärde formen") om att blanda `barn` och `besläktad` i samma kolumn.

**Vem garanterar konsistensen — den faktiska skillnaden mot vårt nuläge:**
i samtliga granskade system är svaret "verktyget", aldrig "disciplin".
Vårt nuläge (`besläktad` som fri text, `barn` obefintligt som mekanism) har
INGEN sådan garant — vilket är exakt det T119 empiriskt visade: `T95` (mest
aktiva tråden) har noll spårbara commits via den mekanism som ändå finns
(`[T<NN>]`-taggning), och `besläktad`-omnämnanden är aldrig validerade mot
att målet existerar. Det här är inte en skala-fråga (124 rader är trivialt
litet för en bash-loop) — det är en **mekaniserings**-fråga, identisk med
den klass repot redan löser för andra invarianter
(`scripts/check-thread-index.sh`, `scripts/check-lifecycle.sh`).

## 3. Ska vi migrera till en extern databas (Supabase)?

**Ärligt svar: Nej för sanningskällan. Senare, och då under specifika
villkor, för ett genererat frågeindex — och SQLite, inte Supabase, är då
troligen rätt verktyg.**

### Vad vi skulle vinna

- Riktiga JOIN-frågor tvärs entitetstyper ("visa alla trådar som producerat
  kort som i sin tur refereras av en ADR").
- Referentiell integritet som en databasnivå-garanti (FK-constraints) i
  stället för en CI-grind som körs vid varje push.
- Skalbarhet utan filantal/grep-prestandaoro vid mycket större N.

### Vad vi skulle förlora — vägt mot CLAUDE.md:s egna redan uttalade värden

CLAUDE.md § "Käll-hierarkin" och byggplans-disciplinen vilar uttryckligen på
att **allt är filer i git**: versionshistorik (`git log`/`git blame`) gratis,
PR-granskningsbarhet per rad, offline-läsbarhet, diffbarhet, och — mest
konkret för hur DETTA uppdrag exekverar — **en agent kan läsa allt utan
nätverk** (denna worktree har ingen databas-uppkoppling och behöver ingen
för att läsa 124 trådar, 94 ADR:er eller 233 backlogg-kort). En migrering av
själva dokumentationssubstratet till Supabase river den egenskapen rakt av,
om inte databasen SAMTIDIGT mirrorspeglas till git — vilket i praktiken
betyder att man underhåller två system i stället för ett, med synk-drift som
ny felklass (exakt den typ av dubbel-sanning ADR-063 § S91-not redan
katalogiserar som en Airtable-kostnad, fast för ett ANNAT syfte: produktdata,
inte dokumentationsdata).

**Den starkaste enskilda datapunkten mot Supabase här är Backstage självt.**
Det är branschens mest citerade property-graph-för-utvecklardokumentation-
system, byggt av ett företag (Spotify) med enorm skala och egna resurser att
bygga vad som helst — och de valde ändå **filer-i-git som sanningskälla plus
en beräknad, disponibel databas som frågelager**, inte databas-som-sanning.
Om branschens elit-referens för just denna problemklass gjorde det valet, är
det starkast möjliga precedens för att göra samma val här, i mindre skala.

### Är det en falsk motsättning — finns hybridformer?

Ja, och Backstage ÄR hybridformen: **filer som sanning + genererat
index/graf för frågor.** Det är exakt vad moderna docs-as-code-verktyg gör
generellt (statiska webbplatsgeneratorer bygger en frontmatter-driven
byggtids-graf, t.ex. Astro Content Collections' `getCollection`-API som
"queries the same snapshot compiled at build time" —
[Astro Content Layer](https://astro.build/blog/content-layer-deep-dive/)) —
och det är också vad vårt EGET repo redan gör i litet format:
`check-thread-index.sh` bygger implicit ett läs-index (index↔fil, båda
riktningar) vid varje CI-körning, utan att någonsin persistera det som en
databas.

**Om vi någonsin bygger det generade indexet: varför SQLite slår Supabase
för DETTA syfte specifikt.** Supabase (Postgres, hostad, nätverksberoende)
löser problem vi inte har för dokumentationssubstratet: samtidiga skribenter,
real-time-prenumerationer, hostad auth för externa klienter. Vårt
dokumentationssystem har EN skribent i taget (Code, i en worktree), är
läs-tungt, och redan git-versionerat. SQLite (fil-baserad, ingen server,
byggs om från grunden vid varje CI-körning, checkas ALDRIG in) ger samma
frågbarhet utan att införa ett nätverksberoende eller en andra sanningskälla
att synka — och den kan raderas och återskapas ur filerna på sekunder, vilket
är precis ADR-063:s egen efterfrågade egenskap ("efemär, per-körning") som
Airtable INTE kan leverera för produktdata (ADR-063 § S91-not, tvång 1 och
3). Att välja Supabase HÄR skulle importera exakt den kostnadsklass ADR-063
redan dokumenterat som ett medvetet pris för ett ANNAT syfte (produktdatan)
— utan att vårt dokumentationssystem har något av de behov som motiverade
det priset där.

### Sammanfattat svar på Marcus fråga

**Nej** — inte som ersättning av filerna. **Senare, och då under dessa
villkor** — om ett upprepat, dyrt frågebehov faktiskt uppstår (inte
hypotetiskt), byggs ett GENERERAT, disponibelt index FRÅN filerna, och
SQLite är den arkitektoniskt motiverade formen för det, inte Supabase.
Supabase förblir rätt verktyg för PRODUKTDATA (redan beslutat, ADR-063) —
att använda det för dokumentationssubstratet vore att ta ett verktyg valt
för ett annat problems krav (multi-user, real-time, hostad) och sätta det på
ett problem som inte har de kraven.

## 4. Skalbarheten konkret

**Mätt idag:** 124 trådar, 94 ADR:er, 233 backlogg-kort, dokumentationsdjup
enligt tabellen i § "Vårt faktiska tillstånd". `check-thread-index.sh` är en
`while read`-bash-loop över radantalet — den typen av loop kostar
mikrosekunder per rad; 124 eller 620 rader (5×) gör ingen mätbar skillnad i
CI-tid. **Grep/bash-baserad validering är inte där smärtan uppstår, och
kommer inte att bli det vid 5×.**

**Den faktiska, MÄTTA friktionspunkten finns redan, fast i ett annat
verktyg:** CLAUDE.md § "Kortnummer" dokumenterar att backlog-CLI:ts
`check_active_branches: true`-flagga tar `task list` från ~0,52 s till
~6,50 s och `task create` från ~0,69 s till ~7,09 s vid **233 kort** — och
att `check-backlog-closure.sh` tar 164,60 s trots att endast ~173 av dess
anrop är `view` (opåverkad av flaggan); kostnaden bärs helt av dess ETT
`list`-anrop. Det är repots enda empiriska datapunkt för "var visar
nuvarande verktygskedja redan strain vid nuvarande skala", och den pekar
INTE på markdown-filerna eller bash-grindarna — den pekar på en specifik
CLI-funktion (branch-scanning) i ett verktyg (Backlog.md) som redan är
externt till vårt eget grind-maskineri. Vid 5× (≈1165 kort) är den rimliga
förväntan att just DEN kostnaden växer ytterligare, inte att
tråd-/ADR-filerna blir problemet.

**Slutsats om skala:** inget i den mätta friktionen idag pekar mot att
filbaserad lagring + bash-grindar är det som går sönder vid 5×. Det som
redan visar strain (backlog-CLI:ts branch-scan) är oberoende av
relationsfrågan i detta uppdrag och löses inte av en databasmigrering av
dokumentationssubstratet. En graf-databas för ~600 rader (5× vår nuvarande
trådmängd) vore — precis som uppdraget själv varnar för — spekulativ
komplexitet ovanför golvet: inget mätt behov motiverar den.

## Dom

**Bygg inte en extern databas för dokumentationssubstratet.** Bygg en
Backstage-inspirerad property graph UTTRYCKT I FILER: asymmetriska
relationer (`barn`, framtida `tråd→kort`) deklareras en gång och valideras/
härleds mekaniskt (grind, inte manuell spegling); symmetriska relationer
(`besläktad`) deklareras en gång per par och grindas för referentiell
integritet (målet finns) utan att kräva en spegelpost. T119:s Option C
(separat manifest, additiv, ingen brytande ändring av de 124 befintliga
raderna) är rätt form — bekräftad oberoende av nio branschsystem, inte bara
av lokal bekvämlighet. Supabase är fel verktyg för det här problemet av
samma skäl som Backstage inte byggde sin katalog databas-först: filer i git
ger versionshistorik, PR-granskning, offline-läsbarhet och nätverksfri
agent-läsning gratis, och inget mätt behov idag eller vid 5× kräver att vi
betalar bort de egenskaperna.

## Vad jag inte kunde belägga

- **"426 lessons"** (uppdragets premiss) — **UPPDATERAT: nu belagt, inte
  längre en lucka.** Mitt första pass missade rubrikformen (`### L<N>`,
  konfigurerad i `.lesson-policy.conf`) och drog fel slutsats om att talet
  var overifierbart. `npm run check:docs`s egen grind
  (`scripts/check-lesson-numbers.sh`) rapporterar 426 unika poster, bekräftat
  med `grep -cE '^### L[0-9]+' tasks/lessons.md` → `426`. Kvarstående i denna
  lucka: bara att jag inledningsvis publicerade en felaktig premiss om egen
  research-brist innan grinden kördes — bevarat här öppet, inte tyst rättat,
  som exempel på att "frånvaro av bevis i mitt eget sökförsök" inte är samma
  sak som "frånvaro av bevis i systemet".
- **Linear IssueRelation-schemats exakta lagringsform** (en post med
  type-enum, kontra två poster): primär-fetch mot
  `developers.linear.app/docs/graphql/...` gav en 301-redirect till
  Linears allmänna utvecklarsida utan schemadetaljen; belägget i tabellen
  ovan vilar på en sökmotor-sammanfattning av officiell dokumentation, inte
  en direkt schema-hämtning. Bedöms sannolikt korrekt (konsekvent med Jiras
  primärkälle-bekräftade mönster) men är inte primärkälle-verifierat i sig.
- **Logseqs exakta ordval för sin lagringsmodell:** direkthämtning av
  `docs.logseq.com` misslyckades (innehållet översteg fetch-verktygets
  storleksgräns). Slutsatsen (bidirektionella block-referenser, filbaserad)
  vilar på sökmotor-sammanfattningar av officiell dokumentation, inte en
  direkt sidhämtning.
- **Roam Researchs tekniska block-referens-mekanism i detalj:**
  `roamresearch.com` gav vid direkthämtning bara en produktbeskrivande
  rad, ingen teknisk dokumentation. Källorna som användes är tredjeparts
  (community-guider), inte Roams egen dokumentation — svagare
  källklass än övriga rader i jämförelsetabellen, och Roam exkluderades
  därför ur huvudtabellen (§ 1) och nämns bara som stödjande observation.
- **Dendrons skalbarhetspåstående** ("works as well with ten notes as it
  does with ten thousand") är ett vendor/community-citat, inte en
  oberoende benchmark jag kört själv. Citeras inte som bevis, bara som
  kontext att git-native PKM-verktyg gör det anspråket.
- **Om Kubernetes/Rust använder NÅGON informell tooling** utöver GitHubs
  inbyggda issue-länkning för att hålla ordning på relationer mellan KEPs/
  RFCs i stor skala — inte undersökt djupare än att bekräfta att
  mall-nivån saknar strukturerade fält. Möjligt att det finns
  sekundärverktyg (skript, dashboards) jag inte sökt efter.

## Rekommendation (inte ett beslut)

1. **Håll fast vid filer-i-git som sanningskälla för hela
   dokumentationssubstratet** — trådar, ADR:er, lessons, sessionsdok.
   Ingen Supabase-migrering av detta lager.
2. **Formalisera `besläktad` FÖRST** (lägst risk, snabbast värde): en grind
   som validerar att varje `besläktad`-omnämnt tråd-ID existerar i indexet
   — återanvänder `check-thread-index.sh`s befintliga backtick-ID-regex-idiom,
   rör ingen av de 124 raderna strukturellt.
3. **Bygg `barn`-manifestet enligt T119 Option C** som steg två — additivt,
   glest (bara trådar med faktiska barn får en post), utökar
   `check-thread-index.sh` med en femte invariant (manifest→giltiga
   tråd-/kort-ID:n, båda riktningar) i samma stil som befintliga inv. 3/4.
   Deklarera `barn` i EN riktning (tråden pekar på sina kort/barn-trådar);
   härled "vem är förälder till X" mekaniskt vid behov, spegla den aldrig
   för hand.
4. **Utnyttja att lessons redan har adresserbara ID:n (`L<N>`, mekaniskt
   grindade av `check-lesson-numbers.sh`)** — förutsättningen jag först trodde
   saknades finns redan. Att koppla `lesson→X`-relationer (t.ex. en lesson som
   uppstod ur en specifik tråd) in i samma relationsmodell som `barn`/
   `besläktad` är därför inte blockerat av ID-arbete, bara av samma
   manifest-mekanik som punkt 3 — ett eget, separat scope-beslut, inte del av
   detta uppdrag.
5. **Bygg inget genererat index/SQLite nu.** Inget mätt behov motiverar det
   (§ 4). Om Marcus vid ett senare tillfälle upprepat efterfrågar tvärsnitts-
   frågor som kräver manuell grep-arkeologi varje gång — då, och byggd av
   filerna i CI, aldrig handunderhållen, aldrig sanningskälla.
6. **Rör inte ADR-lagrets `Supersedes`/`Superseded by`-konvention.** Den är
   redan branschmönstret (samma familj som PEP och adr-tools), och dess
   låga ändringsfrekvens gör manuell tvåsidig disciplin en rimlig — inte en
   för svag — mekanism där.

## ADR-bar-bedömning

Prövat mot de tre villkoren (samtliga måste hålla):

1. **Svårt att återställa i kod ELLER koherens** — JA, tydligare än T119:s
   egen snävare fråga. Ett beslut att INTE migrera till Supabase är svårt
   att riva senare utan att skriva om hela dokumentations-läs-vägen i varje
   Code-sessions grundantagande ("agent kan läsa allt utan nätverk").
   Omvänt: att ha valt Supabase och sedan vilja tillbaka till filer vore en
   fullskalig exportmigrering.
2. **Överraskande utan kontext** — JA. Marcus egen order visar att svaret
   inte var uppenbart ens för honom ("vet jag inte, det kräver riktig
   research") — en framtida läsare skulle inte gissa rätt utan detta
   dokument.
3. **Resultat av en verklig avvägning** — JA. Frågbarhet/skalbarhet
   (Supabase-sidan) mot offline-läsbarhet/diffbarhet/enkelhet (filer-sidan)
   är en genuin, inte skenbar, avvägning — se § 3.

**Alla tre villkor håller → ADR krävs.** Given att denna fråga är BREDARE än
T119:s barn-fält-fråga (den täcker hela dokumentationssubstratets
arkitektur, inte bara ett fälts placering), är den naturliga formen en
ADR på denna högre nivå, med T119:s `barn`-platsval som en av dess
konkreta tillämpningar snarare än ett eget separat ADR. Det är en
rekommendation om SCOPE, inte ett beslut — Marcus väljer om det blir ett
paraply-ADR eller två separata.

## Källförteckning

**Primärkälla — produktens/verktygets egen dokumentation eller källkod:**

- [Backstage — Well-known Relations between Catalog Entities](https://backstage.io/docs/features/software-catalog/well-known-relations/)
- [Backstage — Descriptor Format of Catalog Entities](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Backstage — life-of-an-entity.md (källkodsrepo)](https://github.com/backstage/backstage/blob/master/docs/features/software-catalog/life-of-an-entity.md)
- [Notion — Database relations & rollups](https://www.notion.com/help/relations-and-rollups)
- [Airtable — Linking Records in Airtable](https://support.airtable.com/docs/linking-records-in-airtable)
- [Airtable — Connect your data with linked records](https://www.airtable.com/guides/build/connect-data-with-linked-records)
- [Obsidian — Backlinks](https://help.obsidian.md/plugins/backlinks)
- [Obsidian — Internal links (obsidian-help repo)](https://github.com/obsidianmd/obsidian-help/blob/master/en/Linking%20notes%20and%20files/Internal%20links.md)
- [Obsidian Dataview (blacksmithgu/obsidian-dataview)](https://github.com/blacksmithgu/obsidian-dataview)
- [Breadcrumbs-pluginet (SkepticMystic/breadcrumbs)](https://github.com/SkepticMystic/breadcrumbs)
- [Jira — Issue linking model](https://developer.atlassian.com/cloud/jira/platform/issue-linking-model/)
- [Linear — Issue relations](https://linear.app/docs/issue-relations)
- [adr-tools (npryce/adr-tools)](https://github.com/npryce/adr-tools)
- [MADR — About](https://adr.github.io/madr/)
- [Log4brains (thomvaill/log4brains)](https://github.com/thomvaill/log4brains)
- [PEP 1 — PEP Purpose and Guidelines](https://peps.python.org/pep-0001/)
- [Kubernetes KEP-mall (NNNN-kep-template)](https://github.com/kubernetes/enhancements/blob/master/keps/NNNN-kep-template/README.md)
- [Rust RFC-process](https://rust-lang.github.io/rfcs/0002-rfc-process.html)
- [Antora — Xref Macros and Page Links](https://docs.antora.org/antora/latest/page/xref/)
- [Astro — Content Layer Deep Dive](https://astro.build/blog/content-layer-deep-dive/)
- [Diátaxis](https://diataxis.fr/)
- [Anytype — Relations](https://doc.anytype.io/anytype-docs/basics/relations)

**Sekundärkälla (flaggad i text där använd):**

- Sökmotor-sammanfattningar av Linear GraphQL-schemat (direkt schema-fetch
  misslyckades, 301-redirect)
- Sökmotor-sammanfattningar av Logseq officiell dokumentation (direkt
  sidhämtning misslyckades, storleksgräns)
- Tredjeparts community-källor för Roam Research (t.ex. clawbot.ai,
  thesweetsetup.com) — Roams egen dokumentation gav ingen teknisk detalj
  vid direkthämtning
- Dendron/Foam-jämförelsen (wiki.dendron.so, docs.foamnotes.com) — citerad
  som kontext, inte som bevis för skalbarhetspåståendet

**Internt underlag (denna session, ej ny research, återanvänt):**

- [`barn-falt-tradregister-designbeslut-2026-08-04.md`](barn-falt-tradregister-designbeslut-2026-08-04.md) (T119, landad `#721`)
- `tasks/threads/README.md` (124 rader, mätt live)
- `docs/decisions/README.md` (ADR-format, Supersedes-konvention)
- `docs/decisions/ADR-063-airtable-bas-som-forstklassig-leverabel.md` (§ S91-not, kostnadskatalog för extern datakälla)
- `docs/reference/airtable-constraints.md` (refererad via ADR-063, ej omläst i sin helhet)
- `CLAUDE.md` § "Kortnummer" (mätt CLI-friktion vid 233 kort)
- `scripts/check-thread-index.sh` (98 rader, läst i sin helhet)
