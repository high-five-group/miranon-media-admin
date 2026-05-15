---
namn: Datamodell-dokumentation — fil-manifest (Fas 0)
syfte: Inventering av samtliga källor som ska analyseras i Fas 1
skapad: 2026-04-27
ägare: Marcus
status: Avvaktar godkännande
---

# Fil-manifest — datamodell-dokumentations-projekt

Inventering av alla filer som kan tänkas ingå i nästa fas. Rapport är ren observation — inga ändringar gjorda i några källfiler.

---

## 1. psionautics/docs/

| Fil | Storlek | Senast ändrad | Anteckning |
|---|---|---|---|
| `data-model.md` | 31 859 B (641 rader) | 2026-04-27 10:11 | **PRIMÄR — aktuell datamodell** |
| `hur-systemet-funkar.md` | 10 387 B (282 rader) | 2026-04-19 18:52 | Pedagogisk beskrivning |
| `Samlade-deltagare.xlsx` | 60 289 B | 2026-04-19 13:39 | Binärt (Excel) — backfill-källa |
| `backfill/` (16 filer) | ~700 kB | 2026-04-26 17:55 | Backfill-arbete (separat scope) |
| `plans/` (2 filer) | 38 429 B | 2026-04-22 19:48 | Planeringsdokument |

### `backfill/` — innehåll

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `README.md` | 14 595 B | 2026-04-20 |
| `_debug.json` | 184 941 B | 2026-04-19 |
| `a2-analys.md` | 9 197 B | 2026-04-19 |
| `agren-backup.md` | 1 779 B | 2026-04-19 |
| `backfill-mapping.yaml` | 122 427 B | 2026-04-19 |
| `checkpoint.json` | 12 911 B | 2026-04-19 |
| `dry-run-log.md` | 119 845 B | 2026-04-19 |
| `execute-log.md` | 15 104 B | 2026-04-19 |
| `execute-stdout-backfill01.log` | 2 584 B | 2026-04-19 |
| `execute-stdout.log` | 3 230 B | 2026-04-19 |
| `tvekainte-backup.md` | 2 148 B | 2026-04-19 |
| `unmatched.md` | 2 355 B | 2026-04-19 |
| `verifiering-2026-04-24.md` | 29 977 B | 2026-04-26 |
| `verifiering-atgardsbilaga-2026-04-24.md` | 24 213 B | 2026-04-24 |
| `verifieringsrapport.md` | 40 189 B | 2026-04-19 |

### `plans/` — innehåll

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `plan-airtable-verifieringssession.md` | 25 335 B | 2026-04-22 |
| `plan-dokumentationspolish-session.md` | 13 094 B | 2026-04-22 |

---

## 2. psionautics/tasks/

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `lessons.md` | 28 949 B | 2026-04-27 12:30 |
| `todo.md` | 12 289 B | 2026-04-27 12:06 |
| `plans/` | — | 2026-04-27 12:07 |
| `sessions/` (9 + transcripts) | — | 2026-04-27 12:04 |

### `tasks/sessions/` — sessionsfiler

| Fil | Storlek | Datum | Titel (rad 1) |
|---|---|---|---|
| `psionautics-session-2026-04-15.md` | 14 272 B | 2026-04-15 | Psionautics Admin — Sessionslogg |
| `psionautics-session-2026-04-16.md` | 7 906 B | 2026-04-16 | Deltagarinformation-mail + UX-modernisering av hela admin |
| `psionautics-session-2026-04-16-em.md` | 7 211 B | 2026-04-18 | Deltagarinsikter: planering + datamodell-dokumentation |
| `psionautics-session-2026-04-19-backfill.md` | 36 249 B | 2026-04-20 | Backfill av historisk närvarodata |
| `retrospektiv-2026-04-19-backfill.md` | 41 248 B | 2026-04-22 | Retrospektiv — Backfill 2026-04-19 |
| `retrospektiv-prompt.md` | 17 540 B | 2026-04-20 | Retrospektiv-session: Psionautics backfill |
| `psionautics-session-2026-04-26-atgardssession.md` | 83 006 B | 2026-04-26 | Åtgärdssession efter verifiering 2026-04-24 |
| `psionautics-session-2026-04-26-fortsattning.md` | 15 647 B | 2026-04-26 | Fortsättning (Punkt 6, 7, 9, 10 + Punkt 4-rättning) |
| `psionautics-session-2026-04-27.md` | 7 324 B | 2026-04-27 | Väntelista-mail 1 |

### `tasks/sessions/transcripts/` — råtranscripts

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `2026-04-19-17-31-16-backfill-psionautics-2026-04-19.txt` | 746 972 B | 2026-04-22 |
| `2026-04-19-21-26-19-backfill-psionautics-2026-04-19.txt` | 591 761 B | 2026-04-22 |
| `2026-04-19-22-40-26-backfill-psionautics-2026-04-19.txt` | 767 560 B | 2026-04-22 |
| `2026-04-19-backfill.txt` | 746 972 B | 2026-04-20 |
| `journal.txt` | 2 135 B | 2026-04-22 |

---

## 3. psionautics/supabase/functions/

| Mapp | index.ts rader | Senast ändrad | Skriver/läser tabeller |
|---|---|---|---|
| `create-admin-user/` | 84 | 2026-03-20 | (inga Airtable-IDs) |
| `create-registration/` | 128 | 2026-04-15 | `tbloOcrppVoyrHbrq` (Anmälningar) |
| `create-waitlist-entry/` | 108 | 2026-04-15 | `tbl2VxMx7JMkIxD4Q` (Väntelista) |
| `generate-template-image/` | 77 | 2026-03-20 | (inga Airtable-IDs) |
| `get-event-bookings/` | 129 | 2026-04-16 | `tblVE3UKWl1CKrphV`, `tbloOcrppVoyrHbrq` |
| `get-plausible-stats/` | 454 | 2026-03-20 | (inga Airtable-IDs — Plausible) |
| `get-waitlist/` | 84 | 2026-04-27 | `tbl2VxMx7JMkIxD4Q` (Väntelista) |
| `get-waitlist-stats/` | 82 | 2026-03-20 | `tbl2VxMx7JMkIxD4Q` (Väntelista) |
| `send-email/` | 199 | 2026-04-27 | `tbl2VxMx7JMkIxD4Q`, `tbloOcrppVoyrHbrq` |
| `update-registration/` | 91 | 2026-04-15 | `tbl2VxMx7JMkIxD4Q`, `tblVE3UKWl1CKrphV`, `tbloOcrppVoyrHbrq` |

**Totalt:** 1 436 rader edge-function-kod över 10 funktioner.

**Identifierade tabell-IDs i kod:**

- `tbloOcrppVoyrHbrq` = Anmälningar
- `tbl2VxMx7JMkIxD4Q` = Väntelista
- `tblVE3UKWl1CKrphV` = (sannolikt Eventplanering eller Eventformat — verifiera mot schema)

---

## 4. miranon-media-admin/docs/

| Fil | Storlek | Senast ändrad | Anteckning |
|---|---|---|---|
| `data-model.md` | 31 255 B (634 rader) | 2026-04-19 18:53 | **DUBBLETT av psionautics-versionen — minimal diff** |
| `hur-systemet-funkar.md` | 10 125 B (276 rader) | 2026-04-19 18:52 | **DUBBLETT av psionautics-versionen — minimal diff** |
| `BUILD-LOG.md` | 23 290 B | 2026-04-14 | Bygglogg |
| `conversion-plan.md` | 107 752 B | 2026-04-14 | Vue→React-migration plan |
| `gap-analysis.md` | 37 100 B | 2026-04-13 | Gap-analys Vue vs React |
| `BYGGPLAN-LÄTTLÄST.md` | 42 893 B | 2026-04-13 | Lättläst byggplan |
| `BYGGPLAN-LÄTTLÄST-v2.md` | 26 795 B | 2026-04-13 | Byggplan v2 |
| `DESIGN-SYSTEM-SPEC.md` | 31 951 B | 2026-04-13 | Designsystem-spec |
| `SECURITY-SPEC.md` | 25 893 B | 2026-04-13 | Säkerhetsspec |
| `STATE-STRATEGY.md` | 9 651 B | 2026-04-13 | State-management |
| `SPA-ARCHITECTURE-DECISION.md` | 9 127 B | 2026-04-13 | SPA-arkitektur |
| `URL-STATE-SPEC.md` | 6 367 B | 2026-04-13 | URL-state |
| `FUTURE-COMPAT.md` | 11 914 B | 2026-04-13 | Framtidskompabilitet |
| `KVALITETSDEFINITIONER-11.md` | 11 785 B | 2026-04-13 | Kvalitetsdef 11/11/11 |
| `PERFORMANCE-BUDGET.md` | 8 903 B | 2026-04-13 | Prestandabudget |
| `DESIGN-MANIFESTO.md` | 6 803 B | 2026-04-13 | Designmanifesto |
| `DESIGN-OPERATING-SYSTEM.md` | 11 152 B | 2026-04-13 | Design OS |
| `ACCESSIBILITY-CHECKLIST.md` | 6 294 B | 2026-04-13 | A11y-checklista |
| `ACCESSIBILITY-AUDIT-MALL.md` | 6 108 B | 2026-04-13 | A11y-audit-mall |
| `ARIA-UPGRADE.md` | 9 209 B | 2026-04-13 | ARIA-uppgraderingar |
| `DOKUMENTATIONSSTANDARD.md` | 1 116 B | 2026-04-13 | Dokstandard |
| `README.md` | 915 B | 2026-04-13 | docs README |
| `decisions/` (10 ADR + README) | 47 392 B | 2026-04-14 | ADR-001 till ADR-010 |
| `features/FEATURE-ACTIVITY-LOG.md` | 8 817 B | 2026-04-13 | Feature-logg |
| `research/` (4 filer) | 125 868 B | 2026-04-13 | React-stack-research |

### `decisions/` — ADR-filer

| Fil | Storlek |
|---|---|
| `README.md` | 2 510 B |
| `ADR-001-biome-over-eslint-stylelint-prettier.md` | 3 446 B |
| `ADR-002-tailwind-v4-theme-css-first.md` | 4 251 B |
| `ADR-003-css-custom-property-naming.md` | 4 226 B |
| `ADR-004-typescript-baseurl-removal.md` | 3 016 B |
| `ADR-005-zod-parallell-definitions.md` | 4 990 B |
| `ADR-006-fetch-with-retry-infrastructure.md` | 5 329 B |
| `ADR-007-event-name-collision-deferred-aliasing.md` | 4 553 B |
| `ADR-008-file-inventory-selective-run.md` | 5 157 B |
| `ADR-009-supabase-client-env-consolidation.md` | 4 765 B |
| `ADR-010-biome-exclude-deno-edge-functions.md` | 5 149 B |

### `research/` — research-filer

| Fil | Storlek |
|---|---|
| `beyond-best-practices-2026.md` | 37 979 B |
| `react-headless-ui-research.md` | 17 589 B |
| `react-stack-research.md` | 22 917 B |
| `vue-project-analysis.md` | 47 383 B |

---

## 5. miranon-media-admin/tasks/

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `lessons.md` | 52 096 B | 2026-04-14 13:51 |
| `todo.md` | 10 711 B | 2026-04-14 13:52 |

---

## 6. miranon-media-os/docs/

| Fil | Storlek | Senast ändrad | Anteckning |
|---|---|---|---|
| `schema_reference.md` | 83 873 B (1 845 rader) | **2026-04-03** (git) | **PRIMÄR Airtable-källa — STALE för april-fält** |
| `miranon_automations_COMPLETE.json` | 638 318 B (15 741 rader) | 2026-03-16 | **AUTOMATIONS-SOURCE — A1–A11** |
| `field_lookup.json` | 7 443 B | 2026-03-19 | Fält-ID-uppslag |
| `AIRTABLE-REFERENS.md` | 12 344 B | 2026-04-03 | Airtable-referens |
| `ARKITEKTUR-DETALJER.md` | 11 903 B | 2026-04-03 | Arkitekturdetaljer |
| `BRAND-CONTENT-PLAN.md` | 2 790 B | 2026-04-03 | Brand/content |
| `BYGGPLAN-LÄTTLÄST.md` | 42 893 B | 2026-04-07 | Byggplan |
| `BYGGPLAN-LÄTTLÄST-v2.md` | 26 795 B | 2026-04-07 | Byggplan v2 |
| `COMPONENT-AUDIT-MALL.md` | 2 420 B | 2026-04-02 | Komponent-audit-mall |
| `DOKUMENTATIONSSTANDARD.md` | 1 116 B | 2026-04-03 | Dokstandard |
| `FK-BEROENDE-ANALYS.md` | 11 977 B | 2026-04-03 | FK-beroenden |
| `KVALITETSDEFINITIONER-11.md` | 11 785 B | 2026-04-03 | Kvalitetsdef |
| `SESSION-21-PLAN.md` | 7 731 B | 2026-04-03 | Session 21-plan |
| `SESSION-25-PLAN.md` | 15 977 B | 2026-04-04 | Session 25-plan |
| `SESSION-CHECKLISTA.md` | 3 843 B | 2026-04-01 | Sessions-checklista |
| `SESSION-HISTORIK.md` | 22 737 B | 2026-04-03 | Sessionshistorik |
| `ACCESSIBILITY-CHECKLIST.md` | 6 294 B | 2026-04-01 | A11y-checklista |
| `ACCESSIBILITY-AUDIT-MALL.md` | 6 108 B | 2026-04-01 | A11y-audit-mall |
| `design-system.md` | 11 391 B | 2026-03-19 | Designsystem |
| `fk-inventory.md` | 20 588 B | 2026-03-30 | FK-inventering |
| `vue-byggplan-v2.md` | 37 994 B | 2026-03-30 | Vue-byggplan v2 |
| `vue-byggplan-v3.md` | 18 147 B | 2026-04-03 | Vue-byggplan v3 |
| `A1_Matcha_anmalan_mot_event_PEDAGOGISK.docx` | 14 714 B | 2026-03-16 | Binärt — A1-doc |
| `Miranon_Automationsdokumentation_KOMPLETT.docx` | 29 049 B | 2026-03-16 | Binärt — automations-doc |
| `Miranon_Media_OS_Introduktion.docx` | 18 387 B | 2026-03-16 | Binärt — introduktion |
| `arkiv/` (6 filer) | ~159 kB | 2026-03-30 | Arkiv inkl. parsed_docs.json |
| `audits/` (16 + screenshots) | ~200 kB | 2026-04-03 | Komponent-audits |
| `features/FEATURE-ACTIVITY-LOG.md` | 8 817 B | 2026-04-05 | Feature-logg |
| `framtida/WEBBPLATS-PLAN-TILLGANGLIGHET.md` | 27 227 B | 2026-04-01 | Framtida webbplats |
| `react-migration/` (16 filer) | ~440 kB | 2026-04-13 | React-migration-research |
| `research/` (3 filer) | ~82 kB | 2026-04-06 | Research |

### `schema_reference.md` — H2-rubriker (27 totalt)

**Första 5:**

1. Tabellöversikt (18 tabeller)
2. Relationskarta
3. Tabell 1: Eventplanering
4. Tabell 2: Eventformat
5. Tabell 3: Anmälningar

**Sista 5:**
23. Vyer per tabell (kartlagt session 3)
24. Formulär (7 st, Elfsight) + Zapier-kopplingar (10 Zaps)
25. Make.com-integrationer (2 scenarier, kartlagt session 3)
26. Automationer (11 st, alla aktiva)
27. Scripts i Script Extension (3 st)

### `schema_reference.md` — sökning efter april-fält

| Sökt sträng | Hits | Status |
|---|---|---|
| `Källa` | 14 | ✅ finns (men kan vara generiska träffar) |
| `Medföljande till` | **0** | ❌ **SAKNAS** |
| `Flyttad till anmälan` | **0** | ❌ **SAKNAS** |
| `Deltagarinfo skickad` | **0** | ❌ **SAKNAS** |
| `Informationsmail 1 skickad` | **0** | ❌ **SAKNAS** |

**Slutsats:** schema_reference.md är **stale** — den dokumenterar inte april-fälten. Senast ändrad 2026-04-03 (git), men ändringarna är i andra filer; själva schemat har inte uppdaterats sedan mars.

---

## 7. miranon-media-os/tasks/

| Fil | Storlek | Senast ändrad |
|---|---|---|
| `lessons.md` | 49 351 B | 2026-04-07 19:17 |
| `todo.md` | 18 324 B | 2026-04-07 19:23 |

---

## 8. Diff-statistik (samma fil i två repon)

| Filpar | Diff (rader) |
|---|---|
| `psionautics/docs/reference/data-model.md` ↔ `miranon-media-admin/docs/reference/data-model.md` | +2 rader / -9 rader (≈11 rader skiljer) |
| `psionautics/docs/reference/hur-systemet-funkar.md` ↔ `miranon-media-admin/docs/reference/hur-systemet-funkar.md` | +2 rader / -8 rader (≈10 rader skiljer) |

**Tolkning:** miranon-media-admin-versionerna är **äldre kopior** (2026-04-19) av psionautics-versionerna. Diff är minimal — sannolikt minisula textförbättringar i psionautics-versionen efter kopieringen. **Behandla psionautics-versionen som master.**

---

## 9. Airtable MCP-verifiering

✅ **MCP svarar.**

```text
{
  "id": "app8uGPrVCVOm6LfD",
  "name": "Miranon Media OS",
  "permissionLevel": "create",
  "recentlyViewedTimestamp": "2026-04-27T08:10:45Z"
}
```

Förväntat ID `app8uGPrVCVOm6LfD` matchar.

---

## 10. Observationer (flaggade saker)

### A. Schema-stalehet bekräftad

`miranon-media-os/docs/schema_reference.md` saknar **0 av 4 verifierade april-fält**. Den är inte längre auktoritativ källa för Anmälningar/Väntelista. Den lever fortfarande som referens för stabila tabeller (Eventplanering, Eventformat) men måste **inte** användas för fält som ändrats sedan mars.

### B. Dubblett-dokumentation i två repon

`data-model.md` och `hur-systemet-funkar.md` finns både i `psionautics/docs/` (master) och i `miranon-media-admin/docs/` (kopia, äldre). Detta är **risk för divergens** — om båda redigeras parallellt drift uppstår. Behöver beslut: konsolidera till ETT repo eller etablera tydlig "source of truth".

### C. miranon_automations_COMPLETE.json är massivt

638 kB, 15 741 rader. Måste läsas programmatiskt (jq, grep, parsning) i Fas 1 — inte i sin helhet. Kommer kräva specifika queries, t.ex. "lista alla automationer som triggas av tabell X" eller "vilka fält skriver A1 till".

### D. Edge functions ger sann bild av faktiskt skrivande

10 edge functions, varav 7 har rörts i april. De är **starkare bevis** på faktiskt systembeteende än dokumentationen, eftersom de är körkod. Bör läsas i Fas 1.

### E. Backfill-katalogen är ett separat scope

`psionautics/docs/backfill/` (~700 kB) är ett avgränsat arbete (april 19–26) — inte primär datamodell-doc. Kan referera till denna för **kontext** men inte som källa till "hur ser tabellen ut idag".

### F. Sessions-transcripts är stora och oprocessade

4 transcripts på 590–767 kB vardera (~2,7 MB totalt) från backfill-arbetet 2026-04-19. **Per CLAUDE.md transcript-disciplin:** transcripts är sanningskälla, men de är råa — bör inte läsas heltäckande. Använd dem för att verifiera enskilda påståenden i sessionsloggar.

### G. Inga saknade fil-referenser

Sessionsfilerna refererar till 19 unika filer/sökvägar. **Alla 19 existerar.** Ingen "spökreferens" hittad.

### H. tblVE3UKWl1CKrphV är okänt utifrån denna analys

Den tredje tabellen som edge-funktionerna skriver till har ID `tblVE3UKWl1CKrphV`. Den nämns inte explicit i CLAUDE.md eller inventeringen. **Verifiering krävs i Fas 1** (sannolikt Eventformat eller Eventplanering — kan kollas snabbt via MCP).

### I. miranon-media-os och miranon-media-admin överlappar

Två separata repon med liknande dokumentation (BYGGPLAN-LÄTTLÄST, DESIGN-SYSTEM-SPEC, ACCESSIBILITY-*, KVALITETSDEFINITIONER, DOKUMENTATIONSSTANDARD). miranon-media-os är "Vue-referensen som ersätts", miranon-media-admin är "React-uppbygget". Beslut behövs: vad i miranon-media-os är fortfarande **load-bearing** för datamodellen, vs. vad är historik?

---

## 11. Tids-estimering — Fas 1 (källextraktion)

**Total volym datamodell-relevant källmaterial (exkl. binärt och react-migration-bygginstruktioner):**

- Primär: schema_reference (84 kB) + miranon_automations_COMPLETE.json (638 kB) + data-model.md (31 kB) + hur-systemet-funkar.md (10 kB) + 10 edge functions (~38 kB källkod) ≈ **800 kB**
- Sekundär (sessionsloggar för kontext): 9 sessions ≈ 230 kB
- Verifiering mot Airtable-MCP: ~10–15 read-queries

**Estimering:** Fas 1 (extraktion + normalisering till en kanonisk källa) tar **2–3 fokuserade arbetspass à 60–90 min**. JSON-parsning av automations-filen är största okända — om vi behöver tolka alla 11 automationer fält-för-fält drar det iväg, men om vi bara extraherar "vad triggar vad → vilka fält rörs" går det snabbare.

**Rekommenderad ordning:**

1. Live MCP-pull av aktuellt schema (sanningskälla för fält idag) — 30 min
2. Extrahera automations-flöde från JSON (A1–A11: trigger, action, fält) — 60 min
3. Korsa edge-functions mot fält de skriver till — 30 min
4. Diff aktuellt schema mot schema_reference.md — flagga gap — 30 min
5. Skriv konsoliderat datamodell-dokument — 60–90 min

**Total: ~3,5–4 timmar effektivt arbete.** Rimligt att hinna på 1 dag eller fördelat över 2 kvällar.

---

*Avvaktar Marcus godkännande innan Fas 1 påbörjas.*
