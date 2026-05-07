# Odoo Events Customization Experiments

| Experiment | Syfte | Nivå | Kräver Studio | Kräver API | Kräver Odoo.sh | Data | Steg | Acceptance criteria | Rollback | Risk | Bevis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Event template | Bevisa återbruk | Standard | Nej | Nej | Nej | Fake | Skapa template för fake utbildning | Nytt event auto-fylls | Radera template | Låg | Screenshot |
| Registration questions | Bevisa formulär | Standard | Nej | Nej | Nej | Fake | Lägg motivering/fråga | Svar syns på attendee | Radera fråga/testevent | Medel | Export/screenshot |
| Website page edit | Bevisa Shopify-lik page | Website | Nej | Nej | Nej | Fake | Redigera text/SEO/mobile | Sidan publiceras i test | Unpublish/delete | Medel | Desktop/mobile screenshots |
| Free registration | Bevisa anmälningsloop | Standard | Nej | Nej | Nej | Fake attendee | Registrera via website | Attendee skapas | Delete label posts | Medel | Readback |
| Check-in | Bevisa närvaro | Standard/barcode | Nej | Nej | Nej | Fake attendee | Markera attended | Status ändras | Reset/delete | Medel | Screenshot |
| Studio field | Bevisa extra fält | Studio | Ja | Nej | Nej | Fake | Lägg fält på registration | Fält syns/exporteras | Radera fält i test | Medel | Screenshot/export |
| Read-only API | Bevisa automation | API | Nej | Ja | Nej | None | Läs `/doc`/search_read | Models/fields returneras | No write | Låg | Maskerad rapport |
| Paid ticket dry-run | Bedöma ekonomi | Standard/Sales | Nej | Nej | Nej | Fake | Konfigurera utan betalning | Ingen faktura/payment | Delete test | Hög | Gate report |
