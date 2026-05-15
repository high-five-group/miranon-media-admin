<!-- vale Vale.Terms = NO -->
<!-- DEFERRED: Session 6.6.6 — Vale.Terms canonical-cap fix -->

# FUTURE-COMPAT -- Framtidssakring mot Passionslyftet

*Skapad: 2026-04-07 | Integrerad fran gap-analysis.md (Del 2, punkt 9-10 + Fas 6.5)*
*Galler: miranon-media-admin (React 19 SPA)*
*Relaterat: conversion-plan.md, beyond-best-practices-2026.md (kap. 8)*

---

## 1. Varfor detta dokument existerar

Miranon Media Admin ar inte bara en produkt -- det ar en arkitekturgrund.
DataSourceAdapter, komponentbiblioteket, token-systemet och hooks ska
ateranvandas i **Passionslyftet** (Marcus livsverk: LMS/coaching-plattform
med inre och yttre resa).

Varje arkitekturbeslut i Miranon paverkar hur snabbt och smidigt
Passionslyftet kan byggas. Fel beslut nu = refaktorering senare.
Ratt beslut nu = plug-and-play. 27 sessioner, 12 composables,
4 komponenter pa 11/11/11 -- det ar kapital som maste forrantas.

---

## 2. Arkitekturbeslut som paverkar Passionslyftet

### DataSourceAdapter-monstret

Adaptern ar den viktigaste bron. Samma interface, olika implementationer:
Miranon anvander AirtableAdapter (2 anvandare, enkel rollhantering),
Passionslyftet anvander SupabaseAdapter (hundratals, RBAC med coach/deltagare/gast).

**Forberedelse nu:** Lagg till valfri `trackActivity()` i DataSourceAdapter.

```typescript
// data/adapters/DataSourceAdapter.ts
export interface DataSourceAdapter {
  // Befintliga 15 metoder...
  fetchEvents(): Promise<Event[]>;
  fetchRegistrations(eventId: string): Promise<Registration[]>;
  // ...

  // Framtidssakring: aktivitetsspdrning (default no-op)
  trackActivity?(statement: ActivityStatement): Promise<void>;
}
```

AirtableAdapter implementerar `trackActivity()` genom att skriva till
Airtable "Aktivitetslogg"-tabellen. SupabaseAdapter i Passionslyftet
skriver till `activity_statements`-tabellen med full xAPI-kompatibilitet.

### Komponentbibliotekets ateranvandbarhet

Varje komponent bedoms utifrdn tva perspektiv: loser den Lottas behov
(produkt) och kan den ateranvandas utan andringar (bibliotek)?

| Komponent | Reuse-ready? | Vad behover generaliseras |
|-----------|-------------|--------------------------|
| Button | Ja | Inget -- CVA-varianter ar extensibla |
| Dialog | Ja | Inget -- React Aria-baserad |
| ListItem | Ja | Inget -- generiska props |
| TabGroup | Ja | Inget -- generisk |
| Card | Ja | Inget -- children-baserad |
| StatusBadge | Delvis | configMap ar appspecifik -- extrahera till config-fil |
| MessageBox | Ja | Inget |
| Skeleton | Ja | Inget -- className-baserad |
| TabBar | Delvis | 4 flikar hardkodade -- behover dynamiska items |
| DataTable | Ja (om byggd) | TanStack Table ar headless -- vart wrapper ager bara styling |
| ErrorBoundary | Ja | Inget -- generisk felhantering |

### Token-systemet

Trelagers-arkitekturen (primitiv → semantisk → komponent) ar
framtidssakrad by design. Passionslyftet byter `semantic.css` --
`primitives.css` och `components.css` behalls. Komponenterna marker
inget -- de refererar semantiska tokens, inte primitiver.

**Namespace-konvention:**

| Projekt | Token-prefix | Exempel |
|---------|-------------|---------|
| Miranon Media | `--mm-` | `--mm-primary`, `--mm-accent` |
| Passionslyftet | `--pl-` | `--pl-primary`, `--pl-accent` |
| Delat bibliotek | `--ui-` | `--ui-focus-ring`, `--ui-radius-md` |

Vid behov: refaktorera `--mm-` till `--ui-` for delade komponenter.

---

## 3. xAPI-kompatibelt schema

### Varfor xAPI ar relevant for Passionslyftet

xAPI (Experience API) ar standarden for att spara larande-aktiviteter.
Formatet: Actor + Verb + Object + Result + Context + Timestamp.

Miranon behover inte ett fullstandigt LRS. Men genom att anvanda
xAPI-*format* i aktivitetsloggen fran dag ett far Passionslyftet
en migrerbar datagrund utan omdesign.

### Schema-definition

```typescript
// domain/types/ActivityStatement.ts
export interface ActivityStatement {
  actor_id: string;          // UUID fran auth
  verb: ActivityVerb;        // 'completed', 'updated', 'created', 'viewed', 'sent'
  object_id: string;         // Entitets-ID
  object_type: ActivityObjectType; // 'registration', 'payment', 'event', etc.
  result?: {
    success?: boolean;
    score?: number;          // For framtida bedomningar
    duration?: string;       // ISO 8601 duration
    completion?: boolean;
  };
  context?: Record<string, unknown>;  // Extensible
  timestamp: string;         // ISO 8601
  trace_id: string;          // For felsokning
}

// Miranon-verb: created, updated, deleted, viewed, completed, sent, exported, searched
// Passionslyftet-tillagg: submitted, earned, progressed, enrolled, coached

// Miranon-objekttyper: event, registration, payment, attendance, person, email, lead
// Passionslyftet-tillagg: course, module, assignment, badge, coaching_session, reflection
```

### Migrationsvaag

| Fas | Lagringsplats | Format | Fraga |
|-----|---------------|--------|-------|
| Miranon (nu) | Airtable "Aktivitetslogg" | ActivityStatement (fororenklat) | "Vad hande senast?" |
| Passionslyftet v1 | Supabase `activity_statements` | ActivityStatement (fullstandigt) | "Vad har denna deltagare gjort?" |
| Passionslyftet v2 | Supabase + LRS (Learning Locker/TRAX) | xAPI 2.0 fullstandigt | "Hur later vi utfardda?" |

Samma interface (`trackActivity()`), olika adapter. Miranon lagrar i
Airtable. Passionslyftet lagrar i Supabase. Bada anvander samma
TypeScript-typer. Ingen kod behover skrivas om.

---

## 4. Stripe Entitlements-kompatibilitet

### Miranon vs. Passionslyftet

| Aspekt | Miranon | Passionslyftet |
|--------|---------|----------------|
| Betalning i appen | Nej (Airtable hanterar) | Ja (Stripe Checkout) |
| Prenumerationer | Nej | Ja (manatlig/arsvis) |
| Drip content | Nej | Ja (las nasta modul efter X dagar) |
| Nivabaserad atkomst | Nej | Ja (Bas, Premium, Coach) |
| Team-licenser | Nej | Mojligt (foretag kooper kurser) |

### Forberedelse nu

Designa datamodeller med `accessLevel` fran start. Inte som implementerad funktion -- utan som falt i typerna:

```typescript
// domain/types/AccessLevel.ts (tom i Miranon, anvands i Passionslyftet)
export type AccessLevel = 'public' | 'free' | 'basic' | 'premium' | 'coach' | 'admin';
```

Miranon anvander aldrig `AccessLevel` direkt. Men interfacet existerar
for att Passionslyftet ska kunna implementera Stripe Entitlements utan
att redesigna datamodellen. Flodet: Stripe Checkout → Webhook → Edge Function
→ uppdatera `user.subscription_level` → RLS-policy justerar atkomst →
TanStack Query invaliderar → UI uppdateras.

---

## 5. Open Badges v3

Open Badges v3 ar en W3C-standard (Verifiable Credentials) for digitala
certifikat. Passionslyftet utfardar badges vid kursavslut -- deltagare
visar dem pa LinkedIn, CV, webbplats.

ActivityStatement-schemat stodjer redan badge-utfardande: `actor_id` (vem),
`object_id` + `object_type: 'course'` (vad), `timestamp` (nar),
`result.completion` (godkand), `result.score` (poang). Badge-utfardande
triggas via Supabase Database Webhook nar `result.completion = true`.

Ingen implementation i Miranon. Men schemat ar kompatibelt fran dag ett.

---

## 6. Cal.com-integration

### Relevans for Passionslyftet

- 1:1 coaching-sessioner med bokningsbar kalender
- Tillganglighetshantering (coachens lediga tider)
- Automatiska paminnelser
- Videosamtal (Cal.com + LiveKit/Daily.co)
- Gruppbokningar for workshops

### Forberedelse nu

Miranons Event-modell har redan relevanta falt (`date`, `capacity`,
`location`, `status`) som mappar direkt till Cal.com-koncept.
Cal.com-webhooks floder genom samma adapter-monster som Airtable:
webhooks → Edge Function → DataSourceAdapter → TanStack Query cache → UI.

Inga arkitekturforandringar behovs nu. Cal.com ar open source (self-hosted)
eller managed -- beslutet tas vid Passionslyftet-planering.

---

## 7. LiveKit / Daily.co

Passionslyftet behover live-sessioner (video, breakout rooms, inspelning).
Ingen arkitekturell forberedelse behovs i Miranon -- videoinfrastruktur
ar en fristdende concern.

**Tva alternativ:** LiveKit (open source, self-hosted, full kontroll, hogre
komplexitet) vs Daily.co (managed, enklare, per-minut-pris). Bada har
React SDK. Rekommendation: borda med Daily.co, migrera till LiveKit om
kostnaden eller kontrollen kraver det. Beslutet tas vid Passionslyftet-planering.

---

## 8. Notifikationsstrategi

### Principen: Max 3-5 push per vecka (notification fatigue prevention)

| Kategori | Trigger | Frekvens | Kanal |
|----------|---------|----------|-------|
| Braddskande | Ny anmalan (Miranon), deadine imorrgon (PL) | Direkt | Push |
| Handlingsbara | Obetald pakning, ny modul | Samlad (1x/dag max) | Push |
| Informativa | Veckosammanfattning, framsteg | 1x/vecka | E-post |
| Inspirerande | "Du har slutfort 3 moduler!" | Vid milstolpe | Push + e-post |

### Event-baserat, aldrig broadcast

Ratt: "3 nya anmalningar till Ronninge-eventet" (specifikt, handlingsbart).
Fel: "Nyheter fran Miranon Media!" (generiskt, ignorerant).

Varje notifiering maste svara pa: **Vad ska mottagaren gora nar de laser detta?**
Om svaret ar "inget" -- skicka inte.

### Digest-strategi

Veckosammanfattning istallet for dagliga pings. Miranon: "12 anmalningar,
3 betalningar, nasta event 14 april (8/12 platser)." Passionslyftet:
"Du slutforde modul 3, coachen har lamnat feedback, modul 4 oppnar tisdag."

### Forberedelse nu

Service Worker (Fas 5 i konverteringsplanen) ar grunden for
web-push-notifieringar. Registreringen kostar 5 minuter -- skelett
i `public/sw.js` med `push` och `notificationclick`-handlers.
Implementation av push-logik sker i Passionslyftet.

**Infrastrukturval:** Supabase Database Webhooks + Edge Function (redan i
stacken, lagst troskkel). OneSignal for Passionslyftet om segmentering behovs.

---

## 9. Checklista: Vad ska goras nar?

### Fas 0 (Projektsetup) -- gor nu

- [ ] Lagg till `ActivityStatement` typ i `domain/types/`
- [ ] Lagg till valfri `trackActivity()` i DataSourceAdapter-interfacet
- [ ] Lagg till `AccessLevel` typ i `domain/types/` (tom, for framtiden)
- [ ] Registrera Service Worker-skelett i `main.tsx`
- [ ] Anvand `--mm-` prefix genomgaende (inte `--miranon-`)

### Fas 6.5 (Aktivitetslogg) -- gor nar aktivitetsloggen byggs

- [ ] Implementera `trackActivity()` i AirtableAdapter (logga till Airtable-tabell)
- [ ] Anvand xAPI-verb (created, completed, sent, etc.)
- [ ] Inkludera `trace_id` i varje loggpost
- [ ] Definiera GDPR retention policy (12 manader, sedan anonymisera)

### Passionslyftet (framtid) -- gor nar projektet startar

- [ ] Skapa `SupabaseAdapter` med full `trackActivity()` (Supabase-tabell)
- [ ] Implementera `AccessLevel` med Stripe Entitlements + RLS
- [ ] Integrera Cal.com for coaching-bokning
- [ ] Valja LiveKit eller Daily.co for live-sessioner
- [ ] Implementera Open Badges v3 for kursavslut
- [ ] Konfigurera push-notifieringar (web-push + OneSignal)
- [ ] Skapa `semantic-passionslyftet.css` (nytt tema, samma primitiver)

---

## 10. Riskregister

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|------------|------------|------------|
| Token-prefix `--mm-` ar for specifikt for delat bibliotek | Medel | Massrefaktorering vid Passionslyftet | Planera `--ui-` refaktorering som del av Passionslyftet Fas 0 |
| xAPI-schemat ar for forenklat for riktigt LRS | Lag | Datatransformation behovs | ActivityStatement-typen utokbar via union types |
| Cal.com self-hosted kraver mer underhall an vantat | Medel | Tid forsvinner till infra | Borda med Cal.com Cloud, migrera om noddvandigt |
| Stripe Entitlements andrar API | Lag | Webhook-logik behover uppdateras | Abstrahera bakom adapter (redan gjort) |
| Komponentbiblioteket ar for Miranon-specifikt | Medel | Passionslyftet behover wrappa komponenter | StatusBadge + TabBar behover generaliseras (se sektion 2) |

---

*Dokument: FUTURE-COMPAT.md*
*Relaterade dokument: conversion-plan.md, DESIGN-SYSTEM-SPEC.md, FEATURE-ACTIVITY-LOG.md, beyond-best-practices-2026.md*
*Nasta review: vid Passionslyftet-planering*
