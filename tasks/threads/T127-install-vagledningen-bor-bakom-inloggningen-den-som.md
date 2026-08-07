---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T127 — Install-vägledningen bor bakom inloggningen — den som inte kommit in kan inte läsa hur man kommer in

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Install-vägledningen bor bakom inloggningen — den som inte kommit in kan inte läsa hur man kommer in.** Registrerad 2026-08-07 (S96) ur Marcus egen installationsförsök: han väntade sig nedladdning + dra till Program, hittade ingen väg, och frågade varför vi inte byggt så. **MÄTT:** `/mer/installera-appen` ligger under `_authenticated` (`src/routes/_authenticated/mer/installera-appen.tsx`) — alltså oåtkomlig för den som saknar konto eller lösenord, och Marcus kunde inte logga in på prod förrän prods SMTP lagats samma dygn (Del 17). `TASK-126.3` står dessutom `To Do` på Marcus EGEN Gunilla-grind (_"install-ytans instruktioner ska bedömas pedagogiskt"_) — hans upplevelse ÄR det testet, utfört ofrivilligt, och det föll. PRD `task-126`:s egen problemformulering förutsåg det ordagrant: _"den som inte redan vet vägen hittar den aldrig"_. **INGEN ADR VÄGER NEDLADDNINGSBAR APP MOT PWA** — `ADR-047`:s alternativ ligger alla INOM PWA-spåret (`generateSW`, manuell Workbox, gamla Lighthouse-måttet); Electron/Tauri/`.dmg` nämns inte i någon ADR. Frågan ställdes aldrig, den besvarades implicit av byggplanens Fas 5 och bekräftades i S95-grillningens beslut 9 som "PWA maxad". **MARCUS BESLUT 2026-08-07** (verbatim): _"Jag har installerat den nu. Det är ok. Vi behåller det så här. Men vi ska justera nedladdningsinstruktions-sidan senare."_ — PWA-vägen står alltså fast; sidans pedagogik och dess placering är det som ska tas. **ÅTGÄRDSRIKTNINGAR (ej beslutade):** (a) install-ingång på login-ytan, dit den utan konto faktiskt når · (b) sidans egen pedagogik mot Gunilla-ribban · (c) manifestets namn/kort-namn i namnlisten som identitetsbärare. Besläktad: `TASK-126.3`/`126.5` (QA-korten) · `ADR-047`

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; Marcus har parkerat den till "senare")_
