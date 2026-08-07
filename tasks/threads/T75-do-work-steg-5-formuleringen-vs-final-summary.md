---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T75 — do-work steg 5-formuleringen vs final-summary-självreferensen — "kort-ändringarna i SAMMA commit som koden" med en final-summary-rad som bär leverans-SHA +

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
do-work steg 5-formuleringen vs final-summary-självreferensen — "kort-ändringarna i SAMMA commit som koden" med en final-summary-rad som bär leverans-SHA + CI-run-id är fysiskt omöjlig i själva leverans-commiten (självreferens; DoD "CI grön per jobb på pushad commit" kan dessutom inte bockas före CI kört). task-2 (`13bb905`/`c0aa615`) + task-3 (`dae3f1f`/`871c804`) etablerar tvåstegs-stängningen (leverans-commit med kod + AC-bockar → stängnings-commit med DoD-CI-bock + final-summary + Done efter CI-verifiering) som de facto-praxis → förtydliga skill-texten så praxisen blir norm i stället för per-agent-härledning. Hub-materia (plugin-skill); kan buntas med `/work-batch`-skill-landningen (T61/ADR-071)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 61 (AFK-batch-pilotens systemnivå-spår, agentens transparens-rapport; ADR-053-triage: blockerar ej + värdefullt → defer)._ **LÖST S62 (2026-07-11):** do-work steg 5 + description omskrivna till tvåstegs-stängningen (leverans-commit → stängnings-commit efter CI-verifiering; hub `3174a1e`, plugin 1.13.0; K61.1/L263) — de facto-praxisen är nu skill-norm; konstitutionens ISSUE-SUBSTRAT-rad konsekvens-synkad i samma hub-commit
