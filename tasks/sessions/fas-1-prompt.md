# Fas 1 — Quickstart för Codex

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet och lessons.md. Den här filen säger bara: läs dessa, i denna ordning, sedan denna uppgift, sedan rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-1-prompt.md`
> **Skapad:** 2026-04-29 av Claude Chat efter avslutad Fas 0
> **För:** Codex i ny session

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, köra MCP/REST, skriva på disk, rapportera | **Du (Codex)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 1 (§4) och rapporterar — kör inte vidare på eget initiativ.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

Sanningen om projektet bor i dessa filer. Läs dem **innan** du rör något verktyg.

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — särskilt sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md` — scope, mål, premisser
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — 7-faser, gates, milstolpar, anti-patterns
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet, levande genom hela projektet** (innehåller alla beslut, hypoteser, DS/DQ, spårbarhetsmatris, UNIVERSAL-kandidater och §11 live-verifierade tekniska fakta)

**Indata för Fas 1:**

7. `~/Repon/miranon-media-admin/docs/data-model.md` — frusen indata
8. `~/Repon/miranon-media-admin/docs/hur-systemet-funkar.md` — affärslogik som ska bevaras
9. `~/Repon/miranon-media-admin/analys/01-extraction.md` — källextraktion från dm-110
10. `~/Repon/miranon-media-admin/analys/02-live-state.md` — live-state-snapshot
11. `~/Repon/miranon-media-admin/analys/03-gap-analysis.md` — mall för gap-analyser

**Process-mall:**

12. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-110-projekt.md` — för att se hur dm-110 körde sin Fas 1 och vilken disciplin som tillämpades

**Tilläggskontext:**

13. `~/Repon/miranon-media-admin/docs/conversion-plan.md` — Vue → React + Supabase-förberedelse

Total: ~7 500 rader. Med 400k kontextfönster ryms allt.

**Källprioritet vid konflikt:** Live-state (MCP) > arbetsdokumentet > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 1 Baseline & Constraint Map

Hela uppgiftsspecen finns i planen §6 "Fas 1 — Baseline & Constraint Map". Kortversionen:

**Output:** Skapa `~/Repon/miranon-media-admin/analys/04-research.md` med Del 0 — Baseline & Constraint Map. Strukturen:

```
# 04 — Worldclass Research

> **Status:** Fas 1 (Baseline) klar. Fas 2 (Research) ej påbörjad.

## Del 0 — Baseline & Constraint Map (Fas 1)

### B1 — Domänkarta
### B2 — Driftkarta
### B3 — Skuldregister

## Del 1 — Research (Fas 2)

*(tom — Fas 2-leverans)*
```

**Tre milstolpar (detaljerade i planen):**

- **B1 Domänkarta** — kärndomäner (Personer, Anmälningar, Deltaganden, Eventplanering) + stöddomäner. Per domän: vad den finns för, viktigaste fält, relationer. Inkludera Mermaid- eller ASCII-diagram av kärndomänerna.
- **B2 Driftkarta** — hårda constraints från drift (MK-frys, Lotta-workflows, A1–A11, Edge Functions, Resend-flöden, **Zapier-kedjan med 6 aktiva Zaps**). Per constraint: vad, varför hård, vad händer vid brott.
- **B3 Skuldregister** — sammanställ DS1–DS7, DQ1–DQ9, samt 13 hypoteser från arbetsdokumentets §4–§5. Format: ID | Beskrivning | Källa | Preliminär klass | Kommentar.

**Uppdateringar i arbetsdokumentet (löpande under arbetet):**

- §6 Spårbarhetsmatris: kolumn "Fas 1 (lyft)" fylls i för varje av de 29 raderna. Ingen rad får vara tom efter Fas 1.
- §10 Daglig logg: rader för Fas 1-start och -slut.
- §2 Faser och status: PÅGÅR vid start, KLAR vid avslut.

**Estimat:** 1–1,5 timme fokustid.

---

## 4. Gate 1 — STOPPA HÄR

Vid Fas 1-slut: rapportera, vänta på godkännande, kör inte vidare.

**Tre frågor Gate 1 ställer:**

1. Är `data-model.md` tillräcklig som frusen baseline, eller behövs MCP-verifiering på någon punkt?
2. Vilka delar av Airtable är "off limits" före MK?
3. Finns workflows i `hur-systemet-funkar.md` som saknas i den tekniska modellen?

---

## 5. Operationella regler

| Regel | Konkret |
|---|---|
| Hypotes-markering | Påståenden som inte är direkt verifierade markeras `[HYPOTES — EJ VERIFIERAD]` med verifieringsväg |
| Källhänvisning | Faktuella påståenden får källspår: filnamn:radnummer eller MCP-anrop med tabell+filter |
| Live-state vid tvivel | MCP-anrop framför att gissa från dokumentation |
| Hash-prefix för secrets | Eka aldrig token-värden. Använd hash-prefix om verifiering behövs |
| Inga commits | Inga `git add` / `git commit` / `git push` |
| Inga skrivoperationer mot Airtable | Endast read-anrop |
| Stoppa vid Gate 1 | Vid Fas 1-slut: rapportera, vänta |

**Tabell-IDn, fältnamn och MCP-constraints:** se arbetsdokumentet §11 (Live-verifierade tekniska fakta).

---

## 6. Rapporteringsformat vid Gate 1

```
GATE 1 — Fas 1 levererad

LEVERANS:
- 04-research.md skapad: [filsökväg + radantal]
- B1 Domänkarta: [klar/ej klar, vad som täcks]
- B2 Driftkarta: [klar/ej klar, antal constraints]
- B3 Skuldregister: [klar/ej klar, 29 punkter listade]

ARBETSDOKUMENT-UPPDATERINGAR:
- §6 Spårbarhetsmatris: alla 29 rader uppdaterade i Fas 1-kolumn
- §10 Daglig logg: rader tillagda
- §2 Fas 1: markerad KLAR

GATE 1-FRÅGOR (för Marcus):
1. data-model.md som frusen baseline: [bedömning]
2. Off limits-områden i Airtable före MK: [lista]
3. Workflow-luckor i hur-systemet-funkar.md: [bedömning]

ÖPPNA FRÅGOR / OBSERVATIONER:
- [eventuella nya hypoteser eller oklarheter]

NÄSTA STEG:
Väntar på godkännande för Fas 2-start.
```

---

## 7. Inter-fas-kontrakt → Fas 2

Fas 2 startar när:

- 04-research.md skapad med Del 0 komplett (B1 + B2 + B3)
- Arbetsdokumentet §6 spårbarhetsmatris fullständigt uppdaterad
- Arbetsdokumentet §2 markerar Fas 1 som KLAR
- Arbetsdokumentet §10 har dagloggar
- Lista över "off limits"-områden levererad i Gate 1-rapport

---

— Claude Chat, 2026-04-29
