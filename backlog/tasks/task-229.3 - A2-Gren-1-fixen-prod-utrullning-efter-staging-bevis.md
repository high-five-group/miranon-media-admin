---
id: TASK-229.3
title: 'A2 Gren 1-fixen: prod-utrullning (efter staging-bevis)'
status: Done
assignee: []
created_date: '2026-08-24 13:36'
updated_date: '2026-08-24 15:44'
labels:
  - ready-for-human
dependencies: []
parent_task_id: TASK-229
ordinal: 577000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Samma ändring som 229.1, utförd i PROD-basens A2 (app8uGPrVCVOm6LfD, wflRPMp5QNGEa7wH1) EFTER att staging-beviset (229.1 AC #4) står. Väg beror på 229.1 AC #2-mätningen: MCP-skrivbar → agent med Marcus GO per steg; annars Marcus i Airtable-UI enligt 229.1:s färdiga instruktion (T167 väg 1-formen). Verifiering efteråt: nästa namnlösa lead-anmälan (eller kontrollerad testpost) får Person-länk + touchpoint; de 61 laddade fällorna desarmerade.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 229.1 AC #4 (ände-till-ände i staging) verifierad grön FÖRE varje prod-steg
- [x] #2 Ändringen live i prod-A2, läst tillbaka ur deployad config
- [x] #3 Skarpt bevis: namnlös person + anmälan ger länk + touchpoint i prod
- [x] #4 data-model.md fälla 21 amenderad till STÄNGD med datum + bevis
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## S112 — Prod-draften skriven (TASK-229.3 steg 1)

Modell: Sonnet 5 (claude-sonnet-5). Utfört 2026-08-24 mot prod-basen
`app8uGPrVCVOm6LfD`, automation `wflRPMp5QNGEa7wH1` (samma ID som staging).
Metodiken följde spec:en `docs/reference/automation-scripts/a2-gren1-person-lank-och-touchpoint.md`
§ Prod-utrullning, nod för nod.

**Fältkontraktet verifierat live FÖRE skrivning** (`get_table_schema`, prod-basen):
alla fyra fält matchade spec:en exakt, noll avvikelse —
`fldQekqRlLfup8x5K` (Anmälningar.Person, multipleRecordLinks→`tbl6ZyCm3V026iFTU`),
`fldLiC0ZiUAdxXu9u` (Touchpoints.Person, samma linked-tabell),
`fldL8gMBzkMHyUoiK` (Touchpoints.Typ, singleSelect — choicen `sel8DlybaDi9slhD3`
"Inskickad anmälan" fanns kvar), `fldcq8oJWTyc8p8dA` (Touchpoints.Datum, dateTime).

**Identitets-skrivning** (`get_automation` läst live → samma config skriven
tillbaka via `update_automation`): `isValid: true`, `actionId: actefWlOQYOuJmUne`.
Återläsningen jämfördes programmatiskt (Python, `json.dumps(..., sort_keys=True)`
efter att `deployedVersion`/`configurationStatus` strippats) mot före-läget:
**EQUAL — semantiskt byte-identisk.** Ingen avvikelse, gick vidare till ändringen.

**Ändringen**: två nya noder i Gren 1 (`wdezdzNWaL1MYcrkE`s första branch), efter
befintliga `wacKY1MLhOdtIXxR7`. Innehållet mirroring:ades exakt mot staging-A2:s
FAKTISKA post-ändring-state (läst live ur `apphjj8Q7lkXCMsL4`/`wflRPMp5QNGEa7wH1`)
eftersom spec:ens § Ändringen inte skrev ut den exakta nya grenbeskrivningen.
`update_automation`: `isValid: true`, `actionId: actjkg0loVDZtVVre`.

**Verifiering: ren addition.** Strukturell diff (Python, nod-för-nod jämförelse
via nyckel, leaf-nivå) mot före-läget visade:
- Adderade nod-nycklar: `wacrYuDXyDNg6grGv` (updateRecord — Person-länk via
  `fldQekqRlLfup8x5K`, refererar `wacmPhj6tKzUl65Wk`) och `wacnB7VdOzprs7Tks`
  (createRecord i Touchpoints — `fldLiC0ZiUAdxXu9u`+`fldL8gMBzkMHyUoiK`=
  `sel8DlybaDi9slhD3`+`fldcq8oJWTyc8p8dA`). Prod fick EGNA persistenta ID:n,
  skiljer sig medvetet från stagings (`wachkIpvrX0FnbdvB`/`wacSOcz26EBGzr661`)
  — förväntat, ID:n är per-bas.
- Borttagna nod-nycklar: inga.
- Ändrade BEFINTLIGA nod-nycklar (leaf-nivå, exkl. själva conditionalGroup-
  containern): inga — de två findRecords-sökningarna, Gren 2/3/4:s samtliga
  noder, och `wacKY1MLhOdtIXxR7` (namn-uppdateringen) är byte-för-byte
  oförändrade.
- Gren 1:s branch-`description` ändrades (förväntat, speglar staging):
  "Uppdatera med namn från anmälan, koppla anmälan till personen och
  registrera touchpointen".
- Topp-nivå-fält (`name`, `description`, `trigger`) oförändrade.

**`deploymentStatus` var `"deployed"` FÖRE och EFTER båda skrivningarna** —
bekräftar spec:ens dokumenterade egenskap: MCP-draftskrivningar mot en deployed
automation ändrar inte live-beteendet.

**Inga record-skrivningar, inga testposter i prod.** Endast automation-draften
rördes.

**Vad Marcus ska klicka:** öppna A2 i prod-basens Airtable-UI
(`app8uGPrVCVOm6LfD`, automation `wflRPMp5QNGEa7wH1`) och klicka **Update** —
det är enda återstående steget för att publicera draften. Skarpt bevis
(namnlös person + anmälan → länk + touchpoint) tas i ett SEPARAT pass EFTER
klicket, per uppdraget. AC #2 bockas INTE här — den kräver "live i prod".

## S112 -- Steg 0-3 slutforda (TASK-229.3 slutbeviset, Sonnet 5)

Steg 0 (AC #2): get_automation(wflRPMp5QNGEa7wH1, includeDeployedVersion: true) mot prod (app8uGPrVCVOm6LfD) gav deploymentStatus: deployed, deployedVersion: null (draft = deployad, ingen avvikelse) -- de tva nya noderna wacrYuDXyDNg6grGv (Person-lank) och wacnB7VdOzprs7Tks (Touchpoint) fanns i Gren 1 av den DEPLOYADE strukturen. Marcus Update-klick bekraftat live.

Steg 1 (mailrisk-sparr): samtliga 12 Airtable-automationer i prod listade + lasta i sin helhet. A1/A2/A3/A7/A12 (trigger pa Anmalningar create/update) innehaller ingen sendEmail-nod -- enbart find/update/create/customScript mot Airtable-tabeller (A1s script skriver hogst Error-log-rader, aldrig mail). A6 (wfl0filPx4wyAcaQ8) HAR en sendEmail-nod till lotta@outsidereality.se + marcus@h5gruppen.se, men triggar pa Eventplanering Belaggning=100%, inte Anmalningar -- strukturellt oatkomlig for en testpost utan Event-lank. Zapier-lagret (schema_reference.md, fryst mars 2026): Zap 9/10 (anmalningsbekraftelse) triggar pa Elfsight-formularinlamning, inte Airtable-radskapande, och stod redan AV sedan okt 2025. Friat -- gick vidare till steg 2.

Steg 2 (skarpt bevis): Personer recelNZc1Rze6MYMK (enbart E-post zz-task2293-namnlos@example.com) + Anmalningar recupmiKjINEKuRxX (samma e-post, Fornamn=ZzBevis2293/Efternamn=Gren1ProdTest) skapade. A2 korde inom sekunder: Personens namn ifyllt, Anmalningar.Person -> recelNZc1Rze6MYMK, Touchpoint recyGNVi4vBwXK0uy skapad (Typ=Inskickad anmalan). A12 satte samtidigt Inskickad. Eventmatchning=Utan event (designat, A1 hittade ingen match). Motprov EJ kord i prod (Gren 2 strukturellt orord + staging-motprov fran 229.1 samma dag star). Sidoeffekt-sokning (Deltaganden, Error-log): noll traffar. STADAT: alla tre poster raderade, efterkontroll zz-task2293/Gren1ProdTest gav noll traffar i Personer/Anmalningar/Touchpoints/Deltaganden/Error-log.

Steg 3 (bokforing): data-model.md falla 21 amenderad med ny STANGD-not (datum, node-ID:n, bevis, stadverifiering). docs/backfill/execute-log.md fick ny sektion 2026-08-24 -- A2 Gren 1-fixens skarpa prod-bevis (sjunde skarpa prod-aktiviteten i loggen) med fullstandig testpost-cykel. AC #1 (229.1 AC#4 gron FORE prodsteg) verifierad -- 229.1-kortet visar samtliga 5 AC ikryssade. AC #2-#4 avbockade via CLI. Full nodstruktur, faltkontrakt och prod-spec: docs/reference/automation-scripts/a2-gren1-person-lank-och-touchpoint.md. Modell-identitet ur egen transcript: You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5.

Done-flipp S112: PR #1923+#1933 landade, post-merge grönt; prod-deploy verifierad + skarpt bevis med nollstädning 2026-08-24. Landning: PR #1933
<!-- SECTION:NOTES:END -->
