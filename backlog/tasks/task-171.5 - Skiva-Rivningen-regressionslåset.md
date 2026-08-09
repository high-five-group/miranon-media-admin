---
id: TASK-171.5
title: 'Skiva: Rivningen + regressionslåset'
status: To Do
assignee: []
created_date: '2026-08-09 08:26'
updated_date: '2026-08-09 11:25'
labels:
  - ready-for-agent
dependencies:
  - TASK-171.4
modified_files:
  - src/components/events/atgarder/AtgardsSida.tsx
  - src/routes/_authenticated/atgarder.tsx
  - src/routes/_authenticated/event/$eventId/atgarder.tsx
  - tests/visual/atgardssida-promoverings-grind.spec.ts
  - backlog/tasks/task-171.5 - Skiva-Rivningen-regressionslåset.md
parent_task_id: TASK-171
ordinal: 320000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: variant-koden och railen för åtgärds-/granskningsytan rivs mekaniskt — det som rivs är villkor och växlar, aldrig formen (ADR-103 B2 steg 4; 145.6-mönstret). check-facit-invarianten vaktar: rivning kräver satt godkand-fält. Efter rivningen: stale-URL-bevis, ariaSnapshot-referenserna gröna mot den rivna ytan (regressionslås), och visual-baslinjen omtas via CI-artefakt. Täcker användarberättelser: 15.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Variant-koden/railen riven; formen orörd (diff visar endast villkor/växlar)
- [x] #2 check-facit grön med godkand satt; stale-URL-bevis bilagt
- [x] #3 ariaSnapshot-referenserna gröna mot rivna ytan utan omtagning
- [ ] #4 Visual-baslinjen omtagen via CI-artefakt EFTER rivningen
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PREMISS-PASS (ADR-086) FÖRE DESIGN: (1) task-171.4 Done + Marcus godkännande
stämplat verifierat live — `tasks/sessions/bilagor/s93-atgardssida-promovering/facit.json`
har `godkand.sha=cfc62f9f...` och `git merge-base --is-ancestor cfc62f9f origin/main`
bekräftar SHA:t på main (PR #1044, `cfc62f9f` är merge-commiten själv). (2) Alla
manifest i `tasks/sessions/bilagor/*/facit.json` kontrollerade (node-script):
BÅDA existerande manifest (s93-hallplats-prototyp, s93-atgardssida-promovering)
har `godkand` SATT — `check-facit.sh`s OGODKANDA-lista är därmed TOM, vilket
gör B3-spärren strukturellt overksam oavsett markörinnehåll (dokumenterat i
diffen ändå, precedent-troget). (3) 145.6-precedentet (commit `bf8f14fc`, PR
#1026) läst i sin helhet före design — dess docblock-omskrivningsmönster
([RIVEN, TASK-X, ADR-103 B2 steg 4]-tagg) återanvänt ordagrant här. Inga
divergenser mot uppdraget hittades i premiss-passet.

AC #1 (variant-koden/railen riven, formen orörd): `PrototypeSwitcher`-import +
montering + `PROTO_VARIANTS`-konstant rivna ur BÅDA routerna
(`routes/_authenticated/atgarder.tsx`, `routes/_authenticated/event/$eventId/atgarder.tsx`).
De tre [PROTOTYPE][S100]-docblock-titlarna (FACIT_PROTO_MARKORER-strängarna
från 171.2) omskrivna till PRODUKTIONSKOD-status med [RIVEN, TASK-171.5,
ADR-103 B2 steg 4]-noter, samma taggform som 145.6. `git diff` bekräftar:
inga JSX-strukturändringar i formen självt — enda kod-diffen utöver
switcher-rivningen är DEV-gating av `PrototypRigg` (se nästa stycke) och
förenklade `return`-satser i routerna (fragment `<>...</>` blev onödigt när
switcher-JSX:en försvann).

PRÖVNINGEN AV PrototypRigg (uppdragets explicita instruktion): läste
`tests/visual/atgardssida-promoverings-grind.spec.ts`s `valjArmeraSkicka`-
funktion (rad 95-104) — den klickar `page.getByRole('button', { name:
utfallsEtikett })` där `utfallsEtikett` är 'Allt gick fram'/'Delutfall'/
'Inget gick fram', vilket ÄR `PrototypRigg`s knapp-etiketter (komponentens
egen `val`-array). Riggen är alltså en HÅRD beroende för referens-specens tre
utfallslägen-tester. Beslut: STÅR KVAR, DEV-grindad (`import.meta.env.DEV`)
vid båda sina monteringspunkter (rad ~2137 resultatläget, rad ~2354
granskningsläget) — den var TIDIGARE ovillkorlig (ogated) i båda lägena,
grep-verifierat före ändring. Byggbevis: `grep -rl "Prototyp-rigg" dist/`
(riggens unika UI-text) gav EXIT=1 (noll träffar) efter `npm run build` —
konst-foldad ur produktionsbygget, samma bevisform som 171.3s
PrototypeSwitcher-bevis.

AC #2 (check-facit grön med godkand satt; stale-URL-bevis): `bash
scripts/check-facit.sh` → "✅ Facit-manifest OK: 2 manifest, 8 ytor
deklarerade, 0 ogodkända (prototyp-substratet skyddat)." exit=0, KÖRT BÅDE
FÖRE och EFTER rivningen (identiskt resultat, eftersom OGODKANDA redan var
tom). STALE-URL-BEVISET: eftersom ingen kod i denna yta NÅGONSIN läst
`variantParam`/`dataMode` (171.1/171.2:s grep-fynd, upprepat här) finns ingen
gren att degradera FRÅN — beviset blir i stället att en stale `?variant=
a&data=verklig`-URL (railens URL-kontrakt, ADR-074 beslut 1) är en NO-OP.
Två NYA Playwright-tester tillagda i referens-specen (rad ~161-198, EFTER de
sex befintliga — de sex är ORÖRDA, se AC #3) som navigerar med
`?variant=a&data=verklig` mot båda routerna och återanvänder de OFÖRÄNDRADE
referensfilerna (`atgardssida-tomt.aria.yml`, `atgarder-mottagarurval.aria.yml`).
BEVIS I BÅDA RIKTNINGAR (repo-disciplinen, inte bara grönt): muterade
temporärt ETT av de nya testerna att peka på FEL referensfil
(`atgarder-mottagarurval.aria.yml` i stället för `atgardssida-tomt.aria.yml`)
— körning gav RÖTT (exit=1, "Expect toMatchAriaSnapshot" fällde med diff-utdata
som visade den förväntade eventväljar-strukturen mot den faktiska tomma-läget-
strukturen). Reverterad (`cp` från backup), omkörning: GRÖNT igen, 40/40.
Mekanismen fäller alltså genuint, inte bara trivialt grön.

AC #3 (referenserna gröna UTAN omtagning): de SEX ursprungliga
ariaSnapshot-testerna (rad 106-159) rörda med NOLL rader ändring — grep-
diffen bekräftar att endast nya tester TILLKOM efter rad 159, inget i den
befintliga test.describe-blocket muterades. Körning:
`PLAYWRIGHT_VISUAL_DEV_SERVER=1 npx playwright test --project=visual-desktop
--project=visual-mobile tests/visual/atgardssida-promoverings-grind.spec.ts`
→ 40/40 passed (12 referens-tester × 2 projekt + 4 stale-URL-tester × 2 + 16
axe-pass (171.3-härdningen) × 2 + 6 kvalitetsribbans-tester × 2 = 40),
KÖRT TVÅ GÅNGER (en gång under utveckling, en gång EFTER röd/grön-
revert-beviset ovan) — identiskt 40/40 båda gångerna.

AC #4 (visual-baslinjen omtagen via CI-artefakt): UTANFÖR DENNA AGENTS
MANDAT per uppdraget — kräver CI-artefakt EFTER merge. Lämnad OBOCKAD
explicit, ingen parkering på väntan.

FACIT_PROTO_MARKORER-HANTERINGEN (145.6-precedentet jämfört): 145.6 lämnade
`.facit-policy.conf` ORÖRD (append-only historik — de gamla markörerna
`isHallplatsVariant`/`protoAktiv` finns kvar i configen och matchar numera
bara via [RIVEN]-docblock-kommentarer, inte levande kod). Samma mönster
följt här: `.facit-policy.conf` INTE rörd i denna skiva (de tre 171.2-
registrerade markörsträngarna försvann naturligt ur `src/` som en följd av
docblock-omskrivningen — verifierat med grep, exit 1/noll träffar för alla
tre exakta strängar utom en delsträngskollision i en ny mening — se nedan).
Detta är säkert eftersom OGODKANDA redan var tom (se premiss-passet); B3-
spärren hade INTE fällt även om alla tre strängar försvunnit helt.
DELSTRÄNGS-ANMÄRKNING: en av de nya docblock-meningarna i
`routes/_authenticated/atgarder.tsx` råkar innehålla frasen "Åtgärds-sidan
UTAN event — tomt läge" som delsträng av den nya, längre meningen — ofarligt
(grinden bryr sig inte längre), men bokfört för fullständighet.

DATAVÄGS-INVARIANTEN (DoD #5): grep över hela diffen för
`useDataSource|dataSource|protoDataMode|fetchRegistrations` gav NOLL träffar
i tillagd/ändrad kod — enda tillagda icke-kommentar-kod är DEV-gating-
wrappers, förenklade `return`-satser och de två nya testerna. Ingen
datakälla-gren vidrörd.

TEST-KONSUMENT-SVEPET (DoD #6): grep över hela `tests/` för `PROTO_VARIANTS
|AtgarderPage|AtgarderUtanEventPage|PrototypRigg` gav träffar ENDAST i
kommentarer i `atgardssida-promoverings-grind.spec.ts` (redan uppdaterad
konsument). grep för `AtgardsSida|/atgarder` över hela `tests/`: två filer
— `atgardssida-promoverings-grind.spec.ts` (genuin konsument, uppdaterad i
denna skiva) och `tests/e2e/event-bekraftelse.staging.test.ts` (samma FALSKA
POSITIV som 171.2 redan klassade — testar en orelaterad "atgarder-
platshallare"-disclosure på bekräftelsesidan, inte denna yta; oförändrad av
min diff, ingen ny anledning att ompröva klassningen).

GRINDAR (samtliga körda i förgrunden, exitkod läst separat från fil, ALDRIG
via pipe till tail/head):
  typecheck (tsr generate && tsc -b --noEmit): exit=0
  biome check .: exit=0, 6 warnings/27 infos (identiskt pre-existing-antal
    som 171.2s baslinje — inga nya varningar)
  build: exit=0
  test:api (PLAYWRIGHT_NO_WEB_SERVER=1, api-pure+api-staging): FÖRSTA
    körningen 464/465, EN transient timeout (`airtable-filter.staging.test.ts`
    "curly-break"-fuzz mot live Supabase edge function, "Request context
    disposed" efter 30s — nätverksflake, INGEN av mina rörda filer relaterar
    till get-persons/airtable-filter). Omkörning av HELA den filens 13 tester
    isolerat: 13/13 GRÖNT. Klassad som klass B-flake (lokal/nätverks-
    transient) per CLAUDE.md § Flakighet, inte en regression av min diff —
    ingen egen mätserie byggd (metrics:flake är riggen för det, inte
    motiverat för en enstaka observerad transient).
  Referens-specen (DoD-kommandot verbatim): 40/40 passed, två körningar.
  check-facit.sh: exit=0 (körd flera gånger, identiskt resultat)
  test-check-facit.sh: 27/27 passerade, exit=0
  scripts/ EJ rörda — shellcheck ej krävt av DoD-villkoret.

DIVERGENS MOT UPPDRAGET: ingen. Alla källmärkta premisser i uppdraget höll
vid prövning (task-171.4 Done + Marcus-stämpel på main, 145.6-precedentet
läst före design, PrototypRigg-beroendet mot specen genuint verifierat).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Datavägs-invarianten verifierad: inga datakälla-grenar flippade
- [x] #6 Test-konsument-svepets träffyta bilagd (grep-svep) och alla träffar uppdaterade i samma skiva som sin flip
<!-- DOD:END -->
