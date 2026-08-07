# ADR-100: Sanningshierarkin — koden äger beteendet, prosa är karta

- Status: Accepted (grillad samsyn S99 Del 6, Marcus-kvitterad 2026-08-07)
- Datum: 2026-08-07
- Fas: Session 99, PRD `TASK-159`

## Kontext

Principen *"koden är enda sanningskällan"* har hittills bara funnits som ett
färskt lessons-fragment — inte ett beslutat, namngivet system. Sanningsanspråken
i repot är splittrade och i sin YTFORM lätta att läsa som motsägelsefulla, även
när de sakligt stämmer: `data-model.md` kallar sig **"AUKTORITATIV"** för
datamodellen (rad 30). `ADR-036` säger **"CI är den enda mekaniska
enforcement-grinden"**. `ADR-048` säger att **git är sanningskällan** för
historik. Ingen av dessa tre är fel — men ingen av dem säger var de ANDRA hör
hemma, och en läsare som möter alla tre samtidigt kan inte mekaniskt avgöra om
de säger emot varandra eller kompletterar varandra.

Dagens maskineri verifierar FORM, inte SANNING. De tretton docs-grindarna
(`scripts/check-docs.sh`) kontrollerar radform, radantal, länk-existens,
frontmatter-fält — ingen av dem läser om en prosarad fortfarande stämmer mot
det tillstånd den beskriver. De enda punkterna i huset där prosa faktiskt vägs
mot verkligheten är tre smala grindar: `check-permissions-claims.sh`
(`ADR-083`, existens av en åberopad `permissions.*`-nyckel),
`check-fetch-depth-invariant.sh` (existens av en erratum-rad),
`check-adr-count.sh` (fil-räkning mot README:s tal). Allt annat i
dokumentationsmaskineriet är läsdisciplin, inte mekanism.

Felklassen **"prosa om passerat läge konsumeras som fakta"** är belagd
återkommande: `tasks/lessons.md` `L477` (tre separata instanser), S99 Del 2:s
premisskorrektion, och en kod-kommentars-drift där `check-docs.sh` påstod "tio"
grindar körda medan `.claude/agents/bygg-agent.md` påstod "nio" — samma tal, två
filer, en av dem fel (`TASK-106`).

**Snittet mot uppdrag 9** (S99 Del 6, fråga 1): denna ADR är regelverket —
måttstocken en framtida styrande-docs-audit (uppdrag 9, egen PRD, egen
grillning) mäter MOT. ISO 19011:2018 definierar en audit som *"the systematic,
independent and documented process for obtaining objective evidence and
evaluating it objectively to determine the extent to which the audit criteria
are fulfilled"* — kriterierna måste finnas FÖRE granskningen, inte uppfinnas
under den. Sekvensen är därför bindande: 6 (denna ADR) → 9 (auditen), aldrig
omvänt.

## Beslut

### 1. Domänhierarkin — EXAKT EN auktoritativ källa per kunskapsklass

| # | Kunskapsklass | Auktoritativ källa | Exempel |
|---|---|---|---|
| 1 | Systemets NUVARANDE beteende & mekanik (config ÄR kod) | **KODEN** | hookar, grindskript, `.conf`-policyfiler, CI-workflow-YAML |
| 2 | Varför ett beslut fattades, vilka alternativ som avvisades | **ADR:er** | denna fil, och de ~99 andra i `docs/decisions/` |
| 3 | Om en specifik körning/PR/commit är grön eller röd | **CI** | GitHub Actions-utfallet, aldrig ett prosa-påstående om det |
| 4 | Historik — vad som HÄNT, i förfluten tid | **git + explicit frys-märkta ögonblicksbilder** | `git log -p`, frysta docs (§ 4 nedan) |
| 5 | Externa system koden inte kan bära i sig själv | **en utpekad referens-fil** | `docs/reference/data-model.md` för Airtable-basens fältschema |
| 6 | Pågående, oavslutat arbete | **kort + sessionsdok** | backlog-kort, `tasks/sessions/*.md` |
| 7 | Marcus-mandat + maskinfakta som inte hör i repot | **memory-ytan** | `~/.claude/projects/.../memory/*.md` |

Rad 1–6 är hubbens `SYSTEMET.md` §0-post "sanningskälla (per domän)"
(hub-commit `7913c16`) ordagrant. Rad 7 är ett tillägg ur S99 Del 7: när
Marcus kuraterade memory-ytan (16 poster → 6, `MEMORY.md` omskrivet) blev
frågan "vad äger memory?" explicit besvarad för första gången — domänhierarkins
tabell i Del 6 hade ingen rad för den ytan eftersom ytan inte var i scope för
den grillningen. Det är samma hierarki, kompletterad i efterhand, inte en
avvikande andra tabell.

Alla andra ytor — `CLAUDE.md`, README:er, kodkommentarer, sessionsdok-prosa om
äldre tillstånd — är **KARTA**. En karta beskriver terrängen, den ÄR inte
terrängen: den får peka på den auktoritativa källan, sammanfatta den, eller
varna om den, men den ersätter den aldrig som facit vid en motsägelse.

### 2. Karta, aldrig kopia

En sammanfattning som duplicerar sin källas INNEHÅLL (inte bara pekar på den)
är alltid ett driftrisk-par: två platser som kan divergera utan att någon
grind ser det förrän en läsare litar på fel sida. Hunt & Thomas formulerade
samma regel för kod redan 1999: *"Every piece of knowledge must have a single,
unambiguous, authoritative representation within a system"* (DRY-principen,
*The Pragmatic Programmer*) — appliceras här på PROSA, inte bara kod: en
styrande fil som behöver referera en annan kunskapsklass **pekar** dit, den
**återger** den inte.

Mönstret är redan i drift på flera ställen — `CLAUDE.md`s rad om
`data-model.md` (*"konsultera... INNAN du designar"*, ingen fält-tabell
kopierad in), `schema_reference.md`s banderoll som pekar till `data-model.md`
i stället för att uppdateras parallellt. Detta beslut kodifierar mönstret som
**regel**, inte längre bara vane: varje ny styrande-doc-rad som rör en
kunskapsklass utanför sin egen (§1) SKA peka, inte kopiera.

**Undantag, uttryckligt:** en referens-fil (domän 5) är i sig en avsedd,
förvaltad kopia av ett externt systems fakta — den är källan FÖR koden även om
Airtable "äger" ursprunget. Motsägelsen löses av att referens-filen är
UTPEKAD som den ENDA bäraren: ingen annan fil i repot får ha en egen
uppfattning om Airtable-schemat vid sidan av `data-model.md`.

### 3. Läsregeln — kod-verifiera före användning (lyft från fragment till regel)

En agent som möter ett prosapåstående om systemets NUVARANDE beteende (domän 1)
— *"X är mekaniserat"*, *"Y körs alltid"*, *"grinden fäller Z"* — **verifierar
mot koden innan påståendet konsumeras som fakta.** Detta var tidigare ett löst
lessons-fragment; det är nu regel, i linje med `ADR-083`s grundinsikt att ett
dokument som FELAKTIGT påstår mekanisering är strikt sämre än att inte påstå
något alls, eftersom det tar bort granskningen utan att ge skyddet.

Samma regel gäller åt andra hållet för agent-uppdrag: `ADR-086`s premiss-pass
är denna regel applicerad på UPPDRAGSTEXTER specifikt — ett obelagt
faktapåstående i ett uppdrag (fil-adress, radnummer, SHA, tal,
tillståndspåstående) är en HYPOTES tills mottagaren prövat det mot disk. Denna
ADR generaliserar den regeln till ALL prosakonsumtion, inte bara
uppdragstexter — samma disciplin, bredare tillämpning.

### 4. Frys-banderoll-standarden

Historik (domän 4) markeras EXPLICIT frusen när den slutar vara en levande
källa men bevaras som ögonblicksbild. Formen — redan i produktion i
`docs/reference/schema_reference.md`s öppningsstycke sedan 2026-08-01 —
upphöjs här till standard för varje framtida frysning. Tre element, i
öppningsstycket:

1. **Frusen-markör** — ordet "Frusen" eller "Frusen ögonblicksbild" skrivet
   ut, inte underförstått av ålder eller filnamn.
2. **Frysdatum** — när, och om relevant varför, filen slutade vara levande.
3. **Pekare till den levande källan** — vad som ÄR auktoritativt NU, om något
   ersatte den frusna filen (per §1/§2: en pekare, aldrig en kopia av den nya
   källans innehåll).

**Inget nytt frontmatter-fält införs.** Standarden är en PROSA-konvention i
öppningsstycket — samma form `schema_reference.md` redan bär — inte en
mekanism `check-frontmatter.sh` grindar. Se § 6 för varför ingen ny grind
byggs för den här heller.

### 5. Relationen till ADR-083 — kompletterande, inte överlappande

`ADR-083` förbjuder att en text PÅSTÅR en mekanism som inte finns (*"mekaniserad
som spärr"* när ingen spärr existerar). Denna ADR reglerar en annan fråga:
GIVET att något är sant, VAR bor sanningen, och vad är läsaren skyldig att
lita på när två ytor tycks säga olika saker. `ADR-083` är en
integritets­grind på ENSKILDA mekanism-påståenden; denna ADR är en hierarki
över HELA kunskapsytan.

De är kompletterande, inte överlappande: ett dokument kan bryta mot `ADR-083`
(påstå en mekanism som inte finns) utan att bryta mot denna ADR (det kan
fortfarande peka rätt på VILKEN yta som skulle ägt sanningen om mekanismen
funnits) — och tvärtom, ett dokument kan respektera `ADR-083` (påstår ingen
falsk mekanism) men ändå bryta mot denna ADR genom att KOPIERA i stället för
att PEKA.

### 6. Ingen ny grind — tre decline-rationale

Uppdrag 6-grillningen (S99 Del 6, fråga 4) övervägde och avvisade tre
kandidat-grindar, var och en på namngiven grund:

- **Skript-existens-grind** (verifiera att varje skript en ADR/CLAUDE.md-rad
  nämner faktiskt finns på disk). Avvisad: **noll belagda incidenter** av
  motsatsen i repots historik — att bygga en grind mot ett fel som aldrig
  inträffat är att bygga "ifall", vilket den dubbelriktade
  över-engineering-vakten (hub-`CLAUDE.md`) redan säger nej till.
- **Hook-registrerings-grind** (verifiera att en hook nämnd i prosa faktiskt
  är registrerad i `settings.json`). Avvisad: **en** belagd incident
  (`code-role-discipline-ej-laddad`-klassen), men i en **ofarlig riktning** —
  felet som inträffade var att en mekanism troddes SAKNAS fastän den fanns
  (för försiktig, inte för optimistisk), vilket är den säkra sidan att ha fel
  på.
- **Semantisk verifiering** (läs ett prosapåståendes INNEBÖRD, inte bara att
  en åberopad nyckel existerar). Avvisad på samma grund `ADR-083` beslut 3
  redan avgjorde för en snävare yta: semantik kräver tolkning, och en grind
  som gissar semantik fäller fel — snävt och mekaniskt slår brett och
  ungefärligt.

Karta-inte-kopia-regeln (§2) gör redan drift mekaniskt svårare för NYA
skrivtillfällen; läsregeln (§3) är den kvarvarande disciplinen för BEFINTLIG
prosa. `ADR-039`s lesson→grind-kadens är den öppna, framtida vägen om ett
belagt felfall en dag motiverar en fjärde grind — den stängs inte här, den
öppnas bara inte i förskott.

## ADR-baren — prövad

1. **Svårt att återställa?** Ja, i båda meningarna. I koherens: utan en
   namngiven hierarki ser tre sant-samtidigt-gällande "X är sanningskällan"-
   påståenden (`data-model.md`, `ADR-036`, `ADR-048`) ut som en motsägelse i
   stället för tre domäner; att riva denna ADR återinför den oredan. I kod:
   karta-inte-kopia-regeln (§2) är redan applicerad i flera styrande filer —
   att ändra hierarkin kräver att ompröva var varje befintlig pekar-rad
   pekar.
2. **Överraskande utan kontext?** Ja — en läsare som möter en pekar-rad i
   `CLAUDE.md` i stället för en inlinead tabell kan inte veta att det är ett
   MEDVETET beslut (§2, DRY applicerat på prosa) utan att känna till denna
   ADR.
3. **Verklig avvägning?** Ja: pekare-över-kopia kostar ett extra
   uppslagssteg för läsaren, mot vinsten att eliminera ett driftrisk-par;
   tre kandidat-grindar vägdes och avvisades var för sig i stället för att
   klumpas ihop som "ingen ny grind, punkt".

Alla tre håller ⇒ ADR mintas.

## Alternativ som övervägdes

| Alternativ | Status | Skäl |
|---|---|---|
| Denna hierarki + karta-inte-kopia + läsregel, ingen ny grind (vald) | **Vald** | Täcker felklassen mekaniskt framåt (§2) och disciplinärt bakåt (§3); tre kandidat-grindar avvisade på namngiven, olika grund |
| Semantisk verifieringsgrind (läs påståendets innebörd) | Avvisad | Kräver tolkning; `ADR-083` beslut 3 avgjorde samma fråga för en snävare yta |
| Skript-existens-grind | Avvisad | Noll belagda incidenter — "ifall"-bygge |
| Hook-registrerings-grind | Avvisad | En incident, ofarlig riktning (för försiktig, inte för optimistisk) |
| Statisk uppräkning utan karta/kopia-regel (bara en lista, ingen princip för VARFÖR pekare > kopia) | Avvisad | Löser inte varför en kopia är farligare än en pekare — regeln (§2) är vad som gör listan användbar över tid, inte listan själv |

## Konsekvenser

**Positiva:** en läsare som möter en till synes motsägande sanningsyta (t.ex.
*"CI är sanningskällan"* mot *"`data-model.md` är AUKTORITATIV"*) kan lösa den
mekaniskt: fråga vilken KUNSKAPSKLASS påståendet gäller, slå upp domäntabellen
(§1), den vinner. Läsregeln (§3) gör tveksamhet till en verifieringsåtgärd i
stället för en gissning. Frys-banderoll-standarden (§4) ger historik ett
igenkännbart, upprepningsbart uttryck i stället för att varje frysning
uppfinner sin egen form.

**Negativa/skuld, öppet burna:** ingen ny mekanism grindar hierarkin själv —
en framtida fil KAN fortfarande kopiera i stället för att peka, och ingenting
utom läsregeln (mänsklig disciplin) fångar det tills ett belagt felfall
motiverar en grind (`ADR-039`). `CLAIM_MARKERS`-listan i
`check-permissions-claims.sh` (`ADR-083`) är fortfarande ändlig och täcker
inte varje tänkbart mekanism-påstående — denna ADR ändrar inte den gränsen.
Uppdrag 9:s audit (måttstocken denna ADR levererar) är INTE utförd av denna
skiva — den är en separat, framtida grillning och exekvering.

## Relaterat

- [ADR-083](ADR-083-prosa-som-pastar-mekanism.md) — kompletterande relation,
  § 5 ovan
- [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) — CI äger
  *utfall* (domän 3), ordnas in oförändrad, rivs inte
- [ADR-048](ADR-048-synk-horisont-arkiv-atkomst.md) — git äger *historik*
  (domän 4), ordnas in oförändrad, rivs inte
- [ADR-039](ADR-039-konsistens-grindar-kadens.md) — lesson→grind, den öppna
  vägen om ett belagt fall en dag motiverar en fjärde grind
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) — "kod
  visar vad, ADR visar varför" redan citerad här för trådregistrets
  ADR-praxis-jämförelse; samma Nygard-källa
- [ADR-086](ADR-086-uppdragets-premisser-provas-av-mottagaren.md) —
  premiss-passet, läsregeln (§3) applicerad på uppdragstexter specifikt
- `tasks/sessions/2026-08-07-session-99.md` § Del 6 (grillad samsyn, sex
  kvitterade frågor) + § Del 7 (memory-domänens tillägg, rad 7 i §1)
- `~/Repon/marcus-system/SYSTEMET.md` §0 "sanningskälla (per domän)"
  (hub-commit `7913c16`) — termposten denna ADR fyller numret i (rad 1–6);
  §0-kompletteringen är orkestrerarens moment, inte denna skivas
- `backlog/tasks/task-159*` — PRD + skivor (`TASK-159.1`–`.3`); denna ADR är
  `.1`, tillämpningen (städposten + frys-banderollerna) är `.2`, QA är `.3`

## Källor

- [ISO 19011:2018 — Guidelines for auditing management systems](https://www.iso.org/standard/70017.html) —
  audit criteria måste definieras FÖRE granskningen; grunden för sekvensen
  6 → 9 (§ Kontext)
- [Documenting Architecture Decisions (Nygard, 2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) —
  "kod visar VAD, ADR visar VARFÖR" (domän 1 vs domän 2 i §1)
- Hunt, A. & Thomas, D., *The Pragmatic Programmer* (1999) — DRY-principen:
  *"Every piece of knowledge must have a single, unambiguous, authoritative
  representation within a system"* (§2)
- [Effective context engineering for AI agents (Anthropic)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) —
  kuraterad, pekande instruktionsfil framför uttömmande kopia
- [Claude Code — Best practices for agentic coding (Anthropic)](https://code.claude.com/docs/en/best-practices) —
  samma princip applicerad på `CLAUDE.md` specifikt
