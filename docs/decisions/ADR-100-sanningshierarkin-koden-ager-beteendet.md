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
- `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 6 (grillad samsyn, sex
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

## Updates

### 2026-08-08 (S99) — review_by-bumpens innebörd + ägar-deklarationens form

Additiv amendering, `TASK-161.1` (PRD `TASK-161`, styrande-docs-auditen —
uppdrag 9). Grillad samsyn: `tasks/sessions/archive/2026-08/2026-08-07-session-99.md` § Del 10
("review_by-bumpens innebörd definieras (förfallo-grinden FINNS redan —
check-frontmatter Check 3, verifierad) · ägar-deklaration per styrande dok").
Ingen ny ADR — denna post **operationaliserar** §2 (karta-inte-kopia) och §3
(läsregeln) ovan, den ändrar ingen tidigare beslutstext.

**Bakgrund, verifierad mot disk.** Kadensgrinden existerar redan och gör exakt
en sak mekaniskt: `scripts/check-frontmatter.sh` Check 3
(rad ~125–132) fäller ett styrande dok (listan i
`.frontmatter-policy.conf` `FRONTMATTER_GOVERNING_DOCS`) vars `review_by`
saknas eller har passerat dagens datum. Vad grinden INTE gör — och aldrig har
gjort — är att pröva om bumpen till ett nytt datum föregicks av något. En
mekanisk kadens utan definierad innebörd kan uppfyllas av att bara skriva ett
senare datum, exakt den formen av "kopia som slutar leva men fortsätter påstå
sig leva" som `TASK-161`s problemformulering identifierar som en av driftens
tre ansikten.

#### A. Vad en `review_by`-bump KRÄVER

Att bumpa `review_by` på ett styrande dok i `FRONTMATTER_GOVERNING_DOCS`
**kräver** en mini-audit av dokumentet, i tre namngivna steg:

1. **Drift-koll mot ägd yta** — varje faktapåstående dokumentet gör om
   kunskapsklass 1 (§1, "systemets NUVARANDE beteende & mekanik") vägs mot
   koden. Detta är läsregeln (§3) tillämpad framåtriktat i stället för
   reaktivt: i stället för att vänta på att en läsare möter en drift-instans,
   är bumpen tillfället en skribent aktivt letar efter en.
2. **Pekar-integritet** — varje pekare dokumentet bär till en annan
   auktoritativ källa (§1, rad 1–7 — kod, ADR, CI, git/frys, referens-fil,
   kort/sessionsdok, memory) verifieras peka på något som fortfarande
   existerar och fortfarande säger vad pekningen påstår. En trasig pekare är
   samma felklass §2 varnar för — bara i pekar-riktningen i stället för i
   kopierat innehåll.
3. **Ägar-deklarationens giltighet** — dokumentets egen rad (del B nedan)
   prövas: stämmer fortfarande `X` (vad dokumentet självt äger), `Y` (vad det
   kartlägger) och `Z` (vem som vinner vid konflikt) mot dokumentets faktiska
   innehåll efter eventuella ändringar sedan förra bumpen?

**Ingen ny grind mintas för mini-auditens tre steg.** Samma avvägning som §6
redan gjorde för semantisk verifiering: att LÄSA om ett påstående fortfarande
stämmer, om en pekare fortfarande träffar rätt, eller om en ägar-deklaration
fortfarande är sann kräver tolkning — en grind som gissar det svaret slår fel
brett i stället för snävt och mekaniskt rätt. Kadensgrindens mekaniska roll
är och förblir oförändrad: den fäller ett förfallet datum, inget annat. Vad
denna post gör är att ge SJÄLVA BUMPEN en definierad innebörd — samma mönster
som `ADR-086`s premiss-pass gav "obelagt påstående" en definierad, prövbar
betydelse utan att bygga en ny mekanisk grind för det.

#### B. Ägar-deklarationens form

Varje styrande dokument i `FRONTMATTER_GOVERNING_DOCS` ska bära en
ägar-deklarationsrad, nära öppningen av dokumentet (samma placering som de
två förlagorna nedan redan använder — inte i YAML-frontmatter; samma
prosa-konvention-inte-mekanism-val som frys-banderollen i §4 gör, av samma
skäl: `check-frontmatter.sh` grindar existens av fält, aldrig prosans
innehåll):

> **Äger:** X · **Kartlägger:** Y · **Vid konflikt vinner:** Z

- **X** — den kunskap DETTA dokument själv är den auktoritativa källan för
  (kan vara explicit tomt: `Inget – ren karta`, för ett dokument som enbart
  sammanfattar andra källor).
- **Y** — de andra auktoritativa källorna (§1, rad 1–7) dokumentet pekar till
  eller sammanfattar, namngivna specifikt (t.ex. "ADR-062/063/064",
  "`docs/reference/data-model.md`") — aldrig en generisk hänvisning.
- **Z** — vilken källa som vinner om dokumentets egen prosa och en annan yta
  tycks säga olika saker. Normalt samma svar som §1:s domäntabell redan ger
  för den aktuella kunskapsklassen — raden gör svaret läsbart utan ett extra
  uppslag i den här ADR:n.

**Källmärkt formfacit — verifierat, inte citerat ur minne (`ADR-086`).**
Två befintliga rader bär redan delar av mönstret, i lösare prosaform, och är
förlagan denna mall generaliserar:

- `docs/reference/segment-arkitektur.md` rad 10: *"...Uppslagsverk/
  orientering — sak-besluten lever i ADR-062/063/064 + data-model §Kända
  fällor; detta dok binder dem, fryser dem inte. Vid konflikt gäller
  ADR:erna."* — bär redan Kartlägger- och Vid-konflikt-vinner-komponenterna,
  utan en Äger-komponent (dokumentet äger inga beslut själv).
- Rot-`README.md` rad 14: *"**Status:** Övning 2 pågår — Fas 6
  (strangler-fig). Aktuellt fas- och sub-fas-läge ägs av `docs/byggplan.md`
  §2 (kanonisk plats — status dupliceras inte hit)."* — bär en
  delegerings-deklaration ("ägs av... kanonisk plats") i samma anda,
  återigen utan den explicita tredelade formen. (Källradens egen
  markdown-länk är avsiktligt inte återskapad i citatet här — den pekar
  korrekt från `README.md`s egen plats, inte från `docs/decisions/`.)

**Ärlighet om underlaget:** ingen av de två raderna bär den exakta strängen
`Äger X · Kartlägger Y · vid konflikt vinner Z` — den strängen fanns inte i
repot före denna amendering (verifierat: `grep -rn "Äger \|Kartlägger"` mot
hela `docs/`+`tasks/`+rot-nivå gav noll träffar på den samlade formen före
denna commit). De två raderna är precedent för det UNDERLIGGANDE mönstret
(peka + namnge konflikt-vinnaren), inte färdiga instanser av mallen. Denna
amendering DEFINIERAR den enhetliga formen och kompletterar den med den
tredje, tidigare outtalade komponenten (`Äger:` X) — utrullningen till
enskilda dokument (att faktiskt skriva raden in i `CLAUDE.md`, `ORDLISTA.md`,
`docs/byggplan.md` med flera) är `TASK-161.4`, inte denna skiva.

**Scope:** exakt de dokument `.frontmatter-policy.conf`
`FRONTMATTER_GOVERNING_DOCS` redan listar — samma yta kadensgrinden (del A)
gäller. Ett dokument utanför den listan bär ingen `review_by`-plikt och
därmed heller ingen ägar-deklarationsplikt av denna post.
