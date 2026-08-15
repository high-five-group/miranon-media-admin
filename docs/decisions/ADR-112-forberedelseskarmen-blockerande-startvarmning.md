# ADR-112: Förberedelseskärmen — blockerande startvärmning som Airtable-kompensation

- **Status:** Accepted
- **Datum:** 2026-08-15
- **Fas:** Go-live (Lotta-vandringen, S102)

## Kontext

Marcus beställning i Lotta-vandringen (S102 Del 7, 2026-08-15): efter
inloggning ska en laddskärm med logotyp, progress-bar och texten
"Förbereder ditt administrationsverktyg" visas, och när den släpper ska
ALLA flikars kärndata vara varm — inte bara hem-vyns. Bakgrunden är mätt
upplevelse: 6–7 sekunders skeleton-regn vid kall start.

Research-passet
([`app-startup-warmup-splash-2026-08-15.md`](../research/app-startup-warmup-splash-2026-08-15.md))
visade att branschledarna i klassen (Linear, Figma) går motsatt väg —
progressiv, icke-blockerande uppstart — men att deras förutsättning är
laddtider under sekunden (lokala synk-motorer). Vår kallstart är långsam av
ett strukturellt skäl: Airtables rate-limit 5 req/s/bas
([`airtable-constraints.md`](../reference/airtable-constraints.md) P4) och
sekventiella EF-hämtningar. NN/g sanktionerar determinate progress-bar för
flerstegsförlopp; skeleton är per samma källor fel verktyg för väntor i
denna längdklass. Avvägningen grillades till kvitterad samsyn (S102 Del 7,
beslut 1–6).

## Beslut

1. **Blockerande startvärmning.** Efter auth-resolution vid kall/stale
   cache körs en warmup-fas som förvärmer samtliga flikars kärn-queries;
   under tiden visas Förberedelseskärmen med äkta determinate bar
   (X av N hämtningar klara) och den Marcus-låsta texten. Detta är ett
   MEDVETET avsteg från Linear/Figma-mönstret, motiverat av
   Airtable-latensen — inte en allmängiltig preferens.
2. **Helt tyst vid varm start.** Är persist-cachen färsk visas ingen skärm
   alls — det befintliga E2E-kontraktet (varm/offline-start utan synlig
   laddning) består orört och är regressionsgolvet.
3. **Skyddsräcken.** Offline vid start ⇒ ingen Förberedelseskärm (appen
   öppnar på persisterad data; utan gaten hänger en väntande hämtning för
   evigt under `networkMode: 'online'` — verifierat mot TanStack-källkoden).
   Hård timeout ~8–10 s ⇒ TYST släpp in i appen med det som hann bli
   varmt; resterande ytor bär sina vanliga laddlägen.
4. **Hämta en gång, dela.** Hem-kortens poll-nycklar och listornas nycklar
   bär samma underliggande data (ADR-017-separationen). Warmup hämtar varje
   datamängd EN gång och seedar båda nyckelfamiljerna; poll-scopet består.
   Payload-identiteten verifieras vid bygget — spricker den faller vi
   ÖPPET tillbaka till dubbelhämtning.
5. **Ingreppspunkten är ADR-037:s befintliga render-gate** (auth-resolution)
   — warmup körs en gång per auth-resolution, inte per navigation.
   Förberedelseskärmen ersätter appnivåns två nakna "Laddar…"-textrader.
6. **Router-loaders ingår INTE.** Djuplänks-gapet (kall cache + direktlänk
   till detaljyta) är ett separat spår i tråd T90.

## Konsekvenser

- Kallstarten byter 6–7 s oförutsägbart skeleton-regn mot en ärlig,
  ändlig förloppsindikator; flikbyten efter släpp är omedelbara.
- Varje NY flik/kärnvy ska ta ställning till om dess data ingår i
  warmup-setet — det är en stående designpunkt vid vy-tillskott.
- Bokförs som v1-kompensation i `airtable-constraints.md` (post P31):
  **omprövas vid Fas E** — med Supabase-latens blir skärmen självdöende
  via tyst-vid-varmt-regeln (beslut 2), och den blockerande formen ska då
  prövas mot branschriktningen igen i stället för att ärvas.
- Laddtrappans regelverk (vilken indikator på vilken yta) ägs av
  [ADR-113](ADR-113-laddtrappan-yttrappa-for-laddindikatorer.md);
  Förberedelseskärmen är trappans "determinate bar"-steg på appnivå.
