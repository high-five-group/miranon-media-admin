---
owner: marcus803
updated: 2026-07-24
review_by: 2026-10-23
status: stable
lifecycle: active
---

# T85 — Riskanpassad CI / processhastighet

> Tråd-kort (ADR-053). Född S77 2026-07-23 ur processgransknings-spåret.
> Commit-tagg: `[T85]`.

## Ursprung

Marcus beställde en extern processgranskning (Codex, 2026-07-23) med
frågan: har vi lyckats bygga en stabil, strukturerad, säker och
branschledarmässig process — och kan den bli snabbare utan
kvalitetskompromiss? Analysen landade i
[docs/research/arbetsflode-processgranskning-2026-07-23.md](../../docs/research/arbetsflode-processgranskning-2026-07-23.md);
Code verifierade samma dag varje centralt påstående mot repo + GitHub-API
(svars-sektionen i samma dok) och designade åtgärderna i tre vågor
([design-doket](../../docs/research/riskanpassad-ci-design-2026-07-23.md)).
Marcus delegerade designen ("det bör du göra") och låste besluten A+A
(bokföring via auto-merge-PR; rött-först-bärarbyte).

## Kärninsikten

Största luckorna var inte missar utan MEDVETNA deferraler som aldrig
återupptogs (ADR-029 utelämning #5: branch protection, med aggregatorn
färdigbyggd som required check sedan 2026-05-13). Trögheten Marcus känner
är inte dokumentationen eller grindvakterna (33 s) — den är ETT jobb
(~10 min) genom EN global staging-mutex, plus avsiktligt röda bevis-runs
i samma kö.

## Status per våg

| Våg | Innehåll | Status |
|---|---|---|
| 1 | Merge-grinden ([ADR-076](../../docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)) + actionlint-pinning + jobb-splitten (PR #99) | ✅ EXEKVERAD S77 (grind-bevis i S77-sessionsdok) |
| 2a | D1-klassen + merge-dedup + nightly/larm + mätskript + gate-proof | ✅ KOMPLETT: **36.1 gate-proof** (S78) + **ci.yml-trion 36.2/36.3/36.4** (S79, ADR-077) + **36.5 mätskriptet** (S80: `scripts/ci-metrics.mjs` + nightly-metrics i larm-needs; utgångsvärde citerat på kortet; se BUILD-LOG S80) |
| 2b | Visual regression från noll (CI-födda baselines) | ✅ BYGGD S81: **36.7** Done — hermetisk fixturvärld (`tests/visual/support/`) + 6 vyer × 2 vyportar (2x, Marcus-beslut) + `visual-baselines.yml` ände-till-ände (baseline-PR nr 140 Marcus-välsignad); GRIND-jobbet (AC 7–8) medvetet PARKERAT → [`T87`](T87-visual-grind-aktivering.md) (Marcus-beslut A: tidig UI-fas, aktiv grind mot batch-hastigheten); L327+L328 skördade |
| 2c | Rött-först-bärarbytet (ADR-071-amendering) | ✅ VERKSTÄLLD S80: **36.6** Done — ADR-071 S80-amenderingen (lokalt körutdrag som bärare, rött+grönt ihop, grind-bevis via gate-proof) + CONTRIBUTING § Rött-först |
| 3 | Staging-per-run-isolering (mutexen avvecklas) | riktning satt; samdesign med ADR-063 post-Fas-6; tangerar T27/T45 |

## Bevis-skulden (S77 end-pass-incidenten) — BETALD S78

S77:s incident lämnade en öppen bevis-skuld: aggregatorns FAIL-gren gjordes
fail-closed men bevisades aldrig skarpt (L322 — konfig-verifierad, ej
gate-bevisad). task-36.1 (gate-proof-workflowen) betalar den:
`.github/workflows/gate-proof.yml` är en riktad `workflow_dispatch` som är
sitt eget test.

- **Positivt bevis** (default) run **30032296699** = GRÖN: paraply-repliken
  kör `always()` + den verbatim fail-closed jq-grenen ur `ci-passed` blir
  `failure` på ett framkallat rött jobb.
- **Negativ self-test** (`simulate_skip=true`) run **30032299223** = RÖD:
  paraply-repliken tvingas skippa → assert-jobbet fångar det → röd körning.
  Detta är exakt L322-hålet demonstrerat: en skippad paraply-check räknas
  INTE tyst som grön.

Landad via PR #107 (`b412bb8`), CI-run 30031630066 grön per jobb.

**Durabel bärare (L321) — HANTERAD S79:** gate-proof:s jq-fail-closed-gren är en
VERBATIM REPLIK av `ci-passed`:s → drift-risk vid framtida ändring av den
riktiga aggregatorn. I S79:s reusable-refaktor (36.2) ändrades `ci-passed`:s
`needs`-lista men jq-logiken förblev BYTE-IDENTISK → repliken fortsatt giltig;
gate-proof re-kört (run **30038462683** grön) bekräftade fail-closed genom
refaktorn. `ci.yml`-kommentaren (~rad 666) uppdaterad "öppen bevis-skuld"→betald
(36.2). Bäraren kvarstår för FRAMTIDA jq-ändringar (då MÅSTE repliken speglas).

## Eftergranskningen (Codex 2026-07-24) → korrigeringspaketet

Marcus beställde omgranskning efter våg 1–2:s utlösning. Dom: **6,5 →
8/10** — åtgärdspaketet bekräftat verkligt ("inte
dokumentationsteater"; main-skyddet "starkt löst", D1 "precis hur en
säker fast track bör utformas", dedupen "ovanligt välgjord",
incidenthanteringen "ett moget arbetssätt"). Rapport + Codes
verifikation:
[eftergranskningen](../../docs/research/arbetsflode-processgranskning-eftergranskning-2026-07-24.md)
(§ Verifikation och beslutsläge — beslutsdrivande fynd verifierade;
sanningsfixen i CONTRIBUTING § Visuell regression + T86-pilotens
protokoll v2 åtgärdades direkt i S82-konversationen, PR #145).

**SEKVENS LÅST (Marcus 2026-07-24):** paketet tas som NÄSTA
processfönster — egen fokuserad session EFTER nattbygget, BINDANDE
FÖRE review-pilotens beslut (T86, 10–15 loggrader) och före all vidare
CI-utbyggnad. Nattbygget blockeras inte: produktarbete = den "normala
drift" eftergranskningens punkt 9 efterfrågar, pilotens datainsamling
använder inte ci-metrics-siffrorna, och visual-grinden SKA vara
parkerad under avsiktliga UI-ändringar (T87-beslutet). Sessionen
BÖRJAR med att verifiera Codex tre mätpåståenden mot
`scripts/ci-metrics.mjs` (hypotes-regeln gäller även extern granskare).
Nightly-visual-punkten: Code TVEKSAM — förväntat-röda nätter under
UI-fas är kyrkogårds-klassen (L321); Codex missade UI-fas-dynamiken →
grillas i sessionen, tas inte rakt av.

**Korrigeringspaketet (KVAR — tas som eget T85-pass/kort):**

1. **Mätardefinitionerna** (`scripts/ci-metrics.mjs`) — åtgärdas FÖRE
   beslutsanvändning av siffrorna: flaky-nämnaren (`run_attempt > 1`
   betyder inte röd första körning; incidenter ≠ röda försök),
   staging-"kötiden" mäter workflow-start→jobb-start (inte
   mutex-väntan isolerat), röd-orsaken läser endast `failure` (missar
   `startup_failure`/`timed_out`/`action_required`/`stale`).
2. **Nattlarms-observatören** — larmjobb i samma workflow kan inte se
   sitt eget `startup_failure` (run 30038460735) eller utebliven
   schemakörning; separat `workflow_run`-vakt eller motsvarande,
   täckande även `timed_out`/`action_required`.
3. **Vale-SHA256** — samma checksummeform som actionlint.
4. **Required-check app-bindningen** — `integration_id` mot GitHub
   Actions så checknamnet inte kan publiceras av annan write-aktör.
5. **Cron-timezone** — `timezone: Europe/Stockholm` ersätter
   UTC-approximationen + den inaktuella kommentaren i nightly.

**Beslutsklass (Marcus):** 36.7-kortformalian (Done med öppna AC 7–8 +
DoD — parkeringens formella hemvist) · 36.8-ordningen (QA-punkt 11
förutsätter T87-aktivering) · nightly-visual-frågan (aktivera visual i
nightly FÖRE PR-grinden? rör T87:s ett-stegs-design — grillbar) ·
merge-only som husregel (dedup-förutsägbarheten).

## Upptags-form

Våg 2a/2b/2c tas som egna pass (PRD-kort/skivor eller session-scope) med
design-doket som styrande underlag; ADR mintas vid implementation. Våg 3
väntar på bas-maximeringens designfönster (run-scoping är ett
bas-designkrav).
