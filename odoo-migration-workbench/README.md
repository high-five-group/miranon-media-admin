# Odoo Migration Workbench

Denna katalog innehåller tekniska artefakter för Odoo-testspåret.

## Status

- `*.md` och `*.csv` i denna katalog är besluts- och verifieringsunderlag.
- `scripts/` innehåller read-only/dry-run-scripts. De får inte användas mot produktion utan explicit verifierad testmiljö.
- `import-templates/concept/` innehåller endast konceptmallar eftersom faktiska Odoo-importfält inte är instansverifierade.
- `external-source/` är lokal arbetskopia av officiell Odoo-källkod och ignoreras från git.
- `source-exports/` är reserverad för framtida Airtable/CSV-exporter och ignoreras från git.

## Grundregel

Inga filer här är produktionsklara importunderlag förrän både källdata och Odoo-modeller/fält har verifierats mot faktisk export/API/UI.
