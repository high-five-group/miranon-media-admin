---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T128 — Heartbeat-svepets larm läser check-ROLLUP, inte required checks — ett icke-blockerande rött ger ett larm som strukturellt aldrig kan tystna

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Heartbeat-svepets larm läser check-ROLLUP, inte required checks — ett icke-blockerande rött ger ett larm som strukturellt aldrig kan tystna.** Registrerad 2026-08-07 (S96) under GitHub Actions-driftstörningen (incident `qcvjkzcs7j74`, major outage `2026-08-06 15:22Z` → `2026-08-07 00:08Z`). **MÄTT:** `#841`/`#842`/`#838` fick sina CodeQL-jobb kapade efter exakt 15m01s med tomt `runner_name` (jobben tilldelades aldrig runner). `gh run rerun` svarar `This workflow run cannot be retried` för CodeQL default setup — den kan bara triggas av nya händelser. Rulesetet `main-skydd` (id 19627609) har **EN** required check: `CI Passed or Skipped`. De röda CodeQL-körningarna blockerade alltså ingenting, men `scripts/heartbeat-svep.sh` larmade level-triggered var ~90:e sekund på rollupen — en signal som varken gick att åtgärda eller vänta bort på oförändrad SHA. Monitorn stoppades för hand **två gånger** under passet och ersattes tillfälligt av en edge-triggad main-SHA-vakt. **KLASSEN ÄR BREDARE ÄN SVEPET:** samma dygn fällde `deny-resend-send.sh` (mail-låset, `TASK-137`) först ett rent `AUTH LOGIN`-test utan sändning, och därefter en `Bash`-heredoc vars PROSA citerade värdnamnet när den beskrev den första fällningen. Båda vakterna larmar på **formen** i stället för på **handlingen** — mönstermatchning mot kommandotext respektive rollup-status, inte mot "skickas ett mail?" respektive "blockeras mergen?". **ÅTGÄRDSRIKTNINGAR (ej beslutade):** (a) svepet läser required contexts ur rulesetet (`gh api repos/:owner/:repo/rulesets/:id`) och larmar på dem; rollup behålls som lägre nivå · (b) mail-låset undantar kommandon som bevisligen inte kan sända (ingen `-d`/`--data`, ingen `DATA`-verb) eller flyttas från text-matchning till nätverkslager · (c) generell regel: en vakt som inte kan skilja "farlig handling" från "text om farlig handling" kostar mer i brus än den ger i skydd. Besläktad: `T112` (ett tillstånd utan bevakare — denna är dess spegelbild: en bevakare som larmar på fel tillstånd) · `T120` (`ask` som beslutsvärde, prompt-trötthet) · `TASK-137`

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad)_
