# ADR-025: BYGGPLAN-LÄTTLÄST v2 → v3 (revision efter byggplan-revisionen)

- **Status:** Accepted
- **Datum:** 2026-05-09
- **Fas:** Pre-Fas-2 (dokumentation)

## Kontext

`docs/specs/BYGGPLAN-LÄTTLÄST-v2.md` skrevs 2026-04-13 som lättläst version av dåvarande `docs/conversion-plan.md`. Den var korrekt vid den tidpunkten.

Mellan 2026-04-30 och 2026-05-05 körde projektet byggplan-revisionen P0–P3a (`tasks/sessions/archive/2026-05/`):

- **P0** klassade conversion-plan §D fas-för-fas
- **P1** beslutade fas-sekvensen post-A (8 beslut, 9 ADR-krav)
- **P2** synkade stödspecs (SECURITY-SPEC, STATE-STRATEGY, ACCESSIBILITY-CHECKLIST)
- **P3a** producerade `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter, ADR-011..020)

Resultatet var åtta nya/scope-ändrade faser jämfört med v2:s underlag:

- **Fas A** (säkerhetshardening, M1–M8) — retrospektivt tillagd
- **Fas 2.5** (schema-kontrakt-sync) — ny
- **Fas 3.5** (a11y-baseline egen fas, ADR-020) — ny
- **Fas 5** förenklat (4 [GA]-tillägg flyttade till Fas 7, ADR-018)
- **Fas 5.5** (vertikal write-slice) — ny
- **Fas 6** sub-fördelat 6a→6e (strangler-fig, ADR-013) — ny struktur
- **Fas 7** scope-utökat (ärver från Fas 5 + CSP-ADR + Background Sync defer-not)
- **Fas 8** (Background Sync, defer:ad från Fas 7, ADR-019) — ny
- **Fas B** (Airtable-hardening parallellspår, ADR-011) — explicit
- **Fas E** (Supabase-migration, DEFER) — explicit

v2 saknar alla dessa. Den beskriver med andra ord en byggplan som inte längre styr — direkt drift mellan styrande dokument (`docs/byggplan.md`) och dess lättläst-version (`v2`).

UNIVERSAL-lärdomen från 2026-04-07 ("Skriv en lättläst version av tekniska planer ... TILL personen, inte OM personen") är hård regel. v1 bröt mot den (skriven om Lotta i tredje person); v2 åtgärdade (du-form). v3 ärver v2:s du-form och utökar med "levande dokument"-disclaimer + "Senast uppdaterad"-stämpel + status-rad i header — så att rollen som löpande-uppdaterad förståelse-källa är glasklar framåt.

## Beslut

Skriv `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` som ersätter v2. Arkivera v2 till `docs/archive/BYGGPLAN-LÄTTLÄST-v2-2026-04-13.md` med ARKIVERAD-header som pekar till v3 (samma mönster som ADR-021 använde för v1→v2-skiftet).

### Strukturella val i v3

- **Filnamn:** `BYGGPLAN-LÄTTLÄST-v3.md` (egen fil, inte intern v2-bumpning). Matchar v1→v2-mönstret som etablerades i ADR-021.
- **Ton:** Du-form genomgående, samma som v2.
- **Header:** "Levande dokument" + "Senast uppdaterad" + "Status just nu" + föregångare-länkar till v2/v1.
- **Struktur omorganiserad:** "Det här är redan klart" / "Det här bygger vi nu" / "Det här bygger vi sedan" / "Parallellspår" / "Senare" — speglar att Fas 0/1/A är klara och att läsaren ska orientera sig efter status snarare än fas-kronologi.
- **Fas A retrospektivt förklarad** — varför den dök upp, vad de åtta säkerhetsluckorna var, varför vi tätade dem.
- **Fas 6 sub-fördelad i 6a–6e** med strangler-fig-metaforen översatt till "strypfikus — bygg nytt parallellt, låt det gradvis ta över".
- **Fas 5-förenklingen förklarad i klartext** — varför fyra polish-funktioner flyttades till Fas 7. ADR-018 refereras.
- **Fas B + Fas E utbrutna i egna kapitel** — Fas B är Roger/Lotta-arbete och förtjänar egen avgränsning, Fas E är så pass avlägsen att den får DEFER-stämpel.
- **Versionshistorik** sista sektionen — v1 → v2 → v3 med datum + ändringar.

## Alternativ som övervägdes

**Alt 1 — Bumpa v2:s interna versionsnummer (skriv om in-place, behåll filnamnet `BYGGPLAN-LÄTTLÄST-v2.md`).** Avvisat: detta är en ny generation drivet av byggplan-revisionen, inte en mindre revision av v2. Att blanda in 8 nya/scope-ändrade faser i v2:s gamla struktur hade blivit halv-jobb och git-historiken skulle bli svår att läsa.

**Alt 2 — Skriv om in-place utan versions-bump alls.** Avvisat: ingen tydlig brytpunkt för framtida läsare, ingen historisk referens till v2:s formulering, bryter mot ADR-021:s etablerade arkivmönster.

**Alt 3 — Behåll både v2 och v3 aktiva parallellt med olika scope.** Avvisat: drift mellan dokument är värsta scenariot. Pre-Fas-2 K3 åe (ADR-021) etablerade exakt motsatsen — superseded versioner arkiveras med ARKIVERAD-header.

**Alt 4 — Ingen lättläst-version alls, byggplan.md räcker.** Avvisat: byggplan.md är skriven för Claude Chat och Code (832 rader, 13 fas-prompter, ADR-referenser, fas-tabeller). UNIVERSAL-lärdomen från 2026-04-07 är explicit om att icke-tekniska intressenter behöver en egen pedagogisk version. Roger och Lotta är primärläsare för v3.

## Konsekvenser

**Positiva:**
- Tydlig brytpunkt mellan v2-eran och v3-eran. Git-historik bevarad via separata filer.
- v2 bevarad som referens i `docs/archive/`. Kedjan v1 → v2 → v3 spårbar.
- v3 är "current truth" för icke-teknisk plan-förståelse. byggplan.md fortsätter vara styrande för det tekniska bygget.
- "Levande dokument"-disclaimer + "Senast uppdaterad"-stämpel etablerar förväntan att v3 uppdateras vid sessionsavslut för varje ny fas. Inget behov av v4 vid varje justering.

**Negativa:**
- En ny ADR-rad i katalogen (ADR-025).
- Refs till v2 måste uppdateras i: CLAUDE.md filstruktur, README.md Documentation map, v1-arkivfilens "Använd v2"-rad. Hanteras i samma session som ADR-025 (Commit 3).
- v3 introducerar förpliktelse: dokumentet ska uppdateras vid sessionsavslut för varje ny fas. Annars driver det ifrån byggplan.md igen.

**Mitigation för förpliktelsen:**
CLAUDE.md "Sessionsavslut"-checklistan utökas (i en framtida session, inte denna) med: "Uppdatera `docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` om fasen har implications för icke-tekniska läsare (Roger/Lotta)." Det är *inte* del av denna ADR — det är en separat process-fråga som hanteras i Pre-Fas-2-uppföljning eller vid Fas 2-sessionsstart.

## Referenser

- `docs/decisions/ADR-021-docs-omstrukturering.md` (mönster för v1→v2-skiftet)
- `docs/byggplan.md` (slutprodukt från P3a som v3 speglar)
- `tasks/sessions/archive/2026-05/2026-05-04-byggplan-revision-p1.md` (P1-besluten som v3 inkorporerar)
- `tasks/sessions/archive/2026-05/2026-05-05-byggplan-skriv-p3a.md` (P3a-leveransen)
- `tasks/lessons.md` 2026-04-07-sektionen (UNIVERSAL "Skriv lättläst version TILL personen")
- `tasks/lessons.md` 2026-05-06-sektionen (UNIVERSAL "Senior AI tar tekniska beslut")
