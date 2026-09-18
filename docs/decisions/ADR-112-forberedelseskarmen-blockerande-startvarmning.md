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

## Updates

### 2026-09-18 — Räknarens semantik preciserad: `klara` är SETTLADE, inte LYCKADE (TASK-451.2)

Kallstartens diagnoskarta
(`docs/research/kallstarten-diagnoskarta-2026-09-18.md` § 2.3) avtäckte en
blind fläck i hur beslut 1 och beslut 3 ovan formulerats: texten resonerar
genomgående som om `klara = totalt` ⇒ data finns i cachen. Så var inte
fallet. `startvarmningen.ts` räknade från början (TASK-218.1) SETTLADE
hämtningar — lyckade OCH misslyckade, ökat i varje items `.finally()` — inte
bara lyckade; en MEDVETEN designpunkt för barens skull (den ska nå 100 % när
motorn är klar, oavsett enskilda EF-fel, annars fryser den på ett enda fel).
Konsekvensen var oavsiktlig: en startvärmning där SAMTLIGA sju hämtningar
fallerade gick igenom identiskt med en där alla sju lyckades
(`utfall: 'klar'`, `klara: 7 av 7`, baren 100 %), och den enda
observability-kanalen (beslut 3, task-240) fyrar ENDAST vid timeout — noll
spår lämnades för detta, det vanligaste felfallet.

**Fixat (TASK-451.2), beslut 1/3s bokstav orörd:**

- `StartvarmningForlopp` bär nu `lyckade`/`misslyckade` separat.
  `klara`/`totalt` behåller OFÖRÄNDRAT sin roll som barens drivning
  (Förberedelseskärmens kontrakt "X av N hämtningar klara" syftar
  fortsatt på SETTLADE, inte lyckade — ORDLISTA.md-posten preciserad i
  samma skiva).
- `StartvarmningUtfall` fick ett fjärde värde, `'klar-ofullstandig'`:
  samtliga sju settlade, men minst en misslyckades. `'klar'` betyder nu
  striktare "samtliga sju settlade OCH samtliga lyckades".
- En ANDRA, separat Sentry-varning (tagg `warmup: 'delvis-fel'`, skild från
  den befintliga `timeout-partial`-mätserien som är HELT ORÖRD) fyrar
  närhelst `misslyckade > 0`, oavsett om avgörandet kom via timeout eller
  "alla settlade" — med antal och item-namn (interna diagnostik-etiketter,
  aldrig personuppgifter) i `extra`.

Beslut 1 och 3 kräver ingen omprövning — det som var fel var en OUTTALAD
premiss i hur räknaren TOLKADES utanför modulen, inte den blockerande
warmup-designen, determinate-baren eller den hårda timeouten själva.

### 2026-09-18 — Baren degraderar till OBESTÄMD vid `klara === 0`, tills första hämtningen settlat (TASK-451.1)

Samma diagnoskarta (`docs/research/kallstarten-diagnoskarta-2026-09-18.md`
§ 1.4–1.5, § 6 punkt 1) avtäckte en ANNAN, oberoende blind fläck i beslut 1:
"äkta determinate bar (X av N hämtningar klara)" beskrev inte det verkliga
förloppet mellan skärmens första målning och FÖRSTA settlade hämtningen.
`klara` är per konstruktion 0 i det fönstret (auth-fasens platshållare
`FORBEREDELSESKARM_VANTAR = {klara:0, totalt:1}` OCH startvärmningens
verkliga `totalt:7` innan något settlat — se `klara`-räknarens semantik i
föregående post ovan), vilket renderade en `width: 0%`-fyllnad: en osynlig,
stillastående yta. Marcus prod-observation ("ingen loadingbar kördes",
2026-09-18) var alltså inte ett fel i implementationen av beslut 1 — det VAR
implementationen, bara ett tillstånd beslutstexten inte namngav.

**Fixat (TASK-451.1), beslut 1:s bokstav preciserad, inte omprövad:**

- Baren degraderar till INDETERMINATE närhelst `klara === 0` — branschmönstret
  för en determinate-bar utan känt delresultat att visa (Material Design 3,
  "Progress indicators": indeterminate "when the wait time is unknown"; W3C
  APG meter/progressbar: en obestämd progressbar bär ALDRIG `aria-valuenow`).
  Implementerat med `react-aria-components`' `<ProgressBar isIndeterminate>`
  (samma bibliotek widgeten redan byggde på) — biblioteket äger kontraktet,
  ingen egen ARIA-hantering skrivs i komponenten.
- Visuellt ett svepande segment i samma fyllnadsfärg/kontrast-token som den
  determinate baren (ingen ny färg, inget nytt kontraktsbevis) — under
  `prefers-reduced-motion: reduce` en STATISK men SYNLIG form, aldrig en
  osynlig 0-bredd.
- Övergången till determinate "X av N" sker automatiskt så fort `klara` ökar
  till 1 (ingen egen tröskel), med ett uttalat inträdesfacit (väximerar från
  0 %, aldrig ett hopp eller en ärvd bredd från det obestämda segmentet —
  mätt i riktig webbläsare, `Forberedelseskarm.spec.ts`s övergångstest).
- INGEN NY SYNLIG TEXT (task-273.6 § "rensas till enbart loadingbaren" står
  kvar oförändrad) — rörelsen bor uteslutande i baren själv.

Beslut 1 kräver ingen omprövning: den blockerande warmup-designen, den
hårda timeouten och "X av N hämtningar klara"-kontraktet (föregående post)
är ORÖRDA. Det obestämda delläget är en precisering av VAD baren visar
INNAN den har ett X att visa, inte ett nytt beslut om NÄR den visas.
