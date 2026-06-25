# ADR-062: Segment-yta — beräknat medlemskap från källan (Deltaganden), dynamisk regel med snapshot

- **Status:** Accepted
- **Datum:** 2026-06-25
- **Fas:** 6g (Segment-yta) — ny sub-fas. Ersätter den tidigare 6e-L3-inramningen "Skicka mail".

## Kontext

Fas 6e L3 var inramad som "Skicka mail" (en `send-email` Edge Function, direct-Resend per ADR-015). En forensisk pre-pass mot live-data inför designen avtäckte att inramningen vilade på en halva som aldrig var app-nativ: själva segment-byggandet — att avgöra VEM ett utskick går till — låg i Make.com, inte i appen. Den verkliga funktionen Lotta behöver är en segment-yta: bygga, se, spara och exportera segment av personer utifrån deltagarhistorik. Mail är en av flera nedströms-handlingar man utför PÅ ett segment, inte kärnan.

Akut driver: Miranon Media Community har skapats på plattformen SKOOL. Lotta behöver få ut sex segment av tidigare deltagare för att avgöra modul-/kurs-behörighet. Kärnproblem: samma person kan ha deltagit på flera saker → överlapp är regel, inte undantag.

Tre empiriska fynd grundar beslutet:

1. **Make bär ingen logik.** Scenariot "Beräkna antal i segment" är fyra moduler: webhook → läs segment-radens `Segmentformel` → kör den som `filterByFormula` mot Personer → skriv tillbaka antalet. Segmentet ÄR en Airtable-formel-sträng; Make är en trivial exekutor. Make är ersättbart/raderbart — appen kan göra samma sak.

2. **Personers förberäknade rollups är en lossy projektion av en ren källa.** Live-MCP-verifiering avtäckte tre strukturella luckor: (A) `Totala deltaganden` saknar RIM 3; (B) `Fjärrskådning ×` blandar utbildning + föreläsning, eftersom eventkey-formeln sträng-matchar `Kursnamn="Fjärrskådning"` oavsett Typ; (C) föreläsnings-genomförande och Psionautics surfar aldrig per person. Källan (Deltaganden) är däremot ren och tvådimensionell: (Event-namn × Typ) filtrerat på `Närvaropoäng=1`. En persons sanna deltagar-mängd är härledbar rent därifrån.

3. **Branschledar-research** (HubSpot, Klaviyo, Adobe Real-Time CDP, Salesforce Data Cloud, Twilio Segment, AWS CDP-arkitektur) konvergerar: segment = sparad regel med BERÄKNAT medlemskap; dynamisk default + snapshot för frysning; bygg på beteende-KÄLLAN, inte kumulativa förberäknade flaggor (explicit anti-mönster "öppnings-antal > 3"); inkludera/exkludera med AND/OR; STÄNG data-luckor INNAN segment byggs; on-demand/batch-eval räcker för kampanj-targeting.

## Beslut

1. **Segment = dynamisk regel med beräknat medlemskap.** "Spara som" sparar regeln, inte en lagrad lista. Överlapp omfamnas — en person är med i så många segment som datan kvalificerar.
2. **Medlemskap beräknas från källan (Deltaganden), inte projektionen (Personer-rollupsen).** Alla tre luckor försvinner by construction. Vi lägger INTE nya rollups på Personer (det vore att fördubbla det lossy-mönster som orsakade Lucka B).
3. **Segment-definitionen är strukturerad, typad data** — `include[]` / `exclude[]` över taxonomin (kurs ∈ {Fjärrskådning, RIM 1/2/3, Psionautics} × modalitet ∈ {Utbildning, Föreläsning}) — kompilerad av en motor till en källfråga. INTE handskriven formel-text. Den svenska klartext-speglingen (Gunilla-läsbar) bevaras.
4. **Dynamisk regel + frys-handling.** En "Exportera / Frys"-handling snapshot:ar nuvarande medlemmar till en nedladdningsbar e-postlista (SKOOL-import) och/eller en frusen utskickslista.
5. **Targeting och behörighet = samma motor.** SKOOL-modulåtkomst = unionen av en persons per-(kurs, modalitet)-rättigheter. Mappningen kurs→modul är en config-tabell (Lotta/Marcus fyller; default: kurs→eponym modul).
6. **On-demand-utvärdering.** Beräkna vid öppning/export. Ingen streaming-pipeline, inga materialiserade medlemskaps-tabeller, ingen cron. Taxonomin är 6×2, känd och liten — ledarnas modell i rätt skala, INTE en CDP.
7. **Floor först, befintligt bryts inte.** Korrekthet (modalitet-skiljande), consent (`Ej godkänd för mailutskick` som baslinje på utskick) och dedup-vid-handling är icke-förhandlingsbara. De 9 befintliga filterByFormula-segmenten + Make lever vidare via legacy-vägen och migreras gradvis; Make:s antal-beräkning blir redundant (deprecieras, rivs ej mitt-i-flykt).

**"Enbart X"-semantik (beslutad default):** "enbart föreläsning X" = personens hela närvaro-mängd ⊆ {(X, Föreläsning)} — deltog på den föreläsningen och inget annat alls. Revidérbar via exclude-mängdens config om en smalare betydelse önskas.

**Maximerings-principen (route-around-but-register):** App-sidans korrekthet beräknas från källan och överlever Supabase-migrationen. MEN Airtable-basens avtäckta brister (Luckor A/B/C) registreras som data-modell-maximerings-kandidater — aldrig tyst förkastade (ADR-053 ledstjärna). Två parallella spår mot 11/10: app-side-korrekthet (migrations-överlevande) + Airtable-bas-maximering (registrerad, oberoende prioriterad).

## Alternativ som övervägdes

- **Väg A — lappa Airtable-rollupsen** (nya per-person-fält: FS-utbildning ×, FS-föreläsning ×, RIM-föreläsning ×, Psionautics ×, fixa totaler). Avvisad: fördubblar den lossy-projektion som ORSAKADE Lucka B, muterar prod-schemat (87 fält → fler), behandlar symptomet. Bygger korrekthet på sträng-matchning.
- **Väg B via streaming/materialiserings-motor.** Avvisad: över-engineering för hundratals rader. On-demand/batch-eval räcker för kampanj-targeting; en kontinuerlig pipeline vore en lösning utan ett problem i denna skala.
- **Behåll filterByFormula-sträng som primärt definitions-format.** Avvisad som primär: freeform-strängen gjorde Lucka B osynlig (sträng-match) och är inte typad/granskbar. Strukturerad definition är granskbar och portar mot Supabase `definition jsonb`. Legacy-strängarna behålls under övergång.
- **Skicka-mail först (original L3-ordning).** Avvisad: bulk-mail behöver segment-motorn för att lösa mottagare; mail är nedströms ett segment. ADR-015 står oförändrad, refereras när mail-handlingen byggs (efter 6g).

## Konsekvenser

**Positiva:** korrekt by construction — luckorna kan inte återuppstå eftersom motorn läser sanningen; överlapp omfamnas; SKOOL löses via snapshot-export; portar rent mot Supabase-målmodellen (`marketing_segments` + `definition jsonb`, research 06b); Make blir deprecierbar.

**Negativa / skuld:** mer EF-/beräknings-logik nu än en enkel filterByFormula-fråga; de 9 befintliga segmenten samexisterar och migreras gradvis snarare än återanvänds direkt; Airtable-rollupsen förblir kända-lossy tills data-modell-maximeringen ev. åtgärdar dem — registrerat till T16, ej blockerande för 6g.

**Migrationsväg:** on-demand app-side källfråga nu → Supabase view/feature-table + SQL/dbt-transform senare; samma (Event-namn × Typ × närvaro)-logik portar. `definition jsonb` finns redan i målmodellen (research 06b).

## Relaterat

- Ersätter inramningen i Fas 6e L3; byggplan §4 uppdateras (6e slutar vid Maillogg; 6g = Segment-yta; mail-handling efter 6g).
- ADR-015 (send-email direct-Resend) — oförändrad, refereras vid mail-handlingens bygge.
- ADR-053 (oväntat-triage) — detta beslut är utfallet av en blockerande-arkitektonisk eskalering.
- T16 (data-modell-reconciliation) — Luckor A/B/C + Make-trivialitet registreras dit som maximerings-kandidater.
