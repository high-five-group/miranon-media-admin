---
id: TASK-114
title: >-
  Fynd: skyddslistan protectedRecordIds saknar de permanenta event-fixturerna —
  Event-681 och Event-845 kan raderas vid markör-träff
status: To Do
assignee: []
created_date: '2026-08-01 12:04'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 186000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Bokfört läge, verifierat mot koden 2026-08-01

`scripts/seed-review-fixture.mjs:169` bär exakt två record-ID:n, båda personer:
`rec7F8jYc7rczwwkM` (ZZ-Arbetsko Person 01) och `recqxaFNwHAdQlAqb` (ZZ-History Person 01).
De permanenta event-fixturerna står INTE i listan — trots att de per etablerad regel aldrig får röras
([`tests/api/fixtures.ts`](../tests/api/fixtures.ts): *"STÄDA INTE"* på båda;
[`docs/reference/staging-verifiering-runbook.md`](../docs/reference/staging-verifiering-runbook.md) § Granskningsfixtur skyddsräcke 2).

## ID-uppslagen — varifrån varje ID kommer

Namnen `Event-681`/`Event-845` förekommer **ingenstans i repo-koden** — de är eventens `EventKey`-fältvärden i staging. Kedjan, mätt:

- **ZZ-belaggning-fixtur** = `recIFrxHZw165ycXk`. Källa i repot: `tests/api/fixtures.ts` `BELAGGNING_EVENT_ID` (task-18.2). Staging-verifikat (read-only `get_record`, 2026-08-01): `EventKey: "Event-681"`, `Event-nr: 681`, Notering *"PERMANENT test-fixtur … STÄDA INTE"*.
- **ZZ-arbetsko-fixtur** = `recZyRIzbqWSifAQO`. Källa i repot: `tests/api/fixtures.ts` `ARBETSKO_EVENT_ID` (task-18.4). Staging-verifikat (read-only `get_record`, 2026-08-01): `EventKey: "Event-845"`, `Event-nr: 845`, Notering *"PERMANENT test-fixtur … STÄDA INTE"*.

Ingen annan permanent event-fixtur finns: fullständig inventering av hårdkodade `rec…`-ID:n i `tests/` + `scripts/*.mjs` gav utöver dessa endast personerna, anteckningsfixturen (`recLcii847ZK7K6OY`, skyddad via ankare-mekanik och purge-immunitet per konstruktion), eventformat-raden (annan tabell, aldrig i raderingsväg) och legacy-granskningsposternas ankare.

## Varför luckan är verklig men latent

Guard-läsvägen är tabell-agnostisk: `planClean`, `planSweep` och `planLegacyClean` prövar
`protectedRecordIds.includes(rec.id)` FÖRST för event, anmälningar och personer. Att lägga eventen
i listan ger dem alltså fullt skydd utan ny mekanik. I dag skyddas de enbart av att deras markörer
inte matchar (Ort `ZZ-belaggning-fixtur`/`ZZ-arbetsko-fixtur` skild från fixtur-/purge-mönstren, Notering utan
`[SEED-REVIEW-FIXTUR]`-sentinel). Det är exakt den egenskap skyddslistan finns för att INTE lita på:
skyddsräcke 3 lovar *"kan aldrig raderas — inte ens om de mot förmodan matchar en markör"* — och det
löftet omfattar i dag bara personerna, medan eventen bär lika exakta assertions
(`BELAGGNING_EXPECTED`/`ARBETSKO_EXPECTED`) i samma testsvit.

## Kontention — verifieringsform

En systeragent kör `test:api` mot staging under exekveringsfönstret. Verifiering sker därför HELT utan
purge-/seed-körning: enhetstestsviten `scripts/test-seed-review-fixture.mjs` (pura plan-funktioner, noll
nätverk; CI-wirad `ci.yml:896`) + två enstaka read-only-uppslag (listan ovan). Ingen staging-write.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Båda eventens record-ID:n (recIFrxHZw165ycXk, recZyRIzbqWSifAQO) står i protectedRecordIds; personernas två ID:n kvar och listans ordning bevarad (testsviten adresserar index 0)
- [ ] #2 Tvåsidigt bevis i scripts/test-seed-review-fixture.mjs: (röd sida) assertions på event-ID:na fäller mot före-läget, mätt före fixen; (grön sida) beteendetest visar att planClean skyddar ett protected event ÄVEN när det matchar fixtur-markörerna
- [ ] #3 Kommentarerna som beskriver listan (CONFIG-docblocken + skyddsräcke 3 i skriptets huvud) uppdaterade så eventen ingår — ingen läsare ska kunna tro att listan är person-exklusiv
- [ ] #4 Runbokens § skyddsräcke 2 (De permanenta fixturerna rörs aldrig) uppdaterad med eventens ID:n
- [ ] #5 Verifiering utan staging-write: testsviten + biome + check:docs gröna lokalt med mätta exitkoder; ingen purge-/seed-körning utförd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
