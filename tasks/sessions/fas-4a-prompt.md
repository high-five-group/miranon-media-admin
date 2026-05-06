# Fas 4a — Airtable Redesign (A-track), prompt för Codex CLI

> **Detta är en session-bro, inte en sanningskälla.** Substansen för projektet bor i direktivet, planen, arbetsdokumentet, principregistret i `04-research.md`, gap-analysen i `05-gap-vs-worldclass.md` och `lessons.md`. Den här filen säger bara: läs dessa, i denna ordning, kör A-track-redesignen så här, hantera kontexten så här, rapportera så här.
>
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/fas-4a-prompt.md`
> **Skapad:** 2026-04-29 av Claude Chat efter avslutad Fas 3 (Gate 3 passerad)
> **För:** Codex CLI (GPT-5.5, 400K kontextfönster) — **ny session**
> **Avlöser:** `fas-3-prompt.md` (Fas 3 är klar)
> **Föregår:** `fas-4b-prompt.md` (S-track Supabase target — skapas av Claude Chat efter Gate 4A passerats)

---

## 1. Arbetsfördelning

| Roll | Vem |
|---|---|
| Strategi, planering, prompt-design, granskning, beslut | Marcus + Claude Chat |
| Exekvering: läsa filer, designa A-track, skriva på disk, rapportera | **Du (Codex CLI)** |

Du föreslår inte planändringar utan att checka. Du gör inte arbete utanför scope. Du stoppar vid Gate 4A (§5) och rapporterar — kör inte vidare till S-track på eget initiativ. **S-track är en separat session efter Marcus + Chat granskat din A-track-leverans.**

---

## 1.5 Status vid Fas 4a-start (för ny session)

Du läser denna prompt i en **ny Codex CLI-session**. Tidigare sessioners kontext är borta. Här är det du behöver veta innan du läser källfilerna:

**Levererat hittills:**
- **Fas 0 (KLAR):** Direktiv, 7-fasplan, arbetsdokument med 29 spårbarhetsrader.
- **Fas 1 (KLAR — Gate 1 passerad):** `analys/04-research.md` Del 0 — Baseline & Constraint Map.
- **Fas 2 (KLAR — Gate 2 passerad):** `analys/04-research.md` Del 1 — 10 principer P1–P10 + R7 stickprov (Cal.com, Plane.so, NocoDB).
- **Fas 3 (KLAR — Gate 3 passerad):** `analys/05-gap-vs-worldclass.md` — 15 gap (G1–G15) + DS/DQ/H-matris + prioriteringskarta + 9 öppna frågor till Fas 4.

**Strukturbeslut för Fas 4 (taget mellan Fas 3 och 4):**
- **Fas 4 splittas i två sessioner med två gates:** 4a (A-track, denna prompt) + 4b (S-track, separat prompt). Avviker från planens "en gate per fas" men bevarar planens output-filer (`06a-airtable-redesign.md` + `06b-supabase-target.md`) och inter-fas-kontraktet till Fas 5. Disciplin-skäl: A-track ska vara stabil innan S-track bygger på den.

**Strategiskt beslut taget vid Fas 4a-start:**
- **G0.3 = SOFT MULTI-TENANT.** Beslutet fattades av Marcus 2026-04-29 baserat på arbetsdokumentets ursprungliga rekommendation och bekräftat efter Fas 1-3-analys. **Detta beslut påverkar primärt S-track (Fas 4b) — inte A-track.** A-track-arbetet ska INTE smyg-implementera tenant-abstraktion i Airtable. Per P10 och planens explicita instruktion: "inför inte tenant-abstraktion i Airtable före behov/beslut". Airtable-basen förblir single-base-reality. Tenant-resonemanget hör hemma i 06b, inte 06a.
- **Beslut-stil att internalisera:** "Ett medvetet 'just nu'-beslut med tydlig escape-väg är bättre än ett evigt undvikt beslut." Soft multi-tenant kan nedgraderas (ignorera `tenant_id`) eller uppgraderas (lägg till schema-prefix) utan total omdesign. Detta är värdefullt även för andra beslut i A-track.

**Viktiga beslut och korrigeringar att hålla i huvudet:**
- **H6 är REJECTED.** Hashvärdena är Zapier-config (Zap 5+6), inte form-input. Klassad som DQ4/G11 (P6 config-as-data drift).
- **DQ4 omklassad** till "config-as-data drift". A-track-åtgärden för G11 är att rätta Zapier-konfig och göra den läsbar — inte att jaga form-input-hypoteser.
- **DS7 finns sedan Fas 0:** A1–A11-versionsdiff utan dokumenterade automation-ändringar. Klassad som Defer (G15) — kartläggs i Fas 5.
- **MK-frys gäller fortfarande:** 1–3 maj 2026. **Alla A-track-åtgärder är POST-MK.** Inga pre-MK-förslag ens om de verkar säkra.

**UNIVERSAL-kandidater från Fas 0–3 (i arbetsdokumentet §9):**
- K1–K5: tooling/secrets/diagnostik (gäller dig som operator)
- K6: Config-as-data drift ska klassas vid integrationskanten — gäller G11/DQ4-arbetet i denna fas
- K7: "Rekommendation i arbetsdokument är inte beslut när gate är öppen" — gäller dig: gör inga val i A-track som logiskt borde vänta på 4b eller 5

**Lärdom om din egen runtime (från Fas 2 §10):**
- Codex CLI har **ingen `/compact`-subcommand** i din runtime. Compact-disciplin körs via scratch-persistens + reload, inte via slash-command. Se §4 nedan.

---

## 2. Källfiler — läs i denna ordning, i sin helhet

**Setup:**

1. `~/Repon/marcus-system/CLAUDE.md`
2. `~/Repon/miranon-media-admin/CLAUDE.md`
3. `~/Repon/marcus-system/tasks/lessons.md` — sektionerna 2026-04-28 och 2026-04-29

**Projektstyrning:**

4. `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
5. `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md` — **särskilt §6 Fas 4 A-track, §7 hypotesdisciplin, §8 DS/DQ-beslutsmatris**
6. `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md` — **arbetsdokumentet**

**Indata för Fas 4a — kärnmaterialet:**

7. `~/Repon/miranon-media-admin/analys/04-research.md` — principregistret P1–P10 + R7 stickprov
8. `~/Repon/miranon-media-admin/analys/05-gap-vs-worldclass.md` — **gap-analysen, primär input för A-track**

**Frusen indata:**

9. `~/Repon/miranon-media-admin/docs/reference/data-model.md`
10. `~/Repon/miranon-media-admin/docs/reference/hur-systemet-funkar.md`
11. `~/Repon/miranon-media-admin/analys/01-extraction.md`
12. `~/Repon/miranon-media-admin/analys/02-live-state.md`
13. `~/Repon/miranon-media-admin/analys/03-gap-analysis.md`

**Föregående fas-prompter (för disciplin- och stilkonsistens):**

14. `~/Repon/miranon-media-admin/tasks/sessions/fas-3-prompt.md` — närmaste mönstermatchning

**Total: ~9 500 rader.** Med 400K kontextfönster får allt plats. Använd scratch-persistens (§4).

**Källprioritet vid konflikt:** Live-state (frusen i Del 0) > arbetsdokumentet > 05-gap-vs-worldclass.md > 04-research.md > planen > direktivet > äldre dokument.

---

## 3. Din uppgift — Fas 4a A-track Airtable Redesign

### 3.1 Mål

Designa "Airtable 11/10" — den sanerade, formaliserade versionen av nuvarande Airtable-bas som adresserar Airtable-klassade gap från `05-gap-vs-worldclass.md`. Resultatet ska:

1. Stå på egna ben — Miranon ska bli tydligt bättre att drifta även om Supabase-migrationen aldrig sker. Detta är planens "Airtable excellence-test".
2. Vara implementerbart självständigt — Lotta/Roger/Marcus ska kunna utföra åtgärderna post-MK med rimlig blast radius.
3. Lämna inter-fas-kontrakt till S-track som är otvetydigt — vad har A-track låst, vad är fortfarande öppet.

### 3.2 Output

`~/Repon/miranon-media-admin/analys/06a-airtable-redesign.md` — **ny fil**.

Strukturen:

```markdown
# 06a — Airtable Redesign (A-track)

> **Status:** Fas 4a (A-track) klar för Gate 4A.
> **Källprincip:** A-track adresserar gap som har Airtable-klass i 05-gap-vs-worldclass.md Del C.

## Del A — Driftkritiska Airtable-fixar efter MK
[G3, G12, G13 — per åtgärd: schemaförändring/formel/automation, sekvens, konsumentkontroll, blast radius, rollback]

## Del B — Airtable cleanup post-MK
[G4, G5, G8, G10, G11 — per åtgärd: cleanup-steg, konsumentkontroll, säkerhetsvillkor]

## Del C — Airtable preserve-beslut
[Bevara med motivering: namnlösa Personer (DQ6), Återkommande?+rename (DS2), RIM3x-rollup (H9), A2-grenordning (G6 defer fram till verifiering)]

## Del D — Sekvensering
[Ordning för åtgärder. Vilka måste komma före vilka? Vilka kan parallelliseras? Vad är "första veckan post-MK" vs "andra månaden"?]

## Del E — Riskmatris och rollback
[Per åtgärd: risk-nivå (låg/medel/hög), beroenden, hur rullar man tillbaka om något brister]

## Del F — Inter-fas-kontrakt till S-track (Fas 4b)
[Vad A-track låser för S-track. Vad lämnar A-track explicit öppet. Vilka av Del D:s 9 öppna frågor från Fas 3 är besvarade här, vilka är defer:ade till 4b.]

## Del G — Öppna frågor till Gate 4A
[Vad behöver Marcus + Chat besluta innan S-track startar? Vad krävde antagande?]
```

### 3.3 Format per A-track-åtgärd

Varje konkret åtgärd ska ha:

| Fält | Innehåll |
|---|---|
| ID | A1, A2, … (numrera löpande från 1, separat från G-numrering) |
| Adresserar gap | G-id från 05-gap-vs-worldclass.md (kan vara flera) |
| Typ | Fix / Cleanup / Preserve / Rename / Defer-decision |
| Konkret förändring | Exakt vad ändras: fält, formel, automation, view, option-lista |
| Konsumentkontroll | Vilka views, automationer, formulär, Zapier-Zaps, exporter, Edge Functions ska kontrolleras innan ändring |
| Sekvens | Före/efter vilka andra A-åtgärder. Tidsfönster relativt MK |
| Blast radius | Låg / Medel / Hög med motivering |
| Rollback | Hur återställs ändringen om den brister |
| Spårbarhet | Vilken DS/DQ/H-rad detta motsvarar |

### 3.4 Tre milstolpar (M1, M2, M3)

| Milstolpe | Leverans | Slut-test |
|---|---|---|
| M1 | Driftkritiska fixar (Del A) | G3, G12, G13 har konkreta åtgärder med konsumentkontroll och rollback |
| M2 | Cleanup + preserve (Del B + C) | G4, G5, G8, G10, G11 + preserve-besluten har lika hög detaljgrad |
| M3 | Sekvensering, risk, kontrakt (Del D + E + F) | Hela A-track kan implementeras i ordning utan att gå tillbaka |

### 3.5 Uppdateringar i arbetsdokumentet (löpande)

- **§3 Beslutslogg:** lägg till rad för 2026-04-29: G0.3 = soft multi-tenant beslutat av Marcus. Konsekvens: S-track designas med tenant_id + RLS från dag ett. A-track berörs inte direkt.
- **§6 Spårbarhetsmatris:** kolumnen "Fas 4 (åtgärd)" fylls i för rader där A-track gör en åtgärd. Rader som primärt hör till S-track lämnas tomma här — de fylls i av Fas 4b.
- **§9 UNIVERSAL-kandidater:** lägg till nya kandidater om A-track-arbetet avslöjar generaliserbara mönster.
- **§10 Daglig logg:** rader för Fas 4a-start och Fas 4a-slut.
- **§2 Faser och status:** Fas 4 markeras PÅGÅR (A-track) vid start, "PÅGÅR — Gate 4A klar, inväntar 4b" vid avslut.

### 3.6 Estimat

1,5–2 h fokustid. Halvan av Fas 4-totalt per planen — A-track är mindre komplex än S-track eftersom det är cleanup av befintlig modell, inte design från grunden.

---

## 4. Scratch-persistens-strategi (samma som Fas 3)

Lärdom från Fas 2–3: din runtime har **ingen `/compact`**. Compact-disciplin körs via scratch-fil + reload. Det funkade i Fas 3 utan oplanerade reloads — samma mönster nu.

### 4.1 Scratch-filen

Skapa `~/Repon/miranon-media-admin/.codex-scratch/fas-4a-context.md` som första åtgärd efter setup-läsning. `.codex-scratch/` är redan i `.gitignore` sedan Fas 2. Filen lever genom Fas 4a och raderas vid Gate 4A.

Strukturen:

```markdown
# Fas 4a — Codex CLI scratch (raderas vid Gate 4A)

## A. Principregistret P1–P10 (kortversion)
## B. Gap-prioriteringskartan (kortversion av 05-gap-vs-worldclass.md Del C)
[Med fokus på Airtable-klassade rader: G3, G4, G5, G8, G10, G11, G12, G13 + preserve-besluten G6/DQ6/DS2/H9.]
## C. Off-limits-lista före MK
## D. G0.3-beslut (2026-04-29)
[Soft multi-tenant. A-track berörs inte direkt — ingen tenant-abstraktion i Airtable.]
## E. Gate 4A-frågor
## F. R7-fynd från stickproven som rör A-track
[Plane.so: explicit state-tabell + audit-log-mönster för G3/G12. NocoDB: schema/config/field-options som metadata för G10/G11.]
```

### 4.2 Reload-disciplin

När du behöver detaljer som inte finns i scratch-filen — läs originalfilen. Det är billigare att läsa om `data-model.md:1170` (DS1-källa) en gång till än att designa fel åtgärd.

### 4.3 Skriv löpande till disk

Varje milstolpes leverans skrivs till `06a-airtable-redesign.md` direkt. Disk är bättre persistens än kontextfönster. Filen växer milstolpe för milstolpe — du behöver inte hålla hela 06a i kontexten samtidigt.

---

## 5. Gate 4A — STOPPA HÄR

Vid Fas 4a-slut: rapportera, vänta på godkännande, **kör inte vidare till S-track (Fas 4b)**. Det är en separat prompt och en separat session.

**Fyra frågor Gate 4A ställer:**

1. Är A-track implementerbart självständigt? (Airtable excellence-test: blir Miranon tydligt bättre även utan Supabase-migration?)
2. Har varje åtgärd konsumentkontroll definierad?
3. Är sekvensering och rollback-planen realistisk för Lotta/Roger/Marcus att utföra post-MK?
4. Är inter-fas-kontraktet till S-track otvetydigt — vad är låst, vad är öppet?

**Plus två kompletterande:**

5. Har MK-frysen respekterats absolut? (Inga pre-MK-åtgärder)
6. Har du undvikit att smyg-implementera G0.3 i Airtable? (Per P10: ingen tenant-abstraktion i Airtable före behov)

**Rapportformat:**

```markdown
## Fas 4a — Rapport vid Gate 4A

### Levererat
- 06a-airtable-redesign.md: [X åtgärder fördelade på Del A (Y), Del B (Z), Del C (preserve W)]
- Arbetsdokumentet uppdaterat: §3 (G0.3-beslut), §6 (Fas 4-kolumn för A-track-rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (status)
- Scratch-fil raderad: [ja/nej]

### Scratch-events
- Reload-events: [antal, vilka filer, varför]
- Oplanerade reloads: [antal, vad som tappats]

### Gate 4A-svar (Codex' egen bedömning, inte beslut)
1. Självständig implementerbarhet: [bedömning + 1–2 exempel]
2. Konsumentkontroll: [bedömning + räkning av åtgärder med definierad kontroll]
3. Sekvens + rollback: [bedömning + svaga punkter]
4. Inter-fas-kontrakt: [bedömning + lista över låsta beslut och öppna frågor till 4b]
5. MK-frys: [explicit bekräftelse — inga pre-MK-åtgärder finns i 06a]
6. G0.3-disciplin: [explicit bekräftelse — ingen tenant-abstraktion i Airtable]

### Öppna frågor till Marcus + Chat
[Allt som krävde antagande, allt där prioriteringskartan pekade åt flera håll, allt som beror på hur 4b kommer designas]

### Lyft-kandidater för UNIVERSAL
[Nya generaliserbara lärdomar från Fas 4a]
```

Inga commits från Codex. Marcus committar efter granskning.

---

## 6. Operationella regler

| Regel | Konkret |
|---|---|
| Princip-koppling per åtgärd | Varje A-åtgärd måste peka tillbaka på minst ett gap (G-id) i 05-gap-vs-worldclass.md, vilket i sin tur pekar på P1–P10. Saknas det — åtgärden är för lös |
| MK-frys absolut | Inga pre-MK-åtgärder. Allt är post-MK. Gäller även "förberedande" arbete |
| Konsumentkontroll obligatorisk för cleanup | Per Fas 0-lärdom: bulk-mönster är inte bevis. Lista views, automationer, formulär, Zapier-Zaps (alla 6 aktiva), Edge Functions, exporter som ska checkas innan varje cleanup |
| Hypotes-status respekteras | H6 REJECTED, H3/H4/H7 DECIDED. Får inte återupplivas |
| Källhänvisning | Faktuella påståenden får källspår: `filnamn:radnummer` eller MCP-anrop med tabell+filter |
| Live-state vid tvivel | Frusen baseline (Del 0). Använd den, inte ny MCP-extraktion |
| Inga skrivoperationer mot Airtable | Endast read-anrop om något kräver verifiering (osannolikt) |
| Inga commits | Inga `git add` / `git commit` / `git push`. Marcus committar |
| Inga ändringar i tidigare faser | 04-research.md och 05-gap-vs-worldclass.md är låsta. Om A-track-arbetet avslöjar att en princip eller ett gap är fel formulerad — flagga som öppen fråga i Del G, ändra inte källfilerna |
| Stoppa vid Gate 4A | Rapportera, vänta. Inga försök att starta S-track |

---

## 7. Anti-patterns att undvika

Lärdomar från Fas 0–3 plus några specifikt för A-track:

| Anti-pattern | Hur du undviker det |
|---|---|
| Smyg-implementera G0.3 i Airtable | P10 är explicit: ingen tenant-abstraktion i Airtable före behov. Beslutet gäller S-track. A-track ska inte ha `tenant_id`-kolumner, tenant-views, eller workspace-prefix |
| Pre-MK-åtgärder smugna in | Allt post-MK. Om en åtgärd verkar "säker nog för pre-MK" — den är inte det. MK-frysen står absolut |
| Cleanup utan konsumentkontroll | Per Fas 0-lärdom: bulk-mönster är inte bevis. Varje cleanup-åtgärd måste lista konsumenter att checka |
| Förlita sig på S-track för att lösa Airtable-skuld | Airtable excellence-testet: blir Miranon tydligt bättre i sig? Om svaret är "bara om Supabase byggs" — åtgärden hör inte hemma i 06a |
| Resurrektion av REJECTED hypoteser | H6 är stängd. G11/DQ4 är Zapier-config-skuld. Inga form-input-hypoteser |
| Designa runt formelbuggar istället för förbi dem | DS6/DQ7/H4 (record-id-formler) är klassade som Supabase target — försök inte fixa dem i Airtable. Det är target-design |
| Föreslå A1–A11-ändringar utan extraktion | DS7 är defer:ad till Fas 5 av en anledning. Inga A1–A11-ändringar i Fas 4a |
| Förlora preserve-disciplinen | Preserve-besluten (DQ6, DS2, H9) har motivering — bevara dem aktivt med rationale, inte passivt genom att hoppa över dem |
| Lös sekvensering ("kanske först, kanske senare") | Del D måste ge Lotta/Roger/Marcus en faktiskt körbar ordning. Otydlighet här är ett blocker |
| Tappa K7-disciplinen | "Rekommendation i arbetsdokument är inte beslut när gate är öppen". Om en G-rad har "kan vara X" eller "förslag Y" i 05 — det är inte beslut, det är input. A-track gör beslutet eller defer:ar det till Gate 4A |
| /compact-försök | Det finns inte i din runtime. Använd scratch-persistens (§4) |

---

## 8. Vad du gör nu — checklista

1. Läs källfilerna i §2 i ordning, i sin helhet. Ta särskilt tid på `05-gap-vs-worldclass.md` Del C (prioriteringskartan) och Del D (öppna frågor).
2. Skapa `.codex-scratch/fas-4a-context.md` enligt §4.1.
3. Uppdatera arbetsdokumentet §3 Beslutslogg med G0.3 = soft multi-tenant (Marcus 2026-04-29). Uppdatera §10 med rad för Fas 4a-start. Uppdatera §2 status.
4. Skapa `analys/06a-airtable-redesign.md` med skelett enligt §3.2.
5. **M1 — Del A (driftkritiska fixar):** designa A-åtgärder för G3, G12, G13. Skriv till disk.
6. **M2 — Del B (cleanup) + Del C (preserve):** designa A-åtgärder för G4, G5, G8, G10, G11 plus preserve-besluten för G6/DQ6/DS2/H9. Skriv till disk.
7. **M3 — Del D (sekvens) + Del E (risk) + Del F (inter-fas-kontrakt):** sekvensering, riskmatris, vad som låses till S-track.
8. **Del G — öppna frågor till Gate 4A:** allt som krävde antagande.
9. Uppdatera arbetsdokumentet §6 (Fas 4-kolumn för A-track-rader), §9 (UNIVERSAL-kandidater), §10 (logg), §2 (status PÅGÅR — Gate 4A klar).
10. Skriv Gate 4A-rapporten enligt §5.
11. Radera scratch-filen.
12. Stoppa. Vänta på Marcus. **Starta INTE S-track.**

---

*Slut på Fas 4a-prompten. När Marcus passerat Gate 4A skapar Claude Chat `fas-4b-prompt.md` för S-track i en separat session. G0.3 = soft multi-tenant är formellt beslutat och påverkar primärt 4b.*
