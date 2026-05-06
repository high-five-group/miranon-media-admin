# Code's verifiering av Codex' projektanalys

*Datum: 2026-04-29 | Verifierat mot HEAD `245422c` (main, clean)*
*Författare: Claude Code (Opus 4.7) — direkt mot kodbas, inte minnesbild*
*Källa: `docs/analysis/Codex-project-analysis-after-fas-1.md` (2026-04-28)*

---

## Sammanfattning

Codex' övergripande dom stämmer i sak: projektet är inte en 11/10-app idag, men har en stark riktning. Sju av åtta blockers verifieras mot kod ord för ord. Den åttonde (npm audit) är trivialt sann.

**Det Codex underskattat:** Säkerhetsproblemen är allvarligare än hans 5/10-bedömning antyder. `update-record` saknar auth-verifiering, fält-allowlist och JWT-userkoppling — vilket innebär att vem som helst med anon-key (publik) kan skriva fritt på 18 produktionstabeller via `https://<projekt>.supabase.co/functions/v1/update-record`. Dessutom har `get-registrations` formula-injektion på `status`/`flagga`/`eventId`-parametrarna utan eskapering. Och `create-admin-user` saknar caller-verifiering helt — endast verify_jwt på gateway-nivå (vilket anon-key passerar). Detta är inte teori, det är observerbart i koden.

**Det Codex inte missförstått alls:** Hans bedömning är genomgående korrekt. Den enda nyans jag vill skjuta in är att `app-implementation: 3/10` är generös — appen är **0%** implementerad bortom en placeholder-rubrik. `src/main.tsx` har 43 rader varav 17 är boilerplate, en `<h1>`, en `<p>` och service worker-registrering. Inga routes, inga vyer, inga komponenter, inget auth-flöde, ingen datahämtning kopplad till UI.

---

## Verifiering per blocker

### 1. Säkerhetsmodellen är inte ikapp SECURITY-SPEC.md

**Codex påstår:** Wildcard-CORS, ingen gemensam `requireUser`-gate, anon-key-fallback, otillräcklig allowlist i `update-record`.

**Stämmer mot kod:** **Ja — och värre än Codex skriver.**

**Konkret bevis:**

- **Wildcard CORS** — [supabase/functions/_shared/cors.ts:2](supabase/functions/_shared/cors.ts#L2):
  ```ts
  'Access-Control-Allow-Origin': '*',
  ```
  SECURITY-SPEC.md §5 (rad 460–461) skriver explicit: *"`Access-Control-Allow-Origin` ska ALDRIG vara `*` i produktion."*

- **Ingen `requireUser`-gate i någon Edge Function.** Sökning efter `getUser`/`getSession`/`auth.getUser` i alla fyra datafunktioner returnerar **noll träffar**:
  ```
  grep -rn "createClient\|getUser\|getSession\|auth\." supabase/functions
  → bara create-admin-user/index.ts:1,19,24 (för admin-skapande, inte för verifiering)
  ```
  Ingen av `get-events`, `get-persons`, `get-registrations`, `update-record` extraherar caller-identitet. SECURITY-SPEC.md §5 A01 (rad 393–419) visar exakt mönster som krävs — det är inte implementerat.

- **Anon-key fallback** — [src/data/config/supabase-client.ts:16–22](src/data/config/supabase-client.ts#L16-L22):
  ```ts
  async function getAuthHeader(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? env.VITE_SUPABASE_ANON_KEY;
    return `Bearer ${token}`;
  }
  ```
  Klienten faller tyst tillbaka till anon-key om session saknas. I kombination med att Edge Functions inte verifierar caller-identitet betyder det att vem som helst med anon-key (publik per definition) kan anropa funktionerna som om de vore inloggad admin.

- **Otillräcklig allowlist i `update-record`** — [supabase/functions/update-record/index.ts:5–24](supabase/functions/update-record/index.ts#L5-L24):
  18 tabeller på allowlist, men:
  - Inget `field`-allowlist (rad 38: `const { tableId, recordId, fields } = await req.json()` — `fields` skickas direkt vidare till Airtable PATCH)
  - Inget `operation`-koncept (alla fält är skrivbara — inkl. `Status`, `Är aktiv`, betalstatus, `Anteckningar`, automation-trigger-fält)
  - Ingen koppling mellan caller och record (alla auth'd kan skriva på alla records)

**Min bedömning:** Codex säger 5/10. Jag säger **3/10**. Skillnaden: Codex behandlar det som "riktningen är bra, men inte färdig". Det är en underdrift. Det aktuella läget innebär att en känd anon-key + känt funktion-URL = full skrivåtkomst på 18 tabeller. Det är **inte en hardening-fråga** — det är en exponering. För det här systemet (tabellerna inkluderar betalstatus, mailutskick, kontaktlogg) är det en närvarande risk.

---

### 2. Appen är fortfarande en placeholder

**Codex påstår:** `src/main.tsx` renderar bara en startvy. Ingen routing, auth, rollhantering, formulärhantering, tabellvy eller kalender.

**Stämmer mot kod:** **Ja — fullständigt.**

**Konkret bevis:** [src/main.tsx:12–19](src/main.tsx#L12-L19):
```tsx
function App() {
  return (
    <main className="min-h-screen bg-bg p-8 font-sans">
      <h1 className="text-4xl text-primary">Miranon Media Admin</h1>
      <p className="mt-4 text-body text-text-secondary">Fas 0 — projektsetup klar.</p>
    </main>
  );
}
```

Direktorier som **saknas helt** under `src/`:
- `src/components/` — ej skapad
- `src/routes/` — ej skapad (TanStack Router file-based finns i `package.json` men inte i `vite.config.ts`-pluginlistan, se [vite.config.ts:6–9](vite.config.ts#L6-L9): kommentar förklarar att den införs i Fas 2)
- `src/views/` — ej skapad
- `src/hooks/` — ej skapad

Det som finns i `src/` utöver `main.tsx`:
- `data/adapters/AirtableAdapter.ts` (177 rader, varav 9 av 14 metoder pekar på Edge Functions som inte är deployade — markerade `// TODO: Edge Function 'get-X' behöver deployas`)
- `data/adapters/SupabaseAdapter.ts` — alla 14 metoder kastar `throw new Error(NOT_IMPLEMENTED)`
- `domain/models/`, `domain/schemas/`, `domain/types/` — typdefinitioner och Zod-scheman som inte konsumeras av någon UI-kod
- `lib/cn.ts`, `lib/alert-screen-reader.ts`, `lib/focus-utils.ts`, `lib/report-web-vitals.ts` — utility-funktioner som inte används i `main.tsx`

**Min bedömning:** Codex sätter `app-implementation: 3/10`. Jag skulle säga **0/10 är ärligare** — det finns ingenting att bedöma som "app". Det Codex bedömer som 3/10 är nog "fundamentet är lovande", inte appen själv. Det är inte en kritik av Codex bedömning, bara av rubriken. *Riktningen* är 8/10. *Appen* är 0/10.

---

### 3. Tillgänglighetsdokumentationen är delvis stale

**Codex påstår:** `docs/specs/ACCESSIBILITY-CHECKLIST.md` nämner Vue, FKUI och Composition API.

**Stämmer mot kod:** **Ja — och mer omfattande än Codex antyder.**

**Konkret bevis:** `grep -ni "vue|fkui|composition api"` returnerar **11 träffar**:

- [docs/specs/ACCESSIBILITY-CHECKLIST.md:4](docs/specs/ACCESSIBILITY-CHECKLIST.md#L4): *"Admin är en intern Vue 3 SPA — inte en publik..."*
- Rad 14: *"Finns det en FKUI-komponent för detta? Kolla komponentbiblioteket FÖRST"*
- Rad 18: *"Har du kollat FK:s senaste release? (Se 'Underhåll av FKUI-fork' nedan)"*
- Rad 19: *"Har du kollat vue-byggplan-v2.md..."*
- Rad 25: *"Används FKUI:s egna komponent..."*
- Rad 26: *"Skrivs koden med Composition API och `<script setup>` (Vue 3)?"*
- Rad 44: *"...synligt, kopplat label-element (FKUI-komponent)?"*
- Rad 103: rubrik *"Underhåll av FKUI-fork"*
- Rad 110, 122, 125–126: motsv. referenser

**Min bedömning:** Codex har rätt. Det är inte bara kosmetiskt — checklistan är ett kvalitetsverktyg som inte fungerar mot React Aria-stacken. Den behöver helt omskrivas, inte bara putsas. Denna fil är dessutom listad i `docs/`-roten, inte i `docs/legacy/` eller motsv. — den ser ut som en aktiv styrande fil. Det är en fälla.

---

### 4. Zod-scheman används inte konsekvent som runtime-kontrakt

**Codex påstår:** Schemana finns i `src/domain/schemas/` men adaptern castar data utan validering.

**Stämmer mot kod:** **Ja — och starkare än Codex formulerar det.**

**Konkret bevis:** Sökning efter `.parse(` eller `.safeParse(` i `src/` och `supabase/functions/`, exklusive `__tests__/` och själva `.schema.ts`-filerna:

```
grep -rn "\.parse(\|\.safeParse" src/ supabase/ --include="*.ts" --include="*.tsx" \
  | grep -v __tests__ | grep -v "\.schema\.ts:" | grep -v "schemas/index"
→ NOLL TRÄFFAR
```

Den enda referensen utanför schema-filerna är [src/domain/__tests__/schemas.assignable.ts](src/domain/__tests__/schemas.assignable.ts) som gör `AssertEqual<z.infer<typeof Schema>, Type>` — det är en **compile-time-typkoll**, inte runtime-validering. Den kontrollerar att Zod-schemat och TypeScript-typen är ekvivalenta i form, men kör aldrig validering på faktisk data.

[src/data/adapters/AirtableAdapter.ts:27–30](src/data/adapters/AirtableAdapter.ts#L27-L30):
```ts
async fetchEvents(): Promise<Event[]> {
  const data = await callEdgeFunction<{ events: Event[] }>('get-events');
  return data.events;
}
```
`Event[]` är en TypeScript-cast (`<{ events: Event[] }>`), inte en runtime-kontroll. Om Edge Function returnerar fel form blir det en silent typ-osanning ända in i UI:t.

På Edge Function-sidan: ingen Zod-validering varken på input eller output. [supabase/functions/update-record/index.ts:38–46](supabase/functions/update-record/index.ts#L38-L46) gör en handskriven `if (!tableId || !recordId || !fields)` — ingen typkontroll på `fields`-innehållet alls.

**Min bedömning:** Codex har rätt. Mitt tillägg: schemana är **funktionellt dead code** idag. De konsumeras inte vid någon datagräns — varken klient, Edge Function, eller test. ADR-005 motiverar att de existerar parallellt med interface-typerna, vilket är OK som långtidsstrategi, men just nu betalar projektet för att underhålla dubbla definitioner utan att få runtime-säkerheten.

---

### 5. Domäntyperna är inte i synk med data-model.md

**Codex påstår:** `data-model.md` dokumenterar 6 statusvärden för `Anmälningar.Status` inklusive `Inställt` och `Flytta till väntelista`. `Status.ts` speglar äldre/förenklad modell.

**Stämmer mot kod:** **Ja — exakt.**

**Konkret bevis:**

- [docs/reference/data-model.md:121–130](docs/reference/data-model.md#L121-L130) listar 6 värden:
  ```
  Obekräftad, Bekräftad (mail skickat), Betalningspåminnelse skickad,
  Avbokad/Ombokad, Flytta till väntelista, Inställt
  ```
  Tillsammans med kommentar *"Inställt: Ny 2026-04-26"* och *"Flytta till väntelista: Tillagd i april 2026"*.

- [src/domain/types/Status.ts:3–8](src/domain/types/Status.ts#L3-L8) listar 4:
  ```ts
  export const RegistrationStatus = {
    OBEKRAFTAD: 'Obekräftad',
    BEKRAFTAD: 'Bekräftad (mail skickat)',
    BETALNINGSPAMINNELSE: 'Betalningspåminnelse skickad',
    AVBOKAD: 'Avbokad/Ombokad',
  } as const;
  ```
  Saknar `INSTALLT: 'Inställt'` och `FLYTTA_TILL_VANTELISTA: 'Flytta till väntelista'`.

- Status-fältet i `Registration.ts` är dessutom typat som `string | null`, inte `RegistrationStatusValue`. Så även om enum:en fixas hjälper det inte själva domänmodellen att tvinga konsistens.

- Header-kommentaren på rad 1 säger *"Faktiska värden från Airtable (verifierade via MCP 2026-03-30)"* — den är **30 dagar inaktuell** mot 2026-04-26-tilläggen i Airtable.

- Eventplaneringens `Status` (`Planerat, Genomfört, Inställt, Flyttat`) finns inte alls som typ i koden — bara nämnd i [docs/reference/data-model.md:140](docs/reference/data-model.md#L140).

**Min bedömning:** Codex har rätt. Detta är en **liten fix nu**, **stor källa till buggar senare** — exakt som Codex skriver. När UI byggs i Fas 6 kommer status-filterval, status-knappar och status-badge-färger att referera till denna enum. Två saknade värden = två osynliga buggar.

---

### 6. Playwright konfigurerat men testsvit saknas

**Codex påstår:** `npm run test:visual` misslyckas eftersom inga tester finns.

**Stämmer mot kod:** **Ja — bekräftat genom körning.**

**Konkret bevis:**

- [playwright.config.ts:9](playwright.config.ts#L9): `testDir: './tests/visual'`
- `ls tests/` → `No such file or directory`
- `find . -name "*.spec.ts" -not -path "*/node_modules/*"` → tom output
- Faktisk körning: `npx playwright test` → `Error: No tests found` (inte "fails" som Codex skriver, utan tom svit)

Skript-namnet `test:visual` antyder fokus på visuella regressioner, men det betyder också att smoke/a11y/integration inte är planerade i samma kanal. Det är en design-fråga, inte ett fel i sig — men i kombination med avsaknaden av samtliga tester är det noterbart.

**Min bedömning:** Codex har rätt. Mitt tillägg: detta är inte ett "Playwright-problem" utan en strategifråga. Repot saknar **all** test-infrastruktur:
- Inga unit tests (det enda testlika filen är `schemas.assignable.ts` som körs av tsc, inte av en testrunner)
- Inget vitest/jest
- Inga a11y-tester
- Inga integrationstester

För ett projekt med 11/11/11-ribba är det en luckuhål. ADR-005 nämner i förbigående att Zod ska skydda runtime — men utan tester finns ingen automatisk verifiering att det görs.

---

### 7. Designsystemet är en början, inte ett bevis

**Codex påstår:** Tokens finns men ingen bevisad komponentmodell — saknar tabeller, filter, formulär, modaler, statusindikatorer, felhantering, laddningslägen, tomlägen, tangentbordsnavigation.

**Stämmer mot kod:** **Ja — alla saknas.**

**Konkret bevis:**

- `ls src/components/` → `No such file or directory`. Mappen existerar inte.
- Tokens finns: `src/styles/tokens/primitives.css`, `semantic.css`, `components.css`. [components.css](src/styles/tokens/components.css) är enligt CLAUDE.md "skelett".
- Helpers finns: `lib/alert-screen-reader.ts`, `lib/focus-utils.ts`, `lib/cn.ts` — alla är portade utility-funktioner från FK Designsystemet, inga av dem är React-komponenter.
- Inga `Button`, `Input`, `Modal`, `Table`, `StatusBadge`, `EmptyState`, `LoadingSpinner`, `ErrorBoundary`-komponenter finns att granska.

**Min bedömning:** Codex har rätt. Mitt tillägg: foundation-lagret (tokens + helpers) är välplanerat och välportat, men **bibliotekslagret är 0% byggt**. Det är inte en kritik — Fas 3 är där detta händer enligt conversion-plan. Men det betyder att axeln "återanvändbarhet" idag är 7/10 baserat på *intention*, inte på *bevis*. När Fas 3 är klar kan den verifieras.

---

### 8. Dependency-hygien

**Codex påstår:** `npm audit --audit-level=high` flaggade en moderat PostCSS-advisory.

**Stämmer mot kod:** **Ja — exakt en, och kvar idag.**

**Konkret bevis:** `npm audit` 2026-04-29:
```
postcss  <8.5.10
Severity: moderate
PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
fix available via `npm audit fix`
1 moderate severity vulnerability
```

Den är **moderate**, inte **high** — så `--audit-level=high` skulle teoretiskt sett *inte* flagga den. Codex skriver att den flaggades "moderat" via det kommandot, vilket är aningen otydligt. I praktiken: `npm audit` (utan flagga) flaggar den, `npm audit --audit-level=high` gör det inte. Inte ett fel hos Codex, bara en formuleringsdetalj.

`npm audit fix` ska kunna lösa det automatiskt eftersom postcss är transitivt beroende.

**Min bedömning:** Trivialt sann. Inte en blocker. Däremot stämmer poängen att `package.json` saknar de 7 supply-chain-försvar som SECURITY-SPEC §4 listar (preinstall-hook med audit, npm-overrides, `npm audit signatures` i CI, etc.) — vilket bekräftar Codex' större poäng om dependency-hygien som *process*.

---

## Vad Codex missat eller underskattat

### A. Formula-injektion i `get-registrations` och `get-persons`

`get-registrations` interpolerar tre query-parametrar **utan eskapering** in i en Airtable filterByFormula:

[supabase/functions/get-registrations/index.ts:51–60](supabase/functions/get-registrations/index.ts#L51-L60):
```ts
if (eventId) {
  filters.push(`FIND("${eventId}", ARRAYJOIN({Event}))`);
}
if (status) {
  filters.push(`{Status} = "${status}"`);
}
if (flagga) {
  filters.push(`{Flagga} = "${flagga}"`);
}
```

`get-persons` har en **delvis** eskapering ([supabase/functions/get-persons/index.ts:55–61](supabase/functions/get-persons/index.ts#L55-L61)) som bara hanterar `"`:
```ts
const term = search.replace(/"/g, '\\"');
filterByFormula = `OR(SEARCH(LOWER("${term}"), LOWER({Namn})), ...)`;
```
Otestat mot parenteser, kommatecken, formel-funktioner, eller andra Airtable-formel-tecken som kan ändra utvärdering.

Airtable-formler är inte SQL, men formula-injektion kan användas för att kringgå avsedda filter (`OR(TRUE(), {Status}="anything")`), exfiltrera fält genom kreativ predikatkonstruktion, eller orsaka 422-fel (DoS via dålig formel). I kombination med saknad auth (se nedan) är detta en allvarligare versionerad risk än Codex' allmänna "validera alla inputs"-poäng.

### B. `create-admin-user` saknar caller-verifiering helt

[supabase/functions/create-admin-user/index.ts](supabase/functions/create-admin-user/index.ts):

```ts
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { email, password } = await req.json();
    // ...skapar admin-user med service_role nyckel
  }
});
```

Funktionen tar emot e-post och lösenord, skapar en admin-user med email_confirm = true via service_role-nyckel — **utan att verifiera vem som ringer**.

Supabase default har `verify_jwt = true` på gateway-nivå, men:
1. `supabase/config.toml` finns inte i repot (`ls supabase/` → bara `functions`). Default-konfig vid deploy varierar mellan CLI-versioner.
2. Även med `verify_jwt = true` accepteras anon-key som "valid JWT" (det är ett JWT signerat av Supabase med `role: anon`).
3. Anon-key är **publik** ([env.ts:14](src/env.ts#L14): `VITE_SUPABASE_ANON_KEY` exponeras till klienten).

**Konsekvens:** Om denna funktion deployas, kan vem som helst med anon-key (alla som besöker sajten + alla som lyssnar på nätverkstrafik + alla som granskar dist-buntar) skapa admin-användare. Det är inte en spec-fråga, det är en katastrofal exponering. Codex nämner "ingen requireUser" generellt, men denna specifika funktion förtjänar att lyftas.

### C. Edge Functions läcker råa felmeddelanden

Alla fem funktioner returnerar:
```ts
return new Response(JSON.stringify({ error: (error as Error).message }), {
  status: 500, ...
});
```

`error.message` kan innehålla:
- Airtable API-svar inkl. token-prefix/körnings-detaljer
- Stack-trace-fragment
- Internal table IDs (delvis OK eftersom de ändå läcker via allowlist, men)

I produktion bör denna detalj loggas server-side och en generisk `"Internal error"` returneras. Codex' "konsekvent felmodell" täcker detta indirekt, men det förtjänar att kallas vid namn.

### D. Inget rate-limiting eller observability

Edge Functions har varken request-rate-limit, payload-size-limit, eller strukturerad loggning utöver en `console.log`-rad i `update-record`. Sentry är **installerat** (`@sentry/react: ^10.48.0` i `package.json`) men inte initierat någonstans i `src/` (greppbart: `grep -rn "Sentry" src/` → noll träffar). Det är paid-for-but-unused.

### E. `vite.config.ts` saknar säkerhetsplugin trots att SECURITY-SPEC kräver det i Fas 0

SECURITY-SPEC.md §1 (rad 18 i tabellen) säger: *"Fas 0 | CSP-header-definition, Vite-plugin för nonce-generering"*.

[vite.config.ts:11–18](vite.config.ts#L11-L18) har en kommentar *"[GA] Fas 7: security headers-plugin med CSP-nonce läggs till här"* — alltså är det medvetet skjutet till Fas 7. Det är en avvikelse från SECURITY-SPEC som **inte** är dokumenterad som ADR. Codex talar generellt om CSP — jag noterar specifikt att specen och planen inte stämmer.

### F. AirtableAdapter har 9 metoder som pekar på Edge Functions som inte finns

[src/data/adapters/AirtableAdapter.ts](src/data/adapters/AirtableAdapter.ts) deklarerar 14 metoder. Bara 4 av dem (`fetchEvents`, `fetchPersons`, `fetchRegistrations`, `updateRecord`) har motsvarande deployad funktion. De övriga 10 har `// TODO: Edge Function 'X' behöver deployas`-kommentarer. Detta är inte fel i sig (de är planerade), men det är skarp skuldskrivning som ADR-006 inte adresserar. När UI börjar konsumera adaptern i Fas 6 kommer dessa 10 att visa runtime-fel.

### G. Service worker registreras tyst utan `sw.js` som faktiskt gör något

[src/main.tsx:33–39](src/main.tsx#L33-L39) registrerar `/sw.js` om browsern stödjer det, men [public/sw.js](public/sw.js) är ett "skelett" enligt CLAUDE.md. Att registrera en tom service worker gör inget skadligt, men det är ett produktdetalj som kan förvirra: appen kommer att visa att den har SW i DevTools, men SW gör ingenting. Det syns aldrig i SECURITY-SPEC eller PERFORMANCE-BUDGET. Liten sak, men hör hemma i avvikelselistan.

---

## Vad Codex överskattat eller missförstått

Inget. Codex' analys är korrekt och ärlig. Jag hittade inget han överdrivit.

Om något: hans **5/10 för säkerhet** är **för generös**. Hans **3/10 för app-implementation** är **för generös** (det är 0/10). Men inget är för hårt skrivet.

---

## Min sammantagna bedömning

### Codex' fyra rekommenderade nästa rundor

1. **Security hardening-pass innan större UI** — *rätt prioriterat, men för begränsat scope.*
   - Min uppdaterade rekommendation: hardening-passet ska inkludera (a) requireUser-helper med JWT-extrahering och `auth.getUser()` i varje datafunktion, (b) fält-allowlist per tabell i `update-record`, (c) eskapering eller helst parameteriserade filter via en query-builder för Airtable, (d) caller-verifiering i `create-admin-user` (vem får skapa admins?), (e) origin-allowlist i CORS, (f) generisk felmodell utåt + strukturerad loggning inåt.
   - **Kritisk tillägg:** Denna runda måste innehålla en *verifieringsfas* — Playwright/curl-tester som faktiskt testar happy/deny för varje funktion. Att skriva specen utan att testa den är vad som bidrog till nuvarande gap.

2. **React-anpassad accessibility baseline** — *rätt prioriterat.*
   - Konkret: skriv om hela `ACCESSIBILITY-CHECKLIST.md` från scratch, behåll bara WCAG-kriterierna. Allt FKUI/Vue-specifikt försvinner. Lägg till axe-core via Playwright som första a11y-test.

3. **Adapter- och schema-kontrakt** — *rätt prioriterat.*
   - Konkret startpunkt: `Status.ts` synkas mot `data-model.md` (6 + 4 + 6 värden för Anmälningar/Eventplanering/Deltaganden). Sedan `RegistrationSchema` etc. börjar användas via `.parse()` i adaptern och i Edge Functions. Då börjar `schemas.assignable.ts` faktiskt vara ett kontrakt och inte en typkoll.

4. **Testbar produktionsslice** — *rätt prioriterat.*
   - Förslag på slice: "Visa anmälningar för ett event, filtrera på status, avboka en anmälan." Det rör fyra system samtidigt: auth, datahämtning, status-mappning (här fångas Inställt/Flytta-luckan om den är ofixad), och write-flöde via update-record (här fångas allowlist-luckan). Det är inte en lugn slice — det är medvetet vald för att tvinga säkerhet och datadisciplin.

### Saknas något i hans rekommendationer?

- **Test-infrastruktur som första-klass-medborgare.** Codex nämner Playwright + a11y i Runda 4, men säger inte: *"innan något UI byggs behöver vitest/jest-grundsetup, en första schema-parser-test, och en första edge-function-rökflöde finnas."* Att ha noll tester när Fas 3 startar är en känd missing piece från Vue-projektet — gör det inte igen.
- **ADR för avvikelse från SECURITY-SPEC §1.** CSP-nonce skjuts från Fas 0 till Fas 7. Det ska ha en ADR som motiverar varför, vad risken är under tiden, och hur det mitigeras (t.ex. striktare COEP/COOP redan nu, eller en statisk CSP utan nonce).
- **Sentry-init.** Den är installerad men inte initierad. Det är 5 minuters arbete och ger error-visibility omedelbart — borde göras innan stora UI-flöden.

### Är något i hans rekommendationer fel prioriterat?

Nej. Ordningen security → a11y → schema → slice är rätt. Den enda optimering jag ser: **a11y-baseline kan göras parallellt med säkerhet** eftersom de inte har överlapp. Det skulle kapa den totala tiden.

---

## Förslag på nästa steg

Efter att datamodell-research-projektet är arkiverat (Fas 6 just nu), i denna ordning:

1. **Fixa två nollarbete-luckor först (1 timme):**
   - `Status.ts` synkas med `data-model.md` (6 värden, plus separata Eventplanering- och Deltaganden-enums). ADR-uppdatering.
   - `npm audit fix` för PostCSS. Verifiera att build fortfarande grön.

2. **Skriv om `ACCESSIBILITY-CHECKLIST.md` (2 timmar):**
   - Start med WCAG 2.2 AA-kriterier, mappning till React Aria-mönster, axe-core integration. Inte Vue, inte FKUI.

3. **Security hardening-runda (1–2 dagar):**
   - Skapa `_shared/auth.ts` med `requireUser(req)` som kastar 401 om JWT saknas/ogiltig/anon. Anropas i alla 4 datafunktioner + `create-admin-user`.
   - Skapa `_shared/cors.ts` v2 med origin-allowlist (env-driven).
   - Skapa `_shared/filter-builder.ts` för parameteriserad Airtable-filter-konstruktion. Eliminera string-interpolation.
   - Skapa fält-allowlist per tabell i `update-record`. Lista vilka fält som får skrivas och från vilken roll.
   - Generisk felmodell — `error.message` loggas server-side, klient ser `{ code, message: "Internal error" }`.
   - Initiera Sentry i `src/main.tsx`. 5 minuter, stort värde.
   - Playwright happy/deny-test för varje funktion.

4. **Schema-runda (0.5–1 dag):**
   - Använd Zod-schemana i Edge Functions (input + output) och i `AirtableAdapter` (validera responses). Då är de inte längre dead code.
   - ADR för "Zod är enda runtime-kontraktet vid systemgränser".

5. **Produktionsslice — anmälningslista + avboka (3–5 dagar):**
   - Detta blir det första riktiga test-caset för auth, schema, status-mappning, och write-flow.
   - Inkluderar tabell, filter, status-badge, modal, error/loading/empty states, keyboard-flow, axe-test, smoke-test.
   - Den blir mall för resten av Fas 6.

Steg 1 är **noll-risk-arbete** som omedelbart minskar buggrisken i Fas 6. Steg 3 är den faktiska 11/10-blockern. Steg 5 är där projektet bevisar sig.

---

*Slut på rapport. Ingen kod ändrad i denna session. Fix-arbete prioriteras separat.*

---

# Tillägg: Påverkan från datamodell-research-projektet

*Datum: 2026-04-30 | Skrivet efter att ha läst 04-research.md, 05-gap-vs-worldclass.md, 06a-airtable-redesign.md, 06b-supabase-target.md, 07-migration-plan.md, arbetsdokumentet och K1-K10 i ~/Repon/marcus-system/tasks/lessons.md.*

Detta tillägg uppdaterar inga befintliga sektioner ovan. Det skriver om bedömningen där 04-07 och K1-K10 förändrar bilden.

## Sammanfattning av påverkan

Min ursprungliga rapport behandlade kodgapen som tekniska defekter att fixa. 04-07 visar att flera av dem är **bryggor mellan dagens Airtable-verklighet och en låst targetdesign**, inte fristående buggar. Det betyder:

- **Status.ts-fixen är inte längre noll-arbete.** Den måste skrivas så att den lever rätt över A-track utan att föregripa S-track.
- **Mina Zod-schemas-rekommendationer ändrar form.** Schemana är bridge-design, inte dead code som ska aktiveras eller raderas — de ska bli två separata kontrakt (Airtable-shape vs target-shape) när S-track byggs.
- **Säkerhetshärdningen ska inte föregripa S-track.** K7 låser oss vid att inte smyg-besluta tenant/membership/service_clients-arkitektur via en hardening-runda.
- **Två kategorier som Codex bara nämnde generellt har konkret kod-bevis i mitt material**: G12/DQ8 mail partial-success och G13/DQ9 väntelista-race. De är synliga i `update-record`/saknad `move-waitlist-to-registration`.

## Fråga 1 — Status.ts-fixen givet A1 och 06b transitions

**Svar:** Det är fortfarande **liten arbetsmängd**, men inte längre **noll-arbete**, och inte längre frikopplat från resten.

**Varför inte noll-arbete:**

- A1 ([06a Del A](analys/06a-airtable-redesign.md)) ändrar formeln `Anmälningar.Är aktiv (1/0)` post-MK från `IF({Status}="Avbokad/Ombokad", 0, 1)` till `IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1)`. **A1 ändrar inte status-värdena** — de sex värdena `Obekräftad`, `Bekräftad (mail skickat)`, `Betalningspåminnelse skickad`, `Avbokad/Ombokad`, `Flytta till väntelista`, `Inställt` finns redan i Airtable idag och kommer fortsätta finnas post-A-track. Status.ts ska alltså spegla **alla sex värden idag**.
- 06b §B3 designar `registrations.status` som en **annan** enum: `'draft','pending','confirmed','waitlisted','cancelled','rebooked','completed','no_show'`. Den är target-modellen, inte Airtable-modellen. Att blanda dem i samma `RegistrationStatus`-konstant är en feldesign mot K9 (stable identifiers separeras från displaynamn vid integrationskanter): Airtable-värdet `"Bekräftad (mail skickat)"` är ett displaynamn, inte en stable key, och target-värdet `"confirmed"` är en target-state-nyckel.

**Hur fixen ska göras:**

1. Status.ts speglar **Airtable som det är idag** (sex värden, inkl. `Inställt` och `Flytta till väntelista`). Det är pre-A-track-läget. A1 påverkar formeln, inte enum:n, så fixen håller över A-track.
2. När S-track schemat seedas i 07 Steg 4 introduceras en **separat** `TargetRegistrationStatus`-enum i `src/domain/types/Status.ts` eller i en separat fil, som speglar 06b. AirtableAdapter använder fortsatt Airtable-enum:n; SupabaseAdapter (när den implementeras) använder target-enum:n. DataSourceAdapter-gränsen är där mappningen sker, inte i domänlagret.
3. K8 (preserve aktivt): kommentera i Status.ts att fältet är **bridge mot Airtable och kommer ersättas av target-status när 06b §B3 implementeras**. Inte radera, inte unifiera.

**Risk om man gör fel:** Om Status.ts unifieras mot target redan nu, går vi emot K7 (rekommendation är inte beslut när gate är öppen) — S-track är beslutat som design men inte byggt. UI som konsumerar AirtableAdapter idag måste få Airtable-värdena, inte target-värdena. Annars bryts filter, badge-färger och status-knappar exakt som jag varnade för i ursprungsrapporten.

## Fråga 2 — När scheman speglar vilken modell-version

**Svar:** Scheman ska bli **källskoppade** (per DataSourceAdapter-implementation), inte unifierade. Tidsluckan hanteras genom att Airtable-shape lever först och target-shape parallelliseras när 07 Steg 4 körs.

**Plan per fas:**

| Fas | Vad scheman speglar | Var |
|---|---|---|
| **Pre-A-track (idag)** | Airtable-shape som det är idag. Sex Anmälningar-statusvärden inkl. `Inställt` och `Flytta till väntelista`. E-post som `string` (multiline-skuld inte fångad i schema). RECORD_ID-formler ignoreras (de finns inte i adapter-output). | `src/domain/schemas/*.schema.ts`. Konsumeras vid Edge Function-output (i `AirtableAdapter`) och vid Edge Function-input (i `supabase/functions/*/index.ts`). |
| **Post-A-track** | Samma Airtable-shape. A1-A8 ändrar inte fältformer, bara semantik (A1 formel), naming (A4) och content (A5/A6/A8). Schemana behöver inte uppdateras. Kommentar i `Registration.schema.ts` om att `Är aktiv`-semantiken ändrats post-A1 räcker. | Samma plats. |
| **S-track schema build (07 Steg 4)** | **Två parallella schemafamiljer.** `airtable.*.schema.ts` lever kvar tills cutover. `target.*.schema.ts` introduceras enligt 06b §B (persons/identifiers/lead_profiles, registrations/attendees/attendances, integration_sources/lead_sources). DataSourceAdapter-gränsen översätter mellan dem. | Förslag: `src/domain/schemas/airtable/` och `src/domain/schemas/target/`. Eller per adapter: scheman ligger nära den adapter som konsumerar dem. |
| **S-track parallel run (07 Steg 7)** | Båda kontrakt aktiva. Crosswalk (K10) konsumeras i UI för domänvis cutover. | Crosswalk-tabell i target Supabase enligt 07 Del C, läses av app vid behov. |
| **S-track post-cutover (07 Steg 10)** | Bara target-scheman. `airtable.*.schema.ts` raderas eller arkiveras till legacy-mapp efter karantän. | Legacy-arkiv om retention kräver det; annars deletet. |

**Tidslucka idag:**

- Schemana finns men konsumeras inte (`.parse()` eller `.safeParse()` anropas inte i `src/` eller `supabase/functions/` utanför `__tests__/`). Det är vad jag flaggade i ursprungsrapporten som "dead code".
- Korrigering efter 04-07: schemana är **inte** dead code i strikt mening, de är **frusna i pre-aktiv state**. K8 (preserve) säger att de inte ska raderas. K7 (gate-disciplin) säger att de inte heller ska aktiveras med en gång — `RegistrationSchema` ska konsumeras i `AirtableAdapter.fetchRegistrations()` när vi gör schema-runda i mitt steg 4 (se nedan), men det är pre-S-track och ska behålla Airtable-shape.

**Sammanfattat:** Schemana är **bridge-tillgångar**. De ska användas **nu** (mot Airtable-shape), kompletteras **efter S-track build** (med target-shape), och **migrera bort från Airtable-shape** vid cutover. Att radera dem nu skulle vara K8-brott.

## Fråga 3 — Säkerhetshärdning som respekterar K6 och förbereder 06b §B4 + §A3-A4 utan att föregripa S-track

**Svar:** Hardening-rundan ska göras i **två lager**: ett som är säkert idag (Airtable single-tenant, ingen tenant-abstraktion), och ett som **förbereder** target-arkitekturen utan att smyg-implementera den.

**Vad som får göras nu (pre-S-track):**

1. **`requireUser(req)`-helper i `supabase/functions/_shared/auth.ts`** — extraherar JWT, anropar `supabase.auth.getUser(token)`, returnerar `user`-objektet. Anropas i alla 4 datafunktioner och i `create-admin-user`. Inget tenant-koncept idag, för Airtable är single-base-reality (06a Del F: "G0.3 är beslutat som soft multi-tenant för S-track, men A-track har ingen tenant-abstraktion i Airtable. S-track får inte tolka 06a som tenant-design."). Helper ska struktureras så att den enkelt kan utökas: returvärdet idag är `{ user }`, framtida returvärde blir `{ user, tenant_id, memberships }` när 06b §A3 byggs.
2. **Origin-allowlist i CORS** — env-driven lista, inte tenant-driven. Idag: `https://admin.miranon.se` + lokal dev. Framtida: läses från `tenants.tenant_key` när det finns flera tenants. Idag: env-baserat räcker.
3. **Fält-allowlist per tabell i `update-record`** — hårdkodad i `_shared/field-allowlists.ts`. K9 säger inte att vi måste vänta på `integration_source_configs` för att börja: hårdkodning är godtagbart bryggsteg. Strukturera som `{ tableId: { write: ['Status', 'Notering', ...], deny: ['Är aktiv', ...] } }`. När 06b §B4 byggs flyttas allowlists till `integration_source_configs.config_values.write_allowlist`. Idag: hårdkoda och kommentera "ska migreras till `integration_source_configs` post-S-track".
4. **Parameteriserad filter-builder för Airtable** — `_shared/airtable-filter.ts` med funktioner som tar typade parametrar (status: string, eventId: string) och bygger formula med eskapering. Detta löser injektionen i `get-registrations` och `get-persons`. K6-respekt: filter-builder vet ingenting om integration_sources eller lead_sources — den hanterar bara Airtable-formler. När S-track ersätter Airtable-Edge-Functions med target queries blir filter-buildern obsolet, inte migrerad.
5. **Generisk felmodell** — `error.message` loggas via `console.error`, klient ser `{ code: 'INTERNAL', message: 'Något gick fel' }`. Idag: console.error räcker. Framtida: `audit_log` (06b §C1) tar emot felen med `actor_type`, `target_table`, `target_id`, `metadata`. Strukturera felmodellen så att den enkelt kan skicka till audit_log senare.
6. **Sentry init i `src/main.tsx`** — det är installerat men oinitierat. Initiera. P7 (operational observability) gäller redan idag. K6: Sentry är observability-edge, inte integration-edge — det blandar inte koncepten.
7. **`create-admin-user` får `requireUser` + role check** — endast användare med roll `owner` eller `admin` får skapa admins. Idag finns ingen `tenant_memberships`-tabell, så role check kan vara hårdkodad mot en kort lista av admin-emails i env. Kommentera "ska flyttas till `tenant_memberships.role` post-S-track". Detta är inte tenant-design — det är auth-gate på en publik endpoint.

**Vad som INTE får göras nu (skulle föregripa S-track):**

- ❌ **Inför inte `tenant_id`-kolumn eller `tenant_key`-konstant.** 06a Del F: A-track har ingen tenant-abstraktion. Kod som lägger in `tenant_id: 'miranon-media'` på Edge Function-anrop är K7-brott (gate-disciplin) — det smyg-implementerar G0.3 i pre-S-track-läge.
- ❌ **Inför inte `integration_sources`- eller `service_clients`-tabell.** De byggs i 07 Steg 4. Att seeda dem i Airtable är design-skada (Airtable är inte target).
- ❌ **Inför inte `integration_requests`-loggning för Edge Function-anrop.** Det är target-arkitektur (06b §D1). Idag räcker `console.log` + Sentry. Att bygga en `integration_requests`-tabell i Airtable är en återvändsgränd.
- ❌ **Inför inte `audit_log`-tabell i Airtable.** Det är target (06b §C1). Idag: `console.error` + Sentry. Edge Function-loggning räcker tills S-track.
- ❌ **Implementera inte `move-waitlist-to-registration` Edge Function som idempotent operation idag.** Det är 06a A3 + 06b §B6 `waitlist_conversions`. A3 ska göras post-MK enligt 07 Steg 2, men målbilden är 06b. Idag pekar `AirtableAdapter.fetchWaitlist` på en Edge Function som inte finns; planera den, men gör inte hela operation_key/idempotency-mönstret innan A3-fönstret.

**K6-disciplin i hardening:** integration_sources och lead_sources blandas inte ihop, men eftersom ingendera finns i Airtable-tiden behöver hardening-rundan **inte** ta ställning mellan dem. Det är target-design. Hardening säkerställer att **dagens** Edge Function-anrop är auth'd, parameteriserade och loggade — inte att de modellerar source-konceptet.

## Fråga 4 — Vilka rekommendationer ändrar prioritet eller scope givet 04-07

| Ursprunglig rekommendation | Ny status | Varför |
|---|---|---|
| **Steg 1.1: `Status.ts` synkas mot data-model.md (1 timme)** | Behåll, men markera som **bridge-fix**, inte slutfix. | Status-värdena är legitima idag (alla 6 finns i Airtable). A1 ändrar formeln, inte värdena. Target-status (06b §B3) är annan modell och ska adresseras separat post-S-track. K8: kommentera bridge-rollen. |
| **Steg 2: Skriv om `ACCESSIBILITY-CHECKLIST.md`** | Oförändrad. | 04-07 berör inte a11y. Codex-fyndet står. |
| **Steg 3: Security hardening-runda** | **Scope justerat enligt fråga 3 ovan.** Inga tenant- eller integration_sources-konstrukt. Strukturera helpers så de kan utökas post-S-track. | K7 + K6 + 06a Del F. |
| **Steg 4: Schema-runda — använd Zod i Edge Functions och adapter** | Behåll men **markera som "Airtable-shape, S-track ersätter senare"**. Schemana är bridge, inte permanent. | Schemana är inte dead code, de är frusen pre-aktiv state (K8). När 07 Steg 4 körs introduceras parallella target-scheman. |
| **Steg 5: Produktionsslice — anmälningslista + avboka** | **Scope expanderat.** Lägg till explicit testfall för `Inställt`-status (verifierar Status.ts-fixen) och `Flytta till väntelista` (verifierar att UI inte felklassar dem som `Avbokad/Ombokad`). | data-model.md §B3 + §C5 visar att dessa är aktiva states som UI måste hantera. |

**Ny rekommendation som inte fanns i ursprungsrapporten:**

**Steg 6: Förberedelse för migrationssession (07 Del H Future Code-prompt).** När mitt steg 5 (produktionsslice) är klart, bör nästa fas inte vara fortsatt UI-byggande utan en **kort förberedelseuppgift**: skapa `src/data/migration/`-mappstrukturen tom, dokumentera DataSourceAdapter-gränsen explicit, och säkerställ att AirtableAdapter och SupabaseAdapter har samma metodsignaturer (idag har de det, men 9 av AirtableAdapter:s metoder pekar på Edge Functions som inte finns). Detta är **inte** att börja på 07 Steg 4 — det är att se till att kodstrukturen kan ta emot 07 Steg 7 parallel run domänvis utan refaktorering.

## Fråga 5 — Vad i 04-07 jag inte fångade i min ursprungliga verifiering

Sex saker som tillkommer:

### A. G12/DQ8 mail partial-success har faktisk kod-bevis

Ursprungsrapporten nämnde att `update-record` returnerar `error.message` rakt till klient. Den **missade** den verkligt allvarliga delen: `update-record` har **ingen separation mellan "Airtable PATCH lyckades" och "Airtable PATCH lyckades men send-email misslyckades efteråt"**, och `send-email` finns inte ens som Edge Function i detta repo (det är `~/Repon/miranon-media-os/`-källan enligt 06a A2).

I detta repo: `update-record` är blind — den vet inget om mail. Men **AirtableAdapter.sendEmail** är planerad ([AirtableAdapter.ts:159–162](src/data/adapters/AirtableAdapter.ts#L159-L162)) med `// TODO: Edge Function 'send-email' behöver deployas`. När den implementeras post-MK (06a A2) **måste** den följa 06b §B5 outbox-mönstret — inte en naiv "skicka mail + PATCH"-sekvens. Annars repeterar vi DQ8.

### B. G13/DQ9 väntelista-race har också faktisk kod-bevis

`AirtableAdapter.fetchWaitlist` finns ([AirtableAdapter.ts:119–129](src/data/adapters/AirtableAdapter.ts#L119-L129)) med `// TODO: Edge Function 'get-waitlist' behöver deployas`. **`createRegistration` + flytt-PATCH-mönstret som beskrivs i 06a A3 är ännu inte implementerat någonstans i detta repo** — så just nu kan inte race-condition triggas eftersom funktionaliteten inte finns. Men när den implementeras post-MK enligt 06a A3 måste den följa 06b §B6 `waitlist_conversions`-mönstret med `operation_key` som idempotency-nyckel. Idag finns det fortfarande utrymme att designa rätt. Min ursprungsrapport behandlade `update-record` som det relevanta mönstret; 06b visar att rätt mönster är `waitlist_conversions` med status per steg.

### C. K9 stable keys vs displaynamn är direkt relevant för dagens Edge Functions

`update-record`s allowlist använder **table IDs** (`tblVE3UKWl1CKrphV` etc.) — det är Airtable-interna identifierare som råkar fungera som stable keys idag, men de är **migrationssvaga**: när S-track byggs ska `events.event_key = 'event:psionautics-2026-summer'` ersätta Airtable-record-ID:n. Det innebär att API:t mellan klient och Edge Function bör börja använda **domännamn** (`'events'`, `'registrations'`) i stället för Airtable-table-IDs i klientkod. Idag använder `AirtableAdapter.updateAttendance(id, status)` `ATTENDANCE_TABLE_ID = 'tbldWHH6sSHWoQPHH'` — det är kunskapsläckage från Airtable till klientlagret som blir migrationsskuld. K9 säger: domännamn i kod, table IDs bara i Edge Function-implementationen.

### D. K10 crosswalk är inte relevant idag, men dess frånvaro betyder något

Crosswalk är produktionskritisk artefakt vid S-track migration (07 Del C). Idag finns ingen crosswalk eftersom det inte finns någon migration. Men **AirtableAdapter använder Airtable record IDs som primary identifiers** överallt (`Registration.id`, `Person.id`, `Event.id`). Det är OK idag, men betyder att UI-länkar (`/events/:id`) använder Airtable record IDs. När cutover sker måste UI antingen (a) routea via crosswalk, eller (b) byta till `event_key` som URL-parameter. Den senare är K9-respekt och bör övervägas i mitt steg 5 (produktionsslice).

### E. G14/H7 Zapier är primär extern write-path som detta repo inte alls hanterar

04-research §C14 + 06b §D1 visar att Zapier är primär ingest-väg för formulär (10 Zaps, 6 aktiva). Det här reposet hanterar **bara Lottas admin-UI**. Externa lead-magnet-formulär, anmälningsformulär och väntelisteformulär går inte via detta repos Edge Functions — de går via Zapier → Airtable. Det betyder att security hardening i `update-record` skyddar **inte** ingest-vägen. För S-track planeras `integration_sources` + `integration_requests` (06b §B4 + §D1) som ersätter Zapier. För admin-repots scope: hardening är fortfarande korrekt prioriterad eftersom det är vad Lotta använder, men Marcus och Roger ska veta att den största ingest-ytan är utanför detta repo idag.

### F. K6 har implikationer för min "filter-builder"-rekommendation

Min ursprungliga rekommendation om parameteriserad filter-builder är teknisk korrigering av en injektionsbug. K6 lägger till perspektiv: filter-builder är ett **temporärt** kontrakt mot Airtable och bör inte modellera source-koncept. Den ska inte ta emot `integration_source_id` eller `lead_source_id` som parametrar, även om man frestas att "förbereda för target". Target-Edge-Functions kommer skrivas helt om mot 06b-tabeller — de delar inte kodvägar med dagens Airtable-Edge-Functions.

## Avslutning på tillägget

Min sammantagna bedömning från ursprungsrapporten står: Codex har rätt på alla 8 blockers, säkerhetsproblemen är allvarligare än Codex anger, och Status.ts/schemas/dependency-fix är de mindre arbetena medan security/a11y/produktionsslice är de större.

Vad som **ändras** efter 04-07:

- Status.ts-fixen är bridge, inte slutfix. K8 (preserve aktivt) gäller.
- Zod-schemana är frusen pre-aktiv state, inte dead code. Aktivera dem mot Airtable-shape nu, parallellisera med target-shape post-S-track build.
- Säkerhetshärdningen ska göras i två lager: säkert-idag + förberedande-för-S-track. K7 låser oss vid att inte föregripa tenant/integration_sources.
- Mailfunktionen och väntelisteflytten är ännu inte implementerade i detta repo — det är fortfarande utrymme att designa dem rätt enligt 06b §B5/§B6 i stället för att repetera DQ8/DQ9.
- DataSourceAdapter-gränsen är arkitektoniskt avgörande för K10 (crosswalk-redo) och K9 (stable keys). Den befintliga adapter-strukturen är rätt, men metodsignaturer som tar Airtable-record-IDs ska refaktoreras mot domännamn före produktionsslice.

Ingen kod ändrad. Ingen commit. Tillägget är klart.
