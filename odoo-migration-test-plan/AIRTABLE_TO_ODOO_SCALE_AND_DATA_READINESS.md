# Airtable To Odoo Scale And Data Readiness

## Verifierad Lokal Data

`docs/reference/data-model.md` verifierar 18 Airtable-tabeller och 358 fält per 2026-04-28. Användarens uppgift om cirka 20 tabeller, tusentals rader och nästan 500 personer ligger nära repots verifierade struktur, men exakta aktuella radantal måste hämtas från Airtable/export.

## Kärnentiteter

- `Eventplanering`
- `Anmälningar`
- `Personer`
- `Deltaganden`
- `Väntelista`
- Leads/erbjudanden/engagemang/touchpoints
- Mail/segment/utskickslogg

## Bedömning

Volymen är tekniskt liten/medium för Odoo. Den svåra delen är semantisk:

- statusmapping,
- relationer mellan person, anmälan, event och deltagande,
- historisk närvaro,
- dubbletter via e-post,
- persondata/GDPR,
- betalningsstatusar utan att skapa skarpa fakturor.

## Data Som Behövs I Körning 3

Placera exporter i `odoo-migration-workbench/source-exports/`:

1. CSV/JSON för `Eventplanering`.
2. CSV/JSON för `Anmälningar`.
3. CSV/JSON för `Personer`.
4. CSV/JSON för `Deltaganden`.
5. CSV/JSON för `Väntelista` om relevant.
6. Schema/export med field IDs och field names.
7. Små samplefiler med anonymiserad data om full export inte ska delas.
