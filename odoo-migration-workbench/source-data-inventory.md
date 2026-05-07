# Source Data Inventory

| Källa | Innehåll | Persondata | Verifierad | Begränsning | Användning |
|---|---|---|---|---|---|
| `docs/reference/data-model.md` | Airtable schema, tabeller, fält, statusar | Ja strukturellt | Ja | Inte live-radexport | Mapping |
| `docs/reference/hur-systemet-funkar.md` | Flöden och verksamhetslogik | Nej/låg | Ja | Sammanfattning | Fit-gap |
| `src/domain/models/*.ts` | Appens domänkontrakt | Ja strukturellt | Ja | Inte full Airtable schema | Mapping |
| `miranon.se` | Publik webb/content | Kontaktinfo publikt | Ja publikt | Formulär ej skickade | Website fit |
| Odoo docs/source | Odoo capabilities | Nej | Ja generellt | Inte Miranon-instans | Capability analysis |
| Odoo instance | Faktisk app/fältdata | Ja möjligt | Nej | Credentials saknas | Körning 2 |
| Airtable exports/API | Faktisk data | Ja | Nej | Saknas | Körning 3 |
