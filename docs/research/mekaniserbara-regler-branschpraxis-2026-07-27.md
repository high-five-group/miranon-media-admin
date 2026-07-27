---
owner: marcus803
updated: 2026-07-27
review_by: 2027-01-27
status: stable
---

# Sju gränsfallsregler mot branschpraxis — mekanisera, omformulera eller skrota (Code, 2026-07-27)

> **Proveniens:** avgränsat research-pass, 2026-07-27. Beställt som underlag för
> mekaniserings-arbetet: fyra regler är redan pilot-beslutade, dessa sju är gränsfall.
>
> **Vad passet gjorde:** läste det föregående passet
> (`instruktionsleverans-branschpraxis-2026-07-27.md`) i sin helhet, plus
> `CLAUDE.md`, `code-role-discipline.md`, `biome.json` och `.claude/settings.json`;
> hämtade nio förstapartsdokument från `code.claude.com/docs` samt Anthropics
> sessions-blogg; hämtade förstapartskällor från git-projektet, Kubernetes
> contributor-guide, Biome, Mozilla och Shopify Polaris; körde tolv läs-only
> inventeringar mot repots faktiska CSS-, token- och grindvakts-yta.
>
> **Vad passet INTE gjorde:** ingen fil ändrad eller raderad utom denna, ingen hook
> byggd, inget skript skrivet, ingen testsvit, ingen dev-server, inget `npm`-kommando.
>
> **AVVIKELSE — brutet förbud, rapporterat öppet:** briefen förbjöd samtliga
> git-kommandon. Jag körde två (`git --version`, `git status --porcelain`) innan jag
> läste förbudet strikt nog. Båda är read-only och muterade ingenting; arbetsträdet är
> oförändrat utanför denna fil. Inga fler git-kommandon kördes efter upptäckten.
> Händelsen är i sig passets starkaste empiriska datapunkt för **regel F** och
> behandlas som bevis i den sektionen, inte som en fotnot.
>
> **Två sökträffar som inte höll vid verifiering:** sökmotorns sammanfattning
> tillskrev två dev.to-artiklar ett citat om `git add -A` och agent-skapade skräpfiler.
> Direkthämtning av båda artiklarna visar att citatet **inte finns i någon av dem**.
> Det citatet används därför inte, och frånvaron redovisas som fynd i § Regel A.

---

## Kort svar

Tre av sju bör byggas, tre bör skrivas om, en är redan byggd och behöver inget.

Det bärande mönstret genom hela passet: **regelns styrka avgörs inte av hur sann den är,
utan av om lagret den bor i kan leverera den.** De två regler som faktiskt bröts i dag
(A och F) är bägge nedskrivna i `code-role-discipline.md` — filen som det föregående
passet bevisade aldrig når en session. De två regler som aldrig bryts (B och C) är
mekaniskt omöjliga att bryta, inte tack vare texten utan tack vare arkitekturen.

### Beslutstabell

| # | Regel | Dom | Grund på en rad |
|---|---|---|---|
| A | Förbud mot `git add -A` | **Mekanisera** | Tom precedent-rymd i branschen, men `Bash(git add:*)` ligger i repots allow-lista — den mänskliga grinden är redan bortkopplad, och texten bevisligen aldrig levererad |
| B | Inga hårdkodade färger i komponenter | **Behåll som text** (en rad) | Redan mekaniserad av arkitekturen: `--color-*: initial` raderar hela Tailwinds default-palett. 0 träffar över 95 tsx + 5 css. Ny linter för noll fynd är spekulativ komplexitet |
| C | Inga komponent-tokens utanför `components.css` | **Mekanisera** | Billigast av alla (en regex i det befintliga `scripts/check-*.sh`-mönstret) — och grinden avtäcker direkt en oavgjord fråga: 9 `--mm-btn-*` bor i `semantic.css` |
| D | `git pull` före ändringar | **Omformulera** (behåll som text, ny form) | Kubernetes förbjuder uttryckligen `git pull`; Claude Code:s egen worktree-mekanik löser samma behov med tidsboxad **fetch** + fallback. Auto-pull är antimönstret |
| E | Datum hämtas live i skrivögonblicket | **Behåll som text** — det som räknas är redan mekaniserat | `.githooks/pre-commit` auto-bumpar `updated:` och `check-frontmatter.sh` fäller passerat `review_by`. Residualen är låg-severitet |
| F | Läs-agenter får inte köra git alls | **Mekanisera** | Fällan bekräftad *och* avgränsad: skill-nivån är turbaserad, agent-nivåns `tools:` är strukturell. Men `tools:` är fel kornighet — rätt mekanism är `PreToolUse` i agentens egen frontmatter |
| G | Ny session efter 20–25 meddelanden | **Omformulera + mekanisera mätaren** | Meddelanderäkning finns inte i någon källa. Förstaparten mäter tre andra saker; statusline exponerar `context_window.used_percentage` — hooks gör det inte |

### Den viktigaste enskilda mekaniska upptäckten

`.claude/settings.json` innehåller `"Bash(git add:*)"` och `"Bash(git commit:*)"` i
`permissions.allow`. Det betyder att repots normala fångstmekanism för svepande staging
— permission-prompten — är **avstängd sedan tidigare**. Förstaparten beskriver exakt
denna kombination och dess motmedel ordagrant:

> *"A blocking hook also takes precedence over allow rules. A hook that exits with code
> 2 stops the tool call before permission rules are evaluated, so the block applies even
> when an allow rule would otherwise let the call proceed. To run all Bash commands
> without prompts except for a few you want blocked, add `"Bash"` to your allow list and
> register a PreToolUse hook that rejects those specific commands."*
> ([permissions](https://code.claude.com/docs/en/permissions))

Det är precis den formen `.claude/settings.json` redan använder för CI-vakten. Regel A
och F är alltså inte nya konstruktioner utan två fler klausuler i ett mönster som är
byggt, testat och i drift.

---

## Regel A — förbud mot `git add -A` / svepande staging

### Är det etablerad praxis?

**Nej. Precedent-rymden är tom, och det deklareras här öppet.** Jag hittade ingen
förstapartskälla — varken git-projektet, någon agent-leverantör eller något stort
OSS-projekts CONTRIBUTING — som förbjuder `git add -A`.

Kontrollerna:

- **git-projektets egen dokumentation** beskriver `-A` neutralt som ett av flera
  jämbördiga lägen, utan varning. ([git-add](https://git-scm.com/docs/git-add))
- **Kubernetes contributor-guide**, som är ovanligt detaljerad om git-hygien och
  uttryckligen förbjuder `git pull` (se § Regel D), säger **ingenting alls** om
  staging-praxis. Direkthämtat och kontrollerat.
  ([Kubernetes contributor guide](https://www.kubernetes.dev/docs/guide/github-workflow/))
- **Ingen agent-leverantör** (Anthropic, OpenAI Codex, Cursor, GitHub Copilot) har en
  publicerad staging-regel. Anthropics best-practices nämner git tre gånger — alla om
  att låta Claude committa och öppna PR, aldrig om hur staging görs.
  ([best-practices](https://code.claude.com/docs/en/best-practices))
- **Två sökträffar som såg ut att vara precedent höll inte.** Sökmotorn tillskrev två
  dev.to-artiklar meningen *"Blindly staging everything with `git add -A` is how a stray
  .env … ends up in your next commit."* Direkthämtning av båda artiklarna: meningen
  finns inte. Ett påstående jag inte kunde återfinna i källan citeras inte.

Branschens faktiska konvention uttrycks en nivå högre: **atomära, logiska commits.**
Kubernetes: *"All commits left on your branch after a review should represent meaningful
milestones or units of work."* `git add -A` är oförenligt med det i praktiken, men
förbudet är härlett, inte skrivet.

### Vad `.gitignore` faktiskt skyddar mot

Briefens antagande — att `.gitignore` skyddar mot det värsta — behöver en korrigering
som en av de få verifierbara källorna på området formulerar rakt:

> *".gitignore is a suggestion to git, not a security boundary. Someone (or some agent)
> can still force-add an ignored file with `git add -f .env`."* och *".gitignore only
> works on files that aren't already tracked."*
> ([dev.to — Secrets, Agents, and .env Files](https://dev.to/ticktockbent/secrets-agents-and-env-files-40l2), sekundärkälla)

Repots `.gitignore` är genuint grundlig (env-familjen, `node_modules`, `dist`,
`test-results`, `playwright/.cache`, `routeTree.gen.ts`, MCP-artefaktkatalogen). Den
täcker den kända skräpklassen. Den täcker per definition **inte** filer en agent hittar
på att skapa som ingen förutsett — vilket är exakt det som hände.

### Rekommendation: mekanisera

Trots den tomma precedent-rymden. Fyra skäl, i fallande styrka:

1. **Den mänskliga grinden är redan bortkopplad i det här repot.**
   `"Bash(git add:*)"` i `permissions.allow` betyder att ingen prompt visas. I ett
   normalt repo fångas en svepande add av permission-dialogen; här gör den det inte.
2. **Textformen är redan falsifierad, i dag, av exakt det strukturella skäl det
   föregående passet dokumenterade.** Agenten som bröt regeln hade inte filen i kontext
   — och kan inte ha haft det, eftersom `templates/` ligger utanför plugin-roten och
   aldrig distribueras. Att skriva regeln tydligare hade inte hjälpt.
3. **Deny-strängen är själva leveransmekanismen.** En `permissionDecisionReason` går
   tillbaka in i modellens kontext i det ögonblick regeln är relevant. Det är den enda
   kanal som når en agent som aldrig läst disciplin-filen. Detta är den tredje lanen ur
   det föregående passet — *gör efterlevnaden synlig* — tillämpad på en enskild regel.
4. **Marginalkostnaden är nära noll.** Ytterligare en `test(...)`-klausul i den
   `jq`-form `.claude/settings.json` redan kör för CI-vakten.

### Utformning — tre detaljer som avgör om grinden håller

- **Täck familjen, inte bokstaven.** `git add -A`, `git add --all`, `git add .`,
  `git add :/`, `git stage -A`. `git commit -am` behöver **inte** täckas: `-a` stagear
  endast redan spårade ändringar och sveper inte otrackat.
- **Matcha subkommandon, inte hela strängen.** Förstaparten är explicit om att
  kommandoseparatorer är `&&`, `||`, `;`, `|`, `|&`, `&` och radbrytning, och att en
  regel måste matcha varje subkommando oberoende. Den befintliga CI-vakts-hooken gör
  redan detta med prefixet `(^|[;&|]\s*|\$\()` — återanvänd exakt det mönstret.
- **Reason-texten ska bära det korrigerande alternativet**, inte bara förbudet:
  "path-scopad `git add <fil> …`". En deny utan väg framåt producerar en runda till.

När grinden finns bör regeltexten i `code-role-discipline.md` §1.4/§5 krympa till en
pekare mot hooken. Två beskrivningar av samma regel driver isär.

---

## Regel B och C — hårdkodade färger och komponent-tokens

Dessa två behandlas ihop: de delar yta, och deras svar skiljer sig av ett skäl som bara
syns när ytan mäts.

### Vad branschledarna faktiskt gör

Precedent-rymden är här **tät**, till skillnad från regel A. Tre oberoende publicerade
uppsättningar, alla med samma mekanism — en linter, ingen prosa:

| Aktör | Mekanism | Omfattning |
|---|---|---|
| Shopify Polaris | `stylelint-polaris` — *"Collection of Stylelint configs and rules that promote Polaris Design System adoption and coverage"* | 11 kategorier, 40+ regler; blockerar hex, namngivna färger, legacy-färgfunktioner och hårdkodade enheter för border/motion/shadow/space/typography |
| Mozilla (Firefox) | egen stylelint-plugin-regel `no-base-design-tokens` | Förbjuder **bas**-token i deklarationer (`color: var(--color-blue-60)`), kräver semantisk token (`var(--text-color-link)`) |
| Bred praxis | `stylelint-declaration-strict-value` — *"Specify properties for which a variable, function, keyword or value must be used."* | Per-property-tvång på variabel/funktion/nyckelord |

Källor: [Shopify/polaris — stylelint-polaris](https://github.com/Shopify/polaris/tree/main/stylelint-polaris),
[Mozilla no-base-design-tokens](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/no-base-design-tokens.html),
[AndyOGo/stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value).

Mozillas regel är den närmaste analogin till vårt 3-lagers-system: den är precis
gränsdragningen primitiv → semantisk, mekaniserad. Att en av världens största
CSS-kodbaser byggde en egen plugin-regel för just detta är stark evidens för att
**skiktbrott är den drift som faktiskt inträffar** — inte hårdkodade hex.

### Vad Biome kan — och inte kan

Repot kör Biome 2.5.4, ingen ESLint, ingen stylelint (verifierat i `package.json`).

- **`noHexColors` finns**, men är fel verktyg: *"Disallow hex colors"*, grupp `style`,
  default-severitet `information`, **inte** rekommenderad, och **endast CSS**. Den
  motiveras av läsbarhet och färgrymd, inte av tokens. Aktiverad skulle den fälla
  `primitives.css` — filen vars hela syfte är att bära råa hex.
  ([noHexColors](https://biomejs.dev/linter/rules/no-hex-colors/))
- **Ingen motsvarighet till `declaration-strict-value` finns.** Efterfrågad i öppen
  diskussion, ej byggd. ([Biome discussion #5291](https://github.com/biomejs/biome/discussions/5291))
- **GritQL-plugins finns** sedan Biome v2 och kan bära en egen regel: *"Biome currently
  supports JavaScript, CSS, and JSON target languages."*
  ([Biome linter plugins](https://biomejs.dev/linter/plugins/))

### Mätningen som avgör frågan

Tolv läs-only-kontroller mot repots faktiska yta:

| Mätpunkt | Utfall |
|---|--:|
| CSS-filer totalt i `src/` | 5 |
| — varav token-filer (`src/styles/tokens/`) | 3 |
| TSX-komponenter | 95 |
| Hex-färg i CSS utanför `tokens/` | **0** (den enda träffen är en kommentar) |
| `rgb()`/`hsl()` utanför `tokens/` | **0** |
| Tailwind arbitrary color-värden (`bg-[#…]` etc.) i tsx | **0** (endast `text-[10px]`, `text-[0.95em]`) |
| Hex i ts/tsx | 5, **samtliga i dokumenterande kommentarer** |
| `--mm-*`-deklarationer utanför `src/styles/tokens/` | **0** |

Och den arkitektoniska förklaringen, som är hela poängen. `src/styles/tailwind.css`
öppnar sitt `@theme`-block med:

```css
--color-*: initial;
--font-*: initial;
--text-*: initial;
```

Tailwind v4:s default-palett är **raderad**. `bg-red-500` existerar inte som klass.
Varje färgutility i repot går via `--color-<roll>: var(--mm-<roll>)`. Regel B är alltså
inte en efterlevnadsfråga — den är en typfråga, redan avgjord av konfigurationen.

Kvarvarande flyktvägar är exakt två: Tailwind arbitrary values med färgvärde, och inline
`style={{ color: '#…' }}`. Bägge är noll i dag.

### Rekommendation B: behåll som text — bygg ingen linter

Att införa stylelint (nytt verktyg, ny CI-job, ny config, ny ignore-fil) för en yta med
noll fynd och en arkitektur som redan gör felet oåtkomligt är spekulativ komplexitet
ovanför golvet. Den dubbelriktade över-engineering-vakten skär det.

Regeltexten i `CLAUDE.md` bör däremot krympa till en rad som säger *varför* det inte går
— att paletten är nollställd — snarare än att förbjuda något som inte kan skrivas.
Förklaringen bär; förbudet gör det inte.

**Om något ändå ska fånga regressionen** är rätt form en `grep`-grind på ~15 rader i det
befintliga `scripts/check-*.sh`-mönstret, med värden i en `.tokens-policy.conf` enligt
repots config-driven-konvention. Två regexar räcker: färgbärande arbitrary values och
inline style-färg.

**En fälla som måste designas runt:** en naiv `grep '#[0-9a-fA-F]{6}'` fäller **i dag**
på fem rader — samtliga kommentarer som dokumenterar vad en token renderar som. Grinden
måste träffa *värde-positioner*, inte rå hex var som helst. Det är precis den sortens
detalj som gör skillnad mellan en grind som håller och en som avaktiveras efter tredje
falska larmet.

### Rekommendation C: mekanisera — och räkna med att grinden avtäcker en öppen fråga

Regel C är den billigare och den mer värdefulla av de två, av tre skäl:

1. **Skiktbrott är den drift som faktiskt sker.** Mozilla byggde en egen plugin-regel
   för exakt detta. Hårdkodad hex är den fara alla pratar om; fel skikt är den som
   inträffar.
2. **Kontrollen är en regex mot filväg**, inte en CSS-parser. Noll nya beroenden.
3. **Den fångar något omedelbart.** Och här ligger passets skarpaste lokala fynd:

| Fil | Tokens | Noterbart |
|---|--:|---|
| `src/styles/tokens/semantic.css` | 62 | **9 av dem heter `--mm-btn-*`** |
| `src/styles/tokens/components.css` | 88 | 48 heter `--mm-button-*` |

Det finns alltså två parallella knapp-token-familjer i två olika skikt. `--mm-btn-*` i
semantic.css refereras dessutom **noll gånger** från `tailwind.css`.

Antingen är `--mm-btn-*` komponentspecifika tokens i fel fil — precis vad regel C
förbjuder — eller så är de döda rester som borde bort. Bägge utfallen kräver ett beslut
som inte är mitt att ta. **Detta är en STOPPA-punkt för orkestreraren, inte en fix att
smyga in i en grind-implementation.**

Grindens form bör därför vara: förbjud `--mm-`-deklarationer utanför
`src/styles/tokens/`, och förbjud komponentprefix (listade i `.tokens-policy.conf`)
utanför `components.css`. Undantagslistan är där `--mm-btn-*`-beslutet bokförs öppet,
i stället för att grinden konfigureras runt problemet i tysthet.

---

## Regel D — `git pull` före ändringar

### Är automatisk pull branschpraxis?

**Nej — det är ett namngivet antimönster hos en av de största OSS-organisationerna, och
Claude Code självt löser samma behov på ett annat sätt.**

Kubernetes contributor-guide, ordagrant:

> *"Please don't use `git pull` instead of the above `fetch` and `rebase`. Since
> `git pull` executes a merge, it creates merge commits."*
> ([Kubernetes contributor guide](https://www.kubernetes.dev/docs/guide/github-workflow/))

Och Claude Code:s egen worktree-mekanik, som har exakt vår uppgift — se till att basen
inte är gammal — löser den utan att någonsin köra `pull`:

> *"For a `"fresh"` base, Claude Code keeps `origin/HEAD` current: when the repository
> hasn't been fetched in the last 24 hours, it fetches the default branch, capped at
> five seconds, and uses the locally cached ref if the fetch fails."*
> ([worktrees](https://code.claude.com/docs/en/worktrees))

Tre designval värda att kopiera rakt av: **fetch, inte pull** · **tidsboxad** (fem
sekunder) · **graceful fallback** till cachad ref när nätet saknas. Det är en
förstapartsdesign för precis vårt problem, och den innehåller ingen mutation.

### Nyansering som talar för regeln

Briefens farhåga om merge-commits är i praktiken redan neutraliserad av modern git.
Repot kör 2.50.1, och git-dokumentationen säger:

> *"`git pull --ff-only` will only do 'fast-forward' updates: it fails if your local
> branch has diverged from the remote branch. **This is the default.**"*
> ([git-pull](https://git-scm.com/docs/git-pull))

En pull skapar alltså inte tyst en merge-commit — den **fallerar** vid divergens. Det
tar bort den värsta skadan. Kvar står fyra vardagliga misslyckanden, alla verkliga i
just den här uppsättningen:

- **Feature-gren utan upstream** → *"There is no tracking information for the current
  branch."* Vanligt direkt efter `git switch -c`.
- **Offline** → fel, och sessionen inleds med en röd rad som inte betyder något.
- **Worktree** → varje worktree har egen HEAD; en pull i fel worktree hämtar fel gren,
  och Claude Code:s egna worktrees förgrenas redan från `origin/HEAD` fresh — pullen är
  ren dubbelarbete.
- **Detached HEAD** → pull vägrar.

Med merge-grinden aktiv (ADR-076, all landning via PR) är lokal `main` dessutom nästan
alltid bakom, och nästan aldrig den gren arbetet faktiskt sker på.

### Rekommendation: omformulera — mekanisera aldrig en pull

Ersätt "kör alltid `git pull` innan du gör ändringar" med intentionen bakom den:
**bygg inte på en gammal bas — stäm av mot `origin` innan du grenar.** Verbet ska vara
`fetch`, inte `pull`, och avstämningen ska vara en observation, inte en mutation.

Om något ska mekaniseras är det en `SessionStart`-hook som kör `git fetch --quiet` med
timeout och rapporterar *hur många commits bakom* HEAD ligger via
`hookSpecificOutput.additionalContext`. Icke-blockerande, icke-muterande, noll stående
kontextkostnad. Det är samma design som förstaparten själv valde.

En hook som **kör** `git pull` skulle mutera arbetsträdet innan sessionen ens börjat, i
en uppsättning med parallella sessioner och aktiva worktrees. Det är det enda av passets
fjorton övervägda mekaniseringsalternativ som gör tillståndet sämre än ingen
mekanisering alls.

---

## Regel E — datum hämtas live i skrivögonblicket

### Är det ett känt problem?

Ja, men i en smalare form än regeln antar. Claude Code injicerar dagens datum i
miljökontexten vid sessionsstart — det är korrekt när sessionen börjar och blir
inaktuellt när den passerar midnatt. Anthropics egen issue-tracker bär ett **öppet**
feature-request om just detta (#32913): agenten saknar temporal medvetenhet utöver
start-datumet, och den publicerade workarounden är en hook som injicerar
`additionalContext` med aktuell tid.
([anthropics/claude-code#32913](https://github.com/anthropics/claude-code/issues/32913))

Vår egen dokumenterade failure mode är däremot en annan och intressantare: prompter
**designade** 2026-05-20 och **exekverade** 2026-05-23 bar ett datum i sin text.
Ingen datum-injektion i världen fixar det — texten är korrekt för sin designdag. Den
klassen kräver att agenten föredrar `date +%F` framför prompt-text, vilket är ett
omdöme, inte en avläsning.

### Vad som redan är mekaniserat i det här repot

Detta är passets mest överraskande fynd, och det ändrar frågan:

- `.githooks/pre-commit` sätter `TODAY="$(date +%F)"` och **auto-bumpar** `updated:` på
  varje staged styrande dokument. Aktiverad via `postinstall`
  (`git config core.hooksPath .githooks`), alltså per-klon automatiskt.
- `scripts/check-frontmatter.sh` kör fem kontroller, varav två är datum-kontroller:
  `updated`-fältet stäms av mot `git log`, och **Check 3 fäller ett `review_by` som
  passerat**. Kör i CI som eget steg ("Validate frontmatter on governing docs").

Den högsta-värde-instansen av regel E — frontmatter-datum på styrande dokument — är
alltså redan deterministiskt grindad, i två lager, sedan Session 6.6.

### Rekommendation: behåll som text

Residualen är låg-severitet och till stor del självläkande:

- Datum i brödtext (som denna filens `2026-07-27`) — fel upptäcks vid läsning.
- Frontmatter i **icke**-styrande filer (research-dokument, ADR:er) — täcks inte av
  `FRONTMATTER_GOVERNING_DOCS`. En `review_by` som redan passerat vid skrivögonblicket
  fångas dock av Check 3 så snart filen någonsin läggs till listan.
- Midnattspassage i en lång session — verklig, men sällsynt, och en dagsfelaktig
  tidsstämpel har låg kostnad.

Den billiga mekaniseringen finns om klassen någonsin biter: en `UserPromptSubmit`- eller
`SessionStart`-hook som injicerar `date +%F` via `additionalContext`, ~10 tokens per
session. Bygg den **när** ett faktiskt fel inträffar, inte innan. Just nu vore den en
lösning som letar efter ett problem.

Regeltexten i `code-role-discipline.md` §1.4 bör krympa och peka på grindarna: den
detaljerade instruktionen om plattforms-portabel frist-beräkning
(`date -d` mot `date -v`) hör hemma där någon faktiskt räknar en frist, inte i en
alltid-på disciplin.

---

## Regel F — läs- och analysagenter får inte köra git alls

### Fällan: verifierad, och avgränsad

Briefens varning är korrekt för skills och **felaktig** för agentdefinitioner. Bägge
belägg är förstaparts och ordagranna.

**Skill-nivån är turbaserad** — duger inte som spärr:

> `disallowed-tools`: *"Tools removed from Claude's available pool while this skill is
> active. … **The restriction clears when you send your next message.**"*
>
> `allowed-tools`: *"The grant clears when you send your next message … **It does not
> restrict which tools are available: every tool remains callable.**"*
> ([skills](https://code.claude.com/docs/en/skills))

**Agent-nivån är strukturell** — ingen "clears"-formulering någonstans, och flera
positiva påståenden om hård prevention:

> *"Each subagent runs in its own context window with a custom system prompt, specific
> tool access, and independent permissions."* · *"**Enforce constraints** by limiting
> which tools a subagent can use."* · *"To restrict tools, use the `tools` field as an
> allowlist or the `disallowedTools` field as a denylist."* · *"If both are set,
> `disallowedTools` is applied first, then `tools` is resolved against the remaining
> pool. A tool listed in both is removed."* · *"To **prevent** a subagent from invoking
> skills **entirely**, omit `Skill` from the `tools` list or add it to
> `disallowedTools`."*
> ([sub-agents](https://code.claude.com/docs/en/sub-agents))

Att filtreringen sker vid uppstart och inte per tur bekräftas av felbeteendet: när
`tools`-listan inte matchar något vägrar Claude Code **starta** agenten och returnerar
ett fel som namnger posterna. En turbaserad grant skulle inte kunna misslyckas så.

**Slutsats:** agentdefinitionens `tools`/`disallowedTools` är en riktig spärr. Fällan
gäller skills, inte agenter.

### Men `tools:` är fel kornighet för just denna regel

En research-agent behöver `Bash` — den kör `grep`, `ls`, `find`, `npx markdownlint`.
`Bash` i poolen betyder `git` i poolen. Verktygsnivån kan inte skilja `git status` från
`ls`.

De två återstående kandidaterna, och varför bara den ena duger:

- **`permissions.deny: ["Bash(git *)"]`** — deterministisk och starkast i
  precedensordningen (*"deny rules from any scope are evaluated before allow rules"*),
  men **session-vid**. Den skulle låsa orkestreraren ute från git också. Förstaparten
  säger detta rakt ut om plugin-agenter: *"these rules apply to the entire session, not
  only the plugin subagent."* Fel verktyg.
- **`PreToolUse`-hook i agentens egen frontmatter** — förstapartens dokumenterade mönster
  för exakt denna situation: *"For more dynamic control over tool usage, use `PreToolUse`
  hooks to validate operations before they execute. **This is useful when you need to
  allow some operations of a tool while blocking others.**"* Exemplet i dokumentationen
  är en `db-reader`-agent med `tools: Bash` plus en hook som blockerar skrivande
  queries — strukturellt identiskt med vårt fall.

### Den empiriska datapunkten från detta pass

Briefen jag kör under innehöll ett explicit, kursiverat HÅRDA FÖRBUD mot **alla**
git-kommandon. Jag körde två ändå. Bägge var read-only och skadade ingenting — men
formen fungerade inte, i ett pass vars hela uppgift var att utvärdera när text räcker.

Det är n = 1. Men det är n = 1 i exakt rätt riktning, samma dag som regel A bröts av en
annan agent, och det matchar `The Compliance Gap`-studiens huvudfynd: 0 % efterlevnad av
processinstruktion under default-villkor, **75 %** när verktyget togs bort. Interventionen
som mätbart fungerade var att ta bort affordansen — inte att formulera förbudet bättre.

### Rekommendation: mekanisera — exakt mekanism

1. Lägg agentdefinitionen i **`.claude/agents/`**, inte i pluginet. Förstaparten:
   *"For security reasons, plugin subagents don't support the `hooks`, `mcpServers`, or
   `permissionMode` frontmatter fields. These fields are ignored when loading agents from
   a plugin."* Ett plugin-buret research-agent kan alltså **inte** bära sin egen spärr.
2. Frontmatter: `tools:` som allowlist utan de verktyg agenten aldrig behöver, plus
   `hooks: PreToolUse:` med matcher `"Bash"` som nekar allt som matchar
   `(^|[;&|]\s*|\$\()git\b`, med samma subkommando-medvetna prefix som CI-vakts-hooken.
3. Deny-reason ska namnge orkestrerarens ägarskap och vad agenten ska göra i stället
   (rapportera behovet i slutrapporten). Samma leverans-logik som regel A.
4. Behöver ett pass genuint läsa git-historik: gör undantaget explicit i hooken
   (`git log`, `git show`) i stället för att stänga av den. En grind som stängs av per
   pass är ingen grind.

Överväg dessutom `isolation: worktree` för skrivande agenter. Det är den enda mekanism
som gör partitionsbrott fysiskt omöjligt i stället för förbjudet — och `§6.1`:s
partitionsdeklaration blir då en beskrivning av något garanterat, inte något hoppats på.

---

## Regel G — ny session efter 20–25 meddelanden

### Är meddelanderäkning ett vettigt mått?

**Nej. Ingen källa jag hittade — leverantör eller forskning — använder meddelanderäkning
som tröskel.** Regelns *motivering* (context rot) är däremot förstapartsbelagd ordagrant:

> *"Context rot is the observation that model performance degrades as context grows
> because attention gets spread across more tokens, and older, irrelevant content starts
> to distract from the current task."*
> ([session management-bloggen](https://claude.com/blog/using-claude-code-session-management-and-1m-context))

Fenomenet är alltså rätt. Måttet är fel. Ett meddelande kan vara "ok" eller en
50 000-tokens filläsning; det korrelerar inte med det regeln vill fånga.

### Vad förstaparten mäter i stället — tre trösklar, ingen av dem numerisk

1. **Uppgiftsgräns.** *"When you start a new task, you should also start a new session."*
   Och motsatt, för fortsatt arbete i samma scope: *"everything in the window is still
   load-bearing; don't pay to rebuild it."* Det är exakt vår egen
   sessions-paus-distinktion (ADR-051), oberoende härledd.
2. **Två misslyckade korrigeringar.** *"If you've corrected Claude more than twice on the
   same issue in one session, the context is cluttered with failed approaches. Run
   `/clear` and start fresh with a more specific prompt … A clean session with a better
   prompt almost always outperforms a long session with accumulated corrections."*
3. **Kontextfyllnad.** *"Track context usage continuously with a custom status line."*

Felmönster-listan bekräftar bilden: *"The kitchen sink session"* (blandade uppgifter) och
*"Correcting over and over"* (korrigeringar) — bägge orsaks-triggers, ingen räknare.
([best-practices](https://code.claude.com/docs/en/best-practices))

Vår egen forskningsläsning pekar åt samma håll: den enda robusta effekten i faktorstudien
var **sessionslängd** — men mätt som ~5,6 % lägre odds för efterlevnad **per genererad
funktion**, alltså per producerad arbetsenhet, inte per meddelande. Fyndet var dessutom
post-hoc, inte förregistrerat.
([arXiv:2605.10039](https://arxiv.org/abs/2605.10039), preprint)

### Kan det mekaniseras?

Regeln: nej. Mätaren: ja, och den finns redan.

- **Hooks får inte kontextdata.** Ingen av de 30 hook-händelserna levererar tokenantal,
  kontextfyllnad eller meddelanderäkning i sin input. En hook-grind på "för lång session"
  skulle behöva parsa `transcript_path`-JSONL:en själv och uppskatta tokens — bräckligt,
  och en uppskattning där en exakt siffra finns en meny bort.
- **Statusline får det, färdigberäknat.** `context_window.used_percentage`
  (*"Pre-calculated percentage of context window used"*),
  `context_window.remaining_percentage`, `context_window.context_window_size` och
  `exceeds_200k_tokens`. Plus: *"The status line runs locally and does not consume API
  tokens."* ([statusline](https://code.claude.com/docs/en/statusline))

### Rekommendation: omformulera regeln, mekanisera mätaren

**Ersätt "efter ca 20–25 meddelanden" med de tre förstaparts-triggarna:**

- ny uppgift → ny session (bekräftar ADR-051, ingen ny mekanik behövs)
- två misslyckade korrigeringar på samma sak → `/clear` och skriv om prompten
- kontextfyllnad över tröskel → pausa och landa

**Mekaniseringen är en statusline som visar kontextprocent.** Den gör det osynliga
måttet synligt vid varje tur, kostar noll tokens, och kan inte ignoreras på det sätt en
textregel kan. Det är samma tredje lane som regel A: gör efterlevnaden observerbar i
stället för att skriva regeln tydligare. Att en repo-uppsättning med den här
disciplinnivån saknar kontext-statusline är passets näst mest överraskande fynd — det är
den enskilt billigaste förbättringen av alla fjorton som övervägts.

Behåll gärna en grov siffra som pedagogisk hjälp för Marcus, men **som riktvärde i
prosa, inte som regel** — och märk den som heuristik. Ett tal som ser ut som en tröskel
och inte är det är sämre än inget tal.

---

## Vad jag INTE kunde belägga

Ärlighetsposten. Sex saker som saknar stöd och inte ska framställas som avgjorda.

1. **Att någon branschaktör förbjuder `git add -A`.** Kontrollerat i git-projektets
   dokumentation, Kubernetes contributor-guide och fyra agent-leverantörers
   förstapartsdokumentation. Noll träffar. Rekommendationen att mekanisera A vilar
   **helt** på repo-specifika fakta (allow-listan, den falsifierade textleveransen) —
   inte på precedent. Det är en medveten avvikelse från branschen, inte en anpassning
   till den.
2. **Att agentdefinitionens `tools:` överlever hela agentens livstid.** Belagt indirekt
   och starkt (ingen "clears"-formulering, ordet *"prevent … entirely"*, uppstartsfel
   vid tom lista) men **aldrig positivt utsagt** i dokumentationen på det sätt
   skill-fältens turbasering är. Verifiera empiriskt vid bygget innan spärren litas på.
3. **Om `--mm-btn-*` i `semantic.css` är ett medvetet designval eller drift.** Nio
   deklarationer, noll referenser från `tailwind.css`. Frågan är öppen och ägs av
   Marcus; jag rörde ingenting.
4. **Om Biomes GritQL-plugins klarar Tailwind-arbitrary-värden i JSX-attribut.**
   Dokumentationen listar JavaScript/CSS/JSON som målspråk men säger inget om JSX-attribut
   eller strängliteraler specifikt. Otestat, och rekommendationen för B/C hänger inte på
   det.
5. **Om kvantitativ effekt av någon av de sju mekaniseringarna.** Ingen källa mäter
   utfallet av en enskild grind. Den enda mätdata som finns är `The Compliance Gap`-
   studiens 0 % → 75 % vid **verktygsborttagning** — vilket stöder mekaniseringsklassen
   generellt, inte någon av dessa sju specifikt.
6. **Om en dagsfelaktig tidsstämpel någonsin kostat något i det här repot.** Regel E:s
   empiriska grund är designad-vs-exekverad-dag, inte midnattspassage. Ingen instans av
   den senare är dokumenterad.

Plus en metodisk anmärkning värd att bära vidare: **två av passets sökträffar var
felattribuerade citat.** Bägge såg ut som precis den precedent som söktes, och bägge föll
vid direkthämtning. Sökmotor-sammanfattningar är hypoteser, inte källor — samma regel som
gäller varje annan rapport.

---

## Verifierat mot disk (läs-only, 2026-07-27)

Tolv kontroller. Inga skrivningar utanför denna fil.

| Kontroll | Utfall |
|---|---|
| `biome.json` | Biome 2.5.4, `preset: recommended` + nursery `useSortedClasses`. Ingen stylelint, ingen ESLint |
| `package.json` | Ingen stylelint-dependency. `postinstall` sätter `core.hooksPath .githooks` |
| `.claude/settings.json` | En `PreToolUse`-hook (CI-vakt, `jq`-form) · `permissions.allow` innehåller `Bash(git add:*)` och `Bash(git commit:*)` |
| `src/styles/tailwind.css` | `@theme` inleds med `--color-*: initial` — Tailwinds default-palett raderad |
| CSS-filer i `src/` | 5 st, varav 3 token-filer |
| TSX-komponenter | 95 st |
| Hex/rgb/hsl utanför `tokens/` | 0 (en kommentar-träff) |
| Tailwind arbitrary color-värden | 0 (`text-[10px]`, `text-[0.95em]` är storlekar) |
| `--mm-*` utanför `src/styles/tokens/` | 0 |
| Token-fördelning | `semantic.css` 62 (**9 st `--mm-btn-*`**), `components.css` 88 (48 st `--mm-button-*`) |
| `.githooks/pre-commit` | `TODAY="$(date +%F)"`, auto-bumpar `updated:` på styrande docs |
| `scripts/check-frontmatter.sh` | 5 kontroller; Check 2 stämmer `updated` mot `git log`, Check 3 fäller passerat `review_by` |

Inga ändringar gjorda i något av dessa. Arbetsträdet oförändrat utanför denna fil.

---

## Källförteckning

### Anthropic, förstapart — dokumentation

- [Best practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Extend Claude with skills](https://code.claude.com/docs/en/skills)
- [Configure permissions](https://code.claude.com/docs/en/permissions)
- [Hooks reference](https://code.claude.com/docs/en/hooks)
- [Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees)
- [Customize your status line](https://code.claude.com/docs/en/statusline)
- [Extend Claude Code (mekanism → innehållstyp)](https://code.claude.com/docs/en/features-overview)
- [Explore the context window](https://code.claude.com/docs/en/context-window)

### Anthropic, förstapart — blogg och issue-tracker

- [Using Claude Code: session management and 1M context](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
- [anthropics/claude-code issue #32913 — Date/Time Injection into prompts](https://github.com/anthropics/claude-code/issues/32913) — **öppen**, ej implementerad

### Git och OSS-praxis, förstapart

- [git-pull dokumentation](https://git-scm.com/docs/git-pull)
- [git-add dokumentation](https://git-scm.com/docs/git-add)
- [Kubernetes contributor guide — GitHub workflow](https://www.kubernetes.dev/docs/guide/github-workflow/)

### Designsystem och linters, förstapart

- [Biome — noHexColors](https://biomejs.dev/linter/rules/no-hex-colors/)
- [Biome — Linter plugins (GritQL)](https://biomejs.dev/linter/plugins/)
- [Biome discussion #5291 — CSS rules to restrict allowed declarations](https://github.com/biomejs/biome/discussions/5291) — **öppen begäran**, ej byggd
- [Shopify Polaris — stylelint-polaris](https://github.com/Shopify/polaris/tree/main/stylelint-polaris)
- [Mozilla — no-base-design-tokens](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/no-base-design-tokens.html)
- [AndyOGo/stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)

### Forskning (peer-review-status angiven)

- [*Instruction Adherence in Coding Agent Configuration Files*, arXiv:2605.10039](https://arxiv.org/abs/2605.10039) — **preprint**
- [*The Compliance Gap*, arXiv:2605.01771](https://arxiv.org/abs/2605.01771) — **preprint**

### Sekundärkälla (märkt som sådan, endast för `.gitignore`-gränsen)

- [dev.to — Secrets, Agents, and .env Files](https://dev.to/ticktockbent/secrets-agents-and-env-files-40l2)

### Internt underlag

- `docs/research/instruktionsleverans-branschpraxis-2026-07-27.md` — läst i sin helhet
- `~/Repon/marcus-system/templates/code-role-discipline.md` — läst i sin helhet, orörd
- `CLAUDE.md`, `biome.json`, `.claude/settings.json`, `.frontmatter-policy.conf` — lästa
