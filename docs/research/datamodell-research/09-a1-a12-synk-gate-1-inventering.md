# 09 - A1–A12 Synk-gate 1-inventering

> **Status:** Synk-gate 1-underlag (hård gate per A4, `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md`) — mekanisk halva klar, inväntar Marcus-kvittens för slutlig kategorisering.
> **Datum:** 2026-06-10 (Session 13, arbetspunkt 2 DEL B)
> **Metod:** Åtgärdslistan extraherad ur `06a-airtable-redesign.md` Del A–C; mekaniskt verifierbara signaler kontrollerade live via Airtable MCP (`get/describe_table` mot bas `app8uGPrVCVOm6LfD`, samtliga sex berörda tabeller: Anmälningar, Personer, Väntelista, Touchpoints, Hämtade erbjudanden, Error-log).
> **Metodgräns:** Airtable MCP ser INTE automationer, vy-filter, formulär, Zapier-konfiguration eller Edge Function-kod — endast schema (fältnamn, typer, formler, options, vy-namn). Åtgärdsdelar utanför schemat är markerade "EJ MEKANISKT VERIFIERBAR" och kräver mänsklig verifiering (HAR-export/screenshot/Zapier-inlogg).
> **Beslutsstatus:** Kategori-kolumnen är FÖRSLAG. Slutlig kategorisering (redan applicerade / före Fas 2.5 / efter Fas 2.5) är Marcus-beslut.

## Sammanfattande utfall

Ingen av åtgärderna A1–A8 är applicerad i live-basen per 2026-06-10. Preserve-besluten A10–A11 efterlevs (inget har ändrats som inte fick ändras). A12 rör en automation och är inte MCP-verifierbar. Den praktiska konsekvensen för Synk-gate 1: Fas 2.5 synkar mot ett live-schema där hela 06a-katalogen ligger framför, inte bakom — inga A-åtgärder behöver "upptäckas retroaktivt" i schemat.

## Inventeringstabell

| ID | Åtgärd (ur 06a) | Mekaniskt utfall (live-bevis 2026-06-10) | Kategori-förslag | Kräver Marcus/Lotta-kvittens |
|---|---|---|---|---|
| A1 | Aktiv-semantik exkluderar `Inställt`: formeln i `Anmälningar.Är aktiv (1/0)` (`fld4j7PeckDViTdIB`) utökas med `Inställt` | **EJ APPLICERAD.** Live-formeln är fortfarande `IF({Status}="Avbokad/Ombokad", 0, 1)` — `Inställt` ingår inte. (Status-fältet har option `Inställt`, `selebP2V3qmFRTtdP` — pre-existerande, ej del av A1.) | Efter Fas 2.5 | JA |
| A2 | Mail partial-success synlig/retrybar: EF-kontrakt + Error-log-fält (recordId, mailtyp, tabell, felmeddelande, timestamp) | **EJ APPLICERAD** (Airtable-delen). Error-log har endast 4 fält: `Felmeddelande`, `Datum`, `E-post`, `Relaterar till` — inga recordId-/mailtyp-/tabell-fält. EF-kontraktsdelen EJ MEKANISKT VERIFIERBAR via schema. | Efter Fas 2.5 | JA |
| A3 | Väntelistaflytt idempotency: ny flyttoperation + ev. `Väntelista.Anmälan (flyttad till)` + `Flyttstatus`/`Flyttfel` | **EJ APPLICERAD** (Airtable-markören). Väntelista har 14 fält; inget länk-/flyttstatus-fält finns (06a: "om test visar behov" — frånvaron är därför svagt bevis). Operations-delen EJ MEKANISKT VERIFIERBAR via schema. | Efter Fas 2.5 | JA |
| A4 | Rename `Personer.Återkommande?` (`fld5npMbl3PaSlm4B`) → t.ex. `Aktiv återkommande?` + fältbeskrivning | **EJ APPLICERAD.** Fältet heter fortfarande `Återkommande?` och saknar fältbeskrivning. | Efter Fas 2.5 | JA |
| A5 | Kanonisera case-dubletter i `Anmälningar.Vill anmäla sig till` (`fld6RC3r0R9tuKgdF`) | **EJ APPLICERAD.** Dubletterna kvar: `Resor i Medvetandet 1` (`selCYP1qT4eBptaoi`) och `Resor i Medvetandet 2` (`selipzhJDcLRkNApB`) parallellt med kanoniska gemena-varianter; dessutom generisk option `Resor i medvetandet` (`selRq549SC1KR1tyi`). | Efter Fas 2.5 | JA |
| A6 | Canonical count: pensionera `Personer.Antal genomförda event (gammal)` (`flddymQaYJGVCInzq`) via ARKIV-rename → senare delete | **EJ APPLICERAD.** Fältet kvar med originalnamn, ingen ARKIV-prefix, ingen canonical-markering på `Antal genomförda event` (`flddy8JND3YnlgZxe`). | Efter Fas 2.5 | JA |
| A7 | Tomma singleSelects: `Personer.Manuella flagga` (`fldNtwQt6tOCIdf4f`) + `Touchpoints.Systemkälla` (`fldSXO9yRrxVceBkp`) — ARKIV-rename eller beslutad taxonomi | **EJ APPLICERAD.** Båda fälten kvar med originalnamn och `choices: []` (tomma option-listor, ingen taxonomi, ingen ARKIV-rename). | Efter Fas 2.5 | JA |
| A8 | Zapier-source values läsbara: options i `Hämtade erbjudanden.Källa (formulärkälla)` (`fldF9SgJS1Zv5kmtr`) byts från hashar | **EJ APPLICERAD** (Airtable-delen). Options är fortfarande de två hashsträngarna `ae9a4975…` + `58947ba3…`. Zap 5/6-konfigurationen EJ MEKANISKT VERIFIERBAR via MCP. | Efter Fas 2.5 | JA |
| A9 | Preserve: namnlösa Personer är giltig lead-state; ev. vy `Leads utan namn` eller fältbeskrivning | **MARKÖRER EJ APPLICERADE.** Ingen vy med namnet `Leads utan namn` (vy-namn synliga; vy-filter EJ synliga via MCP), ingen fältbeskrivning på `Förnamn`/`Efternamn`. Själva preserve-efterlevnaden (inga raderingar/placeholder-ifyllningar) är data-nivå — EJ MEKANISKT VERIFIERBAR via schema. | Preserve gäller (designbeslut, ingen schemaändring att kategorisera) | NEJ |
| A10 | Preserve: `Återkommande?`-formeln "rättas" inte | **PRESERVE EFTERLEVD.** Live-formeln är oförändrad: `IF(AND({Antal tidigare genomförda utbildningar} > 0, {Anmäld till antal kommande utbildningar} > 0), "Ja", "Nej")`. | Preserve gäller (rename-delen följer A4) | NEJ |
| A11 | Preserve: `Personer.RIM 3 ×` (`fld93OrTArvdkkYmk`) behålls som Airtable-native rollup | **PRESERVE EFTERLEVD.** Fältet finns kvar som rollup från `Deltaganden.RIM 3 eventkey` (`fldL0YfWmdkOuxgsH`). | Preserve gäller | NEJ |
| A12 | Defer: A2-automationens grenordning ändras inte; endast sandbox-verifieringsinstruktion | **EJ MEKANISKT VERIFIERBAR.** Automationer är inte synliga via Airtable MCP (kräver HAR-export eller screenshots). Ingen schemaförändring förväntas heller — defer-beslutet lämnar inga schema-spår. | Defer kvarstår (verifiering = Lotta/Roger-moment) | JA |

## Not om kategori-förslaget

Förslaget "Efter Fas 2.5" för A1–A8 följer av det mekaniska utfallet: inget är applicerat, och Fas 2.5 synkar mot nuvarande live-schema (Status-optionens 6 värden finns redan live och matchar Fas 2.5 DoD punkt 1). Appliceras A-åtgärder senare fångas schema-drift av Zod-runtime-valideringen (Fas 2.5 leverans) + Synk-gate 2 (handshake per Fas 5.5/6-operation). Alternativ kategorisering "före Fas 2.5" för någon åtgärd är ett rent Marcus/Lotta-beslut — inget i live-state tvingar den ordningen.

## Spårbarhet

- Gate-definition: `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` (A4 Design-not); `docs/byggplan.md` §2 rad B + §4 Fas B (drift-korrigerade i Session 13); `tasks/byggplan-direktiv.md` §5 rad B.
- Åtgärdskatalog: `docs/research/datamodell-research/06a-airtable-redesign.md` Del A–C.
- Forensik + sessionstrail: `tasks/sessions/2026-06-10-session-13.md`.
