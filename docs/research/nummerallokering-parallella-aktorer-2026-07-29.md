---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: draft
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

(ej besvarad än)

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

## Delfråga 3 — Vad säger distribuerade system, och var slutar de hjälpa?

(ej besvarad än)

## Delfråga 4 — Ändras svaret med autonoma agenter?

(ej besvarad än)

## Delfråga 5 — Finns argument för att INTE bygga något?

(ej besvarad än)

## Vad detta betyder för (i), (ii), (iii) — och en eventuell fjärde form

(ej besvarad än)

## Vad som INTE gick att belägga

(ej besvarad än)

## Källförteckning

(ej besvarad än)
