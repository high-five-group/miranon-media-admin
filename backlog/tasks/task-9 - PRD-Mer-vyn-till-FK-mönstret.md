---
id: TASK-9
title: 'PRD: Mer-vyn till FK-mönstret'
status: To Do
assignee: []
created_date: '2026-07-12 10:11'
labels: []
dependencies: []
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
### Problemformulering

Mer-fliken är idag ett ostajlat skal: understrukna textlänkar i en enda lista, dubbel sidmarginal, ingen visuell koppling till appens FK-formspråk (Hem och tabbaren är redan uppgraderade). Lotta möter en yta som känns halvfärdig, där listor och handlingar blandas utan hierarki, och där en "Mina sidor"-platshållare på Hem pekar mot något som inte finns.

### Lösning

Mer-landningen byggs om till M6-facitet (låst i konvergens-pass, sessionsdok S64 Del 3 + bilagor s64-mer-konvergens): synlig "Mer"-rubrik, sex kort-rader med ikon i två luftgrupper (listor · handlingar), centrerad Logga ut med ikon — buret av en ny återanvändbar NavCard-primitiv (11/11/11). Hem:s döda "Mina sidor"-platshållare tas bort. Prod-vyn ska rendera EXAKT facitet.

### Användarberättelser

1. Som Lotta vill jag att Mer-fliken visar en tydlig "Mer"-rubrik, så att jag alltid vet var i appen jag är.
2. Som Lotta vill jag se listorna (Anmälningar, Väntelista, Intresserade, Maillogg) samlade i en egen grupp överst, så att jag når mina arbetsytor direkt.
3. Som Lotta vill jag ha handlingarna (Skapa nytt event, Bygg segment) i en egen grupp under listorna, så att skapande och verktyg inte blandas med läsytorna.
4. Som Lotta vill jag att varje rad är ett stort klickbart kort med igenkännbar ikon, så att jag snabbt träffar rätt även på mobilen med tummen.
5. Som Lotta vill jag att radikonerna talar samma visuella språk som menybaren (samma storlek och familj), så att appen känns som EN helhet.
6. Som Lotta vill jag att raderna är rena ytor utan pilar och utan hover-effekter som ändrar bakgrunden, så att menyn känns lugn (mindre är renare).
7. Som Lotta vill jag logga ut via en tydlig, centrerad knapp under menyn, så att jag avslutar säkert utan att blanda ihop den med navigationen.
8. Som tangentbordsanvändare vill jag nå varje rad med Tab och se en tydlig fokusring, så att jag kan navigera helt utan mus.
9. Som skärmläsaranvändare vill jag att varje rad bär sitt namn i länken med ikonen tyst, så att uppläsningen är ren och begriplig.
10. Som skärmläsaranvändare vill jag att Logga ut är en knapp UTANFÖR navigationslandmärket, så att handling och navigation aldrig blandas.
11. Som Lotta med nedsatt syn vill jag att korten får synliga kantlinjer i hög-kontrast-läge, så att jag ser var ytorna börjar och slutar.
12. Som Lotta vill jag att sidan har sin slutliga form från första bildrutan (statisk vy, inget som hoppar), så att den känns pålitlig.
13. Som Lotta vill jag att Hem inte längre visar en "Mina sidor"-platshållare som inte leder någonstans, så att inget i appen ljuger om vad som går att klicka.
14. Som bibliotekskonsument (nästa produkt) vill jag ha en NavCard-primitiv med minimalt API, så att navigationsrader kan återanvändas utan ändringar.

### Implementationsbeslut

1. Rubrikpolicyn (T69 Revision S64 p1): synlig h1 = vyns namn; Mer får "Mer"-h1 i appens h1-skala (30/600, samma som Hem-hälsningen); shell-headern av för vyn (per-vy-mekanismen; INPUT till shell-spåret bokförd).
2. Struktur: ETT nav-landmärke "Mer-sidor" med TVÅ listor — [Anmälningar, Väntelista, Intresserade, Maillogg] · [Skapa nytt event, Bygg segment]; luft utan sektionsrubriker (C-reviderad, två grupper); handling före verktyg i grupp 2.
3. NavCard-primitiven (bibliotekskod 11/11/11): API { to, icon, label } — to typad mot routern (TabBar-mönstret); ikon dekorativ (aria-hidden) 20 px i sekundärfärgen (M3-listmönstret: ledande ikon ett steg tystare än etiketten — research-belagt); etiketten bär länknamnet, 16/600; hela radytan klickbar, ≥44 px träffyta; INGEN chevron (D-reviderad — app-bred regel: navigationsrader bär inte chevron; dropdown-indikatorer är annan mönsterklass och berörs inte); INGEN hover-bakgrundsändring (prövad och förkastad i konvergens-passet); tonal kortyta med rundade hörn; kantlinje i hög-kontrast-läge; reduced-motion/print per kvalitetsribban. INTE i API:t (över-engineering-vakten, växer additivt): badge (T68), beskrivningsrad, disabled, knapp-variant.
4. Måtten (M6-facitet, computed-låsta): sidmarginal = skalets 16 px (vyn har INGEN egen sidopadding — dubbelkants-fyndet); radhöjd ca 58 px; 10 px radgap inom grupp; 32 px vertikal rytm (rubrik→nav→mellan grupper→Logga ut-blocket med extra topp-luft); topp-luft i Hem-paritet.
5. Ikonvalen (domänbegrepps-mappade, Marcus-kvitterade): Anmälningar urklippslista · Väntelista timglas · Intresserade stjärna · Maillogg kuvert · Skapa nytt event kalender-plus · Bygg segment FILTER (löser ikon-krocken: personer-ikonen är Personer-flikens).
6. Logga ut: Button ghost-intent + utloggnings-ikon 20 px + text, centrerad under grupperna, UTANFÖR nav-landmärket; vikt = Button-primitivens standard (FK:s fetstil medvetet avviken — systemkonsekvens); ingen bekräftelsedialog (Fas 6e-beslutet står); befintlig logout-kedja orörd.
7. Hem-platshållaren "Mina sidor" tas BORT (Revision S64 p3 — kvitterad rivning av task-4 beslut 4; öppen K10-facit-avvikelse bokförs); platsen är konceptuellt reserverad för notis-klockan (T77) — ingen ersättare byggs nu.
8. Medvetna FK-avvikelser (låsta i facit): radhöjd 58 vs FK ~51 · rubrikgap 32 vs FK ~38 (4 px-rytmen) · h1 30/600 vs iOS large-title 34/700 (appens typskala) · Logga ut-vikten.
9. Mer-vyn förblir statisk (ingen datahämtning, ingen EF) — lager-golvet trivialt uppfyllt.
10. Facit-källan är kanonisk: M6 i sessionsdok S64 Del 3 (spec + byggkravslista) + skärmdumps-bilagorna; återupplivningsvägen bokförd där.

### Testbeslut

Testa externt beteende, inte implementationsdetaljer: roller/namn/struktur (nav-landmärket, länknamnen, h1-nivån, knappen utanför nav) + computed-mått där facitet kräver exakthet (radhöjd, gap, ikon-paritet — M6-passets assertionsmetod är förebilden). Skarvar (Marcus-kvitterade, INGA nya): (1) primitiv-axe-runnern — NavCard får demo-sektion på primitiv-routen och täcks av befintliga 0-toleransen; (2) Mer-e2e/axe-sviten — befintligt kontrakt består (nav-namnet, Logga ut utanför nav, ingen Inställningar, axe 0, logout-flödet) och utökas med facit-assertioner (synlig h1, header-frånvaro, tvågruppsstrukturen, ingen chevron). Hem-svitens platshållar-assertioner synkas med borttagningen. Förebilder: TabBar-testens ikon-aria-hidden-mönster + mer-index-svitens logout/axe-form.

### Utanför omfattningen

Mer-undersidorna (egna facit-kandidater senare; FK-referensens list- och uppgiftssidor som förlagor) · T68 badges · T77 notis-klockan (platsen reserverad, inget byggs) · T47 Inställningar · shell-spårets app-breda header-beslut (detta är endast INPUT) · undersidornas eventuella dubbelmarginal (granskningspunkt vid deras rundor) · all datalager-förändring (statisk vy).

### Estimat

4 skivor: NavCard-primitiven + demo + spec [M] · Mer-vyn till facit + e2e/axe [M] · Hem-platshållar-borttagningen [S] · QA-planen [S, ready-for-human].

### ADR-koppling

ADR-044 (react-aria-components som primitiv-bas — NavCard byggs på länk-komponenten därifrån) · ADR-045 (a11y-runnern: demo-route + 0-tolerans är skarv 1) · ADR-057 (lager-golvet — trivialt: statisk vy) · ADR-071 (AFK-batch-kontraktet: UI-skivor levereras granskningsfärdiga, design-review-DoD öppen för Marcus). Inga nya ADR:er — rubrikpolicyn och revisionerna ligger under ADR-baren och är bokförda i T69-kortet + sessionsdok S64 Del 2–3.

### Ytterligare anteckningar

Kedjan: T69 (tråd) → grillad samsyn A–H → Revision S64 (chat-samsyn 1–5) → konvergens-pass M1→M6 → detta PRD — ETT PRD bär struktur + facit (H-beslutets medvetna förbättring mot Hem-resans två PRD:er). Skivorna är pipeline B-kandidater i T76-piloten; kollisionsyta mot task-8.2 noterad: båda kan röra design-system-specen (NavCard- resp. Skeleton-sektion) — partitioneras per T76-kortets bokförda ytor. M3-varianten (transparent + hover) är PRÖVAD OCH FÖRKASTAD — återinförs inte utan nytt facit-beslut.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review mot M6-facitet godkänd av Marcus (granskningsfärdigt läge per ADR-071 för UI-skivor)
- [ ] #6 Facit-paritet: renderad vy computed-verifierad mot M6-måtten (sessionsdok S64 Del 3)
<!-- DOD:END -->
