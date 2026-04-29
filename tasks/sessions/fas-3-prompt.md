# Fas 3 — Gap vs Worldclass, prompt för Codex CLI

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet, principregistret i `04-research.md` och `lessons.md`. Den här filen säger bara: läs dessa, i denna ordning, kör gap-analysen så här, hantera kontexten så här, rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-3-prompt.md`
> **Skapad:** 2026-04-29 av Claude Chat efter avslutad Fas 2 (Gate 2 passerad)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — **ny session**
> **Avlöser:** `fas-2-prompt.md` (Fas 2 är klar, R7 utökad enligt Marcus' Gate 2-granskning)

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, klassa gap, skriva på disk, rapportera | **Du (Codex CLI)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 3 (§5) och rapporterar — kör inte vidare till Fas 4 på eget initiativ.

---

## 1.5 Status vid Fas 3-start (för ny session)

Du läser denna prompt i en **ny Codex CLI-session**. Tidigare sessioners kontext är borta. Här är det du behöver veta innan du läser källfilerna:

**Levererat hittills:**
- **Fas 0 (KLAR):** Direktiv, 7-fasplan, arbetsdokument med 27→29 spårbarhetsrader.
- **Fas 1 (KLAR — Gate 1 passerad):** `analys/04-research.md` Del 0 — Baseline & Constraint Map (B1 Domänkarta, B2 Driftkarta, B3 Skuldregister).
- **Fas 2 (KLAR — Gate 2 passerad):** `analys/04-research.md` Del 1 — 10 principer P1–P10, källkluster R2–R6, fyrdelade stickprov i R7 (Cal.com, Plane.so, NocoDB), Gate 2-slutsats i R8.

**Viktiga beslut och korrigeringar att hålla i huvudet:**
- **H6 är REJECTED** (stängd 2026-04-29). SHA256-hasharna i `Källa (formulärkälla)` är inte form-input — de är hårdkodad Zapier-config i Zap 5+6. Cleanup hanteras via DQ4.
- **DQ4 är omklassificerad** till "config-as-data drift i Zapier-ingest" (P6), inte form-input-dedup.
- **DS7 är tillagd** sedan Fas 0: A1–A11-versionsdiff utan dokumenterade automation-ändringar.
- **G0.1 = JA** — stickprov mot Cal.com, Plane.so, NocoDB är gjorda i R7.
- **G0.2 = utvärdera, sannolikt skip** — event sourcing utvärderat i R5/P5, behovet finns inte i Fas 2.
- **G0.3 = öppen** — multi-tenant-strategin är **inte** beslutad. P10 säger uttryckligen "Tenant readiness is a gate, not a guess". Fas 3 ska **inte** smyg-besluta detta.

**UNIVERSAL-kandidater från Fas 0–2 (i arbetsdokumentet §9):**
- K1: Verifieringsprompter avslöjar verktygskompetens
- K2: MCP-implementationer kan ha olika tool-namn
- K3: Verktygsbegränsningar måste verifieras mot källa
- K4: Diagnostik-verktyg kan exponera secrets
- K5: Token-identifiering via hash-prefix
- **K6: Config-as-data drift ska klassas vid integrationskanten, inte vid symptomfältet** — direkt relevant för Fas 3-klassningen av DQ4

**Lärdom om din egen runtime (från Fas 2 §10):**
- Codex CLI har **ingen `/compact`-subcommand** i den API-runtime du kör i. Compact-disciplin körs via scratch-persistens + reload, inte via slash-command. Se §4 nedan.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

Sanningen om projektet bor i dessa filer. Läs dem **innan** du börjar klassa.

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — särskilt sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md` — scope, mål, premisser
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 3, §7 hypotesdisciplin, §8 DS/DQ-beslutsmatris**
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet, levande genom hela projektet** (alla beslut, hypoteser, DS/DQ, spårbarhetsmatris med Fas 2-principer ifyllda, UNIVERSAL-kandidater, §11 live-verifierade tekniska fakta)

**Indata för Fas 3 — kärnmaterialet:**

7. `~/Repon/miranon-media-admin/analys/04-research.md` — **Del 0 (baseline) + Del 1 (10 principer P1–P10 + R7 stickprov)**. Detta är den primära input för gap-analysen.

**Frusen indata (samma som Fas 1–2):**

8. `~/Repon/miranon-media-admin/docs/data-model.md`
9. `~/Repon/miranon-media-admin/docs/hur-systemet-funkar.md`
10. `~/Repon/miranon-media-admin/analys/01-extraction.md`
11. `~/Repon/miranon-media-admin/analys/02-live-state.md`
12. `~/Repon/miranon-media-admin/analys/03-gap-analysis.md` — **mall för gap-format, struktur återanvänds**
13. `~/Repon/miranon-media-admin/docs/conversion-plan.md`

**Föregående fas-prompter (för disciplin- och stilkonsistens):**

14. `~/Repon/miranon-media-admin/tasks/sessions/fas-1-prompt.md`
15. `~/Repon/miranon-media-admin/tasks/sessions/fas-2-prompt.md`

**Total: ~8 500 rader källfiler. Med 400K kontextfönster får allt plats.** Använd scratch-persistens-strategin i §4 — inte /compact, den fungerar inte i din runtime.

**Källprioritet vid konflikt:** Live-state (MCP) > arbetsdokumentet > 04-research.md > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 3 Gap vs Worldclass

Hela uppgiftsspecen finns i planen §6 "Fas 3 — Gap vs Worldclass". Kortversionen följer.

### 3.1 Mål

Jämför nuvarande modell mot principerna P1–P10 i `04-research.md`. Klassificera varje gap. Resultatet ska göra Fas 4 (redesign) beslutbar — när Fas 4 läser detta ska den veta exakt vilka gap som adresseras i A-track (Airtable 11/10) respektive S-track (Supabase target), vilka som bevaras medvetet, och vilka som är icke-problem.

### 3.2 Output

`~/Repon/miranon-media-admin/analys/05-gap-vs-worldclass.md` — **ny fil**.

Strukturen:

```markdown
# 05 — Gap vs Worldclass

> **Status:** Fas 3 (Gap-analys) klar för Gate 3.
>
> **Källprincip:** Detta dokument klassar 04-research.md:s principer mot
> nuvarande modell. Vid konflikt gäller live-state och arbetsdokumentets
> 2026-04-29-korrigeringar före äldre dokumentation.

## Del A — Gap per domänområde (M1)

### A1 — Personer
### A2 — Anmälningar
### A3 — Deltaganden
### A4 — Eventplanering
### A5 — Stöddomäner (Väntelista, Lead magnets, Touchpoints, Bulkmail, systemtabeller)
### A6 — Integrationskanter (Zapier, Edge Functions, Resend, Make.com)
### A7 — Drift- och observability-lager (A1–A11, audit, error-states)

## Del B — DS/DQ/H-matris med rekommendation (M2)

[En tabell med alla 29 punkter (DS1–DS7, DQ1–DQ9, H1–H13). Format:
ID | Beskrivning | Princip(er) | Klass enligt §8 i planen | Rekommendation | Beroende på G0.3 (multi-tenant)? ]

## Del C — Prioriteringskarta (M3)

[Fyra-fältare: driftkritisk Airtable-fix / Airtable cleanup post-MK /
Redesign för Supabase target / Preserve eller defer.]

## Del D — Öppna frågor till Fas 4

[Allt som krävde antagande, allt där två principer pekade olika håll, allt
som beror på G0.3-beslut.]
```

### 3.3 Gap-format per princip-anslutet gap

Varje **konkret gap** (inte bara DS/DQ/H utan även gap som upptäcks under analysen) ska ha:

| Fält | Innehåll |
|---|---|
| ID | G1, G2, … (numrera löpande från 1) |
| Domänområde | A1–A7 enligt struktur ovan |
| Nuläge | Vad modellen gör idag (källa: data-model.md eller live-state) |
| Världsklass-princip | Vilken princip från P1–P10 som tillämpas |
| Impact i skarp drift | Faktisk påverkan på Lotta/Roger/Marcus i operativt arbete |
| Airtable 11/10-åtgärd | Konkret förslag (om relevant), eller `n/a — Supabase only` |
| Supabase target-implikation | Konkret förslag (om relevant), eller `n/a — Airtable only` |
| Risk | Kostnad/komplexitet/sannolikhet i ord, inte siffror |
| Rekommendation | Status enligt §8 i planen (Airtable fix / Airtable cleanup / Airtable preserve / Supabase target / Migration transform / Defer / Preserve) |
| Spårbarhet | Vilken DS/DQ/H-rad detta gap motsvarar (om någon) |

### 3.4 Tre milstolpar (M1, M2, M3)

| Milstolpe | Leverans | Slut-test |
|---|---|---|
| M1 | Gap-lista per domänområde (Del A) | Varje gap har minst en princip-koppling. Inga gap utan källa. |
| M2 | DS/DQ/H-matris med rekommendation (Del B) | Alla 29 punkter klassade. Inga `–` eller blankt. |
| M3 | Prioriteringskarta (Del C) | Varje gap är placerat i exakt en av fyra rutor. Inga "kanske". |

### 3.5 Uppdateringar i arbetsdokumentet (löpande)

- **§6 Spårbarhetsmatris:** kolumnen "Fas 3 (klass)" fylls i för varje av de 29 raderna. Klass enligt planens §8. Inga rader får vara tomma efter Fas 3.
- **§9 UNIVERSAL-kandidater:** lägg till nya kandidater om gap-analysen avslöjar generaliserbara mönster.
- **§10 Daglig logg:** rader för Fas 3-start, eventuella scratch-reload-events, och Fas 3-slut.
- **§2 Faser och status:** PÅGÅR vid start, KLAR — Gate 3 vid avslut.

### 3.6 Estimat

1,5 h fokustid per planen. Med scratch-persistens och 400K-fönster ska detta inte bli kontextbundet.

---

## 4. Scratch-persistens-strategi (ersätter /compact)

Lärdom från Fas 2 §10 i arbetsdokumentet: din runtime har **ingen `/compact`-subcommand**. Compact-disciplin körs istället via scratch-fil + reload. Det fungerade i Fas 2 — samma mönster nu.

### 4.1 Scratch-filen

Skapa `~/Repon/miranon-media-admin/.codex-scratch/fas-3-context.md` som första åtgärd efter setup-läsning. Den filen är **din** — den committas inte (`.codex-scratch/` är redan i `.gitignore` sedan Fas 2). Den lever genom Fas 3 och raderas vid Gate 3.

Strukturen i scratch-filen:

```markdown
# Fas 3 — Codex CLI scratch (raderas vid Gate 3)

## A. Principregistret P1–P10 (kortversion från 04-research.md R1)
[Per princip: ID, namn, en-rads-definition, gäller (Airtable/Supabase/båda), styrande DS/DQ/H.]

## B. Skuldregister (29 punkter) med Fas 2-principer
[Per punkt: ID, beskrivning, källfil:rad, Fas 2-princip(er) från spårbarhetsmatrisen.]

## C. Klassmatris från planen §8
[Klass-namn med definition: Airtable fix / Airtable cleanup / Airtable preserve / Airtable preserve+rename / Supabase target / Migration transform / Defer / Preserve / Reject (bortfall).]

## D. Off-limits-lista före MK
[Per 04-research.md Del 0 §B2: schemaändringar, A1–A11, Zapier/Elfsight ingest, Resend-mallar, send-email, MK-recordet, etc.]

## E. Gate 3-frågor och G0.3-status
[Multi-tenant-status: ÖPPEN. Inga klassningar i Fas 3 ska smyg-besluta detta.]

## F. R7-fynd från stickproven (operativa designupphämtningar)
[Cal.com: Anmälan idempotency/dedupe-nyckel, Deltaganden inte formel-härledd. Plane.so: explicit state-tabell, join tables, audit/communication-log. NocoDB: schema/config/field-options som metadata för migration. Dessa ska refereras vid relevanta gap.]
```

### 4.2 Reload-disciplin

När du behöver detaljer som inte finns i scratch-filen — läs originalfilen, inte gissa. Det är billigare att läsa om `data-model.md:1170` (DS1-källa) en gång till än att klassa fel.

### 4.3 Kontextindikator

Om din runtime visar fyllningsnivå: håll under 80 % för att undvika oplanerad trunkering. Om indikatorn saknas: skriv löpande till `05-gap-vs-worldclass.md` istället för att hålla allt i kontextfönstret. Filen på disk är bättre persistens än kontext.

### 4.4 Indikatorer för oplanerad reload

Om du upptäcker att du tappat en detalj (t.ex. "vilken princip styrde DQ4?") — reload originalfilen, dokumentera händelsen i arbetsdokumentets §10 som UNIVERSAL-kandidat. Det ger oss data om scratch-strategins gränser.

---

## 5. Gate 3 — STOPPA HÄR

Vid Fas 3-slut: rapportera, vänta på godkännande, kör inte vidare till Fas 4.

**Tre frågor Gate 3 ställer (per planen):**

1. Vilka gap fixas i Airtable före migration? (Prioriterad lista med motivering)
2. Vilka gap bevaras medvetet tills Supabase? (Explicit defer-beslut med motivering)
3. Vilka gap är inte problem? (Preserve-beslut med motivering)

**Plus mina två kompletterande frågor från Gate 2-mönstret:**

4. Är någon gap-klassning beroende av G0.3 (multi-tenant)? Markera tydligt — Marcus ska kunna se exakt vilka gap som behöver omvärderas om multi-tenant beslutas senare.
5. Är prioriteringskartan beslutsbar? Kan Fas 4 läsa den och börja redesign utan att gå tillbaka till Fas 3?

**Rapportformat (skriv som sammanfattning vid sessionsslut):**

```markdown
## Fas 3 — Rapport vid Gate 3

### Levererat
- 05-gap-vs-worldclass.md: [X gap totalt fördelat på 7 domänområden]
- DS/DQ/H-matrisen komplett: [29/29 klassade]
- Prioriteringskartan: [N driftkritisk Airtable-fix, M Airtable cleanup, K redesign Supabase, L preserve/defer]
- Arbetsdokumentet uppdaterat: §6 Fas 3-kolumn, §9 UNIVERSAL-kandidater, §10 logg, §2 status
- Scratch-fil raderad: [ja/nej — radera om gate passerar]

### Scratch-events
- Reload-events: [antal, vilka filer, varför]
- Oplanerade reloads: [antal, vad som tappats]

### Gate 3-svar (Codex' egen bedömning, inte beslut)
1. Airtable-fix-listan: [bedömning + räkning]
2. Defer-listan: [bedömning + räkning]
3. Preserve-listan: [bedömning + räkning]
4. G0.3-beroenden: [lista + räkning]
5. Beslutsbarhet för Fas 4: [bedömning + 1–2 exempel]

### Öppna frågor till Marcus + Chat
[Allt som inte var glasklart, allt som krävde antagande, allt där två principer pekade olika håll.]

### Lyft-kandidater för UNIVERSAL
[Nya generaliserbara lärdomar från Fas 3.]
```

Inga commits från Codex. Marcus committar efter granskning.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Princip-koppling per gap | Varje gap måste peka tillbaka på minst en av P1–P10. Saknas det — gap:et är för löst, omformulera eller skär bort |
| Hypotes-status respekteras | H6 är REJECTED — får inte återupplivas. H3, H4, H7 är DECIDED — hanteras enligt sina beslut, inte återöppnas |
| Källhänvisning | Faktuella påståenden får källspår: `filnamn:radnummer` eller MCP-anrop med tabell+filter |
| Live-state vid tvivel | Live-state är frusen baseline (Del 0 i 04-research.md). Använd den, inte ny MCP-extraktion. Om något genuint kräver verifiering — flagga som öppen fråga, gör inte ny extraktion |
| Inga skrivoperationer mot Airtable | Endast read-anrop om något kräver verifiering (osannolikt) |
| Inga commits | Inga `git add` / `git commit` / `git push`. Marcus committar |
| Inga ändringar i 04-research.md | Den är låst efter Gate 2. Om gap-analysen avslöjar att en princip är fel formulerad — flagga som öppen fråga i Del D, ändra inte källfilen |
| Stoppa vid Gate 3 | Rapportera, vänta på godkännande |
| Off-limits-listan gäller | Per 04-research.md Del 0 §B2 — inga ändringar mot Airtable, MK-frys står |

---

## 7. Anti-patterns att undvika

Lärdomar från Fas 0–2 plus några som specifikt riskerar Fas 3:

| Anti-pattern | Hur du undviker det |
|---|---|
| Cleanup-lista utan princip-koppling | Varje rad i Del B måste peka på P1–P10. "Det här är konstigt" räcker inte som motivering |
| Smyg-beslut på multi-tenant (G0.3) | P10 säger uttryckligen att tenant readiness ska bedömas explicit, inte smygas in. Markera G0.3-beroenden, fatta inga val |
| Resurrektion av REJECTED hypoteser | H6 är stängd. SHA256-hasharna är **inte** form-input — de är Zapier-config (Zap 5+6). Klassa DQ4 som P6 config-as-data drift, inte som dedup |
| Återextrahera från live-state | Del 0 är frusen baseline. Använd den. Ny MCP-extraktion ger projektet skuld i form av två sanningskällor |
| Lös klassning ("kanske Airtable, kanske Supabase") | Varje DS/DQ/H får exakt en primär klass enligt §8. Sekundär klass tillåten om punkten genuint kräver båda spår (t.ex. "Airtable cleanup + migration transform"), men flagga det |
| Tappa Kandidat 6-disciplinen | Vid varje gap som rör externt skriven data (Zapier, Edge Functions, formulär): fråga "är detta användardata, integration-config, defaultvärde eller transform-output?" innan klassning. Kandidat 6 från §9 i arbetsdokumentet |
| Strukturskuld i 05-filen | Följ gap-formatet i §3.3 strikt. Avvikande kolumner per gap gör Fas 4-läsbarheten sämre |
| /compact-försök | Det finns inte i din runtime. Använd scratch-persistens (§4) |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning, i sin helhet. Ta särskilt tid på `04-research.md` Del 1 (principregistret) och arbetsdokumentet §4 (hypotesregister) + §6 (spårbarhetsmatris).
2. Skapa `.codex-scratch/fas-3-context.md` enligt §4.1. Verifiera att `.codex-scratch/` fortfarande är `git`-ignorerad.
3. Uppdatera arbetsdokumentet §10 med rad för Fas 3-start.
4. Uppdatera arbetsdokumentet §2 med status PÅGÅR.
5. Skapa `analys/05-gap-vs-worldclass.md` med skelett enligt §3.2.
6. **M1 — Del A (gap per domänområde):** gå igenom A1–A7. Skriv löpande till filen.
7. **M2 — Del B (DS/DQ/H-matris):** klassa alla 29 punkter enligt planens §8. Sanity-check: varje punkt har Fas 2-princip i spårbarhetsmatrisen — använd den som ingång.
8. **M3 — Del C (prioriteringskarta):** placera varje gap i exakt en ruta.
9. **Del D — öppna frågor:** lyft allt som krävde antagande eller där principer pekade olika håll.
10. Uppdatera arbetsdokumentet §6 (Fas 3-kolumn för alla 29 rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (status KLAR — Gate 3).
11. Skriv Gate 3-rapporten enligt §5.
12. Radera scratch-filen.
13. Stoppa. Vänta på Marcus.

---

*Slut på Fas 3-prompten. När Marcus passerat Gate 3 kommer en separat fas-4-prompt skapas av Claude Chat — den blir större eftersom Fas 4 splittar i A-track + S-track.*
