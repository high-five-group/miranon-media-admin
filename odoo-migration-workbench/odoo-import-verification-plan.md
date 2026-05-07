# Odoo Import Verification Plan

1. Verifiera Odoo version/plan/apps.
2. Skapa duplicate/test med neutralisering.
3. Skapa ett fake event manuellt.
4. Exportera fake event, ticket, registration, question och answer.
5. Dokumentera faktiska export/import headers.
6. Uppdatera `odoo-field-mapping.csv`.
7. Kör import preview med 1 fake row och External ID.
8. Kör aldrig skarp import förrän preview visar update/idempotens och inga mail/payment/faktura triggas.
