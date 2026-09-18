---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Levande CI-dokumentation — håller vi ett aktuellt "interface" över CI-arkitekturen?

> **Proveniens.** Skrivet 2026-09-18 (S126 resume 1) som svar på Marcus fråga
> efter CI-djupgranskningen (`docs/research/ci-djupgranskning-2026-09-17/`,
> tolv leverabler + `underlag/`, daterad 2026-09-17). Jag har läst
> `00-huvudrapport.md` i sin helhet, `09-ci-som-ateranvandbar-djupmodul.md`
> §Fynd 8 i sin helhet, `10-migrations-och-atgardsplan.md` § N8 och § "Inte
> alls" (I1–I11) i sin helhet, och `01-fil-och-komponentinventering.md`s
> inledning + `01-inventering.json`s struktur. Jag har **inte** läst
> leverabel 3–8 och 12 i sin helhet — de är citerade i denna fil bara där
> huvudrapporten redan destillerat dem, aldrig som egen läsning. `ADR-100`
> och `ADR-083` är lästa i sin helhet, ordagrant, eftersom uppdraget
> uttryckligen kräver det. Ingen tidigare research-fil i `docs/research/`
> täcker denna fråga (sökt: `ls docs/research/` + genomläst filnamnslistan;
> `verify-ci-parity-regel-vantetid-2026-08-05.md` handlar om KÖRNINGS-kadens,
> inte DOKUMENTATIONS-kadens, och delar ingen slutsats med denna fråga).
> Kod-tillstånd: `origin/main` på det denna worktree står på (gren
> `docs/s126-resume-1`), `git log -1 --format=%H` = se § Källor.

## Vad jag redan visste innan jag sökte

Repot bär redan tre mekanismer som är direkt relevanta och som jag måste
bygga vidare på, inte uppfinna om:

1. **`review_by`-kadensgrinden** (`scripts/check-frontmatter.sh` Check 3,
   `.frontmatter-policy.conf`s `FRONTMATTER_GOVERNING_DOCS`) fäller ett
   styrande dokument vars `review_by`-datum passerat. `CLAUDE.md` bär
   `review_by: 2026-11-15` (verifierat: `sed -n '1,6p' CLAUDE.md`, i dag).
   `ADR-100` § Updates 2026-08-08 definierar redan VAD en bump kräver: en
   mini-audit i tre steg (drift-koll mot ägd yta, pekar-integritet,
   ägar-deklarationens giltighet) — **ingen ny mekanism**, bara en
   definierad innebörd för en grind som redan finns.
2. **`scripts/check-listparitet.sh`** är ett CI-wirat (`ci.yml:817`)
   strukturellt drift-fångande par-verktyg: två markör-avgränsade listor
   jämförs, fail-closed om de glider isär. Det är repots enda EXISTERANDE
   CI-enforced "regenerera-och-diffa"-släkting.
3. **Två genererings-par utan CI-grind**: `scripts/generera-review-schema.mjs`
   (zod → `docs/reference/review-utlatande.schema.json`, `npm run
   review:schema`) och `scripts/build-farg-atlas.mjs` +
   `scripts/verifiera-farg-atlas.mjs` (design-tokens → atlas, verifieraren
   är MEDVETET oberoende omskriven, inte en import av generatorns egen
   logik — se filens egen kommentar). Båda är manuella `npm run`-kommandon;
   ingen av dem diffas mot commit i CI (verifierat: en `grep` efter
   `review:schema`/`farg-atlas` i workflow-katalogen gav noll träffar).
   Detta är repots existerande mönster för "en genererad artefakt" — och det
   mönstret är i dag "generator + manuell verifiering", inte "CI-grind".

`ADR-100` §1 klassar dessa som domän 1 (kod äger nuvarande beteende) och
domän 2 (ADR äger varför) — CI-djupgranskningens tolv leverabler hör i stället
till en klass §1 inte namnger explicit men som följer av §1 rad 4: **domän 4,
historik** ("vad som HÄNT, i förfluten tid"), eftersom varje leverabel är
tidsstämplade mätningar av ett tillstånd (`eeca8c72`/`main` 2026-09-08–17),
inte en beskrivning av en regel som gäller framåt. `ADR-100` §4
(frys-banderoll-standarden) är därför den regel som redan existerar för
exakt denna situation — den är bara inte ännu TILLÄMPAD på granskningens
egna filer.

Ingen tidigare `docs/decisions/`-ADR har avgjort just denna fråga (sökt:
`grep -rl "CI-djupgranskning\|granskningens leverabler" docs/decisions/`,
noll träffar) — det finns alltså inget beslut att riva här, bara en
tillämpning av `ADR-100` som väntar på att göras explicit.

**Utveckling UNDER skrivandet av denna fil, upptäckt vid en rutinmässig
`git log`-kontroll innan leverans (2026-09-18):** arbetsträdets gren bytte
under mitt pass från `docs/s126-resume-1` till `docs/s126-nu-hogen-kort`
(`git branch --show-current`), och HEAD flyttade till `41febc5e`. De två
senaste commiten där är `TASK-450` (PRD, "Marcus GO 2026-09-18" i
commit-meddelandet) och `TASK-450.1`–`.9` — just den konvertering av
åtgärdsplanens N2–N9 + K1 b till backlog-kort som § Delfråga 3 nedan
rekommenderar, redan utförd av en parallell process medan detta pass
pågick. Detta är alltså inte längre ett förslag jag lägger fram i tomma
intet — det är en observation av att arbetet redan riktas dit, vilket jag
läser som en oberoende bekräftelse, inte en signal att stryka avsnittet.
Jag har inte läst korten i sin helhet utöver `TASK-450`s PRD-huvud (citerat
nedan) — de är utanför detta pass räckvidd att verifiera vidare.

## Kort svar

**Ja, leverablerna blir inaktuella — det är förväntat, inte ett fel.** En
granskning mäter ett tillstånd en viss dag. Dagen efter ändras tillståndet
(åtgärd N1 var redan löst SAMMA DAG granskningen skrevs). Det är samma sak
som händer med en säkerhetsaudit eller ett kvitto: den blir "fel" om man
läser den som en beskrivning av NUET, men den var aldrig menad att vara det.

**Lösningen är inte att hålla granskningen levande — det är att FRYSA den
tydligt och lägga det som SKA hållas aktuellt på rätt plats:**

- Granskningens tolv filer + JSON:en **frysas** med en tydlig stämpel
  ("detta var sant 2026-09-17") — precis som repot redan gör med
  `docs/reference/schema_reference.md`.
- Åtgärderna (N1–N9, SE1–SE21) flyttas till **backlog-kort** — repots
  redan byggda verktyg för "något som ska bockas av och vars status
  ändras" — i stället för att leva som en tabell i en frusen fil.
- "Hur CI fungerar just nu" har redan en levande bärare: **`CLAUDE.md`**,
  som redan är mekaniskt tvingad att granskas regelbundet
  (`review_by: 2026-11-15`, om drygt två månader).
- Ett **"interface" i betydelsen en liten, maskinläsbar karta över vad
  CI-jobben faktiskt gör** finns inte ännu, men kan byggas SENARE genom att
  bygga vidare på ett verktyg som redan finns
  (`scripts/verify-ci-parity.mjs`) — det behövs inte i dag, för ingen
  användare efterfrågar det ännu.
- **Bygg INGEN ny vakt som läser prosa och avgör om den ljuger.** Det är
  redan prövat och avgjort i samma granskning (I6, se nedan) — sju fall,
  ett hittat av en maskin.

## Delfråga 1 — Är inaktualitet ett fel, eller ett drag hos formen?

En audit-rapport är per sin natur ett ögonblick, inte en regel. Nygards
originalformulering av ADR-praxis säger det rakt ut om beslut, och samma
logik gäller mätningar:

> "If a decision is reversed, we will keep the old one around, but mark it
> as superseded. (It's still relevant to know that it *was* the decision,
> but is *no longer* the decision.)"
> — [Documenting Architecture Decisions, Michael Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

Granskningen är inte en ADR, men samma princip gäller: man redigerar inte en
gammal mätning för att göra den "aktuell" igen — man fryser den, och en ny
mätning (en ny audit, en ny research-fil) tar över när tillståndet ändrats
tillräckligt för att motivera det. Google formulerar exakt samma sak för
dokumentation generellt: dokument har en `owner` och ett `reviewed`-datum,
och **"documents become stale, obsolete, or (often) abandoned"** över tid —
det är den förväntade livscykeln, inte ett symptom på ett fel
(*Software Engineering at Google*, kap. 10,
[abseil.io/resources/swe-book/html/ch10.html](https://abseil.io/resources/swe-book/html/ch10.html)).

**Är det ett problem?** Bara om någon läser en frusen fil och TROR den är
aktuell. Det är precis `ADR-100`s hela poäng (§3, "läsregeln") och skälet
`ADR-100` §4 finns: en banderoll som säger "Frusen, 2026-09-17, se X för
vad som gäller nu" gör felläsningen omöjlig utan att kräva att någon
underhåller innehållet.

## Delfråga 2 — Klassning av granskningens tretton filer

Fyra klasser, som premisserna definierar dem: **FRYS** (daterad
ögonblicksbild, rörs aldrig efter en banderoll), **GENERERA** (kan härledas
mekaniskt ur `ci.yml`/skript/config — anges ur VAD), **HANDSKRIVEN-LEVANDE**
(litet, varför-lager, uppdateras löpande) och **DÖ** (behövs inte efter
åtgärderna).

| # | Fil | Klass | Motivering |
|---|---|---|---|
| 1 | `00-huvudrapport.md` | **FRYS** | Domen ("25 minuter väntan", "51 av 52 nätter röda") är mätningar av ett tillstånd 2026-09-17. N1 var redan löst samma dag — exakt det symptom som visar att filen mäter, inte reglerar. Banderoll + pekare till en framtida uppföljande audit. |
| 2 | `01-fil-och-komponentinventering.md` + `01-inventering.json` | **FRYS** — inte GENERERA, trots utseendet | Jag öppnade JSON:en (`python3 -c "import json; …"`, i dag): 367 poster, fritextfält som `syfte` och `vad_kan_ga_fel` kräver TOLKNING av en agent, inte mekanisk extraktion. Filens egen text (rad 71) säger att markdown-tabellerna genererades ur JSON:en av skript i "gransknings scratch-katalog (ej committade)" — jag sökte efter `build-inventory.mjs`, `completeness-check.mjs`, `build-markdown-tables.mjs` i hela repot och git-historiken: **noll träffar**. Ingen generator finns i repot. JSON:en är en HANDSAMMANSTÄLLD ögonblicksbild, inte en levande härledning — premiss 2:s hypotes är alltså BEKRÄFTAD. |
| 3 | `02-teknisk-arkitekturkarta.md` | **FRYS**, med en flaggad möjlighet | Beskriver hur `ci.yml`/`ci-suite.yml` hänger ihop i dag. Job-grafen, triggers och `needs`-kedjan ÄR mekaniskt härledbara (`verify-ci-parity.mjs` gör redan delar av detta) — men filens värde ligger i den TOLKANDE prosan ("varför steget finns", "vad kan gå fel"), som inte är mekaniserbar. Frys nu; en framtida smal GENERERA-yta (bara jobbnamn/triggers/`needs`) är en möjlig senare skörd, se Option B. |
| 4 | `03-andringslogg.md` | **FRYS** | Historik över fyra månaders arkitekturändringar. `ADR-100` §1 domän 4: git är den auktoritativa källan för historik; denna fil är en LÄSBAR SAMMANFATTNING av den, aldrig en ersättning. Frys med pekare till `git log`. |
| 5 | `04-branch-worktree-commit-och-pushflode.md` | **FRYS** | Granskar om `CLAUDE.md`s egna påståenden om gren/worktree/push höll 2026-09-17. `CLAUDE.md` är redan den levande källan (domän 1); denna fil är en revisions-ÖGONBLICKSBILD av att den källan stämde, inte en ny källa. |
| 6 | `05-branschjamforelse.md` | **FRYS** | En research-fil i klassisk mening — jämför vårt läge mot Google/Kubernetes/Next.js en given dag. Samma klass som varje annan fil i `docs/research/`; ingen särbehandling behövs utöver den konvention som redan finns (frontmatter + `review_by`). |
| 7 | `06-airtable-kompromisser-och-empiriska-fynd.md` | **FRYS** | Empiriska FYND vid granskningstillfället. Den auktoritativa katalogen över Airtables plattformsväggar är redan `docs/reference/airtable-constraints.md` (`ADR-100`-domän 5); denna fil pekar dit, kopierar inte, och ska förbli en daterad tilläggsobservation. |
| 8 | `07-hermetiska-tester-kontra-realistisk-e2e.md` | **FRYS** | Prövar om en princip höll en given dag. Nästa sådan prövning är en ny, egen daterad fil — inte en redigering av denna. |
| 9 | `08-risk-redundans-flakighet-tid-och-kostnad.md` | **FRYS**, den viktigaste att frysa korrekt | Bär granskningens tyngsta siffror (25 min, 51/52, 60 ändringar). Dessa siffror förändras i samma takt som N-åtgärderna landar. Att redigera filen "i takt med verkligheten" vore att göra den till precis den sortens rörliga mål som `ADR-083` varnar för — en ny mätning hör hemma i en NY fil, inte en uppdatering av denna. |
| 10 | `09-ci-som-ateranvandbar-djupmodul.md` | **FRYS** | Beskriver ett FÖRESLAGET framtida kit (`ci-kit`) som inte är byggt. Det finns inget att hålla "levande" här — det finns inget som existerar ännu. Om/när kitet byggs (se SE4:s villkor, "ett andra produktrepo") får DET sin egen levande dokumentation; denna fil förblir förslagets frysta ursprung. |
| 11 | `10-migrations-och-atgardsplan.md` | **FRYS för resonemanget, DÖD SOM SPÅRNINGSMEKANISM** | Se § Delfråga 3 nedan — detta är den enda filen där "frys allt" inte räcker, eftersom filen bär en TODO-lista vars status per rad (klar/pågår/väntar) MÅSTE kunna ändras utan att hela filens resonemang blir overksamt. Repot har redan rätt verktyg för det: backlog-kort. |
| 12 | `11-evidens-och-osakerhetsregister.md` | **FRYS** | Käll- och belägg-register för just DENNA gransknings påståenden. Ett bevisregister för en frusen rapport ska själv vara fruset — annars vet ingen vilken version av rapporten det styrker. |
| — | `underlag/*` (21 filer) | **FRYS** (utanför uppdragets 13, nämnt för fullständighet) | Rått arbetsmaterial. Samma logik: daterat, aldrig menat att uppdateras. |

**DÖ: noll av tretton, och det är ett resultat, inte en gissning.** Jag
letade aktivt efter en fil vars HELA innehåll upphör att ha värde efter att
åtgärderna körts (t.ex. om en fil bara beskrev en bugg som nu är fixad) och
hittade ingen — varje fil bär antingen en metod, en jämförelse eller ett
bevisspår som behåller sitt värde som HISTORIK även efter att den akuta
sakfrågan är löst (samma skäl en säkerhetsaudit inte kastas efter att
hålen är täppta). Den enda posten som kommer nära är åtgärdstabellens
enskilda RADER (N1 är redan inaktuell inom filen), vilket är precis varför
den filen — och bara den — behöver ett annat hem för sin spårning, se nedan.

## Delfråga 3 — Åtgärdsplanen: rätt innehåll, fel behållare

`10-migrations-och-atgardsplan.md` är den fil där "frys och glöm" faktiskt
skadar, eftersom dess jobb är att bli avbockad över tid. Repot har REDAN ett
syfte-byggt substrat för precis detta: Backlog.md-korten
(hub-`CLAUDE.md` § ISSUE-SUBSTRAT — "framåtriktade arbets-specar" som
PRD-kort + skivor, ändras ENDAST via backlog-CLI:t, aldrig
direktredigering). `ADR-100` §1 domän 6 säger samma sak: "pågående,
oavslutat arbete" ägs av **kort + sessionsdok**, inte av en
research-markdown-fil.

Att hålla `10-migrations-och-atgardsplan.md` "aktuell" genom att redigera
dess N/SE/I-tabell varje gång ett steg landar är exakt den felklass hela
granskningen mätte flest gånger: **text som var sann när den skrevs och blev
falsk av en senare landning** (N8:s egen diagnos, ordagrant nedan). Att
FORTSÄTTA underhålla tabellen manuellt bygger vidare på samma felklass i
stället för att bryta den.

**Rätt form:** varje N/SE-post som Marcus godkänner blir ett backlog-kort
(`to-issues`-skillen, redan byggd). Kortets status (`ready-for-agent` →
`in-progress` → `Done`) BÄR framstegsspårningen mekaniskt via
backlog-verktyget — som redan är det enda repot litar på för just detta
(`ADR-100` domän 6). Den frysta researchfilen förblir facit för VARFÖR varje
åtgärd föreslogs; korten bär VAD som hänt sedan dess. Detta river ingenting
— det är en tillämpning av ett beslut som redan är fattat (hub-`CLAUDE.md`
§ ISSUE-SUBSTRAT), inte ett nytt.

**Detta är redan i rörelse.** `TASK-450` (PRD, commit `2d3af6de`, "Marcus
GO 2026-09-18") och dess skivor `TASK-450.1`–`.9` (commit `41febc5e`)
konverterade N2, N3, N4, N5, K1 b, N7, N9 och N8 till backlog-kort under
tiden detta pass skrevs — se § "Utveckling under skrivandet" ovan. N6 hade
redan ett eget kort sedan tidigare (`TASK-366`, citerat i commit-meddelandet
"bär designfrågans svar"), och N1 var redan löst 2026-09-17 (`#2491`, se
huvudrapporten § 1). Kvar i den frysta filens tabell utan känt kort, såvitt
jag sett i detta pass: inget av N1–N9 — hela "nu"-högen har alltså redan ett
spårningshem. `SE1`–`SE21` och `I1`–`I11` är INTE del av denna konvertering
(bekräftat: `TASK-450`s PRD-titel säger uttryckligen "N2–N9 + K1 b") och
förblir därför enbart i den frysta filen tills Marcus ger GO för "senare"-
högen också.

## Delfråga 4 — Vad menar Marcus med "interface"? (premiss 6 prövad)

Marcus egna ord är: *"alltid ha ett aktuellt 'interface' och aktuell
dokumentation."* Två läsningar är möjliga, och granskningen svarar olika på
dem.

**Läsning A — "interface" = en maskinläsbar karta över vad CI:s jobb
faktiskt gör** (det denna fil huvudsakligen adresserar). Ingen sådan karta
finns i dag som en LEVANDE artefakt; `01-inventering.json` är den närmaste
formen som finns, och den är, som visat ovan, en frusen ögonblicksbild utan
generator. Options-rymden nedan (särskilt B) adresserar denna läsning.

**Läsning B — "interface" i granskningens EGEN, tekniska betydelse**
(leverabel 10 § Fynd 8, "Modulens gränssnitt"). Där betyder ordet något helt
annat: skarven ett FRAMTIDA separat repo skulle behöva skriva mot om CI
lyftes ut till ett delat kit (`high-five-group/ci-kit`) — tre saker ett
NYTT konsumerande repo skriver (en `ci.yml` under 50 rader, en policy-fil
per grind, en `.grind-layout.conf`), allt annat kapslat. Citat, ordagrant:

> "Detta är den **skarv** (Pococks term: platsen där modulens gränssnitt
> ligger) jag föreslår. Allt ovanför skarven är konsumentens; allt under är
> kapslat."
> — `09-ci-som-ateranvandbar-djupmodul.md` rad 645–647

Den betydelsen gäller **återanvändning mellan REPON**, inte
**dokumentationens aktualitet inom ETT repo** — och den är dessutom
uttryckligen ett FÖRSLAG som inte är byggt, villkorat av "ett andra
produktrepo" (SE4). Den kan alltså inte vara det Marcus efterfrågade, för
det finns inget interface att hålla aktuellt än — bara ett förslag om ett
framtida.

**Slutsats:** premiss 6:s hypotes håller delvis. Leverabel 10 ANVÄNDER ordet
"gränssnitt", men i en annan mening än den Marcus frågan syftar på. Jag
adresserar därför läsning A som huvudfråga (den handlar om att hålla NUET
begripligt), och nämner läsning B som en äkta men senare-liggande, separat
fråga (att lyfta ut CI till flera repon) — de ska inte blandas ihop i ett
och samma beslut.

## Delfråga 5 — Vad säger branschledarna? (extern research, ett spår i taget)

### Spår 1 — Regenerera-och-diffa (Kubernetes-mönstret)

Kubernetes har två skript-familjer: `hack/update-*.sh` (regenererar en
artefakt ur källan) och `hack/verify-*.sh` (regenererar TILL en temp-katalog
och diffar mot det committade). Konkret exempel,
`kubernetes/community/hack/verify-generated-docs.sh`:

> "Do not manually edit sig-list.md or README.md files inside the sig
> folders. Instead make your changes to sigs.yaml, then run `make`"
> — [kubernetes/community, `hack/verify-generated-docs.sh`](https://github.com/kubernetes/community/blob/master/hack/verify-generated-docs.sh)
> (hämtat 2026-09-18)

Mönstret: EN källa (`sigs.yaml`), en genererad artefakt (`README.md`-filer),
en grind som fäller om de glidit isär. `kubernetes/test-infra` har samma
mönster för sin testmatris: generatorn körs, det committade jämförs, och
den genererade ytan är uttryckligen märkt "should not be edited by hand"
([config/jobs/README.md](https://github.com/kubernetes/test-infra/blob/master/config/jobs/README.md),
hämtat 2026-09-18, refererat via sökresultat — sidan är inte läst i sin
helhet).

**Relevans för oss:** vi har redan exakt detta mönster, en gång i CI
(`check-listparitet.sh`) och två utan CI-grind (`review:schema`,
`atlas`). Kubernetes-mönstret bekräftar formen, det introducerar inget nytt
för oss att bygga — det bekräftar att OM vi bygger en generator ska den
paras med en diff-grind, inte lämnas som ett "kör när du kommer ihåg"-läge
(vilket våra två o-grindade generatorer i dag faktiskt är).

### Spår 2 — Google, *Software Engineering at Google* kap. 10

> "At Google, we often attach 'freshness dates' to documentation. Such
> documents note the last time a document was reviewed, and metadata in the
> documentation set will send email reminders when the document hasn't been
> touched in, for example, three months."
>
> "Documentation is often so tightly coupled to code that it should, as
> much as possible, be treated as code" — med krav på källkontroll, tydligt
> ägarskap, och granskning vid ändring.
>
> "Documents without owners become stale and difficult to maintain."
> — [abseil.io/resources/swe-book/html/ch10.html](https://abseil.io/resources/swe-book/html/ch10.html)
> (hämtat 2026-09-18)

**Relevans för oss:** detta ÄR redan `ADR-100` §4 + `review_by`-kadensen +
ägar-deklarationsformen (§ Updates 2026-08-08 del B, `Äger/Kartlägger/Vid
konflikt vinner`). Google bekräftar att formen vi redan byggt är
branschledarpraxis — den saknar bara konsekvent TILLÄMPNING på granskningens
tolv filer (som aldrig lades i `FRONTMATTER_GOVERNING_DOCS`, och inte
behöver läggas dit — de är forskningsfiler, inte styrande dokument).

### Spår 3 — Diátaxis: referens vs förklaring

> "Reference material describes the machinery. It should be austere. One
> hardly reads reference material; one consults it."
>
> "the structure of the documentation should mirror the structure of the
> product" — och exemplifierar med auto-genererad API-dokumentation som
> "faithfully accurate to the code" per konstruktion.
> — [diataxis.fr/reference/](https://diataxis.fr/reference/) (hämtat 2026-09-18)

**Relevans för oss:** Diátaxis ger en namngiven boxindelning för det vi
redan gör intuitivt. `01-inventering.json` VILLE vara referens (fakta,
strukturerad, konsulterad snarare än läst) men bär i praktiken
förklarings-innehåll (`syfte`, `vad_kan_ga_fel`) som kräver tolkning — det
är därför den inte kan genereras mekaniskt. Ren referens (jobbnamn,
triggers, `needs`-graf) KAN mekaniseras; förklaring kan det inte. Detta är
skälet Option B nedan är begränsad till en SMAL delmängd av fälten.

### Spår 4 — ADR-praxis (Nygard)

Redan citerat i § Delfråga 1. Kompletterande status-modell:

> "A decision may be 'proposed' if the project stakeholders haven't agreed
> with it yet, or 'accepted' once it is agreed. If a later ADR changes or
> reverses a decision, it may be marked as 'deprecated' or 'superseded'
> with a reference to its replacement."
> — [cognitect.com/blog/2011/11/15/documenting-architecture-decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
> (hämtat 2026-09-18)

**Relevans för oss:** exakt mönstret `ADR-100` redan definierat för frysning
(§4) — supersedera, redigera aldrig i efterhand. Granskningens tolv filer
bör behandlas som "accepted" ögonblicksbilder som kan bli "superseded" av en
FRAMTIDA audit, aldrig redigeras för att "hålla jämna steg."

### Spår 5 — C4/Structurizr, arc42

> "Low-level diagrams contain a lot of detail, which tend to become obsolete
> fast and thus need a lot of maintenance to keep them up to date. To
> minimize these efforts, they should be generated from code automatically."
> (sammanfattat ur sökresultat kring Structurizr/arc42-kombinationen,
> hämtat 2026-09-18 — sidan är inte läst i sin helhet, märkning: **starkt
> indikerad, inte verifierad ordagrant**)

**Relevans för oss:** samma princip som Diátaxis, applicerad på diagram i
stället för prosa. Låg detaljnivå (vilka jobb finns, hur hänger de ihop) →
generera. Hög tolkningsnivå (varför byggdes detta, vad är avvägningen) →
handskrivet. `02-teknisk-arkitekturkarta.md`s mermaid-diagram (i
huvudrapporten, § 2) är precis den låg-detalj-typen som skulle må bäst av
att härledas ur `ci.yml` i stället för handritas — men ingen användare
efterfrågar det i dag (se § Vad som INTE ska byggas).

### Spår 6 — Backstage TechDocs

> "The point of TechDocs is co-location. Documentation lives in the same
> repo as the code, ships through the same pull requests, and inherits the
> same code review. That solves the staleness problem for internal
> engineering docs."
> (sammanfattat ur sökresultat, [backstage.io](https://backstage.io/docs/features/techdocs/),
> hämtat 2026-09-18 — märkning: **starkt indikerad**)

Men även TechDocs egen omvärld erkänner gränsen:

> "Even in organizations with strong documentation cultures, docs go stale
> because engineers prioritize building over documenting."

**Relevans för oss:** vi har redan colocation (`CLAUDE.md` i repo-roten,
samma PR-flöde som koden). Detta bekräftar att formen är rätt — det löser
INTE granskningens problem, för granskningens filer ligger redan i samma
repo och gick ändå ur synk med verkligheten (N8:s fyra exempel). Colocation
skyddar mot att dokumentation hamnar i ett SEPARAT system som glöms bort;
den skyddar inte mot att en siffer-prosa-rad blir fel efter en landning.

### Spår 7 — Cyrille Martraire, *Living Documentation*

> "The best place to store documentation is on the documented thing
> itself" — och boken förespråkar att "dramatically improve your
> documentation at minimal extra cost by using well-crafted artifacts and
> judicious automation."
> (sammanfattat ur sökresultat, hämtat 2026-09-18 — boken själv är inte
> läst, bara sekundära sammanfattningar. Märkning: **starkt indikerad**)

**Relevans för oss:** samma riktning som Diátaxis/C4 — automatisera det som
kan automatiseras, låt resten vara medveten prosa. Ingen ny princip för oss,
men ytterligare en oberoende röst i samma riktning stärker att
"generera-det-mekaniska, handskriv-det-tolkande" är konvergent
branschpraxis, inte en enskild skolas åsikt.

### Spår 8 — Ett konkret stort repo: hur håller DE sin egen CI dokumenterad?

**rustc-dev-guide** (rust-lang) håller CI-dokumentationen i en HELT SEPARAT,
handskriven guide (`rustc-dev-guide`, inte i huvudrepot) som beskriver
tvåstegs-CI:t (PR CI vs Merge CI) i förklarande prosa, med en pekare till
den maskinella källan (`src/ci/github-actions/jobs.yml`) för den som vill
ändra konfigurationen. Formen är alltså PRECIS uppdelningen Diátaxis
föreslår: `jobs.yml` är referensen (koden ÄR sanningen), dev-guide är
förklaringen (varför två CI-nivåer finns) — och guiden uppdateras separat,
av underhållare, inte auto-genererad.
([rustc-dev-guide.rust-lang.org](https://rustc-dev-guide.rust-lang.org/compiler-src.html),
[Rust Forge CI-doc](https://forge.rust-lang.org/infra/docs/rustc-ci.html),
hämtat 2026-09-18).

**vercel/next.js** håller sin test/CI-dokumentation i
`contributing/core/testing.md`, en handskriven fil i SAMMA repo som koden,
uppdaterad som en del av normala PR:er när testinfrastrukturen ändras —
ingen generator, ingen separat portal
([vercel/next.js, `contributing/core/testing.md`](https://github.com/vercel/next.js/blob/canary/contributing/core/testing.md),
hämtat 2026-09-18).

**Dom över spår 8:** ingen av de två stora, undersökta repona bygger en
maskinell "aktuellt interface"-yta över sin CI-arkitektur som helhet. Båda
litar på handskriven, samlokaliserad prosa (samma form vår `CLAUDE.md`
redan har) + en tunn, mekanisk generator bara för den SMALA delen som är
rent strukturell (Kubernetes' testmatris, `jobs.yml`). **Detta är ett
genuint tunt precedens-läge för en FULL genererad CI-karta specifikt** —
jag hittade inget stort repo som håller en komplett, alltid-aktuell,
maskinellt genererad förklaring av HELA sin CI-arkitektur (jobb + varför +
vad som kan gå fel). Branschmönstret är genomgående: **generera det smala
strukturella lagret, handskriv resten, frys det som är en engångsgranskning.**
Detta ska deklareras öppet — precedensrymden för "en komplett levande
CI-arkitekturkarta" är tunn, räkningen fejkas inte.

## Options-rymden

| | A — Frys allt + supersede-notiser | B — Genererad struktur-karta + regenerera-diffa-grind | C — Handskrivet levande arkitekturdok (befintligt, skärpt) | D — Wizard/interaktiv yta | E — Kombination (rekommenderad) |
|---|---|---|---|---|---|
| **Vad den ger** | Granskningen blir ofarlig att läsa senare | Ett smalt, alltid-sant faktalager (jobbnamn/triggers/`needs`/`blockerar_merge`) | Behåller dagens praxis, men med disciplin på `review_by`-bumpen | Gunilla-vänlig, klickbar genomgång av hela kedjan | Rätt lager på rätt plats |
| **Kostnad nu** | Näst intill noll — en banderoll per fil | Medel — kräver att definiera ett smalt schema och bygga generatorn ovanpå `verify-ci-parity.mjs` | Näst intill noll — mekanismen finns redan | Hög — kräver en yta, en design, en drift | A + delar av C nu, B+D senare |
| **Vad som ruttnar om inget görs** | Ingenting — filerna är redan sanna för sin dag | Struktur-fälten ruttnar i takt med `ci.yml`; grinden fångar det | `CLAUDE.md`s CI-avsnitt (1 244 rader totalt, verifierat `wc -l CLAUDE.md` i dag) fortsätter växa okontrollerat om `review_by`-bumpen blir en formalitet | En wizard som visar fel data ser MER auktoritativ ut än fel prosa — högre skaderisk vid rot, inte lägre | Se respektive kolumn |
| **Kräver i CI** | Inget nytt | En ny grind (diff mot regenererad fil) — motiverad ENDAST för det smala strukturfältet, aldrig för tolkande prosa | Inget nytt (grinden finns) | Inget i CI, men en ny yta att underhålla utanför CI | Inget nytt utöver B:s eventuella grind |
| **Möter I6 (avvisad "ny vakt mot inaktuell prosa")?** | Ja, fullt förenlig — bygger ingen ny vakt | Ja, förenlig **om** begränsad till strukturfält (fakta, ej tolkning) — bryter mot I6 om den utvidgas till att bedöma PROSANS mening | Fullt förenlig — inget nytt att bedöma | Förenlig i sig, men frestar till att OCKSÅ bygga en innehålls-vakt för wizardens data — samma fälla som I6 varnar för | Förenlig, samma gräns som B |
| **Möter `ADR-100`/`ADR-083`?** | Direkt tillämpning av `ADR-100` §4 | Kräver en NY grind — måste motiveras enligt `ADR-083`s bar (ett belagt fall, inte "gratis") | Direkt tillämpning av `ADR-100` §3 (läsregeln) + § Updates (mini-audit) | Riskerar `ADR-083`: en snygg yta som INTE är mekaniskt bunden till sanningen är prosa som ser ut som mekanism, i visuell form | Samma disciplin som A/C, B hålls smal |
| **Motsvarande branschprejudikat** | Nygard/ADR-praxis, Google freshness dates | Kubernetes `hack/verify-*.sh`, `test-infra`s genererade testmatris | rustc-dev-guide, vercel/next.js `testing.md`, vår egen `CLAUDE.md` | **Tunt** — inget av de undersökta storrepon bygger detta för hela CI:t; huvudrapportens §11 föreslår den som en OPRÖVAD idé, inte en observerad branschpraxis | — |

**Alternativ som INTE listas som en femte, egen väg:** "bygg en ny vakt som
läser prosans MENING och avgör om den ljuger" — redan uttömmande avgjord av
`ADR-083` §6 (avvisad för `permissions.*`-fallet, samma skäl generaliserar)
och `I6` i denna gransknings egen åtgärdsplan (avvisad för just DENNA
felklass, med mätning). Att föreslå den på nytt här utan ny evidens vore att
tyst riva ett beslut redan fattat med skäl — precis vad `ADR-100` §3 varnar
för. Jag har inte hittat någon ny mätning sedan 2026-09-17 som ändrar den
domen.

## Rekommendation

**Minsta första skiva (kan byggas som EN backlog-post):**

1. Lägg `ADR-100` §4-banderollen (Frusen-markör, frysdatum, pekare) överst
   i alla tolv leverabel-filer + `01-inventering.json`s header-kommentar
   (JSON stödjer inte kommentarer rakt av — lägg ett `_frusen`-metafält
   överst i arrayen, eller en syskon-README i katalogen; välj det som
   `npm run check:docs` inte fäller på). Kostnad: minuter, ingen kod.
2. **Redan i rörelse** för "nu"-högen (`TASK-450`/`.1`–`.9`, se ovan) —
   återstår bara att göra samma konvertering för `SE1`–`SE21` och
   `I`-listan (I-listan konverteras dock inte till kort alls, den är redan
   avslutad som "inte alls"; endast `SE`-posterna Marcus vill driva vidare
   behöver ett kort, i den takt han godkänner dem).
3. Boka in `CLAUDE.md`s nästa `review_by`-bump (2026-11-15) som tillfället
   att köra den mini-audit `ADR-100` § Updates redan definierat, med denna
   gransknings fynd som en av ingångarna (särskilt N8:s fyra konkreta
   drift-exempel). Ingen ny mekanism — bara att faktiskt GÖRA det som
   redan är beslutat.

**Explicit UTANFÖR denna skiva, och varför (dubbelriktad
över-engineering-vakt):**

- **Bygg INTE Option B (generatorn) nu.** Det finns i dag noll användare av
  en maskinläsbar CI-karta utöver denna enda granskning — och
  granskningen är redan levererad. `ADR-083`s bar kräver ett belagt fall
  eller en verklig avvägning, inte en hypotetisk framtida läsare. Om ett
  konkret behov uppstår (t.ex. review-agenten behöver strukturerad
  jobb-fakta för att bedöma en `ci.yml`-ändring) byggs den smala varianten
  DÅ, ovanpå `verify-ci-parity.mjs`s redan existerande YAML-parsning —
  aldrig från scratch.
- **Bygg INTE Option D (wizarden) nu**, trots att den matchar Marcus
  lärpreferens (wizard-format, `~/.claude/CLAUDE.md` § Lärpreferenser) och
  trots att huvudrapporten § 11 nämner den. Den kräver B:s datalager för
  att inte själv bli en ny, tystare källa till drift (en vacker yta som
  visar fel data är svårare att misstro än en ful markdown-tabell — högre
  skada, inte lägre). Huvudrapporten säger det själv: *"Föreslås, byggs
  inte här … inget beslut är fattat om att bygga det."* Den raden
  respekteras, den ändras inte av denna fil.
- **Bygg INTE en ny prosa-sanningsvakt.** Redan avgjort (I6, `ADR-083` §6),
  ingen ny evidens.
- **Ändra INTE `10-migrations-och-atgardsplan.md`s tabell i takt med att
  kort landar.** Det vore att återinföra exakt den felklass § Delfråga 3
  beskriver. Filen fryses; korten bär statusen.

## Öppna frågor till Marcus

1. **Delvis redan besvarad under skrivandet** — `TASK-450`/`.1`–`.9` visar
   att du redan gett GO för N2–N9 + K1 b. Kvarstående del av frågan:
   godkänner du samma mönster för `SE1`–`SE21` när/om de blir aktuella,
   så att `10-migrations-och-atgardsplan.md` kan frysas i sin helhet som
   facit för VARFÖR, utan att någon tabellrad i den förväntas hållas
   uppdaterad manuellt?
2. **Vill du att `ADR-100` amenderas** med en kort passage som säger att
   `docs/research/`-underkataloger av typen "djupgranskning" ärver
   frys-banderoll-standarden per default (i stället för att varje ny
   granskning behöva komma ihåg att fråga)? Eller räcker det att denna
   fil pekas på som prejudikat vid nästa granskning?
3. **Är det värt att bygga Option B:s smala generator** redan nu, som en
   liten separat skiva, OM den kan återanvända
   `verify-ci-parity.mjs`s befintliga YAML-parsning för i praktiken noll
   extra körningskostnad — eller ska den vänta på en konkret konsument
   (t.ex. review-agenten) som premissen i § Rekommendation föreslår?
4. **Ska `review:schema`- och `atlas`-generatorerna få en CI-diff-grind**
   (Kubernetes-mönstret, spår 1) nu när frågan ändå är uppe, eller är det
   en separat, egen fråga utan koppling till CI-dokumentationen? Jag
   flaggar det som ett sidofynd, inte en del av detta uppdrag.

## Osäkerheter och vad jag inte kunde belägga

- **C4/Structurizr-citatet (spår 5) och Cyrille Martraire-citatet
  (spår 7)** är hämtade ur sammanfattade sökresultat, inte ur en fullständig
  läsning av källsidan/boken. Märkta **starkt indikerad**, inte
  **verifierad**, i linje med repots egen märkningsdisciplin.
- **`kubernetes/test-infra`s exakta "should not be edited by hand"-formulering**
  kommer ur ett sökresultats sammandrag, inte en direkt sidhämtning — jag
  har inte själv öppnat filen och läst raden ordagrant.
- **Jag har inte läst leverabel 3, 4, 5, 6, 7, 8 eller 12 i sin helhet** —
  bara de avsnitt huvudrapporten redan destillerat. Om något av dem
  innehåller ett direkt motsägande fynd om dokumentationens livslängd har
  jag inte sett det. Given hur konsekvent huvudrapportens destillat är med
  de avsnitt jag läst i original (leverabel 10 § Fynd 8, leverabel 11
  § N8/I6) bedömer jag risken som låg, men den är inte noll.
- **Om ett stort öppet repo faktiskt HAR byggt en komplett, alltid-aktuell,
  genererad karta över hela sin CI-arkitektur** (inte bara testmatrisen)
  har jag inte hittat det i denna sökning. Frånvaro av bevis är inte bevis
  för frånvaro — men jag har sökt riktat (fyra repo-kandidater ur
  uppdraget, plus fria sökningar) och inte funnit ett. Precedensrymden för
  just den formen deklareras därför tunn, inte obefintlig.
- **Jag har inte räknat om huvudrapportens egna tal** (25 min, 51/52
  nätter, 367 poster) — förutom `367`, som jag verifierade själv i dag
  (`python3 -c "import json; …"` mot `01-inventering.json`, `len(data) ==
  367`). Övriga tal är ÄRVDA från granskningen, inte omprövade av mig.

## Källor

**Repo, verifierat av mig i dag (2026-09-18):**

- `docs/decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md` — läst i sin helhet
- `docs/decisions/ADR-083-prosa-som-pastar-mekanism.md` — läst i sin helhet
- `docs/research/ci-djupgranskning-2026-09-17/00-huvudrapport.md` — läst i sin helhet
- `docs/research/ci-djupgranskning-2026-09-17/09-ci-som-ateranvandbar-djupmodul.md` §Fynd 8 (rad 597–762) — läst i sin helhet
- `docs/research/ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md` § N8 (rad 649–712) och § "Inte alls" (rad 970–990) — läst i sin helhet
- `docs/research/ci-djupgranskning-2026-09-17/01-fil-och-komponentinventering.md` rad 55–84 (§ "Hur inventeringen läses"), 870–902 (§ Metod, egna kommandon) — läst
- `docs/research/ci-djupgranskning-2026-09-17/01-inventering.json` — struktur inspekterad, `len() == 367` verifierat med `python3`
- `CLAUDE.md` rad 1–6 (frontmatter, `review_by: 2026-11-15`) och `wc -l CLAUDE.md` = 1244, båda körda i dag
- `scripts/check-frontmatter.sh`, `.frontmatter-policy.conf` — grep:ade för `review_by`/`FRONTMATTER_GOVERNING_DOCS`
- `scripts/check-listparitet.sh` — läst rad 1–60; `ci.yml:817` bekräftar CI-wiring (`grep -n "check-listparitet" .github/workflows/ci.yml`)
- `scripts/verify-ci-parity.mjs` — läst rad 1–80
- `scripts/generera-review-schema.mjs`, `scripts/verifiera-farg-atlas.mjs` — läst headers; `grep -n "review:schema\|farg-atlas" .github/workflows/*.yml` gav noll träffar, bekräftar att ingen är CI-diff-grindad
- `ls docs/research/` — genomsökt filnamnslista för överlapp; ingen tidigare fil täcker denna fråga
- `docs/decisions/` — `grep -rl "CI-djupgranskning\|granskningens leverabler"` gav noll träffar; inget tidigare beslut om denna specifika fråga

**Externa källor, hämtade 2026-09-18:**

- [Documenting Architecture Decisions (Nygard, 2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — supersede-mönstret, statusmodellen
- [Software Engineering at Google, kap. 10 — Documentation](https://abseil.io/resources/swe-book/html/ch10.html) — freshness dates, ägarskap, docs-as-code
- [Diátaxis — Reference](https://diataxis.fr/reference/) — referens vs förklaring, auto-genererad dokumentation
- [kubernetes/community — verify-generated-docs.sh](https://github.com/kubernetes/community/blob/master/hack/verify-generated-docs.sh) — regenerera-och-diffa, ordagrant citat
- [kubernetes/test-infra — config/jobs/README.md](https://github.com/kubernetes/test-infra/blob/master/config/jobs/README.md) — genererade jobbfiler, "should not be edited by hand" (sekundärkälla, ej ordagrant verifierad)
- [rustc-dev-guide — compiler-src.html](https://rustc-dev-guide.rust-lang.org/compiler-src.html), [Rust Forge — rustc-ci](https://forge.rust-lang.org/infra/docs/rustc-ci.html) — separat handskriven levande guide
- [vercel/next.js — contributing/core/testing.md](https://github.com/vercel/next.js/blob/canary/contributing/core/testing.md) — samlokaliserad handskriven testdokumentation
- [Backstage — TechDocs](https://backstage.io/docs/features/techdocs/) — docs-as-code, colocation (sekundärkälla)
- Cyrille Martraire, *Living Documentation: Continuous Knowledge Sharing by Design* (2019) — principer citerade ur sekundära sammanfattningar, boken ej läst i original
- C4-model/arc42/Structurizr-kombinationen — principer citerade ur sekundära sammanfattningar, ej ordagrant verifierade

**Gren och commit:** arbetsträdet startade på `docs/s126-resume-1`
(`81a1d55c`) men gick under skrivandet över till `docs/s126-nu-hogen-kort`
(en parallell process bytte grenen i samma arbetsträd, se § "Utveckling
under skrivandet"). Vid leverans: `git branch --show-current` =
`docs/s126-nu-hogen-kort`, `git log -1 --format='%H %s'` = `41febc5e`
("docs(backlog): TASK-450.1–450.9 — nu-högens skivor …"). Denna fil själv
är okommitterad (`git status --short` visar den som `??`).
