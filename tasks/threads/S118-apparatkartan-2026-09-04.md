---
owner: marcus803
updated: 2026-09-04
review_by: 2026-12-04
status: stable
---

# Apparatkartan S118 — allt vi registrerat om vårt sätt att jobba, och hur vi bör ta itu med det

> Beställd av Marcus 2026-09-04, i samma andetag som frågan: *"Igår hade
> jag 4 parallella sessioner igång, S114, 115, 116 och 117. Vid flera
> tillfällen stod ALLA och väntade på att deras PR:s skulle landa innan de
> kunde jobba vidare. Jobbar verkligen proffs så här?"* och *"ta ett
> ordentligt tag om ALLT vi har registrerat relaterat till vårt sätt att
> jobba, allt relaterat till 'Apparaten' runt produkten."*
>
> **Vad detta är:** en aggregering över sex register (trådar, backlog-kort,
> ADR:er, research, lessons, hookar/policy/skills) plus hubben, med
> Code:s åtgärdsförslag per öppen post. Samma form som
> [`S91-tradkarta-2026-07-31.md`](S91-tradkarta-2026-07-31.md).
> **Vad det inte är:** en statuskopia. [`README.md`](README.md) äger
> trådstatus, backlog-CLI:t äger kortstatus, ADR-filerna äger sin egen
> status. Kartan pekar dit och lägger till det ingen registerpost bär:
> *vad som behöver hända, och varför nu.* Åtgärdsklasserna är förslag;
> arkitektur, scope och ordning är Marcus.
>
> **Färskhetsgräns:** allt är mätt 2026-09-04 mot `origin/main`
> `78de4a7d` av sex read-only-pass (trådregistret, backlog-korten,
> sessionsdoken S112–S117, ADR/research/lessons/hub, ett research-pass
> mot proffsens praxis, Kun Chen-spårets lokalisering). Kortstatus lästes
> ur varje korts egen `status:`-rad. Radintervall pekar på den fil de
> namnger.

## 1. Frågan som utlöste kartan — vad som hände igår

### 1.1 Väntetillfällena, bokförda i sessionsdoken

Fem tillfällen med namngivet skäl. Noll tillfällen av klassen "inget annat
kort att plocka", noll av klassen "väntade utan bokförd anledning".

| Session | Väntade på | Klass | Belägg |
|---|---|---|---|
| S114 | S115:s `#2229` i kön före egen push (audit-ci röd på `main`), sedan S115:s `#2228` i samma append-logg — utsparkad DIRTY med konsumerad armering | annan sessions PR | `tasks/sessions/2026-08-31-session-114.md` rad 538–543 |
| S115 | egna `368.3` (`#2246`) och `368.4` (`#2247`) före `368.5` | seriellt beroende i egen kedja | `tasks/sessions/2026-09-03-session-115.md` rad 340–342 |
| S115 | Acceptance-taket under kölast; `#2267` avbröts fyra gånger, parkerades draft tills infra-PR:en `#2278` landat | infrastruktur | `tasks/sessions/2026-09-03-session-115.md` rad 499–512 |
| S116 | Marcus beslut på `#2264` (loopens exit 20) — fortfarande draft 2026-09-04 | HITL-grind | `tasks/sessions/2026-09-03-session-116.md` rad 291–293 |
| S117 | Marcus facit-stämpel före `#2269` — fortfarande draft 2026-09-04 | HITL-grind | `tasks/sessions/2026-09-03-session-117.md` rad 285–286 |

Två av fyra sessioner väntade alltså på Marcus, och gör det än. De två
andra väntade på sin egen kedja respektive på en syskonsessions PR.

### 1.2 Vad som kostar — mätt, inte antaget

| Mått | Värde | Källa |
|---|---|---|
| Ren kö-tid efter grön check, median / p90 / max (30 landningar) | 16 s / 27 s / 5 min 8 s | `docs/research/kohopp-bradskande-revert-2026-07-30.md` |
| En fristående skiva (`374.1`): bygge · review 1 · fix · review 2 · kö · post-merge | 30 · 13 · 13 · 5 · 14 · 11 min ≈ 85 min | `T183` § Instansdata, S114 Del 6 |
| PR-genomlopp 2026-09-03, median av 41 mergade | 24,2 min | `gh pr list --state merged`, mätt 2026-09-04 |
| Längsta genomlopp samma dag (`#2267`) | 157,5 min | samma |
| Kall kontext per bygg-agent före första kodraden | 500–620k tokens | `T134` |
| Samtidiga agenter per maskin, mätt tak | 5–6 | L603, `tasks/lessons/vol-08.md` |

Kön är inte flaskhalsen. Av 85 minuter per skiva är 14 kö och 31
granskning. DORA 2025 och Faros mäter samma sak i branschen: granskningstid
+91 %, ingen org-nivå-förbättring av parallella agenter — "parallel agents
do not erase the merge queue, they fill it" (Devin-fallstudie, citerad i
research-doket § A6).

### 1.3 Diagnosen — tre olika fel, inte ett

1. **Strukturen tvingar väntan.** Varje session driver EN PRD med seriella
   skivor, och L643 säger *"kedjade skivor sekvenseras på LANDNING, inte
   på agentens slutrapport"*. Fyra sessioner med en kedja var betyder att
   alla väntar på sin egen kedja. Ingen regel säger att en session ska ha
   två oberoende kedjor i luften.
2. **Praxis-gap för oberoende arbete.** ADR-096 ger orkestreraren
   *väntan*, inte sysslolöshet. ADR-097 förutsätter flera färdiga enheter
   i luften. CONTRIBUTING § Landnings-ordningen pekar Marcus verifiering
   mot väntfria ytor, *"aldrig mot en väntad landning"*. Men ingen skill,
   ingen rad i `CLAUDE.md` gör "starta nästa oberoende enhet efter
   armering" till default. Research-korpusen (154 dok) har **noll**
   träffar på frågan "fortsätt med nästa kort medan PR:en landar" och noll
   på stackade grenar — sökningen är negativ, inte tunn.
3. **Arkitektur-gap för beroende skivor.** S113 mätte att en stackad PR
   får noll CI-körningar tills den retargetats och fått ny commit
   (`2026-08-29-session-113.md` rad 618–620). Review-grinden antar att
   basen är `main` (`granskadSha`, ADR-105), CI-klassningen diffar mot
   `main`, kön antar en PR per grupp under `ALLGREEN`. Stacking kräver
   egen grillning och ADR.

Därtill en fjärde faktor som förlänger upplevd väntan: väckningsdefekten.
`T112` visar att en fullbordad vakt inte tillförlitligt väcker en idle
huvudsession. ADR-096 avvisade extern köhantering *"om inte framtida
mätning visar att orkestrerar-väntan blockerar framdrift, inte bara kostar
tokens"* — 2026-09-03 är den mätningens första instans, och
`TASK-148.5` (harness-mätningen) är fortfarande obetald.

### 1.4 Vad proffsen gör

Fullt belagt i
[`docs/research/parallella-sessioner-och-merge-van-2026-09-04.md`](../../docs/research/parallella-sessioner-och-merge-van-2026-09-04.md).
Kärnan:

- **Google, eng-practices, förstapart:** *"If you write a small CL and then
  you wait for your reviewer to approve it before you write your next CL,
  then you're going to waste a lot of time"* — stacking är motmedlet.
- **Kubernetes Tide, förstapart:** när PR:en är köad — *"typically your
  work is done!"*
- **Anthropic, förstapart:** bakgrundssessioner som committar, pushar och
  öppnar draft-PR utan att fråga; sedan ADR-096 skrevs finns dessutom
  meddelanden mellan sessioner (`notify_when_idle`, tokenfri väntan) och
  en agentvy (`claude agents`) som rekommenderad skalningsform.
- **Codex, Devin, Copilot:** asynkrona per konstruktion — uppgifter körs
  parallellt, PR:er granskas i efterhand.

Research-doket § D bär fem kandidatmönster med för/emot och vad var och
en river: (1) starta nästa oberoende enhet i stället för att parkera —
river ingenting, redan licensierat av ADR-096/097; (2) äkta stacking för
beroende skivor — river eller amenderar ADR-105/ADR-076-antaganden;
(3) feature-flaggor — stor egen investering, oprövat mot ADR-063:s
Airtable-väggar; (4) Claude Codes egna sessionsprimitiver — komplement,
oprövat mot vår worktree-isolerade harness; (5) status quo med explicit
valt väntande. Inget av dem är beslutat.

## 2. Inventeringen

| Register | Totalt | Apparat | Öppet |
|---|---|---|---|
| Trådar (`tasks/threads/`) | 183 | 118 | 18 `active`, 69 `paused` (31 `closed`) |
| Backlog-kort (`backlog/tasks/`) | 786 | 212 | 56 To Do, 2 In Progress (154 Done) |
| ADR:er (`docs/decisions/`) | 129 filer, sista `ADR-130` | 55 | — |
| Research (`docs/research/`) | 154 | ≈ 20 | — |
| Lessons | L654 i 8 volymer | — | 62 ohöstade fragment i `tasks/lessons.d/` |
| Hookar (`.claude/settings.json`) | 16 (11 PreToolUse, PreCompact, Stop/SubagentStop, 2 SessionStart, SessionEnd) | alla | — |
| Policy-filer (`.*-policy.*`) | 39 | alla | — |
| Plugin-skills (hubben) | 18 | alla | — |
| Agentdefinitioner (`.claude/agents/`) | 3 (bygg, research-pass, review) | alla | — |

| Tema | Trådar (alla) | Trådar öppna | Kort öppna | Kort Done |
|---|---|---|---|---|
| CI och grindar | 47 | 33 | 28 | 91 |
| Orkestrering | 18 | 15 | 0 | 6 |
| Agenter | 12 | 11 | 2 | 3 |
| Substrat | 12 | 10 | 15 | 42 |
| Hub och plugin | 12 | 8 | 1 | 0 |
| Sessioner | 9 | 7 | 10 | 12 |
| Mätning | 8 | 6 | 2 | 0 |

Hubben bär inga ADR:er; ADR-089 (modell/effort) och ADR-090
(sessions-parallellitet) är spoke-lokala och `SYSTEMET.md` §4 pekar hit.
Hubben har inte heller något av Kun Chen-materialet (§ 6).

## 3. Fynden som avgör hanteringen

- **QA-svansen.** Nio apparat-PRD:er har alla byggskivor Done men
  QA-vandringen (`ready-for-human`) ogjord: `TASK-148` väntekontraktet,
  `149` leveransvägen, `157` trådregistret, `158` sessionsarkiveringen,
  `159` sanningshierarkin, `160` compact-formen, `161` docs-auditen,
  `173` review-grinden, `70` arbetsflödes-gapet. Två till hålls medvetet
  öppna (`54`, `59`). Apparaten är byggd men aldrig kvitterad — och
  grinden `check-backlog-closure` räknar dem som drift varje natt.
- **Väntans-kedjan saknar bärare.** `T108` (väntan har ingen bärare) →
  `T112` (väckningen dör över turgränsen, bevisat med vaken maskin) →
  `T114` (svepet är blint för post-merge) → `T119` (bara mekanism håller)
  → `T126` (regler når inte in via resume). Alla `paused`/`active` utan
  ägare. `T183` bär Marcus egen fråga från 2026-09-02 med raden *"Bärare:
  obestämd"*.
- **Parallella sessioner grillades för en annan skala.** `T76` stängdes
  med *"max 2 i v1"*; `T67` (parallella aktiva sessioner) `paused` sedan
  2026-08-02; `T162` (två sessioners agenter i samma staging) och `T138`
  (gren/worktree-livscykeln saknar ägare) är endast registrerade. Fyra
  sessioner ligger utanför den grillade formen.
- **Ägarlappen överlevde en stängd session — idag.** Huvudkatalogen ägs
  av pid 12838, S115:s process, fast S115 är `closed` sedan igår. Lappen
  släpps av `SessionEnd`-hooken, som kräver att processen avslutas.
  `T120` beskriver klassen.
- **Öppna beslut som väntar Marcus:** `TASK-328` substratet under
  fleet-drift, `TASK-320` chat-halvans arkitektur efter
  claude.ai-avvecklingen, `TASK-330` bunt-PR:ers granskning, `TASK-326`
  nattjobbets fetch-depth, `TASK-332` restsamlingen inklusive
  K4-grillningen.
- **Substrat-drift.** `backlog/config.yml` deklarerar 5 labels, korten
  använder 30. Lokala grenar växer ≈ 49 per dygn (`TASK-323`). Sex
  agent-worktrees från S114–S117 står kvar.
- **Nightly 2026-09-04 röd på fem apparat-grindar.** Backlog-stängning,
  Sessionsdok-fönstret, Sannings-avstämning, Kontraktsvakt, Länkkontroll.
  Sessionsdok-fönstret är mätt lokalt: sex stängda dok äldre än fönstret
  (S101–S106), åtgärden är `scripts/arkivera-sessionsdok.sh --utfor` som
  flyttar dem och skriver om 28 länkar — en egen liten PR. Fyra
  odiagnostiserade.

## 4. Öppna apparat-trådar — förslag per tråd

Fem åtgärdsklasser från S91-kartan: **stäng** (besvarad och verkställd) ·
**minta kort** (klar att exekvera) · **research** (formvalet saknar
underlag) · **väntar Marcus** (beslutet är hans) · **vilande med skäl**.
Ny klass här: **grillning S118** — indata till scope-steg 2. Kolumnen
*Underlag* säger om förslaget vilar på läst tråd-kort eller bara på
README-raden.

### 4.1 Aktiva (18)

| Tråd | Tema | Förslag | Skäl | Underlag |
|---|---|---|---|---|
| `T01` | substrat | vilande med skäl | roten till registret, metatråd | kort |
| `T17` | hub | stäng-kandidat | `SYSTEMET.md` finns (ADR-070); pröva om T17:s lista är täckt | README |
| `T61` | orkestrering | grillning S118 | AFK/Ralph-loop + sandbox är K4:s obyggda del | kort |
| `T71` | orkestrering | grillning S118 | dynamiska workflows i orkestreringen, beslut ej fattat | kort |
| `T85` | CI | stäng-kandidat | ADR-077 + `TASK-70` landade; bara `70.7` kvar | kort |
| `T86` | orkestrering | väntar Marcus | Pocock-korpus, arbetssätts-delta; eget spår | kort |
| `T89` | orkestrering | stäng-kandidat | fynden fördes in i T85/T119; pröva rest | kort |
| `T98` | CI | väntar Marcus | Codex-kommentarer olästa sedan 2026-07-24: läs eller stäng av | kort |
| `T119` | CI | grillning S118 | paraply-tesen för hela apparaten | kort |
| `T120` | sessioner | minta kort | instans idag: lappen överlever `closed` session | kort |
| `T122` | substrat | stäng-kandidat | ADR-095 landade relationsmodellen; pröva rest | kort |
| `T126` | orkestrering | grillning S118 | regler når inte in via resume — direkt relevant för default-beteende | kort |
| `T147` | CI | minta kort | staging saknar fixtur av rätt klass; `TASK-277/278` | kort |
| `T149` | CI | stäng-kandidat | `TASK-281` Done; pröva om AC:n täcks | kort |
| `T150` | CI | minta kort | warmup-gaten mot främmande server | kort |
| `T151` | CI | stäng-kandidat | Sentry inkopplad? pröva mot Vercel-variabeln | kort |
| `T171` | substrat | väntar kort | `TASK-302.3` bär åtgärden | kort |
| `T148` | agenter | *(kort-ID, ej tråd — se § 5)* | — | — |

### 4.2 Pausade med kort eller aktivitet 2026-08 (34)

| Tråd | Tema | Förslag | Skäl | Underlag |
|---|---|---|---|---|
| `T108` | orkestrering | grillning S118 | kärnkortet för väntan; ADR-096 avgjorde subagent-halvan, inte session-halvan | kort |
| `T110` | orkestrering | grillning S118 | orkestrerarens felklasser, uppdrags-ögonblicket | kort |
| `T111` | orkestrering | grillning S118 | kontexttröskel; stafettväxling är built-in i routines | kort |
| `T112` | orkestrering | grillning S118 | väckningskedjan; mätningen `TASK-148.5` obetald | kort |
| `T114` | orkestrering | minta kort | svepet blint för post-merge; `TASK-365` bär en instans | kort |
| `T116` | orkestrering | vilande med skäl | provisoriet fungerar; pröva mot `TASK-127.2` | kort |
| `T118` | orkestrering | stäng-kandidat | kön har varit öppen sedan 2026-08 | kort |
| `T128` | orkestrering | stäng-kandidat | `TASK-137` — pröva kortstatus | kort |
| `T132` | orkestrering | stäng-kandidat | `TASK-128` Done, `145.1` — pröva | kort |
| `T144` | orkestrering | minta kort | svepet larmar utan ägarskapsfilter; instans varje parallell dag | kort |
| `T179` | orkestrering | grillning S118 | kontextväggen under AFK; samma familj som T111 | kort |
| `T92` | agenter | vilande med skäl | (b)-posten ej levererad, lågt tryck | kort |
| `T99` | agenter | grillning S118 | natt-bygge-skillen = mekanisera Marcus-frågorna | kort |
| `T113` | agenter | minta kort | `TASK-125` finns och är plockbar | kort |
| `T141` | agenter | stäng-kandidat | `TASK-202` Done; oförklarat men mätt | kort |
| `T164` | agenter | minta kort | deny-hook för deploy i research-kontext | kort |
| `T183` | agenter | grillning S118 | Marcus egen fråga; stopp-regler + mätskript + orkestrerar-lesson | kort |
| `T67` | sessioner | grillning S118 | parallella aktiva sessioner — piloten som aldrig grillades klart | kort |
| `T64` | CI | stäng-kandidat | `TASK-16` Done; pröva | kort |
| `T72` | CI | vilande med skäl | staging-först är praxis; pröva mot ADR-061 | kort |
| `T84` | CI | stäng-kandidat | review-grinden (ADR-105) är den standardiserade formen | kort |
| `T87` | CI | väntar Marcus | visual-grinden blockerande; `TASK-297` | kort |
| `T106` | CI | vilande med skäl | race, låg frekvens | kort |
| `T115` | CI | stäng-kandidat | `TASK-130/131` Done; pröva 132 | kort |
| `T129` | CI | vilande med skäl | `TASK-127.9` | kort |
| `T140` | CI | minta kort | mät residuet purgen inte tar | kort |
| `T142` | CI | stäng-kandidat | `TASK-312` verktygs-pinning Done | kort |
| `T166` | CI | väntar Marcus | `TASK-284.4` är hans dom (S112) | kort |
| `T172` | CI | väntar Marcus | `TASK-297` | kort |
| `T173` | CI | minta kort | `TASK-298` | kort |
| `T49` | substrat | vilande med skäl | förfinas vid hub-lyft | kort |
| `T73` | substrat | stäng-kandidat | absorberas av `T171`/`TASK-302.3` | kort |
| `T101`, `T102` | mätning | vilande med skäl | flake-klass, jagas med `metrics:flake` | kort |
| `T134` | mätning | grillning S118 | genomloppstid mot kodens storlek — Marcus egen fråga | kort |

### 4.3 Pausade, endast registrerade — utan kort (35)

Dessa har ingen kortfil; förslaget vilar på README-raden och på vad som
landat sedan de registrerades. Triagen i scope-steg 3 prövar var och en
mot disk innan något stängs.

| Hink | Trådar | Förslag |
|---|---|---|
| Sannolikt mötta av senare landning — **stäng-kandidater** | `T03`, `T04`, `T05`, `T07`, `T27`, `T34`, `T36`, `T52`, `T165` | pröva mot ADR-099, `TASK-109`, `TASK-133`, ADR-080, `fas4-prod-deploy.sh`, `TASK-281` |
| Beslut som är Marcus — **väntar Marcus** | `T08`, `T13`, `T58`, `T137` | `TASK-326`; hub-CI; hub-ADR-hemvist; CI som hub-tjänst (kopplar till K4) |
| Små städposter — **minta kort** i en bunt | `T09`, `T11`, `T20`, `T88`, `T175`, `T178`, `T139`, `T169`, `T143` | byggplan-stale, status-enum, frontmatter-touch, länkar, `environment:`-skydd, stale Vite, flake-mätning, grund-checklista |
| Kräver form — **research** | `T162`, `T138` | delad staging mellan sessioner; gren/worktree-livscykelns ägare |
| **Vilande med skäl** | `T06`, `T23`, `T31`, `T37`, `T45`, `T56`, `T59`, `T63`, `T70`, `T91` | lågt tryck, inget blockerar |

## 5. Öppna apparat-kort — förslag per kort

| Kort | Tema | Status | Förslag | Skäl |
|---|---|---|---|---|
| `TASK-148` + `148.5`, `148.6`, `148.7` | sessioner | To Do | grillning S118 → sedan QA | väntekontraktet; `148.5` är mätningen som avgör om ADR-096:s avrådan står |
| `TASK-149` + `149.7` | substrat | To Do | QA eller ärlig stängning | leveransvägen byggd |
| `TASK-157` + `157.4` | substrat | To Do | QA eller ärlig stängning | trådregistret byggt |
| `TASK-158` + `158.5`, `158.6` | substrat | To Do | `158.5` plockbar, sedan QA | hub-steget saknas |
| `TASK-159` + `159.3` | substrat | To Do | QA eller ärlig stängning | sanningshierarkin byggd |
| `TASK-160` + `160.7` | sessioner | To Do | QA eller ärlig stängning | compact-formen byggd |
| `TASK-161` + `161.10` | substrat | To Do | QA eller ärlig stängning | docs-auditen byggd |
| `TASK-173` + `173.7` | CI | To Do | QA-vandring | review-grinden byggd; skarpbevis-skulder i `173.7` |
| `TASK-70` + `70.7` | CI | To Do | väntar Marcus | preview-miljö per PR — "eliten tar bort väntan, inte kontrollen" |
| `TASK-54`, `TASK-59` | CI | To Do | vilande med skäl | `intentionally-open` |
| `TASK-328` | substrat | To Do | väntar Marcus (grillning) | substratet under fleet-drift |
| `TASK-320` | sessioner | To Do | väntar Marcus (grillning) | ADR-043-familjen efter claude.ai |
| `TASK-330` | CI | To Do | väntar Marcus (beslut) | bunt-PR:ers `kortId` |
| `TASK-326` | CI | To Do | väntar Marcus (beslut) | nattjobbets fetch-depth |
| `TASK-332` | sessioner | To Do | väntar Marcus | restsamlingen; K4-grillningen `S101-Ö3` |
| `TASK-125` | mätning | To Do | plockbar | Sonnet high mot xhigh |
| `TASK-112` | mätning | To Do | plockbar | testgraf-skuggmätning |
| `TASK-154`, `TASK-155` | sessioner | To Do | minta bunt | resume-skillen saknar inline-täckning — T126-klassen |
| `TASK-156`, `TASK-336` | agenter | To Do | plockbar | bygg-agent-kontraktet: TDD-bärare; prompt-spärr under bypass |
| `TASK-206` | CI | To Do | stäng-kandidat | beslutet redan taget: grinden körs inte repo-brett under fleet-last |
| `TASK-323` | CI | To Do | plockbar | gren-städning; AC #2 slutmätning |
| `TASK-335` | substrat | To Do | plockbar | `bl`-wrapperns konfigläcka |
| `TASK-294` | hub | To Do | väntar Marcus | plugin-cachen släpar |
| `TASK-169`, `TASK-318` | substrat | To Do | plockbar | Done-kort med obockade AC; claude.ai-synkrader |
| `TASK-37`, `TASK-307` | CI | In Progress | driv i mål | deploy-audit; CLS-tröskeln |
| `TASK-256`, `TASK-354`, `TASK-366`, `TASK-383` | CI | To Do | plockbar bunt | 12-min-taket, samma organiska tillväxt |
| `TASK-296`, `TASK-300`, `TASK-329`, `TASK-337`, `TASK-365`, `TASK-309.21`, `TASK-189`, `TASK-195` | CI | To Do | plockbar | fynd, var och en avgränsad |
| `TASK-199`, `TASK-207`, `TASK-254`, `TASK-297` | CI | To Do | väntar Marcus | prod-front-drift; transienta 502; nightly-snitt; facit-täckning |

## 6. Kun Chen-spåret

Session 101 (2026-08-09, `tasks/sessions/2026-08-09-session-101.md`)
kartlade alla tre videorna. Transkripten ligger i `docs/research/`
(`l8-workflow-`, `l8-fullstack-`, `l8-devenv-transkript-2026-08-09.txt`)
och analysen i `docs/research/l8-workflow-kartlaggningen-2026-08-09.md`
(701 rader). Nio kandidater: K1 review-grinden **byggd** (ADR-105,
`TASK-173`), K2 worktree-pool, K3 plan-som-artefakt, K4
**exekverings-hubben** (FirstMate-klassen — Marcus: *"exakt det jag ser
framför mig … ett HUBB-system som man kan plugga in i varje scope"*),
K5 röst-input, K6 verktygsergonomi, K7 bias-korrektionsrader, K8
mål-driven långkörning, K9 secrets-godkännande. ADR-106 (agnostik) och
ADR-107 (reproducerbarhet) föddes ur passet.

Vad som är öppet: `S101-Ö1`–`Ö8` på `TASK-332`, där **`Ö3`
K4-grillningen är huvudspåret och obörjad**. FirstMate är exakt
orkestrering av flera sessioner med tillsyn till merge — samma fråga som
§ 1. Hub-syncen (`Ö8`) gjordes aldrig: hubben har noll träffar på Kun
Chen. Kuns egen siffra, 40–50 testade prod-PR:er per dag, vilar på
asynkron landning (No Mistakes-pipelinens sista steg är *babysitting till
merge*, inte väntan före nästa enhet).

## 7. Föreslagen väg

1. **Landa kartan och research-doket** (denna PR).
2. **Grilla kärnfrågan i ett pass** med indata: `T183`, `T67`, `T108`/
   `T112`, `T126`, `T134`, `T179`, K4 ur S101, research-dokets fem
   kandidatmönster, och gårdagens tidslinje. Utfallet är beslut om
   (a) nästa-enhet-default efter armering, (b) stacking eller inte för
   beroende skivor, (c) Claude Codes agentvy och sessionsmeddelanden som
   komplement, (d) om `TASK-148.5` prioriteras som mätning. ADR-bar prövas
   på varje.
3. **Triage** av § 4 och § 5 mot disk, i bunt-PR:er: stäng-kandidater
   stängs med belägg, minta-buntar mintas via CLI, QA-svansen får ett
   Marcus-beslut per PRD.
4. **S112 stängs i ett eget kort pass** (resume → session-end), inte
   som detour här.

## 8. Vad jag inte kunde avgöra

- Om gårdagens fyra samtidiga väntetillfällen är representativa för en
  genomsnittsdag. Bara S112–S117 är lästa; ingen bredare serie.
- Hur länge S114 faktiskt väntade på `#2229` — bara landningstiden är
  bokförd.
- De fyra odiagnostiserade Nightly-grindarna.
- Om Claude Codes `notify_when_idle` fungerar tvärs worktree-isolerade
  subagenter i vår harness-version.
- Om feature-flaggor är förenliga med ADR-063:s Airtable-väggar.
- Åtgärdsklassen för de 35 endast registrerade trådarna (§ 4.3) vilar på
  README-rader, inte på lästa kort — triagen prövar dem mot disk.

## Källor

Sex read-only-pass 2026-09-04 mot `78de4a7d`; deras rådata ligger i
sessionens agent-transkript, inte i repot. Filer citerade ovan är den
verifierbara ytan. Research-passet:
[`docs/research/parallella-sessioner-och-merge-van-2026-09-04.md`](../../docs/research/parallella-sessioner-och-merge-van-2026-09-04.md).
Prejudikat för formen: [`S91-tradkarta-2026-07-31.md`](S91-tradkarta-2026-07-31.md).
