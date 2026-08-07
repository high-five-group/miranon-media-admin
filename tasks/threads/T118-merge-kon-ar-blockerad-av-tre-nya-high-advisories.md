---
owner: marcus803
updated: 2026-08-07
review_by: 2026-11-07
status: stable
lifecycle: paused
---

# T118 — Merge-kön är BLOCKERAD av tre nya high-advisories — kräver Marcus strategival (ADR-028)

> Tråd-kort (ADR-053), fött vid registrets tunna radform-migration
> (`TASK-157.2`, [ADR-098](../../docs/decisions/ADR-098-tradregistrets-tunna-radform-vaxt-vagen.md)).
> Innehållet nedan är den ORDAGRANNA texten som tidigare bodde i registrets
> Titel-/Ingång-kolumner för denna rad — flyttad, inte omskriven eller
> sammanfattad. Ursprunglig radhistorik (innan migrationen):
> `git log -p -- tasks/threads/README.md`.

**Ursprunglig Titel-cell:**
**Merge-kön är BLOCKERAD av tre nya high-advisories — kräver Marcus strategival (ADR-028).** Registrerad 2026-08-03 (S96, prototyp-passets landning). **MÄTT:** `audit-ci` fäller på ORÖRT `main` — problemet är inte orsakat av något arbete i sessionen. Tidsfönstret är exakt: sista gröna `merge_group`-körning 17:01:48 (`#674`), första röda 17:18:39 (`#675`), och tre röda till 19:45–19:48. Advisoryn publicerades alltså under passet. **Sårbarheterna** (`npm audit --audit-level=high`): `brace-expansion` 4.0.0–5.0.8 high (DoS via unbounded intermediate arrays, kringgår CVE-2026-14257-mitigeringen, GHSA-rgw5-rvv9-x895) · `fast-uri` 3.0.0–3.1.4 high (host confusion via backslash authority introducer, GHSA-7p8r-x3mc-p8w7) · `postcss` <=8.5.22 moderate (GHSA-fxqj-rqcc-2cmp). Samtliga anger `fix available via npm audit fix`. **KONSEKVENS:** ingen PR kan landa. Sex står armerade och köar: `#675` T110-instansen · `#676` branschmönster-research · `#677` rännstens-research · `#678` växlar-kontraktet · `#679` fokusring-research · `#680` Del 9 + T117 + denna rad. De flödar in av sig själva så snart grinden är grön — inget hänger på handpåläggning. **VARFÖR INGEN ÅTGÄRD ÄR TAGEN:** ADR-028 § Konvention punkt 3 kräver STOPPA-OCH-FRÅGA för strategival, och punkt 1 i Beslut förbjuder `npm audit fix --force` annat än som sista utväg. Åtgärds-matrisen är Marcus: pin + `overrides` per ADR-028 beslut 1 · `npm audit fix` utan force (semver-säkert men rör lock-filen brett) · invänta de fyra öppna Dependabot-PR:erna (`#632`–`#635`) · acceptera och höj `audit-ci`-tröskeln tillfälligt. **Notera ADR-028 beslut 4:** `npm audit --audit-level=high` ska köras vid VARJE sessionsstart. Det gjordes inte vid denna resume — hade det gjorts vid 17:00 hade fönstret upptäckts direkt i stället för via en fallerad kö två timmar senare. Besläktad: `ADR-028` (protokollet) · `T108` (ett tillstånd utan bevakare — kön fallerade tyst i två timmar)

**Ursprunglig Ingång-cell:**
_(ingen kort än — endast registrerad)_
