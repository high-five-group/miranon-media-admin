# ADR-072: Klient-persist av query-cachen med skyddsräcken (persistQueryClient)

- Status: Accepted (Session 63 — 2026-07-12; grillad samsyn S63 Del 2
  [5 beslut, samtliga på Code-rekommendation med Marcus-kvittens per fråga];
  kanonisk samsyns-trail: `tasks/sessions/archive/2026-07/2026-07-12-session-63.md` Del 2)
- Datum: 2026-07-12
- Fas: Session 63 — task-7-designen, lugnt laddläge (ingen
  byggfas-status-ändring)

## Kontext

Granskningsfyndet S62 (task-7): kallstartens laddläge underkändes i Marcus
design-review — kollapsade kort och "Laddar…"-textrader som växer när datat
landar. Marcus-kravet: "inget ska röra sig, helst inget synligt laddande
alls — det ska bara vara där." Persist-cache är mekanismen som realiserar
kravet: appen öppnar med senast kända data direkt, och kallstarten existerar
i praktiken bara allra första gången på en enhet. persistQueryClient var
bokförd som senare förfining (PRD TASK-4 beslut 10 + defer-notering i
poll-lagrets QueryClient-konfiguration); task-7 var den förfiningens
designtillfälle.

Beslutet är samtidigt ett säkerhetsbeslut: Lottas admin-data (namn,
e-postadresser, betalstatus) skrivs okrypterad till webbläsarens
localStorage. Research käll-verifierad i grillningen (S63 Del 2): OWASP
avråder känslig data i localStorage (XSS är hotklassen); local-first-
branschen (Linear-klassen) persistar medvetet arbetsyte-data okrypterat med
enhets- och sessionsskydd som antagen nivå; TanStack-dokumentationens
mekanik (maxAge/gcTime-varningen, buster, clear()-mönstret vid utloggning)
verifierad mot officiell dokumentation och maintainer-svar.

ADR-baren nås 3/3: (1) svårt att återställa i koherens — mekanismen sitter
på QueryClient-nivån och offline-strategin (SECURITY-SPEC §Offline auth),
Fas 8:s Background Sync (ADR-019) och varje ny vy bygger ovanpå;
(2) överraskande utan kontext — "varför ligger persondata okrypterad i
localStorage?" kräver hotmodell-resonemanget nedan; (3) verklig avvägning —
tre alternativ (full persist / selektiv / ingen) vägdes med konkreta skäl.

## Beslut

1. **Hela query-cachen persistas** via TanStack Querys
   persistQueryClient-mekanism (synkron localStorage-persister,
   PersistQueryClientProvider-formen).
2. **Skyddsräcke 1 — logout-rensning:** utloggning tömmer cachen via
   `queryClient.clear()` (maintainer-bekräftade mönstret — minnescachen
   synkas då tom till disk; manuell radering av lagringsnyckeln racear mot
   throttle-synken ~1 s och används inte).
3. **Skyddsräcke 2 — livslängd:** maxAge 24 h (bibliotekets default), och
   gcTime för persistade queries höjs till ≥ maxAge (dokumenterad GC-fälla:
   lägre gcTime kasserar lagrad cache i förtid).
4. **Skyddsräcke 3 — versionsgräns:** buster = den build-injicerade
   app-versionen; cache skriven av annan version kastas vid restore.
5. **Poll-kontraktet orört:** restaurerad data är stale per gällande
   staleTime → tyst bakgrundshämtning per osynlighets-mekaniken (B3,
   task-4.5). Persist ändrar INTE ADR-017:s poll-lager.
6. **Selektiv persist** (`shouldDehydrateQuery`) är den dokumenterade
   framtida ratten om enskilda queries ska undantas — inte i bruk nu.

## Hotmodellen (avvägningen öppen)

localStorage är JS-åtkomlig → XSS-exfiltrering är hotklassen, och OWASP:s
avrådan bokförs öppet. Vägande skäl ändå: Supabase-refresh-tokenen ligger
REDAN i localStorage (~1 vecka, SECURITY-SPEC) — den som kan läsa Lottas
localStorage har redan nyckeln till hela datakällan, så persistad läs-cache
tillför ingen ny exponeringsklass på samma enhet. Enheten är personlig och
inloggningsskyddad, och SECURITY-SPEC:s offline-vision ("appen visar senast
cachad data") förutsätter mönstret. Omprövning triggas om enhetsmodellen
ändras (delade datorer): då är selektiv persist, sessionStorage eller
krypterat lager alternativen — beslut 6 är den förberedda ratten.

Förkastade alternativ: **selektiv persist** (Hem-värdet ÄR anmälningarna
och obetalda avgifter — utan dem missar mekanismen målet; gränsdragningen
känslig/okänslig blir underhållsbörda) · **ingen persist** (kallstarten
kvarstår varje besök; missar Marcus-kravet — skeleton blir vardag i stället
för sällsynt fallback).

## Konsekvenser

- Kallstarten upphör i praktiken; skeleton-laddläget (PRD:ns andra halva)
  blir sällsynt fallback (allra första gången, efter utloggning, efter
  versionsbyte).
- Offline-öppning visar senast kända läge — SECURITY-SPEC-visionens mönster
  realiserat för läsvägen (skrivköer förblir Fas 8, ADR-019).
- PII på disk enligt hotmodellen ovan — omprövningsvillkoret är explicit.
- gcTime-höjningen ger marginellt större minnesprofil för persistade
  queries (24 h-fönster i stället för 30 min).

## Referenser

- Grillad samsyn: `tasks/sessions/archive/2026-07/2026-07-12-session-63.md` Del 2 (research-
  fynden käll-länkade via S63:s research-agent: TanStack persistQueryClient-
  dok + maintainer-diskussion #3782, OWASP HTML5 Security Cheat Sheet,
  Linear-sync-reverse-engineering)
- task-7 (design-kortet) + PRD-kortet "PRD: Lugnt laddläge" (skivorna bär
  exekveringen)
- SECURITY-SPEC §Offline auth · ADR-017 (+erratum, poll-lagret) · ADR-047
  (nätverkslägen B5) · ADR-019 (Background Sync = Fas 8)
