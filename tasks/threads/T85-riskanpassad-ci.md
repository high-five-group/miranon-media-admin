---
owner: marcus803
updated: 2026-07-28
review_by: 2026-10-28
status: stable
lifecycle: active
---

# T85 — Riskanpassad CI / processhastighet

> Tråd-kort (ADR-053). Född S77 2026-07-23 ur processgransknings-spåret.
> Commit-tagg: `[T85]`.

## Ursprung

Marcus beställde en extern processgranskning (Codex, 2026-07-23) med
frågan: har vi lyckats bygga en stabil, strukturerad, säker och
branschledarmässig process — och kan den bli snabbare utan
kvalitetskompromiss? Analysen landade i
[docs/research/arbetsflode-processgranskning-2026-07-23.md](../../docs/research/arbetsflode-processgranskning-2026-07-23.md);
Code verifierade samma dag varje centralt påstående mot repo + GitHub-API
(svars-sektionen i samma dok) och designade åtgärderna i tre vågor
([design-doket](../../docs/research/riskanpassad-ci-design-2026-07-23.md)).
Marcus delegerade designen ("det bör du göra") och låste besluten A+A
(bokföring via auto-merge-PR; rött-först-bärarbyte).

## Kärninsikten

Största luckorna var inte missar utan MEDVETNA deferraler som aldrig
återupptogs (ADR-029 utelämning #5: branch protection, med aggregatorn
färdigbyggd som required check sedan 2026-05-13). Trögheten Marcus känner
är inte dokumentationen eller grindvakterna (33 s) — den är ETT jobb
(~10 min) genom EN global staging-mutex, plus avsiktligt röda bevis-runs
i samma kö.

## Status per våg

| Våg | Innehåll | Status |
|---|---|---|
| 1 | Merge-grinden ([ADR-076](../../docs/decisions/ADR-076-merge-grinden-ruleset-pr-flode.md)) + actionlint-pinning + jobb-splitten (PR #99) | ✅ EXEKVERAD S77 (grind-bevis i S77-sessionsdok) |
| 2a | D1-klassen + merge-dedup + nightly/larm + mätskript + gate-proof | ✅ KOMPLETT: **36.1 gate-proof** (S78) + **ci.yml-trion 36.2/36.3/36.4** (S79, ADR-077) + **36.5 mätskriptet** (S80: `scripts/ci-metrics.mjs` + nightly-metrics i larm-needs; utgångsvärde citerat på kortet; se BUILD-LOG S80) |
| 2b | Visual regression från noll (CI-födda baselines) | ✅ BYGGD S81: **36.7** Done — hermetisk fixturvärld (`tests/visual/support/`) + 6 vyer × 2 vyportar (2x, Marcus-beslut) + `visual-baselines.yml` ände-till-ände (baseline-PR nr 140 Marcus-välsignad); GRIND-jobbet (AC 7–8) medvetet PARKERAT → [`T87`](T87-visual-grind-aktivering.md) (Marcus-beslut A: tidig UI-fas, aktiv grind mot batch-hastigheten); L327+L328 skördade |
| 2c | Rött-först-bärarbytet (ADR-071-amendering) | ✅ VERKSTÄLLD S80: **36.6** Done — ADR-071 S80-amenderingen (lokalt körutdrag som bärare, rött+grönt ihop, grind-bevis via gate-proof) + CONTRIBUTING § Rött-först |
| 3 | Staging-per-run-isolering (mutexen avvecklas) | ⚠️ **RIKTNINGEN DELVIS FALSIFIERAD 2026-07-28 — läs § Våg 3 nedan FÖRE planering.** Tidigare: riktning satt; samdesign med ADR-063 post-Fas-6; tangerar T27/T45 |

## Bevis-skulden (S77 end-pass-incidenten) — BETALD S78

S77:s incident lämnade en öppen bevis-skuld: aggregatorns FAIL-gren gjordes
fail-closed men bevisades aldrig skarpt (L322 — konfig-verifierad, ej
gate-bevisad). task-36.1 (gate-proof-workflowen) betalar den:
`.github/workflows/gate-proof.yml` är en riktad `workflow_dispatch` som är
sitt eget test.

- **Positivt bevis** (default) run **30032296699** = GRÖN: paraply-repliken
  kör `always()` + den verbatim fail-closed jq-grenen ur `ci-passed` blir
  `failure` på ett framkallat rött jobb.
- **Negativ self-test** (`simulate_skip=true`) run **30032299223** = RÖD:
  paraply-repliken tvingas skippa → assert-jobbet fångar det → röd körning.
  Detta är exakt L322-hålet demonstrerat: en skippad paraply-check räknas
  INTE tyst som grön.

Landad via PR #107 (`b412bb8`), CI-run 30031630066 grön per jobb.

**Durabel bärare (L321) — HANTERAD S79:** gate-proof:s jq-fail-closed-gren är en
VERBATIM REPLIK av `ci-passed`:s → drift-risk vid framtida ändring av den
riktiga aggregatorn. I S79:s reusable-refaktor (36.2) ändrades `ci-passed`:s
`needs`-lista men jq-logiken förblev BYTE-IDENTISK → repliken fortsatt giltig;
gate-proof re-kört (run **30038462683** grön) bekräftade fail-closed genom
refaktorn. `ci.yml`-kommentaren (~rad 666) uppdaterad "öppen bevis-skuld"→betald
(36.2). Bäraren kvarstår för FRAMTIDA jq-ändringar (då MÅSTE repliken speglas).

## Eftergranskningen (Codex 2026-07-24) → korrigeringspaketet

Marcus beställde omgranskning efter våg 1–2:s utlösning. Dom: **6,5 →
8/10** — åtgärdspaketet bekräftat verkligt ("inte
dokumentationsteater"; main-skyddet "starkt löst", D1 "precis hur en
säker fast track bör utformas", dedupen "ovanligt välgjord",
incidenthanteringen "ett moget arbetssätt"). Rapport + Codes
verifikation:
[eftergranskningen](../../docs/research/arbetsflode-processgranskning-eftergranskning-2026-07-24.md)
(§ Verifikation och beslutsläge — beslutsdrivande fynd verifierade;
sanningsfixen i CONTRIBUTING § Visuell regression + T86-pilotens
protokoll v2 åtgärdades direkt i S82-konversationen, PR #145).

**SEKVENS LÅST (Marcus 2026-07-24):** paketet tas som NÄSTA
processfönster — egen fokuserad session EFTER nattbygget, BINDANDE
FÖRE review-pilotens beslut (T86, 10–15 loggrader) och före all vidare
CI-utbyggnad. Nattbygget blockeras inte: produktarbete = den "normala
drift" eftergranskningens punkt 9 efterfrågar, pilotens datainsamling
använder inte ci-metrics-siffrorna, och visual-grinden SKA vara
parkerad under avsiktliga UI-ändringar (T87-beslutet). Sessionen
BÖRJAR med att verifiera Codex tre mätpåståenden mot
`scripts/ci-metrics.mjs` (hypotes-regeln gäller även extern granskare).
Nightly-visual-punkten: Code TVEKSAM — förväntat-röda nätter under
UI-fas är kyrkogårds-klassen (L321); Codex missade UI-fas-dynamiken →
grillas i sessionen, tas inte rakt av.

**Korrigeringspaketet (KVAR — tas som eget T85-pass/kort):**

1. ~~**Mätardefinitionerna**~~ ✅ **ÅTGÄRDAD S88** (2026-07-25). Alla tre
   påståenden verifierades mot koden och höll; det tredje bevisades dessutom
   empiriskt mot repots egen historik (`startup_failure` finns: run
   **30038460735** + **30037333924** — måttet hade räknat S79:s egen
   permissions-incident som "inte röd"). Åtgärdat: `RED_CONCLUSIONS` utvidgad
   till `failure`/`startup_failure`/`timed_out`/`action_required`/`stale`
   (`cancelled` hålls fortsatt isär per L319) · röd körning utan failat jobb
   redovisas explicit i stället för att se ut som mätfel · flake kräver nu
   **bevisat röd föregående attempt** (hämtas via `runs/{id}/attempts/{n}`);
   okänd orsak klassas OVERIFIERAD och räknas aldrig som flake · nämnaren är
   slutförda körningar i stället för en blandad population · rapportradernas
   formuleringar rättade — måttet skapad→staging-start utges inte längre för
   isolerad mutex-väntan. Rött-först: 8 röda → alla gröna. Ny mätning efter
   fixen: PR-ledtid median 1,2 / p95 15,7 min (n=22) · 3 röda (samtliga
   `failure`) · instabilitet 0,0 % bevisad, 0 overifierade · dedup 100 %
   (21/0).
2. ~~**Nattlarms-observatören**~~ ✅ **ÅTGÄRDAD S88** —
   `.github/workflows/nightly-watchdog.yml`.
   **Hålet empiriskt bevisat, ej resonerat:** run 30038460735 hade
   `total_count: 0` jobb ⇒ larm-jobbet instansierades aldrig; repots enda
   `ci-natt`-ärende någonsin (#114) kom från en SIMULERAD dispatch, den
   verkliga incidenten lämnade noll spår.
   **`workflow_run`-vägen förkastad:** octokit-payloadschemat saknar
   `startup_failure` i sitt enum — att webhooken fyrar på det får inte antas.
   Vald form är schemalagd vakt som läser API:t (`?status=startup_failure`
   verifierat fungerande).
   **Arkitektur C, research-grundad** (Marcus delegerade beslutet efter
   web-research-disciplinen): vakten ERSÄTTER INTE larm-jobbet. Google SRE:s
   larmregel-checklista (*"detect an otherwise undetected condition"*)
   godkänner den för uteblivet/`startup_failure` och underkänner den för
   resten, där larm-jobbet har rikare data (commit-spann, flake-signal).
   Precedent: Prometheus Watchdog (bevakar kanalen, ligger bredvid),
   `armbian/os` watchdog.yml. Researchen fann **inget** mönster där en extern
   vakt ersatte det interna larmet — alternativ A saknade precedent.
   **Tre villkor inbyggda:** grace 26 h mot UPPMÄTT drift (~3 h), aldrig mot
   nominell cron — annars falsklarmsmaskin · dedup mot öppna `ci-natt`-ärenden
   (motsvarar Alertmanagers inhibition; besvarar SRE-checklistans fråga 5) ·
   **bevis-läge** `simulate_missing` — *"an untested dead man's switch is worse
   than none at all"*.
   **Öppet bokförd begränsning — rekursionen:** vakten är själv en
   Actions-cron och ärver defekten den täcker. Fångar det vanliga fallet, inte
   det sällsynta att hela schemaläggningen ligger nere. Extern klocka är eget
   beslut; medveten deferral med bärare.
   Grenlogiken testad lokalt över 11 fall före landning; skarpt bevis via
   dispatch efter merge.
3. ~~**Vale-SHA256**~~ ✅ **ÅTGÄRDAD S88.** Steget hade actionlint-formens
   `curl -sL` + `tar` men saknade dess `sha256sum -c` — alltså halva mönstret.
   Checksumman `ff2b49ff…96db3` verifierad TRE oberoende vägar 2026-07-25
   (egen nedladdning + `shasum -a 256` · Vale-projektets
   `vale_3.14.1_checksums.txt` · Releases-API:ts digest) — identiska.
   **Bifynd:** `errata-ai/vale` är omdöpt till `vale-cli/vale`; URL:en lever
   på GitHub-redirect. Org-namnsbytet görs vid nästa versions-bump, inte nu
   (URL och checksumma hör ihop).
4. ~~**Required-check app-bindningen**~~ ✅ **ÅTGÄRDAD S88.**
   `integration_id: 15368` (GitHub Actions) tillagd på required check i
   ruleset `main-skydd` (id 19627609). App-id verifierat två oberoende vägar
   ur repots egen data — inte hämtat ur minnet. **Hotet var konkret:** repot
   har en andra app med `checks:write` installerad, och
   `POST /repos/.../statuses/{sha}` lät vilken write-token som helst sätta
   kontexten `CI Passed or Skipped`. Ytan var oanvänd (`total_count: 0`), så
   bindningen bröt ingen legitim trafik.
   **Två fällor hanterade:** det finns ingen `PATCH` för rulesets — `PUT` är
   full objekt-ersättning, så payloaden härleddes ur live-GET med en
   diff-grind (exakt +1 semantiskt fält) och en sparad baseline som
   återställning. Och **ADR-076:s kanoniska JSON hade driftat** (saknade tre
   API-satta fält) — en `PUT` av det blocket hade tyst nollat dem; ADR:n
   uppdaterad till live-formen i samma landning.
5. ~~**Cron-timezone**~~ ✅ **ÅTGÄRDAD S88** — och Codes egen misstanke FÖLL.
   Code antog att GitHub Actions inte stöder något timezone-fält alls. Falskt:
   `schedule`-timezone är GA sedan **2026-03-19**, verifierat mot GitHubs egen
   dokumentationskälla (`github/docs`) — *"You can optionally specify a timezone
   using an IANA timezone string"* — inte bara mot agentens sammanfattning. Grind-risken prövad
   TVÅSIDIGT mot vår PINNADE actionlint 1.7.12: giltig zon → exit 0, typo
   `Europe/Stokholm` → `invalid timezone … must be a valid IANA timezone name`.
   Stödet kom i just 1.7.12; ingen `-ignore` behövs. Nu `cron: '0 3 * * *'` +
   `timezone: 'Europe/Stockholm'` — **03:00 valt medvetet** eftersom docs anger
   att en tid i DST-luckan skjuts fram (02:30 → 03:00) vid vår-omställningen.
   Gör CONTRIBUTING:162, ADR-077:90 och task-36.2 AC1 (som alla redan lovar
   "~03:00 svensk tid") bokstavligt sanna året om — inga följdredigeringar
   behövdes.
   **UPPMÄTT DRIFT som INTE löses av detta:** de två faktiska schedule-runsen
   startade 03:56 och 04:00 UTC mot cron 01:00 UTC (~3 h). Timezone styr när
   körningen schemaläggs, inte när den startar. Bärande för punkt 2: en vakt
   måste ha marginal mot uppmätt drift, inte mot nominell cron.

**Beslutsklass — SAMTLIGA FYRA AVGJORDA av Marcus 2026-07-25 (S88):**

1. **36.7-kortformalian → A: låt stå.** Kortet förblir Done med AC 7–8
   öppna; T87 är bäraren. Att skapa ett eget kort för en parkering vars
   trigger är "när UI-takten lugnar" (inte ett beroende) hade gett ett kort
   ingen kan plocka — trådar är repots form för just det.
2. **36.8-ordningen → C, UTFÖRD AV CODE på Marcus delegation**
   (*"utför C åt mig som om du vore mig"*). QA-vandringen kördes i sin
   helhet; punkt 11 lokalt eftersom grinden är parkerad. **Tio av tolv
   punkter gröna; två öppet oavklarade med skäl** (punkt 5 kräver att
   merge-grinden försvagas — priset togs inte; punkt 12 kräver en veckas
   kalendertid). **TRE FYND blev egna kort: TASK-49 · TASK-50 · TASK-51.**
   Fullt utfall per punkt i kortets notes.
3. **Nightly-visual → A: vänta.** Visual aktiveras i ett steg via T87, inte
   splittrat. Codes tveksamhet stod fast: förväntat-röda nätter under UI-fas
   är kyrkogårds-klassen (L321), samma skäl som fällde rådgivande läge.
   **QA-fyndet TASK-49 stärker beslutet i efterhand** — grinden hade ändå
   varit blind på desktop, så en tidig aktivering hade gett falsk trygghet.
4. **Merge-only → A: verkställd.** `allowed_merge_methods` låst till
   `["merge"]` i ruleset 19627609; ADR-076 punkt 6 bär motiveringen.
   Dedupen läser `HEAD^2` — squash/rebase ger ingen sådan förälder, och
   tidsvinsten hade försvunnit TYST. Låset kostar noll: merge var redan
   husets enda metod.

## Våg 3 — riktningen delvis falsifierad (2026-07-28)

**Läs detta före varje planering av våg 3.** Två dokument i repot beskriver
våg 3 med samma namn men olika mekanism och olika tidpunkt, och ett tredje
har sedan dess avgjort sakfrågan mot båda.

**Divergensen.**
[Design-doket](../../docs/research/riskanpassad-ci-design-2026-07-23.md) § Våg 3
(2026-07-23) beskriver **run-ID-scoping i Airtable**, samdesignad med
bas-maximeringen: *"varje run skapar/filtrerar/purgar sina egna poster …
därefter avvecklas mutexen helt"*.
[`airtable-constraints.md`](../../docs/reference/airtable-constraints.md) § P26
Fas E-krav (2026-07-27) beskriver i stället **per-körning-instansierad
Postgres**: *"När det är på plats avvecklas den globala mutexen (T85 våg 3)"*.
Det första är en Airtable-lösning vid bas-maximeringen; det andra en
Fas E-lösning. Samma etikett, olika planer.

**Vad som avgör frågan — och det är ingendera.** `P4`:s andra manifestation
(S91 2026-07-27): Airtables **5 req/s-tak är DELAT per bas**, alltså för alla
samtidiga klienter tillsammans. Parallellisering är därför verkningslös
*"även med perfekt dataområdes-isolering — en oberoende grind utöver P26"*.

Följden är konkret: **run-ID-scoping löser kollisionerna men köper ingen
genomströmning.** Två parallella körningar slutar trampa på varandras data men
delar fortfarande samma anropsbudget och stryper varandra i stället. Att
avveckla mutexen på enbart scoping vore att byta en synlig serialisering mot
en osynlig — sämre, eftersom den osynliga inte syns i CI-tiden förrän någon
mäter.

**Vad som därmed gäller.** Mutexen kan meningsfullt avvecklas först när
datakällan inte längre är Airtable (P26 Fas E-krav, med P26:s egen
ordningsnot: branching ensamt räcker inte så länge Airtable är data of record).
Run-scoping kan fortfarande vara värt att föra in som bas-designkrav — men
för determinism och för att avveckla fasta delade poster
(`TEST_REGISTRATION_RECORD_ID`, tangerar `T45`), **inte** som väg till
parallellitet. Design-dokets formulering *"därefter avvecklas mutexen helt"*
ska inte läsas som att scoping ensamt räcker.

**Ursprung.** Marcus fråga 2026-07-28 (*"vad har basmaximeringen med
klonbarheten att göra … klonbarheten sker ju i Supabase, eller vadå?"*) mot en
sammanblandning Code gjort i ett svar. Frågan var berättigad — och läsningen
den utlöste visade att sammanblandningen fanns i repots egna dokument, inte
bara i svaret. Ingen kod ändrad; riktningen skrivs om här så att planeringen
inte utgår från ett falsifierat antagande.

## Upptags-form

Våg 2a/2b/2c tas som egna pass (PRD-kort/skivor eller session-scope) med
design-doket som styrande underlag; ADR mintas vid implementation. Våg 3
väntar på bas-maximeringens designfönster (run-scoping är ett
bas-designkrav).
