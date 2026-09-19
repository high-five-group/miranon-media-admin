# En geometriändring ska möta ytans BEFINTLIGA laddläges-/staging-svit på riktigt före landning

`[UNIVERSAL]`

**En ändring av en ytas GEOMETRI ska möta ytans BEFINTLIGA
laddläges-/staging-svit på riktigt före landning — inte bara sin egen nya
svit. Gäller som armeringsvillkor, inte som råd.** Instans
(`TASK-456`/PR #2541 → `TASK-481`): PR:en gav pill-raden en reserverad
höjd (`min-h-6`), men SKELETON-kortet fick ingen motsvarande reservation —
en verklig 24 px layoutförskjutning skeleton→data i prod. Bygg-agenten
körde bara sin egen nya e2e-svit hermetiskt; ytans befintliga
laddläges-svit (`mer-betalningar-laddlage.staging.test.ts`) kördes aldrig,
eftersom PR-CI inte kör staging-klassen (`run_staging: false`) — den körs
först i Post-merge, EFTER landning. Följden: fyra röda Post-merge-körningar
i rad på `main` innan felet fångades och åtgärdades separat.

Varför `[UNIVERSAL]`: mönstret "PR-gate kör en snäv/snabb testklass, en
bredare/dyrare klass körs bara efter merge" är vanligt i flerskiktad CI
(fast pre-merge-gate + deferred post-merge/nightly-svit) — inte specifikt
för denna app. Slutsatsen ("en geometri-/layoutändring måste själv
initiera den dyrare sviten manuellt före landning, eftersom CI inte gör
det åt en") generaliserar till varje projekt med samma tudelning.

Källa: `tasks/sessions/2026-09-18-session-127.md` Del 11, Lesson-kandidat
21 + "Regressionen — `#2541` gjorde efterkontrollen röd (`TASK-481`)".
