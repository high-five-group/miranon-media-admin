---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T105 — Hermetik-rapporten skrivs ut ur en gammal mätning som om den vore färsk — setup är flagg-vaktad, teardown är det inte

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Hermetik-rapporten skrivs ut ur en gammal mätning som om den vore färsk — setup är flagg-vaktad, teardown är det inte.** Upptäckt 2026-07-28 (S91, under `TASK-60`) när en HERMETISK acceptance-körning skrev ut anrop mot den skarpa staging-värden `pqtshyierkdgwdnxuirz.supabase.co` — vilket är strukturellt omöjligt i en hermetisk körning. **Asymmetrin är exakt och verifierad i koden:** `tests/global-setup.ts` rad 23 nollställer `.hermetik/rapport.jsonl` ENDAST när `PLAYWRIGHT_HERMETIK_RAPPORT=1` (_"No-op när mätläget inte är påslaget — filen rörs inte alls då"_), medan `tests/global-teardown.ts` läser och skriver ut filen UTAN att pröva flaggan — dess `catch { return; }` fångar bara att filen SAKNAS. Kvarlämnad fil från en tidigare mätning presenteras därför som den just körda svitens utfall. **Varför det är värre än det ser ut:** utskriften inbjuder till exakt fel slutsats åt båda håll — att hermetiken läcker (den gör inte det), eller att en färsk mätning finns (den gör inte det). Klassen är repots egen återkommande: frånvaro presenterad som data. **Fixen ser ut som en rad** (samma flagg-vakt i teardown), men hör till `TASK-59.7`, som äger mätinstrumentet och ska ha fyndet framför sig i stället för att ärva en ändring den inte bad om. **Ej åtgärdad i `TASK-60`** av DoD 4 (inga orelaterade filer i diffen) — medvetet deferat, ej glömt. Besläktad: `T103` (`test-bas.ts` hemvist — samma instrument). **ÅTGÄRDAD 2026-07-28 (`TASK-59.7`)** — samma flagg-vakt införd i teardown, så villkoret är FLAGGAN och inte filens existens. **Reproducerad i sin värsta form före fixen:** en plantad `.hermetik/rapport.jsonl` plus ett `--grep` utan träff gav `Error: No tests found` OCH en fullständig rapport som namngav den skarpa staging-värden — noll tester kördes, rapporten skrevs ändå. **Prövad åt båda håll efter fixen:** flagga AV med plantad fil och noll tester ⇒ ingen utskrift (filen orörd kvar); flagga PÅ mot `mer-segment-send.acceptance.test.ts` ⇒ rapport utskriven, 18 anrop, två värdar (fixtur-origin + typsnitts-CDN), inget tredje värdnamn

**Ursprunglig Ingång-cell:**
`TASK-59.7` · [mätningen](../../docs/research/acceptance-utbrytningens-utfall-2026-07-28.md) § 6 · `tests/global-teardown.ts`
