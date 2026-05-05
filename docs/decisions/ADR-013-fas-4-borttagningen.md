# ADR-013: Fas 4 borttagen — DataTable-komponent flyttad till Fas 7

- **Status:** Accepted
- **Datum:** 2026-05-05
- **Fas:** Meta (P3a)

## Kontext

Conversion-plan §D listade en Fas 4 dedikerad till DataTable-komponent (för admin-vyer som kräver tabellrendering med sortering, filtrering, paginering). Ramen var: bygg DataTable som återanvändbar bibliotekskomponent innan Fas 5 + Fas 6 kan rendera datalistor.

Vid förbygges-research (Session 0, pre-Fas 0) framkom att:

1. **Inga av Fas 5/6-vyerna kräver DataTable-komponent som primär datapresentation.** Mobil-först-designen för Lottas operativa flöden använder kort, listor med tap-targets, och filter via `nuqs` — inte tabeller. Even Hem-fliken med "nya anmälningar" är scenario-driven kortvy, inte tabell.

2. **Event-detaljvyns Anmälda-flik är enda möjliga DataTable-användning** — och även där är listan med "Markera som betald"-knappar primär. Tabell skulle vara desktop-funktion för power-användning, inte mobil-MVP.

3. **TanStack Table är redan installerat** (paket `@tanstack/react-table@8.21.3` per Fas 0-deps i BUILD-LOG). När/om DataTable behövs är beroendet redo — komponenten själv är den enda saknade biten.

P0-inventory (2026-05-04) klassade Fas 4 som "försvinner" i fas-tabellen. Direktivet §12 formulerade numreringsnoten: "Det 'saknas' en Fas 4 i sekvensen — DataTable flyttad till Fas 7. Numreringen behålls för spårbarhet mot conversion-plan och tidiga BUILD-LOG-poster."

## Beslut

**Fas 4 tas bort som egen fas i `byggplan.md`.** DataTable-komponent flyttas till Fas 7 (Konsolidering) som villkorligt scope-bullet: "DataTable-komponent (om event-detalj behöver det; annars eliminera)". Fas 6 går direkt efter Fas 5.5 utan mellanliggande Fas 4.

**Numreringen 0/1/2/2.5/3/3.5/5/5.5/6/6.5/7/8 behålls** — Fas 4 saknas medvetet. Skälet: BUILD-LOG.md Fas 0-sektion + Fas 1-sektion + dependencies-listan refererar conversion-plan-numrering. Att renumera 5→4, 6→5 etc. hade brutit spårbarhet bakåt utan vinst framåt.

## Alternativ som övervägdes

**Alt 1 — Behåll Fas 4 som planerad.** Avvisat: ingen vy i Fas 5/6 kräver DataTable. Att bygga den i förskott är samma anti-mönster som M4-principen ("operations utan empirisk användning är onödig attack-yta") — komponent utan empirisk användning är onödig kodbasyta + underhållskostnad.

**Alt 2 — Renumera fas-listan 0/1/2/2.5/3/3.5/4/4.5/5/5.5/6/7.** Avvisat: bryter BUILD-LOG-spårbarhet. Fas 0 + Fas 1 har redan committade BUILD-LOG-sektioner som refererar nummer. Renumrering hade kostat 2-3 timmars dokumentationsarbete utan funktionell vinst.

**Alt 3 — Behåll Fas 4 som "om-behov-fas" (villkorlig).** Avvisat: villkorliga faser i fas-tabellen försvårar planering (estimat-summa kan inte beräknas). Bättre att flytta scope till Fas 7 där det redan är "konsolidering + cleanup".

## Konsekvenser

**Positiva:**
- Total estimat krymper: 16,5 sessioner istället för 16,5 + 1 (DataTable-fas).
- Ingen kod byggs utan empirisk användning — följer M4-principen.
- BUILD-LOG-spårbarhet bevaras (Fas 0/1-referenser intakta).
- Fas 7 har scope-flexibilitet: om event-detalj klarar sig utan DataTable elimineras komponenten helt, om den behövs byggs den i deploy-kontext.

**Negativa:**
- Numreringssprånget 3.5 → 5 är initialt förvirrande för nya läsare. Mitigation: byggplan.md numreringsnot förklarar explicit + denna ADR refereras därifrån.
- Om Mm Component Library ska levereras som återanvändbart paket post-Fas 7 (för Passionslyftet), kan DataTable behövas oavsett event-detalj-behov. Mitigation: Fas 7 scope-bullet skiljer "om event-detalj behöver det" från "annars eliminera" — Mm Library-behovet kan återaktivera scope vid behov, dokumenteras då med ny ADR.

**Verifiering:** `docs/byggplan.md` §2 fas-tabell har 15 rader, ingen Fas 4. Numreringsnoten under tabellen refererar denna ADR explicit. Fas 7 scope-listan inkluderar "DataTable-komponent (om event-detalj behöver det; annars eliminera)".
