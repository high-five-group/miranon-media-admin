---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T39 — Prod-funktions-drift-sync — prod-live EF:erna ligger efter staging-testad HEAD

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); uppstod Session 38 (6f prod-deploy STEG 3). **OMFATTNING MÄTT 2026-07-23 (S75 prod-deploy-vågen):** prod bär 11 av 13 allowlistade funktioner och samtliga ligger flera versioner efter staging — `get-events` v11 mot v18 · `get-registrations` v12 mot v19 · `create-event` v3 mot v8 · `get-persons` v12 mot v15 · `update-record` v12 mot v16 · `compute-segment`/`get-event-formats`/`get-segments`/`save-segment` v3 mot v6–7 · `send-email` v1 mot v8. `create-event-note` + `get-event-notes` saknas HELT i prod (allowlistade sedan 18.11 men aldrig deployade). Bas-sidan är dock klar: prod-basens additiva gap stängdes samma dag (data-model.md § Prod-basens additiva tillskott), så EF-deployen har nu de namngivna fälten den behöver. BLOCKERANDE FÖR UPPTAG: T40:s autentiserade prod-smoke saknar prod-testanvändare — utan verifieringsväg är ett elva-funktioners lyft i Lottas bas inte försvarbart. Besläktad `T40` + `TASK-35` (test-auth i prod). **PRE-FLIGHT UTFÖRD 2026-07-24 (S84, parallell session):** innehålls-diff deployad-kod-vs-HEAD per funktion + deploy-/smoke-plan + TASK-35-underlag i [`docs/research/t39-ef-sync-preflight-2026-07-24.md`](../../docs/research/t39-ef-sync-preflight-2026-07-24.md) — verklig drift SMALARE än versionsgapet (4 EF:er egen-kod-drift; kärnan = env-drivet AIRTABLE_BASE_ID + field-allowlists-tillskotten; 3 redeploys innehålls-no-op; AIRTABLE_BASE_ID-secreten FINNS i prod men är runtime-obevisad → läs-smoke sekvenserad först). Kvarvarande grindar = Marcus-besluten i dokets §8. **SYNKEN UTFÖRD 2026-07-24 (S84, Marcus-go A-kedjan):** alla 13 deployade via kanoniska skriptet (11 versionsbump + notes-paret NYTT I PROD), versions-verifierade ACTIVE; deny-triple ×13 grön (källkods-klassad 405/401-form — sju EF:er saknar egen metod-vakt, hygien-fynd registrerat som backlog-kort); autentiserade smokes gröna. **L216:s override-krav UPPHÄVT** — allowlist-deklaration och deployad aktualitet konvergerade; kanoniska full-allowlist-formen gäller framåt. TRÅDEN STÄNGD_
