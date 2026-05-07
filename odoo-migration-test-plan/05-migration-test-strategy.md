# Migration Test Strategy

## Första Importtest

1. Skapa Odoo duplicate/test database.
2. Exportera små anonymiserade samples från Airtable.
3. Verifiera Odoo importfält via UI export/import preview eller `/doc`.
4. Importera i ordning: contacts -> events -> tickets/questions -> registrations -> answers/attendance.
5. Läs tillbaka och jämför relationer.

## Första Dataset

- 2-3 events.
- 5-10 personer.
- 5-15 anmälningar.
- 5-20 deltaganden om attendance ska testas.
- Bara fake/anonymiserad data.

## Acceptance Criteria

- Inga dubbletter skapas vid andra importen.
- Relationer person-event-registration bevaras.
- Statusar mappas begripligt.
- Mail/payment/faktura triggas inte.
- Export från Odoo kan jämföras mot input.

## POC-Status

POC-write kördes inte i denna sekventiella körning eftersom gatecheck saknar credentials, testtarget och verifierade fält.
