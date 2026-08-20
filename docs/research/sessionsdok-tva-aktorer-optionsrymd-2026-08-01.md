---
owner: marcus803
updated: 2026-08-01
review_by: 2027-02-01
status: stable
---

# Kan sessionsdok-formen bära två samtidiga aktörer? Options-rymden (Code, 2026-08-01)

> **Proveniens:** avgränsat research-pass för tråd `T109`, 2026-08-01. Trådkartan
> ([S91-tradkarta § T109](../../tasks/threads/S91-tradkarta-2026-07-31.md)) bokför
> att fyra strukturella hinder är verifierade mot disk men att options-rymden
> aldrig är kartlagd — det är gapet detta pass stänger. **Passet beslutar
> ingenting**: kartläggning och värdering; beslutet är grillnings-/ADR-stoff.
> Ingen kod, ingen ADR och inget kort rört — enda leveransen är denna fil.

## Frågan, ordagrant

> Kan sessionsdok-formen bära två samtidiga aktörer — och hur ser
> options-rymden ut?

## Kort svar

**Nej — inte som formen ser ut, och branschmönstret säger att den inte heller
bör byggas om till att göra det.** Alla granskade system som håller en **ordnad
berättelse** — Rafts replikerade logg, Kafkas partition, PagerDutys
incident-tidslinje, gits kanoniska historik — löser samtidighet genom **exakt en
skrivare per ordnad serie**, aldrig genom att lära serien ta emot två. Samtidig
redigering på riktigt (Google Docs, Yjs) kräver ett OT-/CRDT-substrat som
markdown-i-git inte är. Options-rymden landar därför inte i "gör doket
flerskrivbart" utan i **var den andra aktörens berättelse landar**: (a)
single-writer med definierad leveransväg är dagens form och har starkast
precedent; (c) stämplade fragment + syntes vid landning är den naturliga
förstärkningen när aktörerna blir fler eller autonoma — och är samma form som
repots egen `lessons.d`-mekanism (ADR-081); (b) är rätt form när det i själva
verket är **två sessioner** (T67-formen); (d) lås/lease saknar substrat i vår
miljö och har en branschledares uppmätta haveri emot sig; (e) är (a) utan
leveransväg och riskerar ADR-083-klassen (prosa som påstår mekanism).

## De fyra hindren — omverifierade mot disk, och en mätning som skärper dem

Alla fyra är omverifierade i denna worktree (HEAD `bc26fd6`), inte ärvda:

1. **`lifecycle:` bär ETT värde.** `scripts/check-lifecycle.sh:43-44` extraherar
   exakt ett gemener-ord (`sed -E 's/^lifecycle:[[:space:]]*([a-z]+).*/\1/'`).
2. **PAUSLÄGE-regexen är prefix-förankrad.**
   `scripts/check-lifecycle.sh:60` kör
   `grep -qE '^## PAUSLÄGE — Session [0-9]+ pausad'`.
3. **Del-numreringen har en berättare.** S91-doket bär Del 1–38 i EN sekventiell
   serie (`tasks/sessions/archive/2026-07/2026-07-26-session-91.md`; registerraden skrevs vid
   Del 1–26 — serien har fortsatt växa enligt samma form).
4. **Paus/resume-verben är singulära.** `session-paus`-skillen (hubben,
   `plugins/marcus-system/skills/session-paus/SKILL.md`) talar genomgående om
   "en arbetssession", "sessionsnumret N bevaras", "sessionen är durabelt
   parkerad" — en session parkeras som helhet.

**Mätningen (2026-08-01, `check-lifecycle.sh` vid HEAD `bc26fd6`, körd i
sandbox-kopia):** tre fall som hindren 1–2 aldrig prövats mot:

| Fall | Fixtur | Utfall |
|---|---|---|
| 1 | `lifecycle: paused` + **två** förankrade PAUSLÄGE-markörer | **exit 0** — grinden tolererar flera markörer vid enhetligt tillstånd |
| 2 | `lifecycle: active` + en kvarstående markör (aktör A återupptog, B pausad) | **exit 1** — blandat aktörstillstånd är strukturellt outtryckbart |
| 3 | `lifecycle: active, paused` (hypotetiskt tvåvärdes-fält) | **exit 0** — extraktionen tar första ordet, resten **kastas tyst** |

Tre slutsatser ur mätningen. Grindens bindande hinder är inte markör-antalet
utan **fält↔kropp-konsistensen över hela filen**: två aktörer i samma tillstånd
passerar av en slump, två aktörer i olika tillstånd kan inte uttryckas alls.
Och fall 3 är en varning för varje naiv utbyggnad: ett tvåvärdes-fält skulle
inte avvisas — det skulle **halveras tyst**, vilket är fail-open i exakt den
riktning en två-aktörs-form behöver skydd.

## Vad empirin i huset redan säger

- **S91 körde två aktörer skarpt — med handpartition.** Registerraden
  (`tasks/threads/README.md` § T109) bokför vad som fungerade: *"en aktör per
  DELAD STATUSYTA, inte per uppgift"* — den avgående aktören släppte
  sessionsdoket uttryckligen. Där partitionen INTE var utsatt brast det:
  scratchpad-kollision, handsekvenserad restlista, en kortnummer-serie som
  avstods, och `#446`/`#447`-låsningen på samma kortfil.
- **T67-piloten (S57 ∥ S56) är systemets befintliga svar för två sessioner:**
  varje session fick sitt EGET sessionsdok; kollisionsytan var de delade
  append-filerna, inte doket
  ([T67-kortet](../../tasks/threads/T67-parallella-aktiva-sessioner.md)).
- **Lesson-fragmenten pekar mot rutin, inte uppmärksamhet:**
  `flera-aktorer-i-samma-trad-kraver-rutin-inte-uppmarksamhet` (felen uppstod
  trots nedskriven lärdom), `partition-maste-omfatta-lasande-agenter`
  (läsning under skrivning är samma felklass) och
  `parallella-agenter-delar-scratchpad-namnrymd` (isolering är alltid isolering
  av något bestämt). Vilken option som än väljs måste den vara en rutin eller
  mekanism — inte en vaksamhet.
- **T111 gör frågan skarpare, inte bredare.** En cloud-routine startar alltid i
  färsk klon från default branch
  ([T111-kortet](../../tasks/threads/T111-autonom-orkestrering-kontexttroskel.md)
  § Docs-utredningen). Dess skrivningar når `main` endast via PR — så en
  routine-session och en interaktiv session som rör samma sessionsdok-era möts
  som **två git-skrivare mot samma fil**, med merge-konflikt, Del-krock och
  lifecycle-blandning som de tre kollisionsformerna.

## Precedent-genomgången — hur branschledare håller delade journaler

### Klass 1: en ordnad logg har exakt en skrivare (Raft, Kafka)

Raft-papperet gör single-writer till uttrycklig designprincip: *"Strong leader:
Raft uses a stronger form of leadership than other consensus algorithms. For
example, log entries only flow from the leader to other servers. This
simplifies the management of the replicated log and makes Raft easier to
understand"*, och motiverar den mot peer-to-peer-alternativet: *"If a series of
decisions must be made, it is simpler and faster to first elect a leader, then
have the leader coordinate the decisions"* (Ongaro & Ousterhout, läst i
original-PDF 2026-08-01). Kafka ger totalordning endast där en serie har en
ansvarig ordning: *"Kafka guarantees that any consumer of a given
topic-partition will always read that partition's events in exactly the same
order as they were written"* — ordning är en per-partition-egenskap, och vill
man ha fler skrivare med bevarad ordning ger man dem **var sin partition**
(kafka.apache.org/intro). Översatt: Del-serien är en partition; två skrivare
kräver antingen en partition per aktör eller en ordnande syntes.

### Klass 2: incident-journal med flera responders = roll-ägd journal (SRE, PagerDuty)

Google SRE lägger journalen hos EN roll: *"The incident commander's most
important responsibility is to keep a living incident document"* — och löser
samtidigheten i **substratet**, inte i formen: *"This can live in a wiki, but
should ideally be editable by several people concurrently"* (i praktiken
Google Docs, alltså operational transformation). PagerDuty renodlar det till en
dedikerad skrivarroll: *"A Scribe documents the timeline of an incident as it
progresses and makes sure all important decisions and data are captured"* —
råmaterialet flödar genom Slack (en append-only händelseström med
aktörsstämpel), och scriben syntetiserar tidslinjen. Flera responders, en
journalskrivare, ett stämplat händelseflöde under — det är option (a) och (c) i
samma praxis.

### Klass 3: git-modellen — per-aktör-yta plus integrationspunkt

Git-bokens integration-manager-arbetsflöde: *"each developer has write access
to their own public repository and read access to everyone else's […] The
maintainer can then add your repository as a remote, test your changes locally,
merge them into their branch, and push back to their repository"*
(git-scm.com, Distributed Workflows). Varje aktör äger sin yta; EN integratör
äger den kanoniska historiken. Vårt PR + merge-queue-flöde är redan denna form
för kod — frågan är bara om sessionsberättelsen ska följa samma snitt.

### Klass 4: äkta samtidig redigering kräver ett annat substrat (OT/CRDT)

Yjs lovar precis det två-aktörs-drömmen vill ha: delade typer som *"can be
manipulated, fire events when changes happen, and automatically merge without
merge conflicts"*, nätverksagnostiskt (*"As long as all changes eventually
arrive, the documents will sync"*) (docs.yjs.dev). Men garantin bor i
CRDT-datastrukturen — inte i filformatet. Markdown-filer i git har ingen sådan
struktur: git är optimistisk samtidighet med merge-konflikt som
kollisionssignal. Att välja OT/CRDT vore att byta bort hela
filartefakt-kontinuiteten (git-historik, grindar, arkiv) mot ett
realtidssubstrat — en kostnad utan proportion mot behovet. Forskningsspåret
CodeCRDT bekräftar att koordinationsfriheten inte är gratis ens där den byggs:
upp till 39,4 % slowdown (arXiv:2510.18893, via
[nummerallokerings-passet](nummerallokering-parallella-aktorer-2026-07-29.md)).

### Klass 5: agent-leverantörens eget svar — partitionera filägandet

Anthropics agent-teams-dokumentation, läst 2026-08-01: *"Avoid file conflicts.
Two teammates editing the same file leads to overwrites. Break the work so each
teammate owns a different set of files."* Den enda kodade ömsesidiga
uteslutningen är task-claiming: *"Task claiming uses file locking to prevent
race conditions when multiple teammates try to claim the same task
simultaneously"* — och det låset bor i verktygets egen store
(`~/.claude/tasks/`), **inte i repot** (code.claude.com/docs/en/agent-teams).
Leverantören av vårt eget harness föreskriver alltså fil-ägande-partition för
repo-ytor och bygger lås endast där en medlare finns.

### Mot-precedenten: lås mellan autonoma agenter kollapsade i praktiken

Cursor rapporterar i förstapartskälla att lås-mönstret havererade med autonoma
aktörer: *"Agents would hold locks for too long, or forget to release them
entirely. Even when locking worked correctly, it became a bottleneck"* —
genomströmningen för tjugo agenter sjönk till två–tre
(cursor.com/blog/scaling-agents, citerad via
[nummerallokerings-passet](nummerallokering-parallella-aktorer-2026-07-29.md);
ej omhämtad i detta pass). Kubernetes egen lease-mekanism illustrerar samma
svaghet från andra hållet: en kraschad innehavare blockerar tills TTL löper ut,
vilket krävde en egen feature för aktiv frisläppning
(`ControllerManagerReleaseLeaderElectionLockOnExit`, kubernetes.io/docs
Leases).

## Options-rymden — fem former prövade mot hindren

### (a) Single-writer bevaras; andra aktörer levererar via annan artefakt

Orkestreraren äger sessionsdoket; varje annan aktör landar sin berättelse i en
artefakt den äger själv (rapporttext, trådkort, research-fil, PR-text) som
orkestreraren bakar in i Del-serien.

- **Kräver av hindren:** ingenting — alla fyra förblir intakta och korrekta.
- **Grind-kostnad:** noll. Ingen skript- eller skill-ändring.
- **Precedent:** starkast i hela rymden — PagerDutys scribe, Rafts leader,
  git-bokens integration-manager, och **vår egen praxis**: `bygg-agent.md`
  förbjuder redan agenten att röra sessionsdoket i sak (den levererar PR +
  rapport), och S91:s fungerande partition var exakt denna form.
- **Kostnad/svaghet:** orkestrerarens kontext bär inbaknings-arbetet — i
  spänning med T111:s tredje spår (delegera tung läsning). Och i
  routine-scenariot finns ingen orkestrerare i realtid: routinens berättelse
  måste vänta i sin artefakt tills nästa interaktiva resume bakar in den.
  Latens, men ingen kollision.

### (b) Per-aktör-sektioner eller -filer med sammanlänkning

Eran N delas i huvuddok + per-aktör-bilagor (eller aktörsprefixade
Del-serier).

- **Kräver av hindren:** (1) lifecycle per FIL fungerar mekaniskt redan i dag —
  grinden validerar per fil — men aggregatets semantik ("vad är sessionens
  tillstånd när A är active och B paused?") är odefinierad och blir
  ADR-materia. (2) PAUSLÄGE per aktörsfil passerar grinden (mätningens fall 1
  visar t.o.m. tolerans inom EN fil vid enhetligt tillstånd). (3) Del-serier
  per fil är naturliga; huvudserien förblir en berättare. (4) verben måste
  omdefinieras: "Session N pausad" är osant när bara en aktör pausat.
- **Grind-kostnad:** måttlig–hög. `check-lifecycle.sh` behöver en ny
  konsistensdimension (fil↔fil i aggregatet); session-end/paus/resume-skillsen
  (hubben) och arkiveringen måste läras om; `create-session-doc`-flödet
  likaså.
- **Precedent:** git-modellen (gren per aktör + merge), agent-teams
  (fil-ägande-partition), Kafka (partition per skrivare) — och **T67-piloten,
  som redan ÄR denna form på sessionsnivå**: S56 och S57 fick var sitt dok.
- **Kostnad/svaghet:** formen svarar egentligen på frågan "två sessioner", inte
  "två aktörer i samma era". Väljer man (b) inom EN era har man i praktiken
  skapat två delsessioner och flyttat syntes-problemet till arkiveringen.

### (c) Append-only händelselogg med aktörsstämpel; Del-syntes vid landning

Aktörer skriver stämplade fragment (tid, aktör, händelse) — **en fil per
fragment**, à la towncrier/changesets/`lessons.d` — och EN aktör syntetiserar
Del-prosa vid paus/landning.

- **Kräver av hindren:** (1)+(2) oförändrade — lifecycle och PAUSLÄGE bor kvar
  på syntes-doket, som förblir single-writer. (3) löst i grunden:
  Del-numrering sker i syntes-ögonblicket av en berättare; fragmenten är
  ordningslösa tills dess (Kafka-partitionslogiken: ordningen skapas där
  serien ägs). (4) oförändrat — paus/resume är syntes-händelser.
- **Grind-kostnad:** låg–måttlig. `check-lifecycle.sh` orörd. Ny
  fragmentkonvention (namn med aktörs-/kort-ID — samma motmedel som
  scratchpad-lessonen redan föreskriver) och en syntes-plikt i
  session-paus/end-skillsen (hub-ändring). En fragmentform-grind är möjlig men
  inte nödvändig för v1.
- **Precedent:** stark och flerbent — event sourcing (*"Capture all changes to
  an application state as a sequence of events"*; tillståndet är härlett och
  kan återuppbyggas, Fowler), PagerDutys Slack-tidslinje + scribe-syntes,
  towncrier/changesets (fragment per fil, konsolidering vid release — prövat i
  detalj i nummerallokerings-passet), och **repots egen `lessons.d`-mekanism**
  (ADR-081: nummerlösa fragment, nummer/konsolidering vid landning). Formen är
  alltså redan i drift i huset för en annan dokumentklass.
- **Kostnad/svaghet:** syntesen ÄR (a) igen — en aktör skriver berättelsen —
  men med strukturerat råmaterial i stället för att jaga rapporter.
  Berättelsekvaliteten (S91-dokens forensiska prosa) uppstår inte i loggen; den
  kräver fortfarande sin berättare. (c) är därför en förstärkning av (a), inte
  ett alternativ till den.

### (d) Lås/lease — en aktör i taget äger doket

En lease-artefakt (fil eller extern mekanism) ger exklusivt skrivägande med
förnyelse och utgång.

- **Kräver av hindren:** ingenting — samtidigheten förbjuds i tiden i stället
  för i rummet, så hindren förblir sanna.
- **Grind-kostnad:** hög, och värre: **mekanismen saknar substrat.** Repo-filer
  har inga lås; en lease-fil i git är prosa + konvention tills en medlare
  prövar varje skrivning — exakt ADR-083-klassen. Kubernetes-leasen fungerar
  för att API-servern medlar varje uppdatering; vår enda medlare är merge-kön,
  och den serialiserar först vid landning — en lease committad via PR kan inte
  förnyas/släppas snabbare än PR-latensen.
- **Precedent:** Kubernetes Leases (*"Kubernetes also uses Leases to ensure
  only one instance of a component is running at any given time"*) är solid
  precedent för mönstret DÄR ETT MEDLANDE SUBSTRAT FINNS. Mot-precedenten är
  direkt på vår aktörsklass: Cursors uppmätta lås-kollaps med autonoma
  agenter. Anthropic byggde fil-lås enbart i verktygets egen store — aldrig i
  repot.
- **Dom:** svagast i rymden. Köper ingenting som (a) inte redan ger, till
  priset av en mekanism som hos oss bara kan vara prosa.

### (e) Formen ändras inte — två aktörer förbjuds strukturellt

Nuläget kodifieras: sessionsdoket deklareras single-writer; en andra samtidig
aktör i samma era är regelbrott.

- **Kräver av hindren:** ingenting — de blir regelns motivering.
- **Grind-kostnad:** noll–låg för prosaformen. En faktisk vakt är svår: vad
  skulle den mäta? Två grenar som rör samma sessionsdok-fil i överlappande
  tidsfönster är detekterbart i efterhand men inte i skriv-ögonblicket.
- **Precedent:** agent-teams-dokumentets förbud är exakt detta (*"Break the
  work so each teammate owns a different set of files"*). Skillnaden mot (a)
  är att (e) förbjuder utan att definiera leveransvägen för den andra aktörens
  berättelse.
- **Kostnad/svaghet:** ett förbud i prosa utan mekanism är den felklass
  ADR-083 mintades mot, och lessons-fragmentet om rutin-inte-uppmärksamhet
  visar att nedskrivna regler inte höll ens för en aktör som kände dem. (e)
  utan (a):s leveransväg lämnar dessutom exakt det vakuum S91 fyllde med
  handpåläggning.

## Sammanfattande tabell

| Option | Hinder 1–4 | Grind-/skill-kostnad | Precedent | Dom |
|---|---|---|---|---|
| (a) single-writer + leveransväg | intakta | noll | scribe, Raft, integration-manager, egen praxis | **bärande — dagens form, gör den explicit** |
| (b) per-aktör-filer | (1)(2) ok per fil; (4) kräver omdefinition; aggregat-semantik ny | måttlig–hög | git, agent-teams, T67 | rätt svar när det är TVÅ SESSIONER — inte inom en era |
| (c) fragment + syntes | intakta (på syntes-doket) | låg–måttlig | event sourcing, PagerDuty, towncrier, `lessons.d` | **starkaste förstärkningen av (a) vid fler/autonoma aktörer** |
| (d) lås/lease | intakta | hög + saknar substrat | K8s Leases (med medlare); mot: Cursor | förkastas — prosa som påstår mekanism |
| (e) förbud utan leveransväg | intakta | noll–låg | agent-teams-förbudet | ofullständig — är (a) minus det som gör (a) hållbar |

## Dom

**Formen bär inte två samtidiga skrivare, och ingen granskad branschledare
löser motsvarande problem genom att göra sin ordnade berättelse flerskrivbar.**
Den avgörande delfrågan visade sig vara en omformulering: inte "hur får två
aktörer plats i doket" utan "**var landar den andra aktörens berättelse, och
vem syntetiserar**". Där är branschsvaret samstämmigt över fem oberoende
domäner: en skrivare per ordnad serie, per-aktör-ytor för råmaterialet, och en
utpekad syntesroll. Mätningen skärpte hindren: grinden fäller blandade
aktörstillstånd (fall 2) men släpper enhetliga av en slump (fall 1), och en
naiv fält-utbyggnad halveras tyst (fall 3) — så varje option som rör fältet
måste först göra extraktionen strikt.

## Vad jag inte kunde belägga

- **Precedent för två skrivare i SAMMA markdown-berättelse i git:** jag hittade
  ingen — inte hos någon leverantör, inte i något granskat OSS-flöde. Det är
  frånvaro av funnen precedent, inte bevis på att formen inte existerar
  någonstans. Precedent-rymden för exakt vår artefaktklass (forensiskt
  sessionsnarrativ i versionshanterad markdown) är genuint tunn; klasserna
  ovan är analogier, öppet deklarerade som sådana.
- **Cursor-citatet är återanvänt** ur nummerallokerings-passet
  (2026-07-29), inte omhämtat i detta pass.
- **Kafkas ordning MELLAN partitioner:** intro-sidan gör inget anspråk;
  design-dokumentets formulering ("total order over records within a
  partition, not between different partitions") är inte verifierad i detta
  pass — jag stödjer mig endast på den verifierade per-partition-garantin.
- **Google Docs-substratets OT-mekanik:** SRE-boken säger "editable by several
  people concurrently" men själva OT-implementationen är inte läst i
  primärkälla här.
- **Chubby/DynamoDB-lock-client** som ytterligare lease-precedent: inte lästa;
  lease-klassen vilar på Kubernetes-dokumentationen + Cursor-motexemplet.
- **Hur en routine-session FAKTISKT beter sig mot en öppen era:** omätt — ingen
  routine har körts mot detta repo än. T111-kortets fresh-clone-beläggning är
  dokumentläsning, inte körning.
- **Syntes-kvaliteten i option (c):** att en berättare kan syntetisera
  likvärdig forensisk prosa ur fragment är ett antagande, inte en mätning —
  ingen pilot är körd.

## Rekommendation — märkt som rekommendation, inte beslut

1. **Kodifiera (a) som regel MED leveransväg** — inte (e):s nakna förbud.
   Sessionsdoket är single-writer per era; varje annan aktör landar i artefakt
   den äger (trådkort, research-fil, rapport), orkestreraren syntetiserar.
   Detta är dagens fungerande praxis upphöjd till regel, kostnaden är noll.
2. **När T111-vägen (routine + interaktiv i samma era) blir aktuell: pilota
   (c)** — stämplade fragment per aktör, syntes vid paus/landning.
   `lessons.d`-mekanismen är husets egen mall. Kör en minimal pilot (en
   routine, en era, en syntes) innan formen ADR:as — syntes-kvaliteten är
   obelagd.
3. **Behandla (b) som sessions-fråga, inte era-fråga:** när en andra aktörs
   arbete är distinkt scope är svaret en EGEN session (ADR-051-distinktionen +
   T67-formen), inte en delad era.
4. **Bygg ingen lease.** Om fältet någonsin byggs ut: gör extraktionen i
   `check-lifecycle.sh` strikt först (fall 3-fyndet), annars är utbyggnaden
   fail-open från dag ett.

## Källförteckning

### Egna mätningar (2026-08-01)

- `scripts/check-lifecycle.sh` vid HEAD `bc26fd6`, tre fixturfall i
  sandbox-kopia (scratchpad); utfall i tabellen ovan.
- Hinder 1–4 omverifierade mot `scripts/check-lifecycle.sh`,
  `tasks/sessions/archive/2026-07/2026-07-26-session-91.md` (Del 1–38, frontmatter),
  `tasks/threads/README.md` § T109 samt hubbens
  `plugins/marcus-system/skills/session-paus/SKILL.md`.

### Primärkällor, lästa i detta pass

- Ongaro & Ousterhout, *In Search of an Understandable Consensus Algorithm
  (Extended Version)* — <https://raft.github.io/raft.pdf> (PDF läst i original)
- Google SRE Book, *Managing Incidents* —
  <https://sre.google/sre-book/managing-incidents/>
- PagerDuty Incident Response, *Different Roles* —
  <https://response.pagerduty.com/before/different_roles/>
- Kubernetes, *Leases* —
  <https://kubernetes.io/docs/concepts/architecture/leases/>
- Fowler, *Event Sourcing* —
  <https://martinfowler.com/eaaDev/EventSourcing.html>
- Apache Kafka, *Introduction* — <https://kafka.apache.org/intro>
- Pro Git, *Distributed Workflows* —
  <https://git-scm.com/book/en/v2/Distributed-Git-Distributed-Workflows>
- Yjs, dokumentation — <https://docs.yjs.dev/>
- Anthropic, *Orchestrate teams of Claude Code sessions* —
  <https://code.claude.com/docs/en/agent-teams>

### Återanvänd research (intern, med sina egna källförteckningar)

- [nummerallokering-parallella-aktorer-2026-07-29.md](nummerallokering-parallella-aktorer-2026-07-29.md)
  — Cursor scaling-agents, towncrier/changesets-mätningarna, CodeCRDT
- [harness-namnrymd-agenter-2026-07-30.md](harness-namnrymd-agenter-2026-07-30.md)
  — scratchpad-namnrymden, verktygs-allowlist-mekaniken

### Internt underlag

- [S91-tradkarta-2026-07-31.md](../../tasks/threads/S91-tradkarta-2026-07-31.md) § T109
- [T67-parallella-aktiva-sessioner.md](../../tasks/threads/T67-parallella-aktiva-sessioner.md)
- [T111-autonom-orkestrering-kontexttroskel.md](../../tasks/threads/T111-autonom-orkestrering-kontexttroskel.md)
- `tasks/lessons.d/`: `parallella-agenter-delar-scratchpad-namnrymd`,
  `partition-maste-omfatta-lasande-agenter`,
  `flera-aktorer-i-samma-trad-kraver-rutin-inte-uppmarksamhet`
- [ADR-081](../decisions/ADR-081-nummer-tilldelas-vid-landning.md) ·
  [ADR-083](../decisions/ADR-083-prosa-som-pastar-mekanism.md) ·
  [ADR-051](../decisions/ADR-051-session-paus-lifecycle-verb.md) ·
  [ADR-052](../decisions/ADR-052-lifecycle-frontmatter-falt.md)
