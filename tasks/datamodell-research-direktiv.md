# Datamodell-research-projekt — direktiv

> **Status:** SLUTFÖRT — 2026-04-30. Skapad 2026-04-28 efter avslut
> av datamodell-110-projektet.

## Vad detta är

Forwards-look-projekt som följer på datamodell-110 (avslutat
2026-04-28, dokumenterat i `tasks/sessions/2026-04-28-datamodell-110-projekt.md`).

Datamodell-110 lyfte dokumentationen av nuvarande Airtable-
modell till 11/10. Det här projektet utgår därifrån och
frågar: **är modellen i sig 11/10, eller bara dokumentationen
av den?**

## Mål

Identifiera datamodell-principer från världsklass-system →
gapanalysera mot vår nuvarande modell → leverera
migrationsplan från nuvarande modell till en föreslagen
världsklass-modell.

## Scope

| | |
|---|---|
| **IN** | Research, gapanalys, designförslag, migrationsplan |
| **UT** | Faktisk migration (skjuts till efter MK + Supabase-arkitektur är beslutad) |
| **UT** | Frontend-implementation av ändringar |
| **UT** | Schema-ändringar i Airtable under MK-eventet 1–3 maj 2026 |

## Avgränsningar och premisser

1. **Datamodell-doc är frusen som indata.** Skriver inte om
   `data-model.md` eller `hur-systemet-funkar.md` — bara
   läser dem.

2. **Inga ändringar i basen under MK.** MK-eventet 1–3 maj
   2026 är skarp drift. Schema-ändringar pausas tills efter.

3. **Migrationsplanen får anta Supabase som målplattform.**
   `miranon-media-admin/docs/conversion-plan.md` förbereder
   för Airtable → Supabase-migration. Forwards-look-modellen
   designas för Supabase, inte för fortsatt Airtable-användning.

4. **Affärslogik bevaras.** Allt som beskrivs i
   `hur-systemet-funkar.md` ska fungera även i den nya
   modellen. Användarens upplevelse av systemet får inte
   förändras (annat än till det bättre).

5. **DS1-DS6 + DQ1-DQ9 + 12 hypoteser** från datamodell-110
   är öppna trådar som forwards-look-projektet förväntas
   adressera (antingen lösa eller explicit besluta att
   bevara).

## Output (förväntat)

Filer i `~/Repon/miranon-media-admin/analys/`:

| Fil | Innehåll | Fas |
|---|---|---|
| `04-research.md` | Världsklass-datamodell-principer + källor | Research |
| `05-gap-vs-worldclass.md` | Vår modell jämförd mot principer | Gapanalys |
| `06-redesign-proposal.md` | Föreslagen ny modell (schema + relationer) | Design |
| `07-migration-plan.md` | Steg-för-steg från Airtable-modell → ny | Plan |

Slutleverans: en migrationsplan som Marcus + framtida Code-
session kan exekvera när Supabase-arkitekturen är klar.

## Förväntad tidsåtgång

2–3 fokuserade sessioner, fördelat över en vecka. Mest
Chat-driven (research + design); Code används vid behov
för kodbas-introspektion (vilka komponenter påverkas av
schema-ändringar).

## Indata-filer (måste-läsa innan plan-fas)

| Fil | Roll |
|---|---|
| `docs/reference/data-model.md` | Sanningskällan för "var vi är" |
| `docs/reference/hur-systemet-funkar.md` | Affärslogik som måste bevaras |
| `analys/01-extraction.md` | Källextraktion från datamodell-110 |
| `analys/02-live-state.md` | Live-state-snapshot 2026-04-28 |
| `analys/03-gap-analysis.md` | **Mall** för gap-analyser (struktur återanvänds) |
| `tasks/sessions/2026-04-28-datamodell-110-projekt.md` | Process-mall (6 faser + milstolpar) |
| `marcus-system/tasks/lessons.md` (sektion 2026-04-28) | 9 UNIVERSAL-lärdomar att tillämpa |
| `miranon-media-admin/docs/conversion-plan.md` | Befintlig Vue → React-plan + Supabase-förberedelse |

## Hur Marcus inleder nästa session

Inledning till ny Claude Chat-session:

```
Hej. Vi ska starta datamodell-research-projektet — forwards-look
mot världsklass.

Bakgrund: Vi avslutade just datamodell-110-projektet (sex faser,
11/10-dokumentation av befintlig Airtable-modell), dokumenterat i
~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-110-projekt.md.

Nu vill jag att du läser i denna ordning:

1. tasks/datamodell-research-direktiv.md (detta dokuments
   scope + mål)
2. docs/reference/data-model.md (vår nuvarande modell)
3. tasks/sessions/2026-04-28-datamodell-110-projekt.md
   (för process-mönstret — vi använder samma fasindelade
   upplägg med milstolpar och hypotes-disciplin)

Sedan föreslår du en plan i samma stil som datamodell-110:
faser, milstolpar, output-artefakter, gating-frågor.

Vi pratar igenom planen INNAN vi börjar köra. Inga commits,
inga extraktioner, ingen research än — bara plan.

Två viktiga premisser från direktivet:
- MK-eventet 1–3 maj 2026 är skarp drift. Inga schema-
  ändringar i basen under den perioden.
- Forwards-look-projektet är research + plan + designförslag,
  INTE implementation. Faktisk migration sker senare.
```

## Verktygsbalans

| Fas | Vem driver | Varför |
|---|---|---|
| Research (vad är världsklass?) | Chat | Web search + grundkunskap om datamodell-design |
| Gap-analys (vår vs världsklass) | Chat | data-model.md i context |
| Designförslag | Chat + Marcus granskar | Kreativt + analytiskt arbete |
| Migrationsplan | Chat + Code | Code läser kodbas för att se påverkade komponenter |
| Implementation | **Skjuts till framtida projekt** | Inte detta projekt |

## Open questions (från datamodell-110) som forwards-look bör adressera

| ID | Fråga | Hantering i forwards-look |
|---|---|---|
| Q3/O1 | A2-grenordnings-hypotesen | Lös genom redesign (om ny modell inte använder A2) eller genom test |
| Q9 | Webhooks i Airtable | Kartlägg om de migreras eller ersätts |
| Q10 | Personer 87 fält — uthärdligt eller splittra? | **Kärnfråga för redesign** |
| O5 | EventKey-format-bug — orsak | Förbi: ny modell har inte EventKey som matchningsnyckel |
| O14 | SHA256-hashar i Hämtade erbjudanden | Lös vid migrationen |

## Status

| | |
|---|---|
| Skapad | 2026-04-28 |
| Påbörjat | – |
| Ägare | Marcus |
| Senast uppdaterad | 2026-04-28 |

## Slutnot

Projektet slutfört 2026-04-30 efter Gate 6. Leveransen finns i `analys/04-research.md`, `analys/05-gap-vs-worldclass.md`, `analys/06a-airtable-redesign.md`, `analys/06b-supabase-target.md` och `analys/07-migration-plan.md`. Arbetsdokumentet är fruset i `tasks/sessions/2026-04-28-datamodell-research-projekt.md`.
