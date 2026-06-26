# ADR-065: Segment-regel-persistens — typad JSON i nytt `App-segmentregel`-fält i den befintliga Segment-tabellen

- **Status:** Accepted
- **Datum:** 2026-06-26
- **Fas:** 6g (Segment-yta) — konkretiserar [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) (segment-definitionens persistens); lyder [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) (resolution I BASEN).

## Kontext

Fas 6g L1+L2 (Session 35) byggde segment-byggar-ytan: Lotta väljer include/exclude-par över den domän-härledda taxonomin och får medlemskap on-demand via `compute-segment` (beräknat från KÄLLAN, strikt `Närvaropoäng=1`). Regeln finns hittills bara i klientens session-state — den kan inte SPARAS. L3 inför persistens: en namngiven, sparad segment-regel som kan laddas, räknas om och senare frysas/exporteras (L4). Detta beslut (L3:s L0) väljer persistens-formen och -målet.

Valet görs mot ett FAKTISKT live-tillstånd (forensiskt pre-pass, Session 36 orientering): Segment-tabellen (`tbll2N6JKCj4u6y9o`, prod-basen `app8uGPrVCVOm6LfD`) finns redan och bär de 9 legacy-segmenten som Make-scenariot läser via `Segmentformel` (en `filterByFormula`-sträng mot Personers rollups). Vår app-regel är däremot TYPAD JSON (`{ include: Par[], exclude: Par[] }`, formen från `_shared/segment-membership.ts`) — inte en formel-sträng. Tabellen saknar ett dedikerat fält för en strukturerad regel; de tre långtext-fälten (`Segmentformel`, `Segmentdefinition`, `Beskrivning`) är semantiskt upptagna.

[ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) beslut 7 slog fast att Make ska kunna deprecieras och de 9 legacy-segmenten migreras gradvis in i app-modellen. Detta beslut väljer persistens-formen så att migrationen blir en flytt INOM samma tabell, inte en cross-tabell-operation.

## Beslut

1. **En sparad app-segment-regel persisteras som TYPAD JSON** (`{ include: Par[], exclude: Par[] }`, formen från `_shared/segment-membership.ts`) i ett NYTT dedikerat fält i den BEFINTLIGA Segment-tabellen — inte en separat tabell, inte `Segmentformel` (Make-läst), inte `Segmentdefinition` (klartext-spegel).

2. **Fältnamn (låst): `App-segmentregel`** (multilineText). Namnet skiljer appens strukturerade regel från `Segmentformel` (Make-formeln) och `Segmentdefinition` (klartext) — tre snarlika "Segment\*"-fält vore annars otydliga för en icke-teknisk läsare (Gunilla-principen; basen är mall-redo, [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md)). Fält-beskrivningen sätts Gunilla-begriplig. **Övergångs-not:** "app-"-prefixet är medvetet temporärt — vid post-Fas-6-bas-maximeringen, när `Segmentformel` fasas ut, kan prefixet bli överflödigt och fältet döpas om. Det registreras (T16), tappas inte.

3. **App-segment-radens form:** `Namn på segment` ← segmentets namn; `App-segmentregel` ← `JSON.stringify(rule)`; `Segmentdefinition` ← den svenska klartext-spegling som byggar-ytan redan genererar. `Segmentformel`, `Antal i segment` och `Beräkna`-knappen lämnas ORÖRDA (Make-vägen, rivs ej mitt-i-flykt).

4. **`App-segmentregel` är MIGRATIONS-MÅLET** dit de 9 legacy-formelsträng-segmenten gradvis flyttas, varefter Make-scenariot deprecieras. Deprecierings-/migrations-vägen ÅTERGES INTE här — se [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) beslut 7 + tråd T16 (en sanning, ett ställe).

5. **Make-bortkoppling + legacy-migration = post-Fas-6 / Supabase-scope, EJ 6g.** 6g inför fältet och app-write-vägen; den faktiska legacy-flytten + Make-deprecieringen sker senare.

6. **Formen speglar Supabase-målmodellens `definition jsonb`** ([ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md):s migrationsväg) → en sparad regel portar rent när datalagret byts, utan omformning.

7. **Schema-tillägget görs via Code MCP, STAGING FÖRST sedan PROD, additivt, verifierat** (senare pass — denna landning är rent dok). Blast-radius: Segment-tabellen ligger i den delade prod-basen (Psionautics-gäst, automationer A1–A11); tillägget är ett NYTT fält och rör inget befintligt fält → låg blast-radius. Fält-skrivbarhet och teckenexakt fält-namn verifieras mot live-schema FÖRE write (L140/L194).

## Alternativ som övervägdes

- **Separat App-segment-tabell.** Avvisad: gör legacy-migrationen (beslut 4) till en cross-tabell-flytt och krockar med ADR-062 beslut 7:s migration in i samma modell.
- **Återanvänd `Segmentformel`.** Avvisad: Make läser fältet som `filterByFormula` — typad JSON där skulle bryta Make-läsaren mitt-i-flykt.
- **Återanvänd `Segmentdefinition`.** Avvisad: fältet bär den människoläsbara klartext-speglingen; JSON där förstör klartext-semantiken och Gunilla-läsbarheten.
- **Supabase-persistens nu.** Avvisad: föregriper migrationen; Supabase är ett separat senare spår (ADR-063), inte en ersättning som aktiveras mitt i 6g.

## Konsekvenser

**Positiva:** första app-drivna schema-tillägget mot basen (additivt, låg blast-radius); ett namngivet migrations-mål för de 9 legacy-segmenten etableras; formen portar rent mot Supabase-målmodellen (`definition jsonb`).

**Negativa / skuld:** ännu ett "Segment\*"-fält i en redan fält-rik tabell; "app-"-prefixet är en övergångs-etikett som kan behöva döpas om vid bas-maximeringen (registrerat T16); den faktiska legacy-migrationen + Make-deprecieringen återstår (post-Fas-6).

## Relaterat

- [ADR-062](ADR-062-segment-yta-berakn-medlemskap-fran-kalla.md) — segment-yta + beslut 7 (Make deprecierbar, 9 legacy-segment migreras); konkretiseras här (persistens-formen).
- [ADR-063](ADR-063-airtable-bas-som-forstklassig-leverabel.md) — Airtable-basen som förstklassig leverabel; resolution I BASEN; styr namn-/mall-kvaliteten.
- [ADR-064](ADR-064-segment-taxonomi-fran-domanen-strikt-narvaro.md) — taxonomin; formen på `Par` som JSON:en bär.
- [ADR-060](ADR-060-sentinel-setup-purge-create-conformance.md) — create-write-conformance-konventionen som write-vertikalen (senare pass) följer.
- T16, `docs/reference/data-model.md` §Kända fällor — migrations-/maximerings-registret.
