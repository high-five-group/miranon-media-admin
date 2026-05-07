# Odoo Hosting Options

| Alternativ | Vem hostar | Custom code | API | Direkt DB/SSH | Driftansvar | Passar Miranon-test? | Passar skarp drift? | Risk | Rekommendation | Måste verifieras |
|---|---|---|---|---|---|---|---|---|---|---|
| Odoo Online | Odoo | Nej | Endast Custom plan enligt API-docs | Nej | Odoo | Ja | Kanske | Plan/API/custom module-gränser | Första testnivå | Plan, region, backup, duplicate. |
| Odoo.sh | Odoo cloud platform | Ja | Ja beroende plan/access | Web shell/SSH enligt docs | Delat: Odoo infra + kundkod | Bara om gap | Kanske | Högre komplexitet/kostnad | Senare om custom modules behövs | Subscription/projekt. |
| On-premise | Miranon/leverantör | Ja | Ja | Ja | Miranon/leverantör | Nej | Bara starkt skäl | Drift/säkerhet/upgrade | Undvik initialt | Driftkompetens/SLA. |
| Tredjepartsmanaged | Leverantör | Beror på | Beror på | Beror på | Leverantör | Nej initialt | Kanske | Support/avtal/upgrade | Sekundärt alternativ | Leverantörskälla. |

## Praktisk Slutsats

Odoo Online är rimligt för första testet om test/duplicate och backup/exit kan verifieras. Odoo.sh blir relevant först om Miranon bevisligen behöver custom modules eller shell/SSH.
