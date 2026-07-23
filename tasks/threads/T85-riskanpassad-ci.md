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
| 2a | D1-klassen + merge-dedup + nightly/larm + mätskript | design klar — nästa upptag |
| 2b | Visual regression från noll (CI-födda baselines) | design klar — egen skiva |
| 2c | Rött-först-bärarbytet (ADR-071-amendering) | beslut A låst; verkställs med våg 2 |
| 3 | Staging-per-run-isolering (mutexen avvecklas) | riktning satt; samdesign med ADR-063 post-Fas-6; tangerar T27/T45 |

## Upptags-form

Våg 2a/2b/2c tas som egna pass (PRD-kort/skivor eller session-scope) med
design-doket som styrande underlag; ADR mintas vid implementation. Våg 3
väntar på bas-maximeringens designfönster (run-scoping är ett
bas-designkrav).
