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

Alla beslut Marcus-kvitterade utom F som är PRELIMINÄR (se Öppna
frågor).

- **A — Scope:** enbart Mer-landningssidan (`/mer`); undersidorna är
  egna facit-kandidater senare (IMG_1539/1542 som förlagor). Öppet
  reviderad av B2: + EN minimal Mina sidor-v1-undersida.
- **B — Raduppsättning:** dagens sex rader (Anmälningar, Väntelista,
  Intresserade, Maillogg, Bygg segment, Skapa nytt event) + **Mina
  sidor överst** (FK-positionen). Inställningar ligger KVAR i T47 —
  inte återöppnad. Hemvist-beslut som bokförs i PRD:n: Mer-raden är
  KANONISK ingång till Mina sidor; Hem-facitets Mina sidor-knapp
  (task-4 beslut 4) är genväg till samma mål.
- **B2 — Mina sidor-raden är äkta från dag 1:** klick leder till
  `/mer/mina-sidor` v1 som visar inloggat namn + e-post ur befintlig
  auth-state som key-value-rader (IMG_1542-mönstret i enklaste form).
  Ingen ny EF, ingen datafråga. Stub-sida (a) och död platshållar-rad
  (c) avvisades: raden får inte ljuga.
- **C — Gruppering:** luft, inga sektionsrubriker (FK:s eget mönster på
  just Mer-landningen). Tre grupper: [Mina sidor] · [Anmälningar,
  Väntelista, Intresserade, Maillogg] · [Skapa nytt event, Bygg
  segment]. Handling före verktyg i sista gruppen. A11y: en `nav`, en
  lista per grupp. Rubriker införs först när listan växer (T47 med
  flera) — additivt, inget rivs.
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
  avgörande.
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
   beslut med kvittens (evidens slår lås), aldrig tyst.
2. **Badge-frågan** — utskuren till **T68** (antal på t.ex.
   Anmälningar/Väntelista-raderna, IMG_1539-mönstret): datafråga + eget
   designbeslut, inte ett komponent-API-tillägg i smyg.
3. **Mina sidor-hemvisten** — beslutad här (B), men SKRIVS EXPLICIT i
   PRD:n så task-4-serien och Mer-arbetet inte driver isär.

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
