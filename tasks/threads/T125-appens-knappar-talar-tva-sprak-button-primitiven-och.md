---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T125 — Appens knappar talar två språk — `Button`-primitiven och handrullade piller — och skillnaden syns där de möts

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Appens knappar talar två språk — `Button`-primitiven och handrullade piller — och skillnaden syns där de möts.** Registrerad 2026-08-06 (S93, iterationsvåg 3) på Marcus ord: _"Jag tycker hela appen borde ha en standardstorlek på alla knappar. […] Men det är något jag vill göra senare i alla fall."_ Triage: blockerar ej, värdefullt, defereras (CLAUDE.md § Triage). **MÄTT i browsern 2026-08-06** (DOM-geometri, dev-servern, `?variant=a`): `Button`-primitiven ger `rounded` **4 px** och `size="sm"` **32 px** höjd; de handrullade filterkontrollerna gav `rounded-full` **9999 px** och **37–38 px** (Skriv ut 102,9 × 37 · tratten ~38 × 38). De två formerna stod bredvid varandra på registrets filterrad — Markera intill tratten — vilket är exakt vad Marcus fyra punkter i iterationsvåg 3 beskrev, var och en som ett eget symptom på samma rot. **JOBBET ÄR MINDRE ÄN DET LÅTER:** primitiven bär redan skalan (`sm` 32 · `md` 40 · `lg` 48) plus intent/emphasis-matris och `contrast-more`-kant, så uppgiften är INTE att inventera och sätta standardmått — den är att **migrera de handrullade knapparna till den primitiv som redan finns**. Sökbar ingång: `rounded-full` + `px-3.5 py-2` i `src/components/`. **REDAN GJORT (prototyp-ytan, denna landning):** `RegisterFilterRad`s tratt/Skriv ut/Rensa filter och `Atgarder.tsx`s `SkrivUtKort` går nu via primitiven — samtliga mätta till 32 px och 4 px radie. **KVARSTÅR:** `EventsList.tsx` (PRODUKTIONSKOD, task-17.7 — tratten, Skriv ut, Rensa filter, periodväxlaren) lämnades medvetet orörd på Marcus scope-beslut _"Vi håller oss till prototypen"_; divergensen mellan eventlistan och prototypen är alltså känd och bokförd, inte drift. Ett svep över appens övriga vyer är ogjort. **Värt att veta innan formen väljs:** eventlistans pillerspråk är research-grundat (`docs/research/filtervy-listor-monster-2026-07-24.md`) — att migrera det är ett designbeslut, inte en uppstädning, och kan behöva vägas mot den researchen. Besläktad: `ADR-083`-klassen är INTE denna (här finns ingen falsk täckning, bara två sanna former som inte valts mellan)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; formen avgörs av Marcus, migreringen är avgränsad och mätbar när den tas)_
