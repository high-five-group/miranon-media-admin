---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T25 — DRY-konsolidering av `chunk<T>`-helper — premissen har fallit: tröskeln är inte längre nådd (2 call-sites, ej 3)

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); 6b-flaggad, tröskel nådd Session 26 (6c arch-audit); blockerar ej. **KORRIGERAD 2026-07-31 (`TASK-108`, mätt mot disk):** rule-of-three var trådens hela motiv och den tröskeln är inte längre nådd — `get-registrations` tappade sin `chunk`-kopia i `220ea19` (task-18.17), så helpern är nu definierad i TVÅ EF:er. Tråden lämnas `paused` och stängs INTE: en tredje call-site kan uppstå, och tröskel-beslutet ägs inte av en integritetskontroll_
