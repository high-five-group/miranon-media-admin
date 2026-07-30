---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: stable
---

# Nummerallokering i en delad serie när flera aktörer arbetar parallellt (Code, 2026-07-29)

> **Proveniens:** avgränsat research-pass, 2026-07-29. Beställt som underlag för
> beslutet om [ADR-081](../decisions/ADR-081-nummer-tilldelas-vid-landning.md):s
> räckvidd ska utvidgas från lessons till ADR-, tråd- och kortnummer. Ingen kod,
> ingen ADR och inget kort rört — enda leveransen är denna fil.
>
> **Uppdraget var att PRÖVA och om möjligt falsifiera ADR-081:s
> precedent-genomgång**, inte att upprepa den. Tre tidigare försök på samma pass
> dog på serverfel utan att landa en rad; därför skrevs denna fil som skelett och
> pushades före första källäsningen, och uppdaterades per stängd delfråga.

## Frågan, ordagrant

> Hur löser branschledande, versionshanterade projekt tilldelning av löpnummer i
> en delad serie (issue-, RFC-, ADR-, changelog-fragment-nummer) när flera aktörer
> arbetar parallellt — och ändras det etablerade mönstret när aktörerna är
> autonoma agenter i stället för människor?

## Kort svar

**Den dominerande branschformen är ingen av våra tre — den är att låta en extern,
kollisionsfri räknare som redan finns göra jobbet (forge:ns issue- eller PR-nummer), eller
att avskaffa den delade räknaren helt.** Rust, Kubernetes och towncrier-projekten
återanvänder forge-numret; Rails, Django, changesets och Linux-kernelns patch-flöde har
ingen delad räknare att kollidera i. Block-reservation **(ii)** hittade jag i noll av sju
flöden. "En aktör mintar" **(i)** är etablerat hos PEP och EIP, men som en *roll skild från
skribenten med flera innehavare* — och Python **tog bort** just det steget som onödig
latens. Tilldelning vid landning **(iii)** har starkast stöd, men på annan grund än
[ADR-081](../decisions/ADR-081-nummer-tilldelas-vid-landning.md) angav: mätningen visar att
towncrier aldrig tilldelar ett nummer, så den precedenten bär bara halva formen.

**Ja, svaret ändras med autonoma agenter — åt motsatt håll mot väntat.** ID-allokering i en
delad serie är **oadresserad i 0 av 5** leverantörers primärdokumentation, och Cursor
rapporterar att den mänskliga lösningen kollapsade i praktiken: agenter höll lås för länge
eller glömde släppa dem, och tjugo agenter sjönk till genomströmningen av två eller tre.
Branschens agent-mönster är att **isolera fysiskt och tilldela ägandeskap i förväg** — inte
att låta aktörer förhandla om ett nummer.

**Passets viktigaste fynd stod inte i uppdraget.** Jag mätte ADR-081:s eget undantag och
det håller inte: två arbetsträd med vår `backlog`-konfiguration allokerade **båda
`task-4`**. Kort är inte lösta. Men CLI:t bär redan mekanismen — med
`check_active_branches: true` hoppade det till `task-5`. **Den billigaste åtgärden i hela
materialet är en config-rad, inte en ny form.**

## Delfråga 1 — Vad gör stora OSS-projekt faktiskt?

Sju flöden lästes i primärkälla. Formen som dominerar är **inte** någon av våra tre —
den är: *återanvänd en identifierare som en extern, monoton, kollisionsfri räknare
redan har allokerat.* Nästan alltid forge:ns issue- eller PR-nummer.

| Projekt | Vad skribenten skriver | Vem allokerar numret | När |
|---|---|---|---|
| Rust RFCs | `text/0000-my-feature.md` — beskrivande slug, inget nummer | GitHub:s PR-räknare | när PR:en öppnas |
| Kubernetes KEPs | katalog prefixad med tracking-issue-numret | GitHub:s issue-räknare | när issuen skapas |
| Python PEPs | `pep-NNNN.rst` — författaren **gissar** nästa lediga | PEP-**editor** validerar eller omtilldelar | vid editorns godkännande |
| Ethereum EIPs | (EIP-1 föreskriver ingen pre-nummer-form) | EIP-**editor** tilldelar | vid merge |
| towncrier-användare | issue-numret som filnamn | GitHub:s issue-räknare | redan allokerat |
| changesets | slumpmässigt människoläsbart namn | `human-id`-biblioteket | vid skrivning |
| Linux-kernelns patch-flöde | inget globalt nummer alls | — | aldrig |

### Rust RFC och Kubernetes KEP — forge-räknaren som allokator

Rust säger det rakt ut i sin `README.md`: *"Copy `0000-template.md` to
`text/0000-my-feature.md` (where "my-feature" is descriptive). Don't assign an RFC
number yet; This is going to be the PR number and we'll rename the file accordingly
if the RFC is accepted."* Därefter: *"Now that your RFC has an open pull request, use
the issue number of the PR to rename the file: update your `0000-` prefix to that
number."* ([rust-lang/rfcs](https://github.com/rust-lang/rfcs/blob/master/README.md))

Kubernetes gör samma sak ett steg tidigare i flödet: *"KEPs are now prefixed with
their associated tracking issue number."* Motiveringen är dubbel — numret ger *"both
the KEP a unique identifier and provides an easy breadcrumb for people to find the
issue where the current state of the KEP is being updated."*
([kubernetes/enhancements](https://github.com/kubernetes/enhancements/blob/master/keps/README.md))

Detta är ADR-081:s egen princip — *allokatorn ska vara något som inte kan kollidera* —
men med ett tillägg ADR-081 inte drog ut: **båda projekten valde en allokator som
redan fanns i infrastrukturen.** Ingen av dem byggde en.

### Python PEP — författarens nummer är ett förslag, inte ett faktum

PEP 1 är den enda källan i genomgången som beskriver **exakt vår nuvarande form** —
skribenten läser tillståndet och antar nästa lediga: *"You, the PEP author, fork the
PEP repository, and create a file named `pep-NNNN.rst` that contains your new PEP.
NNNN should be the next available PEP number not used by a published or in-PR PEP."*

Men formen står inte ensam. En **editor-roll** bär auktoriteten, och författarens
gissning är uttryckligen provisorisk. Editorns plikt vid varje inkommande PEP:
*"Check that the author has selected a valid PEP number or assign them a number if
they have not (almost always just the next available number, but sometimes it's a
special/joke number, like 666 or 3141)."* Och: *"Once approved, they will assign your
PEP a number."* ([PEP 1](https://peps.python.org/pep-0001/))

Det är alltså form **(i)** — en aktör mintar — men i en variant vi inte hade på
kartan: *skribenten får föreslå, auktoriteten fastställer.* Kollisionen löses inte
genom att förhindras, utan genom att en utsedd part alltid har sista ordet.

### Ethereum EIP — tilldelning vid landning, av en utsedd part

EIP-1 lägger tilldelningen i merge-ögonblicket. Editorns uppgifter när en EIP är
redo: *"Assign an EIP number (generally incremental; editors can reassign if number
sniping is suspected)"* följt av *"Merge the corresponding pull request."*
([EIP-1](https://eips.ethereum.org/EIPS/eip-1))

Det är form **(iii)** i renodlad form, och den enda källan i genomgången som
adresserar ett *adversariellt* motiv — "number sniping", att någon lägger beslag på ett
attraktivt nummer. Irrelevant för oss, men det förklarar varför auktoriteten behöver
kunna omtilldela.

### towncrier-användarna — mätt, inte antaget

ADR-081 skriver att towncrier stödjer fragment utan ID via `+`-prefix och kallar det
*"vår form exakt"*. Principen håller; **den empiriska bilden gör det inte.** Jag
räknade fragmenten i tre av towncrier-projekten ADR-081 nämner, via GitHub:s
contents-API 2026-07-29:

| Projekt | Fragment i trädet | Med issue-nummer | Orphan (`+`) |
|---|---|---|---|
| pytest (`changelog/`) | 25 | 25 | 0 |
| Twisted (`src/twisted/newsfragments/`) | 22 | 22 | 0 |
| attrs (`changelog.d/`) | 2 | 2 | 0 |
| pip (`news/`) | 0 (tömd efter release) | — | — |

**49 av 49 fragment bär ett forge-allokerat issue-nummer. Noll använder orphan-formen.**
Orphan-vägen finns i verktyget, men i flaggskeppsprojektens träd är den i praktiken
oanvänd. Formen som dominerar är återigen forge-räknaren.

### changesets och Linux — de som aldrig allokerar

`changesets` namnger sina fragment med ett slumpat människoläsbart namn. Rationalen
står i klartext i deras egen källkod, som en kommentar precis över anropet:

```ts
// Worth understanding that the ID merely needs to be a unique hash to avoid git conflicts
// experimenting with human readable ids to make finding changesets easier
const changesetID = humanId({
  separator: "-",
  capitalize: false,
});
```

([`packages/write/src/index.ts`](https://github.com/changesets/changesets/blob/main/packages/write/src/index.ts))

Det är den skarpaste formuleringen jag hittade av vad ett fragment-ID egentligen är
för: **att undvika git-konflikter.** Läsbarheten är bekvämlighet, inte identitet.

Linux-kernelns patch-flöde saknar global räknare helt. `[PATCH n/m]`-numreringen är
**lokal för serien**, inte global: *"If there are four patches in a patch series the
individual patches may be numbered like this: 1/4, 2/4, 3/4, 4/4."* Identiteten bärs
i stället av Message-ID, commit-SHA och ämnesraden — *"The `summary phrase` of your
email becomes a globally-unique identifier for that patch."*
([submitting-patches](https://www.kernel.org/doc/html/latest/process/submitting-patches.html))

Världens mest parallella versionshanterade projekt har alltså löst frågan genom att
**inte ha den serien**.

### Vad ingen gjorde

**Noll av de sju använder block-reservation.** Jag sökte aktivt efter formen och
hittade den inte i något av flödena. Det är inte bevis för att den inte finns någon
annanstans — men i den precedent-rymd uppdraget pekade ut är form **(ii)** obelagd.

## De två förhandsfynden — prövade

Uppdraget bar två fynd gjorda i ett enda sökanrop, med instruktionen att fälla dem om
de inte höll. **Ett håller och är starkare än beskrivet. Ett håller men är värdelöst
som precedent.**

### Fynd 1 — towncriers kollisionsskydd: HÅLLER, och det är två skydd, inte ett

Påståendet var att om `+` är hela fragmentnamnet läggs en slumphash till automatiskt.
Det är korrekt, och det står i CLI-referensen: *"If that is the entire fragment name, a
random hash will be added for you"*, med exemplet `+fcc4dc7b.feature.rst`
([cli.html](https://towncrier.readthedocs.io/en/stable/cli.html)).

**Notera var det INTE står:** tutorialen, som ADR-081 citerar, nämner inte hashen alls.
Den listar `+random.bugfix.rst` som exempel, där "random" är ett bokstavligt ord — inte
en indikation på generering. ADR-081 läste rätt källa men den källan bär inte skyddet.

Mekanismen ligger i koden. `src/towncrier/create.py` vid tagg `24.8.0`, rad 171–179:

```python
if config.orphan_prefix and file_basename.startswith(f"{config.orphan_prefix}."):
    # Append a random hex string to the orphan news fragment base name.
    filename = os.path.join(
        file_dir,
        (
            f"{config.orphan_prefix}{os.urandom(4).hex()}"
            f"{file_basename[len(config.orphan_prefix):]}"
        ),
    )
```

Och rad 201–210 bär ett **andra**, oberoende skydd som gäller *alla* fragment, även
issue-numrerade:

```python
retry = 0
...
while os.path.exists(segment_file):
    retry += 1
    segment_file = os.path.join(
        fragments_directory, f"{filename}.{retry}{extra_ext}"
    )
```

**Mätt, inte citerat.** Jag körde towncrier `24.8.0` (via `uvx`, 2026-07-29) och skapade
20 fragment med basnamnet `+`: **20 filer, 20 unika namn, noll kollisioner.**
`os.urandom(4)` ger 32 bitars entropi — en namnrymd på 4,29 miljarder.

**Två egenskaper som ändrar hur fyndet ska läsas:**

1. **Skyddet bor i verktyget, inte i formatet.** Hashen genereras av `towncrier create`.
   Skriver du filen för hand med `+minslug.feature.rst` får du ingen hash och inget
   skydd. Det är alltså inte fragment-*formen* som skyddar — det är att **en allokator
   äger filnamnet**. Exakt samma sak som gör våra kort-ID:n kollisionsfria.
2. **`while os.path.exists()` är check-then-act.** Två samtidiga processer kan båda se
   ett ledigt namn och båda skriva. Racet är teoretiskt reellt men praktiskt dött, för
   32-bitarshashen gör att loopen nästan aldrig aktiveras. Skyddet är entropin;
   retry-loopen är dedupliceringen.

### Fynd 1b — towncrier tilldelar ALDRIG ett nummer vid konsolidering

Detta hittade jag när jag prövade fyndet, och det är passets viktigaste korrigering av
ADR-081. Jag byggde ett minimalt towncrier-projekt, lade in ett orphan-fragment och ett
issue-numrerat, och körde `towncrier build --draft` (towncrier `24.8.0`, 2026-07-29):

```text
Features
--------

- post MED issue-ID 1234 (#1234)
- orphan-post utan issue-ID
```

Orphan-fragmentet renderas **nummerlöst**. Hashen `+71d9e221` kastas bort vid
konsolideringen — den var ett filnamn, aldrig en identitet.

**Konsekvensen för ADR-081:s precedent-anspråk.** ADR-081 kallar towncriers `+`-form
*"vår form exakt"*. Det stämmer för **halva** formen. towncrier är solid precedent för
*skriv utan nummer i den parallella fasen*. Den är **inte** precedent för *sätt numret
vid konsolideringen* — towncrier sätter inget nummer, någonsin. Vår form är
towncrier-mönstret plus ett tilldelningssteg som towncrier inte har, och det steget
saknar stöd i den citerade källan.

Det river inte ADR-081. Beslutet står på merge-grindens serialisering, inte på
towncrier. Men **den ena av tre "solida precedenter" är svagare än ADR-081 skriver**,
och det bör den ADR:n veta om räckvidden prövas igen.

### Fynd 2 — `branchnews`: HÅLLER som beskrivning, FALLER som precedent

Verktyget finns och gör vad påståendet sa. Formen är
`USERNAME.BRANCHNAME.branchnews.NEWS_TYPE.txt`, exempelvis
`example.fix-that-pesky-bug.branchnews.fixed.txt`. Flödet är två-stegs: `branchnews
create` vid skrivning, `branchnews rename` före changelog-generering — det senare
översätter grennamnen till PR-nummer genom att läsa `git log` efter GitHub:s
merge-commit-meddelanden. ([skieffer/branchnews](https://github.com/skieffer/branchnews))

Det är en genuint fjärde form: **allokatorn är grennamnet**, alltså något varje aktör
redan äger exklusivt. Elegant på pappret, och relevant för oss — varje bygg-agent kör i
egen worktree med egen gren.

**Men precedent-värdet är noll, och det ska skrivas ut rakt:**

- **0 stjärnor** på GitHub vid mätning 2026-07-29.
- Ett enmansprojekt. Jag hittade ingen dokumenterad användare utanför repot självt.
- Formen bär två antaganden som är starkare än de ser ut: den kräver *"standard GitHub
  merge commit messages"* av formen `Merge pull request #NUMBER from USERNAME/BRANCHNAME`,
  och **inget användarnamn får återanvända ett grennamn inom en release-cykel**.

Det första antagandet är direkt oförenligt med vårt flöde: vi landar via merge queue
och armerar med `gh pr merge --auto --merge`, och `branchnews rename` läser just den
commit-meddelandeform som kön och squash-varianter inte garanterar. Det andra
antagandet är vår faktiska risk igen, bara flyttad till grennamn.

**Domen:** formen är värd att känna till som *idé* — grennamnet som naturlig
namnrymd — men `branchnews` som verktyg är inte branschpraxis och kan inte citeras som
precedent. Det vore precis den fejkade räkningen käll-hierarkin förbjuder.

## Delfråga 2 — Är "en aktör mintar" etablerat mönster eller anti-pattern?

**Etablerat mönster — men Python har aktivt övergett det, och skälet är precis den
flaskhals uppdraget bad mig söka.**

### Att det är etablerat

Två av världens mest långlivade tekniska governance-processer bygger på formen. PEP
har en editor-roll som *"reserve the right to reject PEP proposals"* och vars plikt är
att tilldela eller validera numret. EIP:s editorer tilldelar numret vid merge.

En egenskap är värd att lyfta, för den adresserar bus factor **i designen**: auktoriteten
är en **roll med flera innehavare**, inte en person. PEP 1: *"PEP editorship is by
invitation of the current editors, and they can be contacted by mentioning
`@python/pep-editors` on GitHub."* ([PEP 1](https://peps.python.org/pep-0001/))

Det är ett mönster, inte ett anti-pattern. Men det som gör det bärbart är att rollen är
**skild från skribenten** och har **flera innehavare**.

### Att Python övergav det — belagt av en editor själv

I tråden *"Confusion about assignment of PEP numbers"* på Pythons eget forum skriver
Hugo van Kemenade, PEP-editor:

> *"Some background: it used to be that PEPs were opened as 9999, then a PEP editor
> would come along later and assign the number. But we can skip that and let the author
> take the next available right away."*

([discuss.python.org/t/38481](https://discuss.python.org/t/confusion-about-assignment-of-pep-numbers/38481))

Det är flaskhals-kritiken som vinner, i förstapartskälla, uttalad av auktoriteten själv.
Steget "en aktör mintar" togs bort därför att det bara var **latens** — editorn tillförde
inget utöver ett nummer författaren kunde hämta själv.

**Vad som ersatte det är intressantare än att det togs bort.** Inte en mekanism, utan
ett *uppslagsverktyg* som gör gissningen till en läsning. Samma editor, samma tråd:
*"my little PEP CLI can help find the next available number"* — verktyget är `pepotron`,
och dess `pep next` gör exakt ett: *"Check published PEPs and open PRs to find the next
available PEP number."* ([hugovk/pepotron](https://github.com/hugovk/pepotron))

**Verktyget reserverar ingenting.** Det läser publicerade PEP:ar *och öppna PR:er* och
föreslår nästa lediga. Precis den operation vår nuvarande form gör för hand.

### Den skarpaste formuleringen i hela passet

Python löser inte kollisionen. De **krymper fönstret** och accepterar resten öppet. Hugo,
samma tråd, om arbetsgången:

> *"Use 9999 when drafting. When they're happy it's ready for submission, check the next
> available number, rename, and open the PR. It's unlikely for that number to be taken by
> someone else during those couple of minutes."*

Och tidigare i tråden, som varning:

> *"So to avoid confusion, I suggest avoiding using 735 [...] until that time, as another
> PEP may claim the number first."*

Det är en explicit, medveten **risk-acceptans från en aktiv auktoritet i ett 25-årigt
flöde**: tilldela numret så sent som möjligt, håll fönstret till minuter, och lev med
resten. Formen är alltså inte (i), (ii) eller (iii) i renodling — den är *(iii) utan
mekanism*: sen tilldelning som **disciplin**, med en risk som bedöms försumbar därför
att fönstret är kort.

EIP behåller auktoriteten och ger den i stället makt att **rätta i efterhand**: *"editors
can reassign if number sniping is suspected"* ([EIP-1](https://eips.ethereum.org/EIPS/eip-1)).
Två olika svar på samma restrisk — krympa fönstret, eller behåll rätten att rätta.

### Kritiken mot den centrala auktoriteten — och vad jag inte kunde belägga

Jag sökte aktivt efter dokumenterad flaskhals-kritik mot EIP-editorerna och **nådde inte
en användbar förstapartskälla**. Läget rakt:

- `ethereum/EIPs` issue #2173, *"EIP Editor Criteria (process for new editors)"*, öppnades
  med konstaterandet att *"There have been discussions about adding more people as
  editors, but there is no PR with a process proposal in this repository, at this time."*
  Jag hämtade kommentarerna via GitHub:s API: **de innehåller enbart två inlägg från
  `github-actions[bot]`** om inaktivitet, och issuen stängdes av bristande aktivitet. Den
  bär alltså ingen substantiell diskussion.
- ERC-utbrytningen ur EIPs-repot är **belagd som faktum** i Ethereums eget repo — *"Please
  note that ERCs were recently separated from the EIPs repo"*
  ([ethereum/ERCs](https://github.com/ethereum/ERCs)) — men repot anger **inget skäl**.
- Att skälet var editor-brist och PR-volym förekommer i tredjepartsrapportering
  ([etherworld.co](https://etherworld.co/eip-repository-faces-impending-division-a-split-on-the-horizon/)),
  attribuerat till Pooja Ranjan. **Jag kunde inte belägga det i förstapartskälla och
  bokför det därför som obelagt.**

### Domen, och varför den inte översätts rakt till oss

"En aktör mintar" är **etablerat, inte anti-pattern** — men i en form vår kandidat (i)
inte har. Hos PEP och EIP är mintaren en **separat roll utanför skrivflödet, med flera
innehavare**. Vår (i) är "en av 2–3 parallella orkestrerar-sessioner mintar, övriga
rapporterar behov" — alltså en mintare som **samtidigt är skribent**, utvald ad hoc per
tillfälle, utan roll-kontinuitet.

Det är inte PEP-mönstret. Det är närmare det steg Python **tog bort**, plus ett
samordningskrav mellan jämlikar som PEP aldrig hade. Precedenten stödjer alltså formen
*auktoritet skild från skribent*; den stödjer inte formen *en av de parallella
skribenterna är auktoritet den här gången*.

## Mätning mot vårt eget substrat — ADR-081:s kort-undantag är FALSKT

Detta stod inte i uppdraget. Det kom ur att jag vägrade citera ett påstående jag kunde
pröva. **ADR-081 § 4 skriver: *"Kort: redan löst. `backlog`-CLI:t äger allokeringen."***
Jag mätte det. Det håller inte under vår konfiguration.

**Rigg:** `backlog` CLI `1.47.1`, körd 2026-07-29 i engångsprojekt i scratchpad. Vår
`backlog/config.yml` speglades exakt: `check_active_branches: false`,
`remote_operations: false`. Projektets egen `backlog/` rördes aldrig och inga kort
mintades.

### Mätning 1 — två arbetsträd, vår konfiguration

Gemensam historik `task-1..3`. Två kopior som inte ser varandra. Vardera skapar ett kort:

```text
A: task-4 - A-agent-ett-landar-sitt-fynd.md
B: task-4 - B-agent-tva-landar-sitt-fynd.md
```

**Båda fick `task-4`.** Två skilda kort, samma ID. CLI:t skannar det lokala
filsystemet efter högsta ID och har under denna konfiguration ingen kunskap om något
annat arbetsträd. Kollisionen är alltså inte hypotetisk för kort — den är
**reproducerbar på kommando**.

Det förklarar också det empiriska läget i uppdraget: *tre parallella worktrees stod
samtidigt på högsta kortnummer 82.* Det var inte ett kuriosum. Det var tre aktörer som
alla var en `task create` från samma nummer.

### Mätning 2 — samma CLI, med `check_active_branches: true`

Samma rigg, en flagga vänd. `main` har `task-1..3`; grenen `grenA` skapar `task-4` och
**committar**; därefter skapas ett kort från `main`:

```text
main ser i filsystemet: task-1  task-2  task-3
skapat:                 task-5 - main-kort-efter-grenA.md
```

**CLI:t hoppade över `task-4`** — det läste grenen och undvek kollisionen. Mekanismen
finns redan i verktyget, är leverantörsstödd, och är **avstängd i vårt repo**.

### Mätning 3 — gränsen för den mekanismen

Två **äkta** git-worktrees, `check_active_branches: true`. A skapar ett kort men
committar **inte**. B skapar ett kort:

```text
A: task-4 - A-ocommittat.md
B: task-4 - B-efter-A-ocommittat.md        ← kollision
```

Därefter committar A, och B skapar ytterligare ett:

```text
B: task-5 - B-efter-A-committat.md          ← ingen kollision
```

**Skyddet gäller committat arbete, inte ocommitterat.** Det är exakt Pythons "couple of
minutes" igen, i vårt eget verktyg: fönstret mellan `task create` och `git commit`.

### Vad de tre mätningarna betyder

1. **ADR-081:s ena uttalade undantag är empiriskt falskt** i vår konfiguration. Kort är
   inte lösta; de är osäkrade på samma sätt som lessons var, med skillnaden att
   kollisionen ännu inte råkat inträffa. Noll kollisioner på 168 kort mätte turen och
   den seriella arbetsformen — inte en mekanism.
2. **Den billigaste kandidaten i hela passet stod inte på uppdragets lista:** vänd
   `check_active_branches` till `true`. Ingen kod, ingen ny form, en config-rad i ett
   verktyg som redan äger substratet. Det är husets config-driven-konvention rakt av.
3. **Den fixen är inte total, och ska inte säljas som total.** Den krymper fönstret till
   tiden mellan skapande och commit. Det är en storleksordning bättre än idag, och det är
   allt.

**Reservation, uttalad:** jag mätte i engångsprojekt som speglar vår konfiguration, inte
i repots egen `backlog/`. Att sätta flaggan i vårt repo kan ha följder jag inte mätt —
`check_active_branches` styr enligt `--help` *"check task states across active branches"*,
alltså mer än ID-allokering, och `active_branch_days: 30` gör en gren äldre än 30 dagar
osynlig. **Vad flaggan gör med kort-*statusar* i vårt 168-kortsträd är obelagt av mig.**
Den prövningen hör till ett beslut, inte till detta pass.

## Delfråga 3 — Vad säger distribuerade system, och var slutar de hjälpa?

**Inget av mönstren är tillämpligt, och orsaken är räknings-mässig, inte teknisk.**
Insamlingen delegerades till en underagent med bindande krav på primärkälla och
`EJ BELAGD`-märkning; specifikationerna nedan lästes i original.

| Mönster | Längd | Monotonicitet — vad garanteras exakt | Kräver | Tillämpligt |
|---|---|---|---|---|
| UUIDv4 | 36 tecken | ingen | — | nej |
| UUIDv7 | 36 tecken | endast **single-node** | node-ID eller register för cross-node | nej |
| ULID | 26 tecken | endast inom **en generator-instans** | delad process-state | nej |
| Snowflake | upp till 19 siffror | k-sorterad, ej totalordnad | ZooKeeper + NTP + nätverkstjänst | nej |
| Hi/Lo | litet | per allokerande klient | databas-sekvens (central allokator) | nej |
| Sekvensblock | litet | **uttryckligen inte sekventiell** | databas-sekvens | nej |

Jämförelsetalet som avgör saken: `ADR-081` är **7 tecken**, `L359` är **4**. Det
kortaste av de okoordinerade mönstren är 26.

### Var gränsen går, i specifikationernas egna ord

RFC 9562 § 6.2 lägger UUIDv7:s garanti innanför en enda nod: *"For single-node UUID
implementations that do not need to create batches of UUIDs, the embedded timestamp
within UUIDv6 and UUIDv7 can provide sufficient monotonicity guarantees [...] Distributed
nodes are discussed in Section 6.4."* Och § 6.4 erbjuder bara två utvägar, båda dyra: ett
inbäddat node-ID, där *"the creation and negotiation of unique node ids among nodes is
also out of scope"*, eller ett centralt register som *"could become a bottleneck [...] are
NOT RECOMMENDED"*. ([RFC 9562](https://www.rfc-editor.org/rfc/rfc9562.html))

ULID:s sorterbarhet är en egenskap hos en **stateful generator**, inte hos kodningen:
*"if the same millisecond is detected, the `random` component is incremented by 1 bit"* —
och detektionen sker i `monotonicFactory()`. Två parallella sessioner detekterar
ingenting av varandra. ([ulid/spec](https://github.com/ulid/spec))

PostgreSQL formulerar blockreservationens pris exakt, och det är våra två bärande
egenskaper som betalar: *"with a cache setting greater than one you should only assume
that the nextval values are all distinct, not that they are generated purely
sequentially"*, och *"any numbers allocated but not used within a session will be lost
when that session ends, resulting in "holes" in the sequence."*
([CREATE SEQUENCE, Notes](https://www.postgresql.org/docs/17/sql-createsequence.html))

Samma avsnitt namnger också vad tätheten kostar: *"It is possible to build gapless
assignment by using exclusive locking of a table containing a counter; but this solution
is much more expensive than sequence objects."* Tätt medför exklusivt lås medför
koordination.

Hibernate avråder från sitt eget hi/lo: *"These optimizers are not recommended for use.
They are maintained (and mentioned) here simply for use by legacy applications."*
([Hibernate 6.6 User Guide](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html))

**En korrigering av en vanlig bild:** Snowflakes README nämner aldrig ZooKeeper — bara
"configured machine id". Kravet ligger i källkoden på taggen `snowflake-2010`, där
`registerWorkerId` skapar en ephemeral znode per worker-ID och kastar vid
`NodeExistsException`. README:ns rubrik *"Uncoordinated"* gäller **hot-pathen för
ID-generering**, inte worker-ID-tilldelningen — den är hårt koordinerad.
([SnowflakeServer.scala](https://github.com/twitter-archive/snowflake/blob/snowflake-2010/src/main/scala/com/twitter/service/snowflake/SnowflakeServer.scala))

### Den principiella orsaken

Lamport 1978 ger varför en totalordning över oberoende genererade händelser kräver ett
per-process-fält: *"To break ties, we use any arbitrary total ordering < of the
processes"*, och *"It is only the partial ordering which is uniquely determined by the
system of events."*
([time-clocks.pdf](https://lamport.azurewebsites.net/pubs/time-clocks.pdf))

Tiebreaker-fältet är precis det som gör ID:t större eller icke-tätt — `L359-a` / `L359-b`.

Det starkaste motexemplet prövades och föll: **Interval Tree Clocks** avskaffar
faktiskt ID-registret — *"It does not require global ids but is able to create, retire and
reuse them autonomously, with no need for global coordination; any entity can fork a new
one"* — men ID:t är ett intervallträd, inte ett litet tal, och `fork` är definierad som en
**delning av ett befintligt ID**. Barnet får sitt rum från en förälder.
([Almeida, Baquero, Fonte, OPODIS 2008](https://gsd.di.uminho.pt/members/cbm/ps/itc2008.pdf))

**Slutledningen, märkt som slutledning och inte som citat** (ingen enskild källa
formulerar den samlat): "litet" betyder få bitar betyder litet adressrum, och unikhet i
ett litet rum kan inte vila på entropi. Då återstår två vilopunkter — **partition** (ett
nod-fält, som bryter tätheten) eller **serialisering** (ett lås, som är koordination).
Tätt plus monotont plus delat medför en skrivare i taget. De sex mönstren är
optimeringar av *var* den enda skrivaren sitter, inte bevis på att den kan tas bort.

**Konsekvensen för oss är befriande:** frågan är inte vilket distribuerat mönster vi ska
välja. Inget av dem gäller. Frågan är bara **var vår enda skrivare ska sitta** — och vi
har redan en serialiserare i huset. Merge queue mot en enda `main` *är* ömsesidig
uteslutning.

**Vad ITC däremot visar:** form (ii) block-reservation är inte ad hoc. Den är
ITC:s `fork` i enkel form, och PostgreSQL:s "holes" är dess kända pris. Formen har
teoretisk grund — den saknar bara, som delfråga 1 visade, precedent i
dokumentationsflöden.

## Delfråga 4 — Ändras svaret med autonoma agenter?

**Ja — men inte genom att någon löste allokeringsproblemet. Mönstret ändras genom att
branschen slutade försöka koordinera och började isolera i stället.** Insamlingen
delegerades till en underagent med bindande primärkälle-krav.

### ID- och namnallokering i en delad serie är en OADRESSERAD yta

**Noll av fem** leverantörers primärdokumentation beskriver någon mekanism för att dela
ut löpnummer eller namn i en delad serie i användarens repo. Det är passets tydligaste
tomma precedent-rymd, och den ska läsas som ett fynd.

| Yta | Status i leverantörernas primärdokumentation |
|---|---|
| **ID-/namnallokering i delad serie** | **oadresserad** — 0 av 5 |
| Filkollisioner | delvis löst — 5 av 5 via worktree- eller VM-isolering |
| Uppgiftsallokering | delvis löst — 4 av 5 dokumenterar en orkestrerare som äger fördelningen |
| Grennamn | delvis — namespace-prefix, gits en-gren-per-worktree-invariant |

### Anthropic kommer närmast — och undviker löpnummer systematiskt

Claude Codes worktree-dokumentation har en egen sektion om vad worktrees **delar** med
huvudcheckouten (`.git`, project-scope-plugins, permission-approvals) — delat tillstånd
är alltså en designad yta, inte en olycka. Namnallokering sker med **slumpnamn, aldrig
en räknare**: utan `--worktree`-namn *"Claude generates one such as `bright-running-fox`"*.
Namnkollision hanteras idempotent: *"Passing `--worktree` a name whose directory already
exists opens that existing worktree instead of creating a new one."* Och ett riktigt lås
finns: *"While an agent is running, Claude runs `git worktree lock` on its worktree so
that concurrent cleanup cannot remove it."*
([worktrees](https://code.claude.com/docs/en/worktrees))

Agent teams bär den **enda kodade ömsesidiga uteslutningen** jag hittade hos någon
leverantör: *"Task claiming uses file locking to prevent race conditions when multiple
teammates try to claim the same task simultaneously."* Teamnamn härleds ur unik identitet
i stället för ur en räknare — *"The name is `session-` followed by the first eight
characters of the session ID."* Men låset ligger i verktygets egen store
(`~/.claude/tasks/`), aldrig i repot, och delade filer förklaras uttryckligen olösta:
*"Avoid file conflicts. Two teammates editing the same file leads to overwrites. Break
the work so each teammate owns a different set of files."*
([agent teams](https://code.claude.com/docs/en/agent-teams))

Mönstret är genomgående: slumpnamn, identitets-härledda namn, partitionerat ägandeskap.
**Ingenstans en delad räknare.** Samma strategi Rails valde 2008.

### Det tyngsta fyndet i passet är negativt — låsning kollapsade i praktiken

Cursor rapporterar i förstapartskälla att det *mänskliga* mönstret — låsa en delad
resurs — empiriskt misslyckades med autonoma agenter:

> *"Agents would hold locks for too long, or forget to release them entirely. Even when
> locking worked correctly, it became a bottleneck."* … *"Twenty agents would slow down to
> the effective throughput of two or three, with most time spent waiting."*

Lösningen blev rollhierarki, inte bättre lås: planners skapar uppgifter, workers plockar
dem, och workers koordinerar inte med varandra. Och en dedikerad konfliktlösar-roll
prövades och **togs bort**: *"We initially built an integrator role for quality control
and conflict resolution, but found it created more bottlenecks than it solved."*
([cursor.com/blog/scaling-agents](https://cursor.com/blog/scaling-agents))

Det är den enda källan där en branschledare medger att de byggde koordinations-lagret och
backade. **Det är direkt relevant för form (i):** en aktör som mintar är ett
koordinationskrav mellan jämlikar, och det är precis den klass Cursor mätte som
flaskhals.

### Övriga leverantörer

**GitHub Copilot** har namespace-prefix som skyddsräcke, inte kollisionsundvikande: *"It
can only push to a single branch: the existing pull request branch when triggered via
`@copilot`, or otherwise to a new `copilot/` branch."* `/fleet` beskriver en orkestrerare
som *"orchestrator, managing the workflow and dependencies between the subtasks"* — en
roll, ingen mekanism. Hur två samtidiga `copilot/`-grenar undviker namnkollision
adresseras inte. ([coding agent](https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent))

**OpenAI Codex** är den enda som resonerar om en concurrency-invariant från första
principer — men den är gits, inte deras: *"Git prevents the same branch from being checked
out in more than one worktree at a time because a branch represents a single mutable
reference"*, annars uppstår *"ambiguity and race conditions"*. Om parallella skrivningar
viker de undan i stället för att lösa: *"Be more careful with parallel write-heavy
workflows."* ([git-worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees))

**Devin** kör *"each running in its own isolated VM"* med en coordinator som *"resolves
conflicts, and compiles results"*; kollisionsstrategin är förhandsanalys — gruppera i
*"independent work packages that won't conflict"*. Grennamngivning, lås och ID-allokering
är odokumenterade.
([advanced capabilities](https://docs.devin.ai/work-with-devin/advanced-capabilities))

### Litteraturen: problemet är mätt, inte löst

Fyra arbeten, räknade och inte avrundade:

- **19,8 % textuell konfliktrat** (95 % CI [16,8; 23,2]) mellan **två PR från samma
  agent**: *"Agents operate independently and in isolation, without knowledge that other
  agents of the same type are simultaneously accessing and altering the same files."*
  ([arXiv:2607.04697](https://arxiv.org/html/2607.04697v2)) — kollisionen kräver inte ens
  olika aktörer.
- **AgenticFlict**: 142 000+ agentiska PR, konfliktrat 27,67 % totalt; per agent Copilot
  15,24 %, Cursor 19,75 %, Devin 22,85 %, Claude Code 25,93 %, Codex 31,85 %.
  ([arXiv:2604.03551](https://arxiv.org/html/2604.03551v1))
- **CoAgent** är närmast en designad svar på just vår fråga: *"As soon as two of them
  mutate shared state, they enter the regime classical concurrency control has studied for
  decades, but classical mechanisms fit LLM agents poorly."* Deras svar fastställer en
  serialiseringsordning **vid launch** och ersätter lås med notifiera-och-reparera.
  ([arXiv:2606.15376](https://arxiv.org/abs/2606.15376))
- **CodeCRDT** löser konflikterna helt — *"lock-free, conflict-free concurrent code
  generation with strong eventual consistency"*, 100 % konvergens — men kostar upp till
  **39,4 % slowdown** på vissa uppgifter. Koordinationsfrihet är inte gratis.
  ([arXiv:2510.18893](https://arxiv.org/abs/2510.18893))

### Den mänskliga precedenten som ändå bär bäst: migrations-numrering

Två solida precedenter, och de är de mest närbesläktade i hela passet — en delad
löpnummer-serie med parallella skribenter i ett versionshanterat träd:

**Django demoterar numret till en mänsklig etikett** och flyttar den maskin-auktoritativa
ordningen till en beroendegraf på *namn*:

> *"you and another developer have both committed a migration to the same app at the same
> time, resulting in two migrations with the same number. Don't worry - the numbers are
> just there for developers' reference, Django just cares that each migration has a
> different name."*

([Django migrations](https://docs.djangoproject.com/en/stable/topics/migrations/))

**Rails avskaffar räknaren**, och anger flerskrivar-fallet som skälet i klartext:

> *"Controls whether migrations are numbered with serial integers or with timestamps. The
> default is `true`, to use timestamps, which are preferred if there are multiple
> developers working on the same application."*

([Rails configuring](https://guides.rubyonrails.org/configuring.html))

Båda löser samma problem på samma sätt: **ta bort den delade räknaren.** Django genom att
göra numret icke-auktoritativt, Rails genom att göra värdet lokalt genererbart.

**Django-formen är den enda i hela passet som är förenlig med vårt referensnät.** Den
behåller ett litet läsbart nummer *och* tillåter kollision — därför att numret inte bär
identiteten. ADR-081 förkastade datum-baserade ID:n med argumentet att ett ID-byte river
korsreferenserna. Django-formen kräver inget ID-byte. Den säger bara att en dubblett inte
är en katastrof.

### Domen på delfrågan

Svaret ändras, åt motsatt håll mot väntat. Det mänskliga mönstret är *koordinera i förväg
eller merga i efterhand*. Agent-mönstret som faktiskt levereras är **isolera fysiskt och
tilldela ägandeskap i förväg** — och den auktoritativa allokeringen flyttas till en
orkestrerare, precis som vår `bygg-agent.md` redan gör.

**Ingen leverantör låter agenter förhandla om ett nummer i en serie.** Cursors post visar
varför: när de försökte kollapsade genomströmningen.

Att vår arkitektur redan låter orkestreraren minta är alltså **branschmönstret, korrekt
identifierat**. Problemet ligger inte där. Det ligger i att vi har 2–3 *parallella*
orkestrerare — alltså flera "planners" som var och en tror sig äga allokeringen. Det är
ett läge ingen av de fem leverantörerna dokumenterar.

## Delfråga 5 — Finns argument för att INTE bygga något?

**Ja, ett starkt — men det är villkorat på en egenskap vi själva väljer, och de två
citat man normalt griper efter gäller inte frågan.** Insamlingen delegerades med krav på
ordagranna citat ur original.

### YAGNI och Knuth styr inte denna fråga

**Attributionsrättelse först:** YAGNI kommer inte från Ron Jeffries. Fowlers egen fotnot:
*"The origin of the phrase is an early conversation between Kent Beck and Chet Hendrickson
on the C3 project."* Jeffries skrev den kanoniska essän, inte frasen.
([Fowler, Yagni](https://martinfowler.com/bliki/Yagni.html))

Och Fowler avgränsar YAGNI själv, tvåfaldigt:

> *"Yagni only applies to capabilities built into the software to support a presumptive
> feature, it does not apply to effort to make the software easier to modify."*

Och, i samma text, komplexitets-undantaget:

> *"I also argue that yagni only applies when you introduce extra complexity now that you
> won't take advantage of until later. If you do something for a future need that doesn't
> actually increase the complexity of the software, then there's no reason to invoke
> yagni."*

En nummerkollisionsvakt är ingen presumptive feature — den stödjer ingen framtida
användarfunktion. Att citera YAGNI mot en billig integritetskontroll är en felapplicering
av Fowlers egen text.

**Knuth är ännu tydligare fel verktyg.** Originalet lästes (ACM Computing Surveys 6(4),
1974, s. 268). Den citerade meningen står i ett stycke om *hastighet*: *"We should forget
about small efficiencies, say about 97% of the time: premature optimization is the root of
all evil."* Nästa stycke, som nästan alltid klipps bort, vänder riktningen:

> *"Yet we should not pass up our opportunities in that critical 3%. A good programmer
> will not be lulled into complacency by such reasoning, he will be wise to look carefully
> at the critical code; but only after that code has been identified."*

Och samma sida argumenterar uttryckligen **mot** svepande avskrivning: *"In established
engineering disciplines a 12% improvement, easily obtained, is never considered marginal."*
([Knuth 1974, PDF](https://pic.plover.com/knuth-GOTO.pdf))

Knuths poäng är *mät först*. Som stöd för att inte bygga en korrekthetskontroll är citatet
oanvändbart — ämnet är fel och riktningen är motsatt.

### SRE ger det starkaste anti-argumentet — och den avgörande asymmetrin

Toil-definitionen utesluter vår risk från automatiseringens motivering, per bokens egen
underpunkt:

> *"**Repetitive** — If you're performing a task for the first time ever, or even the
> second time, this work is not toil. Toil is work you do over and over."*

([Eliminating Toil](https://sre.google/sre-book/eliminating-toil/))

En nollfrekvent händelse är per definition inte toil. Och boken går längre — den namnger
precis vårt felläge:

> *"Secondly, automation that is crucial but only executed at infrequent intervals and
> therefore difficult to test is often particularly fragile because of the extended
> feedback cycle."*

Hierarkin slutar dessutom inte i "automatisera": *"better than either option is a
higher-level system design requiring neither of them—an autonomous system"*, och det
femte och högsta steget är **"Systems that don't need any automation"**.
([Automation at Google](https://sre.google/sre-book/automation-at-google/))

**Här ligger passets skarpaste distinktion, och den är vår att välja.** Bräcklighets-
invändningen gäller en **reparatör** — något som fyrar *när* en kollision uppstått, körs
nästan aldrig, testas därför aldrig skarpt. Den gäller **inte** en **validator** som körs
vid varje skrivning: den är kontinuerligt exercerad, och hela invändningen faller. Det är
en designparameter, inte ett faktum om risken.

Vår `check-lesson-numbers.sh` är redan en validator, med sex self-test-fall i CI. Den är
alltså på rätt sida av SRE:s egen varning.

Riskkalkylen finns också auktoritativt formulerad — förväntat värde av den undvikna skadan
sätter budgeten för kontrollen: *"if the cost of improving availability by one nine is less
than $900, it is worth the investment."*
([Embracing Risk](https://sre.google/sre-book/embracing-risk/))
**Men den förutsätter en mätt frekvens.** Vår är noll på tre serier, vilket avgränsar
raten utan att skilja "säker" från "hittills tursam".

### Motvikten: självcensur är den svagaste klassen av åtgärd

James Reason klassar uttryckligen "skriv en till procedur" bland person-approachens svaga
motåtgärder:

> *"These methods include poster campaigns that appeal to people's sense of fear,
> **writing another procedure (or adding to existing ones)**, disciplinary measures, threat
> of litigation, retraining, naming, blaming, and shaming."*

Och han träffar antagandet att en kompetent aktör noterar sin egen osäkerhet:

> *"it is often the best people who make the worst mistakes—error is not the monopoly of
> an unfortunate few."*

Systemalternativet, hans kursiverade kärnmening: *"though we cannot change the human
condition, we can change the conditions under which humans work."* Och det direkta stödet
för att agera före händelsen: *"Unlike active failures, whose specific forms are often hard
to foresee, latent conditions can be identified and remedied before an adverse event
occurs."* ([Reason, BMJ 2000](https://pmc.ncbi.nlm.nih.gov/articles/PMC1117770/))

**Det underminerar motargumentet direkt.** "Självcensur — aktören avstår i osäkerhet och
rapporterar behovet" *är* en person-approach-motåtgärd. Den kräver att aktören *upptäcker*
tvetydigheten, och skyddar inte mot fallet där hon inte ser den. Det är samma sak
[ADR-079](../decisions/ADR-079-instruktionsleverans-barare-per-lager.md) mätte hos oss:
skriven regel ~0 % efterlevnad mot 75 % när möjligheten att göra fel togs bort.

Richard Cook ger den n-disciplin uppdraget bad om, och skär ärligt åt båda håll:

> *"there are many more failure opportunities than overt system accidents. Most initial
> failure trajectories are blocked by designed system safety components."*

Och åt andra hållet, i samma text:

> *"Eradication of all latent failures is limited primarily by economic cost."*

([How Complex Systems Fail](https://how.complexsystems.fail/))

Noll observerade kollisioner på 82 ADR:er är förenligt med en låg men icke-noll rat.
Samtidigt legitimerar Cook själv att kostnad får begränsa åtgärden.

### Domen på delfrågan

**Det finns inget auktoritativt stöd för principen "det har aldrig hänt, alltså lämna
det".** Den formuleringen finns inte i någon källa. Det finns lika lite stöd för
"mekanisera varje strukturell möjlighet". Vad litteraturen licensierar är en **rangordning**:

1. gör kollisionen omöjlig genom konstruktion (SRE:s högsta steg; Fowlers
   komplexitets-undantag; Reasons latenta tillstånd),
2. gör den högljutt detekterbar vid **varje** skrivning — en validator, kontinuerligt
   exercerad,
3. skriven självcensur-regel (Reasons svaga klass),
4. sällan-fyrande automatisk reparatör — **sämst**, per SRE:s bräcklighets-varning.

Och en detalj värd att notera: **lessons-serien är den enda med empiriskt belagd rat**
(1 av 342). Den har alltså det starkaste egna warrantet för sin mekanism — inte det
svagaste. ADR-081 byggde på rätt serie först.

## Vad detta betyder för (i), (ii), (iii) — och en eventuell fjärde form

### Formerna, vägda mot vad passet faktiskt fann

**(i) En aktör mintar — etablerad i en form vi inte har.**
PEP och EIP bär formen, men med två egenskaper vår kandidat saknar: mintaren är en **roll
skild från skribenten**, och rollen har **flera innehavare**. Vår (i) är "en av 2–3
parallella orkestrerare mintar den här gången" — jämlikar som måste komma överens. Det är
närmare det steg Python **tog bort** som onödig latens, och exakt den klass Cursor mätte
som flaskhals när aktörerna blev autonoma. **Svagast stöd av de tre.**

**(ii) Block-reservation — teoretiskt grundad, precedent-mässigt tom.**
Noll av sju dokumentationsflöden använder den. Den har däremot formell grund: den är
Interval Tree Clocks' `fork` i enkel form. Men priset är namngivet i PostgreSQL:s egen
dokumentation — *"holes in the sequence"* och *"you should only assume that the nextval
values are all distinct, not that they are generated purely sequentially"*. Luckor och
förlorad allokeringsordning är precis de två egenskaper som gör `L359` citerbart i prosa.
**Formen köper mekanisk säkerhet med den valuta vi minst kan avvara.**

**(iii) Tilldelning vid landning — starkast stöd, men på annan grund än ADR-081 angav.**
EIP gör det explicit. Pythons *faktiska praxis* gör det också — `9999` under skrivandet,
riktigt nummer vid PR-öppning. Rust och Kubernetes gör en variant: numret **är** forge-
räknarens. Men **towncrier är inte precedent för tilldelningssteget** — mätningen visar att
towncrier aldrig tilldelar något nummer alls. ADR-081:s tre precedenter är i praktiken
två för själva tilldelningen, och det bör stå rätt.

**(iv) Grennamn som allokator — idé värd att känna, verktyg utan bärkraft.**
`branchnews` är ett enmansprojekt med 0 stjärnor, och dess `rename`-steg kräver GitHub:s
standard-merge-commit-meddelande — vilket vår merge queue inte garanterar. **Kan inte
citeras som precedent.**

### Den femte formen, som ingen av kandidaterna var

Django är den enda källan i passet som löser vårt problem **utan** att röra referensnätet:

> *"the numbers are just there for developers' reference, Django just cares that each
> migration has a different name."*

Numret behålls litet och läsbart; det slutar bara vara **identitet**. En dubblett blir då
en olägenhet som ska upptäckas och rätas ut, inte en korruption. Rails går ett steg
längre och avskaffar räknaren helt — men det är ADR-081:s förkastade datum-form, och samma
referensnät-argument gäller.

### Min rekommendation — och beslutet är Marcus

**1. Vänd `check_active_branches` till `true`. Detta är passets enskilt starkaste
rekommendation.** Det är den billigaste åtgärden i hela materialet: en config-rad i ett
verktyg som redan äger substratet, leverantörsstödd, ingen ny form, ingen ny kod. Mätning 2
visar att den fungerar. **Villkor:** flaggan styr enligt `--help` *"task states across
active branches"*, alltså mer än ID-allokering, och `active_branch_days: 30` gör äldre
grenar osynliga. **Vad den gör med kort-statusar i vårt 168-kortsträd är obelagt av mig**
och bör prövas i en engångsgren före landning.

**2. Rätta ADR-081 § 4 oavsett vad som beslutas om räckvidden.** Påståendet *"Kort: redan
löst"* är mätt falskt under vår konfiguration. Det står i en Accepted ADR och kommer att
läsas som fakta. ADR-081:s omprövningsvillkor gällde en *inträffad* kollision — men detta
är inte en inträffad kollision, det är en **falsifierad premiss**, och den klassen väntar
inte på ett villkor.

**3. Utvidga inte fragment-vägen till ADR och tråd nu. Utvidga validatorn i stället.**
Litteraturens rangordning är tydlig: gör kollisionen omöjlig genom konstruktion, annars gör
den högljutt detekterbar **vid varje skrivning**. Vi har redan `check-adr-count.sh` och
`check-lesson-numbers.sh`. En dubblett-kontroll för ADR- och trådnummer är samma klass
validator — kontinuerligt exercerad, alltså på rätt sida av SRE:s bräcklighets-varning —
och den är billig. Att bygga fragment-vägar för två serier som mintas av orkestreraren är
det ADR-081 med rätta kallade spekulativ komplexitet.

**4. Bygg inte (ii).** Tom precedent-rymd i domänen, och priset är luckor och förlorad
ordning i serier vars värde ligger i att vara täta och citerbara.

**5. Behåll (iii) för lessons, men lägg om dess motivering.** Formen är rätt; grunden ska
vara merge-grindens serialisering plus EIP och Pythons praxis — inte towncrier, som inte
gör det ADR-081 tillskriver den.

**Den obekväma delen av rekommendationen:** rekommendation 1 och 3 löser inte problemet
helt. Båda lämnar Pythons "couple of minutes" — fönstret mellan skapande och commit. Ingen
källa i passet stänger det fönstret utan att betala i storlek, luckor eller infrastruktur.
**Att det fönstret kvarstår bör bokföras öppet snarare än designas bort.**

## Vad som INTE gick att belägga

Denna sektion är passets näst viktigaste, eftersom den visar var nästa beslut vilar på
antaganden.

**Om vår egen konfiguration:**

- **Vad `check_active_branches: true` gör med kort-*statusar* i vårt 168-kortsträd är
  obelagt.** Jag mätte ID-allokering i engångsprojekt, inte statushantering i vårt repo.
  Flaggan gör mer än jag prövade, och `active_branch_days: 30` har en effekt jag inte mätte.
- **Om `remote_operations: true` / `--include-remote` skulle täcka pushade grenar i andra
  sessioner** — inte mätt.
- **Om det ocommitterade fönstret (Mätning 3) faktiskt är den väg en kollision skulle ske
  hos oss** — obelagt. Det kräver kunskap om hur nära i tid två `task create` faktiskt
  hamnar, och det har jag inte mätt.

**Om precedenten:**

- **Flaskhals-kritiken mot EIP-editorerna kunde inte beläggas i förstapartskälla.**
  `ethereum/EIPs` issue #2173 bär enbart två bot-kommentarer. ERC-utbrytningen är belagd som
  faktum men **utan angivet skäl** i Ethereums eget repo. Att skälet var editor-brist finns
  bara i tredjepartsrapportering och används inte som belägg.
- **Ingen primärkälla kopplar migrations-numrering — eller någon annan löpnummer-serie —
  till AI-agenter specifikt.** Django/Rails-precedenten gäller mänsklig parallellism.
  Översättningen till agenter är vår, inte källornas.
- **Rails 2.1 release notes**, den historiska rationalen bakom timestamp-bytet, ger 404.
  Belagt i stället normativt via nuvarande Configuring-guide.
- **`pip`:s `news/`-katalog var tom** vid mätningen (nyligen släppt version). Fragment-
  räkningen 49/49 vilar därför på tre projekt, inte fyra.
- Hur GitHubs `/fleet`-subagenter isoleras, och Devins grennamngivning och eventuella
  lås — **odokumenterat** i leverantörernas egen dokumentation.

**Om teorin:**

- **Ingen enskild primärkälla formulerar tre-vägs-avvägningen litet / monotont /
  okoordinerat som ett samlat omöjlighetsresultat.** Delarna finns i RFC 9562 § 6.4 och
  § 6.8, PostgreSQL:s Notes och Lamport 1978. Sammanfogningen är **vår slutledning** och är
  märkt som sådan.
- **Ingen auktoritativ källa adresserar kategorin "strukturellt möjlig men aldrig
  inträffad".** SRE:s riskkalkyl förutsätter en *mätt* frekvens. Detta är ett verkligt hål i
  litteraturen, inte en utebliven sökning — och det betyder att beslutet om ADR- och
  trådnummer inte kan lutas mot en etablerad tröskel. Den finns inte.
- **SRE-boken innehåller ingen frekvens- eller repetitionströskel per uppgift.** Verifierat
  frånvarande i båda kapitlen, inte bara ohittat.
- **Knuths eventuella korsattribution till Hoare** är inte verifierad; 1974-texten
  tillskriver ingen.
- **Levesons "Engineering a Safer World"** lästes inte (404 på MIT-servern). Leveson-citat
  kommer uteslutande ur Safety Science 2004.

**Om metoden:**

- Delfrågorna 3, 4 och 5 samlades in av **underagenter** med bindande primärkälle-krav. Jag
  verifierade själv om de två mest bärande citaten — Cursors lås-passage och Django-passagen
  — och **båda återgavs korrekt ordagrant**. Övriga citat i de tre avsnitten vilar på
  delegerad hämtning och är inte oberoende dubbelkontrollerade av mig.
- Mätningarna av towncrier, `human-id` och `backlog`-CLI:t gjorde jag själv, mot versioner
  som står utskrivna: towncrier `24.8.0`, `backlog` `1.47.1`.

## Källförteckning

### Egna mätningar (2026-07-29, versioner utskrivna)

- towncrier `24.8.0` via `uvx` — orphan-fragment-allokering (20/20 unika) och
  `build --draft`-rendering (orphan renderas nummerlöst)
- `human-id` — namnrymd 200 × 300 × 250 = 15 000 000; 1 kollision på 5 000 dragningar
- `backlog` CLI `1.47.1` — tre mätningar av ID-allokering mellan arbetsträd

### Numreringsflöden i primärkälla

- [rust-lang/rfcs README](https://github.com/rust-lang/rfcs/blob/master/README.md)
- [PEP 1 — PEP Purpose and Guidelines](https://peps.python.org/pep-0001/)
- [discuss.python.org — Confusion about assignment of PEP numbers](https://discuss.python.org/t/confusion-about-assignment-of-pep-numbers/38481)
- [hugovk/pepotron](https://github.com/hugovk/pepotron)
- [kubernetes/enhancements — keps/README.md](https://github.com/kubernetes/enhancements/blob/master/keps/README.md)
- [EIP-1](https://eips.ethereum.org/EIPS/eip-1) · [ethereum/ERCs](https://github.com/ethereum/ERCs)
- [towncrier tutorial](https://towncrier.readthedocs.io/en/stable/tutorial.html) ·
  [towncrier CLI-referens](https://towncrier.readthedocs.io/en/stable/cli.html) ·
  [`create.py` @ 24.8.0](https://github.com/twisted/towncrier/blob/24.8.0/src/towncrier/create.py)
- [changesets `packages/write/src/index.ts`](https://github.com/changesets/changesets/blob/main/packages/write/src/index.ts)
- [Linux — Submitting patches](https://www.kernel.org/doc/html/latest/process/submitting-patches.html)
- [skieffer/branchnews](https://github.com/skieffer/branchnews)
- [Django — Migrations](https://docs.djangoproject.com/en/stable/topics/migrations/) ·
  [Rails — Configuring](https://guides.rubyonrails.org/configuring.html)

### Distribuerade ID-mönster

- [RFC 9562 — UUIDs](https://www.rfc-editor.org/rfc/rfc9562.html)
- [ulid/spec](https://github.com/ulid/spec)
- [twitter-archive/snowflake @ `snowflake-2010`](https://github.com/twitter-archive/snowflake/blob/snowflake-2010/src/main/scala/com/twitter/service/snowflake/SnowflakeServer.scala)
- [Hibernate 6.6 User Guide](https://docs.hibernate.org/orm/6.6/userguide/html_single/Hibernate_User_Guide.html)
- [PostgreSQL — CREATE SEQUENCE](https://www.postgresql.org/docs/17/sql-createsequence.html)
- [Lamport 1978 — Time, Clocks, and the Ordering of Events](https://lamport.azurewebsites.net/pubs/time-clocks.pdf)
- [Almeida, Baquero, Fonte — Interval Tree Clocks, OPODIS 2008](https://gsd.di.uminho.pt/members/cbm/ps/itc2008.pdf)

### Agentiska system

- [Claude Code — worktrees](https://code.claude.com/docs/en/worktrees) ·
  [agent teams](https://code.claude.com/docs/en/agent-teams) ·
  [sub-agents](https://code.claude.com/docs/en/sub-agents)
- [Anthropic Engineering — multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Cursor — Scaling agents](https://cursor.com/blog/scaling-agents) ·
  [worktrees](https://cursor.com/docs/configuration/worktrees)
- [GitHub Copilot coding agent](https://docs.github.com/en/copilot/concepts/coding-agent/coding-agent) ·
  [`/fleet`](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/fleet)
- [OpenAI Codex — git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees)
- [Devin — advanced capabilities](https://docs.devin.ai/work-with-devin/advanced-capabilities)
- [arXiv:2607.04697](https://arxiv.org/html/2607.04697v2) ·
  [arXiv:2604.03551 (AgenticFlict)](https://arxiv.org/html/2604.03551v1) ·
  [arXiv:2606.15376 (CoAgent)](https://arxiv.org/abs/2606.15376) ·
  [arXiv:2510.18893 (CodeCRDT)](https://arxiv.org/abs/2510.18893)

### När något ska mekaniseras

- [Fowler — Yagni](https://martinfowler.com/bliki/Yagni.html) ·
  [Jeffries — You're NOT gonna need it!](https://ronjeffries.com/xprog/articles/practices/pracnotneed/)
- [Knuth 1974 — Structured Programming with go to Statements (PDF)](https://pic.plover.com/knuth-GOTO.pdf) ·
  [ACM-post](https://dl.acm.org/doi/10.1145/356635.356640)
- [SRE — Eliminating Toil](https://sre.google/sre-book/eliminating-toil/) ·
  [Automation at Google](https://sre.google/sre-book/automation-at-google/) ·
  [Embracing Risk](https://sre.google/sre-book/embracing-risk/)
- [Reason — Human error: models and management, BMJ 2000](https://pmc.ncbi.nlm.nih.gov/articles/PMC1117770/)
- [Cook — How Complex Systems Fail](https://how.complexsystems.fail/)
- [Leveson — A New Accident Model for Engineering Safer Systems, Safety Science 2004 (PDF)](http://sunnyday.mit.edu/accidents/safetyscience-single.pdf)

### Internt

- [ADR-081 — Nummer tilldelas vid landning](../decisions/ADR-081-nummer-tilldelas-vid-landning.md)
- [ADR-076 — Merge-grinden](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)
- [ADR-079 — Instruktionsleverans, bärare per lager](../decisions/ADR-079-instruktionsleverans-barare-per-lager.md)
