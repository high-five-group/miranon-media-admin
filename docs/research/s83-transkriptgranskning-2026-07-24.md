# Granskningsdok — Session 83 (3775e1a2): processanalys av transkript

**Status:** extern granskning · underlag för processförbättring
**Författare:** Claude (chat-ytan), på Marcus order, ur transkriptexport
**Datum:** 2026-07-24
**Mottagare:** Claude Code (för verifiering, åtgärdsförslag och ev. skill-/dok-ändringar via ordinarie kadens)

> **Proveniens + upptag:** extern granskning beställd av Marcus hos Claude
> (chat-ytan) 2026-07-24, levererad via `~/Downloads/` och importerad hit av
> Code samma dag (samma mönster som Codex-granskningarna i denna katalog).
> Granskningens § 1–§ 5 återges verbatim sånär som på två
> lint-normaliseringar (emfas-slutraden → brödtext; "m.m." → "med mera");
> bedömningarna är granskarens egna.
> Upptagen som tråd [T89](../../tasks/threads/T89-s83-granskningspaketet.md).
> Codes § 6-verifikation mot JSONL + disk: se § Verifikation och beslutsläge
> sist i dokumentet — vid avvikelse gäller verifikationen (disk vinner).

---

## 0. Metod och avgränsning

**Källa:** `claude-code-log v1.5.0`-export av `~/.claude/projects/…/3775e1a2-f629-44ae-8d00-d96a6649b3ff.jsonl` med `--detail high --format md --compact`, genererad ca 15:26 lokal tid.

**Avgränsning — viktig:** exporten täcker sessionens **första ~19,5 minuter** (14:41:58–15:01:19 lokal tid): en (1) mänsklig user-tur följd av ett autonomt pass fram till steg 2-överlämningen. Sessionssidans "4 users" = 1 mänsklig tur + 3 async-notiser (bakgrundsjobb rapporterar som user-roll). Allt efter 15:01 (facit-låsningen i browsern med mera) ligger **utanför** denna granskning. Kör om exporten efter sessionslandning för helheten.

**Token-metodik:** exporten saknar per-meddelande-usage. Tabellerna i § 3 bygger på **transkriptvolym som proxy** (~4 tecken/token för text). Tre kända skevheter är korrigerade eller noterade:

1. **Bilder separerade.** De 4 skärmdumps-läsningarna utgör 1 083 KB base64 i exporten (76 % av filen) men kostar som vision-input i storleksordningen enstaka tusental tokens styck — de redovisas separat, inte i texttabellerna.
2. **Subagenten:** md-blocket är 68 KB, men endast slutrapporten (~17 KB ≈ 4,3k tok) landade i orkestratorns kontext. Differensen är subagentens interna arbete i egen kontext.
3. **Thinking osynligt.** Passet kördes på fable 5 xhigh med 64 tankeblock, men exporten innehåller tomma thinking-summaries (3,4 KB totalt). Den verkliga resonemangs­kostnaden (tokens och väggklocka) syns inte här. Se § 6 för exakt mätning ur JSONL.

---

## 1. Sammanfattande dom

Passet var **väl exekverat men inte maximalt snabbt**. Från order till byggd, typecheckad, lintad, renderings- och interaktionsverifierad steg 2-prototyp på 19,5 min med 77 anrop på huvudspåret — utan omtag, utan dubbelläsningar (utöver en tvingad, se F1), med korrekt parallellisering (PR-vakt async, research-subagent parallellt med bygget, landade lagom till steg 2).

Av 19,5 min bedöms **~5–7 min adresserbara**: ~3 min miljöfelsökning i verifieringsfasen (F2), ~1 min överflödig grindrunda (F3), och upp till ~3 min ceremoni om en lätt-variant införs för rutinpass (F5 — beslutsfråga). Bygg- och verifieringskärnan (~10 min) ligger nära golvet för leveransens innehåll; återstående hävstänger är xhigh-frågan (F6 — mätbar, ej mätt) och cp-baslinjen (F4).

---

## 2. Strukturerad sessionsuppdelning

### 2.1 Fasöversikt

| Fas | Tid (lokal) | Längd | Anrop | Innehåll | Utfall |
|---|---|---|---|---|---|
| A. Uppstart/orientering | 14:42:03–14:44:15 | 2m 12s | 13 | session-start-skillen; git pull; todo/T86/S82-dok/lessons/ADR/backlog-kort 17.7+18.15–18.19; substrat- och routekontroll | Orienterad; scope kvitterat mot T86 § Körplanen |
| B1. Dok-födelse | 14:44:46–14:46:45 | 2m 0s | 9 | create-session-doc-proceduren (13 steg); S81-doket som mall; numrering disk-verifierad; write; markdownlint; branch+commit+push | S83-doket fött; PR #149 öppnad |
| B2. PR-svans (async) | 14:46:45–14:48:15 | (parallell) | 5 | PR-vakt i bakgrunden → grön → merge-verifiering → tillbaka till main | PR mergad utan att blockera huvudspåret |
| C. Bygge steg 1 | 14:46:46–14:51:46 | 5m 0s | 16 | prototype-skillen + UI.md + ADR-074; läsning av EventsList/EventCard/PrototypeSwitcher/domänmodell; research-subagent avfyrad (14:49:04); Write EventsListPrototyp.tsx (1 anrop); route-edit; typecheck+lint | Exakt-kopia-baslinjen skriven, grindar gröna |
| D. Verifiering steg 1 | 14:51:53–14:54:43 | 2m 50s | 20 | dev-server-start (dog — port upptagen); verify-skript ×3 iterationer; Playwright/auth/credential-grävning; login + rendering; pixeljämförelse skarp vs proto | Baslinjen verifierad exakt — men ~10 anrop var miljöfelsökning (F2) |
| E. Research-intag | 14:55:20–14:56:51 | 1m 30s | 3 | Subagentrapporten landar; rekommendation (disclosure-filterbar, live-apply, print-form) tas in | Steg 2-design låst mot research |
| F. Steg 2: filter-iteration | 14:56:51–15:01:19 | 4m 28s | 16 | chip-/token-/ikon-inventering; 3 edits i prototypen + route; grindloop ×4 varav 1 ren autofix-runda (F3); interaktionsverifiering; skärmdumpar | Steg 2 byggd, verifierad, överlämnad |

### 2.2 Anropsprofil (huvudspåret)

| Typ | Antal |
|---|---|
| Bash | 41 |
| Read | 16 (varav 4 bilder) |
| Edit | 7 |
| Write | 6 |
| Skill-laddningar | 3 (session-start, prototype, research) |
| Subagent (Task) | 1 |
| Async-notiser | 3 |
| **Summa** | **77** |

Komplett sekvens med tidsstämplar i Bilaga A.

---

## 3. Tokenfördelning (proxy — se § 0 för metodik, § 6 för exakt mätning)

### 3.1 Textvolym in i orkestratorns kontext, per innehållstyp

Total textvolym exkl. bilder: **302 KB ≈ 77k tokens**. Subagent-raden justerad till det som faktiskt landade i orkestratorn.

| Innehållstyp | Antal | Volym | ≈ tokens | Andel av text |
|---|---|---|---|---|
| Bash-utdata | 41 | 85,2 KB | ~21,8k | 28 % |
| Read (textfiler) | 12 | 78,2 KB | ~20,0k | 26 % |
| Subagentens slutrapport | 1 | 17,0 KB | ~4,3k | 6 %* |
| Write (kod/doc, modell-output) | 6 | 26,3 KB | ~6,7k | 9 % |
| Edit (diffar, modell-output) | 7 | 17,0 KB | ~4,4k | 6 % |
| Skill-texter | 3 | 17,0 KB | ~4,3k | 6 % |
| Assistant-prosa | 9 | 5,7 KB | ~1,5k | 2 % |
| Thinking (export-synligt — se § 0.3) | 41 | 3,4 KB | ~0,9k | 1 % |
| User-prompt + async-notiser | 4 | 1,3 KB | ~0,3k | <1 % |

\* Hela Task-blocket i exporten är 68 KB; ~51 KB är subagentens interna arbete i egen kontext och belastar inte orkestratorn.

**Utanför tabellen:** 4 skärmdumar (skarp.png, proto-k-verklig.png, steg2-panel-oppen.png, steg2-print.png) — 1 083 KB base64 i exporten, i kontext som vision-input (väsentligt billigare än base64-volymen antyder, men inte gratis; exakta tal via § 6).

### 3.2 Textvolym per fas

| Fas | Volym | ≈ tokens | Andel | Kommentar |
|---|---|---|---|---|
| A. Uppstart | 85,1 KB | ~21,8k | 28 % | **Tyngsta enskilda lasten.** todo.md-läsningen ensam 20,3 KB (F1) |
| B1. Dok-födelse | 15,9 KB | ~4,1k | 5 % | Lätt trots 13-stegsceremonin |
| B2. PR-svans | 42,3 KB | ~10,8k | 14 % | Inkl. prototypkontext-läsning (EventsList 12,6 KB) |
| C. Bygge steg 1 | 100,1 KB | ~25,6k | 33 % | Inkl. hela Task-blocket i rådatan; orkestrator-justerat ≈ 49 KB / ~12,5k tok |
| D. Verifiering steg 1 | 18,4 KB | ~4,7k | 6 % | Låg volym men hög anropstäthet (20 anrop) — friktion i tid, inte tokens |
| E. Research-intag | 2,1 KB | ~0,5k | 1 % | |
| F. Steg 2-iteration | 38,3 KB | ~9,8k | 13 % | |

### 3.3 Största enskilda poster (text)

| Post | Fas | Volym |
|---|---|---|
| Read `todo.md` (rad 0–120) | A | 20,3 KB |
| Subagentens slutrapport | C/E | 17,0 KB |
| Write `EventsListPrototyp.tsx` | C | 12,9 KB |
| Read `EventsList.tsx` | B2/C | 12,6 KB |
| Read `T86-pocock-v11-integrationen.md` | A | 12,3 KB |
| Bash: route-/substratkontroll | A | 10,5 KB |
| Edit `EventsListPrototyp.tsx` (första filter-editen) | F | 10,3 KB |
| Bash: backlog-korten 18.16–18.19 | A | 9,8 KB |

**Observation:** orienteringsfasen bär 28 % av sessionens textkontext, och den enskilt största textläsningen är todo.md — trots att bara 120 rader lästes. Det beror på att filens topprader är megarader (hela sessionshistoriker i enskilda stycken). Detta kvantifierar F1.

---

## 4. Fynd och förslag

Prioritetsordning efter förväntad effekt. Beslutsnivå angiven per fynd: **[M]** = mekanisk, Code kan genomföra direkt via ordinarie kadens; **[B]** = Marcus-beslut (styrnings-/formfråga, väg mot over-engineering-vakten).

### F1. `todo.md` är 330,8 KB och har blivit historikarkiv **[M + B]**

**Belägg:** 14:42:12 — helfilsläsning avvisad av harnesset (>256 KB-gränsen), bortkastat anrop; 14:42:26 — omläsning rad 0–120 = 20,3 KB, sessionens största textläsning. "Senast uppdaterad"-raden bär komprimerade narrativ för S74–S82 som redan har hemvist i sessionsdok + BUILD-LOG.

**Förslag:** (a) **[B]** flytta historikblocken till arkiv (`tasks/todo-archive.md`) eller utse BUILD-LOG till enda narrativ hemvist; håll todo.md till aktuellt läge + nästa steg, mål < 50 KB. (b) **[M]** tills dess: session-start-skillen föreskriver Read med limit för todo.md så det garanterat misslyckade helfilsanropet försvinner.

**Effekt:** ~15–18 KB kontext + 1 anrop **per session, för varje agent som rör filen**. Största återkommande vinsten i granskningen.

### F2. Verifieringsfasens miljöfelsökning: ~10 anrop, ~3 min trial-and-error **[M]**

**Belägg:** 14:51:53–14:54:43 — dev-server startad i bakgrund → dog (exit 143; port 5173 redan upptagen av befintlig dev-server) → grävning i Playwright-projekt, webServer-konfig, auth-state, credential-env → verify-/debugskript skrivna i 4 varianter (proto-verify.mjs, proto-verify.debug.mjs ×2, proto-filter-verify.debug.mjs) innan lyckad login + rendering.

**Förslag:** (a) checka in parametriserat `scripts/proto-verify.mjs` i repot (argument: route/variant, jämförelse-URL, utdata-namn) i stället för engångsskript per session; (b) dokumentera stabila miljöfakta — dev-servern antas redan köra på 5173 under arbetspass; auth-state-plats; login-flöde; `.env.test`-credentials — i prototype-skillen eller kort `docs/MILJÖ.md` som skillen pekar på. **Lesson-kandidat** (mönstret återkommer i varje prototyp-pass; T86 har fem ytor kvar).

**Effekt:** ~3 min → ~30 s per prototyp-pass; lägre risk; mindre skriptduplicering.

### F3. Autofix före grind **[M]**

**Belägg:** steg 2-iterationen körde typecheck/lint-grinden 4 gånger (14:59:19, 14:59:56, 15:00:08, 15:00:29) varav en runda enbart föll på class-sortering som därefter autofixades.

**Förslag:** kör autofix (`biome check --write` eller motsv.) som standardsteg **före** grindkörning i iterationsloopar.

**Effekt:** ~1 grindrunda (~1 min) per iterationsloop.

### F4. Exakt-kopia-baslinjen via `cp` + riktade Edits i stället för generativ avskrift **[B, lätt]**

**Belägg:** steg 1-baslinjen skrevs som ett enda Write (12,9 KB) — en generativ återgivning av EventsList.tsx som lästs in i kontexten. Pixelverifieringen finns just för att generativ avskrift kan drifta.

**Förslag:** för konvergens-pass på befintlig yta: `cp` källfilen → riktade Edits för substrat-anpassningarna (komponentnamn, variant-param, dataväxling, read-only-huvudet). Exakthet by construction; pixelverifieringen bevisar då endast att anpassningarna inte bröt renderingen. Skrivs in i prototype-skillens konvergens-avsnitt om beslutad.

**Effekt:** ~1 min genereringstid + eliminerad drift-risk i baslinjen. Markerad [B] då den rör en Marcus-kvitterad stående arbetsform (tvåfas-formen, T66/S52).

### F5. Ceremonins fasta kostnad: ~6 min/session **[B]**

**Belägg:** fas A + B1 ≈ 4m 12s aktiv tid (+ B2 parallell). Väl exekverad — ingen enskild slöskostnad utöver F1 — men fast overhead oavsett sessionens storlek: 30 % av ett 19-minuterspass, 10 % av ett 60-minuterspass.

**Förslag (två vägar, ej ömsesidigt uteslutande):** (a) **amortera** — större pass per session där körplanen tillåter; (b) **lätt-variant** — en tredje nivå i session-start-skillen (utöver hub/spoke) för väldefinierade rutinpass där T-kortet redan bär hela scopet, som hoppar över delar av orienteringen. Väg (b) explicit mot over-engineering-vakten; governance-värdet av full orientering är dokumenterat i er historik.

### F6. xhigh-frågan: omätt men mätbar **[B, experiment]**

**Belägg:** 64 tankeblock utspridda över passet; exporten visar inte deras tids- eller tokenkostnad (§ 0.3). Systemets grundlighet är till stor del externaliserad i skills/styrdokument, vilket är argumentet för att en lägre tankebudget kan leverera samma utfall snabbare på procedur-tunga rutinpass.

**Förslag:** kontrollerat experiment — samma korttyp, lägre inställning, jämför väggklocka + utfall + grind-utfall. Kör § 6-mätningen på båda passen som jämförelsegrund.

---

## 5. Bevarandevärden — ändra inte detta

Följande fungerade och ska inte "optimeras bort":

1. **Async-disciplinen:** PR-vakten i bakgrund med exit-fil; merge-verifiering först när huvudspåret ändå var där. Noll blockerad väntetid på CI.
2. **Subagent-parallelliseringen:** research avfyrad 3 min in i bygget, landade exakt till steg 2. Orkestratorn betalade bara slutrapporten (~4,3k tok), inte subagentens arbete.
3. **Disk-verifierad numrering + dubbel-födelse-grinden** — inga omtag, ingen drift.
4. **Harness-disciplinerna efterlevs synligt** (touch-read före overwrite, no-op-guards före skriptomskrivning).
5. **Inga dubbelläsningar** utöver den tvingade todo.md-omläsningen (F1).
6. **Verifieringsambitionen i sig** (login + rendering + pixel + interaktion) — F2 handlar om *friktionen runt* verifieringen, inte om att sänka dess nivå.

---

## 6. Verifieringsuppgifter för Code

Innan åtgärd: verifiera granskningens påståenden mot disk och ersätt proxy-siffrorna med exakta.

1. **Exakt usage per meddelande** ur session-JSONL (OBS: radformatet är internt för Claude Code och versionsinstabilt — engångsanalys, bygg inget bestående på det):

   ```bash
   jq -r 'select(.type=="assistant") | [.timestamp,
     (.message.usage.input_tokens//0),
     (.message.usage.output_tokens//0),
     (.message.usage.cache_creation_input_tokens//0),
     (.message.usage.cache_read_input_tokens//0)] | @tsv' \
     ~/.claude/projects/<projektmapp>/3775e1a2-*.jsonl
   ```

   Aggregatera per fasgränserna i § 2.1 och jämför mot § 3.2. Rapportera särskilt output-tokens (innehåller thinking) per fas — det besvarar F6:s kostnadssida.

2. **Disk-kontroller:** `wc -c tasks/todo.md` (förväntat ~330 KB); bekräfta att inga incheckade proto-verify-skript redan finns (`ls scripts/ | grep -i proto`); bekräfta grindkedjans autofix-läge (F3).

3. **Tidsverifiering:** räkna om fastiderna ur JSONL-tidsstämplarna (granskningens tider är avlästa ur md-exporten).

4. **Vid avvikelse** mellan denna granskning och disk: disk vinner; notera avvikelsen i rapporten tillbaka till Marcus.

Åtgärdsordning om Marcus kvitterar: F1b + F2 + F3 (mekaniska) i nästa lämpliga pass; F1a/F4/F5/F6 bereds som beslutsunderlag i er ordinarie form.

---

## Bilaga A — komplett anropssekvens (huvudspåret, lokal tid)

| Tid | Anrop |
|---|---|
| 14:42:03 | Skill `marcus-system:session-start` |
| 14:42:11 | Bash: list repo, git pull, HEAD + status |
| 14:42:12 | Read `todo.md` — **avvisad** (>256 KB) |
| 14:42:12 | Read `T86-pocock-v11-integrationen.md` |
| 14:42:19 | Bash: list tasks/sessions, filstorlekar |
| 14:42:26 | Read `2026-07-24-session-82.md` |
| 14:42:26 | Read `todo.md` (rad 0–120) |
| 14:42:28 | Bash: session-82 lifecycle + senaste lessons |
| 14:43:07 | Bash: threads, senaste ADR, BUILD-LOG-struktur |
| 14:43:19 | Bash: backlog-kort 17.7 + 18.15 |
| 14:43:26 | Bash: backlog-kort 18.16–18.19 |
| 14:44:07 | Bash: substrat-routes + byggplan-fasstatus |
| 14:44:15 | Bash: prototyp-route-struktur |
| 14:44:46 | Read `create-session-doc.md` |
| 14:45:01 | Bash: datum, dubbel-födelse-check, ADR-räkning, repo-state |
| 14:45:02 | Read `2026-07-24-session-81.md` |
| 14:45:51 | Write `2026-07-24-session-83.md` |
| 14:45:56 | Bash: docs-grindar + markdownlint på nya filen |
| 14:46:18 | Bash: branch, commit, push (sessionsdok) |
| 14:46:45 | Bash [async #bv9gt367w]: PR 149-vakt i bakgrund |
| 14:46:46 | Skill `marcus-system:prototype` |
| 14:47:15 | Read `UI.md` |
| 14:47:16 | Bash: research-dok + ADR-074 beslutskropp |
| 14:47:46 | Read `index.tsx` |
| 14:47:49 | Bash: events-komponenter + storlekar |
| 14:47:49 | Async: PR-vakten klar (exit 0) |
| 14:47:54 | Bash: verifiera PR 149-checks + merge-status |
| 14:48:13 | Read `EventsList.tsx` |
| 14:48:15 | Bash: tillbaka till main, pull, radera lokal branch |
| 14:48:17 | Skill `marcus-system:research` |
| 14:49:04 | Task: research filtermönster för listvyer (subagent) |
| 14:49:05 | Read `PrototypeSwitcher.tsx` |
| 14:49:35 | Bash: Event-domänmodellen |
| 14:49:35 | Read `EventCard.tsx` |
| 14:50:11 | Bash: status-enum + query-nycklar |
| 14:51:28 | Write `EventsListPrototyp.tsx` (baslinjen, exakt kopia) |
| 14:51:33 | Edit `index.tsx` (route) |
| 14:51:46 | Bash: typecheck + lint (prototypfiler) |
| 14:51:53 | Bash [async #b9dvjx739]: starta Vite dev-server |
| 14:52:11 | Bash: Playwright auth-state-setup |
| 14:52:21 | Write `proto-verify.mjs` |
| 14:52:25 | Bash: render-verifiering proto vs skarp |
| 14:52:34 | Bash: omkörning från repo (module resolution) |
| 14:52:50 | Bash: kollar om 5173 redan serverar |
| 14:52:57 | Bash: origins i sparad auth-state |
| 14:53:07 | Async: dev-servern död (exit 143 — porten upptagen) |
| 14:53:13 | Bash: Playwright-projektnamn |
| 14:53:23 | Bash: webServer-konfigblock |
| 14:53:31 | Bash: auth-setup + credential-env |
| 14:53:54 | Write `proto-verify.debug.mjs` |
| 14:53:57 | Bash: touch-read före overwrite |
| 14:54:07 | Write `proto-verify.debug.mjs` (v2) |
| 14:54:11 | Bash: login + verifiera rendering på 5173 |
| 14:54:43 | Read `skarp.png` + Read `proto-k-verklig.png` (pixeljämförelse) |
| 14:55:20 | Async: research-subagenten klar |
| 14:56:51 | Bash: chip-mönster, gamla doc-länkar, filterikoner |
| 14:57:07 | Bash: Deltagare-filterchippens styling |
| 14:57:13 | Bash: semantiska färgtokens |
| 14:57:24 | Bash: app-tabbarens element (print-döljning) |
| 14:57:45 | Edit `EventsListPrototyp.tsx` (filter, del 1) |
| 14:58:57 | Edit `EventsListPrototyp.tsx` (filter, del 2) |
| 14:59:18 | Edit `index.tsx` |
| 14:59:19 | Bash: typecheck + lint |
| 14:59:28 | Read `EventsListPrototyp.tsx` (positionering inför edit) |
| 14:59:52 | Edit `EventsListPrototyp.tsx` |
| 14:59:56 | Bash: typecheck + lint (omkörning) |
| 15:00:08 | Bash: autofix class-sortering + omkörning |
| 15:00:23 | Edit `EventsListPrototyp.tsx` |
| 15:00:29 | Bash: båda grindarna gröna |
| 15:00:39 | Bash: no-op-guard före skriptomskrivning |
| 15:00:50 | Write `proto-filter-verify.debug.mjs` |
| 15:00:55 | Bash: filter-interaktionsverifiering |
| 15:01:08 | Edit `proto-filter-verify.debug.mjs` |
| 15:01:09 | Bash: omkörning interaktionsverifiering |
| 15:01:19 | Read `steg2-panel-oppen.png` + Read `steg2-print.png` |

Slut på exportfönstret (15:01:19). Assistentens överlämning: "Steg 2-utkastet är byggt, verifierat och …"

---

## Verifikation och beslutsläge (Code, 2026-07-24)

§ 6-uppgifterna utförda samma dag mot `3775e1a2`-JSONL:en + disk, read-only
under pågående parallell-sessioner. Scope-precisering från Marcus inarbetad:
utdraget (startprompt → första stopp) ÄR analysobjektet; sessionen pågick vid
mätningen, så transkriptets sista tidsstämpel säger inget om sessionslängd och
inga sessions-totaler dras ur den.

### Exakt usage per fas (§ 6.1 — ersätter § 3:s proxy)

Ur JSONL-usage, deduplicerat per message-id, bucketat på § 2.1:s fasgränser
(UTC = lokal −2 h). "Ny kontext" = cache-creation-tokens (nytt material in i
kontexten); "output" inkluderar thinking.

| Fas | API-turer | Output-tokens | Ny kontext | Kontext vid fasslut |
|---|---|---|---|---|
| A Uppstart | 9 | 8 584 | 82 589 | ~103k |
| B1 Dok-födelse | 9 | 7 834 | 13 873 | ~117k |
| C Bygge steg 1 | 14 | 20 291 | 50 916 | ~168k |
| D Verifiering steg 1 | 19 | 9 961 | 18 956 | ~187k |
| E Research-intag | 1 | 5 764 | 3 086 | ~190k |
| F Steg 2-iteration | 23 | 16 483 | 29 926 | ~220k |
| **Fönstret totalt** | **75** | **68 917** | **199 346** | |

Nyckeltal ur mätningen:

- **F6:s kostnadssida besvarad:** ~80 % av fönstrets output-tokens är thinking
  (synligt output ≈ 14k: prosa + Writes + Edits av 68 917 totalt); 72
  thinking-turer i fönstret (§ 0.3:s "64 tankeblock" var export-räkning).
- Fas A:s 82,6k ny kontext bär ~33k fast harness-bas (systemprompt + verktyg +
  CLAUDE.md-lager) som inte är adresserbar orientering; räknas basen bort
  håller § 3.2:s fasvikter väl. Proxyn underskattar absoluta tal ~2,5×
  (deklarerat i § 0), riktning och proportioner höll.
- Subagentens slutrapport kostade orkestratorn ~3k tokens (uppskattningen
  4,3k); subagentens interna arbete ligger i egen transkriptfil, inte i
  huvud-JSONL:en.
- Anropsräkningen: **98 tool_use-anrop** i fönstret (Bash 57 · Read 16 ·
  Edit 15 · Write 6 · Skill 3 · Agent 1) — § 2.2:s 77 räknar export-rader,
  som buntar parallella anrop. "3 async-notiser" var 1 task-notification +
  skill-/bildtext-poster som exporten klassar som user-turer.

### Disk-kontroller (§ 6.2) — samtliga belägg bekräftade

- `tasks/todo.md` = 338 756 B = 330,8 KB exakt; megaraden är rad 7 ("Senast
  uppdaterad", 13 383 tecken i en rad, S74–S83-narrativ); 1 avvisad
  helfilsläsning i JSONL:en. session-start-skillen föreskriver oguardad
  läsning ("Läs `tasks/todo.md`", rad 31) — det avvisade anropet återkommer
  varje session tills skill eller fil ändras (F1b).
- Inget incheckat proto-verify-skript i `scripts/`. Under 2026-07-24
  ackumulerade S83 **fem** `proto-*.debug.mjs`-varianter i repo-roten
  (kastbara per throwaway-kontraktet — mönstret, inte filerna, är fyndet):
  F2-klassen återföll live medan granskningen låg oläst.
- Grindkedjan saknar autofix-steg (`lint` = `biome check .` utan `--write`);
  `useSortedClasses` aktiv (`biome.json:24`). F-fasens faktiska sekvens
  14:59:19 → 15:00:29 bekräftar F3: typecheck+lint ×2 → lint-check →
  `--write` ×2 → grön slutcheck.
- F2-nyans granskningen saknade: hård vägran vid upptagen 5173
  (`reuseExistingServer: false`) är MEDVETEN design, öppet bokförd i
  `playwright.config.ts` + task-5-kortet — miljöfaktan finns delvis
  dokumenterad; gapet är att prototyp-flödet inte pekar på den.

### Beslutsläge

Alla sex fynd står efter verifiering; F5:s procentresonemang läses mot
sessionens flerpass-form (amortering = väg a, redan praxis). Åtgärdspaket,
[M]/[B]-klassning, exekveringsfönster och det öppna avstyrkandet av F5b:
se tråd-kortet [T89](../../tasks/threads/T89-s83-granskningspaketet.md).
Marcus kvitterade paketriktningen 2026-07-24.
