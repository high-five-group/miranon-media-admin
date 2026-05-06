# Fas 4b — Supabase Target (S-track), prompt för Codex CLI

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet, principregistret i `04-research.md`, gap-analysen i `05-gap-vs-worldclass.md`, A-track-leveransen i `06a-airtable-redesign.md` och `lessons.md`. Den här filen säger bara: läs dessa, i denna ordning, kör S-track-designen så här, hantera kontexten så här, rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-4b-prompt.md`
> **Skapad:** 2026-04-29 av Claude Chat efter avslutad Fas 4a (Gate 4A passerad)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — **ny session**
> **Avlöser:** `fas-4a-prompt.md` (Fas 4a är klar — A-track låst)
> **Föregår:** `fas-5-prompt.md` (tvåstegs-migrationsplan — skapas av Claude Chat efter Gate 4B passerats)

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, designa S-track, skriva på disk, rapportera | **Du (Codex CLI)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 4B (§5) och rapporterar — kör inte vidare till Fas 5 på eget initiativ.

---

## 1.5 Status vid Fas 4b-start (för ny session)

Du läser denna prompt i en **ny Codex CLI-session**. Tidigare sessioners kontext är borta. Här är det du behöver veta innan du läser källfilerna:

**Levererat hittills:**
- **Fas 0 (KLAR):** Direktiv, 7-fasplan, arbetsdokument med 29 spårbarhetsrader.
- **Fas 1 (KLAR — Gate 1 passerad):** `analys/04-research.md` Del 0 — Baseline & Constraint Map.
- **Fas 2 (KLAR — Gate 2 passerad):** `analys/04-research.md` Del 1 — 10 principer P1–P10 + R7 stickprov.
- **Fas 3 (KLAR — Gate 3 passerad):** `analys/05-gap-vs-worldclass.md` — 15 gap (G1–G15) + DS/DQ/H-matris + prioriteringskarta.
- **Fas 4a (KLAR — Gate 4A passerad):** `analys/06a-airtable-redesign.md` — 12 A-track-åtgärder (A1–A12). Inter-fas-kontrakt till S-track tydligt.

**Strukturbeslut för Fas 4 (taget mellan Fas 3 och 4):**
- Fas 4 splittas i 4a (A-track, klar) + 4b (S-track, denna prompt) med två gates. Avviker från planens "en gate per fas" men bevarar planens output-filer (`06a` + `06b`) och inter-fas-kontraktet till Fas 5.

**Strategiska beslut bekräftade vid Fas 4b-start:**
- **G0.3 = SOFT MULTI-TENANT** (beslutat av Marcus 2026-04-29). S-track designas med `tenant_id` + RLS från dag ett.
- **DQ4/G11 stable keys** (beslutat av Marcus 2026-04-29 vid Gate 4A): Integration source-keys ska vara stable identifiers (`leadmagnet:kraftfaltet`-format), inte svenska displaynamn. Detta gäller inte bara Zap 5/6 utan ska vara **princip för all integration source-modellering i S-track**: stable keys är primary identifiers, displaynamn är översättningslager.
- **"Just nu"-beslutsmodellen är godkänd:** medvetna beslut med tydlig escape-väg är bättre än evigt undvikande. Soft multi-tenant kan nedgraderas (ignorera tenant_id) eller uppgraderas (schema-prefix per tenant) utan total omdesign. Tillämpa samma princip på andra S-track-beslut: ge framtiden valmöjligheter, men fatta beslut nu.

**Viktiga beslut och korrigeringar att hålla i huvudet:**
- **H6 är REJECTED.** Hashvärdena är Zapier-config (Zap 5+6), inte form-input. S-track ska modellera `integration_source` separat från `lead_source` per K6-disciplin.
- **DQ4 omklassad** till "config-as-data drift". A-track gör cleanup. S-track ska modellera integration source/config som typed entitet med stable keys.
- **DS6/DQ7/H4 (record-id-formler)** är klassade som S-track. A-track har INTE försökt fixa dem i Airtable. S-track bygger riktiga FK från länkrelationer/exports, inte från display-formler.
- **MK-frys har ingen direkt påverkan på S-track-design.** S-track designar target — själva implementationen och migrationen kommer i Fas 5. Men: 06b ska inte göra antaganden om Airtable-ändringar som A-track inte har gjort.

**UNIVERSAL-kandidater från Fas 0–4a (i arbetsdokumentet §9):**
- K1–K5: tooling/secrets/diagnostik (gäller dig som operator)
- K6: Config-as-data drift ska klassas vid integrationskanten — gäller integration source-modelleringen i S-track
- K7: "Rekommendation i arbetsdokument är inte beslut när gate är öppen" — gäller dig: gör inga val som logiskt borde vänta på Marcus
- K8: Preserve är ett aktivt guardrail-beslut, inte utebliven åtgärd — gäller även S-track: preserve-mönster i target-design ska ha rationale

**Lärdom om din egen runtime (från Fas 2 §10):**
- Codex CLI har **ingen `/compact`-subcommand**. Compact-disciplin körs via scratch-persistens + reload. Se §4 nedan.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 4 S-track**
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet**

**Indata för Fas 4b — kärnmaterialet:**

7. `~/Repon/miranon-media-admin/analys/04-research.md` — principregistret P1–P10 + R7 stickprov
8. `~/Repon/miranon-media-admin/analys/05-gap-vs-worldclass.md` — gap-analysen
9. `~/Repon/miranon-media-admin/analys/06a-airtable-redesign.md` — **A-track-leveransen, läs särskilt Del F (inter-fas-kontrakt)**

**Frusen indata:**

10. `~/Repon/miranon-media-admin/docs/reference/data-model.md`
11. `~/Repon/miranon-media-admin/docs/reference/hur-systemet-funkar.md`
12. `~/Repon/miranon-media-admin/analys/01-extraction.md`
13. `~/Repon/miranon-media-admin/analys/02-live-state.md`
14. `~/Repon/miranon-media-admin/analys/03-gap-analysis.md`
15. `~/Repon/miranon-media-admin/docs/conversion-plan.md`

**Föregående fas-prompter (för disciplin- och stilkonsistens):**

16. `~/Repon/miranon-media-admin/tasks/sessions/fas-4a-prompt.md`

**Total: ~10 500 rader.** Med 400K kontextfönster får allt plats. Använd scratch-persistens (§4).

**Källprioritet vid konflikt:** Live-state (frusen i Del 0) > arbetsdokumentet > 06a-airtable-redesign.md Del F > 05-gap-vs-worldclass.md > 04-research.md > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 4b S-track Supabase Target

### 3.1 Mål

Designa Supabase-målmodellen från grunden — den datamodell som Miranon migrerar TILL när A-track är genomfört och Supabase-implementationen påbörjas. Resultatet ska:

1. **Vara constraint-backed och relationellt korrekt** — inte en mekanisk avbildning av Airtable, utan en modell som adresserar S-track-klassade gap från `05-gap-vs-worldclass.md`.
2. **Ha soft multi-tenant från dag ett** — `tenant_id` på alla domäntabeller, RLS-policies, tenant-aware indexering.
3. **Modellera integration edges som produkter** — Zapier-källor, Edge Functions, framtida ingest-endpoints är typed entiteter med stable keys, inte ad hoc-config.
4. **Bevara legitima Airtable-mönster som A-track låst** — namnlösa leads som lead-state, RIM3x-pattern som read model, Återkommande?-semantik (under nytt namn).
5. **Lämna inter-fas-kontrakt till Fas 5** — vilka transformationer migrationen behöver, vilka beslut är låsta, vad är defer:at till implementation.

### 3.2 Output

`~/Repon/miranon-media-admin/analys/06b-supabase-target.md` — **ny fil**.

Strukturen:

```markdown
# 06b — Supabase Target (S-track)

> **Status:** Fas 4b (S-track) klar för Gate 4B.
> **Källprincip:** S-track adresserar gap som har Supabase-klass i 05-gap-vs-worldclass.md Del C plus migration transform-klassningar i Del B. Soft multi-tenant från dag ett. Stable keys för integration sources.

## Del A — Tenancy och säkerhetsmodell

### A1 — `tenants`-tabellen och tenant-livscykel
### A2 — RLS-policies (mönster, inte uttömmande SQL)
### A3 — Auth/auktorisering (Supabase Auth + tenant-membership)
### A4 — Service-role vs user-role separation

## Del B — Domänmodell

### B1 — Identity & Persons
[Adresserar G1, G2, H2, DQ5/H12, DQ6. Identity cluster-mönster, lead/person-lifecycle, typed identifiers.]
### B2 — Events & Eventplanering
[Adresserar G9, H3, H13. Event identity, ingest config, EventKey-ersättning.]
### B3 — Anmälningar & Deltaganden
[Adresserar G7, DS6, DQ7, H4. Riktiga FK från länkar, inte record-id-formler.]
### B4 — Integration Sources & Lead Magnets
[Adresserar G11/DQ4. Stable keys (`leadmagnet:kraftfaltet`-format), separation från lead_source.]
### B5 — Communication, Mail State & Outbox
[Adresserar G12/DQ8. Transactional outbox-mönster eller motsvarande för partial-success-synlighet.]
### B6 — Waitlist & Conversion
[Adresserar G13/DQ9. Idempotent move-operation som transaktion i target.]
### B7 — Stöddomäner
[Touchpoints, Engagemang, Hämtade erbjudanden — bevara semantik, modernisera struktur.]

## Del C — Audit, observability och read models

### C1 — Audit-modell
[Adresserar P5, DS7, G15. Audit före event sourcing per planens G0.2-beslut.]
### C2 — Read models och derivat
[Adresserar G8, H8, H9. RIM3x-pattern bevarat, canonical counts, dead branches eliminerade.]
### C3 — Operational visibility
[Adresserar P7. Vad operatörer ska kunna se i target.]

## Del D — Integration edges som produkter

### D1 — Zapier-ingest-pattern (eller ersättning)
[Adresserar G14, H7, K6. Stable keys, idempotency, request-logg, ownership.]
### D2 — Edge Functions / Webhooks
[Vad blir Edge Functions i target? Vilka är ingest, vilka är derived/read?]
### D3 — Resend / mail-side effects
[Hur modelleras outbound communication i target.]

## Del E — Naming, conventions och stable keys

### E1 — Tabellnamn, kolumnnamn, snake_case-konventioner
### E2 — Stable keys för domain entities (ej databas-IDs, utan domain-IDs)
### E3 — Översättningslager mellan stable keys och displaynamn

## Del F — Inter-fas-kontrakt till Fas 5 (migration)

### F1 — Vad S-track låser för migrationen
### F2 — Vilka transformationer migrationen behöver göra
### F3 — Vilka frågor lämnas till implementation
### F4 — Mappning av A-tracks Del F-lockning till S-track-design

## Del G — Öppna frågor till Gate 4B
[Allt som krävde antagande, allt där två principer pekade olika håll, allt som beror på beslut Marcus inte fattat än.]
```

### 3.3 Format per S-track-tabelldefinition

Varje konkret tabell ska ha:

| Fält | Innehåll |
|---|---|
| Tabellnamn | snake_case, t.ex. `persons`, `registrations`, `integration_sources` |
| Syfte | En mening som förklarar tabellens roll i domänmodellen |
| Adresserar gap/DS/DQ/H | Vilka rader från Fas 3-matrisen denna tabell hanterar |
| Princip-koppling | Vilka av P1–P10 styr designen |
| Kolumner (kärna) | Lista med namn + typ + constraint, inte uttömmande SQL — kärnan räcker |
| Tenant-strategi | Har `tenant_id` (default ja för domäntabeller) eller är global (`tenants`, system-tabeller) |
| RLS-mönster | Vilken RLS-policy gäller (per-tenant-isolation, service-role-only, public-read, etc) |
| Stable key | Om tabellen har domain-ID separat från `id` (UUID PK), specifiera format |
| FK-relationer | Vilka relationer till andra tabeller |
| Index-överväganden | Tenant-aware composite indexes, sökindex för identifiers |
| Skiftet från Airtable | Vad ändras semantiskt jämfört med nuvarande Airtable-modell |
| Spårbarhet | Källrader i 05-gap-vs-worldclass.md eller 04-research.md |

**Du behöver inte definiera varje stöddomän i full detalj.** Kärnan är A1–A4 (tenancy), B1–B6 (huvuddomänerna), C1 (audit), D1 (Zapier-ingest). B7, C2, C3, D2, D3 kan vara mer summariska om de inte introducerar nya designval.

### 3.4 Tre milstolpar (M1, M2, M3)

| Milstolpe | Leverans | Slut-test |
|---|---|---|
| M1 | Tenancy-modell + huvuddomäner (Del A + Del B kärnan: B1, B2, B3, B4) | Soft multi-tenant är konsekvent. Identity, events, registrations, integration sources har var sin definition |
| M2 | Resterande domän + audit + integrations (Del B5-B7, Del C, Del D) | Communication-outbox + waitlist-conversion definierade. Audit-modell tydlig. Zapier-ingest-pattern beskrivet |
| M3 | Naming, inter-fas-kontrakt, öppna frågor (Del E + F + G) | Konventioner explicit. Fas 5 kan starta från detta utan att gå tillbaka |

### 3.5 Uppdateringar i arbetsdokumentet (löpande)

- **§3 Beslutslogg:** lägg till rad för 2026-04-29: DQ4 stable keys-format beslutat (`leadmagnet:kraftfaltet`-mönster). Konsekvens: gäller alla integration sources i S-track, inte bara Zap 5/6.
- **§6 Spårbarhetsmatris:** kolumnen "Fas 4 (åtgärd)" fylls i för rader där S-track gör en åtgärd. A-track har redan fyllt i sina rader.
- **§9 UNIVERSAL-kandidater:** lägg till nya kandidater om S-track-arbetet avslöjar generaliserbara mönster.
- **§10 Daglig logg:** rader för Fas 4b-start och Fas 4b-slut.
- **§2 Faser och status:** "PÅGÅR — Gate 4A klar, 4b pågår" vid start, **"KLAR — Gate 4B"** vid avslut (då är hela Fas 4 klar).

### 3.6 Estimat

2–2,5 h fokustid. Större halvan av Fas 4-totalt (3,5–4 h enligt planen) eftersom S-track är design från grunden, inte cleanup.

---

## 4. Scratch-persistens-strategi (samma som Fas 3 + 4a)

Skapa `~/Repon/miranon-media-admin/.codex-scratch/fas-4b-context.md` som första åtgärd efter setup-läsning. `.codex-scratch/` är redan i `.gitignore`. Filen lever genom Fas 4b och raderas vid Gate 4B.

Strukturen:

```markdown
# Fas 4b — Codex CLI scratch (raderas vid Gate 4B)

## A. Principregistret P1–P10 (kortversion)
## B. Gap-prioriteringskartan, S-track-fokus
[G1, G2, G7, G9, G14 (target-implikation), DS6, DQ5, DQ7, H2, H3, H4, H7, H12, H13. Plus migration transform-rader: DQ1, DQ4, DQ5, H12.]
## C. A-tracks Del F-lockning (vad är låst)
[Namnlösa leads = legitim state. Återkommande?-semantik. RIM3x = read model. DQ4 = Zapier-config. G12/G13 = transactional/audit. DS6/DQ7/H4 = ej Airtable-fixade.]
## D. G0.3-beslut (soft multi-tenant)
[tenant_id på alla domäntabeller. RLS-policies per tabell. Indexering: (tenant_id, ...).]
## E. DQ4 stable keys-beslut
[Format: `leadmagnet:kraftfaltet`. Princip: stable keys är primary identifiers, displaynamn är översättningslager. Gäller alla integration sources.]
## F. R7-fynd som rör S-track
[Cal.com: idempotency_key, BookingStatus enum, attendee separat. Plane.so: explicit state-tabell, join tables, audit/webhook-log med uniqueness constraints. NocoDB: schema/config som typed metadata.]
## G. Off-limits / scope-gränser
[06b designar target. Implementation och migrationsmekanismer hör till Fas 5. SQL-DDL behöver inte vara komplett — kärna räcker.]
## H. Gate 4B-frågor
```

### Reload-disciplin

När du behöver detaljer som inte finns i scratch-filen — läs originalfilen. Det är billigare än att designa fel.

### Skriv löpande till disk

Varje milstolpes leverans skrivs till `06b-supabase-target.md` direkt. Filen växer milstolpe för milstolpe.

---

## 5. Gate 4B — STOPPA HÄR

Vid Fas 4b-slut: rapportera, vänta på godkännande, kör inte vidare till Fas 5.

**Sex frågor Gate 4B ställer:**

1. Är soft multi-tenant konsekvent applicerat? Har varje domäntabell `tenant_id` med RLS-policy? Är det escape-vägen till single-/hard multi-tenant tydlig?
2. Är integration sources modellerade som produkter? Stable keys, idempotency, ownership?
3. Är audit-modellen "audit före event sourcing" enligt G0.2? Inte event sourcing-implementering, men tillräcklig för operational visibility?
4. Är det tydligt vad migrationen i Fas 5 ska transformera? Inter-fas-kontraktet i Del F otvetydigt?
5. Har A-tracks Del F-lockning respekterats? Inga konflikter med 06a:s preserve/cleanup-beslut?
6. Är 06b implementerbart utan att gå tillbaka? Kan en Supabase-implementatör läsa detta och starta utan stora frågetecken?

**Rapportformat:**

```markdown
## Fas 4b — Rapport vid Gate 4B

### Levererat
- 06b-supabase-target.md: [X tabeller fördelade på Del A (Y), Del B (Z), Del C (W), Del D (V), plus E/F/G]
- Arbetsdokumentet uppdaterat: §3 (DQ4 stable keys), §6 (Fas 4-kolumn för S-track-rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (Fas 4 KLAR — Gate 4B)
- Scratch-fil raderad: [ja/nej]

### Scratch-events
- Reload-events: [antal, vilka filer, varför]
- Oplanerade reloads: [antal, vad som tappats]

### Gate 4B-svar (Codex' egen bedömning, inte beslut)
1. Soft multi-tenant-konsekvens: [bedömning + räkning av domäntabeller med tenant_id]
2. Integration sources som produkter: [bedömning + 1-2 exempel]
3. Audit-modell: [bedömning + förhållande till event sourcing-skip-beslutet]
4. Inter-fas-kontrakt till Fas 5: [bedömning + lista över transformationer som krävs]
5. A-track-respekt: [explicit bekräftelse — inga konflikter med 06a Del F]
6. Implementerbarhet: [bedömning + svaga punkter]

### Öppna frågor till Marcus + Chat
[Allt som krävde antagande, allt där designvägar har trade-offs, allt som påverkar Fas 5-implementation]

### Lyft-kandidater för UNIVERSAL
[Nya generaliserbara lärdomar från Fas 4b]
```

Inga commits från Codex. Marcus committar efter granskning.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Princip-koppling per tabell | Varje tabell måste peka tillbaka på minst ett gap (G-id) eller minst en princip (P1–P10). Saknas det — tabellen är för lös, motivera eller skär bort |
| Soft multi-tenant från dag ett | `tenant_id` (UUID FK till `tenants`) på alla domäntabeller. RLS-policies. Composite indexes startar med `tenant_id`. Inga undantag utom uttalat globala tabeller |
| Stable keys för domain entities | Domain-IDs (`leadmagnet:kraftfaltet`, `event:psionautics-2026-summer`) separata från databas-PKs. Slugs eller composite identifiers, inte UUID i UI/integration-lager |
| K6-disciplin för integration sources | Per K6: integration source är inte lead source. Modellera separat. `integration_sources` har stable keys, ownership, status. `lead_sources` är domain-koncept (organic, leadmagnet, referral) |
| Audit före event sourcing | Per G0.2: audit-tabell eller per-tabell `created_by`/`updated_by`/`*_at` + change-log för känsliga tabeller. Inte event sourcing — det är defer:at |
| Hypotes-status respekteras | H6 REJECTED, H3/H4/H7 DECIDED. H2 öppen för avgörande i S-track. Andra hypoteser per arbetsdokumentet |
| Källhänvisning | Faktuella påståenden får källspår: `filnamn:radnummer` |
| Inga skrivoperationer mot Airtable | Inga MCP-anrop alls i Fas 4b — du designar target, inte verifierar source |
| Inga commits | Inga `git add` / `git commit` / `git push`. Marcus committar |
| Inga ändringar i tidigare faser | 04-, 05-, 06a-filerna är låsta. Om S-track-arbetet avslöjar konflikt — flagga som öppen fråga i Del G, ändra inte källfilerna |
| Stoppa vid Gate 4B | Rapportera, vänta. Inga försök att starta Fas 5 |

---

## 7. Anti-patterns att undvika

Lärdomar från Fas 0–4a plus några specifikt för S-track:

| Anti-pattern | Hur du undviker det |
|---|---|
| Mekanisk Airtable-avbildning | S-track är inte "samma tabeller som Airtable men i Postgres". Det är en domänmodell. Om en S-track-tabell har 1:1-mappning mot Airtable utan designreflektion — du har missat poängen |
| Designa hard multi-tenant av misstag | Soft multi-tenant betyder `tenant_id`-kolumn + RLS, inte schema-prefix per tenant. Om du föreslår `tenant1.persons` / `tenant2.persons`-schemas — det är hard multi-tenant, inte vad som beslutats |
| Tappa stable keys-disciplinen | Per beslutet: integration sources har stable keys (`leadmagnet:kraftfaltet`). Detta är **princip för all integration source-modellering** i S-track, inte bara Zap 5/6. Tillämpa konsekvent |
| Återuppliva REJECTED hypoteser | H6 är stängd. `integration_sources` modelleras enligt K6. Inga form-input-hypoteser |
| Designa för full event sourcing | Per G0.2: audit före event sourcing. Audit räcker för operational visibility. Event sourcing är defer:at och inte målet i 06b |
| Konflikt med A-tracks Del F | A-track har låst: namnlösa leads = legitima, RIM3x = read model, Återkommande?-semantik bevaras. S-track ska bygga på dessa, inte motsäga dem |
| Designa migrationsmekanismer | 06b designar target. Migration-mekanismer (mappning, transformation, timing) hör till Fas 5. S-track säger VAD som måste transformeras, inte HUR |
| Smyga in implementation-detaljer | 06b är design, inte SQL-DDL. Kolumndefinitioner med typ + constraint räcker — uttömmande CREATE TABLE-statements är onödigt och låser implementation för tidigt |
| Tappa K7-disciplinen | Beslut som inte är fattade ska inte smyg-fattas. T.ex. om "ska Webhook-typed events ha en separat events-tabell?" inte är beslutat — flagga som öppen fråga, fatta inte beslutet i 06b utan Marcus medverkan |
| Tappa K8-disciplinen | Preserve-beslut i target-design ska ha rationale. Om en mönster bevaras (t.ex. RIM3x som read model i target) — motivera varför aktivt, inte passivt |
| Tappa Cal.com/Plane.so/NocoDB-läxorna | R7-stickproven gav konkreta designupphämtningar. Cal.com:s `idempotencyKey`, Plane.so:s explicit state-tabell + audit-log, NocoDB:s metadata-as-data. Använd där relevant — men kopiera inte mekaniskt |
| /compact-försök | Det finns inte i din runtime. Använd scratch-persistens (§4) |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning, i sin helhet. Ta särskilt tid på `06a-airtable-redesign.md` Del F (inter-fas-kontraktet) och `04-research.md` R7 (stickproven).
2. Skapa `.codex-scratch/fas-4b-context.md` enligt §4.
3. Uppdatera arbetsdokumentet §3 Beslutslogg med DQ4 stable keys (Marcus 2026-04-29). Uppdatera §10 med rad för Fas 4b-start. Uppdatera §2 status.
4. Skapa `analys/06b-supabase-target.md` med skelett enligt §3.2.
5. **M1 — Del A (tenancy) + Del B kärnan (B1-B4):** designa tenants-tabell, RLS-mönster, identity & persons, events, registrations & deltaganden, integration sources. Skriv löpande.
6. **M2 — Del B5-B7 + Del C + Del D:** communication/outbox, waitlist, stöddomäner, audit, observability, integration edges som produkter.
7. **M3 — Del E + F + G:** naming-konventioner, inter-fas-kontrakt till Fas 5, öppna frågor.
8. Uppdatera arbetsdokumentet §6 (Fas 4-kolumn för S-track-rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (Fas 4 KLAR — Gate 4B).
9. Skriv Gate 4B-rapporten enligt §5.
10. Radera scratch-filen.
11. Stoppa. Vänta på Marcus.

---

*Slut på Fas 4b-prompten. När Marcus passerat Gate 4B är hela Fas 4 klar och Claude Chat skapar `fas-5-prompt.md` för tvåstegs-migrationsplan.*
