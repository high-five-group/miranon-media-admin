---
id: TASK-416.14
title: >-
  Skiva: CLS-grinden — mat-cls.ts riktad mot ladd-till-laddat-övergången på de
  fyra värsta vyerna, hermetiskt med nya fixtur-handlers
status: Done
assignee: []
created_date: '2026-09-06 13:23'
updated_date: '2026-09-07 16:35'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 740000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport D §6, §8 (S123). tests/support/mat-cls.ts är en riktig CLS-mätare (PerformanceObserver layout-shift) men används bara på /dev/primitives. Ingen fil i tests/ mäter geometri över ladd-till-laddat-gränsen på en riktig vy. Fixturvärlden (tests/support/fixturvarld/handlers.ts:81–190) saknar handlers för get-attendance och betalnings-EF:erna. Åtgärd: acceptance-test som laddar Check-in, Betalningsinkorgen, Aktivitetshistorik och Anmälningar med fördröjda MSW-svar, mäter CLS från skeleton till innehåll och kräver CLS < 0,05 (Googles good-tröskel är 0,1; vi lägger oss under); nya handlers för get-attendance och de betalnings-EF:er som krävs. Beroende: skivorna för de fyra vyerna ska ha landat, annars rött-först. Grinden skyddar regeln sidkromet renderas i alla tillstånd mot regression.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Acceptance-test mäter CLS skeleton→innehåll på Check-in, Aktivitetshistorik och Anmälningar (Betalningsinkorgen deferrerad till TASK-409: kan inte nås hermetiskt med VITE_FEATURE_BETALNINGAR av i playwright.config.ts); tröskel 0,05 dokumenterad med källa (web.dev/cls good ≤ 0,1)
- [x] #2 Fixtur-handlers för get-attendance (fanns) och hamta-oppna-betalningar (tillagd) i fixturvärlden; kontraktsvakten ej tillämplig på PR-ytan (bor i nightly mot live staging och itererar bara KONTRAKTSFALL)
- [x] #3 Tvåsidigt bevis mot den invariant grinden faktiskt bär: en temporär geometri-regression på ett PERSISTERANDE sidkroms-element (FramstegskortD, height 2000 under isPending) gör Check-in mobil rött (CLS 0,0517 > 0,05, deterministiskt); listkroppens egen geometri bärs av *-laddlage-filernas boundingBox-tester, inte av sid-CLS
- [x] #4 Acceptance-klassen grön i CI
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 — PARTIELLT (3 av 4 vyer), orkestrerar-godkänd exkludering: Check-in/Aktivitetshistorik/Anmälningar mätta och gröna (CLS-tabell i testfilens docblock); Betalningsinkorgen UTESLUTEN — playwright.config.ts hårdkodar VITE_FEATURE_BETALNINGAR: 'av' för acceptance-dev-servern, betalningar.tsx:s beforeLoad redirectar till /mer när flaggan är av, kan därför inte navigeras till hermetiskt (samma öppna yta som TASK-409, task/409-hermetisk-betalningsvarld). Tröskel 0,05 källmärkt mot web.dev/cls 'good' <= 0,1. Mätta CLS-tal (2026-09-06, tests/acceptance/laddning-cls.acceptance.test.ts, oförändrade efter review-runda 1:s hallbarMock-byte): Check-in desktop 0,00005029601520962185 / mobil 0,00016544980087904352; Aktivitetshistorik desktop 0,00003987630208333333 / mobil 0,01482668511841718; Anmälningar desktop 0 / mobil 0.

AC #2 — get-attendance fanns redan (kortets "saknas troligen" var inaktuellt, verifierat mot handlers.ts). hamta-oppna-betalningar-handlern TILLAGD (handlers.ts, importerar OPPNA_BETALNINGAR_RESPONSE ur fixture-data.ts som redan fanns på grenen) — förberedd infrastruktur, ej exercised av något test i denna skiva (Betalningsinkorgen utesluten, se AC #1). "Kontraktsvakten grön" EJ VERIFIERAT AV MIG: projektet kontraktsvakt körs uteslutande i nightly.yml mot live Supabase-staging och itererar bara KONTRAKTSFALL/FELKONTRAKTSFALL (kontraktsfall.ts) — en registrerad handler utan ett eget kontraktsfall ger den vakten ingenting att jämföra mot, oavsett. Sökte även efter en kontraktsvakt-referens i ci.yml: ingen träff (endast i nightly.yml) — bokfört som en obelagd uppdrags-premiss (ADR-086), inte utfört.

AC #3 — UPPDATERAD EFTER REVIEW-RUNDA 1 (fynd: bocken satt på en literal väg som aldrig prövades). Tvåsidigt bevis KÖRT, men INTE via kortets literala "geometri-avvikelse i en fixtur"-väg: den vägen (t.ex. ett namn som radbryter så en laddad rad blir högre än skelettraden) träffar listkroppens EGEN geometri, och sid-nivå-CLS är bevisligen blind för just den klassen på dessa tre vyer (se testfilens docblock och min egen mätning: en 2000 px minHeight i EventCheckin.tsx:s skelettcontainer gav bit-identisk CLS mot orört läge — noll skillnad, alltså omöjlig att göra röd den vägen med detta instrument). Det bevis som FAKTISKT gjordes prövar i stället den invariant grinden verkligen bär: att ett PERSISTERANDE sidkroms-element (FramstegskortD i EventCheckin.tsx, som aldrig unmountas över isPending-till-laddat-övergången) inte får hoppa. En temporär style-regression (height: 2000 på FramstegskortD medan isPending) gav Check-in mobil 390x844 DETERMINISTISKT rött (CLS 0,05173770879479808, större än tröskeln 0,05, bit-identiskt över två oberoende körningar). Check-in desktop förblev grönt vid SAMMA ändring — väntat, inte ett testfel: CLS:s impact-andel är viewport-relativ. Regressionen applicerades manuellt, kördes, och återställdes med versionskontrollens filspecifika checkout (aldrig stash), och bekräftades grönt igen med oförändrade tal efteråt. Bocken lämnas AVMARKERAD: den literala AC-texten pekar på en väg instrumentet inte kan pröva, och det bevisade skyddar en annan, verklig invariant (sidkromets egen stabilitet) — inte den AC:n bokstavligen efterfrågar.

AC #4 — EJ verifierat av mig (CI-svansen ägs av orkestreraren per agent-kontraktet). Lokalt gröna efter BÅDA byggrundorna: npm run typecheck exit 0, npx @biomejs/biome check . exit 0 (endast pre-existing varningar i orörda filer), node scripts/check-langa-streck.mjs exit 0 (0 src/-ändringar i denna diff), npm run test:acceptance -- tests/acceptance/laddning-cls.acceptance.test.ts 6/6 gröna (fem körningar i review-runda 2, en av dem fångade en genuin race — se nedan), npm run test:acceptance:sjalvtest -- samma fil: 6/6 fällda med OmockadRequestError, "BEVISET HÅLLER", inget test.fail/test.fixme använt, npm run build exit 0.

RÖRDA FILER: tests/support/fixturvarld/handlers.ts (ny hamta-oppna-betalningar-handler + import), tests/support/fixturvarld/fixture-data.ts (OPPNA_BETALNINGAR_RESPONSE nu satisfies OppnaBetalningar, genuint typecheck-verifierad), tests/support/mat-cls.ts (extraherade installeraLayoutShiftObservator/lasAvClsSumma ur matCLS, ny matCLSOverNavigering), tests/acceptance/laddning-cls.acceptance.test.ts (ny fil, 6 test: 3 vyer x 2 viewports).

REVIEW-RUNDA 1 (utlåtande läst i sin helhet, 4 warning + 4 info, samtliga auto-fix) — ÅTGÄRDAT: (1) fixture-data.ts: OPPNA_BETALNINGAR_RESPONSE bär nu genuint "satisfies OppnaBetalningar" — bidirektionellt bevisat (bröt forfallna till en sträng, tsc föll med TS2322, återställde, grönt igen). (2) handlers.ts: kommentaren påstår inte längre att kontraktsvakten får något att jämföra mot — skriven om till att beskriva vad registreringen faktiskt ger, med explicit pekare till kontraktsfall.ts:s egen "konvention, inte en grind"-deklaration. Inget kontraktsfall lades till (eget beslut, som review noterade). (3) mat-cls.ts: lasAvClsSumma är nu fail-closed — kastar ett tydligt fel om window.__mmClsSum saknar ett numeriskt värde, i stället för tyst ?? 0. (4) laddning-cls.acceptance.test.ts: samtliga tre vyers mock bytt från delay(700) till hallbarMock (håll/släpp, samma etablerade mönster som event-checkin-laddlage/mer-aktivitetshistorik-laddlage) — släpps inuti matCLSOverNavigerings wait-callback, mellan skelett- och innehålls-assertionen. Docblockets felaktiga påstående "gör ALDRIG ett sådant antagande" är rättat till att beskriva vad som FAKTISKT ändrades och varför. Anmälningars vanta-funktion asserterar nu en SYNLIG lokator (div[role=status] med hasText, inte bara sr-only-textens toBeAttached()) — getByRole med name-matchning gav oväntat element(s) not found trots att appen har flera role=status-regioner apputbrett, så jag bytte till en CSS-attributlokator som mätt fungerar deterministiskt; grundorsaken till namnberäkningsmissen är inte utredd, bokfört öppet i testfilens docblock. (5) idempotens: installeraObservatorIBrowsern vaktar nu mot dubbel installation via en __mmClsInstalled-sentinel (addInitScript kör vid varje navigering i sidans livstid) — dokumenterat i mat-cls.ts:s docblock. (6) describe-titeln bytt till "CLS-grinden — sidkromets stabilitet över skeleton→innehåll", docblocket pekar redan på *-laddlage-filerna (416.1/416.3/416.4) som bär radgeometrin. (7)+(8) se AC #3 ovan och denna sektion — bocken avmarkerad, denna notes-sektion skriven om med korrekta diakriter via CLI:t (aldrig direktredigering).

EGET FYND UNDER FIX-RUNDAN (ej i review-utlåtandet): min FÖRSTA hallbarMock-implementation hade en genuin race — vantaOmHallen() saknade en "hall"-boolean och köade ALLTID en ny resolver, så en request som startade EFTER slappAlla() (t.ex. attendance/registrations/event som fyrar i olika renderingspass) blev stående för evigt. Fångad empiriskt: körning 2 av fem gav en 16 s timeout på "Alma Almqvist" aldrig synlig. Fixat genom att lägga till exakt samma "hall"-flagga som det etablerade event-checkin-laddlage-mönstret redan bär (kollas VARJE gång en ny request kommer in, inte bara vid uppstart) — fem körningar i rad gröna efteråt.

REVIEW-RUNDA 2 (PR #2426, Opus, 2026-09-06): konvergerad, 3 info i ny prosa bokförda här utan kodändring: (1) mat-cls.ts lasAvClsSumma-docblocket påstår att page.evaluate inte kan returnera undefined — playwright-core serialiserar undefined ({v:'undefined'}); null-sentinelen är ett val, inte ett krav. (2) Engångskontraktet och fail-closed-uppräkningen nämner 'hård omnavigering mitt i en mätning'/'dokumentet ersatt' som skyddade fall — vid riktig navigering får det nya dokumentet ett färskt window (vakten hjälper inte, lasAvClsSumma läser 0 utan att kasta); luckan är latent (inga anropare) och ska namnges öppet. (3) hallbarCheckin saknar förlagans startvärmnings-undantag för get-registrations (eventId-gren) — fungerar eftersom allt släpps samtidigt, men 'samma form som förlagan' ska nyanseras. ÖPPET FÖR MARCUS: AC #1–#3 är felställda mot instrumentet (sid-CLS blind för listkroppen; Betalningsinkorgen kräver TASK-409; kontraktsvakten bor i nightly) — DoD #1 kan inte uppfyllas utan beslut om AC-texterna; grinden skyddar sidkromets stabilitet, radgeometrin bärs av *-laddlage-filernas boundingBox-tester.

AC-BESLUT (Marcus 2026-09-07, S123 resume 1: 'OK 416.14'): AC #1–#3 omskrivna av orkestreraren till vad instrumentet faktiskt kan mäta — sid-CLS är blind för listkroppen (radgeometrin bärs av *-laddlage-filernas boundingBox-tester), Betalningsinkorgen deferrerad till TASK-409, kontraktsvakten bor i nightly. Ursprungliga AC-texter bevarade i notes-historiken ovan (AC #1–#3 PARTIELLT/EJ VERIFIERAT-avsnitten). Landad som PR #2426 → 0ab225e3 (2026-09-06); post-merge hermetiska jobb gröna, staging-jobbet rött av medKvitto-driften från #2416 (löst när #2416 landade 988e0d3b). Done-flipp i S123 resume 1.
<!-- SECTION:NOTES:END -->
