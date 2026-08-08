---
owner: marcus803
updated: 2026-08-08
review_by: 2027-02-08
status: stable
---

# Styrande docs-auditens Explore-substrat — S99 uppdrag 9 (frusen ögonblicksbild 2026-08-07)

> **FRUSEN ÖGONBLICKSBILD — mätt 2026-08-07 mot dåvarande HEAD `bef4114b`.**
> Sakinnehållet nedan rättas ALDRIG: varje tal och fil:rad-referens beskriver
> disk som den såg ut vid mätningen, FÖRE åtgärdsarbetet. Levande källor är
> koden och dokumenten själva; åtgärdsläget bor i skivorna `task-161.1`–`161.10`
> (backlog) och sessionsdok S99. Fil:rad-referenserna pekar mot dåvarande
> worktree-checkouten `s99-resume-2` — samma innehåll som main vid `bef4114b`.
>
> **Proveniens.** Detta är Explore-agentens fullständiga slutrapport
> ("Inventera styrande docs för audit", S99 resume 2, 2026-08-07) — substratet
> bakom PRD `task-161` och dess tio skivor. Rapporten landade aldrig som
> artefakt vid skapandet; den levde bara i sessionens kontext, och två
> byggagenter (`161.3`, `161.7`) blockerades senare av frånvaron. Återfunnen
> 2026-08-08 i sessions-transkriptet (projekt-katalogen för worktreen
> `s99-resume-2`, transkript `9ed7f151`, rad 759) och landad retroaktivt på
> Marcus order: *"Allt material måste ju landa som artefakter."* Lärdomen:
> underlag som en spec refererar ska landa som filartefakt i samma landning
> som specen — en sessions kontext är inte en hemvist.

---
Läst ADR-100 i sin helhet först. Kartan följer.

---

## STYRANDE DOKUMENTYTA — AUDIT-SUBSTRAT (S99 uppdrag 9)

**Måttstock:** `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s99-resume-2/docs/decisions/ADR-100-sanningshierarkin-koden-ager-beteendet.md` (260 rader). §1 domäntabell · §2 karta-aldrig-kopia · §3 läsregeln · §4 frys-banderoll · §6 ingen ny grind.
**Repo-rot:** `/Users/marcus/Repon/miranon-media-admin/.claude/worktrees/s99-resume-2` (HEAD `bef4114b`, main + Del 9).
**Alla mätvärden tagna mot disk 2026-08-07.**

---

## 1. INVENTARIET

### 1a. Auto-laddad yta (kostar kontext varje session)

| # | Fil | Rader | Tecken | `updated` | git senast | Anspråk |
|---|---|---|---|---|---|---|
| H | `/Users/marcus/.claude/CLAUDE.md` → symlink → `/Users/marcus/Repon/marcus-system/CLAUDE.md` | 202 | 16 398 | `2026-07-11` (rad 3) | **2026-08-02** (`74d08ec`) | Konstitution: Marcus-profil, roll-arkitektur, alltid-gäller-instruktioner, verktygsfakta, self-review-disciplin |
| S | `.../s99-resume-2/CLAUDE.md` | 683 | 40 909 | `2026-08-07` | 2026-08-07 (`9c954f40`) | Projekt-konstitution: styrande-dok-pekare, triage, DoD-kommandon, fem operativa verktygsavsnitt, design-system, kvalitetsribba |
| | **SUMMA AUTO-LADDAT** | **885** | **57 307** | | | ≈ 14 300 tokens |

**Notera H:** hubbens `updated:`-fält är 22 dagar äldre än filens sista commit. Spokens `scripts/check-frontmatter.sh` (Check 2) grindar exakt den invarianten — hubben ligger utanför den grinden.

### 1b. FRONTMATTER_GOVERNING_DOCS (14 poster, `.frontmatter-policy.conf:38–53`)

| # | Fil (absolut) | Rader | Tecken | `updated` | git senast | Vad den gör anspråk på att äga |
|---|---|---|---|---|---|---|
| 1 | `.../s99-resume-2/CLAUDE.md` | 683 | 40 909 | 2026-08-07 | 2026-08-07 | (se 1a) |
| 2 | `.../s99-resume-2/ORDLISTA.md` | 270 | 15 034 | 2026-08-03 | 2026-08-03 | "Ordlistan äger BEGREPPEN (vad något ÄR, på begreppsnivå)" (rad 11) — produktdomänen, ej mekanik, ej systemtermer |
| 3 | `.../s99-resume-2/docs/byggplan.md` | 1 125 | 75 116 | 2026-08-07 | 2026-08-07 | "styrande planen" (rad 36); §2 fas-tabell = fas-status; §4 per-fas-prompter |
| 4 | `.../s99-resume-2/docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` | 613 | 50 530 | 2026-06-29 | 2026-06-29 | Gunilla-läsbar parallell-berättelse av byggplanen |
| 5 | `.../s99-resume-2/docs/specs/KVALITETSDEFINITIONER-11-REACT.md` | 102 | 6 330 | 2026-06-20 | 2026-06-20 | "styrande kvalitetsribba för 11/11/11-anchorn" (rad 20) — **§3–§5 explicit deferrade/ofyllda** |
| 6 | `.../s99-resume-2/docs/specs/SECURITY-SPEC.md` | 911 | 32 845 | 2026-08-05 | 2026-08-05 | Säkerhetsmodell M1–M8, OWASP-matris, §6.10 EF-ribba |
| 7 | `.../s99-resume-2/docs/reference/hur-systemet-funkar.md` | 295 | 12 305 | 2026-06-24 | 2026-06-24 | Gunilla-nivå systemöversikt; rad 11–13: **manuellt synkad kopia** till `~/Repon/psionautics/` |
| 8 | `.../s99-resume-2/docs/reference/data-model.md` | 1 348 | **122 788** | 2026-08-01 | 2026-08-01 | "**AUKTORITATIV** för datamodellen" (rad 30); "primär källa för fält-IDs och options" (rad 35) = ADR-100 domän 5 |
| 9 | `.../s99-resume-2/docs/reference/airtable-constraints.md` | 577 | 43 984 | 2026-08-07 | 2026-08-07 | "Auktoritativ katalog över Airtables **strukturella** begränsningar" (rad 10); P1–P29 |
| 10 | `.../s99-resume-2/docs/reference/airtable-interaction.md` | 342 | 23 471 | 2026-07-07 | 2026-07-07 | "äger app↔Airtable-KONTRAKTET" (rad 51); EF-katalog §5; write-allowlist §7; `_shared`-API §8 |
| 11 | `.../s99-resume-2/docs/reference/systemet.md` | **18** | **739** | 2026-07-08 | 2026-07-08 | **Ren pekare** till hubbens `SYSTEMET.md`. Äger ingenting; mönsterexemplet |
| 12 | `.../s99-resume-2/docs/reference/segment-arkitektur.md` | 102 | 7 872 | 2026-07-11 | 2026-07-11 | "Uppslagsverk/orientering — sak-besluten lever i ADR-062/063/064"; rad 9: "Vid konflikt gäller ADR:erna" |
| 13 | `.../s99-resume-2/tasks/lessons.md` | **10 100** | **794 006** | 2026-08-06 | 2026-08-06 | "organisatoriska minne"; rad 17: "Claude läser denna fil vid varje sessionsstart" |
| 14 | `.../s99-resume-2/docs/decisions/README.md` | 160 | **71 851** | 2026-08-07 | 2026-08-07 | ADR-format, korrigering-vs-supersedering, **Index: 100 rader × (titel + sammanfattning + status + fas)** |
| | **SUMMA 14** | **16 646** | **1 297 780** | | | |

### 1c. Styrande-i-praktiken men UTANFÖR allowlistan (ingen frontmatter, ingen `check-frontmatter.sh`)

| Fil | Rader | Tecken | Konsumeras som styrande av |
|---|---|---|---|
| `.../s99-resume-2/CONTRIBUTING.md` | — | 71 249 | CLAUDE.md:73 (DoD), :451 (Landnings-ordningen), :535 (kö-parametrar) |
| `.../s99-resume-2/README.md` | — | 10 843 | Bär den **CI-grindade** ADR-räkningen (rad 145) + fas-status-pekare (rad 14) |
| `.../s99-resume-2/docs/specs/DESIGN-SYSTEM-SPEC.md` | — | ~1 600 rader | CLAUDE.md:611 + :624 (design-systemets fulltext) |
| `.../s99-resume-2/docs/reference/schema_reference.md` | — | — | ADR-100 §4 **upphöjer dess öppningsstycke till standard** — filen själv är ogrindad |
| `.../s99-resume-2/.claude/agents/bygg-agent.md` | — | 13 423 | Auto-laddas per bygg-agent; historisk "nio"-drift bokförd i ADR-100:32 |

---

## 2. ADR-100-BROTT — prosa som KOPIERAR i stället för att PEKA

Historiskt kända, redan rättade fall (ej fynd): `verify:ci-parity`-raden (CLAUDE.md:116–124), ADR-081-raden (CLAUDE.md:579–582), STOPPA-OCH-FRÅGA-raden (hub CLAUDE.md:104–109), ISSUE-SUBSTRAT-raden (hub CLAUDE.md:135–138). Nedan är samma klass på **orättade** ytor.

### B1 — Design-token-exemplen: 5 av 7 namn existerar inte i koden (domän 1, KODEN äger)

`.../s99-resume-2/CLAUDE.md:613`
> `**Primitiv** (src/styles/tokens/primitives.css) — råa värden: --mm-amber-500: #FFBA05, --mm-blue-900: #1B4965, etc.`

Mätt: `src/styles/tokens/primitives.css` innehåller **noll** träffar på `--mm-amber-500` eller `--mm-blue-900`. Filen bär `--p-gold-1..12`, `--p-copper-*`, `--p-neutral-*` (rad 35–44) plus legacy `--p-gold-500: #d4960a` (rad 162). Hex-värdet `#FFBA05` finns inte i filen.

`.../s99-resume-2/CLAUDE.md:614`
> `**Semantisk** (src/styles/tokens/semantic.css) — roller: --mm-color-primary, --mm-color-focus-ring, --mm-color-text-default.`

Mätt: `semantic.css` definierar `--mm-primary`, `--mm-text`, `--mm-bg` (rad 3, 15, 20). Ingen av de tre citerade rollerna är definierad någonstans i `src/` (`grep -- "--mm-color-primary:" src/` → 0 träffar).

Sido-fynd i koden, ej doc-fynd: `src/components/events/atgarder/AtgardsSida.tsx:843` **konsumerar** `var(--mm-color-primary)` som aldrig definieras; `src/components/events/Betalningar.tsx:152` refererar `--mm-color-focus-ring` i kommentar.

Rad 615 (`--mm-button-primary-bg`, `--mm-dialog-overlay-bg`) verifieras däremot mot `components.css:20` respektive `:147`. Kopian är alltså 2/7 sann.

### B2 — D0-globen: en ofullständig kopia av en lista `ci.yml` äger (domän 1)

`.../s99-resume-2/CLAUDE.md:161–167` räknar upp D0-allowlistan som om den vore uttömmande.

Källa: `.../s99-resume-2/.github/workflows/ci.yml:186–216` (avgränsad av `paritet:start klassning-d0` / `paritet:slut klassning-d0`).

| | ci.yml | CLAUDE.md:161–167 |
|---|---|---|
| Positiva poster | 17 | **7** |
| Saknas i CLAUDE.md | | `LICENSE`, `scripts/test-vale-regression.sh`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.vscode/extensions.json`, `.editorconfig`, `.lycheeignore`, `.vale.ini`, `.markdownlint-cli2.jsonc`, `.claude/**/.*` |
| Undantag | 12 | 11 — saknar `!.github/dependabot.yml` |

Kontrast: `ci.yml`s egna paritet-markörer binder listan mekaniskt mot D1 och acceptance-klassen. CLAUDE.md-kopian är den enda instansen **utanför** paritetsparet.

### B3 — Grind-räkningen "13": talklassen ur ADR-100:31–33, två gånger i samma auto-laddade fil

- `.../s99-resume-2/CLAUDE.md:84` — "…yamllint, audit-ci, **13** dokumentations-grindar, **~20** gatekeeper-testsviter…"
- `.../s99-resume-2/CLAUDE.md:134–135` — "`npm run check:docs` (de **tretton** dokumentations-grindarna)"

`scripts/check-docs.sh` äger talet och har lärt sig av just detta fel: slutraden är **härledd** (`:288`, `${#PASSED[@]}`) och kommentaren `:46–47` säger uttryckligen att kopian togs bort ur `.claude/agents/bygg-agent.md`. Talet är i dag sant (4 docs-jobb-grindar `:51–54` + 9 `run_gate` `:231–245`) — men CLAUDE.md bär två fria kopior som ingen grind håller, av exakt det tal vars kopiering ADR-100 citerar som felklassens ursprung. `~20 gatekeeper-testsviter` är ogrindat och ospårat till någon källa.

### B4 — `airtable-interaction.md`: EF-antal drift 11 → 28 (domän 1)

`.../s99-resume-2/docs/reference/airtable-interaction.md:98`
> "**Elva funktioner** i `supabase/functions/` (utöver `_shared/`). Belägg mot commit `e499a89`."

Mätt: `ls -d supabase/functions/*/` → 29 kataloger, minus `_shared` = **28** Edge Functions på disk. Odokumenterade i §5: `compute-segment`, `create-admin-user`, `create-event`, `create-event-note`, `get-event-formats`, `get-event-notes`, `get-leads`, `get-mail-log`, `get-registration`, `get-segments`, `invite-user`, `save-segment`, `send-email`, `send-registration-confirmation`, `update-event`, m.fl.

Doket är stämplat mot en commit (`e499a89`) och är därmed de facto en **frusen ögonblicksbild** — men det bär `status: stable`, ligger i governing-listan, och saknar frys-banderoll enligt ADR-100 §4 (frusen-markör + frysdatum + pekare till levande källa). ADR-100 §4:s tre element är noll av tre.

### B5 — Samma fil: varningsblocket som varnar för drift har självt driftat

`.../s99-resume-2/docs/reference/airtable-interaction.md:271–277`
> "⚠ **Färskhets-exempel — kod slår kommentar.** `update-record/index.ts:14` påstår *"Operations-registret är tomt idag…"*. Det är **stale** — registret bär **3 operationer** … Källan för write-kontraktet är `field-allowlists.ts`, **aldrig** EF-headern."

Mätt: `supabase/functions/_shared/field-allowlists.ts` bär **13** operationer (rad 35, 48, 59, 71, 84, 98, 106, 124, 151, 173, 205, 239, 264). Talet 3 är fel med 10. Blocket existerar för att illustrera att prosa åldras osynligt.

### B6 — Samma fil: rad-referenser till kod som flyttat

`.../s99-resume-2/docs/reference/airtable-interaction.md:260–262` (§7-tabellen) och `:266–267`, `:288` (§8-tabellen):

| Påstådd adress | Faktisk adress |
|---|---|
| `field-allowlists.ts:35-38` (`mark-registration-fee-paid`) | `:35` ✓ |
| `field-allowlists.ts:44-46` (`update-person-note`) | `:106` |
| `field-allowlists.ts:57-71` (`create-registration`) | `:124` |
| `getOperation` (`:76`) | `:272` |
| `findDisallowedField` (`:84`) | `:280` |

`airtable-filter.ts`- och `coerce.ts`-raderna i §8 stämmer däremot exakt mot disk (63/75/127/136/144/149/168 respektive 30/41/65/82).

### B7 — `byggplan.md`: auktoritets-pekare till en fil som inte finns + ADR-räkning drift 10 → 100

`.../s99-resume-2/docs/byggplan.md:15`
> "**Auktoritativ källa för fas-sekvens:** `tasks/byggplan-direktiv.md` §5 (post-P1)"

Mätt: `tasks/` innehåller `lessons.d/`, `lessons.md`, `s91-restlistan.md`, `sessions/`, `threads/`, `todo.md`. Filen ligger i `.../s99-resume-2/docs/archive/byggplan-direktiv.md`. Raden pekar auktoritet på en arkiverad fil vid en död sökväg — och den motsägs av samma fils rad 36, som säger att byggplan.md "ersätter … `tasks/byggplan-direktiv.md`".

`.../s99-resume-2/docs/byggplan.md:16`
> "**ADR-katalog:** `docs/decisions/` (**10 ADR:er** listade i §5 …)"

Mätt: 100 ADR-filer; `README.md:145` säger "100 arkitekturbeslut" och grindas av `scripts/check-adr-count.sh`. byggplan.md:16 bär en ogrindad kopia som driftat 10×. (§5-brödtexten `:1084` är historiskt scopad till P3a — headerbanderollen `:16` är det inte.)

### B8 — Fakta om Airtable-basen kopierade ut ur domän-5-källan

- `.../s99-resume-2/docs/reference/hur-systemet-funkar.md:26–28` — "Antal tabeller | **18**", "Automationer | **11 (A1–A11, alla aktiva)**", "Formulär | **7**"
- `.../s99-resume-2/docs/reference/hur-systemet-funkar.md:65` — samma tal en gång till, i ASCII-diagrammet: "(18 tabeller, 11 automationer)"
- Källan: `.../s99-resume-2/docs/reference/data-model.md:91` "**18 tabeller. 358 fält totalt 2026-04-28.**" — som i sin tur pekar vidare på `02-live-state.md` (en research-fil).
- `.../s99-resume-2/CLAUDE.md:30` — "(**29 poster**, A–G)" om `airtable-constraints.md`. Mätt: P1–P29 = 29, i dag sant, ogrindat.

Skärpande omständighet på `hur-systemet-funkar.md`: raderna 11–13 deklarerar filen som **manuellt synkad tvillingkopia** till `~/Repon/psionautics/docs/reference/hur-systemet-funkar.md` — ett driftrisk-par per konstruktion, öppet bokfört men utan mekanism.

### B9 — `docs/decisions/README.md`: 71 851 tecken kopierad ADR-substans

Index-tabellen (`:56–155`) bär per ADR: titel, **flerradig sammanfattning av Kontext/Beslut**, Status, Fas. Exempel `:129` (ADR-076) och `:136` (ADR-083) återger hela beslutspremisser i löptext. Endast **antalet** rader grindas (`scripts/check-adr-count.sh` mot `README.md`s `<N> arkitekturbeslut`-token) — inga titlar, ingen status, ingen fas, ingen sammanfattning. Det är den enskilt största kopia-ytan i governing-mängden mätt i tecken per grindad invariant.

### B10 — ADR-100 kopierar hubbens `SYSTEMET.md` §0, och spoke-CLAUDE.md kopierar ADR-100

Samma kunskap, tre ytor:

1. `/Users/marcus/Repon/marcus-system/SYSTEMET.md:112–124` — §0-termposten "sanningskälla (per domän)", löptext.
2. `.../s99-resume-2/docs/decisions/ADR-100-...:48–56` — samma sex domäner, omgjorda till tabell. `:58` erkänner det öppet: *"Rad 1–6 är hubbens `SYSTEMET.md` §0-post (hub-commit `7913c16`) **ordagrant**."* (Formen är dock inte ordagrann — prosa → tabell.)
3. `.../s99-resume-2/CLAUDE.md:36` — samma sex domäner en tredje gång, komprimerade till en parentes, före pekaren till ADR-100.

Det är tre platser som kan divergera för den regel vars innehåll är "en källa, karta aldrig kopia". Rad 7 (memory-ytan) finns bara i ADR-100 — hubbens post har den inte, vilket redan gör ytorna icke-identiska.

### B11 — Stale tillståndspåståenden i governing-prosa

| Fil:rad | Påstående | Mätt |
|---|---|---|
| `.../s99-resume-2/tasks/lessons.md:19` | "**Senaste lyft:** Session 13 K-sista (2026-06-10) — L56–L87 … hub-commit `477de29`" | Filen är `updated: 2026-08-06` och bär lärdomar långt förbi L450 (`CLAUDE.md:288` citerar `L450`; `:539` citerar `L328`). Rubrikraden är ~2 mån och tiotals sessioner efter |
| `.../s99-resume-2/tasks/lessons.md:17` | "Claude läser denna fil vid varje sessionsstart" | 794 006 tecken. `session-start`-skillen (`/Users/marcus/Repon/marcus-system/plugins/marcus-system/skills/session-start/SKILL.md:91`) säger tvärtom: "`lessons.md` läses **inte i sin helhet** vid start" |
| `.../s99-resume-2/CLAUDE.md:681` | "…eller **färre än 4 skills aktiva** — flagga det" | `/Users/marcus/Repon/marcus-system/plugins/marcus-system/skills/` bär **17** skills. Tröskeln är från en tid med 4 |
| `.../s99-resume-2/docs/reference/hur-systemet-funkar.md:20` | "Version 3 · **2026-04-28**" | frontmatter `updated: 2026-06-24` — filen bär två inbördes oense datumanspråk |
| `/Users/marcus/.claude/CLAUDE.md:3` | `updated: 2026-07-11` | git: 2026-08-02 (`74d08ec`) |
| `.../s99-resume-2/README.md:5–8` | CI-/license-badges mot `github.com/**marcus803**/miranon-media-admin` | `git remote -v` → `github.com/**high-five-group**/miranon-media-admin` |

### B12 — Kopierade tal som i dag är sanna men ogrindade (kandidat-lista, ingen mätt drift)

| Fil:rad | Tal | Ägare på disk | Status |
|---|---|---|---|
| `CLAUDE.md:429` | "var ~**90**:e sekund" | `.heartbeat-svep-policy.conf:43` `HEARTBEAT_INTERVAL=90` | sant |
| `CLAUDE.md:547` | "`check_active_branches: true` sedan `TASK-93`" | `backlog/config.yml:13` | sant |
| `CLAUDE.md:559` | "`active_branch_days` (**30**)" | `backlog/config.yml:14` | sant |
| `CLAUDE.md:76–80` | de fyra DoD-kommandona | `package.json:8,14,22` + `CONTRIBUTING.md` | sant |
| `CLAUDE.md:210–211` | `seed:review`-flaggorna `--ort/--bekraftade/--obekraftade/--dagar` | `scripts/seed-review-fixture.mjs` | ej mätt i detta pass |
| `CLAUDE.md:221` | "**14 dagar** som default, `--livstid N`" | samma skript | ej mätt |
| `CLAUDE.md:413` | "`min_entries_to_merge: 1`" | GitHub-rulesetet (externt) | ej mätbart lokalt |
| `CLAUDE.md:96–103` + `:169–173` | 910,7 s · 401,0 s · 332,7 s · 172 s · 3/99 · 2,3–2,9× | `docs/research/verify-ci-parity-regel-vantetid-2026-08-05.md` | **två kopior av samma tal i samma fil**, 73 rader isär |
| `CLAUDE.md:572–577` | 0,52→6,50 s · 0,69→7,09 s · 164,60 s | mätning i `TASK-93`-underlaget | sant vid mätning |

---

## 3. STORLEKS-/PEKAR-KANDIDATER I SPOKE-CLAUDE.md

Per-sektion, mätt (tecken inkl. radbrytningar):

| Rad | Sektion | Tecken | Andel av filen | Andel av auto-load |
|---|---|---|---|---|
| 363–543 | `### Landning sker via MERGE QUEUE` | **11 660** | 28,5 % | 20,3 % |
| 89–202 | `### verify:ci-parity är ett DIAGNOSVERKTYG` | **6 976** | 17,1 % | 12,2 % |
| 291–361 | `### Worktree-isoleringens gräns` | **4 157** | 10,2 % | 7,3 % |
| 24–36 | `## Instruktioner — Alltid gäller` | 3 004 | 7,3 % | 5,2 % |
| 545–582 | `### Kortnummer` | 2 125 | 5,2 % | 3,7 % |
| 204–237 | `### Granskningsdata i staging` | 1 980 | 4,8 % | 3,5 % |
| 264–289 | `### En ny hook kan ALDRIG skarpbevisas` | 1 489 | 3,6 % | 2,6 % |
| 12–21 | `## Vad är detta projekt?` | 1 384 | 3,4 % | 2,4 % |
| 40–61 | `## Triage av det oväntade` | 1 363 | 3,3 % | 2,4 % |
| 239–262 | `### Flakighet mäts med riggen` | 1 360 | 3,3 % | 2,4 % |
| 609–624 | `## Design-system` | 1 008 | 2,5 % | 1,8 % |
| 670–683 | `## Operativ procedur` | 873 | 2,1 % | 1,5 % |
| 592–605 | `## Synk-horisont` | 765 | 1,9 % | 1,3 % |
| 71–88 | `## Bygg, testa, linta` | 773 | 1,9 % | 1,3 % |
| 628–641 | `## Arbetsflöde` | 557 | 1,4 % | 1,0 % |
| 658–666 | `## Vision: Dubbel output` | 535 | 1,3 % | 0,9 % |
| 645–654 | `## Kvalitetsribba` | 534 | 1,3 % | 0,9 % |
| 586–588 | `## Filstruktur` | 130 | 0,3 % | 0,2 % |
| 65–67 | `## Stack` | 103 | 0,3 % | 0,2 % |

**De fem operativa storsektionerna (89–202, 204–237, 239–262, 291–361, 363–543, 545–582) = 27 262 tecken = 66,6 % av spoke-CLAUDE.md och 47,6 % av hela auto-load-ytan.**

### 3a. MEDVETNA VAL — klassade som sådana, ej fynd

CLAUDE.md bär åtta explicit skrivna "varför-raden-står-här"-motiveringar. De är beslut, inte drift:

| Rad | Block | Tecken |
|---|---|---|
| 116–124 | "Varför raden ser ut så här nu" (`ADR-036`-återställningen) | 660 |
| 197–202 | "Varför raden står här och inte bara i skriptets egen header" | 421 |
| 235–237 | "Varför raden står här och inte bara i runbooken" | 242 |
| 254–257 | "Varför raden står här" (`metrics:flake`) | 306 |
| 337–348 | "Varför raden stod fel i tre veckor, och vad det lär" | 928 |
| 388–392 | "Varför historiken står kvar här" | 386 |
| 537–543 | "Varför raden står här och inte bara i CONTRIBUTING" — bär det generella skälet: *"`CONTRIBUTING.md` auto-laddas inte i en Code-session — bara denna fil gör det"* | 473 |
| 579–582 | "Varför raden står här" (`task create`-ögonblicket) | 338 |
| | **Summa medvetna motiveringar** | **3 754** (9,2 % av filen) |

Det gemensamma motivet i alla åtta: **regeln gäller i ett ögonblick där ingen slår upp en ADR.** Varje pekar-kandidat nedan måste prövas mot exakt det kriteriet.

### 3b. Kandidater där i-ögonblicket-funktionen ligger i EN rad, inte i sektionen

Rå observation av vad som är *handlingsregel* kontra *underlag för regeln*:

| Sektion | Handlingsregeln (i-ögonblicket) | Underlaget (kan bo annanstans) |
|---|---|---|
| 89–202 (6 976 ch) | `:96` "Kör det INTE före varje push" + `:108–114` de tre lägena ≈ 700 ch | `:126–128` (n=99-osäkerheten), `:130–143` (härlednings-mekaniken), `:153–195` (diff-klassning, D0-globen **B2**, känd kant), `:169–173` (mätserien, dubblett av `:96–103`) ≈ 4 700 ch |
| 363–543 (11 660 ch) | `:365–367` (armera med `--auto`), `:416–417` (armera aldrig under bygg-agent), `:494–505` (draft-eller-armera-regeln), `:467–468` (disambiguera med andra `--auto`) ≈ 1 600 ch | `:372–392` (strict-historiken), `:394–408` (strategiflaggans + exitkodens mäthistorik), `:410–414` (upphävd regel), `:419–445` (svep-mekaniken + Temporal-namngivningen), `:507–535` (dequeue/enqueue-mätningen med tidsstämplar) ≈ 8 400 ch |
| 291–361 (4 157 ch) | `:293–296` (gränsen är EN sak) + `:313–326` (matrisen) ≈ 1 300 ch | `:298–311` (verbatim avvisningstext + förstapartscitat), `:337–348` (medveten, 3a), `:350–361` (worktree-bieffekten + issue-nummer) ≈ 2 800 ch |
| 204–237 (1 980 ch) | `:210–211` (de två kommandona) + `:228–233` (aldrig purge-bar) ≈ 800 ch | `:214–219` (fällorna skriptet bär), `:221–226` (livstids-mekaniken) — båda har redan en utpekad hemvist i `docs/reference/staging-verifiering-runbook.md` § Granskningsfixtur, citerad `:218` |
| 239–262 (1 360 ch) | `:244` (kommandot) + `:259` ("Läs alltid ut n") ≈ 350 ch | `:247–252` (riggens designegenskaper) |
| 545–582 (2 125 ch) | `:561–570` (de tre praktiska stegen) ≈ 700 ch | `:553–559` (håltabellen), `:572–577` (kostnadsmätningen) |
| 609–624 (1 008 ch) | `:618–622` (de fyra reglerna) | `:613–615` (token-exemplen — **B1**, 2/7 sanna); fulltexten redan utpekad `:624` |

### 3c. Sektioner som redan ÄR pekare (mönsterexempel i huset)

- `CLAUDE.md:586–588` — Filstruktur: 130 ch, ett kommando i stället för ett träd.
- `CLAUDE.md:65–67` — Stack: 103 ch, "se `package.json` för versioner".
- `CLAUDE.md:641` — "Fasordning och fas-status: se `docs/byggplan.md` §4 (styrande)".
- `CLAUDE.md:447–453` — Push-ekonomin: pekar till `ADR-097` + `CONTRIBUTING.md` med **explicit budget-skäl** för att inte kopiera.
- `docs/reference/systemet.md` — hela filen, 18 rader / 739 tecken, ren pekare.
- `README.md:14` — "Aktuellt fas- och sub-fas-läge **ägs av** `docs/byggplan.md` §2 (kanonisk plats — status dupliceras inte hit)."
- `docs/reference/schema_reference.md:1–14` — frys-banderollen ADR-100 §4 upphöjer till standard.

---

## 4. ÖVERLAPP / MOTSÄGELSER — konkreta par

### Ö1 — Var bor fas-status? §2 eller §4?

- `.../s99-resume-2/CLAUDE.md:641`: "Fasordning och fas-status: se `docs/byggplan.md` **§4** (styrande)."
- `.../s99-resume-2/README.md:14`: "Aktuellt fas- och sub-fas-läge ägs av `docs/byggplan.md` **§2** (kanonisk plats)."
- Disk: `docs/byggplan.md:70` = `## 2. Fas-tabell` (bär Status-kolumnen); `:160` = `## 4. Per-fas-prompter` (bär prompter, inte statustabell).

Två styrande ytor pekar på olika sektioner för samma kunskapsklass; README har rätt.

### Ö2 — Vem äger fas-SEKVENSEN?

- `.../s99-resume-2/docs/byggplan.md:15`: auktoritativ källa = `tasks/byggplan-direktiv.md` §5 (**finns inte**, se B7).
- `.../s99-resume-2/docs/byggplan.md:36`: byggplan.md "ersätter … `tasks/byggplan-direktiv.md`".
- `.../s99-resume-2/CLAUDE.md:26`: "**Styrande dokument för byggandet:** `docs/byggplan.md`."

Tre påståenden, två av dem i samma fil, om vem som äger sekvensen.

### Ö3 — ADR-antalet: 100 mot 10

- `.../s99-resume-2/README.md:145`: "100 arkitekturbeslut" (CI-grindad).
- `.../s99-resume-2/docs/byggplan.md:16`: "10 ADR:er listade i §5".

### Ö4 — EF-antalet: 11 mot 28

- `.../s99-resume-2/docs/reference/airtable-interaction.md:98`: "Elva funktioner".
- Disk: 28. Se B4.

### Ö5 — Operations-registret: 3 mot 13

- `.../s99-resume-2/docs/reference/airtable-interaction.md:273`: "3 operationer".
- `.../s99-resume-2/docs/reference/airtable-interaction.md:258–262`: tabell med 3 rader.
- `.../s99-resume-2/docs/specs/SECURITY-SPEC.md:493`: pekar korrekt — "Operations-registret (`supabase/functions/_shared/field-allowlists.ts`) är **den enda sanningskällan**" utan att räkna upp innehållet.
- Disk: 13.

SECURITY-SPEC:493 är ADR-100-formen; `airtable-interaction`:258–273 är kopian av samma sak.

### Ö6 — Två glossarier i governing-mängden

- `.../s99-resume-2/ORDLISTA.md:11`: "Ordlistan **äger BEGREPPEN**"; `:14–15`: "Endast projektspecifika domänbegrepp får post — **allmänna programmeringsbegrepp exkluderas**".
- `.../s99-resume-2/docs/reference/hur-systemet-funkar.md:36–48`: en egen `## Ordlista`-tabell (Airtable, Tabell, Rad/post, Fält, Länk, Automation, Rollup/formula, Edge Function, Admin, Backfill).
- `.../s99-resume-2/docs/specs/BYGGPLAN-LÄTTLÄST-v3.md:577`: en tredje termdefinition ("**DoD** (Definition of Done) | Checklistan som säger när en fas är klar").
- `/Users/marcus/Repon/marcus-system/SYSTEMET.md §0`: en fjärde termyta (systemtermer).

Snittet är deklarerat i ORDLISTA:11–15 (produktdomän vs mekanik vs systemtermer) — men ingen av de tre andra ytorna refererar det snittet tillbaka, och `hur-systemet-funkar.md`s tabell innehåller exakt den kategori ORDLISTA säger att den exkluderar.

### Ö7 — Kvalitetsribban: pekare till en sektion som är tom

- `.../s99-resume-2/CLAUDE.md:647–654`: tabellen (Bibliotek 11/11/11, Vyer 11/10/10) + "Fullständiga checklistor: `KVALITETSDEFINITIONER-11-REACT.md`".
- `.../s99-resume-2/CLAUDE.md:33` — samma ribba en andra gång i samma fil.
- `.../s99-resume-2/docs/specs/KVALITETSDEFINITIONER-11-REACT.md:22–27`: "**§3–§5 deferrade**"; `:29`: "Tills dess: använd **Vue-arkivet** + `ACCESSIBILITY-CHECKLIST.md` + `ARIA-UPGRADE.md` + `DESIGN-SYSTEM-SPEC.md` som triangulerande referenser."

Pekaren går till en fil som själv säger att den delegerar till fyra andra, varav en är arkiv. Kopian i CLAUDE.md är alltså mer komplett än målet den pekar på.

### Ö8 — Hub/spoke: fem dubblerade instruktionsrader (båda ytorna auto-laddas)

| Hub | Spoke | Relation |
|---|---|---|
| `/Users/marcus/.claude/CLAUDE.md:145` "Bevisa att det fungerar. \"Det funkar\" ≠ \"det är rätt\"." | `.../s99-resume-2/CLAUDE.md:33` "Bevisa att det fungerar — \"det funkar\" ≠ \"det är rätt\"." | i praktiken verbatim |
| `:148` "Uppdatera tasks/lessons.md efter varje korrigering. Märk universella med [UNIVERSAL]." | `:34` "Fånga lärdomar i `tasks/lessons.md` efter varje korrigering. Markera universella med `[UNIVERSAL]`." | omskriven dubblett |
| `:69` "minimalt test (**2 noder, 1 linje**)" | `:32` "minimalt test (**1 komponent, 1 hook**)" | samma regel, olika exempel — inte fel, men två formuleringar av en regel |
| `:68` "Researcha etablerade bibliotek INNAN du designar" | `:27` "Research före implementation: kolla React Aria, TanStack, Radix, FK…" | spoke specialiserar hubben |
| `:49` "self-review **~9 %**, transparens-rapport ~64 %, Marcus-pushback ~27 %" | `:44` "den empiriskt svagaste mekanismen (**~9%**)" | kopierat tal över repo-gräns |

Hubbens `:198–200` gör tvärtom rätt: *"Fångst-raterna **står i** `## Roll-arkitektur`"* — pekare inom samma fil. Spoke:44 kopierar i stället talet.

### Ö9 — `data-model.md` som "AUKTORITATIV" med en icke-auktoritativ egen källa

- `.../s99-resume-2/docs/reference/data-model.md:30`: "Detta dokument är **AUKTORITATIV** för datamodellen." (ADR-100:12 citerar just den raden som utgångsproblem, och §2:s undantag legitimerar den.)
- `.../s99-resume-2/docs/reference/data-model.md:91`: "18 tabeller. 358 fält totalt 2026-04-28. **Källa: `02-live-state.md` §1–§2**."
- `.../s99-resume-2/docs/reference/data-model.md:363`: "Källa för Schema cheat sheet: `02-live-state.md` … `01-extraction.md`".
- `.../s99-resume-2/docs/reference/data-model.md:384`: "**Live är auktoritativ.**"

Fyra rader i samma fil placerar auktoriteten på fyra olika ställen: dokumentet självt, två research-filer, och live-basen. ADR-100 §2:s undantag utpekar `data-model.md` som **den enda bäraren** — dess egna källhänvisningar bildar en kedja utanför den utpekningen.

### Ö10 — `segment-arkitektur.md` deklarerar sin egen underordning

`.../s99-resume-2/docs/reference/segment-arkitektur.md:9`: "sak-besluten lever i ADR-062/063/064 + data-model §Kända fällor; detta dok binder dem, fryser dem inte. **Vid konflikt gäller ADR:erna.**"

Formmässigt ADR-100-konformt (karta som deklarerar sig som karta) — men filen ligger i governing-listan på samma nivå som `data-model.md`, som deklarerar sig som källa. Governing-listan skiljer inte kartor från källor.

### Ö11 — Frys-standardens exemplar är själv ogrindad

ADR-100:112–124 (§4) upphöjer `docs/reference/schema_reference.md`s öppningsstycke till standard. Filen saknar frontmatter helt och står inte i `FRONTMATTER_GOVERNING_DOCS`. Standarden bor alltså i en fil som inte omfattas av frontmatter-grinden, medan de fjorton som omfattas inte bär standarden.

---

## 5. MÄTVÄRDEN

### 5a. Auto-laddat per session

| Yta | Rader | Tecken | ≈ tokens (4 ch/tok) |
|---|---|---|---|
| `/Users/marcus/.claude/CLAUDE.md` (hub, symlink → `marcus-system/CLAUDE.md`) | 202 | 16 398 | ≈ 4 100 |
| `.../s99-resume-2/CLAUDE.md` (spoke) | 683 | 40 909 | ≈ 10 230 |
| **Totalt auto-laddat** | **885** | **57 307** | **≈ 14 330** |

Spoke = 71,4 % av auto-load-ytan. Hub = 28,6 %.

Inom hubben: `## Instruktioner — Alltid gäller` (rad 59–150) = **9 987 tecken = 60,9 %** av hela hub-filen.
Inom spoken: de fem operativa storsektionerna (rad 89–582) = **27 262 tecken = 66,6 %** av filen.
De två tillsammans = **37 249 tecken = 65,0 % av all auto-laddad kontext**.

### 5b. Övriga styrande dokument (ej auto-laddade)

| Fil | Rader | Tecken | Andel av 14-mängden |
|---|---|---|---|
| `.../tasks/lessons.md` | 10 100 | 794 006 | 61,2 % |
| `.../docs/reference/data-model.md` | 1 348 | 122 788 | 9,5 % |
| `.../docs/byggplan.md` | 1 125 | 75 116 | 5,8 % |
| `.../docs/decisions/README.md` | 160 | 71 851 | 5,5 % |
| `.../docs/specs/BYGGPLAN-LÄTTLÄST-v3.md` | 613 | 50 530 | 3,9 % |
| `.../docs/reference/airtable-constraints.md` | 577 | 43 984 | 3,4 % |
| `.../CLAUDE.md` | 683 | 40 909 | 3,2 % |
| `.../docs/specs/SECURITY-SPEC.md` | 911 | 32 845 | 2,5 % |
| `.../docs/reference/airtable-interaction.md` | 342 | 23 471 | 1,8 % |
| `.../ORDLISTA.md` | 270 | 15 034 | 1,2 % |
| `.../docs/reference/hur-systemet-funkar.md` | 295 | 12 305 | 0,9 % |
| `.../docs/reference/segment-arkitektur.md` | 102 | 7 872 | 0,6 % |
| `.../docs/specs/KVALITETSDEFINITIONER-11-REACT.md` | 102 | 6 330 | 0,5 % |
| `.../docs/reference/systemet.md` | 18 | 739 | 0,06 % |
| **Summa 14 governing docs** | **16 646** | **1 297 780** | 100 % |

Median: 27 190 tecken. Spridning: 739 → 794 006 (faktor **1 074×**).
Tre filer (`lessons.md`, `data-model.md`, `byggplan.md`) = **76,4 %** av hela governing-massan.

### 5c. Styrande-i-praktiken, utanför frontmatter-grinden

| Fil | Tecken |
|---|---|
| `.../CONTRIBUTING.md` | 71 249 |
| `.../README.md` | 10 843 |
| `.../.claude/agents/bygg-agent.md` | 13 423 |
| `.../.claude/agents/research-pass.md` | 7 829 |
| `.../docs/specs/DESIGN-SYSTEM-SPEC.md` | ~1 600 rader (ingen frontmatter) |
| `.../docs/reference/schema_reference.md` | ingen frontmatter |

### 5d. Grind-täckning över governing-ytan

| Invariant | Grind | Yta |
|---|---|---|
| frontmatter-fält + `updated` == git-datum | `scripts/check-frontmatter.sh` | de 14 (ej hub, ej 5c) |
| ADR-fil-antal == README-tal | `scripts/check-adr-count.sh` | **1 tal** i `README.md:145` |
| åberopad `permissions.*`-nyckel existerar | `scripts/check-permissions-claims.sh` | ändlig `CLAIM_MARKERS`-lista |
| erratum-radens existens | `scripts/check-fetch-depth-invariant.sh` | ADR-029/030 |
| listparitet (7 par) | `scripts/check-listparitet.sh` | CONTRIBUTING↔purge-policy, lychee-scope, `docs-grindar`, `klassning-d0`↔D1↔acceptance, sentinel-markörer |
| lesson-numrering | `scripts/check-lesson-numbers.sh` | `tasks/lessons.md` |
| trådindex | `scripts/check-thread-index.sh` | `tasks/threads/` |

Ingen grind rör: EF-antal (B4), operationsantal (B5), rad-referenser (B6), token-namn (B1), tabell-/automation-tal (B8), ADR-titel/status/fas i indexet (B9), grind-talet i CLAUDE.md (B3), D0-globens CLAUDE.md-kopia (B2, trots att `ci.yml`-sidan ÄR parad), byggplan-pekaren (B7), remote-orgen i README (B11).

---

## 6. RÅ SAMMANSTÄLLNING

**Mätt drift (påstående ≠ disk), 8 instanser:** B1 (5 tokennamn), B2 (11 globposter), B4 (11→28), B5 (3→13), B6 (4 radref), B7 (död sökväg + 10→100), B11 (6 poster).
**Kopior utan mätt drift, ogrindade, 9+ instanser:** B3, B8, B10, B12.
**Motsägelse-par mellan styrande ytor, 11 instanser:** Ö1–Ö11.
**Medvetna val, klassade som sådana:** 8 block / 3 754 tecken i `CLAUDE.md` (3a).
**Auto-load-kostnad:** 57 307 tecken (≈ 14 330 tokens) per session, varav 65 % ligger i två sektioner.
