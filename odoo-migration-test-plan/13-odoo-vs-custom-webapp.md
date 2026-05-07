# Odoo Vs Custom Webapp

## Kort Rekommendation

Kör Odoo parallellt men behåll custom webappen som huvudspår tills Odoo POC har bevisat eventloop, importbarhet och säker drift.

| Alternativ | Styrka | Svaghet | Rekommendation |
|---|---|---|---|
| Odoo komplett ersättare | Många standardappar | Ej bevisad match för specialflöden | För tidigt |
| Odoo som event/backend | Events/registrations/Website/Sales | Import/status/närvaro okända | Testa |
| Odoo CRM/fakturering | Integrerad affärsdata | Hög ekonomi-risk | Senare |
| Shopify + Airtable | Fungerar idag, publik webb etablerad | Airtable-komplexitet | Behåll tills vidare |
| Custom webapp | Anpassad till Lottas flöden | Kräver utveckling | Fortsätt huvudspår |
| Hybrid | Minskar risk, tar bästa delar | Fler integrationer | Mest rimligt nu |
