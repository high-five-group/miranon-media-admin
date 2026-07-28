# Granskning av agent-, Git- och CI/CD-arbetsflödet

> Datum: 2026-07-28 (Session 91, elfte resumen)
> Beställare: Marcus. Frågan i klartext: *"Om vi gör klart allt i restlistan, har
> vi det arbetsflödet jag vill ha då? Om inte, vad behöver vi göra?"*
> Målbilden kom ur en ChatGPT-genomgång av hur starka team arbetar; prompten
> skrevs med hjälp av Codex.
> Arbetssätt: helt skrivskyddad granskning. Inga filer, inga GitHub-tillstånd och
> inga inställningar ändrades under passet.
> Föregångare: [Codex-eftergranskningen 2026-07-24](arbetsflode-processgranskning-eftergranskning-2026-07-24.md)
> (6,5 → 8/10). Denna granskning är nästa iteration av samma fråga och bygger
> vidare på dess dom i stället för att göra om den.
> Karta: [`tasks/s91-restlistan.md`](../../tasks/s91-restlistan.md) § A7.

## Slutsats: DELVIS

Delarna är byggda, och flera av dem är starkare än vad målbilden beskriver som
normalläge. Men **integrationsläget och verifieringsläget är hoptryckta till en
enda obligatorisk PR-grind** — Marcus misstanke före granskningen var korrekt.

Och det direkta svaret på hans fråga: **nej, restlistan stänger inte gapet.**
Merge queue ligger som ett obeslutat beslut, "flytta staging ur den kritiska
vägen" fanns inte som post över huvud taget, och den enda staging-posten
(`T85` våg 3) är **delvis falsifierad** — mutexen går inte att avveckla med
per-run-isolering, eftersom Airtables 5 req/s-tak är delat per bas (`P4`).

Posterna som stänger gapet är därför nya. De bor i restlistans § A7 och sammanfattas
i [§ Prioriterad åtgärdsplan](#prioriterad-åtgärdsplan) nedan.

## De fem nivåerna

Granskningen skiljer genomgående på fem saker, eftersom sammanblandningen är
själva risken:

1. **dokumenterat** som önskat arbetssätt,
2. **implementerat** i kod eller konfiguration,
3. **tekniskt framtvingat** — går inte att kringgå,
4. **frivillig efterlevnad** — en regel agenten kan glömma,
5. **ej verifierbart** från nuvarande åtkomst.

Nivå 4 är den farliga: den ser ut som nivå 3 i dokumentationen.

## Så fungerar det faktiskt i dag

Verifierat flöde, steg för steg:

1. Gren skapas — bygg-agent i egen worktree, orkestrerare i huvudkatalogen.
2. Ändring, path-scopad `git add`, lokal commit.
3. Lokala grindar: `check:docs` (nio grindar) · `typecheck` · `biome` ·
   `test:api` enligt `CONTRIBUTING.md` Definition of Done.
4. Push, PR via `gh pr create`.
5. `ci.yml` triggas. Jobbet `Detect changed files` klassar diffen.
6. Klassningen avgör vad som körs — **detta är flödets starkaste del**:
   - **D0** (docs-only) → hela `Test suite` skippas (`ci.yml` rad 33).
   - **D1** (ren UI/CSS, allowlist aldrig blocklist) → `run_staging: false`.
   - **`acceptance_local`** → `run_staging: false` (`ci.yml` rad 542).
   - **`dedup_hit`** → main-push vars träd redan bevisats grönt kör inte om
     sviten (`ci.yml` rad 523).
7. `CI Passed or Skipped` aggregerar **fail-closed** — en skippad paraply-check
   räknas inte tyst som grön (bevisat skarpt via `gate-proof.yml`).
8. Auto-merge armeras **manuellt av orkestreraren**, en PR i taget.
9. Merge till `main`. Dedupen gör att sviten inte körs om.

### Uppmätta tider

Ur `gh run view --json jobs`, inte uppskattat:

| PR-typ | Total | Kritisk väg |
|---|---|---|
| Docs-only (D0) | **53–79 s** | Lint 38 s |
| Kod, full svit | **445 s (7,4 min)** | purge 9 s → **Staging 375 s** |
| Dependabot | 372–475 s | **Acceptance 421 s** |

Per jobb på en full kod-PR (run `30369011230`, `TASK-68`):

| Jobb | Tid |
|---|---|
| Staging (API + E2E) | **375 s** |
| Acceptance (hermetisk) | **346 s** |
| A11y (axe-runner) | 103 s |
| Pure + Build | 40 s |
| Docs link check | 40 s |
| Lint + Audit + TypeCheck | 38 s |
| Detect changed files | 10 s |
| Staging sentinel purge | 9 s |
| CI Passed or Skipped | 3 s |

## Orkestrerare, subagenter och parallella sessioner

| Aktör | Isolering | Nivå |
|---|---|---|
| Orkestrerare | Huvudkatalogen, ingen isolering | 4 — frivillig |
| `bygg-skiva` | Egen worktree via `isolation: worktree` i frontmatter | **3 — tekniskt** |
| `research-pass` | Egen worktree | **3 — tekniskt** |
| `general-purpose` | **Ingen** | — |
| Parallella sessioner | Egna worktrees (`wt-s91`, `wt-atlas`) | 4 — frivillig |

Isoleringen fungerar i praktiken: `.claude/worktrees/` bar två aktiva
agent-worktrees vid granskningstillfället.

### Fynd — spawn-loggen mäter fel fält

`.claude/agent-spawn-log.jsonl` loggar `"isolation": null` på **varje**
`bygg-skiva`-rad, trots att samtliga kördes isolerat. Hooken i
`.claude/settings.json` läser `tool_input.isolation` — spawn-parametern — medan
isoleringen i själva verket kommer ur agentdefinitionens frontmatter. Den som
läser loggen för att svara *"körde agenterna isolerat?"* får alltså **fel svar**,
och felet pekar åt det farliga hållet: det ser ut som att isolering saknas där
den finns. Mätaren mäter inte det den utger sig för att mäta.

### Fynd — `general-purpose` är oisolerad

Loggen visar tre `general-purpose`-spawns 2026-07-28 kl. 13:44. Den agenttypen
saknar worktree-frontmatter. Skriver en sådan agent till repot gör den det i
huvudkatalogen, på orkestrerarens gren — exakt den kollisionsklass
worktree-mekaniseringen infördes för att stänga.

### Fynd — kollisionsskyddet är sekvensering, inte teknik

Landnings-ordningen (`CONTRIBUTING.md` § Landnings-ordningen, rad 155) är
välskriven och korrekt. Den är också **nivå 4**: en regel orkestreraren
frivilligt följer, utan mekanisk spärr. Den brast två gånger under en och samma
resume 2026-07-28, trots att den varit nedskriven sedan S81. Merge queue är den
mekaniska motsvarigheten, och den finns inte.

## Jämförelse med målbilden

| Del av flödet | Målbild | Nuvarande | Enforcement | Bedömning | Evidens |
|---|---|---|---|---|---|
| Kortlivade grenar | Små, ofta | Ja | 4 | **Stark** | 15 PR:er per resume |
| Push tidigt | PR tidigt | Ja | 4 | Stark | PR-historik |
| Snabb PR-grind 2–10 min | Build, typ, kritiska tester | Docs 1 min, **kod 7,4 min** | 3 | **Delvis** | run `30369011230` |
| Testurval | Riskbaserat | D0/D1/dedup | 3 | **Branschledande** | `ci.yml` rad 33–299 |
| Blockerande = få | build, typ, lint | **Även staging E2E, a11y, acceptance** | 3 | **Gap** | `ci-suite.yml` |
| Post-merge-lager | Bredare svit | **Dedup gör att main-push kör mindre** | — | **Saknas** | `ci.yml` rad 523 |
| Staging-deploy | Efter merge | Staging testas **före** merge | 3 | **Omvänt** | `ci.yml` rad 542 |
| Nattflöde | Djupt och långsamt | Fullsvit, audit, länkar, kontraktsvakt, larm | 3 | **Stark** | `nightly.yml` |
| Merge queue | Serialiserar landning | **Finns inte** | — | **Saknas** | ruleset: fyra regler, ingen queue |
| Rollback | Snabb revert | Ej dokumenterad | — | Lucka | — |
| Main-skydd | PR krävs | Ruleset, **tom bypass-lista** | **3** | **Stark** | `bypass_actors: []` |

### Ruleset-fakta, verbatim ur API:t

Ruleset `main-skydd` (id 19627609), `enforcement: active`, target
`~DEFAULT_BRANCH`:

- regler: `deletion` · `non_fast_forward` · `pull_request` · `required_status_checks`
- `required_approving_review_count: 0`
- `allowed_merge_methods: ["merge"]`
- `strict_required_status_checks_policy: **true**`
- required checks: **exakt en** — `CI Passed or Skipped`
- `bypass_actors: []`, `current_user_can_bypass: "never"`

Repo-inställningar: `allow_auto_merge: true` · `delete_branch_on_merge: **false**`
· `allow_update_branch: false`.

Klassisk branch protection är **inte** aktiv (`404 Branch not protected`) —
skyddet bärs helt av rulesetet, vilket är den moderna formen.

## Tester och grindar per fas

**Lokalt och riktat:** `typecheck` · `biome` · `test:api` · `check:docs`.
Sekunder till någon minut. **Rätt fas.**

**Snabb PR-grind (blockerande):**

| Jobb | Tid | Rätt fas? |
|---|---|---|
| Detect changed files | 10 s | Ja |
| Lint + Audit + TypeCheck | 38–44 s | Ja |
| Pure + Build | 29–40 s | Ja |
| Docs link check | 34–41 s | Ja |
| Acceptance (hermetisk) | **346–421 s** | Gränsfall — hermetisk och mutexfri, men 6–7 min |
| A11y (axe-runner) | 97–103 s | Gränsfall |
| Staging (API + E2E) | **375 s + mutexkö** | **Nej — fel fas** |

**Efter merge:** i praktiken ingenting. `dedup_hit` gör att main-push kör
*mindre* än PR:en gjorde. Det finns inget andra skyddslager mellan merge och
natten.

**Nattligt (`nightly.yml`, cron `0 3 * * *`):** fullsvit · bredare
sårbarhetsgranskning · länkkontroll utan cache · CI-mätning · kontraktsvakt ·
larmkedja som öppnar tilldelat ärende. **Rätt fas, välbyggt.**

## Gap och risker

### Kritiska

**K1 — Staging E2E blockerar merge.** 375 s plus global mutex
(`concurrency: staging-tests` i `ci-suite.yml`) ligger i den kritiska vägen. Det
gör varje kodändring till en högriskrelease.

**K2 — Inget post-merge-lager.** Målbilden bygger på att djupa kontroller
flyttas *efter* merge. Vi har flyttat dem *före* och sedan dedupat bort dem
efteråt. Tas något ur PR-grinden i dag finns ingen andra chans före natten.
**K2 är därför förkrav för K1** — ordningen får inte kastas om.

**K3 — Nattnätet är rött och obehandlat.** Två röda körningar i rad:
2026-07-27 22:05 (länkkontroll + Staging API/E2E) och 2026-07-28 04:15
(kontraktsvakt). Ärende `#332` öppet sedan kl. 12:00, noll kommentarer.
Orsaken till den 28:e är sannolikt åtgärdad av `TASK-61` — som landade kl. 13:24,
alltså **efter** 04:15-körningen — men **fixen är obevisad i skarp miljö** och
ingen har noterat det i ärendet. Ett larmsystem vars ärenden ligger obehandlade
slutar fungera som larmsystem.

**K4 — Landnings-ordningen har noll teknisk enforcement.** Se § Orkestrerare
ovan.

### Viktiga

**V1 — `general-purpose` är oisolerad** och användes tre gånger 2026-07-28.

**V2 — Spawn-loggen mäter fel fält** och ger falskt negativt om isolering.

**V3 — `delete_branch_on_merge: false`** — grenar ackumuleras.

**V4 — Acceptance 6–7 min** är näst tyngst i grinden trots att den är hermetisk
och mutexfri. Den är kandidat för urval (kör den delmängd diffen rör).

### Förbättringar

**F1 — Ingen dokumenterad rollback-väg.** Att flytta kontroller ur PR-grinden
förutsätter att fel kan backas snabbt; den vägen är inte skriven.

**F2 — Ingen preview-miljö** — utforskningsläget saknar delad yta.
**Åtgärdsplanen nedan missade denna post**, vilket Marcus fångade 2026-07-28
genom att läsa förbättringslistan mot A7:s punkter. Glidningen var min, inte en
avgränsning. Mintad i efterhand som **`TASK-70.7`**, medvetet klassad sist och
utan dep: den ändrar inte den kritiska vägen, och för en ensam granskare som
redan kör lokalt är vinsten bekvämlighet snarare än kapacitet. Kortets steg 0
kräver att nyttan prövas innan något byggs.

**F3 — `allow_update_branch: false`. ⚠️ RIVEN SAMMA DAG — posten var fel.**
Den påstod en inkonsistens mellan inställningen och flödets bruk av
`gh pr update-branch` (form B i landnings-ordningen). Två saker motbevisar den.

**Empirin:** `gh pr update-branch` kördes tre gånger 2026-07-28 (`#340`, `#354`,
`#355`) med inställningen på `false`, och samtliga gav `✓ PR branch updated`.

**Källan förklarar varför.** GitHubs REST-dokumentation definierar fältet som
*"Either true to always allow a pull request head branch that is behind its base
branch to be updated **even if it is not required to be up to date before
merging**, or false otherwise."* Vårt ruleset har
`strict_required_status_checks_policy: true` — grenen **är** krävd att vara
up-to-date. Fältet reglerar alltså bara det fall som inte gäller oss.

**Lärdomen:** posten skrevs på att två värden såg motsägelsefulla ut
tillsammans, utan att fältets definition lästs. Det är samma klass som filen
själv granskar — ett påstående utan källa. Ingen åtgärd behövs;
`TASK-70.6` bär ett AC som håller inställningen oförändrad, vilket är rätt
spärr och nu med rätt skäl.

## Det agentdrivna flödet — steg för steg

Målbildens modell var: etikett `agent: implement` → GitHub App → agent läser
issue → branch → kod → PR som bot → CI → merge queue.

| Steg | Vårt läge |
|---|---|
| Etikett `agent: implement` | **Saknas** — inga agent-etiketter finns (`gh label list`) |
| GitHub App notifieras | **Saknas** — inga webhooks (`/hooks` returnerar `[]`) |
| Agenten läser issuet | **Likvärdigt annat** — läser backlog-kort via CLI |
| Agenten skapar branch | **Fullt implementerat** |
| Agenten skriver och committar | **Fullt implementerat** |
| Agenten öppnar PR som bot | **Delvis** — PR öppnas som Marcus, inte som bot |
| CI testar PR:en | **Fullt implementerat** |
| PR:en går in i merge queue | **Saknas** — ersatt av manuell sekvensering |

**Bedömning:** skillnaden är **avsiktlig och rimlig** för de fem första stegen.
Backlog-kort med AC och DoD är ett bättre substrat än GitHub-issues för detta
arbete, och en GitHub App skulle lägga till infrastruktur utan att lösa ett
problem vi har. Att PR:en öppnas som Marcus i stället för som bot är en
kosmetisk skillnad utan konsekvens i ett en-personsteam.

**De två sista stegen är däremot äkta luckor**, och merge queue är den som
kostar mest.

## Rekommenderat framtida flöde

```text
Utforskning:  lokalt + lokala commits + riktade tester           (ingen CI)
      ↓
Integration:  PR → lint · typecheck · build · Pure ·             MÅL: < 4 min
      ↓        acceptance-urval            (BLOCKERAR merge)
Merge queue:  serialiserar landningen               (tekniskt, ej regel)
      ↓
Verifiering:  post-merge på main → staging E2E · a11y ·          (BLOCKERAR EJ)
      ↓        full acceptance — rött ⇒ auto-ärende + revert
Natt:         fullsvit · audit · länkar · visuellt · kontraktsvakt
```

**Ska blockera merge:** lint · typecheck · build · Pure · den delmängd av
acceptance som diffen rör.

**Ska köras efter merge:** staging E2E · a11y · full acceptance.

**Ska ligga kvar på natten:** allt som redan gör det.

## Prioriterad åtgärdsplan

| # | Vad | Varför | Berör | Verifieras | Avbrottsfritt? |
|---|---|---|---|---|---|
| 1 | Stäng `#332` med skriven motivering och kör `nightly.yml` manuellt | Rött nattnät utan uppföljning urholkar hela larmkedjan | Ärende `#332` | Grön dispatch | Ja |
| 2 | Rätta spawn-loggens fält | Mätaren ger fel svar i dag | `.claude/settings.json` | Ny rad visar `worktree` | Ja |
| 3 | **Aktivera merge queue** | Ersätter landnings-ordningen med mekanik | Ruleset `main-skydd` | Två PR:er armerade samtidigt landar utan `BEHIND` | Ändrar beteende |
| 4 | **Bygg post-merge-jobbet** på `main` | Förkrav för steg 5 — utan det finns inget skyddsnät | Nytt `post-merge.yml` | Kör grönt på main-push | Ja, additivt |
| 5 | **Flytta `Staging (API + E2E)` ur PR-grinden** | −375 s och mutexen ur kritiska vägen | `ci-suite.yml`, ruleset | Kod-PR under 4 min | Ändrar beteende |
| 6 | Flytta `A11y` till post-merge | −103 s | `ci-suite.yml` | Grön post-merge | Ändrar beteende |
| 7 | Dokumentera revert-vägen | Steg 5–6 förutsätter att fel kan backas snabbt | `CONTRIBUTING.md` | Övad revert | Ja |
| 8 | `delete_branch_on_merge: true` | Hygien | Repo-inställningar | Gren borta efter merge | Ja |

**Steg 1–2 kan göras omedelbart. Steg 3–4 är förkrav för 5–6 — gör dem aldrig i
omvänd ordning.** Att flytta staging ur grinden innan post-merge-lagret finns
skulle ta bort en kontroll utan att ersätta den, vilket är precis det målbilden
varnar för: *"eliten tar inte bort kontrollen — de tar bort väntan."*

## Vad som är starkt och ska behållas orört

- **Main-skyddet.** Ruleset med tom bypass-lista och `strict` required check.
- **Riskklassningen.** D0/D1/`acceptance_local`/dedup är genuint
  branschledarmässig — allowlist aldrig blocklist, och varje klass har
  kontrastbevis.
- **Fail-closed-aggregatorn** med skarpt tvåsidigt bevis via `gate-proof.yml`.
- **Nattnätet** med larmkedja till tilldelat ärende och stängningsregel.
- **Worktree-isoleringen** för `bygg-skiva` och `research-pass`.
- **Acceptance-klassens utbrytning** ur staging-mutexen (`ADR-080`, `TASK-59`)
  — den tog bort väntan utan att skära täckning, vilket är exakt rätt rörelse.

## Ej verifierbart

| Vad | Åtkomst som krävs |
|---|---|
| GitHub Apps installerade på org-nivå | Org-admin-token (`/installation` gav 401) |
| Org-nivå rulesets ovanför repots | Org-admin-läsning |
| Actions-minuter och kostnadstak | Billing-åtkomst |
| Om `T85` våg 3:s falsifiering ändrar staging-taket | Ny mätning mot `airtable-constraints.md` `P4` |
| Faktisk flaky-frekvens i CI-historiken | `TASK-64` steg 0, ej kört |
