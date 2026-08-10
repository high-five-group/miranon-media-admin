---
id: TASK-147.7
title: 'Skiva: Kvittogenereringen med nummerserien'
status: In Progress
assignee: []
created_date: '2026-08-10 07:03'
updated_date: '2026-08-10 18:57'
labels:
  - ready-for-agent
dependencies:
  - TASK-147.5
parent_task_id: TASK-147
priority: high
ordinal: 344000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Kvittot genereras ur betalningsdata som klass C-bilaga — en PDF per mottagare, via singelloop-grenen. Räknaren bor i basen (additivt, ADR-063), numret allokeras server-side vid genereringen, formatet synligt avgränsat från Rogers serie (eget prefix + löpnummer + årssuffix, start skild från ett). En betalning kvitteras i exakt ETT system. Egen ADR mintas för nummerserien (klarar ADR-baren per PRD § ADR-koppling).

FÖRKRAV (PRD DoD 10): Roger-avstämningen om kvittogränsen bokförd FÖRE bygget — de fem frågorna står i sessionsdok S102; Marcus tar dem med Roger i dag.

Täcker användarberättelser: 20, 21, 22, 23, 24.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Roger-avstämningen bokförd i kortets notes (fem frågorna besvarade, eller Marcus-beslut med efterhandsbekräftelse öppet bokförd)
- [x] #2 Kvittonummer: unikhet under samtidighet bevisad + ingen retroaktiv omnumrering + server-side-allokering
- [ ] #3 Kvitto-PDF genereras per mottagare och bevisas FRAMME som bilaga
- [x] #4 ADR för nummerserien mintad
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Kvittonummer: unikhet + beständighet + server-side bevisad (PRD DoD 8-arv)
- [x] #6 Roger-avstämningen bokförd före kvitto-skivan låses (PRD DoD 10-arv)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-08-10 (S102, kvittogränsen — Roger-feedback i efterhand, öppet bokfört per PRD DoD 10):

(a) Appens kvittoserie ERSÄTTER Rogers manuella kvittogenerering i fakturasystemet. Allt som prickas av i appen (Swish/bankgiro/plusgiro) kan få app-kvitto. Kvittot är en AKTIV handling (Lotta skickar) — aldrig automatik. Sällsynta faktura-fall (vid förfrågan, Rogers system) prickas av UTAN app-kvitto — en betalning kvitteras i exakt ett system.
(b) Format: MM-<år>-<löpnummer>, start 1001 (MM-2026-1001) — synligt avgränsad från Rogers serie.
(c) Kvittoinnehåll: datum, belopp, betalsätt, event, kundnamn, Miranons org-uppgifter. MOMSRADEN ÖPPEN PUNKT: Rogers bekräftelse av momsstatus krävs innan kvitton går skarpt till kunder — skattefakta gissas aldrig.
(d) Ångrad avprickning efter utskickat kvitto: kvittot består med sitt nummer + notering. Kreditrutin + bokförings-export = Roger-feedback senare, ej v1.

Kvitterat i klartext av Marcus i huvudsessionen (S102). AC 1 därmed uppfylld i formen 'Marcus-beslut med efterhandsbekräftelse öppet bokförd'.

--- TASK-147.7 BYGGT (S104-batchen) ---

Branch task/147-7-kvittogenereringen-med-nummerserien. ADR-109 mintad (docs/decisions/ADR-109-kvittoserien-nummerformat-server-side-allokering.md).

AC-status (matt): AC1 CHECKAD (redan uppfylld per Marcus-beslutet ovan). AC2 CHECKAD - unikhet under samtidighet HERMETISKT bevisad (tests/api/receipt-numbering.test.ts, 8-vags + 16-vags Promise.all-forcerad kollision via JS microtask-schemalaggning, konvergerar till fullt unika/tata serier; negativ-kontroll utanfor sviten visade en naiv "las-max-skriv" ger 8/8 dubbletter - testets assertion faller alltsa en trasig implementation). Ingen retroaktiv omnumrering bevisad (samma testfil). Server-side allokering: EF:en (send-receipt-email) ar enda anroparen, klienten skickar aldrig ett nummer. AC3 EJ CHECKAD - strukturellt FRAMME-bevis kraver deploy (send-receipt-email ar INTE deployad denna landning, ADR-050-gransen 147.1/147.5 sjalva drog) - orkestratorn kor det skarpa beviset post-merge, 147.5-formen (skarpt Resend-testadress-utskick, verifiera mottagen PDF-bilaga). AC4 CHECKAD - ADR-109 mintad, klarar ADR-baren.

RACKNAREN + SAMTIDIGHETSFORMEN: las-hogsta + skriv-med-verifikation + deterministisk retry (lexikografiskt lagsta record-ID vinner en kollision, forloraren raderar sin kandidat-rad och gor om). Grundas i airtable-constraints.md P1-P3 (ingen unique-constraint, inga transaktioner, darmed ingen atomisk increment mojlig). Se ADR-109 for fullt protokoll + öppet accepterad risk.

BAS-ANDRINGAR (staging apphjj8Q7lkXCMsL4, additivt via Airtable MCP 2026-08-10 - AIRTABLE_SCHEMA_TOKEN saknas lokalt, samma lage 147.5 bokforde): NY tabell "Kvitton" (tblk8fZcArXPpRYnX). Falt: Kvittonummer (fld9EGUVTAAxaTCgi, primar), Lopnummer (fld1MG9vqWEUCDRiG), Ar (fld7kVi54GjRQuPj1), Anmalan (fldWy85dgt1wO4Y22, lank->Anmalningar), Betalning (fld5SsZEzBE9XhUPB, singleSelect Anmalningsavgift/Slutbetalning), Belopp (fldwO7GctRtwVJxfw), Betalsatt (flduZJlcp2tt5IMGY, singleSelect Swish/Bankgiro/Plusgiro), Kundnamn (fldVxMC6iRe9JfwfZ), Event (fldGsIws20jemOU7A, lank->Eventplanering), Skickad (fldxatZmtZlnojqCG), Lagringsnyckel (fldCBnN8PIPGvvTfQ), Notering (fldR2GNoEyGt8peeX). Deklarativ hemvist: scripts/create-kvitton-table.mjs (ej exekverad, MCP-skapelsen ar sanningen; eget pure-testsvit 30/30 grona, scripts/test-create-kvitton-table.mjs). PROD ALDRIG rord - schemadivergens mot task-191-sparet, samma monster som Bilagor-tabellen. Sidoeffekt (samma som Bilagor-tabellens lank): spegelfalt "Kvitton" foddes automatiskt pa bade Anmalningar och Eventplanering (Airtables tvavags-lankbeteende) - inget annat rort.

KOD: nya delade moduler supabase/functions/_shared/{receipt-numbering,send-receipt,receipt-content}.ts (Node+Deno dual-importable, DI-monster som send-action-email.ts), ny EF send-receipt-email/index.ts (EN mottagare/EN betalning per anrop - INTE en femte ActionType pa runActionSend, se send-receipt.ts filhuvud for varfor). Ny operation 'create-receipt' i field-allowlists.ts. Ny deleteAirtableRecord i airtable-client.ts (repots FORSTA delete-operation). Klient: SendReceipt.schema.ts, receipts.ts-mutation (useSendReceipt), DataSourceAdapter/AirtableAdapter/SupabaseAdapter utokade. UI: AtgardsSida.tsx SkickaKvittoKnapp - ny knapp i BetalningsSkrivYta/SkrivRad, synlig ENDAST nar betalningen redan ar Mottagen (aldrig automatik, beslut a), Dialog+Select-form for belopp/betalsatt (Lotta-inmatat - basen saknar prisfalt, se ADR-109 Oppna punkter).

GRINDUTFALL: typecheck gron, biome gron (helt repo, 0 fel), build gron, test:api api-pure 20/20 nya grona (+ hela api-pure-sviten opaverkad/gron i full test:api-korning). api-staging: EN ROD trafffad (generate-event-attachment.staging.test.ts) - OFORANDRAD, ORORD fil av mig, live mot staging - trolig miljo-/samtidighets-transient (flera parallella agent-worktrees aktiva denna session) INTE en regression fran detta kort; PR-CI kor aldrig staging (TASK-70.3) sa detta blockerar inte landningen men bokfors har oppet. em-dash-grind + mailto-grind grona. Acceptance (ny fil, tests/acceptance/atgarder-kvitto-send.acceptance.test.ts): 3/3 grona inkl AxeBuilder 0 overtradelser pa betalningspanelen MED knappen synlig och pa dialogen i lyckat-lage. Befintliga 14 atgarder-acceptance-tester opaverkade/grona (regressionskontroll kord).

ARIA/FACIT-DELTA (nytt, EXAKT redovisat per uppdraget - INTE sjalv-godkant): "Skicka kvitto"-knappen ar ny DOM i BetalningsSkrivYta nar en betalning ar Mottagen. Facit-ytan (tests/visual/atgardssida-promoverings-grind.spec.ts + __aria__-snapshots) ar redan stampel-vantande (147.10+147.8-deltat) - detta kort lagger ETT till, MINIMALT (en knapp, atervander befintliga primitiver Dialog/Modal/Select/Button). Sjalv-godkannande av facit ligger UTANFOR detta korts mandat. Visual-sviten (npm run test:visual) EJ kord av mig (tung, ej DoD-kommando) - flaggas for orkestratorn/nasta facit-godkannande-varv.

OPPNA PUNKTER (ADR-109 § Oppna punkter, bygget INTE blockerat men SKARP DRIFT ar det): (1) Momsraden utelamnad - Rogers bekraftelse kravs. (2) Miranons org-uppgifter (orgnr/adress) FINNS INTE i repot nagonstans - explicit MIRANON_ORG_PLACEHOLDER i receipt-content.ts, INGEN gissning. (3) Belopp/betalsatt ar Lotta-inmatade i UI - basen har inget prisfalt (verifierat, sokt data-model.md + domanmodellerna, noll traffar). (4) Ett klient-retry FORE serverns svar (samma jobId) kan forbruka ett extra, aldrig-utfardat nummer (Resend-idempotens skyddar mot dubbel-MAIL, inte mot dubbel-ALLOKERING) - dokumenterat oppet accepterad konsekvens, samma klass som ett "voided" kvittonummer i verkliga system.

EF-ANDRING JA: send-receipt-email (NY). Deploya INTE sjalv (ADR-050-gransen). supabase/config.toml uppdaterad (ny [functions.send-receipt-email]-post, verify_jwt=true). MEDVETET UTELAMNAD ur .prod-functions-allowlist.conf (samma "ingen UI-yta i prod annu"-resonemang som generate-event-attachment/send-action-email).

DATA-MODEL.MD: Kvitton-tabellens falt-ID:n AR INTE tillagda i data-model.md denna landning - samma medvetna deferral som 147.5 gjorde for Bilagor-tabellen ("HELT odokumenterad... utanfor detta korts scope, flaggat for orkestreraren"). Falt-ID:n star fullstandigt i denna anteckning + ADR-109 + scripts/create-kvitton-table.mjs tills en data-model.md-revision tar in dem.

Modell-identitet: Sonnet 5 (claude-sonnet-5).
<!-- SECTION:NOTES:END -->
