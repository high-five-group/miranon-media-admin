# Risk Register

| Risk | Sannolikhet | Konsekvens | Mitigation | Varningssignal | Beslutsregel |
|---|---|---|---|---|---|
| Gissade Odoo-fält | Medium | High | API/export-verifiera | Mapping med TBD | Stoppa import |
| Skarpa mail | Medium | High | Neutralized duplicate | Mail settings okända | Stoppa POC |
| Faktura/betalning skapas | Medium | High | Paid flow gated | Payment provider aktiv | Stoppa paid test |
| Persondata exponeras | Medium | High | Anonymisering | Riktiga namn i filer | Stoppa commit |
| Odoo Online begränsar custom | High | Medium | Standard/Studio först | Gap kräver kod | Överväg Odoo.sh/hybrid |
| Airtable-relationer tappas | Medium | High | External IDs och readback | Dubbletter | Backa import |
| Shopify frontend sämre | Medium | Medium | Visual comparison | Låg konvertering/SEO | Hybrid |
| Testet tar för mycket tid | Medium | Medium | Stop/go lines | Många blockerare | Pausa Odoo |
| API saknas | Medium | Medium | UI export/import | `/doc` saknas | Manuell path |
| Custom webapp störs | Low | High | Separata kataloger | Appkod ändrad | Revertera egna Odoo-ändringar |
