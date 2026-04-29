# Fas 6 — Slutgranskning, prompt för Codex CLI

> **Detta är den sista fasen i projektet.** Inga nya beslut, ingen ny design, ingen ny analys. Fas 6 validerar, lyfter lärdomar och arkiverar.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-6-prompt.md`
> **Skapad:** 2026-04-30 av Claude Chat efter avslutad Fas 5 (Gate 5 passerad)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — **ny session**
> **Avlöser:** `fas-5-prompt.md` (hela design- och planblocket är klart)
> **Föregår:** Inget. Detta avslutar projektet.

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, validering, beslut | Marcus + Claude Chat |
| Exekvering: validering, slutsektion, UNIVERSAL-lyft, arkivering | **Du (Codex CLI)** |

Fas 6 är 30 min estimat. Du gör inte arbete utanför scope. Du stoppar vid Gate 6 (§5) och rapporterar.

---

## 1.5 Status vid Fas 6-start

**Levererat hittills (allt KLAR):**
- Fas 0: Plan + arbetsdokument + G0-beslut
- Fas 1: `analys/04-research.md` Del 0 — Baseline & Constraint Map
- Fas 2: `analys/04-research.md` Del 1 — 10 principer P1–P10 + R7 stickprov
- Fas 3: `analys/05-gap-vs-worldclass.md` — 15 gap, 29 DS/DQ/H klassade
- Fas 4a: `analys/06a-airtable-redesign.md` — 12 A-track-åtgärder
- Fas 4b: `analys/06b-supabase-target.md` — 36 target-tabeller
- Fas 5: `analys/07-migration-plan.md` — 10-stegs migrationsplan + Future Code-prompt

**UNIVERSAL-kandidater i arbetsdokumentet §9 (alla med Lyft-status: Kandidat):**
- K1: Verifieringsprompter avslöjar verktygskompetens
- K2: Olika MCP-implementationer kan ha olika tool-namn
- K3: Verktygsbegränsningar måste verifieras mot källa
- K4: Diagnostik-verktyg kan exponera secrets
- K5: Token-identifiering via hash-prefix
- K6: Config-as-data drift klassas vid integrationskant
- K7: Rekommendation i arbetsdokument är inte beslut när gate är öppen
- K8: Preserve är aktivt guardrail-beslut
- K9: Stable identifiers separerade från displaynamn vid integrationskanter
- K10: Crosswalk är förstaklassartefakt

**Vad Fas 6 ÄR:**
- Validering: kör tre tester (Airtable excellence, Supabase readiness, DS/DQ closure)
- Slutsektion i `07-migration-plan.md` med projekt-sammanfattning och valideringsutfall
- UNIVERSAL-lyft: flytta K1–K10 till `~/Repon/marcus-system/tasks/lessons.md` med slutformulering
- Arkivering: arbetsdokumentet markeras FRUSET, direktivet markeras SLUTFÖRT

**Vad Fas 6 INTE är:**
- Inte ny analys. Om validering avslöjar lucka — flagga, lyft inte ny gap
- Inte omformulering av K1–K10 från grunden. Bygg på Codex' egna formuleringar i §9
- Inte design. Slutsektionen är sammanfattning, inte ny innehåll

**Två commits krävs (viktigt):**
- **Commit 1 i `~/Repon/miranon-media-admin`:** slutsektion i 07 + arkivering av arbetsdokumentet + direktiv-statusändring
- **Commit 2 i `~/Repon/marcus-system`:** UNIVERSAL-lyft i `tasks/lessons.md`

Båda commits ska göras med `cd` till rätt repo först. Inga push från dig — Marcus pushar båda.

---

## 2. Källfiler — läs i denna ordning

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — **särskilt sektionerna 2026-04-28 och 2026-04-29 för att förstå lessons.md-formatet och var K1–K10 ska in**

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 6 (valideringstester) och §10 (definition of done)**
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet, särskilt §9 K1–K10**

**Indata för validering (referens, läs översiktligt):**

7. `~/Repon/miranon-media-admin/analys/04-research.md`
8. `~/Repon/miranon-media-admin/analys/05-gap-vs-worldclass.md`
9. `~/Repon/miranon-media-admin/analys/06a-airtable-redesign.md`
10. `~/Repon/miranon-media-admin/analys/06b-supabase-target.md`
11. `~/Repon/miranon-media-admin/analys/07-migration-plan.md`

**Total: ~14 000 rader.** Du behöver inte läsa 7-11 i detalj — du har sett dem genom faserna. Skanna efter validering, gå djupt bara där det krävs.

**Källprioritet vid konflikt:** Arbetsdokumentet > 07 > 06a/06b > 05 > 04.

---

## 3. Din uppgift — Fas 6 Slutgranskning

### 3.1 Mål

Bevisa att projektet svarar på frågan "Är vår modell i sig 11/10, eller bara dokumentationen av den?" och lämna ett arkiverat, sökbart underlag.

### 3.2 Output

Tre platser:

1. **Slutsektion i `analys/07-migration-plan.md`** — projekt-sammanfattning + valideringsutfall
2. **`~/Repon/marcus-system/tasks/lessons.md`** — K1–K10 i slutformulering
3. **Status-uppdateringar:**
   - `tasks/sessions/2026-04-28-datamodell-research-projekt.md` markeras FRUSEN i headern
   - `tasks/datamodell-research-direktiv.md` markeras SLUTFÖRT i headern

### 3.3 Fyra milstolpar (M1, M2, M3, M4)

| Milstolpe | Leverans | Slut-test |
|---|---|---|
| M1 | Tre valideringstester körda och dokumenterade | Airtable excellence + Supabase readiness + DS/DQ closure har konkret ja/nej + motivering per test |
| M2 | Slutsektion i 07 skriven | Sammanfattar leverans, validering, hand-off till future Code |
| M3 | UNIVERSAL-lyft till lessons.md klart | K1–K10 har slutformulering, lyft-status uppdaterad från Kandidat till UNIVERSAL |
| M4 | Arkivering klar med två separata commits | Status FRUSEN/SLUTFÖRT konsistent. Båda repon committade men inte pushade |

### 3.4 Valideringstesterna i detalj

**Test 1 — Airtable excellence**

Fråga: *Blir Miranon tydligt bättre att drifta även om Supabase-migrationen aldrig sker?*

Konkret: skanna 06a Del A+B (de 8 fix/cleanup-åtgärderna A1–A8) och bedöm om de tillsammans löser de faktiska driftproblem som Lotta/Roger upplever idag. Referera tillbaka till driftkartan i 04 Del 0 §B2.

Pass-kriterium: minst 3 av A1–A8 löser ett konkret driftproblem som Marcus+Lotta+Roger känner igen.

**Test 2 — Supabase readiness**

Fråga: *Kan målmodellen byggas utan att ärva Airtable-skuld?*

Konkret: skanna 06b Del F4 (A-tracks Del F-lockning till S-track-design) och bedöm om varje låsning hanteras i target utan att target själv blir Airtable-skuld i Postgres-form. Särskilt: är `attendances` riktig FK från canonical relationer eller kopierar den RECORD_ID-tänket?

Pass-kriterium: alla sex låsningar i 06b §F4 hanterade utan Airtable-skuld-arv.

**Test 3 — DS/DQ closure**

Fråga: *Har varje DS/DQ/H explicit hantering någonstans i projektet?*

Konkret: gå igenom arbetsdokumentet §6 spårbarhetsmatris (29 rader). Verifiera att varje rad har:
- Fas 2-princip: ifylld
- Fas 3-klass: ifylld
- Fas 4-åtgärd: ifylld eller explicit "ej Fas 4-åtgärd, hör till annan fas"
- Fas 5-migration: ifylld där relevant

Pass-kriterium: 29/29 rader är hanterade — ingen "ej klassad" eller blank cell. Om någon rad är `n/a` ska den ha motivering.

### 3.5 Slutsektion i 07 (M2) — struktur

Lägg till i slutet av `07-migration-plan.md`:

```markdown
---

## Del J — Projekt-slutsektion (Fas 6)

### J1 — Sammanfattning

[3-4 rader om vad projektet levererat: 5 analysfiler, 29 DS/DQ/H stängda,
10 principer, 15 gap, 12 A-åtgärder, 36 target-tabeller, 10 migrationssteg,
Future Code-prompt redo.]

### J2 — Valideringsutfall

| Test | Pass/Fail | Motivering |
|---|---|---|
| Airtable excellence | [Pass/Fail] | [konkret motivering med referens till A1-A8] |
| Supabase readiness | [Pass/Fail] | [konkret motivering med referens till 06b §F4] |
| DS/DQ closure | [Pass/Fail] | [räkning: 29/29 rader hanterade] |

### J3 — Hand-off till future Code-implementation

[Peka tillbaka på Del H Future Code-prompt. Bekräfta att Code kan starta
från fyra kärnfiler utan att läsa hela projektet.]

### J4 — Vad nästa session ska tänka på

[Lista de 3-5 viktigaste förutsättningarna för att Code-implementation ska
lyckas: MK avslutat, Supabase-projekt skapat, service-role-credentials,
Marcus go på första domän, etc.]
```

### 3.6 UNIVERSAL-lyft till lessons.md (M3) — disciplin

Läs först `~/Repon/marcus-system/tasks/lessons.md` för att förstå formatet. Den filen har existerande sektioner från tidigare projekt — K1–K10 ska läggas till som ny sektion eller integreras enligt befintligt mönster.

**Disciplin för formuleringen:**
- Bygg på Codex' egna formuleringar i arbetsdokumentet §9. Refrasera inte från grunden.
- Slutformulering ska vara generaliserbar — bortom Miranon, bortom Airtable. K6 handlar om config-as-data drift i alla system, inte bara Zapier.
- Varje lyft ska ha: kort titel, två-tre-rads kontext från projektet, generaliserad princip, exempel på när principen gäller (om hjälpsamt).
- Lyft-status ändras från "Kandidat" till "UNIVERSAL" — i lessons.md är de UNIVERSAL.

**Exempel på slutformulering (K6):**

```markdown
### Config-as-data drift klassas vid integrationskanten, inte vid symptomfältet

När externa verktyg (Zapier, Make, custom integrations) skriver till en
databas kan samma dataform vara: användardata, integration-config,
defaultvärde eller transform-output. Klassningen måste börja vid write-path
och config-ägare, inte vid fältets utseende.

**Konsekvens:** Vid research/gap-analys på system med externa write-paths,
inför separat fråga: "Är detta användardata, integration-config,
defaultvärde eller transform-output?" innan cleanup eller migration föreslås.

**Exempel:** SHA256-hashar i `Källa (formulärkälla)` som först antogs vara
form-input visade sig vara hårdkodad Zapier-config. Cleanup vid symptomfältet
hade missat root cause i Zap-konfigurationen.

**Källa:** datamodell-research-projektet 2026-04-29, Fas 1.
```

Samma struktur för K1–K5, K7, K8, K9, K10.

### 3.7 Arkivering (M4) — disciplin

**Arbetsdokumentet:** Ändra header-status från `KLAR — Gate 5-underlag klart, inväntar godkännande` till `FRUSEN — Projekt avslutat 2026-04-30`. Lägg till en avslutande not nederst:

```markdown
---

## 12. Avslutande not

Projektet avslutat 2026-04-30 efter Gate 6. Alla output-filer levererade,
UNIVERSAL-lärdomar lyfta till `~/Repon/marcus-system/tasks/lessons.md`,
direktivet markerat SLUTFÖRT. Future Code-implementation startar från
`analys/07-migration-plan.md` Del H när Marcus signalerar go.

Detta dokument är frusen referens. Inga ändringar från denna punkt.
```

**Direktivet:** Ändra header-status (eller lägg till om saknas) till `SLUTFÖRT — 2026-04-30`. Lägg till en kort slutnot om var leveransen finns.

### 3.8 Estimat

30 min. Mindre än övriga faser eftersom det är validering och formatering, inte ny analys.

---

## 4. Scratch-persistens-strategi

För 30-min-fas är scratch-fil sannolikt overkill, men för konsistens: skapa `.codex-scratch/fas-6-context.md` om kontextfönstret blir tungt. Annars går det utan.

---

## 5. Gate 6 — STOPPA HÄR

Vid Fas 6-slut: rapportera, vänta på godkännande. Inget mer projekt efter detta.

**Fyra Gate 6-frågor:**

1. Klarade projektet alla tre valideringstester? (Pass/Fail per test)
2. Är K1–K10 lyfta till lessons.md med generaliserbar slutformulering?
3. Är arkiveringen konsistent? (Arbetsdokumentet FRUSEN, direktivet SLUTFÖRT, status-rader uppdaterade)
4. Är de två commits gjorda i rätt repo med rätt innehåll? (`miranon-media-admin` för slutsektion+arkivering, `marcus-system` för lessons.md)

**Rapportformat:**

```markdown
## Fas 6 — Rapport vid Gate 6

### Levererat
- 07-migration-plan.md utökad med Del J (slutsektion)
- ~/Repon/marcus-system/tasks/lessons.md utökad med K1-K10
- Arbetsdokumentet: status FRUSEN, slutnot tillagd
- Direktivet: status SLUTFÖRT
- Två commits klara, inga push

### Valideringsutfall
- Test 1 (Airtable excellence): [Pass/Fail + motivering]
- Test 2 (Supabase readiness): [Pass/Fail + motivering]
- Test 3 (DS/DQ closure): [Pass/Fail + räkning 29/29]

### Commits
- miranon-media-admin: [hash] [meddelande, en-rads]
- marcus-system: [hash] [meddelande, en-rads]

### Gate 6-svar (Codex' egen bedömning)
1. Valideringstester: [bedömning]
2. UNIVERSAL-formuleringar: [bedömning + 1-2 exempel på generaliseringsnivå]
3. Arkiveringskonsistens: [bedömning]
4. Två-repo-disciplinen: [bedömning + bekräftelse av rätt cwd för respektive commit]

### Öppna frågor till Marcus
[Allt som krävde antagande, allt som validering avslöjade som lucka]

### Lyft-kandidater för UNIVERSAL
[Eventuella nya lärdomar från Fas 6 själv. Förmodligen tomt — Fas 6 är validering.]

### Projekt avslutat
Alla 7 faser klara. Future Code-implementation kan starta från 07 Del H när Marcus signalerar go.
```

Inga commits från Codex pushade. Marcus pushar båda.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Inga nya beslut | Fas 6 validerar och dokumenterar. Om validering avslöjar lucka — flagga i öppna frågor, lyft inte ny gap |
| Bygg på Codex' formuleringar | K1–K10 i §9 är skrivna av dig. Slutformulering refraserar och generaliserar, men bygger på samma kärninsikt |
| Två commits, två repon | Inga blandade commits. `miranon-media-admin` får sin commit, `marcus-system` får sin |
| Inga pushes | Marcus pushar båda. Du committar bara |
| Validering är konkret | "Pass" kräver motivering med referens. "Det ser bra ut" är inte validering |
| Hypotes-status respekteras | H6 REJECTED, H3/H4/H7 DECIDED. Detta är reflekterat i alla faser — Fas 6 ändrar inget |
| Stoppa vid Gate 6 | Projektet är slut. Inget att starta vidare |

---

## 7. Anti-patterns att undvika

| Anti-pattern | Hur du undviker det |
|---|---|
| Smyga in nya gap | Fas 6 är validering. Om en lucka upptäcks — flagga, lyft inte gap |
| Refrasera K1–K10 från grunden | Codex' formuleringar i §9 är input. Slutformulering bygger på dem, ändrar inte kärninsikten |
| Förlora 2-repo-disciplinen | `cd ~/Repon/miranon-media-admin` för en commit. `cd ~/Repon/marcus-system` för den andra. Verifiera `pwd` och `git status` före varje commit |
| Push:a | Du push:ar inte. Marcus push:ar båda efter granskning |
| Lös validering | "Pass" kräver konkret motivering. Test 3 räknar 29/29 — om något saknas är det Fail tills åtgärdat |
| Tappa preserve-disciplinen i validering | Test 2 ska bekräfta att preserve-besluten (DQ6 namnlösa, DS2 Återkommande?, H9 RIM3x) hanteras i target utan att förvanskas |
| Glömma direktivet | `tasks/datamodell-research-direktiv.md` är lika viktig att markera SLUTFÖRT som arbetsdokumentet är att markera FRUSEN |
| /compact-försök | Inte aktuellt för 30-min-fas, men samma regel som tidigare |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning.
2. **M1 — Validering:** kör tre testerna, dokumentera utfall.
3. **M2 — Slutsektion:** lägg till Del J i `07-migration-plan.md`. Skriv på disk.
4. **M4-del-1 — miranon-media-admin-arkivering:** uppdatera arbetsdokumentet (FRUSEN + slutnot) och direktivet (SLUTFÖRT). Skriv på disk.
5. **Commit 1 (miranon-media-admin):**
   ```
   cd ~/Repon/miranon-media-admin
   git status   # bör visa: 07-migration-plan.md, arbetsdokumentet, direktivet
   git add ...
   git commit -m "docs(research): Fas 6 slutgranskning + arkivering — projekt avslutat"
   ```
   Inget push.
6. **M3 — UNIVERSAL-lyft:** läs `~/Repon/marcus-system/tasks/lessons.md` för format. Lägg till K1–K10 med slutformulering enligt §3.6.
7. **Commit 2 (marcus-system):**
   ```
   cd ~/Repon/marcus-system
   git status   # bör visa: tasks/lessons.md
   git add tasks/lessons.md
   git commit -m "docs(lessons): UNIVERSAL-lyft från datamodell-research-projektet (K1-K10)"
   ```
   Inget push.
8. Skriv Gate 6-rapporten enligt §5.
9. Stoppa. Vänta på Marcus.

---

*Slut på Fas 6-prompten. Detta avslutar projektet. Marcus push:ar båda commits efter granskning. Future Code-implementation startar i separat post-projekt när Marcus signalerar go.*
