# Odoo Database Model Explained

## Kort Förklaring

I Odoo betyder en "database" normalt en komplett kunddatabas/instans med appar, modeller, records, users, settings, attachments och affärslogik. Det är inte samma sak som en Airtable base där användaren primärt tänker i tabeller och vyer.

## Airtable Vs Odoo

| Airtable | Odoo |
|---|---|
| Base med tabeller och fält. | Databas/instans med appar, modeller och records. |
| Mycket logik i automations/formulas/rollups. | Mycket logik i ORM, access rights, modules och workflows. |
| Direkta tabellvyer är centrala. | UI, import/export, ORM och API är normala accessvägar. |
| Länkar mellan records är synliga tabellrelationer. | Relationer finns som Many2one/One2many/Many2many och påverkas av security/business logic. |

## Viktig Migrationsprincip

Behandla inte Odoo som "bara SQL". Importera via Odoo UI/API/import så att relationer, constraints, mail/business logic och accessregler respekteras. Direkt PostgreSQL-access är relevant främst on-premise/Odoo.sh/teknisk drift och är inte normal Odoo Online-metod.

## Verifieringsstatus

- Generellt Odoo Online/hosting/API: verifierat via officiell dokumentation.
- Miranons specifika databasregion, plan, backupstatus och API-access: ej verifierat.
- Attachments/filestore-detaljer för Miranons databas: ej verifierat.
