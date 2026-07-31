
# ADR-010: Biome-exkludering för Deno Edge Functions

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

> **Korrigering (ADR-036, 2026-05-27):** Påståendena nedan att pre-commit-hooken kör `biome check . && tsc --noEmit` och skulle blockera commits (Alternativ #5, Konsekvenser "Pre-commit-hooken är snabbare …") är felaktiga. `hooks.pre-commit` i `.claude/settings.json` var dead config och kördes aldrig — empiriskt bevisat Session 7 K0.1b. CI är den mekaniska kvalitetsgrinden. Se [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md). Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

`supabase/functions/*/index.ts` är Supabase Edge Functions som körs i **Deno**, inte Node. Deno-kod har några fundamentala skillnader från Node/Vite-kod:

**1. URL-baserade imports:**

```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

TypeScript/Biome i Node-kontext förstår inte `https://` som modul-specifier — de tolkar dem som relativa paths och försöker resolva på disk.

**2. Deno-globaler:**

```ts
Deno.env.get('SUPABASE_URL')!
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
```

`Deno` är inte definierat i Node/DOM-typer. TypeScript-kompilering i React-repot skulle kasta `Cannot find name 'Deno'`.

**3. Non-null assertions på `env.get(...)`:**

Deno:s `env.get()` returnerar `string | undefined`. Deno-konventionen är att använda `!` när man är säker på att variabeln finns. Biomes `noNonNullAssertion`-regel flaggar detta som fel.

**4. Bracket-notation för dynamiska keys:**

`record.fields['Namn']` är idiomatiskt i Deno/Airtable-API-integration där fältnamnen kommer från user-space. Biomes `useLiteralKeys`-regel rekommenderar `record.fields.Namn` — som inte fungerar för dynamiska keys.

Fas 1 kopierade 7 Edge Functions rakt av från Vue-repot (via `cp`). När Biome kördes producerade den **24+ fel och warnings** i `supabase/functions/` — alla falska positiva eftersom Biomes regeluppsättning inte känner till Deno-kontexten.

## Beslut

**Exkludera `supabase/functions` från Biomes `includes`:**

```json
// biome.json
{
  "files": {
    "includes": [
      "**",
      "!node_modules",
      "!dist",
      "!**/routeTree.gen.ts",
      "!supabase/functions"
    ]
  }
}
```

Edge Functions ska lintas av **Deno eget verktyg** (`deno lint`, `deno fmt`, `deno check`) — separat körning, separat konfiguration, separat pre-commit-hook vid behov. Detta hanteras i Fas 7 (deploy-pipeline) när vi formaliserar Edge Function-deploy.

Noteringar om syntax: Biome 2.2+ vill ha `!supabase/functions` utan trailing `/**`. Regeln `useBiomeIgnoreFolder` (nursery) föreslog själv den korrekta syntaxen via fixable diagnostic.

## Alternativ som övervägdes

### 1. Disable specifika Biome-regler globalt

<!-- vale Vale.Terms = NO -->
- **Fördelar:** Behåller supabase-filer i lint-scope.
<!-- vale Vale.Terms = YES -->
- **Nackdelar:** Disable av `noNonNullAssertion` och `useLiteralKeys` skulle tillåta samma problem i React-koden (där vi **vill** ha dem aktiva). Regler är projekt-globala, inte per-directory i Biome 2.4.

**2. `overrides` per path i `biome.json`**

- **Fördelar:** Låter oss disable specifika regler bara för `supabase/functions`.
- **Nackdelar:** Biome 2.x `overrides`-syntax är inte lika mogen som ESLints. Dessutom skulle vi fortfarande ha `Cannot find name 'Deno'`-fel från TypeScript-checkern (som inte är styrd av Biome). Partial solution.

**3. Konfigurera TypeScript med `typeRoots: ["@types/deno"]`**

- **Fördelar:** Låter `Deno`-globalen vara känd.
- **Nackdelar:** Blandar Node och Deno-typer i samma tsconfig. `fetch()`-signaturen skiljer sig mellan dem. Kompileringstid och komplexitet ökar. Supabase Edge Functions har egen build-pipeline hos Supabase — vi kompilerar dem inte lokalt.

**4. Separat `tsconfig.deno.json` för `supabase/functions/`**

- **Fördelar:** Clean separation.
- **Nackdelar:** Kräver att vi kör tsc med två configs, vilket bryter vårt `tsc -b`-flöde. Och Biome skulle fortfarande klaga på style-reglerna.

<!-- markdownlint-disable-next-line MD036 -- alternativ-rubrikformen är ADR-originaltext; flaggan uppstod först vid markdownlint-bumpen i S67 dependabot-passet (skärpt MD036-heuristik på orörd rad) -->
**5. Ignorera lintfel och commit:a ändå**

- **Fördelar:** Noll ändringar.
- **Nackdelar:** Pre-commit-hooken i `.claude/settings.json` kör `biome check . && tsc --noEmit` — felen skulle blockera varje commit. Inte ett alternativ.

## Konsekvenser

**Positivt:**

- `biome check .` passerar clean (exit=0) på Fas 1
- React-koden har alla striktare regler aktiva (`noNonNullAssertion`, `useLiteralKeys`, `useSortedClasses`, etc.)
- Supabase Edge Functions är framework-agnostiska (Deno) och kopieras rakt av utan modifikation — viktigt för att kunna synka tillbaka till Vue-repot vid behov
- Pre-commit-hooken är snabbare eftersom 7 filer färre att lintas

**Negativt:**

<!-- vale Vale.Terms = NO -->
- Vi har ingen automatiserad lint av supabase-filer alls i Fas 1. Om en edge function har en syntax-bugg märks det först när den deploys till Supabase och kraschar runtime.
<!-- vale Vale.Terms = YES -->
- Fas 7 måste lägga på `deno lint`/`deno check` i deploy-pipelinen. Teknisk skuld tydligt uppskjuten men inte glömd.

**Fas 7-åtagande:**

- Installera Deno CLI som dev-dep (eller via devcontainer)
- Lägg till `deno check supabase/functions/**/*.ts` i pre-commit-hooken
- Lägg till `deno lint supabase/functions/` i CI
- Lägg till `deno fmt supabase/functions/` i format-flödet

## Referenser

- `biome.json` — den faktiska exkluderingen
- `supabase/functions/**` — Deno-kod (kopierad rakt av från Vue-repot)
- [ADR-001](ADR-001-biome-over-eslint-stylelint-prettier.md) — kontext för Biome-valet
- Biome `useBiomeIgnoreFolder` rule (nursery) — syntaxvägledningen

## Updates

### 2026-07-31 — Två premisser mätt falska; beslutet står, på andra ben (S91 Del 38, `TASK-103`)

`TASK-103`-researchen körde repots egen Biome **2.5.4** mot de 39 Deno-filerna
med exkluderingen borttagen (scratchpad-config; `biome.json` orörd). Två
påståenden i texten ovan höll inte mot mätningen, och rivs här öppet i stället
för tyst:

**Premiss 1 — att Biome tolkar `https:`-imports som relativa paths och
försöker resolva på disk (Kontext punkt 1).** Falsifierad för Biome: alla 39
filer parsades utan ett enda fel, och **inga** diagnostiker gällde
`https:`-importerna eller `Deno`-globalen — Biome resolvar inte imports alls i
det här läget. TypeScript-halvan av samma mening står däremot kvar:
`airtable-client.ts` utanför alla `tsconfig`-program ger 7×
`TS2304: Cannot find name 'Deno'`, mätt med sond. Om påståendet höll för
beslutsdagens Biome-version är inte omprövat; för 2.5.4 är det falskt.

**Premiss 2 — att alternativ 2 föll på att "Biome 2.x `overrides`-syntax är
inte lika mogen som ESLints".** Falsifierad: en `overrides`-post med
`includes: ["**/supabase/functions/**"]` som stänger `useLiteralKeys` +
`noNonNullAssertion` tar bort 143 infos och 2 warnings, exakt som avsett.
Avfärdandets andra halva står: Biome typkontrollerar inte, så
`Cannot find name 'Deno'`-klassen löses inte av `overrides` — den löses av att
`deno check` gör jobbet.

**Beslutet rivs INTE — men det bär idag på andra ben än de två ovan.** Samma
pass belade att exkluderingen är det etablerade mönstret (Supabase CLI
scaffoldar själv skiljelinjen vid `supabase init`; samtliga fem precedent-repon
i passet gör samma sak), och att Biome strukturellt saknar Deno-domänen: ingen
typkontroll, ingen modulgraf, inga Deno-specifika regler. Det öppna hålet är
oförändrat Fas 7-åtagandet — Denos halva av grinden (`deno lint` +
`deno check`) är fortfarande inte kopplad, så de 39 filerna grindas av
ingenting.

Mätningarna och precedenterna:
[`task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md`](../research/task-103-deno-verktygskedjan-i-node-repo-2026-07-31.md)
§ 5 (landad `4181cbe`); falsifieringen bokförd i S91:s nittonde paus-block.
Beslutstexten ovan bevaras oförändrad (immutabilitet).
