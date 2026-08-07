---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T28 — `.env.local` (dev-serverns `VITE`-källa) pekar på PROD-ref (`lvjsfnphlauldxqlncpl`) → lokala e2e-/dev-körningar kör de facto mot produktion (bevisat: dage

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
`.env.local` (dev-serverns `VITE`-källa) pekar på PROD-ref (`lvjsfnphlauldxqlncpl`) → lokala e2e-/dev-körningar kör de facto mot produktion (bevisat: dagens `user.json` bär prod-auth-token). Distinkt från T12 (`.env.test`/mutations-sviten, redan staging-rättad). Durabel fix: repo-nivå fail-fast som vägrar dev-server/e2e mot prod-ref (strukturell, à la L110/T12) → ADR-061 (löst Session 32)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 31 (T26 Landning B STEG 1, prod-pekare blockerade repron); löst av [ADR-061](../../docs/decisions/ADR-061-lokal-miljo-isolation.md) Pelare 1+2 (pekare ut + grind)_
