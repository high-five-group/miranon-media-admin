# ADR-026: Runtime-validering vid datagräns med Zod .parse()

- Status: Accepted
- Datum: 2026-05-11
- Fas: 2 (K0åe — "Direkt efter Fas 2"-fynd 2)

## Kontext

Zod-scheman har funnits parallellt med TypeScript-interface sedan Fas 1 (ADR-005). De skapades med uttalad avsikt att aktiveras runtime "i framtida adapter-anrop — Fas 2+" (ADR-005 Konsekvenser-Positivt). Trots det användes scheman fram till 2026-05-11 endast för compile-time-ekvivalens-tester (`AssertEqual<z.infer<typeof Schema>, Type>` i `src/domain/__tests__/schemas.assignable.ts`).

Codex' Fas-2-readiness-analys 2026-05-07 (`docs/analysis/Codex-project-analysis-2026-05-07.md` Blocker 4) bekräftade luckan: AirtableAdapter castar response till generics utan validering. Klient-sidan har därför ingen runtime-säkerhet för shape av Edge Function-svar — om servern returnerar drift (nytt fält, ändrad typ, oväntad null) propageras felet tyst tills en konsument kraschar djupare i koden.

Pre-Fas-2-verifieringen 2026-05-06 klassade fyndet som "Direkt efter Fas 2"-fynd 2 (kategori 2) — inte blockerande för routing/auth men måste lösas innan data-UI byggs i Fas 3. Marcus' beslut 2026-05-07 var att hantera alla 6 K0-åtgärder (3 startvillkor + 3 "Direkt efter Fas 2"-fynd) i Fas 2 K0 innan första route-fil i K2.

Sessionsdok 2026-05-11 Del 3.5 K0åe-noten flaggade tre öppna designval: `.parse()` vs `.safeParse()`, helper-abstraktion vs inline-mönster, error-mappning vid datagräns. Denna ADR låser besluten.

## Beslut

1. **Runtime-validering vid datagräns aktiveras via `.parse()` (throw), inte `.safeParse()` (Result-typ).**

2. **Callsite-pattern: generic ändras till `unknown`, schema-parse är inline per metod.**

```ts
   // FÖRE (typ-cast, ljuger för TS)
   const data = await callEdgeFunction<{ events: Event[] }>('get-events');
   return data.events;

   // EFTER (runtime-validerad, schema är enda sanningskällan)
   const data = await callEdgeFunction<{ events: unknown }>('get-events');
   return z.array(EventSchema).parse(data.events);
```

3. **Funktionssignatur `callEdgeFunction<T>` i `src/data/config/supabase-client.ts` rörs inte** — generic-bytet sker per callsite, inte i helper-signaturen.

4. **Inline-mönster gäller medan adapter har <5 data-returnerande callsites. Vid ≥5 callsites övervägs generisk helper** (`parseList<T>(schema: z.ZodType<T>, data: unknown[]): T[]`). K0åe.1 har 3 aktiva calls — inline-mönstret är KISS-rätt val.

5. **Stub-metoder (Edge Function ej deployad) får `@todo`-JSDoc istället för `.parse()`:**

```ts
   /**
    * @todo Apply Zod .parse() runtime validation when get-X Edge Function deploys.
    * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
    */
```

   `.parse()` aktiveras per stub vid EF-deploy (Fas 2.5 / Fas 6 sub-faser) när det finns en levande integrationsväg där validering faktiskt valideras mot riktig EF-output.

6. **Error-flöde uppströms: rå `ZodError` propageras genom Promise-rejection. Mappning till `AppError` defereras till Fas 3 UI-konsumtion** där error-strategi faktiskt synts mot levande TanStack Query-flöden och fel-renderings-mönster. Förtida mappning utan konsument är Y2K-mönster.

## Alternativ som övervägdes

1. **`.safeParse()` istället för `.parse()`.** Avvisat: ändrar return-type från `Promise<T[]>` till `Promise<T[] | ZodError>`-ish som kräver `if (!result.success)`-ceremoni på varje callsite. Bryter naturligt med TanStack Query error-flöde (Query catchar throws automatiskt → Suspense/ErrorBoundary, men behöver wrapper för Result-typer). Inkonsistent med Fas A serversidans throw-AppError-mönster.

2. **Generisk helper `parseList<T>(schema, data)` redan nu istället för inline.** Avvisat: KISS för 3 calls. Helper-tröskeln sätts till ≥5 calls i denna ADR — abstraktion vid liten N introducerar indirection utan motsvarande payoff.

3. **Funktionssignatur-ändring `<T = unknown>` i `callEdgeFunction`** istället för callsite-pattern. Avvisat: är defense-in-depth som hade hjälpt om någon framtida callsite glömmer generic — men 1) ingen sådan callsite finns idag, 2) signaturändring är scope-utvidgning från K0åe till `supabase-client.ts`, 3) callsite-pattern dokumenterat som norm i denna ADR är striktare än en svag signature-default.

4. **Retrofit alla 11 data-returnerande metoder (inkl. 8 stubs) istället för 3 aktiva + 8 JSDoc-todos.** Avvisat: `.parse()` på en metod som inte anropas är död kod med extra steg. När stubsen aktiveras vid EF-deploy i Fas 2.5/Fas 6 finns en levande integrationsväg där validering faktiskt verifieras mot riktig EF-output — det är då rätt tidpunkt för `.parse()`-aktivering per stub. JSDoc-`@todo` säkrar att framtida session inte glömmer.

5. **Mappa ZodError → AppError direkt i adaptern.** Avvisat: ingen UI-konsument finns ännu (Fas 3-arbete) som vet hur AppError ska renderas. Förtida mappning utan vetskap om receiving-end är spekulation.

## Konsekvenser

**Positivt:**

- Klient-sidan får runtime-typsäkerhet för data-gränsen mot Edge Functions. Drift mellan server och klient (nytt fält, ändrad typ, oväntad null) exponeras vid första data-fetch istället för att propageras tyst till djupare konsumenter.
- Zod-schema är ENDA sanningskälla för shape i klient-koden — TypeScript-typer härleds via `z.infer` (säkrat compile-time via `AssertEqual`-tester sedan ADR-005).
- ADR-005:s förutsedda Fas 2+-aktivering manifesteras — schemana är inte längre funktionellt dead code.
- Bundle-storlek oförändrad (Zod redan importerad från `domain/schemas/*.schema.ts` sedan Fas 1 för AssertEqual-test-typer; K0åe.1 återanvänder samma Zod-runtime).
- Konsistent med Fas A serversidans throw-mönster (operations-fel throw:as, auth-fel returnerar Response).
- Naturlig integration med TanStack Query error-boundary-flöde som etableras i Fas 2 K2-K3.

**Negativt:**

- Om Edge Function returnerar drift (ny field, fel typ, oväntad null), kastar adaptern `ZodError` vid första data-fetch. Fas 3 UI-konsumtion behöver hantera det — antingen via mappning till AppError eller via en användarvänlig fallback. Acceptabelt: drift-fynd är värdefulla, tyst propagation är inte.
- Stub-metoder har latent skuld — `@todo Apply Zod .parse()`-JSDoc markerar dem men kräver disciplin att läggs till `.parse()` vid EF-deploy. Mitigerat genom att JSDoc är synligt i editor-hover + ADR-026-referens i kommentar.
- Rå ZodError uppströms saknar lokaliseringsstöd (felmeddelanden är engelska Zod-strings). Fas 3-mappning till AppError kan introducera svensk användarvänlig text vid behov.

## Konvention för framtida adapters

- **SupabaseAdapter (Fas E)** följer samma mönster: `<{ X: unknown }>` callsite-generic + `z.array(Schema).parse(data.X)` inline.
- **Edge Function input-validering** (server-sidan) är separat scope — ADR-026 gäller klient-adapterns runtime-validering av server-OUTPUT. Server-sidans input-validering med Zod planeras i Fas 7 server-hardening (separat ADR vid aktualisering).
- **Tröskel för helper-abstraktion**: när någon adapter når ≥5 data-returnerande calls, skriv `parseList<T>(schema, data: unknown[]): T[]`-helper i `src/data/adapters/_shared/` och refactor:a callsites. Tröskeln gäller per adapter, inte aggregerat över alla adapters.

## Spårbarhet

- **Föregångare:** ADR-005 (Zod parallell-definitions, 2026-04-14) — etablerade scheman och förutsåg `.parse()`-aktivering i "Fas 2+".
- **Implementation:** commit `8095a62` (K0åe.1, 2026-05-11) — aktiverade `.parse()` i 3 aktiva fetch-metoder + lade `@todo`-JSDoc på 8 stubs.
- **Trigger:** Codex' Fas-2-readiness-analys 2026-05-07 (Blocker 4) + Pre-Fas-2-verifiering 2026-05-06 ("Direkt efter Fas 2"-fynd 2) + sessionsdok 2026-05-11 Del 3.5 K0åe-noten.
