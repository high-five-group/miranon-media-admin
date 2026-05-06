# Datamodell-research-projekt — plan

> **Status:** Förslag för genomprat. Skapad 2026-04-28.
> **Bas:** Codex' tvåstegsstrategi + Claude Chats ramning + processdisciplin från datamodell-110.
> Inga schemaändringar, inga commits, ingen migration ingår i denna planfas.

---

## 1. Vad detta projekt är

Det här projektet följer på datamodell-110, där dokumentationen av den befintliga
Airtable-modellen lyftes till 11/10 (1 334 rader, 30 kända fällor, 11 luckor,
12 hypoteser).

Den nya frågan är:

> Är själva modellen 11/10, eller bara dokumentationen av den?

Projektet drivs i **två steg**:

1. **Airtable 11/10 först.** Nuvarande Airtable-system ska bli exceptionellt bra
   som skarpt driftssystem: tydligare schema, bättre datakvalitet, färre döda
   fält, säkrare automationer, bättre statusmodeller, bättre operativ ergonomi
   för Lotta/Roger/Marcus.

2. **Supabase sedan.** Supabase är definitiv målplattform, men migrationen ska
   ske *från en sanerad och förstådd Airtable-modell*, inte från en modell full
   av historiska kompromisser.

Detta projekt levererar research, gap-analys, designförslag och plan. Det
implementerar ingenting.

### Varför två steg och inte ett

Min första instinkt var att gå direkt mot Supabase-modellen och behandla
Airtable-skulderna som "löses i migrationen". Det var fel. Två skäl:

| Skäl | Konsekvens |
|---|---|
| **Modellen lever i Airtable månader till** | DS1 (Inställt räknas som aktivt) drabbar Lotta i rapporter idag. Att vänta tills migration är att låta en bug bita i 6+ månader. |
| **Migration från sanerad modell är säkrare** | Du migrerar inte skuld, du migrerar modell. Datakvalitetsfel som DQ1 (case-dubletter) får inte överleva exporten. |

Detta är projektets strategiska kärna. Allt annat följer från den.

---

## 2. Beyond best practice — vad som skiljer detta från en vanlig research-plan

11/10 gäller alltid. För en research- och designplan betyder det följande
disciplin utöver vanliga gates och faser:

| Beyond-best-practice-element | Vad det betyder konkret |
|---|---|
| **Spårbarhetsmatris (§9)** | Varje DS/DQ/hypotes har en rad som följer den genom alla faser. Ingen tappas. |
| **Anti-patterns (§10)** | Explicit lista över designval vi *inte* gör utan stark motivering. Förhindrar drift. |
| **Operationaliserade universal-lärdomar (§11)** | De 6 lärdomarna från 2026-04-28 är kopplade till konkreta arbetsmoment per fas. Inte bara "nämnda". |
| **Inter-fas-kontrakt** | Varje fas slut definierar exakt vad som överlämnas till nästa. Otydlig överlämning = fas inte klar. |
| **Gate-failure-protokoll (§15)** | Definierat vad som händer när en gate underkänns. Ingen ad hoc-omplanering. |
| **Levande arbetsdokument** | Separat fil i `tasks/sessions/` som lever genom hela projektet (dm-110-mönstret). Planen är styrning, arbetsdokumentet är operativt. |
| **Källspårbarhet på påstående-nivå** | Varje påstående i 04–07 ska kunna spåras till källa (URL, fil-rad, MCP-anrop, kodkommentar). dm-110-mönstret. |
| **Empirisk parallell-läsning** | Vid tvivel om Airtable-beteende: testa mot live-bas, inte mot dokumentation. RECORD_ID-buggen från dm-110 hade aldrig hittats utan detta. |

---

## 3. Grundpremisser

| Premiss | Konsekvens |
|---|---|
| MK-eventet 1–3 maj 2026 är skarp drift | Inga schemaändringar i Airtable under MK-perioden |
| Airtable är aktivt driftssystem | Airtable-förbättringar måste vara säkra, sekvenserade och reversibla |
| Supabase är definitiv målplattform | Designen ska inte låsa fast oss i Airtable-kompromisser |
| `docs/reference/data-model.md` är frusen indata | Vi läser den, men skriver inte om den i detta projekt |
| Faktisk migration sker senare | `07-migration-plan.md` ska kunna lämnas till framtida Code-session |
| Affärslogik ska bevaras | Allt i `docs/reference/hur-systemet-funkar.md` ska fungera även efter redesign |
| DS1–DS6, DQ1–DQ9 och 12 hypoteser ska adresseras | Varje punkt får explicit klassning enligt §8 |
| `SupabaseAdapter`-skelettet finns redan i koden | Strangler-fig-migration är förvald över big-bang |

---

## 4. Källhierarki

### Primära källor (måste-läsa innan Fas 1)

| Källa | Roll |
|---|---|
| `tasks/datamodell-research-direktiv.md` | Scope, mål, output, avgränsningar |
| `docs/reference/data-model.md` (1 334 r) | Frusen sanning om nuvarande Airtable-modell |
| `docs/reference/hur-systemet-funkar.md` (282 r) | Affärslogik som ska bevaras |
| `analys/01-extraction.md` (964 r) | Källextraktion från datamodell-110 |
| `analys/02-live-state.md` (726 r) | Live-state-snapshot 2026-04-28 |
| `analys/03-gap-analysis.md` (~600 r) | Mall för gap-analysens struktur |
| `tasks/sessions/2026-04-28-datamodell-110-projekt.md` | Processmönster: faser, gates, hypotesdisciplin |
| `docs/conversion-plan.md` | Befintlig Vue → React-plan + Supabase-förberedelse |
| `marcus-system/tasks/lessons.md` | 6 universal-lärdomar från 2026-04-28 |

### Källprinciper

| Princip | Tillämpning |
|---|---|
| Live-state vinner över dokumenterad state | Vid kollision: anta att basen har rätt och uppdatera tolkningen |
| Dokumentation är baseline, inte garanti | `data-model.md` är 11/10 dokumentation, men modellen kan ändå ha skuld |
| Hypoteser markeras explicit | Inga designbeslut byggs på omarkerade antaganden — använd statusen i §7 |
| Marcus' driftkunskap är förstaklass-data | När operativ verklighet och teknisk elegans skaver: synliggör konflikten, lös inte tyst |
| Research ska bli beslutsbar | `04-research.md` får inte bli en lös best-practice-samling — varje princip ska kunna bedöma något i §6 |
| Empirisk parallell-läsning | Vid tvivel om beteende: testa mot live-bas innan slutsats dras |

---

## 5. Output-artefakter

Alla filer i `~/Repon/miranon-media-admin/analys/` om inget annat anges.

| Fil | Innehåll | Levereras i fas |
|---|---|---|
| `04-research.md` | Världsklass-principer för operativa Airtable-system OCH Supabase/relationsdatabaser | Fas 2 |
| `05-gap-vs-worldclass.md` | Nuvarande modell jämförd mot principerna; Airtable- och Supabase-kolumn per gap | Fas 3 |
| `06a-airtable-redesign.md` | Airtable 11/10-förslag — schema, status, automationer, cleanup, observability | Fas 4 (A-track) |
| `06b-supabase-target.md` | Supabase-målmodell — DDL, constraints, RLS, audit, automation replacement | Fas 4 (S-track) |
| `07-migration-plan.md` | Tvåstegsplan: Airtable hardening först, Supabase-migration sedan | Fas 5 |

**Notera:** Direktivet listar `06-redesign-proposal.md` som en fil. Vi splittar
den till 06a + 06b av läsbarhetsskäl — varje del blir 800+ rader och en sammanslagen
fil hade landat på ~1 600 rader vilket urholkar Discovery-test-värdet. Direktivets
intention bevaras (en sammanhängande designleverans i två delar).

### Arbetsdokument (lever genom hela projektet)

| Fil | Plats | Roll |
|---|---|---|
| `2026-04-XX-datamodell-research-projekt.md` | `~/Repon/miranon-media-admin/tasks/sessions/` | Beslut, hypoteser, öppna frågor, daglig logg |

Skapas vid Fas 0-start, arkiveras (status frusen) vid Fas 6-avslut. Samma mönster
som dm-110:s arbetsdokument.

---

## 6. Projektets faser

Sju faser (0–6). Inom Fas 4 finns två parallella spår: A-track (Airtable) och
S-track (Supabase). Sju faser totalt — inte åtta — eftersom Codex' Fas 4+5
slogs ihop till en designfas med två milstolpsspår.

### Översikt

| Fas | Namn | Output | Estimat | Driver |
|---|---|---|---|---|
| 0 | Ramning & projektprotokoll | Godkänd plan + arbetsdokument | 30–45 min | Chat + Marcus |
| 1 | Baseline & Constraint Map | Baseline-sammanfattning (i 04 eller appendix) | 1 h | Chat |
| 2 | Worldclass Research | `04-research.md` | 1,5–2 h | Chat + web search |
| 3 | Gap vs Worldclass | `05-gap-vs-worldclass.md` | 1,5 h | Chat |
| 4 | Redesign (A-track + S-track) | `06a-airtable-redesign.md` + `06b-supabase-target.md` | 3,5–4 h | Chat + ev. Code |
| 5 | Tvåstegs-migrationsplan | `07-migration-plan.md` | 1,5–2 h | Chat + Code |
| 6 | Slutgranskning | Validerings-pass + UNIVERSAL-lyft + arkivering | 30 min | Chat + Code |

**Totalt: 9,5–11,5 h fokustid.** Ryms inom 2–3 fokuserade sessioner.

---

### Fas 0 — Ramning & projektprotokoll

**Mål:** Spika arbetssättet OCH de strategiska valen som styr research-scopet,
innan research börjar.

**Output:**
- Godkänd plan (denna fil eller revision)
- Arbetsdokument i `tasks/sessions/` skapat med initial struktur
- Beslut på G0-frågorna nedan dokumenterade

**Arbete:**
1. Bekräfta tvåstegsstrategin (Airtable 11/10 först, Supabase sedan)
2. Bekräfta att projektet är research/design/plan, inte implementation
3. Sätt hypotesregister-format (§7)
4. Sätt DS/DQ-beslutsmatris (§8)
5. Sätt MK-säkerhetsregel: inga schemaändringar 1–3 maj 2026
6. Klassificera de 21 öppna trådarna initialt (DS/DQ/hypoteser) — preliminärt,
   detaljbeslut kommer i Fas 3
7. Besvara G0.1–G0.3 (research-scope-frågor)

**Gate 0:**

| ID | Fråga | Beslut som behövs |
|---|---|---|
| Plan-1 | Är tvåstegsstrategin korrekt? | Ja/nej |
| Plan-2 | Är output-filerna rätt (5 filer, 06 splittad i a+b)? | Ja/justera |
| Plan-3 | Ska planen leva i `tasks/` och output i `analys/`? | Ja/justera |
| Plan-4 | Vilka ändringar är absolut förbjudna under projektet? | Bekräfta |
| **G0.1** | **Räcker textbaserad research, eller stickprov mot konkreta scheman från öppen källkod (Cal.com, Plane.so, NocoDB)?** | Min rekommendation: ja, minst 2–3 stickprov. Konkreta scheman slår abstrakta principer för migrationsplanering. |
| **G0.2** | **Hur djup går vi på event sourcing/CQRS?** | Min rekommendation: utvärdera, sannolikt skip. Audit-logg + immutable history räcker för era behov. Komplexitet för komplexitet är inte 11/10. |
| **G0.3** | **Multi-tenant ready (för Passionslyftet, Maxat Event, framtida produkter)?** | Strategiskt beslut med stor schema-påverkan. Behövs innan Fas 2 — annars riskerar S-track att designas om. |

**Inter-fas-kontrakt → Fas 1:**
- Godkänd plan (denna fil)
- Beslut på G0.1, G0.2, G0.3 dokumenterade
- Arbetsdokument finns i `tasks/sessions/` med tom hypotes-tabell, tom DS/DQ-matris, tom logg

---

### Fas 1 — Baseline & Constraint Map

**Mål:** Designbar sammanfattning av nuvarande modell, utan ny extraktion.
`data-model.md` är frusen indata — vi destillerar den till en form som är
användbar i gap-analysen.

**Output:** Baseline-sektion i `04-research.md` (eller appendix om den blir stor).

**Arbete:**
- Sammanfatta kärnmodellen: Personer, Anmälningar, Deltaganden
- Sammanfatta stödmodeller: Event, Väntelista, Lead magnets, Touchpoints, Bulkmail, systemtabeller
- Lista hårda constraints från drift: MK, Lotta-workflows, Edge Functions, A1–A11, Resend-flöden
- Lista DS1–DS6 och DQ1–DQ9 som design-input
- Lista de 12 öppna hypoteserna från `data-model.md`/dm-110

**Milstolpar:**

| Milstolpe | Leverans |
|---|---|
| B1 | Domänkarta: vilka objekt finns och varför |
| B2 | Driftkarta: vilka workflows får inte brytas |
| B3 | Skuldregister: DS/DQ/hypoteser populerade i arbetsdokumentet |

**Gate 1:**

| Fråga | Varför den gatear |
|---|---|
| Är `data-model.md` tillräcklig som frusen baseline? | Om inte krävs MCP-verifiering senare |
| Vilka delar av Airtable är "off limits" före MK? | Hindrar A-track-design från att bli orealistisk |
| Finns workflows i `hur-systemet-funkar.md` som saknas i tekniska modellen? | Affärslogik måste bevaras |

**Inter-fas-kontrakt → Fas 2:**
- Domänkarta + driftkarta + populerat skuldregister
- Lista över "off limits"-områden i Airtable

---

### Fas 2 — Worldclass Research

**Mål:** Identifiera principer för världsklass-datamodeller som är *relevanta*
för detta system. Inte generiska best practices.

**Output:** `analys/04-research.md`

**Avgränsning:** Researchen ska täcka både Airtable som operativt
no-code/low-code-system OCH Supabase som relationsdatabas. Inte enbart
SQL-normalisering.

**Research-områden:**

| Område | Fråga |
|---|---|
| Domänmodellering | Vilka entiteter och livscykler ska vara förstaklass? |
| Normalisering | Vad ska separeras, vad bör vara denormaliserat för drift? |
| State machines | Hur bör statusfält, övergångar och avbokningar modelleras? |
| Identity resolution | Hur matchar man personer/leads säkert över tid? |
| Audit & event log | Vilken historik måste kunna förklaras i efterhand? |
| Automation design | När ska logik ligga i automation, app, databas eller job queue? |
| Data quality | Vilka constraints, valideringar, cleanup-processer krävs? |
| Migration readiness | Hur designar man en Airtable-modell som är lättare att migrera? |
| Observability | Hur upptäcker man tysta failures, partial failures, driftavvikelser? |
| Operativ ergonomi | Hur ska modellen vara begriplig och trygg för Lotta/Roger? |

**Källtyper (per G0.1-beslut):**
- Etablerade källor (Stripe-data-modeller, Shopify-mönster, PostgreSQL/Supabase-best practices)
- Konkreta öppna scheman (vilka beslutas i G0.1)
- Multi-tenant SaaS-mönster (om G0.3 = ja)

**Milstolpar:**

| Milstolpe | Leverans |
|---|---|
| R1 | Källurval och definition av "världsklass" konkretiserad till denna kontext |
| R2 | Princip-taxonomi med 8–12 principer, var och en med källor |
| R3 | Bedömningsrubrik som kan användas i gap-analysen |

**Gate 2:**

| Fråga | Beslut som behövs |
|---|---|
| Är principerna relevanta för Miranon/Psionautics, inte generiska? | Godkänn/revidera |
| Har vi separerat Airtable-excellence från Supabase-target? | Ja/nej |
| Finns källor nog för att kalla detta research (>5 högkvalitativa per princip-kluster)? | Ja/komplettera |

**Inter-fas-kontrakt → Fas 3:**
- 8–12 principer med källor och bedömningsrubrik
- Tydlig markering: principer som gäller Airtable, Supabase, eller båda

---

### Fas 3 — Gap vs Worldclass

**Mål:** Jämföra nuvarande modell mot research-principerna och klassificera
varje gap.

**Output:** `analys/05-gap-vs-worldclass.md`

**Gap-format:** Varje gap har:

| Fält | Innehåll |
|---|---|
| ID | G1, G2, … |
| Nuläge | Vad modellen gör idag |
| Världsklass-princip | Vilken princip från Fas 2 som tillämpas |
| Impact i skarp drift | Faktisk påverkan på Lotta/Roger/Marcus |
| Airtable 11/10-åtgärd | Konkret förslag (om relevant) |
| Supabase target-implikation | Konkret förslag (om relevant) |
| Risk | Kostnad/komplexitet/sannolikhet |
| Rekommendation | Status enligt §8 |

**Särskilda gap som måste adresseras (ärvda från dm-110):**

| ID | Tema |
|---|---|
| DS1 | `Är aktiv (1/0)` exkluderar inte Inställt |
| DS2 | `Återkommande?` betyder inte "har gått kurs tidigare" |
| DS3 | Dead branches i Erfarenhetsbadge |
| DS4 | Gammal total missar RIM 3 |
| DS5 | Parallella `Antal genomförda event`-fält |
| DS6 | RECORD_ID-bug i Deltaganden |
| DQ1 | Case-dubletter i `Vill anmäla sig till` |
| DQ2–DQ3 | Tomma singleSelects |
| DQ4 | SHA256-hashar som option-namn |
| DQ5 | E-post som multilineText |
| DQ6 | Namnlösa Personer som normalt lead-tillstånd |
| DQ7 | RECORD_ID-bug som datakvalitetsrisk |
| DQ8 | Mail skickat men PATCH misslyckas tyst |
| DQ9 | Väntelista till Anmälningar är inte transactional |

Plus: alla 12 hypoteser från dm-110.

**Milstolpar:**

| Milstolpe | Leverans |
|---|---|
| G1 | Gap-lista per domänområde |
| G2 | DS/DQ/hypotes-matris med rekommendation enligt §8 |
| G3 | Prioriteringskarta: driftkritisk / cleanup / redesign / Supabase-only |

**Gate 3:**

| Fråga | Beslut som behövs |
|---|---|
| Vilka gap fixas i Airtable före migration? | Prioriterad lista |
| Vilka gap bevaras medvetet tills Supabase? | Explicit defer-beslut |
| Vilka gap är inte problem? | Preserve-beslut med motivering |

**Inter-fas-kontrakt → Fas 4:**
- Komplett gap-lista med rekommendation per gap
- Alla DS/DQ/hypoteser klassade enligt §8
- Prioriteringskarta för A-track och S-track

---

### Fas 4 — Redesign (A-track + S-track)

**Mål:** Designa båda målmodellerna — först Airtable 11/10, sedan Supabase
target. Sekvensen är medveten: S-track byggs på A-trackens output, inte
parallellt.

**Output:** `analys/06a-airtable-redesign.md` + `analys/06b-supabase-target.md`

**Sekvens:** A1 → A2 → **A-track-gate** → S1 → S2

#### A-track: Airtable 11/10

| Milstolpe | Leverans |
|---|---|
| A1 | Cleanup-lista (döda fält/options, naming, vyer) + status-modell-förslag (Inställt, Avbokad, Väntelista, Aktiv) + person/lead-livscykel-förslag |
| A2 | Automation/observability-förslag (A1–A11 guardrails, partial-failure-detection, mail-PATCH-syncing) + post-MK sequencing-plan |

**Designkategorier (per åtgärd):**

| Kategori | Betydelse |
|---|---|
| Quick win efter MK | Låg risk, tydlig nytta |
| Driftkritisk fix | Behöver göras kontrollerat men prioriteras |
| Cleanup | Döda fält/options, naming |
| Structural redesign | Större ändring, kräver extra plan |
| Supabase-only | Ska inte lösas i Airtable |

**A-track-gate:**

| Fråga | Beslut som behövs |
|---|---|
| Är Airtable-designen säker att exekvera efter MK? | Ja/revidera |
| Vilka åtgärder kräver testbas eller backup först? | Lista |
| Vilka åtgärder är medvetet uppskjutna till Supabase? | Lista (matchar §8 Supabase-only-klass) |

#### S-track: Supabase Target Model

| Milstolpe | Leverans |
|---|---|
| S1 | Core target schema — `persons`, `events`, `registrations`, `attendances`, `sessions` med full DDL, FK constraints, indexes, RLS-skiss |
| S2 | Stöddomäner (`touchpoints`, `engagements`, `mail_log`, `waitlist`, `bulk_mailings`, `offers`) + audit-strategi + automation replacement-mappning A1–A11 + read models |

**Designområden:**

| Område | Konkreta beslut |
|---|---|
| Core entities | persons, contacts/leads, registrations, attendances, events, sessions |
| Identity | unik e-post, alias, merge-historik, normalized email |
| Attendance | person × event × session, explicit status transitions |
| Event model | event type, format, sessions, capacity, reservation buckets |
| Offers/engagement | lead magnets, downloads, engagement rollups |
| Communication | sent emails, templates, delivery status, post-send patch state |
| Audit | created_at, updated_at, actor, source, migration batch |
| Read models | views/materialized views för admin och rapporter |
| Constraints | FK, unique indexes, check constraints |
| Security | RLS, service role, admin permissions |
| Jobs/webhooks | automation replacements för A1–A11 |

**S-track-gate:**

| Fråga | Beslut som behövs |
|---|---|
| Ska Personer splittras (Person + Contact) i Supabase? | Ja/nej/design |
| Ska Leads vara egen tabell eller state på Person? | Beslut |
| Vilken logik ligger i DB vs Edge Functions vs app? | Beslut per area |
| Vilka Airtable-kompromisser följer inte med? | Explicit lista |
| Multi-tenant-stöd (per G0.3)? | Bekräfta tidigare beslut |

**Inter-fas-kontrakt → Fas 5:**
- Komplett Airtable hardening-plan (06a)
- Komplett Supabase target-modell (06b)
- A-track och S-track kopplade — vad i 06a leder till vad i 06b

---

### Fas 5 — Tvåstegs-migrationsplan

**Mål:** Skapa en exekverbar plan från nuvarande Airtable till Airtable 11/10
och därefter till Supabase.

**Output:** `analys/07-migration-plan.md`

**Code används här:** läsa `DataSourceAdapter.ts`, `AirtableAdapter.ts`,
`SupabaseAdapter.ts` (skelett), 7 Edge Functions, domain-modeller. Mappa:
vilka komponenter påverkas av varje migrationssteg?

**Planstruktur (10 steg):**

1. Pre-MK freeze
2. Post-MK Airtable hardening
3. Airtable cleanup och datakvalitet
4. Supabase schema build
5. Data export och transform
6. Dry-run migration
7. Parallel run (strangler-fig domän-för-domän)
8. Cutover
9. Rollback-strategi
10. Post-migration cleanup

**Migrationsplanen ska innehålla:**

| Sektion | Innehåll |
|---|---|
| Preconditions | Vad måste vara klart innan varje steg |
| Protected records | MK och andra driftkritiska objekt |
| Data cleanup | Fixes som krävs före export |
| Mapping | Airtable tabell/fält → Supabase tabell/kolumn |
| Transform rules | Normalisering, statusmappar, option cleanup |
| Validation | Hur vi vet att migrationen blev korrekt |
| Rollback | Hur man backar utan att tappa driftdata |
| Ownership | Vad Marcus/Code/Lotta behöver göra |

**Milstolpar:**

| Milstolpe | Leverans |
|---|---|
| M1 | Airtable hardening-sekvens (post-MK) |
| M2 | Supabase migration-sekvens |
| M3 | Validation och rollback-plan |
| M4 | Future Code-prompt för implementation |

**Gate 5:**

| Fråga | Beslut som behövs |
|---|---|
| Är Airtable 11/10-planen säker att köra efter MK? | Ja/revidera |
| Är Supabase-planen beroende av arkitekturbeslut som ännu saknas? | Lista |
| Kan framtida Code-session exekvera planen utan att gissa? | Ja/nej |

**Inter-fas-kontrakt → Fas 6:**
- Exekverbar tvåstegs-migrationsplan
- Future Code-prompt utkastad
- Rollback-strategi per migrationssteg

---

### Fas 6 — Slutgranskning

**Mål:** Säkerställ att projektet faktiskt svarar på frågan och lämnar ett
användbart underlag.

**Output:**
- Slutsektion i `07-migration-plan.md`
- UNIVERSAL-lärdomar lyfta till `marcus-system/tasks/lessons.md`
- Arbetsdokument i `tasks/sessions/` arkiverat (status frusen)
- `tasks/datamodell-research-direktiv.md` uppdaterad (status: Slutfört)

**Valideringstester:**

| Test | Fråga |
|---|---|
| Airtable excellence | Blir nuvarande system tydligt bättre även utan Supabase? |
| Supabase readiness | Kan målmodellen byggas utan att ärva Airtable-skuld? |
| DS/DQ closure | Har DS1–DS6 och DQ1–DQ9 explicit hantering? |
| Hypotes-test | Är varje hypotes löst, bevarad, eller deferred? |
| Drift-test | Skulle Lotta/Roger kunna använda systemet tryggare efter Airtable-steget? |
| Migration-test | Kan framtida Code-session följa planen utan ny designfas? |
| Spårbarhets-test | Slumpa 10 påståenden i 04–07 — kan källa anges för varje? |

**Gate 6:**

| Fråga | Beslut som behövs |
|---|---|
| Är slutleveransen godkänd som styrdokument? | Ja/nej |
| Vilka implementation-projekt skapas efteråt? | Lista |
| Vad får inte göras förrän Supabase-arkitektur är beslutad? | Lista |

---

## 7. Hypotesdisciplin

Alla hypoteser har explicit status. Inga tysta antaganden.

| Status | Betydelse |
|---|---|
| `OPEN` | Rimlig hypotes, ej verifierad |
| `SUPPORTED` | Stöds av källa men inte slutligt bevisad |
| `DECIDED` | Designbeslut taget |
| `REJECTED` | Motbevisad eller bortvald |
| `DEFERRED` | Flyttas till senare projekt |
| `PRESERVE` | Känd skuld/egenhet bevaras medvetet |

**Hypotesformat (i arbetsdokumentet):**

| Fält | Innehåll |
|---|---|
| ID | H1, H2, … |
| Påstående | Vad vi tror |
| Källa | Varifrån hypotesen kommer |
| Påverkan | Vad som händer om sann |
| Verifieringsväg | Hur den kan lösas |
| Rekommendation | Fixa, bevara, migrera, defer |
| Status | Enligt tabellen ovan |

---

## 8. DS/DQ-beslutsmatris

Varje känd skuld och datakvalitetsfynd klassas i en av sex kategorier:

| Klass | Betydelse |
|---|---|
| Airtable fix | Bör lösas i Airtable efter MK |
| Airtable preserve | Bevaras i Airtable av drift-/kompatibilitetsskäl |
| Airtable cleanup | Kan rensas efter verifiering |
| Supabase target | Löses primärt i Supabase-målmodellen |
| Migration transform | Löses som del av export/transform |
| Defer | Explicit senareläggning med orsak |

**Förväntad initial klassning (preliminär — slutgiltig i Fas 3):**

| Punkt | Trolig klass | Kommentar |
|---|---|---|
| DS1 `Är aktiv` exkluderar inte Inställt | Airtable fix | Påverkar rapporter idag |
| DS2 `Återkommande?` missvisande | Airtable preserve + rename | Fältet kan vara användbart, namnet vilseleder |
| DS3 Dead branches i Erfarenhetsbadge | Airtable fix eller Supabase target | Beror på komplexitet |
| DS4 Gammal total missar RIM 3 | Airtable cleanup | Fält markerat för borttagning |
| DS5 Parallella `Antal genomförda event` | Airtable cleanup | Efter MK och konsumentsök |
| DS6 RECORD_ID-bug | Supabase target | Kan inte fixas i Airtable, formel-bug |
| DQ1 Case-dubletter | Airtable cleanup + Migration transform | Bör kanoniseras före export |
| DQ2 Manuella flagga choices=[] | Airtable fix | Trivial cleanup |
| DQ3 Systemkälla choices=[] | Airtable fix | Trivial cleanup |
| DQ4 SHA256-optioner | Research/cleanup | Kräver källa-mappning |
| DQ5 E-post som multilineText | Airtable fix eller Migration transform | Beror på data-cleanup-behov |
| DQ6 Namnlösa Personer | Airtable preserve + Supabase target | Lead-livscykel formaliseras i Supabase |
| DQ7 RECORD_ID-bug datakvalitet | Supabase target | Formelbaserad, kan inte fixas i Airtable |
| DQ8 Mail-PATCH tyst failure | Airtable/app fix eller Supabase communication log | Driftkritisk observability |
| DQ9 Väntelista→Anmälan ej transactional | App/Edge Function fix, Supabase transaction senare | Bör inte ignoreras |

---

## 9. Spårbarhetsmatris

11/10-disciplin: ingen DS, DQ eller hypotes får tappas mellan faser. Varje
sådan punkt har en rad som följer den genom projektets faser.

**Format (lever i arbetsdokumentet):**

| ID | Beskrivning | Fas 1 (lyft) | Fas 3 (klass) | Fas 4 (åtgärd) | Fas 5 (migration-position) | Fas 6 (closure-test) |
|---|---|---|---|---|---|---|
| DS1 | `Är aktiv` exkluderar inte Inställt | Listad i skuldregister | Airtable fix | A-track A1: status-modell-fix | Migrationssteg 2 (post-MK hardening) | DS-closure-test passerat |
| DS2 | … | … | … | … | … | … |
| DQ1 | … | … | … | … | … | … |
| H1 | A2-grenordnings-hypotesen | Listad som öppen hypotes | Verifieras eller löses via redesign | S-track S1: identity resolution-design ersätter A2 | Inte direkt påverkan | Hypotes-test passerat |

**Regel:** Vid varje fas-slut — verifiera att alla rader i matrisen har
uppdaterad status. En rad utan uppdatering = den punkten är inte hanterad i
fasen → flagga.

---

## 10. Anti-patterns — vad vi inte gör

Beyond-best-practice-disciplin: explicit lista över designval vi *inte* tar
utan stark motivering. Förhindrar drift och cargo-cult-design.

| Anti-pattern | Varför vi undviker det |
|---|---|
| **Event sourcing eller CQRS** | Komplexitet för komplexitet. Audit-logg + immutable history räcker. Endast om Fas 2 explicit motiverar det. |
| **Splitta Personer i 5 tabeller bara för att normalisering är "rätt"** | Operativ ergonomi för Lotta är hård constraint. Splittning sker bara om operativ vinning är tydlig. |
| **Återskapa Airtables formel-magi 1:1 i Supabase** | Rollups som `RIM 3 ×`, `Antal genomförda event` ska bli read models eller materialized views — inte direkt portade. |
| **Designa för hypotetiska framtidsbehov** | YAGNI. Multi-tenant-stöd designas in *bara* om G0.3 = ja. Andra "tänk-om"-funktioner refuseras. |
| **Migrera DS/DQ tyst** | Varje skuld har explicit klassning enligt §8. Ingen smyger med i exporten. |
| **Big-bang-migration** | `SupabaseAdapter`-skelettet finns. Strangler-fig är förvald. Big-bang kräver explicit motivering. |
| **Lösa schema-frågor i app-lagret** | Constraints i DB. RLS i DB. App är konsument, inte sanningskälla. |
| **Reproducera Airtable Automations som Edge Functions 1:1** | Vissa A1–A11 är symptom på Airtable-begränsningar. Översätt till lämplig mekanism (DB-trigger / Edge Function / job queue) baserat på vad de faktiskt gör. |
| **Skriva designförslag utan källa** | Varje designbeslut i 06a/06b har källspår: research-princip från 04, gap från 05, eller explicit motivering. |
| **Gissa istället för att verifiera** | Vid tvivel om Airtable-beteende: MCP-anrop. Vid tvivel om Supabase-beteende: PostgreSQL-dokumentation. Aldrig "jag tror". |

---

## 11. Operationalisering av universal-lärdomar

De sex universal-lärdomarna från 2026-04-28 (`marcus-system/tasks/lessons.md`)
är inte allmänna mantran — de operationaliseras till konkreta arbetsmoment per fas.

| Lärdom | Operationalisering |
|---|---|
| **Live-state vinner** | Fas 2 + 3: vid varje hypotes om Airtable-beteende → MCP-anrop mot bas `app8uGPrVCVOm6LfD` innan slutsats. Inte "jag tror dokumentationen säger". |
| **Empirisk parallell-läsning** | Fas 3: när gap formuleras kring formler/rollups — testa formel mot faktiska records, inte bara mot specs. RECORD_ID-buggen från dm-110 är referensfall. |
| **Projektkunskapssökning är samplad** | Fas 1: lyft DS/DQ/hypoteser — verifiera mot disk/find-kommandon, inte bara via Chats sökresultat. |
| **Data-först-ordning** | Fas 5: om migrationsplanen behöver record-räkningar för riskbedömning — kör räkningarna *innan* prosa skrivs. Inte som errata. |
| **`isValid: true` betyder syntax, inte semantik** | Fas 4 S-track: vid Postgres-DDL-design — typvalidering räcker inte. Test mot beteende. |
| **Bygg ut struktur tidigt** | Hela projektet: hypotesregister, DS/DQ-matris, spårbarhetsmatris populeras vid Fas 0-start, inte byggs när det blir akut. |

---

## 12. Tidslinje vs MK-fönster

| Period | Aktivitet | Anteckning |
|---|---|---|
| Innan 1 maj | Fas 0 + Fas 1 + ev. start Fas 2 | Stresstesta planen, populera arbetsdokumentet |
| 1–3 maj (MK) | **Frys** | Inga ändringar någonstans. Använd ev. som läsperiod på Fas 1-output. |
| 4 maj och framåt | Fas 2 → Fas 6 | Fokuserade sessioner enligt §14 |

**Premiss-kontroll:** Direktivet säger "inga schema-ändringar i basen under MK".
Forwards-look-projektet rör inte basen alls i någon fas — premissen är trivialt
uppfylld. Frysen handlar om Marcus' fokus, inte tekniska beroenden.

---

## 13. Verktygsbalans

| Fas | Primär motor | MCP-användning | Code-roll |
|---|---|---|---|
| Fas 0 | Chat + Marcus | Inget | Inget |
| Fas 1 | Chat | Eventuellt verifiering av enstaka påståenden i `data-model.md` | Inget |
| Fas 2 | Chat + web search | Inget direkt | Inget |
| Fas 3 | Chat | MCP vid empirisk parallell-läsning av enskilda gap | Inget |
| Fas 4 A-track | Chat | MCP för Airtable-beteendeverifiering | Inget |
| Fas 4 S-track | Chat + ev. Code | Inget | Code läser kodbas vid behov för adapter-påverkan |
| Fas 5 | Chat + Code | Inget | Code läser `DataSourceAdapter`, `AirtableAdapter`, `SupabaseAdapter`, Edge Functions |
| Fas 6 | Chat + Code | Inget | Code utför filsystemsoperationer (UNIVERSAL-lyft, arkivering) |
| Implementation | **Framtida projekt** | – | – |

---

## 14. Sessionsindelning

Projektet körs över 2–3 fokuserade sessioner.

| Session | Fokus | Output |
|---|---|---|
| 1 | Fas 0–2: ramning, baseline, research | Godkänd princip-taxonomi + `04-research.md` |
| 2 | Fas 3 + Fas 4 A-track: gap, Airtable 11/10 | `05-gap-vs-worldclass.md` + `06a-airtable-redesign.md` |
| 3 | Fas 4 S-track + Fas 5 + Fas 6: Supabase target, migration, closure | `06b-supabase-target.md` + `07-migration-plan.md` + slutcheck |

Om Fas 2-research blir större än väntat — låt den få egen session (alternativt 4-session-modell). Gap-analysen får inte byggas på halvsmälta principer.

---

## 15. Gate-failure-protokoll

Vad händer när en Gate underkänns. Definierat i förväg så vi inte ad hoc-omplanerar i stress.

| Failure-typ | Hantering |
|---|---|
| **Gate kräver mindre revision** | Stanna i samma fas. Fixa fynden. Återkör Gate. Logga i arbetsdokumentet. |
| **Gate avslöjar saknad indata** | Pausa fasen. Skapa "verifierings-mini-fas" (motsvarar dm-110:s H1-gating). Återgå till fasen när indatan är på plats. |
| **Gate avslöjar att tidigare fas är felaktig** | Återgå till felaktig fas. Re-execute. Detta är dyrt — men billigare än att bygga vidare på fel fundament. |
| **Gate avslöjar att projektets premisser är fel** | Stoppa projektet. Eskalera till Marcus för re-scoping. Direktivet kan behöva uppdateras. |

**Princip:** Det är alltid billigare att underkänna en Gate än att bygga vidare på en svag fas. Gate-failures är inget misslyckande — de är systemets immunförsvar.

---

## 16. Risker

| Risk | Motåtgärd |
|---|---|
| Researchen blir generisk | Tvinga varje princip att mappa mot konkret Miranon/Psionautics-beslut (Gate 2) |
| Supabase-designen gör Airtable-steget slarvigt | A-track-gate måste passera innan S-track startar |
| Airtable-förslag blir för invasiva före MK | MK-frys + post-MK sequencing i 06a |
| DS/DQ tappas bort i designen | Spårbarhetsmatris (§9) + closure-test (Fas 6) |
| Vi bygger migration från skuld i stället för från modell | Tvåstegsstrategi — A-track först |
| Hypoteser blir tysta antaganden | Hypotesregister (§7) med explicit status |
| `Personer` splittras för tidigt | Gatea explicit i S-track-gate |
| Universal-lärdomar förblir mantra, inte praktik | §11 operationaliserar varje per fas |
| Fasen drar ut på tid och MK-fönstret äts upp | Sessionsindelning (§14) + §12-tidslinje håller koll |
| Codex eller Chat misshanterar tvåstegsstrategin | Anti-patterns (§10) explicit list över förbjudet |

---

## 17. Definition of Done

Projektet är klart när:

1. Vi har en research-baserad principmodell för världsklass (8–12 principer med källor).
2. Nuvarande Airtable-modell är gap-analyserad mot principerna med klassad rekommendation per gap.
3. Airtable 11/10-förslag finns med post-MK sequencing.
4. Supabase target-modell finns med tydlig skillnad mot Airtable-kompromisser.
5. DS1–DS6 och DQ1–DQ9 är explicit hanterade i spårbarhetsmatrisen.
6. Alla 12 öppna hypoteser är lösta, bevarade, eller deferred med verifieringsväg.
7. `07-migration-plan.md` kan användas av framtida Code-session utan ny designfas.
8. UNIVERSAL-lärdomar är lyfta till hubben.
9. Arbetsdokument är arkiverat (status frusen).
10. Inga schemaändringar, commits, eller migrationer har gjorts som del av projektet.
11. Alla 7 valideringstester (§Fas 6) passerar.
12. Spårbarhetsmatrisen (§9) har komplett uppdatering — varje rad har status i varje fas.

---

## 18. Beslut som behövs innan Fas 0 startar

| # | Beslut | Min rekommendation |
|---|---|---|
| B1 | Godkänna tvåstegsstrategin | Ja: Airtable 11/10 först, Supabase sedan |
| B2 | Godkänna output-filerna (5 filer, 06 splittad till a+b) | Ja |
| B3 | Godkänna att planen lever i `tasks/` och output i `analys/` | Ja |
| B4 | Godkänna arbetsdokument i `tasks/sessions/` (dm-110-mönster) | Ja |
| B5 | Bekräfta att `docs/reference/hur-systemet-funkar.md` är måste-läs i Fas 1 | Ja: affärslogik är hård constraint |
| B6 | Bestäm research-ribba för Fas 2 | Min rek: minst 5–8 högkvalitativa källor per princip-kluster, inte modellens allmänkunskap ensam |
| B7 | Bestäm om webhooks/Zapier/Make ska kartläggas i detta projekt | Min rek: ja för designpåverkan, nej för full implementation |
| **G0.1** | **Källdjup för Fas 2-research** | Min rek: textbaserade källor + 2–3 stickprov mot konkreta scheman (Cal.com, Plane.so eller liknande) |
| **G0.2** | **Event sourcing/CQRS-djup i Supabase target** | Min rek: utvärdera, sannolikt skip — audit-logg + immutable history räcker |
| **G0.3** | **Multi-tenant ready för framtida produkter (Passionslyftet, Maxat Event)?** | Strategiskt beslut, behövs innan Fas 2. Min rek: ja, men minimalt — schema-prefix + RLS, inte full tenant-isolation. Annars ärver vi single-tenant-skuld i Supabase. |

---

## 19. Kort sammanfattning

> Gör Airtable-modellen exceptionell som driftssystem först. Designa sedan
> Supabase-migrationen från den renare modellen, inte som en flykt från den
> nuvarande.

Det gör arbetet mer robust: Airtable blir bättre även om migrationen dröjer,
och Supabase får en mycket klarare målbild när migrationen väl startar.

Spårbarhetsmatris, anti-patterns, operationaliserade universal-lärdomar och
gate-failure-protokoll är 11/10-disciplinen som höjer planen från "bra plan
för ett vanligt research-projekt" till "11/10 för forwards-look-projekt mot
världsklass".
