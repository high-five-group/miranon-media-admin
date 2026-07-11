---
owner: marcus803
updated: 2026-07-11
review_by: 2026-10-11
status: stable
lifecycle: paused
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
- **Tillstånd:** se frontmatter `lifecycle` — parkerad ARMERAD; trigger =
  två genuint disjunkta plockbara kort + Marcus explicita pilot-order
- **Sessioner:** 62-parallell (grillad samsyn 2026-07-11 i tredje-stols-
  chatt bredvid S62; kvitterad "Kvitterar" på hela kontraktet)
- **Styrande:** [ADR-071](../../docs/decisions/ADR-071-afk-batch-kontraktet.md)
  (sekventiell form, gäller tills vidare) — **ADR-072 mintas vid bygget
  efter bevisad pilot** (baren 3/3 prövad i grillningen; ADR-071-precedent:
  pilot före skill/ADR)
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
2. När två disjunkta plockbara kort finns: **pilot** på Marcus
   klartext-order (2×1 kort, inline-skript, förberedelse-checklistan).
3. Vid bevisad pilot — EN landning: **ADR-072** (parallell-formen +
   B-switchen färdigspecad + drain + semafor; amenderar ADR-071) ·
   `/work-batch` 1.14.0 (parallel-läge + B-flagga) · T71-radens öppna
   revidering · T46 go-live-kartans switch-post · parkerade termer →
   SYSTEMET.md §0.
