---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T116 — Konvergens-passet saknade iterations-kadens — hålet fylldes med landnings-maskineriet

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Konvergens-passet saknade iterations-kadens — hålet fylldes med landnings-maskineriet.** Registrerad 2026-08-03 (S96, andra resumen) på Marcus fråga: _"var det bara för att vi skicka ut agent på ändringarna? Är det inte normalt sett så att vi göra alla ändringar/iterationer och committar först när jag är nöjd?"_ **Han hade rätt på båda punkterna, och felet var TVÅDELAT.** (1) **Orkestrerar-fel:** konvergens-varv delegerades till bygg-agenter trots att skillen säger _"Iterera med Marcus i webbläsaren tills HELT nöjd"_ (`UI.md` rad 148) — en interaktiv loop är inte ett självständigt uppdrag. Formbytet gjordes mitt i passet efter Marcus fällning (_"Vad är det som tar sådan tid???? Så här kan vi inte hålla på vid iteration!!!"_), bokfört i sessionsdok S96 Del 7. (2) **Processhål, det djupare felet:** skillen beskrev VAD konvergensen är men inget om KADENS — vem kör, i vilken worktree, när committas, när landar det. Enda närliggande rad var `SKILL.md` § Hemvist: _"prototyper FÅR committas under sin livstid"_, som tillåter men inte reglerar. Hålet fylldes i stunden med default-maskineriet, och **även EFTER formbytet kördes ändringen genom branch + PR + merge-kö (`#670`)** — noll skäl fanns, dev-servern är lokal med HMR. **MÄTT (`TASK-127.2`, fyra konvergens-varv 2026-08-03):** `#664` skapad 15:01 → merged 15:16 (**15 min i kön**) · `#666` 15:21 → 15:41 (**20 min**) · gren `…-omgang3` övergavs utan PR · `#670` 16:17, ej landad vid pausen. Plus agent-spawn och agent-arbete ovanpå varje — 10–30 min per varv för sekunders arbete. **Noll av varven behövde landa.** Skillen kräver EN commit i hela konvergensfasen: `[PROTOTYPE]`-SHA:n vid svar-fångsten (`UI.md` steg 6). **ROTORSAKS-KEDJAN:** agent-formen TVINGAR fram push→PR→kö, eftersom agentens isolerade worktree är enda vägen för ändringen att nå Marcus dev-server. Delegeringsvalet skapade alltså kö-kostnaden; det var inte två oberoende fel utan ett som utlöste det andra. **ÅTGÄRDAD SAMMA DAG** — se Ingång. **Kvarstående öppen fråga:** klassen är bredare än prototyper — _vilka andra interaktiva loopar kör vi genom landnings-maskineriet av vana?_ Ej kartlagd. Besläktad: `T110` (orkestrerarens felklasser — detta är en ny klass: rätt maskineri, fel loop) · `T115` (samma hub-sync-moment)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad); ÅTGÄRDAD 2026-08-03: kadensen kodifierad som `SKILL.md` § Standard-formen på UI-grenen **punkt 5** i marcus-system-pluginet **1.27.0** (hub-commit `450c628`) — varvet körs av aktören som sitter med Marcus i dev-serverns worktree · lokal commit per varv · push + PR EN gång när Marcus är nöjd · skarven mot divergens hålls skarp (där ÄR delegering rätt form). `UI.md` fick pekare + antimönster. Tråden hålls `paused` för den kvarstående klassfrågan, inte för åtgärden_
