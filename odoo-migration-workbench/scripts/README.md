# Scripts

Alla scripts är read-only eller dry-run som default.

## `odoo_readonly_inspect.py`

Läser Odoo JSON-2 API om credentials finns. Skriver inte till Odoo.

```bash
python3 odoo-migration-workbench/scripts/odoo_readonly_inspect.py --models event.event event.registration
```

## `validate_source_data.py`

Validerar att source-exportkatalog finns och listar CSV/JSON utan att skriva externa system.

## `validate_odoo_import_package.py`

Validerar CSV-format i `generated-import-package`.

## `odoo_poc_create.py`

Dry-run default. Execute kräver `ODOO_TARGET_MODE=test`, `ODOO_ALLOW_WRITES=true`, `ODOO_POC_LABEL` och explicit `--execute`. Nuvarande implementation stoppar execute tills fältmapping är verifierad.

## `odoo_poc_cleanup.py`

Dry-run default. Execute kräver samma gates och ska bara hitta poster via `ODOO_POC_LABEL`.
