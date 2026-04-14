# ADR-006: `fetchWithRetry` på infrastrukturnivå (i `callEdgeFunction`)

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

## Kontext

Gap-analysen §GA-6 identifierade **nätverksresiliens** som en av tre blindfläckar i original-conversion-plan: utan retry-logik går hela appen ner om Airtable-API:n får ett tillfälligt 5xx, eller om Supabase Edge Functions stacken har en CDN-hick. `[GA]`-prompten för Fas 1 specificerade:

> `src/data/adapters/utils.ts` (`fetchWithRetry()`: 3 retries, exponential backoff 200ms→400ms→800ms, jitter. Används i alla adapter-metoder)

Två oklarheter i denna formulering:

**1. Var ska filen ligga?**

`src/data/adapters/utils.ts` skapar ett cirkulärt problem. `AirtableAdapter` använder inte `fetch()` direkt — den använder `callEdgeFunction` från `src/data/config/supabase-client.ts`. Om `supabase-client.ts` ska använda `fetchWithRetry`, måste den importera från `../adapters/utils` — vilket skapar `config/` → `adapters/` kors-beroende. Fel riktning: `config/` är närmare infrastrukturen, `adapters/` är affärslogik.

**2. Hur ska den användas?**

"Används i alla adapter-metoder" kan tolkas två sätt:
- **(a)** Varje adapter-metod anropar `fetchWithRetry` direkt. Retry-kunskap sprids över alla adapters.
- **(b)** `callEdgeFunction`/`postEdgeFunction` använder `fetchWithRetry` internt. Adapters är ovetande om retry.

## Beslut

**Placering:** `src/data/utils.ts` (neutral plats mellan `adapters/` och `config/`).

**Användning:** Injiceras i `callEdgeFunction` och `postEdgeFunction` i `src/data/config/supabase-client.ts`. Adapters är ovetande om retry-logiken.

```ts
// src/data/config/supabase-client.ts
import { fetchWithRetry } from '../utils';

export async function callEdgeFunction<T>(name, params) {
  // ...
  const res = await fetchWithRetry(url, { headers: { ... } });
  // ...
}
```

Adapters fortsätter anropa `callEdgeFunction` som tidigare — de får retry "gratis" utan att deras kod förändras.

**Retry-strategi:**

- `maxRetries = 3` (totalt 4 försök: 1 initialt + 3 retries)
- Exponentiell backoff: `baseDelay * 2^attempt` → 200ms, 400ms, 800ms
- Jitter: `+ Math.random() * (baseDelay / 2)` → 0–100ms spridning
- 5xx-status → retry; 4xx → propagera direkt; nätverksfel (fetch throw) → retry
- Injicerbar `fetchImpl` + `sleep` för test

## Alternativ som övervägdes

**1. Placera i `src/data/adapters/utils.ts`, adapters anropar direkt**

- **Fördelar:** Följer prompten bokstavligt.
- **Nackdelar:** Varje adapter-metod måste wrappa `callEdgeFunction` i `fetchWithRetry` (eller dubblera URL-byggandet och anropa `fetchWithRetry` direkt). Retry-policy är spridd över `AirtableAdapter`, `SupabaseAdapter`, och framtida adapters — samma retry-count, backoff, jitter måste dupliceras. Ändras retry-policyn (t.ex. öka till 5 retries vid produktionsincident), måste N filer röras.

**2. Placera i `src/data/adapters/utils.ts`, importeras av `supabase-client.ts`**

- **Fördelar:** Följer promptens sökväg.
- **Nackdelar:** Skapar korssberoende `config/` → `adapters/` som är semantiskt bakvänt. Cirkelrisk om fler filer börjar importera över gränsen.

**3. Lägga retry-logik direkt i `callEdgeFunction` utan en separat utility**

- **Fördelar:** Minst kod, ingen extra fil.
- **Nackdelar:** `fetchWithRetry` är återanvändbart — det finns scenarier i framtida faser där vi vill retrya externa anrop som inte går via Edge Functions (t.ex. direkta Airtable REST-anrop i Fas 8, web-vitals-rapportering i Fas 7). Extraherad utility är värd sitt utrymme.

**4. Använd ett existerande bibliotek (p-retry, async-retry)**

- **Fördelar:** Välbeprövat, mer features.
- **Nackdelar:** Ny dep för 65 rader logik. Vår egen implementation är injicerbar för test (vilket p-retry inte är out-of-the-box) och har exakt den strategi vi behöver.

## Konsekvenser

**Positivt:**

- `AirtableAdapter` och framtida adapters vet ingenting om retry — de anropar `callEdgeFunction` som om det vore raw fetch
- Ändras retry-policy (t.ex. justera baseDelay) uppdateras **en** plats: `supabase-client.ts` (eller `utils.ts` om vi ändrar defaults)
- `fetchImpl` + `sleep` är injicerbara → runtime-verifiering i `scripts/verify-phase-1.ts` mockar fetch och mäter backoff exakt (200–300ms, 400–500ms, 800–900ms)
- Inget cirkulärt beroende: `data/config/` → `data/utils.ts` är enkelriktat

**Negativt:**

- Avviker från promptens ordagranna text (`src/data/adapters/utils.ts`). Motiveringen dokumenterad här.
- `AirtableAdapter` har ingen mekanism att opt-out från retry för specifika anrop. Om vi senare behöver t.ex. "validera session utan retry" måste vi exponera `fetchWithoutRetry` eller en `{ retry: false }`-option. Lämnas för framtida behov.

**Runtime-verifierat i Fas 1:**

- 4 försök (1 + 3 retries) ✅
- Backoff: försök 1→2 sov 200–300ms, 2→3 sov 400–500ms, 3→4 sov 800–900ms ✅
- Fel propageras efter sista försöket ✅
- Alla 6 påståenden i `scripts/verify-phase-1.ts` [2] passerar

## Referenser

- `src/data/utils.ts` — implementationen
- `src/data/config/supabase-client.ts` — integrationen
- `scripts/verify-phase-1.ts` — runtime-verifieringen
- `docs/gap-analysis.md` §GA-6 — motiveringen bakom `[GA]`-markeringen
