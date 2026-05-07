# Tutorial Verification Backlog

| Item | Varför | Metod | Påverkar körning |
|---|---|---|---|
| Bekräfta vilka tutorialfeatures som finns i Miranon Odoo UI | Tutorials kan visa appar/settings som inte är aktiva. | Skärmdumpar från Events settings. | 2, 4 |
| Testa Website publish i duplicate | Shopify-jämförelsen kräver faktisk rendering. | Skapa testevent och skärmdumpa desktop/mobile. | 4, 5 |
| Verifiera mail neutralization | Scheduled communications kan skicka riktiga mail. | Duplicate for testing + mail settings. | 4 |
| Exportera attendee fields efter fake registration | Import/mapping kräver faktiska fält. | Odoo export UI/API `/doc`. | 2, 3 |
| Testa barcode/check-in | Miranon behöver närvaro, men modell skiljer sig. | Fake attendee i registration desk. | 4 |
| Kontrollera Sales/Invoicing innan paid ticket | Betalning/faktura får inte skapas skarpt. | Testdatabas + payment provider disabled/demo. | 4 |
