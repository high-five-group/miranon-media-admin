# Gap: Video Vs Dokumentation Vs Kod Vs Faktisk Instans

| Ämne/funktion | Video/tutorial-observation | Dokumentationsstatus | Kodstatus | Faktisk instansstatus | Risk om vi antar fel | Nästa verifieringssteg |
|---|---|---|---|---|---|---|
| Event creation | Tutorial visar grundform och settings. | Verifierat i Events docs. | `event.event` verifierad. | Ej verifierat. | POC kan falla på app/plan. | UI/API app check. |
| Website publish | Tutorial visar Website editor/SEO/mobile. | Verifierat som Events+Website. | `website_event` verifierad. | Ej verifierat. | Shopify-ersättning överskattas. | Skapa testpage. |
| Registrations | Tutorial visar attendee-lista och webbregistrering. | Verifierat i docs. | `event.registration` och routes verifierade. | Ej verifierat. | Fel status/mapping. | Export/import template. |
| Tickets | Tutorial visar ticketing. | Verifierat i docs. | `event.event.ticket`, `event_sale` verifierade. | Ej verifierat. | Ekonomi/betalning triggas fel. | Gratis först; paid gate senare. |
| Questions | Tutorial visar questions. | Verifierat i docs. | `event.question`/answers verifierade. | Ej verifierat. | Svar importeras fel. | Testa fake answer export. |
| Barcode | Tutorial visar barcode attendance. | Verifierat i docs/settings. | barcode dependency + registration barcode verifierad. | Ej verifierat. | Närvaro passar inte Miranons sessionsmodell. | Testa registration desk. |
| Mail/SMS | Tutorial visar scheduled comms. | Verifierat i docs/kod. | `event.mail`, `event_sms` verifierade. | Ej verifierat. | Riktiga mail/SMS skickas. | Neutralized duplicate. |
| Reporting | Tutorial visar attendee/revenue. | Verifierat i docs. | Report models/views finns för event_sale. | Ej verifierat. | Rapporter täcker inte Airtable-rollups. | POC-report med fake data. |
