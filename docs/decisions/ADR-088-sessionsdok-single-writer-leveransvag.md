# ADR-088: Sessionsdokets berättelse har EN skrivare — single-writer per era med definierad leveransväg

> **Nummer-not (2026-08-01):** ADR-087 är tagen av en parallell landning
> (`Stop`-vakten, `TASK-113`, PR #551) som vid denna ADR:s minting stod öppen
> men ännu inte landad. Numret här är nästa lediga EFTER senast synliga —
> disk + öppna PR:er — per samma försiktighetsregel som kortnumren
> (CLAUDE.md § Kortnummer). Landar #551 aldrig blir 087 en lucka; det bokförs
> hellre öppet än att två ADR:er slåss om samma nummer.

- Status: Accepted (Marcus GO 2026-08-01, klass A)
- Datum: 2026-08-01
- Fas: post-S91 (T109-kodifiering)

> **Om beslutsvägen — bokförd öppet.** Options-rymden kartlades i ett
> research-pass 2026-08-01
> ([sessionsdok-tva-aktorer-optionsrymd-2026-08-01.md](../research/sessionsdok-tva-aktorer-optionsrymd-2026-08-01.md));
> Marcus gav GO (klass A) för att kodifiera dess rekommendation (a).
> ADR-bar-prövningen och formvalet gjordes av bygg-agenten under den
> delegationen. Noteras av samma skäl som i
> [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md),
> [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md) och
> [ADR-085](ADR-085-hubbens-lessons-i-volymer.md): en läsare ska kunna se vem
> som vägde, inte bara vad som beslutades.

## Kontext

`T109` registrerades 2026-07-29 (S91) på Marcus fråga: *"Vore ju nice om det
funkade att två aktörer jobbade i samma sessionsdok."* Det kördes skarpt samma
dag — S91 hade två sessioner igång samtidigt — och det fungerade, men bara för
att partitionen sattes för hand: den avgående aktören släppte sessionsdoket
uttryckligen. Där partitionen INTE var utsatt brast det (scratchpad-kollision,
handsekvenserad restlista, en avstådd kortnummer-serie, `#446`/`#447`-låsningen
på samma kortfil).

Research-passet omverifierade **fyra strukturella hinder** mot disk: (1)
`lifecycle:` bär ETT värde — `scripts/check-lifecycle.sh` extraherar exakt ett
gemener-ord (`sed -E 's/^lifecycle:[[:space:]]*([a-z]+).*/\1/'`); (2)
PAUSLÄGE-regexen är prefix-förankrad
(`grep -qE '^## PAUSLÄGE — Session [0-9]+ pausad'`) och kan inte uttrycka två
oberoende pausande aktörer; (3) Del-numreringen är EN sekventiell serie med en
berättare (S91: Del 1–38); (4) paus/resume-verben är singulära — en session
parkeras som helhet.

**Mätningen skärpte hindren** (tre fixturfall mot `check-lifecycle.sh`,
2026-08-01): två PAUSLÄGE-markörer vid enhetligt tillstånd passerar **av en
slump** (exit 0); blandat aktörstillstånd (`active` + kvarstående markör) är
strukturellt outtryckbart (exit 1); och ett hypotetiskt tvåvärdes-fält
(`lifecycle: active, paused`) avvisas INTE — extraktionen tar första ordet och
**kastar resten tyst** (exit 0). Det sista är fail-open i exakt den riktning en
två-aktörs-form behöver skydd.

Options-rymden prövade fem former (a)–(e). Ingen granskad branschledare löser
motsvarande problem genom att göra sin ordnade berättelse flerskrivbar; den
avgörande delfrågan är inte "hur får två aktörer plats i doket" utan "**var
landar den andra aktörens berättelse, och vem syntetiserar**".

## Beslut

### 1. Sessionsdoket är single-writer per era

Sessionsdokets ordnade berättelse (`tasks/sessions/`) har **EN skrivare:
orkestreraren** — den aktör som äger sessionens era. Ingen annan aktör (agent,
parallell session, framtida routine) rör `tasks/sessions/` direkt. Detta är
dagens fungerande praxis (S91:s handpartition + `bygg-agent`-definitionens
leverera-via-PR-form) upphöjd till regel; kostnaden är noll — ingen skript-
eller skill-ändring.

### 2. Leveransvägen är definierad — det som skiljer regeln från ett naket förbud

Varje annan aktör landar sin berättelse i en artefakt den äger, och
orkestreraren syntetiserar in den i Del-serien:

- **Agent-slutrapporter** → orkestrerarens Del-syntes (rapporten är
  returvärdet; doket är orkestrerarens).
- **Lärdoms-fragment** → `tasks/lessons.d/` (nummerlösa, per
  [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md); nummer vid landning).
- **Oväntat/deferat** → tråd-registret (`tasks/threads/`, triage per
  [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md)).
- **Kod och bokföring** → PR via merge-kön (ADR-076).

Option (e) — förbud UTAN leveransväg — förkastas uttryckligen: det lämnar
exakt det vakuum S91 fyllde med handpåläggning, och ett förbud i prosa utan
definierad väg är den felklass
[ADR-083](ADR-083-prosa-som-pastar-mekanism.md) mintades mot.

### 3. Regeln är PROSA, inte mekanism — öppet deklarerat

Ingen grind detekterar en andra skrivare i skriv-ögonblicket (två grenar som
rör samma sessionsdok-fil i överlappande fönster är detekterbara i efterhand,
inte vid skrivning). Det som skyddar är indirekt och fanns redan:
`check-lifecycle.sh` fäller fält↔kropp-inkonsistens per fil, merge-kön
serialiserar landningar, och agentdefinitionen styr byggagenter mot PR +
rapport. Per ADR-083: en regel som är prosa ska heta prosa.

### 4. Villkor för varje framtida `lifecycle:`-utbyggnad: strikt extraktion FÖRST

Ett tvåvärdes-fält halveras i dag **tyst** (mätningens fall 3). Därför: varje
framtida utbyggnad av `lifecycle:`-fältet — eller annan ändring som vidgar vad
fältet kan bära — måste FÖRST göra extraktionen i `scripts/check-lifecycle.sh`
strikt (avvisa allt som inte är exakt ett enum-ord), annars är utbyggnaden
fail-open från dag ett. Villkoret är sekvensering, inte ett bygge nu:
[ADR-052](ADR-052-lifecycle-frontmatter-falt.md):s fält och grind står orörda.

### 5. Avgränsningar — durabelt bokförda så de inte återföreslås eller glöms

- **Ingen lease byggs** (option d). Mekanismen saknar substrat: repo-filer har
  inga lås; en lease-fil i git är prosa + konvention tills en medlare prövar
  varje skrivning, och vår enda medlare (merge-kön) serialiserar först vid
  landning. Mot-precedenten är direkt på vår aktörsklass: Cursor rapporterar i
  förstapartskälla att *"Agents would hold locks for too long, or forget to
  release them entirely. Even when locking worked correctly, it became a
  bottleneck"*. Anthropic bygger fil-lås endast i verktygets egen store
  (`~/.claude/tasks/`), aldrig i repot.
- **Option (c) — stämplade fragment + Del-syntes — pilotas FÖRST när
  T111-vägen (routine + interaktiv i samma era) blir aktuell.** Formen är
  husets egen `lessons.d`-mekanism tillämpad på sessionsberättelsen och
  rymdens starkaste förstärkning av (a) — men syntes-kvaliteten är obelagd,
  så en minimal pilot (en routine, en era, en syntes) körs innan formen
  ADR:as. Bärs av `T111`, inte av denna ADR.
- **Två distinkta scope är TVÅ SESSIONER, inte en delad era** (option b är
  sessions-svaret): ADR-051-distinktionen + T67-formen (varje session sitt
  eget dok) gäller. (b) inom EN era skapar i praktiken två delsessioner och
  flyttar syntes-problemet till arkiveringen.

## Precedent

Fem oberoende domäner ger samma svar — en skrivare per ordnad serie,
per-aktör-ytor för råmaterialet, en utpekad syntesroll. Citat ur
research-passet (primärkällor lästa där, ej omhämtade här):

- **Raft** gör single-writer till designprincip: *"Strong leader: … log
  entries only flow from the leader to other servers"* (Ongaro & Ousterhout).
- **Kafka** ger totalordning per partition: *"any consumer of a given
  topic-partition will always read that partition's events in exactly the
  same order as they were written"* — fler skrivare med bevarad ordning får
  var sin partition.
- **Google SRE** lägger journalen hos EN roll: *"The incident commander's
  most important responsibility is to keep a living incident document."*
- **PagerDuty** renodlar skrivarrollen: *"A Scribe documents the timeline of
  an incident as it progresses"* — responders levererar via ett stämplat
  händelseflöde, scriben syntetiserar.
- **Git-bokens integration-manager:** *"each developer has write access to
  their own public repository and read access to everyone else's"* — EN
  integratör äger den kanoniska historiken. Vårt PR + merge-kö-flöde är redan
  denna form för kod.
- **Anthropics agent-teams-dokumentation** föreskriver fil-ägande-partition:
  *"Avoid file conflicts. … Break the work so each teammate owns a different
  set of files."*

**Ärligt deklarerat:** ingen precedent hittades för två skrivare i SAMMA
markdown-berättelse i git — frånvaro av funnen precedent, inte bevis på att
formen inte existerar. Precedent-rymden för exakt vår artefaktklass
(forensiskt sessionsnarrativ i versionshanterad markdown) är genuint tunn;
klasserna ovan är analogier, öppet deklarerade som sådana.

## Alternativ som övervägdes

- **(b) per-aktör-filer inom en era.** Rätt svar på en annan fråga (två
  sessioner — T67-formen); inom EN era odefinierad aggregat-semantik ("vad är
  sessionens tillstånd när A är `active` och B `paused`?") + måttlig–hög
  grind-/skill-kostnad. Bokförd som sessions-fråga i beslut 5.
- **(c) fragment + syntes.** Starkaste förstärkningen av (a); deferrad till
  T111-pilot per beslut 5 — syntesen ÄR (a) igen, och berättelsekvaliteten
  kräver fortfarande sin berättare.
- **(d) lås/lease.** Förkastad: saknar substrat hos oss (prosa som påstår
  mekanism), och har en branschledares uppmätta haveri emot sig. Kubernetes
  Leases fungerar för att API-servern medlar varje uppdatering — vi har ingen
  motsvarande medlare i skriv-ögonblicket.
- **(e) förbud utan leveransväg.** Förkastad: (a) minus det som gör (a)
  hållbar; se beslut 2.
- **OT/CRDT-substrat (Google Docs/Yjs-klassen).** Aldrig ett alternativ på
  allvar: garantin bor i datastrukturen, inte i filformatet, och bytet skulle
  offra hela filartefakt-kontinuiteten (git-historik, grindar, arkiv) mot ett
  realtidssubstrat — kostnad utan proportion mot behovet.

## Konsekvenser

**Positiva:** dagens fungerande praxis är nu regel med definierad leveransväg
— nästa aktörsklass (T111-routines, parallella klass A-agenter) möter en
uttalad form i stället för ett vakuum · alla fyra strukturella hinder förblir
korrekta och orörda · kostnaden är noll (ingen skript-, skill- eller
grindändring) · fält-utbyggnadens fail-open-fälla är bokförd som villkor
INNAN någon bygger.

**Negativa / öppet accepterat:** orkestrerarens kontext bär
inbaknings-arbetet — i spänning med T111:s spår att delegera tung läsning ·
i routine-scenariot finns ingen orkestrerare i realtid, så routinens
berättelse väntar i sin artefakt tills nästa interaktiva resume bakar in den
(latens, men ingen kollision) · regeln är prosa och kan brytas; skyddet är
indirekt (beslut 3).

## Relaterat

- [Research-passet](../research/sessionsdok-tva-aktorer-optionsrymd-2026-08-01.md)
  — options-rymden, mätningen, käll-citaten (specen för denna ADR)
- [ADR-051](ADR-051-session-paus-lifecycle-verb.md) +
  [ADR-052](ADR-052-lifecycle-frontmatter-falt.md) — verben och fältet vars
  singularis-form är hinder 1/2/4; ADR-052:s grind bär beslut 4:s villkor
- [ADR-053](ADR-053-trad-arkitektur-forensisk-lasbarhet-triage.md) —
  tråd-registret som leveransväg för det oväntade
- [ADR-081](ADR-081-nummer-tilldelas-vid-landning.md) — fragment-vägen som
  leveransväg för lärdomar, och mallen för option (c)-piloten
- [ADR-083](ADR-083-prosa-som-pastar-mekanism.md) — ärlighetskravet beslut 3
  lyder under
- `T109` (tråden, stängd med denna ADR) · `T111` (bär (c)-piloten) · `T67`
  (två-sessioners-formen)
