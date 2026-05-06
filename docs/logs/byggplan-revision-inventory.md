# Byggplan-revision — P0 Inventering

> **Status:** ✅ AVSLUTAD — P0-leveransen klar och godkänd 2026-05-04.
> **Skapat:** 2026-05-04
> **Ägare:** Marcus + Claude Chat
> **Avsedd plats:** `~/Repon/miranon-media-admin/docs/logs/byggplan-revision-inventory.md`
> **Styrande:** `tasks/byggplan-direktiv.md` §6 P0
> **Stop-test:** Varje påstående i conversion-plan §D (fas-för-fas-plan) klassad — *oförändrad* / *behöver justering* / *behöver omformuleras* / *försvinner*.

---

## Del 1 — Prolog

### Syfte

Detta dokument är leveransen för P0-steget i byggplan-revisionen. Dess uppgift är att fånga vilka påståenden i `docs/conversion-plan.md` som motsägs av nyare dokument — så att P1 kan fatta beslut om fas-sekvensen, P2 kan synka stödspecsen, och P3 kan skriva en byggplan utan kvarvarande drift mellan dokument och verklighet.

Varje rad i klassningstabellen är ett *beslutsbärande* påstående — ett som styr scope, sekvens, beroenden, verifiering, eller filer som skapas. Tabellen är medvetet kompakt; all tonvikt ligger på rader som flyttar nålen i P1.

### Källprioritet vid konflikt

1. `tasks/byggplan-direktiv.md` §3 (åtta luckor) + §8.5 (Fas A-fynd) — auktoritativ för revisionen
2. `docs/analysis/Code-verification-of-codex-analysis.md` (HEAD `245422c`, 2026-04-29) — kodbasverifiering
3. `docs/analysis/Codex-project-analysis-after-fas-1.md` (2026-04-28) — extern projektanalys
4. `analys/04-research.md` → `analys/08-odoo-validation.md` — datamodell-research (frusen efter Gate 6 + Odoo)
5. `marcus-system/tasks/lessons.md` (sektioner 2026-04-28 → 2026-05-04) — universella lärdomar
6. `tasks/sessions/2026-05-04-security-hardening.md` — Fas A-arbetsdokument (frusen efter slutsummering)

### Klassningsskala

| Klass | Innebörd |
|---|---|
| **oförändrad** | Påståendet står sig. Ingen åtgärd. |
| **behöver justering** | Påståendet är i grunden rätt men en detalj behöver uppdateras (en fil läggs till/tas bort, en verifieringspunkt formuleras om, en beroenderad utökas). |
| **behöver omformuleras** | Påståendet är delvis fel — andemeningen kvar men ramverket eller antagandet bakom har ändrats (t.ex. säkerhet flyttat till Fas A, datamodell-utgångspunkten ändrad). |
| **försvinner** | Påståendet är inte längre giltigt och har ingen plats i byggplanen (eller har migrerat helt till en annan fas). |

### Fångstregler

Tabellen är inte uttömmande — den fokuserar på beslutsbärande påståenden. Tre regler garanterar att vi inte missar kontrollpunkter:

1. **Filer som tillkommer eller försvinner i förhållande till conversion-plan listas alltid** — de är kontrollpunkter för P3:s städning.
2. **Påståenden om sekvens eller beroenden mellan faser listas alltid** — de avgör om Fas 2.5/3.5/5.5 placeras rätt och om Fas B/E:s parallellitet är riktig.
3. **`[GA]`-tillägg klassas på samma villkor som basbullets** — många levererades i Fas A och hör hemma som *försvinner* eller *behöver omformuleras*. Att inte klassa dem skulle lämna en parallell-värld där conversion-plans `[GA]`-bullets fortfarande står som "att göra".

### Scope-not

Stop-testet i direktivet §6 P0 kräver klassning av varje påstående i conversion-plan **§D** (fas-för-fas-plan). Sektionerna §A–C (övergripande arkitektur, designkontext, filinventering) hanteras i P2-steget där stödspecsen synkas, om de då visar drift.

---

## Del 2 — Klassningstabell per fas

Tabellformat per fas: `# | Påstående | Källa | Motsägs av | Klass | Korrigering`. Påståendekolumnen är komprimerad — fulltext finns i conversion-plan.

### Fas 0: Projektsetup + tokens

**Status:** ✅ KLAR (commits `1aa2544` → `fcc6de3` → `e3d8e8a`, Session 1, 2026-04-14).
**Generell observation:** Fas 0 är committad och avslutad. Påståenden i conversion-plan §D Fas 0 är *historiska beskrivningar* av en levererad fas — de står i grunden som de var. Skarpa korrigeringar gäller endast bullets vars *implementation* migrerats eller skjutits upp.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 0.1 | `[GA] vite.config.ts ... security headers-plugin med CSP-nonce` skapas i Fas 0 | §D Fas 0 → "Filer som skapas" | Direktiv §8.5.6 + kommentar i `vite.config.ts:10` | behöver omformuleras | CSP-nonce-plugin är medvetet uppskjuten till Fas 7. Ska markeras som *uppskjuten*, inte som "Fas 0-leverans". ADR rekommenderas i P3 (saknas idag). |
| 0.2 | Verifieringspunkt 10: `[GA] npm audit --audit-level=high — 0 high/critical` | §D Fas 0 → "Verifiering" | Direktiv §8.5.6 (PostCSS moderate vulnerability `<8.5.10`) | oförändrad | Fortfarande sann (moderate < high). PostCSS-fixen kan tas som sidofix när som helst — separat spår, ej Fas 0-omklassning. |

**Klassade rader: 2.** Övriga Fas 0-påståenden (mål, beroenden, övriga 9 verifieringspunkter, risker, uppskattad tid) klassas implicit som **oförändrade** — de står som de var och har levererats per BUILD-LOG Fas 0.

---

### Fas 1: Domäntransplant

**Status:** ✅ KLAR (commits `e3d8e8a` → `c91bfa0`, Session 1, 2026-04-14).
**Generell observation:** Per Marcus 2026-05-04: Fas 1 lämnas **oförändrad — KLAR** i tabellen. Fas 1-skuld omdefinierar inte "klar" retroaktivt. Skulden flyttas till Fas 2.5 enligt direktivet §3.3, §3.4, §3.6 — inte genom omklassning av Fas 1-påståenden här.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 1.1 | "Fas 1 (domäntransplant) är klar" — implicerar att domäntyper, adapter och scheman är produktionsklara | §D Fas 1 → header + verifieringspunkter | Direktiv §3.3 (Status.ts), §3.4 (adapter), §3.6 (Zod-användning) | oförändrad | Fas 1 är klar i bemärkelsen "filer kopierade och Fas 1-DoD uppfylld" (BUILD-LOG, runtime-verify 11/11). Skulden hanteras i Fas 2.5 — se Del 3-not. |

**Klassade rader: 1.** Övriga Fas 1-påståenden (filer kopierade, Zod-scheman skapade, `fetchWithRetry` levererad, beroenden mot Fas 0, verifieringspunkter, risker) är **oförändrade**.

---

### Fas 2: Routing + Auth

**Status:** EJ PÅBÖRJAD. Klassificerad **NY scope** i direktiv §5 fas-tabell (1 session).
**Generell observation:** Fas 2:s designval står sig. Drift kommer av att Fas A redan har levererat Sentry-init i `src/main.tsx` och `requireUser`-gaten på Edge Functions — Fas 2 ska respektera detta, inte återimplementera.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 2.1 | Beroenden: "Fas 0 + Fas 1" | §D Fas 2 → "Beroenden" | Direktiv §3.7 (Sentry init i Fas A M7), §8.5 (`requireUser`-gate på alla 4 datafunktioner) | behöver justering | Utökas till: "Fas 0 + Fas 1 + Fas A". Fas A låser inte Fas 2, men dess `requireUser`-mönster och `initSentry()` ska respekteras i `auth-provider.tsx` resp. `main.tsx`. |
| 2.2 | Fil: `src/main.tsx` (uppdaterad med RouterProvider) | §D Fas 2 → "Filer som skapas" | Fas A M7 (`initSentry()` redan i `src/main.tsx` före React-mount, kommit i Fas A) | behöver justering | Filen redigeras, inte skapas. Fas 2 lägger till `RouterProvider`; `initSentry()` finns redan från Fas A och ska behållas FÖRE React-mount (inte efter). |
| 2.3 | Verifieringspunkt 7: "Ej inloggad + direktnavigering → `/login`" | §D Fas 2 → "Verifiering" | Fas A M2 (`requireUser` returnerar 401 från servern; anon-key-fallback eliminerad i klient enligt §8.5.1) | behöver justering | Verifieringen står kvar men kompletteras: "Ej inloggad + direktnavigering till route som triggar Edge Function-anrop → 401 från servern, klient redirectar till `/login`". `auth-provider.tsx` får inte falla tillbaka på anon-key. |
| 2.4 | `[GA] auth-state caching med 1h TTL i localStorage` (offline-fallback) | §D Fas 2 → "[GA] Tillägg" | Direktiv §3.7 (Fas A M7 introducerade `isOperationalError`-klassning som hanterar 401 på info-nivå) | oförändrad | Cachings-mönstret står sig. Implementations-notering: cachat auth får inte trigga Sentry-spam vid offline; `isOperationalError` från Fas A skyddar redan quotan mot 401-stormar. |

**Klassade rader: 4 av ca 33 bullets i §D Fas 2.** Övriga ~29 (mål, 16 filer som skapas, övriga 6 verifieringspunkter, övriga `[GA]`-tillägg: nuqs-setup, `preload="intent"`, passkey-utrymme i LoginView, SPA-arkitekturbeslut, estimat, risker) verifierade en mot en mot conversion-plan §D Fas 2 — passerade utan drift. Komponentval (TanStack Router, Supabase Auth, Context-providers) står sig (frusen kontext per direktiv §4).

---

### Fas 3: UI-primitiver

**Status:** EJ PÅBÖRJAD. Klassificerad **NY scope** i direktiv §5 fas-tabell (2-3 sessioner, "Förutsätter ny a11y-baseline").
**Generell observation:** Komponenturval och Aria-hook-mönster står sig. Driften ligger i kvalitetsgrinden — `ACCESSIBILITY-CHECKLIST.md` är Vue/FKUI-specifik och måste skrivas om.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 3.1 | Beroenden: "Fas 0" | §D Fas 3 → "Beroenden" | Direktiv §5 (Fas 3.5 a11y-baseline alt. integrerat i Fas 3) | behöver justering | Utökas till: "Fas 0 + ny a11y-baseline (Fas 3.5 separat eller integrerad — beslut i P1)". Påverkar verifieringssättet, inte komponenturvalet. |
| 3.2 | Implicit kvalitetsgrind: nuvarande `ACCESSIBILITY-CHECKLIST.md` | §D Fas 3 → fasens kvalitetsmodell + Fas 3-prompt | Direktiv §3.5 + Codex rec #2 (checklistan refererar Vue-mönster och FKUI-komponentnamn — matchar inte React-stacken) | behöver omformuleras | Kvalitetsgrinden är den OMSKRIVNA checklistan (WCAG 2.2 AA + React Aria-mönster: `useButton`, `useTextField`, `useTabList` osv.) som P2 levererar. Fas 3 kan inte starta innan checklistan är omskriven. |
| 3.3 | Verifieringspunkt: "axe-core: 0 violations" som primär kvalitetsgrind | §D Fas 3 → "VERIFIERA per komponent" | Direktiv §3.5 | behöver justering | axe-core 0 violations är *nödvändig men inte tillräcklig*. Komplettera med tangentbord (Tab → fokusring synlig → Enter/Space aktiverar), korrekta aria-attribut per React Aria-mönster, alla tokens från designsystemet (inga hårdkodade hex), `npx tsc --noEmit` 0 fel. Konsolideras i den nya checklistan. |

**Klassade rader: 3 av ca 50 bullets i §D Fas 3.** Övriga ~47 (8 komponenter med vardera 3-5 bullets för props/Aria-hooks/visuella regler, gemensam VERIFIERA-lista resterande punkter, DOKUMENTERA-lista 3 punkter, git-commit-disciplin, estimat, risker) verifierade en mot en — passerade utan drift. Bibliotek-ribba 11/11/11 står sig (frusen per CLAUDE.md), liksom React Aria + CVA + Tailwind-stacken.

---

### ~~Fas 4~~: DataTable

**Status:** BORTTAGEN i conversion-plan v1 — DataTable flyttad till Fas 7 (villkorlig).

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 4.1 | "Fas 4 existerar inte separat — DataTable ingår villkorligt i Fas 7" | §D efter Fas 3 (rubrik "### ~~Fas 4: DataTable~~ → Flyttad till Fas 7") + Tidslinje (parentes "Fas 4 existerar inte separat") | Direktiv §5 numreringsnot bekräftar — borttagningen är medveten | oförändrad | Konsekvent över båda dokumenten. Ingen åtgärd. Listas enligt fångstregeln "filer/påståenden som försvinner listas alltid" — synlighet för P3:s städning + ADR-not. |

**Klassade rader: 1 av 1 bullet (hela "fasen" är en borttagningsmarkering).** Borttagningen är reflekterad både i §D-rubriken (genomstruken med pekare till Fas 7) och i Tidslinjen. Inget P1-beslut nödvändigt; DataTable-villkoret hanteras i Fas 7.

---

### Fas 5: App-shell + tab bar

**Status:** EJ PÅBÖRJAD. Klassificerad **NY scope** i direktiv §5 fas-tabell (1-2 sessioner, "Möjligen förenklad").
**Generell observation:** Designval (FK iOS-app som rättesnöre, 4 flikar, max-width 600px, route announcer) står sig. Drift kommer av (a) ny fas-grannskap (Fas 2.5/3.5 mellan 2 och 5) och (b) öppen P1-fråga om förenkling.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 5.1 | Beroenden (implicit i fasordningen): "Fas 0 + 1 + 2 + 3" | §D Fas 5 → fasens placering i §D | Direktiv §5 (Fas 2.5 schema-sync mellan 2 och 3, ev. Fas 3.5 a11y-baseline) | behöver justering | Beroenderaden formuleras: "Fas 0 + 1 + 2 + 2.5 + 3 (+ ev. 3.5 om separat)". Fas 5.5 är *efter* Fas 5, inte beroende av den. |
| 5.2 | Scope: full app-shell-leverans i en fas | §D Fas 5 → fasens omfattning | Direktiv §5 fas-tabell ("Möjligen förenklad") | behöver omformuleras | Förenklingsbeslut tas i P1. Möjliga axlar: (a) skip View Transitions till Fas 7-cleanup; (b) skip Workbox-utbyggnaden till Fas 7; (c) error boundaries endast på root-nivå istället för per route. Tills P1 har beslut: scope formuleras som "minimal app-shell + tab bar + skip-to-content + route announcer; alla `[GA]`-tillägg granskade individuellt i P1". |
| 5.3 | `[GA] Workbox` utbyggnad av `public/sw.js`-skelettet | §D Fas 5 → "[GA] Tillägg" | BUILD-LOG Fas 0 (`sw.js`-skelett 20 rader levererat i `fcc6de3`) | oförändrad | Skelettet finns. Workbox-utbyggnaden står som planerat — såvida inte förenklingsbeslutet i 5.2 träffar denna. |

**Klassade rader: 3 av ca 40 bullets i §D Fas 5.** Övriga ~37 (designkontext, orsakskedja, beteendeprinciper, app-shell-uppgifter, tab bar fixed bottom 4 flikar, route announcer-mönster, content-area max-width 600px, breakpoints 375/768/1024px, `prefers-reduced-motion` + `prefers-contrast:more`, övriga `[GA]`-tillägg: error boundaries + View Transitions, VERIFIERA-lista 11 punkter, DOKUMENTERA-lista, estimat) verifierade en mot en — passerade utan drift.

---

### Fas 6: Hem + Event + Personer + Mer

**Status:** EJ PÅBÖRJAD. Klassificerad **NY scope** i direktiv §5 fas-tabell (3,5 sessioner). Tyngsta fas i revisionen — flest sekvens-/beroendekorrigeringar.
**Generell observation:** Designval (Hej Lotta, kontextuell CTA, scenariodriven design, FK-rättesnöre, NOLL animation) står sig. Drift kommer av sekvenseringskravet (strangler-fig), operations-baserat API per vy, adapter-debt-ägarskap, Realtime-arkitekturen och Fas 5.5:s nya placering före Fas 6.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 6.1 | Beroenden: "Fas 5 (app-shell), Fas 3 (Button, MessageBox, ...)" | §D Fas 6 → "Beroenden" | Direktiv §5 (Fas 5.5 vertikal write-slice mellan 5 och 6, Fas 2.5 schema-sync mellan 2 och 3) | behöver justering | Beroendet utökas: "Fas 5 + Fas 5.5 (vertikal write-slice etablerar mutation-mönstret) + Fas 3 (UI-primitiver) + Fas 2.5 (schema-sync, adapter-debt klassad)". Fas 6 startar inte mot tom adapter — Fas 2.5 har redan klassat varje metod som *deploy nu* / *defer* / *död kod*. |
| 6.2 | Implicit byggordning: Hem → Event → Personer → Mer (per fas-promptens layout) | §D Fas 6 → byggordning + designkontext "Hem-fliken är det VIKTIGASTE vi bygger" | Direktiv §5 ("Sekvens följer 07 strangler-fig") + `analys/07-migration-plan.md` (Persons → Events → Registrations) | behöver omformuleras | Strangler-fig-sekvens: Persons → Events → Registrations → Hem-aggregering sist. Hem är aggregering av de tre andra och kan inte byggas innan dess underliggande domäner är på plats. Designkontextens "Hem är viktigast" står sig som *kvalitetsprioritet*, inte som *byggordning*. P1-beslut bekräftar (direktiv §6 P1 listar denna). |
| 6.3 | "[GA] Optimistisk UI med `useMutation`: markera betalning, markera närvaro, skicka påminnelse" | §D Fas 6 → "[GA] Tillägg" | Direktiv §5 ("Per-vy: registrera operation i `field-allowlists.ts`") + §8.5.4 (operations-baserat API) | behöver justering | Varje mutation går genom operations-baserat API: klient skickar `{operationKey, recordId, fields}`, inte tabellnamn/fält direkt. Operationsregistret är sanningskälla. Per-vy-leverans inkluderar uppdatering av `field-allowlists.ts`. Fas 5.5 etablerar mönstret innan Fas 6 startar. |
| 6.4 | Risker: "Adapter-metoderna fetchEvents/fetchRegistrations/fetchPersons fungerar. Övriga 9 är TODO. Hem-vyn använder bara de 3 fungerande." | §D Fas 6 → "Risker" | Direktiv §3.4 (adapter-debt explicit tracked i Fas 2.5) | behöver omformuleras | Risken hanteras inte längre genom att begränsa Hem-vyns scope. Fas 2.5 levererar en klassning per metod ("deploy nu" / "defer till specifik fas" / "ta bort som död kod") innan Fas 6 startar. Fas 6:s scope per vy avgörs av Fas 2.5:s adapter-klassning. Risk-formuleringen ersätts av "Fas 6 förutsätter Fas 2.5:s adapter-klassning klar". |
| 6.5 | "[GA] Supabase Realtime-subscription i Hem-fliken" — `supabase.channel('registrations').on('postgres_changes', ...)` | §D Fas 6 → "[GA] Tillägg" + risk-notering | Direktiv §5 (Fas E "Supabase migration" defer:ad), conversion-plans egen risk-notering ("Realtime kräver att Airtable-ändringar propageras till Supabase") | behöver omformuleras | Realtime fungerar inte så länge Airtable är primär DB utan Edge Function-triggers (inte specat). Två val: (a) defer Realtime till efter Fas E (Supabase migration); (b) implementera polling eller manuell refresh i Fas 6 som ersättning. P1-beslut. |
| 6.6 | Filen `field-allowlists.ts` omnämns inte i Fas 6:s "Filer som skapas" | §D Fas 6 → "Filer som skapas" | Direktiv §5 (per-vy operations-registrering), Fas A M4 (filen finns sedan Fas A) | behöver justering | Filen skapades i Fas A M4. Fas 6 *uppdaterar* den per vy (lägger till operations som vyns mutations behöver). Bonus-leverans, ingen ny fil — men ska vara explicit i fas-prompten. |

**Klassade rader: 6 av ca 55 bullets i §D Fas 6.** Övriga ~49 (designkontext per vy: Hem/Event/Personer/Mer, orsakskedja, 4-sekunders-principen, beteendeprinciper, mål, TanStack Query setup 4 filer, hooks 2 filer, 5 home/-komponenter, 4 routes med rotvyer + detalj-vyer, max-width 600px-regel, övriga `[GA]`-tillägg: nuqs/`useDeferredValue`/Systemhälso-indikator/Stale-while-error, VERIFIERA-lista 12 punkter, DOKUMENTERA-lista, estimat 3,5 sessioner) verifierade en mot en — passerade utan drift. Designprinciperna (NOLL animation, kontextuell CTA, scenariodriven design) står sig.

---

### Fas 6.5: Aktivitetslogg

**Status:** EJ PÅBÖRJAD. Klassificerad **OFÖRÄNDRAD** i direktiv §5 fas-tabell.
**Generell observation:** Fasen står som föreslagen, men två justeringar följer av Fas A:s mönster och §5 (vertikal slice + operations-API).

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 6.5.1 | Beroende: "Fas 6 (mutations i adaptern), Airtable-tabell 'Aktivitetslogg'" | §D Fas 6.5 → "Beroenden" | Direktiv §5 (Fas 5.5 vertikal write-slice etablerar mönstret), §8.5.4 (operations-baserat API + per-vy `field-allowlists.ts`-registrering) | behöver justering | Beroendet bör formuleras: "Fas 5.5 (vertikal write-slice etablerar mutation-mönstret) + Fas 6 (mutations per vy med operations-registrering i `field-allowlists.ts`) + Airtable-tabell 'Aktivitetslogg' (kan skapas parallellt under Fas B)". Loggning blir då en operation som registreras i samma allowlist-mönster. |
| 6.5.2 | `[GA] trace_id` genereras i frontend (`crypto.randomUUID()`), skickas med till Edge Function | §D Fas 6.5 → "[GA] Tillägg" | Fas A M7 (`requestId` genereras per HTTP-call i `_shared/errors.ts`, UUID v4, redan i loggning) | behöver justering | Förhållandet mellan `trace_id` och `requestId` ska klargöras i `FEATURE-ACTIVITY-LOG.md`. Två rimliga val: (a) `trace_id` är klient-genererad och spänner flera HTTP-calls inom en användarhandling, `requestId` är server-genererad per call — distinkta men korrelerade i loggen; (b) `trace_id` ersätts av `requestId` om varje aktivitetspost mappar 1:1 mot en HTTP-call. Beslut tas i P2 vid SECURITY-SPEC- och feature-spec-revideringen. |

**Klassade rader: 2.** Övriga Fas 6.5-påståenden (xAPI-inspirerat schema, GDPR-retention 12 månader, "berättelse-format", tom-state-text, sammanfattnings-generator-mönstren, estimat 2 sessioner, placeringen mellan Fas 6 och Fas 7) klassas implicit som **oförändrade**.

---

### Fas 7: Konsolidering + kvalitetssäkring (+ DataTable om behövs)

**Status:** EJ PÅBÖRJAD. Klassificerad **NY scope** i direktiv §5 fas-tabell (2 sessioner) — *"Renodlad — säkerhet redan i Fas A. Inkluderar `test-*`-prefix-exkludering från prod-deploy."*
**Generell observation:** Conversion-plans Fas 7 var "säkerhetsfasen" — den bar både server-side- och klient-side-säkerhet plus alla audits. Server-side-delen är levererad i Fas A. Fas 7:s karaktär omformuleras till klient-side-säkerhet + konsolidering + audits + deploy. Två tillägg från direktivet saknas i conversion-plan (test-*-prefix, CSP-ADR) och måste läggas till.

| # | Påstående | Källa | Motsägs av | Klass | Korrigering |
|---|---|---|---|---|---|
| 7.1 | Implicit fas-karaktär: Fas 7 är säkerhetsfasen (CSP, Trusted Types, säkerhetsheaders, supply chain, React 19 CVE, generell säkerhetshardening) | §D Fas 7 → "[GA] Tillägg" + projektets gap-analys | Direktiv §5 ("Renodlad — säkerhet redan i Fas A") + §8.5 (server-side-säkerhet stängd: CORS, requireUser, formula-injektion, create-admin-user, felmodell, Sentry, config.toml, operations-allowlist) | behöver omformuleras | Fas 7:s säkerhet är *renodlad till klient-side*: CSP Level 3 + Trusted Types + säkerhetsheaders i deploy-config + supply chain audit + React 19 CVE-granskning. Server-side-säkerhet refereras inte i Fas 7 — den är levererad i Fas A. Fasens nya karaktär: konsolidering + klient-side-hardening + audits + deploy. |
| 7.2 | Saknas explicit: `test-*`-prefix-exkludering från prod-deploy | (saknas i §D Fas 7) | Direktiv §5 ("Inkluderar `test-*`-prefix-exkludering från prod-deploy") + Fas A-mönster (test-funktioner skall inte deployas i prod) | behöver justering | Lägg till bullet i Fas 7-scope: Edge Functions med prefix `test-*` exkluderas från prod-deploy. Verifieringspunkt: `supabase/config.toml` och deploy-pipeline-skript granskas för att test-prefix-funktioner inte rullas ut. |
| 7.3 | Saknas explicit: ADR för CSP-plugin-deferral i `vite.config.ts` | (saknas i §D Fas 7) | Direktiv §8.5.6 (CSP-nonce-plugin "Saknar ADR. Bör få en ADR i P3.") | behöver justering | Lägg till i Fas 7:s DOKUMENTERA-sektion: ADR skrivs när CSP-plugin implementeras. Om plugin defer:as ytterligare i P1 skrivs ADR ändå för deferralen. |
| 7.4 | Verifieringspunkt 9: "Design audit (skill) på: DashboardView, MinaSidorView, AdminShell" | §D Fas 7 → "Verifiering" | Conversion-plans nuvarande nomenklatur: Hem (inte Dashboard), Mer (inte MinaSidor), AppShell (inte AdminShell) | behöver justering | Vy-namn uppdateras till nuvarande nomenklatur: Hem, Mer, AppShell. Trivialt namnbyte, men kontrollpunkt för P3:s städning. |
| 7.5 | "[GA] Background Sync för offline-närvaro: markera närvaro lokalt → synka automatiskt vid uppkoppling" | §D Fas 7 → "[GA] Tillägg" | Direktiv §5 (Fas E "Supabase migration" defer:ad), conversion-plans Fas 8-sektion ("Avancerad offline" defer:as till Fas 8) | behöver justering | Background Sync är klient-side och fungerar oavsett primär DB — *teknisk* implementation oförändrad. Men *scope-placeringen* kräver beslut: behåll i Fas 7 eller defer till Fas 8 om Fas 7-scope blir för stort. P1-beslut behövs innan fas-prompten kan skrivas. |

**Klassade rader: 5 av ca 40 bullets i §D Fas 7.** Övriga ~35 (mål, ramen "konsolidering + DataTable om behövs", filer som skapas/uppdateras 7 stycken, beroenden "alla tidigare faser", övriga 9 verifieringspunkter, övriga `[GA]`-tillägg som kvarstår: CSP Level 3, Trusted Types, säkerhetsheaders, `@axe-core/playwright`, manuell VoiceOver-test, chaos testing, deploy-pipeline, Golden Master-testdag, supply chain audit, React 19 CVE-granskning, estimat 3 sessioner) verifierade en mot en — passerade utan drift. DataTable-villkoret ("om event-detalj behöver tabell, bygg den; annars eliminera") står sig.

---

## Del 3 — Sammanfattning per fas

### Fas 0
- **Klassade rader:** 2. Fördelning: 1 oförändrad, 0 behöver justering, 1 behöver omformuleras, 0 försvinner.
- **Öppen P1-fråga:** Ingen.
- **Öppen P3-anteckning:** ADR för CSP-plugin-deferral — se konsoliderad ADR-katalog i Fas 7 Del 3 städnings-DoD (3 ADR:er totalt).

### Fas 1
- **Klassade rader:** 1. Fördelning: 1 oförändrad.
- **Skuld noterad — hänvisas till Fas 2.5, inte omklassad här:**
  - `src/domain/types/Status.ts` — out-of-sync mot `data-model.md` (Code Blocker 5)
  - `AirtableAdapter` — 9 odeployade Edge Function-metoder, varje TODO-markerad i koden (Code-fynd F)
  - Zod-scheman — finns men används inte som runtime-validering vid alla externa datagränser (Codex rec #3, ADR-005 dokumenterar uppskjutet schema-som-sanningskälla till Fas 2/3)
- **Princip:** Vi omdefinierar inte "klar" retroaktivt — analogt med att datamodell-research-projektet är frusen trots Odoo-valideringens nya kandidater (E1–E8).

### Fas 2
- **Klassade rader:** 4. Fördelning: 1 oförändrad-explicit, 3 behöver justering, 0 behöver omformuleras, 0 försvinner.
- **Öppen P1-fråga:** Ingen.
- **Öppen P2-anteckning:** `auth-provider.tsx`-implementationen ska respektera Fas A:s anon-key-eliminering (M2) och `requireUser`-401-mönstret. Ingen ny stödspec krävs — uppdatering av Fas 2-prompten räcker.

### Fas 3
- **Klassade rader:** 3. Fördelning: 0 oförändrad-explicit, 2 behöver justering, 1 behöver omformuleras, 0 försvinner. (Komponentbeskrivningar oförändrade-implicit.)
- **Öppen P1-fråga:** Är Fas 3.5 (a11y-baseline) en separat fas eller integrerad i Fas 3? Direktiv §6 P1 nämner detta som ett av P1:s beslut.
- **Öppen P2-fråga:** `ACCESSIBILITY-CHECKLIST.md` ska skrivas om för React Aria + WCAG 2.2 AA enligt direktiv §6 P2 — Fas 3 är blockerad tills detta är klart.

### ~~Fas 4~~
- **Klassade rader:** 1. Fördelning: 1 oförändrad. Hela "fasen" är en borttagningsmarkering — DataTable flyttad till Fas 7 villkorligt.
- **Öppen P1-fråga:** Ingen.
- **Öppen P3-anteckning:** ADR för fas-borttagningen — se konsoliderad ADR-katalog i Fas 7 Del 3 städnings-DoD (3 ADR:er totalt).

### Fas 5
- **Klassade rader:** 3. Fördelning: 1 oförändrad-explicit, 1 behöver justering, 1 behöver omformuleras, 0 försvinner.
- **Öppen P1-fråga:** Vad förenklas i Fas 5? Direktiv §5 markerar fasen "Möjligen förenklad" utan att specificera. Möjliga axlar: View Transitions, Workbox-utbyggnad, error boundary-granularitet.
- **Öppen P3-anteckning:** Om förenkling beslutas i P1, ska `[GA]`-tillägg som flyttas till Fas 7 explicit listas i städnings-DoD.

### Fas 6
- **Klassade rader:** 6. Fördelning: 0 oförändrad-explicit, 3 behöver justering, 3 behöver omformuleras, 0 försvinner. (Designprinciper och designkontext per vy oförändrade-implicit.)
- **Öppna P1-frågor (två stycken — direktiv §6 P1 listar redan båda):**
  - Sekvenseras Fas 6 enligt strangler-fig (Persons → Events → Registrations → Hem-aggregering) eller "Hem först"-prioritet?
  - Ska Supabase Realtime defer:as till efter Fas E, eller ersättas med polling/manuell refresh i Fas 6?
- **Öppen P2-anteckning:** Operations-baserat API-mönstret från Fas A M4 ska dokumenteras i `STATE-STRATEGY.md` så fas-prompten i byggplanen kan referera ett ställe.
- **Beroende-not:** Fas 6 är gated av Fas 2.5 (adapter-klassning) och Fas 5.5 (mutation-mönster) — båda är *nya* faser i byggplanen som inte finns i conversion-plan. P1 låser deras placering.

### Fas 6.5
- **Klassade rader:** 2. Fördelning: 0 oförändrad-explicit, 2 behöver justering, 0 behöver omformuleras, 0 försvinner. (Övriga påståenden oförändrade-implicit.)
- **Öppen P1-fråga:** Hur klargörs förhållandet mellan `trace_id` och `requestId` — distinkta korrelerade IDs (alt. a) eller sammanslagna (alt. b)? Beslutet behövs innan `FEATURE-ACTIVITY-LOG.md` uppdateras i P2.
- **Öppen P2-fråga:** `SECURITY-SPEC.md` får ärva `requestId`-mönstret från Fas A M7; `FEATURE-ACTIVITY-LOG.md` bör justeras därefter samt anpassas till operations-API-mönstret.

### Fas 7
- **Klassade rader:** 5. Fördelning: 0 oförändrad-explicit, 4 behöver justering, 1 behöver omformuleras, 0 försvinner. Två av "behöver justering"-raderna är *tillägg* — bullets som saknas i conversion-plan och måste läggas till i byggplanen.
- **Öppen P1-fråga:** Behåll Background Sync (offline-närvaro) i Fas 7, eller defer till Fas 8 om Fas 7-scope blir för stort?
- **Öppen P3-anteckning (städnings-DoD):**
  - **Tre ADR:er som P3 ska skriva** (konsoliderad katalog — refereras från Fas 0.1, Fas 4.1 och Fas 7.3 i klassningstabellen):
    1. **CSP-plugin-deferral** i `vite.config.ts` — referens: Fas 0.1 + Fas 7.3 + direktiv §8.5.6
    2. **Conversion-plan → byggplan-skiftet** — referens: direktiv §12 ("ramen 'konvertering' var efterlöpare")
    3. **Fas 4-borttagningen** (DataTable flyttad till Fas 7) — referens: Fas 4.1 + direktiv §12 ("Numreringsnot: Det 'saknas' en Fas 4")
  - PostCSS audit-fix verifierad eller medvetet defer:ad (direktiv §8.5.6 — "Kan tas som sidofix när som helst")
  - Vy-namn i design-audit-skriptet uppdaterade (Hem/Mer/AppShell — referens Fas 7.4)

---

## Pass-status

| Pass | Faser | Status |
|---|---|---|
| 1 — Setup + KLARA + oförändrade | Fas 0, Fas 1, Fas 6.5 | ✅ KLAR + GODKÄND |
| 2 — Mellantunga UI-faser | Fas 2, Fas 3, Fas 5 | ✅ KLAR + GODKÄND |
| 3 — Tyngsta + slut | Fas 6, Fas 7, ~~Fas 4~~ | ✅ KLAR + GODKÄND |

**Stop-test (direktiv §6 P0):** Varje fas i conversion-plan §D klassad — *oförändrad* / *behöver justering* / *behöver omformuleras* / *försvinner*. Status:

| Fas | Klassade rader | Av ca bullets | Stop-test |
|---|---|---|---|
| Fas 0 | 2 | 30 | ✅ |
| Fas 1 | 1 | 18 | ✅ |
| Fas 2 | 4 | 33 | ✅ |
| Fas 3 | 3 | 50 | ✅ |
| ~~Fas 4~~ | 1 | 1 | ✅ |
| Fas 5 | 3 | 40 | ✅ |
| Fas 6 | 6 | 55 | ✅ |
| Fas 6.5 | 2 | 14 | ✅ |
| Fas 7 | 5 | 40 | ✅ |
| **Totalt** | **27** | **~281** | **✅** |
