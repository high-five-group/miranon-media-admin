# ADR-095: Relationsmodellen för dokumentationssubstratet — filer förblir sanningskälla, relationer deklareras en gång

- Status: Accepted (Session 97 — 2026-08-05)
- Datum: 2026-08-05
- Fas: Session 97, tråd `T122` (efterföljare till `T119`)

## Kontext

`T119` ställde en smal fråga: var ska ett `barn:`-fält bo i trådregistret?
Marcus rev ramen och ställde den breda frågan i stället (verbatim, `T122`
2026-08-04):

> *"Vi behöver ju liksom bygga i mönstret av en RIKTIG RELATIONSDATABAS, eller
> hur nu absoluta eliten inom dokumentation och liknande löser sådant här. […]
> Om det betyder att vi behöver migrera hela vårt dokumentationssystem till en
> extern databas typ Supabase eller liknande så GÖR VI DET. Jag vill bygga
> proffsigt och skalbart för framtiden."*

Frågan är alltså inte var ett fält bor, utan hur relationer modelleras i ett
kunskapssystem som ska hålla i år.

**Vårt faktiska tillstånd, disk-verifierat:** 124 trådrader, 94 ADR:er, 229
backlog-kort, 455 lessons. `besläktad` finns som **fri text** — aldrig
validerad mot att målet existerar. `barn` finns inte alls som mekanism; det
uttrycks i tre olika ad hoc-former (formell `to-issues`-hierarki, lös
radprosa, tvärsnittsproduktion spridd över andra trådars PRD-träd). `T95`,
registrets mest aktiva tråd, har noll spårbara commits via den
`[T<NN>]`-taggning som ändå finns. Konsistensen garanteras idag av disciplin,
inte av verktyg.

**Researchen** ([`relationsarkitektur-dokumentationssystem-2026-08-04.md`](../research/relationsarkitektur-dokumentationssystem-2026-08-04.md))
granskade nio system oberoende: Backstage, Obsidian+Breadcrumbs, Notion,
Airtable, Linear, Jira, adr-tools/MADR, Python PEP, plus Kubernetes KEP och
Rust RFC som negativa precedent. De konvergerar på en datamodell, och den är
inte den vi kör.

## Beslut

### 1. Filer i git förblir sanningskälla för hela dokumentationssubstratet

Trådar, ADR:er, lessons, sessionsdok, backlog-kort. **Ingen migrering till
Supabase eller någon annan extern databas.**

Den starkaste enskilda datapunkten är Backstage självt — branschens mest
citerade property-graph för utvecklardokumentation, byggd av ett företag med
resurser att bygga vad som helst. Det valde ändå filer-i-git som sanning plus
en beräknad, disponibel databas som frågelager, och beskriver uttryckligen sin
egen databas som en **ingest-cache**: *"entities are ingested from various
authoritative sources and held in a database"* (`life-of-an-entity.md`).

Vad en migrering hade kostat, vägt mot värden vi redan uttalat: versionshistorik
via `git log`/`git blame` gratis, PR-granskningsbarhet per rad, diffbarhet, och
— mest konkret för hur varje Code-session faktiskt exekverar — **en agent kan
läsa allt utan nätverk**. Att spegla databasen tillbaka till git för att behålla
den egenskapen betyder att underhålla två system med synk-drift som ny felklass:
exakt den dubbel-sanning [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)
§ S91-not redan katalogiserar som ett medvetet pris för **produktdata** — utan
att dokumentationslagret har något av de behov som motiverade priset där.

### 2. Två relationsklasser, aldrig i samma fält

Ingen av de nio granskade implementationerna förväxlar dem. Vi gör likadant:

| Klass | Exempel | Deklareras | Motsatt riktning |
|---|---|---|---|
| **Asymmetrisk** | `barn`/förälder, framtida `tråd→kort` | EN gång, i EN riktning | **härleds mekaniskt** — aldrig manuellt speglad |
| **Symmetrisk** | `besläktad` (peer) | EN gång **per par** | finns inte — A besläktad B *är* B besläktad A |

Den bärande regeln: **ingen människa håller två fritextlistor i synk för hand
som primär mekanism.** Där branschen ändå gör det manuellt (PEP:s
`Replaces`/`Superseded-By`) är det en medveten eftergift på en lågfrekvent,
högomsorgs-relation — inte normen för högfrekventa relationer. Se beslut 6.

### 3. `besläktad` formaliseras FÖRST

Lägst risk, snabbast värde, rör ingen befintlig rad strukturellt: en grind som
validerar att varje `besläktad`-omnämnt tråd-ID **existerar i indexet**.
Återanvänder `scripts/check-thread-index.sh`s befintliga backtick-ID-idiom
i stället för att uppfinna ett nytt.

Grinden validerar **referentiell integritet**, inte spegling — den kräver
uttryckligen ingen motpost i målets rad.

### 4. `barn` byggs som separat manifest (`T119` Option C)

Additivt och glest: bara trådar med faktiska barn får en post. Rör ingen av de
124 befintliga raderna och inte pipe-antals-invarianten. Fungerar identiskt
oavsett om tråden har en kortfil eller inte — vilket löser `T95`-fallet utan
specialfall.

`check-thread-index.sh` utökas med en **ny invariant** (manifest → giltiga
tråd-/kort-ID:n) i samma stil som befintliga inv. 3/4.

> **Rättelse 2026-08-05 (samma session, vid bygget):** denna rad sade
> ursprungligen *"femte invariant … båda riktningar"*. **Båda formuleringarna
> var fel.** (1) Ordinaltalet: `TASK-140` (`besläktad`) landade först och tog
> slot 5, så `barn`-invarianten blev faktiskt **Inv 6** — bygg-agenten byggde
> mot koden i stället för mot detta ordinaltal och flaggade avvikelsen.
> Ordinaltal i en ADR är stale i samma stund en annan post landar före; de hör
> inte hemma här. (2) *"Båda riktningar"* var tvetydigt på ett **farligt** sätt
> — det kan läsas som ett bidirektionellt indexfil-par likt inv. 3/4, vilket är
> **precis den manuella spegling beslut 2 två stycken högre upp förbjuder**.
> Bygg-agenten läste det korrekt som "båda ID-namnrymderna" (tråd-ID och
> kort-ID valideras var för sig) och skrev ut sitt skäl. Frasen är struken här
> hellre än omformulerad: invarianten validerar existens i den enda riktning
> manifestet deklarerar, och det är hela poängen med en asymmetrisk relation.

`barn` deklareras i EN riktning: tråden pekar på sina kort och barn-trådar.
"Vem är förälder till X" härleds mekaniskt vid behov och **speglas aldrig för
hand**.

### 5. Inget genererat frågeindex byggs nu

Inget mätt behov motiverar det. Villkoren för när det ska omprövas, explicit
så att en framtida läsare kan pröva dem: **om ett upprepat, faktiskt (inte
hypotetiskt) frågebehov uppstår** som kräver manuell grep-arkeologi varje gång.

Byggs det då: **SQLite, inte Supabase** — genererat ur filerna i CI, aldrig
handunderhållet, aldrig incheckat, aldrig sanningskälla. Skälet är att vårt
dokumentationssubstrat har EN skribent i taget, är läs-tungt och redan
git-versionerat; Supabase löser samtidiga skribenter, real-time och hostad auth
— problem vi inte har här.

### 6. ADR-lagrets `Supersedes`/`Superseded by` lämnas orörd

Den är redan branschmönstret (samma familj som PEP och adr-tools), och dess
låga ändringsfrekvens gör manuell tvåsidig disciplin en rimlig mekanism just
där. Detta är det uttryckliga undantaget från beslut 2:s härlednings-regel, och
det är motiverat av frekvens — inte av att relationen skulle vara
väsensskild.

### 7. Formen är ETT paraply-ADR, inte två

Researchen lämnade scope-valet öppet (paraply kontra separata ADR:er för
migrerings-frågan och `barn`-platsvalet). Paraplyet väljs: avvägningen är
sammanhängande — `barn`-platsvalet följer av datamodellen, som följer av
sanningskälle-valet. Två ADR:er hade skapat en korsreferens-skuld mellan
halvor av ett och samma resonemang. `T119`:s `barn`-platsval är därmed en
**tillämpning** av denna ADR, inte ett eget beslut.

## Alternativ som övervägdes

- **Supabase som sanningskälla för dokumentationssubstratet.** Förkastat per
  beslut 1. Vinsterna är verkliga (JOIN-frågor tvärs entitetstyper, FK-constraints
  som databasnivå-garanti, skalbarhet vid mycket större N) — de vägde bara
  lättare än offline-läsbarhet, diffbarhet och att slippa en andra sanningskälla.
  Detta är en genuin avvägning, inte en skenbar.
- **`barn` som femte kolumn i indextabellen** (`T119` Option A). Förkastat:
  bryter pipe-antals-invarianten över alla 124 rader och är svårt att backa ur.
- **`barn` som inline-token i `Ingång`-kolumnen** (`T119` Option B). Förkastat:
  utökar ett prosafält med struktur, vilket ger en parser som måste tolka fri
  text.
- **Genererat SQLite-index nu.** Förkastat per beslut 5 — spekulativ komplexitet
  ovanför golvet, ingen nuvarande användare.

## Konsekvenser

**Positiva:** relationsmodellen får en garant som är verktyget, inte
disciplinen. Additiva mekanismer betyder att inget befintligt innehåll behöver
migreras för att grinderna ska kunna börja gälla. Agent-läsning utan nätverk
förblir sann, vilket varje Code-sessions läs-väg redan förutsätter.

**Negativa, öppet burna:** manifest-filen är en ny artefakt att hålla i synk,
och den enda befintliga `kort:`-prosan i `Ingång`-kolumnen blir en andra källa
om den inte städas bort när manifestet införs. Tvärsnittsfrågor kräver fortsatt
grep tills ett index eventuellt byggs enligt beslut 5:s villkor.

## Avgränsningar — vad denna ADR INTE avgör

**Den semantiska frågan "vad räknas som barn" är öppen och eskaleras
medvetet.** Mätningen visar att den inte är mekanisk:

- `T69`/`T95`: barn = raka PRD-skivor (entydigt).
- `T85`: skiv-serien **plus** tre spinoff-kort (`TASK-49`–`51`) som föddes som
  fristående QA-fynd, aldrig som skivor under någon `T85`-PRD.
- `T86`: 15+ fristående kort födda under nattbygget, flera av dem egentligen
  produkter av **andra** trådars arbete (`task-45`/`46` nämns som fynd i `T69`:s
  spår, inte `T86`:s egna).

Migrering av befintlig text är alltså ingen `sed`-körning — `T86`:s fall kräver
ett människo-omdöme om vilka av 15+ nämnda kort som faktiskt är barn i den
mening en framtida färskhets-grind ska mäta. **Det omdömet fattas av Marcus när
manifestet byggs**, inte här och inte av en agent.

Likaså är `lesson→X`-relationer (t.ex. en lesson som uppstod ur en specifik
tråd) ett eget scope-beslut. Förutsättningen finns redan — lessons bär
adresserbara `L<N>`-ID:n, mekaniskt grindade av
`scripts/check-lesson-numbers.sh` — men kopplingen in i denna relationsmodell
är inte beslutad här.

## Uppföljning

Ordningen är beslutad, tidpunkten inte: (3) `besläktad`-grinden, sedan (4)
`barn`-manifestet med sin egen invariant. Båda är egna arbets-kort och
plockas i Marcus takt.

**Korten (tillagda 2026-08-05, samma session):** `TASK-140` bär beslut 3,
`TASK-141` bär beslut 4 — med `TASK-141` beroende av `TASK-140`, eftersom båda
utökar `scripts/check-thread-index.sh` och parallellt arbete kolliderar.
Sekvensen ovan är alltså kodad som ett beroende i registret, inte bara skriven
här. Raden tillagd efter att ADR:n mintats med en hänvisning till kort som då
inte fanns — Marcus fångade luckan med frågan om vad som var utfört kontra
förberett.

## Relaterat

- Tråd [`T122`](../../tasks/threads/README.md) — beslutets hemvist; [`T119`](../../tasks/threads/README.md)
  är den smalare föregångaren, vars Option C denna ADR antar.
- Research: [`relationsarkitektur-dokumentationssystem-2026-08-04.md`](../research/relationsarkitektur-dokumentationssystem-2026-08-04.md)
  (nio system) och [`barn-falt-tradregister-designbeslut-2026-08-04.md`](../research/barn-falt-tradregister-designbeslut-2026-08-04.md)
  (optionsrymden A/B/C).
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) § S91-not —
  extern datakällas kostnader, vägda för produktdata och medvetet inte
  generaliserade hit.
- Grindarna som utökas: `scripts/check-thread-index.sh`,
  `scripts/check-lesson-numbers.sh`.

## Källor

Primärkällor för datamodellen (fullständig förteckning i research-dokumentet):

- [Backstage — Well-known Relations between Catalog Entities](https://backstage.io/docs/features/software-catalog/well-known-relations/)
- [Backstage — Descriptor Format of Catalog Entities](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Backstage — Life of an Entity](https://backstage.io/docs/features/software-catalog/life-of-an-entity/) (ingest-cache-formuleringen)
- [Astro Content Layer](https://astro.build/blog/content-layer-deep-dive/) — byggtids-graf ur frontmatter, samma familj

**Research-passets egen självrättelse, bevarad öppet:** dess första utkast
påstod att `lessons.md` saknade adresserbara ID:n. Fel — upptäckt genom att
köra repots **egen** grind (`check-lesson-numbers.sh`), som bekräftade 426
poster i `L<N>`-form. Egna regex-gissningar slog fel där en befintlig grind
hade svaret. Frånvaro av bevis i ett eget sökförsök är inte frånvaro av bevis i
systemet.
