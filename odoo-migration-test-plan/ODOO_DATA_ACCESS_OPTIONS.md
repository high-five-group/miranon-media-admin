# Odoo Data Access Options

| Accessmetod | Läsa | Skriva | Kräver | Risk | Passar Codex | Status |
|---|---|---|---|---|---|---|
| Web UI | Ja | Ja | User login | Manuell felklick | Indirekt via instruktion | Ej verifierat |
| Database Manager | Backup/logs/duplicate | Manage DB | Admin | Stor påverkan | Nej, manuell | Ej verifierat |
| UI Export/Import | Ja | Ja | User rights | Importfel | Ja via filer | Ej verifierat |
| Backupdownload | Ja | Restore separat | Admin | Persondatahantering | Nej/filanalys | Ej verifierat |
| JSON-2 API | Ja | Ja | Custom plan + API key | Writes/dataexponering | Ja, read-only först | Ej verifierat |
| `/doc` | Metadata | Nej | API/doc access | Kan saknas | Ja | Ej verifierat |
| Studio | Metadata/customization | Ja | Studio/access | Plan/cost/tech debt | Manuell | Ej verifierat |
| Odoo.sh shell/SSH | Ja | Ja | Odoo.sh | Hög teknisk risk | Begränsat | Ej verifierat |
| PostgreSQL | Ja | Ja | On-prem/Odoo.sh | Bryter ORM om writes | Nej för migration writes | Ej verifierat |
| Public Website/Portal | Ja publikt | Registration writes | Website/portal | Offentlig exponering | Ja för inspection | Delvis via docs |
