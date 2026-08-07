---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T29 — Playwright `error-context.md` `aria`-snapshot exponerar lösenord i KLARTEXT vid login-fail — password-maskeringen täcker screenshot/video/trace men ej `aria`

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Playwright `error-context.md` `aria`-snapshot exponerar lösenord i KLARTEXT vid login-fail — password-maskeringen täcker screenshot/video/trace men ej `aria`-snapshotten (Kandidat-34 aldrig-läcka). Gitignored (ingen git-läcka) men klartext-cred på lokal disk per login-fail. Fix: maskera/exkludera lösenordsfält ur `error-context`, eller rensa artefakten i setup-teardown → ADR-061 (löst Session 32)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 31 (T26 Landning B STEG 1-repro, login-fail-artefakt); löst av [ADR-061](../../docs/decisions/ADR-061-lokal-miljo-isolation.md) Pelare 3 (globalTeardown-purge, bevisad)_
