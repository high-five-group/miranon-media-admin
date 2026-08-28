# ADR-052: `lifecycle:` — dedikerat livscykel-fält, ortogonalt mot `status:`

- Status: Accepted (Session 20 — 2026-06-14; ratificerad av Marcus i direktion samma session, byggs omedelbart)
- Datum: 2026-06-14
- Fas: Session 20 — lifecycle-fundament (process-fundament, ingen byggfas)

## Kontext

Livscykel-tillstånd — är en session/fas `active`, `paused` eller `closed`? — uttrycks
idag enbart i dok-prosa, på ad-hoc-plats med inkonsekvent vokabulär: session 18 sa
"PAUSLÄGE/Pausorsak"; session 19 begravde "PÅGÅENDE" i en "Lessons + status"-rubrik.
Det är samma rotorsak som ADR-051 åtgärdade för VERB-sidan (A1/A2-forken vid
återupptagning). ADR-051 beslut 4 sätter redan "sessionsdokets status → PAUSED" — men
"PAUSED" levde bara i prosa, inte i ett O(1)-läsbart fält. L119 generaliserar
mönstret: en implicit tillstånds-axel fylls av närmaste grannstruktur och bär dess
semantik som bieffekt. Marcus pushback (2026-06-13/14): livscykel hör i ett dedikerat
fält, inte i kropp.

ADR-030 etablerade frontmatter-konventionen med `status:` (draft/stable/deprecated,
validerat av check-frontmatter.sh Check 4) — ett DOKUMENTKVALITETS-fält. Livscykel är
en OBEROENDE axel: ett dok kan vara `status: stable` OCH `lifecycle: paused` samtidigt.
Att lägga livscykel-värden i status-enumet vore ett kategori-fel — sammanslagning av
två ortogonala tillstånds-axlar i ett fält.

## Beslut

### 1. Dedikerat fält `lifecycle:`, enum `active` / `paused` / `closed`

Gemena strängar, konsekvent med `status:`-enumets format. Semantik: `active` =
sessionens arbete pågår eller är öppet (nyfött eller återupptaget); `paused` = durabelt
parkerat utan completion (ADR-051-paus); `closed` = avslutat (session-end). Tre
tillstånd, fyra verb: start/create-session-doc → `active`; paus → `paused`; resume →
`active`; end → `closed`.

### 2. Ortogonal mot `status:` — `status:` förblir orört

`status:` (ADR-030, Check 4) är dokumentKVALITET (draft/stable/deprecated). `lifecycle:`
är arbets-/sessions-TILLSTÅND. Axlarna korsar fritt: ett arkiverat sessionsdok är
`status: stable` + `lifecycle: closed`; ett pausat är `status: stable` +
`lifecycle: paused`. Livscykel-värden läggs ALDRIG i status-enumet, och vice versa.

### 3. Skill-ägt underhåll

Fältet sätts uteslutande av lifecycle-skillsen: `session-start` / `create-session-doc`
föder `active`; `session-paus` → `paused`; `session-resume` → `active`; `session-end`
→ `closed`. Manuell prosa-redigering av livscykel utgår — fältet blir sanningskällan.
Utan skill-ägarskap flyttas driften bara från kropp till fält (skuld, ej tillgång).

### 4. Validering via dedikerad lätt grind, SKILD från frontmatter-governing-regimen

`lifecycle:` valideras INTE genom att dra sessionsdok in i FRONTMATTER_GOVERNING_DOCS
(vars fem checkar inkluderar `review_by > today` och `updated`-git-match). Skälet:
sessionsdok är immutabla efter arkivering (ADR-023 + ADR-041-korrigeringen);
`review_by`-checken skulle fälla CI permanent på åldrande arkiverade dok som inte får
lagas. Istället införs en separat lätt grind som validerar (a) `lifecycle ∈
{active, paused, closed}` och (b) konsistens fält↔kropp (flagga t.ex. `active` på ett
dok med PAUS-rubrik). Egen axel → egen grind — ortogonalitet på mekanism-nivå.
Implementation: efterföljande inkrement i Session 20.

### 5. Applicerings-population: sessionsdok nu; schema-on-read för övriga

Fältet definieras generellt men appliceras konkret på sessionsdok i denna session — det
är där livscykel-driften uppstod. Befintliga dok UTAN fältet förblir giltiga (additivt,
valfritt attribut; ingen big-bang-migrering). Nya sessionsdok föds med fältet; sessions
18/19 retro-appliceras. Övriga dok-populationer (scope-frön, governing-dok) kan adoptera
fältet additivt senare — de tvingas inte nu.

### 6. Övergångsregel för dok utan fältet

Frånvaro av `lifecycle:` betyder "ej livscykel-spårat" — giltigt, inte ett fel. Grinden
(beslut 4) validerar endast dok SOM BÄR fältet; den kräver inte fältets närvaro på
godtyckliga dok. En läsare som inte finner fältet faller tillbaka på kropps-prosan, som
idag. Detta är schema-on-read: schemat utvidgas, läsningen degraderar grasiöst.

## Alternativ som övervägdes

- **Livscykel-värden i `status:`-enumet.** Förkastat: kategori-fel — sammanslår två
  ortogonala axlar (kvalitet vs tillstånd); ett dok kan vara `stable` OCH `paused`.
  Bryter ADR-030:s status-semantik.
- **Sessionsdok in i FRONTMATTER_GOVERNING_DOCS + ny check.** Förkastat: governing-
  regimens `review_by`/`updated`-checkar fäller immutabla arkiverade sessionsdok över
  tid (ADR-023-immutabilitet, ej lagbart) — latent grind-skuld inbyggd från dag ett.
  Den dedikerade lätta grinden undviker det.
- **Ren konvention, ingen grind.** Förkastat: ett oläst/ovaliderat fält driftar
  (felstavning, fel enum-värde) — passiv struktur, exakt det fältet ska bota.
- **Livscykel kvar enbart i prosa (status quo).** Förkastat: A1/A2-forkens rotorsak
  (L119); Marcus pushback.

## Konsekvenser

**Positivt:** livscykel blir O(1)-läsbart i frontmatter; skill-ägt → drift-fritt;
ortogonaliteten mot `status:` bevarad; additivt fält → ingen migrering, befintliga dok
orörda.

**Negativt / risker:** nytt fält + ny grind = nya rörliga delar (mitigeras: grinden är
minimal — enum + konsistens, ingen tung governing-regim); fältet blir tillgång först när
skill-editsen landar (efterföljande inkrement) — tills dess är det en deklaration utan
ägare; applicering på övriga dok-populationer kvarstår som framtida, frivilligt val.

**Reversibelt:** fält, grind och skill-edits är repo-källade projektioner.

## Forskningsgrund

- Veeva Vault (platform.veevavault.help — Document Lifecycles / Lifecycle States):
  branschstandard-DMS modellerar livscykel-states som förstaklass-konstruktion, skild
  från en separat kvalitets/status-flagga.
- InfoWorld (2025-11, "separating metadata and content"): nytt metadata-attribut läggs
  additivt/valfritt (schema-on-read) — befintliga poster fortsätter fungera utan det.
- Statechart orthogonal regions: två oberoende tillstånds-axlar modelleras i separata
  regioner, ej hopslagna i ett tillstånd.
- Intern: ADR-030 (frontmatter-konvention + status-enum), ADR-051 (paus-verb + beslut 4
  innehållsgräns), L119 (asymmetrisk/implicit axel = drift-källa).

## Relaterade ADR:er

- ADR-030 (frontmatter-konvention + status-enum) — `lifecycle:` är ett ortogonalt
  komplement; `status:` lämnas orört.
- ADR-051 (session-paus) — beslut 4 satte "status → PAUSED" i prosa; ADR-052
  formaliserar det till ett fält. Skill-ägarskapet (beslut 3) speglar ADR-051:s
  skill-arkitektur.
- ADR-043 (lifecycle-skill-arkitektur) — fältet är den durabla projektionen av
  lifecycle-verbens tillstånd.
- ADR-023 (sessions-arkivering) — immutabiliteten som motiverar beslut 4:s
  grind-separation.
- ADR-039 (ADR-räkning) — rot-README-räknaren bumpas 51→52 vid denna ADR:s landning.

## Updates

### 2026-08-28 (S112 resume 2) — andra vägen till `closed`: STÄNGNING VIA SCOPE-ÖVERFÖRING

Beslut 1–6 är oförändrade. Denna post utvidgar **beslut 3** (skill-ägt
underhåll) med en femte, namngiven skrivare av `lifecycle:`-fältet, och
namnger den avvägning utvidgningen kostar.

**Kontexten — sex dok som ingen ceremoni kunde nå.** Beslut 3 gav fältet fyra
skrivare, en per lifecycle-verb: `session-start` → `active`, `session-paus` →
`paused`, `session-resume` → `active`, `session-end` → `closed`. Formen
förutsätter att varje `paused` dok förr eller senare får en resume och därefter
ett end. Den förutsättningen höll inte: 2026-08-28 stod sex dok `paused` — S92
(2026-07-27), S96, S98, S99, S101 och S107 — där merparten av scopet i
verkligheten var UTFÖRT av senare sessioner, och resten var Marcus-ägda beslut
som ingen resume kan avsluta åt honom. Vägen till `closed` gick genom sex
`session-resume` → `session-end`-ceremonier vars enda funktion hade varit att
flytta ett fält, eftersom det arbete `session-end` finns för att finalisera
(BUILD-LOG, lessons-skörd, arkivering) inte kunde göras av en session vars
återstående scope var någon annans beslut.

Det gav ett tillstånd utan bevakare i samma familj som `T108`/`T112`: dok som
står `paused` för evigt, vars öppna punkter ingen läser, och vars antal ökar
med varje session som pausas i stället för att stängas. Alternativet — att
tyst sätta `closed` på ett dok med öppet scope — hade varit exakt den drift
hela ADR-052 finns för att förhindra: ett fält som påstår något kroppen inte
bär.

Marcus order, verbatim: *"Alla sessionsdok som inte är stängda ännu är det av
en anledning, det finns något i dess scope som inte är klart som jag vill/ville
få klart. Men en idé kanske skulle vara att samla ihop scope-punkterna till
ETT nytt sessionsdok, som kan arbeta med dem senare"* + *"Då är det ju viktigt
med referenser, så man alltid kan hitta källan/källorna."*

**Beslutet.** Ett pausat sessionsdok får sättas `lifecycle: closed` UTAN
`session-end`, om och endast om alla tre villkoren håller samtidigt:

1. **Varje scope-punkt i doket är klassad** — antingen **K** (klar, med belägg
   mätt mot disk, backlog eller git; ett påstående utan mätning duger inte)
   eller **Ö** (öppen, med överföring till ett NAMNGIVET kort).
2. **Doket bär en sektion `## Stängd via scope-överföring (<datum>)`** sist i
   kroppen, med K/Ö-tabellen i sin helhet och en pekare till mottagarkortet.
   Sektionen är dokets kvitto: den som läser doket ser vad som bedömdes klart,
   på vilket belägg, och vart resten tog vägen.
3. **Mottagarkortet pekar tillbaka på doket.** Referensen går i BÅDA
   riktningarna — ett kort som samlar rester utan spårbar källa är precis det
   Marcus referenskrav förbjuder.

Paus-markören i kroppen bryts samtidigt till historik-form (`## Paushistorik —
…`), av samma skäl som vid resume: `scripts/check-lifecycle.sh` är
prefix-förankrad på `^## PAUSLÄGE — Session <N> pausad` och fäller `closed` +
kvarstående prefix. Grinden ändras INTE — formen håller sig innanför den.

**Konsekvenser.**

- **Positivt:** en pausad session som i praktiken är slut kan avslutas ärligt;
  restpunkterna får en bevakad hemvist i backlog-substratet i stället för att
  ligga i ett dok ingen öppnar; K-klassningens beläggkrav gör stängningen
  granskningsbar i efterhand. Beslut 1, 2, 4, 5 och 6 är orörda, och grinden
  behöver ingen ändring.
- **Priset, öppet namngivet:** formen ger **ingen BUILD-LOG-post och ingen
  lessons-skörd per session**. Det är precis vad `session-end` bär och
  scope-överföringen inte gör. Konsekvensen är att lessons-kandidaterna i de
  överförda doken måste skördas på annan väg — de bokförs som Ö-punkter på
  mottagarkortet och skördas i den separata fragment-kadensen
  (`tasks/lessons.d/`, 121 fragment vid denna posts datum). En session som
  stängs så här får alltså ingen egen rad i byggets narrativ. Avvägningen
  accepteras medvetet: sex ceremonier utan innehåll är ett högre pris än sex
  saknade BUILD-LOG-poster för sessioner vars arbete redan är bokfört i de
  PR:er och kort de producerade.
- **Missbruksytan, och varför den är smal:** formen kan i princip användas för
  att stänga en session som fortfarande arbetar. Villkor 1 gör det dyrt —
  varje punkt måste klassas med belägg — och villkor 2 gör det synligt, men
  ingen MEKANISM hindrar det. Detta är en form, inte en grind
  ([ADR-083](ADR-083-prosa-som-pastar-mekanism.md)-disciplinen: skriv aldrig om
  detta stycke till att påstå motsatsen). `check-pausade-sessioner.sh` fångar
  det omvända felet (ett dok som PÅSTÅR paus medan arbete landar) och berörs
  inte — ett stängt dok faller helt utanför dess population.
- **Fönstereffekt:** ett dok som blir `closed` blir därmed arkiv-kandidat i
  ADR-099:s rullande fönster. Stängningen och arkiveringen är SKILDA
  handlingar; nattgrinden `check-sessionsdok-fonster.sh` pekar ut kandidaterna
  när de uppstår.

**Första tillämpning:** S92, S96, S98, S99, S101 och S107, överförda till
`TASK-332` (*PRD: Restsamlingen*) — 24 K-punkter med belägg, 55 Ö-punkter med
referens. Beslutet att formen ska vara ett PRD-kort och inte ett för-skapat
sessionsdok togs i samma andetag och står i
`tasks/sessions/2026-08-24-session-112.md` § "Marcus order mitt i resumen"
beslut 1: ett för-skapat dok bryter ADR-043 beslut 4 (dok föds vid
sessionsstart).
