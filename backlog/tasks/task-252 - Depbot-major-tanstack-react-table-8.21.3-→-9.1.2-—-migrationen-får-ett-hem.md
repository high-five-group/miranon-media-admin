---
id: TASK-252
title: 'Depbot-major: @tanstack/react-table 8.21.3 → 9.1.2 — migrationen får ett hem'
status: Done
assignee: []
created_date: '2026-08-17 06:42'
updated_date: '2026-08-24 15:44'
labels:
  - ready-for-human
dependencies: []
priority: medium
ordinal: 471000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #1491 (Dependabot 2026-08-17, måndags-schemat). Major-bump = ADR-031 Lager 4: manuell Marcus-review, aldrig auto-merge. Hygien-svepet 2026-08-17 fann inget kort som bär migrationsjobbet — detta kort är hemmet. Tabellytor i appen konsumerar react-table; v9:s breaking changes okarterade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 v9:s changelog/breaking changes lästa och migrationens faktiska omfattning i VÅR kodbas bokförd på kortet (vilka ytor, vilka API-brott)
- [x] #2 Marcus-beslut: migrera nu eller parkera med motiv + omprövningsdatum
- [x] #3 Vid migrering: DoD-fyran grön + tabellytorna verifierade i browsern
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## AC1 — Kartläggning av v9-migrationens omfattning (2026-08-17, Opus på Marcus order)

**Huvudfynd: kortbeskrivningens premiss "Tabellytor i appen konsumerar react-table" är FALSIFIERAD.** Noll källfiler i repot konsumerar paketet. Migrationens omfattning i kod är därmed 0 filer.

### Mätning (kommando → utfall)

- `grep -rn "@tanstack/react-table|@tanstack/table-core"` över hela repot utom `node_modules`: **0 träffar i källkod**. Enda träffarna är `package.json:65` och `package-lock.json`.
- Grep över v8:s API-symboler (`useReactTable`, `createColumnHelper`, `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`, `flexRender`, `ColumnDef` m.fl.) i `src/`, `tests/`, `playwright/`, `scripts/`, `supabase/`: **0 träffar**.
- Lock-trädets konsumenter: endast root-`package.json` (direkt beroende utan användare). Ingen transitiv konsument.
- Bundle-bevis, tvåsidigt: `npm run build` exit 0; `grep -rlE "useReactTable|tanstack.{0,3}table|table-core" dist/` → **exit 1, 0 av 126 filer**. Kontrollprov `grep -rlE "react" dist/assets/` → exit 0, dvs. grep fungerar mot `dist/`. Paketet finns alltså inte i produktionsbundlen.
- CI på PR #1491: samtliga körda jobb **pass** (Acceptance hermetisk, Pure + Build, Webblasarbeteende, Lint + Audit + TypeCheck, Vercel) — koherent med noll konsumenter.

### Varför paketet finns utan användare

ADR-013 (Fas 4-borttagningen, Accepted 2026-05-05) § Kontext p.3: "**TanStack Table är redan installerat** … När/om DataTable behövs är beroendet redo — komponenten själv är den enda saknade biten." DataTable flyttades till Fas 7 som **villkorligt** scope — `docs/byggplan.md:915`: "DataTable-komponent (om event-detalj behöver det; annars eliminera)". Paketet har legat oanvänt sedan Fas 0.

### Yt-tabell (yta → träffat API → v9-förändring → bedömd insats)

| Yta | Träffat API | v9-förändring | Insats |
|---|---|---|---|
| Ingen källfil i `src/`, `tests/`, `playwright/` | inget | ej tillämplig | **0** |
| `package.json:65` | `"@tanstack/react-table": "^8.21.3"` | version-spec → `^9.1.2` | S (1 rad, redan gjord av Dependabot) |
| `package-lock.json` | lock-poster | nytt runtime-beroende `@tanstack/react-store ^0.11.0`; `table-core` 8.21.3 → 9.1.2 | S (auto) |

**Total migrationsinsats i kod: S — noll kodändringar.**

### v9:s brytningar

Relevanta först vid ett FRAMTIDA DataTable-bygge, inte nu. Verifierade mot paketets egen `dist` (`npm pack @tanstack/react-table@9.1.2`) utöver dokumentationen:

- `useReactTable` → **`useTable`**. `useReactTable` saknas helt i huvudexporten (`dist/index.d.ts`) — hård brytning för varje v8-konsument.
- Row models: `get*RowModel()` → `create*RowModel()` som namngivna slots i `tableFeatures()`. `getCoreRowModel()` blir automatisk och utgår.
- **Opt-in feature-registrering krävs** (`tableFeatures()` eller `stockFeatures`) — tree-shakebart, lägre minnesåtgång.
- State: `table.getState()` → `table.state` / `table.store` / `table.atoms.<slice>`. `onStateChange` borttagen (slice-vis `on[State]Change` kvar). `data` och `columns` är readonly.
- Sortering: `sortingFn` → `sortFn`, `sortingFns` → `sortFns`, `getSortingFn()` → `getSortFn()`.
- Pinning går från fysisk till logisk riktning: `left`/`right` → `start`/`end`; alla `getLeft*`/`getRight*` → `getStart*`/`getEnd*`.
- Column sizing splittad i `columnSizingFeature` + `columnResizingFeature`; `columnSizingInfo` → `columnResizing`.
- Typgenerics bär nu `TFeatures` först: `ColumnDef<TData>` → `ColumnDef<TFeatures, TData, TValue>` (samma för `Table`, `Row`, `Cell`, `Column`). `createColumnHelper<TData>` → `createColumnHelper<TFeatures, TData>`.
- Aggregation blir eget feature (`rowAggregationFeature`); `getAggregationValue(rows, depth)` → `getAggregationValue({ rows, maxDepth })`; `getAggregationFn()` → `getAggregationFns()`.
- Row selection: `getToggleSelectedHandler()` slår på shift-range som default (`enableRowRangeSelection: false` återställer v8-beteendet).
- Instansmetoder får inte destruktureras (kontextbindning krävs).
- **`flexRender` är oförändrad**; ny komponentform `<FlexRender />` tillkommer.
- Escape hatch: `@tanstack/react-table/legacy` exporterar `useLegacyTable` plus hela v8-ytan (`getCoreRowModel`, `getSortedRowModel`, `legacyCreateColumnHelper` m.fl.) — verifierat i `dist/legacy.d.ts`. Deprecerad och allt-inkluderande.
- Nytt runtime-beroende `@tanstack/react-store ^0.11.0`; peer `react >=18` (vi kör React 19, uppfyllt).

Källor: <https://tanstack.com/table/latest/docs/framework/react/guide/migrating> · <https://tanstack.com/blog/tanstack-table-v9-taking-form> · context7 `/tanstack/table` (`docs/framework/react/guide/migrating.md`) · `npm pack @tanstack/react-table@9.1.2` → `dist/index.d.ts`, `dist/legacy.d.ts`, `package.json` exports.

### Rekommendation som underlag inför AC2 (beslutet är Marcus)

Eftersom noll kod konsumerar paketet finns **ingen migration att utföra**. Frågan är i stället vilken hemvist ett oanvänt direkt beroende ska ha.

**Förstahandsval — (B) ta bort `@tanstack/react-table` ur `package.json` och stäng #1491.** ADR-013 gjorde DataTable villkorligt ("annars eliminera") och åberopade själv M4-principen: komponent utan empirisk användning är onödig kodbasyta plus underhållskostnad. Beroendet har burits oanvänt sedan Fas 0 och genererar återkommande Dependabot-major-brus (detta kort är första instansen), audit-yta och lock-tyngd utan en enda användare. Behövs DataTable i Fas 7 är `npm i @tanstack/react-table` en engångsoperation som då hämtar dåvarande aktuella major — strikt bättre än att i förväg bära en version som hinner åldras.

**Andrahandsval — (A) merga #1491.** Risken är noll (0 konsumenter, CI grön) och Fas 7 skulle starta mot aktuell major. Sämre än (B) endast på den punkten att vi fortsätter bära ett oanvänt paket, men fullt försvarbart om Fas 7:s DataTable bedöms sannolik.

**Avrådes — (C) parkera kvar på v8.** Ger det sämsta av båda: kvarvarande oanvänt beroende plus en öppen PR och återkommande hygien-brus vid varje ny v9-utgåva.

**Observation, ej åtgärdad (utanför detta korts AC1-mandat):** #1491 står `CLEAN`, odraftad och oarmerad. Per ADR-031 Lager 4 ska den aldrig auto-mergas, men enligt `tasks/lessons.d/parkerad-pr-utan-draft-ar-oskiljbar-fran-glomd.md` är en medvetet parkerad PR utan draft-status oskiljbar från en glömd för varje bevakningsmekanism. Överväg `gh pr ready 1491 --undo` tills AC2 är beslutat. PR:en är orörd av detta arbete.

Beslutat av Code på Marcus-mandat 2026-08-24 (GO i klartext), S112. Marcus-beslut (AC#2): alternativ (B) — ta bort @tanstack/react-table ur package.json och stäng PR #1491. Skäl (ur AC1-kartläggningen ovan): 0 källfiler konsumerar paketet, ADR-013 gjorde DataTable-komponenten uttryckligen villkorlig ('om event-detalj behöver det; annars eliminera', docs/byggplan.md:915), och paketet har legat oanvänt sedan Fas 0. Beslutskriteriet (AC#2) bockas här. Själva borttagningen (paketets faktiska removal ur package.json/package-lock.json + PR-hantering av #1491) utförs av en PARALLELL agent i samma S112-mandatpass, inte av detta kort/denna landning — noll kod ändras härifrån. AC#3 ('Vid migrering: DoD-fyran grön + tabellytorna verifierade i browsern') gäller inte längre bokstavligt: beslutet är BORTTAGNING, inte migrering, och AC#3:s text ger ingen uttrycklig grund för att låta en systerkorts/parallell-PR:s arbete räknas som fullbordande av DENNA korts DoD (inget AC-villkor nämner en removal-väg eller en sibling-referens). Status lämnas därför TO DO i väntan på att borttagningen landar — flippas inte till Done i detta pass. Rapporteras till orkestreraren för uppföljning när removal-PR:n är klar (t.ex. genom en ny AC som pekar på borttagnings-kortet, eller en direkt DoD-verifiering här).

## Borttagning genomförd (2026-08-24, S112 mandatpass beslut 5 — Marcus-mandat alternativ B)

Premiss-pass (ADR-086): grep `from ['\"]@tanstack/react-table\"` över src/, tests/, playwright/, scripts/ omkört före åtgärd → 0 träffar (bekräftar AC1:s fynd, ingen divergens). PR #1491 verifierad OPEN/CLEAN/dependabot innan stängning.

Åtgärd: `npm uninstall @tanstack/react-table motion` (delat kort-par TASK-252/253, en operation). `package.json`/`package-lock.json` diff är minimal — enbart de två raderna borta, inga orelaterade ändringar.

Grindar (fulla DoD-fyran, mätta exitkoder): `npm run typecheck` exit 0 · `npx @biomejs/biome check .` exit 0 · `npm run build` exit 0 · `npm run test:api` (staging) — första körningen stoppades av staging-preflighten (post-merge.yml körning 32738556092 höll staging, väntade ut den ~11 min); andra körningen 1163 passed / 1 failed (generate-event-attachment.staging.test.ts, Bilagor-radräkning 34→35 — delad-stagingfixturkollision, orelaterad till borttagningen); isolerad omkörning av exakt det testet: 2 passed. `npx audit-ci --config audit-ci.jsonc` exit 0 (extra krav i uppdraget).

Bundle-bevis: `grep -rlE \"react-table|motion-dom|framer-motion\" dist/\" efter build → 0 träffar (kontrollgrep mot \"react\" gav träffar, så metoden fungerar).

AC3-tolkning (flaggad, ej blockerande): kriteriet är ordagrant skrivet för alternativ A (\"Vid migrering: … tabellytorna verifierade i browsern\") men beslutet blev alternativ B (borttagning). Bockat eftersom den underliggande avsikten — DoD-fyran grön — är uppfylld, och \"tabellytorna\" är vakuöst noll (0 konsumenter). AC2 (beslutskriteriet) rörs INTE av denna leverans — annan agent äger den rutan.

Not: `npm uninstall` konverterade denna worktrees symlänkade `node_modules` till en riktig katalog (npm reify tog bort symlänken). Huvudrepots `node_modules` overifierat orört (kontrollerat filsystem-tidsstämpel).

Commit-referens: se PR (fylls i separat commit strax innan push).

Commit-referens (uppdaterad): c735bb35b2f9a222e257b8360701033132305bb0 (chore(deps): ta bort oanvända @tanstack/react-table + motion).

Done-flipp S112: PR #1921 landad (rebasad efter #1924-konflikt), post-merge grönt; paketet borttaget, #1491 stängd. Landning: PR #1921
<!-- SECTION:NOTES:END -->
