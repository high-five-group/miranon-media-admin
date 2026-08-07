---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T123 — `backlog.md`-bumpen 1.47.1 → 1.48.0 lämnade två påståenden om den gamla versionen kvar i repot

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**`backlog.md`-bumpen 1.47.1 → 1.48.0 lämnade två påståenden om den gamla versionen kvar i repot.** Registrerad 2026-08-05 (S97, resumen) ur Dependabot-granskningens sidofynd — triage: blockerar ej, värdefullt, defereras (CLAUDE.md § Triage). Bumpen landade i `#634` (`5c9b4946`) efter en mätning som visade formatet ofarligt: enda skillnaden i `task <id> --plain` är ett tillagt `(UTC)`-suffix på `Created:`/`Updated:`, och `check-backlog-closure.sh` rad 428–436 parsar den raden med `tr -cd '0-9'` + första 12 tecknen — båda formerna ger samma 12-teckensmönster, alltså **opåverkad**. `task list --plain` byte-identisk vid samma cwd. **Två poster släpar ändå efter:** (1) `.github/workflows/nightly.yml` rad ~344 namnger i klartext _"den pinnade devDependencyn backlog.md@1.47.1"_ — PR:en rörde inte filen, så kommentaren är nu faktafel; (2) provenance-verifieringen i [`docs/research/node-cli-deklaration-och-pinning-2026-07-30.md`](../../docs/research/node-cli-deklaration-och-pinning-2026-07-30.md) (SLSA-provenance, ett enda `postuninstall`-script, noll beroenden) är mätt mot **1.47.1**, och doc:en säger själv rakt ut _"Jag undersökte inte vad som ändrats sedan 1.47.1"_ — vi står alltså på en icke-verifierad artefakt. **Värd att känna till:** CI:s `test-check-backlog-closure.sh` kör mot ett STUBBAT backlog-CLI (`ci.yml:800`) och den skarpa grinden kör i `nightly.yml`, inte i PR-grinden — en formatregression hade synts först i natten. Ingen finns här, men mekaniken förklarar varför bumpen passerade tyst. Besläktad: `T102` (pinningen)

**Ursprunglig Ingång-cell:**
_Löst 2026-08-05 (denna landning): (a) `.github/workflows/nightly.yml` rad **385** (ej ~344 — verifierat exakt via grep före ändring) rättad `backlog.md@1.47.1` → `backlog.md@1.48.0`; ett grep-svep av `.github/`, `scripts/` och `package.json` gav inga fler aktuell-version-påståenden att rätta. (b) `docs/research/node-cli-deklaration-och-pinning-2026-07-30.md` fick en dagad uppdaterings-blockquote: samtliga tre bärande egenskaper omverifierade skarpt mot **1.48.0** (npm-registret direkt, en riktig `npm install --save-exact` + `npm audit signatures`, samt SLSA-attesteringens DSSE-payload avkodad manuellt) — SLSA-provenance intakt (`refs/tags/v1.48.0`, samma repo/workflow som 1.47.1), scripts-deklarationen oförändrad (enbart `postuninstall`, nu även inspekterad i klartext, ingen röd flagga), beroendeträdet oförändrat (0 `dependencies`, 6 `optionalDependencies`). Bonus: repots faktiska `audit-ci` kördes skarpt (ej längre simulerat) — `Passed npm security audit`. Medvetet EJ utrett: registrets `dist-tags.latest` är nu `1.49.3`, se doc:ens uppdateringsblockquote § "Nytt observerat"_
