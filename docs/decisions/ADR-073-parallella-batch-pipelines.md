# ADR-073: Parallella batch-pipelines — T76-formen bevisad (amenderar ADR-071)

- Status: Accepted (Session 65 — 2026-07-12; grillad samsyn T76 2026-07-11
  [5 beslut, samtliga Marcus-kvitterade, kanonisk plats: tråd-kortet] +
  pilot BEVISAD S65 på partitionen task-8.1–8.3 ∥ task-9.1/9.3;
  design-kvittens "A/A, max-kort 5" i delegerad senior-form; kanonisk
  pilot-trail: `tasks/sessions/2026-07-12-session-65.md` Del 2–5)
- Datum: 2026-07-12
- Fas: Session 65 — arbetssätt/exekverings-process (ingen
  byggfas-status-ändring)

> **Amendering (Session 66, 2026-07-12 — förbättringspasset + parallell-
> batch 2, first-pass 4/4; kanonisk trail: S66-doket Del 2–4; Marcus-
> kvittens A/A/A/A i delegerad senior-form):** tre poster; beslutstexten
> nedan bevaras oförändrad (immutabilitet).
>
> 1. **Beslut 7:s gransknings-recept REVIDERAT:** "preview på 5173"
>    skrevs före TASK-10 fälla 5 och falsifierades av den — byggd app
>    på dev-originet ÄR infektionsvägen (byggd SW servar cache-first
>    för evigt; L276). Reviderat recept: `npm run build:staging` +
>    `npm run preview:staging` (4173 — CORS-tillåten sedan S66-
>    enabling-steget; origin-separationen är SW-mekanisk per MDN).
>    TASK-10-leveransen bär scripten + runbooken
>    (`docs/reference/staging-verifiering-runbook.md`).
> 2. **Beslut 4-komplement (defense-in-depth):** Test+Build-jobbet bär
>    konstant concurrency-grupp `staging-tests` med `queue: max`
>    (Actions-plattformskö 2026-05-07; default-beteendet avbryter
>    pending). Options-radens förkastande av jobb-nivå-concurrency som
>    ERSÄTTNING står oförändrat — detta är ett komplement BAKOM
>    orkestratorns seriella kedja (skyddar PR-run ∥ main-push-klassen,
>    t.ex. docs-pushar under batch). Research-grund (S66 Del 2): merge
>    queue-klassen (GitHub/GitLab/Bors) ordnar landningen logiskt men
>    kör pipelines parallellt → resurs-mutexen måste ägas separat;
>    GitHub Merge Queue dessutom otillgänglig (User-ägt repo).
> 3. **Beslut 2-skärpning (batch 2-empiri):** worktree-familjen delar
>    `.git` → `origin/main`-refen är DELAD RÖRLIG YTA under parallell
>    drift (orkestrator-merge flyttar den mitt i en agents körning) —
>    claims-/diff-verifiering görs mot FÖRGRENINGS-SHA:t, aldrig mot
>    refen. Semafor-wrappern är formaliserad som repo-artefakt
>    (`scripts/staging-semaphore.sh`). Tre orkestrator-grindar
>    skarpbevisade och kodifieras i /work-batch 1.15.0: merge-tree-
>    grinden före PR · claims-kvittot (deklarerad yta ∩ faktisk diff) ·
>    pr-ci-bevisformen för e2e när 5173 är upptagen (jobblogg-
>    verifierad, test-count-delta).
>
> **Amendering 2 (Session 68, 2026-07-18 — arbetssätts-paketet R2;
> kanonisk trail: S68-doket Del 1–2; Marcus-kvittens "Kvitterar!" på
> RAPPORTERA-scopet):** en post; beslutstexten bevaras oförändrad
> (immutabilitet).
>
> 1. **Beslut 4-komplementets KONSTANTA concurrency-grupp förfinas
>    till VILLKORLIG:** Dependabot-actorn får unik grupp
>    (`depbot-<run_id>`); alla övriga runs behåller konstant
>    `staging-tests` + `queue: max`. Grund: Dependabot-runs skippar
>    SAMTLIGA staging-/serversteg (ADR-031 Lager 3) men FIFO-köade
>    ändå bakom mutexen — S68-mätningen: 44 s Test+Build-arbete mot
>    7m15s elapsed, monoton kö-trappa över 6 samtidiga PR:er
>    (2026-07-18, run 29654725274 m.fl.). Invarianten "aldrig två
>    samtidiga staging-rörande runs" bevaras ordagrant: SAMMA predikat
>    (`github.actor`) driver både stegens skip och grupp-valet, så
>    alignmenten är definitionell även vid re-run (re-run-actor ≠
>    `dependabot[bot]` ⇒ staging-stegen körs OCH gruppen blir
>    `staging-tests`). Options-radens förkastande av
>    jobb-nivå-concurrency som ERSÄTTNING för orkestrator-kedjan står
>    oförändrat — komplement-statusen ärvs (defense-in-depth BAKOM
>    den seriella PR→CI→merge-kedjan).
>
> **Amendering 3 (Session 75, 2026-07-21 — batch-halten 18.1 +
> täcknings-passets premiär; kanonisk trail: S75-doket Del 3–4;
> Marcus-kvittens i delegerad senior-form "Du är senior här, gör det
> som blir absolut bäst"):** tre poster; beslutstexten bevaras
> oförändrad (immutabilitet).
>
> 1. **Täcknings-passet — ny obligatorisk grind före parallell
>    avfyrning.** Kollisions-check ≠ täcknings-check: beslut 1:s
>    claims-intersektion fångar overlap mellan kort men INTE
>    inkompletta claims (S75-halten: 18.1 krävde ordagrant "eventKey
>    in i läs-shapen" = `src/domain/**` som varken var tillåten eller
>    förbjuden yta — batchen haltade på första P2-kortet, 0/22).
>    Grinden: per kort mappas spec-textens namngivna artefakter
>    BOTTOM-UP mot repots lagerkarta (disk-verifierat, aldrig gissat)
>    och claims måste omfatta resultatet (claims ⊇ krävd yta); gap
>    läks i claims-designen FÖRE avfyrning. Premiären (S75, alla 21
>    återstående kort): **15/21 verdicts GAP** — utöver de fyra kända
>    domain-korten även manifest-beroende (17.4), genererad route-fil
>    (19.2), spec-/ADR-/primitiv-API-ytor (18.3/18.11/19.1) och
>    adapter-vägen (19.4). En omkörning utan passet hade haltat
>    igen, upprepade gånger. Mekaniseringen ersätter
>    orkestrator-vaksamhet (~9 %-klassen, ADR-053-grunden).
> 2. **Delade-ytor-registret (repo-värden; skript-logik universell,
>    värden per projekt).** Horisontella ytor som VARJE partition
>    måste tilldela explicit (fasat schema eller en ägare — aldrig
>    onämnd): (1) `src/domain/schemas/**` + `src/domain/models/**` +
>    paritetsfilen `src/domain/__tests__/schemas.assignable.ts` ·
>    (2) `supabase/functions/_shared/**` (field-allowlists.ts =
>    allowlist-SSOT) · (3) `src/styles/tokens/**` ·
>    (4) primitiv-standard-klustret (barreln + `tests/a11y/
>    primitives.spec.ts` + `src/routes/dev/primitives.tsx` +
>    `docs/specs/DESIGN-SYSTEM-SPEC.md`) · (5) `src/data/**`
>    (adapter-lagret) · (6) `src/queries/**` · (7) manifestet
>    (`package.json`/lockfilen) · (8) genererade `src/routeTree.gen.ts`
>    samt config-ytorna. field-allowlists-posten var S66-lärd;
>    registret gör klassen durabel i stället för re-upptäckt per
>    batch. Hub-halvan (mekanismen i /work-batch-skillen) lyfts
>    separat; denna post bär SPOKE-VÄRDENA.
> 3. **Konflikt-upplösnings-mandat för merge-agenten (bundet;
>    halt-first orörd för kod).** Merge-tree-konflikt som ENBART rör
>    (a) `src/routeTree.gen.ts` → mekanisk regenerering i temp-
>    worktree (router-cli finns som devDependency; typecheck-
>    verifierad före push) eller (b) bokförings-md-ytor
>    (`backlog/tasks/**`, `docs/specs/**`, `docs/decisions/**`) →
>    union-upplösning med BÅDA sidor bevarade, öppet bokförd i PR +
>    kortets notes. VARJE konflikt som rör annan kod = HALT
>    (kontraktets halt-first oförändrat). Precedent:
>    17.1-kortfilens orkestrator-upplösta union (S75, `3d72a4c`).

## Kontext

ADR-071:s v1 är medvetet sekventiell (max en skrivande agent per repo);
beslut 5 bär en omprövningströskel och T67/T76 bokförde parallellism som
framtida omprövning. Marcus mål-bild: två batchar igång + honom själv i
tredje stolen. De fyra krockytorna bakom sekventiell v1 (delad checkout ·
staging-singleton · seriella räknare · trunk-push-races) adresserades i
T76-grillningen med branschbelagda mönster (Anthropic-vägledning
worktrees; Copilot/Codex: isolering + PR som serialiseringspunkt —
T71-researchens konvergenspunkter, S61-omverifierade). Piloten kördes
S65 när partitionen fanns konkret. ADR-baren 3/3: konsent-/process-söm
som framtida batchar bygger på · överraskande utan kontext (en
orkestrator som mergar PR:er ser ut som ny process) · verklig avvägning
(topologi, halt-semantik, CI-serialisering — flera former prövade i
grillning + pilot).

## Beslut (parallell-formens delta mot ADR-071 — övriga beslut orörda)

1. **Topologin: EN orkestrator, max 2 pipelines (v1).** Ett
   orkestrerings-uppdrag i Code-sessionen; per kort spawnas en FRISK
   do-work-agent i EGEN git-worktree (harnessets worktree-isolering,
   empiriskt verifierad före pilot). Marcus pekar ut partitionen
   (pipeline × kort) i batch-ordern — auto-plock i pipelines är
   förbjudet (backlog-ögonblicksbilder ger deterministisk dubbel-plock;
   central utpekning FÖRE spawn). Kollisionsytor (delade filer,
   timing-känsliga mätningar) hanteras med FASAT SCHEMA som designar
   bort konflikten i stället för att hantera den i stunden
   (pilot-empiri: spec-§15-instruktionen gav ren merge; 8.1:s
   mätvaliditet fick exklusivt fönster).
2. **Worktree-setup är agentens första steg:** egen kort-branch
   (`task/<kort-id>`) från färsk main (färskhets-check mot
   `origin/main`), `npm ci` (node_modules följer inte med), kopiering
   av gitignorade cred-filer från huvudrepot (`.env.local`/`.env.test`
   — aldrig committade, aldrig citerade). Städordningen efter merge är
   **worktree-remove FÖRE branch-delete** (levande worktree blockerar
   branch-radering — pilot-empiri).
3. **Staging-/server-semaforen: ETT fillås över alla pipelines**
   (mkdir-atomiskt, ägar-verifierat, port-pre-flight på 5173). Täcker
   ALLT som startar server eller rör staging — empiriskt skärpt:
   Playwrights `webServer` är GLOBAL, även `test:api:pure` omfattas →
   varje lokalt Playwright-anrop går i låsfönstret. Låsfönster hålls
   korta (en svit i taget). Löser TASK-5-klassen (främmande server på
   5173) och TASK-6-klassen (staging-contention) med EN mekanism utan
   att röra `playwright.config.ts`.
4. **CI-kedjan är orkestrator-ägd och SERIELL per kort:**
   `gh pr create` (EJ draft — vestigial när PR:en skapas post-leverans;
   draft-ready-flip ligger dessutom utanför AFK-allowlisten) → CI-vakt
   per jobb via headSha-match (aldrig `--commit`-filtret, L265) →
   `gh pr merge --merge` (merge-commit ALLTID — squash river
   SHA-bevisen) → main-CI-vakt → orkestratorns OBEROENDE
   disk-verifiering (kort-tillstånd via CLI + path-scope-diff) →
   stängnings-bokföring. Motiv för serialiseringen: CI:s Test+Build kör
   staging-stegen → två samtidiga runs (PR ∥ PR eller PR ∥ main-push)
   är TASK-6-kollisionen på CI-nivå. Agenternas implementationsfaser
   (väggklockans dominant) förblir parallella.
5. **Tvåstegs-stängningens aktörsdelning:** leverans-commiten (kod +
   kort-bockar, SAMMA commit) är AGENTENS på kort-branchen;
   stängnings-bokföringen (DoD-CI-bock + final-summary + Done
   respektive granskningsfärdig-kommentar) är ORKESTRATORNS på main,
   serialiserad. Fynd-kort och trådar registreras ENDAST av
   orkestratorn ur agenternas schema-returer (ID-krock-skyddet);
   agenter skriver fynd som INSTRUKTION till nästa okända utförare
   (L266) i sin retur. Granskningsfärdig-läget (ADR-071 beslut 3) är
   OFÖRÄNDRAT: Done-flippen är Marcus, i webbläsaren.
6. **Halt-semantiken: drain.** Vid abort-/STOPPA-utfall i en pipeline
   återställs kortet To Do med avbrotts-not (orkestratorn skriver den
   på main — agentens worktree kastas); den friska pipelinen kör klart
   sitt PÅGÅENDE kort (levererar om grönt) men INGET nytt startas i
   någon pipeline; batch-rapporten pekar ut halten. Övriga hårda
   gränser per ADR-071 beslut 4 (max-kort Marcus-satt per order ·
   aldrig samma kort ×2 · kill-switch · idempotent omstart via
   backlog-tillståndet · inget tids-tak).
7. **B-SWITCHEN — FÄRDIGSPECAD form för skarp Lotta-drift**
   (pre-beslutad i T76-samsynen, Marcus-ryttare): när appen är i skarp
   drift flyttas merge-tidpunkten för UI-kort — PR:en öppnas som DRAFT
   och FÖRBLIR öppen tills design-review; granskningen sker mot
   branch-preview (staging-mode-bygge på CORS-godkänd port per
   TASK-10-fällorna: `npm run build -- --mode staging` + preview på
   5173); merge sker PÅ Marcus kvittens; inget ogranskat UI når main.
   Aktiveras som explicit B-flagga i /work-batch-ordern; posten är
   inbyggd i T46:s go-live-karta (kan inte missas vid go-live).
   Icke-UI-kort behåller v1-flödet även i B-läge.

## Alternativ som övervägdes

- **Två separata batch-chattar** (avvisad i grillningen: bräckliga
  cross-sessions-lås, dubblade rapport-ytor, koordination flyttad till
  människan) · **auto-partitionering** (avvisad v1: ändra EN variabel i
  taget; naturlig evolution efter evidens).
- **Kort-klassning "rör staging?"** (avvisad: bräcklig) · **andra
  staging-miljön** (avvisad: infrastruktur utan bevisat behov —
  registrerad FRAMTIDA väg om semaforen bevisas flaskhals; pilotens
  220 s total väntan är långt från tröskeln).
- **Global tvärnit / fortsätt-hela-kön** som halt-former (avvisade i
  grillningen: kastar friskt arbete respektive låter batch-globala
  problem upprepa sig — drain bevarar halt-firsts intention).
- **Draft-PR + ready-flip i orkestrator-flödet** (avvisad efter
  pilot-empiri: draften är vestigial när PR:en skapas först vid färdig
  leverans, och ready-flippen kräver allowlist-utvidgning utan
  motsvarande värde; draften återfår mening i B-formen där PR:en
  faktiskt VÄNTAR).
- **Parallella CI-runs med jobb-nivå-concurrency i workflowen**
  (ej vald nu: kräver ci.yml-ändring och ger minuter, inte
  storleksordningar — omprövas om CI-svansen bevisas flaskhals).

## Konsekvenser

- `/work-batch` 1.14.0 (hub) bär parallell-formen + B-flaggan;
  sekventiell form (ADR-071) förblir default utan partition i ordern.
  Semafor-wrappern formaliseras i skillen (pilotens version var en
  scratchpad-artefakt by design — minimal-test-regeln).
- **Empirisk baslinje S65-piloten:** 5/5 kort first-pass (varje PR-run
  OCH main-run grön per jobb första försöket) · 0 aborts · 0 mänskliga
  ingripanden · 0 permission-stopp · 0 merge-konflikter ·
  parallell-vinst ≈ 35 % väggklocka · semafor-väntan 220 s totalt ·
  7 agent-fångade defekter, 0 till main · substrat-buren
  kunskapsöverföring bevisad orkestrator→agent över faser
  (fas 2-fynd blev fas 3-instruktioner som förhindrade förutsedda fel).
- **Ärliga gränser:** drain-vägen är ALDRIG triggad (ingen abort
  inträffade — mekanismen är kodad men obeprövad, ADR-071:s ärliga
  gräns ärvs) · granskningsvågen för 4 UI-kort pågick vid ADR-mint
  (FORM-beviset är komplett och oberoende av granskningsutfallet;
  design-grinden är kort-nivå, inte pilot-nivå — öppet bokfört) ·
  scope = 2 pipelines (fler kräver ny prövning) · B-formen är specad
  men aldrig körd i drift · falsifikations-passet (temporärt
  urkopplade skyddsräcken som RÖD-bevis) rekommenderas för
  skyddsräckes-kort men är inte kontrakts-krav.
- T71:s fan-out-avvisning reviderad öppet (premisserna rivna ben för
  ben med bokförd kedja — se T71-kortet) · T46 bär switch-posten ·
  termerna *pipeline (batch)*, *drain*, *fan-out/fan-in* har hemvist
  SYSTEMET.md §0.

## Referenser

- `tasks/threads/T76-parallella-batch-pipelines.md` — kanonisk
  grillnings-samsyn (5 beslut).
- `tasks/sessions/2026-07-12-session-65.md` Del 2 (design + empiriska
  verifieringar), Del 3–5 (pilot-utfallet per fas + batch-facit).
- [ADR-071](ADR-071-afk-batch-kontraktet.md) (amenderas — beslut 5:s
  omprövningströskel utlöst och besvarad) ·
  [ADR-072](ADR-072-klient-persist-av-query-cachen.md) (styrde 8.3).
- Hub: `plugins/marcus-system/skills/work-batch/SKILL.md` 1.14.0 ·
  `SYSTEMET.md` §0-termerna.
- TASK-10 (fynd-kortet: staging-browser-verifieringens tre fällor —
  input till B-formens gransknings-recept).
