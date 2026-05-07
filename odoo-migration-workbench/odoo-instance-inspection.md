# Odoo Instance Inspection

Status: ej körd.

## Orsak

Följande miljövariabler saknades i denna körning:

- `ODOO_URL`
- `ODOO_USERNAME`
- `ODOO_API_KEY`
- `ODOO_TARGET_MODE`

`ODOO_DB` kan vara optional beroende på deployment, men saknades också.

## Nästa Steg

Sätt credentials endast lokalt och kör:

```bash
python3 odoo-migration-workbench/scripts/odoo_readonly_inspect.py --models event.event event.registration event.event.ticket event.question event.registration.answer
```

Scriptet är read-only och skriver inte till Odoo.
