---
id: TASK-103
title: >-
  Fynd: Edge-Function-koden har ingen typkontroll och ingen lint — men hålet är
  mindre och annorlunda än det ser ut
status: Done
assignee: []
created_date: '2026-07-31 08:26'
updated_date: '2026-08-01 13:04'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fyndet kom från `TASK-53`:s agent 2026-07-31: `supabase/functions/` ligger utanför alla `tsconfig`-program OCH är exkluderad ur Biome (`biome.json` rad 10) — den kod som talar med Airtable i produktion skulle därmed vara repots enda kodbas utan någon av de två grindar allt annat passerar.

**Mätningen visar att premissen är delvis fel, och att gränsen går någon annanstans än vid mappen.** Alla tal nedan mätta på `main` @ `22c2482` (efter att `TASK-53`/PR #500 och `TASK-38`/PR #499 landat).

## Fas 1 — vad som faktiskt ligger bakom grinden

**Typkontroll.** 40 `.ts`-filer under `supabase/functions/`. Nio av dem typkollas redan i dag — de dras in i `tsconfig.tests.json`-programmet för att tester importerar dem. 31 ligger utanför alla program.

Sond (`include` på hela `supabase/functions/**`, Node-tsc) ger **67 fel i 26 filer**, i tre klasser:

| Klass | Antal | Vad det är |
|---|---|---|
| `TS2304` | 39 | `Cannot find name 'Deno'` — rot |
| `TS7006` | 26 | implicit `any` — **härledd**, ej egen defekt |
| `TS2307` | 2 | `Cannot find module 'https://esm.sh/…'` — rot |

`TS7006` är härledd och ska inte räknas som egen klass: `Deno` är okänt → `Deno.env.get()` blir `any` → `raw.split(',').map((s) => …)` får otypad parameter. Samma kedja i index-filerna via `Deno.serve(async (req) => …)`. Verifierat i källan, ej antaget.

Att `TS2307` bara är 2 trots fyra filer med URL-import har en egen förklaring: `send-email/index.ts` och `send-registration-confirmation/index.ts` bär redan `// @ts-nocheck` med motiveringen *"typas vid deploy, ej av Node-tsc"*. Någon har alltså redan mött det här och löst det tyst, utan beslut.

**Lint.** Med exkluderingen lyft ger `biome check supabase/functions` **21 fel + 6 varningar + 143 infos** över 40 filer:

| Regel | Antal | Nivå |
|---|---|---|
| `lint/complexity/useLiteralKeys` | 143 | info |
| `format` | 18 | fel |
| `assist/source/organizeImports` | 3 | fel |
| `lint/style/noNonNullAssertion` | 2 | varning |
| `lint/complexity/useRegexLiterals` | 2 | varning |
| `lint/correctness/noUnusedFunctionParameters` | 1 | varning |
| `lint/complexity/useOptionalChain` | 1 | varning |

**Noll av 237 diagnoser är en äkta funktionell defekt.** De 21 felen är uteslutande formatering och import-ordning. De 143 infos är `useLiteralKeys` på Airtables dynamiska fältnamn. Det enda som ens kan kallas ett fynd är en möjligen oanvänd parameter (`corsHeaders` i `makeRealLogWriter`, `send-email/index.ts:99`) — en hygien-detalj, inte en bugg.

## Fas 1 — forensiken

Exkluderingen är **inte** ett förbiseende. `git log -S` ger en enda commit: `c91bfa0` (2026-04-13, "fas 1: domäntransplant"), vars meddelande säger rakt ut *"biome.json exkluderar supabase/functions (Deno-kod, lintas separat)"*.

Den styrs dessutom av en **Accepted ADR**: [`ADR-010`](../../docs/decisions/ADR-010-biome-exclude-deno-edge-functions.md). Den övervägde fem alternativ, förkastade både `typeRoots: ["@types/deno"]` och en separat `tsconfig.deno.json`, och förutsåg exakt de klasser mätningen nu hittar — Deno-globaler, URL-imports, `noNonNullAssertion`, `useLiteralKeys` på dynamiska Airtable-nycklar. **ADR-010:s diagnos håller fortfarande, 3,5 månader och 33 tillkomna filer senare.**

`tsconfig`-sidan har däremot aldrig varit ett beslut: `git log -S supabase` mot alla fyra `tsconfig*.json` ger **noll träffar**. Programmen räknar upp `src`, `vite.config.ts`/`playwright.config.ts` och `tests/**` — `supabase/` har helt enkelt aldrig lagts till.

ADR-010 bär ett **Fas 7-åtagande**: installera Deno CLI, `deno check`, `deno lint`, `deno fmt` i deploy-pipelinen. Enligt `docs/byggplan.md` §4 är **Fas 6 🟡 PÅGÅR och Fas 7 ej påbörjad** — och Fas 7 äger uttryckligen "deploy-pipeline". Åtagandet är alltså uppskjutet enligt sina egna villkor, inte förfallet. Deno CLI är inte installerad, finns inte i `package.json` och nämns inte i `.github/`.

## Fas 1 — den verkliga diagnosen

Gränsen går inte mellan `supabase/functions/` och resten av repot. Den går mellan **Deno-rörande** och **Deno-fri** kod, och den gränsen är transitiv:

- `_shared/` har 16 moduler. Fyra rör `Deno` direkt (`airtable-client`, `auth`, `cors`, `registration-read`).
- Av de 12 återstående är 11 transitivt fria. Den tolfte, `segment-resolution.ts`, importerar `airtable-client.ts` och drar in Deno-globalen ändå — **det är precis de 7× `TS2304` `TASK-53`:s agent mätte**, reproducerat.
- Nio av de 11 typkollas redan — men **bara som sidoeffekt av att tester råkar importera dem**. Ingenting deklarerar att det ska gälla, och täckningen försvinner tyst om ett test slutar importera.

`TASK-53` byggde sin `airtable-retry.ts` medvetet Deno-fri just för att kunna typkollas från testsidan. Den designen vilar alltså på en invariant som ingen skrivit ned och ingen grind vaktar.

## Fas 2 — vägval

**ADR-010 rivs INTE.** Forensiken visar ett medvetet val vars skäl fortfarande gäller, mätningen bekräftar noll äkta defekter bakom grinden, och ADR-010:s eget åtagande förfaller först i Fas 7. Att lyfta exkluderingen nu hade lagt 237 diagnoser på repot utan att fånga en enda bugg.

Landad förbättring i stället: `tsconfig.edge-shared.json` gör den befintliga, oavsiktliga täckningen **avsiktlig och deklarerad**, och utökar den från 9 till 11 moduler — `cursor.ts` och `errors.ts` hade ingen täckning alls, och `errors.ts` används av samtliga Edge Functions. Grinden körs av `npm run typecheck`, som redan går i CI: **ingen ny CI-wiring krävs.**

## Research-passet — mönstret är bekräftat, och hålet har en botten jag inte kunde se

Ett avgränsat research-pass mot primärkällor kördes parallellt: [`docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md`](../../docs/research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md). Det **bekräftar vägvalet** och lägger till evidens mina instrument strukturellt inte kunde nå.

**Mönstret är etablerat, inte avvikande.** `supabase init` skriver själv in skiljelinjen i projektet — CLI-mallen innehåller ordagrant `"deno.enablePaths": ["supabase/functions"]`. Supabase docs säger explicit att den setupen *"works perfectly for projects where your Edge Functions live alongside your main application code"*. Fem precedent-repon kör alla Denos verktyg i en egen, path-filtrerad workflow; `hero-org/herocast` har **exakt samma** `"!supabase/functions"` i sin `biome.json`.

**Men: `deno check` med `@ts-nocheck` borttaget hittar 2 VERKLIGA typfel.** Min mening ovan om "noll äkta defekter" gäller de instrument jag körde — Node-tsc och Biome. Med rätt verktyg finns det defekter: `batchValidation: 'permissive'` skickas till `resend.batch.send()` i `send-email/index.ts:87` och `send-registration-confirmation/index.ts:92`, men optionen finns varken i typerna eller i runtime hos `resend@4.8.0`. Den når sannolikt aldrig Resend. Ej skarpt verifierad — hör till eget kort.

**`@ts-nocheck`-motiveringen är falsifierad.** Kommentaren säger *"typas vid deploy, ej av Node-tsc"*. Deno typkontrollerar inte vid körning (negativ kontroll: typfel-fil kördes med exit 0), och `supabase functions deploy` bundlar via `edge-runtime bundle` till eszip utan typkontroll. **Ingenting typkontrollerar de två filerna någonstans.**

**Två av ADR-010:s premisser håller inte på dagens versioner.** Biome 2.5.4 kvävs inte av `https:`-imports (noll diagnostiker på dem), och `overrides` fungerar — alternativ 2 avfärdades med *"inte lika mogen som ESLints"*. Beslutet står; skälen behöver rättas.

## Rekommendationer (ej byggda här)

1. **Fas 7 bör betala ADR-010:s åtagande** med en egen, path-filtrerad workflow: `denoland/setup-deno@v2` (verifierad förstaparts-action) med **pinnad** version, plus `deno check` + `deno lint`. Det är snittet fem av fem precedent-repon valt. Kostnad lokalt mätt: `deno lint` ~0,3 s, `deno check` ~1,5 s varmt — **ingen CI-mätning gjord**, talen är lokala.
2. **`supabase/functions/deno.json`** är deploy-neutral (bevisat ur CLI-källan: top-level-filen ligger inte i deploy-kedjan) och kan därför bäras enbart för lint/check/LSP.
3. **Ta bort de två `// @ts-nocheck` i samma landning som grinden** och åtgärda de 2 typfelen — annars startar grinden röd, och en grind som startar röd blir avstängd.
4. **`ADR-010` bör få en `Updates`-not**: Fas 7-åtagandets pre-commit-rad är överspelad av ADR-036 (CI är grinden), två premisser är mätt falsifierade, och `tsconfig.edge-shared.json` täcker nu den Deno-fria delmängden. Kortet rör inte `docs/decisions/**`.
5. **`deno fmt` bör skjutas till eget beslut** — 21 av 39 filer skulle skrivas om även med config matchad mot Biomes stil.
6. **Möjlig produktionsdefekt bör få eget kort:** `batchValidation`-fyndet ovan.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hålets storlek MÄTT, ej uppskattad: antal filer utanför tsconfig-programmen, samt faktiska fel per klass för både tsc-sond och Biome — tal redovisade i kortet
- [x] #2 Forensiskt pass kört mot biome.json-raden OCH tsconfig-filerna (git log -S); utfallet avgör vägvalet och redovisas även om exkluderingen visar sig medveten
- [x] #3 Den styrande ADR:n (ADR-010) läst i sin helhet FÖRE åtgärden, och dess Fas 7-åtagande stämt av mot faktisk fas-status i byggplan.md
- [x] #4 Vägvalet i fas 2 uttalat och motiverat: rivs exkluderingen eller inte, och varför — förkastat alternativ bär sitt skäl
- [x] #5 Den Deno-fria delmängden bestämd TRANSITIVT, ej med grep på 'Deno.' — en modul som importerar en Deno-rörande modul räknas som Deno-rörande
- [x] #6 Tvåsidigt grindbevis: grinden fäller mot ett planterat Deno-anrop i en modul som INTE var täckt före ändringen, och är grön mot repots faktiska innehåll
- [x] #7 Bevisat att samma planterade fel passerar UTAN grinden — annars är täckningen inte ny utan bara omformulerad
- [x] #8 Ingen ny CI-wiring införd: grinden körs av ett kommando CI redan kör (npm run typecheck)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nattgrindens drift-fynd (nattärende #541): alla åtta AC bockade men kortet stod To Do bortom karensen. Leveransen (PR #507, commits d5707b2 EF-typecheck + 4181cbe research-passet, merge e7c418b, mergad 2026-07-31 08:59): hålet mätt (31 filer utanför alla tsconfig-program; 67 tsc-fel i tre klasser varav TS7006 härledd; 237 Biome-diagnoser, noll äkta funktionella defekter för de körda instrumenten), forensiken visade medvetet val (ADR-010 Accepted, biome-exkluderingen c91bfa0) — ADR-010 rivs INTE; i stället tsconfig.edge-shared.json som gör den oavsiktliga test-sidoeffekt-täckningen avsiktlig och deklarerad, 9 → 11 Deno-fria moduler (cursor.ts + errors.ts nya), gräns bestämd transitivt (AC#5), grind via befintligt npm run typecheck — ingen ny CI-wiring (AC#8). Tvåsidigt bevis: planterat Deno-anrop i otäckt modul fäller MED grinden och passerar UTAN (AC#6+#7). Research-passet bekräftade mönstret mot fem precedent-repon och fann två verkliga typfel bakom @ts-nocheck (batchValidation permissive — eget kort TASK-111, redan landat #523). DoD#3 verifierad per jobb: merge_group-run 30617779264 på merge-SHA e7c418b — Detect changed files success · Lint + Audit + TypeCheck success · Docs link check success · Test suite / Pure + Build success · Test suite / Acceptance (hermetisk) success · Staging + A11y skipped by-design · CI Passed or Skipped success. Stängd 2026-08-01 i svans-passet efter nattgrindens fynd.
<!-- SECTION:FINAL_SUMMARY:END -->
