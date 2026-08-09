---
owner: marcus803
updated: 2026-08-09
review_by: 2027-02-09
status: draft
---

# K1-underlag: no-mistakes-anatomin — de fyra deltanas dockning i vårt bygg-agent-kontrakt

> **Proveniens:** delegerat research-pass (S101, 2026-08-09), read-only
> mot `github.com/kunchenguid/no-mistakes` (7 485 ★ vid läsning, MIT,
> Go) via `gh api` med verbatim filinnehåll (base64-avkodad
> contents-endpoint — ett första WebFetch-försök gav omskriven
> sammanfattning och FÖRKASTADES; allt nedan är hämtat ur faktiska
> filer). Beställning och kandidat-kontext:
> [`l8-workflow-kartlaggningen-2026-08-09.md`](l8-workflow-kartlaggningen-2026-08-09.md)
> § Fas D K1. "Repot säger" = citat med källa; tolkning är markerad.

## 1. Pipelinen exakt: nio steg, fast ordning

`intent → rebase → review → test → document → lint → push → pr → ci`
(`docs/.../reference/pipeline-steps.md`). Konfigurerbart: agent-val,
kommandon, evidence-lagring, auto-fix-gränser per steg (review default
**0** — allt blockerande kräver människa), ignore-mönster. INTE
konfigurerbart: stegordning, permanent steg-skip. Test-steget är
uttryckligen riktad validering, *"never a repository-wide
regression-suite substitute"*.

## 2. Intent: explicit slår inferens — och vi har redan bättre källa

Två vägar: **explicit** intent (flagga/push-option) = auktoritativa
acceptanskriterier, transkript-inferens hoppas över · **inferrerad**
intent ur agent-transkript (sex harness-läsare; för Claude Code läses
`~/.claude/projects/*.jsonl`, endast user/assistant-text, tool-output
och thinking exkluderas; hemligheter redigeras; rå text lagras aldrig)
= *"untrusted, low-confidence hint"*.

**Tolkning:** vårt backlog-substrat (PRD-kort + acceptanskriterier) ÄR
en strukturerad explicit-intent-källa — strikt starkare än
transkript-mining, som finns för användare utan sådan. Bygg inte
mining; formalisera kortet-som-intent i stället.

## 3. Adversarial review: färsk kontext, incident-grundad

- Varje granskningsrunda (initial + varje omgranskning) körs som
  *"fresh, session-free invocation"*; fixaren får behålla session
  (*"den intygar ingenting"*). Motivet är en VERKLIG skeppad defekt,
  citerad ur kodkommentaren (`internal/pipeline/steps/review.go`):
  *"one fix round wrote both wrong code and the test blessing it, and
  the resumed reviewer session passed them"* — granskaren som
  återanvände sin session godkände sin egen förskrivning.
- Omgranskning reframar fix-rundans kod som *"pipeline-authored code
  to review under the same adversarial standard ... prior findings,
  fix summaries, and same-round tests treated as claims rather than
  evidence"*.
- Strukturerad JSON-output: `severity` (error/warning/info) · `action`
  (auto-fix/ask-user/no-op) · `review_scope` · `risk_level` +
  `risk_rationale`. Gränsdragningen: auto-fix = objektivt,
  icke-produktpåverkande; ask-user = allt som ifrågasätter författarens
  avsiktliga val — *"When in doubt, default to ask-user"*; saknad
  klassning failar closed till ask-user.
- Path-scopade granskningsregler (`review.path_instructions`) läses
  ENDAST ur trusted default-branch-kopian — en pushad gren kan inte
  manipulera sin egen granskning.
- **KRITISK VARNINGSLAMPA (issue #683, öppen):** verklig körning gjorde
  **27 fulla omgranskningsrundor på 8,2 timmar utan konvergens** (74
  distinkta finding-ID på 80 findings). Rotorsak: full-diff-omgranskning
  varje runda + INGEN konvergensregel. Bygger vi motsvarande måste
  rundtak + eskalering-vid-tak in FRÅN START — uppströms saknar det än.

## 4. Bevis-artefakterna

Samlas i temp-katalog UTANFÖR worktreen (kan aldrig hamna i validerad
gren) → opt-in-publicering till **orphan-branch** med markörfil
(vägrar skriva till gren utan markör) → **commit-pinnade** länkar i
PR-kroppen (*"keeps resolving to the exact bytes that run published"*);
läsbar text embeddas inline, binärt refereras.
**Tolkning:** kopiera commit-pinnad länkning + PR-body-embedding;
orphan-branch-mekaniken är sannolikt overkill för vårt GitHub-only-läge.

## 5. Risk-bedömningen: PR-sektion idag, auto-eskalering bara ett issue

`risk_level` (low/medium/high med citerade prompt-definitioner; high =
*"should not be merged without explicit human approval"*) +
obligatorisk enmenings `risk_rationale` — genereras av SAMMA
review-anrop, landar som deterministisk `## Risk Assessment`-sektion i
PR-kroppen. **Viktig nyans:** "risk styr agentens eget granskningsdjup
automatiskt" (adaptive review, issue #468) är ETT FÖRSLAG, inte skarpt
— idag styr risknivån bara människans läsinsats.

## 6. Babysitting ≈ vårt heartbeat-svep

Legacy-alias bekräftar: `auto_fix.babysit` = `auto_fix.ci`. Eskalerande
poll (30 s → 60 s → 120 s) · deterministisk rerun av
provider-cancellerade checkar FÖRE agent-eskalering · rebase +
`--force-with-lease` med SHA-ankare · head-change-skydd (rerunnar
aldrig blint om fjärr-HEAD flyttat). **Tolkning:** funktionellt vårt
`heartbeat-svep.sh` + merge-kö, som lokal daemon i stället för
GitHub-native kö + externt svep.

## 7. Harness-kopplingen

Adapter-interface över sju runners (subprocess- eller server-protokoll);
skarp vakt mot tyst degradering (*"never degrades silently ... fails
immediately with setup guidance"*); rolluppdelning där driv-agenten
aldrig är validerings-agenten (`nested_gate_context`-fel);
skill-distribution per användare, inte per repo (jfr ADR-035).

## 8. Adopt vs bygg — rekommendation: BYGG deltana, adoptera inte

| No-mistakes-mekanism | Vår motsvarighet | Bedömning |
|---|---|---|
| Daemon äger push→PR→CI-livscykeln | Merge-kö (ADR-076) + heartbeat-svep | **Redundant** — två system skulle tävla om samma gren |
| Disponibel worktree per validering | bygg-agent i egen worktree | Redan täckt |
| Intent-mining ur transkript | Backlog-kort + acceptanskriterier | **Vi har bättre källa** |
| Obligatorisk färsk-kontext-review | `/code-review` finns men är frivillig; ingen garanterad sessionsseparation | **Störst lucka av de fyra** |
| Bevis + commit-pinnad PR-länkning | Ad hoc screenshots, ej systematiserat | Verklig lucka, medel |
| Risk-sektion i PR-kroppen | Transparens-rapport i chatten, inte i PR:en | Lucka — lågt arbete, hög nytta |

Motiven (tolkning, källbelagda i rapporten): infrastruktur-överlappet är
negativt, inte additivt · de fyra deltana är prompt-design + lätt VVS
som dockar i bygg-agent-kontraktet + PR-body-mallen (review-subagent
spawnas av orkestreraren EFTER bygg-agentens push, FÖRE armering;
blockerande findings pausar armeringen till Marcus via
STOPPA-OCH-FRÅGA) · adoption skulle införa Go-binär + curl-install +
lokal SQLite-daemon med egna öppna strukturella buggar (issue #694
"Daemon ci step wedges every run", öppen) — mot verktygsfilosofin och
med ärvd riskyta.

## Grillnings-frågorna detta underlag öppnar

1. Grindens placering och ägare: review-subagent efter push, före
   armering — spawnad av orkestreraren? Obligatorisk för vilka
   ändringsklasser (progressiv härdning, AD.3/P11)?
2. Rundtak och konvergensregel (issue #683-lärdomen): hur många rundor,
   och vad exakt händer vid tak?
3. Risk-sektionens form i PR-kroppen — och ska risknivån FORMELLT styra
   Marcus granskningsdjup, eller bara informera?
4. Bevisformer per ändringsklass (UI → screenshot; logik → körlogg;
   docs → ingen?) och commit-pinnad länkning.
5. Kortet-som-intent: hur överlämnas acceptanskriterierna maskinläsbart
   till review-agenten?
6. Kvitterar Marcus bygg-vägen (inte adoption)?
