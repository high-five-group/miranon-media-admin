# Odoo Database Hosting Decision

## Rekommendation

Använd Odoo Online som första testmiljö, men gör inga skarpa importer eller writes förrän Database Manager har verifierat duplicate/test, backup/exit, plan/API och mail/payment-neutralisering.

## Motivering

- Odoo Online är enklast för första test och kräver ingen lokal drift.
- Custom modules behövs inte för första beviset.
- Odoo.sh ska vänta tills ett verifierat gap kräver kod.
- Airtable-volymen verkar inte tekniskt stor; relationer och datakvalitet är den verkliga risken.

## Svar På Nyckelfrågor

1. Är Odoo Online rimligt för första testet? Ja, om duplicate/test och backup verifieras.
2. När räcker Odoo Online? När standard Events, Website, Studio/import räcker.
3. När behövs Odoo.sh? Vid custom modules, shell/SSH eller avancerad kod.
4. Är datavolymen problem? Troligen inte tekniskt; semantiken är större risk.
5. Kan Codex komma åt Odoo-data? Endast om API/Custom plan/credentials finns; ej verifierat nu.
6. Om API saknas, räcker CSV/XLSX? För första test kan UI export/import räcka.

## Blockerare

- Faktisk plan/API-access.
- Hostingregion.
- Backupdownload.
- Testduplicate/neutralized status.
- Faktiska Odoo-fält/importfält.
- Faktiska Airtable-exporter och anonymisering.
