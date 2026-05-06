# Fas 5 — Tvåstegs-migrationsplan, prompt för Codex CLI

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet, gap-analysen, A-track-leveransen, S-track-leveransen och `lessons.md`. Den här filen säger bara: läs dessa, i denna ordning, sekvensera migrationen så här, hantera kontexten så här, rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/archive/datamodell-research-2026-04-30/fas-5-prompt.md`
> **Skapad:** 2026-04-30 av Claude Chat efter avslutad Fas 4 (Gate 4A + 4B passerade)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — **ny session**
> **Avlöser:** `fas-4b-prompt.md` (Fas 4 är klar — både A-track och S-track låsta)
> **Föregår:** `fas-6-prompt.md` (slutgranskning + UNIVERSAL-lyft + arkivering — skapas av Claude Chat efter Gate 5 passerats)

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, sekvensera migrationen, skriva på disk, rapportera | **Du (Codex CLI)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 5 (§5) och rapporterar — kör inte vidare till Fas 6 på eget initiativ.

---

## 1.5 Status vid Fas 5-start (för ny session)

Du läser denna prompt i en **ny Codex CLI-session**. Tidigare sessioners kontext är borta. Här är det du behöver veta innan du läser källfilerna:

**Levererat hittills:**
- **Fas 0–4 KLARA:** Hela design- och researchblocket är klart. Fas 5 sekvenserar och planerar implementationen, men är fortfarande research/plan — ingen kod, inga schemaändringar, inga commits utöver dokumentationsfilen.
- **`docs/research/datamodell-research/04-research.md`:** 10 principer P1–P10 + R7 stickprov (Cal.com, Plane.so, NocoDB)
- **`docs/research/datamodell-research/05-gap-vs-worldclass.md`:** 15 gap (G1–G15) klassade enligt §8
- **`docs/research/datamodell-research/06a-airtable-redesign.md`:** 12 A-track-åtgärder (A1–A12) med sekvens, blast radius, rollback
- **`docs/research/datamodell-research/06b-supabase-target.md`:** 36 target-tabeller med soft multi-tenant, integration sources som produkter, audit före event sourcing

**Vad Fas 5 INTE är:**
- Inte implementation. Ingen SQL-DDL skrivs i 07. Migrationsskripten skrivs av Code i ett separat post-projekt.
- Inte återuppfinning av 06b. 06b Del F2 har redan en transformations-tabell — Fas 5 sekvenserar och fördjupar den, motsäger den inte.
- Inte återuppfinning av 06a. A-tracks 12 åtgärder med sekvens (Del D i 06a) är redan klar — Fas 5 integrerar dem som planens steg 2–3, inte som ny analys.

**Vad Fas 5 ÄR:**
- En exekverbar 10-stegs plan (planens §6 Fas 5) från idag till slutförd Supabase-migration
- Strangler-fig-strategi: migrera domän-för-domän, inte big bang
- Validation per steg: vad bevisar att migrationen lyckades
- Rollback per steg: hur backar man utan att tappa driftdata
- Future Code-prompt: en prompt som en framtida Code-session kan starta implementation från utan att gissa

**Strategiska beslut tidigare fattade (relevanta för Fas 5):**
- **MK-frys 1–3 maj 2026.** Steg 1 är pre-MK freeze. Inga ändringar förrän efter MK.
- **G0.3 = soft multi-tenant.** Migration sätter `tenant_id = miranon-media` på alla rader. Tenant-kolumnen är obligatorisk i target.
- **DQ4 stable keys** (`leadmagnet:kraftfaltet`-format). Migration transformerar Zapier-hashes till stable keys per 06b §B4.
- **H6 är REJECTED.** Migration behandlar `Källa (formulärkälla)` som Zapier-config, inte form-input. Per K6.
- **Audit före event sourcing.** Migration sätter upp audit-strukturen från 06b §C1 men inte event sourcing.

**UNIVERSAL-kandidater att ha i bakhuvudet (§9 i arbetsdokumentet):**
- K1–K5: tooling/secrets/diagnostik
- K6: Config-as-data drift klassas vid integrationskant — gäller G11/DQ4-transformationen
- K7: "Rekommendation är inte beslut när gate är öppen" — gäller dig: 06b §F3 listar saker som inte är beslut, smyg-besluta dem inte i 07
- K8: Preserve är aktivt guardrail-beslut — gäller även migrationen, t.ex. namnlösa Personer migreras AKTIVT som legitima leads, inte passivt skippas
- K9: Stable identifiers separerade från displaynamn — gäller integration source-transformationen

**Lärdom om din runtime:**
- Codex CLI har **ingen `/compact`-subcommand**. Compact-disciplin via scratch-persistens + reload. Se §4.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 5 (10-stegs planstruktur), §8 DS/DQ-beslutsmatris**
6. `~/Repon/miranon-media-admin/tasks/sessions/archive/2026-04/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet**

**Indata för Fas 5 — kärnmaterialet:**

7. `~/Repon/miranon-media-admin/docs/research/datamodell-research/04-research.md` — principregistret (referens)
8. `~/Repon/miranon-media-admin/docs/research/datamodell-research/05-gap-vs-worldclass.md` — gap-analysen (referens)
9. `~/Repon/miranon-media-admin/docs/research/datamodell-research/06a-airtable-redesign.md` — **A-tracks 12 åtgärder + sekvens (Del D) blir steg 2–3 i migrationsplanen**
10. `~/Repon/miranon-media-admin/docs/research/datamodell-research/06b-supabase-target.md` — **S-tracks 36 tabeller + Del F transformationskontrakt blir steg 4–8 i migrationsplanen**

**Frusen indata (referens):**

11. `~/Repon/miranon-media-admin/docs/reference/data-model.md`
12. `~/Repon/miranon-media-admin/docs/reference/hur-systemet-funkar.md`
13. `~/Repon/miranon-media-admin/docs/research/datamodell-research/02-live-state.md`
14. `~/Repon/miranon-media-admin/docs/conversion-plan.md` — **äldre conversion-plan, kan ge mönsterhjälp men har lägre prioritet än 06a/06b**

**Föregående fas-prompter (för disciplin- och stilkonsistens):**

15. `~/Repon/miranon-media-admin/tasks/sessions/archive/datamodell-research-2026-04-30/fas-4b-prompt.md`

**Total: ~12 000 rader.** Med 400K kontextfönster får allt plats. Använd scratch-persistens (§4).

**Källprioritet vid konflikt:** Live-state (frusen i Del 0) > arbetsdokumentet > 06b Del F > 06a Del F > 05-gap-vs-worldclass.md > 04-research.md > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 5 Tvåstegs-migrationsplan

### 3.1 Mål

Skapa en exekverbar plan från nuvarande Airtable till Airtable 11/10 (post-MK) och därefter till Supabase. Resultatet ska:

1. **Vara konkret nog att exekveras** — Code i en framtida session ska kunna läsa 07 och börja implementera utan att gissa.
2. **Ha rollback per steg** — varje migrationssteg har explicit rollback-väg om något brister.
3. **Använda strangler-fig** — domän-för-domän, inte big bang. Persons innan registrations innan attendances, etc.
4. **Bygga på 06a + 06b** — inte återuppfinna deras leverans, utan sekvensera och fördjupa den.
5. **Lämna future Code-prompt** — en prompt som kan användas av Code i ett separat post-projekt för implementation.

### 3.2 Output

`~/Repon/miranon-media-admin/docs/research/datamodell-research/07-migration-plan.md` — **ny fil**.

Strukturen följer planens §6 Fas 5:

```markdown
# 07 — Tvåstegs-migrationsplan

> **Status:** Fas 5 klar för Gate 5.
> **Källprincip:** Bygger på 06a (A-track) + 06b (S-track). Sekvenserar, fördjupar med validation/rollback/ownership, motsäger inte.

## Del A — Översikt och förutsättningar

### A1 — Tvåstegs-sammanfattning
[Steg 1: Airtable 11/10. Steg 2: Supabase migration. Vad är klart innan respektive steg startar.]

### A2 — Strangler-fig-strategi
[Domän-för-domän. Föreslagen ordning: tenants → persons/identity → events → registrations/attendees → attendances → integration sources → communication outbox → waitlist → stöddomäner → audit/read models.]

### A3 — Globala preconditions
[MK avslutad. A-track passerad. Supabase-projekt skapat. Service-role-credentials säkert hanterade.]

### A4 — Roll- och ägarskapsmatris
[Marcus, Code, Lotta/Roger — vem gör vad i varje steg.]

## Del B — De 10 stegen (planens §6 Fas 5)

### Steg 1 — Pre-MK freeze
### Steg 2 — Post-MK Airtable hardening (= A-tracks driftkritiska + cleanup A1-A8)
### Steg 3 — Airtable cleanup och datakvalitet (= A-tracks A4-A12 plus dokumentation av crosswalk-data för migration)
### Steg 4 — Supabase schema build (= 06b implementeras som SQL/migrations)
### Steg 5 — Data export och transform (= 06b Del F2 transformations-tabellen exekveras per domän)
### Steg 6 — Dry-run migration (= staging-miljö, validation-tester)
### Steg 7 — Parallel run (strangler-fig domän-för-domän)
### Steg 8 — Cutover (sista cutover per domän)
### Steg 9 — Rollback-strategi (separat sektion eftersom rollback är gemensamt över stegen)
### Steg 10 — Post-migration cleanup (Airtable arkiveras, gamla Edge Functions pensioneras)

## Del C — Per-steg-format

[Varje steg i Del B följer samma 8-fältsformat — se §3.3.]

## Del D — Domän-ordning för strangler-fig

[Föreslagen ordning med beroenden. Vilka domäner kan migreras parallellt? Vilka är blockerande för andra?]

## Del E — Crosswalk och ID-mappning

[Hur håller migrationen reda på Airtable record-id ↔ Supabase UUID under parallel run? Crosswalk-tabellens design.]

## Del F — Validation-strategi per steg

[Per steg: vilka tester bevisar att migrationen lyckades? Sample-checks, count-checks, FK-integritet, RLS-isolering.]

## Del G — Rollback-strategi per steg

[Per steg: hur backas det? Vad händer om Steg 7 misslyckas mitt i strangler-fig?]

## Del H — Future Code-prompt

[Utkast till prompt som en framtida Code-session i VSCode kan använda för implementation. Pekar på 06a/06b/07, listar setup-krav, definierar gates.]

## Del I — Öppna frågor till Gate 5

[Vad behöver Marcus besluta innan Code-implementation startar? Vad krävde antagande?]
```

### 3.3 Format per migrationssteg (Steg 1–10 i Del B)

Varje steg ska ha följande 8 fält per planens §6 Fas 5:

| Fält | Innehåll |
|---|---|
| Preconditions | Vad måste vara klart innan detta steg startar |
| Protected records | Vilka records/tabeller får inte röras (MK, andra driftkritiska) |
| Data cleanup | Vilka cleanup-åtgärder krävs i detta steg (referera A1-A12 för Airtable, eller ny för Supabase) |
| Mapping | Airtable tabell/fält → Supabase tabell/kolumn (referera 06b Del F2 där relevant) |
| Transform rules | Normalisering, statusmappning, option cleanup, hash-till-stable-key, etc |
| Validation | Hur vi vet att steget blev korrekt — konkreta tester |
| Rollback | Hur man backar utan att tappa driftdata |
| Ownership | Vem (Marcus, Code, Lotta/Roger) gör vad |

### 3.4 Fyra milstolpar (M1, M2, M3, M4)

| Milstolpe | Leverans | Slut-test |
|---|---|---|
| M1 | Airtable hardening-sekvens (Steg 1–3) | A-tracks 12 åtgärder är integrerade i migrationssekvens med crosswalk-dokumentation |
| M2 | Supabase migration-sekvens (Steg 4–8) | 06b Del F2 transformations-tabellen är fördjupad till exekverbar nivå med strangler-fig-ordning |
| M3 | Validation och rollback (Del F + G + Steg 9) | Varje steg har validation-tester och rollback-väg. Helhetsrollback från olika cutover-punkter definierade |
| M4 | Future Code-prompt + öppna frågor (Del H + I) | En framtida Code-session kan starta utan att läsa hela projektet, bara 07 + 06a + 06b |

### 3.5 Uppdateringar i arbetsdokumentet (löpande)

- **§3 Beslutslogg:** lägg till rad för migrationsbeslut som fattas under Fas 5 (t.ex. strangler-fig-ordning, crosswalk-strategi). Inga nya strategiska beslut förväntas — de borde redan vara fattade i tidigare faser.
- **§6 Spårbarhetsmatris:** kolumnen "Fas 5 (migration)" fylls i för rader där migrationen gör en transform/validation. Inte alla 29 rader behöver Fas 5-åtgärd — vissa är redan stängda i A-track eller låsta i S-track.
- **§9 UNIVERSAL-kandidater:** lägg till nya kandidater om migrations-arbetet avslöjar generaliserbara mönster.
- **§10 Daglig logg:** rader för Fas 5-start och Fas 5-slut.
- **§2 Faser och status:** "PÅGÅR" vid start, **"KLAR — Gate 5"** vid avslut.

### 3.6 Estimat

1,5–2 h fokustid per planen. Mindre än Fas 4b eftersom 06b Del F redan gett ramen — du sekvenserar och fördjupar, inte designar från grunden.

---

## 4. Scratch-persistens-strategi (samma som Fas 3 + 4)

Skapa `~/Repon/miranon-media-admin/.codex-scratch/fas-5-context.md` som första åtgärd efter setup-läsning. `.codex-scratch/` är redan i `.gitignore`. Filen lever genom Fas 5 och raderas vid Gate 5.

Strukturen:

```markdown
# Fas 5 — Codex CLI scratch (raderas vid Gate 5)

## A. A-tracks 12 åtgärder (kortversion av 06a Del A+B+C)
[A1-A12 med typ, gap, sekvens, blast radius. Detta blir steg 2-3 i 07.]

## B. S-tracks 36 tabeller (kortversion av 06b Del A+B+C+D)
[Tabellgrupperingar: tenancy, identity, events, registrations, attendances, integration, communication, waitlist, stöd, audit, read models, integration edges. Detta blir steg 4 i 07.]

## C. 06b Del F2 transformations-tabellen (full)
[Per Airtable-koncept: target-koncept + transformationskrav. Detta blir steg 5 i 07.]

## D. 06b Del F3 öppna frågor till implementation
[Vilka av dessa är Fas 5-beslut, vilka lämnas till Code-implementation.]

## E. Strategiska beslut
[MK-frys, G0.3 soft multi-tenant, DQ4 stable keys, H6 REJECTED, audit före event sourcing.]

## F. 10-stegs planstrukturen från planen §6 Fas 5
[Per steg: 8-fältsformatet preconditions/protected/cleanup/mapping/transform/validation/rollback/ownership.]

## G. UNIVERSAL-kandidater att respektera
[K6 (config-as-data), K7 (gate öppen), K8 (preserve aktivt), K9 (stable keys).]

## H. Gate 5-frågor
```

### Reload-disciplin

När du behöver detaljer som inte finns i scratch-filen — läs originalfilen. Det är billigare än att designa fel sekvens.

### Skriv löpande till disk

Varje milstolpes leverans skrivs till `07-migration-plan.md` direkt. Filen växer milstolpe för milstolpe.

---

## 5. Gate 5 — STOPPA HÄR

Vid Fas 5-slut: rapportera, vänta på godkännande, kör inte vidare till Fas 6.

**Tre frågor Gate 5 ställer (per planen):**

1. Är Airtable 11/10-planen säker att köra efter MK?
2. Är Supabase-planen beroende av arkitekturbeslut som ännu saknas?
3. Kan framtida Code-session exekvera planen utan att gissa?

**Plus tre kompletterande frågor:**

4. Är strangler-fig-ordningen motiverad och beroenden tydliga?
5. Är rollback-vägen från varje steg realistisk — inte bara "starta om"?
6. Är future Code-prompten i Del H tillräckligt detaljerad för att Code ska kunna starta utan att läsa hela projekt-historien?

**Rapportformat:**

```markdown
## Fas 5 — Rapport vid Gate 5

### Levererat
- 07-migration-plan.md: [10 steg + Del C-I, totalt ~N rader]
- Arbetsdokumentet uppdaterat: §3 (eventuella migrationsbeslut), §6 (Fas 5-kolumn), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (KLAR — Gate 5)
- Scratch-fil raderad: [ja/nej]

### Scratch-events
- Reload-events: [antal, vilka filer, varför]
- Oplanerade reloads: [antal, vad som tappats]

### Gate 5-svar (Codex' egen bedömning, inte beslut)
1. Airtable 11/10 säker post-MK: [bedömning + referens till A-tracks blast radius/rollback]
2. Supabase plan-beroenden: [bedömning + lista över saknade arkitekturbeslut, om några]
3. Code-implementerbarhet: [bedömning + 1-2 exempel på vad framtida Code kan börja med direkt]
4. Strangler-fig-ordning: [bedömning + förklaring av domänberoenden]
5. Rollback-realism: [bedömning + svaga punkter]
6. Future Code-prompt: [bedömning + vilka delar av projekt-kontext som behövs minimum]

### Öppna frågor till Marcus + Chat
[Allt som krävde antagande, allt där två vägar var lika rimliga, allt som påverkar Code-implementation]

### Lyft-kandidater för UNIVERSAL
[Nya generaliserbara lärdomar från Fas 5]
```

Inga commits från Codex. Marcus committar efter granskning.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Bygg på, inte uppfinn | 06a Del D (sekvens) och 06b Del F2 (transformations) är ramen. Fas 5 fördjupar dem, motsäger dem inte |
| Strangler-fig-disciplin | Per domän, inte per tabell-bokstav. Beroenden styr ordningen |
| Validation per steg | Varje steg har konkreta tester. "Det ser bra ut" är inte validation |
| Rollback per steg | Varje steg har rollback-väg. "Vi får felsöka om det går snett" är inte rollback |
| Future Code-prompt är leverabel | Del H ska skrivas så att Code kan starta från den utan att läsa 04, 05, 06a, 06b i sin helhet — bara behöva skanna dem |
| Hypotes-status respekteras | H6 REJECTED. H3/H4/H7 DECIDED. Andra hypoteser per arbetsdokumentet |
| Källhänvisning | Faktuella påståenden får källspår: `filnamn:radnummer` |
| Inga skrivoperationer mot Airtable | Inga MCP-anrop alls i Fas 5 — du sekvenserar planen, ändrar inget |
| Inga commits | Inga `git add` / `git commit` / `git push`. Marcus committar |
| Inga ändringar i tidigare faser | 04, 05, 06a, 06b är låsta. Om Fas 5-arbetet avslöjar konflikt — flagga som öppen fråga i Del I, ändra inte källfilerna |
| Stoppa vid Gate 5 | Rapportera, vänta. Inga försök att starta Fas 6 |

---

## 7. Anti-patterns att undvika

Lärdomar från Fas 0–4 plus några specifikt för Fas 5:

| Anti-pattern | Hur du undviker det |
|---|---|
| Återuppfinna 06a eller 06b | A-track är 12 åtgärder med sekvens. S-track är 36 tabeller med transformations-tabell. Fas 5 sekvenserar och fördjupar — den ÄR INTE Fas 4 igen |
| Skriva SQL-DDL i 07 | 07 är plan, inte implementation. SQL-DDL skrivs av Code i ett separat post-projekt. Kolumndefinitioner i 06b räcker som referens |
| Designa migrationsskript | Migrationsskript är implementation. 07 säger VAD som ska migreras och I VILKEN ORDNING, inte HUR i kod |
| Big bang-strategi | Strangler-fig är beslutat. Per-domän-migration med crosswalk under parallel run. Inte cutover all-at-once |
| Smyga in nya gap | Om Fas 5-arbetet upptäcker en lucka som inte är i 05/06a/06b — flagga i Del I, lägg INTE till nytt gap. Det är Gate 5:s jobb att besluta om luckan kräver återgång till tidigare fas |
| Ignorera A-tracks rollback-detaljer | A-track har redan rollback per åtgärd i 06a Del E. Fas 5 ska bygga på dessa, inte återuppfinna dem |
| Tappa K6-disciplinen | Per K6: integration source ≠ lead source. Migrationen transformerar Zapier-hashes till stable integration_source-keys, inte till lead_source-värden |
| Tappa K7-disciplinen | Om 06b Del F3 säger "lämnas till implementation" — fatta inte beslutet i 07 utan Marcus medverkan. Lyft som öppen fråga i Del I istället |
| Tappa K8-disciplinen | Migration av preserve-state är aktivt: namnlösa Personer migreras AKTIVT som legitima leads med rätt lead_state, inte passivt skippas eller markeras "trasig data" |
| Tappa K9-disciplinen | Per K9: stable keys ≠ displaynamn. Migrationen mappar displaynamn (svenska labels) till stable keys (`leadmagnet:kraftfaltet`), inte tvärtom |
| Future Code-prompt utan tillräcklig kontext | Del H ska peka på de 3-4 kärnfilerna Code behöver, definiera setup-krav (Supabase-projekt, service-role, Airtable read-token), och definiera gates som Code måste stoppa vid |
| /compact-försök | Det finns inte i din runtime. Använd scratch-persistens (§4) |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning, i sin helhet. Ta särskilt tid på `06a` Del D + Del E + Del F och `06b` Del F (transformations + lockning).
2. Skapa `.codex-scratch/fas-5-context.md` enligt §4.
3. Uppdatera arbetsdokumentet §10 med rad för Fas 5-start. Uppdatera §2 status PÅGÅR.
4. Skapa `docs/research/datamodell-research/07-migration-plan.md` med skelett enligt §3.2.
5. **M1 — Steg 1–3 (Airtable hardening):** integrera A-tracks 12 åtgärder som steg 2–3 med 8-fältsformatet. Steg 1 är pre-MK freeze (kort). Skriv löpande.
6. **M2 — Steg 4–8 (Supabase migration):** sekvensera 06b Del F2 transformations-tabellen som steg 4–8 med strangler-fig-ordning per Del D. Validation per steg.
7. **M3 — Del F + G + Steg 9 (validation + rollback):** validation-tester per steg, rollback-väg per steg, helhetsrollback från olika cutover-punkter.
8. **M4 — Del H (future Code-prompt) + Del I (öppna frågor):** utkast till Code-prompt med setup-krav, definierade gates, kärnfiler. Öppna frågor som krävde antagande.
9. Uppdatera arbetsdokumentet §6 (Fas 5-kolumn för relevanta rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (KLAR — Gate 5).
10. Skriv Gate 5-rapporten enligt §5.
11. Radera scratch-filen.
12. Stoppa. Vänta på Marcus.

---

*Slut på Fas 5-prompten. När Marcus passerat Gate 5 skapar Claude Chat `fas-6-prompt.md` för slutgranskning, UNIVERSAL-lyft och arkivering. Fas 6 är kort (30 min estimat) och avslutar projektet.*
