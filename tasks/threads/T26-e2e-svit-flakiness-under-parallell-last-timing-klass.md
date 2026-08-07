---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T26 — e2e-svit-flakiness under parallell last (timing-klass: focus→h1 / loading-state / axe-pre-render) + `retries: 0` i `playwright.config` → latent CI-röd-risk

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Ingång-cell:**
_Löst Session 31 via 2 landningar: A config-grind (`910ebb9`, retries CI-gated 0/2 + trace on-first-retry) + B preventiv test-härdning (`69a89f4`, manuell route-release / aria-live-gate / toHaveCount före axe). CI grön 78 passed noll flaky. Uppstod Session 30 (Fas 6d L2). Repro-blockad → miljö-kluster T30 (T12/T28/T29)_
