# ADR-009: `supabase-client.ts` env-konsolidering via `@/env`

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

## Kontext

Två mekanismer för env-validering existerade efter Fas 0 + Fas 1-kopiering:

**1. Fas 0: `src/env.ts` (nytt, `[GA]`-tillägg)**

```ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
```

Importeras från `src/main.tsx` med sido-effekten att `createEnv` kraschar direkt vid uppstart om någon variabel saknas. Typad, validerad, en sanningskälla.

**2. Fas 1: kopierad `src/data/config/supabase-client.ts` (från Vue-repot)**

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}
```

Manuell defensiv kontroll från Vue-projektets era (innan Fas 0 existerade). Kastar ett generiskt Error med hårdkodad meddelandetext. Inte typad (både variabler är `string | undefined` innan kontrollen).

**Resultat av båda:** Samma variabel valideras två gånger, i två olika stilar, med två olika felmeddelanden. Om `VITE_SUPABASE_URL` saknas kraschar `src/env.ts` först vid `import './env'` i `main.tsx`. Den manuella kontrollen i `supabase-client.ts` körs aldrig — den är död kod som kan ruttna tyst.

## Beslut

**Konsolidera till en källa: `@/env`.**

Uppdatera `supabase-client.ts` att:

1. Importera `{ env } from '@/env'`
2. Ta bort `const supabaseUrl = import.meta.env.VITE_SUPABASE_URL`
3. Ta bort `if (!supabaseUrl || !supabaseAnonKey) { throw ... }`
4. Använd `env.VITE_SUPABASE_URL` + `env.VITE_SUPABASE_ANON_KEY` direkt i `createClient(...)` och `getAuthHeader()`-fallbacken

```ts
import { env } from '@/env';
// ...
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
```

Env-validering sker nu **en enda gång** — i `src/env.ts` vid app-uppstart. `supabase-client.ts` vet inget om validering, litar på att typerna är korrekta, och har en renare fil.

## Alternativ som övervägdes

**1. Behåll båda mekanismerna**

- **Fördelar:** Bokstavligen "kopieras rakt av" från Vue-repot.
- **Nackdelar:** Död kod (den manuella kontrollen körs aldrig). Dubbelt underhåll (ändras env-schemat måste båda uppdateras). Konsumenter av `supabase-client.ts` måste fortfarande hantera typer som `string | undefined`, vilket tvingar defensive checks eller `!`-asserts.

**2. Ta bort `src/env.ts`, behåll bara den manuella kontrollen**

- **Fördelar:** Färre filer.
- **Nackdelar:** Förlorar Zod-validering (t.ex. `z.string().url()` fångar "abc" men `typeof x === 'string'` gör det inte). Förlorar typsäkerhet — `env.VITE_SUPABASE_URL` är `string` (inte `string | undefined`). Förlorar `[GA]`-kravet från gap-analysen.

**3. Importera `import.meta.env` i `supabase-client.ts` utan kontroll**

- **Fördelar:** Minst kod.
- **Nackdelar:** `import.meta.env.VITE_SUPABASE_URL` är fortfarande `string | undefined` i TypeScript — vi skulle behöva `!`-asserts överallt. Och om env-validering tas bort helt förlorar vi fördelarna med `@t3-oss/env-core`.

## Konsekvenser

**Positivt:**

- En sanningskälla för env-variabler: `src/env.ts`
- Typer i `supabase-client.ts` är `string` (inte `string | undefined`) eftersom Zod-schemat garanterar det
- Ingen död kod
- Ändras env-schemat (t.ex. lägg till `VITE_SENTRY_DSN` i Fas 7) uppdateras bara `src/env.ts`
- `supabase-client.ts` är renare och mer fokuserad på sin kärnuppgift (edge function invocation)

**Negativt:**

- Avviker från "kopieras rakt av"-garantin från conversion-plan §C — `supabase-client.ts` har en meningsfull ändring utöver blot-kopieringen
- Första fil utanför `domain/models/` och `domain/types/` som har modifikationer jämfört med Vue-originalet. Skapar precedens: om framtida fils-kopieringar kräver modifikationer måste de också dokumenteras

**Uppströms-implikation:**

- Vue-repot har fortfarande sin egen manuella kontroll i `supabase-client.ts`. Om vi senare behöver synka tillbaka någon fix kommer diffen inkludera denna modifikation — inte svår att hantera men värt att veta.

## Referenser

- `src/env.ts` — den konsoliderade env-valideringen
- `src/data/config/supabase-client.ts` — den modifierade kopian
- [ADR-006](ADR-006-fetch-with-retry-infrastructure.md) — relaterad modifiering av samma fil (fetchWithRetry)
- `docs/gap-analysis.md` §GA-7 — motiveringen bakom `@t3-oss/env-core`
