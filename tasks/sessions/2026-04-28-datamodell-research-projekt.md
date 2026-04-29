# 2026-04-28 — Datamodell-research-projektet

> **Status:** PÅGÅR — Fas 2 klar 2026-04-29. Gate 2 inväntar Marcus godkännande.
> **Plats:** `~/Repon/miranon-media-admin/tasks/sessions/2026-04-28-datamodell-research-projekt.md`
> **Plan:** `~/Repon/miranon-media-admin/tasks/datamodell-research-plan.md`
> **Direktiv:** `~/Repon/miranon-media-admin/tasks/datamodell-research-direktiv.md`
> **Bakgrund:** Följer på datamodell-110-projektet (avslutat 2026-04-28, arbetsdokument arkiverat i samma mapp).

---

## 1. Sammanfattning

Forwards-look-projekt: är modellen i sig 11/10, eller bara dokumentationen av den?

**Tvåstegsstrategi:**
1. Airtable 11/10 först — sanera nuvarande modell efter MK
2. Supabase target sedan — designa målmodell från sanerad bas

**Output (5 filer i `analys/`):**
- `04-research.md` — världsklass-principer
- `05-gap-vs-worldclass.md` — gap-analys
- `06a-airtable-redesign.md` — Airtable 11/10-design
- `06b-supabase-target.md` — Supabase-målmodell
- `07-migration-plan.md` — tvåstegs-migrationsplan

**Inga ändringar i basen, inga commits, ingen migration i denna planfas.**

---

## 2. Faser och status

| Fas | Namn | Output | Status | Estimat |
|---|---|---|---|---|
| 0 | Ramning & projektprotokoll | Godkänd plan + arbetsdokument + G0-beslut | **KLAR** | 30–45 min |
| 1 | Baseline & Constraint Map | Domänkarta + driftkarta + skuldregister | **KLAR — Gate 1** | 1 h |
| 2 | Worldclass Research | `04-research.md` | **KLAR — Gate 2** | 1,5–2 h |
| 3 | Gap vs Worldclass | `05-gap-vs-worldclass.md` | Ej påbörjad | 1,5 h |
| 4 | Redesign (A-track + S-track) | `06a` + `06b` | Ej påbörjad | 3,5–4 h |
| 5 | Tvåstegs-migrationsplan | `07-migration-plan.md` | Ej påbörjad | 1,5–2 h |
| 6 | Slutgranskning | UNIVERSAL-lyft + arkivering | Ej påbörjad | 30 min |

---

## 3. Beslutslogg

| Datum | Beslut | Beslutsfattare | Konsekvens |
|---|---|---|---|
| 2026-04-28 | Tvåstegsstrategi adopterad (Codex' förslag) | Marcus | Hela projektets ram |
| 2026-04-28 | 06-redesign-proposal splittas i 06a + 06b | Chat | Läsbarhet, dm-110-mönster |
| 2026-04-28 | Codex' Fas 4+5 sammanslås till Fas 4 med A-/S-track-milstolpar | Chat | Färre gates, tydligare sekvens |
| 2026-04-28 | 7-fas-strukturen (0–6) godkänd | Marcus | Ersätter 8-fas |
| 2026-04-29 | Förkontroll Code: GO. Förkontroll Codex: NO-GO på Airtable MCP — separat connector-fix krävs senare. REST API-väg verifierad för automationer/webhooks. Tre constraint-påståenden korrigerade (fields-parameter, search_records, MCP-blindhet). Zapier-research: 10 Zaps totalt, 6 aktiva skriver till Airtable, 0 webhooks. DQ4 omklassificerad: hårdkodade Zapier-värden, inte formulärdata. | Marcus + Chat | Constraint-korrigeringar för Fas 1-prompt; H7 omdefinieras; DS7 (NY) tillagd; DQ4 omklassad |

---

## 4. Hypotesregister

> Status-värden: OPEN / SUPPORTED / DECIDED / REJECTED / DEFERRED / PRESERVE
> Format per §7 i planen.

### Ärvda från datamodell-110

| ID | Påstående | Källa | Påverkan | Verifieringsväg | Rekommendation | Status |
|---|---|---|---|---|---|---|
| H1 | A2-grenordning korrekt vid betalning | dm-110 O1 | Bekräftar identity-resolution-design | Test-anmälan i sandbox | Lös genom redesign | OPEN |
| H2 | Personer 87 fält behöver splittras | dm-110 Q10 | Schema-design för Supabase | Domain-driven design-analys i Fas 4 | Beslut i S-track-gate | OPEN |
| H3 | EventKey-bug är formel-symptom, inte data-skuld | dm-110 O5 | Påverkar ny modells matchningsstrategi | Live-MCP + formel-analys | Förbi: ny modell har ej EventKey | DECIDED (förbi) |
| H4 | RECORD_ID()-bug i Deltaganden är formel-bug | dm-110 G1 | Kan inte fixas i Airtable | Fält-test (klart i dm-110) | Migrera bort i Supabase | DECIDED |
| H5 | A2 sätter `Person?` på Anmälan i alla 4 grenar | dm-110 4.M2 | Identity resolution-logik | Live-test eller formel-spårning | Verifiera i Fas 3 | SUPPORTED |
| H6 | SHA256-hashar i `Källa (formulärkälla)` är form-input-data | dm-110 §D.4 | Ersatt: hasharna är hårdkodade Zapier-värden, inte form-data | Avgjord 2026-04-29 via Zapier-research (schema_reference.md §1042-1170, Zap 5+6) | Cleanup hanteras via DQ4 (Zapier-config-fix + Migration transform) | REJECTED |
| H7 | Zapier är primär extern write-path: 6 aktiva Zaps skriver till Anmälningar (Zap 1,3,4), Väntelista (Zap 2), Hämtade erbjudanden (Zap 5,6). 0 native Airtable-webhooks. Make.com är reaktivt (knapp-triggers inifrån basen). | Verifierat 2026-04-29: schema_reference.md §1042-1170 + REST API webhooks-endpoint | Migrationsplan Fas 5 måste ersätta Elfsight→Zapier→Airtable-kedjan (troligt: HTML-form direkt mot Edge Function) | Manuell verifiering i Zapier UI om förändring upptäcks | Kartlägg i Fas 5 | DECIDED (omdefinierad) |
| H8 | `Antal genomförda event` (gammal) kan tas bort | dm-110 DS5 | Cleanup-säkerhet | Konsumentsök i basen | Cleanup post-MK | OPEN |
| H9 | `RIM 3 ×` ska vara rollup, inte formula | dm-110 4.M1 | Schema-konsistens | Live-MCP-verifiering | Beslut i Fas 4 | OPEN |
| H10 | `Manuella flagga` med `choices=[]` är tom-default-skuld | dm-110 DQ2 | Datakvalitet | Konsumentsök | Cleanup post-MK | OPEN |
| H11 | `Systemkälla` med `choices=[]` är tom-default-skuld | dm-110 DQ3 | Datakvalitet | Konsumentsök | Cleanup post-MK | OPEN |
| H12 | E-post som multilineText är typ-skuld från tidig design | dm-110 DQ5 | Schema-modernisering | Migration transform | Migration cleanup | OPEN |

### Nya hypoteser från detta projekt

| ID | Påstående | Källa | Påverkan | Verifieringsväg | Rekommendation | Status |
|---|---|---|---|---|---|---|
| H13 | EventKey-bug (Lucka 10) källa är HTML-formulärets URL-template på psionautics.se, inte Zap 4. Zap 4 använder pre-filled EventKey från Elfsight, så fel format härrör från template-URL. | Zapier-research 2026-04-29 + Lucka 10 i data-model.md | Påverkar Fas 5 designval för EventKey-ersättning | Inspektera HTML-template på psionautics.se | Verifiera template, ev. fixa direkt eller designa bort EventKey-konceptet i ny modell | OPEN |

---

## 5. DS/DQ-beslutsmatris (preliminär klassning)

> Klasser: Airtable fix / Airtable preserve / Airtable cleanup / Supabase target / Migration transform / Defer
> Slutgiltig klassning sker i Fas 3 efter gap-analys.

### Datamodell-skulder (DS)

| ID | Beskrivning | Trolig klass | Kommentar |
|---|---|---|---|
| DS1 | `Är aktiv (1/0)` exkluderar inte Inställt | Airtable fix | Drabbar rapporter idag — driftkritisk |
| DS2 | `Återkommande?` betyder inte "har gått kurs tidigare" | Airtable preserve + rename | Användbart fält, vilseledande namn |
| DS3 | Dead branches i Erfarenhetsbadge | Airtable fix eller Supabase target | Beror på komplexitet, prövas i Fas 3 |
| DS4 | Gammal total missar RIM 3 | Airtable cleanup | Markerat för borttagning |
| DS5 | Parallella `Antal genomförda event`-fält (formula vs gammal rollup) | Airtable cleanup | Efter MK + konsumentsök |
| DS6 | RECORD_ID-bug i Deltaganden (`Anmälan ID`, `Event ID`) | Supabase target | Kan inte fixas i Airtable, formel-bug |
| DS7 | A1–A11-versionerna i live-state är höga (A2 v854, A4 v923) trots att antalet automationer inte ändrats sedan 2026-01-11. Stor edit-historik inuti varje automation. | Defer till Fas 5 | Kräver innehålls-diff av automation-actions mellan dm-110:s 2026-03-16-export och Fas 5-snapshot för att veta exakt vad som ändrats. |

### Datakvalitetsfynd (DQ)

| ID | Beskrivning | Trolig klass | Kommentar |
|---|---|---|---|
| DQ1 | Case-dubletter i `Vill anmäla sig till` | Airtable cleanup + Migration transform | Kanonisera före export |
| DQ2 | Tomma singleSelects: `Manuella flagga` choices=[] | Airtable fix | Trivial cleanup |
| DQ3 | Tomma singleSelects: `Systemkälla` choices=[] | Airtable fix | Trivial cleanup |
| DQ4 | SHA256-hashar i `Källa (formulärkälla)` | Zapier-config-fix + Migration transform | Verifierat 2026-04-29: hashar är hårdkodade statiska värden i Zap 5 och Zap 6 (inte formulärdata). Fix: byt statiska värdet i Zaps. Transform: mappa befintliga records vid migration. |
| DQ5 | E-post som multilineText (Personer) | Airtable fix eller Migration transform | Beror på data-cleanup-behov |
| DQ6 | Namnlösa Personer som lead-state | Airtable preserve + Supabase target | Lead-livscykel formaliseras i Supabase |
| DQ7 | RECORD_ID-bug datakvalitet (samma som DS6) | Supabase target | Formelbaserad |
| DQ8 | Mail skickat men PATCH misslyckas tyst (send-email Edge Function) | Airtable/app fix eller Supabase communication log | Driftkritisk observability |
| DQ9 | Väntelista→Anmälningar-flytt ej transactional | App/Edge Function fix, Supabase transaction senare | Bör inte ignoreras |

### Sammanfattning preliminär klassning

| Klass | Antal | DS/DQ-IDn |
|---|---|---|
| Airtable fix | 4 | DS1, DQ2, DQ3, (DQ5) |
| Airtable preserve + rename | 1 | DS2 |
| Airtable cleanup | 4 | DS4, DS5, DQ1, (delar av DQ6) |
| Supabase target | 4 | DS3 eller DS6, DS6/DQ7, DQ6 (dual) |
| Migration transform | 3 | DQ1, DQ4 [omklassad], DQ5 |
| Defer | 1 | DS7 |
| Driftkritisk observability | 2 | DQ8, DQ9 |

**Notera:** flera fält är dual-klassade (t.ex. DQ1 = cleanup *och* migration transform). Detta är förväntat — vissa skulder löses i Airtable först (för driftvärdet) och *bekräftas* i migrationen (transform-regel).

---

## 6. Spårbarhetsmatris

> Per §9 i planen. En rad per DS/DQ/hypotes som följer punkten genom alla faser.
> Status uppdateras vid varje fas-slut. En rad utan uppdatering = ohanterad punkt → flagga.

| ID | Beskrivning | Fas 1 (lyft) | Fas 2 (research-princip) | Fas 3 (klass) | Fas 4 (åtgärd) | Fas 5 (migration) | Fas 6 (closure) |
|---|---|---|---|---|---|---|---|
| DS1 | `Är aktiv` exkluderar inte Inställt | Lyft i `04-research.md` B3; driftconstraint i B2 (C16/off-limits före MK) | P3 state machines; P9 constraints | – | – | – | – |
| DS2 | `Återkommande?` missvisande | Lyft i `04-research.md` B3; domänkontext i B1 Personer/Anmälningskedjan | P1 lifecycle; P3 state semantics | – | – | – | – |
| DS3 | Dead branches Erfarenhetsbadge | Lyft i `04-research.md` B3; domänkontext i B1 Deltaganden→Personer | P4 derived data/read model | – | – | – | – |
| DS4 | Gammal total missar RIM 3 | Lyft i `04-research.md` B3; kopplad till Personer rollups | P4 derived data; P8 Airtable ergonomics | – | – | – | – |
| DS5 | Parallella `Antal genomförda event` | Lyft i `04-research.md` B3; off-limits före MK tills konsumentsök | P4 derived data; P8 field hygiene | – | – | – | – |
| DS6 | RECORD_ID-bug Deltaganden | Lyft i `04-research.md` B3; markerad Supabase target | P4 no formula truth; P9 relational target | – | – | – | – |
| DS7 | A1–A11 versions-diff | Lyft i `04-research.md` B3; driftconstraint via A1–A11 | P5 audit; P6 integration lifecycle; P7 observability | – | – | – | – |
| DQ1 | Case-dubletter `Vill anmäla sig till` | Lyft i `04-research.md` B3; cleanup + migration transform | P2 identity/canonical values; P8 field hygiene | – | – | – | – |
| DQ2 | `Manuella flagga` tom | Lyft i `04-research.md` B3; Airtable fix post-MK | P8 Airtable field hygiene | – | – | – | – |
| DQ3 | `Systemkälla` tom | Lyft i `04-research.md` B3; Airtable fix post-MK | P8 Airtable field hygiene | – | – | – | – |
| DQ4 | SHA256-options (Zapier-config-källa) | Lyft i `04-research.md` B3 med 2026-04-29 omklassning; constraint B2 C15 | P6 config-as-data drift; P8 visible config | – | – | – | – |
| DQ5 | E-post som multilineText | Lyft i `04-research.md` B3; typ-skuld inför migration | P2 identity; P9 typed constraints | – | – | – | – |
| DQ6 | Namnlösa Personer | Lyft i `04-research.md` B3; B2 C6 säger preserve, inte radera | P1 lead lifecycle; P2 identity resolution | – | – | – | – |
| DQ7 | RECORD_ID-bug datakvalitet | Lyft i `04-research.md` B3; kopplad till DS6 | P4 derived data; P9 target integrity | – | – | – | – |
| DQ8 | Mail-PATCH tyst failure | Lyft i `04-research.md` B3; driftconstraint B2 C12 | P5 audit; P6 side-effect state; P7 observability | – | – | – | – |
| DQ9 | Väntelista ej transactional | Lyft i `04-research.md` B3; driftconstraint B2 C13 | P6 integration boundary; P9 transaction | – | – | – | – |
| H1 | A2-grenordning | Lyft i `04-research.md` B3; driftconstraint B2 C5 | P2 identity; P6 integration edge | – | – | – | – |
| H2 | Personer 87 fält splittra | Lyft i `04-research.md` B3; B1 Personer som kärndomän | P1 lifecycle; P2 identity; P10 tenant gate | – | – | – | – |
| H3 | EventKey-bug (förbi) | Lyft i `04-research.md` B3; kopplad till H13 | P6 ingest/config boundary | – | – | – | – |
| H4 | RECORD_ID()-bug | Lyft i `04-research.md` B3; DECIDED/Supabase target | P4 formula bug not truth; P9 target integrity | – | – | – | – |
| H5 | A2 sätter Person? i alla grenar | Lyft i `04-research.md` B3; B2 C5 markerar verifieringsbehov | P2 identity; P6 integration edge | – | – | – | – |
| H6 | SHA256-hashar | Lyft i `04-research.md` B3; stängd 2026-04-29 som REJECTED — ersatt av DQ4-omklassning | REJECTED; täcks av DQ4/P6 config-as-data drift | – | – | – | – |
| H7 | Zapier extern write-path (omdefinierad) | Lyft i `04-research.md` B3; driftconstraint B2 C14 | P6 integration edges; P7 observability | – | – | – | – |
| H8 | `Antal genomförda event` (gammal) | Lyft i `04-research.md` B3; off-limits före MK | P4 derived data; P8 field hygiene | – | – | – | – |
| H9 | `RIM 3 ×` rollup vs formula | Lyft i `04-research.md` B3; kopplad till Personer/Deltaganden rollups | P4 derived data; P8 rollup ergonomics | – | – | – | – |
| H10 | `Manuella flagga` tom-default | Lyft i `04-research.md` B3; kopplad till DQ2 | P8 Airtable field hygiene | – | – | – | – |
| H11 | `Systemkälla` tom-default | Lyft i `04-research.md` B3; kopplad till DQ3 | P8 Airtable field hygiene | – | – | – | – |
| H12 | E-post multilineText | Lyft i `04-research.md` B3; kopplad till DQ5 | P2 identity; P9 typed constraints | – | – | – | – |
| H13 | EventKey HTML-template-källa | Lyft i `04-research.md` B3; verifieringsväg: inspektera HTML-template | P6 ingest/config boundary | – | – | – | – |

**Total: 29 punkter att spåra.** Ingen ska tappas.

---

## 7. Öppna frågor för Marcus (Fas 0)

### Plan-godkännande (snabba ja/nej)

| ID | Fråga | Min rekommendation |
|---|---|---|
| Plan-1 | Tvåstegsstrategin korrekt? | Ja |
| Plan-2 | Output-filer rätt (5 filer, 06 splittad)? | Ja |
| Plan-3 | Plan i `tasks/`, output i `analys/`, arbetsdokument i `tasks/sessions/`? | Ja |
| Plan-4 | Vilka ändringar är förbjudna? | Inga schemaändringar i basen, inga commits, ingen migration |

### Strategiska G0-frågor (styr Fas 2)

**G0.1 — Källdjup för research**

Räcker textbaserad research, eller stickprov mot konkreta scheman från öppen källkod?

Min rekommendation: textbaserade källor + 2–3 stickprov mot konkreta scheman. Konkreta scheman slår abstrakta principer för migrationsplanering. Förslag på stickprov:
- **Cal.com** (TypeScript, Prisma, PostgreSQL) — direkt jämförbar domän (event-bokning + person-modell)
- **NocoDB** (självhostad Airtable-clone på MySQL/Postgres) — visar Airtable-mönster översatt till relationsdatabas
- **Eventbrite-publik dokumentation** — om tillgängligt, för event-domän-mönster

Alternativt något annat du föredrar?

**G0.2 — Event sourcing/CQRS-djup**

Hur djup går vi på event sourcing/CQRS i Supabase target?

Min rekommendation: utvärdera, sannolikt skip. Audit-logg + immutable history räcker för era behov. Komplexitet för komplexitet är inte 11/10. Men det här är ditt beslut — om du har en specifik anledning att vilja ha event sourcing (t.ex. compliance eller "kan rekonstruera tillstånd vid godtycklig tidpunkt") så designar vi för det.

**G0.3 — Multi-tenant ready**

Ska Supabase-modellen vara multi-tenant ready för framtida produkter (Passionslyftet, Maxat Event)?

Strategiskt beslut med stor schema-påverkan. Tre nivåer:

| Nivå | Vad det betyder | Konsekvens |
|---|---|---|
| **Single-tenant** | En instans per Miranon. Andra produkter får egen Supabase. | Enklare schema. Risk för dubbelarbete vid ny produkt. |
| **Soft multi-tenant** | `tenant_id` på alla tabeller + RLS-policies. Delad Supabase. | Lite extra arbete. Lätt att lägga till ny produkt. **Min rekommendation.** |
| **Hard multi-tenant** | Schema-prefix per tenant, eller separate Postgres-schemas. | Komplext. Bara om regulatoriska krav finns. |

Min rekommendation: soft multi-tenant. Lägg in `tenant_id` + RLS från dag ett. Då ärver vi inte single-tenant-skuld om Passionslyftet eller Maxat Event vill in på samma plattform om 6 månader.

### Övriga beslut (B5–B7)

| ID | Beslut | Min rekommendation |
|---|---|---|
| B5 | `docs/hur-systemet-funkar.md` är måste-läs i Fas 1 | Ja — affärslogik är hård constraint |
| B6 | Research-ribba för Fas 2 | Min rek: minst 5–8 högkvalitativa källor per princip-kluster, inte modellens allmänkunskap |
| B7 | Webhooks/Zapier/Make kartläggs i detta projekt | Ja för designpåverkan, nej för full implementation |

---

## 8. Inter-fas-kontrakt

> Vad varje fas måste leverera för att nästa fas ska kunna starta.

### → Fas 1 startar när:
- Plan-1 till Plan-4 godkända
- G0.1, G0.2, G0.3 besvarade
- B5, B6, B7 besvarade
- Detta arbetsdokument finns på disk

### → Fas 2 startar när:
- Domänkarta levererad (B1)
- Driftkarta levererad (B2)
- Skuldregister populerat i §5 ovan (B3)
- Lista över "off limits"-områden i Airtable

### → Fas 3 startar när:
- 8–12 principer med källor levererade i `04-research.md`
- Bedömningsrubrik klar (R3)
- Principer markerade Airtable / Supabase / både

### → Fas 4 startar när:
- Komplett gap-lista i `05-gap-vs-worldclass.md`
- Alla DS/DQ/hypoteser klassade enligt §5
- Prioriteringskarta för A-track och S-track

### → Fas 5 startar när:
- A-track-gate godkänd (06a klar)
- S-track-gate godkänd (06b klar)
- A→S-koppling tydlig (vad i 06a leder till vad i 06b)

### → Fas 6 startar när:
- Komplett tvåstegs-migrationsplan i `07-migration-plan.md`
- Future Code-prompt utkastad
- Rollback-strategi per migrationssteg

---

## 9. Lyfta lärdomar (kandidater för UNIVERSAL)

> Fylls på under projektet. Lyfts till `marcus-system/tasks/lessons.md` i Fas 6.

### Kandidat 1 — Verifieringsprompter avslöjar verktygskompetens, inte bara verktygsåtkomst

Förkontrollen 2026-04-29 mot Codex och Code visade att kräva 5 olika MCP-operationer i rapporten avslöjade hur båda navigerar verktyg, inte bara om verktygen finns. Code's rapport innehöll bonusfynd (case-dubletter live-bekräftade, parallella `Antal genomförda event`-fält verifierade, korrekt antal Inställt-records), mitigation-strategier (Explore-subagent för record-tunga undersökningar) och tre tekniska constraints. Codex' rapport innehöll nästan inget av detta även för operationer som lyckades.

Lyft-status: Kandidat. Verifieras mot fler datapunkter innan UNIVERSAL-lyft i Fas 6.

### Kandidat 2 — Olika MCP-implementationer av samma underliggande tjänst kan ha olika tool-namn och olika capabilities

Code har två parallella Airtable-MCP-servrar (`mcp__airtable__*` och `mcp__claude_ai_Airtable__*`) med 16+18 tools, varav vissa överlappar och vissa är unika. Codex hade en *tredje* implementation med andra tool-namn (`airtable_search_records` etc) som inte fungerade alls. "Airtable MCP" är inte en monolitisk capability — det är en familj av implementationer.

Konsekvens: vid multimodellsprojekt — verifiera tool-namn och tool-capabilities per modell, inte bara per tjänst.

Vidare nyans: en MCP-server kan vara antingen lokalt konfigurerad (via lokal config-fil som ~/.claude.json eller ~/.codex/config.toml) eller plattforms-tillhandahållen (exponerad av runtime/sandbox utan lokal config). Distinktionen påverkar replikerbarhet — plattforms-tillhandahållna MCP-servrar kan inte replikeras till andra modeller utan att gå via plattformens egna mekanismer. Verifierat 2026-04-29: Code har 16 lokalt konfigurerade Airtable-tools (mcp__airtable__*) plus 18 plattforms-tillhandahållna (mcp__claude_ai_Airtable__*) — Codex kan bara replikera den första uppsättningen.

Lyft-status: Kandidat.

### Kandidat 3 — Verktygsbegränsningar måste verifieras mot källa, inte tas på AI-rapportens ord

Code's förkontroll-rapport (2026-04-29) angav tre verktygsbegränsningar som alla tre visade sig vara felaktiga eller ofullständiga vid uppföljande verifiering. Två berodde på att ett parallellt verktyg fanns som han inte använde i förkontrollen; en på att en parameter (fieldIds) inte testades. När AI rapporterar "verktyget kan inte X", verifiera genom andra verktyg/varianter och dokumentationen innan det blir en designparameter.

Detta är en specifik tillämpning av "Live-state vinner alltid över dokumenterad state" (lessons.md 2026-04-28) — i detta fall live-verktygskapacitet vs rapporterad verktygskapacitet.

Lyft-status: Kandidat.

### Kandidat 4 — Diagnostik-verktyg kan exponera secrets utan varning

Vid Codex MCP-konfigurering 2026-04-29 exponerade kommandot `codex mcp list --json` Airtable-tokenens fulla värde i CLI-output direkt efter registrering. Tokenen hamnade i tool-loggen för sessionen innan redaction kunde appliceras. Tokenen behövde regenereras som följd.

Generaliserbar lärdom: diagnostik-verktyg som listar konfiguration (MCP-servrar, env-variabler, secrets-stores) kan defaultmässigt visa values, inte bara metadata. Innan första diagnostik-anrop mot ny config — verifiera om verktyget har redaction-flagga (--redact, --no-secrets eller motsvarande), eller pipe genom egen filtrering. "Inspektera först, verkställ sedan" är otillräckligt om inspektionen själv är exponeringsvektorn.

Konkret tillämpning: undvik `--json`-flaggor och strukturerad-output-flaggor på config-introspection-kommandon tills man verifierat att secrets är redacted. Använd istället human-readable output där secrets oftare är dolda by default.

Lyft-status: Kandidat. Kopplad till Kandidat 5 (hash-prefix-metoden) som operationell lösning.

### Kandidat 5 — Token-identifiering via hash-prefix istället för värde-eko

För att verifiera att rätt token finns på plats utan att exponera värdet — använd kort hash-prefix (t.ex. första 8 hex-tecken av SHA256) som stable identifier. Tillämpas vid token-rotation, config-migration, och cross-session-verifiering.

Operationaliserat 2026-04-29 via:
python3 -c "import hashlib,re; t=re.search(r'AIRTABLE_API_KEY = \"(.+?)\"', open('$HOME/.codex/config.toml').read()).group(1); print('len:', len(t), 'prefix:', t[:4], 'hash8:', hashlib.sha256(t.encode()).hexdigest()[:8])"

Output: len, prefix (4 första tecken — "patv" / "pata" / "key..." beroende på API), hash8 (8 hex-tecken).

Konsekvens: vid token-rotation kan vi bekräfta i ny session att rätt värde finns på plats genom att jämföra hash8 — utan att eka det faktiska värdet. Vid truncated paste eller felaktig kopiering syns det omedelbart i hash-mismatch.

Generaliserbart bortom MCP-tokens: gäller alla secrets/credentials som behöver verifieras över sessioner eller mellan miljöer. SHA256-truncated identifiers är industristandard för content-addressable verification.

Lyft-status: Kandidat. Kopplad till Kandidat 4 (problemet som denna metod adresserar).

### Kandidat 6 — Config-as-data drift ska klassas vid integrationskanten, inte vid symptomfältet

Fas 2 fångade att DQ4 inte ska researchas som form-input-dedup efter att H6 stängts som REJECTED. Samma dataform i Airtable kan vara ett symptom på statisk integration-config, form-input, migration transform eller manuell cleanup. Klassningen måste därför börja vid write-path och config-ägare, inte vid fältets utseende.

Konsekvens: när externa verktyg skriver till databasen, inför en separat fråga i research/gap: "Är detta användardata, integration-config, defaultvärde eller transform-output?" innan cleanup föreslås.

Lyft-status: Kandidat.

---

## 10. Daglig logg

| Datum | Händelse |
|---|---|
| 2026-04-28 | Direktiv skapat. Plan föreslagen av Chat (sammanslagning av Codex' tvåstegsstrategi + Chats ramning). Plan godkänd av Marcus. Fas 0 startad. Arbetsdokument skapat med 27 spårbarhetsrader populerade. G0-frågor lyfta till Marcus. |
| 2026-04-29 | Förkontroller mot Codex och Code. Codex blockerad på Airtable-MCP — fix planerad efter arbetsdokumentet uppdaterats. Code: GO. REST API-verifiering: Bash + curl mot /v0/meta/bases/{baseId}/automations gav 11 automationer (snapshot sparad i /tmp/airtable-automations-2026-04-29.json). Webhooks-endpoint: 0 webhooks. Constraint-korrigeringar i tre tidigare påståenden om MCP-tools. Zapier-research: 10 Zaps i schema_reference.md §1042-1170, 6 aktiva skriver till basen (Zap 1-6). DQ4-källa identifierad: hårdkodade statiska värden i Zap 5+6, inte formulärdata. H7 omdefinierad till Zapier-kartläggning. Inga blockerare för Fas 1. |
| 2026-04-29 | Fas 1 startad av Codex från quickstart `tasks/sessions/fas-1-prompt.md`. Källor lästa i angiven ordning; `git pull` körd och repot var redan uppdaterat. |
| 2026-04-29 | Fas 1 klar: `analys/04-research.md` skapad med Del 0 Baseline & Constraint Map (B1 Domänkarta, B2 Driftkarta, B3 Skuldregister). §6 spårbarhetsmatris uppdaterad för alla 29 punkter. §2 markerad Fas 1 KLAR/Gate 1. Stoppar här enligt Gate 1. |
| 2026-04-29 | Mini-uppdrag mellan Fas 1 och Fas 2: H6 stängd som REJECTED. SHA256-hash-hypotesen direkt motsagd av 2026-04-29 DQ4-omklassning (hashar är hårdkodade Zapier-värden i Zap 5+6, inte form-data). §4 hypotesregister, §6 spårbarhetsmatris och `04-research.md` B3 uppdaterade. Cleanup-ansvar flyttat till DQ4. |
| 2026-04-29 | Fas 2 startad av Codex. Alla §2-källfiler i `tasks/sessions/fas-2-prompt.md` lästa i ordning. `.codex-scratch/fas-2-context.md` skapad enligt §4.1 och `.codex-scratch/` lades till i `.gitignore` eftersom ignore-regel saknades. Compact-punkt 1: scratch reloaded; `codex --help` verifierade ingen non-interactive compact-subcommand i denna API-runtime, så compact-disciplinen körs via scratch-persistens + reload och råmaterial släpps från arbetsminnet. |
| 2026-04-29 | Fas 2 klar för Gate 2. `analys/04-research.md` Del 1 fylld med 10 principer (P1–P10), källkluster och öppna repoexempel. §6 spårbarhetsmatris fick kolumnen Fas 2 (research-princip) för alla 29 punkter. §9 fick Kandidat 6 om config-as-data drift. Compact-punkt 2/3 behövde inte aktiveras utöver scratch-persistens eftersom context hölls under kontroll. Scratch-filen raderades inför Gate 2. |

---

## 11. Live-verifierade tekniska fakta

> Verifierat 2026-04-29 via Airtable MCP mot bas app8uGPrVCVOm6LfD.
> Uppdateras vid behov om live-state ändras under projektet.

### 11.1 Bas-ID

`app8uGPrVCVOm6LfD` — Miranon Medias Airtable-bas.

### 11.2 Tabell-IDn (18 tabeller)

| Tabell | ID |
|---|---|
| Eventplanering | `tblVE3UKWl1CKrphV` |
| Eventformat | `tbl8qhuJQ5ZWPMRk4` |
| Personer | `tbl6ZyCm3V026iFTU` |
| Anmälningar | `tbloOcrppVoyrHbrq` |
| Deltaganden | `tbldWHH6sSHWoQPHH` |
| Hämtade erbjudanden | `tblqFpgxEhJ95AEcM` |
| Engagemang | `tbl9H2SoGFfysBj5y` |
| Touchpoints | `tbl22SCvlHrgcAiZi` |
| Erbjudanden | `tblcCFGCVrnl1JZfg` |
| Kontaktlogg (rådata) | `tblzg4DsRzCCXH8Vy` |
| Bulkutskick | `tblWarzSse85NI1Zx` |
| Path to Conversion | `tblor5TK8HeryGXIj` |
| Väntelista | `tbl2VxMx7JMkIxD4Q` |
| Email Opens | `tblXFJyGRahQDhhqc` |
| Utskickslogg | `tblIesjbuSWNp6oxK` |
| Error-log | `tblnnmWswnRp9gFws` |
| Segment | `tbll2N6JKCj4u6y9o` |
| Instagram Posts | `tblMpQI1crF521Xsp` |

### 11.3 Fältnamns-rättningar

Live-verifiering 2026-04-29 visade att vissa fältnamn vi använt i tidigare dokumentation är fel:

| Antaget i äldre dokument | Korrekt namn i live-bas |
|---|---|
| Email | E-post (Personer-tabellen) |
| — | Normaliserad e-post (separat fält i Personer) |

Vid varje fält-referens i Fas 1+: verifiera mot live-schema via describe_table om osäker.

### 11.4 Bevisade verktygsvägar

| Behov | Verktyg | Anteckning |
|---|---|---|
| Records (med filtrering) | mcp__airtable__list_records + filterByFormula | Codex: saknar fieldIds-parameter. Code: har via parallell mcp__claude_ai_Airtable__-server. |
| Schema (tabeller, fält, vyer) | mcp__airtable__describe_table | Vyer synliga i output |
| Sök i text | mcp__airtable__search_records | Substring-sök; kan begränsas via fieldIds (verifiera format vid behov) |
| Interfaces / dashboards / pages | mcp__claude_ai_Airtable__list_pages_for_base | **Endast Code — Codex saknar denna** |
| Automationer | Bash + curl mot /v0/meta/bases/{baseId}/automations | Verifierat: 11 automationer 2026-04-29 |
| Webhooks | Bash + curl mot /v0/bases/{baseId}/webhooks | Verifierat: 0 webhooks 2026-04-29 |
| Scripts | Ingen API | Manuell extraktion via UI om relevant |

---

*Detta dokument lever och uppdateras kontinuerligt under hela projektets gång. Arkiveras (status FRUSEN) i Fas 6.*
