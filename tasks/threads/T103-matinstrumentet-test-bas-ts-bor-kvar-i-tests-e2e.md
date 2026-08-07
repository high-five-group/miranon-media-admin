---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T103 — Mätinstrumentet `test-bas.ts` bor kvar i `tests/e2e/support/` trots att det är klassneutralt

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Mätinstrumentet `test-bas.ts` bor kvar i `tests/e2e/support/` trots att det är klassneutralt.** Fixturvärlden flyttades till klassdelad hemvist `tests/support/fixturvarld/` i `TASK-59.1` av precis det skälet — att en klass-segmenterad sökväg läses som ägarskap. Mätinstrumentet har samma egenskap: sedan `TASK-59.3` komponeras acceptance-sömmen av BÅDA modulerna via `mergeTests`, och importerar alltså tvärs klassgränsen (`tests/acceptance/support/` → `tests/e2e/support/`). Den implementerande agenten identifierade asymmetrin själv och lät den stå med rätt motivering: flytten rör importraden i ~30 e2e-filer och ligger utanför skivan. **Asymmetrin blir konstigare för varje våg** — A5:s fyra migreringsskivor lägger till konsumenter, inte tar bort dem. Rimlig hemvist för åtgärden är efter sista migreringsvågen (`TASK-59.6`), när antalet berörda importrader är känt och stabilt. **TRIGGERN HAR LÖST UT 2026-07-31 (`TASK-108`): `TASK-59.6` är Done** per backlog-CLI:t — antalet berörda importrader är alltså känt och stabilt, och tråden är plockbar. Den lämnas `paused` tills någon plockar den; att den är plockbar är inte samma sak som att den är påbörjad. **ÅTGÄRDAD 2026-08-01 (`TASK-110`)** — `test-bas.ts` OCH `hermetik-rapport-fil.ts` (samma klassneutrala egenskap: delad konstant mellan skrivaren och läsarna `global-setup.ts`/`global-teardown.ts`) flyttade till `tests/support/` med `git mv`. Det faktiska talet vid flytten var **15 importrader** (14 `tests/e2e/*.staging.test.ts`-filer + `acceptance-bas.ts`), inte de ~30 som antogs 2026-07-27 innan `TASK-59.6` stabiliserade antalet — kortets egen mätning (16, 15+1) var också fel med en fil; grepp mot faktiskt tillstånd gav 14 e2e-filer, inte 15. Mätläget bevisat levande efter flytten: `PLAYWRIGHT_HERMETIK_RAPPORT=1` mot `shell.staging.test.ts` gav 9/9 passed + rapport med 40 restanrop, samma mekanik som före. Besläktad: `TASK-59.1` (precedenten) · `TASK-59.7`

**Ursprunglig Ingång-cell:**
`TASK-110`
