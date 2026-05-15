# Gap-analys — Konverteringsplan vs. Beyond Best Practices Research

*Kritisk granskning | 2026-04-06*
*Granskare: Claude Code (Opus 4.6)*
*Underlag: conversion-plan.md, DESIGN-MANIFESTO.md, DESIGN-OPERATING-SYSTEM.md, DESIGN-SYSTEM-SPEC.md, beyond-best-practices-2026.md*

---

## Del 1: Fasbetyg

---

## Fas 0: Projektsetup + Tokens

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 7/11**

### Vad fasen gör bra

Token-arkitekturen i tre lager (primitiv → semantisk → komponent) är förstklassig. Regeln "en komponent får aldrig referera en primitiv token" är exakt rätt och saknas i de flesta projekt. Lint-konfigurationen med `tailwindcss/no-arbitrary-value` som skyddslager är genomtänkt. Playwright-config från start visar att visuell regression tas på allvar. Fokusregel (`*:focus:not(:focus-visible)`) som global singel regel är en bevisad lärdom (lessons.md: "Lappa inte — riv och bygg en regel").

### Vad som saknas för 11/11

**1. Byggtooling: ESLint istället för Biome.**
Research §4.5 visar att Biome är 42-65x snabbare än ESLint+Prettier och ersätter båda med ett verktyg. Planen specificerar ESLint + separat Stylelint — det är 2024-stack, inte 2026. Biome 2.0 har Tailwind-plugin-stöd. Ett soloprojekt med AI-assistens bör minimera verktygsunderhåll.

**2. Säkerhet: noll säkerhetsinfrastruktur från dag ett.**
Research §6.1 visar att CSP måste konfigureras från start — att lägga till det i efterhand är exponentiellt svårare. Ingen `Content-Security-Policy` header definieras. Inga säkerhetsheaders (`Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options`). Inga Trusted Types (§6.2). Ingen supply chain-strategi (§6.5: lockfile-verifiering, `npm audit` i CI).

**3. Performance: ingen budget definierad.**
Research §2.4 definierar INP <200ms som "bra". Planen definierar aldrig en performance-budget (FCP, LCP, INP, CLS). Utan budget kan man inte mäta om man lyckas. Apple definierar performance-budgets *innan* första raden kod.

**4. Observability: noll.**
Research §5.5 rekommenderar OpenTelemetry-setup från dag ett. Ingen strukturerad loggning. Ingen error tracking-integration (Sentry/Grafana Faro). Planen förlitar sig på `console.log` och DevTools.

**5. Offline-skelett: saknas.**
Research §5.1 rekommenderar service worker-registrering från start (även om funktionaliteten kommer senare). Att lägga till service workers retroaktivt skapar problem med caching-strategier. Ett `registerSW()` skelett i Fas 0 kostar 5 minuter och sparar dagar.

### Åtgärdsplan

1. Byt ESLint+Stylelint → Biome 2.0 med Tailwind-plugin. En config-fil, ett kommando: `biome check --write .` (research §4.5).
2. Skapa `vite.config.ts` med security headers-plugin. Definiera CSP-nonce-generering redan nu.
3. Skapa `docs/specs/PERFORMANCE-BUDGET.md`: FCP <1.5s, LCP <2.5s, INP <200ms, CLS <0.1. Mät med `web-vitals` npm-paket.
4. Installera `@sentry/react` eller `@grafana/faro-web-sdk` som observability-grund. Konfigureras minimalt nu, utökas i Fas 7.
5. Skapa `public/sw.js` skelett (tom, men registrerad). Utökas med Workbox i Fas 5.
6. Lägg till `npm audit --audit-level=high` som preinstall-hook. Committa `package-lock.json`.

### Apple-kommentar

Apples team sätter upp performance-dashboards och error tracking *innan de skriver en enda komponent*. De vet att mätning driver beteende — om du inte mäter INP dag 1 kommer du inte bry dig om det dag 50. De har också en säkerhetsarkitekt som signerar av CSP-policy innan projektet får en URL. Det appen saknar är inte verktyg — det är att infrastrukturen för kvalitetssäkring behandlas som en eftertanke istället för en förutsättning.

---

## Fas 1: Domäntransplant

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 8/11**

### Vad fasen gör bra

Ren separation mellan domain (TypeScript-interfaces), data (adapters), och presentation (Vue/React). Att 23 filer kopieras utan ändring bevisar att arkitekturen är framework-agnostisk — exakt vad DataSourceAdapter-mönstret designades för. Verifieringssteget (`tsc --noEmit`) fångar typfel tidigt.

### Vad som saknas för 11/11

**1. Ingen Zod-validering vid systemgränser.**
Research §4.2: "Validera bara vid systemgränser (user input, external APIs)". AirtableAdapter tar emot JSON från Airtable REST API — en extern systemgräns. Idag castats svaret till `Event[]` utan runtime-verifiering. Ett `EventSchema` med Zod som validerar API-svaret fångar Airtable-schemaändringar vid runtime istället för att producera `undefined`-buggar i UI:t.

**2. Adapter utan resilience.**
Research §5.6: retry med exponential backoff, circuit breaker. `AirtableAdapter.fetchEvents()` gör en enda `fetch()`. Om Airtable är nere → okänt beteende. Airtable rate-limitar vid 5 req/s. Adaptern har ingen retry-logik, ingen backoff, inget felmeddelande anpassat för Lotta.

**3. Type-safe miljövariabler saknas.**
Research §4.2: t3-env. `import.meta.env.VITE_SUPABASE_URL` är en `string | undefined`. Appen kraschar vid runtime om variabeln saknas, inte vid build.

### Åtgärdsplan

1. Installera `zod`. Skapa `domain/schemas/event.schema.ts` med `EventSchema = z.object({...})`. Validera i AirtableAdapter: `EventSchema.parse(response)`.
2. Implementera `fetchWithRetry()` i `data/adapters/utils.ts`: 3 retries, exponential backoff (200ms → 400ms → 800ms), jitter. Använd i alla adapter-metoder.
3. Installera `@t3-oss/env-core`. Skapa `src/env.ts` som validerar `VITE_SUPABASE_URL` (z.string().url()) och `VITE_SUPABASE_ANON_KEY` (z.string().min(1)).

### Apple-kommentar

Apple validerar varje byte som kommer in i appen. Inte för att de misstror sina servrar — utan för att de vet att gränssnittet mellan system är där buggar lever. En adapter utan retry-logik är som en nätverkskabel utan shielding: den fungerar perfekt under idealförhållanden och faller samman under verkliga.

---

## Fas 2: Routing + Auth

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 6/11**

### Vad fasen gör bra

TanStack Router med type-safe search params och Zod-validering är rätt val (research §3.6: "URL som state är undervärderat"). Auth guard med `beforeLoad` redirect är standard men korrekt. Separata providers (Auth, DataSource, Query) förhindrar onödiga re-renders (research §H.4).

### Vad som saknas för 11/11

**1. Ingen URL-state-strategi.**
Research §3.6: nuqs (type-safe search params) som state management. Planen nämner TanStack Routers search params men definierar aldrig *vilken* state som lever i URL:en. Lottas filter, sortering, aktiv flik, sökterm — allt detta bör vara URL-state så att: (a) Back-knappen fungerar, (b) Lotta kan bokmärka en filtrerad vy, (c) Roger kan skicka en länk till exakt det Lotta ser. Planen saknar ett `URL_STATE_SPEC.md`.

**2. Ingen passkey-strategi.**
Research §6.4: Passkeys hade 412% tillväxt 2025, WebAuthn är branschstandard. Planen använder Supabase `signInWithPassword` — email+lösenord. Lotta behöver inte komma ihåg ett lösenord. Passkeys via biometrisk autentisering (FaceID/TouchID) eliminerar hennes rädsla "att göra fel vid inloggning". Supabase stödjer WebAuthn via `supabase.auth.signInWithPasskey()` (experimentellt 2026).

**3. Ingen offline-auth.**
Research §5.1: service worker + offline fallback. Om Lotta är på event-plats utan stabil uppkoppling och appen kräver auth-check vid varje navigering → blank skärm. Minimum: cachad auth-session med TTL.

**4. Ingen CSRF/redirect-attack-prevention.**
Research §6.4: OAuth 2.1, state-parameter. Supabase auth hanterar PKCE internt, men det nämns inte i planen. Ingen explicit `state`-verifiering vid OAuth-flows.

**5. Ingen preload-strategi.**
Research §2.2: Speculation Rules API. TanStack Router har `preload="intent"` men planen nämner det bara i förbigående (rad 44). Det borde vara en explicit konfiguration: alla `<Link>` i tab bar prefetchar vid hover.

### Åtgärdsplan

1. Skapa `docs/specs/URL-STATE-SPEC.md`: Definiera vilken state som lever i URL per vy. Hem: ingen. Event: `?status=upcoming&sort=date`. Personer: `?q=sökterm&page=2`. Event-detalj: `?tab=payments`.
2. Installera `nuqs`. Använd i Event-fliken (Fas 6) för filter/sort. Research §3.6 visar att nuqs + TanStack Query ger "perfekt" URL-state.
3. Lägg till passkey som framtida fas (Fas 8). Dokumentera i konverteringsplanen. Implementera inte nu, men designa LoginView med utrymme för "Logga in med passkey"-knapp.
4. Konfigurera `preload="intent"` på alla tab bar-länkar i Fas 5.
5. Lägg till auth-state caching i localStorage med 1h TTL. Vid offline: visa senast cachade auth utan server-roundtrip.

### Apple-kommentar

Apple lanserade aldrig en app med lösenordsbaserad inloggning efter 2023. FaceID/TouchID → passkey → done. Deras inloggningsflöde är *osynligt*. Skillnaden mellan "skriv email + lösenord + tryck logga in" och "öppna appen → FaceID → inne" är skillnaden mellan "bra app" och "magi". Lottas rädsla "att inte förstå" börjar vid inloggningen — varje steg du tar bort där multipliceras genom hela upplevelsen.

---

## Fas 3: UI-primitiver

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 8/11**

### Vad fasen gör bra

React Aria är det bästa valet i ekosystemet (research §1.4 bekräftar Adobe Spectrums underhåll). 21st Component Pipeline (5 steg: FK-research → plan → 21st-prompt → val → integration) är kreativt och unikt — inget annat projekt jag sett genererar 5 visuellt distinkta varianter per komponent innan implementation. CVA för type-safe varianter och `cn()` helper är branschstandard. Lotta-kontexten per komponent ("MmButton: Lottas viktigaste interaktionspunkt") är precis den typ av beteendedriven design som Operating System §I kräver.

### Vad som saknas för 11/11

**1. Ingen View Transitions API.**
Research §2.3: Nativa GPU-accelererade övergångar vid navigering. Planen specificerar "noll animation" (FK-designriktning), men View Transitions är inte animation — det är *kontinuitet*. När Lotta klickar på ett event i listan och det "expanderar" till detaljsidan (via `view-transition-name`) behåller hon kontexten. Utan det: flash av vit skärm → ny sida → kognitiv belastning ("var tog det vägen?").

**2. Ingen Speculation Rules API.**
Research §2.2: Prefetcha nästa sida innan Lotta klickar. FK:s app prefetchar sannolikt internt. Planen nämner `preload="intent"` på TanStack Router men inte Speculation Rules som ger *prerender* (inte bara prefetch).

**3. ARIA 1.3 inte adresserat.**
Research §7.1: Nya attribut (`aria-description`, `aria-errormessage`, `aria-keyshortcuts`) som förbättrar upplevelsen. Planen refererar WCAG 2.2 AA men nämner aldrig ARIA 1.3-specifika förbättringar.

**4. Kognitiv tillgänglighet ytlig.**
Research §7.2: 10 WCAG 2.2-kriterier specifikt för neurodivergenta användare. Planen hanterar `prefers-reduced-motion` och `prefers-contrast:more` men saknar: tidsjusterbar timeout (§7.2 punkt 2), pausa/stoppa-kontroller (punkt 3), fokus-inte-dolt (punkt 4), drag-rörelser-alternativ (punkt 5), och målstorlek-verifiering (punkt 6). Lotta kanske inte är neurodivergent, men EAA (§7.5) kräver det.

**5. Ingen komponent-dokumentation-standard.**
Research §4.3: CLAUDE.md som projektkonstitution. Planen specificerar att Vue-README:er elimineras (sektion C: ⚪ ELIMINERAS) men definierar inte *vad som ersätter dem*. 11/11/11-komponenter utan Storybook eller JSDoc-dokumentation minskar i värde vid framtida återanvändning.

### Åtgärdsplan

1. Implementera View Transitions i Fas 5 (app-shell): `startViewTransition()` vid tab-byte. CSS: `@view-transition { navigation: auto; }`. Research §2.3 visar att Next.js 15+ och Astro har inbyggt stöd — Vite SPA kräver manuell implementation via React 19 `useTransition`.
2. Skapa `docs/specs/ARIA-UPGRADE.md`: Lista ARIA 1.3-attribut som ska implementeras per komponent. `aria-errormessage` på alla formulärfält. `aria-description` på knappar med kontextuellt beteende.
3. Lägg till EAA-checklista i auditprocessen (Fas 7). Research §7.5: EAA trädde i kraft 28 juni 2025, böter upp till 100k EUR.
4. Definiera komponent-dokumentationsstandard: JSDoc på alla exported props + `@example` i varje komponent-fil.

### Apple-kommentar

Apple bygger aldrig en UI-komponent utan att först definiera dess *animeringskontrakt* — hur den kommer in, hur den går ut, och hur den relaterar till sina grannar. View Transitions är inte "fancy animation" — det är *spatial memory*. När Lottas hjärna ser att event-kortet i listan "blir" detaljsidan (via en shared element transition) slipper hennes arbetsminne arbeta för att koppla ihop de två vyerna. Apple kallar detta "spatial continuity" och det är obligatoriskt i alla iOS-appar sedan iOS 16. Att planen explicit förbjuder animation men inte definierar *kontinuitet* är en blind fläck.

---

## Fas 5: App-shell + Tab bar

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 7/11**

### Vad fasen gör bra

Skip-link, route announcer, `prefers-reduced-motion`, `prefers-contrast:more`, print (tab bar gömd), safe-area-inset-bottom, centrerad kolumn (max-width 600px), responsivt 375px/768px/1024px — allt detta visar att tillgänglighet och adaptiv design tas på allvar. Orsakskedjan ("rädsla att inte förstå → om det är 4 flikar har vi motbevisat den") är exakt den typ av beteendedriven motivation som Operating System §I kräver.

### Vad som saknas för 11/11

**1. Ingen error boundary-hierarki.**
Research §5.1: Nestade error boundaries (app → sektion → widget). Planen definierar ingen error boundary. Om TanStack Query returnerar ett nätverksfel → vad ser Lotta? Med React 19:s error boundaries kan varje sektion (Hem-kortet, anmälningslistan, etc.) falla separat utan att hela appen dör.

**2. Ingen service worker.**
Research §5.1: Offline-stöd via Workbox. Lotta på event-plats (dålig uppkoppling) → appen fungerar inte → tillbaka till papper. Minimum: cache-first för statiska resurser + network-first för API med fallback.

**3. Ingen Web Vitals-rapportering.**
Research §5.3: `web-vitals` npm-paket + `sendBeacon()`. Utan RUM vet du inte om INP är 200ms eller 2000ms i produktion. Apple mäter varje millisekund.

**4. Ingen graceful degradation vid offline.**
Research §5.1: Stale-while-revalidate-strategi. Om Lotta öppnar appen utan internet → blank skärm. Med TanStack Query `staleTime: Infinity` + service worker cache → senaste data visas med "Senast uppdaterat: 08:12" indikator.

### Åtgärdsplan

1. Wrappa varje sektion i Hem-fliken i en `ErrorBoundary` med Lotta-anpassat felmeddelande: "Den här delen kunde inte laddas just nu. Försök igen." + retry-knapp.
2. Installera Workbox. Skapa service worker med 3 strategier: Cache-first (bilder, fonts, app-shell), Network-first (API), Offline fallback (/offline.html).
3. Installera `web-vitals`. Rapportera CLS, LCP, INP till Sentry/analytics vid varje sidvisning.
4. Konfigurera TanStack Query: `staleTime: 5 * 60 * 1000`, `gcTime: 30 * 60 * 1000`. Vid offline: visa cachad data med timestamp-indikator.

### Apple-kommentar

Apple testar alla appar på flygplansläge. Deras test-case #1 är inte "fungerar appen?" utan "vad ser användaren när *inget* fungerar?". Lottas upplevelse vid dålig uppkoppling på event-plats definierar mer förtroende än tusen perfekta sessioner på wifi. Error boundaries + service worker + stale-data-visning = skillnaden mellan "appen dog" och "appen har koll även utan internet".

---

## Fas 6: Hem + Event + Personer + Mer

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 7/11**

### Vad fasen gör bra

TanStack Query med loaders är rätt val. Scenariopoesi ("07:52. Barnen ska hämtas klockan tre.") är exceptionellt — den tvingar varje designbeslut att svara på ett verkligt ögonblick. Beteendeprinciperna ("Lottas tillstånd ska gå från 'vet inte' → 'har kontroll' inom 4 sekunder") är testbara. Empty-states med lugn text istället för illustrationer respekterar Lottas kontext. CTA-knappen som ändrar label baserat på state ("Följ upp obetalda" vs "Se alla event") är smart kontextuell design.

### Vad som saknas för 11/11

**1. Ingen optimistisk UI.**
Research §3.4: "Uppdatera UI direkt som om servern redan svarat, rulla tillbaka om det misslyckas." Lotta markerar en betalning som "betald" → spinner → 500ms paus → uppdatering. Med optimistisk UI: Lotta trycker → markerad direkt → servern bekräftar i bakgrunden. TanStack Query har inbyggt stöd: `onMutate` → optimistisk cache-uppdatering → `onError` → rollback. Planen nämner aldrig `useMutation`.

**2. Ingen realtid.**
Supabase Realtime finns i stacken men nämns inte. Om Roger registrerar en ny anmälan medan Lotta har appen öppen → hon ser det inte förrän hon refreshar. Research §8.3: WebSocket-baserade uppdateringar. TanStack Query + Supabase Realtime: `onPostgresChanges → queryClient.invalidateQueries()`.

**3. Ingen View Transitions vid navigation.**
Research §2.3: Event-lista → event-detalj borde ha en shared element transition (event-kort "expanderar" till detalj). Hem → Event borde ha en tab-byte-animation (pill glider). Allt detta saknas.

**4. Person-sökning utan debounce/INP-hänsyn.**
Research §2.4: `scheduler.yield()`, debounce med `requestAnimationFrame`. Planen specificerar `<input type="search">` men nämner inte debounce. Vid 500+ personer → varje knapptryckning triggar filtrering → INP-problem. `useDeferredValue` (React 19) eller debounce-hook behövs.

**5. Ingen offline-förmåga för event-närvaro.**
Research §5.1 + §8.3: Lotta tar närvaro på event-plats (dålig uppkoppling). Om appen kräver internet för varje närvaromarkering → omöjligt. Background Sync API (research §5.6) löser detta: markera lokalt → synka när uppkoppling finns.

### Åtgärdsplan

1. Implementera `useMutation` med optimistisk UI för: markera betalning, markera närvaro, skicka påminnelse. TanStack Query `onMutate` + `onError` rollback.
2. Lägg till Supabase Realtime-subscription i `useEffect` i Hem-fliken: `supabase.channel('registrations').on('INSERT', () => queryClient.invalidateQueries('registrations'))`.
3. Installera `nuqs` för URL-state i Event (filter) och Personer (sökterm). Research §3.6.
4. Implementera `useDeferredValue` för person-sökning. Visa "Söker..." skeleton under övergång.
5. Implementera Background Sync för närvaromarkering (Fas 7).

### Apple-kommentar

Apple Notes synkar offline. Apple Mail kör optimistic send. Apples appar *förutsätter* dålig uppkoppling och designar för det. Lottas mest kritiska scenario — ta närvaro på event — sker per definition på en plats som inte har stabil uppkoppling. Att appen kräver internet för kärnfunktionalitet vid event-tillfället är en designbugg, inte en feature-request.

---

## Fas 6.5: Aktivitetslogg

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 5/11**

### Vad fasen gör bra

Konceptet är rätt — Lotta behöver en historisk vy över allt hon gjort. Det bygger förtroende ("systemet har koll"). Separat feature-dokument visar disciplin.

### Vad som saknas för 11/11

**1. Ingen xAPI-standard.**
Research §8.2: xAPI/cmi5 spårar ALLT en användare gör, var som helst. Aktivitetsloggen borde använda xAPI statement-format (Actor + Verb + Object + Result + Timestamp) istället för en ad hoc-tabell. Detta ger: (a) interoperabilitet med framtida Passionslyftet-LMS, (b) standardiserad analytics, (c) möjlighet att generera kompetenskartor.

**2. Ingen strukturerad loggning.**
Research §5.5: OpenTelemetry-format med trace-korrelering. Loggar utan trace-ID är omöjliga att felsöka: "Lotta rapporterar att betalningen inte registrerades" → vilken request? vilken timestamp? vilken edge function?

**3. Loggretention och GDPR inte adresserat.**
Airtable-tabell med persondata (vem betalade vad) utan retention policy. GDPR kräver definierad lagringstid och rätt till radering.

**4. Ingen push-notifiering.**
Research §8.6: Notifikationsstrategi utan notification fatigue. Lotta behöver inte öppna appen för att veta att något hänt: "3 nya anmälningar till Rönninge-eventet" som push (Webb-push via Service Worker).

### Åtgärdsplan

1. Designa aktivitetsloggen med xAPI-inspirerat schema: `{ actor_id, verb, object_id, object_type, result, timestamp, context }`. Kan migreras till full LRS vid behov.
2. Lägg till `trace_id` i varje loggpost. Generera i frontend, skicka med till Edge Function.
3. Definiera retention policy: 12 månaders data, sedan anonymisera. Dokumentera i GDPR-kontext.
4. Lägg till push-notifiering som framtida fas (Fas 8). Researcha `web-push` + Supabase Database Webhooks.

### Apple-kommentar

Apples Aktivitet-app loggar varje steg, varje träningspass, varje sömnperiod — men visar det som en berättelse ("Du har gått 15% mer denna vecka"). Lottas aktivitetslogg borde inte vara en lista med händelser — den borde vara ett bevis på att systemet arbetar: "Denna vecka har systemet hanterat 12 anmälningar, skickat 3 påminnelser, och registrerat 28 närvaron. 0 fel." Det är trovärdighet i siffror — precis som scenariopoesins "234 anmälningar sedan start. 0 tappade."

---

## Fas 7: Konsolidering + Kvalitetssäkring

<!-- markdownlint-disable-next-line MD036 -->
**Betyg: 6/11**

### Vad fasen gör bra

Friction logs (3 stycken med tydliga scenarier), design audits via skill, Playwright baselines, eliminationslistor per fas, definition av "klart" (11-punkts checklista) — allt detta visar en mognadsgrad som saknas i de flesta projekt. Operating System §VIII:s "Något är inte klart när det fungerar — det är klart när stresstest är gjort" är en princip som höjer ribban.

### Vad som saknas för 11/11

**1. Ingen säkerhetsimplementation.**
Research §6 i sin helhet saknas. Ingen CSP Level 3 (§6.1: nonce-baserad med `strict-dynamic`). Inga Trusted Types (§6.2: förhindrar DOM XSS). Inga säkerhetsheaders (§6.6: COOP, COEP, Permissions-Policy). Ingen supply chain-audit (§6.5). **Obs: React2Shell (CVE-2025-55182) exponerade 644 000+ domäner via React 19 Server Actions. Planen använder React 19.** Även om SPA inte har Server Actions — säkerhetsgranskning av React 19 borde vara explicit.

**2. Ingen chaos engineering.**
Research §5.4: Testa under dåliga förhållanden med intention. Chaos service worker som injicerar fördröjningar/fel. Playwright-baserade chaos-tester i CI. Planen stresstester manuellt men inte automatiserat.

**3. Ingen RUM-setup.**
Research §5.3: web-vitals + sendBeacon i produktion. Utan RUM vet du inte om Lotta upplever INP på 50ms eller 500ms. Lighthouse i utvecklingsmiljö ≠ verkligheten.

**4. Ingen WCAG 2.2 fullständig audit.**
Research §7.1-7.5: ARIA 1.3, kognitiv tillgänglighet, EAA (lag sedan juni 2025). Planen specificerar "Lighthouse ≥ 95 + axe 0 critical/serious" — men automatiserade verktyg fångar bara 30-40% av problem (research §7.4). Ingen manuell audit med skärmläsare specificerad. Ingen EAA-checklista.

**5. Ingen deploy-strategi.**
Planen nämner "Deploy: TBD (Vercel/Netlify)" i CLAUDE.md men Fas 7 definierar ingen deploy. Ingen CI/CD-pipeline. Ingen preview-deployment per commit. Ingen zero-downtime deploy.

### Åtgärdsplan

1. Implementera CSP Level 3: `script-src 'nonce-{RANDOM}' 'strict-dynamic'; object-src 'none'; base-uri 'none'`. Generera nonce i Vite plugin eller Vercel Edge Middleware.
2. Installera `@axe-core/playwright`. Lägg till automatiserad a11y-testning i Playwright: `expect(await new AxeBuilder({ page }).analyze()).toHaveNoViolations()`.
3. Definiera deploy-pipeline: Vercel + preview-deployment per PR + `npm audit` + `biome check` + `tsc --noEmit` + Playwright.
4. Skapa `docs/SECURITY-CHECKLIST.md` med OWASP-baserad checklista. Granska React 19 mot kända sårbarheter.
5. Lägg till manuell skärmläsartest: VoiceOver (macOS) genomgång av alla 4 flikar. Dokumentera resultat.
6. Implementera chaos-testing: Playwright-scenario med `page.route('**/api/**', route => route.abort())` → verifiera att appen visar Lotta-anpassat felmeddelande.

### Apple-kommentar

Apples QA-process inkluderar "Golden Master"-testning: varje release testas på den äldsta stödda enheten (iPhone SE 2nd gen), med reducerad rörelse, svartvitt-läge, VoiceOver aktiverat, och simulerad 3G-uppkoppling. Allt ska fungera. Allt. Fas 7:s "konsolidering" borde vara den mest rigorösa fasen — inte en uppsamlare. Den borde ha en explicit "Golden Master"-dag där appen testas under sämsta möjliga förhållanden (offline, 320px, VoiceOver, prefers-contrast:more, tom data, överfull data, expired auth) och varje avvikelse dokumenteras.

---

## Del 2: Tvärgående gap

Dessa brister lever *mellan* faserna — ingen fas äger dem, men alla påverkas.

### 1. Arkitektur: SPA vs. SSR-medvetenhet

Planen väljer Vite SPA. Research §1 rekommenderar RSC + PPR (Next.js 15+) eller Islands (Astro) för content-tunga appar. En admin-app med enbart autentiserade användare och dynamisk data är dock en legitimate SPA-kandidat. **Men**: Planen definierar aldrig *varför* SPA valdes. Det beslut-dokumentet saknas. Det borde finnas en explicit eliminationslista: "Vi valde SPA framför Next.js App Router för att: (a) admin-app, inga SEO-krav, (b) inget offentligt innehåll att pre-rendera, (c) Vite bevisat i Vue-projektet, (d) enklare deploy." Utan denna motivering ser det ut som att SSR aldrig övervägdes.

**Konsekvenser som borde adresseras:**

- Ingen streaming SSR → hela appen renderas client-side → längre FCP
- Ingen edge rendering → alla API-anrop från klient (inte edge-optimerade)
- Inget PPR → allt eller inget (ingen mix av statisk/dynamisk)

**Mitigation:** Inte nödvändigtvis byta till Next.js, men: (a) dokumentera beslutet, (b) implementera service worker cache-first för app-shell (pseudo-SSR), (c) överväg Speculation Rules för prerender.

### 2. Performance: ingen mätning, ingen budget, ingen optimering

Research §2 (hela kapitlet) saknas i planen. Ingen INP-budget. Ingen LoAF-monitorering. Ingen `scheduler.yield()`. Ingen `content-visibility`. Ingen `fetchpriority` på hero-element. Ingen bundle-analys. Planen testar bara "fungerar det?" — aldrig "hur snabbt?"

**Åtgärd:** Skapa `PERFORMANCE-BUDGET.md`. Installera `web-vitals`. Mät INP på varje interaktion i Fas 6. Debounce sökning. Lazy-load routes. Prefetch vid hover.

### 3. Säkerhet: noll (!)

Research §6 (hela kapitlet) saknas i planen. Ingen CSP. Inga Trusted Types. Inga säkerhetsheaders. Ingen supply chain-strategi. Ingen passkey-plan. Ingen OWASP-checklista. Planen nämner `session-token auth` (lessons.md) men implementerar det bara i Edge Functions — inte som komplett säkerhetsarkitektur.

**Åtgärd:** Skapa `SECURITY-SPEC.md`. Implementera CSP i Fas 0. Trusted Types i Fas 3. Säkerhetsheaders i deploy-config (Fas 7). Supply chain-audit i CI.

### 4. Resilience: appen förutsätter perfekta förhållanden

Ingen service worker. Inga error boundaries. Ingen offline-strategi. Ingen retry-logik i adapter. Ingen circuit breaker. Ingen Background Sync. Research §5 (hela kapitlet) saknas. Lottas mest kritiska scenario (event-dag med dålig uppkoppling) är det enda scenario appen inte kan hantera.

**Åtgärd:** Service worker (Fas 0 skelett, Fas 5 implementation). Error boundaries (Fas 5 per sektion). Adapter retry (Fas 1). Offline-närvaro (Fas 6). Background Sync (Fas 7).

### 5. Observability: blindflygning

Ingen Sentry/Faro. Ingen web-vitals. Ingen strukturerad loggning. Ingen trace-korrelering. Ingen RUM. Om Lotta rapporterar "det hände ett fel" finns ingen data att undersöka.

**Åtgärd:** Sentry/Faro i Fas 0. web-vitals i Fas 5. Strukturerade loggar i aktivitetsloggen (Fas 6.5). Error boundary-rapportering.

### 6. State-arkitektur: ingen strategi

Planen nämner `useState`, `useMemo`, TanStack Query — men definierar aldrig en state-strategi. Research §3 visar att state bör kategoriseras:

| State-typ | Exempel i Miranon | Verktyg |
|-----------|-------------------|---------|
| Server state | Event, anmälningar, personer | TanStack Query ✅ |
| URL state | Filter, sökterm, aktiv flik | nuqs ❌ saknas |
| UI state | Modal öppen/stängd, tab bar aktiv | useState ✅ |
| Form state | Login-formulär, sökfält | React Aria Form ✅ |
| Offline state | Köade mutationer | Background Sync ❌ saknas |

**Åtgärd:** Skapa `STATE-STRATEGY.md`. Definiera kategori per state-typ. Implementera nuqs i Fas 6.

### 7. Build-tooling: en generation efter

ESLint + Stylelint + Prettier (implicerat) = 3 verktyg. Biome = 1 verktyg, 65x snabbare. Research §4.5: "Migrationsstrategi: Babel→SWC → ESLint+Prettier→Biome". Planen specificerar ESLint i `.eslintrc.cjs` (legacy CommonJS-format dessutom).

**Åtgärd:** Byt till Biome i Fas 0. En config-fil (`biome.json`). Ett kommando (`biome check --write .`).

### 8. AI-assisterad utveckling: bra men inte komplett

Planen har detaljerade Claude Code-prompts per fas (utmärkt). Men research §4.3 visar fler mönster: hooks (pre-commit → lint+tsc), subagent-strategi per prompt, lessons.md-integration. CLAUDE.md-principen (hierarkisk kontext) är redan implementerad. Men: inga hooks definierade i `.claude/settings.json`.

**Åtgärd:** Konfigurera hooks: `pre-commit → biome check`, `post-edit → tsc --noEmit`. Definiera subagent-strategi i prompts.

### 9. LMS/CMS-domän: framtidssäkring saknas

Research §8 (hela kapitlet) handlar om mönster som Passionslyftet behöver: xAPI, adaptiv lärning, Open Badges, LiveKit, Cal.com, kohortbaserade kurser. Miranon Media Admin är inte ett LMS — men DataSourceAdapter-mönstret och komponentbiblioteket ska återanvändas i Passionslyftet. **Ingen av dessa framtida krav reflekteras i arkitekturen.**

**Åtgärd:** Skapa `FUTURE-COMPAT.md`: Lista vilka arkitekturbeslut i Miranon som påverkar Passionslyftet. xAPI-kompatibelt schema i aktivitetsloggen. Adapter-interface med `trackActivity()` som kan utökas.

### 10. Monetarisering och åtkomstkontroll: inte relevant nu men förekommer i stacken

Supabase RLS nämns i CLAUDE.md men implementeras inte. Research §8.5: Stripe Entitlements, drip content, team-licenser. Inte relevant för Miranon Media Admin (ingen betalning i appen), men Passionslyftet kommer behöva det.

### 11. Tillgänglighet: stark grund, svaga kanter

Planen har bättre tillgänglighet än 95% av alla projekt: skip-link, route announcer, `prefers-reduced-motion`, `prefers-contrast:more`, `aria-live`, touch targets, fokusring. Men research §7 visar att 11/11 kräver:

- **EAA-medvetenhet** (§7.5): Lag sedan juni 2025. Admin-appar som används kommersiellt kan falla under EAA.
- **Manuell skärmläsartest** (§7.4): axe fångar 30-40%. VoiceOver-genomgång saknas.
- **ARIA 1.3** (§7.1): `aria-errormessage` i formulärfält.
- **Kognitiv tillgänglighet** (§7.2): Tidsjusterbara timeouts, drag-alternativ.

---

## Del 3: Den osynliga skillnaden

### Vad skiljer "fungerar bra" från "känns som magi"

Det finns en kategori av kvalitet som aldrig specificeras i krav, aldrig fångas av tester, och aldrig mäts av verktyg. Det är den kategori som får en person att säga "den här appen *bryr sig om mig*" utan att kunna förklara varför.

Det Manifestet kallar "Det osynliga räknas" (princip 6) och "Weniger, aber besser" (princip 9).

Det researchen kvantifierar som: INP <50ms istället för <200ms. Content-visibility som gör att browsern aldrig renderar det Lotta inte ser. View Transitions som ger spatial continuity. Speculation Rules som gör navigering omedelbar. Service workers som gör appen odödlig.

Det Lotta upplever som: "Jag förstod direkt."

---

### Tre områden där gapet är störst

**1. Temporal stabilitet — appen ska kännas *närvarande*, inte *hämtande*.**

Planen hanterar loading → data korrekt (skeleton → content). Men "magi" är att det aldrig *behöver* laddas. Det ser Lotta som: hon öppnar appen och datan är redan där. Inte "laddar..." i 500ms och sedan data. Bara data.

Hur? Service worker med stale-while-revalidate. TanStack Query med `staleTime: Infinity` för första visningen. Speculation Rules som prerenderar `/hem` vid login. Resultatet: Lottas "Hej Lotta"-skärm är *omedelbar* — cachad lokalt, uppdateras i bakgrunden.

Det mäts inte i Lighthouse. Det mäts i Lottas andning.

**2. Förtroendeackumulering — systemet bevisar sig genom transparens.**

Scenariopoesins "234 anmälningar sedan start. 0 tappade" är exakt rätt. Men planen implementerar det inte. Det finns ingen "systemhälso-indikator" i Hem-vyn. Ingen "Senast synkroniserat: 08:14" som visar att systemet lever. Ingen "Allt fungerar normalt" grön puls. Lottas rädsla (#3: "tappa kontrollen") löses inte av bra UX — den löses av bevis på att systemet inte har glömt något.

Apple Watch visar en grön ring för varje dag. Inte för att ringen är användbar — utan för att den bevisar att klockan *har koll*. Miranon behöver sin gröna ring.

**3. Graceful degradation som designintention, inte som efterkonstruktion.**

Planen specificerar error handling i TanStack Query (error → message-box). Men skillnaden mellan "bra" och "magi" är *hur* felet hanteras. Inte "Något gick fel. Försök igen." utan: "Vi kunde inte hämta anmälningarna just nu. Senaste versionen (från kl 07:52) visas nedan. Vi försöker igen automatiskt."

Det ger Lotta: (a) förklaring (inte bara felmeddelande), (b) senaste kända data (inte tom skärm), (c) automatisk retry (hon behöver inte göra något), (d) tidsstämpel (systemet hade koll kl 07:52, det är bara just nu det sviker).

Researchen kallar det stale-while-error (§5.2). Manifestet kallar det "Trygghet före funktion". Apple kallar det "The Last Known Good State". Det är samma sak: *appen ska aldrig visa ingenting*.

---

### Vad som saknas för att nå "magi"

1. **Omedelbarhet.** Appen ska kännas som om all data redan finns lokalt. Service worker + TanStack Query staleTime + Speculation Rules.

2. **Kontinuitet.** Navigering ska inte vara "byta sida" utan "flytta fokus". View Transitions + shared elements + route announcer.

3. **Transparens.** Systemet bevisar sig. "0 tappade." "Senast synkat kl 08:14." "3 automatiska bekräftelser skickade idag."

4. **Odödlighet.** Appen dör aldrig. Offline → stale data + köade mutationer. API-fel → senaste kända data. Auth timeout → zacheckad automatiskt. Battery low → ingen skillnad.

5. **Profetia.** Appen vet vad Lotta ska göra härnäst. Hem → "3 obetalda" → Lottas finger rör sig mot knappen → sidan är redan prerenderad. "Se alla event" → listan är redan hämtad. Det är inte AI-prediktion — det är Speculation Rules + hover-prefetch + TanStack Router loaders.

Inget av detta syns. Inget av detta mäts av Lighthouse. Inget av detta ber Lotta om. Men allt av det känns.

*Den osynliga skillnaden är inte vad appen gör. Det är vad appen aldrig låter Lotta vänta på, aldrig låter henne undra om, och aldrig tvingar henne att förstå.*

---

## Sammanfattning: Betygsöversikt

| Fas | Betyg | Huvudgap |
|-----|-------|----------|
| Fas 0: Projektsetup | 7/11 | Säkerhet, observability, performance-budget, Biome |
| Fas 1: Domäntransplant | 8/11 | Zod-validering, adapter-retry, type-safe env |
| Fas 2: Routing + Auth | 6/11 | URL-state, passkeys, offline-auth, preload |
| Fas 3: UI-primitiver | 8/11 | View Transitions, ARIA 1.3, kognitiv a11y, dokumentation |
| Fas 5: App-shell | 7/11 | Error boundaries, service worker, Web Vitals, offline |
| Fas 6: Hem + Event + Personer + Mer | 7/11 | Optimistic UI, realtid, offline-närvaro, debounce |
| Fas 6.5: Aktivitetslogg | 5/11 | xAPI, strukturerad loggning, GDPR, push |
| Fas 7: Konsolidering | 6/11 | CSP, chaos testing, RUM, deploy, manuell a11y-test |

<!-- markdownlint-disable-next-line MD036 -->
**Genomsnitt: 6.75/11**

**De tre viktigaste tvärgående gapen:**

1. Säkerhet (research §6 helt frånvarande)
2. Resilience/offline (research §5 helt frånvarande)
3. Performance-mätning (research §2 saknar implementationsplan)

**Vad som krävs för 11/11 totalt:**

- 3 nya specifikationsdokument (SECURITY-SPEC, PERFORMANCE-BUDGET, STATE-STRATEGY)
- Service worker-implementation (Fas 0 skelett → Fas 5 full)
- CSP + Trusted Types (Fas 0 + Fas 7)
- Biome istället för ESLint (Fas 0)
- Error boundaries (Fas 5)
- Optimistic UI + realtid (Fas 6)
- web-vitals + Sentry/Faro (Fas 0 + Fas 7)
- nuqs för URL-state (Fas 6)
- Manuell skärmläsartest (Fas 7)
- xAPI-format i aktivitetslogg (Fas 6.5)
- View Transitions (Fas 5)
- Deploy-pipeline (Fas 7)

---

## Lösta risker och öppna frågor

- **LÖST (2026-04-13): Tailwind v4 CSS-first.** Migrerat från `tailwind.config.ts` till `@theme`-direktivet i `src/styles/tailwind.css`. `postcss.config.js`, `postcss` och `autoprefixer` tas bort — Lightning CSS (inbyggt i `@tailwindcss/vite`) hanterar vendor prefixing. DESIGN-SYSTEM-SPEC §8 och conversion-plan.md (sektion B, D, F, I) uppdaterade. Se ändringsspec 2026-04-13. Drivs av research §4 som rekommenderade @theme — avvikelsen i specen var inte dokumenterat motiverad.

---

*Gap-analys genomförd av Claude Code (Opus 4.6) | 2026-04-06*
*Underlag: 8 forskningsområden, 400+ källor, 5 projektdokument, 170+ lessons learned*
