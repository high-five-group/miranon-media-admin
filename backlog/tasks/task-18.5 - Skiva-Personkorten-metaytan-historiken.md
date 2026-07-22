---
id: TASK-18.5
title: 'Skiva: Personkorten (metaytan + historiken)'
status: In Progress
assignee: []
created_date: '2026-07-21 08:20'
updated_date: '2026-07-22 19:48'
labels:
  - ready-for-agent
dependencies:
  - TASK-18.4
parent_task_id: TASK-18
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
De vita personkorten i grupperna får facitets form: namnet i fetstil som person-länk (identitetszonen är person-klickytan), E-post etikett-över-värde, metaytan med Anmäld dag + klockslag på EN rad som egen länk-rad utlyft ur person-länken, endast UTFÖRDA åtgärder på var sin rad (ej-skickat visas aldrig), sista raden Första eventet respektive N tidigare event hos Miranon Media (hela namnet), kategori-pill endast vid avvikelse per tysta normen. Anmäld-radens länkmål beläggs öppet i skivan — anmälans egen sida finns inte än; belagt mål eller olänkad med motiv, aldrig tyst. Täcker användarberättelser: 16 (TASK-18).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Personkorten matchar facit renderat: metaytan, endast utförda åtgärder, historikraden med hela namnet
- [x] #2 Anmäld-radens länkmål belagt och öppet bokfört i skivan
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Leverans (task/18.5)

### Snittet

REN UI-SKIVA. Deltagar-raden i `src/components/events/detail/Deltagare.tsx`
växer till PERSONKORTET (`DeltagarRad` → `DeltagarKort`) enligt S73-facit
K45/K62. **Noll nya shape-fält, noll EF-ändring, noll allowlist-post, noll
bas-ändring** — hela metaytan och historiken byggs på fält task-18.4 och
task-18.8 redan lagt i `Registration` (`inskickad`, `email`, `personId`,
`kalla`, `bekraftelseSkickad`, `deltagarinfoSkickad`, de tre
påminnelse-tidsstämplarna, `antalGenomfordaEvent`). DoD #7 därmed uppfylld
utan bas-schemaändring; PROD ORÖRD, staging orörd.

### Formen (facit-punkt för facit-punkt)

- **Identitetszonen ÄR person-klickytan** — namn (fetstil 600 / 16 px) +
  E-post etikett-över-värde inuti `Link to="/personer/$personId"`.
  Saknas person-kopplingen renderas zonen som ren text (en länk till
  `/personer/null` vore trasig affordans).
- **Pillarna står UTANFÖR länken** (avvikelse från prototypens form, öppet
  bokförd): Obekräftad är anmälans TILLSTÅND och kategorin dess VÄG IN —
  ingetdera är personens identitet, och inbäddade hade de gjort länkens
  tillgängliga namn till "Anna Ek Obekräftad Medföljande". Visuellt
  identiskt (topp-höger på namnraden). Normen via formulär bär inget märke.
- **Metaytan är SYSKON till länken** (K62/K44/L303 — interaktivt bor aldrig
  i interaktivt): "Anmäld 1 juli 11:00" på EN rad ur `Inskickad`-dateTimen.
- **ENDAST UTFÖRDA åtgärder**, var och en på egen rad, i Lottas
  utskicksordning: Bekräftelse → Påminnelse → Eventinfo (K42, samma ordning
  som summeringsraderna). Ej-skickat renderas ALDRIG.
- **Historikraden sist** med HELA namnet: "Första eventet hos Miranon Media"
  (0) / "N tidigare event hos Miranon Media" (>0).
- Påminnelseraden tar SENASTE av basens tre parallella tidsstämplar
  (odelad + 18.8:s två per-betalnings-fält) — en rad, inte tre.

### Räknaren (FAS-direktivet)

Historikraden läser `antalGenomfordaEvent` — EXAKT den Personer-räknare
task-18.4 införde. Ingen andra väg till samma siffra. Är den `null`
(ingen person-koppling, eller EF:ens event-lösa gren) UTELÄMNAS raden:
"Första eventet" om en okänd person vore en osanning.

**Öppet bokförd semantik-kant (ej åtgärdad, ej blockerande):** basens
`Antal genomförda event` = RIM 1 × + RIM 2 × + RIM 3 × + Fjärrskådning ×,
dvs. räknar Deltaganden-poster. För ett KOMMANDE event finns ingen sådan
post, så siffran är genuint "tidigare event". För ett GENOMFÖRT event ingår
det aktuella eventet och raden övertalar med 1. Kortets FAS-direktiv låser
räknaren; en klient-side-justering hade blivit den andra vägen direktivet
förbjuder. Resolution hör till bas-maximeringen (T16 / ADR-063).

### Källa-fältet (FAS-direktivet)

Verifierat mot 18.4:s utfall: `kalla` (fldwk2sl7CkBv9epw) ÄR mappad i
shapen och kategori-pillen fungerar oförändrat — inget nytt behövdes.

### AC #2 — Anmäld-radens länkmål: OLÄNKAD, belagt

Anmälans egen sida finns INTE (PRD task-18 §Utanför omfattningen), och
INGEN befintlig yta visar EN anmälan: `/event/$eventId/anmalda`
(EventRegistrations) renderar hela rostern utan per-anmälan-djuplänk, och
`/mer/anmalningar` har varken route-param eller `validateSearch` för en
enskild anmälan. Facitets understrukna rad var en prototyp-NO-OP; i skarp
produkt vore en understruken rad som inte leder någonstans en osann
affordans. Raden renderas därför olänkad (ikon + text; `text-decoration:
none` mätt). Länkformen återinförs i den skiva som föder anmälans route.

### DEFEKT fångad i facit-avprickningen (rött-först läkt)

390-px-mätningen visade att pillspannets `shrink-0` åt så mycket bredd att
identitetskolumnen kollapsade: "Bertil Sund" radbröts och e-posten bröts
MITT I ORDET ("bertil@exa / mple.se") när BÅDA pillarna (Obekräftad +
Manuellt tillagd) stod på raden. Läkt med `flex-1` på identitetskolumnen +
`flex-wrap` och `max-w-[45%]` på pillspannet (graciös degradering: en rad
när det får plats, staplade när det är trångt). Regressionstest tillagt.

**Mät-metodens egen rättelse:** första assertionen räknade
`element.getClientRects().length` och gav 1 ÄVEN i det brutna läget —
flex-items blockifieras och har alltid EN border-box. Bytt till
`Range.getClientRects()` över textinnehållet, som räknar faktiska
radboxar. RÖTT observerat först DÄREFTER (Expected 1, Received 2).

### e2e-svitens placering (öppet bokförd claims-fråga)

task-18.4:s `tests/e2e/event-deltagare.staging.test.ts` ligger UTANFÖR
denna skivas deklarerade fil-yta. Personkorten renderas på eventsidan, så
bevisen lades i eventsidans egen svit
`tests/e2e/event-detail.staging.test.ts` (inom ytan) som eget
describe-block med egen mock. Ingen fil utanför ytan rörd.

### Bevis

- **e2e (AC #1 / AC #2):** 8 nya tester. RÖTT observerat mekaniskt före
  implementationen (6 failed / 2 passed på de sex substantiella), GRÖNT
  efter (8/8 plus setup). Regressionstestet RÖTT-först separat verifierat
  mot den oläkta formen (Expected 1, Received 2).
- **Renderad facit-verifiering (DoD #6, L245/L246):** 390 × 844-skärmdump
  av hela deltagar-gruppen plus computed-style-mätning per kort: namnvikt
  600 / 16 px; metaraderna 12 px `rgb(107,107,107)`; Anmäld-radens
  `text-decoration-line: none`; `lankInnehallerMeta: false` och
  `lankInnehallerPill: false` på alla kort (interaktivt i interaktivt = 0);
  historikradens tre former (0 / N / utelämnad); namn- och e-post-radboxar
  = 1 efter läkningen.
- **Övriga grindar:** api 322/322; typecheck 0; typecheck:tests 0;
  biome 0 fel; build grön; a11y 62/62; vale 0 errors.
- **Full e2e-svit:** 230 passed / 2 failed / 3 skipped. De två röda är
  BEVISAT pre-existerande på förgrenings-SHA:t `4d30c5c` (baseline-körning
  med ändringarna stashade gav 222 passed och SAMMA 2 failed):
  `skapa-event.staging:357` (skarp EF-läsning, CORS-blockerad på port
  5188 per kortets egen körform) och `hem.staging:410` (fyndrapporterad).
  Deltat 222 till 230 är exakt de 8 nya testerna.

### e2e-körformen

Egen dev-server på port **5188** plus `PLAYWRIGHT_TEST_BASE_URL` (hoppar
över webServer-blocket). Sviten är helt route-mockad, så staging-CORS är
aldrig i spel. Port 5173 (Marcus dev-server) ALDRIG rörd.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [x] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
