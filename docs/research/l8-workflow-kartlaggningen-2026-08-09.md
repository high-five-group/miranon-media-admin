---
owner: marcus803
updated: 2026-08-09
review_by: 2027-02-09
status: draft
---

# L8-workflow-kartläggningen — Kuns agentic-engineering-system mot vårt

> **Proveniens:** Session 101 (2026-08-09), beställd av Marcus efter videon
> *"L8 Principal's Agentic Engineering Workflow"* (talare: "Kun", f.d. L8
> principal engineer på Meta/Microsoft/Atlassian; byggt frontier coding
> agents på Atlassian; uppger 40–50 testade prod-PR:er/dag). Källa:
> transkriptet i korpusfilen
> [`l8-workflow-transkript-2026-08-09.txt`](l8-workflow-transkript-2026-08-09.txt)
> (8 072 ord, tidsstämplar `(MM:SS)` refereras nedan). Två systertranskript
> (*Building a Full Stack App*, *Dev Environment From Scratch*) var vid
> huvudanalysen ej lästa; efter Marcus re-scoping samma dag är BÅDA
> djuplästa och destillerade i § Addendum, med korpusfiler
> [`l8-fullstack-transkript-2026-08-09.txt`](l8-fullstack-transkript-2026-08-09.txt)
> och [`l8-devenv-transkript-2026-08-09.txt`](l8-devenv-transkript-2026-08-09.txt).
> Arbetsform: S82-precedentet (Pocock-integrationen) — korpus + destillat +
> gap-analys i `docs/research/`, docs-only-PR via egen worktree.
> Verifierings-status per verktygsnamn: se § A.8 — transkriptet är talat och
> namn kan vara transkriberings-förvanskade; webverifiering redovisas där.

## Fas A — Kuns system, destillerat

### A.1 Nivåmodellen

Kun beskriver sitt system som en progression i fem nivåer (01:45), med en
sjöfartsmetafor som är mer än retorik — den kodar rollskiftet:

1. **Skeppet** — terminal-setup (WezTerm + tmux + Neovim)
2. **Besättningen** — agent-harnesses + onboarding (minnesfiler + skills)
3. **En besättningsmedlem, effektivt** — röst, verktygs-ergonomi, Lavish,
   No Mistakes
4. **Flera parallellt** — Goodnight Have Fun, Treehouse
5. **Förstestyrman** — FirstMate, orkestreraren som eget system

Slutbilden (44:23): kaptenens flaskhals skiftar från exekvering till
idéförsörjning — "talking to your users, understanding the competitive
landscape, and crafting a good treasure map".

### A.2 Skeppet — terminal-centrisk portabilitet (00:00–09:20)

- **WezTerm** (transkriberat "Westterm"): cross-platform (Mac/Windows/Linux
  identiskt), Lua-konfig med logik + hot reload (03:25–04:23).
- **tmux** (transkriberat "TMOX"): panes + windows för parallella
  agent-sessioner; **persistenta server-sessioner** — detach/attach ger exakt
  samma tillstånd, inklusive från laptop och **telefon** (05:16–06:52).
- **Neovim**: händerna lämnar aldrig tangentbordet (06:52–09:20).
- **Motiven är två, uttalade:** (1) flow — varje musflytt är ett
  kontextbyte för hjärnan (02:38); (2) **exakt samma arbetsflöde överallt,
  även på telefonen** (03:25). Han medger att koncepten är GUI-tillämpliga —
  videon handlar om koncepten, inte mekaniken (03:25).

### A.3 Besättningen — agent-agnostik som bärande princip (09:20–11:12)

Fyra harnesses i regelbunden drift: Claude Code ("mest vettiga
default-upplevelsen, rikast featureset, ibland buggig, mindre
anpassningsbar"), Codex CLI (Rust, smidigare, open source — "låt Codex läsa
sin egen källkod och hitta workaround"), Pi ("minimal och högst
utbyggbar"), OpenCode (modell-agnostisk, komplett out-of-the-box)
(09:20–10:17). **Kärnprincipen:** *"I have been very strict about making my
workflow agent agnostic because the landscape is changing very, very fast"*
(10:17). Mekaniskt: `CLAUDE.md` är symlänk till `AGENTS.md` — en fil, alla
harnesses (11:51).

### A.4 Onboarding — minneshierarki med token-disciplin (11:12–20:08)

- **Global minnesfil: MINIMAL — 27 rader.** Allt här läses in i varje
  session i varje projekt; bloat är en tyst token-skatt (11:51–12:48).
- Innehållet är **bias-korrektioner**, inte procedurer:
  - *"Never use em-dash"* — stilpreferens mot robotisk text (12:48).
  - *"When making technical decisions, don't give too much weight to
    development cost"* — modellerna ärver mänskliga kostnadsestimat
    (demonstrerat: FPS-spel estimeras i veckor, byggs på minuter) och väljer
    därför billiga/låga lösningar; regeln korrigerar biasen (12:48–14:41).
  - *"Bug fixes always start with reproducing the bug end-to-end"* — så
    nära slutanvändarens upplevelse som möjligt; unit-tester är defaulten
    modellen väljer men täcker inte produktbeteendet (13:43–14:41).
  - `opinions.md` nämns som separat mekanism (blogglänk, ej utvecklad i
    videon) (14:41).
- **Projekt-minnesfil: VERBOS med avsikt** — "the collective learning of
  all the agent sessions in this project". Byggs inte för hand: varje gång
  agenten gör fel → korrigera + *"ask it to remember"* → agenten skriver in
  lärdomen själv. *"You don't need any fancy memory system... this markdown
  file is all it takes"* (15:24–16:16).
- **Skills = villkorlig kunskap flyttas UT ur minnesfilen.** E2e-testinstruktionen
  behövs bara vid ändringar — i en ren fråga är den bortkastade tokens.
  Progressive disclosure: bara description-fältet laddas vid start; resten
  läses först vid användning (16:16–18:19). Extraktionen görs av agenten
  själv på order ("let's extract... into a project level skill").
  Verktyg: Anthropics *Skill Creator*-skill + Vercels `npx skills`-CLI för
  install/hantering över alla harnesses (17:07).
- **Skill-hygien:** installera inte främmande skills — (1) säkerhet: en
  skill kan instruera agenten att köra godtyckligt och exfiltrera nycklar;
  (2) prestanda: en skill ur ett 177 000-stjärnors repo mätt med "Program
  Bench" gav **+5 % tokens och sämre resultat**. *"Being popular is not the
  same as actually being good"* — kräv publicerad rigorös evaluering
  (18:19–20:08).

### A.5 En agent, effektivt (20:08–33:25)

- **Röstinput som primärt gränssnitt.** Open Super Whisper (lokal
  Whisper-körning, FOSS); tal är ~3× snabbare än skrift (Stanford-paper,
  20:08–21:04); fallback till tangentbord endast för URL:er/sökvägar
  (22:05). Domän-vokabulär (projektnamn) läggs i transkriberings-modellens
  *initial prompt* → egennamnen känns igen (41:14–42:11).
- **Verktygs-ergonomi mäts, inte antas ("AXI").** Agentens prestanda beror
  på verktygens design: GitHub-MCP-servern mätt mot CLI för samma uppgifter
  ≈ **3× tokenkostnad, >2× latens** (22:05–23:00). "AXI" = hans 10
  designprinciper för agent-ergonomiska verktyg; token-effektivt
  outputformat ≈ **−40 % tokens mot JSON**; byggda instanser: GitHub-AXI,
  Chrome-DevTools-AXI; katalog på "axi.md" (23:00–24:02). Regeln: *"when
  you give tools to your agents, do some research on their efficiency"*
  (24:02).
- **Lavish — planering som interaktiv artefakt.** I stället för
  "wall of text"-planer i terminalen renderar agenten en HTML-artefakt **i
  projektets eget designsystem** i browsern: optioner sida vid sida,
  annotering/kommentarer på specifika delar, besluts-knappar längst ned;
  feedbacken går tillbaka till agenten utan terminal-återgång
  (24:02–28:40). Auto-triggas via skill för planeringsklassen (26:13).
  Kuns dom: *"I can never go back to reading texts in the terminal"*
  (27:52).
- **"Klart"-problemet och direktörs-skiftet.** Manuell diff-granskning är
  en hård kapacitetsgräns på människan och dessutom trist; skalning kräver
  att man tänker som engineering director — kultur + process i stället för
  PR-review (28:40–29:38).
- **No Mistakes — pipelinen från first-pass till ren PR** (29:57–31:46),
  stegen i ordning: skapa branch vid behov → commit → **isolerad worktree**
  → **intent-analys ur agent-sessionen** (förstå vad som faktiskt beställdes)
  → rebase mot senaste origin/main + konfliktlösning upfront →
  **adversarial review i färsk kontext** (uppenbara fel självrättas;
  tvetydiga med produktimplikationer **eskaleras till människan**) →
  e2e-test mot ursprunglig intent + **bevis-inspelning** (screenshot,
  video, logg — "the most direct way to see the change working") →
  dokumentations-pass → lint → push + PR → **babysitting tills merge**
  (konflikter + CI-fel hanteras utan människan). Även anropbar som skill.
- **PR-granskning via bevis + risk, inte diff.** PR:n bär: intent, ändring,
  testning, pipeline-händelser, bevislänkar, **risk-bedömning**.
  Riskbedömningen styr granskningsdjupet; för lågrisk läses diffen inte
  alls — *"validated time and time again: any problem I could catch is very
  likely already caught by the pipeline"* (31:46–33:25).
- **Tidsfördelnings-modellen:** människan vid ÄNDARNA (Lavish-planeringen i
  början, kvalitetsribban i slutet); mitten är autonom; **parallellism
  skalar med mittens längd** (32:36–33:25).

### A.6 Långkörning + parallellism (33:25–40:40)

- **Goodnight Have Fun** — långkörnings-loop: objective + stop-villkor
  (**token-cap, iterations-cap, precisa villkor** — kontrasterat mot
  `/goal`-kommandon där veckokvoten kan vara slut på morgonen)
  (34:13–35:52). Demonstrerat användarfall: *"pretend you are a seven year
  old kid... find the first usability problem... fix it, rinse and
  repeat"* — vakna → granska commits på branchen, välj vilka som behålls.
  Lämpar sig för **verifierbara mål** (laddtid, e2e-täckning,
  metrik-experiment à la Karpathys auto-research) eller där agentens
  omdöme är betrott (35:00–36:44).
- **Worktree-skulden namngiven:** manuella worktrees = mental
  bokföringsskuld — namnval, "vad gjorde jag här sist?", "kör en agent
  här?", städning (36:44–38:06).
- **Treehouse** — worktree-manager: `treehouse` → dropp i fresh worktree;
  `treehouse status` → used/idle-lista; **tab-stängning frigör worktreen;
  idle worktrees ÅTERANVÄNDS** i stället för att nya skapas (38:06–38:58).
- **Parallell-arbetets tak:** tre samtidiga sessioner demonstreras
  (statusbar visar vem som behöver uppmärksamhet, tangentbordsväxling), men
  *"juggling between all these sessions is quite exhausting... doesn't feel
  like an ideal end game experience"* (38:58–40:40) — vilket motiverar
  nivå 5.

### A.7 FirstMate — orkestreraren som eget, beständigt system (40:40–45:18)

- Ett repo som klonas; **en agent körs I det repot** och blir
  förstestyrman. Kaptenen pratar; FirstMate: hanterar **flera projekt**
  samtidigt, spawnar tmux-tabbar, anropar Treehouse för worktrees, kör
  agenter i dem, validerar via No Mistakes → färdiga PR:er (41:14–43:23).
- Setup via samtal; strictness-val per repo, t.ex. *"Full gate to PR"* =
  No Mistakes som obligatorisk pipeline (42:11).
- Drar öppna GitHub-issues och triagerar "which ones are actionable"
  (42:41–43:23).
- *"FirstMate is basically all my tools coming together as one cohesive
  workflow"* (43:23). Konsekvensen: kaptenen får slut på idéer — "the
  bottleneck is shifting" — och rollen blir riktning, användare,
  konkurrens, treasure map (44:23).

### A.8 Verifierings-status för verktygsnamnen (webverifierat 2026-08-09)

Delegerat verifierings-pass (Sonnet, WebSearch/WebFetch + GitHub REST API
för stjärnor/licens/push-datum). **Personen bekräftad:** Kun Chen, GitHub
`kunchenguid`, ex-L8 på Meta/Microsoft/Atlassian (ledde Rovo Dev,
Atlassians AI-SDLC-produkt). Samtliga fem egna verktyg ligger på det
kontot, alla MIT, alla pushade inom 9 dagar från verifieringsdatumet —
en levande svit, inte döda sidoprojekt.

| Transkript-namn | Verifierat | Fakta | Avvikelser mot transkriptet |
|---|---|---|---|
| "Westterm" | **WezTerm** (`wezterm/wezterm`) | 28 272 ★, Rust, Lua-konfig | Etablerat fristående projekt (ej Kuns); "26K ★" något lågt |
| "Open Super Whisper" | `Starmel/OpenSuperWhisper` | 2 532 ★, MIT, Swift, lokal Whisper.cpp/Parakeet, macOS | **"Custom dictionary" är OBOCKAD TODO (öppet issue #19)** — vokabulär-stödet som demonstreras i videon är inte styrkt i README; svenska ej nämnd |
| "Axi / axi.md" | `kunchenguid/axi` + axi.md | 1 792 ★, MIT; 10 principer bekräftade med namn | Benchmark-siffrorna stämmer nära exakt (kostnadskvot 2,96×, latens 2,18×, TOON −40 % mot JSON) — men talaren sa "tokens" där siffran är kostnad; **"Program Bench" hittades INTE** (benchmarks heter Browser/GitHub Benchmark) |
| "Lavish" | `kunchenguid/lavish-axi` | 2 655 ★, MIT, `npx lavish-axi <fil>`; annotering + agent-feedback i browser bekräftad | **Designsystem-AGNOSTISKT** — "projektets designsystem" är agentens jobb via instruktion, inte verktygets funktion |
| "No Mistakes" | `kunchenguid/no-mistakes` | 7 483 ★ (störst i sviten), MIT, Go; isolerad worktree + adversarial review i färsk kontext + auto-PR + babysitting bekräftade | README:s korta kedja är "review → test → docs → lint → push → PR → CI" — transkriptets fulla 8-stegskedja (intent-analys, rebase, bevis-artefakter) är inte ordagrant README-belagd |
| "Goodnight Have Fun" | `kunchenguid/gnhf` | 3 605 ★, MIT, TS; `--max-iterations`/`--max-tokens`/`--stop-when` bekräftade | Rollback vid fel + abort efter 3 raka fel (detalj utöver videon) |
| "Treehouse" | `kunchenguid/treehouse` | 1 301 ★, MIT, Go; pool + `get` återanvänder ledig icke-dirty worktree, cleanup-på-exit | Bekräftar återanvändnings-designen |
| "FirstMate" | `kunchenguid/firstmate` | 3 066 ★, MIT, Shell; dirigerar flotta i tmux-fönster (alt. zellij m.fl.), worktrees via Treehouse, "no-mistakes" som projekt-läge | Bekräftar att sviten är ett SAMMANHÄNGANDE system |
| Stanford-pappret | arXiv:1608.07323 (IMWUT 2016/17) | Tal 3,0× snabbare än skrift (161 vs 53 ord/min, −20,4 % fel) | **Videons Dario Amodei-referens är FEL person — det är Andrew Ng** i författarlistan |

### A.9 Kuns tio kärnprinciper (destillatet av destillatet)

| # | Princip | Källa |
|---|---|---|
| P1 | Agent-agnostik — arbetsflödet överlever harness-/modellbyten | 10:17 |
| P2 | Token-disciplin i minneshierarkin: minimal global fil, villkorligt → skills | 11:51, 16:16 |
| P3 | Systemprompt som bias-korrektion (utvecklingskostnad, e2e-först) | 12:48–14:41 |
| P4 | Mät verktygens agent-ergonomi — empiri före val | 22:05–24:02 |
| P5 | Människan vid ändarna, autonomi i mitten; skala = förläng mitten | 32:36–33:25 |
| P6 | Granska bevis + risk, inte diffar | 31:46–33:25 |
| P7 | Adversarial review i färsk kontext; tvetydigheter eskaleras | 30:54 |
| P8 | Infrastruktur-skuld (worktrees, PR-vakt, kontextväxling) automatiseras bort | 36:44–43:23 |
| P9 | Rigorös evaluering före adoption — popularitet ≠ kvalitet | 18:19–20:08 |
| P10 | Flow-bevarande interaktion: tangentbord + röst (tal ~3× skrift) | 02:38, 20:08 |

## Fas B — Vårt system (jämförelseytan)

> Inventerat av delegerat pass (Sonnet, read-only) mot hubbens
> `SYSTEMET.md` och `SKILLS-INVENTORY.md` samt spoke-`CONTRIBUTING.md`;
> hub-/spoke-`CLAUDE.md` ur orkestrerarens kontext. Källmärkning per rad;
> `LUCKA:` = kategori utan mekanism hos oss. Kategorierna speglar Kuns
> axlar.

### B.1 Orkestrering/roller

Två-aktörssystem Code + Marcus med explicit beslutsrätt och empiriska
fångstrater (self-review ~9 % · transparens-rapport ~64 % · Marcus-pushback
~27 %; `SYSTEMET.md` §1). Sessionsmodell med fyra lifecycle-verb
(start/end/paus/resume) och `lifecycle`-fält. Modell/effort-tiering: Haiku
hittar · Sonnet utför · Opus avgör · Fable orkestrerar (`SYSTEMET.md` §4).
`bygg-agent`-typen: egen worktree, öppnar PR, armerar aldrig själv
(`CONTRIBUTING.md` § Landnings-ordningen). Orkestreraren dör med sessionen —
kontinuiteten bärs av filartefakter, inte av en beständig process.

### B.2 Minnes-/kunskapslager

CLAUDE.md i två lager (hub + spoke-delta) · sanningshierarkin ADR-100 (exakt
en auktoritativ källa per kunskapsklass) · `tasks/lessons.md` med
`[UNIVERSAL]`-lyft till hub · sessionsdok + trådregister + BUILD-LOG ·
transcript som sanningskälla vid stängning (`SYSTEMET.md` §0, §3, §6).
Detta är Kuns "collective learning"-mekanik i governance-form — men vår
globala nivå är stor, inte 27 rader (se C-analysen).

### B.3 Skills/discipliner

18 disciplin-skills i pluginet (auto-trigger via `description`) + separata
kapabilitets-skills; progressive disclosure-mekaniken är samma klass som
Kuns (`SYSTEMET.md` §5). Kapabilitets-inventariet självdeklarerat stale
(2026-07-02).

### B.4 Parallellitet/worktrees

Worktree-isolering med mätt gränsmatris (Bash-git mot eget huvudkatalog
avvisas; cross-repo fritt; spoke-`CLAUDE.md`) · sessions-parallellitet med
ägarlapp + detektera-och-worktree (ADR-090) · staging-semafor + CI-mutex ·
känd `core.hooksPath`-bugg per worktree-skapelse med T121-självläkning.
**Ingen worktree-återanvändning: 30 worktrees på disk vid S101-starten**
(git worktree list, 2026-08-09) — Kuns "worktree-skuld" är empiriskt synlig
hos oss.

### B.5 Landning/CI/kvalitetsgrindar

Merge queue (ADR-076) + armerings-disciplin + `isInMergeQueue`-klassning ·
heartbeat-svep (~90 s, level-triggered, fyra vägar) · DoD 4 kommandon
lokalt medan CI kör hela grind-apparaten (~20 gatekeeper-sviter, 14
docs-grindar) · rött-först-bevis + `gate-proof.yml` · revert-väg mätt till
~3 min docs / ~15 min kod · push-ekonomi (ADR-097). Detta är vårt
motsvarande "No Mistakes"-lager — men **distribuerat över CI/kö/svep, inte
en sammanhållen pipeline med intent-analys, adversarial review och
bevis-artefakter per ändring** (se C).

### B.6 Långkörning/AFK

`work-batch` (halt-first, hårda gränser) · `do-work` · nightly.yml +
post-merge-lagret · ADR-096 (subagent=Activity, orkestrerare=Workflow) ·
Monitor-mekanik med noll-LLM-väntan. LUCKA (inventeringens fynd): ingen
generell schemaläggnings-mekanism dokumenterad i `SYSTEMET.md` utöver
GitHub Actions nightly.

### B.7 Planering/beslutsytor

Grillning som normalstart (`/grill-me`, agenten föreslår max en rad) ·
`prototype`-skillen (UI-grenen tvåfas: tre divergenta varianter → Marcus
väljer → konvergens) · `to-prd`/`to-issues`-kedjan · ADR-baren ·
STOPPA-OCH-FRÅGA som markeringsbar text (aldrig popup) ·
transparens-rapporten · ADR-053-triagen. **Prototype-skillen är vår
Lavish-släkting för UI — men plan-/options-diskussioner i löptext har ingen
artefakt-yta** (se C).

### B.8 Portabilitet/distribution

Hub-repot är marketplace; aktivering via user-scope install-record
(ADR-035); tre versionstal som måste matcha manuellt (`SYSTEMET.md` §11).
Claude Code-SPECIFIKT: hooks, output-styles, plugin-cache. Agnostiskt:
ADR:er, Backlog-CLI, git/merge-kö. **Vårt system är djupt integrerat i ett
harness — Kuns är strikt agnostiskt** (se C, spänning).

### B.9 Input-modaliteter

Claude Code i VS Code · `!`-kanalen för kommandokörning/stämpling ·
claude.ai som läsyta med synk-horisont (ADR-048). Ingen röst-input.
LUCKA (inventeringens fynd): Artifact-publicering används men är
odokumenterad som del av samarbetssystemet.

### B.10 Verktygs-effektivitet

Stark mät-DISCIPLIN när frågan väl ställs: verify-ci-parity-mätningen
(30× dyrare som rutin → regel ändrad) · backlog-CLI-kostnaden mätt per
kommando-klass · flake-riggen (interfolierad A/B, retries=0) ·
push-kadens mot DORA-golv. LUCKA (inventeringens fynd): ingen systematisk
agent-ergonomi-standard för våra EGNA verktygs output (AXI-klassen) —
mätningarna är reaktiva per incident, inte en designstandard.

## Fas C — Gap-analysen

> Fyra klasser. Källmärkning: `(A.x)` = transkript-destillatet ovan,
> `(B.x)` = inventeringen ovan. Ordningen inom varje klass är
> betydelse-ordning (orkestrerarens bedömning — Marcus prioriterar i Fas D).

### C.1 Han har — vi saknar

1. **Beständig exekverings-hubb (FirstMate-klassen)** (A.7). Vår
   orkestrerare dör med sessionen; kontinuiteten bärs av filartefakter,
   ägarlapp och heartbeat (B.1, B.6). Kuns FirstMate är en process som ÄGER
   flera projekt över tid: tar emot riktning, spawnar/jonglerar agenter,
   validerar, levererar PR:er. **Vi har kunskaps-hubben (pluginet) men
   ingen exekverings-hubb** — detta är den strukturella kärnan i Marcus
   "hubb-system som pluggas in i varje scope".
2. **Sammanhållen efterbearbetnings-pipeline (No Mistakes-klassen)**
   (A.5). Våra komponenter finns men är distribuerade (B.5): bygg-agentens
   kontrakt + CI-grindar + merge-kö + svep. Det vi SAKNAR ur hans kedja:
   **intent-analys ur sessionen** · **obligatorisk adversarial review i
   färsk kontext** (vår code-review-skill finns men är inte ett tvingande
   steg) · **bevis-artefakt per ändring** (vår skarpbevis-disciplin är
   närbesläktad men incident-/grind-driven, inte per-ändring-systematisk) ·
   **risk-bedömning i PR-kroppen som styr granskningsdjup**.
3. **Worktree-lifecycle med återanvändning (Treehouse-klassen)** (A.6).
   Vi skapar friskt varje gång: 30 worktrees på disk vid S101-start, och
   varje skapelse triggar hooksPath-buggen (uppmätt amplifiering 22
   skapelser/dag, B.4). Idle-pool + status + auto-frigöring saknas helt.
4. **Plan-som-interaktiv-artefakt (Lavish-klassen)** (A.5). Vi har
   Artifact-ytan och prototype-skillens UI-divergens (B.7), men själva
   PLAN-/options-diskussionen är löptext i terminal — exakt det Kun dömer
   ut. Annotering på specifika delar + besluts-yta i projektets
   designsystem saknas.
5. **Röst-input med domänvokabulär** (A.5). Ingen mekanism alls hos oss
   (B.9). Tal ~3× snabbare än skrift är en direkt hävstång på Marcus
   dyraste resurs — hans egen tid i kvittens- och grillnings-utbyten.
6. **Mål-driven långkörningsloop med precisa stopp-villkor
   (Goodnight-klassen)** (A.6). `work-batch` är KORT-driven (plockar
   specade skivor); det vi saknar är den ÖPPNA förbättringsloopen mot ett
   verifierbart mål ("rollspela användaren, hitta problem, fixa, upprepa")
   med token-/iterations-cap (B.6).
7. **Agent-ergonomi som designstandard (AXI-klassen)** (A.5). Vi mäter
   reaktivt och bra (B.10) men saknar en standard för våra EGNA skripts
   och CLI:ers agent-vända output — token-effektivt format, turtal.
8. **Bias-korrektions-rader i global prompt** (A.4). Kuns
   "utvecklingskostnads-biasen"-regel har ingen motsvarighet hos oss; vår
   närmaste släkting är "Ingen lathet"/11-10-golvet men den adresserar
   inte kostnads-felkalibreringen i modellens val av lösningsform.

### C.2 Vi har — han saknar (eller visar inte)

1. **Governance-arkitekturen:** ADR-bar, sanningshierarki (ADR-100),
   lessons med UNIVERSAL-lyft, sessionsdok/BUILD-LOG/trådar, ADR-053-triage
   (B.2, B.7). Hans "collective learning" är EN minnesfil — vår är en
   strukturerad kunskapsarkitektur med grindvakter.
2. **Mekanisk landnings-ordning:** merge-kö + ruleset + armerings-regler +
   fail-closed-aggregator (B.5). Hans babysitting kompenserar i efterhand
   för det vår kö förhindrar mekaniskt.
3. **Process-empiri:** fångstrater, verify-ci-parity-mätningen,
   flake-riggen, push-kadens mot DORA-golv (B.1, B.10). Han mäter
   VERKTYG (AXI); vi mäter även PROCESSEN och river regler som mätningen
   falsifierar.
4. **Kravarbete som system:** grillning → PRD → skivor med beroendegraf
   och AFK/HITL-etiketter (B.7). Hans planering är per-ändring; vår är
   per-arbetsenhet.
5. **Produktkvalitets-golv:** a11y 11-golvet, Gunilla-principen,
   token-designsystemet — kvalitet som grind, inte smak.
6. **Två-aktörs-beslutsrätt:** explicit ägande (Marcus: arkitektur/scope),
   STOPPA-grindar. Kun är ensam aktör; vårt system är byggt för att en
   människa med beslutsrätt ska KUNNA fånga fel (fångstrats-empirin).

### C.3 Ekvivalent — samma princip, annan form

| Kuns form | Vår form | Not |
|---|---|---|
| Global + projekt-minnesfil, symlänk `AGENTS.md` (A.4) | Hub-/spoke-CLAUDE.md (B.2) | Hans globala är 27 rader; våra är governance-tunga med skäl — men token-kostnaden är verklig och omätt hos oss |
| Skills + progressive disclosure + Skill Creator (A.4) | Plugin-skills med description-trigger (B.3) | Samma mekanik-klass; hans extraktion minnesfil→skill är en disciplin vi också tillämpar |
| No Mistakes-babysitting (A.5) | Heartbeat-svep + armerings-regler (B.5) | Samma problem, olika ägare (pipeline vs orkestrerare) |
| Skill-hygien: evaluera före adoption (A.4) | Web-research-disciplinen + minimal-test-regeln + pre-K-forensik | Samma princip; hans är benchmark-driven |
| Direktörs-skiftet (A.5) | Orkestrerar-rollen + tier-policyn (B.1) | Vi har redan gjort mindset-skiftet han predikar |
| Bevis-inspelning (A.5) | Skarpbevis/gate-proof/verifikat (B.5) | Hans är per-ändring-systematisk; vår är grind-driven |
| E2e-först vid buggfix (A.4) | `diagnosing-bugs`-skillens fas 1 (röd-kapabel slinga) | Ekvivalent |

### C.4 Spänningar — oförenligt utan Marcus-beslut

1. **Agent-agnostik (P1) vs harness-djup.** Vår mekanisering — hooks,
   output-styles, deny-grindar — är Claude Code-specifik och ger spärrar
   Kun inte har; hans agnostik ger harness-frihet vi inte har. Full
   agnostik skulle riva vår mekaniserade grind-familj. Medelväg finns
   (agnostiska artefakter där det är gratis: AGENTS.md-symlänk,
   skill-formatet är öppet; harness-djup där mekanisering betalar sig) —
   men var snittet går är ett arkitektur-beslut.
2. **"Granska inte diffar" (P6) vs Marcus-fångsten 27 %.** Kuns
   lågrisk-regel vilar på en solo-kontext med en pipeline han validerat
   länge. Vår empiri säger att extern fångst dominerar. Att flytta Marcus
   bort från granskning UTAN att först bygga och MÄTA pipeline-fångsten
   vore att riva golvet — sekvensen måste vara: bygg C.1-2-kedjan → mät
   dess fångstrate → flytta sedan ribban.
3. **Terminal/tmux-portabilitet mot VS Code-stacken.** Marcus kör Code i
   VS Code (verktygsstacks-fakta, hub-CLAUDE.md). tmux-persistensen och
   telefon-åtkomsten är den verkliga vinsten i Kuns val — hel
   terminal-flytt är en stor omställning med eget beslutsvärde.
   Dev-Environment-transkriptet (senare pass) är rätt underlag för det
   spåret.
4. **Röst på svenska.** Kuns setup är engelsk; vår domän är svensk med
   engelska facktermer blandat. Whisper-modellernas svenska + vokabulär
   via initial prompt är lovande men overifierad — research-flagga, inte
   antagande.

## Fas D — Transformationsplanen

> Åtta kandidater ur C.1, ordnade i föreslagna vågor efter värde/insats och
> beroenden. **Detta är orkestrerarens förslag — Marcus prioriterar.**
> Varje kandidat som är en design-fork går via grillning före spec
> (normalstarts-regeln); varje "adopt"-kandidat går via
> skill-hygien-disciplinen (P9 + vår web-research- och
> minimal-test-regel) — aldrig rakt in. Alla Kuns verktyg är MIT och
> levande (A.8), så både adoption och design-stöld är legala vägar; valet
> per kandidat är öppet tills research-passet gjorts.

### Våg 1 — snabba vinster, låg risk

- **K7 · Bias-korrektions-rader i hub-CLAUDE.md** (C.1-8). Kuns
  utvecklingskostnads-rad + ev. fler ur hans globala fil. Insats: timmar.
  Form: under ADR-bar; CLAUDE.md-ändring på Marcus kvittens vid
  hub-moment. Research-flagga: ingen (raden är transkript-belagd och
  självförklarande).
- **K2 · Worktree-pool (Treehouse-klassen)** (C.1-3). Idle-pool +
  status + återanvändning; adresserar samtidigt vår mätta
  hooksPath-amplifiering (färre skapelser = färre bugg-triggers) och
  30-worktrees-skulden. Research-flagga: läs `kunchenguid/treehouse`
  design på djupet + avgör integrationssnittet mot harnessets
  `EnterWorktree`/`.claude/worktrees/` (adopt vs stjäl-designen);
  minimal-test före beslut.

### Våg 2 — kärnan (störst kvalitets- och skalningshävstång)

- **K1 · Efterbearbetnings-kedjans fyra deltan** (C.1-2) in i
  bygg-agent-kontraktet/`do-work`: intent-analys ur sessionen ·
  obligatorisk adversarial review i färsk kontext · bevis-artefakt per
  ändring · risk-rad i PR-kroppen som styr Marcus granskningsdjup.
  Sannolikt BYGG (våra CI/kö/svep-komponenter finns redan; att adoptera
  hela `no-mistakes` vore dubbelmaskineri), men research-passet läser
  repot på djupet först. **Sekvens-villkoret ur C.4-2 är hårt:** kedjan
  byggs och dess fångstrate MÄTS innan någon flytt av Marcus
  gransknings-ribba ens föreslås. Design-fork → grillning.

### Våg 3 — upplevelsen (parallella, oberoende spår)

- **K3 · Plan-som-artefakt (Lavish-klassen)** (C.1-4). Verifierat
  designsystem-agnostiskt (`npx lavish-axi <fil>`) — vår
  prototype-skill/Artifact-yta är närmsta granne. Spänningen mot
  STOPPA-OCH-FRÅGA-konstitutionen (beslutskvittens i chatt) är en
  grillnings-fråga, inte ett hinder: artefakten kan vara diskussionsytan
  medan kvittensen förblir i chatten. Research + minimal-test (en verklig
  plan, en gång) → grillning.
- **K5 · Röst-input på svenska** (C.1-5). Verifierings-korrektionen
  styr formen: vokabulär-stödet i Open Super Whisper är en ÖPPEN
  feature-request och svenska är overifierad — alltså UTVÄRDERING, inte
  adoption: minimal-test med svensk domän-terminologi; jämför med
  alternativa lokala Whisper-appar om testet faller. Marcus-personligt
  spår, oberoende av allt annat.

### Våg 4 — standarden

- **K6 · Agent-ergonomi-standard för egna verktyg (AXI-klassen)**
  (C.1-7). De 10 principerna är verifierade med namn (A.8); vår
  motsvarighet blir en hub-konvention för agent-vänd skript-/CLI-output
  (token-effektivt format, definitiva tomtillstånd, strukturerade fel) —
  config-driven per vår grindvakts-konvention. Bonus ur A.8: vårt
  befintliga CLI-före-MCP-val (t.ex. `gh`) är nu externt
  benchmark-belagt. Research-flagga: läs axi.md-principerna i fulltext.

### Våg 5 — kronan

- **K4 · Exekverings-hubben (FirstMate-klassen)** (C.1-1). Den
  strategiska kärnan — Marcus uttalade vision. Verifierat: FirstMate är
  en Shell-distro som förutsätter tmux-familjen och kedjar Treehouse +
  no-mistakes — dvs. den STÅR PÅ våg 1–2-klassernas fundament, hos honom
  och hos oss. Sannolik form hos oss: arkitektur-studie av FirstMate →
  egen design på harnessets primitiver (agents, Monitor, schemaläggning)
  förankrad i ADR-090/096/097-familjen. Störst design-fork i planen →
  fullskalig grillning; tas EFTER att våg 1–2 gett fundamentet.
- **K8 · Mål-driven långkörningsloop (gnhf-klassen)** (C.1-6).
  Usability-rollspels-mönstret mot staging + precisa stopp-villkor.
  Kräver K1-kedjan som validerings-mottagare för nattliga commits —
  därför efter våg 2.

### Utanför planen, medvetet

- **Terminal-/tmux-flytten** (C.4-3): eget beslutsvärde, eget underlag —
  Dev-Environment-transkriptet (korpus-kandidat) är rätt ingång, inte
  denna plan.
- **Full agent-agnostik** (C.4-1): riva harness-mekaniseringen är inte
  motiverat av något i materialet; medelvägen (agnostiska artefakter där
  det är gratis) kan tas ad hoc när tillfälle uppstår.
- **Systertranskripten**: Building a Full Stack App (13 452 ord) +
  Dev Environment From Scratch (6 814 ord) — egna senare pass.

### Nästa konkreta steg

1. Marcus läser denna kartläggning och prioriterar vågorna (eller river
   i dem — planen är underlag, inte beslut).
2. Per kvitterad kandidat: research-pass → (vid design-fork) grillning →
   PRD-kort + skivor via `/to-prd`/`/to-issues`.
3. Hub-kandidaterna (K6, K7, delar av K2/K4) bokförs för hub-moment —
   utförs aldrig från denna spoke-session.

## Addendum (2026-08-09) — systertranskripten djuplästa

> Marcus re-scopade samma dag: båda systertranskripten lästes i
> huvudloopen före vidare prioritering. Tidsstämplar refererar respektive
> korpusfil. **Verifieringsstatus:** verktygen som är NYA i detta addendum
> (Herder, Atomic Vault, Claude Design, pi-openai-server-compaction) är
> EJ webverifierade — de bär research-flagga in i sina kandidat-pass;
> etablerade verktyg (Nix/Determinate, Home Manager, OpenTofu, Hetzner,
> Starship, lazy.nvim m.fl.) behandlas som kända.

### AD.1 — *Building a Full Stack App* (13 452 ord): systemet i drift

Kun bygger "Eddie's Wallet" (barn-plånboks-app åt sonen) från tom terminal
till fungerande e2e-MVP (iOS-simulator → riktig backend på VPS) i EN
session, via FirstMate + Pi-agenten + GPT 5.6 "Luna" (medvetet INTE bästa
modellen — demonstration av modell-frugalitet). Det transkriptet ger som
Workflow-videon inte gav:

- **FirstMates faktiska driftmekanik** (00:11–01:33): delegerar ALLT
  ("FirstMate does not try to do everything by itself"); river färdiga
  crewmate-sessioner själv; crewmate-statusuppdateringar köas som
  "follow-ups" när FirstMate är upptagen; människans meddelanden köas
  likadant. **Crewmates är NORMALA agenter i normala flikar — observerbara
  och styrbara direkt** ("this is better than how sub-agents work in most
  agent harnesses where it's really hard to look at what a sub-agent is
  doing") — ett uttalat designkrav med direkt bäring på vår K4-design.
- **Herder** (00:00, 00:28): "my replacement for TMOX" — agent-MEDVETEN
  terminal-multiplexer: sidopanel med agenter/kataloger/status,
  agent-sökpanel, förstår harnesses. Fördjupas i AD.2.
- **Nyprojekt-mönstret** (00:05–00:26): röst-ramble av kraven (~3 000
  tecken) → agenten rationaliserar → parallellt: marknadsresearch +
  teknisk research → rapporter → diskussion i Lavish (aldrig
  wall-of-text) → wireframe-prototyper ("NOT polished — so we can get
  this prototype very quickly") → PRD som README → designsystem via
  **Claude Design** (Sonnet räckte; export → FirstMate integrerar) →
  parallella byggspår backend/frontend → **MVP-grinden definieras som
  e2e-bevis** ("simulator signs in with my real Apple account against
  the real backend").
- **Progressiv processhärdning** (00:51–00:53): inget No Mistakes under
  prototypfasen, direkta PR-mergar utan approval tidigt — *"once we have
  an MVP built, we will turn on no mistakes"*, approval-flöden senare.
  Tumregeln: *"if this is a code change you would otherwise have a human
  review — turn on no mistakes"*. Grindarna VÄXER med produktens mognad.
- **Atomic Vault** (01:00–01:03): secrets-hantering byggd av Max Howell
  (Homebrew-skaparen). Agenten BEGÄR en secret → människan ser vilken
  session + vilket kommando → godkänner per åtkomst; token exponeras
  som env-var, aldrig klartext för agenten. *"As we delegate more and
  more to agents, this is going to become more and more important."*
- **Browser-styrning av HANS riktiga Chrome** (01:13–01:20): Chrome
  DevTools-AXI + remote debugging → agenten klickar igenom Apple
  Developer-portalen åt honom; per-session-permission.
- **Kompaktering som implementationsdetalj** (00:48, 01:28): fyra
  auto-kompakteringar utan märkbar degradering; server-side compaction
  (Codex; `pi-openai-server-compaction`-extension i Pi) + **FirstMate
  persisterar uppdrag i FILER så kompakterings-förluster är hämtbara** —
  extern bekräftelse av vår kontinuitets-arkitektur (filartefakter enda
  sanningskällan).
- **Människans kvarvarande roll, demonstrerad:** de enda ingreppen var
  domänkunskap (VPS-kostnaden var fel i researchen) och
  över-engineering-nedskärningar (audit/export-krav raderade;
  dev/prod-miljösplit avvisad — *"5.6 has this tendency to
  over-engineer"*). Stående order: *"Don't ask me unless there is
  something only I can do."*
- Smått men talande: kvot-widget över flera abonnemang · fast mode som
  medvetet kostnadsval · Whisper-felstavningar som modellen själv rättar
  ur kontext.

### AD.2 — *Dev Environment From Scratch* (6 814 ord): grunden

Från nyinstallerad Mac till komplett miljö, helt deklarativt:

- **Nix som reproducerbarhets-fundament** (00:55–02:16): Determinate
  Nix + nix-darwin (macOS-inställningar som kod) + Home Manager
  (dotfiles-repo med symlänkar — runtime-ändringar versionsspåras
  automatiskt) + nix-homebrew med `cleanup = zap` (paket UTANFÖR
  konfigen avinstalleras vid rebuild — tvingar allt genom koden) +
  pinnade versioner. Det uttalade motivet är AGENT-ERANS
  katastrofscenario: *"if my AI agent did something stupid and
  completely destroyed my system, can I recover it instantly?"*
- **Herder-fördjupningen** (33:51–35:48): byggd i agent-eran, förstår
  agenter och deras status out-of-the-box över alla harnesses (*"you can
  replicate some of this with hooks, but Herder supports this out of the
  box"*), workspace-sidopanel, Windows-stöd; han övergav tmux efter
  många år — config bär tmux-muskelminnets keybinds.
- **Globala minnesfilens FULLTEXT** (40:06–43:12) — regler utöver de
  Workflow-videon visade: aldrig agent som co-author i commits (*"it's
  ultimately the human that's accountable"*) · rör aldrig
  auto-genererade filer · **"be picky about the UI... obsessed with
  pixel perfection — if something clearly looks off, even if unrelated,
  try to get it fixed along the way"** · samma för testfel/flakighet:
  *"even if it's not caused by what you are working on — still get it
  fixed"*. Distribueras via Home Manager-symlänkar till ALLA harnesses
  samtidigt.
- Claude Code-detaljer: settings.json under dotfiles-symlänk;
  statusline (modell + kontext-%) som enda CC-specifika anpassningen —
  *"most of my setup is deliberately agent agnostic"*.
- Neovim-lagret: neogit/gitsigns — notabelt att han VISST läser diffar,
  i git-förvaltnings-bemärkelse ("review DIFFs and stage changes I have
  reviewed and feel good about") — det han vägrar är diff-läsning som
  GRIND för varje agentändring.

### AD.3 — Vad addendumet ändrar i analysen

**Vågordningen i Fas D STÅR.** Ingen kandidat faller; tre berikas, en
tillkommer, två spänningar tillkommer, en princip-lista förlängs:

1. **K4 berikas med tre designkrav** ur AD.1: crewmates ska vara
   observerbara/styrbara som förstklassiga sessioner (inte opaka
   subagenter) · follow-up-kö för statusuppdateringar när orkestreraren
   är upptagen · orkestreraren river färdiga sessioner. Herder-frågan
   ("agent-medveten sessionshanterare") är i vår värld harnessets roll —
   bokförs i K4-grillningen.
2. **K1 berikas** med progressiv-härdnings-tumregeln (AD.1): grindnivån
   följer ändringsklassens mognad — kartlägg mot vår befintliga
   prototyp/skarp-distinktion (throwaway-kontraktet) i stället för att
   uppfinna ny mekanik.
3. **NY kandidat K9 — secrets-authorization (Atomic Vault-klassen).**
   Per-åtkomst-godkännande av agenters secret-användning är ett genuint
   gap hos oss (env-filer + Supabase-secrets utan
   authorization-flöde). Research-flagga: verifiera Atomic Vault
   (existens, mognad, macOS-form) + jämför med 1Password
   CLI/agent-integrationer. Våg-placering: Marcus avgör (säkerhetsklass
   talar för tidigt; beroende av inget).
4. **Två nya spänningar till C.4:** (5) Kuns "fixa orelaterat längs
   vägen"-regel står i DIREKT konflikt med vår ADR-053-triage och
   ren-scope-disciplinen — hans optimerar solo-hastighet, vår
   auditbarhet; att importera regeln rakt av vore att riva triagen.
   (6) "Aldrig co-author" kolliderar trivialt med vår
   commit-konvention — bokförs, ingen åtgärd föreslås.
5. **Princip-tillägg:** P11 progressiv processhärdning (grindar växer
   med mognad) · P12 reproducerbar miljö som agent-katastrofskydd (Nix)
   · P13 kompaktering görs ofarlig via fil-persistens — P13 är extern
   BEKRÄFTELSE av vår befintliga kontinuitets-arkitektur, inte ett gap.
6. **"Utanför planen"-spåret (terminal/tmux) har nu innehåll:** Nix-
   reproducerbarheten + Herder är dess kärna, underlaget är AD.2 —
   spåret förblir eget beslut med eget värde, nu konkret.
