---
id: TASK-309.48
title: >-
  Fynd: dokumentlistans rullningsskugga mörkar brickan i kortens nedre hörn och
  rännan, och spåret slutar 8 px under sista kortet — skrim i brickans färg med
  darken, rännan blir marginal, skuggan tonar ut i stället för att släckas
status: To Do
assignee: []
created_date: '2026-09-08 14:33'
labels:
  - fynd
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 766000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-titt 2026-09-08 (S124 resume 1, fyra skärmavbilder kl 16.08–16.09): skuggningen i dokumentlistans nederkant ser inte proffsig ut — en gråaktig list UNDER sista kortet, en "mörk trekant" på höger sida vid kortets nedre hörn, och rullningslisten "går längre ned än sista kortet". Marcus: "Lös detta ordentligt och proffsigt." Frågan "skuggan kan väl ligga kvar även när man kommer längst ner?" besvaras nedan (punkt C) med en kontinuerlig uttoning i stället för dagens släckning; att låta den ligga kvar permanent är en enrads-ändring som Marcus avgör vid ögonmätningen.

MÄTT AV ORKESTRERAREN 2026-09-08 mot dev-server (`/mer/dokument`, 9 rader, 1280×900, Playwright, rådata i sessionsdok S124): `ul` x 381–899 (518 px), klassisk rulle 11 px ⇒ `clientWidth` 507, korten slutar x 888; `ul` `rounded-2xl` klipper vid x 899, kortet rundas vid x 888 — kurvorna har olika centrum (samma geometri TASK-309.47 beskrev, från andra hållet). `::after` (skrimmen, `--mm-state-hover` = 6 % text över transparent) är 507×24 px med RAKA hörn. Vid botten: sista kortets underkant 791, `ul`:s 799 — 8 px transparent `border-b-8` på SISTA raden ligger inuti det rullbara innehållet (`scrollHeight` 1116 = 9 × 124), så spåret slutar 8 px under kortet ("KÄND KANT, BOKFÖRD I STÄLLET FÖR LAPPAD" i `DokumentListRam`s kommentar — Marcus har nu dömt kanten).

ROTORSAKER, TVÅ:
(1) Skrimmen mörkar ALLT under sig — även brickan (`bg-bg-muted`, `--p-neutral-50` #f5f5f3) som syns genom kortens rundade hörn och i rännorna mellan korten. Marcus krav 2026-08-30 står oförändrat: "Skuggningen ska ju bara synas på vita kortet." Ett rakt band över ett rundat kort ger trekanten; ett band över rännan ger listen under kortet.
(2) Rännan är `border-b-8 border-transparent` på VARJE rad inklusive den sista, så innehållet är 8 px högre än sista kortet.

LÖSNING (prototypad i webbläsaren av orkestreraren 2026-09-08, bilder i sessionens scratchpad; trekanten och listen är borta, brickans pixlar under bandet är oförändrade):
A. RÄNNAN BLIR EN MARGINAL PÅ VARJE RAD UTOM DEN FÖRSTA (`li + li`), inte en border på varje rad: innehåll = n × 116 + (n − 1) × 8; spåret börjar vid första kortet (TASK-309.46 bevaras — ingen ledande ränna) OCH slutar vid sista kortet. Rännans tal bor på ETT ställe: en komponent-token `--mm-dokumentlista-ranna: 8px` i `src/styles/tokens/components.css` (komponent-tokens bor bara där, CLAUDE.md § Design-system), som radklassen använder (`[&+li]:mt-(--mm-dokumentlista-ranna)` eller motsvarande) OCH som hooken läser via `getComputedStyle(ul).getPropertyValue(...)` — aldrig ett andra tal i koden (ADR-083). INTE `gap-*`/flex: mätt i prototypen — i en flex-kolumn blir det klistrade pseudo-elementet en flex-item som krymper till 0 px höjd och får dessutom ett `gap` framför sig (trailing 8 px igen); bokför mätningen i docblocken när `gap`-avvisningens skäl skrivs om.
B. `useLastaListhojd` räknar i KORT + RÄNNA i alla tre nivåer: `hojd = kort × 4 + ranna × 3 + kantjustering`. NIVÅ 1: `kort = (rad4.bottom − rad1.top − 3 × ranna) / 4` (spannet mäts som i dag; inget separator-avdrag finns kvar). NIVÅ 2: `kort = max(radernas egna höjd)` (raderna bär ingen separator längre). NIVÅ 3: `kort = senastUppmattKorthojd ?? LISTA_FALLBACK_KORTHOJD` där konstanten byter namn och värde 122 → 116 (kortets mätta höjd; docblockens "SKRIV ALDRIG TILLBAKA 124"-stycke och separator-resonemanget ersätts av den nya invarianten — skriv om öppet, radera inte historiken). `separatorBredd` rivs. Låset ska fortsatt vara EXAKT 488 vid 0, 1, 3, 4 och 5+ rader (befintliga acceptance-sviter `dokument-lista-hojdlas*.acceptance.test.ts` duplicerar `FALLBACK_RADHOJD` — uppdatera talet där med samma motivering).
C. SKRIMMEN MÖRKAR BARA DET SOM ÄR LJUSARE ÄN BRICKAN: `after:from-bg-muted` (brickans EGEN token, samma som behållarens `bg-bg-muted`) + `after:mix-blend-darken`. `darken` tar min per kanal: på brickan blir det brickan (oförändrad, matematiskt), på vitt kort blir det brickans grå (#fff → #f5f5f3), på text/ikoner (mörkare) ingenting — texten dämpas inte (docblockens krav står). Bandet 32 px (`after:h-8 after:-mt-8`) i stället för 24 eftersom tonen är mätt svagare än dagens (Δ10 mot Δ~14 per kanal på vitt); Marcus ögonmäter styrkan och kan sätta 24. `contrast-more`-varianten (4 px `border-strong`, `bg-none`) behålls. Uttoning i stället för släckning: `data-vid-botten`/`after:hidden` rivs; `onScroll` sätter i stället CSS-variabeln `--skugg-op = clamp((scrollHeight − clientHeight − scrollTop) / bandhöjd, 0, 1)` direkt på `ul` (ref + `style.setProperty`, ingen React-state per rullframe) och skrimmen bär `after:opacity-(--skugg-op)`; initieras till 1 när listan blir rullbar och räknas om när radantalet/höjden ändras (samma layout-effekt som låset, eller en egen keyad på `kanRulla`/`matadHojd`/antal). Ingen animation — värdet följer rullen, så `prefers-reduced-motion` kräver inget.
D. Båda listorna (`DokumentLista` eventläget och `GemensamtLage` /mer/dokument) delar `DokumentListRam` och samma `<li className="border-transparent border-b-8">`-form på två ställen — båda ändras.
E. DOCBLOCKAR SKRIVS OM ÄRLIGT (ADR-083): `DokumentListRam`s wrapper-kommentar (RÄNNAN ÄR EN TRANSPARENT border-bottom → marginal; "VARFÖR INTE last:border-b-0" och "KÄND KANT, BOKFÖRD I STÄLLET FÖR LAPPAD" är superseded av Marcus dom 2026-09-08 — behåll historiken, markera vad som ersatte vad), § RULLNINGSSKUGGAN (skrim i brickans färg med darken; varför: uppmätt trekant/list; "DEN FÖRSVINNER VID BOTTEN" → tonar ut proportionellt; TASK-309.47:s "skuggan behöver ingen egen rundning" står kvar men skälet är nu att blandningen gör rundningen irrelevant), `LISTA_FALLBACK_*`-docblocken (122 → 116, kort-invarianten), `berakaListgeometri`/`gap-*`-avvisningen (nu mätt skäl: flex krymper pseudo-elementet).
F. FACIT `tasks/sessions/bilagor/s108-dokumentytan/`: ingen av de fyra bilderna visar en rullande lista (1 rad resp. eventväljaren), så ingen omtagning krävs — VERIFIERA påståendet mot bilderna och bokför utfallet i PR-kroppen; `godkand`-fältet rörs aldrig. Pixelbaslinjerna i `tests/visual/dokument-visual.spec.ts` föds i CI (CONTRIBUTING § Visuell regression) — kontrollera om någon scen visar 5+ rader och bokför.
G. BEVIS I PR-KROPPEN (Playwright mot dev-server, tal): låset 488 vid 0/1/3/4/5 rader (båda listorna); vid exakt 4 rader `scrollHeight === clientHeight`; vid 5+ rader vid max rullning `sistaKort.bottom === ul.bottom` (Marcus punkt 2); `getComputedStyle(ul,'::after').mixBlendMode === 'darken'`; PIXELPROV: i ett läge där ett korts nedre hörn ligger inuti bandet är brickans pixel utanför kortets kurva (i hörnet) och i rännan BYTE-LIKA med brickans pixel utanför bandet (samma kanalvärden) — det är det mekaniska beviset för att trekanten och listen är borta; `--skugg-op` = 1 i vila, 0.5 vid halva bandhöjden kvar, 0 vid botten. Rött-först: pixelprovet och `sistaKort.bottom === ul.bottom` ska vara RÖDA mot `main` före fixen (bevisat i PR-kroppen) och gröna efter.
KÄLLOR: `src/components/dokument/DokumentYta.tsx` (hooken ~1340–1445, `separatorBredd` 1111, `LISTA_FALLBACK_RADHOJD` 1067 + docblock 1020–1066, `DokumentListRam` 2696–2826, `<li>` 2963 och 3601, brickan 2503), `src/styles/tokens/components.css`, `src/styles/tokens/semantic.css` rad 23/46, `tests/acceptance/dokument-lista-hojdlas.acceptance.test.ts`, `tests/acceptance/dokument-lista-hojdlas-tidpunkt.acceptance.test.ts`. Historik: TASK-309.24/39/43/45/46/47.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rännan är en marginal på varje rad utom den första via komponent-token --mm-dokumentlista-ranna (components.css) som både radklassen och hooken läser; ingen rad bär border-b-8; spåret börjar vid första kortet och slutar vid sista kortet: vid 5+ rader och max rullning är sistaKort.bottom === ul.bottom, mätt i Playwright för båda listorna och RÖTT mot main före fixen
- [ ] #2 useLastaListhojd räknar kort × 4 + ränna × 3 i alla tre nivåer, separatorBredd riven, LISTA_FALLBACK_KORTHOJD = 116 med omskriven docblock; låset är exakt 488 vid 0, 1, 3, 4 och 5+ rader i båda listorna, scrollHeight === clientHeight vid exakt 4 rader; befintliga hojdlas-acceptance-sviter gröna med uppdaterat fallback-tal och nya fall för spårets slut
- [ ] #3 Skrimmen är after:from-bg-muted + after:mix-blend-darken (32 px band); pixelprov i PR-kroppen: brickans pixlar i kortets nedre hörn och i rännan under bandet är byte-lika med brickan utanför bandet (rött mot main, grönt efter); texten under bandet dämpas inte; contrast-more-varianten kvar; axe 0 på listan
- [ ] #4 Skuggan tonar ut kontinuerligt via --skugg-op (1 i vila, 0.5 vid halva bandhöjden kvar, 0 vid botten) utan React-state per rullframe; data-vid-botten och after:hidden rivna; värdet initieras när listan blir rullbar och räknas om vid ändrat radantal — bevisat i acceptance-test
- [ ] #5 Docblockarna i DokumentYta.tsx (rännan, rullningsskuggan, fallback-konstanten, gap-avvisningen) omskrivna så prosa och kod säger samma sak, med historiken bevarad och Marcus dom 2026-09-08 källmärkt; facit s108-dokumentytan kontrollerat och utfallet bokfört utan att godkand rörs; DoD-kommandona, tests/visual-grinden för dokument och check-langa-streck gröna med faktiska exitkoder
- [ ] #6 Ögonmätt av Marcus mot dev-server/staging (styrkan på 32 px-bandet och uttoningen vid botten) före Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
