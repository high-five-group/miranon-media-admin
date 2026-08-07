---
owner: marcus803
updated: 2026-07-12
review_by: 2026-10-11
status: stable
lifecycle: closed
---

# T76 — Parallella batch-pipelines i samma repo (en orkestrator, worktrees, draft-PR)

> Tråd-kort (ADR-053). Född 2026-07-11 ur Marcus initiativ ("vore sjukt att
> kunna köra parallella batchar i samma repo") medan batch 3 körde — grillad
> till samsyn i en parallell tredje-stols-chatt (T67-guardrailen tillämpad:
> ren konversation, landad post-S62-stängning när repo-ytan var ledig).
> Detta kort är samsynens KANONISKA plats — avvikelse från
> sessionsdok-Del-konventionen, öppet motiverad: grillningen kördes utanför
> S62:s kvitterade scope och S62 stängdes före landningen; nästa session
> som tar upp tråden refererar hit.

- **Tråd-ID:** `T76-parallella-batch-pipelines`
- **Tillstånd:** se frontmatter `lifecycle` — AKTIV i S65-piloten
  (upptagen 2026-07-12: triggern avfyrad — partitionen konkret sedan S64 +
  Marcus pilot-order/design-kvittens "A/A, max-kort 5" i delegerad
  senior-form; pilot-designen kanonisk i S65-doket Del 2). Tidigare:
  parkerad ARMERAD sedan 2026-07-11; trigger =
  två genuint disjunkta plockbara kort + Marcus explicita pilot-order.
  **Pilot-partition planerad (S63-vägval + Code-bedömning):** pipeline A
  = task-8-skivorna (Lugnt laddläge, 8.1→8.4 sekventiellt internt —
  8.4:s beroende på 8.1+8.2 hålls inom pipelinen) ∥ pipeline B =
  T69-skivorna (Mer-vyn; skivas S64). Disjunkt sånär som på TRE
  kollisionsytor som checkas vid partitionen: (1) lockfilen —
  task-8.3 lägger persist-beroenden; krock om T69-skiva också lägger
  paket, (2) design-system-specen — task-8.2 skriver laddläges-
  sektionen; sekvenseras mot ev. T69-spec-skrivning, (3) routeTree-
  genereringen om T69 ändrar routes. TASK-5/6 hålls UTANFÖR piloten
  (delar Playwright-konfigen → sekventiell batch 4). Snabbare
  reservväg om T69 försenas: 8.2 ∥ 8.3 har disjunkta filfotavtryck
  inom samma PRD.
- **Sessioner:** 62-parallell (grillad samsyn 2026-07-11 i tredje-stols-
  chatt bredvid S62; kvitterad "Kvitterar" på hela kontraktet) · 65
  (pilot-bygget + skarp pilot på partitionen 8.1–8.3 ∥ 9.1/9.3 —
  **PILOT BEVISAD** 5/5 first-pass, ADR-073 mintad, granskningsvågen
  Marcus-kvitterad 4 kort → Done; post-batch-fällorna 4/5 →
  TASK-10 + L275/L276. **Kvar i tråden:** skillens första skarpa
  parallell-bruk [kandidat: 8.4 ∥ 9.2] + förbättringspasset
  [S65-handoffens S66-plan: merge queue-research,
  affected-graph-partitionering, skyddsräcken ur TASK-10])
- **Styrande:** [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md)
  (sekventiell form, gäller tills vidare) — **pilot-ADR:n mintas vid bygget
  efter bevisad pilot** (baren 3/3 prövad i grillningen; ADR-071-precedent:
  pilot före skill/ADR). *Nummer-not (S63): kortets "ADR-072"-referenser
  skrevs när 072 var nästa lediga; numret konsumerades av
  [ADR-072](../../docs/decisions/ADR-072-klient-persist-av-query-cachen.md)
  (klient-persist, task-7-designen) — pilot-ADR:n får nästa lediga nummer
  vid mint, kortets övriga "ADR-072" läses som "pilot-ADR:n".*
- **Besläktad:** `T61` (AFK-loopen; sandbox-delen bor där) · `T67`
  (parallella SESSIONER — människo-drivna; denna tråd = parallella
  AGENTER, syskonbeslut) · `T46` (go-live-kartan; B-switch-posten) ·
  `T71` (fan-out-avvisningen som revideras öppet vid bevisad pilot)
- **Commit-historik:** `git log --grep "\[T76\]"`

## Varför tråden finns

ADR-071:s v1 är medvetet sekventiell (max en skrivande agent per repo).
Marcus mål-bild är 2 batchar igång + honom själv i tredje stolen —
review-kapaciteten bedömd som icke-flaskhals av ägaren själv. De fyra
krockytorna som motiverade sekventiellt (delad checkout · staging-singleton
· seriella räknare · trunk-push-races) är alla adresserbara med kända,
branschbelagda mönster (Anthropic-vägledning worktrees; Copilot/Codex:
isolering + PR som serialiseringspunkt — T71-researchens konvergenspunkter).
Grillningen 2026-07-11 tog designen till samsyn; piloten återstår.

## Grillad samsyn (kanonisk plats, 5 beslut — samtliga Marcus-kvitterade)

1. **Topologin: EN orkestrator.** En orkestrator-session kör ETT
   orkestrerings-skript med parallella pipelines; varje pipeline spawnar
   friska do-work-agenter i EGEN git worktree (harnessets inbyggda
   worktree-isolering). Max **2 pipelines** i v1. Avvisat: två separata
   batch-chattar (kräver bräckliga cross-sessions-lås, dubblar
   rapport-ytor, flyttar koordinationen till människan).
2. **Partitioneringen: Marcus pekar ut korten per pipeline** i
   batch-ordern (disjunkta, oberoende). Hårt faktum bakom: parallella
   worktrees ser backlog-ögonblicksbilder → auto-plock ger deterministisk
   dubbel-plock; central plock måste ske FÖRE spawn. Människan är dessutom
   enda pålitliga grinden för FYSISK överlapp (kort oberoende i
   beroende-grafen kan röra samma filer). Fynd-kort + trådar registreras
   SERIALISERAT av orkestratorn ur pipelines schema-returer — aldrig av
   pipelines själva (ID-krock). Avvisat i v1: auto-partitionering
   (ändra EN variabel i taget; naturlig evolution efter evidens).
3. **Staging: semafor i orkestrerings-skriptet.** Implementation/lint/
   typecheck/build kör parallellt; staging-sviterna (test:api, e2e-staging)
   genom ett lås — en pipeline i taget. Empirisk grund: TASK-6 belade
   deterministisk kollision vid samtidiga staging-skrivningar;
   implementationsfasen dominerar väggklockan (24–109 min/kort, S61) så
   kö-kostnaden är minuter. Avvisat i v1: kort-klassning "rör staging?"
   (bräcklig) · andra staging-miljön (infrastruktur utan bevisat behov —
   registrerad FRAMTIDA väg om låset bevisas flaskhals).
4. **Integrationen: kortlivad branch + draft-PR per kort; auto-merge vid
   grönt.** PR:en är CI-bevisets bärare (CI triggar inte på branch-push
   utan öppen PR); merge-commit ALLTID (squash river SHA-bevisen i
   final-summary); orkestratorn mergar när CI är grön per jobb +
   disk-verifierad; stängnings-bokföring på main serialiserad av
   orkestratorn (tvåstegs-stängningen K61.1 oförändrad).
   Granskningsrutinen OFÖRÄNDRAD i v1: browser mot main,
   granskningsvågor, Done-flip = Marcus. **B-SWITCHEN PRE-BESLUTAD
   (Marcus-ryttare, skarp kvittens):** vid skarp Lotta-drift flyttas
   merge-tidpunkten — UI-kortets PR förblir öppen tills design-review;
   granskning sker mot branch-preview; merge PÅ Marcus kvittens; inget
   ogranskat UI når main. B-formen ska vara FÄRDIGSPECAD i ADR-072 +
   flaggval i skillen + **explicit switch-post i T46:s go-live-karta**
   (inbyggd, inte bara dokumenterad — kan inte missas vid go-live).
5. **Halt-semantiken: drain.** Stoppad pipeline avbryter per do-work:s
   abort-väg (kort → To Do med not); den friska pipelinen KÖR KLART sitt
   pågående kort (levererar om grönt) men INGET nytt plockas av någon;
   batchen avslutas, rapporten pekar ut halten. Bevarar halt-firsts
   intention (inget NYTT efter stoppsignal) utan att kasta friskt
   in-flight-arbete; branschmönstret graceful drain. Avvisat: global
   tvärnit (kastar friskt arbete, rörigare slutläge) · fortsätt-hela-kön
   (batch-globala problem får upprepa sig — mot halt-firsts poäng).
   Miljö-global halt-orsak degraderar kontrollerat: den friska pipelinens
   egna grindar fångar och återställer per samma abort-väg.

## Ramverk runt besluten

- **T71-revideringen är villkorad och öppen:** fan-out-avvisningen
  ("entropi-multiplikator, L47") var KORREKT för sin form (delat träd +
  trunk-push + samma-commit-stängning + delad plock). Premisserna rivs
  ben för ben (worktree · draft-PR · tvåstegs-stängning [redan riven,
  T75/L263] · explicit partitionering) — T71-raden skrivs om FÖRST efter
  bevisad pilot, med hela kedjan bokförd. Aldrig tyst rivning.
- **Sandbox (Sandcastle-klassen) hör INTE hit:** exekverings-isolering
  (skydda maskin/secrets från agenten; Matt kör Docker/"Sandcastle",
  Kursnoteringar_AIHero.md:35) är ortogonal mot parallellism och bor i
  `T61`; tas upp vid headless/cron-landningen (ADR-071 beslut 6). Nuvarande
  golv för sessions-övervakad drift: allowlist + STOPPA-grindar +
  halt-first + kill-switch. Tre isolerings-axlar hålls isär: data
  (staging, ADR-050) · exekvering (sandbox, T61) · filträd (worktrees,
  denna tråd).
- **Parkerade termer** (skrivs vid ADR-072-bygget, SYSTEMET.md §0 —
  systemdomän, ej spoke-ORDLISTA): *fan-out/fan-in* · *drain* ·
  *pipeline* (i batch-bemärkelse).

## Pilotens förutsättningar (ärligt läge 2026-07-11)

- **Kräver två genuint disjunkta plockbara kort — finns INTE ännu:**
  TASK-5 + TASK-6 (batch 4-kandidater, ready-for-agent) rör BÅDA
  `playwright.config.ts` (verifierat i korten: webServer-blocket resp.
  projekt-dependencies) → fysisk överlapp, ska köras SEKVENTIELLT.
  task-7 är design-kort (research→grill→to-prd-väg, oplockbart).
  Naturligt pilot-fönster: när nästa PRD skivas (t.ex. T69 Mer-vyn) och
  två oberoende skivor med disjunkta ytor existerar samtidigt.
- **Pilot-form:** 2 pipelines × 1 kort var (ändra EN variabel:
  parallellismen). Inline-orkestrerings-skript på Marcus klartext-order —
  skillen uppdateras EFTER bevis (minimal-test-regeln, ADR-071-precedent).
- **Förberedelse-checklista (pilot-sessionens ansvar):** npm-install per
  worktree (node_modules delas inte; Playwright-browsers delas via global
  cache) · port-allokering per worktree (dev-server/webServer får inte
  krocka; TASK-5:s port-mekanik tangerar — kör batch 4 FÖRE piloten) ·
  `gh pr create/merge`-kommandon i spoke-allowlisten (granskningsbar
  diff, Marcus-kvitterad) · staging-semaforens form i skriptet ·
  drain-mekanikens abort-koppling.

## Sekvensen framåt

1. Batch 4 (TASK-5+6, SEKVENTIELLT — överlapp) + task-7-grillningen i
   Marcus-takt (S63-handoff bär den).
2. ~~När två disjunkta plockbara kort finns: pilot~~ **PILOT BEVISAD
   (S65, 2026-07-12, design-kvittens "A/A, max-kort 5"):** fasat
   schema 8.1-EXKLUSIV (mätvaliditet) → 8.3∥9.1 → 8.2∥9.3 på
   partitionen från S64 — **5/5 kort first-pass** (varje PR-run OCH
   main-run grön per jobb första försöket), 0 aborts, 0 ingripanden,
   0 permission-stopp, 0 merge-konflikter, parallell-vinst ≈ 35 %
   väggklocka, semafor-väntan 220 s totalt, 7 agent-fångade defekter
   varav 0 nådde main. Kollisionsytorna hanterades av schemat
   (spec-§15-instruktionen gav ren merge). Drain-vägen ALDRIG triggad
   (obeprövad, öppet). Pilot-formens 2×1-rad ersattes av 3∥2 på
   Marcus-kvittens (S65 design-STOPPA fråga 1). Kanonisk trail:
   S65-doket Del 2–5.
3. ~~Vid bevisad pilot~~ **VERKSTÄLLD (S65, bevis-landningen):**
   **[ADR-073](../../docs/decisions/ADR-073-parallella-batch-pipelines.md)**
   mintad (parallell-formen + B-switchen färdigspecad + drain +
   semafor + CI-kedjans serialisering; amenderar ADR-071) ·
   `/work-batch` **1.14.0** (parallell form + B-flagga; hub-landning)
   · T71-radens öppna revidering (premisserna rivna ben för ben,
   bokförd kedja i T71-kortet) · T46 go-live-kartans switch-post
   (inbyggd) · termerna *pipeline (batch)* / *drain* / *fan-out,
   fan-in* → SYSTEMET.md §0. Kvar i tråden: Marcus granskningsvåg
   (4 UI-kort) + skillens första skarpa parallell-bruk efter
   plugin-update (L267-kedjan).
4. **TRÅDEN STÄNGD (S66, 2026-07-12) — båda kvarvarande momenten
   levererade:** förbättringspasset (research-pass 3 web-agenter →
   ADR-073-amenderingen: B-receptet reviderat till egen preview-port
   [fälla 5-falsifieringen] + F1 CI-kö-komplementet + förgrenings-
   SHA-regeln; TASK-10-skyddsräckena + runbooken; semaforen
   formaliserad `scripts/staging-semaphore.sh`) + **första skarpa
   parallell-bruket BEVISAT** (batch 2: 8.4 ∥ 9.2 first-pass 4/4
   CI-runs, 0 konflikter; S66-grindarna claims-check + merge-tree +
   claims-kvitto + pr-ci-bevisformen skarpbevisade) → `/work-batch`
   **1.15.0** (hub `01eb164`). Kumulativ parallell-empiri S65+S66:
   7 kort över 2 batchar, first-pass 100 %, 0 merge-konflikter,
   0 ingripanden. ÖPPNA GRÄNSER ÄRVS AV ADR-073 (ärliga
   gränser-sektionen + amenderingen), inte av tråden: drain aldrig
   triggad · B-formen aldrig körd i drift · >2 pipelines kräver ny
   prövning. Nya behov föder ny tråd; kanonisk trail S66-doket
   Del 2–5.

## Migrerat ur indexraden (`TASK-157.2`, 2026-08-07)

> Ordagrann text som tidigare bodde i `tasks/threads/README.md`s Titel-
> och/eller Ingång-kolumn för denna tråd, flyttad hit av registrets
> tunna radform-migration (ADR-098). Inget härunder är omskrivet —
> emfas-markörernas STIL (*...* vs *...*) normaliseras separat av
> `npx markdownlint-cli2 --fix` mot filens egen etablerade MD049-stil,
> inte av denna migration.

**Titel (fullständig, ursprunglig):**
Parallella batch-pipelines i samma repo — grillad samsyn KLAR (2026-07-11, tredje-stols-chatt bredvid S62): EN orkestrator + git worktree per pipeline (max 2 i v1) · Marcus partitionerar korten explicit (auto-plock = deterministisk dubbel-plock; fynd/trådar registreras serialiserat av orkestratorn) · staging-semafor i skriptet (TASK-6-empirin) · kortlivad branch + draft-PR per kort, merge-commit, auto-merge vid grönt; **B-switch PRE-BESLUTAD vid skarp Lotta-drift** (PR väntar på design-review; färdigspecas i pilot-ADR:n + T46 go-live-post + skill-flagga) · drain-halt (friska pipelinen kör klart pågående kort, inget nytt plockas). T71:s fan-out-avvisning revideras öppet FÖRST efter bevisad pilot; sandbox ortogonal → T61. Pilot kräver två genuint DISJUNKTA plockbara kort (TASK-5/6 rör båda `playwright.config.ts` → sekventiellt batch 4); vid bevis: pilot-ADR:n (nummer-not S63: 072 konsumerades av persist-ADR:n) + /work-batch 1.14.0 i EN landning. **PILOT BEVISAD (S65: 5/5 first-pass, ADR-073) → FÖRBÄTTRINGSPASSET + FÖRSTA SKARPA BRUKET (S66: batch 2 = 8.4 ∥ 9.2 first-pass 4/4, 0 konflikter; ADR-073-amenderingen + /work-batch 1.15.0 + semaforen som repo-artefakt + L277/L278) → TRÅDEN STÄNGD** — kumulativ empiri 7 kort/2 batchar first-pass 100 %; öppna gränser (drain obeprövad · B-formen ej i drift · >2 pipelines) ärvs av ADR-073, ej av tråden

**Ingång (fullständig, ursprunglig):**
[T76-parallella-batch-pipelines.md](T76-parallella-batch-pipelines.md) — kanonisk samsyns-plats (grillningen kördes utanför sessions-yta; öppet bokförd Del-avvikelse) · styrande tills vidare: [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md) · besläktad `T61` `T67` `T46` `T71`
