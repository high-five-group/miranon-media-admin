# ADR-005: Zod parallella definitioner (schema bredvid interface)

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 1

## Kontext

Fas 1 introducerade Zod-scheman som `[GA]`-tillägg för runtime-validering av Airtable/Edge-Function-svar vid systemgränsen. Frågan: **ska schemat vara sanningskälla för typen, eller ska interfacet förbli det?**

Två mönster används i TypeScript-ekosystemet:

**A. Schema-som-sanningskälla (`z.infer<typeof EventSchema>`):**

```ts
// schemas/Event.schema.ts
export const EventSchema = z.object({ id: z.string(), /* ... */ });
export type Event = z.infer<typeof EventSchema>;

// models/Event.ts
export type { Event } from '../schemas/Event.schema';
```

**B. Parallella definitioner (interface + schema, båda sanningskällor):**

```ts
// models/Event.ts
export interface Event { id: string; /* ... */ }

// schemas/Event.schema.ts
export const EventSchema = z.object({ id: z.string(), /* ... */ });
```

Conversion-plan §C markerade `src/domain/models/*.ts` som **"🟢 KOPIERAS RAKT AV"** — ingen ändring. Att ändra interface till `export type { Event } from ...` skulle bryta den garantin.

## Beslut

Använd **parallella definitioner** (alternativ B) i Fas 1, med ett compile-time-test som garanterar strukturell jämlikhet:

1. Interface i `src/domain/models/Event.ts` kopieras rakt av från Vue-repot — noll ändringar
2. Schema i `src/domain/schemas/Event.schema.ts` skrivs som ett självständigt `z.object({ ... })`
3. Compile-time-testet i `src/domain/__tests__/schemas.assignable.ts` använder en `AssertEqual`-hjälptyp för att verifiera att `z.infer<typeof EventSchema>` är strukturellt identisk med `Event`-interfacet:

```ts
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const _event: AssertEqual<z.infer<typeof EventSchema>, Event> = true;
```

Om någon ändrar antingen schemat eller interfacet så de divergerar, får vi ett TS-fel vid `tsc --noEmit` — före commit, via pre-commit-hooken.

**Refaktorering till schema-som-sanningskälla skjuts upp till Fas 2/3** när vi ändå rör domain-filer för att lägga på branded types, discriminated unions för status, och andra förbättringar.

## Alternativ som övervägdes

**1. Schema-som-sanningskälla direkt i Fas 1**

- **Fördelar:** En sanningskälla, ingen duplicering, Zod definierar både runtime-validering och compile-time-typ i samma uttryck.
- **Nackdelar:** Bryter "kopieras rakt av"-garantin från conversion-plan. Ändringen kräver att `models/Event.ts` blir `export type { Event } from '../schemas/...'` vilket är en semantisk förändring, inte bara kopiering. Skulle blanda Fas 1-copy-pasting med Fas 2-refaktorering och förvirra commits.

**2. Bara interface, ingen Zod**

- **Fördelar:** Enklast, noll nya filer.
- **Nackdelar:** Gap-analysen §GA-5 identifierade avsaknaden av runtime-validering som en av tre blindfläckar i conversion-plan. Airtable-API är löst typat; utan Zod litar vi på att TypeScript-typen är sann — vilket den inte är om Airtable ändrar kolumn, om Edge Function har en bugg, eller om API-svaret mutilerats av en nätverks-proxy.

**3. Manuell run-time-validering (utan Zod)**

- **Fördelar:** Ingen ny dep.
- **Nackdelar:** 8 × ~20-rads validatorfunktioner = 160 rader handskriven kod med samma fel-prone som Airtable-schemaändringar försöker fånga. Zod löser detta på 8 × ~20 rader deklarativ kod som aldrig divergerar från schemat.

## Konsekvenser

**Positivt:**

- Interface i `domain/models/` är identiskt med Vue-repots version — `git diff` mellan repos visar noll skillnader i dessa filer
- Runtime-validering finns och används (via `EventSchema.parse()` i framtida adapter-anrop — Fas 2+)
- Compile-time-testet `AssertEqual` fångar divergenser **dubbelriktat**: om schemat har ett fält som interfacet saknar, eller tvärtom, blir `AssertEqual<...>` `false` → TS-fel vid `tsc --noEmit`
- Refaktorering är tydligt uppskjuten och dokumenterad

**Negativt:**

- Dubbel underhållsyta — ändras ett fält i Airtable måste **både** interfacet och schemat uppdateras
- `AssertEqual`-testet skyddar mot divergens men hindrar inte att båda uppdateras samtidigt till ett felaktigt värde
- Teknisk skuld: refaktorering till schema-som-sanningskälla i Fas 2/3

**Bekräftat i Fas 1-verifiering:**

- Alla 10 `AssertEqual`-påståenden kompilerar (Attendance, Engagement, Event, Lead, MailPayload, BulkMail, MailLogEntry, Person, Registration, WaitlistEntry)
- `EventSchema.parse({})` kastar `ZodError` — verifierat runtime via `scripts/verify-phase-1.ts`

## Referenser

- `src/domain/models/` — interfaces (kopierade rakt av)
- `src/domain/schemas/` — scheman
- `src/domain/__tests__/schemas.assignable.ts` — compile-time assertion-test
- `scripts/verify-phase-1.ts` — runtime-verifiering av `parse({})` kraschar
- `docs/logs/gap-analysis.md` §GA-5 — motiveringen bakom `[GA]`-markeringen
