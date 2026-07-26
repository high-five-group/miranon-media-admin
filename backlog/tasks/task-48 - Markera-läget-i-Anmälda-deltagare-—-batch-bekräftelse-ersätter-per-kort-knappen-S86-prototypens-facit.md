---
id: TASK-48
title: >-
  Markera-läget i Anmälda deltagare — batch-bekräftelse ersätter
  per-kort-knappen (S86-prototypens facit)
status: In Progress
assignee: []
created_date: '2026-07-25 10:51'
updated_date: '2026-07-26 12:05'
labels:
  - ready-for-agent
dependencies: []
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus omgranskning S86 (2026-07-25): solid/outline-knappen 'Skicka bekräftelse' inuti deltagarkorten dräper designen oavsett emphasis — löst med NYTT INTERAKTIONSFLÖDE i stället för färgjustering. Prototyp-pass (divergens A/B/C → **A vald**; konvergens steg 2–4; Marcus-låst 'Lås denna' 2026-07-25). Snapshots: tasks/sessions/bilagor/s86-deltagarkort-markering/ (k04-vilande + k04-markera-2-valda). Prototyp-SHA:er (branch proto/s86-deltagarkort-markering, mergas ALDRIG): 7263037 (divergens) → c8b0c01 → cf04096 → e617c8f/6f3179f (låsta steget). Research-belagt: explicit markera-läge = iOS edit-mode-/Material selection-klassen; batch-bar med live-count; GridList-primitiven för AT.

LÅSTA BYGGKRAV (facit):
1. Obekräftade-rubrikraden: 'Markera'-knapp (intent primary, sm) ERSÄTTER Bekräfta alla-pillen; i läget står 'Avbryt' (ghost, X-ikon) på samma plats. K47/K48-formen (Bekräfta alla + kontrollfråga på rubriken) RIVS ÖPPET — facit-revidering av S73/18.6.
2. Markera-läget: hela kortet är klickyta med checkbox-semantik; VALT kort: bg --mm-success-bg + kant --mm-success; Obekräftad-pillen FÖRSVINNER vid val (ingen 'Vald'-pill); kategori-pillen står kvar. Per-kort-knappen 'Skicka bekräftelse' (K46) RIVS HELT — även i vilande läge.
3. Batch-baren (i läget, ovanför kön): [Bekräfta X anmälningar — success solid, mutad vid 0, bredden LÅST på tvåsiffrig maxform via osynlig platshållare 'Bekräfta 99 anmälningar' + tabular-nums] [Markera alla — secondary, mutad när alla valda] [Rensa — ghost, vid ≥1] + sr-only aria-live med antal valda. Solid success förenlig med §19: baren är blockets primära handlingsyta.
4. Kön: max ~3 kort synliga (max-h ≈25.5rem) + inline scroll med scrollbar-inline-utilityn; klippet mitt i kort 4 är scroll-affordancen.
5. BEHÅLL skarpa kortets allt övrigt: Anmäld-radens länk + prefetch (K62/18.17), historikraden (K45), pillar/metayta — prototypens avsaknad av dem var förenkling, INTE facit. Vilande läge = befintliga kortet med sina länkar; markera-läget nås ENBART via Markera-knappen (prototypens kort-klick-öppning var förenkling).
6. Kontrollfrågan (PRD task-18 beslut 7): 'Bekräfta X' öppnar dialogen före sändning — massmutations-grinden oförändrad; bulken pessimistisk som idag.
7. A11y (11-ribban, research 2026-07-25): markera-läget byggs på RAC GridList selectionMode=multiple el. likvärdig aria-multiselectable-form; WCAG 1.4.1-bärare för valt tillstånd (diskret check-indikator/checkbox-slot) läggs till UTAN att ändra den Marcus-låsta visuella formen; Esc lämnar läget; scrollregionen tangentbordsnåbar.
8. Visual-baselines driftar avsiktligt → refresh i T87:s aktiveringssteg.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Markera-flödet levererat per de 8 låsta byggkraven med e2e + axe-0 (nya + befintliga deltagar-tester uppdaterade)
- [x] #2 K46/K47/K48-rivningarna öppet bokförda i kod-kommentarer + spec; §19-audit-raden för Greta-fallet uppdaterad
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS-BESLUT 2026-07-25 (S87) — tre punkter som avgör bygget:

1. LÄNK-FORKEN: väg A. Anmäld-radens länk och person-länken VILAR i markera-läget (iOS edit-mode-konventionen, exakt vad prototypens snapshots visar). Därmed räcker rå RAC Checkbox per BorOverRad-precedenten (Deltagare.tsx:669-672, med sin explicita rationale mot primitiv-lyft) — INGEN GridList, ingen ny primitiv-mark, ingen 11/11/11-ribba. Krav 7:s 'el. likvärdig aria-multiselectable-form' är den väg som gäller. Uppskattning: ~3-4,5 h, ETT kort.

2. ENSKILD BEKRÄFTELSE: rivningen av per-kort-knappen tar med sig useSendConfirmation (registrationConfirmation.ts:62-115) och därmed den optimistiska snabbvägen från eventsidan. Marcus-beslut: ACCEPTERAT — 1-klick-interaktionen byggs i stället på HEM-VYN. Genvägen flyttas alltså dit den hör hemma i stället för att behållas på eventsidan. Riv utan ersättare här; skriv INTE in anmälans egen sida som enkel-väg.

3. PARENT: TASK-18 (PRD Eventsidan till S73-facit) är förälder — dess § Testbeslut ska läsas i do-work steg 2. Fältet parent_task_id kan inte sättas via backlog task edit (endast vid create), därför står relationen här.

SERIALISERING: task-48 FÖRE TASK-47. TASK-47 (e2e-fixture-konsolidering) pekar explicit ut get-registrations-stubbarna, och task-48 skriver om event-bekraftelse.staging.test.ts som äger dem (7 av 9 tester, ~250 av 448 rader). Omvänd ordning skriver om TASK-47:s nyskapade helper direkt.

KROCK-VARNING: §19:s prejudikatlista ändras av denna landning — 'Skicka bekräftelse → success/outline (Greta-fallet)' och 'Bekräfta alla-pillen → success/subtle' upphör båda att existera. Varje parallellt knapp-arbete som läser §19 som gällande karta läser fel efter detta.

PROTOTYP: proto/s86-deltagarkort-markering finns ENDAST lokalt (aldrig pushad). Kortkoden kan INTE absorberas — dess MarkerbartKort gör hela kortet till en RAC Checkbox med kortinnehållet inuti, vilket är oförenligt med krav 5 (L303: interaktivt bor aldrig i interaktivt). Absorberbart är batch-barens breddlås (osynlig platshållare + tabular-nums) och scroll-klassen.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-07-26 11:07
---
REVIEW-VÅG 1 (Marcus design-review 2026-07-26, S91) — tre fynd, alla åtgärdade. TVÅ AV DEM REVIDERAR LÅSTA BYGGKRAV och bokförs därför öppet:

1. BYGGKRAV 1 — FACIT-AVVIKELSE RÄTTAD. Markera-knappen levererades som `primary`/`subtle` (ljusgrå); S86-facit visar MÖRK SOLID. Byggkravet sa 'intent primary, sm' och låste aldrig emphasis — bygget läste §19:s toolbar-rad, fann kollisionen mot det Marcus-låsta facit, löste den tyst till regelns fördel och skrev in sin lösning i §19 som nytt prejudikat. Rättat till default solid = `--mm-btn-primary-bg` #282928 (mätt: rgb(40, 41, 40) på vit text) = exakt facit. §19 amenderad med LÄGESÖPPNAR-UNDANTAGET (en knapp som försätter sektionen i ett annat läge är sektionens primära kontroll, inte ett rad-verktyg) + processnot: en skriven regel väger aldrig tyngre än en Marcus-låst form, kollisionen ska lyftas.

2. BYGGKRAV 7 — CHECK-GLYFEN RIVEN PÅ MARCUS-BESLUT. Kravet sanktionerade en 'diskret check-indikator', men mätning visar att den inte behövdes: ovalt kort har transparent kant (rgba(0,0,0,0)), valt kort får #606b57 — skillnaden är att en KONTUR UPPSTÅR (närvaro/frånvaro av visuellt element), inte ett färgbyte, så WCAG 1.4.1 håller utan glyf. Kanten mäter 5,6:1 mot vitt (1.4.11 kräver 3:1) och 3,2:1 i ren ljushet mot `--mm-border-strong` under prefers-contrast: more. Den gröna plattan mäter 1,05:1 mot vitt och bär i praktiken ingenting för den färgblinde — KANTEN är bäraren, dokumenterat i kod så den inte tonas ned senare. Glyfen var dessutom `CheckCheck` (dubbel bock = 'skickat och läst' i meddelande-konventionen), fel signal på ett kort vars poäng är att något strax SKA skickas. E2e omskrivet: vaktar nu frånvaro av glyf + transparent oval kant i stället för glyfens närvaro.

3. AVBRYT-KNAPPEN (Marcus-tillägg i samma våg). `ghost` → `primary`/`subtle`: ghost saknade bakgrund helt och läste som textlänk. Ärver nu plattan Markera lämnade (mätt i vila: #282928 @ 10 %). Emphasis-paret solid/subtle på samma plats.

Verifiering: 17/17 e2e gröna inkl. axe 0; biome 0 fel; typecheck rent. DoD #5 fortsatt öppen — Marcus granskar byggkrav 3–6 parallellt.
---

created: 2026-07-26 11:19
---
REVIEW-VÅG 2 (Marcus design-review 2026-07-26, S91) — fynd 4: Obekräftade-kön är inte längre fällbar.

Marcus: 'Obekräftade behöver ju inte ha dropdown-funktionen, den visar ju aldrig mer än 3 kort och du bör alltid markera och tömma listan, varför skulle du vilja gömma den.'

Håller. Byggkrav 4 låser kön till ~3 synliga kort med inline-scroll, så fällningen sparade ingen vertikal plats — den kunde bara dölja arbete som väntar. KÖ vs REGISTER är distinktionen (samma som L353): Obekräftade ska tömmas, Bekräftade är ett arkiv som växer mot hela deltagarlistan och behåller därför sin fällning.

ÄNDRAT: `GruppRubrik` har nu två former — utelämnas `onToggle` renderas ren rubrikrad utan knapp, chevron och aria-expanded. Obekräftade använder den; Bekräftade är oförändrad. Panelens `hidden` borttagen. `oppna`-objektet ersatt av `bekraftadeOppen` (en boolean — det fanns inget andra tillstånd kvar att lagra).

SIDOEFFEKT VÄRD ATT NOTERA: Markera-knappen hade en lapp som force-öppnade panelen (`setOppna(... obekraftade: true)`) eftersom läget annars kunde startas i en kollapsad yta. Lappen är riven — mekanismen behövs inte när ytan inte går att stänga. Fällningen bar alltså en dold kostnad utöver sig själv.

Detta reviderar S73-facits accordion-PAR (EventDetail-docblocken beskrev 'Obekräftade/Bekräftade-accordions'). Öppet bokfört.

VERIFIERING: 25/25 e2e gröna över event-deltagare + event-bekraftelse inkl. axe 0 i tre lägen; biome 0 fel; typecheck rent. Renderat kontrollerat: 0 knappar och 0 chevroner på kö-rubriken, 1 kvar på arkivet. Testerna uppdaterade — accordion-testet omskrivet till 'kön är FAST och äldst först' med en REGRESSIONSVAKT som faller om en växling återinförs på kö-rubriken.
---

created: 2026-07-26 12:05
---
REVIEW-VÅG 3 (Marcus design-review 2026-07-26, S91) — fyra fynd (a/b/c/e), PR #238. En av dem falsifierar sin egen beställning och bokförs därför öppet.

(a) KÖN TÖMS AV SERVERNS SVAR, INTE AV OMHÄMTNINGEN. Uppmätt före: 5 488 ms från kvitterad kontrollfråga till tömd kö (5 s refetch-fördröjning i mock; motsvarar Marcus ~5 s mot staging). Orsaken var inte pessimismen utan att svaret KASTADES — useConfirmAll fick redan 'confirmed[]' + 'bekraftelseSkickad' och väntade ändå på en full get-registrations. Svaret skrivs nu till listcachen i onSuccess (cancelQueries före, så en omhämtning i luften inte skriver tillbaka gammalt); onSettled-invalideringen står kvar och konvergerar i bakgrunden. Uppmätt efter: 486 ms med oförändrad fördröjning. BYGGKRAV 6 ORÖRT: patchen sker EFTER serverns bekräftelse och skriver bara de ID:n servern själv rapporterade — ett partiellt utfall flyttar exakt det som gick igenom. Skillnaden mot optimism är tidpunkten (efter svar) och källan (serverns lista).

(b) ARKIVET FÖLJER KÖN OAVSETT VÄG IN. 'bekraftadeOppen' var useState(obekraftadeTotalt === 0) — beräknat en gång vid monteringen, så samma sluttillstånd fick två utseenden: uppmätt aria-expanded=false när kön tömdes i sessionen, true vid färsk sidladdning på samma data. Nu useState<boolean | null>(null) där null betyder ALDRIG VÄXLAD och härleds live; ett explicit klick skriver en boolean som därefter vinner. Härledningen läser hela eventet (inte visade köns längd) — samma storhet som det gamla startvärdet, det som ändras är NÄR den utvärderas.

(c) EN REN FRAMGÅNG KVITTERAS. Utfalls-ytan tändes bara vid partial/failed/fel — det lyckade utfallet var flödets enda tysta väg. Nu MessageBox intent=success med serverns antal, role=status för AT (mutationens alertScreenReader kvar som garanterad bärare), stäng-knapp, och rensning vid nästa arbetssteg i blocket (Markera igen, flikbyte, filterväxling, ny batch). RESEARCH-GRUNDAT MÖNSTERVAL: GOV.UK notification banner (grön = 'confirm that something they're expecting to happen has happened', 'should be removed when the user moves to a new page') · Polaris Toast (egen a11y-not mot självförsvinnande kvitton: 'disappears automatically', svår att nå för syn-/finmotorik-begränsade) · Carbon (inline persisterar tills den avfärdas). Ingen timer alltså — GOV.UK:s 'moves on' översätts i en SPA till nästa arbetssteg.

(e) SÅGTANDEN BORT — HYPOTESEN FALSIFIERAD ÖPPET. Beställningen löd 'reservera pill-radens HÖJD'. Mätningen håller inte med: pill-kolumnen mäter 22 px (en rad) resp. 50 px (två) mot identitetskolumnens 67 px — den är ALDRIG radens högsta element och kan därför inte driva korthöjden. Bäraren är BREDDEN: max-w-[45%] lät slotten följa innehållet, identitetskolumnen (flex-1) ärvde variationen (430 px: 157,95 px med kategori-pill mot 214,33 utan) och e-posten radbröts bara i det smala fallet. Fixen reserverar slotten: w-30 (120 px >= bredaste pillen 'Från väntelistan', uppmätt 110,95) + sm:w-[45%] som bevarar facits en-rads-pillform på breda ytor (kortets innermått ~479–500 px från 640 px och upp). Uppmätt 430 px kön: 166/145/166/145 → 166 rakt igenom. 390 px arkiv: 167/188/167/188 → ingen pill-korrelation kvar (resten följer namn-/e-postlängd = innehåll). 768/1280 px oförändrat 145/167 med pillarna på EN rad.

BONUSFYND som (e)-mätningen gav gratis: samma mekanism dolde en INOM-kort-instabilitet ingen sett. När Obekräftad-pillen viker vid val krympte slotten 139,05 → 107,42 px, e-posten fick plats igen och kortet HOPPADE 166 → 145 mitt under fingret (430 px). Efter: 166 → 166 → 166 genom vilande/läge/valt — nu strukturellt i stället för av en slump. 390-px-radbrytningen är orörd; metarads-variationen står kvar (innehåll, inte layoutbrus).

VAKTER: fyra nya e2e-fall, alla RÖD-VERIFIERADE mot gamla koden — (e) Received: 21 (exakt Marcus sågtand), (b) Expected 'true' Received 'false', (a) kön ej tömd inom 3 s. (a)-vakten mäter ingen klocka: den fördröjer omhämtningen och räknar landade svar, så den faller deterministiskt om koden börjar vänta på refetchen igen.

VERIFIERING: 30/30 e2e över event-bekraftelse + event-deltagare inkl. axe 0; 62/62 i angränsande event-detail + event-bor-over; biome 0 fel; typecheck rent; build grön; markdownlint 0; vale 0 fel. Lessons L354 (mät orsaks-hypotesen innan du bygger den) + L355 (serverns svar är facit — kasta det inte). DoD #5 fortsatt öppen — Marcus granskning kvarstår.
---
<!-- COMMENTS:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren godkänd (L220)
- [x] #6 Renderad verifiering (computed-style/skärmdump) av markera-lägets valda kort + batch-barens breddlås (L245/L246)
<!-- DOD:END -->
