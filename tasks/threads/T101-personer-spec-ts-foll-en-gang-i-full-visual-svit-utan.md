---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T101 — `personer.spec.ts` föll en gång i full visual-svit utan att gå att reproducera

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**`personer.spec.ts` föll en gång i full visual-svit utan att gå att reproducera.** Observerad 2026-07-27 (S91, under `TASK-57`). Testet passerade isolerat och i **tre** efterföljande fulla körningar (28 passed × 3); artefakten hann skrivas över innan den lästes, så orsaken är **inte diagnostiserad**. Registreras trots det, av två skäl. (1) **Ingen tidigare flake-historik finns** — `git log` på filen ger en enda commit (`82122ef`, task-36.7) och varken `lessons.md` eller något sessionsdok nämner testet som instabilt, så detta är första registrerade instansen och nästa observation behöver något att landa på. (2) **`T87` armerar just denna grind.** Ett intermittent baseline-test är oskadligt så länge grinden är rådgivande, men blir en falsk röd i varje PR-kedja den dagen `T87`:s trigger löser ut — och en visuell grind som fäller utan orsak är den snabbaste vägen till att den slutar tas på allvar. **Kandidat-orsaker, EJ prövade:** de tre nya vakt-testerna × två vyportar ändrade svitens schemaläggning i samma ändring som observationen; testet ligger dock inte på `TASK-57`:s kodväg (vaktens meddelande byggs bara vid ett omockat anrop, vilket `personer` inte gör). **Nästa steg när den återkommer:** läs artefakten FÖRE nästa körning skriver över den — `test-results/`-katalogen är den enda källa som bär diffbilden. Besläktad: `T87` (grind-aktiveringen)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad)_
