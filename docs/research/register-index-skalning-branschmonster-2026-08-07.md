---
owner: marcus803
updated: 2026-08-07
review_by: 2027-02-07
status: draft
---

# Hur branschledande projekt skalar växande register-/indexdokument (Code, 2026-08-07)

> **Proveniens:** avgränsat research-pass, 2026-08-07, kört oisolerat i
> huvudkatalogen (`docs/s99-del3-t126`, HEAD `835b509f`). Frågan är EN,
> nedskriven, avgränsad: hur hanterar branschledande projekt och etablerade
> metodiker växande register-/indexdokument (issue-register, ADR-index,
> decision-logs, changelogs) så att de förblir navigerbara utan att radera
> historik. Ingen kod, ingen ADR och inget register i detta repo har rörts —
> enda leveransen är denna fil.

## Vad jag hittade redan innan jag sökte på webben

Inventeringen (`docs/research/`, `docs/decisions/`, `tasks/lessons.md`) visade
att frågan **delvis redan är besvarad lokalt**, och att sammanhanget frågan
nämner (ett handskrivet trådregister, 131 poster, 63 % pausade) är exakt
`tasks/threads/README.md` i detta repo — inte ett hypotetiskt exempel.

- **[ADR-085](../decisions/ADR-085-hubbens-lessons-i-volymer.md)** (2026-08-01)
  löste EXAKT samma klass problem för hubbens `tasks/lessons.md`: tunt index +
  frysta volymer + en aktiv volym, uttryckligen modellerad efter Node.js
  `CHANGELOG.md`-mönstret, med ett mätt rotationströskel (3 000 rader, kalibrerat
  mot det värsta uppmätta enskilda lyftet). Web-researchen bakom den ADR:n
  täcker redan Node.js-mönstret, ADR-praxisens fil-per-post-form och
  Keep a Changelog-splittar (Symfony, GitLab) — jag har INTE kört om den
  researchen, bara verifierat att den håller och byggt vidare på den där mina
  delfrågor går längre (Kubernetes/Rust/Python, log rotation som princip,
  motröster).
- **[`barn-falt-tradregister-designbeslut-2026-08-04.md`](barn-falt-tradregister-designbeslut-2026-08-04.md)**
  (2026-08-04, status `draft`) är ett näraliggande men DISTINKT beslut: var
  ett `barn:`-fält (tråd→kort-relationen) ska bo. Den rör inte
  register-STORLEK/rotation, men den mätte registrets nuvarande form exakt
  (då 121 rader, tabellform, `check-thread-index.sh` validerar radform) och
  slog fast progressiv disclosure som redan gällande princip (rad, sedan kort
  "när den växer" — 25 av då 121 trådar hade egna kort). Den principen är
  direkt relevant för min dom nedan.
- **[ADR-053](../decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md)**
  (2026-06-14) är det GRUNDLÄGGANDE beslutet som skapade registret. Dess egen
  forskningsgrund (event sourcing/materialiserad vy, ADR-praxis, Linear,
  Kanban) motiverar redan tunt-index-plus-tunt-kort-formen. Den forskningen är
  äldre (drygt 7 veckor) men rör ett arkitekturmönster, inte en verktygsversion
  — jag bedömer den som ej åldrad i sak, och bygger vidare på den snarare än
  att köra om den.
- **`tasks/lessons.md`** bär två lärdomar som är direkt relevanta för HUR ett
  register ska granskas, inte OM det ska rotera: **L413** (strukturellt gröna
  kontroller kan dölja ett människo-synligt ordningsfel — trådregistret hade
  två omkastade radpar trots grön grind) och **L405** (register kan vara
  formellt korrekta och ändå osanna mot disk). Dessa är inte om skalning, men
  de sätter ribban för vad "navigerbart" måste betyda i min dom.

**Vad som är nytt i detta pass:** delfråga 3 (Kubernetes KEP / Rust RFC /
Python PEP som NAMNGIVNA register för hundratals designdokument), delfråga 4
(log rotation som EXPLICIT princip, inklusive dess divergens från handskrivna
register), och delfråga 5 (aktivt sökta motröster) är inte täckta av
`ADR-085` eller `barn-fält`-passet. Delfråga 1 och 2 upprepas här kortfattat
med egen primärkälls-verifiering (direkt `WebFetch` mot `adr.github.io`,
Nygards originalartikel och `keepachangelog.com`) snarare än att bara referera
`ADR-085`s sammanfattning, eftersom uppdraget bad om egen källbeläggning.

**Mätt grundtillstånd, 2026-08-07:** `tasks/threads/README.md` är **268 rader**,
**131** trådrader (`active`: 15, `paused`: 82, `closed`: 34 — alltså 63 % `paused`,
vilket bekräftar uppdragets premiss exakt). `docs/decisions/README.md` bär
97 ADR-rader i motsvarande form. Ingen av filerna har någon
genererings-mekanism — `scripts/check-thread-index.sh` och
`scripts/check-adr-count.sh` validerar **form och antal**, aldrig **innehåll**
(bekräftat genom läsning av båda skripten).

## Kort svar

**Branschen använder två olika, ortogonala mönster beroende på dokumentets
fysiska form — och blandar man ihop dem uppstår fel råd.** (1) För
**fil-per-post**-register (ADR, RFC, PEP, KEP) väger ingen post någonsin bort
oavsett status — indexet hålls navigerbart genom att GENERERA det mekaniskt ur
post-metadata (eller genom att låta en katalog-listning VARA indexet), aldrig
genom att en handskriven tabell krymps. (2) För **enfils-append-only**-register
(changelog-klassen, och ADR-085s `lessons.md`) är det etablerade svaret
**storlekstriggad rotation**: ett tunt index/pekare-fil + frysta arkivfiler,
dubbelriktade länkar, arkiverat innehåll rörs aldrig igen och raderas aldrig.

**Statuspartitionering (flytta "stängda" poster ur registret) har jag inte
hittat NÅGOT primärkälls-stöd för, i någon av de sju studerade källorna.**
Överallt jag tittade stannar posten kvar i registret oavsett status —
statusfältet är en filtrerings-/synlighetssignal, aldrig en
raderings-/flytt-trigger. Kubernetes KEP-processen säger det rakt ut om sin
"Rejected"-status: *"kept around as a historical document"*. Detta är den
starkaste enskilda motröst mot att partitionera bort `tasks/threads/README.md`s
82 `paused`-rader — `paused` motsvarar närmast KEP:ens `Deferred` ("proposed
but not actively being worked on"), och `Deferred`-KEP:ar flyttas aldrig ut ur
sin synliga plats.

**Given repots faktiska mått (268 rader) ligger trådregistret långt under
varje uppmätt rotationströskel** jag hittat (GitLab splittrade vid 258 KB,
Symfony/Node splittrar per version-generation, ADR-085s eget tröskel är 3 000
rader). Rotation är alltså **mätbart för tidigt** just nu — men frånvaron av
ett satt tröskel-VÄRDE (till skillnad från `lessons.md`, som fick ett explicit
tal i ADR-085) är en lucka värd att stänga INNAN den behövs, inte när den
redan spruckit.

## Delfråga 1 — ADR-världen: ADR-praxisens förstasida, Nygard, MADR

**Ingen av de tre primärkällorna ger index-skalningsråd.** Verifierat genom
direkt hämtning:

- **`adr.github.io`** definierar "decision log" som *"the collection of all
  ADRs created and maintained in a project"* men ger inga strukturella råd om
  index/README när samlingen växer. Ingen skalningsvägledning på förstasidan.
- **Nygards originalartikel (2011)** ([cognitect.com](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions))
  definierar bara två mekanismer som är relevanta här: (a) *"ADRs will be
  numbered sequentially and monotonically. Numbers will not be reused"* — en
  fil per beslut, aldrig återanvänt nummer; (b) superseded-status: *"If a
  decision is reversed, we will keep the old one around, but mark it as
  superseded"* — den gamla filen tas ALDRIG bort, bara flaggas. Artikeln
  innehåller noll ord om index-/README-hantering vid tillväxt — frågan fanns
  helt enkelt inte i 2011 års skala.
- **MADR** ([MADR-projektets egen sida](https://adr.github.io/madr/)) är den enda av
  de tre som direkt adresserar skala: *"large projects may accumulate hundreds
  of decision records over time, and finding them might be hard"* — svaret är
  **kategorisering via underkataloger** (`decisions/backend/`,
  `decisions/ui/`), inte rotation eller arkivering. MADR sätter också ett
  namngivningstak (`NNNN`, upp till 9 999 poster) men löser inget om en enda
  INDEXFIL växer — för att MADR inte har en central indexfil i sin kärnform;
  varje post är sin egen fil.
- **Tredjeparts-verktyget `adr-log`** ([adr/adr-log](https://github.com/adr/adr-log))
  är ekosystemets faktiska svar på "hur håller vi indexet i synk med hundratals
  filer": det **genererar** logg-tabellen mekaniskt ur filerna själva och
  injicerar den vid en markör (`<!-- adrlog -->`) i en angiven fil. Det är
  alltså inte teamet som handskriver raden när en ADR läggs till — verktyget
  läser filsystemet och skriver om tabellen. Detta är MEKANISKT samma
  lösning som Python-PEP:arnas och Rust-RFC:ernas (se delfråga 3), fast som
  ett fristående community-verktyg snarare än inbyggt i ADR-praxisens egen spec.

**Superseded som arkiveringsform:** i samtliga tre källor betyder "superseded"
**flagga, aldrig flytta eller radera**. Den gamla filen ligger kvar på sin
plats i repot för alltid; bara ett statusord och en pekare till den nya ändras.
Detta är identiskt med hur detta repos EGET `docs/decisions/README.md` redan
fungerar (`ADR-015` — `Superseded by ADR-067` — filen finns kvar, raden i
indexet finns kvar).

## Delfråga 2 — Changelog-praxis: keepachangelog.com

**Specifikationen själv är tyst om splittring — verifierat genom direkt
hämtning av `keepachangelog.com/en/1.1.0/`.** Den ger strukturregler
(nyaste-överst, `Unreleased`-sektion, kategorierna Added/Changed/Deprecated/
Removed/Fixed/Security, länkbara versioner/sektioner) men **adresserar aldrig**
arkivering, splittring i flera filer, eller vad som händer när filen blir för
lång att ladda. Det är ett genuint gap mellan spec och praxis i stor skala —
inte en tystnad som betyder "låt den växa", bara en fråga specen aldrig ställde.

**Praxis i stora projekt fyller gapet, konsekvent i samma form (tunt
index + frysta arkiv):**

- **Node.js** ([`nodejs/node/CHANGELOG.md`](https://github.com/nodejs/node/blob/main/CHANGELOG.md)):
  roten är en tunn tabell (aktuella versioner + status Current/LTS/EOL); äldre
  poster ersätts med pekare i exakt formen
  `[Moved to doc/changelogs/CHANGELOG_V012.md#0.12.14](...)`. Detta är
  ADR-085s uttryckliga förlaga.
- **GitLab** (issue [`gitlab-org/gitlab#18526`](https://gitlab.com/gitlab-org/gitlab/-/issues/18526)):
  splittringen triggades **mätt av filstorlek** — *"At the moment it is 258Kb
  of size"* — inte av tid eller postantal. Strukturen blev
  `CHANGELOG.md` (aktuell major) + `archive-10.md`, `archive-11.md` osv. per
  tidigare major-version, plus en konsoliderad `archive.md` för allt före
  version 10.
- **Symfony**: en `CHANGELOG-X.Y.md` per minor-version — samma familj,
  version-gräns snarare än storleks-mätning som splittringspunkt.

**Gemensamt för alla tre, verbatim ur `keepachangelog.com`s egen underliggande
princip och bekräftat i GitLabs trådar:** arkiverat innehåll redigeras aldrig
i efterhand och raderas aldrig — *"do not delete old entries: someone may
still upgrade from an old version"* (community-konsensus citerad i sök­träffen
runt splittrings-diskussionen, ej ett direkt spec-citat — se § Vad jag inte
kunde belägga för graden av källstyrka här).

## Delfråga 3 — Stora OSS-projekt: Kubernetes KEP, Rust RFC, Python PEP

**Den bärande upptäckten i hela detta pass:** ingen av de tre namngivna
registren är en HANDSKRIVEN, växande tabell. Alla tre är **fil-per-post**, och
alla tre löser "navigerbart index" genom **mekanisk generering** eller genom
att låta **katalogstrukturen vara indexet** — aldrig genom att en människa
lägger till en rad i en delad indexfil för hand.

### Kubernetes KEP (kubernetes/enhancements)

- Struktur: en **katalog per KEP**, organiserad under SIG-underkataloger
  (`keps/sig-architecture/`, `keps/sig-cli/`, …) — inte en platt lista.
  KEP:en identifieras av sitt spårnings-issue-nummer.
- Statusfältet lever i en **`metadata.yaml`** per KEP och är en sluten enum:
  `provisional` → `implementable` → `implemented`, med sidogrenarna
  `deferred`, `rejected`, `withdrawn`, `replaced`
  (källa: `keps/sig-architecture/0000-kep-process/README.md` +
  KEP-mall `NNNN-kep-template/README.md`).
- **`rejected`: "The approvers and authors have decided that this KEP is not
  moving forward. The KEP is kept around as a historical document."** —
  verbatim bekräftelse att avslag inte tar bort posten.
- **`replaced`: "superseded-by metadata value should point to the new
  KEP"** — samma superseded-mönster som ADR-praxisen, fast maskinläsbart
  (ett metadata-fält, inte fri text).
- `deferred` (repots motsvarighet till `paused`) definieras uttryckligen som
  *"not actively being worked on"* — och stannar i sin SIG-katalog, den flyttas
  aldrig till en separat arkivyta.
- **Ej verifierat:** jag kunde inte nå `kep.sigs.k8s.io` direkt (DNS-fel i
  denna miljö, `getaddrinfo ENOTFOUND`) för att se den byggda, renderade
  dashboarden med sortering/filter. Slutsatserna ovan vilar på källkoden i
  `kubernetes/enhancements`-repot, inte på den rendrade sajten.

### Rust RFC (rust-lang/rfcs)

- Struktur: en **fil per RFC** i `text/`, aldrig flyttad eller borttagen —
  fastställt via README + `generate-book.py`.
- Indexet är ett **byggartefakt**: `generate-book.py` skapar automatiskt
  `SUMMARY.md` och symlänkar från `text/`-katalogens innehåll, renderat som en
  bläddringsbar mdBook-"bok". Ingen människa underhåller en tabell manuellt.
- Status/disposition (merge/close/postpone) avgörs via en "Final Comment
  Period"-process och lever i PR:ens historik/`rfcbot.rs`, inte i en
  handskriven kolumn i en huvudfil. "Postponed" RFC:er kan återöppnas senare —
  ytterligare bekräftelse att inget raderas.

### Python PEP (python/peps)

- Struktur: en **fil per PEP**, aldrig raderad oavsett status.
- **PEP 0 (indexet) genereras helt vid byggtid** av `pep_sphinx_extensions`:
  parsar RFC-2822-liknande headers ur varje PEP-fil, validerar metadata, och
  skriver `pep-0000.rst` som en Sphinx-post innan dokumenten laddas
  (källa: [peps.python.org/docs/rendering_system](https://peps.python.org/docs/rendering_system/)).
  Detta är den renaste industriformen av "generera indexet, skriv aldrig
  raden för hand".
- Statustaxonomin är bred (Draft/Active/Accepted/Deferred/Rejected/
  Superseded/Withdrawn/Provisional/Final) med tvåbokstavskoder, och indexet
  har **flera navigeringslager utöver den numeriska tabellen**: ämnesbaserade
  delindex (`/topic/governance`, `/topic/packaging`, `/topic/release`,
  `/topic/typing`) — en modell för navigerbarhet genom SEGMENTERING av
  åtkomstväg, inte genom att gömma poster.
- **Ej verifierat:** exakt aktuellt PEP-antal 2026 gick inte att fastställa
  via sökningarna (inga träffar gav ett tal); jag har inte räknat raderna i
  den live renderade `pep-0000`-tabellen.

**Sammanfattning delfråga 3:** samtliga tre namngivna register är
**fil-per-post + mekaniskt/strukturellt genererad eller katalog-buren
navigering**. Ingen av dem har det problem uppdragets kontext beskriver
(en enda handskriven tabellfil som växer monotont) eftersom deras
grundarkitektur gör frågan moot — indexet KAN inte drifta från posterna för
att det härleds ur dem (PEP, Rust) eller aldrig existerar som en separat
artefakt (Kubernetes katalogstruktur).

## Delfråga 4 — Log rotation som princip

**`logrotate`s princip, verifierad mot dess dokumenterade beteende:** trigger
är **storlek ELLER ålder** (det som slår till först), den aktiva filen behåller
sitt stabila namn och skrivhandtag (appen märker aldrig av rotationen),
roterade filer namnbyts/komprimeras, och kvarhålls till ett `maxage`-tak innan
de raderas.

**Precedent för HANDSKRIVNA register (inte maskinloggar) som följer samma
grundform:** changelog-splittarna i delfråga 2 (Node.js, GitLab, Symfony) och
detta repos egen `ADR-085` är exakt detta mönster tillämpat på
människoskriven, kuraterad text snarare än maskingenererade loggrader. GitLabs
**mätta** trigger (258 KB) och ADR-085s **mätta** trigger (3 000 rader,
kalibrerat mot ett uppmätt värsta-fall-lyft på +1 764 rader) är båda
storleksbaserade i `logrotate`s mening, inte åldersbaserade.

**Den viktiga DIVERGENSEN, uttryckligt flaggad:** `logrotate`s `maxage`
**raderar** till slut. **Ingen** av de handskrivna register-precedenten jag
hittat gör det. Node.js arkiv-changelogs för `io.js` och `v0.8`–`v0.12` ligger
kvar i repot över ett decennium senare. GitLabs `archive.md`/`archive-NN.md`
konsoliderar men tar inte bort. ADR-085s volymer är uttryckligen **"frysta …
nya block tillkommer aldrig"**, inte tidsbegränsat kvarhållna. **Att låna
`maxage`-radering från maskinloggmönstret till ett handskrivet
besluts-/trådregister skulle alltså bryta mot samtliga studerade precedent.**
Rotation-som-princip håller; radering-som-konsekvens gör det inte.

## Delfråga 5 — Sökta motröster

**Ärligt resultat: jag hittade ingen primärkälla som argumenterar FÖR att
medvetet låta en enda, monolitisk registerfil växa obegränsat.**
`keepachangelog.com`s tystnad (delfråga 2) är den närmaste kandidaten, men det
är en **frånvaro av ställningstagande**, inte ett uttalat försvar av
obegränsad tillväxt — jag har inte hittat en primärkälla som säger "vi
splittrar aldrig, och här är varför". Detta redovisas som ett hål i
underlaget, inte som "sådana projekt finns inte".

**Den verkliga motrösten som FINNS, men på en annan axel:** samtliga
fil-per-post-register (ADR, RFC, PEP, KEP) accepterar **obegränsad tillväxt av
ANTALET FILER** för alltid — ingen av dem tar någonsin bort en gammal post,
oavsett hur irrelevant eller gammal den är. Det är en genuin, väldokumenterad
"låt det växa"-hållning. Men den gäller filantal i en katalog, inte radantal i
en delad tabellfil, och att citera den som stöd för att låta
`tasks/threads/README.md` växa obegränsat SOM ENDA FIL vore en kategori-
förväxling — exakt den typ av felslut uppdragets ram varnar för genom att be
om en avgränsad, prövad slutsats snarare än en analogi som råkar passa.

## Dom

Prövat mot repots faktiska register (`tasks/threads/README.md`, 268 rader,
131 poster, 63 % `paused`):

1. **Rotation är mätbart FÖR TIDIGT just nu.** Varje uppmätt tröskel i
   branschen (GitLab 258 KB, ADR-085 3 000 rader) ligger en storleksordning
   eller mer över filens nuvarande 268 rader. Att bygga en
   arkivvolym-mekanism idag löser inget existerande problem.
2. **Statuspartitionering (flytta `paused`-rader ur huvudregistret) saknar
   stöd i samtliga sju studerade källor** och strider direkt mot den
   närmaste namngivna precedenten (Kubernetes: `Deferred` stannar synlig i
   sin katalog). 63 % `paused` är dessutom, per KEP-analogin, den NORMALA
   fördelningen för ett levande designregister — inte ett tecken på att
   registret är fel format.
3. **Registrets EGEN arkitektur matchar redan branschmönstret i grunden.**
   Progressiv disclosure (rad → eget kort "när den växer", 25 av 131 trådar
   har idag ett eget kort) ÄR fil-per-post-mönstret som ADR/RFC/PEP/KEP
   bygger på, applicerat i miniatyr. Det är inte en avvikelse att laga.
4. **Den enda verifierade skillnaden mot branschens absoluta toppskikt är
   GENERERINGS-axeln, inte rotations-axeln.** PEP 0, Rust RFC-boken och
   `adr-log`-verktyget härleder sitt index mekaniskt ur post-metadata.
   `tasks/threads/README.md` och detta repos egen `docs/decisions/README.md`
   är båda 100 % handskrivna, med enbart FORM-validering
   (`check-thread-index.sh`, `check-adr-count.sh`) — ingen av dem genererar
   eller korsverifierar INNEHÅLL. Detta är precis den lucka `L413` och
   `L405` redan bevisade empiriskt kostar (omkastade radpar, gröna grindar
   ändå): en mekaniskt genererad tabell kan per konstruktion inte drifta
   från sina källor, en handskriven kan alltid göra det oavsett hur många
   formkontroller som är gröna.

## Vad jag inte kunde belägga

- **`kep.sigs.k8s.io`** (den renderade, byggda KEP-dashboarden) gick inte att
  nå i denna miljö (`getaddrinfo ENOTFOUND`). Mina slutsatser om Kubernetes
  vilar på källkoden i `kubernetes/enhancements`, inte på den publicerade
  sajtens faktiska navigeringsfunktioner (sortering, filter, sök) — de kan
  vara rikare eller enklare än vad jag kunnat verifiera.
- **Exakt aktuellt PEP-antal (2026)** gick inte att fastställa via sökning;
  jag har inte räknat raderna i den live renderade `pep-0000`-tabellen.
- **"Radera aldrig gamla changelog-poster"** är citerat ur ett sammanfattat
  sökträff-referat kring GitLab/Symfony-diskussionerna, inte ur ett direkt
  verbatim-citat jag själv läst i primärkällan ord för ord — bedöms som
  trovärdigt (konsekvent med alla andra primärkällor jag LÄST direkt) men
  källstyrkan är svagare än övriga citat i denna fil.
- **Delfråga 5 (motröster) gav ett negativt resultat** — frånvaro av bevis,
  inte bevis på frånvaro. Ett projekt som medvetet försvarar obegränsad
  enfils-tillväxt kan finnas utan att mina sökningar hittat det.
- **Om `adr-log`-verktyget faktiskt används av något av de tre
  branschledar-registren jag studerade (Kubernetes/Rust/Python) har jag inte
  verifierat** — det är ett fristående ADR-ekosystem-verktyg jag citerar som
  ekosystemets svar på samma problemklass, inte som mekanismen bakom KEP/RFC/
  PEP-indexen (de har var sin bespoke generator).
- **MADR-sidans påstående "no tooling supports MADR 3.0.0"** är hämtat från en
  sida vars egen färskhet jag inte kontrollerat mot ett versionsdatum — kan
  vara inaktuellt.

## Rekommendation

**Detta är en rekommendation, inte ett beslut — Marcus väger.**

1. **Rör inte `tasks/threads/README.md`s form nu.** Ingen mätt branschtröskel
   är nådd; en rotationsmekanism byggd idag löser inget existerande problem
   och lägger till en rörlig del utan mothavare i behov (jfr
   dubbelriktad över-engineering-vakten i hub-CLAUDE.md).
2. **Sätt DÄREMOT ett explicit, mätt rotationströskel nu — som tal i en ADR
   eller åtminstone en rad i registrets egen "Så här läser du"-sektion —
   innan filen närmar sig det.** ADR-085s modell (tunt index + `vol-NN`-filer,
   trigger vid ett uppmätt radantal kalibrerat mot historiskt värsta lyft) är
   den direkt återanvändbara mallen; samma person/session som byggde den kan
   återanvända dess form utan ny research. Detta stänger den lucka
   `lessons.md` hade INNAN ADR-085 (ingen satt gräns, upptäckt vid krisen)
   proaktivt i stället för reaktivt.
3. **Partitionera INTE bort `paused`-rader ur huvudregistret.** Ingen
   studerad branschprecedent stöder det, och den närmaste namngivna
   (Kubernetes `Deferred`) säger uttryckligen emot. Om läsbarheten för
   `active`-arbete är det faktiska problemet (inte filstorleken), är en
   FILTRERAD VY (t.ex. ett skript som listar bara `active`-rader on demand)
   en branschmässigt belagd lösning som inte kräver att flytta data ur
   registret — men detta var inte uppdragets fråga och kräver egen
   avvägning om det blir aktuellt.
4. **Den investering som faktiskt skulle flytta detta register till
   branschens toppskikt är generering, inte rotation** — att låta
   `check-thread-index.sh` (eller en ny grind) HÄRLEDA tabellraderna ur
   per-tråd-metadata (t.ex. `lifecycle:`-fältet i tråd-kortens frontmatter för
   de 25 som har kort) i stället för att bara validera formen på en
   handskriven rad. Detta är en distinkt, större investering (kräver att alla
   131 trådar bär strukturerad metadata, inte bara de 25 med kort) och bör
   vägas som ett EGET beslut — inte buntas med rotationsfrågan.

## Källförteckning

### ADR-världen

- Nygard, M. (2011). [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — cognitect.com (primärkälla, hämtad direkt).
- [ADR-praxisens förstasida](https://adr.github.io/) (primärkälla, hämtad direkt).
- [MADR — organisering av stora samlingar](https://adr.github.io/madr/) (primärkälla, hämtad direkt).
- [adr/adr-log — verktyget som genererar ADR-loggen mekaniskt](https://github.com/adr/adr-log) — README (sökträff-sammanfattning).
- [joelparkerhenderson/architecture-decision-record — README](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/README.md) — bred ADR-guide, superseded-hantering (primärkälla, hämtad direkt).

### Changelog-praxis

- [keepachangelog.com/en/1.1.0](https://keepachangelog.com/en/1.1.0/) — specifikationen (primärkälla, hämtad direkt).
- [nodejs/node — CHANGELOG.md](https://github.com/nodejs/node/blob/main/CHANGELOG.md) — tunt-index-mönstret (primärkälla, hämtad direkt).
- [gitlab-org/gitlab — issue #18526](https://gitlab.com/gitlab-org/gitlab/-/issues/18526) — mätt splittringströskel, 258 KB (primärkälla, hämtad direkt).

### Stora OSS-register

- [kubernetes/enhancements — KEP-processen (statusenum/metadata)](https://github.com/kubernetes/enhancements/blob/master/keps/sig-architecture/0000-kep-process/README.md) — sökträff-sammanfattning, ej direkt hämtad pga. sidans längd.
- [kubernetes/enhancements — keps/README.md](https://github.com/kubernetes/enhancements/blob/master/keps/README.md) — SIG-underkatalogsstrukturen (primärkälla, hämtad direkt).
- [rust-lang/rfcs — README.md](https://github.com/rust-lang/rfcs/blob/master/README.md) — RFC-flödet (primärkälla, hämtad direkt).
- [rust-lang/rfcs — generate-book.py](https://github.com/rust-lang/rfcs/blob/master/generate-book.py) — den genererade bok-mekanismen (identifierad via sökning, ej radvis läst).
- [peps.python.org/pep-0000](https://peps.python.org/pep-0000/) — PEP-indexet (primärkälla, hämtad direkt).
- [peps.python.org/docs/rendering_system](https://peps.python.org/docs/rendering_system/) — hur PEP 0 genereras vid byggtid (sökträff-sammanfattning).

### Log rotation

- [Log rotation — Wikipedia](https://en.wikipedia.org/wiki/Log_rotation) samt `logrotate`-dokumentation (Baeldung, KeyCDN) — trigger/retention-principerna (sökträff-sammanfattning, generellt känd branschmekanik, ej ett enskilt kontroversiellt påstående).

### Lokala precedent i detta repo (redan byggda beslut, återanvända som underlag)

- [ADR-085](../decisions/ADR-085-hubbens-lessons-i-volymer.md) — volymrotation för `tasks/lessons.md`, samma problemklass löst redan 2026-08-01.
- [ADR-053](../decisions/ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — trådregistrets grundbeslut.
- [`barn-falt-tradregister-designbeslut-2026-08-04.md`](barn-falt-tradregister-designbeslut-2026-08-04.md) — registrets nuvarande mätta form + progressiv disclosure-principen.
- `tasks/lessons.md` L405, L413 — varför strukturellt gröna register kan ändå vara obrukbara/osanna.
