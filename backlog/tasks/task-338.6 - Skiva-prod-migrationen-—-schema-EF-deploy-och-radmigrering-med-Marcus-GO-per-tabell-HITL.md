---
id: TASK-338.6
title: >-
  Skiva: prod-migrationen — schema, EF-deploy och radmigrering med Marcus GO per
  tabell (HITL)
status: To Do
assignee: []
created_date: '2026-08-29 08:04'
updated_date: '2026-08-29 17:17'
labels:
  - ready-for-human
dependencies:
  - TASK-338.1
  - TASK-338.2
  - TASK-338.3
  - TASK-338.4
  - TASK-338.5
parent_task_id: TASK-338
ordinal: 616000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-moment i tre steg, i denna ordning: (i) Bilagor i PROD får option 'Gemensam', länken Plats → Platser (tblPeNLeeQ1IduGTK) och lookup Platsnamn — additivt, efter Marcus GO i klartext för tabellen Bilagor (ADR-125 § 8); (ii) EF-deploy till prod via bash scripts/fas4-prod-deploy.sh --deploya <prod-ref> i EGET terminalfönster (aldrig via !-prefixet, CLAUDE.md § Prod-EF-deploy), verifierat på UPDATED_AT; (iii) radmigrering Kurstyp/Alla event → Gemensam i prod med räkneverifiering före/efter, efter Marcus GO. Ordningen är säker oavsett tack vare läsvägens legacy-tolerans (338.2). Orkestreraren förbereder ett skript med --kontrollera (läser, ändrar inget) och --utfor för steg (i) och (iii) med prod-ref som argument (deny-prod-ref-låset bevaras). data-model.md § Bilagor får prod-ID:n. Täcker användarberättelser: 10, 14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Prod: option, länk och lookup finns (fält-ID:n bokförda); Marcus GO citerat i Implementation Notes
- [x] #2 Prod-EF:erna get-event-attachments, upload-attachment, finalize-attachment-upload, update-attachment-scope deployade — UPDATED_AT-tider bokförda
- [ ] #3 Prod: 0 rader kvar med Kurstyp/Alla event; antal Gemensam = summan före; de två dokument Marcus laddade upp 2026-08-29 finns kvar och är läsbara i räckviddsläget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [ ] #5 Deny/allow-test grönt för varje ny eller ändrad EF-operation (sub-fas-mönstret, field-allowlists)
- [ ] #6 Lagervakten grön — matchning och validering bor i EF/_shared, aldrig i klienten (ADR-057)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Modell-identitet:** Sonnet 5 ("You are powered by the model named Sonnet 5. The exact model ID is claude-sonnet-5.").

Denna sektion är den KONSOLIDERADE, GÄLLANDE versionen (skriven via `backlog task edit --notes`, review-runda 3 — ersätter tidigare ackumulerade notes som innehöll en FELAKTIG kommandoföljd, rapporterad av granskaren). Historik: tre granskningsrundor mot PR #2097 (`e0ddc1fe` → `caca9989` → `984ce344` → denna), sammanfattade i § Granskningshistorik nedan.

## Premiss-pass (ADR-086) — tre divergenser funna vid bygget, alla bokförda

1. **`scripts/deny-prod-ref.sh` vaktar INTE Airtable-bas-ID:n.** Läst i sin helhet (`.prod-ref-policy.conf` + skriptet): matchar ENDAST Supabase-projektets prod-ref (TASK-203, värdet står i `.prod-ref-policy.conf` som `PROD_REF_PROD`). Airtables prod-bas-ID (`app8uGPrVCVOm6LfD`) nämns i policyfilen EN gång, i en KOMMENTAR, aldrig som matchat värde. Uppdragets föreslagna prov ("kör `--kontrollera app8uGPrVCVOm6LfD` och se om hooken faller") hade i verkligheten inneburit en LIVE, OBLOCKERAD läsning mot förbjuden prod — kördes DÄRFÖR ALDRIG mot verklig prod. Skriptet bär i stället sin EGEN mekaniska guard (`resolveTargetBaseId`), skarpt bevisad via barnprocess: `--kontrollera app8uGPrVCVOm6LfD` utan `AIRTABLE_PROD_GODKAND_AV_MARCUS` → exit 1, ingen fetch. Källa: `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret" bekräftar oberoende. (Denna nots egen skrivning demonstrerade samma lås skarpt: ett tidigare utkast med Supabase-prod-refen utskriven i en Bash-heredoc fälldes av exakt denna hook — bevis i PR-transkriptet, inte i denna fil.)
2. **`prefersSingleRecordLink: true`** i ursprungsuppdragets fältspec stämde inte — live `describe_table` mot staging visade `false`. Skriptet skapar `Plats`-fältet UTAN det attributet, matchande den levande formen.
3. **Radantalet 0/9 (TASK-338.1s rapport) hade driftat till 6/158 vid bygg-tid** (TASK-338.2 landade mellan 338.1 och detta bygge, dess testsvit exercisar legacy-mappningen och skapar nya legacy-fixturer löpande). Idempotens bevisad på den ANDRA `--utfor`-körningen (0 skrivningar), inte den första.

## Vad som är byggt

- `scripts/task-338-6-prod-migration.mjs` — TRE lägen: `--kontrollera <bas-id>` (läser schema OCH rader, ändrar inget), `--utfor-schema <bas-id>` (steg i: option "Gemensam" + länkfältet Plats + lookupfältet Platsnamn — rör ALDRIG en riktig Bilagor-rad; choice-skapelsen använder alltid en kastbar rad, skapa+radera, typecast), `--utfor-rader <bas-id>` (steg iii: radmigrering Kurstyp/Alla event → Gemensam i batchar om 10, Kursfamilj/Kursnivå orörda — kräver att choicen redan finns, annars `GuardError`). Bas-ID alltid argument, aldrig config.
- **Prod-lås:** `resolveTargetBaseId` kräver miljövariabeln `AIRTABLE_PROD_GODKAND_AV_MARCUS` satt till EXAKT samma bas-ID som körningen fick (t.ex. `AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD`, ALDRIG ett kort värde som `1` eller `true`) — annars VÄGRAR skriptet innan någon nätverksanrop görs. Samma mönster som `create-eventinnehall-modell.mjs` § TASK-309.9.
- **Fail-closed post-verifiering:** efter `--utfor-schema`/`--utfor-rader` läses schemat/raderna FÄRSKT och prövas igen (`schemaKonvergerad`/`raderKonvergerade`) — diskrepans → **exit 4**, aldrig bara en utskriven varning.
- **Config-baserad idempotens:** ett Plats-/Platsnamn-fält som redan finns men är FELKONFIGURERAT (fel type/linkedTableId/recordLinkFieldId/fieldIdInLinkedTable) fäller med `GuardError` och rör INGET.
- **Kvarleva-spårbarhet (review-runda 3):** `createThrowawayAndDelete` loggar det skapade record-ID:t INNAN DELETE-försöket; misslyckas DELETE bär felmeddelandet ID:t ("KVARLEVA — radera X manuellt"). `--kontrollera`-rapporten har en rad **"Gemensam-rader utan Namn/Event-länk: K"** som räknar potentiella föräldralösa kastbara rader (signaturen: varken `Namn` eller `Event`-länk satt — en riktig Gemensam-bilaga har alltid minst ett av de två).
- **5xx-retry** med exponentiell backoff (2 försök, 1 s/2 s) utöver befintlig 429-hantering, hermetiskt testad via injicerad `fetchImpl`/`sleepImpl`.
- **PAT-scope-kravet:** `AIRTABLE_SCHEMA_TOKEN` måste bära PAT-scopet `schema.bases:write` (utöver `schema.bases:read`) — detta är EN ANNAN AXEL än Airtable-basens `permissionLevel` (t.ex. "create") som ett token/collaborator kan ha på basen som HELHET. Ett token kan ha `permissionLevel: "create"` på basen och ÄNDÅ sakna det granulära PAT-scopet om det skapades med en snävare scope-lista. Se `docs/reference/atkomst-och-nycklar.md` § "TOKEN-FÄLLAN, mätt och rättad" för distinktionen, och § "Prod-deploy av bilagespåret" → (a) Prod-schemat för var den dedikerade, least-privilege-scopade PAT:en beskrivs (prod-varianten; staging-varianten i `.env.seed.example`s `AIRTABLE_SCHEMA_TOKEN`-block).
- `scripts/test-task-338-6-prod-migration.mjs` — **74 fall**, samtliga hermetiska (DI mot injicerade `fetchImpl`/`sleepImpl`/`logImpl`, ingen riktig fetch/väntan/global console.log-mutation). Tvåsidigt bevisad TRE gånger (en per granskningsrunda): en planterad regression föll rött exakt på den avsedda platsen, återställt → alla gröna igen.
- Wirad i `ci.yml`:s "Test gatekeeper script suites"-steg (samma steg som `test-fas4-prod-deploy.sh`) — kommentaren där är uppdaterad till 74 fall / `planSchema`/`runSchema`/`planRader`/`runRader` / exit 0–4 (review-runda 3, punkt 3).
- `package.json`: `"migration:task-338-6"`-npm-script för STAGING-bruk. En PROD-körning görs med `node scripts/task-338-6-prod-migration.mjs` DIREKT (inte via npm-scriptet), inline-env — samma konvention som `atkomst-och-nycklar.md` redan etablerar för `create-eventinnehall-modell.mjs`.
- `.staging-preflight-wiring-policy.json`: skriptet + dess testsvit registrerade (`kravStagingLedigt()` i `main()`, hoppas över för prod-mål).

**Ärlig gräns, bokförd öppet:** create+typecast-mekanismen för choice-skapelse (`--utfor-schema` steg 1) är INTE oberoende omprövad skarpt — TASK-338.1 bevisade UPDATE-vägen (PATCH på en riktig rad) skarpt; review-runda 2 bytte till CREATE+DELETE av arkitekturskäl (schema-steget ska aldrig röra en riktig rad). Airtables dokumenterade typecast-beteende beskrivs som identiskt för create och update, men detta specifika create-anrop har ALDRIG körts skarpt — ingen av de tre granskningsrundorna tillät en ny `--utfor-schema`-körning mot staging (fälten fanns redan där sedan tidigare). Marcus faktiska prod-körning (steg 3 i kommandoföljden nedan) blir den FÖRSTA skarpa exekveringen av denna kodväg.

## Skarp körning mot STAGING — prod (`app8uGPrVCVOm6LfD`) ALDRIG anropad i denna skiva

Token: Airtable-MCP-serverns PAT (`~/.claude.json` → `mcpServers.airtable.env.AIRTABLE_API_KEY`), exporterad som BÅDE `AIRTABLE_SCHEMA_TOKEN` och `STAGING_AIRTABLE_TOKEN` — sanktionerad väg, `atkomst-och-nycklar.md` § "TOKEN-FÄLLAN". `.env.seed` saknar en dedikerad `AIRTABLE_SCHEMA_TOKEN` lokalt (samma kända lucka som `create-bilagor-table.mjs`/`create-eventinnehall-modell.mjs`).

- **Build-rundan:** `--kontrollera` → `--utfor` (gamla kombinerade läget, 6 rader migrerade) → `--kontrollera` → `--utfor` igen (**0 skrivningar, sant idempotens-bevis**).
- **Review-runda 2:** endast `--kontrollera` (schema redan i synk sedan build-rundan).
- **Review-runda 3:** endast `--kontrollera` (samma) — bekräftade den nya "Gemensam-rader utan Namn/Event-länk"-raden fungerar live: **0** (inga kvarlevor finns, väntat — ingen `createThrowawayAndDelete`-DELETE har någonsin fallerat mot staging).

## Rörda filer

- `scripts/task-338-6-prod-migration.mjs`, `scripts/test-task-338-6-prod-migration.mjs` — skriptet + testsviten.
- `package.json`, `.github/workflows/ci.yml`, `.staging-preflight-wiring-policy.json` — wiring.
- `backlog/tasks/task-338.6 - *.md` — denna notes-uppdatering.

## AC/DoD-status

**AC #1–#3:** inget bockat (Marcus prod-steg, uppdraget explicit). Kräver Marcus faktiska prod-körning enligt § Kommandoföljd nedan.

**DoD:** #1 N/A (Marcus prod-steg) · #2 rörda grindar gröna (se § Grindar) · #3 path-scopad add, inga orelaterade filer · #4 N/A för denna skiva (prod aldrig rörd) men MEKANIKEN som tvingar GO-i-klartext är levererad och skarpt bevisad · #5/#6 N/A (ingen EF-/klientkod rörd).

## Grindar (senast mätta, review-runda 3)

| Grind | Resultat |
|---|---|
| `node scripts/test-task-338-6-prod-migration.mjs` | **74/74 gröna**, exit 0, 1,25 s lokalt |
| `npm run typecheck` | exit 0 |
| `npx @biomejs/biome check .` | exit 0 (bara pre-existerande, orörda warnings/infos) |
| `actionlint -ignore 'unexpected key "queue"…'` | exit 0 |
| `yamllint -c .yamllint.yml .github/workflows/ci.yml` | exit 0 |
| `node scripts/check-staging-preflight-wiring.mjs` | grön, 8 Node-ytor, 0 oklassade |
| `--kontrollera apphjj8Q7lkXCMsL4` | exit 0, endast läsning |

## § Kommandoföljd Marcus kör mot PROD — DENNA SEKTION ÄR DEN ENDA GÄLLANDE

(Tidigare versioner: en använde ett felaktigt kombinerat `--utfor <bas-id>`-läge som inte längre finns (rättat runda 3). Nästa version saknade steg 0 nedan — `resolveTargetBaseId()` körs OVILLKORLIGT för ALLA lägen, inklusive `--kontrollera`, så steg 1/4/8 utan steg 0 hade fallerat med exit 1 INNAN någon läsning skedde (review-runda 4). Beslut på Marcus mandat: guarden förblir strikt — en LÄSNING mot prod är fortfarande prod-ÅTKOMST och ska inte vara billigare att trigga än en skrivning. Denna version har steg 0 och är verifierad mot en isolerad kopia av skriptet med injicerad `fetch` — se § Verifiering nedan.)

**Steg 0 — kör EN gång per terminalsession, INNAN steg 1:**

```
export AIRTABLE_PROD_GODKAND_AV_MARCUS=app8uGPrVCVOm6LfD
export AIRTABLE_SCHEMA_TOKEN="<prod-scopad-PAT-med-schema.bases:write>"
export STAGING_AIRTABLE_TOKEN="<samma-prod-scopade-PAT>"
```

Detta ÄR Marcus GO för ÅTKOMST till prod-basen (både läsning och skrivning) — den gäller för HELA den terminalsessionen (varje `node scripts/…`-anrop i samma fönster ärver den, ingen behöver upprepa den). Det är INTE detsamma som GO för SCHEMAT (steg 2, före steg 3) eller GO för RADERNA (steg 6, före steg 7) — de två förblir SEPARATA klartextbeslut i chatten, ADR-125 § 8. `AIRTABLE_SCHEMA_TOKEN` måste bära PAT-scopet `schema.bases:write` (utöver `schema.bases:read`) — EN ANNAN AXEL än basens `permissionLevel` (t.ex. "create"); se `atkomst-och-nycklar.md` § "TOKEN-FÄLLAN, mätt och rättad" för distinktionen och § "Prod-deploy av bilagespåret" → (a) Prod-schemat för var den dedikerade PAT:en beskrivs. Sätt ALDRIG någon av dessa tre i `.env.seed` (den är staging-scopad).

**Terminalfönster-fällan:** `export` gäller bara DEN process/det fönster där det kördes. Steg 5 (EF-deploy) MÅSTE köras i ett EGET fönster (CLAUDE.md § Prod-EF-deploy) — gör resten av sekvensen (steg 6–8) i steg 0:s URSPRUNGLIGA fönster, inte det nya. Byter Marcus fönster av någon anledning: kör steg 0 igen där.

`--kontrollera`/`--utfor-schema`/`--utfor-rader` är alla snabba (sekunder) och får gå via `!`-prefixet. EF-deploy-steget (5) INTE — eget terminalfönster, kommandot `bash scripts/fas4-prod-deploy.sh --deploya <supabase-prod-ref>` (refen står i `.prod-ref-policy.conf`s `PROD_REF_PROD` — skrivs INTE ut här i klartext: `scripts/deny-prod-ref.sh` fäller varje Bash-kommando som nämner den, se § Premiss-pass punkt 1).

```
1) Läs planen mot prod (ändrar inget):
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Gemensam" finns: NEJ · Plats-fält finns: NEJ · Platsnamn-fält finns: NEJ ·
   radfördelning (N rader Kurstyp + M rader Alla event, "Att migrera: N+M").

2) Marcus GO i klartext för SCHEMAT på tabellen Bilagor (ADR-125 § 8).

3) Steg (i): schema — KRÄVER steg 2:s GO (steg 0:s export bär redan åtkomsten):
   node scripts/task-338-6-prod-migration.mjs --utfor-schema app8uGPrVCVOm6LfD
   Förväntat: exit 0. Exit 4 = post-verifieringen visade att schemat INTE
   konvergerade — STOPPA, utred INNAN nästa steg.

4) Verifiera schemat:
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Gemensam" finns: JA · Plats-fält finns: JA · Platsnamn-fält finns: JA.
   Fält-ID:na skriptets utdata rapporterar (skapade i steg 3) bokförs i
   data-model.md § Bilagor, prod-kolumnen (idag "väntar TASK-338.6").

5) Steg (ii): EF-deploy — EGET terminalfönster, ALDRIG via !-prefixet (~10 min):
   bash scripts/fas4-prod-deploy.sh --kontrollera <supabase-prod-ref-ur-.prod-ref-policy.conf>
   bash scripts/fas4-prod-deploy.sh --deploya     <supabase-prod-ref-ur-.prod-ref-policy.conf>
   (Tillbaka i steg 0:s URSPRUNGLIGA fönster för steg 6–8 — se § Terminalfönster-fällan.)

6) Marcus GO i klartext för RADERNA (ADR-125 § 8, "irreversibelt i data").

7) Steg (iii): radmigrering — KRÄVER steg 6:s GO:
   node scripts/task-338-6-prod-migration.mjs --utfor-rader app8uGPrVCVOm6LfD
   Förväntat: exit 0. Exit 4 = legacy-rader kvar EFTER migreringen — STOPP,
   utred (rör inget mer förrän orsaken är förstådd).

8) Slutverifiering:
   node scripts/task-338-6-prod-migration.mjs --kontrollera app8uGPrVCVOm6LfD
   Läs: "Att migrera: 0" · "Redan Gemensam" = N+M (summan från steg 1).

9) De två dokument Marcus laddade upp 2026-08-29 som "Alla event" omklassas
   via "Ändra räckvidd" I APPEN (TASK-338.4/338.7) — INTE via detta skript
   eller basen direkt (TASK-338 § Implementationsbeslut).
```

Efter körning: bocka AC #1–#3 på detta kort och sätt Status via `task edit`.

**§ Verifiering (review-runda 4) — hur ovanstående kommandorader kontrollerades UTAN att röra någon bas:** en isolerad körning av det RIKTIGA skriptet (dynamisk import, ingen kopiering av logiken) med `globalThis.fetch` MONKEY-PATCHAD till en lokal, minnesresident Airtable-fejk INNAN skript-modulen laddades — så att INGEN riktig nätverksanrop kan uppstå oavsett vad skriptet gör internt (granskarens 401-miss i förra rundan berodde på att ett verkligt anrop nådde `api.airtable.com`; denna metod utesluter det strukturellt, inte bara av försiktighet). Fem scenarier kördes:

| Scenario | argv | Steg 0 satt? | Utfall |
|---|---|---|---|
| Bugreproduktion | `--kontrollera app8uGPrVCVOm6LfD` | NEJ | exit 1, **0** fetch-anrop — matchar exakt granskarens fynd |
| Steg 1/4/8 | `--kontrollera app8uGPrVCVOm6LfD` | JA | 2 fetch-anrop (stubbade), fullständig rapport, exit 0 |
| Steg 3 | `--utfor-schema app8uGPrVCVOm6LfD` | JA | choice + två fält skapade, "konvergerat: JA", exit 0 |
| Steg 7 (utan föregående steg 3, egen process) | `--utfor-rader app8uGPrVCVOm6LfD` | JA | `GuardError` — "kör --utfor-schema FÖRST", exit 1 (korrekt, inte en bugg) |
| Steg 7 (schema förseedat som redan migrerat) | `--utfor-rader app8uGPrVCVOm6LfD` | JA | 2 rader migrerade, "konvergerat: JA", exit 0 |

Ingen kod ändrad denna runda — endast kortets notes, per koordinatorns explicita instruktion.

## Granskningshistorik (PR #2097)

| Runda | Granskad SHA | Risk | Fynd → åtgärd |
|---|---|---|---|
| 1 | `e0ddc1fe` | hög | 5 fynd: Platsnamn-body-formen (ERROR, fixad runda 2), --utfor-split (WARNING, fixad runda 2), fail-closed (WARNING, fixad runda 2), config-idempotens (WARNING, fixad runda 2), PAT-scope+5xx-retry (INFO, bokförd runda 2) |
| 2 | `984ce344` | medel | 3 fynd: kortets kommandoföljd (ERROR, fixad runda 3), kvarleva-spårbarhet för createThrowawayAndDelete (WARNING, fixad runda 3), ci.yml-kommentardrift (INFO, fixad runda 3) |
| 3 | `3177b631` | medel | 1 fynd: kortets § Kommandoföljd saknade steg 0 (guard-export) — resolveTargetBaseId körs ovillkorligt för ALLA lägen, så steg 1/4/8 hade fallerat med exit 1 (ERROR, fixad DENNA runda, ENDAST notes — ingen kod) |
| 4 | (denna commit) | — | väntar granskning |

## § Steg (i) utförd mot prod 2026-08-29

Körning: `node scripts/task-338-6-prod-migration.mjs --utfor-schema app8uGPrVCVOm6LfD` följt av `--kontrollera app8uGPrVCVOm6LfD` — **båda exit 0** (mätdata levererad av orkestreraren till bygg-agenten som bokförde detta, verbatim ur de två körningarna).

Prod-bas: `app8uGPrVCVOm6LfD`
- Bilagor-tabell: `tblevR1B54wFjp7QC`
- Platser-tabell: `tblPeNLeeQ1IduGTK`
- Räckvidd-choices EFTER: `Event, Kurstyp, Alla event, Gemensam` (optionen `Gemensam` tillagd)
- Nytt länkfält `Plats` → `fldiRBrqROTJ7fnFs`
- Nytt lookupfält `Platsnamn` → `fldFgcCtK8gRRm2m8`
- Verifiering: `konvergerat: JA`, `Skrivningar: optionAdd=2 platsField=1 platsnamnField=1` (`optionAdd=2` = create+delete-paret för den kastbara raden, inte två tillagda choices — se `runSchema()` rad ~481)
- Kastbar rad `rec5qoF9b2uBmNP3B` skapades och raderades korrekt (`--kontrollera` efteråt: `Gemensam-rader utan Namn/Event-länk: 0` — inga kvarlevor)

**Marcus GO (2026-08-29), verbatim:** *"Du har ett GO från mig för steg 2 (schemaändringen)."* (ADR-125 § 8)

`docs/reference/data-model.md` § Bilagor uppdaterad med prod-ID:na för `Plats`/`Platsnamn`; Räckvidd-choicens ID och Platsers auto-födda spegelfälts ID fångas INTE av migreringsskriptet (`runSchema()` läser aldrig tillbaka dem) — bokfört öppet i tabellen som en känd lucka, inte gissat.

**AC #1 INTE bockad ännu** — kräver även fält-ID:n för choicen/spegelfältet dokumenterade (ovanstående lucka) och att steg (ii) EF-deploy + (iii) radmigrering är gjorda. Status kvarstår `To Do`.

## § Steg (i) — de två återstående prod-ID:na kompletterade 2026-08-29

`docs/reference/data-model.md` § Bilagor uppdaterad ovan sade att Räckvidd-choicen "Gemensam" och Platsers auto-födda spegelfälts ID inte kunde bokföras eftersom `scripts/task-338-6-prod-migration.mjs`s `runSchema()` aldrig fångar dem (choicen skapas via en kastbar rads typecast utan efterläsning; spegelfältet auto-föds av Airtable och skriptet frågar aldrig efter dess ID). Orkestreraren mätte de två saknade värdena separat via `describe_table` mot prod (`app8uGPrVCVOm6LfD`, tabell `tblevR1B54wFjp7QC`), på Marcus stående GO för prod-LÄSNING:

- Räckvidd-choicen `Gemensam` → **`selsABHUcAQJqGd0M`**. Full choice-lista i prod: `seljRFJnazDELbE3C` (Event) · `selkHwo1c3WtQpBnC` (Kurstyp) · `seliEQKhV8i2KFTM0` (Alla event) · `selsABHUcAQJqGd0M` (Gemensam). **Not:** "Gemensam" fick färgen `blueLight2` medan de tre äldre choicesen alla har `grayLight2` — Airtables egen färgtilldelning vid typecast-skapelse, inte en avsiktlig färgsättning.
- Platsers auto-födda spegelfält (invers av `Plats`) → **`fld1yaGrVppKh9fyh`**, läst ur `Plats`-fältets `options.inverseLinkFieldId`.

Bonus mätt i samma svar: `Platsnamn`-lookupens `fieldIdInLinkedTable` i prod = `fld9CfDq4rqTAGGpw` (Platser.Namn). `Plats`-fältet har `prefersSingleRecordLink: false` i prod — bekräftar staging (`prefersSingleRecordLink: false`), vilket stänger denna kortsnots § Premiss-pass punkt 2 (uppdragsspecen sa `true`).

`scripts/task-338-6-prod-migration.mjs`s tooling-lucka (`runSchema()` fångar aldrig choice-/spegelfälts-ID) kvarstår som ett verkligt fynd oberoende av att värdena nu är mätta för hand — bokfört i data-model.md, försvinner inte ur historiken.

**AC #1 fortfarande INTE bockad** — kräver att steg (ii) EF-deploy och (iii) radmigrering också är gjorda. Status kvarstår `To Do`.

## § Steg (ii) och (iii) utförda mot PROD 2026-08-29 — AC #1 och #2 bockade

**Marcus GO, verbatim:** schemat — *"Du har ett GO från mig för steg 2 (schemaändringen)."* · raderna — *"Kör!"* (ADR-125 § 8, två separata klartextbeslut som föreskrivet).

**Arbetsdelningen** följde `atkomst-och-nycklar.md` § "Prod-deploy av bilagespåret"s VEM-tabell: schema- och radstegen är AGENT-körbara på Marcus GO i klartext (gaten `AIRTABLE_PROD_GODKAND_AV_MARCUS` sitter INUTI skriptet, ingen hook); endast EF-deployen bär Supabase-prod-refen och fälls mekaniskt av `deny-prod-ref.sh`. Orkestreraren körde steg 1/3/4/7/8, Marcus steg 5.

**Steg (iii), radmigreringen** (`--utfor-rader`, exit 0): `2 rad(er) migrerade till "Gemensam"`, `konvergerat: JA`, `Kurstyp/Alla event kvar: 0 (förväntat 0)`, `radMigrering=2`. Slutverifieringen (`--kontrollera`, exit 0): `Att migrera: 0` · `Redan Gemensam: 2` = summan från steg 1 · `Gemensam-rader utan Namn/Event-länk: 0`. Raden med tomt `Räckvidd` (1 st) orörd som avsett.

**Steg (ii), EF-deploy — TVÅ körningar, och skälet till den andra:**

| Deploy | Tid (UTC) | Omfattning | Utfall |
|---|---|---|---|
| 1 | 15:30:41–15:37:04 | 45 funktioner | alla färsk `UPDATED_AT`, återlänkad staging |
| 2 | 17:08:18–17:12:36 | **46** funktioner | `update-attachment-scope` **VERSION 1** (ny i prod), återlänkad staging |

`UPDATED_AT` för de fyra AC #2 räknar upp, efter deploy 2: `finalize-attachment-upload` 17:09:49 · `generate-event-attachment` 17:09:59 · `get-event-attachments` 17:10:18 · `upload-attachment` 17:11:27 · plus `update-attachment-scope` 17:12:36.

**Varför deploy 2 behövdes — och vad som nästan gick fel.** `TASK-338.4` (PR #2103) levererade `supabase/functions/update-attachment-scope/` men rörde aldrig `.prod-functions-allowlist.conf`. `deploy-prod-functions.sh` deployar ENDAST allowlistade funktioner; en katalog utan rad listas som `[EXKLUDERAD]` och **släpps igenom utan att fälla** (till skillnad från en allowlistad funktion utan katalog, som ger exit 1). Deployen hade alltså kört sina ~10 minuter och lämnat funktionen odeployad, varpå `TASK-338.7` punkt 7 ("Ändra räckvidd") hade varit död i prod utan att någon grind sagt ifrån.

Fångat FÖRE deployen med `bash scripts/deploy-prod-functions.sh --list`, som visade `[EXKLUDERAD]  update-attachment-scope`. Rättat i PR #2117 (som i sin tur fick tre granskningsrundor: risk `hog` → `medel` → `lag`, och fällde ett falskt påstående i orkestrerarens egen kommentar om att grenen var "TYST" — den är icke-fällande, inte tyst).

**Regeln som föll ut och nu bor i allowlistens eget kommentarsblock:** kör `--list` före varje prod-deploy som följer på en PR med en NY Edge Function.

**AC-status:** #1 ✅ (fält-ID:n i `data-model.md`, GO citerat) · #2 ✅ (alla fyra EF:er deployade, `UPDATED_AT` bokförda ovan) · #3 **öppen** — de två första leden är verifierade (`0` kvar med legacy, `Gemensam` = 2), men det tredje ("de två dokument Marcus laddade upp finns kvar och är läsbara i räckviddsläget") kräver hans blick i appen och bockas i `TASK-338.7`s testrunda, punkt 7.
<!-- SECTION:NOTES:END -->
