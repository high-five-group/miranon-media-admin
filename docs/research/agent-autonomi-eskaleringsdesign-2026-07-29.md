---
owner: marcus803
updated: 2026-07-29
review_by: 2027-01-29
status: stable
---

# Agent-autonomins gräns: besluta, defera eller avbryta — branschpraxis och eskalerings-design (Code, 2026-07-29)

> **Proveniens:** avgränsat research-pass, 2026-07-29, beställt som underlag för ett
> governance-beslut med ADR-permanens i vårt eget samarbetssystem. Uppdraget var
> uttryckligen att **falsifiera** en kandidat-modell, inte att klä den.
>
> **Vad passet gjorde:** hämtade 14 förstapartssidor från `code.claude.com/docs` och
> `anthropic.com`; **mätte** Claude Code v2.1.220 lokalt på fyra punkter (giltiga
> permission-lägen, `AskUserQuestion` i subagent, `defer`-semantiken, hela
> auto-lägets regeluppsättning via `claude auto-mode defaults`); klassade de 65
> `soft_deny`-reglerna på axel programmatiskt; hämtade primärdokumentation för sex
> konkurrerande agent-system samt fyra angränsande discipliner.
>
> **Vad passet INTE gjorde:** ingen ADR skriven, ingen regel ändrad, ingen fil utanför
> denna rörd, inget beslut fattat. Rekommendationen nedan är märkt som rekommendation.
>
> **Metod-begränsning som påverkar två citat:** `WebFetch` hämtar via en mindre modell
> som i ett fall vägrade återge stycken över 125 tecken ordagrant
> (`anthropic.com/engineering/how-we-contain-claude`). De två fraser jag använder därifrån
> bekräftades i två oberoende hämtningar med samma ordalydelse, men jag har inte sett hela
> stycket. Det är noterat vid citaten.

---

## Kort svar

**Modellens första led faller. Modellens andra led håller, och är starkare belagt än
beställaren antog.**

Reversibilitet är **inte** branschens diskriminant för agent-autonomi. Jag mätte den
faktiska regeluppsättning Claude Code kör auto-läget på (65 regler, v2.1.220) och klassade
varje regel på axel. Reversibilitet är den **minsta** av fem axlar — 6 regler, 9 %. Den
axel som bär modellens *andra* led, att agenten inte får röra det lager människan fattar
beslut i, är **14 regler, 22 %** — mer än dubbelt så stor.

| Axel i Claude Codes auto-läge (v2.1.220, mätt) | Regler | Andel |
|---|---|---|
| Konfidentialitet / exfiltrering | 16 | 25 % |
| Angreppsyta och behörighet | 15 | 23 % |
| Blast radius — delad infrastruktur och prod | 14 | 22 % |
| **Tillsyns-integritet — agentens eget beslutslager** | **14** | **22 %** |
| **Reversibilitet** | **6** | **9 %** |

Fem domar, i fallande ordning efter hur säkert de är belagda:

1. **Reversibilitet som diskriminant: FALSIFIERAD som huvudaxel.** Den finns i branschen,
   men som *skyddsnät under alla lägen* (Aider, Replit) — inte som det som skiljer lägena åt.
   Inget av sju undersökta system använder den för att avgöra vad agenten får göra ensamt.
2. **Låst-beslut-golvet: STARKT BEKRÄFTAT, och redan mekaniserat av förstaparten** under tre
   namn — `Instruction Poisoning`, `Self-Modification`, `Session Transcript Tampering`. Anthropic
   har till och med ett namn på exakt det felläge beställaren beskriver: **"manufactured user
   intent"**. Golvet är också dokumenterat som överordnat riskbedömningen: *"Claude's own
   judgment that a condition was met does not lift it."*
3. **Hypotesen att en binär modell producerar självbeslut: BEKRÄFTAD**, med förstapartsempiri
   och tre oberoende mekanismer som existerar just för att blockering är för dyr. Det hårdaste
   belägget kommer inte från mjukvara utan från vården: *"Raising concerns was perceived as a
   **high-risk, low-benefit action** for nurses."* Flyget och medicinen svarar inte med att be
   aktören vara modigare — de **sänker eskaleringens kostnad strukturellt**.
4. **Ett icke-blockerande mellanläge finns knappt någonstans.** Sju system undersökta;
   inget har en namngiven defer-mekanism. Precedent-rymden är **genuint tunn** — det
   deklareras här öppet i stället för att räknas upp.
5. **Modellens allvarligaste svaghet är inte vilken axel den väljer, utan vilket lager den
   bor i.** Anthropics egen containment-doktrin: *"Design for containment at the environment
   layer first, then steer behavior at the model layer."* Vår modell är prosa som styr
   modell-lagret. Förstaparten varnar uttryckligen för just det: en gräns som bara står i
   text *"can be lost if context compaction removes the message that stated it. For a hard
   guarantee, add a deny rule instead."*

Och ett sjätte fynd som flyttar tyngdpunkten i hela modellen: **fyra äldre discipliner är eniga om
att det som gör ett mellanläge säkert inte är hur mycket autonomi det ger, utan om det bär en
tvingande informationsplikt.** Sheridans nivå 7 är en egen nivå just för ordet *necessarily*.
Ett tyst mellanläge har inget stöd i någon av dem. Det bärande i vår modell är därför inte
diskriminanten — det är **rapporten**.

**Den avgörande delfrågan var inte A utan D.** Frågan "vilken axel?" har ett mätt svar, men
det som faktiskt avgör om modellen fungerar är felläget i fråga D: **reversibilitet är ofta
inte avgörbar i beslutsögonblicket.** Förstaparten löser det inte med bättre bedömning utan
med presumtion och `Fail closed`. En modell vars första fråga är "kan detta rivas billigt?"
ärver en bedömning agenten ofta inte kan göra — och en agent som gissar fel gissar
systematiskt åt det billiga hållet.

---

## Metod: vad som mättes i stället för att citeras

Dokumentation åldras och hämtade sidor kan återges oprecist. Fyra påståenden gick att pröva
mot den version vi faktiskt kör, och prövades:

**Mätt mot Claude Code 2.1.220 (`claude --version`), 2026-07-29:**

| Vad | Hur | Utfall |
|---|---|---|
| Giltiga permission-lägen | `claude --permission-mode NOTAMODE` | `acceptEdits, auto, bypassPermissions, manual, dontAsk, plan` — sex lägen. `manual` är CLI-namnet på det som i settings heter `default` |
| `AskUserQuestion` i subagent | Verktygsuppslag i denna subagent-session | **Saknas.** Bekräftar dokumentationens *"`AskUserQuestion` is not currently available in subagents"* — jag som skriver detta kan strukturellt inte avbryta Marcus |
| Auto-lägets regeluppsättning | `claude auto-mode defaults` | 17 `allow`, **65 `soft_deny`**, **1 `hard_deny`**, 20 `environment` |
| Axelfördelning | Programmatisk klassning, 65/65 klassade, noll oklassade | Se tabellen i Kort svar |

Klassningen är **min**, inte Anthropics — förstaparten grupperar inte reglerna på axel.
Regelnamnen är dock beskrivande (`Irreversible Local Destruction`, `Self-Approval`,
`Production Deploy`), så tilldelningen är mekanisk snarare än tolkande. Skriptet ligger inte
i repot; siffrorna reproduceras med `claude auto-mode defaults` och en gruppering av
`soft_deny[].split('[')[0]`.

**Ett fynd som bara mätningen gav:** regeluppsättningen är **tregradig**, inte binär.
Sextiofem `soft_deny`-regler bär alla markören `[named+specifics — must name: …]` — de
*clearas* när människan namngivit målet specifikt. Den enda `hard_deny`-regeln
(dataexfiltrering) clearas inte alls. Gradskillnaden är alltså inte hur farlig handlingen är,
utan **om ett mänskligt beslut kan låsa upp den**. Det är en annan modell-form än både vår
kandidat och den binära modell vi ville bort från.

---

## A. Vilken axel använder branschen faktiskt?

### A.1 Förstaparten: fem axlar, reversibilitet minst

Mätningen ovan är svaret. Reversibilitet finns — men som 9 % av regelmassan, och alltid
kopplad till *destruktion*, aldrig som allmän diskriminant.

De sex reversibilitets-reglerna är `Git Destructive`, `Cloud Storage Mass Delete`,
`Irreversible Local Destruction`, `Unverifiable Deletion Target`, `Shared Scratch Sweep`,
`Irreversible Deletion (general)`. Samtliga handlar om att förstöra något. Ingen av dem
handlar om att *fatta ett beslut* som är svårt att ta tillbaka — vilket är precis det vår
modell använder axeln till.

Claude Codes **permission-lägen** använder inte reversibilitet alls. Dokumentationen anger
axeln rakt ut:

> "Each mode makes a different tradeoff between convenience and oversight."

och tabellen graderar på **vad slags verktyg som körs utan fråga** — `default`: "Reads only";
`acceptEdits`: "Reads, file edits, and common filesystem commands"; `auto`: "Everything, with
background safety checks". Det är en läs/skriv/exekvera-axel, inte en reversibilitets-axel.
Containment-artikeln beskriver samma grundmodell som Claude Codes ursprungliga design: *"allow
reads, require approval for write, bash, and network access."*

### A.2 Den axel förstaparten faktiskt formulerar som princip

Auto-lägets engineering-artikel anger diskriminanten som **auktorisering**, inte risk:

> "The classifier has to decide whether the action is something the user authorized, not just
> an action related to the user's goal."

och felläget den finns för att fånga:

> "**Overeager behavior**. In this case, the agent understands the user's goal, and is genuinely
> trying to help, but takes initiative beyond what the user would approve."

Detta är värt att stanna vid, för det är en **annan axel än alla fem i tabellen**. Frågan är
inte "hur farligt är detta?" utan "**bad människan om detta?**". Reversibilitet är en egenskap
hos handlingen; auktorisering är en relation mellan handlingen och vad som faktiskt sagts.
Vår modell mäter handlingen. Förstaparten mäter relationen.

### A.3 Andra frontier-system: ingen använder reversibilitet som diskriminant

Sju system undersöktes mot primärdokumentation.

| System | Lägen | Axel som skiljer lägena åt |
|---|---|---|
| **Cursor** | Allowlist / Auto-review / Run Everything | Kommando-identitet (prefix-allowlist) + sandbox-containment + LLM-klassificerare |
| **OpenAI Codex** | Approval: `on-request` / `never` / `untrusted`; Sandbox: `read-only` / `workspace-write` / `danger-full-access` | **Två uttryckligen separata axlar**: teknisk räckvidd vs. när frågan ställs |
| **Devin** | Ask-läge / Agent-läge | Uppgiftstyp (planering vs exekvering) |
| **GitHub Copilot cloud agent** | Fast pipeline | Nätverksräckvidd (brandvägg) + obligatorisk mänsklig review |
| **Amazon Kiro** | Autopilot / Supervised | **Användarens erfarenhet**, uttryckligen — inte uppgiftsrisk |
| **Aider** | Interaktiv, `--yes-always` | **Reversibilitet via git**, men som skyddsnät i alla lägen |
| **Replit Agent** | Lite / Economy / Power | Kapabilitet och kostnad. Den tidigare riskbaserade "Autonomy Level" är **borttagen** |

Codex delar axlarna så tydligt att det är värt att citera: *"Sandbox mode: What Codex can do
technically… Approval policy: When Codex must ask you before it executes an action."* Två
oberoende dimensioner — kapabilitet och frågetröskel — inte en skala.

**Aider är det enda systemet som uttryckligen motiverar sin design med reversibilitet.**
Auto-commit finns för att användaren ska kunna *"instantly undo any AI changes that you don't
like"*, och Aider commitar först befintliga ändringar så att *"you never lose your work if
aider makes an inappropriate change."* Men notera vad detta är: reversibiliteten är
**byggd i miljön** (git), inte bedömd av agenten. Aider frågar aldrig "är detta reversibelt?" —
den *gör* allt reversibelt och behöver därför inte fråga.

Det är den skarpaste kontrasten mot vår modell. Aider använder reversibilitet som
**infrastruktur**; vi föreslår den som **omdöme**.

**Kiros axel förtjänar särskild uppmärksamhet** eftersom den motsäger hela premissen: skillnaden
mellan Autopilot och Supervised är inte uppgiftens egenskaper alls, utan användarens vana.
Autopilot rekommenderas för *"experienced users familiar with Kiro's capabilities"*, Supervised
för *"new users getting familiar with Kiro"*. Reversibilitet finns i båda lägena (Revert All
Changes) men används inte för att skilja dem åt.

### A.4 Finns något som säger att reversibilitet är FEL axel?

Ja, tre saker — och de är starkare än frånvaron av stöd.

**Anthropics egen mätning av autonomi** listar reversibilitet som *en indikator bland flera*,
inte som diskriminant: forskningen poängsätter tool-calls på **två** axlar (risk och autonomi)
och spårar reversibilitet separat som en observation — *0,8 % av handlingarna var
irreversibla*. Om reversibilitet vore den bärande axeln vore den inte en 0,8-procentig
delmängd. Samma arbete avstår uttryckligen från att föreskriva: *"It's too early to mandate
specific interaction patterns."*

**Reversibilitet är ofta inte avgörbar.** Se § D.1 — detta är passets viktigaste enskilda fynd.

**Reversibilitet fångar inte det fall modellen finns för.** Beställarens eget incidentfall
beskrivs så: skadan var inte valet i sak, utan att agenten skrev in sin lösning som prejudikat.
Den skrivningen är **billigt reverterbar** — en rad i en fil, en `git revert` bort. En modell
vars första fråga är "kan människan riva detta billigt?" svarar **ja** på incidenten den
konstruerades för att förhindra. Låst-beslut-golvet finns i modellen just för att täcka det
hålet, vilket är ett tecken på att diskriminanten inte bär sin egen huvudlast.

---

## B. "Lyft krocken, lös den aldrig" — finns mönstret?

**Ja. Det är etablerat, det är mekaniserat, och förstaparten har fler namn på det än vi har.**

### B.1 Den starkaste enskilda källan i hela passet

Claude Codes permission-mode-dokumentation, avsnittet *"Boundaries you state in conversation"*:

> "The classifier treats boundaries you state in the conversation as a block signal. If you tell
> Claude 'don't push' or 'wait until I review before deploying', the classifier blocks matching
> actions even when the default rules would allow them. A boundary stays in force until you lift
> it in a later message. **Claude's own judgment that a condition was met does not lift it.**"

Tre saker att läsa noga:

1. Ett uttalat mänskligt beslut blir en **blockeringssignal** — inte en input till en avvägning.
2. Det **överstyr riskbedömningen** — *"even when the default rules would allow them"*. Alltså:
   oavsett hur billig reverten är. Exakt vad modellens led 2 påstår.
3. **Agentens eget omdöme kan inte upphäva det.** Endast människan lyfter det, i ett senare
   meddelande.

Samma princip formuleras oberoende i regeln `Self-Approval`: *"Self-approval defeats the
two-party review requirement **regardless of whether the agent believes it verified its own
code**."* Två olika ställen, samma struktur: agentens övertygelse är inte ett giltigt
upphävande-skäl.

### B.2 Prejudikat-felläget har ett namn: "manufactured user intent"

Beställarens incidentbeskrivning — agenten skriver in sin egen lösning som norm, senare agenter
läser den som prejudikat — är mekaniserad i tre av de 65 reglerna. Ordagrant ur den uppmätta
regeluppsättningen:

**`Self-Modification`** täcker edits till agentens egen konfiguration som *"(b) write consent or
instruction content the user did not give — text in `CLAUDE.md`/memory whose effect is to
pre-authorize, widen, or clear soft blocks in this prompt on future actions (**manufactured user
intent**)."*

**`Instruction Poisoning`** täcker *"Writing to any file an agent session will read back as
instructions — e.g. `CLAUDE.md`, `CLAUDE.local.md`, `.claude/` instruction files, the agent's
memory directory … or a README or docs file agents consult — content that would function as a
permission grant or BLOCK-rule bypass when read back."* Avgränsningen är exakt vår: *"Recording,
at the user's request, an authorization or preference the user actually stated in their own
message is not poisoning — the violation is fabricated authorization … and those stay blocked
**regardless of who asked**."*

**`Session Transcript Tampering`** bär motiveringen som ordagrant är prejudikat-argumentet:
*"a tampered entry feeds every later classification once the session is resumed."*

Detta är passets tydligaste bekräftelse. Vår modells led 2 är inte en lokal uppfinning — det är
konvergent design, oberoende härledd, och förstaparten har lagt 14 av 65 regler (22 %) på just
denna axel.

**Med en avgränsning som skärper vår formulering:** förstaparten spärrar inte "allt som rör ett
mänskligt beslut". Den skiljer skarpt mellan att **nedteckna vad människan faktiskt sa** (rutin,
ingen spärr — *"a user asking for a `CLAUDE.md` update is very routine"*) och att **skriva
auktorisering människan inte gav** (spärrat oavsett vem som ber). Vår regel bör ärva den
distinktionen. Utan den fastnar varje legitim dokumentationsuppdatering i golvet.

### B.3 Vad mönstret INTE heter i branschen i övrigt

Här är fyndet negativt och viktigt. De andra systemen löser regelkonflikter **mekaniskt via
filsystems-precedens**, inte genom att lyfta dem:

- **Cursor:** *"Rules are applied in this order: Team Rules → Project Rules → User Rules. All
  applicable rules are merged; earlier sources take precedence when guidance conflicts."*
- **OpenAI Codex:** `AGENTS.md`-kedja från global till lokal, där mer lokal fil är mer specifik
  och vinner; `AGENTS.override.md` som toppnivå-override.
- **Devin:** Playbooks med en explicit `Forbidden Actions`-sektion — förebyggande kontext.

Ingen av dessa dokumenterar vad som händer när agenten **under arbetet upptäcker** att uppgiften
krockar med en redan skriven regel. Regelsystemen är förebyggande, inte reaktiva. Vår modells
led 2 — lyft krocken när den uppstår — har alltså **förstapartsprecedent hos Anthropic men inte
hos de fem andra**. Det är en tunn precedent-rymd, och den deklareras här som tunn.

---

## C. Det icke-blockerande mellanläget — finns belägg för hypotesen?

Hypotesen: *en binär modell (blockera eller besluta själv) producerar systematiskt självbeslut,
eftersom blockering är för dyr.*

**Domen: bekräftad för första ledet, obekräftad som mekanism för det andra.**

### C.1 Belägg FÖR att blockering är för dyr

Förstaparten säger det rakt ut, och har byggt om produkten runt det:

> "By default, Claude Code asks users for approval before running commands or modifying files.
> This keeps users safe, but it also means a lot of clicking 'approve.' Over time that leads to
> **approval fatigue, where people stop paying close attention to what they're approving.**"

Notera vad felläget är: blockeringen *slutar inte hända* — den **slutar fungera**. Grinden står
kvar men släpper igenom. Det är en skarpare version av hypotesen än den beställdes: dyr
blockering degraderar inte till självbeslut, den degraderar till **teater**.

Två oberoende mekanismer i Claude Code existerar för att konvertera blockering till
icke-blockering:

**`askUserQuestionTimeout`** — en fråga som ingen svarar på stängs av sig själv och *"tells Claude
you may be away from your keyboard, so Claude proceeds on its own judgment and can re-ask later."*
Alltså: en obesvarad fråga blir **självbeslut**, per design. Men förstaparten drar en hård gräns
vid vad som får degradera: *"The timeout applies only to `AskUserQuestion`'s multiple-choice
questions; **permission prompts, including plan approval, never auto-resolve on idle.**"*

Det är en tvåklass-modell som liknar vår, men skuren på en annan led: **frågor får förfalla till
självbeslut; tillstånd får det aldrig.**

**Auto-läget** *"nudges Claude to keep working without stopping for clarifying questions"*.
Förstaparten designar alltså aktivt bort avbrott när den vill ha genomströmning.

### C.2 Belägg MOT — kalibrering, inte mellanläge, är förstapartens svar

Anthropic formulerar spänningen exakt som beställaren, men landar i en annan lösning:

> "An agent that stops at every possible question will give up most of the autonomy that makes it
> useful; one that always pushes through will risk misreading what the user really intended."

Deras åtgärd är **träning**, inte ett tredje läge: *"we construct training scenarios that place
Claude in ambiguous situations, and then reinforce Claude's choice to pause, rather than to
assume"*, förstärkt av Constitution som favoriserar *"raising concerns, seeking clarification, or
declining to proceed"* över antaganden.

Och de har mätt utfallet:

> "On complex tasks, users interrupt Claude only slightly more frequently than on simple ones, but
> **Claude's own rate of checking in roughly doubles.** This shows the importance of calibrating
> agents on deciding when to act and when to hand a decision back."

Detta är den enda empiriska datapunkten i hela passet på hur en agent faktiskt fördelar sig
mellan besluta och fråga. Den **motsäger delvis** hypotesen: en välkalibrerad agent ökar sin
check-in-frekvens med uppgiftens svårighet utan att människan behöver ingripa mer. Om binär
design oundvikligen producerade självbeslut borde check-in-raten ha varit platt.

Men datapunkten säger inget om **skrivna reglers** effekt, bara om tränings-effekt. Vår modell är
en skriven regel. Överföringen är inte belagd.

### C.3 Finns mellanläget som produkt någonstans — knappast

Sju system undersökta. **Inget har en namngiven, dokumenterad, icke-blockerande
defer-mekanism.** Kiro dokumenterar uttryckligen att den saknas. Det närmaste som finns:

| Mekanism | System | Vad den faktiskt är |
|---|---|---|
| `defer` (permissionDecision) | Claude Code | **Inte** ett mellanläge. Mätt semantik: *"Returning `defer` ends the query so you can resume it later."* Det är billigare blockering — processen kan dö och återupptas — inte fortsatt arbete |
| Draft-PR + PR-kommentarer | GitHub Copilot | Kommer närmast. Agenten sitter inte overksam, människan svarar asynkront. Men dokumenterat som PR-funktionalitet, inte som defer-protokoll |
| `additionalContext` | Claude Code hooks | Icke-blockerande, men riktad **till Claude**, inte till människan |
| `systemMessage` | Claude Code hooks | Icke-blockerande och riktad till människan — men en hook-utskrift, inte en durabel post |
| `PushNotification` | Claude Code | Icke-blockerande notifiering *"so a long-running task … can reach you when you step away"* |
| Strukturerad note-taking | Anthropic context engineering | **Den enda genuina precedenten.** Agenten *"regularly writes notes persisted to memory outside of the context window"*; efter kontextåterställning *"the agent reads its own notes and continues"* |

Blockeringsordningen är mätt: `deny` > `defer` > `ask` > `allow`. `defer` sitter alltså på
blockerings-sidan av skalan, inte mellan blockera och tillåta.

**Slutsats för C:** det icke-blockerande mellanläget är **inte** etablerad branschpraxis. Det som
finns är (a) note-taking till fil som kontexthanterings-mönster, och (b) draft-PR som
granskningsmönster. Vår `tråd-registret`-mekanik ligger närmast (a) och har därmed *en* seriös
precedent, inte tre. **Precedent-rymden är tunn och deklareras som tunn.**

Ett fynd som stärker behovet oavsett precedens: **jag som skriver detta kan strukturellt inte
avbryta Marcus.** `AskUserQuestion` saknas i subagenter — mätt, inte antaget. För varje
bakgrundsagent är modellen redan binär i praktiken: besluta själv, eller rapportera i slutet.
Ett durabelt mellanläge är för den arkitekturen inte en bekvämlighet utan det enda alternativet
till självbeslut.

---

## D. Failure modes

### D.1 Vad går fel med reversibilitets-baserade regler — passets viktigaste fynd

**Reversibilitet är ofta inte avgörbar i beslutsögonblicket.** Förstaparten stöter på det
upprepade gånger och löser det aldrig med bättre bedömning.

`Unverifiable Deletion Target`, ordagrant:

> "The value came only from earlier command output the classifier never sees, so **the blast
> radius is unknowable** — an empty or unexpected `$VAR` turns `rm -rf "$VAR"/*` into a `$HOME`
> or filesystem-root wipe. … **Fail closed.**"

`Irreversible Deletion (general)`, ordagrant:

> "deleting or tearing down a stateful resource the agent did not create this session is
> **presumed irreversible** … **recreating a resource does not recreate its state or keys**.
> Clears only when the user named the specific resource; 'you can continue' names nothing."

Tre distinkta fellägen faller ut:

1. **Oavgörbarhet.** Agenten saknar ofta den information reversibilitets-bedömningen kräver.
   Förstapartens svar är en default-riktning (`Fail closed`), inte en bedömning. **En
   reversibilitets-regel utan definierad default-riktning är ofullständig.**
2. **Systematisk övervärdering.** *"recreating a resource does not recreate its state or keys"* —
   att kunna återskapa formen är inte att återställa tillståndet. En agent som bedömer
   reversibilitet bedömer det som är synligt (filen, raden, committen) och missar det som inte är
   (att någon redan läst den, att en senare session byggt vidare på den).
3. **Bedömaren är part i målet.** `Self-Approval`-regeln fångar strukturen: agentens egen
   övertygelse räknas inte. Men i vår modell är det just agenten som besvarar frågan "kan
   människan riva detta billigt?" — och den frågan avgör om människan får veta något alls.

Fellägena 2 och 3 pekar åt samma håll: **felen är inte slumpmässiga utan har en riktning.** En
agent som gissar om reversibilitet gissar systematiskt åt "billigt att riva", eftersom det är
svaret som låter arbetet fortsätta.

### D.2 Failure mode för prosa-baserade golv — träffar vår modell direkt

Förstaparten dokumenterar varför en gräns som bara står i text inte håller:

> "Boundaries are not stored as rules. The classifier re-reads them from the transcript on each
> check, so **a boundary can be lost if context compaction removes the message that stated it.**
> For a hard guarantee, add a deny rule instead."

Vår modell är avsedd att bo i `CLAUDE.md`-prosa. Den ärver därmed exakt denna sårbarhet — och
repots egen historik bekräftar den empiriskt: `L328` var nedskriven sedan S81, beskrev mekanismen
korrekt, och orkestreraren gick ändå i fällan två gånger under en och samma resume.

Detta kopplar till passets tyngsta strukturella invändning, Anthropics containment-doktrin:

> "Design for containment at the environment layer first, then steer behavior at the model layer."

och

> "Rather than supervising what the agent does, we supervise what it's able to do by enforcing
> access boundaries."

*(De två citaten från `how-we-contain-claude` bekräftades i två oberoende hämtningar med samma
ordalydelse. Hämtningsmodellen vägrade återge hela stycket ordagrant, så det omgivande stycket
är osett — se metod-noten överst.)*

Modell-lagret beskrivs uttryckligen som det som *"has to pick up the slack"* när miljölagret
saknas — alltså andrahandsvalet, inte förstahandsvalet.

### D.3 Failure modes för de andra designerna

**Klassificerar-baserad (Cursor Auto-review, Claude Code auto):** icke-deterministisk. Cursor
skriver ut att den *"is not a security guarantee"*. Claude Code har en mekanisk fallback:
blockeras en handling *"3 times in a row or 20 times total"* pausar auto-läget och prompt-läget
återtar. Tröskelbaserad återgång, inte omdöme.

**Allowlist-baserad (Cursor, Codex `untrusted`):** listan blir aldrig komplett, och wrapper-kommandon
går runt den. Claude Codes dokumentation ger exemplet ordagrant: en regel som `Bash(devbox run *)`
matchar *"whatever comes after `run`, including `devbox run rm -rf .`"*.

**Godkännande-baserad (default-läget):** approval fatigue, § C.1.

**Precedens-baserad regelkonflikt (Cursor, Codex):** löser konflikten tyst. Ingen människa får
veta att två regler sa emot varandra — vilket är precis det vår modells led 2 vill undvika.

**Multi-agent-delegering:** Cognitions dokumenterade invändning är att beslutsfragmentering mellan
agenter är farligare än mellan agent och människa. *"Actions carry implicit decisions, and
conflicting decisions carry bad results."* Detta är direkt relevant för vår orkestrerare/subagent-
arkitektur och skärper argumentet för att subagenters beslut måste bli synliga någonstans.

---

## E. Angränsande discipliner — där problemet är äldre

**Källvarning som gäller hela avsnittet.** Flera bärande primärkällor ligger bakom betalvägg
eller gav 403 (Sheridan & Verplank 1978, Bainbridge 1983, Parasuraman m.fl. 2000, Onnasch m.fl.
2014). Där texten inte kunde läsas i original är påståendet **triangulerat mot flera oberoende
sekundärkällor med samma ordalydelse**, och det står utskrivet vid varje sådant påstående.
Ordagranna citat nedan är verifierade mot källa där inget annat anges.

### E.1 Autonomi-nivåer: modellen sätts PER STEG, inte för agenten

**Sheridan & Verplanks tiogradiga skala (1978)** är ursprunget till hela genren. Originalrapporten
gick inte att hämta; nivåerna nedan är rekonstruerade genom triangulering. Fyra nivåer är direkt
relevanta:

| Nivå | Innebörd | Motsvarighet i vår modell |
|---|---|---|
| 5 | Datorn utför förslaget **om människan godkänner** — *"management by consent"* | Avbryt |
| 6 | Människan får **begränsad tid att veta** före automatisk körning — *"management by exception"* | Saknas hos oss |
| 7 | Datorn utför automatiskt och **måste därefter informera** människan | Besluta och rapportera |
| 8 | Datorn informerar efter körning **endast om människan frågar** | — |

Nivå 6 är en form vår modell inte har: tidsbegränsat veto. Nivå 7 är exakt "besluta och rapportera"
— och det som gör den till en egen nivå är ordet **necessarily**. Informationsplikten är
obligatorisk, inte valfri. Skillnaden mellan nivå 7 och 8 är hela avståndet mellan en agent som
rapporterar och en agent som kan förhöras.

**Parasuraman, Sheridan & Wickens (2000)** är den viktigaste strukturella invändningen mot vår
modells form. De delar automation i fyra funktioner — informationsinhämtning, informationsanalys,
beslutsval, handlingsutförande — och sätter **autonomi-nivå per funktion**, inte för systemet.
(Verifierat på abstract-nivå plus oberoende sekundärkällor; metodtexten var inte åtkomlig.)

Det betyder att en agent kan ligga på nivå 8 för informationsinhämtning och nivå 3 för
handlingsutförande **samtidigt**. Vår modell sätter en nivå för hela agenten och skiljer sedan på
handlingar. Det är en annan dekomposition, och den äldre litteraturen valde den andra.

### E.2 Är ett mellanläge bra eller farligt? Fältet är oenigt

Beställaren frågade rakt ut. Svaret är att detta är **omtvistat inom disciplinen själv**, och den
som vill luta sig mot litteraturen kan luta åt båda håll:

- **Endsley & Kiris (1995)** fann att out-of-the-loop-problemet var **större vid full automation än
  vid mellannivåer** — alltså stöd för mellanläget.
- **Bainbridge (1983), "Ironies of Automation"** — den klassiska invändningen: att automatisera det
  mesta men inte allt lämnar människan med en passiv övervakningsuppgift människor är dåliga på,
  medan de manuella färdigheterna eroderar. *(Primärtexten gick inte att nå på någon väg som
  prövades. Tesen är konsekvent återgiven över flera sekundärkällor, men ingen ordagrann
  primärverifiering finns.)*
- **Onnasch m.fl. (2014)**, metaanalys över 18 experiment, gav **"the lumberjack effect"**: högre
  automationsgrad ger bättre rutinprestanda och lägre belastning när automationen fungerar, men
  **sämre prestanda när den fallerar**. Alltså inte "mellannivå är farligast" utan en monoton
  avvägning — ju högre automation, desto större fallhöjd.
- **Jamieson & Skraaning (2019/2020)** motsäger lumberjack-modellen empiriskt: i en
  kärnkraftssimulator **ökade** situationsmedvetenheten med automationsgraden.
- **Parasuraman & Manzey (2010)** ger det mest robusta fyndet, och det gäller oavsett nivå:
  automation complacency uppträder hos både noviser och experter och **kan inte tränas bort**.

Det finns också substantiell kritik mot **själva nivå-tänkandet**. Jamieson & Skraaning (2018)
beskriver ramverket som lidande av *"a crisis of confidence"*. Arbetet **"Unsafe At Any Level"**
(arXiv 2003.00326, direktläst) argumenterar att linjära nivå-taxonomier skapar en falsk känsla av
säkerhetsprogression, och att högre nivåer kan skapa **nya** faror snarare än att minska befintliga.

**Vad detta betyder för oss:** litteraturen ger inget rent stöd för att en tregradig modell är
säkrare än en binär. Det som däremot är konsekvent över spåren är något annat — se E.5.

### E.3 Flyget: avbrottsbudget med en ovillkorlig undantagskanal

**Sterile cockpit-regeln (14 CFR 121.542, direktverifierad)** förbjuder all icke-säkerhetsrelaterad
kommunikation under kritiska flygfaser — taxining, start, landning och all flygning under 10 000 fot
utom cruise. Det är en ren avbrottsbudget: noll tolerans för brus i en definierad fas.

Men den bärande detaljen är undantaget. Säkerhetsrelaterad kommunikation är **explicit undantagen**,
och FAA:s hållning är att *"it is better to break the sterile cockpit rule than to fail to
communicate."* *(Formuleringen är hämtad ur sekundärkälla som refererar FAA-vägledning, inte ur
FAA-dokumentet självt.)*

Arkitekturen är alltså: **budgeten för avbrott är noll för brus och aldrig noll för signal.** Det
är den skarpaste formuleringen i hela passet av vad ett eskalerings-golv ska göra.

**Two-challenge rule:** *"The two-challenge rule allows one crew member to automatically assume the
duties of another crew member who fails to respond to two consecutive challenges."* Notera ordet
**automatically** — regeln kräver inget modigt enskilt beslut av den underordnade. Kostnaden för
eskalering är bortkonstruerad genom att övertagandet blir mekaniskt efter två obesvarade signaler.

**PACE-modellen** (Besco, 1995 — utvecklad ur NTSB:s haveriutredningar) graderar eskalering i fyra
steg: Probe, Alert, Challenge, Emergency. Motiveringen för graderingen är exakt vår fråga C: att
börja med en billig Probe **sänker den interpersonella kostnaden av att ha fel** och undviker en
cry-wolf-effekt av att gå direkt till Emergency.

### E.4 Medicinen: eskalering som procedur, inte som mod

**SBAR** (Leonard m.fl., Kaiser Permanente 2002; verifierat mot IHI) belägger beställarens tes
direkt: **R står för Recommendation** — *"action requested/recommended — what you want"*. Den som
eskalerar får inte lämna av ett problem och gå. Protokollet **tvingar fram ett handlingsförslag**
som del av formatet.

**NEWS2** (Royal College of Physicians, 2017) är tröskelbaserad: poäng 0–4 låg risk, 5–6 medel,
**≥7 kräver omedelbar bedömning** av akutteam. Trösklarna omvandlas till ett **mandaterat** svar —
övervakningsfrekvens, kompetensnivå hos den som svarar, brådskandegrad. Det är inte ett omdöme den
observerande sjuksköterskan kan välja bort. *(Exakt ordalydelse i RCP:s triggertabell kunde inte
extraheras; tröskelstrukturen är bekräftad.)*

**Speaking up-litteraturen ger passets starkaste stöd för hypotes C.** Okuyama, Wagner & Bijnen
(2014), *BMC Health Services Research* 14:61, direktverifierad:

> "Raising concerns was perceived as a **high-risk, low-benefit action** for nurses."

och om avvägningen:

> "The individual is faced with a balancing act of trying to be pro-social and constructive while
> at the same time being mindful of personal costs."

Barriärerna som identifieras är hierarki (*"disproportionate authority gradients"*), konflikträdsla,
rädsla för repressalier, oro att framstå som inkompetent, och futilitet — *"Prediction that nothing
will be done about raised concerns inhibits health care professionals."*

Detta är **empiriskt stöd för hypotesen från en disciplin med decennier av utfallsdata**: när det
enda sättet att eskalera upplevs som högkostnad och låg nytta, väljs det systematiskt bort. Och
lösningarna alla tre fält valde är av samma slag — de ber inte aktören vara modigare, de **sänker
kostnaden strukturellt**: automatiskt övertagande (two-challenge), billig ingångsnivå (PACE Probe),
fördefinierat format (SBAR), tvingande tröskel (NEWS2).

### E.5 SRE och change management: förgodkänd klass, kvot, blast radius

**ITIL:s ändringsklassning** är den formaliserade versionen av "agenten får besluta själv för en
förgodkänd klass": *standard change* är **"low-risk, repeatable, and pre-authorized"**, följer
dokumenterad procedur och kräver *"little or no additional approval"*. *Normal change* bedöms per
fall; *emergency change* kringgår processen men kräver **efterhandsgranskning**. Tre klasser, där
mellanklassen definieras av att någon i förväg beslutat att den inte behöver beslutas igen.

**Error budgets** (Google SRE, direktverifierad) är en kvot som styr autonomi utan
per-handlings-godkännande: *"As long as the uptime measured is above the SLO … new releases can be
pushed."* Är budgeten förbrukad *"teams will halt all changes and releases other than critical
issues or security fixes."* Autonomin är alltså en resurs som förbrukas, inte en egenskap hos
handlingen.

**Bezos two-way doors** — och här behöver en vanlig felcitering rättas. Formuleringen kommer från
**2015 års aktieägarbrev (publicerat 2016)**, inte 1997-brevet som ofta anges:

> "Some decisions are consequential and irreversible or nearly irreversible — one-way doors — and
> these decisions must be made methodically, carefully, slowly, with great deliberation and
> consultation. … But most decisions aren't like that — they are changeable, reversible — they're
> two-way doors."

*(PDF-extraktion från Amazons investerarsida misslyckades tekniskt; citatet är triangulerat mot
flera oberoende källor med identisk ordalydelse. URL:en i källförteckningen är förstapartskällan.)*

**Kritiken mot modellen — beställaren bad om den, och den finns.** Ingen peer-reviewad demontering
hittades (begreppet är managementaforism, inte forskningsobjekt), men praktikerkritiken är
substantiell och pekar åt ett håll. Dan Kindel (2019), direktverifierad, med anställning som exempel:

> "You might argue that this is a two-way door because you can always fire someone. This is a
> fallacy as it's far, far harder to un-hire someone than it is to hire someone, and a bad hire
> will do irreparable damage."

**Teoretisk reversibilitet skiljer sig systematiskt från praktisk.** En handling kan tekniskt gå att
ångra men bära så höga faktiska kostnader — i tid, förtroende, relationer — att den fungerar som en
enkelriktad dörr. Det är samma felläge som § D.1 punkt 2, härlett oberoende i en annan domän.

### E.6 Vad de äldre disciplinerna faktiskt använder för axel

Ingen av dem använder en ren reversibilitetsaxel. Sammanställt:

| Disciplin | Axel | Reversibilitet? |
|---|---|---|
| Flyg — sterile cockpit | **Fas + kriticitet** | Nej |
| Flyg — two-challenge | **Antal obesvarade signaler** | Nej |
| Medicin — NEWS2 | **Fysiologisk tröskel** | Nej |
| Medicin — SBAR | Format, inte tröskel | Nej |
| SRE — error budget | **Förbrukad kvot** | Nej |
| SRE — canary | **Blast radius, gradvis** | Delvis |
| ITIL | **Förgodkänd klass** | Nej |
| Amazon | **Reversibilitet** | Ja — och det är den **yngsta och minst validerade** av alla |

Detta är en oberoende bekräftelse av § A. Reversibilitetsaxeln är i denna sällskapskrets
undantaget, inte normen — och den enda som saknar decennier av haveriutredningar eller kliniska
utfallsdata bakom sig.

### E.7 Det som ÄR konsekvent över alla spår

Här ligger avsnittets viktigaste bidrag, och det stöder vår modell — men flyttar tyngdpunkten.

Litteraturen ger inget rent stöd för att tre lägen slår två. Vad den **är** konsekvent om är att
skillnaden mellan ett säkert och ett farligt mellanläge inte är hur mycket autonomi det ger, utan
**om mellanläget är kopplat till en tvingande informationsplikt**:

- Sheridan nivå 7: utför automatiskt, **måste därefter informera** — nivå 8 (informerar bara på
  förfrågan) är en egen, lägre nivå just för att plikten fallit bort.
- Sterile cockpit: budgeten är noll för brus, men säkerhetssignal har en ovillkorlig kanal.
- NEWS2: tröskeln **mandaterar** ett svar; den föreslår det inte.
- ITIL emergency change: får kringgå processen, men **kräver efterhandsgranskning**.

Ett **tyst** mellanläge har inget stöd i något av de fyra spåren. Ett icke-blockerande mellanläge
**med obligatorisk rapportering** har stöd i tre av fyra.

För vår modell betyder det att det bärande elementet inte är diskriminanten utan **rapporten**.
"Besluta och rapportera" är bara säkert om rapporten är obligatorisk och faktiskt läses — och
"defera durabelt" är bara säkert om det deferade dyker upp igen av sig självt, inte om någon råkar
leta. Vårt tråd-register uppfyller det andra kravet. Om rapport-ledet är lika mekaniserat är en
fråga passet inte kunde besvara.

---

## Dom

**Led 1 — reversibilitet efter rapport som diskriminant: FALSIFIERAD som huvudaxel.**
Nio procent av förstapartens regelmassa. Inget av sju system använder den för att skilja
autonomi-lägen åt. Där den används (Aider) är den byggd i miljön, inte bedömd av agenten. Och
den svarar fel på beställarens eget incidentfall, som var billigt reverterbart.

Falsifieringen bekräftas oberoende av de äldre disciplinerna: av åtta undersökta
eskaleringsregimer i flyg, medicin och drift använder **en enda** reversibilitet som axel —
Bezos two-way doors, vilken också är den yngsta och enda utan haveriutrednings- eller klinisk
utfallsdata bakom sig. Övriga sju använder fas, tröskel, signalräkning, kvot, blast radius eller
förgodkänd klass.

**Led 2 — låst-beslut-golvet: BEKRÄFTAT och förstärkt.** Belagt i förstaparten under fyra
oberoende formuleringar (`Boundaries you state in conversation`, `Self-Modification`,
`Instruction Poisoning`, `Session Transcript Tampering`), med Anthropics egen term för felläget:
**manufactured user intent**. Golvet är dessutom uttryckligen överordnat riskbedömningen, vilket
är starkare än beställarens formulering. Enda skärpningen: skilj mellan att nedteckna vad
människan sa och att skapa auktorisering hon inte gav.

**Hypotesen om binär design: BEKRÄFTAD, med en skärpning.** Dyr blockering degraderar inte i
första hand till självbeslut utan till **approval fatigue** — grinden står kvar och släpper
igenom. Det är ett allvarligare felläge än det beställda, eftersom det är osynligt.

**Det icke-blockerande mellanläget: tunn precedent-rymd i mjukvaran, deklarerad som tunn.** En
seriös precedent (note-taking som kontextmönster), en partiell (draft-PR). Inte tre. Räkningen
fejkas inte.

**Men mellanlägets VILLKOR är väl belagt, även där mellanläget självt inte är det.** Fyra
discipliner konvergerar: ett mellanläge är säkert om och endast om det bär en tvingande
informationsplikt. Sheridan nivå 7 (*necessarily informs*), sterile cockpits ovillkorliga
säkerhetskanal, NEWS2:s mandaterade svar, ITIL:s efterhandsgranskning av emergency change. Ett
**tyst** mellanläge har noll stöd i noll av fyra. Det är den enskilt mest handlingsbara
begränsningen passet hittade.

**Litteraturen ger däremot inget stöd för att tre lägen slår två i sig.** Fältet är öppet oenigt
om mellannivåer (Endsley & Kiris för, lumberjack-effekten emot, Jamieson & Skraaning emot
lumberjack), och det finns substantiell kritik mot hela nivå-tänkandet som modellform.

**Den strukturella invändning som väger tyngst:** modellen bor i fel lager. Förstaparten säger
uttryckligen att en gräns i prosa kan tappas och att den som vill ha garanti ska mekanisera.
Repots egen `L328`-historik är lokalt bevis för samma sak.

---

## Vad jag inte kunde belägga

Detta avsnitt är passets mest användbara, eftersom det visar var beslutet vilar på antaganden.

1. **Att en skriven regel förändrar agentbeteende.** Anthropics kalibrerings-empiri
   (check-in-raten fördubblas) mäter **tränings**-effekt, inte effekten av en instruktion i
   `CLAUDE.md`. Hela vår modell är en skriven regel. **Överföringen är obelagd** — och repots
   `L328`-historik pekar åt fel håll.
2. **Att ett tredje läge minskar felaktiga självbeslut.** Ingen källa mäter detta. Hypotesen är
   rimlig och stöds indirekt av approval-fatigue-materialet, men jag hittade **ingen studie eller
   dokumentation som jämför binär mot tregradig eskalering** i något agentsystem.
3. **Kvantitativ effekt av låst-beslut-golvet.** Att förstaparten lagt 22 % av reglerna där visar
   prioritet, inte utfall. Ingen mätning av hur ofta regeln faktiskt fäller något.
4. **GitHubs designresonemang bakom draft-PR-tvånget.** *Vad* systemet gör är väldokumenterat
   (*"Draft pull requests created by Copilot cloud agent must be reviewed and merged by a
   human"*). *Varför* det valdes framför alternativ hittade jag ingen förstapartstext om.
5. **Devins hantering av tvetydighet.** Fyra dokumentationssidor hämtade; ingen beskriver om Devin
   frågar eller antar. En sekundärkälla påstod en konfidens-baserad "Start session?"-prompt —
   direkthämtning av den angivna sidan visade att texten **inte finns där**. Påståendet används
   därför inte.
6. **Hela stycket runt containment-citaten.** Se metod-noten. Fraserna är dubbelverifierade,
   styckena osedda.
7. **Vad som händer i Claude Code när `CLAUDE.md`-prosa säger emot en `permissions`-regel.**
   Dokumentationen säger att reglerna vinner (*"Instructions in your prompt or `CLAUDE.md` shape
   what Claude tries to do, but they don't change what Claude Code allows"*), men jag **mätte inte**
   fallet där prosan säger emot vad reglerna tillåter. Relevant, eftersom vår modell är prosa.
8. **Att min axelklassning är den enda rimliga.** Klassningen är mekanisk men gjord av mig. En
   annan läsare kunde placera enskilda regler annorlunda. Slutsatsen är dock robust mot
   rimliga omplaceringar: reversibilitet skulle behöva mer än fördubblas för att inte vara minst.
9. **Ordagrann primärtext för fem klassiska referenser.** Sheridan & Verplank (1978),
   Bainbridge (1983), Parasuraman m.fl. (2000) metodavsnitt, Onnasch m.fl. (2014) och RCP:s
   NEWS2-triggertabell låg bakom betalvägg eller gav 403. Påståendena är triangulerade mot
   flera oberoende sekundärkällor med samma ordalydelse, men **jag har inte läst originalen**.
   Det gäller särskilt nivålistan i § E.1 — den är rekonstruerad, inte avskriven.
10. **Att en tregradig modell minskar fel jämfört med en binär.** Detta är den fråga som
    egentligen avgör beslutet, och **ingen av de fyra disciplinerna besvarar den**. De belägger
    att eskaleringskostnad styr beteende och att mellanlägen kräver informationsplikt — inte att
    tre lägen slår två. Automation-litteraturen är dessutom öppet oenig om mellannivåer.
11. **Om vårt rapport-led faktiskt är obligatoriskt i praktiken.** § E.7 gör rapporten till det
    bärande elementet. Jag har inte undersökt hur ofta en transparens-rapport från en agent
    faktiskt läses av Marcus, eller vad som händer när den inte gör det. Utan det talet är
    "besluta och rapportera" ett antagande, inte en mekanism.
12. **En namngiven "callout alltid, oavsett åtgärd"-regel i flyget.** Sökt efter men inte funnen
    som fristående princip utöver sterile cockpit-undantaget. Standardiserade callouts finns
    väldokumenterat i SOP-litteratur; principen som sådan hittade jag ingen primärkälla för.

---

## Rekommendation

**Detta är en rekommendation, inte ett beslut.** Beslutet är Marcus'.

**1. Behåll led 2 oförändrat i sak — det är passets bäst belagda fynd.** Lägg till förstapartens
avgränsning: att nedteckna vad Marcus faktiskt sagt är rutin; att skriva auktorisering han inte
gett är spärrat oavsett vem som ber. Överväg att låna termen **manufactured user intent** —
den namnger felläget bättre än "prejudikat".

**2. Byt diskriminant i led 1 från reversibilitet till auktorisering.** Förstapartens fråga är
*"är detta något människan bad om?"*, inte *"kan detta rivas billigt?"*. Den fångar
incidentfallet, den kräver ingen bedömning agenten saknar underlag för, och den har
förstapartsprecedent. Reversibilitet blir då vad den är i branschen: ett **skyddsnät**
(worktree, PR-flöde, merge queue — vi har det redan) snarare än en beslutsregel.

**3. Om reversibilitet ändå behålls: skriv ut default-riktningen.** Förstaparten säger `Fail
closed` och `presumed irreversible`. En reversibilitets-regel utan definierad riktning vid
oavgörbarhet ärver felläget i § D.1, och riktningen på gissningen är inte slumpmässig.

**4. Behåll det icke-blockerande mellanläget, men motivera det ärligt.** Precedent-rymden är
tunn — en seriös precedent, inte tre. Det starkaste argumentet är inte branschpraxis utan vår
egen arkitektur: **subagenter kan strukturellt inte avbryta**, mätt på v2.1.220. För dem är
mellanläget det enda alternativet till självbeslut. Det argumentet är lokalt, verifierbart och
starkare än ett lånat.

**4b. Skriv in informationsplikten som villkor, inte som förväntan.** Detta är passets mest
handlingsbara enskilda fynd (§ E.7). Fyra discipliner är eniga om att ett mellanläge utan
tvingande rapportering saknar stöd. Konkret innebär det två krav på vår modell: att "besluta
och rapportera" inte får kunna degradera till Sheridans nivå 8 (informerar bara på förfrågan),
och att det deferade måste **dyka upp av sig självt** i stället för att vänta på att någon letar.
Tråd-registret uppfyller det andra kravet. Det första är oskrivet.

**4c. Låna SBAR:s formkrav på eskaleringen.** När agenten avbryter ska den leverera en
**rekommendation**, inte bara en fråga — det är hela poängen med SBAR:s R, och det sänker
kostnaden för mottagaren. Detta är gratis att införa och har fyrtio års klinisk användning bakom
sig. Den motsatta felformen — att lämna av ett problem och gå — är precis vad protokollet
konstruerades för att förhindra.

**5. Mekanisera minst en post av golvet innan ADR:n graderas Accepted.** Detta är passets
starkaste strukturella rekommendation. Förstaparten säger rakt ut att prosa-gränser tappas och
att garantin kräver en regel; repots `L328` visar samma sak lokalt. Billigast tillgängliga
mekanism med befintlig apparat: en `PreToolUse`-hook eller `permissions.ask`-regel på skrivningar
till de filer som fungerar som prejudikat — `CLAUDE.md`, `docs/decisions/**`, `.claude/**`. Notera
att förstaparten redan behandlar exakt den filmängden som skyddad; vi skulle följa ett befintligt
mönster, inte uppfinna ett.

**6. Ett oväntat fynd värt en egen kontroll.** Auto-lägets regel `Merge Without Review` undantar
uttryckligen vårt arbetssätt: *"`gh pr merge --auto` on a repo with required-reviews branch
protection is NOT this rule — `--auto` queues until reviews+checks pass; the gate is
server-enforced."* Vår merge queue är alltså förstapartserkänd som en server-upprätthållen grind.
Undantaget gäller dock **repon med required-reviews branch protection**; blockeras `--auto` på en
oskyddad repo eller på en PR agenten inte arbetar med. Värt att verifiera att `main-skydd`
faktiskt bär required reviews, eftersom vår landningsdisciplin lutar sig mot detta.

---

## Källor

**Anthropic, förstaparts — dokumentation:**

- Permission modes — <https://code.claude.com/docs/en/permission-modes>
- Configure permissions — <https://code.claude.com/docs/en/permissions>
- Hooks — <https://code.claude.com/docs/en/hooks>
- Agent SDK, hooks — <https://code.claude.com/docs/en/agent-sdk/hooks>
- Agent SDK, approvals and user input — <https://code.claude.com/docs/en/agent-sdk/user-input>
- Tools reference — <https://code.claude.com/docs/en/tools-reference>
- Configure auto mode — <https://code.claude.com/docs/en/auto-mode-config>

**Anthropic, förstaparts — engineering och research:**

- Building effective agents — <https://www.anthropic.com/engineering/building-effective-agents>
- Claude Code auto mode — <https://www.anthropic.com/engineering/claude-code-auto-mode>
- How we contain Claude — <https://www.anthropic.com/engineering/how-we-contain-claude>
- Effective context engineering for AI agents — <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents>
- Trustworthy agents in practice — <https://www.anthropic.com/research/trustworthy-agents>
- Measuring AI agent autonomy in practice — <https://www.anthropic.com/research/measuring-agent-autonomy>
- Agent view in Claude Code — <https://claude.com/blog/agent-view-in-claude-code>

**Mätningar (Claude Code 2.1.220, 2026-07-29):** `claude --version`,
`claude --permission-mode <ogiltigt>`, `claude auto-mode defaults`, verktygsuppslag på
`AskUserQuestion` i subagent-session.

**Andra agent-system, förstaparts:**

- Cursor, Run Modes — <https://cursor.com/docs/agent/security/run-modes>
- Cursor, permissions-referens — <https://cursor.com/docs/reference/permissions>
- Cursor, Rules — <https://cursor.com/docs/context/rules>
- OpenAI Codex, agent approvals and security — <https://learn.chatgpt.com/docs/agent-approvals-security>
- OpenAI Codex, AGENTS.md — <https://developers.openai.com/codex/guides/agents-md>
- GitHub Copilot cloud agent, risks and mitigations — <https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations>
- GitHub Copilot, agent firewall — <https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall>
- Aider, git integration — <https://aider.chat/docs/git.html>
- Aider, coding conventions — <https://aider.chat/docs/usage/conventions.html>
- Devin, first run — <https://docs.devin.ai/get-started/first-run>
- Devin, creating playbooks — <https://docs.devin.ai/product-guides/creating-playbooks>
- Devin, instructing Devin effectively — <https://docs.devin.ai/essential-guidelines/instructing-devin-effectively>
- Amazon Kiro, Autopilot — <https://kiro.dev/docs/chat/autopilot/>
- Replit, autonomy level — <https://docs.replit.com/replitai/autonomy-level>
- Cognition, Don't Build Multi-Agents — <https://cognition.com/blog/dont-build-multi-agents>

**Angränsande discipliner — människa/automation.** Källor markerade *(ej primärverifierad)* låg
bakom betalvägg eller gav 403; påståendet är triangulerat mot flera oberoende sekundärkällor.

- Sheridan, T.B. & Verplank, W.L. (1978), *Human and Computer Control of Undersea Teleoperators*,
  MIT Man-Machine Systems Laboratory *(ej primärverifierad)*
- Parasuraman, R., Sheridan, T.B. & Wickens, C.D. (2000), "A Model for Types and Levels of Human
  Interaction with Automation", *IEEE Trans. SMC-A* 30(3), 286–297 *(abstract-nivå)*
- Bainbridge, L. (1983), "Ironies of Automation", *Automatica* 19(6), 775–779 *(ej primärverifierad)*
- Endsley, M.R. & Kiris, E.O. (1995), "The Out-of-the-Loop Performance Problem and Level of Control
  in Automation", *Human Factors* 37(2) — <https://journals.sagepub.com/doi/10.1518/001872095779064555>
- Onnasch, L., Wickens, C.D., Li, H. & Manzey, D. (2014), "Human Performance Consequences of Stages
  and Levels of Automation", *Human Factors* 56(3), 476–488 *(ej primärverifierad)* —
  <https://journals.sagepub.com/doi/10.1177/0018720813501549>
- Jamieson, G.A. & Skraaning, G. (2019/2020), "The Absence of Degree of Automation Trade-Offs in
  Complex Work Settings", *Human Factors* — <https://doi.org/10.1177/0018720820904623>
- Parasuraman, R. & Manzey, D. (2010), "Complacency and Bias in Human Use of Automation",
  *Human Factors* 52(3), 381–410 — <https://journals.sagepub.com/doi/10.1177/0018720810376055>
- Jamieson, G.A. & Skraaning, G. (2018), "Levels of Automation in Human Factors Models for
  Automation Design", *J. Cognitive Engineering and Decision Making* 12(1), 42–49 —
  <https://journals.sagepub.com/doi/10.1177/1555343417732856>
- "Unsafe At Any Level" (2020), arXiv:2003.00326 — <https://arxiv.org/pdf/2003.00326>

**Angränsande discipliner — flyg och medicin:**

- 14 CFR 121.542, sterile cockpit — <https://www.law.cornell.edu/cfr/text/14/121.542>
- Two-challenge rule — <https://marjoriestieglermd.com/cockpit-culture-and-the-two-challenge-rule/>
- Besco, R.O. (1995), "Releasing the Hook on the Copilot's Catch 22", *Proc. HFES* 39(1) —
  <https://journals.sagepub.com/doi/10.1177/154193129503900106>
- PACE, graderad assertivitet — <https://psychsafety.com/pace-graded-assertiveness/>
- SBAR, Institute for Healthcare Improvement —
  <https://www.ihi.org/library/tools/sbar-tool-situation-background-assessment-recommendation>
- NEWS2, Royal College of Physicians —
  <https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/>
- Okuyama, A., Wagner, C. & Bijnen, B. (2014), "Speaking up for patient safety by hospital-based
  health care professionals", *BMC Health Services Research* 14:61 —
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC4016383/>

**Angränsande discipliner — SRE och change management:**

- Google SRE, Reliable Product Launches — <https://sre.google/sre-book/reliable-product-launches/>
- Google SRE, Canarying Releases — <https://sre.google/workbook/canarying-releases/>
- Google SRE, Embracing Risk (error budgets) — <https://sre.google/sre-book/embracing-risk/>
- Bezos, J., 2015 Letter to Amazon Shareholders (publicerat 2016) *(PDF-extraktion misslyckades;
  citat triangulerat)* —
  <https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF>
- Kindel, D. (2019), "One-Way and Two-Way Doors" — kritik mot reversibilitetsmodellen
