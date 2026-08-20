---
owner: marcus803
updated: 2026-08-20
review_by: 2026-11-20
status: stable
lifecycle: active
---

# T151 — Sentry-kedjan är byggd men inte inkopplad, och ingen har sett vad som ligger där

> Registrerad i S107 (2026-08-20) på Marcus order: *"Viktigt att detta funkar
> asså och är HELT branschledarmässigt!!!"* Triagerad enligt `ADR-053`:
> blockerar inte — appen fungerar — men felrapportering som inte når fram är
> en tyst lucka, och Lotta börjar använda appen inom kort.

## Vad som ÄR på plats (mätt 2026-08-20)

`initSentry()` anropas i `src/main.tsx:72`, **före** React monteras, så tidiga
fel (env-validering, saknat root-element) fångas. React-felen går in via
`createRoot`-hookarna på rad 517–521:

```ts
onUncaughtError:    Sentry.reactErrorHandler(...)   // event handlers, async
onCaughtError:      Sentry.reactErrorHandler()      // boundary-fångade
onRecoverableError: Sentry.reactErrorHandler()
```

`AppError` och `SectionError` rapporterar därmed utan att själva känna till
Sentry — hookarna sköter det. Formen är medveten och dokumenterad i båda
komponenternas docblock.

Konfigurationen (`src/observability/sentry.ts`) är genomtänkt: init körs endast
i prod och staging, `sendDefaultPii: false`, 10 % trace-sampling, och en
`beforeSend` som slänger 4xx (klientfel, inte bugg), `ResizeObserver`-brus och
avbrutna hämtningar.

DSN finns i prod (`VITE_SENTRY_DSN`, satt 2026-05-04) och i `.env.local`.
Organisation `o4511330829795328` (DE-region), projekt `4511330836480080`.

## LUCKA 1 — `reportEdgeFunctionError` har noll anropare

Funktionen finns i `src/observability/sentry.ts` och är byggd för exakt det som
gör felsökning kort: den binder ett frontend-fel till backend-loggens
`requestId` via `scope.setContext('request', { requestId })` och
`scope.setTag('edgeFunction', endpoint)`.

**Ingen kod anropar den.** Mätt med `grep -rn "reportEdgeFunctionError" src/` —
enda träffen är definitionen själv.

Följden: när en Edge Function svarar 5xx fångas felet troligen som ett
generiskt klientfel utan koppling till serverloggen. Kedjan är byggd men inte
inkopplad, och den som felsöker åt Lotta får leta i två system utan en gemensam
nyckel.

**Detta är kort-moget** så fort riktningen är bestämd — det är en avgränsad
inkoppling i fetch-felhanteringen, inte en utredning.

## LUCKA 2 — ingen har sett vad som faktiskt ligger i Sentry

Vi vet att kedjan är konfigurerad. Vi vet **inte** om något kommit in.

Båda utfallen är intressanta av olika skäl:

- **Noll händelser** ⇒ antingen är appen stabil, eller så når felen aldrig
  fram. Skillnaden är avgörande och går inte att gissa.
- **Många händelser** ⇒ vi har haft fel i drift som ingen tittat på, och
  `beforeSend`-filtret bör prövas mot verkligt brus i stället för mot
  antaganden.

Åtkomsten saknas: DSN:en är en **skriv**-nyckel (skickar TILL Sentry). Att
LÄSA kräver en auth token med `event:read` och `project:read`. Ingen sådan
finns i miljön, i nyckelringen eller i `docs/reference/atkomst-och-nycklar.md`
— mätt, inte antaget.

## LUCKA 3 — hör ihop med felmeddelande-arbetet

Marcus koppling, och den är riktig: notis- och felmeddelande-passet
(`docs/research/uppdateringsnotisens-form-och-notisfamiljen-2026-08-20.md`)
handlar om vad Lotta SER när något går fel. Denna tråd handlar om vad VI ser.
De två bör designas ihop, inte var för sig.

Konkret skarv: research-passet fann att `SectionError`:s *"Försök igen"*
strukturellt aldrig kan lyckas vid chunk-fel — den kör om samma import mot
samma saknade fil. Ett fel som Lotta trycker på flera gånger utan att något
händer borde rimligen synas i vår felrapportering. Syns det? Frågan går
inte att besvara utan lucka 2.

## Vad "branschledarmässigt" skulle betyda här

Ej utrett, medvetet öppet. Kandidatfrågor för ett kommande pass:

- **Source maps.** Laddas de upp vid bygget? Utan dem är varje stack trace i
  Sentry minifierad och nästan oläsbar. Ej mätt.
- **Release-taggning.** Kopplas fel till en version, så vi kan se "detta
  började vid deploy X"? Ej mätt.
- **Edge Functions.** Rapporterar server-sidan till Sentry alls, eller bara
  klienten? `grep` mot `supabase/` gav ingen Sentry-träff.
- **Alerting.** Får någon veta när ett nytt fel dyker upp, eller måste man
  öppna dashboarden?
- **User feedback.** `@sentry/react` bär en feedback-widget. Relevant för
  Lotta, eller brus?

## Belägg

`src/observability/sentry.ts` · `src/main.tsx:72` och `:514–521` ·
`src/components/ErrorBoundary/{AppError,SectionError}.tsx` docblock ·
`package.json:60` (`@sentry/react` ^10.69.0) · prod-hemligheten
`VITE_SENTRY_DSN` (2026-05-04) · åtkomstmätning 2026-08-20 (env, nyckelring,
`sentry-cli`, åtkomstregistret — alla negativa).
