# Odoo Installed Apps Bundle Review

Apparna nedan är observerade från användarens Odoo-startskärm enligt uppdragsdokumentet. De är inte verifierade mot faktisk Odoo-instans i denna körning.

| App | Roll i eventspåret | Verifieringsstatus | Risk | Nästa verifiering |
|---|---|---|---|---|
| Evenemang | Kärna: event, registrations, tickets, questions, attendance. | Skärmbildsobserverad; docs/kod verifierade generellt. | Måste vara installerad/konfigurerad. | Odoo UI/API app list. |
| Hemsida | Publicering och registrering. | Skärmbildsobserverad; `website_event` kod verifierad. | Shopify-jämförelse och publiceringsrisk. | Testevent page. |
| Försäljning | Paid tickets/orderflöde. | Skärmbildsobserverad; `event_sale` kod verifierad. | Kan trigga order/faktura. | Läs-only app/settings. |
| Fakturering | Faktura/betalning. | Skärmbildsobserverad. | Hög produktionsrisk. | Testa inte writes innan gate. |
| Anslagstavlor | KPI/reporting. | Skärmbildsobserverad. | Kan vara begränsat/annan app än event reports. | Manuell UI-inspektion. |
| Diskutera | Chatter/aktiviteter/interna notiser. | Skärmbildsobserverad; mail/chatter beroende i kod. | Mail/notiser. | Kontrollera notifications. |
| Appar | Installation/beroenden. | Skärmbildsobserverad. | Install/uninstall kan påverka databasen. | Read-only list. |
| Inställningar | Users, access, website, mail, event settings. | Skärmbildsobserverad. | Fel settings kan skicka mail/payment. | Manuell checklista. |
