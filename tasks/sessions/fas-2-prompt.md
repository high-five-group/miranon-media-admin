# Fas 2 — Worldclass Research, prompt för Codex CLI

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet och `lessons.md`. Den här filen säger bara: läs dessa, i denna ordning, kör forskningen så här, hantera kontexten så här, rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-2-prompt.md`
> **Skapad:** 2026-04-29 av Claude Chat efter avslutad Fas 1 (commits `56d32e8` + `245422c`)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — inte VS Code-extensionen (258K-cap räcker inte för Fas 2 med marginal)
> **Avlöser:** `fas-1-prompt.md` (Fas 1 är klar, Gate 1 passerad)

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, web search, skriva på disk, rapportera | **Du (Codex CLI)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 2 (§5) och rapporterar — kör inte vidare till Fas 3 på eget initiativ.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

Sanningen om projektet bor i dessa filer. Läs dem **innan** du rör web search eller skriver något.

**Setup (samma som Fas 1):**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — särskilt sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md` — scope, mål, premisser
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 2 och §7 hypotesdisciplin**
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet, levande genom hela projektet** (alla beslut, hypoteser, DS/DQ, spårbarhetsmatris, UNIVERSAL-kandidater, §11 live-verifierade tekniska fakta)

**Indata från Fas 1 (din egen leverans):**

7. `~/Repon/miranon-media-admin/analys/04-research.md` — Del 0 (Baseline & Constraint Map) är klar. Del 1 är tom-stansad och ska fyllas i denna fas.

**Frusen indata (samma som Fas 1):**

8. `~/Repon/miranon-media-admin/docs/data-model.md`
9. `~/Repon/miranon-media-admin/docs/hur-systemet-funkar.md`
10. `~/Repon/miranon-media-admin/analys/01-extraction.md`
11. `~/Repon/miranon-media-admin/analys/02-live-state.md`
12. `~/Repon/miranon-media-admin/analys/03-gap-analysis.md`
13. `~/Repon/miranon-media-admin/docs/conversion-plan.md`

**Total: ~7 500 rader källfiler + Del 0 i 04-research. Med 400K kontextfönster får allt plats — men du ska compact:a proaktivt enligt §4 så att research-fasen har gott om utrymme.**

**Källprioritet vid konflikt:** Live-state (MCP) > arbetsdokumentet > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 2 Worldclass Research

Hela uppgiftsspecen finns i planen §6 "Fas 2 — Worldclass Research". Kortversionen följer.

### 3.1 Mål

Identifiera 8–12 principer för världsklass-datamodeller som är **relevanta för detta system**. Inte generiska best practices. Varje princip ska kunna bedöma något konkret i nuvarande modell när Fas 3 (gap-analys) kör. Om en princip inte kan göra det — skär bort den.

### 3.2 Output

`~/Repon/miranon-media-admin/analys/04-research.md` Del 1 (skriv direkt i existerande fil — Del 0 från Fas 1 är låst, ändra inte den).

Strukturen för Del 1:

```markdown
## Del 1 — Research (Fas 2)

### R0 — Metod och avgränsning

[Kort: vilka research-områden täcktes, vilka stickprov mot öppen källkod, vilka som medvetet skippades och varför.]

### R1 — Domänmodellering & livscykler
### R2 — Identitet, dedup & människa-som-entitet
### R3 — Audit, event-history & immutability-trade-offs
### R4 — Integration edges (webhooks, ingest, eventual consistency)
### R5 — Multi-tenant-mönster (Passionslyftet, Maxat Event, framtida produkter)
### R6 — Observability & operational visibility för operativa system
### R7 — Airtable-specifika mönster (operativt no-code/low-code)
### R8 — Supabase/Postgres-specifika mönster (RLS, constraints, audit)

### R9 — Principregister

[Tabell: ID | Princip | Kort beskrivning | Gäller (Airtable / Supabase / båda) | Källor (≥5 högkvalitativa per princip-kluster) | Bedömningsrubrik (vad ska Fas 3 mäta mot?) ]

### R10 — Stickprov mot öppen källkod

[2–3 stickprov per G0.1: Cal.com, Plane.so, NocoDB. Per stickprov: vad de gör likt oss, vad de gör annorlunda, vad är värt att kopiera, vad är värt att avvisa.]
```

Områdesindelningen R1–R8 är förslag — du får revidera om du upptäcker att två områden borde slås ihop eller ett tredje saknas. Men minst R7 och R8 ska vara separata sektioner (per planens avgränsning: "inte enbart SQL-normalisering").

### 3.3 Research-discipliner

| Disciplin | Konkret |
|---|---|
| Färska källor först | Bias mot källor 2024+ för moderna mönster (event-sourcing-trötthet, multi-tenant-evolutionen, Airtable-skalningsmönster). Klassiker (Fowler, Kleppmann) får citeras men ska inte vara enda källa. |
| Stickprov ≥ abstrakta principer | Per G0.1-beslutet: minst 2–3 konkreta scheman från öppen källkod. Konkreta scheman slår abstrakta principer för migrationsplanering. |
| Multi-tenant-frågan är öppen | Per G0.3 är multi-tenant-strategin inte beslutad. Researcha **mönster och trade-offs** — fatta inga val. Fas 3/4 fattar valet. |
| Event sourcing skippas, audit inte | Per G0.2: utvärdera event sourcing kort, motivera om det skippas. Audit-logg + immutable history ska researchas grundligt — det är där behovet ligger. |
| Inga lösa best-practice-listor | Varje princip ska kunna bedöma något i nuvarande modell. Om "vi kunde ha denna princip men ingenting i vår modell skaver mot den" — skär bort den. |
| Källspår per påstående | Faktuella påståenden får källa: URL, författare, datum. Inga obelagda anekdoter. |

### 3.4 Uppdateringar i arbetsdokumentet (löpande)

- **§6 Spårbarhetsmatris:** kolumn "Fas 2 (research-princip)" fylls i för varje av de 29 raderna där research-principen kan bedöma raden. Rader utan tillämpbar princip får `n/a` med kort motivering.
- **§9 Lyfta lärdomar (UNIVERSAL-kandidater):** lägg till nya kandidater om research-fasen avslöjar generaliserbara mönster (t.ex. "research-disciplin för data-arkitektur skiljer sig från research-disciplin för UI-arkitektur" eller liknande).
- **§10 Daglig logg:** rader för Fas 2-start, compact-events, och Fas 2-slut.
- **§2 Faser och status:** PÅGÅR vid start, KLAR — Gate 2 vid avslut.

### 3.5 Estimat

1,5–2 h fokustid per planen. Med proaktiv compact-strategi och 400K-fönster ska detta inte bli kontextbundet.

---

## 4. Compact-strategi — proaktiv, tre planerade punkter

VS Code-extensionen är 258K. CLI är 400K. Marginal finns men är inte oändlig — research med 8+ web-sökningar per område × 8 områden = lätt 200K bara i råa search-resultat. Compact:a proaktivt på följande punkter.

### 4.1 Persistenslager — scratch-fil på disk

Skapa `~/Repon/miranon-media-admin/.codex-scratch/fas-2-context.md` som första åtgärd efter setup-läsning. Den filen är **din** — den committas inte, den lever bara genom Fas 2, och raderas vid Gate 2. Den är `git`-ignorerad via projektets befintliga `.gitignore` (verifiera; lägg till om den saknas).

Strukturen i scratch-filen:

```markdown
# Fas 2 — Codex CLI scratch (raderas vid Gate 2)

## A. Tekniska fakta från arbetsdokumentet §11
[Destillera: tabell-IDs, fältnamn, MCP-constraints, Zapier-kedjan med 6 aktiva Zaps, edge functions, A1–A11.]

## B. Skuldregister (DS/DQ/hypoteser) per 04-research.md Del 0 §B3
[En rad per skuld: ID | beskrivning | källfil:rad | preliminär klass.]

## C. Hypotesregister per arbetsdokumentet §4
[H1–H13 med status (OPEN/SUPPORTED/DECIDED/REJECTED/DEFERRED/PRESERVE). H6 är REJECTED, H3+H4+H7 är DECIDED.]

## D. Off-limits-lista före MK
[Per 04-research.md Del 0 §B2: schemaändringar, A1–A11, Zapier/Elfsight ingest, Resend-mallar, send-email, MK-recordet, etc.]

## E. Plan-§6 spec för Fas 2 (kortversion)
[Mål, output, research-områden, milstolpar M1+M2, Gate 2-frågorna.]

## F. G0-beslut
[G0.1 — JA, 2–3 stickprov. G0.2 — utvärdera event sourcing, sannolikt skip. G0.3 — multi-tenant öppen, researcha mönster.]
```

Scratch-filen är ditt minne efter compact. Allt som inte finns i den eller i 04-research.md tappas vid compact.

### 4.2 Compact-punkt 1 — efter setup, innan research

**När:** När alla 13 källfiler är lästa och scratch-filen är skriven.

**Vad behålls i kontexten:**
- Scratch-filens path
- Plan-§6 (Fas 2-specen)
- Output-filens path (`analys/04-research.md`)
- Arbetsdokumentets path
- Denna prompt

**Vad tappas:**
- Råa filinnehåll från de 13 källfilerna
- Setup-output

**Verifiering efter compact:** Läs scratch-filen igen så den är i kontext-fönstret. Om något verkar saknas, läs om relevant källfil — billigare att läsa om än att gissa.

### 4.3 Compact-punkt 2 — mellan tunga research-områden

**När:** Efter att 3–4 research-områden är klara (utkast skrivet i 04-research.md), om kontexten närmar sig 70 % fyllning. Inte tidigare — onödig compact tappar färska kopplingar mellan områden.

**Vad behålls:**
- Scratch-filen (uppdaterad om nya tekniska fakta dykt upp)
- 04-research.md Del 1 (de färdiga områdena finns där, så de behöver inte vara i kontexten)
- Lista över återstående research-områden
- De 3–5 starkaste källorna hittills (URL + 1-rad-sammanfattning)

**Vad tappas:**
- Råa search-resultat
- Web-fetch:ade artiklar som redan är destillerade

**Verifiering efter compact:** Läs senaste sektionen i 04-research.md så stilen är konsistent när du fortsätter.

### 4.4 Compact-punkt 3 — före konsolidering

**När:** När R1–R8 är klara men R9 (Principregister) och R10 (Stickprov) återstår, om kontexten åter närmar sig 70 %.

**Vad behålls:**
- 04-research.md Del 1 (R1–R8 är skrivna där)
- Scratch-filen
- G2-frågorna ur planen

**Verifiering efter compact:** Läs 04-research.md Del 1 R1–R8 så principregistret kan dra från färskt material.

### 4.5 Indikatorer för oplanerad compact

Om kontexten passerar 80 % innan en planerad compact-punkt — compact ändå, men logga händelsen i arbetsdokumentets §10 (daglig logg) som UNIVERSAL-kandidat. Det betyder att estimatet "1,5–2 h med 400K" var för optimistiskt och nästa fas behöver justera.

---

## 5. Gate 2 — STOPPA HÄR

Vid Fas 2-slut: rapportera, vänta på godkännande, kör inte vidare till Fas 3.

**Fyra frågor Gate 2 ställer (per planen):**

1. Är 8–12 principer den rätta granulariteten — eller bör några slås ihop / splittras?
2. Har vi separerat Airtable-excellence från Supabase-target tillräckligt tydligt?
3. Finns det källor nog för att kalla detta research (≥5 högkvalitativa per princip-kluster)?
4. Är varje princip beslutsbar — kan Fas 3 använda den för att klassa ett konkret gap?

**Rapportformat (skriv som sammanfattning vid sessionsslut):**

```markdown
## Fas 2 — Rapport vid Gate 2

### Levererat
- 04-research.md Del 1: [X områden, Y principer, Z stickprov, totalt ~N rader]
- Arbetsdokumentet uppdaterat: §6 spårbarhet, §9 UNIVERSAL-kandidater, §10 logg, §2 status
- Scratch-fil raderad: [ja/nej — radera om gate passerar]

### Compact-events
- Punkt 1 (efter setup): [tid, kontextnivå före/efter]
- Punkt 2 (mellan-research): [tid, kontextnivå före/efter, vad som tappades]
- Punkt 3 (före konsolidering): [tid, kontextnivå före/efter]
- Oplanerade compacts: [antal, varför]

### Gate 2-svar (Codex' egen bedömning, inte beslut)
1. Granularitet: [bedömning]
2. A/S-separation: [bedömning]
3. Källtäckning: [bedömning + konkret räkning per princip-kluster]
4. Beslutsbarhet: [bedömning + 1–2 exempel på hur en princip skulle klassa ett DS/DQ]

### Öppna frågor till Marcus + Chat
[Allt som inte var glasklart, allt som krävde antagande, allt där research-källor pekade åt motsatta håll.]

### Lyft-kandidater för UNIVERSAL
[Nya generaliserbara lärdomar från Fas 2.]
```

Inga commits från Codex. Marcus committar efter granskning.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Hypotes-markering | Påståenden om världsklass-mönster som inte är direkt belagda i källor markeras `[HYPOTES — EJ BELAGD]` med verifieringsväg |
| Källhänvisning | Faktuella påståenden får källspår: URL + författare + datum, eller `filnamn:radnummer` för projektets egna filer |
| Live-state vid tvivel | Gäller projekt-fakta, inte research. Research-källor behöver inte verifieras live, men stickprov mot öppen källkod ska ha repo-URL + commit/tag |
| Inga skrivoperationer mot Airtable | Endast read-anrop om något behöver verifieras (osannolikt i denna fas) |
| Inga commits | Inga `git add` / `git commit` / `git push`. Marcus committar |
| Inga ändringar i Del 0 | Del 0 (Baseline) är låst efter Gate 1. Endast Del 1 skrivs i Fas 2 |
| Stoppa vid Gate 2 | Rapportera, vänta på godkännande |
| Off-limits-listan gäller | Per 04-research.md Del 0 §B2 — inga ändringar mot Airtable, MK-frys står |
| Hash-prefix för secrets | Eka aldrig token-värden. Använd hash-prefix om något kräver verifiering |
| Verifiera tooling vid första anrop | Per UNIVERSAL-lärdom 2026-04-29 (Kandidat 3): rapporterad verktygskapacitet ≠ live-verktygskapacitet. Om du säger "verktyget kan inte X" — visa att du provat |

---

## 7. Anti-patterns att undvika

Lärdomar från dm-110 och Fas 0–1 som direkt gäller Fas 2:

| Anti-pattern | Hur du undviker det |
|---|---|
| Generic best-practice-dump | Varje princip ska bedöma något i vår modell. Om den inte gör det — skär bort den |
| Source-soup (många URL:er, få insikter) | ≥5 högkvalitativa källor per princip-kluster, inte per princip. Synliggör var källorna konvergerar |
| Smyg-beslut på multi-tenant | G0.3 är öppen. Researcha mönster + trade-offs, fatta inte val |
| Återextrahera från live-state | Live-state är frusen baseline för detta projekt. Använd Del 0, inte ny MCP-extraktion |
| Bygga forskningen runt Supabase | Planen säger Airtable-excellence först. R7 (Airtable-mönster) är minst lika viktigt som R8 |
| Tappa H6+DQ4-omklassningen | Researcha inte "form-input dedup" — DQ4 är Zapier-config-skuld. Researcha "config-as-data drift" istället |
| Compact:a för tidigt | Compact innan research är dyrt — du tappar färska kopplingar. Följ §4-punkterna |
| Compact:a för sent | Om kontexten är full när du behöver skriva R10 — du har redan misslyckats. Följ §4-punkterna |
| Gissa Codex-CLI-syntax | Om `/compact` eller motsvarande inte funkar som väntat — verifiera via `codex --help` eller motsvarande, dokumentera i scratch-filen, fortsätt |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning, i sin helhet.
2. Skapa `.codex-scratch/`-mappen och `fas-2-context.md` enligt §4.1. Verifiera att den är `git`-ignorerad.
3. Compact-punkt 1 (§4.2). Verifiera scratch-filen i kontexten efteråt.
4. Uppdatera arbetsdokumentet §10: rad för Fas 2-start.
5. Uppdatera arbetsdokumentet §2: status PÅGÅR.
6. Kör research område för område (R0 → R10). Web search + web fetch + öppen källkod-stickprov.
7. Skriv Del 1 i `04-research.md` löpande.
8. Compact-punkt 2 efter R3–R4 om kontextindikator visar > 70 %.
9. Compact-punkt 3 före R9–R10 om kontextindikator visar > 70 %.
10. Konsolidera R9 (Principregister) och R10 (Stickprov).
11. Uppdatera arbetsdokumentet §6 (spårbarhet), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (status KLAR — Gate 2).
12. Skriv Gate 2-rapporten enligt §5.
13. Stoppa. Vänta på Marcus.

---

*Slut på Fas 2-prompten. När Marcus passerat Gate 2 kommer en separat fas-3-prompt skapas av Claude Chat.*
