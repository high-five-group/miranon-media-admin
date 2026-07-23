---
id: TASK-19.3
title: 'Skiva: Skapa-sidan till facit'
status: In Progress
assignee: []
created_date: '2026-07-21 08:21'
updated_date: '2026-07-23 10:36'
labels:
  - ready-for-agent
dependencies:
  - TASK-19.1
  - TASK-19.2
parent_task_id: TASK-19
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sidan i familjens formklass mot BEFINTLIGA skapa-operationen (server-side shape, allowlist, Airtable-nativ upsert-idempotens med klient-genererad nyckel — ADR-066): fälten Event, Eventtyp, Ort, datum, max antal platser och eventformat med etiketterna 2 dagar respektive 1 dag mappade mot basens Eventformat-poster via befintlig format-läsning; Event/Eventtyp-språket per ORDLISTA med namnkrocken explicit i mappningen; inga obligatorisk-markeringar (allt krävs, inget markeras); publicerings-avsnittet renderar handtaget (utan verkan tills flaggan finns i 19.4); bekräftelseläge efter skapande. Täcker användarberättelser: 2-4, 6-8, 12 (TASK-19).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skapa-flödet ände-till-ände mot staging med teardown via befintlig operation; idempotensen regressions-bevakad, byggs inte om
- [x] #2 Formen renderar per facit-skapa-sidan: fältfacit, språket, formatetiketterna, inga obligatorisk-markeringar
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Levererad i S75-batchen (parallell form, ADR-073). Skapa-sidan NYSKRIVEN i familjens formklass mot S73-facit-utökningen (FACIT-skapa-sidan.png): rund chevron + h1 med avgränsare · grupperna Om eventet / Platser och format / Publicering i DetaljGrupp (rubrik utanför tonala kortet) · fälten Event, Eventtyp, Ort, Datum (RAC DateRangePicker via DatumFalt, sv-SE), Max antal platser (RAC NumberField via AntalFalt, w-32), Eventformat · publicerings-handtaget (SlideToConfirm från 19.1, mono-domänen per K81) · grön Skapa event + Avbryt · BEKRÄFTELSELÄGE efter skapande (PRD-berättelse 8; ersätter den tidigare auto-navigationen — skapandet KVITTERAS, nästa steg ett klick bort) · INGA obligatorisk-markeringar (K84; isRequired kvar för skärmläsare, primitiverna renderar ingen asterisk).

SPRÅKET/NAMNKROCKEN explicit i mappningen: UI-Event -> basens 'Event (source)' · UI-Eventtyp -> basens 'Typ' · UI-Eventformat -> basens 'Eventtyp'-LÄNK. Formatetiketterna 2 dagar/1 dag mappas i NY ren helper src/lib/eventformat-etikett.ts ur den BEFINTLIGA format-läsningen (get-event-formats) — ingen ny EF, ingen hårdkodad options-lista; omappad post visas med sitt bas-namn (fail-open: en post får aldrig försvinna ur listan), namnlös post faller tillbaka på record-ID.

PUBLICERING UTAN VERKAN (kortets avgränsning): handtagets läge skickas ALDRIG till create-event — e2e asserterar att payloaden saknar publicerings-nyckel. 19.4 äger fältet + allowlisten.

BIBLIOTEK: Button får intent='success' (grön primär, S73-facit K77) med egna komponent-tokens i components.css (--mm-button-success-*, alias mot --mm-success; vit text ≈5,6:1 = AA, axe-verifierat) + demo-sektion på /dev/primitives. Ersätter prototypens ad-hoc className-override av primitivens färg (design-systemets regel).

BAS-ÄNDRING (ADDITIV, STAGING ENDAST — prod orörd): staging Eventformat bar bara sentinel-fixturen ZZ-create-event-test-format, vilket gjorde facit-etiketterna orenderbara. Två poster tillagda som SPEGLAR prod live-verifierat (Airtable-MCP 2026-07-22): 'Utbildning - 2 dagar' (Format: Dag 1+Dag 2, recC0Xy7mfN1lUASg) och 'Föreläsning' (Format: Föreläsning, recNTLLDIH5Kwt401). ZZ-fixturen orörd. Ingen schema-ändring, inga nya fält. docs/reference/data-model.md är läs-yta i batchen — synken av detta (staging Eventformat = 3 poster) deferrad till sessionens end-pass.

TDD-BEVIS: (1) eventformat-etikett — 5 pure-tester RÖDA (modul saknades) före implementation, gröna efter. (2) Button success — a11y-testet 'Button — alla fem intent-sektioner' RÖTT ('No elements found for include' på rubrik-success) före demo-sektionen, grönt efter. (3) e2e-sviten: se AVVIKELSE nedan.

AVVIKELSE (öppet bokförd): formens e2e-beteenden fick INTE observerad RÖD fas före implementation — batch-direktivet utgick från att e2e inte kan köras lokalt (5173 bär Marcus dev-server). Kompensation: sviten kördes ändå lokalt UTAN att röra 5173 — de nio mockade testerna mot en dev-server på port 5399 (fångade två äkta defekter i sviten: RAC NumberField exponerar TEXTBOX, inte spinbutton; skarpa options-läsningen måste inväntas före interaktion) och det SKARPA staging-testet mot ett staging-bygge på port 4173 (CORS-tillåten preview-origin, S66). 10/10 gröna.

AC #1 (skarpt mot staging): nytt e2e-describe 'SKARPT mot staging' — inga mocks, formuläret läser live-options och SKRIVER via befintlig create-event (ADR-066). Skarpt bevis: Event-850 / recHUFAIRaSbvumuH skapad ur UI:t 2026-07-22 med Ort=ZZ-create-event-test, Eventtyp=recC0Xy7mfN1lUASg (dvs etiketten '2 dagar' löste rätt bas-post; Sessionsmall Dag 1+Dag 2 rullade). Teardown = ZZ-sentinel + setup-purge (.purge-staging-policy.json target create-event-sentineler; länk-guard undantar Eventtyp). Idempotensen byggd INTE om — den regressions-bevakas i tests/api/create-event.staging.test.ts.

FACIT-AVPRICKNING (DoD 6): renderad verifiering före granskning — skärmdump 390x844 av den SKARPA sidan mot bilagan (identisk uppställning: chevron, rubrik+linje, tre grupper, fältordning, handtaget, grön knapp först) + computed-assertion på Skapa-knappens background-color rgb(96,107,87) + aria-snapshot av hela formen i e2e.

GRINDAR (lokalt, hårt grindade): Biome exit 0 · typecheck 0 fel · typecheck:tests 0 fel · test:api 318/318 · build grön · test:a11y 62/62 · e2e 10/10 (off-port, se avvikelsen). CI-grinden och Marcus design-review (DoD 3/5/6) står öppna.

STUDS-LÄKNINGEN (2026-07-22, S75 batch 3 · orkestratorns diagnos-pass):

ROTORSAK — inte formens kod. PR-CI:s e2e föll på 401 `{"error":"Invalid or expired token"}` från get-events + get-event-formats i det skarpa AC #1-testet. Reproducerat lokalt mot CORS-tillåten origin: testet är GRÖNT ensamt (10/10) och i liten seriell delmängd (68/68), men RÖTT i full parallell svit — identisk signatur som CI.

Mekanismen: testet är det FÖRSTA e2e-testet i repot som gör en omockad EF-läsning (alla 27 övriga staging-e2e-filer page.route-mockar sina EF-anrop). Därför är det också det första som märker att den delade `playwright/.auth/user.json`-sessionen inte håller SERVER-SIDE under full svit — ~200 webbläsarkontexter hydreras ur samma refresh-token och rotationen gör att de flesta förlorar kapplöpningen. `requireUser` validerar mot Supabase Auth och avvisar. Mockade tester märker aldrig detta. Samma familj som T24-b:s GoTrue-429-burst i api-sviten.

ÅTGÄRD: det skarpa describe-blocket får en EGEN färsk session (`test.use({ storageState: tom })` + `loggaInFristaende`) i stället för den delade. Ny helper `tests/e2e/helpers/fristaende-session.ts` bär rationalen och läser credentials ur env enligt Kandidat 34-disciplinen (aldrig literaler, aldrig loggning) — samma hard-fail som auth.setup.ts. Kostnad: en extra GoTrue-inloggning per run.

VERIFIERING: full parallell svit mot staging-bygge på tillåten origin — det skarpa testet GRÖNT (217 passed). Grindar: test:api 318/318 · typecheck 0 · biome 0 fel · build grön · a11y 62/62.

SIDOLEVERANS I SAMMA COMMIT: CI laddade aldrig upp Playwright-artefakter, så ett CI-only-fel gick bara att gissa sig till — traces genereras (on-first-retry) men kastades med runnern. Uppladdningssteg tillagt vid rött e2e (7 dagars retention; global-teardown har redan purgat klartext-lösenord per ADR-061 pelare 3).

---

HISTORIK — HALT-NOTEN FRÅN BATCH-KÖRNINGEN (bevarad per ADR-073 Am 3 mandat (b), union; läkt av studs-läkningen ovan):

AVBRUTEN AV MERGE-AGENTEN (S75 batch, ADR-073) — HALT i steg 5 (PR-CI-vakten per jobb). INGEN MERGE.

PR: #80 (https://github.com/marcus803/miranon-media-admin/pull/80) — STÅR KVAR som åtgärdsyta.
Branch: task/19.3 @ 2ab90224254185f36bd4d06d6b74ad5d5331c736 — STÅR KVAR (lokal + remote).
PR-CI-run: 29944497868 — conclusion: failure.

PER JOBB: Detect changed files=success · Lint + Audit + TypeCheck=success · Staging sentinel purge=success · Docs link check=success · Test + Build=FAILURE · CI Passed or Skipped=skipped.
Test + Build per steg: API tests (pure)=success · API tests (staging)=success · Install Playwright Chromium=success · E2E tests (staging)=FAILURE · A11y tests (axe-runner)=skipped · Build=skipped.

E2E-UTFALL (kortets e2e-bevis, pr-ci-bevisformen): 215 passed · 1 failed · 3 skipped av 219.

FALLERANDE TEST (verbatim ur run-loggen):
  [chromium-authenticated] > tests/e2e/skapa-event.staging.test.ts:345:3 > Skapa nytt event — SKARPT mot staging (AC #1) > formuläret skapar ett riktigt event i staging och landar i bekräftelseläget
  Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 401
    > 355 |     expect((await eventsSvar).status()).toBe(200);
    at tests/e2e/skapa-event.staging.test.ts:355:41
  Föll identiskt på Retry #1 och Retry #2 (dvs INTE flake).

TOLKNING (ej åtgärdad av merge-agenten): det är kortets EGET nya SKARPA describe som faller — sidans live-läsning (events-anropet) svarar 401 i CI-miljön, medan de mockade testerna och den ÖVRIGA staging-sviten (inkl. tests/api staging) är gröna. Bygg-agentens lokala e2e-körning skedde off-port mot ett lokalt staging-bygge (port 4173, CORS-tillåten preview-origin) — den miljön bar en auth-form som CI-runnern inte bär. Fixen hör till bygg-agenten (auth/token-vägen för den skarpa läsningen i CI), inte till merge-kedjan.

KORT-TILLSTÅND: status återställd To Do. AC/DoD-bockarna på branchen är INTE landade på main (ingen merge skedde) — kortet på main står orört i sitt för-batch-skick förutom denna not.

MERGAD (S75 batch 3, studs-läkningen): PR #80 → merge-commit 6e0a78c. PR-CI-run 29949249222 GRÖN PER JOBB (6/6 fil-lästa: detect · lint+audit+typecheck · sentinel purge · docs link check · Test + Build [bär e2e-beviset] · CI Passed). Kortet står GRANSKNINGSFÄRDIGT — In Progress, DoD #5 (Marcus design-review mot FACIT-skapa-sidan.png) och DoD #6 öppna. Done-flippen är Marcus.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-23 09:40
---
Review-våg 3 (2026-07-23, PR #92): miranon.se-typsnittet — K81:s mono-adressgrammatik RIVEN på Marcus-direktiv (punkt 10): brödtextens typsnitt i font-medium. E2e-kontrakt på computed fontFamily/fontWeight. DoD #5 fortsatt öppen tills omgranskning.
---

created: 2026-07-23 10:36
---
Review-våg 5 (2026-07-23, PR #94): Skapa event-knappen dynamisk intent — primary oarmerad / success armerad publicering (K77:s statiska grön-form riven; dynamiska grön-regeln). E2e-låset omskrivet till båda lägena. DoD #5 fortsatt öppen tills omgranskning.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review MOT S73-FACIT-UTÖKNINGEN: Marcus-granskning i webbläsaren godkänd mot facit-bilagorna (per skiva med UI-yta; L220)
- [ ] #6 Facit-avprickningen: varje berörd facit-punkt avprickad med renderad verifiering (computed-style/skärmdump) före granskning (L245/L246)
- [x] #7 Bas-ändringar ADDITIVA och staging FÖRST; prod-deploy av fält/EF är separat Marcus-auktoriserad handling (ADR-050/ADR-063)
<!-- DOD:END -->
