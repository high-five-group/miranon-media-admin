---
id: TASK-59.2
title: 'Skiva: Kontraktsvakten — nattlig fixtur-mot-verklighet'
status: To Do
assignee: []
created_date: '2026-07-27 20:40'
updated_date: '2026-07-27 21:53'
labels:
  - ready-for-agent
dependencies:
  - TASK-59.1
parent_task_id: TASK-59
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fixturvärldens svar jämförs mot skarp staging varje natt, och avvikelser larmar i den kedja som redan finns och redan bevakas.

BETEENDET ÄNDE-TILL-ÄNDE: natten kör vakten. Den anropar de skarpa Edge Functions vars svar fixturen påstår sig spegla, parsar båda genom samma schema, och jämför. Stämmer de händer ingenting synligt. Divergerar de skapas ett larm som namnger vilken endpoint som glidit och hur. Larmet BLOCKERAR ingen PR — det talar om att en fixtur inte längre säger sanningen.

VARFÖR DEN ÄR VILLKOR OCH INTE TILLÄGG: zod-schemana är halva kontraktet. De fångar att ett fält försvinner eller byter typ. De fångar INTE att fältet finns men betyder något annat, och de fångar inte att schemat självt glidit — schemat är vår bild av funktionen, inte dess deklaration, så ändras funktion och schema i samma commit uppstår ingen signal alls. Airtable-basen kommer dessutom att byggas om aktivt under maximerings-milstolpen, vilket är precis den period fixturer driftar tyst.

ATT VAKTEN BYGGS FÖRE FÖRSTA FLYTTADE FILEN ÄR AVSIKTLIGT och har en fördel utöver ADR-kravet: nästa skivas pilot blir vaktens första skarpa prov mot verkliga fixturer.

EN VAKT SOM ALDRIG SETTS LARMA ÄR INTE VERIFIERAD. Beviset är tvåsidigt: tyst natt när fixturerna stämmer, larm när en fixtur medvetet görs fel.

Täcker användarberättelser: 6, 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Vakten kör nattligt i den befintliga natt-kedjan och är ICKE-blockerande — en avvikelse fäller ingen PR
- [x] #2 Vakten täcker de endpoints som bär merparten av de skarpa restanropen; urvalet är motiverat mot mätdata, inte handplockat
- [x] #3 Fixtursvar och skarpt svar parsas genom SAMMA schema före jämförelse — divergerar de är det fixturen som är fel, inte jämförelsen
- [x] #4 Larmet namnger vilken endpoint som divergerar och på vilket sätt; ett anonymt larm tvingar fram en utredning vakten skulle ha gjort
- [x] #5 TVÅSIDIGT BEVIS: tyst natt på korrekta fixturer OCH ett skarpt larm framkallat av en medvetet felaktig fixtur — båda körda, båda redovisade
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
LEVERANS (task-59.2, gren feat/task-59.2-kontraktsvakten)

VAD SOM BYGGDES
- tests/kontraktsvakt/kontraktsjamforelse.ts — REN jämförelsekärna. Tio
  avvikelseklasser (HTTP-STATUS, KUVERT, TOMT-UNDERLAG, SCHEMA-STAGING,
  SCHEMA-FIXTUR, OKÄND-NYCKEL-STAGING/-FIXTUR, FIXTUREN-BAKOM/-FÖRE,
  TYPDIVERGENS) plus larmtexten. Inga anrop, ingen env — det är villkoret för
  att vakten kan bevisas negativt utan staging.
- tests/kontraktsvakt/kontraktsfall.ts — de tre bevakade kontrakten med
  mätdata-härledningen i klartext. Filen är det som skrivs om vid
  Supabase-bytet (ADR-080 beslut 5).
- tests/kontraktsvakt/kontraktsvakt.staging.test.ts — nattvakten. Ett test per
  endpoint; larm skrivs även till GITHUB_STEP_SUMMARY.
- tests/api/kontraktsvakt-jamforelse.test.ts — 16 pure self-tests i api-pure,
  körs i VARJE PR utan staging. Negativa beviset per klass.
- playwright.config.ts — projektet `kontraktsvakt` (dependencies: api-setup).
- package.json — `npm run vakt:kontrakt`.
- .github/workflows/nightly.yml — jobbet `Kontraktsvakt (fixtur mot skarp
  staging)` + tillagt i `alarm.needs`.
- CONTRIBUTING.md § Kontraktsvakten, README-scripts-rad.

AC 1 — ICKE-BLOCKERANDE PER PLACERING, INTE PER FLAGGA. Projektet körs bara av
nightly.yml och ingår inte i ci-suite.yml (som är delad mellan natten och
presubmit), alltså kan det strukturellt inte fälla en PR. `continue-on-error`
förkastades aktivt: det hade gjort needs-resultatet 'success' och larm-jobbet
hade aldrig fyrat. Ingen staging-mutex — vakten gör tre GET och muterar inget;
sentinel-rader som suite-jobbet skapar samtidigt ändrar antal poster men inte
form.

AC 2 — URVALET HÄRLETT, INTE HANDPLOCKAT. Hermetik-mätningens råa JSONL (863
poster, 32 filer) räknades om: 745 typsnitt (86,3 %), 118 skarpa. Per sökväg:
get-event-notes 55 · get-registrations 26 · get-events 22 · get-event 7 ·
get-event-formats 3 · auth/token 2 · auth/logout 1 · get-persons 1 ·
create-event 1. De tre valda bär 103 av 118 (87,3 %). ADR-080 anger 104 för
samma tre; omräkningen ger 103. Skillnaden är en anropsrad och rör ingen
slutsats, men den bokförs i kontraktsfall.ts hellre än att ärvas oprövad.

AC 3 — SAMMA SCHEMA BÅDA SIDOR. z.array(fall.schema) parsar fixturlistan och
den skarpa listan i granskaKontrakt; inget jämförelse-eget schema finns.
Verifierat negativt: `fixturen bryter mot sitt eget schema → SCHEMA-FIXTUR`
och `staging bryter mot schemat → SCHEMA-STAGING` är separata self-tests, och
`identiska sidor ger NOLL avvikelser` körs för alla tre verkliga fall.

AC 4 — LARMET NAMNGER. Endpoint i rubriken, per avvikelse: klass, antal,
FÄLTNAMNEN, observerad typ per sida och i hur många skarpa poster nyckeln
fanns. Plus VAD DU GÖR NU (5 steg) och VAD VAKTEN INTE SER (form ≠ värde;
null bortsett; nästlade objekt endast via schemat; svansen obevakad).

AC 5 — TVÅSIDIGT BEVIS, BÅDA KÖRDA MOT SKARP STAGING.
  TYST: `npm run vakt:kontrakt` → 4 passed (5,0 s), noll avvikelser på
  get-events (27 poster), get-registrations (43), get-event-notes (8).
  LARM: fixturens `forfattare` döptes medvetet till `författare` →
  KontraktsavvikelseError med FYRA avvikelser (SCHEMA-FIXTUR,
  OKÄND-NYCKEL-FIXTUR, FIXTUREN-BAKOM, FIXTUREN-FÖRE), varje fältnamn
  utskrivet. Sabotaget reverterat; fixturen verifierad återställd.
  Permanent: 16 pure self-tests bär klass-för-klass-beviset i CI.

VAKTENS FÖRSTA SKARPA FYND — EN VERKLIG DRIFT, INTE ETT KONSTRUERAT FALL
Första körningen mot staging larmade skarpt på get-registrations:
FIXTUREN-BAKOM, 11 nycklar som Edge Functionen skickar i 43/43 poster men
fixturen saknade (antalGenomfordaEvent, bekraftelseSkickad, borOver,
deltagarinfoSkickad, erfarenhetsbadge, kurshistorik, medfoljandeTill,
noteringAnmalningsavgift, noteringSlutbetalning,
paminnelseAnmalningsavgiftSkickad, paminnelseSlutbetalningSkickad). En tolfte,
`kalla`, fanns i 1 av 6 fixtur-poster mot EF:ens alltid.
Fixturen rättades i samma skiva (enabling-detour, ADR-053): värdena är
mappningens egna (registration-read.ts `?? null` / `=== true`; den event-lösa
grenen kör aldrig berikaPersonhistorik). RENDERINGS-NEUTRALITETEN ÄR MÄTT, EJ
ARGUMENTERAD: `npm run test:visual` 28 passed före ändringen och 28 passed
efter, mot darwin-baselines skrivna 17:18 samma dag — noll pixeldiff.
Form-paritet, inte värde-täckning: fälten bär null/false. Att pröva appen mot
deras ifyllda tillstånd hör till migrerings-skivorna.

GRINDAR (lokalt, faktiska siffror)
  npm run test:api            397 passed (42,8 s)
  npm run test:api:pure       224 passed — varav 16 nya self-tests
  npm run typecheck           0 fel
  npm run typecheck:tests     0 fel
  npx @biomejs/biome check .  exit 0 (0 errors)
  npm run build               grön
  npm run test:visual         28 passed (15,6 s)
  npm run vakt:kontrakt       4 passed (5,0 s)
  actionlint 1.7.12           exit 0 (CI:s exakta -ignore-flagga)
  yamllint .github/           OK
  npm run check:docs          9 gröna

EJ NÖJD MED / ÖPPET
- Vakten ser inte ren värde-drift (0,67 → 67 med samma typ passerar tyst) och
  kan inte skilja "tomt i staging" från "slutat fyllas" när schemat tillåter
  null. Gränsen står i larmet, den döljs inte.
- Nästlade objekt (kurshistorik-poster) prövas bara av schemat, inte av
  formprofilen.
- Profilen unionerar över poster: en nyckel som finns i EN post räknas som
  närvarande. Det var precis vad som gjorde `kalla`-luckan osynlig tills den
  hittades för hand.
- Jobbet är overifierat i CI vid skrivande stund — nattkedjan körs först 03:00.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Kontraktsvakten är i drift och har setts LARMA på en medvetet felaktig fixtur innan sista filen flyttas
- [x] #6 Samma zod-scheman parsar fixtursvar som parsar skarpa svar — fogen verifierad, ej antagen
<!-- DOD:END -->
