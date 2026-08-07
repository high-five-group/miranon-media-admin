---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T131 — Dokument-ytan har ingen form — den bröts ut ur bilage-fundamentet för att en skiva inte kan föregå sitt facit

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Dokument-ytan har ingen form — den bröts ut ur bilage-fundamentet för att en skiva inte kan föregå sitt facit.** Registrerad 2026-08-07 (S93) vid skivningen av `TASK-146`. **MÄTT:** `src/routes/_authenticated/mer/` bär åtta sidor och ingen av dem är Dokument; ORDLISTA definierar däremot begreppet (_"Dokument är YTAN i Mer där bilagor hanteras"_), och S93:s carry bokförde redan _"Ej startat: Dokument-ytans prototyp-form"_ — den var alltså spårad som eget objekt innan den råkade hamna som skiva. **VARFÖR UTBRYTNINGEN VAR NÖDVÄNDIG:** repots kedja för en ny yta är prototyp → val → facit → PRD → skivor, och en skiva vars form ingen valt kan varken klassas AFK eller granskas mot ett facit. Kvar i kortet hade den gjort `TASK-146` permanent ostängbar. **FYND SOM FÖLJDE AV UTBRYTNINGEN:** utan Dokument-ytan har `TASK-146` ingen UI-konsument alls — klass A kan inte laddas upp någonstans ifrån, och bilageväljaren bor i `TASK-147`. Fundamentet skulle landa utan användare, vilket den dubbelriktade över-engineering-vakten varnar för. Det är inte fatalt (två specificerade konsumenter finns, det är sekvensering och inte spekulation) men det avgör ordningen: **eventsidans konsolidering byggs före fundamentet**, utom `TASK-146.1` (runtime-beviset) som är billigt och stänger ett verkligt okänt oavsett. Besläktad: `TASK-146` (föräldern den bröts ur) · `TASK-147` (den andra konsumenten) · `T130` (samma klass: form som inte valts) **MARCUS-BESLUT 2026-08-07: tas i SAMMA session som åtgärds-sidan**, inte som eget spår. Skälet är inte att båda är nya ytor — det är att bilageväljaren på åtgärds-sidan visar det Dokument-ytan förvaltar; designas väljaren utan biblioteket designas den baklänges. Bieffekt: `TASK-146` får därmed tillbaka en UI-konsument, och sekvenserings-invändningen ovan faller. Två prototyp-pass, inte ett — ytorna är distinkta, domänen är delad. Ingång: `docs/specs/ATGARDSSIDAN-UNDERLAG.md` § 9.

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; formen kräver eget prototyp-pass)_
