# ADR-081: Nummer tilldelas vid landning, inte vid skrivning — lesson-fragment

- Status: Accepted (Session 91 — 2026-07-27)
- Datum: 2026-07-27
- Fas: Session 91, CI-/grind-arkitekturspåret (mekaniseringens punkt 6)

> **Om beslutsvägen — bokförd öppet.** Fattat av Code på Marcus stående
> delegering 2026-07-27 (*"Allt det här ska lösas ut! […] Kör på det du
> rekommenderar"*), inom restlistans spår A2 som Marcus godkänt. Noteras av
> samma skäl som i [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md):
> en framtida läsare ska kunna se vilka beslut som inte passerade Marcus-grinden.

## Kontext

2026-07-26 mintade två parallella agenter båda `L354` och `L355`, var och en
omedveten om den andra. Kollisionen upptäcktes först vid landningen och löstes
för hand — hover-grenens fyra poster numrerades om till `L356–L359`.

**Grundfelet är inte slarv.** Formen kräver att varje skribent *antar* nästa
lediga nummer genom att läsa `tasks/lessons.md` — 5 693 rader, 342 poster — som
någon annan samtidigt skriver i. Antagandet är osäkert per konstruktion så snart
mer än en aktör arbetar, och sedan multi-agent-landning blev normalformen är
kollisionen **garanterad, inte osannolik**. Samma klass gäller ADR-, tråd- och
kortnummer.

Sessionsdok S91 Del 4 punkt 6 registrerade detta som mekaniserings-post. Den har
spärrat hela lesson-skörden sedan dess: elva kandidater ligger omintade eftersom
numren inte kan tilldelas säkert.

**En observation som styrde valet:** vårt eget backlog-substrat har redan rätt
mönster utan att det kallats så. Kort-ID:n kolliderar aldrig, eftersom
`backlog`-CLI:t **äger allokeringen**. Lessons hade ingen motsvarande ägare — och
frågan blev därför inte "vilken allokator ska vi bygga" utan "kan vi undvika att
allokera innan serialiseringen ändå skett".

## Beslut

### 1. Numret tilldelas vid landning, aldrig vid skrivning

En lärdom skördas som **nummerlöst fragment** i `tasks/lessons.d/`, med
beskrivande slug och utan numrerad rubrik. Numret sätts när posten konsolideras
in i `tasks/lessons.md`.

Det ögonblicket är seriellt **utan att vi bygger något för det**: merge-grinden
([ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md)) släpper in en PR i taget
på `main`. Serialiseringen finns redan; beslutet är bara att lägga
nummertilldelningen där i stället för i den parallella fasen.

Ett fragment är en **fullgod leverans** — lärdomen är säkrad i fil, vilket är
kontinuitets-kravet. Konsolideringen är bokföring, inte räddning.

### 2. Grinden håller två invarianter, båda fail-closed

`scripts/check-lesson-numbers.sh` (config: `.lesson-policy.conf`, per husets
config-driven-konvention):

- **Ingen duplicerad numrerad rubrik** i `tasks/lessons.md`. En dubblett *är*
  beviset att två aktörer antog samma nummer.
- **Inget fragment bär ett nummer.** Skrivs `### L400` i ett fragment fälls
  grinden — numret är inte skribentens att välja.

**Frånvarande fragment-katalog är grönt, inte rött.** Vägen är tillgänglig, inte
obligatorisk; en session som inte skördar något ska inte behöva skapa en tom
katalog. Fragment-katalogens egen `README.md` är undantagen den andra kontrollen
så den får citera rubrik-former i förklarande syfte.

### 3. Grinden bevisas tvåsidigt och fortlöpande

Rött-först-beviset kördes före landning: rent tillstånd grönt · duplicerat
nummer rött med radnummer · numrerat fragment rött · nummerlöst fragment grönt ·
saknad katalog grönt. Därtill en **self-test-svit med sex fall**
(`scripts/test-check-lesson-numbers.sh`, 6/6 PASS), inkopplad i `ci.yml` bredvid
husets övriga grindvakts-sviter — per [ADR-039](ADR-039-konsistens-grindar-kadens.md)
§ lesson→grind: *en grind är inte en grind förrän dess fyrning fortlöpande
verifieras*.

### 4. Räckvidden är lessons — de tre andra serierna åtgärdas inte här

- **Kort:** redan löst. `backlog`-CLI:t äger allokeringen.
  **Detta påstående är FALSIFIERAT — se [§ Updates](#updates).** Raden står kvar
  fryst (L53); rättelsen och mätningen finns där.
- **ADR och tråd:** mintas nästan uteslutande av orkestreraren, alltså redan
  seriellt i praktiken, och ADR-räknings-grinden fäller på drift. Risken är reell
  men obeprövad. Att bygga fragment-vägar för dem nu vore spekulativ komplexitet
  ovanför golvet. **Omprövas om en kollision faktiskt inträffar** — det är
  villkoret, inte en känsla.

## Alternativ som övervägdes

- **Lås-fil med senaste numret.** Föreslagen i
  [MADR issue #28](https://github.com/adr/madr/issues/28) för exakt vårt problem.
  Förkastad av den svaghet issuen själv namnger: *"The con of this solution is
  that a Dev may forget to modify the lock file."* Den flyttar antagandet, tar
  inte bort det — och en agent som glömmer filen får samma kollision, nu med ett
  extra steg.
- **Grind mot kollision, utan fragment-väg.** Ett skript som fäller på dubblett
  och inget mer. Förkastad som halvmesyr: den säger nej *efter* att arbetet
  gjorts, vilket är precis vad som hände manuellt 2026-07-26 — grinden gör
  kollisionen synlig, inte billigare. [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md)
  mätte samma klass: en skriven regel hade ~0 % efterlevnad, medan att ta bort
  möjligheten att göra fel gav 75 %. Dubblett-kontrollen behålls däremot som
  **backstop** för den som skriver direkt i `lessons.md`.
- **Datum-baserade ID:n** (`2026-07-27-slug.md`), också ur MADR #28: *"The
  combination of date and title should never conflict."* Förkastad för lessons —
  våra 342 poster är korsrefererade i löpande prosa (`[[L347]]`, "L322-klassen",
  "samma klass som L328"). Ett ID-byte river referensnätet utan att lösa något
  fragment-vägen inte redan löser.
- **Numret ÄR PR-numret** (Rust RFC 0002: *"don't assign an RFC number yet; this
  is going to be the PR number"*). Principen adopteras — allokatorn ska vara
  något som inte kan kollidera — men inte den konkreta formen: PR-nummer är inte
  monotona i lesson-ordning, och samma referensnät-argument gäller.

## Verktygsvalet: towncrier som VERKTYG — retroaktiv redovisning

> **Tillagt 2026-07-30 (`TASK-86`), inte skrivet vid beslutet.** Ingenting ovan
> ändras; ett hål fylls. Verktygsvals-prövningen blev ett **stående** krav först
> 2026-07-27 (restlistans § A3b): innan ett nytt skript byggs ska prövningen göras
> och **utfallet redovisas** — även när domen blir "bygg eget". ADR-081 byggdes
> samma dag, före kravet.

Prövningen gjordes **delvis**. towncrier lästes, och dess *mönster* lånades — det
står i § Ärlighet om underlaget nedan. Vad som aldrig skrevs ned var domen i den
andra frågan: varför towncrier inte togs som **verktyg**. Två skilda frågor, en
besvarad.

**Skälen nedan är ett RESONEMANG, inte en mätning.** De rekonstruerades i
efterhand; ingen av dem prövades empiriskt 2026-07-27. Det skrivs ut hellre än att
formen kläs som en prövning som inte gjordes:

- **Körtidsberoendet.** towncrier är ett Python-verktyg; detta är ett
  Node-projekt. Att dra in en Python-körtid i grind-kedjan för vad som i vårt fall
  är en filnamnskonvention är en kostnad utan motsvarande vinst.
- **Livscykeln matchar inte.** towncrier bygger en changelog-sektion ur fragmenten
  vid **release** och tömmer katalogen. `tasks/lessons.md` har inga releaser — den
  är en löpande fil som konsolideras när en post landar, inte när en version
  klipps.
- **Verktyget gör inte vårt jobb.** towncrier tilldelar inget nummer; det undviker
  numret. Undvikandet *är* mönstret vi lånade — och ett mönster är gratis att låna.
  Tilldelningssteget, som är hela beslut 1 ovan, har towncrier inget stöd för.

**Vad som senare faktiskt mättes — av någon annan, i efterhand.** Den tredje
punkten fick empiriskt stöd först två dagar senare:
[nummerallokerings-passet 2026-07-29](../research/nummerallokering-parallella-aktorer-2026-07-29.md)
§ Fynd 1b körde towncrier `24.8.0` och fann att ett orphan-fragment renderas
**nummerlöst** vid `build` — verktyget tilldelar aldrig ett nummer. Det bekräftar
domen ovan. Det gör den **inte** till en mätning: passet hade ett annat syfte, kom
efter beslutet, och 2026-07-27 fanns bara resonemanget.

Samma pass bär också en korrigering av **precedent-anspråket** i § Ärlighet om
underlaget — att towncriers `+`-form är *"vår form exakt"* håller bara för halva
formen. Den korrigeringen rör mönster-lånet, inte verktygsvalet, och låg utanför
denna amendering. **Den är landad separat 2026-07-31 (`TASK-97`)** — se
[§ Updates](#updates).

## Konsekvenser

**Positiva:** kollisionen blir strukturellt omöjlig för nya lessons, inte bara
upptäckbar · den delade 5 693-radersfilen slutar vara en skrivkonflikt-yta i den
parallella fasen · **spärren på lesson-skörden lyfts** — elva väntande kandidater
kan landas som fragment omedelbart · en agent kan skörda utan att känna
numreringstillståndet, vilket tar bort ett skäl att läsa en 549 KB-fil.

**Negativa / skuld:** ett extra steg i konsolideringen, som måste utföras av
någon — glöms det ligger lärdomen kvar som fragment och syns inte i `lessons.md`
(mildrat av att grinden räknar upp antalet fragment vid varje körning, så antalet
är synligt i varje grön körning) · `lessons-hub-sync`-skillen i hub-repot känner
ännu inte fragment-vägen och behöver uppdateras med ett konsolideringssteg
(plugin-bump; **öppen post**) · två platser att leta på tills ett fragment
konsoliderats.

## Ärlighet om underlaget

> **Precedent-uppräkningen är RÄTTAD 2026-07-31 (`TASK-97`).** Den tidigare
> lydelsen kallade towncriers `+`-form *"vår form exakt"* och summerade till
> *"tre solida precedenter"* efter två uppräknade poster. Båda påståendena var
> fel. Vad som var fel, och vad som mättes i stället, står i
> [§ Updates](#updates). Beslut 1 är oförändrat.

**Precedent-rymden för just ADR-/lesson-numrering är tunn**, och det fejkas inte:
MADR issue #28 är **öppen och obesvarad** — ADR-communityn har problemet utan
etablerat svar. Vad som däremot är väl belagt är det generella mönstret — men det
måste räknas i **två halvor**, eftersom vår form är två steg och inte ett: *skriv
utan nummer i den parallella fasen* och *tilldela numret vid landningen*. En källa
som bär den ena halvan bär inte automatiskt den andra, och det var precis det fel
den tidigare lydelsen gjorde.

**Halva 1 — skriv utan nummer i den parallella fasen.**

- **towncrier** (Twisted, pytest, pip, BuildBot, attrs) löser samma
  delade-fil-konflikt för changelogs: *"the filename consists of the issue/ticket
  ID (or some other unique identifier) as well as the 'type'"*, och för fragment
  utan sådan identitet — *"For orphan news fragments (those that don't need to be
  linked to any issue ID or other identifier), start the file name with `+`."*
  ([tutorial](https://towncrier.readthedocs.io/en/stable/tutorial.html)). Är `+`
  hela namnet lägger verktyget till en slumphash: *"If that is the entire fragment
  name, a random hash will be added for you"*
  ([CLI-referensen](https://towncrier.readthedocs.io/en/stable/cli.html)).
- **Rust RFC** säger det om filen: *"Copy `0000-template.md` to
  `text/0000-my-feature.md` […] Don't assign an RFC number yet; This is going to
  be the PR number and we'll rename the file accordingly if the RFC is accepted."*
  ([`rust-lang/rfcs` README](https://github.com/rust-lang/rfcs/blob/master/README.md))
- **Pythons praxis** gör samma sak utan verktyg: ett utkast bär `9999` tills det
  är redo för PR.

**Halva 2 — tilldela numret vid landningen. Belagd, men INTE av towncrier.**

towncrier tilldelar aldrig ett nummer — varken vid `create` eller vid `build`. Ett
orphan-fragment renderas nummerlöst och `+`-hashen kastas bort; den var ett
filnamn, aldrig en identitet. Mätt på towncrier `24.8.0`
([nummerallokerings-passet](../research/nummerallokering-parallella-aktorer-2026-07-29.md)
§ Fynd 1b), och verktygets egen dokumentation gör inget motsatt anspråk. Stödet
för denna halva kommer från annat håll:

- **Ethereum EIP-1** lägger tilldelningen i själva merge-ritualen. När en EIP är
  redo ska editorn *"Assign an EIP number (generally incremental; editors can
  reassign if number sniping is suspected)"* och därefter *"Merge the corresponding
  pull request"* ([EIP-1](https://eips.ethereum.org/EIPS/eip-1)).
- **Rust RFC 0002** bär denna halva också, inte bara den första: *"Whomever merges
  the RFC should do the following: Assign an id, using the PR number of the RFC
  pull request."*
  ([`text/0002-rfc-process.md`](https://github.com/rust-lang/rfcs/blob/master/text/0002-rfc-process.md))
- **Python** har formen utan mekanism, som uttalad risk-acceptans från en aktiv
  auktoritet: *"Use 9999 when drafting. When they're happy it's ready for
  submission, check the next available number, rename, and open the PR. It's
  unlikely for that number to be taken by someone else during those couple of
  minutes."* (PEP-editor Hugo van Kemenade,
  [discuss.python.org](https://discuss.python.org/t/confusion-about-assignment-of-pep-numbers/38481)).
  Editor-rollens formella plikt står i [PEP 1](https://peps.python.org/pep-0001/):
  *"Check that the author has selected a valid PEP number or assign them a number
  if they have not"*.

En skillnad som inte ska slätas över: hos EIP och PEP **tilldelar** en utsedd
auktoritet numret vid landningen. Hos oss gör ingen det — vår grind **avvisar** en
dubblett i stället. Placeringen är precedentens; aktören är den inte.

Alltså, räknat per halva med posterna utskrivna så räkningen går att göra om:
**tre för halva 1** (towncrier, Rust RFC:s README, Pythons `9999`-praxis) · **tre
för halva 2** (EIP-1, Rust RFC 0002, Pythons sena tilldelning) · **noll för vår
exakta domän**, där MADR #28 fortfarande är obesvarad. Det är läget, och det
skrivs ut hellre än att räknas upp.

**Vad som faktiskt bär beslutet är inte precedenten — det är vår egen grind.**
Serialiseringen kommer från merge-grinden
([ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md)), och den är verifierad mot
rulesetet självt: se [§ Updates](#updates) för vad kön garanterar, vad den inte
gör, och vilken restrisk som blir kvar. Precedenten säger att *placeringen* vid
landningen är en beprövad form — den ersätter inte mätningen av vår egen
mekanism.

**Vad som inte är mätt:** att fragment-vägen faktiskt följs av agenter. Grinden
gör den felaktiga vägen omöjlig, men den kan inte tvinga någon att skörda alls.
Efterlevnaden bör läsas av i praktiken innan formen utsträcks till fler serier.

## Uppföljning

- **`lessons-hub-sync`-skillen** (hub) uppdateras med konsolideringssteget —
  öppen post, kräver plugin-bump.
- **De elva väntande kandidaterna** landas som fragment och konsolideras därefter
  seriellt.
- **Ompröva räckvidden** om en ADR-, tråd- eller kortnummer-kollision faktiskt
  inträffar.

## Relaterat

- [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) — merge-grinden som
  tillhandahåller serialiseringen detta beslut lutar sig mot
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) — kadens-principen och
  lesson→grind-kravet på fortlöpande verifiering
- [ADR-079](ADR-079-instruktionsleverans-barare-per-lager.md) — mätningen som
  motiverar mekanism före skriven regel
- [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) — samma
  delegerings-bokföring, samma spår
- [`tasks/lessons.d/README.md`](../../tasks/lessons.d/README.md) — konventionen i
  bruksform

## Updates

### 2026-07-31 — Precedent-anspråket är rättat och grunden omlagd (`TASK-97`)

§ Ärlighet om underlaget kallade towncriers `+`-form *"vår form exakt"* och
summerade till *"tre solida precedenter för principen"*. **Två fel, båda av den
klass web-research-disciplinen namnger — *räkningen fejkas aldrig*.** Till
skillnad från besluts-texten (fryst, L53) är underlags-sektionen inget beslut, så
den är rättad **på plats**; rättelsen deklareras här så att den inte blir en tyst
rivning.

**Fel 1 — towncrier bär halva formen.** Vår form är två steg: skriv utan nummer i
den parallella fasen, och tilldela numret vid landningen. towncrier bär det
första. Det andra bär det inte alls — verktyget tilldelar aldrig ett nummer, och
ett orphan-fragment renderas nummerlöst vid `build`. Mätt på towncrier `24.8.0`
([passets Fynd 1b](../research/nummerallokering-parallella-aktorer-2026-07-29.md)).
Tilldelningssteget är hela beslut 1, och det saknade alltså stöd i den citerade
källan.

**Fel 2 — räkningen stämde inte med sin egen uppräkning.** *"Tre solida
precedenter"* stod efter **två** uppräknade poster (towncrier, Rust RFC 0002).
Talet gick alltså inte att kontrollera mot texten det sammanfattade. Det överlevde
tre månader, två amenderingar och ett research-pass som läste sektionen och
upprepade *"tre"* utan att räkna om. Räkningen står nu **per halva, med posterna
utskrivna**.

**Källorna är hämtade i förstahandskälla 2026-07-31**, inte återanvända ur
passets sammanfattning: [EIP-1](https://eips.ethereum.org/EIPS/eip-1) ·
[PEP 1](https://peps.python.org/pep-0001/) ·
[discuss.python.org t/38481](https://discuss.python.org/t/confusion-about-assignment-of-pep-numbers/38481)
· `rust-lang/rfcs` README och `text/0002-rfc-process.md` (rå-hämtade) ·
towncriers tutorial och CLI-referens.

**Merge-grindens serialisering — mätt mot rulesetet, inte ihågkommen.** Beslut 1
lutar sig på att landnings-ögonblicket är seriellt. Det håller, men formuleringen
*"släpper in en PR i taget"* är en **förenkling**, och det syns först när
konfigurationen läses i stället för att minnas. Rulesetet `main-skydd`, hämtat via
`gh api repos/high-five-group/miranon-media-admin/rulesets/19627609` 2026-07-31:

| Parameter | Värde |
|---|---|
| `merge_method` | `MERGE` |
| `min_entries_to_merge` | `1` |
| `max_entries_to_merge` | **`3`** |
| `max_entries_to_build` | `3` |
| `grouping_strategy` | `ALLGREEN` |

**Upp till tre poster kan alltså landa i samma operation.** Egenskapen beslut 1
behöver håller ändå — men av ett annat skäl än "en i taget". GitHub bygger varje
kö-post *"with the latest version of the `base_branch` as well as changes from
pull requests ahead of it in the queue"* och landar dem *"in a first-in-first-out
order where the required checks are always satisfied"*
([GitHub-dokumentationen](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)).
Den obligatoriska checken är `CI Passed or Skipped`, `ci.yml` triggar på
`merge_group`, och `scripts/check-lesson-numbers.sh` körs i den kedjan. En
dubblett mellan två poster i **samma** grupp prövas därför mot det kombinerade
tillståndet, inte var för sig.

**Vad det betyder rakt:** grinden gör inte *tilldelningen* seriell — numret väljs
fortfarande i skribentens arbetsträd. Den gör *landningen* seriell och prövar
tilldelningen fail-closed när den landar. Restrisken är exakt Pythons fönster
(*"those couple of minutes"*), hos oss flyttat till sträckan mellan
konsoliderings-commit och landning, och den fångas av beslut 2:s
dubblett-invariant. Det bokförs öppet i stället för att designas bort.

**Håller beslut 1 utan towncrier-anspråket? Ja — och frågan förtjänar ett rakt
svar i stället för tystnad.** Beslut 1 vilar redan i sin egen text på
merge-grindens serialisering, inte på towncrier; towncrier förekom enbart i
underlags-sektionen, som precedent för mönstret. Den halva towncrier faktiskt bär
är den halva lånet gällde, och den står obruten. Tilldelnings-halvan står nu på
EIP-1 och Rust RFC 0002 — båda lägger den i merge-ögonblicket — plus Pythons sena
tilldelning som disciplin. **Beslut 1 är oförändrat av denna rättelse.**

**Samma klass som posten nedan.** `TASK-93` rättade beslut 4:s *"Kort: redan
löst"*; detta rättar precedent-räkningen. Båda var påståenden som skrevs som
fakta utan mätning, i samma ADR, och båda upptäcktes av någon annan än den som
skrev dem. Kopplingen är dessutom bokstavlig: kortet som bär denna rättelse är det
`TASK-97` som posten nedan namnger i sin tredje punkt — det fick sitt nummer när
en kollision mellan huvudträdet och en gren tvingade fram en omnumrering.

**Kopior som INTE är rättade här** — deklarerade i stället för att lämnas tysta:

- [`tasks/lessons.d/README.md`](../../tasks/lessons.d/README.md) § "Formen är
  lånad, inte påhittad" bär samma påstående (*"vilket är exakt vår form"*) och
  samma kö-förenkling.
- [`docs/decisions/README.md`](README.md):s ADR-081-rad bär *"tre solida
  precedenter"* med samma två uppräknade poster.

**Funnet, inte rättat:** § Alternativ tillskriver **Rust RFC 0002** citatet *"don't
assign an RFC number yet; this is going to be the PR number"*. Den formuleringen
står i `rust-lang/rfcs` **`README.md`**; RFC 0002 har en egen, kortare lydelse och
bär tilldelningssteget separat. Substansen håller — källhänvisningen pekar på fel
dokument. Båda punkterna ligger utanför detta korts filyta respektive AC.

### 2026-07-30 — Beslut 4:s kort-undantag är falsifierat; omprövningsvillkoret har utlösts (`TASK-93`)

Beslut 4 skrev: *"**Kort:** redan löst. `backlog`-CLI:t äger allokeringen."*
**Det är falskt under vår konfiguration**, och rättas här öppet i stället för att
skrivas om ovan (besluts-texten är fryst, L53).

**Vad som var fel i resonemanget.** Premissen — CLI:t äger allokeringen — gäller
inom **ett** arbetsträd. Varje git-worktree har en egen `backlog/tasks/`, och
allokatorn läser det lokala filsystemet. Sedan worktree-isoleringen mekaniserades
2026-07-28 är "ett träd" inte längre normalfallet. ADR:n mätte alltså inte en
mekanism utan en arbetsform som just höll på att bytas ut.

**Mätt, inte resonerat.** Tre körningar i äkta git-worktrees, CLI `1.47.1`,
identisk uppställning, en variabel i taget (`TASK-93` AC #1/#4):

| Fall | `check_active_branches` | A:s kort | Utfall |
|---|---|---|---|
| Rött | `false` | committat | **kollision** — A och B fick båda `task-4` |
| Grönt | `true` | committat | ingen kollision — A `task-4`, B `task-5` |
| Gräns | `true` | **ocommitterat** | **kollision kvar** — båda `task-4` |

Noll kollisioner på 168 kort mätte alltså turen och den seriella arbetsformen,
inte en mekanism.

**Vad skyddet täcker — och vad det inte täcker.** Detta är amenderingens kärna,
eftersom en riskminskning som läses som en garanti är farligare än ingen alls:

- **Täcks:** ett kort som är **committat** på en annan aktiv gren (inom
  `active_branch_days: 30`). CLI:t läser grenen och hoppar över numret.
- **Täcks INTE — ocommitterat arbete.** Fönstret mellan `task create` och
  `git commit` är osynligt för allokatorn i varje annat träd (fall "Gräns" ovan).
- **Täcks INTE — huvudträdet mot en gren.** 2026-07-30 mintade orkestreraren två
  kort som låg **ospårade** i huvudträdet; en bygg-agent räknade från `main` och
  landade på samma `task-95`. Påslagen flagga hade **inte** hjälpt: konflikten låg
  mellan huvudträdet och en gren, inte mellan två grenar. Löstes genom att parkera
  kortet och återskapa det via CLI:t → `TASK-97`.
- **Täcks INTE — grenar äldre än `active_branch_days`.** 30 dagar är gränsen.

Flaggan är därmed en **riskminskning, inte en garanti**. Den formuleringen bor i
[`CLAUDE.md`](../../CLAUDE.md) § Kortnummer, där den gäller i handlings-ögonblicket
— en ADR läses inte före ett `task create`.

**Åtgärd.** `check_active_branches` satt till `true` i `backlog/config.yml`.
Flipp-kriteriet var deterministiskt och avgjordes av mätning, inte omdöme: alla
173 korts status avlästes före och efter, på två axlar (CLI-rapporterad status och
frontmatterns `status:` på disk), och **båda diffarna var tomma**. Instrumentet
kontrastbevisades — en enda framtvingad statusändring fick båda axlarna att fälla
och peka ut rätt kort — så nollresultatet är äkta, inte blindhet.

**Vad det kostar — och vad det INTE kostar.** Flaggan är inte gratis, men
kostnaden träffar smalare än väntat. Mätt lokalt, 173 kort, 28 lokala + 16
fjärrgrenar (median av fem varv):

| Anrop | `false` | `true` | Slutsats |
|---|---|---|---|
| `task list --plain` | ~0,52 s | ~6,50 s | **~12× dyrare** |
| `task create` | ~0,69 s | ~7,09 s | **~10× dyrare** |
| `task <id> --plain` (view) | ~0,52 s | ~0,55 s | **opåverkad** |

Det närliggande felslutet vore att multiplicera: `check-backlog-closure.sh` gör
~173 CLI-anrop, alltså ~+1 000 s. **Så blev det inte, och det mättes i stället
för att antas.** Grinden gör *ett* `list`-anrop plus ~173 `view`-anrop, och view
rör inte gren-skanningen. Skarp körning med flaggan `true`: **164,60 s** — inom
det intervall grinden låg på före (154–165 s). Kostnaden är alltså per
`list`/`create`, inte per CLI-anrop.

Talet är lastberoende: `list` med `true` mättes till ~6,5 s vid loadavg 3,2 och
~10–12 s vid loadavg 5,4. Det är lokala tal, inte CI-tal.

**Raden var oskyldig när den skrevs.** `check_active_branches: false` sattes vid
instansens födelse (`e106e7f`, S48) och ändrades aldrig. Commit-meddelandet listar
`integration none` och `autoCommit false` som medvetna val; flaggan nämns inte —
den är ett init-default ingen valde. Samma klass som ADR-083:s fynd: rätt när den
skrevs, fel när förutsättningarna flyttade, ogranskad för att ingen visste att den
fanns.

**Omprövningsvillkoret är utlöst — för kort.** Beslut 4 skrev: *"**Omprövas om en
kollision faktiskt inträffar** — det är villkoret, inte en känsla."* Villkoret är
uppfyllt för kort-serien (tre instanser 2026-07-29/30: en reproducerad i rigg, en
skarp, en nästan-kollision). **För ADR- och tråd-serierna är det inte utlöst** —
ingen kollision har inträffat där, och beslut 4:s andra punkt står därför orörd.

**Öppen post, medvetet orörd:** `remote_operations: false` är också avstängd mot
tillverkarens default. Den är en egen fråga — den lägger nätanrop på varje
CLI-körning — och rördes inte av `TASK-93`.

Underlag: [`docs/research/nummerallokering-parallella-aktorer-2026-07-29.md`](../research/nummerallokering-parallella-aktorer-2026-07-29.md)
· [`tasks/lessons.d/osparad-bokforing-ar-en-delad-tillstandsyta.md`](../../tasks/lessons.d/osparad-bokforing-ar-en-delad-tillstandsyta.md)
