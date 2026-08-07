---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T114 — Orkestrerarens landningsvakt är blind för post-merge-rött på `main`

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Orkestrerarens landningsvakt är blind för post-merge-rött på `main`.** Registrerad 2026-08-02 (S96, AFK-natten). **MÄTT:** två röda post-merge-körningar samma kväll — `9aef0fef` (S93:s PR #613) och `1b79220f` (S96:s PR #614) — båda fällda på samma test, `tests/e2e/event-detail.staging.test.ts:1069` (`expect(termer).toEqual([...])`). **RÄTTAT 2026-08-03: påståendet att de var "transienta" var FALSKT och byggde på ett metodfel.** Slutsatsen drogs ur att post-merge på `9cbddab0`, `e44fca46` och `c39ff5d3` var gröna — men de körningarna **instansierade aldrig** `Staging (API + E2E)` (verifierat per run: docs-only-landningar, klassningen skippar staging). En slutsats drogs alltså ur körningar som aldrig körde testet — samma klass som `T110` A (mätning med instrument som ser en form men inte alla). Faktiskt läge: senaste gröna staging-körning är nattnätet `0a1d13b1` 2026-08-02 04:28Z; därefter **rött 3 av 3** gånger jobbet faktiskt körts (`9aef0fef`, `1b79220f`, nattnätet `6251d95e` 2026-08-03 04:35Z → ärende #636). Regressionsfönster `0a1d13b1..9aef0fef`, som innehåller S93:s hållplats-våg (1 366 rader över nio filer i `src/components/events/detail/`, däribland `Belaggning.tsx`; det fallande påståendet gäller beläggningstermer). **Hypotes, ej slutsats** — ytan är S93:s och överlämnad dit. **Repots EGET larm fungerade:** jobbet `Larm vid rött post-merge` skapade ärende #616 respektive #619 automatiskt. **Luckan sitter i ORKESTRERARENS svep:** `scripts/heartbeat-svep.sh` (`TASK-119`, landad samma kväll) vaktar fyra vägar mot ÖPPNA PR:er — main-SHA-avancemang, röda check-rollups, DIRTY, armerings-kandidater. Post-merge-körningar på `main` producerar ÄRENDEN, inte PR-tillstånd, och är därför strukturellt osynliga för svepet. Båda röda upptäcktes av en bygg-agents sidoobservation i en slutrapport — inte av vakten, vilket är hela poängen. **KLASS:** `L443`-familjen (vakta utfallsklasser, inte tillståndsbyten) och `T108`/`T112` (ett tillstånd utan bevakare). **Ej en defekt i `TASK-119`:s leverans** — kortets AC bad aldrig om post-merge-vägen; detta är en scope-utvidgning. **Åtgärdsriktning (ej beslutad):** en femte väg i svepet som läser antingen öppna ärenden med post-merge-larmets form eller post-merge-workflowens conclusion på den bevakade grenen. Besläktad: `TASK-128` (samma skript, annan lucka — kandidat-larmet fyrar på köade PR:er) · `TASK-119` · `L443` · `T108` · `T112`

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad)_
