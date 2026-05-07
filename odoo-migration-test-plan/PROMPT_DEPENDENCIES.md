# Prompt Dependencies

Senare körningar får inte skapa skarpa Odoo-importer eller writes förrän följande är verifierat:

- Odoo hostingmodell.
- Odoo plan/API-access.
- Testdatabas/neutralized database.
- Backup/restore/exit-läge.
- Faktiska Odoo-modeller/fält.
- Faktiska Airtable-tabeller/fält/radantal.
- Persondatafält och anonymiseringsstrategi.
- Access rights för den användare/bot som används.
- Mail, SMS, payment providers och webhooks är säkert neutraliserade.
