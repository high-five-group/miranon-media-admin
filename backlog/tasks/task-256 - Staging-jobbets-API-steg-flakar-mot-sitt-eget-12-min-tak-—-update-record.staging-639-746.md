---
id: TASK-256
title: >-
  Staging-jobbets API-steg flakar mot sitt eget 12-min-tak —
  update-record.staging 639/746
status: To Do
assignee: []
created_date: '2026-08-17 07:41'
updated_date: '2026-08-24 13:08'
labels:
  - ready-for-agent
dependencies: []
ordinal: 474000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fynd ur TASK-239:s rotorsaksarbete (2026-08-17). Ärende #1476 var SAMMANSATT och bokfördes så i sin triage-kommentar: (1) e2e-baslinjen uppblåst av b-gruppens nio fällningar — LANDAD via TASK-243.3 (commit 97ea127c, PR #1470), väggklockan tillbaka till 6,63-8,41 min; (2) API-steget tog 3,0 min i stallet for ~1,6 pga två flaky-retries i tests/api/update-record.staging.test.ts:639 och :746 (loggen: '2 flaky', 309 passed, run 31984652487). Ben (2) SAKNAR bärare — detta kort är den.\n\nAVGRÄNSNING mot TASK-239 (prövad, ej antagen): 239 äger Acceptance-jobbets tak i ci-suite.yml. Detta ben ligger i jobbet 'Staging (API + E2E)' — annat jobb, annan timeout-instans, annan testklass (riktiga staging-anrop mot Airtable, inte MSW-fixturvärlden) och annan mekanism (retry-flake i två API-tester, inte warmup-gatens väntan). Hör INTE till 239:s klass; därför eget kort i stället för en post på 239.\n\nFÄRSK MÄTNING (TASK-239-agentens lokala 'npm run test:api' 2026-08-17, 862 passed, 2.2m): båda testerna GRÖNA men långsamma — :639 tog 5,5 s och :746 tog 5,9 s, klart över sviten i övrigt. Båda är 'allow'-vägar som SKRIVER mot staging och restaurerar i teardown (set-registration-lodging respektive set-attendance-status Närvarande ⇄ Ej avstämt). Skriv-plus-restaurera mot delad bas är den troliga flake-ytan — hypotes, ej belagd; mät innan åtgärd.\n\nStängs INTE av att #1476 stängs på annan grund — #1476 lämnades öppen just för att detta ben saknade bärare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Flaken reproducerad och kvantifierad med npm run metrics:flake (interfolierad A/B, --retries=0) — inte bedömd på en enstaka körning; läs ut n innan ett noll-resultat tolkas
- [x] #2 Rotorsaken namngiven: är det skriv-plus-restaurera mot delad staging-bas, en väntan som saknas, eller maskinlast — belagd, ej antagen
- [x] #3 Åtgärd landad som återför API-steget till ~1,6 min, ELLER öppet motiverat varför steget legitimt tar 3,0 min
- [ ] #4 Staging-jobbets marginal mot timeout-minutes: 12 mätt i post-merge efter åtgärd (run-ID som belägg)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MÄTNING (2026-08-17, agent på TASK-256). Alla tal nedan bär sin källa.

── CI-POPULATIONEN (n=63 staging-jobb, post-merge.yml + nightly.yml, 2026-07-23→2026-08-17)
Metod: `gh api repos/.../actions/jobs/<id>/logs` per jobb, API-steget avgränsat mellan
grupp-markörerna `Run npm run test:api:staging` och `Run npm run test:e2e:staging` (en
första parsning som saknade den avgränsningen blandade in E2E-stegets flaky-rader — rättad).

- API-steget hade `flaky` i 3 av 63 körningar. Endast EN av dem är detta korts tester
  (run 31984652487). De två andra är HELT ANDRA tester utan bärare:
  attachment-upload-large.staging.test.ts:101 (nightly 31560003797) och
  get-person.staging.test.ts:130 (nightly 31236116308). → egen triage, se nedan.
- API-steget hade `failed` i 0 av 63.
- Rat för DETTA korts två tester: 1/63 körningar ≈ 1,6 %.

── DIVERGENS MOT KORTETS "~1,6 min" (prövad, ej antagen)
API-stegets väggklocka, hela fönstret n=63: min 57 s · median 96 s (1,60 min) · max 184 s.
Men sviten VÄXTE i fönstret, 168 → 322 tester. Delat på era:
- svit ≥ 300 tester (dagens era, n=25): min 90 s · median 107 s (1,78 min) ·
  medel 118 s (1,97 min) · max 184 s (3,07 min).
Kortets "~1,6 min" är alltså medianen över HELA fönstret, för en svit som var ungefär
hälften så stor. Mot dagens era är 1,6 min GOLVET, inte normalvärdet. 3,0-min-utfallet
ligger 77 s över dagens median — men den näst högsta körningen (160 s) hade INGEN flake
alls, och spridningen bland icke-flakiga körningar i dagens era är 90–160 s (70 s brett).

── VAD FLAKEN FAKTISKT KOSTADE
Lokalt mätt (`npx playwright test --project=api-staging --retries=0`, denna worktree,
2026-08-17): :639 = 5,6 s, :746 = 5,9 s (kortets 5,5/5,9 bekräftat). En flaky-cykel =
ett fällt försök + en omkörning + en worker-omstart per test. Två flakes ≈ 13–17 s av de
77 s. Resten ligger inom den ordinarie spridningen. → API-stegets 3,0 min är INTE
huvudsakligen flakens; den är en normal toppnotering plus ett flake-påslag.

── ROTORSAK (AC #2) — belagd ur fällningens EGNA värden
Loggen från run 31984652487 (verbatim): båda testerna fick FÖRE-värdet tillbaka efter en
skrivning som redan kvitterats 200.
  :639 rad 675 — `Bor över` skrivet till false → 200; läs-tillbaka gav `true` (Expected
  false, Received true).
  :746 rad 775 — `Status` skrivet till 'Närvarande' → 200; läs-tillbaka gav `Ej avstämt`
  (Expected "Närvarande", Received "Ej avstämt").
Skrivningen går PATCH mot Airtables record-endpoint (update-record →
`updateAirtableRecord`); läsningen går LIST-endpointen med filterByFormula
(get-registrations event-lösa gren = paginerad full-walk; get-attendance =
`OR(RECORD_ID()=…)`). Två olika vägar in i samma bas, utan garanterad
läs-efter-skriv-konsistens.
Av kortets tre kandidater är svaret **"en väntan som saknas"**:
- "skriv-plus-restaurera mot delad bas" i KOLLISIONS-mening är UTESLUTEN: grep över
  tests/ visar att `CHECKIN_DELTAGANDE_A_ID` bara skrivs av update-record.staging.test.ts,
  och `Bor över` likaså. Ingen konkurrerande skrivare finns.
- Cache i vår egen läsväg är UTESLUTEN: grep över supabase/functions/{get-registrations,
  get-attendance,update-record,_shared} ger noll cache-mekanism.
- "maskinlast" kvarstår som möjlig BIDRAGANDE faktor (den flakiga körningen var även
  API-stegets långsammaste) men är inte mekanismen — mekanismen är att assertionen läser
  EN gång, utan bunden väntan.

── VAD SOM INTE GICK ATT BELÄGGA (n utläst, per CLAUDE.md)
- Mekanism-sond mot staging (skriv → poll:a läsvägen tills den speglar, båda fixturerna
  parallellt, semafor+preflight tagen): **180 skriv→läs-cykler, NOLL inaktuella
  förstaläsningar.** Läsanropet självt kostade p50 ~0,9–1,0 s, p95 ~1,1 s, en utstickare
  7,85 s.
- `npm run metrics:flake --projekt api-staging --varv 6 --workers 2 --grep 'allow:
  set-(registration-lodging|attendance-status)'`: **0 fällda av 36 testresultat i 12
  körningar** (24 exekveringar av de två måltesterna). Avvikelse från riggens default:
  `--cooldown 5` i stället för 45, för att hålla staging-låsfönstret kort — noteras öppet.
- Vid CI-raten 1,6 % är 24 exekveringar förenligt med noll fällningar (väntevärde ≈ 0,4).
  Luckans MAGNITUD är därför omätt. AC #1 lämnas OBOCKAD: "kvantifierad" är uppfyllt,
  "reproducerad" är det inte.

── ÅTGÄRD
tests/api/update-record.staging.test.ts: alla nio läs-tillbaka-assertioner efter en
skrivning går genom en ny delad hjälpare `forvantaLastVarde` som `expect.poll`:ar mot en
bunden budget (8 s, intervall [250,500,1000,2000]).
SCOPE-UTVIDGNING, flaggad: kortet pekar ut :639 och :746, men samma defektklass fanns i
sju ytterligare assertioner i SAMMA fil (:136 :215 :307 :473 :516-518 :558-560, gamla
radnummer). Att laga två av nio identiska tidsinställda bomber vore symptomfix; hela
klassen i den ENA filen är lagad i stället. Ingen annan fil rörd. Puttas gärna tillbaka.
Budgeten är vald mot mätningen: 8 s rymmer ~5–6 läsförsök vid uppmätt läshastighet och
håller ett test med TVÅ läs-tillbaka under Playwrights 30-sekunderstak (bevisat: 12,4 s
vid en exhausterad poll).

── TVÅSIDIGT BEVIS
POSITIVT: hela filen grön, 19 passed (45,0 s) och efter återställning 19 passed (43,1 s);
`npm run test:api` 874 passed (1,2 m), exit 0. Körtiderna för de två målen oförändrade
(5,3–5,8 s / 5,4–6,3 s mot 5,6 / 5,9 s före) → noll kostnad i lyckat fall.
NEGATIVT 1 (pollen FÄLLER): förväntat värde temporärt bytt till ett som aldrig skrivs →
exit 1 efter exakt 8000 ms, med meddelandet "läs-tillbaka av … speglade aldrig
skrivningen inom 8000 ms" och sista lästa värde i utskriften. Testet tog 12,4 s, väl
under 30 s-taket.
NEGATIVT 2 (fail-fast bevarad INUTI pollen): läs-EF:en temporärt riggad att svara 404
först på ANDRA anropet, så undantaget uppstår inne i pollen → exit 1 efter 4,0 s med
stacken `readAttendanceStatus → forvantaLastVarde`. Alltså INGEN omprövning av
infrastrukturfel — matchar Playwrights egen implementation (`await actual()` ligger
utanför try-blocket i packages/playwright/src/matchers/expect.ts) och dess regressionstest
"should not retry predicate that threw an error". Båda temporära ändringarna återställda
och verifierade borta (`grep ZZ-TASK-256|__zzKall` → 0 träffar).

── TRIAGE, REGISTRERAT EJ ÅTGÄRDAT (ADR-053: blockerar ej + värdefullt)
1. PRODUKTYTAN, inte bara testet: om läsvägen kan servera ett inaktuellt värde direkt
   efter en skrivning gäller det även appen. Check-in-vyn skriver Status och läser om.
   Värt en tråd — utanför detta korts skiva.
2. docs/reference/airtable-constraints.md saknar post för läs-efter-skriv-luckan på
   LIST-endpointen (D-sektionen har P14/P15 om formel-/lookup-fördröjning, inget om
   detta). Kandidat till ny P-post — men magnituden är omätt, så posten bör inte skrivas
   förrän någon mätt luckan.
3. De två OBÄRDA API-stegs-flakesen ovan (attachment-upload-large:101,
   get-person:130).
4. AC #4 kan inte bockas av bygg-agenten: den kräver en post-merge-körning EFTER
   landning. Baslinjen att jämföra mot är mätt och står ovan (API-steget median 107 s,
   E2E-steget median 328 s i dagens era; jobbets tak är 720 s, så API-steget står för
   ~15 % av budgeten och även 3,07-min-utfallet för bara ~26 %). #1476:s avbrott drevs
   av E2E-steget, inte av API-steget: i run 31984652487 hann E2E 514 s utan att bli
   klart medan API-steget kostade 184 s.

── OVÄNTAT FYND, REGISTRERAT EJ ÅTGÄRDAT (ADR-053: blockerar ej + värdefullt)
En REN LÄSNING av de rörda fixturerna efter att alla grindar gått gröna (ingen
skrivning, via get-registrations/get-attendance) gav:

  borOver=false · checkinStatus="Ej avstämt"      ← korrekt utgångsläge
  slutbetalning="Mottagen"
  noteringAnmalningsavgift="ZZ-18.8-avgift-notering"
  noteringSlutbetalning="ZZ-18.8-slut-notering"
  paminnelseAnmalningsavgiftSkickad="2026-07-22T10:00:00.000Z"

De fyra sista är EXAKT de värden betalnings-testerna skriver: sentinel-strängarna
`AVGIFT_SENTINEL`/`SLUT_SENTINEL` och `STAMP`-konstanten. Seed-ankaret bär alltså
sannolikt kvarlämnade testvärden från en körning som avbröts före sitt `finally`.

VARFÖR DET INTE ÄR DENNA AGENTS: mönstret mutera→assertera→restaurera är
tillståndsbevarande — en körning som SLUTFÖRS lämnar exakt vad den fann. De tre
betalnings-allow-testerna kördes i denna session ENDAST inuti körningar som gick
igenom helt (19 passed ×2, `npm run test:api` 874 passed); de grep-avgränsade
körningarna och mekanism-sonden rörde bara `Bor över` och check-in-statusen.
Tillståndet ovan förelåg alltså före sessionens första fil-körning.

VARFÖR DET SPELAR ROLL: när `original` REDAN är sentinelvärdet blir läs-tillbaka-
assertionen TAUTOLOGISK — testet skriver ett värde som redan låg där, läser det,
och "bevisar" ingenting. Det gäller tre assertioner (mark-final-payment-paid,
update-registration-payment-note, log-payment-reminder). Denna PR gör det varken
bättre eller sämre: pollen träffar på första proben, precis som den gamla
enskotts-läsningen gjorde.

INGET ÄR ÄNDRAT I BASEN. Att skriva om delad staging-fixturdata är ett beslut om
en förstklassig leverabel (CLAUDE.md § Airtable-basen som leverabel) och fattas
inte av bygg-agenten på eget bevåg. Behöver eget kort: fastställ om värdena är
legitima seed-värden eller kvarlämningar, och om testerna bör kräva ett
utgångsläge SKILT från det de skriver (annars kan assertionen aldrig fälla).

S112 bokföringspass (2026-08-24): re-verifierat läge (ADR-086-passet visade kortet In Progress utan levande ägare-session). AC#2/#3 GENOMFÖRDA och landade: PR #1518 (fix/task-256-las-tillbaka-bunden-vantan) MERGED 2026-08-17T10:05:24Z, CI SUCCESS. AC#1 (flake reproducerad+kvantifierad via metrics:flake) förblir explicit OUPPFYLLD per kortets egna notes: mekanism-sonden (180 skriv-läs-cykler) och metrics:flake-körningen (0/36 fällda) kunde INTE reproducera flaken — 'AC #1 lämnas OBOCKAD: kvantifierad är uppfyllt, reproducerad är det inte'. AC#4 (post-merge-marginal mätt efter åtgärd) krävde en mätning EFTER landning som ingen bygg-agent kunde göra då. Färsk datapunkt denna session (nightly run 32682955266, 2026-08-24, steget 'API tests (staging)'): 340 s — högre än kortets egen 'dagens era'-baseline (median 107 s, max 184 s, mätt t.o.m. 2026-08-17). Detta KAN vara normal svit-tillväxt (fler tester tillkomna S104-S111) snarare än ett nytt flake-problem, men är INTE mätt isär här — flaggas som öppen fråga för nästa som plockar kortet, inte avgjord. Status flyttad In Progress → To Do: ingen levande session äger arbetet, och de återstående AC-punkterna kräver en ny mät-/reproduktionsinsats, inte en administrativ bockning.
<!-- SECTION:NOTES:END -->
