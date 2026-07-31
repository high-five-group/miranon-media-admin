---
id: TASK-101
title: >-
  Fynd: legacy-registret har ingen avslutning för en städad post — två poster
  beskriver ett tillstånd basen inte har
status: To Do
assignee: []
created_date: '2026-07-31 07:56'
updated_date: '2026-07-31 08:11'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 181000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
CONFIG.legacy i `scripts/seed-review-fixture.mjs` är ett **slutet register** över handbyggda granskningsfixturer, var och en med en mätt `forvantat`-räkning som fungerar som guard före radering. `TASK-95` byggde det. Registret har **ingen avslutning för en post vars fixtur faktiskt städats.**

Klassen är repots egen återkommande: *ett värde som ser verifierat ut men inte är det.* En läsare av registret drar slutsatsen att två fixturer ligger kvar i staging. De gör inte det.

### Instans 1 — ZZ-GRANSKNING-S91

Städad 2026-07-31 av `TASK-95` (PR #493): 33 poster, 0 kvar, oberoende bekräftat mot basen. Dry-run i dag mot staging `apphjj8Q7lkXCMsL4`, exit 1:

    ▸ Träffar: 0 event, 0 anmälningar, 0 personer
    ❌ Guard: räkningen avviker från registrets mätning för "ZZ-GRANSKNING-S91" — event: förväntade 1, fann 0; anmalningar: förväntade 16, fann 0; personer: förväntade 16, fann 0. Basen har ändrats sedan posten mättes. INGET raderades.

### Instans 2 — Skovde-S75

`TASK-95` AC #5 lämnade raderingen öppen med skäl (Marcus godkännande löd ordagrant *"Angående task-88"*, alltså endast S91). Marcus gav därefter uttryckligt mandat, och orkestreraren körde `--legacy Skovde-S75 --bekrafta` 2026-07-31: `6/6 anmälningar · 3/3 personer · 1/1 event raderade`, efter-verifiering `0 radera-bara rader kvar (10 raderade)`. Posten är därmed i samma stale tillstånd.

### Varför guardens egen instruktion är fel väg här

Guarden gör **exakt rätt** — den skyddar mot att basen ändrats under fötterna, och den fällningen ska stå kvar. Men felmeddelandet instruerar *"mät om, uppdatera forvantat"*, vilket för en redan städad post betyder "sätt räkningen till noll". En post med `forvantat: {0,0,0}` är ingen avslutning: den ser aktiv ut men kan aldrig göra något, och den kastar dessutom den mätta räkningen som är historik.

### Kravet formen måste uppfylla

En läsare ska kunna se skillnad på *"fixturen ligger kvar"* och *"fixturen är städad"* **utan att köra skriptet**, och en avslutad post får aldrig tyst se ut som en aktiv. `kalla`-fältets proveniens (vem byggde fixturen, när, vem mätte den) får inte kastas när posten avslutas.

Källa: mätt skarpt 2026-07-31, reproducerat två gånger.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Formen för avslutning vald och motiverad; de förkastade alternativen bär sina skäl
- [x] #2 Båda städade posterna markerade som avslutade med datum + landnings-referens, och kalla-proveniensen bevarad ordagrant
- [x] #3 En läsare ser skillnad på "ligger kvar" och "städad" utan att köra skriptet — och en avslutad post kan aldrig tyst se ut som aktiv
- [x] #4 Tvåsidigt bevis: en avslutad post kan INTE radera något, och en aktiv post med avvikande räkning fälls fortfarande av räknings-guarden
- [x] #5 validateConfig håller forvantat-kravet sant för samtliga poster (räkningen är guarden, inte en anteckning) — eller ändringen är medveten och motiverad
- [x] #6 Skyddsräcke 2 intakt: .purge-staging-policy.json orörd, verifierat mekaniskt
- [x] #7 Egen basmätning av båda legacy-posterna redovisad med exitkod; dry-run är default och förblir det
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VALD FORM: `stadad: { datum, av }` på posten som står KVAR i CONFIG.legacy.

En avslutad post behåller `namn`, `ort`, `eventRecordId`, `emailSokPrefix`, `emailPattern`, `forvantat` och `kalla` oförändrade, och får ett fält som säger att fixturen är städad, när, och var beslutet/utförandet är bokfört. Två mekaniska följder:

1. `planLegacyClean` ger en TOM raderingsplan för en `stadad` post — per konstruktion, oavsett indata. Spärren sitter i plan-funktionen och inte i korLegacy med flit: varje väg till en legacy-radering går genom den, så en framtida anropare kan inte råka kringgå avslutningen. (Skyddsräcke 7 i skriptets header.)
2. `korLegacy` returnerar FÖRE räknings-guarden och skriver ut tillståndet först av allt. För en städad fixtur är noll träffar det VÄNTADE utfallet; att låta guarden fälla där hade beskrivit ett normaltillstånd som ett fel — precis det missvisande meddelande kortet finns för att avskaffa.

VARFÖR `forvantat` INTE NOLLSTÄLLS: guardens egen instruktion ("mät om, uppdatera forvantat") ger för en städad post `{0,0,0}`. Det är ingen avslutning — det är en post som ser aktiv ut men aldrig kan göra något, och som dessutom kastat den mätta räkningen. På en avslutad post är räkningen HISTORIK (vad som fanns när den mättes). validateConfig kräver den därför fortfarande av samtliga poster; kravet står oförändrat.

FÖRKASTADE FORMER, med skäl

(b) FLYTTA POSTEN TILL EN EGEN `CONFIG.legacyStadade`. Läsbarheten hade varit maximal, men `--legacy <namn>` slår upp i `config.legacy`: en flyttad post hade svarat "finns inte i registret" — missvisande, för den fanns; den är städad. En andra lista med samma postform kan dessutom drifta (en post i fel lista fäller ingenting), och `kalla`-proveniensen hade lämnat den validering som håller den läsbar. Bevisat kvar-hittbar av testet "en avslutad post GÖMS inte — --legacy hittar den fortfarande".

(c) ENBART ETT TYDLIGARE FELMEDDELANDE I GUARDEN. Löser inte kravet: guarden talar bara när skriptet KÖRS, och kravet är att skillnaden syns utan det. Den kan dessutom inte SKILJA fallen utan ett tillståndsfält — noll träffar mot `forvantat: {1,16,16}` är formmässigt identiskt med "basen har ändrats oväntat". Klartexten i guarden är alltså en FÖLJD av det valda fältet, inte ett alternativ till det, och den ingår i leveransen.

HISTORIKEN BEVARAD: `kalla`-texten på båda posterna står ordagrant kvar (vem byggde fixturen, när, vem mätte den, Marcus godkännande) och har fått städningens utfall TILLAGT, inte ersättande. Ett eget test låser det ordagrant, så en framtida omskrivning som tappar proveniensen fäller sviten.

EGEN BASMÄTNING — staging apphjj8Q7lkXCMsL4, PREFLIGHT OK i varje körning

FÖRE ändringen (fyndet reproducerat):
  --legacy ZZ-GRANSKNING-S91   exit 1   Träffar 0/0/0, guarden fäller "förväntade 1/16/16, fann 0/0/0"
  --legacy Skovde-S75          exit 1   Träffar 0/0/0, guarden fäller "förväntade 1/6/3, fann 0/0/0"

EFTER ändringen:
  --legacy ZZ-GRANSKNING-S91              exit 0   "AVSLUTAD — fixturen städades 2026-07-31 (TASK-95 (PR #493))"
  --legacy Skovde-S75                     exit 0   "AVSLUTAD — fixturen städades 2026-07-31 (TASK-101 …)"
  --legacy ZZ-GRANSKNING-S91 --bekrafta   exit 0   "AVSLUTAD post, raderar aldrig" — noll raderings-rader i loggen

Oberoende av skriptet, Airtable-MCP: Eventplanering {Ort} i (ZZ-GRANSKNING-S91, Skövde) → 0 records; Anmälningar med båda grovfiltren → 0 records.

TVÅSIDIGT BEVIS (AC #4)

Sviten: 115 gröna, 0 röda, exit 0 (baseline 96 från TASK-95, alltså +19).
Den gröna sidan är inte kosmetik: bägge registerposterna är nu avslutade, och en avslutad post ger tom plan. Ankar-testerna hade därför blivit gröna av FEL SKÄL — tom plan pga avslutningen, inte pga record-ID-ankaret. Fem befintliga tester kördes därför om mot en `somAktiv(post)`-form som strippar avslutningen, så de fortfarande prövar det de påstår.

MUTATIONSRUNDA (engångs, ej committad): 9 mutationer som river varsin bärande guard. 9/9 fäller sviten.
  M1 planLegacyClean-spärren riven                     FÄLLER (3 röda)
  M2 S91:s stadad-fält borttaget                       FÄLLER
  M3 stadad.datum-valideringen no-op                   FÄLLER
  M4 stadad.av-valideringen no-op                      FÄLLER
  M5 forvantat-kravet i validateConfig rivet           FÄLLER (2 röda)
  M6 legacyRegisterOversikt slutar märka tillstånd     FÄLLER
  M7 arIsoDatum utan kalender-prövning                 FÄLLER
  M8 stadad-objektformen ovaliderad                    FÄLLER
  M9 somAktiv strippar inte avslutningen               FÄLLER (8 röda)

M1, M5 och M9 kontrollerades riktat: sviten fäller via ÄKTA assertion-fel (❌-rader med diff), inte via syntax-/importfel — 112/113/107 tester körde grönt i samma körningar, så modulen laddades. M9 är beviset för att `somAktiv`-omskrivningen var nödvändig och inte kosmetisk: utan den blir 8 tester röda, däribland de två ankar-testerna som annars tyst hade bevisat något helt annat än de påstår.

AC #6 — SKYDDSRÄCKE 2: `.purge-staging-policy.json` är ORÖRD i diffen (verifierat med git diff --name-only). De tre befintliga AC #4-testerna läser den skarpa filen direkt och är gröna: 0 purge-kollisioner för både skript-markörer och båda legacy-posternas markörer, ingen target åberopar ZZ-GRANSKNING, ingen target läser fältet Notering.

GRINDAR, mätta med CI:s kommandon (exitkod fångad separat, aldrig efter en pipe)
  node scripts/test-seed-review-fixture.mjs   exit 0   115 gröna / 0 röda
  npx @biomejs/biome check .                  exit 0
  npm run typecheck                           exit 0
  npm run build                               exit 0
  npm run test:api                            exit 0   419 passed (47.7s)
  npm run check:docs                          exit 0   10 gröna

DRY-RUN FÖRBLIR DEFAULT (AC #7): `parseArgs` är orörd i det avseendet, och testerna "legacy-läget är DRY RUN tills --bekrafta ges" samt "--dry-run vinner ALLTID över --bekrafta" är gröna.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
