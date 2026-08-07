---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T106 — Hermetik-självtestets verdikt beror på ett race mellan två fel — vakten och en assertion-timeout

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Hermetik-självtestets verdikt beror på ett race mellan två fel — vakten och en assertion-timeout.** Upptäckt 2026-07-28 (S91, `TASK-59.7`) vid lokal DoD-verifiering: `npm run test:acceptance:sjalvtest` gav **151/152 av vakten** i första körningen (`mer-segment-send › happy path` fälldes men utan `OmockadRequestError`) och **152/152** i en omedelbar omkörning på samma träd. **Mekanismen är identifierad, inte gissad:** i självtestläget når `get-events` — ett anrop appskalet gör, inte testet — hermetik-vakten ASYNKRONT via MSW:s `onUnhandledRequest`, medan testets `expect(...).toBeFocused()` har 5000 ms timeout. Landar timeouten först kan Playwrights resultat bära ENBART assertion-felet, och `scripts/hermetik-sjalvtest.mjs` rapporterar då korrekt _"fälldes, men INTE av hermetik-vakten"_. Isolerat (samma fil ensam) föll alla tre testerna på vakten, 3/3 — det är alltså last, inte testet. **Varför det spelar roll:** grindens gröna besked är trovärdigt, men dess RÖDA kan vara falskt, och en falsk röd i acceptance-jobbet är samma signal-förstörelse som parkerade `T87`. **Ej reproducerad i CI:** steget är grönt 3/3 i `#318`/`#323`/`#324`. **Ej orsakad av `TASK-59.7`:s ändring** — den rör endast en stdout-utskrift i teardown efter hela körningen, medan självtestet läser en JSON-FIL. ADR-053-triage: blockerar ej + värdefullt → defer. Besläktad: `T104` (självtestets ursprung)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); uppstod i `TASK-59.7`:s lokala verifiering_
