---
owner: marcus803
updated: 2026-08-08
review_by: 2026-11-08
status: stable
---

# UI: prototyp → produktion hos frontier-team — spec-bärare, visuella AC, apparatens ekonomi (RP1, 2026-08-08)

> **Proveniens.** Avgränsat research-pass (RP1) i S93:s processaudit. Förstapartskällor
> hämtade direkt: Anthropics `code.claude.com/docs` (best-practices, chrome,
> common-workflows, sub-agents), `anthropic.com/engineering/multi-agent-research-system`,
> `claude.com/blog/how-anthropic-teams-use-claude-code`,
> `anthropic.com/news/claude-design-anthropic-labs`, Anthropics `frontend-design`-plugin
> läst som råtext ur `anthropics/claude-code`, Matt Pococks `mattpocock/skills` läst som
> råtext på `main` (version 1.2.3, HEAD `84fdeffd12f2`, 2026-08-06T19:49:51Z) plus hans
> egen text på `aihero.dev`, Figmas egen blogg om Dev Mode MCP, Vercels egen blogg om nya
> v0, Chromatics egen dokumentation, Storybooks egen dokumentation och GitHubs egen blogg
> om Spec Kit. Interna läsningar: `ADR-102`, `ADR-074`, processauditens syntes (via
> `git show` på `origin/docs/s93-processaudit-underlag`), hub-pluginets `prototype`-skill
> med referensfiler. Inga filer utanför denna ändrades; inga git-muterande kommandon kördes.

---

## Kort svar — domen i klartext

**Ledarna konvergerar kring fyra saker, och vår form avviker på exakt en punkt som ingen
av dem delar.**

1. **Spec-bäraren är en körbar artefakt plus en adresserbar bunt — inte en bild.** Figma,
   som säljer bilder, säger själva rakt ut att bilden bär *design-intent* och inte är en
   spec att replikera ett-till-ett. Anthropics egen design-verktygsyta paketerar i stället
   *"everything into a handoff bundle"* — en adress, inte en katalog man ska hitta i.
2. **Den etablerade AC-formen för visuella artefakter är en LOOP, inte en mening.**
   Anthropics förstapartsformulering är ordagrant *"take a screenshot of the result and
   compare it to the original. list differences and fix them"* — kriteriet är en check
   utföraren själv kan köra och som producerar bevis, inte en bock en människa sätter.
3. **Apparat kontra direkt redigering avgörs vid en FAS-GRÄNS, med en ordnad frågelista
   där "fortsätt i samma session" ska uteslutas FÖRST.** Pocock har en explicit femvägs-
   beslutsträd för detta. Anthropic mäter multi-agent till *"about 15× more tokens than
   chats"* och skriver uttryckligen att *"most coding tasks involve fewer truly
   parallelizable tasks than research"*.
4. **Prototypen befordras ALDRIG till produktion hos Pocock — men den raderas inte
   heller.** Sedan hans PR `#763` parkeras den som primärkälla på en `prototype/<namn>`-gren
   **utanför main**, med en pekare till grenen på implementations-issuet. Vercels v0 är den
   tydliga motpolen: där ÄR prototypen produktionskoden.

**Avvikelsen som är vår egen:** ingen av de undersökta processerna håller prototyp och
skarp yta i **samma filer i main samtidigt under hela bygget**. Pocock river varianterna
och växlaren ur main när valet är gjort — *innan* implementationen börjar. Vi gör tvärtom
och blockerar rivningen tills bygget är godkänt (`ADR-102` B3). Det är den strukturella
källan till R7 (delad kod) och R8 (ingen mekanisk jämförelse) samtidigt, och den är inte
ärvd från Pocock — den föddes hos oss.

**Den avgörande delfrågan är (a).** Vi valde den svagaste spec-bäraren vi hade tillgång
till. Vi ÄGDE en körbar prototyp på en riktig URL med en riktig växlare, och gjorde
`facit-*.png` till facit-artefakten. Alla fyra rotorsaker i G1-klustret (adress,
AC-form, granskningsbevis, täckning) är följder av det valet, inte oberoende problem.

---

## Vad jag redan hade när jag började — inventering före sökning

**`docs/research/` innehåller 80 filer.** Ingen av dem täcker frågan. Närmast ligger:

| Fil | Vad den täcker | Åldrad? |
|---|---|---|
| `eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md` | Vår EGEN divergens-karta prototyp↔skarp | Nej (1 dygn) |
| `processaudit-syntes-och-grillningsunderlag-2026-08-08.md` | R1–R9-verdikt, K1–K8, G1–G6 | Nej (samma dag) |
| `arbetsflode-processgranskning-2026-07-23.md` | Extern Codex-granskning av arbetsflödet | Delvis — merge queue-punkten redan amenderad |
| `modell-tiering-frontier-praxis-2026-08-02.md` | Modellval per processteg | Nej, men annan axel |

**Ingen befintlig research undersöker UI-prototyp-processen hos ledarna.** Grepp över
`docs/research/` på `pocock`, `v0`, `shadcn`, `storybook`, `chromatic`, `builder.io` gav
tre träffar, samtliga i förbigående (`T86`-trådens ID nämnt i en tabellrad). Passet körs
därför i full bredd.

**Beslut som redan avgjort delar av frågan — lästa i sin helhet:**

- **[`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md)**
  slår fast B1–B5 (prototypen är facit; skarpa ska vara identisk; rivning först efter
  Marcus godkännande; AC ska peka på facit). ADR:n lämnar **uttryckligen tre frågor
  öppna** i sin § *Vad som INTE beslutas här*: om variant-formen ska överges, hur den
  mekaniska jämförelsen ska byggas, och vad facit är för ytor utan `facit-*.png`. Detta
  pass matar de tre — det river inget beslut.
- **[`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)**
  äger växlar-standarden och nyckel-livscykeln. `ADR-102` R7 bekräftar att den delade
  formen var ett medvetet val med ett verkligt värde (live-jämförelse).
- **Hub-pluginets `prototype`-skill** (`marcus-system`, version 1.32.0-eran) bär tvåfas-
  arbetsformen, facit-manifestet och kadens-låsningen. Den är vår adaptation av Pococks
  skill, inte en kopia.

**Åldersbedömning:** ämnet åldras snabbt. Pococks `prototype`-skill har ändrats i sak
sedan vi hämtade korpusen 2026-07-24 (se delfråga (d)) — den delen omprövades riktat mot
`main` per 2026-08-06. Anthropics `claude-code-best-practices` har **flyttat** från
`anthropic.com/engineering/` till `code.claude.com/docs/en/best-practices` (308-redirect,
mätt i detta pass) och skrivits om; den gamla textens formuleringar går inte längre att
citera som gällande förstapartstext.

---

## Delfråga (a) — vad är spec-bäraren för UI-arbete hos ledarna?

### BELAGT

**Anthropic (förstapart): spec-bäraren är "en check som ger pass eller fail", och för UI
är den formen en skärmdump jämförd mot en design.**

> *"Give Claude a check it can run: tests, a build, a screenshot to compare. It's the
> difference between a session you watch and one you walk away from."*
>
> *"The check is anything that returns a signal Claude can read in the conversation: a
> test suite, a build exit code, a linter, a script that diffs output against a fixture,
> or a browser screenshot compared against a design."*
>
> — `code.claude.com/docs/en/best-practices` § *Give Claude a way to verify its work*

Samma sida namnger den strukturella felklassen vi råkade ut för:

> *"**The trust-then-verify gap.** Claude produces a plausible-looking implementation that
> doesn't handle edge cases. **Fix**: Always provide verification (tests, scripts,
> screenshots). If you can't verify it, don't ship it."*

**Anthropic (förstapart): specen ska vara SJÄLVINNEHÅLLEN och peka ut sina egna filer.**

> *"The most useful specs are self-contained: they name the files and interfaces involved,
> state what is out of scope, and end with an end-to-end verification step that proves the
> feature works. Time spent making the spec precise pays off more than time spent watching
> the implementation."*
>
> — samma sida, § *Let Claude interview you*

**Anthropic (förstapart): adressen är en BUNT, inte en katalog.**

> *"When a design is ready to build, Claude packages everything into a handoff bundle that
> you can pass to Claude Code with a single instruction."*
>
> — `anthropic.com/news/claude-design-anthropic-labs`

**Figma (förstapart): bilden är INTE specen — den bär design-intent.**

> *"The value of this kind of visual information is more about what it tells us about
> design intent than it is a spec for the LLM to replicate one to one."*
>
> *"A screenshot combined with Figma's code outputs performs better than either on their
> own."*
>
> *"The right code is aligned to design intent, not just pixels."*
>
> *"By providing references to specific variables, components, and styles, the Figma MCP
> server can make generated code more precise, efficient, and reduce LLM token usage."*
>
> — `figma.com/blog/introducing-figma-mcp-server/`

**GitHub (förstapart): specen — inte koden — är sanningskällan i spec-driven development.**

> *"We're moving from 'code is the source of truth' to 'intent is the source of truth.'
> With AI the specification becomes the source of truth and determines what gets built."*
>
> *"Specs become the shared source of truth. When something doesn't make sense, you go
> back to the spec."*
>
> — `github.blog` § *Spec-driven development with AI*

**Storybook/Chromatic (förstapart): för komponentytor är STORYN spec-bäraren, och
baslinjen är dess bild.**

> *"Visual tests compare the rendered pixels of every story against known baselines."*
>
> — `storybook.js.org/docs/writing-tests/visual-testing`

En story är ett **namngivet tillstånd** av en komponent. Den är därmed både adress
(`Komponent/Tillstånd`) och körbar artefakt, och baslinjebilden är en derivata av den —
inte tvärtom.

**Pocock (förstapart): specen är prosa PLUS ett utdrag när prosan inte räcker — men aldrig
demon.**

> *"In either form, avoid specific file paths or code snippets — they go stale fast.
> Exception: if a prototype produced a snippet that encodes a decision more precisely than
> prose can (state machine, reducer, schema, type shape), inline it and note briefly that
> it came from a prototype. Trim to the decision-rich parts — not a working demo, just the
> important bits."*
>
> — `mattpocock/skills` `skills/engineering/to-tickets/SKILL.md`

Och adressen till själva prototypen bärs som en **pekare på implementations-issuet**:

> *"…so it is committed to a throwaway `prototype/<name>` branch out of main, never merged,
> with a context pointer to that branch left on the implementation issue."*
>
> — `aihero.dev/skills-prototype`

### TOLKAT (min syntes)

**Ingen av ledarna gör en PNG till den auktoritativa spec-bäraren.** De tre formerna som
faktiskt förekommer är: (i) en körbar artefakt med en adress (story, prototyp-gren,
prototyp-URL), (ii) en strukturerad spec-text med namngivna filer och en verifierings-
punkt, (iii) en bunt som paketerar bådadera med **en** instruktion.

Bilden förekommer överallt — men i **verifierings**-rollen, som jämförelsemål i en loop,
aldrig som den artefakt utföraren ska leta upp och tolka.

**Vad detta säger om vårt val.** `ADR-074` beslut 3 gjorde `facit-<yta>.png` till den
låsta artefakten och `facit.json` till dess manifest. Manifestet löser adress-problemet
korrekt — det är precis Anthropics "handoff bundle"-form, och skillens egen text säger
det rakt ut: *"Manifestet är passets leverabel… den enda adress nedströms-skillsen kan slå
upp facit på."* Men **innehållet** i bunten är den svagaste artefakten vi hade: en
stillbild av en yta vars körbara original låg kvar i repot, på en riktig URL, bakom en
DEV-grindad växlare. R1:s mätning — utförarna skrev *"bilderna finns inte i repot"* trots
att kedjan nämnde facit fem gånger — läses naturligt i den här ramen: kedjan pekade på en
**bild**, och en bild är en artefakt man kan misslyckas med att hitta. En URL med
`?variant=` är en artefakt man kan **köra**.

---

## Delfråga (b) — hur skrivs AC som refererar visuella artefakter?

### BELAGT

**Anthropic (förstapart) — den etablerade formen är en självkörande loop, ordagrant:**

| Strategi | Före | Efter |
|---|---|---|
| **Verify UI changes visually** | *"make the dashboard look better"* | *"\[paste screenshot] implement this design. take a screenshot of the result and compare it to the original. list differences and fix them"* |

— `code.claude.com/docs/en/best-practices`, tabellen i § *Give Claude a way to verify its
work* (verbatim, inklusive gemenerna)

Samma sida kräver **bevis, inte påstående**:

> *"Have Claude show evidence rather than asserting success: the test output, the command
> it ran and what it returned, or a screenshot of the result. Reviewing evidence is faster
> than re-running the verification yourself, and it works for sessions you weren't
> watching."*

Och den graderar hur hårt kriteriet spärrar:

> *"Once the check exists, decide how hard it gates the stop: **In one prompt**… **Across
> a session**: set the check as a `/goal` condition… **As a deterministic gate**: a Stop
> hook runs your check as a script and blocks the turn from ending until it passes…
> **By a second opinion**: a verification subagent… has a fresh model try to refute the
> result, so the agent doing the work isn't the one grading it."*

**Anthropic (förstapart) — det arkiverade formuleringen om iterationsantal.** Den
tidigare versionen av samma dokument (`anthropic.com/engineering/claude-code-best-practices`,
våren 2025) bar en explicit trestegsform: ge Claude en visuell mock, be den implementera,
skärmdumpa och iterera tills resultatet matchar mocken — *"The first version might be
good, but it's usually better after 2-3 rounds."* **URL:en 308-redirectar idag till
`code.claude.com/docs/en/best-practices`**, som inte längre bär den meningen.
Formuleringen är alltså belagd i en förstapartstext som inte längre är gällande, och jag
kunde bara verifiera den mot tredjepartsspeglingar (se § *Vad jag inte kunde belägga*).

**Anthropic (förstapart) — verifieringen har en namngiven arbetsform i browsern:**

> *"**Design verification**: build a UI from a Figma mock, then open it in the browser to
> verify it matches"*
>
> — `code.claude.com/docs/en/chrome` § *Capabilities*

**Chromatic (förstapart) — branschens skarpaste distinktion, och den vi saknar:**

> *"While UI Tests safeguard you from unintentional bugs, UI Review is where you discuss
> intentional changes with your team."*

Godkännandet är namngivet, personbundet och grindande:

> *"Assign one or more reviewers to provide feedback on the visual changes."*
>
> Alla tilldelade default-granskare *"must approve for the Review to pass"*, och statusen
> kan krävas i GitHub *"to ensure that impactful changes are considered by the team before
> merging."*
>
> — `chromatic.com/docs/review/`

**Storybook (förstapart) — accept-semantiken är tvågrenad och explicit:**

> *"If the changes are intentional, ✅ accept them as baselines locally. If the changes
> aren't intentional, fix the story and rerun the tests."*
>
> — `storybook.js.org/docs/writing-tests/visual-testing`

**Pocock (förstapart) — AC-mallen är tillstånds-form, aldrig defekt-form:**

> *"**What to build:** the end-to-end behaviour this ticket makes work, from the user's
> perspective — not a layer-by-layer implementation list."*
>
> — `to-tickets/SKILL.md`, `<issue-template>`

**Anthropic (förstapart) — granskaren ska bedöma mot kriterium, inte mot smak, och den
varnar för överdrift:**

> *"A reviewer prompted to find gaps will usually report some, even when the work is
> sound, because that is what it was asked to do… Tell the reviewer to flag only gaps that
> affect correctness or the stated requirements, and treat the rest as optional."*

### TOLKAT

**Det finns ingen etablerad SATSFORM av typen "matches design X in state Y".** Jag hittade
ingen sådan mall hos någon av de undersökta aktörerna. Det som finns är två andra saker,
och de bär tillsammans exakt det arbetet:

1. **Adressen ligger i artefaktens NAMN, inte i AC-meningen.** Storybook/Chromatic löser
   "state Y" genom att varje tillstånd är en egen story med ett eget namn och en egen
   baslinje. Kriteriet behöver då bara säga *"stories gröna"* — tillstånds-uppräkningen
   är strukturell.
2. **AC:t formuleras som en LOOP med bevisutgång**, inte som ett påstående om likhet.
   Anthropics rad är en instruktion i fyra led: implementera → skärmdumpa → jämför →
   lista skillnaderna och åtgärda. Den producerar en **skillnadslista** som artefakt.

`ADR-102` B5 föreskriver formen *"ytan är identisk med prototypen i läge X"*. Det är rätt
riktning mot R2:s defekt-form, men mätt mot ovanstående är den fortfarande ett
**påstående** en mottagare kan bocka. Ingen av ledarna skriver AC som påståenden om
likhet; de skriver dem som körningar som lämnar spår.

**Vår `145.2`-incident (kryss mot fel bild, tre dygn före låsningen) är exakt vad
Chromatics UI Review-form finns för att förhindra:** ett godkännande som är knutet till en
namngiven granskare och en specifik changeset, inte till en kryssruta i en DoD-lista.

---

## Delfråga (c) — när används agent-apparat kontra direkt redigering?

### BELAGT

**Pocock (förstapart) — den enda explicita beslutsregeln jag hittade i hela materialet.**
Fem alternativ, ordnade, och avgörandet hör hemma vid en fas-gräns:

> *"The **phase boundary** is the gap between two phases, and it is the only place this
> decision belongs. Mid-phase there is no decision to make — continue, or split the work
> that's left into subagents. Compacting mid-phase makes the agent lose the thread."*

Trädet, i ordning, med första ja som vinnare:

> **1.** *"Can you continue in this session? … Continue costs nothing and loses nothing, so
> rule it out before anything else."*
> **2.** *"Is the context irrelevant to what comes next?"* → `/clear`
> **3.** *"Do you need to hand off?"* → `/handoff` (ny harness, ny katalog, kollega,
> sidospår mitt i en fas)
> **4.** *"**Can the task be done AFK?** Is it scoped tightly enough to run with you away
> from the keyboard, no steering? Then send it to a **subagent** and leave this session
> untouched. Automated review is the standard case."*
> **5.** *"Otherwise, `/compact`."* — *"`/compact` is the **default, not the first reach**."*
>
> — `mattpocock/skills` `skills/engineering/ask-matt/PHASE-BOUNDARIES.md`

Och kostnadsmodellen som motiverar ordningen:

> *"Every move except **Continue** turns a **primary source** into a **secondary source** —
> the session as it happened, replaced by a summary of it."*

| Källa | Information | Brus | Rörelseutrymme |
|---|---|---|---|
| Primär (Continue) | Full | Mycket | Litet |
| Sekundär (`/compact`, `/handoff`) | Förlustbehäftad | Mindre | Stort |

**Pocock (förstapart) — prototyp är klassad HITL, aldrig AFK:**

> *"Every ticket is either **HITL** — human in the loop, worked *with* a human who speaks
> for themselves — or **AFK**, driven by the agent alone. A HITL ticket only resolves
> through that live exchange; the agent never stands in for the human's side of it."*
>
> *"**Prototype** (HITL): Raise the fidelity of the discussion by making a cheap, rough,
> concrete artifact to react to… Use when 'how should it look' or 'how should it behave'
> is the key question."*
>
> *"**Research** (AFK): … Resolved by a `/research` **subagent**."*
>
> — `skills/engineering/wayfinder/SKILL.md` § *Ticket Types*

**Anthropic (förstapart) — den mätta kostnaden och den explicita gränsen för kodning:**

> *"agents typically use about 4× more tokens than chat interactions, and multi-agent
> systems use about 15× more tokens than chats"*
>
> *"multi-agent systems require tasks where the value of the task is high enough to pay for
> the increased performance"*
>
> *"multi-agent systems excel at valuable tasks that involve heavy parallelization,
> information that exceeds single context windows, and interfacing with numerous complex
> tools"*
>
> *"some domains that require all agents to share the same context or involve many
> dependencies between agents are not a good fit for multi-agent systems today. For
> instance, **most coding tasks involve fewer truly parallelizable tasks than research**"*
>
> *"LLM agents are not yet great at coordinating and delegating to other agents in real
> time"*
>
> — `anthropic.com/engineering/multi-agent-research-system`

**Anthropic (förstapart) — tumregeln för ändringsstorlek, ordagrant:**

> *"For tasks where the scope is clear and the fix is small (like fixing a typo, adding a
> log line, or renaming a variable) ask Claude to do it directly."*
>
> *"Planning is most useful when you're uncertain about the approach, when the change
> modifies multiple files, or when you're unfamiliar with the code being modified. **If you
> could describe the diff in one sentence, skip the plan.**"*
>
> — `code.claude.com/docs/en/best-practices`

**Anthropic (förstapart) — subagenter kostar latens och startar blinda:**

> *"Latency matters. Subagents start fresh and may need time to gather context"*
>
> *"Each subagent starts with a fresh, isolated context window. It doesn't see your
> conversation history, the skills you've already invoked, or the files Claude has already
> read."*
>
> — `code.claude.com/docs/en/sub-agents`

Samma sida namnger undantaget som råkar vara vår kontext-återanvändningsfråga:

> *"A **fork** is a subagent that inherits the entire conversation so far instead of
> starting fresh… Use a fork when a named subagent would need too much background to be
> useful, or when you want to try several approaches in parallel from the same starting
> point."*

**Anthropic (förstapart) — vad subagenter faktiskt ÄR bra på i UI-sammanhang:** delegerad
läsning (*"Use subagents for investigation"*) och adversarial granskning i färsk kontext
(*"a reviewer running in a fresh subagent context sees only the diff and the criteria you
give it, not the reasoning that produced the change"*).

### TOLKAT

**Ingen av ledarna har en tröskel uttryckt i rader kod eller tokens.** Axeln är en annan,
och den är samstämmig över källorna: **behöver arbetet en människa i loopen?** Är svaret
ja är delegering fel form oavsett storlek — det är Pococks HITL/AFK-snitt och Anthropics
*"agents are not yet great at coordinating and delegating in real time"* som säger samma
sak från två håll.

**Vår mätta 3×-siffra (`T134`: 500–620k tokens per skiva mot 510k för tre i ett svep) och
Anthropics 15×-siffra mäter olika saker men pekar åt samma håll.** Anthropics siffra är
multi-agent mot chat; vår är per-skiva-spawn mot samlat svep. Det båda mäter är samma
strukturella kostnad: **kontext byggs från noll varje gång**, och `code.claude.com/docs/en/sub-agents`
bekräftar mekanismen ordagrant (*"starts fresh… doesn't see… the files Claude has already
read"*).

**Vår kadens-låsning för konvergens-passet är belagd konvergent praxis, inte en lokal
egenhet.** Skillens punkt 5 (*"konvergens-varvet körs av den aktör som sitter med Marcus…
Delegera aldrig konvergens-varv"*) är exakt Pococks HITL-klassning av prototyp plus
Anthropics "continue costs nothing"-logik. Den delen av vår process behöver inte försvaras
— den behöver bara **utsträckas till fler skarvar** än prototyp-konvergensen.

---

## Delfråga (d) — "prototypen är facit": bygger någon två gånger?

Detta är den fråga där fältet faktiskt **divergerar**, och där vår form är mest ensam.

### BELAGT — Pocock: två artefakter, prototypen lämnar main, vinnaren skrivs om

> *"6. **Capture it when done.** Fold any validated decision into the real code, then
> capture the prototype itself as a **primary source**: commit it to a throwaway branch,
> out of main, and leave a context pointer to that branch on the implementation issue.
> Capture the answer too — the verdict and the question it settled — in the issue or a
> commit. **The main branch keeps only the validated decision.**"*
>
> — `skills/engineering/prototype/SKILL.md`

Städningen sker **när valet är gjort — före implementationen**, inte efter:

> *"**Sub-shape A** — fold the winner into the existing page; drop the losing variants and
> the switcher from main."*
>
> *"The full set of variants is the primary source, so it lands on the throwaway branch,
> not the bin — **variant components and the switcher left in the main branch rot fast and
> confuse the next reader.**"*
>
> — `skills/engineering/prototype/UI.md` § 6

Och befordran är ett namngivet antimönster:

> *"**Promoting the prototype directly to production.** The variant code was written under
> prototype constraints (no tests, minimal error handling). Rewrite it properly when you
> fold it in."*
>
> — samma fil, § *Anti-patterns*

Pococks egen formulering av vad som ändrades i `#763`:

> *"The prototype is the runnable evidence the answer came from, and it is not deleted. It
> doesn't belong in main either… so it is committed to a throwaway `prototype/<name>`
> branch out of main, never merged."*
>
> *"What changed is where the code lives, not the discipline — it still never merges into
> main."*
>
> — `aihero.dev/skills-prototype`

**Denna ändring är efter vår korpus-hämtning.** `T86`-tråden daterar korpus-landningen till
2026-07-24; ändringen står i `mattpocock/skills` CHANGELOG under PR `#763` som *"Throwaway
no longer means deleted"*. Vår `references/UI.md` § 6 bär den äldre semantiken —
skärmdump + `[PROTOTYPE]`-SHA + återupplivning ur git-historiken — vilket är
**funktionellt närliggande** (beviset överlever utanför main) men saknar den namngivna,
adresserbara `prototype/<namn>`-grenen.

### BELAGT — Vercel v0: EN artefakt, prototypen ÄR produktionen

> *"Every prompt generates production-ready code in a real environment, and it lives in
> your repo."*
>
> *"A new Git panel lets you create a new branch for each chat, open PRs against main, and
> deploy on merge."*
>
> *"Designers work against real code, refining layouts, tweaking components, and previewing
> production with each update."*
>
> *"Instead of engineers spending weeks on re-writes for production, v0's new sandbox-based
> runtime can import any GitHub repo."*
>
> — `vercel.com/blog/introducing-the-new-v0`

Vercel angriper alltså **omskrivningen själv** som problemet — motsatt hållning mot
Pococks antimönster. Detta är en genuin oenighet i fältet, inte en nyansskillnad. Notera
dock skillnaden i vad ordet "prototyp" betyder: v0:s artefakt föds i produktionens
kodbas med produktionens komponentbibliotek; Pococks föds under uttalade
prototypbegränsningar (inga tester, minimal felhantering). **Oenigheten handlar lika
mycket om artefaktens födelsevillkor som om befordran.**

### BELAGT — Builder.io Fusion: en artefakt, med kodbas-koppling som fidelitets-villkor

> *"For the highest level of design and code fidelity, a repository connection is required.
> Without it, Builder is able to generate designs that match your design system, but is
> unable to leverage your own repository's components."*
>
> — `builder.io/c/docs/fusion-design-system-intelligence`

### BELAGT — Anthropic: designfil matas in, autonom loop bygger, människan granskar

> *"Members of the Product Design team would feed Figma design files to Claude Code and
> then set up autonomous loops where Claude Code writes the code for the new feature, runs
> tests, and iterates continuously."*
>
> *"They give Claude abstract problems, let it work autonomously, then review solutions
> before final refinements."*
>
> — `claude.com/blog/how-anthropic-teams-use-claude-code`

Och från Claude Design:

> *"Including design intent in Claude Code handoffs has made the jump from prototype to
> production seamless."* (Olivia Xu, Brilliant — kundcitat i Anthropics egen text)

Anthropic tar **inte** ställning i två-artefakt-frågan i någon text jag hittade. Deras
process har en designartefakt och en kodartefakt, och bunten är bron.

### TOLKAT

**Precedent-räkningen för "bygg två gånger", ärligt:**

| Aktör | Antal artefakter | Prototypen befordras? | Var bor prototypen? |
|---|---|---|---|
| Pocock (`mattpocock/skills` 1.2.3) | Två | **Nej** — uttryckligt antimönster | `prototype/<namn>`-gren, aldrig i main |
| Vercel v0 | En | **Ja** — det är designmålet | Samma repo, samma gren-flöde |
| Builder.io Fusion | En | Ja, med kodbas-koppling som villkor | Samma repo |
| Anthropic (Claude Design → Claude Code) | Två (design + kod) | Ej uttalat | Designytan, separat från repot |
| Figma (Dev Mode MCP) | Två (design + kod) | Nej — designen är intent, inte pixelspec | Figma-filen |
| **Vår form (`ADR-102`/`ADR-074`)** | **Två — samtidigt i SAMMA filer i main** | Nej (klausul iv) | **main, DEV-grindad, tills godkänt** |

**Ingen aktör delar vår hemvist.** Två-artefakt-antagandet i sig är väl belagt (fyra av
fem har det i någon form) — men **var den andra artefakten bor** är där vi står ensamma,
och det är den variabeln som producerar R7 och R8.

**Detta är en första-principer-observation, inte en åsikt:** "prototypen är facit" och
"prototypen bor i skarpa kodens filer" är två oberoende beslut som vi har buntat ihop.
Pocock håller det första (prototypen är primärkällan som svaret kom ur) och förkastar det
andra (den bor utanför main). Ingenting i `ADR-102`:s B1–B5 kräver samlokalisering — den
kommer från `ADR-074`, som fattades för ett annat syfte (live-växling under
divergens-passet).

**Och samlokaliseringens motiv upphör vid en känd tidpunkt.** `ADR-074`:s värde är att
Marcus kan växla live och jämföra — vilket är ett **divergens- och konvergens**-behov.
När facit är låst är valet gjort; det som återstår är att bygga mot en fastställd
referens, och där byter samma mekanism roll från hjälpmedel till risk. `ADR-102` R7 mäter
priset: `protoAktiv` defaultar till `false`, tre block läser `?variant` oberoende, och en
halv rivning ger blandläge.

---

## Mönster-sammanfattning — var ledarna konvergerar och var de divergerar

### Konvergens (fyra punkter, samtliga med minst tre oberoende källor)

1. **Verifiering är en körbar loop med bevisutgång, inte en bock.** Anthropic
   (skärmdumps-loopen, "show evidence"), Chromatic (UI Review-status som grindar merge),
   Storybook (accept-eller-fixa), GitHub Spec Kit ("you don't move to the next one until
   the current task is fully validated").
2. **Den som gör arbetet ska inte vara den som betygsätter det.** Anthropic (*"so the
   agent doing the work isn't the one grading it"*), Pocock (`code-review` som två
   parallella subagenter med separata axlar), Chromatic (tilldelade granskare).
3. **Bilden bär intent; koden bär mekanik.** Figma (uttryckligt), Anthropic (bilden är
   jämförelsemål i en loop, inte specen), Pocock (utdraget får in i ticketen, aldrig
   demon), `ADR-100` hos oss (koden äger beteendet) — vår egen sanningshierarki säger
   redan detta.
4. **Delegering avgörs av HITL/AFK, inte av storlek.** Pocock (ticket-typerna), Anthropic
   (*"most coding tasks involve fewer truly parallelizable tasks than research"* +
   subagentens färska kontext), och båda placerar automatiserad granskning som
   standardfallet för AFK.

### Divergens (två punkter, äkta oenighet)

1. **Ska prototypen befordras?** Pocock: aldrig (antimönster). Vercel/Builder: ja, det är
   hela poängen. Skiljelinjen följer artefaktens födelsevillkor: föds den under
   prototypbegränsningar ska den skrivas om; föds den i produktionens kodbas med
   produktionens komponenter finns inget att skriva om.
2. **Hur strikt är "identisk"?** Storybook/Chromatic kör pixeljämförelse mot baslinje som
   hård grind. Figma säger uttryckligen att pixel-ett-till-ett är fel mål och att intent
   är rätt mål. Applitools/Percy-klassen ligger emellan med "meningsfulla skillnader"
   snarare än pixeldiff (tredjepartsbelagt, se § *Vad jag inte kunde belägga*).

### En distinktion vi saknar helt — och som är gratis att införa

Fältet skiljer på **två olika visuella grindar** som vi har buntat ihop i DoD #6:

| Grind | Jämför | Fångar | Vår motsvarighet |
|---|---|---|---|
| **Visuell regression** | bygge mot föregående bygge | *oavsiktliga* ändringar | `npm run test:visual` (baslinje stale, `T87` pausad) |
| **Design-QA / UI Review** | bygge mot **facit** | glapp mellan *intent* och utförande | saknas — DoD-bocken var allt vi hade |

`ADR-102` R8:s stödmening föll i auditen just på denna sammanblandning: en färsk
visual-baslinje hade inte fällt en enda av A1–A6, eftersom en färsk baslinje är
regressions-instrumentet och avvikelsen var en design-QA-avvikelse. **Distinktionen är
Chromatics egen och den är förstapartsbelagd** — det är inte en modell jag konstruerat i
efterhand.

---

## Relevans-mappning mot grillningarna

### G1 — facit-kedjan: adress, AC-form, granskningsbevis

**Materialet ger fyra konkreta beslutsunderlag, ordnade efter styrka.**

1. **Adress-frågan har ett förstapartssvar: en BUNT med EN instruktion**
   (`anthropic.com/news/claude-design-anthropic-labs`). `facit.json` är redan den formen.
   **Den öppna frågan är inte om manifestet ska finnas, utan vad det ska innehålla** —
   och materialet säger entydigt att en körbar adress (URL + `?variant=`-nyckel +
   gren/SHA) bär mer än en bildsökväg. Ett manifest som bär *båda* matchar Figmas mätta
   observation ordagrant: *"A screenshot combined with Figma's code outputs performs better
   than either on their own."*
2. **AC-formen bör vara en loop med skillnadslista som utgång**, inte ett likhets-
   påstående. Anthropics rad är direkt återanvändbar i svensk översättning och kräver
   ingen ny mekanism: *implementera → skärmdumpa → jämför mot facit → lista skillnaderna
   → åtgärda.* Detta är starkare än `ADR-102` B5:s nuvarande form.
3. **Granskningsbeviset har en färdig branschform i Chromatics UI Review**: namngiven
   granskare, knuten till en changeset, blockerar merge. Vår `145.2`-incident (kryss mot
   fel bild) är exakt det den formen förhindrar. Notera vad den INTE kräver: ingen
   automatisk pixeljämförelse behövs för att stänga hålet — det räcker att godkännandet
   är personbundet och changeset-bundet.
4. **Täckningsfrågan (36 grenar utanför manifestet) har en strukturell lösning i
   Storybook-modellen**: när varje tillstånd är en namngiven artefakt är frånvaro synlig
   per konstruktion. Vår skill har redan halva regeln (*"Varje yta passet rörde ska ha en
   rad, även de utan låst bild"*) — det som saknas är att **manifestets ytlista härleds ur
   koden** i stället för att skrivas för hand.

**Vad materialet INTE stöder:** att lösa R1 med mer text i fler skills. Anthropics egen
varning är rakt på sak — *"If Claude keeps doing something you don't want despite having a
rule against it, the file is probably too long and the rule is getting lost."* R1:s
mätning (facit nämnt fem gånger i kedjan, ändå tappat) är den varningen i vår kodbas.

### G4 — skivning och spec-disciplin

**Pococks vertikal-skiva-regel är hämtad ordagrant och bör läsas mot R9.** Reglerna är:
*"Each slice cuts a narrow but COMPLETE path through every layer… A completed slice is
demoable or verifiable on its own… Each slice is sized to fit in a single fresh context
window."*

**R9:s felklass syns i den mellersta satsen.** `145.1`/`145.3` var inte demonstrerbara var
för sig som separata ytor — de var en gren i koden (`Deltagare.tsx:1652` + `:2103`).
Kriteriet *"demoable or verifiable on its own"* hade fällt snittet innan det gjordes.

**Åtgärds-ytans ägarlöshet har en direkt motsvarighet i mallens första rad:** *"What to
build: the end-to-end behaviour this ticket makes work"* — en yta utan beteende-mening i
någon ticket har ingen ticket. Storybook-modellen ger dessutom den mekaniska formen: en
yta som har en namngiven artefakt (story/facit-rad) och ingen ticket är en **mätbar**
lucka, inte en bedömningsfråga.

**Spec-fels-vakten (K3, sex fel i rad) matchar Anthropics granskningsform**, men
adresserad till uppdragstexten i stället för till diffen: *"see only the diff and the
criteria you give it, not the reasoning that produced the change"*. Motsvarigheten för ett
uppdrag är en granskare som ser **uppdragstexten och kortet**, aldrig orkestrerarens
resonemang.

### G5 — apparatens ekonomi och leveransvägen

**Detta är den grillning materialet ger mest färdig struktur åt.**

1. **Beslutsregeln finns färdig och är ordnad.** Pococks femvägs-träd är direkt
   applicerbart, med den viktiga inversionen mot vår vana: *"Continue costs nothing and
   loses nothing, so rule it out before anything else."* Vår default är motsatt —
   apparat först, direkt redigering som undantag.
2. **Fas-gräns-regeln träffar `T126`:s felklass.** *"Mid-phase there is no decision to
   make."* Vår leveranskadens har fattat apparatbeslut mitt i faser (per skiva), vilket är
   precis den plats trädet säger att beslutet **inte** hör hemma.
3. **HITL/AFK-axeln ersätter storleksfrågan.** Frågan *"är detta för litet för en agent?"*
   är fel fråga; frågan är *"kräver detta Marcus i loopen?"*. Vår konvergens-kadens svarar
   redan rätt för prototyp-passet; G5:s uppgift är att pröva om samma snitt gäller för
   fler skarvar.
4. **Kontext-återanvändningen har en namngiven mekanism vi inte använder:** `fork`
   (`code.claude.com/docs/en/sub-agents`) — en subagent som ärver hela konversationen i
   stället för att starta blind. Anthropics egen motivering är exakt vår K4: *"Use a fork
   when a named subagent would need too much background to be useful."* **Detta är ett
   oväntat fynd utanför frågan — se § Oväntade fynd.**
5. **15×-siffran ger G5 en extern referenspunkt för vår 3×-mätning**, och den kommer med
   ett villkor som är värt att citera i grillningen: *"multi-agent systems require tasks
   where the value of the task is high enough to pay for the increased performance."*
   Marcus egen formulering — *"Vi kodar ju inte ett nytt Google liksom"* — är samma test.

### G3 (matas indirekt, var deklarerad som OMÄTT i syntesen)

Syntesen bokförde branschprecedent för G3:s options-rymder som omätt. Detta pass fyller
delvis luckan: **precedent finns för variant-formen (O1–O4) i Pococks `?variant=`-mönster**
— vilket är vår källa till formen — **men med en avgörande skillnad i livslängd**:
Pococks varianter lämnar main när valet är gjort. Ingen källa jag hittade behåller en
variant-växlare i main under implementationsfasen. Detta gör O2/O4 (separation respektive
minimal härdning) bättre belagda än de var, utan att avgöra valet.

För den mekaniska jämförelsen (R8) ger passet en **ny option som inte fanns i O1–O4**:
Chromatics UI Review-form, alltså en personbunden godkännandegrind **utan** automatisk
bildjämförelse. Den fäller inte VILKEN yta som är rätt — men det gjorde ingen av O1–O4
heller, enligt syntesens egen not (*"endast Marcus öga avgör VILKEN som är rätt"*).

---

## Öppen deklaration: var precedent-rymden är tunn

**Rymden är tunn på tre punkter, och räkningen fejkas inte.**

1. **"Prototyp-kod i produktionens kodbas under bygget"** — jag hittade **noll**
   dokumenterade precedent. Det betyder inte att formen är fel; det betyder att jag inte
   kan stödja den med någon annans erfarenhet, och att ett beslut att behålla den vilar
   helt på vår egen mätning av `ADR-074`:s värde.
2. **Konvergens-fasen** — Pocock har ingen. Hans UI-process slutar vid *"I want the header
   from B with the sidebar from C"* och går sedan till spec. Vår tvåfas-form (`T66`) är en
   egen konstruktion vars externa förankring är NN/g:s parallell-mot-iterativ-empiri och
   Double Diamond, inte en agent-arbetsflödes-precedent. **Ingen av de undersökta
   AI-processerna har en iterativ konvergens-fas med människan i webbläsaren.** Det gör
   inte formen fel — vår mätning `TASK-127.2` (10–30 min per varv genom
   landnings-maskineriet) är verklig och egen — men vi bör sluta anta att den är ärvd.
3. **Skarpa AC-mallar för visuella artefakter** — jag hittade ingen etablerad satsform
   ("matches design X in state Y") hos någon aktör. Det som finns är loop-formen och
   namngivna tillstånds-artefakter. **Frånvaron av mall är ett fynd**, inte ett
   sökmisslyckande: fältet löser adresseringen strukturellt i stället för språkligt.

**Där rymden är TÄT och räkningen håller:** verifierings-loopen (fyra oberoende
förstapartskällor), granskarens oberoende (tre), och bilden-som-intent (tre).

---

## Vad jag inte kunde belägga

- **"2-3 rounds"-meningen i sin gällande förstapartsform.** Den stod i
  `anthropic.com/engineering/claude-code-best-practices`, som idag 308-redirectar till
  `code.claude.com/docs/en/best-practices` — där meningen är borta. Jag kunde bara
  verifiera den mot tredjepartsspeglingar (gists, kursmaterial), inte mot förstapart eller
  arkiv (`web.archive.org` är blockerat för mitt hämtningsverktyg). **Behandla iterations-
  antalet som obelagt**; loop-formen i sig är däremot förstapartsbelagd i nuvarande text.
- **Applitools/Percys "meningsfulla skillnader mot pixeldiff".** Jag hämtade inte deras
  förstapartsdokumentation — påståendet vilar på en sökresultatsammanfattning och en
  marknadsförings-nära tredjepartskälla. Behandla klassen som en **hypotes** tills den
  prövats direkt.
- **Chromatics UI Review-grind mot merge i praktiken.** Jag citerar deras dokumentation
  för att statusen KAN krävas; jag har inte belagt hur många team som faktiskt gör det
  obligatoriskt.
- **Vercel v0:s faktiska produktionsutfall.** Citaten är från Vercels egen blogg, alltså
  förstapart men marknadsförande. Jag har ingen oberoende mätning av om kod från v0
  faktiskt landar i produktion utan omskrivning.
- **Anthropics interna designteams process i detalj.** Kundcase-texten på `claude.com/blog`
  är förstapart men sammanfattande; jag har inget om huruvida de bygger något två gånger.
- **Om Pococks `#763`-ändring har prövats i praktiken.** Ändringen är daterad och
  publicerad; jag har ingen mätning av hur den fungerar över tid.
- **Builder.io Fusions dokumentation i sin helhet.** Ett citat hämtat via sökning, inte via
  direktläsning av deras dokumentationsportal.

---

## Rekommendation — MITT FÖRSLAG, inte ett beslut

Riktat till grillningarna, i den ordning som ger mest per krona:

1. **G1 först, och smalt: byt vad bunten INNEHÅLLER, inte om den ska finnas.** Låt
   `facit.json` bära den **körbara** adressen (route + `?variant=`-nyckel + prototyp-SHA)
   vid sidan av bilderna. Figmas mätning säger att kombinationen slår båda var för sig.
   Detta är en additiv ändring i en fil som redan finns och redan grindas.
2. **Byt B5:s AC-form från påstående till loop.** Anthropics formulering översatt, med
   skillnadslistan som leverabel. En AC som producerar en artefakt kan granskas; en AC som
   påstår likhet kan bara bockas.
3. **Skilj design-QA från visuell regression i DoD.** Två poster, två syften. Detta rättar
   `ADR-102` R8:s stödmening utan att bygga något nytt, och det gör `T87`:s paus mindre
   akut — regressions-sviten var aldrig rätt instrument för facit-avvikelser.
4. **Ta upp hemvist-frågan i G3 som en egen fråga, skild från "är prototypen facit".**
   Materialet visar att de är två oberoende beslut som vi buntat. Precedent-rymden för vår
   nuvarande hemvist är tom — det är ett argument för att pröva den, inte för att riva den
   oprövad.
5. **G5: anta Pococks fas-gräns-träd som utgångspunkt, inte som färdig regel.**
   Inversionen (uteslut "fortsätt" först) är den enskilt största beteendeändringen i hela
   materialet, och den kostar noll att prova.
6. **Undersök `fork` innan G5 landar.** Se nedan.

---

## Oväntade fynd utanför frågan — registrerade, inte tyst förkastade

1. **`fork` som subagent-form är en direkt kandidat för K4:s kontext-återanvändning, och
   den fanns i förstapartsdokumentationen hela tiden.** *"A fork is a subagent that
   inherits the entire conversation so far instead of starting fresh… The fork's own tool
   calls still stay out of your conversation and only its final result comes back."*
   (`code.claude.com/docs/en/sub-agents`). Vår 3×-mätning i `T134` mätte spawn-från-noll;
   fork mäter en annan sak. **Detta bör mätas innan G5 fattar beslut om kontext-
   återanvändning.** Blockerar inte; värdefullt → tråd-kandidat.
2. **`anthropic.com/engineering/claude-code-best-practices` 308-redirectar till
   `code.claude.com/docs/en/best-practices`, och texten är omskriven.** Varje citat vi bär
   från den gamla sidan i ADR:er, skills eller lessons riskerar att vara ur en text som
   inte längre finns. **Detta är en `ADR-100`-fråga** (vem äger sanningen om en extern
   källa som flyttat). Blockerar inte; bokförs.
3. **Anthropic har ett förstapartsplugin, `frontend-design`, i `anthropics/claude-code`.**
   Dess `SKILL.md` handlar om estetisk kvalitet och innehåller en observation som är direkt
   relevant för divergens-passets *"radikalt olika"*-krav: AI-genererad design klustrar
   kring tre igenkännbara utseenden (varm cream + serif + terrakotta; nästan-svart + en
   syrlig accent; broadsheet med hårfina linjer), och skillen kallar dem *"defaults rather
   than choices"*. Vår divergens-fas har inget skydd mot att tre "radikalt olika" varianter
   landar i tre AI-defaults. Låg brådska; hör hemma i `/prototype`-skillens nästa
   iteration.
4. **Pocock klassar `research` som AFK och `prototype` som HITL i samma tabell.** Vår egen
   skill-uppsättning gör samma sak i praktiken men har aldrig skrivit ned axeln. Att göra
   HITL/AFK till en **deklarerad etikett per kort** är en liten ändring med
   G5-relevans — och `/to-issues` bär redan AFK/HITL-etikett per skiva enligt sin
   beskrivning, så halva vägen är gången.

---

## Källförteckning

### Förstapart — Anthropic

- Best practices for Claude Code — <https://code.claude.com/docs/en/best-practices>
  (`anthropic.com/engineering/claude-code-best-practices` 308-redirectar hit)
- Use Claude Code with Chrome — <https://code.claude.com/docs/en/chrome>
- Common workflows — <https://code.claude.com/docs/en/common-workflows>
- Create custom subagents — <https://code.claude.com/docs/en/sub-agents>
- How we built our multi-agent research system —
  <https://www.anthropic.com/engineering/multi-agent-research-system>
- How Anthropic teams use Claude Code —
  <https://claude.com/blog/how-anthropic-teams-use-claude-code>
- Claude Design by Anthropic Labs —
  <https://www.anthropic.com/news/claude-design-anthropic-labs>
- `frontend-design`-pluginets SKILL.md —
  <https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md>

### Förstapart — Matt Pocock

Repo `mattpocock/skills`, version 1.2.3, HEAD `84fdeffd12f2`, 2026-08-06.

- `prototype/SKILL.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md>
- `prototype/UI.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/UI.md>
- `ask-matt/PHASE-BOUNDARIES.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/PHASE-BOUNDARIES.md>
- `ask-matt/SKILL.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md>
- `to-tickets/SKILL.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/to-tickets/SKILL.md>
- `to-spec/SKILL.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/to-spec/SKILL.md>
- `code-review/SKILL.md` —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md>
- `wayfinder/SKILL.md` (HITL/AFK) —
  <https://github.com/mattpocock/skills/blob/main/skills/engineering/wayfinder/SKILL.md>
- CHANGELOG (PR `#763`, "Throwaway no longer means deleted") —
  <https://github.com/mattpocock/skills/blob/main/CHANGELOG.md>
- The `/prototype` Skill — <https://www.aihero.dev/skills-prototype>

### Förstapart — övriga leverantörer

- Figma: Introducing our Dev Mode MCP server —
  <https://www.figma.com/blog/introducing-figma-mcp-server/>
- Vercel: Introducing the new v0 — <https://vercel.com/blog/introducing-the-new-v0>
- Chromatic: UI Review — <https://www.chromatic.com/docs/review/>
- Storybook: Visual tests — <https://storybook.js.org/docs/writing-tests/visual-testing>
- GitHub: Spec-driven development with AI —
  <https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/>
- Builder.io: Fusion Design System Intelligence —
  <https://www.builder.io/c/docs/fusion-design-system-intelligence>

### Interna källor lästa i detta pass

- [`ADR-102`](../decisions/ADR-102-prototypen-ar-facit-skarpa-ska-vara-identisk.md) — i sin
  helhet
- [`ADR-074`](../decisions/ADR-074-prototyp-substratets-adress-struktur-och-vaxlar-standard.md)
- `docs/research/processaudit-syntes-och-grillningsunderlag-2026-08-08.md` (via `git show`
  på grenen `origin/docs/s93-processaudit-underlag`; ännu ej i arbetsträdet)
- [`eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md`](eventsidan-prototyp-mot-skarpa-facitkarta-2026-08-07.md)
- Hub-pluginets `prototype`-skill med `references/UI.md` och
  `references/throwaway-kontraktet.md`
- `tasks/threads/T86-pocock-v11-integrationen.md` (korpus-proveniens och hämtningsdatum)
