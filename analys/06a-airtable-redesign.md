# 06a — Airtable Redesign (A-track)

> **Status:** Fas 4a (A-track) klar för Gate 4A.
> **Källprincip:** A-track adresserar gap som har Airtable-klass i `05-gap-vs-worldclass.md` Del C. Alla åtgärder är post-MK. Ingen tenant-abstraktion införs i Airtable.

## Del A — Driftkritiska Airtable-fixar efter MK

### A1 — Aktiv-semantik exkluderar `Inställt`

| Fält | Innehåll |
|---|---|
| ID | A1 |
| Adresserar gap | G3 |
| Typ | Fix |
| Konkret förändring | Uppdatera `Anmälningar.Är aktiv (1/0)` (`fld4j7PeckDViTdIB`) från `IF(Status="Avbokad/Ombokad", 0, 1)` till `IF(OR({Status}="Avbokad/Ombokad", {Status}="Inställt"), 0, 1)`. Behåll `Anmälningar.Status="Inställt"` som arrangör-initierad terminal state och ändra inte `Avbokad/Ombokad`-semantiken. |
| Konsumentkontroll | Views: alla Anmälningar-vyer som filtrerar/grupperar/sorterar på `Status`, `Är aktiv (1/0)`, `Event`, `Flagga`; alla Personer-vyer som visar `Antal anmälningar (aktiva)`, `Har en aktiv anmälan?`, `Har en aktiv anmälan (Ja/Nej)`; alla Eventplanering-vyer som visar beläggning/deltagarunderlag. Automationer: A1-A3 indirekt via Anmälningar-kedjan, A6 beläggningsnotis, A7 slutbetalningssynk, A8-A11 som downstream-närvaro; verifiera att ingen automation har villkor på gamla aktiv-formeln. Formulär: Huvudformulär, Expressformulär, Anmälan-Psionautics.se, väntelisteformulär samt de två lead-magnet-formulären och Soundwise-formulären ska bara kontrolleras för att de inte skickar `Inställt` som input. Zapier: Zap 1, 3 och 4 sätter `Status="Obekräftad"` till Anmälningar; Zap 2 skriver Väntelista; Zap 5-6 skriver Hämtade erbjudanden. Edge Functions: `get-registrations` läser och filtrerar `Status`, `get-events` läser eventstatus/beläggning, `update-record` kan skriva Anmälningar.Status, `AirtableAdapter.fetchRegistrations` skickar statusfilter. Exporter: CSV/exporter/deltagarinsikter/rapportvyer som använder aktiva anmälningar, Personer-exporter, Make.com segmentberäkning. |
| Sekvens | Första driftkritiska schemaändringen post-MK. Kör i testbas eller Airtable snapshot först. Kör efter att MK är avslutat och efter att Mia/Daniel/andra `Inställt`-records kan användas som verifieringsfall. Ska göras före A6/A7 cleanup eftersom aktiv-semantiken är grund för rapport-/segmentförtroende. |
| Blast radius | Medel. En formeländring i en central rollup påverkar Personer-rollups och rapporter, men ändrar inte rådata, relationer eller automation actions. |
| Rollback | Återställ formeln till `IF({Status}="Avbokad/Ombokad", 0, 1)`. Eftersom detta är computed data krävs ingen data-backfill; verifiera bara att Personer-rollups räknas om. |
| Spårbarhet | DS1; `docs/reference/data-model.md:1170`; `analys/02-live-state.md:166`; `analys/05-gap-vs-worldclass.md:38` |

**Slut-test post-MK:** de två verifierade `Inställt`-anmälningarna ska ge `Är aktiv (1/0)=0`, och berörda Personer ska inte längre få aktiv-rollup från dessa records.

### A2 — Mail partial-success blir synlig och retrybar

| Fält | Innehåll |
|---|---|
| ID | A2 |
| Adresserar gap | G12 |
| Typ | Fix |
| Konkret förändring | Inför synlig post-send-state för `send-email`: (1) låt Edge Function-return skilja `mail_sent_patch_ok` från `mail_sent_patch_failed`; (2) skapa Airtable-driftspår vid partial failure, primärt i `Error-log` med fält för recordId, mailtyp, tabell, felmeddelande och timestamp; (3) lägg vid behov till minimal statusyta i Anmälningar/Väntelista eller admin-vy som visar "Mail skickat men Airtable ej uppdaterad". Ändra inte Resend-mallarna i samma steg. |
| Konsumentkontroll | Views: Anmälningar-vyer som visar mailprickar/timestamps (`Bekräftelse skickad`, `Betalningspåminnelse skickad`, `Plus-one förfrågan skickad`, `Deltagarinfo skickad`), Väntelista-vyer som visar `Informationsmail 1 skickad`, Error-log-vyer och eventuella supportvyer. Automationer: A1-A11 ska kontrolleras för att ingen triggas oväntat av nya Error-log/statusfält; särskilt A7 eftersom Anmälningar-uppdateringar triggar brett. Formulär: alla 7 Elfsight/Soundwise-formulär är read-side här men kontrolleras så inget bekräftelsemail från inaktiva Zap 9-10 återintroduceras. Zapier: Zap 1-6 ska inte skriva mailstatusfält; Zap 9-10 är inaktiva Gmail-bekräftelser och ska förbli off. Edge Functions: `send-email` i Psionautics-källan, kommande `AirtableAdapter.sendEmail`, `update-record` om manuell kompensation används, `get-registrations` och `get-waitlist` om de ska exponera warning-state. Exporter: maillogg/export, deltagarinfo-utskicksrapport, väntelisteutskicksrapport, support/incidentexport från Error-log. |
| Sekvens | Post-MK efter A1. Först dokumentera nuvarande fem mailtyper och deras timestampfält. Sedan ändra `send-email`-kontraktet och UI-feedback i test. Sist, om nytt Airtable-fält behövs, skapa fält och vy efter att Edge Function-output är beslutad. |
| Blast radius | Medel-hög. Flödet rör skarpa mail; fel retry-design kan skapa dubbelutskick. Därför ska första implementationen fokusera på synlighet och manuell kompensation, inte automatisk resend. |
| Rollback | Återställ `send-email` till tidigare kontrakt och dölj/arkivera nya partial-failure-vyer. Nya Error-log-rader kan ligga kvar som incidenthistorik; nya fält kan lämnas tomma eller döljas tills nästa iteration. |
| Spårbarhet | DQ8; `docs/reference/data-model.md:940`; `docs/reference/data-model.md:1186`; `analys/01-extraction.md:497`; `analys/05-gap-vs-worldclass.md:173` |

**Slut-test post-MK:** simulera PATCH-fel i testmiljö utan att skicka skarpt mail, och verifiera att operatören ser skillnaden mellan "mail ej skickat" och "mail skickat men Airtable ej uppdaterad".

### A3 — Väntelistaflytt får idempotency och kompensation

| Fält | Innehåll |
|---|---|
| ID | A3 |
| Adresserar gap | G13 |
| Typ | Fix |
| Konkret förändring | Ersätt frontendens tvåstegsoperation `create-registration` + PATCH `Väntelista.Flyttad till anmälan` med en post-MK flyttoperation som har idempotency key baserad på Väntelista-recordId. Airtable-sidan bör få en explicit länk/markör från Väntelista till skapad Anmälan, exempelvis `Väntelista.Anmälan (flyttad till)` + `Flyttstatus`/`Flyttfel` om test visar behov. Operationen ska kunna återköras utan dubbel Anmälan. |
| Konsumentkontroll | Views: aktiva Väntelista-vyer med filter `NOT({Flyttad till anmälan})`, historikvyer för flyttade Väntelista-rader, Anmälningar-vyer som filtrerar `Källa="Väntelista"`, Eventplanering-beläggningsvyer, eventuella admin-vyer för väntelista. Automationer: A1-A3 och A11 ska verifieras eftersom ny Anmälan fortfarande ska få Event/Person/Deltaganden; A6 kan påverkas av beläggning; A7 triggas om Anmälningar uppdateras; A8-A10 är downstream. Formulär: väntelisteformuläret och Anmälan-Psionautics.se behöver kontrolleras för duplicate/email-konflikt; övriga Elfsight-formulär ska inte påverkas. Zapier: Zap 2 skriver nya Väntelista-rader; Zap 1/3/4 skriver Anmälningar; Zap 5/6 skriver Hämtade erbjudanden och ska inte röra flyttfält. Edge Functions: `create-registration`, `get-waitlist`, `get-event-bookings` i Psionautics-källan; i detta repo `AirtableAdapter.fetchWaitlist`, planerad `create-registration`, `update-record`. Exporter: väntelisteexport, Anmälningar-export, deltagar-/platsrapport, supportlista för flyttfel. |
| Sekvens | Post-MK efter A1 och parallellt med eller efter A2 beroende på utvecklingsfönster. Gör först en testbas-/stagingvariant med två fall: lyckad flytt och artificiellt PATCH-fel efter Anmälan-create. Inför inte automatisk massflytt; detta gäller operatörsklick en rad i taget. |
| Blast radius | Hög. Åtgärden rör write-path mellan Väntelista och Anmälningar, påverkar beläggning och kan skapa dubbla records om den görs fel. Därför krävs testbas och manuell rollback-plan innan skarp ändring. |
| Rollback | Återgå till nuvarande frontendflöde. Om ny flyttoperation skapat en extra Anmälan: radera eller markera den manuellt enligt skyddad incidentrutin, bocka av `Flyttad till anmälan` på Väntelista om flytten ska ångras, och dokumentera i Error-log/Notering. Nya fält kan döljas utan dataförlust. |
| Spårbarhet | DQ9; `docs/reference/data-model.md:651`; `docs/reference/data-model.md:1192`; `analys/01-extraction.md:505`; `analys/05-gap-vs-worldclass.md:188` |

**Slut-test post-MK:** samma Väntelista-record ska inte kunna skapa två aktiva Anmälningar även om flyttoperationen återkörs efter nätverksfel.

### M1 sanity-check

- G3, G12 och G13 har konkreta A-track-åtgärder med konsumentkontroll, sekvens, blast radius och rollback.
- Alla tre är uttryckligen post-MK och kräver inga ändringar under MK-frysen.
- Ingen åtgärd inför tenant-abstraktion i Airtable.
- A2 och A3 löser Airtable excellence-testet: systemet blir mer driftbart även om Supabase-migrationen aldrig byggs.

## Del B — Airtable cleanup post-MK

### A4 — Byt namn på `Återkommande?` utan att ändra logik

| Fält | Innehåll |
|---|---|
| ID | A4 |
| Adresserar gap | G4 |
| Typ | Rename / Preserve |
| Konkret förändring | Bevara formeln, men byt fältets Airtable-displaynamn från `Återkommande?` till ett namn som uttrycker verklig semantik, förslagsvis `Aktiv återkommande?`. Lägg fältbeskrivning: "Ja betyder tidigare självrapporterad/genomförd utbildning OCH kommande utbildningsanmälan; inte generell historik." Ändra inte formeln till "har gått tidigare" i A-track. |
| Konsumentkontroll | Views: alla Personer-vyer, Anmälningar-vyer och segmentvyer där `Återkommande?` visas, filtreras eller exporteras. Automationer: A1-A11 ska kontrolleras för fältnamnsreferens; särskilt A2/Touchpoints och bulk/segmentflöden om de läser Personer. Formulär: inga formulär ska skriva detta fält, men Huvud/Express/Psionautics-formulär påverkar källfältet `Vill anmäla sig till`. Zapier: Zap 1/3/4 skriver kursintention/anmälning som påverkar rollup; Zap 2/5/6 ska inte påverka. Edge Functions: `get-persons` kan exponera `harAktivAnmalan`/erfarenhet men läser inte `Återkommande?` i nuvarande repo; kontrollera Psionautics-admin och exports. Exporter: segment-CSV, deltagarinsikter, Personer-exporter, Make.com segmentberäkning. |
| Sekvens | Efter A1, eftersom aktiv-semantiken ska vara korrekt innan labels runt återkommande/aktivitet bedöms. Gör först kod-/export-sök på exakt fältnamn, sedan rename i testbas, sedan skarp rename post-MK. |
| Blast radius | Medel. Rename kan bryta konsumenter som använder fältnamn, men ändrar ingen data eller formel. |
| Rollback | Byt tillbaka displaynamnet till `Återkommande?`. Fältbeskrivningen kan lämnas kvar eller tas bort. |
| Spårbarhet | DS2; `docs/reference/data-model.md:574`; `analys/05-gap-vs-worldclass.md:53`; `analys/04-research.md:68` |

### A5 — Kanonisera `Vill anmäla sig till` case-dubletter

| Fält | Innehåll |
|---|---|
| ID | A5 |
| Adresserar gap | G5 |
| Typ | Cleanup |
| Konkret förändring | Konsolidera multipleSelect-options i `Anmälningar.Vill anmäla sig till` (`fld6RC3r0R9tuKgdF`) så `Resor i Medvetandet 1/2` med versalt M mappas till kanoniska `Resor i medvetandet 1/2`. Dokumentera aliasmappning för migration/export innan options tas bort. |
| Konsumentkontroll | Views: Anmälningar-vyer med filter/gruppering på `Vill anmäla sig till`, Personer-vyer som visar rollupen `Antal tidigare genomförda utbildningar`, event-/segmenteringsvyer. Automationer: A1 kan matcha Event via fält som påverkas av formulärvärden; A2-A3 downstream; A7 kan triggas av massuppdatering och ska undvikas med kontrollerad batch; A4-A6/A8-A11 ska kontrolleras för frånvaro av direkt beroende. Formulär: Huvudformulär och Expressformulärs option labels/pre-fill måste matcha kanoniska labels; Anmälan-Psionautics.se skickar statiskt `Psionautics`; väntelista och lead-magnet/Soundwise-formulär ska inte skriva fältet. Zapier: Zap 3 mappar `Vill anmäla sig till` från Elfsight image choice; Zap 4 mappar från pre-filled URL; Zap 1 sätter statiskt `Psionautics`; Zap 2/5/6 påverkar inte. Edge Functions: `get-registrations` läser `eventNamn` formula och `tidigareErfarenhet`; `create-registration` för MK sätter inte detta fält; kontrollera Psionautics Edge Function-mappning. Exporter: CSV/statistik/segment, historiska backfill-exporter, migration alias-tabell. |
| Sekvens | Efter A4. Först exportera records som använder dubblett-options. Sedan byt deras values till kanoniska values i liten batch post-MK. Sist ta bort eller arkivera dubblett-options när 0 records använder dem och formulär/Zaps är uppdaterade. |
| Blast radius | Medel. MultipleSelect-option cleanup kan påverka formulär/Zapier om inkommande labels inte matchar. |
| Rollback | Återskapa dubblett-options med samma labels och återställ berörda records från pre-cleanup-export. Om bara rename/merge gjorts i Airtable kan rollback kräva manuell reapplicering av gamla values. |
| Spårbarhet | DQ1; `docs/reference/data-model.md:1142`; `analys/02-live-state.md:140`; `analys/05-gap-vs-worldclass.md:68` |

### A6 — Markera canonical read models och pensionera gamla counts

| Fält | Innehåll |
|---|---|
| ID | A6 |
| Adresserar gap | G8 |
| Typ | Cleanup |
| Konkret förändring | Gör `Personer.Antal genomförda event` (`flddy8JND3YnlgZxe`) till dokumenterat canonical count. Pensionera `Antal genomförda event (gammal)` (`flddymQaYJGVCInzq`) i två steg: först rename till `ARKIV - Antal genomförda event (gammal)` och dölj från operativa views; ta bort först efter konsumentkontroll och en karantänperiod. Dead branches i `Erfarenhetsbadge` dokumenteras som känd read-model-skuld men formeln ändras inte i samma A-track-åtgärd. |
| Konsumentkontroll | Views: alla Personer-vyer, deltagarinsiktsvyer, rapport-/segmentvyer och admin-vyer som visar erfarenhet, counts eller badges; alla Deltaganden-vyer som visar `Genomfört event`/RIM eventkeys. Automationer: A8-A10 närvaromarkering påverkar count-underlaget; A11 länkar Person; A1-A7 kontrolleras för fältreferenser innan rename/delete. Formulär: inga formulär skriver counts, men Huvud/Express/Zap 3/4 påverkar historiska kursintentioner som kan förväxlas med närvaro. Zapier: Zap 1/3/4 skapar Anmälningar, Zap 2 Väntelista, Zap 5/6 leads; ingen ska skriva countfält, men kontrollera export-/Zap-steg som läser Personer. Edge Functions: `get-persons` läser `Totala deltaganden`, `Erfarenhetsnivå`, `Erfarenhetsbadge`, `Har en aktiv anmälan?`; nuvarande repo läser inte gamla countfält direkt men Psionautics-admin/exporter måste kontrolleras. Exporter: deltagarinsikter, Personer-CSV, segment, Make.com segmentberäkning, migrationsexport. |
| Sekvens | Efter A5. Rename/dölj först, delete senare. Ingen formelombyggnad före att konsumenterna är kartlagda. |
| Blast radius | Medel-hög. Read models används ofta i rapporter och export; deletion är farligare än rename/dölj. |
| Rollback | Byt tillbaka fältnamnet och återlägg i berörda views. Om fältet raderats krävs Airtable backup/restore eller återskapande av rollup från dokumenterad definition, därför ska delete vara separat beslut. |
| Spårbarhet | DS3, DS4, DS5, H8; `docs/reference/data-model.md:1176`; `docs/reference/data-model.md:1182`; `analys/02-live-state.md:247`; `analys/05-gap-vs-worldclass.md:113` |

### A7 — Avgör tomma singleSelects: ta bort eller ge beslutad taxonomi

| Fält | Innehåll |
|---|---|
| ID | A7 |
| Adresserar gap | G10 |
| Typ | Cleanup / Defer-decision |
| Konkret förändring | För `Personer.Manuella flagga` (`fldNtwQt6tOCIdf4f`) och `Touchpoints.Systemkälla` (`fldSXO9yRrxVceBkp`): om konsumentkontroll visar att fälten är döda, rename till `ARKIV - ...` och dölj innan deletion. Om de behövs, fyll inte med improviserade options; definiera först en minimal taxonomi med ägare och användningsregel. |
| Konsumentkontroll | Views: Personer-vyer som visar manuell flagga, Touchpoints-vyer som visar systemkälla, CRM-/lead-vyer, segmentvyer. Automationer: A2 och A4 skapar Touchpoints; A5 uppdaterar Engagemang; övriga A1/A3/A6-A11 kontrolleras för frånvaro av fältnamnsreferens. Formulär: inget formulär ska skriva dessa fält, men lead-/anmälansflöden skapar records som kan visas i vyer. Zapier: Zap 1/3/4 skapar Anmälningar; Zap 5/6 skapar Hämtade erbjudanden som via A4 skapar Touchpoints; Zap 2 ska inte påverka. Edge Functions: `get-persons` läser `Manuella flagga`; kontrollera om UI exponerar den. `update-record` kan skriva båda om användare redigerar generiskt. Exporter: Personer-export, Touchpoints-export, CRM-/segmentexport. |
| Sekvens | Efter A6. Beslut tas per fält, inte som bulk-delete. Kör `Manuella flagga` och `Systemkälla` separat eftersom de har olika tabeller och konsumenter. |
| Blast radius | Låg-medel. Fälten är tomma och kan inte användas som select idag, men `get-persons` läser `Manuella flagga`, så rename/delete kan påverka frontend. |
| Rollback | Återställ fältnamn och eventuella options från pre-change schemaanteckning. Om fältet raderats krävs återskapande med samma namn/typ och uppdatering av konsumenter. |
| Spårbarhet | DQ2, DQ3, H10, H11; `docs/reference/data-model.md:1154`; `analys/02-live-state.md:204`; `analys/02-live-state.md:370`; `analys/05-gap-vs-worldclass.md:143` |

### A8 — Gör Zapier-source values läsbara

| Fält | Innehåll |
|---|---|
| ID | A8 |
| Adresserar gap | G11 |
| Typ | Cleanup |
| Konkret förändring | Behandla `Hämtade erbjudanden.Källa (formulärkälla)` (`fldF9SgJS1Zv5kmtr`) som Zapier-config, inte form-input. Byt Zap 5 och Zap 6 statiska values från hashsträngar till läsbara, beslutade source/config-namn. Rekommenderad mapping: `leadmagnet:kraftfaltet` för `ae9a4975...` och `leadmagnet:pyramidernas-vajrar` för `58947ba3...`, alternativt human-readable svenska namn om Marcus föredrar rapportläsbarhet framför key-stabilitet. Rename/backfill Airtable-options i samma kontrollerade change window. |
| Konsumentkontroll | Views: Hämtade erbjudanden-vyer, Engagemang-vyer, Personer-vyer som visar hämtningar, lead-/rapportvyer. Automationer: A4 läser Hämtade erbjudanden och kopplar Person/Erbjudande/Touchpoint; A5 uppdaterar Engagemang; A1-A3/A6-A11 kontrolleras för frånvaro av beroende. Formulär: Meditationen Kraftfältet-formuläret och Pyramidernas Vajrar-formuläret via Elfsight; övriga anmälnings-/väntelisteformulär ska inte skriva fältet. Zapier: Zap 5 och Zap 6 är primära ändringspunkter; Zap 1-4 och Zap 2 ska bara kontrolleras för att de inte återanvänder samma source-koncept; Zap 7-8 går till Soundwise och skriver inte Airtable. Edge Functions: nuvarande repo saknar `get-leads` implementation men `AirtableAdapter.fetchLeads` är planerad; kontrollera Psionautics lead-läsning och exports. Exporter: lead-export, engagemangsrapport, migration transform-mapping för gamla hashes. |
| Sekvens | Efter A7 eller parallellt med A7 om separat operatör äger Zapier. Först besluta naming. Sedan uppdatera Zap 5/6 static value i Zapier. Därefter rename/backfill Airtable-options. Sist verifiera nya lead-magnet-submit i test eller kontrollerat skarpt test post-MK. |
| Blast radius | Medel. Ändringen påverkar inkommande lead-magnet-data och rapportläsbarhet men inte Anmälningar-kärnflödet. |
| Rollback | Sätt tillbaka Zap 5/6 static values till hashsträngarna och rename options tillbaka. Befintliga records återställs från export om values hunnit backfillas. |
| Spårbarhet | DQ4, H6; `tasks/sessions/2026-04-28-datamodell-research-projekt.md:111`; `docs/reference/data-model.md:1160`; `analys/05-gap-vs-worldclass.md:158` |

### M2 cleanup sanity-check

- G4, G5, G8, G10 och G11 har varsin A-åtgärd med konsumentkontroll och rollback.
- H6 återupplivas inte: A8 behandlar DQ4/G11 som Zapier-config-skuld enligt P6.
- DS6/DQ7/H4 record-id-formler ingår inte i cleanup; de hålls kvar som Supabase target/defer.
- Cleanup-åtgärderna kräver konsumentkontroll före rename/delete/option-merge.

## Del C — Airtable preserve-beslut

### A9 — Bevara namnlösa Personer som giltig lead-state

| Fält | Innehåll |
|---|---|
| ID | A9 |
| Adresserar gap | G1 |
| Typ | Preserve |
| Konkret förändring | Ingen cleanup, radering eller placeholder-fyllning av namnlösa Personer. Lägg hellre en operativ vy `Leads utan namn` eller fältbeskrivning som markerar att tomt Förnamn/Efternamn är legitimt när Person skapats från lead-magnet. Regeln är: `Okänd`/placeholder får inte sättas eftersom det bryter A2 Gren 1:s namnkomplettering. |
| Konsumentkontroll | Views: Personer-vyer med tomma namn, lead-/CRM-vyer, Touchpoints/Hämtade erbjudanden-vyer. Automationer: A2 Gren 1, A4 lead-skapande, A5 engagemang; A1/A3/A6-A11 kontrolleras för downstream. Formulär: lead-magnet-formulären kan skapa namnlösa leads; anmälningsformulär fyller namn senare. Zapier: Zap 5/6 skapar lead-magnet-input; Zap 1/3/4 skapar namngivna anmälningar; Zap 2 väntelista. Edge Functions: `get-persons` behöver visa namnlösa Personer begripligt; `update-record` får inte användas för bulk-placeholder. Exporter: Personer-export, lead-export, deltagarinsikter. |
| Sekvens | Gäller omedelbart som designbeslut, men inga basändringar före MK. Om en vy/fältbeskrivning läggs till görs det post-MK efter A1. |
| Blast radius | Låg för preserve-beslutet, medel om ny vy används operativt. Största risk är utebliven preserve-disciplin, inte åtgärden. |
| Rollback | Om vy/fältbeskrivning skapas kan den döljas/tas bort. Rader ska inte ändras. |
| Spårbarhet | DQ6, H2; `docs/reference/data-model.md:1110`; `docs/reference/hur-systemet-funkar.md:177`; `analys/05-gap-vs-worldclass.md:8` |

### A10 — Bevara `Återkommande?`-logiken, men med rätt namn

| Fält | Innehåll |
|---|---|
| ID | A10 |
| Adresserar gap | G4 |
| Typ | Preserve / Rename |
| Konkret förändring | A4 är rename-åtgärden. Preserve-beslutet här är att inte "rätta" formeln till historisk deltagarstatus i Airtable. Om verksamheten behöver "har gått kurs tidigare" ska det vara ett separat read model-fält baserat på Deltaganden/kurshistorik, inte en tyst ändring av `Återkommande?`. |
| Konsumentkontroll | Samma konsumentkontroll som A4 plus särskilt kontroll av segment/exports som kan ha tolkat fältet fel. |
| Sekvens | Låses samtidigt som A4. Eventuellt nytt "har gått tidigare"-fält är en separat post-MK designfråga och ska inte smygas in i A4. |
| Blast radius | Låg som preserve-beslut; medel om rename sker. |
| Rollback | Se A4. |
| Spårbarhet | DS2; `docs/reference/data-model.md:574`; `analys/05-gap-vs-worldclass.md:53` |

### A11 — Bevara `RIM 3 ×` som Airtable-native rollup

| Fält | Innehåll |
|---|---|
| ID | A11 |
| Adresserar gap | G8 |
| Typ | Preserve |
| Konkret förändring | Behåll `Personer.RIM 3 ×` (`fld93OrTArvdkkYmk`) som rollup från `Deltaganden.RIM 3 eventkey`. A-track ska inte konvertera RIM3x till appkod eller ta bort den för att "normalisera". Det är korrekt Airtable-native read model för operativ läsbarhet. |
| Konsumentkontroll | Views: Personer-vyer, deltagarinsikter, erfarenhets-/badge-vyer. Automationer: A8-A10 närvaromarkering och A11 Person-länk; A1-A7 kontrolleras för att inte skriva rollupen. Formulär/Zapier: påverkar inte direkt, men kursnamn från Zap 3/4 och Eventplanering styr Deltaganden-kedjan. Edge Functions: `get-persons` läser erfarenhet/badge, men inte RIM3x direkt i nuvarande repo; export/migration måste veta att rollupen är read model. Exporter: Personer-CSV, deltagarinsikter, migration. |
| Sekvens | Bevaras under A6. Om badge/erfarenhetsformler revideras senare ska RIM3x vara källa, inte raderas. |
| Blast radius | Låg. Preserve minskar risk. |
| Rollback | Ingen dataändring. Om fältbeskrivning/canonical-markering läggs till kan den tas bort. |
| Spårbarhet | H9, DS4/DS5-kontext; `docs/reference/data-model.md:337`; `analys/02-live-state.md:245`; `analys/05-gap-vs-worldclass.md:113` |

### A12 — Defer A2-grenordning tills verifiering finns

| Fält | Innehåll |
|---|---|
| ID | A12 |
| Adresserar gap | G6 |
| Typ | Defer-decision |
| Konkret förändring | Ingen ändring i A2 automationen i A-track. Skapa endast verifieringsinstruktion för sandbox/test: anmälan med e-post som matchar namnlös Person och kontroll av `Anmälningar.Person`. Om hypotesen bekräftas tas patch i separat post-MK implementation efter test, inte i 06a. |
| Konsumentkontroll | Views: Anmälningar utan Person, Personer utan namn, Deltaganden utan Person. Automationer: A2 är själva riskpunkten; A3 och A11 är downstream och måste ingå i verifiering. Formulär: lead-magnet först, sedan anmälningsformulär med samma e-post. Zapier: Zap 5/6 skapar namnlösa leads, Zap 3/4 eller Zap 1 kan skapa senare anmälan. Edge Functions: `create-registration` kan också skapa senare anmälan; `get-registrations`/`get-persons` visar effekten. Exporter: orphan-Anmälningar, Deltaganden-export, migration. |
| Sekvens | Efter MK men före eventuell A2-patch. Kan planeras parallellt med A9 preserve eftersom de rör samma lead-lifecycle, men får inte ändra A2 i produktion utan test. |
| Blast radius | Hög om man ändrar A2; låg om man bara verifierar i sandbox. Därför är detta defer. |
| Rollback | Ingen produktionsändring. Om testdata skapas i testbas raderas den där. |
| Spårbarhet | H1, H5; `docs/reference/data-model.md:557`; `docs/reference/data-model.md:597`; `analys/05-gap-vs-worldclass.md:83` |

### M2 preserve sanity-check

- DQ6, DS2, H9 och G6/H1/H5 bevaras/defer:as aktivt med rationale.
- Preserve betyder inte passiv ignorering: A9-A12 anger vad som inte får göras och vilken verifiering som krävs.
- Ingen preserve-åtgärd ändrar A1-A11 eller MK-kritiska data före MK.

## Del D — Sekvensering

### Grundregel

Allt nedan är post-MK. Inga förberedande Airtable-/Zapier-/Edge-/Resend-ändringar görs före MK, även om en ändring ser låg risk ut.

| Fas | Åtgärder | Varför i denna ordning |
|---|---|---|
| Post-MK dag 1-2: snapshot och konsumentkarta | Exportera berörda records/options/fältdefinitioner. Kartlägg views, A1-A11, formulär, Zap 1-6, Edge Functions och exporter för A1-A8. | Alla cleanup-/rename-steg kräver rollback-underlag och konsumentkontroll innan första ändring. |
| Post-MK vecka 1: låg datarisk först | A1, A4, A9, A10, A11, A12 verifieringsplan. | A1 är central computed fix. A4/A9-A12 ändrar främst semantik/preserve och minskar risken för fel cleanup. |
| Post-MK vecka 1-2: integration fixes i test först | A2 och A3 i testbas/staging. | Mail och väntelistaflytt är write-paths med risk för dubbla mail/dubbla anmälningar. De ska inte blandas med bulk-cleanup. |
| Post-MK vecka 2-3: cleanup med batch/export | A5, A6, A7, A8. | Option merge, read-model pensionering, tomma select-fält och Zapier-source cleanup kräver konsumentkontroll och i vissa fall Zapier-ägare. |
| Andra månaden post-MK: deletion/karantänslut | Slutlig deletion av gamla fält/options endast om karantän och exporter är rena. | Rename/dölj först; delete sist. Det bevarar rollback och upptäcker gömda konsumenter. |

### Beroenden

| Åtgärd | Måste föregås av | Kan parallelliseras med |
|---|---|---|
| A1 | Snapshot + konsumentkarta | A4, A9-A12 |
| A2 | Mailtyp-/timestamp-karta, test av partial failure | A3 design, men inte samma deployfönster |
| A3 | Väntelista/Anmälningar-testfall, idempotency design | A2 design |
| A4 | Konsumentsök på fältnamn | A9-A11 |
| A5 | Formulär/Zapier label-kontroll | A6, men inte A7/A8 om samma operatör gör cleanup |
| A6 | Konsumentsök på gamla countfält | A5 |
| A7 | Beslut per fält: delete eller taxonomi | A8 |
| A8 | Beslut om läsbara source/config-namn | A7 |
| A9-A12 | Inga produktionsändringar före MK | A1/A4 |

## Del E — Riskmatris och rollback

| ID | Risk | Beroenden | Rollback |
|---|---|---|---|
| A1 | Medel | Formula snapshot, kontroll av Status/aktiv-views, A7-triggerpåverkan | Återställ tidigare formel. Computed rollups räknas om. |
| A2 | Medel-hög | `send-email` testmiljö, UI-warning, Error-log/statusdesign | Återställ Edge Function-kontrakt; dölj nya warning-vyer/fält; behåll Error-log som historik. |
| A3 | Hög | Testbas, idempotency key, eventuell ny Väntelista->Anmälan-länk | Återgå till gamla frontendflödet; manuellt städa extra Anmälan eller bocka av `Flyttad till anmälan`. |
| A4 | Medel | Fältnamnssök i kod/exports/Zaps | Rename tillbaka till `Återkommande?`. |
| A5 | Medel | Export av records med dubblett-options, formulär/Zapier label-kontroll | Återskapa options och återställ records från export. |
| A6 | Medel-hög vid delete, låg-medel vid rename/dölj | Konsumentsök på gamla countfält | Rename tillbaka/återvisa fält. Delete rollback kräver restore eller återskapad rollup. |
| A7 | Låg-medel | Konsumentsök; beslut om delete vs taxonomi | Återställ fältnamn/options; vid delete återskapa fält. |
| A8 | Medel | Zapier-ägare, naming-beslut, lead-test | Sätt Zap 5/6 tillbaka till hashvärden; rename/backfill tillbaka från export. |
| A9 | Låg | Operativ utbildning/vy/fältbeskrivning | Ta bort vy/fältbeskrivning. Rader ändras inte. |
| A10 | Låg | A4 | Se A4. |
| A11 | Låg | A6 | Ingen dataändring; ta bort eventuell canonical-beskrivning. |
| A12 | Låg om bara test, hög vid otestad A2-patch | Sandbox/testdata | Ingen produktionsrollback eftersom produktion inte ändras. |

## Del F — Inter-fas-kontrakt till S-track (Fas 4b)

### A-track låser för S-track

- G0.3 är beslutat som soft multi-tenant för S-track, men A-track har ingen tenant-abstraktion i Airtable. S-track får inte tolka 06a som tenant-design.
- Namnlösa Personer är legitim lead-state. S-track ska modellera lead/person-lifecycle explicit och får inte bygga migration på antagandet att namnlösa Personer är skräp.
- `Återkommande?` är inte historisk deltagarstatus. S-track ska separera historiskt deltagande, självrapporterad erfarenhet och aktiv återkommande process.
- `RIM 3 ×` och övriga course counts är read models, inte primär sanning. S-track ska bygga canonical relationer från Person/Anmälan/Deltaganden/Event och återskapa read models därifrån.
- DQ4/G11 är Zapier-config-as-data. S-track ska modellera integration source/config separat från lead source och transformera historiska hashvärden.
- G12/G13 kräver communication-/operation-logik med status per steg. S-track ska bära detta som transaktion/outbox/audit, inte som ad hoc timestampfält.
- DS6/DQ7/H4 record-id-formler är inte A-track-fixade. S-track ska ignorera dem som relationell sanning och använda länkrelationer/exports som källa till FK.

### A-track lämnar öppet till S-track eller Fas 5

- H2 Personer-split avgörs i S-track utifrån livscykler/invariants och soft multi-tenant, inte utifrån 87 fält.
- H7/Zapier edge-modell och DS7 action-level automation diff kartläggs i Fas 5/target-design; 06a gör bara DQ4/G11 cleanup.
- H13 EventKey-templatekälla är fortsatt defer. A-track reparerar inte EventKey-konceptet i Airtable.
- DQ5/H12 e-post som typed identifier är migration/Supabase target; A-track gör ingen bred typkonvertering.
- Exakt implementation av A2/A3 i kod ligger i post-MK implementation, inte i detta researchdokument.

### Del D:s 9 öppna frågor från Fas 3

| # | Fråga | A-track svar |
|---:|---|---|
| 1 | G0.3 multi-tenant | Besvarad av Marcus 2026-04-29: soft multi-tenant för S-track. A-track: ingen Airtable-tenant. |
| 2 | H2 Personer-split | Defer till 4b. A-track låser bara att namnlösa leads är legitima. |
| 3 | A2 reverse-flow | Defer till verifiering. A12 förbjuder otestad A2-patch. |
| 4 | DQ4 historik/source-namn | Delvis besvarad. A8 föreslår source keys men Gate 4A behöver välja exakta namn. |
| 5 | H13 EventKey-källa | Defer. Ingen A-track-fix av EventKey-template. |
| 6 | DQ8 mail-state | Besvarad för A-track: synlig partial-success + manuell kompensation/retry, inte blind resend. |
| 7 | DQ9 väntelista | Besvarad för A-track: idempotent flyttoperation eller kompensation med Väntelista-recordId som key. |
| 8 | Cleanup-konsumenter | Besvarad som obligatorisk konsumentkarta per åtgärd; exakta live-viewnamn verifieras post-MK innan ändring. |
| 9 | DS7 automation diff | Defer till Fas 5. A-track ändrar inte A1-A11 utan verifiering. |

## Del G — Öppna frågor till Gate 4A

1. Ska A4 rename:a `Återkommande?` till `Aktiv återkommande?`, eller vill Marcus ha annat namn? A-track rekommenderar rename, inte formeländring.
2. Vilka läsbara DQ4/G11-namn ska användas i Zap 5/6 och `Hämtade erbjudanden.Källa (formulärkälla)`? Rekommendation: stable source keys (`leadmagnet:kraftfaltet`, `leadmagnet:pyramidernas-vajrar`) om migration prioriteras, svenska displaynamn om Airtable-rapportläsbarhet prioriteras.
3. Ska A2 partial-success i första versionen bara skapa synlig warning/manuell kompensation, eller även automatisk retry? A-track rekommenderar warning + manuell retry först för att undvika dubbelutskick.
4. Ska A3 byggas som ny Edge Function `move-waitlist-to-registration` eller som frontend-kompensation med starkare retry? A-track rekommenderar en samlad idempotent operation, men implementation kräver kodbeslut post-MK.
5. För A7: är `Manuella flagga` och `Systemkälla` döda fält, eller ska Marcus/Lotta definiera en minimal taxonomi? Inga placeholder-options bör läggas till utan ägare.
6. Hur lång karantän ska gälla innan delete av `Antal genomförda event (gammal)` och andra pensionerade fält? A-track rekommenderar minst en post-MK driftcykel efter rename/dölj.
7. Ska live view-namn hämtas via Airtable schema innan implementation, eller räcker post-MK manuell Airtable-UI-kontroll? 06a anger view-kategorier eftersom frusen baseline inte innehåller fullständig view-lista.

### Gate 4A-frågornas Codex-bedömning

1. **Självständig implementerbarhet:** Ja. A1/A4-A8/A9-A12 förbättrar Airtable även utan Supabase, och A2/A3 gör skarpa driftflöden mer felsökningsbara.
2. **Konsumentkontroll:** Ja. Alla 12 A-åtgärder har explicit kontroll av views, automationer, formulär, Zapier, Edge Functions och exporter där relevant.
3. **Sekvens + rollback:** Ja, med svagaste punkterna A2/A3 eftersom de rör mail och väntelista-write-paths. Därför ligger de i test/staging före skarp ändring.
4. **Inter-fas-kontrakt:** Ja. S-track får tydligt vad A-track låser och vad som lämnas öppet.
5. **MK-frys:** Respekterad. Inga pre-MK-åtgärder finns i 06a.
6. **G0.3-disciplin:** Respekterad. Ingen tenant_id, tenant-view, workspace-prefix eller annan Airtable-tenant-abstraktion föreslås.
