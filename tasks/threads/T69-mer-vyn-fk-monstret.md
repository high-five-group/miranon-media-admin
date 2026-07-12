---
owner: marcus803
updated: 2026-07-12
review_by: 2026-10-07
status: stable
lifecycle: active
---

# T69 — Mer-vyn till FK-mönstret (grillad struktur-samsyn)

> Tråd-kort (ADR-053). Fött ur en grillning (`/grill-me`) i Code-chatt
> 2026-07-07, körd PARALLELLT med aktiva S56/S57 (utanför numrerad
> session) — samsynen landas därför direkt i fil per
> kontinuitets-arkitekturen (chat-trail är efemär). Referensbild:
> `docs/reference/fk-referens/IMG_1541.PNG` ("Mer: menyrader som kort +
> utloggning"). PRD-kortet föds i Mer-sessionen EFTER låst facit
> (T65-precedenten: beslutsbehov före byggbar spec → tråd, kort när
> designen är låst).

- **Tråd-ID:** `T69-mer-vyn-fk-monstret`
- **Tillstånd:** se frontmatter `lifecycle`
- **Sessioner:** född utanför session (Code-chatt 2026-07-07, parallell
  med S56/S57); tas upp som EGEN session efter S56 + S57 (Marcus-ord:
  "nästa grej efter session 56 och 57"). **UPPTAGEN som S64**
  (2026-07-12, Marcus-vägval vid S63-avslut, kvitterat vid
  S64-starten): kedjan samsyn A–H → öppna frågor (F preliminär) →
  /to-prd → /to-issues; skivorna är därefter pipeline B-kandidater i
  T76-piloten (partitionen task-8-skivorna ∥ T69-skivorna —
  kollisionsytorna bokförda i T76-kortet).
- **Styrande:** denna samsyn (A–H nedan); T66-processen (stående
  prototyp-arbetsform); ORDLISTA.md ("Mina sidor", kanoniserad i samma
  landning); T68 (badge-frågan, utskuren härifrån)
- **Commit-historik:** `git log --grep "\[T69\]"`

## Grillad samsyn 2026-07-07 (besluten A–H)

Alla beslut Marcus-kvitterade utom F som var PRELIMINÄR. **REVISION
S64 2026-07-12** (chat-samsyn 1–5, Marcus-kvittens "Yes. Kvitterar!"):
B/B2 RIVNA öppet, C reviderad, F AVGJORD — se § Revision S64 nedan.
Ursprungstexten står kvar verbatim med in-place-noter (historik rivs
aldrig tyst).

- **A — Scope:** enbart Mer-landningssidan (`/mer`); undersidorna är
  egna facit-kandidater senare (IMG_1539/1542 som förlagor). Öppet
  reviderad av B2: + EN minimal Mina sidor-v1-undersida. *(REVIDERAD
  S64: B2-tillägget utgår med B2-rivningen; i stället + borttagning av
  Hem:s "Mina sidor"-platshållare — se Revision S64 punkt 3.)*
- **B — Raduppsättning:** dagens sex rader (Anmälningar, Väntelista,
  Intresserade, Maillogg, Bygg segment, Skapa nytt event) + **Mina
  sidor överst** (FK-positionen). Inställningar ligger KVAR i T47 —
  inte återöppnad. Hemvist-beslut som bokförs i PRD:n: Mer-raden är
  KANONISK ingång till Mina sidor; Hem-facitets Mina sidor-knapp
  (task-4 beslut 4) är genväg till samma mål. *(RIVET S64: ingen Mina
  sidor-rad — termen är ingen destination. Raduppsättningen = dagens
  sex rader, punkt. Inställningar KVAR i T47 står.)*
- **B2 — Mina sidor-raden är äkta från dag 1:** klick leder till
  `/mer/mina-sidor` v1 som visar inloggat namn + e-post ur befintlig
  auth-state som key-value-rader (IMG_1542-mönstret i enklaste form).
  Ingen ny EF, ingen datafråga. Stub-sida (a) och död platshållar-rad
  (c) avvisades: raden får inte ljuga. *(RIVET S64: sidan byggs inte —
  se Revision S64 punkt 2. "Raden får inte ljuga"-principen ÖVERLEVER
  rivningen och styr även notis-klockan, T77.)*
- **C — Gruppering:** luft, inga sektionsrubriker (FK:s eget mönster på
  just Mer-landningen). Tre grupper: [Mina sidor] · [Anmälningar,
  Väntelista, Intresserade, Maillogg] · [Skapa nytt event, Bygg
  segment]. Handling före verktyg i sista gruppen. A11y: en `nav`, en
  lista per grupp. Rubriker införs först när listan växer (T47 med
  flera) — additivt, inget rivs. *(REVIDERAD S64: TVÅ grupper —
  [Anmälningar, Väntelista, Intresserade, Maillogg] · [Skapa nytt
  event, Bygg segment]. Övrigt står: luft, en `nav`, en lista per
  grupp, handling före verktyg.)*
- **D — Radkomponenten `NavCard`:** bibliotekskod 11/11/11 i
  `src/components/primitives/`. API medvetet minimalt: `{ to, icon,
  label }`; `to` typad mot routerns routes (TabBar-mönstret); chevron
  inbyggd och alltid med (navigationslöftet); ikon `aria-hidden`,
  etiketten bär länknamnet; hel radyta klickbar, ≥44 px, focus-visible,
  contrast-more + reduced-motion per kvalitetsribban. INTE i API:t
  (över-engineering-vakten, kan växa additivt): knapp-variant,
  badge (→ **T68**), beskrivningsrad, `disabled`.
- **E — Logga ut:** förblir HANDLING — Button (`ghost`-intent finns
  redan) utanför nav-landmärket, aldrig en NavCard-rad. Ingen
  bekräftelsedialog (Fas 6e L2 står, ingen ny evidens). Form: centrerad
  under radgrupperna, lucide `LogOut` + text — exakt form ägs av
  facit-rundan.
- **F — Sidskelett (PRELIMINÄR):** Hem-skelettet kvitterat: centrerad
  600 px-kolumn, `hideShellHeader` på (mekaniken finns sedan task-4.2).
  RUBRIK-FRÅGAN ÖPPEN — se Öppna frågor 1; kandidatlösningen från
  grillningen (ingen synlig rubrik + `sr-only`-h1 "Mer") är INTE låst.
  Bokföring oavsett utfall: per-vy-header-valet är INPUT till
  shell-spåret (klass C, todo-restlistan + task-4 beslut 2), inte dess
  avgörande. *(AVGJORD S64 — Revision S64 punkt 1: Mer får SYNLIG
  "Mer"-rubrik som h1; sr-only-kandidaten AVVISAD av research-passet.
  Skelettet i övrigt står. INPUT-bokföringen till shell-spåret står.)*
- **G — Metod:** T66-KONVERGENS-PASS ENBART, med öppet bokfört
  divergens-överhopp (riktningen redan vald: FK-referens + denna
  grillade struktur — tre varianter vore divergens-teater; scopead
  instansiering av T66-formen, ej tyst avvikelse). Prototypen startar
  som EXAKT kopia av dagens Mer-vy; facit låses per K10-praxis
  (skärmdumps-bilagor + återupplivnings-hash i sessionsdoket);
  throwaway-kontraktet gäller; leveransen skrivs NYSKRIVEN genom
  leverans-grindarna.
- **H — Sekvens:** egen session efter S56 + S57. Kedjan i den
  sessionen: rubrik-grillningen (Öppna frågor 1) → konvergens-pass →
  facit låst → `/to-prd` (ETT PRD som bär struktur + facit — medveten
  förbättring mot Hem-resans två PRD:er) → `/to-issues` → `/do-work`.
  Beroende: task-4.2 landad (Hem-skelettmönstret lånas; i arbete nu).

## Revision S64 2026-07-12 — chat-samsyn 1–5 (rubrikpolicyn + Hem-identiteten)

Sekvensen (sessionsdok S64 Del 2 = kanonisk narrativ plats):
research-passet (5 källklasser med citat-krav: FK-referensens alla åtta
skärmar + Apple HIG + Material 3 + GOV.UK-klassen [GOV.UK DS/HMRC/NHS/
DWP/Home Office/ICDS + GOV.UK-appens källkod] + WCAG/SPA-konsensus
[W3C/TPGi/Deque/Vispero/Gatsby-användartestet]) → FK
login-flödesserien fotad + committad (`fk-login` → `fk-om-appen`,
README-tabellen) → **Marcus-realiseringen: HELA FK-appen ÄR "Mina
sidor"** (appens motsvarighet till webbens Mina sidor; allt bakom
inloggningen är personlig yta) → beslutslista kvitterad ("Yes.
Kvitterar!"). Formen: scopead avvikelse från /grill-me-ceremonin öppet
bokförd — Marcus drev designen direkt i chatt och kvitterade
beslutslistan (samma beslutskvalitet, GRILLNING-normens samsyn nådd).

Kvitterade beslut:

1. **Rubrikpolicyn (app-övergripande):** synlig `h1` = vyns namn på
   ALLA vyer — UTOM Hem, där hälsningen är h1:an (Hem-K10 "ingen
   topprubrik" står ORÖRD). Research-konvergens: FK har stor titel på
   alla tab-rötter utom Hem; Apple large-title-mönstret + redundans-
   undantaget; GOV.UK-appens Home saknar texttitel medan Settings har
   large title; WCAG kräver inte h1 (Level A = dynamisk
   `document.title`, uppfylld via RouteAnnouncer) men synlig
   fokuserbar h1 är evidens-idealmönstret; appens alla vyer utom Hem
   bär redan mönstret. INPUT till shell-spåret bokförd (F-noten).
2. **B/B2 RIVNA:** ingen Mina sidor-rad på Mer, ingen
   `/mer/mina-sidor`-v1. B2-innehållet (namn + e-post ur auth-state)
   DEFERERAT till T47 (Inställningar-ytan, "konto-uppgifter"-klassen).
3. **task-4 beslut 4 RIVET:** Hem:s "Mina sidor"-platshållare
   (visuell, klass D — `src/components/hem/Hem.tsx`) tas BORT;
   ändringen levereras via T69-PRD:ns skivning (scope-tillägget i A).
   Platsen bredvid hälsningen reserveras konceptuellt för
   notis-klockan (T77) — ingen död ikon dessförinnan.
4. **T77 registrerad:** notis-centret (ringklockan på Hem,
   FK-mönstret IMG_1538) — egen tråd; byggs när notis-substratet
   designas.
5. **ORDLISTA omskriven** (obuntad landning `1a9e929`): "Mina sidor" =
   hela den inloggade appen, aldrig en destination.

## Öppna frågor

1. **Rubrik-frågan (F) — EGEN GRILLNING FÖRE konvergens-passet.**
   Marcus-ryttare vid H-kvittensen: osäker på om varje sida ska äga sin
   synliga rubrik; kanske ska "Mer"-rubriken finnas ändå (FK:s Mer HAR
   stor titel — IMG_1541). Beslutet är app-övergripande (rubrikpolicy
   över alla flikar, shell-spårs-terräng) och ska hålla
   branschledarnivå + FK-standard. Grillningen ska vara
   RESEARCH-GRUNDAD per web-research-disciplinen (3+
   branschledar-precedent): FK-referensens mönster över ALLA åtta
   skärmar, GOV.UK/motsvarande designsystem, Apple HIG/Material om
   sidtitlar vid tabbnavigation, WCAG (2.4.6 rubriker/etiketter, h1-
   och fokus-mönstret vid SPA-navigation). OBS: utfallet "synlig rubrik
   på varje sida" KOLLIDERAR med Hem-K10:s låsta "ingen topprubrik"
   (task-4 beslut 2) — i så fall hanteras det som ÖPPEN rivning av låst
   beslut med kvittens (evidens slår lås), aldrig tyst. *(BESVARAD S64
   — Revision S64 punkt 1: research-passet kört exakt enligt receptet;
   utfallet "synlig h1 på alla vyer UTOM Hem" kolliderar INTE med
   Hem-K10 — FK, Apple och GOV.UK-appen sanktionerar alla en titel-fri
   hemyta där innehållet bär rubrikrollen.)*
2. **Badge-frågan** — utskuren till **T68** (antal på t.ex.
   Anmälningar/Väntelista-raderna, IMG_1539-mönstret): datafråga + eget
   designbeslut, inte ett komponent-API-tillägg i smyg.
3. **Mina sidor-hemvisten** — beslutad här (B), men SKRIVS EXPLICIT i
   PRD:n så task-4-serien och Mer-arbetet inte driver isär. *(UPPLÖST
   S64: termen är ingen destination (ORDLISTA `1a9e929`) — ingen
   hemvist existerar; B2-innehållet defererat till T47.)*

## Status och nästa steg

- Landat i denna landning: ORDLISTA-posten "Mina sidor" (kanoniserad
  term, *Undvik:* Mina uppgifter/profil/konto) + T68-registreringen +
  detta kort. Pathspec-committat per parallell-praxisen (pilot-empiri
  #3), taggat `[T68] [T69]`.
- Upptag: Marcus initierar Mer-sessionen när S56 + S57 stängt →
  `lifecycle: active` + kedjan i H.
- **UPPTAGEN 2026-07-12 som Session 64** (sessionsdok
  `tasks/sessions/2026-07-12-session-64.md` Del 1 = kanonisk
  scope-plats): `lifecycle: active`; kedjan börjar med
  rubrik-grillningen (Öppna frågor 1). Beroendet i H uppfyllt —
  task-4.2 (Hem-skelettmönstret) är Done.
- **REVISION S64 LANDAD** (2026-07-12): rubrik-frågan BESVARAD +
  Hem-identiteten avgjord som chat-samsyn 1–5 (se § Revision S64).
  Facit-läget inför konvergens-passet: `/mer` = synlig "Mer"-h1 +
  sex rader i två luft-grupper + Logga ut (E står orörd) + NavCard
  per D. **NÄSTA: konvergens-passet (G) → facit låst → /to-prd →
  /to-issues.**
