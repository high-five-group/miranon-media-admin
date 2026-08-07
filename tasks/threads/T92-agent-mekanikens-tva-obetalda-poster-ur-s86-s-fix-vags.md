---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T92 — Agent-mekanikens två obetalda poster ur S86:s fix-vågs-forensik (2026-07-25). …

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
Agent-mekanikens två obetalda poster ur S86:s fix-vågs-forensik (2026-07-25). **(a) Lokal e2e utan port 5173:** vågorna 1–2 kunde inte köra rött-först lokalt (sviten är portlåst + CORS-bunden, porten bärs av Marcus levande dev-server) — en öppet bokförd avvikelse mot ADR-071 §2(iv). Våg 2 iteration 2 UPPFANN läkningen (preview-mätloop: `vite preview` på 4183 + klonad auth-state + route-mockar → 59/59 + 16/16 + 62/62) men receptet är inte härdat till verktyg; det lever bara i PR #189:s kommentar och L342:s källrad. Målform: `npm run test:e2e:local`. **(b) BYGG/SVANS-splitten för fix-vågor:** L340 föreskriver splitten (bygg slutar vid armerad auto-merge, svans äger CI-kedjan) men den applicerades bara på nattbatchens workflow-skript — fix-vågs-agenten fick odelat ägarskap och betalade ~46 min väggklocka för det. ADR-071-amendering i S76/S80-formen (under ADR-baren: lätt att återställa, väntad med L340-kontext). Rör hub-repots work-batch-skill ⇒ plugin-bump + `claude plugin update` i samma landning. **S90 (2026-07-26): recept (a) EMPIRISKT BEVISAT i skarp drift.** `PLAYWRIGHT_TEST_BASE_URL=http://localhost:4183` mot en egen dev-server hoppar över `webServer`-blocket helt (config-raden: "Med PLAYWRIGHT_TEST_BASE_URL satt hoppas webServer över") och lämnar Marcus 5173 orörd — inget behov av klonad auth-state, `setup` loggar in mot den nya porten själv. Bar hela task-48:s TDD-cykel (11 röda → 17 gröna) plus tre prototyp-pass och en smoke-verifiering. **Härdningen till `npm run test:e2e:local` kvarstår oförändrad** — receptet lever fortfarande bara i kommandorader, nu i S90:s sessionsdok utöver PR #189.

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad); uppstod S86 morgongranskningens tidsforensik. Systertråd till S87:s `scripts/ci-wait.sh` + L340-amendering, som tas direkt och INTE hör hit_
