---
id: TASK-103
title: >-
  Fynd: Edge-Function-koden har ingen typkontroll och ingen lint — men hålet är
  mindre och annorlunda än det ser ut
status: To Do
assignee: []
created_date: '2026-07-31 08:26'
updated_date: '2026-07-31 08:35'
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

## Rekommendationer (ej byggda här)

1. **`ADR-010` bör få en `Updates`-not** som skriver in att Fas 7-åtagandets pre-commit-rad är överspelad av ADR-036 (CI är grinden), och att `tsconfig.edge-shared.json` nu täcker den Deno-fria delmängden. Kortet rör inte `docs/decisions/**`.
2. **Fas 7 bör betala åtagandet med `denoland/setup-deno` + `deno check`/`deno lint`** mot de 29 Deno-rörande filerna. Det är den enda vägen som ger dem äkta täckning — Node-tsc kan strukturellt inte göra det.
3. **De två `// @ts-nocheck` bör omprövas** när Deno-verktygen finns; de döljer i dag två URL-import-filer helt.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
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
