# Tutorialbaserade Testfall

| Testfall | Syfte | Tutorialkälla | Steg | Förväntat resultat | Data | App/funktion | Risk | Produktionsskydd | Status |
|---|---|---|---|---|---|---|---|---|---|
| Skapa enkelt event | Bevisa eventform | Events Basics | Skapa fake event med datum/tidszon/plats/capacity | Event sparas | Fake | Events | Låg | Test/duplicate | Ej körd |
| Publicera event | Bevisa Website | SEO-friendly Events | Gå till website, redigera text, publicera | Sida syns i test | Fake | Website Event | Medel | Ej skarp domän | Ej körd |
| Gratis anmälan | Bevisa registration | Events Basics | Lägg till gratis ticket/registration, registrera fake attendee | Attendee finns | Fake attendee | Events/Website | Medel | Ingen mail | Ej körd |
| Registreringsfråga | Bevisa questions | Events Basics/Event Templates | Lägg fråga och svara vid fake registration | Answer kopplas till registration | Fake | event.question | Medel | Testdata | Ej körd |
| Attendance/check-in | Bevisa deltagande | Attendance by Barcode | Checka in fake attendee manuellt eller scanner | Status blir attended | Fake | Registration desk/barcode | Medel | Test/duplicate | Ej körd |
| Event template | Bevisa återbruk | Event Templates | Skapa template för återkommande utbildning | Nytt event auto-fylls | Fake | Events | Låg | Test/duplicate | Ej körd |
| Rapport | Bevisa uppföljning | Measure Success | Öppna attendee/revenue report efter POC | POC-data kan filtreras | Fake | Reporting | Låg | Inga skarpa intäkter | Ej körd |
| Paid ticket dry-run | Bedöma sales-risk | Events Basics/Sell tickets | Konfigurera endast om Sales/Invoicing test säkert | Ingen skarp faktura/betalning | Fake | Sales/Invoicing | Hög | Kräver explicit gate | Blockerad |
