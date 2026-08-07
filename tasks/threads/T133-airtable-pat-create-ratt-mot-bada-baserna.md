---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T133 — Airtable-PAT:en har `create`-behörighet mot BÅDA baserna

> Tråd-kort (ADR-053), fött i konflikt-lösningen mellan registrets tunna
> radform-migration (`TASK-157.2`,
> [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md))
> och `#909` som registrerade tråden i den gamla radformen parallellt.
> Innehållet nedan är den ORDAGRANNA texten ur `#909`:s registerrad —
> flyttad, inte omskriven eller sammanfattad. Ursprunglig radhistorik:
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Airtable-PAT:en har `create`-behörighet mot BÅDA baserna — prod-skyddet ligger helt i vår egen kod, inte i tokenets scope.** Registrerad 2026-08-07 (S93) ur `TASK-146.2`s bygge — triage: blockerar ej, värdefullt, defereras. **MÄTT av byggagenten mot live-API:t:** `mcp__airtable__list_bases` gav staging `apphjj8Q7lkXCMsL4` och prod `app8uGPrVCVOm6LfD`, och den PAT som redan var tillgänglig (MCP-serverns `AIRTABLE_API_KEY`) kunde skapa schema mot **båda**. Den är alltså inte least-privilege. **VAD SOM SKYDDAR IDAG:** enbart kodens egen bas-guard — `scripts/create-bilagor-table.mjs` har `expectedBaseId: 'apphjj8Q7lkXCMsL4'` + `forbiddenBaseIds: ['app8uGPrVCVOm6LfD']` och kastar vid avvikelse (skyddsräcke 1, rad ~93–95 + ~216–229). Skriptets filhuvud bokför öppet att _"skyddet mot oavsiktlig prod-skrivning ligger därför HELT i kodens bas-guard"_. Samma mönster i `scripts/provision-attachments-bucket.mjs` (`TASK-146.3`) för Supabase-sidan, där prod-ref:et hårdblockeras med eget felmeddelande. **VARFÖR DET INTE ÄR AKUT:** varje skarpt skript bär guarden, prod-körningarna är bokförda som Marcus-moment i respektive kort, och ingen automatik kör dem. **VARFÖR DET ÄNDÅ BÖR LÖSAS:** ett skyddsräcke i kod skyddar bara de kodvägar som bär det — en agent som anropar Airtable-MCP:n direkt, eller ett framtida skript som glömmer guarden, har inget under sig. En scope-begränsad PAT per miljö flyttar skyddet från konvention till plattform. **Avvägningen är Marcus:** en separat staging-PAT är en kontoändring, och `AIRTABLE_SCHEMA_TOKEN` är redan utbruten som eget namn i `.env.seed.example` (`TASK-146.2`) just för att göra bytet billigt när beslutet tas. Besläktad: `TASK-146.2` (fyndet) · `TASK-146.3` (samma mönster mot Supabase) · `ADR-063` (basen som förstklassig leverabel)

**Ursprunglig Ingång-cell:**
_(inget kort än — endast registrerad; kräver Marcus-beslut om kontostruktur)_
