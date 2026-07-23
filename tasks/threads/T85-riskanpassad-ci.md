---
owner: marcus803
updated: 2026-07-23
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
| 2a | D1-klassen + merge-dedup + nightly/larm + mätskript + gate-proof | 🔨 UNDER EXEKVERING S78 (task-36 + skivor; **36.1 gate-proof LANDAD** — bevis-skulden betald, se nedan) |
| 2b | Visual regression från noll (CI-födda baselines) | design klar — egen skiva |
| 2c | Rött-först-bärarbytet (ADR-071-amendering) | beslut A låst; verkställs med våg 2 |
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

**Öppen durabel bärare (L321):** gate-proof:s jq-fail-closed-gren är en
VERBATIM REPLIK av `ci-passed`:s → drift-risk vid framtida ändring av den
riktiga aggregatorn. Läks vid nästa `ci.yml`-touch (36.3/36.4-sessionen).
Samma touch uppdaterar `ci.yml`-kommentaren (~rad 666) från "öppen
bevis-skuld" till betald.

## Upptags-form

Våg 2a/2b/2c tas som egna pass (PRD-kort/skivor eller session-scope) med
design-doket som styrande underlag; ADR mintas vid implementation. Våg 3
väntar på bas-maximeringens designfönster (run-scoping är ett
bas-designkrav).
