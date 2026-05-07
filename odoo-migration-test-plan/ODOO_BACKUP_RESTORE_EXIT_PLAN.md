# Odoo Backup, Restore Och Exit Plan

## Verifierat Via Officiella Källor

- Odoo Online Database Manager kan duplicera databaser.
- Testduplicates har "for testing purposes" aktiverat som ska inaktivera externa actions som emails/payments/delivery orders.
- Duplicates expire after 15 days och max fem duplicates per database enligt docs.
- Database Manager kan ladda ner backup; om backup är för stor ska Odoo Support kontaktas.
- Cloud SLA anger 99.9% uptime target och RPO/RTO-mål.

## Manuell Checklista I Database Manager

1. Ta skärmdump av databasens namn, version, plan och hostingregion om synligt.
2. Skapa duplicate med `For testing purposes` aktiverat.
3. Kontrollera att mail, payment providers och delivery externa actions är neutraliserade.
4. Testa `Download Backup` på testdatabasen eller verifiera varför knappen är disabled.
5. Notera backupstorlek.
6. Kontrollera admin activity logs.
7. Dokumentera hur ownership transfer/delete fungerar.

## Exit-Test

- Bevisa att backup går att ladda ner.
- Bevisa att CSV/XLSX-export kan göras för centrala modeller.
- Bevisa att Odoo inte blir enda kopian av historisk Airtable-data innan migrationen är validerad.

## Stopplinje

Ingen skarp persondatamigration innan backupdownload eller supportad exitväg har verifierats.
