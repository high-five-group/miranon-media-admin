# Odoo Events - Miranon Function Map

| Miranon-behov | Källa för behov | Odoo Events-funktion | Stödapp | Odoo-verifiering | Miranon-verifiering | Passform | Risk | UI-test | API/export-test | POC-del |
|---|---|---|---|---|---|---|---|---|---|---|
| Publicera event/utbildningar | `miranon.se/pages/eventplanering` | Event page/list | Website | Docs/kod | Publik webb | High | Shopify-layout kan vara bättre. | Publicera testevent. | Exportera eventfält. | Ja |
| Datum/tid/plats | `data-model.md` Eventplanering, publik webb | `event.event` date/venue fields | Events | Kod | Repo/webb | High | Tidszon/ort måste mappas. | Skapa testdatum. | Verify fields. | Ja |
| Begränsat antal platser | `data-model.md`, RIM/Fjärrskådning sidor | seats/tickets capacity | Events | Kod/docs | Repo/webb | High | Odoo seats != Airtable beläggningsformler. | Testa max seats. | Exportera seat fields. | Ja |
| Anmälan person x event | `data-model.md` Anmälningar | `event.registration` | Events/Website | Kod/docs | Repo | High | Statusmapping. | Skapa fake registration. | Verify import fields. | Ja |
| Registreringsfrågor | `Registration.ts` motivering/tidigareErfarenhet | `event.question`/answers | Events/Website | Kod/tutorial | Repo | Medium | Import av svar relationellt. | Lägg till fråga. | Verify answer fields. | Ja |
| Närvaro/check-in | `hur-systemet-funkar.md` Deltaganden | Registration desk/barcode/state done | Events | Docs/kod/tutorial | Repo | Medium | Odoo attendance-modell skiljer sig från Miranons sessionsmodell. | Barcode/check-in fake attendee. | Verify status export. | Ja, efter grund |
| Gratis/betald plats | `Registration.ts` betalningsfält | tickets + Sales/eCommerce | Sales/Invoicing/Website Sale | Docs/kod | Repo | Medium | Faktura/betalning risk. | Gratis först. | Verify sale fields. | Nej i första write |
| Mailbekräftelse | `hur-systemet-funkar.md`, tutorial | event mail schedule | Mail/Discuss | Docs/kod/tutorial | Repo | Medium | Skarpa mail. | Neutralized duplicate. | Verify mail config. | Nej tills neutralized |
| Rapportering | `data-model.md` rollups | attendee/revenue reports | Dashboards/Reports | Docs/tutorial | Repo | Medium | Odoo rapporter täcker inte specialrollups. | POC-report. | Export report data. | Ja |
| Historisk import | `data-model.md` 18 tabeller | CSV/import/API | Import/API | Docs | Repo | Medium | Relationer/dubbletter svårare än volym. | Import preview. | Verify import templates. | Senare |
