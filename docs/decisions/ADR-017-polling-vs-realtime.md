
# ADR-017: Hybrid polling 60s + pull-to-refresh, Realtime defer:as till Fas E

- **Status:** Accepted
- **Datum:** 2026-05-05 (skrivs i P3a, implementeras i Fas 6d)
- **Fas:** 6d (Hem-aggregering)

> **Erratum (Fas 6d L2, 2026-06-23 — implementations-avstämning mot aktuell TanStack
> Query v5):** Beslutet förblir **Accepted** och rivs INTE i sin helhet; detta erratum
> håller det sant mot v5-verkligheten + a11y-golvet. Det är ett erratum, inte en
> supersede — inget nytt ADR-nummer, README-räknaren rörs ej. **§1** (refetchInterval
> 60s + `refetchIntervalInBackground: false`) och **§5** (Realtime-migrationsväg, Fas E)
> står **ORÖRDA**. Ändringar:
>
> - **§3 (egen `visibilitychange`-handler) RIVS — MEKANIKEN, inte intentionen.**
>   v5:s inbyggda `focusManager` lyssnar själv på `visibilitychange` (focus-eventet
>   togs bort som default i v5 pga fallgropar), och `refetchOnWindowFocus` refetchar
>   vid fokus **endast om queryn är stale**. Global `refetchOnWindowFocus: true`
>   (`src/router.ts`) + per-query `staleTime: 30_000` på dashboard-grenen ger därför
>   IDENTISKT beteende som §3:s "refetch om data > 30s vid återkomst" — utan en rad
>   egen kod. Att bygga egen handler vore att återimplementera bibliotekets kärna
>   (dubbelriktad över-engineering-vakt). §3:s INTENTION (fresh data när Lotta växlar
>   tillbaka) bevaras; bara mekaniken ändras. Källa: TanStack Query v5-doc,
>   `reference/focusManager.md` + `framework/react/guides/window-focus-refetching.md`.
> - **§2 (touch-gesture pull-to-refresh) NYANSERAS till `<RefreshButton>` →
>   `invalidateQueries({ queryKey: dashboard.all })`.** Skäl: a11y-11 (en knapp är
>   tangentbordsnåbar + skärmläsbar; touch-drag är svårt WCAG-konformt) + testbarhet
>   utan touch-emulering + `STATE-STRATEGY.md §5b`-precedensen (senare, genomtänkta
>   källan). `invalidateQueries` markerar stale (åsidosätter `staleTime`) + refetchar
>   renderad query i bakgrunden = rätt semantik för manuell refresh. Touch-drag kan
>   adderas som progressiv förbättring senare.
> - **§4 `gcTime: 5_60_000` RÄTTAS till `300_000`.** Uppenbar typo: `5_60_000` =
>   560 000 ms ≈ 9,3 min, inte de avsedda 5 × 60 000 = 300 000 ms (5 min).
>
> Implementation: `src/components/hem/useDashboardData.ts` (polling-options) +
> `src/components/hem/RefreshButton.tsx`. Verifiering (Fas 6d DoD nedan) speglas mot
> detta erratum: ingen egen `visibilitychange`-handler byggs; "visibility-trigger"
> uppfylls av v5-focusManager + `staleTime: 30_000`.
>
> **Updates (task-4.2, 2026-07-07 — K10-facitet, byggkrav B5):** §2:s manuella
> uppdatera-kontroll (`<RefreshButton>`) **UTGÅR ur Hem-ytan** — designlåsningen
> (S55 Del 12, Marcus-kvitterad) ersätter knappen med "Mina sidor"-platshållaren,
> och §1:s poll-lager + focusManager-mekaniken (erratumets §3-rad) bär färskheten
> ENSAMMA. Beslutet i övrigt orört: §1/§4/§5 står; §2:s intention (en manuell
> refresh-väg) har inte längre någon bärare på Hem och återuppstår endast om ett
> framtida behov visar sig (t.ex. offline-recovery-fallet under §5-migrationen —
> prövas då, byggs inte "ifall"). Osynlighets-kravet på bakgrundsuppdateringar
> (B3) hanteras i task-4.5. Komponentfilen är raderad; historiken bär koden.

## Kontext

Conversion-plan §D Fas 6 nämnde Supabase Realtime som primär refresh-strategi för Hem-fliken (live-uppdatering av "nya anmälningar"-listan). Detta är pre-Fas-E-arkitektur — när conversion-plan skrevs (2026-04-14) var Supabase-target inte låst.

Per B1-beslutet (P1-sessionsdok Del 4): Supabase Realtime defer:as till **Fas E** (Supabase-migration). Skälen:

1. **Realtime-beroende på Supabase som primär datakälla** — i Fas 6 är Airtable primär. Realtime-pseudo-implementation mot Airtable hade krävt egen webhook-pipeline + queue → 2-3 sessioner extra arbete för funktionalitet som ändå rivs ut i Fas E.

2. **Hem-flikens reella krav är "snabbt nog för Lottas operativa flöde"** — inte "live i realtid". Lotta öppnar appen under en eventbokning, kollar nya anmälningar, agerar på dem. Latency-tolerans: 30-90 sekunder. Realtime är överkill.

3. **Empirisk data om refresh-frekvens-behov saknas.** Production-instrumentering kommer i Fas 7. Att låsa Realtime nu är preliminär arkitektur baserad på antaganden.

`STATE-STRATEGY.md §5b` (P2-uppdaterad) dokumenterar polling-mönstret. Denna ADR konsoliderar beslutet + migrationsvägen.

## Beslut

**Fas 6d Hem-fliken implementerar hybrid polling-strategi:**

### 1. Polling-intervall: 60 sekunder

TanStack Query `refetchInterval: 60_000` på `useHemQuery`-hook. Vid `document.hidden === true` pausas polling automatiskt (TanStack default-beteende).

### 2. Pull-to-refresh

Touch-gesture: dra ner från top av Hem-fliken → manuell refetch. Implementerad med React Aria-pattern eller minimal custom touch-handler. Visuell feedback (laddningsindikator) per `prefers-reduced-motion`-respekt.

### 3. Visibility-trigger

`document.visibilitychange` → om hidden→visible och senaste fetch > 30s: refetch omedelbart. Säkerställer att Lotta får fresh data när hen växlar tillbaka till appen från annat sammanhang (Gmail, kalender).

### 4. Stale-while-revalidate på alla read-EFs

`staleTime: 30_000`, `gcTime: 5_60_000`. Vid inom-stale-period-render: cache returneras omedelbart, refetch i bakgrunden om stale.

### 5. Migrationsväg till Realtime (Fas E)

Vid Fas E-aktualisering, **ny ADR skrivs som superseder denna** (`Supersedes ADR-017`). Realtime-implementation:

- Supabase Realtime channels per relevant tabell: `registrations`, `events`, `persons`
- Klient subscriberar till channels från Hem-fliken
- TanStack Query mottar push från Realtime → `setQueryData` direkt utan refetch
- Polling-strategin (denna ADR) deprecateras — `refetchInterval: false`, `refetchOnWindowFocus: false`
- Pull-to-refresh kvarhålls som manuell fallback (offline-recovery, Realtime-channel-disconnect)

**Trigger för migration:** Fas E aktualisering. Inte tidigare.

## Alternativ som övervägdes

**Alt 1 — Implementera Realtime mot Airtable via egen webhook-pipeline.** Avvisat: 2-3 sessioner extra arbete för pipeline som rivs ut i Fas E. Tekniskt skuld med kort half-life.

**Alt 2 — Kortare polling-intervall (15s eller 30s).** Avvisat: Lotta-användning är ofta-öppna-stänga-mönster, inte hold-app-open-länge. 60s + visibility-trigger ger samma upplevd latency som 15s utan onödiga API-anrop. Airtable-rate-limit (5 req/sek/base) skulle bli stress under dagar med många öppna sessioner.

**Alt 3 — Längre polling-intervall (180s eller 300s) + push-notifications.** Avvisat: push kräver service-worker-permission + native-feel-overhead. Defer:ad till Fas 8 eller senare. För länge på operativ data.

**Alt 4 — Server-Sent Events (SSE) från egen Edge Function som subscribar Airtable webhooks.** Avvisat: pipeline-komplexitet. Samma anti-mönster som Alt 1.

**Alt 5 — Manuell refresh-knapp utan polling.** Avvisat: Lotta tappar lätt bort att klicka. Operativ kostnad i missade nya anmälningar.

## Konsekvenser

**Positiva:**

- Fas 6d implementeras snabbt (0,5 session per estimat) — ingen pipeline-overhead.
- TanStack Query handlar polling, visibility, stale-while-revalidate inbyggt — ingen custom kod för core-mönstret.
- Migrationsvägen är tydligt dokumenterad — Fas E vet exakt vad som ska bytas ut.
- Airtable-rate-limit hålls inom budget även med 10+ samtidiga sessioner (vilket inte händer i praktiken — Lotta är ensam användare).

**Negativa:**

- 0-60s latens för nya anmälningar kontra Realtime:s ~100ms. Mitigation: visibility-trigger + pull-to-refresh täcker majoriteten av Lottas reella refresh-tillfällen. Empirisk data i Fas 7 visar om 60s räcker.
- Polling kostar API-anrop även när inget ändrats. Mitigation: Airtable-rate-limit långt inom budget; Supabase-anrop post-Fas E är obegränsade i Pro-tier.
- Mer kod att rensa ut i Fas E (polling-config, pull-to-refresh-handler kan kvarhållas som fallback). Mitigation: rensning är 30-60 minuters arbete inom Fas E.

**Verifiering (Fas 6d DoD):**

- `useHemQuery` har `refetchInterval: 60_000` + `refetchIntervalInBackground: false`
- Pull-to-refresh fungerar manuellt + Playwright-test grön
- Visibility-trigger fungerar — `document.dispatchEvent(new Event('visibilitychange'))` triggar refetch om stale > 30s
- Inget Supabase Realtime-importerad kod i `src/data/queries/` (verifiera med `grep -r 'realtime' src/`)
- ADR-pekare i `useHemQuery`-fil: `// Polling per ADR-017. Realtime kommer i Fas E.`
